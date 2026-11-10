export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  AnalyticsData,
  PerformanceData,
  SubjectPerformance,
} from '@/types';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Concurrently fetch user's quizzes, subjects, and topics
    const [quizzesRes, subjectsRes, topicsRes] = await Promise.all([
      supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true }),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id),
      supabase
        .from('topics')
        .select('id, status, subject_id')
        .eq('user_id', user.id),
    ]);

    if (quizzesRes.error) {
      return NextResponse.json({ error: quizzesRes.error.message }, { status: 500 });
    }

    const quizzes = quizzesRes.data || [];
    const subjects = subjectsRes.data || [];
    const topics = topicsRes.data || [];

    // Calculate totals
    const total_quizzes = quizzes.length;
    let total_questions_attempted = 0;
    let total_correct = 0;

    for (const q of quizzes) {
      total_questions_attempted += q.total_questions || 0;
      total_correct += q.correct_answers || 0;
    }

    const overall_accuracy =
      total_questions_attempted > 0
        ? Math.round((total_correct / total_questions_attempted) * 100)
        : 0;

    // Subject-wise performance
    const subjectPerformanceList: SubjectPerformance[] = subjects.map((sub) => {
      const subQuizzes = quizzes.filter((q) => q.subject_id === sub.id);
      const subTotalQuestions = subQuizzes.reduce(
        (sum, q) => sum + (q.total_questions || 0),
        0
      );
      const subCorrect = subQuizzes.reduce(
        (sum, q) => sum + (q.correct_answers || 0),
        0
      );
      const subAccuracy =
        subTotalQuestions > 0
          ? Math.round((subCorrect / subTotalQuestions) * 100)
          : 0;

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        accuracy: subAccuracy,
        total_quizzes: subQuizzes.length,
        total_questions: subTotalQuestions,
        correct_answers: subCorrect,
      };
    });

    // Performance over time (group completed quizzes by date YYYY-MM-DD)
    const dateMap = new Map<string, { totalAcc: number; count: number }>();

    for (const q of quizzes) {
      const rawDate = q.completed_at || q.created_at;
      const dateKey = new Date(rawDate).toISOString().split('T')[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { totalAcc: 0, count: 0 });
      }
      const item = dateMap.get(dateKey)!;
      item.totalAcc += q.accuracy || 0;
      item.count++;
    }

    const performance_over_time: PerformanceData[] = Array.from(
      dateMap.entries()
    ).map(([date, val]) => ({
      date,
      accuracy: Math.round(val.totalAcc / val.count),
      quiz_count: val.count,
    }));

    // Topic counts by status
    let weak_topic_count = 0;
    let medium_topic_count = 0;
    let strong_topic_count = 0;
    let not_assessed_count = 0;

    for (const t of topics) {
      if (t.status === 'weak') weak_topic_count++;
      else if (t.status === 'medium') medium_topic_count++;
      else if (t.status === 'strong') strong_topic_count++;
      else not_assessed_count++;
    }

    // Improvement rate calculation
    let improvement_rate = 0;
    if (quizzes.length >= 2) {
      const halfIndex = Math.floor(quizzes.length / 2);
      const firstHalf = quizzes.slice(0, halfIndex);
      const secondHalf = quizzes.slice(halfIndex);

      const firstAvg =
        firstHalf.reduce((sum, q) => sum + (q.accuracy || 0), 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, q) => sum + (q.accuracy || 0), 0) / secondHalf.length;

      improvement_rate = Math.round((secondAvg - firstAvg) * 10) / 10;
    }

    const analyticsData: AnalyticsData = {
      overall_accuracy,
      total_quizzes,
      total_questions_attempted,
      subjects: subjectPerformanceList,
      performance_over_time,
      weak_topic_count,
      medium_topic_count,
      strong_topic_count,
      not_assessed_count,
      improvement_rate,
    };

    return NextResponse.json({ data: analyticsData });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
