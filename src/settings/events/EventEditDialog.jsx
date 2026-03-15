import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Typography, Box, Button, TextField,
  FormControl, Select, MenuItem, Tabs, Tab,
  Checkbox, Divider, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  CUSTOM_EVENT_TYPES as EVENT_TYPES,
  TYPES_WITH_TIME_PERIOD,
  TYPES_WITH_SPEED_LIMIT,
  TYPES_WITH_DISTANCE,
  TYPES_WITH_CONDITIONS,
  TYPES_ROUTE_ONLY,
  TYPES_ZONE_ONLY,
} from '../../common/constants/eventTypes';


const CONDITION_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'gr', label: '>' },
  { value: 'lw', label: '<' },
  { value: 'grp', label: '> %' },
  { value: 'lwp', label: '< %' },
];

const WEEK_DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CMD_GATEWAYS = [
  { value: 'gprs', label: 'GPRS' },
  { value: 'sms', label: 'SMS' },
];
const CMD_TYPES = [
  { value: 'ascii', label: 'ASCII' },
  { value: 'hex', label: 'HEX' },
];

const ARROW_COLORS = [
  '#FF0000', '#FF4500', '#FF6600', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00',
  '#7FFF00', '#00FF00', '#00FA9A', '#00FFFF', '#00BFFF', '#1E90FF', '#0000FF',
  '#8A2BE2', '#9400D3', '#FF00FF', '#FF1493', '#C71585', '#000000', '#FFFFFF',
];

// ──────────────────────────── Styles ────────────────────────────

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '920px',
      maxWidth: '90vw',
      height: '660px',
      maxHeight: '90vh',
    },
  },
  dialogTitle: {
    backgroundColor: '#4a90e2',
    color: 'white',
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white', padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
  },
  tabs: {
    backgroundColor: '#f5f5f5',
    minHeight: '31px !important',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTab-root': {
      marginTop: '6px', minHeight: '25px', minWidth: '50px',
      textTransform: 'none', fontSize: '11px', fontWeight: 'normal',
      padding: '4px 10px', color: '#444', borderRadius: 0,
      '&.Mui-selected': { backgroundColor: '#fff', color: '#444' },
    },
    '& .MuiTabs-indicator': { display: 'none' },
  },
  tabPanel: { padding: theme.spacing(1.5), height: '100%', overflow: 'auto' },
  dialogActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: '#f9f9f9',
  },
  actionButton: { fontSize: '12px', textTransform: 'none', padding: '6px 16px' },
  sectionBlock: {
    border: '1px solid #e0e0e0', borderRadius: '4px',
    marginBottom: theme.spacing(1.5), overflow: 'hidden',
  },
  sectionTitle: {
    backgroundColor: '#f5f5f5', padding: '4px 10px',
    fontSize: '11px', fontWeight: 600, color: '#444',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionBody: { padding: theme.spacing(1, 1.5) },
  formRow: {
    display: 'flex', alignItems: 'center',
    marginBottom: '6px', gap: '8px', minHeight: '28px',
  },
  formLabel: { fontSize: '11px', color: '#444', minWidth: '120px', flexShrink: 0 },
  formValue: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px' },
  twoColumnLayout: { display: 'flex', gap: theme.spacing(1.5), height: '100%' },
  columnLeft: { flex: '55%', overflow: 'auto' },
  columnRight: { flex: '45%', overflow: 'auto' },
  conditionGrid: {
    '& .MuiTableCell-root': { fontSize: '11px', padding: '2px 6px', height: '26px' },
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor: '#f5f5f5', fontWeight: 600, fontSize: '10px', color: '#444',
    },
  },
  dayRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', height: '28px' },
  dayLabel: { fontSize: '11px', color: '#444', minWidth: '70px' },
  multiSelectBox: {
    border: '1px solid #ccc', borderRadius: '4px', maxHeight: '100px',
    overflow: 'auto', padding: '4px', '& label': { fontSize: '11px' },
  },
}));

// ──────────────────────────── Helpers ────────────────────────────

const defaultDayTime = () => ({
  dt: false,
  mon: false, mon_from: '00:00', mon_to: '23:59',
  tue: false, tue_from: '00:00', tue_to: '23:59',
  wed: false, wed_from: '00:00', wed_to: '23:59',
  thu: false, thu_from: '00:00', thu_to: '23:59',
  fri: false, fri_from: '00:00', fri_to: '23:59',
  sat: false, sat_from: '00:00', sat_to: '23:59',
  sun: false, sun_from: '00:00', sun_to: '23:59',
});

const parseConditions = (json) => {
  if (!json) return [];
  try {
    const arr = typeof json === 'string' ? JSON.parse(json) : json;
    if (Array.isArray(arr)) return arr.map((c, i) => ({ ...c, _id: i }));
    return [];
  } catch {
    return [];
  }
};

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ height: '100%' }}>
    {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
  </div>
);

const smallInput = { fontSize: '11px', padding: '4px 8px' };
const smallSelect = { fontSize: '11px', '& .MuiSelect-select': { padding: '4px 8px' } };

// ──────────────────────────── Component ────────────────────────────

const EventEditDialog = ({ open, onClose, item, onSave }) => {
  const { classes } = useStyles();
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Data lists loaded from API
  const [devices, setDevices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [zones, setZones] = useState([]);
  const [soundFiles, setSoundFiles] = useState([]);
  const [parameterList, setParameterList] = useState([]);
  const [cmdTemplates, setCmdTemplates] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Conditions state
  const [conditions, setConditions] = useState([]);
  const [newCond, setNewCond] = useState({ src: '', cn: '', val: '' });

  const audioRef = useRef(null);

  // ─── Load supporting data ───
  useEffect(() => {
    if (!open) return;
    const load = async (url) => {
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        return r.ok ? r.json() : [];
      } catch { return []; }
    };

    Promise.all([
      load('/api/devices'),
      load('/api/routes'),
      load('/api/zones'),
      load('/api/notifications/sounds'),
      load('/api/notifications/parameters'),
      load('/api/commands'),
      load('/api/templates'),
    ]).then(([devs, rts, zns, snds, params, cmds, tpls]) => {
      setDevices(Array.isArray(devs) ? devs : []);
      setRoutes(Array.isArray(rts) ? rts : []);
      setZones(Array.isArray(zns) ? zns : []);
      setSoundFiles(Array.isArray(snds) ? snds : [
        'alarm1.mp3', 'alarm2.mp3', 'alarm3.mp3', 'alarm4.mp3',
        'alarm5.mp3', 'alarm6.mp3', 'alarm7.mp3', 'alarm8.mp3',
        'beep1.mp3', 'beep2.mp3', 'beep3.mp3', 'beep4.mp3', 'beep5.mp3',
      ]);
      setParameterList(Array.isArray(params) ? params : ['speed']);
      setCmdTemplates(Array.isArray(cmds) ? cmds : []);
      setTemplates(Array.isArray(tpls) ? tpls : []);
    });
  }, [open]);

  // ─── Parse item on open ───
  useEffect(() => {
    if (!open) return;
    if (item) {
      const notificators = item.notificators ? item.notificators.split(/[, ]+/).filter(Boolean) : [];
      const notifySystem = notificators.includes('web');
      // Parse notificator flags
      let dayTimeObj;
      try { dayTimeObj = item.dayTime ? JSON.parse(item.dayTime) : defaultDayTime(); } catch { dayTimeObj = defaultDayTime(); }
      const weekDays = item.weekDays ? item.weekDays.split(',').map((v) => (v === '1' ? 'true' : 'false')) : ['true', 'true', 'true', 'true', 'true', 'true', 'true'];
      const selectedDevs = item.selectedDevices ? item.selectedDevices.split(',').filter(Boolean) : [];

      setForm({
        ...item,
        _notifySystem: notifySystem,
        _notifyPush: notificators.includes('firebase') || notificators.includes('traccar'),
        _notifyEmail: notificators.includes('mail'),
        _notifySms: notificators.includes('sms'),
        _dayTimeObj: dayTimeObj,
        _weekDaysList: weekDays,
        _selectedDevices: selectedDevs,
        _selectedRoutes: item.routes ? item.routes.split(',').filter(Boolean) : [],
        _selectedZones: item.zones ? item.zones.split(',').filter(Boolean) : [],
      });
      setConditions(parseConditions(item.checkedValue));
    } else {
      setForm({
        type: 'sos',
        description: '',
        enabled: true,
        always: false,
        commandId: 0,
        calendarId: 0,
        attributes: {},
        systemAutohide: false,
        soundEnabled: false,
        soundFile: 'alarm1.mp3',
        arrowEnabled: false,
        arrowColor: '#FF0000',
        listColorEnabled: false,
        listColor: '#FF0000',
        emailAddresses: '',
        smsNumbers: '',
        emailTemplateId: 0,
        smsTemplateId: 0,
        durationFromLastEvent: false,
        durationMinutes: 0,
        weekDays: 'true,true,true,true,true,true,true',
        dayTime: JSON.stringify(defaultDayTime()),
        routeTrigger: 'off',
        zoneTrigger: 'off',
        checkedValue: '',
        selectedDevices: '',
        routes: '',
        zones: '',
        webhookEnabled: false,
        webhookUrl: '',
        cmdSend: false,
        cmdGateway: 'gprs',
        cmdType: 'ascii',
        cmdString: '',
        _notifySystem: true,
        _notifyPush: false,
        _notifyEmail: false,
        _notifySms: false,
        _dayTimeObj: defaultDayTime(),
        _weekDaysList: ['true', 'true', 'true', 'true', 'true', 'true', 'true'],
        _selectedDevices: [],
        _selectedRoutes: [],
        _selectedZones: [],
      });
      setConditions([]);
    }
    setNewCond({ src: '', cn: '', val: '' });
    setTabIndex(0);
    setError(null);
  }, [open, item]);

  // ─── Field helpers ───
  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const type = form.type || 'sos';

  const showTimePeriod = TYPES_WITH_TIME_PERIOD.includes(type);
  const showSpeedLimit = TYPES_WITH_SPEED_LIMIT.includes(type);
  const showDistance = TYPES_WITH_DISTANCE.includes(type);
  const showConditions = TYPES_WITH_CONDITIONS.includes(type);
  const showRouteTrigger = !TYPES_ZONE_ONLY.includes(type);
  const showZoneTrigger = !TYPES_ROUTE_ONLY.includes(type);


  const handleWeekDayToggle = (idx) => {
    setForm((prev) => {
      const days = [...(prev._weekDaysList || [])];
      days[idx] = days[idx] === 'true' ? 'false' : 'true';
      return { ...prev, _weekDaysList: days };
    });
  };

  const handleDayTimeChange = (key, value) => {
    setForm((prev) => {
      const dt = { ...(prev._dayTimeObj || defaultDayTime()), [key]: value };
      return { ...prev, _dayTimeObj: dt };
    });
  };

  const handleDeviceToggle = (devId) => {
    setForm((prev) => {
      const list = [...(prev._selectedDevices || [])];
      const sid = String(devId);
      const idx = list.indexOf(sid);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(sid);
      return { ...prev, _selectedDevices: list };
    });
  };

  const handleRouteToggle = (id) => {
    setForm((prev) => {
      const list = [...(prev._selectedRoutes || [])];
      const sid = String(id);
      const idx = list.indexOf(sid);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(sid);
      return { ...prev, _selectedRoutes: list };
    });
  };

  const handleZoneToggle = (id) => {
    setForm((prev) => {
      const list = [...(prev._selectedZones || [])];
      const sid = String(id);
      const idx = list.indexOf(sid);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(sid);
      return { ...prev, _selectedZones: list };
    });
  };

  const addCondition = () => {
    if (!newCond.src || !newCond.cn || newCond.val === '') return;
    if (conditions.some((c) => c.src === newCond.src)) {
      setError('Same source item already exists');
      return;
    }
    setConditions((prev) => [...prev, { ...newCond, _id: Date.now() }]);
    setNewCond({ src: '', cn: '', val: '' });
  };

  const removeCondition = (id) => setConditions((prev) => prev.filter((c) => c._id !== id));

  const playSound = () => {
    const file = form.soundFile || 'alarm1.mp3';
    if (audioRef.current) { audioRef.current.pause(); }
    audioRef.current = new Audio(`/resources/sounds/${file}`);
    audioRef.current.play().catch(() => {});
  };

  const applyCmdTemplate = (tplId) => {
    const tpl = cmdTemplates.find((c) => String(c.id) === String(tplId));
    if (tpl) {
      setForm((prev) => ({
        ...prev,
        cmdGateway: tpl.textChannel ? 'sms' : 'gprs',
        cmdType: 'ascii',
        cmdString: tpl.attributes?.data || '',
      }));
    }
  };

  // ─── Save ───
  const handleSave = async () => {
    if (!form.description) { setError('Name is required'); return; }

    // Validation based on type
    if (!form.always && (!form._selectedDevices || form._selectedDevices.length === 0)) {
      setError('Select at least one object or enable "All devices"');
      return;
    }
    if (TYPES_WITH_TIME_PERIOD.includes(type)) {
      const tp = parseInt(form.checkedValue, 10);
      if (!tp || tp < 1) { setError('Time period is required (min 1 min)'); return; }
    }
    if (TYPES_WITH_SPEED_LIMIT.includes(type)) {
      const sp = parseFloat(form.checkedValue);
      if (!sp || sp <= 0) { setError('Speed limit is required'); return; }
    }
    if (TYPES_WITH_DISTANCE.includes(type)) {
      const d = parseFloat(form.checkedValue);
      if (!d || d <= 0) { setError('Distance is required'); return; }
    }
    if (TYPES_WITH_CONDITIONS.includes(type) && conditions.length === 0) {
      setError('At least one condition is required'); return;
    }
    if (TYPES_ROUTE_ONLY.includes(type) && (!form._selectedRoutes || form._selectedRoutes.length === 0)) {
      setError('Select at least one route'); return;
    }
    if (TYPES_ZONE_ONLY.includes(type) && (!form._selectedZones || form._selectedZones.length === 0)) {
      setError('Select at least one zone'); return;
    }
    if (form._notifyEmail && !form.emailAddresses) { setError('Email address is required'); return; }
    if (form._notifySms && !form.smsNumbers) { setError('SMS number is required'); return; }

    setSaving(true);
    setError(null);

    const notificatorsList = [];
    if (form._notifySystem) notificatorsList.push('web');
    if (form._notifyPush) notificatorsList.push('firebase');
    if (form._notifyEmail) notificatorsList.push('mail');
    if (form._notifySms) notificatorsList.push('sms');

    // Build checked_value based on type
    let checkedValueFinal = '';
    if (TYPES_WITH_TIME_PERIOD.includes(type) || TYPES_WITH_SPEED_LIMIT.includes(type) || TYPES_WITH_DISTANCE.includes(type)) {
      checkedValueFinal = form.checkedValue || '';
    } else if (TYPES_WITH_CONDITIONS.includes(type)) {
      checkedValueFinal = JSON.stringify(conditions.map(({ src, cn, val }) => ({ src, cn, val })));
    }

    const payload = {
      type: form.type,
      description: form.description || '',
      enabled: form.enabled !== false,
      always: !!form.always,
      notificators: notificatorsList.join(','),
      commandId: form.commandId || 0,
      calendarId: form.calendarId || 0,
      attributes: form.attributes || {},

      // Notification fields
      systemAutohide: !!form.systemAutohide,
      soundEnabled: !!form.soundEnabled,
      soundFile: form.soundFile || null,
      arrowEnabled: !!form.arrowEnabled,
      arrowColor: form.arrowColor || null,
      listColorEnabled: !!form.listColorEnabled,
      listColor: form.listColor || null,
      emailAddresses: form.emailAddresses || null,
      smsNumbers: form.smsNumbers || null,
      emailTemplateId: form.emailTemplateId || 0,
      smsTemplateId: form.smsTemplateId || 0,

      // Time fields
      durationFromLastEvent: !!form.durationFromLastEvent,
      durationMinutes: parseInt(form.durationMinutes, 10) || 0,
      weekDays: (form._weekDaysList || []).map((v) => (v === 'true' ? '1' : '0')).join(','),
      dayTime: JSON.stringify(form._dayTimeObj || defaultDayTime()),

      // Advanced conditions
      routeTrigger: form.routeTrigger || 'off',
      zoneTrigger: form.zoneTrigger || 'off',
      parameterConditions: form.parameterConditions || null,

      // New V1-parity fields
      selectedDevices: form.always ? '' : (form._selectedDevices || []).join(','),
      checkedValue: checkedValueFinal,
      routes: (form._selectedRoutes || []).join(','),
      zones: (form._selectedZones || []).join(','),

      // Webhook
      webhookEnabled: !!form.webhookEnabled,
      webhookUrl: form.webhookUrl || null,

      // Object Control
      cmdSend: !!form.cmdSend,
      cmdGateway: form.cmdGateway || 'gprs',
      cmdType: form.cmdType || 'ascii',
      cmdString: form.cmdString || '',
    };

    if (form.id) payload.id = form.id;

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // ─── Render helpers ───
  const renderFormRow = (label, children, labelWidth) => (
    <Box className={classes.formRow}>
      <Typography className={classes.formLabel} sx={labelWidth ? { minWidth: labelWidth } : {}}>{label}</Typography>
      <Box className={classes.formValue}>{children}</Box>
    </Box>
  );

  const renderMultiSelect = (items, selectedList, onToggle, displayKey = 'name') => (
    <Box className={classes.multiSelectBox}>
      {items.length === 0 ? (
        <Typography variant="caption" sx={{ color: '#999', fontSize: '10px' }}>No items available</Typography>
      ) : items.map((it) => {
        const id = String(it.id);
        const checked = selectedList.includes(id);
        return (
          <Box
            key={id}
            sx={{
              display: 'flex', alignItems: 'center', gap: '4px',
              cursor: 'pointer', px: 0.5, py: 0.1,
              backgroundColor: checked ? '#e3f2fd' : 'transparent',
              '&:hover': { backgroundColor: '#f0f0f0' },
              borderRadius: '2px',
            }}
            onClick={() => onToggle(it.id)}
          >
            <Checkbox size="small" checked={checked} sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 14 } }} />
            <Typography variant="caption" sx={{ fontSize: '10px' }}>{it[displayKey] || id}</Typography>
          </Box>
        );
      })}
    </Box>
  );

  // ────────────────────── TAB: Main ──────────────────────
  const renderMainTab = () => (
    <Box className={classes.twoColumnLayout}>
      {/* LEFT COLUMN: Event Settings */}
      <Box className={classes.columnLeft}>
        <Box className={classes.sectionBlock}>
          <Box className={classes.sectionTitle}>Event</Box>
          <Box className={classes.sectionBody}>
            {renderFormRow('Active',
              <Checkbox size="small" checked={form.enabled !== false} onChange={(e) => setField('enabled', e.target.checked)} sx={{ p: 0 }} />,
            )}
            {renderFormRow('Name',
              <TextField size="small" fullWidth value={form.description || ''} onChange={(e) => setField('description', e.target.value)} placeholder="Event name" inputProps={{ style: smallInput }} />,
            )}
            {renderFormRow('Type',
              <FormControl size="small" fullWidth>
                <Select value={form.type || 'sos'} onChange={(e) => { setField('type', e.target.value); setField('checkedValue', ''); }} sx={smallSelect}>
                  {EVENT_TYPES.map((et) => (
                    <MenuItem key={et.value} value={et.value} sx={{ fontSize: '11px' }}>{et.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>,
            )}
            {renderFormRow('Objects',
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Checkbox size="small" checked={!!form.always} onChange={(e) => setField('always', e.target.checked)} sx={{ p: 0 }} />
                  <Typography variant="caption" sx={{ fontSize: '10px', color: '#666' }}>All devices</Typography>
                </Box>
                {!form.always && renderMultiSelect(devices, form._selectedDevices || [], handleDeviceToggle)}
              </Box>,
            )}

            {/* Route trigger */}
            {showRouteTrigger && (
              <>
                {renderFormRow('Depending on routes',
                  <FormControl size="small" fullWidth>
                    <Select value={form.routeTrigger || 'off'} onChange={(e) => setField('routeTrigger', e.target.value)} sx={smallSelect}>
                      <MenuItem value="off" sx={{ fontSize: '11px' }}>Off</MenuItem>
                      <MenuItem value="in" sx={{ fontSize: '11px' }}>In selected routes</MenuItem>
                      <MenuItem value="out" sx={{ fontSize: '11px' }}>Out of selected routes</MenuItem>
                    </Select>
                  </FormControl>,
                )}
                {form.routeTrigger !== 'off' && renderFormRow('Routes',
                  renderMultiSelect(routes, form._selectedRoutes || [], handleRouteToggle),
                )}
              </>
            )}

            {/* Zone trigger */}
            {showZoneTrigger && (
              <>
                {renderFormRow('Depending on zones',
                  <FormControl size="small" fullWidth>
                    <Select value={form.zoneTrigger || 'off'} onChange={(e) => setField('zoneTrigger', e.target.value)} sx={smallSelect}>
                      <MenuItem value="off" sx={{ fontSize: '11px' }}>Off</MenuItem>
                      <MenuItem value="in" sx={{ fontSize: '11px' }}>In selected zones</MenuItem>
                      <MenuItem value="out" sx={{ fontSize: '11px' }}>Out of selected zones</MenuItem>
                    </Select>
                  </FormControl>,
                )}
                {form.zoneTrigger !== 'off' && renderFormRow('Zones',
                  renderMultiSelect(zones, form._selectedZones || [], handleZoneToggle),
                )}
              </>
            )}

            {/* Type-specific fields */}
            {showTimePeriod && renderFormRow('Time period (min)',
              <TextField size="small" type="number" value={form.checkedValue || ''} onChange={(e) => setField('checkedValue', e.target.value)} inputProps={{ style: { ...smallInput, width: '80px' }, min: 1 }} placeholder={['connno', 'gpsno'].includes(type) ? '60' : '5'} />,
            )}
            {showSpeedLimit && renderFormRow('Speed limit',
              <TextField size="small" type="number" value={form.checkedValue || ''} onChange={(e) => setField('checkedValue', e.target.value)} inputProps={{ style: { ...smallInput, width: '80px' }, min: 1 }} placeholder="60" />,
            )}
            {showDistance && renderFormRow('Distance',
              <TextField size="small" type="number" value={form.checkedValue || ''} onChange={(e) => setField('checkedValue', e.target.value)} inputProps={{ style: { ...smallInput, width: '80px' }, min: 0, step: 0.1 }} placeholder="0.1" />,
            )}
          </Box>
        </Box>
      </Box>

      {/* RIGHT COLUMN: Parameters & Sensors */}
      <Box className={classes.columnRight}>
        <Box className={classes.sectionBlock} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box className={classes.sectionTitle}>Parameters &amp; Sensors</Box>
          <Box className={classes.sectionBody} sx={{ flex: 1, display: 'flex', flexDirection: 'column', opacity: showConditions ? 1 : 0.4, pointerEvents: showConditions ? 'auto' : 'none' }}>
            {/* Conditions table */}
            <TableContainer component={Paper} elevation={0} sx={{ flex: 1, maxHeight: '220px', overflow: 'auto', border: '1px solid #e0e0e0', mb: 1 }}>
              <Table size="small" stickyHeader className={classes.conditionGrid}>
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell align="center" sx={{ width: 40 }}>Cond</TableCell>
                    <TableCell sx={{ width: 70 }}>Value</TableCell>
                    <TableCell align="center" sx={{ width: 30 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conditions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: '#999', py: 2 }}>No conditions</TableCell>
                    </TableRow>
                  ) : (
                    conditions.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>{c.src}</TableCell>
                        <TableCell align="center">{CONDITION_OPERATORS.find((o) => o.value === c.cn)?.label || c.cn}</TableCell>
                        <TableCell>{String(c.val)}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => removeCondition(c._id)} sx={{ p: '2px' }}>
                            <DeleteIcon sx={{ fontSize: 13, color: '#e53935' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add condition row */}
            <Box display="flex" gap={0.5} alignItems="center">
              <FormControl size="small" sx={{ flex: 2 }}>
                <Select
                  value={newCond.src}
                  onChange={(e) => setNewCond((p) => ({ ...p, src: e.target.value }))}
                  displayEmpty
                  sx={{ fontSize: '11px', '& .MuiSelect-select': { padding: '4px 6px' } }}
                >
                  <MenuItem value="" sx={{ fontSize: '11px' }}><em>Source</em></MenuItem>
                  {parameterList.map((p) => (
                    <MenuItem key={p} value={p} sx={{ fontSize: '11px' }}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 55 }}>
                <Select
                  value={newCond.cn}
                  onChange={(e) => setNewCond((p) => ({ ...p, cn: e.target.value }))}
                  displayEmpty
                  sx={{ fontSize: '11px', '& .MuiSelect-select': { padding: '4px 6px' } }}
                >
                  <MenuItem value="" sx={{ fontSize: '11px' }} />
                  {CONDITION_OPERATORS.map((op) => (
                    <MenuItem key={op.value} value={op.value} sx={{ fontSize: '11px' }}>{op.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Value"
                value={newCond.val}
                onChange={(e) => setNewCond((p) => ({ ...p, val: e.target.value }))}
                inputProps={{ style: { fontSize: '11px', padding: '4px 6px' } }}
                sx={{ flex: 1 }}
              />
              <Tooltip title="Add condition">
                <span>
                  <IconButton
                    size="small"
                    onClick={addCondition}
                    disabled={!newCond.src || !newCond.cn || newCond.val === ''}
                    sx={{ p: '4px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '3px' }}
                  >
                    <AddIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // ────────────────────── TAB: Time ──────────────────────
  const renderTimeTab = () => {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dt = form._dayTimeObj || defaultDayTime();
    return (
      <Box>
        <Box className={classes.sectionBlock}>
          <Box className={classes.sectionTitle}>Time</Box>
          <Box className={classes.sectionBody}>
            {/* Duration from last event */}
            <Box className={classes.formRow}>
              <Typography className={classes.formLabel} sx={{ minWidth: '180px' }}>Duration from last event</Typography>
              <Box className={classes.formValue}>
                <Checkbox size="small" checked={!!form.durationFromLastEvent} onChange={(e) => setField('durationFromLastEvent', e.target.checked)} sx={{ p: 0 }} />
                {form.durationFromLastEvent && (
                  <TextField size="small" type="number" value={form.durationMinutes || 0} onChange={(e) => setField('durationMinutes', e.target.value)} inputProps={{ style: { ...smallInput, width: '60px' }, min: 0 }} />
                )}
                {form.durationFromLastEvent && <Typography variant="caption" sx={{ fontSize: '10px', color: '#666' }}>min</Typography>}
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Week days */}
            <Box className={classes.formRow} sx={{ alignItems: 'flex-start' }}>
              <Typography className={classes.formLabel} sx={{ minWidth: '180px' }}>Week days</Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {WEEK_DAYS_SHORT.map((day, idx) => {
                  const active = (form._weekDaysList || [])[idx] === 'true';
                  return (
                    <Box
                      key={day}
                      onClick={() => handleWeekDayToggle(idx)}
                      sx={{
                        textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                        px: 0.8, py: 0.3, minWidth: '32px', borderRadius: '3px',
                        border: '1px solid', borderColor: active ? '#4a90e2' : '#ccc',
                        backgroundColor: active ? '#e3f2fd' : '#fff',
                        fontSize: '10px', fontWeight: active ? 600 : 400,
                        color: active ? '#1565c0' : '#666',
                      }}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Day time */}
            <Box className={classes.formRow}>
              <Typography className={classes.formLabel} sx={{ minWidth: '180px' }}>Day time</Typography>
              <Checkbox size="small" checked={!!dt.dt} onChange={(e) => handleDayTimeChange('dt', e.target.checked)} sx={{ p: 0 }} />
            </Box>

            {dt.dt && dayKeys.map((dk, idx) => (
              <Box key={dk} className={classes.dayRow}>
                <Checkbox
                  size="small"
                  checked={!!dt[dk]}
                  onChange={(e) => handleDayTimeChange(dk, e.target.checked)}
                  sx={{ p: 0 }}
                />
                <Typography className={classes.dayLabel}>{WEEK_DAYS_FULL[idx]}</Typography>
                <TextField
                  type="time"
                  size="small"
                  value={dt[`${dk}_from`] || '00:00'}
                  onChange={(e) => handleDayTimeChange(`${dk}_from`, e.target.value)}
                  disabled={!dt[dk]}
                  inputProps={{ style: { fontSize: '11px', padding: '3px 6px' } }}
                  sx={{ width: '110px' }}
                />
                <Typography variant="caption" sx={{ color: '#999' }}>&mdash;</Typography>
                <TextField
                  type="time"
                  size="small"
                  value={dt[`${dk}_to`] || '23:59'}
                  onChange={(e) => handleDayTimeChange(`${dk}_to`, e.target.value)}
                  disabled={!dt[dk]}
                  inputProps={{ style: { fontSize: '11px', padding: '3px 6px' } }}
                  sx={{ width: '110px' }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  // ────────────────────── TAB: Notifications ──────────────────────
  const renderNotificationsTab = () => (
    <Box>
      <Box className={classes.sectionBlock}>
        <Box className={classes.sectionTitle}>Notifications</Box>
        <Box className={classes.sectionBody}>
          {/* System message */}
          {renderFormRow('System message',
            <Checkbox size="small" checked={!!form._notifySystem} onChange={(e) => setField('_notifySystem', e.target.checked)} sx={{ p: 0 }} />,
          )}
          {renderFormRow('Auto-hide',
            <Checkbox size="small" checked={!!form.systemAutohide} onChange={(e) => setField('systemAutohide', e.target.checked)} sx={{ p: 0 }} />,
          )}
          {renderFormRow('Push notification',
            <Checkbox size="small" checked={!!form._notifyPush} onChange={(e) => setField('_notifyPush', e.target.checked)} sx={{ p: 0 }} />,
          )}

          {/* Sound alert */}
          {renderFormRow('Sound alert',
            <>
              <Checkbox size="small" checked={!!form.soundEnabled} onChange={(e) => setField('soundEnabled', e.target.checked)} sx={{ p: 0 }} />
              {form.soundEnabled && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select value={form.soundFile || 'alarm1.mp3'} onChange={(e) => setField('soundFile', e.target.value)} sx={smallSelect}>
                    {soundFiles.map((f) => (
                      <MenuItem key={f} value={f} sx={{ fontSize: '11px' }}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {form.soundEnabled && (
                <Button size="small" variant="outlined" onClick={playSound} startIcon={<PlayArrowIcon sx={{ fontSize: '12px !important' }} />} sx={{ fontSize: '10px', textTransform: 'none', py: 0, px: 1, minWidth: 0 }}>
                  Play
                </Button>
              )}
            </>,
          )}

          <Divider sx={{ my: 1 }} />

          {/* Email */}
          {renderFormRow('Message to email',
            <>
              <Checkbox size="small" checked={!!form._notifyEmail} onChange={(e) => setField('_notifyEmail', e.target.checked)} sx={{ p: 0 }} />
              {form._notifyEmail && (
                <TextField size="small" placeholder="Email address" value={form.emailAddresses || ''} onChange={(e) => setField('emailAddresses', e.target.value)} inputProps={{ style: smallInput }} sx={{ flex: 1 }} />
              )}
            </>,
          )}

          {/* WhatsApp */}
          {renderFormRow('Send WhatsApp',
            <>
              <Checkbox size="small" checked={!!form._notifySms} onChange={(e) => setField('_notifySms', e.target.checked)} sx={{ p: 0 }} />
              {form._notifySms && (
                <TextField size="small" placeholder="WhatsApp number" value={form.smsNumbers || ''} onChange={(e) => setField('smsNumbers', e.target.value)} inputProps={{ style: smallInput }} sx={{ flex: 1 }} />
              )}
            </>,
          )}

          {/* Templates */}
          {renderFormRow('Email template',
            <FormControl size="small" fullWidth>
              <Select value={form.emailTemplateId || 0} onChange={(e) => setField('emailTemplateId', e.target.value || 0)} sx={smallSelect}>
                <MenuItem value={0} sx={{ fontSize: '11px' }}>&mdash; Default &mdash;</MenuItem>
                {templates.filter((t) => t.name).map((t) => (
                  <MenuItem key={t.id} value={t.id} sx={{ fontSize: '11px' }}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>,
          )}
          {renderFormRow('WhatsApp template',
            <FormControl size="small" fullWidth>
              <Select value={form.smsTemplateId || 0} onChange={(e) => setField('smsTemplateId', e.target.value || 0)} sx={smallSelect}>
                <MenuItem value={0} sx={{ fontSize: '11px' }}>&mdash; Default &mdash;</MenuItem>
                {templates.filter((t) => t.name).map((t) => (
                  <MenuItem key={t.id} value={t.id} sx={{ fontSize: '11px' }}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>,
          )}
        </Box>
      </Box>

      {/* Colors section */}
      <Box className={classes.sectionBlock}>
        <Box className={classes.sectionTitle}>Colors</Box>
        <Box className={classes.sectionBody}>
          {renderFormRow('Object arrow color',
            <>
              <Checkbox size="small" checked={!!form.arrowEnabled} onChange={(e) => setField('arrowEnabled', e.target.checked)} sx={{ p: 0 }} />
              {form.arrowEnabled && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={form.arrowColor || '#FF0000'}
                    onChange={(e) => setField('arrowColor', e.target.value)}
                    sx={smallSelect}
                    renderValue={(v) => (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 14, height: 14, backgroundColor: v, border: '1px solid #ccc', borderRadius: '2px' }} />
                        <Typography sx={{ fontSize: '11px' }}>{v}</Typography>
                      </Box>
                    )}
                  >
                    {ARROW_COLORS.map((c) => (
                      <MenuItem key={c} value={c} sx={{ fontSize: '11px' }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{ width: 14, height: 14, backgroundColor: c, border: '1px solid #ccc', borderRadius: '2px' }} />
                          {c}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>,
          )}
          {renderFormRow('Object list color',
            <>
              <Checkbox size="small" checked={!!form.listColorEnabled} onChange={(e) => setField('listColorEnabled', e.target.checked)} sx={{ p: 0 }} />
              {form.listColorEnabled && (
                <>
                  <input
                    type="color"
                    value={form.listColor || '#FF0000'}
                    onChange={(e) => setField('listColor', e.target.value)}
                    style={{ width: '28px', height: '22px', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer', padding: 0 }}
                  />
                  <TextField size="small" value={form.listColor || '#FF0000'} onChange={(e) => setField('listColor', e.target.value)} inputProps={{ style: { ...smallInput, width: '72px' } }} />
                </>
              )}
            </>,
          )}
        </Box>
      </Box>
    </Box>
  );

  // ────────────────────── TAB: Webhook ──────────────────────
  const renderWebhookTab = () => (
    <Box>
      <Box className={classes.sectionBlock}>
        <Box className={classes.sectionTitle}>Webhook</Box>
        <Box className={classes.sectionBody}>
          {renderFormRow('Send webhook',
            <Checkbox size="small" checked={!!form.webhookEnabled} onChange={(e) => setField('webhookEnabled', e.target.checked)} sx={{ p: 0 }} />,
          )}
          {form.webhookEnabled && renderFormRow('Webhook URL',
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              value={form.webhookUrl || ''}
              onChange={(e) => setField('webhookUrl', e.target.value)}
              placeholder="Example: https://example.com/webhook"
              inputProps={{ style: { fontSize: '11px' } }}
            />,
          )}
        </Box>
      </Box>
    </Box>
  );

  // ────────────────────── TAB: Object Control ──────────────────────
  const renderObjectControlTab = () => (
    <Box>
      <Box className={classes.sectionBlock}>
        <Box className={classes.sectionTitle}>Object Control</Box>
        <Box className={classes.sectionBody}>
          {renderFormRow('Send command',
            <Checkbox size="small" checked={!!form.cmdSend} onChange={(e) => setField('cmdSend', e.target.checked)} sx={{ p: 0 }} />,
          )}
          {form.cmdSend && (
            <>
              {renderFormRow('Template',
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value=""
                    onChange={(e) => applyCmdTemplate(e.target.value)}
                    displayEmpty
                    sx={smallSelect}
                  >
                    <MenuItem value="" sx={{ fontSize: '11px' }}><em>Select template...</em></MenuItem>
                    {cmdTemplates.map((t) => (
                      <MenuItem key={t.id} value={t.id} sx={{ fontSize: '11px' }}>{t.description || `Command #${t.id}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>,
              )}
              {renderFormRow('Gateway',
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select value={form.cmdGateway || 'gprs'} onChange={(e) => setField('cmdGateway', e.target.value)} sx={smallSelect}>
                    {CMD_GATEWAYS.map((g) => (
                      <MenuItem key={g.value} value={g.value} sx={{ fontSize: '11px' }}>{g.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>,
              )}
              {renderFormRow('Type',
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select value={form.cmdType || 'ascii'} onChange={(e) => setField('cmdType', e.target.value)} sx={smallSelect}>
                    {CMD_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value} sx={{ fontSize: '11px' }}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>,
              )}
              {renderFormRow('Command',
                <TextField size="small" fullWidth value={form.cmdString || ''} onChange={(e) => setField('cmdString', e.target.value)} placeholder="Enter command string" inputProps={{ style: smallInput }} />,
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );

  // ────────────────────── RENDER ──────────────────────
  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">{form.id ? 'Edit Event' : 'New Event'}</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} className={classes.tabs} variant="scrollable" scrollButtons="auto">
          <Tab label="Main" />
          <Tab label="Time" />
          <Tab label="Notifications" />
          <Tab label="Webhook" />
          <Tab label="Object Control" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TabPanel value={tabIndex} index={0}>
            <Box className={classes.tabPanel}>{renderMainTab()}</Box>
          </TabPanel>
          <TabPanel value={tabIndex} index={1}>
            <Box className={classes.tabPanel}>{renderTimeTab()}</Box>
          </TabPanel>
          <TabPanel value={tabIndex} index={2}>
            <Box className={classes.tabPanel}>{renderNotificationsTab()}</Box>
          </TabPanel>
          <TabPanel value={tabIndex} index={3}>
            <Box className={classes.tabPanel}>{renderWebhookTab()}</Box>
          </TabPanel>
          <TabPanel value={tabIndex} index={4}>
            <Box className={classes.tabPanel}>{renderObjectControlTab()}</Box>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        {error && (
          <Typography variant="caption" color="error" sx={{ flex: 1, fontSize: '11px' }}>
            {error}
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          startIcon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
          className={classes.actionButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saving || !form.type}
          startIcon={<SaveIcon sx={{ fontSize: '14px !important' }} />}
          className={classes.actionButton}
          sx={{ backgroundColor: '#4a90e2', '&:hover': { backgroundColor: '#357abd' } }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventEditDialog;
