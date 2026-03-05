import {
  useEffect, useState, useMemo, useCallback, useRef,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Menu, MenuItem, CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSelector } from 'react-redux';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

/* ───── V1 flot default palette ───── */
const V1 = {
  noData: '#EDC240',
  offline: '#AFD8F8',
  stopped: '#CB4B4B',
  moving: '#4DA74D',
  idle: '#9440ED',
};

const TASK_COLORS = {
  New: '#AFD8F8',
  'In Progress': '#EDC240',
  Completed: '#4DA74D',
  Failed: '#CB4B4B',
};

const MAINTENANCE_COLORS = { Valid: '#4DA74D', Expired: '#CB4B4B' };

const EVENT_PALETTE = [
  '#EDC240', '#AFD8F8', '#CB4B4B', '#4DA74D', '#9440ED',
  '#2A81D4', '#E91E63', '#00BCD4', '#FF5722', '#795548',
];

const BAR_PALETTE = [
  '#EDC240', '#AFD8F8', '#CB4B4B', '#4DA74D', '#9440ED',
  '#2A81D4', '#E91E63', '#00BCD4', '#FF5722', '#795548',
];

const REFRESH_INTERVAL = 60000; // 60 s

/* ───── styles ───── */
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
  content: {
    padding: '8px !important',
    backgroundColor: '#f5f5f5',
    overflow: 'auto',
  },
  row: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    '&:last-child': { marginBottom: 0 },
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    height: '30px',
    lineHeight: '30px',
    backgroundColor: '#e5e5e5',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '8px',
    paddingRight: '4px',
  },
  cardHeaderTitle: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 600,
    color: '#333',
    cursor: 'default',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  gearIcon: {
    padding: '2px',
    color: '#777',
    '&:hover': { color: '#333' },
  },
  cardBody: {
    flex: 1,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '180px',
  },
  noData: {
    color: '#aaa',
    fontSize: '14px',
    textAlign: 'center',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#333',
    padding: '2px 0',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
  },
  legendValue: {
    fontWeight: 600,
    minWidth: '20px',
    textAlign: 'right',
  },
}));

/* ───── helpers ───── */
const periodRanges = (key) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'today') return { from: todayStart.toISOString(), to: now.toISOString() };
  if (key === 'this_week') {
    const day = todayStart.getDay();
    const monday = new Date(todayStart);
    monday.setDate(todayStart.getDate() - ((day + 6) % 7));
    return { from: monday.toISOString(), to: now.toISOString() };
  }
  // this_month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: monthStart.toISOString(), to: now.toISOString() };
};

const PERIOD_LABELS = { today: 'Today', this_week: 'This Week', this_month: 'This Month' };

const formatEventType = (t) => t
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, (c) => c.toUpperCase())
  .replace('Device', 'Dev.')
  .trim();

/* ───── custom donut label ───── */
const renderDonutLabel = (showPercent) => ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value === 0) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {showPercent ? `${(percent * 100).toFixed(0)}%` : value}
    </text>
  );
};

/* ═════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════ */
const DashboardDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);

  /* ── State ── */
  const [objectsShowPercent, setObjectsShowPercent] = useState(false);
  const [eventsPeriod, setEventsPeriod] = useState('today');
  const [tasksPeriod, setTasksPeriod] = useState('today');

  const [eventsData, setEventsData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [odometerData, setOdometerData] = useState([]);
  const [mileageData, setMileageData] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [loadingOdometer, setLoadingOdometer] = useState(false);
  const [loadingMileage, setLoadingMileage] = useState(false);

  /* gear-menu anchors */
  const [objectsMenuAnchor, setObjectsMenuAnchor] = useState(null);
  const [eventsMenuAnchor, setEventsMenuAnchor] = useState(null);
  const [tasksMenuAnchor, setTasksMenuAnchor] = useState(null);

  const refreshTimer = useRef(null);

  /* ─────────── 1. Objects card (client-side) ─────────── */
  const objectsPieData = useMemo(() => {
    const devList = Object.values(devices);
    const posList = Object.values(positions);

    // Build a device → position map by deviceId
    const posMap = {};
    posList.forEach((p) => { posMap[p.deviceId] = p; });

    let noData = 0;
    let offline = 0;
    let stopped = 0;
    let moving = 0;
    let idle = 0;

    devList.forEach((d) => {
      const pos = posMap[d.id];
      if (!pos) { noData += 1; return; }
      if (d.status !== 'online') { offline += 1; return; }
      const speed = pos.speed || 0;
      if (speed > 1) { moving += 1; }
      else if (pos.attributes?.ignition) { idle += 1; }
      else { stopped += 1; }
    });

    return [
      { name: 'No data', value: noData, color: V1.noData },
      { name: 'Offline', value: offline, color: V1.offline },
      { name: 'Stopped', value: stopped, color: V1.stopped },
      { name: 'Moving', value: moving, color: V1.moving },
      { name: 'Idle', value: idle, color: V1.idle },
    ];
  }, [devices, positions]);

  /* ─────────── 2. Events card (API) ─────────── */
  const fetchEvents = useCallback(async (period) => {
    setLoadingEvents(true);
    try {
      const { from, to } = periodRanges(period);
      const deviceIds = Object.keys(devices);
      if (deviceIds.length === 0) { setEventsData([]); return; }

      const params = new URLSearchParams();
      params.append('from', from);
      params.append('to', to);
      deviceIds.forEach((id) => params.append('deviceId', id));

      const res = await fetch(`/api/reports/events?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // group by type
      const counts = {};
      data.forEach((e) => {
        const type = e.type || 'unknown';
        counts[type] = (counts[type] || 0) + 1;
      });
      const arr = Object.entries(counts)
        .map(([type, count], i) => ({
          name: formatEventType(type),
          value: count,
          color: EVENT_PALETTE[i % EVENT_PALETTE.length],
        }))
        .sort((a, b) => b.value - a.value);
      setEventsData(arr);
    } catch {
      setEventsData([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [devices]);

  /* ─────────── 3. Maintenance card (API) ─────────── */
  const fetchMaintenance = useCallback(async () => {
    setLoadingMaintenance(true);
    try {
      const res = await fetch('/api/services', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      const data = await res.json();

      let valid = 0;
      let expired = 0;
      data.forEach((s) => {
        const st = (s.status || '').toLowerCase();
        if (st.includes('expired') || st.includes('overdue')) expired += 1;
        else valid += 1;
      });

      setMaintenanceData([
        { name: 'Valid', value: valid, color: MAINTENANCE_COLORS.Valid },
        { name: 'Expired', value: expired, color: MAINTENANCE_COLORS.Expired },
      ]);
    } catch {
      setMaintenanceData([]);
    } finally {
      setLoadingMaintenance(false);
    }
  }, []);

  /* ─────────── 4. Tasks card (localStorage) ─────────── */
  const fetchTasks = useCallback((/* period */) => {
    try {
      const raw = localStorage.getItem('gps_tasks');
      const tasks = raw ? JSON.parse(raw) : [];

      const counts = { New: 0, 'In Progress': 0, Completed: 0, Failed: 0 };
      tasks.forEach((t) => {
        const st = String(t.status || t.state || '');
        if (st === '0' || st.toLowerCase() === 'new') counts.New += 1;
        else if (st === '1' || st.toLowerCase().includes('progress')) counts['In Progress'] += 1;
        else if (st === '2' || st.toLowerCase().includes('complet')) counts.Completed += 1;
        else counts.Failed += 1;
      });

      setTasksData(
        Object.entries(counts).map(([name, value]) => ({ name, value, color: TASK_COLORS[name] })),
      );
    } catch {
      setTasksData([]);
    }
  }, []);

  /* ─────────── 5. Odometer Top 10 (client-side) ─────────── */
  const fetchOdometer = useCallback(() => {
    setLoadingOdometer(true);
    try {
      const devList = Object.values(devices);
      const posList = Object.values(positions);
      const posMap = {};
      posList.forEach((p) => { posMap[p.deviceId] = p; });

      const rows = devList.map((d) => {
        const pos = posMap[d.id];
        const odo = pos?.attributes?.odometer || pos?.attributes?.totalDistance || 0;
        return { name: d.name, odometer: Math.round(odo / 1000) }; // metres → km
      })
        .filter((r) => r.odometer > 0)
        .sort((a, b) => b.odometer - a.odometer)
        .slice(0, 10);

      setOdometerData(rows);
    } catch {
      setOdometerData([]);
    } finally {
      setLoadingOdometer(false);
    }
  }, [devices, positions]);

  /* ─────────── 6. Mileage 5-day (API summary) ─────────── */
  const fetchMileage = useCallback(async () => {
    setLoadingMileage(true);
    try {
      const deviceIds = Object.keys(devices);
      if (deviceIds.length === 0) { setMileageData([]); return; }

      const now = new Date();
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const from = new Date(to);
      from.setDate(from.getDate() - 5);

      const params = new URLSearchParams();
      params.append('from', from.toISOString());
      params.append('to', to.toISOString());
      params.append('daily', 'true');
      deviceIds.forEach((id) => params.append('deviceId', id));

      const res = await fetch(`/api/reports/summary?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // aggregate per day
      const dayMap = {};
      data.forEach((row) => {
        let dayKey;
        if (row.startTime) {
          dayKey = row.startTime.substring(0, 10); // "YYYY-MM-DD"
        } else {
          return;
        }
        dayMap[dayKey] = (dayMap[dayKey] || 0) + (row.distance || 0);
      });

      // Build array for last 5 days
      const days = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(to);
        d.setDate(d.getDate() - 1 - i);
        const key = d.toISOString().substring(0, 10);
        const label = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ name: label, km: Math.round((dayMap[key] || 0) / 1000) });
      }

      setMileageData(days);
    } catch {
      setMileageData([]);
    } finally {
      setLoadingMileage(false);
    }
  }, [devices]);

  /* ─────────── initial load + auto refresh ─────────── */
  const loadAll = useCallback(() => {
    fetchEvents(eventsPeriod);
    fetchMaintenance();
    fetchTasks(tasksPeriod);
    fetchOdometer();
    fetchMileage();
  }, [eventsPeriod, tasksPeriod, fetchEvents, fetchMaintenance, fetchTasks, fetchOdometer, fetchMileage]);

  useEffect(() => {
    if (!open) {
      clearInterval(refreshTimer.current);
      return;
    }
    loadAll();
    refreshTimer.current = setInterval(loadAll, REFRESH_INTERVAL);
    return () => clearInterval(refreshTimer.current);
  }, [open, loadAll]);

  /* When period changes, re-fetch just that section */
  useEffect(() => { if (open) fetchEvents(eventsPeriod); }, [eventsPeriod, open, fetchEvents]);
  useEffect(() => { if (open) fetchTasks(tasksPeriod); }, [tasksPeriod, open, fetchTasks]);

  /* ═══════════ RENDER ═══════════ */
  const totalObjects = objectsPieData.reduce((s, d) => s + d.value, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Dashboard</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.content}>
        {/* ═══ ROW 1: Objects · Events · Maintenance · Tasks ═══ */}
        <Box className={classes.row} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

          {/* ── Card 1: Objects ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Objects</Typography>
              <IconButton size="small" className={classes.gearIcon} onClick={(e) => setObjectsMenuAnchor(e.currentTarget)}>
                <SettingsIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <Menu anchorEl={objectsMenuAnchor} open={Boolean(objectsMenuAnchor)} onClose={() => setObjectsMenuAnchor(null)}>
                <MenuItem dense onClick={() => { setObjectsShowPercent(false); setObjectsMenuAnchor(null); }}>Numbers</MenuItem>
                <MenuItem dense onClick={() => { setObjectsShowPercent(true); setObjectsMenuAnchor(null); }}>Percentage</MenuItem>
              </Menu>
            </Box>
            <Box className={classes.cardBody}>
              {totalObjects === 0 ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={objectsPieData.filter((d) => d.value > 0)}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        label={renderDonutLabel(objectsShowPercent)}
                        labelLine={false}
                        isAnimationActive={false}
                      >
                        {objectsPieData.filter((d) => d.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    {objectsPieData.map((d) => (
                      <Box key={d.name} className={classes.legendRow}>
                        <span className={classes.legendDot} style={{ backgroundColor: d.color }} />
                        <span className={classes.legendLabel}>{d.name}</span>
                        <span className={classes.legendValue}>
                          {objectsShowPercent
                            ? `${totalObjects ? ((d.value / totalObjects) * 100).toFixed(0) : 0}%`
                            : d.value}
                        </span>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* ── Card 2: Events ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Events</Typography>
              <IconButton size="small" className={classes.gearIcon} onClick={(e) => setEventsMenuAnchor(e.currentTarget)}>
                <SettingsIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <Menu anchorEl={eventsMenuAnchor} open={Boolean(eventsMenuAnchor)} onClose={() => setEventsMenuAnchor(null)}>
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <MenuItem key={key} dense selected={eventsPeriod === key} onClick={() => { setEventsPeriod(key); setEventsMenuAnchor(null); }}>
                    {label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Box className={classes.cardBody}>
              {loadingEvents ? (
                <CircularProgress size={24} />
              ) : eventsData.length === 0 ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={eventsData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        label={renderDonutLabel(false)}
                        labelLine={false}
                        isAnimationActive={false}
                      >
                        {eventsData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ width: '100%', mt: 1, maxHeight: 80, overflowY: 'auto' }}>
                    {eventsData.map((d) => (
                      <Box key={d.name} className={classes.legendRow}>
                        <span className={classes.legendDot} style={{ backgroundColor: d.color }} />
                        <span className={classes.legendLabel}>{d.name}</span>
                        <span className={classes.legendValue}>{d.value}</span>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* ── Card 3: Maintenance ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Maintenance</Typography>
            </Box>
            <Box className={classes.cardBody}>
              {loadingMaintenance ? (
                <CircularProgress size={24} />
              ) : maintenanceData.length === 0 || maintenanceData.every((d) => d.value === 0) ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={maintenanceData.filter((d) => d.value > 0)}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        label={renderDonutLabel(false)}
                        labelLine={false}
                        isAnimationActive={false}
                      >
                        {maintenanceData.filter((d) => d.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    {maintenanceData.map((d) => (
                      <Box key={d.name} className={classes.legendRow}>
                        <span className={classes.legendDot} style={{ backgroundColor: d.color }} />
                        <span className={classes.legendLabel}>{d.name}</span>
                        <span className={classes.legendValue}>{d.value}</span>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* ── Card 4: Tasks ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Tasks</Typography>
              <IconButton size="small" className={classes.gearIcon} onClick={(e) => setTasksMenuAnchor(e.currentTarget)}>
                <SettingsIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <Menu anchorEl={tasksMenuAnchor} open={Boolean(tasksMenuAnchor)} onClose={() => setTasksMenuAnchor(null)}>
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <MenuItem key={key} dense selected={tasksPeriod === key} onClick={() => { setTasksPeriod(key); setTasksMenuAnchor(null); }}>
                    {label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Box className={classes.cardBody}>
              {tasksData.length === 0 || tasksData.every((d) => d.value === 0) ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={tasksData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" barSize={20} radius={[3, 3, 0, 0]}>
                      {tasksData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Box>

        {/* ═══ ROW 2: Odometer Top 10 (75%) · Mileage 5-day (25%) ═══ */}
        <Box className={classes.row} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

          {/* ── Card 5: Odometer Top 10 ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '3 1 75%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Odometer Top 10 (km)</Typography>
            </Box>
            <Box className={classes.cardBody} sx={{ minHeight: 220 }}>
              {loadingOdometer ? (
                <CircularProgress size={24} />
              ) : odometerData.length === 0 ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={odometerData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <XAxis dataKey="name" tick={false} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip formatter={(val) => [`${val} km`, 'Odometer']} />
                        <Bar dataKey="odometer" barSize={22} radius={[3, 3, 0, 0]}>
                          {odometerData.map((_, i) => (
                            <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ minWidth: 120, maxHeight: 200, overflowY: 'auto', pt: '5px' }}>
                    {odometerData.map((d, i) => (
                      <Box key={d.name} className={classes.legendRow}>
                        <span className={classes.legendDot} style={{ backgroundColor: BAR_PALETTE[i % BAR_PALETTE.length] }} />
                        <span className={classes.legendLabel} title={d.name}>
                          {d.name.length > 14 ? `${d.name.substring(0, 14)}…` : d.name}
                        </span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Card 6: Mileage 5-day ── */}
          <Box className={classes.card} sx={{ flex: { xs: '1 1 100%', md: '1 1 25%' } }}>
            <Box className={classes.cardHeader}>
              <Typography className={classes.cardHeaderTitle}>Mileage (km)</Typography>
            </Box>
            <Box className={classes.cardBody}>
              {loadingMileage ? (
                <CircularProgress size={24} />
              ) : mileageData.length === 0 || mileageData.every((d) => d.km === 0) ? (
                <Typography className={classes.noData}>No data</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mileageData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(val) => [`${val} km`, 'Mileage']} />
                    <Bar dataKey="km" fill="#4DA74D" barSize={20} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDialog;
