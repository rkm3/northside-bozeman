import type { LatLng } from '../data/northside-boundary';

export type SvgProjection = {
  width: number;
  height: number;
  project: (point: LatLng) => { x: number; y: number };
  ringToPoints: (ring: LatLng[]) => string;
};

/** Fit lat/lng points into an SVG viewBox. North is up. */
export function createSvgProjection(
  points: LatLng[],
  width = 320,
  height = 200,
  pad = 28,
): SvgProjection {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  function project(point: LatLng): { x: number; y: number } {
    return {
      x: pad + ((point.lng - minLng) / lngSpan) * (width - pad * 2),
      y: pad + ((maxLat - point.lat) / latSpan) * (height - pad * 2),
    };
  }

  function ringToPoints(ring: LatLng[]): string {
    return ring
      .map((point) => {
        const { x, y } = project(point);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  return { width, height, project, ringToPoints };
}

/** Project a lat/lng ring into an SVG polygon string. North is up. */
export function boundaryRingToPoints(
  ring: LatLng[],
  width = 320,
  height = 200,
  pad = 28,
): string {
  return createSvgProjection(ring, width, height, pad).ringToPoints(ring);
}
