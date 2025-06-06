import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { OSM, XYZ } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { useTest } from '../context/TestContext';
import { useSettings } from '../context/SettingsContext';
import { formatSpeed, formatCoordinates, formatDateTime } from '../utils/format';
import '../styles/Testing.css';
import { format } from 'date-fns';
import { useTestResults } from '../contexts/TestResultsContext';
import AutoTest from './testing/AutoTest';
import TestCard from './testing/TestCard';
import Button from './common/Button';

const TILE_SERVERS = {
  streets: new OSM(),
  satellite: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  dark: new XYZ({
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  })
};

const Testing = () => {
  const mapRef = useRef();
  const mapInstance = useRef(null);
  const { 
    tests, 
    runTest, 
    startAutoTest, 
    stopAutoTest, 
    clearTests, 
    isAutoTesting 
  } = useTest();
  const { mapStyle } = useSettings();
  const [selectedStyle, setSelectedStyle] = useState(mapStyle || 'streets');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const { addTest } = useTestResults();
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    if (!mapInstance.current) {
      try {
        mapInstance.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({
              source: TILE_SERVERS[selectedStyle]
            })
          ],
          view: new View({
            center: fromLonLat([0, 0]),
            zoom: 2,
            minZoom: 2,
            maxZoom: 18
          })
        });
      } catch (err) {
        setError('Failed to initialize map. Please refresh the page.');
        console.error('Map initialization error:', err);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      const layers = mapInstance.current.getLayers();
      layers.getArray()[0].setSource(TILE_SERVERS[selectedStyle]);
    }
  }, [selectedStyle]);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runTest();
      setCurrentTest(result);
      if (mapInstance.current && result.location) {
        const view = mapInstance.current.getView();
        view.animate({
          center: fromLonLat([result.location.lng, result.location.lat]),
          zoom: 15,
          duration: 1000
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to run test');
      console.error('Test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoTest = () => {
    if (isAutoTesting) {
      stopAutoTest();
    } else {
      startAutoTest();
    }
  };

  const handleClearTests = () => {
    clearTests();
    setCurrentTest(null);
  };

  const runSpeedTest = useCallback(async () => {
    if (isTestRunning) return;
    
    setIsTestRunning(true);
    try {
      const response = await fetch('http://localhost:3001/api/speedtest');
      const result = await response.json();
      
      if (result.speed !== undefined) {
        addTest({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          speed: result.speed
        });
      }
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  }, [addTest, isTestRunning]);

  return (
    <div className="testing-container">
      <div className="testing-header">
        <div className="network-testing">
          <h2>Network Testing</h2>
          <div className="test-buttons">
            <Button 
              onClick={runSpeedTest} 
              disabled={isTestRunning || isAutoTesting}
            >
              {isTestRunning ? 'Running Test...' : 'Run Test'}
            </Button>
            <Button 
              onClick={clearTests}
              variant="secondary"
              disabled={isAutoTesting}
            >
              Clear Tests
            </Button>
          </div>
        </div>
      </div>

      <div className="auto-test-container">
        <AutoTest
          isAutoTesting={isAutoTesting}
          setIsAutoTesting={setIsAutoTesting}
          onTest={runSpeedTest}
        />
      </div>

      <div className="test-results">
        {tests.map(test => (
          <TestCard
            key={test.id}
            speed={test.speed}
            timestamp={format(new Date(test.timestamp), 'PPpp')}
          />
        ))}
      </div>
    </div>
  );
};

export default Testing; 