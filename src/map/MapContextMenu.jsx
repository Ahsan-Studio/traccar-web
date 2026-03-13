import { useState, useEffect, useCallback } from 'react';
import {
 Paper, MenuList, MenuItem, ListItemIcon, ListItemText, Divider 
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import StreetviewIcon from '@mui/icons-material/Streetview';
import PlaceIcon from '@mui/icons-material/Place';
import DirectionsIcon from '@mui/icons-material/Directions';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonIcon from '@mui/icons-material/Pentagon';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { map } from '../map/core/MapView';

const useStyles = makeStyles()(() => ({
  menu: {
    position: 'absolute',
    zIndex: 2000,
    minWidth: 200,
    '& .MuiMenuItem-root': {
      fontSize: '12px',
      padding: '4px 12px',
      minHeight: '28px',
    },
    '& .MuiListItemIcon-root': {
      minWidth: '28px',
      '& .MuiSvgIcon-root': { fontSize: '16px', color: '#666' },
    },
    '& .MuiListItemText-primary': {
      fontSize: '12px',
    },
  },
}));

const MapContextMenu = ({ onShowPoint, onNewMarker, onNewRoute, onNewZone, onNewTask, onRouteBetweenPoints }) => {
  const { classes } = useStyles();
  const [menuState, setMenuState] = useState(null); // { x, y, lngLat }
  const [routeStartPoint, setRouteStartPoint] = useState(null); // for "Route Between Points"

  const handleClose = useCallback(() => {
    setMenuState(null);
  }, []);

  useEffect(() => {
    if (!map) return undefined;

    const handleContextMenu = (e) => {
      e.preventDefault();
      const { x, y } = e.point;
      const { lng, lat } = e.lngLat;
      setMenuState({ x, y, lngLat: { lng, lat } });
    };

    const handleClick = () => {
      setMenuState(null);
    };

    const handleMapMove = () => {
      setMenuState(null);
    };

    map.on('contextmenu', handleContextMenu);
    map.on('click', handleClick);
    map.on('movestart', handleMapMove);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleClick);
      map.off('movestart', handleMapMove);
    };
  }, []);

  // Close on any outside click
  useEffect(() => {
    if (!menuState) return undefined;
    const handler = (e) => {
      if (!e.target.closest('.map-context-menu')) {
        setMenuState(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuState]);

  if (!menuState) return null;

  const { x, y, lngLat } = menuState;

  const handleStreetView = () => {
    window.open(
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lngLat.lat},${lngLat.lng}&heading=0&pitch=0`,
      '_blank',
    );
    handleClose();
  };

  const handleShowPoint = () => {
    if (onShowPoint) onShowPoint(lngLat.lat, lngLat.lng);
    handleClose();
  };

  const handleRouteToPoint = () => {
    // Open Google Maps directions to the clicked point
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lngLat.lat},${lngLat.lng}`,
      '_blank',
    );
    handleClose();
  };

  const handleNewMarker = () => {
    if (onNewMarker) onNewMarker(lngLat.lat, lngLat.lng);
    handleClose();
  };

  const handleNewRoute = () => {
    if (onNewRoute) onNewRoute(lngLat.lat, lngLat.lng);
    handleClose();
  };

  const handleNewZone = () => {
    if (onNewZone) onNewZone(lngLat.lat, lngLat.lng);
    handleClose();
  };

  const handleRouteBetweenPoints = () => {
    if (!routeStartPoint) {
      // First click: set start point
      setRouteStartPoint({ lat: lngLat.lat, lng: lngLat.lng });
      handleClose();
    } else {
      // Second click: open Google Maps route from start to this point
      const start = routeStartPoint;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${lngLat.lat},${lngLat.lng}`,
        '_blank',
      );
      setRouteStartPoint(null);
      if (onRouteBetweenPoints) onRouteBetweenPoints(start.lat, start.lng, lngLat.lat, lngLat.lng);
      handleClose();
    }
  };

  const handleCancelRoute = () => {
    setRouteStartPoint(null);
    handleClose();
  };

  const handleNewTask = () => {
    if (onNewTask) onNewTask(lngLat.lat, lngLat.lng);
    handleClose();
  };

  return (
    <Paper
      className={`${classes.menu} map-context-menu`}
      elevation={4}
      style={{ left: x, top: y }}
    >
      <MenuList dense>
        <MenuItem onClick={handleStreetView}>
          <ListItemIcon><StreetviewIcon /></ListItemIcon>
          <ListItemText>Street View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShowPoint}>
          <ListItemIcon><PlaceIcon /></ListItemIcon>
          <ListItemText>Show Point</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRouteToPoint}>
          <ListItemIcon><DirectionsIcon /></ListItemIcon>
          <ListItemText>Route To Point</ListItemText>
        </MenuItem>
        {!routeStartPoint ? (
          <MenuItem onClick={handleRouteBetweenPoints}>
            <ListItemIcon><AltRouteIcon /></ListItemIcon>
            <ListItemText>Route Between Points (Set Start)</ListItemText>
          </MenuItem>
        ) : (
          <>
            <MenuItem onClick={handleRouteBetweenPoints}>
              <ListItemIcon><AltRouteIcon sx={{ color: '#4caf50 !important' }} /></ListItemIcon>
              <ListItemText>Route Between Points (Set End)</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleCancelRoute}>
              <ListItemIcon><AltRouteIcon sx={{ color: '#f44336 !important' }} /></ListItemIcon>
              <ListItemText>Cancel Route</ListItemText>
            </MenuItem>
          </>
        )}
        <Divider />
        <MenuItem onClick={handleNewMarker}>
          <ListItemIcon><AddLocationIcon /></ListItemIcon>
          <ListItemText>New Marker</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNewRoute}>
          <ListItemIcon><TimelineIcon /></ListItemIcon>
          <ListItemText>New Route</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNewZone}>
          <ListItemIcon><PentagonIcon /></ListItemIcon>
          <ListItemText>New Zone</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleNewTask}>
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText>New Task</ListItemText>
        </MenuItem>
      </MenuList>
    </Paper>
  );
};

export default MapContextMenu;
