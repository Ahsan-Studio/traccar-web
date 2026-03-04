import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, Typography, Box,
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

let pointMarker = null;

const ShowPointDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleShow = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      alert('Please enter valid coordinates');
      return;
    }

    // Remove previous marker
    if (pointMarker) {
      pointMarker.remove();
      pointMarker = null;
    }

    // Add marker using maplibre-gl
    if (map) {
      const el = document.createElement('div');
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundImage = 'url(/img/top-nav/marker.svg)';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.cursor = 'pointer';

      // Use maplibregl.Marker
      const maplibregl = window.maplibregl || (map.getCanvas && map.constructor);
      if (typeof maplibregl !== 'undefined' && maplibregl.Marker) {
        pointMarker = new maplibregl.Marker({ element: el })
          .setLngLat([lngNum, latNum])
          .addTo(map);
      } else {
        // Fallback: use source/layer approach
        const id = 'show-point-marker';
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
        map.addSource(id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lngNum, latNum] },
          },
        });
        map.addLayer({
          id,
          type: 'circle',
          source: id,
          paint: {
            'circle-radius': 8,
            'circle-color': '#e53935',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      map.flyTo({
        center: [lngNum, latNum],
        zoom: Math.max(map.getZoom(), 15),
        duration: 1000,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Show Point</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-6.200000"
            size="small"
            fullWidth
            autoFocus
          />
          <TextField
            label="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="106.816666"
            size="small"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={handleShow} size="small"
          sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}
        >
          Show
        </Button>
        <Button variant="outlined" onClick={onClose} size="small" sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShowPointDialog;
