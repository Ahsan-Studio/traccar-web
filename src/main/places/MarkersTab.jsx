import { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { makeStyles } from "tss-react/mui";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import { geofencesActions } from "../../store";
import RemoveDialog from "../../common/components/RemoveDialog";
import MarkerDialog from "./MarkerDialog";
import PlaceGroupsDialog from "./PlaceGroupsDialog";
import MapClickHandler from "./MapClickHandler";
import MapMarkerPreview from "./MapMarkerPreview";

const useStyles = makeStyles()(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
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
  tableWrapper: {
    flex: 1,
    overflow: "hidden",
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

const MarkersTab = ({ onFocusLocation, onCountChange }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]); // Track which markers are visible on map
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [mapCenter] = useState({ lat: -6.2088, lng: 106.8456 }); // Default Jakarta
  const [mapClickEnabled, setMapClickEnabled] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('pin-1.svg');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  // Handle map click - pass location to dialog
  const handleMapClick = (location) => {
    setPickedLocation(location);
  };

  // Handle icon selection from dialog
  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
  };

  // Fetch markers and groups from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        
        // Fetch markers with pagination
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        
        const markersResponse = await fetchOrThrow(`/api/markers?${params.toString()}`, { 
          headers: { Accept: "application/json" } 
        });
        const markersData = await markersResponse.json();
        
        if (!cancelled) {
          // Handle both array response and paginated response
          const markers = Array.isArray(markersData) ? markersData : (markersData.data || []);
          
          setItems(markers);
          // Update total pages if pagination info is available
          if (markersData.totalPages) {
            setTotalPages(markersData.totalPages);
          } else if (markersData.total) {
            setTotalPages(Math.ceil(markersData.total / pageSize));
          } else {
            setTotalPages(1);
          }
          // By default, show all markers
          setVisibleItems(markers.map(m => m.id));
          
          // Update count for tab label
          if (onCountChange) {
            const totalCount = markersData.total || markers.length;
            onCountChange(totalCount);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setVisibleItems([]);
        }
        console.error("Error fetching markers:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion, currentPage, pageSize, onCountChange]);

  // Fetch groups separately (only once on mount or when refreshVersion changes)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const groupsResponse = await fetchOrThrow('/api/geofence-groups', { 
          headers: { Accept: "application/json" } 
        });
        const groupsData = await groupsResponse.json();
        
        if (!cancelled) {
          const groupsList = Array.isArray(groupsData) ? groupsData : [];
          setGroups(groupsList);
        }
      } catch (e) {
        if (!cancelled) {
          setGroups([]);
        }
        console.error("Error fetching groups:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  // Toggle group expand/collapse
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Toggle group visibility
  const handleGroupVisibilityToggle = (markerIds, event) => {
    if (event) event.stopPropagation();
    // Check if all markers in group are visible
    const allVisible = markerIds.every(id => visibleItems.includes(id));
    // Toggle: if all visible, hide all; otherwise show all
    if (allVisible) {
      setVisibleItems(prev => prev.filter(id => !markerIds.includes(id)));
    } else {
      setVisibleItems(prev => [...new Set([...prev, ...markerIds])]);
    }
  };

  // Group markers by groupId
  const groupedMarkers = useMemo(() => {
    const q = search.toLowerCase();
    const filteredMarkers = items.filter((it) => 
      (it.name || "").toLowerCase().includes(q)
    );

    const markerGroups = {};
    const ungrouped = [];

    filteredMarkers.forEach(marker => {
      if (marker.groupId) {
        if (!markerGroups[marker.groupId]) {
          const group = groups.find(g => g.id === marker.groupId);
          markerGroups[marker.groupId] = {
            id: marker.groupId,
            name: group?.name || `Group ${marker.groupId}`,
            markers: []
          };
        }
        markerGroups[marker.groupId].markers.push(marker);
      } else {
        ungrouped.push(marker);
      }
    });

    // Create final array with headers and markers
    const result = [];
    
    // Add ungrouped section
    if (ungrouped.length > 0) {
      const groupId = 'ungrouped';
      const isExpanded = expandedGroups[groupId] !== false; // Default expanded
      
      result.push({ 
        type: 'header', 
        groupId,
        content: `Tidak digrup`,
        count: ungrouped.length,
        isExpanded,
        markerIds: ungrouped.map(m => m.id),
      });
      
      if (isExpanded) {
        ungrouped.forEach(marker => {
          result.push({ type: 'marker', content: marker });
        });
      }
    }

    // Add grouped sections
    Object.entries(markerGroups).forEach(([groupId, group]) => {
      const isExpanded = expandedGroups[groupId] !== false; // Default expanded
      
      result.push({ 
        type: 'header', 
        groupId,
        content: group.name,
        count: group.markers.length,
        isExpanded,
        markerIds: group.markers.map(m => m.id),
      });
      
      if (isExpanded) {
        group.markers.forEach(marker => {
          result.push({ type: 'marker', content: marker });
        });
      }
    });

    return result;
  }, [items, groups, search, expandedGroups]);

  // Toggle visibility (using checkbox)
  const handleToggleVisibility = (id) => {
    setVisibleItems((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Handle row click - focus map on marker location
  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      // Parse CIRCLE geometry: CIRCLE (lat lng, radius)
      const match = row.area.match(/CIRCLE\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        onFocusLocation({ lat, lng }, row);
      }
    }
  };

  const onAdd = () => {
    setEditing(null);
    setPickedLocation(null);
    setSelectedIcon('pin-1.svg'); // Reset to default
    setMapClickEnabled(true); // Enable map click
    setDialogOpen(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setPickedLocation(null);
    setSelectedIcon(row.attributes?.icon || 'pin-1.svg'); // Set from existing marker
    setMapClickEnabled(true); // Enable map click
    setDialogOpen(true);
  };

  const onDelete = (row) => {
    setRemoving(row);
    setRemoveOpen(true);
  };

  const onRefresh = () => {
    setRefreshVersion((v) => v + 1);
  };

  const handleDialogClose = async (saved) => {
    setDialogOpen(false);
    setEditing(null);
    setMapClickEnabled(false); // Disable map click
    setPickedLocation(null);
    if (saved) {
      // Refresh local list
      setRefreshVersion((v) => v + 1);
      
      // Also update Redux store so map shows marker immediately
      try {
        // Fetch all geofences (markers + routes + zones) to refresh store
        const [markersRes, routesRes, zonesRes] = await Promise.all([
          fetchOrThrow('/api/markers', { headers: { Accept: "application/json" } }),
          fetchOrThrow('/api/routes', { headers: { Accept: "application/json" } }),
          fetchOrThrow('/api/zones', { headers: { Accept: "application/json" } }),
        ]);
        
        const markers = await markersRes.json();
        const routes = await routesRes.json();
        const zones = await zonesRes.json();
        
        // Use refresh to completely replace geofences
        const allGeofences = [...markers, ...routes, ...zones];
        dispatch(geofencesActions.refresh(allGeofences));
      } catch (error) {
        console.error('Failed to refresh markers for map:', error);
      }
    }
  };

  const handleGroupsDialogClose = (saved) => {
    setGroupsDialogOpen(false);
    if (saved) {
      // Refresh markers to show updated groups
      setRefreshVersion((v) => v + 1);
    }
  };

  return (
    <Box className={classes.container}>
      {/* Toolbar with search and action buttons */}
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
                <img 
                  src="/img/theme/search.svg" 
                  alt="Search" 
                  className={classes.buttonIcon}
                />
              </InputAdornment>
            ),
          }}
        />
        <IconButton 
          className={classes.actionButton}
          onClick={onRefresh}
          title="Refresh"
        >
          <img 
            src="/img/theme/refresh-color.svg" 
            alt="Refresh" 
            className={classes.buttonIcon}
          />
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={onAdd}
          title="Add New"
        >
          <img 
            src="/img/theme/marker-add.svg" 
            alt="Add" 
            className={classes.buttonIcon}
          />
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={() => setGroupsDialogOpen(true)}
          title="Manage Groups"
        >
          <img 
            src="/img/theme/groups.svg" 
            alt="Groups" 
            className={classes.buttonIcon}
          />
        </IconButton>
        <IconButton 
          className={classes.actionButton}
          onClick={() => {
            if (visibleItems.length > 0 && window.confirm(`Delete ${visibleItems.length} selected item(s)?`)) {
              console.log('Delete selected:', visibleItems);
            }
          }}
          title="Delete Selected"
          disabled={visibleItems.length === 0}
        >
          <img 
            src="/img/theme/remove2.svg" 
            alt="Delete" 
            className={classes.buttonIcon}
            style={{ opacity: visibleItems.length === 0 ? 0.5 : 1 }}
          />
        </IconButton>
      </Box>

      {/* Table */}
      <Box className={classes.tableWrapper}>
        {/* Custom list with group headers */}
        <Box sx={{ height: '100%', overflow: 'auto', backgroundColor: 'white' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              Loading...
            </Box>
          ) : groupedMarkers.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: '#666' }}>
              No markers found
            </Box>
          ) : (
            groupedMarkers.map((item) => {
              if (item.type === 'header') {
                // Group header
                const allVisible = item.markerIds.every(id => visibleItems.includes(id));
                const someVisible = item.markerIds.some(id => visibleItems.includes(id));
                
                return (
                  <Box
                    key={`header-${item.groupId}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '33px',
                      backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #e0e0e0',
                      borderBottom: '1px solid #e0e0e0',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: '#ebebeb',
                      }
                    }}
                  >
                    {/* Checkbox for group visibility */}
                    <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small"
                        checked={allVisible}
                        indeterminate={!allVisible && someVisible}
                        onClick={(e) => handleGroupVisibilityToggle(item.markerIds, e)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    {/* Group name */}
                    <Box 
                      sx={{ flex: 1, paddingLeft: '8px' }}
                      onClick={() => toggleGroup(item.groupId)}
                    >
                      <span style={{ color: '#222', fontWeight: 500 }}>
                        {item.content} <span style={{ color: '#888' }}>({item.count})</span>
                      </span>
                    </Box>
                    {/* Expand/collapse button */}
                    <Box sx={{ width: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleGroup(item.groupId)}
                        sx={{ padding: '2px' }}
                      >
                        {item.isExpanded ? (
                          <span style={{ fontSize: 18, fontWeight: 'bold' }}>-</span>
                        ) : (
                          <span style={{ fontSize: 18, fontWeight: 'bold' }}>+</span>
                        )}
                      </IconButton>
                    </Box>
                  </Box>
                );
              } else {
                // Marker row
                const marker = item.content;
                const isVisible = visibleItems.includes(marker.id);
                
                return (
                  <Box
                    key={`marker-${marker.id}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '33px',
                      borderBottom: '1px solid #e0e0e0',
                      fontSize: '11px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#fafafa',
                      }
                    }}
                  >
                    {/* Checkbox for marker visibility */}
                    <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small"
                        checked={isVisible}
                        onChange={() => handleToggleVisibility(marker.id)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    {/* Marker name - clickable to focus on map */}
                    <Box 
                      sx={{ 
                        flex: 1, 
                        paddingLeft: '8px',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#2b82d4'
                        }
                      }}
                      onClick={() => handleRowClick(marker)}
                    >
                      {marker.name}
                    </Box>
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: '4px', paddingRight: '8px' }}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(marker)}
                        sx={{ padding: '2px' }}
                      >
                        <img src="/img/theme/edit.svg" alt="Edit" style={{ width: 12, height: 12 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(marker)}
                        sx={{ padding: '2px' }}
                      >
                        <img src="/img/theme/remove3.svg" alt="Delete" style={{ width: 12, height: 12 }} />
                      </IconButton>
                    </Box>
                  </Box>
                );
              }
            })
          )}
        </Box>
      </Box>

      {/* Pagination Footer */}
      <Box className={classes.pagination}>
        <Box className={classes.paginationControls}>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || loading}
          >
            <FirstPageIcon />
          </IconButton>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography className={classes.pageInfo}>
            Page {currentPage} of {totalPages || 1}
          </Typography>
          
          <IconButton 
            className={classes.paginationButton}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
          >
            <ChevronRightIcon />
          </IconButton>
          <IconButton 
            className={classes.paginationButton}
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages || loading}
          >
            <LastPageIcon />
          </IconButton>
        </Box>
        
        <Select
          className={classes.pageSizeSelect}
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          disabled={loading}
        >
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={75}>75</MenuItem>
          <MenuItem value={100}>100</MenuItem>
          <MenuItem value={200}>200</MenuItem>
        </Select>
      </Box>

      <MapClickHandler
        enabled={mapClickEnabled}
        onMapClick={handleMapClick}
      />
      <MapMarkerPreview
        enabled={dialogOpen}
        location={pickedLocation}
        icon={selectedIcon}
      />
      <MarkerDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        marker={editing}
        mapCenter={mapCenter}
        pickedLocation={pickedLocation}
        onIconSelect={handleIconSelect}
      />
      <PlaceGroupsDialog
        open={groupsDialogOpen}
        onClose={handleGroupsDialogClose}
      />
      <RemoveDialog
        open={removeOpen}
        endpoint="markers"
        itemId={removing?.id}
        onResult={async (ok) => {
          setRemoveOpen(false);
          setRemoving(null);
          if (ok) {
            // Refresh local list
            setRefreshVersion((v) => v + 1);
            
            // Also update Redux store so marker is removed from map immediately
            try {
              // Fetch all geofences (markers + routes + zones) to refresh store
              const [markersRes, routesRes, zonesRes] = await Promise.all([
                fetchOrThrow('/api/markers', { headers: { Accept: "application/json" } }),
                fetchOrThrow('/api/routes', { headers: { Accept: "application/json" } }),
                fetchOrThrow('/api/zones', { headers: { Accept: "application/json" } }),
              ]);
              
              const markers = await markersRes.json();
              const routes = await routesRes.json();
              const zones = await zonesRes.json();
              
              // Use refresh to completely replace geofences (removes deleted items)
              const allGeofences = [...markers, ...routes, ...zones];
              dispatch(geofencesActions.refresh(allGeofences));
            } catch (error) {
              console.error('Failed to refresh markers for map:', error);
            }
          }
        }}
      />
    </Box>
  );
};

export default MarkersTab;
