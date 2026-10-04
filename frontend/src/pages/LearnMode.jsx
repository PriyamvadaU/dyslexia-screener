import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../services/api';
import { playReadAlongText, stopSpeechSynthesis } from '../services/speechService';
import { GradeBanner } from '../components/GradeBanner';
import { DyslexiaMCQCard } from '../components/DyslexiaMCQCard';
import { DyslexiaFlashcard } from '../components/DyslexiaFlashcard';
import { OralResponseCard } from '../components/OralResponseCard';
import { ListeningComprehensionCard } from '../components/ListeningComprehensionCard';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Volume2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  Award,
  Filter,
  Play,
  Square,
  HelpCircle,
  Headphones
} from 'lucide-react';

const READ_ALONG_PASSAGES = {
  'UKG': "Look at the big red ball. The puppy runs and jumps. The sun is warm and bright.",
  '1': "The friendly brown puppy loves to play in the sun. He saw a blue bird on a branch. The bird sang a sweet song.",
  '2': "Sam and Ben built a bright wooden boat. They painted blue stripes along the sides. The boat sailed smoothly across the calm lake under the warm sunshine.",
  '3': "Deep inside the quiet green forest, a quick fox found a basket of fresh red apples near a stream. She jumped over the mossy stones with joy.",
  'default': "Look at the big red ball. The puppy runs and jumps. The sun is warm and bright."
};

export function LearnMode({ onOpenChildModal }) {
  const { activeChild } = useChild();
  const { voicePersona, voiceSpeed } = useAccessibility();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Grade state (URL param > activeChild grade > default UKG)
  const initialGradeParam = searchParams.get('grade');
  const childGrade = activeChild?.grade === 'K' ? 'UKG' : (activeChild?.grade || 'UKG');
  const [selectedGrade, setSelectedGrade] = useState(initialGradeParam || childGrade);

  // Content & Questions State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' | 'flashcard' | 'readalong'
  const [stats, setStats] = useState({ attempted: 0, correct: 0 });

  // Read-Along Audio State
  const [isPlayingReadAlong, setIsPlayingReadAlong] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(null);

  // Synchronize grade changes
  useEffect(() => {
    if (initialGradeParam && initialGradeParam !== selectedGrade) {
      setSelectedGrade(initialGradeParam);
    }
  }, [initialGradeParam]);

  // Load questions for the selected grade with strict grade isolation
  useEffect(() => {
    async function fetchGradeQuestions() {
      try {
        setLoading(true);
        const res = await api.getQuestionBankQuestions({
          grade: selectedGrade,
          limit: 300
        });

        if (res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        } else {
          // If no questions in DB yet, trigger seed and refetch
          await api.seedQuestionBank();
          const retryRes = await api.getQuestionBankQuestions({
            grade: selectedGrade,
            limit: 300
          });
          setQuestions(retryRes.questions || []);
        }
      } catch (err) {
        console.error('[LearnMode] Failed to fetch questions:', err);
      } finally {
        setLoading(false);
        setCurrentIdx(0);
      }
    }

    fetchGradeQuestions();
  }, [selectedGrade]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  // Filter questions by domain
  const filteredQuestions = useMemo(() => {
    if (selectedDomain === 'ALL') return questions;
    return questions.filter(q => q.domain === selectedDomain);
  }, [questions, selectedDomain]);

  // List of available domains in the current grade
  const availableDomains = useMemo(() => {
    const set = new Set();
    questions.forEach(q => {
      if (q.domain) set.add(q.domain);
    });
    return Array.from(set);
  }, [questions]);

  const currentQuestion = filteredQuestions[currentIdx] || null;

  // Grade Change Handler
  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    setSelectedDomain('ALL');
    setCurrentIdx(0);
    setSearchParams({ grade: newGrade });
    stopSpeechSynthesis();
  };

  // Answer handler
  const handleAnswer = async (isCorrect, detail) => {
    setStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    if (isCorrect) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#38bdf8', '#fbbf24', '#34d399', '#818cf8']
        });
      } catch (e) {}
    }

    // Record progress to backend if child profile is active
    if (activeChild?.id && currentQuestion) {
      try {
        await api.recordQuestionProgress({
          childId: activeChild.id,
          questionId: currentQuestion.id,
          grade: currentQuestion.grade,
          domain: currentQuestion.domain,
          skill: currentQuestion.skill,
          questionType: currentQuestion.question_type,
          isCorrect,
          attemptType: viewMode === 'flashcard' ? 'flashcard' : (currentQuestion.question_type === 'Oral response' ? 'oral' : 'mcq'),
          oralFeedback: typeof detail === 'string' ? detail : null
        });
      } catch (err) {
        console.warn('[LearnMode] Could not save progress:', err);
      }
    }
  };

  const handleNext = () => {
    stopSpeechSynthesis();
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(0); // Loop back or complete
    }
  };

  const handlePrev = () => {
    stopSpeechSynthesis();
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  // Read-Along handler
  const passageText = READ_ALONG_PASSAGES[selectedGrade] || READ_ALONG_PASSAGES['default'];
  const handleToggleReadAlong = () => {
    if (isPlayingReadAlong) {
      stopSpeechSynthesis();
      setIsPlayingReadAlong(false);
      setActiveWordIndex(null);
    } else {
      setIsPlayingReadAlong(true);
      playReadAlongText({
        text: passageText,
        persona: voicePersona,
        rate: voiceSpeed === 'slow' ? 0.85 : voiceSpeed === 'fast' ? 1.15 : 0.95,
        onBoundary: (event) => {
          if (event.name === 'word') {
            const charIdx = event.charIndex;
            const wordsBefore = passageText.substring(0, charIdx).trim().split(/\s+/).length - 1;
            setActiveWordIndex(wordsBefore >= 0 ? wordsBefore : null);
          }
        },
        onEnd: () => {
          setIsPlayingReadAlong(false);
          setActiveWordIndex(null);
        }
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Grade Banner */}
      <GradeBanner type={selectedGrade} />

      {/* Grade Selector Tabs (Strict Isolation) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Level:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'UKG', label: 'UKG (5–6)' },
              { id: '1', label: 'Grade 1 (6–7)' },
              { id: '2', label: 'Grade 2 (7–8)' },
              { id: '3', label: 'Grade 3 (8–9)' }
            ].map(g => (
              <button
                key={g.id}
                onClick={() => handleGradeChange(g.id)}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${
                  selectedGrade === g.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-700/60 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'standard'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Practice Screen
          </button>
          <button
            onClick={() => setViewMode('flashcard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'flashcard'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setViewMode('readalong')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'readalong'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Read-Along
          </button>
        </div>
      </div>

      {/* Domain / Skill Filters */}
      {viewMode !== 'readalong' && availableDomains.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-zinc-400 font-bold shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Domain:</span>
          </span>
          <button
            onClick={() => { setSelectedDomain('ALL'); setCurrentIdx(0); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedDomain === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            All Skills ({questions.length})
          </button>
          {availableDomains.map(dom => {
            const count = questions.filter(q => q.domain === dom).length;
            return (
              <button
                key={dom}
                onClick={() => { setSelectedDomain(dom); setCurrentIdx(0); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedDomain === dom
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {dom} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* READ-ALONG MODE */}
      {viewMode === 'readalong' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 shadow-xl p-6 sm:p-10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
              Grade {selectedGrade} • Synchronized Read-Along
            </span>
            <button
              onClick={handleToggleReadAlong}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                isPlayingReadAlong
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-indigo-950'
              }`}
            >
              {isPlayingReadAlong ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingReadAlong ? 'Stop Audio' : '🔊 Listen & Follow Words'}</span>
            </button>
          </div>

          <div className="p-8 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xl sm:text-2xl leading-loose font-medium text-zinc-800 dark:text-zinc-200">
            {passageText.split(/\s+/).map((word, i) => (
              <span
                key={i}
                className={`inline-block px-1.5 py-0.5 rounded-lg transition-colors ${
                  activeWordIndex === i
                    ? 'bg-amber-300 text-amber-950 font-black shadow-sm ring-2 ring-amber-400'
                    : ''
                }`}
              >
                {word}{' '}
              </span>
            ))}
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Children with dyslexia track words better when speech and visual highlighting are synchronized.
          </p>
        </div>
      )}

      {/* QUESTION INTERFACE (Standard or Flashcard) */}
      {viewMode !== 'readalong' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-zinc-500">Loading {selectedGrade} questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-8">
              <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">No questions found in this filter</h3>
              <p className="text-xs text-zinc-500">Switch domain or choose another grade level.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Navigation & Progress Bar */}
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex-1 max-w-xs space-y-1 text-center">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Question {currentIdx + 1} of {filteredQuestions.length}</span>
                    <span className="font-mono text-zinc-400">{currentQuestion?.id}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(((currentIdx + 1) / filteredQuestions.length) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* RENDER THE CORRECT INTERACTION COMPONENT */}
              {viewMode === 'flashcard' ? (
                <DyslexiaFlashcard
                  card={currentQuestion}
                  voicePersona={voicePersona}
                  voiceSpeed={voiceSpeed}
                  onAnswer={handleAnswer}
                />
              ) : currentQuestion?.question_type === 'Oral response' ? (
                <OralResponseCard
                  question={currentQuestion}
                  voicePersona={voicePersona}
                  voiceSpeed={voiceSpeed}
                  onScore={handleAnswer}
                  onNext={handleNext}
                />
              ) : currentQuestion?.question_type === 'Story + MCQ' ? (
                <ListeningComprehensionCard
                  question={currentQuestion}
                  voicePersona={voicePersona}
                  voiceSpeed={voiceSpeed}
                  onAnswer={handleAnswer}
                  onNext={handleNext}
                />
              ) : (
                <DyslexiaMCQCard
                  question={currentQuestion}
                  voicePersona={voicePersona}
                  voiceSpeed={voiceSpeed}
                  onAnswer={handleAnswer}
                  onNext={handleNext}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Practice Session Quick Summary */}
      {stats.attempted > 0 && (
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-around text-center text-xs">
          <div>
            <p className="text-zinc-400 font-semibold">Questions Practiced</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stats.attempted}</p>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
          <div>
            <p className="text-zinc-400 font-semibold">Correct Responses</p>
            <p className="text-xl font-black text-emerald-600">{stats.correct}</p>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
          <div>
            <p className="text-zinc-400 font-semibold">Success Rate</p>
            <p className="text-xl font-black text-indigo-600">
              {Math.round((stats.correct / stats.attempted) * 100)}%
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
