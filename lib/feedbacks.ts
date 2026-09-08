import { createClient } from './supabase/client';
import type { Feedback } from './types';

function fromRow(row: any): Feedback {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function submitFeedback(input: {
  userId: string | null;
  customerName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('feedbacks').insert({
    user_id: input.userId,
    customer_name: input.customerName,
    rating: input.rating,
    comment: input.comment,
  });

  if (error) throw error;
}

export async function fetchApprovedFeedbacks(): Promise<Feedback[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function fetchAllFeedbacks(): Promise<Feedback[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateFeedbackStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('feedbacks').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteFeedback(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('feedbacks').delete().eq('id', id);
  if (error) throw error;
}