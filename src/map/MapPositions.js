import { useId, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts, loadImage } from './core/mapUtil';
import { speedFromKnots, speedUnitString } from '../common/util/converter';
import { useTranslation } from '../common/components/LocalizationProvider';

// Cache untuk custom device icons yang sudah di-load
const loadedCustomIcons = new Set();

// Function untuk load custom device icon - langsung pakai SVG asli tanpa background
const loadCustomDeviceIcon = async (iconName) => {
  // Skip jika sudah pernah di-load
  if (loadedCustomIcons.has(iconName)) {
    return true;
  }

  try {
    // Load icon SVG langsung dari folder objects - pakai warna asli SVG
    const icon = await loadImage(`/img/markers/objects/${iconName}.svg`);
    
    // Add ke map dengan nama icon (tanpa suffix color)
    // Gunakan iconName langsung karena tidak ada color variants
    if (!map.hasImage(iconName)) {
      map.addImage(iconName, icon, { sdf: false });
    }
    
    // Mark sebagai sudah di-load
    loadedCustomIcons.add(iconName);
    return true;
  } catch (error) {
    console.error(`[loadCustomDeviceIcon] Failed to load "${iconName}":`, error);
    return false;
  }
};

const MapPositions = ({ positions, onMapClick, onMarkerClick, showStatus, selectedPosition }) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  const speedUnit = useAttributePreference('speedUnit');
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const visibility = useSelector((state) => state.devices.visibility);

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const createFeature = (devices, position, selectedPositionId) => {
    const device = devices[position.deviceId];
    let showDirection;
    switch (directionType) {
      case 'none':
        showDirection = false;
        break;
      case 'all':
        showDirection = position.course > 0;
        break;
      default:
        showDirection = selectedPositionId === position.id && position.course > 0;
        break;
    }
    
    // Get custom icon from device attributes if available, otherwise use category
    let iconKey = mapIconKey(device.category);
    let useCustomIcon = false;
    
    if (device.attributes?.icon?.deviceImage) {
      // Extract icon name from path (e.g., "land-car.svg" -> "land-car")
      const customIcon = device.attributes.icon.deviceImage.replace('.svg', '').replace('/img/markers/objects/', '');
      
      // Cek apakah custom icon sudah ada di map (tanpa color suffix karena pakai warna asli)
      if (map.hasImage(customIcon)) {
        iconKey = customIcon;
        useCustomIcon = true;
      }
      // Jika custom icon belum loaded, akan otomatis pakai default category icon
    }
    
    // Format label seperti web lama: "Name (Speed kph)"
    // Gunakan speedFromKnots untuk konversi yang konsisten dengan sidebar
    const speed = position.speed || 0; // speed dalam knots dari server
    const speedConverted = speedFromKnots(speed, speedUnit); // convert ke unit yang dipilih user
    const speedDisplay = Math.round(speedConverted); // No decimal, rounded
    const unitStr = speedUnitString(speedUnit, t); // Get unit string (kph, mph, kn)
    const label = `${device.name} (${speedDisplay} ${unitStr})`;
    
    return {
      id: position.id,
      deviceId: position.deviceId,
      name: device.name,
      label: label, // Label dengan speed untuk tooltip
      fixTime: formatTime(position.fixTime, 'seconds'),
      category: iconKey,
      // Custom icon tidak pakai color suffix, default icon tetap pakai
      color: useCustomIcon ? '' : (showStatus ? position.attributes.color || getStatusColor(device.status) : 'neutral'),
      rotation: position.course,
      direction: showDirection,
    };
  };

  const onMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onMouseLeave = () => map.getCanvas().style.cursor = '';

  const onMapClickCallback = useCallback((event) => {
    if (!event.defaultPrevented && onMapClick) {
      onMapClick(event.lngLat.lat, event.lngLat.lng);
    }
  }, [onMapClick]);

  const onMarkerClickCallback = useCallback((event) => {
    event.preventDefault();
    const feature = event.features[0];
    if (onMarkerClick) {
      onMarkerClick(feature.properties.id, feature.properties.deviceId);
    }
  }, [onMarkerClick]);

  const onClusterClick = useCatchCallback(async (event) => {
    event.preventDefault();
    const features = map.queryRenderedFeatures(event.point, {
      layers: [clusters],
    });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    });
  }, [clusters]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          // Custom icon (no color): '{category}', Default icon (with color): '{category}-{color}'
          'icon-image': [
            'case',
            ['==', ['get', 'color'], ''], // Jika color kosong, berarti custom icon
            ['get', 'category'], // Pakai category saja (custom icon)
            ['concat', ['get', 'category'], '-', ['get', 'color']] // Pakai category-color (default icon)
          ],
          // Custom icon lebih kecil (0.25), default icon normal (iconScale)
          'icon-size': [
            'case',
            ['==', ['get', 'color'], ''], // Jika custom icon
            desktop ? 0.2 : 0.25, // Lebih kecil lagi untuk custom icon
            iconScale // Normal untuk default icon
          ],
          'icon-allow-overlap': true,
          // Gunakan 'label' yang berisi name + speed
          'text-field': '{label}',
          'text-allow-overlap': true,
          // Posisi label di KANAN icon seperti web lama (bukan di bawah)
          'text-anchor': 'left',
          // Offset dari icon ke kanan
          'text-offset': [
            'case',
            ['==', ['get', 'color'], ''],
            ['literal', [1.5, 0]], // Offset untuk custom icon (lebih dekat)
            ['literal', [2.5, 0]] // Offset untuk default icon
          ],
          'text-font': findFonts(map),
          'text-size': 10,
          'text-padding': 8,
          'text-justify': 'left',
          'text-optional': true, // Text tidak wajib, icon lebih prioritas
        },
        paint: {
          // Background putih dengan opacity untuk label
          'text-color': '#333333',
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 4, // Diperkecil agar tidak menutupi icon
          'text-halo-blur': 0.5,
        },
      });
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: [
          'all',
          ['!has', 'point_count'],
          ['==', 'direction', true],
        ],
        layout: {
          'icon-image': 'direction',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClickCallback);
    });
    map.addLayer({
      id: clusters,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClickCallback);

    return () => {
      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClickCallback);

      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClickCallback);

        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        if (map.getLayer(`direction-${source}`)) {
          map.removeLayer(`direction-${source}`);
        }
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [mapCluster, clusters, onMarkerClickCallback, onClusterClick]);

  useEffect(() => {
    const updateMapPositions = async () => {
      try {
        // Load custom device icons jika ada
        const customIconsToLoad = new Set();
        positions
          .filter((it) => devices.hasOwnProperty(it.deviceId))
          .filter((it) => visibility[it.deviceId] !== false)
          .forEach((position) => {
            const device = devices[position.deviceId];
            if (device.attributes?.icon?.deviceImage) {
              const customIcon = device.attributes.icon.deviceImage
                .replace('.svg', '')
                .replace('/img/markers/objects/', '');
              customIconsToLoad.add(customIcon);
            }
          });
        
        // Load semua custom icons dan tunggu selesai
        if (customIconsToLoad.size > 0) {
          await Promise.all(
            Array.from(customIconsToLoad).map(iconName => loadCustomDeviceIcon(iconName))
          );
        }
        
        // Update map sources setelah icons loaded
        [id, selected].forEach((source) => {
          const mapSource = map.getSource(source);
          if (!mapSource) {
            return;
          }
          
          const features = positions.filter((it) => devices.hasOwnProperty(it.deviceId))
            .filter((it) => visibility[it.deviceId] !== false) // Filter by visibility
            .filter((it) => (source === id ? it.deviceId !== selectedDeviceId : it.deviceId === selectedDeviceId))
            .map((position) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [position.longitude, position.latitude],
              },
              properties: createFeature(devices, position, selectedPosition && selectedPosition.id),
            }));
          
          mapSource.setData({
            type: 'FeatureCollection',
            features,
          });
        });
      } catch (error) {
        console.error('[MapPositions] Error updating positions:', error);
      }
    };
    
    updateMapPositions();
  }, [id, selected, selectedDeviceId, devices, positions, selectedPosition, visibility, theme]);

  return null;
};

export default MapPositions;
