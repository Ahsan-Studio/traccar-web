import { useState, useEffect, useCallback, useMemo } from "react";
import { CustomTable } from "../../common/components/custom";
import TemplateFormDialog from "./TemplateFormDialog";

const TemplatesTab = ({ classes, showNotification }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [templateForm, setTemplateForm] = useState({
    description: "", type: "custom", textChannel: false,
    data: "", protocol: "", encoding: "ascii",
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/commands", { headers: { Accept: "application/json" } });
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setTemplateForm({ description: "", type: "custom", textChannel: false, data: "", protocol: "", encoding: "ascii" });
    setTemplateDialogOpen(true);
  };

  const handleEdit = (row) => {
    setEditingTemplate(row);
    setTemplateForm({
      description: row.description || "",
      type: row.type || "custom",
      textChannel: row.textChannel || false,
      data: row.attributes?.data || "",
      protocol: row.attributes?.protocol || "",
      encoding: row.attributes?.encoding || "ascii",
    });
    setTemplateDialogOpen(true);
  };

  const handleClose = () => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({ description: "", type: "custom", textChannel: false, data: "", protocol: "", encoding: "ascii" });
  };

  const handleSave = async () => {
    if (!templateForm.description.trim()) { showNotification("Please enter a template name", "warning"); return; }
    if (!templateForm.data.trim()) { showNotification("Please enter command data", "warning"); return; }

    setLoading(true);
    try {
      const cmd = {
        description: templateForm.description,
        type: templateForm.type,
        textChannel: templateForm.textChannel,
        attributes: {
          data: templateForm.data,
          encoding: templateForm.encoding || "ascii",
          ...(templateForm.protocol ? { protocol: templateForm.protocol } : {}),
        },
      };
      if (editingTemplate) cmd.id = editingTemplate.id;

      const method = editingTemplate ? "PUT" : "POST";
      const url = editingTemplate ? `/api/commands/${editingTemplate.id}` : "/api/commands";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });

      if (res.ok) {
        showNotification(editingTemplate ? "Template updated" : "Template created", "success");
        handleClose();
        fetchTemplates();
      } else {
        const err = await res.text();
        showNotification(`Failed: ${err || res.statusText}`, "error");
      }
    } catch (err) {
      showNotification(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/commands/${row.id}`, { method: "DELETE" });
      if (res.ok) { showNotification("Template deleted", "success"); fetchTemplates(); }
      else {
        const err = await res.text();
        showNotification(`Failed: ${err || res.statusText}`, "error");
      }
    } catch (err) {
      showNotification(`Failed: ${err.message}`, "error");
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => fetch(`/api/commands/${id}`, { method: "DELETE" })));
      showNotification("Selected templates deleted", "success");
      setSelected([]);
      fetchTemplates();
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    }
  };

  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === templates.length ? [] : templates.map((t) => t.id)));
  }, [templates]);
  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* Filtered rows */
  const filteredTemplates = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) =>
      (t.description || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q) ||
      (t.attributes?.data || "").toLowerCase().includes(q)
    );
  }, [templates, search]);

  /* CustomTable columns (V1: Name, Protocol, Gateway, Type, Command) */
  const columns = useMemo(() => [
    { key: "description", label: "Name" },
    { key: "protocol", label: "Protocol", render: (row) => row.attributes?.protocol || "—" },
    { key: "gateway", label: "Gateway", render: (row) => (row.textChannel ? "SMS" : "GPRS") },
    { key: "type", label: "Type" },
    { key: "command", label: "Command", render: (row) => row.attributes?.data || "—" },
  ], []);

  return (
    <div className={classes.tabPanel} style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <CustomTable
        rows={filteredTemplates}
        columns={columns}
        loading={loading}
        selected={selected}
        onToggleAll={onToggleAll}
        onToggleRow={onToggleRow}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchTemplates}
        onBulkDelete={handleBulkDelete}
        search={search}
        onSearchChange={setSearch}
        onOpenSettings={() => {}}
      />

      <TemplateFormDialog
        classes={classes}
        open={templateDialogOpen}
        onClose={handleClose}
        editingTemplate={editingTemplate}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        loading={loading}
        onSave={handleSave}
      />
    </div>
  );
};

export default TemplatesTab;
