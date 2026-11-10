export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Quiz } from '@/types';

export async function GET(request: NextRequest) {
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

    const subjectId = request.nextUrl.searchParams.get('subject_id');

    let query = supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: quizzes, error } = await query;

    if (error) {
      console.error('Error fetching quizzes:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch quizzes' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Quiz[]>>({
      data: quizzes as Quiz[],
    });
  } catch (err) {
    console.error('Quiz GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
