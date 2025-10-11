import { useState, useMemo, useEffect } from "react";
import { CustomTable } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import RouteDialog from "./RouteDialog";

const RoutesTab = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
          setItems(Array.isArray(data) ? data : []);
          // Remove selections that no longer exist
          setSelected((prev) => prev.filter((id) => (Array.isArray(data) ? data : []).some((r) => r.id === id)));
        }
      } catch (e) {
        if (!cancelled) setItems([]);
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
      (it.name || "").toLowerCase().includes(q) ||
      (it.description || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const columns = [
    { 
      key: "name", 
      label: "Name",
      minWidth: 150,
    },
    { 
      key: "description", 
      label: "Description",
      minWidth: 200,
    },
    { 
      key: "attributes", 
      label: "Corridor Width",
      minWidth: 120,
      align: "center",
      format: (value) => {
        const distance = value?.polylineDistance || 100;
        return `${distance}m`;
      }
    },
    {
      key: "attributes",
      label: "Color",
      minWidth: 80,
      align: "center",
      format: (value) => {
        const color = value?.color || "#2196F3";
        return (
          <div style={{
            width: "20px",
            height: "20px",
            backgroundColor: color,
            borderRadius: "3px",
            margin: "0 auto",
            border: "1px solid #ccc"
          }} />
        );
      }
    },
  ];

  const onToggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const onToggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  const handleDialogClose = (saved) => {
    setDialogOpen(false);
    setEditing(null);
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
        selected={selected}
        onToggleAll={onToggleAll}
        onToggleRow={onToggleRow}
        onEdit={onEdit}
        onDelete={onDelete}
        search={search}
        onSearchChange={setSearch}
        onAdd={onAdd}
        onOpenSettings={() => {}}
      />
      <RouteDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        route={editing}
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
