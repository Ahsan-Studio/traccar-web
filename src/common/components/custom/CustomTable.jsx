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
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { makeStyles } from "tss-react/mui";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";
import { CustomCheckbox } from "./index";

const useStyles = makeStyles()(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  toolbar: {
    display: 'flex',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      height: '26px',
      fontSize: '11px',
      '& fieldset': {
        border: '1px solid #f5f5f5',
      },
      '&:hover fieldset': {
        border: '1px solid #e0e0e0',
      },
    },
  },
  actionButton: {
    width: '28px',
    height: '28px',
    padding: '6px',
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
    border: '1px solid #f5f5f5',
    '&:hover': {
      backgroundColor: '#ffffff',
    },
  },
  buttonIcon: {
    width: '14px',
    height: '14px',
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    minHeight: 0,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    "& .MuiTableRow-root": {
      height: '26px',
    },
    "& .MuiTableCell-root": {
      fontSize: 11,
      fontWeight: 500,
      height: '26px',
      padding: '0px 8px',
      borderBottom: '1px solid #e0e0e0',
      borderLeft: 0,
      borderRight: 0,
      color: "#444",
    },
  },
  tableRow: {
    backgroundColor: "#fff",
    maxHeight: '28px',
    height: '28px',
    cursor: 'pointer',
    "&:hover": {
      backgroundColor: "#fafafa",
    },
    "& .MuiTableCell-root": {
      fontSize: 11,
      padding: "0px 8px",
      height: '28px',
      maxHeight: '28px',
      borderBottom: '1px solid #f5f5f5',
      borderLeft: 0,
      borderRight: 0,
      color: "#444",
      lineHeight: '28px',
    },
  },
  checkboxCell: {
    width: 36,
    padding: "4px 6px 0px 6px !important",
    verticalAlign: "middle !important",
    textAlign: "center",
  },
  footer: {
    flexShrink: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: '30px',
    padding: '0 10px',
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #e0e0e0',
  },
  footerLeft: {
    display: "flex",
    gap: '2px',
    alignItems: 'center',
  },
  footerButton: {
    width: '22px',
    height: '22px',
    padding: '2px',
    "& .MuiSvgIcon-root": {
      fontSize: 14,
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
 * Reusable custom table component for settings and data management
 * 
 * @param {Array} rows - Array of data objects to display
 * @param {Array} columns - Column definitions: [{ key, label, align, width, render?: (row)=>node }]
 * @param {Boolean} loading - Show loading spinner
 * @param {Array} selected - Array of selected row IDs
 * @param {Function} onToggleRow - Callback when row checkbox is toggled
 * @param {Function} onToggleAll - Callback when header checkbox is toggled
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 * @param {String} search - Search input value
 * @param {Function} onSearchChange - Callback when search input changes
 * @param {Function} onAdd - Callback when add button is clicked
 * @param {Function} onRefresh - Callback when refresh button is clicked
 * @param {Function} onOpenSettings - Callback when settings button is clicked
 * @param {Function} customActions - Function that returns custom action buttons for each row: (row) => ReactNode
 * @param {Boolean} showSearch - Show/hide search input (default: true). Set to false to disable search
 * @param {Boolean} hideToolbar - Hide entire toolbar (default: false). Set to true to hide toolbar completely
 * @param {Boolean} hideTable - Hide table body (for grouped view header only)
 * @param {Boolean} hideHeader - Hide table header row
 * @param {Boolean} hideActions - Hide footer action buttons
 * @param {Function} onRowClick - Callback when a table row is clicked: (row) => void
 * 
 * @example
 * // With search (default)
 * <CustomTable rows={data} columns={cols} search={search} onSearchChange={setSearch} />
 * 
 * // Without search
 * <CustomTable rows={data} columns={cols} showSearch={false} />
 * 
 * // Without toolbar
 * <CustomTable rows={data} columns={cols} hideToolbar={true} />
 * 
 * // With custom actions
 * <CustomTable rows={data} columns={cols} customActions={(row) => <IconButton>...</IconButton>} />
 * 
 * // With row click handler
 * <CustomTable rows={data} columns={cols} onRowClick={(row) => console.log('Clicked:', row)} />
 */
const CustomTable = ({
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
  onRefresh = () => {},
  onOpenGroups,
  onOpenSettings = () => {},
  onImport,
  onExport,
  onBulkDelete,
  customActions,
  showSearch = true,
  hideToolbar = false,
  hideTable = false,
  hideHeader = false,
  hideActions = false,
  onRowClick,
})  => {
  const { classes } = useStyles();

  const allChecked = rows.length > 0 && selected.length === rows.length;
  const indeterminate = selected.length > 0 && selected.length < rows.length;

  const headerCells = useMemo(() => (
    <TableRow>
      <TableCell padding="checkbox" className={classes.checkboxCell}>
        <CustomCheckbox 
          checked={allChecked} 
          indeterminate={indeterminate} 
          onChange={onToggleAll} 
        />
      </TableCell>
      {columns.map((col) => (
        <TableCell key={col.key} align={col.align} style={{ width: col.width }}>{col.label}</TableCell>
      ))}
      <TableCell className={classes.actionCell}></TableCell>
    </TableRow>
  ), [columns, allChecked, indeterminate, onToggleAll, classes]);

  return (
    <Box className={classes.container}>
      {/* Toolbar with search and action buttons in one row */}
      {!hideToolbar && (
        <Box className={classes.toolbar}>
          {showSearch && (
            <TextField
              className={classes.searchField}
              placeholder="Search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <img 
                      src="/img/theme/search.svg" 
                      alt="Search" 
                      className={classes.buttonIcon}
                    />
                  </InputAdornment>
                ),
              }}
            />
          )}
          <IconButton 
            className={classes.actionButton}
            onClick={onRefresh}
            title="Refresh"
          >
            <img 
              src="/img/theme/refresh.svg" 
              alt="Refresh" 
              className={classes.buttonIcon}
            />
          </IconButton>
          <IconButton 
            className={classes.actionButton}
            onClick={onAdd}
            title="Add New"
          >
            <img 
              src="/img/theme/create.svg" 
              alt="Add" 
              className={classes.buttonIcon}
            />
          </IconButton>
          {onOpenGroups && (
            <IconButton 
              className={classes.actionButton}
              onClick={onOpenGroups}
              title="Manage Groups"
            >
              <img 
                src="/img/theme/groups.svg" 
                alt="Groups" 
                className={classes.buttonIcon}
              />
            </IconButton>
          )}
          {onImport && (
            <IconButton 
              className={classes.actionButton}
              onClick={onImport}
              title="Import"
            >
              <img 
                src="/img/theme/import.svg" 
                alt="Import" 
                className={classes.buttonIcon}
              />
            </IconButton>
          )}
          {onExport && (
            <IconButton 
              className={classes.actionButton}
              onClick={onExport}
              title="Export"
            >
              <img 
                src="/img/theme/export.svg" 
                alt="Export" 
                className={classes.buttonIcon}
              />
            </IconButton>
          )}
          <IconButton 
            className={classes.actionButton}
            onClick={() => {
              if (selected.length > 0 && window.confirm(`Delete ${selected.length} selected item(s)?`)) {
                if (onBulkDelete) {
                  onBulkDelete(selected);
                }
              }
            }}
            title="Delete Selected"
            disabled={selected.length === 0}
          >
            <img 
              src="/img/theme/remove.svg" 
              alt="Delete" 
              className={classes.buttonIcon}
              style={{ opacity: selected.length === 0 ? 0.5 : 1 }}
            />
          </IconButton>
        </Box>
      )}

      {!hideTable && (
        <TableContainer 
          component={Paper} 
          className={classes.tableContainer}
          sx={{ border: 0, boxShadow: 'none' }}
        >
          <Table size="small">
            {!hideHeader && <TableHead className={classes.tableHeader}>{headerCells}</TableHead>}
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
                  <TableRow 
                    key={row.id} 
                    className={classes.tableRow}
                    onClick={(e) => {
                      // Only trigger row click if not clicking on checkbox or action buttons
                      if (
                        onRowClick &&
                        !e.target.closest('.MuiCheckbox-root') &&
                        !e.target.closest('.MuiIconButton-root')
                      ) {
                        onRowClick(row);
                      }
                    }}
                  >
                    <TableCell padding="checkbox" className={classes.checkboxCell}>
                      <CustomCheckbox 
                        checked={selected.includes(row.id)} 
                        onChange={() => onToggleRow(row.id)} 
                      />
                  </TableCell>
                  {columns.map((col) => {
                    let cellContent;
                    if (col.render) {
                      cellContent = col.render(row);
                    } else if (col.format) {
                      cellContent = col.format(row[col.key], row);
                    } else {
                      cellContent = row[col.key];
                    }
                    
                    return (
                      <TableCell key={col.key} align={col.align} style={{ width: col.width }}>
                        {cellContent}
                      </TableCell>
                    );
                  })}
                  <TableCell className={classes.actionCell} sx={{ whiteSpace: 'nowrap', width: '60px', textAlign: 'right', paddingRight: '4px !important' }}>
                    <IconButton size="small" onClick={() => onEdit(row)} sx={{ padding: '2px' }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                    {customActions && customActions(row)}
                    <IconButton size="small" onClick={() => onDelete(row)} sx={{ padding: '2px' }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {!hideActions && (
        <Box className={classes.footer}>
          <Box className={classes.footerLeft}>
            <IconButton className={classes.footerButton} title="Add" onClick={onAdd}><AddIcon /></IconButton>
            {onOpenGroups && (
              <IconButton className={classes.footerButton} title="Groups" onClick={onOpenGroups}>
                <FolderIcon />
              </IconButton>
            )}
            <IconButton className={classes.footerButton} title="Refresh" onClick={onRefresh}><RefreshIcon /></IconButton>
            <IconButton className={classes.footerButton} title="Settings" onClick={onOpenSettings}><SettingsIcon /></IconButton>
          </Box>
          <Box className={classes.pagination}>
            <span>Page 1 of 1</span>
            <span style={{ margin: '0 28px' }}>{'<<'}</span>
            <span>50</span>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomTable;
