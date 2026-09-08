import { createClient } from './supabase/client';
import type { Address } from './types';

function fromRow(row: any): Address {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    isDefault: row.is_default,
  };
}

export async function fetchAddresses(): Promise<Address[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createAddress(
  userId: string,
  input: Omit<Address, 'id'>
): Promise<Address> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      label: input.label,
      full_name: input.fullName,
      phone: input.phone,
      address_line: input.addressLine,
      city: input.city,
      state: input.state,
      is_default: input.isDefault,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateAddress(
  id: string,
  input: Omit<Address, 'id'>
): Promise<Address> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('addresses')
    .update({
      label: input.label,
      full_name: input.fullName,
      phone: input.phone,
      address_line: input.addressLine,
      city: input.city,
      state: input.state,
      is_default: input.isDefault,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

// The partial unique index (one_default_address_per_user where is_default)
// means only one row can have is_default = true. Clear the current
// default before setting a new one, or the insert/update will conflict.
export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  const supabase = createClient();

  const { error: clearErr } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);
  if (clearErr) throw clearErr;

  const { error: setErr } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id);
  if (setErr) throw setErr;
}