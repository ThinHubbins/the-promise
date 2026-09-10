// app/api/payments/opay/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('ref');
  if (!reference) {
    return NextResponse.json({ error: 'ref is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('payment_reference', reference)
    .eq('user_id', user.id) // don't leak other users' orders
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ orderId: order.id, status: order.status });
}