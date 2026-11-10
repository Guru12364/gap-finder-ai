'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  Target,
  Layers,
  AlertCircle,
  X,
  RefreshCw,
  Hash,
  Loader2,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { TopicBadge } from '@/components/shared/topic-badge';

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  chapter?: string;
  status: 'weak' | 'medium' | 'strong' | 'not_assessed';
  importance?: 'high' | 'medium' | 'low';
  subject_id: string;
}

interface ChapterGroup {
  name: string;
  topics: Topic[];
}

function getImportanceColor(importance?: string) {
  switch (importance) {
    case 'high':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    case 'medium':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'low':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

function TopicsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subject_id') || '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data.subjects || data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, []);

  const fetchTopics = useCallback(async (subjectId: string) => {
    setIsLoadingTopics(true);
    try {
      const res = await fetch(`/api/topics?subject_id=${subjectId}`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      const data = await res.json();
      const topicList = data.topics || data || [];
      setTopics(topicList);
      // Expand all chapters by default
      const chapters = new Set<string>(
        topicList.map((t: Topic) => t.chapter || 'Uncategorized')
      );
      setExpandedChapters(chapters);
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchSubjects();
      setIsLoading(false);
    };
    init();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    } else {
      setTopics([]);
    }
  }, [selectedSubject, fetchTopics]);

  const handleGenerateTopics = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: selectedSubject }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate topics');
      }
      await fetchTopics(selectedSubject);
    } catch (err: any) {
      setError(err.message || 'Failed to generate topics');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChapter = (chapterName: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterName)) {
        newSet.delete(chapterName);
      } else {
        newSet.add(chapterName);
      }
      return newSet;
    });
  };

  // Group topics by chapter
  const chapterGroups: ChapterGroup[] = React.useMemo(() => {
    const groups: Record<string, Topic[]> = {};
    topics.forEach((topic) => {
      const chapter = topic.chapter || 'Uncategorized';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push(topic);
    });
    return Object.entries(groups).map(([name, topics]) => ({
      name,
      topics,
    }));
  }, [topics]);

  // Stats
  const stats = React.useMemo(() => {
    const total = topics.length;
    const weak = topics.filter((t) => t.status === 'weak').length;
    const medium = topics.filter((t) => t.status === 'medium').length;
    const strong = topics.filter((t) => t.status === 'strong').length;
    const notAssessed = topics.filter((t) => t.status === 'not_assessed').length;
    return { total, weak, medium, strong, notAssessed };
  }, [topics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            Topic Map
          </h1>
          <p className="text-gray-400 mt-2">
            Explore your subject&apos;s topics organized by chapters
          </p>
        </div>
        {selectedSubject && (
          <button
            onClick={handleGenerateTopics}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Topics
              </>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subject Selector */}
      <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Subject</label>
        <div className="relative max-w-md">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            <option value="" className="bg-[#0d1326]">Choose a subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0d1326]">
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      {selectedSubject && topics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Topics', value: stats.total, color: 'text-white', bg: 'bg-white/[0.04]' },
            { label: 'Strong', value: stats.strong, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Medium', value: stats.medium, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Weak', value: stats.weak, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Not Assessed', value: stats.notAssessed, color: 'text-slate-400', bg: 'bg-slate-500/10' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-2xl border border-white/[0.08] ${stat.bg} text-center`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Topic Tree */}
      {isLoadingTopics ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : !selectedSubject ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12 text-gray-600" />}
          title="Select a subject"
          description="Choose a subject from the dropdown above to view its topic map."
        />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-12 h-12 text-gray-600" />}
          title="No topics found"
          description="Upload study materials and generate topics to build your topic map."
          action={
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/upload')}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition-all text-sm font-medium"
              >
                Upload Materials
              </button>
              <button
                onClick={handleGenerateTopics}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Generate Topics
              </button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {chapterGroups.map((chapter) => (
            <div
              key={chapter.name}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden"
            >
              {/* Chapter Header */}
              <button
                onClick={() => toggleChapter(chapter.name)}
                className="w-full flex items-center gap-3 p-5 hover:bg-white/[0.03] transition-all"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-semibold text-white">{chapter.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {chapter.topics.length} topic{chapter.topics.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {expandedChapters.has(chapter.name) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Topics */}
              {expandedChapters.has(chapter.name) && (
                <div className="border-t border-white/[0.06]">
                  {chapter.topics.map((topic, idx) => (
                    <div
                      key={topic.id}
                      className={`flex items-start gap-4 p-5 pl-14 hover:bg-white/[0.03] transition-all ${
                        idx < chapter.topics.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      {/* Connecting line visual */}
                      <div className="relative flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-500/40 mt-2" />
                        {idx < chapter.topics.length - 1 && (
                          <div className="absolute top-4 left-[3px] w-0.5 h-full bg-white/[0.06]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white">{topic.name}</h4>
                            {topic.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {topic.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {topic.importance && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getImportanceColor(
                                  topic.importance
                                )}`}
                              >
                                {topic.importance}
                              </span>
                            )}
                            <TopicBadge status={topic.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopicsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <TopicsContent />
    </React.Suspense>
  );
}
