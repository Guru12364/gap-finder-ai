'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);

    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;

    if (!targetEmail || !targetPassword) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const isDemo = customEmail !== undefined;
      if (isDemo) {
        setDemoLoading(true);
      } else {
        setLoading(true);
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data?.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during sign in.');
      }
    } finally {
      setLoading(false);
      setDemoLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@gapfinder.ai';
    const demoPass = 'GapFinder@2026';
    setEmail(demoEmail);
    setPassword(demoPass);
    await handleSignIn(undefined, demoEmail, demoPass);
  };

  return (
    <div className="glass-card border border-white/[0.08] p-7 sm:p-9 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Decorative top accent gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

      {/* Header section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3 text-cyan-400">
          <Compass className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
          Welcome back
        </h1>
        <p className="text-sm text-gray-400">
          Sign in to analyze your study materials &amp; close learning gaps
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">{error}</div>
        </div>
      )}

      {/* Login form */}
      <form onSubmit={(e) => handleSignIn(e)} className="space-y-4">
        {/* Email input */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-wider text-gray-300"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              disabled={loading || demoLoading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all duration-200 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-gray-300"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading || demoLoading}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || demoLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg shadow-indigo-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-navy-950/80 text-gray-400">or try without account</span>
        </div>
      </div>

      {/* Demo login button */}
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading || demoLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-medium text-sm text-cyan-300 bg-cyan-500/[0.08] border border-cyan-500/25 hover:bg-cyan-500/[0.15] hover:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
      >
        {demoLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Logging in as Demo User...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Quick Demo Login</span>
            <span className="text-[11px] text-gray-400 group-hover:text-cyan-200">
              (demo@gapfinder.ai)
            </span>
          </>
        )}
      </button>

      {/* Link to Register */}
      <div className="mt-7 text-center">
        <p className="text-xs text-gray-400">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
