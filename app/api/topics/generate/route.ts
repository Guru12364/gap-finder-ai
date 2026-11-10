export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTopicsFromDocument } from '@/lib/rag/pipeline';
import type { ApiResponse, Topic } from '@/types';

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

    // Fetch all completed documents for the subject
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, name, file_name')
      .eq('subject_id', subject_id)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No completed documents found for this subject. Please upload and process documents first.' },
        { status: 400 }
      );
    }

    const allTopics: Array<{
      name: string;
      chapter: string;
      description: string;
      importance: string;
      related_concepts: string[];
      source_document_id: string;
      source_page: number | null;
    }> = [];

    // For each document, fetch chunks and extract topics
    for (const doc of documents) {
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('content, chunk_index, metadata')
        .eq('document_id', doc.id)
        .order('chunk_index', { ascending: true });

      if (chunksError || !chunks || chunks.length === 0) {
        console.warn(`No chunks found for document ${doc.id}, skipping`);
        continue;
      }

      // Concatenate chunk content
      const fullContent = chunks.map((c) => c.content).join('\n\n');

      // Extract topics from the document content
      const extractedTree = await extractTopicsFromDocument(
        fullContent,
        doc.name || doc.file_name,
        subject_id
      );

      if (extractedTree && Array.isArray(extractedTree.chapters)) {
        for (const ch of extractedTree.chapters) {
          const chapterName = ch.name || 'General';
          if (Array.isArray(ch.topics)) {
            for (const topic of ch.topics) {
              allTopics.push({
                name: topic.name,
                chapter: chapterName,
                description: topic.description || '',
                importance: topic.importance || 'medium',
                related_concepts: topic.related_concepts || [],
                source_document_id: doc.id,
                source_page: null,
              });
            }
          }
        }
      }
    }

    if (allTopics.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No topics could be extracted from the documents' },
        { status: 400 }
      );
    }

    // Upsert topics (by name + subject_id + user_id)
    const insertedTopics: Topic[] = [];

    for (const topic of allTopics) {
      // Check if a topic with the same name already exists for this subject/user
      const { data: existing } = await supabase
        .from('topics')
        .select('id')
        .eq('subject_id', subject_id)
        .eq('user_id', user.id)
        .eq('name', topic.name)
        .single();

      if (existing) {
        // Update existing topic
        const { data: updated, error: updateError } = await supabase
          .from('topics')
          .update({
            chapter: topic.chapter,
            description: topic.description,
            importance: topic.importance,
            related_concepts: topic.related_concepts,
            source_document_id: topic.source_document_id,
            source_page: topic.source_page,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!updateError && updated) {
          insertedTopics.push(updated as Topic);
        }
      } else {
        // Insert new topic
        const { data: inserted, error: insertError } = await supabase
          .from('topics')
          .insert({
            subject_id: subject_id,
            user_id: user.id,
            name: topic.name,
            chapter: topic.chapter,
            description: topic.description,
            importance: topic.importance,
            related_concepts: topic.related_concepts,
            source_document_id: topic.source_document_id,
            source_page: topic.source_page,
            status: 'not_assessed',
          })
          .select()
          .single();

        if (!insertError && inserted) {
          insertedTopics.push(inserted as Topic);
        }
      }
    }

    // Update subject topic_count
    const { count } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subject_id)
      .eq('user_id', user.id);

    await supabase
      .from('subjects')
      .update({
        topic_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subject_id);

    return NextResponse.json<ApiResponse<Topic[]>>({
      data: insertedTopics,
    });
  } catch (err) {
    console.error('Topics generate POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
