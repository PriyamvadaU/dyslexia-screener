"""
faster-whisper ASR Engine
Provides transcription with word timestamps and token-level log probabilities.
Supports configurable model sizes (large-v3, medium.en, small.en, base.en).
"""
import os
from faster_whisper import WhisperModel
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

class FasterWhisperTranscriber:
    def __init__(self, model_size: str = None, device: str = None, compute_type: str = None):
        self.model_size = model_size or config.DEFAULT_MODEL_SIZE
        self.device = device or config.DEVICE
        self.compute_type = compute_type or config.COMPUTE_TYPE
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            print(f"[ASR] Loading faster-whisper model '{self.model_size}' on {self.device} ({self.compute_type})...")
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=config.DOWNLOAD_ROOT or os.path.join(os.path.dirname(__file__), "models")
            )
            print(f"[ASR] faster-whisper '{self.model_size}' loaded successfully.")
        except Exception as e:
            print(f"[ASR] Error loading model {self.model_size}: {e}")
            if self.model_size != "base.en" and self.device == "cpu":
                print("[ASR] Attempting fallback to 'base.en'...")
                self.model_size = "base.en"
                self.model = WhisperModel("base.en", device="cpu", compute_type="int8")

    def transcribe(self, audio_array, language: str = "en") -> dict:
        """
        Transcribes audio array and extracts word-level timing and confidence scores.
        Preserves raw spoken words, repetitions, and hesitation markers.
        """
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("ASR Whisper model is not loaded.")

        segments, info = self.model.transcribe(
            audio_array,
            language=language,
            word_timestamps=True,
            temperature=0.0,
            beam_size=5,
            vad_filter=False, # We handle VAD via Silero separately to preserve child disfluencies
            condition_on_previous_text=False
        )

        words_list = []
        raw_text_chunks = []

        for segment in segments:
            raw_text_chunks.append(segment.text.strip())
            if segment.words:
                for w in segment.words:
                    word_clean = w.word.strip()
                    if word_clean:
                        words_list.append({
                            "word": word_clean,
                            "start": round(w.start, 3),
                            "end": round(w.end, 3),
                            "probability": round(w.probability, 3)
                        })

        raw_transcript = " ".join(raw_text_chunks).strip()

        return {
            "rawTranscript": raw_transcript,
            "words": words_list,
            "language": info.language,
            "languageProbability": round(info.language_probability, 3),
            "duration": round(info.duration, 2)
        }

transcriber = FasterWhisperTranscriber()
