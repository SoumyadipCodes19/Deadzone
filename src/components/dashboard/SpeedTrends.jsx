import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const SpeedTrends = ({ tests, timeRange }) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    return tests
      .filter(test => {
        const testTime = new Date(test.timestamp);
        return now - testTime <= ranges[timeRange];
      })
      .map(test => ({
        timestamp: new Date(test.timestamp),
        speed: test.speed
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [tests, timeRange]);

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '24h':
        return format(date, 'HH:mm');
      case '7d':
        return format(date, 'EEE');
      case '30d':
        return format(date, 'MMM dd');
      default:
        return format(date, 'MMM dd');
    }
  };

  return (
    <div className="speed-trends-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: 'Speed (Mbps)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            labelFormatter={(value) => format(new Date(value), 'PPpp')}
            formatter={(value) => [`${value.toFixed(2)} Mbps`, 'Speed']}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="var(--primary-color)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeedTrends; 