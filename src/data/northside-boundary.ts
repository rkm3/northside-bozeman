import { brandColors } from './brand';

export type LatLng = { lat: number; lng: number };

/**
 * Approximate ring for the Northside / Historic Brewery District.
 * West edge follows N. Rouse Ave; the southeast corner reaches past
 * N. Broadway to include Roly-Poly Coffee. Not an official GIS boundary.
 */
export const northsideBoundaryRing: LatLng[] = [
  { lat: 45.6902, lng: -111.0316 },
  { lat: 45.6906, lng: -111.031 },
  { lat: 45.6894, lng: -111.0258 },
  { lat: 45.6853, lng: -111.0232 },
  { lat: 45.6841, lng: -111.0229 },
  { lat: 45.6838, lng: -111.0319 },
];

/** Warm fill so the outline reads as Northside, not a borrowed map style. */
export const northsideBoundaryStyle = {
  fill: brandColors.ember,
  fillOpacity: 0.3,
  stroke: brandColors.rust,
  strokeOpacity: 0.95,
} as const;

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
