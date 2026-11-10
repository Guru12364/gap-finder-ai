import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Subject } from '@/types';

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

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subject[]>>({
      data: subjects as Subject[],
    });
  } catch (err) {
    console.error('Subjects GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { name, description } = body as {
      name: string;
      description?: string;
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject name is required' },
        { status: 400 }
      );
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        document_count: 0,
        topic_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create subject' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subject>>(
      { data: subject as Subject },
      { status: 201 }
    );
  } catch (err) {
    console.error('Subjects POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
