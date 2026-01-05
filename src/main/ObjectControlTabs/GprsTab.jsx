import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
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
  const [commandData, setCommandData] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [removingCommandId, setRemovingCommandId] = useState(null);

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

  return (
    <div
      className={classes.tabPanel}
      style={{ position: "relative", height: "100%" }}
    >
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
            Template
          </Typography>
          <CustomSelect
            value={selectedTemplate}
            onChange={(value) => handleTemplateChange(value)}
            options={[
              { value: "", label: "None" },
              ...templates
                .filter((t) => t.category === "Default")
                .map((template) => ({
                  value: template.type,
                  label: `Default - ${template.description}`,
                })),
              ...templates
                .filter((t) => t.category === "Custom")
                .map((template) => ({
                  value: template.id.toString(),
                  label: `Custom - ${template.description}`,
                })),
            ]}
            placeholder="Select template"
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
            style={{ minWidth: "80px", height: "24px" }}
          >
            Send
          </CustomButton>
        </div>

        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Object</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Command</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Status</TableCell>
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
              ) : commandHistory.length > 0 ? (
                commandHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.sentTime ? formatTime(item.sentTime) : "-"}
                    </TableCell>
                    <TableCell>{getDeviceName(item.deviceId)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.attributes?.data || "-"}</TableCell>
                    <TableCell>
                      {item.result ? (
                        <Typography
                          variant="body2"
                          style={{ fontSize: "11px" }}
                        >
                          {item.result}
                        </Typography>
                      ) : (
                        "-"
                      )}
                    </TableCell>
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
                  <TableCell colSpan={9} className={classes.emptyState}>
                    No commands sent yet. Select a device and send a command.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <IconButton
        onClick={fetchCommandHistory}
        disabled={loading || !selectedDevice}
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "4px",
          zIndex: 10,
        }}
        size="small"
      >
        <RefreshIcon />
      </IconButton>

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
