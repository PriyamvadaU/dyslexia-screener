import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';
import { computeLevel1Score } from '../engine/scoringEngine.js';
import { predictLevel2Risk, compareLevel1AndLevel2, mlModelMetadata } from '../engine/mlEngine.js';
import { extractHandwritingFeatures } from '../engine/handwritingFeatureExtractor.js';
import { extractReadingFeatures } from '../engine/readingFeatureExtractor.js';
import { authenticateToken } from './authRoutes.js';
import { sampleAssessmentQuestions, getQuestionById, QUESTION_BANK } from '../data/questionBank.js';
import { getLessonsForGrade, getLessonById, calculateGradeProgress, getNextAvailableLesson } from '../data/lessonsData.js';

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

// GET /api/sessions/questions - Fetch randomized, balanced picture/sound assessment questions
// STRICT GRADE ISOLATION ENFORCED: If childId provided, child.grade is the single source of truth.
sessionRouter.get('/questions', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, grade = 'UKG', count = 10, module = 'full_screening' } = req.query;

    let effectiveGrade = grade;
    let recentQuestionIds = [];

    if (childId) {
      const child = verifyChildAccess(childId, parentId);
      // Child profile's grade ALWAYS dictates allowed grade
      effectiveGrade = child.grade === 'K' ? 'UKG' : child.grade;

      const pastSessions = db.find('testSessions', s => s.childId === childId);
      pastSessions.forEach(s => {
        if (Array.isArray(s.rawFeatures?.flashcardResults)) {
          s.rawFeatures.flashcardResults.forEach(r => {
            if (r.cardId) recentQuestionIds.push(r.cardId);
          });
        }
      });
      recentQuestionIds = [...new Set(recentQuestionIds)].slice(-30);
    }

    const questions = sampleAssessmentQuestions({
      grade: effectiveGrade,
      recentQuestionIds,
      targetCount: Math.min(20, Math.max(5, Number(count) || 10)),
      module
    });

    res.json({
      grade: effectiveGrade,
      module,
      totalCount: questions.length,
      questions
    });
  } catch (err) {
    console.error('[Session] Question sampling error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to sample assessment questions.' });
  }
});

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

// GET /api/sessions/lessons - Get structured lesson map for child's assigned grade
sessionRouter.get('/lessons', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId is required.' });

    const child = verifyChildAccess(childId, parentId);
    const childGrade = child.grade === 'K' ? 'UKG' : child.grade;

    // Get all completed lessons for this child
    const allChildProgress = db.find('lessonProgress', p => p.childId === child.id);
    const completedLessonIds = allChildProgress.filter(p => p.completed).map(p => p.lessonId);

    const roadmap = calculateGradeProgress(childGrade, completedLessonIds);
    const nextLesson = getNextAvailableLesson(childGrade, completedLessonIds);

    // Configurable weak-skill threshold from educator config or default 70%
    const customConfig = db.getConfigOverrides();
    const weakThreshold = customConfig?.weakSkillThreshold ?? 70;

    // Calculate domain & skill accuracy across completed lessons
    const domainScores = {};
    allChildProgress.forEach(p => {
      if (p.domain && p.totalCount > 0) {
        if (!domainScores[p.domain]) domainScores[p.domain] = { correct: 0, total: 0 };
        domainScores[p.domain].correct += (p.correctCount || 0);
        domainScores[p.domain].total += p.totalCount;
      }
    });

    let recommendedLesson = null;
    const weakDomains = [];
    Object.keys(domainScores).forEach(dom => {
      const stat = domainScores[dom];
      const pct = Math.round((stat.correct / stat.total) * 100);
      if (pct < weakThreshold && stat.total >= 3) {
        weakDomains.push({ domain: dom, accuracyPct: pct });
      }
    });

    const gradeLessonsCatalog = getLessonsForGrade(childGrade);

    if (weakDomains.length > 0) {
      weakDomains.sort((a, b) => a.accuracyPct - b.accuracyPct);
      const weakest = weakDomains[0];
      const matchingDomain = gradeLessonsCatalog.domains.find(d => d.domainName === weakest.domain || d.id === weakest.domain);
      if (matchingDomain && matchingDomain.lessons.length > 0) {
        recommendedLesson = {
          ...matchingDomain.lessons[0],
          domainTitle: matchingDomain.title,
          domainEmoji: matchingDomain.emoji,
          domainColor: matchingDomain.color,
          reason: `Let's practice ${matchingDomain.title} again`
        };
      }
    }

    // Attach completion and answer telemetry to each lesson in the catalog
    const domainsWithStatus = gradeLessonsCatalog.domains.map(dom => {
      return {
        ...dom,
        lessons: dom.lessons.map(les => {
          const prog = allChildProgress.find(p => p.lessonId === les.id);
          return {
            ...les,
            completed: Boolean(prog?.completed),
            currentQuestionIdx: prog?.currentQuestionIdx || 0,
            scorePct: prog?.scorePct ?? null,
            attempts: prog?.attempts || 0
          };
        })
      };
    });

    res.json({
      childId: child.id,
      childName: child.name,
      grade: childGrade,
      roadmap,
      nextLesson,
      recommendedLesson,
      domains: domainsWithStatus
    });
  } catch (err) {
    console.error('[Session] Lessons fetch error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch lessons.' });
  }
});

// GET /api/sessions/lessons/:lessonId - Fetch specific lesson questions with state resume
sessionRouter.get('/lessons/:lessonId', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId is required.' });

    const child = verifyChildAccess(childId, parentId);
    const childGrade = child.grade === 'K' ? 'UKG' : child.grade;

    const lesson = getLessonById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // STRICT GRADE ISOLATION ENFORCEMENT:
    // A child cannot access lessons outside their assigned grade!
    if (lesson.grade !== childGrade) {
      return res.status(403).json({
        error: `Access denied: Lesson belongs to ${lesson.grade}, but child is enrolled in ${childGrade}.`
      });
    }

    // Load full question details preserving all IDs
    const questions = lesson.questionIds.map(qid => getQuestionById(qid)).filter(Boolean);

    // Check if there is an existing in-progress session to resume
    const prog = db.findOne('lessonProgress', p => p.childId === child.id && p.lessonId === lesson.id);

    res.json({
      lesson,
      questions,
      savedState: prog ? {
        completed: prog.completed,
        currentQuestionIdx: prog.currentQuestionIdx || 0,
        answers: prog.answers || {},
        scorePct: prog.scorePct,
        correctCount: prog.correctCount
      } : null
    });
  } catch (err) {
    console.error('[Session] Lesson get error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch lesson.' });
  }
});

// POST /api/sessions/lesson-progress - Idempotently record lesson question answer & completion
sessionRouter.post('/lesson-progress', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, lessonId, currentQuestionIdx, answers, completed } = req.body;

    if (!childId || !lessonId) {
      return res.status(400).json({ error: 'childId and lessonId are required.' });
    }

    const child = verifyChildAccess(childId, parentId);
    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    const childGrade = child.grade === 'K' ? 'UKG' : child.grade;
    if (lesson.grade !== childGrade) {
      return res.status(403).json({ error: 'Grade mismatch for lesson.' });
    }

    const progressId = `prog_${child.id}_${lesson.id}`;
    const existing = db.findOne('lessonProgress', p => p.id === progressId);

    const ansMap = answers || (existing?.answers || {});
    const answeredQuestionIds = Object.keys(ansMap);
    const correctCount = Object.values(ansMap).filter(a => a?.isCorrect).length;
    const totalCount = lesson.questionIds.length;
    const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const isCompleted = completed !== undefined ? Boolean(completed) : (answeredQuestionIds.length >= totalCount);

    const payload = {
      id: progressId,
      childId: child.id,
      grade: childGrade,
      domain: lesson.domain,
      skill: lesson.skill,
      lessonId: lesson.id,
      completed: isCompleted,
      completedQuestions: answeredQuestionIds,
      answers: ansMap,
      correctCount,
      totalCount,
      currentQuestionIdx: Number(currentQuestionIdx) || 0,
      scorePct,
      attempts: (existing?.attempts || 0) + (isCompleted && !existing?.completed ? 1 : 0),
      lastUpdated: new Date().toISOString()
    };

    let record;
    if (existing) {
      record = db.update('lessonProgress', existing.id, payload);
    } else {
      record = db.insert('lessonProgress', payload);
    }

    res.json({
      message: isCompleted ? 'Lesson completed!' : 'Lesson progress saved.',
      progress: record
    });
  } catch (err) {
    console.error('[Session] Lesson progress save error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to update lesson progress.' });
  }
});

// POST /api/sessions/test - Submit Multimodal Test Session (Level 1 + Level 2 ML)
sessionRouter.post('/test', (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, rawFeatures, handwritingTelemetry, readingTelemetry, flashcardResults } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'childId is required.' });
    }

    const child = verifyChildAccess(childId, parentId);

    // 1. Unify multimodal raw input payload
    const unifiedPayload = {
      ...(rawFeatures || {}),
      handwritingStrokes: handwritingTelemetry?.strokes || rawFeatures?.handwritingStrokes || rawFeatures?.strokes,
      writingTarget: handwritingTelemetry?.charTarget || rawFeatures?.charTarget || 'b',
      writingDurationSec: handwritingTelemetry?.durationSec || rawFeatures?.writingDurationSec || 0,
      flashcardResults: flashcardResults || rawFeatures?.flashcardResults,
      transcript: readingTelemetry?.transcript || rawFeatures?.transcript || '',
      targetPassage: readingTelemetry?.targetPassage || rawFeatures?.targetPassage || '',
      readingDurationSec: readingTelemetry?.durationSec || rawFeatures?.readingDurationSec || 0,
      pauseCount: readingTelemetry?.pauseCount ?? rawFeatures?.pauseCount ?? 0,
      totalPauseDurationMs: readingTelemetry?.totalPauseDurationMs ?? rawFeatures?.totalPauseDurationMs ?? 0,
      averageHesitationMs: readingTelemetry?.averageHesitationMs ?? rawFeatures?.averageHesitationMs ?? 0
    };

    // 2. Educator Config Overrides
    const customConfig = db.getConfigOverrides();

    // 3. Server-side Computation: Level 1 Multimodal Rule-Based Score
    const level1Result = computeLevel1Score(unifiedPayload, child.grade, customConfig);

    // 4. Server-side Computation: Level 2 ML Predictive Risk Model
    const level2Result = predictLevel2Risk(level1Result, child.grade);

    // 5. Level 1 vs Level 2 Comparison Analysis
    const comparison = compareLevel1AndLevel2(level1Result, level2Result);

    const testSessionId = `test_${uuidv4().substring(0, 8)}`;
    const scoreId = `score_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // 6. Save Test Session (Minimized raw feature telemetry)
    const testSession = db.insert('testSessions', {
      id: testSessionId,
      childId: child.id,
      parentId,
      rawFeatures: {
        ...unifiedPayload,
        // sanitize: keep stroke coordinate count rather than storing massive arrays indefinitely
        handwritingPointCount: Array.isArray(unifiedPayload.handwritingStrokes) ? unifiedPayload.handwritingStrokes.length : 0,
        transcriptSnippet: unifiedPayload.transcript ? String(unifiedPayload.transcript).slice(0, 500) : ''
      },
      scoreId,
      timestamp: now
    });

    // 7. Save Computed Score Record (Level 1 + Level 2 ML + Comparison)
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
      isMultimodal: level1Result.isMultimodal,
      modalitiesIncluded: level1Result.modalitiesIncluded,
      mlModel: level2Result,
      comparison,
      timestamp: now
    });

    res.status(201).json({
      message: 'Multimodal assessment completed and verified score computed.',
      testSession,
      score: scoreRecord
    });
  } catch (err) {
    console.error('[Session] Test submit error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to process test assessment.' });
  }
});

// POST /api/sessions/handwriting/analyze - Extract handwriting features directly
sessionRouter.post('/handwriting/analyze', (req, res) => {
  try {
    const { strokes, charTarget, canvasBounds, durationSec } = req.body;
    const features = extractHandwritingFeatures(
      strokes || [],
      charTarget || 'b',
      canvasBounds || { width: 360, height: 260 },
      durationSec || 0
    );

    res.json({
      status: 'success',
      features,
      disclaimer: 'Preliminary motor screening feature telemetry.'
    });
  } catch (err) {
    console.error('[Session] Handwriting analyze error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze handwriting strokes.' });
  }
});

// POST /api/sessions/reading/analyze - Extract reading speech features directly
sessionRouter.post('/reading/analyze', (req, res) => {
  try {
    const { transcript, targetPassage, durationSec, pauseCount, totalPauseDurationMs, averageHesitationMs, grade } = req.body;
    const features = extractReadingFeatures({
      transcript: transcript || '',
      targetPassage: targetPassage || '',
      durationSec: durationSec || 1,
      pauseCount: pauseCount || 0,
      totalPauseDurationMs: totalPauseDurationMs || 0,
      averageHesitationMs: averageHesitationMs || 0,
      grade: grade || '2'
    });

    res.json({
      status: 'success',
      features,
      disclaimer: 'Preliminary oral reading fluency telemetry.'
    });
  } catch (err) {
    console.error('[Session] Reading analyze error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze speech telemetry.' });
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

    const child = db.findOne('children', c => c.id === score.childId && c.parentId === parentId);
    if (!child) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Ensure ML comparison is present even on older records
    if (!score.mlModel || !score.comparison) {
      const mlResult = predictLevel2Risk(score, child.grade);
      score.mlModel = mlResult;
      score.comparison = compareLevel1AndLevel2(score, mlResult);
    }

    res.json({ score, child });
  } catch (err) {
    console.error('[Session] Get score report error:', err);
    res.status(500).json({ error: 'Failed to retrieve score report.' });
  }
});

// GET /api/sessions/score/:scoreId/compare - Level 1 vs Level 2 Model Comparison View
sessionRouter.get('/score/:scoreId/compare', (req, res) => {
  try {
    const parentId = req.user.id;
    const score = db.findById('scores', req.params.scoreId);
    if (!score) {
      return res.status(404).json({ error: 'Score report not found.' });
    }

    const child = db.findOne('children', c => c.id === score.childId && c.parentId === parentId);
    if (!child) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const mlResult = score.mlModel || predictLevel2Risk(score, child.grade);
    const comparison = score.comparison || compareLevel1AndLevel2(score, mlResult);

    res.json({
      scoreId: score.id,
      childName: child.name,
      childGrade: child.grade,
      comparison,
      metrics: score.metrics,
      modelMetadata: mlModelMetadata
    });
  } catch (err) {
    console.error('[Session] Comparison error:', err);
    res.status(500).json({ error: 'Failed to retrieve model comparison.' });
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
      mlRiskScore: s.mlModel?.mlRiskScore ?? s.compositeScore,
      category: s.category,
      wpm: s.metrics?.calculatedWpm || 0,
      targetWpm: s.metrics?.targetWpm || 0,
      readingAccuracy: s.metrics?.readingAccuracyPct || 0,
      flashcardAccuracy: s.metrics?.flashcardAccuracyPct || 0,
      reversalErrorRate: s.metrics?.reversalErrorRatePct || 0,
      handwritingConsistency: s.metrics?.handwriting?.strokeConsistencyScore || null
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

    const allDates = [...scores, ...learnSessions]
      .map(item => new Date(item.timestamp).toDateString());
    const uniqueDays = new Set(allDates);
    const streakDays = uniqueDays.size;

    // 4. Learning & Lesson Progress Summary
    const childGrade = child.grade === 'K' ? 'UKG' : child.grade;
    const allLessonProgress = db.find('lessonProgress', p => p.childId === child.id);
    const completedLessonIds = allLessonProgress.filter(p => p.completed).map(p => p.lessonId);
    const learningRoadmap = calculateGradeProgress(childGrade, completedLessonIds);

    // Configurable weak-skill threshold from educator config or default 70%
    const customConfig = db.getConfigOverrides();
    const weakThreshold = customConfig?.weakSkillThreshold ?? 70;

    const domainScores = {};
    allLessonProgress.forEach(p => {
      if (p.domain && p.totalCount > 0) {
        if (!domainScores[p.domain]) domainScores[p.domain] = { correct: 0, total: 0 };
        domainScores[p.domain].correct += (p.correctCount || 0);
        domainScores[p.domain].total += p.totalCount;
      }
    });

    const recommendedPractice = [];
    Object.keys(domainScores).forEach(dom => {
      const stat = domainScores[dom];
      const pct = Math.round((stat.correct / stat.total) * 100);
      if (pct < weakThreshold && stat.total >= 3) {
        recommendedPractice.push({
          domain: dom,
          accuracyPct: pct,
          message: 'This skill may benefit from additional practice.'
        });
      }
    });

    res.json({
      childId: child.id,
      childName: child.name,
      childGrade,
      totalAssessments,
      totalPracticeSessions,
      streakDays,
      latestCategory: latestScore ? latestScore.category : 'None',
      latestScore: latestScore ? latestScore.compositeScore : null,
      latestMlScore: latestScore?.mlModel?.mlRiskScore ?? null,
      latestDate: latestScore ? latestScore.timestamp : null,
      trendData,
      mostConfusedList,
      recentScores: [...scores].reverse().slice(0, 5),
      learningProgress: {
        totalLessons: learningRoadmap.totalLessons,
        completedLessons: learningRoadmap.completedLessons,
        overallProgressPct: learningRoadmap.overallProgressPct,
        domainProgress: learningRoadmap.domainProgress,
        recommendedPractice
      }
    });
  } catch (err) {
    console.error('[Session] Summary error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to compute child summary statistics.' });
  }
});

// POST /api/sessions/writing - Handwriting Canvas Tracing Telemetry & Feature Recording
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

    const extractedFeatures = extractHandwritingFeatures(
      strokes || [],
      charTarget,
      boundingBox || { width: 360, height: 260 },
      Number(durationSec) || 0
    );

    const record = db.insert('writingSessions', {
      id: writingSessionId,
      childId: child.id,
      parentId,
      charTarget,
      durationSec: Number(durationSec) || 0,
      penLifts: Number(penLifts) || extractedFeatures.penLifts,
      strokePointCount: Array.isArray(strokes) ? strokes.length : 0,
      boundingBox: boundingBox || null,
      extractedFeatures,
      timestamp: now
    });

    res.status(201).json({
      message: 'Handwriting kinematic telemetry extracted and recorded successfully.',
      writingSession: record,
      features: extractedFeatures
    });
  } catch (err) {
    console.error('[Session] Writing telemetry error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to record handwriting telemetry.' });
  }
});
