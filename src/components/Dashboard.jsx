import React, { useState, useContext, useMemo } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  MapPinIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon,
  ChartPieIcon,
  UserGroupIcon,
  SignalIcon,
  GlobeIcon
} from '@heroicons/react/24/outline';
import TestContext from '../context/TestContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { tests } = useContext(TestContext);
  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState('grid');
  const [showSections, setShowSections] = useState({
    stats: true,
    trends: true,
    history: true
  });

  // Filter tests based on time range
  const filteredTests = useMemo(() => {
    const now = new Date();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    return tests.filter(test => {
      const testTime = new Date(test.timestamp);
      return now - testTime <= ranges[timeRange];
    });
  }, [tests, timeRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTests = filteredTests.length;
    const avgSpeed = totalTests > 0
      ? filteredTests.reduce((sum, test) => sum + test.speed, 0) / totalTests
      : 0;
    const uniqueLocations = new Set(
      filteredTests.map(test => `${test.location.lat},${test.location.lng}`)
    ).size;
    const autoTests = filteredTests.filter(test => test.isAuto).length;

    return [
      { label: 'Total Tests', value: totalTests.toString(), icon: ChartPieIcon },
      { label: 'Auto Tests', value: autoTests.toString(), icon: UserGroupIcon },
      { label: 'Avg Speed', value: `${avgSpeed.toFixed(1)} Mbps`, icon: SignalIcon },
      { label: 'Locations', value: uniqueLocations.toString(), icon: GlobeIcon }
    ];
  }, [filteredTests]);

  // Calculate trends
  const trends = useMemo(() => {
    if (filteredTests.length === 0) return [];

    const latest = filteredTests[filteredTests.length - 1];
    const oldest = filteredTests[0];
    const speedChange = ((latest.speed - oldest.speed) / oldest.speed * 100);
    
    const maxSpeed = Math.max(...filteredTests.map(t => t.speed));
    const avgLatency = filteredTests.reduce((sum, t) => sum + (t.latency || 0), 0) / filteredTests.length;

    return [
      { 
        label: 'Current Speed', 
        value: `${latest.speed.toFixed(1)} Mbps`,
        change: `${speedChange > 0 ? '+' : ''}${speedChange.toFixed(1)}%`,
        direction: speedChange > 0 ? 'up' : speedChange < 0 ? 'down' : 'neutral',
        peak: `${maxSpeed.toFixed(1)} Mbps`
      },
      { 
        label: 'Avg Latency', 
        value: `${avgLatency.toFixed(0)} ms`,
        change: '0%',
        direction: 'neutral',
        peak: `${Math.min(...filteredTests.map(t => t.latency || 0)).toFixed(0)} ms`
      }
    ];
  }, [filteredTests]);

  // Get recent history
  const history = useMemo(() => {
    return filteredTests.slice(-3).map(test => ({
      speed: `${test.speed.toFixed(1)} Mbps`,
      time: new Date(test.timestamp).toLocaleString(),
      location: `${test.location.lat.toFixed(4)}, ${test.location.lng.toFixed(4)}`
    }));
  }, [filteredTests]);

  const renderTrendIcon = (direction) => {
    switch (direction) {
      case 'up': return <ArrowUpIcon className="w-3 h-3" />;
      case 'down': return <ArrowDownIcon className="w-3 h-3" />;
      default: return <MinusIcon className="w-3 h-3" />;
    }
  };

  const toggleSection = (section) => {
    setShowSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="dashboard-controls">
        <div className="time-range">
          {['24h', '7d', '30d'].map(range => (
            <button
              key={range}
              className={`btn ${timeRange === range ? 'btn-active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="view-controls">
          <button
            className="btn"
            onClick={() => toggleSection('stats')}
          >
            {showSections.stats ? '📊 Hide Stats' : '📊 Show Stats'}
          </button>
          <button
            className="btn"
            onClick={() => toggleSection('trends')}
          >
            {showSections.trends ? '📈 Hide Trends' : '📈 Show Trends'}
          </button>
          <button
            className="btn"
            onClick={() => toggleSection('history')}
          >
            {showSections.history ? '📜 Hide History' : '📜 Show History'}
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {showSections.stats && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2><ChartBarIcon className="w-4 h-4" /> Statistics</h2>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="stat-card">
                    <Icon className="stat-icon" />
                    <span className="stat-value">{value}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showSections.trends && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2><SignalIcon className="w-4 h-4" /> Trends</h2>
            </div>
            <div className="card-content">
              <div className="trend-list">
                {trends.map(({ label, value, change, direction, peak }) => (
                  <div key={label} className="trend-item">
                    <div className="trend-info">
                      <span className="trend-value">{value}</span>
                      <span className="trend-label">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="peak-speed">Peak: {peak}</span>
                      <span className={`trend-change trend-${direction}`}>
                        {renderTrendIcon(direction)}
                        {change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showSections.history && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2><ClockIcon className="w-4 h-4" /> Recent Tests</h2>
            </div>
            <div className="card-content">
              <div className="history-list">
                {history.map(({ speed, time, location }, index) => (
                  <div key={index} className="history-item">
                    <span className="history-speed">{speed}</span>
                    <div className="history-details">
                      <span className="history-time">
                        <ClockIcon className="w-3 h-3" /> {time}
                      </span>
                      <span className="history-location">
                        <MapPinIcon className="w-3 h-3" /> {location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 