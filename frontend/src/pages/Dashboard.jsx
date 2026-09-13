import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { api } from '../services/api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Flame, 
  Calendar, 
  Layers, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  BookOpen, 
  ClipboardCheck,
  Sparkles
} from 'lucide-react';

export function Dashboard({ onOpenChildModal }) {
  const { activeChild, childrenList, selectChild } = useChild();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSummary() {
      if (!activeChild?.id) return;
      try {
        setLoading(true);
        setError('');
        const data = await api.getChildSummary(activeChild.id);
        setSummary(data);
      } catch (err) {
        console.error('[Dashboard] Error loading summary:', err);
        setError(err.message || 'Failed to load child dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [activeChild?.id]);

  if (!activeChild) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-950/60 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-indigo-700 dark:text-indigo-300">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No Child Profile Selected</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Create or choose a child profile to view longitudinal performance data and screening trends.
        </p>
        <button
          onClick={onOpenChildModal}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
        >
          Add Child Profile
        </button>
      </div>
    );
  }

  const trendData = Array.isArray(summary?.trendData) ? summary.trendData : [];
  const mostConfused = Array.isArray(summary?.mostConfusedList) ? summary.mostConfusedList : [];
  const recentScores = Array.isArray(summary?.recentScores) ? summary.recentScores : [];
  const hasCompletedTests = Boolean(summary && summary.totalAssessments > 0 && summary.latestCategory && summary.latestCategory !== 'None');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {activeChild.name}'s Screening Dashboard
            </h1>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
              Grade {activeChild.grade}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Age {activeChild.age} • Longitudinal literacy screening, oral reading fluency, and letter reversal patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/learn"
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Practice (Learn Mode)</span>
          </Link>
          <Link
            to="/test"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Run New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <MedicalDisclaimer />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Assessments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tests</span>
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {summary?.totalAssessments || 0}
          </div>
          <div className="text-[11px] text-zinc-400">
            {summary?.totalPracticeSessions || 0} practice sessions logged
          </div>
        </div>

        {/* Current Risk Indicator */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Screening Status</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black">
            {hasCompletedTests ? (
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide inline-block ${
                summary.latestCategory === 'Low'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : summary.latestCategory === 'Moderate'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
              }`}>
                {summary.latestCategory} Risk
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full inline-block">
                Assessment Pending
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400">
            {hasCompletedTests && summary?.latestScore !== null && summary?.latestScore !== undefined
              ? `Score: ${summary.latestScore}/100`
              : 'Take first test to calculate score'}
          </div>
        </div>

        {/* Practice Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Days</span>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {summary?.streakDays || 0} <span className="text-xs font-normal text-zinc-500">days</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Consistent screening & practice
          </div>
        </div>

        {/* Parental Consent Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Consent Verified</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Parent Authorization Confirmed</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono truncate">
            ID: {activeChild.id}
          </div>
        </div>

      </div>

      {/* First-Time Assessment Guidance Banner (when no tests taken yet) */}
      {!hasCompletedTests && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-indigo-500/10 border-2 border-dashed border-indigo-300 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Ready to begin {activeChild.name}'s first assessment?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Start with a low-pressure practice session (0 score recorded), then run the short 3-minute screening test.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/learn"
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-white text-xs font-bold"
            >
              Start Practice
            </Link>
            <Link
              to="/test"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
            >
              Take Assessment
            </Link>
          </div>
        </div>
      )}

      {/* Trend Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Risk Index Progression Over Time */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Composite Risk Index Trend
              </h3>
              <p className="text-[11px] text-zinc-400">Lower score indicates reduced screening risk</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>

          {trendData.length > 0 ? (
            <div className="h-64 w-full min-w-0" style={{ minHeight: '240px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                    formatter={(val) => [`${val} / 100`, 'Risk Index']}
                  />
                  <ReferenceLine y={35} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Low Risk', position: 'insideBottomRight', fontSize: 10, fill: '#10B981' }} />
                  <ReferenceLine y={65} stroke="#F43F5E" strokeDasharray="3 3" label={{ value: 'High Risk', position: 'insideTopRight', fontSize: 10, fill: '#F43F5E' }} />
                  <Area type="monotone" dataKey="compositeScore" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#riskGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-400 text-xs p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <Clock className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-600" />
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">No Assessment History Yet</span>
              <span className="text-[11px] text-zinc-400 mt-1">Complete your first test session to generate longitudinal risk charts.</span>
            </div>
          )}
        </div>

        {/* Chart 2: Reading Fluency (WPM) vs Grade Benchmark */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Oral Reading Fluency (WPM) Progression
              </h3>
              <p className="text-[11px] text-zinc-400">Words per minute vs expected grade level benchmark</p>
            </div>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>

          {trendData.length > 0 ? (
            <div className="h-64 w-full min-w-0" style={{ minHeight: '240px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="wpm" name="Child WPM" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="targetWpm" name="Grade Target" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center text-zinc-400 text-xs p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <Award className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-600" />
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Fluency Progress Pending</span>
              <span className="text-[11px] text-zinc-400 mt-1">Oral reading assessments will track words-per-minute vs grade target.</span>
            </div>
          )}
        </div>

      </div>

      {/* Most Confused Letter Reversals Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Most-Confused Letter Pairs (Cumulative Across All Sessions)
            </h3>
          </div>
          <span className="text-xs text-zinc-400">High diagnostic value for targeted practice</span>
        </div>

        {mostConfused.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {mostConfused.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-mono font-black text-rose-950 dark:text-rose-200">
                    "{item.expected}" confused with "{item.actual}"
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Mirror / spatial reversal error
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-xs">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl text-center text-xs text-zinc-500">
            No letter reversals recorded yet. As your child takes quizzes, any persistent mirror confusions (e.g. b/d or p/q) will be flagged here.
          </div>
        )}
      </div>

      {/* Historical Session List Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Assessment & Screening History
          </h3>
          <span className="text-xs text-zinc-400">
            {recentScores.length} recorded session(s)
          </span>
        </div>

        {recentScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Risk Category</th>
                  <th className="pb-3 font-semibold">Score Index</th>
                  <th className="pb-3 font-semibold">Reading Fluency</th>
                  <th className="pb-3 font-semibold">Reversal Errors</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60 font-medium">
                {recentScores.map((score) => (
                  <tr key={score.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                    <td className="py-3.5 text-zinc-900 dark:text-zinc-100">
                      {new Date(score.timestamp).toLocaleDateString()} at {new Date(score.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        score.category === 'Low'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : score.category === 'Moderate'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      }`}>
                        {score.category} Risk
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold">
                      {score.compositeScore} / 100
                    </td>
                    <td className="py-3.5">
                      {score.metrics?.calculatedWpm || 0} WPM
                    </td>
                    <td className="py-3.5 font-mono">
                      {score.metrics?.reversalErrors || 0} ({score.metrics?.reversalErrorRatePct || 0}%)
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/results/${score.id}`}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>View Full Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
            <ClipboardCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              No completed assessments recorded for {activeChild.name} yet.
            </div>
            <Link
              to="/test"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              <span>Start First Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
