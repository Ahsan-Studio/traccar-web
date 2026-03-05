import {
 useState, useEffect, useCallback, useMemo 
} from "react";
import { useSelector } from "react-redux";
import { formatTime } from "../../common/util/formatter";
import {
  CustomTable,
  CustomInput,
  CustomSelect,
  CustomButton,
} from "../../common/components/custom";
import RemoveDialog from "../../common/components/RemoveDialog";

const GprsTab = ({ classes, showNotification, preselectedDeviceId, textChannel = false }) => {
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedCommand, setSelectedCommand] = useState();
  const [cmdType, setCmdType] = useState("ascii");
  const [commandData, setCommandData] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [removingCommandId, setRemovingCommandId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [hexError, setHexError] = useState(false);

  const devices = useSelector((state) => state.devices.items);

  useEffect(() => {
    if (preselectedDeviceId) setSelectedDevice(preselectedDeviceId.toString());
  }, [preselectedDeviceId]);

  const getDeviceName = (deviceId) => {
    const device = devices[deviceId];
    return device ? device.name : `Device ${deviceId}`;
  };

  const fetchCommandHistory = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/commands/history?deviceId=${selectedDevice}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) setCommandHistory(await res.json());
    } catch (err) {
      console.error("Failed to fetch command history:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  const fetchTemplates = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      const [defaultRes, customRes] = await Promise.all([
        fetch(`/api/commands/types?deviceId=${selectedDevice}&textChannel=${textChannel}`, {
          headers: { Accept: "application/json" },
        }),
        fetch("/api/commands", { headers: { Accept: "application/json" } }),
      ]);

      const combined = [];
      if (defaultRes.ok) {
        const defaults = await defaultRes.json();
        combined.push(
          ...defaults.filter((c) => c.type !== "custom").map((c) => ({
            ...c, category: "Default", description: c.type,
          }))
        );
      }
      if (customRes.ok) {
        const customs = await customRes.json();
        combined.push(...customs.map((c) => ({ ...c, category: "Custom" })));
      }
      setTemplates(combined);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  }, [selectedDevice, textChannel]);

  useEffect(() => {
    fetchCommandHistory();
    fetchTemplates();
  }, [selectedDevice, fetchCommandHistory, fetchTemplates]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const t = templates.find((x) => (x.id ? x.id.toString() : x.type) === templateId);
      if (t) { setCommandData(t.attributes?.data || ""); setSelectedCommand(t); }
    } else {
      setSelectedCommand(null); setCommandData("");
    }
  };

  const handleSendCommand = async () => {
    if (!selectedDevice) { showNotification("Please select a device", "warning"); return; }
    if ((!selectedCommand && !commandData.trim()) || (selectedCommand?.type === "custom" && !commandData.trim())) {
      showNotification("Please enter command data", "warning"); return;
    }
    setLoading(true);
    try {
      const cmd = {
        deviceId: parseInt(selectedDevice, 10),
        type: selectedCommand?.type || "custom",
        textChannel,
        attributes: { data: commandData, noQueue: false },
      };
      const res = await fetch("/api/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      if (res.ok) {
        const deviceName = devices[selectedDevice]?.name || "device";
        showNotification(`Command sent successfully to ${deviceName}`, "success");
        fetchCommandHistory();
      } else {
        const err = await res.text();
        showNotification(`Failed to send command: ${err || res.statusText}`, "error");
      }
    } catch (err) {
      showNotification(`Failed to send command: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommand = (row) => setRemovingCommandId(row.id);
  const handleRemoveResult = (removed) => {
    if (removed) { showNotification("Command history deleted", "success"); fetchCommandHistory(); }
    setRemovingCommandId(null);
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => fetch(`/api/commands/history/${id}`, { method: "DELETE" })));
      showNotification("Selected commands deleted", "success");
      setSelected([]);
      fetchCommandHistory();
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    }
  };

  const isValidHex = (val) => /^[0-9a-fA-F\s]*$/.test(val);
  const handleCommandDataChange = (e) => {
    const val = e.target.value;
    setCommandData(val);
    setHexError(cmdType === "hex" && val.trim() !== "" && !isValidHex(val));
  };

  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === commandHistory.length ? [] : commandHistory.map((r) => r.id)));
  }, [commandHistory]);
  const onToggleRow = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* Filtered rows */
  const filteredHistory = useMemo(() => {
    if (!search) return commandHistory;
    const q = search.toLowerCase();
    return commandHistory.filter((r) =>
      (getDeviceName(r.deviceId) || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q) ||
      (r.attributes?.data || "").toLowerCase().includes(q) ||
      (r.result || "").toLowerCase().includes(q)
    );
  }, [commandHistory, search, devices]);

  /* CustomTable columns */
  const columns = useMemo(() => [
    { key: "sentTime", label: "Time", render: (row) => (row.sentTime ? formatTime(row.sentTime) : "—") },
    { key: "deviceId", label: "Object", render: (row) => getDeviceName(row.deviceId) },
    { key: "type", label: "Name" },
    { key: "data", label: "Command", render: (row) => row.attributes?.data || "—" },
    {
 key: "result", label: "Status", render: (row) => (
      <span style={{ color: "#4caf50" }}>{row.result || "sent"}</span>
    )
},
  ], [devices]);

  const rowStyle = { display: 'flex', alignItems: 'center', marginBottom: 4 };
  const labelStyle = { fontSize: 11, color: '#444', width: '20%', flexShrink: 0 };
  const sendBtnStyle = { height: 22, fontSize: 11, backgroundColor: '#f5f5f5', border: '1px solid #dddddd', color: '#444', width: '100%' };
  const gateway = textChannel ? "SMS" : "GPRS";

  return (
    <div className={classes.tabPanel} style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      {/* ── Command form (V1: Object, Template, Command rows) ── */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Object</span>
          <div style={{ width: '29%' }}>
            <CustomSelect
              value={selectedDevice}
              onChange={setSelectedDevice}
              options={[
                { value: "", label: "Nothing selected" },
                ...Object.values(devices).map((d) => ({ value: d.id.toString(), label: d.name })),
              ]}
              placeholder="Nothing selected"
            />
          </div>
          <div style={{ width: 8 }} />
          <span style={labelStyle}>Template</span>
          <div style={{ flex: 1 }}>
            <CustomSelect
              value={selectedTemplate}
              onChange={handleTemplateChange}
              options={[
                { value: "", label: "Custom" },
                ...templates.filter((t) => t.category === "Default").map((t) => ({ value: t.type, label: t.description })),
                ...templates.filter((t) => t.category === "Custom").map((t) => ({ value: t.id.toString(), label: t.description })),
              ]}
              placeholder="Custom"
            />
          </div>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Command</span>
          <div style={{ width: '26%', minWidth: 70 }}>
            <CustomSelect
              value={cmdType}
              onChange={setCmdType}
              options={[{ value: 'ascii', label: 'ASCII' }, { value: 'hex', label: 'HEX' }]}
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
            {hexError && <div style={{ color: "#f44336", fontSize: 10, marginTop: 2 }}>Invalid HEX input (only 0-9, a-f allowed)</div>}
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

        <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>Gateway: {gateway}</div>
      </div>

      {/* ── Command history via CustomTable ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CustomTable
          rows={filteredHistory}
          columns={columns}
          loading={loading}
          selected={selected}
          onToggleAll={onToggleAll}
          onToggleRow={onToggleRow}
          onDelete={handleDeleteCommand}
          onBulkDelete={handleBulkDelete}
          onRefresh={fetchCommandHistory}
          onAdd={fetchCommandHistory}
          search={search}
          onSearchChange={setSearch}
          onOpenSettings={() => {}}
          hideEdit
        />
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
