import {
  useState, useMemo, useEffect, useRef, useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { makeStyles } from 'tss-react/mui';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { geofencesActions } from '../../store';
import RemoveDialog from '../../common/components/RemoveDialog';
import ZoneDialog from './ZoneDialog';
import PlaceGroupsDialog from './PlaceGroupsDialog';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  toolbar: {
    display: 'flex',
    gap: '5px',
    padding: '10px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      height: '28px',
      fontSize: '11px',
      '& fieldset': {
        border: 'none',
      },
    },
  },
  actionButton: {
    width: '28px',
    height: '28px',
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  buttonIcon: {
    width: '14px',
    height: '14px',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    height: '28px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 500,
    color: '#444',
  },
  tableWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  paginationButton: {
    width: '24px',
    height: '24px',
    minWidth: '24px',
    padding: 0,
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      color: '#666666',
    },
    '&:disabled': {
      opacity: 0.3,
    },
  },
  pageInfo: {
    fontSize: '11px',
    color: '#666666',
    padding: '0 8px',
  },
  pageSizeSelect: {
    fontSize: '11px',
    height: '24px',
    '& .MuiSelect-select': {
      padding: '2px 24px 2px 8px',
      fontSize: '11px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: '1px solid #e0e0e0',
    },
  },
}));

const ZonesTab = ({ onFocusLocation, onCountChange }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Refresh Redux geofences store
  const refreshGeofencesStore = useCallback(async () => {
    try {
      const [markersRes, routesRes, zonesRes] = await Promise.all([
        fetchOrThrow('/api/markers', { headers: { Accept: 'application/json' } }),
        fetchOrThrow('/api/routes', { headers: { Accept: 'application/json' } }),
        fetchOrThrow('/api/zones', { headers: { Accept: 'application/json' } }),
      ]);
      const markers = await markersRes.json();
      const routes = await routesRes.json();
      const zones = await zonesRes.json();
      dispatch(geofencesActions.refresh([...markers, ...routes, ...zones]));
    } catch (error) {
      console.error('Failed to refresh geofences store:', error);
    }
  }, [dispatch]);

  // Fetch zones with pagination
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        const response = await fetchOrThrow(`/api/zones?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data.data || []);
          setItems(list);
          if (data.totalPages) setTotalPages(data.totalPages);
          else if (data.total) setTotalPages(Math.ceil(data.total / pageSize));
          else setTotalPages(1);
          setVisibleItems(list.map((z) => z.id));
          if (onCountChange) onCountChange(data.total || list.length);
        }
      } catch (e) {
        if (!cancelled) { setItems([]); setVisibleItems([]); }
        console.error('Error fetching zones:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshVersion, currentPage, pageSize, onCountChange]);

  // Fetch groups
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchOrThrow('/api/geofence-groups', { headers: { Accept: 'application/json' } });
        const data = await response.json();
        if (!cancelled) setGroups(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshVersion]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleGroupVisibilityToggle = (ids, event) => {
    if (event) event.stopPropagation();
    const allVis = ids.every((id) => visibleItems.includes(id));
    if (allVis) setVisibleItems((prev) => prev.filter((id) => !ids.includes(id)));
    else setVisibleItems((prev) => [...new Set([...prev, ...ids])]);
  };

  const handleToggleAllVisibility = () => {
    const allIds = items.map((z) => z.id);
    const allVis = allIds.length > 0 && allIds.every((id) => visibleItems.includes(id));
    setVisibleItems(allVis ? [] : allIds);
  };

  const groupedZones = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = items.filter((it) => (it.name || '').toLowerCase().includes(q));
    const zoneGroups = {};
    const ungrouped = [];
    filtered.forEach((zone) => {
      if (zone.groupId) {
        if (!zoneGroups[zone.groupId]) {
          const group = groups.find((g) => g.id === zone.groupId);
          zoneGroups[zone.groupId] = { name: group?.name || `Group ${zone.groupId}`, zones: [] };
        }
        zoneGroups[zone.groupId].zones.push(zone);
      } else {
        ungrouped.push(zone);
      }
    });
    const result = [];
    if (ungrouped.length > 0) {
      const gId = 'ungrouped';
      const expanded = expandedGroups[gId] !== false;
      result.push({
        type: 'header', groupId: gId, content: 'Tidak digrup', count: ungrouped.length, isExpanded: expanded, itemIds: ungrouped.map((z) => z.id),
      });
      if (expanded) ungrouped.forEach((z) => result.push({ type: 'item', content: z }));
    }
    Object.entries(zoneGroups).forEach(([gId, group]) => {
      const expanded = expandedGroups[gId] !== false;
      result.push({
        type: 'header', groupId: gId, content: group.name, count: group.zones.length, isExpanded: expanded, itemIds: group.zones.map((z) => z.id),
      });
      if (expanded) group.zones.forEach((z) => result.push({ type: 'item', content: z }));
    });
    return result;
  }, [items, groups, search, expandedGroups]);

  const handleToggleVisibility = (id) => {
    setVisibleItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      const match = row.area.match(/POLYGON\s*\(\s*\(([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map((coord) => {
          const [lat, lng] = coord.trim().split(/\s+/).map(parseFloat);
          return { lat, lng };
        });
        if (coords.length > 0) {
          const sumLat = coords.reduce((sum, c) => sum + c.lat, 0);
          const sumLng = coords.reduce((sum, c) => sum + c.lng, 0);
          onFocusLocation({ lat: sumLat / coords.length, lng: sumLng / coords.length }, row);
        }
      }
    }
  };

  const onAdd = () => { setEditing(null); setDialogOpen(true); };
  const onEdit = (row) => { setEditing(row); setDialogOpen(true); };
  const onDelete = (row) => { setRemoving(row); setRemoveOpen(true); };
  const onRefresh = () => { setRefreshVersion((v) => v + 1); };

  // Export zones as JSON
  const handleExport = useCallback(() => {
    const exportData = items.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id')));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zones_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [items]);

  // Import zones from JSON file
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importItems = Array.isArray(data) ? data : [data];
      setLoading(true);
      let successCount = 0;
      for (const item of importItems) {
        try {
          await fetchOrThrow('/api/zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          successCount += 1;
        } catch (e) {
          console.error('Failed to import zone:', item.name, e);
        }
      }
      alert(`Berhasil import ${successCount} dari ${importItems.length} zone`);
      setRefreshVersion((v) => v + 1);
      await refreshGeofencesStore();
    } catch (e) {
      alert('Gagal membaca file import. Pastikan format JSON valid.');
      console.error('Import error:', e);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [refreshGeofencesStore]);

  // Delete all zones
  const handleDeleteAll = useCallback(async () => {
    if (items.length === 0) return;
    if (!window.confirm(`Hapus semua ${items.length} zone? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setLoading(true);
      await Promise.all(items.map((item) => fetchOrThrow(`/api/zones/${item.id}`, { method: 'DELETE' }).catch(() => null)));
      setRefreshVersion((v) => v + 1);
      await refreshGeofencesStore();
    } catch (e) {
      console.error('Error deleting all zones:', e);
    } finally {
      setLoading(false);
    }
  }, [items, refreshGeofencesStore]);

  const handleDialogClose = async (saved) => {
    setDialogOpen(false); setEditing(null);
    if (saved) { setRefreshVersion((v) => v + 1); await refreshGeofencesStore(); }
  };

  const handleGroupsDialogClose = (saved) => {
    setGroupsDialogOpen(false);
    if (saved) setRefreshVersion((v) => v + 1);
  };

  const allVisible = items.length > 0 && items.every((z) => visibleItems.includes(z.id));
  const someVisible = items.some((z) => visibleItems.includes(z.id));

  return (
    <Box className={classes.container}>
      {/* Toolbar: Search + 6 buttons */}
      <Box className={classes.toolbar}>
        <TextField
          className={classes.searchField}
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <img src="/img/theme/search.svg" alt="Search" className={classes.buttonIcon} />
              </InputAdornment>
            ),
          }}
        />
        {/* 1. Reload */}
        <IconButton className={classes.actionButton} onClick={onRefresh} title="Reload">
          <img src="/img/theme/refresh-color.svg" alt="Reload" className={classes.buttonIcon} />
        </IconButton>
        {/* 2. Add Zone */}
        <IconButton className={classes.actionButton} onClick={onAdd} title="Add Zone">
          <img src="/img/theme/zone-add.svg" alt="Add" className={classes.buttonIcon} />
        </IconButton>
        {/* 3. Groups */}
        <IconButton className={classes.actionButton} onClick={() => setGroupsDialogOpen(true)} title="Groups">
          <img src="/img/theme/groups.svg" alt="Groups" className={classes.buttonIcon} />
        </IconButton>
        {/* 4. Import */}
        <IconButton className={classes.actionButton} onClick={() => fileInputRef.current?.click()} title="Import">
          <img src="/img/theme/import.svg" alt="Import" className={classes.buttonIcon} />
        </IconButton>
        {/* 5. Export */}
        <IconButton className={classes.actionButton} onClick={handleExport} title="Export" disabled={items.length === 0}>
          <img src="/img/theme/export.svg" alt="Export" className={classes.buttonIcon} style={{ opacity: items.length === 0 ? 0.5 : 1 }} />
        </IconButton>
        {/* 6. Delete All */}
        <IconButton className={classes.actionButton} onClick={handleDeleteAll} title="Delete All Zones" disabled={items.length === 0}>
          <img src="/img/theme/remove2.svg" alt="Delete All" className={classes.buttonIcon} style={{ opacity: items.length === 0 ? 0.5 : 1 }} />
        </IconButton>
      </Box>

      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* Table Header: Eye icon + Name */}
      <Box className={classes.tableHeader}>
        <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton size="small" onClick={handleToggleAllVisibility} sx={{ padding: '2px' }} title="Show/Hide All">
            <img
              src={allVisible ? '/img/theme/eye.svg' : '/img/theme/eye-crossed.svg'}
              alt="Toggle All"
              style={{ width: 14, height: 14, opacity: someVisible && !allVisible ? 0.5 : 1 }}
            />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, paddingLeft: '8px' }}>Name</Box>
      </Box>

      {/* Table Body */}
      <Box className={classes.tableWrapper}>
        <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: 'white' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>Loading...</Box>
          ) : groupedZones.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: '#666' }}>No zones found</Box>
          ) : (
            groupedZones.map((item) => {
              if (item.type === 'header') {
                const gAllVis = item.itemIds.every((id) => visibleItems.includes(id));
                const gSomeVis = item.itemIds.some((id) => visibleItems.includes(id));
                return (
                  <Box
                    key={`header-${item.groupId}`}
                    sx={{
                      display: 'flex', alignItems: 'center', height: '33px', backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', fontSize: '11px',
                      fontWeight: 500, cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#ebebeb' },
                    }}
                  >
                    <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small" checked={gAllVis} indeterminate={!gAllVis && gSomeVis}
                        onClick={(e) => handleGroupVisibilityToggle(item.itemIds, e)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, paddingLeft: '8px' }} onClick={() => toggleGroup(item.groupId)}>
                      <span style={{ color: '#222', fontWeight: 500 }}>
                        {item.content}
                        {' '}
                        <span style={{ color: '#888' }}>
                          (
                          {item.count}
                          )
                        </span>
                      </span>
                    </Box>
                    <Box sx={{ width: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => toggleGroup(item.groupId)} sx={{ padding: '2px' }}>
                        <span style={{ fontSize: 18, fontWeight: 'bold' }}>{item.isExpanded ? '-' : '+'}</span>
                      </IconButton>
                    </Box>
                  </Box>
                );
              }
              const zone = item.content;
              const isVisible = visibleItems.includes(zone.id);
              return (
                <Box
                  key={`item-${zone.id}`}
                  sx={{
                    display: 'flex', alignItems: 'center', height: '33px', borderBottom: '1px solid #e0e0e0',
                    fontSize: '11px', cursor: 'pointer', '&:hover': { backgroundColor: '#fafafa' },
                  }}
                >
                  <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Checkbox
                      size="small" checked={isVisible} onChange={() => handleToggleVisibility(zone.id)}
                      sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1, paddingLeft: '8px', '&:hover': { textDecoration: 'underline', color: '#2b82d4' },
                    }}
                    onClick={() => handleRowClick(zone)}
                  >
                    {zone.name}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '4px', paddingRight: '8px' }}>
                    <IconButton size="small" onClick={() => onEdit(zone)} sx={{ padding: '2px' }}>
                      <img src="/img/theme/edit.svg" alt="Edit" style={{ width: 12, height: 12 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(zone)} sx={{ padding: '2px' }}>
                      <img src="/img/theme/remove3.svg" alt="Delete" style={{ width: 12, height: 12 }} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Pagination Footer */}
      <Box className={classes.pagination}>
        <Box className={classes.paginationControls}>
          <IconButton className={classes.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>
            <FirstPageIcon />
          </IconButton>
          <IconButton className={classes.paginationButton} onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || loading}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography className={classes.pageInfo}>
            Page
            {' '}
            {currentPage}
            {' '}
            of
            {' '}
            {totalPages || 1}
          </Typography>
          <IconButton className={classes.paginationButton} onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages || loading}>
            <ChevronRightIcon />
          </IconButton>
          <IconButton className={classes.paginationButton} onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages || loading}>
            <LastPageIcon />
          </IconButton>
        </Box>
        <Select
          className={classes.pageSizeSelect}
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          disabled={loading}
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={75}>75</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
      </Box>

      <ZoneDialog open={dialogOpen} onClose={handleDialogClose} zone={editing} />
      <PlaceGroupsDialog open={groupsDialogOpen} onClose={handleGroupsDialogClose} />
      <RemoveDialog
        open={removeOpen} endpoint="zones" itemId={removing?.id}
        onResult={async (ok) => {
          setRemoveOpen(false); setRemoving(null);
          if (ok) { setRefreshVersion((v) => v + 1); await refreshGeofencesStore(); }
        }}
      />
    </Box>
  );
};

export default ZonesTab;
