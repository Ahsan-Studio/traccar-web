import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Button, IconButton, Typography, Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { map } from '../map/core/MapView';

const useStyles = makeStyles()(() => ({
  dialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '6px 14px',
    display: 'flex',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
  },
  input: {
    width: '100%',
    padding: '4px 6px',
    fontSize: '13px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#2a81d4',
    },
  },
  buttonBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 0 4px',
  },
  btn: {
    textTransform: 'none',
    fontSize: '12px',
    padding: '3px 12px',
    minWidth: 0,
  },
  resultItem: {
    padding: '6px 8px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    fontSize: '12px',
    color: '#333',
    '&:hover': { backgroundColor: '#f0f7ff' },
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { maxWidth: 380 } }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Address search</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: '16px 16px 12px' }}>
        <input
          className={classes.input}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={100}
          autoFocus
        />

        {results.length > 0 && (
          <Box sx={{ maxHeight: '160px', overflowY: 'auto', mt: 1, border: '1px solid #eee', borderRadius: '3px' }}>
            {results.map((r, idx) => (
              <Box
                key={idx}
                className={classes.resultItem}
                onClick={() => handleResultClick(r)}
              >
                {r.display_name}
              </Box>
            ))}
          </Box>
        )}

        <Box className={classes.buttonBar}>
          <Button
            variant="outlined"
            size="small"
            className={classes.btn}
            startIcon={<SearchIcon sx={{ fontSize: 14 }} />}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.btn}
            startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
            onClick={onClose}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSearchDialog;
