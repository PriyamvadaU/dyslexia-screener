import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { authRouter } from '../src/routes/authRoutes.js';
import { childRouter } from '../src/routes/childRoutes.js';
import { sessionRouter } from '../src/routes/sessionRoutes.js';
import { configRouter } from '../src/routes/configRoutes.js';

// Setup test server instance
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/children', childRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/config', configRouter);

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

test('E2E Full Flow: Auth -> Consent -> Child -> Learn -> Test -> Scoring -> Dashboard', async () => {
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

  // 4. Save Learn Window session (Practice mode: Zero score)
  const learnRes = await fetch(`${baseUrl}/sessions/learn`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      childId,
      durationSec: 120,
      cardsViewed: 6,
      readAlongCompleted: true
    })
  });
  assert.equal(learnRes.status, 201);

  // 5. Submit Test Window session (Assessment mode: Timed & Scored)
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
        transcript: "Sam and Ben built a tall wooden boat..."
      }
    })
  });
  assert.equal(testSubmitRes.status, 201);
  const testData = await testSubmitRes.json();
  assert.ok(testData.score);
  assert.ok(testData.score.compositeScore >= 0 && testData.score.compositeScore <= 100);
  assert.ok(['Low', 'Moderate', 'High'].includes(testData.score.category));
  assert.ok(testData.score.disclaimer.includes('not a medical diagnosis'));
  assert.ok(testData.score.explanation.summary);

  const scoreId = testData.score.id;

  // 6. Fetch individual score report
  const reportRes = await fetch(`${baseUrl}/sessions/score/${scoreId}`, {
    headers: authHeader
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.equal(reportData.score.id, scoreId);
  assert.equal(reportData.child.id, childId);

  // 7. Fetch Child Dashboard Summary (trends, streaks, confused characters)
  const summaryRes = await fetch(`${baseUrl}/sessions/child/${childId}/summary`, {
    headers: authHeader
  });
  assert.equal(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  assert.equal(summaryData.totalAssessments, 1);
  assert.equal(summaryData.totalPracticeSessions, 1);
  assert.ok(summaryData.streakDays >= 1);
  assert.ok(summaryData.trendData.length === 1);
  assert.ok(summaryData.mostConfusedList.length >= 1);
  assert.equal(summaryData.mostConfusedList[0].pair, 'b → d');

  // 8. Test Phase 2 Handwriting telemetry submission stub
  const writingRes = await fetch(`${baseUrl}/sessions/writing`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      childId,
      charTarget: 'b',
      durationSec: 12,
      penLifts: 2,
      strokes: [{ x: 100, y: 150, t: Date.now() }, { x: 110, y: 160, t: Date.now() }],
      boundingBox: { width: 360, height: 260 }
    })
  });
  assert.equal(writingRes.status, 201);

  // 9. Inspect Scoring Config
  const configRes = await fetch(`${baseUrl}/config/scoring`, {
    headers: authHeader
  });
  assert.equal(configRes.status, 200);
  const configData = await configRes.json();
  assert.ok(configData.config.weights.reversalErrorRate);
});
