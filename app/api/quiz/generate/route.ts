import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuizFromMaterial } from '@/lib/rag/pipeline';
import type { ApiResponse, Quiz, QuizConfig, QuizQuestion } from '@/types';

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

    const config = (await request.json()) as QuizConfig;

    if (!config.subject_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    // Verify subject belongs to user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', config.subject_id)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Generate quiz questions from RAG pipeline
    const result = await generateQuizFromMaterial(config);
    const generatedQuestions = result?.questions || [];

    if (!generatedQuestions || generatedQuestions.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to generate quiz questions. Ensure documents are uploaded and processed.' },
        { status: 400 }
      );
    }

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        subject_id: config.subject_id,
        title: config.title || `${subject.name} Quiz`,
        quiz_type: config.quiz_type || 'mixed',
        difficulty: config.difficulty || 'medium',
        total_questions: generatedQuestions.length,
        correct_answers: 0,
        accuracy: 0,
        time_taken: 0,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (quizError || !quiz) {
      console.error('Error creating quiz:', quizError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create quiz' },
        { status: 500 }
      );
    }

    // Insert quiz questions
    const questionRecords = generatedQuestions.map((q, index) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || config.difficulty || 'medium',
      topic_id: q.topic_id || null,
      topic_name: q.topic_name || null,
      chapter: q.chapter || null,
      source_citation: q.source_citation || null,
      order_index: index,
    }));

    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionRecords)
      .select();

    if (questionsError) {
      console.error('Error inserting quiz questions:', questionsError);
      // Clean up the quiz record
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create quiz questions' },
        { status: 500 }
      );
    }

    const quizWithQuestions = {
      ...quiz,
      questions: questions as QuizQuestion[],
    } as Quiz & { questions: QuizQuestion[] };

    return NextResponse.json<ApiResponse<Quiz & { questions: QuizQuestion[] }>>(
      { data: quizWithQuestions },
      { status: 201 }
    );
  } catch (err) {
    console.error('Quiz generate POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
