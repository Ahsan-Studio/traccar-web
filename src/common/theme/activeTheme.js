/**
 * Extracts the active theme from server.attributes.themes array.
 * Returns the theme properties object merged with defaults, or defaults if none active.
 *
 * V1 parity: themes are stored in gs_themes table with JSON 'theme' column.
 * V2: themes stored as array in server.attributes.themes.
 */

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

/**
 * Get the active theme from server attributes.
 * @param {object|null} server - The server object from Redux state
 * @returns {{ active: boolean, theme: object }} - active flag and merged theme properties
 */
export const getActiveTheme = (server) => {
  const themes = server?.attributes?.themes;
  if (!Array.isArray(themes) || themes.length === 0) {
    return { active: false, theme: { ...THEME_DEFAULTS } };
  }
  const activeTheme = themes.find((t) => t.active);
  if (!activeTheme) {
    return { active: false, theme: { ...THEME_DEFAULTS } };
  }
  return {
    active: true,
    theme: { ...THEME_DEFAULTS, ...activeTheme.theme },
  };
};

export { THEME_DEFAULTS };

export default getActiveTheme;
