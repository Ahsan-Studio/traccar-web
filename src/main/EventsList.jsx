import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { EVENTS_HISTORY_PERIOD } from '../common/config/constants';
import { devicesActions } from '../store';
import { map } from '../map/core/MapView';

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
    cursor: 'pointer',
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
  const dispatch = useDispatch();
  
  // Get events from Redux store (populated by WebSocket)
  const storeEvents = useSelector((state) => state.events.items);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false); // Changed to false
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Sync Redux events to local state with device names
  useEffect(() => {
    // Always sync, even if devices is empty (will show Device ID as fallback)
    const eventsWithDevices = Object.values(storeEvents || {}).map(event => ({
      ...event,
      deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
    })).sort((a, b) => {
      const timeA = dayjs(a.eventTime || a.serverTime).valueOf();
      const timeB = dayjs(b.eventTime || b.serverTime).valueOf();
      return timeB - timeA;
    });
    
    setEvents(eventsWithDevices);
    
    // If we have store events, consider it loaded
    if (Object.keys(storeEvents || {}).length > 0) {
      setInitialLoadDone(true);
    }
  }, [storeEvents, devices]);

  const filteredEvents = events.filter(event => 
    event.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getEventDescription(event).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle event click - zoom to position and select device
  const handleEventClick = async (event) => {
    console.log('🎯 Event clicked:', event);
    
    // First, check if position exists in Redux store
    let position = positions[event.positionId];
    
    // If not in store, fetch from API
    if (!position && event.positionId) {
      try {
        console.log('📡 Fetching position:', event.positionId);
        const response = await fetchOrThrow(`/api/positions?id=${event.positionId}`);
        const positionsData = await response.json();
        if (positionsData.length > 0) {
          position = positionsData[0];
          console.log('✅ Position fetched:', position);
        }
      } catch (err) {
        console.error('❌ Error fetching position:', err);
        return;
      }
    }
    
    if (!position || !position.latitude || !position.longitude) {
      console.warn('⚠️ Position not available for event:', event);
      return;
    }
    
    // Select the device in Redux (this will trigger MapSelectedDevice and show DeviceInfoPanel)
    dispatch(devicesActions.selectId(event.deviceId));
    
    // Pan map to position
    if (map) {
      try {
        map.easeTo({
          center: [position.longitude, position.latitude],
          zoom: Math.max(map.getZoom(), 15),
          duration: 1000,
        });
        console.log('🗺️ Map panned to:', position.latitude, position.longitude);
      } catch (err) {
        console.error('❌ Error panning map:', err);
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters for custom /events/history API
      const from = dayjs().subtract(EVENTS_HISTORY_PERIOD, 'days').toISOString();
      const to = dayjs().toISOString();
      
      console.log('📅 Date range:', { from, to });
      
      // Use custom API endpoint with pagination support
      // No need to pass deviceId - API returns events for all user's devices
      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);
      params.append('page', '1');
      params.append('pageSize', '1000'); // Get large batch for now
      
      const url = `/api/events/history?${params.toString()}`;
      console.log('📡 Fetching events from:', url);
      
      const response = await fetchOrThrow(url);
      const result = await response.json();
      
      console.log('📥 API Response:', result);
      console.log('📥 Events loaded:', result.data?.length || 0);
      console.log('📥 Total events:', result.total);
      
      // Extract events from paginated response
      const apiEvents = result.data || [];
      
      // Process and merge with store events
      const eventsWithDevices = apiEvents.map(event => ({
        ...event,
        deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
      })).sort((a, b) => {
        const timeA = dayjs(a.eventTime || a.serverTime).valueOf();
        const timeB = dayjs(b.eventTime || b.serverTime).valueOf();
        return timeB - timeA;
      });
      
      console.log('✅ Processed events:', eventsWithDevices.length);
      setEvents(eventsWithDevices);
      setInitialLoadDone(true);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(`Gagal memuat events: ${err.message || 'Unknown error'}`);
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
    // Only load from API if we don't have initial data from Redux
    if (!initialLoadDone) {
      handleRefresh();
    }
  }, [initialLoadDone]);

  const getEventDescription = (event) => {
    // Map event types to Indonesian descriptions
    // Based on Traccar's 18 predefined event types
    const eventTypeMap = {
      // Device Status Events
      deviceOnline: 'Perangkat Online',
      deviceOffline: 'Perangkat Offline',
      deviceUnknown: 'Status Tidak Diketahui',
      deviceInactive: 'Perangkat Tidak Aktif',
      
      // Motion Events
      deviceMoving: 'Perangkat Bergerak',
      deviceStopped: 'Perangkat Berhenti',
      
      // Geofence Events
      geofenceEnter: 'Masuk Geofence',
      geofenceExit: 'Keluar Geofence',
      
      // Speed Events
      deviceOverspeed: 'Kecepatan Berlebih',
      
      // Fuel Events
      deviceFuelDrop: 'Bahan Bakar Turun',
      deviceFuelIncrease: 'Bahan Bakar Bertambah',
      
      // Ignition Events
      ignitionOn: 'Mesin Dihidupkan',
      ignitionOff: 'Mesin Dimatikan',
      
      // Alarm Events
      alarm: 'Alarm',
      
      // Maintenance Events
      maintenance: 'Maintenance',
      
      // Driver Events
      driverChanged: 'Pengemudi Berganti',
      
      // Command Events
      commandResult: 'Hasil Perintah',
      
      // Media Events
      media: 'Media Diterima',
    };
    
    return eventTypeMap[event.type] || event.type || 'Event tidak diketahui';
  };

  // Show loading only on initial load or refresh
  if (loading) {
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
        {filteredEvents.length === 0 ? (
          <Box 
            sx={{ 
              padding: 4, 
              textAlign: 'center',
              color: '#999'
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '11px' }}>
              {searchQuery 
                ? 'Tidak ada events yang sesuai dengan pencarian' 
                : initialLoadDone 
                  ? `Tidak ada events dalam ${EVENTS_HISTORY_PERIOD} hari terakhir` 
                  : 'Belum ada events'}
            </Typography>
            {!searchQuery && !initialLoadDone && (
              <Typography variant="caption" sx={{ fontSize: '10px', display: 'block', mt: 1 }}>
                Klik tombol refresh untuk memuat events
              </Typography>
            )}
          </Box>
        ) : (
          filteredEvents.map((event) => (
            <ListItem 
              key={event.id} 
              className={classes.listItem} 
              disablePadding
              onClick={() => handleEventClick(event)}
            >
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
          ))
        )}
      </List>
    </div>
  );
};

export default EventsList;
