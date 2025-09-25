import { useState } from "react";
import { BoolIcon } from "../components/SettingsTable";
import SettingsTable from "../components/SettingsTable";

const EventsTab = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading] = useState(false);

  const rows = items.filter((it) => (it.name || "").toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: "name", label: "Name" },
    { key: "active", label: "Active", align: "center", render: (r) => <BoolIcon value={!!r.active} /> },
    { key: "system", label: "System", align: "center", render: (r) => <BoolIcon value={!!r.system} /> },
    { key: "push", label: "Push notification", align: "center", render: (r) => <BoolIcon value={!!r.push} /> },
    { key: "email", label: "E-mail", align: "center", render: (r) => <BoolIcon value={!!r.email} /> },
    { key: "sms", label: "SMS", align: "center", render: (r) => <BoolIcon value={!!r.sms} /> },
  ];

  const onToggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const onToggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onAdd = () => {
    // TODO: open create dialog
  };

  const onEdit = (row) => {
    // TODO: open edit dialog
  };

  const onDelete = (row) => {
    // TODO: delete row
  };

  return (
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
  );
};

export default EventsTab;
