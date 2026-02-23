import { useState } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Button, IconButton, InputAdornment, Link, Snackbar, TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useCatch, useEffectAsync } from '../reactHelper';
import { sessionActions } from '../store';
import LoginLayout from './LoginLayout';
import useLoginStyles from './useLoginStyles';

const RegisterPage = () => {
  const { classes } = useLoginStyles();
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

  const handlePreventDefault = (event) => event.preventDefault();

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
                  onMouseDown={handlePreventDefault}
                  onMouseUp={handlePreventDefault}
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
          className={classes.actionButton}
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
            {t('loginLogin')}
          </Link>
          or
          <Link
            onClick={() => navigate('/reset-password')}
            className={classes.link}
            underline="none"
          >
            {t('loginReset')}
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
