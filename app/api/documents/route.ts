import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Document } from '@/types';

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

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Document[]>>({
      data: documents as Document[],
    });
  } catch (err) {
    console.error('Documents GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const documentId = request.nextUrl.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Document id is required' },
        { status: 400 }
      );
    }

    // Verify document belongs to user and get subject_id
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, subject_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete associated chunks first
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (chunksError) {
      console.error('Error deleting document chunks:', chunksError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to delete document chunks' },
        { status: 500 }
      );
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Update subject document_count
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', document.subject_id)
      .eq('user_id', user.id);

    await supabase
      .from('subjects')
      .update({
        document_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.subject_id);

    return NextResponse.json<ApiResponse<{ id: string }>>({
      data: { id: documentId },
    });
  } catch (err) {
    console.error('Documents DELETE error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
