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
    padding: "0 !important",
  },
  body: {
    display: "flex",
    gap: 0,
  },
  leftCol: {
    width: "60%",
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  rightCol: {
    width: "40%",
  },
  sectionHeader: {
    background: "#f5f5f5",
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
  },
  formBody: {
    padding: "12px 16px",
  },
  formRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "10px",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#333",
    minWidth: "100px",
    paddingTop: "7px",
    textAlign: "left",
  },
  inputField: {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
      height: "32px",
    },
  },
  textareaField: {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputBase-input": {
      fontSize: "12px",
    },
  },
  variablesBody: {
    padding: "8px 16px",
  },
  variableRow: {
    fontSize: "12px",
    color: "#333",
    padding: "4px 0",
    borderBottom: `1px solid #f0f0f0`,
    lineHeight: "20px",
    cursor: "default",
    "&:hover": {
      backgroundColor: "#fafafa",
    },
  },
  variableKey: {
    fontWeight: 600,
    color: "#333",
  },
  variableDesc: {
    color: "#666",
  },
  variablesScroll: {
    maxHeight: "360px",
    overflowY: "auto",
  },
  dialogActions: {
    padding: "12px 16px",
    justifyContent: "center",
    gap: "12px",
  },
  saveButton: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 20px",
    "&:hover": { backgroundColor: "#357abd" },
  },
  cancelButton: {
    backgroundColor: "white",
    color: "#666",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 20px",
    border: "1px solid #ddd",
    "&:hover": { backgroundColor: "#f5f5f5" },
  },
}));

const DEFAULT_FORM = {
  name: "",
  description: "",
  subject: "",
  message: "",
};

// V1 complete variables list (22 items, matching inc_dialogs.settings.php order)
const VARIABLES = [
  "%NAME% - Object name",
  "%IMEI% - Object IMEI",
  "%EVENT% - Event name",
  "%ROUTE% - Route name",
  "%ZONE% - Zone name",
  "%LAT% - Position latitude",
  "%LNG% - Position longitude",
  "%ADDRESS% - Position address",
  "%SPEED% - Speed",
  "%ALT% - Altitude",
  "%ANGLE% - Moving angle",
  "%DT_POS% - Position date and time",
  "%DT_SER% - Server date and time",
  "%G_MAP% - URL to Google Maps with position",
  "%TR_MODEL% - Transport model",
  "%VIN% - VIN number",
  "%PL_NUM% - Plate number",
  "%SIM_NUMBER% - SIM card number",
  "%DRIVER% - Driver name",
  "%TRAILER% - Trailer name",
  "%ODOMETER% - Odometer",
  "%ENG_HOURS% - Engine hours",
];

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

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        Template properties
        <IconButton className={classes.closeButton} onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        <Box className={classes.body}>
          {/* Left column — Template form (60%) */}
          <Box className={classes.leftCol}>
            <Box className={classes.sectionHeader}>Template</Box>
            <Box className={classes.formBody}>
              <Box className={classes.formRow}>
                <Typography className={classes.label}>Name</Typography>
                <TextField
                  value={form.name}
                  onChange={handleChange("name")}
                  className={classes.inputField}
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 50 }}
                />
              </Box>

              <Box className={classes.formRow}>
                <Typography className={classes.label}>Description</Typography>
                <TextField
                  value={form.description}
                  onChange={handleChange("description")}
                  className={classes.textareaField}
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  inputProps={{ maxLength: 100 }}
                />
              </Box>

              <Box className={classes.formRow}>
                <Typography className={classes.label}>Subject</Typography>
                <TextField
                  value={form.subject}
                  onChange={handleChange("subject")}
                  className={classes.inputField}
                  size="small"
                  fullWidth
                  inputProps={{ maxLength: 100 }}
                />
              </Box>

              <Box className={classes.formRow}>
                <Typography className={classes.label}>Message</Typography>
                <TextField
                  value={form.message}
                  onChange={handleChange("message")}
                  className={classes.textareaField}
                  size="small"
                  fullWidth
                  multiline
                  minRows={10}
                  inputProps={{ maxLength: 2000 }}
                />
              </Box>
            </Box>
          </Box>

          {/* Right column — Variables list (40%) */}
          <Box className={classes.rightCol}>
            <Box className={classes.sectionHeader}>Variables</Box>
            <Box className={classes.variablesBody}>
              <Box className={classes.variablesScroll}>
                {VARIABLES.map((v) => {
                  const [key, ...descParts] = v.split(" - ");
                  const desc = descParts.join(" - ");
                  return (
                    <Box key={key} className={classes.variableRow}>
                      <span className={classes.variableKey}>{key}</span>
                      <span className={classes.variableDesc}>{` - ${desc}`}</span>
                    </Box>
                  );
                })}
              </Box>
            </Box>
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
