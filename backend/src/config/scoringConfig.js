/**
 * Centralized Multimodal Screening Engine Configuration
 * 
 * Manages all feature weights, multimodal fusion ratios, developmental grade baselines,
 * kinematic handwriting thresholds, and clinical risk categorization cutoffs.
 */

export const scoringConfig = {
  // Multimodal Feature Weights for Full 4-Pillar Assessment (Sum = 1.0)
  weights: {
    reversalErrorRate: 0.25,     // Visual-spatial mirror letter confusion (b/d, p/q)
    readingAccuracy: 0.20,       // Oral word decoding & substitution errors
    readingFluencyWpm: 0.20,     // Oral reading rate vs grade baseline
    handwritingKinematics: 0.15, // Motor dysgraphia, stroke jitter, pen lifts, consistency
    pauseAndHesitation: 0.12,    // Acoustic hesitations and silence ratio
    flashcardAccuracy: 0.08      // Baseline phonological recognition
  },

  // Fallback 3-Pillar Weights (when handwriting module is skipped)
  fallbackSpeechWeights: {
    reversalErrorRate: 0.30,
    readingAccuracy: 0.25,
    readingFluencyWpm: 0.20,
    pauseAndHesitation: 0.15,
    flashcardAccuracy: 0.10
  },

  // Risk Category Cutoff Thresholds (Score range: 0 - 100)
  thresholds: {
    lowRiskMax: 34.9,          // 0.0 to 34.9 -> Low Screening Risk
    moderateRiskMax: 64.9,     // 35.0 to 64.9 -> Moderate Screening Indicator
    // >= 65.0 -> High Screening Indicator
  },

  // Expected Oral Reading Fluency Benchmarks (Words Per Minute) by Grade / Age
  gradeWpmBenchmarks: {
    'K': { min: 20, target: 35, maxHesitationMs: 2500, expectedPenLifts: 4 },
    '1': { min: 35, target: 55, maxHesitationMs: 2200, expectedPenLifts: 3 },
    '2': { min: 60, target: 85, maxHesitationMs: 1800, expectedPenLifts: 2 },
    '3': { min: 80, target: 110, maxHesitationMs: 1500, expectedPenLifts: 2 },
    '4': { min: 100, target: 130, maxHesitationMs: 1300, expectedPenLifts: 1 },
    '5': { min: 115, target: 145, maxHesitationMs: 1200, expectedPenLifts: 1 },
    '6': { min: 130, target: 160, maxHesitationMs: 1100, expectedPenLifts: 1 },
    'default': { min: 50, target: 80, maxHesitationMs: 1800, expectedPenLifts: 2 }
  },

  // Handwriting Kinematic Developmental Norms
  handwritingNorms: {
    minStrokeConsistencyScore: 70, // Below 70 indicates erratic motor control
    maxJitterIndex: 0.95,           // Angular tremor variance threshold
    maxVelocityVariationCV: 0.85,   // Speed instability threshold
    maxPenLiftRateHz: 0.40          // In-air pause/lift frequency
  },

  // Specific high-risk letter reversal pairs to monitor
  reversalPairs: [
    ['b', 'd'],
    ['p', 'q'],
    ['m', 'w'],
    ['n', 'u'],
    ['s', 'z']
  ],

  // Pause duration threshold (milliseconds) considered an abnormal hesitation
  significantPauseThresholdMs: 1800,

  // Medical Disclaimer notice attached to all assessment results
  disclaimer: "This is a preliminary screening indicator, not a medical diagnosis. Consult a certified educational psychologist or speech-language pathologist for comprehensive clinical evaluation."
};

/**
 * Returns the benchmark configuration for a given grade or age
 */
export function getGradeBenchmark(grade) {
  if (!grade) return scoringConfig.gradeWpmBenchmarks['default'];
  const cleanGrade = String(grade).toUpperCase().replace(/GRADE\s*/i, '').trim();
  return scoringConfig.gradeWpmBenchmarks[cleanGrade] || scoringConfig.gradeWpmBenchmarks['default'];
}
