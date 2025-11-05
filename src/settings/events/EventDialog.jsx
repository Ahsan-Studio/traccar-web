import { useState, useEffect, act } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import { useCatch } from "../../reactHelper";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "900px",
      maxWidth: "75vw",
      height: "700px",
      maxHeight: "95vh",
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
  tabs: {
    backgroundColor: "#f5f5f5",
    minHeight: "31px !important",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "& .MuiTab-root": {
      marginTop: "6px",
      minHeight: "25px",
      minWidth: "50px",
      textTransform: "none",
      fontSize: "11px",
      fontWeight: "normal",
      padding: "4px 8px",
      color: "#444444",
      borderRadius: 0,
      "&.Mui-selected": {
        backgroundColor: "#ffffff",
        color: "#444444",
      },
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  },
  tabPanel: {
    padding: theme.spacing(2),
    height: "calc(100% - 31px)",
    overflow: "auto",
  },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f9f9f9",
  },
  actionButton: {
    fontSize: "12px",
    textTransform: "none",
    padding: "6px 16px",
  },
  titleBlock: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(0),
  },
  row: {
    marginBottom: "3px",
  },
  row2: {
    display: "flex",
    alignItems: "center",
    marginBottom: "3px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#686868",
    marginRight: theme.spacing(1),
    minWidth: "150px",
  },
  inputbox: {
    width: "100%",
    padding: "0px 5px",
    height: "24px",
    border: "1px solid #ccc",
    fontSize: "11px",
    color: "#444444",
    backgroundColor: "#ffffff",
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
    padding: "2px 5px",
    height: "24px",
    border: "1px solid #ccc",
    fontSize: "11px",
    color: "#444444",
    backgroundColor: "#ffffff",
    "&:focus": {
      outline: "none",
      borderColor: "#4a90e2",
    },
  },
  checkbox: {
    width: "15px",
    height: "15px",
    marginRight: "5px",
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "11px",
    color: "#444444",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  addButton: {
    fontSize: "11px",
    padding: "2px 8px",
    height: "24px",
    backgroundColor: "#4a90e2",
    color: "white",
    border: "none",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
  deleteButton: {
    fontSize: "11px",
    padding: "2px 8px",
    height: "24px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    cursor: "pointer",
    marginLeft: "5px",
    "&:hover": {
      backgroundColor: "#c82333",
    },
  },
  playButton: {
    fontSize: "11px",
    padding: "2px 8px",
    height: "24px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    cursor: "pointer",
    marginLeft: "5px",
    "&:hover": {
      backgroundColor: "#218838",
    },
  },
  textarea: {
    width: "100%",
    padding: "5px",
    border: "1px solid #ccc",
    fontSize: "11px",
    color: "#444444",
    backgroundColor: "#ffffff",
    fontFamily: "inherit",
    resize: "vertical",
    "&:focus": {
      outline: "none",
      borderColor: "#4a90e2",
    },
  },
  colorInput: {
    width: "60px",
    height: "24px",
    border: "1px solid #ccc",
    padding: "0px",
    cursor: "pointer",
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`event-tabpanel-${index}`}
    aria-labelledby={`event-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

const EventDialog = ({ open, onClose, eventId, onSave }) => {
  const { classes } = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Main tab state
  const [active, setActive] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("deviceOverspeed");
  // eslint-disable-next-line no-unused-vars
  const [devices, setDevices] = useState([]);
  const [routeTrigger, setRouteTrigger] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [routes, setRoutes] = useState([]);
  const [zoneTrigger, setZoneTrigger] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [zones, setZones] = useState([]);
  const [paramConditions, setParamConditions] = useState([]);

  // Time tab state
  const [durationEnabled, setDurationEnabled] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [weekDays, setWeekDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  });
  const [dayTimeEnabled, setDayTimeEnabled] = useState(false);
  const [dayTimes, setDayTimes] = useState({
    mon: { enabled: false, from: "00:00", to: "24:00" },
    tue: { enabled: false, from: "00:00", to: "24:00" },
    wed: { enabled: false, from: "00:00", to: "24:00" },
    thu: { enabled: false, from: "00:00", to: "24:00" },
    fri: { enabled: false, from: "00:00", to: "24:00" },
    sat: { enabled: false, from: "00:00", to: "24:00" },
    sun: { enabled: false, from: "00:00", to: "24:00" },
  });

  // Notifications tab state
  const [systemMessage, setSystemMessage] = useState(false);
  const [autoHide, setAutoHide] = useState(false);
  const [pushNotification, setPushNotification] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundFile, setSoundFile] = useState("");
  const [sounds, setSounds] = useState([]);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsNumbers, setSmsNumbers] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [smsTemplateId, setSmsTemplateId] = useState("");
  const [arrowEnabled, setArrowEnabled] = useState(false);
  const [arrowColor, setArrowColor] = useState("#FFFF00");
  const [listColorEnabled, setListColorEnabled] = useState(false);
  const [listColor, setListColor] = useState("#FFF000");

  // Webhook tab state
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Object control tab state
  const [commandEnabled, setCommandEnabled] = useState(false);
  const [commandId, setCommandId] = useState("");
  const [commandGateway, setCommandGateway] = useState("gprs");
  const [commandType, setCommandType] = useState("ascii");
  const [commandString, setCommandString] = useState("");

  // Load notification data if editing
  useEffect(() => {
    const loadNotification = async () => {
      if (!eventId || eventId === "new") return;

      setLoading(true);
      try {
        const notification = await fetchOrThrow(
          `/api/notifications/${eventId}`
        );

        // Main tab
        setActive(notification.always || false);
        setName(notification.description || "");
        setType(notification.type || "deviceOverspeed");
        setRouteTrigger(notification.routeTrigger || "");
        setZoneTrigger(notification.zoneTrigger || "");

        // Parse parameter conditions
        if (notification.parameterConditions) {
          try {
            const parsed = JSON.parse(notification.parameterConditions);
            const conditions = Object.entries(parsed).map(([key, value]) => ({
              parameter: key,
              operator: Object.keys(value)[0],
              value: Object.values(value)[0],
            }));
            setParamConditions(conditions);
          } catch {
            setParamConditions([]);
          }
        }

        // Time tab
        setDurationEnabled(notification.durationFromLastEvent || false);
        setDurationMinutes(notification.durationMinutes || 0);

        // Notifications tab
        const notificators = notification.notificators || "";
        setSystemMessage(notificators.includes("web"));
        setPushNotification(notificators.includes("firebase"));
        setEmailEnabled(notificators.includes("mail"));
        setSmsEnabled(notificators.includes("sms"));

        setAutoHide(notification.systemAutohide || false);
        setSoundEnabled(notification.soundEnabled || false);
        setSoundFile(notification.soundFile || "");
        setEmailAddresses(notification.emailAddresses || "");
        setSmsNumbers(notification.smsNumbers || "");
        setEmailTemplateId(notification.emailTemplateId || "");
        setSmsTemplateId(notification.smsTemplateId || "");
        setArrowEnabled(notification.arrowEnabled || false);
        setArrowColor(notification.arrowColor || "#FFFF00");
        setListColorEnabled(notification.listColorEnabled || false);
        setListColor(notification.listColor || "#FFF000");

        // Webhook tab
        setWebhookEnabled(!!notification.webhookUrl);
        setWebhookUrl(notification.webhookUrl || "");

        // Object control tab
        setCommandEnabled(notificators.includes("command"));
        setCommandId(notification.commandId || "");
      } catch (error) {
        console.error("Failed to load notification:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadNotification();
    }
  }, [eventId, open]);

  const handleSave = useCatch(async () => {
    // Build notificators string
    const notificators = [];
    if (systemMessage) notificators.push("web");
    if (pushNotification) notificators.push("firebase");
    if (emailEnabled) notificators.push("mail");
    if (smsEnabled) notificators.push("sms");
    if (commandEnabled) notificators.push("command");

    // Build parameter conditions JSON
    let parameterConditions = null;
    if (paramConditions.length > 0) {
      const conditionsObj = {};
      paramConditions.forEach((cond) => {
        conditionsObj[cond.parameter] = { [cond.operator]: cond.value };
      });
      parameterConditions = JSON.stringify(conditionsObj);
    }

    // Build week days string (1=enabled, 0=disabled)
    const weekDaysStr = Object.keys(weekDays)
      .sort((a, b) => {
        const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map((day) => (weekDays[day] ? "1" : "0"))
      .join(",");

    // Build day time JSON
    let dayTimeJson = null;
    if (dayTimeEnabled) {
      dayTimeJson = JSON.stringify(dayTimes);
    }

    const notification = {
      type,
      description: name,
      enabled: active,
      always: active,
      notificators: notificators.join(","),

      // Time
      durationFromLastEvent: durationEnabled,
      durationMinutes: durationEnabled ? durationMinutes : 0,
      weekDays: weekDaysStr,
      dayTime: dayTimeJson,

      // Notifications
      systemAutohide: autoHide,
      soundEnabled,
      soundFile: soundEnabled ? soundFile : null,
      emailAddresses: emailEnabled ? emailAddresses : null,
      smsNumbers: smsEnabled ? smsNumbers : null,
      emailTemplateId: emailTemplateId || null,
      smsTemplateId: smsTemplateId || null,
      arrowEnabled,
      arrowColor: arrowEnabled ? arrowColor : null,
      listColorEnabled,
      listColor: listColorEnabled ? listColor : null,

      // Advanced
      routeTrigger: routeTrigger || null,
      zoneTrigger: zoneTrigger || null,
      parameterConditions,

      // Webhook
      webhookUrl: webhookEnabled ? webhookUrl : null,

      // Command
      commandId: commandEnabled ? commandId : null,
    };

    try {
      if (eventId && eventId !== "new") {
        // Update existing
        await fetchOrThrow(`/api/notifications/${eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...notification, id: eventId }),
        });
      } else {
        // Create new
        await fetchOrThrow("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notification),
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save notification:", error);
      alert("Failed to save notification. Please try again.");
    }
  });

  const playSound = (file) => {
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch((e) => console.error("Failed to play sound:", e));
  };

  const addParamCondition = () => {
    setParamConditions([
      ...paramConditions,
      { parameter: "speed", operator: "gt", value: 0 },
    ]);
  };

  const removeParamCondition = (index) => {
    setParamConditions(paramConditions.filter((_, i) => i !== index));
  };

  const updateParamCondition = (index, field, value) => {
    const updated = [...paramConditions];
    updated[index][field] = field === "value" ? Number(value) : value;
    setParamConditions(updated);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Event properties</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0, height: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Main" />
          <Tab label="Time" />
          <Tab label="Notifications" />
          <Tab label="Webhook" />
          <Tab label="Object control" />
        </Tabs>

        {/* Main Tab */}
        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Box sx={{ display: "flex", gap: 3 }}>
            {/* Left Column - Event */}
            <Box sx={{ flex: 1 }}>
              <div className={classes.titleBlock}>Event</div>

              <div className={classes.row2}>
                <label className={classes.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={classes.checkbox}
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Name</span>
                <input
                  className={classes.inputbox}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Type</span>
                <select
                  className={classes.select}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="deviceOverspeed">SOS</option>
                  <option value="deviceMoving">Moving</option>
                  <option value="deviceStopped">Stopped</option>
                  <option value="geofenceEnter">Geofence enter</option>
                  <option value="geofenceExit">Geofence exit</option>
                  <option value="alarm">Alarm</option>
                  <option value="ignitionOn">Ignition on</option>
                  <option value="ignitionOff">Ignition off</option>
                  <option value="deviceOnline">Device online</option>
                  <option value="deviceOffline">Device offline</option>
                </select>
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Objects</span>
                <select className={classes.select}>
                  <option value="">Nothing selected</option>
                </select>
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Depending on routes</span>
                <select
                  className={classes.select}
                  value={routeTrigger}
                  onChange={(e) => setRouteTrigger(e.target.value)}
                >
                  <option value="">Off</option>
                  <option value="enter">In selected routes</option>
                  <option value="exit">Out of selected routes</option>
                </select>
              </div>

              {routeTrigger && (
                <div className={classes.row2}>
                  <span className={classes.label}>Routes</span>
                  <select className={classes.select}>
                    <option value="">Nothing selected</option>
                  </select>
                </div>
              )}

              <div className={classes.row2}>
                <span className={classes.label}>Depending on zones</span>
                <select
                  className={classes.select}
                  value={zoneTrigger}
                  onChange={(e) => setZoneTrigger(e.target.value)}
                >
                  <option value="">Off</option>
                  <option value="enter">In selected zones</option>
                  <option value="exit">Out of selected zones</option>
                </select>
              </div>

              {zoneTrigger && (
                <div className={classes.row2}>
                  <span className={classes.label}>Zones</span>
                  <select className={classes.select}>
                    <option value="">Nothing selected</option>
                  </select>
                </div>
              )}

              <div className={classes.row2}>
                <span className={classes.label}>Time period (min)</span>
                <input
                  className={classes.inputbox}
                  type="text"
                  placeholder=""
                />
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Speed limit (kph)</span>
                <input
                  className={classes.inputbox}
                  type="text"
                  placeholder=""
                />
              </div>
            </Box>

            {/* Right Column - Parameters and sensors */}
            <Box sx={{ flex: 1 }}>
              <div className={classes.titleBlock}>Parameters and sensors</div>

              {paramConditions.map((condition, index) => (
                <div
                  key={index}
                  className={classes.row2}
                  style={{ gap: "5px" }}
                >
                  <select
                    className={classes.select}
                    style={{ flex: 1 }}
                    value={condition.parameter}
                    onChange={(e) =>
                      updateParamCondition(index, "parameter", e.target.value)
                    }
                  >
                    <option value="speed">Speed</option>
                    <option value="fuel">Fuel</option>
                    <option value="temperature">Temperature</option>
                  </select>
                  <select
                    className={classes.select}
                    style={{ width: "60px" }}
                    value={condition.operator}
                    onChange={(e) =>
                      updateParamCondition(index, "operator", e.target.value)
                    }
                  >
                    <option value="gt">&gt;</option>
                    <option value="gte">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="lte">&lt;=</option>
                    <option value="eq">=</option>
                    <option value="ne">!=</option>
                  </select>
                  <input
                    className={classes.inputbox}
                    style={{ width: "80px" }}
                    type="number"
                    value={condition.value}
                    onChange={(e) =>
                      updateParamCondition(index, "value", e.target.value)
                    }
                  />
                  <button
                    className={classes.deleteButton}
                    onClick={() => removeParamCondition(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className={classes.addButton} onClick={addParamCondition}>
                + Add
              </button>
            </Box>
          </Box>
        </TabPanel>

        {/* Time Tab */}
        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <div className={classes.titleBlock}>Time</div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={durationEnabled}
                onChange={(e) => setDurationEnabled(e.target.checked)}
              />
              Duration from last event in minutes
            </label>
            {durationEnabled && (
              <input
                className={classes.inputbox}
                type="number"
                style={{ width: "80px", marginLeft: "10px" }}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            )}
          </div>

          <div style={{ marginTop: "15px", marginBottom: "8px" }}>
            <span
              style={{ fontSize: "11px", fontWeight: 600, color: "#686868" }}
            >
              Week days
            </span>
          </div>
          <div className={classes.row2}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
              const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
              return (
                <label
                  key={keys[i]}
                  className={classes.checkboxLabel}
                  style={{ marginRight: "10px" }}
                >
                  <input
                    type="checkbox"
                    className={classes.checkbox}
                    checked={weekDays[keys[i]]}
                    onChange={(e) =>
                      setWeekDays({ ...weekDays, [keys[i]]: e.target.checked })
                    }
                  />
                  {day}
                </label>
              );
            })}
          </div>

          <div className={classes.row2} style={{ marginTop: "15px" }}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={dayTimeEnabled}
                onChange={(e) => setDayTimeEnabled(e.target.checked)}
              />
              Day time
            </label>
          </div>

          {dayTimeEnabled && (
            <Box sx={{ mt: 2 }}>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, i) => {
                const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
                const key = keys[i];
                return (
                  <div key={key} className={classes.row2}>
                    <label
                      className={classes.checkboxLabel}
                      style={{ width: "100px" }}
                    >
                      <input
                        type="checkbox"
                        className={classes.checkbox}
                        checked={dayTimes[key].enabled}
                        onChange={(e) =>
                          setDayTimes({
                            ...dayTimes,
                            [key]: {
                              ...dayTimes[key],
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      {day}
                    </label>
                    <input
                      className={classes.inputbox}
                      type="time"
                      style={{ width: "100px", marginRight: "10px" }}
                      value={dayTimes[key].from}
                      onChange={(e) =>
                        setDayTimes({
                          ...dayTimes,
                          [key]: { ...dayTimes[key], from: e.target.value },
                        })
                      }
                      disabled={!dayTimes[key].enabled}
                    />
                    <input
                      className={classes.inputbox}
                      type="time"
                      style={{ width: "100px" }}
                      value={dayTimes[key].to}
                      onChange={(e) =>
                        setDayTimes({
                          ...dayTimes,
                          [key]: { ...dayTimes[key], to: e.target.value },
                        })
                      }
                      disabled={!dayTimes[key].enabled}
                    />
                  </div>
                );
              })}
            </Box>
          )}
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <div className={classes.titleBlock}>Notifications</div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={systemMessage}
                onChange={(e) => setSystemMessage(e.target.checked)}
              />
              System message
            </label>
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={autoHide}
                onChange={(e) => setAutoHide(e.target.checked)}
              />
              Auto hide
            </label>
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={pushNotification}
                onChange={(e) => setPushNotification(e.target.checked)}
              />
              Push notification
            </label>
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Sound alert
            </label>
            {soundEnabled && (
              <>
                <select
                  className={classes.select}
                  style={{ flex: 1, marginLeft: "10px" }}
                  value={soundFile}
                  onChange={(e) => setSoundFile(e.target.value)}
                >
                  {sounds.map((sound) => (
                    <option key={sound.name} value={sound.name}>
                      {sound.name}
                    </option>
                  ))}
                </select>
                <button
                  className={classes.playButton}
                  onClick={() => playSound(soundFile)}
                >
                  Play
                </button>
              </>
            )}
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              Message to e-mail, for multiple e-mails separate them by comma
            </label>
            {emailEnabled && (
              <input
                className={classes.inputbox}
                type="text"
                placeholder="E-mail address"
                style={{ flex: 1, marginLeft: "10px" }}
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
              />
            )}
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
              />
              SMS to mobile phone, for multiple phone numbers separate them by
              comma
            </label>
            {smsEnabled && (
              <input
                className={classes.inputbox}
                type="text"
                placeholder="Phone number with code"
                style={{ flex: 1, marginLeft: "10px" }}
                value={smsNumbers}
                onChange={(e) => setSmsNumbers(e.target.value)}
              />
            )}
          </div>

          {emailEnabled && (
            <div className={classes.row2}>
              <span className={classes.label}>E-mail template</span>
              <select
                className={classes.select}
                value={emailTemplateId}
                onChange={(e) => setEmailTemplateId(e.target.value)}
              >
                <option value="">Default</option>
              </select>
            </div>
          )}

          {smsEnabled && (
            <div className={classes.row2}>
              <span className={classes.label}>SMS template</span>
              <select
                className={classes.select}
                value={smsTemplateId}
                onChange={(e) => setSmsTemplateId(e.target.value)}
              >
                <option value="">Default</option>
              </select>
            </div>
          )}

          <div className={classes.titleBlock} style={{ marginTop: "20px" }}>
            Colors
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={arrowEnabled}
                onChange={(e) => setArrowEnabled(e.target.checked)}
              />
              Object arrow color
            </label>
            {arrowEnabled && (
              <select
                className={classes.select}
                style={{ width: "120px", marginLeft: "10px" }}
                value={arrowColor}
                onChange={(e) => setArrowColor(e.target.value)}
              >
                <option value="#FFFF00">Yellow</option>
                <option value="#FF0000">Red</option>
                <option value="#00FF00">Green</option>
                <option value="#0000FF">Blue</option>
                <option value="#FFA500">Orange</option>
              </select>
            )}
          </div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={listColorEnabled}
                onChange={(e) => setListColorEnabled(e.target.checked)}
              />
              Object list color
            </label>
            {listColorEnabled && (
              <input
                className={classes.colorInput}
                type="color"
                value={listColor}
                onChange={(e) => setListColor(e.target.value)}
                style={{ marginLeft: "10px" }}
              />
            )}
          </div>
        </TabPanel>

        {/* Webhook Tab */}
        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <div className={classes.titleBlock}>Webhook</div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
              />
              Send webhook
            </label>
          </div>

          {webhookEnabled && (
            <div className={classes.row}>
              <div style={{ marginBottom: "5px" }}>
                <span
                  className={classes.label}
                  style={{ display: "block", marginBottom: "5px" }}
                >
                  Webhook URL
                </span>
              </div>
              <textarea
                className={classes.textarea}
                rows={4}
                placeholder="ex. http://full_address_here"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
          )}
        </TabPanel>

        {/* Object Control Tab */}
        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <div className={classes.titleBlock}>Object control</div>

          <div className={classes.row2}>
            <label className={classes.checkboxLabel}>
              <input
                type="checkbox"
                className={classes.checkbox}
                checked={commandEnabled}
                onChange={(e) => setCommandEnabled(e.target.checked)}
              />
              Send command
            </label>
          </div>

          {commandEnabled && (
            <>
              <div className={classes.row2}>
                <span className={classes.label}>Template</span>
                <select
                  className={classes.select}
                  value={commandId}
                  onChange={(e) => setCommandId(e.target.value)}
                >
                  <option value="">Custom</option>
                </select>
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Gateway</span>
                <select
                  className={classes.select}
                  value={commandGateway}
                  onChange={(e) => setCommandGateway(e.target.value)}
                >
                  <option value="gprs">GPRS</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div className={classes.row2}>
                <span className={classes.label}>Type</span>
                <select
                  className={classes.select}
                  value={commandType}
                  onChange={(e) => setCommandType(e.target.value)}
                >
                  <option value="ascii">ASCII</option>
                  <option value="hex">HEX</option>
                </select>
              </div>

              <div className={classes.row}>
                <div style={{ marginBottom: "5px" }}>
                  <span
                    className={classes.label}
                    style={{ display: "block", marginBottom: "5px" }}
                  >
                    Command
                  </span>
                </div>
                <textarea
                  className={classes.textarea}
                  rows={3}
                  value={commandString}
                  onChange={(e) => setCommandString(e.target.value)}
                />
              </div>
            </>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          className={classes.actionButton}
          disabled={loading}
          sx={{
            backgroundColor: "#4a90e2",
            "&:hover": { backgroundColor: "#357abd" },
          }}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          className={classes.actionButton}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
