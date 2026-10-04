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
  ArrowLeft,
  Play, 
  Square,
  ShieldCheck, 
  PenTool, 
  RotateCcw, 
  Activity, 
  Layers, 
  Volume2,
  Compass,
  Lock,
  ChevronRight
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

const TEST_PASSAGES = {
  'UKG': "Look at the red ball. The puppy runs fast. The sun is warm and bright.",
  '1': "The friendly puppy saw a little bird. The bird was singing on a branch in the green park.",
  '2': "Sam and Ben built a bright wooden boat. They painted blue stripes along the sides. The boat sailed smoothly across the calm lake.",
  '3': "Deep inside the quiet forest, a quick fox found a hidden basket of fresh apples near a stream. She jumped over the mossy rocks.",
  'default': "Look at the red ball. The puppy runs fast. The sun is warm and bright."
};

// Available Assessment Modules (derived from verified existing question bank & screening architecture)
const ASSESSMENT_MODULES = [
  {
    id: 'full_screening',
    title: 'Comprehensive Screening Assessment',
    badge: 'Standard 2-Step',
    description: '10 balanced multimodal literacy questions followed by oral reading fluency evaluation.',
    icon: ClipboardCheck,
    color: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200',
    available: true,
    hasOralReading: true,
    questionCount: 10
  },
  {
    id: 'phonological',
    title: 'Phonological & Auditory Screener',
    badge: 'Auditory Focus',
    description: '10 targeted items assessing sound discrimination, rhyming recognition, and syllable beats.',
    icon: Volume2,
    color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
    available: true,
    hasOralReading: false,
    questionCount: 10
  },
  {
    id: 'letter_orientation',
    title: 'Letter Orientation & Mirror Discrimination',
    badge: 'Spatial Focus',
    description: 'Targeted visual screening isolating mirror-letter confusion (b/d, p/q, m/w patterns).',
    icon: Layers,
    color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
    available: true,
    hasOralReading: false,
    questionCount: 10
  },
  {
    id: 'handwriting_hardware',
    title: 'Handwriting & Kinematic Screening',
    badge: 'Hardware Extension',
    description: 'External USB/digital whiteboard drawing kinematic stroke analysis. Scheduled for next release.',
    icon: PenTool,
    color: 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 opacity-60',
    available: false,
    hasOralReading: false,
    questionCount: 0
  }
];

export function TestMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const { voicePersona, voiceSpeed } = useAccessibility();
  const navigate = useNavigate();

  // Test Phase: 'hub' | 'questions' | 'speech' | 'submitting'
  const [phase, setPhase] = useState('hub');
  const [selectedModule, setSelectedModule] = useState(ASSESSMENT_MODULES[0]);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Section 1: Questions State with Navigation & Backstack
  const [qIdx, setQIdx] = useState(0);
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: { selectedOption, reactionTimeMs } }
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

  // Start selected assessment module
  const handleLaunchModule = async (module) => {
    if (!module.available) return;
    if (!activeChild?.id) return;

    setSelectedModule(module);
    setQIdx(0);
    setSelectedAnswers({});
    setReversalErrors(0);
    setConfusedPairs({});
    setTranscript('');
    setSpeechError('');

    try {
      setLoadingQuestions(true);
      setPhase('questions');
      const res = await api.getAssessmentQuestions(activeChild.id, gradeKey, module.questionCount || 10, module.id);
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.warn('Failed to fetch assessment questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Start question timer on qIdx change and autoplay prompt audio if sound question
  useEffect(() => {
    setQStartTime(Date.now());
    if (phase === 'questions' && questions.length > 0 && qIdx < questions.length) {
      const curQ = questions[qIdx];
      if (curQ && curQ.audioText) {
        playAudio(curQ.audioText);
      }
    }
  }, [qIdx, questions, phase]);

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

  // Handle Option Click (stores answer for qIdx without immediately jumping away)
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

    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: {
        cardId: current.id,
        category: current.category,
        target: current.correctOptionId,
        selected: selectedOption.id,
        selectedLabel: selectedOption.label,
        isCorrect,
        isReversalConfusion,
        isReversalTest: Boolean(current.isReversalTest),
        reversalOption: current.reversalOption || null,
        reactionTimeMs
      }
    }));
  };

  // Next Question in Assessment
  const handleNextAssessmentQuestion = () => {
    if (qIdx + 1 < questions.length) {
      setQIdx(qIdx + 1);
    } else {
      // Completed all questions in Section 1
      confetti({ particleCount: 40, spread: 50 });
      if (selectedModule.hasOralReading) {
        setPhase('speech');
      } else {
        // Direct submit for modular screener without speech passage
        handleSubmitAssessmentResults();
      }
    }
  };

  // Previous Question in Assessment (Returns smoothly to previous question)
  const handlePrevAssessmentQuestion = () => {
    if (qIdx > 0) {
      setQIdx(qIdx - 1);
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
  const handleSubmitAssessmentResults = async () => {
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

    // Compile Question Results array
    const questionResultsList = Object.keys(selectedAnswers)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => selectedAnswers[k]);

    // 1. Calculate reading accuracy % against target passage (if oral reading module)
    const targetWords = targetPassage.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
    const spokenWords = (metrics.transcript || transcript).toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);

    let matchCount = 0;
    targetWords.forEach(tw => {
      if (spokenWords.includes(tw)) matchCount++;
    });

    const readingCorrectWords = matchCount;
    const readingTotalWords = targetWords.length;

    // 2. Aggregate flashcard metrics
    const flashcardTotal = questionResultsList.length;
    const flashcardCorrect = questionResultsList.filter(r => r.isCorrect).length;
    const reversalAttempts = questionResultsList.filter(r => r.isReversalTest).length;
    const avgCardReactionTime = flashcardResultsSum(questionResultsList) / (flashcardTotal || 1);

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
        flashcardResults: questionResultsList
      });
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      navigate(`/results/${response.score.id}`);
    } catch (err) {
      console.error('Submission failed:', err);
      setSpeechError(err.message || 'Failed to submit screening assessment.');
      setPhase(selectedModule.hasOralReading ? 'speech' : 'questions');
    }
  };

  function flashcardResultsSum(resList) {
    return resList.reduce((acc, r) => acc + (r.reactionTimeMs || 0), 0);
  }

  // ==========================================
  // VIEW 1: ASSESSMENT MODULE HUB
  // ==========================================
  if (phase === 'hub') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="rounded-3xl bg-indigo-600 text-white p-6 sm:p-8 shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <ClipboardCheck className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  Screening Assessment Modules
                </h1>
                <p className="text-xs text-indigo-100 font-medium">
                  Candidate: <strong>{activeChild.name}</strong> • Standard: <strong>{gradeKey === 'UKG' ? 'UKG (Age 5–6)' : `Grade ${gradeKey}`}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Parental Consent Verified</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            Select Screening Assessment Module
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSESSMENT_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className={`p-6 rounded-3xl border-2 shadow-sm flex flex-col justify-between gap-4 transition-all ${mod.color}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-indigo-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-white text-[10px] font-bold">
                        {mod.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black">
                      {mod.title}
                    </h3>
                    <p className="text-xs leading-relaxed opacity-85">
                      {mod.description}
                    </p>
                  </div>

                  <div>
                    {mod.available ? (
                      <button
                        onClick={() => handleLaunchModule(mod)}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all transform active:scale-95"
                      >
                        <span>Start Assessment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-500 text-xs font-semibold flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Scheduled for Next Update</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <MedicalDisclaimer />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE ASSESSMENT FLOW
  // ==========================================
  const currentQ = questions[qIdx];
  const currentAnswer = selectedAnswers[qIdx];
  const isCurrentAnswered = Boolean(currentAnswer);

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
              <span className="font-black text-xl tracking-tight uppercase">{selectedModule.title}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950 text-[10px] font-bold">
                {gradeKey === 'UKG' ? 'UKG' : `Grade ${gradeKey}`}
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium mt-0.5">
              Screening Student: <strong>{activeChild.name}</strong> • Module: <strong>{selectedModule.badge}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            stopSpeechSynthesis();
            setPhase('hub');
          }}
          className="px-3.5 py-1.5 rounded-xl border border-white/30 text-white text-xs font-bold hover:bg-white/10"
        >
          Exit Assessment
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <div className={`p-3 rounded-2xl border transition-all ${phase === 'questions' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-700'}`}>
          1. Questions ({Object.keys(selectedAnswers).length}/{questions.length || 10})
        </div>
        <div className={`p-3 rounded-2xl border transition-all ${phase === 'speech' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-700'}`}>
          2. Voice & Oral Reading Fluency {selectedModule.hasOralReading ? '' : '(Optional)'}
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
                  Question {qIdx + 1} of {questions.length} • {currentQ.category || currentQ.domain}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 font-lexend">
                  {currentQ.promptText || currentQ.question}
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
                  Select your response below.
                </p>
              </div>

              {/* 4 Visual Option Cards (Target Text is NEVER shown to spoil the answer) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
                {currentQ.options?.map((opt) => {
                  const isSelected = currentAnswer?.selected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-6 rounded-3xl border-2 shadow-lg transition-all duration-150 transform active:scale-95 flex flex-col items-center justify-center min-h-[150px] gap-2 text-center ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500 scale-105'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:scale-105'
                      }`}
                    >
                      {opt.emoji && (
                        <span className="text-6xl select-none">
                          {opt.emoji}
                        </span>
                      )}
                      {opt.colorHex && (
                        <div 
                          className="w-16 h-16 rounded-2xl shadow-inner border border-black/10" 
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      )}
                      {opt.letter && (
                        <span className="text-5xl font-black font-lexend text-zinc-900 dark:text-zinc-100">
                          {opt.letter}
                        </span>
                      )}
                      <span className="text-sm font-bold font-lexend mt-1 text-zinc-800 dark:text-zinc-200">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          Selected ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Bar: Previous and Next Question */}
              <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={handlePrevAssessmentQuestion}
                  disabled={qIdx === 0}
                  className={`px-5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    qIdx === 0
                      ? 'opacity-30 cursor-not-allowed border-zinc-200 dark:border-zinc-700 text-zinc-400'
                      : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-sm'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNextAssessmentQuestion}
                  disabled={!isCurrentAnswered}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    !isCurrentAnswered
                      ? 'opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700 text-zinc-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg transform active:scale-95'
                  }`}
                >
                  <span>{qIdx + 1 === questions.length ? (selectedModule.hasOralReading ? 'Proceed to Speech Test →' : 'Submit Assessment 🎉') : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center text-xs text-zinc-400 pt-1">
                Reaction time and spatial orientation are recorded unobtrusively.
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
                    onClick={handleSubmitAssessmentResults}
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

export default TestMode;
