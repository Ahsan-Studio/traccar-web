import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  TextField,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { CustomButton } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const useStyles = makeStyles()(() => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "330px",
      maxWidth: "90vw",
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

const PlaceGroupDialog = ({ open, onClose, group }) => {
  const { classes } = useStyles();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (group) {
      // Edit mode
      setFormData({
        name: group.name || "",
        description: group.attributes?.description || "",
      });
    } else {
      // Create mode
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [group, open]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert("Group name is required");
        return;
      }

      // Prepare payload
      const payload = {
        name: formData.name.trim(),
        attributes: {
          description: formData.description.trim() || undefined,
        },
      };

      // If editing, include existing data
      if (group) {
        payload.id = group.id;
        payload.groupId = group.groupId || 0;
        // Preserve other attributes
        payload.attributes = {
          ...group.attributes,
          description: formData.description.trim() || undefined,
        };
      }

      const url = group ? `/api/geofence-groups/${group.id}` : "/api/geofence-groups";
      const method = group ? "PUT" : "POST";

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
        throw new Error(errorText || "Failed to save group");
      }
    } catch (error) {
      console.error("Failed to save group:", error);
      alert(`Failed to save group: ${error.message}`);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      {/* Red circle close button - V1 style */}
      <IconButton onClick={handleCancel} className={classes.closeButton} size="small">
        <CloseIcon />
      </IconButton>

      {/* Title bar */}
      <Box className={classes.titleBar}>
        {group ? "Edit Group" : "Group properties"}
      </Box>

      <DialogContent className={classes.content}>
        {/* Name */}
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Name</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="Enter group name"
              className={classes.textField}
              size="small"
              variant="outlined"
              autoFocus
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
              placeholder="Enter description (optional)"
              className={classes.textArea}
              size="small"
              variant="outlined"
              multiline
              rows={3}
              inputProps={{ maxLength: 100 }}
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

export default PlaceGroupDialog;
