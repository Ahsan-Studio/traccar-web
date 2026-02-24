import { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
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
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapCamera from '../map/MapCamera';
import MapRouteMarkers from '../map/MapRouteMarkers';
import MapPlaybackMarker from '../map/MapPlaybackMarker';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick, historyRoute, playbackPosition, routeToggles }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  const onMarkerClick = useCallback((positionId, deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes />
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
        />
        {historyRoute && historyRoute.coordinates && (
          <>
            {routeToggles?.route !== false && (
              <MapRouteCoordinates
                name="History Route"
                coordinates={historyRoute.coordinates}
                deviceId={historyRoute.deviceId}
                isHistoryRoute
              />
            )}
            <MapRouteMarkers
              positions={historyRoute.positions}
              showStops={routeToggles?.stops !== false}
              showEvents={routeToggles?.events !== false}
            />
            <MapCamera 
              key={`history-${historyRoute.deviceId}-${historyRoute.coordinates.length}`}
              coordinates={historyRoute.coordinates} 
            />
          </>
        )}
        {playbackPosition && <MapPlaybackMarker position={playbackPosition} />}
        {!historyRoute && <MapDefaultCamera />}
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
