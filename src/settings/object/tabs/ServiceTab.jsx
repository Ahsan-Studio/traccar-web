import { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import ServiceDialog from "./ServiceDialog";
import fetchOrThrow from "../../../common/util/fetchOrThrow";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(0),
  },
  table: {
    "& .MuiTableBody-root": {
      maxHeight: "300px",
      overflow: "auto",
    },
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-root": {
      fontSize: "12px",
      fontWeight: 600,
      padding: "8px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: "#444444",
    },
  },
  tableRow: {
    "&:nth-of-type(even)": {
      backgroundColor: "#fafafa",
    },
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
    "& .MuiTableCell-root": {
      fontSize: "11px",
      padding: "6px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  checkboxCell: {
    width: "40px",
    padding: "6px 8px !important",
  },
  nameCell: {
    fontWeight: 500,
    color: "#333",
  },
  statusCell: {
    color: "#666",
    fontStyle: "italic",
  },
  actionCell: {
    width: "80px",
    padding: "6px 8px !important",
  },
  actionButton: {
    padding: "2px",
    margin: "0 2px",
    "& .MuiSvgIcon-root": {
      fontSize: "14px",
    },
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1, 0),
    marginTop: theme.spacing(2),
  },
  footerLeft: {
    display: "flex",
    gap: theme.spacing(1),
  },
  footerButton: {
    padding: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
      color: "#4a90e2",
    },
  },
  pagination: {
    fontSize: "11px",
    color: "#666",
  },
}));

const ServiceTab = ({ device }) => {
  const { classes } = useStyles();
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch services from API
  const fetchServices = async () => {
    if (!device?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchOrThrow(`/api/services/device/${device.id}`);
      const data = await response.json();
      setServiceData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Gagal memuat data service");
      setServiceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load services when component mounts or device changes
  useEffect(() => {
    fetchServices();
  }, [device?.id]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedServices(serviceData.map((service) => service.deviceId || service.id));
    } else {
      setSelectedServices([]);
    }
  };

  const handleSelectService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleDeleteService = async (service) => {
    if (!service?.id) return;
    const ok = window.confirm("Hapus service ini?");
    if (!ok) return;
    try {
      setLoading(true);
      setError(null);
      await fetchOrThrow(`/api/services/${service.id}`, { method: "DELETE" });
      // If the deleted item was being edited, close the dialog
      if (editingService && editingService.id === service.id) {
        handleCloseDialog();
      }
      await fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      setError(err.message || "Gagal menghapus service");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setServiceDialogOpen(false);
    setEditingService(null);
  };

  const handleSaveService = async (form) => {
    try {
      setLoading(true);
      setError(null);

      // Map dialog form data to API schema
      const payload = {
        deviceId: device?.id,
        name: form.name || "",
        dataList: !!form.dataList,
        popup: !!form.popup,
        odometerIntervalKm: form.odometerInterval ? Number(form.odometerIntervalValue || 0) : 0,
        lastServiceKm: form.odometerInterval ? Number(form.lastServiceOdometer || 0) : 0,
        intervalEngineHours: form.engineHourInterval ? Number(form.engineHourIntervalValue || 0) : 0,
        lastServiceEngineHours: form.engineHourInterval ? Number(form.lastServiceEngineHour || 0) : 0,
        intervalDays: form.dayInterval ? Number(form.dayIntervalValue || 0) : 0,
        lastServiceDate: form.dayInterval && form.lastServiceDay ? new Date(form.lastServiceDay).toISOString() : null,
        triggerOdometerLeftKm: form.odometerInterval && form.odometerLeft ? Number(form.odometerLeftValue || 0) : 0,
        triggerEngineHoursLeft: form.engineHourInterval && form.remainingEngineHours ? Number(form.remainingEngineHoursValue || 0) : 0,
        triggerDaysLeft: form.dayInterval && form.remainingDays ? Number(form.remainingDaysValue || 0) : 0,
        updateLastServiceOdometer: !!form.updateLastService,
        customReminders: form.customReminders || "",
        status: form.status || "",
      };

      let response;
      if (editingService && editingService.id) {
        // Update existing service
        response = await fetchOrThrow(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new service
        response = await fetchOrThrow(`/api/services`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      // Optionally read result
      await response.json().catch(() => null);

      // Close dialog and refresh
      handleCloseDialog();
      await fetchServices();
    } catch (err) {
      console.error("Error creating service:", err);
      setError(err.message || "Gagal menyimpan service");
    } finally {
      setLoading(false);
    }
  };

  // Use status from API response directly
  const getServiceStatus = (service) => service?.status || "";

  return (
    <Box className={classes.container}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TableContainer component={Paper} sx={{ border: "1px solid #ddd" }}>
        <Table size="small" className={classes.table}>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell padding="checkbox" className={classes.checkboxCell}>
                <Checkbox
                  indeterminate={
                    selectedServices.length > 0 &&
                    selectedServices.length < serviceData.length
                  }
                  checked={
                    serviceData.length > 0 &&
                    selectedServices.length === serviceData.length
                  }
                  onChange={handleSelectAll}
                  size="small"
                  disabled={loading}
                />
              </TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Status</TableCell>
              <TableCell className={classes.actionCell}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                  <Box sx={{ mt: 1, fontSize: "12px", color: "#666" }}>
                    Memuat data service...
                  </Box>
                </TableCell>
              </TableRow>
            ) : serviceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#666" }}>
                  Tidak ada data service
                </TableCell>
              </TableRow>
            ) : (
              serviceData.map((service) => (
                <TableRow key={service.deviceId || service.id} className={classes.tableRow}>
                  <TableCell padding="checkbox" className={classes.checkboxCell}>
                    <Checkbox
                      checked={selectedServices.includes(service.deviceId || service.id)}
                      onChange={() => handleSelectService(service.deviceId || service.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell className={classes.nameCell}>
                    {service.name}
                  </TableCell>
                  <TableCell className={classes.statusCell}>
                    {getServiceStatus(service)}
                  </TableCell>
                  <TableCell className={classes.actionCell}>
                    <IconButton
                      size="small"
                      className={classes.actionButton}
                      onClick={() => handleEditService(service)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      className={classes.actionButton}
                      onClick={() => handleDeleteService(service)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className={classes.footer}>
        <Box className={classes.footerLeft}>
          <IconButton
            className={classes.footerButton}
            onClick={handleAddService}
            title="Tambah Service"
          >
            <AddIcon />
          </IconButton>
          <IconButton
            className={classes.footerButton}
            title="Settings"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
        <Box className={classes.pagination}>
          Halaman 1 dari 1 &gt;&gt; 50
        </Box>
      </Box>

      <ServiceDialog
        open={serviceDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveService}
        service={editingService}
      />
    </Box>
  );
};

export default ServiceTab;
