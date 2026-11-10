export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Quiz, QuizQuestion, StudentAnswer } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
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
      .eq('quiz_id', id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch quiz questions' },
        { status: 500 }
      );
    }

    // Fetch student answers
    const { data: answers, error: answersError } = await supabase
      .from('student_answers')
      .select('*')
      .eq('quiz_id', id)
      .eq('user_id', user.id);

    if (answersError) {
      console.error('Error fetching student answers:', answersError);
    }

    const quizWithDetails = {
      ...quiz,
      questions: (questions || []) as QuizQuestion[],
      answers: (answers || []) as StudentAnswer[],
    } as Quiz & { questions: QuizQuestion[]; answers: StudentAnswer[] };

    return NextResponse.json<
      ApiResponse<Quiz & { questions: QuizQuestion[]; answers: StudentAnswer[] }>
    >({
      data: quizWithDetails,
    });
  } catch (err) {
    console.error('Quiz [id] GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
