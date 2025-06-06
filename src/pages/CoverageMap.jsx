import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useCoverage } from '../context/CoverageContext';
import { useTest } from '../context/TestContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import 'leaflet/dist/leaflet.css';
import '../styles/CoverageMap.css';

// MapController component to handle map interactions
function MapController({ coveragePoints }) {
  const map = useMap();
  
  useEffect(() => {
    if (coveragePoints.length > 0) {
      const validPoints = coveragePoints.filter(p => p.lat && p.lng);
      if (validPoints.length > 0) {
        const bounds = validPoints.reduce(
          (bounds, point) => bounds.extend([point.lat, point.lng]),
          map.getBounds()
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [coveragePoints, map]);

  return null;
}

const CoverageMap = () => {
  const { coveragePoints, statistics } = useCoverage();
  const { tests } = useTest();
  const { isDarkMode, speedThresholds } = useSettings();
  const [selectedLayer, setSelectedLayer] = useState('coverage');
  const [error, setError] = useState(null);

  const getCircleColor = (speed) => {
    if (speed > speedThresholds.excellent) return '#22c55e';
    if (speed > speedThresholds.good) return '#84cc16';
    if (speed > speedThresholds.poor) return '#eab308';
    return '#ef4444';
  };

  const getSignalType = (speed) => {
    if (speed > speedThresholds.excellent) return 'Excellent';
    if (speed > speedThresholds.good) return 'Good';
    if (speed > speedThresholds.poor) return 'Poor';
    return 'Dead Zone';
  };

  const layerOptions = [
    { value: 'coverage', label: 'Coverage Map', icon: '📊' },
    { value: 'deadzone', label: 'Dead Zones', icon: '⚠️' },
    { value: 'heatmap', label: 'Heat Map', icon: '🌡️' },
  ];

  const getPercentage = (value) => {
    const total = Object.values(statistics).reduce((sum, val) => sum + val, 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="coverage-map-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="coverage-header">
        <div className="header-row">
          <h1>Network Coverage Map</h1>
        </div>
        
        <div className="layer-controls">
          {layerOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedLayer(option.value)}
              className={`layer-button ${selectedLayer === option.value ? 'active' : ''}`}
            >
              <span className="layer-icon">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={[0, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={18}
          className="map-view"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className={isDarkMode ? 'dark-tiles' : ''}
          />
          <MapController coveragePoints={coveragePoints} />
          
          {coveragePoints.map((point, index) => {
            if (!point.lat || !point.lng) return null;
            if (selectedLayer === 'deadzone' && point.speed > speedThresholds.poor) return null;
            
            return (
              <CircleMarker
                key={`${point.lat}-${point.lng}-${index}`}
                center={[point.lat, point.lng]}
                radius={8}
                pathOptions={{
                  color: getCircleColor(point.speed),
                  fillColor: getCircleColor(point.speed),
                  fillOpacity: 0.6,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="coverage-popup">
                    <h3>Coverage Details</h3>
                    <div className="coverage-info">
                      <p><strong>Signal Strength:</strong> {point.strength}%</p>
                      <p><strong>Type:</strong> {getSignalType(point.speed)}</p>
                      <p><strong>Speed:</strong> {point.speed.toFixed(2)} Mbps</p>
                      <p><strong>Time:</strong> {new Date(point.timestamp).toLocaleString()}</p>
                      {tests.find(t => 
                        t.location?.lat === point.lat && 
                        t.location?.lng === point.lng &&
                        new Date(t.timestamp).getTime() === new Date(point.timestamp).getTime()
                      )?.isAuto && <p><strong>Test Type:</strong> Automated</p>}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        
        <div className="coverage-stats">
          <div className="stats-card">
            <h3>Coverage Overview</h3>
            {coveragePoints.length === 0 ? (
              <div className="no-data-message">
                No coverage data available. Run a test to start mapping.
              </div>
            ) : (
              <div className="stats-grid">
                <div className="stat-item">
                  <label>Excellent Signal</label>
                  <div className="stat-bar-container">
                    <div 
                      className="stat-bar excellent"
                      style={{ width: `${getPercentage(statistics.excellentSignal)}%` }}
                    ></div>
                    <span>{statistics.excellentSignal || 0} areas</span>
                  </div>
                </div>
                <div className="stat-item">
                  <label>Good Signal</label>
                  <div className="stat-bar-container">
                    <div 
                      className="stat-bar good"
                      style={{ width: `${getPercentage(statistics.goodSignal)}%` }}
                    ></div>
                    <span>{statistics.goodSignal || 0} areas</span>
                  </div>
                </div>
                <div className="stat-item">
                  <label>Poor Signal</label>
                  <div className="stat-bar-container">
                    <div 
                      className="stat-bar poor"
                      style={{ width: `${getPercentage(statistics.poorSignal)}%` }}
                    ></div>
                    <span>{statistics.poorSignal || 0} areas</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageMap; 