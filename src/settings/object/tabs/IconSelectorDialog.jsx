import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  IconButton,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import fetchOrThrow from "../../../common/util/fetchOrThrow";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "600px",
      height: "500px",
      maxWidth: "90vw",
      maxHeight: "90vh",
    },
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  dialogContent: {
    padding: 0,
    height: "calc(100% - 80px)",
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "48px",
    "& .MuiTab-root": {
      fontSize: "12px",
      fontWeight: 500,
      textTransform: "none",
      minHeight: "48px",
    },
  },
  tabContent: {
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    overflow: "auto",
  },
  iconGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  },
  iconItem: {
    width: "60px",
    height: "60px",
    border: "2px solid transparent",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#f5f5f5",
    "&:hover": {
      backgroundColor: "#e0e0e0",
      borderColor: "#4a90e2",
    },
    "&.selected": {
      borderColor: "#4a90e2",
      backgroundColor: "#e3f2fd",
    },
  },
  iconImage: {
    maxWidth: "50px",
    maxHeight: "50px",
    objectFit: "contain",
  },
  customTabContent: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    padding: theme.spacing(4),
    textAlign: "center",
  },
  uploadArea: {
    width: "100%",
    height: "200px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.3s",
    "&:hover": {
      borderColor: "#4a90e2",
      backgroundColor: "#f5f5f5",
    },
    "&.dragOver": {
      borderColor: "#4a90e2",
      backgroundColor: "#e3f2fd",
    },
  },
  uploadText: {
    fontSize: "14px",
    color: "#666",
    marginTop: theme.spacing(1),
  },
  uploadButton: {
    marginTop: theme.spacing(2),
    fontSize: "12px",
    textTransform: "none",
  },
  customIconGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    maxHeight: "300px",
    overflow: "auto",
  },
  customIconItem: {
    position: "relative",
    width: "60px",
    height: "60px",
    border: "2px solid transparent",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#f5f5f5",
    "&:hover": {
      backgroundColor: "#e0e0e0",
      borderColor: "#4a90e2",
    },
    "&.selected": {
      borderColor: "#4a90e2",
      backgroundColor: "#e3f2fd",
    },
  },
  deleteButton: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    width: "20px",
    height: "20px",
    minWidth: "20px",
    backgroundColor: "#f44336",
    color: "white",
    "&:hover": {
      backgroundColor: "#d32f2f",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "12px",
    },
  },
  deleteAllButton: {
    marginTop: theme.spacing(2),
    fontSize: "12px",
    textTransform: "none",
    color: "#f44336",
    "&:hover": {
      backgroundColor: "rgba(244, 67, 54, 0.1)",
    },
  },
  emptyState: {
    color: "#999",
    fontSize: "14px",
    marginTop: theme.spacing(2),
  },
  previewContainer: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  previewImage: {
    maxWidth: "200px",
    maxHeight: "200px",
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    gap: theme.spacing(1),
    justifyContent: "center",
    marginTop: theme.spacing(2),
  },
  uploadActionButton: {
    fontSize: "12px",
    textTransform: "none",
    minWidth: "100px",
  },
}));

const IconSelectorDialog = ({ open, onClose, onIconSelect, currentIcon, deviceId, deviceUniqueId }) => {
  const { classes } = useStyles();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState(currentIcon || "");
  const [defaultIcons, setDefaultIcons] = useState([]);
  const [customIcons, setCustomIcons] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load default icons from public/img/markers/objects
  useEffect(() => {
    const loadDefaultIcons = async () => {
      try {
        // Get list of icon files from the markers/objects directory
        const iconFiles = [
          "gadget-smartphone.svg", "gadget-tablet.svg", "land-ambulance.svg",
          "land-bicycle-1.svg", "land-bicycle.svg", "land-bus-1.svg", "land-bus-2.svg",
          "land-bus.svg", "land-car-1.svg", "land-car-2.svg", "land-car-3.svg",
          "land-car-4.svg", "land-car.svg", "land-caravan-1.svg", "land-caravan.svg",
          "land-concrete-mixer.svg", "land-crane-2.svg", "land-crane-3.svg",
          "land-crane-4.svg", "land-crane.svg", "land-demolishing-1.svg",
          "land-demolishing.svg", "land-dump-truck-1.svg", "land-dump-truck.svg",
          "land-electric-car.svg", "land-forklift-1.svg", "land-forklift.svg",
          "land-lifter-1.svg", "land-lifter.svg", "land-loader-1.svg",
          "land-loader-2.svg", "land-loader.svg", "land-moon-rover-1.svg",
          "land-motorbike.svg", "land-pickup-truck.svg", "land-police-car-1.svg",
          "land-police-car.svg", "land-quad.svg", "land-satellite.svg",
          "land-school-bus.svg", "land-segway.svg", "land-snowplow.svg",
          "land-taxi.svg", "land-tractor-1.svg", "land-tractor-2.svg",
          "land-tractor.svg", "land-train-2.svg", "land-train.svg",
          "land-tram-1.svg", "land-tram.svg", "land-trolley.svg",
          "land-trolleybus-1.svg", "land-trolleybus.svg", "land-truck-1.svg",
          "land-truck-2.svg", "land-truck-3.svg", "land-truck-4.svg",
          "land-truck-5.svg", "land-truck-6.svg", "land-truck.svg",
          "other-container.svg", "people-astronaut.svg", "people-builder.svg",
          "people-businessman.svg", "people-detective.svg", "people-doctor.svg",
          "people-firefighter.svg", "people-motorcyclist.svg", "people-pilot.svg",
          "people-policeman.svg", "people-soldier.svg", "people-taxi-driver.svg",
          "sea-ship-1.svg", "sea-ship.svg", "sea-speedboat.svg", "sea-submarine.svg",
          "sky-aeroplane.svg", "sky-cable-car-cabin-1.svg", "sky-cable-car-cabin.svg",
          "sky-drone.svg", "sky-helicopter.svg", "sky-hot-air-balloon.svg",
          "space-ship.svg", "space-shuttle.svg", "space-station.svg", "space-ufo.svg"
        ];

        const icons = iconFiles.map(filename => ({
          name: filename.replace('.svg', ''),
          filename: filename,
          url: `/img/markers/objects/${filename}`
        }));

        setDefaultIcons(icons);
      } catch (error) {
        console.error("Error loading default icons:", error);
      }
    };

    loadDefaultIcons();
  }, []);

  // Load custom icons from API
  useEffect(() => {
    const loadCustomIcons = async () => {
      if (!deviceUniqueId) return;
      
      try {
        // Try to get existing device image
        const response = await fetchOrThrow(`/api/media/${deviceUniqueId}/deviceImage`);
        if (response.ok) {
          const customIcon = {
            id: 'device-image',
            name: 'Device Image',
            url: `/api/media/${deviceUniqueId}/deviceImage`,
            filename: 'deviceImage'
          };
          setCustomIcons([customIcon]);
        }
      } catch {
        // No custom image exists, this is normal
        console.log("No custom device image found");
        setCustomIcons([]);
      }
    };

    if (open && deviceUniqueId) {
      loadCustomIcons();
    }
  }, [open, deviceUniqueId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleIconClick = (icon) => {
    const iconUrl = icon.url || icon;
    setSelectedIcon(iconUrl);
    
    // For default icons, send only the filename to match API format
    let selectedIconUrl = iconUrl;
    if (iconUrl && iconUrl.startsWith('/img/markers/objects/')) {
      selectedIconUrl = iconUrl.replace('/img/markers/objects/', '');
    }
    
    // Auto-select when icon is clicked
    onIconSelect(selectedIconUrl);
    onClose();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    // Store the file for later upload
    setSelectedFile(file);
    setError("");
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    
    if (!deviceId) {
      setError("Device ID tidak tersedia untuk upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Try different approaches for upload
      let response;
      
      // Approach 1: Direct binary upload with image/jpeg content type
      console.log("Trying direct binary upload...");
      response = await fetchOrThrow(`/api/devices/${deviceId}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg', // Force image/jpeg content type
        },
        body: selectedFile,
      });
      
      // If direct upload fails, try FormData
      if (!response.ok && response.status === 415) {
        console.log("Direct upload failed, trying FormData...");
        
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        response = await fetchOrThrow(`/api/devices/${deviceId}/image`, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type, let browser set it automatically
        });
      }
      
      // If both fail, try with different field name
      if (!response.ok && response.status === 415) {
        console.log("FormData failed, trying with different field name...");
        
        const formData = new FormData();
        formData.append('file', selectedFile); // Try 'file' instead of 'image'
        
        response = await fetchOrThrow(`/api/devices/${deviceId}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      if (response.ok) {
        // Upload successful, add to custom icons
        const newIcon = {
          id: 'device-image',
          name: 'Device Image',
          url: `/api/media/${deviceUniqueId}/deviceImage`,
          filename: 'deviceImage'
        };
        setCustomIcons([newIcon]);
        
        // Auto-select the uploaded image
        onIconSelect(newIcon.url);
        
        // Clear preview
        setPreviewImage(null);
        setSelectedFile(null);
        
        // Close dialog
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(error.message || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleClearPreview = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Create a fake event for the file input
      const fakeEvent = {
        target: {
          files: [imageFile]
        }
      };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDeleteCustomIcon = async (iconId, e) => {
    e.stopPropagation();
    
    if (!deviceId) {
      setError("Device ID tidak tersedia untuk delete");
      return;
    }

    try {
      // Call DELETE API to remove the image
      await fetchOrThrow(`/api/devices/${deviceId}/image`, {
        method: 'DELETE',
      });
      
      // Remove from local state
      setCustomIcons([]);
      
      // If the deleted icon was selected, clear selection
      if (selectedIcon === customIcons.find(icon => icon.id === iconId)?.url) {
        setSelectedIcon("");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      setError(error.message || "Gagal menghapus gambar");
    }
  };

  const handleDeleteAllCustomIcons = async () => {
    if (!deviceId) {
      setError("Device ID tidak tersedia untuk delete");
      return;
    }

    try {
      // Call DELETE API to remove the image
      await fetchOrThrow(`/api/devices/${deviceId}/image`, {
        method: 'DELETE',
      });
      
      setCustomIcons([]);
      setSelectedIcon("");
    } catch (error) {
      console.error("Error deleting image:", error);
      setError(error.message || "Gagal menghapus gambar");
    }
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
        <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 600 }}>
          Select icon
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ padding: "4px" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className={classes.tabs}
        >
          <Tab label="Default" />
          <Tab label="Buatan sendiri" />
        </Tabs>

        <Box className={classes.tabContent}>
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2, fontSize: "12px" }}>
              {error}
            </Alert>
          )}

          {activeTab === 0 && (
            <Box className={classes.iconGrid}>
              {defaultIcons.map((icon, index) => (
                <Box
                  key={index}
                  className={`${classes.iconItem} ${
                    selectedIcon === icon.url ? "selected" : ""
                  }`}
                  onClick={() => handleIconClick(icon)}
                >
                  <img
                    src={icon.url}
                    alt={icon.name}
                    className={classes.iconImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {!previewImage ? (
                <>
                  <Box
                    className={`${classes.uploadArea} ${dragOver ? "dragOver" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('icon-upload').click()}
                  >
                    <CloudUploadIcon sx={{ fontSize: "48px", color: "#ccc" }} />
                    <Typography className={classes.uploadText}>
                      Drag & drop files here or click to upload
                    </Typography>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </Box>

                  {customIcons.length > 0 && (
                    <>
                      <Box className={classes.customIconGrid}>
                        {customIcons.map((icon) => (
                          <Box
                            key={icon.id}
                            className={`${classes.customIconItem} ${
                              selectedIcon === icon.url ? "selected" : ""
                            }`}
                            onClick={() => handleIconClick(icon)}
                          >
                            <img
                              src={icon.url}
                              alt={icon.name}
                              className={classes.iconImage}
                            />
                            <IconButton
                              className={classes.deleteButton}
                              onClick={(e) => handleDeleteCustomIcon(icon.id, e)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                      <Button
                        variant="text"
                        className={classes.deleteAllButton}
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteAllCustomIcons}
                      >
                        Hapus semua
                      </Button>
                    </>
                  )}

                  {customIcons.length === 0 && !previewImage && (
                    <Typography className={classes.emptyState}>
                      No custom icons uploaded yet
                    </Typography>
                  )}
                </>
              ) : (
                <Box className={classes.previewContainer}>
                  <Typography variant="subtitle2" sx={{ fontSize: "13px", marginBottom: 2, textAlign: "center", fontWeight: 600 }}>
                    Preview
                  </Typography>
                  <img
                    src={previewImage}
                    alt="Preview"
                    className={classes.previewImage}
                  />
                  <Box className={classes.buttonContainer}>
                    <Button
                      variant="contained"
                      color="primary"
                      className={classes.uploadActionButton}
                      startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                      onClick={handleUploadClick}
                      disabled={uploading}
                    >
                      {uploading ? "Mengupload..." : "Upload"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      className={classes.uploadActionButton}
                      onClick={handleClearPreview}
                      disabled={uploading}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default IconSelectorDialog;
