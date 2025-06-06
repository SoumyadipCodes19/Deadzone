import React, { createContext, useContext, useState, useEffect } from 'react';

const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [tests, setTests] = useState([]);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [autoTestInterval, setAutoTestInterval] = useState(null);
  const [nextTestTime, setNextTestTime] = useState(null);

  // Load initial data
  useEffect(() => {
    loadSavedTests();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoTestInterval) {
        clearInterval(autoTestInterval);
      }
    };
  }, [autoTestInterval]);

  const loadSavedTests = () => {
    try {
      const savedTests = localStorage.getItem("deadzone_tests");
      if (savedTests) {
        setTests(JSON.parse(savedTests));
      }
    } catch (error) {
      console.error('Failed to load saved tests:', error);
    }
  };

  const runTest = async () => {
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Simulate speed test (replace with actual speed test implementation)
      const speed = Math.random() * 100;

      const newTest = {
        id: Date.now(), // Add unique ID for each test
        speed,
        timestamp: new Date().toISOString(),
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        isAuto: isAutoTesting
      };

      setTests(prevTests => {
        const updatedTests = [...prevTests, newTest];
        localStorage.setItem("deadzone_tests", JSON.stringify(updatedTests));
        return updatedTests;
      });

      // Dispatch event for any external listeners
      const event = new CustomEvent('speedTestComplete', {
        detail: {
          test: newTest,
          totalTests: tests.length + 1,
          isAutoTest: isAutoTesting
        }
      });
      window.dispatchEvent(event);

      return newTest;
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  };

  const clearTests = () => {
    setTests([]);
    localStorage.removeItem("deadzone_tests");
    
    // Ensure the event is dispatched after state update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('testsCleared'));
    }, 0);
  };

  const startAutoTest = (intervalMs = 60000) => {
    if (isAutoTesting) {
      stopAutoTest(); // Stop existing auto test if running
    }

    setIsAutoTesting(true);
    setNextTestTime(Date.now() + intervalMs);
    
    // Run first test immediately
    runTest().catch(error => console.error('Initial auto test failed:', error));
    
    // Set up interval for subsequent tests
    const interval = setInterval(async () => {
      try {
        await runTest();
        setNextTestTime(Date.now() + intervalMs); // Update next test time
      } catch (error) {
        console.error('Auto test failed:', error);
      }
    }, intervalMs);

    setAutoTestInterval(interval);
  };

  const stopAutoTest = () => {
    if (autoTestInterval) {
      clearInterval(autoTestInterval);
      setAutoTestInterval(null);
    }
    setIsAutoTesting(false);
    setNextTestTime(null);
  };

  return (
    <TestContext.Provider 
      value={{
        tests,
        isAutoTesting,
        nextTestTime,
        runTest,
        clearTests,
        startAutoTest,
        stopAutoTest
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};

export default TestContext; 