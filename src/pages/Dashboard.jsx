import React, { useContext, useState } from 'react';
import TestContext from '../context/TestContext';
import { useSettings } from '../context/SettingsContext';
import SpeedTrends from '../components/dashboard/SpeedTrends';
import PeakHours from '../components/dashboard/PeakHours';
import NetworkReliability from '../components/dashboard/NetworkReliability';
import TestSchedule from '../components/dashboard/TestSchedule';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { tests, clearTests } = useContext(TestContext);
  const { speedThresholds } = useSettings();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTests, setSelectedTests] = useState(new Set());

  // Calculate stats
  const totalTests = tests.length;
  const averageSpeed = totalTests > 0
    ? (tests.reduce((sum, test) => sum + test.speed, 0) / totalTests).toFixed(2)
    : 0;
  const lastTest = tests[tests.length - 1];
  const autoTests = tests.filter(test => test.isAuto).length;

  // Calculate zone statistics
  const zoneStats = tests.reduce((acc, test) => {
    if (test.speed > speedThresholds.excellent) acc.excellent++;
    else if (test.speed > speedThresholds.good) acc.good++;
    else if (test.speed > speedThresholds.poor) acc.poor++;
    else acc.deadzone++;
    return acc;
  }, { excellent: 0, good: 0, poor: 0, deadzone: 0 });

  const getZonePercentage = (count) => {
    return totalTests > 0 ? ((count / totalTests) * 100).toFixed(1) : 0;
  };

  const getZoneClass = (speed) => {
    if (speed > speedThresholds.excellent) return 'zone-excellent';
    if (speed > speedThresholds.good) return 'zone-good';
    if (speed > speedThresholds.poor) return 'zone-poor';
    return 'zone-dead';
  };

  const getZoneLabel = (speed) => {
    if (speed > speedThresholds.excellent) return 'Excellent';
    if (speed > speedThresholds.good) return 'Good';
    if (speed > speedThresholds.poor) return 'Poor';
    return 'Dead Zone';
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleTestSelection = (testId) => {
    setSelectedTests(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(testId)) {
        newSelection.delete(testId);
      } else {
        newSelection.add(testId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    const updatedTests = tests.filter(test => !selectedTests.has(test.id));
    // Update tests in context and localStorage
    clearTests();
    localStorage.setItem('deadzone_tests', JSON.stringify(updatedTests));
    setSelectedTests(new Set());
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-controls">
          <div className="time-range-controls">
            <button 
              className={`btn ${timeRange === '24h' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('24h')}
            >
              24 Hours
            </button>
            <button 
              className={`btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('7d')}
            >
              7 Days
            </button>
            <button 
              className={`btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => handleTimeRangeChange('30d')}
            >
              30 Days
            </button>
          </div>
          {selectedTests.size > 0 && (
            <button 
              className="btn btn-danger"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedTests.size})
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📊 Stats</h2>
          </div>
          <div className="card-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{totalTests}</div>
                <div className="stat-label">Total Tests</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{averageSpeed}</div>
                <div className="stat-label">Avg Speed (Mbps)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{autoTests}</div>
                <div className="stat-label">Auto Tests</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>🎯 Zone Statistics</h2>
          </div>
          <div className="card-content">
            <div className="zones-grid">
              <div className="zone-card excellent">
                <div className="zone-icon">🟢</div>
                <div className="zone-stats">
                  <div className="zone-value">{zoneStats.excellent}</div>
                  <div className="zone-percentage">{getZonePercentage(zoneStats.excellent)}%</div>
                  <div className="zone-label">Excellent</div>
                </div>
              </div>
              <div className="zone-card good">
                <div className="zone-icon">🟡</div>
                <div className="zone-stats">
                  <div className="zone-value">{zoneStats.good}</div>
                  <div className="zone-percentage">{getZonePercentage(zoneStats.good)}%</div>
                  <div className="zone-label">Good</div>
                </div>
              </div>
              <div className="zone-card poor">
                <div className="zone-icon">🟠</div>
                <div className="zone-stats">
                  <div className="zone-value">{zoneStats.poor}</div>
                  <div className="zone-percentage">{getZonePercentage(zoneStats.poor)}%</div>
                  <div className="zone-label">Poor</div>
                </div>
              </div>
              <div className="zone-card dead">
                <div className="zone-icon">⚫</div>
                <div className="zone-stats">
                  <div className="zone-value">{zoneStats.deadzone}</div>
                  <div className="zone-percentage">{getZonePercentage(zoneStats.deadzone)}%</div>
                  <div className="zone-label">Dead Zone</div>
                </div>
              </div>
            </div>
            <div className="zone-bar">
              <div className="zone-segment excellent" style={{ width: `${getZonePercentage(zoneStats.excellent)}%` }}></div>
              <div className="zone-segment good" style={{ width: `${getZonePercentage(zoneStats.good)}%` }}></div>
              <div className="zone-segment poor" style={{ width: `${getZonePercentage(zoneStats.poor)}%` }}></div>
              <div className="zone-segment dead" style={{ width: `${getZonePercentage(zoneStats.deadzone)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>📈 Speed Trends</h2>
          </div>
          <div className="card-content">
            <SpeedTrends tests={tests} timeRange={timeRange} />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>⏰ Peak Hours</h2>
          </div>
          <div className="card-content">
            <PeakHours tests={tests} />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>🎯 Network Reliability</h2>
          </div>
          <div className="card-content">
            <NetworkReliability tests={tests} speedThresholds={speedThresholds} />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>📅 Test Schedule</h2>
          </div>
          <div className="card-content">
            <TestSchedule scheduledTests={[]} /> {/* TODO: Get scheduled tests from context */}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>📜 History</h2>
          </div>
          <div className="card-content">
            <div className="history-list">
              {tests.slice().reverse().slice(0, 5).map((test) => (
                <div key={test.id} className="history-item">
                  <input
                    type="checkbox"
                    className="history-select"
                    checked={selectedTests.has(test.id)}
                    onChange={() => handleTestSelection(test.id)}
                  />
                  <div className={`history-speed ${getZoneClass(test.speed)}`}>
                    <span className="speed-value">{test.speed.toFixed(2)} Mbps</span>
                    <span className="zone-badge">{getZoneLabel(test.speed)}</span>
                  </div>
                  <div className="history-details">
                    <div className="history-time">
                      {new Date(test.timestamp).toLocaleString()}
                    </div>
                    <div className="history-location">
                      📍 {test.location.lat.toFixed(6)}, {test.location.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 