import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";
import {
  CustomSelect,
  CustomCheckbox,
  CustomButton,
  CustomInput,
  CustomMultiSelect,
} from "../../common/components/custom";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: 0,
    height: "100%",
    overflow: "auto",
  },
  body: {
    padding: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#2b82d4",
    paddingBottom: '5px',
    marginBottom: '10px',
    borderBottom: `1px solid #f5f5f5`,
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '3px',
  },
  label: {
    fontSize: 11,
    fontWeight: 400,
    color: '#444444',
    width: '200px',
    flexShrink: 0,
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#2196f3',
  },
  select: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    minWidth: '200px',
    height: '32px',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
    },
  },
  colorInput: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100px',
    height: '32px',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
    },
  },
  colorPicker: {
    width: '50px',
    height: '32px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    padding: '2px',
    backgroundColor: 'white',
  },
  colorPreview: {
    width: '60px',
    height: '32px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginLeft: '8px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  playButton: {
    fontSize: 13,
    padding: '6px 16px',
    height: '32px',
    textTransform: 'none',
    marginLeft: '8px',
  },
  multiCheckboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 13,
  },
  timePickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeInput: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '80px',
    height: '32px',
    textAlign: 'center',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
    },
  },
  datePicker: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: '4px',
    height: '32px',
    cursor: 'pointer',
    '&:focus': {
      outline: 'none',
      borderColor: '#2196f3',
    },
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
}));

const UserInterfaceTab = ({ onSave }) => {
  const { classes } = useStyles();
  const user = useSelector((state) => state.session.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Notifications
  const [pushNotifications, setPushNotifications] = useState(false);
  const [chatSound, setChatSound] = useState("alarm1.mp3");

  // Dashboard
  const [openAfterLogin, setOpenAfterLogin] = useState(true);

  // Map
  const [mapStartupPosition, setMapStartupPosition] = useState("Fit objects");
  const [mapIconSize, setMapIconSize] = useState("100%");
  const [historyRouteColor, setHistoryRouteColor] = useState("FF0000");
  const [historyRouteHighlightColor, setHistoryRouteHighlightColor] = useState("0000FF");
  const [objectDetailsPopup, setObjectDetailsPopup] = useState(true);

  // Groups
  const [collapsedObjects, setCollapsedObjects] = useState(false);
  const [collapsedMarkers, setCollapsedMarkers] = useState(false);
  const [collapsedRoutes, setCollapsedRoutes] = useState(false);
  const [collapsedZones, setCollapsedZones] = useState(false);

  // Object list
  const [objectListDetails, setObjectListDetails] = useState("deviceStatus");
  const [noConnectionColor, setNoConnectionColor] = useState("FFAEAE");
  const [noConnectionColorEnabled, setNoConnectionColorEnabled] = useState(false);
  const [stoppedColor, setStoppedColor] = useState("FFAEAE");
  const [stoppedColorEnabled, setStoppedColorEnabled] = useState(true);
  const [movingColor, setMovingColor] = useState("B0E57C");
  const [movingColorEnabled, setMovingColorEnabled] = useState(true);
  const [engineIdleColor, setEngineIdleColor] = useState("FFF0AA");
  const [engineIdleColorEnabled, setEngineIdleColorEnabled] = useState(true);

  // Data list
  const [dataListPosition, setDataListPosition] = useState("bottomPanel");
  const [dataListItems, setDataListItems] = useState([
    "odometer",
    "engine_hours",
    "status",
  ]);

  // Other
  const [language, setLanguage] = useState("en");
  const [speedUnit, setSpeedUnit] = useState("kn");
  const [unitOfDistance, setUnitOfDistance] = useState("km");
  const [unitOfCapacity, setUnitOfCapacity] = useState("ltr");
  const [unitOfTemperature, setUnitOfTemperature] = useState("C");
  const [currency, setCurrency] = useState("EUR");
  const [timeZone, setTimeZone] = useState("UTC");
  const [dstEnabled, setDstEnabled] = useState(false);
  const [dstStart, setDstStart] = useState("");
  const [dstEnd, setDstEnd] = useState("");

  // Play audio function
  const playSound = () => {
    if (chatSound && chatSound !== "No sound") {
      try {
        // Load from resources/sounds folder
        const audio = new Audio(`/resources/sounds/${chatSound}`);
        audio.play().catch((err) => {
          console.error('Error playing sound:', err);
          // Fallback to default alarm.mp3 if specific file not found
          const fallbackAudio = new Audio('/resources/alarm.mp3');
          fallbackAudio.play().catch((fallbackErr) => {
            console.error('Error playing fallback sound:', fallbackErr);
            setError('Audio file not found');
          });
        });
      } catch (err) {
        console.error('Error creating audio:', err);
        setError('Failed to play audio');
      }
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        const attrs = userData.attributes || {};
        
        // Notifications
        setPushNotifications(attrs.enablePushNotif || false);
        setChatSound(attrs.soundAlarms || "alarm1.mp3");
        
        // Dashboard
        setOpenAfterLogin(attrs.openDashboardAfterLogin !== false);
        
        // Map
        setMapStartupPosition(attrs.map?.startupPosition || "Fit objects");
        setMapIconSize(attrs.map?.iconSize || "100%");
        setHistoryRouteColor(attrs.map?.routeColor || "FF0000");
        setHistoryRouteHighlightColor(attrs.map?.routeHistoryColor || "0000FF");
        setObjectDetailsPopup(attrs.map?.isObjectDetailPopupOnMouseHover !== false);
        
        // Groups
        const groupCollapsed = attrs.groupCollapsed || {};
        setCollapsedObjects(groupCollapsed.objects || false);
        setCollapsedMarkers(groupCollapsed.markers || false);
        setCollapsedRoutes(groupCollapsed.routes || false);
        setCollapsedZones(groupCollapsed.zones || false);
        
        // Object list
        setObjectListDetails(attrs.objectList?.detail || "deviceStatus");
        setNoConnectionColorEnabled(attrs.objectList?.noConnectionColorEnabled || false);
        setNoConnectionColor(attrs.objectList?.noConnectionColor || "FFAEAE");
        setStoppedColorEnabled(attrs.objectList?.stoppedColorEnabled !== false);
        setStoppedColor(attrs.objectList?.stoppedColor || "FFAEAE");
        setMovingColorEnabled(attrs.objectList?.movingColorEnabled !== false);
        setMovingColor(attrs.objectList?.movingColor || "B0E57C");
        setEngineIdleColorEnabled(attrs.objectList?.engineIdleColorEnabled !== false);
        setEngineIdleColor(attrs.objectList?.engineIdleColor || "FFF0AA");
        
        // Data list
        setDataListPosition(attrs.datalistPosition || "bottomPanel");
        setDataListItems(attrs.datalistItems || ["odometer", "engine_hours", "status"]);
        
        // Other
        setLanguage(attrs.language || "en");
        setSpeedUnit(attrs.speedUnit || "kn");
        setUnitOfDistance(attrs.distanceUnit || "km");
        setUnitOfCapacity(attrs.volumeUnit || "ltr");
        setUnitOfTemperature(attrs.temperatureUnit || "C");
        setCurrency(attrs.currency || "EUR");
        setTimeZone(attrs.timezone || "UTC");
        setDstEnabled(attrs.dstEnabled || false);
        setDstStart(attrs.dstStart || "");
        setDstEnd(attrs.dstEnd || "");
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user interface settings');
    } finally {
      setLoading(false);
    }
  };

    const handleSave = async () => {
    console.log('User Interface Tab handleSave called');
    
    if (!user?.id) {
      setError('User not found');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      // Fetch current user data first
      const currentResponse = await fetch(`/api/users/${user.id}`);
      if (!currentResponse.ok) {
        throw new Error('Failed to fetch current user data');
      }
      const currentUser = await currentResponse.json();

      // Prepare attributes
      const attributes = {
        ...currentUser.attributes,
        
        // Notifications
        enablePushNotif: pushNotifications,
        soundAlarms: chatSound,
        
        // Dashboard
        openDashboardAfterLogin: openAfterLogin,
        
        // Map
        map: {
          startupPosition: mapStartupPosition,
          iconSize: mapIconSize,
          routeColor: historyRouteColor,
          routeHistoryColor: historyRouteHighlightColor,
          isObjectDetailPopupOnMouseHover: objectDetailsPopup,
        },
        
        // Groups
        groupCollapsed: {
          objects: collapsedObjects,
          markers: collapsedMarkers,
          routes: collapsedRoutes,
          zones: collapsedZones,
        },
        
        // Object list
        objectList: {
          detail: objectListDetails,
          noConnectionColorEnabled: noConnectionColorEnabled,
          noConnectionColor: noConnectionColor,
          stoppedColorEnabled: stoppedColorEnabled,
          stoppedColor: stoppedColor,
          movingColorEnabled: movingColorEnabled,
          movingColor: movingColor,
          engineIdleColorEnabled: engineIdleColorEnabled,
          engineIdleColor: engineIdleColor,
        },
        
        // Data list
        datalistPosition: dataListPosition,
        datalistItems: dataListItems,
        
        // Other
        language: language,
        speedUnit: speedUnit,
        distanceUnit: unitOfDistance,
        volumeUnit: unitOfCapacity,
        temperatureUnit: unitOfTemperature,
        currency: currency,
        timezone: timeZone,
        dstEnabled: dstEnabled,
        dstStart: dstStart,
        dstEnd: dstEnd,
      };

      // Update user with new attributes
      const updateData = {
        ...currentUser,
        attributes: attributes,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccessMessage('User interface settings saved successfully');
        if (onSave) {
          onSave();
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save user interface settings');
      }
    } catch (err) {
      console.error('Error saving user interface settings:', err);
      setError(err.message || 'Failed to save user interface settings');
    }
  };

  // Expose handleSave to parent component via window object
  useEffect(() => {
    window.userInterfaceTabSave = handleSave;
    
    return () => {
      delete window.userInterfaceTabSave;
    };
  }, [
    pushNotifications, chatSound, openAfterLogin, mapStartupPosition,
    mapIconSize, historyRouteColor, historyRouteHighlightColor, objectDetailsPopup,
    collapsedObjects, collapsedMarkers, collapsedRoutes, collapsedZones,
    objectListDetails, noConnectionColor, noConnectionColorEnabled, stoppedColor,
    stoppedColorEnabled, movingColor, movingColorEnabled, engineIdleColor,
    engineIdleColorEnabled, dataListPosition, dataListItems, language,
    unitOfDistance, unitOfCapacity, unitOfTemperature, currency, timeZone,
    dstEnabled, dstStart, dstEnd, speedUnit
  ]);

  if (loading) {
    return (
      <Box className={classes.loading}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.body}>
        {/* Notifications Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Notifications</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Push notifications</Typography>
            <CustomCheckbox
              checked={pushNotifications}
              onChange={(checked) => setPushNotifications(checked)}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>New chat message sound alert</Typography>
            <Box className={classes.colorRow}>
              <CustomSelect
                value={chatSound}
                onChange={(value) => setChatSound(value)}
                options={[
                  "No sound",
                  "alarm1.mp3",
                  "alarm2.mp3",
                  "alarm3.mp3",
                  "alarm4.mp3",
                  "alarm5.mp3",
                  "alarm6.mp3",
                  "alarm7.mp3",
                  "alarm8.mp3",
                  "beep1.mp3",
                  "beep2.mp3",
                  "beep3.mp3",
                  "beep4.mp3",
                  "beep5.mp3"
                ]}
              />
              <CustomButton 
                variant="outlined" 
                color="default"
                size="small"
                onClick={playSound}
              >
                Play
              </CustomButton>
            </Box>
          </Box>
        </Box>

        {/* Dashboard Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Dashboard</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Open after login</Typography>
            <CustomCheckbox
              checked={openAfterLogin}
              onChange={(checked) => setOpenAfterLogin(checked)}
            />
          </Box>
        </Box>

        {/* Map Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Map</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Map startup position</Typography>
            <CustomSelect
              value={mapStartupPosition}
              onChange={(value) => setMapStartupPosition(value)}
              options={[
                "Fit objects",
                "Last position",
                "Custom"
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Map icon size</Typography>
            <CustomSelect
              value={mapIconSize}
              onChange={(value) => setMapIconSize(value)}
              options={[
                "50%",
                "75%",
                "100%",
                "125%",
                "150%"
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>History route color</Typography>
            <Box className={classes.colorRow}>
              <CustomInput 
                type="color"
                value={`#${historyRouteColor}`} 
                onChange={(value) => setHistoryRouteColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={historyRouteColor} 
                onChange={(value) => setHistoryRouteColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="FF0000"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>History route highlight color</Typography>
            <Box className={classes.colorRow}>
              <CustomInput 
                type="color"
                value={`#${historyRouteHighlightColor}`} 
                onChange={(value) => setHistoryRouteHighlightColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={historyRouteHighlightColor} 
                onChange={(value) => setHistoryRouteHighlightColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="0000FF"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Object details popup on cluster mouse hover</Typography>
            <CustomCheckbox
              checked={objectDetailsPopup}
              onChange={(checked) => setObjectDetailsPopup(checked)}
            />
          </Box>
        </Box>

        {/* Groups Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Groups</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Collapsed</Typography>
            <Box className={classes.multiCheckboxRow}>
              <CustomCheckbox
                checked={collapsedObjects}
                onChange={(checked) => setCollapsedObjects(checked)}
                label="Objects"
              />
              <CustomCheckbox
                checked={collapsedMarkers}
                onChange={(checked) => setCollapsedMarkers(checked)}
                label="Markers"
              />
              <CustomCheckbox
                checked={collapsedRoutes}
                onChange={(checked) => setCollapsedRoutes(checked)}
                label="Routes"
              />
              <CustomCheckbox
                checked={collapsedZones}
                onChange={(checked) => setCollapsedZones(checked)}
                label="Zones"
              />
            </Box>
          </Box>
        </Box>

        {/* Object list Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Object list</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Details</Typography>
            <CustomSelect
              value={objectListDetails}
              onChange={(value) => setObjectListDetails(value)}
              options={[
                { value: "deviceStatus", label: "Device Status" },
                { value: "deviceTime", label: "Device Time" },
                { value: "serverTime", label: "Server Time" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>No connection color</Typography>
            <Box className={classes.colorRow}>
              <CustomCheckbox
                checked={noConnectionColorEnabled}
                onChange={(checked) => setNoConnectionColorEnabled(checked)}
              />
              <CustomInput 
                type="color"
                value={`#${noConnectionColor}`} 
                onChange={(value) => setNoConnectionColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={noConnectionColor} 
                onChange={(value) => setNoConnectionColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="FFAEAE"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Stopped color</Typography>
            <Box className={classes.colorRow}>
              <CustomCheckbox
                checked={stoppedColorEnabled}
                onChange={(checked) => setStoppedColorEnabled(checked)}
              />
              <CustomInput 
                type="color"
                value={`#${stoppedColor}`} 
                onChange={(value) => setStoppedColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={stoppedColor} 
                onChange={(value) => setStoppedColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="FFAEAE"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Moving color</Typography>
            <Box className={classes.colorRow}>
              <CustomCheckbox
                checked={movingColorEnabled}
                onChange={(checked) => setMovingColorEnabled(checked)}
              />
              <CustomInput 
                type="color"
                value={`#${movingColor}`} 
                onChange={(value) => setMovingColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={movingColor} 
                onChange={(value) => setMovingColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="B0E57C"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Engine idle color</Typography>
            <Box className={classes.colorRow}>
              <CustomCheckbox
                checked={engineIdleColorEnabled}
                onChange={(checked) => setEngineIdleColorEnabled(checked)}
              />
              <CustomInput 
                type="color"
                value={`#${engineIdleColor}`} 
                onChange={(value) => setEngineIdleColor(value.replace('#', '').toUpperCase())} 
                size="small"
                style={{ width: '50px' }}
              />
              <CustomInput 
                type="text"
                value={engineIdleColor} 
                onChange={(value) => setEngineIdleColor(value.toUpperCase())} 
                maxLength={6}
                placeholder="FFF0AA"
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          </Box>
        </Box>

        {/* Data list Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Data list</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Position</Typography>
            <CustomSelect
              value={dataListPosition} 
              onChange={(value) => setDataListPosition(value)}
              options={[
                { value: "leftPanel", label: "Left Panel" },
                { value: "bottomPanel", label: "Bottom Panel with Icons" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Items</Typography>
            <CustomMultiSelect
              value={dataListItems} 
              onChange={(values) => setDataListItems(values)}
              options={[
                // General group
                { group: "General", value: "odometer", label: "Odometer" },
                { group: "General", value: "engine_hours", label: "Engine Hours" },
                { group: "General", value: "status", label: "Status" },
                { group: "General", value: "model", label: "Model" },
                { group: "General", value: "vin", label: "VIN" },
                { group: "General", value: "plate_number", label: "Plate Number" },
                { group: "General", value: "sim_number", label: "SIM Card Number" },
                { group: "General", value: "driver", label: "Driver" },
                { group: "General", value: "trailer", label: "Trailer" },
                { group: "General", value: "engine_status", label: "EngineStatus" },
                // Location group
                { group: "Location", value: "time_position", label: "Time (Position)" },
                { group: "Location", value: "time_server", label: "Time (Server)" },
                { group: "Location", value: "address", label: "Address" },
                { group: "Location", value: "position", label: "Position" },
                { group: "Location", value: "speed", label: "Speed" },
                { group: "Location", value: "altitude", label: "Altitude" },
                { group: "Location", value: "angle", label: "Angle" },
                { group: "Location", value: "nearest_zone", label: "Nearest Zone" },
                { group: "Location", value: "nearest_marker", label: "Nearest Marker" },
              ]}
              placeholder="Select data items to display"
            />
          </Box>
        </Box>

        {/* Other Section */}
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Other</Typography>
          
          <Box className={classes.formRow}>
            <Typography className={classes.label}>Language</Typography>
            <CustomSelect
              value={language}
              onChange={(value) => setLanguage(value)}
              options={[
                { value: "en", label: "English" },
                { value: "id", label: "Bahasa Indonesia" },
                { value: "es", label: "Español" },
                { value: "fr", label: "Français" },
                { value: "de", label: "Deutsch" },
                { value: "zh", label: "中文" },
                { value: "ja", label: "日本語" },
                { value: "ar", label: "العربية" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Unit of distance</Typography>
            <CustomSelect
              value={unitOfDistance} 
              onChange={(value) => setUnitOfDistance(value)}
              options={[
                { value: "km", label: "Kilometer" },
                { value: "mi", label: "Mile" },
                { value: "nmi", label: "Nautical Mile" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Unit of speed</Typography>
            <CustomSelect
              value={speedUnit} 
              onChange={(value) => setSpeedUnit(value)}
              options={[
                { value: "kn", label: "Knot" },
                { value: "kmh", label: "km/h" },
                { value: "mph", label: "mph" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Unit of capacity</Typography>
            <CustomSelect
              value={unitOfCapacity} 
              onChange={(value) => setUnitOfCapacity(value)}
              options={[
                { value: "ltr", label: "Liter" },
                { value: "gal", label: "Gallon" }
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Unit of temperature</Typography>
            <CustomSelect
              value={unitOfTemperature} 
              onChange={(value) => setUnitOfTemperature(value)}
              options={[
                "Celsius",
                "Fahrenheit"
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Currency</Typography>
            <CustomInput 
              type="text"
              value={currency} 
              onChange={(value) => setCurrency(value)} 
              size="small"
              style={{ width: '100px' }}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Time zone</Typography>
            <CustomSelect
              value={timeZone} 
              onChange={(value) => setTimeZone(value)}
              options={[
                "(UTC +7:00)",
                "(UTC +8:00)",
                "(UTC +9:00)"
              ]}
            />
          </Box>

          <Box className={classes.formRow}>
            <Typography className={classes.label}>Daylight saving time (DST)</Typography>
            <Box className={classes.timePickerRow}>
              <CustomCheckbox
                checked={dstEnabled}
                onChange={(checked) => setDstEnabled(checked)}
              />
              <CustomInput 
                type="date"
                size="small"
              />
              <CustomInput 
                type="time"
                value={dstStart} 
                onChange={(value) => setDstStart(value)}
                size="small"
                style={{ width: '80px', textAlign: 'center' }}
              />
              <Typography sx={{ fontSize: 13 }}>-</Typography>
              <CustomInput 
                type="date"
                size="small"
              />
              <CustomInput 
                type="time"
                value={dstEnd} 
                onChange={(value) => setDstEnd(value)}
                size="small"
                style={{ width: '80px', textAlign: 'center' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserInterfaceTab;
