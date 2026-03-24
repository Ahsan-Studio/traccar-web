import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  CustomInput,
  CustomButton,
  CustomCheckbox,
  CustomMultiSelect,
} from "../../common/components/custom";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "750px",
      maxWidth: "700px",
      maxHeight: "600px",
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    color: "white",
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  dialogContent: {
    padding: theme.spacing(2),
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(0.6),
  },
  label: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#444",
    width: "140px",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  checkboxLabel: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#444",
    marginLeft: "8px",
    flex: 1,
  },
  twoColumnsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(3),
  },
  columnBox: {
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#2b82d4",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  urlRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  copyButton: {
    padding: "4px",
    minWidth: "auto",
  },
}));

const EditSubAccountDialog = ({ open, onClose, subAccount }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    disabled: false,
    name: "",
    email: "",
    password: "",
    phone: "",
    sendCredentials: true,
    readonly: false,
    administrator: false,
    deviceLimit: 0,
    userLimit: 0,
    deviceReadonly: false,
    limitCommands: false,
    fixedEmail: false,
    expirationTime: null,
    objects: [],
    markers: [],
    routes: [],
    zones: [],
    attributes: {},
  });

  // State for dropdown options
  const [markerOptions, setMarkerOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [objectOptions, setObjectOptions] = useState([]);

  const [permissions, setPermissions] = useState({
    dashboard: false,
    history: false,
    reports: false,
    tasks: false,
    rfidIButton: false,
    dtc: false,
    maintenance: false,
    expenses: false,
    objectControl: false,
    imageGallery: false,
    chat: false,
  });

  const [accessViaUrl, setAccessViaUrl] = useState({
    active: false,
    token: "",
    desktop: "",
    mobile: "",
  });

  // Build URL from token
  const buildUrls = (token) => {
    if (!token) return { desktop: "", mobile: "" };
    const baseUrl = window.location.origin;
    return {
      desktop: `${baseUrl}/?au=${token}`,
      mobile: `${baseUrl}/?au=${token}&m=true`,
    };
  };

  // Fetch markers, routes, zones, and objects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [markersRes, routesRes, zonesRes, devicesRes] = await Promise.all([
          fetch("/api/markers"),
          fetch("/api/routes"),
          fetch("/api/zones"),
          fetch("/api/devices"),
        ]);

        if (markersRes.ok) {
          const data = await markersRes.json();
          setMarkerOptions(data.map((m) => ({ value: m.id, label: m.name })));
        }
        if (routesRes.ok) {
          const data = await routesRes.json();
          setRouteOptions(data.map((r) => ({ value: r.id, label: r.name })));
        }
        if (zonesRes.ok) {
          const data = await zonesRes.json();
          setZoneOptions(data.map((z) => ({ value: z.id, label: z.name })));
        }
        if (devicesRes.ok) {
          const data = await devicesRes.json();
          setObjectOptions(data.map((d) => ({ value: d.id, label: d.name })));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (subAccount) {
      // Edit mode - populate with existing data
      const parseAccess = (accessString) => {
        if (!accessString) return [];
        return accessString
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      };

      setFormData({
        disabled: subAccount.disabled || false,
        name: subAccount.name || "",
        email: subAccount.email || "",
        password: "",
        phone: subAccount.phone || "",
        sendCredentials: false,
        readonly: subAccount.readonly || false,
        administrator: subAccount.administrator || false,
        deviceLimit: subAccount.deviceLimit || 0,
        userLimit: subAccount.userLimit || 0,
        deviceReadonly: subAccount.deviceReadonly || false,
        limitCommands: subAccount.limitCommands || false,
        fixedEmail: subAccount.fixedEmail || false,
        expirationTime: subAccount.expirationTime || null,
        objects: parseAccess(subAccount.deviceAccess),
        markers: parseAccess(subAccount.markerAccess),
        routes: parseAccess(subAccount.routeAccess),
        zones: parseAccess(subAccount.zoneAccess),
        attributes: subAccount.attributes || {},
      });

      // Permissions from sub account fields
      setPermissions({
        dashboard: subAccount.dashboard || false,
        history: subAccount.history || false,
        reports: subAccount.reports || false,
        tasks: subAccount.tasks || false,
        rfidIButton: subAccount.rilogbook || false,
        dtc: subAccount.dtc || false,
        maintenance: subAccount.maintenance || false,
        expenses: subAccount.expenses || false,
        objectControl: subAccount.objectControl || false,
        imageGallery: subAccount.imageGallery || false,
        chat: subAccount.chat || false,
      });

      // Access via URL
      const auActive = subAccount.autoUrlActive || false;
      const auToken = subAccount.autoUrlToken || "";
      const urls = buildUrls(auToken);
      setAccessViaUrl({
        active: auActive,
        token: auToken,
        desktop: auActive ? urls.desktop : "",
        mobile: auActive ? urls.mobile : "",
      });
    } else {
      // Create mode - reset form
      setFormData({
        disabled: false,
        name: "",
        email: "",
        password: "",
        phone: "",
        sendCredentials: true,
        readonly: false,
        administrator: false,
        deviceLimit: 0,
        userLimit: 0,
        deviceReadonly: false,
        limitCommands: false,
        fixedEmail: false,
        expirationTime: null,
        objects: [],
        markers: [],
        routes: [],
        zones: [],
        attributes: {},
      });
      setPermissions({
        dashboard: false,
        history: false,
        reports: false,
        tasks: false,
        rfidIButton: false,
        dtc: false,
        maintenance: false,
        expenses: false,
        objectControl: false,
        imageGallery: false,
        chat: false,
      });
      setAccessViaUrl({
        active: false,
        token: "",
        desktop: "",
        mobile: "",
      });
    }
  }, [subAccount, open]);

  // CustomInput passes native event, extract value
  const handleInputChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => (checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handlePermissionChange = (field) => (checked) => {
    setPermissions((prev) => ({ ...prev, [field]: checked }));
  };

  const handleAccessUrlActiveChange = (checked) => {
    if (checked) {
      // Generate a token immediately when activating
      const token = generateLocalToken();
      const urls = buildUrls(token);
      setAccessViaUrl({
        active: true,
        token,
        desktop: urls.desktop,
        mobile: urls.mobile,
      });
    } else {
      setAccessViaUrl({
        active: false,
        token: "",
        desktop: "",
        mobile: "",
      });
    }
  };

  const generateLocalToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      alert("Username is required");
      return;
    }
    if (!subAccount && !formData.password?.trim()) {
      alert("Password is required for new sub account");
      return;
    }

    try {
      // Use JSON API (POST for create, PUT for update)
      const isUpdate = !!subAccount?.id;

      const body = {
        ...(isUpdate ? { id: subAccount.id } : {}),
        disabled: formData.disabled,
        name: formData.name,
        email: formData.email || "",
        phone: formData.phone || "",
        sendCredentials: formData.sendCredentials,
        expirationTime: formData.expirationTime || null,
        parentUserId: 0, // Backend fills this from session

        // Permissions
        dashboard: permissions.dashboard,
        history: permissions.history,
        reports: permissions.reports,
        tasks: permissions.tasks,
        rilogbook: permissions.rfidIButton,
        dtc: permissions.dtc,
        maintenance: permissions.maintenance,
        expenses: permissions.expenses,
        objectControl: permissions.objectControl,
        imageGallery: permissions.imageGallery,
        chat: permissions.chat,

        // Access
        deviceAccess: formData.objects.join(","),
        markerAccess: formData.markers.join(","),
        routeAccess: formData.routes.join(","),
        zoneAccess: formData.zones.join(","),

        // Auto URL
        autoUrlActive: accessViaUrl.active,
        autoUrlToken: accessViaUrl.token || "",

        // Attributes
        attributes: formData.attributes || {},
      };

      // Only set password if provided
      if (formData.password) {
        body.password = formData.password;
      }

      let url;
      let method;

      if (isUpdate) {
        url = `/api/subaccounts/${subAccount.id}`;
        method = "PUT";
      } else {
        url = "/api/subaccounts";
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onClose(true);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save sub account");
      }
    } catch (error) {
      console.error("Failed to save sub account:", error);
      alert(`Failed to save sub account: ${error.message}`);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        Sub account properties
        <IconButton
          onClick={() => onClose(false)}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Sub Account Section - Two Columns */}
        <Typography className={classes.sectionTitle}>Sub account</Typography>

        <Box className={classes.twoColumnsContainer}>
          {/* Left Column */}
          <Box className={classes.columnBox}>
            <Box className={classes.formRow}>
              <Typography className={classes.label}>Active</Typography>
              <Box className={classes.inputWrapper}>
                <CustomCheckbox
                  checked={!formData.disabled}
                  onChange={(checked) =>
                    handleCheckboxChange("disabled")(!checked)
                  }
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Username</Typography>
              <Box className={classes.inputWrapper}>
                <CustomInput
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  placeholder="Enter username"
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>E-mail</Typography>
              <Box className={classes.inputWrapper}>
                <CustomInput
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Enter email"
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Password</Typography>
              <Box className={classes.inputWrapper}>
                <CustomInput
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder={subAccount ? "Leave empty to keep" : "Enter password"}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Send credentials</Typography>
              <Box className={classes.inputWrapper}>
                <CustomCheckbox
                  checked={formData.sendCredentials}
                  onChange={handleCheckboxChange("sendCredentials")}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Expire on</Typography>
              <Box className={classes.inputWrapper}>
                <CustomInput
                  type="datetime-local"
                  value={
                    formData.expirationTime
                      ? new Date(formData.expirationTime)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e?.target ? e.target.value : e;
                    setFormData((prev) => ({
                      ...prev,
                      expirationTime: val
                        ? new Date(val).toISOString()
                        : null,
                    }));
                  }}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Objects</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={objectOptions}
                  value={formData.objects}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, objects: val }))
                  }
                  placeholder="Nothing selected"
                  searchable
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Markers</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={markerOptions}
                  value={formData.markers}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, markers: val }))
                  }
                  placeholder="Nothing selected"
                  searchable
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Routes</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={routeOptions}
                  value={formData.routes}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, routes: val }))
                  }
                  placeholder="Nothing selected"
                  searchable
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Zones</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={zoneOptions}
                  value={formData.zones}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, zones: val }))
                  }
                  placeholder="Nothing selected"
                  searchable
                />
              </Box>
            </Box>
          </Box>

          {/* Right Column - Permissions */}
          <Box className={classes.columnBox}>
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.dashboard}
                onChange={handlePermissionChange("dashboard")}
              />
              <Typography className={classes.checkboxLabel}>
                Dashboard
              </Typography>
            </Box>
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.history}
                onChange={handlePermissionChange("history")}
              />
              <Typography className={classes.checkboxLabel}>
                History
              </Typography>
            </Box>
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.reports}
                onChange={handlePermissionChange("reports")}
              />
              <Typography className={classes.checkboxLabel}>
                Reports
              </Typography>
            </Box>
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.tasks}
                onChange={handlePermissionChange("tasks")}
              />
              <Typography className={classes.checkboxLabel}>Tasks</Typography>
            </Box>
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.rfidIButton}
                onChange={handlePermissionChange("rfidIButton")}
              />
              <Typography className={classes.checkboxLabel}>
                RFID and iButton logbook
              </Typography>
            </Box>
            {/* <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.dtc}
                onChange={handlePermissionChange("dtc")}
              />
              <Typography className={classes.checkboxLabel}>
                DTC (Diagnostic Trouble Codes)
              </Typography>
            </Box> */}
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.maintenance}
                onChange={handlePermissionChange("maintenance")}
              />
              <Typography className={classes.checkboxLabel}>
                Maintenance
              </Typography>
            </Box>
            {/* <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.expenses}
                onChange={handlePermissionChange("expenses")}
              />
              <Typography className={classes.checkboxLabel}>
                Expenses
              </Typography>
            </Box> */}
            <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.objectControl}
                onChange={handlePermissionChange("objectControl")}
              />
              <Typography className={classes.checkboxLabel}>
                Object control
              </Typography>
            </Box>
            {/* <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.imageGallery}
                onChange={handlePermissionChange("imageGallery")}
              />
              <Typography className={classes.checkboxLabel}>
                Image gallery
              </Typography>
            </Box> */}
            {/* <Box className={classes.checkboxRow}>
              <CustomCheckbox
                checked={permissions.chat}
                onChange={handlePermissionChange("chat")}
              />
              <Typography className={classes.checkboxLabel}>Chat</Typography>
            </Box> */}
          </Box>
        </Box>

        {/* Access via URL Section */}
        <Typography className={classes.sectionTitle}>Access via URL</Typography>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Active</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={accessViaUrl.active}
              onChange={handleAccessUrlActiveChange}
            />
          </Box>
        </Box>

        {accessViaUrl.active && (
          <>
            <Box className={classes.formRow}>
              <Typography className={classes.label}>URL desktop</Typography>
              <Box className={classes.inputWrapper}>
                <Box className={classes.urlRow}>
                  <CustomInput
                    value={accessViaUrl.desktop}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(accessViaUrl.desktop)}
                    className={classes.copyButton}
                    disabled={!accessViaUrl.desktop}
                  >
                    <ContentCopyIcon style={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>URL mobile</Typography>
              <Box className={classes.inputWrapper}>
                <Box className={classes.urlRow}>
                  <CustomInput
                    value={accessViaUrl.mobile}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(accessViaUrl.mobile)}
                    className={classes.copyButton}
                    disabled={!accessViaUrl.mobile}
                  >
                    <ContentCopyIcon style={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <CustomButton
          onClick={handleSave}
          variant="primary"
          icon={<SaveIcon style={{ fontSize: 14 }} />}
        >
          Save
        </CustomButton>
        <CustomButton
          onClick={handleCancel}
          variant="secondary"
          icon={<CancelIcon style={{ fontSize: 14 }} />}
        >
          Cancel
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default EditSubAccountDialog;
