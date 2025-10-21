import { useEffect } from 'react';
import { map } from '../../map/core/MapView';

const MapClickHandler = ({ enabled, onMapClick }) => {
  useEffect(() => {
    if (!enabled || !onMapClick) {
      return undefined;
    }

    const handleMapClick = (e) => {
      const { lng, lat } = e.lngLat;
      onMapClick({
        latitude: lat,
        longitude: lng,
      });
    };

    // Add click listener
    map.on('click', handleMapClick);

    // Change cursor to crosshair when enabled
    map.getCanvas().style.cursor = 'crosshair';

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [enabled, onMapClick]);

  return null; // This component doesn't render anything
};

export default MapClickHandler;
