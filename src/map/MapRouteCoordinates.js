import { useTheme } from '@mui/material/styles';
import { useId, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { map } from './core/MapView';
import { findFonts } from './core/mapUtil';
import { useAttributePreference } from '../common/util/preferences';

const MapRouteCoordinates = ({ name, coordinates, deviceId, isHistoryRoute, isHighlightedSegment }) => {
  const id = useId();

  const theme = useTheme();

  const user = useSelector((state) => state.session.user);

  const reportColor = useSelector((state) => {
    // For highlighted segments, use routeHistoryColor (default blue, like V1's map_rhc)
    if (isHighlightedSegment) {
      const historyColor = user?.attributes?.map?.routeHistoryColor;
      return historyColor ? `#${historyColor}` : '#0000FF';
    }
    // For history routes, use user's route color setting (default red)
    if (isHistoryRoute) {
      const userRouteColor = user?.attributes?.map?.routeColor;
      return userRouteColor ? `#${userRouteColor}` : '#FF0000';
    }
    
    const attributes = state.devices.items[deviceId]?.attributes;
    if (attributes) {
      const color = attributes['web.reportColor'];
      if (color) {
        return color;
      }
    }
    return theme.palette.geometry.main;
  });

  const mapLineWidth = useAttributePreference('mapLineWidth', 2);
  const mapLineOpacity = useAttributePreference('mapLineOpacity', 1);
  
  // Use thicker line for history routes, even thicker for highlighted segments
  let lineWidth = mapLineWidth;
  if (isHighlightedSegment) {
    lineWidth = mapLineWidth + 3;
  } else if (isHistoryRoute) {
    lineWidth = mapLineWidth + 1;
  }

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      },
    });
    map.addLayer({
      source: id,
      id: `${id}-line`,
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });
    map.addLayer({
      source: id,
      id: `${id}-title`,
      type: 'symbol',
      layout: {
        'text-field': '{name}',
        'text-font': findFonts(map),
        'text-size': 12,
      },
      paint: {
        'text-halo-color': 'white',
        'text-halo-width': 1,
      },
    });

    return () => {
      if (map.getLayer(`${id}-title`)) {
        map.removeLayer(`${id}-title`);
      }
      if (map.getLayer(`${id}-line`)) {
        map.removeLayer(`${id}-line`);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, []);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        name,
        color: reportColor,
        width: lineWidth,
        opacity: mapLineOpacity,
      },
    });
  }, [theme, coordinates, reportColor, lineWidth, mapLineOpacity]);

  return null;
};

export default MapRouteCoordinates;
