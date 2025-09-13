import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Checkbox,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditSensorDialog from "../EditSensorDialog";

const useStyles = makeStyles()((theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: theme.spacing(0),
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tableWrapper: {
    flex: 1,
    overflow: "auto",
  },
  table: {
    minWidth: 650,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-head": {
      fontWeight: 600,
      fontSize: "12px",
      color: "#333",
      padding: "8px 16px",
      borderBottom: "1px solid #ddd",
    },
  },
  tableRow: {
    "&:nth-of-type(even)": {
      backgroundColor: "#fafafa",
    },
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
    "& .MuiTableCell-body": {
      fontSize: "11px",
      padding: "8px 16px",
      borderBottom: "1px solid #eee",
    },
  },
  sortableHeader: {
    cursor: "pointer",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    "&:hover": {
      backgroundColor: "#e0e0e0",
    },
  },
  sortIcon: {
    fontSize: "16px",
    color: "#666",
  },
  actionButton: {
    padding: "4px",
    margin: "0 2px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
    },
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    borderTop: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    minHeight: "48px",
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  footerButton: {
    minWidth: "32px",
    height: "32px",
    padding: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "18px",
    },
  },
  addButton: {
    backgroundColor: "#4a90e2",
    color: "white",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
  refreshButton: {
    color: "#666",
    "&:hover": {
      backgroundColor: "#e0e0e0",
    },
  },
  settingsButton: {
    color: "#666",
    "&:hover": {
      backgroundColor: "#e0e0e0",
    },
  },
  editButton: {
    color: "#4a90e2",
    "&:hover": {
      backgroundColor: "#e3f2fd",
    },
  },
  deleteButton: {
    color: "#f44336",
    "&:hover": {
      backgroundColor: "#ffebee",
    },
  },
}));

const SensorsTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);

  const sensors = formData.sensors || [
    { id: 1, name: "EngineStatus", type: "Pengapian (ACC)", parameter: "acc" },
  ];

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSensors(sensors.map(sensor => sensor.id));
    } else {
      setSelectedSensors([]);
    }
  };

  const handleSelectSensor = (sensorId) => {
    setSelectedSensors(prev => 
      prev.includes(sensorId) 
        ? prev.filter(id => id !== sensorId)
        : [...prev, sensorId]
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddSensor = () => {
    const newSensor = {
      id: Date.now(),
      name: "New Sensor",
      type: "Digital",
      parameter: "param",
    };
    onFormDataChange({ sensors: [...sensors, newSensor] });
  };

  const handleEditSensor = (sensorId) => {
    const sensor = sensors.find(s => s.id === sensorId);
    setEditingSensor(sensor);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingSensor(null);
  };

  const handleSaveSensor = (sensorData) => {
    const updatedSensors = sensors.map(sensor =>
      sensor.id === editingSensor.id
        ? { ...sensor, ...sensorData }
        : sensor
    );
    onFormDataChange({ sensors: updatedSensors });
  };

  const handleDeleteSensor = (sensorId) => {
    const updatedSensors = sensors.filter(sensor => sensor.id !== sensorId);
    onFormDataChange({ sensors: updatedSensors });
  };

  const handleRefresh = () => {
    console.log('Refresh sensors');
  };

  const handleSettings = () => {
    console.log('Sensor settings');
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.content}>
        <TableContainer component={Paper} className={classes.tableWrapper}>
          <Table className={classes.table} stickyHeader>
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedSensors.length > 0 && selectedSensors.length < sensors.length}
                    checked={sensors.length > 0 && selectedSensors.length === sensors.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <div 
                    className={classes.sortableHeader}
                    onClick={() => handleSort("name")}
                  >
                    Nama
                    <ArrowUpwardIcon className={classes.sortIcon} />
                  </div>
                </TableCell>
                <TableCell>Tipe</TableCell>
                <TableCell>Parameter</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sensors
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((sensor) => (
                  <TableRow key={sensor.id} className={classes.tableRow}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedSensors.includes(sensor.id)}
                        onChange={() => handleSelectSensor(sensor.id)}
                      />
                    </TableCell>
                    <TableCell>{sensor.name}</TableCell>
                    <TableCell>{sensor.type}</TableCell>
                    <TableCell>{sensor.parameter}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        className={`${classes.actionButton} ${classes.editButton}`}
                        onClick={() => handleEditSensor(sensor.id)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        className={`${classes.actionButton} ${classes.deleteButton}`}
                        onClick={() => handleDeleteSensor(sensor.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box className={classes.footer}>
        <Box className={classes.footerLeft}>
          <IconButton
            className={`${classes.footerButton} ${classes.addButton}`}
            onClick={handleAddSensor}
            title="Tambah Sensor"
          >
            <AddIcon />
          </IconButton>
          <IconButton
            className={`${classes.footerButton} ${classes.refreshButton}`}
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            className={`${classes.footerButton} ${classes.settingsButton}`}
            onClick={handleSettings}
            title="Settings"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
        <TablePagination
          component="div"
          count={sensors.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
        />
      </Box>

      <EditSensorDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        sensor={editingSensor}
        onSave={handleSaveSensor}
      />
    </Box>
  );
};

export default SensorsTab;
