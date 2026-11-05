"""v11 art pass: a bigger, richer texture library (64x64 PS1-style, tiling).

Writes:
  assets/textures/v11/*.png   new textures (woods, tiles, ground cover, leaves, bark, exterior finishes)
  assets/textures/md/*.png    the Map Designer's base set, redrawn at 64x64 with more detail (same names, so every
                              surface painted with them in the designer improves automatically)
Run: python3 tools/make_v11_textures.py
"""
import os, math
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets/textures/v11/')
MD = os.path.join(ROOT, 'assets/textures/md/')
os.makedirs(OUT, exist_ok=True)
N = 64
R = np.random.default_rng(11)

def hx(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)
def save(a, path, alpha=None):
    a = np.clip(a, 0, 255).astype(np.uint8)
    if alpha is not None:
        a = np.dstack([a, np.clip(alpha, 0, 255).astype(np.uint8)])
    Image.fromarray(a).save(path)

def vnoise(n=N, cells=8, seed=0, octaves=3):
    """Tiling value noise in 0..1."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n)); amp = 1.0; tot = 0.0
    for o in range(octaves):
        c = cells * (2 ** o)
        g = rng.random((c, c))
        ys = np.arange(n) * c / n; y0 = ys.astype(int); fy = ys - y0
        fy = fy * fy * (3 - 2 * fy)
        y1 = (y0 + 1) % c
        A = g[y0][:, y0] ; B = g[y0][:, y1]; Cc = g[y1][:, y0]; D = g[y1][:, y1]
        fx = fy[None, :]; fyy = fy[:, None]
        v = (A * (1 - fx) + B * fx) * (1 - fyy) + (Cc * (1 - fx) + D * fx) * fyy
        out += v * amp; tot += amp; amp *= 0.5
    return out / tot

def lerp(a, b, t): return a + (b - a) * t[..., None]
def colorize(t, c0, c1): return lerp(hx(c0), hx(c1), t)
def grain(a, amt=6): return a + R.normal(0, amt, a.shape[:2])[..., None]
def quant(a, levels=24):         # a light posterise, for the PS1 palette feel
    return np.round(a / (256 / levels)) * (256 / levels)

# ------------------------------------------------------------------ woods
def planks(c_light, c_dark, rows=4, seed=1, gap='#1a120c', knots=2, stagger=True, vertical=False, worn=0.0):
    rng = np.random.default_rng(seed)
    a = np.zeros((N, N, 3))
    h = N // rows
    yy, xx = np.mgrid[0:N, 0:N]
    for r in range(rows):
        tone = rng.uniform(-0.18, 0.18)
        off = rng.uniform(0, 6.28)
        y = yy[r * h:(r + 1) * h]; x = xx[r * h:(r + 1) * h]
        # long grain lines, gently wavy, plus fine fibre noise
        g = 0.5 + 0.5 * np.sin((y - r * h) * 1.9 + np.sin(x * 0.11 + off) * 2.2 + off)
        g = g ** 2.2
        fib = vnoise(N, 16, seed + r)[r * h:(r + 1) * h]
        t = np.clip(0.3 + tone + 0.5 * g + 0.35 * (fib - 0.5), 0, 1)
        t = t * (1 - 0.35 * (np.sin((y - r * h) * 5.3 + x * 0.05 + off * 3) > 0.93))
        blk = colorize(t, c_dark, c_light)
        # knots
        for k in range(knots if rng.random() < 0.7 else 0):
            kx, ky = rng.uniform(0, N), r * h + rng.uniform(2, h - 2)
            d = np.hypot((x - kx) * 0.7, (y - ky) * 1.6)
            ring = 0.5 + 0.5 * np.cos(d * 1.6)
            m = np.clip(1 - d / 5.0, 0, 1)
            blk = blk * (1 - 0.45 * (m * ring)[..., None])
        a[r * h:(r + 1) * h] = blk
        a[r * h] = hx(gap)                                     # the seam between boards
        if r * h + 1 < N: a[r * h + 1] *= 0.82
        # butt joints, staggered
        jx = int((rng.uniform(0.15, 0.85) if stagger else 0.5) * N)
        a[r * h:(r + 1) * h, jx] = hx(gap)
        if jx + 1 < N: a[r * h:(r + 1) * h, jx + 1] *= 0.85
    if worn:
        w = vnoise(N, 6, seed + 50)
        a = a * (1 - worn * 0.35 * (w > 0.6)[..., None]) + worn * 30 * (w > 0.72)[..., None]
    a = grain(a, 4)
    if vertical: a = np.transpose(a, (1, 0, 2))
    return quant(a)

def parquet(c1, c2, seed=4):
    a = np.zeros((N, N, 3)); s = 8
    for by in range(0, N, s * 2):
        for bx in range(0, N, s * 2):
            for k in range(2):
                for j in range(4):
                    tone = R.uniform(0.85, 1.12)
                    c = hx(c1 if (j + k) % 2 else c2) * tone
                    if k == 0:   # horizontal slats
                        a[by + j * 2: by + j * 2 + 2, bx: bx + s] = c
                    else:        # vertical slats
                        a[by + s: by + 2 * s, bx + j * 2: bx + j * 2 + 2] = c
            a[by + s: by + 2 * s, bx + s: bx + 2 * s] = a[by: by + s, bx: bx + s][::-1].transpose(1, 0, 2)
            a[by: by + s, bx + s: bx + 2 * s] = a[by + s: by + 2 * s, bx: bx + s].transpose(1, 0, 2)
    a = a * (0.85 + 0.3 * vnoise(N, 16, seed))[..., None]
    a[::8] *= 0.7; a[:, ::8] *= 0.7
    return quant(grain(a, 4))

def bark(c_light, c_dark, seed=7, ridges=7, birch=False):
    yy, xx = np.mgrid[0:N, 0:N]
    n = vnoise(N, 8, seed, 4)
    if birch:
        base = colorize(np.clip(0.75 + 0.25 * n, 0, 1), c_dark, c_light)
        for k in range(14):       # dark horizontal lenticels
            y = R.integers(0, N); x0 = R.integers(0, N); L = R.integers(4, 14)
            for i in range(L): base[y % N, (x0 + i) % N] = hx('#2a2622'); base[(y + 1) % N, (x0 + i) % N] *= 0.7
        return quant(grain(base, 5))
    # deep vertical furrows that wander
    f = np.sin((xx + np.sin(yy * 0.2 + n * 6) * 3.0) * (2 * math.pi * ridges / N))
    t = np.clip(0.55 + 0.4 * f + 0.25 * (n - 0.5), 0, 1) ** 1.3
    a = colorize(t, c_dark, c_light)
    cracks = (np.abs(f) < 0.12) & (vnoise(N, 4, seed + 3) > 0.35)
    a[cracks] *= 0.45
    moss = vnoise(N, 6, seed + 9) > 0.72
    a[moss] = a[moss] * 0.5 + hx('#3e4a26') * 0.5
    return quant(grain(a, 5))

def log_end(seed=8):
    yy, xx = np.mgrid[0:N, 0:N]
    d = np.hypot(xx - 31.5, yy - 31.5) + vnoise(N, 6, seed) * 3
    t = 0.55 + 0.25 * np.sin(d * 1.5)
    a = colorize(np.clip(t, 0, 1), '#6a4a2c', '#c8a070')
    a[d > 28] = hx('#3a2a1c')
    a[(np.abs(xx - 31.5) < 1) & (d < 26) & (yy < 30)] *= 0.6        # a radial check crack
    return quant(grain(a, 4))

# ------------------------------------------------------------------ tiles
def tiles(c_tile, c_grout, n=4, var=0.06, hexes=False, seed=5, dirt=0.0, glaze=True):
    a = np.zeros((N, N, 3)); yy, xx = np.mgrid[0:N, 0:N]
    s = N // n
    if not hexes:
        for ty in range(n):
            for tx in range(n):
                c = hx(c_tile) * (1 + R.uniform(-var, var))
                a[ty * s:(ty + 1) * s, tx * s:(tx + 1) * s] = c
                if glaze:   # a soft highlight in one corner of each tile
                    a[ty * s + 2: ty * s + 4, tx * s + 2: tx * s + 6] += 14
        g = ((yy % s) < 1) | ((xx % s) < 1)
        a[g] = hx(c_grout)
    else:
        best = np.full((N, N), 1e9); d2 = np.full((N, N), 1e9); idx = np.zeros((N, N), int)
        cents = [(i * 16 + (j % 2) * 8, j * 16) for j in range(4) for i in range(4)]
        cols = [hx(c_tile) * (1 + R.uniform(-var, var)) for _ in cents]
        for k, (cx, cy) in enumerate(cents):
            dx = np.minimum(np.abs(xx - cx), N - np.abs(xx - cx)); dy = np.minimum(np.abs(yy - cy), N - np.abs(yy - cy))
            d = np.hypot(dx, dy * 1.12)
            m = d < best; d2 = np.where(m, best, np.minimum(d2, d)); best = np.where(m, d, best); idx = np.where(m, k, idx)
        for k in range(len(cents)): a[idx == k] = cols[k]
        a[(d2 - best) < 1.6] = hx(c_grout)
    if dirt:
        a = a * (1 - dirt * 0.4 * vnoise(N, 4, seed)[..., None])
    return quant(grain(a, 3))

def checker(c1, c2, n=4):
    yy, xx = np.mgrid[0:N, 0:N]; s = N // n
    m = ((yy // s + xx // s) % 2 == 0)
    a = np.where(m[..., None], hx(c1), hx(c2)).astype(float)
    a = a * (0.92 + 0.12 * vnoise(N, 8, 3))[..., None]
    return quant(grain(a, 3))

def terracotta():
    a = tiles('#a85a3a', '#5a4a3a', n=4, var=0.12, glaze=False, dirt=0.4)
    return a

def mosaic():
    a = np.zeros((N, N, 3)); s = 4
    pal = [hx('#d8e0e4'), hx('#9cb4c0'), hx('#e8e8e0'), hx('#6c8a9a')]
    for y in range(0, N, s):
        for x in range(0, N, s):
            a[y:y + s, x:x + s] = pal[R.integers(0, 4)] if R.random() < 0.3 else pal[2] * R.uniform(0.95, 1.03)
    a[::s] = hx('#8a8a84'); a[:, ::s] = hx('#8a8a84')
    return quant(a)

def linoleum(c1, c2):
    n = vnoise(N, 4, 21, 4)
    a = colorize(n, c1, c2)
    flecks = R.random((N, N)) > 0.93
    a[flecks] *= 0.75
    return quant(grain(a, 3))

# ------------------------------------------------------------------ ground cover and leaves
LEAF_COLS = ['#b8541c', '#d47a1e', '#c9a03a', '#8a3a18', '#6e5a2a', '#a8681c', '#e0b048', '#5e2e16']
def stamp_leaves(a, count, seed, cols=LEAF_COLS, size=(2.0, 3.6), alpha=None):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(count):
        cx, cy = rng.uniform(0, N), rng.uniform(0, N)
        ang = rng.uniform(0, math.pi); L = rng.uniform(*size); W = L * rng.uniform(0.45, 0.65)
        c = hx(cols[rng.integers(0, len(cols))]) * rng.uniform(0.8, 1.1)
        dx = (xx - cx + N / 2) % N - N / 2; dy = (yy - cy + N / 2) % N - N / 2          # wrapped, so it tiles
        u = dx * math.cos(ang) + dy * math.sin(ang); v = -dx * math.sin(ang) + dy * math.cos(ang)
        m = (u / L) ** 2 + (v / W) ** 2 < 1.0
        shade = 0.85 + 0.25 * (v / W)          # a midrib and a lit side
        a[m] = (c * shade[m][:, None])
        a[m & (np.abs(v) < 0.5)] *= 0.75
        if alpha is not None: alpha[m] = 255
    return a

def leaf_litter(base='#3a2e22', count=150, seed=31):
    n = vnoise(N, 8, seed)
    a = colorize(n, base, '#5a4a36')
    a = stamp_leaves(a, count, seed)
    a = stamp_leaves(a, count // 3, seed + 1, size=(1.4, 2.4))
    return quant(grain(a, 5))

def grass_leaves(count=26, seed=33):
    yy, xx = np.mgrid[0:N, 0:N]
    n = vnoise(N, 8, seed, 4)
    a = colorize(n, '#2a3820', '#56683a')
    blades = R.random((N, N)) > 0.55
    a[blades] *= R.uniform(0.7, 1.25, (blades.sum(), 1))
    dry = vnoise(N, 5, seed + 2) > 0.62
    a[dry] = a[dry] * 0.5 + hx('#7a6a3a') * 0.5
    a = stamp_leaves(a, count, seed + 3)
    return quant(grain(a, 6))

def forest_floor(seed=35):
    n = vnoise(N, 8, seed, 4)
    a = colorize(n, '#241c14', '#4a3a28')
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(220):                          # pine needles: short thin strokes
        x0, y0 = R.uniform(0, N), R.uniform(0, N); ang = R.uniform(0, math.pi); L = R.uniform(3, 6)
        for t in np.linspace(0, L, 8):
            x = int(x0 + math.cos(ang) * t) % N; y = int(y0 + math.sin(ang) * t) % N
            a[y, x] = hx('#8a6a3c') * R.uniform(0.7, 1.1)
    a = stamp_leaves(a, 70, seed + 1)
    moss = vnoise(N, 5, seed + 4) > 0.7
    a[moss] = a[moss] * 0.4 + hx('#3e5226') * 0.6
    return quant(grain(a, 5))

def mud(seed=37):
    n = vnoise(N, 6, seed, 4)
    a = colorize(n, '#2e241a', '#5a4630')
    wet = vnoise(N, 4, seed + 1) > 0.66
    a[wet] = a[wet] * 0.55 + hx('#3a3a40') * 0.45          # puddle sheen
    yy_, xx_ = np.mgrid[0:N, 0:N]
    ruts = np.abs(np.sin((xx_ + 3 * np.sin(yy_ * 2 * math.pi / N * 2)) * 2 * math.pi / N * 2)) < 0.08
    a[ruts & (vnoise(N, 4, seed + 5) > 0.45)] *= 0.86
    for _ in range(140):                                   # pebbles and clods
        x, y = R.integers(0, N, 2); a[y, x] = a[y, x] * 0.7 + hx('#6a5a44') * 0.3
    a = stamp_leaves(a, 18, seed + 2)
    return quant(grain(a, 6))

def gravel(seed=39, base='#5a564e', count=520):
    a = colorize(vnoise(N, 8, seed), '#3a362e', base)
    rng = np.random.default_rng(seed)
    for _ in range(count):
        x, y = rng.integers(0, N, 2); r_ = rng.integers(1, 3)
        c = hx(['#8a8478', '#6a665c', '#a49e90', '#4e4a42', '#7a6e5c'][rng.integers(0, 5)])
        a[y:y + r_, x:x + r_] = c
        if y + r_ < N: a[y + r_, x:x + r_] *= 0.6
    a = stamp_leaves(a, 10, seed + 3)
    return quant(grain(a, 4))

def asphalt_cracked(seed=41):
    a = colorize(vnoise(N, 16, seed), '#26262a', '#4a4a4e')
    speck = R.random((N, N)) > 0.8; a[speck] *= 1.25
    x = R.uniform(0, N); y = 0.0
    for _ in range(160):
        a[int(y) % N, int(x) % N] = hx('#141416'); y += 0.6; x += R.normal(0, 0.8)
    patch = vnoise(N, 3, seed + 1) > 0.7; a[patch] *= 0.75
    return quant(grain(a, 3))

def foliage(cols, seed, count=300, dark='#141a10', alpha=False):
    a = np.tile(hx(dark), (N, N, 1)).astype(float)
    al = np.zeros((N, N)) if alpha else None
    a = stamp_leaves(a, count, seed, cols=cols, size=(2.0, 4.2), alpha=al)
    a = a * (0.7 + 0.45 * vnoise(N, 4, seed + 1))[..., None]          # clumps in light and shadow
    return quant(grain(a, 5)), al

def needles(seed=43):
    a = np.tile(hx('#101810'), (N, N, 1)).astype(float)
    for _ in range(900):
        x0, y0 = R.uniform(0, N), R.uniform(0, N); ang = R.uniform(-0.6, 0.6) + math.pi / 2; L = R.uniform(2, 5)
        c = hx(['#1e3a22', '#2c4a2a', '#3a5a32', '#24402a', '#4a6a3a'][R.integers(0, 5)])
        for t in np.linspace(0, L, 6):
            a[int(y0 + math.sin(ang) * t) % N, int(x0 + math.cos(ang) * t) % N] = c
    a = a * (0.7 + 0.5 * vnoise(N, 4, seed))[..., None]
    return quant(grain(a, 4))

# ------------------------------------------------------------------ exterior finishes
def brick(c='#8a3e2c', mortar='#8a8478', rows=8, seed=45, soot=0.0):
    a = np.zeros((N, N, 3)); h = N // rows; w = h * 2
    for r in range(rows):
        off = (w // 2) * (r % 2)
        for b in range(-1, N // w + 1):
            x0 = b * w + off
            col = hx(c) * R.uniform(0.78, 1.15)
            if R.random() < 0.12: col = hx('#5a2a1e')
            for x in range(max(0, x0), min(N, x0 + w)): a[r * h:(r + 1) * h, x] = col
            if 0 <= x0 < N: a[r * h:(r + 1) * h, x0] = hx(mortar)
        a[r * h] = hx(mortar)
    a = a * (0.85 + 0.25 * vnoise(N, 16, seed))[..., None]
    if soot: a = a * (1 - soot * vnoise(N, 3, seed + 1))[..., None]
    return quant(grain(a, 5))

def siding(c='#9a9a94', boards=6, peel=0.0, seed=47, under='#6a5a46'):
    yy, xx = np.mgrid[0:N, 0:N]; h = N // boards
    t = (yy % h) / h
    a = np.tile(hx(c), (N, N, 1)) * (0.78 + 0.25 * t)[..., None]       # each lap board shaded top to bottom
    a[(yy % h) == 0] *= 0.55
    a = a * (0.9 + 0.15 * vnoise(N, 8, seed))[..., None]
    if peel:
        p = vnoise(N, 6, seed + 1, 4) > (1 - peel)
        a[p] = hx(under) * R.uniform(0.8, 1.1, (p.sum(), 1))
        edge = (vnoise(N, 6, seed + 1, 4) > (1 - peel - 0.03)) & ~p
        a[edge] = hx('#d8d8d0')
    streak = (vnoise(N, 2, seed + 2)[0][None, :] > 0.7) & (yy > N * 0.4)
    a[streak] *= 0.85
    return quant(grain(a, 4))

def shingles(c='#3a3634', seed=49, moss=0.15):
    a = np.zeros((N, N, 3)); rows = 8; h = N // rows; w = 8
    for r in range(rows):
        off = (w // 2) * (r % 2)
        for b in range(-1, N // w + 1):
            col = hx(c) * R.uniform(0.7, 1.2)
            for x in range(max(0, b * w + off), min(N, b * w + off + w)):
                a[r * h:(r + 1) * h, x] = col * np.linspace(1.15, 0.8, h)[:, None]
            if 0 <= b * w + off < N: a[r * h:(r + 1) * h, b * w + off] *= 0.5
        a[(r + 1) * h - 1] *= 0.45
    if moss:
        m = vnoise(N, 5, seed) > (1 - moss); a[m] = a[m] * 0.5 + hx('#4a5a2a') * 0.5
    a = stamp_leaves(a, 8, seed + 2)
    return quant(grain(a, 4))

def concrete(c='#8a8880', seed=51, cracks=True):
    a = colorize(vnoise(N, 8, seed, 4), '#5e5c56', c)
    a[R.random((N, N)) > 0.9] *= 0.85
    if cracks:
        x = R.uniform(0, N); y = 0.0
        for _ in range(110): a[int(y) % N, int(x) % N] *= 0.55; y += 0.6; x += R.normal(0, 0.9)
    stain = vnoise(N, 3, seed + 1) > 0.68; a[stain] *= 0.8
    return quant(grain(a, 4))

def plaster(c='#d0c8b8', seed=53):
    a = colorize(vnoise(N, 8, seed, 4), '#a8a090', c)
    return quant(grain(a, 3))

def carpet(c1, c2, seed=55):
    n = vnoise(N, 16, seed, 2)
    a = colorize(n, c1, c2)
    a = a * (0.9 + 0.2 * (R.random((N, N)) > 0.5))[..., None]
    return quant(a)

def wallpaper_stripe(c1, c2, c3, seed=57):
    yy, xx = np.mgrid[0:N, 0:N]
    a = np.where(((xx // 4) % 4 == 0)[..., None], hx(c2), hx(c1)).astype(float)
    flower = ((xx % 16 - 8) ** 2 + (yy % 16 - 8) ** 2) < 4
    a[flower] = hx(c3)
    a = a * (0.9 + 0.12 * vnoise(N, 4, seed))[..., None]
    return quant(grain(a, 3))

def metal(seed=59):
    a = colorize(vnoise(N, 16, seed), '#4a4c50', '#8a8c90')
    rust = vnoise(N, 5, seed + 1) > 0.7; a[rust] = a[rust] * 0.4 + hx('#7a3a1a') * 0.6
    return quant(grain(a, 4))

def leaf_decal(seed=61, count=45):
    """Alpha decal: a loose drift of fallen leaves, for scattering on yards, porches, drives and floors by doors."""
    a = np.zeros((N, N, 3)); al = np.zeros((N, N))
    yy, xx = np.mgrid[0:N, 0:N]
    rng = np.random.default_rng(seed)
    for _ in range(count):
        # bias toward the middle so the drift has a soft edge
        r_ = abs(rng.normal(0, 13)); th = rng.uniform(0, 6.28)
        cx, cy = 32 + math.cos(th) * r_, 32 + math.sin(th) * r_
        ang = rng.uniform(0, math.pi); L = rng.uniform(2.0, 3.6); W = L * 0.55
        c = hx(LEAF_COLS[rng.integers(0, len(LEAF_COLS))]) * rng.uniform(0.75, 1.05)
        u = (xx - cx) * math.cos(ang) + (yy - cy) * math.sin(ang); v = -(xx - cx) * math.sin(ang) + (yy - cy) * math.cos(ang)
        m = (u / L) ** 2 + (v / W) ** 2 < 1.0
        a[m] = c * (0.85 + 0.25 * (v[m] / W))[:, None]; al[m] = 255
    return quant(a), al

# ------------------------------------------------------------------ write everything
T = {
    # woods
    'oak_planks': planks('#b08458', '#6a4628', seed=1),
    'pine_planks': planks('#d0a874', '#8a6238', seed=2, knots=3),
    'walnut_planks': planks('#6a4a32', '#2e1e14', seed=3),
    'weathered_boards': planks('#8a8070', '#4a4238', seed=4, worn=0.6, gap='#141210'),
    'porch_boards': planks('#9a8a74', '#56483a', seed=5, rows=5, worn=0.4),
    'barn_red_boards': planks('#8a3a2a', '#4a1e16', seed=6, rows=4, worn=0.5, vertical=True),
    'wood_panel': planks('#8a6440', '#4a3020', seed=7, rows=4, stagger=False, vertical=True),
    'furniture_oak': planks('#a07848', '#6a4a2a', seed=8, rows=2, knots=1, stagger=False),
    'furniture_walnut': planks('#5a3a24', '#2a1a10', seed=9, rows=2, knots=1, stagger=False),
    'painted_white_wood': planks('#d8d4c8', '#a8a498', seed=10, rows=4, knots=0, worn=0.3, gap='#6a665c'),
    'parquet': parquet('#a07448', '#7a5232'),
    'bark_oak': bark('#6a5a48', '#2a2018', seed=12),
    'bark_pine': bark('#8a5a3a', '#3a2214', seed=13, ridges=5),
    'bark_birch': bark('#e0dcd0', '#a8a49a', seed=14, birch=True),
    'log_end': log_end(),
    # tiles
    'tile_white': tiles('#e4e4dc', '#9a9a90', n=4),
    'tile_white_small': tiles('#e8e8e2', '#a0a098', n=8),
    'tile_blue': tiles('#7a9aaa', '#d8d8d0', n=4, var=0.08),
    'tile_green': tiles('#6a8a6a', '#c8c8b8', n=8, var=0.1),
    'tile_hex': tiles('#e0dcd0', '#5a5650', n=5, hexes=True),
    'tile_hex_dirty': tiles('#c8c0a8', '#3a3630', n=5, hexes=True, dirt=0.6),
    'checker_bw': checker('#e8e4d8', '#2a2a2c'),
    'checker_red': checker('#e0d8c8', '#8a2a24'),
    'terracotta': terracotta(),
    'mosaic': mosaic(),
    'lino_beige': linoleum('#b8a888', '#d8c8a8'),
    'lino_green': linoleum('#6a7a5a', '#9aaa86'),
    # ground
    'leaf_litter': leaf_litter(),
    'leaf_litter_wet': leaf_litter('#1e1a14', 180, 32),
    'grass_leaves': grass_leaves(),
    'grass_dead': grass_leaves(60, 34) * np.array([1.15, 1.0, 0.75]),
    'forest_floor': forest_floor(),
    'mud': mud(),
    'gravel_v11': gravel(),
    'gravel_dirt': gravel(40, '#6a5a44', 300),
    'asphalt_cracked': asphalt_cracked(),
    # exterior
    'brick_red': brick(),
    'brick_brown': brick('#6a4a36', '#7a7268', seed=46, soot=0.3),
    'siding_gray_peel': siding('#9a9c98', peel=0.28),
    'siding_white': siding('#d8d6cc', peel=0.08, seed=48),
    'siding_blue': siding('#6a7a8a', peel=0.15, seed=50),
    'siding_dark': siding('#4a4038', peel=0.0, seed=52),
    'shingle_dark': shingles(),
    'shingle_brown': shingles('#5a4434', 54, 0.25),
    'concrete_v11': concrete(),
    'plaster_v11': plaster(),
    'plaster_stained': plaster('#c0b498', 56) * (1 - 0.25 * (vnoise(N, 3, 58) > 0.6))[..., None],
    'metal_rust': metal(),
    # interiors
    'carpet_brown': carpet('#4a3424', '#6a4a30'),
    'carpet_blue': carpet('#2a3448', '#3e4a64'),
    'carpet_green': carpet('#2e3e2a', '#4a5a3a'),
    'wallpaper_floral': wallpaper_stripe('#c8b898', '#b0a080', '#8a4a3a'),
    'wallpaper_green': wallpaper_stripe('#8a9a7a', '#7a8a6a', '#d8c8a0'),
    # foliage
    'needles': needles(),
}
fol_or, _ = foliage(['#b8541c', '#d47a1e', '#a8681c', '#8a3a18', '#e09030'], 70, count=360)
fol_gold, _ = foliage(['#c9a03a', '#e0b048', '#a88a2a', '#d4b860', '#8a7a28'], 71, count=360)
fol_green, _ = foliage(['#2e4a26', '#3a5a2e', '#4a6a36', '#26401e'], 72, count=360)
fol_brown, _ = foliage(['#6e5a2a', '#5e2e16', '#8a5a2a', '#4a3a1e'], 73, count=300)
T.update({'leaves_orange': fol_or, 'leaves_gold': fol_gold, 'leaves_green': fol_green, 'leaves_brown': fol_brown})
for k, v in T.items():
    save(v, OUT + k + '.png')
dec, al = leaf_decal(); save(dec, OUT + 'leaf_drift.png', al)
dec2, al2 = leaf_decal(62, 70); save(dec2, OUT + 'leaf_drift_big.png', al2)
fern = np.zeros((N, N, 3)); fal = np.zeros((N, N))
for k in range(9):                                  # a fern frond sprite (alpha), for undergrowth cards
    ang = -1.2 + k * 0.3
    for t in np.linspace(0, 28, 60):
        x = 32 + math.sin(ang) * t; y = 62 - math.cos(ang) * t * 1.1
        for s in (-1, 1):
            for q in range(int(5 * (1 - t / 30)) + 1):
                xx = int(x + s * q * math.cos(ang)); yy = int(y + s * q * math.sin(ang) * 0.3 - q * 0.4)
                if 0 <= xx < N and 0 <= yy < N:
                    fern[yy, xx] = hx('#3a5a2a') * (0.7 + 0.4 * R.random()) if k % 3 else hx('#7a6a2a') * (0.8 + 0.3 * R.random())
                    fal[yy, xx] = 255
save(quant(fern), OUT + 'fern.png', fal)

# the Map Designer base set, redrawn (same file names)
MDSET = {
    'planks': T['oak_planks'], 'wood_dark': T['walnut_planks'], 'tile': T['tile_white'], 'grass': T['grass_leaves'],
    'dirt': T['mud'], 'gravel': T['gravel_v11'], 'asphalt': T['asphalt_cracked'], 'brick': T['brick_red'],
    'concrete': T['concrete_v11'], 'plaster': T['plaster_v11'], 'siding': T['siding_white'], 'shingle': T['shingle_dark'],
    'carpet': T['carpet_brown'], 'metal': T['metal_rust'], 'stone': concrete('#7a7870', 60, False) * (0.9 + 0.2 * (vnoise(N, 6, 61) > 0.5))[..., None],
    'wallpaper': T['wallpaper_floral'],
}
for k, v in MDSET.items():
    save(v, MD + k + '.png')
print('wrote %d textures to assets/textures/v11 and %d to md/' % (len(T) + 3, len(MDSET)))
