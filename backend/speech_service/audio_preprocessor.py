"""
Audio Preprocessing & Quality Analysis
Converts arbitrary audio streams (WebM, WAV, MP3, OGG, M4A) to 16kHz float32 mono PCM.
Calculates SNR and clipping diagnostics.
"""
import io
import numpy as np
import soundfile as sf
import librosa

def _decode_with_pyav(audio_bytes: bytes, target_sr: int) -> tuple[np.ndarray, int]:
    """
    Decode in-memory audio (M4A, MP3, OGG, WebM, WAV …) using PyAV 18.x.
    Uses arithmetic channel averaging (mean) for stereo-to-mono downmixing to prevent
    the ~1.414x equal-power gain boost of libswresample that causes false clipping detection.
    Returns (mono_float32_array, target_sr).
    Raises ImportError if av is not installed, or av.AVError on decode failure.
    """
    import av  # optional dependency – PyAV 18.1.0
    bio = io.BytesIO(audio_bytes)
    container = av.open(bio)
    resampler = av.AudioResampler(format="fltp", rate=target_sr)
    frames: list[np.ndarray] = []
    for raw_frame in container.decode(audio=0):
        for resampled_frame in resampler.resample(raw_frame):
            arr = resampled_frame.to_ndarray()
            if arr.ndim > 1 and arr.shape[0] > 1:
                mono = np.mean(arr, axis=0)
            elif arr.ndim > 1:
                mono = arr[0]
            else:
                mono = arr
            frames.append(mono)
    container.close()
    if not frames:
        raise ValueError("PyAV decoded zero audio frames")
    return np.concatenate(frames).astype(np.float32), target_sr


def load_and_preprocess_audio(audio_bytes: bytes, target_sr: int = 16000) -> tuple[np.ndarray, dict]:
    """
    Decodes audio bytes and normalizes to single-channel 16kHz float32 PCM array.
    Decode priority:
      1. PyAV 18.x  – handles M4A, MP3, OGG, WebM, WAV from BytesIO
      2. soundfile  – WAV/FLAC/OGG (fast, lossless)
      3. librosa    – last-resort fallback
    Returns: (audio_array, audio_quality_metadata)
    """
    try:
        # --- 1. Try PyAV first (supports all container formats from BytesIO) ---
        try:
            audio, sr = _decode_with_pyav(audio_bytes, target_sr)
            # PyAV resampler already delivers mono @ target_sr, so skip further
            # mono/resample steps below.
        except ImportError:
            # PyAV not installed – fall through to soundfile/librosa
            bio = io.BytesIO(audio_bytes)
            try:
                audio, sr = sf.read(bio, dtype="float32")
            except Exception:
                bio.seek(0)
                audio, sr = librosa.load(bio, sr=target_sr, mono=True)
        except Exception:
            # PyAV failed on this stream – fall back to soundfile/librosa
            bio = io.BytesIO(audio_bytes)
            try:
                audio, sr = sf.read(bio, dtype="float32")
            except Exception:
                bio.seek(0)
                audio, sr = librosa.load(bio, sr=target_sr, mono=True)

        # Convert to mono if multi-channel (soundfile/librosa path may return stereo)
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
