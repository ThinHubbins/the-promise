import { createClient } from './supabase/client';
import type { Staff, StaffInput, StaffStatus } from './types';

export async function fetchStaff(): Promise<Staff[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Staff[];
}

export async function addStaff(input: StaffInput): Promise<Staff> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('staff')
    .insert({
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      staff_id: input.staff_id.trim(),
      job_title: input.job_title.trim() || null,
      department: input.department.trim() || null,
      outlet: input.outlet.trim() || null,
      status: input.status,
      salary: input.salary ? Number(input.salary) : null,
      hire_date: input.hire_date || new Date().toISOString().slice(0, 10),
      created_by: userData.user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Staff;
}

export async function updateStaff(
  id: string,
  input: StaffInput,
): Promise<Staff> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff')
    .update({
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      staff_id: input.staff_id.trim(),
      job_title: input.job_title.trim() || null,
      department: input.department.trim() || null,
      outlet: input.outlet.trim() || null,
      status: input.status,
      salary: input.salary ? Number(input.salary) : null,
      hire_date: input.hire_date || undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Staff;
}

export async function setStaffStatus(
  id: string,
  status: StaffStatus,
): Promise<Staff> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Staff;
}