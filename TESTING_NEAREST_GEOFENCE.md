# Testing Guide: Nearest Zone & Marker Calculation

## 🎯 Test Objectives

Verify bahwa nearest zone dan nearest marker calculations bekerja dengan benar dan menampilkan hasil yang akurat di Device Info Panel.

---

## 📋 Pre-requisites

1. ✅ Ada geofences di sistem (markers dan zones)
2. ✅ Ada devices dengan positions aktif
3. ✅ User sudah login dan punya akses ke geofences
4. ✅ Device Info Panel settings di User Interface tab sudah include `nearest_marker` dan `nearest_zone`

---

## 🧪 Test Cases

### Test Case 1: Basic Display
**Goal:** Verify fields muncul di Device Info Panel

**Steps:**
1. Buka aplikasi di browser
2. Login dengan user yang punya geofences
3. Select sebuah device dari list
4. Device Info Panel muncul di bawah
5. Check tab "Data"

**Expected Results:**
- ✅ Field "Nearest Marker" tampil dengan icon 📌
- ✅ Field "Nearest Zone" tampil dengan icon 📌
- ✅ Jika ada data: Format `"Name (123.45 km)"`
- ✅ Jika tidak ada: Tampil `"-"`

---

### Test Case 2: Calculation Accuracy
**Goal:** Verify jarak yang dihitung akurat

**Steps:**
1. Buka Browser DevTools Console (F12)
2. Paste code untuk manual calculation:
```javascript
// Get current position
const pos = Object.values(window.store.getState().session.positions)[0];
console.log('Device Position:', pos.latitude, pos.longitude);

// Get geofences
const geofences = window.store.getState().geofences.items;
console.log('Geofences:', Object.keys(geofences).length);

// Manual distance check (Haversine)
function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check against first geofence
const firstGeo = Object.values(geofences)[0];
console.log('First Geofence:', firstGeo.name);
console.log('Area:', firstGeo.area);
```

3. Compare manual calculation dengan yang ditampilkan di UI

**Expected Results:**
- ✅ Jarak yang ditampilkan match dengan calculation manual (±10 meters tolerance)
- ✅ Unit formatting benar (m untuk < 1km, km untuk >= 1km)

---

### Test Case 3: Multiple Geofences
**Goal:** Verify nearest logic bekerja dengan benar

**Scenario:**
- Device di koordinat A
- Marker 1: 500m dari device
- Marker 2: 1.2km dari device  
- Zone 1: 300m dari device
- Zone 2: 2km dari device

**Expected Results:**
- ✅ Nearest Marker: Marker 1 (500 m atau 0.50 km)
- ✅ Nearest Zone: Zone 1 (300 m atau 0.30 km)
- ✅ BUKAN Marker 2 atau Zone 2

---

### Test Case 4: Inside Geofence
**Goal:** Verify calculation saat device di dalam geofence

**Scenario:**
- Device position berada INSIDE sebuah circular marker (radius 500m)

**Expected Results:**
- ✅ Distance calculation: negative value (inside)
- ✅ Display: "0 m" atau distance yang sangat kecil
- ⚠️ Note: Current implementation uses `Math.abs()` jadi akan show positive distance

---

### Test Case 5: No Geofences
**Goal:** Verify graceful handling saat tidak ada geofences

**Steps:**
1. Login dengan user tanpa geofence access
2. Select device
3. Check Device Info Panel

**Expected Results:**
- ✅ Nearest Marker: "-"
- ✅ Nearest Zone: "-"
- ✅ No errors di console
- ✅ No crashes

---

### Test Case 6: Real-time Updates
**Goal:** Verify distance updates saat device bergerak

**Steps:**
1. Select device yang sedang moving
2. Monitor Device Info Panel
3. Wait for position updates (biasanya 5-30 detik)

**Expected Results:**
- ✅ Distance value updates automatically
- ✅ Nearest geofence bisa berubah jika device lewat
- ✅ No flicker atau jumpy updates

---

### Test Case 7: Different Unit Preferences
**Goal:** Verify unit conversion bekerja

**Steps:**
1. Go to Settings → Preferences
2. Change Distance Unit:
   - km (kilometers)
   - mi (miles)
   - nmi (nautical miles)
3. Check Device Info Panel

**Expected Results:**
- ✅ km: `"Marker A (1.23 km)"` or `"Marker B (456 m)"`
- ✅ mi: `"Marker A (0.76 mi)"` or `"Marker B (1496 ft)"`
- ✅ nmi: `"Marker A (0.66 nmi)"` or `"Marker B (456 m)"`

---

### Test Case 8: Edge Cases

**Scenario A: Exactly at geofence center**
- Device at exact coordinates of circular marker center
- Expected: "0 m" or "Marker Name (0 m)"

**Scenario B: Very far from all geofences**
- Device 100+ km from nearest geofence
- Expected: "Marker Name (123.45 km)"

**Scenario C: Geofence without type attribute**
- Geofence exists but `attributes.type` not set
- Expected: Not counted (filtered out)

**Scenario D: Malformed area string**
- Geofence with invalid `area` format
- Expected: Skipped gracefully, no crash

---

## 🐛 Common Issues & Fixes

### Issue 1: Shows "-" even with geofences
**Possible Causes:**
- Geofences tidak punya `attributes.type` = 'marker' atau 'zone'
- Redux store belum loaded
- User tidak punya permission ke geofences

**Check:**
```javascript
// Console check
const geofences = window.store.getState().geofences.items;
Object.values(geofences).forEach(g => {
  console.log(g.name, '→ type:', g.attributes?.type);
});
```

---

### Issue 2: Distance tidak akurat
**Possible Causes:**
- Area format salah (koordinat terbalik)
- Radius unit mismatch (should be meters)

**Check:**
```javascript
// Console check
const geo = Object.values(geofences)[0];
console.log('Area:', geo.area);
// Should be: "CIRCLE (lat lon, radius_in_meters)"
// NOT: "CIRCLE (lon lat, radius_in_meters)"
```

---

### Issue 3: Performance issues
**Symptoms:**
- UI lag saat many geofences
- Slow rendering

**Optimization Ideas:**
- Add memoization untuk calculation results
- Cache nearest geofence dengan timeout
- Limit calculation hanya untuk visible devices

---

## ✅ Acceptance Criteria

Test dianggap **PASS** jika:

1. ✅ Field muncul di Device Info Panel
2. ✅ Distance calculations akurat (±10m tolerance)
3. ✅ Nearest logic benar (shows actual nearest)
4. ✅ Unit formatting correct (m/km/mi/ft/nmi)
5. ✅ Real-time updates working
6. ✅ No console errors
7. ✅ Graceful handling untuk edge cases
8. ✅ Performance acceptable (< 100ms calculation)

---

## 📸 Screenshot Checklist

Ambil screenshots untuk dokumentasi:

- [ ] Device Info Panel dengan nearest marker & zone showing
- [ ] Console output showing calculations
- [ ] Different unit preferences (km/mi/nmi)
- [ ] Device inside vs outside geofence
- [ ] Multiple devices dengan different nearest geofences

---

## 🚀 Next Steps After Testing

Jika semua tests PASS:
1. ✅ Mark feature sebagai complete
2. 📝 Update IMPLEMENTATION_PROGRESS.md
3. 🎯 Move to next feature (Graph Tab atau Messages Tab)

Jika ada issues:
1. 🐛 Document bugs found
2. 🔧 Fix issues
3. 🔄 Re-test
4. ✅ Verify fixes

---

## 💡 Quick Test Commands

```javascript
// Browser Console Quick Tests

// 1. Check geofences loaded
window.store.getState().geofences.items

// 2. Check current position
window.store.getState().session.positions

// 3. Check selected device
window.store.getState().devices.selectedId

// 4. Force re-render DeviceInfoPanel
// (change device selection or refresh page)
```

---

**Happy Testing! 🧪**
