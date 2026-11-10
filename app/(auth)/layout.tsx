import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-navy-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-[500px] h-[400px] bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-cyan-600/10 blur-[120px] rounded-full" />

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Navigation / Brand header */}
      <header className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-navy-950 rounded-[11px] flex items-center justify-center group-hover:bg-navy-900 transition-colors">
              <Compass className="w-5 h-5 text-cyan-400 transition-transform duration-500 group-hover:rotate-45" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-gray-300">
                GapFinder
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-indigo-500/20 text-cyan-400 border border-cyan-400/30">
                AI
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline-block">
              Discover What You Don&apos;t Know
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Diagnostic AI Learning Platform</span>
        </div>
      </header>

      {/* Main Centered Auth Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-500 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} GapFinder AI. All rights reserved.</p>
          <p className="text-gray-400">
            Powered by Retrieval-Augmented Generation &amp; Adaptive Diagnostics
          </p>
        </div>
      </footer>
    </div>
  );
}
