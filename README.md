# GapFinder AI

> **AI-Powered Personalized Learning & Knowledge Gap Detection Platform**

![GapFinder AI](https://img.shields.io/badge/GapFinder-AI-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-000?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e?style=for-the-badge&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLM-f55036?style=for-the-badge)

---

## 🎯 Overview

GapFinder AI is an intelligent educational platform that identifies what students **don't understand**. Unlike traditional learning tools, GapFinder uses a genuine **RAG (Retrieval-Augmented Generation)** architecture to:

1. **Upload** syllabus, notes, textbooks, and past papers
2. **Extract** content and build a structured topic map
3. **Generate** diagnostic quizzes grounded in your study materials
4. **Evaluate** answers with detailed explanations and source citations
5. **Detect** knowledge gaps (Weak / Medium / Strong classification)
6. **Create** personalized revision plans that adapt to your progress
7. **Track** improvement over time with interactive analytics

### Core Workflow
```
UPLOAD → EXTRACT → BUILD TOPIC MAP → GENERATE QUIZ → EVALUATE 
→ DETECT GAPS → CREATE REVISION PLAN → RE-TEST → UPDATE PROGRESS
```

---

## 🔑 Demo Credentials

### 1. Student Account
- **Email:** `demo@gapfinder.ai`
- **Password:** `GapFinder@2026`
- **Permissions:** Direct document upload, auto-extracted sections, diagnostic quiz taking, knowledge gap radar, Groq AI tutor, and 3-day adaptive revision schedule.

### 2. Admin / Academic Supervisor Account
- **Email:** `admin@gapfinder.ai`
- **Password:** `Admin@2026`
- **Permissions:** Executive cohort telemetry, individual student monitoring (total platform study time, diagnostic accuracy, diagnosed blindspots), full quiz submission score drill-down, and chronological device security login audit trail.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js 14)                  │
│  Landing · Auth · Dashboard · Quiz · Analytics         │
│  Tailwind CSS + shadcn/ui + Recharts + Lucide          │
├───────────────────────────────────────────────────────┤
│               NEXT.JS API ROUTES                       │
│  /api/upload · /api/quiz · /api/evaluate · /api/chat   │
├───────────────────────────────────────────────────────┤
│                  RAG PIPELINE                          │
│  PDF Extract → Chunk → Embed → Store → Retrieve        │
├──────────────┬──────────────┬─────────────────────────┤
│  Supabase    │  pgvector    │  Groq LLM               │
│  Auth + DB   │  Embeddings  │  Llama 3.3 70B          │
└──────────────┴──────────────┴─────────────────────────┘
```

### RAG Pipeline Detail

1. **Document Processing**: PDF text extraction via `pdf-parse`, text cleaning, smart chunking (500 chars, 100 overlap)
2. **Embedding**: Sentence-Transformers `all-MiniLM-L6-v2` via Hugging Face Inference API (384-dim vectors)
3. **Vector Storage**: Supabase PostgreSQL with `pgvector` extension
4. **Retrieval**: Cosine similarity search via `match_document_chunks` RPC function
5. **Generation**: Groq API with Llama 3.3 70B, context-grounded prompts with source citations
6. **Grounding**: All AI responses strictly reference uploaded materials with citations

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **Charts** | Recharts |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Supabase Auth |
| **LLM** | Groq API (Llama 3.3 70B Versatile) |
| **Embeddings** | Hugging Face Inference API (MiniLM-L6-v2) |
| **Document Processing** | pdf-parse |
| **Deployment** | Vercel |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Groq API key (free tier available)
- Hugging Face API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/gapfinder-ai.git
cd gapfinder-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your_groq_key
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your_key
```

### 4. Database Setup

1. Go to your Supabase project → **SQL Editor**
2. Copy the entire contents of `database/migration.sql`
3. Run the SQL script
4. Verify all tables are created under the `public` schema

### 5. Create Demo Account

After setting up the database, create the demo account:
1. Go to Supabase → **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Email: `demo@gapfinder.ai`, Password: `GapFinder@2026`
4. Alternatively, register through the app's registration page

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
gapfinder-ai/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # All dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── upload/       # Material upload
│   │   ├── subjects/     # Subject management
│   │   ├── topics/       # Topic map viewer
│   │   ├── quiz/         # Quiz generation & taking
│   │   ├── gaps/         # Knowledge gap analysis
│   │   ├── revision/     # Revision planner
│   │   ├── assistant/    # AI chat assistant
│   │   ├── analytics/    # Progress analytics
│   │   └── profile/      # User profile
│   ├── api/              # API route handlers
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── shared/           # Shared components
│   ├── landing/          # Landing page components
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── supabase/         # Supabase client config
│   ├── rag/              # RAG pipeline
│   │   ├── pipeline.ts   # Main orchestrator
│   │   ├── retriever.ts  # Vector search
│   │   ├── generator.ts  # Groq LLM integration
│   │   └── prompts.ts    # Prompt templates
│   ├── document-processor.ts  # PDF extraction & chunking
│   ├── embeddings.ts     # Embedding generation
│   ├── gap-analyzer.ts   # Knowledge gap engine
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── database/
│   └── migration.sql     # Database schema
├── public/               # Static assets
└── middleware.ts          # Auth middleware
```

---

## ✨ Features

### 📚 Material Upload
- Upload PDF and TXT study materials
- Automatic text extraction and processing
- Smart document chunking with metadata preservation
- Support for syllabus, textbooks, notes, and question papers

### 🧠 RAG-Powered Quiz Generation
- Questions generated from YOUR uploaded materials
- Every question includes source citations (document, page, section)
- Multiple quiz types: Quick, Topic-wise, Chapter-wise, Full Diagnostic
- Configurable difficulty levels

### 🎯 Knowledge Gap Detection
- **RED (Weak)**: Below 50% accuracy – needs immediate attention
- **YELLOW (Medium)**: 50-79% accuracy – partial understanding
- **GREEN (Strong)**: 80%+ accuracy – well understood
- Misconception identification
- Actionable recommendations per topic

### 📅 Personalized Revision Plans
- AI-generated day-by-day study schedule
- Prioritizes weak topics
- Adapts when new quiz results come in
- Track task completion

### 💬 AI Topic Assistant
- Ask questions about your study materials
- Answers grounded in uploaded content only
- Source citations with every response
- Conversation history

### 📊 Progress Analytics
- Performance over time charts
- Subject-wise and topic-wise accuracy
- Knowledge gap reduction tracking
- Quiz history and trends

---

## 🔒 Security

- Server-side API key protection (never exposed to frontend)
- Supabase Row Level Security (RLS) on all tables
- Authentication required for all dashboard routes
- Input validation on all API endpoints
- File upload type and size validation
- Environment variables for all secrets

---

## 📄 API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subjects` | GET/POST | List/create subjects |
| `/api/upload` | POST | Upload and process documents |
| `/api/documents` | GET/DELETE | List/delete documents |
| `/api/topics` | GET/POST | List/add topics |
| `/api/topics/generate` | POST | AI topic extraction |
| `/api/quiz/generate` | POST | Generate diagnostic quiz |
| `/api/quiz` | GET | List quizzes |
| `/api/quiz/[id]` | GET/PUT | Get/update quiz |
| `/api/quiz/evaluate` | POST | Submit and evaluate answers |
| `/api/gaps/analyze` | GET | Knowledge gap analysis |
| `/api/revision/generate` | POST | Generate revision plan |
| `/api/revision` | GET/PUT | Get plan/update tasks |
| `/api/chat` | POST | AI topic assistant |
| `/api/chat/history` | GET | Chat history |
| `/api/analytics` | GET | Progress analytics |
| `/api/profile` | GET/PUT | User profile |

---

## 🏆 Built For

**Hackathon PS 2026** – AI-Powered Personalized Learning and Knowledge Gap Detection Platform

---

## 📜 License

MIT License – See [LICENSE](LICENSE) for details.
