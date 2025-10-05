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
import SaveIcon from "@mui/icons-material/Save";
import ObjectsTab from "../settings/object/ObjectsTab";
import GroupsTab from "../settings/object/GroupsTab";
import DriversTab from "../settings/object/DriversTab";
import PassengersTab from "../settings/object/PassengersTab";
import EventsTab from "../settings/events/EventsTab";
import TrailersTab from "../settings/object/TrailersTab";
import TemplatesTab from "../settings/templates/TemplatesTab";
import SMSTab from "../settings/sms/SMSTab";
import UserInterfaceTab from "../settings/userinterface/UserInterfaceTab";
import MyAccountTab from "../settings/myaccount/MyAccountTab";
import SubAccountsTab from "../settings/subaccounts/SubAccountsTab";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      width: "800px",
      height: "550px",
      maxWidth: "90vw",
    },
  },
  dialogTitle: {
    backgroundColor: "#2a81d4",
    color: "white",
    padding: '3px 14px',
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
  tabsContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottom: `1px solid ${theme.palette.divider}`,
    position: "relative",
  },
  saveButton: {
    position: "absolute",
    right: theme.spacing(2),
    top: "50%",
    transform: "translateY(-50%)",
    padding: "4px 12px",
    fontSize: "12px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    "&:hover": {
      color: "#4a90e2",
    },
  },
  saveIcon: {
    fontSize: "16px",
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
  nestedTabPanel: {
    maxHeight: "400px",
    overflow: "auto",
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
    style={{ maxHeight: "400px", overflow: "auto" }}
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

  const handleSave = () => {
    console.log('Settings Dialog handleSave called, tabValue:', tabValue);
    
    // Call save function based on active tab
    if (tabValue === 3) {
      // SMS tab
      console.log('Calling smsTabSave, exists:', !!window.smsTabSave);
      if (window.smsTabSave) {
        window.smsTabSave();
      }
    } else if (tabValue === 4) {
      // User Interface tab
      console.log('Calling userInterfaceTabSave, exists:', !!window.userInterfaceTabSave);
      if (window.userInterfaceTabSave) {
        window.userInterfaceTabSave();
      }
    } else if (tabValue === 5) {
      // My Account tab
      console.log('Calling myAccountTabSave, exists:', !!window.myAccountTabSave);
      if (window.myAccountTabSave) {
        window.myAccountTabSave();
      }
    }
  };

  // Check if current tab should show save button (SMS, User Interface, My Account)
  const showSaveButton = [3, 4, 5].includes(tabValue);

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
        <Box className={classes.tabsContainer}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            className={classes.tabs}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Object" />
            <Tab label="Events" />
            <Tab label="Template" />
            <Tab label="SMS" />
            <Tab label="User interface" />
            <Tab label="My account" />
            <Tab label="Sub akun" />
          </Tabs>
          {showSaveButton && (
            <Box className={classes.saveButton} onClick={handleSave}>
              <SaveIcon className={classes.saveIcon} />
              <Typography sx={{ fontSize: "12px" }}>Save</Typography>
            </Box>
          )}
        </Box>

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
            <Tab label="Object" />
            <Tab label="Group" />
            <Tab label="Driver" />
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
          <UserInterfaceTab />
        </TabPanel>

        <TabPanel value={tabValue} index={5} className={classes.tabPanel}>
          <MyAccountTab />
        </TabPanel>

        <TabPanel value={tabValue} index={6} className={classes.tabPanel}>
          <SubAccountsTab />
        </TabPanel>
      </DialogContent>

    </Dialog>
  );
};

export default SettingsDialog;
