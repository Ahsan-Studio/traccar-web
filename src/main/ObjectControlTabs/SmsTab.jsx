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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useSelector } from "react-redux";
import { formatTime } from "../../common/util/formatter";
import {
  CustomInput,
  CustomSelect,
  CustomButton,
} from "../../common/components/custom";
import RemoveDialog from "../../common/components/RemoveDialog";

const SmsTab = ({ classes, showNotification, preselectedDeviceId }) => {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCommand, setSelectedCommand] = useState();
  const [commandData, setCommandData] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [removingCommandId, setRemovingCommandId] = useState(null);

  const devices = useSelector((state) => state.devices.items);

  useEffect(() => {
    if (preselectedDeviceId) {
      setSelectedDevice(preselectedDeviceId.toString());
    }
  }, [preselectedDeviceId]);

  const getDeviceName = (deviceId) => {
    const device = devices[deviceId];
    return device ? device.name : `Device ${deviceId}`;
  };

  const fetchCommandHistory = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/commands/history?deviceId=${selectedDevice}`,
        { headers: { Accept: "application/json" } }
      );
      if (response.ok) setCommandHistory(await response.json());
    } catch (error) {
      console.error("Failed to fetch SMS command history:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  const fetchTemplates = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      const [defaultRes, customRes] = await Promise.all([
        fetch(`/api/commands/types?deviceId=${selectedDevice}&textChannel=true`, { headers: { Accept: "application/json" } }),
        fetch(`/api/commands`, { headers: { Accept: "application/json" } }),
      ]);
      const combined = [];
      if (defaultRes.ok) {
        const defaultCmds = await defaultRes.json();
        combined.push(...defaultCmds.filter((c) => c.type !== "custom").map((c) => ({ ...c, category: "Default", description: c.type })));
      }
      if (customRes.ok) {
        const customCmds = await customRes.json();
        combined.push(...customCmds.map((c) => ({ ...c, category: "Custom" })));
      }
      setTemplates(combined);
    } catch (error) {
      console.error("Failed to fetch SMS templates:", error);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchCommandHistory();
    fetchTemplates();
  }, [selectedDevice, fetchCommandHistory, fetchTemplates]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => (t.id ? t.id.toString() : t.type) === templateId);
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
    if (!selectedDevice) { showNotification("Please select a device", "warning"); return; }
    if (!selectedCommand && commandData.trim() === "") { showNotification("Please enter command data", "warning"); return; }

    setLoading(true);
    try {
      const command = {
        deviceId: parseInt(selectedDevice, 10),
        type: selectedCommand?.type || "custom",
        textChannel: true,
        attributes: { data: commandData, noQueue: false },
      };
      const response = await fetch("/api/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      if (response.ok) {
        showNotification(`SMS command sent to ${devices[selectedDevice]?.name || "device"}`, "success");
        fetchCommandHistory();
      } else {
        showNotification(`Failed: ${await response.text() || response.statusText}`, "error");
      }
    } catch (error) {
      showNotification(`Failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommand = (id) => setRemovingCommandId(id);

  const handleRemoveResult = (removed) => {
    if (removed) { showNotification("Deleted", "success"); fetchCommandHistory(); }
    setRemovingCommandId(null);
  };

  const rowStyle = { display: 'flex', alignItems: 'center', marginBottom: 4 };
  const labelStyle = { fontSize: 11, color: '#444', width: '20%', flexShrink: 0 };
  const sendBtnStyle = { height: 22, fontSize: 11, backgroundColor: '#f5f5f5', border: '1px solid #dddddd', color: '#444', width: '100%' };

  return (
    <div className={classes.tabPanel} style={{ position: "relative", height: "100%" }}>
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
                ...templates.filter((t) => t.category === "Default").map((t) => ({ value: t.type, label: t.description })),
                ...templates.filter((t) => t.category === "Custom").map((t) => ({ value: t.id.toString(), label: t.description })),
              ]}
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Row 2: Command input + Send (no type select for SMS) */}
        <div style={rowStyle}>
          <span style={labelStyle}>Command</span>
          <div style={{ flex: 1 }}>
            <CustomInput
              value={commandData}
              onChange={(e) => setCommandData(e.target.value)}
              placeholder=""
            />
          </div>
          <div style={{ width: 8 }} />
          <div style={{ width: '13%', minWidth: 60 }}>
            <CustomButton
              onClick={handleSendCommand}
              disabled={loading || !selectedDevice}
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
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : commandHistory.length > 0 ? (
                commandHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sentTime ? formatTime(item.sentTime) : "-"}</TableCell>
                    <TableCell>{getDeviceName(item.deviceId)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.attributes?.data || "-"}</TableCell>
                    <TableCell style={{ color: '#4caf50' }}>{item.result || 'sent'}</TableCell>
                    <TableCell>
                      <IconButton size="small" className={classes.iconButton} onClick={() => handleDeleteCommand(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className={classes.emptyState}>
                    No SMS commands sent yet.
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
        style={{ position: "absolute", bottom: 16, left: 16, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "4px" }}
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

export default SmsTab;
