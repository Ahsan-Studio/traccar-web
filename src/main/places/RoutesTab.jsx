import { useState, useMemo, useEffect } from "react";
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
import RemoveDialog from "../../common/components/RemoveDialog";
import RouteDialog from "./RouteDialog";
import PlaceGroupsDialog from "./PlaceGroupsDialog";

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

const RoutesTab = ({ onFocusLocation, onCountChange }) => {
  const { classes } = useStyles();
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]); // Track which routes are visible on map
  const [search, setSearch] = useState("");
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

  // Fetch routes and groups from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        
        // Fetch routes with pagination
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        
        const routesResponse = await fetchOrThrow(`/api/routes?${params.toString()}`, { 
          headers: { Accept: "application/json" } 
        });
        const routesData = await routesResponse.json();
        
        if (!cancelled) {
          // Handle both array response and paginated response
          const routes = Array.isArray(routesData) ? routesData : (routesData.data || []);
          
          setItems(routes);
          // Update total pages if pagination info is available
          if (routesData.totalPages) {
            setTotalPages(routesData.totalPages);
          } else if (routesData.total) {
            setTotalPages(Math.ceil(routesData.total / pageSize));
          } else {
            setTotalPages(1);
          }
          // By default, show all routes
          setVisibleItems(routes.map(r => r.id));
          
          // Update count for tab label
          if (onCountChange) {
            const totalCount = routesData.total || routes.length;
            onCountChange(totalCount);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setVisibleItems([]);
        }
        console.error("Error fetching routes:", e);
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
  const handleGroupVisibilityToggle = (routeIds, event) => {
    if (event) event.stopPropagation();
    // Check if all routes in group are visible
    const allVisible = routeIds.every(id => visibleItems.includes(id));
    // Toggle: if all visible, hide all; otherwise show all
    if (allVisible) {
      setVisibleItems(prev => prev.filter(id => !routeIds.includes(id)));
    } else {
      setVisibleItems(prev => [...new Set([...prev, ...routeIds])]);
    }
  };

  // Group routes by groupId
  const groupedRoutes = useMemo(() => {
    const q = search.toLowerCase();
    const filteredRoutes = items.filter((it) => 
      (it.name || "").toLowerCase().includes(q)
    );

    const routeGroups = {};
    const ungrouped = [];

    filteredRoutes.forEach(route => {
      if (route.groupId) {
        if (!routeGroups[route.groupId]) {
          const group = groups.find(g => g.id === route.groupId);
          routeGroups[route.groupId] = {
            id: route.groupId,
            name: group?.name || `Group ${route.groupId}`,
            routes: []
          };
        }
        routeGroups[route.groupId].routes.push(route);
      } else {
        ungrouped.push(route);
      }
    });

    // Create final array with headers and routes
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
        routeIds: ungrouped.map(r => r.id),
      });
      
      if (isExpanded) {
        ungrouped.forEach(route => {
          result.push({ type: 'route', content: route });
        });
      }
    }

    // Add grouped sections
    Object.entries(routeGroups).forEach(([groupId, group]) => {
      const isExpanded = expandedGroups[groupId] !== false; // Default expanded
      
      result.push({ 
        type: 'header', 
        groupId,
        content: group.name,
        count: group.routes.length,
        isExpanded,
        routeIds: group.routes.map(r => r.id),
      });
      
      if (isExpanded) {
        group.routes.forEach(route => {
          result.push({ type: 'route', content: route });
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

  // Handle row click - focus map on route
  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      // Parse LINESTRING geometry: LINESTRING (lat1 lng1, lat2 lng2, ...)
      const match = row.area.match(/LINESTRING\s*\(\s*([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map(coord => {
          const [lat, lng] = coord.trim().split(/\s+/).map(parseFloat);
          return { lat, lng };
        });
        // Focus on first point of route
        if (coords.length > 0) {
          onFocusLocation(coords[0], row);
        }
      }
    }
  };

  const onAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const onDelete = (row) => {
    setRemoving(row);
    setRemoveOpen(true);
  };

  const onRefresh = () => {
    setRefreshVersion((v) => v + 1);
  };

  const handleDialogClose = (saved) => {
    setDialogOpen(false);
    setEditing(null);
    if (saved) {
      setRefreshVersion((v) => v + 1);
    }
  };

  const handleGroupsDialogClose = (saved) => {
    setGroupsDialogOpen(false);
    if (saved) {
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
          ) : groupedRoutes.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, color: '#666' }}>
              No routes found
            </Box>
          ) : (
            groupedRoutes.map((item) => {
              if (item.type === 'header') {
                // Group header
                const allVisible = item.routeIds.every(id => visibleItems.includes(id));
                const someVisible = item.routeIds.some(id => visibleItems.includes(id));
                
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
                        onClick={(e) => handleGroupVisibilityToggle(item.routeIds, e)}
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
                // Route row
                const route = item.content;
                const isVisible = visibleItems.includes(route.id);
                
                return (
                  <Box
                    key={`route-${route.id}`}
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
                    {/* Checkbox for route visibility */}
                    <Box sx={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Checkbox
                        size="small"
                        checked={isVisible}
                        onChange={() => handleToggleVisibility(route.id)}
                        sx={{ padding: '2px', '& svg': { fontSize: 14 } }}
                      />
                    </Box>
                    {/* Route name - clickable to focus on map */}
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
                      onClick={() => handleRowClick(route)}
                    >
                      {route.name}
                    </Box>
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: '4px', paddingRight: '8px' }}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(route)}
                        sx={{ padding: '2px' }}
                      >
                        <img src="/img/theme/edit.svg" alt="Edit" style={{ width: 12, height: 12 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(route)}
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

      <RouteDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        route={editing}
      />
      <PlaceGroupsDialog
        open={groupsDialogOpen}
        onClose={handleGroupsDialogClose}
      />
      <RemoveDialog
        open={removeOpen}
        endpoint="routes"
        itemId={removing?.id}
        onResult={(ok) => {
          setRemoveOpen(false);
          setRemoving(null);
          if (ok) setRefreshVersion((v) => v + 1);
        }}
      />
    </Box>
  );
};

export default RoutesTab;
