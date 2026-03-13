import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const LogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logContent, setLogContent] = useState('');
  const [viewLoading, setViewLoading] = useState(false);

  const sectionHeading = { fontSize: 13, fontWeight: 600, color: '#1976d2', mt: 1, mb: 1 };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/server/logs');
      if (res.ok) {
        setLogs(await res.json());
      } else {
        setLogs([{ name: 'traccar.log', size: '—', modified: new Date().toISOString() }]);
      }
    } catch {
      setLogs([{ name: 'traccar.log', size: '—', modified: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const viewLog = async (logName) => {
    setViewLoading(true);
    setSelectedLog(logName);
    try {
      const res = await fetch(`/api/server/logs/${encodeURIComponent(logName)}?tail=500`);
      if (res.ok) {
        setLogContent(await res.text());
      } else {
        setLogContent('Unable to load log file. The API endpoint may not be available.');
      }
    } catch {
      setLogContent('Unable to load log file. The API endpoint may not be available.');
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <>
      <Typography sx={sectionHeading}>Log Files</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: 14 }} />} onClick={fetchLogs} sx={{ fontSize: 10, textTransform: 'none' }}>
          Reload
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
      ) : (
        <TableContainer>
          <Table size="small" sx={{
            '& .MuiTableCell-head': { fontWeight: 600, fontSize: 11, backgroundColor: '#e9ecef', padding: '5px 8px' },
            '& .MuiTableCell-body': { fontSize: 11, padding: '4px 8px' },
          }}>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Modified</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{log.name}</TableCell>
                  <TableCell>{log.modified ? new Date(log.modified).toLocaleString() : '—'}</TableCell>
                  <TableCell>{log.size || '—'}</TableCell>
                  <TableCell align="center">
                    <Button size="small" onClick={() => viewLog(log.name)} sx={{ fontSize: 10, textTransform: 'none' }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#999' }}>No log files found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedLog && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 1 }}>
            {selectedLog} (last 500 lines)
          </Typography>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
          ) : (
            <Box sx={{
              p: 1.5, backgroundColor: '#1e1e1e', color: '#d4d4d4', borderRadius: 1,
              fontFamily: 'monospace', fontSize: 10, lineHeight: 1.5,
              maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {logContent}
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default LogsTab;
