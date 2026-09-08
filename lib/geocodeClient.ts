// lib/geocodeClient.ts
//
// Inferred from how components/OutletFinder.tsx calls this module — you
// don't have this file in the documents you've shared with me, so please
// diff this against your actual lib/geocodeClient.ts before overwriting it.
// The important part to preserve either way is threading `matchedQuery`
// through geocodeAddress's return type so the finder can show what was
// actually matched instead of echoing back an unresolved landmark name.

export type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  /**
   * Present only when the server had to fall back to a broader query than
   * what the user typed (e.g. a landmark name Nominatim didn't recognize
   * got stripped down to "Elele, Rivers State"). Use this — not the raw
   * user input — as the resolved label in the UI when it's set.
   */
  matchedQuery?: string;
};

type SuggestResponse = { suggestions: AddressSuggestion[] };
type GeocodeErrorResponse = { error: string };

/** GET /api/geocode?q=... — live suggestions as the user types. */
export async function suggestAddresses(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`/api/geocode?${params.toString()}`, { signal });

  if (!res.ok) {
    throw new Error('Suggestion request failed.');
  }

  const data = (await res.json()) as SuggestResponse;
  return data.suggestions;
}

/** POST /api/geocode — resolve one address to exact coordinates (fallback path). */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const res = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  const data = await res.json();

  if (!res.ok) {
    const { error } = data as GeocodeErrorResponse;
    throw new Error(error || 'Location lookup failed.');
  }

  return data as GeocodeResult;
}