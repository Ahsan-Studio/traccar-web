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
  colorInput: {
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
  colorSwatch: {
    width: "20px",
    height: "20px",
    border: "1px solid #ccc",
    marginLeft: "5px",
    display: "inline-block",
    verticalAlign: "middle",
  },
  iconPreview: {
    width: "30px",
    height: "30px",
    border: "1px solid #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    marginLeft: "5px",
  },
}));

const IconTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const handleIconAttributeChange = (field) => (event) => {
    const value = event.target.value;
    onFormDataChange({
      attributes: {
        ...formData.attributes,
        icon: {
          ...formData.attributes?.icon,
          [field]: value
        }
      }
    });
  };

  return (
    <Box className={classes.container}>
      {/* Icon Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Icon</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Shown icon on map</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.icon?.useIcon ? "icon" : "arrow"}
              onChange={(event) => {
                const useIcon = event.target.value === "icon";
                onFormDataChange({
                  attributes: {
                    ...formData.attributes,
                    icon: {
                      ...formData.attributes?.icon,
                      useIcon: useIcon
                    }
                  }
                });
              }}
            >
              <option value="arrow">Anak Panah</option>
              <option value="icon">Icon</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Warna anak panah tidak ada koneksi</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.icon?.disconnectedColor || "red"}
              onChange={handleIconAttributeChange("disconnectedColor")}
            >
              <option value="black">Hitam</option>
              <option value="blue">Biru</option>
              <option value="green">Hijau</option>
              <option value="gray">Abu-abu</option>
              <option value="orange">Orange</option>
              <option value="purple">Ungu</option>
              <option value="red">Merah</option>
              <option value="yellow">Kuning</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Warna anak panah saat berhenti</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.icon?.stopColor || "red"}
              onChange={handleIconAttributeChange("stopColor")}
            >
              <option value="black">Hitam</option>
              <option value="blue">Biru</option>
              <option value="green">Hijau</option>
              <option value="gray">Abu-abu</option>
              <option value="orange">Orange</option>
              <option value="purple">Ungu</option>
              <option value="red">Merah</option>
              <option value="yellow">Kuning</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Warna anak panah berjalan</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.icon?.movingColor || "green"}
              onChange={handleIconAttributeChange("movingColor")}
            >
              <option value="black">Hitam</option>
              <option value="blue">Biru</option>
              <option value="green">Hijau</option>
              <option value="gray">Abu-abu</option>
              <option value="orange">Orange</option>
              <option value="purple">Ungu</option>
              <option value="red">Merah</option>
              <option value="yellow">Kuning</option>
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Warna anak panah mesin diam</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.icon?.ignitionOffColor || "off"}
              onChange={handleIconAttributeChange("ignitionOffColor")}
            >
              <option value="off">Off</option>
              <option value="black">Hitam</option>
              <option value="blue">Biru</option>
              <option value="green">Hijau</option>
              <option value="gray">Abu-abu</option>
              <option value="orange">Orange</option>
              <option value="purple">Ungu</option>
              <option value="red">Merah</option>
              <option value="yellow">Kuning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ekor Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Ekor</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Warna ekor</div>
          <div className={classes.width60}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                className={classes.colorInput}
                type="text"
                value={formData.attributes?.icon?.tailColor || "00FF44"}
                onChange={handleIconAttributeChange("tailColor")}
                style={{ width: "calc(100% - 30px)" }}
              />
              <div 
                className={classes.colorSwatch}
                style={{ backgroundColor: `#${formData.attributes?.icon?.tailColor || "00FF44"}` }}
              ></div>
            </div>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Jumlah titik ekor</div>
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.attributes?.icon?.numberOfTail || "7"}
              onChange={handleIconAttributeChange("numberOfTail")}
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>
    </Box>
  );
};

export default IconTab;
