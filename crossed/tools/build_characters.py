#!/usr/bin/env python3
"""Builds the PS1-style character models as rigid-skinned glTF (.glb) files.

Every character is made of tapered boxes, each bound 100% to one bone, the way
late-90s survival-horror characters were built from rigid segments. Each model gets:
  - a 128x128 texture atlas painted here (assets/characters/<id>.png, also embedded in the .glb)
  - a 17-bone humanoid skeleton
  - keyframed animations (idle, walk, run, talk, scared, ... ; ACROSS has its own set)

Open any .glb in Blender to refine the mesh, rig or animation; Godot re-imports on save.
Run:  python3 tools/build_characters.py
"""
import json, math, os, struct, io, random, zlib
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'characters')
os.makedirs(OUT, exist_ok=True)
ATLAS = 128

BONES = ['hips', 'spine', 'chest', 'neck', 'head',
         'upperarm.L', 'forearm.L', 'hand.L', 'upperarm.R', 'forearm.R', 'hand.R',
         'thigh.L', 'shin.L', 'foot.L', 'thigh.R', 'shin.R', 'foot.R']
PARENT = {'hips': None, 'spine': 'hips', 'chest': 'spine', 'neck': 'chest', 'head': 'neck',
          'upperarm.L': 'chest', 'forearm.L': 'upperarm.L', 'hand.L': 'forearm.L',
          'upperarm.R': 'chest', 'forearm.R': 'upperarm.R', 'hand.R': 'forearm.R',
          'thigh.L': 'hips', 'shin.L': 'thigh.L', 'foot.L': 'shin.L',
          'thigh.R': 'hips', 'shin.R': 'thigh.R', 'foot.R': 'shin.R'}
# Model faces -Z. Character's LEFT is -X.

def hexc(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
def shade(c, f): return tuple(max(0, min(255, int(v * f))) for v in c)
def mix(a, b, t): return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

# ======================================================================= atlas
class Atlas:
    def __init__(self, seed):
        self.img = Image.new('RGBA', (512, 512), (255, 0, 255, 255))   # scratch canvas; repacked into 128x128 by pack()
        self.regions = {}; self.rng = random.Random(seed)
        self.shelves = []  # [y, h, x]
    def alloc(self, name, w, h):
        for sh in self.shelves:
            if sh[1] >= h and sh[2] + w <= 512:
                r = (sh[2], sh[0], w, h); sh[2] += w; self.regions[name] = r; return r
        y = sum(s[1] for s in self.shelves)
        if y + h > 512: raise RuntimeError('scratch full at ' + name)
        self.shelves.append([y, h, w]); r = (0, y, w, h); self.regions[name] = r; return r
    def fill(self, name, w, h, col, noise=0.06):
        x0, y0, w, h = self.alloc(name, w, h)
        px = self.img.load()
        for y in range(h):
            for x in range(w):
                f = 1 + self.rng.uniform(-noise, noise)
                px[x0 + x, y0 + y] = shade(col, f) + (255,)
        return (x0, y0, w, h)
    def put(self, name, x, y, col):
        x0, y0, w, h = self.regions[name]
        if 0 <= x < w and 0 <= y < h: self.img.putpixel((x0 + x, y0 + y), tuple(col[:3]) + (255,))
    def rect(self, name, x, y, w, h, col, noise=0.04):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(name, xx, yy, shade(col, 1 + self.rng.uniform(-noise, noise)))
    def pack(self):
        """Repack all regions tightly (tallest first) into the final texture: 128x128, or 256x256 when that overflows."""
        for size in (ATLAS, ATLAS * 2):
            try:
                self._pack(size); return
            except RuntimeError:
                continue
        raise RuntimeError('atlas overflow even at %d' % (ATLAS * 2))
    def _pack(self, S):
        order = sorted(self.regions.items(), key=lambda kv: (-kv[1][3], -kv[1][2]))
        out = Image.new('RGBA', (S, S), (0, 0, 0, 255)); new = {}; shelves = []
        for name, (x, y, w, h) in order:
            for sh in shelves:
                if sh[1] >= h and sh[2] + w <= S: r = (sh[2], sh[0], w, h); sh[2] += w; break
            else:
                yy = sum(s_[1] for s_ in shelves)
                if yy + h > S: raise RuntimeError('atlas full at ' + name)
                shelves.append([yy, h, w]); r = (0, yy, w, h)
            out.paste(self.img.crop((x, y, x + w, y + h)), (r[0], r[1])); new[name] = r
        self.img = out; self.regions = new; self.size = S
    def mirror_copy(self, src, dst):
        x, y, w, h = self.regions[src]
        x2, y2, _, _ = self.alloc(dst, w, h)
        self.img.paste(self.img.crop((x, y, x + w, y + h)).transpose(Image.FLIP_LEFT_RIGHT), (x2, y2))
    def uv(self, name):
        x, y, w, h = self.regions[name]; i = 0.3; S = self.size
        return ((x + i) / S, (y + i) / S, (x + w - i) / S, (y + h - i) / S)

# ======================================================================= geometry
class Mesh:
    def __init__(self):
        self.prims = {0: [], 1: [], 2: []}   # material -> list of (pos, nrm, uv, joint); 2 = living flesh (moves under the skin)
    def quad(self, pts, uvs, joint, mat=0, nrms=None):
        a, b, c, d = [np.array(p, float) for p in pts]
        n = np.cross(b - a, c - a)
        if np.linalg.norm(n) < 1e-9: n = np.cross(c - a, d - a)
        n = n / (np.linalg.norm(n) + 1e-12)
        for tri in ((0, 1, 2), (0, 2, 3)):
            for k in tri:
                self.prims[mat].append((pts[k], nrms[k] if nrms is not None else n, uvs[k], joint))
    def tri(self, pts, uvs, joint, mat=0, nrm=None):
        a, b, c = [np.array(p, float) for p in pts]
        n = nrm if nrm is not None else np.cross(b - a, c - a)
        n = np.array(n, float); n = n / (np.linalg.norm(n) + 1e-12)
        for k in range(3):
            self.prims[mat].append((pts[k], n, uvs[k], joint))

def face_uv(pts, n, region_uv):
    """Project a face's 4 corners onto the texture so it reads upright and unmirrored from outside."""
    n = np.array(n, float)
    up = np.array([0, 1, 0.0])
    if abs(n[1]) > 0.8: up = np.array([0, 0, -1.0]) if n[1] > 0 else np.array([0, 0, 1.0])
    r = np.cross(up, n); r /= np.linalg.norm(r) + 1e-12
    up = np.cross(n, r)
    s = [float(np.dot(p, r)) for p in pts]; t = [float(-np.dot(p, up)) for p in pts]
    u0, v0, u1, v1 = region_uv
    out = []
    for i in range(4):
        fu = (s[i] - min(s)) / (max(s) - min(s) + 1e-9); fv = (t[i] - min(t)) / (max(t) - min(t) + 1e-9)
        out.append((u0 + fu * (u1 - u0), v0 + fv * (v1 - v0)))
    return out

def prism(mesh, atlas, joint, p0, p1, s0, s1, tex, chamfer=0.0, mat=0, caps=True):
    """Tapered box from p0 to p1. s0/s1 = (width, depth) at each end.
    tex: dict with keys front/back/left/right/top/bottom/side (fallbacks) -> region names.
    chamfer > 0 cuts the vertical edges (octagonal section) for rounder heads and limbs."""
    p0 = np.array(p0, float); p1 = np.array(p1, float); ax = p1 - p0; ax /= np.linalg.norm(ax)
    if abs(ax[1]) > 0.7: u, v = np.array([1, 0, 0.]), np.array([0, 0, 1.])
    elif abs(ax[2]) > 0.7: u, v = np.array([1, 0, 0.]), np.array([0, 1, 0.])
    else: u, v = np.array([0, 0, 1.]), np.array([0, 1, 0.])
    u = u - ax * np.dot(u, ax); u /= np.linalg.norm(u); v = np.cross(ax, u)
    if chamfer > 0:
        c = chamfer; sec = [(1, 1 - c), (1 - c, 1), (-1 + c, 1), (-1, 1 - c), (-1, -1 + c), (-1 + c, -1), (1 - c, -1), (1, -1 + c)]
    else:
        sec = [(1, 1), (-1, 1), (-1, -1), (1, -1)]
    ring = lambda p, s: [p + u * (a * s[0] / 2) + v * (b * s[1] / 2) for a, b in sec]
    r0, r1 = ring(p0, s0), ring(p1, s1)
    def region_for(n):
        ax_i = int(np.argmax(np.abs(n)))
        if ax_i == 0: key = 'right' if n[0] > 0 else 'left'
        elif ax_i == 1: key = 'top' if n[1] > 0 else 'bottom'
        else: key = 'front' if n[2] < 0 else 'back'
        name = tex.get(key) or tex.get('side' if key in ('left', 'right') else ('cap' if key in ('top', 'bottom') else 'side')) or tex.get('side')
        return name
    m = len(sec)
    center = (p0 + p1) / 2
    for i in range(m):
        j = (i + 1) % m
        pts = [r0[i], r0[j], r1[j], r1[i]]
        n = np.cross(pts[1] - pts[0], pts[3] - pts[0]); n /= np.linalg.norm(n) + 1e-12
        if np.dot(n, (pts[0] + pts[2]) / 2 - center) < 0: pts = pts[::-1]; n = -n
        mesh.quad(pts, face_uv(pts, n, atlas.uv(region_for(n))), joint, mat)
    if caps:
        for rr, sign in ((r0, -1), (r1, 1)):
            cen = sum(rr) / m
            n = ax * sign
            for i in range(0, m, 2):   # caps as quads fanned from the centre
                a, b, c = rr[i], rr[(i + 1) % m], rr[(i + 2) % m]
                pts = [cen, a, b, c]
                nn = np.cross(pts[1] - pts[0], pts[2] - pts[0])
                if np.dot(nn, n) < 0: pts = pts[::-1]
                mesh.quad(pts, face_uv(pts, n, atlas.uv(region_for(n))), joint, mat)

# ======================================================================= lofted surfaces
# Angles are measured around +Y: 0 = front (-Z), 90 = the character's right (+X), 180 = back, 270 = left.
# A texture map is a region name (wrapped once around 360) or a list of (a0, a1, region) arcs.
def sect(th, w, zf, zb, p):
    """Superellipse section point: p=2 ellipse, larger = boxier. zf/zb = half depth to the front/back."""
    t = math.radians(th); s, c = math.sin(t), math.cos(t); e = 2.0 / p
    x = (w / 2) * math.copysign(abs(s) ** e, s)
    z = -(zf if c >= 0 else zb) * math.copysign(abs(c) ** e, c)
    return x, z

def _wrapd(a): return (a + 180.0) % 360.0 - 180.0

def _resolve(tex, th):
    if isinstance(tex, str): return tex, 0.0, 360.0
    for a0, a1, reg in tex:
        if (th - a0) % 360.0 <= (a1 - a0): return reg, a0, a1
    a0, a1, reg = tex[-1]; return reg, a0, a1

def grid(mesh, at, joint, P, thetas, segtex, vseg, closed, double=None, mat=0, smooth=True):
    """P[k][i]: rows ordered top->bottom, columns by increasing angle -> outward-facing quads.
    segtex[k]: texture map for the band between rows k and k+1 (None leaves a hole). vseg[k] = (v_top, v_bot)."""
    P = [[np.array(p, float) for p in row] for row in P]
    R = len(P); m = len(thetas); ncol = m if closed else m - 1
    N = {}
    for k in range(R - 1):
        if segtex[k] is None: continue
        for i in range(ncol):
            j = (i + 1) % m
            a, b, c, d = P[k][i], P[k][j], P[k + 1][j], P[k + 1][i]
            n = np.cross(b - a, c - a) + np.cross(c - a, d - a); l = np.linalg.norm(n)
            if l > 1e-12: N[(k, i)] = n / l
    def vnorm(k, i, own):
        acc = np.zeros(3)
        for kk in (k - 1, k):
            for ii in (i - 1, i):
                if closed: ii %= m
                elif ii < 0 or ii >= ncol: continue
                q = N.get((kk, ii))
                if q is not None and np.dot(q, own) > 0.5: acc += q
        l = np.linalg.norm(acc); return acc / l if l > 1e-9 else own
    for k in range(R - 1):
        if segtex[k] is None: continue
        for i in range(ncol):
            own = N.get((k, i))
            if own is None: continue
            j = (i + 1) % m
            tm = thetas[i] + _wrapd(thetas[j] - thetas[i]) / 2
            reg, a0, a1 = _resolve(segtex[k], tm)
            tmu = (tm - a0) % 360.0 + a0
            u0, v0, u1, v1 = at.uv(reg)
            vt, vb = vseg[k]
            def uv(ti, vv):
                tu = tmu + _wrapd(thetas[ti] - tm)
                fu = min(1.0, max(0.0, (a1 - tu) / (a1 - a0)))
                return (u0 + fu * (u1 - u0), v0 + vv * (v1 - v0))
            pts = [P[k][i], P[k][j], P[k + 1][j], P[k + 1][i]]
            uvs = [uv(i, vt), uv(j, vt), uv(j, vb), uv(i, vb)]
            idx = [(k, i), (k, j), (k + 1, j), (k + 1, i)]
            nr = [vnorm(kk, ii, own) for kk, ii in idx] if smooth else None
            mesh.quad(pts, uvs, joint, mat, nr)
            if double:
                du0, dv0, du1, dv1 = at.uv(double)
                re = lambda q: (du0 + (q[0] - u0) / (u1 - u0 + 1e-12) * (du1 - du0), dv0 + (q[1] - v0) / (v1 - v0 + 1e-12) * (dv1 - dv0))
                mesh.quad(pts[::-1], [re(q) for q in uvs[::-1]], joint, mat, [-x for x in nr[::-1]] if nr else None)

def cap(mesh, at, joint, row, region, up, mat=0):
    row = [np.array(p, float) for p in row]; cen = sum(row) / len(row)
    n = np.array([0, 1.0 if up else -1.0, 0])
    xs = [p[0] for p in row]; zs = [p[2] for p in row]
    u0, v0, u1, v1 = at.uv(region)
    f = lambda p: (u0 + (p[0] - min(xs)) / (max(xs) - min(xs) + 1e-9) * (u1 - u0), v0 + (p[2] - min(zs)) / (max(zs) - min(zs) + 1e-9) * (v1 - v0))
    for i in range(len(row)):
        a, b = row[i], row[(i + 1) % len(row)]
        tri = [cen, a, b]
        if np.dot(np.cross(a - cen, b - cen), n) < 0: tri = [cen, b, a]
        mesh.tri(tri, [f(p) for p in tri], joint, mat, n)

def ringn(r):
    q = dict(r)
    if 'd' in q: q.setdefault('zf', q['d'] / 2); q.setdefault('zb', q['d'] / 2)
    q.setdefault('zf', q['w'] / 2); q.setdefault('zb', q['zf'])
    q.setdefault('x', 0.0); q.setdefault('z', 0.0); q.setdefault('p', 2.6)
    return q

def interp_rings(rings, y):
    rs = [ringn(r) for r in rings]
    for a, b in zip(rs, rs[1:]):
        if (a['y'] - y) * (b['y'] - y) <= 0 and a['y'] != b['y']:
            t = (a['y'] - y) / (a['y'] - b['y'])
            q = {k: a[k] * (1 - t) + b[k] * t for k in ('w', 'zf', 'zb', 'x', 'z', 'p')}; q['y'] = y; return q
    near = min(rs, key=lambda r: abs(r['y'] - y))
    return {k: near[k] for k in ('w', 'zf', 'zb', 'x', 'z', 'p')} | {'y': y}

def quilt(rings, step, pinch):
    """Resample rings at a fixed spacing and pinch every other one: the baffles of a puffer jacket."""
    y0, y1 = rings[0]['y'], rings[-1]['y']; n = max(2, int(round(abs(y0 - y1) / step)))
    out = []
    for i in range(n + 1):
        q = interp_rings(rings, y0 + (y1 - y0) * i / n)
        if i % 2 == 1 and i < n: q['w'] *= pinch; q['zf'] *= pinch; q['zb'] *= pinch
        out.append(q)
    return out

def front_at(rings, y):
    q = interp_rings(rings, y); return q['z'] - q['zf']

def loft(mesh, at, joint, rings, n=8, tex='dark', arc=None, cap_top=None, cap_bot=None, double=None, phase=0.0, mat=0, seed=0, smooth=True):
    """Surface through horizontal rings, listed top->bottom.
    ring: y, w, d (or zf/zb), x, z, p, tilt (front edge raised), bump/jag (random radius/height), pleat (alternating radius),
          tex (texture map of the band below this ring), v (explicit texture row)."""
    R = [ringn(r) for r in rings]
    closed = arc is None
    thetas = [phase + 360.0 * i / n for i in range(n)] if closed else [arc[0] + (arc[1] - arc[0]) * i / n for i in range(n + 1)]
    rng = random.Random(seed)
    P = []
    for r in R:
        row = []
        for i, t in enumerate(thetas):
            x, z = sect(t, r['w'], r['zf'], r['zb'], r['p'])
            f = 1.0 + r.get('bump', 0.0) * rng.uniform(-1, 1) + r.get('pleat', 0.0) * (1 if i % 2 else -1)
            y = r['y'] + r.get('tilt', 0.0) * math.cos(math.radians(t)) + r.get('jag', 0.0) * rng.uniform(-1, 1)
            row.append((r['x'] + x * f, y, r['z'] + z * f))
        P.append(row)
    segtex = [R[k].get('tex', tex) for k in range(len(R) - 1)]
    vseg = [None] * (len(R) - 1); k = 0
    while k < len(R) - 1:
        j = k
        while j + 1 < len(R) - 1 and segtex[j + 1] == segtex[k]: j += 1
        ytop, ybot = R[k]['y'], R[j + 1]['y']; span = ytop - ybot
        for mm in range(k, j + 1):
            vt = R[mm].get('v', (ytop - R[mm]['y']) / span if span > 1e-6 else 0.0)
            vb = R[mm + 1].get('v', (ytop - R[mm + 1]['y']) / span if span > 1e-6 else 1.0)
            vseg[mm] = (vt, vb)
        k = j + 1
    grid(mesh, at, joint, P, thetas, segtex, vseg, closed, double=double, mat=mat, smooth=smooth)
    if closed and cap_top: cap(mesh, at, joint, P[0], cap_top, True, mat)
    if closed and cap_bot: cap(mesh, at, joint, P[-1], cap_bot, False, mat)
    return P

class HeadShape:
    """The skull as a stack of superellipse rings; hair, beards, ears and noses are placed on its surface."""
    def __init__(self, rings, cz, y0, hh):
        self.r = sorted([ringn(r) for r in rings], key=lambda r: r['y']); self.cz = cz; self.y0 = y0; self.hh = hh
    def par(self, y): return interp_rings(self.r[::-1], y)
    def point(self, y, th, off=0.0):
        q = self.par(y); x, z = sect(th, q['w'], q['zf'], q['zb'], q['p'])
        L = math.hypot(x, z) or 1.0
        up = min(1.0, max(0.0, (y - (self.y0 + 0.74 * self.hh)) / (0.26 * self.hh)))   # the crown faces up: push hair up there too
        return np.array([x + x / L * off * (1 - 0.5 * up), y + off * up, self.cz + z + z / L * off * (1 - 0.5 * up)])
    def front_z(self, y): return self.cz - self.par(y)['zf']
    def wmax(self): return max(r['w'] for r in self.r)
    def zbmax(self): return max(r['zb'] for r in self.r)

THIRDS = lambda reg: [(-60, 60, reg), (60, 180, reg), (180, 300, reg)]

def hair_sheet(mesh, at, joint, hs, arc, n, rows, tex, double=None, seed=0, bump=0.0):
    """Hair (or a beard) laid over the head surface. rows top->bottom: (height as head fraction or f(angle), offset or f(angle)[, jag])."""
    closed = arc is None
    thetas = [360.0 * i / n for i in range(n)] if closed else [arc[0] + (arc[1] - arc[0]) * i / n for i in range(n + 1)]
    rng = random.Random(seed); P = []
    for k, row in enumerate(rows):
        yf, off = row[0], row[1]; jag = row[2] if len(row) > 2 else 0.0
        pr = []
        for t in thetas:
            f = yf(t) if callable(yf) else yf; o = off(t) if callable(off) else off
            if 0 < k < len(rows) - 1 and bump: o += bump * rng.uniform(-1, 1)
            p = hs.point(hs.y0 + f * hs.hh, t, o)
            if jag: p[1] += jag * rng.uniform(-1, 1)
            pr.append(p)
        P.append(pr)
    nb = len(P) - 1
    grid(mesh, at, joint, P, thetas, [tex] * nb, [(k / nb, (k + 1) / nb) for k in range(nb)], closed, double=double)
    return P

def hair_cap(mesh, at, joint, hs, h, seed):
    """Closed hair shell from an apex over the crown down to a hairline that is high at the front, low at the nape."""
    n = 12; rows = h.get('rows', 5); th0 = h['th']; lift = h.get('lift', 0.0); quiff = h.get('quiff', 0.0); bump = h.get('bump', 0.0)
    thetas = [360.0 * i / n for i in range(n)]
    rng = random.Random(seed)
    top = hs.y0 + hs.hh
    def hl(t):
        c = math.cos(math.radians(t))
        f = h['side'] + (h['front'] - h['side']) * c if c >= 0 else h['side'] + (h['back'] - h['side']) * (-c)
        return hs.y0 + f * hs.hh
    apex = np.array([0.0, top + th0 + lift, hs.cz + 0.004])
    P = [[apex.copy() for _ in thetas]]
    for k in range(1, rows + 1):
        s = k / rows; row = []
        for t in thetas:
            c = max(0.0, math.cos(math.radians(t)))
            y = top - (s ** 1.1) * (top - hl(t))
            off = th0 + quiff * c * (1 - s) ** 0.6 + (bump * rng.uniform(-1, 1) if k < rows else 0.0)
            p = hs.point(y, t, off); p[1] += lift * (1 - s) ** 1.5
            row.append(p)
        P.append(row)
    P.append([hs.point(hl(t), t, 0.002) for t in thetas])      # tuck the edge back to the scalp
    nb = len(P) - 1
    segtex = [THIRDS('hair')] * (nb - 1) + ['hair_dk']
    vseg = [(k / (nb - 1), (k + 1) / (nb - 1)) for k in range(nb - 1)] + [(0.0, 1.0)]
    grid(mesh, at, joint, P, thetas, segtex, vseg, True, double=h.get('double'))
    return top + th0 + lift

def tail(mesh, at, joint, pts, widths, tex='hair', tie=None, n=6):
    """A ponytail or pigtail: closed rings along a path that runs downward."""
    rings = [dict(y=p[1], x=p[0], z=p[2], w=w, d=w * 0.9, p=2.2) for p, w in zip(pts, widths)]
    loft(mesh, at, joint, rings, n=n, tex=tex, cap_bot='hair_dk')
    if tie:
        p = pts[0]; w = widths[0] * 1.15
        loft(mesh, at, joint, [dict(y=p[1] + 0.012, x=p[0], z=p[2], w=w, d=w), dict(y=p[1] - 0.012, x=p[0], z=p[2], w=w, d=w)], n=6, tex=tie)

# ======================================================================= character spec -> joints
def joints_for(sp):
    H = sp['height']; kid = sp.get('kid', False)
    head_h = sp.get('head_h', 0.235 if not kid else 0.21)
    neck = sp.get('neck', 0.07 if not kid else 0.04)
    sh_y = H - head_h - neck
    hip_y = sp.get('hip_y', H * (0.52 if not kid else 0.45))
    foot_h = 0.07 if not kid else 0.05
    leg = hip_y - foot_h
    knee_y = foot_h + leg * 0.49
    sw = sp.get('shoulder_w', 0.38 if not kid else 0.25); hw = sp.get('hip_w', 0.2 if not kid else 0.14)
    lx = sp.get('leg_x', hw / 2)          # how far each leg sits from the centre line (slim legs sit closer in)
    arm = sp.get('arm', (sh_y - hip_y) * 0.0 + H * (0.33 if not kid else 0.32))
    J = {
        'hips': (0, hip_y, 0), 'spine': (0, hip_y + 0.09 * H / 1.8, 0), 'chest': (0, hip_y + (sh_y - hip_y) * 0.45, 0),
        'neck': (0, sh_y, 0), 'head': (0, sh_y + neck, 0),
        'upperarm.L': (-sw / 2, sh_y - 0.03, 0), 'upperarm.R': (sw / 2, sh_y - 0.03, 0),
        'thigh.L': (-lx, hip_y - 0.04, 0), 'thigh.R': (lx, hip_y - 0.04, 0),
        'shin.L': (-lx, knee_y, 0), 'shin.R': (lx, knee_y, 0),
        'foot.L': (-lx, foot_h, 0), 'foot.R': (lx, foot_h, 0),
    }
    up_len = arm * 0.47; fo_len = arm * 0.40
    for s, sx in (('L', -1), ('R', 1)):
        x = sx * (sw / 2 + 0.01)
        J['forearm.' + s] = (x, sh_y - 0.03 - up_len, 0)
        J['hand.' + s] = (x, sh_y - 0.03 - up_len - fo_len, 0)
    return J, dict(H=H, head_h=head_h, sh_y=sh_y, hip_y=hip_y, foot_h=foot_h, sw=sw, hw=hw, arm=arm, kid=kid)

# ======================================================================= painting
def paint(sp, at):
    P = sp['pal']; skin = hexc(P['skin']); hair = hexc(P.get('hair', '#000000')); top = hexc(P['top'])
    top2 = hexc(P.get('top2', P['top'])); bot = hexc(P['bottom']); shoe = hexc(P['shoes']); eye = hexc(P.get('eyes', '#3a2a20'))
    belt = hexc(P['belt']) if P.get('belt') else None
    style = sp.get('hair', 'short'); topk = sp.get('top', 'plain'); botk = sp.get('bottom_kind', 'pants')
    ex = set(sp.get('extras', []))
    rng = at.rng

    def garment(name, w, h, base, kind, part):
        at.fill(name, w, h, base)
        if kind == 'puffer':   # the baffles are real geometry now; keep only faint stitch lines
            for y in range(5, h, 10): at.rect(name, 0, y, w, 1, shade(base, 0.8), 0)
            if part == 'front': at.rect(name, w // 2, 0, 1, h, shade(base, 1.9), 0)
        elif kind == 'stripes':
            for y in range(4, h, 9): at.rect(name, 0, y, w, 2, top2, 0.02)
            if part in ('front', 'back') and name.startswith('torso'): at.rect(name, 0, 0, w, 2, shade(base, 0.9), 0)
        elif kind == 'plaid':
            for y in range(2, h, 6): at.rect(name, 0, y, w, 1, shade(base, 0.45), 0)
            for x in range(3, w, 6): at.rect(name, x, 0, 1, h, shade(base, 0.5), 0)
            if part == 'front' and name.startswith('torso'): at.rect(name, w // 2, 0, 1, h, shade(base, 1.3), 0)
        elif kind == 'cardigan' and part == 'front':
            for y in range(h):
                hw2 = (4 - y * 2 // h) if name.startswith('torso') else 2
                at.rect(name, w // 2 - hw2, y, hw2 * 2, 1, shade(top2, 0.94), 0.02)
            for y in range(4, h, 6): at.put(name, w // 2 - 5, y, shade(base, 1.4))
        elif kind == 'hoodie' and part == 'front' and name.startswith('abd'):
            at.rect(name, 6, 3, w - 12, h - 5, shade(base, 0.82), 0.02)
        elif kind == 'hoodie' and part == 'front' and name.startswith('torso'):
            at.rect(name, w // 2 - 4, 0, 1, 10, (230, 230, 230)); at.rect(name, w // 2 + 3, 0, 1, 10, (230, 230, 230))
        elif kind == 'overalls' and part in ('front', 'back') and not name.startswith('uarm'):
            at.rect(name, 6, 6 if name.startswith('torso') else 0, w - 12, h, top2, 0.03)
            if name.startswith('torso'):
                at.rect(name, 5, 0, 3, 7, top2, 0); at.rect(name, w - 8, 0, 3, 7, top2, 0)
                at.put(name, 9, 8, (230, 200, 60)); at.put(name, w - 10, 8, (230, 200, 60))
        elif kind == 'dino' and part == 'front' and name.startswith('torso'):
            d = shade(base, 0.55)
            at.rect(name, 10, 14, 12, 6, d, 0); at.rect(name, 19, 9, 6, 6, d, 0); at.rect(name, 8, 20, 2, 4, d, 0)
            at.rect(name, 18, 20, 2, 4, d, 0); at.rect(name, 6, 12, 4, 3, d, 0); at.put(name, 23, 10, (240, 240, 240))
        elif kind == 'ribs':
            pass
        if kind == 'buttonup' and part == 'front' and (name.startswith('torso') or name.startswith('abd')):
            at.rect(name, w // 2, 0, 1, h, shade(base, 0.8), 0)                       # placket seam
            for y in range(4 if name.startswith('torso') else 2, h, 6): at.rect(name, w // 2 + 1, y, 2, 2, (22, 22, 25), 0)   # black buttons
        if kind == 'buttonup':
            for x in range(3, w, 7): at.rect(name, x, 0, 1, h, shade(base, 0.93), 0.01)   # soft folds in the cotton
        if kind == 'polo' and part == 'front' and name.startswith('torso'):
            at.rect(name, w // 2 - 4, 0, 8, 3, shade(base, 1.25), 0); at.rect(name, w // 2, 3, 1, 6, shade(base, 0.7), 0)
        return name

    # ---- head
    at.fill('face', 32, 32, skin, 0.03)
    at.fill('head_side', 16, 32, skin, 0.03)
    at.fill('head_back', 32, 32, hair if style != 'bald' else skin, 0.08)
    at.fill('head_top', 32, 16, hair if style not in ('bald',) else skin, 0.08)
    at.fill('neck', 8, 8, shade(skin, 0.85), 0.03)
    hairline = {'short': 7, 'long': 6, 'bob': 6, 'ponytail': 6, 'curly': 7, 'pigtails': 6, 'buzz': 6, 'bald': 0, 'patchy': 0}.get(style, 7)
    if style == 'bald':
        for x in range(0, 16): at.put('head_side', x, 14 + (x % 3 == 0), shade(hair, 1.0)) if x > 9 else None
        for x in range(0, 32):
            for y in range(13, 19):
                if rng.random() < 0.55: at.put('head_back', x, y, hair)
        at.rect('head_top', 0, 0, 32, 16, shade(skin, 1.05), 0.02)
        at.rect('head_top', 11, 4, 9, 7, shade(skin, 1.15), 0.02)   # shine
    elif style == 'patchy':
        for x in range(32):
            for y in range(32):
                if rng.random() < 0.18: at.put('head_top', x, y, hair)
                if y < 14 and rng.random() < 0.15: at.put('head_back', x, y, hair)
        for x in range(16):
            for y in range(10):
                if rng.random() < 0.12: at.put('head_side', x, y, hair)
    else:
        at.rect('face', 0, 0, 32, hairline, hair, 0.08)
        if style in ('short', 'buzz', 'curly'):
            at.rect('face', 0, hairline, 2, 6, hair); at.rect('face', 30, hairline, 2, 6, hair)
            at.rect('head_side', 0, 0, 16, 11, hair, 0.08)
        else:
            if style not in ('pigtails',):
                at.rect('face', 0, hairline, 3, 20, hair); at.rect('face', 29, hairline, 3, 20, hair)
            at.rect('head_side', 0, 0, 16, 12, hair, 0.08)
        if style == 'curly':
            for x in range(0, 32, 3):
                at.put('face', x, hairline, hair); at.put('face', x + 1, hairline + 1, shade(hair, 0.7))
        if sp.get('bangs'):
            at.rect('face', 4, hairline, 24, 3, hair, 0.08)
    # eyes / brows / nose / mouth (face is 32 wide: viewer-left = character's right)
    ey = sp.get('eye_y', 14 if not sp.get('kid') else 15)
    if 'white_eyes' in ex:
        pass   # eyes are separate glowing geometry
    else:
        for cx in (9, 20):
            at.rect('face', cx, ey, 4, 2, (236, 236, 230), 0); at.rect('face', cx + 1, ey, 2, 2, eye, 0); at.put('face', cx + 1, ey, shade(eye, 0.5))
            if 'soft_brows' in ex: at.rect('face', cx, ey - 2, 4, 1, mix(skin, hair, 0.6), 0); at.put('face', cx + (3 if cx < 16 else 0), ey - 3, mix(skin, hair, 0.45))
            else: at.rect('face', cx, ey - 2, 4, 1, shade(hair if style not in ('bald', 'patchy') else skin, 0.6), 0)
    at.rect('face', 15, ey + 2, 2, 5, shade(skin, 0.82), 0)            # nose shadow
    at.put('face', 14, ey + 6, shade(skin, 0.7)); at.put('face', 17, ey + 6, shade(skin, 0.7))
    lip = hexc(P.get('lips', '#b77a6e'))
    at.rect('face', 12, ey + 10, 8, 1, lip, 0)
    if 'full_lips' in ex: at.rect('face', 13, ey + 9, 6, 1, shade(lip, 0.88), 0); at.rect('face', 13, ey + 11, 6, 1, shade(lip, 1.12), 0)
    if 'blush' in ex: at.rect('face', 6, ey + 5, 4, 2, mix(skin, (230, 110, 110), 0.45), 0); at.rect('face', 22, ey + 5, 4, 2, mix(skin, (230, 110, 110), 0.45), 0)
    if 'stubble' in ex:
        for x in range(6, 26):
            for y in range(ey + 8, 31):
                if rng.random() < 0.3 and not (12 <= x < 20 and y == ey + 10): at.put('face', x, y, shade(skin, 0.78))
    if 'beard' in ex:
        for x in range(4, 28):
            for y in range(ey + 7, 32):
                if rng.random() < 0.55 and not (12 <= x < 20 and y == ey + 10): at.put('face', x, y, shade(hair, 1.1))
    if 'glasses' in ex:
        for cx in (8, 19):
            at.rect('face', cx, ey - 1, 6, 1, (40, 40, 45), 0); at.rect('face', cx, ey + 2, 6, 1, (40, 40, 45), 0)
            at.rect('face', cx, ey - 1, 1, 4, (40, 40, 45), 0); at.rect('face', cx + 5, ey - 1, 1, 4, (40, 40, 45), 0)
        at.rect('face', 14, ey, 5, 1, (40, 40, 45), 0)
    if 'morph_face' in ex:   # the Stranger, transformed: white eyes, sunken sockets, a grin across the whole face
        for cx in (8, 19):
            at.rect('face', cx, ey - 2, 6, 5, shade(skin, 0.45), 0); at.rect('face', cx + 1, ey - 1, 4, 3, (245, 243, 236), 0)
        at.rect('face', 4, ey + 7, 24, 7, (50, 10, 12), 0)
        for x in range(5, 27, 2):
            at.rect('face', x, ey + 7, 1, 2, (236, 230, 214), 0); at.rect('face', x, ey + 12, 1, 2, (236, 230, 214), 0)
        at.rect('face', 3, ey + 6, 1, 3, shade(skin, 0.5), 0); at.rect('face', 28, ey + 6, 1, 3, shade(skin, 0.5), 0)
    if 'gaunt' in ex:
        for y in range(ey + 3, ey + 9): at.put('face', 7, y, shade(skin, 0.65)); at.put('face', 24, y, shade(skin, 0.65))
        at.rect('face', 9, ey - 1, 5, 4, shade(skin, 0.6), 0); at.rect('face', 19, ey - 1, 5, 4, shade(skin, 0.6), 0)
        at.rect('face', 11, ey + 9, 10, 3, (40, 20, 22), 0)
        for x in range(11, 21, 2): at.put('face', x, ey + 9, (210, 200, 170))

    # ---- v11 outerwear textures
    if sp.get('coat'):
        cc = hexc(sp['coat'].get('color', '#5a5a3a')); knit = sp['coat'].get('knit')
        at.fill('coat', 32, 32, cc, 0.07)
        for x in range(2, 32, 4 if knit else 8): at.rect('coat', x, 0, 1, 32, shade(cc, 0.86), 0.01)        # seams / knit ribs
        at.rect('coat', 15, 0, 2, 32, shade(cc, 0.75), 0)
        if not knit:
            for y in range(6, 32, 9): at.rect('coat', 0, y, 32, 1, shade(cc, 0.9), 0.01)                   # canvas folds
        at.fill('coat_in', 16, 16, shade(cc, 0.45), 0.05)
        at.fill('coat_hem', 32, 8, shade(cc, 0.8), 0.05)
        at.rect('coat_hem', 0, 5, 32, 1, shade(cc, 0.55), 0)
    if sp.get('vest'):
        vc = hexc(sp['vest'])
        at.fill('vest', 32, 32, vc, 0.06)
        for y in range(4, 32, 8): at.rect('vest', 0, y, 32, 1, shade(vc, 0.7), 0)
        at.rect('vest', 15, 0, 1, 32, (200, 200, 200), 0)
        if not sp.get('coat'): at.fill('coat_in', 16, 16, shade(vc, 0.45), 0.05)
    if sp.get('scarf'):
        sc_ = hexc(sp['scarf'])
        at.fill('scarf', 16, 16, sc_, 0.05)
        for y in range(0, 16, 4): at.rect('scarf', 0, y, 16, 2, shade(sc_, 0.62), 0)
    if sp.get('hat'):
        hc = hexc(sp['hat'])
        at.fill('hat', 32, 16, hc, 0.05)
        for x in range(0, 32, 2): at.rect('hat', x, 0, 1, 16, shade(hc, 0.82), 0)
        at.fill('hat_brim', 32, 8, shade(hc, 0.9), 0.05)
        for x in range(0, 32, 2): at.rect('hat_brim', x, 0, 1, 8, shade(hc, 0.7), 0)
    # ---- torso
    for part in ('front', 'back'):
        garment('torso_' + part, 32, 32, top, topk, part)
        garment('abd_' + part, 32, 16, top if topk not in ('ribs',) else skin, topk, part)
    garment('torso_side', 16, 32, top, topk, 'side'); garment('abd_side', 16, 16, top, topk, 'side')
    if topk == 'ribs':
        for nm in ('torso_front', 'torso_back', 'torso_side', 'abd_front', 'abd_back', 'abd_side'):
            x0, y0, w, h = at.regions[nm]; at.rect(nm, 0, 0, w, h, skin, 0.06)
        for y in range(10, 32, 4):
            at.rect('torso_front', 3, y, 11, 1, shade(skin, 0.6), 0); at.rect('torso_front', 18, y, 11, 1, shade(skin, 0.6), 0)
            at.rect('torso_side', 0, y, 16, 1, shade(skin, 0.62), 0)
        at.rect('torso_front', 15, 4, 2, 28, shade(skin, 0.75), 0)
        for y in range(0, 32, 3): at.rect('torso_back', 15, y, 2, 2, shade(skin, 1.15), 0); at.put('torso_back', 15, y + 2, shade(skin, 0.55))
        for y in range(0, 16, 3): at.rect('abd_back', 15, y, 2, 2, shade(skin, 1.15), 0)
        at.rect('abd_front', 8, 2, 16, 12, shade(skin, 0.82), 0)
        for x in range(4, 28, 7): at.rect('torso_back', x, 6, 3, 1, shade(skin, 0.6), 0)
    # pelvis
    for part in ('front', 'back', 'side'):
        w = 16 if part == 'side' else 32
        at.fill('pelvis_' + part, w, 16, bot, 0.06)
        if belt: at.rect('pelvis_' + part, 0, 0, w, 3, belt, 0.03)
        if belt and part == 'front': at.rect('pelvis_front', 14, 0, 4, 3, (190, 170, 90), 0)
        if botk == 'dress':
            at.rect('pelvis_' + part, 0, 0, w, 16, top, 0.05)
    if topk == 'overalls':
        at.rect('pelvis_front', 0, 0, 32, 16, top2, 0.04); at.rect('pelvis_back', 0, 0, 32, 16, top2, 0.04); at.rect('pelvis_side', 0, 0, 16, 16, top2, 0.04)
    if 'brand_hip' in ex:     # character's left hip, front face: viewer's right side of the region
        c = (25, 10, 8); g = (150, 40, 20)
        at.rect('pelvis_front', 22, 2, 2, 12, c, 0); at.rect('pelvis_front', 18, 5, 10, 2, c, 0)
        for (x, y) in ((21, 2), (24, 2), (21, 13), (24, 13), (17, 4), (17, 7), (28, 4), (28, 7)): at.put('pelvis_front', x, y, g)
    # arms
    sleeve = sp.get('sleeve', 'long')
    garment('uarm', 16, 32, top if sleeve != 'none' else skin, topk if topk not in ('dino', 'overalls', 'hoodie', 'polo') else 'plain', 'side')
    garment('farm', 16, 32, top if sleeve == 'long' else skin, topk if sleeve == 'long' and topk not in ('dino', 'overalls', 'hoodie', 'polo') else 'plain', 'side')
    if sp.get('coat') and sleeve != 'none':       # the coat's sleeves
        cc = hexc(sp['coat'].get('color', '#5a5a3a'))
        at.rect('uarm', 0, 0, 16, 32, cc, 0.07); at.rect('uarm', 7, 0, 1, 32, shade(cc, 0.8), 0)
        if sleeve in ('long',): at.rect('farm', 0, 0, 16, 32, cc, 0.07); at.rect('farm', 7, 0, 1, 32, shade(cc, 0.8), 0)
    if topk == 'ribs':
        at.rect('uarm', 0, 0, 16, 32, skin, 0.06); at.rect('farm', 0, 0, 16, 32, skin, 0.06)
        at.rect('farm', 7, 0, 2, 32, shade(skin, 0.7), 0); at.rect('uarm', 6, 10, 3, 3, shade(skin, 1.15), 0)
    at.fill('hand', 8, 8, shade(skin, 0.95), 0.03)
    # legs
    legk = sp.get('legs', 'pants')
    for nm in ('thighL', 'thighR', 'thigh_back', 'shin'):
        h = 32
        base = bot if legk in ('pants',) else skin
        at.fill(nm, 16, h, base, 0.06)
        if legk == 'pants' and 'jeans' in sp.get('tags', []):
            for y in range(0, h, 5): at.put(nm, 3 + (y % 7), y, shade(base, 1.2))
            if nm != 'shin': at.rect(nm, 0, 0, 1, h, shade(base, 1.25), 0)
        if legk == 'shorts' and nm != 'shin': at.rect(nm, 0, 0, 16, 32, bot, 0.05)
        if legk == 'torn':
            at.rect(nm, 0, 0, 16, 32, bot, 0.08)
            for _ in range(10): at.put(nm, rng.randrange(16), rng.randrange(32), shade(bot, 0.6))
    if 'dirt' in ex:      # grime from the night: blotches and smears over the clothes, a smudge on the cheek
        grime = (88, 76, 60)
        for nm in ('torso_front', 'torso_back', 'torso_side', 'abd_front', 'abd_back', 'abd_side', 'uarm', 'farm', 'thighL', 'thighR', 'thigh_back', 'shin', 'pelvis_front', 'pelvis_side'):
            if nm not in at.regions: continue
            x0, y0, w, h = at.regions[nm]
            for _ in range(int(w * h * 0.018)):
                x, y = rng.randrange(w), rng.randrange(h); cur = at.img.getpixel((x0 + x, y0 + y))[:3]
                at.put(nm, x, y, mix(cur, grime, rng.uniform(0.25, 0.55)))
            for _ in range(4):     # soft-edged smears, darker in the middle
                sx, sy = rng.randrange(w), rng.randrange(h); ex_, ey_ = rng.randrange(4, 10), rng.randrange(2, 6)
                for dx in range(ex_):
                    for dy in range(ey_):
                        if 0 <= sx + dx < w and 0 <= sy + dy < h:
                            edge = min(dx, ex_ - 1 - dx, dy, ey_ - 1 - dy)
                            cur = at.img.getpixel((x0 + sx + dx, y0 + sy + dy))[:3]; at.put(nm, sx + dx, sy + dy, mix(cur, grime, 0.22 + 0.14 * min(edge, 2)))
        x0, y0, w, h = at.regions['face']
        for dx in range(4):
            cur = at.img.getpixel((x0 + 22 + dx, y0 + 19))[:3]; at.put('face', 22 + dx, 19, mix(cur, grime, 0.35))
    if 'tatters' in ex:     # Louis's cardigan: torn open in ragged holes, grey skin and rib showing through
        for nm in ('torso_front', 'torso_back', 'torso_side', 'abd_front', 'abd_back', 'abd_side', 'uarm', 'thighL', 'thighR', 'thigh_back', 'pelvis_front'):
            if nm not in at.regions: continue
            x0, y0, w, h = at.regions[nm]
            for _ in range(3 if w > 16 else 2):
                cx, cy, rw, rh = rng.randrange(w), rng.randrange(h), rng.randrange(3, 7), rng.randrange(3, 9)
                for dx in range(-rw, rw + 1):
                    for dy in range(-rh, rh + 1):
                        if (dx / max(1, rw)) ** 2 + (dy / max(1, rh)) ** 2 > 1.0 + rng.uniform(-0.3, 0.2): continue
                        x, y = cx + dx, cy + dy
                        if 0 <= x < w and 0 <= y < h:
                            edge = (dx / max(1, rw)) ** 2 + (dy / max(1, rh)) ** 2 > 0.6
                            at.put(nm, x, y, shade(skin, 0.55) if edge else shade(skin, 0.9 + 0.1 * ((x + y) % 2)))
    if 'burns' in ex:       # cracks across his skin, black at the seam with an ember glow in it (the scorched sheets)
        for nm in ('face', 'head_side', 'head_sideR', 'head_top', 'neck', 'farm', 'hand', 'skin'):
            if nm not in at.regions: continue
            x0, y0, w, h = at.regions[nm]
            for _ in range(max(1, w * h // 160)):
                x, y = rng.randrange(w), rng.randrange(h)
                for k in range(rng.randrange(4, 12)):
                    if 0 <= x < w and 0 <= y < h:
                        at.put(nm, x, y, (36, 18, 14))
                        if rng.random() < 0.35 and x + 1 < w: at.put(nm, x + 1, y, (196, 84, 28))
                    x += rng.choice((-1, 0, 1)); y += rng.choice((0, 1, 1))
    if 'cross_blade_right' in ex:      # Louis: a large burned cross on the right shoulder blade, still smoking
        c = (30, 16, 12); g = (150, 48, 22)
        at.rect('torso_back', 21, 6, 3, 14, c, 0); at.rect('torso_back', 17, 10, 11, 3, c, 0)
        for (x, y) in ((20, 6), (24, 7), (20, 19), (24, 18), (16, 11), (28, 10), (17, 13), (27, 12)): at.put('torso_back', x, y, g)
    if 'cross_shoulder_right' in ex:     # small burned cross on the back of the right shoulder, through the sweater
        c = (45, 30, 22); g = (120, 55, 28)
        at.rect('torso_back', 24, 2, 2, 8, c, 0); at.rect('torso_back', 22, 4, 6, 2, c, 0)
        at.put('torso_back', 23, 3, g); at.put('torso_back', 26, 9, g); at.put('torso_back', 21, 5, g)
    at.fill('foot', 16, 16, shoe, 0.05); at.rect('foot', 0, 12, 16, 4, shade(shoe, 0.6), 0)
    if topk == 'dress' or botk == 'dress' or botk == 'skirt':
        c = top if botk == 'dress' else bot
        at.fill('skirt', 32, 32, c, 0.05)
        if botk == 'dress':
            at.rect('skirt', 0, 28, 32, 4, shade(c, 0.8), 0)
            for x in range(0, 32, 4): at.put('skirt', x + 1, 27, shade(c, 1.2))
    if style in ('long', 'bob', 'ponytail', 'pigtails'):
        at.fill('hair_panel', 32, 32, hair, 0.09)
        for x in range(0, 32, 3): at.rect('hair_panel', x, 0, 1, 32, shade(hair, 0.8), 0)
    if 'party_hat' in ex:
        at.fill('hat', 16, 16, (230, 80, 160), 0.04)
        for y in range(0, 16, 5): at.rect('hat', 0, y, 16, 2, (250, 220, 70), 0)
    at.mirror_copy('head_side', 'head_sideR')
    at.fill('dark', 8, 8, (20, 18, 18), 0.0)
    at.fill('white', 8, 8, (245, 245, 245), 0.0)

    # ---- swatches for the 3D hair, face features and garment pieces
    at.fill('hair', 32, 32, hair, 0.10)
    if style not in ('buzz', 'patchy'):
        for x in range(0, 32, 3): at.rect('hair', x, 0, 1, 32, shade(hair, 0.78), 0)
        for x in range(1, 32, 5): at.rect('hair', x, 0, 1, 32, shade(hair, 1.2), 0)
    if style == 'curly':
        for _ in range(90): at.rect('hair', rng.randrange(31), rng.randrange(31), 2, 2, shade(hair, rng.choice((0.6, 1.35))), 0)
    at.fill('hair_dk', 8, 8, shade(hair, 0.55), 0.05)
    at.fill('beard', 16, 16, shade(hair, 1.05), 0.0)
    for x in range(16):
        for y in range(16): at.put('beard', x, y, shade(hair, rng.uniform(0.75, 1.3)))
    at.fill('skin', 8, 8, skin, 0.03)
    if sp.get('arm_scale'):
        # the Brute arm's skin: stretched over muscle that shouldn't be there, blotched red and purple, roped with dark veins
        rr = random.Random(41)
        at.fill('brute', 32, 32, shade(skin, 0.95), 0.08)
        for _ in range(14):                                     # bruised, engorged patches
            cx, cy, r_ = rr.randint(0, 31), rr.randint(0, 31), rr.randint(2, 5)
            col = rr.choice([(150, 70, 70), (120, 66, 92), (170, 104, 92)])
            for y in range(cy - r_, cy + r_ + 1):
                for x in range(cx - r_, cx + r_ + 1):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= r_ * r_ and rr.random() < 0.8:
                        at.put('brute', x % 32, y % 32, mix(shade(skin, 0.9), col, 0.55))
        for _ in range(7):                                      # veins: dark, branching, running down the arm
            x, y = rr.randint(0, 31), 0
            while y < 32:
                at.put('brute', x % 32, y, (62, 40, 78)); at.put('brute', (x + 1) % 32, y, (88, 58, 100))
                y += 1; x += rr.choice((-1, 0, 0, 1))
                if rr.random() < 0.08:                          # a branch
                    bx, by = x, y
                    for k in range(rr.randint(3, 7)):
                        bx += rr.choice((-1, 1)); by += 1
                        if by < 32: at.put('brute', bx % 32, by, (70, 46, 84))
        for _ in range(10):                                     # pale stretch marks across the swelling
            x, y = rr.randint(0, 31), rr.randint(0, 31)
            for k in range(rr.randint(3, 6)): at.put('brute', (x + k) % 32, y, shade(skin, 1.25))
    at.fill('skin_dk', 8, 8, shade(skin, 0.78), 0.03)
    at.fill('ear', 8, 8, shade(skin, 0.94), 0.03); at.rect('ear', 2, 2, 4, 5, shade(skin, 0.82), 0)
    knit = topk in ('stripes', 'plain', 'hoodie', 'dino', 'cardigan', 'dress', 'overalls')
    rib_base = top
    at.fill('rib', 16, 8, shade(rib_base, 0.92), 0.02)
    for x in range(0, 16, 2): at.rect('rib', x, 0, 1, 8, shade(rib_base, 0.74), 0)
    at.fill('collar', 16, 8, shade(top, 1.1 if topk == 'polo' else 0.96), 0.03)
    if topk == 'plaid':
        for x in range(1, 16, 5): at.rect('collar', x, 0, 1, 8, shade(top, 0.5), 0)
        at.rect('collar', 0, 4, 16, 1, shade(top, 0.5), 0)
    if topk == 'puffer':
        at.rect('collar', 0, 0, 16, 1, shade(top, 1.6), 0); at.rect('collar', 8, 0, 1, 8, shade(top, 1.9), 0)
    if topk == 'puffer':
        at.fill('cuff', 8, 8, shade(top, 0.5), 0.02); at.fill('hem', 16, 8, shade(top, 0.5), 0.02)
    elif knit:
        for nm, w_ in (('cuff', 8), ('hem', 16)):
            at.fill(nm, w_, 8, shade(top, 0.9), 0.02)
            for x in range(0, w_, 2): at.rect(nm, x, 0, 1, 8, shade(top, 0.72), 0)
    else:
        at.fill('cuff', 8, 8, shade(top, 0.86), 0.03); at.rect('cuff', 0, 6, 8, 1, shade(top, 0.6), 0)
        at.fill('hem', 16, 8, shade(top, 0.88), 0.03); at.rect('hem', 0, 5, 16, 1, shade(top, 0.62), 0)
    if topk == 'stripes':   # the sweater's ribbing is knitted in the cream base, with a green tip line
        for nm in ('rib', 'cuff', 'hem'): at.rect(nm, 0, 0, at.regions[nm][2], 1, top2, 0)
    if topk == 'dress':
        at.fill('trim', 8, 8, (244, 240, 230), 0.02)
    else:
        at.fill('trim', 8, 8, shade(top, 1.15), 0.02)
    at.fill('pocket', 16, 8, shade(top, 0.82), 0.04); at.rect('pocket', 0, 0, 16, 2, shade(top, 0.62), 0)
    if topk == 'plaid':
        for x in range(2, 16, 5): at.rect('pocket', x, 0, 1, 8, shade(top, 0.45), 0)
        at.rect('pocket', 0, 5, 16, 1, shade(top, 0.45), 0); at.put('pocket', 8, 3, (230, 220, 200))
    at.fill('lapel', 8, 8, shade(top, 0.84), 0.03)
    at.fill('sash', 16, 8, hexc(P.get('sash', '#f4efe2')), 0.03); at.rect('sash', 0, 0, 16, 1, shade(hexc(P.get('sash', '#f4efe2')), 0.8), 0)
    at.fill('metal', 4, 4, (214, 186, 92), 0.0)
    lum = sum(shoe) / 3
    at.fill('sole', 8, 8, (232, 228, 220) if lum > 170 else shade(shoe, 0.45), 0.02)
    if lum > 170: at.rect('sole', 0, 0, 8, 2, (200, 120, 90), 0)    # sneaker stripe along the midsole
    at.fill('tie', 4, 4, hexc(P.get('tie', '#d03040')), 0.0)
    sk = top if botk == 'dress' else bot
    at.fill('skirt_in', 8, 8, shade(sk, 0.42), 0.03)
    at.fill('skirt_hem', 16, 8, shade(sk, 0.8), 0.03)
    if botk == 'dress':
        for x in range(0, 16, 3): at.put('skirt_hem', x, 2, shade(sk, 1.25)); at.put('skirt_hem', x + 1, 5, shade(sk, 1.25))
    at.fill('bib', 16, 16, top2, 0.04)
    at.rect('bib', 0, 0, 16, 1, shade(top2, 1.3), 0); at.rect('bib', 1, 1, 1, 15, shade(top2, 1.3), 0); at.rect('bib', 14, 1, 1, 15, shade(top2, 1.3), 0)
    at.rect('bib', 4, 5, 8, 6, shade(top2, 0.85), 0); at.rect('bib', 4, 5, 8, 1, shade(top2, 1.3), 0)
    at.fill('strap', 8, 8, top2, 0.04)
    at.fill('sock', 8, 8, (236, 236, 236), 0.02); at.rect('sock', 0, 0, 8, 1, (200, 200, 205), 0)
    at.fill('belt', 16, 8, belt if belt else shade(bot, 0.7), 0.03)

# ======================================================================= model geometry
HEAD_T = [(-60, 60, 'face'), (60, 120, 'head_sideR'), (120, 240, 'head_back'), (240, 300, 'head_side')]
def TQ(f, s, b): return [(-60, 60, f), (60, 120, s), (120, 240, b), (240, 300, s)]

# hairline heights are fractions of the head height (0 = chin, 1 = crown); th = shell thickness in metres
HAIR = {
    'short':    dict(front=0.77, side=0.56, back=0.24, th=0.013, lift=0.008),
    'buzz':     dict(front=0.80, side=0.60, back=0.27, th=0.006),
    'long':     dict(front=0.80, side=0.56, back=0.30, th=0.013, lift=0.008),
    'bob':      dict(front=0.80, side=0.56, back=0.30, th=0.013, lift=0.010),
    'ponytail': dict(front=0.80, side=0.56, back=0.30, th=0.010, lift=0.004),
    'pigtails': dict(front=0.80, side=0.56, back=0.30, th=0.011, lift=0.005),
    'curly':    dict(front=0.83, side=0.40, back=0.14, th=0.03, lift=0.018, bump=0.008, rows=6, double='hair_dk'),
}

def build(sp):
    seed = zlib.crc32(sp['id'].encode())
    at = Atlas(seed & 0xffff)
    paint(sp, at)
    at.pack()
    J, D = joints_for(sp)
    mesh = Mesh()
    bi = {b: i for i, b in enumerate(BONES)}
    H, hy, sy, hh, sw, hw = D['H'], D['hip_y'], D['sh_y'], D['head_h'], D['sw'], D['hw']
    th = sp.get('thick', 1.0); belly = sp.get('belly', 0.0); kid = D['kid']; puff = sp.get('puff', 1.0)
    depth = sp.get('depth', 0.185 if not kid else 0.14) * th
    topk = sp.get('top', 'plain'); botk = sp.get('bottom_kind', 'pants'); legk = sp.get('legs', 'pants'); sleeve = sp.get('sleeve', 'long')
    ex = set(sp.get('extras', [])); st = sp.get('hair', 'short')
    dress = botk == 'dress'; skirt = botk in ('dress', 'skirt'); across = bool(sp.get('spikes'))
    untucked = topk in ('puffer', 'stripes', 'plaid', 'cardigan', 'hoodie', 'plain', 'dino') and botk != 'skirt'
    cb = J['chest'][1]; hy0 = J['head'][1]
    pel_w = hw + 0.1 * th * (0.7 if kid else 1)
    waist = sp.get('waist', pel_w * 0.95)
    chest_w = sw * 0.88 * puff
    bust = sp.get('bust', 0.0)
    dz = depth / 2; sq = puff; PT = sp.get('torso_p', 2.25)
    tt, ta, tp = TQ('torso_front', 'torso_side', 'torso_back'), TQ('abd_front', 'abd_side', 'abd_back'), TQ('pelvis_front', 'pelvis_side', 'pelvis_back')
    nw = (0.075 if not kid else 0.065) * th

    # ------------------------------------------------------------------ torso
    loft(mesh, at, bi['hips'], [
        dict(y=hy + 0.075, w=waist * 0.93, zf=dz * 0.92, zb=dz * 0.92, p=PT),
        dict(y=hy - 0.02, w=pel_w, zf=dz * 1.02, zb=dz * 1.05, p=PT),
        dict(y=hy - 0.10, w=pel_w * 0.9, zf=dz * 0.95, zb=dz, p=PT)], n=14, tex=tp, cap_bot='pelvis_side')
    abd = [dict(y=cb + 0.025, w=chest_w * 0.9 + belly * 0.4, zf=(dz * 1.04 + belly * 0.4) * sq, zb=dz * sq),
           dict(y=(hy + cb) / 2 + 0.02, w=waist * 1.02 * sq + belly * 0.6, zf=(dz + belly * 0.62) * sq, zb=dz * 0.96 * sq),
           dict(y=hy + 0.06, w=waist * sq + belly * 0.4, zf=(dz + belly * 0.5) * sq, zb=dz * sq)]
    if topk == 'puffer': abd = quilt(abd, 0.05, 0.93)
    for r in abd: r['p'] = PT
    if untucked:
        hw_ = max(pel_w * 1.07, waist * 1.1) * sq + belly * 0.3     # roomy enough that the hips never poke through when the spine sways
        hzf = (dz * 1.14 + belly * 0.35) * sq; hzb = dz * 1.18 * sq
        y1 = hy - 0.0; y2 = hy - 0.032
        abd += [dict(y=y1, w=hw_, zf=hzf, zb=hzb, p=PT, tex='cuff' if topk == 'puffer' else 'hem'),
                dict(y=y2, w=hw_ * 1.01, zf=hzf * 1.01, zb=hzb * 1.01, p=PT, tex='dark'),
                dict(y=y2, w=hw_ * 0.84, zf=hzf * 0.84, zb=hzb * 0.84, p=PT)]
    loft(mesh, at, bi['spine'], abd, n=14, tex=ta)
    shw = max(chest_w, (sw + 0.02) * puff)      # the shoulder ring caps the tops of the arms
    ch = [dict(y=sy + 0.022, w=chest_w * 0.7, zf=dz * 0.6 * sq, zb=dz * 0.66 * sq),
          dict(y=sy - 0.012, w=shw * 0.94, zf=dz * 0.86 * sq, zb=dz * 0.9 * sq),
          dict(y=sy - 0.05, w=shw, zf=dz * 0.98 * sq, zb=dz * sq),
          dict(y=sy - 0.11, w=chest_w * 0.97 + belly * 0.2, zf=(dz * 1.04 + bust + belly * 0.3) * sq, zb=dz * sq),
          dict(y=cb - 0.01, w=chest_w * 0.92 + belly * 0.4, zf=(dz * 1.03 + belly * 0.45) * sq, zb=dz * 0.98 * sq)]
    if topk == 'puffer': ch = ch[:1] + quilt(ch[1:], 0.05, 0.93)
    for r in ch: r['p'] = PT
    loft(mesh, at, bi['chest'], ch, n=14, tex=tt, cap_top='torso_side')
    cfz = lambda y: front_at(ch, y)       # chest front surface z at height y
    afz = lambda y: front_at(abd, y)

    # ------------------------------------------------------------------ neck + head
    loft(mesh, at, bi['neck'], [dict(y=hy0 + 0.04, w=nw, d=nw * 1.05, z=0.01), dict(y=sy - 0.02, w=nw * 1.12, d=nw * 1.15, z=0.006)], n=8, tex='neck')
    F = dict(chin=0.42, jaw=0.8, cheek=0.96, brow=1.0, temple=0.98, crown=0.84, top=0.5, jaw_y=0.16, cheek_y=0.38, brow_y=0.6,
             temple_y=0.78, crown_y=0.92, p=2.1, chin_fwd=0.0, back=1.0, dchin=0.0)
    if kid: F.update(chin=0.5, jaw=0.86, cheek=1.0, crown=0.9, top=0.56, p=2.0, back=1.06)
    F.update(sp.get('face', {}))
    F['p'] = min(F['p'], 2.0 + (F['p'] - 2.0) * 0.45)          # v11: rounder skulls everywhere (squarer faces stay a little squarer)
    hwid = sp.get('head_w', 0.15 if not kid else 0.155) * 0.9; hdep = sp.get('head_d', 0.18 if not kid else 0.17) * 0.92
    hz = hdep / 2; cz = 0.012; bk = F['back']
    Y = lambda f: hy0 + f * hh
    hr = [dict(y=Y(1.0), w=hwid * F['top'] * 0.5, zf=hz * 0.24, zb=hz * 0.3 * bk, tex='head_top'),
          dict(y=Y(0.975), w=hwid * F['top'] * 1.12, zf=hz * 0.55, zb=hz * 0.64 * bk, tex='head_top'),
          dict(y=Y(F['crown_y']), w=hwid * F['crown'], zf=hz * 0.82, zb=hz * 0.9 * bk),
          dict(y=Y(F['temple_y']), w=hwid * F['temple'], zf=hz * 0.96, zb=hz * bk),
          dict(y=Y(F['brow_y']), w=hwid * F['brow'], zf=hz, zb=hz * 0.98 * bk),
          dict(y=Y(F['cheek_y']), w=hwid * F['cheek'], zf=hz * 0.98, zb=hz * 0.84 * bk),
          dict(y=Y((F['jaw_y'] + F['cheek_y']) / 2), w=hwid * (F['jaw'] + F['cheek']) / 2 * 0.99, zf=hz * 0.96, zb=hz * 0.68 * bk),
          dict(y=Y(F['jaw_y']), w=hwid * F['jaw'], zf=hz * 0.93, zb=hz * 0.5),
          dict(y=Y(0.06), w=hwid * (F['chin'] + F['jaw']) / 2 * 0.92, zf=hz * (0.9 + F['chin_fwd'] * 0.8), zb=hz * 0.3),
          dict(y=Y(0.0), w=hwid * F['chin'], zf=hz * (0.8 + F['chin_fwd']), zb=hz * 0.12)]
    if F['dchin']: hr.append(dict(y=Y(-0.06), w=hwid * F['jaw'] * 0.86, zf=hz * (0.62 + 0.12 * F['dchin']), zb=hz * 0.1))
    for r in hr: r['p'] = F['p']; r['z'] = cz
    loft(mesh, at, bi['head'], hr, n=16, tex=HEAD_T, cap_top='head_top', cap_bot='neck')
    hs = HeadShape(hr, cz, hy0, hh)
    # nose
    NS = dict(len=0.016, w=0.026, top=0.57, bot=0.37)
    if kid: NS.update(len=0.010, w=0.02, bot=0.39, top=0.55)
    NS.update(sp.get('nose', {}))
    yb, yt = Y(NS['bot']), Y(NS['top'])
    prism(mesh, at, bi['head'], (0, yb, hs.front_z(yb) - NS['len'] * 0.5 + 0.004), (0, yt, hs.front_z(yt) + 0.003),
          (NS['w'], NS['len']), (NS['w'] * 0.5, 0.012), dict(side='skin', front='skin', top='skin', bottom='skin_dk'), chamfer=0.35)
    # ears
    if st not in ('long', 'bob', 'curly'):
        for sx in (-1, 1):
            xe = sx * (hs.par(Y(0.45))['w'] / 2 - 0.004)
            prism(mesh, at, bi['head'], (xe - sx * 0.003, Y(0.35), cz + 0.008), (xe + sx * 0.003, Y(0.55), cz + 0.014), (0.012, 0.022), (0.014, 0.034),
                  dict(side='skin_dk', left='ear', right='ear', cap='skin_dk'), chamfer=0.4)

    # ------------------------------------------------------------------ hair
    hd = dict(HAIR.get(st, {})); hd.update(sp.get('hairdo', {}))
    hair_top = Y(1.0)
    if st in HAIR:
        hair_top = hair_cap(mesh, at, bi['head'], hs, hd, seed)
    if st == 'curly':     # clusters of curls over the shell
        r_ = random.Random(seed + 7)
        for i in range(18):
            t = (i * 137.5) % 360
            if abs(_wrapd(t)) < 50: t = 180 + _wrapd(t) * 2.5     # keep the face clear
            f = r_.uniform(0.25, 0.98) if abs(_wrapd(t)) > 90 else r_.uniform(0.55, 0.98)
            c = hs.point(Y(f), t, hd['th'] * 0.8); rr = r_.uniform(0.018, 0.026)
            loft(mesh, at, bi['head'], [dict(y=c[1] + rr, x=c[0], z=c[2], w=rr * 0.9, p=2.0), dict(y=c[1], x=c[0], z=c[2], w=rr * 2.0, p=2.0),
                                        dict(y=c[1] - rr, x=c[0], z=c[2], w=rr * 0.9, p=2.0)], n=6, tex='hair', cap_top='hair', cap_bot='hair_dk', phase=r_.uniform(0, 60))
    tk = hd.get('th', 0.012)
    if st in ('long', 'bob'):
        wm, zbm = hs.wmax(), hs.zbmax(); kx = hwid / 0.135 * (0.7 if kid else 1.0)
        def at_head(f, off):
            q = hs.par(Y(f)); return dict(y=Y(f), z=cz, p=F['p'], w=q['w'] + 2 * off, zf=q['zf'] + off, zb=q['zb'] + off)
        if st == 'long':
            L = sp.get('hair_len', 0.22)
            back_min = dz * sq + 0.02 - cz
            rings = [at_head(0.80, tk * 0.6), at_head(0.5, tk + 0.009),
                     dict(y=Y(0.22), z=cz, p=F['p'], w=wm + 2 * tk + 0.01 * kx, zf=hs.par(Y(0.22))['zf'] * 0.9, zb=zbm + tk + 0.008 * kx),
                     dict(y=Y(-0.1), z=cz, p=2.2, w=wm + 2 * tk + 0.018 * kx, zf=hz * 0.55, zb=max(zbm + tk + 0.01 * kx, back_min)),
                     dict(y=hy0 - L, z=cz, p=2.2, w=wm + 2 * tk + 0.03 * kx, zf=hz * 0.42, zb=max(zbm + tk, back_min + 0.01), jag=0.012)]
            loft(mesh, at, bi['head'], rings, n=14 if 'front_locks' in ex else 12, tex='hair', arc=(60, 300), double='hair_dk', seed=seed)
            if 'front_locks' in ex:     # two locks framing the face, falling past the collarbones
                for sx in (-1, 1):
                    pz = cz + hs.par(Y(0.18))['zf']
                    pts = [hs.point(Y(0.7), sx * 62, tk + 0.003), hs.point(Y(0.45), sx * 68, tk + 0.008), hs.point(Y(0.2), sx * 72, tk + 0.012),
                           np.array([sx * (wm / 2 + 0.006), Y(-0.06), pz - 0.02]), np.array([sx * (wm / 2 + 0.016), hy0 - L * 0.55, cz + hz * 0.32]),
                           np.array([sx * (wm / 2 + 0.02), hy0 - L * 0.9, cz + hz * 0.26])]
                    tail(mesh, at, bi['head'], pts, [0.026, 0.034, 0.036, 0.034, 0.026, 0.008], n=6)
            if 'side_part' in ex:       # a soft side-swept fringe over the left of the forehead
                hair_sheet(mesh, at, bi['head'], hs, (-58, 22), 8,
                           [(0.99, tk + 0.003), (0.88, tk + 0.007), (lambda t: 0.74 + 0.05 * max(0.0, (t + 58) / 80.0), tk + 0.006, 0.004),
                            (lambda t: 0.72 + 0.05 * max(0.0, (t + 58) / 80.0), 0.002)], 'hair', seed=seed + 3)
        else:
            rings = [at_head(0.80, tk * 0.6), at_head(0.55, tk + 0.01),
                     dict(y=Y(0.3), z=cz, p=F['p'], w=wm + 2 * tk + 0.014, zf=hs.par(Y(0.3))['zf'] + tk + 0.004, zb=zbm + tk + 0.01),
                     dict(y=Y(0.12), z=cz, p=F['p'], w=wm + 2 * tk + 0.018, zf=hs.par(Y(0.12))['zf'] + tk + 0.003, zb=zbm + tk + 0.012, jag=0.004),
                     dict(y=Y(0.09), z=cz, p=F['p'], w=wm + 2 * tk + 0.004, zf=hs.par(Y(0.12))['zf'], zb=zbm + tk + 0.002)]
            loft(mesh, at, bi['head'], rings, n=12, tex='hair', arc=(52, 308), double='hair_dk', seed=seed)
    if sp.get('bangs'):
        by = sp.get('bang_y', 0.63)
        hair_sheet(mesh, at, bi['head'], hs, (-60, 60), 8,
                   [(hd['front'] + 0.07, tk + 0.004), (0.72, tk + 0.006), (by, tk * 0.75, 0.006), (by, 0.002)], 'hair', seed=seed)
    if st == 'ponytail':
        tie = hs.point(Y(0.5), 205, tk)
        zb_ = cz + hs.zbmax()
        pts = [tie, (tie[0] - 0.025, Y(0.33), zb_ + 0.035), (-0.055, Y(0.05), zb_ + 0.035), (-0.07, Y(-0.25), zb_ + 0.012),
               (-0.072, Y(-0.45), zb_ - 0.004)]
        tail(mesh, at, bi['head'], pts, [0.045, 0.064, 0.058, 0.042, 0.012], tie='tie')
    if st == 'pigtails':
        for sx in (-1, 1):
            tie = hs.point(Y(0.62), 100 if sx > 0 else 260, tk)
            pts = [tie, (tie[0] + sx * 0.03, Y(0.5), tie[2] + 0.008), (sx * (hwid / 2 + 0.055), Y(0.28), cz + 0.02),
                   (sx * (hwid / 2 + 0.058), Y(0.05), cz + 0.022), (sx * (hwid / 2 + 0.05), Y(-0.1), cz + 0.02)]
            tail(mesh, at, bi['head'], pts, [0.034, 0.046, 0.042, 0.032, 0.01], tie='tie')
    if st == 'bald':   # the Stranger's horseshoe fringe
        hair_sheet(mesh, at, bi['head'], hs, (70, 290), 10,
                   [(lambda t: 0.5 + 0.06 * abs(math.sin(math.radians(t))), 0.001, 0.01), (lambda t: 0.48 + 0.05 * abs(math.sin(math.radians(t))), 0.005),
                    (0.4, 0.007), (0.28, 0.005), (0.28, 0.001)], 'beard', seed=seed, bump=0.0015)
    if st == 'patchy':   # a few dead tufts left on the ACROSS scalp
        r_ = random.Random(seed)
        for _ in range(9):
            t = r_.uniform(80, 280); f = r_.uniform(0.62, 0.98)
            b0 = hs.point(Y(f), t, -0.002); b1 = hs.point(Y(f) - 0.03, t + r_.uniform(-15, 15), 0.012 + r_.uniform(0, 0.008))
            prism(mesh, at, bi['head'], b0, b1, (0.014, 0.014), (0.004, 0.004), dict(side='hair', cap='hair'))
    if 'tuft' in ex:     # a cowlick on top
        for t, l in ((-20, 0.05), (10, 0.042), (35, 0.034)):
            b0 = hs.point(Y(0.93), t, tk - 0.006); b1 = b0 + np.array([0.006, l, -0.016])
            prism(mesh, at, bi['head'], b0, b1, (0.02, 0.016), (0.004, 0.004), dict(side='hair', cap='hair'))
    if 'beard' in ex:
        def btop(t):
            a = abs(_wrapd(t)); return 0.19 + 0.3 * min(1.0, a / 95.0)
        hair_sheet(mesh, at, bi['head'], hs, (-112, 112), 14,
                   [(btop, 0.001), (btop, 0.005), (0.12, 0.008), (0.0, 0.01), (-0.04, 0.007), (-0.05, 0.0)], 'beard', seed=seed, bump=0.0015)
        hair_sheet(mesh, at, bi['head'], hs, (-30, 30), 4, [(0.30, 0.001), (0.30, 0.005), (0.262, 0.006), (0.262, 0.001)], 'beard', seed=seed)
    if 'party_hat' in ex:
        prism(mesh, at, bi['head'], (0, hair_top - 0.01, cz), (0, hair_top + 0.15, cz), (0.1, 0.1), (0.01, 0.01), dict(side='hat', cap='hat'))
    if 'white_eyes' in ex:
        ey = Y(0.505)
        for sx in (-1, 1):
            t = min(range(0, 61), key=lambda a: abs(abs(hs.point(ey, a, 0)[0]) - hwid * 0.22))
            p = hs.point(ey, sx * t, 0.002)
            prism(mesh, at, bi['head'], (p[0], ey, p[2]), (p[0], ey + 0.022, p[2]), (0.035, 0.01), (0.035, 0.01), dict(side='white', cap='white'), mat=1)

    # ------------------------------------------------------------------ collars and garment details (chest bone unless noted)
    C = bi['chest']
    def crew(tex, wm=1.0):
        loft(mesh, at, C, [dict(y=sy + 0.05, w=nw * 1.62 * wm, d=nw * 1.62 * wm, z=0.008), dict(y=sy + 0.025, w=nw * 1.98 * wm, d=nw * 1.92 * wm, z=0.006),
                           dict(y=sy + 0.008, w=nw * 2.1 * wm, d=nw * 2.0 * wm, z=0.006)], n=12, tex=tex)
    def shirt_collar(big=1.0):
        top_ = 0.045 if topk == 'buttonup' else 0.06; arc_ = (72, 288) if topk == 'buttonup' else (62, 298)
        loft(mesh, at, C, [dict(y=sy + top_, w=nw * 1.75, d=nw * 1.75, z=0.008), dict(y=sy + 0.012, w=nw * 2.1, d=nw * 2.0, z=0.006)],
             n=10, tex='collar', arc=arc_, double='dark')
        for sx in (-1, 1):
            y0, y1 = sy + 0.035, sy - 0.04 * big
            prism(mesh, at, C, (sx * 0.02, y0, -nw * 0.9), (sx * 0.062 * big, y1, cfz(y1) - 0.001), (0.03, 0.007), (0.014, 0.005),
                  dict(side='collar', cap='collar'))
    if topk == 'puffer':     # tall stand collar with the zip line
        loft(mesh, at, C, [dict(y=sy + 0.1, w=nw * 1.85, zf=nw * 0.95, zb=nw * 0.9, z=0.006), dict(y=sy + 0.03, w=nw * 2.25, zf=nw * 1.12, zb=nw * 1.05, z=0.006),
                           dict(y=sy + 0.005, w=nw * 2.5, zf=nw * 1.25, zb=nw * 1.15, z=0.006)], n=12, tex=TQ('collar', 'collar', 'collar'), double='dark')
        for bone, y0, y1, fz in ((C, sy - 0.02, cb, cfz), (bi['spine'], cb, hy - 0.03, afz)):
            prism(mesh, at, bone, (0, y0, fz(y0) - 0.003), (0, y1, fz(y1) - 0.003), (0.012, 0.01), (0.012, 0.01), dict(side='cuff', cap='cuff'))
    elif topk in ('stripes', 'plain', 'dino'):
        crew('rib')
    elif topk == 'dress':
        crew('trim', 1.04)
    elif topk == 'overalls':
        crew('rib')
    elif topk in ('plaid', 'polo', 'buttonup'):
        shirt_collar(0.85 if topk == 'polo' else 1.0)
        if topk == 'plaid':
            for sx in (-1, 1):
                y0, y1 = sy - 0.145, sy - 0.08
                x = sx * chest_w * 0.22
                prism(mesh, at, C, (x, y0, cfz(y0) - 0.004), (x, y1, cfz(y1) - 0.004), (0.055, 0.008), (0.055, 0.008),
                      dict(front='pocket', side='pocket', cap='pocket'))
    elif topk == 'hoodie':
        loft(mesh, at, C, [dict(y=sy + 0.075, w=nw * 2.3, zf=nw * 1.0, zb=nw * 1.35, z=0.004), dict(y=sy + 0.03, w=nw * 3.1, zf=nw * 1.3, zb=nw * 1.8, z=0.004),
                           dict(y=sy - 0.03, w=nw * 2.9, zf=nw * 1.25, zb=nw * 1.72, z=0.004), dict(y=sy - 0.06, w=nw * 2.1, zf=nw * 1.0, zb=nw * 1.3, z=0.004)],
             n=12, tex='collar', arc=(48, 312), double='dark')
        for sx in (-1, 1):
            y1 = sy - 0.13
            prism(mesh, at, C, (sx * 0.024, sy + 0.01, -nw * 1.28), (sx * 0.03, y1, cfz(y1) - 0.007), (0.008, 0.008), (0.007, 0.007), dict(side='white', cap='white'))
        y0, y1 = hy - 0.0, hy + 0.105
        prism(mesh, at, bi['spine'], (0, y0, afz(y0) - 0.007), (0, y1, afz(y1) - 0.006), (waist * 0.66 * sq, 0.012), (waist * 0.56 * sq, 0.012),
              dict(front='pocket', side='pocket', cap='pocket'))
    elif topk == 'cardigan':
        crew('trim', 0.95)    # the white top underneath
        for sx in (-1, 1):
            for bone, y0, y1, x0, x1, fz in ((C, sy + 0.015, cb, 0.022, 0.045, cfz), (bi['spine'], cb, hy - 0.035, 0.045, 0.05, afz)):
                prism(mesh, at, bone, (sx * x0, y0, fz(y0) - 0.005), (sx * x1, y1, fz(y1) - 0.006), (0.03, 0.012), (0.03, 0.012), dict(side='lapel', cap='lapel'))
    if topk == 'overalls':
        y0, y1 = cb - 0.005, sy - 0.075
        prism(mesh, at, C, (0, y0, cfz(y0) - 0.006), (0, y1, cfz(y1) - 0.006), (chest_w * 0.52, 0.012), (chest_w * 0.48, 0.012), dict(front='bib', side='strap', cap='strap'))
        y2 = hy + 0.06
        prism(mesh, at, bi['spine'], (0, y2, afz(y2) - 0.006), (0, cb + 0.01, afz(cb) - 0.006), (waist * 0.62, 0.012), (chest_w * 0.52, 0.012),
              dict(front='strap', side='strap', cap='strap'))
        for sx in (-1, 1):
            xf, xt, xb = sx * chest_w * 0.2, sx * chest_w * 0.24, sx * chest_w * 0.14
            top_ = (xt, sy + 0.032, 0.0)
            prism(mesh, at, C, (xf, y1, cfz(y1) - 0.007), top_, (0.026, 0.009), (0.026, 0.009), dict(side='strap', cap='strap'))
            prism(mesh, at, C, top_, (xb, cb, dz * sq + 0.006), (0.026, 0.009), (0.026, 0.009), dict(side='strap', cap='strap'))
            prism(mesh, at, C, (xf, y1 - 0.004, cfz(y1) - 0.012), (xf, y1 + 0.014, cfz(y1) - 0.012), (0.014, 0.006), (0.014, 0.006), dict(side='metal', cap='metal'))
    if dress:      # sash at the waist
        loft(mesh, at, bi['spine'], [dict(y=hy + 0.115, w=waist * 1.07, zf=dz * 1.08, zb=dz * 1.08, p=PT), dict(y=hy + 0.065, w=waist * 1.08, zf=dz * 1.1, zb=dz * 1.1, p=PT)],
             n=12, tex='sash')
    if not untucked and not skirt and topk not in ('overalls', 'ribs') and sp['pal'].get('belt'):
        loft(mesh, at, bi['hips'], [dict(y=hy + 0.078, w=waist * 1.06, zf=dz * 1.07, zb=dz * 1.07, p=PT), dict(y=hy + 0.045, w=waist * 1.07, zf=dz * 1.08, zb=dz * 1.08, p=PT)],
             n=12, tex='belt')
        prism(mesh, at, bi['hips'], (0, hy + 0.045, -dz * 1.08 - 0.004), (0, hy + 0.078, -dz * 1.08 - 0.004), (0.036, 0.008), (0.036, 0.008), dict(side='metal', cap='metal'))

    # ------------------------------------------------------------------ arms
    base_aw = sp.get('arm_w', 0.072 if not kid else 0.055) * th
    aw = base_aw * puff * sp.get('arm_puff', 1.12 if sp.get('coat') else 1.0); skw = base_aw * (0.8 if not across else 0.95)
    for s, sx in (('L', -1), ('R', 1)):
        a, e, w = J['upperarm.' + s], J['forearm.' + s], J['hand.' + s]
        U, Fo, Hb = bi['upperarm.' + s], bi['forearm.' + s], bi['hand.' + s]
        R = lambda y, wd, x, **k: dict(y=y, w=wd, d=wd, x=x, p=2.1, **k)
        ks = sp.get('arm_scale', {}).get(s, 1.0)        # a BCROSS Brute grows muscle and skin on one arm (never bone: same length)
        if ks > 1.25:
            # the sleeve burst off at the shoulder: a torn stub, then the swollen bare arm. Not a human arm grown big:
            # uneven, lopsided masses of flesh, lumps and growths where no muscle should be, roped with veins. It is drawn
            # in the "flesh" material, which makes it crawl and heave under the skin (shaders/ps1_flesh.gdshader).
            rr = random.Random(77)
            Bu = lambda y, wd, x, b=0.25: dict(y=y, w=wd, d=wd * rr.uniform(0.8, 1.15), x=x + rr.uniform(-0.012, 0.012), p=2.0, bump=wd * b)
            # ks = how many times thicker than his normal arm (nu: a normal upper arm, nf: a normal bare forearm). Same length.
            nu = aw * 1.0; nf = skw * 0.85
            loft(mesh, at, U, [Bu(a[1] - 0.0, nu * 0.85 * ks, a[0], 0.1), Bu(a[1] - 0.05, nu * 1.05 * ks, a[0]), Bu(a[1] - 0.11, nu * 0.92 * ks, a[0]),
                               Bu(a[1] - 0.17, nu * 1.1 * ks, a[0]), Bu(e[1] + 0.05, nu * 0.82 * ks, e[0]), Bu(e[1] - 0.01, nf * 0.95 * ks, e[0], 0.12)],
                 n=12, tex='brute', mat=2, seed=5)
            loft(mesh, at, Fo, [Bu(e[1] + 0.02, nf * 1.0 * ks, e[0], 0.12), Bu(e[1] - 0.06, nf * 1.2 * ks, e[0]), Bu(e[1] - 0.12, nf * 1.0 * ks, e[0]),
                                Bu(e[1] - 0.19, nf * 1.12 * ks, e[0]), Bu(w[1] + 0.03, nf * 0.86 * ks, w[0], 0.15), Bu(w[1] - 0.005, nf * 0.8 * ks, w[0], 0.1)],
                 n=12, tex='brute', mat=2, seed=9)
            # the swelling doesn't stop at the arm: it runs up into the shoulder, the trapezius and the left side of
            # his chest and back, so the arm grows out of the body with no seam (all on the chest bone; the top of the
            # arm is buried inside it, so the join holds as the arm swings)
            shy = D['sh_y']; cy = J['chest'][1]; sx_ = a[0]
            Sm = lambda y, wd, dp, x, b=0.18: dict(y=y, w=wd, d=dp * rr.uniform(0.92, 1.08), x=x, z=rr.uniform(-0.01, 0.01), p=2.1, bump=wd * b)
            loft(mesh, at, bi['chest'], [Sm(shy + 0.075, nu * 1.4, depth * 0.55, sx_ * 0.45, 0.12),       # the trapezius, swollen up toward the neck
                                         Sm(shy + 0.02, nu * 2.9, depth * 1.05, sx_ * 0.72),                # over the shoulder
                                         Sm(shy - 0.06, nu * 3.4, depth * 1.32, sx_ * 0.82),                # the deltoid, the heaviest mass
                                         Sm(shy - 0.15, nu * 3.0, depth * 1.28, sx_ * 0.74),                # pec and lat, swallowing the arm's top
                                         Sm(cy - 0.02, nu * 2.0, depth * 1.12, sx_ * 0.5),
                                         Sm(cy - 0.12, nu * 1.1, depth * 0.9, sx_ * 0.35, 0.1)],            # fading into the ribs
                 n=14, tex='brute', mat=2, seed=13, cap_top='brute', cap_bot='brute')
            # the cardigan, burst. Its left side is still there on the inside of the swelling (front and back), stretched
            # tight over it, and ends in a torn edge; on the outside the knit has split open and the flesh bulges through.
            # Shreds of the sleeve hang off the shoulder and cling to the arm. (Angles: 0 front, 90 toward his middle,
            # 180 back, -90 the outside of the shoulder.)
            Fb = lambda y, wd, dp, x, **k: dict(y=y, w=wd * 1.22, d=dp * 1.24, x=x, p=2.1, **k)     # out past the lumps: stretched over them
            fab = [Fb(shy + 0.075, nu * 1.4, depth * 0.55, sx_ * 0.45), Fb(shy + 0.02, nu * 2.9, depth * 1.05, sx_ * 0.72),
                   Fb(shy - 0.06, nu * 3.4, depth * 1.32, sx_ * 0.82), Fb(shy - 0.15, nu * 3.0, depth * 1.28, sx_ * 0.74),
                   Fb(cy - 0.02, nu * 2.0, depth * 1.12, sx_ * 0.5)]
            for (a0, a1, top, bot, sd) in ((8, 100, 1, 5, 21), (100, 172, 1, 5, 22),        # stretched over the pec / the back, torn edges
                                            (-14, 8, 2, 4, 23), (172, 196, 2, 4, 24)):      # tattered flaps where it split
                rows = [dict(r) for r in fab[top - 1:bot]]
                rows[-1]['jag'] = 0.04; rows[0]['jag'] = 0.015
                loft(mesh, at, bi['chest'], rows, n=6, arc=(a0, a1), tex='coat', double='coat', seed=sd)
            for (a0, a1, L, sd) in ((-70, -56, 0.2, 31), (-112, -98, 0.26, 32), (-150, -138, 0.16, 33), (222, 236, 0.22, 34)):   # strips across the split
                rows = [dict(fab[1]), dict(fab[2]), dict(Fb(shy - 0.06 - L, nu * 3.2, depth * 1.3, sx_ * 0.8, jag=0.03))]
                loft(mesh, at, bi['chest'], rows, n=2, arc=(a0, a1), tex='coat', double='coat', seed=sd)
            for (a0, a1, L, sd) in ((20, 46, 0.22, 41), (150, 172, 0.3, 42), (250, 268, 0.18, 43)):   # what's left of the sleeve, clinging to the arm
                rows = [dict(y=a[1] - 0.02, w=nu * 1.32 * ks, d=nu * 1.32 * ks, x=a[0], p=2.0), dict(y=a[1] - 0.02 - L, w=nu * 1.4 * ks, d=nu * 1.4 * ks, x=a[0], p=2.0, jag=0.04)]
                loft(mesh, at, U, rows, n=3, arc=(a0, a1), tex='uarm', double='coat', seed=sd)
            # growths: lopsided masses bulging out of the arm at odd places
            for (g_bone, g_j0, g_j1, g_f, g_ang, g_sz) in ((U, a, e, 0.18, 200, 1.0), (U, a, e, 0.45, 70, 1.25), (U, a, e, 0.62, 300, 0.8), (U, a, e, 0.85, 150, 0.9),
                                               (Fo, e, w, 0.2, 250, 1.1), (Fo, e, w, 0.5, 20, 0.85), (Fo, e, w, 0.72, 120, 0.7)):
                g_x = g_j0[0] + (g_j1[0] - g_j0[0]) * g_f; g_y = g_j0[1] + (g_j1[1] - g_j0[1]) * g_f
                g_r = (nu if g_bone == U else nf) * ks * 0.5
                g_dx, g_dz = math.cos(math.radians(g_ang)), math.sin(math.radians(g_ang))
                g_base = (g_x + g_dx * g_r * 0.55, g_y, g_dz * g_r * 0.55)
                g_tip = (g_x + g_dx * g_r * (1.15 + 0.35 * g_sz), g_y - 0.01, g_dz * g_r * (1.15 + 0.35 * g_sz))
                g_w = (nu if g_bone == U else nf) * ks * 0.42 * g_sz
                prism(mesh, at, g_bone, g_base, g_tip, (g_w, g_w * 1.3), (g_w * 0.55, g_w * 0.8), dict(side='brute', cap='brute'), chamfer=0.45, mat=2)
        elif sleeve == 'none':
            loft(mesh, at, U, [R(a[1] - 0.0, aw * 0.8, a[0]), R(a[1] - 0.025, aw * 1.02, a[0]), R(e[1] - 0.02, aw * 0.82, e[0])], n=10, tex='uarm', cap_top='uarm')
            loft(mesh, at, Fo, [R(e[1] + 0.03, aw * 0.78, e[0]), R(e[1] - 0.02, aw * 0.84, e[0]), R(w[1], aw * 0.6, w[0])], n=10, tex='farm', cap_bot='farm')
        elif sleeve == 'long':
            up = [R(a[1] + 0.0, aw * 0.8, a[0]), R(a[1] - 0.025, aw * 1.07, a[0]), R(a[1] - 0.07, aw * 1.06, a[0]), R(e[1] - 0.02, aw * 0.95, e[0])]
            fo = [R(e[1] + 0.035, aw * 0.88, e[0]), R(e[1] - 0.03, aw * 0.97, e[0]), R(w[1] + 0.045, aw * 0.86, w[0])]
            if topk == 'puffer':
                up = up[:1] + quilt(up[1:], 0.05, 0.9); fo = quilt(fo, 0.05, 0.9)
                for r in up + fo: r['p'] = 2.4; r['d'] = r['w']
            cw = aw * (0.72 if topk == 'puffer' else 0.9)
            fo += [R(w[1] + 0.035, cw, w[0], tex='cuff'), R(w[1] - 0.01, cw, w[0], tex='dark'), R(w[1] - 0.01, skw * 0.5, w[0])]
            loft(mesh, at, U, up, n=10, tex='uarm', cap_top='uarm')
            loft(mesh, at, Fo, fo, n=10, tex='farm')
        elif sleeve == 'rolled':     # sleeves rolled to just below the elbow, bare forearms
            up = [R(a[1] + 0.0, aw * 0.8, a[0]), R(a[1] - 0.025, aw * 1.07, a[0]), R(a[1] - 0.07, aw * 1.06, a[0]), R(e[1] - 0.02, aw * 0.95, e[0])]
            loft(mesh, at, U, up, n=10, tex='uarm', cap_top='uarm')
            loft(mesh, at, Fo, [R(e[1] + 0.035, aw * 0.9, e[0]), R(e[1] - 0.01, aw * 1.04, e[0], tex='cuff'), R(e[1] - 0.07, aw * 1.08, e[0], tex='dark'),
                                R(e[1] - 0.07, skw * 0.7, e[0])], n=8, tex='uarm')
            loft(mesh, at, Fo, [R(e[1] - 0.04, skw * 0.9, e[0]), R(w[1], skw * 0.72, w[0])], n=10, tex='skin')
        else:
            if topk == 'dress':
                up = [R(a[1] + 0.008, aw * 0.9, a[0]), R(a[1] - 0.012, aw * 1.32, a[0]), R(a[1] - 0.025, aw * 1.44, a[0]),
                      R(a[1] - 0.065, aw * 1.06, a[0], tex='trim'), R(a[1] - 0.08, aw * 1.06, a[0], tex='dark'), R(a[1] - 0.08, skw * 0.7, a[0])]
            else:
                up = [R(a[1] + 0.0, aw * 0.8, a[0]), R(a[1] - 0.025, aw * 1.1, a[0]),
                      R(a[1] - 0.075, aw * 1.16, a[0], tex='hem'), R(a[1] - 0.1, aw * 1.18, a[0], tex='dark'), R(a[1] - 0.1, skw * 0.7, a[0])]
            loft(mesh, at, U, up, n=10, tex='uarm', cap_top='uarm')
            loft(mesh, at, U, [R(a[1] - 0.05, skw, a[0]), R(e[1] - 0.02, skw * 0.9, e[0])], n=10, tex='skin')
            loft(mesh, at, Fo, [R(e[1] + 0.03, skw * 0.86, e[0]), R(e[1] - 0.02, skw * 0.9, e[0]), R(w[1], skw * 0.72, w[0])], n=10, tex='skin')
        # hand: palm, finger block (or claws), thumb
        hf = 2.0 if ks > 1.25 else 1.0          # the Brute's hand: twice the size, to match the arm
        hl = (0.17 * (H / 1.8) if not kid else 0.11) * sp.get('hand_scale', 1.0) * (1.0 + (hf - 1.0) * 0.6)
        hwd = (skw if not across else aw * 0.8) * hf * 1.1
        wx = w[0]
        prism(mesh, at, Hb, (wx, w[1] + 0.012, 0), (wx, w[1] - hl * 0.6, -0.004), (hwd * 0.6, hwd * 0.95), (hwd * 0.5, hwd * 1.05), dict(side='hand', cap='hand'), chamfer=0.3)
        if across:
            for k_, zz in enumerate((-0.016, 0.0, 0.016)):
                zz *= hf
                prism(mesh, at, Hb, (wx, w[1] - hl * 0.55, zz - 0.004), (wx + sx * 0.006, w[1] - hl * (1.18 + 0.06 * (k_ == 1)), zz * 1.5 - 0.012),
                      (0.014 * hf, 0.014 * hf), (0.004 * hf, 0.004 * hf), dict(side='hand', cap='hand'))
        else:
            prism(mesh, at, Hb, (wx, w[1] - hl * 0.56, -0.004), (wx, w[1] - hl, -0.012), (hwd * 0.48, hwd * 1.0), (hwd * 0.36, hwd * 0.76), dict(side='hand', cap='hand'), chamfer=0.3)
        prism(mesh, at, Hb, (wx - sx * 0.006, w[1] - 0.012, -hwd * 0.36), (wx - sx * 0.013, w[1] - hl * 0.55, -hwd * 0.62), (0.017, 0.017), (0.012, 0.012),
              dict(side='hand', cap='hand'))

    # ------------------------------------------------------------------ legs + shoes
    lw = sp.get('leg_w', 0.12 if not kid else 0.085) * th
    fh = D['foot_h']
    socks = 'socks' in ex
    for s, sx in (('L', -1), ('R', 1)):
        t, k, f = J['thigh.' + s], J['shin.' + s], J['foot.' + s]
        Tb, Kb, Fb = bi['thigh.' + s], bi['shin.' + s], bi['foot.' + s]
        tf = 'thighL' if s == 'L' else 'thighR'
        TT = [(-90, 90, tf), (90, 270, 'thigh_back')]
        Lr = lambda y, wd, x, **kw: dict(y=y, w=wd, d=wd * 1.04, x=x, p=2.15, **kw)
        if legk in ('pants', 'torn'):
            loft(mesh, at, Tb, [Lr(t[1] + 0.075, lw * 1.18, t[0]), Lr(t[1] - 0.08, lw * 1.1, t[0]), Lr(k[1] - 0.025, lw * 0.9, k[0])], n=10, tex=TT)
            if legk == 'pants':
                loft(mesh, at, Kb, [Lr(k[1] + 0.045, lw * 0.86, k[0]), Lr(k[1] - 0.05, lw * 0.86, k[0]), Lr(f[1] + 0.06, lw * 0.74, f[0]),
                                    Lr(f[1] + 0.035, lw * 0.78, f[0]), Lr(f[1] - 0.014, lw * 0.8, f[0], tex='dark'), Lr(f[1] - 0.014, lw * 0.42, f[0])], n=8, tex='shin')
            else:
                km = (k[1] + f[1]) / 2
                loft(mesh, at, Kb, [Lr(k[1] + 0.045, lw * 0.86, k[0]), Lr(k[1] - 0.05, lw * 0.86, k[0]), Lr(km, lw * 0.86, f[0], jag=0.03)], n=10, tex='shin',
                     double='dark', seed=seed + (s == 'R'))
                loft(mesh, at, Kb, [Lr(km + 0.05, lw * 0.56, f[0]), Lr(f[1], lw * 0.46, f[0])], n=6, tex='skin')
        elif legk == 'shorts':
            mid = (t[1] + k[1]) / 2
            loft(mesh, at, Tb, [Lr(t[1] + 0.075, lw * 1.3, t[0]), Lr(mid, lw * 1.36, t[0], tex='dark'), Lr(mid, lw * 0.76, t[0])], n=10, tex=TT)
            loft(mesh, at, Tb, [Lr(mid + 0.04, lw * 0.86, t[0]), Lr(k[1] - 0.02, lw * 0.76, k[0])], n=10, tex='skin')
            loft(mesh, at, Kb, [Lr(k[1] + 0.04, lw * 0.74, k[0]), Lr(k[1] - 0.04, lw * 0.72, k[0]), Lr(f[1] + 0.05, lw * 0.56, f[0], tex='sock' if socks else 'skin'),
                                Lr(f[1] - 0.005, lw * 0.6 if socks else lw * 0.52, f[0])], n=8, tex='skin')
        else:    # bare legs under a dress or skirt
            loft(mesh, at, Tb, [Lr(t[1] + 0.06, lw * 0.98, t[0]), Lr(k[1] - 0.02, lw * 0.78, k[0])], n=10, tex='skin')
            loft(mesh, at, Kb, [Lr(k[1] + 0.04, lw * 0.74, k[0]), Lr(k[1] - 0.04, lw * 0.72, k[0]),
                                Lr(f[1] + 0.07 if socks else f[1] + 0.02, lw * 0.58 if socks else lw * 0.54, f[0], tex='sock' if socks else 'skin'),
                                Lr(f[1] - 0.005, lw * 0.62 if socks else lw * 0.52, f[0])], n=8, tex='skin')
        fl = sp.get('foot_len', 0.26 if not kid else 0.17)
        prism(mesh, at, Fb, (f[0], fh * 0.55, 0.055), (f[0], fh * 0.42, 0.055 - fl), (lw * 0.78, fh * 1.15), (lw * 0.82, fh * 0.8),
              dict(side='foot', cap='foot', top='foot', bottom='sole'), chamfer=0.4)
        if not across:
            prism(mesh, at, Fb, (f[0], 0.011, 0.066), (f[0], 0.011, 0.047 - fl), (lw * 0.86, 0.022), (lw * 0.88, 0.022), dict(side='sole', cap='sole'), chamfer=0.4)
        if 'boots' in ex:   # leather boots: a stacked heel and a welt, the shaft under the jeans
            prism(mesh, at, Fb, (f[0], 0.006, 0.07), (f[0], 0.006, 0.0), (lw * 0.72, 0.03), (lw * 0.74, 0.03), dict(side='sole', cap='sole'), chamfer=0.3)
            loft(mesh, at, Kb, [Lr(f[1] + 0.12, lw * 0.82, f[0]), Lr(f[1] + 0.02, lw * 0.86, f[0])], n=10, tex='foot')

    # ------------------------------------------------------------------ skirts
    if skirt:
        sl = sp.get('skirt_len', 0.42 if not kid else 0.3); fl_ = sp.get('flare', 1.6)
        ratio = depth / pel_w * 0.52
        if dress:
            rs = [dict(y=hy + 0.08, w=waist * 1.04), dict(y=hy + 0.02, w=pel_w * 1.14, pleat=0.025),
                  dict(y=hy - sl * 0.5, w=pel_w * (1 + (fl_ - 1) * 0.55), pleat=0.04),
                  dict(y=hy - sl + 0.035, w=pel_w * fl_ * 0.98, pleat=0.045, tex='skirt_hem'), dict(y=hy - sl, w=pel_w * fl_, pleat=0.045)]
        else:
            rs = [dict(y=hy + 0.08, w=waist * 1.05, tex='belt'), dict(y=hy + 0.05, w=waist * 1.06), dict(y=hy - 0.02, w=pel_w * 1.1),
                  dict(y=hy - sl, w=pel_w * fl_)]
        for r in rs: r['zf'] = r['zb'] = max(r['w'] * ratio, dz * 1.12 * (1.0 if r['y'] > hy else 1.06)); r['p'] = 2.4
        loft(mesh, at, bi['hips'], rs, n=16, tex='skirt', double='skirt_in')

    # ------------------------------------------------------------------ v11 outerwear: coats, vests, scarves, hats (real volume off the body)
    coat = sp.get('coat')
    if coat:
        op = coat.get('open', 28); arc_ = (op, 360 - op); off = coat.get('off', 0.016); L = coat.get('len', 0.25); fl = coat.get('flare', 1.18)
        jag = coat.get('jag', 0.0)
        grow = lambda r, k=1.0: dict(y=r['y'], w=r['w'] + 2 * off * k, zf=r.get('zf', r['w'] / 2) + off * k, zb=r.get('zb', r['w'] / 2) + off * k, p=PT, z=r.get('z', 0.0))
        loft(mesh, at, bi['chest'], [grow(r) for r in ch[1:]], n=14, tex='coat', arc=arc_, double='coat_in')
        loft(mesh, at, bi['spine'], [grow(r) for r in abd[:3]], n=14, tex='coat', arc=arc_, double='coat_in')
        top_w = max(pel_w * 1.12, waist * 1.12) + 2 * off; tz = dz * 1.18 + off
        tails = [dict(y=hy + 0.07, w=top_w * 0.98, zf=tz, zb=tz, p=PT), dict(y=hy - 0.03, w=top_w * 1.04, zf=tz * 1.05, zb=tz * 1.08, p=PT),
                 dict(y=hy - L * 0.6, w=top_w * (1 + (fl - 1) * 0.6), zf=tz * (1 + (fl - 1) * 0.5), zb=tz * (1 + (fl - 1) * 0.7), p=PT),
                 dict(y=hy - L, w=top_w * fl, zf=tz * (1 + (fl - 1) * 0.7), zb=tz * fl, p=PT, jag=jag, tex='coat_hem')]
        loft(mesh, at, bi['hips'], tails, n=16, tex='coat', arc=(op + 6, 354 - op), double='coat_in', seed=seed)
        cl = coat.get('collar', 'lapel')
        if cl == 'up':          # a stand-up collar, turned up against the rain
            loft(mesh, at, C, [dict(y=sy + 0.085, w=nw * 2.5, zf=nw * 1.2, zb=nw * 1.3, z=0.004), dict(y=sy + 0.02, w=nw * 2.7, zf=nw * 1.3, zb=nw * 1.4, z=0.004),
                               dict(y=sy - 0.01, w=nw * 2.9, zf=nw * 1.4, zb=nw * 1.5, z=0.004)], n=12, tex='coat', arc=(op + 10, 350 - op), double='coat_in')
        elif cl == 'lapel':     # wide lapels folded back over the chest
            for sx in (-1, 1):
                y0, y1 = sy + 0.02, sy - 0.16
                prism(mesh, at, C, (sx * 0.035, y0, cfz(y0) - off - 0.004), (sx * 0.075, y1, cfz(y1) - off - 0.006), (0.06, 0.01), (0.02, 0.01),
                      dict(side='coat', cap='coat', front='coat'))
        if coat.get('pockets', True):
            for sx in (-1, 1):
                y0 = hy - 0.02; y1 = hy - 0.1
                prism(mesh, at, bi['hips'], (sx * top_w * 0.3, y0, -tz - 0.008), (sx * top_w * 0.32, y1, -tz * 1.06 - 0.008), (0.07, 0.01), (0.07, 0.01),
                      dict(side='coat_in', cap='coat_in', front='coat'))
        if coat.get('belt'):
            loft(mesh, at, bi['spine'], [dict(y=hy + 0.1, w=waist * 1.2 + 2 * off, zf=dz * 1.2 + off, zb=dz * 1.2 + off, p=PT),
                                          dict(y=hy + 0.06, w=waist * 1.22 + 2 * off, zf=dz * 1.22 + off, zb=dz * 1.22 + off, p=PT)], n=14, tex='coat_in')
    vest = sp.get('vest')
    if vest:                    # a quilted vest: puffed baffles over the shirt, no sleeves
        vo = 0.022
        vch = quilt([dict(y=r['y'], w=r['w'] + 2 * vo, zf=r.get('zf', r['w'] / 2) + vo, zb=r.get('zb', r['w'] / 2) + vo, z=r.get('z', 0.0)) for r in ch[1:]], 0.045, 0.9)
        vab = quilt([dict(y=r['y'], w=r['w'] + 2 * vo, zf=r.get('zf', r['w'] / 2) + vo, zb=r.get('zb', r['w'] / 2) + vo, z=r.get('z', 0.0)) for r in abd[:3]] +
                    [dict(y=hy - 0.02, w=max(pel_w, waist) * 1.12 + 2 * vo, zf=dz * 1.2 + vo, zb=dz * 1.22 + vo)], 0.045, 0.9)
        for r in vch + vab: r['p'] = PT
        loft(mesh, at, C, vch, n=14, tex='vest', arc=(8, 352), double='coat_in')
        loft(mesh, at, bi['spine'], vab, n=14, tex='vest', arc=(8, 352), double='coat_in')
        loft(mesh, at, C, [dict(y=sy + 0.07, w=nw * 2.3, zf=nw * 1.1, zb=nw * 1.2, z=0.004), dict(y=sy + 0.0, w=nw * 2.8, zf=nw * 1.35, zb=nw * 1.45, z=0.004)],
             n=12, tex='vest', arc=(14, 346), double='coat_in')
    if sp.get('scarf'):         # a thick knit scarf wrapped twice, one end hanging down the front
        loft(mesh, at, C, [dict(y=sy + 0.075, w=nw * 2.2, zf=nw * 1.15, zb=nw * 1.1, z=0.006), dict(y=sy + 0.045, w=nw * 2.75, zf=nw * 1.45, zb=nw * 1.35, z=0.006),
                           dict(y=sy + 0.005, w=nw * 2.8, zf=nw * 1.5, zb=nw * 1.4, z=0.006), dict(y=sy - 0.02, w=nw * 2.3, zf=nw * 1.2, zb=nw * 1.1, z=0.006)],
             n=12, tex='scarf', cap_top='scarf', cap_bot='scarf')
        y1 = cb - 0.02
        prism(mesh, at, C, (-0.03, sy + 0.0, cfz(sy) - 0.012), (-0.045, y1, cfz(y1) - 0.018), (0.06, 0.016), (0.055, 0.014), dict(side='scarf', cap='scarf', front='scarf'))
    hat = sp.get('hat')
    if hat:                     # a knit beanie with a folded brim
        hs_top = Y(1.0) + 0.012
        def hring(f, grow_, **k):
            q = hs.par(Y(f)); return dict(y=Y(f), z=cz, p=2.05, w=q['w'] + 2 * grow_, zf=q['zf'] + grow_, zb=q['zb'] + grow_, **k)
        loft(mesh, at, bi['head'], [dict(y=hs_top + 0.03, z=cz, p=2.0, w=hwid * 0.3, zf=hz * 0.2, zb=hz * 0.22), hring(0.96, 0.02), hring(0.86, 0.024),
                                    hring(0.74, 0.024), hring(0.72, 0.032, tex='hat_brim'), hring(0.6, 0.032), hring(0.6, 0.012)],
             n=14, tex='hat', cap_top='hat')

    # ------------------------------------------------------------------ ACROSS: vertebrae down the back, rib ridges
    if across:
        for i in range(6):
            y = hy + 0.06 + i * (sy - hy - 0.06) / 6; bone = 'spine' if y < cb else 'chest'
            zb = (abd if y < cb else ch); zz = interp_rings(zb, y); zz = zz['z'] + zz['zb']
            prism(mesh, at, bi[bone], (0, y, zz - 0.01), (0, y + 0.025, zz + 0.04), (0.03, 0.03), (0.012, 0.012), dict(side='white', cap='white'))
        for i in range(4):
            y = cb + 0.04 + i * 0.05
            for sxx in (-1, 1):
                prism(mesh, at, bi['chest'], (sxx * 0.03, y, cfz(y) + 0.004), (sxx * (chest_w * 0.42), y - 0.025, cfz(y) * 0.55), (0.015, 0.015), (0.012, 0.012),
                      dict(side='torso_side', cap='torso_side'))
    return mesh, J, at

# ======================================================================= animation
def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return (w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
            w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2)
def qaxis(ax, deg):
    h = math.radians(deg) / 2; s = math.sin(h)
    return (math.cos(h), ax[0] * s, ax[1] * s, ax[2] * s)
def euler(rx, ry, rz):
    return qmul(qaxis((0, 1, 0), ry), qmul(qaxis((1, 0, 0), rx), qaxis((0, 0, 1), rz)))

S = math.sin; Cc = math.cos; TAU = math.tau
def human_anims(kid=False, female=False):
    A = {}
    def base(t):
        return {}
    def idle(t):
        b = S(TAU * t / 3.0)
        return {'chest': (b * 1.2, 0, 0), 'head': (b * -1, S(TAU * t / 6) * 3, 0), 'upperarm.L': (0, 0, -4 + b), 'upperarm.R': (0, 0, 4 - b),
                'forearm.L': (6, 0, 0), 'forearm.R': (6, 0, 0), 'root': (0, b * 0.004, 0)}
    A['idle'] = (3.0, idle, True)
    def walk_fn(period, amp_leg, amp_arm, hand=None):
        def f(t):
            p = TAU * t / period; s = S(p)
            k_l = max(0, -S(p + 0.6)) * amp_leg * 1.3 + 4; k_r = max(0, S(p + 0.6)) * amp_leg * 1.3 + 4
            d = {'thigh.L': (s * amp_leg, 0, 0), 'thigh.R': (-s * amp_leg, 0, 0), 'shin.L': (-k_l, 0, 0), 'shin.R': (-k_r, 0, 0),
                 'foot.L': (-s * 6 + k_l * 0.3, 0, 0), 'foot.R': (s * 6 + k_r * 0.3, 0, 0),
                 'upperarm.L': (-s * amp_arm, 0, -5), 'upperarm.R': (s * amp_arm, 0, 5), 'forearm.L': (12 + max(0, -s) * 10, 0, 0), 'forearm.R': (12 + max(0, s) * 10, 0, 0),
                 'hips': (0, s * 5, 0), 'chest': (-2, -s * 6, 0), 'head': (1, s * 2, 0), 'root': (0, abs(Cc(p)) * 0.035 - 0.015, 0)}
            if hand == 'up_R':  # Adaline holding her dad's hand with her right hand
                d['upperarm.R'] = (40, 0, 28); d['forearm.R'] = (30, 0, 0)
            if hand == 'down_L':  # Kenneth reaching down with his left hand
                d['upperarm.L'] = (14, 0, -16); d['forearm.L'] = (8, 0, 0)
            return d
        return f
    A['walk'] = (0.95 if not kid else 0.6, walk_fn(0.95 if not kid else 0.6, 24, 16), True)
    A['run'] = (0.62 if not kid else 0.42, None, True)
    def run(t):
        per = A['run'][0]; p = TAU * t / per; s = S(p)
        k_l = max(0, -S(p + 0.8)) * 80 + 15; k_r = max(0, S(p + 0.8)) * 80 + 15
        return {'thigh.L': (s * 42 + 8, 0, 0), 'thigh.R': (-s * 42 + 8, 0, 0), 'shin.L': (-k_l, 0, 0), 'shin.R': (-k_r, 0, 0),
                'foot.L': (k_l * 0.25, 0, 0), 'foot.R': (k_r * 0.25, 0, 0),
                'upperarm.L': (-s * 40, 0, -8), 'upperarm.R': (s * 40, 0, 8), 'forearm.L': (75, 0, 0), 'forearm.R': (75, 0, 0),
                'spine': (-8, 0, 0), 'chest': (-4, -s * 8, 0), 'hips': (0, s * 7, 0), 'head': (8, 0, 0), 'root': (0, abs(Cc(p)) * 0.06 - 0.04, 0)}
    A['run'] = (A['run'][0], run, True)
    A['walk_hand'] = (A['walk'][0], walk_fn(A['walk'][0], 22 if not kid else 26, 14, 'up_R' if kid else 'down_L'), True)
    def idle_hand(t):
        d = idle(t)
        if kid: d['upperarm.R'] = (40, 0, 28); d['forearm.R'] = (30, 0, 0)
        else: d['upperarm.L'] = (14, 0, -16); d['forearm.L'] = (8, 0, 0)
        return d
    A['idle_hand'] = (3.0, idle_hand, True)
    def talk(t):
        d = idle(t); g = S(TAU * t / 2.4); g2 = S(TAU * t / 1.2)
        d['upperarm.R'] = (18 + g * 10, 0, 10); d['forearm.R'] = (55 + g2 * 15, 0, 0); d['hand.R'] = (0, 0, g2 * 10)
        d['head'] = (S(TAU * t / 0.8) * 4, S(TAU * t / 4.8) * 8, 0); d['chest'] = (0, g * 3, 0)
        return d
    A['talk'] = (2.4, talk, True)
    def listen(t):
        d = idle(t); d['head'] = (-3 + S(TAU * t / 2.0) * 3, 6, 4); d['upperarm.L'] = (8, 0, -6); d['forearm.L'] = (40, 0, 0); d['upperarm.R'] = (8, 0, 6); d['forearm.R'] = (40, 0, 0)
        return d
    A['listen'] = (4.0, listen, True)
    def hold_cup(t):
        d = idle(t); d['upperarm.R'] = (10, 0, 6); d['forearm.R'] = (78, 0, 0); d['hand.R'] = (0, -20, 0)
        return d
    A['hold_cup'] = (3.0, hold_cup, True)
    def scared(t):
        tr = S(TAU * t * 9) * 1.5
        return {'spine': (-10, 0, 0), 'chest': (-8, 0, 0), 'head': (-6 + tr, 0, 0), 'upperarm.L': (35, 0, 12), 'upperarm.R': (35, 0, -12),
                'forearm.L': (95 + tr, 0, 0), 'forearm.R': (95 - tr, 0, 0), 'thigh.L': (12, 0, 0), 'thigh.R': (12, 0, 0), 'shin.L': (-24, 0, 0), 'shin.R': (-24, 0, 0),
                'foot.L': (12, 0, 0), 'foot.R': (12, 0, 0), 'root': (0, -0.05, 0)}
    A['scared'] = (1.0, scared, True)
    def lean_look(t):   # cautious lean toward something on the floor
        b = S(TAU * t / 4.0)
        return {'spine': (-14, 0, 0), 'chest': (-10, 0, 0), 'head': (-22 + b * 2, 0, 0), 'upperarm.L': (14, 0, -6), 'upperarm.R': (24, 0, 6), 'forearm.L': (25, 0, 0), 'forearm.R': (45, 0, 0),
                'thigh.L': (6, 0, 0), 'shin.L': (-10, 0, 0), 'root': (0, -0.01, 0)}
    A['lean_look'] = (4.0, lean_look, True)
    def cower(t):
        tr = S(TAU * t * 7) * 2
        return {'spine': (-30, 0, 0), 'chest': (-25, 0, 0), 'head': (-25, 0, 0), 'upperarm.L': (150, 0, 20 + tr), 'upperarm.R': (150, 0, -20 - tr),
                'forearm.L': (110, 0, 0), 'forearm.R': (110, 0, 0), 'thigh.L': (95, 0, 0), 'thigh.R': (95, 0, 0), 'shin.L': (-130, 0, 0), 'shin.R': (-130, 0, 0),
                'foot.L': (35, 0, 0), 'foot.R': (35, 0, 0), 'root': (0, -0.42 if not kid else -0.26, 0)}
    A['cower'] = (1.0, cower, True)
    def panic(t):
        d = run(t); p = TAU * t / A['run'][0]
        d['upperarm.L'] = (60 + S(p) * 30, 0, -40); d['upperarm.R'] = (60 - S(p) * 30, 0, 40); d['forearm.L'] = (40, 0, 0); d['forearm.R'] = (40, 0, 0)
        return d
    A['panic_run'] = (A['run'][0], panic, True)
    def fall(t):   # knocked flat onto the back, 0.7 s
        k = min(1, t / 0.55); e = k * k
        drop = 0.86 if not kid else 0.42
        return {'hips': (88 * e, 0, 0), 'spine': (4 * e, 0, 0), 'head': (-12 * e, 25 * e, 0), 'upperarm.L': (-20 * e, 0, -70 * e), 'upperarm.R': (-10 * e, 0, 60 * e),
                'forearm.L': (20 * e, 0, 0), 'forearm.R': (35 * e, 0, 0),
                'thigh.L': (12 * e, 0, -8 * e), 'thigh.R': (2 * e, 0, 10 * e), 'shin.L': (-25 * e, 0, 0), 'shin.R': (-6 * e, 0, 0), 'foot.L': (-60 * e, 0, 0), 'foot.R': (-70 * e, 0, 0),
                'root': (0, -drop * e, 0.45 * e)}
    A['fall'] = (0.7, fall, False)
    A['down'] = (2.0, lambda t: fall(1.0), True)
    def cry(t):
        tr = S(TAU * t * 3) * 3
        return {'head': (-18 + tr, 0, 0), 'chest': (-6, 0, 0), 'upperarm.L': (40, 0, 14), 'upperarm.R': (40, 0, -14), 'forearm.L': (125, 0, 0), 'forearm.R': (125, 0, 0),
                'root': (0, abs(S(TAU * t * 1.5)) * 0.01, 0)}
    A['cry'] = (2.0, cry, True)
    def play(t):   # kids: hopping on the mats
        p = TAU * t / 0.7; hop = max(0, S(p))
        return {'thigh.L': (20 * hop, 0, 0), 'thigh.R': (20 * hop, 0, 0), 'shin.L': (-40 * hop, 0, 0), 'shin.R': (-40 * hop, 0, 0),
                'upperarm.L': (0, 0, -60 - 40 * hop), 'upperarm.R': (0, 0, 60 + 40 * hop), 'forearm.L': (10, 0, 0), 'forearm.R': (10, 0, 0),
                'head': (6, S(p / 2) * 10, 0), 'root': (0, hop * 0.18, 0)}
    A['play'] = (0.7, play, True)
    def wave(t):
        d = idle(t); d['upperarm.R'] = (0, 0, 150); d['forearm.R'] = (0, 0, 20 + S(TAU * t / 0.5) * 25)
        return d
    A['wave'] = (1.0, wave, True)
    def hug(t):
        return {'upperarm.L': (70, 0, 18), 'upperarm.R': (70, 0, -18), 'forearm.L': (70, 0, 0), 'forearm.R': (70, 0, 0), 'head': (-10 if not kid else 15, 0, 0),
                'spine': (-6 if not kid else 4, 0, 0), 'thigh.L': (35 if not kid else 0, 0, 0), 'shin.L': (-70 if not kid else 0, 0, 0), 'thigh.R': (5, 0, 0),
                'root': (0, -0.18 if not kid else 0, 0)}
    A['hug'] = (1.0, hug, True)
    def beg(t):   # pleading, hands clasped forward
        tr = S(TAU * t * 2) * 4
        return {'upperarm.L': (55 + tr, 0, 20), 'upperarm.R': (55 + tr, 0, -20), 'forearm.L': (60, 0, 0), 'forearm.R': (60, 0, 0), 'spine': (-10, 0, 0), 'head': (12, 0, 0),
                'root': (0, -0.02, 0)}
    A['beg'] = (1.0, beg, True)
    def shout(t):
        d = idle(t); d['head'] = (18, S(TAU * t / 2.0) * 25, 0); d['chest'] = (8, 0, 0); d['upperarm.R'] = (60, 0, 25); d['forearm.R'] = (100, 0, 0)
        return d
    A['shout'] = (2.0, shout, True)
    return A

def seat_anims(hip_y, kid=False, stranger=False):
    """Poses for the car: seated on a 0.48 m seat. hip_y = this character's hip height standing."""
    A = {}
    dy = (0.48 + 0.09) - hip_y
    shin = -70 if kid else -92
    def sit(t, arms=None):
        b = S(TAU * t / 3.0)
        d = {'thigh.L': (90, 0, -4), 'thigh.R': (90, 0, 4), 'shin.L': (shin, 0, 0), 'shin.R': (shin, 0, 0), 'foot.L': (0, 0, 0), 'foot.R': (0, 0, 0),
             'spine': (4, 0, 0), 'chest': (b, 0, 0), 'head': (-2, 0, 0), 'upperarm.L': (22, 0, 4), 'upperarm.R': (22, 0, -4), 'forearm.L': (50, 0, 0), 'forearm.R': (50, 0, 0),
             'root': (0, dy, 0.02)}
        return d
    A['sit'] = (3.0, sit, True)
    def drive(t):
        d = sit(t); w = S(TAU * t / 2.2) * 3
        d['upperarm.L'] = (58, 0, 10); d['upperarm.R'] = (58, 0, -10); d['forearm.L'] = (38, 0, 0); d['forearm.R'] = (38, 0, 0)
        d['hand.L'] = (0, 0, w); d['hand.R'] = (0, 0, w); d['head'] = (2, w, 0)
        return d
    A['sit_drive'] = (2.2, drive, True)
    def drive_tense(t):
        d = drive(t); j = S(TAU * t * 7) * 1.5
        d['chest'] = (-10, 0, 0); d['spine'] = (-4, 0, 0); d['head'] = (6 + j, S(TAU * t / 1.4) * 14, 0)
        d['upperarm.L'] = (62, 0, 12); d['upperarm.R'] = (62, 0, -12)
        return d
    A['sit_drive_tense'] = (1.4, drive_tense, True)
    def look_back(t):
        d = drive(t); d['chest'] = (0, 28, 0); d['neck'] = (0, 20, 0); d['head'] = (-4, 35, 0); d['upperarm.R'] = (40, 0, -20)
        return d
    A['sit_look_back'] = (2.0, look_back, True)
    def scared(t):
        d = sit(t); tr = S(TAU * t * 8) * 2
        d['upperarm.L'] = (48, 0, 22); d['upperarm.R'] = (48, 0, -22); d['forearm.L'] = (95 + tr, 0, 0); d['forearm.R'] = (95 - tr, 0, 0)
        d['head'] = (-14 + tr, 0, 0); d['chest'] = (-8, 0, 0)
        return d
    A['sit_scared'] = (1.0, scared, True)
    def cry(t):
        d = scared(t); d['head'] = (-22 + S(TAU * t * 3) * 3, 0, 0); d['forearm.L'] = (125, 0, 0); d['forearm.R'] = (125, 0, 0)
        return d
    A['sit_cry'] = (2.0, cry, True)
    def scream(t):
        d = sit(t); tr = S(TAU * t * 10) * 3
        d['head'] = (18 + tr, -20, 0); d['chest'] = (8, -10, 0); d['upperarm.L'] = (120, 0, 30); d['upperarm.R'] = (120, 0, -30)
        d['forearm.L'] = (60, 0, 0); d['forearm.R'] = (60, 0, 0)
        return d
    A['sit_scream'] = (1.0, scream, True)
    def beg(t):
        d = sit(t); tr = S(TAU * t * 2) * 3
        d['upperarm.L'] = (50 + tr, 0, 22); d['upperarm.R'] = (50 + tr, 0, -22); d['forearm.L'] = (70, 0, 0); d['forearm.R'] = (70, 0, 0); d['head'] = (-10, 0, 0)
        return d
    A['sit_beg'] = (1.0, beg, True)
    def stare(t):   # perfectly still, looking straight ahead (the Stranger after the tears stop)
        d = sit(0); d['head'] = (0, 0, 0); d['chest'] = (0, 0, 0)
        return d
    A['sit_stare'] = (2.0, stare, True)
    if stranger:
        def morph_pose(k):
            d = stare(0); e = k * k * (3 - 2 * k)
            d['neck'] = (-10 * e, 0, 14 * e); d['head'] = (8 * e, -10 * e, 26 * e); d['chest'] = (-6 * e, 0, 0)
            d['s:neck'] = (1, 1 + 1.9 * e, 1)
            for sd in ('L', 'R'):
                d['s:upperarm.' + sd] = (1, 1 + 0.35 * e, 1); d['s:forearm.' + sd] = (1, 1 + 0.35 * e, 1); d['s:hand.' + sd] = (1 + 0.3 * e, 1 + 0.6 * e, 1 + 0.3 * e)
            d['upperarm.L'] = (22 - 30 * e, 0, 4 + 10 * e); d['upperarm.R'] = (22 - 30 * e, 0, -4 - 10 * e); d['forearm.L'] = (50 - 40 * e, 0, 0); d['forearm.R'] = (50 - 40 * e, 0, 0)
            return d
        A['morph'] = (4.0, lambda t: morph_pose(min(1.0, t / 4.0)), False)
        def morph_hold(t):
            d = morph_pose(1.0); d['head'] = (8, -10 + S(TAU * t / 3.0) * 4, 26 + S(TAU * t / 2.0) * 3)
            return d
        A['morph_hold'] = (3.0, morph_hold, True)
        def morph_lunge(t):
            k = min(1.0, t / 0.35); e = 1 - (1 - k) ** 3
            d = morph_pose(1.0)
            d['spine'] = (-35 * e, 0, 0); d['chest'] = (-45 * e, 0, 0); d['neck'] = (-20 * e, 0, 0); d['head'] = (40 * e, 0, 0)
            d['s:neck'] = (1, 2.9 + 0.6 * e, 1)
            d['upperarm.L'] = (150 * e, 0, 15); d['upperarm.R'] = (150 * e, 0, -15); d['forearm.L'] = (0, 0, 0); d['forearm.R'] = (0, 0, 0)
            d['root'] = (0, dy + 0.15 * e, -0.35 * e)
            return d
        A['morph_lunge'] = (0.5, morph_lunge, False)
    return A

def norah_anims(hip_y):
    """Norah's Chapter One actions: aiming the revolver, kneeling at the lockbox, pushing furniture, sitting against the tub."""
    A = {}
    def aim(t):
        b = S(TAU * t / 2.5) * 1.0
        return {'spine': (-2, -10, 0), 'chest': (-2, -12 + b, 0), 'head': (2, 18, 0), 'neck': (0, 4, 0),
                'upperarm.R': (84, 0, 6), 'forearm.R': (6, 0, 0), 'hand.R': (-6, 0, 0),
                'upperarm.L': (80, 0, -22), 'forearm.L': (22, 0, 0), 'hand.L': (-4, 0, 0),
                'thigh.L': (12, 0, -4), 'thigh.R': (-8, 0, 4), 'shin.L': (-10, 0, 0), 'shin.R': (-4, 0, 0), 'root': (0, -0.01, 0)}
    A['aim'] = (2.5, aim, True)
    def fire(t):
        d = aim(0); k = max(0.0, 1 - t / 0.35)
        d['upperarm.R'] = (84 + 22 * k, 0, 6); d['upperarm.L'] = (80 + 18 * k, 0, -22); d['head'] = (2 - 6 * k, 18, 0); d['chest'] = (-2 - 5 * k, -12, 0)
        return d
    A['fire'] = (0.4, fire, False)
    def kneel(t):
        w = S(TAU * t / 0.8) * 6
        return {'thigh.L': (95, 0, -6), 'shin.L': (-95, 0, 0), 'foot.L': (0, 0, 0), 'thigh.R': (5, 0, 6), 'shin.R': (-95, 0, 0), 'foot.R': (60, 0, 0),
                'spine': (-28, 0, 0), 'chest': (-12, 0, 0), 'head': (-22, 0, 0),
                'upperarm.L': (34 + w * 0.6, 0, -8), 'upperarm.R': (40 - w, 0, 8), 'forearm.L': (38, 0, 0), 'forearm.R': (46 + w, 0, 0),
                'hand.R': (0, 0, w), 'root': (0, -0.42, 0.04)}
    A['kneel'] = (0.8, kneel, True)
    def push(t):
        p = TAU * t / 1.3; s_ = S(p)
        return {'spine': (-22, 0, 0), 'chest': (-8, 0, 0), 'head': (12, 0, 0),
                'upperarm.L': (72, 0, -8), 'upperarm.R': (72, 0, 8), 'forearm.L': (24, 0, 0), 'forearm.R': (24, 0, 0), 'hand.L': (-40, 0, 0), 'hand.R': (-40, 0, 0),
                'thigh.L': (30 + s_ * 14, 0, 0), 'thigh.R': (-20 - s_ * 14, 0, 0), 'shin.L': (-30, 0, 0), 'shin.R': (-12, 0, 0), 'root': (0, -0.06, 0.08)}
    A['push'] = (1.3, push, True)
    dy = 0.13 - hip_y
    def sit_floor(t, aiming=False):
        b = S(TAU * t / 1.1) * 2
        d = {'thigh.L': (78, 0, -10), 'thigh.R': (78, 0, 10), 'shin.L': (-110, 0, 0), 'shin.R': (-110, 0, 0), 'foot.L': (30, 0, 0), 'foot.R': (30, 0, 0),
             'spine': (-6 + b, 0, 0), 'chest': (b, 0, 0), 'head': (8, 0, 0),
             'upperarm.L': (40, 0, -10), 'upperarm.R': (40, 0, 10), 'forearm.L': (70, 0, 0), 'forearm.R': (70, 0, 0), 'root': (0, dy, 0.08)}
        if aiming:
            d['upperarm.R'] = (78, 0, 4); d['forearm.R'] = (8, 0, 0); d['upperarm.L'] = (74, 0, -20); d['forearm.L'] = (24, 0, 0); d['head'] = (2, 0, 0); d['spine'] = (-10, 0, 0)
        return d
    A['sit_floor'] = (1.1, sit_floor, True)
    A['sit_aim'] = (1.1, lambda t: sit_floor(t, True), True)
    def sit_fire(t):
        d = sit_floor(0, True); k = max(0.0, 1 - t / 0.35)
        d['upperarm.R'] = (78 + 22 * k, 0, 4); d['upperarm.L'] = (74 + 18 * k, 0, -20); d['head'] = (2 - 8 * k, 0, 0)
        return d
    A['sit_fire'] = (0.4, sit_fire, False)
    def foot_turn(t):   # rolling the body over with her right boot
        k = S(min(1.0, t / 1.2) * math.pi)
        return {'thigh.R': (40 * k, 0, 8), 'shin.R': (-30 * k, 0, 0), 'foot.R': (10, 0, 0), 'thigh.L': (-4, 0, 0),
                'spine': (-8, 0, 0), 'chest': (-6, 0, 0), 'head': (-30, 0, 0), 'upperarm.L': (10, 0, -14), 'upperarm.R': (20, 0, 10), 'forearm.R': (30, 0, 0)}
    A['foot_turn'] = (1.6, foot_turn, False)
    def melee(t):       # a two-handed shove: step in, arms out hard, recover
        k = S(min(1.0, t / 0.45) * math.pi); e = min(1.0, t / 0.16)
        return {'spine': (-14 * k, 8 * (1 - e), 0), 'chest': (-10 * k, -6 * k, 0), 'head': (8 * k, 0, 0),
                'upperarm.L': (40 + 50 * k, 0, -10), 'upperarm.R': (40 + 50 * k, 0, 10), 'forearm.L': (60 - 55 * k, 0, 0), 'forearm.R': (60 - 55 * k, 0, 0),
                'hand.L': (-50 * k, 0, 0), 'hand.R': (-50 * k, 0, 0), 'thigh.L': (34 * k, 0, -4), 'thigh.R': (-18 * k, 0, 4), 'shin.L': (-20 * k, 0, 0), 'shin.R': (-10, 0, 0),
                'root': (0, -0.04 * k, -0.12 * k)}
    A['melee'] = (0.5, melee, False)
    def dodge(t):       # a low, fast sidestep-and-duck (the body is moved by the game; this is the crouch)
        k = S(min(1.0, t / 0.42) * math.pi)
        return {'spine': (-26 * k, 0, 10 * k), 'chest': (-10 * k, 0, 6 * k), 'head': (14 * k, 0, 0),
                'upperarm.L': (30 * k, 0, -40 * k), 'upperarm.R': (60 * k, 0, 20 * k), 'forearm.L': (40 * k, 0, 0), 'forearm.R': (30 * k, 0, 0),
                'thigh.L': (60 * k, 0, -14 * k), 'thigh.R': (20 * k, 0, 18 * k), 'shin.L': (-80 * k, 0, 0), 'shin.R': (-60 * k, 0, 0), 'root': (0, -0.28 * k, 0)}
    A['dodge'] = (0.45, dodge, False)
    def reload(t):      # break the cylinder open, thumb rounds in, snap it shut
        w = S(TAU * t / 0.3) * 8 if 0.3 < t < 1.0 else 0
        snap = 12 if t > 1.05 else 0
        return {'spine': (-6, 0, 0), 'chest': (-8, 0, 0), 'head': (-24, 0, 0), 'neck': (-6, 0, 0),
                'upperarm.R': (40, 0, 12), 'forearm.R': (78 - snap, 0, 0), 'hand.R': (-10, 0, -30 + snap * 2),
                'upperarm.L': (46 + w * 0.3, 0, -14), 'forearm.L': (76 + w, 0, 0), 'hand.L': (10, 0, 20),
                'thigh.L': (6, 0, -4), 'thigh.R': (-4, 0, 4), 'root': (0, -0.01, 0)}
    A['reload'] = (1.25, reload, False)
    def hurt(t):        # struck: thrown back and twisted
        k = max(0.0, 1 - t / 0.5)
        return {'spine': (16 * k, 18 * k, 0), 'chest': (12 * k, 14 * k, 0), 'head': (-20 * k, 20 * k, 0),
                'upperarm.L': (30 * k, 0, -50 * k), 'upperarm.R': (50 * k, 0, 40 * k), 'forearm.L': (40 * k, 0, 0), 'forearm.R': (30 * k, 0, 0),
                'thigh.L': (-10 * k, 0, 0), 'thigh.R': (16 * k, 0, 0), 'shin.R': (-30 * k, 0, 0), 'root': (0, -0.06 * k, 0.1 * k)}
    A['hurt'] = (0.5, hurt, False)
    A.update(norah_locomotion())
    A.update(norah_v10(hip_y))
    return A

def _smooth(k): k = max(0.0, min(1.0, k)); return k * k * (3 - 2 * k)
def pose_seq(t, keys, ease=_smooth):
    """Blend between keyed poses: keys = [(time, {bone: (x, y, z)}), ...]. Bones missing from a key count as (0, 0, 0)."""
    if t <= keys[0][0]: return dict(keys[0][1])
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            k = ease((t - t0) / (t1 - t0)) if t1 > t0 else 1.0
            out = {}
            for bn in set(a) | set(b):
                va = a.get(bn, (0, 0, 0)); vb = b.get(bn, (0, 0, 0))
                out[bn] = tuple(va[i] + (vb[i] - va[i]) * k for i in range(3))
            return out
    return dict(keys[-1][1])
def _add(d, extra):
    for bn, v in extra.items():
        o = d.get(bn, (0, 0, 0)); d[bn] = tuple(o[i] + v[i] for i in range(3))
    return d

def norah_v10(hip_y):
    """v10: stronger, keyframed actions (anticipation, contact, follow-through) for the fight, a proper sprint,
    and searching (standing rummage and a crouched one for low drawers)."""
    A = {}
    # --- combat-ready stance: feet staggered, knees soft, the revolver held low in both hands
    READY = {'thigh.L': (14, 0, -6), 'thigh.R': (-6, 0, 6), 'shin.L': (-16, 0, 0), 'shin.R': (-12, 0, 0), 'foot.L': (2, 0, 0), 'foot.R': (14, 0, 0),
             'spine': (-6, -8, 0), 'chest': (-2, -6, 0), 'head': (4, 12, 0),
             'upperarm.R': (30, 0, -10), 'forearm.R': (44, 0, 0), 'hand.R': (-10, 0, 0), 'upperarm.L': (28, 0, 16), 'forearm.L': (58, 0, 0), 'hand.L': (0, 0, 20),
             'root': (0, -0.035, 0)}
    AIM = {'thigh.L': (16, 0, -7), 'thigh.R': (-10, 0, 7), 'shin.L': (-18, 0, 0), 'shin.R': (-8, 0, 0), 'foot.L': (2, 0, 0), 'foot.R': (16, 0, 0),
           'spine': (-4, -6, 0), 'chest': (-3, -6, 0), 'neck': (2, 4, 0), 'head': (4, 10, 0),
           'upperarm.R': (86, 0, -10), 'forearm.R': (4, 0, 0), 'hand.R': (-4, 0, 0),
           'upperarm.L': (84, 0, 22), 'forearm.L': (14, 0, 0), 'hand.L': (-2, 0, 14), 'root': (0, -0.03, 0)}
    def aim(t):
        b = S(TAU * t / 2.5); w = S(TAU * t / 1.7)
        return _add(dict(AIM), {'chest': (b * 1.2, w * 0.8, 0), 'upperarm.R': (w * 0.8, 0, 0), 'upperarm.L': (w * 0.8, 0, 0), 'root': (0, b * 0.004, 0)})
    A['aim'] = (2.5, aim, True)
    def fire(t):       # a heavy revolver: the shot throws both arms up past the eyeline and rocks her back a half step;
        #                she wrestles it back down onto the target, then thumbs the hammer back for the next one
        k = math.exp(-t / 0.13) if t > 0.025 else t / 0.025
        d = _add(aim(0), {'upperarm.R': (52 * k, 0, 0), 'upperarm.L': (44 * k, 0, 0), 'hand.R': (-42 * k, 0, 0), 'hand.L': (-30 * k, 0, 0),
                          'forearm.R': (16 * k, 0, 0), 'forearm.L': (10 * k, 0, 0), 'chest': (16 * k, 6 * k, 0), 'spine': (9 * k, 3 * k, 0),
                          'head': (-14 * k, -4 * k, 3 * k), 'neck': (-4 * k, 0, 0),
                          'thigh.L': (-8 * k, 0, 0), 'thigh.R': (6 * k, 0, 0), 'shin.R': (-10 * k, 0, 0), 'root': (0, 0.01 * k, 0.09 * k)})
        if 0.62 < t < 0.92:      # cocking: the off hand's thumb rolls the hammer back
            c = S((t - 0.62) / 0.3 * math.pi)
            _add(d, {'upperarm.L': (4 * c, 0, 4 * c), 'forearm.L': (8 * c, 0, 0), 'hand.L': (14 * c, 0, -18 * c), 'hand.R': (0, 0, 6 * c)})
        return d
    A['fire'] = (1.0, fire, False)
    # --- shove: load (twist away, arms gathered), drive (step in, palms out, whole body behind it), follow-through, recover
    LOAD = {'thigh.L': (10, 0, -6), 'thigh.R': (-4, 0, 6), 'shin.L': (-26, 0, 0), 'shin.R': (-22, 0, 0), 'foot.L': (8, 0, 0), 'foot.R': (12, 0, 0),
            'spine': (4, 24, 0), 'chest': (4, 16, 0), 'head': (2, -26, 0),
            'upperarm.L': (22, 0, 14), 'forearm.L': (122, 0, 0), 'hand.L': (-30, 0, 0), 'upperarm.R': (18, 0, -10), 'forearm.R': (126, 0, 0), 'hand.R': (-30, 0, 0),
            'root': (0, -0.07, 0.06)}
    HIT = {'thigh.L': (46, 0, -4), 'thigh.R': (-26, 0, 6), 'shin.L': (-38, 0, 0), 'shin.R': (-4, 0, 0), 'foot.L': (-4, 0, 0), 'foot.R': (26, 0, 0),
           'spine': (-24, -16, 0), 'chest': (-12, -12, 0), 'head': (18, 18, 0),
           'upperarm.L': (88, 0, 10), 'forearm.L': (2, 0, 0), 'hand.L': (-64, 0, 0), 'upperarm.R': (86, 0, -8), 'forearm.R': (4, 0, 0), 'hand.R': (-64, 0, 0),
           'root': (0, -0.1, -0.24)}
    FOLLOW = _add(dict(HIT), {'spine': (6, 6, 0), 'upperarm.L': (-10, 0, 0), 'upperarm.R': (-10, 0, 0), 'forearm.L': (14, 0, 0), 'forearm.R': (14, 0, 0), 'root': (0, 0.02, 0.02)})
    def melee(t):
        return pose_seq(t, [(0.0, READY), (0.13, LOAD), (0.22, HIT), (0.34, FOLLOW), (0.6, READY)])
    A['melee'] = (0.6, melee, False)
    # --- dodge: drop and throw the weight sideways, the left arm up to cover the head; comes back up ready
    DUCK = {'thigh.L': (72, 0, -20), 'thigh.R': (26, 0, 26), 'shin.L': (-104, 0, 0), 'shin.R': (-62, 0, 0), 'foot.L': (30, 0, 0), 'foot.R': (24, 0, 0),
            'spine': (-28, 10, 18), 'chest': (-12, 8, 10), 'head': (16, -10, -8), 'hips': (0, 0, -8),
            'upperarm.L': (96, 0, -40), 'forearm.L': (118, 0, 0), 'hand.L': (0, 0, 20), 'upperarm.R': (48, 0, 30), 'forearm.R': (46, 0, 0),
            'root': (0, -0.34, 0.02)}
    def dodge(t):
        return pose_seq(t, [(0.0, READY), (0.09, _add(dict(DUCK), {'root': (0, 0.12, 0)})), (0.2, DUCK), (0.34, DUCK), (0.5, READY)])
    A['dodge'] = (0.5, dodge, False)
    # --- reload: gun up to the chest, cylinder swung out, the empties tipped, five rounds thumbed in, flicked shut, back to ready
    CHEST = {'thigh.L': (8, 0, -5), 'thigh.R': (-4, 0, 5), 'shin.L': (-10, 0, 0), 'shin.R': (-8, 0, 0),
             'spine': (-6, 0, 0), 'chest': (-8, 0, 0), 'neck': (-8, 0, 0), 'head': (-24, 0, 0),
             'upperarm.R': (36, 0, 14), 'forearm.R': (84, 0, 0), 'hand.R': (-8, 0, -40), 'upperarm.L': (40, 0, -18), 'forearm.L': (84, 0, 0), 'hand.L': (6, 0, 26),
             'root': (0, -0.015, 0)}
    TIP = _add(dict(CHEST), {'upperarm.R': (18, 0, 0), 'forearm.R': (-30, 0, 0), 'hand.R': (-50, 0, 30), 'head': (-8, 0, 0)})
    def reload(t):
        d = pose_seq(t, [(0.0, READY), (0.16, CHEST), (0.3, TIP), (0.42, CHEST), (1.0, CHEST), (1.08, _add(dict(CHEST), {'hand.R': (0, 0, 46), 'forearm.R': (-8, 0, 0)})), (1.4, READY)])
        if 0.44 < t < 1.0:     # thumbing rounds in, one per beat
            w = S(TAU * (t - 0.44) / 0.112)
            _add(d, {'upperarm.L': (4 * w, 0, 0), 'forearm.L': (10 * max(0.0, w), 0, 0), 'hand.L': (14 * w, 0, 0), 'head': (2 * w, 0, 0)})
        return d
    A['reload'] = (1.4, reload, False)
    def hurt(t):       # struck: the hit throws her back and twists her, a stumble step, then she rights herself
        HURT = {'spine': (18, 22, 0), 'chest': (14, 16, 0), 'head': (-22, 24, 8), 'upperarm.L': (36, 0, -56), 'upperarm.R': (54, 0, 44), 'forearm.L': (48, 0, 0), 'forearm.R': (40, 0, 0),
                'thigh.L': (-14, 0, -6), 'thigh.R': (24, 0, 6), 'shin.R': (-40, 0, 0), 'shin.L': (-8, 0, 0), 'root': (0, -0.08, 0.14)}
        return pose_seq(t, [(0.0, READY), (0.06, HURT), (0.22, _add(dict(HURT), {'thigh.L': (24, 0, 0), 'thigh.R': (-28, 0, 0), 'root': (0, -0.03, 0.04)})), (0.6, READY)])
    A['hurt'] = (0.6, hurt, False)
    # --- searching: bent into a drawer or a shelf, both hands rummaging, the head turning to look
    def search(t):
        p = TAU * t / 1.2; a = S(p); b = S(p + 2.1); look = S(TAU * t / 2.4) * 14
        return {'thigh.L': (18, 0, -6), 'thigh.R': (12, 0, 6), 'shin.L': (-24, 0, 0), 'shin.R': (-20, 0, 0), 'foot.L': (6, 0, 0), 'foot.R': (6, 0, 0),
                'spine': (-26, look * 0.2, 0), 'chest': (-14, look * 0.3, 0), 'neck': (-6, 0, 0), 'head': (-12, look, 0),
                'upperarm.L': (52 + 12 * a, 0, -12), 'forearm.L': (38 + 22 * max(0.0, -a), 0, 0), 'hand.L': (-10, 0, 18 * a),
                'upperarm.R': (52 + 12 * b, 0, 12), 'forearm.R': (38 + 22 * max(0.0, -b), 0, 0), 'hand.R': (-10, 0, -18 * b),
                'hips': (0, 2 * a, 0), 'root': (0, -0.06, 0.07)}
    A['search'] = (2.4, search, True)
    def search_low(t):  # down on one knee at a bottom drawer
        p = TAU * t / 1.0; a = S(p); b = S(p + 2.4); look = S(TAU * t / 2.0) * 12
        return {'thigh.L': (96, 0, -8), 'shin.L': (-100, 0, 0), 'foot.L': (4, 0, 0), 'thigh.R': (8, 0, 8), 'shin.R': (-100, 0, 0), 'foot.R': (58, 0, 0),
                'spine': (-24, look * 0.2, 0), 'chest': (-12, 0, 0), 'head': (-20, look, 0),
                'upperarm.L': (44 + 14 * a, 0, -10), 'forearm.L': (30 + 20 * max(0.0, -a), 0, 0), 'hand.L': (-6, 0, 16 * a),
                'upperarm.R': (44 + 14 * b, 0, 10), 'forearm.R': (30 + 20 * max(0.0, -b), 0, 0), 'hand.R': (-6, 0, -16 * b),
                'root': (0, -0.43, 0.04)}
    A['search_low'] = (2.0, search_low, True)
    # --- the sprint: a real forward lean, knees driven high, arms pumping hard at 90 degrees, a flight phase between steps
    RPER = 0.62
    RTHIGH = [(0, 48), (0.12, 30), (0.36, -12), (0.48, -26), (0.6, 4), (0.74, 52), (0.86, 66), (1, 48)]
    RSHIN = [(0, -22), (0.12, -34), (0.32, -16), (0.48, -40), (0.6, -100), (0.72, -122), (0.86, -60), (1, -22)]
    RFOOT = [(0, -8), (0.1, 10), (0.34, 22), (0.48, 34), (0.62, 18), (0.82, -4), (1, -8)]
    def run(t, light=False):
        uL = t / RPER; uR = uL + 0.5; c = Cc(TAU * uL)
        d = {}
        for side, u, o in (('L', uL, uR), ('R', uR, uL)):
            sx = -1 if side == 'L' else 1
            d['thigh.' + side] = (kf(u, RTHIGH), 0, sx * 2.5)
            d['shin.' + side] = (kf(u, RSHIN), 0, 0)
            d['foot.' + side] = (kf(u, RFOOT), 0, 0)
            sw = Cc(TAU * (o - 0.04))
            d['upperarm.' + side] = (10 + 50 * sw, 0, sx * (12 - 6 * max(0.0, sw)))
            d['forearm.' + side] = (88 + 14 * max(0.0, sw), 0, 0)
            d['hand.' + side] = (14, 0, 0)
        d['hips'] = (0, 10 * c, 3.5 * S(TAU * uL))
        d['spine'] = (-14, -4 * c, 0)
        d['chest'] = (-6, -11 * c, 0)
        d['neck'] = (4, 3 * c, 0)
        d['head'] = (12, 4 * c, 0)
        d['root'] = (0.01 * S(TAU * uL), -0.05 * Cc(2 * TAU * uL) - 0.035, 0)
        if light:
            d['upperarm.R'] = (54 + 8 * Cc(2 * TAU * uL), 0, 6); d['forearm.R'] = (40, 0, 0); d['hand.R'] = (-10, 0, 0)
        return d
    A['run'] = (RPER, run, True)
    A['run_light'] = (RPER, lambda t: run(t, True), True)
    A['ready'] = (2.0, lambda t: _add(dict(READY), {'chest': (S(TAU * t / 2.0) * 1.2, 0, 0)}), True)
    # --- dropping off a ledge: a short airborne pose (knees tucked, arms thrown out for balance, eyes on the floor),
    #     then a hard landing: she buckles into a deep crouch, a hand slaps the floor, a beat stunned, and pushes back up
    AIR = {'thigh.L': (34, 0, -8), 'thigh.R': (14, 0, 8), 'shin.L': (-52, 0, 0), 'shin.R': (-34, 0, 0), 'foot.L': (14, 0, 0), 'foot.R': (20, 0, 0),
           'spine': (-6, 0, 0), 'chest': (-4, 0, 0), 'neck': (6, 0, 0), 'head': (14, 0, 0),
           'upperarm.L': (24, 0, -58), 'upperarm.R': (30, 0, 54), 'forearm.L': (26, 0, 0), 'forearm.R': (22, 0, 0), 'hand.L': (0, 0, -20), 'hand.R': (0, 0, 20),
           'root': (0, 0.03, 0)}
    def airborne(t):
        w = S(TAU * t / 0.5)
        return _add(dict(AIR), {'upperarm.L': (0, 0, -6 * w), 'upperarm.R': (0, 0, 6 * w), 'thigh.L': (4 * w, 0, 0)})
    A['airborne'] = (0.5, airborne, True)
    IMPACT = {'thigh.L': (98, 0, -14), 'thigh.R': (84, 0, 16), 'shin.L': (-128, 0, 0), 'shin.R': (-118, 0, 0), 'foot.L': (32, 0, 0), 'foot.R': (36, 0, 0),
              'spine': (-34, 0, 6), 'chest': (-18, 0, 4), 'neck': (8, 0, 0), 'head': (16, -8, 6),
              'upperarm.L': (34, 0, -38), 'forearm.L': (30, 0, 0), 'upperarm.R': (74, 0, 6), 'forearm.R': (6, 0, 0), 'hand.R': (-60, 0, 0),
              'root': (0, -0.5, 0.06)}
    DAZED = _add(dict(IMPACT), {'head': (10, 14, -6), 'neck': (6, 0, 0), 'spine': (4, 0, -4), 'root': (0, 0.04, 0)})
    RISE = {'thigh.L': (38, 0, -8), 'thigh.R': (20, 0, 8), 'shin.L': (-46, 0, 0), 'shin.R': (-30, 0, 0), 'foot.L': (8, 0, 0), 'foot.R': (10, 0, 0),
            'spine': (-18, 0, 0), 'chest': (-8, 0, 0), 'head': (6, 0, 0), 'upperarm.L': (20, 0, -14), 'upperarm.R': (34, 0, 10), 'forearm.L': (30, 0, 0), 'forearm.R': (20, 0, 0),
            'root': (0, -0.16, 0.02)}
    def land_hard(t):
        d = pose_seq(t, [(0.0, AIR), (0.06, IMPACT), (0.14, _add(dict(IMPACT), {'root': (0, -0.04, 0)})), (0.3, DAZED), (0.58, DAZED), (0.8, RISE), (1.0, {})])
        if 0.3 < t < 0.6:          # a woozy shake of the head
            q = S((t - 0.3) / 0.3 * TAU * 1.5)
            _add(d, {'head': (0, 10 * q, 4 * q), 'chest': (0, 3 * q, 0)})
        return d
    A['land_hard'] = (1.0, land_hard, False)
    # --- ducking a blow: she drops into a crouch with her arms over her head, hunched, then scrambles up and on
    DUCK = {'thigh.L': (104, 0, -14), 'thigh.R': (92, 0, 16), 'shin.L': (-132, 0, 0), 'shin.R': (-124, 0, 0), 'foot.L': (30, 0, 0), 'foot.R': (34, 0, 0),
            'spine': (-34, 0, 0), 'chest': (-24, 0, 0), 'neck': (-8, 0, 0), 'head': (-24, 0, 0),
            'upperarm.L': (152, 0, 22), 'forearm.L': (112, 0, 0), 'hand.L': (0, 0, 0),
            'upperarm.R': (152, 0, -22), 'forearm.R': (112, 0, 0), 'hand.R': (0, 0, 0),
            'root': (0, -0.56, 0.08)}
    def duck(t):
        d = pose_seq(t, [(0.0, {}), (0.14, DUCK), (0.75, _add(dict(DUCK), {'root': (0, 0.02, 0)})), (1.05, RISE), (1.3, {})])
        if 0.2 < t < 0.75:          # flinching as it lands above her
            q = S((t - 0.2) / 0.55 * TAU * 3)
            _add(d, {'chest': (3 * q, 0, 0), 'head': (4 * q, 0, 0)})
        return d
    A['duck'] = (1.3, duck, False)
    TUCK = {'thigh.L': (128, 0, -8), 'thigh.R': (128, 0, 8), 'shin.L': (-146, 0, 0), 'shin.R': (-146, 0, 0), 'foot.L': (30, 0, 0), 'foot.R': (30, 0, 0),
            'spine': (-44, 0, 0), 'chest': (-30, 0, 0), 'neck': (-20, 0, 0), 'head': (-34, 0, 0),
            'upperarm.L': (110, 0, 14), 'forearm.L': (120, 0, 0), 'upperarm.R': (110, 0, -14), 'forearm.R': (120, 0, 0)}
    def roll(t):       # a forward shoulder roll (0.75 s): tucked tight, the body turning a full circle about the hips, up into a crouch
        u = min(1.0, t / 0.62)
        e = u * u * (3 - 2 * u)
        d = _add(dict(TUCK), {'hips': (-360 * e, 0, 0), 'root': (0, -0.5 - 0.12 * S(math.pi * e), 0)})
        if t > 0.62:
            k = (t - 0.62) / 0.13
            d = pose_seq(k, [(0.0, _add(dict(TUCK), {'root': (0, -0.5, 0)})), (1.0, RISE)])
        return d
    A['roll'] = (0.75, roll, False)
    def duck_roll(t):  # duck the swing (0.45 s), then the roll (0.75 s)
        if t < 0.45:
            return duck(t)
        return roll(t - 0.45)
    A['duck_roll'] = (1.2, duck_roll, False)
    return A

def kf(u, keys):
    """Cyclic Catmull-Rom through (u, value) keys on 0..1 (first and last u are 0 and 1 with the same value)."""
    u %= 1.0
    n = len(keys) - 1
    for i in range(n):
        u0, v1 = keys[i]; u1, v2 = keys[i + 1]
        if u0 <= u <= u1:
            v0 = keys[i - 1 if i > 0 else n - 1][1]; v3 = keys[i + 2 if i + 2 <= n else 1][1]
            k = (u - u0) / (u1 - u0) if u1 > u0 else 0.0
            k2, k3 = k * k, k * k * k
            return 0.5 * ((2 * v1) + (-v0 + v2) * k + (2 * v0 - 5 * v1 + 4 * v2 - v3) * k2 + (-v0 + 3 * v1 - 3 * v2 + v3) * k3)
    return keys[-1][1]

def norah_locomotion():
    """Norah's own walk, run and idle (keyframed gait with hip sway and a weight shift), and the set for carrying the flashlight."""
    A = {}
    THIGH = [(0, 22), (0.12, 17), (0.5, -12), (0.6, -11), (0.76, 8), (0.9, 24), (1, 22)]
    SHIN = [(0, -3), (0.1, -14), (0.3, -6), (0.5, -10), (0.62, -36), (0.72, -56), (0.86, -18), (1, -3)]
    FOOT = [(0, -12), (0.08, 2), (0.4, -4), (0.56, 10), (0.65, 24), (0.76, 4), (0.9, -8), (1, -12)]
    WPER = 1.05
    def walk(t, light=False):
        uL = t / WPER; uR = uL + 0.5; c = Cc(TAU * uL)
        d = {}
        for side, u, o in (('L', uL, uR), ('R', uR, uL)):
            sx = -1 if side == 'L' else 1
            d['thigh.' + side] = (kf(u, THIGH), 0, sx * 1.5)
            d['shin.' + side] = (kf(u, SHIN), 0, 0)
            d['foot.' + side] = (kf(u, FOOT), 0, 0)
            sw = Cc(TAU * (o - 0.06))
            d['upperarm.' + side] = (3 + 12 * sw, 0, sx * 6)
            d['forearm.' + side] = (12 + 9 * max(0.0, sw), 0, 0)
            d['hand.' + side] = (4, 0, 0)
        d['hips'] = (0, 6 * c, 3 * S(TAU * uL))
        d['spine'] = (-1.5, -2 * c, -1.2 * S(TAU * uL))
        d['chest'] = (-0.5, -4 * c, 0)
        d['neck'] = (0, 1.5 * c, 0)
        d['head'] = (1 + 0.8 * Cc(2 * TAU * uL), 1.2 * c, 0)
        d['root'] = (0.012 * S(TAU * uL), -0.02 * Cc(2 * TAU * uL) - 0.012, 0)
        if light:     # the flashlight held out at chest height in her right hand, the beam steady; tense shoulders
            d['upperarm.R'] = (58 + 2 * Cc(2 * TAU * uL), 0, 4); d['forearm.R'] = (30, 0, 0); d['hand.R'] = (-12, 0, 0)
            d['upperarm.L'] = (8 + 6 * Cc(TAU * (uR - 0.06)), 0, -10); d['forearm.L'] = (28, 0, 0)
            d['chest'] = (-3, -2 * c, 0); d['head'] = (2, 3 * S(TAU * t / 4.2), 0); d['hips'] = (0, 4 * c, 2.4 * S(TAU * uL))
        return d
    A['walk'] = (WPER, walk, True)
    A['walk_light'] = (WPER * 1.1, lambda t: walk(t / 1.1, True), True)
    RPER = 0.66
    RTHIGH = [(0, 42), (0.14, 26), (0.38, -16), (0.5, -24), (0.64, 8), (0.8, 56), (0.9, 52), (1, 42)]
    RSHIN = [(0, -16), (0.12, -30), (0.34, -18), (0.5, -32), (0.62, -88), (0.75, -112), (0.88, -50), (1, -16)]
    RFOOT = [(0, -6), (0.1, 8), (0.36, 18), (0.5, 30), (0.64, 16), (0.84, -6), (1, -6)]
    def run(t, light=False):
        uL = t / RPER; uR = uL + 0.5; c = Cc(TAU * uL)
        d = {}
        for side, u, o in (('L', uL, uR), ('R', uR, uL)):
            sx = -1 if side == 'L' else 1
            d['thigh.' + side] = (kf(u, RTHIGH), 0, sx * 2)
            d['shin.' + side] = (kf(u, RSHIN), 0, 0)
            d['foot.' + side] = (kf(u, RFOOT), 0, 0)
            sw = Cc(TAU * (o - 0.05))
            d['upperarm.' + side] = (8 + 36 * sw, 0, sx * 10)
            d['forearm.' + side] = (82 + 12 * sw, 0, 0)
            d['hand.' + side] = (10, 0, 0)
        d['hips'] = (0, 8 * c, 3 * S(TAU * uL))
        d['spine'] = (-9, -3 * c, 0)
        d['chest'] = (-3, -8 * c, 0)
        d['head'] = (6, 3 * c, 0)
        d['root'] = (0.01 * S(TAU * uL), -0.035 * Cc(2 * TAU * uL) - 0.03, 0)
        if light:
            d['upperarm.R'] = (52 + 8 * Cc(2 * TAU * uL), 0, 6); d['forearm.R'] = (40, 0, 0); d['hand.R'] = (-10, 0, 0)
        return d
    A['run'] = (RPER, run, True)
    A['run_light'] = (RPER, lambda t: run(t, True), True)
    IPER = 6.0
    def idle(t, light=False):
        b = S(TAU * t / 3.0); w = S(TAU * t / IPER)       # breathing, and the weight shifting foot to foot
        look = S(TAU * t / IPER + 1.1) * 7 + S(TAU * t / 2.0) * 1.2
        d = {'chest': (b * 1.4, 0, 0), 'spine': (0.5, 0, 0), 'neck': (b * -0.5, 0, 0), 'head': (-1 - b, look, 1.5 * w),
             'hips': (0, 2 * w, -3.2 * w), 'root': (0.014 * w, b * 0.003 - 0.004 * abs(w), 0),
             'thigh.L': (2 + 5 * max(0.0, w), 0, -1.5 + 2 * w), 'thigh.R': (2 + 5 * max(0.0, -w), 0, 1.5 + 2 * w),
             'shin.L': (-3 - 9 * max(0.0, w), 0, 0), 'shin.R': (-3 - 9 * max(0.0, -w), 0, 0),
             'foot.L': (1 + 4 * max(0.0, w), 0, 0), 'foot.R': (1 + 4 * max(0.0, -w), 0, 0),
             'upperarm.L': (1 + b * 0.8, 0, -5 + b * 0.6), 'upperarm.R': (1 + b * 0.8, 0, 5 - b * 0.6),
             'forearm.L': (9, 0, 0), 'forearm.R': (11, 0, 0), 'hand.L': (6, 0, 4), 'hand.R': (6, 0, -4)}
        if light:
            d['upperarm.R'] = (56 + b, 0, 4); d['forearm.R'] = (32, 0, 0); d['hand.R'] = (-12, 0, 0)
            d['upperarm.L'] = (14, 0, -10); d['forearm.L'] = (34, 0, 0)
            d['head'] = (-2, S(TAU * t / 3.0) * 16, 0); d['chest'] = (-2 + b * 1.2, S(TAU * t / 3.0) * 5, 0)
        return d
    A['idle'] = (IPER, idle, True)
    A['idle_light'] = (3.0, lambda t: idle(t, True), True)
    return A

def louis_anims():
    """Louis's own: the standing figure at the treeline (head too far over, arms too long, too still)."""
    A = {}
    def stand(t):
        j = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 30, 0, 0, 0, 0, 0, 0, 0, 0, -12, 0, 0][int(t * 6) % 24]   # rare snaps of the head
        b = S(TAU * t / 4.0)
        return {'spine': (5, 0, 3), 'chest': (4, 4, -3), 'neck': (14, 0, 6), 'head': (10 + j * 0.4, j * 0.3, 26 + j),
                'upperarm.L': (2 + b, 0, -3), 'upperarm.R': (-2 - b, 0, 4), 'forearm.L': (6, 0, 0), 'forearm.R': (2, 0, 0),
                'hand.L': (14, 0, 0), 'hand.R': (0, 0, 20), 'thigh.L': (0, 0, -3), 'thigh.R': (2, 0, 4), 'shin.R': (-4, 0, 0),
                'hips': (0, 0, 4), 'root': (0, b * 0.003, 0)}
    A['stand'] = (4.0, stand, True)
    return A

def louis_v9_anims():
    """Louis's ACROSS form: an old man's body bent the wrong way. Heavy, slow, upright-ish; walks on his knuckles."""
    A = {}
    def crouch(t):     # the treeline: down on hands and feet, head up, perfectly still but for a slow breath
        b = S(TAU * t / 3.0)
        return {'hips': (-62, 0, 4), 'spine': (-10 + b * 1.5, 0, -3), 'chest': (-8, 6, 0), 'neck': (52, 0, 0), 'head': (30, -10, 14),
                'upperarm.L': (70, 0, -14), 'upperarm.R': (64, 0, 18), 'forearm.L': (-12, 0, 0), 'forearm.R': (-20, 0, 0), 'hand.L': (-40, 0, 0), 'hand.R': (-35, 0, 10),
                'thigh.L': (118, 0, -14), 'thigh.R': (110, 0, 16), 'shin.L': (-138, 0, 0), 'shin.R': (-132, 0, 0), 'foot.L': (40, 0, 0), 'foot.R': (36, 0, 0),
                'root': (0, -0.52 + b * 0.004, 0)}
    A['crouch'] = (3.0, crouch, True)
    def stalk(t):      # knuckle-walk: torso pitched over, long arms planting alternately, a drag in the left leg
        per = 1.15; u = t / per; p = TAU * u
        sL, sR = S(p), S(p + math.pi)
        j = [0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, -16, 0, 0, 0][int(t * 9) % 16]
        return {'hips': (-48 + 3 * S(2 * p), 6 * S(p), 4 * S(p)), 'spine': (-14, -8 * S(p), 0), 'chest': (-10, 10 * S(p + 0.6), 0),
                'neck': (40, 0, 0), 'head': (24 + j * 0.4, j, j * 0.5),
                'upperarm.L': (62 + sL * 30, 0, -16), 'upperarm.R': (62 + sR * 30, 0, 16), 'forearm.L': (-10 - max(0.0, -sL) * 30, 0, 0), 'forearm.R': (-10 - max(0.0, -sR) * 30, 0, 0),
                'hand.L': (-55, 0, -10), 'hand.R': (-55, 0, 10),
                'thigh.L': (58 - sR * 16, 0, -8), 'thigh.R': (58 - sL * 26, 0, 8), 'shin.L': (-70 + max(0.0, sR) * 10, 0, 0), 'shin.R': (-74 + max(0.0, sL) * 40, 0, 0),
                'foot.L': (12, 0, 0), 'foot.R': (16 - max(0.0, sL) * 20, 0, 0),
                'root': (0, -0.36 + abs(S(p)) * 0.035, 0)}
    A['stalk'] = (1.15, stalk, True)
    A['crawl'] = (1.15, stalk, True)        # the shared name the director uses for "moving"
    def pant(t):       # recovering after a pounce: crouched, shoulders heaving
        d = stalk(0); b = S(TAU * t / 0.5)
        d['chest'] = (-10 + b * 6, 0, 0); d['head'] = (30 + b * 4, 0, 10); d['root'] = (0, -0.38 + b * 0.01, 0)
        return d
    A['pant'] = (1.0, pant, True)
    A['quad_idle'] = (1.0, pant, True)
    def windup(t):     # rears up, arms thrown wide, head back: the tell (0.7 s, holds at the end)
        k = min(1.0, t / 0.45); e = 1 - (1 - k) ** 2
        d = stalk(0)
        d['hips'] = (-48 + 40 * e, 0, 0); d['spine'] = (-14 + 22 * e, 0, 0); d['chest'] = (-10 + 18 * e, 0, 0); d['neck'] = (40 - 50 * e, 0, 0); d['head'] = (24 - 40 * e, 0, 0)
        d['upperarm.L'] = (62 + 60 * e, 0, -16 - 70 * e); d['upperarm.R'] = (62 + 60 * e, 0, 16 + 70 * e)
        d['forearm.L'] = (-10 - 40 * e, 0, 0); d['forearm.R'] = (-10 - 40 * e, 0, 0)
        d['thigh.L'] = (58 + 20 * e, 0, -10); d['thigh.R'] = (58 + 20 * e, 0, 10); d['shin.L'] = (-70 - 30 * e, 0, 0); d['shin.R'] = (-74 - 26 * e, 0, 0)
        d['root'] = (0, -0.36 - 0.06 * e, 0.04 * e)
        if t > 0.5: d['head'] = (-16 + 8 * S(TAU * t * 9), 6 * S(TAU * t * 7), 0)
        return d
    A['windup'] = (0.7, windup, False)
    def pounce(t):     # the leap: body flat out, arms forward
        k = min(1.0, t / 0.15)
        d = stalk(0)
        d['hips'] = (-80, 0, 0); d['spine'] = (-6, 0, 0); d['chest'] = (-6, 0, 0); d['neck'] = (60, 0, 0); d['head'] = (20, 0, 0)
        d['upperarm.L'] = (150 * k, 0, -20); d['upperarm.R'] = (150 * k, 0, 20); d['forearm.L'] = (-10, 0, 0); d['forearm.R'] = (-10, 0, 0)
        d['thigh.L'] = (20, 0, -12); d['thigh.R'] = (10, 0, 12); d['shin.L'] = (-20, 0, 0); d['shin.R'] = (-30, 0, 0)
        d['root'] = (0, -0.5 + 0.25 * S(min(1.0, t / 0.45) * math.pi), 0)
        return d
    A['pounce'] = (0.45, pounce, False)
    def hit(t):        # shot: the round lifts him off his knuckles and throws him back, twisted; he crashes down, shakes it off
        base = stalk(0)
        STRUCK = _add(dict(base), {'hips': (44, 18, 10), 'spine': (40, 22, 0), 'chest': (30, -26, 0), 'neck': (-50, 0, 0), 'head': (-50, 36, 20),
                                   'upperarm.L': (-50, 0, -80), 'upperarm.R': (60, 0, 90), 'forearm.L': (-50, 0, 0), 'forearm.R': (-40, 0, 0),
                                   'thigh.L': (-30, 0, 0), 'thigh.R': (-40, 0, 10), 'shin.L': (40, 0, 0), 'shin.R': (30, 0, 0), 'root': (0, 0.2, 0.25)})
        DOWN = _add(dict(base), {'hips': (-10, 8, 6), 'spine': (-6, 10, 0), 'chest': (-8, -8, 0), 'head': (16, -20, 14),
                                 'upperarm.L': (16, 0, -20), 'upperarm.R': (20, 0, 26), 'root': (0, -0.08, 0.1)})
        d = pose_seq(t, [(0.0, base), (0.05, STRUCK), (0.2, STRUCK), (0.42, DOWN), (0.62, DOWN), (0.95, base)])
        if 0.5 < t < 0.85:      # shaking the hit off
            _add(d, {'head': (0, 26 * S(TAU * t * 7), 10 * S(TAU * t * 5))})
        return d
    A['hit'] = (0.95, hit, False)
    def stagger(t):    # shoved: reels back two steps, arms flailing
        e = S(min(1.0, t / 0.9) * math.pi)
        d = stalk(t * 0.6)
        d['hips'] = (-30 + 10 * e, 0, 10 * e); d['spine'] = (8 * e, 0, 0); d['head'] = (-10 * e, 20 * e, 0)
        d['upperarm.L'] = (20 + 60 * e, 0, -60 * e); d['upperarm.R'] = (30 + 40 * e, 0, 70 * e)
        return d
    A['stagger'] = (0.9, stagger, False)
    def die(t):        # collapses forward, a last spasm, then still
        k = min(1.0, t / 0.6)
        d = {'hips': (-48 - 42 * k, 0, 10 * k), 'spine': (-14 + 10 * k, 0, 6 * k), 'chest': (-10 + 4 * k, 10 * k, 0), 'neck': (40 - 30 * k, 0, 0), 'head': (24 - 40 * k, 60 * k, 20 * k),
             'upperarm.L': (62 + 60 * k, 0, -16 - 40 * k), 'upperarm.R': (62 - 10 * k, 0, 16 + 70 * k), 'forearm.L': (-10 - 60 * k, 0, 0), 'forearm.R': (-10, 0, 0),
             'thigh.L': (58 - 40 * k, 0, -8), 'thigh.R': (58 - 50 * k, 0, 18 * k), 'shin.L': (-70 + 50 * k, 0, 0), 'shin.R': (-74 + 30 * k, 0, 0),
             'root': (0, -0.36 - 0.5 * k, 0.4 * k)}
        if 0.8 < t < 0.9: d['upperarm.R'] = (40, 0, 120); d['head'] = (-10, 80, 30)
        return d
    A['die'] = (1.4, die, False)
    def swipe(t):      # up close: half rears and rakes the blade arm across, then drops back to his knuckles
        base = stalk(0)
        RAISE = _add(dict(base), {'hips': (26, -14, 0), 'spine': (12, -24, 0), 'chest': (8, -20, 0), 'upperarm.R': (60, 0, 70), 'forearm.R': (-30, 0, 0), 'head': (-18, 10, 0)})
        RAKE = _add(dict(base), {'hips': (22, 16, 0), 'spine': (8, 30, 0), 'chest': (4, 26, 0), 'upperarm.R': (40, 0, -30), 'forearm.R': (10, 0, 0), 'hand.R': (-20, 0, 0), 'head': (-6, -14, 0)})
        return pose_seq(t, [(0.0, base), (0.2, RAISE), (0.3, RAKE), (0.42, RAKE), (0.7, base)])
    A['swipe'] = (0.7, swipe, False)
    def dead(t):
        return die(1.4)
    A['dead'] = (2.0, dead, True)
    A.update(brute_anims())
    return A

def brute_anims():
    """Louis as a BCROSS Brute (think Mr X): upright, heavy, deliberate. The swollen left arm hangs low and swings
    like a weight. He doesn't run; he walks at you, long even strides, head level, eyes on you."""
    A = {}
    BROOD = {'hips': (-4, 0, 0), 'spine': (-8, 0, 0), 'chest': (-10, 0, 2), 'neck': (-4, 0, 0), 'head': (-8, 0, 0),
             'upperarm.L': (4, 0, -10), 'forearm.L': (14, 0, 0), 'hand.L': (8, 0, 0),
             'upperarm.R': (2, 0, 6), 'forearm.R': (10, 0, 0), 'hand.R': (6, 0, 0),
             'thigh.L': (2, 0, -4), 'thigh.R': (0, 0, 4), 'shin.L': (-4, 0, 0), 'shin.R': (-2, 0, 0), 'root': (0, -0.01, 0)}
    def brood(t):      # standing in the open, shoulders rising and falling, the big arm hanging, utterly still otherwise
        b = S(TAU * t / 3.2)
        return _add(dict(BROOD), {'chest': (-b * 2.5, 0, 0), 'upperarm.L': (0, 0, -b * 2), 'upperarm.R': (0, 0, b * 1.5), 'head': (b * 1.5, 0, 0),
                                  'root': (0, b * 0.006, 0)})
    A['brood'] = (3.2, brood, True)
    SP = 1.0         # one full stride (two steps) per second
    def stride(t):     # the walk: long, even, purposeful; the big arm swinging heavy against the step
        u = t / SP; p = TAU * u
        sL, sR = S(p), S(p + math.pi)
        kneeL = max(0.0, S(p + 0.5)) * 46 + 6; kneeR = max(0.0, S(p + 0.5 + math.pi)) * 46 + 6
        return {'hips': (-6, 7 * S(p), 2 * S(p)), 'spine': (-8, -4 * S(p), 0), 'chest': (-8, -6 * S(p), 0), 'neck': (-2, 0, 0), 'head': (-4, 8 * S(p), 0),
                'thigh.L': (32 * sL + 4, 0, -3), 'thigh.R': (32 * sR + 4, 0, 3), 'shin.L': (-kneeL, 0, 0), 'shin.R': (-kneeR, 0, 0),
                'foot.L': (max(0.0, -sL) * 18 - 4, 0, 0), 'foot.R': (max(0.0, -sR) * 18 - 4, 0, 0),
                'upperarm.L': (-24 * sL + 4, 0, -12), 'forearm.L': (16 + max(0.0, -sL) * 12, 0, 0), 'hand.L': (10, 0, 0),
                'upperarm.R': (-18 * sR, 0, 7), 'forearm.R': (14 + max(0.0, -sR) * 16, 0, 0), 'hand.R': (6, 0, 0),
                'root': (0, -0.04 + 0.035 * abs(Cc(p)), 0)}
    A['stride'] = (SP, stride, True)
    WIND = _add(dict(BROOD), {'hips': (2, -24, 0), 'spine': (4, -26, 0), 'chest': (4, -22, 0), 'head': (4, 30, 0),
                              'upperarm.L': (-30, 0, -78), 'forearm.L': (70, 0, 0), 'hand.L': (0, 0, 0),
                              'thigh.L': (-10, 0, -6), 'thigh.R': (24, 0, 6), 'shin.R': (-26, 0, 0), 'root': (0, -0.05, 0)})
    STRIKE = _add(dict(BROOD), {'hips': (-10, 22, 0), 'spine': (-12, 26, 0), 'chest': (-8, 24, 0), 'head': (6, -30, 0),
                                'upperarm.L': (80, 0, 18), 'forearm.L': (6, 0, 0), 'hand.L': (0, 0, 0),
                                'upperarm.R': (-20, 0, 26), 'forearm.R': (30, 0, 0),
                                'thigh.L': (34, 0, -6), 'thigh.R': (-14, 0, 6), 'shin.L': (-20, 0, 0), 'shin.R': (-8, 0, 0), 'root': (0, -0.08, 0.1)})
    def brute_swing(t):    # the haymaker: arm hauled back, a step in, the whole body turned into it; holds in the wall, wrenches free
        d = pose_seq(t, [(0.0, stride(0)), (0.42, WIND), (0.5, WIND), (0.62, STRIKE), (1.0, STRIKE), (1.15, _add(dict(STRIKE), {'chest': (-4, 6, 0), 'upperarm.L': (-8, 0, 0)})),
                         (1.6, BROOD)])
        if 1.0 < t < 1.15:      # wrenching the fist back out of the siding
            _add(d, {'upperarm.L': (0, 0, -6 * S((t - 1.0) / 0.15 * TAU * 2)), 'chest': (0, 4 * S((t - 1.0) / 0.15 * TAU * 2), 0)})
        return d
    A['brute_swing'] = (1.6, brute_swing, False)
    def fist_stuck(t):     # his fist buried in the wall: he leaves it there, breathing; his head turns after her (LookAt in the game)
        b = S(TAU * t / 2.4)
        return _add(dict(STRIKE), {'chest': (b * 2.0, 0, 0), 'spine': (b * 1.0, 0, 0), 'upperarm.R': (b * 3, 0, 0), 'root': (0, b * 0.005, 0)})
    A['fist_stuck'] = (2.4, fist_stuck, True)
    def wrench(t):         # pulls it out of the siding: a shove off the wall, then the arm swings down to his side
        PULL = _add(dict(STRIKE), {'chest': (6, -10, 0), 'spine': (4, -8, 0), 'upperarm.L': (-14, 0, 0), 'forearm.L': (28, 0, 0), 'root': (0, -0.04, -0.06)})
        return pose_seq(t, [(0.0, STRIKE), (0.22, PULL), (0.36, PULL), (0.8, BROOD)])
    A['wrench'] = (0.8, wrench, False)
    def stride_hunch(t):   # indoors: the same walk, bent over and head ducked so he fits under the ceilings
        return _add(stride(t), {'hips': (-6, 0, 0), 'spine': (-16, 0, 0), 'chest': (-14, 0, 0), 'neck': (-10, 0, 0), 'head': (-4, 0, 0),
                                'thigh.L': (8, 0, 0), 'thigh.R': (8, 0, 0), 'shin.L': (-10, 0, 0), 'shin.R': (-10, 0, 0), 'root': (0, -0.07, 0)})
    A['stride_hunch'] = (SP, stride_hunch, True)
    def shoulder_charge(t):   # through the window: head down, the swollen shoulder leading, legs driving
        p = TAU * t / 0.55
        d = stride(t * 1.8)
        _add(d, {'hips': (-14, 26, 0), 'spine': (-16, 10, 0), 'chest': (-10, 8, 0), 'neck': (-10, -20, 0), 'head': (-14, -10, 0)})
        d['upperarm.L'] = (16, 0, -6); d['forearm.L'] = (70, 0, 0); d['upperarm.R'] = (-30 + 20 * S(p), 0, 10)
        return d
    A['shoulder_charge'] = (0.55, shoulder_charge, True)
    SPRAWL = {'hips': (-82, 6, 12), 'spine': (-6, 8, 0), 'chest': (-4, -6, 0), 'neck': (16, 0, 0), 'head': (18, 26, 0),
              'upperarm.L': (110, 0, -54), 'forearm.L': (20, 0, 0), 'upperarm.R': (96, 0, 62), 'forearm.R': (30, 0, 0),
              'thigh.L': (64, 0, -10), 'thigh.R': (52, 0, 14), 'shin.L': (-36, 0, 0), 'shin.R': (-52, 0, 0), 'root': (0, -0.78, 0.35)}
    PUSHUP = {'hips': (-64, 0, 4), 'spine': (-20, 0, 0), 'chest': (-12, 0, 0), 'neck': (24, 0, 0), 'head': (20, 0, 0),
              'upperarm.L': (78, 0, -18), 'forearm.L': (-10, 0, 0), 'upperarm.R': (74, 0, 20), 'forearm.R': (-10, 0, 0),
              'thigh.L': (96, 0, -8), 'thigh.R': (88, 0, 8), 'shin.L': (-118, 0, 0), 'shin.R': (-112, 0, 0), 'root': (0, -0.6, 0.18)}
    def bed_crash(t):         # lands face down across the bed; lies there; pushes himself up and stands, hunched under the ceiling
        d = pose_seq(t, [(0.0, shoulder_charge(0)), (0.18, SPRAWL), (0.3, _add(dict(SPRAWL), {'root': (0, 0.04, 0)})), (1.6, SPRAWL),
                         (2.15, PUSHUP), (2.5, PUSHUP), (3.0, stride_hunch(0))])
        if 0.3 < t < 1.6:     # a twitch as he lies there
            k = S((t - 0.3) / 1.3 * TAU * 2)
            _add(d, {'upperarm.L': (0, 0, -6 * k), 'head': (0, 6 * k, 0)})
        return d
    A['bed_crash'] = (3.0, bed_crash, False)
    def bash(t):       # in the chase, up close: a short clubbing backhand with the big arm
        return pose_seq(t, [(0.0, stride(0)), (0.18, WIND), (0.32, STRIKE), (0.45, STRIKE), (0.8, stride(0))])
    A['bash'] = (0.8, bash, False)
    return A

def across_anims():
    A = {}
    # The ACROSS: a demon operating a body it doesn't understand. Poses are deliberately wrong.
    def quad(t, jit=0):
        return {'hips': (-70, 0, 0), 'spine': (-8, 0, 0), 'chest': (-6, 0, 0), 'neck': (40, 0, 0), 'head': (38 + jit, jit * 0.5, jit * 0.4),
                'upperarm.L': (78, 0, -10), 'upperarm.R': (78, 0, 10), 'forearm.L': (-10, 0, 0), 'forearm.R': (-10, 0, 0), 'hand.L': (-50, 0, 0), 'hand.R': (-50, 0, 0),
                'thigh.L': (115, 0, -18), 'thigh.R': (115, 0, 18), 'shin.L': (-135, 0, 0), 'shin.R': (-135, 0, 0), 'foot.L': (60, 0, 0), 'foot.R': (60, 0, 0),
                'root': (0, -0.55, 0)}
    def folded(t):   # landed: limbs folded under, spine high, face to the floor
        return {'hips': (-92, 0, 6), 'spine': (12, 0, -5), 'chest': (6, 8, 0), 'neck': (-25, 0, 0), 'head': (-35, 25, 12),
                'upperarm.L': (40, 0, 10), 'upperarm.R': (70, 0, -45), 'forearm.L': (140, 0, 0), 'forearm.R': (60, 0, 0), 'hand.L': (0, 0, 0), 'hand.R': (-30, 0, 0),
                'thigh.L': (150, 0, -12), 'thigh.R': (138, 0, 28), 'shin.L': (-158, 0, 0), 'shin.R': (-150, 0, 0), 'foot.L': (50, 0, 0), 'foot.R': (45, 0, 0),
                'root': (0, -0.56, 0.1)}
    A['folded'] = (2.0, folded, True)
    def land(t):   # impact settle with a couple of spasms, ends exactly on 'folded'
        f = folded(0); k = min(1, t / 0.25)
        d = {b: tuple(v * (0.6 + 0.4 * k) for v in r) for b, r in f.items() if b != 'root'}
        d['root'] = (0, -0.56 + (1 - k) * 0.5, 0.1 - (1 - k) * 0.6)
        if 0.35 < t < 0.42: d['head'] = (0, 60, 35); d['upperarm.R'] = (100, 0, -70)
        if 0.6 < t < 0.65: d['thigh.R'] = (120, 0, 40); d['hand.L'] = (0, 0, 60)
        return d
    A['land'] = (0.9, land, False)
    def awaken(t):   # 0.18 s snap from folded to all fours. No wind-up.
        k = min(1, t / 0.12); f, q = folded(0), quad(0, 0)
        d = {}
        for b in set(f) | set(q):
            a = f.get(b, (0, 0, 0)); c = q.get(b, (0, 0, 0)); d[b] = tuple(a[i] + (c[i] - a[i]) * k for i in range(3))
        if t >= 0.12: d['head'] = (38, -25, 10)
        return d
    A['awaken'] = (0.18, awaken, False)
    def quad_idle(t):
        j = [0, 0, 18, 0, 0, -22, 0, 0, 0, 30, 0, 0][int(t * 12) % 12]   # abrupt head jerks
        d = quad(t, j); d['root'] = (0, -0.55 + S(TAU * t * 2.3) * 0.01, 0)
        return d
    A['quad_idle'] = (1.0, quad_idle, True)
    def crawl(t):   # spider-splayed four-beat scramble: limbs wide, spine snaking, the head low and dead level
        per = 0.46; u = t / per
        d = quad(t)
        for side, off in (('L', 0.0), ('R', 0.5)):
            sx = -1 if side == 'L' else 1
            a = TAU * (u + off); s_ = S(a); a2 = TAU * (u + off + 0.25); s2 = S(a2)
            d['upperarm.' + side] = (76 + s_ * 40, sx * -8 * s_, sx * (24 + 10 * max(0.0, S(a + 1.0))))
            d['forearm.' + side] = (-14 - max(0.0, -s_) * 58, 0, 0)
            d['hand.' + side] = (-55 + max(0.0, s_) * 35, 0, sx * 10)
            d['thigh.' + side] = (112 - s2 * 34, 0, sx * (30 + 6 * S(a2)))
            d['shin.' + side] = (-132 + max(0.0, s2) * 56, 0, 0)
            d['foot.' + side] = (55 - max(0.0, s2) * 25, 0, 0)
        j = [0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, -10, 0][int(t * 16) % 16]
        d['hips'] = (-72 + 5 * S(2 * TAU * u), 9 * S(TAU * u), 5 * S(TAU * u))
        d['spine'] = (-8, -9 * S(TAU * u + 0.8), 0); d['chest'] = (-4, 11 * S(TAU * u + 1.6), 0)
        d['neck'] = (44, -8 * S(TAU * u + 1.6), 0); d['head'] = (36 + j * 0.5, -4 * S(TAU * u) + j, j * 0.6)
        d['root'] = (0.03 * S(TAU * u), -0.56 + abs(S(2 * TAU * u)) * 0.05, 0)
        return d
    A['crawl'] = (0.46, crawl, True)
    def lunge(t):
        k = min(1, t / 0.2); e = 1 - (1 - k) ** 3
        d = quad(t)
        d['hips'] = (-70 + 35 * e, 0, 0); d['thigh.L'] = (115 - 95 * e, 0, -18); d['thigh.R'] = (115 - 95 * e, 0, 18)
        d['shin.L'] = (-135 + 120 * e, 0, 0); d['shin.R'] = (-135 + 120 * e, 0, 0)
        d['upperarm.L'] = (78 + 90 * e, 0, -25); d['upperarm.R'] = (78 + 90 * e, 0, 25); d['forearm.L'] = (-10, 0, 0); d['forearm.R'] = (-10, 0, 0)
        d['head'] = (30, 0, 0); d['root'] = (0, -0.55 + 0.45 * S(min(1, t / 0.5) * math.pi), 0)
        return d
    A['lunge'] = (0.5, lunge, False)
    def attack(t):   # crouched on a victim, frantic strikes downward (kept off-screen-ish in staging)
        p = TAU * t / 0.3; s = S(p)
        d = quad(t)
        d['root'] = (0, -0.75, 0); d['hips'] = (-60, 0, 0); d['chest'] = (-25 - s * 15, 0, 0); d['neck'] = (10 - s * 25, 0, 0); d['head'] = (10 - s * 20, 0, s * 8)
        d['upperarm.L'] = (100 + s * 40, 0, -20); d['upperarm.R'] = (100 - s * 40, 0, 20); d['forearm.L'] = (-40, 0, 0); d['forearm.R'] = (-40, 0, 0)
        return d
    A['attack'] = (0.3, attack, True)
    def swipe(t):   # half-upright backhand swing of a bony arm
        k = min(1, t / 0.18); e = k if t < 0.18 else max(0, 1 - (t - 0.18) / 0.3)
        return {'hips': (-35, 0, 0), 'spine': (-10, -20 + 60 * e, 0), 'chest': (-10, -20 + 50 * e, 0), 'head': (20, 0, 0),
                'upperarm.R': (40 + 50 * e, 0, 80 - 60 * e), 'forearm.R': (-10, 0, 0), 'upperarm.L': (40, 0, -20), 'forearm.L': (-30, 0, 0),
                'thigh.L': (70, 0, -15), 'thigh.R': (50, 0, 15), 'shin.L': (-90, 0, 0), 'shin.R': (-70, 0, 0), 'foot.L': (30, 0, 0), 'foot.R': (25, 0, 0),
                'root': (0, -0.35, 0)}
    A['swipe'] = (0.55, swipe, False)
    def shamble(t):   # upright, twitchy: the gait outside in the lot
        per = 1.3; p = TAU * t / per; s = S(p)
        j = [0, 0, 0, 25, 0, 0, 0, -15, 0][int(t * 9) % 9]
        return {'thigh.L': (s * 20, 0, -4), 'thigh.R': (-s * 22, 0, 6), 'shin.L': (-max(0, -s) * 35 - 6, 0, 0), 'shin.R': (-max(0, s) * 35 - 6, 0, 0),
                'spine': (-18, 0, 6), 'chest': (-14, s * 8, -5), 'neck': (25, 0, 0), 'head': (5 + j, j * 0.6, 20),
                'upperarm.L': (8 + s * 6, 0, -6), 'upperarm.R': (-4, 0, 14 + j * 0.3), 'forearm.L': (12, 0, 0), 'forearm.R': (4, 0, 0), 'hand.R': (0, 0, 30),
                'hips': (0, s * 6, s * 4), 'root': (0, abs(Cc(p)) * 0.03 - 0.05, 0)}
    A['shamble'] = (1.3, shamble, True)
    def still(t): return folded(0)
    A['still'] = (2.0, still, True)
    return A

# ======================================================================= glTF writer
def write_glb(path, mesh, J, at, anims, name):
    buf = bytearray(); views = []; accs = []
    def view(data, target=None):
        while len(buf) % 4: buf.append(0)
        off = len(buf); buf.extend(data)
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    def acc(arr, ctype, typ, target=None, minmax=False, normalized=False):
        arr = np.ascontiguousarray(arr)
        vi = view(arr.tobytes(), target)
        a = {'bufferView': vi, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
        if normalized: a['normalized'] = True
        if minmax:
            mn = arr.min(axis=0); mx = arr.max(axis=0)
            a['min'] = [float(x) for x in np.atleast_1d(mn)]; a['max'] = [float(x) for x in np.atleast_1d(mx)]
        accs.append(a); return len(accs) - 1
    bi = {b: i for i, b in enumerate(BONES)}
    world = {b: np.array(J[b], float) for b in BONES}
    nodes = []
    for b in BONES:
        p = PARENT[b]; loc = world[b] - (world[p] if p else 0)
        nodes.append({'name': b, 'translation': [float(x) for x in loc]})
    for b in BONES:
        ch = [bi[c] for c in BONES if PARENT[c] == b]
        if ch: nodes[bi[b]]['children'] = ch
    prims = []
    for mat, verts in mesh.prims.items():
        if not verts: continue
        pos = np.array([v[0] for v in verts], np.float32); nrm = np.array([v[1] for v in verts], np.float32)
        uv = np.array([v[2] for v in verts], np.float32); jn = np.array([[v[3], 0, 0, 0] for v in verts], np.uint8)
        wt = np.array([[1, 0, 0, 0]] * len(verts), np.float32)
        idx = np.arange(len(verts), dtype=np.uint16)
        prims.append({'attributes': {'POSITION': acc(pos, 5126, 'VEC3', 34962, True), 'NORMAL': acc(nrm, 5126, 'VEC3', 34962),
                                     'TEXCOORD_0': acc(uv, 5126, 'VEC2', 34962), 'JOINTS_0': acc(jn, 5121, 'VEC4', 34962),
                                     'WEIGHTS_0': acc(wt, 5126, 'VEC4', 34962)},
                      'indices': acc(idx, 5123, 'SCALAR', 34963), 'material': mat})
    ibm = []
    for b in BONES:
        m = np.eye(4, dtype=np.float32); m[:3, 3] = -world[b]; ibm.append(m.T.flatten())   # column-major
    ibm_acc = acc(np.array(ibm, np.float32), 5126, 'MAT4')
    mesh_node = len(nodes); nodes.append({'name': name + '_mesh', 'mesh': 0, 'skin': 0})
    root_node = len(nodes); nodes.append({'name': name, 'children': [bi['hips'], mesh_node]})
    gl = {'asset': {'version': '2.0', 'generator': 'extrecated build_characters.py'}, 'scene': 0, 'scenes': [{'nodes': [root_node]}],
          'nodes': nodes, 'meshes': [{'name': name, 'primitives': prims}],
          'skins': [{'joints': list(range(len(BONES))), 'inverseBindMatrices': ibm_acc, 'skeleton': bi['hips']}],
          'images': [{'uri': name + '.png', 'name': name}],   # the atlas sits next to the .glb
          'samplers': [{'magFilter': 9728, 'minFilter': 9728, 'wrapS': 33071, 'wrapT': 33071}],
          'textures': [{'sampler': 0, 'source': 0}],
          'materials': [{'name': name + '_body', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0.0, 'roughnessFactor': 1.0}},
                        {'name': name + '_glow', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0.0}, 'emissiveFactor': [1, 1, 1]},
                        {'name': name + '_flesh', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0.0, 'roughnessFactor': 1.0}}],
          'animations': []}
    FPS = 30
    for an, (dur, fn, loop) in anims.items():
        n = max(2, int(round(dur * FPS)) + 1)
        times = np.linspace(0, dur, n).astype(np.float32)
        samples = [fn(float(t) if not loop or t < dur else 0.0) for t in times]   # loops end on their first frame
        t_acc = acc(times.reshape(-1, 1), 5126, 'SCALAR', None, True)
        samplers = []; channels = []
        for b in BONES:
            q = np.array([euler(*s.get(b, (0, 0, 0)))[1:] + euler(*s.get(b, (0, 0, 0)))[:1] for s in samples], np.float32)  # xyzw
            for i in range(1, len(q)):
                if np.dot(q[i], q[i - 1]) < 0: q[i] = -q[i]
            samplers.append({'input': t_acc, 'output': acc(q, 5126, 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi[b], 'path': 'rotation'}})
        for b in BONES:
            if any(('s:' + b) in sm for sm in samples):
                sc = np.array([sm.get('s:' + b, (1, 1, 1)) for sm in samples], np.float32)
                samplers.append({'input': t_acc, 'output': acc(sc, 5126, 'VEC3'), 'interpolation': 'LINEAR'})
                channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi[b], 'path': 'scale'}})
        rest = world['hips']
        tr = np.array([rest + np.array(s.get('root', (0, 0, 0))) for s in samples], np.float32)
        samplers.append({'input': t_acc, 'output': acc(tr, 5126, 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi['hips'], 'path': 'translation'}})
        gl['animations'].append({'name': an, 'samplers': samplers, 'channels': channels})
    while len(buf) % 4: buf.append(0)
    gl['buffers'] = [{'byteLength': len(buf)}]; gl['bufferViews'] = views; gl['accessors'] = accs
    js = json.dumps(gl, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(buf), 0x004E4942) + bytes(buf)
    open(path, 'wb').write(out)

# ======================================================================= cast
CAST = [
    dict(id='kenneth', height=1.86, head_h=0.248, face=dict(chin=0.4, jaw=0.74, cheek=0.92, chin_fwd=0.06, p=2.5), nose=dict(len=0.022, w=0.024), hairdo=dict(quiff=0.014), shoulder_w=0.4, hip_w=0.19, waist=0.21, thick=0.86, puff=1.12, hair='short', top='puffer', jaw=0.78, head_w=0.155, head_d=0.19, tags=['jeans'],
         extras=['stubble'], pal=dict(skin='#e2b9a0', hair='#5a3a22', top='#2b2e38', bottom='#3a5578', belt='#6b4528', shoes='#2a2420', eyes='#4a8fd8', lips='#c08878')),
    dict(id='adaline', kid=True, height=1.12, hair='long', bangs=True, bang_y=0.62, hair_len=0.2, top='dress', bottom_kind='dress', sleeve='short', legs='skin', skirt_len=0.27, flare=1.9,
         extras=['blush', 'socks'], pal=dict(sash='#f6f1e4', skin='#f0cdb8', hair='#7a4e2c', top='#f2c230', bottom='#f2c230', shoes='#c8302c', eyes='#4a8fd8', lips='#d88080')),
    dict(id='stranger', height=1.66, shoulder_w=0.41, thick=1.18, belly=0.15, scarf='#3f8a4c', hair='bald', top='stripes', head_w=0.165, head_d=0.195, jaw=0.95,
         face=dict(chin=0.62, jaw=0.98, cheek=1.05, cheek_y=0.33, crown=0.9, top=0.58, p=2.2, dchin=1.0), nose=dict(len=0.019, w=0.036),
         extras=['cross_shoulder_right'], pal=dict(skin='#e6bea4', hair='#6a5646', top='#ece6d4', top2='#3f8a4c', bottom='#c7b083', belt='#6b4528', shoes='#4a3222', eyes='#5a4030')),
    dict(id='rachel', height=1.68, shoulder_w=0.34, hip_w=0.22, waist=0.24, thick=0.9, hair='ponytail', top='plain', coat=dict(len=0.3, color='#e48ab0', collar='none', open=40, knit=True, flare=1.1, pockets=False), tags=['jeans'], bust=0.015, face=dict(chin=0.38, jaw=0.74),
         pal=dict(tie='#b8943c', skin='#f0cbb4', hair='#e8c25c', top='#f2ece2', top2='#f6f0ea', bottom='#47658c', shoes='#e8e2da', eyes='#4c9c6a', lips='#d07a80')),
    dict(id='marcus', height=1.81, shoulder_w=0.45, hip_w=0.21, thick=1.1, hair='buzz', top='plaid', vest='#6a4a2a', extras=['stubble'], head_w=0.162,
         face=dict(p=3.2, jaw=0.92, chin=0.58, cheek=1.0), nose=dict(w=0.032),
         pal=dict(skin='#7a5038', hair='#1a1410', top='#a8302c', bottom='#bfa77c', belt='#3a2a1e', shoes='#3a2a20', eyes='#2a1a10', lips='#5a3428')),
    dict(id='norah', height=1.68, head_h=0.222, shoulder_w=0.35, hip_w=0.225, waist=0.235, thick=0.9, leg_w=0.097, leg_x=0.084, foot_len=0.232, bust=0.019, hair='long', hair_len=0.15, top='buttonup', sleeve='long', tags=['jeans'],
         coat=dict(len=0.2, color='#5e5a3e', collar='up', open=26, flare=1.12),
         extras=['soft_brows', 'full_lips', 'front_locks', 'side_part', 'boots'], face=dict(chin=0.52, jaw=0.86, cheek=1.07, cheek_y=0.38, temple=0.98, crown=0.86, p=2.3), nose=dict(len=0.011, w=0.021, bot=0.38),
         pal=dict(skin='#e9c2a6', hair='#3b2418', top='#e6e1d5', bottom='#2a2a31', belt='#4a3022', shoes='#5a3a24', eyes='#7d7040', lips='#c27a76')),
    dict(id='denise', height=1.64, shoulder_w=0.32, hip_w=0.2, waist=0.22, thick=0.84, coat=dict(len=0.5, color='#b89a6a', collar='lapel', open=22, flare=1.3, belt=True), hair='bob', bangs=True, bang_y=0.64, bust=0.015, face=dict(chin=0.4, jaw=0.76), top='plain', bottom_kind='skirt', legs='skin', skirt_len=0.46, flare=1.3,
         pal=dict(skin='#f2d0bc', hair='#c4502a', top='#2a8c8c', bottom='#1e1e22', shoes='#1a1a1a', eyes='#5a4030', lips='#c06a6a')),
    dict(id='dad2', height=1.78, thick=1.04, shoulder_w=0.42, hair='short', top='hoodie', hat='#8a2a24', tags=['jeans'], puff=1.05, face=dict(chin=0.46),
         pal=dict(skin='#e0b49a', hair='#4a3a2a', top='#8a8c90', bottom='#3c4f6c', shoes='#ececec', eyes='#5a4030')),
    dict(id='mom2', height=1.66, shoulder_w=0.35, hip_w=0.24, waist=0.27, thick=0.98, belly=0.03, scarf='#a8382c', coat=dict(len=0.34, color='#3a3e4a', collar='lapel', open=30, flare=1.2), hair='long', hair_len=0.27, bust=0.015, face=dict(chin=0.38, jaw=0.75), top='plain', tags=['jeans'],
         pal=dict(skin='#d9a888', hair='#2a1c14', top='#5e7a3a', bottom='#2c3a52', shoes='#5a3a2a', eyes='#3a2a1a', lips='#b06a5a')),
    dict(id='dad3', height=1.72, thick=1.14, belly=0.1, shoulder_w=0.42, vest='#2a3a2a', hair='short', top='polo', sleeve='short', extras=['glasses', 'beard'], face=dict(jaw=0.88, chin=0.5),
         pal=dict(belt='#3a2a1e', skin='#e8c0a4', hair='#7a5a3a', top='#26345a', bottom='#9a8a70', shoes='#3a3028', eyes='#4a6aa0')),
    dict(id='amelia', kid=True, height=1.1, hair='curly', top='dress', bottom_kind='dress', sleeve='short', legs='skin', skirt_len=0.26, flare=1.8, extras=['party_hat', 'socks', 'blush'],
         pal=dict(sash='#d4b2ee', skin='#b88462', hair='#2a1a14', top='#8a4cc0', bottom='#8a4cc0', shoes='#f0f0f0', eyes='#2a1a10', lips='#a05a50')),
    dict(id='kid_boy', kid=True, height=1.08, hair='short', top='dino', sleeve='short', legs='shorts', extras=['tuft'], hat='#2a5a9a',
         pal=dict(skin='#f0c8ae', hair='#9a6a3a', top='#3a9a4a', bottom='#c03030', shoes='#e8e8f0', eyes='#4a6aa0')),
    dict(id='kid_girl', kid=True, height=1.05, hair='pigtails', bangs=True, bang_y=0.63, top='overalls', sleeve='short', legs='pants',
         pal=dict(skin='#f4d4c0', hair='#c89a50', top='#e88aa8', top2='#3a6ab0', bottom='#3a6ab0', shoes='#d04040', eyes='#4a6aa0')),
    # Louis is a BCROSS Brute: unlike an ACROSS the demon kept some of the old man's muscle and fat, his skin is less
    # pallid, and he has swollen his LEFT arm (muscle and skin only, the bone is the same length) for raw strength.
    dict(id='louis', height=1.9, hip_y=1.0, shoulder_w=0.47, hip_w=0.22, waist=0.25, thick=1.0, depth=0.23, belly=0.035, arm=0.86, hand_scale=1.45, head_w=0.158, head_d=0.19, head_h=0.25,
         arm_scale={'L': 3.0},       # three times as thick as his other arm
         face=dict(chin=0.46, jaw=0.9, cheek=0.74, cheek_y=0.32, temple=0.95, crown=0.86, chin_fwd=0.09, p=2.4, dchin=0.4), nose=dict(len=0.02, w=0.03),
         hair='patchy', top='cardigan', sleeve='rolled', legs='torn', spikes=True, extras=['white_eyes', 'glasses', 'tatters', 'burns', 'cross_blade_right', 'dirt'],
         coat=dict(len=0.22, color='#4e5f72', collar='none', open=36, knit=True, flare=1.25, jag=0.05, pockets=False),
         pal=dict(skin='#a99280', hair='#ecebe4', top='#4e5f72', top2='#b8ae94', bottom='#5e4c3a', shoes='#8a8478', eyes='#ffffff', lips='#3a2422')),
    dict(id='across', height=1.78, shoulder_w=0.33, hip_w=0.16, waist=0.13, thick=0.62, depth=0.15, arm=0.74, hand_scale=1.35, head_w=0.15, head_d=0.18, jaw=0.7, head_h=0.25,
         face=dict(chin=0.36, jaw=0.84, cheek=0.74, cheek_y=0.34, temple=0.95, crown=0.8, chin_fwd=0.08, p=2.6), nose=dict(len=0.01, w=0.02),
         hair='patchy', top='ribs', sleeve='none', legs='torn', spikes=True, extras=['white_eyes', 'gaunt', 'brand_hip'],
         pal=dict(skin='#dcd8cc', hair='#3a3028', top='#dcd8cc', bottom='#55524c', shoes='#bdb8aa', eyes='#ffffff', lips='#6a5a58')),
]

if __name__ == '__main__':
    import sys
    _mp = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(_mp)) if os.path.exists(_mp) else {}
    # the main cast is built on real human bodies by tools/build_humans.py now; this file still builds the
    # photo cast (and can rebuild the old box-segment people with --legacy)
    LEGACY = '--legacy' in sys.argv
    for sp in (CAST if LEGACY else []):
        mesh, J, at = build(sp)
        anims = across_anims() if sp['id'] in ('across', 'louis') else human_anims(kid=sp.get('kid', False))
        if sp['id'] == 'louis':
            anims.update(louis_anims()); anims.update(louis_v9_anims())
        if sp['id'] == 'norah':
            hy_ = joints_for(sp)[1]['hip_y']; anims.update(seat_anims(hy_)); anims.update(norah_anims(hy_))
        if sp['id'] in ('kenneth', 'adaline', 'stranger'):
            anims.update(seat_anims(joints_for(sp)[1]['hip_y'], sp.get('kid', False), sp['id'] == 'stranger'))
        at.img.save(os.path.join(OUT, sp['id'] + '.png'))
        write_glb(os.path.join(OUT, sp['id'] + '.glb'), mesh, J, at, anims, sp['id'])
        tris = sum(len(v) for v in mesh.prims.values()) // 3
        manifest[sp['id']] = {'height': sp['height'], 'tris': tris, 'animations': list(anims.keys())}
        print('%-9s %4d tris  %d anims' % (sp['id'], tris, len(anims)))
    nw_ = dict(next(c for c in CAST if c['id'] == 'norah')); nw_.update(id='norah_worn', sleeve='rolled', extras=nw_.get('extras', []) + ['dirt'])
    if LEGACY:
        mesh, J, at = build(nw_); anims = human_anims(); hy_ = joints_for(nw_)[1]['hip_y']; anims.update(seat_anims(hy_)); anims.update(norah_anims(hy_))
        at.img.save(os.path.join(OUT, 'norah_worn.png')); write_glb(os.path.join(OUT, 'norah_worn.glb'), mesh, J, at, anims, 'norah_worn')
        manifest['norah_worn'] = {'height': nw_['height'], 'tris': sum(len(v) for v in mesh.prims.values()) // 3, 'animations': list(anims.keys())}
        # the transformed Stranger: same UV layout, grey skin, white eyes, the grin (texture swap at the reveal)
        sm = dict(next(c for c in CAST if c['id'] == 'stranger'))
        sm['pal'] = dict(sm['pal'], skin='#a9a59c', lips='#3a1a18')
        sm['extras'] = sm['extras'] + ['morph_face']
        _, _, at2 = build(sm)
        at2.img.save(os.path.join(OUT, 'stranger_morph.png'))
    # ---- photo cast (v9): the people in the found photographs. Same faces, different clothes or hair. Written to assets/characters/photo/.
    PH = os.path.join(OUT, 'photo'); os.makedirs(PH, exist_ok=True)
    base = {c['id']: c for c in CAST}
    def variant(src, new_id, **kw):
        v = dict(base[src]); pal = dict(v['pal']); pal.update(kw.pop('pal', {})); v.update(kw); v['pal'] = pal; v['id'] = new_id; return v
    PHOTO = [
        dict(id='louis_human', height=1.92, shoulder_w=0.46, hip_w=0.22, waist=0.27, thick=1.08, belly=0.07, puff=1.04, hair='bald', top='cardigan', tags=[],
             head_w=0.17, head_d=0.2, face=dict(chin=0.5, jaw=0.9, cheek=0.86, cheek_y=0.32, temple=0.95, crown=0.88, chin_fwd=0.04, p=2.3, dchin=0.8), nose=dict(len=0.024, w=0.034),
             extras=['glasses', 'soft_brows', 'stubble'], pal=dict(skin='#dcb49c', hair='#e8e6e0', top='#56708c', top2='#ece6d4', bottom='#6a5a48', belt='#3a2a1e', shoes='#4a3426', eyes='#5a6a7a', lips='#a87068')),
        dict(id='louis_work', height=1.92, shoulder_w=0.46, hip_w=0.22, waist=0.27, thick=1.08, belly=0.07, puff=1.04, hair='bald', top='plaid', tags=['jeans'],
             head_w=0.17, head_d=0.2, face=dict(chin=0.5, jaw=0.9, cheek=0.86, cheek_y=0.32, temple=0.95, crown=0.88, chin_fwd=0.04, p=2.3, dchin=0.8), nose=dict(len=0.024, w=0.034),
             extras=['glasses', 'soft_brows', 'stubble'], pal=dict(skin='#dcb49c', hair='#e8e6e0', top='#7a3a2c', bottom='#3c4f6c', belt='#3a2a1e', shoes='#4a3426', eyes='#5a6a7a', lips='#a87068')),
        dict(id='rose', height=1.6, shoulder_w=0.34, hip_w=0.22, waist=0.25, thick=0.95, bust=0.014, belly=0.03, hair='bob', bangs=True, bang_y=0.66, top='cardigan', bottom_kind='skirt', sleeve='long',
             legs='skin', skirt_len=0.55, flare=1.3, face=dict(chin=0.42, jaw=0.8, dchin=0.5), extras=['glasses', 'soft_brows'],
             pal=dict(skin='#ecc8b2', hair='#cfcbc4', top='#9a7ab0', top2='#f2ece0', bottom='#4a4660', shoes='#3a3030', eyes='#4c7a5a', lips='#b8706a')),
        variant('adaline', 'addie_overalls', hair='pigtails', bangs=True, top='overalls', bottom_kind='pants', legs='pants', sleeve='short', extras=['blush'],
                pal=dict(top='#f4e4d8', top2='#4a6ea8', bottom='#4a6ea8', shoes='#e8e8ec')),
        variant('adaline', 'addie_party', extras=['blush', 'socks', 'party_hat'], pal=dict(top='#f088b0', bottom='#f088b0', sash='#ffffff')),
        variant('adaline', 'addie_swim', hair='ponytail', bangs=False, pal=dict(top='#3aa6a0', bottom='#3aa6a0', sash='#f4e070', shoes='#f0c020')),
        variant('adaline', 'addie_pjs', top='plain', bottom_kind='pants', legs='pants', sleeve='long', extras=['blush'], pal=dict(top='#f0b6cc', bottom='#e8a0bc', shoes='#f4f0f0')),
        variant('norah', 'norah_ponytail', hair='ponytail', top='stripes', extras=['soft_brows', 'full_lips', 'boots'], pal=dict(top='#e9e3d4', top2='#a8302c')),
        variant('kenneth', 'kenneth_summer', top='polo', sleeve='short', legs='shorts', tags=[], extras=['stubble'], pal=dict(top='#d8d0b8', bottom='#a89470')),
    ]
    for sp in (PHOTO if LEGACY else []):
        mesh, J, at = build(sp)
        anims = human_anims(kid=sp.get('kid', False))
        hy_ = joints_for(sp)[1]['hip_y']; anims.update(seat_anims(hy_, sp.get('kid', False))); anims.update(norah_anims(hy_))
        at.img.save(os.path.join(PH, sp['id'] + '.png'))
        write_glb(os.path.join(PH, sp['id'] + '.glb'), mesh, J, at, anims, sp['id'])
        print('photo %-15s %4d tris' % (sp['id'], sum(len(v) for v in mesh.prims.values()) // 3))
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
