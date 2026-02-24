import { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';
import { Tooltip, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles()(() => ({
  root: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 4,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 5px rgba(0, 0, 0, 0.4)',
    borderRadius: 4,
    padding: '2px 4px',
    gap: 2,
  },
  button: {
    width: 30,
    height: 30,
    padding: 4,
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  icon: {
    width: 16,
    height: 16,
  },
  disabled: {
    opacity: 0.35,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    margin: '0 2px',
  },
}));

const HistoryControls = ({ toggles, onToggle, onClose }) => {
  const { classes, cx } = useStyles();

  const buttons = [
    { key: 'route', icon: '/img/theme/route-route.svg', title: 'Show/Hide Route' },
    { key: 'stops', icon: '/img/theme/route-stop.svg', title: 'Show/Hide Stops' },
    { key: 'events', icon: '/img/theme/route-event.svg', title: 'Show/Hide Events' },
  ];

  const handleToggle = useCallback((key) => {
    onToggle(key);
  }, [onToggle]);

  return (
    <div className={classes.root}>
      {buttons.map((btn) => (
        <Tooltip key={btn.key} title={btn.title} arrow>
          <button
            type="button"
            className={classes.button}
            onClick={() => handleToggle(btn.key)}
          >
            <img
              src={btn.icon}
              alt={btn.key}
              className={cx(classes.icon, !toggles[btn.key] && classes.disabled)}
            />
          </button>
        </Tooltip>
      ))}
      <div className={classes.separator} />
      <Tooltip title="Hide Route" arrow>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default HistoryControls;
