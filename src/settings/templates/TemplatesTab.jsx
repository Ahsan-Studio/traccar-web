import { useState, useMemo, useEffect } from "react";
import SettingsTable from "../components/SettingsTable";
import TemplateDialog from "./TemplateDialog";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";

const TemplatesTab = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(null);

  // Fetch templates from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search && search.trim().length > 0) params.set("name", search.trim());
        const url = `/api/user-templates${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetchOrThrow(url, { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          // Remove selections that no longer exist
          setSelected((prev) => prev.filter((id) => (Array.isArray(data) ? data : []).some((r) => r.id === id)));
        }
      } catch (e) {
        if (!cancelled) setItems([]);
        console.error("Error fetching templates:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, refreshVersion]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((it) => (it.name || "").toLowerCase().includes(q));
  }, [items, search]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
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
    setOpenDialog(true);
  };

  const onEdit = (row) => {
    setEditing(row);
    setOpenDialog(true);
  };

  const onDelete = (row) => {
    setRemoving(row);
    setRemoveOpen(true);
  };

  const handleSave = async (data) => {
    try {
      setLoading(true);
      const payload = {
        // Some backends require id/userId in body for PUT
        id: editing?.id,
        userId: editing?.userId,
        name: data.name || "",
        description: data.description || "",
        subject: data.subject || "",
        message: data.message || "",
        attributes: data.attributes || {},
      };

      const response = editing && editing.id
        ? await fetchOrThrow(`/api/user-templates/${editing.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          })
        : await fetchOrThrow(`/api/user-templates`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          });
      await response.json().catch(() => null);
      setOpenDialog(false);
      setEditing(null);
      setRefreshVersion((v) => v + 1);
    } catch (e) {
      console.error("Error creating template:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingsTable
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
      <TemplateDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditing(null); }}
        onSave={handleSave}
        template={editing}
      />
      <RemoveDialog
        open={removeOpen}
        endpoint="user-templates"
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

export default TemplatesTab;
