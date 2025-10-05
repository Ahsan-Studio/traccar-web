import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      minWidth: "820px",
      maxWidth: "900px",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    color: "white",
    padding: "4px",
  },
  dialogContent: {
    padding: "0",
  },
  sectionHeader: {
    background: "#f5f5f5",
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#4a90e2",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0",
    padding: "16px",
  },
  leftCol: {
    paddingRight: "12px",
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  rightCol: {
    paddingLeft: "12px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#333",
    minWidth: "120px",
    textAlign: "left",
  },
  inputField: {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  bigInput: {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputBase-input": {
      fontSize: "12px",
    },
  },
  variablesTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: "8px",
  },
  variablesList: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1,
    maxHeight: 360,
    overflow: "auto",
    "& .MuiListItem-root": {
      paddingTop: 4,
      paddingBottom: 4,
    },
    "& .MuiListItemText-primary": {
      fontSize: 12,
      fontFamily: 'monospace',
    },
    "& .MuiListItemText-secondary": {
      fontSize: 11,
      color: "#666",
    },
  },
  dialogActions: {
    padding: "12px 16px",
    gap: "12px",
  },
  saveButton: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 16px",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
  cancelButton: {
    backgroundColor: "white",
    color: "#666",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 16px",
    border: "1px solid #ddd",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
}));

const DEFAULT_FORM = {
  name: "",
  description: "",
  subject: "",
  message: "",
};

const TemplateDialog = ({ open, onClose, onSave, template }) => {
  const { classes } = useStyles();
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({
          name: template.name || "",
          description: template.description || "",
          subject: template.subject || "",
          message: template.message || "",
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, template]);

  const handleChange = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const handleSave = () => onSave?.(form);

  const variables = [
    ["%NAME%", "Object name"],
    ["%UNIQUE%", "Object IMEI"],
    ["%EVENT%", "Event name"],
    ["%ROUTE%", "Route name"],
    ["%ZONE%", "Zone name"],
    ["%LAT%", "Position latitude"],
    ["%LNG%", "Position longitude"],
    ["%ADDRESS%", "Position address"],
    ["%SPEED%", "Speed"],
    ["%ALT%", "Altitude"],
    ["%ANGLE%", "Moving angle"],
    ["%DT_POS%", "Position date and time"],
    ["%DT_SRV%", "Server date and time"],
    ["%G_MAP%", "URL to Google Maps with position"],
  ];

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        Template properties
        <IconButton className={classes.closeButton} onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Box className={classes.sectionHeader}>Template</Box>
        <Box className={classes.body}>
          <Box className={classes.leftCol}>
            <Box className={classes.formRow}>
              <Typography className={classes.label}>Name</Typography>
              <TextField value={form.name} onChange={handleChange('name')} className={classes.inputField} size="small" fullWidth />
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Description</Typography>
              <TextField value={form.description} onChange={handleChange('description')} className={classes.inputField} size="small" fullWidth />
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label}>Subject</Typography>
              <TextField value={form.subject} onChange={handleChange('subject')} className={classes.inputField} size="small" fullWidth />
            </Box>

            <Box className={classes.formRow}>
              <Typography className={classes.label} sx={{ alignSelf: 'flex-start', mt: 1 }}>Message</Typography>
              <TextField
                value={form.message}
                onChange={handleChange('message')}
                className={classes.bigInput}
                size="small"
                fullWidth
                multiline
                minRows={12}
              />
            </Box>
          </Box>

          <Box className={classes.rightCol}>
            <Typography className={classes.variablesTitle}>Variables</Typography>
            <List dense className={classes.variablesList}>
              {variables.map(([k, v]) => (
                <ListItem key={k} divider>
                  <ListItemText primary={k} secondary={v} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button onClick={handleSave} className={classes.saveButton} startIcon={<SaveIcon />}>Save</Button>
        <Button onClick={onClose} className={classes.cancelButton} startIcon={<CancelIcon />}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDialog;
