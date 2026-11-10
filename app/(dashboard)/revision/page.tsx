'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  ListTodo,
} from 'lucide-react';
import { Subject, RevisionPlan, RevisionTask } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

function RevisionPlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject_id') || '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubject);
  const [plans, setPlans] = useState<Array<RevisionPlan & { tasks: RevisionTask[] }>>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Form config
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState('2');
  const [schedulePreference, setSchedulePreference] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('flexible');

  // Expanded days
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        setIsLoadingSubjects(true);
        const res = await fetch('/api/subjects');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load subjects');
        const list: Subject[] = json.data || json.subjects || [];
        setSubjects(list);
        if (list.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(list[0].id);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Could not load subjects');
      } finally {
        setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  // Fetch Revision Plans
  const fetchPlans = useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    try {
      setIsLoadingPlans(true);
      const res = await fetch(`/api/revision?subject_id=${encodeURIComponent(subjectId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch revision plans');
      const list = json.data || [];
      setPlans(list);

      // Auto expand day 1 & 2
      setExpandedDays({ 1: true, 2: true });
    } catch (err: any) {
      console.error('Error fetching plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchPlans(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchPlans]);

  // Handle Generate Revision Plan
  const handleGeneratePlan = async () => {
    if (!selectedSubjectId) {
      showToast('error', 'Please select a subject first.');
      return;
    }
    if (!examDate) {
      showToast('error', 'Please select an exam date.');
      return;
    }

    try {
      setIsGenerating(true);
      showToast('info', 'Analyzing knowledge gaps and synthesizing an adaptive revision schedule...');

      const res = await fetch('/api/revision/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          exam_date: examDate,
          daily_hours: parseFloat(dailyHours) || 2,
          preferred_schedule: schedulePreference,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate revision plan');

      showToast('success', 'Personalized revision plan created!');
      setShowConfigModal(false);
      await fetchPlans(selectedSubjectId);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to generate plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle task completed
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      // Optimistic update
      setPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          tasks: plan.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !currentCompleted } : t
          ),
        }))
      );

      const res = await fetch('/api/revision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          completed: !currentCompleted,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task state');
      }
    } catch (err: any) {
      showToast('error', 'Failed to update task completion');
      // Revert if error
      if (selectedSubjectId) fetchPlans(selectedSubjectId);
    }
  };

  const activePlan = plans[0] || null;

  // Group tasks by day_number
  const tasksByDay = useMemo(() => {
    if (!activePlan || !activePlan.tasks) return {};
    const groups: Record<number, RevisionTask[]> = {};
    activePlan.tasks.forEach((t) => {
      const day = t.day_number || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(t);
    });
    return groups;
  }, [activePlan]);

  const totalTasks = activePlan?.tasks?.length || 0;
  const completedTasks = activePlan?.tasks?.filter((t) => t.completed).length || 0;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const toggleDayExpand = (dayNumber: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={cn(
            'fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-fade-in transition-all',
            toast.type === 'success' && 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200',
            toast.type === 'error' && 'bg-red-950/80 border-red-500/30 text-red-200',
            toast.type === 'info' && 'bg-indigo-950/80 border-indigo-500/30 text-indigo-200'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white transition-colors ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Calendar className="h-7 w-7 text-indigo-400" />
            Personalized Revision Planner
          </h1>
          <p className="mt-1.5 text-sm md:text-base text-gray-400">
            AI-generated daily study schedules dynamically prioritized by diagnosed knowledge gaps.
          </p>
        </div>

        {/* Subject selector + New Plan CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            {isLoadingSubjects ? (
              <div className="h-10 bg-white/5 animate-pulse rounded-lg border border-white/5" />
            ) : (
              <Select
                value={selectedSubjectId}
                onValueChange={(val) => {
                  setSelectedSubjectId(val);
                  router.push(`/revision?subject_id=${val}`);
                }}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Choose subject..."
              />
            )}
          </div>

          <Button
            onClick={() => setShowConfigModal(true)}
            disabled={!selectedSubjectId}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-4 h-4 mr-2 text-cyan-300" />
            {activePlan ? 'Regenerate Plan' : 'Create Revision Plan'}
          </Button>
        </div>
      </div>

      {/* Active Plan Overview Card */}
      {activePlan && (
        <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                  Active Study Plan
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                  Target Exam: {formatDate(activePlan.exam_date)}
                </h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                  <span>{activePlan.total_days} Preparation Days</span>
                  <span>•</span>
                  <span>{activePlan.daily_hours} Study Hours / Day</span>
                </p>
              </div>

              {/* Progress metric */}
              <div className="flex items-center gap-4 self-end sm:self-auto bg-navy-900/60 p-4 rounded-xl border border-white/10">
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-white font-mono">{overallProgress}%</p>
                  <p className="text-[11px] text-gray-400">
                    {completedTasks} of {totalTasks} tasks done
                  </p>
                </div>
                <div className="w-20">
                  <Progress value={overallProgress} size="sm" />
                </div>
              </div>
            </div>

            {/* Micro banner alert */}
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] flex items-center gap-3 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Adaptive Sync:</strong> When you complete new diagnostic quizzes, your diagnosed gaps update automatically and recalculate high-priority tasks.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Days & Tasks Breakdown */}
      {isLoadingPlans ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : !activePlan ? (
        /* Empty State */
        <Card className="border border-dashed border-white/10 bg-white/[0.01]">
          <CardContent className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
              <ListTodo className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No active revision schedule</h3>
            <p className="text-sm text-gray-400 max-w-md mt-2 mb-6">
              Create an AI revision plan tailored to your available hours and upcoming exam date. High-risk knowledge gaps will be scheduled first.
            </p>
            <Button
              onClick={() => setShowConfigModal(true)}
              disabled={!selectedSubjectId}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2 text-cyan-300" />
              Create Revision Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Days List */
        <div className="space-y-4">
          {Object.entries(tasksByDay).map(([dayNumStr, tasks]) => {
            const dayNum = parseInt(dayNumStr, 10);
            const isExpanded = expandedDays[dayNum] !== false;
            const dayCompletedCount = tasks.filter((t) => t.completed).length;
            const allDayCompleted = dayCompletedCount === tasks.length;

            return (
              <div
                key={dayNum}
                className={cn(
                  'rounded-xl border backdrop-blur-xl overflow-hidden transition-all duration-200 shadow-lg',
                  allDayCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                    : 'border-white/[0.08] bg-white/[0.02]'
                )}
              >
                {/* Day Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleDayExpand(dayNum)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono',
                        allDayCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                      )}
                    >
                      D{dayNum}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-white">Day {dayNum} Revision Focus</h3>
                      <p className="text-xs text-gray-400">
                        {tasks.length} learning {tasks.length === 1 ? 'task' : 'tasks'} •{' '}
                        {tasks.reduce((sum, t) => sum + (t.duration_minutes || 0), 0)} mins total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-xs px-2.5 py-0.5 rounded-full font-medium border',
                        allDayCompleted
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-gray-300 bg-white/5 border-white/10'
                      )}
                    >
                      {dayCompletedCount}/{tasks.length} Done
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Day Tasks List */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-white/[0.04] space-y-3">
                    {tasks.map((task) => {
                      const isHigh = task.priority === 'high';
                      const isQuiz = task.task_type === 'practice_quiz';

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                            task.completed
                              ? 'border-emerald-500/20 bg-emerald-500/[0.03] opacity-75'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
                          )}
                        >
                          <div className="flex items-start gap-3.5 flex-1">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, task.completed)}
                              className="mt-0.5 text-gray-400 hover:text-white transition-colors"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500 hover:text-indigo-400" />
                              )}
                            </button>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={cn(
                                    'text-sm font-semibold',
                                    task.completed ? 'line-through text-gray-400' : 'text-white'
                                  )}
                                >
                                  {task.topic_name}
                                </h4>

                                <Badge
                                  className={cn(
                                    'text-[10px] px-2 py-0.2 capitalize border',
                                    isHigh
                                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                  )}
                                >
                                  {task.priority} Priority
                                </Badge>

                                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  {task.duration_minutes}m
                                </span>
                              </div>

                              {task.chapter && (
                                <p className="text-xs text-gray-400">{task.chapter}</p>
                              )}

                              {/* Learning objectives */}
                              {task.objectives && task.objectives.length > 0 && (
                                <ul className="text-xs text-gray-300 list-disc list-inside space-y-0.5 pt-1">
                                  {task.objectives.map((obj, oIdx) => (
                                    <li key={oIdx}>{obj}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Quick Quiz CTA if practice type */}
                          {isQuiz && (
                            <Link
                              href={`/quiz?subject_id=${activePlan.subject_id}`}
                              className="shrink-0"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                              >
                                <Play className="w-3 h-3 mr-1 fill-current" />
                                Practice Quiz
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 bg-[#131a35] border border-white/[0.08] rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Configure Revision Plan
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Exam Date */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium uppercase tracking-wider">Exam Date</label>
                <Input
                  type="date"
                  value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-navy-950/80 border-white/10 text-white"
                />
              </div>

              {/* Daily Hours */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium uppercase tracking-wider">
                  Available Daily Study Hours ({dailyHours} hrs)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Study Routine Preference */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium uppercase tracking-wider">
                  Preferred Daily Schedule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['morning', 'afternoon', 'evening', 'flexible'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setSchedulePreference(pref)}
                      className={cn(
                        'py-2 px-3 rounded-lg border text-center capitalize transition-all',
                        schedulePreference === pref
                          ? 'border-indigo-500 bg-indigo-500/20 text-white font-semibold'
                          : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                      )}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(false)}
                disabled={isGenerating}
                className="border-white/10 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGeneratePlan}
                isLoading={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Generate Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RevisionPlannerPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <RevisionPlannerContent />
    </React.Suspense>
  );
}
