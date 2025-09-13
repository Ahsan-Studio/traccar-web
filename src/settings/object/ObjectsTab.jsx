import { useState, useMemo } from "react";
import {
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
  Paper,
  TablePagination,
  Chip,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useSelector, useDispatch } from "react-redux";
import EditDeviceDialog from "./EditDeviceDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { devicesActions } from "../../store";

const useStyles = makeStyles()((theme) => ({
  searchContainer: {
    marginBottom: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    width: "100%",
    "& .MuiInputBase-input": {
      width: "100%",
    },
  },
  searchField: {
    width: "100%",
    "& .MuiFormControl-root": {
      width: "100%",
    },
    "& .MuiOutlinedInput-root": {
      height: "32px",
      fontSize: "12px",
      width: "100%",
      "& fieldset": {
        borderColor: "#ddd",
      },
    },
  },
  tableContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    margin: theme.spacing(0, 2),
    flex: 1,
    overflow: "auto",
    maxHeight: "100%",
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
  stcusChip: {
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
  pagination: {
    padding: theme.spacing(1, 2),
    "& .MuiTablePagination-toolbar": {
      fontSize: "11px",
    },
    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
      fontSize: "11px",
    },
  },
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tableWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: "#f5f5f5",
    flexShrink: 0,
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
  sortableHeader: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },
  },
  sortIcon: {
    fontSize: "14px",
    color: "#666",
  },
}));

const ObjectsTab = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);
  const [currentTime] = useState(Date.now());

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
    <Box className={classes.container}>
      <Box className={classes.content}>
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

        <Box className={classes.tableWrapper}>
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table size="small" className={classes.table}>
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
                  <TableCell>
                    <div className={classes.sortableHeader}>
                      Name
                      <ArrowUpwardIcon className={classes.sortIcon} />
                    </div>
                  </TableCell>
                  <TableCell>IMEI</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Expires on</TableCell>
                  <TableCell align="center"></TableCell>
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
                      {device.expirationTime || "2026-05-30"}
                    </TableCell>
                    <TableCell align="center">
                      <div className={classes.actionButtons}>
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
                        >
                          <ContentCopyIcon />
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
        </Box>
      </Box>

      <Box className={classes.footer}>
        <Box className={classes.footerLeft}>
          <IconButton className={classes.footerButton}>
            <AddIcon />
          </IconButton>
          <IconButton className={classes.footerButton}>
            <RefreshIcon />
          </IconButton>
          <IconButton className={classes.footerButton}>
            <SettingsIcon />
          </IconButton>
        </Box>
        <TablePagination
          component="div"
          count={filteredDevices.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage=""
          labelDisplayedRows={({ from, to, count }) =>
            `View ${from}-${to} of ${count}`
          }
          className={classes.pagination}
          sx={{
            "& .MuiTablePagination-toolbar": {
              fontSize: "11px",
              padding: 0,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: "11px",
            },
          }}
        />
      </Box>

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
    </Box>
  );
};

export default ObjectsTab;
