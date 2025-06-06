import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTest } from './TestContext';
import { useSettings } from './SettingsContext';

export const CoverageContext = createContext();

export const CoverageProvider = ({ children }) => {
  const [coveragePoints, setCoveragePoints] = useState([]);
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState({
    excellentSignal: 0,
    goodSignal: 0,
    poorSignal: 0,
    deadZones: 0
  });

  const { tests } = useTest();
  const { speedThresholds } = useSettings();

  const calculateStatistics = (points) => {
    return points.reduce((stats, point) => {
      if (point.speed > speedThresholds.excellent) stats.excellentSignal++;
      else if (point.speed > speedThresholds.good) stats.goodSignal++;
      else if (point.speed > speedThresholds.poor) stats.poorSignal++;
      else stats.deadZones++;
      return stats;
    }, {
      excellentSignal: 0,
      goodSignal: 0,
      poorSignal: 0,
      deadZones: 0
    });
  };

  const generateAnalysisReport = () => {
    if (!tests || tests.length === 0) {
      return {
        type: 'analysis',
        peakHours: [],
        worstHours: [],
        overallTrend: 'no_data',
        recommendations: ['Start by running network tests to gather performance data']
      };
    }

    // Group tests by hour and calculate detailed metrics
    const hourlyData = tests.reduce((acc, test) => {
      const hour = new Date(test.timestamp).getHours();
      const minute = new Date(test.timestamp).getMinutes();
      const timeKey = `${hour}:${Math.floor(minute/15)*15}`;  // Group by 15-minute intervals
      
      if (!acc[timeKey]) {
        acc[timeKey] = {
          hour,
          minute: Math.floor(minute/15)*15,
          tests: [],
          totalSpeed: 0,
          minSpeed: Infinity,
          maxSpeed: -Infinity,
          speeds: []
        };
      }
      acc[timeKey].tests.push(test);
      acc[timeKey].totalSpeed += test.speed;
      acc[timeKey].minSpeed = Math.min(acc[timeKey].minSpeed, test.speed);
      acc[timeKey].maxSpeed = Math.max(acc[timeKey].maxSpeed, test.speed);
      acc[timeKey].speeds.push(test.speed);
      return acc;
    }, {});

    // Calculate comprehensive metrics for each time period
    const timeMetrics = Object.entries(hourlyData).map(([timeKey, data]) => {
      const avgSpeed = data.totalSpeed / data.tests.length;
      const variability = Math.sqrt(
        data.speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / data.speeds.length
      );
      const consistencyScore = Math.max(0, 100 - (variability / avgSpeed * 100));

      return {
        hour: data.hour,
        minute: data.minute,
        timeKey,
        averageSpeed: avgSpeed,
        minSpeed: data.minSpeed,
        maxSpeed: data.maxSpeed,
        variability,
        consistencyScore,
        testCount: data.tests.length,
        speedRange: data.maxSpeed - data.minSpeed,
        qualityScore: avgSpeed * (consistencyScore/100)  // Combined score considering both speed and consistency
      };
    });

    // Sort periods by different criteria
    const byQualityScore = [...timeMetrics].sort((a, b) => b.qualityScore - a.qualityScore);
    const byVariability = [...timeMetrics].sort((a, b) => b.variability - a.variability);

    // Select peak and worst periods with adjusted criteria
    const peakPeriods = byQualityScore
      .filter(period => period.averageSpeed > 40)  // Reasonable minimum speed threshold
      .slice(0, 3);

    const worstPeriods = byQualityScore
      .reverse()
      .filter(period => period.testCount >= 2)  // Minimum 2 tests for validity
      .slice(0, 3);

    // Calculate overall trend
    const sortedTests = [...tests].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const midpoint = Math.floor(sortedTests.length / 2);
    const oldTests = sortedTests.slice(0, midpoint);
    const newTests = sortedTests.slice(midpoint);

    const oldAvg = oldTests.reduce((sum, t) => sum + t.speed, 0) / oldTests.length;
    const newAvg = newTests.reduce((sum, t) => sum + t.speed, 0) / newTests.length;
    const percentChange = ((newAvg - oldAvg) / oldAvg) * 100;

    let trend;
    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (percentChange > 5) {
      trend = 'improving';
    } else {
      trend = 'degrading';
    }

    // Generate comprehensive recommendations
    const recommendations = [];
    
    // Speed-based recommendations
    if (worstPeriods.length > 0) {
      const worstPeriod = worstPeriods[0];
      recommendations.push(
        `Optimize network during low-performance period (${worstPeriod.hour}:${String(worstPeriod.minute).padStart(2, '0')}) - ` +
        `Average speed: ${worstPeriod.averageSpeed.toFixed(1)} Mbps, Range: ${worstPeriod.minSpeed.toFixed(1)}-${worstPeriod.maxSpeed.toFixed(1)} Mbps`
      );
    }

    // Consistency-based recommendations
    const highVariabilityPeriods = timeMetrics
      .filter(p => p.consistencyScore < 60 && p.testCount >= 2)
      .sort((a, b) => b.variability - a.variability);

    if (highVariabilityPeriods.length > 0) {
      const variabilityTimes = highVariabilityPeriods
        .map(p => `${p.hour}:${String(p.minute).padStart(2, '0')}`)
        .join(', ');
      
      recommendations.push(
        `High speed variability detected at: ${variabilityTimes} - ` +
        `Consider investigating interference sources`
      );
    }

    // Coverage-based recommendations
    if (statistics.deadZones > 0) {
      const deadZoneText = statistics.deadZones === 1 ? 'dead zone' : 'dead zones';
      recommendations.push(
        `Address ${statistics.deadZones} ${deadZoneText} to improve overall network coverage - ` +
        'Consider adding network extenders or access points'
      );
    }

    // Performance threshold recommendations
    const lowSpeedTests = tests.filter(t => t.speed < 30).length;
    const lowSpeedPercentage = (lowSpeedTests / tests.length) * 100;
    if (lowSpeedPercentage > 20) {
      recommendations.push(
        `${lowSpeedPercentage.toFixed(1)}% of tests show speeds below 30 Mbps - ` +
        'Consider upgrading network infrastructure or bandwidth plan'
      );
    }

    return {
      type: 'analysis',
      peakHours: peakPeriods.map(p => ({
        hour: p.hour,
        minute: p.minute,
        averageSpeed: p.averageSpeed,
        variability: p.variability,
        consistencyScore: p.consistencyScore,
        speedRange: p.speedRange,
        minSpeed: p.minSpeed,
        maxSpeed: p.maxSpeed
      })),
      worstHours: worstPeriods.map(p => ({
        hour: p.hour,
        minute: p.minute,
        averageSpeed: p.averageSpeed,
        variability: p.variability,
        consistencyScore: p.consistencyScore,
        speedRange: p.speedRange,
        minSpeed: p.minSpeed,
        maxSpeed: p.maxSpeed
      })),
      overallTrend: trend,
      trendDetails: {
        percentChange: Math.round(percentChange * 10) / 10,
        oldAverage: Math.round(oldAvg * 10) / 10,
        newAverage: Math.round(newAvg * 10) / 10
      },
      recommendations: recommendations.length > 0 ? recommendations : ['Network performance is optimal, continue monitoring for changes']
    };
  };

  const generatePerformanceReport = () => {
    const speeds = tests.map(t => t.speed);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);
    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // Calculate reliability (% of tests above 20 Mbps)
    const reliability = (speeds.filter(speed => speed > 20).length / speeds.length) * 100;

    // Calculate consistency (inverse of coefficient of variation)
    const stdDev = Math.sqrt(
      speeds.reduce((sum, speed) => sum + Math.pow(speed - averageSpeed, 2), 0) / speeds.length
    );
    const consistency = 100 - ((stdDev / averageSpeed) * 100);

    // Generate time-based analysis
    const timeBasedAnalysis = Array.from({ length: 24 }, (_, hour) => {
      const hourTests = tests.filter(t => new Date(t.timestamp).getHours() === hour);
      const hourlyAvg = hourTests.length > 0
        ? hourTests.reduce((sum, t) => sum + t.speed, 0) / hourTests.length
        : 0;
      return {
        hour,
        averageSpeed: hourlyAvg
      };
    });

    return {
      type: 'performance',
      metrics: {
        averageSpeed,
        maxSpeed,
        minSpeed,
        reliability,
        consistency
      },
      timeBasedAnalysis
    };
  };

  const generateOptimizationReport = () => {
    // Early return with default values if no coverage points
    if (!coveragePoints || coveragePoints.length === 0) {
      return {
        type: 'optimization',
        coverage: {
          total: 0,
          dead: 0,
          weak: 0,
          improvement: 0
        },
        problemAreas: [],
        recommendations: [{
          location: 'No Data',
          recommendation: 'Start by running network tests to gather coverage data',
          affectedTests: 0,
          currentSpeed: 0
        }]
      };
    }

    // Group coverage points by location and calculate average speeds
    const locationClusters = coveragePoints.reduce((clusters, point) => {
      const key = `${Math.floor(point.lat)}${Math.floor(point.lng)}`;
      if (!clusters[key]) {
        clusters[key] = {
          points: [],
          location: `Area ${Object.keys(clusters).length + 1}`,
          totalStrength: 0,
          lat: point.lat,
          lng: point.lng,
          speeds: []
        };
      }
      clusters[key].points.push(point);
      clusters[key].totalStrength += point.strength;
      clusters[key].speeds.push(point.strength);
      return clusters;
    }, {});

    // Calculate speed statistics for each location
    const locationStats = Object.values(locationClusters).map(cluster => {
      const speeds = cluster.speeds;
      const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      const stdDev = Math.sqrt(
        speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length
      );
      
      return {
        location: cluster.location,
        coordinates: `${cluster.lat.toFixed(6)}, ${cluster.lng.toFixed(6)}`,
        currentSpeed: avgSpeed,
        variability: stdDev,
        size: cluster.points.length,
        priority: (100 - avgSpeed) * Math.log(cluster.points.length + 1) * (1 + stdDev/50)
      };
    });

    // Identify problem areas with more sophisticated criteria
    const problemAreas = locationStats
      .filter(area => {
        const isLowSpeed = area.currentSpeed < 50;
        const isHighVariability = area.variability > 20;
        const hasMultipleTests = area.size >= 2;
        return (isLowSpeed || isHighVariability) && hasMultipleTests;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    // Generate specific recommendations based on patterns
    const recommendations = problemAreas.map(area => {
      let recommendation;
      if (area.currentSpeed < 20) {
        recommendation = 'Install additional access point - Critical signal weakness detected';
      } else if (area.currentSpeed < 35) {
        recommendation = 'Upgrade existing access point - Consistent low performance observed';
      } else if (area.variability > 20) {
        recommendation = 'Investigate signal interference - High speed variability detected';
      } else {
        recommendation = 'Optimize channel allocation and positioning';
      }

      return {
        location: `${area.location} (${area.coordinates})`,
        recommendation,
        affectedTests: area.size,
        currentSpeed: Math.round(area.currentSpeed * 10) / 10,
        variability: Math.round(area.variability * 10) / 10
      };
    });

    const total = coveragePoints.length;
    const dead = statistics.deadZones || 0;
    const weak = statistics.poorSignal || 0;
    const improvement = total > 0 ? ((total - (dead + weak)) / total) * 100 : 0;

    // If no specific problems found but have data, provide general insights
    if (recommendations.length === 0 && total > 0) {
      const avgSpeed = locationStats.reduce((sum, stat) => sum + stat.currentSpeed, 0) / locationStats.length;
      const avgVariability = locationStats.reduce((sum, stat) => sum + stat.variability, 0) / locationStats.length;
      
      recommendations.push({
        location: 'Network Overview',
        recommendation: avgSpeed > 70 
          ? 'Network performance is excellent. Continue monitoring for changes.'
          : 'Consider general network upgrade to improve overall performance.',
        affectedTests: total,
        currentSpeed: Math.round(avgSpeed * 10) / 10,
        variability: Math.round(avgVariability * 10) / 10
      });
    }

    return {
      type: 'optimization',
      coverage: {
        total,
        dead,
        weak,
        improvement: Math.round(improvement * 10) / 10
      },
      problemAreas,
      recommendations
    };
  };

  const generateReport = async (type) => {
    let reportData;

    switch (type.toLowerCase()) {
      case 'analysis':
        reportData = {
          ...generateAnalysisReport(),
          timestamp: Date.now()
        };
        break;
      case 'performance':
        reportData = {
          ...generatePerformanceReport(),
          timestamp: Date.now()
        };
        break;
      case 'optimization':
        reportData = {
          ...generateOptimizationReport(),
          timestamp: Date.now()
        };
        break;
      default: // coverage
        reportData = {
          type: 'coverage',
          coverage: coveragePoints,
          statistics,
          timestamp: Date.now()
        };
    }

    const newReport = {
      id: Date.now(),
      title: `${type} Report - ${new Date().toLocaleDateString()}`,
      type: type.toLowerCase(),
      date: new Date().toISOString(),
      status: 'completed',
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      data: reportData
    };

    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    localStorage.setItem('deadzone_reports', JSON.stringify(updatedReports));
    return newReport;
  };

  useEffect(() => {
    const savedReports = localStorage.getItem('deadzone_reports');
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, []);

  useEffect(() => {
    if (coveragePoints.length > 0) {
      const newStats = calculateStatistics(coveragePoints);
      setStatistics(newStats);
    }
  }, [coveragePoints]);

  // Add effect to convert tests to coverage points
  useEffect(() => {
    if (tests && tests.length > 0) {
      const newCoveragePoints = tests.map(test => ({
        lat: test.location?.lat || 0,
        lng: test.location?.lng || 0,
        strength: calculateStrength(test.speed),
        speed: test.speed,
        timestamp: test.timestamp,
        type: getPointType(test.speed)
      }));
      setCoveragePoints(newCoveragePoints);
    } else {
      // Clear coverage points when there are no tests
      setCoveragePoints([]);
    }
  }, [tests, speedThresholds]);

  // Add effect to listen for tests cleared event
  useEffect(() => {
    const handleTestsCleared = () => {
      setCoveragePoints([]);
      setStatistics({
        excellentSignal: 0,
        goodSignal: 0,
        poorSignal: 0,
        deadZones: 0
      });
    };

    window.addEventListener('testsCleared', handleTestsCleared);
    return () => window.removeEventListener('testsCleared', handleTestsCleared);
  }, []);

  // Helper function to calculate strength percentage from speed
  const calculateStrength = (speed) => {
    if (speed >= 100) return 100;
    if (speed <= 0) return 0;
    return Math.min(100, (speed / 100) * 100);
  };

  // Helper function to determine point type based on speed
  const getPointType = (speed) => {
    if (speed > speedThresholds.excellent) return 'excellent';
    if (speed > speedThresholds.good) return 'good';
    if (speed > speedThresholds.poor) return 'poor';
    return 'dead';
  };

  const deleteReport = (id) => {
    const updatedReports = reports.filter(r => r.id !== id);
    setReports(updatedReports);
    localStorage.setItem('deadzone_reports', JSON.stringify(updatedReports));
  };

  const clearAllReports = () => {
    setReports([]);
    localStorage.setItem('deadzone_reports', JSON.stringify([]));
  };

  return (
    <CoverageContext.Provider value={{
      coveragePoints,
      setCoveragePoints,
      statistics,
      reports,
      generateReport,
      deleteReport,
      clearAllReports
    }}>
      {children}
    </CoverageContext.Provider>
  );
};

export const useCoverage = () => {
  const context = useContext(CoverageContext);
  if (!context) {
    throw new Error('useCoverage must be used within a CoverageProvider');
  }
  return context;
}; 