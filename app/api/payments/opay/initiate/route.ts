import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Pull the real order + amount from your DB — never trust a client-supplied amount.
   const { data: order, error } = await supabase
  .from('orders')
  .select('id, amount, status, user_id')   // was total_amount
  .eq('id', orderId)
  .eq('user_id', user.id)
  .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is not payable' }, { status: 409 });
    }

    // Amount must be in the smallest currency unit (kobo for NGN): ₦1,000 -> 100000
    const amountInKobo = Math.round(order.amount * 100);

    // A fresh, unique reference per payment attempt. Reusing an order's reference
    // on retry will get a "reference already exists" error from OPay.
    const reference = `${order.id}-${Date.now()}`;

    const res = await fetch(`${process.env.OPAY_BASE_URL}/api/v1/international/cashier/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`,
        MerchantId: process.env.OPAY_MERCHANT_ID as string,
      },
      body: JSON.stringify({
        country: 'NG',
        reference,
        amount: { total: amountInKobo, currency: 'NGN' },
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/order/confirmation?ref=${reference}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/opay/callback`,
        cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/order/${order.id}`,
        expireAt: 30, // minutes
        userInfo: {
          userId: user.id,
          userEmail: user.email,
        },
        product: {
          name: `Order #${order.id}`,
          description: 'The Promise order payment',
        },
      }),
    });

    const data = await res.json();

    if (data.code !== '00000') {
      console.error('OPay create error:', data);
      return NextResponse.json({ error: data.message || 'Payment initiation failed' }, { status: 502 });
    }

    // Record the reference against the order so the callback can match it back.
    await supabase
      .from('orders')
      .update({ payment_reference: reference })
      .eq('id', order.id);

    return NextResponse.json({ cashierUrl: data.data.cashierUrl });
  } catch (err) {
    console.error('OPay initiate error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}