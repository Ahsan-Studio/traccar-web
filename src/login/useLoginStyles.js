import { makeStyles } from 'tss-react/mui';

/**
 * Shared styles for all login-flow pages (LoginPage, RegisterPage, ResetPasswordPage).
 * Import this hook and spread the classes you need instead of duplicating styles.
 */
const useLoginStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  inputField: {
    '& .MuiInputBase-input.MuiOutlinedInput-input:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
      WebkitTextFillColor: '#444444 !important',
      caretColor: '#444444',
      transition: 'background-color 5000s ease-in-out 0s',
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#f5f5f5',
      border: '1px solid #f5f5f5',
      color: '#444444',
      fontSize: '11px',
      height: '40px',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.9rem',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#666666',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.9rem',
      },
    },
    '& .MuiInputAdornment-root': {
      color: '#666666',
      [theme.breakpoints.down('sm')]: {
        '& .MuiSvgIcon-root': {
          fontSize: '1.2rem',
        },
      },
    },
  },
  actionButton: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    fontSize: '11px',
    fontWeight: 500,
    height: '40px',
    backgroundColor: '#2b82d4',
    color: 'white',
    '&:hover': {
      backgroundColor: '#3875C5',
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.25),
      fontSize: '0.95rem',
      marginTop: theme.spacing(1.5),
    },
    '&.Mui-disabled': {
      backgroundColor: '#2b82d4',
      color: 'white',
      opacity: 1,
      cursor: 'not-allowed',
    },
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    color: '#444444',
    fontSize: '11px',
    gap: theme.spacing(0.4),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(2),
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  link: {
    cursor: 'pointer',
    color: '#676767',
    fontSize: '11px',
    fontWeight: 'bold',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

export default useLoginStyles;
