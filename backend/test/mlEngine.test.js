import test from 'node:test';
import assert from 'node:assert/strict';
import { predictLevel2Risk, compareLevel1AndLevel2, mlModelMetadata } from '../src/engine/mlEngine.js';

test('Level 2 ML Engine - Metadata & Features', () => {
  assert.equal(mlModelMetadata.status, 'active');
  assert.equal(mlModelMetadata.version, '2.1.0');
  assert.ok(mlModelMetadata.features.includes('reversal_error_rate'));
  assert.ok(mlModelMetadata.features.includes('handwriting_jitter'));
  assert.ok(mlModelMetadata.evaluationMetrics.accuracy > 0.90);
});

test('Level 2 ML Engine - Low Risk Prediction', () => {
  const lowRiskVector = {
    reversalErrorRate: 0.0,
    wpmDeficitRatio: -0.1,
    calculatedWpm: 90,
    decodingAccuracyPct: 98,
    pauseCount: 0,
    silenceRatio: 0.05,
    averageHesitationMs: 600,
    handwritingJitter: 0.30,
    handwritingPenLifts: 1,
    handwritingVelocityCV: 0.35,
    handwritingConsistency: 92
  };

  const prediction = predictLevel2Risk(lowRiskVector, '2');

  assert.equal(prediction.enabled, true);
  assert.equal(prediction.predictedCategory, 'Low');
  assert.ok(prediction.probabilities.low > 0.50);
  assert.ok(prediction.mlRiskScore < 35.0);
  assert.ok(prediction.confidencePct >= 50);
});

test('Level 2 ML Engine - High Risk Prediction', () => {
  const highRiskVector = {
    reversalErrorRate: 0.75,
    wpmDeficitRatio: 0.70,
    calculatedWpm: 20,
    decodingAccuracyPct: 55,
    pauseCount: 8,
    silenceRatio: 0.55,
    averageHesitationMs: 3400,
    handwritingJitter: 1.35,
    handwritingPenLifts: 6,
    handwritingVelocityCV: 1.25,
    handwritingConsistency: 35
  };

  const prediction = predictLevel2Risk(highRiskVector, '2');

  assert.equal(prediction.predictedCategory, 'High');
  assert.ok(prediction.probabilities.high > 0.50);
  assert.ok(prediction.mlRiskScore >= 65.0);
  assert.ok(prediction.topFrictionDrivers.length > 0);
});

test('Level 2 ML Engine - Level 1 vs Level 2 Comparison', () => {
  const l1 = { compositeScore: 28.5, category: 'Low' };
  const l2 = { mlRiskScore: 25.0, predictedCategory: 'Low', confidencePct: 88, probabilities: { low: 0.88, moderate: 0.10, high: 0.02 } };

  const comp = compareLevel1AndLevel2(l1, l2);

  assert.equal(comp.agreementStatus, 'full_agreement');
  assert.ok(comp.agreementSummary.includes('Low Risk'));
  assert.equal(comp.absDelta, 3.5);
});
