import {
  useState, useCallback, useEffect,
} from 'react';
import { 
  Tabs, 
  Tab,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Toolbar,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import { devicesActions } from '../store';
import AddDeviceDialog from './AddDeviceDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { CircularProgress } from '@mui/material';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainMap from './MainMap';
import DeviceInfoPanel from './DeviceInfoPanel';
import EventsList from './EventsList';
import SettingsDialog from './SettingsDialog';
import { useAttributePreference } from '../common/util/preferences';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    height: '36px',
    backgroundColor: 'white',
    borderBottom: `1px solid transparent`,
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    zIndex: 1000,
  },
  toolbar: {
    minHeight: '36px !important',
    width: '100%',
    padding: '0px !important',
    display: 'flex',
    gap: '2px',
  },
  navButton: {
    height: '36px !important',
    width: '44px !important',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0px !important',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
      color: '#444444',
    },
  },
  divider: {
    margin: theme.spacing(0.5, 0.25),
    borderColor: theme.palette.divider,
  },
  rightSection: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '2px',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  sidebar: {
    width: '366px',
    backgroundColor: 'white',
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('md')]: {
      position: 'fixed',
      left: 0,
      top: '36px',
      bottom: 0,
      zIndex: 900,
      transform: 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out',
      '&.open': {
        transform: 'translateX(0)',
      },
    },
  },
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deviceList: {
    height: '100%',
    overflow: 'auto',
  },
  tabs: {
    backgroundColor: '#f5f5f5',
    minHeight: '31px !important',
    '& .MuiTab-root': {
      marginTop: '6px',
      minHeight: '25px',
      textTransform: 'none',
      fontSize: '12px',
      fontWeight: 'normal',
      padding: '6px 16px',
      color: '#444444',
      borderRadius: 0,
      '&.Mui-selected': {
        backgroundColor: '#ffffff',
        color: '#444444',
      },
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  },
  searchContainer: {
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      height: '28px',
      fontSize: '11px',
      color: '#444444',
      '& fieldset': {
        border: 'none',
      },
    },
  },
  searchActions: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  iconButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: '0px',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  deviceListContainer: {
    flex: 1,
    overflow: 'auto',
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
}));

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId);

  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  return (
    <div className={classes.root}>
      {/* Navbar */}
      <div className={classes.navbar}>
        <Toolbar className={classes.toolbar}>
          {/* Left section */}
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/logo_small.png" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/info.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton} onClick={() => setSettingsOpen(true)}>
            <img src="/img/top-nav/settings.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/dashboard.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/marker.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/search.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>

          <Divider orientation="vertical" flexItem className={classes.divider} />

          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/report.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/tasks.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/logbook.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/dtc.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/maintenance.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/expenses.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/gallery.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>
          <IconButton className={classes.navButton}>
            <img src="/img/top-nav/chat.svg" border="0" style={{ width: '16px', height: '16px' }} />
          </IconButton>

          {/* Right section */}
          <div className={classes.rightSection}>
            {/* <IconButton className={classes.navButton}>
              <img src="/img/top-nav/language.svg" border="0" style={{ width: '16px', height: '16px' }} />
            </IconButton> */}
            {/* <IconButton className={classes.navButton}>
              <img src="/img/top-nav/cogs-white.svg" border="0" style={{ width: '16px', height: '16px' }} />
            </IconButton> */}
            {/* <IconButton className={classes.navButton}>
              <img src="/img/top-nav/user.svg" border="0" style={{ width: '16px', height: '16px' }} />
            </IconButton> */}
            {/* <IconButton className={classes.navButton}>
              <img src="/img/top-nav/mobile.svg" border="0" style={{ width: '16px', height: '16px' }} />
            </IconButton> */}
            <Divider orientation="vertical" flexItem className={classes.divider} />
            {/* <Tooltip title="Logout"> */}
              <IconButton className={classes.navButton} onClick={handleLogout} style={{ backgroundColor: '#6c6c6c' }}>
                <img src="/img/top-nav/logout.svg" border="0" style={{ width: '16px', height: '16px' }} />
              </IconButton>
            {/* </Tooltip> */}
          </div>
        </Toolbar>
      </div>

      {/* Main Container */}
      <div className={classes.mainContainer}>
        {/* Sidebar */}
        <div className={`${classes.sidebar} ${devicesOpen ? 'open' : ''}`}>
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
                          <SearchIcon fontSize="small" sx={{ color: '#444444' }} />
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
                          const response = await fetchOrThrow('/api/devices');
                          dispatch(devicesActions.refresh(await response.json()));
                        } finally {
                          setSyncing(false);
                        }
                      }}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <CircularProgress size={16} sx={{ color: '#444444' }} />
                      ) : (
                        <SyncIcon fontSize="small" sx={{ color: '#444444' }} />
                      )}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      className={classes.iconButton}
                      onClick={() => setAddDeviceOpen(true)}
                    >
                      <AddIcon fontSize="small" sx={{ color: '#444444' }} />
                    </IconButton>
                  </div>
                </Box>
              </div>
              <div className={classes.deviceListContainer}>
                <DeviceList devices={filteredDevices} />
              </div>
            </>
          )}
          {currentTab === 1 && (
            <div className={classes.deviceListContainer}>
              <EventsList />
            </div>
          )}
          {currentTab === 2 && (
            <Box p={2}>
              <Typography variant="body2" color="textSecondary">Places content will go here</Typography>
            </Box>
          )}
          {currentTab === 3 && (
            <Box p={2}>
              <Typography variant="body2" color="textSecondary">History content will go here</Typography>
            </Box>
          )}
        </div>

        {/* Content Area with Map */}
        <div className={classes.content}>
          <div className={classes.mapContainer}>
            <MainMap
              filteredPositions={filteredPositions}
              selectedPosition={selectedPosition}
              onEventsClick={onEventsClick}
            />
          </div>
        </div>
      </div>

      {/* Drawers and Overlays */}
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      <AddDeviceDialog open={addDeviceOpen} onClose={() => setAddDeviceOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {selectedDeviceId && (
        <DeviceInfoPanel deviceId={selectedDeviceId} />
      )}
    </div>
  );
};

export default MainPage;
