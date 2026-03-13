import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Tooltip,
  TextField, CircularProgress, Snackbar, Alert,
  Divider,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesIcon from '@mui/icons-material/Devices';

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: 750,
      maxWidth: '95vw',
      height: 520,
    },
  },
  title: {
    backgroundColor: '#2a81d4',
    color: '#fff',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: 14, fontWeight: 500 },
  },
  tabs: {
    minHeight: 32,
    '& .MuiTab-root': {
      textTransform: 'none',
      fontSize: 12,
      minHeight: 32,
      padding: '6px 16px',
    },
  },
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: 11,
      backgroundColor: '#f5f5f5',
      padding: '4px 8px',
    },
    '& .MuiTableCell-body': {
      fontSize: 11,
      padding: '4px 8px',
    },
  },
  planCard: {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#2a81d4',
      boxShadow: '0 2px 8px rgba(42,129,212,0.2)',
    },
  },
  planCardSelected: {
    borderColor: '#2a81d4',
    backgroundColor: '#e3f2fd',
  },
  activateBox: {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: theme.spacing(2),
    margin: theme.spacing(1, 0),
  },
}));

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ flex: 1, overflow: 'auto', p: 1 }}>
    {value === index && children}
  </Box>
);

const BillingDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [purchasedPlans, setPurchasedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedImeis, setSelectedImeis] = useState('');
  const [activatingPlanId, setActivatingPlanId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [availRes, purchasedRes] = await Promise.all([
        fetch('/api/billing/plans'),
        fetch('/api/billing/purchased'),
      ]);
      if (availRes.ok) setAvailablePlans(await availRes.json());
      if (purchasedRes.ok) setPurchasedPlans(await purchasedRes.json());
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchPlans();
  }, [open, fetchPlans]);

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch('/api/billing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.open(data.paymentUrl, '_blank');
        }
        showSnackbar('Purchase initiated');
        await fetchPlans();
      } else {
        showSnackbar('Purchase failed', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const handleActivate = async (planId) => {
    const imeis = selectedImeis.split(/[,\s]+/).filter(Boolean);
    if (imeis.length === 0) {
      showSnackbar('Enter at least one IMEI', 'error');
      return;
    }
    try {
      const res = await fetch('/api/billing/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, imeis }),
      });
      if (res.ok) {
        const result = await res.json();
        showSnackbar(`Activated ${result.activated || imeis.length} objects`);
        setSelectedImeis('');
        setActivatingPlanId(null);
        await fetchPlans();
      } else {
        const errText = await res.text();
        showSnackbar(`Activation failed: ${errText}`, 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this purchased plan?')) return;
    try {
      const res = await fetch(`/api/billing/purchased/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        showSnackbar('Plan deleted');
        await fetchPlans();
      } else {
        showSnackbar('Delete failed', 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    }
  };

  const formatPeriod = (period, periodType) => {
    if (!period) return '—';
    return `${period} ${periodType || 'months'}`;
  };

  return (
    <Dialog open={open} onClose={onClose} className={classes.dialog}>
      <DialogTitle className={classes.title}>
        <Typography>Billing</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        className={classes.tabs}
        variant="fullWidth"
      >
        <Tab icon={<ShoppingCartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Available Plans" />
        <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="My Plans" />
      </Tabs>
      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {/* Tab 0 — Available Plans */}
            <TabPanel value={tabValue} index={0}>
              {availablePlans.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                  No billing plans available. Contact administrator.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {availablePlans.map((plan) => (
                    <Box
                      key={plan.id}
                      className={`${classes.planCard} ${selectedPlan?.id === plan.id ? classes.planCardSelected : ''}`}
                      onClick={() => setSelectedPlan(plan)}
                      sx={{ width: 'calc(33.33% - 16px)' }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>{plan.name}</Typography>
                      <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                        {plan.currency || '$'}{plan.price}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatPeriod(plan.period, plan.periodType)}
                      </Typography>
                      <br />
                      <Chip
                        label={`${plan.objects} objects`}
                        size="small"
                        color="info"
                        sx={{ mt: 1, fontSize: 10 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
              {selectedPlan && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    onClick={handlePurchase}
                    size="small"
                  >
                    Purchase "{selectedPlan.name}"
                  </Button>
                </Box>
              )}
            </TabPanel>

            {/* Tab 1 — My Plans */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={fetchPlans}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {purchasedPlans.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                  No purchased plans. Visit "Available Plans" to purchase.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" className={classes.table}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Plan</TableCell>
                        <TableCell>Objects Left</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Purchased</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchasedPlans.map((plan) => (
                        <TableRow key={plan.id} hover>
                          <TableCell>{plan.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={plan.objects ?? 0}
                              size="small"
                              color={plan.objects > 0 ? 'success' : 'default'}
                              sx={{ fontSize: 10 }}
                            />
                          </TableCell>
                          <TableCell>{formatPeriod(plan.period, plan.periodType)}</TableCell>
                          <TableCell>{plan.currency || '$'}{plan.price}</TableCell>
                          <TableCell>{plan.purchasedAt ? new Date(plan.purchasedAt).toLocaleDateString() : '—'}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Activate Objects">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setActivatingPlanId(activatingPlanId === plan.id ? null : plan.id)}
                                disabled={!plan.objects || plan.objects <= 0}
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Plan">
                              <IconButton size="small" color="error" onClick={() => handleDeletePlan(plan.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Activate panel */}
              {activatingPlanId && (
                <Box className={classes.activateBox} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    <DevicesIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Activate Objects Against Plan
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Enter IMEI numbers (comma or space separated) to activate:
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Enter IMEI numbers..."
                    value={selectedImeis}
                    onChange={(e) => setSelectedImeis(e.target.value)}
                    sx={{ mt: 1, mb: 1, '& .MuiInputBase-input': { fontSize: 12 } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => { setActivatingPlanId(null); setSelectedImeis(''); }}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleActivate(activatingPlanId)}
                    >
                      Activate
                    </Button>
                  </Box>
                </Box>
              )}
            </TabPanel>
          </>
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

export default BillingDialog;
