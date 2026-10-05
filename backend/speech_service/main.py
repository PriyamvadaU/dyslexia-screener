"""
LexiScreen Speech Analysis Microservice (FastAPI Entrypoint)
Provides HTTP endpoint for audio reading analysis, VAD, ASR, forced alignment,
expected-vs-spoken alignment, and non-diagnostic disfluency metrics.
"""
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from .config import config
    from .audio_preprocessor import load_and_preprocess_audio
    from .vad import vad_service
    from .transcriber import transcriber
    from .forced_aligner import forced_aligner
    from .expected_aligner import align_expected_and_spoken, normalize_text_tokens
    from .temporal_analyzer import analyze_temporal_and_disfluencies
    from .quality_gate import evaluate_quality_and_state
except (ImportError, ValueError):
    from config import config
    from audio_preprocessor import load_and_preprocess_audio
    from vad import vad_service
    from transcriber import transcriber
    from forced_aligner import forced_aligner
    from expected_aligner import align_expected_and_spoken, normalize_text_tokens
    from temporal_analyzer import analyze_temporal_and_disfluencies
    from quality_gate import evaluate_quality_and_state


app = FastAPI(
    title="LexiScreen Speech Analysis Microservice",
    version="2.1.0",
    description="ASR, VAD, Forced Alignment, and Oral Reading Fluency Analysis"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "LexiScreen Speech Analysis Engine",
        "version": "2.1.0",
        "device": config.DEVICE,
        "defaultModel": config.DEFAULT_MODEL_SIZE,
        "computeType": config.COMPUTE_TYPE
    }

@app.get("/models")
def list_models():
    return {
        "availableModels": ["large-v3", "medium.en", "small.en", "base.en", "tiny.en"],
        "activeModel": config.DEFAULT_MODEL_SIZE,
        "activeDevice": config.DEVICE
    }

@app.post("/analyze-reading")
async def analyze_reading(
    audio: UploadFile = File(...),
    expected_passage: str = Form(...),
    grade: str = Form("2"),
    model_size: str = Form(None),
    min_pause_ms: int = Form(1500)
):
    start_time = time.time()

    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required.")
    if not expected_passage or not expected_passage.strip():
        raise HTTPException(status_code=400, detail="Expected passage text is required.")

    try:
        # 1. Read & Preprocess Audio (16kHz float32 mono)
        raw_bytes = await audio.read()
        audio_array, audio_meta = load_and_preprocess_audio(raw_bytes, target_sr=config.VAD_SAMPLING_RATE)
        duration_sec = audio_meta["durationSec"]

        # 2. Silero VAD (Speech/Silence Segmentation)
        vad_segments, speech_dur_sec, silence_dur_sec = vad_service.segment_speech_and_silence(
            audio_array, sr=config.VAD_SAMPLING_RATE
        )

        # 3. faster-whisper ASR
        asr_res = transcriber.transcribe(audio_array)
        raw_transcript = asr_res.get("rawTranscript", "")
        asr_words = asr_res.get("words", [])

        # 4. WhisperX Phonetic Forced Alignment
        aligned_words = forced_aligner.align(asr_words, audio_array, raw_transcript)

        # 5. Expected-vs-Spoken Deterministic Alignment
        align_res = align_expected_and_spoken(expected_passage, aligned_words)

        # 6. Acoustic & Temporal Disfluency Analysis
        pauses, temporal_indicators, acoustic_events = analyze_temporal_and_disfluencies(
            vad_segments=vad_segments,
            aligned_sequence=align_res["wordTimings"],
            total_duration_sec=duration_sec,
            min_pause_ms=min_pause_ms
        )

        # 7. Quality Gate & Validity State Assessment
        assessment_state, quality_flags = evaluate_quality_and_state(
            audio_meta=audio_meta,
            aligned_res=align_res,
            total_speech_sec=speech_dur_sec
        )

        # 8. Compute Reading Rates
        duration_mins = max(duration_sec / 60.0, 0.05)
        wpm = round(align_res["correctWordCount"] / duration_mins) if duration_mins > 0 else 0
        speech_rate = round(align_res["spokenWordCount"] / max(speech_dur_sec, 0.1), 2)

        inference_duration_ms = round((time.time() - start_time) * 1000)

        # 9. Return structured ReadingAnalysis payload
        return {
            "assessmentState": assessment_state,
            "qualityFlags": quality_flags,
            "rawTranscript": raw_transcript,
            "normalizedTranscript": " ".join(normalize_text_tokens(raw_transcript)),
            "expectedText": expected_passage.strip(),
            "durationSec": duration_sec,
            "speechDurationSec": speech_dur_sec,
            "silenceDurationSec": silence_dur_sec,
            "expectedWordCount": align_res["expectedWordCount"],
            "spokenWordCount": align_res["spokenWordCount"],
            "correctWordCount": align_res["correctWordCount"],
            "uncertainWordCount": align_res["uncertainWordCount"],
            "decodingAccuracyPct": align_res["decodingAccuracyPct"],
            "wpm": wpm,
            "speechRateWordsPerSec": speech_rate,
            "omissions": align_res["omissions"],
            "substitutions": align_res["substitutions"],
            "insertions": align_res["insertions"],
            "repetitions": align_res["repetitions"],
            "pauses": pauses,
            "temporalIndicators": temporal_indicators,
            "acousticEvents": acoustic_events,
            "wordTimings": align_res["wordTimings"],
            "vadSegments": vad_segments,
            "modelMetadata": {
                "asrEngine": f"faster-whisper-{config.DEFAULT_MODEL_SIZE}",
                "alignerEngine": "whisperx-wav2vec2-en",
                "vadEngine": "silero-vad-v5",
                "inferenceDurationMs": inference_duration_ms,
                "deviceUsed": config.DEVICE
            }
        }

    except Exception as e:
        print(f"[SpeechService] Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech analysis pipeline failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=False)
