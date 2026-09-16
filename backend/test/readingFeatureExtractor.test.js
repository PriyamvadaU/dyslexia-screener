import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReadingFeatures } from '../src/engine/readingFeatureExtractor.js';

test('Reading Feature Extractor - Fluent Reading Profile', () => {
  const targetPassage = "The friendly brown puppy saw a little bird in the park.";
  const transcript = "The friendly brown puppy saw a little bird in the park";

  const result = extractReadingFeatures({
    transcript,
    targetPassage,
    durationSec: 8, // ~82 WPM
    pauseCount: 0,
    totalPauseDurationMs: 300,
    averageHesitationMs: 300,
    grade: '1' // Grade 1 target is 55 WPM
  });

  assert.equal(result.fluencyStatus, 'fluent');
  assert.ok(result.calculatedWpm >= 55);
  assert.equal(result.decodingAccuracyPct, 100);
  assert.equal(result.errorCounts.substitutions, 0);
  assert.equal(result.errorCounts.omissions, 0);
  assert.ok(result.readingRiskScore < 20);
});

test('Reading Feature Extractor - Hesitation & Substitution Profile', () => {
  const targetPassage = "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides.";
  const transcript = "Sam and Ben built a big wood dog. They painted bright stripes along the sides.";

  const result = extractReadingFeatures({
    transcript,
    targetPassage,
    durationSec: 45, // Slow reading: ~17 WPM vs Grade 2 target 85
    pauseCount: 5,
    totalPauseDurationMs: 12000,
    averageHesitationMs: 2400,
    grade: '2'
  });

  assert.equal(result.fluencyStatus, 'below_minimum');
  assert.ok(result.calculatedWpm < 60);
  assert.ok(result.decodingAccuracyPct < 90);
  assert.ok(result.errorCounts.substitutions > 0 || result.errorCounts.omissions > 0);
  assert.ok(result.pauses.silenceRatio > 0.2);
  assert.ok(result.readingRiskScore >= 50, `Reading risk should be high: ${result.readingRiskScore}`);
});
