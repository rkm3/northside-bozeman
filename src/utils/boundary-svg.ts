import type { LatLng } from '../data/northside-boundary';

/** Project a lat/lng ring into an SVG polygon string. North is up. */
export function boundaryRingToPoints(
  ring: LatLng[],
  width = 320,
  height = 200,
  pad = 28,
): string {
  const lats = ring.map((point) => point.lat);
  const lngs = ring.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  return ring
    .map((point) => {
      const x = pad + ((point.lng - minLng) / lngSpan) * (width - pad * 2);
      const y = pad + ((maxLat - point.lat) / latSpan) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
