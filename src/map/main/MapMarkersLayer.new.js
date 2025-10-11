import { useEffect, useId } from 'react';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';
import { findFonts } from '../core/mapUtil';

const MapMarkersLayer = () => {
  const id = useId();
  const mapMarkers = useAttributePreference('mapMarkers', true);

  useEffect(() => {
    if (!mapMarkers) {
      return () => {}; // Cleanup function kosong
    }

    // Data dummy untuk testing
    const markers = [
      {
        id: 1,
        latitude: -6.2088,
        longitude: 106.8456,
        title: 'Test Marker 1',
        image: 'default-green'
      },
      {
        id: 2,
        latitude: -6.2100,
        longitude: 106.8500,
        title: 'Test Marker 2',
        image: 'default-blue'
      }
    ];

    console.log('[MapMarkersLayer] Setting up markers:', markers);

    // Setup map source
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: markers.map(marker => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [marker.longitude, marker.latitude],
          },
          properties: {
            image: marker.image,
            title: marker.title,
          },
        })),
      },
    });

    // Add layer
    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': '{image}',
        'icon-size': 0.5,
        'icon-allow-overlap': true,
        'text-field': '{title}',
        'text-allow-overlap': true,
        'text-anchor': 'top',
        'text-offset': [0, 0.5],
        'text-font': findFonts(map),
        'text-size': 12,
      },
      paint: {
        'text-halo-color': 'white',
        'text-halo-width': 1,
      },
    });

    // Cleanup function
    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, mapMarkers]);

  return null;
};

export default MapMarkersLayer;
