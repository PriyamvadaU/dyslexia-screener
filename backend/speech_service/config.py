"""
Configuration for LexiScreen Speech Analysis Microservice
"""
import os

class SpeechConfig:
    # Service settings
    HOST = os.getenv("SPEECH_SERVICE_HOST", "0.0.0.0")
    PORT = int(os.getenv("SPEECH_SERVICE_PORT", "8000"))
    
    # Model settings
    # Options: "large-v3", "medium.en", "small.en", "base.en", "tiny.en"
    DEFAULT_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base.en")
    
    # Auto-detect CUDA GPU if available and not explicitly overridden
    _default_device = "cpu"
    try:
        import torch
        if torch.cuda.is_available():
            _default_device = "cuda"
    except Exception:
        pass

    DEVICE = os.getenv("WHISPER_DEVICE", _default_device)
    COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16" if DEVICE == "cuda" else "int8")
    DOWNLOAD_ROOT = os.getenv("WHISPER_DOWNLOAD_ROOT", None)
    
    # VAD settings
    VAD_SAMPLING_RATE = 16000
    VAD_THRESHOLD = float(os.getenv("VAD_THRESHOLD", "0.5"))
    MIN_SPEECH_DURATION_MS = int(os.getenv("MIN_SPEECH_DURATION_MS", "250"))
    MIN_SILENCE_DURATION_MS = int(os.getenv("MIN_SILENCE_DURATION_MS", "300"))
    
    # Reading & Pause thresholds (Defaults; dynamically configurable per grade)
    DEFAULT_MIN_PAUSE_MS = 1500  # >=1.5s is a significant decoding pause
    LONG_PRE_WORD_LATENCY_MS = 1800
    POSSIBLE_PROLONGATION_RATIO = 2.5
    POSSIBLE_BLOCK_SILENCE_MS = 2000
    
    # Quality & Confidence Gates
    MIN_AUDIO_DURATION_SEC = 3.0
    MIN_ASR_CONFIDENCE = 0.45
    MIN_COMPLETENESS_RATIO = 0.50
    MIN_SNR_DB = 10.0
    
    # Indian English Phonetic Similarity threshold
    PHONETIC_SIMILARITY_THRESHOLD = 0.78

config = SpeechConfig()
