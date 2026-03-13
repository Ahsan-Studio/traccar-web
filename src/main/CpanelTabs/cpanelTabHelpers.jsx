import { Typography, TextField, Box } from '@mui/material';

// ── Style helpers ──
export const sectionHeading = {
  fontSize: 13,
  fontWeight: 600,
  color: '#1976d2',
  mt: 2,
  mb: 1,
  pb: 0.5,
  borderBottom: '1px solid #e3f2fd',
};

export const fieldSx = {
  mb: 1.5,
  '& .MuiInputBase-input': { fontSize: 12 },
  '& .MuiInputLabel-root': { fontSize: 12 },
};

export const selectFieldSx = {
  ...fieldSx,
  '& .MuiSelect-select': { fontSize: 12 },
};

// Compact field style for use inside FormRow (no bottom margin — FormRow handles spacing)
export const formFieldSx = {
  '& .MuiInputBase-input': { fontSize: 12 },
  '& .MuiInputLabel-root': { fontSize: 12 },
};

export const formSelectSx = {
  ...formFieldSx,
  '& .MuiSelect-select': { fontSize: 12 },
};

// ── V1-style two-column form row: label (left) + input (right) ──
export const FormRow = ({ label, children, labelWidth = '45%', helperText }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.2, gap: 1.5 }}>
    <Box sx={{ width: labelWidth, flexShrink: 0, pt: 0.8 }}>
      <Typography variant="body2" sx={{ fontSize: 12, color: '#333', lineHeight: 1.4 }}>{label}</Typography>
      {helperText && (
        <Typography variant="caption" sx={{ fontSize: 10, color: '#999', lineHeight: 1.2 }}>{helperText}</Typography>
      )}
    </Box>
    <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>{children}</Box>
  </Box>
);

// ── Yes/No select dropdown ──
export const YesNoSelect = ({ label, attrKey, attrBool, updateAttribute, ...rest }) => (
  <TextField
    label={label} size="small" fullWidth select
    value={attrBool(attrKey) ? 'true' : 'false'}
    onChange={(e) => updateAttribute(attrKey, e.target.value === 'true')}
    sx={selectFieldSx}
    SelectProps={{ native: true }}
    {...rest}
  >
    <option value="true">Yes</option>
    <option value="false">No</option>
  </TextField>
);

// ── Generate 15-min interval time options (00:00 — 23:45) ──
export const timeOptions = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
})();
