import {
  Typography, TextField, Grid, Switch, FormControlLabel,
} from '@mui/material';
import {
 sectionHeading, fieldSx, selectFieldSx, YesNoSelect 
} from './cpanelTabHelpers';

const BillingTab = ({ attr, attrBool, updateAttribute }) => (
  <>
    <Typography sx={sectionHeading}>Billing</Typography>
    <Grid container spacing={1}>
      <Grid item xs={4}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={attrBool('billing')}
              onChange={(e) => updateAttribute('billing', e.target.checked)}
            />
          }
          label={<Typography variant="body2" fontSize={12}>Enable Billing</Typography>}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Gateway" size="small" fullWidth select
          value={attr('billingGateway') || 'paypalv2'}
          onChange={(e) => updateAttribute('billingGateway', e.target.value)}
          sx={selectFieldSx}
          SelectProps={{ native: true }}
        >
          <option value="paypalv2">PayPal v2</option>
          <option value="paypal">PayPal</option>
          <option value="custom">Custom</option>
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Currency" size="small" fullWidth
          value={attr('billingCurrency') || 'USD'}
          onChange={(e) => updateAttribute('billingCurrency', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 4 }}
        />
      </Grid>
    </Grid>
    <YesNoSelect label="Recover Plan from Object Back to Billing" attrKey="billingRecoverPlan" attrBool={attrBool} updateAttribute={updateAttribute} />

    {(attr('billingGateway') === 'paypalv2' || !attr('billingGateway')) && (
      <>
        <Typography sx={sectionHeading}>PayPal v2 Gateway</Typography>
        <TextField
          label="PayPal Account (Email)" size="small" fullWidth
          value={attr('paypalAccount')}
          onChange={(e) => updateAttribute('paypalAccount', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 50 }}
        />
        <TextField
          label="PayPal Client ID" size="small" fullWidth
          value={attr('paypalClientId')}
          onChange={(e) => updateAttribute('paypalClientId', e.target.value)}
          sx={fieldSx}
        />
        <TextField
          label="PayPal Custom" size="small" fullWidth
          value={attr('paypalCustom')}
          onChange={(e) => updateAttribute('paypalCustom', e.target.value)}
          sx={fieldSx}
        />
      </>
    )}
    {attr('billingGateway') === 'paypal' && (
      <>
        <Typography sx={sectionHeading}>PayPal Gateway</Typography>
        <TextField
          label="PayPal Account (Email)" size="small" fullWidth
          value={attr('paypalAccount')}
          onChange={(e) => updateAttribute('paypalAccount', e.target.value)}
          sx={fieldSx} inputProps={{ maxLength: 50 }}
        />
        <TextField
          label="PayPal Custom" size="small" fullWidth
          value={attr('paypalCustom')}
          onChange={(e) => updateAttribute('paypalCustom', e.target.value)}
          sx={fieldSx}
        />
      </>
    )}
    {attr('billingGateway') === 'custom' && (
      <>
        <Typography sx={sectionHeading}>Custom Gateway</Typography>
        <TextField
          label="Custom Gateway URL" size="small" fullWidth multiline rows={3}
          value={attr('billingCustomUrl')}
          onChange={(e) => updateAttribute('billingCustomUrl', e.target.value)}
          sx={fieldSx}
        />
        <Typography variant="caption" sx={{ color: '#666', fontSize: 10 }}>
          Variables: {'{user_email}'}, {'{plan_id}'}, {'{plan_name}'}, {'{plan_price}'}, {'{currency}'}
        </Typography>
      </>
    )}
  </>
);

export default BillingTab;
