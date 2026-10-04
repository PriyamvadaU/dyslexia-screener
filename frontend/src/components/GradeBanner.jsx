import React from 'react';
import { Volume2, BookOpen, Sparkles, Headphones, Award, Compass, MessageCircle, ArrowRight } from 'lucide-react';

export const GRADE_BANNER_DATA = {
  main: {
    title: 'Learn Through Listening & Sounds',
    subtitle: 'Listen, explore, and learn one step at a time.',
    cta: 'Start Learning',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    icon: Volume2
  },
  selection: {
    title: 'Choose Your Learning Level',
    subtitle: 'Practice skills designed for your age and level.',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    icon: Compass
  },
  UKG: {
    grade: 'UKG',
    ageRange: 'Ages 5–6',
    title: 'UKG • Ages 5–6',
    subtitle: 'Sounds, rhymes, letters & listening',
    cta: 'Start UKG',
    gradient: 'from-sky-500 to-blue-600',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    icon: Headphones
  },
  '1': {
    grade: '1',
    ageRange: 'Ages 6–7',
    title: 'Grade 1 • Ages 6–7',
    subtitle: 'Blend sounds, decode words & build fluency',
    cta: 'Start Grade 1',
    gradient: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    icon: Sparkles
  },
  '2': {
    grade: '2',
    ageRange: 'Ages 7–8',
    title: 'Grade 2 • Ages 7–8',
    subtitle: 'Explore word patterns, vocabulary & comprehension',
    cta: 'Start Grade 2',
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    icon: BookOpen
  },
  '3': {
    grade: '3',
    ageRange: 'Ages 8–9',
    title: 'Grade 3 • Ages 8–9',
    subtitle: 'Build fluency, vocabulary & deeper understanding',
    cta: 'Start Grade 3',
    gradient: 'from-violet-600 to-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    icon: Award
  }
};

export function GradeBanner({ type = 'main', onAction, currentGrade, onSelectGrade }) {
  if (type === 'main') {
    const data = GRADE_BANNER_DATA.main;
    const Icon = data.icon;
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
            <Icon className="w-4 h-4 text-yellow-200" />
            <span>Dyslexia-Friendly Non-Writing Literacy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {data.title}
          </h1>
          <p className="text-sm sm:text-base text-amber-50 font-normal leading-relaxed">
            {data.subtitle}
          </p>
          {onAction && (
            <div className="pt-2">
              <button
                onClick={onAction}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>{data.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'selection') {
    const data = GRADE_BANNER_DATA.selection;
    const Icon = data.icon;
    return (
      <div className="text-center max-w-3xl mx-auto space-y-3 py-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
          <Icon className="w-4 h-4" />
          <span>Non-Writing Question Bank</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
          {data.title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          {data.subtitle}
        </p>
      </div>
    );
  }

  // Grade Specific Banner (UKG, 1, 2, 3)
  const gData = GRADE_BANNER_DATA[type] || GRADE_BANNER_DATA['UKG'];
  const Icon = gData.icon;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${gData.gradient} text-white p-6 sm:p-8 shadow-lg`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
            <Icon className="w-3.5 h-3.5 text-yellow-200" />
            <span>{gData.ageRange}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {gData.title}
          </h2>
          <p className="text-sm text-white/90">
            {gData.subtitle}
          </p>
        </div>
        {onAction && (
          <button
            onClick={() => onAction(gData.grade)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>{gData.cta}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
