import { useId, useEffect, useMemo } from 'react';
import { map } from './core/MapView';

const MapRouteDataPoints = ({ positions }) => {
  const id = useId();

  const features = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    return positions.map((pos, idx) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [pos.longitude, pos.latitude],
      },
      properties: {
        index: idx,
        speed: pos.speed || 0,
      },
    }));
  }, [positions]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 3,
        'circle-color': '#1565c0',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
      },
    });

    return () => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [id]);

  useEffect(() => {
    const source = map.getSource(id);
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [features, id]);

  return null;
};

export default MapRouteDataPoints;
