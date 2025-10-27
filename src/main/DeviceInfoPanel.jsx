import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  IconButton,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import TimelineIcon from '@mui/icons-material/Timeline';
import SimCardIcon from '@mui/icons-material/SimCard';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PowerIcon from '@mui/icons-material/Power';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PinDropIcon from '@mui/icons-material/PinDrop';
import InfoIcon from '@mui/icons-material/Info';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatSpeed, formatDistance, formatCoordinate } from '../common/util/formatter';
import {
  distanceToCircle,
  distanceToPolygon,
  formatDistanceValue,
} from '../common/util/distance';
import { devicesActions } from '../store';
import dayjs from 'dayjs';

const useStyles = makeStyles()(() => ({
  root: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  resizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '5px',
    cursor: 'ns-resize',
    backgroundColor: 'transparent',
    zIndex: 1001,
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
      backgroundColor: 'rgba(33, 150, 243, 0.3)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 16px 0px 0px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    minHeight: '38px',
  },
  tabs: {
    minHeight: '38px',
    flex: 1,
    '& .MuiTabs-flexContainer': {
      height: '38px',
    },
    '& .MuiTab-root': {
      minHeight: '38px',
      height: '38px',
      textTransform: 'none',
      fontSize: '11px',
      fontWeight: 500,
      padding: '0px 16px',
      minWidth: 'auto',
      color: '#666',
      '&.Mui-selected': {
        color: '#1976d2',
      },
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#1976d2',
    },
  },
  content: {
    padding: '0px',
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#fff',
  },
  dataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0px',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    gap: '6px',
    minHeight: '24px',
    padding: '2px 12px',
    '&:nth-of-type(6n+1), &:nth-of-type(6n+2), &:nth-of-type(6n+3)': {
      backgroundColor: '#f5f5f5',
    },
    '&:nth-of-type(6n+4), &:nth-of-type(6n+5), &:nth-of-type(6n+6)': {
      backgroundColor: '#fff',
    },
  },
  fieldIcon: {
    fontSize: '16px',
    color: '#666',
    minWidth: '16px',
  },
  label: {
    minWidth: '110px',
    color: '#333',
    fontWeight: 500,
    fontSize: '11px',
  },
  value: {
    color: '#333',
    flex: 1,
    fontWeight: 400,
    fontSize: '11px',
  },
  closeButton: {
    padding: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '18px',
    },
  },
}));

const DeviceInfoPanel = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();
  const t = useTranslation();
  const [tab, setTab] = useState(0);
  const [panelHeight, setPanelHeight] = useState(() => {
    const saved = localStorage.getItem('deviceInfoPanelHeight');
    return saved ? parseInt(saved, 10) : 280; // Default 280px
  });
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const user = useSelector((state) => state.session.user);
  const geofences = useSelector((state) => state.geofences.items);
  
  const device = devices[selectedDeviceId];
  const position = positions[selectedDeviceId];
  
  // Get user's data list settings - match web lama default
  const dataListItems = user?.attributes?.dataList?.items || [
    'odometer', 'sim_number', 'status', 'altitude', 'angle', 
    'nearest_marker', 'nearest_zone', 'position', 'speed', 
    'time_position', 'engine_status'
  ];
  
  // Calculate left position based on sidebar state - auto detect sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(desktop ? 330 : 0);
  
  useEffect(() => {
    if (!desktop) {
      setSidebarWidth(0);
      return;
    }
    
    // Auto detect sidebar width from DOM
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[class*="sidebar"]');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        setSidebarWidth(width);
      }
    };
    
    updateSidebarWidth();
    
    // Update on window resize
    window.addEventListener('resize', updateSidebarWidth);
    
    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, [desktop]);
  
  // Preferences for formatting
  const speedUnit = useAttributePreference('speedUnit', 'kmh');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const coordinateFormat = useAttributePreference('coordinateFormat', 'decimal');

  // Handle vertical resize
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.max(100, startHeightRef.current + deltaY);
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('deviceInfoPanelHeight', panelHeight.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelHeight]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Parse geofence area string to get coordinates
  const parseGeofenceArea = (area) => {
    if (!area) return null;

    // CIRCLE (lat lon, radius)
    if (area.startsWith('CIRCLE')) {
      const match = area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
      if (match) {
        return {
          type: 'circle',
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
          radius: parseFloat(match[3]),
        };
      }
    }

    // POLYGON ((lat1 lon1, lat2 lon2, ...))
    if (area.startsWith('POLYGON')) {
      const coordMatch = area.match(/POLYGON\s*\(\((.*?)\)\)/);
      if (coordMatch) {
        const coords = coordMatch[1].split(',').map((pair) => {
          const [lat, lon] = pair.trim().split(/\s+/);
          return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        });
        return {
          type: 'polygon',
          coordinates: coords,
        };
      }
    }

    return null;
  };

  // Calculate nearest geofence of a specific type
  const findNearestGeofence = (geofenceType) => {
    if (!position || !geofences) return null;

    let nearestGeofence = null;
    let minDistance = Infinity;

    Object.values(geofences).forEach((geofence) => {
      const geoType = geofence.attributes?.type;
      
      // Fallback: detect type from geometry if not explicitly set
      let detectedType = geoType;
      if (!detectedType && geofence.area) {
        if (geofence.area.startsWith('CIRCLE')) {
          detectedType = 'marker';
        } else if (geofence.area.startsWith('POLYGON')) {
          detectedType = 'zone';
        } else if (geofence.area.startsWith('LINESTRING')) {
          detectedType = 'route';
        }
      }
      
      // Filter by type: 'marker' for markers, 'zone' for zones
      if (detectedType !== geofenceType) return;

      const parsed = parseGeofenceArea(geofence.area);
      if (!parsed) return;

      let distance;

      if (parsed.type === 'circle') {
        distance = distanceToCircle(position, parsed);
      } else if (parsed.type === 'polygon') {
        distance = distanceToPolygon(position, parsed.coordinates);
      }

      if (distance !== undefined && Math.abs(distance) < Math.abs(minDistance)) {
        minDistance = distance;
        nearestGeofence = { name: geofence.name, distance };
      }
    });

    return nearestGeofence;
  };

  // Get icon for each field type
  const getFieldIcon = (item) => {
    const iconMap = {
      odometer: <TimelineIcon className={classes.fieldIcon} />,
      engine_hours: <PowerIcon className={classes.fieldIcon} />,
      status: <InfoIcon className={classes.fieldIcon} />,
      model: <DirectionsCarIcon className={classes.fieldIcon} />,
      vin: <BadgeIcon className={classes.fieldIcon} />,
      plate_number: <BadgeIcon className={classes.fieldIcon} />,
      sim_number: <SimCardIcon className={classes.fieldIcon} />,
      driver: <PersonIcon className={classes.fieldIcon} />,
      trailer: <LocalShippingIcon className={classes.fieldIcon} />,
      time_position: <AccessTimeIcon className={classes.fieldIcon} />,
      time_server: <AccessTimeIcon className={classes.fieldIcon} />,
      address: <LocationOnIcon className={classes.fieldIcon} />,
      position: <LocationOnIcon className={classes.fieldIcon} />,
      speed: <SpeedIcon className={classes.fieldIcon} />,
      altitude: <HeightIcon className={classes.fieldIcon} />,
      angle: <RotateRightIcon className={classes.fieldIcon} />,
      nearest_zone: <PinDropIcon className={classes.fieldIcon} />,
      nearest_marker: <PinDropIcon className={classes.fieldIcon} />,
      engine_status: <PowerIcon className={classes.fieldIcon} />,
    };
    return iconMap[item] || <InfoIcon className={classes.fieldIcon} />;
  };

  // Format value based on item type
  const formatValue = (item) => {
    if (!position && !device) return '-';
    
    switch (item) {
      case 'odometer':
        return position?.attributes?.totalDistance 
          ? formatDistance(position.attributes.totalDistance, distanceUnit, t)
          : '-';
      
      case 'engine_hours':
        return position?.attributes?.hours 
          ? `${(position.attributes.hours / 3600000).toFixed(1)} h`
          : '-';
      
      case 'status':
        if (!position) return 'Offline';
        if (position.attributes?.ignition === true) {
          return position.speed > 5 ? 'Moving' : 'Engine Idle';
        }
        return 'Stopped';
      
      case 'model':
        return device?.model || '-';
      
      case 'vin':
        return device?.attributes?.vin || '-';
      
      case 'plate_number':
        return device?.attributes?.plateNumber || '-';
      
      case 'sim_number':
        return device?.phone || '-';
      
      case 'driver':
        return position?.attributes?.driverName || '-';
      
      case 'trailer':
        return position?.attributes?.trailerName || '-';
      
      case 'time_position':
        return position?.fixTime 
          ? dayjs(position.fixTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      
      case 'time_server':
        return position?.serverTime 
          ? dayjs(position.serverTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      
      case 'address':
        return position?.address || 'Calculating...';
      
      case 'position':
        return position 
          ? `${formatCoordinate('latitude', position.latitude, coordinateFormat)}, ${formatCoordinate('longitude', position.longitude, coordinateFormat)}`
          : '-';
      
      case 'speed':
        return position 
          ? formatSpeed(position.speed, speedUnit, t)
          : '-';
      
      case 'altitude':
        return position?.altitude 
          ? `${position.altitude.toFixed(0)} m`
          : '-';
      
      case 'angle':
        return position?.course 
          ? `${position.course.toFixed(0)}°`
          : '-';
      
      case 'nearest_zone': {
        const nearestZone = findNearestGeofence('zone');
        if (!nearestZone) return '-';
        const formattedDistance = formatDistanceValue(Math.abs(nearestZone.distance), distanceUnit);
        return `${nearestZone.name} (${formattedDistance})`;
      }
      
      case 'nearest_marker': {
        const nearestMarker = findNearestGeofence('marker');
        if (!nearestMarker) return '-';
        const formattedDistance = formatDistanceValue(Math.abs(nearestMarker.distance), distanceUnit);
        return `${nearestMarker.name} (${formattedDistance})`;
      }
      
      case 'engine_status':
        return position?.attributes?.ignition !== undefined
          ? (position.attributes.ignition ? 'on' : 'off')
          : '-';
      
      default:
        return '-';
    }
  };

  // Get label for item
  const getLabel = (item) => {
    const labels = {
      odometer: 'Odometer',
      engine_hours: 'Engine Hours',
      status: 'Status',
      model: 'Model',
      vin: 'VIN',
      plate_number: 'Plate Number',
      sim_number: 'SIM Card Number',
      driver: 'Driver',
      trailer: 'Trailer',
      time_position: 'Time (Position)',
      time_server: 'Time (Server)',
      address: 'Address',
      position: 'Position',
      speed: 'Speed',
      altitude: 'Altitude',
      angle: 'Course/Angle',
      nearest_zone: 'Nearest Zone',
      nearest_marker: 'Nearest Marker',
      engine_status: 'EngineStatus',
    };
    return labels[item] || item;
  };

  if (!device) return null;

  return (
    <Paper 
      className={classes.root} 
      elevation={4}
      style={{
        left: `${sidebarWidth}px`,
        height: `${panelHeight}px`,
        display: 'flex',
      }}
    >
      {/* Vertical resize handle */}
      <Box 
        className={classes.resizer}
        onMouseDown={handleMouseDown}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className={classes.header}>
          <Tabs 
            className={classes.tabs}
            value={tab} 
            onChange={handleTabChange}
          >
            <Tab label="Data" />
            <Tab label="Graph" />
            <Tab label="Messages" />
          </Tabs>
          <IconButton 
            className={classes.closeButton}
            onClick={() => dispatch(devicesActions.selectId(null))}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {tab === 0 && (
          <Box className={classes.content}>
            <Box className={classes.dataGrid}>
              {dataListItems.map((item) => (
                <Box key={item} className={classes.field}>
                  {getFieldIcon(item)}
                  <Typography className={classes.label}>{getLabel(item)}</Typography>
                  <Typography className={classes.value}>{formatValue(item)}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box className={classes.content}>
            <Typography variant="body2" color="textSecondary" align="center">
              Graph visualization - Coming soon
            </Typography>
          </Box>
        )}

        {tab === 2 && (
          <Box className={classes.content}>
            <Typography variant="body2" color="textSecondary" align="center">
              Messages - Coming soon
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DeviceInfoPanel;
