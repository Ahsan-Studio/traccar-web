/**
 * Config Export / Import Utility
 *
 * Exports settings data (events, sensors, services, custom-fields, places,
 * groups, drivers, templates, commands) as JSON config files (.evt, .sen, etc.)
 * and imports them back.
 *
 * Format follows V1 convention: JSON with a `version` header and `data` array.
 */

const CONFIG_VERSION = '2.0v';

// ────────── Format definitions ──────────────────────────────────────
export const CONFIG_FORMATS = {
  evt: {
    ext: 'evt',
    label: 'Events',
    endpoint: '/api/custom-events',
    exportFields: [
      'type', 'description', 'active', 'duration', 'weekDays', 'dayTimeFrom',
      'dayTimeTo', 'speedLimit', 'distance', 'routeId', 'zoneId',
      'notifySystem', 'notifyPush', 'notifyEmail', 'notifyEmailAddr',
      'notifySms', 'notifySmsNumber', 'notifyWebhook', 'webhookUrl',
      'commandOnTrigger', 'conditions',
    ],
  },
  sen: {
    ext: 'sen',
    label: 'Sensors',
    endpoint: '/api/sensors',
    exportFields: [
      'name', 'type', 'parameter', 'popup', 'resultType',
      'textTrue', 'textFalse', 'units', 'lowValue', 'highValue',
      'formula', 'calibration', 'dictionary', 'accIgnore',
    ],
  },
  ser: {
    ext: 'ser',
    label: 'Services',
    endpoint: '/api/services',
    exportFields: [
      'name', 'popup', 'odoInterval', 'odoLast', 'odoLeft',
      'enghInterval', 'enghLast', 'enghLeft',
      'daysInterval', 'daysLast', 'daysLeft', 'updateLast',
    ],
  },
  cfl: {
    ext: 'cfl',
    label: 'Custom Fields',
    endpoint: '/api/custom-fields',
    exportFields: ['name', 'value', 'popup'],
  },
  odr: {
    ext: 'odr',
    label: 'Drivers',
    endpoint: '/api/custom-drivers',
    exportFields: [
      'name', 'uniqueId', 'address', 'phone', 'email', 'description',
    ],
  },
  tem: {
    ext: 'tem',
    label: 'Templates',
    endpoint: '/api/templates',
    exportFields: ['name', 'description', 'message'],
  },
  cte: {
    ext: 'cte',
    label: 'Command Templates',
    endpoint: '/api/commands',
    exportFields: ['description', 'type', 'textChannel', 'attributes'],
  },
  ogr: {
    ext: 'ogr',
    label: 'Object Groups',
    endpoint: '/api/custom-groups',
    exportFields: ['name', 'description'],
  },
  plc: {
    ext: 'plc',
    label: 'Places',
    endpoint: '/api/places',
    exportFields: null, // special handling – combined markers, routes, zones
  },
};

/**
 * Export a configuration type.
 * @param {'evt'|'sen'|'ser'|'cfl'|'odr'|'tem'|'ogr'|'plc'} formatKey
 * @param {number} [deviceId] - optional device scope (for sensors/services/custom-fields)
 * @returns {Promise<void>} downloads the file
 */
export const exportConfig = async (formatKey, deviceId) => {
  const fmt = CONFIG_FORMATS[formatKey];
  if (!fmt) throw new Error(`Unknown config format: ${formatKey}`);

  let url = fmt.endpoint;
  if (deviceId) url += `?deviceId=${deviceId}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${fmt.label}`);
  const rawData = await response.json();

  let data;
  if (fmt.exportFields) {
    // Pick only defined fields
    data = rawData.map((item) => {
      const picked = {};
      fmt.exportFields.forEach((f) => {
        if (item[f] !== undefined) picked[f] = item[f];
      });
      return picked;
    });
  } else {
    data = rawData;
  }

  const payload = {
    version: CONFIG_VERSION,
    format: formatKey,
    label: fmt.label,
    exportedAt: new Date().toISOString(),
    count: data.length,
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fmt.label.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
};

/**
 * Import a configuration file.
 * @param {'evt'|'sen'|'ser'|'cfl'|'odr'|'tem'|'ogr'|'plc'} formatKey
 * @param {File} file
 * @param {number} [deviceId] - optional device scope
 * @returns {Promise<{imported: number, errors: string[]}>}
 */
export const importConfig = async (formatKey, file, deviceId) => {
  const fmt = CONFIG_FORMATS[formatKey];
  if (!fmt) throw new Error(`Unknown config format: ${formatKey}`);

  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!payload.data || !Array.isArray(payload.data)) {
    throw new Error('Invalid config file format: missing "data" array');
  }

  let url = fmt.endpoint;
  if (deviceId) url += `?deviceId=${deviceId}`;

  const results = { imported: 0, errors: [] };

  for (const item of payload.data) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (resp.ok) {
        results.imported += 1;
      } else {
        const errText = await resp.text();
        results.errors.push(`Failed to import: ${errText}`);
      }
    } catch (err) {
      results.errors.push(`Error: ${err.message}`);
    }
  }

  return results;
};

/**
 * Export CSV for history/events/tasks data.
 * @param {Array<Object>} rows - data rows
 * @param {Array<{key: string, label: string}>} columns - column definitions
 * @param {string} filename
 */
export const exportCsv = (rows, columns, filename) => {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(','),
  ).join('\n');

  const csv = `\uFEFF${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
