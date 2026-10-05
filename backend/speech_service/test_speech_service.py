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
import io
import numpy as np
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

    def test_leading_silence_not_flagged_as_block(self):
        """
        Regression: leading silence where precedingWord is None (e.g. initial hesitation
        or startup delay at t=0s) must NOT be labeled as a block or pre-word latency.
        """
        vad_segments = [
            {"start": 0.0, "end": 2.2, "state": "silence"},  # 2200ms leading silence
            {"start": 2.2, "end": 4.0, "state": "speech"}
        ]
        aligned_words = [
            {"spokenWord": "the", "startSec": 2.25, "endSec": 2.6, "durationMs": 350},
            {"spokenWord": "dog", "startSec": 2.7, "endSec": 3.1, "durationMs": 400}
        ]
        pauses, temp_ind, events = analyze_temporal_and_disfluencies(vad_segments, aligned_words, total_duration_sec=4.0)
        self.assertFalse(any(e["indicator"] in ("possible_block_like_interval", "long_pre_word_latency") for e in events),
                         "Leading silence with no precedingWord must not trigger block-like interval")

    def test_trailing_punctuation_is_not_a_substitution(self):
        """
        Regression: ASR may return words with trailing punctuation (e.g. 'it.', 'dog,', 'loudly!').
        These must align as CORRECT against the punctuation-stripped expected tokens,
        not as substitutions.
        """
        expected = "The dog barked loudly"
        # ASR words have trailing punctuation on every token
        spoken_with_punct = [
            {"word": "The", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "dog,", "start": 0.4, "end": 0.7, "confidence": 0.93},
            {"word": "barked", "start": 0.8, "end": 1.2, "confidence": 0.94},
            {"word": "loudly.", "start": 1.3, "end": 1.8, "confidence": 0.96},
        ]
        res = align_expected_and_spoken(expected, spoken_with_punct)
        self.assertEqual(res["correctWordCount"], 4,
                         "All four words should be correct despite trailing punctuation")
        self.assertEqual(len(res["substitutions"]), 0,
                         "No substitutions — punctuation-only difference must not count")
        self.assertEqual(len(res["omissions"]), 0)

    def test_mixed_punctuation_variants_are_correct(self):
        """
        Regression: mixed punctuation styles (commas, exclamation marks, question marks)
        must all be stripped before comparison.
        """
        expected = "Can the cat sit"
        spoken_with_punct = [
            {"word": "Can!", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "the,", "start": 0.4, "end": 0.6, "confidence": 0.94},
            {"word": "cat?", "start": 0.7, "end": 1.0, "confidence": 0.92},
            {"word": "sit.", "start": 1.1, "end": 1.4, "confidence": 0.97},
        ]
        res = align_expected_and_spoken(expected, spoken_with_punct)
        self.assertEqual(res["correctWordCount"], 4)
        self.assertEqual(len(res["substitutions"]), 0)

    def test_repetition_detected_despite_trailing_punctuation(self):
        """
        Regression: 'the the.' must still be detected as a word repetition.
        """
        expected = "The dog barked"
        spoken = [
            {"word": "the", "start": 0.0, "end": 0.3, "confidence": 0.95},
            {"word": "the.", "start": 0.3, "end": 0.6, "confidence": 0.90},
            {"word": "dog", "start": 0.7, "end": 1.0, "confidence": 0.94},
            {"word": "barked", "start": 1.1, "end": 1.5, "confidence": 0.93},
        ]
        res = align_expected_and_spoken(expected, spoken)
        self.assertTrue(len(res["repetitions"]) >= 1,
                        "Repetition 'the / the.' must be detected despite punctuation")
        self.assertEqual(res["repetitions"][0]["phrase"], "the")


class TestAudioPreprocessor(unittest.TestCase):
    """Tests for audio_preprocessor.load_and_preprocess_audio."""

    @staticmethod
    def _make_wav_bytes(duration_sec: float = 1.0, sample_rate: int = 16000) -> bytes:
        """Generate a minimal mono 16-bit PCM WAV in memory (no file I/O)."""
        import struct, math
        n_samples = int(duration_sec * sample_rate)
        # 440 Hz sine wave
        samples = [int(32767 * math.sin(2 * math.pi * 440 * t / sample_rate)) for t in range(n_samples)]
        buf = io.BytesIO()
        # RIFF WAV header
        data_size = n_samples * 2
        buf.write(b"RIFF")
        buf.write(struct.pack("<I", 36 + data_size))
        buf.write(b"WAVE")
        buf.write(b"fmt ")
        buf.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
        buf.write(b"data")
        buf.write(struct.pack("<I", data_size))
        for s in samples:
            buf.write(struct.pack("<h", s))
        return buf.getvalue()

    @staticmethod
    def _make_stereo_wav_bytes(duration_sec: float = 1.0, sample_rate: int = 16000, amplitude: float = 0.95) -> bytes:
        """Generate a dual-channel stereo 16-bit PCM WAV with identical channels."""
        import struct, math
        n_samples = int(duration_sec * sample_rate)
        val = int(32767 * amplitude)
        samples = [int(val * math.sin(2 * math.pi * 440 * t / sample_rate)) for t in range(n_samples)]
        buf = io.BytesIO()
        data_size = n_samples * 2 * 2  # 2 channels, 16-bit
        buf.write(b"RIFF")
        buf.write(struct.pack("<I", 36 + data_size))
        buf.write(b"WAVE")
        buf.write(b"fmt ")
        buf.write(struct.pack("<IHHIIHH", 16, 1, 2, sample_rate, sample_rate * 4, 4, 16))
        buf.write(b"data")
        buf.write(struct.pack("<I", data_size))
        for s in samples:
            buf.write(struct.pack("<hh", s, s))
        return buf.getvalue()

    def test_stereo_wav_via_pyav_no_false_clipping(self):
        """
        Regression: stereo audio with amplitude 0.95 downmixed via PyAV must NOT
        experience equal-power sqrt(2) gain boost that falsely marks peak >= 0.999 as clipped.
        """
        try:
            import av
        except ImportError:
            self.skipTest("PyAV not installed")
        from audio_preprocessor import load_and_preprocess_audio
        wav_bytes = self._make_stereo_wav_bytes(duration_sec=0.5, sample_rate=16000, amplitude=0.95)
        audio, meta = load_and_preprocess_audio(wav_bytes, target_sr=16000)
        self.assertFalse(meta["isClipped"], "Stereo 0.95 amplitude audio must not be marked as clipped")
        self.assertLess(meta["peakAmplitude"], 0.999)

    def test_legitimate_clipping_is_detected(self):
        """Legitimate peak >= 0.999 must still be correctly flagged as isClipped."""
        from audio_preprocessor import load_and_preprocess_audio
        wav_bytes = self._make_stereo_wav_bytes(duration_sec=0.5, sample_rate=16000, amplitude=1.0)
        audio, meta = load_and_preprocess_audio(wav_bytes, target_sr=16000)
        self.assertTrue(meta["isClipped"], "Amplitude 1.0 audio must be detected as clipped")

    def test_wav_via_pyav(self):
        """PyAV path: decode an in-memory WAV → mono float32 at 16 kHz."""
        try:
            import av  # skip gracefully if not installed
        except ImportError:
            self.skipTest("PyAV not installed")
        from audio_preprocessor import load_and_preprocess_audio
        wav_bytes = self._make_wav_bytes(duration_sec=0.5, sample_rate=16000)
        audio, meta = load_and_preprocess_audio(wav_bytes, target_sr=16000)
        self.assertEqual(audio.dtype, np.float32)
        self.assertEqual(audio.ndim, 1)
        self.assertGreater(len(audio), 0)
        self.assertAlmostEqual(meta["durationSec"], 0.5, delta=0.05)
        self.assertEqual(meta["sampleRate"], 16000)
        self.assertFalse(meta["isSilent"])

    def test_wav_fallback_soundfile(self):
        """soundfile/librosa fallback: still works when PyAV raises ImportError."""
        import unittest.mock as mock
        from audio_preprocessor import load_and_preprocess_audio
        wav_bytes = self._make_wav_bytes(duration_sec=0.5, sample_rate=16000)
        # Patch _decode_with_pyav to simulate PyAV being absent
        with mock.patch("audio_preprocessor._decode_with_pyav", side_effect=ImportError("no av")):
            audio, meta = load_and_preprocess_audio(wav_bytes, target_sr=16000)
        self.assertEqual(audio.dtype, np.float32)
        self.assertEqual(audio.ndim, 1)
        self.assertGreater(len(audio), 0)

    def test_output_is_float32_mono(self):
        """Output array must always be 1-D float32 regardless of decode path."""
        from audio_preprocessor import load_and_preprocess_audio
        wav_bytes = self._make_wav_bytes(duration_sec=1.0, sample_rate=8000)
        audio, meta = load_and_preprocess_audio(wav_bytes, target_sr=16000)
        self.assertEqual(audio.dtype, np.float32)
        self.assertEqual(audio.ndim, 1)
        self.assertEqual(meta["sampleRate"], 16000)

    def test_invalid_bytes_raise_value_error(self):
        """Garbage bytes must raise ValueError (not leak a raw exception)."""
        from audio_preprocessor import load_and_preprocess_audio
        with self.assertRaises(ValueError):
            load_and_preprocess_audio(b"not audio data at all!!!", target_sr=16000)


class TestJsonSanitization(unittest.TestCase):
    """
    Regression tests: sanitize_for_json() must convert every numpy scalar/array
    to a native Python type so json.dumps (and FastAPI's jsonable_encoder) never
    encounter a numpy.bool_ or other non-serializable numpy type.
    """

    def setUp(self):
        try:
            import numpy as _np
            self.np = _np
        except ImportError:
            self.skipTest("numpy not installed")
        from json_utils import sanitize_for_json
        self.sanitize = sanitize_for_json

    def _assert_json_serializable(self, obj):
        import json
        try:
            json.dumps(obj)
        except TypeError as e:
            self.fail(f"Object is not JSON-serializable after sanitize: {e}")

    def test_numpy_bool_converted(self):
        result = self.sanitize(self.np.bool_(True))
        self.assertIsInstance(result, bool)
        self.assertEqual(result, True)

    def test_numpy_float32_converted(self):
        result = self.sanitize(self.np.float32(3.14))
        self.assertIsInstance(result, float)
        self.assertAlmostEqual(result, 3.14, places=2)

    def test_numpy_int64_converted(self):
        result = self.sanitize(self.np.int64(42))
        self.assertIsInstance(result, int)
        self.assertEqual(result, 42)

    def test_numpy_ndarray_converted(self):
        arr = self.np.array([1.0, 2.0, 3.0], dtype=self.np.float32)
        result = self.sanitize(arr)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)
        self.assertIsInstance(result[0], float)

    def test_nested_dict_with_numpy_scalars(self):
        """Simulates a realistic reading-analysis response fragment."""
        payload = {
            "assessmentState": "valid",
            "qualityFlags": ["LOW_SNR"],
            "isClipped": self.np.bool_(False),
            "isSilent": self.np.bool_(False),
            "durationSec": self.np.float64(12.34),
            "correctWordCount": self.np.int32(15),
            "decodingAccuracyPct": self.np.float32(93.3),
            "vadSegments": [
                {"start": self.np.float64(0.0), "end": self.np.float64(1.5), "state": "speech"},
                {"start": self.np.float64(1.5), "end": self.np.float64(2.0), "state": "silence"},
            ],
            "wordTimings": [
                {
                    "expectedWord": "the",
                    "spokenWord": "the",
                    "status": "correct",
                    "confidence": self.np.float32(0.97),
                    "isUncertain": self.np.bool_(False),
                    "isPhoneticVariant": self.np.bool_(False),
                }
            ],
        }
        sanitized = self.sanitize(payload)
        self._assert_json_serializable(sanitized)

        # Type checks on specific fields
        self.assertIsInstance(sanitized["isClipped"], bool)
        self.assertIsInstance(sanitized["durationSec"], float)
        self.assertIsInstance(sanitized["correctWordCount"], int)
        self.assertIsInstance(sanitized["vadSegments"][0]["start"], float)
        self.assertIsInstance(sanitized["wordTimings"][0]["confidence"], float)
        self.assertIsInstance(sanitized["wordTimings"][0]["isUncertain"], bool)

    def test_plain_python_types_pass_through(self):
        """Native Python types must be returned unchanged."""
        payload = {"a": True, "b": 1, "c": 3.14, "d": "hello", "e": [1, 2], "f": None}
        result = self.sanitize(payload)
        self.assertEqual(result, payload)


if __name__ == "__main__":
    unittest.main()

