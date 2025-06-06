import React, { useState, useEffect } from 'react';
import Button from '../common/Button';

const AutoTest = ({ isAutoTesting, setIsAutoTesting, onTest }) => {
  const [interval, setInterval] = useState(5);
  
  useEffect(() => {
    let timer;
    if (isAutoTesting) {
      // Run first test immediately
      onTest();
      // Set up interval for subsequent tests
      timer = setInterval(onTest, interval * 60 * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoTesting, interval, onTest]);

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setInterval(value);
  };

  return (
    <div className="auto-test-section">
      <h3>Auto Test Settings</h3>
      <div className="auto-test-content">
        <div className="interval-section">
          <div className="interval-select">
            <label htmlFor="interval">Test Interval (minutes)</label>
            <select
              id="interval"
              value={interval}
              onChange={handleIntervalChange}
              className="select-input"
              disabled={isAutoTesting}
            >
              <option value="1">1</option>
              <option value="5">5</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </div>
        </div>

        <div className="auto-test-controls">
          {isAutoTesting ? (
            <div className="auto-test-active">
              <p>Auto testing every {interval} minutes</p>
              <Button
                onClick={() => setIsAutoTesting(false)}
                className="stop-test-button"
              >
                Stop Auto Test
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsAutoTesting(true)}
              variant="primary"
              className="start-test-button"
            >
              Start Auto Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoTest; 