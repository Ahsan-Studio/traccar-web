import { Box } from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";

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
  width19: {
    width: "19%",
  },
  width1: {
    width: "1%",
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
}));

const MainTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();
  const groups = useSelector((state) => state.groups.items);
  const drivers = useSelector((state) => state.drivers.items);

  // Convert groups object to array and sort by name
  const groupList = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  
  // Convert drivers object to array and sort by name
  const driverList = Object.values(drivers).sort((a, b) => a.name.localeCompare(b.name));

  const handleInputChange = (field) => (event) => {
    onFormDataChange({ [field]: event.target.value });
  };

  const handleSelectChange = (field) => (event) => {
    onFormDataChange({ [field]: event.target.value });
  };

  return (
    <Box className={classes.container}>
      {/* Main Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Main</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Name</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.name}
              onChange={handleInputChange("name")}
              maxLength="25"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>IMEI</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.uniqueId}
              onChange={handleInputChange("uniqueId")}
              maxLength="15"
              disabled
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Transport model</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.model}
              onChange={handleInputChange("model")}
              maxLength="30"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Nomor Rangka</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.chassisNumber || ""}
              onChange={handleInputChange("chassisNumber")}
              maxLength="20"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Plate number</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.plateNumber}
              onChange={handleInputChange("plateNumber")}
              maxLength="15"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Group</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.groupId || "0"}
              onChange={handleSelectChange("groupId")}
            >
              <option value="0">Ungrouped</option>
              {groupList.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Driver</div>
          <div className={classes.width60}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.attributes?.driverId || "0"}
              onChange={(event) => {
                const driverId = event.target.value === "0" ? null : event.target.value;
                onFormDataChange({ 
                  attributes: { 
                    ...formData.attributes, 
                    driverId: driverId 
                  } 
                });
              }}
            >
              <option value="0">No driver</option>
              {driverList.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>GPS device</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.gpsType || ""}
              onChange={handleInputChange("gpsType")}
              maxLength="30"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>SIM card number</div>
          <div className={classes.width60}>
            <input
              className={classes.inputbox}
              type="text"
              value={formData.simCardNumber}
              onChange={handleInputChange("simCardNumber")}
              maxLength="30"
            />
          </div>
        </div>
      </div>

      {/* Counters Section */}
      <div className={classes.row}>
        <div className={classes.titleBlock}>Counters</div>
        
        <div className={classes.row2}>
          <div className={classes.width40}>Odometer (km)</div>
          {/* <div className={classes.width19}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.odometerType || "gps"}
              onChange={handleSelectChange("odometerType")}
            >
              <option value="off">Off</option>
              <option value="gps">GPS</option>
              <option value="sen">Sensor</option>
            </select>
          </div> */}
          {/* <div className={classes.width1}></div> */}
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.odometer || ""}
              onChange={handleInputChange("odometer")}
              maxLength="15"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className={classes.row2}>
          <div className={classes.width40}>Engine hours (h)</div>
          {/* <div className={classes.width19}>
            <select
              className={`${classes.select} ${classes.width100}`}
              value={formData.engineHoursType || "off"}
              onChange={handleSelectChange("engineHoursType")}
            >
              <option value="off">Off</option>
              <option value="acc">ACC</option>
              <option value="sen">Sensor</option>
            </select>
          </div>
          <div className={classes.width1}></div> */}
          <div className={classes.width60}>
            <input
              className={`${classes.inputbox} ${classes.width100}`}
              type="number"
              value={formData.engineHours || ""}
              onChange={handleInputChange("engineHours")}
              maxLength="15"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>
    </Box>
  );
};

export default MainTab;
