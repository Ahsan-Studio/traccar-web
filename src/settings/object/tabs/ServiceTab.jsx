import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  row: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
}));

const ServiceTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const handleInputChange = (field) => (event) => {
    onFormDataChange({ [field]: event.target.value });
  };

  const handleSwitchChange = (field) => (event) => {
    onFormDataChange({ [field]: event.target.checked });
  };

  return (
    <Box>
      <Typography className={classes.sectionTitle}>Service</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div className={classes.row}>
          <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
            Service interval
          </Typography>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Mode</InputLabel>
            <Select
              value={formData.serviceMode || "off"}
              onChange={handleInputChange("serviceMode")}
              label="Mode"
            >
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="odometer">Odometer</MenuItem>
              <MenuItem value="engine-hours">Engine Hours</MenuItem>
              <MenuItem value="time">Time</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="number"
            label="Interval"
            value={formData.serviceInterval || ""}
            onChange={handleInputChange("serviceInterval")}
            size="small"
            sx={{ width: 120 }}
            className={classes.formField}
          />
        </div>

        <div className={classes.row}>
          <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
            Service reminder
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={formData.serviceReminder || false}
                onChange={handleSwitchChange("serviceReminder")}
                size="small"
              />
            }
            label="Aktifkan reminder"
            sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
          />
        </div>

        {formData.serviceReminder && (
          <div className={classes.row}>
            <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
              Reminder sebelum
            </Typography>
            <TextField
              type="number"
              label="km/jam/hari"
              value={formData.serviceReminderBefore || ""}
              onChange={handleInputChange("serviceReminderBefore")}
              size="small"
              sx={{ width: 120 }}
              className={classes.formField}
            />
          </div>
        )}

        <div className={classes.row}>
          <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
            Maintenance mode
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={formData.maintenanceMode || false}
                onChange={handleSwitchChange("maintenanceMode")}
                size="small"
              />
            }
            label="Mode maintenance"
            sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
          />
        </div>

        <div className={classes.row}>
          <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
            Last service
          </Typography>
          <TextField
            type="date"
            value={formData.lastService || ""}
            onChange={handleInputChange("lastService")}
            size="small"
            sx={{ width: 150 }}
            className={classes.formField}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className={classes.row}>
          <Typography variant="body2" sx={{ fontSize: "12px", minWidth: "120px" }}>
            Next service
          </Typography>
          <TextField
            type="date"
            value={formData.nextService || ""}
            onChange={handleInputChange("nextService")}
            size="small"
            sx={{ width: 150 }}
            className={classes.formField}
            InputLabelProps={{ shrink: true }}
          />
        </div>
      </Box>
    </Box>
  );
};

export default ServiceTab;
