import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { makeStyles } from "tss-react/mui";
import { useEffectAsync } from "../../reactHelper";
import { CustomTable } from "../../common/components/custom";
import EditSubAccountDialog from "./EditSubAccountDialog";
import fetchOrThrow from "../../common/util/fetchOrThrow";

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
  
  const [subAccounts, setSubAccounts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubAccount, setEditingSubAccount] = useState(null);

  // Fetch sub accounts from API
  useEffectAsync(async () => {
    try {
      const response = await fetchOrThrow('/api/subaccounts');
      const data = await response.json();
      setSubAccounts(data);
    } catch (error) {
      console.error('Failed to fetch sub accounts:', error);
    }
  }, []);

  const columns = [
    {
      key: "name",
      label: "Username",
      minWidth: 150,
    },
    {
      key: "email",
      label: "E-mail",
      minWidth: 200,
    },
    {
      key: "disabled",
      label: "Active",
      minWidth: 80,
      align: "center",
      format: (value) => (!value ? "Yes" : "No"),
    },
    {
      key: "deviceLimit",
      label: "Device Limit",
      minWidth: 100,
      align: "center",
      format: (value) => value || "Unlimited",
    },
    {
      key: "expirationTime",
      label: "Expiration",
      minWidth: 150,
      format: (value) => (value ? new Date(value).toLocaleDateString() : "Never"),
    },
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

  const handleDelete = async (row) => {
    if (window.confirm(`Are you sure you want to delete sub account "${row.name}"?`)) {
      try {
        await fetchOrThrow(`/api/subaccounts/${row.id}`, {
          method: 'DELETE',
        });
        // Refresh sub accounts list
        const response = await fetchOrThrow('/api/subaccounts');
        const data = await response.json();
        setSubAccounts(data);
        setSelected(selected.filter((id) => id !== row.id));
      } catch (error) {
        console.error('Failed to delete sub account:', error);
        alert('Failed to delete sub account. Please try again.');
      }
    }
  };

  const handleAdd = () => {
    setEditingSubAccount(null);
    setDialogOpen(true);
  };

  const handleDialogClose = async (saved) => {
    setDialogOpen(false);
    setEditingSubAccount(null);
    
    // Refresh sub accounts list if saved
    if (saved) {
      try {
        const response = await fetchOrThrow('/api/subaccounts');
        const data = await response.json();
        setSubAccounts(data);
      } catch (error) {
        console.error('Failed to refresh sub accounts:', error);
      }
    }
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
