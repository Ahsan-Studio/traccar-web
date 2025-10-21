import { useEffect, useId, useState } from 'react';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';
import { findFonts } from '../core/mapUtil';

// Fungsi untuk fetch markers dari API
// DEPRECATED: Markers now loaded via CachingController.js from /api/markers
// const fetchMarkers = async (session) => {
//   try {
//     const params = new URLSearchParams({
//       type: 'marker',
//       userId: session.user.id
//     });
//     const response = await fetch(`/api/geofences?${params}`, {
//       headers: {
//         'Authorization': `Bearer ${session.accessToken}`,
//         'Content-Type': 'application/json'
//       }
//     });
//     const data = await response.json();
//     return data.map(geofence => ({
//       id: geofence.id,
//       latitude: geofence.latitude || 0,
//       longitude: geofence.longitude || 0,
//       title: geofence.name || `Marker ${geofence.id}`,
//       image: 'marker-15',
//       color: geofence.attributes?.color || '#3bb2d0',
//       ...geofence.attributes
//     }));
//   } catch (error) {
//     console.error('Error fetching markers:', error);
//     return [];
//   }
// };

const MapMarkersLayer = () => {
  const id = useId();
  const [markers] = useState([]);
  const mapMarkers = useAttributePreference('mapMarkers', true);
  
  // Fetch markers saat komponen mount atau session berubah
  // DEPRECATED: Markers now loaded via CachingController.js
  // useEffect(() => {
  //   if (!mapMarkers || !session?.authenticated) return;
  //   
  //   const loadMarkers = async () => {
  //     setLoading(true);
  //     try {
  //       const data = await fetchMarkers(session);
  //       setMarkers(data);
  //       setError(null);
  //       
  //       // Pindah ke marker pertama jika ada
  //       if (data.length > 0) {
  //         map.flyTo({
  //           center: [data[0].longitude, data[0].latitude],
  //           zoom: 14,
  //           essential: true
  //         });
  //       }
  //     } catch (err) {
  //       console.error('Failed to load markers:', err);
  //       setError('Gagal memuat marker. Silakan refresh halaman.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   
  //   loadMarkers();
  // }, [mapMarkers, session.authenticated]);

  useEffect(() => {
    if (!mapMarkers) {
      return () => {}; // Cleanup function kosong
    }

    // Skip jika tidak ada marker atau mapMarkers dinonaktifkan
    if (!mapMarkers || markers.length === 0) {
      console.log('[MapMarkersLayer] No markers to display');
      return () => {};
    }
    
    console.log('[MapMarkersLayer] Setting up markers:', markers);

    // Setup map source
    const sourceId = `markers-${id}`;
    const layerId = `markers-layer-${id}`;
    
    console.log('[MapMarkersLayer] Creating source with ID:', sourceId);
    
    // Cek apakah source sudah ada
    if (map.getSource(sourceId)) {
      console.log('[MapMarkersLayer] Source already exists, removing it first');
      map.removeSource(sourceId);
    }

    // Buat source baru
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: markers.map((marker, index) => {
          console.log(`[MapMarkersLayer] Adding marker ${index + 1}:`, marker);
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [marker.longitude, marker.latitude],
            },
            properties: {
              image: marker.image,
              title: marker.title,
              description: `Marker ${marker.id}`,
            },
          };
        }),
      },
    });
    
    console.log('[MapMarkersLayer] Source created successfully');

    // Hapus layer jika sudah ada
    if (map.getLayer(layerId)) {
      console.log('[MapMarkersLayer] Removing existing layer:', layerId);
      map.removeLayer(layerId);
    }

    // Add layer
    console.log('[MapMarkersLayer] Creating layer with ID:', layerId);
    map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        // Gunakan built-in marker dari Mapbox
        'icon-image': '{image}',
        'icon-size': 1.5,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        // Teks marker
        'text-field': '{title}',
        'text-allow-overlap': true,
        'text-anchor': 'top',
        'text-offset': [0, 0.5],
        'text-font': findFonts(map),
        'text-size': 12,
      },
      paint: {
        'icon-color': ['get', 'color'],  // Warna marker
        'text-halo-color': 'white',
        'text-halo-width': 2,
        'text-halo-blur': 1,
      },
    });

    // Cleanup function
    return () => {
      console.log('[MapMarkersLayer] Cleaning up...');
      if (map.getLayer(layerId)) {
        console.log('[MapMarkersLayer] Removing layer:', layerId);
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        console.log('[MapMarkersLayer] Removing source:', sourceId);
        map.removeSource(sourceId);
      }
    };
  }, [id, mapMarkers]);

  // Debug info
  console.log('[MapMarkersLayer] Map Center:', map?.getCenter?.());
  console.log('[MapMarkersLayer] Current Zoom:', map?.getZoom?.());
  console.log('[MapMarkersLayer] Total Markers:', markers.length);

  return null;
};

export default MapMarkersLayer;
