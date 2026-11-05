"""Core of the human builder: one character = a MakeHuman body (mh_human.py) plus clothes shells, hair, eyes, teeth
and accessories, all skinned to our skeleton, with textures painted by body region.

Painting works in the body's UV space. A texel map (cached) says which body triangle and barycentric point each
texel of the 512x512 texture lies on, so a painter can ask, per texel, where it is on the UNSHAPED base body (the
same for every character, so "the lips" or "the left sleeve" are defined once) and how much each bone owns it."""
import math, os
import numpy as np
import mh_human as M

TEX = 512
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'mh_data', 'texelmap_%d.npz' % TEX)

V0, VT, F, FT, G = M.base()
J0, MHPAR = M.skeleton_heads(V0)
GROUPS = {}
for i, g in enumerate(G): GROUPS.setdefault(g, []).append(i)

def tris_of(groups):
    if isinstance(groups, str): groups = [groups]
    T, TU = [], []
    for g in groups:
        for i in GROUPS.get(g, []):
            f, t = F[i], FT[i]
            for k in range(1, len(f) - 1):
                T.append([f[0], f[k], f[k + 1]]); TU.append([t[0], t[k], t[k + 1]])
    return np.array(T, int), np.array(TU, int)

BODY_T, BODY_TU = tris_of('body')

def texel_map():
    """(TEX, TEX) triangle index (-1 = empty) and (TEX, TEX, 3) barycentrics for the body UV layout."""
    if os.path.exists(CACHE):
        d = np.load(CACHE)
        return d['tri'], d['bar']
    tri = -np.ones((TEX, TEX), np.int32)
    bar = np.zeros((TEX, TEX, 3), np.float32)
    UV = VT[BODY_TU] * TEX                      # (n, 3, 2), v up
    UV[..., 1] = TEX - UV[..., 1]
    for i in range(len(UV)):
        a, b, c = UV[i]
        x0, y0 = np.floor(np.minimum(np.minimum(a, b), c)).astype(int) - 1
        x1, y1 = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int) + 1
        x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, TEX - 1), min(y1, TEX - 1)
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        v0 = b - a; v1 = c - a
        d00 = v0 @ v0; d01 = v0 @ v1; d11 = v1 @ v1
        den = d00 * d11 - d01 * d01
        if abs(den) < 1e-12: continue
        px = xs - a[0]; py = ys - a[1]
        d20 = px * v0[0] + py * v0[1]; d21 = px * v1[0] + py * v1[1]
        l1 = (d11 * d20 - d01 * d21) / den; l2 = (d00 * d21 - d01 * d20) / den; l0 = 1 - l1 - l2
        inside = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
        yy, xx = np.nonzero(inside)
        tri[yy + y0, xx + x0] = i
        bar[yy + y0, xx + x0] = np.stack([l0[inside], l1[inside], l2[inside]], -1)
    np.savez_compressed(CACHE, tri=tri, bar=bar)
    return tri, bar

class Sample:
    """Points on the body (texels, or vertices) with what painters and garment masks need:
    pb: position on the base body (MakeHuman units, Y up, +Z front, +X = character's left)
    w:  (n, 18) bone weights (ours)    n: normal (game space, of this character)"""
    def __init__(self, pb, w, n=None):
        self.pb = pb; self.w = w; self.n = n
        bi = {b: i for i, b in enumerate(M.BONES)}
        self.W = lambda *names: sum(w[:, bi[x]] for x in names)
        self.x, self.y, self.z = pb[:, 0], pb[:, 1], pb[:, 2]

    # --- regions -------------------------------------------------------------------------------------------
    def head(self): return self.W('head', 'jaw')
    def neck(self): return self.W('neck')
    def arm(self, side): return self.W('upperarm.' + side, 'forearm.' + side, 'hand.' + side)
    def hand(self, side): return self.W('hand.' + side)
    def leg(self, side): return self.W('thigh.' + side, 'shin.' + side, 'foot.' + side)
    def foot(self, side): return self.W('foot.' + side)
    def arm_t(self, side):
        """0 at the shoulder joint, 1 at the wrist, along the (base) arm. MH's L is +X."""
        mh = 'L' if side == 'L' else 'R'
        s, e = J0['upperarm01.' + mh], J0['wrist.' + mh]
        d = e - s
        return ((self.pb - s) @ d) / (d @ d)
    def leg_t(self, side):
        mh = 'L' if side == 'L' else 'R'
        s, e = J0['upperleg01.' + mh], J0['foot.' + mh]
        d = e - s
        return ((self.pb - s) @ d) / (d @ d)
    def around(self, cx=0.0, cz=0.0):
        """Angle around the body's vertical axis, 0 = front (+Z), +pi/2 = character's left."""
        return np.arctan2(self.x - cx, self.z - cz)

def body_texels():
    tri, bar = texel_map()
    m = tri >= 0
    t = tri[m]; b = bar[m]
    vi = BODY_T[t]
    pb = (V0[vi] * b[..., None]).sum(1)
    return m, vi, b, pb

def sample_texels(char):
    m, vi, b, pb = body_texels()
    if 'Vb' in char:                       # paint on the face as it's actually set (expression), not the neutral one
        pb = (char['Vb'][vi] * b[..., None]).sum(1)
    w = (char['W'][vi] * b[..., None]).sum(1)
    n = (char['N'][vi] * b[..., None]).sum(1)
    return m, Sample(pb, w, n)

def sample_verts(char, ids):
    return Sample(char.get('Vb', V0)[ids], char['W'][ids], char['N'][ids])

def normals(P, T):
    N = np.zeros_like(P)
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(N, T[:, k], fn)
    return N / (np.linalg.norm(N, axis=1, keepdims=True) + 1e-12)

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def noise2(x, y, seed=0, scale=1.0):
    """Cheap smooth value noise on arrays."""
    x = np.asarray(x) * scale; y = np.asarray(y) * scale
    xi, yi = np.floor(x), np.floor(y); xf, yf = x - xi, y - yi
    def h(a, b):
        v = np.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453
        return v - np.floor(v)
    u = xf * xf * (3 - 2 * xf); v = yf * yf * (3 - 2 * yf)
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v

def fbm(x, y, seed=0, scale=1.0, oct=3):
    s, a, tot = 0.0, 1.0, 0.0
    for o in range(oct):
        s = s + a * noise2(x, y, seed + o * 13, scale * (2 ** o)); tot += a; a *= 0.5
    return s / tot

def hexc(s):
    s = s.lstrip('#'); return np.array([int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4)])

def dilate(img, mask, px=6):
    """Spread painted texels into the empty space around UV islands (no seams at nearest filtering / mips)."""
    img = img.copy(); m = mask.copy()
    for _ in range(px):
        acc = np.zeros_like(img); cnt = np.zeros(m.shape)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            sh = np.roll(np.roll(m, dy, 0), dx, 1)
            acc += np.roll(np.roll(img, dy, 0), dx, 1) * sh[..., None]; cnt += sh
        fill = (~m) & (cnt > 0)
        img[fill] = acc[fill] / cnt[fill][:, None]
        m = m | fill
    return img

class Mesh:
    """A growing skinned mesh: vertex pool + triangle lists per material. Each corner has its own UV."""
    def __init__(self):
        self.P = []; self.N = []; self.J = []; self.Wt = []
        self.tris = {}            # material -> list of (vertex ids (3,), uvs (3,2))
    def add_verts(self, P, N, J, Wt):
        base = sum(len(p) for p in self.P)
        self.P.append(np.asarray(P, float)); self.N.append(np.asarray(N, float)); self.J.append(np.asarray(J)); self.Wt.append(np.asarray(Wt, float))
        return base
    def add_tris(self, mat, T, UV):
        self.tris.setdefault(mat, []).append((np.asarray(T, int), np.asarray(UV, float)))
    def prims(self):
        P = np.concatenate(self.P); N = np.concatenate(self.N); Jn = np.concatenate(self.J); Wt = np.concatenate(self.Wt)
        out = []
        for mat in sorted(self.tris):
            T = np.concatenate([t for t, _ in self.tris[mat]]); UV = np.concatenate([u for _, u in self.tris[mat]])
            flat_v = T.reshape(-1); flat_uv = np.round(UV.reshape(-1, 2), 5)
            key = np.concatenate([flat_v[:, None].astype(np.float64), flat_uv], 1)
            uniq, inv = np.unique(key, axis=0, return_inverse=True)
            vid = uniq[:, 0].astype(int)
            out.append(dict(pos=P[vid], nrm=N[vid], uv=uniq[:, 1:3], jn=Jn[vid], wt=Wt[vid], idx=inv.reshape(-1).astype(np.uint32), material=mat))
        return out
