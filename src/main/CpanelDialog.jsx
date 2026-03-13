import {
 useState, useEffect, useCallback, useRef 
} from 'react';
import {
  Dialog, DialogContent,
  IconButton, Typography, Box,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tooltip,
  TextField, Button, CircularProgress, Snackbar, Alert,
  Divider, InputAdornment, FormControlLabel,
  Card, CardContent, Grid, TablePagination,
  Checkbox,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DevicesIcon from '@mui/icons-material/Devices';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ServerTab from './CpanelTabs/ServerTab';
import BrandingTab from './CpanelTabs/BrandingTab';
import LanguagesTab from './CpanelTabs/LanguagesTab';
import MapsTab from './CpanelTabs/MapsTab';
import UserTab from './CpanelTabs/UserTab';
import BillingTab from './CpanelTabs/BillingTab';
import TemplatesTab from './CpanelTabs/TemplatesTab';
import EmailTab from './CpanelTabs/EmailTab';
import SmsTab from './CpanelTabs/SmsTab';
import ToolsTab from './CpanelTabs/ToolsTab';
import LogsTab from './CpanelTabs/LogsTab';

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      margin: 0,
      borderRadius: 0,
    },
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    color: '#fff',
    height: 40,
    padding: '0 8px',
    gap: 2,
    flexShrink: 0,
  },
  navBtn: {
    color: '#ecf0f1',
    fontSize: 11,
    textTransform: 'none',
    minWidth: 'auto',
    padding: '4px 10px',
    borderRadius: 3,
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
    '&.active': { backgroundColor: 'rgba(255,255,255,0.25)', fontWeight: 600 },
  },
  navBadge: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: 9,
    borderRadius: 8,
    padding: '1px 5px',
    marginLeft: 4,
    fontWeight: 600,
  },
  navBadgeGreen: {
    backgroundColor: '#27ae60',
    color: '#fff',
    fontSize: 9,
    borderRadius: 8,
    padding: '1px 5px',
    marginLeft: 4,
    fontWeight: 600,
  },
  sectionTitle: {
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: '4px 10px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    flexShrink: 0,
  },
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: 11,
      backgroundColor: '#e9ecef',
      padding: '5px 8px',
      whiteSpace: 'nowrap',
      borderRight: '1px solid #dee2e6',
      color: '#495057',
    },
    '& .MuiTableCell-body': {
      fontSize: 11,
      padding: '4px 8px',
      borderRight: '1px solid #f0f0f0',
    },
  },
  statsCard: {
    textAlign: 'center',
    '& .MuiCardContent-root': { padding: theme.spacing(1.5) },
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2c3e50',
  },
  statsLabel: {
    fontSize: 11,
    color: '#666',
  },
  bottomBar: {
    display: 'flex',
    alignItems: 'center',
    borderTop: '1px solid #dee2e6',
    backgroundColor: '#f8f9fa',
    padding: '2px 10px',
    flexShrink: 0,
  },
}));

// Section Constants
const SECTION_OVERVIEW = 'overview';
const SECTION_USERS = 'users';
const SECTION_OBJECTS = 'objects';
const SECTION_UNUSED = 'unused';
const SECTION_BILLING = 'billing';
const SECTION_SERVER = 'server';

const CpanelDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [section, setSection] = useState(SECTION_USERS);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [billingPlans, setBillingPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: '', currency: 'USD', period: 1, periodType: 'months', objects: 10 });
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const importRef = useRef(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [objects, setObjects] = useState([]);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // ── Add User form state ──
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', administrator: false, deviceLimit: -1 });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Overview Stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/statistics?from=2000-01-01T00:00:00Z&to=2099-01-01T00:00:00Z');
      if (res.ok) {
        const data = await res.json();
        const latest = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : {};
        setStats(latest);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  // ── Users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Devices (Objects) ──
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices?all=true');
      if (res.ok) setObjects(await res.json());
    } catch (err) {
      console.error('Devices error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Billing Plans ──
  const fetchBillingPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/plans');
      if (res.ok) setBillingPlans(await res.json());
    } catch (err) {
      console.error('Billing plans error:', err);
    }
  }, []);

  const resetPlanForm = () => {
    setPlanForm({ name: '', price: '', currency: 'USD', period: 1, periodType: 'months', objects: 10 });
    setEditingPlan(null);
    setShowPlanForm(false);
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.price) {
      showSnackbar('Name and price are required', 'error');
      return;
    }
    try {
      const payload = {
        ...planForm,
        price: parseFloat(planForm.price),
        period: parseInt(planForm.period, 10),
        objects: parseInt(planForm.objects, 10),
      };
      const url = editingPlan ? `/api/billing/plans/${editingPlan.id}` : '/api/billing/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan ? { ...editingPlan, ...payload } : payload),
      });
      if (res.ok) {
        showSnackbar(editingPlan ? 'Plan updated' : 'Plan created');
        resetPlanForm();
        await fetchBillingPlans();
      } else {
        showSnackbar('Failed to save plan', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const handleEditPlan = (plan) => {
    setPlanForm({
      name: plan.name || '',
      price: plan.price?.toString() || '',
      currency: plan.currency || 'USD',
      period: plan.period || 1,
      periodType: plan.periodType || 'months',
      objects: plan.objects || 10,
    });
    setEditingPlan(plan);
    setShowPlanForm(true);
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Delete billing plan "${plan.name}"?`)) return;
    try {
      const res = await fetch(`/api/billing/plans/${plan.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSnackbar('Plan deleted');
        await fetchBillingPlans();
      } else {
        showSnackbar('Failed to delete plan', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  // ── Bulk Import ──
  const handleBulkImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        showSnackbar('CSV must have header + at least 1 row', 'error');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h === 'name');
      const imeiIdx = headers.findIndex((h) => h === 'imei' || h === 'uniqueid' || h === 'identifier');
      if (nameIdx < 0 || imeiIdx < 0) {
        showSnackbar('CSV must have "name" and "imei" columns', 'error');
        return;
      }
      const modelIdx = headers.findIndex((h) => h === 'model');
      const phoneIdx = headers.findIndex((h) => h === 'phone' || h === 'sim_number');
      const categoryIdx = headers.findIndex((h) => h === 'category');

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        return {
          name: cols[nameIdx] || '',
          uniqueId: cols[imeiIdx] || '',
          model: modelIdx >= 0 ? cols[modelIdx] || '' : '',
          phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '',
          category: categoryIdx >= 0 ? cols[categoryIdx] || '' : '',
        };
      }).filter((r) => r.name && r.uniqueId);

      if (rows.length === 0) {
        showSnackbar('No valid rows found in CSV', 'error');
        return;
      }

      setImportProgress({ total: rows.length, done: 0, errors: 0 });
      let done = 0;
      let errors = 0;
      for (const row of rows) {
        try {
          const res = await fetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row),
          });
          if (res.ok) {
            done += 1;
          } else {
            errors += 1;
          }
        } catch {
          errors += 1;
        }
        setImportProgress({ total: rows.length, done: done + errors, errors });
      }
      showSnackbar(`Import complete: ${done} created, ${errors} failed`);
      setImportProgress(null);
      await fetchDevices();
    } catch (err) {
      showSnackbar(`Import error: ${err.message}`, 'error');
      setImportProgress(null);
    }
    if (importRef.current) importRef.current.value = '';
  };

  // ── Bulk Email ──
  const handleSendEmail = async () => {
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      showSnackbar('Subject and message are required', 'error');
      return;
    }
    const targetUsers = selectedUserIds.size > 0
      ? users.filter((u) => selectedUserIds.has(u.id))
      : users.filter((u) => !u.disabled && u.email);
    if (targetUsers.length === 0) {
      showSnackbar('No target users found', 'error');
      return;
    }
    if (!window.confirm(`Send email to ${targetUsers.length} user(s)?`)) return;
    setEmailSending(true);
    let sent = 0;
    let failed = 0;
    for (const user of targetUsers) {
      try {
        const res = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            to: user.email,
            subject: emailForm.subject,
            body: emailForm.message,
          }),
        });
        if (res.ok) {
          sent += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
    setEmailSending(false);
    showSnackbar(`Email sent to ${sent} user(s)${failed > 0 ? `, ${failed} failed` : ''}`);
    setShowEmailForm(false);
    setEmailForm({ subject: '', message: '' });
    setSelectedUserIds(new Set());
  };

  // ── Add User ──
  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.password) {
      showSnackbar('Email and password are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addUserForm.name || addUserForm.email,
          email: addUserForm.email,
          password: addUserForm.password,
          administrator: addUserForm.administrator,
          deviceLimit: parseInt(addUserForm.deviceLimit, 10),
        }),
      });
      if (res.ok) {
        showSnackbar('User created successfully');
        setShowAddUser(false);
        setAddUserForm({ name: '', email: '', password: '', administrator: false, deviceLimit: -1 });
        await fetchUsers();
      } else {
        const errText = await res.text();
        showSnackbar(`Failed to create user: ${errText}`, 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  useEffect(() => {
    if (open) {
      fetchStats();
      fetchUsers();
      fetchDevices();
      fetchBillingPlans();
    }
  }, [open, fetchStats, fetchUsers, fetchDevices, fetchBillingPlans]);

  const handleRefresh = () => {
    if (section === SECTION_OVERVIEW) fetchStats();
    if (section === SECTION_USERS) fetchUsers();
    if (section === SECTION_OBJECTS || section === SECTION_UNUSED) fetchDevices();
    if (section === SECTION_BILLING) fetchBillingPlans();
  };

  // ── User actions ──
  const toggleUserEnabled = async (user) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, disabled: !user.disabled }),
      });
      if (res.ok) {
        showSnackbar(`User ${user.disabled ? 'activated' : 'deactivated'}`);
        await fetchUsers();
      } else {
        showSnackbar('Failed to update user', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.name || user.email}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSnackbar('User deleted');
        await fetchUsers();
      } else {
        showSnackbar('Failed to delete user', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const loginAsUser = async (user) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(user.email)}&password=`,
      });
      if (res.ok) {
        window.location.reload();
      } else {
        showSnackbar('Cannot login as this user', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  // ── Device actions ──
  const toggleDeviceEnabled = async (device) => {
    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...device, disabled: !device.disabled }),
      });
      if (res.ok) {
        showSnackbar(`Device ${device.disabled ? 'activated' : 'deactivated'}`);
        await fetchDevices();
      } else {
        showSnackbar('Failed to update device', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const deleteDevice = async (device) => {
    if (!window.confirm(`Delete device "${device.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/devices/${device.id}`, { method: 'DELETE' });
      if (res.ok) {
        showSnackbar('Device deleted');
        await fetchDevices();
      } else {
        showSnackbar('Failed to delete device', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const clearDeviceHistory = async (device) => {
    if (!window.confirm(`Clear all position history for "${device.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/accumulators`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id, totalDistance: 0, hours: 0 }),
      });
      if (res.ok) {
        showSnackbar('Device history cleared');
      } else {
        showSnackbar('Failed to clear history', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  // ── Filter helpers ──
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || String(u.id).includes(q);
  });

  const filteredDevices = objects.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.name || '').toLowerCase().includes(q)
      || (d.uniqueId || '').toLowerCase().includes(q)
      || (d.phone || '').toLowerCase().includes(q);
  });

  const UNUSED_THRESHOLD_DAYS = 30;
  const unusedDevices = objects.filter((d) => {
    if (!d.lastUpdate) return true;
    const daysSince = (Date.now() - new Date(d.lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > UNUSED_THRESHOLD_DAYS;
  });

  const totalOnline = objects.filter((d) => d.status === 'online').length;

  // Pagination
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const displayedDevices = section === SECTION_UNUSED ? unusedDevices : filteredDevices;
  const paginatedDevices = displayedDevices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const switchSection = (s) => {
    setSection(s);
    setSearch('');
    setPage(0);
    setShowEmailForm(false);
    setShowAddUser(false);
  };

  // Helper to format date
  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch { return '—'; }
  };
  const fmtDateTime = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch { return '—'; }
  };

  // Get user privileges label
  const getPrivileges = (u) => {
    if (u.administrator) return 'Administrator';
    if (u.readonly) return 'Read-only';
    if (u.deviceReadonly) return 'Device R/O';
    if (u.limitCommands) return 'Limited';
    return 'User';
  };

  // Section title text
  const sectionTitleMap = {
    [SECTION_OVERVIEW]: 'Overview',
    [SECTION_USERS]: 'User list',
    [SECTION_OBJECTS]: 'Object list',
    [SECTION_UNUSED]: 'Unused objects',
    [SECTION_BILLING]: 'Billing plans',
    [SECTION_SERVER]: 'Manage server',
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog} maxWidth={false} fullScreen>
      {/* ════════ TOP NAVIGATION BAR (V1-style) ════════ */}
      <Box className={classes.topNav}>
        {/* Globe icon — go to main tracking page */}
        <Tooltip title="Go to tracking page">
          <IconButton size="small" onClick={onClose} sx={{ color: '#3498db', mr: 1 }}>
            <PublicIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />

        {/* Manager label */}
        <Typography sx={{ fontSize: 11, color: '#bdc3c7', mr: 1 }}>
          <AccountCircleIcon sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.3 }} />
          Administrator
        </Typography>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />

        {/* Nav Buttons */}
        <Button
          className={`${classes.navBtn} ${section === SECTION_USERS ? 'active' : ''}`}
          startIcon={<PeopleIcon sx={{ fontSize: 14 }} />}
          onClick={() => switchSection(SECTION_USERS)}
        >
          Users
          <span className={classes.navBadge}>{users.length}</span>
        </Button>

        <Button
          className={`${classes.navBtn} ${section === SECTION_OBJECTS ? 'active' : ''}`}
          startIcon={<DevicesIcon sx={{ fontSize: 14 }} />}
          onClick={() => switchSection(SECTION_OBJECTS)}
        >
          Objects
          <span className={classes.navBadge}>{objects.length}</span>
          <span style={{ margin: '0 2px', color: '#95a5a6' }}>/</span>
          <span className={classes.navBadgeGreen}>{totalOnline}</span>
        </Button>

        <Button
          className={`${classes.navBtn} ${section === SECTION_UNUSED ? 'active' : ''}`}
          startIcon={<FilterListIcon sx={{ fontSize: 14 }} />}
          onClick={() => switchSection(SECTION_UNUSED)}
        >
          Unused
          <span className={classes.navBadge}>{unusedDevices.length}</span>
        </Button>

        <Button
          className={`${classes.navBtn} ${section === SECTION_BILLING ? 'active' : ''}`}
          startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
          onClick={() => switchSection(SECTION_BILLING)}
        >
          Billing
        </Button>

        <Button
          className={`${classes.navBtn} ${section === SECTION_SERVER ? 'active' : ''}`}
          startIcon={<SettingsIcon sx={{ fontSize: 14 }} />}
          onClick={() => switchSection(SECTION_SERVER)}
        >
          Manage Server
        </Button>

        <Box sx={{ flex: 1 }} />

        {/* Right side: Search, Refresh */}
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 14, color: '#bdc3c7' }} /></InputAdornment>,
            sx: {
              fontSize: 11, height: 26,
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            },
          }}
          sx={{ width: 180 }}
        />

        <Tooltip title="Refresh">
          <IconButton size="small" onClick={handleRefresh} sx={{ color: '#ecf0f1' }}>
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />

        <Tooltip title="Close Control Panel">
          <IconButton size="small" onClick={onClose} sx={{ color: '#e74c3c' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ════════ SECTION TITLE BAR ════════ */}
      <Box className={classes.sectionTitle}>
        <StorageIcon sx={{ fontSize: 15 }} />
        Control panel — {sectionTitleMap[section] || ''}
      </Box>

      {/* ════════ CONTENT ════════ */}
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* ── OVERVIEW ── */}
        {section === SECTION_OVERVIEW && (
          <Box sx={{ p: 2, overflow: 'auto' }}>
            <Grid container spacing={2}>
              {[
                { label: 'Total Users', value: users.length, icon: <PeopleIcon /> },
                { label: 'Total Devices', value: objects.length, icon: <DevicesIcon /> },
                { label: 'Online Now', value: totalOnline, icon: <CheckCircleIcon color="success" /> },
                { label: 'Offline', value: objects.length - totalOnline, icon: <BlockIcon color="error" /> },
                { label: 'Active Requests', value: stats.activeUsers || 0, icon: <DashboardIcon /> },
                { label: 'Messages Today', value: stats.messagesReceived || 0, icon: <StorageIcon /> },
              ].map((s, i) => (
                <Grid item xs={6} sm={4} md={2} key={i}>
                  <Card variant="outlined" className={classes.statsCard}>
                    <CardContent>
                      {s.icon}
                      <Typography className={classes.statsNumber}>{s.value}</Typography>
                      <Typography className={classes.statsLabel}>{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button size="small" startIcon={<RefreshIcon />} onClick={fetchStats}>
                Refresh Stats
              </Button>
            </Box>
          </Box>
        )}

        {/* ── USERS SECTION ── */}
        {section === SECTION_USERS && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* User toolbar */}
            <Box className={classes.toolbar}>
              <Tooltip title="Send Bulk Email">
                <IconButton
                  size="small"
                  color={showEmailForm ? 'primary' : 'default'}
                  onClick={() => setShowEmailForm(!showEmailForm)}
                >
                  <EmailIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ flex: 1 }} />
              {loading && <CircularProgress size={16} />}
            </Box>

            {/* Email Form */}
            {showEmailForm && (
              <Box sx={{ p: 1.5, backgroundColor: '#fff3e0', borderBottom: '1px solid #ffe0b2' }}>
                <Typography variant="subtitle2" sx={{ fontSize: 11, mb: 1 }}>
                  <EmailIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Send Email to {selectedUserIds.size > 0 ? `${selectedUserIds.size} selected` : 'all active'} user(s)
                </Typography>
                <TextField
                  label="Subject" size="small" fullWidth required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                  sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: 11 } }}
                  InputLabelProps={{ sx: { fontSize: 11 } }}
                />
                <TextField
                  label="Message" size="small" fullWidth required multiline rows={3}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))}
                  sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: 11 } }}
                  InputLabelProps={{ sx: { fontSize: 11 } }}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ flex: 1, alignSelf: 'center' }}>
                    {selectedUserIds.size > 0 ? 'Sending to selected users (use checkboxes)' : 'Sending to all active users'}
                  </Typography>
                  <Button size="small" onClick={() => { setShowEmailForm(false); setEmailForm({ subject: '', message: '' }); }}>Cancel</Button>
                  <Button
                    size="small" variant="contained" startIcon={emailSending ? <CircularProgress size={14} /> : <SendIcon />}
                    onClick={handleSendEmail} disabled={emailSending}
                    sx={{ fontSize: 10 }}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            )}

            {/* Add User Form */}
            {showAddUser && (
              <Box sx={{ p: 1.5, backgroundColor: '#e8f5e9', borderBottom: '1px solid #c8e6c9' }}>
                <Typography variant="subtitle2" sx={{ fontSize: 11, mb: 1 }}>
                  <PersonAddIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Add New User
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <TextField
                      label="Name" size="small" fullWidth
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm((f) => ({ ...f, name: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Email" size="small" fullWidth required
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Password" size="small" fullWidth required type="password"
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm((f) => ({ ...f, password: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={1.5}>
                    <TextField
                      label="Device Limit" size="small" fullWidth type="number"
                      value={addUserForm.deviceLimit}
                      onChange={(e) => setAddUserForm((f) => ({ ...f, deviceLimit: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={addUserForm.administrator}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, administrator: e.target.checked }))}
                        />
                      }
                      label={<Typography sx={{ fontSize: 10 }}>Admin</Typography>}
                    />
                  </Grid>
                  <Grid item xs={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Button size="small" onClick={() => setShowAddUser(false)}>Cancel</Button>
                    <Button size="small" variant="contained" onClick={handleAddUser} sx={{ fontSize: 10 }}>
                      <SaveIcon sx={{ fontSize: 14, mr: 0.3 }} /> Save
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* User Table */}
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" className={classes.table} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ width: 30 }}>
                      <Checkbox
                        size="small"
                        checked={selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={toggleSelectAllUsers}
                        sx={{ padding: '2px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 45 }}>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>E-mail</TableCell>
                    <TableCell sx={{ width: 55 }}>Active</TableCell>
                    <TableCell>Expires on</TableCell>
                    <TableCell>Privileges</TableCell>
                    <TableCell sx={{ width: 45 }}>API</TableCell>
                    <TableCell>Reg. time</TableCell>
                    <TableCell>Login time</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell sx={{ width: 55 }}>Sub acc.</TableCell>
                    <TableCell sx={{ width: 55 }}>Objects</TableCell>
                    <TableCell sx={{ width: 50 }}>E-mail</TableCell>
                    <TableCell sx={{ width: 45 }}>SMS</TableCell>
                    <TableCell sx={{ width: 45 }}>API</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((u) => (
                    <TableRow key={u.id} hover selected={selectedUserIds.has(u.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedUserIds.has(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          sx={{ padding: '2px' }}
                        />
                      </TableCell>
                      <TableCell>{u.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{u.name || '—'}</TableCell>
                      <TableCell>{u.email || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.disabled ? 'No' : 'Yes'}
                          size="small"
                          color={u.disabled ? 'error' : 'success'}
                          sx={{ fontSize: 9, height: 18, minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell>{u.expirationTime ? fmtDate(u.expirationTime) : '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={getPrivileges(u)}
                          size="small"
                          color={u.administrator ? 'error' : 'default'}
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.attributes?.apiEnabled ? 'Yes' : 'No'}
                          size="small"
                          color={u.attributes?.apiEnabled ? 'success' : 'default'}
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell>{fmtDate(u.registrationTime)}</TableCell>
                      <TableCell>{fmtDateTime(u.attributes?.lastLogin || u.login)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                        {u.attributes?.lastIp || '—'}
                      </TableCell>
                      <TableCell align="center">{u.attributes?.subAccountCount || 0}</TableCell>
                      <TableCell align="center">{u.deviceLimit >= 0 ? u.deviceLimit : '∞'}</TableCell>
                      <TableCell align="center">{u.attributes?.emailCount || 0}</TableCell>
                      <TableCell align="center">{u.attributes?.smsCount || 0}</TableCell>
                      <TableCell align="center">{u.attributes?.apiCount || 0}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.disabled ? 'Activate' : 'Deactivate'}>
                          <IconButton size="small" onClick={() => toggleUserEnabled(u)}>
                            {u.disabled
                              ? <CheckCircleIcon sx={{ fontSize: 14 }} color="success" />
                              : <BlockIcon sx={{ fontSize: 14 }} color="warning" />
                            }
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Login as user">
                          <IconButton size="small" onClick={() => loginAsUser(u)}>
                            <LoginIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteUser(u)}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={17} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                        {search ? 'No users match your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bottom bar */}
            <Box className={classes.bottomBar}>
              <Tooltip title="Add User">
                <IconButton size="small" onClick={() => setShowAddUser(!showAddUser)} color={showAddUser ? 'primary' : 'default'}>
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ flex: 1 }} />
              <TablePagination
                component="div"
                count={filteredUsers.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[25, 50, 100]}
                sx={{
                  '& .MuiTablePagination-toolbar': { minHeight: 32 },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: 11 },
                  '& .MuiTablePagination-select': { fontSize: 11 },
                }}
              />
            </Box>
          </Box>
        )}

        {/* ── OBJECTS (DEVICES) SECTION ── */}
        {section === SECTION_OBJECTS && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Devices toolbar */}
            <Box className={classes.toolbar}>
              <Tooltip title="Bulk Import CSV">
                <IconButton size="small" onClick={() => importRef.current?.click()}>
                  <UploadFileIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <input
                ref={importRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleBulkImport}
              />
              <Box sx={{ flex: 1 }} />
              {loading && <CircularProgress size={16} />}
            </Box>
            {importProgress && (
              <Box sx={{ p: 1, backgroundColor: '#e3f2fd', fontSize: 11, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} />
                Importing: {importProgress.done} / {importProgress.total}
                {importProgress.errors > 0 && <Typography component="span" color="error" sx={{ fontSize: 11 }}> ({importProgress.errors} errors)</Typography>}
              </Box>
            )}

            {/* Devices Table */}
            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" className={classes.table} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 45 }}>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>IMEI / Identifier</TableCell>
                    <TableCell sx={{ width: 55 }}>Active</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>GPS Device</TableCell>
                    <TableCell>SIM Number</TableCell>
                    <TableCell>Last Connection</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell sx={{ width: 60 }}>Net Protocol</TableCell>
                    <TableCell sx={{ width: 50 }}>Port</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>User Account</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDevices.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>{d.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.disabled ? 'No' : 'Yes'}
                          size="small"
                          color={d.disabled ? 'error' : 'success'}
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell>{d.expirationTime ? fmtDate(d.expirationTime) : '—'}</TableCell>
                      <TableCell>{d.model || d.category || '—'}</TableCell>
                      <TableCell>{d.phone || '—'}</TableCell>
                      <TableCell>{fmtDateTime(d.lastUpdate)}</TableCell>
                      <TableCell>{d.protocol || '—'}</TableCell>
                      <TableCell>{d.attributes?.netProtocol || 'TCP'}</TableCell>
                      <TableCell>{d.attributes?.port || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.status || 'unknown'}
                          size="small"
                          color={
                            d.status === 'online' ? 'success'
                              : d.status === 'offline' ? 'error' : 'default'
                          }
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell>{d.attributes?.userAccount || '—'}</TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={d.disabled ? 'Enable' : 'Disable'}>
                          <IconButton size="small" onClick={() => toggleDeviceEnabled(d)}>
                            {d.disabled
                              ? <CheckCircleIcon sx={{ fontSize: 14 }} color="success" />
                              : <BlockIcon sx={{ fontSize: 14 }} color="warning" />
                            }
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Clear History">
                          <IconButton size="small" onClick={() => clearDeviceHistory(d)}>
                            <HistoryIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteDevice(d)}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedDevices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                        {search ? 'No devices match your search' : 'No devices found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bottom bar */}
            <Box className={classes.bottomBar}>
              <Box sx={{ flex: 1 }} />
              <TablePagination
                component="div"
                count={displayedDevices.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[25, 50, 100]}
                sx={{
                  '& .MuiTablePagination-toolbar': { minHeight: 32 },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: 11 },
                  '& .MuiTablePagination-select': { fontSize: 11 },
                }}
              />
            </Box>
          </Box>
        )}

        {/* ── UNUSED OBJECTS SECTION ── */}
        {section === SECTION_UNUSED && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Box className={classes.toolbar}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Devices with no connection in the last {UNUSED_THRESHOLD_DAYS} days
              </Typography>
              <Box sx={{ flex: 1 }} />
              {loading && <CircularProgress size={16} />}
            </Box>

            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
              <Table size="small" className={classes.table} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 45 }}>ID</TableCell>
                    <TableCell>IMEI / Identifier</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Last Connection</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Net Protocol</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unusedDevices.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>{d.id}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{fmtDateTime(d.lastUpdate)}</TableCell>
                      <TableCell>{d.protocol || '—'}</TableCell>
                      <TableCell>{d.attributes?.netProtocol || 'TCP'}</TableCell>
                      <TableCell>{d.attributes?.port || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.status || 'unknown'}
                          size="small"
                          color={d.status === 'online' ? 'success' : d.status === 'offline' ? 'error' : 'default'}
                          sx={{ fontSize: 9, height: 18 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteDevice(d)}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unusedDevices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                        No unused devices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box className={classes.bottomBar}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {unusedDevices.length} unused device(s)
              </Typography>
              <Box sx={{ flex: 1 }} />
            </Box>
          </Box>
        )}

        {/* ── SERVER SETTINGS SECTION ── */}
        {section === SECTION_SERVER && (
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <ServerSettingsPanel showSnackbar={showSnackbar} />
          </Box>
        )}

        {/* ── BILLING PLANS SECTION ── */}
        {section === SECTION_BILLING && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Box className={classes.toolbar}>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { resetPlanForm(); setShowPlanForm(true); }}
                sx={{ fontSize: 10, textTransform: 'none' }}
              >
                New Plan
              </Button>
              <Box sx={{ flex: 1 }} />
            </Box>

            {showPlanForm && (
              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: 12 }}>
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <TextField
                      label="Name" size="small" fullWidth required
                      value={planForm.name}
                      onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Price" size="small" fullWidth required type="number"
                      value={planForm.price}
                      onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Currency" size="small" fullWidth
                      value={planForm.currency}
                      onChange={(e) => setPlanForm((f) => ({ ...f, currency: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Period" size="small" fullWidth type="number"
                      value={planForm.period}
                      onChange={(e) => setPlanForm((f) => ({ ...f, period: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Period Type" size="small" fullWidth select
                      value={planForm.periodType}
                      onChange={(e) => setPlanForm((f) => ({ ...f, periodType: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                      SelectProps={{ native: true }}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Objects" size="small" fullWidth type="number"
                      value={planForm.objects}
                      onChange={(e) => setPlanForm((f) => ({ ...f, objects: e.target.value }))}
                      InputProps={{ sx: { fontSize: 11 } }}
                      InputLabelProps={{ sx: { fontSize: 11 } }}
                    />
                  </Grid>
                  <Grid item xs={9} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={resetPlanForm}>Cancel</Button>
                    <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSavePlan} sx={{ fontSize: 10 }}>
                      {editingPlan ? 'Update' : 'Create'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {billingPlans.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                No billing plans. Click "New Plan" to create one.
              </Typography>
            ) : (
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small" className={classes.table} stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Objects</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingPlans.map((plan) => (
                      <TableRow key={plan.id} hover>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>{plan.currency || '$'}{plan.price}</TableCell>
                        <TableCell>{plan.period} {plan.periodType || 'months'}</TableCell>
                        <TableCell>
                          <Chip label={plan.objects ?? 0} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />
                        </TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditPlan(plan)}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeletePlan(plan)}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>

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
          sx={{ fontSize: 12 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// ── Server Settings sub-panel (orchestrator) ──
const ServerSettingsPanel = ({ showSnackbar }) => {
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/server');
        if (res.ok) setServer(await res.json());
      } catch (err) {
        console.error('Server fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    // Validate history period (minimum 30 days)
    const historyPeriodRaw = server.attributes?.historyPeriod;
    if (historyPeriodRaw !== '' && historyPeriodRaw != null) {
      const historyPeriod = parseInt(historyPeriodRaw, 10);
      if (Number.isNaN(historyPeriod) || historyPeriod < 30) {
        showSnackbar('Lowest history period is 30 days', 'error');
        return;
      }
    }
    // Validate backup email if provided
    const backupEmail = server.attributes?.backupEmail || '';
    if (backupEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backupEmail)) {
      showSnackbar('This email is not valid', 'error');
      return;
    }
    try {
      const res = await fetch('/api/server', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      });
      if (res.ok) {
        showSnackbar('Server settings saved');
      } else {
        showSnackbar('Failed to save settings', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>;
  if (!server) return <Typography sx={{ p: 2, textAlign: 'center' }}>Unable to load server settings</Typography>;

  const attr = (key) => server.attributes?.[key] ?? '';
  const attrBool = (key) => !!server.attributes?.[key];
  const updateAttribute = (key, value) => {
    setServer((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };
  const updateField = (key, value) => {
    setServer((prev) => ({ ...prev, [key]: value }));
  };

  // Shared props passed to every tab component
  const tabProps = { server, attr, attrBool, updateAttribute, updateField, showSnackbar };

  const tabs = [
    'Server', 'Branding & UI', 'Languages', 'Maps', 'User',
    'Billing', 'Templates', 'E-mail', 'SMS', 'Tools', 'Logs',
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar + Save */}
      <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', overflow: 'auto', flex: 1, gap: 0.5, px: 1, py: 0.5 }}>
          {tabs.map((t, i) => (
            <Button
              key={t}
              size="small"
              variant={activeTab === i ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(i)}
              sx={{
                fontSize: 11, textTransform: 'none', minWidth: 'auto', px: 1.5, py: 0.3,
                borderRadius: '4px 4px 0 0',
                ...(activeTab === i ? {} : { borderColor: '#ccc', color: '#555' }),
              }}
            >
              {t}
            </Button>
          ))}
        </Box>
        <Button
          variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
          onClick={handleSave}
          sx={{ fontSize: 11, textTransform: 'none', mr: 1, whiteSpace: 'nowrap' }}
        >
          Save
        </Button>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxWidth: 800 }}>
        {activeTab === 0 && <ServerTab {...tabProps} />}
        {activeTab === 1 && <BrandingTab {...tabProps} />}
        {activeTab === 2 && <LanguagesTab {...tabProps} />}
        {activeTab === 3 && <MapsTab {...tabProps} />}
        {activeTab === 4 && <UserTab {...tabProps} />}
        {activeTab === 5 && <BillingTab {...tabProps} />}
        {activeTab === 6 && <TemplatesTab {...tabProps} />}
        {activeTab === 7 && <EmailTab {...tabProps} />}
        {activeTab === 8 && <SmsTab {...tabProps} />}
        {activeTab === 9 && <ToolsTab {...tabProps} />}
        {activeTab === 10 && <LogsTab {...tabProps} />}
      </Box>
    </Box>
  );
};

export default CpanelDialog;
