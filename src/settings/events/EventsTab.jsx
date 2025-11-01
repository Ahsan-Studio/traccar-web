import { useState, useEffect } from "react";
import { CustomTable, BoolIcon } from "../../common/components/custom";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import { useCatch } from "../../reactHelper";
import EventDialog from "./EventDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { prefixString } from "../../common/util/stringUtils";
import { useTranslation } from "../../common/components/LocalizationProvider";

const EventsTab = () => {
  const t = useTranslation();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Load notifications from API
  const loadNotifications = useCatch(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow("/api/notifications");
      const responseJson = await response.json();
      // Keep the raw notification data for proper display
      setItems(responseJson);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const rows = items.filter((it) =>
    (it.description || it.type || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (r) => t(prefixString("event", r.type)),
    },
    {
      key: "active",
      label: "Active",
      align: "center",
      // TODO: change to r.enabled
      render: (r) => <BoolIcon value={!!r.always} />,
    },
    {
      key: "system",
      label: "System",
      align: "center",
      render: (r) => <BoolIcon value={r.notificators?.includes("web")} />,
    },
    {
      key: "push",
      label: "Push notification",
      align: "center",
      render: (r) => <BoolIcon value={r.notificators?.includes("firebase")} />,
    },
    {
      key: "email",
      label: "E-mail",
      align: "center",
      render: (r) => <BoolIcon value={r.notificators?.includes("mail")} />,
    },
    {
      key: "sms",
      label: "SMS",
      align: "center",
      render: (r) => <BoolIcon value={r.notificators?.includes("sms")} />,
    },
  ];

  const onToggleAll = () => {
    if (selected.length === rows.length) setSelected([]);
    else setSelected(rows.map((r) => r.id));
  };

  const onToggleRow = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onAdd = () => {
    setEditingId("new");
    setDialogOpen(true);
  };

  const onEdit = (notification) => {
    if (notification) {
      setEditingId(notification.id);
      setDialogOpen(true);
    }
  };

  const onDelete = (notification) => {
    if (notification) {
      setRemovingId(notification.id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleDialogSave = () => {
    loadNotifications();
    setSelected([]);
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

      <EventDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        eventId={editingId}
        onSave={handleDialogSave}
      />

      <RemoveDialog
        open={!!removingId}
        endpoint="notifications"
        itemId={removingId}
        onResult={(removed) => {
          const id = removingId;
          setRemovingId(null);
          if (removed && id != null) {
            loadNotifications();
            setSelected((prev) => prev.filter((d) => d !== id));
          }
        }}
      />
    </>
  );
};

export default EventsTab;
