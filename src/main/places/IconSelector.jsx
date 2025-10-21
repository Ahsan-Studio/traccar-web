import { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

const IconSelector = ({ value, onChange }) => {
  const [selectedIcon, setSelectedIcon] = useState(value || 'pin-1.svg');

  // List of available icons - sesuaikan dengan icons di /img/markers/places/
  const defaultIcons = useMemo(() => [
    'pin-1.svg',
    'pin-2.svg',
    'pin-3.svg',
    'pin-4.svg',
    'pin-5.svg',
    'pin-6.svg',
    'pin-7.svg',
    'pin-8.svg',
    'pin-9.svg',
    'pin-10.svg',
    'pin-11.svg',
    'pin-12.svg',
    'pin-13.svg',
    'pin-14.svg',
    'pin-15.svg',
    'pin-16.svg',
    'pin-17.svg',
    'pin-18.svg',
    'pin-19.svg',
    'pin-20.svg',
    'pin-21.svg',
    'pin-22.svg',
    'pin-23.svg',
    'pin-24.svg',
    'pin-25.svg',
    'pin-26.svg',
    'pin-27.svg',
    'pin-28.svg',
    'pin-29.svg',
    'pin-30.svg',
  ], []);

  // Sync with parent value
  useEffect(() => {
    if (value && value !== selectedIcon) {
      setSelectedIcon(value);
    }
  }, [value]);

  const handleIconChange = (event, newIcon) => {
    if (newIcon !== null) {
      setSelectedIcon(newIcon);
      if (onChange) {
        onChange(newIcon);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        Select Icon:
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 1,
          maxHeight: '200px',
          overflowY: 'auto',
          p: 1,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
        }}
      >
        {defaultIcons.map((icon) => (
          <Box
            key={icon}
            onClick={() => handleIconChange(null, icon)}
            sx={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: selectedIcon === icon ? '2px solid #1976d2' : '2px solid transparent',
              borderRadius: 1,
              backgroundColor: selectedIcon === icon ? '#e3f2fd' : 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#90caf9',
              },
            }}
          >
            <img
              src={`/img/markers/places/${icon}`}
              alt={icon}
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Box>
        ))}
      </Box>
      
      {/* Preview Selected Icon */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Selected:
        </Typography>
        <Box
          sx={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            backgroundColor: '#f9f9f9',
          }}
        >
          <img
            src={`/img/markers/places/${selectedIcon}`}
            alt="Selected icon"
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.src = '/img/markers/places/pin-1.svg';
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {selectedIcon}
        </Typography>
      </Box>
    </Box>
  );
};

export default IconSelector;
