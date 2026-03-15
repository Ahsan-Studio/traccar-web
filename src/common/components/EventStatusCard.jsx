import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Link,
  CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';

import { useTranslation } from './LocalizationProvider';
import dayjs from 'dayjs';
import { getEventTypeLabel } from '../constants/eventTypes';
import fetchOrThrow from '../util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
    borderRadius: '0px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1,2),
    background: '#2a81d4',
    color: 'white',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: 'white',
  },
  closeButton: {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      padding: theme.spacing(0.75, 1.5),
      borderBottom: '1px solid #f0f0f0',
    },
    '& .MuiTableCell-sizeSmall:first-of-type': {
      paddingLeft: theme.spacing(2),
      width: '100px',
      backgroundColor: '#fafafa',
      fontWeight: 500,
      color: '#666',
    },
    '& .MuiTableCell-sizeSmall:last-of-type': {
      paddingRight: theme.spacing(2),
      color: '#333',
    },
    '& tr:last-child .MuiTableCell-sizeSmall': {
      borderBottom: 'none',
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'flex-start',
    padding: theme.spacing(1, 1.5),
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  addressLink: {
    cursor: 'pointer',
    fontSize: '13px',
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  addressLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
}));

const StatusRow = ({ name, content }) => {
  const { classes } = useStyles();

  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2">{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

const EventStatusCard = ({ event, position, device, onClose, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const t = useTranslation();

  const [address, setAddress] = useState(position?.address || '');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const addressEnabled = useSelector((state) => state.session.server.geocoderEnabled);

  // Fetch address when position changes
  useEffect(() => {
    if (position?.address) {
      setAddress(position.address);
    } else {
      setAddress('');
    }
  }, [position]);

  const fetchAddress = async () => {
    if (!position || !position.latitude || !position.longitude) return;

    setLoadingAddress(true);
    try {
      const query = new URLSearchParams({
        latitude: position.latitude,
        longitude: position.longitude,
      });
      const response = await fetchOrThrow(`/api/server/geocode?${query.toString()}`);
      const addressText = await response.text();
      setAddress(addressText);
    } catch (error) {
      console.error('Failed to fetch address:', error);
      setAddress('Address not available');
    } finally {
      setLoadingAddress(false);
    }
  };

  if (!event) return null;

  const eventTypeLabel = getEventTypeLabel(event.type);
  const eventTime = dayjs(event.eventTime || event.serverTime).format('YYYY-MM-DD HH:mm:ss');
  const deviceName = device?.name || `Device ${event.deviceId}`;

  return (
    <div className={classes.root}>
      <Rnd
        default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
        enableResizing={false}
        dragHandleClassName="draggable-header"
        style={{ position: 'relative' }}
      >
        <Card elevation={0} className={classes.card}>
          <div className={`${classes.header} draggable-header`}>
            <Typography variant="body2" className={classes.headerTitle}>
              {eventTypeLabel}
            </Typography>
            <IconButton
              size="small"
              className={classes.closeButton}
              onClick={onClose}
              onTouchStart={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <CardContent className={classes.content} style={{ padding:0 }}>
            <Table size="small" classes={{ root: classes.table }}>
              <TableBody>
                <StatusRow name="Device" content={deviceName} />
                <StatusRow name="Time" content={eventTime} />
                {position && (
                  <>
                    <StatusRow
                      name="Address"
                      content={
                        address ? (
                          <Typography variant="body2" sx={{ fontSize: '13px', color: '#333' }}>
                            {address}
                          </Typography>
                        ) : addressEnabled ? (
                          loadingAddress ? (
                            <div className={classes.addressLoading}>
                              <CircularProgress size={12} sx={{ color: '#667eea' }} />
                              <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                Loading...
                              </Typography>
                            </div>
                          ) : (
                            <Link
                              className={classes.addressLink}
                              onClick={fetchAddress}
                              underline="hover"
                            >
                              {t('sharedShowAddress')}
                            </Link>
                          )
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            N/A
                          </Typography>
                        )
                      }
                    />
                    <StatusRow
                      name="Speed"
                      content={`${Math.round(position.speed || 0)} km/h`}
                    />
                    <StatusRow
                      name="Coordinates"
                      content={`${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`}
                    />
                  </>
                )}
                {!position && (
                  <StatusRow
                    name="Location"
                    content={
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '13px' }}>
                        No location data available
                      </Typography>
                    }
                  />
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Rnd>
    </div>
  );
};

export default EventStatusCard;
