/**
 * High-Fidelity Mock Fixtures for Reading Speech Analysis Pipeline Tests
 * Allows full deterministic testing of scoring, ML inference, and API routes
 * without downloading multi-gigabyte models or requiring external GPU services.
 */

export const MOCK_PERFECT_READING = {
  assessmentState: 'valid',
  qualityFlags: [],
  rawTranscript: "The little brown fox jumped over the lazy dog.",
  normalizedTranscript: "the little brown fox jumped over the lazy dog",
  expectedText: "The little brown fox jumped over the lazy dog.",
  durationSec: 8.5,
  speechDurationSec: 7.2,
  silenceDurationSec: 1.3,
  expectedWordCount: 9,
  spokenWordCount: 9,
  correctWordCount: 9,
  uncertainWordCount: 0,
  decodingAccuracyPct: 100.0,
  wpm: 64,
  speechRateWordsPerSec: 1.25,
  omissions: [],
  substitutions: [],
  insertions: [],
  repetitions: [],
  pauses: [
    { pauseIndex: 1, startSec: 3.5, endSec: 4.2, durationMs: 700, precedingWord: "fox", followingWord: "jumped", isLongPause: false }
  ],
  temporalIndicators: {
    totalPauseCount: 1,
    longPauseCount: 0,
    totalPauseDurationMs: 700,
    silenceRatio: 0.082,
    meanPauseDurationMs: 700,
    medianPauseDurationMs: 700,
    maxPauseDurationMs: 700,
    pausesPerMinute: 7.1
  },
  acousticEvents: [],
  wordTimings: [
    { targetIndex: 0, expectedWord: "the", spokenWord: "the", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 0.2, endSec: 0.6, durationMs: 400, confidence: 0.96, isUncertain: false },
    { targetIndex: 1, expectedWord: "little", spokenWord: "little", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 0.7, endSec: 1.2, durationMs: 500, confidence: 0.94, isUncertain: false },
    { targetIndex: 2, expectedWord: "brown", spokenWord: "brown", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 1.3, endSec: 1.9, durationMs: 600, confidence: 0.95, isUncertain: false },
    { targetIndex: 3, expectedWord: "fox", spokenWord: "fox", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 2.0, endSec: 2.6, durationMs: 600, confidence: 0.97, isUncertain: false },
    { targetIndex: 4, expectedWord: "jumped", spokenWord: "jumped", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 4.3, endSec: 4.9, durationMs: 600, confidence: 0.92, isUncertain: false },
    { targetIndex: 5, expectedWord: "over", spokenWord: "over", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 5.0, endSec: 5.5, durationMs: 500, confidence: 0.93, isUncertain: false },
    { targetIndex: 6, expectedWord: "the", spokenWord: "the", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 5.6, endSec: 6.0, durationMs: 400, confidence: 0.95, isUncertain: false },
    { targetIndex: 7, expectedWord: "lazy", spokenWord: "lazy", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 6.1, endSec: 6.7, durationMs: 600, confidence: 0.91, isUncertain: false },
    { targetIndex: 8, expectedWord: "dog", spokenWord: "dog", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 6.8, endSec: 7.4, durationMs: 600, confidence: 0.98, isUncertain: false }
  ],
  vadSegments: [
    { start: 0.0, end: 0.2, state: "silence" },
    { start: 0.2, end: 2.6, state: "speech" },
    { start: 2.6, end: 4.3, state: "silence" },
    { start: 4.3, end: 7.4, state: "speech" },
    { start: 7.4, end: 8.5, state: "silence" }
  ],
  modelMetadata: {
    asrEngine: "faster-whisper-base.en",
    alignerEngine: "whisperx-wav2vec2-en",
    vadEngine: "silero-vad-v5",
    inferenceDurationMs: 412,
    deviceUsed: "cpu"
  }
};

export const MOCK_UNCERTAIN_ASR_READING = {
  assessmentState: 'review_required',
  qualityFlags: ['LOW_ASR_CONFIDENCE'],
  rawTranscript: "The ... brown fox jumped",
  normalizedTranscript: "the brown fox jumped",
  expectedText: "The little brown fox jumped",
  durationSec: 6.0,
  speechDurationSec: 4.5,
  silenceDurationSec: 1.5,
  expectedWordCount: 5,
  spokenWordCount: 4,
  correctWordCount: 4,
  uncertainWordCount: 1, // Word was muffled/uncertain (<0.40 confidence)
  decodingAccuracyPct: 100.0, // Gated: Uncertain word does NOT penalize decoding accuracy
  wpm: 40,
  speechRateWordsPerSec: 0.88,
  omissions: [],
  substitutions: [],
  insertions: [],
  repetitions: [],
  pauses: [],
  temporalIndicators: {
    totalPauseCount: 0,
    longPauseCount: 0,
    totalPauseDurationMs: 0,
    silenceRatio: 0.25,
    meanPauseDurationMs: 0,
    medianPauseDurationMs: 0,
    maxPauseDurationMs: 0,
    pausesPerMinute: 0
  },
  acousticEvents: [],
  wordTimings: [
    { targetIndex: 0, expectedWord: "the", spokenWord: "the", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 0.2, endSec: 0.6, durationMs: 400, confidence: 0.95, isUncertain: false },
    { targetIndex: 1, expectedWord: "little", spokenWord: "[muffled]", status: "uncertain", phoneticSimilarity: null, isPhoneticVariant: false, startSec: 0.7, endSec: 1.1, durationMs: 400, confidence: 0.28, isUncertain: true },
    { targetIndex: 2, expectedWord: "brown", spokenWord: "brown", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 1.3, endSec: 1.9, durationMs: 600, confidence: 0.95, isUncertain: false },
    { targetIndex: 3, expectedWord: "fox", spokenWord: "fox", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 2.0, endSec: 2.6, durationMs: 600, confidence: 0.97, isUncertain: false },
    { targetIndex: 4, expectedWord: "jumped", spokenWord: "jumped", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 2.8, endSec: 3.4, durationMs: 600, confidence: 0.92, isUncertain: false }
  ],
  vadSegments: [{ start: 0.0, end: 6.0, state: "speech" }],
  modelMetadata: {
    asrEngine: "faster-whisper-base.en",
    alignerEngine: "whisperx-wav2vec2-en",
    vadEngine: "silero-vad-v5",
    inferenceDurationMs: 380,
    deviceUsed: "cpu"
  }
};

export const MOCK_DISFLUENT_READING = {
  assessmentState: 'valid',
  qualityFlags: [],
  rawTranscript: "The the brown fox ... um jumped",
  normalizedTranscript: "the the brown fox um jumped",
  expectedText: "The brown fox jumped",
  durationSec: 12.0,
  speechDurationSec: 7.0,
  silenceDurationSec: 5.0,
  expectedWordCount: 4,
  spokenWordCount: 6,
  correctWordCount: 4,
  uncertainWordCount: 0,
  decodingAccuracyPct: 100.0,
  wpm: 20,
  speechRateWordsPerSec: 0.85,
  omissions: [],
  substitutions: [],
  insertions: [],
  repetitions: [
    {
      type: "word_repetition",
      phrase: "the",
      occurrences: 2,
      targetIndex: 0,
      timestamps: [{ start: 0.5, end: 0.9 }, { start: 1.0, end: 1.4 }]
    }
  ],
  pauses: [
    { pauseIndex: 1, startSec: 3.5, endSec: 5.8, durationMs: 2300, precedingWord: "fox", followingWord: "jumped", isLongPause: true }
  ],
  temporalIndicators: {
    totalPauseCount: 1,
    longPauseCount: 1,
    totalPauseDurationMs: 2300,
    silenceRatio: 0.416,
    meanPauseDurationMs: 2300,
    medianPauseDurationMs: 2300,
    maxPauseDurationMs: 2300,
    pausesPerMinute: 5.0
  },
  acousticEvents: [
    {
      indicator: "possible_block_like_interval",
      targetWord: "jumped",
      latencyMs: 2300,
      timestampSec: 3.5,
      disclaimer: "Non-diagnostic screening indicator only"
    },
    {
      indicator: "filled_pause",
      targetWord: "um",
      latencyMs: 400,
      timestampSec: 5.9,
      disclaimer: "Non-diagnostic screening indicator only"
    }
  ],
  wordTimings: [
    { targetIndex: 0, expectedWord: "the", spokenWord: "the", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 0.5, endSec: 0.9, durationMs: 400, confidence: 0.95, isUncertain: false },
    { targetIndex: 0, expectedWord: "the", spokenWord: "the", status: "word_repetition", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 1.0, endSec: 1.4, durationMs: 400, confidence: 0.95, isUncertain: false },
    { targetIndex: 1, expectedWord: "brown", spokenWord: "brown", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 1.8, endSec: 2.4, durationMs: 600, confidence: 0.95, isUncertain: false },
    { targetIndex: 2, expectedWord: "fox", spokenWord: "fox", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 2.6, endSec: 3.2, durationMs: 600, confidence: 0.97, isUncertain: false },
    { targetIndex: null, expectedWord: null, spokenWord: "um", status: "insertion", phoneticSimilarity: 0.0, isPhoneticVariant: false, startSec: 5.9, endSec: 6.3, durationMs: 400, confidence: 0.90, isUncertain: false },
    { targetIndex: 3, expectedWord: "jumped", spokenWord: "jumped", status: "correct", phoneticSimilarity: 1.0, isPhoneticVariant: false, startSec: 6.5, endSec: 7.2, durationMs: 700, confidence: 0.92, isUncertain: false }
  ],
  vadSegments: [
    { start: 0.0, end: 0.5, state: "silence" },
    { start: 0.5, end: 3.2, state: "speech" },
    { start: 3.2, end: 5.8, state: "silence" },
    { start: 5.8, end: 7.2, state: "speech" },
    { start: 7.2, end: 12.0, state: "silence" }
  ],
  modelMetadata: {
    asrEngine: "faster-whisper-base.en",
    alignerEngine: "whisperx-wav2vec2-en",
    vadEngine: "silero-vad-v5",
    inferenceDurationMs: 450,
    deviceUsed: "cpu"
  }
};
