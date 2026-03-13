import {
  useEffect, useState, useMemo, useCallback, useRef,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  IconButton, Typography, Box, Tabs, Tab,
  CircularProgress, Menu, MenuItem,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import { useSelector } from 'react-redux';
import {
  CustomTable, CustomSelect, CustomCheckbox, CustomInput, CustomButton, CustomMultiSelect, BoolIcon,
} from '../common/components/custom';

/* ─────────── Report type definitions (V1 parity – 4 groups) ─────────── */
const REPORT_TYPES = [
  // Text Reports
  { id: 'general', label: 'General Information', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'general_merged', label: 'General Information (Merged)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'object_info', label: 'Object Information', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'current_position', label: 'Current Position', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'current_position_off', label: 'Current Position (Offline)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'route', label: 'Route Data', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'route_data_sensors', label: 'Route Data with Sensors', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'trips', label: 'Drives and Stops', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'drives_stops_sensors', label: 'Drives and Stops with Sensors', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'drives_stops_logic', label: 'Drives and Stops with Logic Sensors', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'stops', label: 'Stops', group: 'Text Reports', endpoint: '/api/reports/stops' },
  { id: 'travel_sheet', label: 'Travel Sheet', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'travel_sheet_dn', label: 'Travel Sheet (Day/Night)', group: 'Text Reports', endpoint: '/api/reports/trips' },
  { id: 'mileage_daily', label: 'Mileage Daily', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'overspeed', label: 'Overspeeds', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'overspeed_count', label: 'Overspeed Count (Merged)', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'underspeed', label: 'Underspeeds', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'underspeed_count', label: 'Underspeed Count (Merged)', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'zone_in_out', label: 'Zone In/Out', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'zone_in_out_general', label: 'Zone In/Out with General Info', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'events', label: 'Events', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'service', label: 'Service', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'fuelfillings', label: 'Fuel Fillings', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'fuelthefts', label: 'Fuel Thefts', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'logic_sensors', label: 'Logic Sensors', group: 'Text Reports', endpoint: '/api/reports/route' },
  { id: 'rag', label: 'Driver Behavior RAG (by Object)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'rag_driver', label: 'Driver Behavior RAG (by Driver)', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'tasks', label: 'Tasks', group: 'Text Reports', endpoint: '/api/reports/summary' },
  { id: 'rilogbook', label: 'RFID and iButton Logbook', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'dtc', label: 'Diagnostic Trouble Codes', group: 'Text Reports', endpoint: '/api/reports/events' },
  { id: 'expenses', label: 'Expenses', group: 'Text Reports', endpoint: '/api/reports/summary' },
  // Graphical Reports
  { id: 'speed_graph', label: 'Speed', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'altitude_graph', label: 'Altitude', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'acc_graph', label: 'Ignition', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'fuellevel_graph', label: 'Fuel Level', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'temperature_graph', label: 'Temperature', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  { id: 'sensor_graph', label: 'Sensor', group: 'Graphical Reports', endpoint: '/api/reports/route' },
  // Map Reports
  { id: 'routes_map', label: 'Routes', group: 'Map Reports', endpoint: '/api/reports/route' },
  { id: 'routes_stops_map', label: 'Routes with Stops', group: 'Map Reports', endpoint: '/api/reports/route' },
  { id: 'image_gallery', label: 'Image Gallery', group: 'Map Reports', endpoint: '/api/reports/route' },
];

const REPORT_TYPE_MAP = {};
REPORT_TYPES.forEach((rt) => { REPORT_TYPE_MAP[rt.id] = rt; });

const FORMAT_OPTIONS = [
  { id: 'html', label: 'HTML' },
  { id: 'pdf', label: 'PDF' },
  { id: 'xls', label: 'XLS' },
];

const TIME_FILTERS = [
  { id: '', label: '—' },
  { id: 'lastHour', label: 'Last Hour' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'before2days', label: 'Before 2 Days' },
  { id: 'before3days', label: 'Before 3 Days' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
];

const STOP_DURATIONS = [
  { value: '1', label: '> 1 min' },
  { value: '2', label: '> 2 min' },
  { value: '5', label: '> 5 min' },
  { value: '10', label: '> 10 min' },
  { value: '20', label: '> 20 min' },
  { value: '30', label: '> 30 min' },
  { value: '60', label: '> 1 h' },
  { value: '120', label: '> 2 h' },
  { value: '300', label: '> 5 h' },
];

/* ─────────── Derived select options for custom components ─────────── */
const TYPE_OPTIONS = REPORT_TYPES.map((rt) => ({ value: rt.id, label: rt.label }));
const FORMAT_SELECT_OPTIONS = FORMAT_OPTIONS.map((f) => ({ value: f.id, label: f.label }));
const TIME_FILTER_OPTIONS = TIME_FILTERS.map((f) => ({ value: f.id, label: f.label }));
const STOP_DURATION_OPTIONS = STOP_DURATIONS.map((s) => ({ value: s.value, label: s.label }));

/* ─────────── API helpers (server-side via user-templates) ─────────── */
const SUBJECT_TEMPLATE = 'report_template';
const SUBJECT_GENERATED = 'report_generated';

const parseUserTemplate = (t, subject) => ({
  ...t.attributes,
  id: t.id,
  name: t.name,
  _serverId: t.id,
  _subject: subject,
});

const fetchBySubject = async (subject) => {
  try {
    const response = await fetch('/api/user-templates', { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      return data.filter((t) => t.subject === subject).map((t) => parseUserTemplate(t, subject));
    }
  } catch (e) {
    console.error(`Failed to fetch ${subject}:`, e);
  }
  return [];
};

const fetchReportTemplates = () => fetchBySubject(SUBJECT_TEMPLATE);
const fetchGeneratedReports = () => fetchBySubject(SUBJECT_GENERATED);

const saveUserTemplate = async (tpl, subject) => {
  const attrs = { ...tpl };
  delete attrs._serverId;
  delete attrs._subject;
  const payload = {
    name: tpl.name || 'Untitled Report',
    subject,
    description: tpl.type || 'general',
    message: tpl.dateTime || tpl.name || subject,
    attributes: attrs,
  };

  try {
    if (tpl._serverId) {
      payload.id = tpl._serverId;
      const response = await fetch(`/api/user-templates/${tpl._serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const saved = await response.json();
        return parseUserTemplate(saved, subject);
      }
    } else {
      const response = await fetch('/api/user-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const saved = await response.json();
        return parseUserTemplate(saved, subject);
      }
    }
  } catch (e) {
    console.error(`Failed to save ${subject}:`, e);
  }
  return null;
};

const saveReportTemplate = (tpl) => saveUserTemplate(tpl, SUBJECT_TEMPLATE);
const saveGeneratedReport = (tpl) => saveUserTemplate(tpl, SUBJECT_GENERATED);

const deleteUserTemplate = async (serverId) => {
  try {
    await fetch(`/api/user-templates/${serverId}`, { method: 'DELETE' });
  } catch (e) {
    console.error('Failed to delete user-template:', e);
  }
};

/** Re-fetch report data from Traccar API using stored params */
const refetchReportData = async (gen) => {
  const rt = REPORT_TYPE_MAP[gen.type];
  if (!rt || !gen.deviceIds?.length || !gen.dateFrom || !gen.dateTo) return [];
  const from = new Date(gen.dateFrom).toISOString();
  const to = new Date(gen.dateTo).toISOString();

  // RAG reports need route data to compute scores
  if (gen.type === 'rag' || gen.type === 'rag_driver') {
    return computeRagReport(gen.deviceIds, from, to);
  }

  const allData = [];
  for (const devId of gen.deviceIds) {
    const url = `${rt.endpoint}?deviceId=${devId}&from=${from}&to=${to}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const json = await resp.json();
      allData.push(...json);
    }
  }
  return allData;
};

/** Compute RAG (Red/Amber/Green) driver behavior scores from route + event data */
const computeRagReport = async (deviceIds, from, to) => {
  const results = [];

  for (const devId of deviceIds) {
    // Fetch summary for distance
    const summaryUrl = `/api/reports/summary?deviceId=${devId}&from=${from}&to=${to}`;
    const summaryResp = await fetch(summaryUrl, { headers: { Accept: 'application/json' } });
    const summaryData = summaryResp.ok ? await summaryResp.json() : [];

    // Fetch route data for overspeed analysis
    const routeUrl = `/api/reports/route?deviceId=${devId}&from=${from}&to=${to}`;
    const routeResp = await fetch(routeUrl, { headers: { Accept: 'application/json' } });
    const routeData = routeResp.ok ? await routeResp.json() : [];

    // Fetch events for harsh acceleration/braking/cornering
    const eventsUrl = `/api/reports/events?deviceId=${devId}&from=${from}&to=${to}`;
    const eventsResp = await fetch(eventsUrl, { headers: { Accept: 'application/json' } });
    const eventsData = eventsResp.ok ? await eventsResp.json() : [];

    const summary = summaryData[0] || {};
    const distanceKm = (summary.distance || 0) / 1000; // meters to km

    // Compute overspeed duration (seconds where speed > speedLimit)
    let overspeedMs = 0;
    for (let i = 0; i < routeData.length - 1; i += 1) {
      const pos = routeData[i];
      const nextPos = routeData[i + 1];
      const speedLimit = pos.attributes?.speedLimit || 0;
      if (speedLimit > 0 && pos.speed > speedLimit) {
        overspeedMs += new Date(nextPos.fixTime).getTime() - new Date(pos.fixTime).getTime();
      }
    }

    // Count harsh events from alarms
    let haccelCount = 0;
    let hbrakeCount = 0;
    let hcornCount = 0;
    eventsData.forEach((ev) => {
      const alarm = ev.attributes?.alarm || ev.type || '';
      if (alarm.includes('hardAcceleration') || alarm.includes('haccel')) haccelCount += 1;
      if (alarm.includes('hardBraking') || alarm.includes('hbrake')) hbrakeCount += 1;
      if (alarm.includes('hardCornering') || alarm.includes('hcorn')) hcornCount += 1;
    });

    // Compute scores (V1 formula)
    const overspeedScore = distanceKm > 0 ? ((overspeedMs / 10000) / distanceKm) * 100 : 0;
    const haccelScore = distanceKm > 0 ? (haccelCount / distanceKm) * 100 : 0;
    const hbrakeScore = distanceKm > 0 ? (hbrakeCount / distanceKm) * 100 : 0;
    const hcornScore = distanceKm > 0 ? (hcornCount / distanceKm) * 100 : 0;
    const ragScore = overspeedScore + haccelScore + hbrakeScore + hcornScore;

    results.push({
      deviceId: devId,
      deviceName: summary.deviceName || `Device ${devId}`,
      distance: summary.distance || 0,
      _overspeedDuration: overspeedMs,
      _overspeedScore: overspeedScore,
      _haccelCount: haccelCount,
      _haccelScore: haccelScore,
      _hbrakeCount: hbrakeCount,
      _hbrakeScore: hbrakeScore,
      _hcornCount: hcornCount,
      _hcornScore: hcornScore,
      _ragScore: ragScore,
    });
  }

  return results;
};

/* ─────────── HTML report generator (V1 parity) ─────────── */
const buildHtmlReport = (data, template, devices, dateFrom, dateTo) => {
  const rt = REPORT_TYPE_MAP[template.type];
  const reportLabel = rt?.label || template.type;
  const deviceNames = (template.deviceIds || [])
    .map((id) => devices.find((d) => d.id === id)?.name || `Device ${id}`)
    .join(', ');
  const periodFrom = fmtShort(dateFrom);
  const periodTo = fmtShort(dateTo);

  /* Determine columns for this type */
  const columns = RESULT_COLUMNS[template.type] || RESULT_COLUMNS.summary;

  /* Build data rows */
  const dataRows = data.map((row, i) => {
    const cells = columns.map((c) => {
      const val = row[c.key];
      const formatted = c.format ? c.format(val) : (val ?? '');
      return `<td>${String(formatted)}</td>`;
    }).join('');
    return `<tr><td>${i + 1}</td>${cells}</tr>`;
  }).join('\n');

  const headerCells = columns.map((c) => `<th>${c.label}</th>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>GSI TRACKING - ${reportLabel}</title>
<style>
@import url(https://fonts.googleapis.com/css?family=Open+Sans:400,600,300,700&subset=latin,latin-ext);
html, body {
  text-align: left;
  margin: 10px;
  padding: 0;
  font-size: 11px;
  font-family: 'Open Sans', Arial, sans-serif;
  color: #444444;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #2a81d4;
  margin-bottom: 4px;
}
h3 {
  font-size: 13px;
  font-weight: 600;
}
hr {
  border-color: #eeeeee;
  border-style: solid none none;
  border-width: 1px 0 0;
  height: 1px;
  margin: 8px 0;
}
table.info td {
  padding: 2px 8px 2px 0;
}
table.report {
  border: 1px solid #eeeeee;
  border-collapse: collapse;
  width: 100%;
}
table.report th {
  font-weight: 600;
  padding: 4px 8px;
  border: 1px solid #eeeeee;
  background-color: #eeeeee;
  font-size: 11px;
  text-align: left;
}
table.report td {
  padding: 3px 8px;
  border: 1px solid #eeeeee;
  font-size: 11px;
}
table.report tr:hover { background-color: #f8f8f8; }
.footer { margin-top: 16px; font-size: 10px; color: #999; }
</style>
</head>
<body>
<div class="logo-text">GSI TRACKING</div>
<hr/>
<h3>${reportLabel}</h3>
<table class="info">
  <tr><td><strong>Object:</strong></td><td>${deviceNames}</td></tr>
  <tr><td><strong>Period:</strong></td><td>${periodFrom} - ${periodTo}</td></tr>
</table>
<br/>
<table class="report">
  <thead><tr><th>#</th>${headerCells}</tr></thead>
  <tbody>${dataRows}</tbody>
</table>
${data.length === 0 ? '<p style="color:#999;margin-top:8px">Nothing has been found on your request.</p>' : ''}
<div class="footer">
  Generated: ${new Date().toLocaleString()} | Records: ${data.length}
</div>
</body>
</html>`;
};

/** Build filename base from template info */
const buildFilenameBase = (name, dateFrom, dateTo) => {
  const safeName = (name || 'report').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const from = (dateFrom || '').replace(/[^0-9]/g, '_');
  const to = (dateTo || '').replace(/[^0-9]/g, '_');
  return `${safeName}_${from}_${to}`;
};

/** Open report in a new browser tab — format-aware (html/pdf/xls) */
const openReportInNewTab = (html, format) => {
  if (format === 'pdf') {
    // Open HTML in new tab with auto-print for PDF
    const pdfHtml = html.replace('</body>', '<script>setTimeout(()=>window.print(),500)</script></body>');
    const blob = new Blob([pdfHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    // html and xls both open as HTML in new tab
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};

/** Download report as a file — format-aware (html/pdf/xls) */
const downloadReportFile = (html, name, dateFrom, dateTo, format) => {
  const base = buildFilenameBase(name, dateFrom, dateTo);
  let blob;
  let filename;
  if (format === 'xls') {
    // XLS = HTML table wrapped with Excel-compatible headers
    const xlsContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7"/></head>
<body>${html.replace(/.*<body>/s, '').replace(/<\/body>.*/s, '')}</body></html>`;
    blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    filename = `${base}.xls`;
  } else if (format === 'pdf') {
    // PDF = open HTML with print dialog as download
    const pdfHtml = html.replace('</body>', '<script>setTimeout(()=>window.print(),500)</script></body>');
    blob = new Blob([pdfHtml], { type: 'text/html;charset=utf-8' });
    filename = `${base}.html`;
  } else {
    blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    filename = `${base}.html`;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ─────────── date helpers ─────────── */
const pad = (n) => String(n).padStart(2, '0');
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const applyTimeFilter = (filterId) => {
  const now = new Date();
  let from;
  let to;
  switch (filterId) {
    case 'lastHour': from = new Date(now - 3600000); to = now; break;
    case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); from = new Date(y.getFullYear(), y.getMonth(), y.getDate()); to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59); break; }
    case 'before2days': { const d2 = new Date(now); d2.setDate(d2.getDate() - 2); from = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()); to = now; break; }
    case 'before3days': { const d3 = new Date(now); d3.setDate(d3.getDate() - 3); from = new Date(d3.getFullYear(), d3.getMonth(), d3.getDate()); to = now; break; }
    case 'thisWeek': { const day = now.getDay() || 7; from = new Date(now); from.setDate(now.getDate() - day + 1); from.setHours(0, 0, 0, 0); to = now; break; }
    case 'lastWeek': { const day2 = now.getDay() || 7; const end = new Date(now); end.setDate(now.getDate() - day2); end.setHours(23, 59, 59); const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0); from = start; to = end; break; }
    case 'thisMonth': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
    case 'lastMonth': from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
    default: from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now;
  }
  return { from: fmtLocal(from), to: fmtLocal(to) };
};

/* ─────────── styles (V1 parity + SettingsDialog tab pattern) ─────────── */
const useStyles = makeStyles()((theme) => ({
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
  tabs: {
    backgroundColor: '#f5f5f5',
    minHeight: '31px !important',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTab-root': {
      marginTop: '6px',
      minHeight: '25px',
      textTransform: 'none',
      fontSize: '12px',
      fontWeight: 'normal',
      padding: '6px 16px',
      color: '#444444',
      borderRadius: 0,
      '&.Mui-selected': {
        backgroundColor: '#ffffff',
        color: '#444444',
      },
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  },
  /* ── Properties dialog ── */
  propRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    '& .lbl': { width: '40%', fontSize: '12px', color: '#333' },
    '& .val': { width: '60%' },
  },
  propCol: {
    flex: 1,
    padding: '0 12px',
  },
  propSection: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2a81d4',
    borderBottom: '1px solid #ddd',
    marginBottom: '8px',
    paddingBottom: '2px',
  },
}));

/* ═══════════════════════════════════════════════════════════════
   ReportPropertiesDialog  – add / edit a report template (V1)
   Uses CustomSelect, CustomMultiSelect, CustomCheckbox, CustomInput, CustomButton
   ═══════════════════════════════════════════════════════════════ */
const emptyTemplate = () => ({
  id: Date.now(),
  name: '',
  type: 'general',
  format: 'html',
  deviceIds: [],
  zoneIds: [],
  sensorIds: [],
  dataItems: [],
  ignoreEmpty: false,
  showCoordinates: true,
  showAddresses: false,
  zonesAddresses: false,
  stopDuration: '1',
  speedLimit: '',
  daily: false,
  weekly: false,
  scheduleEmail: '',
  timeFilter: 'today',
  dateFrom: '',
  dateTo: '',
});

const ReportPropertiesDialog = ({
  open, onClose, onSave, onGenerate, template, devices, geofences,
}) => {
  const { classes } = useStyles();
  const [form, setForm] = useState(emptyTemplate());

  useEffect(() => {
    if (open) {
      if (template) {
        setForm({ ...emptyTemplate(), ...template });
      } else {
        const t = emptyTemplate();
        const { from, to } = applyTimeFilter('today');
        t.dateFrom = from;
        t.dateTo = to;
        setForm(t);
      }
    }
  }, [open, template]);

  /* helpers – CustomSelect passes value directly, CustomInput passes event */
  const setVal = (key) => (v) => setForm((prev) => ({ ...prev, [key]: v }));
  const setEvent = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFilterChange = (fid) => {
    setForm((prev) => {
      const { from, to } = fid ? applyTimeFilter(fid) : { from: prev.dateFrom, to: prev.dateTo };
      return { ...prev, timeFilter: fid, dateFrom: from, dateTo: to };
    });
  };

  const handleSave = () => { onSave(form); onClose(); };
  const handleGenerate = () => {
    if (!form.deviceIds || form.deviceIds.length === 0) {
      alert('Please select at least 1 object/device.');
      return;
    }
    onGenerate({ ...form, format: 'html' });
    onClose();
  };

  const deviceOptions = useMemo(() => devices.map((d) => ({ value: d.id, label: d.name })), [devices]);
  const zoneOptions = useMemo(() => geofences.map((g) => ({ value: g.id, label: g.name })), [geofences]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 680, maxHeight: '90vh' } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">Report Properties</Typography>
        <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, mt: 1 }}>
        {/* ── "Report" section header ── */}
        <Box sx={{ px: 1.5 }}>
          <div className={classes.propSection}>Report</div>
        </Box>

        <Box display="flex">
          {/* ── Left column ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Name</span>
              <div className="val">
                <CustomInput value={form.name} onChange={setEvent('name')} placeholder="Report name" style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Type</span>
              <div className="val">
                <CustomSelect value={form.type} onChange={setVal('type')} options={TYPE_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Objects</span>
              <div className="val">
                <CustomMultiSelect
                  value={form.deviceIds}
                  onChange={setVal('deviceIds')}
                  options={deviceOptions}
                  placeholder="Nothing selected"
                />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Zones</span>
              <div className="val">
                <CustomMultiSelect
                  value={form.zoneIds}
                  onChange={setVal('zoneIds')}
                  options={zoneOptions}
                  placeholder="Nothing selected"
                />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Sensors</span>
              <div className="val">
                <CustomMultiSelect
                  value={form.sensorIds}
                  onChange={setVal('sensorIds')}
                  options={[]}
                  placeholder="No sensors available"
                />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Data items</span>
              <div className="val">
                <CustomMultiSelect
                  value={form.dataItems}
                  onChange={setVal('dataItems')}
                  options={[]}
                  placeholder="All items included"
                />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Ignore empty reports</span>
              <div className="val">
                <CustomCheckbox checked={form.ignoreEmpty} onChange={setVal('ignoreEmpty')} />
              </div>
            </div>
          </Box>

          {/* ── Right column ── */}
          <Box className={classes.propCol}>
            <div className={classes.propRow}>
              <span className="lbl">Format</span>
              <div className="val">
                <CustomSelect value={form.format} onChange={setVal('format')} options={FORMAT_SELECT_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show coordinates</span>
              <div className="val">
                <CustomCheckbox checked={form.showCoordinates} onChange={setVal('showCoordinates')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Show addresses</span>
              <div className="val">
                <CustomCheckbox checked={form.showAddresses} onChange={setVal('showAddresses')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Zones instead of addresses</span>
              <div className="val">
                <CustomCheckbox checked={form.zonesAddresses} onChange={setVal('zonesAddresses')} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Stops</span>
              <div className="val">
                <CustomSelect value={form.stopDuration} onChange={setVal('stopDuration')} options={STOP_DURATION_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>

            <div className={classes.propRow}>
              <span className="lbl">Speed limit (kph)</span>
              <div className="val">
                <CustomInput type="number" value={form.speedLimit} onChange={setEvent('speedLimit')} placeholder="0" style={{ width: '100%' }} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Schedule (left) + Time period (right) – V1 two-column layout ── */}
        <Box display="flex">
          <Box className={classes.propCol}>
            <div className={classes.propSection}>Schedule</div>
            <div className={classes.propRow}>
              <span className="lbl">Daily</span>
              <div className="val"><CustomCheckbox checked={form.daily} onChange={setVal('daily')} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Weekly</span>
              <div className="val"><CustomCheckbox checked={form.weekly} onChange={setVal('weekly')} /></div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Send to e-mail</span>
              <div className="val">
                <CustomInput value={form.scheduleEmail} onChange={setEvent('scheduleEmail')} placeholder="E-mail address" style={{ width: '100%' }} />
              </div>
            </div>
          </Box>

          <Box className={classes.propCol}>
            <div className={classes.propSection}>Time period</div>
            <div className={classes.propRow}>
              <span className="lbl">Filter</span>
              <div className="val">
                <CustomSelect value={form.timeFilter} onChange={handleFilterChange} options={TIME_FILTER_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time from</span>
              <div className="val">
                <CustomInput type="datetime-local" value={form.dateFrom} onChange={setEvent('dateFrom')} style={{ width: '100%' }} />
              </div>
            </div>
            <div className={classes.propRow}>
              <span className="lbl">Time to</span>
              <div className="val">
                <CustomInput type="datetime-local" value={form.dateTo} onChange={setEvent('dateTo')} style={{ width: '100%' }} />
              </div>
            </div>
          </Box>
        </Box>

        {/* ── Buttons (V1: Generate, Save, Cancel) ── */}
        <Box display="flex" justifyContent="center" gap={1} py={1.5} sx={{ borderTop: '1px solid #eee' }}>
          <CustomButton variant="contained" color="primary" icon={<BuildIcon style={{ width: 14, height: 14 }} />} onClick={handleGenerate} size="small">
            Generate
          </CustomButton>
          <CustomButton variant="contained" color="primary" icon={<SaveIcon style={{ width: 14, height: 14 }} />} onClick={handleSave} size="small">
            Save
          </CustomButton>
          <CustomButton variant="outlined" icon={<CloseIcon style={{ width: 14, height: 14 }} />} onClick={onClose} size="small">
            Cancel
          </CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Generated Report Viewer Dialog
   ═══════════════════════════════════════════════════════════════ */
const formatDateTime = (dt) => { if (!dt) return ''; return new Date(dt).toLocaleString(); };
const formatDuration = (ms) => { if (!ms) return ''; const s = Math.floor(ms / 1000); return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`; };
const formatDistance = (m) => (m ? `${(m / 1000).toFixed(2)} km` : '0');

/* Column definitions for generated report viewer – mapped by API endpoint type */
const ROUTE_COLUMNS = [
  { key: 'fixTime', label: 'Time', format: formatDateTime },
  { key: 'latitude', label: 'Lat', format: (v) => v?.toFixed(5) },
  { key: 'longitude', label: 'Lng', format: (v) => v?.toFixed(5) },
  { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  { key: 'address', label: 'Address' },
];
const EVENT_COLUMNS = [
  { key: 'eventTime', label: 'Time', format: formatDateTime },
  { key: 'type', label: 'Type' },
  { key: 'deviceId', label: 'Device ID' },
];
const TRIP_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'startTime', label: 'Start', format: formatDateTime },
  { key: 'endTime', label: 'End', format: formatDateTime },
  { key: 'distance', label: 'Distance', format: formatDistance },
  { key: 'duration', label: 'Duration', format: formatDuration },
  { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
];
const STOP_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'startTime', label: 'Start', format: formatDateTime },
  { key: 'endTime', label: 'End', format: formatDateTime },
  { key: 'duration', label: 'Duration', format: formatDuration },
  { key: 'address', label: 'Address' },
];
const SUMMARY_COLUMNS = [
  { key: 'deviceName', label: 'Device' },
  { key: 'distance', label: 'Distance', format: formatDistance },
  { key: 'averageSpeed', label: 'Avg Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'maxSpeed', label: 'Max Speed', format: (v) => (v ? `${(v * 1.852).toFixed(1)} km/h` : '') },
  { key: 'engineHours', label: 'Engine Hours', format: formatDuration },
  { key: 'spentFuel', label: 'Fuel Used', format: (v) => (v ? `${v.toFixed(2)} L` : '') },
];

// RAG (Red/Amber/Green) Driver Behavior columns
const RAG_COLUMNS = [
  { key: 'deviceName', label: 'Object' },
  { key: 'distance', label: 'Route Length', format: formatDistance },
  { key: '_overspeedDuration', label: 'Overspeed Duration', format: formatDuration },
  { key: '_overspeedScore', label: 'Overspeed Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_haccelCount', label: 'Harsh Accel Count' },
  { key: '_haccelScore', label: 'Harsh Accel Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_hbrakeCount', label: 'Harsh Brake Count' },
  { key: '_hbrakeScore', label: 'Harsh Brake Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  { key: '_hcornCount', label: 'Harsh Corner Count' },
  { key: '_hcornScore', label: 'Harsh Corner Score', format: (v) => (v != null ? v.toFixed(2) : '0.00') },
  {
 key: '_ragScore', label: 'RAG', format: (v) => {
    if (v == null) return '';
    const score = parseFloat(v);
    if (score <= 2.5) return `<span style="background:#00FF00;padding:2px 8px;font-weight:bold">GREEN (${score.toFixed(2)})</span>`;
    if (score <= 5) return `<span style="background:#FFFF00;padding:2px 8px;font-weight:bold">AMBER (${score.toFixed(2)})</span>`;
    return `<span style="background:#FF0000;color:white;padding:2px 8px;font-weight:bold">RED (${score.toFixed(2)})</span>`;
  }, html: true 
},
];

const RESULT_COLUMNS = {
  general: SUMMARY_COLUMNS, general_merged: SUMMARY_COLUMNS, object_info: SUMMARY_COLUMNS,
  current_position: SUMMARY_COLUMNS, current_position_off: SUMMARY_COLUMNS,
  mileage_daily: SUMMARY_COLUMNS, service: SUMMARY_COLUMNS,
  fuelfillings: SUMMARY_COLUMNS, fuelthefts: SUMMARY_COLUMNS,
  rag: RAG_COLUMNS, rag_driver: RAG_COLUMNS, tasks: SUMMARY_COLUMNS, expenses: SUMMARY_COLUMNS,
  route: ROUTE_COLUMNS, route_data_sensors: ROUTE_COLUMNS,
  overspeed: ROUTE_COLUMNS, overspeed_count: ROUTE_COLUMNS,
  underspeed: ROUTE_COLUMNS, underspeed_count: ROUTE_COLUMNS, logic_sensors: ROUTE_COLUMNS,
  trips: TRIP_COLUMNS, drives_stops_sensors: TRIP_COLUMNS, drives_stops_logic: TRIP_COLUMNS,
  travel_sheet: TRIP_COLUMNS, travel_sheet_dn: TRIP_COLUMNS,
  stops: STOP_COLUMNS,
  events: EVENT_COLUMNS, zone_in_out: EVENT_COLUMNS, zone_in_out_general: EVENT_COLUMNS,
  rilogbook: EVENT_COLUMNS, dtc: EVENT_COLUMNS,
  speed_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  altitude_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'altitude', label: 'Altitude (m)', format: (v) => (v ? v.toFixed(1) : '0') },
  ],
  acc_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed (km/h)', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  fuellevel_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  temperature_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  sensor_graph: [
    { key: 'fixTime', label: 'Time', format: formatDateTime },
    { key: 'speed', label: 'Speed', format: (v) => (v ? (v * 1.852).toFixed(1) : '0') },
  ],
  routes_map: ROUTE_COLUMNS, routes_stops_map: ROUTE_COLUMNS, image_gallery: ROUTE_COLUMNS,
  summary: SUMMARY_COLUMNS,
};

/* ═══════════════════════════════════════════════════════════════
   Main ReportsDialog  – 2 tabs with CustomTable (V1 parity)
   ═══════════════════════════════════════════════════════════════ */
const ReportsDialog = ({ open, onClose }) => {
  const { classes } = useStyles();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = useMemo(() => Object.values(devices), [devices]);
  const geofenceItems = useSelector((state) => state.geofences.items);
  const geofenceList = useMemo(() => Object.values(geofenceItems), [geofenceItems]);

  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Search state per tab */
  const [templateSearch, setTemplateSearch] = useState('');
  const [generatedSearch, setGeneratedSearch] = useState('');

  /* Checkbox selection per tab */
  const [templateSelected, setTemplateSelected] = useState([]);
  const [generatedSelected, setGeneratedSelected] = useState([]);

  /* Properties dialog */
  const [propsOpen, setPropsOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  /* Gear dropdown menu (Reports tab quick-generate) */
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuTemplateRef = useRef(null);

  /* Load data on open */
  useEffect(() => {
    if (open) {
      fetchReportTemplates().then(setTemplates);
      fetchGeneratedReports().then(setGenerated);
    }
  }, [open]);

  /* ── Filtered rows ── */
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return templates;
    const q = templateSearch.toLowerCase();
    return templates.filter((t) => (t.name || '').toLowerCase().includes(q)
      || (REPORT_TYPE_MAP[t.type]?.label || '').toLowerCase().includes(q));
  }, [templates, templateSearch]);

  const filteredGenerated = useMemo(() => {
    if (!generatedSearch) return generated;
    const q = generatedSearch.toLowerCase();
    return generated.filter((g) => (g.name || '').toLowerCase().includes(q)
      || (REPORT_TYPE_MAP[g.type]?.label || '').toLowerCase().includes(q));
  }, [generated, generatedSearch]);

  /* ── CustomTable column definitions ── */
  const templateColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => REPORT_TYPE_MAP[row.type]?.label || row.type },
    { key: 'format', label: 'Format', render: (row) => (row.format || '').toUpperCase() },
    { key: 'deviceIds', label: 'Objects', align: 'center', render: (row) => row.deviceIds?.length || 0 },
    { key: 'zoneIds', label: 'Zones', align: 'center', render: (row) => row.zoneIds?.length || 0 },
    { key: 'sensorIds', label: 'Sensors', align: 'center', render: (row) => row.sensorIds?.length || 0 },
    { key: 'daily', label: 'Daily', align: 'center', render: (row) => <BoolIcon value={row.daily} /> },
    { key: 'weekly', label: 'Weekly', align: 'center', render: (row) => <BoolIcon value={row.weekly} /> },
  ], []);

  const generatedColumns = useMemo(() => [
    { key: 'dateTime', label: 'DateTime', render: (row) => fmtShort(row.dateTime) },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => REPORT_TYPE_MAP[row.type]?.label || row.type },
    { key: 'format', label: 'Format', render: (row) => (row.format || '').toUpperCase() },
    { key: 'deviceIds', label: 'Objects', align: 'center', render: (row) => row.deviceIds?.length || 0 },
    { key: 'zoneIds', label: 'Zones', align: 'center', render: (row) => row.zoneIds?.length || 0 },
    { key: 'schedule', label: 'Schedule', align: 'center', render: (row) => <BoolIcon value={row.schedule} /> },
    { key: 'recordCount', label: 'Records', render: (row) => row.recordCount ?? (row.data?.length || 0) },
  ], []);

  /* ── Template CRUD ── */
  const handleSaveTemplate = useCallback(async (tpl) => {
    const saved = await saveReportTemplate(tpl);
    if (saved) {
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t._serverId === saved._serverId);
        return idx >= 0 ? prev.map((t, i) => (i === idx ? saved : t)) : [...prev, saved];
      });
    }
  }, []);

  const handleDeleteTemplate = useCallback(async (row) => {
    if (row?._serverId) {
      await deleteUserTemplate(row._serverId);
    }
    setTemplates((prev) => prev.filter((t) => t.id !== row.id));
    setTemplateSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchReportTemplates().then(setTemplates);
    fetchGeneratedReports().then(setGenerated);
  }, []);

  /* ── Generate report from template ── */
  const handleGenerate = useCallback(async (tpl) => {
    if (!tpl.deviceIds || tpl.deviceIds.length === 0) return;
    if (!tpl.dateFrom || !tpl.dateTo) return;
    setLoading(true);
    try {
      const allData = await refetchReportData(tpl);

      /* Generate report + auto-open in new tab (format-aware) */
      const fmt = tpl.format || 'html';
      const html = buildHtmlReport(allData, tpl, deviceList, tpl.dateFrom, tpl.dateTo);
      openReportInNewTab(html, fmt);

      // Save metadata to server (no raw data blob)
      const genMeta = {
        name: tpl.name || 'Untitled',
        type: tpl.type,
        format: tpl.format,
        deviceIds: tpl.deviceIds,
        zoneIds: tpl.zoneIds,
        schedule: tpl.daily || tpl.weekly,
        dateFrom: tpl.dateFrom,
        dateTo: tpl.dateTo,
        dateTime: new Date().toISOString(),
        recordCount: allData.length,
      };
      const saved = await saveGeneratedReport(genMeta);
      if (saved) {
        setGenerated((prev) => [saved, ...prev]);
      }
      setTab(1);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  /* ── Quick Generate from gear dropdown (time filter) ── */
  const handleQuickGenerate = useCallback(async (filterId) => {
    const tpl = menuTemplateRef.current;
    setMenuAnchor(null);
    if (!tpl || !tpl.deviceIds || tpl.deviceIds.length === 0) return;
    const { from, to } = applyTimeFilter(filterId);
    const tplWithDates = { ...tpl, dateFrom: from, dateTo: to };
    await handleGenerate(tplWithDates);
  }, [handleGenerate]);

  const handleDeleteGenerated = useCallback(async (row) => {
    if (row?._serverId) {
      await deleteUserTemplate(row._serverId);
    }
    setGenerated((prev) => prev.filter((g) => g.id !== row.id));
    setGeneratedSelected((prev) => prev.filter((id) => id !== row.id));
  }, []);

  /* ── Bulk delete ── */
  const handleBulkDeleteTemplates = useCallback(async (ids) => {
    for (const id of ids) {
      const tpl = templates.find((t) => t.id === id);
      if (tpl?._serverId) {
        await deleteUserTemplate(tpl._serverId);
      }
    }
    setTemplates((prev) => prev.filter((t) => !ids.includes(t.id)));
    setTemplateSelected([]);
  }, [templates]);

  const handleBulkDeleteGenerated = useCallback(async (ids) => {
    for (const id of ids) {
      const gen = generated.find((g) => g.id === id);
      if (gen?._serverId) {
        await deleteUserTemplate(gen._serverId);
      }
    }
    setGenerated((prev) => prev.filter((g) => !ids.includes(g.id)));
    setGeneratedSelected([]);
  }, [generated]);

  const handleOpenGenerated = useCallback(async (report) => {
    // Re-fetch data from Traccar API and open in new tab (format-aware)
    setLoading(true);
    try {
      const fmt = report.format || 'html';
      const data = await refetchReportData(report);
      const html = buildHtmlReport(data, report, deviceList, report.dateFrom, report.dateTo);
      openReportInNewTab(html, fmt);
    } catch (err) {
      console.error('Failed to open report:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  const handleDownloadGenerated = useCallback(async (report) => {
    setLoading(true);
    try {
      const fmt = report.format || 'html';
      const data = await refetchReportData(report);
      const html = buildHtmlReport(data, report, deviceList, report.dateFrom, report.dateTo);
      downloadReportFile(html, report.name, report.dateFrom, report.dateTo, fmt);
    } catch (err) {
      console.error('Failed to download report:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceList]);

  /* ── Toggle helpers ── */
  const onToggleTemplateAll = useCallback(() => {
    setTemplateSelected((prev) => (prev.length === filteredTemplates.length ? [] : filteredTemplates.map((t) => t.id)));
  }, [filteredTemplates]);

  const onToggleTemplate = useCallback((id) => {
    setTemplateSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const onToggleGeneratedAll = useCallback(() => {
    setGeneratedSelected((prev) => (prev.length === filteredGenerated.length ? [] : filteredGenerated.map((g) => g.id)));
  }, [filteredGenerated]);

  const onToggleGenerated = useCallback((id) => {
    setGeneratedSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* ── Open add/edit dialog ── */
  const openAdd = useCallback(() => { setEditTemplate(null); setPropsOpen(true); }, []);
  const openEdit = useCallback((row) => { setEditTemplate(row); setPropsOpen(true); }, []);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 900, height: 600 } }}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant="subtitle2" component="span">Reports</Typography>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} className={classes.tabs}>
          <Tab label="Reports" />
          <Tab label="Generated" />
        </Tabs>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={1} sx={{ borderBottom: '1px solid #e0e0e0' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" sx={{ ml: 1, fontSize: '11px' }}>Generating report…</Typography>
            </Box>
          )}

          {/* ════════ Tab 0: Reports (Templates) – CustomTable ════════ */}
          {tab === 0 && (
            <CustomTable
              rows={filteredTemplates}
              columns={templateColumns}
              loading={false}
              selected={templateSelected}
              onToggleAll={onToggleTemplateAll}
              onToggleRow={onToggleTemplate}
              onEdit={openEdit}
              onDelete={handleDeleteTemplate}
              search={templateSearch}
              onSearchChange={setTemplateSearch}
              onAdd={openAdd}
              onRefresh={handleRefresh}
              onOpenSettings={() => {}}
              onBulkDelete={handleBulkDeleteTemplates}
              customActions={(row) => (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    menuTemplateRef.current = row;
                    setMenuAnchor(e.currentTarget);
                  }}
                  title="Generate"
                  disabled={loading}
                  sx={{ padding: '2px' }}
                >
                  <SettingsIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                </IconButton>
              )}
            />
          )}

          {/* ════════ Tab 1: Generated – CustomTable (V1: file icon + delete only) ════════ */}
          {tab === 1 && (
            <CustomTable
              rows={filteredGenerated}
              columns={generatedColumns}
              loading={false}
              selected={generatedSelected}
              onToggleAll={onToggleGeneratedAll}
              onToggleRow={onToggleGenerated}
              onDelete={handleDeleteGenerated}
              search={generatedSearch}
              onSearchChange={setGeneratedSearch}
              onAdd={openAdd}
              onRefresh={handleRefresh}
              onOpenSettings={() => {}}
              onBulkDelete={handleBulkDeleteGenerated}
              hideEdit
              customActions={(row) => (
                <>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenGenerated(row)}
                    title="Open Report"
                    disabled={loading}
                    sx={{ padding: '2px' }}
                  >
                    <DescriptionIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadGenerated(row)}
                    title="Download Report"
                    disabled={loading}
                    sx={{ padding: '2px' }}
                  >
                    <DownloadIcon sx={{ fontSize: 14, color: '#4a90e2' }} />
                  </IconButton>
                </>
              )}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Gear dropdown menu: time filter quick-generate (V1 parity) ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              minWidth: 170,
              borderRadius: 0,
              backgroundColor: '#ffffff',
              boxShadow: '3px 0 5px 0 #9b9b9b',
              '& .MuiList-root': { padding: 0 },
            },
          },
        }}
      >
        {TIME_FILTERS.filter((f) => f.id).map((f, i) => (
          <MenuItem
            key={f.id}
            onClick={() => handleQuickGenerate(f.id)}
            disabled={loading}
            sx={{
              borderTop: i === 0 ? '3px solid #2b82d4' : '1px solid #f5f5f5',
              py: '5px',
              px: '15px',
              minHeight: 'auto',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            <Typography sx={{ fontSize: '13px', color: '#444' }}>
              {f.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* ── Report Properties (Add/Edit) ── */}
      <ReportPropertiesDialog
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        onSave={handleSaveTemplate}
        onGenerate={handleGenerate}
        template={editTemplate}
        devices={deviceList}
        geofences={geofenceList}
      />
    </>
  );
};

export default ReportsDialog;
