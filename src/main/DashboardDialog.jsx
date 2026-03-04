import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Grid, CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = {
  online: '#4caf50',
  offline: '#f44336',
  unknown: '#ff9800',
};

const EVENT_COLORS = [
  '#2a81d4', '#e91e63', '#9c27b0', '#00bcd4', '#ff9800',
  '#4caf50', '#795548', '#607d8b', '#f44336', '#3f51b5',
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
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
  },
  statDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: '12px',
    color: '#555',
    flex: 1,
  },
  statValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
  },
}));

const DashboardDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // ---- Device status summary ----
  const statusData = useMemo(() => {
    const devList = Object.values(devices);
    let online = 0;
    let offline = 0;
    let unknown = 0;
    devList.forEach((d) => {
      if (d.status === 'online') online += 1;
      else if (d.status === 'offline') offline += 1;
      else unknown += 1;
    });
    return { total: devList.length, online, offline, unknown };
  }, [devices]);

  const pieData = useMemo(() => [
    { name: 'Online', value: statusData.online, color: COLORS.online },
    { name: 'Offline', value: statusData.offline, color: COLORS.offline },
    { name: 'Unknown', value: statusData.unknown, color: COLORS.unknown },
  ].filter((d) => d.value > 0), [statusData]);

  // ---- Motion summary ----
  const motionData = useMemo(() => {
    const posList = Object.values(positions);
    let moving = 0;
    let stopped = 0;
    let idle = 0;
    posList.forEach((p) => {
      if (p.speed > 1) moving += 1;
      else if (p.attributes?.ignition) idle += 1;
      else stopped += 1;
    });
    return [
      { name: 'Moving', value: moving, color: '#4caf50' },
      { name: 'Stopped', value: stopped, color: '#f44336' },
      { name: 'Idle', value: idle, color: '#ff9800' },
    ].filter((d) => d.value > 0);
  }, [positions]);

  // ---- Events (today) ----
  useEffect(() => {
    if (!open) return;
    setLoadingEvents(true);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = todayStart.toISOString();
    const to = now.toISOString();
    fetch(`/api/reports/events?from=${from}&to=${to}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [open]);

  const eventSummary = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const type = e.type || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  // ---- Speed distribution ----
  const speedData = useMemo(() => {
    const posList = Object.values(positions);
    const ranges = [
      { name: '0', min: 0, max: 1, count: 0 },
      { name: '1-30', min: 1, max: 30, count: 0 },
      { name: '31-60', min: 31, max: 60, count: 0 },
      { name: '61-90', min: 61, max: 90, count: 0 },
      { name: '91-120', min: 91, max: 120, count: 0 },
      { name: '>120', min: 121, max: 9999, count: 0 },
    ];
    posList.forEach((p) => {
      const spKmh = (p.speed || 0) * 1.852; // knots to km/h
      const r = ranges.find((rr) => spKmh >= rr.min && spKmh <= rr.max);
      if (r) r.count += 1;
    });
    return ranges.map((r) => ({ name: r.name, count: r.count }));
  }, [positions]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Dashboard</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={2}>
          {/* Device Status Pie */}
          <Grid item xs={12} md={6}>
            <Box className={classes.card}>
              <Typography className={classes.cardTitle}>Device Status</Typography>
              <Box display="flex" alignItems="center">
                <ResponsiveContainer width="60%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box>
                  <Box className={classes.statBox}>
                    <span className={classes.statDot} style={{ backgroundColor: COLORS.online }} />
                    <span className={classes.statLabel}>Online</span>
                    <span className={classes.statValue}>{statusData.online}</span>
                  </Box>
                  <Box className={classes.statBox}>
                    <span className={classes.statDot} style={{ backgroundColor: COLORS.offline }} />
                    <span className={classes.statLabel}>Offline</span>
                    <span className={classes.statValue}>{statusData.offline}</span>
                  </Box>
                  <Box className={classes.statBox}>
                    <span className={classes.statDot} style={{ backgroundColor: COLORS.unknown }} />
                    <span className={classes.statLabel}>Unknown</span>
                    <span className={classes.statValue}>{statusData.unknown}</span>
                  </Box>
                  <Box className={classes.statBox} sx={{ borderTop: '1px solid #eee', pt: 1, mt: 1 }}>
                    <span className={classes.statLabel}><strong>Total</strong></span>
                    <span className={classes.statValue}>{statusData.total}</span>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Motion Status */}
          <Grid item xs={12} md={6}>
            <Box className={classes.card}>
              <Typography className={classes.cardTitle}>Motion Status</Typography>
              <Box display="flex" alignItems="center">
                <ResponsiveContainer width="60%" height={160}>
                  <PieChart>
                    <Pie data={motionData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {motionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box>
                  {motionData.map((d) => (
                    <Box key={d.name} className={classes.statBox}>
                      <span className={classes.statDot} style={{ backgroundColor: d.color }} />
                      <span className={classes.statLabel}>{d.name}</span>
                      <span className={classes.statValue}>{d.value}</span>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Events Today */}
          <Grid item xs={12} md={6}>
            <Box className={classes.card}>
              <Typography className={classes.cardTitle}>
                Events Today
                {loadingEvents && <CircularProgress size={12} sx={{ ml: 1 }} />}
              </Typography>
              {eventSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={eventSummary} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#2a81d4" barSize={14} radius={[0, 3, 3, 0]}>
                      {eventSummary.map((_, i) => (
                        <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {loadingEvents ? 'Loading...' : 'No events today'}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Speed Distribution */}
          <Grid item xs={12} md={6}>
            <Box className={classes.card}>
              <Typography className={classes.cardTitle}>Speed Distribution (km/h)</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={speedData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#2a81d4" barSize={24} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDialog;
