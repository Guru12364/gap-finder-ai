import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/providers/toast-provider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'GapFinder AI – Discover What You Don\'t Know',
  description:
    'AI-powered personalized learning platform that identifies knowledge gaps, generates diagnostic quizzes from your study materials, and creates personalized revision plans.',
  keywords: [
    'AI learning',
    'knowledge gap detection',
    'personalized learning',
    'study planner',
    'diagnostic quiz',
    'RAG',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
