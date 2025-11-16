import {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  formatTime, formatCoordinate, formatSpeed, formatDistance,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#4a90e2',
    color: 'white',
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2),
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  content: {
    flex: 1,
    display: 'flex',
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
    minHeight: '400px',
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

const FollowPage = () => {
  const { classes } = useStyles();
  const { deviceId } = useParams();
  const t = useTranslation();
  
  const [showInfo, setShowInfo] = useState(true);
  const [followEnabled, setFollowEnabled] = useState(true);
  const [mapType, setMapType] = useState('osm');
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const prevPositionRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Memoize selectors untuk performa
  const device = useSelector((state) => 
    state.devices.items[deviceId]
  );
  
  const position = useSelector((state) => 
    device ? state.session.positions[device.id] : null
  );

  // Memoize map style configuration
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

  // Initialize map on mount - optimized
  useEffect(() => {
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

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [position, getMapStyle]);

  // Handle map type change - optimized
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;

    const map = mapInstance.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    map.setStyle(getMapStyle(mapType));

    map.once('styledata', () => {
      map.jumpTo({ center: currentCenter, zoom: currentZoom });
      
      if (markerRef.current && position) {
        const coordinates = [position.longitude, position.latitude];
        markerRef.current.setLngLat(coordinates);
      }
    });
  }, [mapType, mapReady, position, getMapStyle]);

  // Update marker position - optimized with distance threshold
  useEffect(() => {
    if (mapInstance.current && mapReady && position && device) {
      const coordinates = [position.longitude, position.latitude];

      if (!markerRef.current) {
        // Lazy load marker element
        const el = document.createElement('div');
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.cursor = 'pointer';
        
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
        
        const category = device.category || 'default';
        const iconUrl = `/img/markers/objects/${category}.svg`;
        
        img.src = iconUrl;
        img.onerror = () => {
          img.src = '/img/markers/objects/default.svg';
        };
        
        el.appendChild(img);

        markerRef.current = new maplibregl.Marker({ 
          element: el,
          anchor: 'center',
        })
          .setLngLat(coordinates)
          .addTo(mapInstance.current);

        prevPositionRef.current = coordinates;
      } else {
        // Only update if position changed significantly (>1 meter threshold)
        const [prevLng, prevLat] = prevPositionRef.current || [0, 0];
        const [newLng, newLat] = coordinates;
        const threshold = 0.00001; // ~1 meter
        
        if (Math.abs(newLng - prevLng) > threshold || Math.abs(newLat - prevLat) > threshold) {
          markerRef.current.setLngLat(coordinates);
          prevPositionRef.current = coordinates;
        }
      }

      if (followEnabled && mapInstance.current) {
        mapInstance.current.flyTo({
          center: coordinates,
          zoom: 15,
          duration: 500,
          essential: true,
        });
      }
    }
  }, [position, followEnabled, device, mapReady]);

  // Memoized info panel for performance
  const renderInfoPanel = useMemo(() => {
    if (!showInfo || !device || !position) return null;

    const generalData = [];
    const locationData = [];
    const serviceData = [];

    // General data
    if (position.attributes?.hours !== undefined) {
      const hours = (position.attributes.hours / 3600000).toFixed(1);
      generalData.push({ label: 'Engine hours', value: `${hours} h` });
    }
    
    if (device.model) {
      generalData.push({ label: 'Model', value: device.model });
    }
    
    if (position.attributes?.totalDistance !== undefined) {
      generalData.push({ label: 'Odometer', value: formatDistance(position.attributes.totalDistance, 'km', t) });
    }
    
    if (device.attributes?.plateNumber) {
      generalData.push({ label: 'Plate', value: device.attributes.plateNumber });
    }
    
    if (device.phone) {
      generalData.push({ label: 'SIM card number', value: device.phone });
    }
    
    if (position) {
      let status = 'Stopped';
      if (position.attributes?.ignition === true) {
        status = position.speed > 5 ? 'Moving' : 'Engine Idle';
      }
      generalData.push({ label: 'Status', value: status });
    }
    
    if (device.attributes?.vin) {
      generalData.push({ label: 'VIN', value: device.attributes.vin });
    }
    
    if (position.attributes?.driverName) {
      generalData.push({ label: 'Driver', value: position.attributes.driverName });
    }
    
    if (position.attributes?.trailerName) {
      generalData.push({ label: 'Trailer', value: position.attributes.trailerName });
    }

    if (device.attributes) {
      Object.keys(device.attributes).forEach(key => {
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
      locationData.push({ label: 'Angle', value: `${Math.round(position.course)}°` });
    }
    locationData.push({
      label: 'Position',
      value: `${formatCoordinate('latitude', position.latitude, 'dd')}, ${formatCoordinate('longitude', position.longitude, 'dd')}`,
    });
    if (position.speed !== undefined) {
      locationData.push({ label: 'Speed', value: formatSpeed(position.speed, 'kmh', t) });
    }
    if (position.fixTime) {
      locationData.push({ label: 'Time (position)', value: formatTime(position.fixTime, 'seconds') });
    }
    if (position.serverTime) {
      locationData.push({ label: 'Time (server)', value: formatTime(position.serverTime, 'seconds') });
    }
    if (position.attributes?.ignition !== undefined) {
      locationData.push({ label: 'EngineStatus', value: position.attributes.ignition ? 'on' : 'off' });
    }

    // Service data
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
  }, [showInfo, device, position, classes, t]);

  if (!device) {
    return (
      <Box className={classes.root}>
        <Box className={classes.header}>
          <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
            Device not found
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      {/* Header */}
      <Box className={classes.header}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
          Follow ({device.name})
        </Typography>
      </Box>

      {/* Controls */}
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

      {/* Content */}
      <Box className={classes.content}>
        {renderInfoPanel}
        <Box className={classes.mapWrapper}>
          <Box className={classes.mapContainer} ref={mapContainer} />
        </Box>
      </Box>
    </Box>
  );
};

export default FollowPage;
