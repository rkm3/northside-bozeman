# Northside Neighborhood

A static community site for Bozeman’s Northside / Historic Brewery District. The line on the door is the same one the neighborhood already uses: **From Lager to Legacy in Bozeman MT**.

This is a Cloudflare Workers draft. It follows the spirit of the current Northside landing page — a hero, who / what / why, and an event callout — without copying that layout. Pages and events are Markdown content collections. There is no database and no admin UI in this version.

## Run locally

Requires Node.js 22.12 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

The dev server defaults to [http://localhost:4321](http://localhost:4321).

## Google Maps

`/map` draws a polygon with the Maps JavaScript API. The site builds, and the map page still renders, when the key is missing: you get a sketch of the same outline and a short empty state.

Copy the example env file and add a key:

```bash
cp .env.example .env
```

```
PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

In Google Cloud Console, enable the Maps JavaScript API and billing for the key. If the key uses HTTP referrer restrictions, allow your dev origin (`http://localhost:4321/*` and `http://127.0.0.1:4321/*`) and the workers.dev origin you deploy to. Restart `pnpm dev` after changing `.env`.

## Build

```bash
pnpm install && pnpm build
```

Output goes to `dist/`.

## Members contacts

Private people behind each business live in place frontmatter as `private_contacts` (never shown
on public pages). Put the shared passphrase in `.env`:

```
MEMBER_CONTACTS_PASSWORD=your-strong-passphrase
```

Then encrypt (or start dev/build — both encrypt first when the password is set):

```bash
make encrypt          # or: pnpm encrypt:member-contacts
make dev              # encrypts, then astro dev
make build            # encrypts, then astro build
```

Commit `public/member/contacts.enc.json` with the Markdown changes. See
[`docs/website-build.md`](docs/website-build.md) for the full members-area notes.

## Deploy to Cloudflare Workers

`wrangler.jsonc` is set up for a static assets worker:

- name: `northside-bozeman`
- `workers_dev`: true
- assets directory: `dist`
- `not_found_handling`: `404-page`

From a machine that is already logged in (`pnpm exec wrangler login`):

```bash
pnpm install && pnpm build && pnpm exec wrangler deploy
```

`pnpm run deploy` is the same wrangler command after a build. Wrangler prints the workers.dev URL when the deploy succeeds. Do not guess that URL; the account subdomain is assigned by Cloudflare.

Custom domains and DNS are out of scope for this draft.

## Boundary

`src/data/northside-boundary.ts` is an approximate ring around the Historic Brewery District, with the west edge on N. Rouse Ave and the southeast corner just past N. Broadway. It is not an official GIS boundary; the map legend labels it "Approximate Northside boundary."

## CMS

EmDash is the planned CMS upgrade path. A later version can move to SSR with D1, R2, and an admin. This draft stays on static Markdown collections so the site can ship without that stack.
