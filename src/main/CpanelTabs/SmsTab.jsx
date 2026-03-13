import {
  Typography, TextField, Switch, FormControlLabel,
} from '@mui/material';
import { sectionHeading, fieldSx, selectFieldSx } from './cpanelTabHelpers';

const SmsTab = ({ attr, attrBool, updateAttribute }) => (
  <>
    <Typography sx={sectionHeading}>SMS Gateway</Typography>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={attrBool('smsEnabled')}
          onChange={(e) => updateAttribute('smsEnabled', e.target.checked)}
        />
      }
      label={<Typography variant="body2" fontSize={12}>Enable SMS Gateway</Typography>}
      sx={{ mb: 1 }}
    />
    <TextField
      label="SMS Gateway Type" size="small" fullWidth select
      value={attr('smsGatewayType') || 'http'}
      onChange={(e) => updateAttribute('smsGatewayType', e.target.value)}
      sx={selectFieldSx} disabled={!attrBool('smsEnabled')}
      SelectProps={{ native: true }}
    >
      <option value="app">Mobile Application</option>
      <option value="http">HTTP</option>
    </TextField>
    <TextField
      label="SMS Number Filter (country codes)" size="small" fullWidth
      value={attr('smsNumberFilter')}
      onChange={(e) => updateAttribute('smsNumberFilter', e.target.value)}
      sx={fieldSx} disabled={!attrBool('smsEnabled')}
      helperText="Comma-separated country codes, e.g. +62, +1, +44"
    />

    {attr('smsGatewayType') === 'app' && attrBool('smsEnabled') && (
      <>
        <Typography sx={sectionHeading}>Mobile Application</Typography>
        <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mb: 1 }}>
          The Mobile SMS Gateway application runs on an Android phone connected to the server. It receives SMS commands via the API and sends them via the phone's SMS capability.
        </Typography>
        <TextField
          label="SMS Gateway Identifier" size="small" fullWidth disabled
          value={attr('smsGatewayId') || 'Auto-generated'}
          sx={fieldSx}
        />
      </>
    )}
    {(attr('smsGatewayType') === 'http' || !attr('smsGatewayType')) && attrBool('smsEnabled') && (
      <>
        <Typography sx={sectionHeading}>HTTP Gateway</Typography>
        <Typography variant="body2" sx={{ fontSize: 11, color: '#666', mb: 1 }}>
          Configure an HTTP-based SMS gateway. The server will send HTTP requests to this URL to deliver SMS messages.
        </Typography>
        <TextField
          label="SMS Gateway URL" size="small" fullWidth multiline rows={3}
          value={attr('smsGatewayHttpUrl')}
          onChange={(e) => updateAttribute('smsGatewayHttpUrl', e.target.value)}
          sx={fieldSx}
        />
        <Typography variant="caption" sx={{ color: '#666', fontSize: 10 }}>
          Variables: {'{number}'}, {'{message}'}
        </Typography>
      </>
    )}
  </>
);

export default SmsTab;
