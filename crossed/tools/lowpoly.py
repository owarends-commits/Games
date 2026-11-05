"""PS1-style characters from the MakeHuman builds: the dense mesh collapsed onto a coarse grid (vertex clustering,
finer on the head), and the face drawn as a small flat texture instead of carried by geometry."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def _normals(P, T):
    N = np.zeros_like(P)
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(N, T[:, k], fn)
    return N / (np.linalg.norm(N, axis=1, keepdims=True) + 1e-12)


def lowpoly(prims, opt):
    """opt: cell (m, body), head_cell (m), head_from (m below the top where the finer grid starts)."""
    cell, hcell, hfrom = opt.get('cell', 0.045), opt.get('head_cell', 0.022), opt.get('head_from', 0.30)
    top = max(p['pos'][:, 1].max() for p in prims)
    out = []
    for p in prims:
        P, idx = p['pos'], p['idx'].reshape(-1, 3)
        fine = P[:, 1] > top - hfrom
        c = np.where(fine, hcell or 1.0, cell)[:, None]
        key = np.concatenate([np.floor(P / c).astype(np.int64), fine[:, None].astype(np.int64)], 1)
        if not hcell:                                       # the head keeps its (smoothed) shape
            key[fine, :3] = np.round(P[fine] * 1e4).astype(np.int64); key[fine, 3] = 2
        _, cid, cnt = np.unique(key, axis=0, return_inverse=True, return_counts=True)
        cid = cid.reshape(-1)
        n = cnt.size
        mean = np.zeros((n, 3)); np.add.at(mean, cid, P); mean /= cnt[:, None]
        rep = np.full(n, -1); rep[cid[::-1]] = np.arange(len(P))[::-1]          # first vertex of each cluster
        C = cid[idx]
        keep = (C[:, 0] != C[:, 1]) & (C[:, 1] != C[:, 2]) & (C[:, 0] != C[:, 2])
        T = idx[keep]
        if not len(T): continue
        # one vertex per (cluster, uv): positions/weights shared by the cluster so nothing tears when skinned
        used = np.unique(T)
        remap = -np.ones(len(P), int); remap[used] = np.arange(len(used))
        Pn = mean[cid[used]]
        CT = cid[T]
        Nc = _normals(mean, CT)                                                  # smooth over clusters
        r = rep[cid[used]]
        out.append(dict(p, pos=Pn, nrm=Nc[cid[used]], uv=p['uv'][used], jn=p['jn'][r], wt=p['wt'][r],
                        idx=remap[T].reshape(-1).astype(np.uint32)))
    return out


def drawn_face(sp, box, fill, size=(96, 122)):
    """A face painted like a late-90s texture: flat skin, bold lids and brows, a shaded nose and a clear mouth.
    Drawn big in base-body coordinates (eyes at x=+-0.308, y=7.284), then shrunk to `size`."""
    f = sp['drawn_face']
    x0, x1, y0, y1 = box
    S = 8
    W, H = size[0] * S, size[1] * S
    pt = lambda x, y: ((x - x0) / (x1 - x0) * W, (y1 - y) / (y1 - y0) * H)
    hexc = lambda h: tuple(int(h.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    skin = np.array(fill) * 255
    def shade(k): return tuple(int(v) for v in np.clip(skin * k, 0, 255))
    img = Image.new('RGB', (W, H), shade(1.0))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)

    def ell(cx, cy, rx, ry, col, a=255):
        (ax, ay), (bx, by) = pt(cx - rx, cy + ry), pt(cx + rx, cy - ry)
        d.ellipse((ax, ay, bx, by), fill=col + (a,))

    def line(pts, col, w, a=255):
        d.line([pt(*q) for q in pts], fill=col + (a,), width=int(w * S), joint='curve')

    def poly(pts, col, a=255):
        d.polygon([pt(*q) for q in pts], fill=col + (a,))

    dark = shade(0.62); mid = shade(0.8); light = shade(1.1)
    # planes of the face: temples, cheek hollows and jaw darker, so it reads 3D without the geometry
    for sx in (-1, 1):
        ell(sx * 0.58, 7.0, 0.16, 0.55, mid, 150)
        ell(sx * 0.36, 6.82, 0.12, 0.16, shade(0.9), 120)
    ell(0, 6.36, 0.36, 0.12, mid, 140)                                   # under the jaw
    ell(0, 7.75, 0.42, 0.12, light, 70)                                  # forehead catches light
    for sx in (-1, 1):
        ell(sx * 0.33, 6.98, 0.12, 0.08, hexc(f.get('blush', '#d08878')), f.get('blush_a', 60))
    img = Image.alpha_composite(img.convert('RGBA'), lay.filter(ImageFilter.GaussianBlur(S * 1.5)))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # eyes: socket shadow, heavy upper lid line, light lower lid
    for sx in (-1, 1):
        ex = sx * 0.308
        ell(ex, 7.31, 0.19, 0.11, dark, 90)
        ell(ex - sx * 0.02, 7.34, 0.17, 0.05, dark, 70)
        line([(ex - 0.15, 7.262), (ex - 0.08, 7.318), (ex + 0.02, 7.335), (ex + 0.13, 7.30), (ex + 0.16, 7.272)], (40, 26, 20), f.get('lid', 0.028))
        line([(ex - 0.12, 7.232), (ex, 7.215), (ex + 0.13, 7.236)], shade(0.7), 0.012, 160)
    ic = hexc(sp['pal'].get('eyes', '#5a4030'))
    for sx in (-1, 1):
        ex = sx * 0.308
        poly([(ex - 0.14, 7.27), (ex - 0.07, 7.325), (ex + 0.02, 7.34), (ex + 0.12, 7.31), (ex + 0.15, 7.275),
              (ex + 0.08, 7.225), (ex - 0.02, 7.215), (ex - 0.1, 7.232)], (226, 218, 205))
        ell(ex + sx * 0.005, 7.278, 0.052, 0.05, ic)
        ell(ex + sx * 0.005, 7.278, 0.022, 0.022, (16, 12, 10))
        ell(ex + sx * 0.005 - 0.015, 7.295, 0.01, 0.01, (240, 240, 240))
        line([(ex - 0.15, 7.262), (ex - 0.08, 7.318), (ex + 0.02, 7.335), (ex + 0.13, 7.30), (ex + 0.16, 7.272)], (40, 26, 20), f.get('lid', 0.028))
    # brows
    bc = hexc(f.get('brow', '#3a2818')); bt = f.get('brow_w', 0.05); ang = f.get('brow_angle', 0.0)
    for sx in (-1, 1):
        inner, outer = sx * 0.09, sx * 0.47
        poly([(inner, 7.43 - ang + bt * 0.6), (sx * 0.28, 7.49 + bt * 0.5), (outer, 7.44 + ang * 0.5),
              (outer, 7.43 + ang * 0.5), (sx * 0.28, 7.47 - bt * 0.5), (inner, 7.42 - ang - bt * 0.3)], bc)
    # nose: side shadows, a lit ridge, the shadow under it, nostrils
    for sx in (-1, 1):
        line([(sx * 0.07, 7.22), (sx * 0.085, 7.02), (sx * 0.12, 6.92)], dark, 0.03, 110)
        ell(sx * 0.065, 6.885, 0.032, 0.016, (60, 34, 28), 220)
    line([(0, 7.22), (0, 6.98)], light, 0.035, 90)
    ell(0, 6.86, 0.11, 0.025, dark, 130)
    # mouth
    lc = np.array(hexc(f.get('lips', '#a86a62')))
    mw = f.get('mouth_w', 0.2); turn = f.get('mouth_turn', 0.0)
    poly([(-mw, 6.715 + turn), (-0.06, 6.755), (0, 6.745), (0.06, 6.755), (mw, 6.715 + turn), (0, 6.722)], tuple(int(v) for v in lc * 0.8))
    poly([(-mw * 0.85, 6.712 + turn), (0, 6.722), (mw * 0.85, 6.712 + turn), (0, 6.665)], tuple(int(v) for v in lc))
    line([(-mw, 6.716 + turn), (-mw * 0.5, 6.719), (0, 6.722), (mw * 0.5, 6.719), (mw, 6.716 + turn)], (60, 30, 28), 0.016)
    ell(0, 6.638, 0.1, 0.022, dark, 110)
    line([(-0.07, 6.80), (0, 6.79), (0.07, 6.80)], shade(0.85), 0.02, 120)  # philtrum
    # stubble / freckles
    img = Image.alpha_composite(img, lay.filter(ImageFilter.GaussianBlur(S * 0.35)))
    if f.get('stubble'):
        rng = np.random.default_rng(3)
        a = np.zeros((H, W))
        yy, xx = np.mgrid[0:H, 0:W]
        bx = x0 + xx / W * (x1 - x0); by = y1 - yy / H * (y1 - y0)
        region = (by < 6.84) & (((bx / 0.5) ** 2 + ((by - 6.62) / 0.3) ** 2) < 1.2) & ~((np.abs(bx) < 0.22) & (np.abs(by - 6.715) < 0.06))
        a[region] = f['stubble'] * 0.3
        a *= rng.random((H, W)) > 0.35
        st = np.array(img).astype(float); sc = np.array(hexc(f.get('stubble_c', '#4a3828')))
        st[..., :3] = st[..., :3] * (1 - a[..., None]) + sc * a[..., None]
        img = Image.fromarray(st.astype(np.uint8))
    if f.get('freckles'):
        rng = np.random.default_rng(5); d2 = ImageDraw.Draw(img)
        for _ in range(60):
            x = rng.uniform(-0.42, 0.42); y = rng.uniform(6.92, 7.12)
            if abs(x) < 0.07: continue
            cx, cy = pt(x, y); d2.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=shade(0.78) + (255,))
    return img.convert('RGB').resize(size, Image.BOX)
