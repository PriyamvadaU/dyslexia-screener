/**
 * Synthetic Multimodal Benchmark Dataset Generator
 * 
 * Generates statistically grounded pediatric screening datasets mimicking
 * clinical distributions for developmental dyslexia, dysgraphia, and age-matched controls.
 * Used for training, cross-validation, and benchmarking Level 2 ML models.
 */

import fs from 'fs';
import path from 'path';

/**
 * Generates a synthetic dataset of multimodal screening records
 * 
 * @param {number} [sampleCount=1000] - Total samples to generate
 * @param {number} [randomSeed=42] - Seed for reproducibility
 * @returns {Array<Object>} Array of labeled feature records
 */
export function generateSyntheticDataset(sampleCount = 1000, randomSeed = 42) {
  // Simple LCG pseudo-random generator with seed
  let seed = randomSeed;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  function randomNormal(mean = 0, stdDev = 1) {
    // Box-Muller transform
    const u1 = Math.max(1e-6, random());
    const u2 = random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  const dataset = [];
  const grades = ['K', '1', '2', '3', '4', '5', '6'];
  const gradeTargetWpms = { 'K': 35, '1': 55, '2': 85, '3': 110, '4': 130, '5': 145, '6': 160 };

  // Distribution: 55% Low Risk (neurotypical), 25% Moderate Risk, 20% High Risk
  for (let i = 0; i < sampleCount; i++) {
    const r = random();
    let trueClass; // 0 = Low, 1 = Moderate, 2 = High
    if (r < 0.55) {
      trueClass = 0;
    } else if (r < 0.80) {
      trueClass = 1;
    } else {
      trueClass = 2;
    }

    const grade = grades[Math.floor(random() * grades.length)];
    const targetWpm = gradeTargetWpms[grade] || 85;
    const gradeNum = grades.indexOf(grade);

    let reversalErrorRate;
    let wpmDeficitRatio;
    let decodingAccuracy;
    let pauseCount;
    let totalPauseDurationMs;
    let silenceRatio;
    let avgHesitationMs;
    let handwritingJitter;
    let handwritingPenLifts;
    let handwritingVelocityCV;
    let handwritingConsistency;

    if (trueClass === 0) {
      // Low Risk (Healthy developmental controls)
      reversalErrorRate = clamp(randomNormal(0.04, 0.04), 0.0, 0.20);
      wpmDeficitRatio = clamp(randomNormal(-0.10, 0.15), -0.50, 0.15); // often at or above target
      decodingAccuracy = clamp(randomNormal(0.95, 0.04), 0.85, 1.0);
      pauseCount = Math.max(0, Math.round(randomNormal(1.2, 1.0)));
      totalPauseDurationMs = Math.max(200, Math.round(randomNormal(1500, 800)));
      silenceRatio = clamp(randomNormal(0.10, 0.05), 0.02, 0.25);
      avgHesitationMs = Math.max(300, Math.round(randomNormal(800, 300)));
      handwritingJitter = clamp(randomNormal(0.35, 0.12), 0.15, 0.70);
      handwritingPenLifts = Math.max(0, Math.round(randomNormal(1.2, 0.8)));
      handwritingVelocityCV = clamp(randomNormal(0.40, 0.12), 0.20, 0.70);
      handwritingConsistency = clamp(Math.round(randomNormal(88, 7)), 70, 100);
    } else if (trueClass === 1) {
      // Moderate Risk (Emerging friction / mild difficulty)
      reversalErrorRate = clamp(randomNormal(0.28, 0.10), 0.12, 0.50);
      wpmDeficitRatio = clamp(randomNormal(0.30, 0.15), 0.10, 0.60);
      decodingAccuracy = clamp(randomNormal(0.82, 0.06), 0.68, 0.92);
      pauseCount = Math.max(1, Math.round(randomNormal(4.0, 1.5)));
      totalPauseDurationMs = Math.max(1000, Math.round(randomNormal(5500, 1800)));
      silenceRatio = clamp(randomNormal(0.28, 0.08), 0.15, 0.45);
      avgHesitationMs = Math.max(800, Math.round(randomNormal(1800, 500)));
      handwritingJitter = clamp(randomNormal(0.75, 0.18), 0.45, 1.10);
      handwritingPenLifts = Math.max(1, Math.round(randomNormal(3.0, 1.2)));
      handwritingVelocityCV = clamp(randomNormal(0.75, 0.15), 0.50, 1.05);
      handwritingConsistency = clamp(Math.round(randomNormal(68, 8)), 50, 82);
    } else {
      // High Risk (Pronounced dyslexia/dysgraphia profile)
      reversalErrorRate = clamp(randomNormal(0.65, 0.15), 0.40, 1.0);
      wpmDeficitRatio = clamp(randomNormal(0.65, 0.18), 0.35, 1.0);
      decodingAccuracy = clamp(randomNormal(0.62, 0.10), 0.35, 0.78);
      pauseCount = Math.max(3, Math.round(randomNormal(8.5, 2.5)));
      totalPauseDurationMs = Math.max(3000, Math.round(randomNormal(14000, 4500)));
      silenceRatio = clamp(randomNormal(0.50, 0.12), 0.30, 0.85);
      avgHesitationMs = Math.max(1500, Math.round(randomNormal(3200, 800)));
      handwritingJitter = clamp(randomNormal(1.20, 0.25), 0.80, 1.80);
      handwritingPenLifts = Math.max(2, Math.round(randomNormal(5.5, 1.8)));
      handwritingVelocityCV = clamp(randomNormal(1.10, 0.20), 0.80, 1.60);
      handwritingConsistency = clamp(Math.round(randomNormal(42, 10)), 15, 60);
    }

    const calculatedWpm = Math.max(5, Math.round(targetWpm * (1.0 - wpmDeficitRatio)));
    const durationSec = Math.max(15, Math.round(30 + (pauseCount * 4) + (totalPauseDurationMs / 1000)));

    // Continuous risk score (ground truth 0 - 100)
    let continuousScore;
    if (trueClass === 0) {
      continuousScore = Number(clamp(randomNormal(18, 9), 2, 34.5).toFixed(1));
    } else if (trueClass === 1) {
      continuousScore = Number(clamp(randomNormal(48, 8), 35.0, 64.5).toFixed(1));
    } else {
      continuousScore = Number(clamp(randomNormal(78, 9), 65.0, 98.5).toFixed(1));
    }

    dataset.push({
      sampleId: `sample_${String(i + 1).padStart(4, '0')}`,
      grade,
      gradeNum,
      reversalErrorRate: Number(reversalErrorRate.toFixed(3)),
      wpmDeficitRatio: Number(wpmDeficitRatio.toFixed(3)),
      calculatedWpm,
      targetWpm,
      decodingAccuracyPct: Number((decodingAccuracy * 100).toFixed(1)),
      pauseCount,
      totalPauseDurationMs,
      silenceRatio: Number(silenceRatio.toFixed(3)),
      avgHesitationMs,
      handwritingJitter: Number(handwritingJitter.toFixed(3)),
      handwritingPenLifts,
      handwritingVelocityCV: Number(handwritingVelocityCV.toFixed(3)),
      handwritingConsistency,
      durationSec,
      riskClass: trueClass, // 0 = Low, 1 = Moderate, 2 = High
      riskCategory: trueClass === 0 ? 'Low' : trueClass === 1 ? 'Moderate' : 'High',
      continuousScore
    });
  }

  return dataset;
}

/**
 * Saves synthetic dataset to disk as JSON and CSV
 */
export function exportDatasetFiles(outputDir) {
  const dataset = generateSyntheticDataset(1200, 42);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Export JSON
  const jsonPath = path.join(outputDir, 'multimodal_screening_dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2), 'utf-8');

  // Export CSV
  const csvHeaders = [
    'sampleId', 'grade', 'gradeNum', 'reversalErrorRate', 'wpmDeficitRatio',
    'calculatedWpm', 'targetWpm', 'decodingAccuracyPct', 'pauseCount',
    'totalPauseDurationMs', 'silenceRatio', 'avgHesitationMs',
    'handwritingJitter', 'handwritingPenLifts', 'handwritingVelocityCV',
    'handwritingConsistency', 'durationSec', 'riskClass', 'riskCategory', 'continuousScore'
  ];

  const csvRows = dataset.map(row => csvHeaders.map(h => row[h]).join(','));
  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(outputDir, 'multimodal_screening_dataset.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  return { jsonPath, csvPath, count: dataset.length };
}
