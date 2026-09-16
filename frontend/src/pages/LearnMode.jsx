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
  Award,
  Heart,
  Palette,
  Shapes,
  Hash,
  Smile,
  Truck,
  Apple as FruitIcon,
  Sun
} from 'lucide-react';

// 7 Interactive Learn Modules for UKG to Grade 3
const LEARN_CATEGORIES = [
  {
    id: 'colours_shapes',
    title: 'Colours & Shapes',
    icon: Palette,
    color: 'bg-rose-500 text-white',
    cards: [
      { id: 'c1', title: 'Red', sub: 'Bright as an Apple', emoji: '🔴', sound: 'Red, bright like a juicy red apple', clue: 'Look around! Is anyone wearing red?' },
      { id: 'c2', title: 'Blue', sub: 'Deep as the Ocean & Sky', emoji: '🔵', sound: 'Blue, like the calm clear sky and ocean', clue: 'Blue is everywhere in the sky.' },
      { id: 'c3', title: 'Yellow', sub: 'Warm as the Sunshine', emoji: '🟡', sound: 'Yellow, bright like the morning sun and sweet mango', clue: 'Yellow brings warm happy smiles.' },
      { id: 'c4', title: 'Green', sub: 'Fresh as Nature & Leaves', emoji: '🟢', sound: 'Green, like the fresh grass and leafy trees', clue: 'Green is the color of nature.' },
      { id: 'c5', title: 'Circle', sub: 'Round with Zero Corners', emoji: '⭕', sound: 'Circle, perfectly round with no sharp corners like a coin or clock', clue: 'Rolls smoothly like a ball!' },
      { id: 'c6', title: 'Triangle', sub: '3 Corners & 3 Sides', emoji: '🔺', sound: 'Triangle, having three straight sides and three sharp corners', clue: 'Looks like a slice of yummy pizza!' }
    ]
  },
  {
    id: 'alphabets_phonics',
    title: 'Alphabets & Phonics',
    icon: Sparkles,
    color: 'bg-indigo-600 text-white',
    cards: [
      { id: 'a1', title: 'Letter b', sub: 'buh (as in bat)', emoji: '🏏', sound: 'Letter b. Sound is buh. Bat and Ball. Stick on left, round belly on right!', clue: 'Stick on left 👉 Belly on right' },
      { id: 'a2', title: 'Letter d', sub: 'duh (as in dog)', emoji: '🐶', sound: 'Letter d. Sound is duh. Dog and Drum. Round tummy first, tall stick on right!', clue: '👈 Tummy on left | Stick on right' },
      { id: 'a3', title: 'Letter p', sub: 'puh (as in pencil)', emoji: '✏️', sound: 'Letter p. Sound is puh. Puppy and Pencil. Stick hangs down, head on the right!', clue: 'Stick goes down 👇 Head on right 👉' },
      { id: 'a4', title: 'Letter q', sub: 'kwuh (as in queen)', emoji: '👑', sound: 'Letter q. Sound is kwuh. Queen and Quick. Round head first, stick goes down with a tail!', clue: 'Head on left 👈 Tail hangs down 👇' },
      { id: 'a5', title: 'Letter m', sub: 'mmm (as in mango)', emoji: '🥭', sound: 'Letter m. Sound is mmm. Monkey and Mango. Two peaks pointing up to the sky!', clue: 'Peaks pointing UP ⬆️' },
      { id: 'a6', title: 'Letter w', sub: 'wuh (as in water)', emoji: '🌊', sound: 'Letter w. Sound is wuh. Water and Waves. Waves splashing down in the sea!', clue: 'Valleys splashing DOWN ⬇️' }
    ]
  },
  {
    id: 'numbers_counting',
    title: 'Numbers & Counting',
    icon: Hash,
    color: 'bg-emerald-600 text-white',
    cards: [
      { id: 'n1', title: 'Number 1', sub: 'Single Unit (1 Dot)', emoji: '1️⃣', sound: 'Number one. Just one single shining sun.', clue: '🔴 (1 dot)' },
      { id: 'n2', title: 'Number 2', sub: 'A Pair (2 Dots)', emoji: '2️⃣', sound: 'Number two. Two friendly eyes to see the world.', clue: '🔴 🔴 (2 dots)' },
      { id: 'n3', title: 'Number 3', sub: 'Trio (3 Dots)', emoji: '3️⃣', sound: 'Number three. Three corners of a bright triangle.', clue: '🔴 🔴 🔴 (3 dots)' },
      { id: 'n4', title: 'Number 5', sub: 'Handful (5 Dots)', emoji: '5️⃣', sound: 'Number five. Five fingers on your wave-hello hand!', clue: '🖐️ (5 fingers)' },
      { id: 'n5', title: 'Number 10', sub: 'Ten Friendly Units', emoji: '🔟', sound: 'Number ten. Ten bright toes dancing on the grass!', clue: '10 = 5 + 5' },
      { id: 'n6', title: 'Number 20', sub: 'Two Full Tens', emoji: '2️⃣0️⃣', sound: 'Number twenty. Two complete sets of ten!', clue: '20 = 10 + 10' }
    ]
  },
  {
    id: 'everyday_objects',
    title: 'Everyday Objects',
    icon: Sun,
    color: 'bg-amber-600 text-white',
    cards: [
      { id: 'o1', title: 'School Bag', sub: 'Carries Books & Pencils', emoji: '🎒', sound: 'School bag. Carries our notebooks, colors, and pencils to school every day.', clue: 'Keeps our learning tools safe!' },
      { id: 'o2', title: 'Toothbrush', sub: 'Keeps Teeth Sparkly', emoji: '🪥', sound: 'Toothbrush and paste. We brush twice daily for bright sparkly teeth.', clue: 'Morning and night habit!' },
      { id: 'o3', title: 'Clock', sub: 'Tells Us the Time', emoji: '⏰', sound: 'Clock. Ticks steadily to tell us the hour for study, play, and sleep.', clue: 'Tick-tock, tick-tock!' },
      { id: 'o4', title: 'Umbrella', sub: 'Shield from Rain & Sun', emoji: '☂️', sound: 'Umbrella. Opens wide to protect us from rain showers.', clue: 'Opens wide when raindrops fall!' }
    ]
  },
  {
    id: 'good_habits',
    title: 'Good Habits & Safety',
    icon: Smile,
    color: 'bg-purple-600 text-white',
    cards: [
      { id: 'h1', title: 'Washing Hands', sub: 'Soap & Clean Water', emoji: '🧼', sound: 'Washing hands with soap and water before meals keeps germs away.', clue: 'Scrub for 20 happy seconds!' },
      { id: 'h2', title: 'Sharing Toys', sub: 'Kindness with Friends', emoji: '🤝', sound: 'Sharing toys and books makes playtime joyful for everyone.', clue: 'Sharing is caring!' },
      { id: 'h3', title: 'Zebra Crossing', sub: 'Safe Road Walking', emoji: '🚶‍♂️', sound: 'Always hold an elder hand and cross the road at the zebra crossing.', clue: 'Look left, right, and left again!' },
      { id: 'h4', title: 'Watering Plants', sub: 'Love for Green Earth', emoji: '🪴', sound: 'Watering little plants every morning helps them grow big and green.', clue: 'Plants give us fresh clean air!' }
    ]
  },
  {
    id: 'animals_nature',
    title: 'Animals & Fruits',
    icon: FruitIcon,
    color: 'bg-teal-600 text-white',
    cards: [
      { id: 'f1', title: 'Mango', sub: 'King of Fruits', emoji: '🥭', sound: 'Mango, the sweet king of fruits in summer time.', clue: 'Sweet and golden yellow!' },
      { id: 'f2', title: 'Peacock', sub: 'Dancing Feather Bird', emoji: '🦚', sound: 'Peacock, with majestic iridescent feathers dancing in monsoon rain.', clue: 'National bird with beautiful feathers!' },
      { id: 'f3', title: 'Elephant', sub: 'Gentle Friendly Giant', emoji: '🐘', sound: 'Elephant, a gentle giant with big ears and a long helpful trunk.', clue: 'Trumps with a long trunk!' },
      { id: 'f4', title: 'Apple', sub: 'Crisp & Delicious', emoji: '🍎', sound: 'Apple, crisp and sweet. An apple a day keeps the doctor away!', clue: 'Red, sweet, and crunchy!' }
    ]
  }
];

const READ_ALONG_PASSAGES = {
  'UKG': "Look at the big red ball. The puppy runs and jumps. The sun is warm and bright.",
  '1': "The friendly brown puppy loves to play in the sun. He saw a blue bird on a branch. The bird sang a sweet song.",
  '2': "Sam and Ben built a bright wooden boat. They painted blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine.",
  '3': "Deep inside the quiet green forest, a quick fox found a basket of fresh red apples near a stream. She jumped over the mossy stones with joy.",
  'default': "Look at the big red ball. The puppy runs and jumps. The sun is warm and bright."
};

export function LearnMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const { voicePersona, setVoicePersona, voiceSpeed, setVoiceSpeed, speechRate } = useAccessibility();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('colours_shapes');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState(new Set([0]));
  const [startTime] = useState(Date.now());

  // Read-Along State
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'readalong'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeCharIndex, setActiveCharIndex] = useState(null);
  const [readAlongCompleted, setReadAlongCompleted] = useState(false);

  const gradeKey = activeChild?.grade === 'K' ? 'UKG' : (activeChild?.grade || 'UKG');
  const passage = READ_ALONG_PASSAGES[gradeKey] || READ_ALONG_PASSAGES['default'];
  const words = passage.split(' ');

  const currentCategoryData = LEARN_CATEGORIES.find(c => c.id === activeCategory) || LEARN_CATEGORIES[0];
  const currentCard = currentCategoryData.cards[currentCardIndex] || currentCategoryData.cards[0];

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  const handleNextCard = () => {
    setIsFlipped(false);
    const nextIdx = (currentCardIndex + 1) % currentCategoryData.cards.length;
    setCurrentCardIndex(nextIdx);
    setViewedCards(prev => new Set(prev).add(nextIdx));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    const prevIdx = (currentCardIndex - 1 + currentCategoryData.cards.length) % currentCategoryData.cards.length;
    setCurrentCardIndex(prevIdx);
  };

  const speakAudio = (text) => {
    stopSpeechSynthesis();
    playReadAlongText({
      text,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0
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
        persona: voicePersona,
        rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0,
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Top Banner: Learn Mode (Practice Badge) */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-300 rounded-2xl shadow-inner">
            <BookOpen className="w-7 h-7 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight uppercase">Learn Practice Window</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-100 text-[10px] font-bold">
                0 Score Recorded
              </span>
            </div>
            <p className="text-xs text-amber-950/90 font-medium mt-0.5">
              Exploring with <strong>{activeChild.name}</strong> • Standard: <strong>{activeChild.grade === 'K' ? 'UKG' : `Grade ${activeChild.grade}`}</strong>
            </p>
          </div>
        </div>

        {/* Voice Persona (Kavi / Kavita) & Speed Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-amber-950/10 p-2 rounded-2xl backdrop-blur-sm border border-amber-950/15">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setVoicePersona('kavi'); speakAudio('Hello, I am Kavi!'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                voicePersona === 'kavi'
                  ? 'bg-amber-950 text-amber-100 shadow'
                  : 'bg-white/80 hover:bg-white text-amber-950'
              }`}
            >
              👦 Kavi (Male)
            </button>
            <button
              onClick={() => { setVoicePersona('kavita'); speakAudio('Hello, I am Kavita!'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                voicePersona === 'kavita'
                  ? 'bg-amber-950 text-amber-100 shadow'
                  : 'bg-white/80 hover:bg-white text-amber-950'
              }`}
            >
              👧 Kavita (Female)
            </button>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-amber-950/20">
            {['slow', 'normal', 'fast'].map(speed => (
              <button
                key={speed}
                onClick={() => setVoiceSpeed(speed)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  voiceSpeed === speed
                    ? 'bg-amber-950 text-white'
                    : 'bg-white/60 text-amber-950'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tabs: Interactive Flashcards vs Read-Along */}
      <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1.5 border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-zinc-700 text-indigo-950 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Interactive Visual Flashcards (6 Modules)</span>
        </button>
        <button
          onClick={() => setActiveTab('readalong')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'readalong'
              ? 'bg-white dark:bg-zinc-700 text-indigo-950 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <span>Synchronized Indian English Read-Along</span>
        </button>
      </div>

      {/* VIEW 1: Interactive Flashcards Across 6 Modules */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {/* Module Selector Pill Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {LEARN_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md scale-105'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.title}</span>
                </button>
              );
            })}
          </div>

          {/* Flashcard Card Display */}
          <div className="max-w-lg mx-auto">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`cursor-pointer min-h-[340px] rounded-3xl p-8 border-4 text-center flex flex-col items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform perspective-1000 ${
                isFlipped
                  ? 'bg-amber-50 dark:bg-zinc-800 border-amber-400 text-zinc-900 dark:text-zinc-100'
                  : 'bg-white dark:bg-zinc-800 border-indigo-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-indigo-400'
              }`}
            >
              {!isFlipped ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-8xl select-none transform hover:scale-110 transition-transform">
                    {currentCard.emoji}
                  </div>
                  <div className="text-3xl font-black text-indigo-950 dark:text-indigo-200 font-lexend">
                    {currentCard.title}
                  </div>
                  <div className="text-xs font-semibold text-zinc-500">
                    {currentCard.sub}
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-center gap-1 pt-2">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Tap card to see clue & hear pronunciation</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-6xl">{currentCard.emoji}</div>
                  <div className="text-2xl font-black text-amber-600 font-lexend">
                    {currentCard.title}
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-2xl text-xs font-bold text-amber-950 dark:text-amber-200">
                    💡 Clue: {currentCard.clue}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakAudio(currentCard.sound);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 text-xs font-bold flex items-center gap-1.5 mx-auto shadow"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Hear with {voicePersona === 'kavi' ? 'Kavi' : 'Kavita'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Flashcard Nav Controls */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={handlePrevCard}
                className="p-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => speakAudio(currentCard.sound)}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Volume2 className="w-4 h-4" />
                <span>Play Sound ({voicePersona === 'kavi' ? 'Kavi' : 'Kavita'})</span>
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

      {/* VIEW 2: Read-Along Passage with Kavi/Kavita TTS */}
      {activeTab === 'readalong' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {activeChild.grade === 'K' ? 'UKG' : `Grade ${activeChild.grade}`} Read-Along Passage
            </span>
            <h2 className="text-xl font-bold">Synchronized Word-by-Word Voice Guide</h2>
            <p className="text-xs text-zinc-500">
              Listen with <strong>{voicePersona === 'kavi' ? 'Kavi (Indian Male)' : 'Kavita (Indian Female)'}</strong> at your chosen speed.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-indigo-100 dark:border-zinc-700 shadow-xl space-y-6 text-center">
            <div className="text-lg sm:text-2xl leading-loose font-medium text-zinc-800 dark:text-zinc-100 select-none">
              {passage}
            </div>

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
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play with {voicePersona === 'kavi' ? 'Kavi' : 'Kavita'}</span>
                  </>
                )}
              </button>
            </div>

            {readAlongCompleted && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Great job listening to the story!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Finish Button */}
      <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Info className="w-4 h-4 text-zinc-400" />
          <span>Zero scores are recorded in Learn Mode. Take all the time you need!</span>
        </div>

        <button
          onClick={handleFinishPractice}
          className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span>Ready for Assessment? Take Picture Test</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

