import { createClient } from './supabase/client';
import type { LeaveRequest, LeaveRequestInput, LeaveStatus, Staff } from './types';

export function calculateLeaveDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0; // inclusive of both start and end date
}

export async function submitLeaveRequest(
  staff: Staff,
  input: LeaveRequestInput,
): Promise<LeaveRequest> {
  const supabase = createClient();
  const days = calculateLeaveDays(input.start_date, input.end_date);

  let documentUrl: string | null = null;
  if (input.document) {
    const ext = input.document.name.split('.').pop();
    const path = `${staff.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('leave-documents')
      .upload(path, input.document);
    if (uploadError) throw uploadError;
    documentUrl = path;
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      staff_code: staff.staff_id,
      staff_email: staff.email,
      department: staff.department,
      outlet: staff.outlet,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      days,
      reason: input.reason.trim(),
      document_url: documentUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as LeaveRequest;
}

export async function fetchLeaveRequestsForStaff(staffId: string): Promise<LeaveRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('staff_id', staffId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaveRequest[];
}

export async function fetchAllLeaveRequests(): Promise<LeaveRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaveRequest[];
}

export async function updateLeaveStatus(
  id: string,
  status: LeaveStatus,
): Promise<LeaveRequest> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: userData.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as LeaveRequest;
}

export async function getLeaveDocumentUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('leave-documents')
    .createSignedUrl(path, 60 * 10); // 10-minute link
  if (error) return null;
  return data.signedUrl;
}