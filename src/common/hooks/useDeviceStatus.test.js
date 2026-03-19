import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useDeviceStatus from './useDeviceStatus';

// Mock Date.now() to return a fixed time
const mockNow = new Date('2026-03-20T00:00:00.000Z').getTime();
const originalDateNow = Date.now;

describe('useDeviceStatus', () => {
  beforeEach(() => {
    Date.now = () => mockNow;
    vi.useFakeTimers();
  });

  afterEach(() => {
    Date.now = originalDateNow;
    vi.useRealTimers();
  });

  describe('Device status from API (primary source of truth)', () => {
    it('should return offline when device.status is offline (regardless of position age)', () => {
      const device = {
        id: 1,
        status: 'offline',
        lastUpdate: '2026-03-20T00:00:00.000Z',
      };
      const position = {
        deviceId: 1,
        serverTime: '2026-03-20T00:00:00.000Z',
        valid: true,
        speed: 0,
        attributes: {},
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('offline');
      expect(result.current.color).toBe('#9e9e9e');
    });

    it('should return online when device.status is online even with old position', () => {
      // Position is 20 minutes old (older than 10 minute timeout)
      const oldPositionTime = new Date(mockNow - 20 * 60 * 1000).toISOString();

      const device = {
        id: 1,
        status: 'online',
        lastUpdate: oldPositionTime,
      };
      const position = {
        deviceId: 1,
        serverTime: oldPositionTime,
        valid: true,
        speed: 0,
        attributes: { ignition: false },
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      // With the fix, this should NOT be offline - it should be stopped or online
      expect(result.current.type).not.toBe('offline');
      expect(result.current.type).toBe('stopped');
    });

    it('should return online (No GPS) when device.status is online but no position', () => {
      const device = {
        id: 1,
        status: 'online',
        lastUpdate: '2026-03-20T00:00:00.000Z',
      };

      const { result } = renderHook(() => useDeviceStatus(device, null, 600));

      expect(result.current.type).toBe('online');
      expect(result.current.text).toContain('No GPS');
      expect(result.current.color).toBe('#4caf50');
    });
  });

  describe('Sub-status when device is online', () => {
    const createOnlineDevice = () => ({
      id: 1,
      status: 'online',
      lastUpdate: '2026-03-20T00:00:00.000Z',
    });

    it('should return moving when speed > 5 km/h', () => {
      const device = createOnlineDevice();
      const position = {
        deviceId: 1,
        serverTime: '2026-03-20T00:00:00.000Z',
        valid: true,
        speed: 10,
        attributes: {},
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('moving');
      expect(result.current.color).toBe('#4caf50');
    });

    it('should return idle when ignition is on but speed <= 5', () => {
      const device = createOnlineDevice();
      const position = {
        deviceId: 1,
        serverTime: '2026-03-20T00:00:00.000Z',
        valid: true,
        speed: 0,
        attributes: { ignition: true },
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('idle');
      expect(result.current.color).toBe('#ffc107');
    });

    it('should return stopped when ignition is off', () => {
      const device = createOnlineDevice();
      const position = {
        deviceId: 1,
        serverTime: '2026-03-20T00:00:00.000Z',
        valid: true,
        speed: 0,
        attributes: { ignition: false },
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('stopped');
      expect(result.current.color).toBe('#f44336');
    });

    it('should return online (No GPS) when position is invalid', () => {
      const device = createOnlineDevice();
      const position = {
        deviceId: 1,
        serverTime: '2026-03-20T00:00:00.000Z',
        valid: false,
        speed: 0,
        attributes: {},
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('online');
      expect(result.current.text).toContain('No GPS');
      expect(result.current.color).toBe('#ff9800');
    });
  });

  describe('Edge cases', () => {
    it('should return unknown when device is null', () => {
      const { result } = renderHook(() => useDeviceStatus(null, null, 600));

      expect(result.current.type).toBe('unknown');
      expect(result.current.text).toBe('No data');
    });

    it('should return unknown when device exists but no status and no position', () => {
      const device = { id: 1 };
      const { result } = renderHook(() => useDeviceStatus(device, null, 600));

      expect(result.current.type).toBe('unknown');
    });

    it('should use device.lastUpdate when position.serverTime is not available', () => {
      const device = {
        id: 1,
        status: 'online',
        lastUpdate: '2026-03-20T00:00:00.000Z',
      };
      const position = {
        deviceId: 1,
        // No serverTime
        valid: true,
        speed: 10,
        attributes: {},
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      expect(result.current.type).toBe('moving');
    });
  });

  describe('Real-world scenario from bug report', () => {
    it('should show online status for device with status="online" even with old position', () => {
      // This simulates the bug: device status is online from API,
      // but position is older than timeout threshold
      const device = {
        id: 3,
        status: 'online',
        lastUpdate: '2026-03-19T23:40:50.000+00:00',
      };
      // Position is about 20 minutes old
      const position = {
        deviceId: 3,
        serverTime: '2026-03-19T23:40:50.000+00:00',
        valid: true,
        speed: 0,
        attributes: { ignition: false },
      };

      const { result } = renderHook(() => useDeviceStatus(device, position, 600));

      // BUG FIX: Should NOT be offline - should respect device.status
      expect(result.current.type).not.toBe('offline');
      expect(result.current.type).toBe('stopped');
    });
  });
});
