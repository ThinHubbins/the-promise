import { createClient } from './supabase/client';
import type { AttendanceRecord, OpenAttendanceWithStaff } from './types';

export async function fetchAttendanceForStaff(
  staffId: string,
  limit = 30,
): Promise<AttendanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', staffId)
    .order('clock_in', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

// Every currently-open session (staff_id only)
export async function fetchOpenAttendance(): Promise<AttendanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .is('clock_out', null);
  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

// Every currently-open session, joined with the staff row (for the dashboard)
export async function fetchOpenAttendanceWithStaff(): Promise<OpenAttendanceWithStaff[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, staff(*)')
    .is('clock_out', null)
    .order('clock_in', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OpenAttendanceWithStaff[];
}

// Fires `onChange` with the affected staff_id on any insert/update to attendance.
export function subscribeToAttendance(onChange: (staffId: string | null) => void) {
  const supabase = createClient();
  const channel = supabase
    .channel('attendance-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance' },
      (payload) => {
        const staffId =
          (payload.new as { staff_id?: string } | null)?.staff_id ??
          (payload.old as { staff_id?: string } | null)?.staff_id ??
          null;
        onChange(staffId);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}