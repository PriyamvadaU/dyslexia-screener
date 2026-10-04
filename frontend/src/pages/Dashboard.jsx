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
  Sparkles,
  Filter,
  Volume2,
  Check,
  RotateCcw,
  GraduationCap
} from 'lucide-react';

export function Dashboard({ onOpenChildModal }) {
  const { activeChild, childrenList, selectChild } = useChild();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Skill-by-skill progress tracking state
  const [skillProgress, setSkillProgress] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Teacher / Parent Inspection Mode state
  const [teacherGrade, setTeacherGrade] = useState(activeChild?.grade || 'UKG');
  const [teacherDomain, setTeacherDomain] = useState('ALL');
  const [teacherSkill, setTeacherSkill] = useState('ALL');
  const [teacherType, setTeacherType] = useState('ALL');
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [loadingTeacherQuestions, setLoadingTeacherQuestions] = useState(false);

  // Active Tab: 'skills' | 'teacher_mode' | 'risk_trends'
  const [activeTab, setActiveTab] = useState('skills');

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

  // Load Skill-by-skill progress tracking
  useEffect(() => {
    async function loadSkillProgress() {
      if (!activeChild?.id) return;
      try {
        setLoadingSkills(true);
        const data = await api.getChildQuestionProgress(activeChild.id, activeChild.grade);
        setSkillProgress(data);
      } catch (err) {
        console.warn('[Dashboard] Could not load skill progress:', err);
      } finally {
        setLoadingSkills(false);
      }
    }
    loadSkillProgress();
  }, [activeChild?.id, activeChild?.grade]);

  // Load Teacher Filtered Questions
  useEffect(() => {
    async function loadTeacherQuestions() {
      try {
        setLoadingTeacherQuestions(true);
        const res = await api.getQuestionBankQuestions({
          grade: teacherGrade === 'K' ? 'UKG' : teacherGrade,
          domain: teacherDomain !== 'ALL' ? teacherDomain : undefined,
          skill: teacherSkill !== 'ALL' ? teacherSkill : undefined,
          question_type: teacherType !== 'ALL' ? teacherType : undefined,
          limit: 100
        });
        setTeacherQuestions(res.questions || []);
      } catch (err) {
        console.warn('[Dashboard] Failed to load teacher questions:', err);
      } finally {
        setLoadingTeacherQuestions(false);
      }
    }
    loadTeacherQuestions();
  }, [teacherGrade, teacherDomain, teacherSkill, teacherType]);

  const handleTeacherGradeChange = (g) => {
    setTeacherGrade(g);
    setTeacherDomain('ALL');
    setTeacherSkill('ALL');
  };

  const handleManualMark = async (question, isCorrect) => {
    if (!activeChild?.id) return;
    try {
      await api.recordQuestionProgress({
        childId: activeChild.id,
        questionId: question.id,
        grade: question.grade,
        domain: question.domain,
        skill: question.skill,
        questionType: question.question_type,
        isCorrect,
        attemptType: 'oral',
        oralFeedback: isCorrect ? 'correct' : 'try_again'
      });

      // Refresh progress
      const refreshed = await api.getChildQuestionProgress(activeChild.id, activeChild.grade);
      setSkillProgress(refreshed);
    } catch (e) {
      console.warn('Failed to record manual mark:', e);
    }
  };

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
              {activeChild.name}'s Literacy Dashboard
            </h1>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
              Grade {activeChild.grade}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Age {activeChild.age} • Non-Writing Literacy Practice & Longitudinal Screening Analytics
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
            <span>Run Assessment</span>
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
        
        {/* Questions Practiced */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Questions Answered</span>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {skillProgress?.totalAttempted || 0}
          </div>
          <div className="text-[11px] text-zinc-400">
            {skillProgress?.totalCorrect || 0} correct ({skillProgress?.overallAccuracy || 0}% accuracy)
          </div>
        </div>

        {/* Screening Risk Tier */}
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
              ? `Risk Score: ${summary.latestScore}/100`
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
            Consistent learning practice
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

      {/* Navigation Tabs for Dashboard Views */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'skills'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Skill-by-Skill Progress</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher_mode')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'teacher_mode'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Teacher / Parent Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('risk_trends')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'risk_trends'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Screening Trends & Heatmaps</span>
        </button>
      </div>

      {/* TAB 1: SKILL-BY-SKILL PROGRESS (Section 12) */}
      {activeTab === 'skills' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                Literacy Skill Mastery ({activeChild.grade === 'K' ? 'UKG' : `Grade ${activeChild.grade}`})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detailed progress broken down across auditory attention, phonics, decoding, and comprehension.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
              Overall: {skillProgress?.overallAccuracy || 0}% Accuracy
            </span>
          </div>

          {loadingSkills ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading skill telemetry...
            </div>
          ) : skillProgress?.domains && skillProgress.domains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillProgress.domains.map(dom => {
                const pct = dom.percentage || 0;
                return (
                  <div
                    key={dom.domain}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {dom.domain}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {pct}% ({dom.correct}/{dom.attempted} practiced)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{dom.totalAvailable} questions in syllabus</span>
                      <span>{dom.skills?.length || 0} sub-skills</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500">
              No skill practice recorded for this profile yet. Begin practice in Learn Mode to see real-time skill telemetry!
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEACHER / PARENT MODE (Section 16) */}
      {activeTab === 'teacher_mode' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Teacher / Parent Inspection & Grading Mode
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Filter by Grade, Domain, Skill, and Question Type. Review questions and manually evaluate oral responses.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            {/* Grade Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">GRADE</label>
              <select
                value={teacherGrade}
                onChange={(e) => handleTeacherGradeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
              >
                <option value="UKG">UKG (Ages 5–6)</option>
                <option value="1">Grade 1 (Ages 6–7)</option>
                <option value="2">Grade 2 (Ages 7–8)</option>
                <option value="3">Grade 3 (Ages 8–9)</option>
              </select>
            </div>

            {/* Domain Filter */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">DOMAIN</label>
              <select
                value={teacherDomain}
                onChange={(e) => setTeacherDomain(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
              >
                <option value="ALL">All Domains</option>
                <option value="Rhyming">Rhyming</option>
                <option value="Phonological Awareness">Phonological Awareness</option>
                <option value="Phonemic Awareness">Phonemic Awareness</option>
                <option value="Syllable Awareness">Syllable Awareness</option>
                <option value="Letter Recognition">Letter Recognition</option>
                <option value="Phonics">Phonics</option>
                <option value="Decoding">Decoding</option>
                <option value="Advanced Decoding">Advanced Decoding</option>
                <option value="Morphology">Morphology</option>
                <option value="Vocabulary">Vocabulary</option>
                <option value="Listening Comprehension">Listening Comprehension</option>
                <option value="Oral Response">Oral Response</option>
              </select>
            </div>

            {/* Question Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">QUESTION TYPE</label>
              <select
                value={teacherType}
                onChange={(e) => setTeacherType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
              >
                <option value="ALL">All Types</option>
                <option value="3-option MCQ">3-option MCQ</option>
                <option value="4-option MCQ">4-option MCQ</option>
                <option value="Story + MCQ">Story + MCQ</option>
                <option value="Oral response">Oral response</option>
              </select>
            </div>

            {/* Total Results Counter */}
            <div className="flex flex-col justify-end">
              <span className="text-[11px] text-zinc-400 font-bold mb-1">FILTERED TOTAL</span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black text-center">
                {teacherQuestions.length} Questions
              </div>
            </div>
          </div>

          {/* Questions Table */}
          {loadingTeacherQuestions ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Loading questions...
            </div>
          ) : teacherQuestions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-700 text-zinc-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Domain / Skill</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Stimulus / Question</th>
                    <th className="pb-3">Target / Expected Response</th>
                    <th className="pb-3 text-right">Teacher Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60 font-medium">
                  {teacherQuestions.slice(0, 30).map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {q.id}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{q.domain}</div>
                        <div className="text-[10px] text-zinc-400">{q.skill}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold">
                          {q.question_type}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs">
                        <div className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                          {q.question || q.stimulus}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-emerald-600">
                        {q.correct_text || q.expected_oral_response || q.correct_answer}
                      </td>
                      <td className="py-3 text-right">
                        {q.question_type === 'Oral response' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleManualMark(q, true)}
                              className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px]"
                              title="Mark oral response correct"
                            >
                              ✓ Correct
                            </button>
                            <button
                              onClick={() => handleManualMark(q, false)}
                              className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px]"
                              title="Mark retry needed"
                            >
                              ↺ Retry
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400">Automated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teacherQuestions.length > 30 && (
                <p className="text-center text-[11px] text-zinc-400 pt-3">
                  Showing first 30 of {teacherQuestions.length} matching questions. Use filters to narrow down.
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              No questions found for the selected filter combination.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCREENING TRENDS & HEATMAPS */}
      {activeTab === 'risk_trends' && (
        <div className="space-y-6">
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
                  Most-Confused Letter Pairs
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
                No letter reversals recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

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
