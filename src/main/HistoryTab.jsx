import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import './HistoryTab.css';
import { CustomButton, CustomInput, CustomSelect } from '../common/components/custom';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatTime } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { speedFromKnots, altitudeFromMeters } from '../common/util/converter';

const HistoryTab = () => {
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
      
      // Fetch route data (positions)
      const routeQuery = new URLSearchParams({
        deviceId: selectedDevice,
        from: fromDateTime,
        to: toDateTime,
      });
      
      const routeResponse = await fetchOrThrow(`/api/reports/route?${routeQuery.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const positions = await routeResponse.json();
      setRouteData(positions);
      
      // Fetch stops data
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
  };

  const handleImportExport = () => {
    // TODO: Implement import/export logic
    console.log('Import/Export');
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
                  <th>Time</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Speed</th>
                  <th>Altitude</th>
                  <th>Course</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {routeData.map((position, index) => (
                  <tr 
                    key={position.id || index}
                    className={selectedPosition?.id === position.id ? 'selected' : ''}
                    onClick={() => {
                      setSelectedPosition(position);
                    }}
                  >
                    <td>{formatTime(position.fixTime, 'seconds')}</td>
                    <td>{position.latitude.toFixed(6)}</td>
                    <td>{position.longitude.toFixed(6)}</td>
                    <td>{speedFromKnots(position.speed, speedUnit).toFixed(1)} {speedUnit}</td>
                    <td>{altitudeFromMeters(position.altitude, altitudeUnit).toFixed(0)} {altitudeUnit}</td>
                    <td>{position.course}°</td>
                    <td>{position.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {stops.length > 0 && (
              <div className="history-stops-section">
                <h4>Stops ({stops.length})</h4>
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
