import { useState, useMemo, useEffect } from "react";
import { CustomTable } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import MarkerDialog from "./MarkerDialog";
import PlaceGroupsDialog from "./PlaceGroupsDialog";
import MapClickHandler from "./MapClickHandler";
import MapMarkerPreview from "./MapMarkerPreview";

const MarkersTab = ({ onFocusLocation, onCountChange }) => {
  const [items, setItems] = useState([]);
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

  // Handle map click - pass location to dialog
  const handleMapClick = (location) => {
    setPickedLocation(location);
  };

  // Handle icon selection from dialog
  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
  };

  // Fetch markers from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchOrThrow('/api/markers', { 
          headers: { Accept: "application/json" } 
        });
        const data = await response.json();
        if (!cancelled) {
          const markers = Array.isArray(data) ? data : [];
          setItems(markers);
          // By default, show all markers
          setVisibleItems(markers.map(m => m.id));
          // Report count to parent
          if (onCountChange) {
            onCountChange(markers.length);
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

  // Toggle visibility (using checkbox)
  const handleToggleVisibility = (id) => {
    setVisibleItems((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (visibleItems.length === rows.length) {
      setVisibleItems([]); // Hide all
    } else {
      setVisibleItems(rows.map((r) => r.id)); // Show all
    }
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

  const handleDialogClose = (saved) => {
    setDialogOpen(false);
    setEditing(null);
    setMapClickEnabled(false); // Disable map click
    setPickedLocation(null);
    if (saved) {
      setRefreshVersion((v) => v + 1);
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
    <>
      <CustomTable
        rows={rows}
        columns={columns}
        loading={loading}
        selected={visibleItems} // Use visibleItems for checkbox state
        onToggleAll={handleToggleAll}
        onToggleRow={handleToggleVisibility}
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
        onResult={(ok) => {
          setRemoveOpen(false);
          setRemoving(null);
          if (ok) setRefreshVersion((v) => v + 1);
        }}
      />
    </>
  );
};

export default MarkersTab;
