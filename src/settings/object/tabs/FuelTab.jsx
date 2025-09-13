import { Box } from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(0),
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
  width100: {
    width: "100%",
  },
  dateInput: {
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
  },
  calendarIcon: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    fontSize: "12px",
    color: "#666",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
}));

const FuelTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const handleFuelAttributeChange = (field) => (event) => {
    const value = event.target.value;
    onFormDataChange({
      attributes: {
        ...formData.attributes,
        fuel: {
          ...formData.attributes?.fuel,
          [field]: value
        }
      }
    });
  };

  return (
    <Box className={classes.container}>
      {/* Perhitungan Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Perhitungan</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Sumber</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.fuel?.source || "rates"}
              onChange={handleFuelAttributeChange("source")}
            >
              <option value="rates">Rates</option>
              <option value="fuelLevel">Tingkat Bahan Bakar</option>
              <option value="fuelConsumption">Konsumsi bahan bakar</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Pengukuran</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.fuel?.measurement || "l100km"}
              onChange={handleFuelAttributeChange("measurement")}
            >
              <option value="l100km">l/100km</option>
              <option value="mpg">MPG</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Biaya per liter</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.fuel?.cost || "0"}
              onChange={handleFuelAttributeChange("cost")}
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Rates Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Rates</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Rate musim panas (kilometers per liter)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.fuel?.summerRate || "0"}
              onChange={handleFuelAttributeChange("summerRate")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Rate musim dingin (kilometer per liter)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.fuel?.winterRate || "0"}
              onChange={handleFuelAttributeChange("winterRate")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Musim dingin dari</div>
          <div className={classes.width60}>
            <div className={classes.inputWrapper}>
              <input
                className={classes.dateInput}
                type="text"
                value={formData.attributes?.fuel?.summerStart || "12-01"}
                onChange={handleFuelAttributeChange("summerStart")}
                placeholder="MM-DD"
              />
              <span className={classes.calendarIcon}>📅</span>
            </div>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Musim dingin sampai</div>
          <div className={classes.width60}>
            <div className={classes.inputWrapper}>
              <input
                className={classes.dateInput}
                type="text"
                value={formData.attributes?.fuel?.summerEnd || "03-01"}
                onChange={handleFuelAttributeChange("summerEnd")}
                placeholder="MM-DD"
              />
              <span className={classes.calendarIcon}>📅</span>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default FuelTab;
