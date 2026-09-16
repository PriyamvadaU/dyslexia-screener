import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHandwritingFeatures } from '../src/engine/handwritingFeatureExtractor.js';

test('Handwriting Feature Extractor - Smooth Stroke Pattern', () => {
  const baseTime = 1700000000000;
  // Simulated smooth vertical stroke followed by rightward loop for 'b'
  const strokes = [
    // Stem going down
    [
      { x: 100, y: 50, t: baseTime },
      { x: 100, y: 100, t: baseTime + 50 },
      { x: 100, y: 150, t: baseTime + 100 },
      { x: 100, y: 200, t: baseTime + 150 }
    ],
    // Loop on right
    [
      { x: 100, y: 150, t: baseTime + 250 },
      { x: 140, y: 150, t: baseTime + 300 },
      { x: 160, y: 175, t: baseTime + 350 },
      { x: 140, y: 200, t: baseTime + 400 },
      { x: 100, y: 200, t: baseTime + 450 }
    ]
  ];

  const features = extractHandwritingFeatures(strokes, 'b');

  assert.equal(features.charTarget, 'b');
  assert.ok(features.pointCount >= 8);
  assert.equal(features.penLifts, 1);
  assert.ok(features.totalDurationSec > 0);
  assert.ok(features.avgVelocityPxPerSec > 0);
  assert.ok(features.strokeConsistencyScore >= 70, `Consistency should be high: ${features.strokeConsistencyScore}`);
  assert.ok(features.handwritingRiskScore < 40, `Risk should be low for smooth strokes: ${features.handwritingRiskScore}`);
  assert.equal(features.spatial.isSuspectedReversal, false);
});

test('Handwriting Feature Extractor - Jittery & Reversal Pattern', () => {
  const baseTime = 1700000000000;
  // Jittery points and stroke concentrated on left side when target is 'b' (indicates 'd' reversal)
  const strokes = [
    [
      { x: 150, y: 50, t: baseTime },
      { x: 148, y: 80, t: baseTime + 100 },
      { x: 152, y: 110, t: baseTime + 200 },
      { x: 149, y: 150, t: baseTime + 350 },
      { x: 151, y: 200, t: baseTime + 500 }
    ],
    // Loop drawn on left side (mirror of 'd')
    [
      { x: 150, y: 150, t: baseTime + 900 },
      { x: 110, y: 150, t: baseTime + 1100 },
      { x: 90, y: 175, t: baseTime + 1400 },
      { x: 110, y: 200, t: baseTime + 1700 },
      { x: 150, y: 200, t: baseTime + 2000 }
    ]
  ];

  const features = extractHandwritingFeatures(strokes, 'b');

  assert.equal(features.charTarget, 'b');
  assert.ok(features.spatial.isSuspectedReversal === true, 'Should detect left-hand loop reversal for target b');
  assert.ok(features.directionalJitterIndex > 0);
  assert.ok(features.handwritingRiskScore >= 40, `Risk should be elevated for erratic/reversal pattern: ${features.handwritingRiskScore}`);
});

test('Handwriting Feature Extractor - Empty & Edge Cases', () => {
  const emptyFeatures = extractHandwritingFeatures([], 'b');
  assert.equal(emptyFeatures.pointCount, 0);
  assert.equal(emptyFeatures.handwritingRiskScore, 0);
  assert.equal(emptyFeatures.strokeConsistencyScore, 100);

  const singlePointFeatures = extractHandwritingFeatures([{ x: 50, y: 50, t: 100 }], 'p');
  assert.equal(singlePointFeatures.pointCount, 0);
});
