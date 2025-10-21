import {
  useState, useCallback, useRef, useEffect,
} from 'react';
import { makeStyles } from 'tss-react/mui';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  panel: {
    overflow: 'auto',
    backgroundColor: '#fff',
  },
  resizer: {
    height: '4px',
    background: '#e0e0e0',
    cursor: 'ns-resize',
    userSelect: 'none',
    flexShrink: 0,
    '&:hover': {
      background: '#2b82d4',
    },
    '&:active': {
      background: '#1976d2',
    },
  },
}));

const ResizablePanel = ({ topPanel, bottomPanel, defaultTopHeight = 60 }) => {
  const { classes } = useStyles();
  const containerRef = useRef(null);
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newTopHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    // Limit between 20% and 80%
    if (newTopHeight > 20 && newTopHeight < 80) {
      setTopHeight(newTopHeight);
      
      // Save to localStorage
      try {
        localStorage.setItem('deviceListPanelHeight', newTopHeight.toString());
      } catch (error) {
        console.error('Failed to save panel height:', error);
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Load saved height from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deviceListPanelHeight');
      if (saved) {
        const height = parseFloat(saved);
        if (height > 20 && height < 80) {
          setTopHeight(height);
        }
      }
    } catch (error) {
      console.error('Failed to load panel height:', error);
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box ref={containerRef} className={classes.container}>
      {/* Top Panel */}
      <Box 
        className={classes.panel} 
        sx={{ 
          height: `${topHeight}%`,
          minHeight: '100px',
        }}
      >
        {topPanel}
      </Box>

      {/* Resizer */}
      <Box 
        className={classes.resizer}
        onMouseDown={handleMouseDown}
        sx={{
          backgroundColor: isDragging ? '#1976d2' : undefined,
        }}
      />

      {/* Bottom Panel */}
      <Box 
        className={classes.panel}
        sx={{ 
          height: `${100 - topHeight}%`,
          minHeight: '100px',
        }}
      >
        {bottomPanel}
      </Box>
    </Box>
  );
};

ResizablePanel.propTypes = {
  topPanel: PropTypes.node.isRequired,
  bottomPanel: PropTypes.node.isRequired,
  defaultTopHeight: PropTypes.number,
};

export default ResizablePanel;
