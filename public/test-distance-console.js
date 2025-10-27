/**
 * PASTE THIS IN BROWSER CONSOLE TO TEST DISTANCE CALCULATIONS
 * 
 * This script will:
 * 1. Get current device position
 * 2. Get all geofences
 * 3. Calculate distances
 * 4. Show results in console with nice formatting
 */

(function testDistanceCalculations() {
  console.clear();
  console.log('%c🧪 Testing Nearest Zone/Marker Calculation', 'font-size: 16px; font-weight: bold; color: #2196F3');
  console.log('%c═══════════════════════════════════════════', 'color: #2196F3');
  
  // Get Redux store (assuming it's available globally)
  const store = window.store || window.__REDUX_DEVTOOLS_EXTENSION__?.store;
  
  if (!store) {
    console.error('❌ Redux store not found. Make sure app is running.');
    return;
  }
  
  const state = store.getState();
  const { devices, geofences, session } = state;
  
  // Get selected device and position
  const selectedDeviceId = devices.selectedId;
  const device = devices.items[selectedDeviceId];
  const position = session.positions[selectedDeviceId];
  
  console.log('\n%c📱 Device Info:', 'font-weight: bold; color: #4CAF50');
  console.log('  ID:', selectedDeviceId);
  console.log('  Name:', device?.name || 'N/A');
  
  if (!position) {
    console.warn('⚠️  No position data available for this device');
    return;
  }
  
  console.log('  Position:', `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`);
  console.log('  Speed:', `${position.speed.toFixed(2)} kn`);
  console.log('  Timestamp:', new Date(position.fixTime).toLocaleString());
  
  // Get geofences
  const geofenceList = Object.values(geofences.items || {});
  console.log('\n%c📍 Geofences:', 'font-weight: bold; color: #FF9800');
  console.log('  Total:', geofenceList.length);
  
  if (geofenceList.length === 0) {
    console.warn('⚠️  No geofences found');
    return;
  }
  
  // Helper function: Calculate distance (Haversine)
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  // Helper: Format distance
  const formatDist = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };
  
  // Calculate distances for all geofences
  const results = geofenceList.map(geo => {
    const type = geo.attributes?.type || 'unknown';
    let distance = null;
    
    // Parse CIRCLE
    if (geo.area?.startsWith('CIRCLE')) {
      const match = geo.area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        const radius = parseFloat(match[3]);
        const distToCenter = calcDistance(position.latitude, position.longitude, lat, lon);
        distance = Math.abs(distToCenter - radius);
      }
    }
    // Parse POLYGON
    else if (geo.area?.startsWith('POLYGON')) {
      const coordMatch = geo.area.match(/POLYGON\s*\(\((.*?)\)\)/);
      if (coordMatch) {
        const coords = coordMatch[1].split(',').map(pair => {
          const [lat, lon] = pair.trim().split(/\s+/);
          return { lat: parseFloat(lat), lon: parseFloat(lon) };
        });
        
        // Distance to nearest vertex (simplified)
        let minDist = Infinity;
        coords.forEach(coord => {
          const d = calcDistance(position.latitude, position.longitude, coord.lat, coord.lon);
          if (d < minDist) minDist = d;
        });
        distance = minDist;
      }
    }
    
    return {
      name: geo.name,
      type,
      distance,
      area: geo.area,
    };
  }).filter(r => r.distance !== null);
  
  // Group by type
  const markers = results.filter(r => r.type === 'marker').sort((a, b) => a.distance - b.distance);
  const zones = results.filter(r => r.type === 'zone').sort((a, b) => a.distance - b.distance);
  const others = results.filter(r => r.type !== 'marker' && r.type !== 'zone').sort((a, b) => a.distance - b.distance);
  
  // Display results
  console.log('\n%c📊 Distance Calculations:', 'font-weight: bold; color: #9C27B0');
  
  if (markers.length > 0) {
    console.log('\n  %c📌 MARKERS:', 'font-weight: bold; color: #2196F3');
    markers.forEach((m, i) => {
      const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`    ${icon} ${m.name}: ${formatDist(m.distance)}`);
    });
  } else {
    console.log('\n  %c📌 MARKERS: None found', 'color: #999');
  }
  
  if (zones.length > 0) {
    console.log('\n  %c🏢 ZONES:', 'font-weight: bold; color: #4CAF50');
    zones.forEach((z, i) => {
      const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`    ${icon} ${z.name}: ${formatDist(z.distance)}`);
    });
  } else {
    console.log('\n  %c🏢 ZONES: None found', 'color: #999');
  }
  
  if (others.length > 0) {
    console.log('\n  %c🚩 OTHERS:', 'font-weight: bold; color: #FF9800');
    others.forEach((o, i) => {
      console.log(`     ${o.name} (${o.type}): ${formatDist(o.distance)}`);
    });
  }
  
  // Show expected values in UI
  console.log('\n%c🎯 Expected Values in Device Info Panel:', 'font-weight: bold; color: #F44336');
  
  if (markers.length > 0) {
    console.log(`  Nearest Marker: "${markers[0].name} (${formatDist(markers[0].distance)})"`);
  } else {
    console.log('  Nearest Marker: "-"');
  }
  
  if (zones.length > 0) {
    console.log(`  Nearest Zone: "${zones[0].name} (${formatDist(zones[0].distance)})"`);
  } else {
    console.log('  Nearest Zone: "-"');
  }
  
  console.log('\n%c✅ Test completed! Check Device Info Panel to verify.', 'font-weight: bold; color: #4CAF50');
  console.log('%c═══════════════════════════════════════════\n', 'color: #2196F3');
  
  // Return results for further inspection
  return {
    position,
    markers,
    zones,
    all: results,
  };
})();
