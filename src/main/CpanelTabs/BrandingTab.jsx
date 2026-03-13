import { useRef, useState, useCallback } from 'react';
import {
  Typography, TextField, Grid, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Checkbox, FormControlLabel, Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {
  sectionHeading, FormRow, formFieldSx, formSelectSx,
} from './cpanelTabHelpers';

/* ═══════════════════════════════════════════════════════
   Theme defaults — matches V1 getThemeDefault()
   ═══════════════════════════════════════════════════════ */
const THEME_DEFAULTS = {
  // Login
  login_dialog_logo: 'yes',
  login_dialog_logo_position: 'left',
  login_bg_color: '#FFFFFF',
  login_dialog_bg_color: '#FFFFFF',
  login_dialog_opacity: 90,
  login_dialog_h_position: 'center',
  login_dialog_v_position: 'center',
  login_dialog_bottom_text: '',
  // UI
  ui_top_panel_color: '#FFFFFF',
  ui_top_panel_border_color: '#F5F5F5',
  ui_top_panel_selection_color: '#F5F5F5',
  ui_dialog_titlebar_color: '#2B82D4',
  ui_accent_color_1: '#2B82D4',
  ui_accent_color_2: '#FAB444',
  ui_accent_color_3: '#9CC602',
  ui_accent_color_4: '#808080',
  // Fonts
  ui_font_color: '#444444',
  ui_top_panel_font_color: '#808080',
  ui_top_panel_counters_font_color: '#808080',
  ui_heading_font_color_1: '#2B82D4',
  ui_heading_font_color_2: '#808080',
};

let nextThemeId = Date.now();

/* ═══════════════════════════════════════════════════════
   Image card definitions & component
   ═══════════════════════════════════════════════════════ */
const IMAGE_CARDS = [
  { label: 'Logo', desc: 'Size 250 × 56 px, PNG or SVG', key: 'brandLogo', accept: 'image/png,image/svg+xml' },
  { label: 'Logo small', desc: 'Size 32 × 32 px, PNG or SVG', key: 'brandLogoSmall', accept: 'image/png,image/svg+xml' },
  { label: 'Favicon', desc: 'Max 256 × 256 px, PNG or ICO', key: 'brandFavicon', accept: 'image/png,image/x-icon' },
  { label: 'Login background', desc: 'Size 1920 × 1080 px, JPEG', key: 'brandLoginBg', accept: 'image/jpeg' },
];

const ImageCard = ({ img, value, onUpload, onDelete }) => {
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  return (
    <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1.2, textAlign: 'center', backgroundColor: '#fff' }}>
      <Box sx={{
        width: '100%', height: 80, border: '1px solid #eee', borderRadius: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fafafa', mb: 0.8, overflow: 'hidden',
      }}>
        {value
          ? <img src={value} alt={img.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <Typography variant="caption" sx={{ color: '#ccc', fontSize: 11 }}>No image</Typography>}
      </Box>
      <Typography variant="caption" sx={{ fontSize: 10, color: '#666', display: 'block', mb: 0.8, lineHeight: 1.3 }}>{img.desc}</Typography>
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        <Button size="small" variant="outlined" startIcon={<CloudUploadIcon sx={{ fontSize: '14px !important' }} />}
          onClick={() => fileRef.current?.click()} sx={{ fontSize: 10, textTransform: 'none', py: 0.2, px: 1, minWidth: 0 }}>Upload</Button>
        {value && (
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
            onClick={onDelete} sx={{ fontSize: 10, textTransform: 'none', py: 0.2, px: 1, minWidth: 0 }}>Delete</Button>
        )}
      </Box>
      <input ref={fileRef} type="file" accept={img.accept} style={{ display: 'none' }} onChange={handleFile} />
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════
   Color field helper
   ═══════════════════════════════════════════════════════ */
const colorSx = { ...formFieldSx, '& input': { height: 28, cursor: 'pointer' } };

const ColorField = ({ label, value, defaultValue, onChange }) => (
  <FormRow label={label}>
    <TextField
      size="small" fullWidth type="color"
      value={value || defaultValue}
      onChange={(e) => onChange(e.target.value)}
      sx={colorSx}
    />
    <Typography variant="caption" sx={{ fontSize: 10, color: '#999', minWidth: 58, textAlign: 'center' }}>
      {value || defaultValue}
    </Typography>
  </FormRow>
);

/* ═══════════════════════════════════════════════════════
   Theme Properties Dialog (modal for Add / Edit)
   Matches V1's dialog_theme_properties
   ═══════════════════════════════════════════════════════ */
const ThemePropertiesDialog = ({ open, onClose, onSave, initial }) => {
  const [theme, setTheme] = useState({ ...THEME_DEFAULTS, ...initial?.theme });
  const [name, setName] = useState(initial?.name || '');
  const [active, setActive] = useState(initial?.active || false);

  // Reset when dialog opens with new data
  const prevId = useRef(null);
  if (open && initial?.id !== prevId.current) {
    prevId.current = initial?.id ?? null;
  }

  const tp = (key) => theme[key] ?? THEME_DEFAULTS[key];
  const setTp = (key, val) => setTheme((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: initial?.id || null, name: name.trim(), active, theme });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{
 display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.2, px: 2, backgroundColor: '#2B82D4', color: '#fff', fontSize: 14 
}}>
        {initial?.id ? 'Edit Theme' : 'Add Theme'}
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, overflow: 'auto' }}>
        {/* ── Theme name & active ── */}
        <Typography sx={{ ...sectionHeading, mt: 0.5 }}>Theme</Typography>
        <FormRow label="Theme name">
          <TextField size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)}
            sx={formFieldSx} inputProps={{ maxLength: 50 }} placeholder="My Theme" />
        </FormRow>
        <FormRow label="Active">
          <FormControlLabel
            control={<Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} size="small" />}
            label={<Typography sx={{ fontSize: 12 }}>{active ? 'Yes' : 'No'}</Typography>}
          />
        </FormRow>

        <Divider sx={{ my: 1.5 }} />

        {/* ── Login section ── */}
        <Typography sx={sectionHeading}>Login</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormRow label="Show logo on login">
              <TextField size="small" fullWidth select value={tp('login_dialog_logo')}
                onChange={(e) => setTp('login_dialog_logo', e.target.value)}
                sx={formSelectSx} SelectProps={{ native: true }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </TextField>
            </FormRow>
            <FormRow label="Logo position">
              <TextField size="small" fullWidth select value={tp('login_dialog_logo_position')}
                onChange={(e) => setTp('login_dialog_logo_position', e.target.value)}
                sx={formSelectSx} SelectProps={{ native: true }}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </TextField>
            </FormRow>
            <ColorField label="Background color" value={tp('login_bg_color')} defaultValue="#FFFFFF"
              onChange={(v) => setTp('login_bg_color', v)} />
            <ColorField label="Dialog bg color" value={tp('login_dialog_bg_color')} defaultValue="#FFFFFF"
              onChange={(v) => setTp('login_dialog_bg_color', v)} />
          </Grid>
          <Grid item xs={6}>
            <FormRow label="Dialog opacity">
              <TextField size="small" fullWidth select value={String(tp('login_dialog_opacity'))}
                onChange={(e) => setTp('login_dialog_opacity', parseInt(e.target.value, 10))}
                sx={formSelectSx} SelectProps={{ native: true }}>
                {[100, 90, 80, 70, 60, 50].map((v) => <option key={v} value={v}>{v}%</option>)}
              </TextField>
            </FormRow>
            <FormRow label="H position">
              <TextField size="small" fullWidth select value={tp('login_dialog_h_position')}
                onChange={(e) => setTp('login_dialog_h_position', e.target.value)}
                sx={formSelectSx} SelectProps={{ native: true }}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </TextField>
            </FormRow>
            <FormRow label="V position">
              <TextField size="small" fullWidth select value={tp('login_dialog_v_position')}
                onChange={(e) => setTp('login_dialog_v_position', e.target.value)}
                sx={formSelectSx} SelectProps={{ native: true }}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </TextField>
            </FormRow>
          </Grid>
        </Grid>
        <FormRow label="Bottom text (HTML)">
          <TextField size="small" fullWidth multiline rows={2} value={tp('login_dialog_bottom_text')}
            onChange={(e) => setTp('login_dialog_bottom_text', e.target.value)}
            sx={formFieldSx} inputProps={{ maxLength: 500 }} />
        </FormRow>

        <Divider sx={{ my: 1.5 }} />

        {/* ── User Interface section ── */}
        <Typography sx={sectionHeading}>User Interface</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <ColorField label="Top panel color" value={tp('ui_top_panel_color')} defaultValue="#FFFFFF" onChange={(v) => setTp('ui_top_panel_color', v)} />
            <ColorField label="Top border color" value={tp('ui_top_panel_border_color')} defaultValue="#F5F5F5" onChange={(v) => setTp('ui_top_panel_border_color', v)} />
            <ColorField label="Top selection color" value={tp('ui_top_panel_selection_color')} defaultValue="#F5F5F5" onChange={(v) => setTp('ui_top_panel_selection_color', v)} />
            <ColorField label="Dialog titlebar" value={tp('ui_dialog_titlebar_color')} defaultValue="#2B82D4" onChange={(v) => setTp('ui_dialog_titlebar_color', v)} />
          </Grid>
          <Grid item xs={6}>
            <ColorField label="Accent color 1" value={tp('ui_accent_color_1')} defaultValue="#2B82D4" onChange={(v) => setTp('ui_accent_color_1', v)} />
            <ColorField label="Accent color 2" value={tp('ui_accent_color_2')} defaultValue="#FAB444" onChange={(v) => setTp('ui_accent_color_2', v)} />
            <ColorField label="Accent color 3" value={tp('ui_accent_color_3')} defaultValue="#9CC602" onChange={(v) => setTp('ui_accent_color_3', v)} />
            <ColorField label="Accent color 4" value={tp('ui_accent_color_4')} defaultValue="#808080" onChange={(v) => setTp('ui_accent_color_4', v)} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        {/* ── Fonts section ── */}
        <Typography sx={sectionHeading}>Fonts</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <ColorField label="Font color" value={tp('ui_font_color')} defaultValue="#444444" onChange={(v) => setTp('ui_font_color', v)} />
            <ColorField label="Top panel font" value={tp('ui_top_panel_font_color')} defaultValue="#808080" onChange={(v) => setTp('ui_top_panel_font_color', v)} />
            <ColorField label="Counters font" value={tp('ui_top_panel_counters_font_color')} defaultValue="#808080" onChange={(v) => setTp('ui_top_panel_counters_font_color', v)} />
          </Grid>
          <Grid item xs={6}>
            <ColorField label="Heading font 1" value={tp('ui_heading_font_color_1')} defaultValue="#2B82D4" onChange={(v) => setTp('ui_heading_font_color_1', v)} />
            <ColorField label="Heading font 2" value={tp('ui_heading_font_color_2')} defaultValue="#808080" onChange={(v) => setTp('ui_heading_font_color_2', v)} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: 12, textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={!name.trim()}
          sx={{ fontSize: 12, textTransform: 'none' }}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════
   Theme list table
   ═══════════════════════════════════════════════════════ */
const themeTableHeadSx = {
  fontWeight: 600, fontSize: 11, backgroundColor: '#e9ecef', py: 0.5, px: 1,
  whiteSpace: 'nowrap', borderRight: '1px solid #dee2e6', color: '#495057',
};
const themeTableCellSx = { fontSize: 11, py: 0.6, px: 1, borderRight: '1px solid #f0f0f0' };

/* ═══════════════════════════════════════════════════════
   Main Branding & UI Tab
   ═══════════════════════════════════════════════════════ */
const BrandingTab = ({ attr, attrBool, updateAttribute }) => {
  // Themes stored as array in server.attributes.themes
  const themes = (attr('themes') || []);
  const setThemes = useCallback((newThemes) => updateAttribute('themes', newThemes), [updateAttribute]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null); // null = add mode, object = edit mode

  /* ── Theme CRUD ── */
  const handleAddTheme = () => {
    setEditingTheme(null);
    setDialogOpen(true);
  };

  const handleEditTheme = (themeItem) => {
    setEditingTheme(themeItem);
    setDialogOpen(true);
  };

  const handleSaveTheme = (saved) => {
    let updated;
    if (saved.id) {
      // Edit existing
      updated = themes.map((t) => {
        if (t.id === saved.id) return { ...t, name: saved.name, active: saved.active, theme: saved.theme };
        // If this theme is being activated, deactivate others
        if (saved.active) return { ...t, active: false };
        return t;
      });
    } else {
      // Add new
      nextThemeId += 1;
      const newItem = { id: nextThemeId, name: saved.name, active: saved.active, theme: saved.theme };
      // If active, deactivate all others
      updated = saved.active
        ? [...themes.map((t) => ({ ...t, active: false })), newItem]
        : [...themes, newItem];
    }
    setThemes(updated);
    setDialogOpen(false);
  };

  const handleDeleteTheme = (themeId) => {
    setThemes(themes.filter((t) => t.id !== themeId));
  };

  const handleDeleteAllThemes = () => {
    setThemes([]);
  };

  const handleToggleActive = (themeId) => {
    const target = themes.find((t) => t.id === themeId);
    if (!target) return;
    const willActivate = !target.active;
    setThemes(themes.map((t) => {
      if (t.id === themeId) return { ...t, active: willActivate };
      // Deactivate all others when activating one
      if (willActivate) return { ...t, active: false };
      return t;
    }));
  };

  return (
    <>
      {/* ═══ Branding ═══ */}
      <Typography sx={sectionHeading}>Branding</Typography>
      <FormRow label="GPS server name">
        <TextField size="small" fullWidth value={attr('serverName')}
          onChange={(e) => updateAttribute('serverName', e.target.value)}
          sx={formFieldSx} inputProps={{ maxLength: 50 }} />
      </FormRow>
      <FormRow label="Page generator tag">
        <TextField size="small" fullWidth value={attr('pageGenerator')}
          onChange={(e) => updateAttribute('pageGenerator', e.target.value)}
          sx={formFieldSx} inputProps={{ maxLength: 50 }} placeholder="ex. My GPS Server" />
      </FormRow>
      <FormRow label="Show about button">
        <TextField size="small" fullWidth select value={attrBool('showAbout') ? 'true' : 'false'}
          onChange={(e) => updateAttribute('showAbout', e.target.value === 'true')}
          sx={formSelectSx} SelectProps={{ native: true }}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </TextField>
      </FormRow>
      <FormRow label="Show help page button">
        <TextField size="small" fullWidth select value={attrBool('showHelp') ? 'true' : 'false'}
          onChange={(e) => updateAttribute('showHelp', e.target.value === 'true')}
          sx={formSelectSx} SelectProps={{ native: true }}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </TextField>
      </FormRow>

      {/* ═══ Images ═══ */}
      <Typography sx={sectionHeading}>Images</Typography>
      <Grid container spacing={1.5}>
        {IMAGE_CARDS.map((img) => (
          <Grid item xs={3} key={img.key}>
            <ImageCard img={img} value={attr(img.key)}
              onUpload={(dataUrl) => updateAttribute(img.key, dataUrl)}
              onDelete={() => updateAttribute(img.key, '')} />
          </Grid>
        ))}
      </Grid>

      {/* ═══ Themes ═══ */}
      <Typography sx={sectionHeading}>Themes</Typography>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.2 }}>
        <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
          onClick={handleAddTheme} sx={{ fontSize: 11, textTransform: 'none', py: 0.3 }}>
          Add Theme
        </Button>
        {themes.length > 0 && (
          <Button size="small" variant="outlined" color="error"
            startIcon={<DeleteSweepIcon sx={{ fontSize: '14px !important' }} />}
            onClick={handleDeleteAllThemes}
            sx={{ fontSize: 11, textTransform: 'none', py: 0.3 }}>
            Delete All
          </Button>
        )}
      </Box>

      {/* Theme list table */}
      {themes.length > 0 ? (
        <TableContainer sx={{ border: '1px solid #dee2e6', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={themeTableHeadSx}>Name</TableCell>
                <TableCell sx={{ ...themeTableHeadSx, textAlign: 'center', width: 70 }}>Active</TableCell>
                <TableCell sx={{ ...themeTableHeadSx, textAlign: 'center', width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {themes.map((t) => (
                <TableRow key={t.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={themeTableCellSx}>{t.name}</TableCell>
                  <TableCell sx={{ ...themeTableCellSx, textAlign: 'center' }}>
                    <Tooltip title={t.active ? 'Click to deactivate' : 'Click to activate'}>
                      <IconButton size="small" onClick={() => handleToggleActive(t.id)}>
                        {t.active
                          ? <CheckCircleIcon sx={{ fontSize: 18, color: '#27ae60' }} />
                          : <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#ccc' }} />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...themeTableCellSx, textAlign: 'center' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditTheme(t)}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteTheme(t.id)}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: '#999', fontSize: 12, border: '1px dashed #ddd', borderRadius: 1 }}>
          No themes created yet. Click &quot;Add Theme&quot; to create one.
        </Box>
      )}

      {/* Theme Properties Dialog */}
      {dialogOpen && (
        <ThemePropertiesDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveTheme}
          initial={editingTheme}
        />
      )}
    </>
  );
};

export default BrandingTab;
