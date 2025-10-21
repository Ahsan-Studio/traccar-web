import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../../map/core/MapView';

const MapMarkerPreview = ({ enabled, location, icon }) => {
  useEffect(() => {
    if (!enabled || !location) {
      return undefined;
    }

    console.log('MapMarkerPreview: Creating marker', { location, icon });

    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker-preview-temp';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.style.backgroundImage = `url(/img/markers/places/${icon || 'pin-1.svg'})`;
    el.style.cursor = 'pointer';
    el.style.zIndex = '1000';

    // Add marker to map
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

    console.log('MapMarkerPreview: Marker added', marker);

    // Cleanup
    return () => {
      console.log('MapMarkerPreview: Removing marker');
      marker.remove();
    };
  }, [enabled, location, icon]);

  return null;
};

export default MapMarkerPreview;
