import React, { useState, useEffect, useContext } from 'react';
import TestContext from '../context/TestContext';
import { useSettings } from '../context/SettingsContext';
import TestScheduler from '../components/TestScheduler';
import '../styles/Testing.css';

const Testing = () => {
  const { tests, clearTests, runTest, startAutoTest, stopAutoTest, isAutoTesting } = useContext(TestContext);
  const { autoTestInterval, speedThresholds, notificationsEnabled } = useSettings();
  const [scheduledTests, setScheduledTests] = useState([]);
  const [activeSchedules, setActiveSchedules] = useState([]);

  useEffect(() => {
    if (notificationsEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    // Load saved schedules from localStorage
    const savedSchedules = localStorage.getItem('scheduledTests');
    if (savedSchedules) {
      setScheduledTests(JSON.parse(savedSchedules));
    }
  }, []);

  useEffect(() => {
    // Save schedules to localStorage whenever they change
    localStorage.setItem('scheduledTests', JSON.stringify(scheduledTests));
  }, [scheduledTests]);

  useEffect(() => {
    // Clear all existing intervals when component unmounts
    return () => {
      activeSchedules.forEach(schedule => clearInterval(schedule.intervalId));
    };
  }, [activeSchedules]);

  const handleTestComplete = (testResult) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      const quality = getSpeedQuality(testResult.speed);
      new Notification('Speed Test Complete', {
        body: `Speed: ${testResult.speed} Mbps (${quality})`,
        icon: '/favicon.ico'
      });
    }
  };

  const handleScheduleTest = (schedule) => {
    const newSchedule = {
      id: Date.now(),
      ...schedule,
      status: 'active'
    };

    setScheduledTests(prev => [...prev, newSchedule]);

    if (schedule.type === 'recurring') {
      // Set up recurring test
      const now = new Date();
      const targetDay = schedule.config.day;
      const [hours, minutes] = schedule.config.time.split(':');
      const targetTime = new Date();
      targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate next occurrence
      let daysUntilNext = getDayDifference(now.getDay(), getDayNumber(targetDay));
      if (daysUntilNext === 0 && now > targetTime) {
        daysUntilNext = 7;
      }

      const firstRun = new Date(targetTime);
      firstRun.setDate(firstRun.getDate() + daysUntilNext);

      const timeUntilFirst = firstRun - now;

      // Schedule first occurrence
      const timeoutId = setTimeout(() => {
        runTest();
        // Set up weekly interval after first run
        const intervalId = setInterval(runTest, 7 * 24 * 60 * 60 * 1000);
        setActiveSchedules(prev => [...prev, { id: newSchedule.id, intervalId }]);
      }, timeUntilFirst);

      setActiveSchedules(prev => [...prev, { id: newSchedule.id, timeoutId }]);
    } else {
      // Set up one-time test
      const targetDate = new Date(`${schedule.config.date}T${schedule.config.time}`);
      const timeUntilTest = targetDate - new Date();

      if (timeUntilTest > 0) {
        const timeoutId = setTimeout(() => {
          runTest();
          // Remove one-time schedule after execution
          setScheduledTests(prev => prev.filter(s => s.id !== newSchedule.id));
        }, timeUntilTest);

        setActiveSchedules(prev => [...prev, { id: newSchedule.id, timeoutId }]);
      }
    }
  };

  const handleAutoTest = (intervalMinutes) => {
    const intervalMs = intervalMinutes;
    startAutoTest(intervalMs);
  };

  const handleStopAutoTest = () => {
    stopAutoTest();
  };

  const handleClearSchedule = (scheduleId) => {
    // Clear the associated timeout/interval
    const schedule = activeSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      if (schedule.timeoutId) clearTimeout(schedule.timeoutId);
      if (schedule.intervalId) clearInterval(schedule.intervalId);
    }

    // Remove from active schedules
    setActiveSchedules(prev => prev.filter(s => s.id !== scheduleId));
    // Remove from scheduled tests
    setScheduledTests(prev => prev.filter(s => s.id !== scheduleId));
  };

  const handleClearLogs = () => {
    clearTests();
  };

  return (
    <div className="testing-page">
      <div className="testing-header">
        <div className="flex justify-between items-center">
          <h1>Network Testing</h1>
          <div className="testing-controls">
            <button 
              className="btn btn-primary"
              onClick={runTest}
              disabled={isAutoTesting}
            >
              🚀 Run Test
            </button>
            {isAutoTesting && (
              <button 
                className="btn btn-danger"
                onClick={handleStopAutoTest}
              >
                ⏹️ Stop Auto Test
              </button>
            )}
            <button 
              className="btn btn-danger"
              onClick={handleClearLogs}
              disabled={tests.length === 0}
            >
              🗑️ Clear Tests
            </button>
          </div>
        </div>
      </div>

      <div className="testing-grid">
        <div className="flex flex-col gap-6">
          <div className="test-status">
            <h3>Current Status</h3>
            {tests.length === 0 ? (
              <div className="no-test">
                <p>No tests run yet</p>
                <p>Click "Run Test" to start</p>
              </div>
            ) : (
              <div className="test-details">
                <div className="speed-value">
                  {tests[tests.length - 1].speed.toFixed(2)} Mbps
                </div>
                <div className="test-time">
                  {new Date(tests[tests.length - 1].timestamp).toLocaleString()}
                </div>
                <div className="test-location">
                  📍 {tests[tests.length - 1].location.lat.toFixed(6)}, 
                  {tests[tests.length - 1].location.lng.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          <div className="test-history">
            <h3>Test History</h3>
            <div className="history-list">
              {tests.slice().reverse().map((test, index) => (
                <div key={index} className="test-item">
                  <div className="speed-value">
                    {test.speed.toFixed(2)} Mbps
                  </div>
                  <div className="test-details">
                    <div className="test-time">
                      {new Date(test.timestamp).toLocaleString()}
                    </div>
                    <div className="test-location">
                      📍 {test.location.lat.toFixed(6)}, {test.location.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              ))}
              {tests.length === 0 && (
                <div className="no-test">No test history available</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TestScheduler 
            onSchedule={handleScheduleTest}
            onAutoTest={handleAutoTest}
          />

          <div className="scheduled-tests">
            <h3>Scheduled Tests</h3>
            <div className="space-y-4">
              {scheduledTests.map(schedule => (
                <div key={schedule.id} className="test-item">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {schedule.type === 'once' 
                          ? `One-time: ${schedule.config.date} at ${schedule.config.time}`
                          : `Weekly on ${schedule.config.day} at ${schedule.config.time}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        Network: {schedule.networkCondition}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClearSchedule(schedule.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
              {scheduledTests.length === 0 && (
                <p className="text-gray-400">No scheduled tests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getSpeedQuality = (speed) => {
  const { speedThresholds } = useSettings();
  if (speed > speedThresholds.excellent) return '🟢 Excellent';
  if (speed > speedThresholds.good) return '🟡 Good';
  if (speed > speedThresholds.poor) return '🔴 Poor';
  return '⚫ Dead Zone';
};

const getDayNumber = (day) => {
  const days = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  return days[day.toLowerCase()];
};

const getDayDifference = (current, target) => {
  return (target + 7 - current) % 7;
};

export default Testing; 