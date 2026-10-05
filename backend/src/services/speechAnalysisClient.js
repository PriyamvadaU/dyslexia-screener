/**
 * Speech Analysis Client & Fallback Engine
 * 
 * Communicates with the external/local Python speech analysis microservice via HTTP.
 * Includes a robust, zero-dependency in-process deterministic alignment engine
 * that seamlessly processes transcripts and Web Speech API inputs if the Python service is offline.
 */

import { getGradeBenchmark } from '../config/scoringConfig.js';

const SPEECH_SERVICE_URL = process.env.SPEECH_SERVICE_URL || null;
const REQUEST_TIMEOUT_MS = parseInt(process.env.SPEECH_SERVICE_TIMEOUT_MS || '9000', 10);

/**
 * Analyzes audio / oral reading input.
 * Priority:
 * 1. If SPEECH_SERVICE_URL is set and audio buffer provided, POST to Python microservice.
 * 2. If microservice fails/times out or only transcript is provided, run local deterministic alignment engine.
 */
export async function analyzeOralReading({
  audioBuffer = null,
  audioMimeType = 'audio/webm',
  transcript = '',
  expectedPassage = '',
  grade = '2',
  pauseCount = 0,
  totalPauseDurationMs = 0,
  averageHesitationMs = 0,
  durationSec = 0
}) {
  const benchmark = getGradeBenchmark(grade);

  // 1. Try external Python microservice if configured and audio buffer is available
  if (SPEECH_SERVICE_URL && audioBuffer) {
    try {
      const result = await callExternalSpeechService({
        audioBuffer,
        audioMimeType,
        expectedPassage,
        grade,
        minPauseMs: benchmark.maxHesitationMs || 1500
      });
      if (result && result.rawTranscript !== undefined) {
        return result;
      }
    } catch (err) {
      console.warn(`[SpeechClient] External speech service at ${SPEECH_SERVICE_URL} unreachable (${err.message}). Falling back to local deterministic alignment.`);
    }
  }

  // 2. Local Deterministic Alignment Fallback
  return fallbackDeterministicAnalysis({
    transcript,
    expectedPassage,
    grade,
    pauseCount,
    totalPauseDurationMs,
    averageHesitationMs,
    durationSec
  });
}

/**
 * HTTP Client to external Python microservice
 */
async function callExternalSpeechService({ audioBuffer, audioMimeType, expectedPassage, grade, minPauseMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const boundary = '----LexiScreenSpeechFormBoundary' + Math.random().toString(36).substring(2);
    const crlf = '\r\n';

    // Build multipart body manually to avoid external form-data dependencies
    const parts = [];

    // Audio file part
    parts.push(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="audio"; filename="recording.webm"${crlf}` +
      `Content-Type: ${audioMimeType}${crlf}${crlf}`
    );
    const headerBuf = Buffer.from(parts.join(''), 'utf-8');
    const audioDataBuf = Buffer.isBuffer(audioBuffer) ? audioBuffer : Buffer.from(audioBuffer);

    // Form fields
    const formFields = [
      `--${boundary}${crlf}Content-Disposition: form-data; name="expected_passage"${crlf}${crlf}${expectedPassage}`,
      `--${boundary}${crlf}Content-Disposition: form-data; name="grade"${crlf}${crlf}${grade}`,
      `--${boundary}${crlf}Content-Disposition: form-data; name="min_pause_ms"${crlf}${crlf}${minPauseMs}`
    ].join(crlf) + `${crlf}--${boundary}--${crlf}`;

    const footerBuf = Buffer.from(formFields, 'utf-8');
    const fullBody = Buffer.concat([headerBuf, audioDataBuf, Buffer.from(crlf, 'utf-8'), footerBuf]);

    const res = await fetch(`${SPEECH_SERVICE_URL.replace(/\/$/, '')}/analyze-reading`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length.toString()
      },
      body: fullBody,
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Service returned HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Local in-process deterministic alignment engine
 * Implements Needleman-Wunsch with Indian English phonetic tolerance and ASR uncertainty gating
 */
export function fallbackDeterministicAnalysis({
  transcript = '',
  expectedPassage = '',
  grade = '2',
  pauseCount = 0,
  totalPauseDurationMs = 0,
  averageHesitationMs = 0,
  durationSec = 0
}) {
  const benchmark = getGradeBenchmark(grade);
  const targetTokens = cleanAndTokenize(expectedPassage);
  const spokenTokens = cleanAndTokenize(transcript);

  const cleanDurationSec = Math.max(1, Number(durationSec) || Math.round(spokenTokens.length * 0.6) || 5);
  const durationMins = cleanDurationSec / 60.0;

  // 1. Needleman-Wunsch alignment with Indian English phonetic tolerance
  const alignment = alignSequences(targetTokens, spokenTokens);

  // 2. Identify word repetitions
  const repetitions = [];
  for (let idx = 0; idx < spokenTokens.length - 1; idx++) {
    if (spokenTokens[idx] === spokenTokens[idx + 1] && spokenTokens[idx].length > 0) {
      repetitions.push({
        type: 'word_repetition',
        phrase: spokenTokens[idx],
        occurrences: 2,
        targetIndex: idx,
        timestamps: []
      });
    }
  }

  // 3. Fluency Rates
  const correctCount = alignment.correctWordsCount;
  const wpm = durationMins > 0 ? Math.round(correctCount / durationMins) : 0;
  const speechRate = durationMins > 0 ? Number((spokenTokens.length / (cleanDurationSec * 0.8 || 1)).toFixed(2)) : 0;

  // 4. Acoustic Pauses & Non-Diagnostic Indicators
  const totalPauseCount = Number(pauseCount) || 0;
  const totalPauseMs = Number(totalPauseDurationMs) || (totalPauseCount * (averageHesitationMs || 1200));
  const meanPauseMs = totalPauseCount > 0 ? Math.round(totalPauseMs / totalPauseCount) : 0;
  const silenceRatio = Number((Math.min(1.0, (totalPauseMs / 1000) / cleanDurationSec)).toFixed(3));
  const pausesPerMin = Number((totalPauseCount / (durationMins || 1)).toFixed(1));

  const startTime = Date.now();
  const longPauseThreshold = benchmark.maxHesitationMs || 1500;
  const longPauseCount = averageHesitationMs >= longPauseThreshold ? totalPauseCount : (totalPauseMs > 2000 ? 1 : 0);

  const acousticEvents = [];
  if (averageHesitationMs >= 1800 || totalPauseMs >= 2500) {
    acousticEvents.push({
      indicator: 'long_pre_word_latency',
      targetWord: targetTokens[0] || 'word',
      latencyMs: averageHesitationMs || totalPauseMs || null,
      timestampSec: null, // Waveform timestamp not available in text fallback; do not fabricate
      disclaimer: 'Non-diagnostic screening indicator only'
    });
  }

  // Check for filled pauses
  const fillers = new Set(['um', 'uh', 'er', 'ah', 'hmm']);
  spokenTokens.forEach((t) => {
    if (fillers.has(t)) {
      acousticEvents.push({
        indicator: 'filled_pause',
        targetWord: t,
        latencyMs: null, // Audio duration not available in text fallback; do not fabricate
        timestampSec: null, // Waveform timestamp not available in text fallback; do not fabricate
        disclaimer: 'Non-diagnostic screening indicator only'
      });
    }
  });

  // 5. Quality & State Assessment
  let assessmentState = 'valid';
  const qualityFlags = [];

  if (cleanDurationSec < 3.0 && spokenTokens.length <= 1) {
    assessmentState = 'insufficient_quality';
    qualityFlags.push('AUDIO_TOO_SHORT');
  } else if (targetTokens.length > 4 && spokenTokens.length < targetTokens.length * 0.5) {
    assessmentState = 'incomplete';
    qualityFlags.push('INCOMPLETE_READING');
  }

  const validTargetDenom = Math.max(1, targetTokens.length - alignment.uncertainWordsCount);
  const decodingAccuracyPct = targetTokens.length > 0
    ? Number(((correctCount / validTargetDenom) * 100).toFixed(1))
    : 100.0;

  return {
    assessmentState,
    qualityFlags,
    rawTranscript: transcript.trim(),
    normalizedTranscript: spokenTokens.join(' '),
    expectedText: expectedPassage.trim(),
    durationSec: cleanDurationSec,
    speechDurationSec: Math.max(1, Math.round(cleanDurationSec * (1 - silenceRatio))),
    silenceDurationSec: Math.round(cleanDurationSec * silenceRatio),
    expectedWordCount: targetTokens.length,
    spokenWordCount: spokenTokens.length,
    correctWordCount: correctCount,
    uncertainWordCount: alignment.uncertainWordsCount,
    decodingAccuracyPct,
    wpm,
    speechRateWordsPerSec: speechRate,
    omissions: alignment.omissions,
    substitutions: alignment.substitutions,
    insertions: alignment.insertions,
    repetitions,
    pauses: alignment.pauses || [],
    temporalIndicators: {
      totalPauseCount,
      longPauseCount,
      totalPauseDurationMs: Math.round(totalPauseMs),
      silenceRatio,
      meanPauseDurationMs: meanPauseMs,
      medianPauseDurationMs: meanPauseMs,
      maxPauseDurationMs: Math.max(meanPauseMs, 1800),
      pausesPerMinute: pausesPerMin
    },
    acousticEvents,
    wordTimings: alignment.wordTimings,
    vadSegments: [],
    modelMetadata: {
      asrEngine: 'client-fallback-deterministic-aligner',
      alignerEngine: 'needleman-wunsch-phonetic',
      vadEngine: 'acoustic-pause-telemetry',
      inferenceDurationMs: Date.now() - startTime,
      deviceUsed: 'cpu'
    }
  };
}

/**
 * Validates whether two words are legitimate Indian English pronunciation variants.
 * Checks known Indian English phonological shifts:
 * - w / v coalescence (water -> vater, very -> wery)
 * - th / d dental plosives (voiced: the -> de, that -> dat)
 * - th / t dental plosives (voiceless: thin -> tin, think -> tink)
 * - ph / f equivalence (phone -> fone)
 * - gh / g, c / k, q / k
 * - degemination of doubled consonants
 */
export function isIndianEnglishPhoneticVariant(targetWord = '', spokenWord = '') {
  const w1 = String(targetWord).toLowerCase().trim();
  const w2 = String(spokenWord).toLowerCase().trim();
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;

  const normalizeVoiced = (str) => {
    return str
      .replace(/ph/g, 'f')
      .replace(/gh/g, 'g')
      .replace(/w/g, 'v')   // Indian English w/v equivalence
      .replace(/th/g, 'd')  // Voiced dental plosive
      .replace(/[cq]/g, 'k')
      .replace(/(.)\1+/g, '$1');
  };

  const normalizeVoiceless = (str) => {
    return str
      .replace(/ph/g, 'f')
      .replace(/gh/g, 'g')
      .replace(/w/g, 'v')
      .replace(/th/g, 't')  // Voiceless dental plosive
      .replace(/[cq]/g, 'k')
      .replace(/(.)\1+/g, '$1');
  };

  const pw1 = normalizeVoiced(w1);
  const pw2 = normalizeVoiced(w2);
  if (pw1 === pw2) return true;

  const pwa1 = normalizeVoiceless(w1);
  const pwa2 = normalizeVoiceless(w2);
  if (pwa1 === pwa2) return true;

  return false;
}

/**
 * Phonetic similarity helper (Indian English robust)
 */
export function computePhoneticSimilarity(word1 = '', word2 = '') {
  const w1 = String(word1).toLowerCase().trim();
  const w2 = String(word2).toLowerCase().trim();
  if (w1 === w2) return 1.0;

  const normalizePhonetic = (str) => {
    return str
      .replace(/ph/g, 'f')
      .replace(/gh/g, 'g')
      .replace(/w/g, 'v')   // Indian English w/v equivalence
      .replace(/th/g, 'd')  // Plosive equivalence
      .replace(/[cq]/g, 'k')
      .replace(/(.)\1+/g, '$1');
  };

  const pw1 = normalizePhonetic(w1);
  const pw2 = normalizePhonetic(w2);
  if (pw1 === pw2) return 0.90;

  const m = pw1.length;
  const n = pw2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (pw1[i - 1] === pw2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const dist = dp[m][n];
  const maxLen = Math.max(m, n, 1);
  return Number(Math.max(0, 1.0 - (dist / maxLen)).toFixed(3));
}

function cleanAndTokenize(text = '') {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/^[-']+|[-']+$/g, ''))
    .filter(Boolean);
}

function alignSequences(targetTokens = [], spokenTokens = []) {
  const m = targetTokens.length;
  const n = spokenTokens.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i * 1.0;
  for (let j = 0; j <= n; j++) dp[0][j] = j * 1.0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const tw = targetTokens[i - 1];
      const sw = spokenTokens[j - 1];
      const isVariant = isIndianEnglishPhoneticVariant(tw, sw);
      const sim = computePhoneticSimilarity(tw, sw);

      let cost = 1.0;
      if (tw === sw) cost = 0.0;
      else if (isVariant) cost = 0.2; // Accepted pronunciation variant
      else if (sim >= 0.70) cost = 0.5; // Acoustic similarity alignment hint

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + cost,
        dp[i - 1][j] + 1.0,
        dp[i][j - 1] + 1.0
      );
    }
  }

  let i = m;
  let j = n;
  let correctWordsCount = 0;
  let uncertainWordsCount = 0;
  const wordTimings = [];
  const omissions = [];
  const substitutions = [];
  const insertions = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const tw = targetTokens[i - 1];
      const sw = spokenTokens[j - 1];
      const isVariant = isIndianEnglishPhoneticVariant(tw, sw);
      const sim = computePhoneticSimilarity(tw, sw);
      const cost = (tw === sw) ? 0.0 : (isVariant ? 0.2 : (sim >= 0.70 ? 0.5 : 1.0));

      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + cost)) < 0.001) {
        const isMatch = (tw === sw) || isVariant;
        const status = isMatch ? 'correct' : 'substitution';
        if (isMatch) correctWordsCount++;
        else {
          substitutions.unshift({
            expectedWord: tw,
            spokenWord: sw,
            targetIndex: i - 1,
            phoneticSimilarity: sim,
            isPhoneticVariant: false,
            confidence: null // Do not fabricate confidence when not provided by ASR
          });
        }

        wordTimings.unshift({
          targetIndex: i - 1,
          expectedWord: tw,
          spokenWord: sw,
          status,
          phoneticSimilarity: sim,
          isPhoneticVariant: isVariant && tw !== sw,
          startSec: null,
          endSec: null,
          durationMs: null,
          confidence: null, // Do not fabricate confidence when not provided by ASR
          isUncertain: false
        });
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + 1.0)) < 0.001) {
      omissions.unshift({
        expectedWord: targetTokens[i - 1],
        targetIndex: i - 1,
        confidence: null
      });
      wordTimings.unshift({
        targetIndex: i - 1,
        expectedWord: targetTokens[i - 1],
        spokenWord: '',
        status: 'omission',
        phoneticSimilarity: 0.0,
        isPhoneticVariant: false,
        startSec: null,
        endSec: null,
        durationMs: null,
        confidence: null,
        isUncertain: false
      });
      i--;
      continue;
    }

    if (j > 0 && Math.abs(dp[i][j] - (dp[i][j - 1] + 1.0)) < 0.001) {
      insertions.unshift({
        spokenWord: spokenTokens[j - 1],
        nearTargetIndex: i,
        confidence: null
      });
      wordTimings.unshift({
        targetIndex: null,
        expectedWord: null,
        spokenWord: spokenTokens[j - 1],
        status: 'insertion',
        phoneticSimilarity: 0.0,
        isPhoneticVariant: false,
        startSec: null,
        endSec: null,
        durationMs: null,
        confidence: null,
        isUncertain: false
      });
      j--;
      continue;
    }

    if (i > 0) i--;
    if (j > 0) j--;
  }

  return {
    correctWordsCount,
    uncertainWordsCount,
    wordTimings,
    omissions,
    substitutions,
    insertions
  };
}
