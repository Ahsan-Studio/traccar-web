import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { driversActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  TextField,
  Alert,
  Snackbar,
  Box,
  Avatar,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "600px",
      maxWidth: "90vw",
      height: "400px",
      maxHeight: "100%",
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
    marginTop: theme.spacing(2),
    display: "flex",
    gap: theme.spacing(2),
    height: "100%",
    alignItems: "flex-start",
  },
  leftColumn: {
    width: "40%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: theme.spacing(0),
    paddingTop: theme.spacing(0),
  },
  rightColumn: {
    width: "60%",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0),
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  formLabel: {
    width: "40%",
    fontSize: "11px",
    fontWeight: 400,
    color: "#686868",
    paddingRight: theme.spacing(2),
  },
  formField: {
    width: "60%",
    "& .MuiOutlinedInput-root": {
      fontSize: "11px",
      height: "24px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "11px",
    },
  },
  textAreaField: {
    width: "60%",
    "& .MuiOutlinedInput-root": {
      fontSize: "11px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "11px",
    },
  },
  photoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(0),
    height: "250px",
    width: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0px dashed #ccc",
  },
  photoButtons: {
    display: "flex",
    gap: theme.spacing(1),
  },
  photoButton: {
    fontSize: "11px",
    padding: "6px 12px",
    minWidth: "60px",
  },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f5f5f5",
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(1),
  },
  actionButton: {
    fontSize: "12px",
    padding: "6px 16px",
  },
}));

const EditDriverDialog = ({ open, onClose, driver, onDriverSaved }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.drivers.items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    id: driver?.id || 0,
    name: driver?.name || "",
    uniqueId: driver?.uniqueId || "",
    attributes: {
      identityNumber: driver?.attributes?.identityNumber || "",
      address: driver?.attributes?.address || "",
      phone: driver?.attributes?.phone || "",
      email: driver?.attributes?.email || "",
      description: driver?.attributes?.description || "",
    }
  });

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAttributesChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [field]: event.target.value
      }
    }));
  };

  // Load existing photo when driver is provided
  useEffect(() => {
    if (driver && driver.id) {
      loadDriverPhoto(driver.id);
    } else {
      setPhotoUrl(null);
    }
  }, [driver]);

  const loadDriverPhoto = async (driverId) => {
    try {
      const response = await fetchOrThrow(`/api/drivers/${driverId}/image`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPhotoUrl(imageUrl);
      } else {
        setPhotoUrl(null);
      }
    } catch (error) {
      console.log('No photo found for driver:', error);
      setPhotoUrl(null);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setPhoto(file);
    setUploadingPhoto(true);
    setError(null);

    try {
      // If driver exists, upload immediately
      if (driver && driver.id) {
        await uploadPhotoToServer(driver.id, file);
      } else {
        // If new driver, just preview the image
        const imageUrl = URL.createObjectURL(file);
        setPhotoUrl(imageUrl);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadPhotoToServer = async (driverId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetchOrThrow(`/api/drivers/${driverId}/image`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (response.ok) {
      // Reload the photo from server
      await loadDriverPhoto(driverId);
    } else {
      throw new Error('Failed to upload photo');
    }
  };

  const handlePhotoDelete = async () => {
    if (!driver || !driver.id) {
      setPhoto(null);
      setPhotoUrl(null);
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const response = await fetchOrThrow(`/api/drivers/${driver.id}/image`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhoto(null);
        setPhotoUrl(null);
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      setError('Failed to delete photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Nama pengemudi wajib diisi");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare data according to the payload structure
      const driverData = {
        id: formData.id,
        name: formData.name,
        uniqueId: formData.uniqueId,
        attributes: formData.attributes
      };

      const url = driver ? `/api/drivers/${driver.id}` : '/api/drivers';
      const method = driver ? 'PUT' : 'POST';
      
      console.log('Saving driver data:', driverData);
      console.log('Expected payload format:', {
        "id": 0,
        "name": "John Doe",
        "uniqueId": "RFID123456",
        "attributes": {
          "identityNumber": "3201234567890123",
          "address": "Jl. Merdeka No. 123, Jakarta",
          "phone": "+6281234567890",
          "email": "john.doe@email.com",
          "description": "Driver profesional dengan pengalaman 5 tahun"
        }
      });
      
      const response = await fetchOrThrow(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      if (response.ok) {
        const savedDriver = await response.json();
        
        // Update Redux store
        if (driver) {
          // Update existing driver
          dispatch(driversActions.refresh([
            ...Object.values(drivers).filter(d => d.id !== driver.id),
            savedDriver
          ]));
        } else {
          // Add new driver
          dispatch(driversActions.refresh([
            ...Object.values(drivers),
            savedDriver
          ]));
        }
        
        // Upload photo if it's a new driver and photo is selected
        if (!driver && photo) {
          try {
            await uploadPhotoToServer(savedDriver.id, photo);
          } catch (photoError) {
            console.error('Failed to upload photo for new driver:', photoError);
            // Don't fail the entire operation for photo upload error
          }
        }

        setSuccess(true);
        onDriverSaved && onDriverSaved();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal menyimpan pengemudi");
      }
    } catch (err) {
      setError(err.message || "Gagal menyimpan pengemudi");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: driver?.id || 0,
      name: driver?.name || "",
      uniqueId: driver?.uniqueId || "",
      attributes: {
        identityNumber: driver?.attributes?.identityNumber || "",
        address: driver?.attributes?.address || "",
        phone: driver?.attributes?.phone || "",
        email: driver?.attributes?.email || "",
        description: driver?.attributes?.description || "",
      }
    });
    setPhoto(null);
    setPhotoUrl(null);
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
        <Typography>Properti pengemudi objek</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Left Column - Photo Upload */}
        <Box className={classes.leftColumn}>
          <Box className={classes.photoContainer}>
            <Box className={classes.photoPlaceholder}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Driver photo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
              ) : (
                <Avatar sx={{ width: 60, height: 60, backgroundColor: "#ccc" }}>
                  <Typography variant="h6" color="text.secondary">
                    👤
                  </Typography>
                </Avatar>
              )}
            </Box>
            <Box className={classes.photoButtons}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="outlined"
                  size="small"
                  className={classes.photoButton}
                  sx={{ fontSize: "11px" }}
                  component="span"
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? "Uploading..." : "Unggah"}
                </Button>
              </label>
              <Button
                variant="outlined"
                size="small"
                className={classes.photoButton}
                sx={{ fontSize: "11px" }}
                onClick={handlePhotoDelete}
                disabled={uploadingPhoto || !photoUrl}
              >
                Hapus
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right Column - Form Fields */}
        <Box className={classes.rightColumn}>
          <div className={classes.formRow}>
            <div className={classes.formLabel}>Nama</div>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              className={classes.formField}
              size="small"
              required
              placeholder="Enter driver name"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>RFID or iButton</div>
            <TextField
              value={formData.uniqueId}
              onChange={handleInputChange("uniqueId")}
              className={classes.formField}
              size="small"
              placeholder="Enter RFID or iButton"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>Nomor identitas</div>
            <TextField
              value={formData.attributes.identityNumber}
              onChange={handleAttributesChange("identityNumber")}
              className={classes.formField}
              size="small"
              placeholder="Enter identity number"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>Alamat</div>
            <TextField
              value={formData.attributes.address}
              onChange={handleAttributesChange("address")}
              className={classes.formField}
              size="small"
              placeholder="Enter address"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>Phone</div>
            <TextField
              value={formData.attributes.phone}
              onChange={handleAttributesChange("phone")}
              className={classes.formField}
              size="small"
              placeholder="Enter phone number"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>E-mail</div>
            <TextField
              value={formData.attributes.email}
              onChange={handleAttributesChange("email")}
              className={classes.formField}
              size="small"
              type="email"
              placeholder="Enter email address"
            />
          </div>
          
          <div className={classes.formRow}>
            <div className={classes.formLabel}>Diskripsi</div>
            <TextField
              value={formData.attributes.description}
              onChange={handleAttributesChange("description")}
              className={classes.textAreaField}
              size="small"
              multiline
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </Box>
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
          Pengemudi berhasil {driver ? "diperbarui" : "dibuat"}!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditDriverDialog;
