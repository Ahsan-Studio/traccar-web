import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import SpeedIcon from '@mui/icons-material/Speed';
import SimCardIcon from '@mui/icons-material/SimCard';
import HeightIcon from '@mui/icons-material/Height';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PowerIcon from '@mui/icons-material/Power';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useSelector } from 'react-redux';

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'absolute',
    bottom: 0,
    left: '366px',
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    transition: 'transform 0.3s ease-in-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 16px',
    borderBottom: '1px solid #e0e0e0',
  },
  tabs: {
    minHeight: '36px',
    '& .MuiTab-root': {
      minHeight: '36px',
      textTransform: 'none',
      fontSize: '13px',
    },
  },
  content: {
    padding: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(4),
  },
  column: {
    flex: 1,
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
    '& .MuiSvgIcon-root': {
      fontSize: '18px',
      marginRight: theme.spacing(1),
      color: theme.palette.text.secondary,
    },
  },
  label: {
    fontSize: '12px',
    color: theme.palette.text.secondary,
    width: '120px',
  },
  value: {
    fontSize: '13px',
    color: theme.palette.text.primary,
  },
}));

const DeviceInfoPanel = ({ deviceId }) => {
  const { classes } = useStyles();
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(true);

  const device = useSelector((state) => state.devices.items[deviceId]);
  const position = useSelector((state) => state.session.positions[deviceId]);

  if (!device) return null;

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const DataField = ({ icon: Icon, label, value }) => (
    <div className={classes.field}>
      <Icon />
      <Typography className={classes.label}>{label}</Typography>
      <Typography className={classes.value}>{value}</Typography>
    </div>
  );

  return (
    <Paper className={classes.root} elevation={3}>
      <div className={classes.header}>
        <Typography variant="subtitle1" sx={{ fontSize: '14px', fontWeight: 500 }}>
          {device.name}
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </div>

      <Collapse in={expanded}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          className={classes.tabs}
          variant="fullWidth"
        >
          <Tab label="Data" />
          <Tab label="Grafik" />
          <Tab label="Pesan" />
        </Tabs>

        {tab === 0 && (
          <div className={classes.content}>
            <div className={classes.column}>
              <DataField
                icon={TimelineIcon}
                label="Odometer"
                value={position?.attributes?.odometer ? 
                  `${(position.attributes.odometer / 1000).toFixed(0)} km` : 
                  'N/A'
                }
              />
              <DataField
                icon={SimCardIcon}
                label="SIM card number"
                value={position?.attributes?.phone || 'N/A'}
              />
              <DataField
                icon={SpeedIcon}
                label="Kecepatan"
                value={position ? `${position.speed.toFixed(0)} kph` : 'N/A'}
              />
              <DataField
                icon={HeightIcon}
                label="Ketinggian"
                value={position ? `${position.altitude.toFixed(0)} m` : 'N/A'}
              />
            </div>

            <div className={classes.column}>
              <DataField
                icon={LocationOnIcon}
                label="Position"
                value={position ? 
                  `${position.latitude.toFixed(6)}°, ${position.longitude.toFixed(6)}°` : 
                  'N/A'
                }
              />
              <DataField
                icon={RotateRightIcon}
                label="Sudut"
                value={position ? `${position.course.toFixed(0)}°` : 'N/A'}
              />
              <DataField
                icon={AccessTimeIcon}
                label="Waktu (posisi)"
                value={position ? 
                  new Date(position.deviceTime).toLocaleString() : 
                  'N/A'
                }
              />
              <DataField
                icon={PowerIcon}
                label="EngineStatus"
                value={position?.attributes?.ignition ? 'On' : 'Off'}
              />
            </div>
          </div>
        )}

        {tab === 1 && (
          <Box p={2}>
            <Typography variant="body2">Grafik akan ditampilkan di sini</Typography>
          </Box>
        )}

        {tab === 2 && (
          <Box p={2}>
            <Typography variant="body2">Pesan akan ditampilkan di sini</Typography>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default DeviceInfoPanel;
