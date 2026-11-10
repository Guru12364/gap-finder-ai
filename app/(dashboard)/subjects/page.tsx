'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  FileText,
  Brain,
  Calendar,
  ArrowRight,
  X,
  Sparkles,
  GraduationCap,
  FolderOpen,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';

interface Subject {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  topic_count?: number;
  created_at: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data.subjects || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create subject');
      const data = await res.json();
      const newSubject = data.subject || data;
      setSubjects((prev) => [...prev, newSubject]);
      setNewName('');
      setNewDescription('');
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const GRADIENT_VARIANTS = [
    'from-indigo-500/20 to-purple-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-amber-500/20 to-orange-500/20',
    'from-rose-500/20 to-red-500/20',
  ];

  const ICON_VARIANTS = [
    'text-indigo-400',
    'text-purple-400',
    'text-cyan-400',
    'text-emerald-400',
    'text-amber-400',
    'text-rose-400',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
              <GraduationCap className="w-6 h-6 text-purple-400" />
            </div>
            My Subjects
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your subjects and study materials
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-[#131a35] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                New Subject
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Mathematics, Physics..."
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description{' '}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this subject..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12 text-gray-600" />}
          title="No subjects yet"
          description="Create your first subject to start organizing your study materials and track your progress."
          action={
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Your First Subject
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => {
            const gradient = GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length];
            const iconColor = ICON_VARIANTS[index % ICON_VARIANTS.length];

            return (
              <button
                key={subject.id}
                onClick={() => router.push(`/topics?subject_id=${subject.id}`)}
                className="group text-left p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} border border-white/[0.06]`}>
                    <BookOpen className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {subject.name}
                </h3>
                {subject.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {subject.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs">{subject.document_count ?? 0} docs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Brain className="w-3.5 h-3.5" />
                    <span className="text-xs">{subject.topic_count ?? 0} topics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 ml-auto">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">{formatDate(subject.created_at)}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add New Card */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/[0.08] rounded-2xl hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all duration-300 min-h-[200px] group"
          >
            <div className="p-3 rounded-xl bg-white/[0.03] group-hover:bg-indigo-500/10 transition-all duration-300">
              <Plus className="w-6 h-6 text-gray-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            <span className="text-gray-500 group-hover:text-gray-400 text-sm font-medium mt-3 transition-colors">
              Add New Subject
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
