import { createServiceClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';
import { RetrievedChunk, ChunkMetadata } from '@/types';

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalizes metadata from database row into typed ChunkMetadata.
 */
function normalizeMetadata(rawMeta: any, subjectId: string): ChunkMetadata {
  const meta = typeof rawMeta === 'object' && rawMeta !== null ? rawMeta : {};
  return {
    document_name: meta.document_name || 'Document',
    document_type: meta.document_type || 'notes',
    subject_id: meta.subject_id || subjectId,
    page_number: typeof meta.page_number === 'number' ? meta.page_number : undefined,
    chapter: meta.chapter || undefined,
    section: meta.section || undefined,
  };
}

/**
 * Retrieves relevant chunks for a user query via semantic vector search.
 * Queries Supabase using the match_document_chunks RPC function,
 * with resilient fallback to client-side cosine comparison if RPC is unavailable.
 */
export async function retrieveRelevantChunks(
  query: string,
  subjectId: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !subjectId) {
    return [];
  }

  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(trimmedQuery);

  const supabase = createServiceClient();
  let chunks: RetrievedChunk[] = [];

  // 2. Call Supabase RPC 'match_document_chunks'
  try {
    // Attempt standard RPC signature
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_count: topK * 2, // Fetch slight surplus to filter by threshold
      filter_subject_id: subjectId,
    });

    if (!error && Array.isArray(data)) {
      chunks = data.map((item: any) => ({
        chunk_id: item.id || item.chunk_id || String(Math.random()),
        content: item.content || '',
        metadata: normalizeMetadata(item.metadata, subjectId),
        similarity: typeof item.similarity === 'number' ? item.similarity : 1.0,
      }));
    } else {
      // Try alternate RPC parameter name if filter_subject_id was not accepted
      const { data: altData, error: altError } = await supabase.rpc(
        'match_document_chunks',
        {
          query_embedding: queryEmbedding,
          match_count: topK * 2,
          subject_id: subjectId,
        }
      );

      if (!altError && Array.isArray(altData)) {
        chunks = altData.map((item: any) => ({
          chunk_id: item.id || item.chunk_id || String(Math.random()),
          content: item.content || '',
          metadata: normalizeMetadata(item.metadata, subjectId),
          similarity: typeof item.similarity === 'number' ? item.similarity : 1.0,
        }));
      }
    }
  } catch {
    // RPC may not be configured yet; proceed to direct table fallback
  }

  // Fallback: If RPC returned nothing or failed, query document_chunks table directly
  if (chunks.length === 0) {
    try {
      const { data: rows, error: selectError } = await supabase
        .from('document_chunks')
        .select('id, content, metadata, embedding')
        .contains('metadata', { subject_id: subjectId })
        .limit(50);

      if (!selectError && rows && rows.length > 0) {
        chunks = rows
          .map((row: any) => {
            const similarity =
              row.embedding && Array.isArray(row.embedding)
                ? cosineSimilarity(queryEmbedding, row.embedding)
                : 0.5;

            return {
              chunk_id: row.id,
              content: row.content || '',
              metadata: normalizeMetadata(row.metadata, subjectId),
              similarity,
            };
          })
          .sort((a, b) => b.similarity - a.similarity);
      }
    } catch {
      // Table fallback failed; return empty array
    }
  }

  // 3. Filter results with similarity > 0.3
  const filteredChunks = chunks
    .filter((chunk) => chunk.similarity > 0.3 && chunk.content.trim().length > 0)
    .slice(0, topK);

  return filteredChunks;
}

/**
 * Retrieve chunks specifically targeting a subject topic.
 * Combines topic name with semantic prompt keywords.
 */
export async function retrieveChunksByTopic(
  topicName: string,
  subjectId: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  if (!topicName || !topicName.trim()) {
    return [];
  }

  const query = `Comprehensive concepts, definitions, explanations, formulas, and examples for ${topicName.trim()}`;
  return retrieveRelevantChunks(query, subjectId, topK);
}

/**
 * Format retrieved chunks into a structured context string for the LLM.
 * Includes precise source attribution: [Source: document_name, Page: X, Section: Y, Chapter: Z].
 */
export function formatChunksAsContext(chunks: RetrievedChunk[]): string {
  if (!chunks || chunks.length === 0) {
    return 'No relevant context found from uploaded study materials.';
  }

  return chunks
    .map((chunk, index) => {
      const meta = chunk.metadata;
      const parts: string[] = [];

      if (meta.document_name) {
        parts.push(`Source: ${meta.document_name}`);
      }
      if (meta.page_number !== undefined && meta.page_number !== null) {
        parts.push(`Page: ${meta.page_number}`);
      }
      if (meta.chapter) {
        parts.push(`Chapter: ${meta.chapter}`);
      }
      if (meta.section) {
        parts.push(`Section: ${meta.section}`);
      }

      const header = parts.length > 0 ? `[${parts.join(', ')}]` : `[Context ${index + 1}]`;
      return `${header}\n${chunk.content.trim()}`;
    })
    .join('\n\n---\n\n');
}
