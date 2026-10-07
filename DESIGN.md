# Northside Bozeman — Design Guidelines

The source of truth for how the Northside Bozeman Business Group looks and sounds, on this site and
everywhere else. The live, shareable version is the [`/brand`](src/pages/brand.astro) page.

**The feel:** a historic brewery-and-rail district at the foot of the Bridgers. Warm, handmade,
a little vintage — never slick. Think painted wall signs, grain elevators, and letterpress, not
tech startup.

---

## Assets

All brand files live in `public/brand/` and are served from `/brand/…`.

| File                                    | What it is                                    |
| --------------------------------------- | --------------------------------------------- |
| `northside-bozeman-logo-primary.png`    | Primary logo, transparent (1212×1073)         |
| `northside-bozeman-logo-primary.webp`   | Same, web-optimized — use this in pages       |
| `northside-bozeman-logo-badge.png`      | Circular badge, transparent (508×487)         |
| `northside-bozeman-logo-badge.webp`     | Same, web-optimized                           |
| `northside-bozeman-icon.png`            | Square app icon (215×216)                     |
| `northside-bozeman-logo-sheet.jpg/.webp`| Original logo concept sheet                   |
| `northside-bozeman-color-palette.jpg/.webp` | Original palette concept sheet            |

Favicons generated from the icon live at the root of `public/`: `favicon.ico`, `favicon-32.png`,
`apple-touch-icon.png`.

In code, render logos with the `Logo` component rather than raw `<img>` tags:

```astro
<Logo variant="primary" class="h-auto w-full max-w-md" />
<Logo variant="badge" alt="" class="h-auto w-16" /> <!-- alt="" when a text label sits next to it -->
```

> **Known gap:** these logos were cut from an AI-generated raster sheet. They are fine for the web
> but too small and soft for print, signage, or merch. Get vector (SVG/PDF) masters redrawn before
> anything is printed, and replace these files when you have them.

---

## Logos

| Logo        | Use for                                                      | Minimum size              |
| ----------- | ------------------------------------------------------------ | ------------------------- |
| **Primary** | Home page hero, posters, banners, anything with room        | 240px wide · 2 in. print  |
| **Badge**   | Site header, stickers, social posts, partner listings        | 64px wide · 0.75 in.      |
| **Icon**    | Favicon, app icon, square avatars, dark backgrounds          | 16px                      |

**Do**

- Put the primary logo and badge on Warm Off-White (`paper`), Card Surface (`surface`), or white.
- Leave clear space on every side equal to the height of the “B” in BOZEMAN.
- Scale proportionally.

**Don’t**

- Put the primary logo or badge on dark, busy, or photographic backgrounds. The rust wordmark
  disappears on dark colors (1.8:1 on Trail Ink). Use the icon instead.
- Recolor, stretch, rotate, outline, or add drop shadows.
- Retype “Northside Bozeman” in a font as if it were the logo. In UI text, use `DistrictLockup`,
  which is clearly typography and not an imitation of the mark.

---

## Color

Tokens are defined once in `src/styles/global.css` (`@theme`) and mirrored in `src/data/brand.ts`
for scripts that can't read CSS variables (Google Maps). **Keep the two in sync.** Tailwind utilities
follow the token name: `bg-rust`, `text-olive`, `border-line`, etc.

### Core palette (from the palette sheet)

| Token   | Name           | Hex       | Role                                                    |
| ------- | -------------- | --------- | ------------------------------------------------------- |
| `rust`  | Rust Red       | `#A62B1D` | Primary accent. Primary buttons, links, active nav.     |
| `ember` | Ember Orange   | `#D96B07` | Secondary accent. Large display type, fills, rules.     |
| `olive` | Forest Olive   | `#5C6F3B` | Nature accent. Icons, tags, supporting headings.        |
| `ochre` | Golden Ochre   | `#EBAF17` | Highlight. Small badges, hairlines, accents on dark.    |
| `paper` | Warm Off-White | `#F9F5EE` | Page background.                                        |

### Functional

| Token        | Name         | Hex       | Role                                       |
| ------------ | ------------ | --------- | ------------------------------------------ |
| `ink`        | Trail Ink    | `#2C351F` | Body text, headings, footer background.    |
| `surface`    | Card Surface | `#FDFBFA` | Cards, header, inputs.                     |
| `muted`      | Muted Ink    | `#5B5F4C` | Ledes, captions, metadata.                 |
| `line`       | Hairline     | `#E4DACB` | Borders and dividers.                      |
| `rust-deep`  | Rust Deep    | `#7E2015` | Hover/pressed for rust.                    |
| `ember-deep` | Ember Deep   | `#A85205` | Orange **text** at body sizes.             |
| `olive-deep` | Olive Deep   | `#46552C` | Hover/pressed for olive.                   |

### Proportions

Roughly **70% paper/surface, 20% ink, 10% accent.** Rust is the lead accent; orange, olive, and
ochre are seasoning. Never flood a whole page or section with orange or ochre.

### Accessibility rules (WCAG 2.2 AA)

These are the rules that matter. The `/brand` page computes the exact ratios.

- **Body text:** `ink` or `muted` on `paper`/`surface`. Links and headings can be `rust` (6.5:1)
  or `olive` (5.1:1).
- **Ember Orange fails AA for normal text** with *any* pairing (3.2:1 on paper, 3.5:1 with white
  text, 3.7:1 with ink text). Use `ember` only for display type ≥ 24px (or ≥ 19px bold), large
  fills, and decoration. For orange text at body sizes, use `ember-deep`.
- **That means the palette sheet's "orange secondary button" needs adjusting.** Secondary buttons
  are an `ember-deep` outline with `ember-deep` text, which fills on hover. Solid buttons are `rust`
  or `olive` with `surface` text.
- **Golden Ochre is never text on a light background** (1.8:1). It works as a fill behind `ink`
  text (6.5:1), or as text/accent on `ink` (6.5:1).
- Don't rely on color alone for meaning (e.g. map categories also have labels).
- The focus ring is 2px `rust`, offset 3px. Don't remove it.

---

## Typography

| Use                   | Font                  | Weights  | Notes                                               |
| --------------------- | --------------------- | -------- | --------------------------------------------------- |
| Headings, display     | **Fraunces** (serif)  | 500–700  | `font-serif`, `tracking-tight`; italic for taglines |
| Body, UI              | **Source Sans 3**     | 400, 600 | 16–18px, line-height ~1.6                           |
| Kickers / eyebrows    | Source Sans 3         | 400–600  | `text-xs uppercase tracking-[0.16em–0.22em]`        |
| Code / color values   | System mono           | —        | Brand page only                                     |

Both fonts are self-hosted via `@fontsource`. The logo lettering is custom and is **not** a font.
Don't hunt for a western/slab display face to imitate it in headings; the contrast between the
lively mark and the calm Fraunces is the point.

Scale in use: `text-xs` kickers → `text-sm` meta → `text-lg` lede → `text-2xl/3xl` section
headings → `text-4xl/5xl` page titles.

---

## Layout & components

- **Container:** `mx-auto max-w-5xl px-4`. One column of content, generous vertical rhythm
  (`py-12`–`py-16` between sections).
- **Corners:** square. The only rounded elements are filter chips (`rounded-full`) and the
  app icon itself.
- **Cards:** `border border-line bg-surface`, padding `p-5`/`p-6`. A colored top bar
  (`border-t-2 border-rust` or a `h-1.5 bg-rust` strip) marks featured or grouped content.
- **Signature rule:** a 4px `rust` bar over a 1px `ochre` hairline, under the site header. Reuse it
  sparingly to open major sections or printed pieces.
- **Section headers:** numbered kicker (`01`, `02` in `rust`), Fraunces `h2`, `muted` lede.
- **Buttons:**
  - Primary: `bg-rust text-surface hover:bg-rust-deep`
  - Secondary: `border-2 border-ember-deep text-ember-deep hover:bg-ember-deep hover:text-surface`
  - Nature / tag: `bg-olive text-surface hover:bg-olive-deep`
  - Highlight badge: `bg-ochre text-ink`, uppercase, tracked
- **Header:** `surface` background, badge + text lockup, signature rule beneath.
- **Footer:** `ink` background, `surface` text, icon + light lockup, `ochre` accent.
- **No** drop shadows, gradients, or glassmorphism. Flat color and hairlines carry the look.

---

## Imagery & illustration

- Prefer real photos of the district: brick, rail, grain elevators, makers at work, the Bridgers
  behind it all. Warm, natural light; avoid heavy filters.
- Photos sit in plain frames (`border border-line`), no rounded corners.
- Illustration (if commissioned) should borrow the logo's language: flat shapes, the five brand
  colors, simple line detail. No gradients.
- Never place the primary logo or badge directly on a photo.

## Maps

Map chrome uses brand tokens from `src/data/brand.ts`: the boundary is an `ember` fill with a
`rust` stroke, and the “you are here” marker is `ink` with an `ochre` ring. Category pins
(`src/data/place-categories.ts`) intentionally use a separate, high-distinction palette so
categories stay distinguishable. Don't force those into brand colors.

---

## Voice

- **Neighborly.** Talk like a neighbor over the fence. “We” and “our block,” not “stakeholders.”
- **Rooted.** Use real history and real names: the brewery, the rail line, the elevators,
  N. Wallace Ave.
- **Plainspoken.** Short sentences, concrete details, no marketing superlatives.
- Tagline: *From Lager to Legacy.* Set it in Fraunces italic, `olive`.

---

## Changing the system

1. Add or change a color in **both** `src/styles/global.css` and `src/data/brand.ts`.
2. Add it to `coreSwatches` / `functionalSwatches` so it appears on `/brand`, and add any
   important text pairing to the contrast table there.
3. Don't introduce one-off hex values in components. If a color is worth using, it's worth a token.
