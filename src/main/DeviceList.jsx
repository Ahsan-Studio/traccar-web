import {
  forwardRef, useEffect, useState, useMemo 
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';
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

  // Group devices
  const groupedDevices = useMemo(() => {
    const deviceGroups = {};
    const ungrouped = [];

    devices.forEach(device => {
      if (device.groupId) {
        if (!deviceGroups[device.groupId]) {
          deviceGroups[device.groupId] = {
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
      result.push({ 
        type: 'header', 
        content: `Tidak digrup (${ungrouped.length})`
      });
      ungrouped.forEach(device => {
        result.push({ type: 'device', content: device });
      });
    }

    // Add grouped sections
    Object.entries(deviceGroups).forEach(([, group]) => {
      result.push({ 
        type: 'header', 
        content: `${group.name} (${group.devices.length})`
      });
      group.devices.forEach(device => {
        result.push({ type: 'device', content: device });
      });
    });

    return result;
  }, [devices, groups]);

  const renderRow = ({ index, style }) => {
    const item = groupedDevices[index];
    if (item.type === 'header') {
      return (
        <div style={style}>
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              padding: '0 16px',
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
              height: '33px',
              lineHeight: '33px'
            }}
          >
            {item.content}
          </Typography>
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
