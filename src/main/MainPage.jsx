import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Tabs,
  Tab,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Toolbar,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Sync";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "tss-react/mui";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useDispatch, useSelector } from "react-redux";
import DeviceList from "./DeviceList";
import { devicesActions } from "../store";
import AddDeviceDialog from "./AddDeviceDialog";
import fetchOrThrow from "../common/util/fetchOrThrow";
import { CircularProgress } from "@mui/material";
import usePersistedState from "../common/util/usePersistedState";
import EventsDrawer from "./EventsDrawer";
import useFilter from "./useFilter";
import MainMap from "./MainMap";
import DeviceInfoPanel from "./DeviceInfoPanel";
import EventsList from "./EventsList";
import SettingsDialog from "./SettingsDialog";
import { useAttributePreference } from "../common/util/preferences";
import MarkersTab from "./places/MarkersTab";
import RoutesTab from "./places/RoutesTab";
import ZonesTab from "./places/ZonesTab";
import HistoryTab from "./HistoryTab";
import { map } from "../map/core/MapView";
import ObjectControlDialog from "./ObjectControlDialog";
import HistoryControls from "./HistoryControls";
import InfoDialog from "./InfoDialog";
import DashboardDialog from "./DashboardDialog";
import ShowPointDialog from "./ShowPointDialog";
import AddressSearchDialog from "./AddressSearchDialog";
import ReportsDialog from "./ReportsDialog";
import TasksDialog from "./TasksDialog";
import LogbookDialog from "./LogbookDialog";
import DTCDialog from "./DTCDialog";
import MaintenanceDialog from "./MaintenanceDialog";
import ExpensesDialog from "./ExpensesDialog";
import GalleryDialog from "./GalleryDialog";
import ChatDialog from "./ChatDialog";
import ShareDialog from "./ShareDialog";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  navbar: {
    height: "36px",
    backgroundColor: "white",
    borderBottom: `1px solid transparent`,
    display: "flex",
    alignItems: "center",
    padding: 0,
    zIndex: 1000,
  },
  toolbar: {
    minHeight: "36px !important",
    width: "100%",
    padding: "0px !important",
    display: "flex",
    gap: "2px",
  },
  navButton: {
    height: "36px !important",
    width: "44px !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0px !important",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "20px",
      color: "#444444",
    },
  },
  divider: {
    margin: theme.spacing(0.5, 0.25),
    borderColor: theme.palette.divider,
  },
  rightSection: {
    marginLeft: "auto",
    display: "flex",
    gap: "2px",
  },
  mainContainer: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    position: "relative",
  },
  sidebar: {
    width: "330px",
    backgroundColor: "white",
    borderRight: `1px solid ${theme.palette.divider}`,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down("md")]: {
      position: "fixed",
      left: 0,
      top: "36px",
      bottom: 0,
      zIndex: 900,
      transform: "translateX(-100%)",
      transition: "transform 0.3s ease-in-out",
      "&.open": {
        transform: "translateX(0)",
      },
    },
  },
  content: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deviceList: {
    height: "100%",
    overflow: "auto",
  },
  tabs: {
    backgroundColor: "#f5f5f5",
    minHeight: "31px !important",
    "& .MuiTab-root": {
      marginTop: "6px",
      minHeight: "25px",
      textTransform: "none",
      fontSize: "12px",
      fontWeight: "normal",
      padding: "6px 16px",
      color: "#444444",
      minWidth: "70px",
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
  searchContainer: {
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f5f5f5",
      height: "28px",
      fontSize: "11px",
      color: "#444444",
      "& fieldset": {
        border: "none",
      },
    },
  },
  searchActions: {
    display: "flex",
    gap: theme.spacing(1),
  },
  iconButton: {
    width: "28px",
    height: "28px",
    backgroundColor: "#f5f5f5",
    borderRadius: "0px",
    "&:hover": {
      backgroundColor: "#e0e0e0",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
      color: "#666666",
    },
  },
  deviceListContainer: {
    flex: 1,
    overflow: "auto",
  },
  deviceItem: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
}));

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up("md"));

  const mapOnSelect = useAttributePreference("mapOnSelect", true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = useMemo(
    () => filteredPositions.find(
      (position) => selectedDeviceId && position.deviceId === selectedDeviceId,
    ),
    [filteredPositions, selectedDeviceId],
  );

  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [filter] = usePersistedState("filter", {
    statuses: [],
    groups: [],
  });
  const [filterSort] = usePersistedState("filterSort", "");
  const [filterMap] = usePersistedState("filterMap", false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [placesTab, setPlacesTab] = useState(0);
  const [markersCount, setMarkersCount] = useState(0);
  const [routesCount, setRoutesCount] = useState(0);
  const [zonesCount, setZonesCount] = useState(0);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [objectControlOpen, setObjectControlOpen] = useState(false);
  const [objectControlDeviceId, setObjectControlDeviceId] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [showPointOpen, setShowPointOpen] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [logbookOpen, setLogbookOpen] = useState(false);
  const [dtcOpen, setDtcOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [historyRoute, setHistoryRoute] = useState(null);
  const [historyTrigger, setHistoryTrigger] = useState(null); // { deviceId, period }
  const [routeToggles, setRouteToggles] = useState({ route: true, stops: true, events: true, arrows: false, dataPoints: false, snap: false });
  const [snappedCoordinates, setSnappedCoordinates] = useState(null);
  const snapCacheRef = useRef(null); // Cache snapped result per route

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  const handleShowHistory = useCallback((deviceId, period) => {
    setHistoryTrigger({ deviceId, period });
    setCurrentTab(3); // Switch to History tab (index 3)
  }, []);

  const handleShowSendCommand = useCallback((deviceId) => {
    setObjectControlDeviceId(deviceId);
    setObjectControlOpen(true);
  }, []);

  // Auto-select device when history route is loaded so DeviceInfoPanel shows
  useEffect(() => {
    if (historyRoute && historyRoute.deviceId) {
      const deviceId = parseInt(historyRoute.deviceId, 10);
      if (deviceId && deviceId !== selectedDeviceId) {
        dispatch(devicesActions.selectId(deviceId));
      }
    }
  }, [historyRoute, selectedDeviceId, dispatch]);

  // Playback position state for moving marker on map
  const [playbackPosition, setPlaybackPosition] = useState(null);

  // Handle graph point click - pan map to position and update playback marker
  const handleGraphPointClick = useCallback(
    (pointData) => {
      if (map && pointData && pointData.latitude && pointData.longitude) {
        // Update playback marker position
        setPlaybackPosition({
          latitude: pointData.latitude,
          longitude: pointData.longitude,
          course: pointData.course || 0,
          speed: pointData.speed || 0,
          timestamp: pointData.timestamp || null,
          isPlaying: pointData.isPlaying || false,
          playSpeed: pointData.playSpeed || 1,
        });

        map.flyTo({
          center: [pointData.longitude, pointData.latitude],
          zoom: Math.max(map.getZoom(), 16),
          duration: pointData.isPlaying ? 0 : 1000,
        });
      }
    },
    [map]
  );

  // Clear playback marker and reset toggles when history route is removed
  useEffect(() => {
    if (!historyRoute) {
      setPlaybackPosition(null);
      setSnappedCoordinates(null);
      snapCacheRef.current = null;
      setRouteToggles({ route: true, stops: true, events: true, arrows: false, dataPoints: false, snap: false });
    }
  }, [historyRoute]);

  // Snap to roads using OSRM match API
  useEffect(() => {
    if (!routeToggles.snap || !historyRoute?.coordinates) {
      setSnappedCoordinates(null);
      return;
    }

    // Check cache
    const cacheKey = `${historyRoute.deviceId}-${historyRoute.coordinates.length}`;
    if (snapCacheRef.current?.key === cacheKey) {
      setSnappedCoordinates(snapCacheRef.current.coords);
      return;
    }

    const fetchSnapped = async () => {
      try {
        const coords = historyRoute.coordinates;
        // OSRM limit is ~100 coordinates per request, so chunk them
        const chunkSize = 80;
        const allSnapped = [];

        for (let i = 0; i < coords.length; i += chunkSize) {
          const chunk = coords.slice(i, Math.min(i + chunkSize, coords.length));
          // If we have overlap from previous chunk, add the last point for continuity
          if (i > 0 && allSnapped.length > 0) {
            // Remove duplicate junction point
          }
          const coordStr = chunk.map((c) => `${c[0]},${c[1]}`).join(';');
          const radiuses = chunk.map(() => '25').join(';');
          const url = `https://router.project-osrm.org/match/v1/driving/${coordStr}?overview=full&geometries=geojson&radiuses=${radiuses}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.code === 'Ok' && data.matchings) {
            data.matchings.forEach((matching) => {
              const matchCoords = matching.geometry.coordinates;
              // Avoid duplicate first point if we already have data
              const startIdx = allSnapped.length > 0 ? 1 : 0;
              for (let j = startIdx; j < matchCoords.length; j += 1) {
                allSnapped.push(matchCoords[j]);
              }
            });
          } else {
            // If OSRM fails for this chunk, use original coordinates
            chunk.forEach((c) => allSnapped.push(c));
          }
        }

        if (allSnapped.length > 0) {
          snapCacheRef.current = { key: cacheKey, coords: allSnapped };
          setSnappedCoordinates(allSnapped);
        }
      } catch (error) {
        console.error('Snap to roads failed:', error);
        setSnappedCoordinates(null);
      }
    };

    fetchSnapped();
  }, [routeToggles.snap, historyRoute]);

  // Compute effective history route (with or without snap)
  const effectiveHistoryRoute = useMemo(() => {
    if (!historyRoute) return null;
    if (snappedCoordinates && routeToggles.snap) {
      return { ...historyRoute, coordinates: snappedCoordinates };
    }
    return historyRoute;
  }, [historyRoute, snappedCoordinates, routeToggles.snap]);

  const handleRouteToggle = useCallback((key) => {
    setRouteToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRouteClose = useCallback(() => {
    setHistoryRoute(null);
    setPlaybackPosition(null);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const handlePlacesTabChange = useCallback((event, newValue) => {
    setPlacesTab(newValue);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/session", { method: "DELETE" });
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle focus location for markers/routes/zones
  const handleFocusLocation = useCallback(
    (location) => {
      if (map && location) {
        if (location.bounds) {
          // bounds = [[swLng, swLat], [neLng, neLat]]
          map.fitBounds(location.bounds, {
            padding: {
              left: 350, top: 56, right: 20, bottom: 20,
            },
            duration: 1000,
            maxZoom: 17,
          });
        } else {
          map.easeTo({
            center: [location.lng, location.lat],
            zoom: Math.max(map.getZoom(), 15),
            duration: 1000,
          });
        }
      }
    },
    []
  );

  // Fetch counts for Places tabs when Places tab is active
  useEffect(() => {
    if (currentTab !== 2) return;
    if (markersCount !== 0 && routesCount !== 0 && zonesCount !== 0) return;

    const fetchCounts = async () => {
      try {
        const endpoints = [
          markersCount === 0 ? fetchOrThrow('/api/markers?page=1&pageSize=1', { headers: { Accept: 'application/json' } }) : null,
          routesCount === 0 ? fetchOrThrow('/api/routes?page=1&pageSize=1', { headers: { Accept: 'application/json' } }) : null,
          zonesCount === 0 ? fetchOrThrow('/api/zones?page=1&pageSize=1', { headers: { Accept: 'application/json' } }) : null,
        ];

        const [markersRes, routesRes, zonesRes] = await Promise.all(
          endpoints.map((p) => (p ? p.then((r) => r.json()) : Promise.resolve(null))),
        );

        const extractCount = (data) => {
          if (!data) return null;
          if (data.total !== undefined) return data.total;
          if (Array.isArray(data)) return data.length;
          return null;
        };

        const mc = extractCount(markersRes);
        const rc = extractCount(routesRes);
        const zc = extractCount(zonesRes);
        if (mc !== null) setMarkersCount(mc);
        if (rc !== null) setRoutesCount(rc);
        if (zc !== null) setZonesCount(zc);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, [currentTab, markersCount, routesCount, zonesCount]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions
  );

  return (
    <div className={classes.root}>
      {/* Navbar */}
      <div className={classes.navbar}>
        <Toolbar className={classes.toolbar}>
          {/* Left section */}
          <IconButton className={classes.navButton}>
            <img
              src="/img/top-nav/logo_small.png"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setInfoOpen(true)}>
            <img
              src="/img/top-nav/info.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton
            className={classes.navButton}
            onClick={() => setSettingsOpen(true)}
          >
            <img
              src="/img/top-nav/settings.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setDashboardOpen(true)}>
            <img
              src="/img/top-nav/dashboard.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setShowPointOpen(true)}>
            <img
              src="/img/top-nav/marker.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setAddressSearchOpen(true)}>
            <img
              src="/img/top-nav/search.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setReportsOpen(true)}>
            <img
              src="/img/top-nav/report.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setTasksOpen(true)}>
            <img
              src="/img/top-nav/tasks.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setLogbookOpen(true)}>
            <img
              src="/img/top-nav/logbook.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          {/* <IconButton className={classes.navButton} onClick={() => setDtcOpen(true)}>
            <img
              src="/img/top-nav/dtc.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton> */}
          <IconButton className={classes.navButton} onClick={() => setMaintenanceOpen(true)}>
            <img
              src="/img/top-nav/maintenance.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          {/* <IconButton className={classes.navButton} onClick={() => setExpensesOpen(true)}>
            <img
              src="/img/top-nav/expenses.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton> */}
          {/* Button Object Control (Command) */}
          <IconButton
            className={classes.navButton}
            onClick={() => setObjectControlOpen(true)}
          >
            <img
              src="/img/top-nav/cmd.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton>
          {/* <IconButton className={classes.navButton} onClick={() => setGalleryOpen(true)}>
            <img
              src="/img/top-nav/gallery.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton> */}
          {/* <IconButton className={classes.navButton} onClick={() => setChatOpen(true)}>
            <img
              src="/img/top-nav/chat.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton> */}
          {/* <IconButton className={classes.navButton} onClick={() => setShareOpen(true)}>
            <img
              src="/img/top-nav/share.svg"
              border="0"
              style={{ width: "16px", height: "16px" }}
            />
          </IconButton> */}

          {/* Right section */}
          <div className={classes.rightSection}>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.divider}
            />
            {/* <Tooltip title="Logout"> */}
            <IconButton
              className={classes.navButton}
              onClick={handleLogout}
              style={{ backgroundColor: "#6c6c6c" }}
            >
              <img
                src="/img/top-nav/logout.svg"
                border="0"
                style={{ width: "16px", height: "16px" }}
              />
            </IconButton>
            {/* </Tooltip> */}
          </div>
        </Toolbar>
      </div>

      {/* Main Container */}
      <div className={classes.mainContainer}>
        {/* Sidebar */}
        <div className={`${classes.sidebar} ${devicesOpen ? "open" : ""}`}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={false}
            className={classes.tabs}
          >
            <Tab label="Objects" />
            <Tab label="Events" />
            <Tab label="Places" />
            <Tab label="History" />
          </Tabs>

          {currentTab === 0 && (
            <>
              <div className={classes.searchContainer}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className={classes.searchField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: "#444444" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <div className={classes.searchActions}>
                    <IconButton
                      size="small"
                      className={classes.iconButton}
                      onClick={async () => {
                        setSyncing(true);
                        try {
                          const response = await fetchOrThrow("/api/devices");
                          dispatch(
                            devicesActions.refresh(await response.json())
                          );
                        } finally {
                          setSyncing(false);
                        }
                      }}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <CircularProgress size={16} sx={{ color: "#444444" }} />
                      ) : (
                        <RefreshIcon
                          fontSize="small"
                          sx={{ color: "#444444" }}
                        />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      className={classes.iconButton}
                      onClick={() => setAddDeviceOpen(true)}
                    >
                      <AddIcon fontSize="small" sx={{ color: "#444444" }} />
                    </IconButton>
                  </div>
                </Box>
              </div>
              <div className={classes.deviceListContainer}>
                <DeviceList
                  devices={filteredDevices}
                  onShowHistory={handleShowHistory}
                  onShowSendCommand={handleShowSendCommand}
                />
              </div>
            </>
          )}
          {currentTab === 1 && (
            <div className={classes.deviceListContainer}>
              <EventsList />
            </div>
          )}
          {currentTab === 2 && (
            <>
              <Tabs
                value={placesTab}
                onChange={handlePlacesTabChange}
                variant="scrollable"
                scrollButtons={false}
                className={classes.tabs}
              >
                <Tab label={`Markers (${markersCount})`} />
                <Tab label={`Routes (${routesCount})`} />
                <Tab label={`Zones (${zonesCount})`} />
              </Tabs>

              <div className={classes.deviceListContainer}>
                {placesTab === 0 ? (
                  <MarkersTab
                    onCountChange={setMarkersCount}
                    onFocusLocation={handleFocusLocation}
                  />
                ) : placesTab === 1 ? (
                  <RoutesTab
                    onCountChange={setRoutesCount}
                    onFocusLocation={handleFocusLocation}
                  />
                ) : placesTab === 2 ? (
                  <ZonesTab
                    onCountChange={setZonesCount}
                    onFocusLocation={handleFocusLocation}
                  />
                ) : null}
              </div>
            </>
          )}
          {currentTab === 3 && (
            <HistoryTab
              onRouteChange={setHistoryRoute}
              historyTrigger={historyTrigger}
            />
          )}
        </div>

        {/* Content Area with Map */}
        <div className={classes.content}>
          <div className={classes.mapContainer}>
            <MainMap
              filteredPositions={filteredPositions}
              selectedPosition={selectedPosition}
              onEventsClick={onEventsClick}
              historyRoute={effectiveHistoryRoute}
              playbackPosition={playbackPosition}
              routeToggles={routeToggles}
            />
            {historyRoute && (
              <HistoryControls
                toggles={routeToggles}
                onToggle={handleRouteToggle}
                onClose={handleRouteClose}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drawers and Overlays */}
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      <AddDeviceDialog
        open={addDeviceOpen}
        onClose={() => setAddDeviceOpen(false)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ObjectControlDialog
        open={objectControlOpen}
        onClose={() => {
          setObjectControlOpen(false);
          setObjectControlDeviceId(null);
        }}
        preselectedDeviceId={objectControlDeviceId}
      />
      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
      <DashboardDialog open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <ShowPointDialog open={showPointOpen} onClose={() => setShowPointOpen(false)} />
      <AddressSearchDialog open={addressSearchOpen} onClose={() => setAddressSearchOpen(false)} />
      <ReportsDialog open={reportsOpen} onClose={() => setReportsOpen(false)} />
      <TasksDialog open={tasksOpen} onClose={() => setTasksOpen(false)} />
      <LogbookDialog open={logbookOpen} onClose={() => setLogbookOpen(false)} />
      <DTCDialog open={dtcOpen} onClose={() => setDtcOpen(false)} />
      <MaintenanceDialog open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} />
      <ExpensesDialog open={expensesOpen} onClose={() => setExpensesOpen(false)} />
      <GalleryDialog open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      {selectedDeviceId && (
        <DeviceInfoPanel
          deviceId={selectedDeviceId}
          historyRoute={historyRoute}
          onGraphPointClick={handleGraphPointClick}
          sidebarTab={currentTab}
        />
      )}
    </div>
  );
};

export default MainPage;
