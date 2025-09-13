import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "90%",
      maxWidth: "1200px",
      height: "80vh",
      maxHeight: "800px",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    padding: theme.spacing(2),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "& .MuiTypography-root": {
      fontSize: "16px",
      fontWeight: 600,
    },
  },
  closeButton: {
    color: "white",
    padding: "4px",
  },
  dialogContent: {
    padding: 0,
    display: "flex",
    height: "100%",
  },
  leftPanel: {
    width: "50%",
    padding: theme.spacing(3),
    borderRight: "1px solid #e0e0e0",
    overflow: "auto",
  },
  rightPanel: {
    width: "50%",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4a90e2",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    "&:first-of-type": {
      marginTop: 0,
    },
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  label: {
    width: "40%",
    fontSize: "11px",
    fontWeight: 400,
    color: "#686868",
    paddingRight: theme.spacing(2),
  },
  input: {
    width: "60%",
    "& .MuiOutlinedInput-root": {
      height: "32px",
      fontSize: "11px",
      "& .MuiOutlinedInput-input": {
        padding: "6px 12px",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "11px",
    },
  },
  select: {
    width: "60%",
    "& .MuiOutlinedInput-root": {
      height: "32px",
      fontSize: "11px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "11px",
    },
  },
  checkbox: {
    "& .MuiFormControlLabel-label": {
      fontSize: "11px",
    },
  },
  previewRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
  },
  previewLabel: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#686868",
    marginRight: theme.spacing(1),
  },
  previewValue: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#333",
    padding: "6px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
    minHeight: "20px",
    display: "flex",
    alignItems: "center",
    width: "60%",
  },
  previewSeparator: {
    fontSize: "16px",
    color: "#666",
    margin: "0 8px",
  },
  tabsContainer: {
    borderBottom: "1px solid #e0e0e0",
  },
  tab: {
    minWidth: "120px",
    fontSize: "12px",
    fontWeight: 500,
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing(2),
    overflow: "auto",
  },
  table: {
    minWidth: 300,
    marginBottom: theme.spacing(2),
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-head": {
      fontWeight: 600,
      fontSize: "11px",
      color: "#333",
      padding: "8px 12px",
      borderBottom: "1px solid #ddd",
    },
  },
  tableRow: {
    "& .MuiTableCell-body": {
      fontSize: "11px",
      padding: "6px 12px",
      borderBottom: "1px solid #eee",
    },
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  inputField: {
    flex: 1,
    "& .MuiOutlinedInput-root": {
      height: "28px",
      fontSize: "11px",
      "& .MuiOutlinedInput-input": {
        padding: "4px 8px",
      },
    },
  },
  addButton: {
    minWidth: "32px",
    height: "28px",
    padding: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
    },
  },
  dialogActions: {
    padding: theme.spacing(2),
    borderTop: "1px solid #e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  saveButton: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontSize: "12px",
    fontWeight: 500,
    padding: "8px 16px",
    "&:hover": {
      backgroundColor: "#357abd",
    },
  },
  cancelButton: {
    color: "#666",
    fontSize: "12px",
    fontWeight: 500,
    padding: "8px 16px",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
}));

const EditSensorDialog = ({ open, onClose, sensor, onSave }) => {
  const { classes } = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: "EngineStatus",
    type: "Pengapian (ACC)",
    parameter: "acc",
    dataList: true,
    popup: false,
    resultType: "Logic",
    unit: "",
    text1: "on",
    text0: "off",
    formula: "(X+1)/2*3",
    lowestValue: "",
    highestValue: "",
    ignoreIgnitionOff: false,
    currentValue: "0",
    result: "off",
  });
  const [calibrationData, setCalibrationData] = useState([]);
  const [dictionaryData, setDictionaryData] = useState([]);
  const [newCalibration, setNewCalibration] = useState({ x: "", y: "" });
  const [newDictionary, setNewDictionary] = useState({ value: "", text: "" });

  useEffect(() => {
    if (sensor) {
      setFormData({
        name: sensor.name || "",
        type: sensor.type || "",
        parameter: sensor.parameter || "",
        dataList: true,
        popup: false,
        resultType: "Logic",
        unit: "",
        text1: "on",
        text0: "off",
        formula: "(X+1)/2*3",
        lowestValue: "",
        highestValue: "",
        ignoreIgnitionOff: false,
        currentValue: "0",
        result: "off",
      });
    }
  }, [sensor]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddCalibration = () => {
    if (newCalibration.x && newCalibration.y) {
      setCalibrationData(prev => [...prev, { ...newCalibration, id: Date.now() }]);
      setNewCalibration({ x: "", y: "" });
    }
  };

  const handleAddDictionary = () => {
    if (newDictionary.value && newDictionary.text) {
      setDictionaryData(prev => [...prev, { ...newDictionary, id: Date.now() }]);
      setNewDictionary({ value: "", text: "" });
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Sensor properties</Typography>
        <IconButton
          className={classes.closeButton}
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.dialogContent}>
        {/* Left Panel */}
        <Box className={classes.leftPanel}>
          {/* Sensor Section */}
          <Typography className={classes.sectionTitle}>Sensor</Typography>
          
          <div className={classes.formRow}>
            <div className={classes.label}>Nama</div>
            <TextField
              className={classes.input}
              value={formData.name}
              onChange={handleInputChange("name")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Tipe</div>
            <FormControl className={classes.select} size="small">
              <InputLabel>Tipe</InputLabel>
              <Select
                value={formData.type}
                onChange={handleInputChange("type")}
                label="Tipe"
              >
                <MenuItem value="Pengapian (ACC)">Pengapian (ACC)</MenuItem>
                <MenuItem value="Digital">Digital</MenuItem>
                <MenuItem value="Analog">Analog</MenuItem>
                <MenuItem value="Counter">Counter</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Parameter</div>
            <FormControl className={classes.select} size="small">
              <InputLabel>Parameter</InputLabel>
              <Select
                value={formData.parameter}
                onChange={handleInputChange("parameter")}
                label="Parameter"
              >
                <MenuItem value="acc">acc</MenuItem>
                <MenuItem value="door">door</MenuItem>
                <MenuItem value="temp">temp</MenuItem>
                <MenuItem value="fuel">fuel</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}></div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.dataList}
                  onChange={handleInputChange("dataList")}
                  size="small"
                />
              }
              label="Daftar data"
              className={classes.checkbox}
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}></div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.popup}
                  onChange={handleInputChange("popup")}
                  size="small"
                />
              }
              label="Popup"
              className={classes.checkbox}
            />
          </div>

          {/* Result Section */}
          <Typography className={classes.sectionTitle}>Result</Typography>

          <div className={classes.formRow}>
            <div className={classes.label}>Tipe</div>
            <FormControl className={classes.select} size="small">
              <InputLabel>Tipe</InputLabel>
              <Select
                value={formData.resultType}
                onChange={handleInputChange("resultType")}
                label="Tipe"
              >
                <MenuItem value="Logic">Logic</MenuItem>
                <MenuItem value="Numeric">Numeric</MenuItem>
                <MenuItem value="Text">Text</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Satuan pengukuran</div>
            <TextField
              className={classes.input}
              value={formData.unit}
              onChange={handleInputChange("unit")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Jika sensor "1" (text)</div>
            <TextField
              className={classes.input}
              value={formData.text1}
              onChange={handleInputChange("text1")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Jika sensor "0" (text)</div>
            <TextField
              className={classes.input}
              value={formData.text0}
              onChange={handleInputChange("text0")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Formula</div>
            <TextField
              className={classes.input}
              value={formData.formula}
              onChange={handleInputChange("formula")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Nilai terendah</div>
            <TextField
              className={classes.input}
              value={formData.lowestValue}
              onChange={handleInputChange("lowestValue")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Nilai tertinggi</div>
            <TextField
              className={classes.input}
              value={formData.highestValue}
              onChange={handleInputChange("highestValue")}
              size="small"
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}></div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.ignoreIgnitionOff}
                  onChange={handleInputChange("ignoreIgnitionOff")}
                  size="small"
                />
              }
              label="Ignore if ignition is off"
              className={classes.checkbox}
            />
          </div>

          {/* Sensor result preview Section */}
          <Typography className={classes.sectionTitle}>Sensor result preview</Typography>

          <div className={classes.formRow}>
            <div className={classes.label}>Nilai saat ini</div>
            <div className={classes.previewValue}>{formData.currentValue}</div>
          </div>

          <div className={classes.formRow}>
            <div className={classes.label}>Result</div>
            <div className={classes.previewValue}>{formData.result}</div>
          </div>
        </Box>

        {/* Right Panel */}
        <Box className={classes.rightPanel}>
          <Box className={classes.tabsContainer}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Kalibrasi" className={classes.tab} />
              <Tab label="Kamus" className={classes.tab} />
            </Tabs>
          </Box>

          <Box className={classes.tabContent}>
            {tabValue === 0 && (
              <>
                <TableContainer component={Paper} className={classes.table}>
                  <Table>
                    <TableHead className={classes.tableHeader}>
                      <TableRow>
                        <TableCell>X</TableCell>
                        <TableCell>Y</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calibrationData.map((row) => (
                        <TableRow key={row.id} className={classes.tableRow}>
                          <TableCell>{row.x}</TableCell>
                          <TableCell>{row.y}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <div className={classes.inputRow}>
                  <TextField
                    className={classes.inputField}
                    placeholder="X"
                    value={newCalibration.x}
                    onChange={(e) => setNewCalibration(prev => ({ ...prev, x: e.target.value }))}
                    size="small"
                  />
                  <TextField
                    className={classes.inputField}
                    placeholder="Y"
                    value={newCalibration.y}
                    onChange={(e) => setNewCalibration(prev => ({ ...prev, y: e.target.value }))}
                    size="small"
                  />
                  <IconButton
                    className={classes.addButton}
                    onClick={handleAddCalibration}
                    size="small"
                  >
                    <AddIcon />
                  </IconButton>
                </div>
              </>
            )}

            {tabValue === 1 && (
              <>
                <TableContainer component={Paper} className={classes.table}>
                  <Table>
                    <TableHead className={classes.tableHeader}>
                      <TableRow>
                        <TableCell>Nilai</TableCell>
                        <TableCell>Text</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dictionaryData.map((row) => (
                        <TableRow key={row.id} className={classes.tableRow}>
                          <TableCell>{row.value}</TableCell>
                          <TableCell>{row.text}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <div className={classes.inputRow}>
                  <TextField
                    className={classes.inputField}
                    placeholder="Nilai"
                    value={newDictionary.value}
                    onChange={(e) => setNewDictionary(prev => ({ ...prev, value: e.target.value }))}
                    size="small"
                  />
                  <Typography style={{ fontSize: "16px", color: "#666", margin: "0 8px" }}>=</Typography>
                  <TextField
                    className={classes.inputField}
                    placeholder="Text"
                    value={newDictionary.text}
                    onChange={(e) => setNewDictionary(prev => ({ ...prev, text: e.target.value }))}
                    size="small"
                  />
                  <IconButton
                    className={classes.addButton}
                    onClick={handleAddDictionary}
                    size="small"
                  >
                    <AddIcon />
                  </IconButton>
                </div>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className={classes.dialogActions}>
        <Button
          onClick={onClose}
          className={classes.cancelButton}
          startIcon={<CloseIcon />}
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          className={classes.saveButton}
          startIcon={<SaveIcon />}
        >
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSensorDialog;
