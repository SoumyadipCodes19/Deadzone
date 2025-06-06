import React, { useState, useContext, useEffect } from 'react';
import TestContext from '../context/TestContext';
import '../styles/TestScheduler.css';

const TestScheduler = ({ onSchedule, onAutoTest }) => {
  const { isAutoTesting, nextTestTime } = useContext(TestContext);
  const [scheduleType, setScheduleType] = useState('once');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [recurringDay, setRecurringDay] = useState('monday');
  const [recurringTime, setRecurringTime] = useState('');
  const [autoTestInterval, setAutoTestInterval] = useState(5);
  const [networkCondition, setNetworkCondition] = useState('any');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    let timer;
    if (isAutoTesting && nextTestTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = nextTestTime - now;
        
        if (timeLeft <= 0) {
          setCountdown('Running test...');
        } else {
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      setCountdown('');
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoTesting, nextTestTime]);

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const schedule = {
      type: scheduleType,
      networkCondition,
      config: scheduleType === 'once' 
        ? { date: scheduleDate, time: scheduleTime }
        : { day: recurringDay, time: recurringTime }
    };
    onSchedule(schedule);
  };

  const handleAutoTestSubmit = (e) => {
    e.preventDefault();
    onAutoTest(autoTestInterval * 60 * 1000); // Convert minutes to milliseconds
  };

  return (
    <div className="test-scheduler">
      <div className="scheduler-section">
        <h3>Schedule Tests</h3>
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div className="form-group">
            <label>Schedule Type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full"
            >
              <option value="once">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {scheduleType === 'once' ? (
            <>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                  required
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Day of Week</label>
                <select
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                  className="w-full"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={recurringTime}
                  onChange={(e) => setRecurringTime(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Network Condition</label>
            <select
              value={networkCondition}
              onChange={(e) => setNetworkCondition(e.target.value)}
              className="w-full"
            >
              <option value="any">Any Network</option>
              <option value="wifi">WiFi Only</option>
              <option value="ethernet">Ethernet Only</option>
              <option value="cellular">Cellular Only</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
          >
            <span>📅</span>
            <span>Schedule Test</span>
          </button>
        </form>
      </div>

      <div className="scheduler-section">
        <h3>Auto Test Settings</h3>
        <form onSubmit={handleAutoTestSubmit} className="space-y-4">
          <div className="form-group">
            <label>Test Interval (minutes)</label>
            <input
              type="number"
              value={autoTestInterval}
              onChange={(e) => setAutoTestInterval(Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="w-full"
              required
            />
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAutoTesting}
            >
              <span>{isAutoTesting ? '🔄' : '🤖'}</span>
              <span>{isAutoTesting ? 'Auto Testing...' : 'Start Auto Testing'}</span>
            </button>
            {isAutoTesting && (
              <div className="countdown-container">
                <div className={`countdown-text ${countdown === 'Running test...' ? 'running' : ''}`}>
                  {countdown === 'Running test...' ? (
                    <>
                      <span className="countdown-icon">🔄</span>
                      <span>Running test...</span>
                    </>
                  ) : (
                    <>
                      <span>⏱️</span>
                      <span>Next test in {countdown}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestScheduler; 