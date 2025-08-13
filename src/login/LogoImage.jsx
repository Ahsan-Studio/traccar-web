
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
const DEFAULT_LOGO = '../../img/logo.svg';

const useStyles = makeStyles()((theme) => ({
  image: {
    alignSelf: 'flex-start',
    width: '280px',
    height: 'auto',
    marginBottom: theme.spacing(4),
    objectFit: 'contain',
    [theme.breakpoints.down('sm')]: {
      width: '220px',
      marginBottom: theme.spacing(3),
    },
  },
}));

const LogoImage = () => {
  const { classes } = useStyles();
  const logo = useSelector((state) => state.session.server.attributes?.logo);

  const logoUrl = logo || DEFAULT_LOGO;
  return <img className={classes.image} src={logoUrl} alt="GSI Tracking" />;
};

export default LogoImage;
