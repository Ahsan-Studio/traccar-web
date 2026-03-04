import {
 useEffect, useState, useMemo, useCallback 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';

const REPORT_TYPES = [
  { id: 'route', label: 'Route', endpoint: '/api/reports/route' },
  { id: 'events', label: 'Events', endpoint: '/api/reports/events' },
  { id: 'trips', label: 'Trips', endpoint: '/api/reports/trips' },
  { id: 'stops', label: 'Stops', endpoint: '/api/reports/stops' },
  { id: 'summary', label: 'Summary', endpoint: '/api/reports/summary' },
];

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
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  tableCell: {
    fontSize: '11px',
    padding: '4px 8px',
    whiteSpace: 'nowrap',
  },
  tableHead: {
    fontSize: '11px',
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    fontWeight: 600,
    backgroundColor: '#f5f5f5',
  },
}));

const formatDateTime = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString();
};

const formatDuration = (ms) => {
  if (!ms) return '';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
};

const formatDistance = (meters) => {
  if (!meters) return '0';
  return `${(meters / 1000).toFixed(2)} km`;
};

// Column configurations for each report type
const COLUMNS = {
  route: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'latitude', label: 'Lat', format: (v) => v?.toFixed(5) },
    { key: 'longitude', label: 'Lng', format: (v) => v?.toFixed(5) },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => v ? (v * 1.852).toFixed(1) : '0' },
    { key: 'course', label: 'Course', format: (v) => v?.toFixed(0) },
    { key: 'address', label: 'Address' },
  ],
  events: [
    { key: 'eventTime', label: 'Time', format: formatDateTime },
    { key: 'type', label: 'Type' },
    { key: 'deviceId', label: 'Device ID' },
  ],
  trips: [
    { key: 'deviceName', label: 'Device' },
    { key: 'startTime', label: 'Start', format: formatDateTime },
    { key: 'endTime', label: 'End', format: formatDateTime },
    { key: 'distance', label: 'Distance', format: formatDistance },
    { key: 'duration', label: 'Duration', format: formatDuration },
    { key: 'averageSpeed', label: 'Avg Speed', format: (v) => v ? `${(v * 1.852).toFixed(1)} km/h` : '' },
    { key: 'maxSpeed', label: 'Max Speed', format: (v) => v ? `${(v * 1.852).toFixed(1)} km/h` : '' },
    { key: 'startAddress', label: 'From' },
    { key: 'endAddress', label: 'To' },
  ],
  stops: [
    { key: 'deviceName', label: 'Device' },
    { key: 'startTime', label: 'Start', format: formatDateTime },
    { key: 'endTime', label: 'End', format: formatDateTime },
    { key: 'duration', label: 'Duration', format: formatDuration },
    { key: 'address', label: 'Address' },
    { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
  ],
  summary: [
    { key: 'deviceName', label: 'Device' },
    { key: 'distance', label: 'Distance', format: formatDistance },
    { key: 'averageSpeed', label: 'Avg Speed', format: (v) => v ? `${(v * 1.852).toFixed(1)} km/h` : '' },
    { key: 'maxSpeed', label: 'Max Speed', format: (v) => v ? `${(v * 1.852).toFixed(1)} km/h` : '' },
    { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
    { key: 'spentFuel', label: 'Fuel Used', format: (v) => v ? `${v.toFixed(2)} L` : '' },
  ],
};

const ReportsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [reportType, setReportType] = useState('summary');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  // Set default dates on open
  useEffect(() => {
    if (open) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // Format for datetime-local input
      const pad = (n) => String(n).padStart(2, '0');
      const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setDateFrom(fmtLocal(todayStart));
      setDateTo(fmtLocal(now));
      setData([]);
      setError('');
    }
  }, [open]);

  const handleGenerate = useCallback(async () => {
    if (!selectedDeviceId) {
      setError('Please select a device');
      return;
    }
    if (!dateFrom || !dateTo) {
      setError('Please select date range');
      return;
    }
    setLoading(true);
    setError('');
    setData([]);
    try {
      const rt = REPORT_TYPES.find((r) => r.id === reportType);
      const from = new Date(dateFrom).toISOString();
      const to = new Date(dateTo).toISOString();
      const url = `${rt.endpoint}?deviceId=${selectedDeviceId}&from=${from}&to=${to}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || `HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (result.length === 0) setError('No data found for selected period');
    } catch (err) {
      console.error('Report error:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDeviceId, dateFrom, dateTo]);

  const handleExportCSV = useCallback(() => {
    if (data.length === 0) return;
    const cols = COLUMNS[reportType] || [];
    const header = cols.map((c) => c.label).join(',');
    const rows = data.map((row) => cols.map((c) => {
      const val = row[c.key];
      const formatted = c.format ? c.format(val) : (val ?? '');
      return `"${String(formatted).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, reportType]);

  const columns = COLUMNS[reportType] || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '900px', height: '600px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Reports</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Filters */}
        <Box className={classes.formRow}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setData([]); }}
              label="Report Type"
            >
              {REPORT_TYPES.map((rt) => (
                <MenuItem key={rt.id} value={rt.id}>{rt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              label="Device"
            >
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
            sx={{ width: 200 }}
          />
          <TextField
            type="datetime-local"
            label="To"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />

          <Button
            variant="contained"
            size="small"
            onClick={handleGenerate}
            disabled={loading}
            sx={{ backgroundColor: '#2a81d4', textTransform: 'none', minWidth: '90px' }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Generate'}
          </Button>
        </Box>

        {error && (
          <Typography variant="caption" color="error" sx={{ mb: 1 }}>{error}</Typography>
        )}

        {/* Data table */}
        <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead}>#</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} className={classes.tableHead}>{col.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell className={classes.tableCell}>{idx + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={classes.tableCell}>
                      {col.format ? col.format(row[col.key]) : (row[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                    Select parameters and click Generate
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {data.length > 0 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Typography variant="caption" color="text.secondary">
              {data.length} record{data.length !== 1 ? 's' : ''} found
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportCSV}
              sx={{ textTransform: 'none', fontSize: '11px' }}
            >
              Export CSV
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportsDialog;
