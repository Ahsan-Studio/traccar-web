import { useId, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { findFonts, geofenceToFeature } from './core/mapUtil';
import { useAttributePreference } from '../common/util/preferences';
import { loadMarkerIcon } from './core/preloadMarkerIcons';

const MapGeofence = () => {
  const id = useId();

  const theme = useTheme();

  const mapGeofences = useAttributePreference('mapGeofences', true);

  const geofences = useSelector((state) => state.geofences.items);

  useEffect(() => {
    if (mapGeofences) {
      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
      map.addLayer({
        source: id,
        id: 'geofences-fill',
        type: 'fill',
        filter: [
          'all',
          ['==', '$type', 'Polygon'],
        ],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-outline-color': ['get', 'color'],
          'fill-opacity': 0.1,
        },
      });
      map.addLayer({
        source: id,
        id: 'geofences-line',
        type: 'line',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity'],
        },
      });
      
      // Layer for marker icons (only for Point geometries with icon property)
      map.addLayer({
        source: id,
        id: 'geofences-icons',
        type: 'symbol',
        filter: [
          'all',
          ['==', '$type', 'Point'],
          ['has', 'icon'],
        ],
        layout: {
          'icon-image': [
            'case',
            ['has', 'icon'],
            ['get', 'icon'],
            'default-green' // Fallback icon
          ],
          'icon-size': 0.5, // Reduced from 1 to 0.5 for smaller size
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
      });
      
      map.addLayer({
        source: id,
        id: 'geofences-title',
        type: 'symbol',
        layout: {
          'text-field': '{name}',
          'text-font': findFonts(map),
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1],
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });

      return () => {
        if (map.getLayer('geofences-fill')) {
          map.removeLayer('geofences-fill');
        }
        if (map.getLayer('geofences-line')) {
          map.removeLayer('geofences-line');
        }
        if (map.getLayer('geofences-icons')) {
          map.removeLayer('geofences-icons');
        }
        if (map.getLayer('geofences-title')) {
          map.removeLayer('geofences-title');
        }
        if (map.getSource(id)) {
          map.removeSource(id);
        }
      };
    }
    return () => {};
  }, [mapGeofences]);

  useEffect(() => {
    if (mapGeofences) {
      const features = Object.values(geofences)
        .filter((geofence) => !geofence.attributes.hide)
        .map((geofence) => geofenceToFeature(theme, geofence));
      
      console.log('[MapGeofence] Total geofences:', Object.values(geofences).length);
      console.log('[MapGeofence] Visible features:', features.length);
      console.log('[MapGeofence] Features:', features.map(f => ({
        name: f.properties.name,
        type: f.geometry.type,
        hasIcon: !!f.properties.icon,
        icon: f.properties.icon
      })));
      
      // Load any missing icons dynamically
      features.forEach(async (feature) => {
        if (feature.properties.icon && !map.hasImage(feature.properties.icon)) {
          console.log(`[MapGeofence] Loading missing icon: ${feature.properties.icon}`);
          await loadMarkerIcon(feature.properties.icon);
        }
      });
      
      map.getSource(id)?.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [mapGeofences, geofences, theme, id]);

  return null;
};

export default MapGeofence;
