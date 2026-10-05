"""
Unit tests for LexiScreen Speech Analysis Service Components
Tests:
- Needleman-Wunsch expected-vs-spoken alignment
- Indian English phonetic tolerance (no false penalty)
- ASR uncertainty gate (low confidence -> uncertain, zero false substitution)
- Word and phrase repetition extraction
- Non-diagnostic temporal indicator generation
- Quality state assignments (valid, review_required, insufficient_quality, incomplete)
"""
import unittest
from expected_aligner import align_expected_and_spoken, compute_phonetic_similarity, normalize_text_tokens
from temporal_analyzer import analyze_temporal_and_disfluencies
from quality_gate import evaluate_quality_and_state

class TestSpeechAnalysisPipeline(unittest.TestCase):

    def test_perfect_reading(self):
        expected = "The quick brown fox jumps over the lazy dog"
        tokens = normalize_text_tokens(expected)
        aligned_words = [
            {"word": t, "start": i * 0.5, "end": (i + 1) * 0.5 - 0.1, "confidence": 0.95}
            for i, t in enumerate(tokens)
        ]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertEqual(res["correctWordCount"], len(tokens))
        self.assertEqual(len(res["omissions"]), 0)
        self.assertEqual(len(res["substitutions"]), 0)
        self.assertEqual(len(res["insertions"]), 0)
        self.assertEqual(res["decodingAccuracyPct"], 100.0)

    def test_omission_error(self):
        expected = "The quick brown fox jumps"
        spoken = ["the", "brown", "fox", "jumps"] # 'quick' omitted
        aligned_words = [{"word": w, "start": i * 0.5, "end": (i + 1) * 0.5, "confidence": 0.9} for i, w in enumerate(spoken)]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertEqual(len(res["omissions"]), 1)
        self.assertEqual(res["omissions"][0]["expectedWord"], "quick")
        self.assertEqual(res["correctWordCount"], 4)

    def test_substitution_error(self):
        expected = "The brown cat sat on the mat"
        spoken = ["the", "black", "cat", "sat", "on", "the", "mat"] # 'brown' -> 'black'
        aligned_words = [{"word": w, "start": i * 0.5, "end": (i + 1) * 0.5, "confidence": 0.9} for i, w in enumerate(spoken)]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertEqual(len(res["substitutions"]), 1)
        self.assertEqual(res["substitutions"][0]["expectedWord"], "brown")
        self.assertEqual(res["substitutions"][0]["spokenWord"], "black")

    def test_insertion_error(self):
        expected = "The dog barked loudly"
        spoken = ["the", "little", "dog", "barked", "loudly"] # 'little' inserted
        aligned_words = [{"word": w, "start": i * 0.5, "end": (i + 1) * 0.5, "confidence": 0.9} for i, w in enumerate(spoken)]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertEqual(len(res["insertions"]), 1)
        self.assertEqual(res["insertions"][0]["spokenWord"], "little")

    def test_word_repetition_preserved(self):
        expected = "The dog barked"
        spoken = ["the", "the", "dog", "barked"] # 'the the'
        aligned_words = [{"word": w, "start": i * 0.4, "end": (i + 1) * 0.4, "confidence": 0.9} for i, w in enumerate(spoken)]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertTrue(len(res["repetitions"]) >= 1)
        self.assertEqual(res["repetitions"][0]["phrase"], "the")

    def test_hard_asr_uncertainty_gate(self):
        """Uncertain ASR word must NOT become a false reading substitution."""
        expected = "The elephant walked slowly"
        # Low confidence ASR artifact (confidence 0.25 < 0.45 threshold)
        aligned_words = [
            {"word": "the", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "aliphant", "start": 0.4, "end": 0.9, "confidence": 0.25, "isUncertain": True},
            {"word": "walked", "start": 1.0, "end": 1.4, "confidence": 0.92},
            {"word": "slowly", "start": 1.5, "end": 2.0, "confidence": 0.90}
        ]
        res = align_expected_and_spoken(expected, aligned_words)
        # Verify it is marked uncertain and NOT counted as a substitution error
        self.assertEqual(res["uncertainWordCount"], 1)
        self.assertEqual(len(res["substitutions"]), 0)

    def test_indian_english_phonetic_tolerance(self):
        """Common Indian English pronunciation variations should not be flagged as reading errors."""
        sim_wv = compute_phonetic_similarity("very", "wery")
        self.assertGreaterEqual(sim_wv, 0.78)

        expected = "The water was very cold"
        # Spoken with common phonetic shift
        aligned_words = [
            {"word": "the", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "vater", "start": 0.4, "end": 0.8, "confidence": 0.90}, # water -> vater
            {"word": "was", "start": 0.9, "end": 1.2, "confidence": 0.90},
            {"word": "wery", "start": 1.3, "end": 1.7, "confidence": 0.90}, # very -> wery
            {"word": "cold", "start": 1.8, "end": 2.2, "confidence": 0.92}
        ]
        res = align_expected_and_spoken(expected, aligned_words)
        # Should be recognized as valid with phonetic variant flag rather than penalized substitutions
        self.assertEqual(len(res["substitutions"]), 0)
        self.assertEqual(res["correctWordCount"], 5)

    def test_genuine_substitution_not_masked_by_phonetic_similarity(self):
        """High string similarity on genuine substitution (e.g. house vs mouse) must NOT be marked correct."""
        expected = "The little mouse"
        aligned_words = [
            {"word": "the", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "little", "start": 0.4, "end": 0.8, "confidence": 0.90},
            {"word": "house", "start": 0.9, "end": 1.4, "confidence": 0.92} # mouse -> house
        ]
        res = align_expected_and_spoken(expected, aligned_words)
        self.assertEqual(len(res["substitutions"]), 1)
        self.assertEqual(res["substitutions"][0]["expectedWord"], "mouse")
        self.assertEqual(res["substitutions"][0]["spokenWord"], "house")
        self.assertEqual(res["correctWordCount"], 2)
        self.assertFalse(res["substitutions"][0]["isPhoneticVariant"])

    def test_quality_state_evaluations(self):
        # Audio too short
        short_meta = {"durationSec": 1.5, "signalToNoiseRatioDb": 25.0, "isSilent": False}
        state, flags = evaluate_quality_and_state(short_meta, {"expectedWordCount": 10, "spokenWordCount": 2, "uncertainWordCount": 0}, total_speech_sec=0.8)
        self.assertEqual(state, "insufficient_quality")
        self.assertIn("AUDIO_TOO_SHORT", flags)

        # Incomplete reading
        inc_meta = {"durationSec": 10.0, "signalToNoiseRatioDb": 25.0, "isSilent": False}
        state, flags = evaluate_quality_and_state(inc_meta, {"expectedWordCount": 20, "spokenWordCount": 4, "uncertainWordCount": 0}, total_speech_sec=3.0)
        self.assertEqual(state, "incomplete")
        self.assertIn("INCOMPLETE_READING", flags)

        # Valid reading
        valid_meta = {"durationSec": 15.0, "signalToNoiseRatioDb": 28.0, "isSilent": False}
        state, flags = evaluate_quality_and_state(valid_meta, {"expectedWordCount": 15, "spokenWordCount": 15, "uncertainWordCount": 0}, total_speech_sec=12.0)
        self.assertEqual(state, "valid")

    def test_temporal_disfluency_indicators(self):
        vad_segments = [
            {"start": 0.0, "end": 1.0, "state": "speech"},
            {"start": 1.0, "end": 3.2, "state": "silence"}, # 2200ms silence -> possible_block_like_interval
            {"start": 3.2, "end": 5.0, "state": "speech"}
        ]
        aligned_words = [
            {"spokenWord": "the", "startSec": 0.5, "endSec": 0.9, "durationMs": 400},
            {"spokenWord": "crocodile", "startSec": 3.3, "endSec": 4.1, "durationMs": 800}
        ]
        pauses, temp_ind, events = analyze_temporal_and_disfluencies(vad_segments, aligned_words, total_duration_sec=5.0)
        self.assertEqual(temp_ind["longPauseCount"], 1)
        self.assertTrue(any(e["indicator"] in ("possible_block_like_interval", "long_pre_word_latency") for e in events))

if __name__ == "__main__":
    unittest.main()
