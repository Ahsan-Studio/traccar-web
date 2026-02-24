import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSelector } from "react-redux";
import { formatTime } from "../../common/util/formatter";
import {
  CustomInput,
  CustomSelect,
  CustomButton,
} from "../../common/components/custom";
import RemoveDialog from "../../common/components/RemoveDialog";

const GprsTab = ({ classes, showNotification, preselectedDeviceId }) => {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCommand, setSelectedCommand] = useState();
  const [cmdType, setCmdType] = useState("ascii");
  const [commandData, setCommandData] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [removingCommandId, setRemovingCommandId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [hexError, setHexError] = useState(false);

  const devices = useSelector((state) => state.devices.items);

  // Set preselected device when provided
  useEffect(() => {
    if (preselectedDeviceId) {
      setSelectedDevice(preselectedDeviceId.toString());
    }
  }, [preselectedDeviceId]);

  const getDeviceName = (deviceId) => {
    const device = devices[deviceId];
    return device ? device.name : `Device ${deviceId}`;
  };

  // Fetch command history
  const fetchCommandHistory = useCallback(async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/commands/history?deviceId=${selectedDevice}`,
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

  // Fetch templates from both endpoints
  const fetchTemplates = useCallback(async () => {
    if (!selectedDevice) return;

    try {
      // Fetch default command types
      const defaultResponse = await fetch(
        `/api/commands/types?deviceId=${selectedDevice}&textChannel=false`,
        {
          headers: { Accept: "application/json" },
        }
      );

      // Fetch custom saved commands
      const customResponse = await fetch(`/api/commands`, {
        headers: { Accept: "application/json" },
      });

      const combinedTemplates = [];

      if (defaultResponse.ok) {
        const defaultCommands = await defaultResponse.json();
        // Filter out 'custom' type from default commands
        const filteredDefaults = defaultCommands.filter(
          (cmd) => cmd.type !== "custom"
        );
        combinedTemplates.push(
          ...filteredDefaults.map((cmd) => ({
            ...cmd,
            category: "Default",
            description: cmd.type,
          }))
        );
      }

      if (customResponse.ok) {
        const customCommands = await customResponse.json();
        combinedTemplates.push(
          ...customCommands.map((cmd) => ({
            ...cmd,
            category: "Custom",
          }))
        );
      }

      setTemplates(combinedTemplates);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchCommandHistory();
    fetchTemplates();
  }, [selectedDevice, fetchCommandHistory, fetchTemplates]);

  // Handle template selection
  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(
        (t) => (t.id ? t.id.toString() : t.type) === templateId
      );
      if (template) {
        setCommandData(template.attributes?.data || "");
        setSelectedCommand(template);
      }
    } else {
      setSelectedCommand(null);
      setCommandData("");
    }
  };

  const handleSendCommand = async () => {
    if (!selectedDevice || selectedDevice === "") {
      showNotification("Please select a device", "warning");
      return;
    }

    if (
      (!selectedCommand && commandData.trim() === "") ||
      (selectedCommand?.type === "custom" && commandData.trim() === "")
    ) {
      showNotification("Please enter command data", "warning");
      return;
    }

    setLoading(true);
    try {
      const command = {
        deviceId: parseInt(selectedDevice, 10),
        type: selectedCommand?.type || "custom",
        textChannel: false,
        attributes: {
          data: commandData,
          noQueue: false,
        },
      };

      const response = await fetch("/api/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (response.ok) {
        await response.json();
        const deviceName = devices[selectedDevice]?.name || "device";
        const resultMessage = `Command sent successfully to ${deviceName}`;
        showNotification(resultMessage, "success");
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

  const handleDeleteCommand = (id) => {
    setRemovingCommandId(id);
  };

  const handleRemoveResult = (removed) => {
    if (removed) {
      showNotification("Command history deleted successfully", "success");
      fetchCommandHistory();
    }
    setRemovingCommandId(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected history item(s)?`)) return;
    try {
      await Promise.all(
        selectedRows.map((id) =>
          fetch(`/api/commands/history/${id}`, { method: "DELETE" })
        )
      );
      showNotification("Selected commands deleted", "success");
      setSelectedRows([]);
      fetchCommandHistory();
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    }
  };

  const isValidHex = (val) => /^[0-9a-fA-F\s]*$/.test(val);

  const handleCommandDataChange = (e) => {
    const val = e.target.value;
    setCommandData(val);
    if (cmdType === "hex") {
      setHexError(val.trim() !== "" && !isValidHex(val));
    } else {
      setHexError(false);
    }
  };

  const rowStyle = { display: 'flex', alignItems: 'center', marginBottom: 4 };
  const labelStyle = { fontSize: 11, color: '#444', width: '20%', flexShrink: 0 };
  const sendBtnStyle = { height: 22, fontSize: 11, backgroundColor: '#f5f5f5', border: '1px solid #dddddd', color: '#444', width: '100%' };

  return (
    <div
      className={classes.tabPanel}
      style={{ position: "relative", height: "100%" }}
    >
      <div className={classes.gprsPanel}>
        {/* Row 1: Object + Template */}
        <div style={rowStyle}>
          <span style={labelStyle}>Object</span>
          <div style={{ width: '29%' }}>
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
            />
          </div>
          <div style={{ width: 8 }} />
          <span style={labelStyle}>Template</span>
          <div style={{ flex: 1 }}>
            <CustomSelect
              value={selectedTemplate}
              onChange={(value) => handleTemplateChange(value)}
              options={[
                { value: "", label: "Custom" },
                ...templates
                  .filter((t) => t.category === "Default")
                  .map((template) => ({
                    value: template.type,
                    label: template.description,
                  })),
                ...templates
                  .filter((t) => t.category === "Custom")
                  .map((template) => ({
                    value: template.id.toString(),
                    label: template.description,
                  })),
              ]}
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Row 2: Command type + input + Send */}
        <div style={rowStyle}>
          <span style={labelStyle}>Command</span>
          <div style={{ width: '26%', minWidth: 70 }}>
            <CustomSelect
              value={cmdType}
              onChange={(v) => setCmdType(v)}
              options={[
                { value: 'ascii', label: 'ASCII' },
                { value: 'hex', label: 'HEX' },
              ]}
            />
          </div>
          <div style={{ width: 8 }} />
          <div style={{ flex: 1 }}>
            <CustomInput
              value={commandData}
              onChange={handleCommandDataChange}
              placeholder=""
              style={hexError ? { border: "1px solid #f44336", borderRadius: 3 } : {}}
            />
            {hexError && (
              <div style={{ color: "#f44336", fontSize: 10, marginTop: 2 }}>
                Invalid HEX input (only 0-9, a-f allowed)
              </div>
            )}
          </div>
          <div style={{ width: 8 }} />
          <div style={{ width: '13%', minWidth: 60 }}>
            <CustomButton
              onClick={handleSendCommand}
              disabled={loading || !selectedDevice || hexError}
              style={sendBtnStyle}
            >
              Send
            </CustomButton>
          </div>
        </div>

        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" style={{ width: 32 }}>
                  <Checkbox
                    size="small"
                    indeterminate={selectedRows.length > 0 && selectedRows.length < commandHistory.length}
                    checked={commandHistory.length > 0 && selectedRows.length === commandHistory.length}
                    onChange={(e) => setSelectedRows(e.target.checked ? commandHistory.map((r) => r.id) : [])}
                    sx={{ padding: '2px' }}
                  />
                </TableCell>
                <TableCell style={{ width: 32 }} />
                <TableCell>
                  <TableSortLabel active direction="desc">
                    Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Object</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Command</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : commandHistory.length > 0 ? (
                commandHistory.map((item) => (
                  <TableRow
                    key={item.id}
                    selected={selectedRows.includes(item.id)}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedRows.includes(item.id)}
                        onChange={(e) => setSelectedRows((prev) =>
                          e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                        )}
                        sx={{ padding: '2px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        className={classes.iconButton}
                        onClick={() => handleDeleteCommand(item.id)}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </TableCell>
                    <TableCell>{item.sentTime ? formatTime(item.sentTime) : "-"}</TableCell>
                    <TableCell>{getDeviceName(item.deviceId)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.attributes?.data || "-"}</TableCell>
                    <TableCell style={{ color: '#4caf50' }}>{item.result || 'sent'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className={classes.emptyState}>
                    No commands sent yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {selectedRows.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          <Tooltip title={`Delete ${selectedRows.length} selected`}>
            <IconButton
              size="small"
              onClick={handleDeleteSelected}
              style={{ backgroundColor: '#fff3f3', border: '1px solid #f44336', borderRadius: '4px', marginBottom: 4 }}
            >
              <DeleteIcon sx={{ fontSize: 14, color: '#f44336' }} />
            </IconButton>
          </Tooltip>
          <span style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>{selectedRows.length} selected</span>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 4, zIndex: 10 }}>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchCommandHistory}
            disabled={loading || !selectedDevice}
            style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
            size="small"
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton
            style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}
            size="small"
          >
            <SettingsIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </div>

      <RemoveDialog
        open={!!removingCommandId}
        endpoint="commands/history"
        itemId={removingCommandId}
        onResult={handleRemoveResult}
      />
    </div>
  );
};

export default GprsTab;
