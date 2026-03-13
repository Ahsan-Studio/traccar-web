import {
 useState, useMemo, useEffect, useRef 
} from "react";
import { Snackbar, Alert } from "@mui/material";
import { CustomTable } from "../../common/components/custom";
import TemplateDialog from "./TemplateDialog";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import RemoveDialog from "../../common/components/RemoveDialog";
import { exportConfig, importConfig } from "../../common/util/configExport";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const importRef = useRef(null);

  // Fetch templates from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchOrThrow('/api/user-templates', { headers: { Accept: 'application/json' } });
        const data = await response.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setSelected((prev) => prev.filter((id) => (Array.isArray(data) ? data : []).some((r) => r.id === id)));
        }
      } catch (e) {
        if (!cancelled) setItems([]);
        console.error('Error fetching templates:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const rows = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it) =>
      (it.name || '').toLowerCase().includes(q)
      || (it.description || '').toLowerCase().includes(q)
    );
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
      <input type="file" ref={importRef} style={{ display: 'none' }} accept=".tem,.json" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const result = await importConfig('tem', file);
          setSnackbar({ open: true, message: `Imported ${result.imported} templates`, severity: 'success' });
          setRefreshVersion((v) => v + 1);
        } catch (err) {
          setSnackbar({ open: true, message: `Import failed: ${err.message}`, severity: 'error' });
        }
        e.target.value = '';
      }} />
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
        onExport={async () => {
          try {
            await exportConfig('tem');
            setSnackbar({ open: true, message: 'Templates exported', severity: 'success' });
          } catch (err) {
            setSnackbar({ open: true, message: `Export failed: ${err.message}`, severity: 'error' });
          }
        }}
        onImport={() => importRef.current?.click()}
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
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ fontSize: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default TemplatesTab;
