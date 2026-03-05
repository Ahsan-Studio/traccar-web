import {
 useEffect, useState, useMemo, useCallback, useRef 
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useSelector } from 'react-redux';

const useStyles = makeStyles()(() => ({
  dialogTitle: {
    backgroundColor: '#2a81d4',
    color: 'white',
    padding: '3px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .MuiTypography-root': { fontSize: '14px', fontWeight: 500 },
  },
  closeButton: {
    color: 'white',
    padding: '4px',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
  },
  chatContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  msgBubble: {
    maxWidth: '75%',
    padding: '8px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  serverMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#2a81d4',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  deviceMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderBottomLeftRadius: '4px',
  },
  msgTime: {
    fontSize: '10px',
    marginTop: '2px',
    opacity: 0.7,
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    paddingTop: '12px',
  },
}));

const ChatDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  // Load messages from API when device changes
  const fetchMessages = useCallback(async (deviceId) => {
    if (!deviceId) {
      setMessages([]);
      return;
    }
    try {
      const response = await fetch(`/api/chat?deviceId=${deviceId}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to fetch chat messages:', e);
    } finally {
      // done
    }
  }, []);

  useEffect(() => {
    if (open && selectedDeviceId) {
      fetchMessages(selectedDeviceId);
    } else {
      setMessages([]);
    }
  }, [selectedDeviceId, open, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !selectedDeviceId) return;

    setSending(true);
    const msgText = message.trim();
    setMessage('');

    try {
      // Save message to server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: parseInt(selectedDeviceId, 10),
          side: 'S',
          message: msgText,
          messageTime: new Date().toISOString(),
          messageStatus: 0,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        setMessages((prev) => [...prev, saved]);
      }

      // Also try to send via Traccar command API
      await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: parseInt(selectedDeviceId, 10),
          type: 'custom',
          attributes: { data: msgText },
        }),
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  }, [message, selectedDeviceId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!selectedDeviceId) return;
    try {
      const response = await fetch(`/api/chat/${selectedDeviceId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to clear chat:', e);
    }
  };

  const deviceName = selectedDeviceId ? (devices[selectedDeviceId]?.name || `ID: ${selectedDeviceId}`) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: '500px', height: '550px' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2">
          Chat {deviceName ? `— ${deviceName}` : ''}
        </Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box display="flex" gap={1} mb={1}>
          <FormControl size="small" fullWidth>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              label="Device"
            >
              {deviceList.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {messages.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleClearChat}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap', fontSize: '11px' }}
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Chat messages */}
        <Box className={classes.chatContainer}>
          {!selectedDeviceId ? (
            <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
              <Typography variant="caption" color="text.secondary">
                Select a device to start chatting
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
              <Typography variant="caption" color="text.secondary">
                No messages yet. Start a conversation.
              </Typography>
            </Box>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id}
                className={`${classes.msgBubble} ${msg.side === 'S' ? classes.serverMsg : classes.deviceMsg}`}
              >
                <div>{msg.message}</div>
                <div className={classes.msgTime}>
                  {msg.messageTime ? new Date(msg.messageTime).toLocaleTimeString() : ''}
                </div>
              </Box>
            ))
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Input */}
        <Box className={classes.inputRow}>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDeviceId ? 'Type a message...' : 'Select a device first'}
            size="small"
            fullWidth
            disabled={!selectedDeviceId || sending}
            multiline
            maxRows={3}
          />
          <IconButton
            onClick={handleSend}
            disabled={!message.trim() || !selectedDeviceId || sending}
            sx={{
              backgroundColor: '#2a81d4',
              color: '#fff',
              '&:hover': { backgroundColor: '#1b6ab8' },
              '&.Mui-disabled': { backgroundColor: '#ccc', color: '#888' },
            }}
          >
            {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
