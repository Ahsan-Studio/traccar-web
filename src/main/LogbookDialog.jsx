import {
  useEffect, useState, useMemo, useCallback,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import {
  CustomTable, CustomSelect, CustomInput, CustomButton, CustomCheckbox,
} from '../common/components/custom';

/* ─────────── Constants ─────────── */
const GROUP_LABELS = { driver: 'Driver', passenger: 'Passenger', trailer: 'Trailer' };

const TIME_FILTERS = [
  { value: '0', label: 'Whole period' },
  { value: '1', label: 'Last Hour' },
  { value: '2', label: 'Today' },
  { value: '3', label: 'Yesterday' },
  { value: '4', label: 'Before 2 Days' },
  { value: '5', label: 'Before 3 Days' },
  { value: '6', label: 'This Week' },
  { value: '7', label: 'Last Week' },
  { value: '8', label: 'This Month' },
  { value: '9', label: 'Last Month' },
];

/* ─────────── date helpers ─────────── */
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const applyTimeFilter = (filterId) => {
  const now = new Date();
  let from; let to;
  switch (filterId) {
    case '1': from = new Date(now - 3600000); to = now; break;
    case '2': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
    case '3': { const y = new Date(now); y.setDate(y.getDate() - 1); from = new Date(y.getFullYear(), y.getMonth(), y.getDate()); to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59); break; }
    case '4': { const d2 = new Date(now); d2.setDate(d2.getDate() - 2); from = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()); to = now; break; }
    case '5': { const d3 = new Date(now); d3.setDate(d3.getDate() - 3); from = new Date(d3.getFullYear(), d3.getMonth(), d3.getDate()); to = now; break; }
    case '6': { const day = now.getDay() || 7; from = new Date(now); from.setDate(now.getDate() - day + 1); from.setHours(0, 0, 0, 0); to = now; break; }
    case '7': { const day2 = now.getDay() || 7; const end = new Date(now); end.setDate(now.getDate() - day2); end.setHours(23, 59, 59); const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0); from = start; to = end; break; }
    case '8': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
    case '9': from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
    default: return null;
  }
  return { from: fmtDate(from), to: fmtDate(to), hourFrom: pad(from.getHours()), minuteFrom: pad(from.getMinutes()), hourTo: pad(to.getHours()), minuteTo: pad(to.getMinutes()) };
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) }));

/* ─────────── Styles ─────────── */
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
  toolbarButtons: {
    display: 'flex',
    gap: '4px',
    padding: '6px 10px',
    borderBottom: '1px solid #e0e0e0',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    padding: '8px 10px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  filterField: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '& .lbl': { fontSize: '11px', color: '#444', whiteSpace: 'nowrap' },
  },
  checkboxGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '4px 10px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    flexShrink: 0,
    '& .cbx': {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: '#444',
    },
  },
}));

/* ═══════════════════════════════════════════════════════════════
   LogbookDialog — V1 parity (RFID & iButton Logbook)
   ═══════════════════════════════════════════════════════════════ */
const LogbookDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  /* Filter state */
  const [filterDevice, setFilterDevice] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('0');
  const [dateFrom, setDateFrom] = useState(fmtDate(new Date()));
  const [hourFrom, setHourFrom] = useState('00');
  const [minuteFrom, setMinuteFrom] = useState('00');
  const [dateTo, setDateTo] = useState(fmtDate(new Date()));
  const [hourTo, setHourTo] = useState('00');
  const [minuteTo, setMinuteTo] = useState('00');

  /* Group checkboxes (V1: Drivers / Passengers / Trailers) */
  const [showDrivers, setShowDrivers] = useState(true);
  const [showPassengers, setShowPassengers] = useState(true);
  const [showTrailers, setShowTrailers] = useState(true);

  /* Init dates on open */
  useEffect(() => {
    if (open) {
      const now = new Date();
      setDateFrom(fmtDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())));
      setDateTo(fmtDate(now));
      setHourFrom('00'); setMinuteFrom('00');
      setHourTo(pad(now.getHours())); setMinuteTo(pad(now.getMinutes()));
    }
  }, [open]);

  /* Load data */
  const handleLoad = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    try {
      let url = '/api/logbook?';
      const params = [];
      if (filterDevice) params.push(`deviceId=${filterDevice}`);
      url += params.join('&');

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      let entries = [];

      if (res.ok) {
        const apiData = await res.json();
        const fromISO = new Date(`${dateFrom}T${hourFrom}:${minuteFrom}:00`).getTime();
        const toISO = new Date(`${dateTo}T${hourTo}:${minuteTo}:59`).getTime();

        entries = apiData
          .filter((entry) => {
            const t = new Date(entry.eventTime || entry.serverTime).getTime();
            return t >= fromISO && t <= toISO;
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

      // Supplement with driverChanged events
      try {
        const from = new Date(`${dateFrom}T${hourFrom}:${minuteFrom}:00`).toISOString();
        const to = new Date(`${dateTo}T${hourTo}:${minuteTo}:59`).toISOString();
        let eventsUrl = `/api/reports/events?from=${from}&to=${to}&type=driverChanged`;
        if (filterDevice) eventsUrl += `&deviceId=${filterDevice}`;

        const eventsRes = await fetch(eventsUrl, { headers: { Accept: 'application/json' } });
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          const eventEntries = events
            .filter((e) => !entries.some((ex) => ex.id === e.id))
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
        // Events API optional
      }

      setData(entries.sort((a, b) => new Date(b.time) - new Date(a.time)));
    } catch (err) {
      console.error('Failed to load logbook:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [devices, filterDevice, dateFrom, hourFrom, minuteFrom, dateTo, hourTo, minuteTo]);

  /* Filter period change */
  const handleFilterChange = useCallback((val) => {
    setFilterPeriod(val);
    if (val !== '0') {
      const tf = applyTimeFilter(val);
      if (tf) {
        setDateFrom(tf.from); setHourFrom(tf.hourFrom); setMinuteFrom(tf.minuteFrom);
        setDateTo(tf.to); setHourTo(tf.hourTo); setMinuteTo(tf.minuteTo);
      }
    }
  }, []);

  /* Filtered by group checkboxes + search */
  const filteredData = useMemo(() => {
    let result = data.filter((d) => {
      if (d.group === 'driver' && !showDrivers) return false;
      if (d.group === 'passenger' && !showPassengers) return false;
      if (d.group === 'trailer' && !showTrailers) return false;
      return true;
    });
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => (d.deviceName || '').toLowerCase().includes(q)
        || (d.assignId || '').toLowerCase().includes(q)
        || (d.address || '').toLowerCase().includes(q));
    }
    return result;
  }, [data, showDrivers, showPassengers, showTrailers, search]);

  /* Device options */
  const deviceFilterOptions = useMemo(() => [
    { value: '', label: 'All objects' },
    ...deviceList.map((d) => ({ value: String(d.id), label: d.name })),
  ], [deviceList]);

  /* CustomTable columns (V1: Time, Object, Group, Assign ID, Position) */
  const columns = useMemo(() => [
    { key: 'time', label: 'Time', render: (row) => fmtDateTime(row.time) },
    { key: 'deviceName', label: 'Object' },
    { key: 'group', label: 'Group', render: (row) => GROUP_LABELS[row.group] || row.group },
    { key: 'assignId', label: 'Assign ID' },
    { key: 'address', label: 'Position', render: (row) => {
      const pos = row.latitude && row.longitude
        ? `${Number(row.latitude).toFixed(6)}°, ${Number(row.longitude).toFixed(6)}°`
        : '';
      return row.address ? `${pos}${pos ? ' - ' : ''}${row.address}` : pos;
    }},
  ], []);

  /* Delete handlers */
  const handleDeleteRow = useCallback(async (row) => {
    if (row?._serverId && typeof row._serverId === 'number') {
      try { await fetch(`/api/logbook/${row._serverId}`, { method: 'DELETE' }); } catch { /* */ }
    }
    setData((prev) => prev.filter((d) => d.id !== row.id));
    setSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  const handleBulkDelete = useCallback(async (ids) => {
    const serverIds = ids.filter((id) => typeof id === 'number');
    await Promise.all(serverIds.map((id) => fetch(`/api/logbook/${id}`, { method: 'DELETE' }).catch(() => {})));
    setData((prev) => prev.filter((d) => !ids.includes(d.id)));
    setSelected([]);
  }, []);

  const handleDeleteAll = useCallback(async () => {
    if (!window.confirm('Delete all logbook entries? This cannot be undone.')) return;
    const serverIds = data.filter((d) => typeof d._serverId === 'number').map((d) => d._serverId);
    await Promise.all(serverIds.map((id) => fetch(`/api/logbook/${id}`, { method: 'DELETE' }).catch(() => {})));
    setData([]);
    setSelected([]);
  }, [data]);

  const handleExportCSV = useCallback(() => {
    const header = 'Time,Object,Group,Assign ID,Position';
    const rows = filteredData.map((d) => [
      fmtDateTime(d.time), d.deviceName, GROUP_LABELS[d.group] || d.group,
      d.assignId, d.address || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `logbook_${fmtDate(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);

  /* Checkbox / selection helpers */
  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === filteredData.length ? [] : filteredData.map((d) => d.id)));
  }, [filteredData]);
  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 600 } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">RFID &amp; iButton Logbook</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      {/* ── Toolbar: Delete all, Export CSV, Show ── */}
      <Box className={classes.toolbarButtons}>
        <CustomButton variant="outlined" onClick={handleDeleteAll} size="small">Delete all</CustomButton>
        <CustomButton variant="outlined" onClick={handleExportCSV} size="small">Export to CSV</CustomButton>
        <CustomButton variant="outlined" onClick={handleLoad} size="small">Show</CustomButton>
      </Box>

      {/* ── Filter row (V1 parity) ── */}
      <Box className={classes.filterRow}>
        <Box className={classes.filterField}>
          <span className="lbl">Object</span>
          <CustomSelect value={filterDevice} onChange={setFilterDevice} options={deviceFilterOptions} style={{ width: 160 }} />
        </Box>
        <Box className={classes.filterField}>
          <span className="lbl">Filter</span>
          <CustomSelect value={filterPeriod} onChange={handleFilterChange} options={TIME_FILTERS} style={{ width: 140 }} />
        </Box>
        <Box className={classes.filterField}>
          <span className="lbl">Time from</span>
          <CustomInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 120 }} />
          <CustomSelect value={hourFrom} onChange={setHourFrom} options={HOURS} style={{ width: 55 }} />
          <CustomSelect value={minuteFrom} onChange={setMinuteFrom} options={MINUTES} style={{ width: 55 }} />
        </Box>
        <Box className={classes.filterField}>
          <span className="lbl">Time to</span>
          <CustomInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 120 }} />
          <CustomSelect value={hourTo} onChange={setHourTo} options={HOURS} style={{ width: 55 }} />
          <CustomSelect value={minuteTo} onChange={setMinuteTo} options={MINUTES} style={{ width: 55 }} />
        </Box>
      </Box>

      {/* ── Group checkboxes (V1: Drivers / Passengers / Trailers) ── */}
      <Box className={classes.checkboxGroup}>
        <span className="cbx">
          <CustomCheckbox checked={showDrivers} onChange={() => setShowDrivers((p) => !p)} />
          Drivers
        </span>
        <span className="cbx">
          <CustomCheckbox checked={showPassengers} onChange={() => setShowPassengers((p) => !p)} />
          Passengers
        </span>
        <span className="cbx">
          <CustomCheckbox checked={showTrailers} onChange={() => setShowTrailers((p) => !p)} />
          Trailers
        </span>
      </Box>

      {/* ── CustomTable (no add, no edit — delete only) ── */}
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <CustomTable
          rows={filteredData}
          columns={columns}
          loading={loading}
          selected={selected}
          onToggleAll={onToggleAll}
          onToggleRow={onToggleRow}
          onEdit={() => {}}
          onDelete={handleDeleteRow}
          search={search}
          onSearchChange={setSearch}
          onAdd={handleLoad}
          onRefresh={handleLoad}
          onOpenSettings={() => {}}
          onBulkDelete={handleBulkDelete}
          hideEdit
        />
      </DialogContent>
    </Dialog>
  );
};

export default LogbookDialog;
