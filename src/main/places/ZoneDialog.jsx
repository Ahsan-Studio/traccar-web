import { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  CustomInput,
  CustomButton,
  CustomCheckbox,
} from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import MapZoneDrawer from "./MapZoneDrawer";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    pointerEvents: "none",
    "& .MuiDialog-container": {
      pointerEvents: "none",
    },
    "& .MuiDialog-paper": {
      pointerEvents: "auto",
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
    maxHeight: "calc(100vh - 200px)",
    overflowY: "auto",
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
    width: "110px",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
  },
  select: {
    width: "100%",
    fontSize: "13px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ddd",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#aaa",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2b82d4",
    },
  },
  colorInput: {
    width: "120px",
    height: "36px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f5f5f5",
  },
}));

const ZoneDialog = ({ open, onClose, zone }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    groupId: 0,
    color: "#FF0000",
    visible: true,
    nameVisible: true,
    measureArea: false,
    area: null, // Store drawn zone area
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
    if (zone) {
      // Edit mode - populate with existing zone data
      setFormData({
        name: zone.name || "",
        groupId: zone.groupId || 0,
        color: zone.attributes?.color || "#FF0000",
        visible: zone.attributes?.visible !== false,
        nameVisible: zone.attributes?.nameVisible !== false,
        measureArea: zone.attributes?.measureArea || false,
        area: zone.area || null,
      });
    } else {
      // Create mode - reset form and enable drawing
      setFormData({
        name: "",
        groupId: 0,
        color: "#FF0000",
        visible: true,
        nameVisible: true,
        measureArea: false,
        area: null,
      });
      setDrawingEnabled(true); // Enable drawing for new zones
    }
  }, [zone, open]);

  // Handle zone drawn on map
  const handleZoneDrawn = (area) => {
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
        alert("Please enter a zone name");
        return;
      }

      // Check if zone has been drawn or is currently being drawn
      let areaToSave = formData.area;
      
      // If area is not set, try to get current drawing features
      if (!areaToSave && getCurrentFeaturesRef.current) {
        const features = getCurrentFeaturesRef.current();
        console.log('Current drawing features:', features);
        
        if (features && features.features && features.features.length > 0) {
          // Filter only Polygon features and get the last one (most recent)
          const polygonFeatures = features.features.filter(f => 
            f.geometry && f.geometry.type === 'Polygon'
          );
          
          console.log('Polygon features:', polygonFeatures);
          
          if (polygonFeatures.length > 0) {
            const feature = polygonFeatures[polygonFeatures.length - 1]; // Get last drawn
            console.log('Using feature:', feature);
            
            const coordinates = feature.geometry.coordinates[0]; // Get outer ring
            
            // Ensure we have at least 3 points for a valid Polygon (4 including closing point)
            if (coordinates && coordinates.length >= 4) {
              // Convert feature geometry to POLYGON format
              const coords = coordinates.map(coord => 
                `${coord[1]} ${coord[0]}` // lat lng format
              ).join(', ');
              areaToSave = `POLYGON ((${coords}))`;
              console.log('Generated POLYGON:', areaToSave);
            } else {
              console.warn('Polygon needs at least 3 points, got:', coordinates?.length - 1);
            }
          }
        }
      }
      
      if (!areaToSave) {
        alert("Please draw the zone on the map first (click at least 3 points to create polygon)");
        return;
      }

      const payload = {
        name: formData.name,
        groupId: formData.groupId === 0 ? null : formData.groupId, // Use null for ungrouped
        area: areaToSave, // Use the area we got (either from formData or current drawing)
        attributes: {
          type: "zone",
          color: formData.color,
          visible: formData.visible,
          nameVisible: formData.nameVisible,
          measureArea: formData.measureArea,
        },
      };

      // Add ID for update
      if (zone?.id) {
        payload.id = zone.id;
      }

      const url = zone?.id ? `/api/zones/${zone.id}` : "/api/zones";
      const method = zone?.id ? "PUT" : "POST";

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
        throw new Error(errorText || "Failed to save zone");
      }
    } catch (error) {
      console.error("Failed to save zone:", error);
      alert(`Failed to save zone: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setDrawingEnabled(false);
    onClose(false);
  };

  return (
    <>
      <MapZoneDrawer 
        enabled={drawingEnabled && open}
        onZoneChange={handleZoneDrawn}
        color={formData.color}
        onDrawReady={(fn) => { getCurrentFeaturesRef.current = fn; }}
      />
      <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false} hideBackdrop={true} disableEnforceFocus={true}>
        <DialogTitle className={classes.dialogTitle}>
          Zone properties
          <IconButton onClick={onClose} className={classes.closeButton} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className={classes.dialogContent}>
          {!zone && (
            <Box sx={{ mb: 1.5, p: 1, backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '11px' }}>
              <Typography variant="caption" sx={{ color: '#1565c0', display: 'block', fontWeight: 500 }}>
                🖱️ Draw Zone: Click points on map
              </Typography>
              <Typography variant="caption" sx={{ color: '#1565c0', display: 'block', fontSize: '10px' }}>
                • Double-click last point to finish<br/>
                • Or click first point again to close<br/>
                • Press Enter to finish
              </Typography>
            </Box>
          )}
          <Box className={classes.formRow}>
          <Typography className={classes.label}>Name</Typography>
          <Box className={classes.inputWrapper}>
            <CustomInput
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="New zone 1"
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

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Zone visible</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={formData.visible}
              onChange={handleCheckboxChange("visible")}
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Name visible</Typography>
          <Box className={classes.inputWrapper}>
            <CustomCheckbox
              checked={formData.nameVisible}
              onChange={handleCheckboxChange("nameVisible")}
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Measure area</Typography>
          <Box className={classes.inputWrapper}>
            <Select
              value={formData.measureArea ? "on" : "off"}
              onChange={(e) => setFormData((prev) => ({ ...prev, measureArea: e.target.value === "on" }))}
              className={classes.select}
              size="small"
            >
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="on">On</MenuItem>
            </Select>
          </Box>
        </Box>
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
    </>
  );
};

export default ZoneDialog;
