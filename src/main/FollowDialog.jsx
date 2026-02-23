import {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  formatTime, formatCoordinate, formatSpeed, formatDistance,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()(() => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '90%',
      maxWidth: '900px',
      height: '80vh',
      maxHeight: '700px',
      margin: 0,
      borderRadius: 0,
      overflow: 'hidden',
    },
  },
  dialogTitle: {
    backgroundColor: '#2b82d4',
    color: 'white',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 'unset',
  },
  closeButton: {
    color: 'white',
    padding: '2px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
  },
  dialogContent: {
    padding: 0,
    height: 'calc(100% - 41px)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  // Info panel — left side, only visible when showInfo=true
  infoPanel: {
    width: '240px',
    borderRight: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  infoPanelHeader: {
    backgroundColor: '#f0f0f0',
    padding: '6px 10px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '12px',
    fontWeight: 600,
    color: '#444',
  },
  dataTable: {
    '& .MuiTableCell-root': {
      padding: '4px 10px',
      fontSize: '12px',
      borderBottom: '1px solid #f0f0f0',
    },
  },
  dataLabel: {
    fontWeight: 500,
    color: '#666',
    width: '45%',
    whiteSpace: 'nowrap',
  },
  dataValue: {
    color: '#333',
    wordBreak: 'break-word',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapContainer: {
    position: 'absolute',
    inset: 0,
    '& .maplibregl-map': { position: 'absolute', inset: 0 },
    '& .maplibregl-canvas': { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  },
  // Overlay control bar — floats on top of map, top-left (matches old version screenshot)
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: '1px solid #ccc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    fontSize: '13px',
    color: '#333',
    userSelect: 'none',
  },
  overlaySelect: {
    fontSize: '13px',
    border: '1px solid #ccc',
    padding: '1px 4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
}));

const FollowDialog = ({ open, onClose, device }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const [followEnabled, setFollowEnabled] = useState(true);
  const [mapType, setMapType] = useState('osm');
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const labelRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const position = useSelector((state) =>
    device ? state.session.positions[device.id] : null,
  );
  const speedUnit = useSelector((state) => state.session.user?.attributes?.speedUnit || 'kmh');

  const getMapStyle = useCallback((type) => {
    switch (type) {
      case 'satellite':
        return {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
          },
          layers: [{ id: 'satellite', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 20 }],
        };
      case 'hybrid':
        return {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
            labels: {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=h&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'satellite', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 20 },
            { id: 'labels', type: 'raster', source: 'labels', minzoom: 0, maxzoom: 20 },
          ],
        };
      default:
        return {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
        };
    }
  }, []);

  const handleDialogEntered = useCallback(() => {
    if (mapContainer.current && !mapInstance.current) {
      try {
        mapInstance.current = new maplibregl.Map({
          container: mapContainer.current,
          style: getMapStyle('osm'),
          center: position ? [position.longitude, position.latitude] : [106.8456, -6.2088],
          zoom: 15,
          attributionControl: false,
          trackResize: false,
        });
        mapInstance.current.on('load', () => {
          setMapReady(true);
          mapInstance.current.resize();
        });
        mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [position, getMapStyle]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      setMapReady(false);
    }
  }, [open]);

  // Map style change
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const map = mapInstance.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    map.setStyle(getMapStyle(mapType));
    map.once('styledata', () => {
      map.jumpTo({ center: currentCenter, zoom: currentZoom });
    });
  }, [mapType, mapReady, getMapStyle]);

  // Update marker + label when position changes
  useEffect(() => {
    if (!mapInstance.current || !mapReady || !position || !device) return;

    const coordinates = [position.longitude, position.latitude];
    const course = position.course || 0;
    const speedText = formatSpeed(position.speed ?? 0, speedUnit, t);
    const labelText = `${device.name} (${speedText})`;

    // Resolve device icon — same logic as DeviceRow.jsx / MapPositions.js
    const rawIcon = device.attributes?.icon?.deviceImage;
    let iconUrl;
    if (rawIcon) {
      const clean = rawIcon.replace('/img/markers/objects/', '').replace('.svg', '');
      iconUrl = `/img/markers/objects/${clean}.svg`;
    } else {
      iconUrl = '/img/markers/objects/land-car.svg';
    }

    if (!markerRef.current) {
      // Marker element — device configured icon, rotated by course
      const el = document.createElement('div');
      el.style.cssText = 'width:28px;height:28px;cursor:pointer;';

      const img = document.createElement('img');
      img.src = iconUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
      img.style.transform = `rotate(${course}deg)`;
      img.onerror = () => { img.src = '/img/markers/objects/land-car.svg'; };
      el.appendChild(img);

      // Permanent label next to marker
      const label = document.createElement('div');
      label.style.cssText = [
        'position:absolute',
        'left:32px',
        'top:50%',
        'transform:translateY(-50%)',
        'background:rgba(255,255,255,0.9)',
        'border:1px solid #ccc',
        'padding:2px 6px',
        'font-size:12px',
        'white-space:nowrap',
        'pointer-events:none',
        'color:#333',
        'box-shadow:0 1px 3px rgba(0,0,0,0.2)',
      ].join(';');
      label.textContent = labelText;
      el.appendChild(label);
      labelRef.current = label;

      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coordinates)
        .addTo(mapInstance.current);
    } else {
      // Update position, icon and rotation
      markerRef.current.setLngLat(coordinates);
      const img = markerRef.current.getElement().querySelector('img');
      if (img) {
        img.src = iconUrl;
        img.style.transform = `rotate(${course}deg)`;
      }
      if (labelRef.current) labelRef.current.textContent = labelText;
    }

    if (followEnabled) {
      mapInstance.current.panTo(coordinates, { duration: 400 });
    }
  }, [position, followEnabled, device, mapReady, speedUnit, t]);

  // Info panel data
  const infoSections = useMemo(() => {
    if (!showInfo || !device || !position) return null;

    const general = [];
    const location = [];

    if (position.attributes?.hours !== undefined) {
      general.push({ label: t('reportEngineHours') || 'Engine hours', value: `${(position.attributes.hours / 3600000).toFixed(1)} h` });
    }
    if (device.model) general.push({ label: t('deviceModel') || 'Model', value: device.model });
    if (position.attributes?.totalDistance !== undefined) {
      general.push({ label: t('deviceTotalDistance') || 'Odometer', value: formatDistance(position.attributes.totalDistance, 'km', t) });
    }
    if (device.attributes?.plateNumber) general.push({ label: t('devicePlate') || 'Plate', value: device.attributes.plateNumber });
    if (device.phone) general.push({ label: t('devicePhone') || 'SIM Card', value: device.phone });

    let status = 'Stopped';
    if (position.attributes?.ignition === true) status = (position.speed || 0) > 5 ? 'Moving' : 'Engine Idle';
    general.push({ label: t('deviceStatus') || 'Status', value: status });

    if (position.altitude !== undefined) location.push({ label: t('positionAltitude') || 'Altitude', value: `${Math.round(position.altitude)} m` });
    if (position.course !== undefined) location.push({ label: t('positionCourse') || 'Angle', value: `${Math.round(position.course)}°` });
    location.push({
      label: t('positionLatitude') || 'Position',
      value: `${formatCoordinate('latitude', position.latitude, 'dd')}, ${formatCoordinate('longitude', position.longitude, 'dd')}`,
    });
    if (position.attributes?.ignition !== undefined) {
      location.push({ label: t('positionIgnition') || 'Engine', value: position.attributes.ignition ? 'ON' : 'OFF' });
    }
    if (position.speed !== undefined) location.push({ label: t('positionSpeed') || 'Speed', value: formatSpeed(position.speed, speedUnit, t) });
    if (position.fixTime) location.push({ label: t('positionFixTime') || 'GPS Time', value: formatTime(position.fixTime, 'seconds') });

    return [
      { title: 'General', rows: general },
      { title: 'Location', rows: location },
    ].filter((s) => s.rows.length > 0);
  }, [showInfo, device, position, t, speedUnit]);

  if (!device) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
      TransitionProps={{ onEntered: handleDialogEntered }}
    >
      {/* Title bar — blue, matches old version */}
      <DialogTitle className={classes.dialogTitle} sx={{ p: 0 }}>
        <Typography sx={{ fontSize: '15px', fontWeight: 500, pl: 1.5 }}>
          Follow ({device.name})
        </Typography>
        <IconButton className={classes.closeButton} onClick={onClose} size="small" sx={{ mr: 0.5 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Info side panel — only when checked */}
        {showInfo && infoSections && (
          <Box className={classes.infoPanel}>
            {infoSections.map((section) => (
              <Box key={section.title}>
                <Box className={classes.infoPanelHeader}>{section.title}</Box>
                <Table size="small" className={classes.dataTable}>
                  <TableBody>
                    {section.rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className={classes.dataLabel}>{row.label}</TableCell>
                        <TableCell className={classes.dataValue}>{row.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ))}
          </Box>
        )}

        {/* Map area */}
        <Box className={classes.mapWrapper}>
          {/* Map takes full area */}
          <Box className={classes.mapContainer} ref={mapContainer} />

          {/* Controls overlay — floats on top of map, matching old version */}
          {mapReady && (
            <Box className={classes.mapOverlay}>
              <input
                type="checkbox"
                id="follow-info"
                checked={showInfo}
                style={{ cursor: 'pointer', margin: 0 }}
                onChange={(e) => setShowInfo(e.target.checked)}
              />
              <label htmlFor="follow-info" style={{ cursor: 'pointer', marginRight: 6 }}>Info</label>
              <input
                type="checkbox"
                id="follow-follow"
                checked={followEnabled}
                style={{ cursor: 'pointer', margin: 0 }}
                onChange={(e) => setFollowEnabled(e.target.checked)}
              />
              <label htmlFor="follow-follow" style={{ cursor: 'pointer', marginRight: 6 }}>Follow</label>
              <select
                value={mapType}
                onChange={(e) => setMapType(e.target.value)}
                className={classes.overlaySelect}
              >
                <option value="osm">OSM Map</option>
                <option value="satellite">Satellite</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FollowDialog;
