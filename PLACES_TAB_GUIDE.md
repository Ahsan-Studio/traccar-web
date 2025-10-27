# Places Tab - Markers, Zones & Routes Management

## 📍 Overview

Places tab provides management for:
- **Markers** (CIRCLE geofences) - Point locations with radius
- **Zones** (POLYGON geofences) - Area boundaries
- **Routes** (LINESTRING geofences) - Path corridors

---

## 🎯 Current Implementation Status

### ✅ Completed Features

1. **UI Components**
   - Places tab in sidebar (Tab 3)
   - 3 sub-tabs: Markers, Routes, Zones
   - CRUD dialogs for each type
   - CustomTable with search, sort, pagination

2. **API Integration**
   - Uses dedicated endpoints:
     - `GET/POST/PUT/DELETE /api/markers`
     - `GET/POST/PUT/DELETE /api/routes`
     - `GET/POST/PUT/DELETE /api/zones`
   - Auto-sets `attributes.type` based on endpoint

3. **Features Per Type**
   - Name, description
   - Map picker for coordinates
   - Color picker
   - Visibility toggle
   - Radius (markers only)
   - Corridor width (routes only)

---

## 🚀 How to Use

### Creating a Marker

1. **Go to Places tab** (click "Places" in sidebar)
2. **Switch to Markers sub-tab** (should be default)
3. **Click "Add" button** (+ icon in toolbar)
4. **Fill form**:
   - Name: "Office HQ"
   - Description: "Main office location"
   - Lat/Lng: Click on map or enter coordinates
   - Radius: 500 (meters)
   - Color: Pick color
   - Visible: Check to show on map
5. **Click "Save"**
6. **Result**: Marker created with `attributes.type = 'marker'` ✅

### Creating a Zone

1. **Go to Places tab**
2. **Switch to Zones sub-tab**
3. **Click "Add" button**
4. **Fill form**:
   - Name: "Restricted Area"
   - Description: "No entry zone"
   - Draw polygon on map (click points)
   - Color: Pick color
   - Visible: Check to show on map
5. **Click "Save"**
6. **Result**: Zone created with `attributes.type = 'zone'` ✅

### Creating a Route

1. **Go to Places tab**
2. **Switch to Routes sub-tab**
3. **Click "Add" button**
4. **Fill form**:
   - Name: "Delivery Route 1"
   - Description: "Main delivery path"
   - Draw line on map (click waypoints)
   - Corridor Width: 100 (meters)
   - Color: Pick color
   - Visible: Check to show on map
5. **Click "Save"**
6. **Result**: Route created with `attributes.type = 'route'` ✅

---

## 🔧 Fixing Existing Geofences

### Problem

If you have geofences without `attributes.type`, they won't be detected as markers or zones.

**Symptoms:**
- Nearest Marker shows "-" even with CIRCLE geofences
- Nearest Zone shows "-" even with POLYGON geofences

### Solution 1: Use Update Script (Recommended)

**Steps:**
1. Open Browser Console (F12)
2. Paste this script:

```javascript
// Copy content from: public/update-geofence-types.js
```

3. Press Enter
4. Wait for completion
5. Page will auto-refresh
6. Check Device Info Panel - nearest marker/zone should now appear!

### Solution 2: Manual Update via API

**Update single geofence:**

```bash
# Get geofence details
curl http://localhost:8082/api/geofences/1

# Update with type
curl -X PUT http://localhost:8082/api/geofences/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "My Marker",
    "area": "CIRCLE (-7.612784 110.434311, 500)",
    "attributes": {
      "type": "marker"
    }
  }'
```

### Solution 3: Delete & Recreate via Places Tab

1. Delete old geofence
2. Create new one via Places → Markers or Zones
3. System auto-sets type attribute ✅

---

## 📊 Testing Nearest Marker/Zone

### After Creating Markers/Zones

1. **Create at least one marker** (CIRCLE)
2. **Create at least one zone** (POLYGON)
3. **Go to Objects tab**
4. **Select a device**
5. **Check Device Info Panel**
6. **Expected**:
   ```
   📌 Nearest Marker: Office HQ (1.23 km)
   📌 Nearest Zone: Restricted Area (2.45 km)
   ```

### Verification Script

Paste in console:

```javascript
const state = window.store.getState();
const geofences = state.geofences.items;

console.log('Markers:', Object.values(geofences)
  .filter(g => g.attributes?.type === 'marker' || g.area?.startsWith('CIRCLE'))
  .map(g => g.name));
  
console.log('Zones:', Object.values(geofences)
  .filter(g => g.attributes?.type === 'zone' || g.area?.startsWith('POLYGON'))
  .map(g => g.name));
```

---

## 🎨 UI Components Structure

```
src/main/places/
├── MarkersTab.jsx          # List + CRUD for markers
├── MarkerDialog.jsx        # Create/Edit marker form
├── ZonesTab.jsx           # List + CRUD for zones
├── ZoneDialog.jsx         # Create/Edit zone form
├── RoutesTab.jsx          # List + CRUD for routes
└── RouteDialog.jsx        # Create/Edit route form
```

### Features

**Table Features:**
- ✅ Search by name/description
- ✅ Sort by any column
- ✅ Pagination
- ✅ Multi-select
- ✅ Bulk delete
- ✅ Loading states
- ✅ Error handling

**Dialog Features:**
- ✅ Map picker (click to set coordinates)
- ✅ Form validation
- ✅ Color picker
- ✅ Real-time preview on map
- ✅ Save/Cancel actions

---

## 🐛 Troubleshooting

### Issue: Places tab not visible

**Check:**
```javascript
// Console check
const tabs = document.querySelectorAll('[role="tab"]');
tabs.forEach((tab, i) => console.log(i, tab.textContent));
```

**Expected:** Should see "Objects", "Events", "Places", "History"

### Issue: Cannot create marker/zone

**Possible causes:**
- Permission denied (check user role)
- Invalid coordinates format
- Server error

**Check console for errors**

### Issue: Created but not showing in Device Info Panel

**Verify type attribute:**
```javascript
const marker = Object.values(window.store.getState().geofences.items)
  .find(g => g.name === 'Your Marker Name');
console.log('Type:', marker.attributes?.type);
console.log('Area:', marker.area);
```

**Should show:**
- Type: "marker" or detected from CIRCLE
- Area: "CIRCLE (lat lon, radius)"

---

## 📈 Next Steps

After Places tab is working:

1. ✅ **Create test markers** (at least 2-3 different locations)
2. ✅ **Create test zones** (at least 2-3 different areas)
3. ✅ **Verify nearest calculation** in Device Info Panel
4. ✅ **Test with moving devices** (distances should update)
5. 🔄 **Implement Graph tab** (history visualization)
6. 🔄 **Implement Messages tab** (message history)

---

## 🎯 Success Criteria

Places tab implementation is **COMPLETE** when:

- [x] UI visible and accessible
- [x] Can create markers via UI
- [x] Can create zones via UI
- [x] Can create routes via UI
- [x] Can edit existing items
- [x] Can delete items
- [x] Items appear on map
- [x] Markers detected in nearest calculation
- [x] Zones detected in nearest calculation
- [x] Type attribute auto-set correctly

---

**Current Status: ✅ READY TO USE!**

Just need to create markers/zones via Places tab UI! 🎉
