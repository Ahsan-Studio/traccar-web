import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';

const MapCamera = ({
  latitude, longitude, positions, coordinates,
}) => {
  useEffect(() => {
    if (coordinates || positions) {
      if (!coordinates) {
        coordinates = positions.map((item) => [item.longitude, item.latitude]);
      }
      if (coordinates.length) {
        // Add delay to ensure route is rendered first and map is ready
        const timer = setTimeout(() => {
          const bounds = coordinates.reduce((bounds, item) => bounds.extend(item), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          const canvas = map.getCanvas();

          // Use object padding for different sides
          map.fitBounds(bounds, {
            padding: Math.min(canvas.width, canvas.height)*0.1, // 10% of smaller dimension for consistent padding
            duration: 1000,
            maxZoom: 10, // Prevent zooming in too close
            animate: true,
          });
        }, 500); // Increased delay from 100ms to 500ms to ensure rendering is complete
        return () => clearTimeout(timer);
      }
    } else if (latitude && longitude) {
      map.jumpTo({
        center: [longitude, latitude],
        zoom: Math.max(map.getZoom(), 10),
      });
    }
  }, [latitude, longitude, positions, coordinates]);

  return null;
};

export default MapCamera;
