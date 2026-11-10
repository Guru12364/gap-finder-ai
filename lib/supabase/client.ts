import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvebpupeacjgwvcsjxbk.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rzaHhCsPvSxHNYe7TID_vg_461uEgpN';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
