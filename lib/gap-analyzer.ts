import { KnowledgeGap, TopicStatus } from '@/types';

const WEAK_THRESHOLD = parseInt(process.env.GAP_WEAK_THRESHOLD || '50', 10);
const STRONG_THRESHOLD = parseInt(process.env.GAP_STRONG_THRESHOLD || '80', 10);

/**
 * Classifies topic understanding based on quiz accuracy and attempt volume.
 */
export function classifyTopic(accuracy: number, totalAttempts: number): TopicStatus {
  if (totalAttempts === 0) {
    return 'not_assessed';
  }
  if (accuracy < WEAK_THRESHOLD) {
    return 'weak';
  }
  if (accuracy < STRONG_THRESHOLD) {
    return 'medium';
  }
  return 'strong';
}

/**
 * Generates clear, human-readable explanations of a student's topic classification.
 */
export function generateGapReason(
  topicName: string,
  accuracy: number,
  status: TopicStatus,
  totalAttempts: number,
  correctAnswers: number
): string {
  const roundedAccuracy = Math.round(accuracy);

  switch (status) {
    case 'not_assessed':
      return `No questions attempted yet for "${topicName}". Needs initial diagnostic assessment to determine baseline.`;
    case 'weak':
      return `Student answered only ${correctAnswers} out of ${totalAttempts} questions correctly (${roundedAccuracy}%). Shows consistent difficulty with this topic.`;
    case 'medium':
      return `Student answered ${correctAnswers} out of ${totalAttempts} questions correctly (${roundedAccuracy}%). Shows partial conceptual understanding with occasional gaps.`;
    case 'strong':
      return `Student answered ${correctAnswers} out of ${totalAttempts} questions correctly (${roundedAccuracy}%). Demonstrates solid comprehension and retention.`;
    default:
      return `Performance data for "${topicName}" is inconclusive.`;
  }
}

/**
 * Generates an actionable, targeted recommendation for the student based on status.
 */
export function generateRecommendation(
  topicName: string,
  status: TopicStatus,
  accuracy: number
): string {
  switch (status) {
    case 'weak':
      return `Revise "${topicName}" thoroughly. Focus on core concepts. Practice at least 5 additional questions.`;
    case 'medium':
      return `Review "${topicName}" with focus on areas of confusion. Practice 3 more questions.`;
    case 'strong':
      return `Good understanding. Brief review recommended before exam.`;
    case 'not_assessed':
      return `Take a quiz covering this topic to assess your understanding.`;
    default:
      return `Continue regular study and practice on "${topicName}".`;
  }
}

export interface TopicPerformanceInput {
  topic_id: string;
  topic_name: string;
  chapter: string;
  subject_id: string;
  total_attempts: number;
  correct_answers: number;
  user_id?: string;
  subject_name?: string;
}

/**
 * Analyzes raw performance data across topics, classifies each topic,
 * generates explanations and recommendations, and sorts by urgency:
 * weak -> medium -> not_assessed -> strong.
 */
export function analyzePerformanceData(
  topicPerformances: TopicPerformanceInput[]
): KnowledgeGap[] {
  const now = new Date().toISOString();

  const gaps: KnowledgeGap[] = topicPerformances.map((perf) => {
    const totalAttempts = perf.total_attempts || 0;
    const correctAnswers = perf.correct_answers || 0;
    const accuracy =
      totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

    const status = classifyTopic(accuracy, totalAttempts);
    const reason = generateGapReason(
      perf.topic_name,
      accuracy,
      status,
      totalAttempts,
      correctAnswers
    );
    const recommendation = generateRecommendation(perf.topic_name, status, accuracy);

    return {
      id: `gap-${perf.topic_id}`,
      user_id: perf.user_id || '',
      topic_id: perf.topic_id,
      topic_name: perf.topic_name,
      chapter: perf.chapter || 'General',
      subject_id: perf.subject_id,
      subject_name: perf.subject_name,
      total_attempts: totalAttempts,
      correct_answers: correctAnswers,
      accuracy: Math.round(accuracy),
      status,
      reason,
      recommendation,
      last_assessed: now,
      created_at: now,
      updated_at: now,
    };
  });

  // Sort order: weak first, then medium, then not_assessed, then strong
  const statusPriority: Record<TopicStatus, number> = {
    weak: 0,
    medium: 1,
    not_assessed: 2,
    strong: 3,
  };

  return gaps.sort((a, b) => {
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    // Secondary sort: lower accuracy first within the same status
    return a.accuracy - b.accuracy;
  });
}

/**
 * Computes summary counts across knowledge gaps.
 */
export function summarizeGaps(gaps: KnowledgeGap[]): {
  total_topics: number;
  weak: number;
  medium: number;
  strong: number;
  not_assessed: number;
} {
  const summary = {
    total_topics: gaps.length,
    weak: 0,
    medium: 0,
    strong: 0,
    not_assessed: 0,
  };

  for (const gap of gaps) {
    if (gap.status === 'weak') summary.weak++;
    else if (gap.status === 'medium') summary.medium++;
    else if (gap.status === 'strong') summary.strong++;
    else if (gap.status === 'not_assessed') summary.not_assessed++;
  }

  return summary;
}

/**
 * Detects whether a student has improved between previous and current assessments.
 */
export function detectImprovement(
  previousAccuracy: number,
  currentAccuracy: number
): { improved: boolean; changePercent: number } {
  const diff = currentAccuracy - previousAccuracy;
  const changePercent = Math.round(diff * 10) / 10;

  return {
    improved: changePercent > 0,
    changePercent,
  };
}
