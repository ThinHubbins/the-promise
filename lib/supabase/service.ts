// lib/supabase/service.ts
//
// A service-role Supabase client for server-only contexts with no user
// session — webhooks, cron jobs, admin scripts. This bypasses Row Level
// Security entirely, so SUPABASE_SERVICE_ROLE_KEY must never be exposed
// to the client and this file must never be imported from client components.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or service role key in env vars');
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}