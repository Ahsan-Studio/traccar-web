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
  Tabs,
  Tab,
  TextField,
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

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "360px",
      maxWidth: "90vw",
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

// Default marker icons (green pin variations)
const DEFAULT_ICONS = [
  "default-green.svg",
  "default-green-add.svg",
  "default-green-check.svg",
  "default-green-cross.svg",
  "default-green-dot.svg",
  "default-green-exclamation.svg",
  "default-green-minus.svg",
  "default-green-question.svg",
  "default-green-star.svg",
  "default-green-plus.svg",
  "default-green-arrow.svg",
  "default-green-h.svg",
  "default-green-a.svg",
  "default-green-0.svg",
  "default-green-1.svg",
  "default-green-2.svg",
  "default-green-3.svg",
  "default-green-4.svg",
  "default-green-5.svg",
  "default-green-6.svg",
  "default-green-7.svg",
  "default-green-8.svg",
  "default-green-9.svg",
  "default-green-home.svg",
  "default-green-office.svg",
  "default-green-warehouse.svg",
  "default-green-factory.svg",
  "default-green-school.svg",
  "default-green-hospital.svg",
  "default-green-parking.svg",
];

// Custom marker icons (various colors and types)
const CUSTOM_ICONS = [
  "default-red.svg",
  "default-blue.svg",
  "default-yellow.svg",
  "default-orange.svg",
  "default-purple.svg",
  "default-pink.svg",
  "default-red-add.svg",
  "default-blue-add.svg",
  "default-yellow-add.svg",
  "default-red-check.svg",
  "default-blue-check.svg",
  "default-yellow-check.svg",
  "default-red-cross.svg",
  "default-blue-cross.svg",
  "default-yellow-cross.svg",
  "default-red-dot.svg",
  "default-blue-dot.svg",
  "default-yellow-dot.svg",
  "default-red-exclamation.svg",
  "default-blue-exclamation.svg",
  "default-yellow-exclamation.svg",
  "default-red-minus.svg",
  "default-blue-minus.svg",
  "default-yellow-minus.svg",
  "default-red-question.svg",
  "default-blue-question.svg",
  "default-yellow-question.svg",
  "default-red-star.svg",
  "default-blue-star.svg",
  "default-yellow-star.svg",
];

const MarkerDialog = ({ open, onClose, marker, mapCenter }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupId: 0,
    icon: "default-green.svg",
    visible: true,
    latitude: "",
    longitude: "",
  });
  const [groups, setGroups] = useState([]);
  const [iconTab, setIconTab] = useState(0);

  // Fetch geofence groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetchOrThrow('/api/geofence-groups');
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching geofence groups:", error);
        setGroups([]);
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
        name: marker.name || "",
        description: marker.description || "",
        groupId: marker.groupId || 0,
        icon: marker.attributes?.icon || "default-green.svg",
        visible: marker.attributes?.visible !== false,
        latitude: areaMatch ? areaMatch[1] : "",
        longitude: areaMatch ? areaMatch[2] : "",
      });
    } else {
      // Create mode - use map center if available
      setFormData({
        name: "",
        description: "",
        groupId: 0,
        icon: "default-green.svg",
        visible: true,
        latitude: mapCenter?.lat || "",
        longitude: mapCenter?.lng || "",
      });
    }
  }, [marker, mapCenter, open]);

  const handleInputChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => (checked) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const handleIconSelect = (icon) => {
    setFormData((prev) => ({ ...prev, icon }));
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

      // Construct CIRCLE geometry with default radius 500m
      const area = `CIRCLE (${formData.latitude} ${formData.longitude}, 500)`;

      const payload = {
        name: formData.name,
        description: formData.description || "",
        groupId: formData.groupId || 0,
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

  const iconList = iconTab === 0 ? DEFAULT_ICONS : CUSTOM_ICONS;

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        Marker properties
        <IconButton onClick={onClose} className={classes.closeButton} size="small">
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
              <MenuItem value={0}>Ungrouped</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
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

        <Box sx={{ mt: 2 }}>
          <Tabs
            value={iconTab}
            onChange={(e, newValue) => setIconTab(newValue)}
            className={classes.tabs}
          >
            <Tab label="Default" />
            <Tab label="Custom" />
          </Tabs>

          <Box className={classes.iconGrid}>
            {iconList.map((icon) => (
              <Box
                key={icon}
                className={`${classes.iconButton} ${formData.icon === icon ? 'selected' : ''}`}
                onClick={() => handleIconSelect(icon)}
              >
                <img
                  src={`/img/markers/${icon}`}
                  alt={icon}
                  className={classes.iconImage}
                  onError={(e) => {
                    e.target.src = '/img/markers/default-green.svg';
                  }}
                />
              </Box>
            ))}
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
  );
};

export default MarkerDialog;
