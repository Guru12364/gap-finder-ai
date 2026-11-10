'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { Quiz, QuizQuestion, StudentAnswer, TopicQuizPerformance } from '@/types';
import { cn, formatDuration, formatPercentage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceCitation } from '@/components/shared/source-citation';

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<TopicQuizPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Expand state for question reviews (default all open or first few)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchResults() {
      if (!quizId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/quiz/${quizId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load results');

        const quizData: Quiz = json.data?.quiz || json.quiz || json.data;
        const questionsData: QuizQuestion[] =
          json.data?.questions || json.questions || [];
        const answersData: StudentAnswer[] =
          json.data?.answers || json.answers || [];
        const topicPerfData: TopicQuizPerformance[] =
          json.data?.topic_performance || json.topic_performance || [];

        setQuiz(quizData);
        setQuestions(questionsData);
        setAnswers(answersData);
        setTopicPerformance(topicPerfData);

        // Expand all questions initially
        const initialExpand: Record<string, boolean> = {};
        questionsData.forEach((q) => {
          initialExpand[q.id] = true;
        });
        setExpandedQuestions(initialExpand);
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not fetch quiz outcome');
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [quizId]);

  // Map answers by question_id
  const answerMap = useMemo(() => {
    const map = new Map<string, StudentAnswer>();
    answers.forEach((ans) => {
      map.set(ans.question_id, ans);
    });
    return map;
  }, [answers]);

  // Calculate stats
  const totalQuestions = quiz?.total_questions || questions.length || 0;
  const correctCount =
    quiz?.correct_answers ??
    answers.filter((a) => a.is_correct).length;
  const incorrectCount = Math.max(0, totalQuestions - correctCount);
  const accuracy = quiz?.accuracy ?? (totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0);

  const getGrade = (score: number) => {
    if (score >= 90) return { letter: 'A', label: 'Mastery', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 80) return { letter: 'B', label: 'Proficient', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (score >= 70) return { letter: 'C', label: 'Competent', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (score >= 60) return { letter: 'D', label: 'Needs Practice', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { letter: 'F', label: 'Critical Gaps', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
  };

  const gradeInfo = getGrade(accuracy);

  // Fallback topic performance calculation if API did not return topic_performance directly
  const calculatedTopicPerformance = useMemo<TopicQuizPerformance[]>(() => {
    if (topicPerformance && topicPerformance.length > 0) {
      return topicPerformance;
    }

    const map = new Map<string, { total: number; correct: number }>();
    questions.forEach((q) => {
      const topicName = q.topic_name || q.chapter || 'General Concepts';
      const ans = answerMap.get(q.id);
      const isCorrect = ans ? ans.is_correct : false;

      const current = map.get(topicName) || { total: 0, correct: 0 };
      map.set(topicName, {
        total: current.total + 1,
        correct: current.correct + (isCorrect ? 1 : 0),
      });
    });

    return Array.from(map.entries()).map(([topic_name, stats]) => ({
      topic_name,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  }, [topicPerformance, questions, answerMap]);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = expand;
    });
    setExpandedQuestions(updated);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8" />
        <div className="h-32 bg-white/[0.02] border border-white/[0.04] rounded-2xl" />
        <div className="h-64 bg-white/[0.02] border border-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  if (errorMessage || !quiz) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Results Unavailable</h2>
        <p className="text-sm text-gray-400">
          {errorMessage || 'Unable to load diagnostic results for this quiz session.'}
        </p>
        <Link href="/quiz">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quiz Center
          </Button>
        </Link>
      </div>
    );
  }

  // SVG Circular Gauge calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Diagnostic Quizzes
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/gaps?subject_id=${quiz.subject_id}`}>
            <Button size="sm" variant="outline" className="text-xs border-indigo-500/30 text-indigo-300">
              <BarChart3 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              View Gap Analysis
            </Button>
          </Link>

          <Link href={`/quiz?subject_id=${quiz.subject_id}`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Retake Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Score Summary Header Card */}
      <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Accuracy Circular Progress */}
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-36 h-36 -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="text-white/10"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    strokeWidth="10"
                    stroke="url(#accuracyGradient)"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {Math.round(accuracy)}%
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                    Accuracy
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn('text-xs font-bold border px-2.5 py-0.5', gradeInfo.color)}>
                    Grade {gradeInfo.letter} • {gradeInfo.label}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {quiz.title}
                </h1>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Time taken: {formatDuration(quiz.time_taken || 0)}</span>
                </p>
              </div>
            </div>

            {/* Right: Breakdown Counts Cards */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 min-w-[90px]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xl font-bold text-white font-mono">{correctCount}</span>
                <span className="text-[11px] text-emerald-300/80">Correct</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 min-w-[90px]">
                <XCircle className="w-5 h-5 text-red-400 mb-1" />
                <span className="text-xl font-bold text-white font-mono">{incorrectCount}</span>
                <span className="text-[11px] text-red-300/80">Incorrect</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-white/[0.02] min-w-[90px]">
                <Brain className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xl font-bold text-white font-mono">{totalQuestions}</span>
                <span className="text-[11px] text-gray-400">Total</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic-wise Performance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Topic-wise Performance Breakdown
            </h2>
            <p className="text-xs text-gray-400">
              Evaluated based on answer patterns and syllabus learning objectives
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calculatedTopicPerformance.map((topic, idx) => {
            const isHigh = topic.accuracy >= 75;
            const isMed = topic.accuracy >= 50 && topic.accuracy < 75;
            const statusLabel = isHigh ? 'Strong' : isMed ? 'Moderate' : 'Knowledge Gap';
            const statusColor = isHigh
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : isMed
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20';

            return (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-tight">
                      {topic.topic_name}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {topic.correct} of {topic.total} questions correct
                    </p>
                  </div>
                  <Badge className={cn('text-[10px] px-2 py-0.5 font-medium border', statusColor)}>
                    {statusLabel}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400 text-[11px]">Mastery</span>
                    <span className="text-white font-bold">{topic.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        isHigh
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : isMed
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-red-500 to-orange-400'
                      )}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Question Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Detailed Question Review & Explanations
            </h2>
            <p className="text-xs text-gray-400">
              Inspect answer choices, reasoning, misconceptions, and direct textbook citations
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => toggleAll(true)}
              className="hover:text-cyan-400 transition-colors font-medium px-2 py-1"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={() => toggleAll(false)}
              className="hover:text-cyan-400 transition-colors font-medium px-2 py-1"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, qIndex) => {
            const studentAns = answerMap.get(q.id);
            const selectedIdx = studentAns ? studentAns.selected_answer : -1;
            const isCorrect = studentAns ? studentAns.is_correct : false;
            const isExpanded = expandedQuestions[q.id] !== false;

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-xl border backdrop-blur-xl overflow-hidden transition-all duration-200 shadow-lg',
                  isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                    : 'border-red-500/20 bg-red-500/[0.02]'
                )}
              >
                {/* Question Summary Bar */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono',
                        isCorrect
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      )}
                    >
                      {qIndex + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate max-w-md sm:max-w-xl">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        <span>{q.topic_name || q.chapter || 'Topic Question'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full border',
                        isCorrect
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      )}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-5 border-t border-white/[0.04]">
                    {/* Full Question Text */}
                    <p className="text-sm text-gray-200 leading-relaxed font-medium">
                      {q.question}
                    </p>

                    {/* Options list */}
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const isThisCorrect = optIdx === q.correct_answer;
                        const isThisStudentChoice = optIdx === selectedIdx;

                        let optionStyle =
                          'border-white/[0.06] bg-white/[0.01] text-gray-400';

                        if (isThisCorrect) {
                          optionStyle =
                            'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 font-medium';
                        } else if (isThisStudentChoice && !isCorrect) {
                          optionStyle =
                            'border-red-500/40 bg-red-500/10 text-red-200 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={cn(
                              'p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-3 transition-colors',
                              optionStyle
                            )}
                          >
                            <span
                              className={cn(
                                'font-bold font-mono px-1.5 py-0.5 rounded text-[10px]',
                                isThisCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : isThisStudentChoice && !isCorrect
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-white/5 text-gray-400'
                              )}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>

                            <div className="flex-1">
                              <span>{option}</span>
                              {isThisCorrect && (
                                <span className="ml-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                  ✓ Correct Answer
                                </span>
                              )}
                              {isThisStudentChoice && !isThisCorrect && (
                                <span className="ml-2 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                  ✗ Your Selection
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>Detailed Explanation</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}

                    {/* Misconception Alert if wrong */}
                    {!isCorrect && (
                      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] flex items-start gap-2.5 text-xs text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-300">Targeted Concept Misconception: </span>
                          <span>
                            This question evaluates core intuition around {q.topic_name || 'this topic'}.
                            Review the reference citation below to reinforce theoretical foundational principles.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Source Citation */}
                    {q.source_citation && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Syllabus / Textbook Source Citation
                        </span>
                        <SourceCitation citation={q.source_citation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav Buttons */}
      <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
        <Link href="/quiz">
          <Button variant="outline" className="border-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quiz Center
          </Button>
        </Link>

        <Link href={`/quiz?subject_id=${quiz.subject_id}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Another Diagnostic
          </Button>
        </Link>
      </div>
    </div>
  );
}
