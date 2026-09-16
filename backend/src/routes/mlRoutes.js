import express from 'express';
import { mlModelMetadata, predictLevel2Risk, compareLevel1AndLevel2 } from '../engine/mlEngine.js';
import { generateSyntheticDataset } from '../ml/datasetGenerator.js';

export const mlRouter = express.Router();

// GET /api/ml/model-info - Inspect Level 2 ML model architecture & training metrics
mlRouter.get('/model-info', (req, res) => {
  res.json({
    status: 'online',
    model: mlModelMetadata,
    disclaimer: 'Statistical screening model for research & educational guidance; not a medical diagnostic device.'
  });
});

// POST /api/ml/predict - Run standalone ML inference on raw feature vector
mlRouter.post('/predict', (req, res) => {
  try {
    const { featureVector, grade } = req.body;
    if (!featureVector) {
      return res.status(400).json({ error: 'featureVector object is required.' });
    }

    const prediction = predictLevel2Risk(featureVector, grade || '2');
    res.json({
      status: 'success',
      prediction,
      disclaimer: 'Preliminary screening indicator only, not a medical diagnosis.'
    });
  } catch (err) {
    console.error('[ML Route] Prediction error:', err);
    res.status(500).json({ error: err.message || 'Failed to compute ML prediction.' });
  }
});

// POST /api/ml/compare - Compare arbitrary Level 1 and Level 2 score objects
mlRouter.post('/compare', (req, res) => {
  try {
    const { level1Score, level2Score } = req.body;
    if (!level1Score || !level2Score) {
      return res.status(400).json({ error: 'level1Score and level2Score are required.' });
    }

    const comparison = compareLevel1AndLevel2(level1Score, level2Score);
    res.json({
      status: 'success',
      comparison
    });
  } catch (err) {
    console.error('[ML Route] Comparison error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare model scores.' });
  }
});

// GET /api/ml/dataset - Retrieve / generate synthetic benchmark screening dataset
mlRouter.get('/dataset', (req, res) => {
  try {
    const count = Math.min(2000, Math.max(50, Number(req.query.count) || 250));
    const seed = Number(req.query.seed) || 42;
    const dataset = generateSyntheticDataset(count, seed);
    res.json({
      status: 'success',
      count: dataset.length,
      dataset,
      featureSummary: {
        totalSamples: dataset.length,
        classes: ['Low', 'Moderate', 'High'],
        featuresIncluded: mlModelMetadata.features
      }
    });
  } catch (err) {
    console.error('[ML Route] Dataset generation error:', err);
    res.status(500).json({ error: 'Failed to generate dataset.' });
  }
});
