import { useState, useEffect } from 'react';
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
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'white',
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
    backgroundColor: 'white',
    borderRadius: 0,
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      color: '#666666',
    },
  },
  root: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'white',
  },
  header: {
    display: 'flex',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    padding: '8px 16px',
    '& > div': {
      fontSize: '13px',
      fontWeight: 500,
      color: '#000',
    },
  },
  headerTime: {
    width: '100px',
  },
  headerDevice: {
    width: '200px',
  },
  headerEvent: {
    flex: 1,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 16px',
    borderBottom: '1px solid #e0e0e0',
    '&:nth-of-type(even)': {
      backgroundColor: '#f8f9fa',
    },
  },
  time: {
    width: '100px',
    fontSize: '12px',
    color: theme.palette.text.primary,
  },
  deviceName: {
    width: '200px',
    fontSize: '12px',
    color: theme.palette.text.primary,
  },
  event: {
    flex: 1,
    fontSize: '12px',
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(event => 
    event.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getEventDescription(event).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    fetchEvents();
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
        await fetchOrThrow('/api/events/delete', { method: 'POST' });
        setEvents([]);
      } catch (err) {
        console.error('Error deleting events:', err);
        setError('Gagal menghapus events');
      }
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // First get all devices
      const devicesResponse = await fetchOrThrow('/api/devices');
      const devices = await devicesResponse.json();
      const deviceMap = devices.reduce((acc, device) => {
        acc[device.id] = device.name;
        return acc;
      }, {});

      // Get all positions history
      const response = await fetchOrThrow('/api/positions');
      const positions = await response.json();

      // Process positions into events
      const events = positions.map(position => ({
        id: position.id,
        deviceId: position.deviceId,
        serverTime: position.deviceTime,
        type: position.attributes.ignition ? 'ignitionOn' : 'ignitionOff',
        attributes: position.attributes,
        speed: position.speed,
        status: position.attributes.motion ? 'Berjalan' : 'Berhenti',
        motion: position.attributes.motion
      }));

      // Sort by time descending
      const sortedEvents = events.sort((a, b) => 
        dayjs(b.serverTime).valueOf() - dayjs(a.serverTime).valueOf()
      );
      // Add device names to events
      const eventsWithNames = sortedEvents.map(event => ({
          ...event,
          deviceName: deviceMap[event.deviceId] || `Device ${event.deviceId}`
        }))
        .sort((a, b) => dayjs(b.serverTime).valueOf() - dayjs(a.serverTime).valueOf());
      
      setEvents(eventsWithNames);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Refresh events every minute
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const getEventDescription = (event) => {
    if (event.type === 'ignitionOn') return 'Mesin dihidupkan';
    if (event.type === 'ignitionOff') return 'Mesin dimatikan';
    return event.status || 'Status tidak diketahui';
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
              {dayjs(event.serverTime).format('HH:mm:ss')}
            </Typography>
            <Typography className={classes.deviceName}>
              {event.deviceName}
            </Typography>
            <Typography className={classes.event}>
              {getEventDescription(event)}
              {event.attributes?.motion ? ' - Demo S5' : ''}
            </Typography>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default EventsList;
