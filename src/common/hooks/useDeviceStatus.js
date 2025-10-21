import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate device status and duration
 * @param {Object} device - Device object
 * @param {Object} position - Position object
 * @param {Number} connectionTimeout - Timeout in seconds (default: 600 = 10 minutes)
 * @returns {Object} { type, duration, text, color }
 */
const useDeviceStatus = (device, position, connectionTimeout = 600) => {
  const [status, setStatus] = useState({
    type: 'unknown', // 'stopped', 'moving', 'idle', 'offline', 'unknown'
    duration: 0, // in seconds
    text: 'No data',
    color: '#9e9e9e',
  });

  useEffect(() => {
    if (!device || !position) {
      setStatus({
        type: 'unknown',
        duration: 0,
        text: 'No data',
        color: '#9e9e9e',
      });
      return;
    }

    const calculateStatus = () => {
      const now = new Date();
      const serverTime = new Date(position.serverTime);
      
      // Calculate time difference
      const timeDiff = Math.floor((now - serverTime) / 1000); // in seconds
      
      // Check if device is offline (no connection)
      if (timeDiff > connectionTimeout) {
        return {
          type: 'offline',
          duration: timeDiff,
          text: `Offline ${formatDuration(timeDiff)}`,
          color: '#f44336', // red
        };
      }

      // Check if position is valid
      if (!position.valid) {
        return {
          type: 'offline',
          duration: timeDiff,
          text: `No GPS ${formatDuration(timeDiff)}`,
          color: '#ff9800', // orange
        };
      }

      // Get speed and ignition status
      const speed = position.speed || 0;
      const ignition = position.attributes?.ignition;
      
      // Determine status based on speed and ignition
      // Moving: speed > 5 km/h
      if (speed > 5) {
        return {
          type: 'moving',
          duration: timeDiff,
          text: `Moving ${formatDuration(timeDiff)}`,
          color: '#4caf50', // green
        };
      }
      
      // Engine Idle: ignition on but not moving
      if (ignition === true && speed <= 5) {
        return {
          type: 'idle',
          duration: timeDiff,
          text: `Engine Idle ${formatDuration(timeDiff)}`,
          color: '#ffc107', // yellow/amber
        };
      }
      
      // Stopped: ignition off or low speed
      if (ignition === false || speed <= 5) {
        return {
          type: 'stopped',
          duration: timeDiff,
          text: `Stopped ${formatDuration(timeDiff)}`,
          color: '#f44336', // red
        };
      }

      // Default
      return {
        type: 'unknown',
        duration: timeDiff,
        text: `Unknown ${formatDuration(timeDiff)}`,
        color: '#9e9e9e', // grey
      };
    };

    setStatus(calculateStatus());

    // Update every minute
    const interval = setInterval(() => {
      setStatus(calculateStatus());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [device, position, connectionTimeout]);

  return status;
};

/**
 * Format duration in seconds to human readable format
 * @param {Number} seconds 
 * @returns {String} Formatted duration (e.g., "2h 30m", "5m", "3d 2h")
 */
const formatDuration = (seconds) => {
  if (seconds < 0) return '0m';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || (hours === 0 && days === 0)) {
    parts.push(`${minutes}m`);
  }
  
  // Return max 2 parts (e.g., "2d 5h" or "3h 20m" or "45m")
  return parts.slice(0, 2).join(' ') || '0m';
};

export default useDeviceStatus;
export { formatDuration };
