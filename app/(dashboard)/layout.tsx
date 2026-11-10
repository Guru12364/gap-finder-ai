'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Brain, Bell, Search, Sparkles } from 'lucide-react';
import { Sidebar, navItems } from '@/components/dashboard/sidebar';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser(profile);
            return;
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split('@')[0] ||
                'Student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            return;
          }
        }

        // Check fallback session in cookies / localStorage
        if (typeof window !== 'undefined') {
          const cookieMatch = document.cookie
            .split('; ')
            .find((row) => row.startsWith('gapfinder_auth='));
          let savedUser = null;

          if (cookieMatch) {
            try {
              savedUser = JSON.parse(decodeURIComponent(cookieMatch.split('=')[1]));
            } catch (e) {
              console.warn(e);
            }
          }

          if (!savedUser && window.localStorage) {
            const raw = window.localStorage.getItem('gapfinder_user');
            if (raw) {
              try {
                savedUser = JSON.parse(raw);
              } catch (e) {
                console.warn(e);
              }
            }
          }

          if (savedUser) {
            setUser({
              id: savedUser.id || 'demo-user',
              email: savedUser.email || 'demo@gapfinder.ai',
              full_name: savedUser.full_name || 'Demo Student',
              role: savedUser.role || 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            return;
          }
        }

        // Default student fallback
        setUser({
          id: 'demo-student',
          email: 'demo@gapfinder.ai',
          full_name: 'Alex Rivera (Demo Student)',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    }

    loadUser();
  }, [supabase]);

  // Current page title from navItems
  const currentNav = navItems.find((item) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname?.startsWith(item.href)
  );
  const pageTitle = currentNav?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-navy-950 text-gray-100 flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Decorative ambient gradients */}
      <div className="fixed top-0 left-64 right-0 h-96 bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent pointer-events-none -z-10" />
      <div className="fixed -top-40 right-10 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 h-96 w-96 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none -z-10" />

      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-navy-950/80 px-4 md:px-8 backdrop-blur-xl">
          {/* Left section: Mobile menu + Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-gray-300 hover:bg-white/[0.08] hover:text-white lg:hidden transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-navy-950">
                  <Brain className="h-3.5 w-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-white text-sm">GapFinder AI</span>
            </div>

            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right section: Quick actions & User Pill */}
          <div className="flex items-center gap-3">
            <Link
              href="/quiz"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Quick Diagnostic
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-inner">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user?.full_name || 'Student'}
                </p>
                <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                  {user?.email || 'Learner'}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
