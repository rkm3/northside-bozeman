/**
 * Look up Google Maps Place IDs for each place listing and write
 * `google_place_id` into frontmatter.
 *
 * Uses Places API (New) Text Search with PUBLIC_GOOGLE_MAPS_API_KEY.
 * The Maps JS key is HTTP-referrer restricted; this script sends a
 * localhost Referer so the New Places endpoint accepts it.
 *
 * Usage:
 *   node --experimental-strip-types scripts/lookup-google-place-ids.ts
 *   node --experimental-strip-types scripts/lookup-google-place-ids.ts --dry-run
 *   node --experimental-strip-types scripts/lookup-google-place-ids.ts --force
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const placesDir = join(root, 'src/content/places');
const PLACE_ID_RE = /^ChIJ[\w-]+$/;

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

/** Load KEY=value pairs from `.env` without overriding existing process.env. */
function loadDotEnv(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

type PlaceFrontmatter = {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  google_place_id?: string;
};

type SearchHit = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
};

function parseFrontmatter(source: string): PlaceFrontmatter {
  if (!source.startsWith('---')) return {};
  const end = source.indexOf('\n---', 3);
  if (end === -1) return {};
  const parsed: unknown = parseYaml(source.slice(4, end));
  if (!parsed || typeof parsed !== 'object') return {};
  return parsed as PlaceFrontmatter;
}

function setGooglePlaceId(source: string, placeId: string): string {
  if (!source.startsWith('---')) {
    throw new Error('Missing frontmatter');
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) throw new Error('Unclosed frontmatter');

  const yamlBlock = source.slice(4, end);
  const body = source.slice(end + '\n---'.length);
  const line = `google_place_id: ${placeId}`;

  if (/^google_place_id:\s*.+$/m.test(yamlBlock)) {
    const nextYaml = yamlBlock.replace(/^google_place_id:\s*.+$/m, line);
    return `---\n${nextYaml}\n---${body}`;
  }

  if (/^address:\s*.+$/m.test(yamlBlock)) {
    const nextYaml = yamlBlock.replace(/^(address:\s*.+)$/m, `$1\n${line}`);
    return `---\n${nextYaml}\n---${body}`;
  }

  return `---\n${yamlBlock}\n${line}\n---${body}`;
}

const STOP = new Set([
  'the',
  'and',
  'for',
  'llc',
  'inc',
  'co',
  'company',
  'studio',
  'gallery',
  'shop',
  'store',
]);

function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 2 && !STOP.has(token));
}

/** True when the Google hit is plausibly the same business. */
function namesLookRelated(listingName: string, hitName: string): boolean {
  const a = significantTokens(listingName);
  const b = significantTokens(hitName);
  if (a.length === 0 || b.length === 0) return false;
  const aJoined = a.join(' ');
  const bJoined = b.join(' ');
  if (aJoined === bJoined || aJoined.includes(bJoined) || bJoined.includes(aJoined)) {
    return true;
  }
  const aSet = new Set(a);
  const overlap = b.filter((token) => aSet.has(token)).length;
  // Require most of the shorter name to match — avoids “Brick Bound” → “Brick Block”.
  const needed = Math.min(a.length, b.length) >= 2 ? 2 : 1;
  return overlap >= needed && overlap / Math.min(a.length, b.length) >= 0.5;
}

async function searchPlace(
  apiKey: string,
  query: string,
  lat: number,
  lng: number,
): Promise<SearchHit | undefined> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      Referer: 'http://localhost:4321/',
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 80,
        },
      },
      maxResultCount: 3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Places API ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { places?: SearchHit[] };
  return data.places?.[0];
}

async function main(): Promise<void> {
  loadDotEnv(join(root, '.env'));
  const apiKey = process.env.PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    console.error('Missing PUBLIC_GOOGLE_MAPS_API_KEY in environment or .env');
    process.exit(1);
  }

  const files = readdirSync(placesDir)
    .filter((name) => name.endsWith('.md'))
    .sort();

  let wrote = 0;
  let skipped = 0;
  let missing = 0;
  let uncertain = 0;

  for (const file of files) {
    const path = join(placesDir, file);
    const source = readFileSync(path, 'utf8');
    const data = parseFrontmatter(source);
    const id = basename(file, '.md');
    const name = data.name?.trim();
    const address = data.address?.trim();
    const lat = data.lat;
    const lng = data.lng;

    if (!name || !address || typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn(`SKIP ${id}: missing name/address/lat/lng`);
      skipped += 1;
      continue;
    }

    if (data.google_place_id && PLACE_ID_RE.test(data.google_place_id) && !force) {
      console.log(`KEEP ${id}: ${data.google_place_id}`);
      skipped += 1;
      continue;
    }

    const query = `${name}, ${address}`;
    let hit: SearchHit | undefined;
    try {
      hit = await searchPlace(apiKey, query, lat, lng);
    } catch (error) {
      console.error(`FAIL ${id}:`, error instanceof Error ? error.message : error);
      missing += 1;
      continue;
    }

    if (!hit?.id || !PLACE_ID_RE.test(hit.id)) {
      console.warn(`MISS ${id}: no Place ID for “${query}”`);
      missing += 1;
      continue;
    }

    const hitName = hit.displayName?.text ?? '(unknown)';
    const related = namesLookRelated(name, hitName);
    if (!related) {
      uncertain += 1;
      console.warn(
        `CHECK ${id}: skipped “${hitName}” (${hit.id}) · ${hit.formattedAddress ?? 'no address'}`,
      );
      continue;
    }

    console.log(
      `OK ${id}: ${hit.id} ← “${hitName}” · ${hit.formattedAddress ?? 'no address'}`,
    );

    if (!dryRun) {
      writeFileSync(path, setGooglePlaceId(source, hit.id), 'utf8');
      wrote += 1;
    }

    // Be gentle with quota.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  console.log(
    `\nDone. wrote=${wrote} skipped=${skipped} missing=${missing} check=${uncertain}` +
      (dryRun ? ' (dry-run)' : ''),
  );
}

await main();
