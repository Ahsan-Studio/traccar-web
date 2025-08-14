import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button, TextField, Snackbar, IconButton, InputAdornment, Link,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch, useEffectAsync } from '../reactHelper';
import { sessionActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  inputField: {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f5f5f5",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
      border: "1px solid #f5f5f5",
      color: "#444444",
      fontSize: "11px",
      height: "40px",
    },
    "& .MuiInputLabel-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        fontSize: "0.9rem",
      },
    },
    "& .MuiInputAdornment-root": {
      color: "#666666",
      [theme.breakpoints.down("sm")]: {
        "& .MuiSvgIcon-root": {
          fontSize: "1.2rem",
        },
      },
    },
    "& .MuiInputBase-input.MuiOutlinedInput-input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #ffffff inset !important",
      WebkitTextFillColor: "#444444 !important",
      caretColor: "#444444",
      transition: "background-color 5000s ease-in-out 0s"
    }
  },
  registerButton: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    fontSize: "11px",
    fontWeight: 500,
    height: "40px",
    backgroundColor: "#2b82d4",
    color: "white",
    "&:hover": {
      backgroundColor: "#3875C5",
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.25),
      fontSize: "0.95rem",
      marginTop: theme.spacing(1.5),
    },
    "&.Mui-disabled": {
      backgroundColor: "#2b82d4", // tetap warna aktif
      color: "white",             // tetap warna teks aktif
      opacity: 1,                 // hilangkan efek transparan MUI
      cursor: "not-allowed",      // biar kelihatan tidak bisa diklik
    },
  },
  extraContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    color: "#444444",
    fontSize: "11px",
    gap: theme.spacing(0.4),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(2),
      flexDirection: "column",
      alignItems: "center",
    },
  },
  link: {
    cursor: "pointer",
    color: "#676767",
    fontSize: "11px",
    fontWeight: "bold",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

const RegisterPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session.server);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };

  useEffectAsync(async () => {
    if (totpForce) {
      const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
      setTotpKey(await response.text());
    }
  }, [totpForce, setTotpKey]);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    await fetchOrThrow('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, totpKey }),
    });
    setSnackbarOpen(true);
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        <TextField
          required
          placeholder={t('sharedName')}
          name="name"
          value={name}
          className={classes.inputField}
          autoComplete="name"
          autoFocus
          onChange={(event) => setName(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          required
          type="email"
          placeholder={t('userEmail')}
          name="email"
          value={email}
          className={classes.inputField}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          required
          placeholder={t('userPassword')}
          name="password"
          value={password}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          className={classes.inputField}
          onChange={(event) => setPassword(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword
                      ? "hide the password"
                      : "display the password"
                  }
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  onMouseUp={handleMouseUpPassword}
                  edge="end"
                  color="primary"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {totpForce && (
          <TextField
            required
            label={t('loginTotpKey')}
            name="totpKey"
            value={totpKey || ''}
            InputProps={{
              readOnly: true,
            }}
          />
        )}
        <Button
          variant="contained"
          color="secondary"
          className={classes.registerButton}
          onClick={handleSubmit}
          type="submit"
          disabled={!name || !password || !(server.newServer || /(.+)@(.+)\.(.{2,})/.test(email))}
          fullWidth
        >
          {t('loginRegister')}
        </Button>
        <div className={classes.extraContainer}>
          <Link
            onClick={() => navigate("/login")}
            className={classes.link}
            underline="none"
          >
            Login
          </Link>
          or
          <Link
            onClick={() => navigate("/reset-password")}
            className={classes.link}
            underline="none"
          >
            recover password
          </Link>
        </div>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => {
          dispatch(sessionActions.updateServer({ ...server, newServer: false }));
          navigate('/login');
        }}
        autoHideDuration={snackBarDurationShortMs}
        message={t('loginCreated')}
      />
    </LoginLayout>
  );
};

export default RegisterPage;
