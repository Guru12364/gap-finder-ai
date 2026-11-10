'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Brain,
  RotateCcw,
  Target,
  Lightbulb,
  X,
  Play,
} from 'lucide-react';
import { Subject, KnowledgeGap, TopicStatus } from '@/types';
import { cn, formatPercentage } from '@/lib/utils';
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

type TabFilter = 'all' | 'weak' | 'medium' | 'strong' | 'not_assessed';

function KnowledgeGapsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject_id') || '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubject);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingGaps, setIsLoadingGaps] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filters & search
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        setIsLoadingSubjects(true);
        const res = await fetch('/api/subjects');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load subjects');
        const list: Subject[] = json.data || [];
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

  // Fetch Gaps
  const fetchGaps = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setGaps([]);
      return;
    }
    try {
      setIsLoadingGaps(true);
      // Try /api/gaps first, if not found fallback to /api/gaps/analyze
      let res = await fetch(`/api/gaps?subject_id=${encodeURIComponent(subjectId)}`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/gaps/analyze?subject_id=${encodeURIComponent(subjectId)}`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch knowledge gaps');

      const dataList: KnowledgeGap[] = json.data?.gaps || json.gaps || json.data || [];
      setGaps(dataList);
    } catch (err: any) {
      console.error('Error fetching gaps:', err);
    } finally {
      setIsLoadingGaps(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchGaps(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchGaps]);

  // Run Gap Analysis
  const handleAnalyzeGaps = async () => {
    if (!selectedSubjectId) {
      showToast('error', 'Please select a subject');
      return;
    }
    try {
      setIsAnalyzing(true);
      showToast('info', 'Analyzing recent diagnostic attempts, student answers, and syllabus concepts...');

      const res = await fetch(`/api/gaps/analyze?subject_id=${encodeURIComponent(selectedSubjectId)}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to run gap analysis');

      const dataList: KnowledgeGap[] = json.data?.gaps || json.gaps || json.data || [];
      setGaps(dataList);
      showToast('success', 'Knowledge gap analysis updated!');
    } catch (err: any) {
      showToast('error', err.message || 'Analysis failed. Complete diagnostic quizzes first.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Summary Counts
  const counts = useMemo(() => {
    let weak = 0;
    let medium = 0;
    let strong = 0;
    let not_assessed = 0;

    gaps.forEach((g) => {
      if (g.status === 'weak') weak++;
      else if (g.status === 'medium') medium++;
      else if (g.status === 'strong') strong++;
      else not_assessed++;
    });

    return { weak, medium, strong, not_assessed, total: gaps.length };
  }, [gaps]);

  // Filtered & Sorted Gaps (accuracy ascending, weakest first)
  const filteredGaps = useMemo(() => {
    return gaps
      .filter((g) => {
        const matchesTab = activeTab === 'all' || g.status === activeTab;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          g.topic_name.toLowerCase().includes(q) ||
          g.chapter?.toLowerCase().includes(q) ||
          g.reason?.toLowerCase().includes(q);
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [gaps, activeTab, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast */}
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
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
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
            <Target className="h-7 w-7 text-cyan-400" />
            Knowledge Gap Analysis
          </h1>
          <p className="mt-1.5 text-sm md:text-base text-gray-400">
            Pinpoint exact learning vulnerabilities, misconceptions, and targeted corrective recommendations.
          </p>
        </div>

        {/* Subject Selector + Analyze Gaps Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            {isLoadingSubjects ? (
              <div className="h-10 bg-white/5 animate-pulse rounded-lg border border-white/5" />
            ) : (
              <Select
                value={selectedSubjectId}
                onValueChange={(val) => {
                  setSelectedSubjectId(val);
                  router.push(`/gaps?subject_id=${val}`);
                }}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Choose subject..."
              />
            )}
          </div>

          <Button
            onClick={handleAnalyzeGaps}
            disabled={!selectedSubjectId || isAnalyzing}
            isLoading={isAnalyzing}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-4 h-4 mr-2 text-cyan-300" />
            Analyze Gaps
          </Button>
        </div>
      </div>

      {/* Summary Cards Top Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Weak Topics */}
        <div
          onClick={() => setActiveTab('weak')}
          className={cn(
            'cursor-pointer rounded-xl border p-5 backdrop-blur-xl transition-all shadow-lg',
            activeTab === 'weak'
              ? 'border-red-500 bg-red-500/15 ring-1 ring-red-500'
              : 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">
              Weak Topics
            </span>
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono mt-2">{counts.weak}</p>
          <p className="text-[11px] text-red-200/70 mt-1">Immediate remediation required</p>
        </div>

        {/* Medium Topics */}
        <div
          onClick={() => setActiveTab('medium')}
          className={cn(
            'cursor-pointer rounded-xl border p-5 backdrop-blur-xl transition-all shadow-lg',
            activeTab === 'medium'
              ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500'
              : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Medium Topics
            </span>
            <div className="h-3 w-3 rounded-full bg-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono mt-2">{counts.medium}</p>
          <p className="text-[11px] text-amber-200/70 mt-1">Review practice recommended</p>
        </div>

        {/* Strong Topics */}
        <div
          onClick={() => setActiveTab('strong')}
          className={cn(
            'cursor-pointer rounded-xl border p-5 backdrop-blur-xl transition-all shadow-lg',
            activeTab === 'strong'
              ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
              : 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Strong Topics
            </span>
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono mt-2">{counts.strong}</p>
          <p className="text-[11px] text-emerald-200/70 mt-1">High retention demonstrated</p>
        </div>

        {/* Not Assessed */}
        <div
          onClick={() => setActiveTab('not_assessed')}
          className={cn(
            'cursor-pointer rounded-xl border p-5 backdrop-blur-xl transition-all shadow-lg',
            activeTab === 'not_assessed'
              ? 'border-slate-400 bg-slate-500/15 ring-1 ring-slate-400'
              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Not Assessed
            </span>
            <div className="h-3 w-3 rounded-full bg-gray-500" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono mt-2">{counts.not_assessed}</p>
          <p className="text-[11px] text-gray-500 mt-1">Diagnostic pending</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-navy-950/60 p-1 rounded-lg border border-white/[0.06] overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All Topics' },
              { key: 'weak', label: 'Weak' },
              { key: 'medium', label: 'Medium' },
              { key: 'strong', label: 'Strong' },
              { key: 'not_assessed', label: 'Not Assessed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0',
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search gaps or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-navy-900/60 border-white/10"
          />
        </div>
      </div>

      {/* Gaps List */}
      {isLoadingGaps ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="h-5 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : gaps.length === 0 ? (
        /* Empty State */
        <Card className="border border-dashed border-white/10 bg-white/[0.01]">
          <CardContent className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-cyan-400 mb-4">
              <Brain className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No gap data yet</h3>
            <p className="text-sm text-gray-400 max-w-md mt-2 mb-6">
              Complete diagnostic quizzes for this subject to let GapFinder AI detect subtle conceptual misunderstandings and build your knowledge profile.
            </p>
            <div className="flex items-center gap-3">
              <Link href={`/quiz?subject_id=${selectedSubjectId}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Take Diagnostic Quiz
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleAnalyzeGaps}
                disabled={!selectedSubjectId || isAnalyzing}
                className="border-white/10"
              >
                <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                Run Gap Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredGaps.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No topics matching the current filter.
        </div>
      ) : (
        /* Gap Cards Grid */
        <div className="space-y-4">
          {filteredGaps.map((gap) => {
            const isWeak = gap.status === 'weak';
            const isMed = gap.status === 'medium';
            const isStrong = gap.status === 'strong';

            const statusDotColor = isWeak
              ? 'bg-red-500 ring-red-500/30'
              : isMed
              ? 'bg-amber-400 ring-amber-400/30'
              : isStrong
              ? 'bg-emerald-400 ring-emerald-400/30'
              : 'bg-gray-500 ring-gray-500/30';

            const cardBorder = isWeak
              ? 'border-red-500/30 bg-red-500/[0.02]'
              : isMed
              ? 'border-amber-500/30 bg-amber-500/[0.02]'
              : isStrong
              ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
              : 'border-white/[0.06] bg-white/[0.02]';

            return (
              <div
                key={gap.id || gap.topic_id}
                className={cn(
                  'rounded-xl border backdrop-blur-xl p-5 md:p-6 transition-all duration-200 shadow-xl space-y-4',
                  cardBorder
                )}
              >
                {/* Top Row: Title, Chapter, Status Dot & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-3.5 w-3.5 rounded-full shrink-0 ring-4 mt-1.5 transition-all',
                        statusDotColor
                      )}
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        {gap.topic_name}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{gap.chapter || 'Syllabus Chapter'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Accuracy & Attempts */}
                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-white font-mono">
                        {formatPercentage(gap.accuracy)}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {gap.correct_answers || 0} / {gap.total_attempts || 0} correct
                      </p>
                    </div>

                    <div className="w-24">
                      <Progress
                        value={gap.accuracy}
                        size="sm"
                        indicatorClassName={
                          isWeak
                            ? 'bg-gradient-to-r from-red-600 to-rose-400'
                            : isMed
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Reason Text */}
                {gap.reason && (
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                    <span className="font-semibold text-white">Diagnosis: </span>
                    {gap.reason}
                  </p>
                )}

                {/* Misconceptions if any */}
                {gap.misconceptions && gap.misconceptions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Detected Conceptual Misconceptions
                    </span>
                    <ul className="space-y-1">
                      {gap.misconceptions.map((mis, mIdx) => (
                        <li
                          key={mIdx}
                          className="text-xs text-red-200/90 pl-3 border-l-2 border-red-500/40 py-0.5"
                        >
                          {mis}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation & Practice Action Button */}
                <div className="pt-3 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs text-indigo-300">
                    <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Recommendation: </strong>
                      {gap.recommendation || 'Complete targeted review exercises on fundamental formulas and definitions.'}
                    </span>
                  </div>

                  <Link
                    href={`/quiz?subject_id=${gap.subject_id}&topic_id=${gap.topic_id}`}
                    className="shrink-0"
                  >
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                      Practice This Topic
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeGapsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <KnowledgeGapsContent />
    </React.Suspense>
  );
}
