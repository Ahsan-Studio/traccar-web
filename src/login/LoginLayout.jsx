import { useSelector } from 'react-redux';
import { Paper, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LogoImage from './LogoImage';
import { getActiveTheme } from '../common/theme/activeTheme';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100vh',
    backgroundImage: 'url(/img/login-background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    width: '450px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.spacing(1),
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      width: '90%',
      minWidth: '280px',
      padding: theme.spacing(2),
    },
    [theme.breakpoints.between('sm', 'md')]: {
      width: '400px',
    },
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(2),
  },
  mobileLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  appButton: {
    height: '40px',
    cursor: 'pointer',
  },
  bottomText: {
    textAlign: 'center',
    marginTop: theme.spacing(2),
    fontSize: '11px',
    color: '#666',
    '& a': { color: '#4B89DC', textDecoration: 'none' },
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const server = useSelector((state) => state.session.server);
  const { active, theme: t } = getActiveTheme(server);

  // Brand images
  const loginBg = server?.attributes?.brandLoginBg;

  // Dynamic styles from active theme (V1 parity: style.custom.php)
  const rootStyle = {};
  const paperStyle = {};

  if (loginBg) {
    rootStyle.backgroundImage = `url(${loginBg})`;
  }

  if (active) {
    // Background color
    if (t.login_bg_color && t.login_bg_color !== '#FFFFFF') {
      rootStyle.backgroundColor = t.login_bg_color;
    }
    // Dialog background color + opacity
    if (t.login_dialog_bg_color) {
      const opacity = (t.login_dialog_opacity ?? 90) / 100;
      paperStyle.backgroundColor = t.login_dialog_bg_color;
      paperStyle.opacity = opacity;
    }
    // Horizontal position
    if (t.login_dialog_h_position === 'left') {
      rootStyle.justifyContent = 'flex-start';
      rootStyle.paddingLeft = '5%';
    } else if (t.login_dialog_h_position === 'right') {
      rootStyle.justifyContent = 'flex-end';
      rootStyle.paddingRight = '5%';
    }
    // Vertical position
    if (t.login_dialog_v_position === 'top') {
      rootStyle.alignItems = 'flex-start';
      rootStyle.paddingTop = '5%';
    } else if (t.login_dialog_v_position === 'bottom') {
      rootStyle.alignItems = 'flex-end';
      rootStyle.paddingBottom = '5%';
    }
  }

  // Logo visibility from theme
  const showLogo = !active || t.login_dialog_logo !== 'no';

  // Logo position alignment
  let logoJustify = 'flex-start';
  if (active && t.login_dialog_logo_position === 'center') logoJustify = 'center';
  else if (active && t.login_dialog_logo_position === 'right') logoJustify = 'flex-end';

  return (
    <main className={classes.root} style={rootStyle}>
      <Paper className={classes.paper} style={paperStyle}>
        {showLogo && (
          <div style={{ display: 'flex', justifyContent: logoJustify }}>
            <LogoImage />
          </div>
        )}
        <form className={classes.form}>
          {children}
        </form>
        <div className={classes.mobileLinks}>
          <a href="https://play.google.com/store/apps/details?id=org.traccar.client" target="_blank" rel="noopener noreferrer">
            <img src="/img/android_app_button.png" alt="Android App" className={classes.appButton} loading="lazy" />
          </a>
          <a href="https://apps.apple.com/us/app/traccar-client/id843156974" target="_blank" rel="noopener noreferrer">
            <img src="/img/app-store-logo.jpg" alt="iOS App" className={classes.appButton} loading="lazy" />
          </a>
        </div>
        {/* Bottom text from theme (V1: login_dialog_bottom_text) */}
        {active && t.login_dialog_bottom_text && (
          <Typography
            className={classes.bottomText}
            dangerouslySetInnerHTML={{ __html: t.login_dialog_bottom_text }}
          />
        )}
      </Paper>
    </main>
  );
};

export default LoginLayout;
