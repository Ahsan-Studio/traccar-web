import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
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

const useStyles = makeStyles()(() => ({
  dialog: {
    pointerEvents: "none",
    "& .MuiDialog-container": {
      pointerEvents: "none",
    },
    "& .MuiDialog-paper": {
      pointerEvents: "auto",
      width: "330px",
      maxWidth: "90vw",
      position: "fixed",
      left: "20px",
      top: "80px",
      margin: 0,
      overflow: "visible",
      borderRadius: "4px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    },
  },
  titleBar: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: "18px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: "-8px",
    top: "-8px",
    width: "20px",
    height: "20px",
    padding: 0,
    backgroundColor: "#e74c3c",
    color: "white",
    border: "2px solid white",
    borderRadius: "50%",
    zIndex: 1,
    "&:hover": {
      backgroundColor: "#c0392b",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "12px",
    },
  },
  content: {
    padding: "10px 12px 6px 12px",
    backgroundColor: "white",
    "&.MuiDialogContent-root": {
      padding: "10px 12px 6px 12px",
    },
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "3px",
    width: "100%",
    lineHeight: "12px",
  },
  formRowTop: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "3px",
    width: "100%",
    lineHeight: "12px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#333",
    width: "40%",
    flexShrink: 0,
    lineHeight: "24px",
  },
  inputWrapper: {
    width: "60%",
  },
  select: {
    width: "100%",
    fontSize: "11px",
    "& .MuiOutlinedInput-input": {
      padding: "4px 8px",
      fontSize: "11px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ccc",
    },
    "& .MuiSelect-icon": {
      right: "4px",
    },
  },
  textField: {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      fontSize: "11px",
    },
    "& .MuiOutlinedInput-input": {
      padding: "4px 5px",
      fontSize: "11px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ccc",
    },
  },
  textArea: {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      fontSize: "11px",
      padding: "5px",
    },
    "& .MuiOutlinedInput-input": {
      fontSize: "11px",
      padding: 0,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ccc",
    },
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px 10px 12px",
    backgroundColor: "white",
  },
}));

const MarkerDialog = ({ open, onClose, marker, pickedLocation, onIconSelect }) => {
  const { classes } = useStyles();
  const initializedRef = useRef(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupId: 0,
    icon: "pin-1.svg",
    visible: true,
    latitude: "",
    longitude: "",
    radius: "500",
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
    if (!open) {
      initializedRef.current = false;
      return;
    }
    // Only initialize form once when dialog opens
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (marker) {
      // Edit mode - parse existing marker data
      const areaMatch = marker.area?.match(/CIRCLE\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*,\s*([0-9.]+)\s*\)/);
      
      setFormData({
        name: String(marker.name || ""),
        description: String(marker.description || ""),
        groupId: Number(marker.groupId) || 0,
        icon: String(marker.attributes?.icon || "pin-1.svg"),
        visible: marker.attributes?.visible !== false,
        latitude: areaMatch ? String(areaMatch[1]) : "",
        longitude: areaMatch ? String(areaMatch[2]) : "",
        radius: areaMatch ? String(areaMatch[3]) : "500",
      });
    } else {
      // Create mode
      setFormData({
        name: "",
        description: "",
        groupId: 0,
        icon: "pin-1.svg",
        visible: true,
        latitude: "",
        longitude: "",
        radius: "500",
      });
    }
  }, [marker, open]);

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

      // Construct CIRCLE geometry with user-specified radius
      const radius = parseFloat(formData.radius) || 500;
      const area = `CIRCLE (${formData.latitude} ${formData.longitude}, ${radius})`;

      const payload = {
        name: formData.name,
        description: formData.description || "",
        area: area,
        attributes: {
          type: "marker",
          icon: formData.icon,
          visible: formData.visible,
        },
      };

      // Only include groupId if a real group is selected (fixes null groupId API bug)
      if (formData.groupId && formData.groupId !== 0) {
        payload.groupId = formData.groupId;
      }

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
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose(false);
      }}
      className={classes.dialog}
      style={{ pointerEvents: 'none' }}
      maxWidth={false}
      hideBackdrop
      disableEnforceFocus
      disableAutoFocus
      disableEscapeKeyDown
      container={() => document.getElementById('root')}
    >
      {/* Red circle close button - V1 style */}
      <IconButton onClick={handleCancel} className={classes.closeButton} size="small">
        <CloseIcon />
      </IconButton>

      {/* Title bar */}
      <Box className={classes.titleBar}>
        Marker properties
      </Box>

      <DialogContent className={classes.content}>
        {/* Name */}
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Name</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="New marker 1"
              className={classes.textField}
              size="small"
              variant="outlined"
              inputProps={{ maxLength: 25 }}
            />
          </Box>
        </Box>

        {/* Description */}
        <Box className={classes.formRowTop}>
          <Typography className={classes.label} style={{ paddingTop: '5px' }}>Description</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.description}
              onChange={handleInputChange("description")}
              className={classes.textArea}
              size="small"
              variant="outlined"
              multiline
              rows={3}
              inputProps={{ maxLength: 200 }}
            />
          </Box>
        </Box>

        {/* Group */}
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
                <MenuItem key={`group-${group.id}`} value={group.id} sx={{ fontSize: '11px' }}>
                  {group.name || 'Unknown'}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        {/* Marker visible */}
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Marker visible</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={formData.visible}
              onChange={handleCheckboxChange("visible")}
            />
          </Box>
        </Box>

        {/* Radius */}
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Radius (m)</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.radius}
              onChange={handleInputChange("radius")}
              placeholder="500"
              className={classes.textField}
              size="small"
              variant="outlined"
              type="number"
              inputProps={{ min: 1, maxLength: 11 }}
            />
          </Box>
        </Box>

        {/* Icon Selector - Default / Custom tabs */}
        <IconSelector
          value={formData.icon}
          onChange={(newIcon) => {
            setFormData((prev) => ({ ...prev, icon: newIcon }));
            if (onIconSelect) onIconSelect(newIcon);
          }}
        />
      </DialogContent>

      {/* Save / Cancel buttons */}
      <Box className={classes.actions}>
        <CustomButton
          onClick={handleSave}
          variant="primary"
          icon={<SaveIcon style={{ fontSize: 13 }} />}
        >
          Save
        </CustomButton>
        <CustomButton
          onClick={handleCancel}
          variant="secondary"
          icon={<CancelIcon style={{ fontSize: 13 }} />}
        >
          Cancel
        </CustomButton>
      </Box>
    </Dialog>
  );
};

export default MarkerDialog;
