import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';
import { 
  SpeechAssessmentTracker, 
  isSpeechRecognitionSupported, 
  playReadAlongText, 
  stopSpeechSynthesis 
} from '../services/speechService';
import confetti from 'canvas-confetti';
import { 
  ClipboardCheck, 
  Mic, 
  MicOff, 
  Timer, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Play, 
  Square,
  ShieldCheck,
  PenTool,
  RotateCcw,
  Activity,
  Layers,
  Volume2
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

const TEST_PASSAGES = {
  'UKG': "Look at the red ball. The puppy runs fast. The sun is warm and bright.",
  '1': "The friendly puppy saw a little bird. The bird was singing on a branch in the green park.",
  '2': "Sam and Ben built a bright wooden boat. They painted blue stripes along the sides. The boat sailed smoothly across the calm lake.",
  '3': "Deep inside the quiet forest, a quick fox found a hidden basket of fresh apples near a stream. She jumped over the mossy rocks.",
  'default': "Look at the red ball. The puppy runs fast. The sun is warm and bright."
};

export function TestMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const { voicePersona, voiceSpeed } = useAccessibility();
  const navigate = useNavigate();

  // Test Phase: 'questions' | 'speech' | 'submitting'
  const [phase, setPhase] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Section 1: Questions State
  const [qIdx, setQIdx] = useState(0);
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [questionResults, setQuestionResults] = useState([]);
  const [reversalErrors, setReversalErrors] = useState(0);
  const [confusedPairs, setConfusedPairs] = useState({});

  // Section 2: Speech Assessment State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechTimer, setSpeechTimer] = useState(0);
  const [speechError, setSpeechError] = useState('');
  const speechTrackerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const gradeKey = activeChild?.grade === 'K' ? 'UKG' : (activeChild?.grade || 'UKG');
  const targetPassage = TEST_PASSAGES[gradeKey] || TEST_PASSAGES['default'];

  // Fetch assessment questions from backend
  useEffect(() => {
    async function loadQuestions() {
      if (!activeChild?.id) return;
      try {
        setLoadingQuestions(true);
        const res = await api.getAssessmentQuestions(activeChild.id, gradeKey, 10);
        if (res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        }
      } catch (err) {
        console.warn('Failed to fetch questions from backend, using fallback:', err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [activeChild?.id, gradeKey]);

  // Start question timer on qIdx change and autoplay prompt audio if sound question
  useEffect(() => {
    setQStartTime(Date.now());
    if (questions.length > 0 && qIdx < questions.length) {
      const curQ = questions[qIdx];
      if (curQ.type === 'sound_to_picture') {
        playAudio(curQ.audioText);
      }
    }
  }, [qIdx, questions]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
      if (speechTrackerRef.current) {
        speechTrackerRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const playAudio = (text) => {
    stopSpeechSynthesis();
    playReadAlongText({
      text,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0
    });
  };

  if (!activeChild) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-indigo-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-indigo-700">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Child Profile & Parental Consent Required</h2>
        <p className="text-xs text-zinc-500">
          Please select or register a child profile before starting the assessment.
        </p>
        <button
          onClick={onOpenChildModal}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
        >
          Create Child Profile
        </button>
      </div>
    );
  }

  // Handle Option Click
  const handleSelectOption = (selectedOption) => {
    const current = questions[qIdx];
    const reactionTimeMs = Date.now() - qStartTime;
    const isCorrect = selectedOption.id === current.correctOptionId;
    const isReversalConfusion = current.isReversalTest && selectedOption.id === current.reversalOption;

    if (isReversalConfusion) {
      setReversalErrors(prev => prev + 1);
      const pairKey = `${current.correctOptionId}→${selectedOption.id}`;
      setConfusedPairs(prev => ({
        ...prev,
        [pairKey]: {
          expected: current.correctOptionId,
          actual: selectedOption.id,
          count: (prev[pairKey]?.count || 0) + 1
        }
      }));
    }

    const cardResult = {
      cardId: current.id,
      category: current.category,
      target: current.correctOptionId,
      selected: selectedOption.id,
      isCorrect,
      isReversalConfusion,
      isReversalTest: Boolean(current.isReversalTest),
      reversalOption: current.reversalOption || null,
      reactionTimeMs
    };

    const nextResults = [...questionResults, cardResult];
    setQuestionResults(nextResults);

    if (qIdx + 1 < questions.length) {
      setQIdx(qIdx + 1);
    } else {
      // Completed Section 1 -> Advance to Oral Reading
      confetti({ particleCount: 40, spread: 50 });
      setPhase('speech');
    }
  };

  // Start Speech Recognition
  const handleStartRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    setSpeechError('');
    setTranscript('');
    setSpeechTimer(0);

    const tracker = new SpeechAssessmentTracker({
      onInterimTranscript: (text) => setTranscript(text),
      onFinalTranscript: (text) => setTranscript(text),
      onError: (err) => {
        console.warn('Speech error:', err);
        setSpeechError('Microphone audio issue detected. You can complete the test or submit.');
      },
      onEnd: () => {
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    });

    const started = tracker.start();
    if (started) {
      speechTrackerRef.current = tracker;
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setSpeechTimer(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop Speech & Submit to Multimodal Backend Scoring Engine
  const handleStopAndSubmit = async () => {
    let metrics = {
      durationSec: Math.max(5, speechTimer),
      wordsSpoken: transcript ? transcript.trim().split(/\s+/).length : 0,
      wpm: 0,
      pauseCount: 0,
      totalPauseDurationMs: 0,
      averageHesitationMs: 0,
      transcript
    };

    if (speechTrackerRef.current && isRecording) {
      metrics = speechTrackerRef.current.stop();
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setPhase('submitting');

    // 1. Calculate reading accuracy % against target passage
    const targetWords = targetPassage.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
    const spokenWords = (metrics.transcript || transcript).toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);

    let matchCount = 0;
    targetWords.forEach(tw => {
      if (spokenWords.includes(tw)) matchCount++;
    });

    const readingCorrectWords = matchCount;
    const readingTotalWords = targetWords.length;

    // 2. Aggregate flashcard metrics
    const flashcardTotal = questionResults.length;
    const flashcardCorrect = questionResults.filter(r => r.isCorrect).length;
    const reversalAttempts = questionResults.filter(r => r.isReversalTest).length;
    const avgCardReactionTime = flashcardResultsSum(questionResults) / (flashcardTotal || 1);

    // 3. Compile Reading Telemetry Payload
    const readingPayload = {
      transcript: metrics.transcript || transcript,
      targetPassage,
      durationSec: metrics.durationSec,
      pauseCount: metrics.pauseCount,
      totalPauseDurationMs: metrics.totalPauseDurationMs,
      averageHesitationMs: Math.round((metrics.averageHesitationMs + avgCardReactionTime) / 2)
    };

    // 4. Compile Raw Feature Vector for Server-Side Scoring Engine
    const rawFeatures = {
      flashcardTotal,
      flashcardCorrect,
      reversalAttempts,
      reversalErrors,
      confusedPairs: Object.values(confusedPairs),
      readingDurationSec: metrics.durationSec,
      readingTotalWords,
      readingCorrectWords,
      pauseCount: metrics.pauseCount,
      totalPauseDurationMs: metrics.totalPauseDurationMs,
      averageHesitationMs: Math.round((metrics.averageHesitationMs + avgCardReactionTime) / 2),
      transcript: metrics.transcript || transcript,
      targetPassage
    };

    try {
      const response = await api.submitTestSession(activeChild.id, {
        rawFeatures,
        readingTelemetry: readingPayload,
        flashcardResults: questionResults
      });
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      navigate(`/results/${response.score.id}`);
    } catch (err) {
      console.error('Submission failed:', err);
      setSpeechError(err.message || 'Failed to submit screening assessment.');
      setPhase('speech');
    }
  };

  function flashcardResultsSum(resList) {
    return resList.reduce((acc, r) => acc + (r.reactionTimeMs || 0), 0);
  }

  const currentQ = questions[qIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Top Banner: Test Mode (Assessment Badge) */}
      <div className="rounded-3xl bg-indigo-600 text-white p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl">
            <ClipboardCheck className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight uppercase">Screening Assessment</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950 text-[10px] font-bold">
                UKG–Grade 3 Picture & Sound
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium mt-0.5">
              Screening Student: <strong>{activeChild.name}</strong> • Standard: <strong>{gradeKey}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Parental Consent Verified</span>
        </div>
      </div>

      {/* 2-Step Progress Indicator */}
      <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <div className={`p-3 rounded-2xl border transition-all ${phase === 'questions' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-700'}`}>
          1. Picture & Sound Questions ({questionResults.length}/{questions.length || 10})
        </div>
        <div className={`p-3 rounded-2xl border transition-all ${phase === 'speech' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-700'}`}>
          2. Voice & Oral Reading Fluency
        </div>
      </div>

      {/* SECTION 1: PICTURE & SOUND QUESTIONS */}
      {phase === 'questions' && (
        <div className="space-y-6 animate-in fade-in">
          {loadingQuestions || !currentQ ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-zinc-500">Preparing randomized screening question set...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Header & Audio Trigger */}
              <div className="text-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Question {qIdx + 1} of {questions.length} • {currentQ.category}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {currentQ.promptText}
                </h2>

                {/* Big Audio Play Button for Sound Questions */}
                {currentQ.audioText && (
                  <div className="pt-2">
                    <button
                      onClick={() => playAudio(currentQ.audioText)}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>Play / Replay Sound ({voicePersona === 'kavi' ? 'Kavi' : 'Kavita'})</span>
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-zinc-400">
                  Tap the matching picture below.
                </p>
              </div>

              {/* 4 Visual Picture Option Cards (Target Text is NEVER shown to spoil the answer) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 shadow-lg hover:shadow-xl transition-all duration-150 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center min-h-[150px] gap-2 text-center group"
                  >
                    {opt.emoji && (
                      <span className="text-6xl select-none group-hover:scale-110 transition-transform">
                        {opt.emoji}
                      </span>
                    )}
                    {opt.colorHex && (
                      <div 
                        className="w-16 h-16 rounded-2xl shadow-inner border border-black/10 group-hover:scale-110 transition-transform" 
                        style={{ backgroundColor: opt.colorHex }}
                      />
                    )}
                    {opt.letter && (
                      <span className="text-5xl font-black font-lexend text-zinc-900 dark:text-zinc-100">
                        {opt.letter}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center text-xs text-zinc-400 pt-2">
                Reaction time and spatial orientation are being measured automatically.
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: ORAL READING FLUENCY TEST */}
      {phase === 'speech' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Step 2 • Oral Reading Fluency
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Read the Passage Aloud into the Microphone
            </h2>
            <p className="text-xs text-zinc-500">
              Press "Start Speaking" and have the child read at their natural pace.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-indigo-200 dark:border-zinc-700 shadow-xl space-y-6">
            <div className="text-xl sm:text-2xl leading-loose font-medium text-zinc-900 dark:text-zinc-100 text-center select-none font-lexend">
              "{targetPassage}"
            </div>

            {/* Live Recording Controls */}
            <div className="pt-4 flex flex-col items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 transform hover:scale-105"
                >
                  <Mic className="w-5 h-5 animate-bounce" />
                  <span>Start Microphone & Read Aloud</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-xs animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>Listening... ({speechTimer}s elapsed)</span>
                  </div>

                  <button
                    onClick={handleStopAndSubmit}
                    className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Finished Reading — Submit Assessment</span>
                  </button>
                </div>
              )}
            </div>

            {/* Live Transcript Box */}
            {transcript && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-left space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Live Speech-to-Text Transcript:
                </div>
                <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                  {transcript}
                </p>
              </div>
            )}

            {speechError && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-medium">
                {speechError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMITTING SPINNER */}
      {phase === 'submitting' && (
        <div className="p-12 text-center space-y-4 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-xl">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-bold">Computing Screening Risk Analysis...</h3>
          <p className="text-xs text-zinc-500">
            Analyzing phonological decoding rate (WPM), acoustic pauses, and picture choice accuracy...
          </p>
        </div>
      )}

      <MedicalDisclaimer />

    </div>
  );
}

