import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  Button, Checkbox, Chip, CircularProgress,
  FormControlLabel,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from 'react-redux';

const useStyles = makeStyles()(() => ({
  dialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
  },
  tableCell: {
    fontSize: '11px',
    padding: '4px 8px',
  },
  tableHead: {
    fontSize: '11px',
    padding: '4px 8px',
    fontWeight: 600,
    backgroundColor: '#f5f5f5',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
}));

const GROUP_COLORS = {
  driver: '#2196f3',
  passenger: '#ff9800',
  trailer: '#9c27b0',
};

const LogbookDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDrivers, setShowDrivers] = useState(true);
  const [showPassengers, setShowPassengers] = useState(true);
  const [showTrailers, setShowTrailers] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const pad = (n) => String(n).padStart(2, '0');
      const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setDateFrom(fmtLocal(todayStart));
      setDateTo(fmtLocal(now));
    }
  }, [open]);

  const handleLoad = async () => {
    setLoading(true);
    setSelected([]);
    try {
      // Build API query parameters
      let url = '/api/logbook?';
      const params = [];
      if (selectedDeviceId) params.push(`deviceId=${selectedDeviceId}`);

      // Build group filter
      const groups = [];
      if (showDrivers) groups.push('driver');
      if (showPassengers) groups.push('passenger');
      if (showTrailers) groups.push('trailer');

      url += params.join('&');

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      let entries = [];

      if (res.ok) {
        const apiData = await res.json();
        const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
        const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;

        entries = apiData
          .filter((entry) => {
            const t = new Date(entry.eventTime || entry.serverTime).getTime();
            return t >= fromTime && t <= toTime;
          })
          .map((entry) => {
            const device = devices[entry.deviceId];
            return {
              id: entry.id,
              _serverId: entry.id,
              time: entry.eventTime || entry.serverTime,
              deviceName: device?.name || `ID: ${entry.deviceId}`,
              group: entry.entryGroup || 'driver',
              assignId: entry.assignId || 'Unknown',
              address: entry.address || '',
              latitude: entry.latitude,
              longitude: entry.longitude,
            };
          });
      }

      // Also try loading from driverChanged events as fallback/supplement
      try {
        const from = new Date(dateFrom).toISOString();
        const to = new Date(dateTo).toISOString();
        let eventsUrl = `/api/reports/events?from=${from}&to=${to}&type=driverChanged`;
        if (selectedDeviceId) eventsUrl += `&deviceId=${selectedDeviceId}`;

        const eventsRes = await fetch(eventsUrl, { headers: { Accept: 'application/json' } });
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          const eventEntries = events
            .filter((e) => !entries.some((existing) => existing.id === e.id))
            .map((e) => {
              const device = devices[e.deviceId];
              return {
                id: `event-${e.id}`,
                time: e.eventTime || e.serverTime,
                deviceName: device?.name || `ID: ${e.deviceId}`,
                group: 'driver',
                assignId: e.attributes?.driverUniqueId || 'Unknown',
                address: '',
              };
            });
          entries = [...entries, ...eventEntries];
        }
      } catch {
        // Events API optional — ignore if fails
      }

      setData(entries.sort((a, b) => new Date(b.time) - new Date(a.time)));
    } catch (err) {
      console.error('Failed to load logbook:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => data.filter((d) => {
    if (d.group === 'driver' && !showDrivers) return false;
    if (d.group === 'passenger' && !showPassengers) return false;
    if (d.group === 'trailer' && !showTrailers) return false;
    return true;
  }), [data, showDrivers, showPassengers, showTrailers]);

  const handleToggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleDeleteSelected = async () => {
    // Delete from API for server entries
    const serverIds = selected.filter((id) => typeof id === 'number');
    try {
      await Promise.all(
        serverIds.map((id) =>
          fetch(`/api/logbook/${id}`, { method: 'DELETE' })
        )
      );
    } catch (err) {
      console.error('Failed to delete logbook entries:', err);
    }

    // Remove from local state
    setData((prev) => prev.filter((d) => !selected.includes(d.id)));
    setSelected([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '800px', height: '550px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Logbook (RFID / iButton)</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box className={classes.filterRow}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              label="Device"
            >
              <MenuItem value="">All Devices</MenuItem>
              {deviceList.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="datetime-local"
            label="From"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 190 }}
          />
          <TextField
            type="datetime-local"
            label="To"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 190 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleLoad}
            disabled={loading}
            sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Load'}
          </Button>
        </Box>

        <Box display="flex" gap={2} mb={1}>
          <FormControlLabel
            control={<Checkbox size="small" checked={showDrivers} onChange={(e) => setShowDrivers(e.target.checked)} />}
            label={<Typography variant="caption">Drivers</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={showPassengers} onChange={(e) => setShowPassengers(e.target.checked)} />}
            label={<Typography variant="caption">Passengers</Typography>}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={showTrailers} onChange={(e) => setShowTrailers(e.target.checked)} />}
            label={<Typography variant="caption">Trailers</Typography>}
          />
          {selected.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              sx={{ textTransform: 'none', ml: 'auto' }}
            >
              Delete ({selected.length})
            </Button>
          )}
        </Box>

        <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead} padding="checkbox" />
                <TableCell className={classes.tableHead}>#</TableCell>
                <TableCell className={classes.tableHead}>Time</TableCell>
                <TableCell className={classes.tableHead}>Device</TableCell>
                <TableCell className={classes.tableHead}>Group</TableCell>
                <TableCell className={classes.tableHead}>Assign ID</TableCell>
                <TableCell className={classes.tableHead}>Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, idx) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selected.includes(row.id)}
                      onChange={() => handleToggle(row.id)}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>{idx + 1}</TableCell>
                  <TableCell className={classes.tableCell}>{row.time ? new Date(row.time).toLocaleString() : ''}</TableCell>
                  <TableCell className={classes.tableCell}>{row.deviceName}</TableCell>
                  <TableCell className={classes.tableCell}>
                    <Chip
                      label={row.group}
                      size="small"
                      sx={{ fontSize: '10px', height: '18px', backgroundColor: GROUP_COLORS[row.group] || '#9e9e9e', color: '#fff' }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>{row.assignId}</TableCell>
                  <TableCell className={classes.tableCell}>{row.address || '—'}</TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                    No logbook entries. Select parameters and click Load.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default LogbookDialog;
