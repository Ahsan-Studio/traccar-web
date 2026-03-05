import {
 useEffect, useState, useMemo, useCallback 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, TextField,
  Table, TableBody, TableHead, TableRow, TableCell, TableContainer,
  Button, Checkbox, CircularProgress, Chip,
  FormControlLabel, Switch, Select, MenuItem,
  FormControl,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
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
  toolbar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  // Properties dialog styles
  propRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
    gap: '8px',
  },
  propLabel: {
    width: '120px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#555',
    flexShrink: 0,
  },
  propInput: {
    flex: 1,
  },
  linkBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px',
    backgroundColor: '#f0f7ff',
    borderRadius: '4px',
    border: '1px solid #c3d9f0',
    marginTop: '8px',
    marginBottom: '8px',
  },
  linkText: {
    fontSize: '11px',
    color: '#2a81d4',
    wordBreak: 'break-all',
    flex: 1,
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #e0e0e0',
  },
}));

const ShareDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingShare, setEditingShare] = useState(null); // null = list view, object = editing
  const [saving, setSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Fetch shares from API
  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/share-positions', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      }
    } catch (err) {
      console.error('Failed to load share positions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchShares();
  }, [open, fetchShares]);

  // Add new share
  const handleAdd = () => {
    setEditingShare({
      active: true,
      name: '',
      email: '',
      phone: '',
      deviceIds: '',
      shareToken: '',
      expireEnabled: false,
      expireDate: '',
      deleteExpired: false,
      _isNew: true,
    });
  };

  // Edit existing share
  const handleEdit = (share) => {
    setEditingShare({
      ...share,
      expireDate: share.expireDate ? new Date(share.expireDate).toISOString().slice(0, 16) : '',
      _isNew: false,
    });
  };

  // Delete share
  const handleDelete = async (shareId) => {
    if (!window.confirm('Delete this share link?')) return;
    try {
      await fetch(`/api/share-positions/${shareId}`, { method: 'DELETE' });
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      console.error('Failed to delete share:', err);
    }
  };

  // Save share (create or update)
  const handleSave = async () => {
    if (!editingShare.name) return;
    setSaving(true);
    try {
      const payload = {
        active: editingShare.active,
        name: editingShare.name,
        email: editingShare.email || '',
        phone: editingShare.phone || '',
        deviceIds: editingShare.deviceIds || '',
        expireEnabled: editingShare.expireEnabled,
        expireDate: editingShare.expireDate ? new Date(editingShare.expireDate).toISOString() : null,
        deleteExpired: editingShare.deleteExpired,
      };

      let res;
      if (editingShare._isNew) {
        res = await fetch('/api/share-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        payload.id = editingShare.id;
        payload.shareToken = editingShare.shareToken;
        res = await fetch(`/api/share-positions/${editingShare.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setEditingShare(null);
        fetchShares();
      }
    } catch (err) {
      console.error('Failed to save share:', err);
    } finally {
      setSaving(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/simple/?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(token);
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  // Get share link URL
  const getShareUrl = (token) => `${window.location.origin}/simple/?token=${token}`;

  // Render Properties view
  if (editingShare) {
    const selectedDeviceIds = editingShare.deviceIds
      ? editingShare.deviceIds.split(',').filter(Boolean).map(Number)
      : [];

    return (
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '500px' } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2">
            {editingShare._isNew ? 'New Share Position' : 'Edit Share Position'}
          </Typography>
          <IconButton size="small" className={classes.closeButton} onClick={() => setEditingShare(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {/* Active toggle */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Active</div>
            <div className={classes.propInput}>
              <Switch
                size="small"
                checked={editingShare.active}
                onChange={(e) => setEditingShare({ ...editingShare, active: e.target.checked })}
              />
            </div>
          </div>

          {/* Name */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Name *</div>
            <div className={classes.propInput}>
              <TextField
                size="small"
                fullWidth
                value={editingShare.name}
                onChange={(e) => setEditingShare({ ...editingShare, name: e.target.value })}
                placeholder="Recipient name"
              />
            </div>
          </div>

          {/* Email */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Email</div>
            <div className={classes.propInput}>
              <TextField
                size="small"
                fullWidth
                type="email"
                value={editingShare.email}
                onChange={(e) => setEditingShare({ ...editingShare, email: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Phone</div>
            <div className={classes.propInput}>
              <TextField
                size="small"
                fullWidth
                value={editingShare.phone}
                onChange={(e) => setEditingShare({ ...editingShare, phone: e.target.value })}
                placeholder="+62812345678"
              />
            </div>
          </div>

          {/* Device selection */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Devices</div>
            <div className={classes.propInput}>
              <FormControl size="small" fullWidth>
                <Select
                  multiple
                  value={selectedDeviceIds}
                  onChange={(e) => {
                    const ids = e.target.value;
                    setEditingShare({ ...editingShare, deviceIds: ids.join(',') });
                  }}
                  renderValue={(selected) =>
                    selected.map((id) => devices[id]?.name || `ID:${id}`).join(', ')
                  }
                >
                  {deviceList.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      <Checkbox size="small" checked={selectedDeviceIds.includes(d.id)} />
                      <Typography variant="body2">{d.name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Expiry */}
          <div className={classes.propRow}>
            <div className={classes.propLabel}>Expire</div>
            <div className={classes.propInput} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                size="small"
                checked={editingShare.expireEnabled}
                onChange={(e) => setEditingShare({ ...editingShare, expireEnabled: e.target.checked })}
              />
              {editingShare.expireEnabled && (
                <TextField
                  size="small"
                  type="datetime-local"
                  value={editingShare.expireDate}
                  onChange={(e) => setEditingShare({ ...editingShare, expireDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
                />
              )}
            </div>
          </div>

          {/* Delete on expiry */}
          {editingShare.expireEnabled && (
            <div className={classes.propRow}>
              <div className={classes.propLabel}>Auto-delete</div>
              <div className={classes.propInput}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={editingShare.deleteExpired}
                      onChange={(e) => setEditingShare({ ...editingShare, deleteExpired: e.target.checked })}
                    />
                  }
                  label={<Typography variant="caption">Delete when expired</Typography>}
                />
              </div>
            </div>
          )}

          {/* Share link (only for existing shares) */}
          {!editingShare._isNew && editingShare.shareToken && (
            <div className={classes.linkBox}>
              <LinkIcon sx={{ color: '#2a81d4', fontSize: 18 }} />
              <div className={classes.linkText}>
                {getShareUrl(editingShare.shareToken)}
              </div>
              <IconButton
                size="small"
                onClick={() => handleCopyLink(editingShare.shareToken)}
                sx={{ color: '#2a81d4' }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              {copyFeedback === editingShare.shareToken && (
                <Typography variant="caption" color="success.main">Copied!</Typography>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className={classes.bottomBar}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditingShare(null)}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saving || !editingShare.name}
              sx={{ textTransform: 'none', backgroundColor: '#2a81d4' }}
            >
              {saving ? <CircularProgress size={16} color="inherit" /> : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render List view
  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '800px', height: '500px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Share Position</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className={classes.toolbar}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ textTransform: 'none', backgroundColor: '#2a81d4' }}
          >
            Add Share
          </Button>
        </div>

        {/* Table */}
        <TableContainer sx={{ flex: 1, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead}>Name</TableCell>
                <TableCell className={classes.tableHead}>Email</TableCell>
                <TableCell className={classes.tableHead}>Phone</TableCell>
                <TableCell className={classes.tableHead}>Devices</TableCell>
                <TableCell className={classes.tableHead} align="center">Active</TableCell>
                <TableCell className={classes.tableHead}>Expires</TableCell>
                <TableCell className={classes.tableHead} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : shares.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999', fontSize: '12px' }}>
                    No share links. Click &quot;Add Share&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                shares.map((share) => {
                  const deviceCount = share.deviceIds
                    ? share.deviceIds.split(',').filter(Boolean).length
                    : 0;
                  const isExpired = share.expireEnabled && share.expireDate
                    && new Date(share.expireDate) < new Date();

                  return (
                    <TableRow key={share.id} hover>
                      <TableCell className={classes.tableCell}>{share.name}</TableCell>
                      <TableCell className={classes.tableCell}>{share.email || '—'}</TableCell>
                      <TableCell className={classes.tableCell}>{share.phone || '—'}</TableCell>
                      <TableCell className={classes.tableCell}>
                        {deviceCount > 0 ? (
                          <Chip
                            label={`${deviceCount} device${deviceCount > 1 ? 's' : ''}`}
                            size="small"
                            sx={{ fontSize: '10px', height: '18px' }}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        {share.active ? (
                          isExpired ? (
                            <Chip label="Expired" size="small" color="warning"
                              sx={{ fontSize: '10px', height: '18px' }} />
                          ) : (
                            <Chip label="Active" size="small" color="success"
                              sx={{ fontSize: '10px', height: '18px' }} />
                          )
                        ) : (
                          <Chip label="Inactive" size="small"
                            sx={{ fontSize: '10px', height: '18px', backgroundColor: '#e0e0e0' }} />
                        )}
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        {share.expireEnabled && share.expireDate
                          ? new Date(share.expireDate).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell className={classes.tableCell} align="center">
                        <IconButton size="small" onClick={() => handleCopyLink(share.shareToken)}
                          title="Copy share link">
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        {copyFeedback === share.shareToken && (
                          <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                            Copied!
                          </Typography>
                        )}
                        <IconButton size="small" onClick={() => handleEdit(share)} title="Edit">
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(share.id)}
                          title="Delete" color="error">
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
