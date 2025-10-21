import { useDispatch, useSelector, connect } from 'react-redux';
import {
  geofencesActions, groupsActions, driversActions, maintenancesActions, calendarsActions,
} from './store';
import { useEffectAsync } from './reactHelper';
import fetchOrThrow from './common/util/fetchOrThrow';

const CachingController = () => {
  const authenticated = useSelector((state) => !!state.session.user);
  const dispatch = useDispatch();

  useEffectAsync(async () => {
    if (authenticated) {
      try {
        // Fetch markers, routes, and zones separately then combine
        const [markersRes, routesRes, zonesRes] = await Promise.all([
          fetchOrThrow('/api/markers'),
          fetchOrThrow('/api/routes'),
          fetchOrThrow('/api/zones'),
        ]);
        
        const markers = await markersRes.json();
        const routes = await routesRes.json();
        const zones = await zonesRes.json();
        
        // Combine all geofences into one array
        const allGeofences = [...markers, ...routes, ...zones];
        dispatch(geofencesActions.refresh(allGeofences));
      } catch (error) {
        console.error('Error loading geofences:', error);
        // Fallback to empty array if error
        dispatch(geofencesActions.refresh([]));
      }
    }
  }, [authenticated]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetchOrThrow('/api/groups');
      dispatch(groupsActions.refresh(await response.json()));
    }
  }, [authenticated]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetchOrThrow('/api/drivers');
      dispatch(driversActions.refresh(await response.json()));
    }
  }, [authenticated]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetchOrThrow('/api/maintenance');
      dispatch(maintenancesActions.refresh(await response.json()));
    }
  }, [authenticated]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetchOrThrow('/api/calendars');
      dispatch(calendarsActions.refresh(await response.json()));
    }
  }, [authenticated]);

  return null;
};

export default connect()(CachingController);
