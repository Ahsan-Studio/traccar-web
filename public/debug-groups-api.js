// Debug Groups API Response
console.log('🔍 Debugging Groups API...\n');

fetch('/api/groups')
  .then(r => {
    console.log('Response status:', r.status);
    console.log('Response headers:', r.headers);
    return r.json();
  })
  .then(data => {
    console.log('✅ Raw response:', data);
    console.log('Is array?', Array.isArray(data));
    console.log('Length:', data?.length);
    
    // Check each group structure
    if (Array.isArray(data)) {
      data.forEach((g, i) => {
        console.log(`\nGroup ${i}:`);
        console.log('  Type:', typeof g);
        console.log('  Keys:', Object.keys(g));
        console.log('  id:', g.id, '(type:', typeof g.id, ')');
        console.log('  name:', g.name, '(type:', typeof g.name, ')');
        console.log('  groupId:', g.groupId);
        console.log('  attributes:', g.attributes);
      });
      
      // Test prepending Ungrouped
      console.log('\n📋 Testing prepend Ungrouped:');
      const allGroups = [
        { id: 0, name: 'Ungrouped' },
        ...data
      ];
      console.log('All groups:', allGroups);
      console.log('Count:', allGroups.length);
      
      // Check for duplicate ids
      const ids = allGroups.map(g => g.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.warn('⚠️ Duplicate IDs found:', duplicates);
      } else {
        console.log('✅ No duplicate IDs');
      }
    }
  })
  .catch(e => {
    console.error('❌ Error:', e);
    console.error('Stack:', e.stack);
  });
