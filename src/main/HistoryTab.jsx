import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import './HistoryTab.css';
import { CustomButton, CustomInput, CustomSelect } from '../common/components/custom';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatTime } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { speedFromKnots, altitudeFromMeters } from '../common/util/converter';

const HistoryTab = ({ onRouteChange }) => {
  const devices = useSelector((state) => state.devices.items);
  
  const speedUnit = useAttributePreference('speedUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');

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

  const handleShowRoute = async () => {
    if (!selectedDevice) {
      alert('Please select an object');
      return;
    }
    
    setLoading(true);
    try {
      // Build date-time strings in ISO format
      const fromDateTime = dayjs(`${dateFrom} ${hourFrom}:${minuteFrom}`).toISOString();
      const toDateTime = dayjs(`${dateTo} ${hourTo}:${minuteTo}`).toISOString();
      
      // Fetch combined data (route, events, positions, stops)
      const query = new URLSearchParams({
        deviceId: selectedDevice,
        from: fromDateTime,
        to: toDateTime,
      });
      
      const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const combinedData = await response.json();
      
      // Combined API returns array of device data
      if (combinedData.length > 0) {
        const deviceData = combinedData[0];
        
        // Use positions array which contains full position objects with all details
        // route array only contains [longitude, latitude] coordinates for map display
        setRouteData(deviceData.positions || []);
        
        // Pass route coordinates to parent for map display
        if (onRouteChange && deviceData.route && deviceData.route.length > 0) {
          onRouteChange({
            coordinates: deviceData.route, // Array of [longitude, latitude]
            deviceId: selectedDevice,
            positions: deviceData.positions || [],
          });
        }
        
        // Set events data if available
        if (deviceData.events && deviceData.events.length > 0) {
          // Store events for later use
          console.log('Events:', deviceData.events);
        }
      } else {
        setRouteData([]);
        if (onRouteChange) {
          onRouteChange(null);
        }
      }
      
      // Still fetch stops separately as combined may not include them
      const stopsQuery = new URLSearchParams({
        deviceId: selectedDevice,
        from: fromDateTime,
        to: toDateTime,
      });
      
      const stopsResponse = await fetchOrThrow(`/api/reports/stops?${stopsQuery.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const stopsData = await stopsResponse.json();
      setStops(stopsData);
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

  const handleImportExport = () => {
    // TODO: Implement import/export logic
    console.log('Import/Export');
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
  
  // Generate minute options (00, 15, 30, 45)
  const minutes = ['00', '15', '30', '45'];

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
            onClick={handleImportExport}
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
            <table className="history-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Time</th>
                  <th>Information</th>
                </tr>
              </thead>
              <tbody>
                {routeData.map((position, index) => {
                  const rowType = getRowType(position, index, routeData);
                  const information = getInformation(position, index, routeData);
                  
                  return (
                    <tr 
                      key={position.id || index}
                      className={selectedPosition?.id === position.id ? 'selected' : ''}
                      onClick={() => {
                        setSelectedPosition(position);
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPopupPosition({ x: rect.right + 10, y: rect.top });
                        setHoveredRow(index);
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
            {hoveredRow !== null && (
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
