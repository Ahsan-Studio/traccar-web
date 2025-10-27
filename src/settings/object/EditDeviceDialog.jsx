import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { devicesActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
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
import MainTab from "./tabs/MainTab";
import IconTab from "./tabs/IconTab";
import FuelTab from "./tabs/FuelTab";
import AccuracyTab from "./tabs/AccuracyTab";
import SensorsTab from "./tabs/SensorsTab";
import ServiceTab from "./tabs/ServiceTab";
import CustomTab from "./tabs/CustomTab";
import InfoTab from "./tabs/InfoTab";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "900px",
      maxWidth: "75vw",
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
    backgroundColor: "#f5f5f5",
    minHeight: "31px !important",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "& .MuiTab-root": {
      marginTop: "6px",
      minHeight: "25px",
      minWidth: "50px",
      textTransform: "none",
      fontSize: "11px",
      fontWeight: "normal",
      padding: "4px 8px",
      color: "#444444",
      borderRadius: 0,
      "&.Mui-selected": {
        backgroundColor: "#ffffff",
        color: "#444444",
      },
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  },
  tabPanel: {
    padding: theme.spacing(2),
    height: "100%", // Subtract tabs and actions height
    overflow: "auto",
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
    chassisNumber: device?.attributes?.chassisNumber || "",
    plateNumber: device?.attributes?.plateNumber || "",
    simCardNumber: device?.attributes?.simCardNumber || "",
    contact: device?.contact || "",
    groupId: device?.groupId ? String(device.groupId) : "0",
    attributes: {
      ...device?.attributes,
      driverId: device?.attributes?.driverId ? String(device.attributes.driverId) : null,
    },
    trailerId: device?.trailerId || "",
    gpsType: device?.attributes?.gpsType || "GPS H700",
    odometer: device?.attributes?.totalDistance ? (device.attributes.totalDistance / 1000) : 0, // Fallback to device attributes
    engineHours: device?.attributes?.hours || 0, // Fallback to device attributes
  });

  // Update formData when device changes
  useEffect(() => {
    if (device) {
      const initializeFormData = async () => {
        let odometer = 0;
        let engineHours = 0;

        // Try to fetch odometer and engine hours from positions API
        try {
          const positionResponse = await fetchOrThrow(`/api/positions?deviceId=${device.id}`);
          const positionData = await positionResponse.json();
          
          // Get the latest position (first in array)
          if (positionData && positionData.length > 0) {
            const latestPosition = positionData[0];
            
            // Get odometer from totalDistance in attributes (convert meters to km)
            if (latestPosition.attributes?.totalDistance) {
              odometer = latestPosition.attributes.totalDistance / 1000;
            }
            
            // Get engine hours from hours in attributes
            if (latestPosition.attributes?.hours !== undefined) {
              engineHours = latestPosition.attributes.hours;
            }
          } else {
            odometer = device?.attributes?.totalDistance ? (device.attributes.totalDistance / 1000) : 0;
            engineHours = device?.attributes?.hours || 0;
          }
        } catch {
          // Fallback to device attributes if position API fails
          odometer = device?.attributes?.totalDistance ? (device.attributes.totalDistance / 1000) : 0;
          engineHours = device?.attributes?.hours || 0;
        }

        setFormData({
          name: device?.name || "",
          uniqueId: device?.uniqueId || "",
          model: device?.model || "",
          phone: device?.phone || "",
          chassisNumber: device?.attributes?.chassisNumber || "",
          plateNumber: device?.attributes?.plateNumber || "",
          simCardNumber: device?.attributes?.simCardNumber || "",
          contact: device?.contact || "",
          groupId: device?.groupId ? String(device.groupId) : "0",
          attributes: {
            ...device?.attributes,
            driverId: device?.attributes?.driverId ? String(device.attributes.driverId) : null,
          },
          trailerId: device?.trailerId || "",
          gpsType: device?.attributes?.gpsType || "GPS H700",
          odometer: odometer,
          engineHours: engineHours,
        });
      };

      initializeFormData();
    }
  }, [device]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormDataChange = (newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData,
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
        groupId: formData.groupId && formData.groupId !== "0" ? Number(formData.groupId) : null,
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
          gpsType: formData.gpsType || null,
          driverId: formData.attributes?.driverId && formData.attributes.driverId !== "0" ? Number(formData.attributes.driverId) : null,
          // Include icon attributes if they exist
          ...(formData.attributes?.icon && { icon: formData.attributes.icon }),
          // Include fuel attributes if they exist
          ...(formData.attributes?.fuel && { fuel: formData.attributes.fuel }),
          // Include accuration attributes if they exist
          ...(formData.attributes?.accuration && { accuration: formData.attributes.accuration }),
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

      // Handle odometer and engine hours update via accumulators API
      const hasOdometerChange = formData.odometer !== undefined && formData.odometer !== null;
      const hasEngineHoursChange = formData.engineHours !== undefined && formData.engineHours !== null;
      
      if (hasOdometerChange || hasEngineHoursChange) {
        try {
          const accumulatorsData = {
            deviceId: device.id, // Required field according to API documentation
          };
          
          if (hasOdometerChange) {
            // Convert kilometers to meters as per API documentation
            accumulatorsData.totalDistance = (Number(formData.odometer) || 0) * 1000;
            console.log('Updating odometer:', formData.odometer, 'km =', accumulatorsData.totalDistance, 'meters');
          }
          
          if (hasEngineHoursChange) {
            accumulatorsData.hours = Number(formData.engineHours) || 0;
            console.log('Updating engine hours:', formData.engineHours);
          }
          
          await fetchOrThrow(`/api/devices/${device.id}/accumulators`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(accumulatorsData),
          });
          
          // API returns 204 No Content, so no response body to parse
          console.log('Accumulators updated successfully (204 No Content):', accumulatorsData);
        } catch (accumulatorsError) {
          console.error('Failed to update accumulators:', accumulatorsError);
          // Don't fail the entire save operation for accumulators errors
        }
      }

      // Handle driver assignment - always update to ensure consistency
      const newDriverId = formData.attributes?.driverId && formData.attributes.driverId !== "0" ? Number(formData.attributes.driverId) : null;
      const currentDriverId = device.attributes?.driverId;
      
      console.log('Driver assignment check:', {
        newDriverId,
        currentDriverId,
        formDataDriverId: formData.attributes?.driverId,
        deviceDriverId: device.attributes?.driverId
      });
      
      try {
        // Always remove existing driver permission first (if any)
        if (currentDriverId) {
          console.log('Removing existing driver permission:', currentDriverId);
          await fetchOrThrow('/api/permissions', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: device.id,
              driverId: currentDriverId
            }),
          });
          console.log('Existing driver permission removed');
        }
        
        // Assign new driver if selected
        if (newDriverId) {
          console.log('Assigning new driver:', newDriverId);
          await fetchOrThrow('/api/permissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: device.id,
              driverId: newDriverId
            }),
          });
          console.log('Driver assigned successfully');
        } else {
          console.log('No driver selected - driver assignment cleared');
        }
      } catch (driverError) {
        console.error('Failed to update driver assignment:', driverError);
        // Don't fail the entire save operation for driver assignment errors
      }

      // Refresh device data to get updated driverId, odometer, and engine hours after assignment
      try {
        const deviceResponse = await fetchOrThrow(`/api/devices/${device.id}`);
        const refreshedDevice = await deviceResponse.json();
        console.log('Refreshed device data:', refreshedDevice);
        
        // Try to get engine hours and odometer from positions API
        try {
          const positionResponse = await fetchOrThrow(`/api/positions?deviceId=${refreshedDevice.id}`);
          const positionData = await positionResponse.json();
          
          // Get the latest position (first in array)
          if (positionData && positionData.length > 0) {
            const latestPosition = positionData[0];
            
            // Update device attributes with engine hours and odometer from position
            const updatedAttributes = { ...refreshedDevice.attributes };
            
            if (latestPosition.attributes?.hours !== undefined) {
              updatedAttributes.hours = latestPosition.attributes.hours;
            }
            
            if (latestPosition.attributes?.totalDistance !== undefined) {
              updatedAttributes.totalDistance = latestPosition.attributes.totalDistance;
            }
            
            refreshedDevice.attributes = updatedAttributes;
          }
        } catch {
          // Continue without position data - device attributes will remain as they are
        }
        
        // Update Redux store with the refreshed device data
        dispatch(devicesActions.update([refreshedDevice]));
      } catch (refreshError) {
        console.error('Failed to refresh device data:', refreshError);
        // Fallback to original updated device
        dispatch(devicesActions.update([updatedDevice]));
      }

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
          <Tab label="Konsumsi bahan bakar" />
          <Tab label="Akurasi" />
          <Tab label="Sensors" />
          <Tab label="Service" />
          <Tab label="Custom fields" />
          <Tab label="Info" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <MainTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <IconTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
            deviceId={device?.id}
            deviceUniqueId={device?.uniqueId}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <FuelTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <AccuracyTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <SensorsTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={5} className={classes.tabPanel}>
          <ServiceTab 
            device={device}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={6} className={classes.tabPanel}>
          <CustomTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
            device={device}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={7} className={classes.tabPanel}>
          <InfoTab 
            formData={formData} 
            onFormDataChange={handleFormDataChange}
            device={device}
          />
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
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          className={classes.actionButton}
        >
          Cancel
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
