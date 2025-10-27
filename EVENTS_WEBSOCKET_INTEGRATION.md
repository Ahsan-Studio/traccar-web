# Events Tab - WebSocket Integration

**Date:** 2025-10-21  
**Status:** ✅ COMPLETED  
**Feature:** Real-time events via WebSocket with API fallback

---

## Overview

Events tab sekarang terintegrasi dengan WebSocket untuk mendapatkan event real-time, dengan fallback ke REST API endpoint `/api/reports/events`.

---

## Implementation

### 1. **WebSocket Integration**

**How it works:**
- `SocketController.jsx` sudah menangani WebSocket connection
- Events diterima via `data.events` dari WebSocket
- Events otomatis masuk ke Redux store `state.events.items`
- `EventsList` subscribe ke Redux store untuk real-time updates

**Code Flow:**
```
WebSocket → SocketController → Redux Store → EventsList
```

### 2. **Redux Store Integration**

**EventsList.jsx Changes:**

```javascript
import { useSelector } from 'react-redux';

const EventsList = () => {
  // Get events from Redux store (populated by WebSocket)
  const storeEvents = useSelector((state) => state.events.items);
  const devices = useSelector((state) => state.devices.items);
  
  // Sync Redux events to local state with device names
  useEffect(() => {
    if (Object.keys(devices).length > 0) {
      const eventsWithDevices = Object.values(storeEvents).map(event => ({
        ...event,
        deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
      })).sort((a, b) => dayjs(b.eventTime).valueOf() - dayjs(a.eventTime).valueOf());
      
      setEvents(eventsWithDevices);
      setLoading(false);
    }
  }, [storeEvents, devices]);
}
```

**Benefits:**
- ✅ **Real-time updates** - Events muncul instantly dari WebSocket
- ✅ **No polling** - Tidak perlu interval refresh (hemat bandwidth)
- ✅ **Auto-sync** - Redux store di-update otomatis oleh SocketController

### 3. **API Fallback (Refresh Button)**

**handleRefresh Function:**

```javascript
const handleRefresh = async () => {
  setLoading(true);
  try {
    // Fetch last 24 hours of events
    const from = dayjs().subtract(24, 'hours').toISOString();
    const to = dayjs().toISOString();
    
    const response = await fetchOrThrow(`/api/reports/events?from=${from}&to=${to}`);
    const apiEvents = await response.json();
    
    // Process and merge with store events
    const eventsWithDevices = apiEvents.map(event => ({
      ...event,
      deviceName: devices[event.deviceId]?.name || `Device ${event.deviceId}`,
    })).sort((a, b) => dayjs(b.eventTime).valueOf() - dayjs(a.eventTime).valueOf());
    
    setEvents(eventsWithDevices);
  } catch (err) {
    console.error('Error fetching events:', err);
  } finally {
    setLoading(false);
  }
};
```

**API Endpoint:**
```
GET /api/reports/events?from={ISO8601}&to={ISO8601}
```

**Parameters:**
- `from` - Start time (ISO 8601 format)
- `to` - End time (ISO 8601 format)
- Optional: `deviceId`, `groupId`, `type`

**Example:**
```
GET /api/reports/events?from=2025-10-20T06:49:00Z&to=2025-10-21T06:49:00Z
```

### 4. **Event Type Mapping**

**Indonesian Descriptions:**

```javascript
const eventTypeMap = {
  deviceOnline: 'Perangkat Online',
  deviceOffline: 'Perangkat Offline',
  deviceMoving: 'Perangkat Bergerak',
  deviceStopped: 'Perangkat Berhenti',
  ignitionOn: 'Mesin Dihidupkan',
  ignitionOff: 'Mesin Dimatikan',
  geofenceEnter: 'Masuk Geofence',
  geofenceExit: 'Keluar Geofence',
  alarm: 'Alarm',
  maintenance: 'Maintenance',
};
```

**Additional Message:**
- If `event.attributes.message` exists, append it to description

---

## Data Flow

### Real-time Flow (WebSocket)

```
┌──────────────────┐
│ Traccar Backend  │
│ (Event occurs)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ WebSocket        │
│ /api/socket      │
└────────┬─────────┘
         │ data.events
         ▼
┌──────────────────┐
│ SocketController │
│ handleEvents()   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Redux Store      │
│ eventsActions    │
│ .add(events)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ EventsList       │
│ useSelector      │
│ state.events     │
└──────────────────┘
```

### Manual Refresh Flow (API)

```
┌──────────────────┐
│ User clicks      │
│ Refresh button   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ handleRefresh()  │
│ GET /api/reports │
│ /events          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Fetch 24h events │
│ from API         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Process & display│
│ in EventsList    │
└──────────────────┘
```

---

## Features

### ✅ Real-time Events
- Events muncul **instantly** via WebSocket
- Tidak perlu refresh manual
- Auto-scroll ke event terbaru (optional)

### ✅ Search/Filter
- Filter by device name
- Filter by event description
- Case-insensitive search

### ✅ Export to CSV
- Export filtered events
- Format: Waktu, Objek, Kejadian
- Automatic download

### ✅ Refresh Button
- Manual refresh dari API
- Fetch last 24 hours
- Loading indicator

### ✅ Delete All
- Confirmation dialog
- DELETE /api/events endpoint
- Clear all events

---

## Event Object Structure

### From WebSocket
```json
{
  "id": 123,
  "deviceId": 1,
  "type": "ignitionOn",
  "eventTime": "2025-10-21T06:49:00Z",
  "serverTime": "2025-10-21T06:49:01Z",
  "positionId": 456,
  "geofenceId": null,
  "maintenanceId": null,
  "attributes": {
    "message": "Additional info",
    "alarm": "sos"
  }
}
```

### From API (/api/reports/events)
```json
{
  "id": 123,
  "deviceId": 1,
  "type": "deviceOnline",
  "eventTime": "2025-10-21T06:49:00.000Z",
  "positionId": 456,
  "geofenceId": null,
  "maintenanceId": null,
  "attributes": {
    "message": "Device connected"
  }
}
```

---

## Backend Clues (from Team)

### 1. REST API Endpoint
```
GET /api/reports/events
```

**Documentation:**
https://www.traccar.org/api-reference/#tag/Reports/paths/~1reports~1events/get

**Parameters:**
- `from` (required) - Start time (ISO 8601)
- `to` (required) - End time (ISO 8601)
- `deviceId` - Filter by device
- `groupId` - Filter by group
- `type` - Filter by event type

### 2. WebSocket
```
wss://yourdomain/api/socket
```

**Real-time updates for:**
- `data.events` - New events array
- `data.devices` - Device updates
- `data.positions` - Position updates
- `data.logs` - System logs (if enabled)

---

## Testing Checklist

### ✅ WebSocket Integration
- [ ] Events appear instantly when device triggers event
- [ ] No manual refresh needed
- [ ] Redux store updates correctly
- [ ] Device names displayed properly

### ✅ Refresh Button
- [ ] Click refresh loads last 24h events
- [ ] Loading indicator shows
- [ ] Events sorted by time descending
- [ ] No duplicate events

### ✅ Search/Filter
- [ ] Filter by device name works
- [ ] Filter by event type works
- [ ] Case-insensitive
- [ ] Clear search shows all events

### ✅ Export
- [ ] CSV export works
- [ ] Filtered events exported
- [ ] Proper formatting
- [ ] Automatic download

### ✅ Delete
- [ ] Confirmation dialog appears
- [ ] All events cleared
- [ ] No errors in console

---

## Files Modified

1. ✅ `/src/main/EventsList.jsx`
   - Added Redux integration
   - WebSocket real-time updates
   - API fallback for refresh
   - Event type mapping
   - Indonesian descriptions

---

## Migration Notes

### Before (Old Implementation)
```javascript
// Polling every 60 seconds
const interval = setInterval(fetchEvents, 60000);

// Fetch from /api/positions
const response = await fetchOrThrow('/api/positions');
```

### After (New Implementation)
```javascript
// Real-time via WebSocket (no polling)
const storeEvents = useSelector((state) => state.events.items);

// Manual refresh from proper endpoint
const response = await fetchOrThrow(`/api/reports/events?from=${from}&to=${to}`);
```

**Improvements:**
- ✅ Real-time updates (no 60s delay)
- ✅ Proper API endpoint usage
- ✅ Better performance (no polling)
- ✅ Consistent with Traccar architecture

---

## Common Event Types

| Type | Indonesian | Description |
|------|-----------|-------------|
| `deviceOnline` | Perangkat Online | Device connected |
| `deviceOffline` | Perangkat Offline | Device disconnected |
| `deviceMoving` | Perangkat Bergerak | Device started moving |
| `deviceStopped` | Perangkat Berhenti | Device stopped |
| `ignitionOn` | Mesin Dihidupkan | Ignition turned on |
| `ignitionOff` | Mesin Dimatikan | Ignition turned off |
| `geofenceEnter` | Masuk Geofence | Entered geofence |
| `geofenceExit` | Keluar Geofence | Exited geofence |
| `alarm` | Alarm | Alarm triggered |
| `maintenance` | Maintenance | Maintenance due |

---

## Troubleshooting

### Issue: Events not updating in real-time
**Check:**
1. WebSocket connection active? (Redux state.session.socket)
2. SocketController running?
3. Backend sending events via WebSocket?

### Issue: Refresh button not working
**Check:**
1. API endpoint `/api/reports/events` accessible?
2. Date range valid (from < to)?
3. Network tab shows 200 OK?

### Issue: Device names not showing
**Check:**
1. Devices loaded in Redux store?
2. `state.devices.items` populated?
3. Event has valid `deviceId`?

---

## Next Steps

- [ ] Add event filtering by type dropdown
- [ ] Add date range picker for custom time range
- [ ] Add pagination for large event lists
- [ ] Add event details modal on row click
- [ ] Add sound notifications for critical events
- [ ] Add desktop notifications

---

**STATUS: READY FOR TESTING** 🚀

Events tab sekarang real-time via WebSocket dengan fallback ke API!
