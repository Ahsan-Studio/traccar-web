import { Box, Typography, TextField, Button, Card, CardContent, IconButton } from "@mui/material";
import { makeStyles } from "tss-react/mui";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const useStyles = makeStyles()((theme) => ({
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formField: {
    "& .MuiOutlinedInput-root": {
      fontSize: "12px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px",
    },
  },
  customFieldCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  addButton: {
    fontSize: "12px",
    textTransform: "none",
  },
  deleteButton: {
    padding: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
    },
  },
}));

const CustomTab = ({ formData, onFormDataChange }) => {
  const { classes } = useStyles();

  const customFields = formData.customFields || [];

  const handleCustomFieldChange = (index, field, value) => {
    const updatedFields = customFields.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onFormDataChange({ customFields: updatedFields });
  };

  const addCustomField = () => {
    const newField = {
      id: Date.now(),
      name: "",
      value: "",
      type: "text",
    };
    onFormDataChange({ customFields: [...customFields, newField] });
  };

  const removeCustomField = (index) => {
    const updatedFields = customFields.filter((_, i) => i !== index);
    onFormDataChange({ customFields: updatedFields });
  };

  return (
    <Box>
      <Typography className={classes.sectionTitle}>Isian buatan sendiri</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {customFields.map((field, index) => (
          <Card key={field.id} className={classes.customFieldCard}>
            <CardContent sx={{ padding: "8px !important" }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", marginBottom: 1 }}>
                <TextField
                  label="Nama field"
                  value={field.name}
                  onChange={(e) => handleCustomFieldChange(index, "name", e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  className={classes.formField}
                />
                <TextField
                  label="Tipe"
                  value={field.type}
                  onChange={(e) => handleCustomFieldChange(index, "type", e.target.value)}
                  size="small"
                  sx={{ width: 100 }}
                  className={classes.formField}
                />
                <IconButton
                  onClick={() => removeCustomField(index)}
                  className={classes.deleteButton}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Nilai"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(index, "value", e.target.value)}
                size="small"
                fullWidth
                className={classes.formField}
              />
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addCustomField}
          className={classes.addButton}
          size="small"
        >
          Tambah Field Kustom
        </Button>
      </Box>
    </Box>
  );
};

export default CustomTab;
