# Logo sources & vector pipeline

The site's logos (`public/brand/*.svg`) are traced from AI-generated raster art in `sources/`.
This folder holds everything needed to redo that when the logo changes.

## Sources

| File                 | Used for                                                        |
| -------------------- | --------------------------------------------------------------- |
| `logo-sheet-v2.jpg`  | **Primary logo** (current). Its favicon is wrong — ignore it.   |
| `badge-large-v2.jpg` | **Badge** (current), drawn large in the center of the sheet.    |
| `icon-v1.png`        | **Icon** (current), cut from v1. Reference for the hand rebuild.|
| `logo-sheet-v1.jpg`  | First concept sheet. History only.                              |

## Rebuild

Needs [uv](https://docs.astral.sh/uv/) and Node (for `npx svgo`). From the repo root:

```sh
uv run --python 3.12 --with-requirements design/logo/pipeline/requirements.txt \
  design/logo/pipeline/build.py
```

Python 3.12 matters: vtracer segfaults on 3.14. A run takes about a minute and writes:

- `public/brand/northside-bozeman-{logo-primary,logo-badge,icon}.svg` and matching `.png` downloads
- `public/favicon.svg`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
- `.trace-work/compare/` — source vs. SVG side-by-sides and on-dark renders. **Look at these
  before committing.** (`.trace-work/` is gitignored scratch.)

Rerunning on unchanged sources reproduces the committed SVGs byte for byte.

## Changing the logo

1. **Get good source art.** Ask the image model for each logo *alone*, large, centered, on a flat
   plain off-white background with no texture or shadows. Bigger is better: the trace can't add detail.
2. Save it into `sources/` with a versioned name (`logo-sheet-v3.jpg`) and point `SRC` in
   `pipeline/common.py` at it. Update the crop box `(x0, y0, x1, y1)` around the logo, and add
   blank boxes for any neighbouring art that pokes into the crop.
3. If the colors changed, update the source → brand color map (`FG` in `pipeline/quantize2.py`).
   Find source colors with a quick k-means on the crop. Every output fill should be a brand token
   (see `DESIGN.md`); the one extra is terracotta `#b0502e` for mountain faces.
4. Run the build and check `.trace-work/compare/`. Tune the vtracer settings (`TRACE` in
   `pipeline/build.py`) only if letterforms look lumpy or details drop out.
5. **The icon is special.** It's too small to trace cleanly, so `pipeline/icon_build.py` rebuilds
   it from a cleaned label map plus hand-placed geometry: the tile radius, a notch repair on the
   right edge, the ridge line, and both "M" glyphs. A new icon design means re-tuning those
   coordinates, or simply drawing the icon by hand as SVG.
6. Update `Logo.astro` width/height if the SVG viewBox changed, then commit the SVGs, PNGs,
   favicons, and the new source.

## Pipeline files

- `common.py` — source paths, crop boxes, brand palette
- `quantize2.py` — upscale 3×, mask out paper, snap pixels to palette classes, clean specks
- `tracer.py` — vtracer wrapper, fill snapping, SVG tidy, `render()` via resvg
- `icon.py`, `icon_build.py` — icon quantize + geometric rebuild (`quantize.py` is a helper it uses)
- `compare.py` — side-by-side / on-dark review images
- `svgo.config.mjs` — minification (keeps `<title>` and `viewBox`)
- `build.py` — runs all of the above and exports rasters
