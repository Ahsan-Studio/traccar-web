import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { makeStyles } from "tss-react/mui";
import { snackBarDurationLongMs } from "../common/util/duration";
import GprsTab from "./ObjectControlTabs/GprsTab";
import ScheduleTab from "./ObjectControlTabs/ScheduleTab";
import TemplatesTab from "./ObjectControlTabs/TemplatesTab";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "1200px",
      maxWidth: "90vw",
      height: "600px",
      maxHeight: "80vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#2b82d4",
    color: "white",
    padding: "3px 14px !important",
    fontSize: "14px !important",
    fontWeight: 500,
    lineHeight: "30px !important",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    color: "white",
    padding: "4px",
  },
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "36px",
    "& .MuiTab-root": {
      minHeight: "36px",
      textTransform: "none",
      fontSize: "13px",
      fontWeight: "normal",
      padding: "6px 16px",
    },
  },
  content: {
    padding: 0,
    height: "calc(100% - 100px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tabPanel: {
    flex: 1,
    overflow: "auto",
    padding: theme.spacing(2),
  },
  gprsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  commandRow: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
  },
  selectField: {
    minWidth: "200px",
    fontSize: "11px",
  },
  sendButton: {
    textTransform: "none",
    backgroundColor: "#4caf50",
    color: "white",
    "&:hover": {
      backgroundColor: "#45a049",
    },
  },
  table: {
    "& .MuiTableCell-head": {
      backgroundColor: "#f5f5f5",
      fontWeight: 500,
      fontSize: "11px",
      padding: "8px",
      color: "#333",
      borderBottom: "1px solid #ddd",
    },
    "& .MuiTableCell-body": {
      fontSize: "11px",
      padding: "6px 8px",
      color: "#333",
      borderBottom: "1px solid #ddd",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#fafafa",
    },
  },
  statusSuccess: {
    color: "#4caf50",
  },
  actionButtons: {
    display: "flex",
    gap: theme.spacing(0.5),
  },
  iconButton: {
    padding: "4px",
  },
  templateField: {
    flex: 1,
  },
  addButton: {
    textTransform: "none",
    fontSize: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const ObjectControlDialog = ({ open, onClose, preselectedDeviceId }) => {
  const { classes } = useStyles();
  const [currentTab, setCurrentTab] = useState(0);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Show notification helper
  const showNotification = useCallback((message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleClose = (event, reason) => {
    if (reason === "backdropClick") {
      return;
    }
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        className={classes.dialog}
      >
        <div className={classes.dialogTitle}>
          <Typography
            variant="h2"
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            Object control
          </Typography>
          <IconButton
            onClick={onClose}
            className={classes.closeButton}
            size="small"
          >
            <CloseIcon style={{ fontSize: "18px" }} />
          </IconButton>
        </div>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          className={classes.tabs}
        >
          <Tab label="GPRS" />
          <Tab label="Schedule" />
          <Tab label="Templates" />
        </Tabs>

        <DialogContent className={classes.content}>
          {/* GPRS Tab */}
          {currentTab === 0 && (
            <GprsTab
              classes={classes}
              showNotification={showNotification}
              preselectedDeviceId={preselectedDeviceId}
            />
          )}

          {/* Schedule Tab */}
          {currentTab === 1 && <ScheduleTab classes={classes} />}

          {/* Templates Tab */}
          {currentTab === 2 && (
            <TemplatesTab
              classes={classes}
              showNotification={showNotification}
            />
          )}
        </DialogContent>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Dialog>
    </>
  );
};

export default ObjectControlDialog;
