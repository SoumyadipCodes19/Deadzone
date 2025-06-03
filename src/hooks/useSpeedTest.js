import { useState, useCallback, useRef, useEffect } from 'react';

const useSpeedTest = (onTestComplete) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [autoTestCount, setAutoTestCount] = useState(0);
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
  const startAutoTest = useCallback((interval) => {
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
  }, [isAutoTesting]);

  // Stop auto testing
  const stopAutoTest = useCallback(() => {
    if (!isAutoTesting) return;

    setIsAutoTesting(false);
    console.log('Stopping auto test...');
    workerRef.current.postMessage({ command: 'stop' });

    // Clear auto-test state
    localStorage.removeItem('autoTestingActive');
    localStorage.removeItem('autoTestInterval');
  }, [isAutoTesting]);

  // Update test interval
  const updateTestInterval = useCallback((interval) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        command: 'setInterval',
        data: { interval }
      });

      if (isAutoTesting) {
        localStorage.setItem('autoTestInterval', interval.toString());
      }
    }
  }, [isAutoTesting]);

  // Run a single manual test
  const runManualTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const testResult = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: await testInternetSpeed(),
        timestamp: new Date().toISOString(),
        accuracy: position.coords.accuracy,
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
  }, [onTestComplete]);

  // Restore auto-test state on mount
  useEffect(() => {
    const wasAutoTesting = localStorage.getItem('autoTestingActive') === 'true';
    const savedInterval = parseInt(localStorage.getItem('autoTestInterval'), 10);

    if (wasAutoTesting && savedInterval) {
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
    updateTestInterval,
    runManualTest
  };
};

// Helper function to test internet speed
async function testInternetSpeed() {
  try {
    const startTime = performance.now();
    const response = await fetch('https://www.google.com/favicon.ico', {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const endTime = performance.now();
    const duration = endTime - startTime;
    const speed = (response.headers.get('content-length') * 8) / (duration / 1000) / 1024 / 1024;
    return Math.min(Math.round(speed * 100) / 100, 1000); // Cap at 1000 Mbps
  } catch (error) {
    return 0; // Return 0 for failed tests
  }
}

export default useSpeedTest; 