import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';
import { getActiveTheme } from './common/theme/activeTheme';

const cache = {
  ltr: createCache({
    key: 'muiltr',
    stylisPlugins: [prefixer],
  }),
  rtl: createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  }),
};

/**
 * Inject CSS custom properties from the active theme onto :root.
 * This mirrors V1's style.custom.php — dynamic CSS generated from the active theme.
 */
const injectThemeCssVars = (server) => {
  const { active, theme: t } = getActiveTheme(server);
  const root = document.documentElement;

  if (!active) {
    // Clear custom properties when no theme is active
    root.style.removeProperty('--brand-accent1');
    root.style.removeProperty('--brand-accent2');
    root.style.removeProperty('--brand-accent3');
    root.style.removeProperty('--brand-accent4');
    root.style.removeProperty('--brand-top-panel');
    root.style.removeProperty('--brand-top-border');
    root.style.removeProperty('--brand-top-selection');
    root.style.removeProperty('--brand-dialog-titlebar');
    root.style.removeProperty('--brand-font-color');
    root.style.removeProperty('--brand-top-font');
    root.style.removeProperty('--brand-top-counters-font');
    root.style.removeProperty('--brand-heading-font-1');
    root.style.removeProperty('--brand-heading-font-2');
    root.style.removeProperty('--brand-login-bg');
    root.style.removeProperty('--brand-login-dialog-bg');
    root.style.removeProperty('--brand-login-dialog-opacity');
    return;
  }

  root.style.setProperty('--brand-accent1', t.ui_accent_color_1);
  root.style.setProperty('--brand-accent2', t.ui_accent_color_2);
  root.style.setProperty('--brand-accent3', t.ui_accent_color_3);
  root.style.setProperty('--brand-accent4', t.ui_accent_color_4);
  root.style.setProperty('--brand-top-panel', t.ui_top_panel_color);
  root.style.setProperty('--brand-top-border', t.ui_top_panel_border_color);
  root.style.setProperty('--brand-top-selection', t.ui_top_panel_selection_color);
  root.style.setProperty('--brand-dialog-titlebar', t.ui_dialog_titlebar_color);
  root.style.setProperty('--brand-font-color', t.ui_font_color);
  root.style.setProperty('--brand-top-font', t.ui_top_panel_font_color);
  root.style.setProperty('--brand-top-counters-font', t.ui_top_panel_counters_font_color);
  root.style.setProperty('--brand-heading-font-1', t.ui_heading_font_color_1);
  root.style.setProperty('--brand-heading-font-2', t.ui_heading_font_color_2);
  root.style.setProperty('--brand-login-bg', t.login_bg_color);
  root.style.setProperty('--brand-login-dialog-bg', t.login_dialog_bg_color);
  root.style.setProperty('--brand-login-dialog-opacity', String((t.login_dialog_opacity ?? 90) / 100));
};

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction } = useLocalization();

  const darkMode = false;

  const themeInstance = theme(server, darkMode, direction);

  // Inject CSS custom properties whenever server data changes
  useEffect(() => {
    injectThemeCssVars(server);
  }, [server]);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeProvider theme={themeInstance}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
