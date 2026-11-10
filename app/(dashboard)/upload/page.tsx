'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  X,
  ChevronDown,
  Sparkles,
  File,
  BookOpen,
  StickyNote,
  ClipboardList,
  MoreHorizontal,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  document_type: string;
  file_size: number;
  status: string;
  created_at: string;
  subject_id: string;
}

const DOCUMENT_TYPES = [
  { value: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { value: 'textbook', label: 'Textbook', icon: FileText },
  { value: 'notes', label: 'Notes', icon: StickyNote },
  { value: 'question_paper', label: 'Question Paper', icon: ClipboardList },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'processed':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'processing':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'failed':
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('textbook');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      const data = await res.json();
      setSubjects(data.subjects || data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, []);

  const fetchDocuments = useCallback(async (subjectId: string) => {
    try {
      const res = await fetch(`/api/documents?subject_id=${subjectId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data.documents || data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchSubjects();
      setIsLoading(false);
    };
    init();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchDocuments(selectedSubject);
    } else {
      setDocuments([]);
    }
  }, [selectedSubject, fetchDocuments]);

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    setIsCreatingSubject(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create subject');
      const data = await res.json();
      const newSubject = data.subject || data;
      setSubjects((prev) => [...prev, newSubject]);
      setSelectedSubject(newSubject.id);
      setNewSubjectName('');
      setShowNewSubject(false);
    } catch (err) {
      setError('Failed to create subject. Please try again.');
    } finally {
      setIsCreatingSubject(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!selectedSubject) {
      setError('Please select a subject first.');
      return;
    }
    if (files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 20MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', selectedSubject);
    formData.append('document_type', documentType);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      await fetchDocuments(selectedSubject);

      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 3000);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleUpload,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading,
  });

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
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
            <Upload className="w-6 h-6 text-indigo-400" />
          </div>
          Upload Materials
        </h1>
        <p className="text-gray-400 mt-2">
          Upload your study materials to generate topics and quizzes
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">File uploaded successfully!</span>
          <button
            onClick={() => router.push('/topics')}
            className="ml-auto text-sm font-medium px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
          >
            Generate Topics →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Selector */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Subject
            </label>
            {!showNewSubject ? (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  >
                    <option value="" className="bg-[#0d1326]">Choose a subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0d1326]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <button
                  onClick={() => setShowNewSubject(true)}
                  className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Enter subject name..."
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
                  autoFocus
                />
                <button
                  onClick={handleCreateSubject}
                  disabled={isCreatingSubject || !newSubjectName.trim()}
                  className="px-4 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isCreatingSubject ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowNewSubject(false);
                    setNewSubjectName('');
                  }}
                  className="px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Document Type Selector */}
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Document Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {DOCUMENT_TYPES.map((dt) => {
                const Icon = dt.icon;
                const isSelected = documentType === dt.value;
                return (
                  <button
                    key={dt.value}
                    onClick={() => setDocumentType(dt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{dt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${
              isDragActive && !isDragReject
                ? 'border-indigo-500/60 bg-indigo-500/10'
                : isDragReject
                ? 'border-red-500/60 bg-red-500/10'
                : 'border-white/[0.1] bg-white/[0.02] hover:border-indigo-500/30 hover:bg-white/[0.04]'
            } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${
                isDragActive
                  ? 'bg-indigo-500/20'
                  : 'bg-white/[0.04] group-hover:bg-indigo-500/10'
              }`}>
                <CloudUpload className={`w-10 h-10 transition-colors duration-300 ${
                  isDragActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'
                }`} />
              </div>
              {isDragReject ? (
                <>
                  <p className="text-red-400 font-medium">Unsupported file type</p>
                  <p className="text-red-400/60 text-sm mt-1">
                    Please upload .pdf, .txt, or .md files only
                  </p>
                </>
              ) : isDragActive ? (
                <p className="text-indigo-400 font-medium">Drop your file here...</p>
              ) : (
                <>
                  <p className="text-white font-medium">
                    Drag & drop your file here, or{' '}
                    <span className="text-indigo-400">browse</span>
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Supports PDF, TXT, and Markdown files up to 20MB
                  </p>
                </>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-x-6 bottom-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Uploading...</span>
                  <span className="text-sm text-indigo-400 font-medium">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Uploaded Documents */}
        <div className="space-y-6">
          <div className="p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Uploaded Files
              </h2>
              {documents.length > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {documents.length}
                </span>
              )}
            </div>

            {!selectedSubject ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-xl bg-white/[0.03] inline-block mb-3">
                  <BookOpen className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">Select a subject to view documents</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-xl bg-white/[0.03] inline-block mb-3">
                  <File className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No documents uploaded yet</p>
                <p className="text-gray-600 text-xs mt-1">Upload your first file above</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 flex-shrink-0">
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatFileSize(doc.file_size || 0)}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500 capitalize">{doc.document_type?.replace('_', ' ')}</span>
                      </div>
                      <span
                        className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      disabled={deletingId === doc.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      {deletingId === doc.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documents.length > 0 && (
              <button
                onClick={() => router.push('/topics')}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Generate Topics
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
