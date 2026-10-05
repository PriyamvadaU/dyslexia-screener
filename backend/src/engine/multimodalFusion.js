/**
 * Novel Multimodal Fusion Scoring Engine
 * 
 * Fuses heterogeneous behavioral biometrics across 4 modalities:
 * 1. Handwriting Kinematics (motor stability, stroke jitter, velocity CV, pen lifts)
 * 2. Oral Reading Fluency & Acoustic Pauses (WPM, silence ratio, hesitations)
 * 3. Phonological & Decoding Accuracy (word substitutions, omissions)
 * 4. Visual-Spatial Discrimination (mirror-letter reversals: b/d, p/q, m/w)
 * 
 * Features dynamic weight normalization across present modalities and
 * grade-adjusted developmental baseline curves.
 */

import { scoringConfig, getGradeBenchmark } from '../config/scoringConfig.js';
import { extractHandwritingFeatures } from './handwritingFeatureExtractor.js';
import { extractReadingFeatures } from './readingFeatureExtractor.js';
import { extractReversalFeatures } from './reversalFeatureExtractor.js';

/**
 * Fuses multimodal features into a unified screening risk assessment
 * 
 * @param {Object} rawData - Raw inputs from all modalities
 * @param {string|number} [grade='2'] - Student grade level
 * @param {Object} [customConfig] - Optional educator config overrides
 * @returns {Object} Fused multimodal assessment report
 */
export function computeMultimodalScore(rawData = {}, grade = '2', customConfig = scoringConfig) {
  const config = { ...scoringConfig, ...customConfig };
  const benchmark = getGradeBenchmark(grade);

  // 1. Process Modality 1: Handwriting Kinematics (if provided)
  const hasHandwriting = Boolean(
    rawData.handwritingStrokes || 
    rawData.writingTelemetry || 
    (rawData.handwriting && Object.keys(rawData.handwriting).length > 0)
  );

  let hwMetrics;
  if (hasHandwriting) {
    const rawStrokes = rawData.handwritingStrokes || rawData.writingTelemetry?.strokes || rawData.handwriting?.strokes || [];
    const targetChar = rawData.writingTarget || rawData.handwriting?.charTarget || 'b';
    const canvasBounds = rawData.canvasBounds || { width: 360, height: 260 };
    const durationSec = rawData.writingDurationSec || rawData.handwriting?.durationSec || 0;
    hwMetrics = extractHandwritingFeatures(rawStrokes, targetChar, canvasBounds, durationSec);
  } else if (typeof rawData.handwritingRiskScore === 'number') {
    hwMetrics = {
      handwritingRiskScore: rawData.handwritingRiskScore,
      strokeConsistencyScore: rawData.strokeConsistencyScore || 85,
      directionalJitterIndex: rawData.directionalJitterIndex || 0.4,
      velocityVariationCV: rawData.velocityVariationCV || 0.5,
      penLifts: rawData.penLifts || 1,
      totalDurationSec: rawData.writingDurationSec || 5
    };
  }

  // 2. Process Modality 2 & 3: Reading Fluency & Decoding Speech
  let readingMetrics;
  if (rawData.readingTelemetry || rawData.transcript || rawData.targetPassage) {
    readingMetrics = extractReadingFeatures({
      transcript: rawData.transcript || rawData.readingTelemetry?.transcript || '',
      targetPassage: rawData.targetPassage || rawData.readingTelemetry?.targetPassage || '',
      durationSec: rawData.readingDurationSec || rawData.readingTelemetry?.durationSec || 1,
      pauseCount: rawData.pauseCount || rawData.readingTelemetry?.pauseCount || 0,
      totalPauseDurationMs: rawData.totalPauseDurationMs || rawData.readingTelemetry?.totalPauseDurationMs || 0,
      averageHesitationMs: rawData.averageHesitationMs || rawData.readingTelemetry?.averageHesitationMs || 0,
      audioTelemetry: rawData.audioTelemetry || {},
      readingAnalysis: rawData.readingAnalysis || rawData.readingTelemetry?.readingAnalysis,
      grade
    });
  } else {
    // Legacy / direct rawFeatures fallback
    const readingDurationSec = Math.max(1, Number(rawData.readingDurationSec) || 0);
    const readingTotalWords = Number(rawData.readingTotalWords) || 0;
    const readingCorrectWords = Number(rawData.readingCorrectWords) || 0;
    const calculatedWpm = readingDurationSec > 0 && readingTotalWords > 0
      ? Math.round((readingCorrectWords / readingDurationSec) * 60)
      : (rawData.wpm ? Number(rawData.wpm) : benchmark.target);

    const readingAccuracyPct = readingTotalWords > 0
      ? (readingCorrectWords / readingTotalWords) * 100
      : 100;

    let fluencyRisk = 0;
    if (calculatedWpm < benchmark.min) {
      fluencyRisk = Math.min(100, 50 + ((benchmark.min - calculatedWpm) / benchmark.min) * 50);
    } else if (calculatedWpm < benchmark.target) {
      fluencyRisk = Math.min(50, ((benchmark.target - calculatedWpm) / (benchmark.target - benchmark.min || 1)) * 50);
    }

    const decodingRisk = Math.max(0, Math.min(100, (100 - readingAccuracyPct) * 1.5));
    const pauseCount = Number(rawData.pauseCount) || 0;
    const pauseRisk = Math.min(100, (pauseCount / (readingDurationSec / 60 || 1)) * 12);

    readingMetrics = {
      calculatedWpm,
      targetWpm: benchmark.target,
      minWpm: benchmark.min,
      durationSec: readingDurationSec,
      totalTargetWords: readingTotalWords,
      correctWordsCount: readingCorrectWords,
      decodingAccuracyPct: Math.round(readingAccuracyPct),
      pauses: {
        count: pauseCount,
        totalPauseDurationMs: Number(rawData.totalPauseDurationMs) || 0,
        averageHesitationMs: Number(rawData.averageHesitationMs) || 0
      },
      readingRiskScore: Number(((fluencyRisk * 0.45) + (decodingRisk * 0.35) + (pauseRisk * 0.20)).toFixed(1)),
      riskBreakdown: {
        fluencyRisk: Math.round(fluencyRisk),
        decodingRisk: Math.round(decodingRisk),
        pauseRisk: Math.round(pauseRisk)
      }
    };
  }

  // 3. Process Modality 4: Letter Reversal & Flashcard Discrimination
  let reversalMetrics;
  if (Array.isArray(rawData.flashcardResults)) {
    reversalMetrics = extractReversalFeatures(rawData.flashcardResults, rawData.confusedPairs);
  } else {
    const flashcardTotal = Number(rawData.flashcardTotal) || 0;
    const flashcardCorrect = Number(rawData.flashcardCorrect) || 0;
    const reversalAttempts = Number(rawData.reversalAttempts) || 0;
    const reversalErrors = Number(rawData.reversalErrors) || 0;
    const flashcardAccuracyPct = flashcardTotal > 0 ? (flashcardCorrect / flashcardTotal) * 100 : 100;
    const reversalErrorRatePct = reversalAttempts > 0 ? (reversalErrors / reversalAttempts) * 100 : 0;
    const reversalRiskScore = Math.min(100, reversalErrorRatePct * 2.5);
    const generalVisualRiskScore = Math.max(0, 100 - flashcardAccuracyPct);

    reversalMetrics = {
      totalCards: flashcardTotal,
      correctCards: flashcardCorrect,
      accuracyPct: Math.round(flashcardAccuracyPct),
      reversalAttempts,
      reversalErrors,
      reversalErrorRatePct: Math.round(reversalErrorRatePct),
      avgReactionTimeMs: Number(rawData.averageHesitationMs) || 1200,
      confusedPairs: rawData.confusedPairs || [],
      reversalRiskScore,
      generalVisualRiskScore
    };
  }

  // 4. Adaptive Multimodal Fusion: Weight Normalization
  // Identify active modality risk components
  const activeComponents = {
    reversalErrorRate: {
      rawScore: reversalMetrics.reversalRiskScore,
      nominalWeight: config.weights.reversalErrorRate
    },
    readingAccuracy: {
      rawScore: readingMetrics.riskBreakdown?.decodingRisk ?? (100 - readingMetrics.decodingAccuracyPct),
      nominalWeight: config.weights.readingAccuracy
    },
    readingFluencyWpm: {
      rawScore: readingMetrics.riskBreakdown?.fluencyRisk ?? 0,
      nominalWeight: config.weights.readingFluencyWpm
    },
    pauseAndHesitation: {
      rawScore: readingMetrics.riskBreakdown?.pauseRisk ?? 0,
      nominalWeight: config.weights.pauseAndHesitation
    },
    flashcardAccuracy: {
      rawScore: reversalMetrics.generalVisualRiskScore,
      nominalWeight: config.weights.flashcardAccuracy
    }
  };

  if (hwMetrics && typeof hwMetrics.handwritingRiskScore === 'number') {
    activeComponents.handwritingKinematics = {
      rawScore: hwMetrics.handwritingRiskScore,
      nominalWeight: config.weights.handwritingKinematics
    };
  }

  // Dynamically normalize weights so they sum exactly to 1.0
  const nominalWeightSum = Object.values(activeComponents).reduce((acc, c) => acc + c.nominalWeight, 0);
  const normalizedWeights = {};
  let compositeScore = 0;

  Object.entries(activeComponents).forEach(([key, comp]) => {
    const normWeight = comp.nominalWeight / (nominalWeightSum || 1);
    normalizedWeights[key] = Number(normWeight.toFixed(4));
    compositeScore += comp.rawScore * normWeight;
  });

  compositeScore = Number(Math.max(0, Math.min(100, compositeScore)).toFixed(1));

  // 5. Categorize Risk
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

  // 6. Generate Clinical & Educational Report
  const explanation = generateMultimodalReport({
    category,
    compositeScore,
    grade,
    benchmark,
    readingMetrics,
    reversalMetrics,
    hwMetrics
  });

  return {
    compositeScore,
    category,
    categoryColor,
    badgeText,
    timestamp: new Date().toISOString(),
    isMultimodal: Boolean(hwMetrics),
    modalitiesIncluded: Object.keys(activeComponents),
    weightsApplied: normalizedWeights,
    metrics: {
      // Reading
      calculatedWpm: readingMetrics.calculatedWpm,
      targetWpm: benchmark.target,
      minWpm: benchmark.min,
      readingAccuracyPct: readingMetrics.decodingAccuracyPct,
      readingDurationSec: readingMetrics.durationSec,
      totalTargetWords: readingMetrics.totalTargetWords,
      correctWordsCount: readingMetrics.correctWordsCount,
      pauseCount: readingMetrics.pauses?.count || 0,
      totalPauseDurationMs: readingMetrics.pauses?.totalPauseDurationMs || 0,
      averageHesitationMs: readingMetrics.pauses?.averageHesitationMs || 0,
      errorCounts: readingMetrics.errorCounts,
      // Reversals & Visual
      flashcardAccuracyPct: reversalMetrics.accuracyPct,
      reversalErrorRatePct: reversalMetrics.reversalErrorRatePct,
      reversalErrors: reversalMetrics.reversalErrors,
      reversalAttempts: reversalMetrics.reversalAttempts,
      confusedPairs: reversalMetrics.confusedPairs,
      // Handwriting (if available)
      handwriting: hwMetrics || null
    },
    riskBreakdown: {
      reversalRisk: Math.round(activeComponents.reversalErrorRate.rawScore),
      readingAccuracyRisk: Math.round(activeComponents.readingAccuracy.rawScore),
      fluencyRisk: Math.round(activeComponents.readingFluencyWpm.rawScore),
      pauseAndHesitationRisk: Math.round(activeComponents.pauseAndHesitation.rawScore),
      flashcardRisk: Math.round(activeComponents.flashcardAccuracy.rawScore),
      handwritingRisk: hwMetrics ? Math.round(hwMetrics.handwritingRiskScore) : null
    },
    explanation,
    disclaimer: config.disclaimer
  };
}

/**
 * Builds clinical & pedagogical feedback from multimodal signals
 */
function generateMultimodalReport({
  category,
  compositeScore,
  grade,
  benchmark,
  readingMetrics,
  reversalMetrics,
  hwMetrics
}) {
  const strengths = [];
  const focusAreas = [];
  const recommendations = [];

  // 1. Reversals
  if (reversalMetrics.reversalErrors === 0) {
    strengths.push("Excellent visual-spatial letter orientation with zero mirror-letter confusion (b/d, p/q).");
  } else {
    const pairsSummary = reversalMetrics.confusedPairs.length > 0
      ? reversalMetrics.confusedPairs.map(p => `"${p.expected}" confused with "${p.actual}" (${p.count}x)`).join(', ')
      : `${reversalMetrics.reversalErrors} mirror reversal(s) detected`;
    focusAreas.push(`Letter orientation confusion noted: ${pairsSummary}.`);
    recommendations.push("Engage in multi-sensory letter formation (sand trays, textured letter cards, directional cues for 'b' and 'd').");
  }

  // 2. Reading Fluency & WPM
  if (readingMetrics.calculatedWpm >= benchmark.target) {
    strengths.push(`Oral reading fluency (${readingMetrics.calculatedWpm} WPM) meets or exceeds developmental target for Grade ${grade} (${benchmark.target} WPM).`);
  } else if (readingMetrics.calculatedWpm >= benchmark.min) {
    focusAreas.push(`Reading fluency (${readingMetrics.calculatedWpm} WPM) is developing and approaching the Grade ${grade} target of ${benchmark.target} WPM.`);
    recommendations.push("Practice paired read-along sessions with word-by-word highlighting to increase reading cadence.");
  } else {
    focusAreas.push(`Reading rate (${readingMetrics.calculatedWpm} WPM) is below developmental baseline for Grade ${grade} (${benchmark.min} WPM).`);
    recommendations.push("Use structured decodable texts with increased letter-spacing to ease visual crowding.");
  }

  // 3. Word Decoding Accuracy
  if (readingMetrics.decodingAccuracyPct >= 90) {
    strengths.push(`High word decoding accuracy (${readingMetrics.decodingAccuracyPct}%) during oral reading.`);
  } else {
    focusAreas.push(`Word decoding accuracy was ${readingMetrics.decodingAccuracyPct}%, indicating frequent substitutions or omissions.`);
    recommendations.push("Review phoneme-grapheme associations and syllable chunking techniques.");
  }

  // 4. Handwriting Kinematics (if tested)
  if (hwMetrics) {
    if (hwMetrics.strokeConsistencyScore >= 75) {
      strengths.push(`Smooth fine-motor control during handwriting tracing (Consistency Index: ${hwMetrics.strokeConsistencyScore}/100).`);
    } else {
      focusAreas.push(`Elevated stroke tremor/jitter or erratic pen velocity observed during letter tracing (Consistency: ${hwMetrics.strokeConsistencyScore}/100).`);
      recommendations.push("Incorporate pre-writing grip exercises and large gross-motor air-drawing drills to stabilize stroke fluidity.");
    }

    if (hwMetrics.spatial?.isSuspectedReversal) {
      focusAreas.push(`Handwriting stroke distribution mirrors the opposite letter orientation for '${hwMetrics.charTarget}'.`);
      recommendations.push("Use visual anchor points (e.g., 'start at the top dot') when tracing confusable letters.");
    }
  }

  // 5. Category Summary
  let summaryText = "";
  if (category === 'Low') {
    summaryText = `Performance is well within the expected developmental baseline for Grade ${grade}. Visual orientation, oral fluency, and motor consistency show strong age-appropriate skills.`;
    recommendations.push("Continue regular reading exposure and encouraging literacy games.");
  } else if (category === 'Moderate') {
    summaryText = `Shows mild friction in decoding speed, letter orientation, or stroke consistency for Grade ${grade}. Common during early literacy phases but benefits from targeted multi-sensory support.`;
    recommendations.push("Engage in structured phonics drills and repeat screening every 2–3 weeks to track progress.");
  } else {
    summaryText = `Shows notable patterns of mirror-letter confusion, decoding latency, and reading fluency delay compared to Grade ${grade} norms.`;
    recommendations.push("Consider sharing this screening summary with an educational specialist, reading therapist, or licensed educational psychologist for a comprehensive clinical assessment.");
  }

  return {
    summary: summaryText,
    strengths,
    focusAreas,
    recommendations
  };
}
