import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CustomTable } from "../../common/components/custom";
import EditDriverDialog from "./EditDriverDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { driversActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";

const DriversTab = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const drivers = useSelector((state) => state.drivers.items);

  // Convert drivers object to array
  const driverList = useMemo(() => {
    return Object.values(drivers);
  }, [drivers]);

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    if (!searchTerm) return driverList;
    
    const query = searchTerm.toLowerCase();
    return driverList.filter((driver) =>
      driver.name?.toLowerCase().includes(query) ||
      driver.licenseNumber?.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query) ||
      driver.email?.toLowerCase().includes(query) ||
      driver.attributes?.identityNumber?.toLowerCase().includes(query)
    );
  }, [driverList, searchTerm]);

  // Define columns for CustomTable
  const columns = [
    { key: "name", label: "Name" },
    { 
      key: "identityNumber", 
      label: "Identity Number",
      render: (row) => row.attributes?.identityNumber || "-"
    },
    { 
      key: "description", 
      label: "Description",
      render: (row) => row.attributes?.description || "-"
    },
  ];

  const handleToggleAll = () => {
    if (selectedDrivers.length === filteredDrivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(filteredDrivers.map((d) => d.id));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setEditDialogOpen(true);
  };

  const handleDelete = (driver) => {
    setRemovingId(driver.id);
  };

  const handleAdd = () => {
    setEditingDriver(null);
    setEditDialogOpen(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/drivers');
      const driversData = await response.json();
      dispatch(driversActions.refresh(driversData));
    } catch (error) {
      console.error('Failed to refresh drivers:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingDriver(null);
  };

  return (
    <>
      <CustomTable
        rows={filteredDrivers}
        columns={columns}
        selected={selectedDrivers}
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
        <EditDriverDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          driver={editingDriver}
          onDriverSaved={handleRefresh}
        />
      )}

      <RemoveDialog
        open={!!removingId}
        endpoint="drivers"
        itemId={removingId}
        onResult={(removed) => {
          const id = removingId;
          setRemovingId(null);
          if (removed && id != null) {
            dispatch(driversActions.refresh(Object.values(drivers).filter(d => d.id !== id)));
            setSelectedDrivers((prev) => prev.filter((d) => d !== id));
          }
        }}
      />
    </>
  );
};

export default DriversTab;
