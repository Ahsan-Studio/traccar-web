import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useSelector } from "react-redux";
import {
  CustomInput,
  CustomSelect,
  CustomButton,
  CustomCheckbox,
} from "../../common/components/custom";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

// Default: Mon–Fri enabled at 08:00
const DEFAULT_DAY_TIMES = { mon: "08:00", tue: "08:00", wed: "08:00", thu: "08:00", fri: "08:00" };

const DEFAULT_FORM = {
  name: "",
  active: true,
  scheduleType: "recurring",
  exactTime: "",
  recurringDays: DEFAULT_DAY_TIMES,
  gateway: "gprs",
  commandType: "custom",
  commandData: "",
  deviceId: "",
  templateId: "",
};

// Parse V1-style or V2-style recurringDays from string/array/object
function parseRecurringDays(raw) {
  if (!raw) return { ...DEFAULT_DAY_TIMES };
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  let parsed = raw;
  if (typeof raw === "string") {
    try { parsed = JSON.parse(raw); } catch { return { ...DEFAULT_DAY_TIMES }; }
  }
  // Old array format → convert to object with default 08:00
  if (Array.isArray(parsed)) {
    return parsed.reduce((acc, d) => { acc[d] = "08:00"; return acc; }, {});
  }
  return typeof parsed === "object" ? parsed : { ...DEFAULT_DAY_TIMES };
}

const ScheduleFormDialog = ({
  classes,
  open,
  onClose,
  editingSchedule,
  onSaved,
  showNotification,
}) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [userTemplates, setUserTemplates] = useState([]);

  const devices = useSelector((state) => state.devices.items);

  // Fetch saved user command templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/commands", { headers: { Accept: "application/json" } });
        if (res.ok) setUserTemplates(await res.json());
      } catch { setUserTemplates([]); }
    };
    if (open) fetchTemplates();
  }, [open]);

  // Prefill form when editing
  useEffect(() => {
    if (editingSchedule) {
      setForm({
        name: editingSchedule.name || "",
        active: editingSchedule.active !== false,
        scheduleType: editingSchedule.scheduleType || "recurring",
        exactTime: editingSchedule.exactTime
          ? new Date(editingSchedule.exactTime).toISOString().slice(0, 16) : "",
        recurringDays: parseRecurringDays(editingSchedule.recurringDays),
        gateway: editingSchedule.gateway || "gprs",
        commandType: editingSchedule.commandType || "custom",
        commandData: editingSchedule.commandData || "",
        deviceId: editingSchedule.deviceId ? editingSchedule.deviceId.toString() : "",
        templateId: "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editingSchedule, open]);

  // Handle template selection → auto-fill gateway/type/command
  const handleTemplateChange = (templateId) => {
    setForm((prev) => {
      if (!templateId) return { ...prev, templateId: "" };
      const tpl = userTemplates.find((t) => t.id.toString() === templateId);
      if (!tpl) return { ...prev, templateId };
      return {
        ...prev,
        templateId,
        gateway: tpl.textChannel ? "sms" : "gprs",
        commandType: tpl.type || "custom",
        commandData: tpl.attributes?.data || "",
      };
    });
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const days = { ...prev.recurringDays };
      if (days[day] !== undefined) {
        delete days[day];
      } else {
        days[day] = "08:00";
      }
      return { ...prev, recurringDays: days };
    });
  };

  const setDayTime = (day, time) => {
    setForm((prev) => ({
      ...prev,
      recurringDays: { ...prev.recurringDays, [day]: time },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showNotification("Please enter a schedule name", "warning"); return; }
    if (!form.deviceId) { showNotification("Please select an object", "warning"); return; }
    if (form.scheduleType === "exact" && !form.exactTime) { showNotification("Please set the exact date/time", "warning"); return; }
    if (form.scheduleType === "recurring" && Object.keys(form.recurringDays).length === 0) {
      showNotification("Please select at least one day", "warning"); return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        active: form.active,
        scheduleType: form.scheduleType,
        exactTime: form.scheduleType === "exact" ? form.exactTime : null,
        recurringDays: form.scheduleType === "recurring" ? JSON.stringify(form.recurringDays) : null,
        recurringFrom: null,
        recurringTo: null,
        gateway: form.gateway,
        commandType: form.commandType,
        commandData: form.commandData,
        deviceId: parseInt(form.deviceId, 10),
      };

      const url = editingSchedule ? `/api/command-schedules/${editingSchedule.id}` : "/api/command-schedules";
      const method = editingSchedule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(editingSchedule ? "Schedule updated" : "Schedule created", "success");
        onSaved();
      } else {
        showNotification(`Failed: ${(await res.text()) || res.statusText}`, "error");
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const rowStyle = { display: "flex", alignItems: "center", marginBottom: 8 };
  const labelStyle = { fontSize: 11, color: "#444", width: 130, flexShrink: 0 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth onClick={(e) => e.stopPropagation()}>
      <div className={classes.dialogTitle}>
        <Typography variant="h2" style={{ fontSize: "14px", fontWeight: 500 }}>
          {editingSchedule ? "Edit Schedule" : "Add Schedule"}
        </Typography>
        <IconButton onClick={onClose} className={classes.closeButton} size="small">
          <CloseIcon style={{ fontSize: "18px" }} />
        </IconButton>
      </div>

      <DialogContent style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 16 }}>
          {/* Left column: Schedule settings */}
          <div style={{ flex: "0 0 55%" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Schedule</div>

            {/* Name + Active */}
            <div style={rowStyle}>
              <span style={labelStyle}>Active</span>
              <CustomCheckbox
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Name *</span>
              <div style={{ flex: 1 }}>
                <CustomInput fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Schedule name" />
              </div>
            </div>

            {/* Object */}
            <div style={rowStyle}>
              <span style={labelStyle}>Object *</span>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={form.deviceId}
                  onChange={(value) => setForm({ ...form, deviceId: value })}
                  options={[
                    { value: "", label: "Nothing selected" },
                    ...Object.values(devices).map((d) => ({ value: d.id.toString(), label: d.name })),
                  ]}
                />
              </div>
            </div>

            {/* Template */}
            <div style={rowStyle}>
              <span style={labelStyle}>Template</span>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={form.templateId}
                  onChange={handleTemplateChange}
                  options={[
                    { value: "", label: "Custom" },
                    ...userTemplates.map((t) => ({ value: t.id.toString(), label: t.description || t.type })),
                  ]}
                />
              </div>
            </div>

            {/* Gateway */}
            <div style={rowStyle}>
              <span style={labelStyle}>Gateway</span>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={form.gateway}
                  onChange={(value) => setForm({ ...form, gateway: value })}
                  options={[{ value: "gprs", label: "GPRS" }, { value: "sms", label: "SMS" }]}
                />
              </div>
            </div>

            {/* Type */}
            <div style={rowStyle}>
              <span style={labelStyle}>Type</span>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={form.commandType}
                  onChange={(value) => setForm({ ...form, commandType: value })}
                  options={[{ value: "ascii", label: "ASCII" }, { value: "hex", label: "HEX" }]}
                />
              </div>
            </div>

            {/* Command */}
            <div style={rowStyle}>
              <span style={labelStyle}>Command</span>
              <div style={{ flex: 1 }}>
                <CustomInput fullWidth value={form.commandData} onChange={(e) => setForm({ ...form, commandData: e.target.value })} placeholder="Command data" />
              </div>
            </div>
          </div>

          {/* Right column: Time settings */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Time</div>

            {/* Schedule type: Exact or Recurring */}
            <div style={rowStyle}>
              <span style={labelStyle}>Exact Time</span>
              <CustomCheckbox
                checked={form.scheduleType === "exact"}
                onChange={(e) => setForm({ ...form, scheduleType: e.target.checked ? "exact" : "recurring" })}
              />
              {form.scheduleType === "exact" && (
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <CustomInput
                    type="datetime-local"
                    fullWidth
                    value={form.exactTime}
                    onChange={(e) => setForm({ ...form, exactTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Per-day individual times (matching V1 exactly) */}
            {form.scheduleType === "recurring" && DAYS.map((day) => (
              <div key={day} style={{ ...rowStyle, marginBottom: 4 }}>
                <span style={{ ...labelStyle, width: 100 }}>{DAY_LABELS[day]}</span>
                <CustomCheckbox
                  checked={form.recurringDays[day] !== undefined}
                  onChange={() => toggleDay(day)}
                />
                <div style={{ width: 80, marginLeft: 8 }}>
                  <CustomInput
                    type="time"
                    value={form.recurringDays[day] || "08:00"}
                    disabled={form.recurringDays[day] === undefined}
                    onChange={(e) => setDayTime(day, e.target.value)}
                    style={{ opacity: form.recurringDays[day] === undefined ? 0.4 : 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <CustomButton variant="outlined" onClick={onClose} size="small">Cancel</CustomButton>
          <CustomButton variant="contained" onClick={handleSave} disabled={loading} size="small">
            {loading ? "Saving..." : editingSchedule ? "Update" : "Save"}
          </CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFormDialog;
