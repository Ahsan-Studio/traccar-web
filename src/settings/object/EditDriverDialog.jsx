import { useState } from "react";
import { useDispatch } from "react-redux";
import { driversActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
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
      width: "500px",
      maxWidth: "90vw",
      height: "500px",
      maxHeight: "90vh",
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
  dialogContent: {
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  formField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f5f5f5",
  },
  actionButton: {
    fontSize: "12px",
    padding: "6px 16px",
  },
}));

const EditDriverDialog = ({ open, onClose, driver, onDriverSaved }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    licenseNumber: driver?.licenseNumber || "",
    phone: driver?.phone || "",
    email: driver?.email || "",
    uniqueId: driver?.uniqueId || "",
  });

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Driver name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = driver ? `/api/drivers/${driver.id}` : '/api/drivers';
      const method = driver ? 'PUT' : 'POST';
      
      const response = await fetchOrThrow(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedDriver = await response.json();
        
        // Update Redux store
        if (driver) {
          // Update existing driver
          dispatch(driversActions.refresh([
            ...Object.values(dispatch.getState().drivers.items).filter(d => d.id !== driver.id),
            savedDriver
          ]));
        } else {
          // Add new driver
          dispatch(driversActions.refresh([
            ...Object.values(dispatch.getState().drivers.items),
            savedDriver
          ]));
        }
        
        setSuccess(true);
        onDriverSaved && onDriverSaved();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save driver");
      }
    } catch (err) {
      setError(err.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: driver?.name || "",
      licenseNumber: driver?.licenseNumber || "",
      phone: driver?.phone || "",
      email: driver?.email || "",
      uniqueId: driver?.uniqueId || "",
    });
    setError(null);
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
        <Typography>{driver ? "Edit Driver" : "Add Driver"}</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <TextField
          label="Driver Name"
          value={formData.name}
          onChange={handleInputChange("name")}
          className={classes.formField}
          size="small"
          fullWidth
          required
          placeholder="Enter driver name"
        />
        
        <TextField
          label="License Number"
          value={formData.licenseNumber}
          onChange={handleInputChange("licenseNumber")}
          className={classes.formField}
          size="small"
          fullWidth
          placeholder="Enter license number"
        />
        
        <TextField
          label="Phone"
          value={formData.phone}
          onChange={handleInputChange("phone")}
          className={classes.formField}
          size="small"
          fullWidth
          placeholder="Enter phone number"
        />
        
        <TextField
          label="Email"
          value={formData.email}
          onChange={handleInputChange("email")}
          className={classes.formField}
          size="small"
          fullWidth
          type="email"
          placeholder="Enter email address"
        />
        
        <TextField
          label="Unique ID"
          value={formData.uniqueId}
          onChange={handleInputChange("uniqueId")}
          className={classes.formField}
          size="small"
          fullWidth
          placeholder="Enter unique identifier"
        />
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
          Driver {driver ? "updated" : "created"} successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditDriverDialog;
