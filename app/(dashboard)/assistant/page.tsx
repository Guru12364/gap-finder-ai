'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Plus,
  BookOpen,
  ChevronDown,
  Bot,
  User,
  FileText,
  Clock,
  Loader2,
  Sparkles,
  AlertCircle,
  Upload,
  Hash,
  ExternalLink,
} from 'lucide-react';
import type { Subject, ChatMessage, ChatSession, SourceCitation } from '@/types';

interface SubjectOption {
  id: string;
  name: string;
  document_count?: number;
}

interface ChatResponse {
  message: ChatMessage;
  session_id: string;
  citations?: SourceCitation[];
}

interface MessageWithCitations extends ChatMessage {
  citations?: SourceCitation[];
}

export default function AssistantPage() {
  const router = useRouter();

  // State
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithCitations[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Fetch subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        setIsLoadingSubjects(true);
        const res = await fetch('/api/subjects');
        if (!res.ok) throw new Error('Failed to load subjects');
        const data = await res.json();
        setSubjects(data.subjects || data || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
      } finally {
        setIsLoadingSubjects(false);
      }
    }
    fetchSubjects();
  }, []);

  // Fetch sessions when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
      return;
    }

    async function fetchSessions() {
      try {
        setIsLoadingSessions(true);
        const res = await fetch(`/api/chat/history?subject_id=${selectedSubjectId}`);
        if (!res.ok) throw new Error('Failed to load chat history');
        const data = await res.json();
        setSessions(data.sessions || data || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    }
    fetchSessions();
    setMessages([]);
    setActiveSessionId(null);
  }, [selectedSubjectId]);

  // Load messages for a session
  async function loadSessionMessages(sessionId: string) {
    try {
      setIsLoadingMessages(true);
      setActiveSessionId(sessionId);
      const res = await fetch(`/api/chat/history?session_id=${sessionId}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoadingMessages(false);
    }
  }

  // Send message
  async function handleSendMessage() {
    if (!inputValue.trim() || !selectedSubjectId || isTyping) return;

    const userMessage: MessageWithCitations = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
      session_id: activeSessionId || '',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          message: userMessage.content,
          session_id: activeSessionId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to send message');
      }

      const data: ChatResponse = await res.json();

      // Update session id if new
      if (!activeSessionId && data.session_id) {
        setActiveSessionId(data.session_id);
        // Refresh sessions list
        const sessRes = await fetch(`/api/chat/history?subject_id=${selectedSubjectId}`);
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          setSessions(sessData.sessions || sessData || []);
        }
      }

      const assistantMessage: MessageWithCitations = {
        ...data.message,
        citations: data.citations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to get response');
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          created_at: new Date().toISOString(),
          session_id: activeSessionId || '',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // Handle new chat
  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  // Handle key press
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Format timestamp
  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Render simple markdown
  function renderMarkdown(text: string) {
    // Very basic markdown: bold, italic, code, code blocks
    let html = text
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-white/[0.04] rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono text-gray-300"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/[0.08] px-1.5 py-0.5 rounded text-cyan-400 text-sm font-mono">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return html;
  }

  // No subject selected state
  if (!isLoadingSubjects && !selectedSubjectId) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Topic Assistant</h1>
                <p className="text-sm text-gray-400">Ask questions about your study materials</p>
              </div>
            </div>
            {/* Subject selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Select a Subject</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {subjectDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-navy-800/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSubjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{subject.name}</span>
                    </button>
                  ))}
                  {subjects.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No subjects found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Select a Subject to Begin</h2>
            <p className="text-gray-400 mb-6">
              Choose a subject from the dropdown above to start chatting with the AI assistant about your study materials.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span>AI-powered answers from your uploaded documents</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Chat Sessions */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } flex-shrink-0 border-r border-white/[0.06] bg-white/[0.02] transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-white/[0.06]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSessionMessages(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  activeSessionId === session.id
                    ? 'bg-white/[0.08] border border-white/[0.12]'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-300 truncate font-medium">
                      {session.title || 'Untitled Chat'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-400 hover:text-white"
              >
                <Hash className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
                <p className="text-xs text-gray-400">
                  {selectedSubject ? `Studying: ${selectedSubject.name}` : 'Select a subject'}
                </p>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="max-w-[150px] truncate">{selectedSubject?.name || 'Select Subject'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {subjectDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#131a35]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSubjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        subject.id === selectedSubjectId
                          ? 'bg-indigo-500/10 text-indigo-300'
                          : 'text-gray-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{subject.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-gray-400">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg px-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Start a Conversation
                </h2>
                <p className="text-gray-400 mb-8">
                  Ask me anything about your {selectedSubject?.name || ''} study materials.
                  I&apos;ll find relevant information from your uploaded documents.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Explain the key concepts',
                    'Summarize the main topics',
                    'What are the important formulas?',
                    'Help me understand this topic',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="p-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-sm text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
                    >
                      <span className="text-indigo-400 mr-1">→</span> {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-gray-200'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed [&_pre]:bg-white/[0.04] [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-cyan-400"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className={`flex items-center gap-1 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-[11px] text-gray-600">{formatTime(msg.created_at)}</span>
                    </div>

                    {/* Source Citations */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 px-1">
                          <FileText className="w-3 h-3" />
                          Sources ({msg.citations.length})
                        </p>
                        {msg.citations.map((citation, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 hover:bg-white/[0.05] hover:border-white/[0.10] transition-all duration-300"
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-indigo-300 truncate">
                                  {citation.document_name || 'Document'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {citation.page_number && (
                                    <span className="text-[10px] text-gray-500">
                                      Page {citation.page_number}
                                    </span>
                                  )}
                                  {citation.section && (
                                    <span className="text-[10px] text-gray-500">
                                      • {citation.section}
                                    </span>
                                  )}
                                </div>
                                {citation.excerpt && (
                                  <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                                    &ldquo;{citation.excerpt}&rdquo;
                                  </p>
                                )}
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 justify-center py-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedSubject
                      ? `Ask about ${selectedSubject.name}...`
                      : 'Select a subject to start chatting...'
                  }
                  disabled={!selectedSubjectId || isTyping}
                  rows={1}
                  className="w-full px-4 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '44px';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !selectedSubjectId || isTyping}
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mt-2 text-center">
              AI responses are based on your uploaded study materials. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
