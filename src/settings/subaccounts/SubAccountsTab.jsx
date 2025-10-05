import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { CustomTable } from "../../common/components/custom";
import EditSubAccountDialog from "./EditSubAccountDialog";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    flexShrink: 0,
  },
  description: {
    fontSize: 11,
    color: '#666',
    marginBottom: theme.spacing(0),
  },
  tableWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
}));

const SubAccountsTab = () => {
  const { classes } = useStyles();
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubAccount, setEditingSubAccount] = useState(null);

  // Empty data - no sub accounts yet
  const subAccounts = [];

  const columns = [
    { key: "username", label: "Username", minWidth: 150 },
    { key: "email", label: "E-mail", minWidth: 200 },
    { key: "active", label: "Active", minWidth: 80, align: "center" },
    { key: "objects", label: "Objects", minWidth: 80, align: "center" },
    { key: "places", label: "Places", minWidth: 80, align: "center" },
  ];

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(subAccounts.map((account) => account.id));
    } else {
      setSelected([]);
    }
  };

  const handleRowClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleEdit = (row) => {
    setEditingSubAccount(row);
    setDialogOpen(true);
  };

  const handleDelete = (row) => {
    console.log("Delete sub account:", row);
    // TODO: Implement delete sub account confirmation
  };

  const handleAdd = () => {
    setEditingSubAccount(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSubAccount(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.header}>
        <Typography className={classes.description}>
          Sub accounts can split this account into multiple smaller accounts with limited privileges.
        </Typography>
      </Box>
      
      <Box className={classes.tableWrapper}>
        <CustomTable
          rows={subAccounts}
          columns={columns}
          selected={selected}
          onToggleAll={handleSelectAllClick}
          onToggleRow={handleRowClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          search={search}
          onSearchChange={handleSearchChange}
        />
      </Box>

      <EditSubAccountDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        subAccount={editingSubAccount}
      />
    </Box>
  );
};

export default SubAccountsTab;
