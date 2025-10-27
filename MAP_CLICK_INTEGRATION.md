# Map Click Integration - Pick Location from Map

## Overview
Implementasi fitur click map untuk pick location marker secara langsung. User bisa klik map untuk auto-fill latitude & longitude di dialog.

## Features Implemented

### 1. MapClickHandler Component ✅
**File:** `/src/main/places/MapClickHandler.jsx`

**Purpose:** Listen to map click events dan pass coordinates ke parent component

**Features:**
- ✅ Enable/disable map click detection
- ✅ Cursor changes to crosshair when enabled
- ✅ Returns lat/lng coordinates on click
- ✅ Auto cleanup on unmount
- ✅ No visual rendering (invisible component)

**Props:**
```javascript
<MapClickHandler
  enabled={true}              // Enable/disable click listener
  onMapClick={(location) => {  // Callback with {latitude, longitude}
    console.log(location);
  }}
/>
```

**Implementation:**
```javascript
import { map } from '../../map/core/MapView'; // maplibregl map instance

useEffect(() => {
  if (!enabled) return;
  
  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    onMapClick({ latitude: lat, longitude: lng });
  };
  
  map.on('click', handleMapClick);
  map.getCanvas().style.cursor = 'crosshair'; // Visual indicator
  
  return () => {
    map.off('click', handleMapClick);
    map.getCanvas().style.cursor = ''; // Reset cursor
  };
}, [enabled, onMapClick]);
```

### 2. MarkersTab Integration ✅
**File:** `/src/main/places/MarkersTab.jsx`

**New State:**
```javascript
const [mapClickEnabled, setMapClickEnabled] = useState(false);
const [pickedLocation, setPickedLocation] = useState(null);
```

**Flow:**
1. User clicks "Add" or "Edit" → `setMapClickEnabled(true)`
2. User clicks map → `handleMapClick()` → `setPickedLocation()`
3. Location passed to `MarkerDialog` via prop
4. Dialog closes → `setMapClickEnabled(false)`, `setPickedLocation(null)`

**Implementation:**
```javascript
const handleMapClick = (location) => {
  setPickedLocation(location);
};

const onAdd = () => {
  setEditing(null);
  setPickedLocation(null);
  setMapClickEnabled(true); // ← Enable
  setDialogOpen(true);
};

const handleDialogClose = (saved) => {
  setDialogOpen(false);
  setMapClickEnabled(false); // ← Disable
  setPickedLocation(null);
  if (saved) setRefreshVersion((v) => v + 1);
};
```

**Render:**
```javascript
<MapClickHandler
  enabled={mapClickEnabled}
  onMapClick={handleMapClick}
/>
<MarkerDialog
  open={dialogOpen}
  pickedLocation={pickedLocation} // ← Pass location
  ...
/>
```

### 3. MarkerDialog Updates ✅
**File:** `/src/main/places/MarkerDialog.jsx`

**New Prop:**
```javascript
const MarkerDialog = ({ 
  open, 
  onClose, 
  marker, 
  mapCenter, 
  pickedLocation  // ← NEW
}) => {
```

**Auto-update Lat/Long:**
```javascript
useEffect(() => {
  if (pickedLocation) {
    setFormData(prev => ({
      ...prev,
      latitude: String(pickedLocation.latitude.toFixed(6)),
      longitude: String(pickedLocation.longitude.toFixed(6)),
    }));
  }
}, [pickedLocation]);
```

**Visual Hint:**
```javascript
<Box sx={{ 
  mb: 2, 
  p: 1, 
  backgroundColor: '#e3f2fd', 
  borderRadius: 1,
  border: '1px solid #90caf9',
}}>
  <Typography variant="body2" sx={{ fontSize: '11px', color: '#1976d2' }}>
    💡 Click on map to pick location
  </Typography>
</Box>
```

## User Flow

### Creating New Marker:
1. **Open Dialog**
   - Click "Add" button
   - Dialog opens di kiri atas
   - Map click enabled
   - Cursor changes to crosshair ✚

2. **Pick Location**
   - Click anywhere on map
   - Lat/Long auto-filled in dialog
   - Precision: 6 decimal places

3. **Complete Form**
   - Fill name (required)
   - Select icon
   - Select group
   - Add description (optional)

4. **Save**
   - Click Save button
   - Marker created with selected location
   - Map click disabled

### Editing Existing Marker:
1. **Open Edit Dialog**
   - Click edit icon on row
   - Dialog opens with existing data
   - Map click enabled

2. **Update Location**
   - Click new location on map
   - Lat/Long updated
   - Or manually edit coordinates

3. **Save Changes**
   - Click Save
   - Marker updated

## Technical Details

### Coordinate Precision
- **Format:** Decimal degrees
- **Precision:** 6 decimal places (~0.11m accuracy)
- **Example:** 
  - Latitude: -6.208800
  - Longitude: 106.845600

### Cursor Behavior
- **Enabled:** Crosshair cursor (✚)
- **Disabled:** Default cursor (arrow)
- **Auto reset:** When dialog closes

### Event Handling
- **Library:** maplibre-gl
- **Event:** `map.on('click', handler)`
- **Data:** `e.lngLat` → { lng, lat }
- **Cleanup:** `map.off('click', handler)`

### State Management
- **Parent:** MarkersTab (controls enable/disable)
- **Handler:** MapClickHandler (listens to map)
- **Consumer:** MarkerDialog (receives coordinates)
- **Unidirectional flow:** Map → Handler → Tab → Dialog

## Benefits

### 1. Better UX ✅
- **Visual picking** lebih intuitif dari manual input
- **Accurate location** langsung dari map
- **No typos** in coordinates
- **Fast workflow** - click & save

### 2. Matches Web Lama ✅
- PHP version memiliki fitur serupa
- User familiar dengan workflow
- Consistent experience

### 3. Clean Code ✅
- Separation of concerns
- Reusable MapClickHandler
- Proper event cleanup
- No memory leaks

### 4. Flexible ✅
- Can still manual input lat/long
- Can update location multiple times
- Works for create & edit

## Testing

### ✅ Basic Flow
1. Refresh browser
2. Open Places → Markers → Add
3. **Check cursor** → harus crosshair (✚)
4. **Click map** → lat/long auto-filled
5. **Check precision** → 6 decimal places
6. Fill name, select icon
7. **Save** → marker created
8. **Check cursor** → back to arrow

### ✅ Multiple Clicks
1. Open dialog
2. Click map location A → lat/long filled
3. Click map location B → lat/long updated
4. Click map location C → lat/long updated again
5. Save → uses last clicked location

### ✅ Manual Input
1. Open dialog
2. Click map → auto-filled
3. **Manual edit** lat/long fields
4. Save → uses manual values

### ✅ Edit Mode
1. Click edit on existing marker
2. Dialog shows existing lat/long
3. Click map → updates to new location
4. Cancel → no changes saved

### ✅ Cursor Reset
1. Open dialog → cursor crosshair
2. Close dialog → cursor arrow
3. Open again → cursor crosshair
4. Save → cursor arrow

## Visual Indicators

### 1. Cursor Change
```
Normal Mode:  →  (arrow)
Dialog Open:  ✚  (crosshair)
```

### 2. Hint Box
```
┌────────────────────────────────┐
│ 💡 Click on map to pick location │
└────────────────────────────────┘
```
- Background: Light blue (#e3f2fd)
- Border: Blue (#90caf9)
- Text: Blue (#1976d2)
- Position: Top of dialog content

### 3. Coordinate Format
```
Latitude:  -6.208800  (6 decimals)
Longitude: 106.845600 (6 decimals)
```

## Future Enhancements (Optional)

### 1. Visual Marker Preview
- Show temporary marker on map while dialog open
- Update marker position on each click
- Remove on cancel, persist on save

### 2. Drag to Reposition
- Add draggable marker
- Update lat/long on drag end
- More intuitive than click

### 3. Reverse Geocoding
- Show address for picked location
- Help user confirm location
- Optional auto-fill name from address

### 4. Nearby Places
- Show nearby POIs when location picked
- Suggest marker name from nearby place
- "You picked near Monas, Jakarta"

### 5. Location Validation
- Check if location is valid (not ocean, etc)
- Warn if too far from devices
- Suggest zoom level

## Files Modified

1. **MapClickHandler.jsx** (NEW - 35 lines)
   - Component untuk handle map click
   - Cursor management
   - Event listener setup/cleanup

2. **MarkersTab.jsx** (MODIFIED)
   - Added mapClickEnabled state
   - Added pickedLocation state
   - Added handleMapClick handler
   - Enable/disable on dialog open/close
   - Pass pickedLocation to dialog

3. **MarkerDialog.jsx** (MODIFIED)
   - Accept pickedLocation prop
   - useEffect to update lat/long
   - Added visual hint box
   - Fixed handleInputChange typo

## Performance

- ✅ No re-renders when dialog closed (enabled=false)
- ✅ Event listener added only when needed
- ✅ Proper cleanup prevents memory leaks
- ✅ Cursor reset on unmount
- ✅ Minimal state updates

## Compatibility

- ✅ Works with maplibre-gl
- ✅ Compatible with existing map features
- ✅ Doesn't interfere with zoom/pan
- ✅ Doesn't block other map interactions

---

**Date:** October 18, 2025  
**Feature:** Map click to pick location  
**Status:** ✅ COMPLETED  
**Progress:** Markers feature ~90% (was 88%, +2%)
