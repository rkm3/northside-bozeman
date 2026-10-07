"""Crop, upscale, classify into palette classes, clean up, write RGBA PNG for tracing."""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.morphology import disk
from common import load, hex2rgb

# class name -> (source prototype colors, output hex). bg -> transparent.
CLASSES = {
    'bg':         (['#f7f4ea'], None),
    'rust':       (['#9e2e21'], '#a62b1d'),
    'rust-deep':  (['#7f3024'], '#7e2015'),
    'ember':      (['#d9620a'], '#d96b07'),
    'olive':      (['#7c7633'], '#5c6f3b'),
    'ochre':      (['#e5a02c'], '#ebaf17'),
    'terracotta': (['#b15330'], '#b0502e'),
}
# opening radius (in upscaled px) per class: removes thin anti-alias slivers
OPEN_R = {'bg': 1, 'rust': 1, 'ember': 1, 'olive': 2, 'rust-deep': 3, 'ochre': 3, 'terracotta': 3}


def classify(img, protos, margin=10.0):
    """img float32 HxWx3 (RGB). Pure nearest class, unless a 2-class blend explains
    the pixel much better, in which case assign the dominant endpoint."""
    H, W, _ = img.shape
    p = img.reshape(-1, 3)
    P = np.array(protos, np.float32)
    n = len(P)
    d = np.stack([np.linalg.norm(p - P[i], axis=1) for i in range(n)], 1)
    pure = d.argmin(1)
    best_pure = d.min(1)
    best_mix = np.full(len(p), np.inf, np.float32)
    mix_lbl = pure.copy()
    for a in range(n):
        for b in range(a + 1, n):
            ab = P[a] - P[b]
            t = np.clip(((p - P[b]) @ ab) / (ab @ ab), 0, 1)
            r = np.linalg.norm(p - (P[b] + t[:, None] * ab), axis=1)
            inner = (t > 0.12) & (t < 0.88)
            r = np.where(inner, r, np.inf)
            better = r < best_mix
            best_mix = np.where(better, r, best_mix)
            mix_lbl = np.where(better, np.where(t >= 0.5, a, b), mix_lbl)
    use_mix = best_mix < best_pure - margin
    return np.where(use_mix, mix_lbl, pure).reshape(H, W)


def fill_invalid(lbl):
    bad = lbl < 0
    if not bad.any():
        return lbl
    _, (iy, ix) = ndimage.distance_transform_edt(bad, return_indices=True)
    return lbl[iy, ix]


def process(name, S=3, sigma=1.0, smooth=1.6, min_area=None, classes=CLASSES, open_r=OPEN_R, pad=40):
    src = load(name)
    src = ndimage.median_filter(src, size=(3, 3, 1))
    im = Image.fromarray(src)
    im = im.resize((im.width * S, im.height * S), Image.LANCZOS)
    a = ndimage.gaussian_filter(np.asarray(im).astype(np.float32), (sigma, sigma, 0))
    names = list(classes)
    protos, owner = [], []
    for ci, nm in enumerate(names):
        for h in classes[nm][0]:
            protos.append(hex2rgb(h)); owner.append(ci)
    owner = np.array(owner)
    # classify in chunks of rows
    lbl = np.empty(a.shape[:2], np.int16)
    step = 400
    for y in range(0, a.shape[0], step):
        lbl[y:y + step] = owner[classify(a[y:y + step], protos)]
    # thin-sliver removal per class
    for ci, nm in enumerate(names):
        r = open_r.get(nm, 1)
        m = lbl == ci
        op = ndimage.binary_opening(m, structure=disk(r))
        lbl[m & ~op] = -1
    lbl = fill_invalid(lbl)
    # boundary smoothing: blur one-hot maps, argmax
    best = np.full(lbl.shape, -1.0, np.float32)
    out = np.zeros_like(lbl)
    for ci in range(len(names)):
        f = ndimage.gaussian_filter((lbl == ci).astype(np.float32), smooth)
        upd = f > best
        best[upd] = f[upd]; out[upd] = ci
    lbl = out
    # small component removal (merge into neighbours)
    if min_area is None:
        min_area = 12 * S * S
    for ci in range(len(names)):
        cc, n = ndimage.label(lbl == ci)
        if n == 0:
            continue
        sizes = ndimage.sum(np.ones_like(cc), cc, index=np.arange(1, n + 1))
        small = np.isin(cc, np.where(sizes < min_area)[0] + 1)
        lbl[small] = -1
    lbl = fill_invalid(lbl)
    # stats + RGBA
    rgba = np.zeros(lbl.shape + (4,), np.uint8)
    stats = {}
    for ci, nm in enumerate(names):
        m = lbl == ci
        stats[nm] = round(float(m.mean()) * 100, 2)
        out_hex = classes[nm][1]
        if out_hex is None:
            continue
        rgba[m, :3] = hex2rgb(out_hex); rgba[m, 3] = 255
    # tight crop + pad
    ys, xs = np.where(rgba[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = rgba[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    Image.fromarray(rgba).save(f'{name}_quant.png')
    # matching source crop (upscaled) for comparison
    srcup = np.asarray(im)[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    Image.fromarray(srcup).save(f'{name}_srcup.png')
    print(name, rgba.shape, json.dumps(stats))


if __name__ == '__main__':
    for n in sys.argv[1:]:
        process(n)
