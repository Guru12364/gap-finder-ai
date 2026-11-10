import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Topic } from '@/types';

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

    if (!subjectId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .order('chapter', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Topic[]>>({
      data: topics as Topic[],
    });
  } catch (err) {
    console.error('Topics GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
