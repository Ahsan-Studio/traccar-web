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

const STORAGE_KEY = 'gps_chat';

const loadChatHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveChatHistory = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const ChatDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  // Load messages when device changes
  useEffect(() => {
    if (!selectedDeviceId) {
      setMessages([]);
      return;
    }
    const history = loadChatHistory();
    setMessages(history[selectedDeviceId] || []);
  }, [selectedDeviceId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !selectedDeviceId) return;

    setSending(true);
    const newMsg = {
      id: Date.now(),
      side: 'server',
      text: message.trim(),
      time: new Date().toISOString(),
      status: 'sending',
    };

    // Add to local messages
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setMessage('');

    try {
      // Try to send via Traccar command API (custom message command)
      const response = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: parseInt(selectedDeviceId),
          type: 'custom',
          attributes: {
            data: message.trim(),
          },
        }),
      });

      if (response.ok) {
        newMsg.status = 'sent';
      } else {
        // Even if API fails, keep message in local history
        newMsg.status = 'local';
      }
    } catch {
      newMsg.status = 'local';
    } finally {
      setSending(false);
      // Save to local storage
      const history = loadChatHistory();
      history[selectedDeviceId] = updatedMessages.map((m) => (m.id === newMsg.id ? newMsg : m));
      saveChatHistory(history);
      setMessages(history[selectedDeviceId]);
    }
  }, [message, selectedDeviceId, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (!selectedDeviceId) return;
    const history = loadChatHistory();
    delete history[selectedDeviceId];
    saveChatHistory(history);
    setMessages([]);
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
                className={`${classes.msgBubble} ${msg.side === 'server' ? classes.serverMsg : classes.deviceMsg}`}
              >
                <div>{msg.text}</div>
                <div className={classes.msgTime}>
                  {msg.time ? new Date(msg.time).toLocaleTimeString() : ''}
                  {msg.side === 'server' && msg.status && msg.status !== 'sent' && (
                    <span style={{ marginLeft: '4px' }}>
                      {msg.status === 'sending' ? ' ...' : msg.status === 'local' ? ' (local)' : ''}
                    </span>
                  )}
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
