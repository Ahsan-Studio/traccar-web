import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Typography, Box, CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { map } from '../map/core/MapView';

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
}));

const AddressSearchDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`,
      );
      const data = await response.json();
      if (data.length > 0) {
        setResults(data);
        // Fly to first result
        const first = data[0];
        if (map) {
          map.flyTo({
            center: [parseFloat(first.lon), parseFloat(first.lat)],
            zoom: 15,
            duration: 1000,
          });
        }
      } else {
        alert('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    if (map) {
      if (result.boundingbox) {
        const [south, north, west, east] = result.boundingbox.map(parseFloat);
        map.fitBounds([[west, south], [east, north]], {
          padding: 50,
          duration: 1000,
          maxZoom: 17,
        });
      } else {
        map.flyTo({
          center: [parseFloat(result.lon), parseFloat(result.lat)],
          zoom: 15,
          duration: 1000,
        });
      }
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Address Search</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box display="flex" gap={1} mt={1}>
          <TextField
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter address..."
            size="small"
            fullWidth
            autoFocus
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            size="small"
            sx={{ backgroundColor: '#2a81d4', textTransform: 'none', minWidth: '80px' }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Search'}
          </Button>
        </Box>

        {results.length > 0 && (
          <Box mt={2} sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {results.map((r, idx) => (
              <Box
                key={idx}
                onClick={() => handleResultClick(r)}
                sx={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '12px',
                  '&:hover': { backgroundColor: '#f0f7ff' },
                }}
              >
                {r.display_name}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} size="small" sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressSearchDialog;
