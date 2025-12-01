import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  CustomInput,
  CustomSelect,
  CustomButton,
} from "../../common/components/custom";

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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <div className={classes.dialogTitle}>
        <Typography variant="h2" style={{ fontSize: "14px", fontWeight: 500 }}>
          {editingTemplate ? "Edit Template" : "Add Template"}
        </Typography>
        <IconButton
          onClick={onClose}
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
  );
};

export default TemplateFormDialog;
