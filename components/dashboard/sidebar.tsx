'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Upload,
  BookOpen,
  GitBranch,
  ClipboardCheck,
  Target,
  Calendar,
  MessageSquare,
  BarChart3,
  User,
  LogOut,
  Brain,
  X,
  Sparkles,
} from 'lucide-react';

export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload', icon: Upload, label: 'Upload Materials' },
  { href: '/subjects', icon: BookOpen, label: 'My Subjects' },
  { href: '/topics', icon: GitBranch, label: 'Topic Map' },
  { href: '/quiz', icon: ClipboardCheck, label: 'Diagnostic Quiz' },
  { href: '/gaps', icon: Target, label: 'Gap Analysis', badge: 'AI' },
  { href: '/revision', icon: Calendar, label: 'Revision Planner' },
  { href: '/assistant', icon: MessageSquare, label: 'AI Topic Assistant' },
  { href: '/analytics', icon: BarChart3, label: 'Progress Analytics' },
  { href: '/profile', icon: User, label: 'Profile' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-white/[0.08] bg-navy-950/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Header / Brand */}
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
              onClick={() => {
                if (isOpen) onClose();
              }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-navy-950">
                  <Brain className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-base font-bold tracking-tight text-white">
                  GapFinder
                </span>
                <span className="ml-1.5 rounded bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                  AI
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/[0.05] hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
            <div className="px-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Main Menu
              </p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (isOpen) onClose();
                  }}
                  className={cn(
                    'group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/80 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-cyan-400'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      )}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {item.badge}
                    </span>
                  )}

                  {/* Active glowing indicator pill */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-cyan-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/[0.06] p-4">
          {/* Quick AI Pro Banner */}
          <div className="mb-3 rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.08] to-purple-500/[0.04] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                RAG Engine Active
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Personalized gap diagnostics enabled for uploaded courses.
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-red-400" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
