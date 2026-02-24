import { useId, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';

const MapRouteMarkers = ({ positions, showStops = true, showEvents = true }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  
  // Small markers - just visible enough to see stops/events without cluttering
  const routeIconScale = iconScale * 0.07;

  // Compute clustered features only when positions change
  const features = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    const result = [];

    // Start marker
    const startPos = positions[0];
    result.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [startPos.longitude, startPos.latitude],
      },
      properties: { image: 'route-start' },
    });

    // End marker
    if (positions.length > 1) {
      const endPos = positions[positions.length - 1];
      result.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [endPos.longitude, endPos.latitude],
        },
        properties: { image: 'route-end' },
      });
    }

    // Cluster consecutive stop positions into single markers
    // and limit total markers to avoid rendering thousands
    let inStop = false;
    let stopCount = 0;
    const maxStopMarkers = 200; // Cap stop markers to prevent overload
    const maxEventMarkers = 100;
    let eventCount = 0;

    for (let i = 1; i < positions.length - 1; i += 1) {
      const position = positions[i];
      const isStop = position.speed !== undefined && position.speed !== null && position.speed < 1;
      const isEvent = position.attributes?.alarm || position.attributes?.event;

      if (isEvent && eventCount < maxEventMarkers) {
        if (showEvents) {
          eventCount += 1;
          result.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: { image: 'route-event' },
          });
        }
      } else if (isStop) {
        if (showStops && !inStop && stopCount < maxStopMarkers) {
          // First position of a new stop cluster → add one marker
          stopCount += 1;
          result.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: { image: 'route-stop' },
          });
          inStop = true;
        }
        // Subsequent consecutive stop positions → skip (same cluster)
      } else {
        // Moving position → reset stop cluster
        inStop = false;
      }
    }

    return result;
  }, [positions, showStops, showEvents]);

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
        'icon-image': ['get', 'image'],
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
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [features, id]);

  return null;
};

export default MapRouteMarkers;
