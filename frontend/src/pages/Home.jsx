import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChild } from '../context/ChildContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { 
  Sparkles, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Volume2, 
  PenTool, 
  CheckCircle, 
  HelpCircle 
} from 'lucide-react';

export function Home({ onOpenChildModal }) {
  const { isAuthenticated } = useAuth();
  const { activeChild, childrenList } = useChild();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white p-8 sm:p-12 shadow-2xl border border-indigo-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ethical, Non-Invasive Multimodal Screener for Children</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Early Literacy & Learning-Difficulty <span className="text-amber-300">Screening System</span>
          </h1>

          <p className="text-base sm:text-lg text-indigo-100/90 leading-relaxed max-w-2xl font-normal">
            A playful, zero-stress 2-step assessment for children: <strong className="text-white">Learn Mode</strong> for comfortable practice, followed by a <strong className="text-white">Test Mode</strong> measuring letter-reversal orientation and oral reading fluency in real-time.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              activeChild ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/learn"
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Start Practice (Learn Mode)</span>
                  </Link>
                  <Link
                    to="/test"
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                  >
                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                    <span>Run Test Assessment</span>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={onOpenChildModal}
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Child Profile & Provide Consent</span>
                </button>
              )
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/auth?tab=register"
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>Get Started (Parent / Educator)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/auth"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
                >
                  Sign In to Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Active Profile Status */}
          {isAuthenticated && (
            <div className="pt-2 text-xs text-indigo-200/90 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeChild ? (
                <span>
                  Active Profile: <strong>{activeChild.name}</strong> (Age {activeChild.age}, Grade {activeChild.grade})
                </span>
              ) : (
                <span>No child profile selected. Click above to add a student or child.</span>
              )}
            </div>
          )}
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
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-3 relative">
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

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 shadow-sm space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 font-black flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Learn Window</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Child explores flashcards (b/d, p/q) and synchronized read-along text. <strong>Zero scoring recorded</strong> — pure exposure.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 shadow-sm space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-indigo-200 text-indigo-900 font-black flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              <span>Test Window</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Timed flashcard recognition & browser speech read-aloud. Tracks WPM, pauses, and mirror-letter errors.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 shadow-sm space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 font-black flex items-center justify-center text-sm">
              4
            </div>
            <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Score & History</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Server computes Level 1 rule-based risk category (Low/Mod/High), longitudinal charts, and confusion heatmaps.
            </p>
          </div>
        </div>
      </div>

      {/* Multimodal Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base">Letter Reversal Drills</h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Targets mirror phoneme-grapheme pairs like <code>b/d</code>, <code>p/q</code>, <code>m/w</code>, and <code>n/u</code> to detect spatial orientation confusion early.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base">Web Speech Oral Reading</h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Zero-cost browser speech recognition extracts Words-Per-Minute, decoding accuracy, and pause hesitation patterns in real-time.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base">Phase 2 Extension Ready</h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Architected with ready schemas for HTML5 canvas handwriting stroke telemetry and Level 2 machine learning predictive modeling.
          </p>
        </div>
      </div>

    </div>
  );
}
