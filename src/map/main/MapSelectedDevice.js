import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
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
      // Calculate vertical offset to compensate for bottom DeviceInfoPanel on desktop
      // Read panel height from localStorage (same source as DeviceInfoPanel)
      const panelHeight = desktop ? (() => {
        const saved = localStorage.getItem('deviceInfoPanelHeight');
        return saved ? parseInt(saved, 10) : 183;
      })() : 0;

      // Shift marker up by half the panel height so it's centered in the visible map area
      const verticalOffset = panelHeight > 0 ? -(panelHeight / 2) : 0;

      map.easeTo({
        center: [position.longitude, position.latitude],
        zoom: Math.max(map.getZoom(), selectZoom),
        offset: [0, verticalOffset],
      });
    }

    // Recenter map when panel closes (device deselected)
    if (!currentId && previousId && previousPosition) {
      map.easeTo({
        center: [previousPosition.longitude, previousPosition.latitude],
        offset: [0, 0],
      });
    }
  }, [currentId, previousId, currentTime, previousTime, mapFollow, position, selectZoom, mapReady, desktop, theme]);

  return null;
};

MapSelectedDevice.handlesMapReady = true;

export default MapSelectedDevice;
