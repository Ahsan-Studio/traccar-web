import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const useStyles = makeStyles()(() => ({
  dialog: {
    "& .MuiDialog-paper": {
      minWidth: "600px",
      maxWidth: "700px",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    color: "white",
    padding: "4px",
  },
  dialogContent: {
    padding: "20px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: "16px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#333",
    minWidth: "140px",
    textAlign: "left",
  },
  inputField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  checkbox: {
    padding: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "18px",
    },
  },
  checkboxLabel: {
    fontSize: "12px",
    marginLeft: "8px",
  },
  inputWithCheckbox: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
    width: "120px",
  },
  dateInput: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
    width: "140px",
  },
  rightLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#333",
    minWidth: "120px",
    textAlign: "left",
  },
  rightInput: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
    width: "120px",
  },
  dialogActions: {
    padding: "16px 20px",
    gap: "12px",
  },
  saveButton: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 16px",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
  cancelButton: {
    backgroundColor: "white",
    color: "#666",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 16px",
    border: "1px solid #ddd",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
}));

const ServiceDialog = ({ open, onClose, onSave, service }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    // Service section
    name: "",
    dataList: false,
    popup: false,
    odometerInterval: false,
    odometerIntervalValue: "",
    lastServiceOdometer: "",
    engineHourInterval: false,
    engineHourIntervalValue: "",
    lastServiceEngineHour: "",
    dayInterval: false,
    dayIntervalValue: "",
    lastServiceDay: "",
    
    // Trigger event section
    odometerLeft: false,
    odometerLeftValue: "",
    updateLastService: false,
    remainingEngineHours: false,
    remainingEngineHoursValue: "",
    remainingDays: false,
    remainingDaysValue: "",
    
    // Current object counter section
    currentOdometer: "261",
    currentEngineHours: "0",
  });

  // Prefill when editing an existing service
  useEffect(() => {
    if (open && service) {
      const toDateInput = (iso) => {
        try {
          if (!iso) return "";
          const d = new Date(iso);
          return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
        } catch (err) {
          return err;
        }
      };

      setFormData((prev) => ({
        ...prev,
        id: service.id, // Include the ID for updates
        name: service.name || "",
        dataList: !!service.dataList,
        popup: !!service.popup,

        odometerInterval: (service.odometerIntervalKm || 0) > 0 || (service.lastServiceKm || 0) > 0,
        odometerIntervalValue: service.odometerIntervalKm ? String(service.odometerIntervalKm) : "",
        lastServiceOdometer: service.lastServiceKm ? String(service.lastServiceKm) : "",

        engineHourInterval: (service.intervalEngineHours || 0) > 0 || (service.lastServiceEngineHours || 0) > 0,
        engineHourIntervalValue: service.intervalEngineHours ? String(service.intervalEngineHours) : "",
        lastServiceEngineHour: service.lastServiceEngineHours ? String(service.lastServiceEngineHours) : "",

        dayInterval: (service.intervalDays || 0) > 0 || !!service.lastServiceDate,
        dayIntervalValue: service.intervalDays ? String(service.intervalDays) : "",
        lastServiceDay: toDateInput(service.lastServiceDate),

        odometerLeft: (service.triggerOdometerLeftKm || 0) > 0,
        odometerLeftValue: service.triggerOdometerLeftKm ? String(service.triggerOdometerLeftKm) : "",
        updateLastService: !!service.updateLastServiceOdometer,

        remainingEngineHours: (service.triggerEngineHoursLeft || 0) > 0,
        remainingEngineHoursValue: service.triggerEngineHoursLeft ? String(service.triggerEngineHoursLeft) : "",

        remainingDays: (service.triggerDaysLeft || 0) > 0,
        remainingDaysValue: service.triggerDaysLeft ? String(service.triggerDaysLeft) : "",
      }));
    }
    if (open && !service) {
      // Reset to blank on new item
      setFormData({
        id: null, // Explicitly set to null for new items
        name: "",
        dataList: false,
        popup: false,
        odometerInterval: false,
        odometerIntervalValue: "",
        lastServiceOdometer: "",
        engineHourInterval: false,
        engineHourIntervalValue: "",
        lastServiceEngineHour: "",
        dayInterval: false,
        dayIntervalValue: "",
        lastServiceDay: "",
        odometerLeft: false,
        odometerLeftValue: "",
        updateLastService: false,
        remainingEngineHours: false,
        remainingEngineHoursValue: "",
        remainingDays: false,
        remainingDaysValue: "",
        currentOdometer: "261",
        currentEngineHours: "0",
      });
    }
  }, [open, service]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    const checked = event.target.checked;
    
    setFormData(prev => {
      const newData = { ...prev, [field]: checked };
      
      // Reset dependent fields when parent checkbox is unchecked
      if (field === "odometerInterval" && !checked) {
        newData.odometerLeft = false;
        newData.updateLastService = false;
        newData.odometerLeftValue = "";
      }
      
      if (field === "engineHourInterval" && !checked) {
        newData.remainingEngineHours = false;
        newData.remainingEngineHoursValue = "";
      }
      
      if (field === "dayInterval" && !checked) {
        newData.remainingDays = false;
        newData.remainingDaysValue = "";
      }
      
      return newData;
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className={classes.dialogTitle}>
        Service properties
        <IconButton
          className={classes.closeButton}
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Service Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Service</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Nama</Typography>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              className={classes.inputField}
              size="small"
              fullWidth
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Daftar data</Typography>
            <Checkbox
              checked={formData.dataList}
              onChange={handleCheckboxChange("dataList")}
              className={classes.checkbox}
            />
            <Typography className={classes.checkboxLabel}>Daftar data</Typography>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Popup</Typography>
            <Checkbox
              checked={formData.popup}
              onChange={handleCheckboxChange("popup")}
              className={classes.checkbox}
            />
            <Typography className={classes.checkboxLabel}>Popup</Typography>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Odometer interval (km)</Typography>
            <Checkbox
              checked={formData.odometerInterval}
              onChange={handleCheckboxChange("odometerInterval")}
              className={classes.checkbox}
            />
            <TextField
              value={formData.odometerIntervalValue}
              onChange={handleInputChange("odometerIntervalValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.odometerInterval}
            />
            <Typography className={classes.rightLabel}>Servis terakhir (km)</Typography>
            <TextField
              value={formData.lastServiceOdometer}
              onChange={handleInputChange("lastServiceOdometer")}
              className={classes.rightInput}
              size="small"
              disabled={!formData.odometerInterval}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Interval jam mesin (h)</Typography>
            <Checkbox
              checked={formData.engineHourInterval}
              onChange={handleCheckboxChange("engineHourInterval")}
              className={classes.checkbox}
            />
            <TextField
              value={formData.engineHourIntervalValue}
              onChange={handleInputChange("engineHourIntervalValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.engineHourInterval}
            />
            <Typography className={classes.rightLabel}>Servis terakhir (h)</Typography>
            <TextField
              value={formData.lastServiceEngineHour}
              onChange={handleInputChange("lastServiceEngineHour")}
              className={classes.rightInput}
              size="small"
              disabled={!formData.engineHourInterval}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Interval hari</Typography>
            <Checkbox
              checked={formData.dayInterval}
              onChange={handleCheckboxChange("dayInterval")}
              className={classes.checkbox}
            />
            <TextField
              value={formData.dayIntervalValue}
              onChange={handleInputChange("dayIntervalValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.dayInterval}
            />
            <Typography className={classes.rightLabel}>Servis terakhir</Typography>
            <TextField
              type="date"
              value={formData.lastServiceDay}
              onChange={handleInputChange("lastServiceDay")}
              className={classes.dateInput}
              size="small"
              disabled={!formData.dayInterval}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        {/* Trigger Event Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Pemicu kejadian</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Odometer left (km)</Typography>
            <Checkbox
              checked={formData.odometerLeft}
              onChange={handleCheckboxChange("odometerLeft")}
              className={classes.checkbox}
              disabled={!formData.odometerInterval}
            />
            <TextField
              value={formData.odometerLeftValue}
              onChange={handleInputChange("odometerLeftValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.odometerLeft || !formData.odometerInterval}
            />
            <Typography className={classes.rightLabel}>Perbaharui servis terakhir</Typography>
            <Checkbox
              checked={formData.updateLastService}
              onChange={handleCheckboxChange("updateLastService")}
              className={classes.checkbox}
              disabled={!formData.odometerInterval}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Sisa jam mesin (h)</Typography>
            <Checkbox
              checked={formData.remainingEngineHours}
              onChange={handleCheckboxChange("remainingEngineHours")}
              className={classes.checkbox}
              disabled={!formData.engineHourInterval}
            />
            <TextField
              value={formData.remainingEngineHoursValue}
              onChange={handleInputChange("remainingEngineHoursValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.remainingEngineHours || !formData.engineHourInterval}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Hari tersisa</Typography>
            <Checkbox
              checked={formData.remainingDays}
              onChange={handleCheckboxChange("remainingDays")}
              className={classes.checkbox}
              disabled={!formData.dayInterval}
            />
            <TextField
              value={formData.remainingDaysValue}
              onChange={handleInputChange("remainingDaysValue")}
              className={classes.inputWithCheckbox}
              size="small"
              disabled={!formData.remainingDays || !formData.dayInterval}
            />
          </Box>
        </Box>

        {/* Current Object Counter Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Penghitung objek saat ini</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Odometer saat ini (km)</Typography>
            <TextField
              value={formData.currentOdometer}
              onChange={handleInputChange("currentOdometer")}
              className={classes.inputField}
              size="small"
              style={{ width: "120px" }}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Jam mesin saat ini (h)</Typography>
            <TextField
              value={formData.currentEngineHours}
              onChange={handleInputChange("currentEngineHours")}
              className={classes.inputField}
              size="small"
              style={{ width: "120px" }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleSave}
          className={classes.saveButton}
          startIcon={<SaveIcon />}
        >
          Simpan
        </Button>
        <Button
          onClick={handleCancel}
          className={classes.cancelButton}
          startIcon={<CancelIcon />}
        >
          Batal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDialog;
