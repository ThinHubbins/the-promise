import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { outlets } from '../../../../lib/outlets';
import { computeToken, currentTimeBucket, QR_WINDOW_SECONDS } from '../../../../lib/attendanceQr';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const outlet = outlets.find((o) => o.id === outletId);
  if (!outlet) {
    return NextResponse.json({ error: 'Unknown outlet' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const timeBucket = currentTimeBucket();
  const token = computeToken(outletId, timeBucket);
  const expiresAt = (timeBucket + 1) * QR_WINDOW_SECONDS * 1000;
  const payload = `${outletId}.${timeBucket}.${token}`;

  return NextResponse.json({ payload, expiresAt });
}