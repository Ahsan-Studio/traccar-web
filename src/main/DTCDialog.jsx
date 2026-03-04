import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  Button, Checkbox, CircularProgress,
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

// Common OBD-II DTC descriptions
const DTC_DESCRIPTIONS = {
  P0100: 'Mass Air Flow Circuit Malfunction',
  P0101: 'Mass Air Flow Circuit Range/Performance',
  P0110: 'Intake Air Temperature Circuit Malfunction',
  P0120: 'Throttle Position Sensor Circuit Malfunction',
  P0130: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)',
  P0171: 'System Too Lean (Bank 1)',
  P0172: 'System Too Rich (Bank 1)',
  P0300: 'Random/Multiple Cylinder Misfire Detected',
  P0301: 'Cylinder 1 Misfire Detected',
  P0420: 'Catalyst System Efficiency Below Threshold',
  P0440: 'Evaporative Emission Control System Malfunction',
  P0500: 'Vehicle Speed Sensor Malfunction',
  P0600: 'Serial Communication Link Malfunction',
  P0700: 'Transmission Control System Malfunction',
};

const DTCDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);
  const positions = useSelector((state) => state.session.positions);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dtcData, setDtcData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  // On open, set default dates
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

  // Extract DTC codes from events
  const handleLoad = async () => {
    setLoading(true);
    setDtcData([]);
    setSelected([]);
    try {
      const from = new Date(dateFrom).toISOString();
      const to = new Date(dateTo).toISOString();
      let url = `/api/reports/events?from=${from}&to=${to}&type=alarm`;
      if (selectedDeviceId) url += `&deviceId=${selectedDeviceId}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const events = await res.json();
        // Filter for DTC-related events and extract codes
        const dtcEvents = events
          .filter((e) => {
            const attrs = e.attributes || {};
            return attrs.dtcs || attrs.alarm === 'dtc' || (attrs.result && /^[PBCU]\d{4}/.test(attrs.result));
          })
          .map((e, idx) => {
            const attrs = e.attributes || {};
            const code = attrs.dtcs || attrs.result || 'Unknown';
            const device = devices[e.deviceId];
            return {
              id: e.id || idx,
              time: e.eventTime || e.serverTime,
              deviceName: device?.name || `ID: ${e.deviceId}`,
              code: code.toUpperCase(),
              description: DTC_DESCRIPTIONS[code.toUpperCase()] || 'Unknown code',
              positionId: e.positionId,
            };
          });
        setDtcData(dtcEvents);
      }
    } catch (err) {
      console.error('Failed to load DTC data:', err);
    } finally {
      setLoading(false);
    }

    // Also check current positions for DTC attributes
    if (!selectedDeviceId) {
      const posItems = Object.values(positions)
        .filter((p) => p.attributes?.dtcs)
        .map((p) => {
          const device = devices[p.deviceId];
          const codes = String(p.attributes.dtcs).split(',');
          return codes.map((code) => ({
            id: `pos_${p.id}_${code}`,
            time: p.fixTime,
            deviceName: device?.name || `ID: ${p.deviceId}`,
            code: code.trim().toUpperCase(),
            description: DTC_DESCRIPTIONS[code.trim().toUpperCase()] || 'Unknown code',
          }));
        })
        .flat();
      if (posItems.length > 0) {
        setDtcData((prev) => [...prev, ...posItems]);
      }
    }
  };

  const handleToggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleDeleteSelected = () => {
    setDtcData((prev) => prev.filter((d) => !selected.includes(d.id)));
    setSelected([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '800px', height: '500px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Diagnostic Trouble Codes (DTC)</Typography>
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
          {selected.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              sx={{ textTransform: 'none' }}
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
                <TableCell className={classes.tableHead}>Code</TableCell>
                <TableCell className={classes.tableHead}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dtcData.map((row, idx) => (
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
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: '#d32f2f' }}>
                      {row.code}
                    </Typography>
                  </TableCell>
                  <TableCell className={classes.tableCell}>{row.description}</TableCell>
                </TableRow>
              ))}
              {dtcData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                    No DTC data. Select parameters and click Load.
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

export default DTCDialog;
