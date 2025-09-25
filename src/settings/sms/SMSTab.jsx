import { useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  container: {
    paddingBottom: theme.spacing(2),
  },
  sectionHeader: {
    backgroundColor: "#f5f5f5",
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#4a90e2",
  },
  saveButton: {
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    backgroundColor: "#4a90e2",
    color: "#fff",
    '&:hover': { backgroundColor: '#357abd' },
  },
  body: {
    padding: theme.spacing(2),
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#333',
    minWidth: 160,
  },
  input: {
    '& .MuiOutlinedInput-root': { height: 32, fontSize: 12 },
    '& .MuiInputBase-input': { fontSize: 12 },
    minWidth: 260,
  },
  select: {
    '& .MuiOutlinedInput-input': { fontSize: 12, padding: '6px 10px' },
    minWidth: 220,
    height: 32,
  },
  linkHeader: {
    color: '#1e88e5',
    fontSize: 13,
    fontWeight: 600,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    cursor: 'default',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: theme.spacing(2),
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
  },
  clearButton: {
    fontSize: 12,
    padding: '4px 10px',
  },
}));

const SMSTab = () => {
  const { classes } = useStyles();
  const [enabled, setEnabled] = useState(false);
  const [type, setType] = useState('Mobile application');
  const [identifier, setIdentifier] = useState('');
  const [queue, setQueue] = useState(0);

  const handleSave = () => {
    // TODO: integrate API save
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.sectionHeader}>
        <Typography className={classes.sectionTitle}>SMS Gateway</Typography>
        <Button className={classes.saveButton} onClick={handleSave}>Save</Button>
      </Box>

      <Box className={classes.body}>
        <Box className={classes.formRow}>
          <Typography className={classes.label}>Enable SMS Gateway</Typography>
          <FormControlLabel
            control={<Checkbox size="small" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label=""
          />
        </Box>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>SMS Gateway type</Typography>
          <Select size="small" value={type} onChange={(e) => setType(e.target.value)} className={classes.select}>
            <MenuItem value="Mobile application">Mobile application</MenuItem>
          </Select>
        </Box>

        <Typography className={classes.linkHeader}>Mobile application</Typography>
        <Typography className={classes.helpText}>
          Mobile application should be used which allows to use mobile device as SMS Gateway. Below SMS Gateway identifier should be entered in mobile application settings.
        </Typography>

        <Box className={classes.formRow}>
          <Typography className={classes.label}>SMS Gateway identifier</Typography>
          <TextField size="small" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={classes.input} />
        </Box>

        <Box className={classes.queueRow}>
          <Typography className={classes.label}>Total SMS in queue to send</Typography>
          <TextField size="small" value={queue} inputProps={{ readOnly: true }} className={classes.input} disabled />
          <Button variant="outlined" size="small" className={classes.clearButton} disabled>Clear</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SMSTab;
