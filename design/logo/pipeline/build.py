"""Rebuild the brand logo SVGs and their raster exports from design/logo/sources.

Run from anywhere (see design/logo/README.md):
    uv run --python 3.12 --with-requirements design/logo/pipeline/requirements.txt \
        design/logo/pipeline/build.py

Writes:
    public/brand/northside-bozeman-{logo-primary,logo-badge,icon}.{svg,png}
    public/favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png
    .trace-work/compare/*  (side-by-side and on-dark previews to eyeball before committing)
"""
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from common import ROOT  # noqa: E402
import compare  # noqa: E402
import icon  # noqa: E402
import icon_build  # noqa: E402
import quantize2  # noqa: E402
import tracer  # noqa: E402

WORK = ROOT / '.trace-work'
BRAND = ROOT / 'public/brand'
PUBLIC = ROOT / 'public'
SVGO_CONFIG = Path(__file__).parent / 'svgo.config.mjs'

SCALE = 3  # quantize2 upscales 3x before tracing
TRACE = dict(filter_speckle=16, color_precision=8, layer_difference=8, corner_threshold=75,
             length_threshold=10, splice_threshold=60, max_iterations=10, path_precision=3)
LOGOS = {
    'primary': ('northside-bozeman-logo-primary', 'Northside Bozeman Business Group', 2400),
    'badge': ('northside-bozeman-logo-badge', 'Northside Bozeman', 1600),
}
ICON = ('northside-bozeman-icon', 512)
PAPER = (249, 245, 238, 255)


def svgo(src: Path, dest: Path) -> str:
    # npx rather than `pnpm dlx`: pnpm refuses to run dlx inside this repo's workspace.
    subprocess.run(['npx', '--yes', 'svgo@3', '--config', str(SVGO_CONFIG), '-i', str(src), '-o', str(dest)],
                   check=True)
    svg = dest.read_text().rstrip('\n')
    if 'role="img"' not in svg:
        svg = svg.replace('<svg ', '<svg role="img" ', 1)
    svg += '\n'
    dest.write_text(svg)
    return svg


def export_png(svg: str, width: int, dest: Path) -> Image.Image:
    img = tracer.render(svg, width)
    img.save(dest, optimize=True)
    return img


def export_favicons(icon_svg: str) -> None:
    (PUBLIC / 'favicon.svg').write_text(icon_svg)
    tracer.render(icon_svg, 256).save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    tracer.render(icon_svg, 32).save(PUBLIC / 'favicon-32.png', optimize=True)
    touch = Image.new('RGBA', (180, 180), PAPER)
    touch.alpha_composite(tracer.render(icon_svg, 160), (10, 10))
    touch.convert('RGB').save(PUBLIC / 'apple-touch-icon.png', optimize=True)


def main() -> None:
    WORK.mkdir(exist_ok=True)
    (WORK / 'compare').mkdir(exist_ok=True)
    os.chdir(WORK)

    for name, (slug, title, png_width) in LOGOS.items():
        quantize2.process(name, tag='2')
        tracer.trace(f'{name}_quant2.png', f'{name}.svg', title, 1 / SCALE, **TRACE)
        svg = svgo(WORK / f'{name}.svg', BRAND / f'{slug}.svg')
        export_png(svg, png_width, BRAND / f'{slug}.png')
        compare.compare(str(BRAND / f'{slug}.svg'), f'{name}_srcup.png', f'compare/{name}')

    slug, png_width = ICON
    icon.quant()
    icon_build.build(out='icon.svg')
    icon_svg = svgo(WORK / 'icon.svg', BRAND / f'{slug}.svg')
    export_png(icon_svg, png_width, BRAND / f'{slug}.png')
    export_favicons(icon_svg)
    compare.compare(str(BRAND / f'{slug}.svg'), 'icon_srcup.png', 'compare/icon')

    print(f'Done. Review {WORK / "compare"} before committing.')


if __name__ == '__main__':
    main()
