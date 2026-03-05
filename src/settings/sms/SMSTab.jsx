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
  queueRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  queueValue: {
    fontSize: 12,
    color: "#444",
    minWidth: "40px",
  },
  identifierInput: {
    "& input": {
      backgroundColor: "#f5f5f5",
      color: "#666",
    },
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(4),
  },
}));

const GATEWAY_TYPE_OPTIONS = [
  { value: "app", label: "Mobile application" },
  { value: "http", label: "HTTP" },
];

const SMSTab = ({ onSave }) => {
  const { classes } = useStyles();
  const user = useSelector((state) => state.session.user);

  const [loading, setLoading] = useState(true);
  const [smsConfig, setSmsConfig] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [gatewayType, setGatewayType] = useState("app");
  const [identifier, setIdentifier] = useState("");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [queue, setQueue] = useState(0);
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
          setGatewayType(config.gatewayType || "app");
          setIdentifier(config.httpUser || "");
          setGatewayUrl(config.httpUrl || "");
          setQueue(config.queueCount || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching WhatsApp config:", err);
      setError("Failed to load WhatsApp configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async () => {
    try {
      if (smsConfig?.id) {
        await fetch(`/api/user-sms-configs/${smsConfig.id}/clear-queue`, { method: "POST" });
        setQueue(0);
      }
    } catch (err) {
      console.error("Error clearing queue:", err);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");

    try {
      const data = {
        userId: user?.id,
        enabled,
        gatewayType,
        httpUser: identifier,
        httpUrl: gatewayUrl,
        httpAuthorizationHeader: "",
        httpAuthorization: "",
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
  }, [enabled, gatewayType, identifier, gatewayUrl, smsConfig, user]);

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

          <Box className={classes.formRow}>
            <Typography className={classes.label}>WhatsApp Gateway type</Typography>
            <CustomSelect
              value={gatewayType}
              onChange={(e) => setGatewayType(e.target.value)}
              options={GATEWAY_TYPE_OPTIONS}
            />
          </Box>
        </Box>

        {/* Section 2: Mobile application (shown when type = app) */}
        {gatewayType === "app" && (
          <Box className={classes.section}>
            <Typography className={classes.sectionTitle}>Mobile application</Typography>
            <Typography className={classes.helpText}>
              Mobile application should be used which allows to use mobile device as WhatsApp Gateway. Below WhatsApp Gateway identifier should be entered in mobile application settings.
            </Typography>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>WhatsApp Gateway identifier</Typography>
              <CustomInput
                value={identifier}
                disabled
                className={classes.identifierInput}
              />
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Total WhatsApp in queue to send</Typography>
              <Box className={classes.queueRow}>
                <Typography className={classes.queueValue}>{queue}</Typography>
                <CustomButton variant="outlined" onClick={handleClearQueue}>
                  Clear
                </CustomButton>
              </Box>
            </Box>
          </Box>
        )}

        {/* Section 3: HTTP (shown when type = http) */}
        {gatewayType === "http" && (
          <Box className={classes.section}>
            <Typography className={classes.sectionTitle}>HTTP</Typography>
            <Typography className={classes.helpText}>
              HTTP gateway is used to send WhatsApp messages through HTTP API. Configure the URL below with the appropriate parameters.
            </Typography>
            <Typography className={classes.helpText}>
              Example: https://api.example.com/send?phone=%NUMBER%&amp;text=%TEXT%
            </Typography>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>WhatsApp Gateway URL</Typography>
              <CustomInput
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                multiline
                rows={3}
                placeholder="Example: https://api.example.com/send?phone=%NUMBER%&text=%TEXT%"
                style={{ flex: 1 }}
              />
            </Box>

            <Box className={classes.section} style={{ marginTop: 16 }}>
              <Typography className={classes.sectionTitle}>Variables</Typography>
              <Typography className={classes.helpText}>%NUMBER% - Phone number</Typography>
              <Typography className={classes.helpText}>%TEXT% - Message text</Typography>
            </Box>
          </Box>
        )}
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
