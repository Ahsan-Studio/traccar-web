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

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "550px",
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
    padding: theme.spacing(3),
    backgroundColor: "#f5f5f5",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    backgroundColor: "white",
    padding: theme.spacing(1.5),
    borderRadius: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 400,
    color: "#333",
    width: "140px",
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
  });
  const [groups, setGroups] = useState([]);

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
    if (zone) {
      // Edit mode - populate with existing zone data
      setFormData({
        name: zone.name || "",
        groupId: zone.groupId || 0,
        color: zone.attributes?.color || "#FF0000",
        visible: zone.attributes?.visible !== false,
        nameVisible: zone.attributes?.nameVisible !== false,
        measureArea: zone.attributes?.measureArea || false,
      });
    } else {
      // Create mode - reset form
      setFormData({
        name: "",
        groupId: 0,
        color: "#FF0000",
        visible: true,
        nameVisible: true,
        measureArea: false,
      });
    }
  }, [zone, open]);

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

      // For now, we'll create a simple polygon if zone doesn't have area
      // In real implementation, this would be drawn on map
      let area = zone?.area;
      if (!area) {
        // Default polygon if creating new zone without drawing
        alert("Please draw the zone on the map first");
        return;
      }

      const payload = {
        name: formData.name,
        groupId: formData.groupId || 0,
        area: area,
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
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        Zone properties
        <IconButton onClick={onClose} className={classes.closeButton} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
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
  );
};

export default ZoneDialog;
