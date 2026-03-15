import {
 useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Slider,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import SimCardIcon from '@mui/icons-material/SimCard';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PowerIcon from '@mui/icons-material/Power';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PinDropIcon from '@mui/icons-material/PinDrop';
import InfoIcon from '@mui/icons-material/Info';
import { useSelector, useDispatch } from 'react-redux';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import {
 formatSpeed, formatDistance, formatCoordinate, formatTime 
} from '../common/util/formatter';
import {
  distanceToCircle,
  distanceToPolygon,
  formatDistanceValue,
} from '../common/util/distance';
import {
  altitudeFromMeters,
  distanceFromMeters,
  speedFromKnots,
  volumeFromLiters,
} from '../common/util/converter';
import { devicesActions } from '../store';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { map } from '../map/core/MapView';

const useStyles = makeStyles()(() => ({
  root: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  resizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '5px',
    cursor: 'ns-resize',
    backgroundColor: 'transparent',
    zIndex: 1001,
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
      backgroundColor: 'rgba(33, 150, 243, 0.3)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 16px 0px 0px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    minHeight: '38px',
  },
  tabs: {
    minHeight: '38px',
    flex: 1,
    '& .MuiTabs-flexContainer': {
      height: '38px',
    },
    '& .MuiTab-root': {
      minHeight: '38px',
      height: '38px',
      textTransform: 'none',
      fontSize: '11px',
      fontWeight: 500,
      padding: '0px 16px',
      minWidth: 'auto',
      color: '#666',
      '&.Mui-selected': {
        color: '#1976d2',
      },
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#1976d2',
    },
  },
  content: {
    padding: '0px',
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#fff',
  },
  dataGrid: {
    display: 'grid',
    gap: '0px',
    gridAutoFlow: 'column', // Fill columns from top to bottom, then next column
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    gap: '6px',
    minHeight: '24px',
    padding: '2px 12px',
    borderBottom: '1px solid #e0e0e0',
    '&:nth-of-type(odd)': {
      backgroundColor: '#f9f9f9',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#fff',
    },
  },
  fieldIcon: {
    fontSize: '16px',
    color: '#666',
    minWidth: '16px',
  },
  label: {
    minWidth: '110px',
    color: '#333',
    fontWeight: 500,
    fontSize: '11px',
  },
  value: {
    color: '#333',
    flex: 1,
    fontWeight: 400,
    fontSize: '11px',
  },
  closeButton: {
    padding: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '18px',
    },
  },
}));

const DeviceInfoPanel = ({ historyRoute, onGraphPointClick, sidebarTab }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();
  const t = useTranslation();
  const [tab, setTab] = useState(0);
  const [panelHeight, setPanelHeight] = useState(() => {
    const saved = localStorage.getItem('deviceInfoPanelHeight');
    return saved ? parseInt(saved, 10) : 183; // Default 183px (minimum height)
  });
  const [isResizing, setIsResizing] = useState(false);
  const [gridColumns, setGridColumns] = useState(1);
  const [gridRows, setGridRows] = useState(11);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Graph state
  const [graphItems, setGraphItems] = useState([]);
  const [graphTypes, setGraphTypes] = useState(['speed']);
  const [selectedGraphTypes, setSelectedGraphTypes] = useState(['speed']);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [hasLoadedGraph, setHasLoadedGraph] = useState(false);
  const [yAxisTicks, setYAxisTicks] = useState(3); // Dynamic Y-axis ticks

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playTimerRef = useRef(null);

  // Graph zoom/pan state
  const [xAxisDomain, setXAxisDomain] = useState(['dataMin', 'dataMax']);
  const [currentGraphInfo, setCurrentGraphInfo] = useState(null);

  // Messages tab state
  const [messagesData, setMessagesData] = useState([]);
  const [messagesPage, setMessagesPage] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const messagesPageSize = 50;
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [deletingMessages, setDeletingMessages] = useState(false);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const user = useSelector((state) => state.session.user);
  const geofences = useSelector((state) => state.geofences.items);
  
  const device = devices[selectedDeviceId];
  const position = positions[selectedDeviceId];
  
  const positionAttributes = usePositionAttributes(t);
  
  // Calculate max height (50% of viewport)
  const maxHeight = window.innerHeight * 0.5;
  const minHeight = 183; // Minimum height threshold
  
  // Calculate left position based on sidebar state - auto detect sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(desktop ? 330 : 0);
  
  // Get user's data list settings - match web lama default
  const dataListItems = user?.attributes?.dataList?.items || [
    'odometer', 'sim_number', 'status', 'altitude', 'angle', 
    'nearest_marker', 'nearest_zone', 'position', 'speed', 
    'time_position', 'engine_status'
  ];
  
  // Update grid columns based on panel height - responsive max 3 columns
  useEffect(() => {
    // Calculate how many items can fit vertically in current height
    const availableHeight = panelHeight - 38; // Subtract header height
    const itemHeight = 24; // minHeight per item (actual with padding/border ~29px but use 24 for tighter fit)
    const itemsPerColumn = Math.floor(availableHeight / itemHeight);
    const totalItems = dataListItems.length;
    
    // Calculate needed columns, max 3
    if (itemsPerColumn === 0) {
      setGridColumns(1);
      setGridRows(totalItems);
    } else {
      const neededColumns = Math.ceil(totalItems / itemsPerColumn);
      const finalColumns = Math.min(neededColumns, 3); // Max 3 columns
      setGridColumns(finalColumns);
      // Use itemsPerColumn as rows (max items that can fit vertically)
      setGridRows(itemsPerColumn);
    }
    
    // Calculate Y-axis ticks for graph based on panel height
    // Minimum 3 ticks for small panel, up to 10 for tall panel
    const graphHeight = availableHeight - 40; // Subtract control bar height
    const ticksCount = Math.max(3, Math.min(10, Math.floor(graphHeight / 50)));
    setYAxisTicks(ticksCount);
  }, [panelHeight, dataListItems.length]);
  
  useEffect(() => {
    if (!desktop) {
      setSidebarWidth(0);
      return;
    }
    
    // Auto detect sidebar width from DOM
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[class*="sidebar"]');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        setSidebarWidth(width);
      }
    };
    
    updateSidebarWidth();
    
    // Update on window resize
    window.addEventListener('resize', updateSidebarWidth);
    
    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, [desktop]);
  
  // Preferences for formatting
  const speedUnit = useAttributePreference('speedUnit', 'kmh');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const altitudeUnit = useAttributePreference('altitudeUnit', 'm');
  const volumeUnit = useAttributePreference('volumeUnit', 'l');
  const coordinateFormat = useAttributePreference('coordinateFormat', 'decimal');

  // Load graph data when Graph tab is selected
  const loadGraphData = useCallback(async () => {
    if (!device) return;
    
    setLoadingGraph(true);
    try {
      // Get last 24 hours of data
      const to = dayjs();
      const from = to.subtract(24, 'hour');
      
      const query = new URLSearchParams({
        deviceId: device.id,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const routePositions = await response.json();
      
      if (routePositions.length === 0) {
        setGraphItems([]);
        setGraphTypes(['speed']);
        setHasLoadedGraph(true);
        setLoadingGraph(false);
        return;
      }
      
      const keySet = new Set();
      const keyList = [];
      
      const formattedPositions = routePositions.map((pos) => {
        const data = { ...pos, ...pos.attributes };
        const formatted = {};
        formatted.fixTime = dayjs(pos.fixTime).valueOf();
        formatted.deviceTime = dayjs(pos.deviceTime).valueOf();
        formatted.serverTime = dayjs(pos.serverTime).valueOf();
        
        Object.keys(data)
          .filter((key) => !['id', 'deviceId'].includes(key))
          .forEach((key) => {
            const value = data[key];
            if (typeof value === 'number') {
              keySet.add(key);
              const definition = positionAttributes[key] || {};
              switch (definition.dataType) {
                case 'speed':
                  formatted[key] = speedFromKnots(value, speedUnit);
                  break;
                case 'altitude':
                  formatted[key] = altitudeFromMeters(value, altitudeUnit);
                  break;
                case 'distance':
                  formatted[key] = distanceFromMeters(value, distanceUnit);
                  break;
                case 'volume':
                  formatted[key] = volumeFromLiters(value, volumeUnit);
                  break;
                case 'hours':
                  formatted[key] = value / 1000;
                  break;
                default:
                  formatted[key] = value;
                  break;
              }
            }
          });
        return formatted;
      });
      
      Object.keys(positionAttributes).forEach((key) => {
        if (keySet.has(key)) {
          keyList.push(key);
          keySet.delete(key);
        }
      });
      
      const allTypes = [...keyList, ...keySet];
      setGraphTypes(allTypes);
      setGraphItems(formattedPositions);
      setHasLoadedGraph(true);
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoadingGraph(false);
    }
  }, [device, positionAttributes, speedUnit, altitudeUnit, distanceUnit, volumeUnit]);

  // Downsample array using LTTB (Largest Triangle Three Buckets) simplified
  const downsampleData = useCallback((data, maxPoints, valueKey) => {
    if (data.length <= maxPoints) return data;
    
    const sampled = [data[0]]; // Always keep first
    const bucketSize = (data.length - 2) / (maxPoints - 2);
    
    for (let i = 1; i < maxPoints - 1; i += 1) {
      const start = Math.floor((i - 1) * bucketSize) + 1;
      const end = Math.min(Math.floor(i * bucketSize) + 1, data.length - 1);
      
      // Pick the point with max absolute value in this bucket (preserves peaks)
      let maxVal = -Infinity;
      let maxIdx = start;
      for (let j = start; j < end; j += 1) {
        const val = Math.abs(data[j][valueKey] || 0);
        if (val > maxVal) {
          maxVal = val;
          maxIdx = j;
        }
      }
      sampled.push(data[maxIdx]);
    }
    
    sampled.push(data[data.length - 1]); // Always keep last
    return sampled;
  }, []);

  // Load data from history route when available
  useEffect(() => {
    if (historyRoute && historyRoute.positions && historyRoute.positions.length > 0) {
      setLoadingGraph(true);
      
      // Use requestAnimationFrame to avoid blocking UI
      requestAnimationFrame(() => {
        const keySet = new Set();
        const keyList = [];
        const positions = historyRoute.positions;
        
        // Only process essential keys for graph (speed, altitude, etc)
        // Skip spreading all attributes for each position — only extract numeric ones
        const formattedPositions = new Array(positions.length);
        for (let i = 0; i < positions.length; i += 1) {
          const pos = positions[i];
          const formatted = {
            fixTime: dayjs(pos.fixTime).valueOf(),
            latitude: pos.latitude,
            longitude: pos.longitude,
          };
          
          // Core position fields
          const numericFields = { speed: pos.speed, altitude: pos.altitude, course: pos.course };
          // Merge numeric attributes
          if (pos.attributes) {
            const attrs = pos.attributes;
            const attrKeys = Object.keys(attrs);
            for (let k = 0; k < attrKeys.length; k += 1) {
              const key = attrKeys[k];
              if (typeof attrs[key] === 'number') {
                numericFields[key] = attrs[key];
              }
            }
          }
          
          const fieldKeys = Object.keys(numericFields);
          for (let k = 0; k < fieldKeys.length; k += 1) {
            const key = fieldKeys[k];
            const value = numericFields[key];
            if (value == null) continue;
            keySet.add(key);
            const definition = positionAttributes[key] || {};
            switch (definition.dataType) {
              case 'speed':
                formatted[key] = speedFromKnots(value, speedUnit);
                break;
              case 'altitude':
                formatted[key] = altitudeFromMeters(value, altitudeUnit);
                break;
              case 'distance':
                formatted[key] = distanceFromMeters(value, distanceUnit);
                break;
              case 'volume':
                formatted[key] = volumeFromLiters(value, volumeUnit);
                break;
              case 'hours':
                formatted[key] = value / 1000;
                break;
              default:
                formatted[key] = value;
                break;
            }
          }
          formattedPositions[i] = formatted;
        }
        
        Object.keys(positionAttributes).forEach((key) => {
          if (keySet.has(key)) {
            keyList.push(key);
            keySet.delete(key);
          }
        });
        
        const allTypes = [...keyList, ...keySet];
        setGraphTypes(allTypes);
        
        // Downsample for chart rendering — keep max 2000 points for smooth chart
        const graphData = downsampleData(formattedPositions, 2000, 'speed');
        setGraphItems(graphData);
        setHasLoadedGraph(true);
        setLoadingGraph(false);
        
        // Auto-switch to Graph tab when history route loads
        setTab(1);
        // Reset playback to start
        setPlayIndex(0);
        setIsPlaying(false);
        setXAxisDomain(['dataMin', 'dataMax']);
      });
    }
  }, [historyRoute, positionAttributes, speedUnit, altitudeUnit, distanceUnit, volumeUnit, downsampleData]);

  useEffect(() => {
    if (tab === 1 && !hasLoadedGraph && device && !historyRoute) {
      loadGraphData();
    }
  }, [tab, device, hasLoadedGraph, loadGraphData, historyRoute]);

  // Load messages data when Messages tab is selected
  useEffect(() => {
    if (tab === 2) {
      if (historyRoute && historyRoute.positions && historyRoute.positions.length > 0) {
        // Use history route positions as messages
        setMessagesData(historyRoute.positions);
        setMessagesPage(0);
      } else if (device && messagesData.length === 0) {
        // Load last 24h positions for messages
        const loadMessages = async () => {
          setMessagesLoading(true);
          try {
            const to = dayjs();
            const from = to.subtract(24, 'hour');
            const query = new URLSearchParams({
              deviceId: device.id,
              from: from.toISOString(),
              to: to.toISOString(),
            });
            const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
              headers: { Accept: 'application/json' },
            });
            const positions = await response.json();
            setMessagesData(positions);
            setMessagesPage(0);
          } catch (error) {
            console.error('Error loading messages:', error);
          } finally {
            setMessagesLoading(false);
          }
        };
        loadMessages();
      }
    }
  }, [tab, historyRoute, device]);

  // Update messages when history route changes
  useEffect(() => {
    if (historyRoute && historyRoute.positions && historyRoute.positions.length > 0) {
      setMessagesData(historyRoute.positions);
      setMessagesPage(0);
      setExpandedRow(null);
      setSelectedMessages(new Set());
    }
  }, [historyRoute]);

  // Handle message selection toggle
  const handleMessageSelect = useCallback((posId, e) => {
    e.stopPropagation();
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(posId)) {
        next.delete(posId);
      } else {
        next.add(posId);
      }
      return next;
    });
  }, []);

  // Handle select all on current page
  const handleSelectAllMessages = useCallback((e) => {
    e.stopPropagation();
    const pagePositions = messagesData.slice(
      messagesPage * messagesPageSize,
      (messagesPage + 1) * messagesPageSize,
    );
    const pageIds = pagePositions.map((p) => p.id).filter(Boolean);
    const allSelected = pageIds.every((id) => selectedMessages.has(id));

    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [messagesData, messagesPage, messagesPageSize, selectedMessages]);

  // Handle delete selected messages
  const handleDeleteMessages = useCallback(async () => {
    if (selectedMessages.size === 0) return;

    const confirmed = window.confirm(`Delete ${selectedMessages.size} selected message(s)?`);
    if (!confirmed) return;

    setDeletingMessages(true);
    try {
      const deletePromises = [...selectedMessages].map((posId) => fetch(`/api/positions/${posId}`, { method: 'DELETE' }));
      await Promise.all(deletePromises);

      // Remove deleted messages from data
      setMessagesData((prev) => prev.filter((p) => !selectedMessages.has(p.id)));
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Error deleting messages:', error);
      alert('Failed to delete some messages');
    } finally {
      setDeletingMessages(false);
    }
  }, [selectedMessages]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && playIndex < graphItems.length - 1) {
      playTimerRef.current = setTimeout(() => {
        setPlayIndex((prev) => prev + 1);
      }, 1000 / playSpeed);
    } else if (playIndex >= graphItems.length - 1) {
      setIsPlaying(false);
    }
    
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, [isPlaying, playIndex, playSpeed, graphItems.length]);

  // Sync map with playback position
  useEffect(() => {
    if (graphItems[playIndex] && onGraphPointClick) {
      const point = graphItems[playIndex];
      if (point.latitude && point.longitude) {
        onGraphPointClick({
          latitude: point.latitude,
          longitude: point.longitude,
          course: point.course || 0,
          speed: point.speed || 0,
          index: playIndex,
          timestamp: point.fixTime,
          isPlaying,
          playSpeed,
        });
      }
    }
  }, [playIndex, graphItems, onGraphPointClick, isPlaying, playSpeed]);

  const handlePlay = useCallback(() => {
    if (graphItems.length === 0) return;
    if (playIndex >= graphItems.length - 1) {
      setPlayIndex(0);
    }
    setIsPlaying(true);
  }, [graphItems.length, playIndex]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setPlayIndex(0);
  }, []);

  const handlePlayIndexChange = useCallback((event, newValue) => {
    setPlayIndex(newValue);
    setIsPlaying(false);
  }, []);

  // Handle click on graph to jump to position
  const handleGraphClick = useCallback((data) => {
    if (data && data.activeTooltipIndex !== undefined) {
      const index = data.activeTooltipIndex;
      setPlayIndex(index);
      setIsPlaying(false);
      
      // Pan map to clicked point
      if (graphItems[index] && onGraphPointClick) {
        const point = graphItems[index];
        if (point.latitude && point.longitude) {
          onGraphPointClick({
            latitude: point.latitude,
            longitude: point.longitude,
            course: point.course || 0,
            speed: point.speed || 0,
            index,
            timestamp: point.fixTime,
            isPlaying: false,
          });
        }
      }
    }
  }, [graphItems, onGraphPointClick]);

  // Manual zoom controls
  const handleZoomIn = useCallback(() => {
    if (xAxisDomain[0] === 'dataMin' && xAxisDomain[1] === 'dataMax' && graphItems.length > 0) {
      const minTime = graphItems[0].fixTime;
      const maxTime = graphItems[graphItems.length - 1].fixTime;
      const range = maxTime - minTime;
      const newRange = range * 0.7;
      const center = (minTime + maxTime) / 2;
      setXAxisDomain([center - newRange / 2, center + newRange / 2]);
    } else if (typeof xAxisDomain[0] === 'number' && typeof xAxisDomain[1] === 'number') {
      const range = xAxisDomain[1] - xAxisDomain[0];
      const newRange = range * 0.7;
      const center = (xAxisDomain[0] + xAxisDomain[1]) / 2;
      setXAxisDomain([center - newRange / 2, center + newRange / 2]);
    }
  }, [xAxisDomain, graphItems]);

  const handleZoomOut = useCallback(() => {
    if (typeof xAxisDomain[0] === 'number' && typeof xAxisDomain[1] === 'number') {
      const range = xAxisDomain[1] - xAxisDomain[0];
      const newRange = range * 1.3;
      const center = (xAxisDomain[0] + xAxisDomain[1]) / 2;
      
      if (graphItems.length > 0) {
        const minTime = graphItems[0].fixTime;
        const maxTime = graphItems[graphItems.length - 1].fixTime;
        const newMin = Math.max(minTime, center - newRange / 2);
        const newMax = Math.min(maxTime, center + newRange / 2);
        
        if (newMin <= minTime && newMax >= maxTime) {
          setXAxisDomain(['dataMin', 'dataMax']);
        } else {
          setXAxisDomain([newMin, newMax]);
        }
      }
    }
  }, [xAxisDomain, graphItems]);

  const handlePanLeft = useCallback(() => {
    if (typeof xAxisDomain[0] === 'number' && typeof xAxisDomain[1] === 'number' && graphItems.length > 0) {
      const range = xAxisDomain[1] - xAxisDomain[0];
      const shift = range * 0.2;
      const minTime = graphItems[0].fixTime;
      const newMin = Math.max(minTime, xAxisDomain[0] - shift);
      const newMax = newMin + range;
      setXAxisDomain([newMin, newMax]);
    }
  }, [xAxisDomain, graphItems]);

  const handlePanRight = useCallback(() => {
    if (typeof xAxisDomain[0] === 'number' && typeof xAxisDomain[1] === 'number' && graphItems.length > 0) {
      const range = xAxisDomain[1] - xAxisDomain[0];
      const shift = range * 0.2;
      const maxTime = graphItems[graphItems.length - 1].fixTime;
      const newMax = Math.min(maxTime, xAxisDomain[1] + shift);
      const newMin = newMax - range;
      setXAxisDomain([newMin, newMax]);
    }
  }, [xAxisDomain, graphItems]);

  // Update current graph info on hover/playback
  useEffect(() => {
    if (graphItems[playIndex]) {
      const point = graphItems[playIndex];
      setCurrentGraphInfo({
        time: formatTime(point.fixTime, 'seconds'),
        speed: selectedGraphTypes.includes('speed') && point.speed !== undefined 
          ? `${Number(point.speed).toFixed(2)} ${speedUnit}` 
          : null,
        altitude: selectedGraphTypes.includes('altitude') && point.altitude !== undefined 
          ? `${Number(point.altitude).toFixed(2)} ${altitudeUnit}` 
          : null,
      });
    }
  }, [playIndex, graphItems, selectedGraphTypes, speedUnit, altitudeUnit]);

  // Handle vertical resize
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaY = startYRef.current - e.clientY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeightRef.current + deltaY));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('deviceInfoPanelHeight', panelHeight.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelHeight, maxHeight]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Parse geofence area string to get coordinates
  const parseGeofenceArea = (area) => {
    if (!area) return null;

    // CIRCLE (lat lon, radius)
    if (area.startsWith('CIRCLE')) {
      const match = area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
      if (match) {
        return {
          type: 'circle',
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
          radius: parseFloat(match[3]),
        };
      }
    }

    // POLYGON ((lat1 lon1, lat2 lon2, ...))
    if (area.startsWith('POLYGON')) {
      const coordMatch = area.match(/POLYGON\s*\(\((.*?)\)\)/);
      if (coordMatch) {
        const coords = coordMatch[1].split(',').map((pair) => {
          const [lat, lon] = pair.trim().split(/\s+/);
          return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        });
        return {
          type: 'polygon',
          coordinates: coords,
        };
      }
    }

    return null;
  };

  // Calculate nearest geofence of a specific type
  const findNearestGeofence = (geofenceType) => {
    if (!position || !geofences) return null;

    let nearestGeofence = null;
    let minDistance = Infinity;

    Object.values(geofences).forEach((geofence) => {
      const geoType = geofence.attributes?.type;
      
      // Fallback: detect type from geometry if not explicitly set
      let detectedType = geoType;
      if (!detectedType && geofence.area) {
        if (geofence.area.startsWith('CIRCLE')) {
          detectedType = 'marker';
        } else if (geofence.area.startsWith('POLYGON')) {
          detectedType = 'zone';
        } else if (geofence.area.startsWith('LINESTRING')) {
          detectedType = 'route';
        }
      }
      
      // Filter by type: 'marker' for markers, 'zone' for zones
      if (detectedType !== geofenceType) return;

      const parsed = parseGeofenceArea(geofence.area);
      if (!parsed) return;

      let distance;

      if (parsed.type === 'circle') {
        distance = distanceToCircle(position, parsed);
      } else if (parsed.type === 'polygon') {
        distance = distanceToPolygon(position, parsed.coordinates);
      }

      if (distance !== undefined && Math.abs(distance) < Math.abs(minDistance)) {
        minDistance = distance;
        nearestGeofence = { name: geofence.name, distance };
      }
    });

    return nearestGeofence;
  };

  // Compute route data list items for context-aware Data tab
  const routeDataListItems = useMemo(() => {
    if (!historyRoute?.positions || historyRoute.positions.length < 2) return null;

    const positions = historyRoute.positions;
    let totalDistance = 0;
    let topSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;
    let moveDurationMs = 0;
    let stopDurationMs = 0;

    const firstOdo = positions[0]?.attributes?.totalDistance || positions[0]?.attributes?.odometer || 0;
    const lastOdo = positions[positions.length - 1]?.attributes?.totalDistance || positions[positions.length - 1]?.attributes?.odometer || 0;
    if (lastOdo > firstOdo) {
      totalDistance = lastOdo - firstOdo;
    } else {
      for (let i = 1; i < positions.length; i += 1) {
        const prev = positions[i - 1];
        const curr = positions[i];
        const R = 6371000;
        const dLat = ((curr.latitude - prev.latitude) * Math.PI) / 180;
        const dLon = ((curr.longitude - prev.longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2
          + Math.cos((prev.latitude * Math.PI) / 180)
          * Math.cos((curr.latitude * Math.PI) / 180)
          * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistance += R * c;
      }
    }

    for (let i = 0; i < positions.length; i += 1) {
      const pos = positions[i];
      const spd = pos.speed || 0;
      if (spd > topSpeed) topSpeed = spd;
      if (spd > 0) {
        speedSum += spd;
        speedCount += 1;
      }
      if (i < positions.length - 1) {
        const dt = dayjs(positions[i + 1].fixTime).diff(dayjs(pos.fixTime), 'millisecond');
        if (spd >= 1) moveDurationMs += dt;
        else stopDurationMs += dt;
      }
    }

    const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0;
    const fmtTime = (ms) => {
      const s = Math.floor(ms / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${h}h ${m}m ${sec}s`;
      if (m > 0) return `${m}m ${sec}s`;
      return `${sec}s`;
    };

    let fuelUsed = null;
    const firstFuel = positions[0]?.attributes?.fuel;
    const lastFuel = positions[positions.length - 1]?.attributes?.fuel;
    if (firstFuel != null && lastFuel != null && firstFuel > lastFuel) {
      fuelUsed = `${(firstFuel - lastFuel).toFixed(2)} L`;
    }

    let engineHours = null;
    const firstEng = positions[0]?.attributes?.hours;
    const lastEng = positions[positions.length - 1]?.attributes?.hours;
    if (firstEng != null && lastEng != null && lastEng > firstEng) {
      engineHours = `${((lastEng - firstEng) / 3600000).toFixed(1)} h`;
    }

    const items = [
      { icon: <TimelineIcon className={classes.fieldIcon} />, label: 'Route length', value: `${distanceFromMeters(totalDistance, distanceUnit).toFixed(2)} ${distanceUnit}` },
      { icon: <AccessTimeIcon className={classes.fieldIcon} />, label: 'Total duration', value: fmtTime(moveDurationMs + stopDurationMs) },
      { icon: <DirectionsCarIcon className={classes.fieldIcon} />, label: 'Move duration', value: fmtTime(moveDurationMs) },
      { icon: <PinDropIcon className={classes.fieldIcon} />, label: 'Stop duration', value: fmtTime(stopDurationMs) },
      { icon: <SpeedIcon className={classes.fieldIcon} />, label: 'Top speed', value: `${speedFromKnots(topSpeed, speedUnit).toFixed(1)} ${speedUnit}` },
      { icon: <SpeedIcon className={classes.fieldIcon} />, label: 'Avg speed', value: `${speedFromKnots(avgSpeed, speedUnit).toFixed(1)} ${speedUnit}` },
      { icon: <InfoIcon className={classes.fieldIcon} />, label: 'Positions', value: positions.length.toLocaleString() },
    ];

    if (fuelUsed) items.push({ icon: <InfoIcon className={classes.fieldIcon} />, label: 'Fuel used', value: fuelUsed });
    if (engineHours) items.push({ icon: <PowerIcon className={classes.fieldIcon} />, label: 'Engine hours', value: engineHours });

    return items;
  }, [historyRoute, distanceUnit, speedUnit, classes.fieldIcon]);

  // Get icon for each field type
  const getFieldIcon = (item) => {
    const iconMap = {
      odometer: <TimelineIcon className={classes.fieldIcon} />,
      engine_hours: <PowerIcon className={classes.fieldIcon} />,
      status: <InfoIcon className={classes.fieldIcon} />,
      model: <DirectionsCarIcon className={classes.fieldIcon} />,
      vin: <BadgeIcon className={classes.fieldIcon} />,
      plate_number: <BadgeIcon className={classes.fieldIcon} />,
      sim_number: <SimCardIcon className={classes.fieldIcon} />,
      driver: <PersonIcon className={classes.fieldIcon} />,
      trailer: <LocalShippingIcon className={classes.fieldIcon} />,
      time_position: <AccessTimeIcon className={classes.fieldIcon} />,
      time_server: <AccessTimeIcon className={classes.fieldIcon} />,
      address: <LocationOnIcon className={classes.fieldIcon} />,
      position: <LocationOnIcon className={classes.fieldIcon} />,
      speed: <SpeedIcon className={classes.fieldIcon} />,
      altitude: <HeightIcon className={classes.fieldIcon} />,
      angle: <RotateRightIcon className={classes.fieldIcon} />,
      nearest_zone: <PinDropIcon className={classes.fieldIcon} />,
      nearest_marker: <PinDropIcon className={classes.fieldIcon} />,
      engine_status: <PowerIcon className={classes.fieldIcon} />,
    };
    return iconMap[item] || <InfoIcon className={classes.fieldIcon} />;
  };

  // Format value based on item type
  const formatValue = (item) => {
    if (!position && !device) return '-';
    
    switch (item) {
      case 'odometer':
        return position?.attributes?.totalDistance 
          ? formatDistance(position.attributes.totalDistance, distanceUnit, t)
          : '-';
      
      case 'engine_hours':
        return position?.attributes?.hours 
          ? `${(position.attributes.hours / 3600000).toFixed(1)} h`
          : '-';
      
      case 'status':
        if (!position) return 'Offline';
        if (position.attributes?.ignition === true) {
          return position.speed > 5 ? 'Moving' : 'Engine Idle';
        }
        return 'Stopped';
      
      case 'model':
        return device?.model || '-';
      
      case 'vin':
        return device?.attributes?.vin || '-';
      
      case 'plate_number':
        return device?.attributes?.plateNumber || '-';
      
      case 'sim_number':
        return device?.phone || '-';
      
      case 'driver':
        return position?.attributes?.driverName || '-';
      
      case 'trailer':
        return position?.attributes?.trailerName || '-';
      
      case 'time_position':
        return position?.fixTime 
          ? dayjs(position.fixTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      
      case 'time_server':
        return position?.serverTime 
          ? dayjs(position.serverTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      
      case 'address':
        return position?.address || 'Calculating...';
      
      case 'position':
        return position 
          ? `${formatCoordinate('latitude', position.latitude, coordinateFormat)}, ${formatCoordinate('longitude', position.longitude, coordinateFormat)}`
          : '-';
      
      case 'speed':
        return position 
          ? formatSpeed(position.speed, speedUnit, t)
          : '-';
      
      case 'altitude':
        return position?.altitude 
          ? `${position.altitude.toFixed(0)} m`
          : '-';
      
      case 'angle':
        return position?.course 
          ? `${position.course.toFixed(0)}°`
          : '-';
      
      case 'nearest_zone': {
        const nearestZone = findNearestGeofence('zone');
        if (!nearestZone) return '-';
        const formattedDistance = formatDistanceValue(Math.abs(nearestZone.distance), distanceUnit);
        return `${nearestZone.name} (${formattedDistance})`;
      }
      
      case 'nearest_marker': {
        const nearestMarker = findNearestGeofence('marker');
        if (!nearestMarker) return '-';
        const formattedDistance = formatDistanceValue(Math.abs(nearestMarker.distance), distanceUnit);
        return `${nearestMarker.name} (${formattedDistance})`;
      }
      
      case 'engine_status':
        return position?.attributes?.ignition !== undefined
          ? (position.attributes.ignition ? 'on' : 'off')
          : '-';
      
      default:
        return '-';
    }
  };

  // Get label for item
  const getLabel = (item) => {
    const labels = {
      odometer: 'Odometer',
      engine_hours: 'Engine Hours',
      status: 'Status',
      model: 'Model',
      vin: 'VIN',
      plate_number: 'Plate Number',
      sim_number: 'SIM Card Number',
      driver: 'Driver',
      trailer: 'Trailer',
      time_position: 'Time (Position)',
      time_server: 'Time (Server)',
      address: 'Address',
      position: 'Position',
      speed: 'Speed',
      altitude: 'Altitude',
      angle: 'Course/Angle',
      nearest_zone: 'Nearest Zone',
      nearest_marker: 'Nearest Marker',
      engine_status: 'EngineStatus',
    };
    return labels[item] || item;
  };

  if (!device) return null;

  return (
    <Paper 
      className={classes.root} 
      elevation={4}
      style={{
        left: `${sidebarWidth}px`,
        height: `${panelHeight}px`,
        display: 'flex',
      }}
    >
      {/* Vertical resize handle */}
      <Box 
        className={classes.resizer}
        onMouseDown={handleMouseDown}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className={classes.header}>
          <Tabs 
            className={classes.tabs}
            value={tab} 
            onChange={handleTabChange}
          >
            <Tab label="Data" />
            <Tab label="Graph" />
            <Tab label="Messages" />
          </Tabs>
          <IconButton 
            className={classes.closeButton}
            onClick={() => dispatch(devicesActions.selectId(null))}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {tab === 0 && (
          <Box className={classes.content}>
            {/* Context label when showing route data */}
            {(sidebarTab === 3 || historyRoute) && routeDataListItems ? (
              <Box 
                className={classes.dataGrid}
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.ceil(routeDataListItems.length / gridColumns)}, auto)`,
                }}
              >
                {routeDataListItems.map((item) => (
                  <Box 
                    key={item.label} 
                    className={classes.field}
                  >
                    {item.icon}
                    <Typography className={classes.label}>{item.label}</Typography>
                    <Typography className={classes.value}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box 
                className={classes.dataGrid}
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                  gridTemplateRows: `repeat(${gridRows}, auto)`,
                }}
              >
                {dataListItems.map((item) => (
                  <Box 
                    key={item} 
                    className={classes.field}
                  >
                    {getFieldIcon(item)}
                    <Typography className={classes.label}>{getLabel(item)}</Typography>
                    <Typography className={classes.value}>{formatValue(item)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box className={classes.content} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {loadingGraph ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : graphItems.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  No graph data available. Data will appear after tracking starts.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Unified Control Bar - Graph Type + Playback + Zoom/Pan + Info */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  px: 2, 
                  py: 0.75,
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5'
                }}>
                  {/* Graph Type Selector */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedGraphTypes[0] || 'speed'}
                      onChange={(e) => setSelectedGraphTypes([e.target.value])}
                      sx={{ fontSize: '0.75rem', height: '28px', backgroundColor: '#fff' }}
                      displayEmpty
                    >
                      {graphTypes.map((key) => {
                        const definition = positionAttributes[key] || {};
                        return (
                          <MenuItem key={key} value={key}>
                            {definition.name || key}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {/* Playback Controls */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton 
                      size="small" 
                      onClick={handlePlay}
                      disabled={isPlaying}
                      title="Play"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handlePause}
                      disabled={!isPlaying}
                      title="Pause"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <PauseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleStop}
                      title="Stop"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <StopIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                  
                  {/* Speed Control */}
                  <FormControl size="small" sx={{ minWidth: 50 }}>
                    <Select
                      value={playSpeed}
                      onChange={(e) => setPlaySpeed(e.target.value)}
                      sx={{ fontSize: '0.75rem', height: '28px', backgroundColor: '#fff' }}
                    >
                      <MenuItem value={1}>x1</MenuItem>
                      <MenuItem value={2}>x2</MenuItem>
                      <MenuItem value={3}>x3</MenuItem>
                      <MenuItem value={4}>x4</MenuItem>
                      <MenuItem value={5}>x5</MenuItem>
                      <MenuItem value={6}>x6</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Timeline Slider */}
                  <Box sx={{ flex: 1, px: 1 }}>
                    <Slider
                      value={playIndex}
                      onChange={handlePlayIndexChange}
                      min={0}
                      max={graphItems.length - 1}
                      size="small"
                      sx={{ 
                        py: 0.5,
                        '& .MuiSlider-thumb': {
                          width: 12,
                          height: 12,
                        },
                        '& .MuiSlider-rail': {
                          opacity: 0.5,
                        },
                      }}
                    />
                  </Box>

                  {/* Current Time Info */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      minWidth: 150, 
                      textAlign: 'right',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {currentGraphInfo?.time || '-'}
                  </Typography>

                  {/* Zoom/Pan Controls */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton 
                      size="small" 
                      onClick={handlePanLeft}
                      title="Pan Left"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handlePanRight}
                      title="Pan Right"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleZoomIn}
                      title="Zoom In"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <ZoomInIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={handleZoomOut}
                      title="Zoom Out"
                      sx={{ 
                        width: 28, 
                        height: 28,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#f0f0f0' }
                      }}
                    >
                      <ZoomOutIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Graph Area */}
                <Box sx={{ flex: 1, px: 1.5, pb: 1, pt: 0.5, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={graphItems}
                      onClick={handleGraphClick}
                      style={{ cursor: 'pointer' }}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="fixTime" 
                        tickFormatter={(value) => formatTime(value, 'time')}
                        type="number"
                        domain={xAxisDomain}
                        tick={{ fontSize: 10 }}
                        height={20}
                      />
                      <YAxis 
                        tickFormatter={(value) => Number(value).toFixed(1)}
                        tick={{ fontSize: 10 }}
                        width={35}
                        tickCount={yAxisTicks}
                      />
                      <Tooltip 
                        labelFormatter={(value) => formatTime(value, 'seconds')}
                        formatter={(value) => Number(value).toFixed(2)}
                      />
                      {/* Crosshair indicator for current playback position */}
                      {graphItems[playIndex] && (
                        <ReferenceLine 
                          x={graphItems[playIndex].fixTime} 
                          stroke="red" 
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          label={{ 
                            value: '▼', 
                            position: 'top',
                            fill: 'red',
                            fontSize: 16
                          }}
                        />
                      )}
                      {selectedGraphTypes.map((type, index) => {
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
                        return (
                          <Line
                            key={type}
                            type="monotone"
                            dataKey={type}
                            stroke={colors[index % colors.length]}
                            dot={false}
                            isAnimationActive={false}
                            name={positionAttributes[type]?.name || type}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box className={classes.content} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : messagesData.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  No messages available. Load history or wait for tracking data.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Messages Table */}
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, maxHeight: 110 }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: '11px',
                    fontFamily: 'inherit',
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: '#f5f5f5', 
                        position: 'sticky', 
                        top: 0, 
                        zIndex: 1 
                      }}>
                        <th style={{ padding: '4px 4px', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '24px' }}>
                          <input
                            type="checkbox"
                            onChange={handleSelectAllMessages}
                            checked={(() => {
                              const pagePositions = messagesData.slice(
                                messagesPage * messagesPageSize,
                                (messagesPage + 1) * messagesPageSize,
                              );
                              const pageIds = pagePositions.map((p) => p.id).filter(Boolean);
                              return pageIds.length > 0 && pageIds.every((id) => selectedMessages.has(id));
                            })()}
                            style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                          />
                        </th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>#</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Time (Device)</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Time (Server)</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Lat</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Lng</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Alt</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Course</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Speed</th>
                        <th style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Attrs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messagesData
                        .slice(messagesPage * messagesPageSize, (messagesPage + 1) * messagesPageSize)
                        .map((pos, idx) => {
                          const globalIdx = messagesPage * messagesPageSize + idx;
                          const isExpanded = expandedRow === globalIdx;
                          const attrs = pos.attributes || {};
                          const attrKeys = Object.keys(attrs).filter((k) => !['fixTime', 'deviceTime', 'serverTime'].includes(k));
                          
                          return [
                            <tr 
                              key={`row-${globalIdx}`}
                              style={{ 
                                backgroundColor: selectedMessages.has(pos.id) ? '#e3f2fd' : (globalIdx % 2 === 0 ? '#fff' : '#f9f9f9'),
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setExpandedRow(isExpanded ? null : globalIdx);
                                // Pan map to this position
                                if (pos.latitude && pos.longitude && map) {
                                  map.flyTo({
                                    center: [pos.longitude, pos.latitude],
                                    zoom: Math.max(map.getZoom(), 16),
                                    duration: 1000,
                                  });
                                }
                              }}
                            >
                              <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedMessages.has(pos.id)}
                                  onChange={(e) => handleMessageSelect(pos.id, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                                />
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', color: '#888' }}>{globalIdx + 1}</td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                {pos.fixTime ? dayjs(pos.fixTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                {pos.serverTime ? dayjs(pos.serverTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                {pos.latitude?.toFixed(6) || '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                {pos.longitude?.toFixed(6) || '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                {pos.altitude != null ? `${altitudeFromMeters(pos.altitude, altitudeUnit).toFixed(0)}` : '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                {pos.course != null ? `${pos.course.toFixed(0)}°` : '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                {pos.speed != null ? `${speedFromKnots(pos.speed, speedUnit).toFixed(1)}` : '-'}
                              </td>
                              <td style={{ padding: '3px 8px', borderBottom: '1px solid #eee' }}>
                                {attrKeys.length > 0 ? (
                                  <span style={{ color: '#1976d2', fontSize: '10px' }}>
                                    {isExpanded ? '▼' : '▶'} {attrKeys.length}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>,
                            isExpanded && attrKeys.length > 0 && (
                              <tr key={`attrs-${globalIdx}`} style={{ backgroundColor: '#f0f4ff' }}>
                                <td colSpan={10} style={{ padding: '4px 8px 4px 32px', borderBottom: '1px solid #ddd' }}>
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                    gap: '2px 16px',
                                    fontSize: '10px',
                                  }}>
                                    {attrKeys.map((key) => (
                                      <div key={key} style={{ display: 'flex', gap: '4px' }}>
                                        <span style={{ color: '#666', fontWeight: 500 }}>{key}:</span>
                                        <span style={{ color: '#333' }}>
                                          {typeof attrs[key] === 'boolean' ? (attrs[key] ? 'true' : 'false') : String(attrs[key])}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ),
                          ];
                        })}
                    </tbody>
                  </table>
                </Box>

                {/* Pagination Bar */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  px: 2, 
                  py: 0.5,
                  borderTop: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  minHeight: '28px',
                }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#666' }}>
                      {messagesData.length} messages
                    </Typography>
                    {selectedMessages.size > 0 && (
                      <IconButton
                        size="small"
                        onClick={handleDeleteMessages}
                        disabled={deletingMessages}
                        title={`Delete ${selectedMessages.size} selected`}
                        sx={{
                          width: 22,
                          height: 22,
                          color: '#d32f2f',
                          '&:hover': { backgroundColor: '#ffebee' },
                        }}
                      >
                        {deletingMessages ? (
                          <CircularProgress size={12} sx={{ color: '#d32f2f' }} />
                        ) : (
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                    )}
                    {selectedMessages.size > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#d32f2f' }}>
                        {selectedMessages.size} selected
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton 
                      size="small" 
                      onClick={() => setMessagesPage((p) => Math.max(0, p - 1))}
                      disabled={messagesPage === 0}
                      sx={{ width: 24, height: 24 }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: '60px', textAlign: 'center' }}>
                      {messagesPage + 1} / {Math.max(1, Math.ceil(messagesData.length / messagesPageSize))}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setMessagesPage((p) => Math.min(Math.ceil(messagesData.length / messagesPageSize) - 1, p + 1))}
                      disabled={messagesPage >= Math.ceil(messagesData.length / messagesPageSize) - 1}
                      sx={{ width: 24, height: 24 }}
                    >
                      <ChevronRightIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DeviceInfoPanel;
