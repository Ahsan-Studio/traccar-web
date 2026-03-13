import { useState } from 'react';
import {
  Typography, TextField, Grid, Box, Button, CircularProgress,
} from '@mui/material';
import { sectionHeading, fieldSx, selectFieldSx } from './cpanelTabHelpers';

const ToolsTab = ({ showSnackbar, attr, attrBool, updateAttribute }) => {
  const [executing, setExecuting] = useState({});

  const YesNoSelect = ({ label, attrKey }) => (
    <TextField
      label={label} size="small" fullWidth select
      value={attrBool(attrKey) ? 'true' : 'false'}
      onChange={(e) => updateAttribute(attrKey, e.target.value === 'true')}
      sx={selectFieldSx}
      SelectProps={{ native: true }}
    >
      <option value="true">Yes</option>
      <option value="false">No</option>
    </TextField>
  );

  const executeCleanup = async (type) => {
    if (!window.confirm(`Execute ${type} cleanup now? This cannot be undone.`)) return;
    setExecuting((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await fetch(`/api/server/cleanup?type=${type}`, { method: 'POST' });
      if (res.ok) {
        showSnackbar(`${type} cleanup completed`);
      } else {
        showSnackbar(`Cleanup failed: ${res.statusText}`, 'error');
      }
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setExecuting((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <>
      <Typography sx={sectionHeading}>Server Cleanup</Typography>
      <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mb: 2 }}>
        Cleanup tools to remove old data from the database. Use with caution — these operations cannot be undone.
      </Typography>

      {[
        { type: 'users', label: 'Cleanup Users', desc: 'Delete users who have not logged in for N days', daysKey: 'cleanupUsersDays', autoKey: 'cleanupUsersAuto', hasDays: true },
        { type: 'objectsNotActivated', label: 'Cleanup Objects Not Activated', desc: 'Remove objects not activated for N days', daysKey: 'cleanupObjectsNotActivatedDays', autoKey: 'cleanupObjectsNotActivatedAuto', hasDays: true },
        { type: 'objectsNotUsed', label: 'Cleanup Objects Not Used', desc: 'Remove objects that are no longer in use', autoKey: 'cleanupObjectsNotUsedAuto', hasDays: false },
        { type: 'dbJunk', label: 'Cleanup DB Junk', desc: 'Remove orphaned records and optimize database', autoKey: 'cleanupDbJunkAuto', hasDays: false },
      ].map((task) => (
        <Box key={task.type} sx={{ mb: 2, p: 1.5, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
          <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>{task.label}</Typography>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>{task.desc}</Typography>
          <Grid container spacing={1} alignItems="center">
            {task.hasDays && (
              <Grid item xs={3}>
                <TextField
                  label="Days" size="small" fullWidth type="number"
                  value={attr(task.daysKey) || '90'}
                  onChange={(e) => updateAttribute(task.daysKey, e.target.value)}
                  sx={fieldSx}
                />
              </Grid>
            )}
            <Grid item xs={3}>
              <YesNoSelect label="Auto Execute" attrKey={task.autoKey} />
            </Grid>
            <Grid item xs={3}>
              <Button
                size="small" variant="outlined" color="warning"
                onClick={() => executeCleanup(task.type)}
                disabled={!!executing[task.type]}
                startIcon={executing[task.type] ? <CircularProgress size={14} /> : null}
                sx={{ fontSize: 10, textTransform: 'none' }}
              >
                Execute Now
              </Button>
            </Grid>
          </Grid>
        </Box>
      ))}
    </>
  );
};

export default ToolsTab;
