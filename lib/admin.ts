import { createClient } from './supabase/client';

export async function adminSignIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function adminSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('Admin check failed', error);
    return false;
  }
  return !!data;
}