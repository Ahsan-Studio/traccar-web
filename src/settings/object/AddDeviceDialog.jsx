import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Alert,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { devicesActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import { CustomInput, CustomButton } from "../../common/components/custom";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "300px",
      maxWidth: "90vw",
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
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: '5px',
  },
  label: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#444444",
    width: "80px",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
  },
  dialogActions: {
    padding: theme.spacing(1),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  button: {
    fontSize: "11px",
    textTransform: "none",
    padding: "6px 20px",
    minWidth: "80px",
  },
}));

const AddDeviceDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.uniqueId.trim()) {
      setError("Nama dan IMEI harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const deviceData = {
        name: formData.name.trim(),
        uniqueId: formData.uniqueId.trim(),
        disabled: false,
      };

      const response = await fetchOrThrow("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      });

      const newDevice = await response.json();
      
      // Add device to Redux store
      dispatch(devicesActions.add(newDevice));
      
      setSuccess("Device berhasil ditambahkan");
      setFormData({ name: "", uniqueId: "" });
      
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1000);

    } catch (err) {
      console.error("Error creating device:", err);
      setError(err.message || "Gagal menambahkan device");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", uniqueId: "" });
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        Add object
        <IconButton
          onClick={handleCancel}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className={classes.dialogContent}>
        <Box className={classes.formRow}>
          <div className={classes.label}>Name</div>
          <div className={classes.inputWrapper}>
            <CustomInput
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder=""
              disabled={loading}
              fullWidth
            />
          </div>
        </Box>

        <Box className={classes.formRow}>
          <div className={classes.label}>IMEI</div>
          <div className={classes.inputWrapper}>
            <CustomInput
              value={formData.uniqueId}
              onChange={(e) => handleInputChange("uniqueId", e.target.value)}
              placeholder=""
              disabled={loading}
              fullWidth
            />
          </div>
        </Box>

        {error && (
          <Alert severity="error" sx={{ fontSize: "11px", mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ fontSize: "11px", mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <CustomButton
          onClick={handleSave}
          size="small"
          disabled={loading}
          className={classes.button}
        >
          <SaveIcon sx={{ fontSize: 14, marginRight: '4px' }} />
          Save
        </CustomButton>
        <CustomButton
          onClick={handleCancel}
          size="small"
          disabled={loading}
          variant="outlined"
          className={classes.button}
        >
          <CancelIcon sx={{ fontSize: 14, marginRight: '4px' }} />
          Cancel
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddDeviceDialog;
