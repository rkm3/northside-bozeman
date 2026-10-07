import os, re
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.morphology import disk
from quantize import classify, fill_invalid
from common import ICON_SRC, hex2rgb
import tracer as T

S = 8
TILE = (0, 1, 214, 216)  # x0, y0, x1, y1 in source px
RADIUS = 36
CLASSES = [('#a63624', '#a62b1d'), ('#dc6d11', '#d96b07'), ('#f9f4ed', '#fdfbfa'), ('#fac83b', '#ebaf17')]
OPEN_R = [10, 6, 6, 3]


def tile_mask(shape, s):
    m = Image.new('L', (shape[1], shape[0]), 0)
    x0, y0, x1, y1 = TILE
    ImageDraw.Draw(m).rounded_rectangle((x0 * s, y0 * s, x1 * s - 1, y1 * s - 1), RADIUS * s, fill=255)
    return np.asarray(m) > 127


def quant(sigma=2.0, smooth=4.0):
    src = Image.open(ICON_SRC).convert('RGBA')
    a = np.asarray(src).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3] / 255
    solid = alpha > 0.9
    # fill transparent/semi-transparent pixels (edge + notches) from nearest solid pixel
    _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    rgb = rgb[iy, ix]
    rgb = ndimage.median_filter(rgb.astype(np.uint8), size=(3, 3, 1))
    up = Image.fromarray(rgb).resize((src.width * S, src.height * S), Image.LANCZOS)
    up = ndimage.gaussian_filter(np.asarray(up).astype(np.float32), (sigma, sigma, 0))
    protos = [hex2rgb(c[0]) for c in CLASSES]
    lbl = np.empty(up.shape[:2], np.int16)
    for y in range(0, up.shape[0], 400):
        lbl[y:y + 400] = classify(up[y:y + 400], protos)
    for ci in range(len(CLASSES)):
        m = lbl == ci
        lbl[m & ~ndimage.binary_opening(m, structure=disk(OPEN_R[ci]))] = -1
    lbl = fill_invalid(lbl)
    best = np.full(lbl.shape, -1.0, np.float32); out = np.zeros_like(lbl)
    for ci in range(len(CLASSES)):
        f = ndimage.gaussian_filter((lbl == ci).astype(np.float32), smooth)
        u = f > best; best[u] = f[u]; out[u] = ci
    lbl = out
    for ci in range(len(CLASSES)):
        cc, n = ndimage.label(lbl == ci)
        sizes = ndimage.sum(np.ones_like(cc), cc, index=np.arange(1, n + 1))
        small = np.isin(cc, np.where(sizes < 30 * S)[0] + 1)
        lbl[small] = -1
    lbl = fill_invalid(lbl)
    img = np.zeros(lbl.shape + (3,), np.uint8)
    for ci, (_, out_hex) in enumerate(CLASSES):
        img[lbl == ci] = hex2rgb(out_hex)
    Image.fromarray(img).save('icon_quant.png')
    up8 = np.asarray(src.resize((src.width * S, src.height * S), Image.LANCZOS))
    Image.fromarray(up8).save('icon_srcup.png')


def build_svg(out='t_icon.svg', **kw):
    params = dict(filter_speckle=16, length_threshold=10, splice_threshold=60, corner_threshold=75)
    params.update(kw)
    T.trace('icon_quant.png', out, 'x', 1 / S, **params)
    s = open(out).read()
    paths = re.findall(r'<path fill="([^"]+)" d="([^"]+)"/>', s)
    x0, y0, x1, y1 = TILE
    w, h = x1 - x0, y1 - y0
    body = '\n'.join(f'<path fill="{f}" d="{d}"/>' for f, d in paths)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" role="img" '
           f'aria-label="Northside Bozeman">\n<title>Northside Bozeman</title>\n'
           f'<clipPath id="nb-icon-tile"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{RADIUS}"/></clipPath>\n'
           f'<g clip-path="url(#nb-icon-tile)">\n{body}\n</g>\n</svg>\n')
    open(out, 'w').write(svg)
    return svg, paths


if __name__ == '__main__':
    quant()
    svg, paths = build_svg()
    print(len(paths), os.path.getsize('t_icon.svg'))
