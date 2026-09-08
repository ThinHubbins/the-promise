import { createClient } from './supabase/client';
import { getCurrentUser } from './admin';

export { getCurrentUser };

export async function hrSignIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function hrSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Verifies the authenticated user is the approved HR account.
 * Checks both user_id AND email against `hr_accounts` so only that
 * specific HR account passes — admins, staff, and customers are rejected.
 */
export async function checkIsHR(
  userId: string,
  email: string | null
): Promise<boolean> {
  if (!email) return false;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('hr_accounts')
    .select('user_id, email')
    .eq('user_id', userId)
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error('HR check failed', error);
    return false;
  }
  return !!data;
}