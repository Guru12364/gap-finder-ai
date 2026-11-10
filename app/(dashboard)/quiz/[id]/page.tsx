'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Send,
  Flag,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { Quiz, QuizQuestion } from '@/types';
import { cn, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ActiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionTimeMap, setQuestionTimeMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Submit confirmation dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Fetch quiz & questions
  useEffect(() => {
    async function fetchQuizData() {
      if (!quizId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/quiz/${quizId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load quiz');

        const quizData: Quiz = json.data?.quiz || json.quiz || json.data;
        const questionsData: QuizQuestion[] =
          json.data?.questions || json.questions || [];

        setQuiz(quizData);
        setQuestions(questionsData);

        // If quiz was already completed, redirect to results
        if (quizData?.status === 'completed') {
          router.replace(`/quiz/${quizId}/results`);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not load quiz questions');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuizData();
  }, [quizId, router]);

  // Overall timer
  useEffect(() => {
    if (isLoading || isSubmitting || !quiz) return;
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isSubmitting, quiz]);

  // Record time per question on index change
  const currentQuestion = questions[currentIndex];
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  const recordTimeForCurrent = useCallback(() => {
    if (!currentQuestion) return;
    const spent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setQuestionTimeMap((prev) => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + spent,
    }));
  }, [currentQuestion]);

  // Handle select option
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    recordTimeForCurrent();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    recordTimeForCurrent();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    recordTimeForCurrent();
    setCurrentIndex(index);
  };

  // Submit Evaluation
  const handleSubmitQuiz = async () => {
    recordTimeForCurrent();
    try {
      setIsSubmitting(true);
      setIsConfirmOpen(false);

      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] !== undefined ? answers[q.id] : -1,
        time_taken: questionTimeMap[q.id] || 0,
      }));

      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: formattedAnswers,
          total_time: secondsElapsed,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit quiz');

      router.replace(`/quiz/${quizId}/results`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-1/3" />
        <div className="h-4 bg-white/5 rounded-full w-full" />
        <div className="h-80 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8" />
      </div>
    );
  }

  if (errorMessage || !quiz || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Quiz Unavailable</h2>
        <p className="text-sm text-gray-400">
          {errorMessage || 'Unable to retrieve quiz session. It may have expired or is invalid.'}
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

  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Quiz Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/quiz"
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Leave quiz"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-md">{quiz.title}</span>
            </h1>
            <p className="text-xs text-gray-400">
              {currentQuestion?.chapter || 'Comprehensive Diagnostic'}
              {currentQuestion?.topic_name && ` • ${currentQuestion.topic_name}`}
            </p>
          </div>
        </div>

        {/* Timer & Submit Shortcut */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-navy-900/80 font-mono text-sm text-cyan-400 shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatDuration(secondsElapsed)}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 text-xs px-3"
          >
            Submit Quiz
          </Button>
        </div>
      </div>

      {/* Progress Bar & Question Count Indicator */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Question <span className="text-white font-bold">{currentIndex + 1}</span> of{' '}
            <span className="text-white font-bold">{totalCount}</span>
          </span>
          <span>
            {answeredCount} of {totalCount} answered ({Math.round(progressPercent)}%)
          </span>
        </div>
        <Progress value={progressPercent} size="sm" />
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <Card className="border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Question Header & Difficulty */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                Q{currentIndex + 1} • {currentQuestion.difficulty || 'Diagnostic'}
              </span>

              {currentQuestion.topic_name && (
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.topic_name}
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((optionText, optIdx) => {
                const isSelected = selectedAnswer === optIdx;
                const letter = OPTION_LABELS[optIdx] || `${optIdx + 1}`;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 group',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs transition-colors',
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 text-gray-300 group-hover:bg-white/15 group-hover:text-white'
                      )}
                    >
                      {letter}
                    </div>

                    <span
                      className={cn(
                        'text-sm leading-relaxed pt-0.5',
                        isSelected ? 'text-white font-medium' : 'text-gray-300'
                      )}
                    >
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="border-white/10 text-xs sm:text-sm px-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={() => setIsConfirmOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-600/20 text-xs sm:text-sm px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Finish & Evaluate
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm px-6"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Question Dots Navigator */}
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
          Question Palette
        </p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleJumpToQuestion(idx)}
                className={cn(
                  'h-8 w-8 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-all',
                  isCurrent
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-navy-950 font-bold scale-110 z-10'
                    : '',
                  isAnswered
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white'
                )}
                title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal Before Submit */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              Submit Diagnostic Evaluation?
            </DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} out of {totalCount} questions.
              {answeredCount < totalCount && (
                <span className="block mt-2 text-amber-300 font-medium">
                  Notice: {totalCount - answeredCount} unanswered{' '}
                  {totalCount - answeredCount === 1 ? 'question' : 'questions'} will be marked as incorrect.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-gray-400">
            Total elapsed time: <span className="font-mono text-cyan-400 font-bold">{formatDuration(secondsElapsed)}</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Resume Quiz
            </Button>
            <Button
              onClick={handleSubmitQuiz}
              isLoading={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Submit & View Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
