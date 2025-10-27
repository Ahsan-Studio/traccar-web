console.log('🧪 Testing Groups Integration...\n');

// Test 1: Fetch groups
console.log('Test 1: Fetch /api/groups');
fetch('/api/groups')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Groups fetched:', data.length);
    data.forEach(g => console.log(`  - ${g.name} (id: ${g.id})`));
    
    // Expected groups with "Ungrouped" prepended
    const allGroups = [
      { id: 0, name: 'Ungrouped' },
      ...data
    ];
    console.log('\n📋 Groups for dropdown:', allGroups.length);
    allGroups.forEach(g => console.log(`  - ${g.name} (id: ${g.id})`));
  })
  .catch(e => console.error('❌ Failed:', e));

// Test 2: Check existing geofences' groupId
console.log('\n\nTest 2: Check geofences groupId');
fetch('/api/geofences')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Geofences fetched:', data.length);
    data.forEach(g => {
      console.log(`  - ${g.name}: groupId=${g.groupId}, type=${g.attributes?.type || 'undefined'}`);
    });
    
    // Count by group
    const byGroup = {};
    data.forEach(g => {
      const gid = g.groupId || 0;
      byGroup[gid] = (byGroup[gid] || 0) + 1;
    });
    console.log('\n📊 Geofences by group:');
    Object.entries(byGroup).forEach(([gid, count]) => {
      const groupName = gid === '0' ? 'Ungrouped' : `Group ID ${gid}`;
      console.log(`  - ${groupName}: ${count} geofences`);
    });
  })
  .catch(e => console.error('❌ Failed:', e));

console.log('\n\n🎯 Next steps:');
console.log('1. Open Places tab → Markers');
console.log('2. Click Add button');
console.log('3. Check Group dropdown');
console.log('4. Should see: Ungrouped, DEMO UNIT, DEV UNIT, Group Test, GRUP A');
