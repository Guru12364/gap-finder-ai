-- ============================================================
-- GapFinder AI - Supabase Database Schema Migration
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. HELPER FUNCTIONS & TRIGGERS FOR TIMESTAMPS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. CORE TABLES
-- ============================================================

-- Table 1: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_count INT NOT NULL DEFAULT 0,
  topic_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 3: documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  document_type TEXT NOT NULL CHECK (document_type IN ('syllabus', 'textbook', 'notes', 'question_paper', 'other')),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  page_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 4: document_chunks
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 5: topics
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chapter TEXT NOT NULL,
  description TEXT,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  source_page TEXT,
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
  related_concepts TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (status IN ('not_assessed', 'weak', 'medium', 'strong')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 6: quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('quick', 'topic_wise', 'chapter_wise', 'full_diagnostic')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  accuracy FLOAT NOT NULL DEFAULT 0,
  time_taken INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 7: quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INT NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_name TEXT,
  chapter TEXT,
  source_citation JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 8: student_answers
CREATE TABLE IF NOT EXISTS public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 9: knowledge_gaps
CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  accuracy FLOAT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (status IN ('not_assessed', 'weak', 'medium', 'strong')),
  reason TEXT,
  misconceptions TEXT[] DEFAULT '{}'::TEXT[],
  recommendation TEXT,
  last_assessed TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_topic UNIQUE(user_id, topic_id)
);

-- Table 10: revision_plans
CREATE TABLE IF NOT EXISTS public.revision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  total_days INT NOT NULL DEFAULT 1,
  daily_hours FLOAT NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'outdated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 11: revision_tasks
CREATE TABLE IF NOT EXISTS public.revision_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.revision_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL DEFAULT 1,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_name TEXT NOT NULL,
  chapter TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  task_type TEXT NOT NULL CHECK (task_type IN ('study', 'practice_quiz', 'review')),
  objectives TEXT[] DEFAULT '{}'::TEXT[],
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 12: chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 13: chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 4. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_knowledge_gaps_updated_at
  BEFORE UPDATE ON public.knowledge_gaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_revision_plans_updated_at
  BEFORE UPDATE ON public.revision_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. VECTOR SIMILARITY SEARCH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(384),
  match_count int DEFAULT 5,
  filter_subject_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  WHERE (filter_subject_id IS NULL OR dc.subject_id = filter_subject_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- 6. AUTO-CREATE PROFILE ON USER SIGNUP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. PERFORMANCE & RELATIONSHIP INDEXES
-- ============================================================
-- Vector HNSW index on embeddings
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
  ON public.document_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Foreign Key & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_subject_id ON public.documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_subject_id ON public.document_chunks(subject_id);

CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON public.topics(status);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_id ON public.quiz_questions(topic_id);

CREATE INDEX IF NOT EXISTS idx_student_answers_user_id ON public.student_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_quiz_id ON public.student_answers(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON public.student_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_user_id ON public.knowledge_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_subject_id ON public.knowledge_gaps(subject_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_topic_id ON public.knowledge_gaps(topic_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON public.knowledge_gaps(status);

CREATE INDEX IF NOT EXISTS idx_revision_plans_user_id ON public.revision_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_plans_subject_id ON public.revision_plans(subject_id);

CREATE INDEX IF NOT EXISTS idx_revision_tasks_plan_id ON public.revision_tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_revision_tasks_day_number ON public.revision_tasks(day_number);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_subject_id ON public.chat_sessions(subject_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. subjects policies
CREATE POLICY "Users can view their own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- 3. documents policies
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- 4. document_chunks policies (via documents)
CREATE POLICY "Users can view chunks belonging to their documents"
  ON public.document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks to their documents"
  ON public.document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks of their documents"
  ON public.document_chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks of their documents"
  ON public.document_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
    )
  );

-- 5. topics policies
CREATE POLICY "Users can view their own topics"
  ON public.topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics"
  ON public.topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics"
  ON public.topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics"
  ON public.topics FOR DELETE
  USING (auth.uid() = user_id);

-- 6. quizzes policies
CREATE POLICY "Users can view their own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. quiz_questions policies (via quizzes)
CREATE POLICY "Users can view questions in their quizzes"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions to their quizzes"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions of their quizzes"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of their quizzes"
  ON public.quiz_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

-- 8. student_answers policies
CREATE POLICY "Users can view their own answers"
  ON public.student_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
  ON public.student_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
  ON public.student_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
  ON public.student_answers FOR DELETE
  USING (auth.uid() = user_id);

-- 9. knowledge_gaps policies
CREATE POLICY "Users can view their own knowledge gaps"
  ON public.knowledge_gaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge gaps"
  ON public.knowledge_gaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge gaps"
  ON public.knowledge_gaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge gaps"
  ON public.knowledge_gaps FOR DELETE
  USING (auth.uid() = user_id);

-- 10. revision_plans policies
CREATE POLICY "Users can view their own revision plans"
  ON public.revision_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revision plans"
  ON public.revision_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revision plans"
  ON public.revision_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revision plans"
  ON public.revision_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 11. revision_tasks policies (via revision_plans)
CREATE POLICY "Users can view tasks in their revision plans"
  ON public.revision_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.revision_plans rp
      WHERE rp.id = revision_tasks.plan_id AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks to their revision plans"
  ON public.revision_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.revision_plans rp
      WHERE rp.id = revision_tasks.plan_id AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their revision plans"
  ON public.revision_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.revision_plans rp
      WHERE rp.id = revision_tasks.plan_id AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of their revision plans"
  ON public.revision_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.revision_plans rp
      WHERE rp.id = revision_tasks.plan_id AND rp.user_id = auth.uid()
    )
  );

-- 12. chat_sessions policies
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 13. chat_messages policies (via chat_sessions)
CREATE POLICY "Users can view messages in their chat sessions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their chat sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chat sessions"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their chat sessions"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
    )
  );
