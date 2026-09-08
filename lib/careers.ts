import { createClient } from './supabase/client';

export type JobRole = {
  id: string;
  title: string;
  is_open: boolean;
  sort_order: number;
};

export type JobApplication = {
  id: string;
  role_id: string;
  role_title: string;
  name: string;
  email: string;
  phone: string;
  cover_letter: string;
  cv_path: string;
  cv_filename: string;
  created_at: string;
};

const CV_BUCKET = 'cvs';
export const APPLIED_STORAGE_PREFIX = 'careers_applied_';

export async function fetchOpenRoles(): Promise<JobRole[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_roles')
    .select('id, title, is_open, sort_order')
    .eq('is_open', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllRoles(): Promise<JobRole[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_roles')
    .select('id, title, is_open, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function setRoleOpen(id: string, isOpen: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('job_roles')
    .update({ is_open: isOpen, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchApplications(): Promise<JobApplication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCvSignedUrl(cvPath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(cvPath, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

export type SubmitApplicationInput = {
  roleId: string;
  roleTitle: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvFile: File;
};

export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<void> {
  const supabase = createClient();

  const safeName = input.cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const cvPath = `${input.roleId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(cvPath, input.cvFile, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('job_applications').insert({
    role_id: input.roleId,
    role_title: input.roleTitle,
    name: input.name,
    email: input.email,
    phone: input.phone,
    cover_letter: input.coverLetter,
    cv_path: cvPath,
    cv_filename: input.cvFile.name,
  });
  if (insertError) throw insertError;
}

export function hasAppliedLocally(roleId: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(APPLIED_STORAGE_PREFIX + roleId) === '1';
}

export function markAppliedLocally(roleId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APPLIED_STORAGE_PREFIX + roleId, '1');
}