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
  checkbox: {
    marginRight: "8px",
    transform: "scale(0.8)",
  },
  checkboxWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  inputWithCheckbox: {
    width: "calc(100% - 30px)",
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
  button: {
    padding: "6px 12px",
    fontSize: "11px",
    backgroundColor: "#4a90e2",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
}));

const AccuracyTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const handleAccurationAttributeChange = (field) => (event) => {
    const value = event.target.value;
    onFormDataChange({
      attributes: {
        ...formData.attributes,
        accuration: {
          ...formData.attributes?.accuration,
          [field]: value
        }
      }
    });
  };

  const handleAccurationCheckboxChange = (field) => (event) => {
    const checked = event.target.checked;
    onFormDataChange({
      attributes: {
        ...formData.attributes,
        accuration: {
          ...formData.attributes?.accuration,
          [field]: checked
        }
      }
    });
  };

  const handleAccurationInputChange = (field) => (event) => {
    const value = event.target.value;
    onFormDataChange({
      attributes: {
        ...formData.attributes,
        accuration: {
          ...formData.attributes?.accuration,
          [field]: value
        }
      }
    });
  };

  const handleButtonClick = () => {
    // Handle delete sensor cache
    console.log('Delete sensor cache clicked');
  };

  return (
    <Box className={classes.container}>
      {/* Akurasi Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Akurasi</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Pengimbangan zona waktu - secara default harus disetting ke (UTC 0:00), atur jika anda tidak mungkin mengatur zona waktu GPS</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.accuration?.timezone || "UTC 0:00"}
              onChange={handleAccurationAttributeChange("timezone")}
            >
              <option value="UTC -14:00">(UTC -14:00)</option>
              <option value="UTC -13:00">(UTC -13:00)</option>
              <option value="UTC -12:00">(UTC -12:00)</option>
              <option value="UTC -11:00">(UTC -11:00)</option>
              <option value="UTC -10:00">(UTC -10:00)</option>
              <option value="UTC -9:00">(UTC -9:00)</option>
              <option value="UTC -8:00">(UTC -8:00)</option>
              <option value="UTC -7:00">(UTC -7:00)</option>
              <option value="UTC -6:00">(UTC -6:00)</option>
              <option value="UTC -5:00">(UTC -5:00)</option>
              <option value="UTC -4:00">(UTC -4:00)</option>
              <option value="UTC -3:00">(UTC -3:00)</option>
              <option value="UTC -2:00">(UTC -2:00)</option>
              <option value="UTC -1:00">(UTC -1:00)</option>
              <option value="UTC 0:00">(UTC 0:00)</option>
              <option value="UTC +1:00">(UTC +1:00)</option>
              <option value="UTC +2:00">(UTC +2:00)</option>
              <option value="UTC +3:00">(UTC +3:00)</option>
              <option value="UTC +4:00">(UTC +4:00)</option>
              <option value="UTC +5:00">(UTC +5:00)</option>
              <option value="UTC +6:00">(UTC +6:00)</option>
              <option value="UTC +7:00">(UTC +7:00)</option>
              <option value="UTC +8:00">(UTC +8:00)</option>
              <option value="UTC +9:00">(UTC +9:00)</option>
              <option value="UTC +10:00">(UTC +10:00)</option>
              <option value="UTC +11:00">(UTC +11:00)</option>
              <option value="UTC +12:00">(UTC +12:00)</option>
              <option value="UTC +13:00">(UTC +13:00)</option>
              <option value="UTC +14:00">(UTC +14:00)</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Deteksi berhenti menggunakan</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.accuration?.motionSource || "gps"}
              onChange={handleAccurationAttributeChange("motionSource")}
            >
              <option value="gps">GPS</option>
              <option value="acc">ACC</option>
              <option value="gps+acc">GPS + ACC</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Batas minimum deteksi berjalan, dalam km/jam (settingan berimbas ke akurasi berhenti dan berjalan, nilai standar: 6)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.motionSpeedThreshold || "6"}
              onChange={handleAccurationInputChange("motionSpeedThreshold")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Batas minimum deteksi mesin diam dalam satuan km/jam (settingan berimbas ke status mesin diam, nilai standar: 3)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.idleSpeedThreshold || "3"}
              onChange={handleAccurationInputChange("idleSpeedThreshold")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Jarak terkecil antar titik track (menghilangkan drif, standar 0.0005)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.minDistance || "0.0005"}
              onChange={handleAccurationInputChange("minDistance")}
              min="0"
              step="0.0001"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Min. gpslev value (eliminates drifting, default 5)</div>
          <div className={classes.width60}>
            <div className={classes.checkboxWrapper}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={formData.attributes?.accuration?.enableMinSatellites || false}
                onChange={handleAccurationCheckboxChange("enableMinSatellites")}
              />
              <input
                className={classes.inputWithCheckbox}
                type="number"
                value={formData.attributes?.accuration?.minSatellites || "5"}
                onChange={handleAccurationInputChange("minSatellites")}
                min="0"
                disabled={!formData.attributes?.accuration?.enableMinSatellites}
              />
            </div>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Max. hdop value (eliminates drifting, default 3)</div>
          <div className={classes.width60}>
            <div className={classes.checkboxWrapper}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={formData.attributes?.accuration?.enableMaxHdop || false}
                onChange={handleAccurationCheckboxChange("enableMaxHdop")}
              />
              <input
                className={classes.inputWithCheckbox}
                type="number"
                value={formData.attributes?.accuration?.maxHdop || "3"}
                onChange={handleAccurationInputChange("maxHdop")}
                min="0"
                disabled={!formData.attributes?.accuration?.enableMaxHdop}
              />
            </div>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Min. fuel difference detection speed in km/h (default 10)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.fuelMinSpeed || "10"}
              onChange={handleAccurationInputChange("fuelMinSpeed")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Jumlah bahan bakar minimal utk mendeteksi pengisian BBM (standar 10)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.fuelRefillThreshold || "10"}
              onChange={handleAccurationInputChange("fuelRefillThreshold")}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Min. fuel difference to detect fuel thefts (default 10)</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.accuration?.fuelTheftThreshold || "10"}
              onChange={handleAccurationInputChange("fuelTheftThreshold")}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Other Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Other</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Hapus cache sensor yang terdeksi</div>
          <div className={classes.width60}>
            <button
              className={classes.button}
              onClick={handleButtonClick}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default AccuracyTab;
