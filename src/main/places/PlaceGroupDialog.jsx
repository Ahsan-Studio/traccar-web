import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "400px",
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
    alignItems: "flex-start",
    marginBottom: theme.spacing(1.5),
  },
  label: {
    fontSize: "12px",
    fontWeight: 400,
    color: "#333",
    width: "100px",
    flexShrink: 0,
    paddingTop: "8px",
  },
  inputWrapper: {
    flex: 1,
  },
  textField: {
    width: "100%",
    "& .MuiOutlinedInput-input": {
      padding: "6px 10px",
      fontSize: "12px",
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
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
      <DialogTitle className={classes.dialogTitle}>
        {group ? "Edit Group" : "Create Group"}
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
              placeholder="Enter group name"
              className={classes.textField}
              size="small"
              variant="outlined"
              autoFocus
            />
          </Box>
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>Description</Typography>
          <Box className={classes.inputWrapper}>
            <TextField
              value={formData.description}
              onChange={handleInputChange("description")}
              placeholder="Enter description (optional)"
              className={classes.textField}
              size="small"
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <CustomButton
          onClick={handleSave}
          startIcon={<SaveIcon />}
          variant="contained"
        >
          Save
        </CustomButton>
        <CustomButton
          onClick={handleCancel}
          startIcon={<CancelIcon />}
          variant="outlined"
        >
          Cancel
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default PlaceGroupDialog;
