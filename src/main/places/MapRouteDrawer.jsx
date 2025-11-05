import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useMemo, useRef } from 'react';
import { map } from '../../map/core/MapView';
import { geometryToArea } from '../../map/core/mapUtil';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

/**
 * MapRouteDrawer - Uses MapboxDraw for interactive route (polyline) drawing
 * Drawing persists until dialog is saved or cancelled
 * Double-click to finish line
 */
const MapRouteDrawer = ({ enabled, onRouteChange, color = '#2196F3', polylineDistance = 100, onDrawReady }) => {
  const drawRef = useRef(null);

  // Create custom theme with dynamic color and width
  const customTheme = useMemo(() => {
    const width = parseInt(polylineDistance) / 50; // Convert distance to line width (100m = 2px)
    const lineWidth = Math.max(2, Math.min(width, 8)); // Clamp between 2-8px
    
    return [
      // Active line (being drawn)
      {
        'id': 'gl-draw-line',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': color,
          'line-width': lineWidth
        }
      },
      // Inactive line (already drawn)
      {
        'id': 'gl-draw-line-inactive',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'LineString'], ['==', 'active', 'false']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': color,
          'line-width': lineWidth
        }
      },
      // Vertex points
      {
        'id': 'gl-draw-polygon-and-line-vertex-halo-active',
        'type': 'circle',
        'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
        'paint': {
          'circle-radius': 6,
          'circle-color': '#FFF'
        }
      },
      {
        'id': 'gl-draw-polygon-and-line-vertex-active',
        'type': 'circle',
        'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
        'paint': {
          'circle-radius': 4,
          'circle-color': color
        }
      },
    ];
  }, [color, polylineDistance]);

  const draw = useMemo(() => new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      line_string: true,
      trash: true,
    },
    styles: customTheme,
  }), [customTheme]);

  // Setup and update draw control
  useEffect(() => {
    if (!enabled || !map) return;
    
    // Get current features if control already exists
    const currentFeatures = drawRef.current ? drawRef.current.getAll() : null;
    
    // Remove old control if it exists
    if (drawRef.current) {
      try {
        if (map._controls && map._controls.includes(drawRef.current)) {
          map.removeControl(drawRef.current);
        }
      } catch (e) {
        console.warn('Error removing draw control:', e);
      }
    }
    
    // Add new control with updated theme
    map.addControl(draw, 'top-left');
    drawRef.current = draw;
    
    // Expose function to get current features (including unfinished drawing)
    if (onDrawReady) {
      onDrawReady(() => {
        if (drawRef.current) {
          return drawRef.current.getAll();
        }
        return null;
      });
    }
    
    // Restore features or activate drawing mode
    if (currentFeatures && currentFeatures.features && currentFeatures.features.length > 0) {
      // Restore existing features
      currentFeatures.features.forEach(feature => {
        draw.add(feature);
      });
      // Keep in select mode if there are features
      draw.changeMode('simple_select');
    }
    
    // Always try to activate drawing mode if no complete features exist
    // This ensures user can start drawing immediately when dialog opens
    setTimeout(() => {
      if (drawRef.current) {
        const allFeatures = drawRef.current.getAll();
        const hasCompleteFeatures = allFeatures.features && allFeatures.features.length > 0;
        
        // Only auto-activate if no features or if we're in simple_select mode
        if (!hasCompleteFeatures) {
          drawRef.current.changeMode('draw_line_string');
        }
      }
    }, 150);
  }, [draw, enabled, onDrawReady]);

  // Handle draw events
  useEffect(() => {
    if (!enabled || !map) return;

    // Listen for draw.create event (when user double-clicks to finish)
    const handleCreate = (e) => {
      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onRouteChange(area);
      // Switch to simple_select mode after creating to allow editing
      if (drawRef.current) {
        drawRef.current.changeMode('simple_select', { featureIds: [feature.id] });
      }
    };

    // Listen for draw.update event (when user edits vertices)
    const handleUpdate = (e) => {
      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onRouteChange(area);
    };

    // Listen for draw.delete event (when user clicks trash)
    const handleDelete = () => {
      onRouteChange('');
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // Cleanup event listeners
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
    };
  }, [enabled, onRouteChange, draw]);

  // Separate effect for cleanup when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      // Always cleanup when component unmounts
      if (drawRef.current) {
        try {
          drawRef.current.deleteAll();
          if (map && map._controls && map._controls.includes(drawRef.current)) {
            map.removeControl(drawRef.current);
          }
        } catch (e) {
          console.warn('Error cleaning up MapboxDraw:', e);
        }
        drawRef.current = null;
      }
    };
  }, []); // Empty deps - only runs on mount/unmount

  return null;
};

export default MapRouteDrawer;
