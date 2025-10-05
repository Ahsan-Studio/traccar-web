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
import {
  CustomInput,
  CustomButton,
  CustomCheckbox,
  CustomMultiSelect,
} from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "750px",
      maxWidth: "90vw",
      maxHeight: "80vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "8px 16px",
    fontSize: "14px",
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
    marginBottom: theme.spacing(1.5),
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
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
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
}));

const EditSubAccountDialog = ({ open, onClose, subAccount }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    disabled: false,
    name: "",
    email: "",
    password: "",
    phone: "",
    readonly: false,
    administrator: false,
    deviceLimit: 0,
    userLimit: 0,
    deviceReadonly: false,
    limitCommands: false,
    fixedEmail: false,
    expirationTime: null,
    attributes: {},
  });

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
    desktop: "",
    mobile: "",
  });

  useEffect(() => {
    if (subAccount) {
      // Edit mode - populate with existing data
      setFormData({
        disabled: subAccount.disabled || false,
        name: subAccount.name || "",
        email: subAccount.email || "",
        password: "",
        phone: subAccount.phone || "",
        readonly: subAccount.readonly || false,
        administrator: subAccount.administrator || false,
        deviceLimit: subAccount.deviceLimit || 0,
        userLimit: subAccount.userLimit || 0,
        deviceReadonly: subAccount.deviceReadonly || false,
        limitCommands: subAccount.limitCommands || false,
        fixedEmail: subAccount.fixedEmail || false,
        expirationTime: subAccount.expirationTime || null,
        attributes: subAccount.attributes || {},
      });
    } else {
      // Create mode - reset form
      setFormData({
        disabled: false,
        name: "",
        email: "",
        password: "",
        phone: "",
        readonly: false,
        administrator: false,
        deviceLimit: 0,
        userLimit: 0,
        deviceReadonly: false,
        limitCommands: false,
        fixedEmail: false,
        expirationTime: null,
        attributes: {},
      });
    }
  }, [subAccount, open]);

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => (checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handlePermissionChange = (field) => (checked) => {
    setPermissions((prev) => ({ ...prev, [field]: checked }));
  };

  const handleAccessUrlChange = (field) => (value) => {
    setAccessViaUrl((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const method = subAccount ? 'PUT' : 'POST';
      const url = subAccount 
        ? `/api/subaccounts/${subAccount.id}` 
        : '/api/subaccounts';
      
      const payload = {
        ...formData,
        id: subAccount?.id,
      };

      // Remove password if empty (for edit mode)
      if (!payload.password) {
        delete payload.password;
      }

      await fetchOrThrow(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      onClose(true); // Pass true to indicate save was successful
    } catch (error) {
      console.error('Failed to save sub account:', error);
      alert('Failed to save sub account. Please try again.');
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  // Mock data for dropdowns
  const objectOptions = [
    { value: 1, label: "Gun" },
    { value: 2, label: "HIACE DEV" },
    { value: 3, label: "1052 DEV" },
  ];

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        Sub account properties
        <IconButton onClick={onClose} className={classes.closeButton} size="small">
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
                  onChange={(checked) => handleCheckboxChange("disabled")(!checked)}
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
                  placeholder="Enter password"
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
                  value={formData.expirationTime ? new Date(formData.expirationTime).toISOString().slice(0, 16) : ""}
                  onChange={(value) => handleInputChange("expirationTime")(value ? new Date(value).toISOString() : null)}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Objects</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={objectOptions}
                  value={formData.objects}
                  onChange={handleInputChange("objects")}
                  placeholder="Nothing selected"
                  searchable={true}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Markers</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={[]}
                  value={formData.markers}
                  onChange={handleInputChange("markers")}
                  placeholder="Nothing selected"
                  searchable={true}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Routes</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={[]}
                  value={formData.routes}
                  onChange={handleInputChange("routes")}
                  placeholder="Nothing selected"
                  searchable={true}
                />
              </Box>
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Zones</Typography>
              <Box className={classes.inputWrapper}>
                <CustomMultiSelect
                  options={[]}
                  value={formData.zones}
                  onChange={handleInputChange("zones")}
                  placeholder="Nothing selected"
                  searchable={true}
                />
              </Box>
            </Box>
          </Box>

          {/* Right Column */}
          <Box className={classes.columnBox}>
            <Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.dashboard}
                  onChange={handlePermissionChange("dashboard")}
                />
                <Typography className={classes.checkboxLabel}>Dashboard</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.history}
                  onChange={handlePermissionChange("history")}
                />
                <Typography className={classes.checkboxLabel}>History</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.reports}
                  onChange={handlePermissionChange("reports")}
                />
                <Typography className={classes.checkboxLabel}>Reports</Typography>
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
                <Typography className={classes.checkboxLabel}>RFID and iButton logbook</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.dtc}
                  onChange={handlePermissionChange("dtc")}
                />
                <Typography className={classes.checkboxLabel}>DTC (Diagnostic Trouble Codes)</Typography>
              </Box>
            </Box>

            <Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.maintenance}
                  onChange={handlePermissionChange("maintenance")}
                />
                <Typography className={classes.checkboxLabel}>Maintenance</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.expenses}
                  onChange={handlePermissionChange("expenses")}
                />
                <Typography className={classes.checkboxLabel}>Expenses</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.objectControl}
                  onChange={handlePermissionChange("objectControl")}
                />
                <Typography className={classes.checkboxLabel}>Object control</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.imageGallery}
                  onChange={handlePermissionChange("imageGallery")}
                />
                <Typography className={classes.checkboxLabel}>Image gallery</Typography>
              </Box>
              <Box className={classes.checkboxRow}>
                <CustomCheckbox
                  checked={permissions.chat}
                  onChange={handlePermissionChange("chat")}
                />
                <Typography className={classes.checkboxLabel}>Chat</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Access via URL Section */}
        <Typography className={classes.sectionTitle}>Access via URL</Typography>
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Active</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={accessViaUrl.active}
              onChange={(checked) => handleAccessUrlChange("active")(checked)}
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>URL desktop</Typography>
          <Box className={classes.inputWrapper}>
            <CustomInput
              value={accessViaUrl.desktop}
              onChange={handleAccessUrlChange("desktop")}
              placeholder="Desktop URL"
              disabled
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>URL mobile</Typography>
          <Box className={classes.inputWrapper}>
            <CustomInput
              value={accessViaUrl.mobile}
              onChange={handleAccessUrlChange("mobile")}
              placeholder="Mobile URL"
              disabled
            />
          </Box>
        </Box>
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
