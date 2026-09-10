import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '../../../../../lib/supabase/service';

function verifySignature(payload: any, receivedSignature: string): boolean {
  const secretKey = process.env.OPAY_SECRET_KEY as string;

  const signContent = `{Amount:"${payload.amount}",Currency:"${payload.currency}",Reference:"${payload.reference}",Refunded:${payload.refunded ? 't' : 'f'},Status:"${payload.status}",Timestamp:"${payload.timestamp}",Token:"${payload.token ?? ''}",TransactionID:"${payload.transactionId}"}`;

  const expected = crypto
    .createHmac('sha3-512', secretKey)
    .update(signContent)
    .digest('hex');

  return expected === receivedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload, sha512 } = body;

    if (!payload || !sha512) {
      return NextResponse.json({ error: 'Malformed callback' }, { status: 400 });
    }

    if (!verifySignature(payload, sha512)) {
      console.error('OPay callback: signature mismatch', payload.reference);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ---- everything below is the new block ----
    const supabase = createClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, amount')
      .eq('payment_reference', payload.reference)
      .single();

    if (orderError || !order) {
      console.error('OPay callback: no matching order for reference', payload.reference, orderError);
      return NextResponse.json({ received: true });
    }

    const expectedKobo = Math.round(order.amount * 100);
    const paidKobo = Number(payload.amount);

    console.log('OPay callback received', {
      reference: payload.reference,
      status: payload.status,
      expectedKobo,
      paidKobo,
      orderStatus: order.status,
    });

    if (payload.status === 'SUCCESS' && paidKobo === expectedKobo) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'pending');
      if (updateError) console.error('OPay callback: update to paid failed', updateError);
    } else if (payload.status === 'FAIL' || payload.status === 'CLOSE') {
      await supabase
        .from('orders')
        .update({ status: 'payment_failed' })
        .eq('id', order.id)
        .eq('status', 'pending');
    } else {
      console.warn('OPay callback: no matching condition', {
        status: payload.status,
        paidKobo,
        expectedKobo,
      });
    }

    return NextResponse.json({ received: true });
    // ---- end of new block ----
  } catch (err) {
    console.error('OPay callback error:', err);
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 });
  }
}