import { scoringConfig, getGradeBenchmark } from '../config/scoringConfig.js';

/**
 * Level 1 Rule-Based Screening Scoring Engine
 * 
 * Takes raw numeric features extracted from the test session and applies
 * configurable weighted formulas against grade-level developmental baselines.
 * 
 * @param {Object} rawFeatures
 * @param {string|number} grade
 * @param {Object} [customConfig] - Optional override config
 * @returns {Object} Computed score, risk category, breakdown, and plain-language interpretation
 */
export function computeLevel1Score(rawFeatures = {}, grade = '2', customConfig = scoringConfig) {
  const config = { ...scoringConfig, ...customConfig };
  const benchmark = getGradeBenchmark(grade);

  // 1. Extract & sanitize raw metrics
  const flashcardTotal = Number(rawFeatures.flashcardTotal) || 0;
  const flashcardCorrect = Number(rawFeatures.flashcardCorrect) || 0;
  const reversalAttempts = Number(rawFeatures.reversalAttempts) || 0;
  const reversalErrors = Number(rawFeatures.reversalErrors) || 0;
  const confusedPairs = rawFeatures.confusedPairs || []; // [{expected: 'b', actual: 'd', count: 2}]

  const readingDurationSec = Math.max(1, Number(rawFeatures.readingDurationSec) || 0);
  const readingTotalWords = Number(rawFeatures.readingTotalWords) || 0;
  const readingCorrectWords = Number(rawFeatures.readingCorrectWords) || 0;
  const pauseCount = Number(rawFeatures.pauseCount) || 0;
  const totalPauseDurationMs = Number(rawFeatures.totalPauseDurationMs) || 0;
  const averageHesitationMs = Number(rawFeatures.averageHesitationMs) || 0;

  // 2. Compute individual feature risk components (0 = no risk / perfect, 100 = high risk)

  // A. Flashcard General Accuracy Risk (0-100)
  const flashcardAccuracyPct = flashcardTotal > 0
    ? (flashcardCorrect / flashcardTotal) * 100
    : 100;
  const flashcardRisk = Math.max(0, Math.min(100, 100 - flashcardAccuracyPct));

  // B. Letter Reversal Error Risk (0-100)
  // Reversal errors (e.g. confusing b/d, p/q) are a strong indicator of visual-spatial processing difficulties
  let reversalErrorRatePct = 0;
  if (reversalAttempts > 0) {
    reversalErrorRatePct = (reversalErrors / reversalAttempts) * 100;
  }
  // Penalize reversal errors heavily; even a 25% reversal rate is significant
  const reversalRisk = Math.min(100, reversalErrorRatePct * 2.5);

  // C. Reading Accuracy Risk (0-100)
  const readingAccuracyPct = readingTotalWords > 0
    ? (readingCorrectWords / readingTotalWords) * 100
    : (flashcardAccuracyPct); // fallback if speech was skipped
  const readingAccuracyRisk = Math.max(0, Math.min(100, (100 - readingAccuracyPct) * 1.5));

  // D. Reading Fluency / WPM Risk (0-100)
  const calculatedWpm = readingDurationSec > 0 && readingTotalWords > 0
    ? Math.round((readingCorrectWords / readingDurationSec) * 60)
    : (rawFeatures.wpm ? Number(rawFeatures.wpm) : benchmark.target);

  let fluencyRisk = 0;
  if (calculatedWpm < benchmark.min) {
    // Below minimum expected for grade
    const deficitRatio = (benchmark.min - calculatedWpm) / benchmark.min;
    fluencyRisk = Math.min(100, 50 + deficitRatio * 50);
  } else if (calculatedWpm < benchmark.target) {
    // In moderate range between min and target
    const deficitRatio = (benchmark.target - calculatedWpm) / (benchmark.target - benchmark.min || 1);
    fluencyRisk = Math.min(50, deficitRatio * 50);
  } else {
    // Meets or exceeds target WPM
    fluencyRisk = 0;
  }

  // E. Pause & Hesitation Risk (0-100)
  // Hesitation frequency per minute
  const readingMinutes = readingDurationSec / 60;
  const pausesPerMinute = readingMinutes > 0 ? (pauseCount / readingMinutes) : 0;
  const pauseRisk = Math.min(100, pausesPerMinute * 12);

  const hesitationRisk = averageHesitationMs > benchmark.maxHesitationMs
    ? Math.min(100, ((averageHesitationMs - benchmark.maxHesitationMs) / 1000) * 25)
    : 0;

  const pauseAndHesitationRisk = Math.min(100, (pauseRisk * 0.6) + (hesitationRisk * 0.4));

  // 3. Calculate Weighted Composite Risk Score (0 - 100)
  const weights = config.weights;
  const compositeScore = Number((
    (reversalRisk * weights.reversalErrorRate) +
    (readingAccuracyRisk * weights.readingAccuracy) +
    (fluencyRisk * weights.readingFluencyWpm) +
    (pauseAndHesitationRisk * weights.pauseAndHesitation) +
    (flashcardRisk * weights.flashcardAccuracy)
  ).toFixed(1));

  // 4. Determine Risk Category
  let category = 'Low';
  let categoryColor = 'green';
  let badgeText = 'Low Screening Risk';

  if (compositeScore >= config.thresholds.moderateRiskMax) {
    category = 'High';
    categoryColor = 'rose';
    badgeText = 'High Screening Indicator';
  } else if (compositeScore > config.thresholds.lowRiskMax) {
    category = 'Moderate';
    categoryColor = 'amber';
    badgeText = 'Moderate Screening Indicator';
  }

  // 5. Generate Plain-Language Explanation & Actionable Guidance
  const explanation = generatePlainLanguageReport({
    category,
    compositeScore,
    grade,
    benchmark,
    calculatedWpm,
    readingAccuracyPct,
    reversalErrors,
    reversalAttempts,
    confusedPairs,
    pauseCount,
    averageHesitationMs
  });

  return {
    compositeScore,
    category,
    categoryColor,
    badgeText,
    timestamp: new Date().toISOString(),
    metrics: {
      calculatedWpm,
      targetWpm: benchmark.target,
      minWpm: benchmark.min,
      readingAccuracyPct: Math.round(readingAccuracyPct),
      flashcardAccuracyPct: Math.round(flashcardAccuracyPct),
      reversalErrorRatePct: Math.round(reversalErrorRatePct),
      reversalErrors,
      reversalAttempts,
      confusedPairs,
      pauseCount,
      totalPauseDurationMs,
      averageHesitationMs,
      readingDurationSec
    },
    riskBreakdown: {
      reversalRisk: Math.round(reversalRisk),
      readingAccuracyRisk: Math.round(readingAccuracyRisk),
      fluencyRisk: Math.round(fluencyRisk),
      pauseAndHesitationRisk: Math.round(pauseAndHesitationRisk),
      flashcardRisk: Math.round(flashcardRisk)
    },
    weightsApplied: weights,
    explanation,
    disclaimer: config.disclaimer
  };
}

/**
 * Builds parent & educator-friendly descriptions, strengths, and recommendations.
 */
function generatePlainLanguageReport(data) {
  const {
    category,
    compositeScore,
    grade,
    benchmark,
    calculatedWpm,
    readingAccuracyPct,
    reversalErrors,
    confusedPairs,
    pauseCount
  } = data;

  const strengths = [];
  const focusAreas = [];
  const recommendations = [];

  // Evaluate strengths & focus areas
  if (reversalErrors === 0) {
    strengths.push("Excellent visual orientation and letter discrimination with zero mirror-letter confusion.");
  } else {
    const pairsSummary = confusedPairs && confusedPairs.length > 0
      ? confusedPairs.map(p => `"${p.expected}" confused with "${p.actual}" (${p.count}x)`).join(', ')
      : `${reversalErrors} letter reversal(s) detected`;
    focusAreas.push(`Letter orientation confusion noted: ${pairsSummary}.`);
    recommendations.push("Engage in multi-sensory letter tracing (sand trays, textured letter cards, directional arrows for 'b' and 'd').");
  }

  if (calculatedWpm >= benchmark.target) {
    strengths.push(`Oral reading rate (${calculatedWpm} WPM) is on target or above expected benchmark for Grade ${grade} (${benchmark.target} WPM).`);
  } else if (calculatedWpm >= benchmark.min) {
    focusAreas.push(`Reading rate (${calculatedWpm} WPM) is developing and approaching the Grade ${grade} target of ${benchmark.target} WPM.`);
    recommendations.push("Practice paired reading / read-along sessions with highlighted text to boost reading speed naturally.");
  } else {
    focusAreas.push(`Reading rate (${calculatedWpm} WPM) is below the typical developmental threshold for Grade ${grade} (${benchmark.min} WPM).`);
    recommendations.push("Utilize structured phonetic decodable texts and adjust font spacing to reduce visual crowding.");
  }

  if (readingAccuracyPct >= 90) {
    strengths.push(`High word accuracy (${readingAccuracyPct}%) during the read-aloud assessment.`);
  } else {
    focusAreas.push(`Word decoding accuracy was ${readingAccuracyPct}%, indicating frequent substitutions or omissions.`);
    recommendations.push("Review phoneme-grapheme correspondences and syllabication strategies.");
  }

  if (pauseCount > 4) {
    focusAreas.push(`Observed ${pauseCount} significant pauses during reading, reflecting cognitive decoding effort.`);
  }

  // Category summary statement
  let summaryText = "";
  if (category === 'Low') {
    summaryText = `Performance is well within the typical developmental range for Grade ${grade}. Letter identification and reading fluency show strong age-appropriate skills.`;
    recommendations.push("Continue regular reading exposure and celebratory practice sessions.");
  } else if (category === 'Moderate') {
    summaryText = `Shows mild indicators of decoding friction or letter orientation confusion for Grade ${grade}. This is common during early literacy development but benefits from targeted support.`;
    recommendations.push("Incorporate structured multi-sensory phonics games and repeat assessments every 2–3 weeks to track growth.");
  } else {
    summaryText = `Shows notable patterns of letter reversal confusion, decoding hesitation, and reading fluency delay compared to Grade ${grade} expectations.`;
    recommendations.push("Consider sharing this screening summary with a school learning specialist, speech-language pathologist, or certified educational psychologist for formal diagnostic assessment.");
  }

  return {
    summary: summaryText,
    strengths,
    focusAreas,
    recommendations
  };
}
