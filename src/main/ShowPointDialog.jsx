import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Button, IconButton, Typography, Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
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
  formRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
  },
  label: {
    width: '30%',
    fontSize: '13px',
    color: '#333',
    flexShrink: 0,
  },
  input: {
    width: '70%',
    padding: '4px 6px',
    fontSize: '13px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    outline: 'none',
    fontFamily: 'inherit',
    '&:focus': {
      borderColor: '#2a81d4',
    },
  },
  buttonBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 0 4px',
  },
  btn: {
    textTransform: 'none',
    fontSize: '12px',
    padding: '3px 12px',
    minWidth: 0,
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

      const maplibregl = window.maplibregl || (map.getCanvas && map.constructor);
      if (typeof maplibregl !== 'undefined' && maplibregl.Marker) {
        pointMarker = new maplibregl.Marker({ element: el })
          .setLngLat([lngNum, latNum])
          .addTo(map);
      } else {
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { maxWidth: 380 } }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">Show point</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: '12px 16px' }}>
        <Box className={classes.formRow}>
          <span className={classes.label}>Latitude</span>
          <input
            className={classes.input}
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            maxLength={15}
            autoFocus
          />
        </Box>
        <Box className={classes.formRow}>
          <span className={classes.label}>Longitude</span>
          <input
            className={classes.input}
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            maxLength={15}
          />
        </Box>
        <Box className={classes.buttonBar}>
          <Button
            variant="outlined"
            size="small"
            className={classes.btn}
            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
            onClick={handleShow}
          >
            Show
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

export default ShowPointDialog;
