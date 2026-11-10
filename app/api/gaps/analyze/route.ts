export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  analyzePerformanceData,
  summarizeGaps,
  type TopicPerformanceInput,
} from '@/lib/gap-analyzer';
import type { ApiResponse, GapReport, KnowledgeGap } from '@/types';

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
    const { subject_id } = body as { subject_id: string };

    if (!subject_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    // Verify subject belongs to user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Fetch all topics for the subject
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subject_id)
      .eq('user_id', user.id);

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      );
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No topics found for this subject. Generate topics first.' },
        { status: 400 }
      );
    }

    // Fetch all quizzes for this subject
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('subject_id', subject_id)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch quizzes' },
        { status: 500 }
      );
    }

    const quizIds = (quizzes || []).map((q) => q.id);

    // Build per-topic performance data
    const topicPerformanceMap = new Map<
      string,
      { topic_id: string; topic_name: string; total_attempts: number; correct_answers: number }
    >();

    // Initialize with all topics
    for (const topic of topics) {
      topicPerformanceMap.set(topic.name, {
        topic_id: topic.id,
        topic_name: topic.name,
        total_attempts: 0,
        correct_answers: 0,
      });
    }

    // Fetch student answers with question topic info
    if (quizIds.length > 0) {
      const { data: questionsWithAnswers, error: qaError } = await supabase
        .from('student_answers')
        .select(`
          is_correct,
          quiz_questions!inner (
            topic_name,
            topic_id
          )
        `)
        .eq('user_id', user.id)
        .in('quiz_id', quizIds);

      if (qaError) {
        console.error('Error fetching answers with questions:', qaError);
      } else if (questionsWithAnswers) {
        for (const answer of questionsWithAnswers) {
          const questionData = answer.quiz_questions as unknown as {
            topic_name: string | null;
            topic_id: string | null;
          };
          const topicName = questionData?.topic_name || 'General';

          const existing = topicPerformanceMap.get(topicName);
          if (existing) {
            existing.total_attempts++;
            if (answer.is_correct) {
              existing.correct_answers++;
            }
          } else {
            topicPerformanceMap.set(topicName, {
              topic_id: questionData?.topic_id || '',
              topic_name: topicName,
              total_attempts: 1,
              correct_answers: answer.is_correct ? 1 : 0,
            });
          }
        }
      }
    }

    // Prepare performance input for analyzer
    const performanceData: TopicPerformanceInput[] = Array.from(
      topicPerformanceMap.values()
    ).map((tp) => {
      // Find the matching topic to get chapter info
      const matchingTopic = topics.find(
        (t) => t.id === tp.topic_id || t.name === tp.topic_name
      );
      return {
        topic_id: tp.topic_id,
        topic_name: tp.topic_name,
        chapter: matchingTopic?.chapter || 'General',
        subject_id: subject_id,
        total_attempts: tp.total_attempts,
        correct_answers: tp.correct_answers,
      };
    });

    // Run gap analysis
    const analysisResults = await analyzePerformanceData(performanceData);

    // Upsert knowledge gaps
    const upsertedGaps: KnowledgeGap[] = [];

    for (const gap of analysisResults) {
      // Find the matching topic
      const matchingTopic = topics.find(
        (t) => t.id === gap.topic_id || t.name === gap.topic_name
      );
      const topicId = matchingTopic?.id || gap.topic_id;

      const { data: existing } = await supabase
        .from('knowledge_gaps')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .eq('subject_id', subject_id)
        .single();

      const gapRecord = {
        user_id: user.id,
        topic_id: topicId,
        subject_id: subject_id,
        accuracy: gap.accuracy,
        status: gap.status,
        reason: gap.reason || '',
        misconceptions: gap.misconceptions || [],
        recommendation: gap.recommendation || '',
        total_attempts: gap.total_attempts,
        correct_answers: gap.correct_answers,
        last_assessed: new Date().toISOString(),
      };

      if (existing) {
        const { data: updated, error: updateError } = await supabase
          .from('knowledge_gaps')
          .update({
            ...gapRecord,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!updateError && updated) {
          upsertedGaps.push(updated as KnowledgeGap);
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('knowledge_gaps')
          .insert(gapRecord)
          .select()
          .single();

        if (!insertError && inserted) {
          upsertedGaps.push(inserted as KnowledgeGap);
        }
      }

      // Update topic status based on gap analysis
      if (matchingTopic) {
        const newStatus =
          gap.accuracy >= 80
            ? 'strong'
            : gap.accuracy >= 50
              ? 'medium'
              : gap.total_attempts > 0
                ? 'weak'
                : 'not_assessed';

        await supabase
          .from('topics')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchingTopic.id);
      }
    }

    // Build gap report
    const summary = summarizeGaps(upsertedGaps);

    const gapReport: GapReport = {
      subject_id,
      subject_name: subject.name,
      total_topics: topics.length,
      analyzed_topics: performanceData.filter((p) => p.total_attempts > 0).length,
      gaps: upsertedGaps,
      summary,
    };

    return NextResponse.json<ApiResponse<GapReport>>({
      data: gapReport,
    });
  } catch (err) {
    console.error('Gaps analyze POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
