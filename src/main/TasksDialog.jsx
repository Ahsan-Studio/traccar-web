import {
  useEffect, useState, useMemo, useCallback,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useSelector } from 'react-redux';
import {
  CustomTable, CustomSelect, CustomInput, CustomButton,
} from '../common/components/custom';

/* ─────────── Constants ─────────── */
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

const STATUSES = [
  { value: '0', label: 'New' },
  { value: '1', label: 'In Progress' },
  { value: '2', label: 'Completed' },
  { value: '3', label: 'Failed' },
];

const STATUS_LABELS = { 0: 'New', 1: 'In Progress', 2: 'Completed', 3: 'Failed' };
const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High' };

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
  let from;
  let to;
  switch (filterId) {
    case '1': from = new Date(now - 3600000); to = now; break;
    case '2': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
    case '3': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      from = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
      break;
    }
    case '4': {
      const d2 = new Date(now); d2.setDate(d2.getDate() - 2);
      from = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()); to = now;
      break;
    }
    case '5': {
      const d3 = new Date(now); d3.setDate(d3.getDate() - 3);
      from = new Date(d3.getFullYear(), d3.getMonth(), d3.getDate()); to = now;
      break;
    }
    case '6': {
      const day = now.getDay() || 7;
      from = new Date(now); from.setDate(now.getDate() - day + 1); from.setHours(0, 0, 0, 0);
      to = now;
      break;
    }
    case '7': {
      const day2 = now.getDay() || 7;
      const end = new Date(now); end.setDate(now.getDate() - day2); end.setHours(23, 59, 59);
      const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
      from = start; to = end;
      break;
    }
    case '8': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
    case '9': from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
    default: return null;
  }
  return {
    from: fmtDate(from), to: fmtDate(to),
    hourFrom: pad(from.getHours()), minuteFrom: pad(from.getMinutes()),
    hourTo: pad(to.getHours()), minuteTo: pad(to.getMinutes()),
  };
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) }));

/* ─────────── API helpers (tasks stored via user-templates) ─────────── */
const SUBJECT_TASK = 'task';

const parseTask = (t) => ({
  id: t.id,
  _serverId: t.id,
  name: t.name || '',
  priority: t.description || 'normal',
  status: t.message || '0',
  ...t.attributes,
});

const fetchTasks = async () => {
  try {
    const response = await fetch('/api/user-templates', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      return data.filter((t) => t.subject === SUBJECT_TASK).map(parseTask);
    }
  } catch (e) {
    console.error('Failed to fetch tasks:', e);
  }
  return [];
};

const saveTaskApi = async (task) => {
  const attrs = { ...task };
  delete attrs._serverId;
  delete attrs.id;
  delete attrs.name;
  delete attrs.priority;
  delete attrs.status;
  const payload = {
    name: task.name || 'Untitled Task',
    subject: SUBJECT_TASK,
    description: task.priority || 'normal',
    message: String(task.status ?? '0'),
    attributes: attrs,
  };
  try {
    if (task._serverId) {
      payload.id = task._serverId;
      const response = await fetch(`/api/user-templates/${task._serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) return parseTask(await response.json());
    } else {
      const response = await fetch('/api/user-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) return parseTask(await response.json());
    }
  } catch (e) {
    console.error('Failed to save task:', e);
  }
  return null;
};

const deleteTaskApi = async (serverId) => {
  try {
    await fetch(`/api/user-templates/${serverId}`, { method: 'DELETE' });
  } catch (e) {
    console.error('Failed to delete task:', e);
  }
};

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
  toolbarButtons: {
    display: 'flex',
    gap: '4px',
    padding: '6px 10px',
    borderBottom: '1px solid #e0e0e0',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  /* ── Properties dialog ── */
  propRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    '& .lbl': { width: '30%', fontSize: '12px', color: '#333' },
    '& .val': { width: '70%' },
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

/* ─────────── Time select options (15-min intervals) ─────────── */
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += 15) {
      const v = `${pad(h)}:${pad(m)}`;
      opts.push({ value: v, label: v });
    }
  }
  return opts;
})();

/* ═══════════════════════════════════════════════════════════════
   TaskPropertiesDialog — add / edit a task (V1 parity)
   ═══════════════════════════════════════════════════════════════ */
const emptyTask = () => ({
  name: '',
  deviceId: '',
  priority: 'normal',
  status: '0',
  description: '',
  startAddress: '',
  startFromDate: '',
  startFromTime: '00:00',
  startToDate: '',
  startToTime: '00:00',
  endAddress: '',
  endFromDate: '',
  endFromTime: '00:00',
  endToDate: '',
  endToTime: '00:00',
  dtTask: new Date().toISOString(),
});

const TaskPropertiesDialog = ({
  open, onClose, onSave, task, devices,
}) => {
  const { classes } = useStyles();
  const [form, setForm] = useState(emptyTask());

  useEffect(() => {
    if (open) {
      setForm(task ? { ...emptyTask(), ...task } : emptyTask());
    }
  }, [open, task]);

  const setVal = (key) => (v) => setForm((prev) => ({ ...prev, [key]: v }));
  const setEvent = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => { onSave(form); onClose(); };

  const deviceOptions = useMemo(() => [
    { value: '', label: '— All objects —' },
    ...devices.map((d) => ({ value: String(d.id), label: d.name })),
  ], [devices]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 680, maxHeight: '90vh' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">Task Properties</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, mt: 1 }}>
        {/* ── Task section ── */}
        <Box display="flex">
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Task</div>
            <div className={classes.propRow}>
              <span className="lbl">Name</span>
              <div className="val"><CustomInput value={form.name} onChange={setEvent('name')} placeholder="Task name" style={{ width: '100%' }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Object</span>
              <div className="val"><CustomSelect value={form.deviceId} onChange={setVal('deviceId')} options={deviceOptions} style={{ width: '100%' }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Priority</span>
              <div className="val"><CustomSelect value={form.priority} onChange={setVal('priority')} options={PRIORITIES} style={{ width: '100%' }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Status</span>
              <div className="val"><CustomSelect value={String(form.status)} onChange={setVal('status')} options={STATUSES} style={{ width: '100%' }} /></div>
            </div>
          </Box>
          <Box className={classes.propCol}>
            <div className={classes.propSection}>&nbsp;</div>
            <div className={classes.propRow}>
              <span className="lbl">Description</span>
              <div className="val">
                <textarea
                  value={form.description}
                  onChange={setEvent('description')}
                  style={{
                    width: '100%', height: '105px', fontSize: '12px', fontFamily: 'inherit',
                    border: '1px solid #ccc', padding: '4px', resize: 'vertical',
                  }}
                  maxLength={500}
                />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Start / Destination sections ── */}
        <Box display="flex">
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Start</div>
            <div className={classes.propRow}>
              <span className="lbl">Address</span>
              <div className="val"><CustomInput value={form.startAddress} onChange={setEvent('startAddress')} style={{ width: '100%' }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">From</span>
              <div className="val" style={{ display: 'flex', gap: '4px' }}>
                <CustomInput type="date" value={form.startFromDate} onChange={setEvent('startFromDate')} style={{ flex: 1 }} />
                <CustomSelect value={form.startFromTime} onChange={setVal('startFromTime')} options={TIME_OPTIONS} style={{ width: 80 }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">To</span>
              <div className="val" style={{ display: 'flex', gap: '4px' }}>
                <CustomInput type="date" value={form.startToDate} onChange={setEvent('startToDate')} style={{ flex: 1 }} />
                <CustomSelect value={form.startToTime} onChange={setVal('startToTime')} options={TIME_OPTIONS} style={{ width: 80 }} />
              </div>
            </div>
          </Box>
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Destination</div>
            <div className={classes.propRow}>
              <span className="lbl">Address</span>
              <div className="val"><CustomInput value={form.endAddress} onChange={setEvent('endAddress')} style={{ width: '100%' }} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">From</span>
              <div className="val" style={{ display: 'flex', gap: '4px' }}>
                <CustomInput type="date" value={form.endFromDate} onChange={setEvent('endFromDate')} style={{ flex: 1 }} />
                <CustomSelect value={form.endFromTime} onChange={setVal('endFromTime')} options={TIME_OPTIONS} style={{ width: 80 }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">To</span>
              <div className="val" style={{ display: 'flex', gap: '4px' }}>
                <CustomInput type="date" value={form.endToDate} onChange={setEvent('endToDate')} style={{ flex: 1 }} />
                <CustomSelect value={form.endToTime} onChange={setVal('endToTime')} options={TIME_OPTIONS} style={{ width: 80 }} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Buttons ── */}
        <Box display="flex" justifyContent="center" gap={1} py={1.5} sx={{ borderTop: '1px solid #eee' }}>
          <CustomButton variant="contained" color="primary" icon={<SaveIcon style={{ width: 14, height: 14 }} />} onClick={handleSave} size="small">
            Save
          </CustomButton>
          <CustomButton variant="outlined" icon={<CloseIcon style={{ width: 14, height: 14 }} />} onClick={onClose} size="small">
            Cancel
          </CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main TasksDialog — filter bar + CustomTable (V1 parity)
   ═══════════════════════════════════════════════════════════════ */
const TasksDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  /* Filter state (V1 parity) */
  const [filterDevice, setFilterDevice] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('0');
  const [dateFrom, setDateFrom] = useState(fmtDate(new Date()));
  const [hourFrom, setHourFrom] = useState('00');
  const [minuteFrom, setMinuteFrom] = useState('00');
  const [dateTo, setDateTo] = useState(fmtDate(new Date()));
  const [hourTo, setHourTo] = useState('00');
  const [minuteTo, setMinuteTo] = useState('00');

  /* Properties dialog */
  const [propsOpen, setPropsOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  /* Load tasks on open */
  const loadTasks = useCallback(() => {
    setLoading(true);
    fetchTasks().then((data) => { setTasks(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (open) loadTasks();
  }, [open, loadTasks]);

  /* Filter period change */
  const handleFilterChange = useCallback((val) => {
    setFilterPeriod(val);
    if (val !== '0') {
      const tf = applyTimeFilter(val);
      if (tf) {
        setDateFrom(tf.from);
        setHourFrom(tf.hourFrom);
        setMinuteFrom(tf.minuteFrom);
        setDateTo(tf.to);
        setHourTo(tf.hourTo);
        setMinuteTo(tf.minuteTo);
      }
    }
  }, []);

  /* Device options for filter */
  const deviceFilterOptions = useMemo(() => [
    { value: '', label: 'All objects' },
    ...deviceList.map((d) => ({ value: String(d.id), label: d.name })),
  ], [deviceList]);

  /* Filtered tasks */
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterDevice) {
      result = result.filter((t) => String(t.deviceId) === filterDevice);
    }
    if (filterPeriod !== '0') {
      const fromISO = new Date(`${dateFrom}T${hourFrom}:${minuteFrom}:00`).getTime();
      const toISO = new Date(`${dateTo}T${hourTo}:${minuteTo}:59`).getTime();
      result = result.filter((t) => {
        const dt = t.dtTask ? new Date(t.dtTask).getTime() : 0;
        return dt >= fromISO && dt <= toISO;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => (t.name || '').toLowerCase().includes(q)
        || (PRIORITY_LABELS[t.priority] || '').toLowerCase().includes(q)
        || (STATUS_LABELS[t.status] || '').toLowerCase().includes(q));
    }
    return result;
  }, [tasks, filterDevice, filterPeriod, dateFrom, hourFrom, minuteFrom, dateTo, hourTo, minuteTo, search]);

  /* Get device name helper */
  const getDeviceName = useCallback((deviceId) => {
    if (!deviceId) return '';
    const d = devices[deviceId];
    return d ? d.name : '';
  }, [devices]);

  /* CustomTable columns (V1: Time, Name, Object, Start, Destination, Priority, Status) */
  const columns = useMemo(() => [
    { key: 'dtTask', label: 'Time', render: (row) => fmtDateTime(row.dtTask) },
    { key: 'name', label: 'Name' },
    { key: 'deviceId', label: 'Object', render: (row) => getDeviceName(row.deviceId) },
    { key: 'startAddress', label: 'Start', render: (row) => row.startAddress || '' },
    { key: 'endAddress', label: 'Destination', render: (row) => row.endAddress || '' },
    { key: 'priority', label: 'Priority', render: (row) => PRIORITY_LABELS[row.priority] || row.priority },
    { key: 'status', label: 'Status', render: (row) => STATUS_LABELS[row.status] || row.status },
  ], [getDeviceName]);

  /* CRUD */
  const handleSaveTask = useCallback(async (taskData) => {
    const saved = await saveTaskApi(taskData);
    if (saved) {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t._serverId === saved._serverId);
        return idx >= 0 ? prev.map((t, i) => (i === idx ? saved : t)) : [...prev, saved];
      });
    }
  }, []);

  const handleDeleteTask = useCallback(async (row) => {
    if (row?._serverId) await deleteTaskApi(row._serverId);
    setTasks((prev) => prev.filter((t) => t.id !== row.id));
    setSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  const handleBulkDelete = useCallback(async (ids) => {
    await Promise.all(ids.map((id) => {
      const t = tasks.find((task) => task.id === id);
      return t?._serverId ? deleteTaskApi(t._serverId) : Promise.resolve();
    }));
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelected([]);
  }, [tasks]);

  const handleDeleteAll = useCallback(async () => {
    if (!window.confirm('Delete all tasks? This cannot be undone.')) return;
    await Promise.all(tasks.map((t) => (t._serverId ? deleteTaskApi(t._serverId) : Promise.resolve())));
    setTasks([]);
    setSelected([]);
  }, [tasks]);

  const handleExportCSV = useCallback(() => {
    const header = 'Time,Name,Object,Start,Destination,Priority,Status';
    const rows = filteredTasks.map((t) => [
      fmtDateTime(t.dtTask),
      t.name,
      getDeviceName(t.deviceId),
      t.startAddress || '',
      t.endAddress || '',
      PRIORITY_LABELS[t.priority] || t.priority,
      STATUS_LABELS[t.status] || t.status,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${fmtDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredTasks, getDeviceName]);

  /* Toggle helpers */
  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === filteredTasks.length ? [] : filteredTasks.map((t) => t.id)));
  }, [filteredTasks]);

  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const openAdd = useCallback(() => { setEditTask(null); setPropsOpen(true); }, []);
  const openEdit = useCallback((row) => { setEditTask(row); setPropsOpen(true); }, []);

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 600 } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2" component="span">Tasks</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        {/* ── Toolbar: Delete all, Export to CSV, Show ── */}
        <Box className={classes.toolbarButtons}>
          <CustomButton variant="outlined" onClick={handleDeleteAll} size="small">Delete all</CustomButton>
          <CustomButton variant="outlined" onClick={handleExportCSV} size="small">Export to CSV</CustomButton>
          <CustomButton variant="outlined" onClick={loadTasks} size="small">Show</CustomButton>
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

        {/* ── CustomTable ── */}
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <CustomTable
            rows={filteredTasks}
            columns={columns}
            loading={loading}
            selected={selected}
            onToggleAll={onToggleAll}
            onToggleRow={onToggleRow}
            onEdit={openEdit}
            onDelete={handleDeleteTask}
            search={search}
            onSearchChange={setSearch}
            onAdd={openAdd}
            onRefresh={loadTasks}
            onOpenSettings={() => {}}
            onBulkDelete={handleBulkDelete}
          />
        </DialogContent>
      </Dialog>

      {/* ── Task Properties (Add/Edit) ── */}
      <TaskPropertiesDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        onSave={handleSaveTask}
        task={editTask}
        devices={deviceList}
      />
    </>
  );
};

export default TasksDialog;
