import {
 Box, TextField, Typography, Button 
} from '@mui/material';
import {
  sectionHeading, formFieldSx, formSelectSx,
  FormRow, timeOptions,
} from './cpanelTabHelpers';

const ServerTab = ({ server, attr, updateAttribute, showSnackbar }) => {
  // Reset API key handler
  const handleResetApiKey = async () => {
    if (!window.confirm('Are you sure you want to reset the server API key? Existing integrations using the old key will stop working.')) return;
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    updateAttribute('apiKey', newKey);
    showSnackbar('API key reset — press Save to persist');
  };

  return (
    <Box sx={{ maxWidth: 750 }}>
      {/* ── Information ── */}
      <Typography sx={sectionHeading}>Information</Typography>
      <FormRow label="Server IP">
        <TextField
          size="small" fullWidth
          value={`${window.location.hostname} - ${server.version || 'Unknown'}`}
          sx={formFieldSx}
          inputProps={{ readOnly: true, style: { fontSize: 12 } }}
          InputProps={{ sx: { backgroundColor: '#f5f5f5' } }}
        />
      </FormRow>

      {/* ── API ── */}
      <Typography sx={sectionHeading}>API</Typography>
      <FormRow label="Server API key">
        <TextField
          size="small" fullWidth
          value={attr('apiKey')}
          sx={formFieldSx}
          inputProps={{ readOnly: true, style: { fontSize: 12, fontFamily: 'monospace' } }}
          InputProps={{ sx: { backgroundColor: '#f5f5f5' } }}
        />
      </FormRow>
      <FormRow label="Reset Server API key">
        <Button
          variant="outlined" size="small"
          onClick={handleResetApiKey}
          sx={{ fontSize: 11, textTransform: 'none', minWidth: 80 }}
        >
          Reset
        </Button>
      </FormRow>
      <FormRow label="Restrict Server API access by IP" helperText="Comma-separated IPs, leave empty for no restriction">
        <TextField
          size="small" fullWidth
          value={attr('apiIpRestriction')}
          onChange={(e) => updateAttribute('apiIpRestriction', e.target.value)}
          sx={formFieldSx}
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>

      {/* ── URL Addresses ── */}
      <Typography sx={sectionHeading}>URL addresses</Typography>
      <FormRow label="Login dialog URL">
        <TextField
          size="small" fullWidth
          value={attr('loginUrl')}
          onChange={(e) => updateAttribute('loginUrl', e.target.value)}
          sx={formFieldSx} placeholder="https://your-domain.com"
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>
      <FormRow label="Help page button URL">
        <TextField
          size="small" fullWidth
          value={attr('helpUrl')}
          onChange={(e) => updateAttribute('helpUrl', e.target.value)}
          sx={formFieldSx} placeholder="http://full_address_here"
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>
      <FormRow label="Contact page URL">
        <TextField
          size="small" fullWidth
          value={attr('contactUrl')}
          onChange={(e) => updateAttribute('contactUrl', e.target.value)}
          sx={formFieldSx} placeholder="http://full_address_here"
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>
      <FormRow label="Shop page URL">
        <TextField
          size="small" fullWidth
          value={attr('shopUrl')}
          onChange={(e) => updateAttribute('shopUrl', e.target.value)}
          sx={formFieldSx} placeholder="http://full_address_here"
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>
      <FormRow label="SMS Gateway application URL">
        <TextField
          size="small" fullWidth
          value={attr('smsGatewayUrl')}
          onChange={(e) => updateAttribute('smsGatewayUrl', e.target.value)}
          sx={formFieldSx} placeholder="http://full_address_here"
          inputProps={{ style: { fontSize: 12 } }}
        />
      </FormRow>

      {/* ── Objects ── */}
      <Typography sx={sectionHeading}>Objects</Typography>
      <FormRow
        label="Object connection timeout, resets connection and GPS status"
        labelWidth="55%"
      >
        <TextField
          size="small" select
          value={String(attr('deviceTimeout') || '5')}
          onChange={(e) => updateAttribute('deviceTimeout', e.target.value)}
          sx={{ ...formSelectSx, minWidth: 100 }}
          SelectProps={{ native: true }}
        >
          {[1, 2, 3, 4, 5].map((m) => <option key={m} value={String(m)}>{m} min</option>)}
          {[10, 20, 30, 40, 50].map((m) => <option key={m} value={String(m)}>{m} min</option>)}
          {[60, 120, 180, 240, 300].map((m) => <option key={m} value={String(m)}>{Math.round(m / 60)} h</option>)}
          <option value="1440">24 h</option>
          <option value="2880">48 h</option>
        </TextField>
      </FormRow>
      <FormRow
        label="Keep history period (days)"
        helperText="Warning: Changing this value will affect existing data."
        labelWidth="55%"
      >
        <TextField
          size="small"
          value={attr('historyPeriod') || '60'}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            updateAttribute('historyPeriod', v);
          }}
          onKeyDown={(e) => {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          sx={{ ...formFieldSx, width: 100 }}
          inputProps={{ maxLength: 4, inputMode: 'numeric', style: { fontSize: 12 } }}
          placeholder="e.g. 30"
        />
      </FormRow>

      {/* ── Backup ── */}
      <Typography sx={sectionHeading}>Backup</Typography>
      <FormRow label="Send DB backup to e-mail at set UTC time (without history data)" labelWidth="50%">
        <TextField
          size="small" select
          value={attr('backupTime') || '00:00'}
          onChange={(e) => updateAttribute('backupTime', e.target.value)}
          sx={{ ...formSelectSx, minWidth: 90, flexShrink: 0 }}
          SelectProps={{ native: true }}
        >
          {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </TextField>
        <TextField
          size="small" fullWidth
          value={attr('backupEmail')}
          onChange={(e) => updateAttribute('backupEmail', e.target.value)}
          sx={formFieldSx}
          placeholder="admin@example.com"
          inputProps={{ maxLength: 50, style: { fontSize: 12 } }}
        />
      </FormRow>
    </Box>
  );
};

export default ServerTab;
