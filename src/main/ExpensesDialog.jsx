import {
 useEffect, useState, useMemo, useCallback 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
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
  formField: {
    marginBottom: '12px',
  },
  totalRow: {
    backgroundColor: '#f0f7ff',
    '& td': { fontWeight: 600, fontSize: '11px' },
  },
}));

const STORAGE_KEY = 'gps_expenses';

const loadExpenses = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveExpenses = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const ExpensesDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [expenses, setExpenses] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    date: '', name: '', deviceId: '', quantity: '', cost: '',
    supplier: '', buyer: '', odometer: '', description: '',
  });

  useEffect(() => {
    if (open) setExpenses(loadExpenses());
  }, [open]);

  const handleNew = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setForm({
      date: today, name: '', deviceId: '', quantity: '', cost: '',
      supplier: '', buyer: '', odometer: '', description: '',
    });
    setEditItem(null);
    setEditMode(true);
  };

  const handleEdit = (item) => {
    setForm({ ...item });
    setEditItem(item);
    setEditMode(true);
  };

  const handleDelete = (id) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    if (editItem) {
      updated = expenses.map((e) => (e.id === editItem.id ? { ...form, id: editItem.id } : e));
    } else {
      updated = [...expenses, { ...form, id: Date.now() }];
    }
    setExpenses(updated);
    saveExpenses(updated);
    setEditMode(false);
  };

  const getDeviceName = useCallback((deviceId) => {
    const d = devices[deviceId];
    return d ? d.name : deviceId || '—';
  }, [devices]);

  const totalCost = useMemo(
    () => expenses.reduce((sum, e) => sum + (parseFloat(e.cost) || 0), 0),
    [expenses],
  );

  const setFormField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '850px', height: '550px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Expenses</Typography>
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
                Add Expense
              </Button>
            </Box>
            <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead}>#</TableCell>
                    <TableCell className={classes.tableHead}>Date</TableCell>
                    <TableCell className={classes.tableHead}>Name</TableCell>
                    <TableCell className={classes.tableHead}>Device</TableCell>
                    <TableCell className={classes.tableHead}>Qty</TableCell>
                    <TableCell className={classes.tableHead}>Cost</TableCell>
                    <TableCell className={classes.tableHead}>Supplier</TableCell>
                    <TableCell className={classes.tableHead}>Buyer</TableCell>
                    <TableCell className={classes.tableHead} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((item, idx) => (
                    <TableRow key={item.id} hover>
                      <TableCell className={classes.tableCell}>{idx + 1}</TableCell>
                      <TableCell className={classes.tableCell}>{item.date}</TableCell>
                      <TableCell className={classes.tableCell}>{item.name}</TableCell>
                      <TableCell className={classes.tableCell}>{getDeviceName(item.deviceId)}</TableCell>
                      <TableCell className={classes.tableCell}>{item.quantity || '—'}</TableCell>
                      <TableCell className={classes.tableCell}>{item.cost ? `$${parseFloat(item.cost).toFixed(2)}` : '—'}</TableCell>
                      <TableCell className={classes.tableCell}>{item.supplier || '—'}</TableCell>
                      <TableCell className={classes.tableCell}>{item.buyer || '—'}</TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        <IconButton size="small" onClick={() => handleEdit(item)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length > 0 && (
                    <TableRow className={classes.totalRow}>
                      <TableCell colSpan={5} align="right">Total:</TableCell>
                      <TableCell>${totalCost.toFixed(2)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  )}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                        No expenses recorded. Click &quot;Add Expense&quot; to create one.
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
              {editItem ? 'Edit Expense' : 'New Expense'}
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                className={classes.formField}
                type="date"
                label="Date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setFormField('date', e.target.value)}
              />
              <TextField
                className={classes.formField}
                label="Expense Name"
                size="small"
                fullWidth
                required
                value={form.name}
                onChange={(e) => setFormField('name', e.target.value)}
              />
            </Box>
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
              <TextField
                className={classes.formField}
                label="Quantity"
                size="small"
                fullWidth
                type="number"
                value={form.quantity}
                onChange={(e) => setFormField('quantity', e.target.value)}
              />
              <TextField
                className={classes.formField}
                label="Cost"
                size="small"
                fullWidth
                type="number"
                value={form.cost}
                onChange={(e) => setFormField('cost', e.target.value)}
              />
              <TextField
                className={classes.formField}
                label="Odometer (km)"
                size="small"
                fullWidth
                type="number"
                value={form.odometer}
                onChange={(e) => setFormField('odometer', e.target.value)}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                className={classes.formField}
                label="Supplier"
                size="small"
                fullWidth
                value={form.supplier}
                onChange={(e) => setFormField('supplier', e.target.value)}
              />
              <TextField
                className={classes.formField}
                label="Buyer"
                size="small"
                fullWidth
                value={form.buyer}
                onChange={(e) => setFormField('buyer', e.target.value)}
              />
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

export default ExpensesDialog;
