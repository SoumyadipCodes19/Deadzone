import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTestResults } from '../contexts/TestResultsContext';
import Button from './common/Button';
import '../styles/Reports.css';

const Reports = () => {
  const { tests } = useTestResults();
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('detailed');

  const getFilteredTests = () => {
    if (selectedTimeframe === 'all') return tests;

    const now = new Date();
    const cutoff = new Date();

    switch (selectedTimeframe) {
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        return tests;
    }

    return tests.filter(test => new Date(test.timestamp) >= cutoff);
  };

  const calculateStats = (filteredTests) => {
    if (!filteredTests.length) {
      return {
        avgSpeed: 0,
        maxSpeed: 0,
        minSpeed: 0,
        totalTests: 0,
        reliability: 0
      };
    }

    const speeds = filteredTests.map(test => test.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    const reliability = (speeds.filter(speed => speed > 10).length / speeds.length) * 100;

    return {
      avgSpeed,
      maxSpeed,
      minSpeed,
      totalTests: filteredTests.length,
      reliability
    };
  };

  const filteredTests = getFilteredTests();
  const stats = calculateStats(filteredTests);

  const handleExport = () => {
    const exportData = selectedFormat === 'detailed' 
      ? filteredTests.map(test => ({
          timestamp: format(new Date(test.timestamp), 'PPpp'),
          speed: test.speed.toFixed(2),
          location: test.location || 'N/A'
        }))
      : {
          timeframe: selectedTimeframe,
          averageSpeed: stats.avgSpeed.toFixed(2),
          maxSpeed: stats.maxSpeed.toFixed(2),
          minSpeed: stats.minSpeed.toFixed(2),
          totalTests: stats.totalTests,
          reliability: stats.reliability.toFixed(2)
        };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-report-${selectedTimeframe}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Network Reports</h2>
        <div className="report-controls">
          <div className="control-group">
            <label>Timeframe</label>
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="select-input"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="control-group">
            <label>Export Format</label>
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="select-input"
            >
              <option value="detailed">Detailed</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          <Button 
            onClick={handleExport}
            disabled={!filteredTests.length}
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Average Speed</h3>
          <div className="stat-value">{stats.avgSpeed.toFixed(2)}</div>
          <div className="stat-unit">Mbps</div>
        </div>

        <div className="stat-card">
          <h3>Maximum Speed</h3>
          <div className="stat-value">{stats.maxSpeed.toFixed(2)}</div>
          <div className="stat-unit">Mbps</div>
        </div>

        <div className="stat-card">
          <h3>Minimum Speed</h3>
          <div className="stat-value">{stats.minSpeed.toFixed(2)}</div>
          <div className="stat-unit">Mbps</div>
        </div>

        <div className="stat-card">
          <h3>Total Tests</h3>
          <div className="stat-value">{stats.totalTests}</div>
          <div className="stat-unit">tests</div>
        </div>

        <div className="stat-card">
          <h3>Network Reliability</h3>
          <div className="stat-value">{stats.reliability.toFixed(1)}%</div>
          <div className="stat-unit">above 10 Mbps</div>
        </div>
      </div>

      <div className="tests-table-container">
        <h3>Test Details</h3>
        <div className="tests-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Speed</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test, index) => (
                <tr key={index}>
                  <td>{format(new Date(test.timestamp), 'PPpp')}</td>
                  <td>{test.speed.toFixed(2)} Mbps</td>
                  <td>{test.location || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 