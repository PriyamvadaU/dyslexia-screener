"""
Audio Preprocessing & Quality Analysis
Converts arbitrary audio streams (WebM, WAV, MP3, OGG) to 16kHz float32 mono PCM.
Calculates SNR and clipping diagnostics.
"""
import io
import numpy as np
import soundfile as sf
import librosa

def load_and_preprocess_audio(audio_bytes: bytes, target_sr: int = 16000) -> tuple[np.ndarray, dict]:
    """
    Decodes audio bytes and normalizes to single-channel 16kHz float32 PCM array.
    Returns: (audio_array, audio_quality_metadata)
    """
    try:
        # Load audio using soundfile / librosa fallback
        bio = io.BytesIO(audio_bytes)
        try:
            audio, sr = sf.read(bio, dtype="float32")
        except Exception:
            bio.seek(0)
            audio, sr = librosa.load(bio, sr=target_sr, mono=True)

        # Convert to mono if multi-channel
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)

        # Resample to 16kHz if necessary
        if sr != target_sr:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
            sr = target_sr

        # Remove DC offset
        audio = audio - np.mean(audio)

        # Compute audio telemetry (SNR & clipping)
        duration_sec = len(audio) / sr
        peak = np.max(np.abs(audio)) if len(audio) > 0 else 0.0
        rms = np.sqrt(np.mean(audio ** 2)) if len(audio) > 0 else 0.0

        # Peak normalization if not silent
        if peak > 0:
            audio = audio / max(peak, 1e-4)

        # Estimate SNR (Signal-to-Noise Ratio)
        noise_floor = np.percentile(np.abs(audio), 10) if len(audio) > 0 else 1e-5
        signal_level = np.percentile(np.abs(audio), 90) if len(audio) > 0 else 1e-4
        snr_db = 20 * np.log10(max(signal_level, 1e-5) / max(noise_floor, 1e-5))

        quality_metadata = {
            "durationSec": round(float(duration_sec), 2),
            "sampleRate": target_sr,
            "peakAmplitude": round(float(peak), 4),
            "rmsEnergy": round(float(rms), 4),
            "signalToNoiseRatioDb": round(float(snr_db), 1),
            "isClipped": bool(peak >= 0.999),
            "isSilent": bool(rms < 0.005)
        }

        return audio.astype(np.float32), quality_metadata

    except Exception as e:
        raise ValueError(f"Failed to decode and preprocess audio stream: {str(e)}")
