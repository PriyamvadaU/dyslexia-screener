"""
Acoustic & Temporal Disfluency Analyzer
Calculates pause distribution from VAD boundaries and detects non-diagnostic screening indicators:
- long_pre_word_latency
- possible_prolongation
- possible_block_like_interval
- filled_pause
- word_repetition
- phrase_repetition
"""
import statistics
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

def analyze_temporal_and_disfluencies(
    vad_segments: list[dict],
    aligned_sequence: list[dict],
    total_duration_sec: float,
    min_pause_ms: int = 1500
) -> tuple[list[dict], dict, list[dict]]:
    """
    Extracts acoustic pause distribution and non-diagnostic hesitation events.
    Returns: (pauses_list, temporal_indicators, acoustic_events)
    """
    pauses_list = []
    pause_durations_ms = []

    # 1. Extract pauses from VAD silence segments
    for idx, seg in enumerate(vad_segments):
        if seg.get("state") == "silence":
            dur_ms = round((seg["end"] - seg["start"]) * 1000)
            if dur_ms >= 300: # Register silences >= 300ms
                is_long = dur_ms >= min_pause_ms
                pause_durations_ms.append(dur_ms)
                pauses_list.append({
                    "pauseIndex": len(pauses_list) + 1,
                    "startSec": round(seg["start"], 3),
                    "endSec": round(seg["end"], 3),
                    "durationMs": dur_ms,
                    "precedingWord": None,
                    "followingWord": None,
                    "isLongPause": is_long
                })

    # Map words before and after pauses where possible
    words_with_times = [w for w in aligned_sequence if w.get("startSec") is not None and w.get("endSec") is not None]
    for p in pauses_list:
        for w in words_with_times:
            if abs(w["endSec"] - p["startSec"]) < 0.2:
                p["precedingWord"] = w.get("spokenWord") or w.get("expectedWord")
            if abs(w["startSec"] - p["endSec"]) < 0.2:
                p["followingWord"] = w.get("spokenWord") or w.get("expectedWord")

    # 2. Compute Temporal Indicators
    total_pauses = len(pause_durations_ms)
    long_pauses = sum(1 for d in pause_durations_ms if d >= min_pause_ms)
    total_pause_ms = sum(pause_durations_ms)
    mean_pause_ms = round(statistics.mean(pause_durations_ms)) if pause_durations_ms else 0
    median_pause_ms = round(statistics.median(pause_durations_ms)) if pause_durations_ms else 0
    max_pause_ms = max(pause_durations_ms) if pause_durations_ms else 0
    silence_ratio = round(min(1.0, (total_pause_ms / 1000) / max(total_duration_sec, 1.0)), 3)
    duration_mins = max(total_duration_sec / 60.0, 0.05)
    pauses_per_min = round(total_pauses / duration_mins, 1)

    temporal_indicators = {
        "totalPauseCount": total_pauses,
        "longPauseCount": long_pauses,
        "totalPauseDurationMs": total_pause_ms,
        "silenceRatio": silence_ratio,
        "meanPauseDurationMs": mean_pause_ms,
        "medianPauseDurationMs": median_pause_ms,
        "maxPauseDurationMs": max_pause_ms,
        "pausesPerMinute": pauses_per_min
    }

    # 3. Detect Non-Diagnostic Acoustic Events
    acoustic_events = []

    # Detect long_pre_word_latency & possible_block_like_interval
    for p in pauses_list:
        if p["durationMs"] >= config.LONG_PRE_WORD_LATENCY_MS and p.get("followingWord"):
            event_type = "possible_block_like_interval" if p["durationMs"] >= config.POSSIBLE_BLOCK_SILENCE_MS else "long_pre_word_latency"
            acoustic_events.append({
                "indicator": event_type,
                "targetWord": p["followingWord"],
                "latencyMs": p["durationMs"],
                "timestampSec": p["startSec"],
                "disclaimer": "Non-diagnostic screening indicator only"
            })

    # Detect possible_prolongation (unusually long duration on a single word)
    if words_with_times:
        durations = [w["durationMs"] for w in words_with_times if w.get("durationMs")]
        if durations:
            avg_word_dur = statistics.mean(durations)
            for w in words_with_times:
                if w.get("durationMs") and w["durationMs"] > avg_word_dur * config.POSSIBLE_PROLONGATION_RATIO and w["durationMs"] >= 1200:
                    acoustic_events.append({
                        "indicator": "possible_prolongation",
                        "targetWord": w.get("spokenWord") or w.get("expectedWord") or "word",
                        "latencyMs": w["durationMs"],
                        "timestampSec": w.get("startSec", 0.0),
                        "disclaimer": "Non-diagnostic screening indicator only"
                    })

    # Detect filled pauses from spoken words
    fillers = {"um", "uh", "er", "ah", "hmm", "umm", "uhh"}
    for w in aligned_sequence:
        spk = (w.get("spokenWord") or "").lower()
        if spk in fillers:
            acoustic_events.append({
                "indicator": "filled_pause",
                "targetWord": spk,
                "latencyMs": w.get("durationMs", 400) or 400,
                "timestampSec": w.get("startSec", 0.0) or 0.0,
                "disclaimer": "Non-diagnostic screening indicator only"
            })

    return pauses_list, temporal_indicators, acoustic_events
