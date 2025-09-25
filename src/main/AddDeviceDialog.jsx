import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useDispatch } from 'react-redux';
import { devicesActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  dialogTitle: {
    backgroundColor: '#2b82d4',
    color: 'white',
    padding: '3px 14px !important',
    fontSize: '14px !important',
    fontWeight: 500,
    lineHeight: '30px !important',
  },
  dialogContent: {
    padding: theme.spacing(2),
    width: '300px',
  },
  textField: {
    height: '24px',
    fontSize: '11px',
    "& .MuiInputBase-input.MuiOutlinedInput-input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
      WebkitTextFillColor: "#444444 !important",
      caretColor: "#444444",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f5f5f5",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
      border: "1px solid #f5f5f5",
      color: "#444444",
      fontSize: '11px',
      height: '24px',
    },
    "& .MuiInputLabel-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
    },
    "& .MuiInputAdornment-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        "& .MuiSvgIcon-root": {
          fontSize: "1.2rem",
        },
      },
    },
  },
  actions: {
    padding: theme.spacing(2),
    gap: theme.spacing(1),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    width: '60px',
  },
}));

const AddDeviceDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    uniqueId: '',
    status: 'string',
    disabled: true,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.uniqueId) {
      setError('Nama dan IMEI harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        if (errorData.includes('Duplicate entry') && errorData.includes('uniqueid')) {
          throw new Error('IMEI sudah digunakan');
        }
        throw new Error('Gagal menambahkan device');
      }
      
      // Refresh device list instead of updating single device
      const devicesResponse = await fetchOrThrow('/api/devices');
      const devices = await devicesResponse.json();
      dispatch(devicesActions.refresh(devices));
      
      onClose();
      setFormData({ name: '', uniqueId: '' }); // Reset form
    } catch (err) {
      console.error('Error adding device:', err);
      setError(err.message || 'Gagal menambahkan device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle className={classes.dialogTitle}>
        Tambah objek
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Box mt={2} sx={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
          <div className={classes.label}>Nama</div>
          <TextField
            fullWidth
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={classes.textField}
            error={!!error}
            disabled={loading}
          />
          </Box>
          <Box mt={2} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
          <div className={classes.label}>IMEI</div>
          <TextField
            fullWidth
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleChange}
            className={classes.textField}
            error={!!error}
            helperText={error}
            disabled={loading}
          />
          </Box>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button 
          onClick={onClose}
          disabled={loading}
          sx={{ fontSize: '13px', height: '24px' }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ fontSize: '13px', height: '24px' }}
        >
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDeviceDialog;
