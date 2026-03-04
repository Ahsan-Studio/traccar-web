import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import './HistoryTab.css';
import { CustomButton, CustomInput, CustomSelect } from '../common/components/custom';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatTime } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { speedFromKnots, altitudeFromMeters, distanceFromMeters } from '../common/util/converter';
import { map } from '../map/core/MapView';

const HistoryTab = ({ onRouteChange, historyTrigger }) => {
  const devices = useSelector((state) => state.devices.items);
  
  const speedUnit = useAttributePreference('speedUnit', 'kmh');
  const altitudeUnit = useAttributePreference('altitudeUnit', 'm');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');

  const [selectedDevice, setSelectedDevice] = useState('');
  const [filter, setFilter] = useState('2'); // Default to 'Today'
  const [dateFrom, setDateFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [hourFrom, setHourFrom] = useState('00');
  const [minuteFrom, setMinuteFrom] = useState('00');
  const [hourTo, setHourTo] = useState('23');
  const [minuteTo, setMinuteTo] = useState('59');
  const [stopDuration, setStopDuration] = useState('5');
  const [routeData, setRouteData] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [shouldAutoLoad, setShouldAutoLoad] = useState(false);

  // Update date/time based on filter selection
  useEffect(() => {
    const now = dayjs();
    switch (filter) {
      case '1': // Last Hour
        setDateFrom(now.subtract(1, 'hour').format('YYYY-MM-DD'));
        setDateTo(now.format('YYYY-MM-DD'));
        setHourFrom(now.subtract(1, 'hour').format('HH'));
        setMinuteFrom(now.subtract(1, 'hour').format('mm'));
        setHourTo(now.format('HH'));
        setMinuteTo(now.format('mm'));
        break;
      case '2': // Today
        setDateFrom(now.format('YYYY-MM-DD'));
        setDateTo(now.format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '3': // Yesterday
        setDateFrom(now.subtract(1, 'day').format('YYYY-MM-DD'));
        setDateTo(now.subtract(1, 'day').format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '4': // Before 2 Days
        setDateFrom(now.subtract(2, 'day').format('YYYY-MM-DD'));
        setDateTo(now.subtract(2, 'day').format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '5': // Before 3 Days
        setDateFrom(now.subtract(3, 'day').format('YYYY-MM-DD'));
        setDateTo(now.subtract(3, 'day').format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '6': // This Week
        setDateFrom(now.startOf('week').format('YYYY-MM-DD'));
        setDateTo(now.format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '7': // Last Week
        setDateFrom(now.subtract(1, 'week').startOf('week').format('YYYY-MM-DD'));
        setDateTo(now.subtract(1, 'week').endOf('week').format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '8': // This Month
        setDateFrom(now.startOf('month').format('YYYY-MM-DD'));
        setDateTo(now.format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      case '9': // Last Month
        setDateFrom(now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
        setDateTo(now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'));
        setHourFrom('00');
        setMinuteFrom('00');
        setHourTo('23');
        setMinuteTo('59');
        break;
      default:
        break;
    }
  }, [filter]);

  // Handle auto-trigger from device menu - set device and filter first
  useEffect(() => {
    if (historyTrigger && historyTrigger.deviceId && historyTrigger.period) {
      const { deviceId, period } = historyTrigger;
      setSelectedDevice(deviceId.toString());
      setFilter(period);
      setShouldAutoLoad(true);
    }
  }, [historyTrigger]);

  const handleShowRoute = async () => {
    if (!selectedDevice) {
      alert('Please select an object');
      return;
    }

    setLoading(true);
    try {
      const fromDateTime = dayjs(`${dateFrom} ${hourFrom}:${minuteFrom}`).toISOString();
      const toDateTime = dayjs(`${dateTo} ${hourTo}:${minuteTo}`).toISOString();

      const query = new URLSearchParams({
        deviceId: selectedDevice,
        from: fromDateTime,
        to: toDateTime,
      });

      // Fetch positions (route)
      const posResponse = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const positions = await posResponse.json();
      setRouteData(positions);

      if (onRouteChange) {
        if (positions.length > 0) {
          // For map coordinates, simplify if too many points to improve rendering
          let coordinates;
          if (positions.length > 10000) {
            // Keep every Nth point for the route line (GeoJSON handles large arrays but rendering is smoother)
            const step = Math.ceil(positions.length / 10000);
            coordinates = [];
            for (let i = 0; i < positions.length; i += step) {
              coordinates.push([positions[i].longitude, positions[i].latitude]);
            }
            // Always include last point
            const last = positions[positions.length - 1];
            if (coordinates[coordinates.length - 1][0] !== last.longitude
                || coordinates[coordinates.length - 1][1] !== last.latitude) {
              coordinates.push([last.longitude, last.latitude]);
            }
          } else {
            coordinates = positions.map((p) => [p.longitude, p.latitude]);
          }
          
          onRouteChange({
            coordinates,
            deviceId: selectedDevice,
            positions,
          });
        } else {
          onRouteChange(null);
        }
      }

      // Fetch stops and filter by selected minimum stop duration
      const stopsResponse = await fetchOrThrow(`/api/reports/stops?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const allStops = await stopsResponse.json();
      const minMs = parseInt(stopDuration, 10) * 60 * 1000;
      setStops(allStops.filter((s) => (s.duration || 0) >= minMs));
    } catch (error) {
      console.error('Error loading route:', error);
      alert('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const handleHideRoute = () => {
    setRouteData([]);
    setStops([]);
    setSelectedPosition(null);
    if (onRouteChange) {
      onRouteChange(null);
    }
  };

  // Auto-load data after device and filter are set from trigger
  useEffect(() => {
    if (shouldAutoLoad && selectedDevice && dateFrom && dateTo) {
      // Small delay to ensure all states are updated
      const timer = setTimeout(() => {
        handleShowRoute();
        setShouldAutoLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoLoad, selectedDevice, dateFrom, dateTo, hourFrom, minuteFrom, hourTo, minuteTo]);

  const handleExport = () => {
    if (!selectedDevice) {
      alert('Please select an object first');
      return;
    }
    const fromDateTime = dayjs(`${dateFrom} ${hourFrom}:${minuteFrom}`).toISOString();
    const toDateTime = dayjs(`${dateTo} ${hourTo}:${minuteTo}`).toISOString();
    const query = new URLSearchParams({
      deviceId: selectedDevice,
      from: fromDateTime,
      to: toDateTime,
    });
    window.location.assign(`/api/reports/route/xlsx?${query.toString()}`);
  };

  // Helper function to determine row type and icon
  const getRowType = (position, index, allPositions) => {
    if (!position) {
      return { type: 'moving', label: 'Moving' };
    }
    
    // Check if it's a start position (first in route)
    if (index === 0) {
      return { type: 'start', label: 'Start' };
    }
    
    // Check if it's an end position (last in route)
    if (index === allPositions.length - 1) {
      return { type: 'stop', label: 'Stop' };
    }
    
    // Check if it's a stop (speed is 0 or very low)
    if (position.speed !== undefined && position.speed !== null && position.speed < 1) {
      return { type: 'parking', label: 'Parking' };
    }
    
    // Check for events (if position has attributes with alarm or event)
    if (position.attributes?.alarm || position.attributes?.event) {
      return { type: 'event', label: 'Event' };
    }
    
    // Default: moving (lane icon)
    return { type: 'moving', label: 'Moving' };
  };

  // Collapse consecutive same-type positions into segments for performance
  // Instead of rendering 30k rows, collapse into ~100-500 segments
  const routeSegments = useMemo(() => {
    if (routeData.length === 0) return [];
    if (routeData.length <= 500) {
      // Small dataset — show all positions as-is
      return routeData.map((pos, idx) => ({
        position: pos,
        originalIndex: idx,
        segmentType: null, // use getRowType
      }));
    }
    
    // Large dataset — collapse consecutive moving/parking into segments
    const segments = [];
    let i = 0;
    
    while (i < routeData.length) {
      const pos = routeData[i];
      const rowType = getRowType(pos, i, routeData);
      
      // Always show start, stop, event positions individually
      if (rowType.type === 'start' || rowType.type === 'stop' || rowType.type === 'event') {
        segments.push({
          position: pos,
          originalIndex: i,
          segmentType: null,
        });
        i += 1;
        continue;
      }
      
      // Collapse consecutive parking/moving
      const segStart = i;
      const currentType = rowType.type;
      while (i < routeData.length - 1) {
        const nextType = getRowType(routeData[i + 1], i + 1, routeData);
        if (nextType.type !== currentType) break;
        i += 1;
      }
      const segEnd = i;
      
      if (segStart === segEnd) {
        // Single position
        segments.push({
          position: pos,
          originalIndex: segStart,
          segmentType: null,
        });
      } else {
        // Collapsed segment — show first position with duration info
        const startTime = dayjs(routeData[segStart].fixTime);
        const endTime = dayjs(routeData[segEnd].fixTime);
        const durationMin = endTime.diff(startTime, 'minute');
        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const durationStr = hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
        const count = segEnd - segStart + 1;
        
        segments.push({
          position: pos,
          originalIndex: segStart,
          segmentType: currentType,
          segmentInfo: `${durationStr} (${count} points)`,
          segmentEndIndex: segEnd,
        });
      }
      
      i += 1;
    }
    
    return segments;
  }, [routeData]);

  // Compute route summary statistics
  const routeSummary = useMemo(() => {
    if (routeData.length < 2) return null;

    let totalDistance = 0;
    let topSpeed = 0;
    let speedSum = 0;
    let speedCount = 0;
    let moveDurationMs = 0;
    let stopDurationMs = 0;
    let fuelUsed = null;
    let engineHours = null;

    const firstOdo = routeData[0]?.attributes?.totalDistance || routeData[0]?.attributes?.odometer || 0;
    const lastOdo = routeData[routeData.length - 1]?.attributes?.totalDistance || routeData[routeData.length - 1]?.attributes?.odometer || 0;
    if (lastOdo > firstOdo) {
      totalDistance = lastOdo - firstOdo;
    } else {
      // Calculate from Haversine
      for (let i = 1; i < routeData.length; i += 1) {
        const prev = routeData[i - 1];
        const curr = routeData[i];
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

    for (let i = 0; i < routeData.length; i += 1) {
      const pos = routeData[i];
      const speedKnots = pos.speed || 0;
      if (speedKnots > topSpeed) topSpeed = speedKnots;
      if (speedKnots > 0) {
        speedSum += speedKnots;
        speedCount += 1;
      }

      if (i < routeData.length - 1) {
        const nextPos = routeData[i + 1];
        const dt = dayjs(nextPos.fixTime).diff(dayjs(pos.fixTime), 'millisecond');
        if (speedKnots >= 1) {
          moveDurationMs += dt;
        } else {
          stopDurationMs += dt;
        }
      }
    }

    // Fuel consumption from attributes
    const firstFuel = routeData[0]?.attributes?.fuel;
    const lastFuel = routeData[routeData.length - 1]?.attributes?.fuel;
    if (firstFuel != null && lastFuel != null && firstFuel > lastFuel) {
      fuelUsed = firstFuel - lastFuel;
    }

    // Engine hours from attributes
    const firstEng = routeData[0]?.attributes?.hours;
    const lastEng = routeData[routeData.length - 1]?.attributes?.hours;
    if (firstEng != null && lastEng != null && lastEng > firstEng) {
      engineHours = (lastEng - firstEng) / 3600000; // ms to hours
    }

    const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0;
    const totalDurationMs = moveDurationMs + stopDurationMs;

    const fmt = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) return `${h}h ${m}m ${s}s`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };

    return {
      routeLength: `${distanceFromMeters(totalDistance, distanceUnit).toFixed(2)} ${distanceUnit}`,
      totalDuration: fmt(totalDurationMs),
      moveDuration: fmt(moveDurationMs),
      stopDuration: fmt(stopDurationMs),
      topSpeed: `${speedFromKnots(topSpeed, speedUnit).toFixed(1)} ${speedUnit}`,
      avgSpeed: `${speedFromKnots(avgSpeed, speedUnit).toFixed(1)} ${speedUnit}`,
      fuelUsed: fuelUsed != null ? `${fuelUsed.toFixed(2)} L` : null,
      engineHours: engineHours != null ? `${engineHours.toFixed(1)} h` : null,
      positions: routeData.length,
    };
  }, [routeData, speedUnit, distanceUnit]);
  
  // Helper function to format information column
  const getInformation = (position, index, allPositions) => {
    const rowType = getRowType(position, index, allPositions);
    
    // For parking/stops, show duration
    if (rowType.type === 'parking') {
      // Calculate duration to next position
      if (index < allPositions.length - 1) {
        const nextPos = allPositions[index + 1];
        const duration = dayjs(nextPos.fixTime).diff(dayjs(position.fixTime), 'minute');
        if (duration > 0) {
          const hours = Math.floor(duration / 60);
          const mins = duration % 60;
          return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
        }
      }
      return 'Stopped';
    }
    
    // For moving, show duration
    if (rowType.type === 'moving') {
      if (index < allPositions.length - 1) {
        const nextPos = allPositions[index + 1];
        const duration = dayjs(nextPos.fixTime).diff(dayjs(position.fixTime), 'minute');
        if (duration > 0) {
          const hours = Math.floor(duration / 60);
          const mins = duration % 60;
          const secs = dayjs(nextPos.fixTime).diff(dayjs(position.fixTime), 'second') % 60;
          if (hours > 0) return `${hours} h ${mins} min ${secs} s`;
          if (mins > 0) return `${mins} min ${secs} s`;
          return `${secs} s`;
        }
      }
    }
    
    // For events, show event type
    if (rowType.type === 'event') {
      return position.attributes?.alarm || position.attributes?.event || 'Event';
    }
    
    return '';
  };
  
  // Helper function to format detailed popup data
  const getDetailedInfo = (position, index, allPositions) => {
    if (!position) return [];
    
    const rowType = getRowType(position, index, allPositions);
    const info = [];
    
    if (rowType.type === 'parking' || rowType.type === 'stop') {
      info.push({ label: 'Arrived', value: formatTime(position.fixTime, 'seconds') });
      if (index < allPositions.length - 1) {
        info.push({ label: 'Departed', value: formatTime(allPositions[index + 1].fixTime, 'seconds') });
        const duration = dayjs(allPositions[index + 1].fixTime).diff(dayjs(position.fixTime), 'minute');
        if (duration > 0) {
          const hours = Math.floor(duration / 60);
          const mins = duration % 60;
          const secs = dayjs(allPositions[index + 1].fixTime).diff(dayjs(position.fixTime), 'second') % 60;
          info.push({ label: 'Engine idle', value: hours > 0 ? `${hours} h ${mins} min ${secs} s` : `${mins} min ${secs} s` });
        }
      }
    } else {
      info.push({ label: 'Time', value: formatTime(position.fixTime, 'seconds') });
      if (position.speed !== undefined && position.speed !== null) {
        info.push({ label: 'Speed', value: `${speedFromKnots(position.speed, speedUnit).toFixed(1)} ${speedUnit}` });
      }
      if (position.altitude !== undefined && position.altitude !== null) {
        info.push({ label: 'Altitude', value: `${altitudeFromMeters(position.altitude, altitudeUnit).toFixed(0)} ${altitudeUnit}` });
      }
      if (position.course !== undefined && position.course !== null) {
        info.push({ label: 'Course', value: `${position.course}°` });
      }
    }
    
    if (position.address) {
      info.push({ label: 'Address', value: position.address });
    }
    if (position.latitude !== undefined && position.latitude !== null) {
      info.push({ label: 'Latitude', value: position.latitude.toFixed(6) });
    }
    if (position.longitude !== undefined && position.longitude !== null) {
      info.push({ label: 'Longitude', value: position.longitude.toFixed(6) });
    }
    
    return info;
  };

  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minute options (00–59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="history-tab-container">
      <div className="history-parameters-section">
        {/* Object Selection */}
        <div className="history-row">
          <label className="history-label">Object</label>
          <div className="history-field">
            <CustomSelect
              value={selectedDevice}
              onChange={(value) => setSelectedDevice(value)}
              options={[
                { value: '', label: 'Select object' },
                ...Object.values(devices).map((device) => ({
                  value: device.id.toString(),
                  label: device.name,
                }))
              ]}
              placeholder="Select object"
            />
          </div>
        </div>

        {/* Filter Selection */}
        <div className="history-row">
          <label className="history-label">Filter</label>
          <div className="history-field">
            <CustomSelect
              value={filter}
              onChange={(value) => setFilter(value)}
              options={[
                { value: '0', label: '' },
                { value: '1', label: 'Last Hour' },
                { value: '2', label: 'Today' },
                { value: '3', label: 'Yesterday' },
                { value: '4', label: 'Before 2 Days' },
                { value: '5', label: 'Before 3 Days' },
                { value: '6', label: 'This Week' },
                { value: '7', label: 'Last Week' },
                { value: '8', label: 'This Month' },
                { value: '9', label: 'Last Month' },
              ]}
            />
          </div>
        </div>

        {/* Time From */}
        <div className="history-row">
          <label className="history-label">Time From</label>
          <div className="history-time-row">
            <CustomInput
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="history-date-field"
            />
            <CustomSelect
              value={hourFrom}
              onChange={(value) => setHourFrom(value)}
              options={hours}
              className="history-time-field"
            />
            <CustomSelect
              value={minuteFrom}
              onChange={(value) => setMinuteFrom(value)}
              options={minutes}
              className="history-time-field"
            />
          </div>
        </div>

        {/* Time To */}
        <div className="history-row">
          <label className="history-label">Time To</label>
          <div className="history-time-row">
            <CustomInput
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="history-date-field"
            />
            <CustomSelect
              value={hourTo}
              onChange={(value) => setHourTo(value)}
              options={hours}
              className="history-time-field"
            />
            <CustomSelect
              value={minuteTo}
              onChange={(value) => setMinuteTo(value)}
              options={minutes}
              className="history-time-field"
            />
          </div>
        </div>

        {/* Stops Duration */}
        <div className="history-row">
          <label className="history-label">Stops</label>
          <div className="history-field">
            <CustomSelect
              value={stopDuration}
              onChange={(value) => setStopDuration(value)}
              options={[
                { value: '1', label: '> 1 min' },
                { value: '2', label: '> 2 min' },
                { value: '5', label: '> 5 min' },
                { value: '10', label: '> 10 min' },
                { value: '20', label: '> 20 min' },
                { value: '30', label: '> 30 min' },
                { value: '60', label: '> 1 h' },
                { value: '120', label: '> 2 h' },
                { value: '300', label: '> 5 h' },
              ]}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="history-button-row">
          <CustomButton
            variant="outlined"
            onClick={handleShowRoute}
            style={{ width: '100px' }}
          >
            Show
          </CustomButton>
          <CustomButton
            variant="outlined"
            onClick={handleHideRoute}
            style={{ width: '100px' }}
          >
            Hide
          </CustomButton>
          <CustomButton
            variant="outlined"
            onClick={handleExport}
            style={{ width: '134px' }}
          >
            Import/Export
          </CustomButton>
        </div>
      </div>

      {/* Route Display Section */}
      <div className="history-route-section">
        {loading ? (
          <div className="history-loading">Loading route data...</div>
        ) : routeData.length > 0 ? (
          <div className="history-table-container">
            {routeData.length > 500 && (
              <div style={{ padding: '4px 8px', fontSize: '11px', color: '#666', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                {routeData.length.toLocaleString()} positions — grouped into {routeSegments.length} segments
              </div>
            )}
            <table className="history-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Time</th>
                  <th>Information</th>
                </tr>
              </thead>
              <tbody>
                {routeSegments.map((segment) => {
                  const { position, originalIndex, segmentType, segmentInfo } = segment;
                  const rowType = segmentType 
                    ? { type: segmentType, label: segmentType === 'parking' ? 'Parking' : 'Moving' }
                    : getRowType(position, originalIndex, routeData);
                  const information = segmentInfo || getInformation(position, originalIndex, routeData);
                  
                  return (
                    <tr 
                      key={position.id || originalIndex}
                      className={selectedPosition?.id === position.id ? 'selected' : ''}
                      onClick={() => {
                        setSelectedPosition(position);
                        // Pan map to clicked position
                        if (map && position.latitude && position.longitude) {
                          map.flyTo({
                            center: [position.longitude, position.latitude],
                            zoom: Math.max(map.getZoom(), 14),
                            duration: 1000,
                          });
                        }
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPopupPosition({ x: rect.right + 10, y: rect.top });
                        setHoveredRow(originalIndex);
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null);
                      }}
                    >
                      <td className="history-icon-cell">
                        <span className={`history-icon history-icon-${rowType.type}`}></span>
                      </td>
                      <td>{formatTime(position.fixTime, 'seconds')}</td>
                      <td>{information}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Hover Popup */}
            {hoveredRow !== null && routeData[hoveredRow] && (
              <div 
                className="history-popup"
                style={{
                  position: 'fixed',
                  left: `${popupPosition.x}px`,
                  top: `${popupPosition.y}px`,
                }}
              >
                {getDetailedInfo(routeData[hoveredRow], hoveredRow, routeData).map((item, idx) => (
                  <div key={idx} className="history-popup-row">
                    <span className="history-popup-label">{item.label}:</span>
                    <span className="history-popup-value">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {stops.length > 0 && (
              <div className="history-stops-section">
                <h4 style={{marginLeft: '8px'}}>Stops ({stops.length})</h4>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((stop, index) => (
                      <tr key={index}>
                        <td>{formatTime(stop.startTime, 'minutes')}</td>
                        <td>{formatTime(stop.endTime, 'minutes')}</td>
                        <td>{Math.round(stop.duration / 60000)} min</td>
                        <td>{stop.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Route Summary Data List */}
            {routeSummary && (
              <div className="history-route-summary">
                <h4 style={{ marginLeft: '8px' }}>Route Summary</h4>
                <div className="history-summary-grid">
                  <div className="history-summary-item">
                    <span className="history-summary-label">Route length</span>
                    <span className="history-summary-value">{routeSummary.routeLength}</span>
                  </div>
                  <div className="history-summary-item">
                    <span className="history-summary-label">Total duration</span>
                    <span className="history-summary-value">{routeSummary.totalDuration}</span>
                  </div>
                  <div className="history-summary-item">
                    <span className="history-summary-label">Move duration</span>
                    <span className="history-summary-value">{routeSummary.moveDuration}</span>
                  </div>
                  <div className="history-summary-item">
                    <span className="history-summary-label">Stop duration</span>
                    <span className="history-summary-value">{routeSummary.stopDuration}</span>
                  </div>
                  <div className="history-summary-item">
                    <span className="history-summary-label">Top speed</span>
                    <span className="history-summary-value">{routeSummary.topSpeed}</span>
                  </div>
                  <div className="history-summary-item">
                    <span className="history-summary-label">Average speed</span>
                    <span className="history-summary-value">{routeSummary.avgSpeed}</span>
                  </div>
                  {routeSummary.fuelUsed && (
                    <div className="history-summary-item">
                      <span className="history-summary-label">Fuel used</span>
                      <span className="history-summary-value">{routeSummary.fuelUsed}</span>
                    </div>
                  )}
                  {routeSummary.engineHours && (
                    <div className="history-summary-item">
                      <span className="history-summary-label">Engine hours</span>
                      <span className="history-summary-value">{routeSummary.engineHours}</span>
                    </div>
                  )}
                  <div className="history-summary-item">
                    <span className="history-summary-label">Positions</span>
                    <span className="history-summary-value">{routeSummary.positions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="history-no-data">
            Select an object and time range, then click "Show" to display route
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
