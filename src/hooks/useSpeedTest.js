import { useState, useCallback, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const useSpeedTest = (onTestComplete) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [autoTestCount, setAutoTestCount] = useState(0);
  const { autoTestInterval } = useSettings();
  const workerRef = useRef(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/speedTestWorker.js', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, data, error } = e.data;

      switch (type) {
        case 'testComplete':
          if (onTestComplete) {
            onTestComplete(data);
          }
          setAutoTestCount(prev => prev + 1);
          break;

        case 'error':
          console.error('Auto test error:', error);
          setError(error);
          setIsAutoTesting(false);
          break;
      }
    };

    // Clean up worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [onTestComplete]);

  // Start auto testing
  const startAutoTest = useCallback((interval = autoTestInterval * 1000) => {
    if (isAutoTesting) return;
    
    setIsAutoTesting(true);
    setError(null);
    console.log('Starting auto test...');

    workerRef.current.postMessage({
      command: 'start',
      data: { interval }
    });

    // Save auto-test state
    localStorage.setItem('autoTestingActive', 'true');
    localStorage.setItem('autoTestInterval', interval.toString());
  }, [isAutoTesting, autoTestInterval]);

  // Stop auto testing
  const stopAutoTest = useCallback(() => {
    if (!isAutoTesting) return;

    workerRef.current.postMessage({
      command: 'stop'
    });

    setIsAutoTesting(false);
    localStorage.removeItem('autoTestingActive');
    localStorage.removeItem('autoTestInterval');
  }, [isAutoTesting]);

  // Run a manual test
  const runManualTest = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Simulate speed test (replace with actual speed test logic)
      const speed = Math.random() * 100;

      // Create test result
      const testResult = {
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed,
        isAutoTest: false
      };

      if (onTestComplete) {
        onTestComplete(testResult);
      }
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onTestComplete]);

  // Check for saved auto-test state on mount
  useEffect(() => {
    const autoTestingActive = localStorage.getItem('autoTestingActive') === 'true';
    const savedInterval = parseInt(localStorage.getItem('autoTestInterval'));

    if (autoTestingActive && savedInterval) {
      startAutoTest(savedInterval);
    }
  }, [startAutoTest]);

  return {
    isLoading,
    error,
    isAutoTesting,
    autoTestCount,
    startAutoTest,
    stopAutoTest,
    runManualTest
  };
};

// Helper function to test internet speed
async function testInternetSpeed() {
  console.log('Starting speed test...');
  const testSizes = [
    25000000,  // 25 MB
    5000000,   // 5 MB
    1000000    // 1 MB
  ];

  for (const size of testSizes) {
    try {
      console.log(`Testing with size: ${size} bytes`);
      const startTime = performance.now();
      
      console.log('Fetching...');
      const response = await fetch(`http://localhost:3001/speedtest?size=${size}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch test data: ${response.status}`);
        continue;
      }
      
      console.log('Reading response...');
      const blob = await response.blob();
      const endTime = performance.now();
      
      console.log(`Response size: ${blob.size} bytes`);
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      console.log(`Test duration: ${duration} seconds`);
      
      const fileSizeInBits = blob.size * 8;
      const speedMbps = (fileSizeInBits / duration) / (1024 * 1024);
      console.log(`Calculated speed: ${speedMbps} Mbps`);
      
      // Validate the result
      if (speedMbps > 0 && speedMbps < 10000) { // Reasonable range check
        console.log(`Returning valid speed: ${Math.round(speedMbps * 100) / 100} Mbps`);
        return Math.round(speedMbps * 100) / 100; // Round to 2 decimal places
      }
      
      console.warn(`Invalid speed result: ${speedMbps}`);
    } catch (error) {
      console.error(`Error during speed test:`, error);
    }
  }
  
  return 0; // Return 0 for failed tests in hook context
}

export default useSpeedTest; 