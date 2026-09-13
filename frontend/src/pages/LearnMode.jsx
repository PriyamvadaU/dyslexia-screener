import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';
import { playReadAlongText, stopSpeechSynthesis } from '../services/speechService';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Volume2, 
  RotateCw, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Square, 
  Eye, 
  Info,
  ShieldCheck,
  Award
} from 'lucide-react';

const FLASHCARD_DRILLS = [
  {
    letter: 'b',
    counterpart: 'd',
    sound: 'buh (as in bat)',
    example: 'Bat & Ball',
    mnemonic: 'Line first, then the round belly on the right!',
    visualHint: 'Stick on left | Belly on right 👉'
  },
  {
    letter: 'd',
    counterpart: 'b',
    sound: 'duh (as in dog)',
    example: 'Dog & Door',
    mnemonic: 'Round tummy first, then the tall back stick!',
    visualHint: '👈 Belly on left | Stick on right'
  },
  {
    letter: 'p',
    counterpart: 'q',
    sound: 'puh (as in puppy)',
    example: 'Puppy & Panda',
    mnemonic: 'Stick goes DOWN, head rests on the right!',
    visualHint: 'Tail hangs down 👇 | Loop on right 👉'
  },
  {
    letter: 'q',
    counterpart: 'p',
    sound: 'kwuh (as in queen)',
    example: 'Queen & Quick',
    mnemonic: 'Round head first, stick goes down with a tail!',
    visualHint: 'Loop on left 👈 | Tail hangs down 👇'
  },
  {
    letter: 'm',
    counterpart: 'w',
    sound: 'mmm (as in monkey)',
    example: 'Moon & Mountain',
    mnemonic: 'Two mountain peaks pointing UP to the sky ⛰️',
    visualHint: 'Peaks up ⬆️'
  },
  {
    letter: 'w',
    counterpart: 'm',
    sound: 'wuh (as in water)',
    example: 'Water & Waves',
    mnemonic: 'Waves splashing DOWN in the ocean 🌊',
    visualHint: 'Valleys down ⬇️'
  }
];

const READ_ALONG_PASSAGES = {
  'K': "Look at the big dog. The dog can run and jump. It has a red ball.",
  '1': "The little brown puppy loves to play in the sun. He saw a blue bird on a branch. The bird sang a sweet song.",
  '2': "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine.",
  '3': "Deep in the green forest, a clever fox spotted a basket of red apples under a tall oak tree. She bounded quietly over the mossy stones to investigate.",
  'default': "Sam and Ben built a tall wooden boat. They painted bright blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine."
};

export function LearnMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const { speechRate } = useAccessibility();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'readalong'
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState(new Set([0]));
  const [startTime] = useState(Date.now());

  // Read-Along State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeCharIndex, setActiveCharIndex] = useState(null);
  const [readAlongCompleted, setReadAlongCompleted] = useState(false);

  const gradeKey = activeChild?.grade || '2';
  const passage = READ_ALONG_PASSAGES[gradeKey] || READ_ALONG_PASSAGES['default'];
  const words = passage.split(' ');

  // Calculate approximate word boundaries for character highlighting
  const wordRanges = [];
  let curChar = 0;
  words.forEach(w => {
    wordRanges.push({ word: w, start: curChar, end: curChar + w.length });
    curChar += w.length + 1; // +1 space
  });

  const currentWordIndex = wordRanges.findIndex(
    r => activeCharIndex !== null && activeCharIndex >= r.start && activeCharIndex <= r.end
  );

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  const handleNextCard = () => {
    setIsFlipped(false);
    const nextIdx = (currentCardIndex + 1) % FLASHCARD_DRILLS.length;
    setCurrentCardIndex(nextIdx);
    setViewedCards(prev => new Set(prev).add(nextIdx));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    const prevIdx = (currentCardIndex - 1 + FLASHCARD_DRILLS.length) % FLASHCARD_DRILLS.length;
    setCurrentCardIndex(prevIdx);
  };

  const speakPhoneme = (text) => {
    stopSpeechSynthesis();
    playReadAlongText({
      text,
      rate: 0.85
    });
  };

  const handleToggleReadAlong = () => {
    if (isPlayingAudio) {
      stopSpeechSynthesis();
      setIsPlayingAudio(false);
      setActiveCharIndex(null);
    } else {
      setIsPlayingAudio(true);
      playReadAlongText({
        text: passage,
        rate: speechRate,
        onWordBoundary: (charIdx) => {
          setActiveCharIndex(charIdx);
        },
        onEnd: () => {
          setIsPlayingAudio(false);
          setActiveCharIndex(null);
          setReadAlongCompleted(true);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        },
        onError: () => {
          setIsPlayingAudio(false);
          setActiveCharIndex(null);
        }
      });
    }
  };

  const handleFinishPractice = async () => {
    if (activeChild) {
      const durationSec = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      try {
        await api.saveLearnSession(activeChild.id, {
          durationSec,
          cardsViewed: viewedCards.size,
          readAlongCompleted
        });
      } catch (e) {
        console.warn('Failed to record learn session:', e);
      }
    }

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    navigate('/test');
  };

  if (!activeChild) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-700">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Please Select or Create a Child Profile</h2>
        <p className="text-xs text-zinc-500">
          A child profile and verified parental consent are required before beginning practice.
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

  const currentCard = FLASHCARD_DRILLS[currentCardIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Banner: Learn Mode (Practice Badge) */}
      <div className="rounded-2xl bg-amber-500 text-amber-950 p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight uppercase">Practice Window</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-100 text-[10px] font-bold">
                Zero Score Recorded
              </span>
            </div>
            <p className="text-xs text-amber-900 font-medium">
              Practicing with <strong>{activeChild.name}</strong> • Pure learning and playful exposure before testing
            </p>
          </div>
        </div>

        <button
          onClick={handleFinishPractice}
          className="px-4 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-100 text-xs font-bold shadow transition-all flex items-center gap-1.5"
        >
          <span>Done Practicing? Take Test</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs: Flashcards Drill vs Read-Along */}
      <div className="flex rounded-2xl bg-white dark:bg-zinc-800 p-1.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'flashcards'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Letter Orientation Drills (b/d, p/q)</span>
        </button>

        <button
          onClick={() => setActiveTab('readalong')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'readalong'
              ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Volume2 className="w-4 h-4 text-indigo-600" />
          <span>Synchronized Read-Along Passage</span>
        </button>
      </div>

      {/* Tab 1: Flashcard Drills */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Card {currentCardIndex + 1} of {FLASHCARD_DRILLS.length}
            </span>
            <h2 className="text-xl font-bold">Explore Letter Orientations & Phonics</h2>
            <p className="text-xs text-zinc-500">Tap the card to reveal the sound guide and orientation clue!</p>
          </div>

          {/* Interactive Flashcard */}
          <div className="max-w-md mx-auto">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`cursor-pointer transition-all duration-300 transform perspective-1000 min-h-[300px] rounded-3xl p-8 border-4 text-center flex flex-col items-center justify-center shadow-xl hover:shadow-2xl ${
                isFlipped
                  ? 'bg-amber-50 dark:bg-zinc-800 border-amber-400 text-zinc-900 dark:text-zinc-100'
                  : 'bg-white dark:bg-zinc-800 border-indigo-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-indigo-400'
              }`}
            >
              {!isFlipped ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-8xl font-black text-indigo-900 dark:text-indigo-200 select-none tracking-normal font-lexend">
                    {currentCard.letter}
                  </div>
                  <div className="text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Tap card to see sound & helper</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-5xl font-black text-amber-600 font-lexend">
                    {currentCard.letter}
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200">
                    Phonics Sound: {currentCard.sound}
                  </div>
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Example: <strong>{currentCard.example}</strong>
                  </div>
                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg text-xs text-zinc-600 dark:text-zinc-300">
                    💡 <em>{currentCard.mnemonic}</em>
                  </div>
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                    {currentCard.visualHint}
                  </div>
                </div>
              )}
            </div>

            {/* Card Controls */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={handlePrevCard}
                className="p-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => speakPhoneme(`The letter ${currentCard.letter}. Sound is ${currentCard.sound}. Example: ${currentCard.example}`)}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear Pronunciation</span>
              </button>

              <button
                onClick={handleNextCard}
                className="p-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Read-Along Passage with TTS synchronization */}
      {activeTab === 'readalong' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Grade {gradeKey} Practice Passage
            </span>
            <h2 className="text-xl font-bold">Synchronized Word-by-Word Read-Along</h2>
            <p className="text-xs text-zinc-500">
              Press play to listen. Each word lights up in yellow as it is read aloud.
            </p>
          </div>

          {/* Reading Display Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-indigo-100 dark:border-zinc-700 shadow-xl space-y-6 text-center">
            
            <div className="text-lg sm:text-2xl leading-loose font-medium text-zinc-800 dark:text-zinc-100 select-none">
              {words.map((word, idx) => {
                const isActive = idx === currentWordIndex;
                const isPassed = currentWordIndex !== -1 && idx < currentWordIndex;
                return (
                  <span
                    key={idx}
                    className={`inline-block mx-1.5 my-1 transition-all duration-150 ${
                      isActive
                        ? 'word-highlight-active'
                        : isPassed
                        ? 'word-highlight-passed'
                        : ''
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Play / Pause Controls */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleToggleReadAlong}
                className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Read-Along</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Read-Along Audio</span>
                  </>
                )}
              </button>
            </div>

            {readAlongCompleted && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Great job! You finished listening to the practice passage.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Info className="w-4 h-4 text-zinc-400" />
          <span>Remember: None of your answers in Learn Mode affect your child's score.</span>
        </div>

        <button
          onClick={handleFinishPractice}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span>Now Let's Test What You Learned!</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
