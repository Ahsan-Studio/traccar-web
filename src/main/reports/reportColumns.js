/* ─────────── Column definitions for report tables (V1 parity) ─────────── */
const formatDateTime = (dt) => { if (!dt) return ''; return new Date(dt).toLocaleString(); };
const formatShortDateTime = (dt) => { if (!dt) return ''; const d = new Date(dt); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const formatDuration = (ms) => { if (!ms) return ''; const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${h}h ${m}m ${sec}s`; };
const formatDistance = (m) => (m ? `${(m / 1000).toFixed(2)} km` : '0 km');
const formatSpeed = (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '0 km/h');
const formatFuel = (v) => (v ? `${v.toFixed(2)} L` : '0 L');
const formatCost = (v) => (v ? `$${v.toFixed(2)}` : '$0.00');

/* ─────────── Column mapping to DATA_ITEMS keys (V1 parity) ─────────── */
export const COLUMN_MAP = {
  // Route/Position columns
  route_start: { key: 'routeStart', label: 'Route Start', format: formatShortDateTime },
  route_end: { key: 'routeEnd', label: 'Route End', format: formatShortDateTime },
  route_length: { key: 'distance', label: 'Route Length', format: formatDistance },
  move_duration: { key: 'moveDuration', label: 'Move Duration', format: formatDuration },
  stop_duration: { key: 'stopDuration', label: 'Stop Duration', format: formatDuration },
  stop_count: { key: 'stopCount', label: 'Stop Count', format: (v) => v ?? 0 },
  top_speed: { key: 'maxSpeed', label: 'Top Speed', format: formatSpeed },
  avg_speed: { key: 'averageSpeed', label: 'Average Speed', format: formatSpeed },
  overspeed_count: { key: 'overspeedCount', label: 'Overspeed Count', format: (v) => v ?? 0 },
  fuel_consumption: { key: 'spentFuel', label: 'Fuel Consumption', format: formatFuel },
  avg_fuel_consumption: { key: 'avgFuelConsumption', label: 'Avg Fuel Consumption', format: (v) => v ? `${v.toFixed(2)} L/100km` : '0 L/100km' },
  fuel_cost: { key: 'fuelCost', label: 'Fuel Cost', format: formatCost },
  engine_work: { key: 'engineWork', label: 'Engine Work', format: formatDuration },
  engine_idle: { key: 'engineIdle', label: 'Engine Idle', format: formatDuration },
  odometer: { key: 'odometer', label: 'Odometer', format: (v) => v ? `${(v / 1000).toFixed(0)} km` : '0 km' },
  engine_hours: { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
  driver: { key: 'driverName', label: 'Driver' },
  trailer: { key: 'trailerName', label: 'Trailer' },
  custom_fields: { key: 'customFields', label: 'Custom Fields' },
  total: { key: 'total', label: 'Total', format: (v) => v ?? '' },

  // Object info columns
  imei: { key: 'uniqueId', label: 'IMEI' },
  group: { key: 'groupName', label: 'Group' },
  transport_model: { key: 'model', label: 'Transport Model' },
  vin: { key: 'vin', label: 'VIN' },
  plate_number: { key: 'plateNumber', label: 'Plate Number' },
  gps_device: { key: 'gpsDevice', label: 'GPS Device' },
  sim_card_number: { key: 'simCardNumber', label: 'SIM Card Number' },

  // Position columns
  time: { key: 'fixTime', label: 'Time', format: formatShortDateTime },
  position: { key: 'address', label: 'Position' },
  latitude: { key: 'latitude', label: 'Latitude', format: (v) => v?.toFixed(6) || '' },
  longitude: { key: 'longitude', label: 'Longitude', format: (v) => v?.toFixed(6) || '' },
  speed: { key: 'speed', label: 'Speed', format: formatSpeed },
  altitude: { key: 'altitude', label: 'Altitude', format: (v) => v ? `${v.toFixed(0)} m` : '0 m' },
  angle: { key: 'course', label: 'Angle', format: (v) => v ? `${v.toFixed(0)}°` : '0°' },
  status: { key: 'status', label: 'Status' },

  // Drive/Stop columns
  start: { key: 'startTime', label: 'Start', format: formatShortDateTime },
  end: { key: 'endTime', label: 'End', format: formatShortDateTime },
  duration: { key: 'duration', label: 'Duration', format: formatDuration },

  // Travel sheet columns
  time_a: { key: 'startTime', label: 'Time (Start)', format: formatShortDateTime },
  position_a: { key: 'startAddress', label: 'Position (Start)' },
  odometer_a: { key: 'startOdometer', label: 'Odometer (Start)', format: (v) => v ? `${(v / 1000).toFixed(0)} km` : '0 km' },
  time_b: { key: 'endTime', label: 'Time (End)', format: formatShortDateTime },
  position_b: { key: 'endAddress', label: 'Position (End)' },
  odometer_b: { key: 'endOdometer', label: 'Odometer (End)', format: (v) => v ? `${(v / 1000).toFixed(0)} km` : '0 km' },

  // Overspeed/Underspeed columns
  overspeed_position: { key: 'address', label: 'Overspeed Position' },
  underspeed_position: { key: 'address', label: 'Underspeed Position' },

  // Zone columns
  zone_in: { key: 'zoneIn', label: 'Zone In', format: formatShortDateTime },
  zone_out: { key: 'zoneOut', label: 'Zone Out', format: formatShortDateTime },
  zone_name: { key: 'zoneName', label: 'Zone Name' },
  zone_position: { key: 'zoneAddress', label: 'Zone Position' },

  // Marker columns
  marker_in: { key: 'markerIn', label: 'Marker In', format: formatShortDateTime },
  marker_out: { key: 'markerOut', label: 'Marker Out', format: formatShortDateTime },
  marker_name: { key: 'markerName', label: 'Marker Name' },
  marker_position: { key: 'markerAddress', label: 'Marker Position' },

  // Event columns
  event: { key: 'type', label: 'Event' },
  event_position: { key: 'address', label: 'Event Position' },

  // Service columns
  service: { key: 'serviceName', label: 'Service' },
  last_service: { key: 'lastService', label: 'Last Service', format: formatShortDateTime },
  service_status: { key: 'status', label: 'Status' },

  // Fuel columns
  before: { key: 'fuelBefore', label: 'Before', format: formatFuel },
  after: { key: 'fuelAfter', label: 'After', format: formatFuel },
  filled: { key: 'fuelFilled', label: 'Filled', format: formatFuel },
  stolen: { key: 'fuelStolen', label: 'Stolen', format: formatFuel },
  sensor: { key: 'sensorName', label: 'Sensor' },

  // RAG columns
  overspeed_score: { key: 'overspeedScore', label: 'Overspeed Score', format: (v) => v?.toFixed(2) || '0.00' },
  harsh_acceleration_score: { key: 'harshAccelerationScore', label: 'Harsh Acceleration Score', format: (v) => v?.toFixed(2) || '0.00' },
  harsh_braking_score: { key: 'harshBrakingScore', label: 'Harsh Braking Score', format: (v) => v?.toFixed(2) || '0.00' },
  harsh_cornering_score: { key: 'harshCorneringScore', label: 'Harsh Cornering Score', format: (v) => v?.toFixed(2) || '0.00' },

  // Task columns
  name: { key: 'name', label: 'Name' },
  description: { key: 'description', label: 'Description' },
  from: { key: 'fromName', label: 'From' },
  to: { key: 'toName', label: 'To' },
  start_time: { key: 'startTime', label: 'Start Time', format: formatShortDateTime },
  end_time: { key: 'endTime', label: 'End Time', format: formatShortDateTime },
  priority: { key: 'priority', label: 'Priority' },

  // DTC columns
  code: { key: 'code', label: 'Code' },

  // Expense columns
  date: { key: 'date', label: 'Date', format: formatShortDateTime },
  object: { key: 'objectName', label: 'Object' },
  quantity: { key: 'quantity', label: 'Quantity' },
  cost: { key: 'cost', label: 'Cost', format: formatCost },
  supplier: { key: 'supplier', label: 'Supplier' },
  buyer: { key: 'buyer', label: 'Buyer' },

  // Logic sensor columns
  activation_time: { key: 'activationTime', label: 'Activation Time', format: formatShortDateTime },
  deactivation_time: { key: 'deactivationTime', label: 'Deactivation Time', format: formatShortDateTime },
  activation_position: { key: 'activationAddress', label: 'Activation Position' },
  deactivation_position: { key: 'deactivationAddress', label: 'Deactivation Position' },
};

/* ─────────── Get columns based on data items selection (V1 parity) ─────────── */
export const getColumnsForDataItems = (reportType, selectedDataItems) => {
  // If no selection or empty selection, return all columns for this report type
  if (!selectedDataItems || selectedDataItems.length === 0) {
    return getAllColumnsForReportType(reportType);
  }

  // Filter columns based on selected data items
  return selectedDataItems
    .map((itemKey) => COLUMN_MAP[itemKey])
    .filter((col) => col != null);
};

/* ─────────── Get all columns for a report type (V1 parity) ─────────── */
export const getAllColumnsForReportType = (reportType) => {
  const typeColumnMap = {
    general: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer', 'custom_fields'],
    general_merged: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer', 'total'],
    object_info: ['imei', 'group', 'transport_model', 'vin', 'plate_number', 'odometer', 'engine_hours', 'driver', 'trailer', 'gps_device', 'sim_card_number'],
    current_position: ['time', 'position', 'speed', 'altitude', 'angle', 'status', 'odometer', 'engine_hours', 'driver', 'trailer'],
    current_position_off: ['time', 'position', 'speed', 'altitude', 'angle', 'status', 'odometer', 'engine_hours', 'driver', 'trailer'],
    route: ['time', 'position', 'speed', 'altitude', 'angle'],
    route_data_sensors: ['time', 'position', 'speed', 'altitude', 'angle'],
    drives_stops: ['status', 'start', 'end', 'duration', 'move_duration', 'stop_duration', 'route_length', 'top_speed', 'avg_speed', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'driver', 'trailer'],
    drives_stops_sensors: ['status', 'start', 'end', 'duration', 'move_duration', 'stop_duration', 'route_length', 'top_speed', 'avg_speed', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'driver', 'trailer'],
    drives_stops_logic: ['status', 'start', 'end', 'duration', 'move_duration', 'stop_duration', 'route_length', 'top_speed', 'avg_speed', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'driver', 'trailer'],
    travel_sheet: ['time_a', 'position_a', 'odometer_a', 'time_b', 'position_b', 'odometer_b', 'duration', 'route_length', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'driver', 'trailer', 'total'],
    travel_sheet_dn: ['time_a', 'position_a', 'odometer_a', 'time_b', 'position_b', 'odometer_b', 'duration', 'route_length', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'driver', 'trailer', 'total'],
    mileage_daily: ['time', 'start', 'end', 'move_duration', 'route_length', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_hours', 'driver', 'trailer', 'total'],
    overspeed: ['start', 'end', 'duration', 'top_speed', 'avg_speed', 'overspeed_position', 'driver', 'trailer'],
    overspeed_count: ['route_start', 'route_end', 'route_length', 'move_duration', 'top_speed', 'avg_speed', 'overspeed_count'],
    underspeed: ['start', 'end', 'duration', 'top_speed', 'avg_speed', 'underspeed_position', 'driver', 'trailer'],
    underspeed_count: ['route_start', 'route_end', 'route_length', 'move_duration', 'top_speed', 'avg_speed', 'underspeed_count'],
    marker_in_out: ['marker_in', 'marker_out', 'duration', 'route_length', 'engine_hours', 'marker_name', 'marker_position', 'total'],
    marker_in_out_gen: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer', 'total'],
    zone_in_out: ['zone_in', 'zone_out', 'duration', 'route_length', 'engine_hours', 'zone_name', 'zone_position', 'total'],
    zone_in_out_general: ['zone_in', 'zone_out', 'duration', 'route_length', 'engine_hours', 'zone_name', 'zone_position', 'total'],
    events: ['time', 'event', 'event_position', 'driver', 'trailer', 'total'],
    service: ['service', 'last_service', 'status'],
    fuelfillings: ['time', 'position', 'before', 'after', 'filled', 'sensor', 'driver', 'trailer', 'total'],
    fuelthefts: ['time', 'position', 'before', 'after', 'stolen', 'sensor', 'driver', 'trailer', 'total'],
    rag: ['overspeed_score', 'harsh_acceleration_score', 'harsh_braking_score', 'harsh_cornering_score'],
    rag_driver: ['overspeed_score', 'harsh_acceleration_score', 'harsh_braking_score', 'harsh_cornering_score'],
    tasks: ['name', 'description', 'from', 'start_time', 'to', 'end_time', 'priority', 'status'],
    rilogbook: ['group', 'name', 'position'],
    dtc: ['code', 'position'],
    expenses: ['date', 'name', 'object', 'quantity', 'cost', 'supplier', 'buyer', 'odometer', 'engine_hours', 'description', 'total'],
    logic_sensors: ['sensor', 'activation_time', 'deactivation_time', 'duration', 'activation_position', 'deactivation_position'],
    // Graphical reports - no columns
    speed_graph: [],
    altitude_graph: [],
    acc_graph: [],
    fuellevel_graph: [],
    temperature_graph: [],
    sensor_graph: [],
    // Map reports
    routes: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer'],
    routes_stops: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer'],
    image_gallery: ['time', 'position'],
  };

  const itemKeys = typeColumnMap[reportType] || typeColumnMap.general;
  return itemKeys.map((key) => COLUMN_MAP[key]).filter((col) => col != null);
};

/* ─────────── Legacy column definitions (for backward compatibility) ─────────── */
export const ROUTE_COLUMNS = [
  { key: 'fixTime', label: 'Time', format: formatDateTime },
  { key: 'latitude', label: 'Lat', format: (v) => v?.toFixed(5) },
  { key: 'longitude', label: 'Lng', format: (v) => v?.toFixed(5) },
  { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  { key: 'address', label: 'Address' },
];

export const EVENT_COLUMNS = [
  { key: 'eventTime', label: 'Time', format: formatDateTime },
  { key: 'type', label: 'Type' },
  { key: 'deviceId', label: 'Device ID' },
];

export const TRIP_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'startTime', label: 'Start', format: formatDateTime },
  { key: 'endTime', label: 'End', format: formatDateTime },
  { key: 'distance', label: 'Distance', format: formatDistance },
  { key: 'duration', label: 'Duration', format: formatDuration },
  { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
];

export const STOP_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'startTime', label: 'Start', format: formatDateTime },
  { key: 'endTime', label: 'End', format: formatDateTime },
  { key: 'duration', label: 'Duration', format: formatDuration },
  { key: 'address', label: 'Address' },
];

export const SUMMARY_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'distance', label: 'Distance', format: formatDistance },
  { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
  { key: 'spentFuel', label: 'Fuel Used', format: (v) => (v ? `${v.toFixed(2)} L` : '') },
];

// RAG (Red/Amber/Green) Driver Behavior columns
export const RAG_COLUMNS = [
  { key: 'deviceName', label: 'Object' },
  { key: 'distance', label: 'Route Length', format: formatDistance },
  { key: '_overspeedDuration', label: 'Overspeed Duration', format: formatDuration },
  { key: '_overspeedScore', label: 'Overspeed Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_haccelCount', label: 'Harsh Accel Count' },
  { key: '_haccelScore', label: 'Harsh Accel Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_hbrakeCount', label: 'Harsh Brake Count' },
  { key: '_hbrakeScore', label: 'Harsh Brake Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_hcornCount', label: 'Harsh Corner Count' },
  { key: '_hcornScore', label: 'Harsh Corner Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  {
    key: '_ragScore',
    label: 'RAG',
    format: (v) => {
      if (v == null) return '';
      const score = parseFloat(v);
      if (score <= 2.5) return `<span style="background:#00FF00;padding:2px 8px;font-weight:bold">GREEN (${score.toFixed(2)})</span>`;
      if (score <= 5) return `<span style="background:#FFFF00;padding:2px 8px;font-weight:bold">AMBER (${score.toFixed(2)})</span>`;
      return `<span style="background:#FF0000;color:white;padding:2px 8px;font-weight:bold">RED (${score.toFixed(2)})</span>`;
    },
    html: true,
  },
];

export const RESULT_COLUMNS = {
  general: SUMMARY_COLUMNS,
  general_merged: SUMMARY_COLUMNS,
  object_info: SUMMARY_COLUMNS,
  current_position: SUMMARY_COLUMNS,
  current_position_off: SUMMARY_COLUMNS,
  mileage_daily: SUMMARY_COLUMNS,
  service: SUMMARY_COLUMNS,
  fuelfillings: SUMMARY_COLUMNS,
  fuelthefts: SUMMARY_COLUMNS,
  tasks: SUMMARY_COLUMNS,
  expenses: SUMMARY_COLUMNS,
  route: ROUTE_COLUMNS,
  route_data_sensors: ROUTE_COLUMNS,
  overspeed: ROUTE_COLUMNS,
  overspeed_count: ROUTE_COLUMNS,
  underspeed: ROUTE_COLUMNS,
  underspeed_count: ROUTE_COLUMNS,
  logic_sensors: ROUTE_COLUMNS,
  trips: TRIP_COLUMNS,
  drives_stops_sensors: TRIP_COLUMNS,
  drives_stops_logic: TRIP_COLUMNS,
  travel_sheet: TRIP_COLUMNS,
  travel_sheet_dn: TRIP_COLUMNS,
  stops: STOP_COLUMNS,
  events: EVENT_COLUMNS,
  zone_in_out: EVENT_COLUMNS,
  zone_in_out_general: EVENT_COLUMNS,
  rilogbook: EVENT_COLUMNS,
  dtc: EVENT_COLUMNS,
  rag: [
    { key: 'deviceName', label: 'Object' },
    { key: 'overspeedScore', label: 'Overspeed Score', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshAccelerationScore', label: 'Harsh Acceleration', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshBrakingScore', label: 'Harsh Braking', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshCorneringScore', label: 'Harsh Cornering', format: (v) => v?.toFixed(1) || '0' },
    { key: 'totalScore', label: 'Total Score', format: (v) => v?.toFixed(1) || '0' },
    { key: 'ragRating', label: 'RAG Rating' },
  ],
  rag_driver: [
    { key: 'driverName', label: 'Driver' },
    { key: 'overspeedScore', label: 'Overspeed Score', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshAccelerationScore', label: 'Harsh Acceleration', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshBrakingScore', label: 'Harsh Braking', format: (v) => v?.toFixed(1) || '0' },
    { key: 'harshCorneringScore', label: 'Harsh Cornering', format: (v) => v?.toFixed(1) || '0' },
    { key: 'totalScore', label: 'Total Score', format: (v) => v?.toFixed(1) || '0' },
    { key: 'ragRating', label: 'RAG Rating' },
  ],
  speed_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  altitude_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'altitude', label: 'Altitude (m)', format: (v) => (v ? v.toFixed(1) : '0') },
  ],
  acc_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  fuellevel_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  temperature_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  sensor_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  routes_map: ROUTE_COLUMNS,
  routes_stops_map: ROUTE_COLUMNS,
  image_gallery: ROUTE_COLUMNS,
  summary: SUMMARY_COLUMNS,
};
