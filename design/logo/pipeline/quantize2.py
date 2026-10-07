"""Two-stage quantizer:
1. foreground mask = smooth threshold of Lab distance from paper color (clean outer contours)
2. colour classes assigned only from confident interior pixels, then propagated to edges.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2lab
from skimage.morphology import disk
from common import load, hex2rgb, BG

FG = {
    'rust':       ('#9e2e21', '#a62b1d'),
    'ember':      ('#d9620a', '#d96b07'),
    'olive':      ('#7c7633', '#5c6f3b'),
    'ochre':      ('#e5a02c', '#ebaf17'),
    'terracotta': ('#b15330', '#b0502e'),
}
OPEN_R = {'rust': 1, 'ember': 1, 'olive': 2, 'ochre': 3, 'terracotta': 3}


def fill_from(lbl, valid):
    _, (iy, ix) = ndimage.distance_transform_edt(~valid, return_indices=True)
    return lbl[iy, ix]


def remove_small(mask, min_area):
    cc, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(np.ones_like(cc), cc, index=np.arange(1, n + 1))
    return mask & ~np.isin(cc, np.where(sizes < min_area)[0] + 1)


def process(name, S=3, sigma=1.5, thr=28.0, mask_smooth=1.5, edge_margin=2.5, smooth=2.0,
            fg=FG, open_r=OPEN_R, min_area=None, pad=40, src=None, tag=''):
    if src is None:
        src = load(name)
    src = ndimage.median_filter(src, size=(3, 3, 1))
    im = Image.fromarray(src).resize((src.shape[1] * S, src.shape[0] * S), Image.LANCZOS)
    a = ndimage.gaussian_filter(np.asarray(im).astype(np.float32), (sigma, sigma, 0))
    H, W = a.shape[:2]
    lab = np.empty_like(a)
    for y in range(0, H, 500):
        lab[y:y + 500] = rgb2lab(a[y:y + 500] / 255)
    bglab = rgb2lab(BG.reshape(1, 1, 3) / 255).reshape(3)
    dist = np.linalg.norm(lab - bglab, axis=2)
    dist = ndimage.gaussian_filter(dist, mask_smooth)
    fgm = dist > thr
    if min_area is None:
        min_area = 12 * S * S
    fgm = remove_small(fgm, min_area)
    fgm = ~remove_small(~fgm, min_area)  # fill tiny holes

    names = list(fg)
    P = np.array([rgb2lab(hex2rgb(fg[n][0]).reshape(1, 1, 3) / 255).reshape(3) for n in names])
    d = np.stack([np.linalg.norm(lab - P[i], axis=2) for i in range(len(names))], 0)
    lbl = d.argmin(0).astype(np.int16)
    interior = ndimage.distance_transform_edt(fgm) > edge_margin * S
    valid = interior.copy()
    for ci, nm in enumerate(names):
        m = (lbl == ci) & valid
        op = ndimage.binary_opening(m, structure=disk(open_r.get(nm, 1)))
        valid &= ~(m & ~op)
    lbl = fill_from(lbl, valid)
    # smooth fg-fg boundaries
    best = np.full(lbl.shape, -1.0, np.float32)
    out = np.zeros_like(lbl)
    for ci in range(len(names)):
        f = ndimage.gaussian_filter((lbl == ci).astype(np.float32), smooth)
        upd = f > best
        best[upd] = f[upd]; out[upd] = ci
    lbl = out
    # merge tiny colour islands into neighbours
    for ci in range(len(names)):
        m = (lbl == ci) & fgm
        small = m & ~remove_small(m, min_area)
        if small.any():
            lbl = fill_from(lbl, ~small)
    rgba = np.zeros((H, W, 4), np.uint8)
    stats = {}
    for ci, nm in enumerate(names):
        m = (lbl == ci) & fgm
        stats[nm] = round(float(m.mean()) * 100, 2)
        rgba[m, :3] = hex2rgb(fg[nm][1]); rgba[m, 3] = 255
    ys, xs = np.where(fgm)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sl = (slice(max(0, y0 - pad), y1 + pad), slice(max(0, x0 - pad), x1 + pad))
    Image.fromarray(rgba[sl]).save(f'{name}_quant{tag}.png')
    Image.fromarray(np.asarray(im)[sl]).save(f'{name}_srcup.png')
    print(name, rgba[sl].shape, json.dumps(stats))


if __name__ == '__main__':
    for n in sys.argv[1:]:
        process(n)
