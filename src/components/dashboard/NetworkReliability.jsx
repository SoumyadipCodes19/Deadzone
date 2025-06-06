import React, { useMemo } from 'react';

const NetworkReliability = ({ tests, speedThresholds }) => {
  const reliabilityScore = useMemo(() => {
    if (tests.length === 0) return { score: 0, factors: [] };

    const factors = [];
    let totalScore = 0;

    // 1. Speed Consistency (40%)
    const speeds = tests.map(t => t.speed);
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const stdDev = Math.sqrt(
      speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length
    );
    const consistencyScore = Math.max(0, Math.min(40, 40 * (1 - stdDev / avgSpeed)));
    factors.push({
      name: 'Speed Consistency',
      score: consistencyScore,
      maxScore: 40,
      details: `${consistencyScore.toFixed(1)}/40`
    });
    totalScore += consistencyScore;

    // 2. Zone Distribution (30%)
    const zoneDistribution = tests.reduce((acc, test) => {
      if (test.speed > speedThresholds.excellent) acc.excellent++;
      else if (test.speed > speedThresholds.good) acc.good++;
      else if (test.speed > speedThresholds.poor) acc.poor++;
      else acc.dead++;
      return acc;
    }, { excellent: 0, good: 0, poor: 0, dead: 0 });

    const zoneScore = (
      (zoneDistribution.excellent * 30 + zoneDistribution.good * 20) /
      (tests.length * 30)
    ) * 30;
    factors.push({
      name: 'Zone Quality',
      score: zoneScore,
      maxScore: 30,
      details: `${zoneScore.toFixed(1)}/30`
    });
    totalScore += zoneScore;

    // 3. Test Frequency (20%)
    const timeSpan = new Date(tests[tests.length - 1].timestamp) - new Date(tests[0].timestamp);
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const testsPerDay = tests.length / Math.max(1, daysSpan);
    const frequencyScore = Math.min(20, testsPerDay * 2);
    factors.push({
      name: 'Test Coverage',
      score: frequencyScore,
      maxScore: 20,
      details: `${frequencyScore.toFixed(1)}/20`
    });
    totalScore += frequencyScore;

    // 4. Recent Performance (10%)
    const recentTests = tests.slice(-10);
    const recentAvg = recentTests.reduce((sum, test) => sum + test.speed, 0) / recentTests.length;
    const recentScore = Math.min(10, (recentAvg / speedThresholds.excellent) * 10);
    factors.push({
      name: 'Recent Performance',
      score: recentScore,
      maxScore: 10,
      details: `${recentScore.toFixed(1)}/10`
    });
    totalScore += recentScore;

    return {
      score: Math.round(totalScore),
      factors
    };
  }, [tests, speedThresholds]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--primary-color)';
    if (score >= 40) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  return (
    <div className="network-reliability">
      <div className="reliability-score">
        <div 
          className="score-circle"
          style={{ 
            '--score-color': getScoreColor(reliabilityScore.score),
            '--score-percent': `${reliabilityScore.score}%`
          }}
        >
          <div className="score-value">{reliabilityScore.score}</div>
          <div className="score-label">Reliability Score</div>
        </div>
      </div>

      <div className="reliability-factors">
        {reliabilityScore.factors.map((factor, index) => (
          <div key={index} className="factor">
            <div className="factor-header">
              <span className="factor-name">{factor.name}</span>
              <span className="factor-score">{factor.details}</span>
            </div>
            <div className="factor-bar">
              <div 
                className="factor-progress"
                style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkReliability; 