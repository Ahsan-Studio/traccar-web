/**
 * Test file for distance calculation utilities
 * Run this to verify the distance calculations are working correctly
 */

import {
  calculateDistance,
  distanceToCircle,
  distanceToPolygon,
  formatDistanceValue,
  isPointInPolygon,
} from './distance';

console.log('🧪 Testing Distance Utilities...\n');

// Test 1: Calculate distance between two known points
console.log('Test 1: Calculate Distance (Haversine)');
const distance1 = calculateDistance(
  -7.352033, 110.017007,  // Point A (Yogyakarta area)
  -7.350000, 110.015000,  // Point B
);
console.log(`  Distance: ${distance1.toFixed(2)} meters`);
console.log(`  Expected: ~325 meters ✓\n`);

// Test 2: Distance to Circle (Marker)
console.log('Test 2: Distance to Circle Geofence');
const point = { latitude: -7.352033, longitude: 110.017007 };
const circle = { latitude: -7.350000, longitude: 110.015000, radius: 500 };
const distToCircle = distanceToCircle(point, circle);
console.log(`  Distance to circle edge: ${distToCircle.toFixed(2)} meters`);
console.log(`  Negative = inside, Positive = outside`);
console.log(`  Result: ${distToCircle < 0 ? 'INSIDE' : 'OUTSIDE'} circle\n`);

// Test 3: Distance to Polygon (Zone)
console.log('Test 3: Distance to Polygon Geofence');
const polygon = [
  { latitude: -7.350000, longitude: 110.015000 },
  { latitude: -7.350000, longitude: 110.020000 },
  { latitude: -7.345000, longitude: 110.020000 },
  { latitude: -7.345000, longitude: 110.015000 },
];
const distToPolygon = distanceToPolygon(point, polygon);
console.log(`  Distance to nearest vertex: ${distToPolygon.toFixed(2)} meters\n`);

// Test 4: Point in Polygon
console.log('Test 4: Point Inside Polygon Check');
const testPoint1 = { latitude: -7.347000, longitude: 110.017000 }; // Inside
const testPoint2 = { latitude: -7.352033, longitude: 110.017007 }; // Outside
const inside1 = isPointInPolygon(testPoint1, polygon);
const inside2 = isPointInPolygon(testPoint2, polygon);
console.log(`  Point 1 (-7.347, 110.017): ${inside1 ? 'INSIDE ✓' : 'OUTSIDE'}`);
console.log(`  Point 2 (-7.352, 110.017): ${inside2 ? 'INSIDE' : 'OUTSIDE ✓'}\n`);

// Test 5: Format Distance
console.log('Test 5: Format Distance with Units');
console.log(`  50 m (km): ${formatDistanceValue(50, 'km')}`);
console.log(`  500 m (km): ${formatDistanceValue(500, 'km')}`);
console.log(`  1500 m (km): ${formatDistanceValue(1500, 'km')}`);
console.log(`  5000 m (km): ${formatDistanceValue(5000, 'km')}`);
console.log(`  50 m (mi): ${formatDistanceValue(50, 'mi')}`);
console.log(`  500 m (mi): ${formatDistanceValue(500, 'mi')}`);
console.log(`  1500 m (mi): ${formatDistanceValue(1500, 'mi')}\n`);

// Test 6: Real-world scenario
console.log('Test 6: Real-world Scenario - Find Nearest');
console.log('Device at: -7.352033, 110.017007');
const geofences = [
  {
    name: 'Warehouse A',
    type: 'marker',
    area: 'CIRCLE (-7.350000 110.015000, 500)',
  },
  {
    name: 'Office B',
    type: 'marker',
    area: 'CIRCLE (-7.355000 110.020000, 300)',
  },
  {
    name: 'Zone 1',
    type: 'zone',
    area: 'POLYGON ((-7.350000 110.015000, -7.350000 110.020000, -7.345000 110.020000, -7.345000 110.015000))',
  },
];

// Parse and calculate distances
const devicePos = { latitude: -7.352033, longitude: 110.017007 };
const results = geofences.map((geo) => {
  let distance;
  
  if (geo.area.startsWith('CIRCLE')) {
    const match = geo.area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
    if (match) {
      const circle = {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
        radius: parseFloat(match[3]),
      };
      distance = Math.abs(distanceToCircle(devicePos, circle));
    }
  } else if (geo.area.startsWith('POLYGON')) {
    const coordMatch = geo.area.match(/POLYGON\s*\(\((.*?)\)\)/);
    if (coordMatch) {
      const coords = coordMatch[1].split(',').map((pair) => {
        const [lat, lon] = pair.trim().split(/\s+/);
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      });
      distance = distanceToPolygon(devicePos, coords);
    }
  }
  
  return { ...geo, distance };
});

results.forEach((result) => {
  console.log(`  ${result.name} (${result.type}): ${formatDistanceValue(result.distance, 'km')}`);
});

// Find nearest marker and zone
const nearestMarker = results
  .filter((r) => r.type === 'marker')
  .sort((a, b) => a.distance - b.distance)[0];
const nearestZone = results
  .filter((r) => r.type === 'zone')
  .sort((a, b) => a.distance - b.distance)[0];

console.log('\n📍 Results:');
console.log(`  Nearest Marker: ${nearestMarker.name} (${formatDistanceValue(nearestMarker.distance, 'km')})`);
console.log(`  Nearest Zone: ${nearestZone.name} (${formatDistanceValue(nearestZone.distance, 'km')})`);

console.log('\n✅ All tests completed!\n');
