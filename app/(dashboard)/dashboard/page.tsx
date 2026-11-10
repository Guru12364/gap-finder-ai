'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ClipboardCheck,
  Target,
  AlertTriangle,
  ArrowRight,
  Upload,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  Brain,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/shared/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn, formatDate, formatPercentage } from '@/lib/utils';
import { Subject, Quiz, Topic, TopicStatus, UserProfile } from '@/types';

interface DashboardStats {
  subjectCount: number;
  quizCount: number;
  overallAccuracy: number;
  weakTopicsCount: number;
  strongTopicsCount: number;
  mediumTopicsCount: number;
  notAssessedCount: number;
  totalTopicsCount: number;
}

interface SubjectChartItem {
  name: string;
  accuracy: number;
  quizCount: number;
}

const TOPIC_COLORS = {
  strong: '#22c55e', // Emerald/green
  medium: '#f59e0b', // Amber/yellow
  weak: '#ef4444', // Red
  not_assessed: '#64748b', // Slate
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    subjectCount: 0,
    quizCount: 0,
    overallAccuracy: 0,
    weakTopicsCount: 0,
    strongTopicsCount: 0,
    mediumTopicsCount: 0,
    notAssessedCount: 0,
    totalTopicsCount: 0,
  });
  const [subjectChartData, setSubjectChartData] = useState<SubjectChartItem[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<
    (Quiz & { subject_name?: string })[]
  >([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Get current user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        let currentUserId = authUser?.id;

        if (authUser) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile({
              id: authUser.id,
              email: authUser.email || '',
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split('@')[0] ||
                'Student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          // Fallback guest profile for preview/demo
          setUserProfile({
            id: 'guest',
            email: 'demo@gapfinder.ai',
            full_name: 'Alex Rivera',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // 2. Fetch Subjects
        let subjectsQuery = supabase.from('subjects').select('*');
        if (currentUserId) {
          subjectsQuery = subjectsQuery.eq('user_id', currentUserId);
        }
        const { data: subjectsData, error: subjectsError } = await subjectsQuery;
        const subjects: Subject[] = subjectsData || [];
        setSubjectsList(subjects);

        // Map subject id to name for quick lookups
        const subjectNameMap = new Map<string, string>();
        subjects.forEach((s) => subjectNameMap.set(s.id, s.name));

        // 3. Fetch Quizzes
        let quizzesQuery = supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });
        if (currentUserId) {
          quizzesQuery = quizzesQuery.eq('user_id', currentUserId);
        }
        const { data: quizzesData } = await quizzesQuery;
        const quizzes: Quiz[] = quizzesData || [];

        // 4. Fetch Topics
        let topicsQuery = supabase.from('topics').select('*');
        if (currentUserId) {
          topicsQuery = topicsQuery.eq('user_id', currentUserId);
        }
        const { data: topicsData } = await topicsQuery;
        const topics: Topic[] = topicsData || [];

        // Calculate Topic status breakdown
        let weakCount = 0;
        let mediumCount = 0;
        let strongCount = 0;
        let notAssessedCount = 0;

        topics.forEach((t) => {
          if (t.status === 'weak') weakCount++;
          else if (t.status === 'medium') mediumCount++;
          else if (t.status === 'strong') strongCount++;
          else notAssessedCount++;
        });

        // Calculate Overall Accuracy
        const completedQuizzes = quizzes.filter(
          (q) => q.status === 'completed' || q.accuracy > 0
        );
        let totalAccuracySum = 0;
        completedQuizzes.forEach((q) => {
          totalAccuracySum += Number(q.accuracy || 0);
        });
        const calculatedOverallAccuracy =
          completedQuizzes.length > 0
            ? Math.round(totalAccuracySum / completedQuizzes.length)
            : 0;

        // Populate Stats
        setStats({
          subjectCount: subjects.length,
          quizCount: quizzes.length,
          overallAccuracy: calculatedOverallAccuracy,
          weakTopicsCount: weakCount,
          strongTopicsCount: strongCount,
          mediumTopicsCount: mediumCount,
          notAssessedCount: notAssessedCount,
          totalTopicsCount: topics.length,
        });

        // 5. Build Subject-Wise Chart Data
        const chartItems: SubjectChartItem[] = subjects.map((sub) => {
          const subQuizzes = quizzes.filter(
            (q) =>
              q.subject_id === sub.id &&
              (q.status === 'completed' || q.accuracy > 0)
          );
          const subAvgAccuracy =
            subQuizzes.length > 0
              ? Math.round(
                  subQuizzes.reduce((acc, q) => acc + (q.accuracy || 0), 0) /
                    subQuizzes.length
                )
              : 0;

          return {
            name: sub.name,
            accuracy: subAvgAccuracy,
            quizCount: subQuizzes.length,
          };
        });

        setSubjectChartData(chartItems);

        // 6. Recent 5 Quizzes with Subject Name
        const recentWithSubject = quizzes.slice(0, 5).map((q) => ({
          ...q,
          subject_name: subjectNameMap.get(q.subject_id) || 'General',
        }));
        setRecentQuizzes(recentWithSubject);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  // Topic Distribution Pie Data
  const topicDistributionData = [
    { name: 'Strong', value: stats.strongTopicsCount, color: TOPIC_COLORS.strong },
    { name: 'Medium', value: stats.mediumTopicsCount, color: TOPIC_COLORS.medium },
    { name: 'Weak', value: stats.weakTopicsCount, color: TOPIC_COLORS.weak },
    {
      name: 'Not Assessed',
      value: stats.notAssessedCount,
      color: TOPIC_COLORS.not_assessed,
    },
  ].filter((item) => item.value > 0);

  // Fallback pie data if no topics exist yet
  const displayPieData =
    topicDistributionData.length > 0
      ? topicDistributionData
      : [
          { name: 'No Topics Evaluated', value: 1, color: '#334155' },
        ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Welcome back,{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                  {userProfile?.full_name?.split(' ')[0] || 'Student'}
                </span>
                ! <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Here&apos;s your personalized learning progress and knowledge gap breakdown.
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-gray-200"
            >
              <Upload className="mr-1.5 h-4 w-4 text-cyan-400" />
              Upload Materials
            </Button>
          </Link>
          <Link href="/quiz">
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 font-medium"
            >
              <Sparkles className="mr-1.5 h-4 w-4 text-cyan-300" />
              Start Diagnostic Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Stats Grid (4 columns desktop, 2 mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Subjects"
              value={stats.subjectCount}
              icon={BookOpen}
              description={
                stats.subjectCount === 0
                  ? 'Upload documents to add'
                  : `${stats.totalTopicsCount} topics cataloged`
              }
              iconColor="text-indigo-400"
              iconBgColor="bg-indigo-500/10 border-indigo-500/20"
            />
            <StatsCard
              title="Quizzes Taken"
              value={stats.quizCount}
              icon={ClipboardCheck}
              description="Diagnostic attempts"
              iconColor="text-purple-400"
              iconBgColor="bg-purple-500/10 border-purple-500/20"
            />
            <StatsCard
              title="Overall Accuracy"
              value={stats.quizCount > 0 ? `${stats.overallAccuracy}%` : 'N/A'}
              icon={Target}
              description={
                stats.quizCount > 0
                  ? 'Across all quiz assessments'
                  : 'Take a quiz to calculate'
              }
              iconColor="text-cyan-400"
              iconBgColor="bg-cyan-500/10 border-cyan-500/20"
              trend={
                stats.quizCount > 0
                  ? { value: 8, isPositive: true, label: 'vs last week' }
                  : undefined
              }
            />
            <StatsCard
              title="Knowledge Gaps"
              value={stats.weakTopicsCount}
              icon={AlertTriangle}
              description="Topics flagged for review"
              iconColor="text-amber-400"
              iconBgColor="bg-amber-500/10 border-amber-500/20"
              badge={stats.weakTopicsCount > 0 ? 'Needs Focus' : undefined}
            />
          </>
        )}
      </div>

      {/* 3. Two-Column Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Subject Performance Bar Chart */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-white">
                Subject Performance
              </CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Average diagnostic accuracy by enrolled subject
              </CardDescription>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              Full Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : subjectChartData.length === 0 ? (
              /* Empty state for Subject Performance */
              <div className="h-[280px] flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Brain className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">No Subject Data Yet</h4>
                <p className="mt-1 text-xs text-gray-400 max-w-sm">
                  Upload course syllabi or lecture slides to automatically extract subjects and generate baseline diagnostics.
                </p>
                <Link href="/upload" className="mt-4">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload First Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff10' }}
                      tickFormatter={(val) =>
                        val.length > 14 ? `${val.slice(0, 14)}...` : val
                      }
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff10' }}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as SubjectChartItem;
                          return (
                            <div className="rounded-xl border border-white/10 bg-navy-900/95 p-3 shadow-xl backdrop-blur-xl text-xs">
                              <p className="font-semibold text-white mb-1">
                                {data.name}
                              </p>
                              <p className="text-cyan-400 font-bold">
                                Accuracy: {data.accuracy}%
                              </p>
                              <p className="text-gray-400 text-[11px] mt-0.5">
                                Quizzes Attempted: {data.quizCount}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="accuracy"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right (1 col): Topic Status Summary Donut */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">
              Topic Mastery Status
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Categorization based on diagnostic attempts
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 flex-1 flex flex-col justify-center">
            {loading ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : stats.totalTopicsCount === 0 ? (
              /* Empty state for Topics */
              <div className="h-[240px] flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center">
                <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-white">No Topics Categorized</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                  Take diagnostic quizzes to classify topics as strong, medium, or weak.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-[200px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayPieData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {displayPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="rounded-lg border border-white/10 bg-navy-900/95 px-3 py-1.5 shadow-xl backdrop-blur-md text-xs">
                                <span className="font-semibold text-white">
                                  {data.name}:{' '}
                                </span>
                                <span className="text-cyan-400 font-bold">
                                  {data.value} topics
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Total Pill */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">
                      {stats.totalTopicsCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                      Topics
                    </span>
                  </div>
                </div>

                {/* Legend Chips */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Strong: {stats.strongTopicsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate">Medium: {stats.mediumTopicsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate">Weak (Gaps): {stats.weakTopicsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-500 shrink-0" />
                    <span className="truncate">Unassessed: {stats.notAssessedCount}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Quizzes Table */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-white">
              Recent Quiz Attempts
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Review your latest diagnostic test scores and identify weaknesses
            </CardDescription>
          </div>
          <Link href="/quiz">
            <Button variant="outline" size="sm" className="text-xs">
              View All Quizzes
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recentQuizzes.length === 0 ? (
            /* Empty State for Quizzes */
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-white">No Quizzes Taken Yet</h4>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                Generate an adaptive diagnostic quiz from your materials to pinpoint conceptual blindspots.
              </p>
              <Link href="/quiz" className="mt-5">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Take Your First Quiz
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-400">
                    <th className="pb-3 font-semibold">Quiz Title</th>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Score</th>
                    <th className="pb-3 font-semibold">Accuracy</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentQuizzes.map((quiz) => {
                    const accuracy = Math.round(quiz.accuracy || 0);
                    const isPassing = accuracy >= 70;

                    return (
                      <tr
                        key={quiz.id}
                        onClick={() => router.push(`/quiz/${quiz.id}/results`)}
                        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 pr-4 font-medium text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                          <span className="group-hover:text-cyan-400 transition-colors truncate max-w-[200px]">
                            {quiz.title || 'Diagnostic Quiz'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-300">
                          {quiz.subject_name}
                        </td>
                        <td className="py-3.5 pr-4 text-gray-200 font-mono">
                          {quiz.correct_answers} / {quiz.total_questions}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
                              isPassing
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            )}
                          >
                            {accuracy}%
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-400">
                          {formatDate(quiz.created_at)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-medium capitalize',
                              quiz.status === 'completed'
                                ? 'text-gray-300'
                                : 'text-amber-400'
                            )}
                          >
                            {quiz.status === 'completed' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-400" />
                            )}
                            {quiz.status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-400 group-hover:text-cyan-400 font-medium">
                            Results
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
