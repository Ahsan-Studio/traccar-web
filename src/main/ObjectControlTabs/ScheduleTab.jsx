import {
 useState, useEffect, useCallback, useMemo 
} from "react";
import { useSelector } from "react-redux";
import { CustomTable } from "../../common/components/custom";
import ScheduleFormDialog from "./ScheduleFormDialog";

const ScheduleTab = ({ classes, showNotification }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const devices = useSelector((state) => state.devices.items);

  const getDeviceName = (deviceId) => {
    const d = devices[deviceId];
    return d ? d.name : `Device ${deviceId}`;
  };

  const formatSchedule = (s) => {
    if (s.scheduleType === "exact") {
      return s.exactTime ? new Date(s.exactTime).toLocaleString() : "Exact";
    }
    let days = [];
    try {
      const raw = typeof s.recurringDays === "string" ? JSON.parse(s.recurringDays) : s.recurringDays;
      days = Array.isArray(raw) ? raw : [];
    } catch { days = []; }
    const dayStr = days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
    const timeStr = s.recurringFrom && s.recurringTo ? ` ${s.recurringFrom}–${s.recurringTo}` : "";
    return `Recurring: ${dayStr}${timeStr}`;
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/command-schedules", { headers: { Accept: "application/json" } });
      if (res.ok) setSchedules(await res.json());
      else showNotification("Failed to load schedules", "error");
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleAdd = () => { setEditingSchedule(null); setDialogOpen(true); };
  const handleEdit = (row) => { setEditingSchedule(row); setDialogOpen(true); };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`/api/command-schedules/${row.id}`, { method: "DELETE" });
      if (res.ok) { showNotification("Schedule deleted", "success"); fetchSchedules(); }
      else showNotification("Failed to delete", "error");
    } catch (err) { showNotification(`Error: ${err.message}`, "error"); }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => fetch(`/api/command-schedules/${id}`, { method: "DELETE" })));
      showNotification("Selected schedules deleted", "success");
      setSelected([]);
      fetchSchedules();
    } catch (err) { showNotification(`Error: ${err.message}`, "error"); }
  };

  const handleSaved = () => { setDialogOpen(false); fetchSchedules(); };

  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === schedules.length ? [] : schedules.map((s) => s.id)));
  }, [schedules]);
  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* Filtered rows */
  const filteredSchedules = useMemo(() => {
    if (!search) return schedules;
    const q = search.toLowerCase();
    return schedules.filter((s) =>
      (s.name || "").toLowerCase().includes(q) ||
      (getDeviceName(s.deviceId) || "").toLowerCase().includes(q) ||
      (s.commandType || "").toLowerCase().includes(q)
    );
  }, [schedules, search, devices]);

  /* CustomTable columns (V1: Name, Active, Schedule, Object, Gateway, Type, Command) */
  const columns = useMemo(() => [
    { key: "name", label: "Name" },
    {
 key: "active", label: "Active", width: 60, render: (row) => (
      <span style={{
        display: "inline-block", width: 10, height: 10, borderRadius: "50%",
        backgroundColor: row.active ? "#4caf50" : "#f44336",
      }} />
    )
},
    { key: "schedule", label: "Schedule", render: (row) => formatSchedule(row) },
    { key: "deviceId", label: "Object", render: (row) => getDeviceName(row.deviceId) },
    { key: "gateway", label: "Gateway", render: (row) => (row.gateway || "GPRS").toUpperCase() },
    { key: "commandType", label: "Type" },
    { key: "commandData", label: "Command", render: (row) => row.commandData || "—" },
  ], [devices]);

  return (
    <div className={classes.tabPanel} style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <CustomTable
        rows={filteredSchedules}
        columns={columns}
        loading={loading}
        selected={selected}
        onToggleAll={onToggleAll}
        onToggleRow={onToggleRow}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchSchedules}
        onBulkDelete={handleBulkDelete}
        search={search}
        onSearchChange={setSearch}
        onOpenSettings={() => {}}
      />

      <ScheduleFormDialog
        classes={classes}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingSchedule={editingSchedule}
        onSaved={handleSaved}
        showNotification={showNotification}
      />
    </div>
  );
};

export default ScheduleTab;
