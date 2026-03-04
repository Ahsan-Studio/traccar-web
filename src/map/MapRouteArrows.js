import { useId, useEffect, useMemo } from 'react';
import { map } from './core/MapView';

const ARROW_IMAGE_ID = 'route-direction-arrow';

// Create a small arrow canvas image pointing right (→) for use with symbol-placement: line
const ensureArrowImage = () => {
  if (map.hasImage(ARROW_IMAGE_ID)) return;

  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Draw a right-pointing arrow (▶) that MapLibre will rotate along the line
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.moveTo(3, 2);
  ctx.lineTo(13, 8);
  ctx.lineTo(3, 14);
  ctx.closePath();
  ctx.fill();

  map.addImage(ARROW_IMAGE_ID, { width: size, height: size, data: ctx.getImageData(0, 0, size, size).data });
};

const MapRouteArrows = ({ coordinates }) => {
  const id = useId();

  // Downsample coordinates to place arrows every ~150px worth of distance
  const arrowFeatures = useMemo(() => {
    if (!coordinates || coordinates.length < 2) return [];

    // Place an arrow roughly every 20 coordinate points (adaptive)
    const step = Math.max(1, Math.floor(coordinates.length / 300));
    const features = [];

    for (let i = step; i < coordinates.length - 1; i += step) {
      const [lng, lat] = coordinates[i];
      const [prevLng, prevLat] = coordinates[i - 1];

      // Calculate bearing between previous and current point
      const dLng = ((lng - prevLng) * Math.PI) / 180;
      const lat1 = (prevLat * Math.PI) / 180;
      const lat2 = (lat * Math.PI) / 180;
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      const bearing = (Math.atan2(y, x) * 180) / Math.PI;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          bearing,
        },
      });
    }

    return features;
  }, [coordinates]);

  useEffect(() => {
    ensureArrowImage();

    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': ARROW_IMAGE_ID,
        'icon-size': 0.9,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
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
      source.setData({ type: 'FeatureCollection', features: arrowFeatures });
    }
  }, [arrowFeatures, id]);

  return null;
};

export default MapRouteArrows;
