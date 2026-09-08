import { createClient } from './supabase/client';
import type { PayrollPayment, PayrollStatus, Staff, StaffPayrollInfo } from './types';

const CYCLE_DAYS = 30;
const WARNING_DAYS = 25;

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function fetchPayrollPayments(staffId?: string): Promise<PayrollPayment[]> {
  const supabase = createClient();
  let query = supabase
    .from('payroll_payments')
    .select('*')
    .order('period_end', { ascending: false });
  if (staffId) query = query.eq('staff_id', staffId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PayrollPayment[];
}

async function fetchLatestPaymentMap(): Promise<Map<string, PayrollPayment>> {
  const payments = await fetchPayrollPayments();
  const map = new Map<string, PayrollPayment>();
  for (const p of payments) {
    const existing = map.get(p.staff_id);
    if (!existing || new Date(p.period_end) > new Date(existing.period_end)) {
      map.set(p.staff_id, p);
    }
  }
  return map;
}

export function computeStatus(daysIntoCycle: number): PayrollStatus {
  if (daysIntoCycle >= CYCLE_DAYS) return 'ready';
  if (daysIntoCycle >= WARNING_DAYS) return 'almost_due';
  return 'in_progress';
}

export async function fetchPayrollOverview(staffList: Staff[]): Promise<StaffPayrollInfo[]> {
  const latestMap = await fetchLatestPaymentMap();
  const today = new Date();

  return staffList.map((staff) => {
    const lastPayment = latestMap.get(staff.id) ?? null;
    const cycleStartDate = lastPayment
      ? new Date(lastPayment.period_end)
      : new Date(staff.hire_date);
    const daysIntoCycle = Math.max(0, daysBetween(cycleStartDate, today));
    const status = computeStatus(daysIntoCycle);
    const nextDueDate = addDays(cycleStartDate, CYCLE_DAYS);

    return {
      staff,
      cycleStart: cycleStartDate.toISOString().slice(0, 10),
      daysIntoCycle,
      status,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
      lastPayment,
    };
  });
}

export async function markStaffPaid(info: StaffPayrollInfo): Promise<PayrollPayment> {
  if (info.status !== 'ready') {
    throw new Error('This staff member has not reached the 30-day payment cycle yet.');
  }
  if (!info.staff.salary) {
    throw new Error('This staff member has no salary set. Add a salary before paying.');
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const periodEnd = new Date();
  const { data, error } = await supabase
    .from('payroll_payments')
    .insert({
      staff_id: info.staff.id,
      period_start: info.cycleStart,
      period_end: periodEnd.toISOString().slice(0, 10),
      amount: info.staff.salary,
      paid_by: userData.user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PayrollPayment;
}