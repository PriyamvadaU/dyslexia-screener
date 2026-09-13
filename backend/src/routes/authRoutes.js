import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dyslexia-screener-secure-secret-key-2026';

// Authentication middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.findOne('users', u => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.insert('users', {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'parent', // 'parent' | 'teacher' | 'educator'
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.findOne('users', u => u.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/demo - Instant demo access with pre-seeded sample child data
authRouter.post('/demo', async (req, res) => {
  try {
    const demoEmail = 'demo_parent@lexiscreen.org';
    let user = db.findOne('users', u => u.email === demoEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('DemoPass123!', salt);
      user = db.insert('users', {
        id: 'demo_user_001',
        name: 'Sarah Jenkins (Demo Parent)',
        email: demoEmail,
        passwordHash,
        role: 'parent',
        createdAt: new Date().toISOString()
      });

      // Seed sample child
      const child = db.insert('children', {
        id: 'demo_child_leo',
        parentId: user.id,
        name: 'Leo',
        age: 7,
        grade: '2',
        notes: 'Developing reader, loves science and stories.',
        consentConfirmed: true,
        consentDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Seed consent
      db.insert('consentRecords', {
        id: 'demo_consent_001',
        childId: child.id,
        parentId: user.id,
        signatureName: user.name,
        consentType: 'PRELIMINARY_SCREENING_NON_MEDICAL',
        disclaimerAcknowledged: true,
        timestamp: new Date().toISOString()
      });

      // Seed sample past sessions
      db.insert('learnSessions', {
        id: 'demo_learn_001',
        childId: child.id,
        parentId: user.id,
        durationSec: 140,
        cardsViewed: 6,
        readAlongCompleted: true,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      });

      // Seed moderate risk session
      db.insert('scores', {
        id: 'demo_score_001',
        testSessionId: 'demo_test_001',
        childId: child.id,
        childName: 'Leo',
        childGrade: '2',
        compositeScore: 42.5,
        category: 'Moderate',
        categoryColor: 'amber',
        badgeText: 'Moderate Screening Indicator',
        metrics: {
          calculatedWpm: 58,
          targetWpm: 85,
          minWpm: 60,
          readingAccuracyPct: 86,
          flashcardAccuracyPct: 75,
          reversalErrorRatePct: 25,
          reversalErrors: 2,
          reversalAttempts: 8,
          confusedPairs: [{ expected: 'b', actual: 'd', count: 2 }],
          pauseCount: 4,
          totalPauseDurationMs: 6800,
          averageHesitationMs: 1700,
          readingDurationSec: 62
        },
        riskBreakdown: {
          reversalRisk: 62,
          readingAccuracyRisk: 21,
          fluencyRisk: 50,
          pauseAndHesitationRisk: 34,
          flashcardRisk: 25
        },
        weightsApplied: {
          reversalErrorRate: 0.3,
          readingAccuracy: 0.25,
          readingFluencyWpm: 0.2,
          pauseAndHesitation: 0.15,
          flashcardAccuracy: 0.1
        },
        explanation: {
          summary: 'Shows mild indicators of decoding friction or letter orientation confusion for Grade 2.',
          strengths: ['Enthusiastic reading engagement and good vocabulary retention.'],
          focusAreas: ['Letter orientation confusion noted: "b" confused with "d" (2x).', 'Reading rate is 58 WPM, approaching the Grade 2 target of 85 WPM.'],
          recommendations: ['Practice multi-sensory letter tracing.', 'Engage in paired read-along exercises.']
        },
        disclaimer: 'This is a preliminary screening indicator, not a medical diagnosis.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Demo session active.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Auth] Demo error:', err);
    res.status(500).json({ error: 'Failed to initialize demo session.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

