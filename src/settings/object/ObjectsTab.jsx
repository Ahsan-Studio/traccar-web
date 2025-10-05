import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CustomTable, BoolIcon } from "../../common/components/custom";
import EditDeviceDialog from "./EditDeviceDialog";
import AddDeviceDialog from "./AddDeviceDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { devicesActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const ObjectsTab = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const devices = useSelector((state) => state.devices.items);

  // Convert devices object to array
  const deviceList = useMemo(() => {
    return Object.values(devices).map((device) => ({
      ...device,
      status: device.status === "online" ? true : false,
    }));
  }, [devices]);

  // Filter devices based on search term
  const filteredDevices = useMemo(() => {
    if (!searchTerm) return deviceList;
    
    const query = searchTerm.toLowerCase();
    return deviceList.filter((device) => 
      device.name?.toLowerCase().includes(query) ||
      device.uniqueId?.toLowerCase().includes(query) ||
      device.expirationTime?.toLowerCase().includes(query)
    );
  }, [deviceList, searchTerm]);

  // Define columns for CustomTable
  const columns = [
    { key: "name", label: "Name" },
    { key: "uniqueId", label: "IMEI" },
    { 
      key: "status", 
      label: "Status",
      align: "center",
      render: (row) => <BoolIcon value={row.status} />,
    },
    { key: "expirationTime", label: "Expires on" },
  ];

  const handleToggleAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setEditDialogOpen(true);
  };

  const handleDelete = (device) => {
    setRemovingId(device.id);
  };

  const handleAdd = () => {
    setAddDialogOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow("/api/devices");
      const devicesData = await response.json();
      dispatch(devicesActions.refresh(devicesData));
    } catch (error) {
      console.error("Error refreshing devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingDevice(null);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  return (
    <>
      <CustomTable
        rows={filteredDevices}
        columns={columns}
        selected={selectedDevices}
        onToggleAll={handleToggleAll}
        onToggleRow={handleToggleRow}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        loading={loading}
        showSearch={true}
        search={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {editDialogOpen && (
        <EditDeviceDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          device={editingDevice}
        />
      )}

      <AddDeviceDialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
      />

      <RemoveDialog
        open={!!removingId}
        endpoint="devices"
        itemId={removingId}
        onResult={(removed) => {
          const id = removingId;
          setRemovingId(null);
          if (removed && id != null) {
            dispatch(devicesActions.remove(id));
            setSelectedDevices((prev) => prev.filter((d) => d !== id));
          }
        }}
      />
    </>
  );
};

export default ObjectsTab;
