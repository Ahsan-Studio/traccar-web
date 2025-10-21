/**
 * Script to update existing geofences and add type attribute
 * Paste this in Browser Console to automatically set type based on geometry
 */

(async function updateGeofenceTypes() {
  console.log('🔧 Updating Geofence Types...\n');
  
  const state = window.store.getState();
  const geofences = Object.values(state.geofences.items);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const geofence of geofences) {
    // Skip if already has type
    if (geofence.attributes?.type) {
      console.log(`⏭️  Skipping ${geofence.name} (already has type: ${geofence.attributes.type})`);
      skipped++;
      continue;
    }
    
    // Detect type from geometry
    let detectedType = null;
    if (geofence.area?.startsWith('CIRCLE')) {
      detectedType = 'marker';
    } else if (geofence.area?.startsWith('POLYGON')) {
      detectedType = 'zone';
    } else if (geofence.area?.startsWith('LINESTRING')) {
      detectedType = 'route';
    }
    
    if (!detectedType) {
      console.warn(`⚠️  Cannot detect type for ${geofence.name} (area: ${geofence.area})`);
      skipped++;
      continue;
    }
    
    // Update geofence with type
    try {
      console.log(`🔄 Updating ${geofence.name} → type: ${detectedType}`);
      
      const updatedGeofence = {
        ...geofence,
        attributes: {
          ...(geofence.attributes || {}),
          type: detectedType
        }
      };
      
      const response = await fetch(`/api/geofences/${geofence.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGeofence),
      });
      
      if (response.ok) {
        console.log(`✅ Updated ${geofence.name}`);
        updated++;
      } else {
        const error = await response.text();
        console.error(`❌ Failed to update ${geofence.name}:`, error);
        errors++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (e) {
      console.error(`❌ Error updating ${geofence.name}:`, e);
      errors++;
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (updated > 0) {
    console.log('🔄 Refreshing page in 2 seconds to reload geofences...');
    setTimeout(() => window.location.reload(), 2000);
  } else {
    console.log('ℹ️  No geofences updated. Check your geofences manually.');
  }
})();
