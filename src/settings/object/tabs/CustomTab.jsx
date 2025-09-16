import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useState } from "react";
import fetchOrThrow from "../../../common/util/fetchOrThrow";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = makeStyles()((theme) => ({
  tableContainer: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    height: "24px",
  },
  headerCell: {
    fontSize: "12px",
    color: "#444444",
    fontWeight: "normal",
    padding: "0px 8px",
    height: "24px",
    border: "none",
    textAlign: "left",
  },
  tableRow: {
    height: "19px",
    borderBottom: "1px solid #f5f5f5",
  },
  dataCell: {
    fontSize: "11px",
    color: "#333",
    padding: "0px 8px",
    height: "19px",
    border: "none",
    verticalAlign: "middle",
  },
  checkboxCell: {
    width: "40px",
    padding: "0px 8px",
    height: "19px",
    textAlign: "center",
    verticalAlign: "middle",
  },
  actionCell: {
    width: "80px",
    padding: "0px 8px",
    height: "19px",
    textAlign: "center",
    verticalAlign: "middle",
  },
  actionButton: {
    padding: "2px",
    margin: "0 1px",
    "& .MuiSvgIcon-root": {
      fontSize: "14px",
    },
  },
  bottomActions: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    display: "flex",
    gap: "8px",
  },
  actionIconButton: {
    width: "32px",
    height: "32px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
    },
  },
  addButton: {
    backgroundColor: "#2196f3",
    color: "white",
    "&:hover": {
      backgroundColor: "#1976d2",
    },
  },
  sortIcon: {
    fontSize: "14px",
    marginLeft: "4px",
    color: "#666",
  },
  modalTitle: {
    backgroundColor: "#2196f3",
    color: "white",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalContent: {
    padding: "24px",
    minWidth: "400px",
  },
  formField: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  checkboxField: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    "& .MuiCheckbox-root": {
      padding: "4px",
    },
    "& .MuiFormControlLabel-label": {
      fontSize: "12px",
    },
  },
  modalActions: {
    padding: "16px 24px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  saveButton: {
    backgroundColor: "#2196f3",
    color: "white",
    fontSize: "12px",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#1976d2",
    },
  },
  cancelButton: {
    color: "#666",
    fontSize: "12px",
    textTransform: "none",
  },
}));

const CustomTab = ({ onFormDataChange, device, formData }) => {
  const { classes } = useStyles();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    name: "",
    value: "",
    showOnListData: false,
    showOnPopup: false,
  });
  
  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get custom attributes from formData.attributes.custom (which is updated) or device.attributes.custom (fallback)
  // Struktur sesuai dokumentasi:
  // {
  //   "attributes": {
  //     "custom": {
  //       "attribute_1": {
  //         "value": "value_1",
  //         "showOnPopup": true,
  //         "showOnListData": true
  //       },
  //       "attribute_2": {
  //         "value": "value_2",
  //         "showOnPopup": false,
  //         "showOnListData": true
  //       }
  //     }
  //   }
  // }
  const customAttributes = formData?.attributes?.custom || device?.attributes?.custom || {};
  
  // Debug logging
  console.log('CustomTab Debug:', {
    device: device?.id,
    formDataAttributes: formData?.attributes,
    deviceAttributes: device?.attributes,
    customAttributes,
    customFieldsCount: Object.keys(customAttributes).length
  });

  // Convert attributes object to array format for table display
  // Mapping sesuai dokumentasi:
  // - Nama: attributes.custom.[attribute_name]
  // - Nilai: attributes.custom.[attribute_name].value
  // - Daftar Data: attributes.custom.[attribute_name].showOnListData
  // - Popup: attributes.custom.[attribute_name].showOnPopup
  const customFields = Object.entries(customAttributes).map(([attributeName, config]) => ({
    id: attributeName,
    name: attributeName, // attributes.custom.[attribute_name]
    value: config.value, // attributes.custom.[attribute_name].value
    dataList: config.showOnListData, // attributes.custom.[attribute_name].showOnListData
    popup: config.showOnPopup, // attributes.custom.[attribute_name].showOnPopup
    checked: false,
  }));

  const handleCustomFieldChange = async (index, field, value) => {
    const fieldName = customFields[index].name;
    const updatedCustomAttributes = { ...customAttributes };
    
    if (!updatedCustomAttributes[fieldName]) {
      updatedCustomAttributes[fieldName] = {
        value: "",
        showOnPopup: false,
        showOnListData: false,
      };
    }

    switch (field) {
      case "value":
        // attributes.custom.[attribute_name].value
        updatedCustomAttributes[fieldName].value = value;
        break;
      case "dataList":
        // attributes.custom.[attribute_name].showOnListData
        updatedCustomAttributes[fieldName].showOnListData = value;
        break;
      case "popup":
        // attributes.custom.[attribute_name].showOnPopup
        updatedCustomAttributes[fieldName].showOnPopup = value;
        break;
      case "name":
        // Handle name change - need to create new attribute and remove old one
        // attributes.custom.[new_attribute_name]
        if (value !== fieldName) {
          updatedCustomAttributes[value] = { ...updatedCustomAttributes[fieldName] };
          delete updatedCustomAttributes[fieldName];
        }
        break;
    }

    // Update local state immediately for better UX
    const updatedAttributes = {
      ...device?.attributes,
      custom: updatedCustomAttributes,
    };
    
    onFormDataChange({
      attributes: updatedAttributes,
    });

    // Save to backend asynchronously
    if (device && device.id) {
      try {
        await saveDeviceAttributes(device.id, updatedAttributes);
      } catch (err) {
        console.error('Failed to save custom field change:', err);
        setError(err.message || "Gagal menyimpan perubahan");
      }
    }
  };

  const handleCheckboxChange = (index) => {
    // Update local state for checkbox selection (not persisted)
    // This could be used for bulk operations in the future
    console.log("Checkbox changed for field:", customFields[index].name);
  };

  const openAddModal = () => {
    setModalFormData({
      name: "",
      value: "",
      showOnListData: false,
      showOnPopup: false,
    });
    setEditingField(null);
    setModalOpen(true);
  };

  const openEditModal = (index) => {
    const field = customFields[index];
    setModalFormData({
      name: field.name,
      value: field.value,
      showOnListData: field.dataList,
      showOnPopup: field.popup,
    });
    setEditingField(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingField(null);
    setModalFormData({
      name: "",
      value: "",
      showOnListData: false,
      showOnPopup: false,
    });
  };

  const handleFormChange = (field, value) => {
    setModalFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveCustomField = async () => {
    if (!modalFormData.name.trim()) {
      setError("Nama field tidak boleh kosong");
      return;
    }

    if (!device || !device.id) {
      setError("Device ID tidak tersedia");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedCustomAttributes = { ...customAttributes };
      
      if (editingField !== null) {
        // Edit existing field
        const oldFieldName = customFields[editingField].name;
        if (oldFieldName !== modalFormData.name) {
          // Name changed, remove old and add new
          delete updatedCustomAttributes[oldFieldName];
        }
      }

      // Add/Update field
      updatedCustomAttributes[modalFormData.name] = {
        value: modalFormData.value,
        showOnPopup: modalFormData.showOnPopup,
        showOnListData: modalFormData.showOnListData,
      };

      const updatedAttributes = {
        ...formData?.attributes || device?.attributes,
        custom: updatedCustomAttributes,
      };

      // Save to backend
      await saveDeviceAttributes(device.id, updatedAttributes);

      // Update local state
      onFormDataChange({
        attributes: updatedAttributes,
      });

      closeModal();
    } catch (err) {
      console.error('Failed to save custom field:', err);
      setError(err.message || "Gagal menyimpan custom field");
    } finally {
      setLoading(false);
    }
  };

  const removeCustomField = async (index) => {
    const fieldName = customFields[index].name;
    
    if (!device || !device.id) {
      setError("Device ID tidak tersedia");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const updatedCustomAttributes = { ...customAttributes };
      delete updatedCustomAttributes[fieldName];

      const updatedAttributes = {
        ...formData?.attributes || device?.attributes,
        custom: updatedCustomAttributes,
      };

      // Save to backend
      await saveDeviceAttributes(device.id, updatedAttributes);

      // Update local state
      onFormDataChange({
        attributes: updatedAttributes,
      });
    } catch (err) {
      console.error('Failed to delete custom field:', err);
      setError(err.message || "Gagal menghapus custom field");
    } finally {
      setLoading(false);
    }
  };

  const saveDeviceAttributes = async (deviceId, attributes) => {
    const response = await fetchOrThrow(`/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...device,
        attributes: attributes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save device attributes');
    }

    return response.json();
  };



  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      {/* Error Display */}
      {error && (
        <Box sx={{ 
          padding: "8px 16px", 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          fontSize: "12px",
          marginBottom: "8px"
        }}>
          {error}
        </Box>
      )}
      
      {customFields.length === 0 ? (
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "200px",
          color: "#666",
          fontSize: "14px"
        }}>
          <Typography variant="body2" sx={{ marginBottom: 2 }}>
            Belum ada custom fields. Klik tombol + untuk menambah field baru.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table className={classes.table}>
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell className={classes.checkboxCell}></TableCell>
                <TableCell className={classes.headerCell}>
                  Nama
                  <span className={classes.sortIcon}>↑</span>
                </TableCell>
                <TableCell className={classes.headerCell}>Nilai</TableCell>
                <TableCell className={classes.headerCell}>Daftar data</TableCell>
                <TableCell className={classes.headerCell}>Popup</TableCell>
                <TableCell className={classes.actionCell}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customFields.map((field, index) => (
              <TableRow key={field.id} className={classes.tableRow}>
                <TableCell className={classes.checkboxCell}>
                  <Checkbox
                    checked={field.checked}
                    onChange={() => handleCheckboxChange(index)}
                    size="small"
                  />
                </TableCell>
                <TableCell className={classes.dataCell}>
                  <TextField
                    value={field.name}
                    onChange={(e) => handleCustomFieldChange(index, "name", e.target.value)}
                    variant="standard"
                    size="small"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '11px',
                        padding: '0px',
                      },
                    }}
                  />
                </TableCell>
                <TableCell className={classes.dataCell}>
                  <TextField
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, "value", e.target.value)}
                    variant="standard"
                    size="small"
                    type="number"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '11px',
                        padding: '0px',
                      },
                    }}
                  />
                </TableCell>
                <TableCell className={classes.dataCell}>
                  <Checkbox
                    checked={field.dataList}
                    onChange={() => handleCustomFieldChange(index, "dataList", !field.dataList)}
                    size="small"
                    sx={{ padding: "2px" }}
                  />
                </TableCell>
                <TableCell className={classes.dataCell}>
                  <Checkbox
                    checked={field.popup}
                    onChange={() => handleCustomFieldChange(index, "popup", !field.popup)}
                    size="small"
                    sx={{ padding: "2px" }}
                  />
                </TableCell>
                <TableCell className={classes.actionCell}>
                  <IconButton
                    onClick={() => openEditModal(index)}
                    className={classes.actionButton}
                    size="small"
                    disabled={loading}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => removeCustomField(index)}
                    className={classes.actionButton}
                    size="small"
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Bottom Action Buttons */}
      <Box className={classes.bottomActions}>
        <IconButton 
          className={`${classes.actionIconButton} ${classes.addButton}`}
          onClick={openAddModal}
          disabled={loading}
        >
          <AddIcon />
        </IconButton>
        <IconButton className={classes.actionIconButton}>
          <RefreshIcon />
        </IconButton>
        <IconButton className={classes.actionIconButton}>
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className={classes.modalTitle}>
          <Typography variant="h6" sx={{ color: "white", fontSize: "14px", fontWeight: 600 }}>
            Properti isian buatan sendiri
          </Typography>
          <IconButton onClick={closeModal} size="small" sx={{ color: "white", padding: "4px" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent className={classes.modalContent}>
          <TextField
            label="Nama"
            value={modalFormData.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            fullWidth
            className={classes.formField}
            size="small"
          />
          
          <TextField
            label="Nilai"
            value={modalFormData.value}
            onChange={(e) => handleFormChange("value", e.target.value)}
            fullWidth
            className={classes.formField}
            size="small"
          />
          
          <Box className={classes.checkboxField}>
            <Checkbox
              checked={modalFormData.showOnListData}
              onChange={(e) => handleFormChange("showOnListData", e.target.checked)}
              color="primary"
              size="small"
            />
            <Typography variant="body2" sx={{ fontSize: "12px" }}>
              Daftar data
            </Typography>
          </Box>
          
          <Box className={classes.checkboxField}>
            <Checkbox
              checked={modalFormData.showOnPopup}
              onChange={(e) => handleFormChange("showOnPopup", e.target.checked)}
              color="primary"
              size="small"
            />
            <Typography variant="body2" sx={{ fontSize: "12px" }}>
              Popup
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions className={classes.modalActions}>
          <Button
            onClick={closeModal}
            className={classes.cancelButton}
            startIcon={<CloseIcon />}
            size="small"
          >
            Batal
          </Button>
          <Button
            onClick={saveCustomField}
            className={classes.saveButton}
            startIcon={<SaveIcon />}
            size="small"
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomTab;
