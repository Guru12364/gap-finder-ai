export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, KnowledgeGap, GapReport } from '@/types';
import { summarizeGaps } from '@/lib/gap-analyzer';

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

    // Verify subject
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', subjectId)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Query knowledge_gaps joined with topics to get topic name and chapter
    const { data: gapsData, error: gapsError } = await supabase
      .from('knowledge_gaps')
      .select(`
        id,
        user_id,
        topic_id,
        subject_id,
        accuracy,
        status,
        reason,
        misconceptions,
        recommendation,
        last_assessed,
        created_at,
        updated_at,
        topics!inner (
          name,
          chapter
        )
      `)
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .order('accuracy', { ascending: true });

    if (gapsError) {
      console.error('Error fetching knowledge gaps:', gapsError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch knowledge gaps' },
        { status: 500 }
      );
    }

    const mappedGaps: KnowledgeGap[] = (gapsData || []).map((g: any) => ({
      id: g.id,
      user_id: g.user_id,
      topic_id: g.topic_id,
      topic_name: g.topics?.name || 'Topic',
      chapter: g.topics?.chapter || 'General',
      subject_id: g.subject_id,
      subject_name: subject.name,
      total_attempts: 0,
      correct_answers: 0,
      accuracy: Math.round(g.accuracy || 0),
      status: g.status,
      reason: g.reason || '',
      misconceptions: g.misconceptions || [],
      recommendation: g.recommendation || '',
      last_assessed: g.last_assessed,
      created_at: g.created_at,
      updated_at: g.updated_at,
    }));

    const summary = summarizeGaps(mappedGaps);

    const report: GapReport = {
      subject: subject as any,
      gaps: mappedGaps,
      summary,
    };

    return NextResponse.json<ApiResponse<GapReport>>({
      data: report,
    });
  } catch (err) {
    console.error('Gaps GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
