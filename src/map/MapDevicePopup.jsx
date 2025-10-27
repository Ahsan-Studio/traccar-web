import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  IconButton,
  Box,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatSpeed, formatDistance, formatCoordinate } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';

const useStyles = makeStyles()((theme) => ({
  popup: {
    position: 'fixed',
    right: '20px',
    top: '80px',
    width: '320px',
    maxWidth: '90vw',
    zIndex: 1300,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  dialogTitle: {
    backgroundColor: '#2b82d4',
    color: 'white',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    color: 'white',
    padding: '2px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  dialogContent: {
    padding: theme.spacing(1.5),
    backgroundColor: 'white',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.75),
    fontSize: '11px',
  },
  label: {
    color: '#666',
    fontWeight: 500,
    minWidth: '90px',
  },
  value: {
    color: '#333',
    textAlign: 'right',
    flex: 1,
    wordBreak: 'break-word',
  },
  divider: {
    margin: theme.spacing(1, 0),
  },
  detailButton: {
    marginTop: theme.spacing(1),
    width: '100%',
    textTransform: 'none',
    fontSize: '11px',
    padding: theme.spacing(0.5, 1),
  },
}));

const MapDevicePopup = ({ open, onClose, deviceId, positionId }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const [address, setAddress] = useState('');
  
  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');
  
  const device = useSelector((state) => state.devices?.items?.[deviceId]);
  const position = useSelector((state) => {
    // positions ada di state.session.positions untuk traccar-web
    if (state.session?.positions?.[positionId]) {
      return state.session.positions[positionId];
    }
    // fallback: cari di state.positions jika ada
    if (state.positions?.items?.[positionId]) {
      return state.positions.items[positionId];
    }
    return null;
  });

  // Fetch address from coordinates
  useEffect(() => {
    if (position?.latitude && position?.longitude) {
      const fetchAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}`
          );
          const data = await response.json();
          setAddress(data.display_name || '-');
        } catch (error) {
          console.error('Error fetching address:', error);
          setAddress('-');
        }
      };
      fetchAddress();
    }
  }, [position?.latitude, position?.longitude]);

  if (!device || !position) return null;

  const formatValue = (value, defaultValue = '-') => {
    return value !== undefined && value !== null ? value : defaultValue;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <Box
      className={classes.popup}
      sx={{ display: open ? 'block' : 'none' }}
    >
      <Box className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">
          Object: {device.name}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          className={classes.closeButton}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box className={classes.dialogContent}>
        <Box className={classes.row}>
          <Typography className={classes.label}>Address:</Typography>
          <Typography className={classes.value}>{address}</Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Position:</Typography>
          <Typography className={classes.value}>
            {formatCoordinate('latitude', position.latitude)} ° {formatCoordinate('longitude', position.longitude)} °
          </Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Altitude:</Typography>
          <Typography className={classes.value}>
            {formatValue(position.altitude?.toFixed(0), '0')} m
          </Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Angle:</Typography>
          <Typography className={classes.value}>
            {formatValue(position.course?.toFixed(0), '0')} °
          </Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Speed:</Typography>
          <Typography className={classes.value}>
            {position.speed ? formatSpeed(position.speed, speedUnit, t) : '0 kph'}
          </Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Time:</Typography>
          <Typography className={classes.value}>
            {formatDateTime(position.fixTime)}
          </Typography>
        </Box>

        <Divider className={classes.divider} />

        <Box className={classes.row}>
          <Typography className={classes.label}>Odometer:</Typography>
          <Typography className={classes.value}>
            {position.attributes?.totalDistance 
              ? formatDistance(position.attributes.totalDistance, distanceUnit, t)
              : '-'}
          </Typography>
        </Box>

        <Box className={classes.row}>
          <Typography className={classes.label}>Engine hours:</Typography>
          <Typography className={classes.value}>
            {position.attributes?.hours 
              ? `${(position.attributes.hours / 3600000).toFixed(1)} h`
              : '0 s'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          className={classes.detailButton}
          startIcon={<InfoIcon />}
          onClick={onClose}
        >
          Detailed
        </Button>
      </Box>
    </Box>
  );
};

export default MapDevicePopup;
