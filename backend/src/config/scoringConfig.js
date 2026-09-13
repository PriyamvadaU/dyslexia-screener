/**
 * Centralized Scoring Engine Configuration
 * 
 * All feature weights, category thresholds, grade-level fluency benchmarks,
 * and penalty multipliers are managed here in one editable configuration file.
 */

export const scoringConfig = {
  // Feature weights (must sum to 1.0)
  weights: {
    reversalErrorRate: 0.30,   // High diagnostic importance for dyslexia / visual orientation
    readingAccuracy: 0.25,     // Word decoding & pronunciation accuracy
    readingFluencyWpm: 0.20,   // Speaking speed compared to grade benchmark
    pauseAndHesitation: 0.15,  // Hesitation / decoding effort indicator
    flashcardAccuracy: 0.10    // Baseline visual recognition accuracy
  },

  // Risk Category Cutoff Thresholds (Score range: 0 - 100)
  thresholds: {
    lowRiskMax: 34.9,          // 0 to 34.9 -> Low Risk
    moderateRiskMax: 64.9,     // 35.0 to 64.9 -> Moderate Risk
    // >= 65.0 -> High Risk
  },

  // Expected Oral Reading Fluency Benchmarks (Words Per Minute) by Grade / Age
  gradeWpmBenchmarks: {
    'K': { min: 20, target: 35, maxHesitationMs: 2500 },
    '1': { min: 35, target: 55, maxHesitationMs: 2200 },
    '2': { min: 60, target: 85, maxHesitationMs: 1800 },
    '3': { min: 80, target: 110, maxHesitationMs: 1500 },
    '4': { min: 100, target: 130, maxHesitationMs: 1300 },
    '5': { min: 115, target: 145, maxHesitationMs: 1200 },
    '6': { min: 130, target: 160, maxHesitationMs: 1100 },
    'default': { min: 50, target: 80, maxHesitationMs: 1800 }
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
