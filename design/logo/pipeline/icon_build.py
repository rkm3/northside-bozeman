"""Rebuild the icon as simplified polygons (painter's layers) from a cleaned label map."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure
import icon

S = icon.S
BLUR = 0.25
RUST, EMBER, CREAM, OCHRE = 0, 1, 2, 3
HEX = ['#a62b1d', '#d96b07', '#fdfbfa', '#ebaf17']


def labels():
    q = np.asarray(Image.open('icon_quant.png').convert('RGB')).astype(int)
    pal = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in HEX])
    lbl = np.argmin(((q[:, :, None, :] - pal[None, None]) ** 2).sum(-1), -1)
    H, W = lbl.shape
    yy, xx = np.mgrid[0:H, 0:W] / S
    # repair background-removal notch on the right edge: sky above slope, rust below
    notch = (xx > 176) & (yy > 58) & (yy < 108) & (lbl == CREAM)
    above = yy < 67 + (xx - 184) * (96 - 67) / (214 - 184)
    lbl[notch & above] = EMBER
    lbl[notch & ~above] = RUST
    # cream rim artifacts near the tile border
    tile = icon.tile_mask(lbl.shape, S)
    inner = ndimage.binary_erosion(tile, iterations=int(5 * S))
    bad = (lbl == CREAM) & ~inner
    _, (iy, ix) = ndimage.distance_transform_edt(bad, return_indices=True)
    lbl = np.where(bad, lbl[iy, ix], lbl)
    # clean ridge right of the arrow: (166,74) -> (183,67) -> (214,97)
    box = (xx > 163) & (yy > 55) & (yy < 112) & ((lbl == RUST) | (lbl == EMBER))
    ridge = np.where(xx < 183, 74 + (xx - 166) * (67 - 74) / (183 - 166), 67 + (xx - 183) * (97 - 67) / (214 - 183))
    lbl[box & (yy < ridge)] = EMBER
    lbl[box & (yy >= ridge)] = RUST
    # remove raster M glyphs; they are redrawn as vectors
    lbl[(xx > 41) & (xx < 78) & (yy > 48) & (yy < 78) & (lbl == RUST)] = EMBER
    lbl[(xx > 160) & (xx < 198) & (yy > 89) & (yy < 120)] = RUST
    return lbl


# slab-serif M on a 32 x 24 grid: thin left stem, thick left diagonal, thin right diagonal, thick right stem
M_GLYPH = np.array([
    (0, 0), (10, 0), (16.5, 13.5), (21, 0), (32, 0), (32, 3), (29, 3), (29, 21), (32, 21), (32, 24),
    (19.5, 24), (19.5, 21), (22, 21), (22, 8), (17.5, 20), (15.5, 20), (7, 6.5), (7, 21), (10, 21),
    (10, 24), (0, 24), (0, 21), (3, 21), (3, 3), (0, 3),
], float)


M_RUST = (44, 51, 31, 24)
M_OCHRE = (163.5, 92, 31, 25)


def m_glyph(x, y, w, h):
    return M_GLYPH * [w / 32, h / 24] + [x, y]


def polys(mask, tol):
    pad = 4 * S
    m = np.pad(mask, pad, mode='edge').astype(float)
    m = ndimage.gaussian_filter(m, S * BLUR)
    m = np.pad(m, 1)
    pad += 1
    out = []
    for c in measure.find_contours(m, 0.5):
        if len(c) < 8:
            continue
        p = measure.approximate_polygon(c, tol * S)
        p = (p[:, ::-1] - pad + 0.5) / S  # (x, y) in source px
        area = 0.5 * abs(np.dot(p[:-1, 0], p[1:, 1]) - np.dot(p[1:, 0], p[:-1, 1]))
        if area < 2:
            continue
        out.append(p[:-1] if np.allclose(p[0], p[-1]) else p)
    return out


def rounded(p, r):
    n = len(p)
    parts = []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        u, v = a - b, c - b
        lu, lv = np.linalg.norm(u), np.linalg.norm(v)
        d = min(r, 0.45 * lu, 0.45 * lv)
        s, e = b + u / lu * d, b + v / lv * d
        parts.append((s, b, e))
    f = lambda q: f'{q[0]:.2f}'.rstrip('0').rstrip('.') + ' ' + f'{q[1]:.2f}'.rstrip('0').rstrip('.')
    d = f'M{f(parts[0][2])}'
    for s, b, e in parts[1:] + parts[:1]:
        d += f'L{f(s)}Q{f(b)} {f(e)}'
    return d + 'Z'


def build(out='t_icon_poly.svg', tol=0.5, r=0.7):
    lbl = labels()
    layers = [
        (HEX[RUST], (lbl == RUST) | ndimage.binary_erosion(lbl == CREAM, iterations=S)),
        (HEX[CREAM], lbl == CREAM),
        (HEX[OCHRE], lbl == OCHRE),
    ]
    x0, y0, x1, y1 = icon.TILE
    w, h = x1 - x0, y1 - y0
    body = [f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="{HEX[EMBER]}"/>']
    count = 1
    for fill, m in layers:
        ps = polys(m, tol)
        d = ''.join(rounded(p, r) for p in ps)
        if not d:
            continue
        body.append(f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/>')
        count += 1
        print(fill, len(ps), 'contours', sum(len(p) for p in ps), 'vertices')
        if fill == HEX[RUST]:
            body.append(f'<path fill="{HEX[RUST]}" d="{rounded(m_glyph(*M_RUST), 0.5)}"/>')
    body.append(f'<path fill="{HEX[OCHRE]}" d="{rounded(m_glyph(*M_OCHRE), 0.5)}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" role="img" '
           f'aria-label="Northside Bozeman">\n<title>Northside Bozeman</title>\n'
           f'<clipPath id="nb-icon-tile"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{icon.RADIUS}"/></clipPath>\n'
           f'<g clip-path="url(#nb-icon-tile)">\n' + '\n'.join(body) + '\n</g>\n</svg>\n')
    open(out, 'w').write(svg)
    print(out, os.path.getsize(out))


if __name__ == '__main__':
    build()
