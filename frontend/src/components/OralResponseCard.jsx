import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, CheckCircle2, RotateCcw, FastForward, Award, HelpCircle } from 'lucide-react';
import { playReadAlongText, stopSpeechSynthesis, isSpeechRecognitionSupported } from '../services/speechService';

export function OralResponseCard({
  question,
  voicePersona = 'kavi',
  voiceSpeed = 'normal',
  onScore,
  onNext
}) {
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'try_again' | 'skipped' | null
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Reset state on question change
    setSpokenTranscript('');
    setStatus(null);
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
  }, [question?.id]);

  if (!question) return null;

  const playAudio = () => {
    stopSpeechSynthesis();
    const textToPlay = question.audio_script || question.stimulus || question.question;
    playReadAlongText({
      text: textToPlay,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0
    });
  };

  const startMic = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech Recognition is not supported on this browser. You can use manual evaluator marking below.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onstart = () => setIsListening(true);
    rec.onresult = (event) => {
      let finalStr = '';
      for (let i = 0; i < event.results.length; i++) {
        finalStr += event.results[i][0].transcript;
      }
      setSpokenTranscript(finalStr);
    };
    rec.onerror = (e) => {
      console.warn('Speech rec error:', e);
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }
  };

  const handleEvaluation = (evaluation) => {
    setStatus(evaluation);
    const isCorrect = evaluation === 'correct';
    if (onScore) {
      onScore(isCorrect, evaluation);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Question Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold">
              {question.grade ? `Grade ${question.grade}` : 'UKG'} • Oral Activity
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {question.skill || question.domain}
            </span>
          </div>

          <button
            onClick={playAudio}
            className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-black text-xs shadow-sm flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>🔊 Listen Prompt</span>
          </button>
        </div>

        {/* Prompt Content */}
        <div className="py-4 text-center space-y-3">
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
            Teacher / System Says
          </p>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-relaxed">
              "{question.stimulus || question.question}"
            </h3>
          </div>
        </div>

        {/* Expected Oral Response & Microphone Area */}
        <div className="space-y-4 pt-2">
          {/* Microphone interaction for child */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-center space-y-3">
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              Child Speaks the Answer (No writing required)
            </p>

            <button
              onClick={isListening ? stopMic : startMic}
              className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {isListening ? 'Listening to child... Speak now!' : 'Click microphone to record oral speech'}
            </span>

            {spokenTranscript && (
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 w-full text-center">
                <span className="text-xs text-zinc-400 font-semibold">Heard: </span>
                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                  "{spokenTranscript}"
                </span>
              </div>
            )}
          </div>

          {/* Teacher / Evaluator Marking Panel */}
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-500" />
                <span>Teacher / Evaluator Evaluation</span>
              </span>
              <span className="text-[11px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">
                Target: {question.expected_oral_response || question.correct_answer}
              </span>
            </div>

            {question.scoring_information && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                Guide: {question.scoring_information}
              </p>
            )}

            {/* Evaluation Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => handleEvaluation('correct')}
                className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                  status === 'correct'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Correct</span>
              </button>

              <button
                onClick={() => handleEvaluation('try_again')}
                className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                  status === 'try_again'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => handleEvaluation('skipped')}
                className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                  status === 'skipped'
                    ? 'bg-zinc-600 text-white shadow-md'
                    : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FastForward className="w-4 h-4" />
                <span>Skip</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {status && (
          <div className="pt-2 text-center animate-fadeIn">
            {status === 'correct' && (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Recorded: Correct oral response!
              </span>
            )}
            {status === 'try_again' && (
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                Encouraged: Child should listen again and retry.
              </span>
            )}
            {status === 'skipped' && (
              <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                Marked as skipped for later review.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
