import React, { useState, useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Icon, Circle, Fill, Stroke, Text } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

// Map configuration
const mapStyles = {
  dark: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  streets: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  satellite: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
};

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('dark');
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);

  const getMarkerColor = (speed) => {
    if (speed > 50) return '#22c55e';
    if (speed > 10) return '#f59e0b';
    if (speed > 1) return '#ef4444';
    return '#6b7280';
  };

  const addMarkersToMap = (logsToAdd) => {
    if (!vectorSourceRef.current) {
      console.error('Vector source not initialized');
      return;
    }
    
    console.log('Adding markers for logs:', logsToAdd);
    vectorSourceRef.current.clear();
    
    logsToAdd.forEach((log, idx) => {
      if (!log.longitude || !log.latitude) {
        console.error('Invalid coordinates for log:', log);
        return;
      }

      const coordinates = fromLonLat([log.longitude, log.latitude]);
      console.log('Marker coordinates:', coordinates);
      
      const feature = new Feature({
        geometry: new Point(coordinates)
      });

      const color = getMarkerColor(log.speed);
      
      // Create marker style with auto-test indicator
      const styles = [
        new Style({
          image: new Circle({
            radius: 12,
            fill: new Fill({
              color: color
            }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2
            })
          }),
          text: new Text({
            text: (idx + 1).toString(),
            fill: new Fill({
              color: '#ffffff'
            }),
            font: '12px sans-serif'
          })
        })
      ];

      // Add auto-test indicator
      if (log.isAutoTest) {
        styles.push(
          new Style({
            image: new Circle({
              radius: 4,
              fill: new Fill({
                color: '#3b82f6'
              }),
              stroke: new Stroke({
                color: '#ffffff',
                width: 1
              }),
              displacement: [8, -8] // Offset from main marker
            })
          })
        );
      }
      
      feature.setStyle(styles);
      feature.set('data', log);
      vectorSourceRef.current.addFeature(feature);
    });

    console.log('Total features added:', vectorSourceRef.current.getFeatures().length);
  };

  // Add function to check if auto-testing is active
  const checkAutoTestStatus = () => {
    try {
      const savedLogs = localStorage.getItem("deadzone_logs");
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        if (parsedLogs.length >= 2) {
          const lastTwo = parsedLogs.slice(-2);
          const isAutoTesting = lastTwo.every(log => log.isAutoTest) &&
            (new Date(lastTwo[1].timestamp) - new Date(lastTwo[0].timestamp)) < 15000; // Within 15 seconds
          return isAutoTesting;
        }
      }
    } catch (error) {
      console.error('Error checking auto-test status:', error);
    }
    return false;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    console.log('Initializing map...');
    // Initialize map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: mapStyles[selectedStyle],
            attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          })
        })
      ],
      view: new View({
        center: fromLonLat([87.8549755, 22.9867569]), // Set initial center to match your coordinates
        zoom: 12,
        minZoom: 2,
        maxZoom: 19
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: true
      })
    });

    // Initialize vector layer for markers
    vectorSourceRef.current = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      zIndex: 2
    });
    map.addLayer(vectorLayer);
    vectorLayerRef.current = vectorLayer;

    // Force a resize to ensure proper rendering
    setTimeout(() => {
      map.updateSize();
    }, 200);

    mapInstanceRef.current = map;

    // Load saved logs
    try {
      const savedLogs = localStorage.getItem("deadzone_logs");
      if (savedLogs) {
        console.log('Found saved logs');
        const parsedLogs = JSON.parse(savedLogs);
        console.log('Parsed logs:', parsedLogs);
        setLogs(parsedLogs);
        
        if (parsedLogs.length > 0) {
          // Add markers after a short delay to ensure map is ready
          setTimeout(() => {
            addMarkersToMap(parsedLogs);
            
            // Fit view to show all markers
            if (vectorSourceRef.current && vectorSourceRef.current.getFeatures().length > 0) {
              const extent = vectorSourceRef.current.getExtent();
              map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                maxZoom: 16
              });
            }
          }, 300);
        }
      } else {
        console.log('No saved logs found');
      }
    } catch (error) {
      console.error('Failed to load saved logs:', error);
    }

    return () => {
      if (map) {
        map.setTarget(null);
      }
    };
  }, []);

  // Update the storage change handler
  const handleStorageChange = (e) => {
    if (e.key === "deadzone_logs") {
      console.log('Deadzone logs updated');
      try {
        const newLogs = JSON.parse(e.newValue);
        setLogs(newLogs);
        
        // Focus on the latest marker
        if (newLogs && newLogs.length > 0) {
          const lastLog = newLogs[newLogs.length - 1];
          const coordinates = fromLonLat([lastLog.longitude, lastLog.latitude]);
          
          if (mapInstanceRef.current) {
            // Use different animation settings for auto-test
            const isAutoTest = checkAutoTestStatus();
            mapInstanceRef.current.getView().animate({
              center: coordinates,
              zoom: isAutoTest ? 18 : 16, // Closer zoom for auto-test
              duration: isAutoTest ? 500 : 1000 // Faster animation for auto-test
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse updated logs:', error);
      }
    }
  };

  // Add effect to listen for storage changes
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for direct localStorage changes in the same window
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      const event = new Event('storage');
      event.key = key;
      event.newValue = value;
      window.dispatchEvent(event);
      originalSetItem.apply(this, arguments);
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  // Update markers when logs change
  useEffect(() => {
    if (mapInstanceRef.current && logs.length > 0) {
      console.log('Logs updated, refreshing markers');
      addMarkersToMap(logs);
      
      // Get the latest log
      const lastLog = logs[logs.length - 1];
      const coordinates = fromLonLat([lastLog.longitude, lastLog.latitude]);
      
      // Animate to the new marker
      mapInstanceRef.current.getView().animate({
        center: coordinates,
        zoom: 16,
        duration: 1000
      });
    }
  }, [logs]);

  // Update map style when selected style changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const layers = mapInstanceRef.current.getLayers();
      layers.getArray()[0].setSource(
        new XYZ({
          url: mapStyles[selectedStyle],
          attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        })
      );
    }
  }, [selectedStyle]);

  // Handle heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || logs.length === 0) return;

    // Show/hide markers based on heatmap visibility
    if (vectorLayerRef.current) {
      vectorLayerRef.current.setVisible(!showHeatmap);
    }

    if (!showHeatmap) {
      if (heatmapLayerRef.current) {
        mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    const source = new VectorSource();
    
    const heatmapLayer = new WebGLPointsLayer({
      source,
      style: {
        symbol: {
          symbolType: 'circle',
          size: ['interpolate', ['linear'], ['get', 'weight'], 0, 8, 100, 28],
          color: ['interpolate', ['linear'], ['get', 'weight'],
            0, 'rgba(0,0,0,0.5)',
            0.2, 'rgba(128,0,38,0.5)',
            0.4, 'rgba(189,0,38,0.5)',
            0.6, 'rgba(227,26,28,0.5)',
            0.8, 'rgba(252,78,42,0.5)',
            1.0, 'rgba(34,197,94,0.5)'
          ],
          opacity: 0.8
        }
      }
    });

    logs.forEach(log => {
      const weight = Math.log(log.speed + 1) / Math.log(100); // Normalize speed values
      source.addFeature({
        geometry: new Point(fromLonLat([log.longitude, log.latitude])),
        properties: {
          weight: weight
        }
      });
    });

    mapInstanceRef.current.addLayer(heatmapLayer);
    heatmapLayerRef.current = heatmapLayer;

    return () => {
      if (heatmapLayerRef.current) {
        mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
    };
  }, [logs, showHeatmap]);

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

  const stats = getStats();

  return (
    <div className="dashboard-page">
      <header className="header">
        <h1>📊 Dashboard</h1>
        <div className="controls">
          <button 
            onClick={() => setShowStats(!showStats)}
            className={showStats ? 'active' : ''}
          >
            📊 {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={showHeatmap ? 'active' : ''}
          >
            🔥 {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </button>
          <button onClick={exportLogs}>📥 Export Data</button>
          
          <select 
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="map-style-select"
          >
            <option value="dark">🌙 Dark</option>
            <option value="streets">🗺️ Streets</option>
            <option value="satellite">🛸 Satellite</option>
          </select>
        </div>
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

      {showHeatmap && (
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
      
      <div className="map-wrapper">
        <div ref={mapRef} className="ol-map" />
      </div>
    </div>
  );
};

export default Dashboard; 