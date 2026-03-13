import {
  Typography, TextField, Grid, Switch, FormControlLabel,
} from '@mui/material';
import { sectionHeading, fieldSx, selectFieldSx } from './cpanelTabHelpers';

const EmailTab = ({ attr, attrBool, updateAttribute }) => (
  <>
    <Typography sx={sectionHeading}>Email Settings</Typography>
    <TextField
      label="Email Address (From)" size="small" fullWidth
      value={attr('emailFrom')}
      onChange={(e) => updateAttribute('emailFrom', e.target.value)}
      sx={fieldSx} inputProps={{ maxLength: 50 }}
      placeholder="noreply@your-domain.com"
    />
    <TextField
      label="No-Reply Email Address" size="small" fullWidth
      value={attr('emailNoReply')}
      onChange={(e) => updateAttribute('emailNoReply', e.target.value)}
      sx={fieldSx} inputProps={{ maxLength: 50 }}
    />
    <TextField
      label="Email Signature" size="small" fullWidth multiline rows={2}
      value={attr('emailSignature')}
      onChange={(e) => updateAttribute('emailSignature', e.target.value)}
      sx={fieldSx} inputProps={{ maxLength: 200 }}
    />

    <Typography sx={sectionHeading}>SMTP Server</Typography>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={attrBool('smtpEnabled')}
          onChange={(e) => updateAttribute('smtpEnabled', e.target.checked)}
        />
      }
      label={<Typography variant="body2" fontSize={12}>Use SMTP Server</Typography>}
      sx={{ mb: 1 }}
    />
    <TextField
      label="SMTP Server Host" size="small" fullWidth
      value={attr('smtpHost')}
      onChange={(e) => updateAttribute('smtpHost', e.target.value)}
      sx={fieldSx} disabled={!attrBool('smtpEnabled')}
      placeholder="smtp.gmail.com" inputProps={{ maxLength: 50 }}
    />
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <TextField
          label="SMTP Port" size="small" fullWidth type="number"
          value={attr('smtpPort') || '465'}
          onChange={(e) => updateAttribute('smtpPort', e.target.value)}
          sx={fieldSx} disabled={!attrBool('smtpEnabled')}
          inputProps={{ maxLength: 4 }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="SMTP Auth" size="small" fullWidth select
          value={attrBool('smtpAuth') ? 'true' : 'false'}
          onChange={(e) => updateAttribute('smtpAuth', e.target.value === 'true')}
          sx={selectFieldSx} disabled={!attrBool('smtpEnabled')}
          SelectProps={{ native: true }}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="SMTP Security" size="small" fullWidth select
          value={attr('smtpSecurity') || 'ssl'}
          onChange={(e) => updateAttribute('smtpSecurity', e.target.value)}
          sx={selectFieldSx} disabled={!attrBool('smtpEnabled')}
          SelectProps={{ native: true }}
        >
          <option value="none">None</option>
          <option value="ssl">SSL</option>
          <option value="tls">TLS</option>
        </TextField>
      </Grid>
    </Grid>
    <TextField
      label="SMTP Username" size="small" fullWidth
      value={attr('smtpUsername')}
      onChange={(e) => updateAttribute('smtpUsername', e.target.value)}
      sx={fieldSx} disabled={!attrBool('smtpEnabled')}
      inputProps={{ maxLength: 50 }}
    />
    <TextField
      label="SMTP Password" size="small" fullWidth type="password"
      value={attr('smtpPassword')}
      onChange={(e) => updateAttribute('smtpPassword', e.target.value)}
      sx={fieldSx} disabled={!attrBool('smtpEnabled')}
      inputProps={{ maxLength: 80 }}
    />
  </>
);

export default EmailTab;
