import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box,
  FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress, ImageList, ImageListItem, ImageListItemBar,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
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
  filterRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  imgItem: {
    cursor: 'pointer',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
  },
  previewOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  },
  previewImage: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
}));

const GalleryDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);
  const positions = useSelector((state) => state.session.positions);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Load images from device positions that have image attributes
  const handleLoad = async () => {
    setLoading(true);
    try {
      const imgs = [];

      // Check current positions for image attributes
      const posList = Object.values(positions);
      posList.forEach((p) => {
        if (selectedDeviceId && p.deviceId !== parseInt(selectedDeviceId)) return;
        const attrs = p.attributes || {};
        if (attrs.image) {
          const device = devices[p.deviceId];
          imgs.push({
            id: `pos_${p.id}`,
            url: `/api/media/${p.deviceId}/${attrs.image}`,
            time: p.fixTime,
            deviceName: device?.name || `ID: ${p.deviceId}`,
            lat: p.latitude,
            lng: p.longitude,
            speed: p.speed ? (p.speed * 1.852).toFixed(1) : '0',
          });
        }
      });

      // Also check events for image data
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 86400000);
      let url = `/api/reports/events?from=${dayAgo.toISOString()}&to=${now.toISOString()}`;
      if (selectedDeviceId) url += `&deviceId=${selectedDeviceId}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const events = await res.json();
        events.forEach((e) => {
          const attrs = e.attributes || {};
          if (attrs.image) {
            const device = devices[e.deviceId];
            imgs.push({
              id: `event_${e.id}`,
              url: `/api/media/${e.deviceId}/${attrs.image}`,
              time: e.eventTime || e.serverTime,
              deviceName: device?.name || `ID: ${e.deviceId}`,
              lat: attrs.latitude,
              lng: attrs.longitude,
            });
          }
        });
      }

      setImages(imgs);
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setImages([]);
      handleLoad();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '800px', height: '550px' } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2">Gallery</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box className={classes.filterRow}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Device</InputLabel>
              <Select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                label="Device"
              >
                <MenuItem value="">All Devices</MenuItem>
                {deviceList.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              onClick={handleLoad}
              disabled={loading}
              sx={{ backgroundColor: '#2a81d4', textTransform: 'none' }}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : 'Refresh'}
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {images.length > 0 ? (
              <ImageList cols={3} gap={8}>
                {images.map((img) => (
                  <ImageListItem
                    key={img.id}
                    className={classes.imgItem}
                    onClick={() => setPreviewUrl(img.url)}
                  >
                    <img
                      src={img.url}
                      alt={img.deviceName}
                      loading="lazy"
                      style={{ height: '160px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <ImageListItemBar
                      title={img.deviceName}
                      subtitle={img.time ? new Date(img.time).toLocaleString() : ''}
                      sx={{
                        '& .MuiImageListItemBar-title': { fontSize: '11px' },
                        '& .MuiImageListItemBar-subtitle': { fontSize: '10px' },
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography variant="caption" color="text.secondary">
                  {loading ? 'Loading...' : 'No images available. Images appear when devices send photo data.'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Preview overlay */}
      {previewUrl && (
        <div className={classes.previewOverlay} onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Preview" className={classes.previewImage} />
        </div>
      )}
    </>
  );
};

export default GalleryDialog;
