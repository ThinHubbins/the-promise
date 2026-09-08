import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { outlets } from '../../../../lib/outlets';
import { computeToken, currentTimeBucket, safeEqual } from '../../../../lib/attendanceQr';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const payload: string | undefined = body?.payload;
  if (!payload) return NextResponse.json({ error: 'Missing QR payload.' }, { status: 400 });

  const parts = payload.split('.');
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'Invalid QR code.' }, { status: 400 });
  }
  const [outletId, timeBucketStr, token] = parts;
  const timeBucket = Number(timeBucketStr);
  if (!outletId || !Number.isFinite(timeBucket) || !token) {
    return NextResponse.json({ error: 'Invalid QR code.' }, { status: 400 });
  }

  const outlet = outlets.find((o) => o.id === outletId);
  if (!outlet) {
    return NextResponse.json({ error: 'Unknown outlet in QR code.' }, { status: 400 });
  }

  const nowBucket = currentTimeBucket();
  if (timeBucket !== nowBucket && timeBucket !== nowBucket - 1) {
    return NextResponse.json({ error: 'This QR code has expired. Ask for a fresh one.' }, { status: 400 });
  }

  let expectedToken: string;
  try {
    expectedToken = computeToken(outletId, timeBucket);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
  }
  if (!safeEqual(expectedToken, token)) {
    return NextResponse.json({ error: 'Invalid or tampered QR code.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'You must be logged in as staff.' }, { status: 401 });
  }

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .ilike('email', user.email)
    .maybeSingle();

  if (staffError || !staff) {
    return NextResponse.json({ error: 'No staff record found for your account.' }, { status: 403 });
  }

  const staffOutlet = (staff.outlet || '').toLowerCase();
  const matchesOutlet =
    staffOutlet === outlet.id.toLowerCase() || staffOutlet === outlet.name.toLowerCase();
  if (!matchesOutlet) {
    return NextResponse.json(
      { error: `This QR code is for ${outlet.name}, which isn't your assigned outlet.` },
      { status: 403 }
    );
  }

  const { data: openRecord, error: openError } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', staff.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) {
    console.error('Open attendance lookup failed', openError);
    return NextResponse.json({ error: 'Could not check attendance status.' }, { status: 500 });
  }

  if (openRecord) {
    const { error: updateError } = await supabase
      .from('attendance')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', openRecord.id);
    if (updateError) {
      console.error('Clock-out failed', updateError);
      return NextResponse.json({ error: 'Could not record clock-out.' }, { status: 500 });
    }
    return NextResponse.json({ message: `Clocked out at ${outlet.name}. See you next time!` });
  }

  const { error: insertError } = await supabase.from('attendance').insert({
    staff_id: staff.id,
    outlet_id: outlet.id,
    clock_in: new Date().toISOString(),
  });
  if (insertError) {
    console.error('Clock-in failed', insertError);
    return NextResponse.json({ error: 'Could not record clock-in.' }, { status: 500 });
  }
  return NextResponse.json({ message: `Clocked in at ${outlet.name}. Have a great shift!` });
}