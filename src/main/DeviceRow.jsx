import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton, Tooltip, ListItemText, ListItemButton,
  Typography, Box, Menu, MenuItem, ListItemIcon, Checkbox,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import NearMeIcon from '@mui/icons-material/NearMe';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NavigationIcon from '@mui/icons-material/Navigation';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WifiIcon from '@mui/icons-material/Wifi';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import BuildIcon from '@mui/icons-material/Build';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import { useAdministrator } from '../common/util/permissions';
import { useAttributePreference } from '../common/util/preferences';
import EditDeviceDialog from '../settings/object/EditDeviceDialog';
import useDeviceStatus from '../common/hooks/useDeviceStatus';
import useDeviceMaintenance from '../common/hooks/useDeviceMaintenance';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DeviceRow = ({ data, index, style }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const visibility = useSelector((state) => state.devices.visibility);
  const focused = useSelector((state) => state.devices.focused);

  const item = data[index];
  const position = useSelector((state) => state.session.positions[item.id]);
  
  // Explicitly select position properties to trigger re-render
  const positionOutdated = useSelector((state) => state.session.positions[item.id]?.outdated);
  const positionValid = useSelector((state) => state.session.positions[item.id]?.valid);
  
  const isVisible = visibility[item.id] !== false; // default true
  const isFocused = focused[item.id] === true; // default false

  // Calculate device status
  const deviceStatus = useDeviceStatus(item, position, 600); // 600 seconds = 10 minutes timeout

  // Get maintenance/service alerts
  const { hasExpired, hasWarning } = useDeviceMaintenance(item.id, position);

  // Context menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setMenuAnchorEl(null);
  };

  const handleVisibilityToggle = (event) => {
    event.stopPropagation();
    dispatch(devicesActions.toggleVisibility(item.id));
  };

  const handleFocusToggle = (event) => {
    event.stopPropagation();
    dispatch(devicesActions.toggleFocused(item.id));
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  const devicePrimary = useAttributePreference('devicePrimary', 'name');

  // Get device icon from API and add proper path
  const getDeviceIcon = () => {
    const apiIcon = item.attributes?.icon?.deviceImage;
    if (apiIcon) {
      // If API sends just filename (e.g., "land-school-bus.svg"), add path prefix
      if (!apiIcon.startsWith('/')) {
        return `/img/markers/objects/${apiIcon}`;
      }
      return apiIcon;
    }
    return '/img/markers/objects/land-car.svg';
  };

  const deviceIcon = getDeviceIcon();
  
  // Get user settings for color coding
  const user = useSelector((state) => state.session.user);
  const objectListSettings = user?.attributes?.objectList || {};
  
  // Determine row background color based on status and settings
  const getRowBackgroundColor = () => {
    const baseColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
    
    // Apply color coding if enabled in settings
    if (deviceStatus.type === 'offline' && objectListSettings.noConnectionColorEnabled) {
      return `#${objectListSettings.noConnectionColor || 'FFAEAE'}`;
    }
    if (deviceStatus.type === 'stopped' && objectListSettings.stoppedColorEnabled) {
      return `#${objectListSettings.stoppedColor || 'FFAEAE'}`;
    }
    if (deviceStatus.type === 'moving' && objectListSettings.movingColorEnabled) {
      return `#${objectListSettings.movingColor || 'B0E57C'}`;
    }
    if (deviceStatus.type === 'idle' && objectListSettings.engineIdleColorEnabled) {
      return `#${objectListSettings.engineIdleColor || 'FFF0AA'}`;
    }
    
    return baseColor;
  };

  return (
    <div style={style} >
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={selectedDeviceId === item.id ? classes.selected : null}
        style={{ paddingLeft: 4 }}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          padding: 0,
          height: '33px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: getRowBackgroundColor(),
          '&:hover': {
            backgroundColor: selectedDeviceId === item.id ? '#e3f2fd' : '#f5f5f5'
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd'
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#e3f2fd'
          }
        }}
      >
        {/* Checkbox 1: Visibility Toggle */}
        <Tooltip title={isVisible ? "Sembunyikan marker" : "Tampilkan marker"}>
          <Checkbox
            size="small"
            checked={isVisible}
            onClick={handleVisibilityToggle}
            icon={<VisibilityOffIcon sx={{ fontSize: 13 }} />}
            checkedIcon={<VisibilityIcon sx={{ fontSize: 13 }} />}
            sx={{
              padding: '2px',
              marginRight: '2px',
              '& svg': { fontSize: 13 }
            }}
          />
        </Tooltip>

        {/* Checkbox 2: Focus to Device */}
        <Tooltip title="Fokus ke lokasi device">
          <Checkbox
            size="small"
            checked={isFocused}
            onClick={handleFocusToggle}
            disabled={!position}
            icon={<MyLocationIcon sx={{ fontSize: 13, color: '#ccc' }} />}
            checkedIcon={<MyLocationIcon sx={{ fontSize: 13, color: '#1976d2' }} />}
            sx={{
              padding: '2px',
              marginRight: '2px',
              '& svg': { fontSize: 13 }
            }}
          />
        </Tooltip>
        
        <Box
          component="img"
          src={deviceIcon}
          alt={item.name}
          onError={(e) => {
            console.error('Failed to load icon:', deviceIcon);
            e.target.src = '/img/markers/objects/land-car.svg';
          }}
          sx={{ 
            width: 18, 
            height: 18, 
            marginTop: '2px',
            objectFit: 'contain'
          }}
        />

        {/* Device Info */}
        <Box sx={{ flex: 1 }}>
          <ListItemText
            primary={item[devicePrimary]}
            secondary={deviceStatus.text}
            slots={{
              primary: Typography,
              secondary: Typography,
            }}
            slotProps={{
              primary: { noWrap: true, fontSize: '11px' },
              secondary: { noWrap: true, fontSize: '10px', color: 'text.secondary' },
            }}
          />
        </Box>

        {/* Status Icons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

          <Typography sx={{ fontSize: '11px' }}>
            {position ? `${position.speed.toFixed(1) || 0} kph` : '0 kph'}
          </Typography>

          {position?.attributes?.ignition === false && (
            <Tooltip title='Mesin Mati'>
              <Box
                component="img"
                src="https://s5.gsi-tracking.com/theme/images/engine-off.svg"
                sx={{ 
                  width: 16, 
                  height: 16,
                }}
              />
            </Tooltip>
          )}
          {position?.attributes?.ignition === true && (
            <Tooltip title='Mesin Menyala'> 
            <Box
              component="img"
              src="https://s5.gsi-tracking.com/theme/images/engine-on.svg"
              sx={{ 
                width: 16, 
                height: 16,
              }}
            />
            </Tooltip>
          )}
          <Tooltip title={positionValid && !positionOutdated ? 'Terkoneksi ke server, sinyal satelit normal' : 'Tidak ada koneksi ke server, tidak ada sinyal satelit'}>
            <WifiIcon sx={{ 
              fontSize: 16, 
              color: positionValid && !positionOutdated ? '#4CAF50' : '#9e9e9e',
            }} />
          </Tooltip>
          
          {/* Service/Maintenance Alert */}
          {hasExpired && (
            <Tooltip title="Service Expired! Segera lakukan perawatan">
              <BuildIcon sx={{ 
                fontSize: 16, 
                color: '#f44336', // Red
              }} />
            </Tooltip>
          )}
          {!hasExpired && hasWarning && (
            <Tooltip title="Service Warning - Segera jadwalkan perawatan">
              <BuildIcon sx={{ 
                fontSize: 16, 
                color: '#ff9800', // Orange
              }} />
            </Tooltip>
          )}
          
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            onClick={(e) => e.stopPropagation()}
            slotProps={{
              paper: {
                elevation: 3,
                sx: {
                  minWidth: 220,
                  borderRadius: '8px',
                  ml: 0.5,
                  backgroundColor: '#ffffff',
                  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
                  '& .MuiList-root': {
                    padding: '4px 0',
                  },
                },
              },
            }}
          >
            <MenuItem 
              onClick={handleMenuClose} 
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <HistoryIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Show history
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleMenuClose}
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <NearMeIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Follow
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => { handleMenuClose(); window.open(`#follow/${item.id}`, '_blank'); }}
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <OpenInNewIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Follow (new window)
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => { handleMenuClose(); window.open(`#street/${item.id}`, '_blank'); }}
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <NavigationIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Street View (new window)
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleMenuClose}
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <SendIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Send command
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleEdit}
              sx={{
                py: 1,
                px: 2,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <EditIcon sx={{ fontSize: 18, color: '#666' }} />
              </ListItemIcon>
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Edit
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </ListItemButton>

      <EditDeviceDialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog} 
        device={item} 
      />
    </div>
  );
};

export default DeviceRow;
