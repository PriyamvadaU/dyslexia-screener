import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMultimodalScore } from '../src/engine/multimodalFusion.js';

test('Multimodal Fusion - 4-Pillar Combined Assessment (Low Risk)', () => {
  const multimodalPayload = {
    // Reversals
    flashcardTotal: 8,
    flashcardCorrect: 8,
    reversalAttempts: 6,
    reversalErrors: 0,
    confusedPairs: [],
    // Reading
    transcript: "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides.",
    targetPassage: "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides.",
    readingDurationSec: 30, // ~80 WPM
    pauseCount: 1,
    totalPauseDurationMs: 800,
    averageHesitationMs: 600,
    // Handwriting
    handwritingStrokes: [
      [
        { x: 100, y: 50, t: 1000 },
        { x: 100, y: 100, t: 1050 },
        { x: 100, y: 150, t: 1100 }
      ],
      [
        { x: 100, y: 120, t: 1200 },
        { x: 130, y: 135, t: 1250 },
        { x: 100, y: 150, t: 1300 }
      ]
    ],
    writingTarget: 'b',
    writingDurationSec: 4
  };

  const result = computeMultimodalScore(multimodalPayload, '2');

  assert.equal(result.category, 'Low');
  assert.equal(result.isMultimodal, true);
  assert.ok(result.modalitiesIncluded.includes('handwritingKinematics'));
  assert.ok(result.compositeScore < 35);
  assert.ok(result.metrics.handwriting.strokeConsistencyScore >= 70);
  assert.ok(result.explanation.strengths.length > 0);
});

test('Multimodal Fusion - Dynamic Weight Normalization (Without Handwriting)', () => {
  const speechOnlyPayload = {
    flashcardTotal: 8,
    flashcardCorrect: 8,
    reversalAttempts: 6,
    reversalErrors: 0,
    readingDurationSec: 40,
    readingTotalWords: 55,
    readingCorrectWords: 55,
    pauseCount: 0
  };

  const result = computeMultimodalScore(speechOnlyPayload, '2');

  assert.equal(result.category, 'Low');
  assert.equal(result.isMultimodal, false);
  // Weights must sum to 1.0
  const weightSum = Object.values(result.weightsApplied).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(weightSum - 1.0) < 0.001, `Weights must sum to 1.0: got ${weightSum}`);
});
