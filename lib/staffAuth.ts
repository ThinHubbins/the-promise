import { createClient } from './supabase/client';
import type { Staff } from './types';

export async function staffSignIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function staffSignUp(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // If email confirmation is required, signUp returns a user but NO session.
  return { user: data.user, session: data.session };
}

export async function staffSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentAuthUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Case-insensitive exact match against the staff table
export async function getStaffByEmail(email: string): Promise<Staff | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    console.error('Staff lookup failed', error);
    return null;
  }
  return (data as Staff) ?? null;
}