import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';
import { getActiveTheme } from './activeTheme';

export default (server, darkMode, direction) => useMemo(() => {
  const { active, theme: activeThemeData } = getActiveTheme(server);

  return createTheme({
    typography: {
      fontFamily: 'Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif',
    },
    palette: palette(server, darkMode),
    direction,
    dimensions,
    components,
    // Custom namespace: theme.activeTheme for low-level access
    activeTheme: active ? activeThemeData : null,
  });
}, [server, darkMode, direction]);
