import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from './authRoutes.js';
import { seedQuestionBank } from '../data/seedQuestions.js';

export const questionRouter = express.Router();

// Helper to clean and normalize grade identifier
export function normalizeGrade(grade) {
  if (!grade) return 'UKG';
  const g = String(grade).toUpperCase().replace(/GRADE\s*/i, '').trim();
  if (g === 'K' || g === 'UKG' || g === '0') return 'UKG';
  if (g === '1') return '1';
  if (g === '2') return '2';
  if (g === '3') return '3';
  return 'UKG';
}

// GET /api/questions - Filtered list of questions with strict grade isolation
questionRouter.get('/', (req, res) => {
  try {
    const { grade, domain, skill, question_type, limit, offset = 0 } = req.query;

    let list = db.data.questions || [];
    if (list.length === 0) {
      seedQuestionBank();
      list = db.data.questions || [];
    }

    if (grade) {
      const cleanG = normalizeGrade(grade);
      list = list.filter(q => q.grade === cleanG);
    }

    if (domain) {
      list = list.filter(q => q.domain && q.domain.toLowerCase() === domain.toLowerCase());
    }

    if (skill) {
      list = list.filter(q => q.skill && q.skill.toLowerCase() === skill.toLowerCase());
    }

    if (question_type) {
      list = list.filter(q => q.question_type && q.question_type.toLowerCase() === question_type.toLowerCase());
    }

    const total = list.length;
    const startIndex = Math.max(0, parseInt(offset) || 0);
    const maxLimit = limit ? Math.max(1, parseInt(limit)) : total;
    const paginated = list.slice(startIndex, startIndex + maxLimit);

    res.json({
      total,
      count: paginated.length,
      grade: grade ? normalizeGrade(grade) : 'ALL',
      questions: paginated
    });
  } catch (err) {
    console.error('[QuestionRoutes] Error listing questions:', err);
    res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// GET /api/questions/stats - Detailed statistics by grade, domain, and type
questionRouter.get('/stats', (req, res) => {
  try {
    let list = db.data.questions || [];
    if (list.length === 0) {
      seedQuestionBank();
      list = db.data.questions || [];
    }

    const byGrade = { UKG: 0, '1': 0, '2': 0, '3': 0 };
    const byDomain = {};
    const byType = {};
    const byGradeDomain = {};

    list.forEach(q => {
      const g = q.grade || 'UKG';
      const d = q.domain || 'General';
      const t = q.question_type || 'MCQ';

      byGrade[g] = (byGrade[g] || 0) + 1;
      byDomain[d] = (byDomain[d] || 0) + 1;
      byType[t] = (byType[t] || 0) + 1;

      if (!byGradeDomain[g]) byGradeDomain[g] = {};
      byGradeDomain[g][d] = (byGradeDomain[g][d] || 0) + 1;
    });

    res.json({
      total: list.length,
      byGrade,
      byDomain,
      byType,
      byGradeDomain
    });
  } catch (err) {
    console.error('[QuestionRoutes] Error getting stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

// GET /api/questions/domains - Get list of domains & skills for a given grade
questionRouter.get('/domains', (req, res) => {
  try {
    const { grade } = req.query;
    let list = db.data.questions || [];
    if (list.length === 0) {
      seedQuestionBank();
      list = db.data.questions || [];
    }

    if (grade) {
      const cleanG = normalizeGrade(grade);
      list = list.filter(q => q.grade === cleanG);
    }

    const domainMap = {};
    list.forEach(q => {
      if (!domainMap[q.domain]) {
        domainMap[q.domain] = {
          domain: q.domain,
          skills: new Set(),
          totalQuestions: 0
        };
      }
      domainMap[q.domain].totalQuestions++;
      if (q.skill) domainMap[q.domain].skills.add(q.skill);
    });

    const domains = Object.values(domainMap).map(d => ({
      domain: d.domain,
      skills: Array.from(d.skills),
      totalQuestions: d.totalQuestions
    }));

    res.json({
      grade: grade ? normalizeGrade(grade) : 'ALL',
      domains
    });
  } catch (err) {
    console.error('[QuestionRoutes] Error getting domains:', err);
    res.status(500).json({ error: 'Failed to retrieve domains.' });
  }
});

// POST /api/questions/seed - Trigger idempotent seeding
questionRouter.post('/seed', (req, res) => {
  try {
    const result = seedQuestionBank();
    res.json(result);
  } catch (err) {
    console.error('[QuestionRoutes] Error seeding questions:', err);
    res.status(500).json({ error: 'Failed to seed questions.' });
  }
});

// Record Question Practice Progress
questionRouter.post('/progress', (req, res) => {
  try {
    const {
      childId,
      questionId,
      grade,
      domain,
      skill,
      questionType,
      isCorrect,
      attemptType = 'mcq',
      oralFeedback = null,
      responseTimeMs = 0
    } = req.body;

    if (!childId || !questionId) {
      return res.status(400).json({ error: 'childId and questionId are required.' });
    }

    if (!Array.isArray(db.data.questionProgress)) {
      db.data.questionProgress = [];
    }

    const record = {
      id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      childId,
      questionId,
      grade: normalizeGrade(grade),
      domain: domain || 'General',
      skill: skill || 'General',
      questionType: questionType || 'MCQ',
      isCorrect: Boolean(isCorrect),
      attemptType, // 'mcq' | 'oral' | 'flashcard'
      oralFeedback, // 'correct' | 'try_again' | 'skip'
      responseTimeMs: Number(responseTimeMs) || 0,
      timestamp: new Date().toISOString()
    };

    db.data.questionProgress.push(record);
    db.save();

    res.status(201).json({ success: true, record });
  } catch (err) {
    console.error('[QuestionRoutes] Error recording progress:', err);
    res.status(500).json({ error: 'Failed to record progress.' });
  }
});

// GET /api/questions/progress/:childId - Detailed skill-by-skill progress tracking
questionRouter.get('/progress/:childId', (req, res) => {
  try {
    const { childId } = req.params;
    const { grade } = req.query;

    const progressList = (db.data.questionProgress || []).filter(p => p.childId === childId);
    let allQuestions = db.data.questions || [];
    if (allQuestions.length === 0) {
      seedQuestionBank();
      allQuestions = db.data.questions || [];
    }

    const cleanGrade = grade ? normalizeGrade(grade) : null;
    const targetQuestions = cleanGrade ? allQuestions.filter(q => q.grade === cleanGrade) : allQuestions;

    // Aggregate by domain and skill
    const domainProgress = {};

    targetQuestions.forEach(q => {
      const d = q.domain || 'General';
      const s = q.skill || 'General';

      if (!domainProgress[d]) {
        domainProgress[d] = {
          domain: d,
          totalAvailable: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          skills: {}
        };
      }
      domainProgress[d].totalAvailable++;

      if (!domainProgress[d].skills[s]) {
        domainProgress[d].skills[s] = {
          skill: s,
          totalAvailable: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0
        };
      }
      domainProgress[d].skills[s].totalAvailable++;
    });

    // Tally attempts
    progressList.forEach(p => {
      const d = p.domain;
      const s = p.skill;

      if (domainProgress[d]) {
        domainProgress[d].attempted++;
        if (p.isCorrect) domainProgress[d].correct++;
        else domainProgress[d].incorrect++;

        if (domainProgress[d].skills[s]) {
          domainProgress[d].skills[s].attempted++;
          if (p.isCorrect) domainProgress[d].skills[s].correct++;
          else domainProgress[d].skills[s].incorrect++;
        }
      }
    });

    // Calculate percentage mastery
    const domainSummary = Object.values(domainProgress).map(d => {
      const percentage = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
      const skillsArray = Object.values(d.skills).map(s => ({
        ...s,
        percentage: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0
      }));

      return {
        domain: d.domain,
        totalAvailable: d.totalAvailable,
        attempted: d.attempted,
        correct: d.correct,
        incorrect: d.incorrect,
        percentage,
        skills: skillsArray
      };
    });

    // Total statistics
    const totalAttempted = progressList.length;
    const totalCorrect = progressList.filter(p => p.isCorrect).length;
    const totalIncorrect = totalAttempted - totalCorrect;
    const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    res.json({
      childId,
      grade: cleanGrade || 'ALL',
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      overallAccuracy,
      domains: domainSummary
    });
  } catch (err) {
    console.error('[QuestionRoutes] Error getting progress:', err);
    res.status(500).json({ error: 'Failed to retrieve progress.' });
  }
});
