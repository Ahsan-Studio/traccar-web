import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton, Tooltip, ListItemText, ListItemButton,
  Typography, Box, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import NearMeIcon from '@mui/icons-material/NearMe';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NavigationIcon from '@mui/icons-material/Navigation';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WifiIcon from '@mui/icons-material/Wifi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import { useAdministrator } from '../common/util/permissions';
import { useAttributePreference } from '../common/util/preferences';

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

  const item = data[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  // Context menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setMenuAnchorEl(null);
  };
  const devicePrimary = useAttributePreference('devicePrimary', 'name');

  return (
    <div style={style} >
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={selectedDeviceId === item.id ? classes.selected : null}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          height: '33px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd'
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#e3f2fd'
          }
        }}
      >
        <Box
          component="img"
          src={`/img/markers/objects/land-car.svg`}
          sx={{ width: 18, height: 18, marginTop: '2px' }}
        />

        {/* Device Info */}
        <Box sx={{ flex: 1 }}>
          <ListItemText
            primary={item[devicePrimary]}
            secondary={item.lastUpdate ? dayjs(item.lastUpdate).format('YYYY-MM-DD HH:mm:ss') : ''}
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
          <Tooltip title={position?.outdated === false && position?.valid === true ? 'Terkoneksi ke server, sinyal satelit normal' : 'Tidak ada koneksi ke server, tidak ada sinyal satelit'}>
            <WifiIcon sx={{ 
              fontSize: 16, 
              color: position?.outdated === false && position?.valid === true ? '#4CAF50' : '#9e9e9e',
            }} />
          </Tooltip>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleMenuClose} dense>
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              Show history
            </MenuItem>
            <MenuItem onClick={handleMenuClose} dense>
              <ListItemIcon>
                <NearMeIcon fontSize="small" />
              </ListItemIcon>
              Ikuti
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); window.open(`#follow/${item.id}`, '_blank'); }} dense>
              <ListItemIcon>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              Ikuti (jendela baru)
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); window.open(`#street/${item.id}`, '_blank'); }} dense>
              <ListItemIcon>
                <NavigationIcon fontSize="small" />
              </ListItemIcon>
              Tampilan jalan (jendela baru)
            </MenuItem>
            <MenuItem onClick={handleMenuClose} dense>
              <ListItemIcon>
                <SendIcon fontSize="small" />
              </ListItemIcon>
              Send command
            </MenuItem>
            <MenuItem onClick={handleMenuClose} dense>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Ubah
            </MenuItem>
          </Menu>
        </Box>
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
