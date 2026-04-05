/* ─────────── Report Scheduling API ─────────── */
/* Uses Traccar's built-in Calendar and Report models for scheduling */

/* Generate iCal data for daily recurrence */
const generateDailyCalendar = () => {
  const now = new Date();
  const startDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GSI Tracking//Report Scheduler//EN
BEGIN:VEVENT
DTSTART:${startDate}
RRULE:FREQ=DAILY;INTERVAL=1
SUMMARY:Daily Report Schedule
END:VEVENT
END:VCALENDAR`;
};

/* Generate iCal data for weekly recurrence */
const generateWeeklyCalendar = () => {
  const now = new Date();
  const startDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GSI Tracking//Report Scheduler//EN
BEGIN:VEVENT
DTSTART:${startDate}
RRULE:FREQ=WEEKLY;INTERVAL=1
SUMMARY:Weekly Report Schedule
END:VEVENT
END:VCALENDAR`;
};

/* Create a calendar for scheduling */
export const createScheduleCalendar = async (isWeekly) => {
  const calendarData = isWeekly ? generateWeeklyCalendar() : generateDailyCalendar();
  const encoder = new TextEncoder();
  const data = Array.from(encoder.encode(calendarData));

  const response = await fetch('/api/calendars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: isWeekly ? 'Weekly Report Schedule' : 'Daily Report Schedule',
      data: data,
      attributes: {},
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create calendar');
  }

  return response.json();
};

/* Delete a calendar */
export const deleteScheduleCalendar = async (calendarId) => {
  const response = await fetch(`/api/calendars/${calendarId}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete calendar');
  }
};

/* Create a scheduled report in Traccar */
export const createScheduledReport = async (template, calendarId) => {
  // Map our report types to Traccar report types
  const traccarReportType = mapToTraccarReportType(template.type);

  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calendarId: calendarId,
      type: traccarReportType,
      description: template.name || 'Report',
      attributes: {
        originalType: template.type,
        format: template.format || 'html',
        deviceIds: template.deviceIds || [],
        groupIds: template.groupIds || [],
        email: template.scheduleEmail || '',
        showCoordinates: template.showCoordinates,
        showAddresses: template.showAddresses,
        stopDuration: template.stopDuration,
        speedLimit: template.speedLimit,
        nightStartHour: template.nightStartHour,
        nightStartMinute: template.nightStartMinute,
        nightEndHour: template.nightEndHour,
        nightEndMinute: template.nightEndMinute,
        ragLowScore: template.ragLowScore,
        ragHighScore: template.ragHighScore,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create scheduled report');
  }

  const report = await response.json();

  // Link devices to the report
  if (template.deviceIds && template.deviceIds.length > 0) {
    const permissions = template.deviceIds.map((deviceId) => ({
      deviceId,
      reportId: report.id,
    }));

    await fetch('/api/permissions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
  }

  // Link groups to the report
  if (template.groupIds && template.groupIds.length > 0) {
    const permissions = template.groupIds.map((groupId) => ({
      groupId,
      reportId: report.id,
    }));

    await fetch('/api/permissions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
  }

  return report;
};

/* Update a scheduled report */
export const updateScheduledReport = async (reportId, template, calendarId) => {
  const traccarReportType = mapToTraccarReportType(template.type);

  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: reportId,
      calendarId: calendarId,
      type: traccarReportType,
      description: template.name || 'Report',
      attributes: {
        originalType: template.type,
        format: template.format || 'html',
        deviceIds: template.deviceIds || [],
        groupIds: template.groupIds || [],
        email: template.scheduleEmail || '',
        showCoordinates: template.showCoordinates,
        showAddresses: template.showAddresses,
        stopDuration: template.stopDuration,
        speedLimit: template.speedLimit,
        nightStartHour: template.nightStartHour,
        nightStartMinute: template.nightStartMinute,
        nightEndHour: template.nightEndHour,
        nightEndMinute: template.nightEndMinute,
        ragLowScore: template.ragLowScore,
        ragHighScore: template.ragHighScore,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update scheduled report');
  }

  return response.json();
};

/* Delete a scheduled report */
export const deleteScheduledReport = async (reportId) => {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete scheduled report');
  }
};

/* Get all scheduled reports */
export const fetchScheduledReports = async () => {
  const response = await fetch('/api/reports', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled reports');
  }

  const reports = await response.json();

  // Parse attributes (config stored in attributes, name in description)
  return reports.map((report) => {
    try {
      const attrs = typeof report.attributes === 'string'
        ? JSON.parse(report.attributes || '{}')
        : (report.attributes || {});
      return {
        ...report,
        name: report.description || attrs.name || 'Report',
        ...attrs,
        traccarId: report.id,
        calendarId: report.calendarId,
      };
    } catch {
      return report;
    }
  });
};

/* Map our custom report types to Traccar report types */
const mapToTraccarReportType = (type) => {
  const mapping = {
    // Map to Traccar's built-in types
    general: 'summary',
    general_merged: 'summary',
    object_info: 'devices',
    current_position: 'route',
    current_position_off: 'route',
    route: 'route',
    route_data_sensors: 'route',
    trips: 'trips',
    drives_stops_sensors: 'trips',
    drives_stops_logic: 'trips',
    stops: 'stops',
    travel_sheet: 'trips',
    travel_sheet_dn: 'trips',
    mileage_daily: 'summary',
    overspeed: 'route',
    overspeed_count: 'route',
    underspeed: 'route',
    underspeed_count: 'route',
    zone_in_out: 'events',
    zone_in_out_general: 'events',
    events: 'events',
    service: 'summary',
    fuelfillings: 'summary',
    fuelthefts: 'summary',
    logic_sensors: 'route',
    rag: 'summary',
    rag_driver: 'summary',
    tasks: 'summary',
    rilogbook: 'events',
    dtc: 'events',
    expenses: 'summary',
    // Graphical reports
    speed_graph: 'route',
    altitude_graph: 'route',
    acc_graph: 'route',
    fuellevel_graph: 'route',
    temperature_graph: 'route',
    sensor_graph: 'route',
    // Map reports
    routes_map: 'route',
    routes_stops_map: 'route',
    image_gallery: 'route',
  };

  return mapping[type] || 'summary';
};

/* Setup scheduling for a template */
export const setupReportSchedule = async (template) => {
  if (!template.daily && !template.weekly) {
    return null;
  }

  if (!template.scheduleEmail) {
    throw new Error('Email address is required for scheduled reports');
  }

  // Create calendar
  const calendar = await createScheduleCalendar(template.weekly);

  // Create scheduled report
  const report = await createScheduledReport(template, calendar.id);

  return {
    calendarId: calendar.id,
    reportId: report.id,
  };
};

/* Remove scheduling for a template */
export const removeReportSchedule = async (calendarId, reportId) => {
  if (reportId) {
    await deleteScheduledReport(reportId);
  }
  if (calendarId) {
    await deleteScheduleCalendar(calendarId);
  }
};
