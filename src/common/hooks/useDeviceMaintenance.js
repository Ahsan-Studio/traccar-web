import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

/**
 * Custom hook to calculate maintenance/service alerts for a device
 * @param {number} deviceId - Device ID
 * @param {object} position - Current device position (with attributes)
 * @returns {object} { alerts: Array, hasExpired: boolean, hasWarning: boolean }
 */
const useDeviceMaintenance = (deviceId, position) => {
  const [alerts, setAlerts] = useState([]);
  const [hasExpired, setHasExpired] = useState(false);
  const [hasWarning, setHasWarning] = useState(false);

  const maintenances = useSelector((state) => state.maintenances.items);
  const devices = useSelector((state) => state.devices.items);
  const device = devices[deviceId];

  useEffect(() => {
    if (!device || !position) {
      setAlerts([]);
      setHasExpired(false);
      setHasWarning(false);
      return;
    }

    // Get maintenances linked to this device
    const deviceMaintenances = Object.values(maintenances).filter(() => {
      // Check if this maintenance is linked to the device
      // In Traccar, maintenances are linked via attributes or device linking
      return true; // For now, return all - we'll filter by actual device linking later
    });

    if (deviceMaintenances.length === 0) {
      setAlerts([]);
      setHasExpired(false);
      setHasWarning(false);
      return;
    }

    const calculatedAlerts = [];
    let expired = false;
    let warning = false;

    deviceMaintenances.forEach((maintenance) => {
      const alert = calculateMaintenanceStatus(maintenance, position);
      if (alert) {
        calculatedAlerts.push(alert);
        if (alert.status === 'expired') {
          expired = true;
        } else if (alert.status === 'warning') {
          warning = true;
        }
      }
    });

    setAlerts(calculatedAlerts);
    setHasExpired(expired);
    setHasWarning(warning);
  }, [device, position, maintenances, deviceId]);

  return { alerts, hasExpired, hasWarning };
};

/**
 * Calculate maintenance status based on type (odometer, hours, date)
 */
const calculateMaintenanceStatus = (maintenance, position) => {
  const { type, start, period, name } = maintenance;
  
  if (!type || !period) return null;

  let current = 0;
  let remaining = 0;
  let unit = '';
  let status = 'ok'; // 'ok', 'warning', 'expired'

  try {
    switch (type) {
      case 'totalDistance':
        // Odometer-based maintenance
        current = position.attributes?.totalDistance || 0;
        remaining = (start + period) - current;
        unit = 'km';
        
        if (remaining <= 0) {
          status = 'expired';
        } else if (remaining < period * 0.1) {
          // Warning if less than 10% remaining
          status = 'warning';
        }
        break;

      case 'hours':
        // Engine hours-based maintenance
        current = position.attributes?.hours || 0;
        remaining = (start + period) - current;
        unit = 'h';
        
        if (remaining <= 0) {
          status = 'expired';
        } else if (remaining < period * 0.1) {
          status = 'warning';
        }
        break;

      case 'fixTime': {
        // Date-based maintenance
        const startDate = dayjs(start);
        const nextDate = startDate.add(period, 'millisecond');
        const now = dayjs();
        
        remaining = nextDate.diff(now, 'day');
        unit = 'days';
        
        if (remaining <= 0) {
          status = 'expired';
        } else if (remaining < 7) {
          // Warning if less than 7 days
          status = 'warning';
        }
        break;
      }

      default:
        return null;
    }

    return {
      name,
      type,
      current: Math.round(current),
      remaining: Math.round(remaining),
      unit,
      status,
      text: formatMaintenanceText(name, remaining, unit, status),
    };
  } catch (error) {
    console.error('Error calculating maintenance:', error);
    return null;
  }
};

/**
 * Format maintenance text for display
 */
const formatMaintenanceText = (name, remaining, unit, status) => {
  const absRemaining = Math.abs(remaining);
  
  if (status === 'expired') {
    return `${name}: EXPIRED (${absRemaining} ${unit} overdue)`;
  }
  
  if (status === 'warning') {
    return `${name}: WARNING (${absRemaining} ${unit} left)`;
  }
  
  return `${name}: ${absRemaining} ${unit} left`;
};

export default useDeviceMaintenance;
