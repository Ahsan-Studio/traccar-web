import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { REPORT_TYPE_MAP } from './reportConstants';
import { RESULT_COLUMNS } from './reportColumns';
import { fmtShort, buildFilenameBase } from './reportUtils';
import { CHART_CONFIGS } from './ChartReport';

/* ─────────── Graphical Report Types ─────────── */
export const GRAPHICAL_REPORT_TYPES = ['speed_graph', 'altitude_graph', 'acc_graph', 'fuellevel_graph', 'temperature_graph', 'sensor_graph'];

export const isGraphicalReport = (reportType) => GRAPHICAL_REPORT_TYPES.includes(reportType);

/* ─────────── Day/Night classification helper ─────────── */
const isNightTime = (dateTime, nightStartHour, nightStartMinute, nightEndHour, nightEndMinute) => {
  const d = new Date(dateTime);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeValue = hours * 60 + minutes;
  const nightStart = nightStartHour * 60 + nightStartMinute;
  const nightEnd = nightEndHour * 60 + nightEndMinute;

  // Handle case where night period crosses midnight
  if (nightStart > nightEnd) {
    // Night starts in evening and ends in morning (e.g., 22:00 - 06:00)
    return timeValue >= nightStart || timeValue < nightEnd;
  }
  // Night is within same day (e.g., 01:00 - 05:00)
  return timeValue >= nightStart && timeValue < nightEnd;
};

const classifyTripAsDayNight = (trip, nightStartHour, nightStartMinute, nightEndHour, nightEndMinute) => {
  // Use start time to classify the trip
  const startTime = trip.startTime || trip.departureTime || trip.start;
  if (!startTime) return 'Day';

  const isNight = isNightTime(startTime, nightStartHour, nightStartMinute, nightEndHour, nightEndMinute);
  return isNight ? 'Night' : 'Day';
};

/* ─────────── RAG Score classification helper ─────────── */
const classifyRagScore = (score, lowScore, highScore) => {
  if (score === undefined || score === null) return 'N/A';
  const range = highScore - lowScore;
  if (range <= 0) return 'N/A';

  // Red: 0-33%, Amber: 33-66%, Green: 66-100%
  const normalizedScore = (score - lowScore) / range;
  if (normalizedScore < 0.33) return 'Red';
  if (normalizedScore < 0.66) return 'Amber';
  return 'Green';
};

/* ─────────── Build chart SVG for graphical reports ─────────── */
const buildChartSvg = (data, config, width = 800, height = 400) => {
  if (!data || data.length === 0) return '';

  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get min/max values
  const values = data.map((d) => d.value).filter((v) => v != null);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;
  const yMin = minVal - valRange * 0.1;
  const yMax = maxVal + valRange * 0.1;

  const minTime = Math.min(...data.map((d) => d.time));
  const maxTime = Math.max(...data.map((d) => d.time));
  const timeRange = maxTime - minTime || 1;

  // Scale functions
  const scaleX = (t) => padding.left + ((t - minTime) / timeRange) * chartWidth;
  const scaleY = (v) => padding.top + chartHeight - ((v - yMin) / (yMax - yMin)) * chartHeight;

  // Build polyline points
  const points = data
    .filter((d) => d.value != null)
    .map((d) => `${scaleX(d.time)},${scaleY(d.value)}`)
    .join(' ');

  // Build axis labels
  const yTicks = 5;
  const yLabels = [];
  for (let i = 0; i <= yTicks; i++) {
    const val = yMin + (i / yTicks) * (yMax - yMin);
    const y = scaleY(val);
    yLabels.push(`<text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" style="font-size:10px;fill:#666">${val.toFixed(1)}</text>`);
    yLabels.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`);
  }

  // X-axis time labels
  const xTicks = Math.min(6, data.length);
  const xLabels = [];
  for (let i = 0; i < xTicks; i++) {
    const idx = Math.floor((i / (xTicks - 1 || 1)) * (data.length - 1));
    const d = data[idx];
    if (d) {
      const x = scaleX(d.time);
      const timeStr = new Date(d.time).toLocaleTimeString();
      xLabels.push(`<text x="${x}" y="${height - 10}" text-anchor="middle" style="font-size:10px;fill:#666">${timeStr}</text>`);
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#fff"/>
      ${yLabels.join('\n')}
      ${xLabels.join('\n')}
      <polyline fill="none" stroke="${config.color}" stroke-width="2" points="${points}"/>
      <text x="${padding.left}" y="${padding.top - 5}" style="font-size:11px;font-weight:600;fill:#444">${config.label}</text>
    </svg>
  `;
};

/* ─────────── HTML report generator (V1 parity) ─────────── */
export const buildHtmlReport = (data, template, devices, dateFrom, dateTo) => {
  const rt = REPORT_TYPE_MAP[template.type];
  const reportLabel = rt?.label || template.type;
  const deviceNames = (template.deviceIds || [])
    .map((id) => devices.find((d) => d.id === id)?.name || `Device ${id}`)
    .join(', ');
  const periodFrom = fmtShort(dateFrom);
  const periodTo = fmtShort(dateTo);

  // Check if this is a graphical report
  if (isGraphicalReport(template.type)) {
    return buildGraphicalHtmlReport(data, template, devices, dateFrom, dateTo, reportLabel, deviceNames, periodFrom, periodTo);
  }

  /* Determine columns for this type */
  let columns = RESULT_COLUMNS[template.type] || RESULT_COLUMNS.summary;

  // Add day/night column for travel_sheet_dn
  const isDayNightReport = template.type === 'travel_sheet_dn';
  if (isDayNightReport) {
    columns = [
      { key: 'dayNight', label: 'Day/Night' },
      ...columns,
    ];
  }

  /* Build data rows */
  const dataRows = data.map((row, i) => {
    // Add day/night classification
    if (isDayNightReport) {
      row.dayNight = classifyTripAsDayNight(
        row,
        template.nightStartHour ?? 22,
        template.nightStartMinute ?? 0,
        template.nightEndHour ?? 6,
        template.nightEndMinute ?? 0,
      );
    }

    // Add RAG rating for RAG reports
    if (template.type === 'rag' || template.type === 'rag_driver') {
      const lowScore = template.ragLowScore ?? 0;
      const highScore = template.ragHighScore ?? 100;
      // Calculate total score if not provided
      const totalScore = row.totalScore || (
        (row.overspeedScore || 0)
        + (row.harshAccelerationScore || 0)
        + (row.harshBrakingScore || 0)
        + (row.harshCorneringScore || 0)
      ) / 4;
      row.totalScore = totalScore;
      row.ragRating = classifyRagScore(totalScore, lowScore, highScore);
    }

    const cells = columns.map((c) => {
      const val = row[c.key];
      const formatted = c.format ? c.format(val) : (val ?? '');

      // Add color styling for RAG rating
      if (c.key === 'ragRating') {
        let color = '#666';
        if (val === 'Red') color = '#f44336';
        else if (val === 'Amber') color = '#ff9800';
        else if (val === 'Green') color = '#4caf50';
        return `<td style="color: ${color}; font-weight: bold;">${String(formatted)}</td>`;
      }

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

/* ─────────── Graphical HTML report with embedded SVG chart ─────────── */
const buildGraphicalHtmlReport = (data, template, devices, dateFrom, dateTo, reportLabel, deviceNames, periodFrom, periodTo) => {
  const config = CHART_CONFIGS[template.type];
  if (!config) {
    return buildHtmlReport(data, template, devices, dateFrom, dateTo);
  }

  // Process data for chart
  const chartData = data.map((pos) => {
    let value = pos[config.dataKey];
    if (value === undefined && pos.attributes) {
      value = pos.attributes[config.dataKey];
    }
    return {
      time: new Date(pos.fixTime || pos.serverTime).getTime(),
      value: value || 0,
    };
  }).sort((a, b) => a.time - b.time);

  // Build chart SVG
  const chartSvg = buildChartSvg(chartData, config);

  // Build statistics table
  const values = chartData.map((d) => d.value).filter((v) => v != null);
  const stats = {
    min: values.length ? Math.min(...values).toFixed(2) : 'N/A',
    max: values.length ? Math.max(...values).toFixed(2) : 'N/A',
    avg: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 'N/A',
    count: values.length,
  };

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
.chart-container {
  margin: 20px 0;
  text-align: center;
}
.stats-table {
  margin-top: 20px;
  border: 1px solid #eeeeee;
  border-collapse: collapse;
}
.stats-table td, .stats-table th {
  padding: 6px 12px;
  border: 1px solid #eeeeee;
}
.stats-table th {
  background-color: #eeeeee;
  font-weight: 600;
}
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
<div class="chart-container">
  ${chartSvg}
</div>
<table class="stats-table">
  <tr><th>Min</th><th>Max</th><th>Average</th><th>Data Points</th></tr>
  <tr><td>${stats.min} ${config.yAxisLabel.match(/\((.+)\)/)?.[1] || ''}</td><td>${stats.max} ${config.yAxisLabel.match(/\((.+)\)/)?.[1] || ''}</td><td>${stats.avg} ${config.yAxisLabel.match(/\((.+)\)/)?.[1] || ''}</td><td>${stats.count}</td></tr>
</table>
${data.length === 0 ? '<p style="color:#999;margin-top:8px">Nothing has been found on your request.</p>' : ''}
<div class="footer">
  Generated: ${new Date().toLocaleString()} | Records: ${data.length}
</div>
</body>
</html>`;
};

/** Generate PDF from report data using jspdf-autotable */
export const generatePdfFromData = (data, template, devices, dateFrom, dateTo, reportLabel) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const deviceNames = (template.deviceIds || [])
    .map((id) => devices.find((d) => d.id === id)?.name || `Device ${id}`)
    .join(', ');

  // Header
  doc.setFontSize(16);
  doc.setTextColor(42, 129, 212);
  doc.text('GSI TRACKING', 14, 15);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(reportLabel, 14, 22);

  // Report info
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Objects: ${deviceNames || 'All'}`, 14, 30);
  doc.text(`Period: ${fmtShort(dateFrom)} - ${fmtShort(dateTo)}`, 14, 36);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);

  // Handle graphical reports differently
  if (isGraphicalReport(template.type)) {
    const config = CHART_CONFIGS[template.type];
    if (config) {
      // Process data for chart
      const chartData = data.map((pos) => {
        let value = pos[config.dataKey];
        if (value === undefined && pos.attributes) {
          value = pos.attributes[config.dataKey];
        }
        return {
          time: new Date(pos.fixTime || pos.serverTime).getTime(),
          value: value || 0,
        };
      }).sort((a, b) => a.time - b.time);

      // Calculate statistics
      const values = chartData.map((d) => d.value).filter((v) => v != null);
      const stats = {
        min: values.length ? Math.min(...values).toFixed(2) : 'N/A',
        max: values.length ? Math.max(...values).toFixed(2) : 'N/A',
        avg: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 'N/A',
        count: values.length,
      };

      // Draw chart placeholder and statistics
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Chart Data Summary:', 14, 55);

      // Statistics table
      autoTable(doc, {
        head: [['Min', 'Max', 'Average', 'Data Points']],
        body: [[stats.min, stats.max, stats.avg, String(stats.count)]],
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [42, 129, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      // Add note about chart
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Note: For visual chart representation, please use HTML format.', 14, doc.lastAutoTable.finalY + 10);
    }
    return doc;
  }

  let columns = RESULT_COLUMNS[template.type] || RESULT_COLUMNS.summary;

  // Add day/night column for travel_sheet_dn
  const isDayNightReport = template.type === 'travel_sheet_dn';
  if (isDayNightReport) {
    columns = [
      { key: 'dayNight', label: 'Day/Night' },
      ...columns,
    ];
  }

  // Table headers
  const headers = ['#', ...columns.map((c) => c.label)];

  // Table data
  const rows = data.map((row, i) => {
    // Add day/night classification
    if (isDayNightReport) {
      row.dayNight = classifyTripAsDayNight(
        row,
        template.nightStartHour ?? 22,
        template.nightStartMinute ?? 0,
        template.nightEndHour ?? 6,
        template.nightEndMinute ?? 0,
      );
    }

    // Add RAG rating for RAG reports
    if (template.type === 'rag' || template.type === 'rag_driver') {
      const lowScore = template.ragLowScore ?? 0;
      const highScore = template.ragHighScore ?? 100;
      // Calculate total score if not provided
      const totalScore = row.totalScore || (
        (row.overspeedScore || 0)
        + (row.harshAccelerationScore || 0)
        + (row.harshBrakingScore || 0)
        + (row.harshCorneringScore || 0)
      ) / 4;
      row.totalScore = totalScore;
      row.ragRating = classifyRagScore(totalScore, lowScore, highScore);
    }

    const cells = columns.map((c) => {
      const val = row[c.key];
      if (c.format) {
        const formatted = c.format(val);
        // Handle HTML formatting - strip tags and use plain text
        if (c.html) {
          return String(formatted).replace(/<[^>]*>/g, '');
        }
        return String(formatted);
      }
      return String(val ?? '');
    });
    return [String(i + 1), ...cells];
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 48,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [42, 129, 212], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  return doc;
};

/** Download report as a file — format-aware (html/pdf/xls) */
export const downloadReportFile = (html, name, dateFrom, dateTo, format, pdfDoc = null) => {
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
  } else if (format === 'pdf' && pdfDoc) {
    // PDF = generate using jspdf
    blob = pdfDoc.output('blob');
    filename = `${base}.pdf`;
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
