import {
  useEffect, useState, useCallback, useMemo,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import {
  CustomTable, CustomInput, CustomButton, CustomCheckbox, CustomMultiSelect,
} from '../common/components/custom';

const TYPE_LABEL = { totalDistance: 'Odometer (km)', hours: 'Engine Hours', date: 'Days' };

const formatValue = (type, value) => {
  if (!value && value !== 0) return '—';
  if (type === 'totalDistance') return `${(value / 1000).toFixed(1)} km`;
  if (type === 'hours') return `${(value / 3600000).toFixed(1)} h`;
  if (type === 'date') return `${value} days`;
  return String(value);
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
  /* ── Service Properties dialog ── */
  propDialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  propSection: {
    margin: '8px 0 4px 0',
    padding: '4px 8px 4px 0px',
    backgroundColor: 'transparent',
    color: '#2a81d4',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '3px',
  },
  propRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    '& .propLabel': {
      fontSize: '11px',
      color: '#444',
      width: 130,
      flexShrink: 0,
      textAlign: 'right',
    },
  },
  propCols: {
    display: 'flex',
    gap: '24px',
    '& .col': { flex: 1 },
  },
  propCheckRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
    '& .propLabel': {
      fontSize: '11px',
      color: '#444',
      width: 110,
      flexShrink: 0,
    },
  },
  propFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '6px',
    padding: '8px 14px',
    borderTop: '1px solid #e0e0e0',
  },
}));

/* ═══════════════════════════════════════════════════════════════
   ServicePropertiesDialog — V1 parity (two-section form)
   ═══════════════════════════════════════════════════════════════ */
const ServicePropertiesDialog = ({
  open, onClose, onSave, editItem, devices,
}) => {
  const { classes } = useStyles();
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [form, setForm] = useState({
    name: '',
    type: 'totalDistance',
    start: 0,
    period: 0,
    enableOdo: false,
    odoInterval: '',
    enableEH: false,
    ehInterval: '',
    enableDays: false,
    daysInterval: '',
    lastOdo: '',
    lastEH: '',
    lastDays: '',
    dataList: false,
    popup: false,
    /* trigger */
    trigOdo: false,
    trigOdoVal: '',
    trigEH: false,
    trigEHVal: '',
    trigDays: false,
    trigDaysVal: '',
    updateLastService: false,
    selectedDevices: [],
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        const attrs = editItem.attributes || {};
        setForm({
          name: editItem.name || '',
          type: editItem.type || 'totalDistance',
          start: editItem.start || 0,
          period: editItem.period || 0,
          enableOdo: editItem.type === 'totalDistance',
          odoInterval: editItem.type === 'totalDistance' ? String(editItem.period || '') : (attrs.odoInterval || ''),
          enableEH: editItem.type === 'hours',
          ehInterval: editItem.type === 'hours' ? String(editItem.period || '') : (attrs.ehInterval || ''),
          enableDays: editItem.type === 'date',
          daysInterval: editItem.type === 'date' ? String(editItem.period || '') : (attrs.daysInterval || ''),
          lastOdo: attrs.lastOdo || '',
          lastEH: attrs.lastEH || '',
          lastDays: attrs.lastDays || '',
          dataList: attrs.dataList || false,
          popup: attrs.popup || false,
          trigOdo: attrs.trigOdo || false,
          trigOdoVal: attrs.trigOdoVal || '',
          trigEH: attrs.trigEH || false,
          trigEHVal: attrs.trigEHVal || '',
          trigDays: attrs.trigDays || false,
          trigDaysVal: attrs.trigDaysVal || '',
          updateLastService: attrs.updateLastService || false,
          selectedDevices: attrs.selectedDevices || [],
        });
      } else {
        setForm({
          name: '', type: 'totalDistance', start: 0, period: 0,
          enableOdo: false, odoInterval: '', enableEH: false, ehInterval: '',
          enableDays: false, daysInterval: '', lastOdo: '', lastEH: '', lastDays: '',
          dataList: false, popup: false,
          trigOdo: false, trigOdoVal: '', trigEH: false, trigEHVal: '',
          trigDays: false, trigDaysVal: '', updateLastService: false,
          selectedDevices: [],
        });
      }
    }
  }, [open, editItem]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;

    /* Determine primary type + period */
    let type = 'totalDistance';
    let period = 0;
    if (form.enableOdo) { type = 'totalDistance'; period = parseFloat(form.odoInterval) || 0; }
    else if (form.enableEH) { type = 'hours'; period = parseFloat(form.ehInterval) || 0; }
    else if (form.enableDays) { type = 'date'; period = parseFloat(form.daysInterval) || 0; }

    const payload = {
      name: form.name,
      type,
      start: parseFloat(form.start) || 0,
      period,
      attributes: {
        odoInterval: form.odoInterval,
        ehInterval: form.ehInterval,
        daysInterval: form.daysInterval,
        lastOdo: form.lastOdo,
        lastEH: form.lastEH,
        lastDays: form.lastDays,
        dataList: form.dataList,
        popup: form.popup,
        trigOdo: form.trigOdo,
        trigOdoVal: form.trigOdoVal,
        trigEH: form.trigEH,
        trigEHVal: form.trigEHVal,
        trigDays: form.trigDays,
        trigDaysVal: form.trigDaysVal,
        updateLastService: form.updateLastService,
        selectedDevices: form.selectedDevices,
      },
    };
    if (editItem) payload.id = editItem.id;
    onSave(payload);
  };

  const deviceOptions = useMemo(() => deviceList.map((d) => ({
    value: String(d.id), label: d.name,
  })), [deviceList]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 680, maxHeight: '85vh' } }}>
      <DialogTitle className={classes.propDialogTitle}>
        <Typography variant="subtitle2" component="span">
          {editItem ? 'Edit Service' : 'Service Properties'}
        </Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: '10px 14px', overflow: 'auto' }}>
        {/* ── SECTION: SERVICE ── */}
        <Box className={classes.propSection}>SERVICE</Box>

        <Box className={classes.propCols} sx={{ mt: 1 }}>
          {/* Left column */}
          <Box className="col">
            <Box className={classes.propRow}>
              <span className="propLabel" style={{ textAlign: 'left' }}>Name</span>
              <CustomInput value={form.name} onChange={(e) => set('name', e.target.value)} style={{ flex: 1 }} />
            </Box>
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight : '18px' }}>Show in data list</span>
              <CustomCheckbox checked={form.dataList} onChange={() => set('dataList', !form.dataList)} />
            </Box>
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight : '18px' }}>Show popup</span>
              <CustomCheckbox checked={form.popup} onChange={() => set('popup', !form.popup)} />
            </Box>

            {/* Odometer interval */}
            <Box className={classes.propCheckRow}><span className="propLabel" style={{ marginRight : '18px' }}>Odo interval</span>
              <CustomCheckbox checked={form.enableOdo} onChange={() => set('enableOdo', !form.enableOdo)} />
              <CustomInput
                type="number"
                value={form.odoInterval}
                onChange={(e) => set('odoInterval', e.target.value)}
                disabled={!form.enableOdo}
                style={{ width: 100 }}
              />
            </Box>
            {/* Engine hours interval */}
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight : '18px' }}>EH interval</span>
              <CustomCheckbox checked={form.enableEH} onChange={() => set('enableEH', !form.enableEH)} />
              <CustomInput
                type="number"
                value={form.ehInterval}
                onChange={(e) => set('ehInterval', e.target.value)}
                disabled={!form.enableEH}
                style={{ width: 100 }}
              />
            </Box>
            {/* Days interval */}
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight : '18px' }}>Days interval</span>
              <CustomCheckbox checked={form.enableDays} onChange={() => set('enableDays', !form.enableDays)} />
              <CustomInput
                type="number"
                value={form.daysInterval}
                onChange={(e) => set('daysInterval', e.target.value)}
                disabled={!form.enableDays}
                style={{ width: 100 }}
              />
            </Box>
          </Box>

          {/* Right column */}
          <Box className="col">
            <Box className={classes.propRow}>
              <span className="propLabel" style={{ textAlign: 'left' }}>Objects</span>
              <CustomMultiSelect
                value={form.selectedDevices}
                onChange={(v) => set('selectedDevices', v)}
                options={deviceOptions}
                style={{ flex: 1, minWidth: 160 }}
              />
            </Box>
            <Box className={classes.propRow}>
              <span className="propLabel" style={{ textAlign: 'left' }}>Last service odo</span>
              <CustomInput type="number" value={form.lastOdo} onChange={(e) => set('lastOdo', e.target.value)} style={{ width: 100 }} />
            </Box>
            <Box className={classes.propRow}>
              <span className="propLabel" style={{ textAlign: 'left' }}>Last service EH</span>
              <CustomInput type="number" value={form.lastEH} onChange={(e) => set('lastEH', e.target.value)} style={{ width: 100 }} />
            </Box>
            <Box className={classes.propRow}>
              <span className="propLabel" style={{ textAlign: 'left' }} >Last service days</span>
              <CustomInput type="number" value={form.lastDays} onChange={(e) => set('lastDays', e.target.value)} style={{ width: 100 }} />
            </Box>
          </Box>
        </Box>

        {/* ── SECTION: TRIGGER EVENT ── */}
        <Box className={classes.propSection}>TRIGGER EVENT</Box>

        <Box className={classes.propCols} sx={{ mt: 1 }}>
          {/* Left column */}
          <Box className="col">
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight: '18px' }} >Odo left</span>
              <CustomCheckbox checked={form.trigOdo} onChange={() => set('trigOdo', !form.trigOdo)} />
              <CustomInput
                type="number"
                value={form.trigOdoVal}
                onChange={(e) => set('trigOdoVal', e.target.value)}
                disabled={!form.trigOdo}
                style={{ width: 100 }}
              />
            </Box>
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight: '18px' }}>EH left</span>
              <CustomCheckbox checked={form.trigEH} onChange={() => set('trigEH', !form.trigEH)} />
              <CustomInput
                type="number"
                value={form.trigEHVal}
                onChange={(e) => set('trigEHVal', e.target.value)}
                disabled={!form.trigEH}
                style={{ width: 100 }}
              />
            </Box>
            <Box className={classes.propCheckRow}>
              <span className="propLabel" style={{ marginRight: '18px' }}>Days left</span>
              <CustomCheckbox checked={form.trigDays} onChange={() => set('trigDays', !form.trigDays)} />
              <CustomInput
                type="number"
                value={form.trigDaysVal}
                onChange={(e) => set('trigDaysVal', e.target.value)}
                disabled={!form.trigDays}
                style={{ width: 100 }}
              />
            </Box>
          </Box>
          {/* Right column */}
          <Box className="col">
            <Box className={classes.propCheckRow}>
              <span className="propLabel">Update last service</span>
              <CustomCheckbox checked={form.updateLastService} onChange={() => set('updateLastService', !form.updateLastService)} />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box className={classes.propFooter}>
        <CustomButton variant="outlined" size="small" onClick={onClose}>Cancel</CustomButton>
        <CustomButton variant="contained" size="small" onClick={handleSave}>Save</CustomButton>
      </Box>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MaintenanceDialog — V1 parity (Maintenance Services)
   ═══════════════════════════════════════════════════════════════ */
const MaintenanceDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  /* Properties dialog state */
  const [propOpen, setPropOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  /* Fetch */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance', { headers: { Accept: 'application/json' } });
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error('Failed to load maintenance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  /* Actions */
  const handleAdd = () => { setEditItem(null); setPropOpen(true); };
  const handleEdit = (item) => { setEditItem(item); setPropOpen(true); };

  const handleDelete = useCallback(async (item) => {
    try {
      await fetch(`/api/maintenance/${item.id}`, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [fetchItems]);

  const handleBulkDelete = useCallback(async (ids) => {
    await Promise.all(ids.map((id) => fetch(`/api/maintenance/${id}`, { method: 'DELETE' }).catch(() => {})));
    setSelected([]);
    fetchItems();
  }, [fetchItems]);

  const handleSave = useCallback(async (payload) => {
    try {
      if (payload.id) {
        await fetch(`/api/maintenance/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setPropOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [fetchItems]);

  const handleExportCSV = useCallback(() => {
    const header = 'Name,Type,Start,Period';
    const rows = items.map((d) => [
      d.name, TYPE_LABEL[d.type] || d.type,
      formatValue(d.type, d.start), formatValue(d.type, d.period),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `maintenance_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  /* Selection helpers */
  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === items.length ? [] : items.map((d) => d.id)));
  }, [items]);
  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* Columns (V1: Name, Type, Start, Period) */
  const columns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => TYPE_LABEL[row.type] || row.type },
    { key: 'start', label: 'Start', render: (row) => formatValue(row.type, row.start) },
    { key: 'period', label: 'Period', render: (row) => formatValue(row.type, row.period) },
  ], []);

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 780, height: 520 } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2" component="span">Maintenance</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <CustomTable
            rows={items}
            columns={columns}
            loading={loading}
            selected={selected}
            onToggleAll={onToggleAll}
            onToggleRow={onToggleRow}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={fetchItems}
            onBulkDelete={handleBulkDelete}
            onExport={handleExportCSV}
            search={search}
            onSearchChange={setSearch}
            onOpenSettings={() => {}}
          />
        </DialogContent>
      </Dialog>

      {/* Service Properties dialog */}
      <ServicePropertiesDialog
        open={propOpen}
        onClose={() => setPropOpen(false)}
        onSave={handleSave}
        editItem={editItem}
        devices={devices}
      />
    </>
  );
};

export default MaintenanceDialog;
