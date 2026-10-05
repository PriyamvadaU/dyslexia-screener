"""
Quality Gate & Validity State Assessor
Evaluates signal quality, completeness, and ASR confidence.
Assigns session validity state: 'valid' | 'review_required' | 'insufficient_quality' | 'incomplete'
"""
try:
    from .config import config
except (ImportError, ValueError):
    from config import config

def evaluate_quality_and_state(
    audio_meta: dict,
    aligned_res: dict,
    total_speech_sec: float
) -> tuple[str, list[str]]:
    """
    Determines assessment state and quality warning flags.
    Returns: (assessment_state, quality_flags)
    """
    flags = []
    duration_sec = audio_meta.get("durationSec", 0.0)
    snr_db = audio_meta.get("signalToNoiseRatioDb", 20.0)
    is_silent = audio_meta.get("isSilent", False)
    is_clipped = audio_meta.get("isClipped", False)

    expected_count = aligned_res.get("expectedWordCount", 0)
    spoken_count = aligned_res.get("spokenWordCount", 0)
    uncertain_count = aligned_res.get("uncertainWordCount", 0)

    completeness_ratio = spoken_count / max(1, expected_count)

    # Flag evaluations
    if duration_sec < config.MIN_AUDIO_DURATION_SEC:
        flags.append("AUDIO_TOO_SHORT")
    if is_silent or total_speech_sec < 1.0:
        flags.append("INSUFFICIENT_SPEECH")
    if snr_db < config.MIN_SNR_DB:
        flags.append("LOW_SNR")
    if is_clipped:
        flags.append("CLIPPING_DETECTED")
    if completeness_ratio < config.MIN_COMPLETENESS_RATIO and expected_count > 0:
        flags.append("INCOMPLETE_READING")
    if spoken_count > 0 and (uncertain_count / spoken_count) > 0.35:
        flags.append("LOW_ASR_CONFIDENCE")

    # State decision tree
    if "AUDIO_TOO_SHORT" in flags or "INSUFFICIENT_SPEECH" in flags or is_silent:
        assessment_state = "insufficient_quality"
    elif "INCOMPLETE_READING" in flags:
        assessment_state = "incomplete"
    elif "LOW_SNR" in flags or "LOW_ASR_CONFIDENCE" in flags or "CLIPPING_DETECTED" in flags:
        assessment_state = "review_required"
    else:
        assessment_state = "valid"

    return assessment_state, flags
