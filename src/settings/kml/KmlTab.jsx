import { useState, useCallback } from 'react';
import {
 Box, Typography, IconButton, Tooltip 
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DownloadIcon from '@mui/icons-material/Download';
import { CustomButton } from '../../common/components/custom';
import { useEffectAsync } from '../../reactHelper';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB max total

const useStyles = makeStyles()((theme) => ({
  container: {
    padding: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: '#f5f5f5',
  },
  description: {
    fontSize: 11,
    color: '#666',
  },
  sizeInfo: {
    fontSize: 11,
    color: '#999',
  },
  listContainer: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(1),
  },
  kmlItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: '#f8f8f8',
    },
  },
  kmlInfo: {
    flex: 1,
    minWidth: 0,
  },
  kmlName: {
    fontSize: 12,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  kmlMeta: {
    fontSize: 10,
    color: '#999',
  },
  actions: {
    display: 'flex',
    gap: 2,
  },
  actionButton: {
    padding: 4,
    '& .MuiSvgIcon-root': { fontSize: 16 },
  },
  uploadArea: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
}));

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const KmlTab = () => {
  const { classes } = useStyles();
  const [kmlFiles, setKmlFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const totalSize = kmlFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0);

  // Fetch KML files list
  useEffectAsync(async () => {
    try {
      const response = await fetchOrThrow('/api/kml');
      const data = await response.json();
      setKmlFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch KML files:', error);
    }
  }, []);

  const handleToggleActive = useCallback(async (kml) => {
    try {
      await fetchOrThrow(`/api/kml/${kml.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kml, active: !kml.active }),
      });
      setKmlFiles((prev) => prev.map((f) => (f.id === kml.id ? { ...f, active: !f.active } : f)));
    } catch (error) {
      console.error('Failed to toggle KML:', error);
    }
  }, []);

  const handleDelete = useCallback(async (kml) => {
    if (!window.confirm(`Delete KML file "${kml.name}"?`)) return;
    try {
      await fetchOrThrow(`/api/kml/${kml.id}`, { method: 'DELETE' });
      setKmlFiles((prev) => prev.filter((f) => f.id !== kml.id));
    } catch (error) {
      console.error('Failed to delete KML:', error);
    }
  }, []);

  const handleDownload = useCallback((kml) => {
    window.location.assign(`/api/kml/${kml.id}/file`);
  }, []);

  const handleUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.kml') && !file.name.toLowerCase().endsWith('.kmz')) {
      alert('Please select a .kml or .kmz file');
      return;
    }

    // Check size limit
    if (totalSize + file.size > MAX_TOTAL_SIZE) {
      alert(`Total KML size would exceed ${formatFileSize(MAX_TOTAL_SIZE)} limit`);
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = e.target.result.split(',')[1];
          const response = await fetchOrThrow('/api/kml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name.replace(/\.(kml|kmz)$/i, ''),
              fileName: file.name,
              fileSize: file.size,
              kmlFile: base64Content,
              active: true,
            }),
          });
          const created = await response.json();
          setKmlFiles((prev) => [...prev, created]);
        } catch (error) {
          console.error('Failed to upload KML:', error);
          alert('Failed to upload KML file');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      setUploading(false);
    }
  }, [totalSize]);

  return (
    <Box className={classes.container}>
      <Box className={classes.header}>
        <Typography className={classes.description}>
          Upload KML/KMZ files to display custom overlays on the map.
        </Typography>
        <Typography className={classes.sizeInfo}>
          {formatFileSize(totalSize)} / {formatFileSize(MAX_TOTAL_SIZE)}
        </Typography>
      </Box>

      <Box className={classes.listContainer}>
        {kmlFiles.length === 0 ? (
          <Box className={classes.emptyState}>
            No KML files uploaded yet. Click upload to add one.
          </Box>
        ) : (
          kmlFiles.map((kml) => (
            <Box key={kml.id} className={classes.kmlItem}>
              <Tooltip title={kml.active ? 'Visible on map' : 'Hidden'}>
                <IconButton
                  className={classes.actionButton}
                  onClick={() => handleToggleActive(kml)}
                  size="small"
                >
                  {kml.active ? (
                    <VisibilityIcon style={{ color: '#4caf50' }} />
                  ) : (
                    <VisibilityOffIcon style={{ color: '#ccc' }} />
                  )}
                </IconButton>
              </Tooltip>
              <Box className={classes.kmlInfo}>
                <Typography className={classes.kmlName}>{kml.name}</Typography>
                <Typography className={classes.kmlMeta}>
                  {kml.fileName} — {formatFileSize(kml.fileSize || 0)}
                </Typography>
              </Box>
              <Box className={classes.actions}>
                <Tooltip title="Download">
                  <IconButton
                    className={classes.actionButton}
                    onClick={() => handleDownload(kml)}
                    size="small"
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    className={classes.actionButton}
                    onClick={() => handleDelete(kml)}
                    size="small"
                  >
                    <DeleteIcon style={{ color: '#e53935' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Box className={classes.uploadArea}>
        <CustomButton
          variant="outlined"
          disabled={uploading}
          onClick={() => document.getElementById('kml-file-input').click()}
          size="small"
        >
          <UploadFileIcon style={{ fontSize: 14, marginRight: 4 }} />
          {uploading ? 'Uploading...' : 'Upload KML/KMZ'}
        </CustomButton>
        <input
          id="kml-file-input"
          type="file"
          accept=".kml,.kmz"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </Box>
    </Box>
  );
};

export default KmlTab;
