export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { explainTopic } from '@/lib/rag/pipeline';
import type { ApiResponse, ChatMessage } from '@/types';

interface ChatRequestBody {
  subject_id: string;
  message: string;
  session_id?: string;
}

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

    const body = (await request.json()) as ChatRequestBody;
    const { subject_id, message, session_id } = body;

    if (!subject_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'message is required' },
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

    let activeSessionId = session_id;

    // If no session_id, create a new chat session
    if (!activeSessionId) {
      const title =
        message.length > 60 ? message.substring(0, 60) + '...' : message;

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          subject_id,
          title,
        })
        .select()
        .single();

      if (sessionError || !session) {
        console.error('Error creating chat session:', sessionError);
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Failed to create chat session' },
          { status: 500 }
        );
      }

      activeSessionId = session.id;
    } else {
      // Verify session belongs to user
      const { data: existingSession, error: sessionCheckError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', activeSessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionCheckError || !existingSession) {
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Chat session not found' },
          { status: 404 }
        );
      }
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: activeSessionId,
        role: 'user',
        content: message.trim(),
        sources: null,
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Call RAG pipeline to generate response
    const aiResponse = await explainTopic(message.trim(), subject_id);

    // Save assistant response
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: activeSessionId,
        role: 'assistant',
        content: aiResponse.content,
        sources: aiResponse.sources || null,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to save assistant response' },
        { status: 500 }
      );
    }

    // Update session updated_at
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeSessionId);

    return NextResponse.json<
      ApiResponse<{ session_id: string; message: ChatMessage }>
    >({
      data: {
        session_id: activeSessionId,
        message: assistantMessage as ChatMessage,
      },
    });
  } catch (err) {
    console.error('Chat POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
