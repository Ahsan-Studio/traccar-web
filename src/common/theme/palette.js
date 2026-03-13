import { grey, green, indigo } from '@mui/material/colors';
import { getActiveTheme } from './activeTheme';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode) => {
  const { active, theme: t } = getActiveTheme(server);

  return {
    mode: darkMode ? 'dark' : 'light',
    background: {
      default: darkMode ? grey[900] : grey[50],
    },
    primary: {
      main: (active && validatedColor(t.ui_accent_color_1))
        || validatedColor(server?.attributes?.colorPrimary)
        || (darkMode ? indigo[200] : indigo[900]),
    },
    secondary: {
      main: (active && validatedColor(t.ui_accent_color_2))
        || validatedColor(server?.attributes?.colorSecondary)
        || (darkMode ? green[200] : green[800]),
    },
    neutral: {
      main: grey[500],
    },
    geometry: {
      main: '#3bb2d0',
    },
    // Extended theme colors (available via theme.palette.brand.*)
    brand: active ? {
      accent1: validatedColor(t.ui_accent_color_1) || '#2B82D4',
      accent2: validatedColor(t.ui_accent_color_2) || '#FAB444',
      accent3: validatedColor(t.ui_accent_color_3) || '#9CC602',
      accent4: validatedColor(t.ui_accent_color_4) || '#808080',
      topPanel: validatedColor(t.ui_top_panel_color) || '#FFFFFF',
      topBorder: validatedColor(t.ui_top_panel_border_color) || '#F5F5F5',
      topSelection: validatedColor(t.ui_top_panel_selection_color) || '#F5F5F5',
      dialogTitlebar: validatedColor(t.ui_dialog_titlebar_color) || '#2B82D4',
      fontColor: validatedColor(t.ui_font_color) || '#444444',
      topFont: validatedColor(t.ui_top_panel_font_color) || '#808080',
      topCountersFont: validatedColor(t.ui_top_panel_counters_font_color) || '#808080',
      headingFont1: validatedColor(t.ui_heading_font_color_1) || '#2B82D4',
      headingFont2: validatedColor(t.ui_heading_font_color_2) || '#808080',
    } : undefined,
  };
};
