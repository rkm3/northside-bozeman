/**
 * Read private_contacts from place Markdown frontmatter and write the
 * encrypted blob at public/member/contacts.enc.json.
 *
 * Password comes from MEMBER_CONTACTS_PASSWORD in the environment or `.env`.
 *
 * Usage:
 *   pnpm encrypt:member-contacts
 *   make encrypt
 *   pnpm encrypt:member-contacts -- --optional   # skip if password missing (used by build)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  encryptContacts,
  type MemberContactRow,
} from '../src/utils/member-contacts-crypto.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const placesDir = join(root, 'src/content/places');
const outPath = join(root, 'public/member/contacts.enc.json');

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
  private_contacts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
};

function parseFrontmatter(source: string): PlaceFrontmatter {
  if (!source.startsWith('---')) {
    return {};
  }
  const end = source.indexOf('\n---', 3);
  if (end === -1) {
    return {};
  }
  const yamlBlock = source.slice(4, end);
  const parsed: unknown = parseYaml(yamlBlock);
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }
  return parsed as PlaceFrontmatter;
}

function collectRows(): MemberContactRow[] {
  const rows: MemberContactRow[] = [];
  const files = readdirSync(placesDir).filter((name) => name.endsWith('.md'));

  for (const file of files) {
    const placeId = basename(file, '.md');
    const source = readFileSync(join(placesDir, file), 'utf8');
    const data = parseFrontmatter(source);
    const business = data.name?.trim();
    const contacts = data.private_contacts ?? [];
    if (!business || contacts.length === 0) continue;

    for (const contact of contacts) {
      const name = contact.name?.trim();
      if (!name) continue;
      const row: MemberContactRow = { placeId, business, name };
      if (contact.email) row.email = contact.email;
      if (contact.phone) row.phone = contact.phone;
      rows.push(row);
    }
  }

  rows.sort((a, b) => {
    const byBusiness = a.business.localeCompare(b.business);
    return byBusiness !== 0 ? byBusiness : a.name.localeCompare(b.name);
  });
  return rows;
}

async function main(): Promise<void> {
  loadDotEnv(join(root, '.env'));
  const optional = process.argv.includes('--optional');
  const password = process.env.MEMBER_CONTACTS_PASSWORD?.trim();
  if (!password) {
    if (optional) {
      console.warn(
        'MEMBER_CONTACTS_PASSWORD not set in env or .env; skipping encrypt (keeping existing blob).',
      );
      return;
    }
    console.error(
      'Set MEMBER_CONTACTS_PASSWORD in .env (or the environment) to encrypt the member contacts blob.',
    );
    process.exit(1);
  }

  const rows = collectRows();
  const blob = await encryptContacts(password, rows);
  mkdirSync(join(root, 'public/member'), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(blob, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${rows.length} contact(s) to ${outPath}`);
}

await main();
