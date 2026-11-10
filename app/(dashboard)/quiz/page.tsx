'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Zap,
  BookOpen,
  Layers,
  Brain,
  ChevronDown,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trophy,
  BarChart3,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  chapter?: string;
}

interface RecentQuiz {
  id: string;
  quiz_type: string;
  difficulty: string;
  total_questions: number;
  score?: number;
  status: string;
  created_at: string;
  subject?: { name: string };
}

const QUIZ_TYPES = [
  { value: 'quick', label: 'Quick Quiz', description: '5 questions, random topics', icon: Zap },
  { value: 'topic_wise', label: 'Topic-wise', description: 'Focus on specific topics', icon: Target },
  { value: 'chapter_wise', label: 'Chapter-wise', description: 'Cover entire chapter', icon: Layers },
  { value: 'diagnostic', label: 'Full Diagnostic', description: 'Comprehensive assessment', icon: Brain },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'hard', label: 'Hard', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'mixed', label: 'Mixed', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

export default function QuizPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [quizType, setQuizType] = useState('quick');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

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
    try {
      const res = await fetch(`/api/topics?subject_id=${subjectId}`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      const data = await res.json();
      const topicList: Topic[] = data.topics || data || [];
      setTopics(topicList);
      const uniqueChapters = Array.from(
        new Set(topicList.map((t) => t.chapter).filter(Boolean))
      ) as string[];
      setChapters(uniqueChapters);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  }, []);

  const fetchRecentQuizzes = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz');
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      const data = await res.json();
      setRecentQuizzes(data.quizzes || data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchSubjects(), fetchRecentQuizzes()]);
      setIsLoading(false);
    };
    init();
  }, [fetchSubjects, fetchRecentQuizzes]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
      setSelectedTopics([]);
      setSelectedChapter('');
    }
  }, [selectedSubject, fetchTopics]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleStartQuiz = async () => {
    if (!selectedSubject) {
      setError('Please select a subject.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        subject_id: selectedSubject,
        quiz_type: quizType,
        difficulty,
        num_questions: numQuestions,
      };
      if (quizType === 'topic_wise' && selectedTopics.length > 0) {
        body.topic_ids = selectedTopics;
      }
      if (quizType === 'chapter_wise' && selectedChapter) {
        body.chapter = selectedChapter;
      }

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate quiz');
      }
      const data = await res.json();
      const quizId = data.quiz?.id || data.id;
      router.push(`/quiz/${quizId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-gray-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

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
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <Target className="w-6 h-6 text-amber-400" />
          </div>
          Quiz Center
        </h1>
        <p className="text-gray-400 mt-2">Configure and start a quiz to test your knowledge</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">Subject</label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="" className="bg-[#0d1326]">Choose a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0d1326]">{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Quiz Type */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">Quiz Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUIZ_TYPES.map((qt) => {
                const Icon = qt.icon;
                const isSelected = quizType === qt.value;
                return (
                  <button
                    key={qt.value}
                    onClick={() => setQuizType(qt.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-300 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20' : 'bg-white/[0.04]'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {qt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{qt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIFFICULTIES.map((d) => {
                const isSelected = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium text-center transition-all duration-300 ${
                      isSelected ? d.color : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Number of Questions
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumQuestions(Math.max(5, numQuestions - 1))}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <button
                onClick={() => setNumQuestions(Math.min(20, numQuestions + 1))}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-white w-10 text-center">{numQuestions}</span>
            </div>
          </div>

          {/* Chapter Selector (for chapter-wise) */}
          {quizType === 'chapter_wise' && chapters.length > 0 && (
            <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Chapter</label>
              <div className="relative">
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  <option value="" className="bg-[#0d1326]">Choose a chapter...</option>
                  {chapters.map((ch) => (
                    <option key={ch} value={ch} className="bg-[#0d1326]">{ch}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Topic Selector (for topic-wise) */}
          {quizType === 'topic_wise' && topics.length > 0 && (
            <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Topics{' '}
                <span className="text-gray-500 font-normal">
                  ({selectedTopics.length} selected)
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-300 ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                          : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{topic.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            disabled={isGenerating || !selectedSubject}
            className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-semibold text-base hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Quiz
              </>
            )}
          </button>
        </div>

        {/* Right: Recent Quizzes */}
        <div>
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-400" />
              Recent Quizzes
            </h2>

            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-xl bg-white/[0.03] inline-block mb-3">
                  <Trophy className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No quizzes taken yet</p>
                <p className="text-gray-600 text-xs mt-1">Start your first quiz above!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {recentQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => {
                      if (quiz.status === 'completed') {
                        router.push(`/quiz/${quiz.id}/results`);
                      } else {
                        router.push(`/quiz/${quiz.id}`);
                      }
                    }}
                    className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {quiz.quiz_type?.replace('_', ' ')}
                      </span>
                      {quiz.score !== undefined && quiz.score !== null ? (
                        <span className={`text-sm font-bold ${getScoreColor(quiz.score)}`}>
                          {quiz.score}%
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize">{quiz.difficulty}</span>
                      <span>·</span>
                      <span>{quiz.total_questions} Q&apos;s</span>
                      <span>·</span>
                      <span>{formatDate(quiz.created_at)}</span>
                    </div>
                    {quiz.score !== undefined && quiz.score !== null && (
                      <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            quiz.score >= 80
                              ? 'bg-emerald-500'
                              : quiz.score >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${quiz.score}%` }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
