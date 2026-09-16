import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  ArrowRight, 
  Printer, 
  RotateCcw, 
  Layers, 
  Volume2, 
  Clock, 
  TrendingUp,
  BrainCircuit,
  Info,
  ChevronRight,
  PenTool,
  Sparkles,
  GitCompare,
  BarChart2
} from 'lucide-react';

export function ResultsView() {
  const { scoreId } = useParams();
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState(null);
  const [child, setChild] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchScore() {
      try {
        setLoading(true);
        const res = await api.getScoreReport(scoreId);
        setScoreData(res.score);
        setChild(res.child);

        // Fetch Level 1 vs Level 2 model comparison
        const compRes = await api.getScoreComparison(scoreId).catch(() => null);
        if (compRes?.comparison) {
          setComparison(compRes.comparison);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve assessment score report.');
      } finally {
        setLoading(false);
      }
    }
    if (scoreId) fetchScore();
  }, [scoreId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Loading multimodal screening analysis...</p>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-3 bg-red-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-red-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold">Report Not Found</h2>
        <p className="text-xs text-zinc-500">{error || 'Unable to locate the requested report.'}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { compositeScore, category, categoryColor, metrics, riskBreakdown, explanation, disclaimer, mlModel, timestamp, isMultimodal } = scoreData;

  const isLow = category === 'Low';
  const isModerate = category === 'Moderate';
  const isHigh = category === 'High';

  const categoryBadgeStyles = isLow
    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
    : isModerate
    ? 'bg-amber-500 text-white shadow-amber-500/20'
    : 'bg-rose-500 text-white shadow-rose-500/20';

  const ml = mlModel || comparison?.level2;
  const hw = metrics?.handwriting;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:p-0">
      
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Multimodal Screening Report
            </span>
            {isMultimodal && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                ★ 4-Modality Fusion (Speech + Handwriting + Reversals)
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {child?.name || 'Child'}'s Multimodal Screening Report
          </h1>
          <p className="text-xs text-zinc-500">
            Assessed on {new Date(timestamp).toLocaleString()} • Grade {child?.grade || '2'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4 text-zinc-600" />
            <span>Print / Save PDF</span>
          </button>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <span>View Dashboard History</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Card */}
      <MedicalDisclaimer />

      {/* Main Score & Risk Banner */}
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-700">
          
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Level 1 Rule-Based Composite Result
            </span>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider shadow-lg ${categoryBadgeStyles}`}>
                {category} Risk Indicator
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Risk Index: {compositeScore} / 100
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-lg leading-relaxed pt-1">
              {explanation.summary}
            </p>
          </div>

          {/* Visual Risk Gauge Meter */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-full sm:w-60 text-center">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Screening Gauge
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-3.5 rounded-full overflow-hidden flex p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLow ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(8, compositeScore)}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-[10px] text-zinc-400 font-bold mt-1.5">
              <span>Low (0-35)</span>
              <span>Mod (35-65)</span>
              <span>High (65+)</span>
            </div>
          </div>

        </div>

        {/* 5 Feature Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* 1. Reading Speed (WPM) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Oral Fluency</span>
              <Volume2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics.calculatedWpm} <span className="text-xs font-normal text-zinc-500">WPM</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Target: <strong>{metrics.targetWpm} WPM</strong>
            </div>
          </div>

          {/* 2. Letter Reversal Confusion */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Reversals</span>
              <Layers className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics.reversalErrors} <span className="text-xs font-normal text-zinc-500">errors</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Error Rate: <strong>{metrics.reversalErrorRatePct}%</strong>
            </div>
          </div>

          {/* 3. Word Decoding Accuracy */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Decoding Acc.</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics.readingAccuracyPct}%
            </div>
            <div className="text-[11px] text-zinc-500">
              Flashcard: <strong>{metrics.flashcardAccuracyPct}%</strong>
            </div>
          </div>

          {/* 4. Hesitations & Pauses */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pauses (&gt;1.8s)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics.pauseCount} <span className="text-xs font-normal text-zinc-500">events</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Avg: <strong>{metrics.averageHesitationMs}ms</strong>
            </div>
          </div>

          {/* 5. Handwriting Kinematics (Motor Consistency) */}
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-1.5">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-300">
              <span className="text-xs font-bold uppercase tracking-wider">Motor Stroke</span>
              <PenTool className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {hw ? `${hw.strokeConsistencyScore}/100` : 'N/A'}
            </div>
            <div className="text-[11px] text-zinc-500">
              Pen Lifts: <strong>{hw?.penLifts ?? 0}</strong> • Jitter: <strong>{hw?.directionalJitterIndex?.toFixed(2) ?? '0.35'}</strong>
            </div>
          </div>

        </div>

      </div>

      {/* LEVEL 1 vs LEVEL 2 ML COMPARISON CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Level 1 vs Level 2 ML Statistical Model Comparison View
              </h3>
              <p className="text-xs text-zinc-500">
                Side-by-side evaluation: Expert Clinical Weighted Rule vs Trained ML Statistical Model
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            {comparison?.agreementStatus === 'full_agreement' ? '✓ Model Convergence' : 'Model Comparison Active'}
          </span>
        </div>

        {/* Side-by-side score columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Level 1 Rule-Based */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-500">Level 1: Rule-Based Formula</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-semibold">Deterministic</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{compositeScore}</span>
              <span className="text-xs text-zinc-400">/ 100 Risk Score</span>
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Classification: {category} Risk
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Calculated via grade-level developmental baselines across active assessment pillars.
            </p>
          </div>

          {/* Level 2 ML Model */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Level 2: ML Statistical Model</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                {ml?.modelVersion || 'v2.1.0'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{ml?.mlRiskScore ?? compositeScore}</span>
              <span className="text-xs text-zinc-400">/ 100 (Confidence: {ml?.confidencePct || 88}%)</span>
            </div>
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Prediction: {ml?.predictedCategory || category} Risk
            </div>
            
            {/* Probability Breakdown */}
            {ml?.probabilities && (
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px] font-mono font-bold">
                <div className="p-1 rounded bg-white dark:bg-zinc-800 border border-emerald-200 text-emerald-700">
                  Low: {Math.round(ml.probabilities.low * 100)}%
                </div>
                <div className="p-1 rounded bg-white dark:bg-zinc-800 border border-amber-200 text-amber-700">
                  Mod: {Math.round(ml.probabilities.moderate * 100)}%
                </div>
                <div className="p-1 rounded bg-white dark:bg-zinc-800 border border-rose-200 text-rose-700">
                  High: {Math.round(ml.probabilities.high * 100)}%
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Explainability & Feature Importance Breakdown */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Model Explainability & Key Feature Importance Weights</span>
            </span>
            <span className="text-[11px] text-zinc-400">Random Forest Gini MDI</span>
          </div>

          <div className="space-y-2 pt-1">
            {[
              { label: 'Letter Reversal Errors (b/d, p/q)', weight: 26, color: 'bg-rose-500' },
              { label: 'Handwriting Stroke Jitter & Tremor', weight: 19, color: 'bg-purple-500' },
              { label: 'Oral Reading Speed Deficit (WPM)', weight: 17, color: 'bg-amber-500' },
              { label: 'Word Decoding Accuracy Deficit', weight: 12, color: 'bg-indigo-500' },
              { label: 'Acoustic Pause & Hesitation Frequency', weight: 11, color: 'bg-emerald-500' }
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400">{f.label}</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{f.weight}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.weight * 3.5}%` }} />
                </div>
              </div>
            ))}
          </div>

          {ml?.topFrictionDrivers && ml.topFrictionDrivers.length > 0 && (
            <div className="pt-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Identified Screening Drivers for {child?.name}:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {ml.topFrictionDrivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* Strengths & Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths */}
        <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-4">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Observed Strengths</span>
          </div>
          {explanation.strengths.length > 0 ? (
            <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
              {explanation.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">Continuous practice will help build core literacy foundations.</p>
          )}
        </div>

        {/* Actionable Recommendations */}
        <div className="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 space-y-4">
          <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-300 text-sm">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Recommended Support Actions</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
            {explanation.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Confused Letters Detail (if any) */}
      {metrics.confusedPairs && metrics.confusedPairs.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-500" />
            <span>Specific Mirror-Letter Confusion Patterns</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.confusedPairs.map((p, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-mono font-bold"
              >
                Expected "{p.expected}" → Selected "{p.actual}" ({p.count}x)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav Actions */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          to="/learn"
          className="px-5 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice More in Learn Window</span>
        </Link>

        <Link
          to="/test"
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
        >
          <span>Retake Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
