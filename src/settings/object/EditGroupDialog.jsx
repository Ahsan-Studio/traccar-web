import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { groupsActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Alert,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { CustomInput, CustomButton, CustomMultiSelect } from "../../common/components/custom";

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
    padding: "8px 16px",
    fontSize: "14px",
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
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(1),
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  label: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#444",
    width: "100px",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
  },
  textareaWrapper: {
    flex: 1,
  },
  textarea: {
    width: "100%",
    padding: "6px 12px",
    fontSize: "11px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "60px",
    "&:focus": {
      outline: "none",
      borderColor: "#2196f3",
      backgroundColor: "white",
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    justifyContent: "center",
    gap: theme.spacing(1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  button: {
    fontSize: "11px",
    textTransform: "none",
    padding: "6px 20px",
    minWidth: "80px",
  },
}));

const EditGroupDialog = ({ open, onClose, group, onGroupSaved }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const devices = useSelector((state) => state.devices.items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [formData, setFormData] = useState({
    id: group?.id || 0,
    name: group?.name || "",
    groupId: group?.groupId || 0,
    attributes: group?.attributes || {},
  });

  // Get device IDs that belong to this group
  useEffect(() => {
    if (group && devices) {
      const groupDeviceIds = Object.values(devices)
        .filter(device => device.groupId === group.id)
        .map(device => device.id);
      setSelectedDeviceIds(groupDeviceIds);
    } else {
      setSelectedDeviceIds([]);
    }
  }, [group, devices]);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAttributesChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [field]: event.target.value
      }
    }));
  };

  const handleDeviceChange = (selectedIds) => {
    setSelectedDeviceIds(selectedIds);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare data according to Traccar Groups API structure
      const groupData = {
        id: group ? group.id : 0, // For POST, use 0; for PUT, use existing id
        name: formData.name,
        groupId: formData.groupId || 0,
        attributes: formData.attributes || {}
      };

      const url = group ? `/api/groups/${group.id}` : '/api/groups';
      const method = group ? 'PUT' : 'POST';
      
      console.log('Saving group data:', groupData);
      
      const response = await fetchOrThrow(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      const savedGroup = await response.json();
      console.log('Group saved successfully:', savedGroup);
      
      // Handle device assignment to group
      if (selectedDeviceIds.length > 0) {
        try {
          const selectedDevices = Object.values(devices).filter(device => 
            selectedDeviceIds.includes(device.id)
          );
          console.log('Assigning devices to group:', selectedDevices);
          
          // Update each selected device to belong to this group
          for (const device of selectedDevices) {
            const updatedDevice = {
              ...device,
              groupId: savedGroup.id
            };
            
            await fetchOrThrow(`/api/devices/${device.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedDevice),
            });
            
            console.log(`Device ${device.id} assigned to group ${savedGroup.id}`);
          }
          
          // Also remove devices that were previously in this group but are no longer selected
          if (group) {
            const previousDevices = Object.values(devices).filter(device => device.groupId === group.id);
            const devicesToRemove = previousDevices.filter(device => !selectedDeviceIds.includes(device.id));
            
            for (const device of devicesToRemove) {
              const updatedDevice = {
                ...device,
                groupId: null
              };
              
              await fetchOrThrow(`/api/devices/${device.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedDevice),
              });
              
              console.log(`Device ${device.id} removed from group ${savedGroup.id}`);
            }
          }
        } catch (deviceError) {
          console.error('Failed to assign devices to group:', deviceError);
          // Don't fail the entire operation for device assignment errors
        }
      }
      
      // Update Redux store using proper action
      if (group) {
        // Update existing group
        dispatch(groupsActions.update(savedGroup));
      } else {
        // Add new group
        dispatch(groupsActions.add(savedGroup));
      }
      
      setSuccess(true);
      onGroupSaved && onGroupSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save group:', err);
      setError(err.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: group?.id || 0,
      name: group?.name || "",
      groupId: group?.groupId || 0,
      attributes: group?.attributes || {},
    });
    setSelectedDeviceIds([]);
    setError(null);
    onClose();
  };

  // Prepare device options for CustomMultiSelect
  const deviceOptions = Object.values(devices).map(device => ({
    value: device.id,
    label: device.name
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        Object group properties
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Box className={classes.formRow}>
          <div className={classes.label}>Name</div>
          <div className={classes.inputWrapper}>
            <CustomInput
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder="Enter group name"
            />
          </div>
        </Box>

        <Box className={classes.formRow}>
          <div className={classes.label}>Description</div>
          <div className={classes.textareaWrapper}>
            <textarea
              className={classes.textarea}
              value={formData.attributes?.description || ""}
              onChange={handleAttributesChange("description")}
              placeholder="Enter group description (optional)"
            />
          </div>
        </Box>

        <Box className={classes.formRow}>
          <div className={classes.label}>Objects</div>
          <div className={classes.inputWrapper}>
            <CustomMultiSelect
              options={deviceOptions}
              value={selectedDeviceIds}
              onChange={handleDeviceChange}
              placeholder="Select objects"
              searchable={true}
              displayValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return "Nothing selected";
                }
                if (selected.length === 1) {
                  const device = devices[selected[0]];
                  return device ? device.name : "1 selected";
                }
                return `${selected.length} objects selected`;
              }}
            />
          </div>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <CustomButton
          onClick={handleSave}
          variant="primary"
          disabled={saving}
          icon={<SaveIcon style={{ fontSize: 14 }} />}
        >
          {saving ? "Saving..." : "Save"}
        </CustomButton>
        <CustomButton
          onClick={handleCancel}
          variant="secondary"
          icon={<CancelIcon style={{ fontSize: 14 }} />}
        >
          Cancel
        </CustomButton>
      </DialogActions>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mt: 2 }}>
          Group {group ? "updated" : "created"} successfully!
        </Alert>
      )}
    </Dialog>
  );
};

export default EditGroupDialog;
