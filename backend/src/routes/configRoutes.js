import express from 'express';
import { scoringConfig } from '../config/scoringConfig.js';
import { db } from '../config/db.js';
import { authenticateToken } from './authRoutes.js';

export const configRouter = express.Router();
configRouter.use(authenticateToken);

// GET /api/config/scoring - Get active scoring configuration
configRouter.get('/scoring', (req, res) => {
  try {
    const overrides = db.getConfigOverrides();
    const activeConfig = overrides ? { ...scoringConfig, ...overrides } : scoringConfig;
    res.json({
      config: activeConfig,
      isOverridden: Boolean(overrides)
    });
  } catch (err) {
    console.error('[Config] Get error:', err);
    res.status(500).json({ error: 'Failed to retrieve scoring configuration.' });
  }
});

// PUT /api/config/scoring - Update scoring configuration
configRouter.put('/scoring', (req, res) => {
  try {
    const { weights, thresholds, gradeWpmBenchmarks } = req.body;

    if (weights) {
      const sum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        return res.status(400).json({ error: `Weights must sum to 1.0 (current sum: ${sum.toFixed(2)})` });
      }
    }

    const current = db.getConfigOverrides() || scoringConfig;
    const updated = {
      ...current,
      weights: weights || current.weights,
      thresholds: thresholds || current.thresholds,
      gradeWpmBenchmarks: gradeWpmBenchmarks || current.gradeWpmBenchmarks
    };

    db.setConfigOverrides(updated);
    res.json({ message: 'Scoring configuration updated successfully.', config: updated });
  } catch (err) {
    console.error('[Config] Update error:', err);
    res.status(500).json({ error: 'Failed to update scoring configuration.' });
  }
});

// POST /api/config/scoring/reset - Reset to default formula
configRouter.post('/scoring/reset', (req, res) => {
  try {
    db.setConfigOverrides(null);
    res.json({ message: 'Scoring configuration reset to defaults.', config: scoringConfig });
  } catch (err) {
    console.error('[Config] Reset error:', err);
    res.status(500).json({ error: 'Failed to reset scoring configuration.' });
  }
});
