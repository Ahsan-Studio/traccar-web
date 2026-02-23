import { Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LogoImage from './LogoImage';

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
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();

  return (
    <main className={classes.root}>
      <Paper className={classes.paper}>
        <LogoImage />
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
      </Paper>
    </main>
  );
};

export default LoginLayout;
