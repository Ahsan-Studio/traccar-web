import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';

const IconSelector = ({ value, onChange }) => {
  const [selectedIcon, setSelectedIcon] = useState(value || 'pin-1.svg');
  const [activeTab, setActiveTab] = useState(0);

  const defaultIcons = useMemo(() => Array.from({ length: 30 }, (_, i) => `pin-${i + 1}.svg`), []);

  useEffect(() => {
    if (value && value !== selectedIcon) {
      setSelectedIcon(value);
    }
  }, [value]);

  const handleIconClick = (icon) => {
    setSelectedIcon(icon);
    if (onChange) onChange(icon);
  };

  return (
    <Box sx={{ mt: '6px' }}>
      {/* Default / Custom tabs - V1 style */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{
          minHeight: '28px',
          '& .MuiTab-root': {
            minHeight: '28px',
            fontSize: '11px',
            textTransform: 'none',
            padding: '4px 14px',
            fontWeight: 400,
            color: '#555',
            '&.Mui-selected': {
              color: '#333',
              fontWeight: 500,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#2b82d4',
            height: '2px',
          },
        }}
      >
        <Tab label="Default" />
        <Tab label="Custom" />
      </Tabs>

      {activeTab === 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '4px',
            maxHeight: '180px',
            overflowY: 'auto',
            p: '6px',
            mt: '4px',
          }}
        >
          {defaultIcons.map((icon) => (
            <Box
              key={icon}
              onClick={() => handleIconClick(icon)}
              sx={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: selectedIcon === icon ? '2px solid #1976d2' : '2px solid transparent',
                borderRadius: '3px',
                backgroundColor: selectedIcon === icon ? '#e3f2fd' : 'transparent',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
            >
              <img
                src={`/img/markers/places/${icon}`}
                alt={icon}
                style={{
                  width: '28px',
                  height: '28px',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </Box>
          ))}
        </Box>
      )}

      {activeTab === 1 && (
        <Box
          sx={{
            p: '12px',
            mt: '4px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: '11px', color: '#999' }}>
            No custom icons available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IconSelector;
