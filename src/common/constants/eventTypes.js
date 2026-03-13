/**
 * Unified Event Type Constants
 *
 * Single source of truth for all event types used across the application.
 * Custom (V1-style GSI) types + legacy Traccar-native types.
 */

// ── Custom event types (GSI / V1-style) ────────────────────────────
export const CUSTOM_EVENT_TYPES = [
  { value: 'sos', label: 'SOS' },
  { value: 'bracon', label: 'Bracelet On' },
  { value: 'bracoff', label: 'Bracelet Off' },
  { value: 'dismount', label: 'Dismount' },
  { value: 'disassem', label: 'Disassemble' },
  { value: 'door', label: 'Door' },
  { value: 'mandown', label: 'Man Down' },
  { value: 'shock', label: 'Shock' },
  { value: 'tow', label: 'Tow' },
  { value: 'pwrcut', label: 'Power Cut' },
  { value: 'gpsantcut', label: 'GPS Antenna Cut' },
  { value: 'jamming', label: 'Signal Jamming' },
  { value: 'lowdc', label: 'Low DC' },
  { value: 'lowbat', label: 'Low Battery' },
  { value: 'connyes', label: 'Connection Yes' },
  { value: 'connno', label: 'Connection No' },
  { value: 'gpsyes', label: 'GPS Yes' },
  { value: 'gpsno', label: 'GPS No' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'moving', label: 'Moving' },
  { value: 'engidle', label: 'Engine Idle' },
  { value: 'overspeed', label: 'Overspeed' },
  { value: 'underspeed', label: 'Underspeed' },
  { value: 'haccel', label: 'Harsh Acceleration' },
  { value: 'hbrake', label: 'Harsh Braking' },
  { value: 'hcorn', label: 'Harsh Cornering' },
  { value: 'driverch', label: 'Driver Change' },
  { value: 'trailerch', label: 'Trailer Change' },
  { value: 'param', label: 'Parameter' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'service', label: 'Service' },
  { value: 'dtc', label: 'Diagnostic Trouble Codes' },
  { value: 'proximity', label: 'Proximity' },
  { value: 'route_in', label: 'Route In' },
  { value: 'route_out', label: 'Route Out' },
  { value: 'zone_in', label: 'Zone In' },
  { value: 'zone_out', label: 'Zone Out' },
];

// ── Legacy Traccar-native event types ──────────────────────────────
export const TRACCAR_EVENT_TYPES = [
  { value: 'deviceOnline', label: 'Device Online' },
  { value: 'deviceUnknown', label: 'Device Unknown' },
  { value: 'deviceOffline', label: 'Device Offline' },
  { value: 'deviceInactive', label: 'Device Inactive' },
  { value: 'deviceMoving', label: 'Device Moving' },
  { value: 'deviceStopped', label: 'Device Stopped' },
  { value: 'deviceOverspeed', label: 'Overspeed' },
  { value: 'deviceFuelDrop', label: 'Fuel Drop' },
  { value: 'deviceFuelIncrease', label: 'Fuel Increase' },
  { value: 'geofenceEnter', label: 'Geofence Enter' },
  { value: 'geofenceExit', label: 'Geofence Exit' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'ignitionOn', label: 'Ignition On' },
  { value: 'ignitionOff', label: 'Ignition Off' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'textMessage', label: 'Text Message' },
  { value: 'driverChanged', label: 'Driver Changed' },
  { value: 'media', label: 'Media' },
  { value: 'commandResult', label: 'Command Result' },
];

// ── Combined list (custom first, then Traccar-native) ──────────────
export const ALL_EVENT_TYPES = [...CUSTOM_EVENT_TYPES, ...TRACCAR_EVENT_TYPES];

// ── Flat lookup  { value → label }  ────────────────────────────────
export const EVENT_TYPE_LABELS = Object.fromEntries(
  ALL_EVENT_TYPES.map((t) => [t.value, t.label]),
);

/**
 * Resolve a human-readable label for any event type string.
 * Falls back to the raw type value if unknown.
 */
export const getEventTypeLabel = (type) => EVENT_TYPE_LABELS[type] || type || 'Unknown';

// ── Type groups for conditional field visibility (EventEditDialog) ──
export const TYPES_WITH_TIME_PERIOD = ['connno', 'gpsno', 'stopped', 'moving', 'engidle'];
export const TYPES_WITH_SPEED_LIMIT = ['overspeed', 'underspeed'];
export const TYPES_WITH_DISTANCE = ['proximity'];
export const TYPES_WITH_CONDITIONS = ['param', 'sensor'];
export const TYPES_ROUTE_ONLY = ['route_in', 'route_out'];
export const TYPES_ZONE_ONLY = ['zone_in', 'zone_out'];
