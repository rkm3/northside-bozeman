import type { ImageMetadata } from 'astro';

/** A square PNG is a logo: shown whole instead of cropped to 3:2. */
export function isLogoCover(cover: ImageMetadata): boolean {
  if (cover.format !== 'png') return false;
  const ratio = cover.width / cover.height;
  return ratio > 0.9 && ratio < 1.1;
}
