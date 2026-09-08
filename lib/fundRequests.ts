import { createClient } from './supabase/client';
import type { FundRequest, FundRequestInput, FundRequestStatus, Staff } from './types';

export async function submitFundRequest(
  staff: Staff,
  input: FundRequestInput,
): Promise<FundRequest> {
  const supabase = createClient();
  const amount = parseFloat(input.amount);

  let documentUrl: string | null = null;
  if (input.document) {
    const ext = input.document.name.split('.').pop();
    const path = `${staff.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('fund-request-documents')
      .upload(path, input.document);
    if (uploadError) throw uploadError;
    documentUrl = path;
  }

  const { data, error } = await supabase
    .from('fund_requests')
    .insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      staff_code: staff.staff_id,
      outlet: staff.outlet,
      request_type: input.request_type,
      amount,
      reason: input.reason.trim(),
      document_url: documentUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as FundRequest;
}

export async function fetchFundRequestsForStaff(staffId: string): Promise<FundRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fund_requests')
    .select('*')
    .eq('staff_id', staffId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FundRequest[];
}

// Admin/Finance only — relies on RLS to block anyone without an admins row
export async function fetchAllFundRequests(): Promise<FundRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fund_requests')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FundRequest[];
}

export async function updateFundRequestStatus(
  id: string,
  status: FundRequestStatus,
): Promise<FundRequest> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('fund_requests')
    .update({
      status,
      reviewed_by: userData.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FundRequest;
}

export async function getFundRequestDocumentUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('fund-request-documents')
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}