import { useState } from "react";
import { useDispatch } from "react-redux";
import { devicesActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "900px",
      maxWidth: "95vw",
      height: "700px",
      maxHeight: "95vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "& .MuiTypography-root": {
      fontSize: "14px",
      fontWeight: 500,
    },
  },
  closeButton: {
    color: "white",
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "36px",
    "& .MuiTab-root": {
      minHeight: "36px",
      textTransform: "none",
      fontSize: "12px",
      fontWeight: "normal",
      padding: "6px 12px",
      color: "#666",
      "&.Mui-selected": {
        color: "#4a90e2",
      },
    },
    "& .MuiTabs-indicator": {
      backgroundColor: "#4a90e2",
    },
  },
  tabPanel: {
    padding: theme.spacing(3),
    height: "calc(100% - 36px - 60px)", // Subtract tabs and actions height
    overflow: "auto",
  },
  formField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f9f9f9",
  },
  actionButton: {
    fontSize: "12px",
    textTransform: "none",
    padding: "6px 16px",
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`edit-device-tabpanel-${index}`}
    aria-labelledby={`edit-device-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
  </div>
);

const EditDeviceDialog = ({ open, onClose, device }) => {
  console.log('EditDeviceDIalog device', device)
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: device?.name || "",
    uniqueId: device?.uniqueId || "",
    model: device?.model || "",
    phone: device?.phone || "",
    chassisNumber: device.attributes?.chassisNumber || "",
    plateNumber: device.attributes?.plateNumber || "",
    simCardNumber: device.attributes?.simCardNumber || "",

    // Not implemented yet
    contact: device?.contact || "",
    groupId: device?.groupId || "",
    driverId: device?.driverId || "",
    trailerId: device?.trailerId || "",
    gpsType: device?.gpsType || "GPS H700",
    odometer: device?.odometer || 0,
    engineHours: device?.engineHours || 0,
  });

  console.log('formData', formData);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
    if (!device?.id) {
      console.error('No device ID provided');
      return;
    }

    setSaving(true);
    try {
      // Prepare the device data for API
      const deviceData = {
        id: device.id,
        name: formData.name,
        uniqueId: formData.uniqueId,
        model: formData.model || null,
        phone: formData.phone || null,
        groupId: formData.groupId || null,
        // Include existing fields that shouldn't be modified
        status: device.status,
        disabled: device.disabled,
        lastUpdate: device.lastUpdate,
        positionId: device.positionId,
        category: device.category,
        attributes: {
          ...device.attributes,
          chassisNumber: formData.chassisNumber,
          plateNumber: formData.plateNumber,
          simCardNumber: formData.simCardNumber,
        },
      };

      console.log('Saving device data:', deviceData);

      // Make API call to update device
      const response = await fetchOrThrow(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });

      const updatedDevice = await response.json();
      console.log('Device updated successfully:', updatedDevice);

      // Update Redux store with the updated device
      dispatch(devicesActions.update([updatedDevice]));

      // Show success message
      setSuccess(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save device:', error);
      setError(error.message || 'Failed to save device. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Ubah objek</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0, height: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Utama" />
          <Tab label="Icon" />
          <Tab label="Konsumsi bahan..." />
          <Tab label="Akurasi" />
          <Tab label="Sensors" />
          <Tab label="Service" />
          <Tab label="Isian buatan send..." />
          <Tab label="Info" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Typography className={classes.sectionTitle}>Utama</Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Nama"
              value={formData.name}
              onChange={handleInputChange("name")}
              className={classes.formField}
              size="small"
            />

            <TextField
              fullWidth
              label="IMEI"
              value={formData.uniqueId}
              onChange={handleInputChange("uniqueId")}
              className={classes.formField}
              size="small"
            />

            <TextField
              fullWidth
              label="Model transport"
              value={formData.model}
              onChange={handleInputChange("model")}
              className={classes.formField}
              size="small"
            />

            <TextField
              fullWidth
              label="Nomor rangka"
              value={formData.chassisNumber}
              onChange={handleInputChange("chassisNumber")}
              className={classes.formField}
              size="small"
            />

            <TextField
              fullWidth
              label="Plate number"
              value={formData.plateNumber}
              onChange={handleInputChange("plateNumber")}
              className={classes.formField}
              size="small"
            />

            <TextField
              fullWidth
              label="SIM card number"
              value={formData.simCardNumber}
              onChange={handleInputChange("simCardNumber")}
              className={classes.formField}
              size="small"
            />

            {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Gr...</InputLabel>
                <Select
                  value={formData.groupId}
                  onChange={handleInputChange("groupId")}
                  label="Gr..."
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="GROUP 1">GROUP 1</MenuItem>
                  <MenuItem value="GROUP 2">GROUP 2</MenuItem>
                  <MenuItem value="GROUP 3">GROUP 3</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>P...</InputLabel>
                <Select
                  value={formData.driverId}
                  onChange={handleInputChange("driverId")}
                  label="P..."
                >
                  <MenuItem value="">Penempatan otomatis</MenuItem>
                  <MenuItem value="driver1">Driver 1</MenuItem>
                  <MenuItem value="driver2">Driver 2</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Tr...</InputLabel>
                <Select
                  value={formData.trailerId}
                  onChange={handleInputChange("trailerId")}
                  label="Tr..."
                >
                  <MenuItem value="">Penempatan otomatis</MenuItem>
                  <MenuItem value="trailer1">Trailer 1</MenuItem>
                  <MenuItem value="trailer2">Trailer 2</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tipe GPS</InputLabel>
                <Select
                  value={formData.gpsType}
                  onChange={handleInputChange("gpsType")}
                  label="Tipe GPS"
                >
                  <MenuItem value="GPS H700">GPS H700</MenuItem>
                  <MenuItem value="GPS H800">GPS H800</MenuItem>
                  <MenuItem value="GPS H900">GPS H900</MenuItem>
                </Select>
              </FormControl>
        
            </Box> */}
          </Box>

          {/* <Typography className={classes.sectionTitle}>Penghitung</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '12px', minWidth: '80px' }}>Odome...</Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value="GPS"
                  displayEmpty
                >
                  <MenuItem value="GPS">GPS</MenuItem>
                  <MenuItem value="Manual">Manual</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="number"
                value={formData.odometer}
                onChange={handleInputChange("odometer")}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '12px', minWidth: '60px' }}>Jam ...</Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value="Off"
                  displayEmpty
                >
                  <MenuItem value="Off">Off</MenuItem>
                  <MenuItem value="On">On</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="number"
                value={formData.engineHours}
                onChange={handleInputChange("engineHours")}
                size="small"
                sx={{ width: 100 }}
              />
            </Box>
          </Box> */}
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Icon settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Konsumsi bahan settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Akurasi settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Sensors settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={5} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Service settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={6} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Isian buatan send settings will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={7} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Info settings will be implemented here
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          className={classes.actionButton}
          disabled={saving}
          sx={{
            backgroundColor: "#4a90e2",
            "&:hover": { backgroundColor: "#357abd" },
          }}
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          className={classes.actionButton}
        >
          Batal
        </Button>
      </DialogActions>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          Device updated successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditDeviceDialog;
