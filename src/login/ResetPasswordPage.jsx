import { useState } from 'react';
import {
  Button, TextField, Link, Snackbar, InputAdornment,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import useQuery from '../common/util/useQuery';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import PersonIcon from '@mui/icons-material/Person';

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
  resetButton: {
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

const ResetPasswordPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const query = useQuery();

  const token = query.get('passwordReset');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    if (!token) {
      await fetchOrThrow('/api/password/reset', {
        method: 'POST',
        body: new URLSearchParams(`email=${encodeURIComponent(email)}`),
      });
    } else {
      await fetchOrThrow('/api/password/update', {
        method: 'POST',
        body: new URLSearchParams(`token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`),
      });
    }
    setSnackbarOpen(true);
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        {!token ? (
          <TextField
            required
            type="email"
            placeholder={t('userEmail')}
            name="email"
            value={email}
            autoComplete="email"
            className={classes.inputField}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <TextField
            required
            placeholder={t('userPassword')}
            name="password"
            value={password}
            type="password"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          className={classes.resetButton}
          onClick={handleSubmit}
          disabled={!/(.+)@(.+)\.(.{2,})/.test(email) && !password}
          fullWidth
        >
          {t('loginReset')}
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
            onClick={() => navigate("/register")}
            className={classes.link}
            underline="none"
          >
            create account
          </Link>
        </div>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => navigate('/login')}
        autoHideDuration={snackBarDurationShortMs}
        message={!token ? t('loginResetSuccess') : t('loginUpdateSuccess')}
      />
    </LoginLayout>
  );
};

export default ResetPasswordPage;
