import {
  Typography, TextField, Grid, Switch, FormControlLabel,
} from '@mui/material';
import {
 sectionHeading, fieldSx, selectFieldSx, YesNoSelect 
} from './cpanelTabHelpers';

const UserTab = ({ server, attr, attrBool, updateAttribute, updateField }) => (
  <>
    <Typography sx={sectionHeading}>Login</Typography>
    <TextField
      label="Page After Admin Login" size="small" fullWidth select
      value={attr('pageAfterLogin') || 'account'}
      onChange={(e) => updateAttribute('pageAfterLogin', e.target.value)}
      sx={selectFieldSx}
      SelectProps={{ native: true }}
    >
      <option value="account">Account (Tracking Page)</option>
      <option value="cpanel">Control Panel</option>
    </TextField>
    <YesNoSelect label="Show/Hide Password Button" attrKey="showPasswordToggle" attrBool={attrBool} updateAttribute={updateAttribute} />

    <Typography sx={sectionHeading}>Create Account</Typography>
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={!!server.registration}
          onChange={(e) => updateField('registration', e.target.checked)}
        />
      }
      label={<Typography variant="body2" fontSize={12}>User Registration via Login Dialog</Typography>}
      sx={{ mb: 1 }}
    />
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <YesNoSelect label="Expire Account After Registration" attrKey="expireAfterRegistration" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Expire Days" size="small" fullWidth type="number"
          value={attr('expireAfterDays') || '30'}
          onChange={(e) => updateAttribute('expireAfterDays', e.target.value)}
          sx={fieldSx}
          disabled={!attrBool('expireAfterRegistration')}
        />
      </Grid>
    </Grid>

    <Typography sx={sectionHeading}>Default Settings for New Users</Typography>
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <TextField
          label="Default Language" size="small" fullWidth select
          value={attr('userDefaultLanguage') || 'en'}
          onChange={(e) => updateAttribute('userDefaultLanguage', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="en">English</option>
          <option value="id">Bahasa Indonesia</option>
          <option value="ar">Arabic</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="th">Thai</option>
          <option value="tr">Turkish</option>
          <option value="vi">Vietnamese</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Unit of Distance" size="small" fullWidth select
          value={attr('userDefaultDistanceUnit') || 'km'}
          onChange={(e) => updateAttribute('userDefaultDistanceUnit', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="km">Kilometer</option>
          <option value="mi">Mile</option>
          <option value="nm">Nautical Mile</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Unit of Capacity" size="small" fullWidth select
          value={attr('userDefaultCapacityUnit') || 'liter'}
          onChange={(e) => updateAttribute('userDefaultCapacityUnit', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="liter">Liter</option>
          <option value="gallon">US Gallon</option>
          <option value="impGallon">Imperial Gallon</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Unit of Temperature" size="small" fullWidth select
          value={attr('userDefaultTempUnit') || 'celsius'}
          onChange={(e) => updateAttribute('userDefaultTempUnit', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="celsius">Celsius</option>
          <option value="fahrenheit">Fahrenheit</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Currency" size="small" fullWidth
          value={attr('userDefaultCurrency') || 'USD'}
          onChange={(e) => updateAttribute('userDefaultCurrency', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 3 }}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Timezone" size="small" fullWidth
          value={attr('userDefaultTimezone') || 'UTC'}
          onChange={(e) => updateAttribute('userDefaultTimezone', e.target.value)}
          sx={fieldSx}
          placeholder="Asia/Jakarta"
        />
      </Grid>
    </Grid>

    <Typography sx={sectionHeading}>Feature Access Defaults</Typography>
    <Grid container spacing={1}>
      {[
        { label: 'Add Objects', key: 'userCanAddObjects' },
        { label: 'Edit Objects', key: 'userCanEditObjects' },
        { label: 'Delete Objects', key: 'userCanDeleteObjects' },
        { label: 'Clear History', key: 'userCanClearHistory' },
        { label: 'KML', key: 'userCanKml' },
        { label: 'Dashboard', key: 'userCanDashboard' },
        { label: 'History', key: 'userCanHistory' },
        { label: 'Reports', key: 'userCanReports' },
        { label: 'Tasks', key: 'userCanTasks' },
        { label: 'Logbook', key: 'userCanLogbook' },
        { label: 'DTC', key: 'userCanDtc' },
        { label: 'Maintenance', key: 'userCanMaintenance' },
        { label: 'Expenses', key: 'userCanExpenses' },
        { label: 'Object Control', key: 'userCanObjectControl' },
        { label: 'Image Gallery', key: 'userCanGallery' },
        { label: 'Chat', key: 'userCanChat' },
        { label: 'Sub Accounts', key: 'userCanSubAccounts' },
        { label: 'API', key: 'userCanApi' },
      ].map((f) => (
        <Grid item xs={3} key={f.key}>
          <YesNoSelect label={f.label} attrKey={f.key} attrBool={attrBool} updateAttribute={updateAttribute} />
        </Grid>
      ))}
    </Grid>

    <Typography sx={sectionHeading}>Object Limits</Typography>
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <YesNoSelect label="Object Limit" attrKey="userObjectLimit" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Max Objects" size="small" fullWidth type="number"
          value={attr('userMaxObjects') || '10'}
          onChange={(e) => updateAttribute('userMaxObjects', e.target.value)}
          sx={fieldSx}
          disabled={!attrBool('userObjectLimit')}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Object Date Limit (days after reg.)" size="small" fullWidth type="number"
          value={attr('userObjectDateLimit') || ''}
          onChange={(e) => updateAttribute('userObjectDateLimit', e.target.value)}
          sx={fieldSx}
        />
      </Grid>
    </Grid>

    <Typography sx={sectionHeading}>Notifications</Typography>
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <YesNoSelect label="Remind Expiring Objects" attrKey="remindExpiringObjects" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Days Before Expiry" size="small" fullWidth type="number"
          value={attr('remindExpiringObjectsDays') || '7'}
          onChange={(e) => updateAttribute('remindExpiringObjectsDays', e.target.value)}
          sx={fieldSx}
          disabled={!attrBool('remindExpiringObjects')}
        />
      </Grid>
      <Grid item xs={6}>
        <YesNoSelect label="Remind Expiring Account" attrKey="remindExpiringAccount" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Days Before Expiry" size="small" fullWidth type="number"
          value={attr('remindExpiringAccountDays') || '7'}
          onChange={(e) => updateAttribute('remindExpiringAccountDays', e.target.value)}
          sx={fieldSx}
          disabled={!attrBool('remindExpiringAccount')}
        />
      </Grid>
    </Grid>

    <Typography sx={sectionHeading}>Other</Typography>
    <Grid container spacing={1}>
      <Grid item xs={3}>
        <YesNoSelect label="Show SIM Number" attrKey="showSimNumber" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={3}>
        <YesNoSelect label="Schedule Reports" attrKey="scheduleReports" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={3}>
        <YesNoSelect label="Default Templates" attrKey="objectControlDefaultTemplates" attrBool={attrBool} updateAttribute={updateAttribute} />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max Markers" size="small" fullWidth type="number"
          value={attr('maxMarkers') || '500'}
          onChange={(e) => updateAttribute('maxMarkers', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 5 }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max Routes" size="small" fullWidth type="number"
          value={attr('maxRoutes') || '10'}
          onChange={(e) => updateAttribute('maxRoutes', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 5 }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max Zones" size="small" fullWidth type="number"
          value={attr('maxZones') || '100'}
          onChange={(e) => updateAttribute('maxZones', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 5 }}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max Emails Daily" size="small" fullWidth type="number"
          value={attr('maxEmailsDaily') || '100'}
          onChange={(e) => updateAttribute('maxEmailsDaily', e.target.value)}
          sx={fieldSx}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max SMS Daily" size="small" fullWidth type="number"
          value={attr('maxSmsDaily') || '50'}
          onChange={(e) => updateAttribute('maxSmsDaily', e.target.value)}
          sx={fieldSx}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max Webhook Daily" size="small" fullWidth type="number"
          value={attr('maxWebhookDaily') || '100'}
          onChange={(e) => updateAttribute('maxWebhookDaily', e.target.value)}
          sx={fieldSx}
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          label="Max API Daily" size="small" fullWidth type="number"
          value={attr('maxApiDaily') || '1000'}
          onChange={(e) => updateAttribute('maxApiDaily', e.target.value)}
          sx={fieldSx}
        />
      </Grid>
    </Grid>
  </>
);

export default UserTab;
