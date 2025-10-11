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
    desktop: "",
    mobile: "",
  });

  // Fetch markers, routes, zones, and objects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch markers (CIRCLE geofences)
        const markersResponse = await fetch('/api/markers');
        if (markersResponse.ok) {
          const markersData = await markersResponse.json();
          setMarkerOptions(
            markersData.map((marker) => ({
              value: marker.id,
              label: marker.name,
            }))
          );
        }

        // Fetch routes (LINESTRING geofences)
        const routesResponse = await fetch('/api/routes');
        if (routesResponse.ok) {
          const routesData = await routesResponse.json();
          setRouteOptions(
            routesData.map((route) => ({
              value: route.id,
              label: route.name,
            }))
          );
        }

        // Fetch zones (POLYGON geofences)
        const zonesResponse = await fetch('/api/zones');
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json();
          setZoneOptions(
            zonesData.map((zone) => ({
              value: zone.id,
              label: zone.name,
            }))
          );
        }

        // Fetch devices/objects
        const devicesResponse = await fetch('/api/devices');
        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json();
          setObjectOptions(
            devicesData.map((device) => ({
              value: device.id,
              label: device.name,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (subAccount) {
      // Edit mode - populate with existing data
      // Parse markerAccess, zoneAccess, routeAccess from comma-separated strings
      const parseAccess = (accessString) => {
        if (!accessString) return [];
        return accessString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
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
        objects: [],
        markers: parseAccess(subAccount.markerAccess),
        routes: parseAccess(subAccount.routeAccess),
        zones: parseAccess(subAccount.zoneAccess),
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
      // Use legacy endpoint with form data format
      const formDataToSend = new URLSearchParams();
      
      // Required fields
      formDataToSend.append('cmd', subAccount ? 'update' : 'create');
      if (subAccount?.id) {
        formDataToSend.append('subaccount_id', subAccount.id);
      }
      formDataToSend.append('active', !formData.disabled ? '1' : '0');
      formDataToSend.append('username', formData.name || '');
      formDataToSend.append('email', formData.email || '');
      
      // Optional password (only if provided)
      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }
      
      // Send credentials
      formDataToSend.append('send', formData.sendCredentials ? '1' : '0');
      
      // Expiration
      if (formData.expirationTime) {
        formDataToSend.append('account_expire', '1');
        formDataToSend.append('account_expire_dt', formData.expirationTime);
      } else {
        formDataToSend.append('account_expire', '0');
      }
      
      // Permissions
      formDataToSend.append('dashboard', permissions.dashboard ? '1' : '0');
      formDataToSend.append('history', permissions.history ? '1' : '0');
      formDataToSend.append('reports', permissions.reports ? '1' : '0');
      formDataToSend.append('tasks', permissions.tasks ? '1' : '0');
      formDataToSend.append('rilogbook', permissions.rfidIButton ? '1' : '0');
      formDataToSend.append('dtc', permissions.dtc ? '1' : '0');
      formDataToSend.append('maintenance', permissions.maintenance ? '1' : '0');
      formDataToSend.append('expenses', permissions.expenses ? '1' : '0');
      formDataToSend.append('object_control', permissions.objectControl ? '1' : '0');
      formDataToSend.append('image_gallery', permissions.imageGallery ? '1' : '0');
      formDataToSend.append('chat', permissions.chat ? '1' : '0');
      
      // Objects/Devices (IMEIs) - comma separated
      if (formData.objects && formData.objects.length > 0) {
        formDataToSend.append('imei', formData.objects.join(','));
      }
      
      // Markers - comma separated
      if (formData.markers && formData.markers.length > 0) {
        formDataToSend.append('marker', formData.markers.join(','));
      }
      
      // Routes - comma separated
      if (formData.routes && formData.routes.length > 0) {
        formDataToSend.append('route', formData.routes.join(','));
      }
      
      // Zones - comma separated
      if (formData.zones && formData.zones.length > 0) {
        formDataToSend.append('zone', formData.zones.join(','));
      }
      
      // Access via URL
      formDataToSend.append('au_active', accessViaUrl.active ? '1' : '0');
      if (accessViaUrl.desktop) {
        formDataToSend.append('au', accessViaUrl.desktop);
      }

      const response = await fetchOrThrow('/api/subaccounts/legacy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formDataToSend.toString(),
      });

      if (response.ok) {
        onClose(true); // Pass true to indicate save was successful
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save sub account');
      }
    } catch (error) {
      console.error('Failed to save sub account:', error);
      alert('Failed to save sub account. Please try again.');
    }
  };

  const handleCancel = () => {
    onClose(false);
  };


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
                  options={markerOptions}
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
                  options={routeOptions}
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
                  options={zoneOptions}
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
