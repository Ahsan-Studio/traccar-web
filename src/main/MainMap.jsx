import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from '../map/core/mapUtil';
// Using native fetch API
// Session is managed via Redux
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
// MapMarkersLayer functionality moved here
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import useFeatures from '../common/util/useFeatures';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const eventsAvailable = useSelector((state) => !!state.events.items.length);
  
  // MapMarkersLayer state
  const [markers, setMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [markerError, setMarkerError] = useState(null);
  const mapMarkers = useAttributePreference('mapMarkers', true);
  
  const session = useSelector(state => state.session);
  
  // Fetch markers from API
  const fetchMarkers = useCallback(async () => {
    try {
      const response = await fetch(`/api/geofences?type=marker`, {
        headers: { 'Authorization': `Bearer ${session.user?.token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(geofence => ({
        id: geofence.id,
        latitude: geofence.latitude || 0,
        longitude: geofence.longitude || 0,
        title: geofence.name || `Marker ${geofence.id}`,
        image: 'marker-15',
        color: geofence.attributes?.color || '#3bb2d0',
        ...geofence.attributes
      }));
    } catch (error) {
      console.error('Error fetching markers:', error);
      throw error;
    }
  }, [session.user?.token]);
  
  // Load markers effect
  useEffect(() => {
    if (!mapMarkers || !session.user) return;
    
    const loadMarkers = async () => {
      setLoadingMarkers(true);
      try {
        const data = await fetchMarkers();
        setMarkers(data);
        setMarkerError(null);
        
        if (data.length > 0) {
          MapView.flyTo({
            center: [data[0].longitude, data[0].latitude],
            zoom: 14,
            essential: true
          });
        }
      } catch (err) {
        console.error('Failed to load markers:', err);
        setMarkerError('Gagal memuat marker. Silakan refresh halaman.');
      } finally {
        setLoadingMarkers(false);
      }
    };
    
    loadMarkers();
  }, [mapMarkers, session.user?.token, fetchMarkers]);
  
  // Setup map markers effect
  useEffect(() => {
    if (!mapMarkers || markers.length === 0) return;
    
    const sourceId = 'map-markers';
    const layerId = 'map-markers-layer';
    
    // Add or update source
    if (MapView.getSource(sourceId)) {
      MapView.getSource(sourceId).setData({
        type: 'FeatureCollection',
        features: markers.map(marker => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [marker.longitude, marker.latitude],
          },
          properties: {
            image: marker.image,
            color: marker.color,
            title: marker.title,
          },
        })),
      });
    } else {
      MapView.addSource(sourceId, {
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
              color: marker.color,
              title: marker.title,
            },
          })),
        },
      });
      
      MapView.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': '{image}',
          'icon-size': 1.5,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': '{title}',
          'text-allow-overlap': true,
          'text-anchor': 'top',
          'text-offset': [0, 0.5],
          'text-font': findFonts(MapView),
          'text-size': 12,
        },
        paint: {
          'icon-color': ['get', 'color'],
          'text-halo-color': 'white',
          'text-halo-width': 2,
          'text-halo-blur': 1,
        },
      });
    }
    
    // Cleanup
    return () => {
      if (MapView.getLayer(layerId)) MapView.removeLayer(layerId);
      if (MapView.getSource(sourceId)) MapView.removeSource(sourceId);
    };
  }, [markers, mapMarkers]);

  const features = useFeatures();

  const onMarkerClick = useCallback((_, deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        {loadingMarkers && <div className="map-loading">Memuat marker...</div>}
        {markerError && <div className="map-error">{markerError}</div>}
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes />
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
        />
        <MapDefaultCamera />
        <MapSelectedDevice />
        <PoiMap />
      </MapView>
      <MapScale />
      <MapCurrentLocation />
      <MapGeocoder />
      {!features.disableEvents && (
        <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
      )}
      {desktop && (
        <MapPadding start={parseInt(theme.dimensions.drawerWidthDesktop, 10) + parseInt(theme.spacing(1.5), 10)} />
      )}
    </>
  );
};

export default MainMap;
