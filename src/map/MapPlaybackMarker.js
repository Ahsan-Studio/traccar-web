import { useId, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';
import dayjs from 'dayjs';

const PLAYBACK_ICON = 'playback-arrow';
let playbackIconLoaded = false;

// Create a green arrow icon for the playback marker
const createPlaybackIcon = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Draw a filled green arrow pointing up (will be rotated by mapbox)
  const cx = size / 2;
  const cy = size / 2;
  const arrowLen = size * 0.4;

  ctx.save();
  ctx.translate(cx, cy);

  // Arrow body
  ctx.beginPath();
  ctx.moveTo(0, -arrowLen);           // tip
  ctx.lineTo(arrowLen * 0.55, arrowLen * 0.5);  // right wing
  ctx.lineTo(0, arrowLen * 0.15);     // right notch
  ctx.lineTo(-arrowLen * 0.55, arrowLen * 0.5); // left wing
  ctx.closePath();

  // Green fill with dark border
  ctx.fillStyle = '#4CAF50';
  ctx.fill();
  ctx.strokeStyle = '#1B5E20';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  return ctx.getImageData(0, 0, size, size);
};

const ensurePlaybackIcon = () => {
  if (playbackIconLoaded) return;
  if (!map.hasImage(PLAYBACK_ICON)) {
    map.addImage(PLAYBACK_ICON, createPlaybackIcon(), { sdf: false });
  }
  playbackIconLoaded = true;
};

const MapPlaybackMarker = ({ position }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const animFrameRef = useRef(null);
  const currentPosRef = useRef(null);
  const targetPosRef = useRef(null);
  const labelRef = useRef('');

  // Initialize source and layers
  useEffect(() => {
    ensurePlaybackIcon();

    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    // Green arrow marker that rotates with course
    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': PLAYBACK_ICON,
        'icon-size': iconScale * 0.7,
        'icon-allow-overlap': true,
        'icon-rotate': ['get', 'rotation'],
        'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'map',
        'text-field': ['get', 'label'],
        'text-allow-overlap': true,
        'text-anchor': 'left',
        'text-offset': [2.5, 0],
        'text-font': findFonts(map),
        'text-size': 12,
        'text-optional': true,
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': 'rgba(255, 255, 255, 0.95)',
        'text-halo-width': 2,
        'text-halo-blur': 1,
      },
    });

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, iconScale]);

  // Animate position updates
  useEffect(() => {
    if (!position || !position.latitude || !position.longitude) {
      // Clear marker when no position
      const source = map.getSource(id);
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
      currentPosRef.current = null;
      targetPosRef.current = null;
      return;
    }

    const target = {
      lng: position.longitude,
      lat: position.latitude,
      rotation: position.course || 0,
    };

    // Build tooltip label: "38 kph - 2025-09-26 18:00:04"
    const speed = Math.round(position.speed || 0);
    const time = position.timestamp
      ? dayjs(position.timestamp).format('YYYY-MM-DD HH:mm:ss')
      : '';
    labelRef.current = `${speed} kph - ${time}`;

    // If no current position yet, jump directly
    if (!currentPosRef.current) {
      currentPosRef.current = { ...target };
      targetPosRef.current = { ...target };
      updateSource(target);
      return;
    }

    targetPosRef.current = target;

    // If playing, animate smoothly between positions
    if (position.isPlaying) {
      startAnimation();
    } else {
      // Direct click — jump immediately
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      currentPosRef.current = { ...target };
      updateSource(target);
    }
  }, [position, id]);

  const updateSource = (pos) => {
    const source = map.getSource(id);
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pos.lng, pos.lat],
        },
        properties: {
          rotation: pos.rotation,
          label: labelRef.current || '',
        },
      }],
    });
  };

  const startAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    // Adapt animation duration to playback speed
    // At 1x: interval=1000ms, animate over 800ms
    // At 6x: interval=167ms, animate over 130ms
    const playSpeed = position?.playSpeed || 1;
    const interval = 1000 / playSpeed;
    const duration = Math.max(interval * 0.8, 50); // 80% of interval, min 50ms
    const startTime = performance.now();
    const startPos = { ...currentPosRef.current };
    const endPos = { ...targetPosRef.current };

    // Calculate shortest rotation path
    let rotDiff = endPos.rotation - startPos.rotation;
    if (rotDiff > 180) rotDiff -= 360;
    if (rotDiff < -180) rotDiff += 360;

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Ease-in-out cubic
      const ease = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const interpolated = {
        lng: startPos.lng + (endPos.lng - startPos.lng) * ease,
        lat: startPos.lat + (endPos.lat - startPos.lat) * ease,
        rotation: startPos.rotation + rotDiff * ease,
      };

      updateSource(interpolated);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentPosRef.current = { ...endPos };
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  return null;
};

export default MapPlaybackMarker;
