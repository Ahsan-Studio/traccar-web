import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useCallback } from 'react';
import { map } from '../../map/core/MapView';
import { geometryToArea } from '../../map/core/mapUtil';

MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

/**
 * MapRouteDrawer - Uses MapboxDraw for interactive route (polyline) drawing.
 * Creates a FRESH MapboxDraw instance each time enabled becomes true or
 * theme props change, avoiding stale-instance bugs with re-added controls.
 * Auto-activates linestring drawing when enabled (no manual tool click needed).
 * After the user double-clicks to finish, drawing is LOCKED — changeMode is
 * monkey-patched to block any re-entry into draw modes.
 * Shows "Route start" / "Route end" tooltips on first/last vertex.
 */
const MapRouteDrawer = ({ enabled, onRouteChange, color = '#2196F3', polylineDistance = 100, onDrawReady, initialArea }) => {
  const drawRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const savedFeaturesRef = useRef(null);

  // Stable callback refs — avoids putting callbacks in effect deps
  const onRouteChangeRef = useRef(onRouteChange);
  const onDrawReadyRef = useRef(onDrawReady);
  useEffect(() => { onRouteChangeRef.current = onRouteChange; }, [onRouteChange]);
  useEffect(() => { onDrawReadyRef.current = onDrawReady; }, [onDrawReady]);

  // Helper to create a tooltip label marker on the map
  const createLabelMarker = useCallback((lngLat, text) => {
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;align-items:center;pointer-events:none;';
    const handle = document.createElement('div');
    handle.style.cssText = 'width:10px;height:10px;background:white;border:1px solid #999;flex-shrink:0;';
    const label = document.createElement('div');
    label.style.cssText = 'background:white;padding:1px 6px;font-size:11px;color:#333;border:1px solid #ccc;white-space:nowrap;margin-left:4px;';
    label.textContent = text;
    el.appendChild(handle);
    el.appendChild(label);
    return new maplibregl.Marker({ element: el, anchor: 'left', offset: [6, 0] })
      .setLngLat(lngLat)
      .addTo(map);
  }, []);

  // Update start/end tooltip markers based on coordinates
  const updateRouteMarkers = useCallback((coords) => {
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
    if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null; }
    if (coords && coords.length >= 2) {
      startMarkerRef.current = createLabelMarker(coords[0], 'Route start');
      endMarkerRef.current = createLabelMarker(coords[coords.length - 1], 'Route end');
    }
  }, [createLabelMarker]);

  // Clear saved features when dialog closes (enabled→false) so next open starts fresh
  useEffect(() => {
    if (!enabled) {
      savedFeaturesRef.current = null;
    }
  }, [enabled]);

  // ──────────────────────────────────────────────────────────────────────
  // MAIN EFFECT: create a fresh MapboxDraw each time enabled becomes true
  // or theme (color / polylineDistance) changes while enabled.
  // Cleanup removes the control entirely — no stale instance is ever reused.
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !map) return undefined;

    // Disable double-click zoom while drawing (prevents map zoom on finish)
    map.doubleClickZoom.disable();

    // Build draw styles with current color / width
    const width = parseInt(polylineDistance, 10) / 50;
    const lineWidth = Math.max(2, Math.min(width, 8));
    const styles = [
      {
        id: 'gl-draw-line',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': lineWidth },
      },
      {
        id: 'gl-draw-line-inactive',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'false']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': lineWidth },
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
    // This is the most bulletproof way: intercept at function level so no
    // event ordering or timing issues can allow re-entry into draw mode.
    let drawingLocked = false;
    const originalChangeMode = drawInstance.changeMode.bind(drawInstance);
    drawInstance.changeMode = (mode, opts) => {
      if (drawingLocked && typeof mode === 'string' && mode.startsWith('draw_')) {
        // Silently block — stay in current mode (simple_select / direct_select)
        return;
      }
      originalChangeMode(mode, opts);
    };

    // Expose getCurrentFeatures to parent dialog
    if (onDrawReadyRef.current) {
      onDrawReadyRef.current(() => (drawRef.current ? drawRef.current.getAll() : null));
    }

    // ── Determine initial state ──
    const saved = savedFeaturesRef.current;
    savedFeaturesRef.current = null;
    let autoActivate = true;

    if (saved && saved.features && saved.features.length > 0) {
      // Restoring features after a theme/color change while drawing
      saved.features.forEach((f) => drawInstance.add(f));
      originalChangeMode('simple_select');
      const lineF = saved.features.find((f) => f.geometry.type === 'LineString');
      if (lineF) updateRouteMarkers(lineF.geometry.coordinates);
      drawingLocked = true;
      autoActivate = false;
    } else if (initialArea && initialArea.startsWith('LINESTRING')) {
      // Edit mode — load existing route
      const match = initialArea.match(/LINESTRING\s*\(\s*([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map((c) => {
          const [lat, lng] = c.trim().split(/\s+/).map(parseFloat);
          return [lng, lat];
        });
        if (coords.length >= 2) {
          drawInstance.add({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {},
          });
          originalChangeMode('simple_select');
          updateRouteMarkers(coords);
          drawingLocked = true;
          autoActivate = false;
        }
      }
    }

    if (autoActivate) {
      // Auto-activate drawing mode for new routes
      setTimeout(() => {
        if (drawRef.current === drawInstance && !drawingLocked) {
          try { originalChangeMode('draw_line_string'); } catch { /* ignore */ }
        }
      }, 200);
    }

    // ── Bind draw events ──
    let handlingCreate = false;
    const handleCreate = (e) => {
      // Guard against re-entrancy (changeMode/delete can re-fire draw.create)
      if (handlingCreate) return;
      handlingCreate = true;

      const feature = e.features[0];
      const area = geometryToArea(feature.geometry);
      onRouteChangeRef.current(area);
      updateRouteMarkers(feature.geometry.coordinates);

      // LOCK drawing — from now on changeMode('draw_*') is blocked
      drawingLocked = true;

      // Defer cleanup: remove duplicate features & ensure simple_select
      // (must be async to avoid recursive MapboxDraw internal events)
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
      onRouteChangeRef.current(area);
      updateRouteMarkers(feature.geometry.coordinates);
    };

    const handleDelete = () => {
      // UNLOCK — allow drawing again if all features are removed
      drawingLocked = false;
      onRouteChangeRef.current('');
      updateRouteMarkers(null);
      // Re-enter draw mode so user can draw a new line
      setTimeout(() => {
        if (drawRef.current === drawInstance && !drawingLocked) {
          try { originalChangeMode('draw_line_string'); } catch { /* ignore */ }
        }
      }, 100);
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // ── Cleanup: remove THIS specific draw instance ──
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);

      // Save features so a color/theme change can restore them
      try { savedFeaturesRef.current = drawInstance.getAll(); } catch { /* ignore */ }

      // Remove markers
      if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
      if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null; }

      // Remove draw control & restore double-click zoom
      try {
        drawInstance.deleteAll();
        if (map._controls && map._controls.includes(drawInstance)) {
          map.removeControl(drawInstance);
        }
      } catch { /* ignore */ }
      map.doubleClickZoom.enable();

      if (drawRef.current === drawInstance) drawRef.current = null;
    };
  }, [enabled, color, polylineDistance, initialArea, updateRouteMarkers]);

  return null;
};

export default MapRouteDrawer;
