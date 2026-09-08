import { createClient } from './supabase/client'; // adjust path to match your project structure
import type { BankAccount, BankAccountInput } from './types';

export async function fetchBankAccountForStaff(staffId: string): Promise<BankAccount | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff_bank_accounts')
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle();

  if (error) throw error;
  return data as BankAccount | null;
}

export async function submitBankAccount(
  staffId: string,
  input: BankAccountInput,
): Promise<BankAccount> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff_bank_accounts')
    .upsert(
      {
        staff_id: staffId,
        bank_name: input.bank_name.trim(),
        account_number: input.account_number.trim(),
        account_name: input.account_name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'staff_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
}

export async function fetchBankAccountsForStaffIds(
  staffIds: string[],
): Promise<Record<string, BankAccount>> {
  if (staffIds.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from('staff_bank_accounts')
    .select('*')
    .in('staff_id', staffIds);

  if (error) throw error;
  const map: Record<string, BankAccount> = {};
  (data ?? []).forEach((row: any) => {
    map[row.staff_id] = row as BankAccount;
  });
  return map;
}