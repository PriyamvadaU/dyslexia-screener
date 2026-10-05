"""
WhisperX Phonetic Forced Aligner
Aligns word and phoneme boundaries using Wav2Vec2 CTC phonetic alignment models.
Preserves start/end timestamps and alignment confidence.
"""
import whisperx
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

class WhisperXForcedAligner:
    def __init__(self, device: str = None):
        self.device = device or config.DEVICE
        self.align_model = None
        self.align_metadata = None
        self._load_aligner()

    def _load_aligner(self):
        try:
            print(f"[Aligner] Loading WhisperX phoneme alignment model on {self.device}...")
            self.align_model, self.align_metadata = whisperx.load_align_model(
                language_code="en",
                device=self.device
            )
            print("[Aligner] WhisperX alignment model loaded successfully.")
        except Exception as e:
            print(f"[Aligner] Notice: WhisperX phoneme aligner not available or offline ({e}). Using ASR word timestamps.")
            self.align_model = None

    def align(self, asr_words: list[dict], audio_array, raw_transcript: str) -> list[dict]:
        """
        Refines word boundaries using phonetic CTC alignment.
        Falls back cleanly to ASR timestamps if CTC aligner is unavailable.
        """
        if self.align_model is not None and len(asr_words) > 0:
            try:
                transcript_dict = [{"text": raw_transcript, "start": asr_words[0]["start"], "end": asr_words[-1]["end"]}]
                result = whisperx.align(
                    transcript_dict,
                    self.align_model,
                    self.align_metadata,
                    audio_array,
                    self.device,
                    return_char_alignments=False
                )

                aligned_words = []
                for segment in result.get("segments", []):
                    for w in segment.get("words", []):
                        conf = round(w.get("score"), 3) if w.get("score") is not None else (round(w.get("probability"), 3) if w.get("probability") is not None else None)
                        is_unc = (conf is not None and conf < config.MIN_ASR_CONFIDENCE) or ("start" not in w)
                        aligned_words.append({
                            "word": w.get("word", ""),
                            "start": round(w.get("start", 0.0), 3) if "start" in w else None,
                            "end": round(w.get("end", 0.0), 3) if "end" in w else None,
                            "confidence": conf,
                            "isUncertain": is_unc
                        })

                if len(aligned_words) > 0:
                    return aligned_words

            except Exception as e:
                print(f"[Aligner] WhisperX alignment step encountered an issue: {e}. Preserving ASR timestamps.")

        # Fallback to ASR word timings directly
        return [
            {
                "word": w["word"],
                "start": w.get("start"),
                "end": w.get("end"),
                "confidence": round(w.get("probability"), 3) if w.get("probability") is not None else None,
                "isUncertain": w.get("probability") is not None and w.get("probability") < config.MIN_ASR_CONFIDENCE
            }
            for w in asr_words
        ]

forced_aligner = WhisperXForcedAligner()
