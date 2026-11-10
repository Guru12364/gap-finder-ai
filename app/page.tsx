'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Upload,
  ClipboardCheck,
  Target,
  Calendar,
  MessageSquare,
  BarChart3,
  GitBranch,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'gaps'>('overview');

  return (
    <div className="min-h-screen bg-navy-950 text-gray-100 selection:bg-indigo-500/30 selection:text-white relative overflow-hidden font-sans">
      {/* Background Subtle Grid & Ambient Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Floating gradient orbs */}
        <div className="absolute -top-32 left-1/4 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-transparent blur-3xl animate-pulse" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-cyan-500/15 via-indigo-600/10 to-transparent blur-3xl" />
        <div className="absolute top-[65%] -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-700/15 via-indigo-900/20 to-transparent blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-[450px] w-[450px] rounded-full bg-gradient-to-t from-cyan-600/10 via-purple-600/10 to-transparent blur-3xl" />
      </div>

      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-navy-950">
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-white">
                GapFinder
              </span>
              <span className="ml-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#preview"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Dashboard
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              About
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/[0.05]"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-0 font-medium"
              >
                Get Started Free
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-300 hover:bg-white/[0.05] md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-navy-950/95 px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/[0.05]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/[0.05]"
            >
              How It Works
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/[0.05]"
            >
              Dashboard
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/[0.05]"
            >
              About
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/login?tab=register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>Next-Gen RAG Knowledge Diagnostic Engine</span>
            <ChevronRight className="h-3 w-3 text-indigo-400" />
          </div>

          {/* Main Headings */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] text-balance">
            Discover What You{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Don&apos;t Know.
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
              Master What Matters.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed text-balance">
            Stop studying what you already know. Upload your textbooks, notes, and syllabi.
            GapFinder AI extracts core concepts, diagnoses hidden knowledge blindspots with
            adaptive quizzes, and generates laser-targeted revision plans.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login?tab=register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base px-8 py-6 rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#preview" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-gray-200 hover:text-white px-7 py-6 rounded-xl backdrop-blur-md"
              >
                <Play className="mr-2 h-4 w-4 text-cyan-400 fill-cyan-400" />
                Explore Live Demo
              </Button>
            </a>
          </div>

          {/* Social Proof Mini Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>100% Citation Grounded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-400" />
              <span>Zero-Hallucination RAG</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Bar */}
      <section className="relative py-12 border-y border-white/[0.06] bg-navy-900/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                10,000+
              </p>
              <p className="mt-2 text-sm text-gray-400 font-medium">
                Topics Analyzed
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-tight">
                98.4%
              </p>
              <p className="mt-2 text-sm text-gray-400 font-medium">
                Gap Detection Accuracy
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                3.5x
              </p>
              <p className="mt-2 text-sm text-gray-400 font-medium">
                Faster Exam Preparation
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                50,000+
              </p>
              <p className="mt-2 text-sm text-gray-400 font-medium">
                Diagnostic Questions Run
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Simple 4-Step Process
            </h2>
            <p className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              How GapFinder AI Works
            </p>
            <p className="mt-4 text-base text-gray-400">
              From raw course documents to targeted mastery in minutes through automated
              knowledge extraction and diagnostic evaluation.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="glass-card p-6 relative flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-black text-white/20">01</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Materials</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Upload your syllabus, lecture slides, textbooks, or handwritten notes in PDF format.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] text-xs text-indigo-400 font-medium flex items-center gap-1">
                PDF & Docs Supported <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-6 relative flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-black text-white/20">02</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Topic Mapping</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Our LLM parses and deconstructs your documents into granular concepts, hierarchies, and learning prerequisites.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] text-xs text-purple-400 font-medium flex items-center gap-1">
                Automatic Knowledge Graph <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6 relative flex flex-col justify-between group hover:border-cyan-500/30 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-black text-white/20">03</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Diagnostic Quiz</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Take adaptive, RAG-grounded quizzes with real citation references back to page numbers in your texts.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] text-xs text-cyan-400 font-medium flex items-center gap-1">
                Precision Questioning <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="glass-card p-6 relative flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Target className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-black text-white/20">04</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gap Detection & Plan</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Get a crystal-clear diagnosis of weak vs. strong areas, root misconceptions, and an actionable revision calendar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] text-xs text-emerald-400 font-medium flex items-center gap-1">
                Personalized Schedule <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Section */}
      <section id="features" className="relative py-24 border-t border-white/[0.06] bg-navy-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Engineered for Student Mastery
            </h2>
            <p className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Powerful Features
            </p>
            <p className="mt-4 text-base text-gray-400">
              Everything you need to turn vast study syllabi into focused, high-yield study sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                RAG-Powered Quiz Generation
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Generates rigorous conceptual questions strictly verified against your course documents. Every question includes exact source page citations and detailed solution breakdowns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 group-hover:scale-105 transition-transform">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Knowledge Gap Detection
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Automatically identifies whether you are weak, medium, or strong in each topic. Explains the exact conceptual misconception causing errors and prescribes targeted remedies.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6 group-hover:scale-105 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Personalized Revision Plans
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Input your upcoming exam date and available daily study hours. The planner schedules high-priority weak topics first with spaced repetition intervals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                AI Topic Assistant
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Stuck on a tricky concept? Chat with a specialized tutor that quotes directly from your uploaded materials without hallucinating outside theories.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-6 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Progress Analytics
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Visualize your learning trajectory with accuracy curves, topic mastery distribution, and historical score improvements across all subjects.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card-hover p-8 rounded-2xl relative group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 group-hover:scale-105 transition-transform">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Smart Topic Mapping
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                See your entire syllabus structured into chapters and interconnected topics. Instantly spot unassessed areas before you walk into the exam hall.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dashboard Preview Section */}
      <section id="preview" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Interactive Workspace
            </h2>
            <p className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Beautiful Analytics Dashboard
            </p>
            <p className="mt-4 text-base text-gray-400">
              A command center tailored for focused studying with live metrics, gap alerts, and syllabus mastery tracking.
            </p>
          </div>

          {/* Interactive Mockup Container */}
          <div className="rounded-2xl p-1 sm:p-2 bg-gradient-to-b from-indigo-500/30 via-purple-500/10 to-transparent shadow-2xl">
            <div className="rounded-xl border border-white/[0.08] bg-navy-950/90 backdrop-blur-2xl p-4 sm:p-8 overflow-hidden">
              {/* Mockup Window Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-gray-400">
                    gapfinder.ai/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
                    Live Session Preview
                  </span>
                </div>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="space-y-6">
                {/* Mock Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4">
                    <p className="text-xs text-gray-400">Enrolled Subjects</p>
                    <p className="text-2xl font-bold text-white mt-1">4</p>
                    <span className="text-[11px] text-emerald-400">32 documents parsed</span>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs text-gray-400">Quizzes Attempted</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">18</p>
                    <span className="text-[11px] text-gray-400">142 questions answered</span>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs text-gray-400">Diagnostic Accuracy</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">76.8%</p>
                    <span className="text-[11px] text-emerald-400">+12% this week</span>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs text-gray-400">Identified Gaps</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">5 Topics</p>
                    <span className="text-[11px] text-rose-400">High priority review</span>
                  </div>
                </div>

                {/* Mock Charts & Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Subject Bar Visualizer */}
                  <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-white">
                        Subject Performance Breakdown
                      </h4>
                      <span className="text-xs text-gray-400">Target: 85%</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">Advanced Algorithms</span>
                          <span className="text-emerald-400 font-bold">88%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[88%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">Database Systems</span>
                          <span className="text-indigo-400 font-bold">78%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[78%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">Computer Networks</span>
                          <span className="text-yellow-400 font-bold">62%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full w-[62%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">Operating Systems</span>
                          <span className="text-rose-400 font-bold">48% (Weak)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full w-[48%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Revision Alert */}
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <h4 className="text-sm font-semibold text-white">Critical Gap Alert</h4>
                      </div>
                      <p className="text-xs text-gray-300 mb-3">
                        Topic: <strong className="text-white">Deadlock Prevention & Avoidance</strong>
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
                        &quot;Confused Resource Allocation Graph cycle detection with multi-instance safety conditions.&quot;
                      </p>
                    </div>

                    <Link href="/login?tab=register" className="mt-4">
                      <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                        Review Topic Citations
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action (CTA) Section */}
      <section className="relative py-20 border-t border-white/[0.06] overflow-hidden">
        {/* Glow behind CTA */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-purple-900/20 to-navy-950 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-navy-900/60 p-8 sm:p-14 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Discover Your Knowledge Gaps?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Start your personalized learning journey today. Upload your course documents and test your genuine understanding in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?tab=register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold px-8 py-6 rounded-xl shadow-xl shadow-indigo-600/30"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/10 hover:bg-white/[0.06] text-gray-200 px-8 py-6 rounded-xl"
                >
                  Sign In to Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-white/[0.06] bg-navy-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Tagline */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-navy-950">
                    <Brain className="h-4 w-4 text-cyan-400" />
                  </div>
                </div>
                <span className="text-base font-bold text-white">GapFinder AI</span>
              </div>
              <span className="hidden sm:inline text-gray-600">•</span>
              <p className="text-xs text-gray-400">
                Precision Knowledge Gap Detection & RAG Mastery
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#preview" className="hover:text-white transition-colors">
                Preview
              </a>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <p>© {new Date().getFullYear()} GapFinder AI. All rights reserved.</p>
            <p className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
              Built for <span className="text-indigo-400 font-semibold">Hackathon PS 2026</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
