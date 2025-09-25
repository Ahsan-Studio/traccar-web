import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import CloseIcon from "@mui/icons-material/Close";
import ObjectsTab from "../settings/object/ObjectsTab";
import GroupsTab from "../settings/object/GroupsTab";
import DriversTab from "../settings/object/DriversTab";
import PassengersTab from "../settings/object/PassengersTab";
import EventsTab from "../settings/events/EventsTab";
import TrailersTab from "../settings/object/TrailersTab";
import TemplatesTab from "../settings/templates/TemplatesTab";
import SMSTab from "../settings/sms/SMSTab";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "800px",
      maxWidth: "90vw",
      maxHeight: "90vh",
    },
  },
  dialogTitle: {
    backgroundColor: "#4a90e2",
    color: "white",
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "& .MuiTypography-root": {
      fontSize: "14px",
      fontWeight: 500,
    },
  },
  closeButton: {
    color: "white",
    padding: "4px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  tabs: {
    backgroundColor: "#f5f5f5",
    minHeight: "31px !important",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "& .MuiTab-root": {
      marginTop: "6px",
      minHeight: "25px",
      textTransform: "none",
      fontSize: "12px",
      fontWeight: "normal",
      padding: "6px 16px",
      color: "#444444",
      borderRadius: 0,
      "&.Mui-selected": {
        backgroundColor: "#ffffff",
        color: "#444444",
      },
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  },
  tabPanel: {
    padding: 0,
    height: "calc(100% - 31px)",
    overflow: "auto",
  },
  nestedTabs: {
    backgroundColor: "#f5f5f5",
    minHeight: "31px !important",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "& .MuiTab-root": {
      marginTop: "6px",
      minHeight: "25px",
      textTransform: "none",
      fontSize: "12px",
      fontWeight: "normal",
      padding: "6px 16px",
      color: "#444444",
      borderRadius: 0,
      "&.Mui-selected": {
        backgroundColor: "#ffffff",
        color: "#444444",
      },
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  },
  infoMessage: {
    padding: theme.spacing(2, 2),
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontSize: "11px",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
  </div>
);

const NestedTabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`objects-tabpanel-${index}`}
    aria-labelledby={`objects-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
  </div>
);

const SettingsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [objectsTabValue, setObjectsTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleObjectsTabChange = (event, newValue) => {
    setObjectsTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Typography>Settings</Typography>
        <IconButton
          onClick={onClose}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0, height: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Objek" />
          <Tab label="Kegiatan" />
          <Tab label="Template" />
          <Tab label="SMS" />
          <Tab label="Antarmuka pengg." />
          <Tab label="Akun saya" />
          <Tab label="Sub akun" />
        </Tabs>

        <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
          <Box className={classes.infoMessage}>
            Newly added objects can be used for 14 days free.
          </Box>

          <Tabs
            value={objectsTabValue}
            onChange={handleObjectsTabChange}
            className={classes.nestedTabs}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Objek" />
            <Tab label="Grup" />
            <Tab label="Pengemudi" />
          </Tabs>

          <NestedTabPanel value={objectsTabValue} index={0} className={classes.tabPanel}>
            <ObjectsTab />
          </NestedTabPanel>

          <NestedTabPanel value={objectsTabValue} index={1} className={classes.tabPanel}>
            <GroupsTab />
          </NestedTabPanel>

          <NestedTabPanel value={objectsTabValue} index={2} className={classes.tabPanel}>
            <DriversTab />
          </NestedTabPanel>

          <NestedTabPanel value={objectsTabValue} index={3} className={classes.tabPanel}>
            <PassengersTab />
          </NestedTabPanel>

          <NestedTabPanel value={objectsTabValue} index={4} className={classes.tabPanel}>
            <TrailersTab />
          </NestedTabPanel>
        </TabPanel>

        <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
          <EventsTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2} className={classes.tabPanel}>
          <TemplatesTab />
        </TabPanel>

        <TabPanel value={tabValue} index={3} className={classes.tabPanel}>
          <SMSTab />
        </TabPanel>

        <TabPanel value={tabValue} index={4} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Antarmuka pengg. content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={5} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Akun saya content will be implemented here
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={6} className={classes.tabPanel}>
          <Typography variant="body2" color="textSecondary">
            Sub akun content will be implemented here
          </Typography>
        </TabPanel>
      </DialogContent>

    </Dialog>
  );
};

export default SettingsDialog;
