import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";
import {
  CustomSelect,
  CustomCheckbox,
  CustomButton,
  CustomInput,
} from "../../common/components/custom";

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
    width: '200px',
    flexShrink: 0,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    minWidth: '200px',
    height: '32px',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
    },
  },
  linkHeader: {
    color: '#2b82d4',
    fontSize: 12,
    fontWeight: 600,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  helpText: {
    fontSize: 11,
    color: '#666',
    marginBottom: theme.spacing(1.5),
    lineHeight: 1.5,
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  queueInput: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '80px',
    height: '32px',
    backgroundColor: '#f5f5f5',
    color: '#999',
    textAlign: 'center',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
}));

const SMSTab = ({ onSave }) => {
  const { classes } = useStyles();
  const user = useSelector((state) => state.session.user);
  
  const [loading, setLoading] = useState(true);
  const [smsConfig, setSmsConfig] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const queue = 0;

  // Fetch SMS configuration on component mount
  useEffect(() => {
    fetchSMSConfig();
  }, []);

  const fetchSMSConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-sms-configs');
      if (response.ok) {
        const configs = await response.json();
        if (configs && configs.length > 0) {
          const config = configs[0];
          setSmsConfig(config);
          setEnabled(config.enabled || false);
          // Assuming identifier is stored in one of the fields
          setIdentifier(config.httpUser || '');
        }
      }
    } catch (err) {
      console.error('Error fetching SMS config:', err);
      setError('Failed to load SMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('SMS Tab handleSave called');
    console.log('Current state:', { enabled, identifier, smsConfig });
    
    setError('');
    setSuccessMessage('');

    try {
      const data = {
        userId: user?.id,
        enabled: enabled,
        httpUser: identifier,
        httpUrl: '',
        httpAuthorizationHeader: '',
        httpAuthorization: '',
        httpTemplate: '',
        awsAccess: '',
        awsRegion: '',
      };

      let response;
      if (smsConfig && smsConfig.id) {
        // Update existing configuration
        response = await fetch(`/api/user-sms-configs/${smsConfig.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, id: smsConfig.id }),
        });
      } else {
        // Create new configuration
        response = await fetch('/api/user-sms-configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        const updatedConfig = await response.json();
        setSmsConfig(updatedConfig);
        setSuccessMessage('SMS configuration saved successfully');
        if (onSave) {
          onSave();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save SMS configuration');
      }
    } catch (err) {
      console.error('Error saving SMS config:', err);
      setError(err.message || 'Failed to save SMS configuration');
    }
  };

  // Expose handleSave to parent component via window object
  useEffect(() => {
    window.smsTabSave = handleSave;
    
    return () => {
      delete window.smsTabSave;
    };
  }, [enabled, identifier, smsConfig, user]);

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
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>SMS Gateway</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Enable SMS Gateway</Typography>
            <Box className={classes.checkboxContainer}>
              <CustomCheckbox
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>SMS Gateway type</Typography>
            <CustomSelect
              value="HTTP"
              onChange={() => {}}
              options={[{ value: "HTTP", label: "HTTP" }]}
            />
          </Box>
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.linkHeader}>HTTP</Typography>
          <Typography className={classes.helpText}>
            HTTP gateway is used to send SMS through HTTP API. Below SMS Gateway identifier should be configured in your HTTP endpoint settings.
          </Typography>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>SMS Gateway identifier</Typography>
            <CustomInput
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              placeholder="Enter identifier"
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Total SMS in queue to send</Typography>
            <Box className={classes.queueRow}>
              <input 
                type="text"
                className={classes.queueInput}
                value={queue} 
                disabled
                readOnly
              />
              <CustomButton 
                variant="outlined" 
                disabled
              >
                Clear
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

export default SMSTab;
