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
  CustomCheckbox,
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
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#2b82d4",
    paddingBottom: "6px",
    marginBottom: "12px",
    borderBottom: "1px solid #e0e0e0",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
  },
  label: {
    fontSize: 12,
    fontWeight: 400,
    color: "#444444",
    width: "220px",
    flexShrink: 0,
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
  },
  helpText: {
    fontSize: 11,
    color: "#666",
    marginBottom: "12px",
    lineHeight: 1.5,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(4),
  },
}));

const SMSTab = ({ onSave }) => {
  const { classes } = useStyles();
  const user = useSelector((state) => state.session.user);

  const [loading, setLoading] = useState(true);
  const [smsConfig, setSmsConfig] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user-sms-configs");
      if (response.ok) {
        const configs = await response.json();
        if (configs && configs.length > 0) {
          const config = configs[0];
          setSmsConfig(config);
          setEnabled(config.enabled || false);
          setGatewayUrl(config.httpUrl || "");
        }
      }
    } catch (err) {
      console.error("Error fetching WhatsApp config:", err);
      setError("Failed to load WhatsApp configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");

    try {
      const data = {
        userId: user?.id,
        enabled,
        httpUrl: gatewayUrl,
        httpAuthorizationHeader: "",
        httpAuthorization: "",
        httpUser: "",
        httpTemplate: "",
        awsAccess: "",
        awsRegion: "",
      };

      let response;
      if (smsConfig?.id) {
        response = await fetch(`/api/user-sms-configs/${smsConfig.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, id: smsConfig.id }),
        });
      } else {
        response = await fetch("/api/user-sms-configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        const updatedConfig = await response.json();
        setSmsConfig(updatedConfig);
        setSuccessMessage("WhatsApp configuration saved successfully");
        onSave?.();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save");
      }
    } catch (err) {
      console.error("Error saving WhatsApp config:", err);
      setError(err.message || "Failed to save WhatsApp configuration");
    }
  };

  useEffect(() => {
    window.smsTabSave = handleSave;
    return () => { delete window.smsTabSave; };
  }, [enabled, gatewayUrl, smsConfig, user]);

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
        {/* Section 1: WhatsApp Gateway */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>WhatsApp Gateway</Typography>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Enable WhatsApp Gateway</Typography>
            <Box className={classes.checkboxContainer}>
              <CustomCheckbox
                checked={enabled}
                onChange={(val) => setEnabled(val)}
              />
            </Box>
          </Box>
        </Box>

        {/* Section 2: HTTP Gateway (fixed to HTTP) */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>HTTP Gateway</Typography>
          <Typography className={classes.helpText}>
            WhatsApp Gateway, which can send messages via HTTP GET should be used.
          </Typography>
          <Typography className={classes.helpText}>
            WhatsApp Gateway URL example: http://WHATSAPP_GATEWAY/sendsms.php?username=USER&amp;password=PASSWORD&amp;number=%NUMBER%&amp;message=%MESSAGE%
          </Typography>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>WhatsApp Gateway URL</Typography>
            <textarea
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              placeholder="ex. http://full_address_here"
              style={{
                flex: 1,
                height: '75px',
                fontSize: '12px',
                fontFamily: 'inherit',
                border: '1px solid #ccc',
                padding: '6px 8px',
                resize: 'vertical',
                borderRadius: '2px',
              }}
              maxLength={2048}
            />
          </Box>

          <Box className={classes.section} style={{ marginTop: 16 }}>
            <Typography className={classes.sectionTitle}>Variables</Typography>
            <Typography className={classes.helpText}>%NUMBER% - phone number, where WhatsApp message will be sent</Typography>
            <Typography className={classes.helpText}>%MESSAGE% - text of WhatsApp message</Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SMSTab;
