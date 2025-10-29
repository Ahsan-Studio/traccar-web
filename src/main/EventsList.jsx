import {
  useState, useEffect, useMemo, useCallback,
} from 'react';
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
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { EVENTS_HISTORY_PERIOD } from '../common/config/constants';
import { devicesActions } from '../store';
import { map } from '../map/core/MapView';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  toolbar: {
    display: 'flex',
    gap: '5px',
    padding: '10px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
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
    flexShrink: 0,
    '& > div': {
      fontSize: '12px',
      fontWeight: 400,
      color: '#444444',
    },
  },
  headerTime: {
    width: '70px',
  },
  headerDevice: {
    width: '150px',
  },
  headerEvent: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  paginationButton: {
    width: '24px',
    height: '24px',
    minWidth: '24px',
    padding: 0,
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      color: '#666666',
    },
    '&:disabled': {
      opacity: 0.3,
    },
  },
  pageInfo: {
    fontSize: '11px',
    color: '#666666',
    padding: '0 8px',
  },
  pageSizeSelect: {
    fontSize: '11px',
    height: '24px',
    '& .MuiSelect-select': {
      padding: '2px 24px 2px 8px',
      fontSize: '11px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: '1px solid #e0e0e0',
    },
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
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
    width: '70px',
    fontSize: '11px',
    color: theme.palette.text.primary,
  },
  deviceName: {
    width: '150px',
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
    alignItems: 'center',
    padding: theme.spacing(4),
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  listContainerLoading: {
    position: 'relative',
    opacity: 0.5,
    pointerEvents: 'none',
  },
}));

const EventsList = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  
  // Redux selectors - Only devices and positions needed
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);

  // Memoized event type mapping
  const getEventDescription = useCallback((event) => {
    const eventTypeMap = {
      deviceOnline: 'Perangkat Online',
      deviceOffline: 'Perangkat Offline',
      deviceUnknown: 'Status Tidak Diketahui',
      deviceInactive: 'Perangkat Tidak Aktif',
      deviceMoving: 'Perangkat Bergerak',
      deviceStopped: 'Perangkat Berhenti',
      geofenceEnter: 'Masuk Geofence',
      geofenceExit: 'Keluar Geofence',
      deviceOverspeed: 'Kecepatan Berlebih',
      deviceFuelDrop: 'Bahan Bakar Turun',
      deviceFuelIncrease: 'Bahan Bakar Bertambah',
      ignitionOn: 'Mesin Dihidupkan',
      ignitionOff: 'Mesin Dimatikan',
      alarm: 'Alarm',
      maintenance: 'Maintenance',
      driverChanged: 'Pengemudi Berganti',
      commandResult: 'Hasil Perintah',
      media: 'Media Diterima',
    };
    
    return eventTypeMap[event.type] || event.type || 'Event tidak diketahui';
  }, []);

  // Memoized filtered events to avoid recalculating on every render
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    
    const lowerQuery = searchQuery.toLowerCase();
    return events.filter(event => 
      event.deviceName?.toLowerCase().includes(lowerQuery) ||
      getEventDescription(event).toLowerCase().includes(lowerQuery)
    );
  }, [events, searchQuery, getEventDescription]);

  // Memoized event click handler
  const handleEventClick = useCallback(async (event) => {
    console.log('Event clicked:', event);
    
    let position = positions[event.positionId];
    
    if (!position && event.positionId) {
      try {
        console.log('Fetching position:', event.positionId);
        const response = await fetchOrThrow(`/api/positions?id=${event.positionId}`);
        const positionsData = await response.json();
        if (positionsData.length > 0) {
          position = positionsData[0];
          console.log('Position fetched:', position);
        }
      } catch (err) {
        console.error('Error fetching position:', err);
        return;
      }
    }
    
    if (!position || !position.latitude || !position.longitude) {
      console.warn('Position not available for event:', event);
      return;
    }
    
    dispatch(devicesActions.selectId(event.deviceId));
    
    if (map) {
      try {
        map.easeTo({
          center: [position.longitude, position.latitude],
          zoom: Math.max(map.getZoom(), 15),
          duration: 1000,
        });
        console.log('Map panned to:', position.latitude, position.longitude);
      } catch (err) {
        console.error('Error panning map:', err);
      }
    }
  }, [positions, dispatch]);

  // Memoized refresh handler
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const from = dayjs().subtract(EVENTS_HISTORY_PERIOD, 'days').toISOString();
      const to = dayjs().toISOString();
      
      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const url = `/api/events/history?${params.toString()}`;
      
      const response = await fetchOrThrow(url);
      const result = await response.json();
      
      const apiEvents = result.data || [];
      
      const eventsWithDevices = apiEvents.map(event => ({
        ...event,
        deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
      })).sort((a, b) => {
        const timeA = dayjs(a.eventTime || a.serverTime).valueOf();
        const timeB = dayjs(b.eventTime || b.serverTime).valueOf();
        return timeB - timeA;
      });
      
      setEvents(eventsWithDevices);
      setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize));
      setInitialLoadDone(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(`Gagal memuat events: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, devices]);

  // Memoized export handler
  const handleExport = useCallback(() => {
    const csvContent = [
      ['Time', 'Object', 'Event'],
      ...filteredEvents.map(event => [
        dayjs(event.eventTime || event.serverTime).format('YY-MM-DD HH:mm:ss'),
        event.deviceName,
        getEventDescription(event) + (event.attributes?.message ? ` - ${event.attributes.message}` : '')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filteredEvents, getEventDescription]);

  // Memoized delete handler
  const handleDelete = useCallback(async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua events?')) {
      try {
        setLoading(true);
        await fetchOrThrow('/api/events', { method: 'DELETE' });
        setEvents([]);
        setInitialLoadDone(false);
      } catch (err) {
        console.error('Error deleting events:', err);
        setError('Gagal menghapus events');
      } finally {
        setLoading(false);
      }
    }
  }, []);
  
  // Initial load effect
  useEffect(() => {
    if (!initialLoadDone && Object.keys(devices).length > 0) {
      handleRefresh();
    }
  }, [initialLoadDone, devices, handleRefresh]);

  // Pagination effect - refresh when page/size changes
  useEffect(() => {
    if (initialLoadDone) {
      handleRefresh();
    }
  }, [currentPage, pageSize]);

  // Memoized page change handler
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      setCurrentPage(newPage);
    }
  }, [totalPages, loading]);

  // Memoized page size change handler
  const handlePageSizeChange = useCallback((event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }, []);

  return (
    <div className={classes.root}>
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
          title="Refresh"
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
          title="Export CSV"
        >
          <FileDownloadIcon />
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={handleDelete}
          title="Delete All"
        >
          <DeleteIcon />
        </IconButton>
      </div>

      <div className={classes.header}>
        <div className={classes.headerTime}>Time</div>
        <div className={classes.headerDevice}>Object</div>
        <div className={classes.headerEvent}>Event</div>
      </div>

      <div className={classes.listContainer} style={{ position: 'relative' }}>
        {loading && (
          <div className={classes.loader}>
            <CircularProgress size={24} />
          </div>
        )}
        <div className={loading ? classes.listContainerLoading : ''}>
          <List disablePadding>
            {error ? (
              <Box 
                sx={{ 
                  padding: 4, 
                  textAlign: 'center',
                  color: '#f44336'
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  {error}
                </Typography>
              </Box>
            ) : filteredEvents.length === 0 ? (
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
                    {dayjs(event.eventTime || event.serverTime).format('YY-MM-DD')}
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
      </div>

      <div className={classes.pagination}>
        <div className={classes.paginationControls}>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || loading}
          >
            <FirstPageIcon />
          </IconButton>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography className={classes.pageInfo}>
            Page {currentPage} of {totalPages || 1}
          </Typography>
          
          <IconButton 
            className={classes.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
          >
            <ChevronRightIcon />
          </IconButton>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages || loading}
          >
            <LastPageIcon />
          </IconButton>
        </div>
        
        <Select
          className={classes.pageSizeSelect}
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={loading}
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={75}>75</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
      </div>
    </div>
  );
};

export default EventsList;
