# Work Report — 25 February 2026

## Summary

Implemented multiple V1-to-V2 feature parity improvements for the GPS Tracking System (traccar-web), covering history playback, route controls, Object Control dialogs, performance optimizations, and the Messages tab.

---

## Changes Made

### 1. History Route Toolbar Controls (NEW)
**File:** `src/main/HistoryControls.jsx` (new)

- Floating toolbar on the map when a history route is displayed
- Toggle buttons for **Route** (polyline), **Stops** (stop markers), and **Events** (event markers) visibility
- Close button to hide the entire route
- Icons loaded from `/img/theme/route-route.svg`, `route-stop.svg`, `route-event.svg`
- Toggles wired through `MainPage` → `MainMap` → `MapRouteCoordinates` / `MapRouteMarkers`

### 2. Playback Marker on Map (NEW)
**File:** `src/map/MapPlaybackMarker.js` (new)

- Green arrow marker that moves along the route during graph playback
- Canvas-drawn 64×64 arrow icon (`#4CAF50` fill, `#1B5E20` border)
- Course-based rotation via `icon-rotation-alignment: 'map'`
- Smooth `requestAnimationFrame` interpolation with ease-in-out cubic
- Adaptive animation duration based on playback speed (1×–6×)
- Tooltip label showing `"speed kph - datetime"` using Mapbox GL text layer

### 3. Messages Tab Implementation
**File:** `src/main/DeviceInfoPanel.jsx`

- Replaced "Coming soon" placeholder with a full paginated raw GPS messages table
- Columns: # | Time (Device) | Time (Server) | Lat | Lng | Alt | Course | Speed | Attrs
- Expandable attributes row per message
- Click row → map pans to that position
- Pagination with 50 messages per page
- Data source: `historyRoute.positions` or `/api/reports/route` (last 24h fallback)

### 4. Graph & Playback Improvements
**File:** `src/main/DeviceInfoPanel.jsx`

- Auto-switch to Graph tab when history route is loaded
- Auto-show DeviceInfoPanel when history route loads (auto-select device)
- Recharts `isAnimationActive={false}` for better performance
- LTTB downsampling to max 2000 points for smooth chart rendering
- Playback callbacks now include `speed`, `course`, `timestamp`, `playSpeed`

### 5. History Tab Enhancements
**File:** `src/main/HistoryTab.jsx`

- Switched API from `/api/reports/combined` to `/api/reports/route` (correct endpoint)
- Added all 60 minutes (0–59) instead of only 00/15/30/45
- Client-side stop duration filter (minimum stop time in minutes)
- XLSX export via `/api/reports/route/xlsx`
- Route list segment collapsing for large datasets (30k+ positions → ~100-500 segments)
- Route coordinate simplification for datasets > 10,000 points

### 6. Route Markers Optimization
**File:** `src/map/MapRouteMarkers.js`

- Reduced marker scale from `0.08` to `0.07`
- Stop marker clustering: consecutive stop positions collapsed into single markers
- Capped at 200 stop markers and 100 event markers maximum
- `useMemo` for feature computation (prevents re-render on every frame)
- `showStops` / `showEvents` props for toggle support

### 7. Object Control Dialog — GPRS Tab
**File:** `src/main/ObjectControlTabs/GprsTab.jsx`

- Added ASCII/HEX command type selector with hex validation
- Redesigned layout: Object + Template row, Command + Type + Send row
- Multi-row selection with checkboxes + batch delete
- Refresh and Settings buttons in bottom toolbar
- Table columns reordered: checkbox, actions, time, object, name, command, status

### 8. Object Control Dialog — Schedule Tab (Rewritten)
**Files:** `src/main/ObjectControlTabs/ScheduleTab.jsx`, `ScheduleFormDialog.jsx` (new)

- Full CRUD for command schedules via `/api/command-schedules`
- Schedule form dialog with two-column layout (Schedule settings + Time settings)
- Supports **Exact time** and **Recurring** (per-day with individual times) schedule types
- Template auto-fill from saved command templates
- Multi-row selection with batch delete
- Active status indicator (green/red dot)

### 9. Object Control Dialog — Templates Tab (Rewritten)
**Files:** `src/main/ObjectControlTabs/TemplatesTab.jsx`, `TemplateFormDialog.jsx`

- Added protocol selector with "Hide unused" checkbox (filters to user's device protocols)
- Added encoding (ASCII/HEX) field
- Variables hint section (device.uniqueId, device.name)
- Multi-row selection with batch delete
- Protocol and encoding saved to template attributes

### 10. Object Control Dialog — SMS Tab (NEW)
**File:** `src/main/ObjectControlTabs/SmsTab.jsx` (new)

- Send SMS commands to devices via `textChannel: true`
- Template selector (default + custom templates)
- Command history table with delete support

### 11. MainPage Integration
**File:** `src/main/MainPage.jsx`

- `routeToggles` state (`{ route, stops, events }`) with toggle/close handlers
- `playbackPosition` state driven by `onGraphPointClick` callback
- Auto-select device when history route loads
- Clear playback marker and reset toggles when route is removed
- Renders `HistoryControls` toolbar inside map container

### 12. MainMap Updates
**File:** `src/main/MainMap.jsx`

- Accepts `routeToggles` and `playbackPosition` props
- Conditional rendering of `MapRouteCoordinates` based on `routeToggles.route`
- Passes `showStops`/`showEvents` to `MapRouteMarkers`
- Renders `MapPlaybackMarker` when `playbackPosition` is set

---

## New Files Created
| File | Purpose |
|------|---------|
| `src/main/HistoryControls.jsx` | Route visibility toggle toolbar |
| `src/map/MapPlaybackMarker.js` | Animated playback marker on map |
| `src/main/ObjectControlTabs/ScheduleFormDialog.jsx` | Schedule create/edit dialog |
| `src/main/ObjectControlTabs/SmsTab.jsx` | SMS command tab |
| `HISTORY_V1_V2_COMPARISON.md` | V1 vs V2 feature comparison document |

## Modified Files
| File | Changes |
|------|---------|
| `src/main/DeviceInfoPanel.jsx` | Messages tab, graph perf, playback data |
| `src/main/HistoryTab.jsx` | API fix, minutes, export, segmentation |
| `src/main/MainMap.jsx` | Route toggles, playback marker |
| `src/main/MainPage.jsx` | Route controls, playback state, auto-select |
| `src/main/ObjectControlDialog.jsx` | Dialog width, showNotification prop |
| `src/main/ObjectControlTabs/GprsTab.jsx` | Layout redesign, HEX support, batch ops |
| `src/main/ObjectControlTabs/ScheduleTab.jsx` | Full CRUD rewrite |
| `src/main/ObjectControlTabs/TemplateFormDialog.jsx` | Protocol, encoding, variables |
| `src/main/ObjectControlTabs/TemplatesTab.jsx` | Batch select/delete, protocol column |
| `src/map/MapRouteMarkers.js` | Clustering, toggle props, perf |

---

## Technical Stack
- **Frontend:** React + MUI + Vite + Mapbox GL JS
- **Charting:** Recharts 3.1.0
- **State:** Redux + React hooks
- **Styling:** tss-react/mui (makeStyles)

## Build Status
All files compile cleanly with no errors.
