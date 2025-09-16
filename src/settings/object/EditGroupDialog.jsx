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
  Button,
  Typography,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "90vw",
      height: "400px",
      maxHeight: "90vh",
      overflow: "visible",
    },
    "& .MuiDialog-container": {
      overflow: "visible",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "& .MuiTypography-root": {
      fontSize: "14px",
      fontWeight: 500,
    },
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
    overflow: "visible",
  },
  container: {
    padding: theme.spacing(1),
  },
  row: {
    marginBottom: theme.spacing(0),
  },
  titleBlock: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(0),
  },
  row2: {
    display: "flex",
    alignItems: "center",
    marginBottom: '3px',
  },
  width40: {
    width: "40%",
    fontSize: "11px",
    fontWeight: 400,
    color: "#686868",
    paddingRight: theme.spacing(2),
  },
  width60: {
    width: "60%",
  },
  inputbox: {
    width: "100%",
    padding: "0px 5px",
    height: "24px",
    border: "1px solid #ccc",
    fontSize: "11px",
    color: "#444444",
    backgroundColor: "#f5f5f5",
    "&:focus": {
      outline: "none",
      borderColor: "#4a90e2",
    },
    "&:disabled": {
      backgroundColor: "#f5f5f5",
      color: "#666",
    },
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
    backgroundColor: "white",
    "&:focus": {
      outline: "none",
      borderColor: "#4a90e2",
    },
  },
  multipleSelect: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    fontSize: "12px",
    backgroundColor: "white",
    minHeight: "80px",
    "&:focus": {
      outline: "none",
      borderColor: "#4a90e2",
    },
  },
  width100: {
    width: "100%",
  },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f5f5f5",
  },
  actionButton: {
    fontSize: "12px",
    padding: "6px 16px",
  },
}));

const EditGroupDialog = ({ open, onClose, group, onGroupSaved }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const devices = useSelector((state) => state.devices.items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [formData, setFormData] = useState({
    id: group?.id || 0,
    name: group?.name || "",
    groupId: group?.groupId || 0,
    attributes: group?.attributes || {},
  });

  // Get devices that belong to this group
  useEffect(() => {
    if (group && devices) {
      const groupDevices = Object.values(devices).filter(device => device.groupId === group.id);
      setSelectedDevices(groupDevices);
    } else {
      setSelectedDevices([]);
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

  const handleDeviceChange = (event) => {
    const selectedValues = Array.from(event.target.selectedOptions, option => 
      Object.values(devices).find(device => device.id === parseInt(option.value))
    );
    setSelectedDevices(selectedValues);
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
      if (selectedDevices.length > 0) {
        try {
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
            const selectedDeviceIds = selectedDevices.map(device => device.id);
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
    setSelectedDevices([]);
    setError(null);
    onClose();
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Object group properties</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Box className={classes.container}>
          <div className={classes.row}>
            <div className={classes.row2}>
              <div className={classes.width40}>Name</div>
              <div className={classes.width60}>
                <input
                  className={classes.inputbox}
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  maxLength="25"
                  placeholder="Enter group name"
                />
              </div>
            </div>
            
            <div className={classes.row2}>
              <div className={classes.width40}>Description</div>
              <div className={classes.width60}>
                <textarea
                  className={classes.inputbox}
                  value={formData.attributes?.description || ""}
                  onChange={handleAttributesChange("description")}
                  rows={3}
                  placeholder="Enter group description (optional)"
                  style={{ 
                    height: "auto", 
                    minHeight: "60px", 
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>
            
            <div className={classes.row2}>
              <div className={classes.width40}>Objects</div>
              <div className={classes.width60}>
                <select
                  className={`${classes.multipleSelect} ${classes.width100}`}
                  multiple
                  value={selectedDevices.map(device => device.id)}
                  onChange={handleDeviceChange}
                >
                  {Object.values(devices).map((device) => (
                    <option key={device.id} value={device.id} style={{ fontSize: '11px',padding: '4px' }}>
                      {device.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Hold Ctrl (Cmd on Mac) to select multiple objects
                </div>
              </div>
            </div>
          </div>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          className={classes.actionButton}
          disabled={saving}
          sx={{
            backgroundColor: "#4a90e2",
            "&:hover": { backgroundColor: "#357abd" },
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          className={classes.actionButton}
        >
          Cancel
        </Button>
      </DialogActions>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          Group {group ? "updated" : "created"} successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditGroupDialog;
