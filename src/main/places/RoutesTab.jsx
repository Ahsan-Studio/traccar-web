import { useState, useMemo, useEffect } from "react";
import { CustomTable } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import RouteDialog from "./RouteDialog";
import PlaceGroupsDialog from "./PlaceGroupsDialog";

const RoutesTab = ({ onFocusLocation }) => {
  const [items, setItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]); // Track which routes are visible on map
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);

  // Toggle route visibility
  const toggleVisibility = (id) => {
    setVisibleItems((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Fetch routes from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchOrThrow('/api/routes', { 
          headers: { Accept: "application/json" } 
        });
        const data = await response.json();
        if (!cancelled) {
          const routes = Array.isArray(data) ? data : [];
          setItems(routes);
          // By default, show all routes
          setVisibleItems(routes.map(r => r.id));
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
  }, [refreshVersion]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((it) => 
      (it.name || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  // Define columns for CustomTable
  const columns = [
    { 
      key: "name", 
      label: "Name",
      width: "100%",
    },
  ];

  const handleToggleAll = () => {
    if (visibleItems.length === rows.length) {
      setVisibleItems([]); // Hide all
    } else {
      setVisibleItems(rows.map((r) => r.id)); // Show all
    }
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
    <>
      <CustomTable
        rows={rows}
        columns={columns}
        loading={loading}
        selected={visibleItems} // Use visibleItems for checkbox state
        onToggleAll={handleToggleAll}
        onToggleRow={toggleVisibility}
        onEdit={onEdit}
        onDelete={onDelete}
        search={search}
        onSearchChange={setSearch}
        onAdd={onAdd}
        onRefresh={onRefresh}
        onOpenGroups={() => setGroupsDialogOpen(true)}
        onOpenSettings={() => {}}
        onRowClick={handleRowClick} // Add row click handler
      />

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
    </>
  );
};

export default RoutesTab;
