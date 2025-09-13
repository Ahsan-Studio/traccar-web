import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const useStyles = makeStyles()((theme) => ({
  searchContainer: {
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(2),
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      height: "32px",
      fontSize: "12px",
      "& fieldset": {
        borderColor: "#ddd",
      },
    },
  },
  addButton: {
    marginLeft: "auto",
    height: "32px",
    fontSize: "12px",
  },
  tableContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    margin: theme.spacing(0, 2),
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-root": {
      fontSize: "12px",
      fontWeight: 600,
      padding: "8px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  tableRow: {
    "&:nth-of-type(even)": {
      backgroundColor: "#fafafa",
    },
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
    "& .MuiTableCell-root": {
      fontSize: "11px",
      padding: "6px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  actionButton: {
    padding: "2px",
    "& .MuiSvgIcon-root": {
      fontSize: "14px",
    },
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: "#666",
  },
}));

const PassengersTab = () => {
  const { classes } = useStyles();
  const [searchTerm, setSearchTerm] = useState("");
  const [passengers] = useState([]); // This would come from Redux store

  const filteredPassengers = passengers.filter((passenger) =>
    passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box className={classes.searchContainer}>
        <TextField
          placeholder="Search passengers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={classes.searchField}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className={classes.addButton}
          size="small"
        >
          Add Passenger
        </Button>
      </Box>

      {filteredPassengers.length > 0 ? (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table size="small">
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Group</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPassengers.map((passenger) => (
                <TableRow key={passenger.id} className={classes.tableRow}>
                  <TableCell>{passenger.name}</TableCell>
                  <TableCell>{passenger.phone || "-"}</TableCell>
                  <TableCell>{passenger.email || "-"}</TableCell>
                  <TableCell>{passenger.group || "-"}</TableCell>
                  <TableCell align="center">
                    <div className={classes.actionButtons}>
                      <IconButton
                        size="small"
                        className={classes.actionButton}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        className={classes.actionButton}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box className={classes.emptyState}>
          <Typography variant="body2" color="textSecondary">
            No passengers found. Add passengers to track and manage your passenger list.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PassengersTab;
