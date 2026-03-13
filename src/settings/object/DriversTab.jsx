import { useState, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Snackbar, Alert } from "@mui/material";
import { CustomTable } from "../../common/components/custom";
import EditDriverDialog from "./EditDriverDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { driversActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";
import { exportConfig, importConfig } from "../../common/util/configExport";

const DriversTab = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const importRef = useRef(null);

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

  const handleExport = async () => {
    try {
      await exportConfig('odr');
      setSnackbar({ open: true, message: 'Drivers exported', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: `Export failed: ${err.message}`, severity: 'error' });
    }
  };

  const handleImport = () => importRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importConfig('odr', file);
      setSnackbar({ open: true, message: `Imported ${result.imported} drivers`, severity: 'success' });
      await handleRefresh();
    } catch (err) {
      setSnackbar({ open: true, message: `Import failed: ${err.message}`, severity: 'error' });
    }
    e.target.value = '';
  };

  return (
    <>
      <input type="file" ref={importRef} style={{ display: 'none' }} accept=".odr,.json" onChange={handleImportFile} />
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
        onExport={handleExport}
        onImport={handleImport}
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
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ fontSize: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default DriversTab;
