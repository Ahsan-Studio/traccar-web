import { useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import {
  Button, InputAdornment, Link, Snackbar, TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import fetchOrThrow from '../common/util/fetchOrThrow';
import useQuery from '../common/util/useQuery';
import { useCatch } from '../reactHelper';
import LoginLayout from './LoginLayout';
import useLoginStyles from './useLoginStyles';

const ResetPasswordPage = () => {
  const { classes } = useLoginStyles();
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
            autoComplete="new-password"
            className={classes.inputField}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            variant="outlined"
          />
        )}
        <Button
          variant="contained"
          color="secondary"
          type="submit"
          className={classes.actionButton}
          onClick={handleSubmit}
          disabled={!/(.+)@(.+)\.(.{2,})/.test(email) && !password}
          fullWidth
        >
          {t('loginReset')}
        </Button>
        <div className={classes.extraContainer}>
          <Link
            onClick={() => navigate('/login')}
            className={classes.link}
            underline="none"
          >
            {t('loginLogin')}
          </Link>
          or
          <Link
            onClick={() => navigate('/register')}
            className={classes.link}
            underline="none"
          >
            {t('loginRegister')}
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
