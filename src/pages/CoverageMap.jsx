import React, { useState, useEffect, useRef } from 'react';
import { useCoverage } from '../context/CoverageContext';
import { useTest } from '../context/TestContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/CoverageMap.css';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CoverageMap = () => {
  const { coveragePoints, statistics } = useCoverage();
  const { tests, runTest } = useTest();
  const { isDarkMode, speedThresholds } = useSettings();
  const [selectedLayer, setSelectedLayer] = useState('coverage');
  const [map, setMap] = useState(null);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);

  const handleResetView = () => {
    if (!map) return;
    
    const validPoints = coveragePoints.filter(p => p.lat && p.lng);
    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Reset to default view
      map.setView([0, 0], 2);
    }
  };

  // Initialize map with error handling
  useEffect(() => {
    if (!map && mapRef.current && !mapRef.current._leaflet_id) {
      try {
        const mapInstance = L.map(mapRef.current, {
          center: [0, 0],
          zoom: 2,
          minZoom: 2,
          maxZoom: 18,
          zoomControl: true
        });
        
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        if (isDarkMode) {
          tileLayer.getContainer().style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
        }

        // Add event listener for tests cleared
        const handleTestsCleared = () => {
          mapInstance.setView([0, 0], 2);
        };
        window.addEventListener('testsCleared', handleTestsCleared);

        setMap(mapInstance);
        setError(null);

        return () => {
          window.removeEventListener('testsCleared', handleTestsCleared);
          mapInstance.remove();
          setMap(null);
        };
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map. Please refresh the page.');
      }
    }
  }, [isDarkMode]);

  // Update markers when coverage points or selected layer changes
  useEffect(() => {
    if (!map) return;

    try {
      // Clear existing markers
      markers.forEach(marker => marker.remove());
      if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
      }

      const newMarkers = [];

      if (coveragePoints.length === 0) {
        // Show default center and zoom if no points
        map.setView([0, 0], 2);
        setMarkers([]);
        return;
      }

      if (selectedLayer === 'coverage' || selectedLayer === 'deadzone') {
        coveragePoints.forEach((point) => {
          if (!point.lat || !point.lng) return; // Skip invalid points
          if (selectedLayer === 'deadzone' && point.speed > speedThresholds.poor) return;

          const circle = L.circle([point.lat, point.lng], {
            radius: 200,
            color: getCircleColor(point.speed),
            fillColor: getCircleColor(point.speed),
            fillOpacity: 0.6,
            weight: 2
          }).addTo(map);

          const test = tests.find(t => 
            t.location?.lat === point.lat && 
            t.location?.lng === point.lng &&
            new Date(t.timestamp).getTime() === new Date(point.timestamp).getTime()
          );

          circle.bindPopup(`
            <div class="coverage-popup">
              <h3>Coverage Details</h3>
              <div class="coverage-info">
                <p><strong>Signal Strength:</strong> ${point.strength}%</p>
                <p><strong>Type:</strong> ${getSignalType(point.speed)}</p>
                <p><strong>Speed:</strong> ${point.speed.toFixed(2)} Mbps</p>
                <p><strong>Time:</strong> ${new Date(point.timestamp).toLocaleString()}</p>
                ${test?.isAuto ? '<p><strong>Test Type:</strong> Automated</p>' : ''}
              </div>
            </div>
          `);

          newMarkers.push(circle);
        });
      } else if (selectedLayer === 'heatmap' && window.L.heatLayer) {
        const heatData = coveragePoints
          .filter(point => point.lat && point.lng) // Filter out invalid points
          .map(point => ({
            lat: point.lat,
            lng: point.lng,
            intensity: point.speed / 100
          }));

        if (heatData.length > 0) {
          const newHeatmapLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            max: 1.0,
            gradient: {
              0.0: '#ef4444',
              0.25: '#f97316',
              0.5: '#eab308',
              0.75: '#84cc16',
              1.0: '#22c55e'
            }
          }).addTo(map);

          setHeatmapLayer(newHeatmapLayer);
        }
      }

      setMarkers(newMarkers);

      // Fit bounds if there are valid points
      const validPoints = coveragePoints.filter(p => p.lat && p.lng);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      setError(null);
    } catch (err) {
      console.error('Error updating map markers:', err);
      setError('Failed to update map markers. Please try refreshing the page.');
    }
  }, [map, coveragePoints, selectedLayer, tests]);

  const handleQuickTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await runTest();
    } catch (err) {
      console.error('Test failed:', err);
      setError('Failed to run test. Please check your location permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCircleColor = (speed) => {
    if (speed > speedThresholds.excellent) return '#22c55e'; // Excellent - Green
    if (speed > speedThresholds.good) return '#84cc16'; // Good - Light Green
    if (speed > speedThresholds.poor) return '#eab308'; // Poor - Yellow
    return '#ef4444'; // Dead Zone - Red
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

        <div className="coverage-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Excellent ({speedThresholds.excellent}+ Mbps)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#84cc16' }}></div>
            <span>Good ({speedThresholds.good}-{speedThresholds.excellent} Mbps)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#eab308' }}></div>
            <span>Poor ({speedThresholds.poor}-{speedThresholds.good} Mbps)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Dead Zone (0-{speedThresholds.poor} Mbps)</span>
          </div>
        </div>
      </div>

      <div className="map-container">
        <div ref={mapRef} className="map-view"></div>
        
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

          <div className="stats-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-button"
                onClick={() => {
                  if (coveragePoints.length === 0) {
                    setError('No data available to export.');
                    return;
                  }
                  const dataStr = JSON.stringify(coveragePoints);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', 'coverage-data.json');
                  linkElement.click();
                }}
                disabled={coveragePoints.length === 0}
              >
                Export Coverage Data
              </button>
              <button 
                className="action-button"
                onClick={handleQuickTest}
                disabled={isLoading}
              >
                {isLoading ? 'Running Test...' : 'Quick Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageMap; 