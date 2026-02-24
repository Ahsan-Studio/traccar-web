import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { CustomButton, CustomCheckbox } from "../../common/components/custom";
import TemplateFormDialog from "./TemplateFormDialog";

const TemplatesTab = ({ classes, showNotification }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    description: "",
    type: "custom",
    textChannel: false,
    data: "",
    protocol: "",
    encoding: "ascii",
  });

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
    fetchTemplates();
  }, [fetchTemplates]);

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      description: "",
      type: "custom",
      textChannel: false,
      data: "",
      protocol: "",
      encoding: "ascii",
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
      protocol: template.attributes?.protocol || "",
      encoding: template.attributes?.encoding || "ascii",
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
      protocol: "",
      encoding: "ascii",
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
          encoding: templateForm.encoding || "ascii",
          ...(templateForm.protocol ? { protocol: templateForm.protocol } : {}),
        },
      };

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

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected template(s)?`)) return;
    try {
      await Promise.all(
        selectedRows.map((id) => fetch(`/api/commands/${id}`, { method: "DELETE" }))
      );
      showNotification("Selected templates deleted", "success");
      setSelectedRows([]);
      fetchTemplates();
    } catch (err) {
      showNotification(`Error: ${err.message}`, "error");
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
  return (
    <div className={classes.tabPanel}>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <CustomCheckbox
                  checked={templates.length > 0 && selectedRows.length === templates.length}
                  indeterminate={selectedRows.length > 0 && selectedRows.length < templates.length}
                  onChange={(e) => setSelectedRows(e.target.checked ? templates.map((t) => t.id) : [])}
                />
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
                  <TableCell padding="checkbox">
                    <CustomCheckbox
                      checked={selectedRows.includes(template.id)}
                      onChange={(e) => setSelectedRows((prev) =>
                        e.target.checked ? [...prev, template.id] : prev.filter((id) => id !== template.id)
                      )}
                    />
                  </TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.attributes?.protocol || "-"}</TableCell>
                  <TableCell>{template.textChannel ? "SMS" : "GPRS"}</TableCell>
                  <TableCell>{template.type}</TableCell>
                  <TableCell>{template.attributes?.data || "-"}</TableCell>
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
      <Box mt={2} display="flex" gap={1}>
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

      {/* Template Form Dialog */}
      <TemplateFormDialog
        classes={classes}
        open={templateDialogOpen}
        onClose={handleCloseTemplateDialog}
        editingTemplate={editingTemplate}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        loading={loading}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default TemplatesTab;
