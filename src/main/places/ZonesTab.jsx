import { useState, useMemo, useEffect } from "react";
import { CustomTable } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import ZoneDialog from "./ZoneDialog";
import PlaceGroupsDialog from "./PlaceGroupsDialog";

const ZonesTab = ({ onFocusLocation, onCountChange }) => {
  const [items, setItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]); // Track which zones are visible on map
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);

  // Toggle zone visibility
  const toggleVisibility = (id) => {
    setVisibleItems((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Fetch zones from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchOrThrow('/api/zones', { 
          headers: { Accept: "application/json" } 
        });
        const data = await response.json();
        if (!cancelled) {
          const zones = Array.isArray(data) ? data : [];
          setItems(zones);
          // By default, show all zones
          setVisibleItems(zones.map(z => z.id));
          // Report count to parent
          if (onCountChange) {
            onCountChange(zones.length);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setVisibleItems([]);
        }
        console.error("Error fetching zones:", e);
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
      setVisibleItems(rows.map((z) => z.id)); // Show all
    }
  };

  // Handle row click - focus map on zone center
  const handleRowClick = (row) => {
    if (row.area && onFocusLocation) {
      // Parse POLYGON geometry: POLYGON ((lat1 lng1, lat2 lng2, ...))
      const match = row.area.match(/POLYGON\s*\(\s*\(([^)]+)\)/);
      if (match) {
        const coords = match[1].split(',').map(coord => {
          const [lat, lng] = coord.trim().split(/\s+/).map(parseFloat);
          return { lat, lng };
        });
        
        // Calculate center of polygon
        if (coords.length > 0) {
          const sumLat = coords.reduce((sum, c) => sum + c.lat, 0);
          const sumLng = coords.reduce((sum, c) => sum + c.lng, 0);
          const center = {
            lat: sumLat / coords.length,
            lng: sumLng / coords.length
          };
          onFocusLocation(center, row);
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

      <ZoneDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        zone={editing}
      />
      <PlaceGroupsDialog
        open={groupsDialogOpen}
        onClose={handleGroupsDialogClose}
      />
      <RemoveDialog
        open={removeOpen}
        endpoint="zones"
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

export default ZonesTab;
