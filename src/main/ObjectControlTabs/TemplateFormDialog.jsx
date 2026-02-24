import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
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

// Common GPS tracker protocols (Traccar protocol names)
const ALL_PROTOCOLS = [
  "teltonika", "gt06", "h02", "ruptela", "meitrack", "concox",
  "queclink", "suntech", "eelink", "jt600", "huabao", "osmand",
  "sinotrackplus", "totem", "cantrack", "appello", "gps103",
  "topflytech", "jimi", "fifotrack", "starcom", "milesmate",
  "xexun", "watch", "mobile", "wialon",
];

const TemplateFormDialog = ({
  classes,
  open,
  onClose,
  editingTemplate,
  templateForm,
  setTemplateForm,
  loading,
  onSave,
}) => {
  const [hideUnused, setHideUnused] = useState(false);
  const [deviceProtocols, setDeviceProtocols] = useState([]);

  const devices = useSelector((state) => state.devices.items);

  // Collect unique protocols from user's devices
  useEffect(() => {
    if (!open) return;
    const protos = new Set();
    Object.values(devices).forEach((d) => {
      if (d.protocol) protos.add(d.protocol.toLowerCase());
    });
    setDeviceProtocols([...protos].sort());
  }, [open, devices]);

  const protocolOptions = hideUnused && deviceProtocols.length > 0
    ? deviceProtocols
    : ALL_PROTOCOLS;

  const rowStyle = { display: "flex", alignItems: "center", marginBottom: 10 };
  const labelStyle = { fontSize: 11, color: "#444", width: 110, flexShrink: 0 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth onClick={(e) => e.stopPropagation()}>
      <div className={classes.dialogTitle}>
        <Typography variant="h2" style={{ fontSize: "14px", fontWeight: 500 }}>
          {editingTemplate ? "Edit Template" : "Add Template"}
        </Typography>
        <IconButton onClick={onClose} className={classes.closeButton} size="small">
          <CloseIcon style={{ fontSize: "18px" }} />
        </IconButton>
      </div>

      <DialogContent style={{ padding: "16px 20px" }}>

        {/* Name */}
        <div style={rowStyle}>
          <span style={labelStyle}>Name *</span>
          <div style={{ flex: 1 }}>
            <CustomInput
              fullWidth
              value={templateForm.description || ""}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              placeholder="Template name"
            />
          </div>
        </div>

        {/* Protocol */}
        <div style={rowStyle}>
          <span style={labelStyle}>Protocol</span>
          <div style={{ flex: 1 }}>
            <CustomSelect
              value={templateForm.protocol || ""}
              onChange={(value) => setTemplateForm({ ...templateForm, protocol: value })}
              options={[
                { value: "", label: "All protocols" },
                ...protocolOptions.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, whiteSpace: "nowrap" }}>
            <CustomCheckbox
              checked={hideUnused}
              onChange={(e) => setHideUnused(e.target.checked)}
            />
            <span style={{ fontSize: 10, color: "#666" }}>Hide unused</span>
          </div>
        </div>

        {/* Gateway */}
        <div style={rowStyle}>
          <span style={labelStyle}>Gateway</span>
          <div style={{ flex: 1 }}>
            <CustomSelect
              value={templateForm.textChannel ? "sms" : "gprs"}
              onChange={(value) => setTemplateForm({ ...templateForm, textChannel: value === "sms" })}
              options={[
                { value: "gprs", label: "GPRS" },
                { value: "sms", label: "SMS" },
              ]}
            />
          </div>
        </div>

        {/* Type: ASCII / HEX */}
        <div style={rowStyle}>
          <span style={labelStyle}>Type</span>
          <div style={{ flex: 1 }}>
            <CustomSelect
              value={templateForm.encoding || "ascii"}
              onChange={(value) => setTemplateForm({ ...templateForm, encoding: value })}
              options={[
                { value: "ascii", label: "ASCII" },
                { value: "hex", label: "HEX" },
              ]}
            />
          </div>
        </div>

        {/* Command Data */}
        <div style={rowStyle}>
          <span style={labelStyle}>Command *</span>
          <div style={{ flex: 1 }}>
            <CustomInput
              fullWidth
              multiline
              rows={3}
              value={templateForm.data || ""}
              onChange={(e) => setTemplateForm({ ...templateForm, data: e.target.value })}
              placeholder="Enter command data"
            />
          </div>
        </div>

        {/* Variables hint */}
        <Box
          style={{
            background: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            padding: "8px 10px",
            marginBottom: 12,
          }}
        >
          <Typography style={{ fontSize: 10, fontWeight: 600, color: "#555", marginBottom: 4 }}>
            Variables
          </Typography>
          <Typography style={{ fontSize: 10, color: "#666", lineHeight: 1.6 }}>
            Use <code style={{ background: "#eee", padding: "1px 4px", borderRadius: 2 }}>{"device.uniqueId"}</code> to insert device IMEI
            <br />
            Use <code style={{ background: "#eee", padding: "1px 4px", borderRadius: 2 }}>{"device.name"}</code> to insert device name
          </Typography>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
          <CustomButton variant="outlined" onClick={onClose} size="small">
            Cancel
          </CustomButton>
          <CustomButton
            variant="contained"
            color="primary"
            onClick={onSave}
            size="small"
            disabled={loading}
          >
            {loading ? <CircularProgress size={16} /> : editingTemplate ? "Update" : "Save"}
          </CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateFormDialog;
