import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import dimensions from '../../common/theme/dimensions';
import { map } from '../core/MapView';
import { usePrevious } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';

const MapSelectedDevice = ({ mapReady }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const currentTime = useSelector((state) => state.devices.selectTime);
  const currentId = useSelector((state) => state.devices.selectedId);
  const previousTime = usePrevious(currentTime);
  const previousId = usePrevious(currentId);

  const selectZoom = useAttributePreference('web.selectZoom', 10);
  const mapFollow = useAttributePreference('mapFollow', false);

  const position = useSelector((state) => state.session.positions[currentId]);

  const previousPosition = usePrevious(position);

  useEffect(() => {
    if (!mapReady) return;

    const positionChanged = position && (!previousPosition || position.latitude !== previousPosition.latitude || position.longitude !== previousPosition.longitude);

    if ((currentId !== previousId || currentTime !== previousTime || (mapFollow && positionChanged)) && position) {
      // Calculate horizontal offset to compensate for drawer width on desktop
      // Negative offset moves the center point to the left (compensating for left drawer)
      const drawerWidth = desktop ? parseInt(dimensions.drawerWidthDesktop, 10) : 0;
      const spacing = desktop ? parseInt(theme.spacing(1.5), 10) : 0;
      const horizontalOffset = desktop ? -((drawerWidth + spacing) / 2) : 0;
      
      map.easeTo({
        center: [position.longitude, position.latitude],
        zoom: Math.max(map.getZoom(), selectZoom),
        offset: [horizontalOffset, -dimensions.popupMapOffset / 2],
      });
    }
  }, [currentId, previousId, currentTime, previousTime, mapFollow, position, selectZoom, mapReady, desktop, theme]);

  return null;
};

MapSelectedDevice.handlesMapReady = true;

export default MapSelectedDevice;
