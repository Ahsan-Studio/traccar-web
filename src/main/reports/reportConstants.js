/* ─────────── Data Items per Report Type (V1 parity) ─────────── */
export const DATA_ITEMS = {
  // Text Reports
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
  // Graphical Reports (no data items - graphs only)
  speed_graph: [],
  altitude_graph: [],
  acc_graph: [],
  fuellevel_graph: [],
  temperature_graph: [],
  sensor_graph: [],
  // Map Reports
  routes: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer'],
  routes_stops: ['route_start', 'route_end', 'route_length', 'move_duration', 'stop_duration', 'stop_count', 'top_speed', 'avg_speed', 'overspeed_count', 'fuel_consumption', 'avg_fuel_consumption', 'fuel_cost', 'engine_work', 'engine_idle', 'odometer', 'engine_hours', 'driver', 'trailer'],
  image_gallery: ['time', 'position'],
};

/* ─────────── Data Item Labels (for display) ─────────── */
export const DATA_ITEM_LABELS = {
  route_start: 'Route Start',
  route_end: 'Route End',
  route_length: 'Route Length',
  move_duration: 'Move Duration',
  stop_duration: 'Stop Duration',
  stop_count: 'Stop Count',
  top_speed: 'Top Speed',
  avg_speed: 'Average Speed',
  overspeed_count: 'Overspeed Count',
  fuel_consumption: 'Fuel Consumption',
  avg_fuel_consumption: 'Avg Fuel Consumption',
  fuel_cost: 'Fuel Cost',
  engine_work: 'Engine Work',
  engine_idle: 'Engine Idle',
  odometer: 'Odometer',
  engine_hours: 'Engine Hours',
  driver: 'Driver',
  trailer: 'Trailer',
  custom_fields: 'Custom Fields',
  total: 'Total',
  imei: 'IMEI',
  group: 'Group',
  transport_model: 'Transport Model',
  vin: 'VIN',
  plate_number: 'Plate Number',
  gps_device: 'GPS Device',
  sim_card_number: 'SIM Card Number',
  time: 'Time',
  position: 'Position',
  speed: 'Speed',
  altitude: 'Altitude',
  angle: 'Angle',
  status: 'Status',
  start: 'Start',
  end: 'End',
  duration: 'Duration',
  time_a: 'Time (Start)',
  position_a: 'Position (Start)',
  odometer_a: 'Odometer (Start)',
  time_b: 'Time (End)',
  position_b: 'Position (End)',
  odometer_b: 'Odometer (End)',
  overspeed_position: 'Overspeed Position',
  underspeed_position: 'Underspeed Position',
  zone_in: 'Zone In',
  zone_out: 'Zone Out',
  zone_name: 'Zone Name',
  zone_position: 'Zone Position',
  marker_in: 'Marker In',
  marker_out: 'Marker Out',
  marker_name: 'Marker Name',
  marker_position: 'Marker Position',
  event: 'Event',
  event_position: 'Event Position',
  service: 'Service',
  last_service: 'Last Service',
  before: 'Before',
  after: 'After',
  filled: 'Filled',
  stolen: 'Stolen',
  sensor: 'Sensor',
  overspeed_score: 'Overspeed Score',
  harsh_acceleration_score: 'Harsh Acceleration Score',
  harsh_braking_score: 'Harsh Braking Score',
  harsh_cornering_score: 'Harsh Cornering Score',
  name: 'Name',
  description: 'Description',
  from: 'From',
  to: 'To',
  start_time: 'Start Time',
  end_time: 'End Time',
  priority: 'Priority',
  code: 'Code',
  date: 'Date',
  object: 'Object',
  quantity: 'Quantity',
  cost: 'Cost',
  supplier: 'Supplier',
  buyer: 'Buyer',
  activation_time: 'Activation Time',
  deactivation_time: 'Deactivation Time',
  activation_position: 'Activation Position',
  deactivation_position: 'Deactivation Position',
};

/* ─────────── Report type definitions (V1 parity – 4 groups) ─────────── */
export const REPORT_TYPES = [
  // Text Reports
  { id: 'general', label: 'General Information', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'general_merged', label: 'General Information (Merged)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'object_info', label: 'Object Information', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'current_position', label: 'Current Position', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'current_position_off', label: 'Current Position (Offline)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'route_data_sensors', label: 'Route Data with Sensors', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'drives_stops', label: 'Drives and Stops', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'drives_stops_sensors', label: 'Drives and Stops with Sensors', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'drives_stops_logic', label: 'Drives and Stops with Logic Sensors', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'travel_sheet', label: 'Travel Sheet', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'travel_sheet_dn', label: 'Travel Sheet (Day/Night)', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'mileage_daily', label: 'Mileage Daily', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'overspeed', label: 'Overspeeds', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'overspeed_count', label: 'Overspeed Count (Merged)', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'underspeed', label: 'Underspeeds', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'underspeed_count', label: 'Underspeed Count (Merged)', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'marker_in_out', label: 'Marker In/Out', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'marker_in_out_gen', label: 'Marker In/Out with Gen Info', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'zone_in_out', label: 'Zone In/Out', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'zone_in_out_general', label: 'Zone In/Out with General Info', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'events', label: 'Events', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'service', label: 'Service', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'fuelfillings', label: 'Fuel Fillings', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'fuelthefts', label: 'Fuel Thefts', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'logic_sensors', label: 'Logic Sensors', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'rag', label: 'Driver Behavior RAG (by Object)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'rag_driver', label: 'Driver Behavior RAG (by Driver)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'tasks', label: 'Tasks', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'rilogbook', label: 'RFID and iButton Logbook', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'dtc', label: 'Diagnostic Trouble Codes', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'expenses', label: 'Expenses', group: 'Text Reports', endpoint: '/api/reports/summary' },
  // Graphical Reports
  { id: 'speed_graph', label: 'Speed', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'altitude_graph', label: 'Altitude', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'acc_graph', label: 'Ignition', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'fuellevel_graph', label: 'Fuel Level', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'temperature_graph', label: 'Temperature', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'sensor_graph', label: 'Sensor', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  // Map Reports
  { id: 'routes', label: 'Routes', group: 'Map Reports', endpoint: '/api/reports/route' },
  { id: 'routes_stops', label: 'Routes with Stops', group: 'Map Reports', endpoint: '/api/reports/route' },
  { id: 'image_gallery', label: 'Image Gallery', group: 'Media Reports', endpoint: '/api/reports/route' },
];

export const REPORT_TYPE_MAP = {};
REPORT_TYPES.forEach((rt) => { REPORT_TYPE_MAP[rt.id] = rt; });

export const FORMAT_OPTIONS = [
  { id: 'html', label: 'HTML' },
  { id: 'pdf', label: 'PDF' },
  { id: 'xls', label: 'XLS' },
];

export const TIME_FILTERS = [
  { id: '', label: '—' },
  { id: 'lastHour', label: 'Last Hour' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'before2days', label: 'Before 2 Days' },
  { id: 'before3days', label: 'Before 3 Days' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
];

export const STOP_DURATIONS = [
  { value: '1', label: '> 1 min' },
  { value: '2', label: '> 2 min' },
  { value: '5', label: '> 5 min' },
  { value: '10', label: '> 10 min' },
  { value: '20', label: '> 20 min' },
  { value: '30', label: '> 30 min' },
  { value: '60', label: '> 1 h' },
  { value: '120', label: '> 2 h' },
  { value: '300', label: '> 5 h' },
];

/* ─────────── Derived select options for custom components ─────────── */
export const TYPE_OPTIONS = REPORT_TYPES.map((rt) => ({ value: rt.id, label: rt.label }));

/* ─────────── Grouped type options (V1 parity with optgroups) ─────────── */
export const TYPE_OPTIONS_GROUPED = [
  {
    group: 'Text Reports',
    options: REPORT_TYPES.filter((rt) => rt.group === 'Text Reports').map((rt) => ({ value: rt.id, label: rt.label })),
  },
  {
    group: 'Graphical Reports',
    options: REPORT_TYPES.filter((rt) => rt.group === 'Graphical Reports').map((rt) => ({ value: rt.id, label: rt.label })),
  },
  {
    group: 'Map Reports',
    options: REPORT_TYPES.filter((rt) => rt.group === 'Map Reports').map((rt) => ({ value: rt.id, label: rt.label })),
  },
  {
    group: 'Media Reports',
    options: REPORT_TYPES.filter((rt) => rt.group === 'Media Reports').map((rt) => ({ value: rt.id, label: rt.label })),
  },
];

/* ─────────── Check if report type should only have HTML format (V1 parity) ─────────── */
export const isGraphicalOrMapReport = (type) => {
  const htmlOnlyTypes = [
    'speed_graph', 'altitude_graph', 'acc_graph', 'fuellevel_graph',
    'temperature_graph', 'sensor_graph', 'routes', 'routes_stops', 'image_gallery',
  ];
  return htmlOnlyTypes.includes(type);
};

export const FORMAT_SELECT_OPTIONS = FORMAT_OPTIONS.map((f) => ({ value: f.id, label: f.label }));
export const TIME_FILTER_OPTIONS = TIME_FILTERS.map((f) => ({ value: f.id, label: f.label }));
export const STOP_DURATION_OPTIONS = STOP_DURATIONS.map((s) => ({ value: s.value, label: s.label }));

/* ─────────── Hour and Minute options for Day/Night config ─────────── */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }));

/* ─────────── Empty template factory ─────────── */
export const emptyTemplate = () => ({
  id: Date.now(),
  name: '',
  type: 'general',
  format: 'html',
  deviceIds: [],
  zoneIds: [],
  sensorIds: [],
  markerIds: [],
  dataItems: [],
  ignoreEmpty: false,
  showCoordinates: true,
  showAddresses: false,
  markersAddresses: false,
  zonesAddresses: false,
  stopDuration: '1',
  speedLimit: '',
  daily: false,
  weekly: false,
  scheduleEmail: '',
  timeFilter: '',
  // V1 parity: separate date and time fields
  dateFrom: '',
  hourFrom: 0,
  minuteFrom: 0,
  dateTo: '',
  hourTo: 23,
  minuteTo: 59,
  // Day/Night config for travel_sheet_dn
  nightStartHour: 22,
  nightStartMinute: 0,
  nightEndHour: 6,
  nightEndMinute: 0,
  // RAG score config for driver behavior reports
  ragLowScore: 0,
  ragHighScore: 100,
});
