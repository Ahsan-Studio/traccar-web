import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Typography,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  CustomButton,
  CustomCheckbox,
} from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import IconSelector from "./IconSelector";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    // Container tidak block pointer events - CRITICAL!
    pointerEvents: "none",
    "& .MuiDialog-container": {
      pointerEvents: "none",
    },
    "& .MuiDialog-paper": {
      pointerEvents: "auto", // Paper menerima pointer events
      width: "360px",
      maxWidth: "90vw",
      position: "fixed",
      left: "20px",
      top: "80px",
      margin: 0,
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "12px 16px",
    fontSize: "16px",
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
    backgroundColor: "white",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1.5),
  },
  label: {
    fontSize: "12px",
    fontWeight: 400,
    color: "#333",
    width: "100px",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
  },
  select: {
    width: "100%",
    fontSize: "12px",
    "& .MuiOutlinedInput-input": {
      padding: "6px 10px",
    },
  },
  textField: {
    width: "100%",
    "& .MuiOutlinedInput-input": {
      padding: "6px 10px",
      fontSize: "12px",
    },
  },
  tabs: {
    minHeight: "32px",
    marginBottom: theme.spacing(1),
    "& .MuiTab-root": {
      minHeight: "32px",
      fontSize: "11px",
      textTransform: "none",
      padding: "6px 12px",
    },
  },
  iconGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: theme.spacing(0.5),
    maxHeight: "280px",
    overflowY: "auto",
    padding: theme.spacing(1),
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fafafa",
  },
  iconButton: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "2px solid transparent",
    borderRadius: "4px",
    padding: "4px",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196F3",
    },
    "&.selected": {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196F3",
    },
  },
  iconImage: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const MarkerDialog = ({ open, onClose, marker, mapCenter, pickedLocation, onIconSelect }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupId: 0,
    icon: "pin-1.svg",
    visible: true,
    latitude: "",
    longitude: "",
  });
  const [groups, setGroups] = useState([{ id: 0, name: 'Ungrouped' }]);

  // Fetch groups from Traccar API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetchOrThrow('/api/geofence-groups');
        const data = await response.json();
        // Add "Ungrouped" as first option
        const allGroups = [
          { id: 0, name: 'Ungrouped' },
          ...(Array.isArray(data) ? data : [])
        ];
        setGroups(allGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        // Fallback to Ungrouped only
        setGroups([{ id: 0, name: 'Ungrouped' }]);
      }
    };

    if (open) {
      fetchGroups();
    }
  }, [open]);

  useEffect(() => {
    if (marker) {
      // Edit mode - parse existing marker data
      const areaMatch = marker.area?.match(/CIRCLE\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.]+)\s*\)/);
      
      setFormData({
        name: String(marker.name || ""),
        description: String(marker.description || ""),
        groupId: Number(marker.groupId) || 0,
        icon: String(marker.attributes?.icon || "default-green.svg"),
        visible: marker.attributes?.visible !== false,
        latitude: areaMatch ? String(areaMatch[1]) : "",
        longitude: areaMatch ? String(areaMatch[2]) : "",
      });
    } else {
      // Create mode - use map center if available
      setFormData({
        name: "",
        description: "",
        groupId: 0,
        icon: "default-green.svg",
        visible: true,
        latitude: mapCenter?.lat ? String(mapCenter.lat) : "",
        longitude: mapCenter?.lng ? String(mapCenter.lng) : "",
      });
    }
  }, [marker, mapCenter, open]);

  // Update lat/long when map is clicked
  useEffect(() => {
    if (pickedLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: String(pickedLocation.latitude.toFixed(6)),
        longitude: String(pickedLocation.longitude.toFixed(6)),
      }));
    }
  }, [pickedLocation]);

  const handleInputChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => (checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name) {
        alert("Please enter a marker name");
        return;
      }

      if (!formData.latitude || !formData.longitude) {
        alert("Please provide latitude and longitude coordinates");
        return;
      }

      // Validate groupId exists (if not 0/Ungrouped)
      if (formData.groupId && formData.groupId !== 0) {
        try {
          const groupResponse = await fetchOrThrow(`/api/geofence-groups/${formData.groupId}`);
          if (!groupResponse.ok) {
            alert("Selected group does not exist. Please select a valid group or use 'Ungrouped'.");
            return;
          }
        } catch (err) {
          console.error("Group validation error:", err);
          alert("Selected group does not exist. Using 'Ungrouped' instead.");
          formData.groupId = 0; // Fallback to Ungrouped
        }
      }

      // Construct CIRCLE geometry with default radius 500m
      const area = `CIRCLE (${formData.latitude} ${formData.longitude}, 500)`;

      const payload = {
        name: formData.name,
        description: formData.description || "",
        groupId: formData.groupId === 0 ? null : formData.groupId, // Use null for ungrouped
        area: area,
        attributes: {
          type: "marker",
          icon: formData.icon,
          visible: formData.visible,
        },
      };

      // Add ID for update
      if (marker?.id) {
        payload.id = marker.id;
      }

      const url = marker?.id ? `/api/markers/${marker.id}` : "/api/markers";
      const method = marker?.id ? "PUT" : "POST";

      const response = await fetchOrThrow(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onClose(true);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save marker");
      }
    } catch (error) {
      console.error("Failed to save marker:", error);
      alert(`Failed to save marker: ${error.message}`);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Only allow close via button, not backdrop or escape
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        onClose(false);
      }}
      className={classes.dialog}
      style={{ pointerEvents: 'none' }}
      maxWidth={false}
      hideBackdrop={true}
      disableEnforceFocus={true}
      disableAutoFocus={true}
      disableEscapeKeyDown={true}
      disablePortal={false}
      container={() => document.getElementById('root')}
    >
      <DialogTitle className={classes.dialogTitle}>
        Marker properties
        <IconButton onClick={handleCancel} className={classes.closeButton} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Name</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="New marker 2"
              className={classes.textField}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Description</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.description}
              onChange={handleInputChange("description")}
              placeholder=""
              className={classes.textField}
              size="small"
              variant="outlined"
              multiline
              rows={2}
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Group</Typography>
          <Box className={classes.inputWrapper}>
            <Select
              value={formData.groupId}
              onChange={(e) => setFormData((prev) => ({ ...prev, groupId: e.target.value }))}
              className={classes.select}
              size="small"
              displayEmpty
            >
              {(groups || []).map((group) => (
                <MenuItem key={`group-${group.id}`} value={group.id}>
                  {group.name || 'Unknown'}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Marker visible</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={formData.visible}
              onChange={handleCheckboxChange("visible")}
            />
          </Box>
        </Box>

        {/* Icon Selector Component */}
        <IconSelector
          value={formData.icon}
          onChange={(newIcon) => {
            setFormData(prev => ({
              ...prev,
              icon: newIcon
            }));
            // Notify parent for map preview
            if (onIconSelect) {
              onIconSelect(newIcon);
            }
          }}
        />
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

export default MarkerDialog;
