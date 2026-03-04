import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Table, TableBody, TableRow, TableCell, CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles()(() => ({
  dialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
  },
  cell: {
    fontSize: '12px',
    padding: '6px 12px',
    borderBottom: '1px solid #eee',
  },
  labelCell: {
    fontSize: '12px',
    padding: '6px 12px',
    borderBottom: '1px solid #eee',
    fontWeight: 600,
    color: '#555',
    width: '140px',
  },
}));

const InfoDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/server')
        .then((r) => r.json())
        .then((data) => setServerInfo(data))
        .catch(() => setServerInfo(null))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const rows = serverInfo
    ? [
        ['Server Version', serverInfo.version || 'N/A'],
        ['Map URL', serverInfo.mapUrl || 'Default'],
        ['Latitude', serverInfo.latitude || 0],
        ['Longitude', serverInfo.longitude || 0],
        ['Zoom', serverInfo.zoom || 0],
        ['12-Hour Format', serverInfo.twelveHourFormat ? 'Yes' : 'No'],
        ['Force Settings', serverInfo.forceSettings ? 'Yes' : 'No'],
        ['Registration', serverInfo.registration ? 'Enabled' : 'Disabled'],
        ['Readonly', serverInfo.readonly ? 'Yes' : 'No'],
      ]
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">System Information</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Table size="small">
            <TableBody>
              {rows.map(([label, value]) => (
                <TableRow key={label}>
                  <TableCell className={classes.labelCell}>{label}</TableCell>
                  <TableCell className={classes.cell}>{String(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Box px={2} py={1.5} sx={{ borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
          <Typography variant="caption" color="text.secondary">
            GPS Tracking System V2 — Powered by Traccar
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InfoDialog;
