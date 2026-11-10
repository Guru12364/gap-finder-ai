'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Loader2,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { AnalyticsData, SubjectPerformance } from '@/types';

interface OverallStats {
  total_quizzes: number;
  total_questions: number;
  overall_accuracy: number;
  improvement_rate: number;
}

interface AccuracyPoint {
  date: string;
  accuracy: number;
  label: string;
}

interface MasteryDistribution {
  name: string;
  value: number;
  color: string;
}

const MASTERY_COLORS: Record<string, string> = {
  strong: '#10b981',
  medium: '#f59e0b',
  weak: '#ef4444',
  not_assessed: '#64748b',
};

const MASTERY_LABELS: Record<string, string> = {
  strong: 'Strong',
  medium: 'Medium',
  weak: 'Weak',
  not_assessed: 'Not Assessed',
};

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#131a35]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color || '#818cf8' }}>
          {entry.name}: {typeof entry.value === 'number' ? `${entry.value.toFixed(1)}%` : entry.value}
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#131a35]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      <p className="text-sm text-indigo-400 font-semibold">
        Accuracy: {payload[0].value.toFixed(1)}%
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('Failed to load analytics');
        const json = await res.json();
        setAnalytics(json.data || json);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Extract data
  const overallStats: OverallStats = {
    total_quizzes: analytics?.total_quizzes ?? 0,
    total_questions: (analytics?.total_questions ?? analytics?.total_questions_attempted) ?? 0,
    overall_accuracy: analytics?.overall_accuracy ?? 0,
    improvement_rate: analytics?.improvement_rate ?? 0,
  };

  const accuracyOverTime: AccuracyPoint[] = (analytics?.accuracy_over_time || analytics?.performance_over_time || []).map((point: any) => ({
    date: point.date,
    accuracy: point.accuracy ?? 0,
    label: point.date ? new Date(point.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '',
  }));

  const subjectPerformances: SubjectPerformance[] = analytics?.subject_performance || analytics?.subjects || [];

  // Build mastery distribution
  const masteryDist: MasteryDistribution[] = (() => {
    const dist = analytics?.mastery_distribution || analytics?.topic_mastery_distribution;
    if (dist && typeof dist === 'object') {
      return Object.entries(dist).map(([key, value]) => ({
        name: MASTERY_LABELS[key] || key,
        value: value as number,
        color: MASTERY_COLORS[key] || '#64748b',
      }));
    }
    // Fallback: compute from subject performance
    const counts = { strong: 0, medium: 0, weak: 0, not_assessed: 0 };
    subjectPerformances.forEach((sp) => {
      const acc = sp.accuracy ?? 0;
      if (sp.total_questions === 0) counts.not_assessed++;
      else if (acc >= 80) counts.strong++;
      else if (acc >= 50) counts.medium++;
      else counts.weak++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: MASTERY_LABELS[key],
        value,
        color: MASTERY_COLORS[key],
      }));
  })();

  const hasData = overallStats.total_quizzes > 0;

  // Empty state
  if (!hasData) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Progress Analytics
          </h1>
          <p className="text-gray-400 mt-2">Track your learning progress and performance</p>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Analytics Yet</h2>
            <p className="text-gray-400 mb-6">
              Complete some quizzes to see your progress analytics here. Your accuracy, improvement trends, and subject mastery will all be tracked.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Target className="w-4 h-4" />
              <span>Take a quiz to get started</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Quizzes',
      value: overallStats.total_quizzes,
      icon: BookOpen,
      gradient: 'from-indigo-500 to-purple-500',
      shadowColor: 'shadow-indigo-500/20',
    },
    {
      label: 'Questions Attempted',
      value: overallStats.total_questions,
      icon: HelpCircle,
      gradient: 'from-purple-500 to-pink-500',
      shadowColor: 'shadow-purple-500/20',
    },
    {
      label: 'Overall Accuracy',
      value: `${overallStats.overall_accuracy.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-cyan-500 to-indigo-500',
      shadowColor: 'shadow-cyan-500/20',
    },
    {
      label: 'Improvement Rate',
      value: `${overallStats.improvement_rate >= 0 ? '+' : ''}${overallStats.improvement_rate.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: overallStats.improvement_rate >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-orange-500',
      shadowColor: overallStats.improvement_rate >= 0 ? 'shadow-emerald-500/20' : 'shadow-red-500/20',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          Progress Analytics
        </h1>
        <p className="text-gray-400 mt-2">Track your learning progress and performance across all subjects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shadow-lg ${stat.shadowColor}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Over Time */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Accuracy Over Time</h2>
          </div>
          {accuracyOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={accuracyOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#accuracyGradient)"
                  dot={{ fill: '#818cf8', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#818cf8', strokeWidth: 2, stroke: '#fff', r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 text-sm">
              Not enough data to show trend
            </div>
          )}
        </div>

        {/* Topic Mastery Distribution */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Topic Mastery</h2>
          </div>
          {masteryDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={masteryDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {masteryDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#131a35]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-white font-medium">{d.name}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{d.value} topics</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={({ payload }) => (
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {payload?.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-xs text-gray-400">
                            {entry.value} ({masteryDist[idx]?.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 text-sm">
              No mastery data available
            </div>
          )}
        </div>
      </div>

      {/* Subject Performance Bar Chart */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Subject Performance Comparison</h2>
        </div>
        {subjectPerformances.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, subjectPerformances.length * 48 + 40)}>
            <BarChart
              data={subjectPerformances.map((sp) => ({
                name: sp.subject_name || sp.name || 'Unknown',
                accuracy: sp.accuracy ?? 0,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar
                dataKey="accuracy"
                name="Accuracy"
                fill="url(#barGradient)"
                radius={[0, 6, 6, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
            No subject performance data
          </div>
        )}
      </div>

      {/* Subject Breakdown Table */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Subject Breakdown</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Quizzes
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Questions
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Correct
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Mastery
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {subjectPerformances.map((sp, idx) => {
                const accuracy = sp.accuracy ?? 0;
                const masteryLevel = accuracy >= 80 ? 'strong' : accuracy >= 50 ? 'medium' : 'weak';
                const masteryColor =
                  masteryLevel === 'strong'
                    ? 'text-emerald-400 bg-emerald-400/10'
                    : masteryLevel === 'medium'
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-red-400 bg-red-400/10';

                return (
                  <tr
                    key={sp.subject_id || idx}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-white">
                          {sp.subject_name || sp.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                      {sp.total_quizzes ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                      {sp.total_questions ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">
                      {sp.correct_answers ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-white">
                        {accuracy.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${masteryColor}`}
                      >
                        {masteryLevel === 'strong' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {masteryLevel === 'medium' && <Zap className="w-3 h-3 mr-1" />}
                        {masteryLevel === 'weak' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {MASTERY_LABELS[masteryLevel]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {subjectPerformances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No subject data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
