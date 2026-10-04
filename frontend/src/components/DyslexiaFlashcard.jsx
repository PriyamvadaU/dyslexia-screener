import React, { useState } from 'react';
import { Volume2, RotateCw, CheckCircle2, AlertCircle, Sparkles, Eye } from 'lucide-react';
import { playReadAlongText, stopSpeechSynthesis } from '../services/speechService';

export function DyslexiaFlashcard({
  card,
  voicePersona = 'kavi',
  voiceSpeed = 'normal',
  onAnswer,
  showRevealButton = true
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'try_again' | null

  if (!card) return null;

  const playAudio = (textToPlay) => {
    stopSpeechSynthesis();
    const text = textToPlay || card.audio_script || card.stimulus || card.question;
    playReadAlongText({
      text,
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* 3D Flashcard Container */}
      <div className="perspective-1000 min-h-[320px] sm:min-h-[360px]">
        <div
          className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-3xl transition-transform duration-500 transform-style-3d border-2 shadow-xl p-6 sm:p-8 flex flex-col justify-between ${
            isFlipped
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border-indigo-300 dark:border-indigo-700'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          {/* Top Bar: Grade/Domain Badge & Audio Button */}
          <div className="flex items-center justify-between gap-3">
            <span className="px-3.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold tracking-wide">
              {card.grade ? `Grade ${card.grade}` : 'UKG'} • {card.skill || card.domain || 'Flashcard'}
            </span>

            <button
              onClick={() => playAudio()}
              className="p-3 rounded-2xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2 shadow-sm transition-all transform hover:scale-105 active:scale-95"
              title="Listen to audio"
              aria-label="Play audio"
            >
              <Volume2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-black">🔊 Listen</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="py-6 text-center space-y-4 my-auto">
            {/* Stimulus / Visual Emoji */}
            {card.stimulus && (
              <div className="inline-block px-5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 font-bold text-lg">
                {card.stimulus}
              </div>
            )}

            {/* Question Text */}
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
              {card.question}
            </h3>

            {/* Revealed Answer when Flipped */}
            {isFlipped && (
              <div className="pt-2 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-black text-lg">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Answer: {card.correct_text || card.correct_answer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Options / Action Choices */}
          {Array.isArray(card.options) && card.options.length > 0 && !isFlipped && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {card.options.map(opt => {
                const isSelected = selectedOptionId === opt.id;
                let btnStyle = 'bg-zinc-100 hover:bg-indigo-50 dark:bg-zinc-700 dark:hover:bg-zinc-600 border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100';

                if (isSelected) {
                  if (opt.isCorrect) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md';
                  } else {
                    btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-2xl border-2 font-bold text-base transition-all transform hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 ${btnStyle}`}
                  >
                    <span>{opt.text || opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Controls: Tap to Reveal / Replay */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-700/60 text-xs">
            <button
              onClick={() => playAudio()}
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Replay Audio</span>
            </button>

            {showRevealButton && (
              <button
                onClick={handleFlip}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Hide Answer' : 'Reveal Answer'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Immediate Non-Punitive Feedback Banner */}
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
              {feedback === 'correct' ? '✓ Correct! Great job listening!' : 'Listen again carefully and give it another try!'}
            </span>
          </div>

          {feedback === 'try_again' && (
            <button
              onClick={() => playAudio()}
              className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold text-xs"
            >
              Hear Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
