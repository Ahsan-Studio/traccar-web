import { useId, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';

const MapMarkers = ({ markers, showTitles }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  console.log('[MapMarkers] Component mounted/updated', {
    id,
    markersCount: markers?.length || 0,
    showTitles,
    iconScale,
  });

  useEffect(() => {
    console.log('[MapMarkers] Adding source and layer', { id });
    
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    if (showTitles) {
      console.log('[MapMarkers] Adding layer with titles');
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'text-field': '{title}',
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2 * iconScale],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });
    } else {
      console.log('[MapMarkers] Adding layer without titles');
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
        },
      });
    }

    console.log('[MapMarkers] Layer added successfully');

    return () => {
      console.log('[MapMarkers] Cleaning up source and layer', { id });
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [showTitles, id, iconScale]);

  useEffect(() => {
    console.log('[MapMarkers] Updating markers data', {
      id,
      markersCount: markers?.length || 0,
      markers: markers,
    });
    
    const source = map.getSource(id);
    if (!source) {
      console.warn('[MapMarkers] Source not found, skipping data update', { id });
      return;
    }
    
    try {
      const features = (markers || []).map(({ latitude, longitude, image, title }) => {
        console.log('[MapMarkers] Creating feature', { latitude, longitude, image, title });
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          properties: {
            image: image || 'default-neutral',
            title: title || '',
          },
        };
      });
      
      console.log('[MapMarkers] Setting data with features', { featuresCount: features.length });
      
      source.setData({
        type: 'FeatureCollection',
        features: features,
      });
      
      console.log('[MapMarkers] Data updated successfully');
    } catch (error) {
      console.error('[MapMarkers] Error setting data:', error);
    }
  }, [showTitles, markers, id]);

  return null;
};

export default MapMarkers;
