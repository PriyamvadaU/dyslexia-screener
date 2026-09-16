/**
 * Reading & Speech Audio Feature Extractor
 * 
 * Extracts quantitative speech fluency, decoding accuracy, phonological alignment,
 * and acoustic pause telemetry from oral reading assessments.
 * Integrates Web Speech API text recognition and Web Audio API pause/silence data.
 */

import { getGradeBenchmark } from '../config/scoringConfig.js';

/**
 * Extracts comprehensive reading features from speech transcript and audio metrics
 * 
 * @param {Object} params
 * @param {string} params.transcript - Spoken text transcript from speech recognition
 * @param {string} params.targetPassage - Reference text passage for the assessment
 * @param {number} [params.durationSec=1] - Audio recording duration in seconds
 * @param {number} [params.pauseCount=0] - Number of hesitations/pauses (>1.8s)
 * @param {number} [params.totalPauseDurationMs=0] - Total silence/pause duration in ms
 * @param {number} [params.averageHesitationMs=0] - Average hesitation latency in ms
 * @param {Object} [params.audioTelemetry] - Optional Web Audio API volume/silence telemetry
 * @param {string|number} [params.grade='2'] - Student grade level
 * @returns {Object} Extracted reading features, alignment breakdown, and reading risk score
 */
export function extractReadingFeatures({
  transcript = '',
  targetPassage = '',
  durationSec = 1,
  pauseCount = 0,
  totalPauseDurationMs = 0,
  averageHesitationMs = 0,
  audioTelemetry = {},
  grade = '2'
} = {}) {
  const benchmark = getGradeBenchmark(grade);
  const cleanDurationSec = Math.max(1, Number(durationSec) || 1);

  // 1. Tokenize & Clean Text
  const targetWords = cleanAndTokenize(targetPassage);
  const spokenWords = cleanAndTokenize(transcript);

  const totalTargetWords = targetWords.length;
  const totalSpokenWords = spokenWords.length;

  // 2. Word Sequence Alignment & Error Classification
  const alignment = alignWordSequences(targetWords, spokenWords);
  const correctWordsCount = alignment.correctWordsCount;
  const substitutionErrors = alignment.substitutionErrors;
  const omissionErrors = alignment.omissionErrors;
  const insertionErrors = alignment.insertionErrors;

  // Word Decoding Accuracy (%)
  const decodingAccuracyPct = totalTargetWords > 0
    ? Number(((correctWordsCount / totalTargetWords) * 100).toFixed(1))
    : 100;

  // 3. Oral Reading Fluency (WPM)
  const durationMinutes = cleanDurationSec / 60;
  const rawWpm = durationMinutes > 0
    ? Math.round((correctWordsCount / durationMinutes))
    : 0;

  // Normalization against developmental grade benchmark
  let fluencyRisk = 0;
  let fluencyStatus = 'on_target';

  if (rawWpm < benchmark.min) {
    const deficitRatio = (benchmark.min - rawWpm) / benchmark.min;
    fluencyRisk = Math.min(100, 50 + deficitRatio * 50);
    fluencyStatus = 'below_minimum';
  } else if (rawWpm < benchmark.target) {
    const deficitRatio = (benchmark.target - rawWpm) / ((benchmark.target - benchmark.min) || 1);
    fluencyRisk = Math.min(50, deficitRatio * 50);
    fluencyStatus = 'developing';
  } else {
    fluencyRisk = 0;
    fluencyStatus = 'fluent';
  }

  // 4. Acoustic Pause & Silence Telemetry
  const pausesPerMinute = durationMinutes > 0
    ? Number((pauseCount / durationMinutes).toFixed(2))
    : 0;

  const totalPauseDurationSec = totalPauseDurationMs > 0 ? (totalPauseDurationMs / 1000) : (audioTelemetry.silenceDurationSec || 0);
  const silenceRatio = Number((Math.min(1.0, totalPauseDurationSec / cleanDurationSec)).toFixed(3));

  const hesitationMs = averageHesitationMs || (pauseCount > 0 ? (totalPauseDurationMs / pauseCount) : 0);
  const excessHesitationMs = Math.max(0, hesitationMs - benchmark.maxHesitationMs);

  // Pause Risk Computation (0-100)
  const pauseFrequencyRisk = Math.min(100, pausesPerMinute * 14);
  const silenceRatioRisk = Math.min(100, silenceRatio * 150);
  const hesitationDurationRisk = Math.min(100, (excessHesitationMs / 1000) * 35);
  const aggregatePauseRisk = Number(Math.min(100, (pauseFrequencyRisk * 0.45) + (silenceRatioRisk * 0.35) + (hesitationDurationRisk * 0.20)).toFixed(1));

  // 5. Decoding Accuracy Risk Computation (0-100)
  const decodingRisk = Number(Math.max(0, Math.min(100, (100 - decodingAccuracyPct) * 1.6)).toFixed(1));

  // 6. Overall Composite Reading Risk Score (0 - 100)
  // 40% Fluency Deficit, 35% Decoding Accuracy Deficit, 25% Pause/Hesitation Friction
  const readingRiskScore = Number(Math.max(0, Math.min(100,
    (fluencyRisk * 0.40) +
    (decodingRisk * 0.35) +
    (aggregatePauseRisk * 0.25)
  )).toFixed(1));

  return {
    calculatedWpm: rawWpm,
    targetWpm: benchmark.target,
    minWpm: benchmark.min,
    fluencyStatus,
    durationSec: cleanDurationSec,
    totalTargetWords,
    totalSpokenWords,
    correctWordsCount,
    decodingAccuracyPct,
    errorCounts: {
      substitutions: substitutionErrors.length,
      omissions: omissionErrors.length,
      insertions: insertionErrors.length
    },
    errorDetails: {
      substitutions: substitutionErrors.slice(0, 10),
      omissions: omissionErrors.slice(0, 10),
      insertions: insertionErrors.slice(0, 10)
    },
    pauses: {
      count: pauseCount,
      pausesPerMinute,
      totalPauseDurationMs: Math.round(totalPauseDurationSec * 1000),
      silenceRatio,
      averageHesitationMs: Math.round(hesitationMs),
      maxExpectedHesitationMs: benchmark.maxHesitationMs
    },
    readingRiskScore,
    riskBreakdown: {
      fluencyRisk: Math.round(fluencyRisk),
      decodingRisk: Math.round(decodingRisk),
      pauseRisk: Math.round(aggregatePauseRisk)
    },
    transcriptSanitized: transcript.trim()
  };
}

/**
 * Tokenizes text into lowercase normalized alphanumeric words
 */
function cleanAndTokenize(text = '') {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Computes Levenshtein-based sequence alignment between target words and spoken words
 */
function alignWordSequences(targetWords = [], spokenWords = []) {
  const m = targetWords.length;
  const n = spokenWords.length;

  if (m === 0) {
    return {
      correctWordsCount: 0,
      substitutionErrors: [],
      omissionErrors: [],
      insertionErrors: spokenWords.map(w => ({ word: w }))
    };
  }

  if (n === 0) {
    return {
      correctWordsCount: 0,
      substitutionErrors: [],
      omissionErrors: targetWords.map(w => ({ expected: w })),
      insertionErrors: []
    };
  }

  // Dynamic programming alignment table
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetWords[i - 1] === spokenWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // substitution
          dp[i - 1][j],     // omission
          dp[i][j - 1]      // insertion
        );
      }
    }
  }

  // Backtrack to extract aligned error items
  let i = m;
  let j = n;
  let correctWordsCount = 0;
  const substitutionErrors = [];
  const omissionErrors = [];
  const insertionErrors = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && targetWords[i - 1] === spokenWords[j - 1]) {
      correctWordsCount++;
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      substitutionErrors.unshift({
        expected: targetWords[i - 1],
        actual: spokenWords[j - 1],
        index: i - 1
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      omissionErrors.unshift({
        expected: targetWords[i - 1],
        index: i - 1
      });
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      insertionErrors.unshift({
        actual: spokenWords[j - 1],
        nearIndex: i
      });
      j--;
    } else {
      if (i > 0) i--;
      if (j > 0) j--;
    }
  }

  return {
    correctWordsCount,
    substitutionErrors,
    omissionErrors,
    insertionErrors
  };
}
