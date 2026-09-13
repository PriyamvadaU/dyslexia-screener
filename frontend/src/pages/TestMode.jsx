import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { api } from '../services/api';
import { 
  SpeechAssessmentTracker, 
  isSpeechRecognitionSupported 
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
  ShieldCheck
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

// 8 Timed Flashcard Prompts
const TEST_FLASHCARDS = [
  {
    id: 't1',
    prompt: "Which one is the letter 'b' (as in 'ball')?",
    target: 'b',
    options: ['d', 'b', 'p', 'q'],
    isReversalTest: true,
    reversalOption: 'd'
  },
  {
    id: 't2',
    prompt: "Which letter makes the 'duh' sound (as in 'dog')?",
    target: 'd',
    options: ['b', 'p', 'd', 'q'],
    isReversalTest: true,
    reversalOption: 'b'
  },
  {
    id: 't3',
    prompt: "Which letter is 'p' (with the tail hanging down)?",
    target: 'p',
    options: ['q', 'b', 'd', 'p'],
    isReversalTest: true,
    reversalOption: 'q'
  },
  {
    id: 't4',
    prompt: "Which letter is 'q' (as in 'queen')?",
    target: 'q',
    options: ['p', 'q', 'b', 'd'],
    isReversalTest: true,
    reversalOption: 'p'
  },
  {
    id: 't5',
    prompt: "Which letter is 'm' (two peaks pointing UP)?",
    target: 'm',
    options: ['w', 'm', 'n', 'u'],
    isReversalTest: true,
    reversalOption: 'w'
  },
  {
    id: 't6',
    prompt: "Which letter is 'w' (waves splashing DOWN)?",
    target: 'w',
    options: ['m', 'n', 'u', 'w'],
    isReversalTest: true,
    reversalOption: 'm'
  },
  {
    id: 't7',
    prompt: "Select the letter 'n' (arch on top):",
    target: 'n',
    options: ['u', 'n', 'm', 'h'],
    isReversalTest: true,
    reversalOption: 'u'
  },
  {
    id: 't8',
    prompt: "Which one is 'b' (bat before the ball)?",
    target: 'b',
    options: ['d', 'p', 'b', 'q'],
    isReversalTest: true,
    reversalOption: 'd'
  }
];

const TEST_PASSAGES = {
  'K': "A big red dog can run. The dog has a wet ball. Look at him go fast.",
  '1': "The friendly brown puppy saw a little bird. The bird was singing on a branch in the green park.",
  '2': "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine.",
  '3': "Deep inside the quiet forest, a quick fox found a hidden basket of fresh apples near a bubbling stream. She jumped over the mossy rocks with delight.",
  'default': "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine."
};

export function TestMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const navigate = useNavigate();

  // Test Phase: 'flashcards' | 'speech' | 'submitting'
  const [phase, setPhase] = useState('flashcards');

  // Section 1: Flashcards State
  const [cardIdx, setCardIdx] = useState(0);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [flashcardResults, setFlashcardResults] = useState([]);
  const [reversalErrors, setReversalErrors] = useState(0);
  const [confusedPairs, setConfusedPairs] = useState({});

  // Section 2: Speech Assessment State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechTimer, setSpeechTimer] = useState(0);
  const [speechError, setSpeechError] = useState('');
  const speechTrackerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const gradeKey = activeChild?.grade || '2';
  const targetPassage = TEST_PASSAGES[gradeKey] || TEST_PASSAGES['default'];

  // Start card timer on cardIdx change
  useEffect(() => {
    setCardStartTime(Date.now());
  }, [cardIdx]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (speechTrackerRef.current) {
        speechTrackerRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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

  // Handle Flashcard Option Click
  const handleSelectOption = (selected) => {
    const current = TEST_FLASHCARDS[cardIdx];
    const reactionTimeMs = Date.now() - cardStartTime;
    const isCorrect = selected === current.target;
    const isReversalConfusion = current.isReversalTest && selected === current.reversalOption;

    if (isReversalConfusion) {
      setReversalErrors(prev => prev + 1);
      const pairKey = `${current.target}→${selected}`;
      setConfusedPairs(prev => ({
        ...prev,
        [pairKey]: {
          expected: current.target,
          actual: selected,
          count: (prev[pairKey]?.count || 0) + 1
        }
      }));
    }

    const cardResult = {
      cardId: current.id,
      target: current.target,
      selected,
      isCorrect,
      isReversalConfusion,
      reactionTimeMs
    };

    const nextResults = [...flashcardResults, cardResult];
    setFlashcardResults(nextResults);

    if (cardIdx + 1 < TEST_FLASHCARDS.length) {
      setCardIdx(cardIdx + 1);
    } else {
      // Completed Flashcard section -> Advance to Speech Assessment
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
        setSpeechError('Microphone audio issue detected. You can complete the test or type below.');
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

  // Stop Speech & Submit to Backend Scoring Engine
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
    const flashcardTotal = flashcardResults.length;
    const flashcardCorrect = flashcardResults.filter(r => r.isCorrect).length;
    const reversalAttempts = flashcardResults.filter(r => r.isReversalConfusion !== undefined).length;
    const avgCardReactionTime = flashcardResults.reduce((acc, r) => acc + r.reactionTimeMs, 0) / (flashcardTotal || 1);

    // 3. Compile Raw Feature Vector for Server-Side Scoring Engine
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
      transcript: metrics.transcript || transcript
    };

    try {
      const response = await api.submitTestSession(activeChild.id, rawFeatures);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      navigate(`/results/${response.score.id}`);
    } catch (err) {
      console.error('Submission failed:', err);
      setSpeechError(err.message || 'Failed to submit assessment to scoring engine.');
      setPhase('speech');
    }
  };

  const currentCard = TEST_FLASHCARDS[cardIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Banner: Test Mode (Assessment Badge) */}
      <div className="rounded-2xl bg-indigo-600 text-white p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <ClipboardCheck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight uppercase">Test Window</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-indigo-950 text-[10px] font-bold">
                Graded & Timed Assessment
              </span>
            </div>
            <p className="text-xs text-indigo-100 font-medium">
              Screening Student: <strong>{activeChild.name}</strong> (Grade {activeChild.grade})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Parental Consent Verified</span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 px-1">
        <span>Step 1: Visual & Reversal Cards ({flashcardResults.length}/{TEST_FLASHCARDS.length})</span>
        <span>Step 2: Oral Speech Read-Aloud</span>
      </div>

      {/* SECTION 1: FLASHCARDS TEST */}
      {phase === 'flashcards' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Question {cardIdx + 1} of {TEST_FLASHCARDS.length}
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {currentCard.prompt}
            </h2>
            <p className="text-xs text-zinc-500">Tap the correct letter below as accurately and smoothly as you can.</p>
          </div>

          {/* 4 Option Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
            {currentCard.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                className="p-8 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-5xl font-black text-zinc-900 dark:text-zinc-100 font-lexend shadow-lg hover:shadow-xl transition-all duration-150 transform hover:scale-105 active:scale-95 flex items-center justify-center min-h-[140px]"
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-zinc-400 pt-4">
            Reaction time and spatial letter orientation are being recorded.
          </div>
        </div>
      )}

      {/* SECTION 2: ORAL SPEECH READ-ALOUD TEST */}
      {phase === 'speech' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Section 2: Speech & Fluency Assessment
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Read the Passage Aloud into the Microphone
            </h2>
            <p className="text-xs text-zinc-500">
              Press "Start Speaking" and have the child read the text at their natural pace.
            </p>
          </div>

          {/* Reading Target Passage Card */}
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
            Evaluating WPM fluency, pause frequencies, and letter reversal penalties against developmental baselines...
          </p>
        </div>
      )}

      <MedicalDisclaimer />

    </div>
  );
}
