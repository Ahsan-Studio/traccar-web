import { Typography, TextField, Box } from '@mui/material';
import { sectionHeading, fieldSx } from './cpanelTabHelpers';

const TemplatesTab = ({ attr, updateAttribute }) => (
  <>
    <Typography sx={sectionHeading}>Notification Templates</Typography>
    <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mb: 2 }}>
      Configure email notification templates. Templates use variables that are replaced with actual values when notifications are sent.
    </Typography>
    {[
      { label: 'Device Online', key: 'templateDeviceOnline' },
      { label: 'Device Offline', key: 'templateDeviceOffline' },
      { label: 'Device Moving', key: 'templateDeviceMoving' },
      { label: 'Device Stopped', key: 'templateDeviceStopped' },
      { label: 'Device Overspeed', key: 'templateDeviceOverspeed' },
      { label: 'Geofence Enter', key: 'templateGeofenceEnter' },
      { label: 'Geofence Exit', key: 'templateGeofenceExit' },
      { label: 'Ignition On', key: 'templateIgnitionOn' },
      { label: 'Ignition Off', key: 'templateIgnitionOff' },
      { label: 'Maintenance', key: 'templateMaintenance' },
      { label: 'Alarm', key: 'templateAlarm' },
      { label: 'Account Expiring', key: 'templateAccountExpiring' },
      { label: 'Device Expiring', key: 'templateDeviceExpiring' },
    ].map((tpl) => (
      <Box key={tpl.key} sx={{ mb: 2, p: 1.5, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
        <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>{tpl.label}</Typography>
        <TextField
          label="Subject" size="small" fullWidth
          value={attr(`${tpl.key}Subject`)}
          onChange={(e) => updateAttribute(`${tpl.key}Subject`, e.target.value)}
          sx={{ ...fieldSx, mb: 0.5 }} inputProps={{ maxLength: 100 }}
        />
        <TextField
          label="Message" size="small" fullWidth multiline rows={2}
          value={attr(`${tpl.key}Message`)}
          onChange={(e) => updateAttribute(`${tpl.key}Message`, e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 2000 }}
        />
      </Box>
    ))}
    <Typography variant="caption" sx={{ color: '#666', fontSize: 10, display: 'block', mt: 1 }}>
      Available variables: {'{device.name}'}, {'{device.uniqueId}'}, {'{device.status}'}, {'{event.type}'}, {'{event.geofence}'}, {'{event.alarm}'}, {'{position.speed}'}, {'{position.address}'}, {'{user.name}'}, {'{user.email}'}
    </Typography>
  </>
);

export default TemplatesTab;
