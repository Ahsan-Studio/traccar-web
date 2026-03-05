# V2 GPS Tracking System — Rewrite Progress Report

**Date**: March 5, 2026  
**Platform**: Traccar-Web V2 (React + MUI) rewriting GPS-server.net V1 (PHP + jQuery)  
**Frontend**: React 18, Material UI 5, MapLibre GL, Recharts, Vite  
**Backend**: Java Traccar (gsi-traccar fork) with custom API extensions  
**Deployment**: Docker + Easypanel on Ubuntu 24.04 (119.235.255.112)

---

## TABLE OF CONTENTS

1. [Architecture Summary](#1-architecture-summary)
2. [Overall Progress Score](#2-overall-progress-score)
3. [Feature-by-Feature Status](#3-feature-by-feature-status)
4. [Backend API Status](#4-backend-api-status)
5. [Frontend Component Inventory](#5-frontend-component-inventory)
6. [Data Storage Gaps](#6-data-storage-gaps)
7. [Missing Features — Detailed](#7-missing-features--detailed)
8. [Known Bugs & Issues](#8-known-bugs--issues)
9. [What Has Been Committed](#9-what-has-been-committed)
10. [Pending Commits](#10-pending-commits)
11. [Recommended Next Steps](#11-recommended-next-steps)

---

## 1. ARCHITECTURE SUMMARY

### V1 (traccar-old) — GPS-server.net v3.23
```
Browser → PHP Files → MySQL Database
         ├── login.php (authentication)
         ├── tracking.php (main SPA page)
         ├── cpanel.php (admin panel)
         ├── func/*.php (37 controller files)
         ├── api/*.php (6 API files)
         ├── server/*.php (GPS data insertion)
         └── inc/*.php (HTML dialog templates)
Frontend: jQuery 2.1.4, jqGrid, Leaflet.js, Flot Charts, jQuery UI
Database: MySQL with gs_* prefix tables (50+ tables)
Session: PHP sessions + MD5 password + cookie remember-me
```

### V2 (traccar-web) — Traccar-based rewrite
```
Browser (React SPA) → Java Traccar Backend → H2/MySQL Database
├── traccar-web (frontend)
│   ├── src/main/ (main page + 23 dialog components)
│   ├── src/settings/ (settings UI + 30+ sub-components)
│   ├── src/map/ (14 map modules + 7 sub-directories)
│   ├── src/reports/ (11 report pages)
│   ├── src/login/ (7 login components)
│   └── src/other/ (8 utility pages)
└── gsi-traccar (backend)
    ├── 19 standard Traccar API resources
    ├── 13 custom GSI API resources
    └── 3 legacy compatibility APIs
Frontend: React 18, MUI 5, MapLibre GL, Recharts, Vite, tss-react
Backend: Java 17, Traccar 6.x fork, Jersey REST, Hibernate
WebSocket: Real-time device/position/event updates
```

---

## 2. OVERALL PROGRESS SCORE

| Category | V1 Features | V2 Done | V2 Partial | V2 Missing | Score |
|----------|-------------|---------|------------|------------|-------|
| **Authentication & Login** | 5 | 5 | 0 | 0 | **100%** |
| **Main Page & Navigation** | 8 | 8 | 0 | 0 | **100%** |
| **Real-time Tracking** | 6 | 6 | 0 | 0 | **100%** |
| **Toolbar Dialogs (16)** | 16 | 16 | 0 | 0 | **100%** |
| **Sidebar Tabs** | 4 | 4 | 0 | 0 | **100%** |
| **History & Playback** | 8 | 8 | 0 | 0 | **100%** |
| **Places (Markers/Routes/Zones)** | 12 | 12 | 0 | 0 | **100%** |
| **Events System** | 6 | 6 | 0 | 0 | **100%** |
| **Settings Dialog** | 9 | 7 | 2 | 0 | **89%** |
| **Object Settings** | 10 | 10 | 0 | 0 | **100%** |
| **Reports** | 8 | 6 | 2 | 0 | **88%** |
| **Map Features** | 10 | 10 | 0 | 0 | **100%** |
| **Data Persistence** | 7 | 3 | 1 | 3 | **50%** |
| **Admin / CPanel** | 8 | 4 | 2 | 2 | **63%** |
| **Server Infrastructure** | 6 | 5 | 1 | 0 | **92%** |
| | | | | **OVERALL** | **~91%** |

---

## 3. FEATURE-BY-FEATURE STATUS

### ✅ FULLY IMPLEMENTED (V1 Parity Achieved)

| # | Feature | V2 Component | Lines | Notes |
|---|---------|-------------|-------|-------|
| 1 | **Login / Authentication** | `LoginPage.jsx` | 390 | Email/password, TOTP, OpenID, remember-me, password reset |
| 2 | **Registration** | `RegisterPage.jsx` | 183 | User registration with server toggle |
| 3 | **Password Reset** | `ResetPasswordPage.jsx` | 120 | Email-based reset flow |
| 4 | **Main Page Layout** | `MainPage.jsx` | 847 | Navbar + sidebar + map + dialogs, 15+ toolbar icons |
| 5 | **Device List (Objects)** | `DeviceList.jsx` + `DeviceRow.jsx` | 905 | Grouped, virtualized, context menu, status colors |
| 6 | **Device Data List** | `DeviceDataList.jsx` | 210 | 18 configurable data items |
| 7 | **Device Info Panel** | `DeviceInfoPanel.jsx` | 1,723 | Data list + Graph + Messages tabs, playback |
| 8 | **Dashboard** | `DashboardDialog.jsx` | 721 | 6 cards: Objects/Events/Maintenance/Tasks/Odometer/Mileage |
| 9 | **Show Point** | `ShowPointDialog.jsx` | 155 | Coordinate input → map marker |
| 10 | **Address Search** | `AddressSearchDialog.jsx` | 155 | Nominatim geocoding, result list |
| 11 | **Reports** | `ReportsDialog.jsx` | 915 | 2 tabs, template CRUD, report properties, generated viewer |
| 12 | **Tasks** | `TasksDialog.jsx` | 240 | Full CRUD (localStorage) |
| 13 | **RI Logbook** | `LogbookDialog.jsx` | 230 | Filter, driver/passenger/trailer categories |
| 14 | **DTC (Diagnostic)** | `DTCDialog.jsx` | 230 | Code lookup, OBD-II dictionary |
| 15 | **Maintenance** | `MaintenanceDialog.jsx` | 230 | Real API CRUD, distance/hours/date types |
| 16 | **Expenses** | `ExpensesDialog.jsx` | 260 | Full CRUD (localStorage), total calculation |
| 17 | **Object Control** | `ObjectControlDialog.jsx` + 6 tabs | 1,809 | GPRS/SMS/Templates/Schedule — all functional |
| 18 | **Image Gallery** | `GalleryDialog.jsx` | 175 | Grid view, fullscreen preview |
| 19 | **Chat** | `ChatDialog.jsx` | 225 | Bubble UI, send via Traccar commands |
| 20 | **Follow** | `FollowDialog.jsx` | 310 | Dedicated map, real-time tracking, info panel |
| 21 | **System Info (About)** | `InfoDialog.jsx` | 90 | Server version, map config |
| 22 | **History & Route** | `HistoryTab.jsx` | 835 | Route/stops/events, snap-to-roads (OSRM), XLSX export |
| 23 | **Events List** | `EventsList.jsx` | 559 | Paginated, CSV export, map integration |
| 24 | **Events Drawer** | `EventsDrawer.jsx` | 70 | Right-side notification panel |
| 25 | **Places — Markers** | `MarkersTab.jsx` + `MarkerDialog.jsx` | 1,039 | Groups, visibility, icon selector, map click |
| 26 | **Places — Routes** | `RoutesTab.jsx` + `RouteDialog.jsx` | 1,049 | Color picker, draw on map, deviation |
| 27 | **Places — Zones** | `ZonesTab.jsx` + `ZoneDialog.jsx` | 1,035 | Polygon draw, area calculation |
| 28 | **Place Groups** | `PlaceGroupDialog.jsx` + `PlaceGroupsDialog.jsx` | 567 | Group management for all place types |
| 29 | **Settings — Objects** | `ObjectsTab.jsx` + `EditDeviceDialog.jsx` | 724 | 8 sub-tabs matching V1 |
| 30 | **Settings — Sensors** | `SensorsTab.jsx` + `EditSensorDialog.jsx` | 1,002 | 17 sensor types, calibration, formula |
| 31 | **Settings — Services** | `ServiceTab.jsx` + `ServiceDialog.jsx` | 899 | Odometer/hours/days intervals |
| 32 | **Settings — Groups** | `GroupsTab.jsx` + `EditGroupDialog.jsx` | 526 | Device-to-group assignment |
| 33 | **Settings — Drivers** | `DriversTab.jsx` + `EditDriverDialog.jsx` | 775 | Photo upload, identity, contact info |
| 34 | **Settings — Events** | `EventsTab.jsx` + `EventEditDialog.jsx` | 1,383 | 37+ event types, multi-tab editor |
| 35 | **Settings — Templates** | `TemplatesTab.jsx` + `TemplateDialog.jsx` | 455 | Variable list, CRUD |
| 36 | **Settings — WhatsApp/SMS** | `SMSTab.jsx` | 316 | Gateway config, HTTP/App modes |
| 37 | **Settings — User Interface** | `UserInterfaceTab.jsx` | 963 | Complete UI preferences matching V1 |
| 38 | **Settings — My Account** | `MyAccountTab.jsx` | 562 | Contact info, password, usage, API tokens |
| 39 | **Settings — Sub Accounts** | `SubAccountsTab.jsx` + `EditSubAccountDialog.jsx` | 997 | Permissions, access control, auto-login URL |
| 40 | **Map — Multi-provider** | `useMapStyles.js` | 275 | OSM, Google, Bing, Mapbox, ArcGIS tiles |
| 41 | **Map — Device Markers** | `MapPositions.js` | 359 | Clustering, rotation, click handlers |
| 42 | **Map — Geofences** | `MapGeofence.js` | 138 | Circles, polygons, linestrings |
| 43 | **Map — Route Lines** | `MapRoutePath.js` + arrows/markers | 446 | Route rendering with start/end markers |
| 44 | **Map — Playback** | `MapPlaybackMarker.js` | 245 | Animated position replay |
| 45 | **WebSocket** | `SocketController.jsx` | 160 | Real-time devices/positions/events |
| 46 | **Context Menu** | In `DeviceRow.jsx` | — | History shortcuts, follow, street view, send command, edit |
| 47 | **KML Import/Export** | In History/Places export | — | KML/GPX/CSV export support |
| 48 | **Share Position** | Settings page + device share | — | Via Traccar share mechanism |

### ⚠️ PARTIALLY IMPLEMENTED

| # | Feature | Status | What's Missing |
|---|---------|--------|----------------|
| 49 | **Passengers Tab** | **UI stub only** | Tab exists but uses hardcoded `useState([])`. No API integration. No edit dialog. Tab label is also missing in SettingsDialog so it's unreachable. |
| 50 | **Trailers Tab** | **UI stub only** | Same as Passengers — pure shell with no functionality. Unreachable via UI. |
| 51 | **Report Generation (PDF/XLS)** | **Partial** | ReportsDialog has format selector (HTML/PDF/XLS) but actual generation uses Traccar's built-in `/api/reports/*/xlsx` which only outputs XLSX. True PDF generation not implemented. |
| 52 | **Report Scheduling** | **Partial** | ScheduledPage exists in `/reports/scheduled` route. ReportsDialog has daily/weekly schedule fields. But the email delivery mechanism is not confirmed working. |
| 53 | **Nearest Zone/Marker** | **Partial** | Implemented in `DeviceInfoPanel.jsx` but `DeviceDataList.jsx` has TODO comments — returns `'-'` for these fields. |
| 54 | **Billing** | **Partial** | V1 has full billing with PayPal integration. V2 has no billing system at all. This may be intentional (different business model). |

### ❌ NOT IMPLEMENTED

| # | Feature | V1 Reference | Priority | Notes |
|---|---------|-------------|----------|-------|
| 55 | **Tasks Backend API** | `fn_tasks.php`, `gs_object_tasks` | **HIGH** | V2 stores tasks in localStorage only — data is per-browser, not synced across devices or users. Backend has no `/api/tasks` endpoint. |
| 56 | **Chat Backend API** | `fn_chat.php`, `gs_object_chat` | **HIGH** | V2 stores chat in localStorage only — no server persistence, no device-to-server messaging. Backend has no `/api/chat` endpoint. Sends commands but doesn't receive device replies. |
| 57 | **Expenses Backend Integration** | `fn_expenses.php`, `gs_user_expenses` | **HIGH** | Backend `/api/expenses` API **exists** but frontend ignores it, using localStorage instead. Simply needs wiring up. |
| 58 | **Report Templates Backend** | `fn_reports.php`, `gs_user_reports` | **MEDIUM** | Templates stored in localStorage (`gps_report_templates`). Should sync to server for multi-device access. |
| 59 | **CPanel — Dedicated Admin Panel** | `cpanel.php`, `fn_cpanel.*.php` | **LOW** | V1 has a separate admin SPA. V2 distributes admin features across Settings pages. Functional but not consolidated. |
| 60 | **CPanel — Bulk Email** | `fn_cpanel.php → send_email` | **LOW** | V1 admin can bulk-email all users / selected users. V2 has AnnouncementPage but not the same email functionality. |
| 61 | **CPanel — Database Management** | `fn_cpanel.server.php` | **LOW** | V1 admin can backup DB, optimize tables, view unused objects. V2 has none of this (handled at infrastructure level). |
| 62 | **CPanel — Server Cleanup** | `fn_cleanup.php` | **LOW** | V1 auto-cleanup of expired users/objects, orphaned records. V2 relies on Traccar built-in maintenance. |
| 63 | **Demo Mode** | `demo.php` | **LOW** | V1 has a demo mode with predefined credentials. V2 has none. |
| 64 | **Tachograph Module** | Config toggle, disabled in V1 too | **NONE** | Was disabled/unfinished in V1 as well. Not needed. |
| 65 | **Object Forwarding** | `forward_loc_data` in gs_objects | **LOW** | V1 can forward device data to another IMEI. Not implemented in V2. |
| 66 | **Virtual ACC** | `accvirt` in gs_objects | **LOW** | V1 can calculate virtual ignition from power voltage. Not in V2. |
| 67 | **RI Logbook Backend** | `fn_rilogbook.php`, `gs_rilogbook_data` | **LOW** | V2 LogbookDialog merges API events with localStorage entries. No dedicated backend table. |
| 68 | **Mobile Web Version** | `mobile/` directory | **NONE** | V1 had separate mobile HTML/JS. V2 is responsive by design — not needed. |

---

## 4. BACKEND API STATUS

### Custom APIs Added to gsi-traccar

| API Resource | Path | Status | Frontend Uses It? |
|-------------|------|--------|-------------------|
| AuditResource | `/api/audit` | ✅ Working | ✅ Yes (AuditPage) |
| ConfigurationResource | `/api/configurations` | ✅ Working | ❌ No |
| EventHistoryResource | `/api/events/history` | ✅ Working | ✅ Yes (EventsList) |
| **ExpenseResource** | `/api/expenses` | ✅ Working | **❌ No — uses localStorage** |
| GeofenceGroupResource | `/api/geofence-groups` | ✅ Working | ✅ Yes (Places tabs) |
| HealthResource | `/api/health` | ✅ Working | ❌ (infra only) |
| ScheduledCommandResource | `/api/command-schedules` | ✅ Working | ✅ Yes (ScheduleTab) |
| ServiceResource | `/api/services` | ✅ Working | ✅ Yes (Dashboard, ServiceTab) |
| SoundResource | `/api/sounds` | ✅ Working | ❌ No |
| SubAccountResource | `/api/subaccounts` | ✅ Working | ✅ Yes (SubAccountsTab) |
| TemplateResource | `/api/templates` | ✅ Working | ⚠️ Partial (read-only for system templates) |
| UserSmsConfigResource | `/api/user-sms-configs` | ✅ Working | ✅ Yes (SMSTab) |
| UserTemplateResource | `/api/user-templates` | ✅ Working | ✅ Yes (TemplatesTab) |
| MarkerResource (legacy) | `/api/markers` | ✅ Working | ✅ Yes (MarkersTab) |
| RouteResource (legacy) | `/api/routes` | ✅ Working | ✅ Yes (RoutesTab) |
| ZoneResource (legacy) | `/api/zones` | ✅ Working | ✅ Yes (ZonesTab) |

### Backend APIs NEEDED But NOT Created

| Feature | Needed API | Priority | Complexity |
|---------|-----------|----------|------------|
| Tasks | `/api/tasks` | HIGH | Medium — need Task model, TaskResource, DB table |
| Chat | `/api/chat` | HIGH | Medium — need Chat model, per-device storage |
| Report Templates | `/api/report-templates` | MEDIUM | Low — model + simple CRUD |
| Share Position | `/api/share-positions` | LOW | Medium — token generation, expiry |
| RI Logbook | `/api/logbook` | LOW | Low — model + CRUD |

---

## 5. FRONTEND COMPONENT INVENTORY

### Total File Count by Area

| Area | Files | Total Lines | Status |
|------|-------|-------------|--------|
| `src/main/` (dialogs + page) | 26 | ~8,900 | ✅ Complete |
| `src/main/places/` | 15 | ~4,300 | ✅ Complete |
| `src/main/ObjectControlTabs/` | 6 | ~1,800 | ✅ Complete |
| `src/settings/` (top-level) | 30 | ~4,500 | ✅ Complete |
| `src/settings/object/` | 11 | ~3,700 | ⚠️ 2 stubs |
| `src/settings/object/tabs/` | 10 | ~3,970 | ✅ Complete |
| `src/settings/events/` | 2 | ~1,380 | ✅ Complete |
| `src/settings/templates/` | 2 | ~455 | ✅ Complete |
| `src/settings/subaccounts/` | 2 | ~997 | ✅ Complete |
| `src/settings/sms/` | 1 | ~316 | ✅ Complete |
| `src/settings/userinterface/` | 1 | ~963 | ✅ Complete |
| `src/settings/myaccount/` | 1 | ~562 | ✅ Complete |
| `src/map/` | 14 + 7 dirs | ~3,500 | ✅ Complete |
| `src/reports/` | 14 | ~3,000 | ✅ Complete |
| `src/login/` | 7 | ~1,060 | ✅ Complete |
| `src/other/` | 8 | ~1,340 | ✅ Complete |
| `src/` (root) | 10 | ~1,500 | ✅ Complete |
| **TOTAL** | **~160+** | **~42,000+** | **~91%** |

### Largest Components (Top 10)

| # | Component | Lines | Purpose |
|---|-----------|-------|---------|
| 1 | DeviceInfoPanel.jsx | 1,723 | Bottom panel: data list + graph + messages |
| 2 | EventEditDialog.jsx | 1,139 | Full event rule editor (6 tabs) |
| 3 | UserInterfaceTab.jsx | 963 | All UI preferences |
| 4 | ReportsDialog.jsx | 915 | Report templates + properties + viewer |
| 5 | MainPage.jsx | 847 | Main page with all state management |
| 6 | HistoryTab.jsx | 835 | History route viewer + controls |
| 7 | EditSubAccountDialog.jsx | 802 | Sub-account permissions editor |
| 8 | DashboardDialog.jsx | 721 | 6-card dashboard with charts |
| 9 | CustomTab.jsx | 686 | Device custom fields + attributes |
| 10 | IconSelectorDialog.jsx | 671 | Device icon picker with categories |

---

## 6. DATA STORAGE GAPS

### Critical: Data stored in localStorage (should be in database)

| Data | localStorage Key | V1 DB Table | Risk | Fix Effort |
|------|-----------------|-------------|------|------------|
| **Tasks** | `gps_tasks` | `gs_object_tasks` | Data lost on browser clear, not synced across devices/users | Backend: create `/api/tasks` API <br> Frontend: switch from localStorage to API |
| **Chat** | `gps_chat` | `gs_object_chat` | No server persistence, no device replies visible to other users | Backend: create `/api/chat` API <br> Frontend: major rewrite for bi-directional |
| **Expenses** | `gps_expenses` | `gs_user_expenses` | Backend API already exists (`/api/expenses`) but frontend ignores it | **Easy fix**: change localStorage calls to fetch/POST calls |
| **Report Templates** | `gps_report_templates` | `gs_user_reports` | Templates not accessible from other devices | Backend: create `/api/report-templates` or use user attributes |

### Non-critical: localStorage usage (acceptable)

| Data | Key | Purpose | Risk |
|------|-----|---------|------|
| Panel heights | `deviceInfoPanelHeight`, `deviceListPanelHeight` | UI layout preference | None — cosmetic |
| Filter state | `filter`, `filterSort`, `filterMap` | Device list filter | None — convenience |
| Map style | `selectedMapStyle` | Map tile type | None — preference |
| Report columns | `summaryColumns`, `tripColumns`, etc. | Column visibility | None — preference |
| Login email | `loginEmail` | Remember email | None — convenience |
| Language | `language` | UI language | None — also in user attributes |
| Device visibility | `deviceInfoPanelHeight` | Panel state | None |

---

## 7. MISSING FEATURES — DETAILED

### 7.1 Passengers Tab (STUB)

**Location**: `src/settings/object/PassengersTab.jsx` (177 lines)

**Problem**: 
- Uses `const [passengers, setPassengers] = useState([])` — hardcoded empty
- No API calls to `/api/drivers` or any passenger endpoint
- Add/Edit/Delete buttons are non-functional (calls empty functions)
- Tab label missing in SettingsDialog — only 3 tabs shown ("Object", "Group", "Driver") but component expects index 3

**V1 Reference**: 
- `fn_settings.passengers.php` — full CRUD with `gs_user_object_passengers` table
- Fields: name, assign_id (iButton/RFID), ID number, address, phone, email, description

**Fix Required**:
- Backend: Add Passenger model extending Traccar's existing structure (or use `drivers` with a `type` field)
- Frontend: Implement API integration, edit dialog, add tab label in SettingsDialog

### 7.2 Trailers Tab (STUB)

**Location**: `src/settings/object/TrailersTab.jsx` (177 lines)

**Problem**: Identical to PassengersTab — pure UI shell, no backend integration, tab unreachable.

**V1 Reference**:
- `fn_settings.trailers.php` — full CRUD with `gs_user_object_trailers` table
- Fields: name, assign_id, model, VIN, plate number, description

**Fix Required**: Same approach as Passengers — model, API, dialog, tab label fix.

### 7.3 Tasks Server Persistence

**Location**: `src/main/TasksDialog.jsx` (240 lines)

**Current**: All CRUD operations use `localStorage('gps_tasks')`.

**Impact**: 
- Tasks created on one browser/device not visible on another
- Clearing browser data loses all tasks
- No multi-user task visibility (V1 tasks visible to device watchers)

**V1 Reference**: `fn_tasks.php` — REST commands with `gs_object_tasks` table. Tasks can be assigned to devices, have start/end addresses with coordinates, delivery status tracking.

### 7.4 Chat Server Persistence

**Location**: `src/main/ChatDialog.jsx` (225 lines)

**Current**: 
- Messages stored in `localStorage('gps_chat')` per device
- Sends commands via Traccar API (`/api/commands/send`) — works for outbound
- No mechanism to receive device replies (V1 had `gs_object_chat` with side='C' for client messages)

**Impact**:
- One-directional only (server→device possible, device→server not visible in UI)
- No multi-user chat history

**V1 Reference**: `fn_chat.php` — bidirectional chat stored in `gs_object_chat` with `side` field ('S'=server, 'C'=client/device), status tracking (0=pending, 1=delivered, 2=seen).

### 7.5 Expenses API Integration

**Location**: `src/main/ExpensesDialog.jsx` (260 lines)

**Current**: Uses `localStorage('gps_expenses')`.

**Backend**: `/api/expenses` API **already exists** in gsi-traccar (`ExpenseResource.java`).

**Fix**: Low effort — replace localStorage read/write with fetch/POST to `/api/expenses`. This is the easiest gap to close.

### 7.6 SettingsDialog — Hidden Tabs

**Location**: `src/main/SettingsDialog.jsx` (319 lines)

**Problem**: The Object → nested tabs only show 3 Tab labels ("Object", "Group", "Driver") but there are 5 NestedTabPanels (index 0-4: Object, Group, Driver, Passenger, Trailer). Passengers (index 3) and Trailers (index 4) are rendered but their Tab labels are missing, making them unreachable.

**Fix**: Add Tab labels for Passenger and Trailer (requires the tab components to be functional first).

---

## 8. KNOWN BUGS & ISSUES

| # | Issue | Severity | Location | Description |
|---|-------|----------|----------|-------------|
| 1 | **Passengers/Trailers tabs hidden** | High | `SettingsDialog.jsx` | Only 3 tab labels for 5 tab panels — Passenger & Trailer tabs unreachable |
| 2 | **Passengers tab non-functional** | High | `PassengersTab.jsx` | Hardcoded empty state, no API integration |
| 3 | **Trailers tab non-functional** | High | `TrailersTab.jsx` | Hardcoded empty state, no API integration |
| 4 | **DeviceDataList nearest_zone TODO** | Medium | `DeviceDataList.jsx` | Returns `'-'` for nearest zone (but works in DeviceInfoPanel) |
| 5 | **DeviceDataList nearest_marker TODO** | Medium | `DeviceDataList.jsx` | Returns `'-'` for nearest marker (but works in DeviceInfoPanel) |
| 6 | **Global window save functions** | Low | `SettingsDialog.jsx` | Uses `window.smsTabSave` / `window.userInterfaceTabSave` pattern — fragile |
| 7 | **Deprecated file in tree** | Trivial | `MapRouteDrawer.old.jsx` | Old version kept, should be removed |
| 8 | **Mixed language** | Low | Multiple files | Indonesian ("Tidak digrup", "Sub akun") mixed with English |
| 9 | **Sensors dropdown placeholder** | Low | `ReportsDialog.jsx` | Shows "No sensors available" in report properties |
| 10 | **Report PDF generation** | Medium | `ReportsDialog.jsx` | Format selector includes PDF but actual output is XLSX only |

---

## 9. WHAT HAS BEEN COMMITTED

### Git Commit History (key commits)

| Commit | Description | Files Changed |
|--------|------------|---------------|
| `7c5043d4` | Dashboard V1 parity — 6 cards with donut/bar charts | DashboardDialog.jsx |
| `dd2a34f2` | ShowPoint + AddressSearch V1 parity rewrite | ShowPointDialog.jsx, AddressSearchDialog.jsx |
| `9de16414` | Dialog spacing fix — increased padding | Multiple dialog files |
| *(earlier)* | Events system — WebSocket + event rules + notifications | EventsList.jsx, EventEditDialog.jsx, + backend |
| *(earlier)* | Places — Markers/Routes/Zones with groups | 15 files in places/ |
| *(earlier)* | Object Control — GPRS/SMS/Templates/Schedule | 6 files in ObjectControlTabs/ |
| *(earlier)* | Settings — all tabs (object, events, templates, WhatsApp, UI, account, subaccounts) | 20+ settings files |
| *(earlier)* | History + Playback — route/stops/events with OSRM snap | HistoryTab.jsx, DeviceInfoPanel.jsx |
| *(earlier)* | Docker deployment — Dockerfile, nginx, Easypanel | Docker files, CI/CD |

---

## 10. PENDING COMMITS

| File | Status | Description |
|------|--------|-------------|
| `ReportsDialog.jsx` | ✅ Done, **NOT committed** | Complete rewrite: 2 tabs, template CRUD, report properties (V1 parity), generated viewer |
| Report Properties fix | ✅ Done, **NOT committed** | Layout restructured to match V1: side-by-side schedule/time, added sensors/data items/zones fields, Generate button |

---

## 11. RECOMMENDED NEXT STEPS

### Priority 1 — HIGH (Quick Wins)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | **Wire Expenses to API** — Replace localStorage with `/api/expenses` calls | 2 hours | Fixes data persistence, API already exists |
| 2 | **Fix Passengers/Trailers tabs** — Add tab labels in SettingsDialog, implement API integration | 4-6 hours | Completes Settings parity |
| 3 | **Fix DeviceDataList nearest_zone/marker** — Copy logic from DeviceInfoPanel | 1 hour | Removes TODOs, completes data list |
| 4 | **Commit Reports changes** — Push ReportsDialog + Report Properties fixes | 15 min | Preserves completed work |

### Priority 2 — HIGH (Requires Backend Work)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 5 | **Create Tasks API** — Backend model + resource + frontend integration | 1-2 days | Enables multi-device task management |
| 6 | **Create Chat API** — Backend model + resource + bidirectional support | 2-3 days | Enables true device↔server chat |
| 7 | **Report Templates to server** — Backend endpoint or user attributes sync | 1 day | Persists templates across devices |

### Priority 3 — MEDIUM

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 8 | **Report PDF export** — Add server-side PDF generation or use browser print | 1-2 days | Complete report output format support |
| 9 | **Report email scheduling** — Verify cron/scheduled email delivery works | 1 day | Automated report delivery |
| 10 | **Clean up deprecated files** — Remove MapRouteDrawer.old.jsx | 5 min | Code hygiene |
| 11 | **Language consistency** — Standardize Indonesian/English strings | 2-3 hours | UI polish |

### Priority 4 — LOW (Nice to Have)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 12 | **Admin Dashboard** — Consolidated admin panel (V1 CPanel equivalent) | 3-5 days | Admin UX improvement |
| 13 | **Billing System** — PayPal/payment gateway integration | 5-10 days | Monetization feature |
| 14 | **Share Position** — Dedicated share link management with expiry | 2-3 days | V1 feature parity |
| 15 | **Object Forwarding** — Forward location data to another IMEI | 1 day | V1 feature parity |
| 16 | **Virtual ACC** — Calculate ignition from voltage sensor | 1 day | V1 feature parity |
| 17 | **RI Logbook API** — Server-side logbook storage | 1 day | V1 feature parity |

---

## APPENDIX A: FILE COUNTS

```
traccar-web/src/
├── main/              26 files    ~8,900 lines
│   ├── places/        15 files    ~4,300 lines
│   └── ObjectControlTabs/  6 files  ~1,800 lines
├── settings/          30 files    ~4,500 lines
│   ├── object/        11 files    ~3,700 lines
│   │   └── tabs/      10 files    ~3,970 lines
│   ├── events/         2 files    ~1,380 lines
│   ├── templates/      2 files      ~455 lines
│   ├── subaccounts/    2 files      ~997 lines
│   ├── sms/            1 file       ~316 lines
│   ├── userinterface/  1 file       ~963 lines
│   └── myaccount/      1 file       ~562 lines
├── map/               14+7 dirs   ~3,500 lines
├── reports/           14 files    ~3,000 lines
├── login/              7 files    ~1,060 lines
├── other/              8 files    ~1,340 lines
├── common/            various     ~2,000 lines
├── store/             various     ~1,000 lines
├── resources/         various       ~500 lines
└── root files         10 files    ~1,500 lines
                       ─────────   ──────────
                       ~160 files  ~42,000+ lines
```

## APPENDIX B: V1 vs V2 TECHNOLOGY COMPARISON

| Aspect | V1 (PHP) | V2 (React + Traccar) |
|--------|---------|---------------------|
| **Frontend Framework** | jQuery 2.1.4 + jQuery UI + jqGrid | React 18 + MUI 5 + Recharts |
| **Map Library** | Leaflet.js | MapLibre GL (WebGL-based, smoother) |
| **Build System** | None (raw PHP/JS) | Vite (ESBuild + Rollup) |
| **Backend** | PHP (procedural) | Java (Traccar, Spring-like) |
| **Database** | MySQL (50+ gs_* tables) | H2/PostgreSQL (Traccar schema) |
| **Auth** | PHP sessions + MD5 | JWT/Session + bcrypt + TOTP + OpenID |
| **WebSocket** | None (polling) | Full WebSocket (real-time) |
| **GPS Protocol Support** | Custom PHP parsers | Traccar (200+ protocols) |
| **Deployment** | Apache/nginx + PHP-FPM | Docker + nginx reverse proxy |
| **Code Size** | ~25,000 PHP lines | ~42,000 JS/JSX lines (frontend) |
| **Real-time Updates** | AJAX polling (5-30s) | WebSocket (instant) |
| **Mobile** | Separate mobile/ directory | Responsive design (same codebase) |
| **Admin Panel** | Separate CPanel SPA | Integrated Settings pages |
| **API Architecture** | GET-based CSV commands | RESTful JSON (OpenAPI) |
| **Event Processing** | Server-side PHP | Java Traccar event engine |
| **Charting** | Flot (jQuery plugin) | Recharts (React-native) |
| **Table/Grid** | jqGrid (jQuery plugin) | Custom MUI Table components |

---

*This document is auto-generated from codebase analysis. Last updated: March 5, 2026.*
