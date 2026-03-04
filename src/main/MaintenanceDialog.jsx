import {
 useEffect, useState, useCallback 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  CircularProgress, Chip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const MAINT_TYPES = [
  { value: 'totalDistance', label: 'Distance (km)' },
  { value: 'hours', label: 'Engine Hours' },
  { value: 'date', label: 'Date' },
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

const MaintenanceDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'totalDistance', start: 0, period: 0 });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load maintenance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  const handleNew = () => {
    setForm({ name: '', type: 'totalDistance', start: 0, period: 0 });
    setEditItem(null);
    setEditMode(true);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || '',
      type: item.type || 'totalDistance',
      start: item.start || 0,
      period: item.period || 0,
    });
    setEditItem(item);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      type: form.type,
      start: parseFloat(form.start) || 0,
      period: parseFloat(form.period) || 0,
      attributes: {},
    };

    try {
      if (editItem) {
        await fetch(`/api/maintenance/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editItem.id }),
        });
      } else {
        await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      fetchItems();
      setEditMode(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const getTypeLabel = (type) => {
    const t = MAINT_TYPES.find((mt) => mt.value === type);
    return t ? t.label : type;
  };

  const formatValue = (type, value) => {
    if (!value) return '0';
    if (type === 'totalDistance') return `${(value / 1000).toFixed(1)} km`;
    if (type === 'hours') return `${(value / 3600000).toFixed(1)} h`;
    if (type === 'date') return new Date(value).toLocaleDateString();
    return String(value);
  };

  const setFormField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '750px', height: '500px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Maintenance</Typography>
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
                Add Service
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHead}>#</TableCell>
                      <TableCell className={classes.tableHead}>Service Name</TableCell>
                      <TableCell className={classes.tableHead}>Type</TableCell>
                      <TableCell className={classes.tableHead}>Start</TableCell>
                      <TableCell className={classes.tableHead}>Period</TableCell>
                      <TableCell className={classes.tableHead} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell className={classes.tableCell}>{idx + 1}</TableCell>
                        <TableCell className={classes.tableCell}>{item.name}</TableCell>
                        <TableCell className={classes.tableCell}>
                          <Chip label={getTypeLabel(item.type)} size="small" sx={{ fontSize: '10px', height: '18px' }} />
                        </TableCell>
                        <TableCell className={classes.tableCell}>{formatValue(item.type, item.start)}</TableCell>
                        <TableCell className={classes.tableCell}>{formatValue(item.type, item.period)}</TableCell>
                        <TableCell className={classes.tableCell} align="center">
                          <IconButton size="small" onClick={() => handleEdit(item)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                          No maintenance services configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {editItem ? 'Edit Service' : 'New Service'}
            </Typography>
            <TextField
              className={classes.formField}
              label="Service Name"
              size="small"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setFormField('name', e.target.value)}
            />
            <FormControl size="small" fullWidth className={classes.formField}>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} onChange={(e) => setFormField('type', e.target.value)} label="Type">
                {MAINT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              className={classes.formField}
              label="Start Value"
              size="small"
              fullWidth
              type="number"
              value={form.start}
              onChange={(e) => setFormField('start', e.target.value)}
              helperText={form.type === 'totalDistance' ? 'In meters' : form.type === 'hours' ? 'In milliseconds' : ''}
            />
            <TextField
              className={classes.formField}
              label="Period / Interval"
              size="small"
              fullWidth
              type="number"
              value={form.period}
              onChange={(e) => setFormField('period', e.target.value)}
              helperText={form.type === 'totalDistance' ? 'In meters (e.g. 10000 = 10km)' : form.type === 'hours' ? 'In milliseconds' : ''}
            />
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button variant="outlined" size="small" onClick={() => setEditMode(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" size="small" onClick={handleSave} sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}>Save</Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDialog;
