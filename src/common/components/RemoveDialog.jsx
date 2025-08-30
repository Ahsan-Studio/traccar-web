import Button from '@mui/material/Button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from 'tss-react/mui';
import { useCatch } from '../../reactHelper';
import fetchOrThrow from '../util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  titleRoot: {
    backgroundColor: "#4a90e2",
    color: theme.palette.primary.contrastText,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1.5, 2),
  },
  closeButton: {
    color: theme.palette.primary.contrastText,
  },
  content: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(3),
    textAlign: "center",
  },
  actions: {
    justifyContent: "center",
    paddingBottom: theme.spacing(3),
  },
  actionButton: {
    minWidth: 100,
    margin: theme.spacing(0, 1),
  },
}));

const RemoveDialog = ({
  open, endpoint, itemId, onResult,
}) => {
  const { classes } = useStyles();

  const handleRemove = useCatch(async () => {
    await fetchOrThrow(`/api/${endpoint}/${itemId}`, { method: 'DELETE' });
    onResult(true);
  });

  return (
    <Dialog
      open={open}
      onClose={() => onResult(false)}
      aria-labelledby="remove-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="remove-dialog-title" disableTypography className={classes.titleRoot}>
        <span />
        <IconButton aria-label="close" size="small" onClick={() => onResult(false)} className={classes.closeButton}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Typography variant="body1">Anda yakin akan menghapus?</Typography>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button size="small" variant="outlined" onClick={handleRemove} className={classes.actionButton}>
          Ya
        </Button>
        <Button size="small" variant="outlined" onClick={() => onResult(false)} className={classes.actionButton}>
          Tidak
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveDialog;
