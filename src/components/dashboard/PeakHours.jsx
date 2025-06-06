import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const PeakHours = ({ tests }) => {
  const hourlyData = useMemo(() => {
    // Initialize hourMap with default values
    const hourMap = new Map();
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, {
        hour: i,
        speeds: [],
        count: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        minSpeed: Infinity,
        bestTime: null,
        worstTime: null
      });
    }

    // Group tests by hour and calculate statistics
    tests.forEach(test => {
      if (!test.timestamp || !test.speed || test.speed <= 0) return;
      
      const testDate = new Date(test.timestamp);
      const hour = testDate.getHours();
      const hourData = hourMap.get(hour);
      
      hourData.speeds.push(test.speed);
      hourData.count++;

      // Update max speed and its timestamp
      if (test.speed > hourData.maxSpeed) {
        hourData.maxSpeed = test.speed;
        hourData.bestTime = testDate;
      }

      // Update min speed and its timestamp
      if (test.speed < hourData.minSpeed) {
        hourData.minSpeed = test.speed;
        hourData.worstTime = testDate;
      }
    });

    // Calculate averages and prepare final data
    const processedData = Array.from(hourMap.values()).map(data => {
      const avgSpeed = data.count > 0 
        ? data.speeds.reduce((sum, speed) => sum + speed, 0) / data.count 
        : 0;
      
      return {
        hour: data.hour,
        avgSpeed: avgSpeed,
        count: data.count,
        maxSpeed: data.maxSpeed,
        minSpeed: data.count > 0 ? data.minSpeed : 0,
        bestTime: data.bestTime,
        worstTime: data.worstTime,
        label: format(new Date().setHours(data.hour, 0, 0), 'HH:mm:ss')
      };
    });

    console.log('Processed hourly data:', processedData);
    return processedData;
  }, [tests]);

  const { bestPerformance, worstPerformance } = useMemo(() => {
    const validHours = hourlyData.filter(data => data.count > 0);
    
    if (validHours.length === 0) {
      return {
        bestPerformance: { hour: 0, speed: 0, label: '00:00:00', timestamp: null },
        worstPerformance: { hour: 0, speed: 0, label: '00:00:00', timestamp: null }
      };
    }

    // If we only have one hour with data, use max and min speeds from that hour
    if (validHours.length === 1) {
      const hour = validHours[0];
      return {
        bestPerformance: { 
          hour: hour.hour, 
          speed: hour.maxSpeed, 
          timestamp: hour.bestTime,
          label: hour.bestTime ? format(hour.bestTime, 'HH:mm:ss') : hour.label 
        },
        worstPerformance: { 
          hour: hour.hour, 
          speed: hour.minSpeed, 
          timestamp: hour.worstTime,
          label: hour.worstTime ? format(hour.worstTime, 'HH:mm:ss') : hour.label 
        }
      };
    }

    // If we have multiple hours, find hours with best and worst performance
    const bestHour = validHours.reduce((best, current) => 
      current.maxSpeed > best.maxSpeed ? current : best
    );

    const worstHour = validHours.reduce((worst, current) => 
      current.minSpeed < worst.minSpeed ? current : worst
    );

    return {
      bestPerformance: { 
        hour: bestHour.hour, 
        speed: bestHour.maxSpeed,
        timestamp: bestHour.bestTime,
        label: bestHour.bestTime ? format(bestHour.bestTime, 'HH:mm:ss') : bestHour.label
      },
      worstPerformance: { 
        hour: worstHour.hour, 
        speed: worstHour.minSpeed,
        timestamp: worstHour.worstTime,
        label: worstHour.worstTime ? format(worstHour.worstTime, 'HH:mm:ss') : worstHour.label
      }
    };
  }, [hourlyData]);

  // Only render if we have valid data
  if (!tests || tests.length === 0) {
    return <div className="peak-hours">No test data available</div>;
  }

  return (
    <div className="peak-hours">
      <div className="peak-summary">
        <div className="peak-item best">
          <h4>Best Performance</h4>
          <div className="peak-time">
            <span className="time-value">{bestPerformance.label}</span>
            <span className="performance-indicator best">↗</span>
          </div>
          <div className="peak-speed">
            <span className="speed-value">{bestPerformance.speed.toFixed(2)}</span>
            <span className="speed-unit">Mbps</span>
          </div>
        </div>
        <div className="peak-item worst">
          <h4>Worst Performance</h4>
          <div className="peak-time">
            <span className="time-value">{worstPerformance.label}</span>
            <span className="performance-indicator worst">↘</span>
          </div>
          <div className="peak-speed">
            <span className="speed-value">{worstPerformance.speed.toFixed(2)}</span>
            <span className="speed-unit">Mbps</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart 
          data={hourlyData}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="label"
            interval="preserveStartEnd"
            tick={{ fontSize: 11 }}
            height={40}
          />
          <YAxis 
            label={{ 
              value: 'Speed (Mbps)', 
              angle: -90, 
              position: 'insideLeft',
              offset: -5,
              style: { fontSize: 12 }
            }}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)} Mbps`, 'Average Speed']}
            labelFormatter={(label) => `Time: ${label}`}
            contentStyle={{ fontSize: '12px' }}
          />
          <Bar 
            dataKey="avgSpeed" 
            fill="var(--primary-color)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PeakHours; 