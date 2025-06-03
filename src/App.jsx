import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Load Leaflet.heat plugin with better error handling and caching
const loadHeatmapPlugin = (() => {
  let loadPromise = null;
  
  return () => {
    if (loadPromise) return loadPromise;
    
    if (window.L && window.L.heatLayer) {
      loadPromise = Promise.resolve();
      return loadPromise;
    }
    
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      script.crossOrigin = '';
      
      script.onload = () => {
        if (window.L && window.L.heatLayer) {
          resolve();
        } else {
          reject(new Error('Heatmap plugin failed to initialize'));
        }
      };
      
      script.onerror = () => {
        loadPromise = null; // Reset promise on error
        reject(new Error('Failed to load heatmap plugin'));
      };
      
      document.head.appendChild(script);
    });
    
    return loadPromise;
  };
})();

const testInternetSpeed = async () => {
  try {
    const testFile = "https://speed.cloudflare.com/__down?bytes=10000000";
    const startTime = performance.now();
    
    const response = await fetch(testFile, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    await response.blob();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000;
    const fileSizeInBits = 10 * 1024 * 1024 * 8;
    const speedMbps = (fileSizeInBits / duration) / (1024 * 1024);
    
    return Math.max(0.1, Number(speedMbps.toFixed(2)));
  } catch (error) {
    console.error('Speed test failed:', error);
    return 0.1;
  }
};

const getLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ 
        lat: pos.coords.latitude, 
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy 
      }),
      err => {
        console.error('Geolocation error:', err);
        reject(err);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });

const getMarkerColor = (speed) => {
  if (speed > 50) return '#22c55e'; // Green for excellent
  if (speed > 10) return '#f59e0b'; // Orange for good
  if (speed > 1) return '#ef4444';  // Red for poor
  return '#6b7280'; // Gray for dead zone
};

const CustomMarker = ({ log, index }) => {
  const color = getMarkerColor(log.speed);
  
  const icon = L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="
      background: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      position: relative;
    ">
      ${index + 1}
      ${log.isAutoTest ? '<div style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;background:#3b82f6;border-radius:50%;border:1px solid white;"></div>' : ''}
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return (
    <Marker position={[log.lat, log.lon]} icon={icon}>
      <Popup>
        <div style={{ minWidth: '150px' }}>
          <strong>📊 Speed Test #{index + 1}</strong>
          {log.isAutoTest && <span style={{color: '#3b82f6', fontSize: '12px'}}> 🤖 Auto</span>}
          <br />
          <strong>Speed:</strong> {log.speed} Mbps<br />
          <strong>Quality:</strong> {
            log.speed > 50 ? '🟢 Excellent' :
            log.speed > 10 ? '🟡 Good' :
            log.speed > 1 ? '🔴 Poor' : '⚫ Dead Zone'
          }<br />
          <strong>Location:</strong><br />
          Lat: {log.lat.toFixed(6)}<br />
          Lon: {log.lon.toFixed(6)}<br />
          {log.timestamp && (
            <>
              <strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}
            </>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const HeatmapLayer = ({ logs, map }) => {
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !logs.length) return;

    const initHeatmap = async () => {
      try {
        await loadHeatmapPlugin();
        
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
        }

        const heatmapData = logs.map(log => {
          let intensity = Math.log(log.speed + 1) / Math.log(100);
          intensity = Math.min(1, Math.max(0.1, intensity));
          
          return [log.lat, log.lon, intensity];
        });

        const heatLayer = L.heatLayer(heatmapData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.0: '#800026',
            0.2: '#BD0026',
            0.4: '#E31A1C',
            0.6: '#FC4E2A',
            0.8: '#FD8D3C',
            1.0: '#22c55e'
          }
        });

        heatLayerRef.current = heatLayer;
        heatLayer.addTo(map);

      } catch (error) {
        console.error('Failed to load heatmap:', error);
      }
    };

    initHeatmap();

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [logs, map]);

  return null;
};

const App = () => {
  const [logs, setLogs] = useState([]);
  const [mapCenter, setMapCenter] = useState([12.9716, 79.1588]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [map, setMap] = useState(null);
  
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [autoTestInterval, setAutoTestInterval] = useState(5);
  const [nextTestCountdown, setNextTestCountdown] = useState(0);
  const [autoTestCount, setAutoTestCount] = useState(0);
  const workerRef = useRef(null);

  const testSpeed = async (isAutoTest = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await getLocation();
      setCurrentLocation(location);
      
      const speed = await testInternetSpeed();
      
      const log = { 
        lat: location.lat, 
        lon: location.lon, 
        speed,
        timestamp: new Date().toISOString(),
        accuracy: location.accuracy,
        isAutoTest
      };
      
      const updatedLogs = [...logs, log];
      setLogs(updatedLogs);
      
      try {
        localStorage.setItem("deadzone_logs", JSON.stringify(updatedLogs));
      } catch (storageError) {
        console.warn('Failed to save to localStorage:', storageError);
      }
      
      setMapCenter([location.lat, location.lon]);
      
      if (isAutoTest) {
        setAutoTestCount(prev => prev + 1);
      }
      
    } catch (err) {
      console.error('Test failed:', err);
      setError(`Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem("deadzone_logs");
    setError(null);
    setAutoTestCount(0);
  };

  const toggleAutoTesting = () => {
    if (isAutoTesting) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsAutoTesting(false);
      setNextTestCountdown(0);
    } else {
      const worker = new Worker(new URL('./speedWorker.js', import.meta.url));
      
      worker.onmessage = async (e) => {
        if (e.data.type === 'speedResult') {
          const location = await getLocation();
          const log = {
            lat: location.lat,
            lon: location.lon,
            speed: e.data.speed,
            timestamp: new Date().toISOString(),
            accuracy: location.accuracy,
            isAutoTest: true
          };
          
          setLogs(prev => {
            const updated = [...prev, log];
            try {
              localStorage.setItem("deadzone_logs", JSON.stringify(updated));
            } catch (error) {
              console.warn('Failed to save to localStorage:', error);
            }
            return updated;
          });
          
          setAutoTestCount(prev => prev + 1);
          setMapCenter([location.lat, location.lon]);
        }
      };
      
      worker.postMessage({ interval: autoTestInterval });
      workerRef.current = worker;
      
      setIsAutoTesting(true);
      setNextTestCountdown(autoTestInterval * 60);
      setAutoTestCount(0);
    }
  };

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportLogs = () => {
    if (logs.length === 0) {
      alert('No data to export!');
      return;
    }
    
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deadzone-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    if (logs.length === 0) return null;
    
    const speeds = logs.map(log => log.speed);
    const avg = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    
    const deadZones = logs.filter(log => log.speed <= 1).length;
    const poorZones = logs.filter(log => log.speed > 1 && log.speed <= 10).length;
    const goodZones = logs.filter(log => log.speed > 10 && log.speed <= 50).length;
    const excellentZones = logs.filter(log => log.speed > 50).length;
    
    const recentTests = logs.slice(-5);
    const trend = recentTests.length >= 2 ? 
      (recentTests[recentTests.length - 1].speed - recentTests[0].speed) : 0;
    
    return {
      total: logs.length,
      avg: avg.toFixed(1),
      min: min.toFixed(1),
      max: max.toFixed(1),
      deadZones,
      poorZones,
      goodZones,
      excellentZones,
      trend: trend.toFixed(1),
      coverage: {
        dead: ((deadZones / logs.length) * 100).toFixed(0),
        poor: ((poorZones / logs.length) * 100).toFixed(0),
        good: ((goodZones / logs.length) * 100).toFixed(0),
        excellent: ((excellentZones / logs.length) * 100).toFixed(0)
      }
    };
  };

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("deadzone_logs");
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
        
        if (parsedLogs.length > 0) {
          const lastLog = parsedLogs[parsedLogs.length - 1];
          setMapCenter([lastLog.lat, lastLog.lon]);
        }
      }
    } catch (error) {
      console.error('Failed to load saved logs:', error);
    }
    
    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    
    if (isAutoTesting && nextTestCountdown > 0) {
      interval = setInterval(() => {
        setNextTestCountdown(prev => {
          if (prev <= 1) {
            return autoTestInterval * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoTesting, nextTestCountdown, autoTestInterval]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAutoTesting) {
        e.preventDefault();
        e.returnValue = 'Auto-testing is active. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAutoTesting]);

  const stats = getStats();

  return (
    <div className="app">
      <header className="header">
        <h1>🛰️ Deadzone</h1>
        <div className="stats">
          <span>📍 Tests: {logs.length}</span>
          {autoTestCount > 0 && <span>🤖 Auto: {autoTestCount}</span>}
          {stats && (
            <>
              <span>📊 Avg: {stats.avg} Mbps</span>
              <span>⚡ Max: {stats.max} Mbps</span>
            </>
          )}
        </div>
        <div className="controls">
          <button 
            onClick={() => testSpeed(false)} 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? '🔄 Testing...' : '🚀 Test Now'}
          </button>
          
          <button 
            onClick={toggleAutoTesting}
            className={isAutoTesting ? 'auto-active' : 'auto-inactive'}
            disabled={isLoading}
          >
            {isAutoTesting ? '⏹️ Stop Auto' : '🤖 Start Auto'}
          </button>
          
          {logs.length > 0 && (
            <>
              <button 
                onClick={toggleHeatmap}
                className={showHeatmap ? 'heatmap-active' : 'heatmap-inactive'}
              >
                {showHeatmap ? '🗺️ Hide Heatmap' : '🔥 Show Heatmap'}
              </button>
              <button onClick={() => setShowStats(!showStats)}>
                📊 {showStats ? 'Hide' : 'Show'} Stats
              </button>
              <button onClick={exportLogs}>📥 Export Data</button>
              <button onClick={clearLogs} className="clear-btn">🗑️ Clear All</button>
            </>
          )}
        </div>
        
        {showHeatmap && logs.length > 0 && (
          <div className="heatmap-legend">
            <div className="legend-title">🔥 Connectivity Heatmap</div>
            <div className="legend-gradient">
              <div className="legend-labels">
                <span>Dead Zone</span>
                <span>Poor</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
              <div className="legend-bar"></div>
            </div>
          </div>
        )}
        
        <div className="auto-controls">
          <div className="interval-selector">
            <label>Test Interval:</label>
            <select 
              value={autoTestInterval} 
              onChange={(e) => setAutoTestInterval(Number(e.target.value))}
              disabled={isAutoTesting}
            >
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>
          </div>
          
          {isAutoTesting && (
            <div className="auto-status">
              <span className="status-indicator">
                <div className="status-dot active"></div>
                Auto-testing active
              </span>
              {nextTestCountdown > 0 && (
                <span className="countdown">
                  Next test in: {formatTime(nextTestCountdown)}
                </span>
              )}
            </div>
          )}
        </div>
        {error && <div className="error">❌ {error}</div>}
        {currentLocation && (
          <div className="location-info">
            📍 Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
            {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
          </div>
        )}
      </header>
      
      {showStats && stats && (
        <div className="stats-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Speed Stats</div>
                <div className="stat-values">
                  <span>Avg: {stats.avg}</span>
                  <span>Min: {stats.min}</span>
                  <span>Max: {stats.max}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-label">Zone Quality</div>
                <div className="stat-values">
                  <span className="excellent">🟢 {stats.excellentZones} Excellent</span>
                  <span className="good">🟡 {stats.goodZones} Good</span>
                  <span className="dead">🔴 {stats.poorZones} Poor</span>
                  <span className="dead">⚫ {stats.deadZones} Dead</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Coverage</div>
                <div className="stat-values">
                  <span>🟢 {stats.coverage.excellent}% Excellent</span>
                  <span>🟡 {stats.coverage.good}% Good</span>
                  <span>🔴 {stats.coverage.poor}% Poor</span>
                  <span>⚫ {stats.coverage.dead}% Dead</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">{parseFloat(stats.trend) > 0 ? '📈' : parseFloat(stats.trend) < 0 ? '📉' : '➡️'}</div>
              <div className="stat-content">
                <div className="stat-label">Recent Trend</div>
                <div className="stat-values">
                  <span className={parseFloat(stats.trend) > 0 ? 'positive' : parseFloat(stats.trend) < 0 ? 'negative' : 'neutral'}>
                    {parseFloat(stats.trend) > 0 ? '+' : ''}{stats.trend} Mbps
                  </span>
                  <span className="small">Last 5 tests</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stats-summary">
            <h3>📊 Session Summary</h3>
            <p>
              You've tested <strong>{stats.total} locations</strong> with an average speed of <strong>{stats.avg} Mbps</strong>.
              {stats.deadZones > 0 && (
                <> Found <strong className="dead">{stats.deadZones} dead zones</strong> that need attention.</>
              )}
              {stats.excellentZones > 0 && (
                <> Discovered <strong className="excellent">{stats.excellentZones} excellent spots</strong> for heavy internet use.</>
              )}
            </p>
          </div>
        </div>
      )}
      
      <div className="map-wrapper">
        <MapContainer 
          center={mapCenter} 
          zoom={16} 
          style={{ height: "100%", width: "100%" }}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
          whenCreated={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {showHeatmap && <HeatmapLayer logs={logs} map={map} />}
          
          {(!showHeatmap || logs.length < 5) && logs.map((log, idx) => (
            <CustomMarker key={`${log.lat}-${log.lon}-${idx}`} log={log} index={idx} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;