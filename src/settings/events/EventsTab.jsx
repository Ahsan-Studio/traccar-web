import { useState, useEffect, useCallback } from 'react';
import { Chip, Snackbar, Alert } from '@mui/material';
import { CustomTable, BoolIcon } from '../../common/components/custom';
import EventEditDialog from './EventEditDialog';

const EVENT_TYPE_LABELS = {
  sos: 'SOS',
  bracon: 'Bracelet On',
  bracoff: 'Bracelet Off',
  dismount: 'Dismount',
  disassem: 'Disassemble',
  door: 'Door',
  mandown: 'Man Down',
  shock: 'Shock',
  tow: 'Tow',
  pwrcut: 'Power Cut',
  gpsantcut: 'GPS Antenna Cut',
  jamming: 'Signal Jamming',
  lowdc: 'Low DC',
  lowbat: 'Low Battery',
  connyes: 'Connection Yes',
  connno: 'Connection No',
  gpsyes: 'GPS Yes',
  gpsno: 'GPS No',
  stopped: 'Stopped',
  moving: 'Moving',
  engidle: 'Engine Idle',
  overspeed: 'Overspeed',
  underspeed: 'Underspeed',
  haccel: 'Harsh Acceleration',
  hbrake: 'Harsh Braking',
  hcorn: 'Harsh Cornering',
  driverch: 'Driver Change',
  trailerch: 'Trailer Change',
  param: 'Parameter',
  sensor: 'Sensor',
  service: 'Service',
  dtc: 'Diagnostic Trouble Codes',
  proximity: 'Proximity',
  route_in: 'Route In',
  route_out: 'Route Out',
  zone_in: 'Zone In',
  zone_out: 'Zone Out',
  // Legacy Traccar types (for backward compatibility)
  deviceOnline: 'Device Online',
  deviceUnknown: 'Device Unknown',
  deviceOffline: 'Device Offline',
  deviceInactive: 'Device Inactive',
  deviceMoving: 'Device Moving',
  deviceStopped: 'Device Stopped',
  deviceOverspeed: 'Overspeed',
  deviceFuelDrop: 'Fuel Drop',
  deviceFuelIncrease: 'Fuel Increase',
  geofenceEnter: 'Geofence Enter',
  geofenceExit: 'Geofence Exit',
  alarm: 'Alarm',
  ignitionOn: 'Ignition On',
  ignitionOff: 'Ignition Off',
  maintenance: 'Maintenance',
  textMessage: 'Text Message',
  driverChanged: 'Driver Changed',
  media: 'Media',
  commandResult: 'Command Result',
};

const EventsTab = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        showSnackbar('Failed to load events', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      showSnackbar('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const mapRow = (n) => {
    const notificators = n.notificators ? n.notificators.split(/[, ]+/) : [];
    return {
      ...n,
      name: n.description || EVENT_TYPE_LABELS[n.type] || n.type,
      typeName: EVENT_TYPE_LABELS[n.type] || n.type,
      active: n.enabled,
      system: notificators.includes('web'),
      push: notificators.includes('firebase') || notificators.includes('traccar'),
      email: notificators.includes('mail'),
      sms: notificators.includes('sms'),
    };
  };

  const rows = items
    .map(mapRow)
    .filter((it) => {
      const s = search.toLowerCase();
      return (it.name || '').toLowerCase().includes(s)
        || (it.typeName || '').toLowerCase().includes(s);
    });

  const columns = [
    { key: 'name', label: 'Name', width: '30%' },
    {
      key: 'typeName',
      label: 'Type',
      width: '18%',
      render: (r) => (
        <Chip
          label={r.typeName}
          size="small"
          sx={{
            fontSize: '10px',
            height: '20px',
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
            fontWeight: 500,
          }}
        />
      ),
    },
    { key: 'active', label: 'Active', align: 'center', width: '8%', render: (r) => <BoolIcon value={!!r.active} /> },
    { key: 'system', label: 'System', align: 'center', width: '8%', render: (r) => <BoolIcon value={!!r.system} /> },
    { key: 'push', label: 'Push', align: 'center', width: '8%', render: (r) => <BoolIcon value={!!r.push} /> },
    { key: 'email', label: 'E-mail', align: 'center', width: '8%', render: (r) => <BoolIcon value={!!r.email} /> },
    { key: 'sms', label: 'SMS', align: 'center', width: '8%', render: (r) => <BoolIcon value={!!r.sms} /> },
  ];

  const onToggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const onToggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onAdd = () => {
    setEditItem(null);
    setEditOpen(true);
  };

  const onEdit = (row) => {
    const original = items.find((n) => n.id === row.id);
    setEditItem(original || row);
    setEditOpen(true);
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Delete event "${row.name || row.type}"?`)) return;
    try {
      const res = await fetch(`/api/notifications/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((n) => n.id !== row.id));
        setSelected((prev) => prev.filter((sid) => sid !== row.id));
        showSnackbar('Event deleted successfully');
      } else {
        showSnackbar('Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      showSnackbar('Failed to delete event', 'error');
    }
  };

  const onSave = async (payload) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/notifications/${payload.id}` : '/api/notifications';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    await fetchItems();
    showSnackbar(isEdit ? 'Event updated successfully' : 'Event created successfully');
  };

  return (
    <>
      <CustomTable
        rows={rows}
        columns={columns}
        loading={loading}
        selected={selected}
        onToggleAll={onToggleAll}
        onToggleRow={onToggleRow}
        onEdit={onEdit}
        onDelete={onDelete}
        search={search}
        onSearchChange={setSearch}
        onAdd={onAdd}
        onRefresh={fetchItems}
        onOpenSettings={() => {}}
      />
      <EventEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={editItem}
        onSave={onSave}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontSize: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EventsTab;
