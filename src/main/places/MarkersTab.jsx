import {
  useState, useMemo, useEffect, useRef, useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { useCanEdit } from '../../common/util/permissions';
import { geofencesActions } from '../../store';
import RemoveDialog from '../../common/components/RemoveDialog';
import MarkerDialog from './MarkerDialog';
import PlaceGroupsDialog from './PlaceGroupsDialog';
import MapClickHandler from './MapClickHandler';
import MapMarkerPreview from './MapMarkerPreview';

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

const MarkersTab = ({ onFocusLocation, onCountChange }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const canEdit = useCanEdit();
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
  const [mapClickEnabled, setMapClickEnabled] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('pin-1.svg');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Read user's group collapsed preference for markers
  const groupsDefaultCollapsed = useSelector(
    (state) => !!state.session.user?.attributes?.groupCollapsed?.markers
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  const handleMapClick = (location) => { setPickedLocation(location); };
  const handleIconSelect = (icon) => { setSelectedIcon(icon); };

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

  // Fetch markers with pagination
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        const response = await fetchOrThrow(`/api/markers?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data.data || []);
          setItems(list);
          if (data.totalPages) setTotalPages(data.totalPages);
          else if (data.total) setTotalPages(Math.ceil(data.total / pageSize));
          else setTotalPages(1);
          setVisibleItems(list.map((m) => m.id));
          if (onCountChange) onCountChange(data.total || list.length);
        }
      } catch (e) {
        if (!cancelled) { setItems([]); setVisibleItems([]); }
        console.error('Error fetching markers:', e);
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
    setExpandedGroups((prev) => {
      const currentlyExpanded = groupId in prev ? prev[groupId] : !groupsDefaultCollapsed;
      return { ...prev, [groupId]: !currentlyExpanded };
    });
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
    const allIds = items.map((m) => m.id);
    const allVis = allIds.length > 0 && allIds.every((id) => visibleItems.includes(id));
    const nowVisible = !allVis;
    setVisibleItems(allVis ? [] : allIds);
    dispatch(geofencesActions.setVisibility({ ids: allIds, visible: nowVisible }));
  };

  const groupedMarkers = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = items.filter((it) => (it.name || '').toLowerCase().includes(q));
    const markerGroups = {};
    const ungrouped = [];
    filtered.forEach((marker) => {
      if (marker.groupId) {
        if (!markerGroups[marker.groupId]) {
          const group = groups.find((g) => g.id === marker.groupId);
          markerGroups[marker.groupId] = { name: group?.name || `Group ${marker.groupId}`, markers: [] };
        }
        markerGroups[marker.groupId].markers.push(marker);
      } else {
        ungrouped.push(marker);
      }
    });
    const result = [];
    if (ungrouped.length > 0) {
      const gId = 'ungrouped';
      const expanded = gId in expandedGroups ? expandedGroups[gId] : !groupsDefaultCollapsed;
      result.push({
        type: 'header', groupId: gId, content: 'Ungrouped', count: ungrouped.length, isExpanded: expanded, itemIds: ungrouped.map((m) => m.id),
      });
      if (expanded) ungrouped.forEach((m) => result.push({ type: 'item', content: m }));
    }
    Object.entries(markerGroups).forEach(([gId, group]) => {
      const expanded = gId in expandedGroups ? expandedGroups[gId] : !groupsDefaultCollapsed;
      result.push({
        type: 'header', groupId: gId, content: group.name, count: group.markers.length, isExpanded: expanded, itemIds: group.markers.map((m) => m.id),
      });
      if (expanded) group.markers.forEach((m) => result.push({ type: 'item', content: m }));
    });
    return result;
  }, [items, groups, search, expandedGroups, groupsDefaultCollapsed]);

  const handleToggleVisibility = (id) => {
    const nowVisible = !visibleItems.includes(id);
    setVisibleItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    dispatch(geofencesActions.setVisibility({ ids: [id], visible: nowVisible }));
  };

  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      const match = row.area.match(/CIRCLE\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)/);
      if (match) onFocusLocation({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) }, row);
    }
  };

  const onAdd = () => {
    setEditing(null); setPickedLocation(null); setSelectedIcon('pin-1.svg'); setMapClickEnabled(true); setDialogOpen(true);
  };
  const onEdit = (row) => {
    setEditing(row); setPickedLocation(null); setSelectedIcon(row.attributes?.icon || 'pin-1.svg'); setMapClickEnabled(true); setDialogOpen(true);
  };
  const onDelete = (row) => { setRemoving(row); setRemoveOpen(true); };
  const onRefresh = () => { setRefreshVersion((v) => v + 1); };

  // Export markers as JSON
  const handleExport = useCallback(() => {
    const exportData = items.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id')));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `markers_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [items]);

  // Import markers from JSON file
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
          await fetchOrThrow('/api/markers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          successCount += 1;
        } catch (e) {
          console.error('Failed to import marker:', item.name, e);
        }
      }
      alert(`Successfully imported ${successCount} of ${importItems.length} marker`);
      setRefreshVersion((v) => v + 1);
      await refreshGeofencesStore();
    } catch (e) {
      alert('Failed to read import file. Ensure valid JSON format.');
      console.error('Import error:', e);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [refreshGeofencesStore]);

  // Delete all markers
  const handleDeleteAll = useCallback(async () => {
    if (items.length === 0) return;
    if (!window.confirm(`Delete all ${items.length} marker? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      await Promise.all(items.map((item) => fetchOrThrow(`/api/markers/${item.id}`, { method: 'DELETE' }).catch(() => null)));
      setRefreshVersion((v) => v + 1);
      await refreshGeofencesStore();
    } catch (e) {
      console.error('Error deleting all markers:', e);
    } finally {
      setLoading(false);
    }
  }, [items, refreshGeofencesStore]);

  const handleDialogClose = async (saved) => {
    setDialogOpen(false); setEditing(null); setMapClickEnabled(false); setPickedLocation(null);
    if (saved) { setRefreshVersion((v) => v + 1); await refreshGeofencesStore(); }
  };

  const handleGroupsDialogClose = (saved) => {
    setGroupsDialogOpen(false);
    if (saved) setRefreshVersion((v) => v + 1);
  };

  const allVisible = items.length > 0 && items.every((m) => visibleItems.includes(m.id));
  const someVisible = items.some((m) => visibleItems.includes(m.id));

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
        {/* 2. Add Marker - hidden for sub-accounts (V1 parity) */}
        {canEdit && (
          <IconButton className={classes.actionButton} onClick={onAdd} title="Add Marker">
            <img src="/img/theme/marker-add.svg" alt="Add" className={classes.buttonIcon} />
          </IconButton>
        )}
        {/* 3. Groups */}
        <IconButton className={classes.actionButton} onClick={() => setGroupsDialogOpen(true)} title="Groups">
          <img src="/img/theme/groups.svg" alt="Groups" className={classes.buttonIcon} />
        </IconButton>
        {/* 4. Import - hidden for sub-accounts (V1 parity) */}
        {canEdit && (
          <IconButton className={classes.actionButton} onClick={() => fileInputRef.current?.click()} title="Import">
            <img src="/img/theme/import.svg" alt="Import" className={classes.buttonIcon} />
          </IconButton>
        )}
        {/* 5. Export */}
        <IconButton className={classes.actionButton} onClick={handleExport} title="Export" disabled={items.length === 0}>
          <img src="/img/theme/export.svg" alt="Export" className={classes.buttonIcon} style={{ opacity: items.length === 0 ? 0.5 : 1 }} />
        </IconButton>
        {/* 6. Delete All - hidden for sub-accounts (V1 parity) */}
        {canEdit && (
          <IconButton className={classes.actionButton} onClick={handleDeleteAll} title="Delete All Markers" disabled={items.length === 0}>
            <img src="/img/theme/remove2.svg" alt="Delete All" className={classes.buttonIcon} style={{ opacity: items.length === 0 ? 0.5 : 1 }} />
          </IconButton>
        )}
      </Box>

      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* Table Header */}
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
          ) : groupedMarkers.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: '#666' }}>No markers found</Box>
          ) : (
            groupedMarkers.map((item) => {
              if (item.type === 'header') {
                const gAllVis = item.itemIds.every((id) => visibleItems.includes(id));
                const gSomeVis = item.itemIds.some((id) => visibleItems.includes(id));
                return (
                  <Box
                    key={`header-${item.groupId}`}
                    sx={{
                      display: 'flex', alignItems: 'center', height: '28px', backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', fontSize: '11px',
                      fontWeight: 'normal', cursor: 'pointer', userSelect: 'none',
                      '&:hover': { backgroundColor: '#ebebeb' },
                    }}
                  >
                    <Box sx={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small" checked={gAllVis} indeterminate={!gAllVis && gSomeVis}
                        onClick={(e) => handleGroupVisibilityToggle(item.itemIds, e)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, paddingLeft: '4px', whiteSpace: 'pre', overflow: 'hidden' }} onClick={() => toggleGroup(item.groupId)}>
                      <span style={{ color: '#222', fontWeight: 'normal' }}>
                        {item.content}
                        {' '}
                        <span style={{ color: '#888' }}>
                          (
                          {item.count}
                          )
                        </span>
                      </span>
                    </Box>
                    <Box sx={{ width: '26px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => toggleGroup(item.groupId)} sx={{ padding: '2px' }}>
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#666' }}>{item.isExpanded ? '−' : '+'}</span>
                      </IconButton>
                    </Box>
                  </Box>
                );
              }
              const marker = item.content;
              const isVisible = visibleItems.includes(marker.id);
              return (
                <Box
                  key={`item-${marker.id}`}
                  sx={{
                    display: 'flex', alignItems: 'center', height: '28px',
                    borderBottom: '1px solid #e0e0e0',
                    fontSize: '11px', cursor: 'pointer',
                    '&:hover': { backgroundColor: '#fafafa' },
                  }}
                >
                  <Box sx={{ width: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Checkbox
                      size="small" checked={isVisible} onChange={() => handleToggleVisibility(marker.id)}
                      sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1, paddingLeft: '4px', whiteSpace: 'pre', overflow: 'hidden',
                      '&:hover': { textDecoration: 'underline', color: '#2b82d4' },
                    }}
                    onClick={() => handleRowClick(marker)}
                  >
                    {marker.name}
                  </Box>
                  <Box sx={{ display: 'flex', gap: '3px', paddingRight: '6px' }}>
                    <IconButton size="small" onClick={() => onEdit(marker)} sx={{ padding: '2px' }}>
                      <img src="/img/theme/edit.svg" alt="Edit" style={{ width: 12, height: 12 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(marker)} sx={{ padding: '2px' }}>
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

      <MapClickHandler enabled={mapClickEnabled} onMapClick={handleMapClick} />
      <MapMarkerPreview enabled={dialogOpen} location={pickedLocation} icon={selectedIcon} />
      <MarkerDialog
        open={dialogOpen} onClose={handleDialogClose} marker={editing}
        pickedLocation={pickedLocation} onIconSelect={handleIconSelect}
      />
      <PlaceGroupsDialog open={groupsDialogOpen} onClose={handleGroupsDialogClose} />
      <RemoveDialog
        open={removeOpen} endpoint="markers" itemId={removing?.id}
        onResult={async (ok) => {
          setRemoveOpen(false); setRemoving(null);
          if (ok) { setRefreshVersion((v) => v + 1); await refreshGeofencesStore(); }
        }}
      />
    </Box>
  );
};

export default MarkersTab;
