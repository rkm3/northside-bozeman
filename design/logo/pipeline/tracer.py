"""Trace a quantized RGBA PNG with vtracer, snap fills, tidy SVG, render comparisons."""
import io, re, sys
import numpy as np
import vtracer, resvg_py
from PIL import Image
from common import hex2rgb

PALETTE = ['#a62b1d', '#7e2015', '#d96b07', '#a85205', '#5c6f3b', '#46552c', '#ebaf17',
           '#fdfbfa', '#2c351f', '#b0502e']
NUM = re.compile(r'-?\d*\.?\d+(?:e-?\d+)?')


def snap(h):
    c = hex2rgb(h)
    return min(PALETTE, key=lambda p: ((hex2rgb(p) - c) ** 2).sum())


def tidy(svg, scale, decimals=1):
    """Apply translate transforms, scale coords, snap fills, drop width/height."""
    paths = []
    for m in re.finditer(r'<path ([^>]*)/>', svg):
        attrs = dict(re.findall(r'(\w[\w-]*)="([^"]*)"', m.group(1)))
        fill = snap(attrs['fill'])
        tx = ty = 0.0
        t = attrs.get('transform')
        if t:
            tx, ty = map(float, re.match(r'translate\(([-\d.]+),([-\d.]+)\)', t).groups())
        d = attrs['d']
        assert re.fullmatch(r'[MLCZ0-9.,\s-]+', d), d[:80]
        out, idx = [], [0]

        def repl(mm):
            v = float(mm.group(0))
            v = (v + (tx if idx[0] % 2 == 0 else ty)) * scale
            idx[0] += 1
            s = f'{v:.{decimals}f}'.rstrip('0').rstrip('.')
            return s if s not in ('-0', '') else '0'
        d = NUM.sub(repl, d)
        d = re.sub(r'\s+', ' ', d).replace(' Z', 'Z').strip()
        paths.append((fill, d))
    return paths


def build(paths, w, h, title):
    body = '\n'.join(f'<path fill="{f}" d="{d}"/>' for f, d in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" role="img" '
            f'aria-label="{title}">\n<title>{title}</title>\n{body}\n</svg>\n')


def render(svg, width, background=None):
    png = resvg_py.svg_to_bytes(svg_string=svg, width=width, background=background)
    return Image.open(io.BytesIO(bytes(png))).convert('RGBA')


def trace(quant_png, out_svg, title, scale, **kw):
    params = dict(colormode='color', hierarchical='stacked', mode='spline', filter_speckle=8,
                  color_precision=8, layer_difference=8, corner_threshold=60,
                  length_threshold=4.0, max_iterations=10, splice_threshold=45, path_precision=3)
    params.update(kw)
    raw = out_svg + '.raw.svg'
    vtracer.convert_image_to_svg_py(quant_png, raw, **params)
    svg = open(raw).read()
    im = Image.open(quant_png)
    paths = tidy(svg, scale)
    paths = [p for p in paths if p[0] != '#fdfbfa' or True]
    w, h = im.width * scale, im.height * scale
    s = build(paths, round(w, 1), round(h, 1), title)
    open(out_svg, 'w').write(s)
    return s, paths
