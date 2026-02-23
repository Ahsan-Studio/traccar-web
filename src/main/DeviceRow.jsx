import { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { makeStyles } from "tss-react/mui";
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatSpeed } from '../common/util/formatter';
import {
  IconButton,
  Tooltip,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Checkbox,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import BuildIcon from "@mui/icons-material/Build";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { devicesActions } from "../store";
import { useAdministrator } from "../common/util/permissions";
import { useAttributePreference } from "../common/util/preferences";
import EditDeviceDialog from "../settings/object/EditDeviceDialog";
import FollowDialog from "./FollowDialog";
import useDeviceStatus from "../common/hooks/useDeviceStatus";
import useDeviceMaintenance from "../common/hooks/useDeviceMaintenance";

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: "25px",
    height: "25px",
    filter: "brightness(0) invert(1)",
  },
  batteryText: {
    fontSize: "0.75rem",
    fontWeight: "normal",
    lineHeight: "0.875rem",
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DeviceRow = ({
  data,
  index,
  style,
  onShowHistory,
  onShowSendCommand,
}) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();
  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const visibility = useSelector((state) => state.devices.visibility);
  const focused = useSelector((state) => state.devices.focused);

  const item = data[index];
  const position = useSelector((state) => state.session.positions[item.id]);
  const positionOutdated = position?.outdated;
  const positionValid = position?.valid;

  const isVisible = visibility[item.id] !== false; // default true
  const isFocused = focused[item.id] === true; // default false

  // Calculate device status
  const deviceStatus = useDeviceStatus(item, position, 600); // 600 seconds = 10 minutes timeout

  // Get maintenance/service alerts
  const { hasExpired, hasWarning } = useDeviceMaintenance(item.id, position);

  // Context menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  // Submenu state for Show history
  const [historyMenuAnchorEl, setHistoryMenuAnchorEl] = useState(null);
  const historyMenuOpen = Boolean(historyMenuAnchorEl);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Follow dialog state
  const [followDialogOpen, setFollowDialogOpen] = useState(false);

  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback((event) => {
    if (event) event.stopPropagation();
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null);
  }, []);

  const handleHistoryMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setHistoryMenuAnchorEl(event.currentTarget);
  }, []);

  const handleHistoryMenuClose = useCallback((event) => {
    if (event) event.stopPropagation();
    setHistoryMenuAnchorEl(null);
  }, []);

  const handleVisibilityToggle = useCallback((event) => {
    event.stopPropagation();
    dispatch(devicesActions.toggleVisibility(item.id));
  }, [dispatch, item.id]);

  const handleFocusToggle = useCallback((event) => {
    event.stopPropagation();
    dispatch(devicesActions.toggleFocused(item.id));
  }, [dispatch, item.id]);

  const handleEdit = useCallback(() => {
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null);
    setEditDialogOpen(true);
  }, []);

  const handleFollow = useCallback(() => {
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null);
    setFollowDialogOpen(true);
  }, []);

  const handleFollowNewWindow = useCallback(() => {
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null);
    window.open(`/follow/${item.id}`, "_blank");
  }, [item.id]);

  const handleCloseEditDialog = useCallback(() => setEditDialogOpen(false), []);
  const handleCloseFollowDialog = useCallback(() => setFollowDialogOpen(false), []);

  const handleSendCommand = useCallback(() => {
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null);
    if (onShowSendCommand) {
      onShowSendCommand(item.id);
    }
  }, [onShowSendCommand, item.id]);

  const handleShowHistory = useCallback((period) => {
    const periodMap = {
      lastHour: "1",
      today: "2",
      yesterday: "3",
      before2days: "4",
      before3days: "5",
      thisWeek: "6",
      lastWeek: "7",
      thisMonth: "8",
      lastMonth: "9",
    };
    if (onShowHistory) {
      onShowHistory(item.id, periodMap[period] || "2");
    }
    handleMenuClose();
  }, [onShowHistory, item.id, handleMenuClose]);

  const deviceIcon = useMemo(() => {
    const apiIcon = item.attributes?.icon?.deviceImage;
    if (apiIcon) {
      if (!apiIcon.startsWith("/")) {
        return `/img/markers/objects/${apiIcon}`;
      }
      return apiIcon;
    }
    return "/img/markers/objects/land-car.svg";
  }, [item.attributes?.icon?.deviceImage]);

  // Get user settings for color coding
  const user = useSelector((state) => state.session.user);
  const objectListSettings = user?.attributes?.objectList || {};

  const rowBackgroundColor = useMemo(() => {
    const baseColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
    if (deviceStatus.type === "offline" && objectListSettings.noConnectionColorEnabled) {
      return `#${objectListSettings.noConnectionColor || "FFAEAE"}`;
    }
    if (deviceStatus.type === "stopped" && objectListSettings.stoppedColorEnabled) {
      return `#${objectListSettings.stoppedColor || "FFAEAE"}`;
    }
    if (deviceStatus.type === "moving" && objectListSettings.movingColorEnabled) {
      return `#${objectListSettings.movingColor || "B0E57C"}`;
    }
    if (deviceStatus.type === "idle" && objectListSettings.engineIdleColorEnabled) {
      return `#${objectListSettings.engineIdleColor || "FFF0AA"}`;
    }
    return baseColor;
  }, [index, deviceStatus.type, objectListSettings]);

  const devicePrimary = useAttributePreference("devicePrimary", "name");
  const speedUnit = useAttributePreference('speedUnit', 'kmh');

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={selectedDeviceId === item.id ? classes.selected : null}
        style={{ paddingLeft: 4 }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          padding: 0,
          height: "33px",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: rowBackgroundColor,
          "&:hover": {
            backgroundColor:
              selectedDeviceId === item.id ? "#e3f2fd" : "#f5f5f5",
          },
          "&.Mui-selected": {
            backgroundColor: "#e3f2fd",
          },
          "&.Mui-selected:hover": {
            backgroundColor: "#e3f2fd",
          },
        }}
      >
        {/* Checkbox 1: Visibility Toggle */}
        <Tooltip title={isVisible ? t('sharedHide') : 'Show marker'}>
          <Checkbox
            size="small"
            checked={isVisible}
            onClick={handleVisibilityToggle}
            icon={<VisibilityOffIcon sx={{ fontSize: 13 }} />}
            checkedIcon={<VisibilityIcon sx={{ fontSize: 13 }} />}
            sx={{
              padding: "2px",
              marginRight: "2px",
              "& svg": { fontSize: 13 },
            }}
          />
        </Tooltip>

        {/* Checkbox 2: Focus to Device */}
        <Tooltip title={t('deviceFollow') + ' / Center'}>
          <Checkbox
            size="small"
            checked={isFocused}
            onClick={handleFocusToggle}
            disabled={!position}
            icon={<MyLocationIcon sx={{ fontSize: 13, color: "#ccc" }} />}
            checkedIcon={
              <MyLocationIcon sx={{ fontSize: 13, color: "#1976d2" }} />
            }
            sx={{
              padding: "2px",
              marginRight: "2px",
              "& svg": { fontSize: 13 },
            }}
          />
        </Tooltip>

        <Box
          component="img"
          src={deviceIcon}
          alt={item.name}
          onError={(e) => {
            console.error("Failed to load icon:", deviceIcon);
            e.target.src = "/img/markers/objects/land-car.svg";
          }}
          sx={{
            width: 18,
            height: 18,
            marginTop: "2px",
            objectFit: "contain",
          }}
        />

        {/* Device Info */}
        <Box sx={{ flex: 1 }}>
          <ListItemText
            primary={item[devicePrimary]}
            secondary={deviceStatus.text}
            slots={{
              primary: Typography,
              secondary: Typography,
            }}
            slotProps={{
              primary: { noWrap: true, fontSize: "11px" },
              secondary: {
                noWrap: true,
                fontSize: "10px",
                color: "text.secondary",
              },
            }}
          />
        </Box>

        {/* Status Icons */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography sx={{ fontSize: "11px" }}>
            {formatSpeed(position?.speed ?? 0, speedUnit, t)}
          </Typography>

          {position?.attributes?.ignition === false && (
            <Tooltip title={t('positionIgnition') + ': OFF'}>
              <Box
                component="img"
                src="/img/theme/engine-off.svg"
                sx={{ width: 16, height: 16 }}
              />
            </Tooltip>
          )}
          {position?.attributes?.ignition === true && (
            <Tooltip title={t('positionIgnition') + ': ON'}>
              <Box
                component="img"
                src="/img/theme/engine-on.svg"
                sx={{ width: 16, height: 16 }}
              />
            </Tooltip>
          )}
          <Tooltip
            title={
              !position
                ? t('deviceStatusUnknown')
                : !positionValid
                  ? t('deviceStatusOffline')
                  : positionOutdated
                    ? t('deviceStatusOffline')
                    : t('deviceStatusOnline')
            }
          >
            <Box
              component="img"
              src={
                !position || positionOutdated
                  ? '/img/theme/connection-no.svg'
                  : !positionValid
                    ? '/img/theme/connection-gsm.svg'
                    : '/img/theme/connection-gsm-gps.svg'
              }
              sx={{ width: 16, height: 16 }}
            />
          </Tooltip>

          {/* Service/Maintenance Alert */}
          {hasExpired && (
            <Tooltip title={`${t('eventMaintenance')} - Expired`}>
              <BuildIcon
                sx={{
                  fontSize: 16,
                  color: "#f44336",
                }}
              />
            </Tooltip>
          )}
          {!hasExpired && hasWarning && (
            <Tooltip title={`${t('eventMaintenance')} - Warning`}>
              <BuildIcon
                sx={{
                  fontSize: 16,
                  color: "#ff9800",
                }}
              />
            </Tooltip>
          )}

          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {/* Main action menu — styled after old version */}
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            onClick={(e) => e.stopPropagation()}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  minWidth: 200,
                  borderRadius: 0,
                  backgroundColor: "#ffffff",
                  boxShadow: "0 0 5px 0 #9b9b9b",
                  "& .MuiList-root": { padding: 0 },
                },
              },
            }}
          >
            {/* Show history — first item gets blue top border accent */}
            <MenuItem
              onClick={handleHistoryMenuOpen}
              sx={{
                borderTop: "3px solid #2b82d4",
                borderBottom: "1px solid #f5f5f5",
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/time.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444", flex: 1 }}>
                Show history
              </Typography>
              <Box
                component="img"
                src="/img/theme/arrow-right.svg"
                sx={{ width: 10, height: 10, ml: "8px", flexShrink: 0 }}
              />
            </MenuItem>
            <MenuItem
              onClick={handleFollow}
              sx={{
                borderBottom: "1px solid #f5f5f5",
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/follow.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444" }}>
                Follow
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={handleFollowNewWindow}
              sx={{
                borderBottom: "1px solid #f5f5f5",
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/follow.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444" }}>
                Follow (New Window)
              </Typography>
            </MenuItem>
            <MenuItem
              disabled={!position}
              onClick={() => {
                handleMenuClose();
                const lat = position.latitude;
                const lng = position.longitude;
                const streetViewUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m7!1e1!3m5!1e2!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com!7i16384!8i8192?entry=ttu`;
                window.open(streetViewUrl, "_blank");
              }}
              sx={{
                borderBottom: "1px solid #f5f5f5",
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/street-view.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0, opacity: !position ? 0.4 : 1 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444" }}>
                Street View (new window)
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={handleSendCommand}
              sx={{
                borderBottom: "1px solid #f5f5f5",
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/cmd.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444" }}>
                Send command
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={handleEdit}
              sx={{
                py: "5px",
                px: "10px",
                minHeight: "auto",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <Box
                component="img"
                src="/img/theme/edit.svg"
                sx={{ width: 10, height: 10, mr: "8px", flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: "13px", color: "#444" }}>
                Edit
              </Typography>
            </MenuItem>
          </Menu>

          {/* Show history submenu */}
          <Menu
            anchorEl={historyMenuAnchorEl}
            open={historyMenuOpen}
            onClose={handleHistoryMenuClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  minWidth: 170,
                  borderRadius: 0,
                  backgroundColor: "#ffffff",
                  boxShadow: "3px 0 5px 0 #9b9b9b",
                  "& .MuiList-root": { padding: 0 },
                },
              },
            }}
          >
            {[
              { key: "lastHour",   label: "Last hour" },
              { key: "today",      label: "Today" },
              { key: "yesterday",  label: "Yesterday" },
              { key: "before2days", label: "Before 2 days" },
              { key: "before3days", label: "Before 3 days" },
              { key: "thisWeek",   label: "This week" },
              { key: "lastWeek",   label: "Last week" },
              { key: "thisMonth",  label: "This month" },
              { key: "lastMonth",  label: "Last month" },
            ].map(({ key, label }, i) => (
              <MenuItem
                key={key}
                onClick={() => handleShowHistory(key)}
                sx={{
                  borderTop: i === 0 ? "3px solid #2b82d4" : "1px solid #f5f5f5",
                  py: "5px",
                  px: "15px",
                  minHeight: "auto",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#444" }}>
                  {label}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </ListItemButton>

      <EditDeviceDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        device={item}
      />

      <FollowDialog
        open={followDialogOpen}
        onClose={handleCloseFollowDialog}
        device={item}
      />
    </div>
  );
};

export default DeviceRow;
