"""v12 textures: the ones described in the sample cabin, plus church, Mass, office, storage, graveyard and plant surfaces.

Writes assets/textures/v12/*.png (64x64, tiling, PS1 palette), built with the same helpers as the v11 set so they sit together.
The Map Designer embeds these, and the game finds them by name (b:<name>).
Run: python3 tools/make_v12_textures.py   (it re-runs make_v11_textures first; that output is deterministic)
"""
import os, sys, math
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import make_v11_textures as v
from make_v11_textures import N, hx, save, vnoise, colorize, grain, quant, planks, tiles, concrete, carpet, brick, foliage, stamp_leaves

OUT = os.path.join(v.ROOT, 'assets/textures/v12/')
os.makedirs(OUT, exist_ok=True)
R = np.random.default_rng(12)
YY, XX = np.mgrid[0:N, 0:N]

def mix(a, b, t): return a * (1 - t[..., None]) + b * t[..., None] if np.ndim(t) else a * (1 - t) + b * t

# ------------------------------------------------------------------ the cabin: white wood, worn inside, ruined outside
def whitewash(seed, chip, grime, torn):
    """Horizontal white-painted lap boards over grey weathered wood.
    chip: how much paint has flaked off (it goes first along the board edges); grime: dust, rain runs, dirt toward the
    ground; torn: boards half ripped away (dark wall cavity, splintered ends, one board hanging off a nail)."""
    rng = np.random.default_rng(seed)
    rows = 5; h = N // rows + (1 if N % rows else 0)
    wood = colorize(vnoise(N, 10, seed, 3), '#4e483e', '#8e8678')                       # bare grey wood under the paint
    wood = wood * (0.85 + 0.25 * (0.5 + 0.5 * np.sin(XX * 0.9 + vnoise(N, 4, seed + 9) * 8)))[..., None] # its grain runs along the board
    a = np.zeros((N, N, 3))
    by = YY % h                                                                         # position inside each board
    for r in range(rows + 1):
        tone = rng.uniform(0.94, 1.03)
        sl = slice(r * h, min(N, (r + 1) * h))
        a[sl] = hx('#e8e5dc') * tone
    a = a * (1.04 - 0.2 * (by / h))[..., None]                                          # the lap: lit at the top, shadowed under the board above
    # peeling: big flakes, most likely near the lower edge of each board, never pin-prick speckle
    edge_w = np.clip(1.0 - np.minimum(by, h - by) / (h * 0.5), 0, 1)
    n = vnoise(N, 6, seed + 1, 3) * 0.7 + 0.3 * edge_w
    gone = n > (1 - chip)
    lift = (n > (1 - chip - 0.05)) & ~gone
    a = np.where(gone[..., None], wood, a)
    a[lift] = hx('#f6f3ea')
    shadow = np.roll(gone, 1, axis=0) & ~gone                                           # a little shadow under each flake's lip
    a[shadow] *= 0.78
    a[by == 0] = hx('#2e2a24'); a[by == 1] *= 0.72                                      # the dark line under each lap
    if grime:
        a = a * (1 - grime * 0.28 * (YY / N) ** 1.5)[..., None]
        for _ in range(int(6 * grime)):                                                 # soft rain runs, faded at the ends
            x = int(rng.integers(0, N)); y0 = int(rng.integers(0, N // 2)); ln = int(rng.integers(14, 40))
            for k in range(ln):
                f = 1 - 0.14 * math.sin(math.pi * k / ln)
                a[(y0 + k) % N, x] *= f
        dirt = vnoise(N, 4, seed + 3) > 0.66
        a[dirt] = a[dirt] * 0.85 + hx('#6a5a42') * 0.15
    if torn:
        # boards ripped away: the dark cavity behind, a stud, ragged splintered ends
        for (r, x0, x1) in [(1, 4, 30), (3, 30, 58)]:
            y0, y1 = r * h, min(N, (r + 1) * h)
            for x in range(x0, x1):
                a[y0:y1, x] = hx('#0c0a08') * (0.8 + 0.5 * (x % 7 == 0))
            a[y0:y1, (x0 + x1) // 2:(x0 + x1) // 2 + 3] = hx('#3a3026')               # a stud
            for x in (x0, x1 - 1):
                for y in range(y0, y1):
                    xx = x + int(rng.integers(-2, 3)) * (1 if x == x0 else -1)
                    if 0 <= xx < N: a[y, xx] = hx('#a08e70')                           # splintered, unpainted end grain
        # one board hanging off a nail across the lower gap
        ang = 0.42
        for t in np.linspace(0, 30, 260):
            for k in range(h - 2):
                x = int(31 + math.cos(ang) * t - math.sin(ang) * k); y = int(3 * h + 1 + math.sin(ang) * t + math.cos(ang) * k)
                if 0 <= x < N and 0 <= y < N:
                    a[y, x] = hx('#e2dfd6') * (1.0 - 0.25 * (k > h - 5)) if (int(t) % 11) else hx('#8e8678')
        a[3 * h + 2:3 * h + 4, 31:33] = hx('#2a2a2a')                                  # the nail it hangs from
    return quant(grain(a, 3))

def vnoise_rect(w, h, cx, cy, seed, octaves=3):
    """Tiling value noise for a w x h texture (cx, cy cells across and down)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w)); amp = 1.0; tot = 0.0
    for o in range(octaves):
        gx, gy = cx * 2 ** o, cy * 2 ** o
        g = rng.random((gy, gx))
        xs = np.arange(w) * gx / w; x0 = xs.astype(int); fx = xs - x0; fx = fx * fx * (3 - 2 * fx); x1 = (x0 + 1) % gx
        ys = np.arange(h) * gy / h; y0 = ys.astype(int); fy = ys - y0; fy = fy * fy * (3 - 2 * fy); y1 = (y0 + 1) % gy
        A = g[y0][:, x0]; B = g[y0][:, x1]; C = g[y1][:, x0]; D = g[y1][:, x1]
        v = (A * (1 - fx) + B * fx) * (1 - fy[:, None]) + (C * (1 - fx) + D * fx) * fy[:, None]
        out += v * amp; tot += amp; amp *= 0.5
    return out / tot

def whitewash_ruined_big(seed=63, W=512, H=160, boards=10):
    """The ruined white boards over an 8 m x 2.5 m stretch of wall (64 px per metre), so the damage doesn't repeat:
    weathered, chipped paint everywhere, and just a few places where 1-2 boards have been ripped half off."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W]
    h = H // boards
    by = yy % h
    wood = colorize(vnoise_rect(W, H, 32, 10, seed, 3), '#4e483e', '#8e8678')
    wood = wood * (0.85 + 0.25 * (0.5 + 0.5 * np.sin(xx * 0.9 + vnoise_rect(W, H, 6, 4, seed + 9) * 8)))[..., None]
    a = np.zeros((H, W, 3))
    for r in range(boards):
        a[r * h:(r + 1) * h] = hx('#e8e5dc') * rng.uniform(0.93, 1.03)
    a = a * (1.04 - 0.2 * (by / h))[..., None]
    edge_w = np.clip(1.0 - np.minimum(by, h - by) / (h * 0.5), 0, 1)
    n = vnoise_rect(W, H, 48, 15, seed + 1, 3) * 0.7 + 0.3 * edge_w
    big = vnoise_rect(W, H, 8, 3, seed + 4, 2)                                          # some stretches are much worse than others
    gone = n > (1 - (0.22 + 0.3 * big))
    lift = (n > (1 - (0.27 + 0.3 * big))) & ~gone
    a = np.where(gone[..., None], wood, a)
    a[lift] = hx('#f6f3ea')
    a[np.roll(gone, 1, axis=0) & ~gone] *= 0.78
    a[by == 0] = hx('#2e2a24'); a[by == 1] *= 0.72
    a = a * (1 - 0.3 * (yy / H) ** 1.5)[..., None]                                     # dirt rising from the ground
    for _ in range(26):
        x = int(rng.integers(0, W)); y0 = int(rng.integers(0, H // 2)); ln = int(rng.integers(16, 60))
        for k in range(ln): a[(y0 + k) % H, x] *= 1 - 0.14 * math.sin(math.pi * k / ln)
    dirt = vnoise_rect(W, H, 12, 4, seed + 3) > 0.66
    a[dirt] = a[dirt] * 0.85 + hx('#6a5a42') * 0.15

    def rip(r0, nrows, x0, x1):
        """boards r0..r0+nrows-1 torn away between x0 and x1: the dark cavity, a stud, splintered ends"""
        for r in range(r0, r0 + nrows):
            y0, y1 = r * h, (r + 1) * h
            j0 = x0 + int(rng.integers(-6, 7)); j1 = x1 + int(rng.integers(-6, 7))   # each board breaks at its own place
            for x in range(j0, j1):
                a[y0:y1, x % W] = hx('#0c0a08') * (0.8 + 0.5 * (x % 9 == 0))
            for x in (j0, j1 - 1):
                for y in range(y0, y1):
                    xx_ = x + int(rng.integers(-2, 3)) * (1 if x == j0 else -1)
                    a[y, xx_ % W] = hx('#a08e70')
        st = (x0 + x1) // 2
        a[r0 * h:(r0 + nrows) * h, st % W:(st + 3) % W or W] = hx('#3a3026')          # a stud showing through

    def hang(r, x0, length, ang):
        """a board torn loose at one end, hanging off its last nail"""
        y0 = r * h + 1
        for t in np.linspace(0, length, int(length * 9)):
            for k in range(h - 2):
                x = int(x0 + math.cos(ang) * t - math.sin(ang) * k); y = int(y0 + math.sin(ang) * t + math.cos(ang) * k)
                if 0 <= y < H:
                    a[y, x % W] = hx('#e2dfd6') * (1.0 - 0.25 * (k > h - 5)) * (0.94 if (int(t) // 7) % 2 else 1.0)
        a[y0 + 1:y0 + 3, x0 % W:(x0 + 2) % W or W] = hx('#2a2a2a')

    # across 8 m of wall: three places where boards were torn away, one board left hanging, one short broken piece
    rip(2, 1, 40, 84)              # one board missing near the top
    rip(5, 2, 236, 282)            # two boards out, a third of the way along
    hang(6, 237, 50, 0.32)         # ...the lower one still hanging off its last nail, across the gap
    rip(8, 1, 410, 448)            # low down, two thirds along
    rip(3, 1, 360, 374)            # a short broken piece
    return quant(grain(a, 3))

# ------------------------------------------------------------------ concrete stairs and the basement
def concrete_steps(seed=70):
    a = concrete('#8e8c84', seed, cracks=True)
    a[:, :] *= (0.92 + 0.12 * (YY < 6))[..., None]                     # a worn, lighter nosing along the top edge
    a[6] = hx('#3e3c36'); a[7] *= 0.8                                   # the riser shadow
    wear = (vnoise(N, 6, seed + 1) > 0.7) & (YY < 20)
    a[wear] *= 1.12
    return quant(a)

def basement_block(seed=72):
    a = np.zeros((N, N, 3)); h = 16; w = 32
    for r in range(N // h):
        off = (w // 2) * (r % 2)
        for b in range(-1, N // w + 1):
            x0 = b * w + off
            col = hx('#6e6c64') * R.uniform(0.85, 1.08)
            for x in range(max(0, x0), min(N, x0 + w)): a[r * h:(r + 1) * h, x] = col
            if 0 <= x0 < N: a[r * h:(r + 1) * h, x0] = hx('#3a3832')
        a[r * h] = hx('#3a3832')
    a = a * (0.8 + 0.3 * vnoise(N, 10, seed))[..., None]
    damp = np.clip((YY / N - 0.45) * 2, 0, 1) * (vnoise(N, 4, seed + 1) > 0.4)          # rising damp
    a = a * (1 - 0.4 * damp)[..., None] + hx('#2a3020') * (0.2 * damp)[..., None]
    efflo = vnoise(N, 12, seed + 2) > 0.82; a[efflo] = a[efflo] * 0.6 + hx('#c8c4b4') * 0.4
    return quant(grain(a, 5))

# ------------------------------------------------------------------ church and Mass
def linen(c='#e8e4d8', seed=74, border=None, crosses=False):
    a = np.tile(hx(c), (N, N, 1)) * (0.94 + 0.06 * ((XX + YY) % 2))[..., None]
    a = a * (0.92 + 0.1 * vnoise(N, 8, seed))[..., None]
    if border:
        band = (YY >= 50) & (YY < 58)
        a[band] = hx(border) * (0.85 + 0.25 * (((XX // 2) + (YY // 2)) % 2))[band][..., None]
        a[YY == 49] = hx('#8a6a24'); a[YY == 58] = hx('#8a6a24')
    if crosses:
        for cx in (16, 48):
            a[20:36, cx - 1:cx + 1] = hx('#b08a3a'); a[25:27, cx - 6:cx + 6] = hx('#b08a3a')
    fold = vnoise(N, 3, seed + 1)[0][None, :] * np.ones((N, 1))
    return quant(a * (0.9 + 0.12 * fold)[..., None])

def velvet(c1, c2, seed):
    n = vnoise(N, 6, seed, 3)
    a = colorize(n, c1, c2) * (0.85 + 0.3 * vnoise(N, 2, seed + 1))[..., None]
    a = a * (0.94 + 0.08 * (R.random((N, N)) > 0.5))[..., None]
    return quant(a)

def gilt(base='#b08a3a', seed=76, wear=0.25):
    a = colorize(vnoise(N, 12, seed, 3), '#6a4e1c', base)
    shine = vnoise(N, 4, seed + 1) > 0.66; a[shine] = a[shine] * 0.6 + hx('#f0d890') * 0.4
    worn = vnoise(N, 8, seed + 2) > (1 - wear); a[worn] = a[worn] * 0.55 + hx('#5a3a24') * 0.45
    return quant(grain(a, 5))

def brocade(c='#7a1a1a', gold='#c9a23a', seed=78):
    a = np.tile(hx(c), (N, N, 1)) * (0.85 + 0.2 * vnoise(N, 8, seed))[..., None]
    d = np.abs((XX % 16) - 8) + np.abs((YY % 16) - 8)
    a[(d == 6) | (d == 3)] = hx(gold)
    a[((XX % 16) == 8) & ((YY % 16) == 8)] = hx(gold)
    return quant(grain(a, 3))

def marble(c1='#e8e4dc', c2='#9a968c', seed=80):
    n = vnoise(N, 4, seed, 4)
    vein = np.abs(np.sin((XX * 0.09 + YY * 0.05) + n * 9.0))
    a = colorize(np.clip(vein ** 0.25, 0, 1), c2, c1)
    a = a * (0.95 + 0.08 * vnoise(N, 16, seed + 1))[..., None]
    return quant(a)

def stone_slabs(c='#a8a090', seed=82, n=2):
    a = colorize(vnoise(N, 8, seed, 4), '#6e685c', c)
    s = N // n
    for i in range(n):
        for j in range(n):
            a[i * s:(i + 1) * s, j * s:(j + 1) * s] *= R.uniform(0.86, 1.08)
    a[(YY % s) == 0] = hx('#3e3a32'); a[(XX % s) == 0] = hx('#3e3a32')
    worn = vnoise(N, 3, seed + 1) > 0.6; a[worn] *= 1.08
    return quant(grain(a, 4))

def stained(seed=84, pal=('#8a1e1e', '#1e3a8a', '#c9a23a', '#2a6a3a', '#5a2a7a', '#d8d0b8')):
    rng = np.random.default_rng(seed)
    pts = rng.random((14, 2)) * N
    cols = [hx(pal[i % len(pal)]) for i in range(len(pts))]
    best = np.full((N, N), 1e9); second = np.full((N, N), 1e9); idx = np.zeros((N, N), int)
    for k, (px, py) in enumerate(pts):
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                d = np.hypot(XX - px - ox, YY - py - oy)
                second = np.where(d < best, best, np.minimum(second, d)); idx = np.where(d < best, k, idx); best = np.minimum(best, d)
    a = np.array(cols)[idx] * (0.8 + 0.35 * vnoise(N, 6, seed + 1))[..., None]
    a[(second - best) < 1.4] = hx('#121212')                                              # the lead cames
    return quant(a)

def wax(seed=86):
    a = colorize(vnoise(N, 6, seed, 2), '#c8bc98', '#efe6cc')
    drip = (vnoise(N, 2, seed + 1)[0][None, :] > 0.6) & (YY < (20 + 30 * vnoise(N, 4, seed + 2)))
    a[drip] *= 1.05
    return quant(a)

def pew_oak(seed=88):
    return planks('#7a5232', '#3a2414', rows=3, seed=seed, knots=1, stagger=False)

# ------------------------------------------------------------------ office
def office_carpet(seed=90):
    a = carpet('#3a4250', '#56606e', seed)
    sp = R.random((N, N)) > 0.93; a[sp] = hx('#8a8e94')
    return quant(a)

def ceiling_tile(seed=92):
    a = colorize(vnoise(N, 16, seed, 2), '#bcb8ac', '#e0dcd0')
    fis = R.random((N, N)) > 0.86; a[fis] *= 0.72                                         # the fissured acoustic pattern
    a[(YY % 32) < 2] = hx('#d8d8d0'); a[(XX % 32) < 2] = hx('#d8d8d0')                     # the grid
    a[(YY % 32) == 2] *= 0.8; a[(XX % 32) == 2] *= 0.8
    stain = (np.hypot(XX - 44, YY - 18) < 9) & (vnoise(N, 8, seed + 1) > 0.35)            # one water stain
    a[stain] = a[stain] * 0.75 + hx('#9a7a48') * 0.25
    return quant(a)

def steel(c, seed, scuffs=0.2):
    a = np.tile(hx(c), (N, N, 1)) * (0.92 + 0.12 * vnoise(N, 8, seed))[..., None]
    sc = vnoise(N, 16, seed + 1) > (1 - scuffs); a[sc] = a[sc] * 0.7 + hx('#3a3a38') * 0.3
    a[(YY % 32) == 0] *= 0.7                                                              # panel seam
    return quant(grain(a, 3))

def filing(c='#7a7e7a', seed=94):
    a = steel(c, seed, 0.12)
    for y0 in (4, 36):                                                                     # two drawer faces: label holder + handle
        a[y0 + 4:y0 + 9, 24:40] = hx('#b8b8b0'); a[y0 + 5:y0 + 8, 26:38] = hx('#e8e4d4')
        a[y0 + 14:y0 + 17, 22:42] = hx('#c8c8c0'); a[y0 + 17, 22:42] = hx('#3a3a38')
        a[y0 + 30:y0 + 32] *= 0.5
    return quant(a)

def cork(seed=96):
    a = colorize(vnoise(N, 24, seed, 2), '#7a5430', '#c09060')
    a = a * (0.85 + 0.3 * (R.random((N, N)) > 0.6))[..., None]
    return quant(a)

def chalkboard(seed=98):
    a = colorize(vnoise(N, 6, seed, 3), '#1e2a22', '#344038')
    smear = vnoise(N, 4, seed + 1) > 0.62; a[smear] = a[smear] * 0.75 + hx('#a8aca0') * 0.25
    for k in range(5):                                                                     # ghosts of old writing
        y = 10 + k * 11
        for x in range(6, 58):
            if (x * 7 + k * 3) % 5 < 3 and R.random() < 0.6: a[y + int(2 * math.sin(x * 0.7)), x] = hx('#8a8e86')
    return quant(a)

def laminate(seed=100):
    return planks('#a07a50', '#7a5634', rows=2, seed=seed, knots=0, stagger=False, gap='#7a5634')

def vct(seed=102):
    a = np.zeros((N, N, 3))
    for i in range(4):
        for j in range(4):
            a[i * 16:(i + 1) * 16, j * 16:(j + 1) * 16] = hx('#c8c0aa' if (i + j) % 2 else '#b8b09a') * R.uniform(0.95, 1.05)
    sp = R.random((N, N)) > 0.88; a[sp] *= 0.7
    a[(YY % 16) == 0] *= 0.82; a[(XX % 16) == 0] *= 0.82
    scuff = vnoise(N, 4, seed) > 0.68; a[scuff] *= 0.86
    return quant(a)

def paper_stack(seed=104):
    a = np.tile(hx('#e2ddcc'), (N, N, 1))
    for y in range(N):
        a[y] *= 0.86 + 0.14 * ((y * 7 + seed) % 3 == 0) + 0.04 * R.random()
    a = a * (0.92 + 0.1 * vnoise(N, 4, seed))[..., None]
    a[(YY % 16) == 0] = hx('#b8a888')
    return quant(a)

# ------------------------------------------------------------------ graveyard
def granite(c1, c2, seed):
    a = colorize(vnoise(N, 16, seed, 2), c1, c2)
    sp = R.random((N, N)); a[sp > 0.9] *= 1.25; a[sp < 0.08] *= 0.6
    return quant(a)

def old_stone(seed=106, moss=0.3, lichen=0.2):
    a = colorize(vnoise(N, 8, seed, 4), '#6a665c', '#aaa494')
    streak = (vnoise(N, 2, seed + 1)[0][None, :] > 0.55) * np.clip(YY / N, 0, 1)
    a = a * (1 - 0.3 * streak)[..., None]
    if moss:
        m = (vnoise(N, 6, seed + 2, 3) * (0.6 + 0.6 * YY / N)) > (1 - moss)
        a[m] = a[m] * 0.4 + hx('#3e4a24') * 0.6
    if lichen:
        l = vnoise(N, 14, seed + 3) > (1 - lichen * 0.5); a[l] = a[l] * 0.5 + hx('#a8a46a') * 0.5
    return quant(grain(a, 5))

def cast_iron(seed=108):
    a = colorize(vnoise(N, 12, seed), '#141414', '#3a3a38')
    rust = vnoise(N, 6, seed + 1) > 0.7; a[rust] = a[rust] * 0.4 + hx('#6a3416') * 0.6
    return quant(grain(a, 3))

def grave_soil(seed=110):
    a = colorize(vnoise(N, 10, seed, 3), '#241a12', '#5a4630')
    clods = R.random((N, N)) > 0.92; a[clods] *= 1.3
    a = stamp_leaves(a, 10, seed)
    return quant(a)

# ------------------------------------------------------------------ plants
def hedge(seed=112):
    a, _ = foliage(['#2a4222', '#365a2a', '#24381c', '#40602e'], seed, count=520)
    return a

def dead_brush(seed=114):
    a = colorize(vnoise(N, 10, seed, 3), '#1e1a14', '#3a3024')
    for _ in range(70):                                                                     # a tangle of grey-brown twigs
        x, y = R.uniform(0, N), R.uniform(0, N); ang = R.uniform(0, 6.28); ln = R.uniform(6, 20)
        col = hx('#6a5e4c') * R.uniform(0.7, 1.2)
        for t in np.linspace(0, ln, int(ln * 2)):
            a[int(y + math.sin(ang) * t) % N, int(x + math.cos(ang) * t) % N] = col
    a = stamp_leaves(a, 25, seed + 1, cols=['#6e5a3a', '#5a4630', '#8a7048'])
    return quant(a)

def flower_bed(seed=116, cols=('#c83a4a', '#e8d84a', '#e8e4e0', '#a84ab8', '#e0803a')):
    a, _ = foliage(['#2e4a24', '#3a5a2a', '#24381c'], seed, count=420)
    for _ in range(46):
        x, y = R.integers(1, N - 1), R.integers(1, N - 1); c = hx(cols[R.integers(0, len(cols))])
        a[y, x] = c * 1.1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): a[(y + dy) % N, (x + dx) % N] = c * 0.85
        a[y, x] = hx('#f0d040') if R.random() < 0.5 else a[y, x]
    return quant(a)

def dead_flowers(seed=118):
    a = colorize(vnoise(N, 10, seed, 3), '#2a2218', '#4a3e2a')
    for _ in range(60):                                                                     # drooping dry stems
        x, y = R.uniform(0, N), R.uniform(0, N)
        for t in range(10): a[int(y + t) % N, int(x + math.sin(t * 0.4) * 2) % N] = hx('#5a5034')
    for _ in range(40):                                                                     # shrivelled heads, faded to brown and grey
        x, y = R.integers(1, N - 1), R.integers(1, N - 1); c = hx(['#6a3a2a', '#7a6a4a', '#8a7a6a', '#5a3a3a', '#9a8a5a'][R.integers(0, 5)])
        a[y, x] = c
        for dx, dy in ((1, 0), (0, 1), (-1, 1)): a[(y + dy) % N, (x + dx) % N] = c * 0.8
    return quant(a)

def roses(seed=120):
    a, _ = foliage(['#1e3418', '#2a4220', '#183014'], seed, count=480)
    for _ in range(18):
        x, y = R.integers(2, N - 2), R.integers(2, N - 2)
        for dx in range(-2, 2):
            for dy in range(-2, 2):
                if dx * dx + dy * dy < 5: a[(y + dy) % N, (x + dx) % N] = hx('#9a1a24') * (0.7 + 0.3 * ((dx + dy) % 2))
    return quant(a)

# ------------------------------------------------------------------ storage, fabric
def crate_slats(seed=122):
    a = planks('#a8885a', '#6a5232', rows=4, seed=seed, knots=1, stagger=False, gap='#2a1e12')
    a[:, :5] = a[:, :5] * 0.8; a[:, 59:] = a[:, 59:] * 0.8                                 # the end battens
    for (x, y) in ((2, 8), (61, 8), (2, 40), (61, 40)): a[y:y + 2, x:x + 2] = hx('#2a2a2a')  # nails
    return quant(a)

def trunk(seed=124):
    a = colorize(vnoise(N, 8, seed, 3), '#3a2a1e', '#5a4430')                              # tarred canvas
    for y in (0, 30, 60):                                                                 # wooden slats with brass corners
        a[y:y + 4] = hx('#7a5a34') * (0.9 + 0.2 * vnoise(N, 16, seed + 1))[y:y + 4][..., None]
    a[0:6, 0:6] = hx('#a8883a'); a[0:6, 58:] = hx('#a8883a')
    return quant(grain(a, 4))

def cardboard(seed=126):
    a = colorize(vnoise(N, 12, seed, 2), '#8a6a44', '#b08a5a')
    a[(XX % 4) == 0] *= 0.94
    a[30:34] = hx('#c8b48a')                                                              # packing tape
    stain = vnoise(N, 4, seed + 1) > 0.7; a[stain] *= 0.82
    return quant(a)

def locker(seed=128):
    a = steel('#5a6a6e', seed, 0.15)
    for y in range(6, 18, 3): a[y, 16:48] = hx('#1e2224')                                 # vents
    a[30:40, 50:54] = hx('#a8aca8')                                                       # the latch
    return quant(a)

def cedar(seed=130):
    return planks('#b06a44', '#6a3a22', rows=4, seed=seed, knots=2)

def leather(seed=132, c1='#3a2418', c2='#6a4430'):
    a = colorize(vnoise(N, 10, seed, 3), c1, c2)
    cr = vnoise(N, 20, seed + 1) > 0.78; a[cr] *= 0.75
    return quant(grain(a, 4))

def fabric_floral(seed=134):
    a = np.tile(hx('#6a5a44'), (N, N, 1)) * (0.9 + 0.12 * vnoise(N, 8, seed))[..., None]
    for cx, cy in ((10, 12), (42, 20), (26, 44), (56, 52), (6, 54)):
        d = np.hypot(XX - cx, YY - cy)
        a[d < 5] = hx('#8a3a2e'); a[d < 2] = hx('#c8a050')
        a[(d >= 5) & (d < 7) & ((XX + YY) % 3 == 0)] = hx('#4a5a32')
    return quant(grain(a, 3))

def plaid(seed=136, c='#5a3a2a', l1='#8a6a3a', l2='#2a3a2a'):
    a = np.tile(hx(c), (N, N, 1))
    a[(XX % 16) < 3] = a[(XX % 16) < 3] * 0.5 + hx(l1) * 0.5
    a[(YY % 16) < 3] = a[(YY % 16) < 3] * 0.5 + hx(l1) * 0.5
    a[(XX % 16) == 8] = hx(l2); a[(YY % 16) == 8] = hx(l2)
    return quant(grain(a, 4))

def quilt(seed=138):
    a = np.zeros((N, N, 3)); cols = ['#8a3a3a', '#d8cfb4', '#3a5a6a', '#c8a050', '#6a7a4a']
    for i in range(4):
        for j in range(4):
            a[i * 16:(i + 1) * 16, j * 16:(j + 1) * 16] = hx(cols[(i * 3 + j * 2) % len(cols)])
            d = np.abs((XX[:16, :16] - 8)) + np.abs((YY[:16, :16] - 8))
            blk = a[i * 16:(i + 1) * 16, j * 16:(j + 1) * 16]; blk[d < 4] = hx('#e8e0c8')
    a[(YY % 16) == 0] *= 0.7; a[(XX % 16) == 0] *= 0.7
    return quant(a * (0.88 + 0.15 * vnoise(N, 4, seed))[..., None])

def ticking(seed=140):
    a = np.tile(hx('#d8d2c0'), (N, N, 1))
    a[(XX % 8) < 2] = hx('#4a5a7a')
    stain = vnoise(N, 4, seed) > 0.66; a[stain] = a[stain] * 0.8 + hx('#8a6a3a') * 0.2
    return quant(grain(a, 3))

T = {
    'whitewash_ruined_tile': whitewash(60, chip=0.42, grime=0.9, torn=True),
    'whitewash_worn': whitewash(61, chip=0.14, grime=0.3, torn=False),
    'whitewash_chipped': whitewash(62, chip=0.3, grime=0.6, torn=False),
    'concrete_steps': concrete_steps(),
    'concrete_rough': concrete('#7a7870', 71, True),
    'basement_block': basement_block(),
    'altar_linen': linen(border='#c9a23a', crosses=True),
    'linen_white': linen(),
    'velvet_red': velvet('#4a0a10', '#8a1a22', 75),
    'velvet_purple': velvet('#2a0e3a', '#5a2a6a', 77),
    'gold_leaf': gilt(),
    'brass_tarnished': gilt('#9a8040', 79, 0.45),
    'brocade_red': brocade(),
    'brocade_white': brocade('#d8d0bc', '#b08a3a', 81),
    'marble_white': marble(),
    'marble_grey': marble('#a8a6a0', '#4a4844', 83),
    'church_stone': stone_slabs(),
    'stained_glass_v12': stained(),
    'stained_glass_blue': stained(85, ('#1e3a8a', '#2a5aaa', '#c9a23a', '#1e2a5a', '#d8d0b8', '#4a7aba')),
    'candle_wax': wax(),
    'pew_oak': pew_oak(),
    'office_carpet': office_carpet(),
    'ceiling_tile': ceiling_tile(),
    'steel_green': steel('#5a6a5a', 93),
    'steel_grey': steel('#7a7c78', 95),
    'filing_cabinet': filing(),
    'corkboard': cork(),
    'chalkboard': chalkboard(),
    'laminate_wood': laminate(),
    'vct_tile': vct(),
    'paper_stack': paper_stack(),
    'granite_grey': granite('#5a5a58', '#9a9a96', 105),
    'granite_dark': granite('#1e1e20', '#4a4a4c', 107),
    'granite_pink': granite('#7a5a54', '#b08a80', 109),
    'old_stone': old_stone(),
    'old_stone_mossy': old_stone(111, moss=0.55, lichen=0.35),
    'cast_iron': cast_iron(),
    'grave_soil': grave_soil(),
    'hedge_leaves': hedge(),
    'dead_brush': dead_brush(),
    'flower_bed': flower_bed(),
    'flowers_white': flower_bed(117, ('#ece8e0', '#f0e8c8', '#e0d8e8')),
    'dead_flowers': dead_flowers(),
    'roses_red': roses(),
    'crate_slats': crate_slats(),
    'trunk_canvas': trunk(),
    'cardboard': cardboard(),
    'locker_steel': locker(),
    'cedar': cedar(),
    'leather_brown': leather(),
    'leather_black': leather(133, '#121010', '#2e2a26'),
    'fabric_floral': fabric_floral(),
    'fabric_plaid': plaid(),
    'quilt': quilt(),
    'mattress_ticking': ticking(),
}
for k, a in T.items():
    save(a, OUT + k + '.png')
# bigger textures that cover more than a metre (so their damage doesn't visibly repeat); sizes.json tells the
# Map Designer and the game how many metres one copy spans
BIG = {'whitewash_ruined': (whitewash_ruined_big(), (8.0, 2.5))}
for k, (a, sz) in BIG.items():
    save(a, OUT + k + '.png')
import json
json.dump({k: sz for k, (a, sz) in BIG.items()}, open(OUT + 'sizes.json', 'w'), indent=1)
print('wrote %d textures to assets/textures/v12' % len(T))
