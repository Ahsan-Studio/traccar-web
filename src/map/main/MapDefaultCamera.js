import maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePreference } from '../../common/util/preferences';
import { map } from '../core/MapView';

const MAP_POS_KEY = 'gs_map_last_position';

const MapDefaultCamera = ({ mapReady }) => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const user = useSelector((state) => state.session.user);

  const defaultLatitude = usePreference('latitude');
  const defaultLongitude = usePreference('longitude');
  const defaultZoom = usePreference('zoom', 0);

  const startupPosition = user?.attributes?.map?.startupPosition || 'Fit objects';

  const [initialized, setInitialized] = useState(false);

  /* Persist map position for "Last position" mode */
  useEffect(() => {
    if (!mapReady || startupPosition !== 'Last position') return;
    const onMoveEnd = () => {
      const c = map.getCenter();
      try {
        localStorage.setItem(MAP_POS_KEY, JSON.stringify({ lng: c.lng, lat: c.lat, zoom: map.getZoom() }));
      } catch { /* ignore */ }
    };
    map.on('moveend', onMoveEnd);
    return () => { map.off('moveend', onMoveEnd); };
  }, [mapReady, startupPosition]);

  useEffect(() => {
    if (!mapReady) return;
    if (selectedDeviceId) {
      setInitialized(true);
    } else if (!initialized) {
      /* ── Last position: restore from localStorage ── */
      if (startupPosition === 'Last position') {
        try {
          const saved = JSON.parse(localStorage.getItem(MAP_POS_KEY));
          if (saved?.lng != null && saved?.lat != null) {
            map.jumpTo({ center: [saved.lng, saved.lat], zoom: saved.zoom || 10 });
            setInitialized(true);
            return;
          }
        } catch { /* fall through to default */ }
      }

      /* ── Custom / Default: use server-configured lat/lng ── */
      if (startupPosition === 'Custom' || startupPosition === 'Default') {
        if (defaultLatitude && defaultLongitude) {
          map.jumpTo({
            center: [defaultLongitude, defaultLatitude],
            zoom: defaultZoom,
          });
          setInitialized(true);
          return;
        }
      }

      /* ── Fit objects (default): fit all device positions ── */
      if (defaultLatitude && defaultLongitude && startupPosition !== 'Fit objects') {
        map.jumpTo({
          center: [defaultLongitude, defaultLatitude],
          zoom: defaultZoom,
        });
        setInitialized(true);
      } else {
        const coordinates = Object.values(positions).map((item) => [item.longitude, item.latitude]);
        if (coordinates.length > 1) {
          const bounds = coordinates.reduce((bounds, item) => bounds.extend(item), new maplibregl.LngLatBounds(coordinates[0], coordinates[1]));
          const canvas = map.getCanvas();
          map.fitBounds(bounds, {
            duration: 0,
            padding: Math.min(canvas.width, canvas.height) * 0.1,
          });
          setInitialized(true);
        } else if (coordinates.length) {
          const [individual] = coordinates;
          map.jumpTo({
            center: individual,
            zoom: Math.max(map.getZoom(), 10),
          });
          setInitialized(true);
        }
      }
    }
  }, [selectedDeviceId, initialized, defaultLatitude, defaultLongitude, defaultZoom, positions, mapReady, startupPosition]);

  return null;
};

MapDefaultCamera.handlesMapReady = true;

export default MapDefaultCamera;
