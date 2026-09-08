import { createClient } from './supabase/client';
import type { Order } from './types';

function fromRow(row: any): Order {
  return {
    dbId: row.id,
    id: row.order_code,
    items: (row.order_items ?? []).map((it: any) => ({
      name: it.name,
      qty: it.qty,
      price: Number(it.price),
    })),
    amount: Number(row.amount),
    date: new Date(row.created_at).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    stepIndex: row.step_index,
    trackingId: row.tracking_id,
    courier: row.courier,
    location: row.location,
    eta: row.eta,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createOrder(
  userId: string,
  params: {
    orderCode: string;
    amount: number;
    trackingId: string;
    addressId?: string | null;
    items: { dishId: string; name: string; price: number; qty: number }[];
  }
): Promise<Order> {
  const supabase = createClient();

  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_code: params.orderCode,
      user_id: userId,
      amount: params.amount,
      tracking_id: params.trackingId,
      address_id: params.addressId ?? null,
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  const { error: itemsErr } = await supabase.from('order_items').insert(
    params.items.map((it) => ({
      order_id: orderRow.id,
      dish_id: it.dishId,
      name: it.name,
      price: it.price,
      qty: it.qty,
    }))
  );
  if (itemsErr) throw itemsErr;

  return fromRow({ ...orderRow, order_items: params.items });
}

export async function advanceOrderStep(dbId: string, nextStep: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({ step_index: nextStep })
    .eq('id', dbId);
  if (error) throw error;
}