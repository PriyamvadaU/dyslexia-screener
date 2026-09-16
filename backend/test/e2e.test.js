import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { authRouter } from '../src/routes/authRoutes.js';
import { childRouter } from '../src/routes/childRoutes.js';
import { sessionRouter } from '../src/routes/sessionRoutes.js';
import { configRouter } from '../src/routes/configRoutes.js';
import { mlRouter } from '../src/routes/mlRoutes.js';

// Setup test server instance
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/children', childRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/config', configRouter);
app.use('/api/ml', mlRouter);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('E2E Full Flow: Auth -> Consent -> Child -> Multimodal Test -> ML Inference -> Comparison -> Dashboard', async () => {
  const testEmail = `test_parent_${Date.now()}@example.com`;
  
  // 1. Register parent account
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sarah Connor (Parent)',
      email: testEmail,
      password: 'SecurePassword123!',
      role: 'parent'
    })
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  const token = regData.token;
  assert.ok(token);

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2. Reject child creation if consent is missing
  const rejectChildRes = await fetch(`${baseUrl}/children`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Tommy',
      age: 7,
      grade: '2',
      consentConfirmed: false
    })
  });
  assert.equal(rejectChildRes.status, 400);

  // 3. Create child with explicit parental consent
  const childRes = await fetch(`${baseUrl}/children`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Tommy',
      age: 7,
      grade: '2',
      notes: 'Occasional b/d letter reversals',
      consentConfirmed: true,
      signatureName: 'Sarah Connor'
    })
  });
  assert.equal(childRes.status, 201);
  const childData = await childRes.json();
  const childId = childData.child.id;
  assert.ok(childId);
  assert.equal(childData.child.consentConfirmed, true);

  // 4. Standalone Handwriting Analysis Endpoint Test
  const hwAnalyzeRes = await fetch(`${baseUrl}/sessions/handwriting/analyze`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      charTarget: 'b',
      strokes: [
        [{ x: 100, y: 50, t: 1000 }, { x: 100, y: 150, t: 1100 }],
        [{ x: 100, y: 120, t: 1200 }, { x: 130, y: 135, t: 1250 }, { x: 100, y: 150, t: 1300 }]
      ]
    })
  });
  assert.equal(hwAnalyzeRes.status, 200);
  const hwAnalyzeData = await hwAnalyzeRes.json();
  assert.equal(hwAnalyzeData.status, 'success');
  assert.ok(hwAnalyzeData.features.strokeConsistencyScore >= 70);

  // 5. Standalone Reading Speech Analysis Endpoint Test
  const readingAnalyzeRes = await fetch(`${baseUrl}/sessions/reading/analyze`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      transcript: "Sam and Ben built a tall wooden boat",
      targetPassage: "Sam and Ben built a tall wooden boat",
      durationSec: 10,
      pauseCount: 0,
      grade: '2'
    })
  });
  assert.equal(readingAnalyzeRes.status, 200);
  const readingAnalyzeData = await readingAnalyzeRes.json();
  assert.equal(readingAnalyzeData.status, 'success');
  assert.equal(readingAnalyzeData.features.decodingAccuracyPct, 100);

  // 6. Submit Full Multimodal Test Window Session (4 Pillars: Reversals + Speech + Flashcard + Handwriting)
  const testSubmitRes = await fetch(`${baseUrl}/sessions/test`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      childId,
      rawFeatures: {
        flashcardTotal: 8,
        flashcardCorrect: 7,
        reversalAttempts: 6,
        reversalErrors: 1,
        confusedPairs: [{ expected: 'b', actual: 'd', count: 1 }],
        readingDurationSec: 50,
        readingTotalWords: 55,
        readingCorrectWords: 50,
        pauseCount: 2,
        totalPauseDurationMs: 3200,
        averageHesitationMs: 1400,
        transcript: "Sam and Ben built a tall wooden boat...",
        targetPassage: "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides."
      },
      handwritingTelemetry: {
        charTarget: 'b',
        durationSec: 8,
        strokes: [
          [{ x: 100, y: 50, t: 1000 }, { x: 100, y: 150, t: 1100 }],
          [{ x: 100, y: 120, t: 1200 }, { x: 130, y: 135, t: 1250 }, { x: 100, y: 150, t: 1300 }]
        ]
      }
    })
  });
  assert.equal(testSubmitRes.status, 201);
  const testData = await testSubmitRes.json();
  assert.ok(testData.score);
  assert.ok(testData.score.compositeScore >= 0 && testData.score.compositeScore <= 100);
  assert.ok(['Low', 'Moderate', 'High'].includes(testData.score.category));
  assert.equal(testData.score.isMultimodal, true);
  
  // Verify Level 2 ML model output attached
  assert.ok(testData.score.mlModel);
  assert.equal(testData.score.mlModel.enabled, true);
  assert.ok(testData.score.mlModel.probabilities.low >= 0);
  assert.ok(testData.score.comparison.agreementStatus);

  const scoreId = testData.score.id;

  // 7. Fetch Individual Score Report
  const reportRes = await fetch(`${baseUrl}/sessions/score/${scoreId}`, {
    headers: authHeader
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.equal(reportData.score.id, scoreId);
  assert.equal(reportData.child.id, childId);

  // 8. Fetch Model Comparison Report View
  const compareRes = await fetch(`${baseUrl}/sessions/score/${scoreId}/compare`, {
    headers: authHeader
  });
  assert.equal(compareRes.status, 200);
  const compareData = await compareRes.json();
  assert.ok(compareData.comparison.level1);
  assert.ok(compareData.comparison.level2);
  assert.ok(compareData.comparison.featureImportances);

  // 9. Inspect ML Microservice Metadata & Direct Predict Endpoint
  const mlInfoRes = await fetch(`${baseUrl}/ml/model-info`);
  assert.equal(mlInfoRes.status, 200);
  const mlInfoData = await mlInfoRes.json();
  assert.equal(mlInfoData.model.version, '2.1.0');

  const mlPredictRes = await fetch(`${baseUrl}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      featureVector: {
        reversal_error_rate: 0.05,
        wpm_deficit_ratio: 0.0,
        decoding_accuracy_pct: 95.0,
        pause_count: 1,
        silence_ratio: 0.10,
        avg_hesitation_ms: 800,
        handwriting_jitter: 0.35,
        handwriting_pen_lifts: 1,
        handwriting_velocity_cv: 0.40,
        handwriting_consistency: 90
      },
      grade: '2'
    })
  });
  assert.equal(mlPredictRes.status, 200);
  const mlPredictData = await mlPredictRes.json();
  assert.equal(mlPredictData.prediction.predictedCategory, 'Low');

  // 10. Fetch Child Dashboard Summary (Longitudinal charts, ML trend, streak)
  const summaryRes = await fetch(`${baseUrl}/sessions/child/${childId}/summary`, {
    headers: authHeader
  });
  assert.equal(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  assert.equal(summaryData.totalAssessments, 1);
  assert.ok(summaryData.streakDays >= 1);
  assert.ok(summaryData.trendData.length === 1);
  assert.ok(summaryData.trendData[0].mlRiskScore !== undefined);
});
