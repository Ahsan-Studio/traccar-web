import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
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
  IconButton,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { makeStyles } from "tss-react/mui";
import { useSelector } from "react-redux";
import { formatTime } from "../common/util/formatter";
import { snackBarDurationLongMs } from "../common/util/duration";
import {
  CustomInput,
  CustomSelect,
  CustomButton,
  CustomCheckbox,
} from "../common/components/custom";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "1200px",
      maxWidth: "90vw",
      height: "600px",
      maxHeight: "80vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "3px 14px !important",
    fontSize: "14px !important",
    fontWeight: 500,
    lineHeight: "30px !important",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    color: "white",
    padding: "4px",
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "36px",
    "& .MuiTab-root": {
      minHeight: "36px",
      textTransform: "none",
      fontSize: "13px",
      fontWeight: "normal",
      padding: "6px 16px",
    },
  },
  content: {
    padding: 0,
    height: "calc(100% - 100px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tabPanel: {
    flex: 1,
    overflow: "auto",
    padding: theme.spacing(2),
  },
  gprsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  commandRow: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
  },
  selectField: {
    minWidth: "200px",
    fontSize: "11px",
  },
  sendButton: {
    textTransform: "none",
    backgroundColor: "#4caf50",
    color: "white",
    "&:hover": {
      backgroundColor: "#45a049",
    },
  },
  table: {
    "& .MuiTableCell-head": {
      backgroundColor: "#f5f5f5",
      fontWeight: 500,
      fontSize: "11px",
      padding: "8px",
      color: "#333",
      borderBottom: "1px solid #ddd",
    },
    "& .MuiTableCell-body": {
      fontSize: "11px",
      padding: "6px 8px",
      color: "#333",
      borderBottom: "1px solid #ddd",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#fafafa",
    },
  },
  statusSuccess: {
    color: "#4caf50",
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(0.5),
  },
  iconButton: {
    padding: "4px",
  },
  templateField: {
    flex: 1,
  },
  addButton: {
    textTransform: "none",
    fontSize: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const ObjectControlDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // GPRS tab state
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("ASCII");
  const [commandData, setCommandData] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);

  // Templates tab state
  const [templates, setTemplates] = useState([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    description: "",
    type: "custom",
    textChannel: false,
    data: "",
  });

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const devices = useSelector((state) => state.devices.items);

  // Show notification helper
  const showNotification = useCallback((message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // Fetch command history for GPRS tab
  const fetchCommandHistory = useCallback(async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/commands/queue?deviceId=${selectedDevice}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCommandHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch command history:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  // Fetch saved templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/commands", {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && currentTab === 0) {
      fetchCommandHistory();
    }
  }, [open, currentTab, selectedDevice, fetchCommandHistory]);

  useEffect(() => {
    if (open && currentTab === 2) {
      fetchTemplates();
    }
  }, [open, currentTab, fetchTemplates]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSendCommand = async () => {
    if (!selectedDevice || selectedDevice === "") {
      showNotification("Please select a device", "warning");
      return;
    }

    setLoading(true);
    try {
      const command = {
        deviceId: parseInt(selectedDevice, 10),
        type: "custom",
        textChannel: selectedCommand !== "GPRS",
        attributes: {
          data: commandData,
        },
      };

      const response = await fetch("/api/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (response.ok) {
        await response.json(); // Parse response to consume it
        const deviceName = devices[selectedDevice]?.name || "device";
        const resultMessage = `Command sent successfully to ${deviceName}`;
        showNotification(resultMessage, "success");
        setCommandData("");
        fetchCommandHistory();
      } else {
        const errorText = await response.text();
        showNotification(
          `Failed to send command: ${errorText || response.statusText}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to send command:", error);
      showNotification(`Failed to send command: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommand = async (id) => {
    if (!window.confirm("Are you sure you want to delete this command?")) {
      return;
    }

    try {
      const response = await fetch(`/api/commands/queue/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("Command deleted successfully", "success");
        fetchCommandHistory();
      } else {
        const errorText = await response.text();
        showNotification(
          `Failed to delete command: ${errorText || response.statusText}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to delete command:", error);
      showNotification(`Failed to delete command: ${error.message}`, "error");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/commands/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("Template deleted successfully", "success");
        fetchTemplates();
      } else {
        const errorText = await response.text();
        showNotification(
          `Failed to delete template: ${errorText || response.statusText}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
      showNotification(`Failed to delete template: ${error.message}`, "error");
    }
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      description: "",
      type: "custom",
      textChannel: false,
      data: "",
    });
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      description: template.description || "",
      type: template.type || "custom",
      textChannel: template.textChannel || false,
      data: template.attributes?.data || "",
    });
    setTemplateDialogOpen(true);
  };

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({
      description: "",
      type: "custom",
      textChannel: false,
      data: "",
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.description.trim()) {
      showNotification("Please enter a template name", "warning");
      return;
    }

    if (!templateForm.data.trim()) {
      showNotification("Please enter command data", "warning");
      return;
    }

    setLoading(true);
    try {
      const command = {
        description: templateForm.description,
        type: templateForm.type,
        textChannel: templateForm.textChannel,
        attributes: {
          data: templateForm.data,
        },
      };

      // Include ID when updating
      if (editingTemplate) {
        command.id = editingTemplate.id;
      }

      const method = editingTemplate ? "PUT" : "POST";
      const url = editingTemplate
        ? `/api/commands/${editingTemplate.id}`
        : "/api/commands";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (response.ok) {
        showNotification(
          editingTemplate
            ? "Template updated successfully"
            : "Template created successfully",
          "success"
        );
        handleCloseTemplateDialog();
        fetchTemplates();
      } else {
        const errorText = await response.text();
        showNotification(
          `Failed to ${editingTemplate ? "update" : "create"} template: ${
            errorText || response.statusText
          }`,
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      showNotification(`Failed to save template: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceName = (deviceId) => {
    const device = devices[deviceId];
    return device ? device.name : `Device ${deviceId}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      className={classes.dialog}
    >
      <div className={classes.dialogTitle}>
        <Typography variant="h2" style={{ fontSize: "14px", fontWeight: 500 }}>
          Object control
        </Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon style={{ fontSize: "18px" }} />
        </IconButton>
      </div>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        className={classes.tabs}
      >
        <Tab label="GPRS" />
        <Tab label="Schedule" />
        <Tab label="Templates" />
      </Tabs>

      <DialogContent className={classes.content}>
        {/* GPRS Tab */}
        {currentTab === 0 && (
          <div className={classes.tabPanel}>
            <div className={classes.gprsPanel}>
              <div className={classes.commandRow}>
                <Typography
                  variant="body2"
                  style={{ fontSize: "11px", minWidth: "60px" }}
                >
                  Object
                </Typography>
                <CustomSelect
                  value={selectedDevice}
                  onChange={(value) => setSelectedDevice(value)}
                  options={[
                    { value: "", label: "Nothing selected" },
                    ...Object.values(devices).map((device) => ({
                      value: device.id.toString(),
                      label: device.name,
                    })),
                  ]}
                  placeholder="Nothing selected"
                  className={classes.selectField}
                />

                <Typography
                  variant="body2"
                  style={{ fontSize: "11px", minWidth: "80px" }}
                >
                  Command
                </Typography>
                <CustomSelect
                  value={selectedCommand}
                  onChange={(value) => setSelectedCommand(value)}
                  options={[
                    { value: "ASCII", label: "ASCII" },
                    { value: "HEX", label: "HEX" },
                    { value: "GPRS", label: "GPRS" },
                  ]}
                  className={classes.selectField}
                />

                <CustomInput
                  value={commandData}
                  onChange={(e) => setCommandData(e.target.value)}
                  placeholder="Enter command data"
                  style={{ flex: 1 }}
                />

                <CustomButton
                  variant="contained"
                  color="success"
                  onClick={handleSendCommand}
                  disabled={loading || !selectedDevice}
                  style={{ minWidth: "80px" }}
                >
                  Send
                </CustomButton>
              </div>

              <TableContainer>
                <Table className={classes.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <CustomCheckbox />
                      </TableCell>
                      <TableCell />
                      <TableCell>Time</TableCell>
                      <TableCell>Object</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Command</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : commandHistory.length > 0 ? (
                      commandHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <CustomCheckbox />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">+</IconButton>
                          </TableCell>
                          <TableCell>
                            {item.serverTime
                              ? formatTime(item.serverTime)
                              : "-"}
                          </TableCell>
                          <TableCell>{getDeviceName(item.deviceId)}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.attributes?.data || "-"}</TableCell>
                          <TableCell>
                            <CheckIcon
                              className={classes.statusSuccess}
                              fontSize="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              className={classes.iconButton}
                              onClick={() => handleDeleteCommand(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className={classes.emptyState}>
                          No commands sent yet. Select a device and send a
                          command.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {currentTab === 1 && (
          <div className={classes.tabPanel}>
            <TableContainer>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <CustomCheckbox />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Gateway</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Command</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className={classes.emptyState}>
                      No scheduled commands
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2}>
              <CustomButton
                variant="contained"
                color="primary"
                icon={<AddIcon />}
                iconPosition="left"
                size="small"
              >
                Add Schedule
              </CustomButton>
            </Box>
          </div>
        )}

        {/* Templates Tab */}
        {currentTab === 2 && (
          <div className={classes.tabPanel}>
            <TableContainer>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <CustomCheckbox />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Gateway</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Command</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : templates.length > 0 ? (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <CustomCheckbox />
                        </TableCell>
                        <TableCell>{template.description}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          {template.textChannel ? "SMS" : "GPRS"}
                        </TableCell>
                        <TableCell>{template.type}</TableCell>
                        <TableCell>
                          {template.attributes?.data || "-"}
                        </TableCell>
                        <TableCell>
                          <div className={classes.actionButtons}>
                            <IconButton
                              size="small"
                              className={classes.iconButton}
                              onClick={() => handleEditTemplate(template)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              className={classes.iconButton}
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className={classes.emptyState}>
                        No templates available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2}>
              <CustomButton
                variant="contained"
                color="primary"
                icon={<AddIcon />}
                iconPosition="left"
                size="small"
                onClick={handleAddTemplate}
              >
                Add Template
              </CustomButton>
            </Box>
          </div>
        )}
      </DialogContent>

      {/* Template Form Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={handleCloseTemplateDialog}
        maxWidth="sm"
        fullWidth
      >
        <div className={classes.dialogTitle}>
          <Typography
            variant="h2"
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            {editingTemplate ? "Edit Template" : "Add Template"}
          </Typography>
          <IconButton
            onClick={handleCloseTemplateDialog}
            className={classes.closeButton}
            size="small"
          >
            <CloseIcon style={{ fontSize: "18px" }} />
          </IconButton>
        </div>

        <DialogContent style={{ padding: "20px" }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography
                variant="body2"
                style={{ fontSize: "11px", marginBottom: "6px", color: "#333" }}
              >
                Template Name *
              </Typography>
              <CustomInput
                fullWidth
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter template name"
              />
            </Box>

            <Box>
              <Typography
                variant="body2"
                style={{ fontSize: "11px", marginBottom: "6px", color: "#333" }}
              >
                Type
              </Typography>
              <CustomSelect
                fullWidth
                value={templateForm.type}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, type: e.target.value })
                }
              >
                <option value="custom">Custom</option>
                <option value="positionSingle">Position Single</option>
                <option value="positionPeriodic">Position Periodic</option>
                <option value="positionStop">Position Stop</option>
                <option value="engineStop">Engine Stop</option>
                <option value="engineResume">Engine Resume</option>
                <option value="alarmArm">Alarm Arm</option>
                <option value="alarmDisarm">Alarm Disarm</option>
              </CustomSelect>
            </Box>

            <Box>
              <Typography
                variant="body2"
                style={{ fontSize: "11px", marginBottom: "6px", color: "#333" }}
              >
                Gateway
              </Typography>
              <CustomSelect
                fullWidth
                value={templateForm.textChannel ? "SMS" : "GPRS"}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    textChannel: e.target.value === "SMS",
                  })
                }
              >
                <option value="GPRS">GPRS</option>
                <option value="SMS">SMS</option>
              </CustomSelect>
            </Box>

            <Box>
              <Typography
                variant="body2"
                style={{ fontSize: "11px", marginBottom: "6px", color: "#333" }}
              >
                Command Data *
              </Typography>
              <CustomInput
                fullWidth
                multiline
                rows={4}
                value={templateForm.data}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, data: e.target.value })
                }
                placeholder="Enter command data"
              />
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <CustomButton
                variant="outlined"
                onClick={handleCloseTemplateDialog}
                size="small"
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="contained"
                color="primary"
                onClick={handleSaveTemplate}
                size="small"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={16} />
                ) : editingTemplate ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </CustomButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackBarDurationLongMs}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ObjectControlDialog;
