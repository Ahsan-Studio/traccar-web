import {
  forwardRef, useEffect, useState, useMemo 
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from '@mui/material/styles';
import { Typography, IconButton, Checkbox } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  list: {
    maxHeight: '100%',
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
}));

const OuterElement = forwardRef(function OuterElement(props, ref) {
  const theme = useTheme();
  const { className, style, ...rest } = props;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        direction: theme.direction, 
      }}
      {...rest}
    />
  );
});

const DeviceList = ({ devices }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.groups.items);

  const [, setTime] = useState(Date.now());
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffectAsync(async () => {
    const response = await fetchOrThrow('/api/devices');
    dispatch(devicesActions.refresh(await response.json()));
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Group devices
  const groupedDevices = useMemo(() => {
    const deviceGroups = {};
    const ungrouped = [];

    devices.forEach(device => {
      if (device.groupId) {
        if (!deviceGroups[device.groupId]) {
          deviceGroups[device.groupId] = {
            id: device.groupId,
            name: groups[device.groupId]?.name || `Group ${device.groupId}`,
            devices: []
          };
        }
        deviceGroups[device.groupId].devices.push(device);
      } else {
        ungrouped.push(device);
      }
    });

    // Create final array with headers and devices
    const result = [];
    
    // Add ungrouped section
    if (ungrouped.length > 0) {
      const groupId = 'ungrouped';
      const isExpanded = expandedGroups[groupId] !== false; // Default expanded
      
      result.push({ 
        type: 'header', 
        groupId,
        content: `Tidak digrup (${ungrouped.length})`,
        isExpanded
      });
      
      if (isExpanded) {
        ungrouped.forEach(device => {
          result.push({ type: 'device', content: device });
        });
      }
    }

    // Add grouped sections
    Object.entries(deviceGroups).forEach(([groupId, group]) => {
      const isExpanded = expandedGroups[groupId] !== false; // Default expanded
      
      result.push({ 
        type: 'header', 
        groupId,
        content: `${group.name} (${group.devices.length})`,
        isExpanded,
        count: group.devices.length
      });
      
      if (isExpanded) {
        group.devices.forEach(device => {
          result.push({ type: 'device', content: device });
        });
      }
    });

    return result;
  }, [devices, groups, expandedGroups]);

  const renderRow = ({ index, style }) => {
    const item = groupedDevices[index];
    if (item.type === 'header') {
      return (
        <div style={style}>
          <div
            onClick={() => toggleGroup(item.groupId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              fontWeight: 500,
              padding: '0 8px',
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
              height: '33px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <IconButton
              size="small"
              sx={{
                padding: '2px',
                marginRight: '4px',
                '& svg': { fontSize: 18 }
              }}
            >
              {item.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
            
            <Checkbox
              size="small"
              indeterminate
              sx={{
                padding: '2px',
                marginRight: '8px',
                '& svg': { fontSize: 16 }
              }}
            />
            
            <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
              {item.content}
            </Typography>
          </div>
        </div>
      );
    }
    return <DeviceRow data={[item.content]} index={0} style={style} />;
  };

  return (
    <AutoSizer className={classes.list}>
      {({ height, width }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={groupedDevices.length}
          itemSize={33}
          overscanCount={10}
          outerElementType={OuterElement}
        > 
          {renderRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};

export default DeviceList;
