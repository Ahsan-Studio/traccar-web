import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend,
} from 'recharts';
import { useTheme } from '@mui/material';
import { formatTime } from '../../common/util/formatter';
import {
  altitudeFromMeters, speedFromKnots, volumeFromLiters,
} from '../../common/util/converter';

/* ─────────── Chart Configuration per Report Type ─────────── */
export const CHART_CONFIGS = {
  speed_graph: {
    dataKey: 'speed',
    color: '#2196f3',
    label: 'Speed',
    yAxisLabel: 'Speed (km/h)',
    formatValue: (val, speedUnit) => speedFromKnots(val, speedUnit).toFixed(1),
  },
  altitude_graph: {
    dataKey: 'altitude',
    color: '#4caf50',
    label: 'Altitude',
    yAxisLabel: 'Altitude (m)',
    formatValue: (val, altitudeUnit) => altitudeFromMeters(val, altitudeUnit).toFixed(1),
  },
  acc_graph: {
    dataKey: 'ignition',
    color: '#ff9800',
    label: 'Ignition (ACC)',
    yAxisLabel: 'Status',
    formatValue: (val) => val ? 'ON' : 'OFF',
  },
  fuellevel_graph: {
    dataKey: 'fuel',
    color: '#9c27b0',
    label: 'Fuel Level',
    yAxisLabel: 'Fuel (L)',
    formatValue: (val, volumeUnit) => volumeFromLiters(val, volumeUnit).toFixed(1),
  },
  temperature_graph: {
    dataKey: 'temp',
    color: '#f44336',
    label: 'Temperature',
    yAxisLabel: 'Temperature (°C)',
    formatValue: (val) => val?.toFixed(1) || 'N/A',
  },
  sensor_graph: {
    dataKey: 'sensor',
    color: '#00bcd4',
    label: 'Sensor Value',
    yAxisLabel: 'Value',
    formatValue: (val) => val?.toFixed(2) || 'N/A',
  },
};

/* ─────────── Process Route Data for Charts ─────────── */
export const processChartData = (positions, reportType, preferences = {}) => {
  const { speedUnit = 'kmh', altitudeUnit = 'm', volumeUnit = 'ltr' } = preferences;
  const config = CHART_CONFIGS[reportType];
  if (!config) return [];

  return positions.map((pos) => {
    const data = {
      time: new Date(pos.fixTime || pos.serverTime).getTime(),
      deviceName: pos.deviceName,
    };

    // Get the value based on report type
    let value = pos[config.dataKey];
    if (value === undefined && pos.attributes) {
      value = pos.attributes[config.dataKey];
    }

    // Format value based on type
    if (config.dataKey === 'speed') {
      data.value = speedFromKnots(value || 0, speedUnit);
    } else if (config.dataKey === 'altitude') {
      data.value = altitudeFromMeters(value || 0, altitudeUnit);
    } else if (config.dataKey === 'fuel') {
      data.value = volumeFromLiters(value || 0, volumeUnit);
    } else if (config.dataKey === 'ignition') {
      data.value = pos.attributes?.ignition ? 1 : 0;
    } else {
      data.value = value || 0;
    }

    // Also add raw values for multi-series
    data.speed = speedFromKnots(pos.speed || 0, speedUnit);
    data.altitude = altitudeFromMeters(pos.altitude || 0, altitudeUnit);
    data.fuel = volumeFromLiters(pos.attributes?.fuel || 0, volumeUnit);
    data.ignition = pos.attributes?.ignition ? 1 : 0;

    return data;
  }).sort((a, b) => a.time - b.time);
};

/* ─────────── Chart Report Component ─────────── */
const ChartReport = ({ data, reportType, height = 400, showBrush = true }) => {
  const theme = useTheme();
  const config = CHART_CONFIGS[reportType];

  const chartData = useMemo(() => data || [], [data]);

  if (!config || chartData.length === 0) {
    return null;
  }

  // Calculate min/max for Y-axis
  const values = chartData.map((d) => d.value).filter((v) => v != null);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const valueRange = maxValue - minValue;

  return (
    <ResponsiveContainer width="100%" height={height}>
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
        {showBrush && (
          <Brush
            dataKey="time"
            height={30}
            stroke={theme.palette.primary.main}
            tickFormatter={() => ''}
          />
        )}
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
  );
};

export default ChartReport;
