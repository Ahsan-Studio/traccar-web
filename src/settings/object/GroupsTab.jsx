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
import EditGroupDialog from "./EditGroupDialog";
import RemoveDialog from "../../common/components/RemoveDialog";
import { groupsActions, devicesActions } from "../../store";
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

const GroupsTab = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  // Convert groups object to array and calculate device count
  const groupList = useMemo(() => {
    const groupsArray = Object.values(groups);
    const devicesArray = Object.values(devices);
    
    // Calculate device count for each group
    return groupsArray.map(group => {
      const deviceCount = devicesArray.filter(device => device.groupId === group.id).length;
      return {
        ...group,
        deviceCount
      };
    });
  }, [groups, devices]);

  const filteredGroups = groupList.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedGroups(filteredGroups.map((group) => group.id));
    } else {
      setSelectedGroups([]);
    }
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingGroup(null);
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setEditDialogOpen(true);
  };

  const handleRefresh = async () => {
    try {
      // Refresh both groups and devices to get accurate device count
      const [groupsResponse, devicesResponse] = await Promise.all([
        fetchOrThrow('/api/groups'),
        fetchOrThrow('/api/devices')
      ]);
      
      const groupsData = await groupsResponse.json();
      const devicesData = await devicesResponse.json();
      
      dispatch(groupsActions.refresh(groupsData));
      dispatch(devicesActions.refresh(devicesData));
    } catch (error) {
      console.error('Failed to refresh groups and devices:', error);
    }
  };

  const handleDuplicateGroup = async (group) => {
    try {
      // Prepare data according to Traccar Groups API structure
      const duplicateGroup = {
        id: 0, // For POST, use 0
        name: `${group.name} (Copy)`,
        groupId: group.groupId || 0,
        attributes: group.attributes || {}
      };
      
      console.log('Duplicating group:', duplicateGroup);
      
      const response = await fetchOrThrow('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateGroup),
      });
      
      const savedGroup = await response.json();
      console.log('Group duplicated successfully:', savedGroup);
      
      // Update Redux store
      dispatch(groupsActions.add(savedGroup));
    } catch (error) {
      console.error('Failed to duplicate group:', error);
    }
  };

  const paginatedGroups = filteredGroups.slice(
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
                        selectedGroups.length > 0 &&
                        selectedGroups.length < filteredGroups.length
                      }
                      checked={
                        filteredGroups.length > 0 &&
                        selectedGroups.length === filteredGroups.length
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
                  <TableCell>Description</TableCell>
                  <TableCell>Objects</TableCell>
                  {/* <TableCell>Created</TableCell> */}
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedGroups.map((group) => (
                  <TableRow key={group.id} className={classes.tableRow}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => handleSelectGroup(group.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.attributes?.description || "-"}</TableCell>
                    <TableCell>{group.deviceCount}</TableCell>
                    <TableCell align="center">
                      <div className={classes.actionButtons}>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => handleEditGroup(group)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => handleDuplicateGroup(group)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          className={classes.actionButton}
                          onClick={() => setRemovingId(group.id)}
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
          <IconButton className={classes.footerButton} onClick={handleAddGroup}>
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
          count={filteredGroups.length}
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
        <EditGroupDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          group={editingGroup}
          onGroupSaved={handleRefresh}
        />
      )}
      <RemoveDialog
        open={!!removingId}
        endpoint="groups"
        itemId={removingId}
        onResult={(removed) => {
          const id = removingId;
          setRemovingId(null);
          if (removed && id != null) {
            dispatch(groupsActions.remove(id));
            setSelectedGroups((prev) => prev.filter((g) => g !== id));
          }
        }}
      />
    </Box>
  );
};

export default GroupsTab;
