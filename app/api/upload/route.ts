import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { extractPDFContent, extractTextContent, chunkDocument } from '@/lib/document-processor';
import { generateEmbeddings } from '@/lib/embeddings';
import type { ApiResponse, Document, DocumentType } from '@/types';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];
const EMBEDDING_BATCH_SIZE = 50;

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const subjectId = formData.get('subject_id') as string | null;
    const documentType = (formData.get('document_type') as DocumentType) || 'notes';

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const fileExtension = '.' + fileName.split('.').pop();
    const isValidType =
      ALLOWED_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.includes(fileExtension);

    if (!isValidType) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Invalid file type. Allowed: PDF, TXT, MD' },
        { status: 400 }
      );
    }

    // Verify subject belongs to user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subjectId)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Create document record with 'processing' status
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || `text/${fileExtension.slice(1)}`,
        document_type: documentType,
        status: 'processing',
      })
      .select()
      .single();

    if (docError || !document) {
      console.error('Error creating document record:', docError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Process document in background-style (still awaited but structured for error handling)
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isPDF =
        file.type === 'application/pdf' || fileExtension === '.pdf';

      // Extract content
      const processedDoc = isPDF
        ? await extractPDFContent(buffer, file.name)
        : extractTextContent(buffer.toString('utf-8'), file.name);

      // Chunk the document
      const chunks = chunkDocument(processedDoc, {
        document_name: file.name,
        document_type: documentType,
        subject_id: subjectId,
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      if (chunks.length === 0) {
        await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: 'No content could be extracted from the document',
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);

        return NextResponse.json<ApiResponse<Document>>({
          data: {
            ...document,
            status: 'failed',
            error_message: 'No content could be extracted from the document',
          } as Document,
        });
      }

      // Generate embeddings in batches
      const chunkContents = chunks.map((c) => c.content);
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < chunkContents.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = chunkContents.slice(i, i + EMBEDDING_BATCH_SIZE);
        const batchEmbeddings = await generateEmbeddings(batch);
        allEmbeddings.push(...batchEmbeddings);
      }

      // Use service client for vector inserts (bypasses RLS)
      const serviceClient = createServiceClient();

      // Prepare chunk records
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: document.id,
        subject_id: subjectId,
        content: chunk.content,
        chunk_index: index,
        metadata: chunk.metadata || {},
        embedding: JSON.stringify(allEmbeddings[index]),
      }));

      // Insert chunks in batches
      const CHUNK_INSERT_BATCH = 100;
      for (let i = 0; i < chunkRecords.length; i += CHUNK_INSERT_BATCH) {
        const batch = chunkRecords.slice(i, i + CHUNK_INSERT_BATCH);
        const { error: chunkError } = await serviceClient
          .from('document_chunks')
          .insert(batch);

        if (chunkError) {
          console.error('Error inserting chunks batch:', chunkError);
          throw new Error(`Failed to insert document chunks: ${chunkError.message}`);
        }
      }

      // Update document status to completed
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'completed',
          page_count: processedDoc.pageCount || 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating document status:', updateError);
      }

      // Update subject document_count
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId)
        .eq('user_id', user.id);

      await supabase
        .from('subjects')
        .update({
          document_count: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subjectId);

      return NextResponse.json<ApiResponse<Document>>(
        { data: (updatedDoc || document) as Document },
        { status: 201 }
      );
    } catch (processingError) {
      console.error('Document processing error:', processingError);
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown processing error';

      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      return NextResponse.json<ApiResponse<Document>>({
        data: {
          ...document,
          status: 'failed',
          error_message: errorMessage,
        } as Document,
      });
    }
  } catch (err) {
    console.error('Upload POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
