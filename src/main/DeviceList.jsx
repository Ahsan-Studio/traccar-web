import {
  forwardRef, useEffect, useState, useMemo, useCallback 
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from '@mui/material/styles';
import { IconButton, Checkbox } from '@mui/material';
import maplibregl from 'maplibre-gl';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { map } from '../map/core/MapView';

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

const DeviceList = ({ devices, onShowHistory }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.groups.items);
  const positions = useSelector((state) => state.session.positions);
  const visibility = useSelector((state) => state.devices.visibility);
  const focused = useSelector((state) => state.devices.focused);

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

  const handleGroupVisibilityToggle = (deviceIds, event) => {
    event.stopPropagation();
    // Check if all devices are visible
    const allVisible = deviceIds.every(id => visibility[id] !== false);
    // Toggle: if all visible, hide all; otherwise show all
    dispatch(devicesActions.setGroupVisibility({
      deviceIds,
      visible: !allVisible
    }));
  };

  const triggerZoomToDevices = useCallback((deviceIds) => {
    // Check if map is ready
    if (!map || !map.loaded()) {
      console.error('[DeviceList] Map is not ready yet!');
      return;
    }
    // Get positions for specified devices
    const devicePositions = deviceIds
      .map(id => {
        const pos = positions[id];
        return pos;
      })
      .filter(pos => pos && pos.latitude && pos.longitude);
    if (devicePositions.length === 0) {
      return;
    }

    if (devicePositions.length === 1) {
      // Single device: zoom to it
      const pos = devicePositions[0];
      try {
        map.flyTo({
          center: [pos.longitude, pos.latitude],
          zoom: 15,
          duration: 1000,
        });
      } catch (error) {
        console.error('[DeviceList] Error in flyTo:', error);
      }
    } else {
      // Multiple devices: fit bounds to show all
      const coordinates = devicePositions.map(pos => [pos.longitude, pos.latitude]);
      try {
        // Create bounds by extending from first coordinate
        let bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
        // Extend bounds for each additional coordinate
        coordinates.slice(1).forEach(coord => {
          bounds = bounds.extend(coord);
        });
        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 15,
        });
      } catch (error) {
        console.error('[DeviceList] Error in fitBounds:', error);
      }
    }
  }, [positions]);

  const handleGroupFocusToggle = (deviceIds, event) => {
    event.stopPropagation();
    // Check if all devices are focused
    const allFocused = deviceIds.every(id => focused[id] === true);
    // Toggle: if all focused, unfocus all; otherwise focus all
    const newFocusState = !allFocused;
    dispatch(devicesActions.setGroupFocused({
      deviceIds,
      focused: newFocusState
    }));

    // Immediately trigger zoom if focusing
    if (newFocusState) {
      // Increase delay to ensure state is updated
      setTimeout(() => {
        triggerZoomToDevices(deviceIds);
      }, 200);
    }
  };

  // Effect to handle focus changes - zoom to all focused devices
  useEffect(() => {
    const focusedDevices = Object.keys(focused).filter(id => focused[id] === true);
    if (focusedDevices.length === 0) {
      return;
    }
    // Get positions for all focused devices
    const focusedPositions = focusedDevices
      .map(id => positions[id])
      .filter(pos => pos && pos.latitude && pos.longitude);
    if (focusedPositions.length === 0) {
      return;
    }
    // Use the shared zoom function
    triggerZoomToDevices(focusedDevices);
  }, [focused, positions, triggerZoomToDevices]);

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
        isExpanded,
        deviceIds: ungrouped.map(d => d.id), // Store device IDs for group actions
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
        count: group.devices.length,
        deviceIds: group.devices.map(d => d.id), // Store device IDs for group actions
      });
      
      if (isExpanded) {
        group.devices.forEach(device => {
          result.push({ type: 'device', content: device });
        });
      }
    });

    return result;
  }, [devices, groups, expandedGroups]);

  // Row heights: header 23px, device 33px

  const renderRow = ({ index, style }) => {
  // ...existing code...
  // Row heights: header 23px, device 33px
    const item = groupedDevices[index];
    if (item.type === 'header') {
      // Extract group name and count
      const match = item.content.match(/^(.*)\((\d+)\)$/);
      const groupName = match ? match[1].trim() : item.content;
      const groupCount = match ? match[2] : '';
      
      // Check if all devices in group are visible
      const deviceIds = item.deviceIds || [];
      const allVisible = deviceIds.length > 0 && deviceIds.every(id => visibility[id] !== false);
      const allFocused = deviceIds.length > 0 && deviceIds.every(id => focused[id] === true);
      
      return (
        <div style={{ ...style, marginBottom: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 24px 1fr 30px',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 500,
              padding: 0,
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              borderBottom: 'none',
              height: '33px',
              userSelect: 'none'
            }}
          >
            {/* Checkbox 1: Group Visibility Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33 }}>
              <Checkbox
                size="small"
                checked={allVisible}
                indeterminate={!allVisible && deviceIds.some(id => visibility[id] !== false)}
                onClick={(e) => handleGroupVisibilityToggle(deviceIds, e)}
                sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
              />
            </div>
            {/* Checkbox 2: Group Focus */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33 }}>
              <Checkbox
                size="small"
                checked={allFocused}
                indeterminate={!allFocused && deviceIds.some(id => focused[id] === true)}
                onClick={(e) => handleGroupFocusToggle(deviceIds, e)}
                disabled={deviceIds.length === 0}
                sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
              />
            </div>
            {/* Group name and count, left aligned under Object column */}
            <div style={{ display: 'flex', alignItems: 'center', height: 33, paddingLeft: 0 }}>
              <span style={{ color: '#222', fontWeight: 500 }}>
                {groupName} {groupCount && <span style={{ color: '#888' }}>({groupCount})</span>}
              </span>
            </div>
            {/* Expand/collapse icon as + / -, right aligned */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33 }}>
              <IconButton
                size="small"
                onClick={() => toggleGroup(item.groupId)}
                sx={{ padding: '2px' }}
              >
                {item.isExpanded ? (
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>-</span>
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 'bold' }}>+</span>
                )}
              </IconButton>
            </div>
          </div>
        </div>
      );
    }
    return <DeviceRow data={[item.content]} index={0} style={style} onShowHistory={onShowHistory} />;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 10 }}>
      {/* Header row with icons and Object label */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 24px 1fr 30px',
        alignItems: 'center',
        background: '#f8f8f8',
        borderBottom: '1px solid #e0e0e0',
        minHeight: 33,
        fontWeight: 500,
        fontSize: '12px',
        padding: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33, borderRight: '1px solid #e0e0e0', background: '#f5f5f5' }}>
          <img src="/img/eye.svg" alt="eye" style={{ width: 14, height: 14 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33, borderRight: '1px solid #e0e0e0', background: '#f5f5f5' }}>
          <img src="/img/follow.svg" alt="follow" style={{ width: 14, height: 14 }} />
        </div>
        <div style={{
          color: '#444', background: '#f5f5f5', height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e0e0e0'
        }}>
          Object
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 33, background: '#f5f5f5' }}>
        </div>
      </div>
      {/* Device/group list */}
      <div style={{ flex: 1, minHeight: 0 }}>
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
      </div>
    </div>
  );
};

export default DeviceList;
