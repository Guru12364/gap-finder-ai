export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, QuizResult, TopicQuizPerformance } from '@/types';

interface AnswerSubmission {
  question_id: string;
  selected_answer: number;
  time_taken?: number;
}

interface EvaluateBody {
  quiz_id: string;
  answers: AnswerSubmission[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as EvaluateBody;
    const { quiz_id, answers } = body;

    if (!quiz_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'quiz_id is required' },
        { status: 400 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'answers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quiz_id)
      .eq('user_id', user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('order_index', { ascending: true });

    if (questionsError || !questions) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch quiz questions' },
        { status: 500 }
      );
    }

    // Build question lookup map
    const questionMap = new Map(
      questions.map((q) => [q.id, q])
    );

    // Process each answer
    let totalCorrect = 0;
    let totalTimeTaken = 0;
    const answerRecords: Array<{
      user_id: string;
      quiz_id: string;
      question_id: string;
      selected_answer: number;
      is_correct: boolean;
      time_taken: number;
    }> = [];

    // Track topic performance
    const topicPerformanceMap = new Map<
      string,
      { topic_name: string; chapter: string; correct: number; total: number; topic_id: string | null }
    >();

    for (const answer of answers) {
      const question = questionMap.get(answer.question_id);
      if (!question) {
        continue; // Skip answers for unknown questions
      }

      const isCorrect = answer.selected_answer === question.correct_answer;
      if (isCorrect) {
        totalCorrect++;
      }

      const answerTime = answer.time_taken || 0;
      totalTimeTaken += answerTime;

      answerRecords.push({
        user_id: user.id,
        quiz_id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: isCorrect,
        time_taken: answerTime,
      });

      // Track topic performance
      const topicKey = question.topic_name || 'General';
      const existing = topicPerformanceMap.get(topicKey);
      if (existing) {
        existing.total++;
        if (isCorrect) existing.correct++;
      } else {
        topicPerformanceMap.set(topicKey, {
          topic_name: question.topic_name || 'General',
          chapter: question.chapter || '',
          correct: isCorrect ? 1 : 0,
          total: 1,
          topic_id: question.topic_id || null,
        });
      }
    }

    // Insert student answers
    if (answerRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('student_answers')
        .insert(answerRecords);

      if (insertError) {
        console.error('Error inserting student answers:', insertError);
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Failed to save answers' },
          { status: 500 }
        );
      }
    }

    // Calculate accuracy
    const accuracy =
      questions.length > 0
        ? Math.round((totalCorrect / questions.length) * 100)
        : 0;

    // Update quiz record
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({
        correct_answers: totalCorrect,
        accuracy,
        status: 'completed',
        completed_at: new Date().toISOString(),
        time_taken: totalTimeTaken,
      })
      .eq('id', quiz_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quiz:', updateError);
    }

    // Build topic performance breakdown
    const topicPerformance: TopicQuizPerformance[] = Array.from(
      topicPerformanceMap.values()
    ).map((tp) => ({
      topic_id: tp.topic_id || '',
      topic_name: tp.topic_name,
      chapter: tp.chapter,
      correct: tp.correct,
      total: tp.total,
      accuracy: tp.total > 0 ? Math.round((tp.correct / tp.total) * 100) : 0,
    }));

    const quizResult: QuizResult = {
      quiz_id,
      total_questions: questions.length,
      correct_answers: totalCorrect,
      accuracy,
      time_taken: totalTimeTaken,
      topic_performance: topicPerformance,
    };

    return NextResponse.json<ApiResponse<QuizResult>>({
      data: quizResult,
    });
  } catch (err) {
    console.error('Quiz evaluate POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
