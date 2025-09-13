import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';

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

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction } = useLocalization();

  const darkMode = false;

  const themeInstance = theme(server, darkMode, direction);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeProvider theme={themeInstance}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
