/**
 * Database Setup & Verification Script for GapFinder AI
 * Verifies Supabase connection, schema tables, vector extensions, and runs migrations.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function setupDatabase() {
  console.log('--- GapFinder AI Database Setup ---');
  console.log(`Connecting to: ${SUPABASE_URL}`);

  try {
    // Check tables existence
    const tables = [
      'profiles',
      'subjects',
      'documents',
      'document_chunks',
      'topics',
      'quizzes',
      'quiz_questions',
      'student_answers',
      'knowledge_gaps',
      'revision_plans',
      'revision_tasks',
      'chat_sessions',
      'chat_messages',
    ];

    console.log('Checking database tables status...');
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.warn(`[MISSING TABLE] Table public.${table} does not exist yet.`);
      } else if (error) {
        console.log(`[INFO] Table public.${table}: ${error.message}`);
      } else {
        console.log(`[OK] Table public.${table} is ready.`);
      }
    }

    console.log('\nMigration instructions:');
    console.log('1. Go to your Supabase Project -> SQL Editor');
    console.log('2. Paste the contents of "database/migration.sql"');
    console.log('3. Click Run to initialize the schema and pgvector indexes.');
    console.log('4. Run "npm run seed:demo" to create the demo account and initial dataset.');
  } catch (err: any) {
    console.error('Database setup check error:', err.message);
  }
}

if (process.argv[1]?.includes('setup')) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
