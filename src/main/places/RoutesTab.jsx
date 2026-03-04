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
import RouteDialog from './RouteDialog';
import PlaceGroupsDialog from './PlaceGroupsDialog';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  toolbar: {
    display: 'flex',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      height: '26px',
      fontSize: '11px',
      '& fieldset': {
        border: '1px solid #f5f5f5',
      },
      '&:hover fieldset': {
        border: '1px solid #e0e0e0',
      },
    },
  },
  actionButton: {
    width: '28px',
    height: '28px',
    padding: '6px',
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
    border: '1px solid #f5f5f5',
    '&:hover': {
      backgroundColor: '#ffffff',
    },
  },
  buttonIcon: {
    width: '14px',
    height: '14px',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    height: '26px',
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
    padding: '0 10px',
    height: '28px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  paginationButton: {
    width: '22px',
    height: '22px',
    minWidth: '22px',
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
    padding: '0 6px',
  },
  pageSizeSelect: {
    fontSize: '11px',
    height: '22px',
    '& .MuiSelect-select': {
      padding: '2px 22px 2px 6px',
      fontSize: '11px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: '1px solid #e0e0e0',
    },
  },
}));

const RoutesTab = ({ onFocusLocation, onCountChange }) => {
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

  // Fetch routes with pagination
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        const response = await fetchOrThrow(`/api/routes?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data.data || []);
          setItems(list);
          if (data.totalPages) setTotalPages(data.totalPages);
          else if (data.total) setTotalPages(Math.ceil(data.total / pageSize));
          else setTotalPages(1);
          setVisibleItems(list.map((r) => r.id));
          if (onCountChange) onCountChange(data.total || list.length);
        }
      } catch (e) {
        if (!cancelled) { setItems([]); setVisibleItems([]); }
        console.error('Error fetching routes:', e);
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
    const nowVisible = !allVis;
    if (allVis) setVisibleItems((prev) => prev.filter((id) => !ids.includes(id)));
    else setVisibleItems((prev) => [...new Set([...prev, ...ids])]);
    dispatch(geofencesActions.setVisibility({ ids, visible: nowVisible }));
  };

  const handleToggleAllVisibility = () => {
    const allIds = items.map((r) => r.id);
    const allVis = allIds.length > 0 && allIds.every((id) => visibleItems.includes(id));
    const nowVisible = !allVis;
    setVisibleItems(allVis ? [] : allIds);
    dispatch(geofencesActions.setVisibility({ ids: allIds, visible: nowVisible }));
  };

  const groupedRoutes = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = items.filter((it) => (it.name || '').toLowerCase().includes(q));
    const routeGroups = {};
    const ungrouped = [];
    filtered.forEach((route) => {
      if (route.groupId) {
        if (!routeGroups[route.groupId]) {
          const group = groups.find((g) => g.id === route.groupId);
          routeGroups[route.groupId] = { name: group?.name || `Group ${route.groupId}`, routes: [] };
        }
        routeGroups[route.groupId].routes.push(route);
      } else {
        ungrouped.push(route);
      }
    });
    const result = [];
    if (ungrouped.length > 0) {
      const gId = 'ungrouped';
      const expanded = expandedGroups[gId] !== false;
      result.push({
        type: 'header', groupId: gId, content: 'Tidak digrup', count: ungrouped.length, isExpanded: expanded, itemIds: ungrouped.map((r) => r.id),
      });
      if (expanded) ungrouped.forEach((r) => result.push({ type: 'item', content: r }));
    }
    Object.entries(routeGroups).forEach(([gId, group]) => {
      const expanded = expandedGroups[gId] !== false;
      result.push({
        type: 'header', groupId: gId, content: group.name, count: group.routes.length, isExpanded: expanded, itemIds: group.routes.map((r) => r.id),
      });
      if (expanded) group.routes.forEach((r) => result.push({ type: 'item', content: r }));
    });
    return result;
  }, [items, groups, search, expandedGroups]);

  const handleToggleVisibility = (id) => {
    const nowVisible = !visibleItems.includes(id);
    setVisibleItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    dispatch(geofencesActions.setVisibility({ ids: [id], visible: nowVisible }));
  };

  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      const match = row.area.match(/LINESTRING\s*\(\s*([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map((coord) => {
          const [lat, lng] = coord.trim().split(/\s+/).map(parseFloat);
          return { lat, lng };
        });
        if (coords.length > 0) {
          let minLat = Infinity; let maxLat = -Infinity;
          let minLng = Infinity; let maxLng = -Infinity;
          coords.forEach((c) => {
            if (c.lat < minLat) minLat = c.lat;
            if (c.lat > maxLat) maxLat = c.lat;
            if (c.lng < minLng) minLng = c.lng;
            if (c.lng > maxLng) maxLng = c.lng;
          });
          onFocusLocation({ bounds: [[minLng, minLat], [maxLng, maxLat]] }, row);
        }
      }
    }
  };

  const onAdd = () => { setEditing(null); setDialogOpen(true); };
  const onEdit = (row) => { setEditing(row); setDialogOpen(true); };
  const onDelete = (row) => { setRemoving(row); setRemoveOpen(true); };
  const onRefresh = () => { setRefreshVersion((v) => v + 1); };

  // Export routes as JSON
  const handleExport = useCallback(() => {
    const exportData = items.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id')));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `routes_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [items]);

  // Import routes from JSON file
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
          await fetchOrThrow('/api/routes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          successCount += 1;
        } catch (e) {
          console.error('Failed to import route:', item.name, e);
        }
      }
      alert(`Berhasil import ${successCount} dari ${importItems.length} route`);
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

  // Delete all routes
  const handleDeleteAll = useCallback(async () => {
    if (items.length === 0) return;
    if (!window.confirm(`Hapus semua ${items.length} route? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setLoading(true);
      await Promise.all(items.map((item) => fetchOrThrow(`/api/routes/${item.id}`, { method: 'DELETE' }).catch(() => null)));
      setRefreshVersion((v) => v + 1);
      await refreshGeofencesStore();
    } catch (e) {
      console.error('Error deleting all routes:', e);
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

  const allVisible = items.length > 0 && items.every((r) => visibleItems.includes(r.id));
  const someVisible = items.some((r) => visibleItems.includes(r.id));

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
        {/* 2. Add Route */}
        <IconButton className={classes.actionButton} onClick={onAdd} title="Add Route">
          <img src="/img/theme/route-add.svg" alt="Add" className={classes.buttonIcon} />
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
        <IconButton className={classes.actionButton} onClick={handleDeleteAll} title="Delete All Routes" disabled={items.length === 0}>
          <img src="/img/theme/remove2.svg" alt="Delete All" className={classes.buttonIcon} style={{ opacity: items.length === 0 ? 0.5 : 1 }} />
        </IconButton>
      </Box>

      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* Table Header: Eye icon + Name */}
      <Box className={classes.tableHeader}>
        <Box sx={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton size="small" onClick={handleToggleAllVisibility} sx={{ padding: '2px' }} title="Show/Hide All">
            <img
              src={allVisible ? '/img/theme/eye.svg' : '/img/theme/eye-crossed.svg'}
              alt="Toggle All"
              style={{ width: 14, height: 14, opacity: someVisible && !allVisible ? 0.5 : 1 }}
            />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, paddingLeft: '4px' }}>Name</Box>
      </Box>

      {/* Table Body */}
      <Box className={classes.tableWrapper}>
        <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: 'white' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>Loading...</Box>
          ) : groupedRoutes.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: '#666' }}>No routes found</Box>
          ) : (
            groupedRoutes.map((item) => {
              if (item.type === 'header') {
                const gAllVis = item.itemIds.every((id) => visibleItems.includes(id));
                const gSomeVis = item.itemIds.some((id) => visibleItems.includes(id));
                return (
                  <Box
                    key={`header-${item.groupId}`}
                    sx={{
                      display: 'flex', alignItems: 'center', height: '28px', backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', fontSize: '11px',
                      fontWeight: 500, cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#ebebeb' },
                    }}
                  >
                    <Box sx={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small" checked={gAllVis} indeterminate={!gAllVis && gSomeVis}
                        onClick={(e) => handleGroupVisibilityToggle(item.itemIds, e)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, paddingLeft: '4px' }} onClick={() => toggleGroup(item.groupId)}>
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
              const route = item.content;
              const isVisible = visibleItems.includes(route.id);
              return (
                <Box
                  key={`item-${route.id}`}
                  sx={{
                    display: 'flex', alignItems: 'center', height: '28px', borderBottom: '1px solid #e0e0e0',
                    fontSize: '11px', cursor: 'pointer', '&:hover': { backgroundColor: '#fafafa' },
                  }}
                >
                  <Box sx={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Checkbox
                      size="small" checked={isVisible} onChange={() => handleToggleVisibility(route.id)}
                      sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1, paddingLeft: '4px', whiteSpace: 'pre', '&:hover': { textDecoration: 'underline', color: '#2b82d4' },
                    }}
                    onClick={() => handleRowClick(route)}
                  >
                    {route.name}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '4px', paddingRight: '8px' }}>
                    <IconButton size="small" onClick={() => onEdit(route)} sx={{ padding: '2px' }}>
                      <img src="/img/theme/edit.svg" alt="Edit" style={{ width: 12, height: 12 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(route)} sx={{ padding: '2px' }}>
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

      <RouteDialog open={dialogOpen} onClose={handleDialogClose} route={editing} />
      <PlaceGroupsDialog open={groupsDialogOpen} onClose={handleGroupsDialogClose} />
      <RemoveDialog
        open={removeOpen} endpoint="routes" itemId={removing?.id}
        onResult={async (ok) => {
          setRemoveOpen(false); setRemoving(null);
          if (ok) { setRefreshVersion((v) => v + 1); await refreshGeofencesStore(); }
        }}
      />
    </Box>
  );
};

export default RoutesTab;
