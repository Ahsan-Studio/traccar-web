import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Paper,
  TablePagination,
  Chip,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSelector, useDispatch } from "react-redux";
import EditDeviceDialog from "./EditDeviceDialog";
import RemoveDialog from "../common/components/RemoveDialog";
import { devicesActions } from "../store";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "800px",
      maxWidth: "90vw",
      height: "600px",
      maxHeight: "90vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "& .MuiTypography-root": {
      fontSize: "14px",
      fontWeight: 500,
    },
  },
  closeButton: {
    color: "white",
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "36px",
    "& .MuiTab-root": {
      minHeight: "36px",
      textTransform: "none",
      fontSize: "12px",
      fontWeight: "normal",
      padding: "6px 12px",
      color: "#666",
      "&.Mui-selected": {
        color: "#4a90e2",
      },
    },
    "& .MuiTabs-indicator": {
      backgroundColor: "#4a90e2",
    },
  },
  tabPanel: {
    padding: theme.spacing(2),
    height: "calc(100% - 36px)",
    overflow: "auto",
  },
  searchContainer: {
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      height: "32px",
      fontSize: "12px",
      "& fieldset": {
        borderColor: "#ddd",
      },
    },
  },
  tableContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-root": {
      fontSize: "12px",
      fontWeight: 600,
      padding: "8px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
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
  statusChip: {
    height: "20px",
    fontSize: "10px",
    "&.online": {
      backgroundColor: "#4caf50",
      color: "white",
    },
    "&.offline": {
      backgroundColor: "#f44336",
      color: "white",
    },
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  actionButton: {
    padding: "2px",
    "& .MuiSvgIcon-root": {
      fontSize: "14px",
    },
  },
  infoText: {
    fontSize: "11px",
    color: "#666",
    marginBottom: theme.spacing(2),
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
  </div>
);

const SettingsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  console.log("editingDevice", editingDevice);

  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const [currentTime, setCurrentTime] = useState(Date.now());

  console.log("devices", devices);

  // Update current time every minute for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Convert devices object to array and add status information
  const deviceList = useMemo(() => {
    return Object.values(devices).map((device) => {
      return {
        ...device,
        status: device.status === "online" ? "online" : "offline",
      };
    });
  }, [devices, positions, currentTime]);

  const filteredDevices = deviceList.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedDevices(filteredDevices.map((device) => device.id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingDevice(null);
  };

  const paginatedDevices = filteredDevices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Settings</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0, height: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Objek" />
          <Tab label="Kegiatan" />
          <Tab label="Template" />
          <Tab label="SMS" />
          <Tab label="Antarmuka pengg." />
          <Tab label="Akun saya" />
          <Tab label="Sub akun" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Box className={classes.searchContainer}>
            <TextField
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={classes.searchField}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table size="small">
              <TableHead className={classes.tableHeader}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedDevices.length > 0 &&
                        selectedDevices.length < filteredDevices.length
                      }
                      checked={
                        filteredDevices.length > 0 &&
                        selectedDevices.length === filteredDevices.length
                      }
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>IMEI</TableCell>
                  <TableCell>Aktif</TableCell>
                  <TableCell>Kadaluarsa pada</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDevices.map((device) => (
                  <TableRow key={device.id} className={classes.tableRow}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => handleSelectDevice(device.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{device.name}</TableCell>
                    <TableCell>{device.uniqueId}</TableCell>
                    <TableCell>
                      <Chip
                        label={device.status === "online" ? "✓" : "✗"}
                        className={`${classes.statusChip} ${device.status}`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {device.expirationTime || "No expiration"}
                    </TableCell>
                    <TableCell align="center">
                      <div className={classes.actionButtons}>
                        {/* <IconButton
                          size="small"
                          className={classes.actionButton}
                        >
                          <VisibilityIcon />
                        </IconButton> */}
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => handleEditDevice(device)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => setRemovingId(device.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredDevices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Tampilkan"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} dari ${count}`
            }
            sx={{
              "& .MuiTablePagination-toolbar": {
                fontSize: "11px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: "11px",
                },
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Kegiatan content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Template content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            SMS content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Antarmuka pengg. content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={5} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Akun saya content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={6} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Sub akun content will be implemented here
          </Typography>
        </TabPanel>
      </DialogContent>

      {editDialogOpen && (
        <EditDeviceDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          device={editingDevice}
        />
      )}
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
    </Dialog>
  );
};

export default SettingsDialog;
