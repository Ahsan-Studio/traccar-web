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
import MapRouteDrawer from "./MapRouteDrawer";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    // Allow map interaction - same as MarkerDialog
    pointerEvents: "none",
    "& .MuiDialog-container": {
      pointerEvents: "none",
    },
    "& .MuiDialog-paper": {
      pointerEvents: "auto", // Dialog can receive clicks
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

      // Check if route has been drawn
      if (!formData.area) {
        alert("Please draw the route on the map first (click points to create path, right-click to undo)");
        return;
      }

      const payload = {
        name: formData.name,
        groupId: formData.groupId || 0,
        area: formData.area,
        attributes: {
          type: "route",
          color: formData.color,
          visible: formData.visible,
          nameVisible: formData.nameVisible,
          polylineDistance: parseFloat(formData.polylineDistance) || 100,
        },
      };

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
      />
      <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false} hideBackdrop={true} disableEnforceFocus={true}>
        <DialogTitle className={classes.dialogTitle}>
          Route properties
          <IconButton onClick={onClose} className={classes.closeButton} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className={classes.dialogContent}>
          {!route && (
            <Box sx={{ mb: 1.5, p: 1, backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '11px' }}>
              <Typography variant="caption" sx={{ color: '#1565c0', display: 'block', fontWeight: 500 }}>
                🖱️ Draw Route: Click points on map
              </Typography>
              <Typography variant="caption" sx={{ color: '#1565c0', display: 'block', fontSize: '10px' }}>
                • Double-click last point to finish<br/>
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
              placeholder="New route 1"
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
          <Typography className={classes.label}>Corridor Width (m)</Typography>
          <Box className={classes.inputWrapper}>
            <CustomInput
              type="number"
              value={formData.polylineDistance}
              onChange={handleInputChange("polylineDistance")}
              placeholder="100"
            />
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
          <Typography className={classes.label}>Route visible</Typography>
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

export default RouteDialog;
