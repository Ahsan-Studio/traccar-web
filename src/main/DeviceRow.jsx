import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton, Tooltip, ListItemText, ListItemButton,
  Typography, Box, Menu, MenuItem, ListItemIcon, Checkbox,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import NearMeIcon from '@mui/icons-material/NearMe';
import NavigationIcon from '@mui/icons-material/Navigation';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import FollowDialog from './FollowDialog';
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

const DeviceRow = ({ data, index, style, onShowHistory }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
  
  // Submenu state for Show history
  const [historyMenuAnchorEl, setHistoryMenuAnchorEl] = useState(null);
  const historyMenuOpen = Boolean(historyMenuAnchorEl);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Follow dialog state
  const [followDialogOpen, setFollowDialogOpen] = useState(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setMenuAnchorEl(null);
    setHistoryMenuAnchorEl(null); // Close submenu too
  };

  const handleHistoryMenuOpen = (event) => {
    event.stopPropagation();
    setHistoryMenuAnchorEl(event.currentTarget);
  };

  const handleHistoryMenuClose = (event) => {
    if (event) event.stopPropagation();
    setHistoryMenuAnchorEl(null);
  };

  const handleShowHistory = (period) => {
    if (onShowHistory) {
      // Use callback to trigger History tab in MainPage
      const periodMap = {
        'lastHour': '1',
        'today': '2',
        'yesterday': '3',
        'before2days': '4',
        'before3days': '5',
        'thisWeek': '6',
        'lastWeek': '7',
        'thisMonth': '8',
        'lastMonth': '9',
      };
      onShowHistory(item.id, periodMap[period] || '2');
      handleMenuClose();
    } else {
      // Fallback to navigate to replay page
      const now = dayjs();
      let from, to;

      switch (period) {
        case 'lastHour':
          from = now.subtract(1, 'hour').toISOString();
          to = now.toISOString();
          break;
        case 'today':
          from = now.startOf('day').toISOString();
          to = now.toISOString();
          break;
        case 'yesterday':
          from = now.subtract(1, 'day').startOf('day').toISOString();
          to = now.subtract(1, 'day').endOf('day').toISOString();
          break;
        case 'before2days':
          from = now.subtract(2, 'day').startOf('day').toISOString();
          to = now.subtract(2, 'day').endOf('day').toISOString();
          break;
        case 'before3days':
          from = now.subtract(3, 'day').startOf('day').toISOString();
          to = now.subtract(3, 'day').endOf('day').toISOString();
          break;
        case 'thisWeek':
          from = now.startOf('week').toISOString();
          to = now.toISOString();
          break;
        case 'lastWeek':
          from = now.subtract(1, 'week').startOf('week').toISOString();
          to = now.subtract(1, 'week').endOf('week').toISOString();
          break;
        case 'thisMonth':
          from = now.startOf('month').toISOString();
          to = now.toISOString();
          break;
        case 'lastMonth':
          from = now.subtract(1, 'month').startOf('month').toISOString();
          to = now.subtract(1, 'month').endOf('month').toISOString();
          break;
        default:
          from = now.startOf('day').toISOString();
          to = now.toISOString();
      }

      // Navigate to replay page with deviceId and time range
      navigate(`/replay?deviceId=${item.id}&from=${from}&to=${to}`);
      handleMenuClose();
    }
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

  const handleFollow = () => {
    handleMenuClose();
    setFollowDialogOpen(true);
  };

  const handleFollowNewWindow = () => {
    handleMenuClose();
    // Open in new window/tab
    window.open(`/follow/${item.id}`, '_blank');
  };

  const handleCloseFollowDialog = () => {
    setFollowDialogOpen(false);
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
              onClick={handleHistoryMenuOpen}
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
              <Typography sx={{ fontSize: '13px', color: '#333', flex: 1 }}>
                Show history
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 18, color: '#666', ml: 1 }} />
            </MenuItem>
            <MenuItem 
              onClick={handleFollow}
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
              onClick={handleFollowNewWindow}
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
                Follow (New Window)
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => { 
                handleMenuClose(); 
                if (position) {
                  const lat = position.latitude;
                  const lng = position.longitude;
                  // Format Street View URL dengan parameter yang benar
                  const streetViewUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m7!1e1!3m5!1e2!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com!7i16384!8i8192?entry=ttu`;
                  window.open(streetViewUrl, '_blank');
                } else {
                  alert('Position not available for this device');
                }
              }}
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

          {/* Submenu for Show History */}
          <Menu
            anchorEl={historyMenuAnchorEl}
            open={historyMenuOpen}
            onClose={handleHistoryMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            slotProps={{
              paper: {
                elevation: 3,
                sx: {
                  minWidth: 200,
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
              onClick={() => handleShowHistory('lastHour')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Last hour
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('today')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Today
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('yesterday')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Yesterday
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('before2days')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Before 2 days
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('before3days')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Before 3 days
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('thisWeek')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                This week
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('lastWeek')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Last week
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('thisMonth')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                This month
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleShowHistory('lastMonth')}
              sx={{
                py: 0.75,
                px: 2.5,
                minHeight: 'auto',
                fontSize: '13px',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#333' }}>
                Last month
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

      <FollowDialog
        open={followDialogOpen}
        onClose={handleCloseFollowDialog}
        device={item}
      />
    </div>
  );
};

export default DeviceRow;
