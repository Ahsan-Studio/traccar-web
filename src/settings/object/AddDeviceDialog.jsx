import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useDispatch } from "react-redux";
import { devicesActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "400px",
      height: "300px",
    },
  },
  dialogContent: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  formLabel: {
    width: "40%",
    fontSize: "11px",
    fontWeight: 500,
    color: "#333",
  },
  formField: {
    width: "60%",
    "& .MuiOutlinedInput-root": {
      height: "24px",
      fontSize: "11px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "11px",
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
  },
  actionButton: {
    fontSize: "11px",
    textTransform: "none",
    padding: "6px 16px",
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
    <>
      <Dialog
        open={open}
        onClose={handleCancel}
        className={classes.dialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "14px", fontWeight: 600 }}>
          Tambah Device Baru
        </DialogTitle>
        
        <DialogContent className={classes.dialogContent}>
        <Box mt={2} sx={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
            <div className={classes.label}>Nama</div>
            <TextField
              className={classes.textField}
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Masukkan nama device"
              variant="outlined"
              size="small"
              disabled={loading}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.formLabel}>
              IMEI *
            </Typography>
            <TextField
              className={classes.formField}
              value={formData.uniqueId}
              onChange={(e) => handleInputChange("uniqueId", e.target.value)}
              placeholder="Masukkan IMEI device"
              variant="outlined"
              size="small"
              disabled={loading}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ fontSize: "11px" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ fontSize: "11px" }}>
              {success}
            </Alert>
          )}
        </DialogContent>

        <DialogActions className={classes.dialogActions}>
          <Button
            onClick={handleCancel}
            className={classes.actionButton}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className={classes.actionButton}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </>
  );
};

export default AddDeviceDialog;
