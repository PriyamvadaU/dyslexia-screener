/**
 * Automated Test Suite for LexiScreen Oral Reading Speech Analysis Pipeline
 * 
 * Comprehensive tests covering:
 * 1. Hard ASR uncertainty gating (low confidence -> uncertain, never false substitution)
 * 2. Quality state assignments (valid, review_required, insufficient_quality, incomplete)
 * 3. Indian English pronunciation variation tolerance (no false penalty)
 * 4. Non-diagnostic screening indicator terminology
 * 5. Raw evidence preservation (fillers, repetitions, hesitations)
 * 6. Deterministic expected-vs-spoken alignment (perfect, omission, substitution, insertion)
 * 7. Acoustic pause metrics & silence ratios
 * 8. Configurable grade WPM benchmark scaling
 * 9. Graceful external service fallback & circuit breaking
 * 10. Express API endpoint POST /api/reading/analyze
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeOralReading,
  fallbackDeterministicAnalysis,
  computePhoneticSimilarity
} from '../src/services/speechAnalysisClient.js';
import { extractReadingFeatures } from '../src/engine/readingFeatureExtractor.js';
import {
  MOCK_PERFECT_READING,
  MOCK_UNCERTAIN_ASR_READING,
  MOCK_DISFLUENT_READING
} from './fixtures/mockReadingAnalysis.js';
import app from '../src/server.js';
import http from 'http';

describe('LexiScreen Speech & Oral Reading Pipeline Suite', () => {

  // 1. Perfect Reading Alignment
  it('Scenario 1: Perfect Reading matches all tokens with 100% accuracy', () => {
    const expected = "The little brown fox jumped over the lazy dog";
    const spoken = "The little brown fox jumped over the lazy dog";
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 10
    });

    assert.equal(res.correctWordCount, 9);
    assert.equal(res.omissions.length, 0);
    assert.equal(res.substitutions.length, 0);
    assert.equal(res.insertions.length, 0);
    assert.equal(res.decodingAccuracyPct, 100.0);
    assert.equal(res.assessmentState, 'valid');
  });

  // 2. Omission Error Detection
  it('Scenario 2: Omission Error correctly identifies missing target word', () => {
    const expected = "The little brown fox jumped";
    const spoken = "The brown fox jumped"; // 'little' omitted
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 6
    });

    assert.equal(res.omissions.length, 1);
    assert.equal(res.omissions[0].expectedWord, 'little');
    assert.equal(res.correctWordCount, 4);
    assert.equal(res.decodingAccuracyPct, 80.0);
  });

  // 3. Substitution Error Detection
  it('Scenario 3: Substitution Error identifies mismatch and records phonetic similarity', () => {
    const expected = "The green frog hopped";
    const spoken = "The blue frog hopped"; // 'green' -> 'blue'
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 5
    });

    assert.equal(res.substitutions.length, 1);
    assert.equal(res.substitutions[0].expectedWord, 'green');
    assert.equal(res.substitutions[0].spokenWord, 'blue');
    assert.equal(res.correctWordCount, 3);
  });

  // 4. Insertion Error Detection
  it('Scenario 4: Insertion Error flags extra inserted word', () => {
    const expected = "The cat slept";
    const spoken = "The big cat slept"; // 'big' inserted
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 4
    });

    assert.equal(res.insertions.length, 1);
    assert.equal(res.insertions[0].spokenWord, 'big');
    assert.equal(res.correctWordCount, 3);
  });

  // 5. Hard ASR Uncertainty Gate
  it('Scenario 5: Hard ASR Uncertainty Gate ensures low-confidence ASR is NOT a false error', () => {
    // Feed mock fixture with low-confidence ASR word
    const features = extractReadingFeatures({
      readingAnalysis: MOCK_UNCERTAIN_ASR_READING,
      grade: '2'
    });

    assert.equal(features.uncertainWordCount, 1);
    assert.equal(features.errorCounts.substitutions, 0); // Must NOT be classified as substitution
    assert.equal(features.errorCounts.omissions, 0);
    assert.equal(features.decodingAccuracyPct, 100.0); // Accuracy not penalized for ASR uncertainty
    assert.equal(features.assessmentState, 'review_required');
    assert.ok(features.qualityFlags.includes('LOW_ASR_CONFIDENCE'));
  });

  // 6. Indian English Accent & Pronunciation Tolerance
  it('Scenario 6: Indian English pronunciation variation is tolerated without false penalty', () => {
    const simWV = computePhoneticSimilarity('very', 'wery');
    assert.ok(simWV >= 0.78, `Expected phonetic similarity >= 0.78, got ${simWV}`);

    const expected = "The water was very cold";
    const spoken = "The vater was wery cold"; // Typical phonetic variants
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 6
    });

    assert.equal(res.substitutions.length, 0);
    assert.equal(res.correctWordCount, 5);
    assert.equal(res.decodingAccuracyPct, 100.0);
  });

  // 6b. Phonetic Similarity Must Not Mask Genuine Substitutions
  it('Scenario 6b: Phonetic similarity does NOT mark genuine substitutions (e.g. house vs mouse) as correct', () => {
    const expected = "The little mouse";
    const spoken = "The little house"; // Classic onset substitution error
    const res = fallbackDeterministicAnalysis({
      transcript: spoken,
      expectedPassage: expected,
      grade: '2',
      durationSec: 4
    });

    assert.equal(res.substitutions.length, 1);
    assert.equal(res.substitutions[0].expectedWord, 'mouse');
    assert.equal(res.substitutions[0].spokenWord, 'house');
    assert.equal(res.substitutions[0].isPhoneticVariant, false);
    assert.equal(res.correctWordCount, 2);
  });

  // 6c. Non-Fabrication of Timestamps & Confidence in Text Fallback
  it('Scenario 6c: Timestamps and confidence are not fabricated in text fallback', () => {
    const res = fallbackDeterministicAnalysis({
      transcript: "The brown dog jumped",
      expectedPassage: "The brown dog jumped",
      grade: '2',
      durationSec: 5
    });

    res.wordTimings.forEach(w => {
      assert.equal(w.startSec, null);
      assert.equal(w.endSec, null);
      assert.equal(w.confidence, null);
    });
  });

  // 7. Non-Diagnostic Screening Terminology
  it('Scenario 7: Disfluency indicators use non-diagnostic screening terminology', () => {
    const features = extractReadingFeatures({
      readingAnalysis: MOCK_DISFLUENT_READING,
      grade: '2'
    });

    assert.ok(features.acousticEvents.length >= 1);
    features.acousticEvents.forEach(evt => {
      assert.ok(
        ['long_pre_word_latency', 'possible_prolongation', 'possible_block_like_interval', 'filled_pause'].includes(evt.indicator),
        `Unexpected diagnostic term found: ${evt.indicator}`
      );
      assert.equal(evt.disclaimer, 'Non-diagnostic screening indicator only');
    });
  });

  // 8. Raw Transcript & Evidence Preservation
  it('Scenario 8: Verbatim repetitions and fillers are preserved in raw transcript', () => {
    const res = fallbackDeterministicAnalysis({
      transcript: "The the brown fox um jumped",
      expectedPassage: "The brown fox jumped",
      grade: '2',
      durationSec: 8
    });

    assert.equal(res.rawTranscript, "The the brown fox um jumped");
    assert.ok(res.repetitions.length >= 1);
    assert.equal(res.repetitions[0].phrase, "the");
    assert.ok(res.acousticEvents.some(e => e.indicator === 'filled_pause' && e.targetWord === 'um'));
  });

  // 9. Configurable Grade-Level WPM Benchmarking
  it('Scenario 9: Fluency risk scales dynamically according to grade developmental benchmarks', () => {
    // 40 WPM is developing for Grade 1 (benchmark target: 60) but below minimum for Grade 3 (benchmark min: 70, target: 110)
    const grade1Features = extractReadingFeatures({
      transcript: "The quick brown fox jumped over the lazy dog and ran away fast into the forest",
      targetPassage: "The quick brown fox jumped over the lazy dog and ran away fast into the forest",
      durationSec: 22.5, // ~40 WPM
      grade: '1'
    });

    const grade3Features = extractReadingFeatures({
      transcript: "The quick brown fox jumped over the lazy dog and ran away fast into the forest",
      targetPassage: "The quick brown fox jumped over the lazy dog and ran away fast into the forest",
      durationSec: 22.5, // ~40 WPM
      grade: '3'
    });

    assert.equal(grade1Features.fluencyStatus, 'developing');
    assert.equal(grade3Features.fluencyStatus, 'below_minimum');
    assert.ok(grade3Features.riskBreakdown.fluencyRisk > grade1Features.riskBreakdown.fluencyRisk);
  });

  // 10. Quality State Assessment
  it('Scenario 10: Quality states trigger properly for short audio and incomplete readings', () => {
    const shortAudio = fallbackDeterministicAnalysis({
      transcript: "The",
      expectedPassage: "The little brown fox jumped over the fence",
      durationSec: 1.5
    });
    assert.equal(shortAudio.assessmentState, 'insufficient_quality');
    assert.ok(shortAudio.qualityFlags.includes('AUDIO_TOO_SHORT'));

    const incomplete = fallbackDeterministicAnalysis({
      transcript: "The little brown",
      expectedPassage: "The little brown fox jumped over the fence and ran all the way home",
      durationSec: 8
    });
    assert.equal(incomplete.assessmentState, 'incomplete');
    assert.ok(incomplete.qualityFlags.includes('INCOMPLETE_READING'));
  });

  // 11. Graceful External Service Fallback
  it('Scenario 11: Client gracefully falls back when SPEECH_SERVICE_URL is offline', async () => {
    // Point to non-existent endpoint to test graceful fallback
    process.env.SPEECH_SERVICE_URL = 'http://127.0.0.1:59999'; // Dead port
    process.env.SPEECH_SERVICE_TIMEOUT_MS = '500';

    const result = await analyzeOralReading({
      audioBuffer: Buffer.from([0, 1, 2, 3]),
      transcript: "The sunny day was warm",
      expectedPassage: "The sunny day was warm",
      grade: '2',
      durationSec: 5
    });

    assert.ok(result);
    assert.equal(result.correctWordCount, 5);
    assert.equal(result.decodingAccuracyPct, 100.0);
    assert.equal(result.modelMetadata.asrEngine, 'client-fallback-deterministic-aligner');

    // Clean up
    delete process.env.SPEECH_SERVICE_URL;
  });

  // 12. HTTP Endpoint POST /api/reading/analyze
  it('Scenario 12: POST /api/reading/analyze returns full structured ReadingAnalysis', async () => {
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/reading/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: "The green tree had red apples",
          expectedPassage: "The green tree had red apples",
          grade: "2",
          durationSec: 6
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.success);
      assert.ok(data.analysis);
      assert.equal(data.analysis.correctWordCount, 6);
      assert.equal(data.analysis.decodingAccuracyPct, 100.0);
      assert.equal(data.analysis.assessmentState, 'valid');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
