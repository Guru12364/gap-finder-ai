'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Calendar,
  Save,
  Loader2,
  BookOpen,
  HelpCircle,
  Target,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Shield,
  Award,
  Sparkles,
} from 'lucide-react';
import type { UserProfile } from '@/types';

interface ProfileStats {
  total_subjects: number;
  total_quizzes: number;
  total_questions: number;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    total_subjects: 0,
    total_quizzes: 0,
    total_questions: 0,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Show toast
  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);
        setFullName(data.full_name || data.name || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
        showToast('Failed to load profile', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          total_subjects: data.total_subjects ?? data.subject_performance?.length ?? 0,
          total_quizzes: data.total_quizzes ?? 0,
          total_questions: data.total_questions ?? 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    fetchStats();
  }, []);

  // Save profile
  async function handleSave() {
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save profile');
      }

      const updated = await res.json();
      setProfile(updated);
      setFullName(updated.full_name || updated.name || fullName);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  // Format date
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Get initials
  function getInitials(name: string) {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.name || fullName || 'User';
  const email = profile?.email || '';
  const createdAt = profile?.created_at || '';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl transition-all duration-500 animate-in slide-in-from-top-2 fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          Profile Settings
        </h1>
        <p className="text-gray-400 mt-2">Manage your account information and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFMwIDguMDYgMCAxOHM4LjA2IDE4IDE4IDE4IDEwLTguMDYgMTgtMTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        </div>

        {/* Avatar & Info */}
        <div className="px-6 md:px-8 pb-8">
          {/* Avatar */}
          <div className="-mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end gap-5">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-28 h-28 rounded-2xl border-4 border-[#0a0e1a] object-cover shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl border-4 border-[#0a0e1a] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-white">
                    {getInitials(displayName)}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-emerald-500 border-2 border-[#0a0e1a] flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 sm:pb-1">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  Full Name
                </div>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!isEditing) setIsEditing(true);
                  }}
                  placeholder="Enter your full name"
                  className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Email Address
                </div>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-gray-400 cursor-not-allowed text-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Shield className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Email cannot be changed</p>
            </div>

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Account Created
                </div>
              </label>
              <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-gray-400 text-sm">
                {createdAt ? formatDate(createdAt) : 'Unknown'}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !isEditing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Account Statistics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Subjects */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-sm text-gray-400">Total Subjects</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_subjects}</p>
          </div>

          {/* Total Quizzes */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Quizzes Taken</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_quizzes}</p>
          </div>

          {/* Total Questions */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm text-gray-400">Questions Answered</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_questions}</p>
          </div>
        </div>
      </div>

      {/* Account Security Info */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Account Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email Verified</p>
                <p className="text-xs text-gray-500">Your email address has been verified</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full font-medium">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Award className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Account Type</p>
                <p className="text-xs text-gray-500">Your current account plan</p>
              </div>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full font-medium">
              Standard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
