// lib/outlets.ts

export type Outlet = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

// Coordinates resolved from the addresses provided — accurate to the
// street address (or nearest resolvable point) for each outlet.
//
// NOTE: Bori, Rukpokwu, Elele, and Lagos (MMA2) were added after initial
// setup. Their coordinates are town/landmark-level approximations sourced
// from Wikipedia/NGA GeoNames — not street-level geocodes of the exact
// address (unlike the original five, which appear to have been resolved
// via a proper geocoder). Recommend running each through POST /api/geocode
// to tighten precision before relying on them for close-call routing.
export const outlets: Outlet[] = [
  {
    id: 'omoku',
    name: 'Omoku',
    address: '62 Ahoada Road, Omoku–Obrikom Road',
    city: 'Omoku',
    state: 'Rivers State',
    lat: 5.3451116,
    lng: 6.6577422,
  },
  {
    id: 'ahoada',
    name: 'Ahoada',
    address: '3JCX+3JP',
    city: 'Ahoada',
    state: 'Rivers State',
    lat: 5.0828166,
    lng: 6.6584666,
  },
  {
    id: 'bonny',
    name: 'Bonny',
    address: '17 King Perekule Rd',
    city: 'Bonny Island',
    state: 'Rivers State',
    lat: 4.4337611,
    lng: 7.1684934,
  },
  {
    id: 'aggrey',
    name: 'Aggrey',
    address: '25 Aggrey Rd',
    city: 'Port Harcourt',
    state: 'Rivers State',
    lat: 4.7611816,
    lng: 7.0179659,
  },
  {
    id: 'corporate-hq',
    name: 'Corporate HQ',
    address: 'Trans-Amadi',
    city: 'Port Harcourt',
    state: 'Rivers State',
    lat: 4.8206453,
    lng: 7.0552218,
  },
  {
    id: 'bori',
    name: 'Bori',
    address: '91 Hospital Road, Bori-Ogoni',
    city: 'Bori',
    state: 'Rivers State',
    lat: 4.67278,
    lng: 7.37028,
  },
  {
    id: 'rukpokwu',
    name: 'Rukpokwu',
    address: '16 Airport Road, Rukpokwu',
    city: 'Port Harcourt',
    state: 'Rivers State',
    lat: 4.9,
    lng: 7.0,
  },
  {
    id: 'elele',
    name: 'Elele',
    address: '2 Owerri Road, Elele',
    city: 'Elele',
    state: 'Rivers State',
    lat: 5.10184,
    lng: 6.81902,
  },
  {
    id: 'lagos-mma2',
    name: 'Lagos (MMA2)',
    address: 'Domestic Terminal 2 (MMA2), Murtala Muhammed Airport',
    city: 'Ikeja',
    state: 'Lagos State',
    lat: 6.57738,
    lng: 3.32117,
  },
];

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export type OutletWithDistance = Outlet & { distanceKm: number };

/** Returns every outlet sorted nearest-first. */
export function findNearestOutlets(lat: number, lng: number): OutletWithDistance[] {
  return outlets
    .map((o) => ({ ...o, distanceKm: haversineDistanceKm(lat, lng, o.lat, o.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function directionsUrl(outlet: Outlet): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${outlet.lat},${outlet.lng}`;
}