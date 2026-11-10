import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatSession, ChatMessage } from '@/types';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const subjectId = searchParams.get('subject_id');

    // Case 1: Fetch single session by session_id with all its messages
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Chat session not found or access denied' },
          { status: 404 }
        );
      }

      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return NextResponse.json(
          { error: messagesError.message },
          { status: 500 }
        );
      }

      const sessionWithMessages: ChatSession = {
        id: session.id,
        user_id: session.user_id,
        subject_id: session.subject_id,
        messages: (messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources || [],
          created_at: m.created_at,
        })),
        created_at: session.created_at,
        updated_at: session.updated_at,
      };

      return NextResponse.json({ data: sessionWithMessages });
    }

    // Case 2: Fetch all sessions (optionally filtered by subject_id)
    let sessionsQuery = supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (subjectId) {
      sessionsQuery = sessionsQuery.eq('subject_id', subjectId);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const sessionList = sessions || [];
    if (sessionList.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch messages for these sessions
    const sessionIds = sessionList.map((s) => s.id);
    const { data: allMessages, error: allMsgsError } = await supabase
      .from('chat_messages')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (allMsgsError) {
      console.warn('Could not fetch messages for sessions:', allMsgsError);
    }

    const messagesBySession = new Map<string, ChatMessage[]>();
    for (const msg of allMessages || []) {
      if (!messagesBySession.has(msg.session_id)) {
        messagesBySession.set(msg.session_id, []);
      }
      messagesBySession.get(msg.session_id)!.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources || [],
        created_at: msg.created_at,
      });
    }

    const result: ChatSession[] = sessionList.map((s) => ({
      id: s.id,
      user_id: s.user_id,
      subject_id: s.subject_id,
      messages: messagesBySession.get(s.id) || [],
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
