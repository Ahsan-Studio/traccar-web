import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useMemo, useRef } from 'react';
import { map } from '../../map/core/MapView';
import { geometryToArea } from '../../map/core/mapUtil';
import drawTheme from '../../map/draw/theme';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

/**
 * MapRouteDrawer - Uses MapboxDraw for interactive route (polyline) drawing
 * Drawing persists until dialog is saved or cancelled
 * Double-click to finish line
 */
const MapRouteDrawer = ({ enabled, onRouteChange }) => {
  const drawRef = useRef(null);

  const draw = useMemo(() => new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      line_string: true,
      trash: true,
    },
    styles: drawTheme,
  }), []);

  useEffect(() => {
    if (!enabled || !map) return;

    // Check if control already exists on map
    const existingControl = map._controls.find(ctrl => ctrl instanceof MapboxDraw);
    
    if (!existingControl) {
      map.addControl(draw, 'top-left');
      drawRef.current = draw;
    } else {
      drawRef.current = existingControl;
    }

    // Automatically activate line drawing mode when dialog opens
    setTimeout(() => {
      if (drawRef.current) {
        drawRef.current.changeMode('draw_line_string');
      }
    }, 100);

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
