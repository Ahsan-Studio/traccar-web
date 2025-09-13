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
import EditDriverDialog from "./EditDriverDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { driversActions } from "../../store";
import fetchOrThrow from "../../common/util/fetchOrThrow";

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

const DriversTab = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const drivers = useSelector((state) => state.drivers.items);

  // Convert drivers object to array
  const driverList = useMemo(() => {
    return Object.values(drivers);
  }, [drivers]);

  const filteredDrivers = driverList.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedDrivers(filteredDrivers.map((driver) => driver.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleSelectDriver = (driverId) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingDriver(null);
  };

  const handleAddDriver = () => {
    setEditingDriver(null);
    setEditDialogOpen(true);
  };

  const handleRefresh = async () => {
    try {
      const response = await fetchOrThrow('/api/drivers');
      const driversData = await response.json();
      dispatch(driversActions.refresh(driversData));
    } catch (error) {
      console.error('Failed to refresh drivers:', error);
    }
  };

  const handleDuplicateDriver = async (driver) => {
    try {
      const duplicateDriver = {
        ...driver,
        name: `${driver.name} (Copy)`,
        id: undefined,
      };
      delete duplicateDriver.id;
      
      const response = await fetchOrThrow('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateDriver),
      });
      
      if (response.ok) {
        handleRefresh();
      }
    } catch (error) {
      console.error('Failed to duplicate driver:', error);
    }
  };

  const paginatedDrivers = filteredDrivers.slice(
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
                        selectedDrivers.length > 0 &&
                        selectedDrivers.length < filteredDrivers.length
                      }
                      checked={
                        filteredDrivers.length > 0 &&
                        selectedDrivers.length === filteredDrivers.length
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
                  <TableCell>License Number</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDrivers.map((driver) => (
                  <TableRow key={driver.id} className={classes.tableRow}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedDrivers.includes(driver.id)}
                        onChange={() => handleSelectDriver(driver.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>{driver.licenseNumber || "-"}</TableCell>
                    <TableCell>{driver.phone || "-"}</TableCell>
                    <TableCell>{driver.email || "-"}</TableCell>
                    <TableCell>
                      {driver.creationTime ? new Date(driver.creationTime).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <div className={classes.actionButtons}>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => handleEditDriver(driver)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => handleDuplicateDriver(driver)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => setRemovingId(driver.id)}
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
          <IconButton className={classes.footerButton} onClick={handleAddDriver}>
            <AddIcon />
          </IconButton>
          <IconButton className={classes.footerButton} onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
          <IconButton className={classes.footerButton}>
            <SettingsIcon />
          </IconButton>
        </Box>
        <TablePagination
          component="div"
          count={filteredDrivers.length}
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
    </Box>
  );
};

export default DriversTab;
