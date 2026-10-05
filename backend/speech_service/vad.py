"""
Silero VAD (Voice Activity Detection) Integration
Segments audio into exact speech and non-speech silence intervals.
"""
import torch
import numpy as np
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

class SileroVADWrapper:
    def __init__(self):
        self.model = None
        self.utils = None
        self._load_model()

    def _load_model(self):
        try:
            # Load Silero VAD model via torch.hub
            self.model, self.utils = torch.hub.load(
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
                onnx=False
            )
        except Exception as e:
            print(f"[VAD] Warning: Failed to load Silero VAD from torch.hub, falling back to energy-based VAD: {e}")
            self.model = None

    def segment_speech_and_silence(self, audio_array: np.ndarray, sr: int = 16000) -> tuple[list[dict], float, float]:
        """
        Extracts speech segments and calculates acoustic speech/silence duration.
        Returns: (vad_segments, total_speech_sec, total_silence_sec)
        """
        total_duration = len(audio_array) / sr
        if total_duration <= 0:
            return [], 0.0, 0.0

        if self.model is not None:
            try:
                (get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = self.utils
                tensor = torch.from_numpy(audio_array)
                speech_timestamps = get_speech_timestamps(
                    tensor,
                    self.model,
                    sampling_rate=sr,
                    threshold=config.VAD_THRESHOLD,
                    min_speech_duration_ms=config.MIN_SPEECH_DURATION_MS,
                    min_silence_duration_ms=config.MIN_SILENCE_DURATION_MS
                )

                segments = []
                last_end = 0.0
                total_speech = 0.0

                for ts in speech_timestamps:
                    start_sec = round(ts["start"] / sr, 3)
                    end_sec = round(ts["end"] / sr, 3)

                    # Silence segment before speech
                    if start_sec > last_end + 0.05:
                        segments.append({
                            "start": last_end,
                            "end": start_sec,
                            "state": "silence"
                        })

                    segments.append({
                        "start": start_sec,
                        "end": end_sec,
                        "state": "speech"
                    })
                    total_speech += (end_sec - start_sec)
                    last_end = end_sec

                # Trailing silence
                if last_end < total_duration - 0.05:
                    segments.append({
                        "start": last_end,
                        "end": round(total_duration, 3),
                        "state": "silence"
                    })

                total_silence = max(0.0, total_duration - total_speech)
                return segments, round(total_speech, 3), round(total_silence, 3)

            except Exception as e:
                print(f"[VAD] Error during Silero VAD inference: {e}, falling back to energy VAD")

        # Energy-based VAD fallback
        return self._energy_vad_fallback(audio_array, sr)

    def _energy_vad_fallback(self, audio: np.ndarray, sr: int) -> tuple[list[dict], float, float]:
        frame_len = int(0.03 * sr) # 30ms
        hop_len = int(0.01 * sr)   # 10ms
        energy = np.array([
            np.sum(audio[i:i + frame_len] ** 2)
            for i in range(0, len(audio) - frame_len, hop_len)
        ])
        threshold = np.percentile(energy, 35) * 1.5 if len(energy) > 0 else 0.01
        is_speech = energy > threshold

        segments = []
        total_speech = 0.0
        total_duration = len(audio) / sr

        if len(is_speech) == 0:
            return [{"start": 0.0, "end": total_duration, "state": "silence"}], 0.0, total_duration

        cur_state = "speech" if is_speech[0] else "silence"
        cur_start = 0.0

        for i, val in enumerate(is_speech):
            state = "speech" if val else "silence"
            if state != cur_state:
                end_time = round(i * hop_len / sr, 3)
                segments.append({"start": cur_start, "end": end_time, "state": cur_state})
                if cur_state == "speech":
                    total_speech += (end_time - cur_start)
                cur_state = state
                cur_start = end_time

        segments.append({"start": cur_start, "end": round(total_duration, 3), "state": cur_state})
        if cur_state == "speech":
            total_speech += (total_duration - cur_start)

        total_silence = max(0.0, total_duration - total_speech)
        return segments, round(total_speech, 3), round(total_silence, 3)

vad_service = SileroVADWrapper()
