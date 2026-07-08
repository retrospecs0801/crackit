import { createBrowserClient } from '@supabase/ssr';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://bfnkxytzoqyardpvfyor.supabase.co';
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
