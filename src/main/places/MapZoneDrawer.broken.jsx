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
 * MapZoneDrawer - Uses MapboxDraw for interactive zone (polygon) drawing
 * Drawing persists until dialog is saved or cancelled
 */
const MapZoneDrawer = ({ enabled, onZoneChange }) => {
  const drawRef = useRef(null);

  const draw = useMemo(() => new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
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

    // Automatically activate polygon drawing mode when dialog opens
    setTimeout(() => {
      if (drawRef.current) {
        drawRef.current.changeMode('draw_polygon');
      }
    }, 100);

    // Custom double-click handler to finish polygon anywhere on map
    const handleDblClick = (e) => {
      if (drawRef.current && drawRef.current.getMode() === 'draw_polygon') {
        const features = drawRef.current.getAll();
        if (features.features.length > 0) {
          const lastFeature = features.features[features.features.length - 1];
          // Check if we have at least 3 points (minimum for polygon)
          if (lastFeature.geometry.coordinates[0] && lastFeature.geometry.coordinates[0].length >= 3) {
            // Finish the drawing by changing mode
            drawRef.current.changeMode('simple_select');
            // Trigger create event manually
            const area = geometryToArea(lastFeature.geometry);
            onZoneChange(area);
          }
        }
      }
    };

    // Listen for draw.create event (when user double-clicks to finish polygon)
    const handleCreate = (e) => {
      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onZoneChange(area);
    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);
    map.on('dblclick', handleDblClick);

    // Cleanup when component unmounts
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      map.off('dblclick', handleDblClick);
      const area = geometryToArea(feature.geometry);
      onZoneChange(area);
    };

    // Listen for draw.delete event (when user clicks trash)
    const handleDelete = () => {
      onZoneChange('');
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // Cleanup when component unmounts
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      
      // Remove control and clear drawings when dialog closes
      if (!enabled && drawRef.current) {
        try {
          drawRef.current.deleteAll();
          if (map._controls.includes(drawRef.current)) {
            map.removeControl(drawRef.current);
          }
        } catch (e) {
          console.warn('Error cleaning up MapboxDraw:', e);
        }
        drawRef.current = null;
      }
    };
  }, [enabled, onZoneChange, draw]);

  return null;
};

export default MapZoneDrawer;
