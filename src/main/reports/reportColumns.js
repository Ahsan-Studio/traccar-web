/* ─────────── Column definitions for report tables ─────────── */
const formatDateTime = (dt) => { if (!dt) return ''; return new Date(dt).toLocaleString(); };
const formatDuration = (ms) => { if (!ms) return ''; const s = Math.floor(ms / 1000); return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`; };
const formatDistance = (m) => (m ? `${(m / 1000).toFixed(2)} km` : '0');

/* Column definitions for generated report viewer – mapped by API endpoint type */
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
