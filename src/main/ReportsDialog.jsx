import {
  useEffect, useState, useMemo, useCallback,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, TextField, Tabs, Tab,
  FormControl, Select, MenuItem, ListSubheader,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  Checkbox, Tooltip, Chip,
  CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import { useSelector } from 'react-redux';

/* ─────────── Report type definitions (V1 parity – 4 groups) ─────────── */
const REPORT_TYPES = [
  // Text Reports
  { id: 'summary', label: 'General Information', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'route', label: 'Route Data', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'trips', label: 'Drives and Stops', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'stops', label: 'Stops', group: 'Text Reports', endpoint: '/api/reports/stops' },
  { id: 'events', label: 'Events', group: 'Text Reports', endpoint: '/api/reports/events' },
  // Graphical Reports
  { id: 'speed_graph', label: 'Speed', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  // Map Reports
  { id: 'routes_map', label: 'Routes', group: 'Map Reports', endpoint: '/api/reports/route' },
];

const REPORT_TYPE_MAP = {};
REPORT_TYPES.forEach((rt) => { REPORT_TYPE_MAP[rt.id] = rt; });

const FORMAT_OPTIONS = [
  { id: 'html', label: 'HTML' },
  { id: 'pdf', label: 'PDF' },
  { id: 'xls', label: 'XLS' },
];

const TIME_FILTERS = [
  { id: '', label: '' },
  { id: 'lastHour', label: 'Last Hour' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'before2days', label: 'Before 2 Days' },
  { id: 'before3days', label: 'Before 3 Days' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
];

const STOP_DURATIONS = [
  { value: '1', label: '> 1 min' },
  { value: '2', label: '> 2 min' },
  { value: '5', label: '> 5 min' },
  { value: '10', label: '> 10 min' },
  { value: '20', label: '> 20 min' },
  { value: '30', label: '> 30 min' },
  { value: '60', label: '> 1 h' },
  { value: '120', label: '> 2 h' },
  { value: '300', label: '> 5 h' },
];

/* ─────────── localStorage helpers ─────────── */
const LS_TEMPLATES_KEY = 'gps_report_templates';
const LS_GENERATED_KEY = 'gps_report_generated';

const loadTemplates = () => {
  try { return JSON.parse(localStorage.getItem(LS_TEMPLATES_KEY)) || []; } catch { return []; }
};
const saveTemplates = (list) => localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(list));

const loadGenerated = () => {
  try { return JSON.parse(localStorage.getItem(LS_GENERATED_KEY)) || []; } catch { return []; }
};
const saveGenerated = (list) => localStorage.setItem(LS_GENERATED_KEY, JSON.stringify(list));

/* ─────────── date helpers ─────────── */
const pad = (n) => String(n).padStart(2, '0');
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const applyTimeFilter = (filterId) => {
  const now = new Date();
  let from; let
    to;
  switch (filterId) {
    case 'lastHour': from = new Date(now - 3600000); to = now; break;
    case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); from = new Date(y.getFullYear(), y.getMonth(), y.getDate()); to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59); break; }
    case 'before2days': { const d2 = new Date(now); d2.setDate(d2.getDate() - 2); from = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()); to = now; break; }
    case 'before3days': { const d3 = new Date(now); d3.setDate(d3.getDate() - 3); from = new Date(d3.getFullYear(), d3.getMonth(), d3.getDate()); to = now; break; }
    case 'thisWeek': { const day = now.getDay() || 7; from = new Date(now); from.setDate(now.getDate() - day + 1); from.setHours(0, 0, 0, 0); to = now; break; }
    case 'lastWeek': { const day2 = now.getDay() || 7; const end = new Date(now); end.setDate(now.getDate() - day2); end.setHours(23, 59, 59); const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0); from = start; to = end; break; }
    case 'thisMonth': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
    case 'lastMonth': from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
    default: from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now;
  }
  return { from: fmtLocal(from), to: fmtLocal(to) };
};

/* ─────────── styles ─────────── */
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
  tabs: {
    minHeight: 32,
    '& .MuiTab-root': { minHeight: 32, fontSize: '12px', textTransform: 'none', padding: '4px 16px' },
    borderBottom: '1px solid #e0e0e0',
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
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
  },
  toolbarBtn: {
    padding: '4px',
    '&:hover': { backgroundColor: '#e0e0e0' },
  },
  actionBtn: {
    padding: '2px',
    '&:hover': { backgroundColor: '#e3f2fd' },
  },
  /* ── Properties dialog ── */
  propRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    '& .lbl': { width: '40%', fontSize: '12px', color: '#333' },
    '& .val': { width: '60%' },
  },
  propCol: {
    flex: 1,
    padding: '0 12px',
  },
  propSection: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2a81d4',
    borderBottom: '1px solid #ddd',
    marginBottom: '8px',
    paddingBottom: '2px',
  },
}));

/* ═══════════════════════════════════════════════════════════════
   ReportPropertiesDialog  – add / edit a report template (V1)
   ═══════════════════════════════════════════════════════════════ */
const emptyTemplate = () => ({
  id: Date.now(),
  name: '',
  type: 'summary',
  format: 'html',
  deviceIds: [],
  zoneIds: [],
  sensorIds: [],
  dataItems: [],
  ignoreEmpty: false,
  showCoordinates: true,
  showAddresses: false,
  zonesAddresses: false,
  stopDuration: '1',
  speedLimit: '',
  daily: false,
  weekly: false,
  scheduleEmail: '',
  timeFilter: 'today',
  dateFrom: '',
  dateTo: '',
});

const ReportPropertiesDialog = ({
  open, onClose, onSave, onGenerate, template, devices, geofences,
}) => {
  const { classes } = useStyles();
  const [form, setForm] = useState(emptyTemplate());

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({ ...emptyTemplate(), ...template });
      } else {
        const t = emptyTemplate();
        const { from, to } = applyTimeFilter('today');
        t.dateFrom = from;
        t.dateTo = to;
        setForm(t);
      }
    }
  }, [open, template]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setCheck = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const handleFilterChange = (e) => {
    const fid = e.target.value;
    setForm((prev) => {
      const { from, to } = fid ? applyTimeFilter(fid) : { from: prev.dateFrom, to: prev.dateTo };
      return { ...prev, timeFilter: fid, dateFrom: from, dateTo: to };
    });
  };

  const handleSave = () => { onSave(form); onClose(); };
  const handleGenerate = () => { onSave(form); onGenerate(form); onClose(); };

  const grouped = useMemo(() => {
    const g = {};
    REPORT_TYPES.forEach((rt) => { if (!g[rt.group]) g[rt.group] = []; g[rt.group].push(rt); });
    return g;
  }, []);

  const smallSelect = { size: 'small', sx: { fontSize: '12px', '& .MuiSelect-select': { fontSize: '12px', py: '4px' } } };
  const smallInput = { size: 'small', InputProps: { sx: { fontSize: '12px' } }, InputLabelProps: { sx: { fontSize: '12px' } } };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 680, maxHeight: '90vh' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Report Properties</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, mt: 1 }}>
        {/* ── "Report" section header spanning full width ── */}
        <Box sx={{ px: 1.5 }}>
          <div className={classes.propSection}>Report</div>
        </Box>

        <Box display="flex">
          {/* ── Left column (V1: Name, Type, Objects, Zones, Sensors, Data items, Ignore empty) ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Name</span>
              <div className="val"><TextField fullWidth value={form.name} onChange={set('name')} {...smallInput} /></div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Type</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select value={form.type} onChange={set('type')}>
                    {Object.entries(grouped).map(([group, items]) => [
                      <ListSubheader key={group} sx={{ fontSize: '11px', lineHeight: '28px', color: '#666' }}>{group}</ListSubheader>,
                      ...items.map((rt) => <MenuItem key={rt.id} value={rt.id} sx={{ fontSize: '12px', pl: 3 }}>{rt.label}</MenuItem>),
                    ])}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Objects</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select
                    multiple
                    value={form.deviceIds}
                    onChange={(e) => setForm((p) => ({ ...p, deviceIds: e.target.value }))}
                    renderValue={(sel) => (sel.length ? `${sel.length} selected` : 'Nothing selected')}
                    displayEmpty
                  >
                    {devices.map((d) => (
                      <MenuItem key={d.id} value={d.id} sx={{ fontSize: '12px' }}>
                        <Checkbox size="small" checked={form.deviceIds.includes(d.id)} sx={{ p: '2px', mr: 1 }} />
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Zones</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select
                    multiple
                    value={form.zoneIds}
                    onChange={(e) => setForm((p) => ({ ...p, zoneIds: e.target.value }))}
                    renderValue={(sel) => (sel.length ? `${sel.length} selected` : 'Nothing selected')}
                    displayEmpty
                  >
                    {geofences.map((g) => (
                      <MenuItem key={g.id} value={g.id} sx={{ fontSize: '12px' }}>
                        <Checkbox size="small" checked={form.zoneIds.includes(g.id)} sx={{ p: '2px', mr: 1 }} />
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Sensors</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select
                    multiple
                    value={form.sensorIds}
                    onChange={(e) => setForm((p) => ({ ...p, sensorIds: e.target.value }))}
                    renderValue={(sel) => (sel.length ? `${sel.length} selected` : 'Nothing selected')}
                    displayEmpty
                  >
                    <MenuItem disabled sx={{ fontSize: '12px', color: '#999' }}>No sensors available</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Data items</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select
                    multiple
                    value={form.dataItems}
                    onChange={(e) => setForm((p) => ({ ...p, dataItems: e.target.value }))}
                    renderValue={(sel) => (sel.length ? `${sel.length} selected` : 'All selected')}
                    displayEmpty
                  >
                    <MenuItem disabled sx={{ fontSize: '12px', color: '#999' }}>All items included</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Ignore empty reports</span>
              <div className="val"><Checkbox size="small" checked={form.ignoreEmpty} onChange={setCheck('ignoreEmpty')} sx={{ p: 0 }} /></div>
            </div>
          </Box>

          {/* ── Right column (V1: Format, Show coordinates, Show addresses, Zones instead, Stops, Speed limit) ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Format</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select value={form.format} onChange={set('format')}>
                    {FORMAT_OPTIONS.map((f) => <MenuItem key={f.id} value={f.id} sx={{ fontSize: '12px' }}>{f.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show coordinates</span>
              <div className="val"><Checkbox size="small" checked={form.showCoordinates} onChange={setCheck('showCoordinates')} sx={{ p: 0 }} /></div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show addresses</span>
              <div className="val"><Checkbox size="small" checked={form.showAddresses} onChange={setCheck('showAddresses')} sx={{ p: 0 }} /></div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Zones instead of addresses</span>
              <div className="val"><Checkbox size="small" checked={form.zonesAddresses} onChange={setCheck('zonesAddresses')} sx={{ p: 0 }} /></div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Stops</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select value={form.stopDuration} onChange={set('stopDuration')}>
                    {STOP_DURATIONS.map((s) => <MenuItem key={s.value} value={s.value} sx={{ fontSize: '12px' }}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Speed limit (kph)</span>
              <div className="val"><TextField fullWidth value={form.speedLimit} onChange={set('speedLimit')} {...smallInput} type="number" /></div>
            </div>
          </Box>
        </Box>

        {/* ── Schedule (left) + Time period (right) – side by side like V1 ── */}
        <Box display="flex">
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Schedule</div>
            <div className={classes.propRow}>
              <span className="lbl">Daily</span>
              <div className="val"><Checkbox size="small" checked={form.daily} onChange={setCheck('daily')} sx={{ p: 0 }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Weekly</span>
              <div className="val"><Checkbox size="small" checked={form.weekly} onChange={setCheck('weekly')} sx={{ p: 0 }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Send to e-mail</span>
              <div className="val"><TextField fullWidth value={form.scheduleEmail} onChange={set('scheduleEmail')} placeholder="E-mail address" {...smallInput} /></div>
            </div>
          </Box>

          <Box className={classes.propCol}>
            <div className={classes.propSection}>Time period</div>
            <div className={classes.propRow}>
              <span className="lbl">Filter</span>
              <div className="val">
                <FormControl fullWidth {...smallSelect}>
                  <Select value={form.timeFilter} onChange={handleFilterChange}>
                    {TIME_FILTERS.map((f) => <MenuItem key={f.id} value={f.id} sx={{ fontSize: '12px' }}>{f.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time from</span>
              <div className="val">
                <TextField fullWidth type="datetime-local" value={form.dateFrom} onChange={set('dateFrom')} InputLabelProps={{ shrink: true }} {...smallInput} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time to</span>
              <div className="val">
                <TextField fullWidth type="datetime-local" value={form.dateTo} onChange={set('dateTo')} InputLabelProps={{ shrink: true }} {...smallInput} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Buttons (V1: Generate, Save, Cancel) ── */}
        <Box display="flex" justifyContent="center" gap={1} py={1.5} sx={{ borderTop: '1px solid #eee' }}>
          <Button variant="contained" size="small" startIcon={<BuildIcon />} onClick={handleGenerate} sx={{ textTransform: 'none', fontSize: '12px', backgroundColor: '#2a81d4' }}>
            Generate
          </Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSave} sx={{ textTransform: 'none', fontSize: '12px', backgroundColor: '#2a81d4' }}>
            Save
          </Button>
          <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={onClose} sx={{ textTransform: 'none', fontSize: '12px' }}>
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Generated Report Viewer Dialog
   ═══════════════════════════════════════════════════════════════ */
const formatDateTime = (dt) => { if (!dt) return ''; return new Date(dt).toLocaleString(); };
const formatDuration = (ms) => { if (!ms) return ''; const s = Math.floor(ms / 1000); return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`; };
const formatDistance = (m) => (m ? `${(m / 1000).toFixed(2)} km` : '0');

const RESULT_COLUMNS = {
  route: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'latitude', label: 'Lat', format: (v) => v?.toFixed(5) },
    { key: 'longitude', label: 'Lng', format: (v) => v?.toFixed(5) },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
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
    { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
    { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  ],
  stops: [
    { key: 'deviceName', label: 'Device' },
    { key: 'startTime', label: 'Start', format: formatDateTime },
    { key: 'endTime', label: 'End', format: formatDateTime },
    { key: 'duration', label: 'Duration', format: formatDuration },
    { key: 'address', label: 'Address' },
  ],
  summary: [
    { key: 'deviceName', label: 'Device' },
    { key: 'distance', label: 'Distance', format: formatDistance },
    { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
    { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
    { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
    { key: 'spentFuel', label: 'Fuel Used', format: (v) => (v ? `${v.toFixed(2)} L` : '') },
  ],
  speed_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  routes_map: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'latitude', label: 'Lat', format: (v) => v?.toFixed(5) },
    { key: 'longitude', label: 'Lng', format: (v) => v?.toFixed(5) },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
};

const GeneratedViewDialog = ({ open, onClose, report }) => {
  const { classes } = useStyles();
  if (!report) return null;
  const columns = RESULT_COLUMNS[report.type] || RESULT_COLUMNS.summary;
  const rows = report.data || [];

  const handleExportCSV = () => {
    const header = columns.map((c) => c.label).join(',');
    const csvRows = rows.map((row) => columns.map((c) => {
      const val = row[c.key];
      const formatted = c.format ? c.format(val) : (val ?? '');
      return `"${String(formatted).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${report.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 550 } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">{report.name} – {REPORT_TYPE_MAP[report.type]?.label || report.type}</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', mt: 1 }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead}>#</TableCell>
                {columns.map((c) => <TableCell key={c.key} className={classes.tableHead}>{c.label}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell className={classes.tableCell}>{i + 1}</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={classes.tableCell}>
                      {c.format ? c.format(row[c.key]) : (row[c.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="caption" color="text.secondary">{rows.length} record{rows.length !== 1 ? 's' : ''}</Typography>
          <Button variant="outlined" size="small" onClick={handleExportCSV} sx={{ textTransform: 'none', fontSize: '11px' }}>Export CSV</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main ReportsDialog  – 2 tabs (V1 parity)
   ═══════════════════════════════════════════════════════════════ */
const ReportsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);
  const geofenceItems = useSelector((state) => state.geofences.items);
  const geofenceList = useMemo(() => Object.values(geofenceItems), [geofenceItems]);

  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(false);

  // Properties dialog
  const [propsOpen, setPropsOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Generated viewer dialog
  const [viewReport, setViewReport] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Load data on open
  useEffect(() => {
    if (open) {
      setTemplates(loadTemplates());
      setGenerated(loadGenerated());
    }
  }, [open]);

  /* ── Template CRUD ── */
  const handleSaveTemplate = useCallback((tpl) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === tpl.id);
      const next = idx >= 0 ? prev.map((t, i) => (i === idx ? tpl : t)) : [...prev, tpl];
      saveTemplates(next);
      return next;
    });
  }, []);

  const handleDeleteTemplate = useCallback((id) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTemplates(next);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setTemplates(loadTemplates());
    setGenerated(loadGenerated());
  }, []);

  /* ── Generate report from template ── */
  const handleGenerate = useCallback(async (tpl) => {
    if (!tpl.deviceIds || tpl.deviceIds.length === 0) return;
    if (!tpl.dateFrom || !tpl.dateTo) return;
    setLoading(true);
    try {
      const rt = REPORT_TYPE_MAP[tpl.type];
      if (!rt) throw new Error('Unknown report type');
      const from = new Date(tpl.dateFrom).toISOString();
      const to = new Date(tpl.dateTo).toISOString();

      // Fetch for each device and merge
      const allData = [];
      for (const devId of tpl.deviceIds) {
        const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
        const resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (resp.ok) {
          const json = await resp.json();
          allData.push(...json);
        }
      }

      // Save generated report
      const genReport = {
        id: Date.now(),
        dateTime: new Date().toISOString(),
        name: tpl.name || 'Untitled',
        type: tpl.type,
        format: tpl.format,
        deviceIds: tpl.deviceIds,
        zoneIds: tpl.zoneIds,
        schedule: tpl.daily || tpl.weekly,
        data: allData,
        recordCount: allData.length,
      };
      setGenerated((prev) => {
        const next = [genReport, ...prev];
        saveGenerated(next);
        return next;
      });
      setTab(1); // Switch to Generated tab
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteGenerated = useCallback((id) => {
    setGenerated((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveGenerated(next);
      return next;
    });
  }, []);

  const handleOpenGenerated = useCallback((report) => {
    setViewReport(report);
    setViewOpen(true);
  }, []);

  /* ── Device name resolver ── */
  const deviceName = useCallback((id) => devices[id]?.name || id, [devices]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 600 } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2">Reports</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} className={classes.tabs}>
          <Tab label="Reports" />
          <Tab label="Generated" />
        </Tabs>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <CircularProgress size={20} />
              <Typography variant="caption" sx={{ ml: 1 }}>Generating report…</Typography>
            </Box>
          )}

          {/* ════════ Tab 0: Reports (Templates) ════════ */}
          {tab === 0 && (
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead}>Name</TableCell>
                    <TableCell className={classes.tableHead}>Type</TableCell>
                    <TableCell className={classes.tableHead}>Format</TableCell>
                    <TableCell className={classes.tableHead}>Objects</TableCell>
                    <TableCell className={classes.tableHead}>Zones</TableCell>
                    <TableCell className={classes.tableHead} align="center">Daily</TableCell>
                    <TableCell className={classes.tableHead} align="center">Weekly</TableCell>
                    <TableCell className={classes.tableHead} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id} hover>
                      <TableCell className={classes.tableCell}>{tpl.name}</TableCell>
                      <TableCell className={classes.tableCell}>{REPORT_TYPE_MAP[tpl.type]?.label || tpl.type}</TableCell>
                      <TableCell className={classes.tableCell}>{(tpl.format || '').toUpperCase()}</TableCell>
                      <TableCell className={classes.tableCell}>
                        {tpl.deviceIds?.length > 0
                          ? <Tooltip title={tpl.deviceIds.map(deviceName).join(', ')}><Chip label={tpl.deviceIds.length} size="small" sx={{ height: 18, fontSize: '10px' }} /></Tooltip>
                          : '0'}
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        {tpl.zoneIds?.length > 0
                          ? <Chip label={tpl.zoneIds.length} size="small" sx={{ height: 18, fontSize: '10px' }} />
                          : '0'}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {tpl.daily ? <CheckIcon sx={{ fontSize: 14, color: '#4caf50' }} /> : <CloseIcon sx={{ fontSize: 14, color: '#ccc' }} />}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {tpl.weekly ? <CheckIcon sx={{ fontSize: 14, color: '#4caf50' }} /> : <CloseIcon sx={{ fontSize: 14, color: '#ccc' }} />}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Generate">
                          <IconButton className={classes.actionBtn} onClick={() => handleGenerate(tpl)} disabled={loading}>
                            <FlashOnIcon sx={{ fontSize: 16, color: '#f57c00' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton className={classes.actionBtn} onClick={() => { setEditTemplate(tpl); setPropsOpen(true); }}>
                            <EditIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton className={classes.actionBtn} onClick={() => handleDeleteTemplate(tpl.id)}>
                            <DeleteIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#999', fontSize: '12px' }}>
                        No report templates. Click + to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ════════ Tab 1: Generated ════════ */}
          {tab === 1 && (
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead}>DateTime</TableCell>
                    <TableCell className={classes.tableHead}>Name</TableCell>
                    <TableCell className={classes.tableHead}>Type</TableCell>
                    <TableCell className={classes.tableHead}>Format</TableCell>
                    <TableCell className={classes.tableHead}>Objects</TableCell>
                    <TableCell className={classes.tableHead}>Zones</TableCell>
                    <TableCell className={classes.tableHead} align="center">Schedule</TableCell>
                    <TableCell className={classes.tableHead}>Records</TableCell>
                    <TableCell className={classes.tableHead} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generated.map((gen) => (
                    <TableRow key={gen.id} hover>
                      <TableCell className={classes.tableCell}>{fmtShort(gen.dateTime)}</TableCell>
                      <TableCell className={classes.tableCell}>{gen.name}</TableCell>
                      <TableCell className={classes.tableCell}>{REPORT_TYPE_MAP[gen.type]?.label || gen.type}</TableCell>
                      <TableCell className={classes.tableCell}>{(gen.format || '').toUpperCase()}</TableCell>
                      <TableCell className={classes.tableCell}>
                        {gen.deviceIds?.length > 0
                          ? <Tooltip title={gen.deviceIds.map(deviceName).join(', ')}><Chip label={gen.deviceIds.length} size="small" sx={{ height: 18, fontSize: '10px' }} /></Tooltip>
                          : '0'}
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        {gen.zoneIds?.length > 0
                          ? <Chip label={gen.zoneIds.length} size="small" sx={{ height: 18, fontSize: '10px' }} />
                          : '0'}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {gen.schedule ? <CheckIcon sx={{ fontSize: 14, color: '#4caf50' }} /> : <CloseIcon sx={{ fontSize: 14, color: '#ccc' }} />}
                      </TableCell>
                      <TableCell className={classes.tableCell}>{gen.recordCount ?? (gen.data?.length || 0)}</TableCell>
                      <TableCell className={classes.tableCell} align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Open">
                          <IconButton className={classes.actionBtn} onClick={() => handleOpenGenerated(gen)}>
                            <OpenInNewIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton className={classes.actionBtn} onClick={() => handleDeleteGenerated(gen.id)}>
                            <DeleteIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {generated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#999', fontSize: '12px' }}>
                        No generated reports yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        {/* ── Bottom Toolbar (V1: + / Refresh / — ) ── */}
        <Box className={classes.toolbar}>
          <Tooltip title="Add Report Template">
            <IconButton className={classes.toolbarBtn} onClick={() => { setEditTemplate(null); setPropsOpen(true); }}>
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton className={classes.toolbarBtn} onClick={handleRefresh}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Box flex={1} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
            {tab === 0 ? `${templates.length} template${templates.length !== 1 ? 's' : ''}` : `${generated.length} report${generated.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
      </Dialog>

      {/* ── Report Properties (Add/Edit) ── */}
      <ReportPropertiesDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        onSave={handleSaveTemplate}
        onGenerate={handleGenerate}
        template={editTemplate}
        devices={deviceList}
        geofences={geofenceList}
      />

      {/* ── Generated Report Viewer ── */}
      <GeneratedViewDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        report={viewReport}
      />
    </>
  );
};

export default ReportsDialog;
