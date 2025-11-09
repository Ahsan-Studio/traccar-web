import { useId, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';

const MapRouteMarkers = ({ positions }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  
  // Use much smaller size for route markers (about 9% of normal size)
  const routeIconScale = iconScale * 0.08;

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': '{image}',
        'icon-size': routeIconScale,
        'icon-allow-overlap': true,
      },
    });

    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, routeIconScale]);

  useEffect(() => {
    const source = map.getSource(id);
    if (!source || !positions || positions.length === 0) {
      return;
    }

    const features = [];

    // Add start marker (first position)
    if (positions.length > 0) {
      const startPos = positions[0];
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [startPos.longitude, startPos.latitude],
        },
        properties: {
          image: 'route-start',
        },
      });
    }

    // Add end marker (last position)
    if (positions.length > 1) {
      const endPos = positions[positions.length - 1];
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [endPos.longitude, endPos.latitude],
        },
        properties: {
          image: 'route-end',
        },
      });
    }

    // Add markers for stops and events (excluding first and last)
    for (let i = 1; i < positions.length - 1; i++) {
      const position = positions[i];
      
      // Check if it's an event
      if (position.attributes?.alarm || position.attributes?.event) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
          properties: {
            image: 'route-event',
          },
        });
      }
      // Check if it's a stop (speed is 0 or very low)
      else if (position.speed !== undefined && position.speed !== null && position.speed < 1) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
          properties: {
            image: 'route-stop',
          },
        });
      }
    }

    source.setData({
      type: 'FeatureCollection',
      features: features,
    });
  }, [positions, id]);

  return null;
};

export default MapRouteMarkers;
