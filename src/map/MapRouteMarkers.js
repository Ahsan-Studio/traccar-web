import {
 useId, useEffect, useMemo, useCallback, useRef 
} from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import maplibregl from 'maplibre-gl';
import dayjs from 'dayjs';

const MapRouteMarkers = ({ positions, showStops = true, showEvents = true, onMarkerClick }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  const popupRef = useRef(null);

  // Route markers - smaller size for start/end/stop/event markers
  const routeIconScale = iconScale * 0.07;

  // Compute clustered features only when positions change
  const features = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    const result = [];

    // Start marker
    const startPos = positions[0];
    result.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [startPos.longitude, startPos.latitude],
      },
      properties: {
        image: 'route-start',
        type: 'start',
        index: 0,
        time: startPos.fixTime,
        speed: startPos.speed,
        address: startPos.address || '',
      },
    });

    // End marker
    if (positions.length > 1) {
      const endPos = positions[positions.length - 1];
      result.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [endPos.longitude, endPos.latitude],
        },
        properties: {
          image: 'route-end',
          type: 'end',
          index: positions.length - 1,
          time: endPos.fixTime,
          speed: endPos.speed,
          address: endPos.address || '',
        },
      });
    }

    // Cluster consecutive stop positions into single markers
    // and limit total markers to avoid rendering thousands
    let inStop = false;
    let stopStartIdx = -1;
    let stopCount = 0;
    const maxStopMarkers = 200; // Cap stop markers to prevent overload
    const maxEventMarkers = 100;
    let eventCount = 0;

    for (let i = 1; i < positions.length - 1; i += 1) {
      const position = positions[i];
      const isStop = position.speed !== undefined && position.speed !== null && position.speed < 1;
      const isEvent = position.attributes?.alarm || position.attributes?.event;

      if (isEvent && eventCount < maxEventMarkers) {
        if (showEvents) {
          eventCount += 1;
          result.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: {
              image: 'route-event',
              type: 'event',
              index: i,
              eventNumber: eventCount,
              time: position.fixTime,
              speed: position.speed,
              address: position.address,
              alarm: position.attributes?.alarm || '',
              event: position.attributes?.event || '',
            },
          });
        }
      } else if (isStop) {
        if (showStops && !inStop && stopCount < maxStopMarkers) {
          // First position of a new stop cluster → add one marker
          stopCount += 1;
          stopStartIdx = i;
          console.log(stopStartIdx)
          result.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: {
              image: 'route-stop',
              type: 'stop',
              index: i,
              time: position.fixTime,
              speed: position.speed,
              address: position.address || '',
            },
          });
          inStop = true;
        }
        // Subsequent consecutive stop positions → skip (same cluster)
      } else {
        // Moving position → reset stop cluster
        inStop = false;
      }
    }

    return result;
  }, [positions, showStops, showEvents]);

  // Create popup content
  const createPopupContent = useCallback((properties) => {
    const { type, time, speed, address, alarm, event } = properties;
    const speedKmh = speed ? Math.round(speed * 1.852) : 0;
    const formattedTime = time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-';

    let typeLabel = '';
    let typeColor = '#333';
    switch (type) {
      case 'start':
        typeLabel = 'Start Point';
        typeColor = '#9CC602'; // Match route-start.svg icon color (green)
        break;
      case 'end':
        typeLabel = 'End Point';
        typeColor = '#9CC602'; // Match route-end.svg icon color (green)
        break;
      case 'stop':
        typeLabel = 'Parking';
        typeColor = '#630F03'; // Match route-stop.svg icon color (dark red-brown)
        break;
      case 'event':
        typeLabel = 'Event';
        typeColor = '#EF0606'; // Match route-event.svg icon color (red)
        break;
      default:
        typeLabel = 'Point';
    }

    let html = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        padding: 8px 12px;
        min-width: 180px;
        max-width: 280px;
      ">
        <div style="font-weight: 600; color: ${typeColor}; margin-bottom: 6px; font-size: 13px;">
          ${typeLabel}
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #666;">Time:</span>
          <span style="color: #333; font-weight: 500;">${formattedTime}</span>
        </div>
    `;

    if (type !== 'stop' || speed > 0) {
      html += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #666;">Speed:</span>
          <span style="color: #333; font-weight: 500;">${speedKmh} km/h</span>
        </div>
      `;
    }

    if (alarm) {
      html += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #666;">Alarm:</span>
          <span style="color: #d32f2f; font-weight: 500;">${alarm}</span>
        </div>
      `;
    }

    if (event) {
      html += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #666;">Event:</span>
          <span style="color: #1976d2; font-weight: 500;">${event}</span>
        </div>
      `;
    }

    if (address) {
      html += `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
          <span style="color: #666;">Address:</span>
          <div style="color: #333; margin-top: 2px; word-break: break-word;">${address}</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }, []);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': ['get', 'image'],
        'icon-size': routeIconScale,
        'icon-allow-overlap': true,
      },
    });

    // Click handler for markers
    const handleClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [id] });
      if (features.length > 0) {
        const feature = features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const properties = feature.properties;

        // Ensure popup appears over the marker
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Remove existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create new popup
        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 25,
        })
          .setLngLat(coordinates)
          .setHTML(createPopupContent(properties))
          .addTo(map);

        // Notify parent if callback provided
        if (onMarkerClick) {
          onMarkerClick(properties);
        }
      }
    };

    // Change cursor on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', id, handleClick);
    map.on('mouseenter', id, handleMouseEnter);
    map.on('mouseleave', id, handleMouseLeave);

    return () => {
      map.off('click', id, handleClick);
      map.off('mouseenter', id, handleMouseEnter);
      map.off('mouseleave', id, handleMouseLeave);

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, routeIconScale, createPopupContent, onMarkerClick]);

  useEffect(() => {
    const source = map.getSource(id);
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [features, id]);

  return null;
};

export default MapRouteMarkers;
