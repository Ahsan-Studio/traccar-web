import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";
import { CustomInput, CustomButton } from "../../common/components/custom";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: 0,
    height: "100%",
    overflow: "auto",
  },
  body: {
    padding: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#2b82d4",
    paddingBottom: '5px',
    marginBottom: '10px',
    borderBottom: `1px solid #f5f5f5`,
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '3px',
  },
  label: {
    fontSize: 11,
    fontWeight: 400,
    color: '#444444',
    width: '300px',
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    width: '308px',
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  apiKeyWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  copyButton: {
    padding: '4px',
    minWidth: 'auto',
  },
}));

const MyAccountTab = ({ onSave }) => {
  const { classes } = useStyles();
  const user = useSelector((state) => state.session.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Contact Information
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [postCode, setPostCode] = useState("");
  const [city, setCity] = useState("");
  const [countryState, setCountryState] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");

  // Change Password
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // Usage (read-only)
  const [emailsDaily, setEmailsDaily] = useState("1/10000");
  const [smsDaily, setSmsDaily] = useState("0/10000");
  const [apiCallsDaily, setApiCallsDaily] = useState("0/10000");

  // API Token
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        
        // Parse contact from attributes.contact JSON string
        let contact = {};
        try {
          if (userData.attributes?.contact) {
            contact = JSON.parse(userData.attributes.contact);
          }
        } catch (e) {
          console.error('Error parsing contact JSON:', e);
        }
        
        setName(contact.name || userData.name || "");
        setCompany(contact.company || "");
        setAddress(contact.address || "");
        setPostCode(contact.post_code || "");
        setCity(contact.city || "");
        setCountryState(contact.country || "");
        setPhone1(contact.phone1 || userData.phone || "");
        setPhone2(contact.phone2 || "");
        setEmail(contact.email || userData.email || "");
        
        setEmailsDaily(userData.attributes?.emailsUsage || "0/10000");
        setSmsDaily(userData.attributes?.smsUsage || "0/10000");
        setApiCallsDaily(userData.attributes?.apiCallsUsage || "0/10000");
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError('User not found');
      return;
    }

    // Validate password if changed
    if (newPassword || repeatPassword) {
      if (!newPassword) {
        setError('Please enter a new password');
        return;
      }
      if (newPassword !== repeatPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    setError('');
    setSuccessMessage('');

    try {
      const currentResponse = await fetch(`/api/users/${user.id}`);
      if (!currentResponse.ok) {
        throw new Error('Failed to fetch current user data');
      }
      const currentUser = await currentResponse.json();

      // Build contact JSON object
      const contactData = {
        name: name,
        company: company,
        address: address,
        post_code: postCode,
        city: city,
        country: countryState,
        phone1: phone1,
        phone2: phone2,
        email: email,
      };

      const updateData = {
        ...currentUser,
        name: name,
        email: email,
        phone: phone1,
        attributes: {
          ...currentUser.attributes,
          contact: JSON.stringify(contactData),
        },
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccessMessage('Account information saved successfully');
        setNewPassword('');
        setRepeatPassword('');
        if (onSave) {
          onSave();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save account information');
      }
    } catch (err) {
      console.error('Error saving account information:', err);
      setError(err.message || 'Failed to save account information');
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiToken);
    setSuccessMessage('API token copied to clipboard');
  };

  const generateApiToken = async () => {
    setError('');
    setSuccessMessage('');

    try {
      // Set expiration to 30 days from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Format as application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('expiration', expirationDate.toISOString());
      
      const response = await fetch('/api/session/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const token = await response.text();
        console.log('Generated API token:', token);
        setApiToken(token || '');
        setSuccessMessage('API token generated successfully (valid for 30 days)');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate API token');
      }
    } catch (err) {
      console.error('Error generating API token:', err);
      setError(err.message || 'Failed to generate API token');
    }
  };

  useEffect(() => {
    window.myAccountTabSave = handleSave;
    
    return () => {
      delete window.myAccountTabSave;
    };
  }, [
    name, company, address, postCode, city, countryState,
    phone1, phone2, email, newPassword, repeatPassword
  ]);

  if (loading) {
    return (
      <Box className={classes.loading}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.body}>
        {/* Contact Information Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Contact information</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Name, surname</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={name}
                onChange={(value) => setName(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Company</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={company}
                onChange={(value) => setCompany(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Address</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={address}
                onChange={(value) => setAddress(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Post code</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={postCode}
                onChange={(value) => setPostCode(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>City</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={city}
                onChange={(value) => setCity(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>County/State</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={countryState}
                onChange={(value) => setCountryState(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Phone number 1</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={phone1}
                onChange={(value) => setPhone1(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Phone number 2</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={phone2}
                onChange={(value) => setPhone2(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>E-mail</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="email"
                value={email}
                onChange={(value) => setEmail(value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </Box>

        {/* Change Password Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Change password</Typography>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>New password</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="password"
                value={newPassword}
                onChange={(value) => setNewPassword(value)}
                size="small"
                fullWidth
                autoComplete="new-password"
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Repeat new password</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="password"
                value={repeatPassword}
                onChange={(value) => setRepeatPassword(value)}
                size="small"
                fullWidth
                autoComplete="new-password"
              />
            </Box>
          </Box>
        </Box>

        {/* Usage Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Usage</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Number of e-mails (daily)</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={emailsDaily}
                size="small"
                fullWidth
                disabled
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Number of SMS (daily)</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={smsDaily}
                size="small"
                fullWidth
                disabled
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Number of API calls (daily)</Typography>
            <Box className={classes.inputWrapper} style={{ maxWidth: '300px' }}>
              <CustomInput
                type="text"
                value={apiCallsDaily}
                size="small"
                fullWidth
                disabled
              />
            </Box>
          </Box>
        </Box>

        {/* API Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>API</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>API token</Typography>
            <Box className={classes.apiKeyWrapper} style={{ flex: 1, maxWidth: '500px' }}>
              <CustomInput
                type="text"
                value={apiToken}
                size="small"
                fullWidth
                disabled
              />
              <IconButton 
                size="small" 
                onClick={copyApiKey}
                disabled={!apiToken}
                className={classes.copyButton}
              >
                <ContentCopyIcon style={{ fontSize: 16 }} />
              </IconButton>
              <CustomButton
                variant="primary"
                onClick={generateApiToken}
                icon={<RefreshIcon style={{ fontSize: 14 }} />}
              >
                Generate
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyAccountTab;
