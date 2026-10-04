import React, { useState, useEffect } from 'react';
import { Volume2, RotateCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { playReadAlongText, stopSpeechSynthesis } from '../services/speechService';

// Child-friendly emoji dictionary for common early-reader vocabulary
const EMOJI_DICTIONARY = {
  cat: '🐱', hat: '🎩', sun: '☀️', dog: '🐶', fish: '🐟', log: '🪵',
  frog: '🐸', bee: '🐝', tree: '🌳', moon: '🌙', spoon: '🥄', pig: '🐷',
  cake: '🎂', snake: '🐍', star: '⭐', car: '🚗', light: '💡', kite: '🪁',
  hen: '🐔', pen: '🖊️', boat: '⛵', goat: '🐐', ball: '⚽', apple: '🍎',
  banana: '🍌', elephant: '🐘', rabbit: '🐰', sunflower: '🌻', butterfly: '🦋',
  map: '🗺️', top: '🪀', red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡',
  book: '📖', ship: '🚢', chin: '🧑', sand: '🏖️', milk: '🥛', duck: '🦆',
  rain: '🌧️', cloud: '☁️', sunset: '🌇', window: '🪟', rainbow: '🌈'
};

function getOptionEmoji(text) {
  if (!text) return null;
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  return EMOJI_DICTIONARY[clean] || null;
}

export function DyslexiaMCQCard({
  question,
  voicePersona = 'kavi',
  voiceSpeed = 'normal',
  onAnswer,
  onNext
}) {
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'try_again' | null

  useEffect(() => {
    setSelectedOptionId(null);
    setFeedback(null);
  }, [question?.id]);

  if (!question) return null;

  const playPromptAudio = () => {
    stopSpeechSynthesis();
    const stim = question.stimulus ? question.stimulus.replace(/^Teacher says:\s*/i, '') : '';
    const fullAudio = stim ? `${stim}. ${question.question}` : question.question;

    playReadAlongText({
      text: fullAudio,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0
    });
  };

  const handleSelectOption = (opt) => {
    setSelectedOptionId(opt.id);
    const isCorrect = Boolean(opt.isCorrect);

    if (isCorrect) {
      setFeedback('correct');
      if (onAnswer) onAnswer(true, opt);
    } else {
      setFeedback('try_again');
      if (onAnswer) onAnswer(false, opt);
    }
  };

  const options = Array.isArray(question.options) ? question.options : [];
  const isPictureOrSmallWords = options.every(o => (o.text || '').length <= 12);
  const gridColsClass = options.length === 3
    ? 'grid-cols-1 sm:grid-cols-3'
    : isPictureOrSmallWords
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="px-3.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
            {question.grade === 'UKG' ? 'UKG (Ages 5–6)' : `Grade ${question.grade}`} • {question.domain}
          </span>

          <button
            onClick={playPromptAudio}
            className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-black text-xs shadow-sm flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            title="Listen to question"
            aria-label="Play question audio"
          >
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>🔊 Listen</span>
          </button>
        </div>

        {/* Stimulus & Question Area */}
        <div className="text-center space-y-4 py-2">
          {question.stimulus && (
            <div className="inline-block p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
              <p className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">
                Audio Stimulus
              </p>
              <p className="text-lg sm:text-xl font-bold text-indigo-950 dark:text-indigo-200">
                "{question.stimulus.replace(/^Teacher says:\s*/i, '')}"
              </p>
            </div>
          )}

          <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            {question.question}
          </h3>
        </div>

        {/* Option Choices */}
        <div className={`grid ${gridColsClass} gap-3 pt-2`}>
          {options.map(opt => {
            const isSelected = selectedOptionId === opt.id;
            const emoji = getOptionEmoji(opt.text);

            let btnStyle = 'bg-zinc-50 hover:bg-indigo-50 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100';

            if (isSelected) {
              if (opt.isCorrect) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-lg ring-4 ring-emerald-200 dark:ring-emerald-900';
              } else {
                btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-lg ring-4 ring-rose-200 dark:ring-rose-900';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-5 rounded-2xl border-2 font-bold text-lg transition-all transform hover:scale-102 active:scale-98 flex flex-col items-center justify-center gap-2 ${btnStyle}`}
              >
                {emoji && <span className="text-3xl">{emoji}</span>}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">
                    {opt.key || ''}
                  </span>
                  <span>{opt.text || opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn ${
              feedback === 'correct'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback === 'correct' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="font-bold text-sm">
                {feedback === 'correct' ? '✓ Correct! Excellent listening!' : 'Listen carefully and try again!'}
              </span>
            </div>

            {feedback === 'try_again' && (
              <button
                onClick={playPromptAudio}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold text-xs"
              >
                Hear Again
              </button>
            )}
          </div>
        )}

        {/* Bottom Audio Replay & Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700/60">
          <button
            onClick={playPromptAudio}
            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold text-xs flex items-center gap-1.5"
          >
            <RotateCw className="w-4 h-4" />
            <span>Replay Audio</span>
          </button>

          {onNext && (
            <button
              onClick={onNext}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Next Question</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
