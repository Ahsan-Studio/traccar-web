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
import MapRouteDrawer from "./MapRouteDrawer";

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
  colorInput: {
    width: "55px",
    height: "24px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    cursor: "pointer",
    padding: "1px",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 12px 10px 12px",
    backgroundColor: "white",
  },
}));

const RouteDialog = ({ open, onClose, route }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    groupId: 0,
    polylineDistance: "100",
    color: "#2196F3",
    visible: true,
    nameVisible: true,
    area: null, // Store drawn route area
  });
  const [groups, setGroups] = useState([{ id: 0, name: 'Ungrouped' }]);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const getCurrentFeaturesRef = useRef(null); // Ref to store function to get current drawing

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
    if (route) {
      // Edit mode - populate with existing route data
      setFormData({
        name: route.name || "",
        groupId: route.groupId || 0,
        polylineDistance: route.attributes?.polylineDistance?.toString() || "100",
        color: route.attributes?.color || "#2196F3",
        visible: route.attributes?.visible !== false,
        nameVisible: route.attributes?.nameVisible !== false,
        area: route.area || null,
      });
      setDrawingEnabled(true); // Enable drawing for editing too
    } else {
      // Create mode - reset form and enable drawing
      setFormData({
        name: "",
        groupId: 0,
        polylineDistance: "100",
        color: "#2196F3",
        visible: true,
        nameVisible: true,
        area: null,
      });
      setDrawingEnabled(true); // Enable drawing for new routes
    }
  }, [route, open]);

  // Handle route drawn on map
  const handleRouteDrawn = (area) => {
    setFormData((prev) => ({ ...prev, area }));
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => (checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name) {
        alert("Please enter a route name");
        return;
      }

      // Check if route has been drawn or is currently being drawn
      let areaToSave = formData.area;
      
      // If area is not set, try to get current drawing features
      if (!areaToSave && getCurrentFeaturesRef.current) {
        const features = getCurrentFeaturesRef.current();
        console.log('Current drawing features:', features);
        
        if (features && features.features && features.features.length > 0) {
          // Filter only LineString features and get the last one (most recent)
          const lineStringFeatures = features.features.filter(f => 
            f.geometry && f.geometry.type === 'LineString'
          );
          
          console.log('LineString features:', lineStringFeatures);
          
          if (lineStringFeatures.length > 0) {
            const feature = lineStringFeatures[lineStringFeatures.length - 1]; // Get last drawn
            console.log('Using feature:', feature);
            
            const coordinates = feature.geometry.coordinates;
            
            // Ensure we have at least 2 points for a valid LineString
            if (coordinates && coordinates.length >= 2) {
              // Convert feature geometry to LINESTRING format
              const coords = coordinates.map(coord => 
                `${coord[1]} ${coord[0]}` // lat lng format
              ).join(', ');
              areaToSave = `LINESTRING (${coords})`;
              console.log('Generated LINESTRING:', areaToSave);
            } else {
              console.warn('LineString needs at least 2 points, got:', coordinates?.length);
            }
          }
        }
      }
      
      if (!areaToSave) {
        alert("Please draw the route on the map first (click at least 2 points to create path)");
        return;
      }

      const payload = {
        name: formData.name,
        area: areaToSave, // Use the area we got (either from formData or current drawing)
        attributes: {
          type: "route",
          color: formData.color,
          visible: formData.visible,
          nameVisible: formData.nameVisible,
          polylineDistance: parseFloat(formData.polylineDistance) || 100,
        },
      };

      // Only include groupId if a real group is selected (fixes null groupId API bug)
      if (formData.groupId && formData.groupId !== 0) {
        payload.groupId = formData.groupId;
      }

      // Add ID for update
      if (route?.id) {
        payload.id = route.id;
      }

      const url = route?.id ? `/api/routes/${route.id}` : "/api/routes";
      const method = route?.id ? "PUT" : "POST";

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
        throw new Error(errorText || "Failed to save route");
      }
    } catch (error) {
      console.error("Failed to save route:", error);
      alert(`Failed to save route: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setDrawingEnabled(false);
    onClose(false);
  };

  return (
    <>
      <MapRouteDrawer 
        enabled={drawingEnabled && open}
        onRouteChange={handleRouteDrawn}
        color={formData.color}
        polylineDistance={parseInt(formData.polylineDistance) || 100}
        onDrawReady={(fn) => { getCurrentFeaturesRef.current = fn; }}
        initialArea={route?.area}
      />
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
          Route properties
        </Box>

        <DialogContent className={classes.content}>
          {/* Name */}
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Name</Typography>
            <Box className={classes.inputWrapper}>
              <TextField
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="New route 1"
                className={classes.textField}
                size="small"
                variant="outlined"
                inputProps={{ maxLength: 25 }}
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

          {/* Color */}
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Color</Typography>
            <Box className={classes.inputWrapper}>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className={classes.colorInput}
              />
            </Box>
          </Box>

          {/* Route visible */}
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Route visible</Typography>
            <Box className={classes.inputWrapper}>
              <CustomCheckbox
                checked={formData.visible}
                onChange={handleCheckboxChange("visible")}
              />
            </Box>
          </Box>

          {/* Name visible */}
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Name visible</Typography>
            <Box className={classes.inputWrapper}>
              <CustomCheckbox
                checked={formData.nameVisible}
                onChange={handleCheckboxChange("nameVisible")}
              />
            </Box>
          </Box>

          {/* Deviation / Corridor Width */}
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Deviation (m)</Typography>
            <Box className={classes.inputWrapper}>
              <TextField
                type="number"
                value={formData.polylineDistance}
                onChange={handleInputChange("polylineDistance")}
                placeholder="100"
                className={classes.textField}
                size="small"
                variant="outlined"
                inputProps={{ min: 0 }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Save / Cancel buttons */}
        <Box className={classes.actions}>
          <CustomButton
            onClick={handleSave}
            variant="primary"
            icon={<SaveIcon style={{ fontSize: 13 }} />}
            disabled={!formData.name || !formData.area}
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
    </>
  );
};

export default RouteDialog;
