import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from '../../map/core/MapView';

/**
 * MapZoneDrawer - Interactive polygon drawing on map for zones
 * User can click points on map to create zone boundary
 */
const MapZoneDrawer = ({ enabled, onZoneChange, initialZone }) => {
  const pointsRef = useRef([]);
  const markersRef = useRef([]);
  const polygonLayerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !map) return;

    // Initialize from existing zone
    if (initialZone) {
      const match = initialZone.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (match) {
        const coords = match[1].split(',').map(pair => {
          const [lat, lng] = pair.trim().split(/\s+/);
          return [parseFloat(lng), parseFloat(lat)];
        });
        pointsRef.current = coords.slice(0, -1); // Remove duplicate closing point
        updatePolygon();
      }
    }

    // Change cursor to crosshair
    map.getCanvas().style.cursor = 'crosshair';

    // Add polygon source
    if (!map.getSource('zone-drawing-polygon')) {
      map.addSource('zone-drawing-polygon', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[]]
          }
        }
      });

      // Fill layer
      map.addLayer({
        id: 'zone-drawing-fill',
        type: 'fill',
        source: 'zone-drawing-polygon',
        paint: {
          'fill-color': '#FF5733',
          'fill-opacity': 0.3
        }
      });

      // Outline layer
      map.addLayer({
        id: 'zone-drawing-outline',
        type: 'line',
        source: 'zone-drawing-polygon',
        paint: {
          'line-color': '#FF5733',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      polygonLayerRef.current = 'zone-drawing-polygon';
    }

    // Click handler to add points
    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      pointsRef.current.push([lng, lat]);

      // Add marker
      const markerEl = document.createElement('div');
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.backgroundColor = '#FF5733';
      markerEl.style.border = '2px solid white';
      markerEl.style.borderRadius = '50%';
      markerEl.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);

      // Update polygon
      updatePolygon();

      // Notify parent (need at least 3 points for polygon)
      if (pointsRef.current.length >= 3) {
        const polygon = [...pointsRef.current, pointsRef.current[0]] // Close polygon
          .map(([lng, lat]) => `${lat} ${lng}`)
          .join(', ');
        onZoneChange(`POLYGON ((${polygon}))`);
      }
    };

    // Right-click to undo last point
    const handleRightClick = (e) => {
      e.preventDefault();
      if (pointsRef.current.length > 0) {
        pointsRef.current.pop();
        const lastMarker = markersRef.current.pop();
        if (lastMarker) lastMarker.remove();
        updatePolygon();

        if (pointsRef.current.length >= 3) {
          const polygon = [...pointsRef.current, pointsRef.current[0]]
            .map(([lng, lat]) => `${lat} ${lng}`)
            .join(', ');
          onZoneChange(`POLYGON ((${polygon}))`);
        } else {
          onZoneChange(null);
        }
      }
    };

    const updatePolygon = () => {
      if (map.getSource('zone-drawing-polygon')) {
        const coords = pointsRef.current.length >= 3 
          ? [[...pointsRef.current, pointsRef.current[0]]] // Close polygon
          : [pointsRef.current];
        
        map.getSource('zone-drawing-polygon').setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coords
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

      // Remove layers and source
      if (map.getLayer('zone-drawing-fill')) {
        map.removeLayer('zone-drawing-fill');
      }
      if (map.getLayer('zone-drawing-outline')) {
        map.removeLayer('zone-drawing-outline');
      }
      if (map.getSource('zone-drawing-polygon')) {
        map.removeSource('zone-drawing-polygon');
      }

      pointsRef.current = [];
    };
  }, [enabled, onZoneChange, initialZone]);

  return null; // No UI, just map interaction
};

export default MapZoneDrawer;
