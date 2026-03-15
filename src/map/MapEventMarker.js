import { useId, useEffect } from 'react';
import { map } from './core/MapView';
import { findFonts } from './core/mapUtil';

const EVENT_ICON = 'event-marker';

// Create an "E" icon for event markers
const createEventIcon = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  // Draw circle background (orange/red for events)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FF5722';
  ctx.fill();
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw "E" letter in white
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', cx, cy);

  // Return ImageData with proper width/height for maplibre
  const imageData = ctx.getImageData(0, 0, size, size);
  return { data: imageData, width: size, height: size };
};

const ensureEventIcon = () => {
  if (map.hasImage(EVENT_ICON)) return;

  try {
    const iconData = createEventIcon();
    map.addImage(EVENT_ICON, iconData.data, { sdf: false });
  } catch (error) {
    console.warn('Failed to add event icon:', error);
  }
};

const MapEventMarker = ({ position, label }) => {
  const id = useId();

  // Initialize source and layers
  useEffect(() => {
    ensureEventIcon();

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
        'icon-image': EVENT_ICON,
        'icon-size': 0.6,
        'icon-allow-overlap': true,
        'text-field': ['get', 'label'],
        'text-allow-overlap': true,
        'text-anchor': 'left',
        'text-offset': [2, 0],
        'text-font': findFonts(map),
        'text-size': 12,
        'text-optional': true,
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': 'rgba(255, 255, 255, 0.95)',
        'text-halo-width': 2,
        'text-halo-blur': 1,
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
  }, [id]);

  // Update marker position
  useEffect(() => {
    const source = map.getSource(id);
    if (!source) return;

    if (!position || !position.latitude || !position.longitude) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.longitude, position.latitude],
        },
        properties: {
          label: label || '',
        },
      }],
    });
  }, [position, label, id]);

  return null;
};

export default MapEventMarker;
