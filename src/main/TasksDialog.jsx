import {
 useEffect, useState, useMemo, useCallback 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  Chip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from 'react-redux';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];

const PRIORITY_COLORS = {
  Low: '#4caf50',
  Medium: '#ff9800',
  High: '#f44336',
  Urgent: '#9c27b0',
};

const STATUS_COLORS = {
  New: '#2196f3',
  'In Progress': '#ff9800',
  Completed: '#4caf50',
  Cancelled: '#9e9e9e',
};

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
  formField: {
    marginBottom: '12px',
  },
}));

const STORAGE_KEY = 'gps_tasks';

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveTasks = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const TasksDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [tasks, setTasks] = useState([]);
  const [editMode, setEditMode] = useState(false); // false = list, true = form
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({
    name: '', deviceId: '', priority: 'Medium', status: 'New',
    description: '', startAddress: '', endAddress: '',
    startDate: '', endDate: '',
  });

  useEffect(() => {
    if (open) setTasks(loadTasks());
  }, [open]);

  const handleNew = () => {
    setForm({
      name: '', deviceId: '', priority: 'Medium', status: 'New',
      description: '', startAddress: '', endAddress: '',
      startDate: '', endDate: '',
    });
    setEditTask(null);
    setEditMode(true);
  };

  const handleEdit = (task) => {
    setForm({ ...task });
    setEditTask(task);
    setEditMode(true);
  };

  const handleDelete = (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasks(updated);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    if (editTask) {
      updated = tasks.map((t) => (t.id === editTask.id ? { ...form, id: editTask.id, updatedAt: new Date().toISOString() } : t));
    } else {
      const newTask = {
        ...form,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [...tasks, newTask];
    }
    setTasks(updated);
    saveTasks(updated);
    setEditMode(false);
  };

  const handleCancel = () => setEditMode(false);

  const setFormField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const getDeviceName = useCallback((deviceId) => {
    const d = devices[deviceId];
    return d ? d.name : deviceId || '—';
  }, [devices]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '800px', height: '550px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Tasks</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!editMode ? (
          <>
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleNew}
                sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}
              >
                New Task
              </Button>
            </Box>
            <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead}>#</TableCell>
                    <TableCell className={classes.tableHead}>Name</TableCell>
                    <TableCell className={classes.tableHead}>Device</TableCell>
                    <TableCell className={classes.tableHead}>Priority</TableCell>
                    <TableCell className={classes.tableHead}>Status</TableCell>
                    <TableCell className={classes.tableHead}>Start Date</TableCell>
                    <TableCell className={classes.tableHead}>End Date</TableCell>
                    <TableCell className={classes.tableHead} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task, idx) => (
                    <TableRow key={task.id} hover>
                      <TableCell className={classes.tableCell}>{idx + 1}</TableCell>
                      <TableCell className={classes.tableCell}>{task.name}</TableCell>
                      <TableCell className={classes.tableCell}>{getDeviceName(task.deviceId)}</TableCell>
                      <TableCell className={classes.tableCell}>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{ fontSize: '10px', height: '18px', backgroundColor: PRIORITY_COLORS[task.priority], color: '#fff' }}
                        />
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Chip
                          label={task.status}
                          size="small"
                          sx={{ fontSize: '10px', height: '18px', backgroundColor: STATUS_COLORS[task.status], color: '#fff' }}
                        />
                      </TableCell>
                      <TableCell className={classes.tableCell}>{task.startDate || '—'}</TableCell>
                      <TableCell className={classes.tableCell}>{task.endDate || '—'}</TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        <IconButton size="small" onClick={() => handleEdit(task)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(task.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                        No tasks. Click &quot;New Task&quot; to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {editTask ? 'Edit Task' : 'New Task'}
            </Typography>
            <TextField
              className={classes.formField}
              label="Task Name"
              size="small"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setFormField('name', e.target.value)}
            />
            <FormControl size="small" fullWidth className={classes.formField}>
              <InputLabel>Device</InputLabel>
              <Select
                value={form.deviceId}
                onChange={(e) => setFormField('deviceId', e.target.value)}
                label="Device"
              >
                <MenuItem value="">— None —</MenuItem>
                {deviceList.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <FormControl size="small" fullWidth className={classes.formField}>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} onChange={(e) => setFormField('priority', e.target.value)} label="Priority">
                  {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth className={classes.formField}>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} onChange={(e) => setFormField('status', e.target.value)} label="Status">
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField
              className={classes.formField}
              label="Description"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setFormField('description', e.target.value)}
            />
            <Box display="flex" gap={2}>
              <TextField
                className={classes.formField}
                type="datetime-local"
                label="Start Date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setFormField('startDate', e.target.value)}
              />
              <TextField
                className={classes.formField}
                type="datetime-local"
                label="End Date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setFormField('endDate', e.target.value)}
              />
            </Box>
            <TextField
              className={classes.formField}
              label="Start Address"
              size="small"
              fullWidth
              value={form.startAddress}
              onChange={(e) => setFormField('startAddress', e.target.value)}
            />
            <TextField
              className={classes.formField}
              label="End Address"
              size="small"
              fullWidth
              value={form.endAddress}
              onChange={(e) => setFormField('endAddress', e.target.value)}
            />
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button variant="outlined" size="small" onClick={handleCancel} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TasksDialog;
