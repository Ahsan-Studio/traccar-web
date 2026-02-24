import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Box,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useSelector } from "react-redux";
import { CustomButton, CustomCheckbox } from "../../common/components/custom";
import ScheduleFormDialog from "./ScheduleFormDialog";

const ScheduleTab = ({ classes, showNotification }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const devices = useSelector((state) => state.devices.items);

  const getDeviceName = (deviceId) => {
    const d = devices[deviceId];
    return d ? d.name : `Device ${deviceId}`;
  };

  const formatSchedule = (s) => {
    if (s.scheduleType === "exact") {
      return s.exactTime ? new Date(s.exactTime).toLocaleString() : "Exact";
    }
    let days = [];
    try {
      days = typeof s.recurringDays === "string"
        ? JSON.parse(s.recurringDays)
        : (s.recurringDays || []);
    } catch {
      days = [];
    }
    const dayStr = days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
    const timeStr =
      s.recurringFrom && s.recurringTo
        ? ` ${s.recurringFrom}–${s.recurringTo}`
        : "";
    return `Recurring: ${dayStr}${timeStr}`;
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/command-schedules", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSchedules(await res.json());
      } else {
        showNotification("Failed to load schedules", "error");
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleAdd = () => {
    setEditingSchedule(null);
    setDialogOpen(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`/api/command-schedules/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Schedule deleted", "success");
        fetchSchedules();
      } else {
        showNotification("Failed to delete", "error");
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected schedule(s)?`)) return;
    try {
      await Promise.all(
        selectedRows.map((id) =>
          fetch(`/api/command-schedules/${id}`, { method: "DELETE" })
        )
      );
      showNotification("Selected schedules deleted", "success");
      setSelectedRows([]);
      fetchSchedules();
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    fetchSchedules();
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = (checked) => {
    setSelectedRows(checked ? schedules.map((s) => s.id) : []);
  };

  return (
    <div className={classes.tabPanel} style={{ position: "relative", height: "100%" }}>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" style={{ width: 32 }}>
                <CustomCheckbox
                  checked={schedules.length > 0 && selectedRows.length === schedules.length}
                  indeterminate={
                    selectedRows.length > 0 && selectedRows.length < schedules.length
                  }
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Object</TableCell>
              <TableCell>Gateway</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Command</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : schedules.length > 0 ? (
              schedules.map((s) => (
                <TableRow key={s.id} selected={selectedRows.includes(s.id)} hover>
                  <TableCell padding="checkbox">
                    <CustomCheckbox
                      checked={selectedRows.includes(s.id)}
                      onChange={() => toggleRow(s.id)}
                    />
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: s.active ? "#4caf50" : "#f44336",
                      }}
                    />
                  </TableCell>
                  <TableCell>{formatSchedule(s)}</TableCell>
                  <TableCell>{getDeviceName(s.deviceId)}</TableCell>
                  <TableCell style={{ textTransform: "uppercase" }}>{s.gateway}</TableCell>
                  <TableCell>{s.commandType}</TableCell>
                  <TableCell>{s.commandData || "-"}</TableCell>
                  <TableCell>
                    <div className={classes.actionButtons}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          className={classes.iconButton}
                          onClick={() => handleEdit(s)}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          className={classes.iconButton}
                          onClick={() => handleDelete(s.id)}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className={classes.emptyState}>
                  No scheduled commands
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" gap={1}>
        <CustomButton
          variant="contained"
          color="primary"
          icon={<AddIcon />}
          iconPosition="left"
          size="small"
          onClick={handleAdd}
        >
          Add Schedule
        </CustomButton>
        {selectedRows.length > 0 && (
          <CustomButton
            variant="outlined"
            size="small"
            icon={<DeleteIcon />}
            iconPosition="left"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedRows.length})
          </CustomButton>
        )}
      </Box>

      <Tooltip title="Refresh">
        <IconButton
          onClick={fetchSchedules}
          disabled={loading}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
          size="small"
        >
          <RefreshIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <ScheduleFormDialog
        classes={classes}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingSchedule={editingSchedule}
        onSaved={handleSaved}
        showNotification={showNotification}
      />
    </div>
  );
};

export default ScheduleTab;
