import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  List,
  ListItem,
  Typography,
  Box,
  CircularProgress,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'white',
    padding: '10px',
  },
  toolbar: {
    display: 'flex',
    gap: '5px',
    padding: '0px',
    backgroundColor: 'white',
    marginBottom: '10px',
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      height: '28px',
      fontSize: '11px',
      '& fieldset': {
        border: 'none',
      },
    },
  },
  actionButton: {
    width: '28px',
    height: '28px',
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      color: '#666666',
    },
  },
  header: {
    display: 'flex',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    padding: '5px 10px',
    '& > div': {
      fontSize: '12px',
      fontWeight: 400,
      color: '#444444',
    },
  },
  headerTime: {
    width: '55px',
  },
  headerDevice: {
    width: '110px',
  },
  headerEvent: {
    flex: 1,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    // padding: '4px 0px 4px 0px',
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: '2px',
    paddingBottom: '2px',
    borderBottom: '1px solid #e0e0e0',
    ":hover": {
      backgroundColor: '#f5f5f5',
    },
  },
  time: {
    width: '55px',
    fontSize: '11px',
    color: theme.palette.text.primary,
  },
  deviceName: {
    width: '110px',
    fontSize: '11px',
    color: theme.palette.text.primary,
  },
  event: {
    flex: 1,
    fontSize: '11px',
    color: theme.palette.text.primary,
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
  },
}));

const EventsList = () => {
  const { classes } = useStyles();
  
  // Get events from Redux store (populated by WebSocket)
  const storeEvents = useSelector((state) => state.events.items);
  const devices = useSelector((state) => state.devices.items);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync Redux events to local state with device names
  useEffect(() => {
    if (Object.keys(devices).length > 0) {
      const eventsWithDevices = Object.values(storeEvents).map(event => ({
        ...event,
        deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
      })).sort((a, b) => dayjs(b.eventTime).valueOf() - dayjs(a.eventTime).valueOf());
      
      setEvents(eventsWithDevices);
      setLoading(false);
    }
  }, [storeEvents, devices]);

  const filteredEvents = events.filter(event => 
    event.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getEventDescription(event).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Fetch events from API endpoint
      const from = dayjs().subtract(24, 'hours').toISOString();
      const to = dayjs().toISOString();
      
      const response = await fetchOrThrow(`/api/reports/events?from=${from}&to=${to}`);
      const apiEvents = await response.json();
      
      // Process and merge with store events
      const eventsWithDevices = apiEvents.map(event => ({
        ...event,
        deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
      })).sort((a, b) => dayjs(b.eventTime).valueOf() - dayjs(a.eventTime).valueOf());
      
      setEvents(eventsWithDevices);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Gagal memuat events');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Waktu', 'Objek', 'Kejadian'],
      ...filteredEvents.map(event => [
        dayjs(event.serverTime).format('HH:mm:ss'),
        event.deviceName,
        getEventDescription(event) + (event.attributes?.motion ? ' - Demo S5' : '')
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'events.csv';
    link.click();
  };

  const handleDelete = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua events?')) {
      try {
        await fetchOrThrow('/api/events', { method: 'DELETE' });
        setEvents([]);
      } catch (err) {
        console.error('Error deleting events:', err);
        setError('Gagal menghapus events');
      }
    }
  };
  
  // Initial load from API
  useEffect(() => {
    handleRefresh();
  }, []);

  const getEventDescription = (event) => {
    // Map event types to Indonesian descriptions
    const eventTypeMap = {
      deviceOnline: 'Perangkat Online',
      deviceOffline: 'Perangkat Offline',
      deviceMoving: 'Perangkat Bergerak',
      deviceStopped: 'Perangkat Berhenti',
      ignitionOn: 'Mesin Dihidupkan',
      ignitionOff: 'Mesin Dimatikan',
      geofenceEnter: 'Masuk Geofence',
      geofenceExit: 'Keluar Geofence',
      alarm: 'Alarm',
      maintenance: 'Maintenance',
    };
    
    return eventTypeMap[event.type] || event.type || 'Event tidak diketahui';
  };

  if (loading && events.length === 0) {
    return (
      <div className={classes.loader}>
        <CircularProgress size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  return (
    <div className={classes.root}>
      {/* Toolbar */}
      <div className={classes.toolbar}>
        <TextField
          className={classes.searchField}
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '16px', color: '#666666' }} />
              </InputAdornment>
            ),
          }}
        />
        <IconButton 
          className={classes.actionButton}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={16} sx={{ color: '#666666' }} />
          ) : (
            <RefreshIcon />
          )}
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={handleExport}
        >
          <FileDownloadIcon />
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={handleDelete}
        >
          <DeleteIcon />
        </IconButton>
      </div>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.headerTime}>Waktu</div>
        <div className={classes.headerDevice}>Objek</div>
        <div className={classes.headerEvent}>Kejadian</div>
      </div>

      {/* List */}
      <List disablePadding>
        {filteredEvents.map((event) => (
          <ListItem key={event.id} className={classes.listItem} disablePadding>
            <Typography className={classes.time}>
              {dayjs(event.eventTime || event.serverTime).format('HH:mm:ss')}
            </Typography>
            <Typography className={classes.deviceName}>
              {event.deviceName}
            </Typography>
            <Typography className={classes.event}>
              {getEventDescription(event)}
              {event.attributes?.message && ` - ${event.attributes.message}`}
            </Typography>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default EventsList;
