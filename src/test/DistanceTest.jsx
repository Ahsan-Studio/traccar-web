/**
 * Browser Test Component for Distance Calculations
 * Copy this code to browser console or create a test page
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  calculateDistance,
  distanceToCircle,
  distanceToPolygon,
  formatDistanceValue,
} from '../common/util/distance';

const DistanceTest = () => {
  const geofences = useSelector((state) => state.geofences.items);
  const positions = useSelector((state) => state.session.positions);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  
  const position = positions[selectedDeviceId];

  useEffect(() => {
    if (!position || !geofences) {
      console.log('⏳ Waiting for position and geofences data...');
      return;
    }

    console.log('🧪 Testing Distance Calculations\n');
    console.log('Device Position:', {
      latitude: position.latitude,
      longitude: position.longitude,
    });
    console.log('\n📍 Geofences:');
    
    Object.values(geofences).forEach((geofence) => {
      console.log(`\n${geofence.name}:`);
      console.log(`  Type: ${geofence.attributes?.type || 'unknown'}`);
      console.log(`  Area: ${geofence.area}`);
      
      // Parse area
      if (geofence.area?.startsWith('CIRCLE')) {
        const match = geofence.area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
        if (match) {
          const circle = {
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2]),
            radius: parseFloat(match[3]),
          };
          const dist = distanceToCircle(position, circle);
          console.log(`  Distance: ${formatDistanceValue(Math.abs(dist), 'km')}`);
          console.log(`  Status: ${dist < 0 ? 'INSIDE' : 'OUTSIDE'}`);
        }
      } else if (geofence.area?.startsWith('POLYGON')) {
        const coordMatch = geofence.area.match(/POLYGON\s*\(\((.*?)\)\)/);
        if (coordMatch) {
          const coords = coordMatch[1].split(',').map((pair) => {
            const [lat, lon] = pair.trim().split(/\s+/);
            return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
          });
          const dist = distanceToPolygon(position, coords);
          console.log(`  Distance: ${formatDistanceValue(dist, 'km')}`);
        }
      }
    });

    // Find nearest marker and zone
    console.log('\n\n🎯 Finding Nearest...');
    
    const markers = Object.values(geofences)
      .filter((g) => g.attributes?.type === 'marker')
      .map((g) => {
        const match = g.area?.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
        if (match) {
          const circle = {
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2]),
            radius: parseFloat(match[3]),
          };
          const dist = Math.abs(distanceToCircle(position, circle));
          return { name: g.name, distance: dist };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    const zones = Object.values(geofences)
      .filter((g) => g.attributes?.type === 'zone')
      .map((g) => {
        const coordMatch = g.area?.match(/POLYGON\s*\(\((.*?)\)\)/);
        if (coordMatch) {
          const coords = coordMatch[1].split(',').map((pair) => {
            const [lat, lon] = pair.trim().split(/\s+/);
            return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
          });
          const dist = distanceToPolygon(position, coords);
          return { name: g.name, distance: dist };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    if (markers.length > 0) {
      console.log(`\n📌 Nearest Marker: ${markers[0].name}`);
      console.log(`   Distance: ${formatDistanceValue(markers[0].distance, 'km')}`);
    } else {
      console.log('\n📌 No markers found');
    }

    if (zones.length > 0) {
      console.log(`\n🏢 Nearest Zone: ${zones[0].name}`);
      console.log(`   Distance: ${formatDistanceValue(zones[0].distance, 'km')}`);
    } else {
      console.log('\n🏢 No zones found');
    }

    console.log('\n✅ Test completed!\n');
  }, [position, geofences, selectedDeviceId]);

  return null;
};

export default DistanceTest;
