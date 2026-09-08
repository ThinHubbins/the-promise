// app/api/geocode/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
};

const NOMINATIM_HEADERS = {
  // Nominatim's usage policy requires a descriptive User-Agent.
  'User-Agent': 'ThePromiseFastFood-OutletsPage/1.0 (support@thepromise.ng)',
  'Accept-Language': 'en',
};

async function geocodeQuery(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ng',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: NOMINATIM_HEADERS,
    cache: 'no-store',
  });

  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

/**
 * Nominatim's free-text search often can't resolve a specific landmark
 * (a university name, an estate, a named building) even when the
 * surrounding locality is well indexed. Rather than failing outright, try
 * the full address first, then progressively strip the leading (most
 * specific) comma-separated segment and retry — "Madonna University, Elele,
 * Rivers State" falls back to "Elele, Rivers State" if the first attempt
 * comes up empty. Finally try appending "Nigeria" if it isn't already there.
 */
function buildFallbackQueries(address: string): string[] {
  const segments = address.split(',').map((s) => s.trim()).filter(Boolean);
  const queries = [address];

  for (let i = 1; i < segments.length; i++) {
    const remainder = segments.slice(i).join(', ');
    if (remainder && !queries.includes(remainder)) {
      queries.push(remainder);
    }
  }

  const last = queries[queries.length - 1];
  if (last && !/nigeria/i.test(last)) {
    queries.push(`${last}, Nigeria`);
  }

  return queries;
}

/** GET /api/geocode?q=... — live suggestions as the user types. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'ng',
    addressdetails: '0',
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const results = (await res.json()) as NominatimResult[];

    return NextResponse.json({
      suggestions: results.map((r) => ({
        id: String(r.place_id),
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })),
    });
  } catch (err) {
    console.error('Suggestion request failed', err);
    // Fail quiet — suggestions are an enhancement, not required for the
    // core "Find Nearest Outlet" flow.
    return NextResponse.json({ suggestions: [] });
  }
}

/** POST /api/geocode — resolve one address to exact coordinates (fallback path). */
export async function POST(req: Request) {
  let address: string | undefined;

  try {
    const body = await req.json();
    address = typeof body?.address === 'string' ? body.address.trim() : undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!address || address.length < 4) {
    return NextResponse.json(
      { error: 'Please enter a more complete address.' },
      { status: 400 }
    );
  }

  const candidates = buildFallbackQueries(address);

  try {
    let best: NominatimResult | undefined;
    let matchedQuery = address;

    for (const candidate of candidates) {
      const results = await geocodeQuery(candidate);
      if (results.length) {
        best = results[0];
        matchedQuery = candidate;
        break;
      }
    }

    if (!best) {
      return NextResponse.json(
        { error: "We couldn't find that address. Try adding a landmark, city, or state." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: parseFloat(best.lat),
      lng: parseFloat(best.lon),
      displayName: best.display_name,
      // Set only when we fell back to a broader query than what the user
      // typed — lets the UI optionally say "Showing results near Elele,
      // Rivers State" instead of echoing the unresolved landmark name.
      matchedQuery: matchedQuery !== address ? matchedQuery : undefined,
    });
  } catch (err) {
    console.error('Geocoding request failed', err);
    return NextResponse.json(
      { error: 'Location lookup is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}