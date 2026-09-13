import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLevel1Score } from '../src/engine/scoringEngine.js';
import { scoringConfig } from '../src/config/scoringConfig.js';

test('Level 1 Scoring Engine - Low Risk Profile', () => {
  const lowRiskFeatures = {
    flashcardTotal: 10,
    flashcardCorrect: 10,
    reversalAttempts: 6,
    reversalErrors: 0,
    confusedPairs: [],
    readingDurationSec: 45,
    readingTotalWords: 65,
    readingCorrectWords: 64, // ~85 WPM for Grade 2 (target is 85)
    pauseCount: 1,
    totalPauseDurationMs: 1200,
    averageHesitationMs: 800
  };

  const result = computeLevel1Score(lowRiskFeatures, '2');

  assert.equal(result.category, 'Low');
  assert.ok(result.compositeScore < scoringConfig.thresholds.lowRiskMax);
  assert.ok(result.disclaimer.includes('not a medical diagnosis'));
  assert.ok(result.explanation.strengths.length > 0);
});

test('Level 1 Scoring Engine - Moderate Risk Profile', () => {
  const moderateRiskFeatures = {
    flashcardTotal: 10,
    flashcardCorrect: 8,
    reversalAttempts: 6,
    reversalErrors: 2, // b/d confusion
    confusedPairs: [{ expected: 'b', actual: 'd', count: 2 }],
    readingDurationSec: 60,
    readingTotalWords: 60,
    readingCorrectWords: 48, // ~48 WPM for Grade 2 (below 60 min)
    pauseCount: 4,
    totalPauseDurationMs: 6500,
    averageHesitationMs: 1900
  };

  const result = computeLevel1Score(moderateRiskFeatures, '2');

  assert.equal(result.category, 'Moderate');
  assert.ok(result.compositeScore >= scoringConfig.thresholds.lowRiskMax);
  assert.ok(result.compositeScore < scoringConfig.thresholds.moderateRiskMax);
  assert.ok(result.riskBreakdown.reversalRisk > 0);
  assert.ok(result.explanation.focusAreas.length > 0);
});

test('Level 1 Scoring Engine - High Risk Profile', () => {
  const highRiskFeatures = {
    flashcardTotal: 10,
    flashcardCorrect: 4,
    reversalAttempts: 6,
    reversalErrors: 5, // heavy reversal errors
    confusedPairs: [
      { expected: 'b', actual: 'd', count: 3 },
      { expected: 'p', actual: 'q', count: 2 }
    ],
    readingDurationSec: 80,
    readingTotalWords: 50,
    readingCorrectWords: 25, // ~19 WPM, 50% accuracy
    pauseCount: 9,
    totalPauseDurationMs: 18000,
    averageHesitationMs: 3200
  };

  const result = computeLevel1Score(highRiskFeatures, '2');

  assert.equal(result.category, 'High');
  assert.ok(result.compositeScore >= scoringConfig.thresholds.moderateRiskMax);
  assert.ok(result.riskBreakdown.reversalRisk >= 80);
  assert.ok(result.explanation.recommendations.some(r => r.includes('specialist') || r.includes('diagnostic')));
});
