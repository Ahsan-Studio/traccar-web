import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../../map/core/MapView';

/**
 * MapRouteDrawer - Interactive polyline drawing on map for routes
 * User can click points on map to create route path
 */
const MapRouteDrawer = ({ enabled, onRouteChange, initialRoute }) => {
  const pointsRef = useRef([]);
  const markersRef = useRef([]);
  const lineLayerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !map) return;

    // Initialize from existing route
    if (initialRoute) {
      const match = initialRoute.match(/LINESTRING\s*\(([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map(pair => {
          const [lat, lng] = pair.trim().split(/\s+/);
          return [parseFloat(lng), parseFloat(lat)];
        });
        pointsRef.current = coords;
        updateLine();
      }
    }

    // Change cursor to crosshair
    map.getCanvas().style.cursor = 'crosshair';

    // Add line source
    if (!map.getSource('route-drawing-line')) {
      map.addSource('route-drawing-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pointsRef.current
          }
        }
      });

      map.addLayer({
        id: 'route-drawing-line',
        type: 'line',
        source: 'route-drawing-line',
        paint: {
          'line-color': '#2196F3',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      lineLayerRef.current = 'route-drawing-line';
    }

    // Click handler to add points
    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      pointsRef.current.push([lng, lat]);

      // Add marker
      const markerEl = document.createElement('div');
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.backgroundColor = '#2196F3';
      markerEl.style.border = '2px solid white';
      markerEl.style.borderRadius = '50%';
      markerEl.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);

      // Update line
      updateLine();

      // Notify parent
      if (pointsRef.current.length >= 2) {
        const linestring = pointsRef.current
          .map(([lng, lat]) => `${lat} ${lng}`)
          .join(', ');
        onRouteChange(`LINESTRING (${linestring})`);
      }
    };

    // Right-click to undo last point
    const handleRightClick = (e) => {
      e.preventDefault();
      if (pointsRef.current.length > 0) {
        pointsRef.current.pop();
        const lastMarker = markersRef.current.pop();
        if (lastMarker) lastMarker.remove();
        updateLine();

        if (pointsRef.current.length >= 2) {
          const linestring = pointsRef.current
            .map(([lng, lat]) => `${lat} ${lng}`)
            .join(', ');
          onRouteChange(`LINESTRING (${linestring})`);
        } else {
          onRouteChange(null);
        }
      }
    };

    const updateLine = () => {
      if (map.getSource('route-drawing-line')) {
        map.getSource('route-drawing-line').setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pointsRef.current
          }
        });
      }
    };

    map.on('click', handleClick);
    map.on('contextmenu', handleRightClick);

    return () => {
      // Cleanup
      map.off('click', handleClick);
      map.off('contextmenu', handleRightClick);
      map.getCanvas().style.cursor = '';

      // Remove markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Remove layer and source
      if (map.getLayer('route-drawing-line')) {
        map.removeLayer('route-drawing-line');
      }
      if (map.getSource('route-drawing-line')) {
        map.removeSource('route-drawing-line');
      }

      pointsRef.current = [];
    };
  }, [enabled, onRouteChange, initialRoute]);

  return null; // No UI, just map interaction
};

export default MapRouteDrawer;
