import { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend,
} from 'recharts';
import { useTheme } from '@mui/material';
import { formatTime } from '../../common/util/formatter';
import { useReportStyles } from './useReportStyles';
import { CHART_CONFIGS, processChartData } from './ChartReport';
import { REPORT_TYPE_MAP } from './reportConstants';
import { buildHtmlReport, generatePdfFromData, downloadReportFile } from './reportGenerator';

/* ─────────── Chart Report Dialog ─────────── */
const ChartReportDialog = ({
  open, onClose, data, template, devices, dateFrom, dateTo, loading,
}) => {
  const { classes } = useReportStyles();
  const theme = useTheme();
  const config = template ? CHART_CONFIGS[template.type] : null;
  const rt = template ? REPORT_TYPE_MAP[template.type] : null;

  const handleDownload = (format) => {
    if (!data || !template) return;
    const reportLabel = rt?.label || template.type;
    const html = buildHtmlReport(data, template, devices, dateFrom, dateTo);
    let pdfDoc = null;
    if (format === 'pdf') {
      pdfDoc = generatePdfFromData(data, template, devices, dateFrom, dateTo, reportLabel);
    }
    downloadReportFile(html, template.name, dateFrom, dateTo, format, pdfDoc);
  };

  const deviceNames = useMemo(() => {
    if (!template || !devices) return '';
    return (template.deviceIds || [])
      .map((id) => devices.find((d) => d.id === id)?.name || `Device ${id}`)
      .join(', ');
  }, [template, devices]);

  const chartData = useMemo(() => {
    if (!data || !template) return [];
    return processChartData(data, template.type, {});
  }, [data, template]);

  // Calculate min/max for Y-axis
  const values = chartData.map((d) => d.value).filter((v) => v != null);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const valueRange = maxValue - minValue;

  // Calculate statistics
  const stats = useMemo(() => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
    return {
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      count: values.length,
    };
  }, [values]);

  if (!config) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 1000, height: 700 } }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant="subtitle2" component="span">{rt?.label || 'Chart Report'}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleDownload('html')}
            title="Download HTML"
            sx={{ padding: '2px' }}
          >
            <DownloadIcon sx={{ fontSize: 16, color: '#4a90e2' }} />
          </IconButton>
          <IconButton size="small" className={classes.closeButton} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Report info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            <strong>Objects:</strong> {deviceNames}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            <strong>Period:</strong> {dateFrom ? new Date(dateFrom).toLocaleString() : ''} - {dateTo ? new Date(dateTo).toLocaleString() : ''}
          </Typography>
        </Box>

        {/* Statistics */}
        <Box sx={{ mb: 2, display: 'flex', gap: 3, borderBottom: '1px solid #eee', pb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>Min:</strong> {stats.min}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>Max:</strong> {stats.max}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>Avg:</strong> {stats.avg}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>Points:</strong> {stats.count}
          </Typography>
        </Box>

        {/* Chart */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>Loading chart data...</Typography>
          </Box>
        ) : chartData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <Typography variant="body2" color="textSecondary">No data available for the selected period.</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => formatTime(value, 'time')}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 11 }}
                  domain={[minValue - valueRange * 0.1, maxValue + valueRange * 0.1]}
                  label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                  }}
                  labelFormatter={(value) => formatTime(value, 'seconds')}
                  formatter={(value) => [value?.toFixed(2), config.label]}
                />
                <Legend />
                <Brush
                  dataKey="time"
                  height={30}
                  stroke={theme.palette.primary.main}
                  tickFormatter={() => ''}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={config.label}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChartReportDialog;
