import React, { useState, useRef, useCallback } from 'react';
import MapContainer from '../components/map/MapContainer';
import useMapMarkers from '../hooks/useMapMarkers';
import useSpeedTest from '../hooks/useSpeedTest';
import Overlay from 'ol/Overlay';

const Testing = () => {
  const [logs, setLogs] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('dark');
  const [autoTestInterval, setAutoTestInterval] = useState(5);
  
  const popupRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize map markers hook
  const {
    addMarkersToMap,
    clearMarkers,
    animateToMarker,
    getMarkerColor
  } = useMapMarkers(mapRef.current?.vectorSource);

  // Handle test completion
  const handleTestComplete = useCallback((testResult) => {
    const updatedLogs = [...logs, testResult];
    setLogs(updatedLogs);
    
    try {
      localStorage.setItem("deadzone_logs", JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.warn('Failed to save to localStorage:', storageError);
    }
    
    addMarkersToMap(updatedLogs);
    
    if (mapRef.current?.map) {
      animateToMarker(
        mapRef.current.map,
        [testResult.longitude, testResult.latitude],
        { zoom: 16, duration: 1000 }
      );
    }
  }, [logs, addMarkersToMap, animateToMarker]);

  // Initialize speed test hook
  const {
    isLoading,
    error,
    isAutoTesting,
    autoTestCount,
    startAutoTest,
    stopAutoTest,
    updateTestInterval,
    runManualTest
  } = useSpeedTest(handleTestComplete);

  // Handle map initialization
  const handleMapReady = useCallback(({ map, vectorSource }) => {
    mapRef.current = { map, vectorSource };

    // Initialize popup overlay
    const popupOverlay = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });
    map.addOverlay(popupOverlay);
    popupOverlayRef.current = popupOverlay;

    // Add click handler for markers
    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, feature => feature);
      if (feature) {
        const log = feature.get('data');
        setSelectedMarker(log);
        popupOverlay.setPosition(feature.getGeometry().getCoordinates());
      } else {
        setSelectedMarker(null);
        popupOverlay.setPosition(undefined);
      }
    });

    // Load saved logs
    try {
      const savedLogs = localStorage.getItem("deadzone_logs");
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
        addMarkersToMap(parsedLogs);
        
        if (parsedLogs.length > 0) {
          const lastLog = parsedLogs[parsedLogs.length - 1];
          animateToMarker(
            map,
            [lastLog.longitude, lastLog.latitude],
            { zoom: 16, duration: 0 }
          );
        }
      }
    } catch (error) {
      console.error('Failed to load saved logs:', error);
    }
  }, [addMarkersToMap, animateToMarker]);

  // Handle interval change
  const handleIntervalChange = useCallback((newInterval) => {
    setAutoTestInterval(newInterval);
    updateTestInterval(newInterval * 60 * 1000); // Convert minutes to milliseconds
  }, [updateTestInterval]);

  // Handle clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem("deadzone_logs");
    clearMarkers();
    setSelectedMarker(null);
    if (popupOverlayRef.current) {
      popupOverlayRef.current.setPosition(undefined);
    }
  }, [clearMarkers]);

  return (
    <div className="testing-page">
      <header className="header">
        <h1>🛰️ Speed Testing</h1>
        <div className="stats">
          <span>📍 Tests: {logs.length}</span>
          {autoTestCount > 0 && <span>🤖 Auto: {autoTestCount}</span>}
        </div>
        <div className="controls">
          <button 
            onClick={runManualTest} 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? '🔄 Testing...' : '🚀 Test Now'}
          </button>
          
          <button 
            onClick={() => isAutoTesting ? stopAutoTest() : startAutoTest(autoTestInterval * 60 * 1000)}
            className={isAutoTesting ? 'auto-active' : 'auto-inactive'}
            disabled={isLoading}
          >
            {isAutoTesting ? '⏹️ Stop Auto' : '🤖 Start Auto'}
          </button>
          
          <button onClick={clearLogs} className="clear-btn">🗑️ Clear All</button>

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
        
        <div className="auto-controls">
          <div className="interval-selector">
            <label>Test Interval:</label>
            <select 
              value={autoTestInterval} 
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
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
      
      <div className="map-wrapper">
        <MapContainer
          selectedStyle={selectedStyle}
          onMapReady={handleMapReady}
          className="ol-map"
        />
        <div 
          ref={popupRef} 
          className="ol-popup"
          style={{ display: selectedMarker ? 'block' : 'none' }}
        >
          {selectedMarker && (
            <div>
              <a 
                href="#" 
                className="ol-popup-closer"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedMarker(null);
                  popupOverlayRef.current.setPosition(undefined);
                }}
              />
              <strong>📊 Speed Test #{logs.indexOf(selectedMarker) + 1}</strong>
              {selectedMarker.isAutoTest && <span style={{color: '#3b82f6', fontSize: '12px'}}> 🤖 Auto</span>}
              <br />
              <strong>Speed:</strong> {selectedMarker.speed} Mbps<br />
              <strong>Quality:</strong> {
                selectedMarker.speed > 50 ? '🟢 Excellent' :
                selectedMarker.speed > 10 ? '🟡 Good' :
                selectedMarker.speed > 1 ? '🔴 Poor' : '⚫ Dead Zone'
              }<br />
              <strong>Location:</strong><br />
              Lat: {selectedMarker.latitude.toFixed(6)}<br />
              Lng: {selectedMarker.longitude.toFixed(6)}<br />
              {selectedMarker.timestamp && (
                <>
                  <strong>Time:</strong> {new Date(selectedMarker.timestamp).toLocaleString()}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testing; 