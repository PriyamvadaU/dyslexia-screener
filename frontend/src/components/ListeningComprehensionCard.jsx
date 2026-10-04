import React, { useState } from 'react';
import { Volume2, RotateCw, CheckCircle2, AlertCircle, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { playReadAlongText, stopSpeechSynthesis } from '../services/speechService';

export function ListeningComprehensionCard({
  question,
  voicePersona = 'kavi',
  voiceSpeed = 'normal',
  onAnswer,
  onNext
}) {
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'try_again' | null

  if (!question) return null;

  // Extract story text from stimulus if it has "Teacher reads: ..."
  let storyText = question.stimulus || '';
  if (storyText.includes('Teacher reads:')) {
    storyText = storyText.replace('Teacher reads:', '').replace(/[“”"]/g, '').trim();
  }

  const playStoryAudio = () => {
    stopSpeechSynthesis();
    setIsPlayingStory(true);
    playReadAlongText({
      text: storyText || question.stimulus,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 0.95
    });
  };

  const playQuestionAudio = () => {
    stopSpeechSynthesis();
    playReadAlongText({
      text: question.question,
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Story & Question Container */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Story Section */}
        <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Listen to the Short Story</span>
            </span>

            <button
              onClick={playStoryAudio}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Listen to Story</span>
            </button>
          </div>

          <p className="text-base sm:text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
            "{storyText}"
          </p>

          <div className="text-[11px] text-amber-800/70 dark:text-amber-300/70">
            Tip: You can press <strong>Listen to Story</strong> as many times as you like.
          </div>
        </div>

        {/* Question Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
              Question
            </span>

            <button
              onClick={playQuestionAudio}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read Question Aloud</span>
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            {question.question}
          </h3>

          {/* Option Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {question.options.map(opt => {
              const isSelected = selectedOptionId === opt.id;
              let btnStyle = 'bg-zinc-50 hover:bg-indigo-50 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-800 dark:text-zinc-100';

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
                  className={`p-4 rounded-2xl border-2 text-left font-bold text-base transition-all transform hover:scale-101 active:scale-99 flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-xs font-black">
                      {opt.key || opt.label?.charAt(0)}
                    </span>
                    <span>{opt.text || opt.label}</span>
                  </div>

                  {isSelected && opt.isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Immediate Feedback */}
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
                {feedback === 'correct' ? '✓ Correct! You understood the story perfectly!' : 'Give it another try! Replay the story if needed.'}
              </span>
            </div>

            {feedback === 'try_again' && (
              <button
                onClick={playStoryAudio}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold text-xs"
              >
                Replay Story
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
