# Website build

The big picture behind the Northside Bozeman site: what it's for, how it's put together, and
what's left to decide. For setup and deploy commands, see the root [`README.md`](../README.md).

---

## What the site is for

The site has two jobs:

1. **A live, interactive directory of Northside businesses.** Anyone can see who's in the
   Historic Brewery District, filter by type of business, find them on a map, and click through
   to their page.
2. **A home for the two strolls.** The **Summer Stroll** (July) and the **Winter Stroll**
   (December) are the group's main events. The site should always point people to the next one,
   and keep a record of past strolls.

Everything else on the site, like the about pages, contact page, and brand page, supports those
two jobs.

---

## How it's built

- **Astro**, built as a fully static site, with **Tailwind** for styling.
- Hosted on **Cloudflare Workers** as static assets (`wrangler.jsonc`).
- **No database.** All content is Markdown files in `src/content/`, checked into git. Changing the
  site means editing a file and redeploying. Member-only tools live under `/member` (see below).
- **Google Maps JavaScript API** draws the map. Without an API key, the site still builds, and the
  map page shows a sketch of the boundary plus the full business list.

| Content | Where it lives | Shows up at |
| --- | --- | --- |
| Businesses | `src/content/places/<slug>.md` | `/map`, `/places/<slug>` |
| Business photos/logos | `src/content/places/<slug>/cover.<ext>` | Map popups, list cards, place pages |
| Events (strolls) | `src/content/events/<id>.md` | Home page spotlight, `/events`, `/events/<id>` |
| Event posters, maps, photos | `public/events/<id>/` | The event's page |
| About copy | `src/content/pages/*.md` | Home page, `/about` |
| Neighborhood boundary | `src/data/northside-boundary.ts` | `/map` |
| Brand tokens | `src/styles/global.css`, `src/data/brand.ts` | Everywhere; previewed at `/member/brand` |
| Members hub | — | `/member` (footer link) |
| Brand guidelines page | `src/pages/member/brand.astro` | `/member/brand` (redirect from `/brand`) |
| Add a business | `src/pages/member/add-a-business.astro` | `/member/add-a-business` |
| Member contacts blob | `public/member/contacts.enc.json` | Decrypted at `/member/contacts` |

**"Live" means as of the last deploy.** The directory updates as soon as a changed Markdown file
is merged and the site is redeployed. Nothing updates in real time from a spreadsheet or form.
Right now, deploys are run by hand with `pnpm run deploy`.

---

## The business directory

The `/map` page is the interactive directory. It has:

- **Category filter chips** (Food & Drink, Retail, Services, Arts & Culture, Fitness & Wellness,
  Nonprofit, Other). Only categories that have at least one business are shown. Filtering
  updates the map pins and the list below it.
- **A Google Map** with the approximate Northside boundary and a color-coded pin for each
  business. Clicking a pin opens a popup with the photo, address, phone, website, and a link to
  the business's page.
- **"Show me on the map"**, which uses the visitor's location to show where they are relative
  to the district.
- **A card list of every business**, sorted by name. It works even when the map can't load.

Each business also gets its own page at `/places/<slug>`.

### What a business entry contains

Each business is one Markdown file. The front matter is validated at build time, so a typo in a
category or a missing field fails the build instead of shipping a broken page.

```markdown
---
name: Grotto Meats
status: live
categories:
  - food-drink
address: 611 N Wallace Ave Unit 4, Bozeman, MT 59715
google_place_id: ChIJtcrbxV1FRVMRFJ2V7mRoerg
phone: (406) 548-1438
email: grottomeats@gmail.com
private_contacts:
  - name: Jane Doe
    email: jane@example.com
    phone: (406) 555-0100
instagram_handle: grottomeats
lat: 45.686193
lng: -111.029266
---
A short description of the business, in plain sentences.
```

- `status`: `live` (default), `draft`, or `archived`.
  - **live** — on the map, directory cards, and member contacts.
  - **draft** — only in `astro dev`, or when `PUBLIC_INCLUDE_DRAFTS=1` (preview deploys). Use
    this to review a new listing before it goes public.
  - **archived** — place page kept for history (with a “Former business” note), hidden from the
    map. Set `successor` to the place id of the business it became (example: Peach Street Goods →
    `a-show-of-hands`). Member contacts still lists archived rows in their own table.
- `categories`: one or more of the ids in `src/data/place-categories.ts`. The **first** category
  sets the pin color.
- `google_place_id`: optional Google Maps Place ID (`ChIJ…`). Powers “Open in Google Maps” on the
  place page (and the address link on map cards). Without it, those links fall back to an address
  search. Batch-fill with
  `node --experimental-strip-types scripts/lookup-google-place-ids.ts` (uses
  `PUBLIC_GOOGLE_MAPS_API_KEY`; review any `CHECK` rows).
- `website`, `phone`, `email`, and social handles are optional. Social handles are bare (no `@`):
  `instagram_handle` (primary; string or YAML list), plus optional `threads_handle` and
  `pinterest_handle`. Cap at those three — not a full social matrix. Prefer Threads/Pinterest
  when the website is thin or that network is how people find the business.
- `private_contacts`: optional YAML list of `{ name, email?, phone? }` for the **members**
  directory. Fields prefixed `private_` never render on public place pages or the map. They stay
  in git as plaintext for collaborators; the public site only ships an encrypted blob.
- `lat` / `lng` place the pin. The maintainer usually looks these up from the address.
- `cover` is an optional photo in the business's own folder, next to its listing file (for example
  `cover: ./grotto-meats/cover.webp` points to `src/content/places/grotto-meats/cover.webp`). The
  build resizes it and converts it to WebP, and fails if the path is wrong. Landscape photos are cropped to 3:2. A square PNG is treated as a logo
  and shown whole, not cropped.

How members ask for changes is covered in
[Group organization & coordination](group-coordination.md#3-requesting-changes-to-your-business-entry).

### Members area and encrypted contacts

The footer links to `/member`, which hubs brand guidelines, add-a-business, and the contact
directory. Old URLs `/brand` and `/add-a-business` redirect to `/member/brand` and
`/member/add-a-business`. Logo files still live under `public/brand/` at `/brand/…`.

`/member/contacts` does not embed contact data in the HTML. A build-time script encrypts every
place’s `private_contacts` into `public/member/contacts.enc.json` (PBKDF2 + AES-GCM). Visitors
enter the shared password in the browser to decrypt and render a table.

Put the shared passphrase in `.env` (see `.env.example`):

```
MEMBER_CONTACTS_PASSWORD=your-strong-passphrase
```

After editing any `private_contacts` frontmatter, encrypt and commit the blob:

```bash
make encrypt          # or: pnpm encrypt:member-contacts
```

`make build` / `pnpm build` and `make dev` / `pnpm dev` run encrypt first when the password is
present; if it is missing, they continue with a warning and keep the last committed blob (handy
for CI without secrets).

Commit the updated Markdown **and** `public/member/contacts.enc.json`, then deploy. Rotating the
password means re-running encrypt and telling the group the new passphrase. Strength of the
shared password is the whole security model for the live site (ciphertext is public; git still
has plaintext).

---

## The two strolls

The strolls are the group's main events. The site is built so that the next stroll is always
the first thing people see.

### How the site picks what to spotlight

The home page shows one event card next to the logo. It picks, in order:

1. The soonest **upcoming** event marked `featured: true`
2. Otherwise, the soonest upcoming event
3. Otherwise, the most recent past event

So after the Summer Stroll ends, the Winter Stroll takes over the home page on its own, as long
as its file exists. `/events` lists upcoming events first, then past ones.

### A stroll's life cycle

Each stroll is one file in `src/content/events/`, named `<year>-<season>-stroll.md`
(for example `2026-winter-stroll.md`).

| When | What to update |
| --- | --- |
| **Date is set** | Create the event file with `title`, `date`, `location`, and a one-line `summary`. Set `featured: true`. Even a "details coming soon" body is worth publishing. |
| **A few weeks out** | Add `time`, fill in the body with what to expect, and add the poster and stroll map as `artifacts`. |
| **After the stroll** | Rewrite the body in the past tense, and add photos as artifacts so the page becomes the record of the event. Create the next stroll's file so the home page moves on. |

Artifacts (posters, maps, flyers, photos) go in `public/events/<event id>/` and are listed in the
event's front matter:

```yaml
artifacts:
  - kind: poster        # poster | map | flyer | photo | other
    title: Winter Stroll poster
    file: /events/2026-winter-stroll/poster.jpg
    credit: Designed by …   # optional
```

### Current strolls

- **2018 Summer Stroll**, Friday, June 1. Past. Poster/map photo from `@bozemannorthsidebuzz`
  (designed by Engine 8 and Jasmine Lilly Creative).
- **2024 Holiday Stroll**, Wednesday, December 4. Past. Poster from
  [Gangbusters Pottery](https://www.gangbusterspottery.com/upcoming-events/northside-stroll).
- **2025 Holiday Stroll**, Wednesday, December 10. Past. Poster & map from
  [Gangbusters Pottery](https://www.gangbusterspottery.com/upcoming-events/northside-stroll-1).
- **2026 Summer Stroll**, Wednesday, July 29. Past. Poster & map added; more photos welcome.
- **2026 Winter Stroll**, Wednesday, December 9. Upcoming and featured. Times, participating
  businesses, and the map are still to come.

---

## Open items

Decisions and loose ends that came up while building the draft:

- **Participating businesses per stroll.** Events don't link to businesses yet. One option is a
  `participants` list of place slugs on each event, so a stroll page can show "who's open
  tonight" and highlight those pins on the map.
- **Real contact email.** `/contact` uses a placeholder (`hello@northsidebozeman.com`). Swap it
  for the group's real inbox, or the Google Group address, before launch.
- **Official Instagram.** Hold footer / carousel links until the account is active enough. Details
  and the legacy `@bozemannorthsidebuzz` note live in the
  [communications plan](comms-plan.md#social-media).
- **Custom domain.** The site is only on its workers.dev URL for now.
- **Vector logos.** The logos are web-only rasters. Get vector masters before anything is printed
  (see [`DESIGN.md`](../DESIGN.md)).
- **Official boundary.** The map boundary is approximate, not GIS data.
- **Automatic deploys.** Hooking the Cloudflare deploy up to the GitHub repo would mean a merged
  change goes live without someone running `wrangler` by hand.
- **CMS.** EmDash is the planned upgrade path if non-technical members need to edit content
  directly. Until then, changes go through the request process in the coordination doc.
