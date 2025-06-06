import React, { useState, useEffect } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const TestSchedule = ({ scheduledTests }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  }, [currentMonth]);

  const getTestsForDay = (day) => {
    return scheduledTests.filter(test => 
      isSameDay(new Date(test.config.date), day)
    );
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <div className="test-schedule">
      <div className="calendar-header">
        <button onClick={previousMonth} className="btn btn-icon">←</button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={nextMonth} className="btn btn-icon">→</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const testsForDay = getTestsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${
                  isSameDay(day, new Date()) ? 'today' : ''
                }`}
                style={{ gridColumnStart: index === 0 ? day.getDay() + 1 : 'auto' }}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {testsForDay.length > 0 && (
                  <div className="day-tests">
                    {testsForDay.map((test, i) => (
                      <div key={i} className="test-indicator">
                        {format(new Date(`${test.config.date} ${test.config.time}`), 'HH:mm')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestSchedule; 