import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useRef } from 'react';
import { map } from '../../map/core/MapView';
import { geometryToArea } from '../../map/core/mapUtil';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

/**
 * MapZoneDrawer - Uses MapboxDraw for interactive zone (polygon) drawing.
 * Creates a FRESH MapboxDraw instance each time enabled becomes true or
 * color changes, avoiding stale-instance bugs with re-added controls.
 * Auto-activates polygon drawing when enabled (no manual tool click needed).
 * Double-click to finish polygon.
 */
const MapZoneDrawer = ({ enabled, onZoneChange, color = '#3388ff', onDrawReady, initialArea }) => {
  const drawRef = useRef(null);
  const savedFeaturesRef = useRef(null);

  // Stable callback refs — avoids putting callbacks in effect deps
  const onZoneChangeRef = useRef(onZoneChange);
  const onDrawReadyRef = useRef(onDrawReady);
  useEffect(() => { onZoneChangeRef.current = onZoneChange; }, [onZoneChange]);
  useEffect(() => { onDrawReadyRef.current = onDrawReady; }, [onDrawReady]);

  // Clear saved features when dialog closes (enabled→false) so next open starts fresh
  useEffect(() => {
    if (!enabled) {
      savedFeaturesRef.current = null;
    }
  }, [enabled]);

  // ──────────────────────────────────────────────────────────────────────
  // MAIN EFFECT: create a fresh MapboxDraw each time enabled becomes true
  // or color changes while enabled.
  // Cleanup removes the control entirely — no stale instance is ever reused.
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !map) return undefined;

    // Build draw styles with current color
    const styles = [
      {
        id: 'gl-draw-polygon-fill',
        type: 'fill',
        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        paint: { 'fill-color': color, 'fill-opacity': 0.3 },
      },
      {
        id: 'gl-draw-polygon-stroke-active',
        type: 'line',
        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': 2 },
      },
      {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'false']],
        paint: { 'fill-color': color, 'fill-opacity': 0.3 },
      },
      {
        id: 'gl-draw-polygon-stroke-inactive',
        type: 'line',
        filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'false']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': 2 },
      },
      {
        id: 'gl-draw-polygon-and-line-vertex-halo-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
        paint: { 'circle-radius': 6, 'circle-color': '#FFF' },
      },
      {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
        paint: { 'circle-radius': 4, 'circle-color': color },
      },
      {
        id: 'gl-draw-polygon-midpoint',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
        paint: { 'circle-radius': 3, 'circle-color': color },
      },
    ];

    // ── Create a FRESH MapboxDraw instance ──
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles,
    });

    map.addControl(drawInstance, 'top-left');
    drawRef.current = drawInstance;

    // ── Monkey-patch changeMode to lock after first feature ──
    let drawingLocked = false;
    const originalChangeMode = drawInstance.changeMode.bind(drawInstance);
    drawInstance.changeMode = (mode, opts) => {
      if (drawingLocked && typeof mode === 'string' && mode.startsWith('draw_')) {
        return;
      }
      originalChangeMode(mode, opts);
    };

    // Expose getCurrentFeatures to parent dialog
    if (onDrawReadyRef.current) {
      onDrawReadyRef.current(() => (drawRef.current ? drawRef.current.getAll() : null));
    }

    // Disable double-click zoom while drawing
    map.doubleClickZoom.disable();

    // ── Determine initial state ──
    const saved = savedFeaturesRef.current;
    savedFeaturesRef.current = null;
    let autoActivate = true;

    if (saved && saved.features && saved.features.length > 0) {
      saved.features.forEach((f) => drawInstance.add(f));
      originalChangeMode('simple_select');
      drawingLocked = true;
      autoActivate = false;
    } else if (initialArea && initialArea.startsWith('POLYGON')) {
      const match = initialArea.match(/POLYGON\s*\(\s*\(([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map((c) => {
          const [lat, lng] = c.trim().split(/\s+/).map(parseFloat);
          return [lng, lat];
        });
        if (coords.length >= 4) {
          drawInstance.add({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {},
          });
          originalChangeMode('simple_select');
          drawingLocked = true;
          autoActivate = false;
        }
      }
    }

    if (autoActivate) {
      setTimeout(() => {
        if (drawRef.current === drawInstance && !drawingLocked) {
          try { originalChangeMode('draw_polygon'); } catch { /* ignore */ }
        }
      }, 200);
    }

    // ── Bind draw events ──
    let handlingCreate = false;
    const handleCreate = (e) => {
      if (handlingCreate) return;
      handlingCreate = true;

      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onZoneChangeRef.current(area);

      drawingLocked = true;

      const featureId = feature.id;
      setTimeout(() => {
        if (drawRef.current !== drawInstance) return;
        const all = drawInstance.getAll();
        if (all.features.length > 1) {
          all.features.forEach((f) => {
            if (f.id !== featureId) drawInstance.delete(f.id);
          });
        }
        try { originalChangeMode('simple_select', { featureIds: [featureId] }); } catch { /* ignore */ }
        handlingCreate = false;
      }, 0);
    };

    const handleUpdate = (e) => {
      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onZoneChangeRef.current(area);
    };

    const handleDelete = () => {
      drawingLocked = false;
      onZoneChangeRef.current('');
      setTimeout(() => {
        if (drawRef.current === drawInstance && !drawingLocked) {
          try { originalChangeMode('draw_polygon'); } catch { /* ignore */ }
        }
      }, 100);
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // ── Cleanup ──
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);

      try { savedFeaturesRef.current = drawInstance.getAll(); } catch { /* ignore */ }

      try {
        drawInstance.deleteAll();
        if (map._controls && map._controls.includes(drawInstance)) {
          map.removeControl(drawInstance);
        }
      } catch { /* ignore */ }
      map.doubleClickZoom.enable();

      if (drawRef.current === drawInstance) drawRef.current = null;
    };
  }, [enabled, color, initialArea]);

  return null;
};

export default MapZoneDrawer;
