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
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
 formatTime, formatCoordinate, formatSpeed, formatDistance,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '90%',
      maxWidth: '900px',
      height: '80vh',
      maxHeight: '700px',
      margin: 0,
    },
  },
  dialogTitle: {
    backgroundColor: '#4a90e2',
    color: 'white',
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  dialogContent: {
    padding: 0,
    height: 'calc(100% - 56px)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2),
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  contentWrapper: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  infoPanel: {
    width: '290px',
    borderRight: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  mapWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    '& .maplibregl-map': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    '& .maplibregl-canvas': {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
    },
  },
  select: {
    minWidth: 150,
    backgroundColor: 'white',
    '& .MuiOutlinedInput-input': {
      padding: '8px 14px',
      fontSize: '13px',
    },
  },
  accordion: {
    boxShadow: 'none',
    '&:before': {
      display: 'none',
    },
    '&.Mui-expanded': {
      margin: 0,
    },
  },
  accordionSummary: {
    backgroundColor: '#f0f0f0',
    minHeight: '40px',
    '&.Mui-expanded': {
      minHeight: '40px',
    },
    '& .MuiAccordionSummary-content': {
      margin: '8px 0',
      '&.Mui-expanded': {
        margin: '8px 0',
      },
    },
  },
  accordionDetails: {
    padding: 0,
  },
  dataTable: {
    '& .MuiTableCell-root': {
      padding: '6px 12px',
      fontSize: '12px',
      borderBottom: '1px solid #e0e0e0',
    },
  },
  dataLabel: {
    fontWeight: 500,
    color: '#666',
    width: '40%',
  },
  dataValue: {
    color: '#333',
    wordBreak: 'break-word',
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
  const [mapReady, setMapReady] = useState(false);
  
  // Memoize position selector untuk menghindari re-render tidak perlu
  const position = useSelector((state) => 
    device ? state.session.positions[device.id] : null
  );

  // Memoize map style untuk menghindari recreation
  const getMapStyle = useCallback((type) => {
    switch (type) {
      case 'satellite':
        return {
          version: 8,
          sources: {
            'satellite': {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
          },
          layers: [{
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 20,
          }],
        };
      case 'hybrid':
        return {
          version: 8,
          sources: {
            'satellite': {
              type: 'raster',
              tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256,
            },
            'labels': {
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
      default: // osm
        return {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          }],
        };
    }
  }, []);

  // Handle dialog entered (after animation complete)
  const handleDialogEntered = useCallback(() => {
    if (mapContainer.current && !mapInstance.current) {

      try {
        mapInstance.current = new maplibregl.Map({
          container: mapContainer.current,
          style: getMapStyle('osm'),
          center: position ? [position.longitude, position.latitude] : [106.8456, -6.2088],
          zoom: 15,
          attributionControl: false, // Disable untuk performa
          trackResize: false, // Disable auto tracking, kita handle manual
        });

        mapInstance.current.on('load', () => {
          setMapReady(true);
          mapInstance.current.resize();
        });

        // Add navigation controls
        mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [position, getMapStyle]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapReady(false);
    }
  }, [open]);

  // Handle map type change - optimized dengan debounce
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;

    const map = mapInstance.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Change map style
    map.setStyle(getMapStyle(mapType));

    // Restore center, zoom, and marker after style loads
    map.once('styledata', () => {
      map.jumpTo({ center: currentCenter, zoom: currentZoom }); // jumpTo lebih cepat dari setCenter/setZoom
      
      // Re-add marker if it exists
      if (markerRef.current && position) {
        const coordinates = [position.longitude, position.latitude];
        markerRef.current.setLngLat(coordinates);
      }
    });
  }, [mapType, mapReady, position, getMapStyle]);

  // Update marker position
  useEffect(() => {
    if (mapInstance.current && mapReady && position && device) {
      const coordinates = [position.longitude, position.latitude];

      if (!markerRef.current) {
        // Create marker element
        const el = document.createElement('div');
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.cursor = 'pointer';
        
        // Create img element for icon
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
        
        // Determine icon URL - sama seperti di MapPositions.js
        let iconUrl;
        if (device.attributes?.icon?.deviceImage) {
          // Custom icon: extract filename from path like '/img/markers/objects/land-electric-car.svg'
          const customIconName = device.attributes.icon.deviceImage
            .replace('.svg', '')
            .replace('/img/markers/objects/', '');
          iconUrl = `/img/markers/objects/${customIconName}.svg`;
        } else {
          // Default category icon
          const category = device.category || 'default';
          iconUrl = `/img/markers/objects/${category}.svg`;
        }
        
        img.src = iconUrl;
        img.onerror = () => {
          // Fallback to default icon
          img.src = '/img/markers/objects/default.svg';
        };
        
        el.appendChild(img);

        markerRef.current = new maplibregl.Marker({ 
          element: el,
          anchor: 'center',
        })
          .setLngLat(coordinates)
          .addTo(mapInstance.current);
      } else {
        // Update marker position
        markerRef.current.setLngLat(coordinates);
      }

      // Auto-center if follow is enabled
      if (followEnabled) {
        mapInstance.current.flyTo({
          center: coordinates,
          zoom: 15,
          duration: 500, // Kurangi durasi untuk performa lebih baik
          essential: true,
        });
      }
    }
  }, [position, followEnabled, device, mapReady]);

  // Render info panel data - Memoized untuk menghindari re-calculation
  const renderInfoPanel = useMemo(() => {
    if (!showInfo || !device || !position) return null;

    const generalData = [];
    const locationData = [];
    const serviceData = [];

    // General data (urutan sesuai web lama dan DeviceInfoPanel)
    // 1. Engine hours
    if (position.attributes?.hours !== undefined) {
      const hours = (position.attributes.hours / 3600000).toFixed(1);
      generalData.push({ label: 'Engine hours', value: `${hours} h` });
    }
    
    // 2. Model
    if (device.model) {
      generalData.push({ label: 'Model', value: device.model });
    }
    
    // 3. Odometer
    if (position.attributes?.totalDistance !== undefined) {
      generalData.push({ label: 'Odometer', value: formatDistance(position.attributes.totalDistance, 'km', t) });
    }
    
    // 4. Plate number
    if (device.attributes?.plateNumber) {
      generalData.push({ label: 'Plate', value: device.attributes.plateNumber });
    }
    
    // 5. SIM Card Number
    if (device.phone) {
      generalData.push({ label: 'SIM Card Number', value: device.phone });
    }
    
    // 6. Status
    if (position) {
      let status = 'Stopped';
      if (position.attributes?.ignition === true) {
        status = position.speed > 5 ? 'Moving' : 'Engine Idle';
      }
      generalData.push({ label: 'Status', value: status });
    }
    
    // 7. VIN
    if (device.attributes?.vin) {
      generalData.push({ label: 'VIN', value: device.attributes.vin });
    }
    
    // 8. Driver (if available)
    if (position.attributes?.driverName) {
      generalData.push({ label: 'Driver', value: position.attributes.driverName });
    }
    
    // 9. Trailer (if available)
    if (position.attributes?.trailerName) {
      generalData.push({ label: 'Trailer', value: position.attributes.trailerName });
    }

    // 10. Custom fields
    if (device.attributes) {
      Object.keys(device.attributes).forEach(key => {
        // Skip standard attributes
        if (!['vin', 'plateNumber', 'icon', 'deviceImage', 'web.reportColor', 'mail.smtp', 'color'].includes(key)) {
          const value = device.attributes[key];
          if (value && typeof value === 'string' && value.length < 100) {
            generalData.push({ label: key, value });
          }
        }
      });
    }

    // Location data
    if (position.altitude !== undefined) {
      locationData.push({ label: 'Altitude', value: `${Math.round(position.altitude)} m` });
    }
    if (position.course !== undefined) {
      locationData.push({ label: 'Course/Angle', value: `${Math.round(position.course)}°` });
    }
    locationData.push({
      label: 'Position',
      value: `${formatCoordinate('latitude', position.latitude, 'dd')}, ${formatCoordinate('longitude', position.longitude, 'dd')}`,
    });
    if (position.attributes?.ignition !== undefined) {
      locationData.push({ label: 'Engine/Status', value: position.attributes.ignition ? 'on' : 'off' });
    }
    if (position.speed !== undefined) {
      locationData.push({ label: 'Speed', value: formatSpeed(position.speed, 'kmh', t) });
    }
    if (position.fixTime) {
      locationData.push({ label: 'Time (Position)', value: formatTime(position.fixTime, 'seconds') });
    }
    if (position.serverTime) {
      locationData.push({ label: 'Time (Server)', value: formatTime(position.serverTime, 'seconds') });
    }

    // Service data (if available from device attributes)
    if (device.attributes?.serviceData) {
      const services = device.attributes.serviceData;
      Object.keys(services).forEach(key => {
        serviceData.push({ label: services[key].name, value: services[key].status });
      });
    }

    return (
      <Box className={classes.infoPanel}>
        {generalData.length > 0 && (
          <Accordion defaultExpanded className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>General</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Table size="small" className={classes.dataTable}>
                <TableBody>
                  {generalData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className={classes.dataLabel}>{item.label}</TableCell>
                      <TableCell className={classes.dataValue}>{item.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}

        {locationData.length > 0 && (
          <Accordion defaultExpanded className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Location</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Table size="small" className={classes.dataTable}>
                <TableBody>
                  {locationData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className={classes.dataLabel}>{item.label}</TableCell>
                      <TableCell className={classes.dataValue}>{item.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}

        {serviceData.length > 0 && (
          <Accordion defaultExpanded className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Service</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Table size="small" className={classes.dataTable}>
                <TableBody>
                  {serviceData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className={classes.dataLabel}>{item.label}</TableCell>
                      <TableCell className={classes.dataValue}>{item.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  }, [showInfo, device, position, classes, t]); // Dependencies untuk useMemo

  if (!device) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
      TransitionProps={{
        onEntered: handleDialogEntered,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography component="span" sx={{ fontSize: '16px', fontWeight: 500 }}>
          Follow ({device.name})
        </Typography>
        <IconButton
          className={classes.closeButton}
          onClick={onClose}
          size="small"
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Box className={classes.controls}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showInfo}
                  onChange={(e) => setShowInfo(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography sx={{ fontSize: '13px' }}>Info</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={followEnabled}
                  onChange={(e) => setFollowEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography sx={{ fontSize: '13px' }}>Follow</Typography>}
            />
            <Select
              value={mapType}
              onChange={(e) => setMapType(e.target.value)}
              className={classes.select}
              size="small"
            >
              <MenuItem value="osm">OSM Map</MenuItem>
              <MenuItem value="satellite">Satellite</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </Select>
          </Box>

          {/* Content with Info Panel and Map */}
          <Box className={classes.contentWrapper}>
            {renderInfoPanel}
            <Box className={classes.mapWrapper}>
              <Box className={classes.mapContainer} ref={mapContainer} />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FollowDialog;
