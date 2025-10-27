import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Box, Typography, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { formatSpeed, formatDistance, formatCoordinate } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(1),
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2b82d4',
    marginBottom: theme.spacing(1),
    paddingBottom: theme.spacing(0.5),
    borderBottom: '1px solid #e0e0e0',
  },
  section: {
    marginBottom: theme.spacing(1.5),
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#666',
    marginBottom: theme.spacing(0.5),
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
    fontSize: '11px',
  },
  label: {
    width: '40%',
    color: '#666',
    fontWeight: 500,
  },
  value: {
    width: '60%',
    color: '#333',
    fontWeight: 400,
  },
  noData: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: '#999',
    fontSize: '11px',
  },
}));

const DeviceDataList = () => {
  const { classes } = useStyles();
  const t = useTranslation();
  
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const user = useSelector((state) => state.session.user);
  
  const device = devices[selectedDeviceId];
  const position = positions[selectedDeviceId];
  
  // Get user's data list settings
  const dataListItems = user?.attributes?.dataList?.items || ['odometer', 'engine_hours', 'status'];
  
  // Preferences for formatting
  const speedUnit = useAttributePreference('speedUnit', 'kmh');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const coordinateFormat = useAttributePreference('coordinateFormat', 'decimal');

  // Group items by category
  const groupedItems = useMemo(() => {
    const general = [];
    const location = [];
    
    dataListItems.forEach((item) => {
      if (['odometer', 'engine_hours', 'status', 'model', 'vin', 'plate_number', 'sim_number', 'driver', 'trailer'].includes(item)) {
        general.push(item);
      } else {
        location.push(item);
      }
    });
    
    return { general, location };
  }, [dataListItems]);

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
          return position.speed > 5 ? 'Moving' : 'Idle';
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
      
      case 'nearest_zone':
        // TODO: Calculate nearest geofence
        return '-';
      
      case 'nearest_marker':
        // TODO: Calculate nearest marker
        return '-';
      
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
      sim_number: 'SIM Card',
      driver: 'Driver',
      trailer: 'Trailer',
      time_position: 'Time (Position)',
      time_server: 'Time (Server)',
      address: 'Address',
      position: 'Coordinates',
      speed: 'Speed',
      altitude: 'Altitude',
      angle: 'Course',
      nearest_zone: 'Nearest Zone',
      nearest_marker: 'Nearest Marker',
    };
    return labels[item] || item;
  };

  if (!device) {
    return (
      <Box className={classes.container}>
        <Typography className={classes.noData}>
          Select a device to view details
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Typography className={classes.header}>
        {device.name}
      </Typography>

      {groupedItems.general.length > 0 && (
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>General</Typography>
          {groupedItems.general.map((item) => (
            <Box key={item} className={classes.row}>
              <Typography className={classes.label}>{getLabel(item)}</Typography>
              <Typography className={classes.value}>{formatValue(item)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {groupedItems.general.length > 0 && groupedItems.location.length > 0 && (
        <Divider sx={{ my: 1 }} />
      )}

      {groupedItems.location.length > 0 && (
        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>Location</Typography>
          {groupedItems.location.map((item) => (
            <Box key={item} className={classes.row}>
              <Typography className={classes.label}>{getLabel(item)}</Typography>
              <Typography className={classes.value}>{formatValue(item)}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DeviceDataList;
