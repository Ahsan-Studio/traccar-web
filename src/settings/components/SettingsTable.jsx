import { useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  TextField,
  CircularProgress,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: "15px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: '0px',
    border: `0px solid ${theme.palette.divider}`,
    borderBottom: 0,
    backgroundColor: "transparent",
  },
  search: {
    width: "100%",
    marginBottom: '10px',
    "& .MuiOutlinedInput-root": {
      height: 28,
      fontSize: 11,
      borderRadius: 0,
      border: `0px solid ${theme.palette.divider}`,
    },
    "& .MuiInputLabel-root": {
      fontSize: 11,
    },
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableCell-root": {
      fontSize: 12,
      fontWeight: 600,
      padding: "8px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: "#444444",
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
      fontSize: 11,
      padding: "6px 12px",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  checkboxCell: {
    width: 40,
    padding: "6px 8px !important",
  },
  actionCell: {
    width: 80,
    padding: "6px 8px !important",
    textAlign: "right",
  },
  actionButton: {
    padding: 2,
    margin: "0 2px",
    "& .MuiSvgIcon-root": {
      fontSize: 14,
    },
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1, 1),
    border: `1px solid ${theme.palette.divider}`,
    borderTop: 0,
  },
  footerLeft: {
    display: "flex",
    gap: theme.spacing(1),
  },
  footerButton: {
    padding: 4,
    "& .MuiSvgIcon-root": {
      fontSize: 16,
      color: "#4a90e2",
    },
  },
  pagination: {
    fontSize: 11,
    color: "#666",
  },
}));

export const BoolIcon = ({ value }) => (value ? (
  <CheckIcon color="success" fontSize="small" />
) : (
  <CloseIcon color="error" fontSize="small" />
));

/**
 * Reusable settings-styled table
 * columns: [{ key, label, align, width, render?: (row)=>node }]
 */
const SettingsTable = ({
  rows = [],
  columns = [],
  loading = false,
  selected = [],
  onToggleRow = () => {},
  onToggleAll = () => {},
  onEdit = () => {},
  onDelete = () => {},
  search = "",
  onSearchChange = () => {},
  onAdd = () => {},
  onOpenSettings = () => {},
}) => {
  const { classes } = useStyles();

  const allChecked = rows.length > 0 && selected.length === rows.length;
  const indeterminate = selected.length > 0 && selected.length < rows.length;

  const headerCells = useMemo(() => (
    <TableRow>
      <TableCell padding="checkbox" className={classes.checkboxCell}>
        <Checkbox size="small" checked={allChecked} indeterminate={indeterminate} onChange={onToggleAll} />
      </TableCell>
      {columns.map((col) => (
        <TableCell key={col.key} align={col.align} style={{ width: col.width }}>{col.label}</TableCell>
      ))}
      <TableCell className={classes.actionCell}></TableCell>
    </TableRow>
  ), [columns, allChecked, indeterminate, onToggleAll, classes]);

  return (
    <Box className={classes.container}>
      <Box className={classes.header}>
        <TextField
          placeholder="Search"
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={classes.search}
        />
      </Box>

      <TableContainer component={Paper} sx={{ border: "1px solid #ddd", borderTop: 0 }}>
        <Table size="small">
          <TableHead className={classes.tableHeader}>{headerCells}</TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, color: "#666" }}>
                  No data
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className={classes.tableRow}>
                  <TableCell padding="checkbox" className={classes.checkboxCell}>
                    <Checkbox size="small" checked={selected.includes(row.id)} onChange={() => onToggleRow(row.id)} />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align} style={{ width: col.width }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className={classes.actionCell}>
                    <IconButton size="small" className={classes.actionButton} onClick={() => onEdit(row)}><EditIcon /></IconButton>
                    <IconButton size="small" className={classes.actionButton} onClick={() => onDelete(row)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className={classes.footer}>
        <Box className={classes.footerLeft}>
          <IconButton className={classes.footerButton} title="Add" onClick={onAdd}><AddIcon /></IconButton>
          <IconButton className={classes.footerButton} title="Settings" onClick={onOpenSettings}><SettingsIcon /></IconButton>
        </Box>
        <Box className={classes.pagination}>Page 1 of 1 {'>>'} 50</Box>
      </Box>
    </Box>
  );
};

export default SettingsTable;
