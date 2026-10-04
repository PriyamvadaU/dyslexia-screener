import React, { useState, useEffect, useRef } from 'react';
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
  Sun,
  Lightbulb,
  Check,
  Lock,
  ChevronRight,
  RefreshCw,
  Compass,
  Star,
  Flame,
  AlertCircle
} from 'lucide-react';

// 7 Interactive Learn Modules for UKG to Grade 3 (Flashcard Explorer)
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
  const { voicePersona, setVoicePersona, voiceSpeed, setVoiceSpeed } = useAccessibility();
  const navigate = useNavigate();

  // Top tabs: 'roadmap' | 'flashcards' | 'readalong'
  const [activeTab, setActiveTab] = useState('roadmap');

  // Lesson Roadmap State
  const [roadmapData, setRoadmapData] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [roadmapError, setRoadmapError] = useState('');

  // Active Lesson State
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonQuestions, setLessonQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [lessonCompleteModal, setLessonCompleteModal] = useState(false);
  const [lessonCompleteStats, setLessonCompleteStats] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Flashcards View State
  const [activeCategory, setActiveCategory] = useState('colours_shapes');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Read-Along State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeCharIndex, setActiveCharIndex] = useState(null);
  const [readAlongCompleted, setReadAlongCompleted] = useState(false);

  const gradeKey = activeChild?.grade === 'K' ? 'UKG' : (activeChild?.grade || 'UKG');
  const passage = READ_ALONG_PASSAGES[gradeKey] || READ_ALONG_PASSAGES['default'];

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  // Fetch Lessons Roadmap when child changes or tab returns to roadmap
  const loadRoadmap = async () => {
    if (!activeChild?.id) return;
    try {
      setLoadingRoadmap(true);
      setRoadmapError('');
      const data = await api.getLessons(activeChild.id);
      setRoadmapData(data);
    } catch (err) {
      console.error('Failed to load lessons roadmap:', err);
      setRoadmapError('Could not load learning lessons. Please try again.');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [activeChild?.id, activeTab]);

  const speakAudio = (text) => {
    stopSpeechSynthesis();
    playReadAlongText({
      text,
      persona: voicePersona,
      rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 1.0
    });
  };

  // Launch a Lesson
  const handleStartLesson = async (lessonId) => {
    if (!activeChild?.id) return;
    try {
      setLoadingLesson(true);
      stopSpeechSynthesis();
      const res = await api.getLesson(lessonId, activeChild.id);
      setActiveLesson(res.lesson);
      setLessonQuestions(res.questions || []);
      
      const saved = res.savedState;
      if (saved) {
        setUserAnswers(saved.answers || {});
        const resumeIdx = Math.min((res.questions || []).length - 1, saved.currentQuestionIdx || 0);
        setQIdx(resumeIdx);
      } else {
        setUserAnswers({});
        setQIdx(0);
      }
      setShowHint(false);
      setLessonCompleteModal(false);

      // Play prompt audio if available
      if (res.questions && res.questions[0]) {
        const firstQ = res.questions[0];
        if (firstQ.audioText) {
          speakAudio(firstQ.audioText);
        }
      }
    } catch (err) {
      console.error('Failed to load lesson:', err);
      alert(err.message || 'Failed to open lesson.');
    } finally {
      setLoadingLesson(false);
    }
  };

  // Autoplay audio on question change inside active lesson
  useEffect(() => {
    if (activeLesson && lessonQuestions.length > 0 && qIdx < lessonQuestions.length) {
      const q = lessonQuestions[qIdx];
      if (q && q.audioText) {
        speakAudio(q.audioText);
      }
      setShowHint(false);
    }
  }, [qIdx, activeLesson]);

  // Answer Option Click (Inside Lesson)
  const handleSelectAnswer = (option) => {
    if (!activeLesson || !lessonQuestions[qIdx]) return;
    const currentQ = lessonQuestions[qIdx];
    const isCorrect = option.id === currentQ.correctOptionId;

    const nextAnswers = {
      ...userAnswers,
      [currentQ.id]: {
        selected: option.id,
        selectedLabel: option.label,
        isCorrect,
        answeredAt: new Date().toISOString()
      }
    };
    setUserAnswers(nextAnswers);

    // Save progress idempotently to server
    api.saveLessonProgress({
      childId: activeChild.id,
      lessonId: activeLesson.id,
      currentQuestionIdx: qIdx,
      answers: nextAnswers,
      completed: false
    }).catch(err => console.warn('Failed to save step progress:', err));
  };

  // Next Question Navigation
  const handleNextQuestion = () => {
    if (qIdx + 1 < lessonQuestions.length) {
      const nextIdx = qIdx + 1;
      setQIdx(nextIdx);
      api.saveLessonProgress({
        childId: activeChild.id,
        lessonId: activeLesson.id,
        currentQuestionIdx: nextIdx,
        answers: userAnswers,
        completed: false
      }).catch(err => console.warn('Progress save warning:', err));
    } else {
      // Completed last question of lesson!
      handleCompleteLesson();
    }
  };

  // Previous Question Navigation
  const handlePrevQuestion = () => {
    if (qIdx > 0) {
      const prevIdx = qIdx - 1;
      setQIdx(prevIdx);
      // State is preserved in userAnswers without re-evaluating or duplicate logging
    }
  };

  // Complete Lesson
  const handleCompleteLesson = async () => {
    const totalCount = lessonQuestions.length;
    const correctCount = Object.values(userAnswers).filter(a => a?.isCorrect).length;
    const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    try {
      await api.saveLessonProgress({
        childId: activeChild.id,
        lessonId: activeLesson.id,
        currentQuestionIdx: qIdx,
        answers: userAnswers,
        completed: true
      });
      // Also record zero-score learnSession audit entry
      api.saveLearnSession(activeChild.id, {
        durationSec: 60,
        cardsViewed: totalCount,
        readAlongCompleted: false
      }).catch(() => {});
    } catch (err) {
      console.warn('Lesson completion save error:', err);
    }

    setLessonCompleteStats({
      title: activeLesson.title,
      totalCount,
      correctCount,
      scorePct
    });
    setLessonCompleteModal(true);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  // Close Lesson and return to Roadmap
  const handleCloseLesson = () => {
    stopSpeechSynthesis();
    setActiveLesson(null);
    setLessonQuestions([]);
    setLessonCompleteModal(false);
    loadRoadmap();
  };

  // Flashcards Handlers
  const currentCategoryData = LEARN_CATEGORIES.find(c => c.id === activeCategory) || LEARN_CATEGORIES[0];
  const currentCard = currentCategoryData.cards[currentCardIndex] || currentCategoryData.cards[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    const nextIdx = (currentCardIndex + 1) % currentCategoryData.cards.length;
    setCurrentCardIndex(nextIdx);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    const prevIdx = (currentCardIndex - 1 + currentCategoryData.cards.length) % currentCategoryData.cards.length;
    setCurrentCardIndex(prevIdx);
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

  if (!activeChild) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-700">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Please Select or Create a Child Profile</h2>
        <p className="text-xs text-zinc-500">
          A child profile and verified parental consent are required before beginning learning lessons.
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

  // ==========================================
  // VIEW A: ACTIVE LESSON PLAYER
  // ==========================================
  if (activeLesson && lessonQuestions.length > 0) {
    const currentQ = lessonQuestions[qIdx];
    const currentAnswer = userAnswers[currentQ?.id];
    const isAnswered = Boolean(currentAnswer);

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* Lesson Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <button
            onClick={handleCloseLesson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lessons</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              {activeLesson.domain}
            </span>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {activeLesson.title}
            </h3>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            Question {qIdx + 1} of {lessonQuestions.length}
          </div>
        </div>

        {/* Question Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round(((qIdx + 1) / lessonQuestions.length) * 100)}%` }}
          />
        </div>

        {/* Active Question Card */}
        {currentQ && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-indigo-100 dark:border-zinc-700 shadow-xl space-y-6 animate-in fade-in">
            
            {/* Audio Stimulus / Prompt */}
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {currentQ.skill}
              </span>
              
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 font-lexend leading-snug">
                {currentQ.promptText || currentQ.question}
              </h2>

              {currentQ.audioText && (
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    onClick={() => speakAudio(currentQ.audioText)}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md inline-flex items-center gap-2 transition-transform transform active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Play Sound ({voicePersona === 'kavi' ? 'Kavi' : 'Kavita'})</span>
                  </button>
                  
                  {/* Optional Hint Button */}
                  {currentQ.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className={`px-4 py-2.5 rounded-2xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                        showHint 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>{showHint ? 'Hide Hint' : '💡 Hint'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Revealed Hint Box */}
              {showHint && currentQ.hint && (
                <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs font-medium animate-in fade-in">
                  💡 <strong>Helpful Hint:</strong> {currentQ.hint}
                </div>
              )}
            </div>

            {/* Answer Options Grid */}
            <div className={`grid gap-3 pt-2 max-w-xl mx-auto ${
              currentQ.options?.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
            }`}>
              {currentQ.options?.map((opt) => {
                const isSelected = currentAnswer?.selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAnswer(opt)}
                    className={`p-5 rounded-2xl border-2 shadow-sm transition-all duration-150 flex flex-col items-center justify-center gap-2 text-center transform active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500 text-indigo-950 dark:text-white font-black scale-105'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {opt.emoji && (
                      <span className="text-4xl select-none">{opt.emoji}</span>
                    )}
                    <span className="text-base font-bold font-lexend">{opt.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        Selected ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Gentle Answer Feedback (No harsh failure language) */}
            {isAnswered && (
              <div className="text-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
                {currentAnswer.isCorrect ? '🌟 Spot on! Excellent observation.' : "👍 Great effort! Let's keep exploring."}
              </div>
            )}

            {/* Predictable Navigation Controls: Previous & Next */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={handlePrevQuestion}
                disabled={qIdx === 0}
                className={`px-5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  qIdx === 0
                    ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-700 text-zinc-400'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-sm'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95"
              >
                <span>{qIdx + 1 === lessonQuestions.length ? 'Finish Lesson 🎉' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Lesson Completion Modal */}
        {lessonCompleteModal && lessonCompleteStats && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-3xl">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  Lesson Complete!
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  You finished <strong>{lessonCompleteStats.title}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ⭐ {lessonCompleteStats.correctCount} / {lessonCompleteStats.totalCount}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-semibold">
                    Questions Explored
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                Great job! You're making steady, wonderful progress in literacy.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleCloseLesson}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Continue Learning Roadmap →
                </button>
                <button
                  onClick={() => {
                    setLessonCompleteModal(false);
                    setQIdx(0);
                    setUserAnswers({});
                  }}
                  className="w-full py-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Practice This Lesson Again 🔄
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW B: LEARNING HOME / PROGRESS MAP
  // ==========================================
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
              <span className="font-black text-xl tracking-tight uppercase">My Learning Roadmap</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-100 text-[10px] font-bold">
                Zero Stress Practice
              </span>
            </div>
            <p className="text-xs text-amber-950/90 font-medium mt-0.5">
              Exploring with <strong>{activeChild.name}</strong> • <strong>{gradeKey === 'UKG' ? 'UKG (Age 5–6)' : `Grade ${gradeKey}`}</strong>
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

      {/* Main Mode Navigation Tabs */}
      <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1.5 border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'roadmap'
              ? 'bg-white dark:bg-zinc-700 text-indigo-950 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-600" />
          <span>Lesson Progression Map</span>
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'flashcards'
              ? 'bg-white dark:bg-zinc-700 text-indigo-950 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Visual Flashcard Explorer</span>
        </button>
        <button
          onClick={() => setActiveTab('readalong')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'readalong'
              ? 'bg-white dark:bg-zinc-700 text-indigo-950 dark:text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Volume2 className="w-4 h-4 text-emerald-500" />
          <span>Synchronized Read-Along</span>
        </button>
      </div>

      {/* TAB 1: LESSON PROGRESSION MAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          
          {loadingRoadmap ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-zinc-500">Loading your learning lessons...</p>
            </div>
          ) : roadmapData ? (
            <>
              {/* Overall Progress & Hero Continue Learning Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Overall Progress
                    </span>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {roadmapData.roadmap?.completedLessons || 0} of {roadmapData.roadmap?.totalLessons || 0} Lessons Completed
                    </h3>
                  </div>

                  {roadmapData.nextLesson && (
                    <button
                      onClick={() => handleStartLesson(roadmapData.nextLesson.id)}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:scale-105"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Continue: {roadmapData.nextLesson.shortTitle}</span>
                    </button>
                  )}
                </div>

                <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${roadmapData.roadmap?.overallProgressPct || 0}%` }}
                  />
                </div>
              </div>

              {/* Recommended Practice Card (Targeted weak-skill reinforcement) */}
              {roadmapData.recommendedLesson && (
                <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 rounded-2xl text-2xl">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                        Recommended Practice
                      </div>
                      <h4 className="text-base font-black text-amber-950 dark:text-amber-100">
                        {roadmapData.recommendedLesson.reason}
                      </h4>
                      <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                        Strengthen your skills with {roadmapData.recommendedLesson.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartLesson(roadmapData.recommendedLesson.id)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow transition-all flex-shrink-0"
                  >
                    Start Practice →
                  </button>
                </div>
              )}

              {/* Domains & Lessons Grid */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Literacy Skill Domains ({roadmapData.domains?.length || 0})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmapData.domains?.map((dom) => {
                    const completedCount = dom.lessons?.filter(l => l.completed).length || 0;
                    const totalLessons = dom.lessons?.length || 0;
                    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                    return (
                      <div
                        key={dom.id}
                        className="p-5 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl select-none">{dom.emoji}</span>
                            <div>
                              <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                                {dom.title}
                              </h4>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {dom.description}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {completedCount}/{totalLessons}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Lessons List Chips */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {dom.lessons?.map((les) => (
                            <button
                              key={les.id}
                              onClick={() => handleStartLesson(les.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                les.completed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-zinc-50 dark:bg-zinc-750 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {les.completed ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Play className="w-3 h-3 text-indigo-500 fill-current" />
                              )}
                              <span>{les.shortTitle}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs">
              No lessons available for this profile.
            </div>
          )}

        </div>
      )}

      {/* TAB 2: VISUAL FLASHCARD EXPLORER (Preserved existing feature) */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
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
                    <span>Tap card to flip clue & hear pronunciation</span>
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

      {/* TAB 3: READ-ALONG PASSAGE (Preserved existing feature) */}
      {activeTab === 'readalong' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {gradeKey === 'UKG' ? 'UKG' : `Grade ${gradeKey}`} Read-Along Passage
            </span>
            <h2 className="text-xl font-bold">Synchronized Word-by-Word Voice Guide</h2>
            <p className="text-xs text-zinc-500">
              Listen with <strong>{voicePersona === 'kavi' ? 'Kavi (Indian Male)' : 'Kavita (Indian Female)'}</strong> at your chosen speed.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-indigo-200 dark:border-zinc-700 shadow-xl space-y-6">
            <div className="text-2xl sm:text-3xl leading-relaxed text-center font-medium font-lexend select-none">
              {passage.split(' ').map((word, idx) => (
                <span
                  key={idx}
                  className={`inline-block mx-1.5 px-2 py-1 rounded-xl transition-colors duration-150 ${
                    isPlayingAudio ? 'hover:bg-amber-100' : ''
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleToggleReadAlong}
                className={`px-8 py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-3 transition-all transform hover:scale-105 ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    <span>Pause Reading Guide</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Voice Read-Along ({voicePersona === 'kavi' ? 'Kavi' : 'Kavita'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default LearnMode;
