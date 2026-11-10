// ============================================================
// GapFinder AI – Core Type Definitions
// ============================================================

// ---- User & Auth ----
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ---- Subjects ----
export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  document_count: number;
  topic_count: number;
  created_at: string;
  updated_at: string;
}

// ---- Documents ----
export type DocumentType = 'syllabus' | 'textbook' | 'notes' | 'question_paper' | 'other';
export type ProcessingStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: DocumentType;
  status: ProcessingStatus;
  page_count?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// ---- Document Chunks ----
export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  metadata: ChunkMetadata;
  embedding?: number[];
  created_at: string;
}

export interface ChunkMetadata {
  page_number?: number;
  chapter?: string;
  section?: string;
  document_name: string;
  document_type: DocumentType;
  subject_id: string;
}

// ---- Topics ----
export type TopicStatus = 'not_assessed' | 'weak' | 'medium' | 'strong';

export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  chapter: string;
  description?: string;
  source_document_id?: string;
  source_page?: string;
  importance?: 'high' | 'medium' | 'low';
  related_concepts?: string[];
  status: TopicStatus;
  created_at: string;
  updated_at: string;
}

export interface TopicMap {
  subject: Subject;
  chapters: ChapterGroup[];
}

export interface ChapterGroup {
  name: string;
  topics: Topic[];
}

// ---- Quizzes ----
export type QuizType = 'quick' | 'topic_wise' | 'chapter_wise' | 'full_diagnostic';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  quiz_type: QuizType;
  difficulty: DifficultyLevel;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  time_taken?: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: DifficultyLevel;
  topic_id?: string;
  topic_name?: string;
  chapter?: string;
  source_citation: SourceCitation;
  order_index: number;
  created_at: string;
}

export interface SourceCitation {
  document_name: string;
  page_number?: number;
  section?: string;
  chapter?: string;
  excerpt?: string;
}

export interface StudentAnswer {
  id: string;
  user_id: string;
  quiz_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  time_taken?: number;
  created_at: string;
}

// ---- Quiz Config ----
export interface QuizConfig {
  subject_id: string;
  title?: string;
  quiz_type: QuizType;
  difficulty: DifficultyLevel;
  num_questions: number;
  chapter?: string;
  topic_ids?: string[];
}

// ---- Quiz Results ----
export interface QuizResult {
  quiz: Quiz;
  questions: QuizQuestion[];
  answers: StudentAnswer[];
  topic_performance: TopicQuizPerformance[];
}

export interface TopicQuizPerformance {
  topic_name: string;
  topic_id?: string;
  total: number;
  correct: number;
  accuracy: number;
}

// ---- Knowledge Gap ----
export interface KnowledgeGap {
  id: string;
  user_id: string;
  topic_id: string;
  topic_name: string;
  chapter: string;
  subject_id: string;
  subject_name?: string;
  total_attempts: number;
  correct_answers: number;
  accuracy: number;
  status: TopicStatus;
  reason: string;
  misconceptions?: string[];
  recommendation: string;
  last_assessed: string;
  created_at: string;
  updated_at: string;
}

export interface GapReport {
  subject: Subject;
  gaps: KnowledgeGap[];
  summary: {
    total_topics: number;
    weak: number;
    medium: number;
    strong: number;
    not_assessed: number;
  };
}

// ---- Revision Plan ----
export interface RevisionPlan {
  id: string;
  user_id: string;
  subject_id: string;
  exam_date: string;
  total_days: number;
  daily_hours: number;
  status: 'active' | 'completed' | 'outdated';
  created_at: string;
  updated_at: string;
}

export interface RevisionTask {
  id: string;
  plan_id: string;
  day_number: number;
  topic_id?: string;
  topic_name: string;
  chapter?: string;
  duration_minutes: number;
  task_type: 'study' | 'practice_quiz' | 'review';
  objectives: string[];
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  created_at: string;
}

export interface RevisionDay {
  day_number: number;
  date: string;
  tasks: RevisionTask[];
  total_minutes: number;
}

export interface RevisionPlanConfig {
  subject_id: string;
  exam_date: string;
  daily_hours: number;
  preferred_schedule?: 'morning' | 'afternoon' | 'evening' | 'flexible';
}

// ---- Chat / AI Assistant ----
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  subject_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ---- Analytics ----
export interface PerformanceData {
  date: string;
  accuracy: number;
  quiz_count: number;
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  accuracy: number;
  total_quizzes: number;
  total_questions: number;
  correct_answers: number;
}

export interface TopicPerformanceHistory {
  topic_name: string;
  attempts: { date: string; accuracy: number }[];
}

export interface AnalyticsData {
  overall_accuracy: number;
  total_quizzes: number;
  total_questions?: number;
  total_questions_attempted?: number;
  subjects?: SubjectPerformance[];
  subject_performance?: SubjectPerformance[];
  performance_over_time?: PerformanceData[];
  accuracy_over_time?: any[];
  mastery_distribution?: any;
  topic_mastery_distribution?: any;
  weak_topic_count?: number;
  strong_topic_count?: number;
  medium_topic_count?: number;
  not_assessed_count?: number;
  improvement_rate?: number;
  [key: string]: any;
}

// ---- RAG ----
export interface RetrievedChunk {
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
  chunk_id: string;
}

export interface RAGContext {
  chunks: RetrievedChunk[];
  query: string;
  subject_id: string;
}

export interface RAGResponse {
  content: string;
  sources: SourceCitation[];
  confidence: number;
}

// ---- API Responses ----
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
}
