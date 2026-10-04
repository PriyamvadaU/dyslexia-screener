import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChild } from '../context/ChildContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { GradeBanner, GRADE_BANNER_DATA } from '../components/GradeBanner';
import { 
  Sparkles, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Volume2, 
  Headphones, 
  Award 
} from 'lucide-react';

export function Home({ onOpenChildModal }) {
  const { isAuthenticated } = useAuth();
  const { activeChild } = useChild();
  const navigate = useNavigate();

  const handleStartGrade = (grade) => {
    navigate(`/learn?grade=${grade}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* 1. Main Learning Banner */}
      <GradeBanner
        type="main"
        onAction={() => navigate('/learn')}
      />

      {/* Hero Quick Navigation and Consent Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Screening Profile
            </span>
          </div>
          {isAuthenticated && activeChild ? (
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Learner: <strong>{activeChild.name}</strong> • Age {activeChild.age} • Grade {activeChild.grade}
            </p>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isAuthenticated ? 'No child profile selected. Choose or add a child profile.' : 'Sign in to record progress and personalized learning profiles.'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            activeChild ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/learn"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Practice (Learn Mode)</span>
                </Link>
                <Link
                  to="/test"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Run Screener</span>
                </Link>
              </div>
            ) : (
              <button
                onClick={onOpenChildModal}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Child Profile</span>
              </button>
            )
          ) : (
            <Link
              to="/auth"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Sign In / Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. Grade Selection Banner & 4 Dedicated Grade Cards */}
      <div className="space-y-6">
        <GradeBanner type="selection" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* UKG Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-sky-200 dark:border-sky-900/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                  Ages 5–6
                </span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  UKG
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sounds, rhymes, letters & listening. Non-writing phoneme & rhyming recognition.
              </p>
            </div>
            <button
              onClick={() => handleStartGrade('UKG')}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start UKG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grade 1 Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Ages 6–7
                </span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  Grade 1
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Blend sounds, decode words & build fluency. Digraphs, blends, and oral response.
              </p>
            </div>
            <button
              onClick={() => handleStartGrade('1')}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Grade 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grade 2 Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-amber-200 dark:border-amber-900/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Ages 7–8
                </span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  Grade 2
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Explore word patterns, vocabulary & comprehension. Affixes, vowel teams, and syllables.
              </p>
            </div>
            <button
              onClick={() => handleStartGrade('2')}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Grade 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grade 3 Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border-2 border-purple-200 dark:border-purple-900/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Ages 8–9
                </span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  Grade 3
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Build fluency, vocabulary & deeper understanding. Multisyllabic decoding and passage analysis.
              </p>
            </div>
            <button
              onClick={() => handleStartGrade('3')}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Grade 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* The 4-Step Screening Flow */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            How LexiScreen Works
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Designed to isolate phonological decoding delays and mirror-letter confusion without stress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Parental Consent</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Parent or teacher creates an account and confirms non-medical screening consent and privacy rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 font-black flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Learn Window</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Child explores 690 non-writing literacy questions across 4 grade levels with audio assistance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-900 font-black flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              <span>Test Window</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Assessment measuring sound discrimination, oral reading fluency, and letter orientation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 font-black flex items-center justify-center text-sm">
              4
            </div>
            <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Skill Progress</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Detailed tracking per domain: Phonological Awareness, Rhyming, Decoding, Morphology, and Vocabulary.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
