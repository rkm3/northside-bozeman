import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const extensions = ['webp', 'jpg', 'jpeg', 'png', 'avif'] as const;

function placeFiles(): string[] {
  try {
    return readdirSync(join(process.cwd(), 'public/images/places'));
  } catch {
    return [];
  }
}

function pngIsSquare(file: string): boolean {
  try {
    const buf = readFileSync(join(process.cwd(), 'public/images/places', file));
    if (buf.length < 24 || buf[0] !== 0x89) return false;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width === 0 || height === 0) return false;
    const ratio = width / height;
    return ratio > 0.9 && ratio < 1.1;
  } catch {
    return false;
  }
}

export type PlaceCover = { src: string; square: boolean };

/** Public URL for a place cover in `public/images/places/`, matched by slug. */
export function getPlaceCover(slug: string): PlaceCover | undefined {
  const files = placeFiles();
  for (const ext of extensions) {
    const file = `${slug}.${ext}`;
    if (files.includes(file)) {
      return { src: `/images/places/${file}`, square: ext === 'png' && pngIsSquare(file) };
    }
  }
  return undefined;
}
