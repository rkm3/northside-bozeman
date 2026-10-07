import { brandColors } from './brand';

export type LatLng = { lat: number; lng: number };

/**
 * Placeholder ring for the Northside / Historic Brewery District.
 * Focused on the N. Wallace Avenue 700–800 blocks in Bozeman
 * (about 45.685–45.69 N, 111.03 W). Not an official GIS boundary.
 * Replace these points when the association confirms the outline.
 */
export const northsideBoundaryRing: LatLng[] = [
  { lat: 45.6902, lng: -111.0372 },
  { lat: 45.6906, lng: -111.031 },
  { lat: 45.6894, lng: -111.0258 },
  { lat: 45.6852, lng: -111.0246 },
  { lat: 45.6838, lng: -111.0304 },
  { lat: 45.6846, lng: -111.0368 },
];

/** Warm fill so the outline reads as Northside, not a borrowed map style. */
export const northsideBoundaryStyle = {
  fill: brandColors.ember,
  fillOpacity: 0.3,
  stroke: brandColors.rust,
  strokeOpacity: 0.95,
} as const;

export const northsideBoundaryNote =
  'This outline is a placeholder for the Northside / Historic Brewery District, drawn around the N. Wallace Avenue 700–800 blocks. It is approximate and still to be confirmed — not an official city or GIS boundary.';

export function boundaryCenter(ring: LatLng[]): LatLng {
  const totals = ring.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }),
    { lat: 0, lng: 0 },
  );
  return {
    lat: totals.lat / ring.length,
    lng: totals.lng / ring.length,
  };
}
