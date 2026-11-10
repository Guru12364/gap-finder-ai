import { retrieveRelevantChunks, formatChunksAsContext } from './retriever';
import { generateWithGroq, parseJsonResponse } from './generator';
import {
  buildQuizPrompt,
  buildExplanationPrompt,
  buildEvaluationPrompt,
  TOPIC_EXTRACTION_PROMPT,
  QUIZ_GENERATION_PROMPT,
  TOPIC_EXPLANATION_PROMPT,
  ANSWER_EVALUATION_PROMPT,
  REVISION_PLAN_PROMPT,
} from './prompts';
import {
  QuizQuestion,
  SourceCitation,
  RAGResponse,
  QuizConfig,
  DifficultyLevel,
} from '@/types';

export interface GeneratedQuestionPayload {
  questions: Omit<QuizQuestion, 'id' | 'quiz_id' | 'created_at'>[];
}

export interface ExtractedTopicTree {
  chapters: {
    name: string;
    topics: {
      name: string;
      description: string;
      importance: string;
      related_concepts: string[];
    }[];
  }[];
}

export interface AnswerEvaluationResult {
  explanation: string;
  misconception?: string;
  sources: SourceCitation[];
}

/**
 * Deduplicates an array of source citations.
 */
function deduplicateSources(sources: SourceCitation[]): SourceCitation[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.document_name}-${s.page_number || ''}-${s.section || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Generates MCQs grounded in uploaded subject study materials.
 */
export async function generateQuizFromMaterial(
  config: QuizConfig
): Promise<GeneratedQuestionPayload> {
  const count = config.num_questions || 5;

  // 1. Construct search query based on quiz scope
  let searchQuery = 'fundamental concepts, definitions, principles, formulas, and assessment problems';
  if (config.chapter) {
    searchQuery = `${config.chapter} key concepts, mechanisms, definitions, and questions`;
  }

  // Retrieve relevant chunks with surplus for varied question formulation
  const targetChunksCount = Math.min(15, Math.max(6, count * 2));
  const retrievedChunks = await retrieveRelevantChunks(
    searchQuery,
    config.subject_id,
    targetChunksCount
  );

  if (retrievedChunks.length === 0) {
    throw new Error(
      'No study material chunks found for this subject. Please upload and process documents first.'
    );
  }

  // 2. Format as context
  const context = formatChunksAsContext(retrievedChunks);

  // 3. Build prompt
  const userPrompt = buildQuizPrompt(context, {
    numQuestions: count,
    difficulty: config.difficulty,
    chapter: config.chapter,
  });

  // 4. Call Groq LLM
  const rawResponse = await generateWithGroq(
    QUIZ_GENERATION_PROMPT,
    userPrompt,
    { jsonMode: true, temperature: 0.2 }
  );

  // 5. Parse JSON response
  interface RawQuizOutput {
    questions?: any[];
  }
  const parsed = await parseJsonResponse<RawQuizOutput | any[]>(rawResponse);

  const rawQuestions: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.questions)
    ? parsed.questions
    : [];

  if (rawQuestions.length === 0) {
    throw new Error('LLM failed to produce structured questions from the given material');
  }

  // 6. Validate and sanitize each question with source citation
  const fallbackSource: SourceCitation = {
    document_name: retrievedChunks[0]?.metadata.document_name || 'Study Material',
    page_number: retrievedChunks[0]?.metadata.page_number,
    chapter: retrievedChunks[0]?.metadata.chapter,
    section: retrievedChunks[0]?.metadata.section,
    excerpt: retrievedChunks[0]?.content.slice(0, 150),
  };

  const validDifficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'mixed'];

  const questions: Omit<QuizQuestion, 'id' | 'quiz_id' | 'created_at'>[] = rawQuestions.map(
    (q, index) => {
      // Ensure exactly 4 options
      let options: string[] = Array.isArray(q.options)
        ? q.options.map((opt: any) => String(opt))
        : [];

      if (options.length < 4) {
        while (options.length < 4) {
          options.push(`Alternative ${options.length + 1}`);
        }
      } else if (options.length > 4) {
        options = options.slice(0, 4);
      }

      // Ensure valid integer 0-3
      let correctAnswer = typeof q.correct_answer === 'number' ? q.correct_answer : 0;
      if (correctAnswer < 0 || correctAnswer > 3) {
        correctAnswer = 0;
      }

      const diff: DifficultyLevel = validDifficulties.includes(q.difficulty)
        ? q.difficulty
        : (config.difficulty as DifficultyLevel) || 'medium';

      const citation: SourceCitation = q.source_citation
        ? {
            document_name: q.source_citation.document_name || fallbackSource.document_name,
            page_number:
              typeof q.source_citation.page_number === 'number'
                ? q.source_citation.page_number
                : fallbackSource.page_number,
            chapter: q.source_citation.chapter || fallbackSource.chapter,
            section: q.source_citation.section || fallbackSource.section,
            excerpt: q.source_citation.excerpt || fallbackSource.excerpt,
          }
        : fallbackSource;

      return {
        question: String(q.question || 'Review the concept and select the best answer:'),
        options,
        correct_answer: correctAnswer,
        explanation: String(q.explanation || 'Refer to the source citation excerpt.'),
        difficulty: diff,
        topic_name: q.topic_name || config.chapter || 'Core Concepts',
        chapter: q.chapter || config.chapter || 'Chapter Overview',
        source_citation: citation,
        order_index: index + 1,
      };
    }
  );

  return { questions };
}

/**
 * Explains a concept or answers student queries strictly grounded in uploaded materials.
 */
export async function explainTopic(
  question: string,
  subjectId: string
): Promise<RAGResponse> {
  // 1. Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(question, subjectId, 5);

  if (chunks.length === 0) {
    return {
      content:
        'No relevant study materials found for this subject. Please upload textbooks or notes to ask questions about your syllabus.',
      sources: [],
      confidence: 0,
    };
  }

  // 2. Format context
  const context = formatChunksAsContext(chunks);

  // 3. Build explanation prompt
  const userPrompt = buildExplanationPrompt(context, question);

  // 4. Generate response
  const content = await generateWithGroq(TOPIC_EXPLANATION_PROMPT, userPrompt, {
    temperature: 0.3,
  });

  // 5. Extract source citations
  const rawSources: SourceCitation[] = chunks.map((chunk) => ({
    document_name: chunk.metadata.document_name,
    page_number: chunk.metadata.page_number,
    chapter: chunk.metadata.chapter,
    section: chunk.metadata.section,
    excerpt: chunk.content.slice(0, 160) + '...',
  }));

  const sources = deduplicateSources(rawSources);

  // Calculate confidence score from top chunk similarity
  const avgSimilarity =
    chunks.reduce((acc, curr) => acc + curr.similarity, 0) / chunks.length;
  const confidence = Math.min(1.0, Math.max(0.1, Math.round(avgSimilarity * 100) / 100));

  return {
    content,
    sources,
    confidence,
  };
}

/**
 * Extracts a hierarchical syllabus of chapters and topics from document text.
 */
export async function extractTopicsFromDocument(
  content: string,
  documentName: string,
  subjectId: string
): Promise<ExtractedTopicTree> {
  if (!content || !content.trim()) {
    return { chapters: [] };
  }

  // Cap content to ~50,000 characters to fit LLM context efficiently while retaining scope
  let processedContent = content;
  if (content.length > 50000) {
    // Preserve intro/table of contents + sample of later sections
    const head = content.substring(0, 30000);
    const tail = content.substring(content.length - 20000);
    processedContent = `${head}\n\n[... content truncated for topic extraction ...]\n\n${tail}`;
  }

  const userPrompt = `DOCUMENT NAME: "${documentName}"
SUBJECT ID: "${subjectId}"

DOCUMENT CONTENT:
=========================================
${processedContent}
=========================================

Extract the complete chapter and topic taxonomy as specified.`;

  const raw = await generateWithGroq(TOPIC_EXTRACTION_PROMPT, userPrompt, {
    jsonMode: true,
    temperature: 0.1,
  });

  const parsed = await parseJsonResponse<ExtractedTopicTree>(raw);

  if (!parsed || !Array.isArray(parsed.chapters)) {
    return {
      chapters: [
        {
          name: 'General Topics',
          topics: [
            {
              name: documentName.replace(/\.[^/.]+$/, ''),
              description: 'Primary topics covered in the uploaded material.',
              importance: 'high',
              related_concepts: [],
            },
          ],
        },
      ],
    };
  }

  return parsed;
}

/**
 * Evaluates a student's answer against the correct answer and reference material.
 */
export async function evaluateAnswer(
  question: string,
  options: string[],
  correctAnswer: number,
  studentAnswer: number,
  subjectId: string
): Promise<AnswerEvaluationResult> {
  const correctText = options[correctAnswer] || `Option ${correctAnswer + 1}`;
  const studentText = options[studentAnswer] || `Option ${studentAnswer + 1}`;

  // 1. Retrieve context
  const chunks = await retrieveRelevantChunks(question, subjectId, 4);
  const context = formatChunksAsContext(chunks);

  // 2. Build prompt
  const userPrompt = buildEvaluationPrompt(
    context,
    question,
    correctText,
    studentText
  );

  // 3. Generate evaluation
  const rawResponse = await generateWithGroq(ANSWER_EVALUATION_PROMPT, userPrompt, {
    jsonMode: true,
    temperature: 0.2,
  });

  interface EvalOutput {
    explanation?: string;
    misconception?: string;
  }

  const parsed = await parseJsonResponse<EvalOutput>(rawResponse);

  const rawSources: SourceCitation[] = chunks.map((c) => ({
    document_name: c.metadata.document_name,
    page_number: c.metadata.page_number,
    chapter: c.metadata.chapter,
    section: c.metadata.section,
    excerpt: c.content.slice(0, 140) + '...',
  }));

  return {
    explanation:
      parsed.explanation ||
      `The correct answer is "${correctText}". Review your course material for full details.`,
    misconception: parsed.misconception || undefined,
    sources: deduplicateSources(rawSources),
  };
}

/**
 * Generates an adaptive day-by-day revision schedule based on diagnosed knowledge gaps.
 */
export async function generateRevisionPlan(
  gaps: any[],
  examDate: string,
  dailyHours: number,
  subjectId: string
): Promise<any> {
  const targetDate = new Date(examDate);
  const now = new Date();
  const diffDays = Math.max(
    1,
    Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const userPrompt = `SUBJECT ID: ${subjectId}
EXAM DATE: ${examDate}
DAYS REMAINING: ${diffDays} days
DAILY ALLOCATED HOURS: ${dailyHours} hours/day

DIAGNOSED KNOWLEDGE GAPS:
${JSON.stringify(gaps, null, 2)}

Formulate a complete day-by-day revision schedule covering all weak and medium topics before the exam date.`;

  const raw = await generateWithGroq(REVISION_PLAN_PROMPT, userPrompt, {
    jsonMode: true,
    temperature: 0.3,
  });

  return parseJsonResponse<any>(raw);
}
