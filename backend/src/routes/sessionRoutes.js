import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';
import { computeLevel1Score } from '../engine/scoringEngine.js';
import { predictLevel2Risk } from '../engine/mlEngineStub.js';
import { authenticateToken } from './authRoutes.js';

export const sessionRouter = express.Router();
sessionRouter.use(authenticateToken);

// Helper: Ensure child exists and belongs to authenticated parent
function verifyChildAccess(childId, parentId) {
  const child = db.findOne('children', c => c.id === childId && c.parentId === parentId);
  if (!child) {
    throw { status: 404, message: 'Child profile not found or access denied.' };
  }
  if (!child.consentConfirmed) {
    throw { status: 403, message: 'Parental consent must be confirmed before running assessments.' };
  }
  return child;
}

// POST /api/sessions/learn - Save Learn/Practice session (Zero scoring recorded)
sessionRouter.post('/learn', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, durationSec, cardsViewed, readAlongCompleted } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'childId is required.' });
    }

    const child = verifyChildAccess(childId, parentId);
    const sessionId = `learn_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const learnRecord = db.insert('learnSessions', {
      id: sessionId,
      childId: child.id,
      parentId,
      durationSec: Number(durationSec) || 0,
      cardsViewed: Number(cardsViewed) || 0,
      readAlongCompleted: Boolean(readAlongCompleted),
      timestamp: now
    });

    res.status(201).json({
      message: 'Learn practice session recorded (no score computed).',
      session: learnRecord
    });
  } catch (err) {
    console.error('[Session] Learn save error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to record learn session.' });
  }
});

// POST /api/sessions/test - Submit Test session and compute Level 1 Score server-side
sessionRouter.post('/test', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, rawFeatures } = req.body;

    if (!childId || !rawFeatures) {
      return res.status(400).json({ error: 'childId and rawFeatures are required.' });
    }

    const child = verifyChildAccess(childId, parentId);

    // 1. Get custom config overrides if defined by educators
    const customConfig = db.getConfigOverrides();

    // 2. Server-side computation of Level 1 Rule-Based Screening Score
    const level1Result = computeLevel1Score(rawFeatures, child.grade, customConfig);

    // 3. Phase 2 Level 2 ML prediction stub
    const level2Result = predictLevel2Risk(rawFeatures);

    const testSessionId = `test_${uuidv4().substring(0, 8)}`;
    const scoreId = `score_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // 4. Save Test Session (Raw Features)
    const testSession = db.insert('testSessions', {
      id: testSessionId,
      childId: child.id,
      parentId,
      rawFeatures: {
        ...rawFeatures,
        // sanitize: don't store unbounded audio payloads to conserve zero-cost storage
        transcriptSnippet: rawFeatures.transcript ? String(rawFeatures.transcript).slice(0, 500) : ''
      },
      scoreId,
      timestamp: now
    });

    // 5. Save Computed Score Record
    const scoreRecord = db.insert('scores', {
      id: scoreId,
      testSessionId: testSession.id,
      childId: child.id,
      childName: child.name,
      childGrade: child.grade,
      compositeScore: level1Result.compositeScore,
      category: level1Result.category,
      categoryColor: level1Result.categoryColor,
      badgeText: level1Result.badgeText,
      metrics: level1Result.metrics,
      riskBreakdown: level1Result.riskBreakdown,
      weightsApplied: level1Result.weightsApplied,
      explanation: level1Result.explanation,
      disclaimer: level1Result.disclaimer,
      mlScoreStub: level2Result,
      timestamp: now
    });

    res.status(201).json({
      message: 'Assessment completed and verified score computed.',
      testSession,
      score: scoreRecord
    });
  } catch (err) {
    console.error('[Session] Test submit error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to process test assessment.' });
  }
});

// GET /api/sessions/child/:childId - Get all test scores and history for a child
sessionRouter.get('/child/:childId', (req, res) => {
  try {
    const parentId = req.user.id;
    const child = verifyChildAccess(req.params.childId, parentId);

    const scores = db.find('scores', s => s.childId === child.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const learnSessions = db.find('learnSessions', l => l.childId === child.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      child,
      scores,
      learnSessions
    });
  } catch (err) {
    console.error('[Session] Get child history error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to retrieve assessment history.' });
  }
});

// GET /api/sessions/score/:scoreId - Get individual score report
sessionRouter.get('/score/:scoreId', (req, res) => {
  try {
    const parentId = req.user.id;
    const score = db.findById('scores', req.params.scoreId);
    if (!score) {
      return res.status(404).json({ error: 'Score report not found.' });
    }

    // Verify ownership via child
    const child = db.findOne('children', c => c.id === score.childId && c.parentId === parentId);
    if (!child) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ score, child });
  } catch (err) {
    console.error('[Session] Get score report error:', err);
    res.status(500).json({ error: 'Failed to retrieve score report.' });
  }
});

// GET /api/sessions/child/:childId/summary - Aggregated dashboard metrics, streaks & trends
sessionRouter.get('/child/:childId/summary', (req, res) => {
  try {
    const parentId = req.user.id;
    const child = verifyChildAccess(req.params.childId, parentId);

    const scores = db.find('scores', s => s.childId === child.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const learnSessions = db.find('learnSessions', l => l.childId === child.id);

    // 1. Calculate Progression Trends for Recharts
    const trendData = scores.map((s, idx) => ({
      sessionIndex: idx + 1,
      date: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      compositeScore: s.compositeScore,
      category: s.category,
      wpm: s.metrics?.calculatedWpm || 0,
      targetWpm: s.metrics?.targetWpm || 0,
      readingAccuracy: s.metrics?.readingAccuracyPct || 0,
      flashcardAccuracy: s.metrics?.flashcardAccuracyPct || 0,
      reversalErrorRate: s.metrics?.reversalErrorRatePct || 0
    }));

    // 2. Aggregate Confused Characters across all sessions
    const confusionMap = {};
    scores.forEach(s => {
      const pairs = s.metrics?.confusedPairs || [];
      pairs.forEach(p => {
        const key = `${p.expected} → ${p.actual}`;
        if (!confusionMap[key]) {
          confusionMap[key] = { pair: key, expected: p.expected, actual: p.actual, count: 0 };
        }
        confusionMap[key].count += (p.count || 1);
      });
    });

    const mostConfusedList = Object.values(confusionMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Streak & Session Count Calculation
    const totalAssessments = scores.length;
    const totalPracticeSessions = learnSessions.length;
    const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

    // Calculate active days streak
    const allDates = [...scores, ...learnSessions]
      .map(item => new Date(item.timestamp).toDateString());
    const uniqueDays = new Set(allDates);
    const streakDays = uniqueDays.size;

    res.json({
      childId: child.id,
      childName: child.name,
      totalAssessments,
      totalPracticeSessions,
      streakDays,
      latestCategory: latestScore ? latestScore.category : 'None',
      latestScore: latestScore ? latestScore.compositeScore : null,
      latestDate: latestScore ? latestScore.timestamp : null,
      trendData,
      mostConfusedList,
      recentScores: [...scores].reverse().slice(0, 5)
    });
  } catch (err) {
    console.error('[Session] Summary error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to compute child summary statistics.' });
  }
});

// POST /api/sessions/writing - Phase 2 Handwriting Tracing Extension Stub
sessionRouter.post('/writing', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, strokes, durationSec, penLifts, boundingBox, charTarget } = req.body;

    if (!childId || !charTarget) {
      return res.status(400).json({ error: 'childId and charTarget are required.' });
    }

    const child = verifyChildAccess(childId, parentId);
    const writingSessionId = `write_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const record = db.insert('writingSessions', {
      id: writingSessionId,
      childId: child.id,
      parentId,
      charTarget,
      durationSec: Number(durationSec) || 0,
      penLifts: Number(penLifts) || 0,
      strokePointCount: Array.isArray(strokes) ? strokes.length : 0,
      boundingBox: boundingBox || null,
      timestamp: now
    });

    res.status(201).json({
      message: 'Phase 2 handwriting telemetry recorded successfully.',
      writingSession: record
    });
  } catch (err) {
    console.error('[Session] Writing stub error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to record handwriting telemetry.' });
  }
});
