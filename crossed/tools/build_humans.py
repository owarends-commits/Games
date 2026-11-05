#!/usr/bin/env python3
"""Builds the game's people on a real human body (MakeHuman, CC0) instead of the old box segments.

Each character: a MakeHuman body shaped by the macro sliders (gender, age, muscle, weight, ethnicity) and face
targets (jaw, nose, cheeks, brows, lips...), scaled to their height, re-posed to our rest pose and smoothly skinned to
our skeleton (+ a jaw for talking); a 512x512 skin texture with the face painted on (brows, lash lines, lips, stubble,
blush) and the close-fitting clothes painted by body region; 3D clothes where thickness shows (jackets, coats and
their tails, skirts and dresses, shoes) as shells over the body; 3D hair (a shaped volume and strands with alpha
edges); eyeballs; teeth and tongue; and accessories (glasses, caps, party hats). Every existing animation still fits.

Run: python3 tools/build_humans.py [ids...]      (writes assets/characters/<id>.glb + textures)
"""
import json, math, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mh_human as M
import glb_writer as GW
import lowpoly as LP
import hb_core as H
import hb_paint as P
import build_characters as BC
from hb_core import hexc, smoothstep, noise2, fbm, J0, V0

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'characters')
DETAIL = 64

# material slots (names end in what CharacterModel looks for)
MAT = ['body', 'glow', 'flesh', 'cloth', 'skirt', 'hair', 'eyes', 'detail', 'face']
MI = {m: i for i, m in enumerate(MAT)}

# ================================================================================================== body
# resting expressions, from MakeHuman's facial expression units (mixed per character from how they act)
EXPR = {
    'determined': {'eyebrows-left-down': 0.45, 'eyebrows-right-down': 0.45, 'eye-left-slit': 0.25, 'eye-right-slit': 0.25, 'mouth-compression': 0.35, 'nose-left-dilatation': 0.2, 'nose-right-dilatation': 0.2},
    'worried':    {'eyebrows-left-inner-up': 0.55, 'eyebrows-right-inner-up': 0.55, 'mouth-depression': 0.2, 'mouth-parling': 0.15},
    'scared':     {'eyebrows-left-inner-up': 0.8, 'eyebrows-right-inner-up': 0.8, 'eyebrows-left-up': 0.3, 'eyebrows-right-up': 0.3, 'eye-left-opened-up': 0.55,
                   'eye-right-opened-up': 0.55, 'mouth-depression-retraction': 0.3, 'mouth-parling': 0.35, 'neck-platysma': 0.2},
    'warm':       {'mouth-corner-puller': 0.38, 'eye-left-slit': 0.15, 'eye-right-slit': 0.15, 'eyebrows-left-extern-up': 0.12, 'eyebrows-right-extern-up': 0.12},
    'happy':      {'mouth-corner-puller': 0.6, 'mouth-elevation': 0.15, 'eye-left-slit': 0.22, 'eye-right-slit': 0.22, 'eyebrows-left-up': 0.2, 'eyebrows-right-up': 0.2},
    'stern':      {'eyebrows-left-down': 0.55, 'eyebrows-right-down': 0.55, 'mouth-compression': 0.45, 'mouth-depression': 0.15},
    'menace':     {'eyebrows-left-down': 0.3, 'eyebrows-right-down': 0.15, 'eye-left-slit': 0.35, 'eye-right-slit': 0.3, 'mouth-corner-puller': 0.25, 'mouth-compression': 0.2},
    'feral':      {'eyebrows-left-down': 0.7, 'eyebrows-right-down': 0.7, 'mouth-upward-retraction': 0.45, 'nose-left-elevation': 0.45, 'nose-right-elevation': 0.45,
                   'mouth-open': 0.25, 'eye-left-opened-up': 0.3, 'eye-right-opened-up': 0.3, 'neck-platysma': 0.5},
}
EXPR_SCALE = 0.5       # half-strength: a hint of mood without a full grimace

def stylize(img, px=96, levels=14):
    """PS1-era look: chunky texels and a reduced palette instead of photo-real skin detail."""
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    soft = im.resize((px // 2, px // 2), Image.BOX).resize((px, px), Image.BILINEAR)   # smooth the skin out
    sharp = im.resize((px, px), Image.BOX)                                               # keep eyes/lips/brows
    a = np.asarray(soft).astype(float) * 0.65 + np.asarray(sharp).astype(float) * 0.35
    im = Image.fromarray(a.astype(np.uint8)).resize(im.size, Image.NEAREST)
    return np.asarray(im).astype(float) / 255

def expr_targets(sp):
    mac = sp.get('macro', {})
    eth = 'african' if mac.get('african', 0) > 0.5 else ('asian' if mac.get('asian', 0) > 0.5 else 'caucasian')
    out = {}
    for name, w in sp.get('expr', {}).items():
        for unit, uw in EXPR[name].items():
            k = 'expression/units/%s/%s' % (eth, unit)
            out[k] = out.get(k, 0) + uw * w * EXPR_SCALE
    return out

def make_body(sp):
    if sp.get('expr'):
        sp = dict(sp, targets=dict(sp.get('targets', {}), **expr_targets(sp)))
    b = M.build_body(sp)
    s = sp['height'] / b['height']
    V = b['V'] * s
    J = {k: v * s for k, v in b['J'].items()}
    Jmh = {k: v * s for k, v in b['Jmh'].items()}
    ch = dict(V=V, J=J, Jmh=Jmh, top=b['top'], tw=b['tw'], W=b['W'], scale=s)
    if sp.get('expr'):
        Vb = V0.copy()
        for name, w in expr_targets(sp).items():
            idx, off = M.target(name)
            if len(idx): Vb[idx] += off * w
        ch['Vb'] = Vb
    for mod in sp.get('mods', []):
        mod(ch, sp)
    if sp.get('lowpoly'):
        # PS1 faces: the sockets, lids and lip detail smoothed away (the drawn texture carries them); the nose and
        # brow keep a little shape
        hw = ch['W'][:, M.BONES.index('head')] + ch['W'][:, M.BONES.index('jaw')]
        body = np.unique(H.BODY_T)
        f = body[(hw[body] > 0.5) & (V0[body, 2] > 0.75)]
        ch['V'] = _smooth(ch['V'], H.BODY_T, f, it=sp['lowpoly'].get('face_smooth', 10), lam=0.55)
    allT, _ = H.tris_of(list(H.GROUPS.keys()))
    ch['N'] = H.normals(ch['V'], H.BODY_T)
    hv = np.zeros(len(V), bool); hv[np.unique(H.BODY_T)] = True
    hv &= (ch['W'][:, M.BONES.index('head')] > 0.6)
    ch['head_top'] = ch['V'][hv][:, 1].max()
    ch['head_c'] = np.array([0.0, ch['V'][hv][:, 1].mean(), ch['V'][hv][:, 2].mean()])
    ch['head_r'] = (ch['V'][hv][:, 0].max() - ch['V'][hv][:, 0].min()) / 2
    # helpers' own normals
    for g in H.GROUPS:
        if g == 'body': continue
        T, _ = H.tris_of(g)
        if len(T):
            n = H.normals(ch['V'], T)
            ids = np.unique(T); ch['N'][ids] = n[ids]
    return ch

def mod_brute_arm(side='L', k=3.0):
    """A BCROSS Brute's arm: muscle and skin grown to `k` times the thickness (bone untouched), lumped and uneven,
    swelling up into the shoulder and the side of the chest so it grows out of the body."""
    def f(ch, sp):
        V, W = ch['V'], ch['W']; J = ch['J']
        bi = {b: i for i, b in enumerate(M.BONES)}
        s0, s1, s2 = J['upperarm.' + side], J['forearm.' + side], J['hand.' + side]
        wa = W[:, bi['upperarm.' + side]] + W[:, bi['forearm.' + side]] + 0.55 * W[:, bi['hand.' + side]]
        out = np.zeros(len(V))
        for a, b_, sel in ((s0, s1, 'upperarm.'), (s1, s2, 'forearm.')):
            d = b_ - a; L2 = d @ d
            t = np.clip(((V - a) @ d) / L2, 0, 1)
            c = a + t[:, None] * d
            r = V - c
            m = W[:, bi[sel + side]] + (0.55 * W[:, bi['hand.' + side]] if sel == 'forearm.' else 0)
            ang = np.arctan2(r[:, 2], r[:, 0])
            lump = 1 + 0.32 * (fbm(t * 5 + (0 if sel == 'upperarm.' else 3), ang * 1.3, 17, 1.0) - 0.4) + 0.18 * np.sin(t * 9 + ang * 2) ** 2
            V += r * ((k - 1) * lump * m)[:, None]
            out = np.maximum(out, m)
        # the shoulder, trap and side of the chest swell too
        dsh = np.linalg.norm(V - s0, axis=1)
        fall = np.exp(-(dsh / 0.13) ** 2) * (1 - wa)
        sidew = np.clip((V[:, 0] - 0.0) * (-1 if side == 'L' else 1) / 0.12, 0, 1)
        V += (V - s0) * (0.7 * fall * sidew)[:, None]
        ch['flesh_w'] = np.clip(out + fall * sidew * 1.4, 0, 1)
    return f

def mod_ribs(ch, sp):
    """An ACROSS: ribs and spine pushing through skin vacuum-sealed onto the bones."""
    V = ch['V']; N = H.normals(V, H.BODY_T)
    yb = V0[:, 1]; xb = V0[:, 0]; zb = V0[:, 2]
    body = np.zeros(len(V), bool); body[np.unique(H.BODY_T)] = True
    rib_zone = body & (yb > 2.6) & (yb < 4.6) & (np.abs(xb) < 1.35) & (np.abs(xb) > 0.12)
    ribs = np.clip(np.sin((yb - 2.6) * 8.5 + np.abs(xb) * 1.4), 0, 1) ** 2
    V += N * (0.0055 * ribs * rib_zone)[:, None]
    spine = body & (zb < -0.5) & (np.abs(xb) < 0.12) & (yb > 0.8) & (yb < 6.0)
    V += N * (0.006 * np.clip(np.sin(yb * 9.0), 0, 1) ** 3 * spine)[:, None]
    hollow = body & (yb > 1.2) & (yb < 2.6) & (zb > 0.4) & (np.abs(xb) < 1.0)
    V -= N * (0.01 * hollow)[:, None]

# ================================================================================================== textures
PHOTO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'faces')

def paint_body(ch, sp):
    m, S = H.sample_texels(ch)
    col = P.skin(S, sp)
    if not sp.get('photo_face'):
        col = P.face(S, sp, col)
    else:
        _, ck, _ = photo_sample(sp, S.x, S.y)
        col = col + (ck - hexc(sp['pal']['skin'])) * 1.0 * (S.head() + S.neck()).clip(0, 1)[:, None]
    o = sp.get('outfit', {})
    # scalp: hair colour under the hair
    hs = sp.get('hair', {})
    if hs.get('style') is not None:
        sc = scalp_mask(S, hs)
        hc = hexc(sp['pal']['hair'])
        col = P.lerp(col, hc * (0.75 + 0.2 * noise2(S.x * 50, S.y * 50, 3))[:, None], np.clip(sc, 0, 1))
    if sp.get('brute'):
        fw = (ch['flesh_w'][H.BODY_T] if 'flesh_w' in ch else None)
    col, mk = P.paint_garments(S, col, o, 'body')
    for fn in sp.get('paint', []):
        col = fn(S, col, sp)
    img = np.zeros((H.TEX, H.TEX, 3)); img[m] = col
    if sp.get('photo_face') or sp.get('drawn_face'):     # the skin just outside the photo patch: the patch fades to exactly this
        e = (S.x / 0.62) ** 2 + ((S.y - 6.95) / np.where(S.y > 6.95, 1.0, 0.6)) ** 2
        ring = (e > 0.9) & (e < 1.6) & (S.z > 0.4) & (S.head() > 0.5) & (S.y < 7.6)
        sp['_face_fill'] = col[ring].mean(0)
    img = H.dilate(img, m)
    cl = np.zeros((H.TEX, H.TEX, 3))
    ccol, _ = P.paint_garments(S, np.tile(hexc(sp['pal']['skin']), (len(S.y), 1)), o, 'cloth')
    cl[m] = ccol; cl = H.dilate(cl, m)
    return img, cl

def scalp_mask(S, hs):
    """Where hair grows on the head (soft edges). Hairline: high on the forehead, down to the nape, above the ears."""
    x, y, z = S.x, S.y, S.z
    head = S.head() > 0.4
    hl = hs.get('hairline', 7.92)
    if hs.get('bangs'): hl = 7.6           # a fringe: the hair comes down over the forehead
    front = smoothstep(0.2, 1.1, z)                         # 0 at the back, 1 at the front
    line = 6.55 + (hl - 6.55) * front
    side = np.abs(x) > 0.62
    line = np.where(side & (z > -0.35) & (z < 0.75), np.maximum(line, 7.45 + 0.12 * front), line)
    if hs.get('style') == 'bald':           # the horseshoe fringe
        return (head & (y > line) & (y < 7.75) & (z < 0.6)).astype(float) * 0.9
    m = head & (y > line - 0.03)
    soft = smoothstep(line - 0.03, line + 0.06, y)
    if hs.get('style') == 'patchy':
        soft *= (fbm(x * 4, y * 4 + z * 3, 31) > 0.48)
    return m * soft

def hair_texture(hc, seed=0, size=256):
    """RGBA strands: vertical strands with light and dark variation; alpha thins to ragged ends near v=1."""
    rng = np.random.default_rng(seed)
    u = np.arange(size)[None, :] / size; v = np.arange(size)[:, None] / size
    strand = np.zeros((size, size))
    for k in range(140):
        cx = rng.random(); w = rng.uniform(0.002, 0.008); a = rng.uniform(0.3, 1.0)
        wav = 0.01 * np.sin(v * rng.uniform(4, 9) + rng.random() * 6)
        strand += a * np.exp(-((((u - cx - wav) + 0.5) % 1 - 0.5) / w) ** 2)
    strand = np.clip(strand, 0, 1.4)
    shade = 0.62 + 0.38 * np.clip(strand, 0, 1)
    col = np.clip(hc[None, None, :] * shade[..., None] * (0.9 + 0.2 * (1 - v))[..., None], 0, 1)
    ends = np.clip(1 - (v - 0.78) / 0.22, 0, 1)                        # ragged tips toward the bottom
    tips = (strand > 0.25 + 0.6 * (v - 0.8) / 0.2)
    alpha = np.where(v < 0.8, 1.0, tips.astype(float))
    img = np.concatenate([col, alpha[..., None]], -1)
    return Image.fromarray((img * 255).astype(np.uint8), 'RGBA')

def eye_texture(sp, size=64):
    p = sp['pal']; e = hexc(p.get('eyes', '#5a4030'))
    yy, xx = np.mgrid[0:size, 0:size] / (size - 1)
    dx, dy = xx - 0.5, yy - 0.5; r = np.hypot(dx, dy)
    col = np.ones((size, size, 3)) * np.array([0.93, 0.9, 0.86])
    col *= (1 - 0.25 * smoothstep(0.25, 0.5, r))[..., None]                       # shadowed edges
    col[..., 1] -= 0.04 * smoothstep(0.3, 0.5, r); col[..., 2] -= 0.05 * smoothstep(0.3, 0.5, r)
    if sp.get('white_eyes'):
        col = np.ones((size, size, 3)) * np.array([0.9, 0.9, 0.86]) * (1 - 0.15 * r)[..., None]
        col *= (1 - 0.12 * smoothstep(0.08, 0.16, r) * (1 - smoothstep(0.16, 0.22, r)))[..., None]
    else:
        ir = 0.19
        iris = r < ir
        ang = np.arctan2(dy, dx)
        streak = 0.8 + 0.25 * np.sin(ang * 23) * (r / ir)
        icol = e[None, None, :] * streak[..., None] * (1.15 - 0.5 * r / ir)[..., None]
        col[iris] = icol[iris]
        col[r < 0.075] = [0.03, 0.03, 0.03]
        ring = (r > ir - 0.025) & (r < ir)
        col[ring] *= 0.55
        col[(np.hypot(dx + 0.05, dy + 0.05) < 0.03)] = [1, 1, 1]
    return Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8))

class Detail:
    """A small palette texture: solid colour swatches for teeth, tongue, lashes, frames, hats..."""
    def __init__(self): self.cols = []
    def uv(self, col):
        c = tuple(np.round(hexc(col) if isinstance(col, str) else col, 3))
        if c not in self.cols: self.cols.append(c)
        i = self.cols.index(c); n = 8
        return ((i % n) + 0.5) / n, ((i // n) + 0.5) / n
    def image(self):
        n = 8; px = DETAIL // n
        img = np.zeros((DETAIL, DETAIL, 3))
        for i, c in enumerate(self.cols):
            img[(i // n) * px:(i // n + 1) * px, (i % n) * px:(i % n + 1) * px] = c
        return Image.fromarray((img * 255).astype(np.uint8))

# ================================================================================================== geometry parts
def body_part(mesh, ch, sp):
    T, TU = H.BODY_T, H.BODY_TU
    uv = H.VT[TU].copy(); uv[..., 1] = 1 - uv[..., 1]
    base = mesh.add_verts(ch['V'], ch['N'], ch['top'], ch['tw'])
    if 'flesh_w' in ch:
        fl = ch['flesh_w'][T].mean(1) > 0.35
        mesh.add_tris(MI['flesh'], T[fl] + base, uv[fl]); mesh.add_tris(MI['body'], T[~fl] + base, uv[~fl])
    else:
        if sp.get('photo_face') or sp.get('drawn_face'):
            fm = face_tris(ch)
            Pb = H.V0[T[fm]]
            mesh.add_tris(MI['face'], T[fm] + base, face_uv(Pb))
            T, uv = T[~fm], uv[~fm]
        mesh.add_tris(MI['body'], T + base, uv)
    return base

# the photo face: its own small texture, mapped straight on (planar) over the front of the head
FACE_BOX = (-0.75, 0.75, 6.2, 8.1)        # base x0, x1, y0, y1
FACE_TEX = (128, 162)                     # older-game resolution

def face_uv(Pb):
    x0, x1, y0, y1 = FACE_BOX
    return np.stack([(Pb[..., 0] - x0) / (x1 - x0), (y1 - Pb[..., 1]) / (y1 - y0)], -1)

def face_tris(ch):
    P = H.V0[H.BODY_T]; c = P.mean(1)
    hw = ch['W'][H.BODY_T][..., M.BONES.index('head')].mean(1) + ch['W'][H.BODY_T][..., M.BONES.index('jaw')].mean(1)
    x0, x1, y0, y1 = FACE_BOX
    inside = (P[..., 0] > x0).all(1) & (P[..., 0] < x1).all(1) & (P[..., 1] > y0).all(1) & (P[..., 1] < y1).all(1)
    return inside & (P[..., 2] > 0.55).all(1) & (hw > 0.3) & (c[:, 1] < 7.85)

def face_texture(sp):
    """The photo, warped onto FACE_BOX, faded into the photo's own skin tone at the edges."""
    w, h = FACE_TEX
    x0, x1, y0, y1 = FACE_BOX
    xs, ys = np.meshgrid(np.linspace(x0, x1, w * 4), np.linspace(y1, y0, h * 4))
    S = type('S', (), {})()
    S.x, S.y = xs.ravel(), ys.ravel()
    ph, ck, m = photo_sample(sp, S.x, S.y)
    col = ph * m[:, None] + ck * (1 - m[:, None])
    img = Image.fromarray((np.clip(col.reshape(h * 4, w * 4, 3), 0, 1) * 255).astype(np.uint8))
    return img.resize((w, h), Image.BOX)

def photo_sample(sp, x, y):
    pf = sp['photo_face']
    im = np.asarray(Image.open(os.path.join(PHOTO_DIR, pf['file'])).convert('RGB')).astype(float) / 255
    (lx, ly), (rx, ry) = pf['eyes']
    cx, ey = (lx + rx) / 2, (ly + ry) / 2
    sx = (rx - lx) / (2 * 0.3078)
    sy = (pf['mouth'] - ey) / (7.284 - 6.72)            # photo px per base unit, down the face
    my = np.array([8.6, 7.284, 6.87, 6.72, 6.42, 6.1])
    py_ = np.array([ey - (8.6 - 7.284) * sy, ey, pf['nose'], pf['mouth'], pf['chin'], pf['chin'] + 0.32 * sy])
    py = np.interp(-y, -my, py_); px = cx + x * sx
    hh, ww = im.shape[:2]
    ph = im[np.clip(py.astype(int), 0, hh - 1), np.clip(px.astype(int), 0, ww - 1)]
    ck = im[int(pf['nose']) - 10:int(pf['nose']) + 30, int(cx - 0.45 * sx):int(cx - 0.3 * sx)].reshape(-1, 3).mean(0)
    e = (x / 0.62) ** 2 + ((y - 6.95) / np.where(y > 6.95, 1.0, 0.6)) ** 2
    m = 1 - smoothstep(0.45, 0.85, e)
    m = m * (1 - smoothstep(7.55, 7.7, y))              # no photo hair on the forehead
    if '_face_fill' in sp: ck = sp['_face_fill']
    return ph, ck, m

def _smooth(P, T, ids, it=6, lam=0.6):
    """Laplacian smoothing of the vertices `ids` (others fixed), over the triangles T."""
    P = P.copy(); sel = np.zeros(len(P), bool); sel[ids] = True
    e = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
    for _ in range(it):
        acc = np.zeros_like(P); cnt = np.zeros(len(P))
        np.add.at(acc, e[:, 0], P[e[:, 1]]); np.add.at(cnt, e[:, 0], 1)
        np.add.at(acc, e[:, 1], P[e[:, 0]]); np.add.at(cnt, e[:, 1], 1)
        avg = acc / np.maximum(cnt, 1)[:, None]
        P[sel] += (avg[sel] - P[sel]) * lam
    return P

def shell(mesh, ch, sp, mask_v, thick, mat='cloth', bulge=None, inset_body=True, smooth=0):
    """Clothing with thickness: the body faces under `mask_v` (per vertex), pushed out along the normals, with a rim
    folded back to the body at every open edge (cuffs, hems, collars) so the cloth reads as having thickness."""
    T, TU = H.BODY_T, H.BODY_TU
    sel = mask_v[T].all(1)
    if not sel.any(): return
    Ts = T[sel]; uv = H.VT[TU[sel]].copy(); uv[..., 1] = 1 - uv[..., 1]
    ids = np.unique(Ts)
    off = np.full(len(ch['V']), thick)
    if bulge is not None: off = off * bulge
    Pn = ch['V'] + ch['N'] * off[:, None]
    if smooth:
        Pn = _smooth(Pn, Ts, ids, it=smooth)
        Pn[ids, 1] = np.maximum(Pn[ids, 1], ch['V'][ids, 1].min() - 0.004)     # a flat sole
    base = mesh.add_verts(Pn, ch['N'], ch['top'], ch['tw'])
    mesh.add_tris(MI[mat], Ts + base, uv)
    if inset_body:
        ch['V'][ids] -= ch['N'][ids] * min(thick * 0.35, 0.004)
    # rims: edges used by one selected triangle
    e = np.concatenate([Ts[:, [0, 1]], Ts[:, [1, 2]], Ts[:, [2, 0]]])
    euv = np.concatenate([uv[:, [0, 1]], uv[:, [1, 2]], uv[:, [2, 0]]])
    key = np.sort(e, 1)
    _, inv, cnt = np.unique(key, axis=0, return_inverse=True, return_counts=True)
    border = cnt[inv] == 1
    be = e[border]; buv = euv[border]
    inner = mesh.add_verts(ch['V'] - ch['N'] * 0.002, ch['N'], ch['top'], ch['tw'])
    a, b_ = be[:, 0], be[:, 1]
    q1 = np.stack([a + base, b_ + base, b_ + inner], 1); q2 = np.stack([a + base, b_ + inner, a + inner], 1)
    u1 = np.stack([buv[:, 0], buv[:, 1], buv[:, 1]], 1); u2 = np.stack([buv[:, 0], buv[:, 1], buv[:, 0]], 1)
    mesh.add_tris(MI[mat], q1, u1); mesh.add_tris(MI[mat], q2, u2)
    mesh.add_tris(MI[mat], q1[:, ::-1], u1[:, ::-1]); mesh.add_tris(MI[mat], q2[:, ::-1], u2[:, ::-1])

def helper_part(mesh, ch, group, keep_face, mat, uvfn, offset=0.0, double=False):
    """A MakeHuman helper mesh (skirt, hair, eyes, teeth...), faces filtered by keep_face(base positions (n,k,3))."""
    T, _ = H.tris_of(group)
    if not len(T): return
    k = keep_face(V0[T]) if keep_face else np.ones(len(T), bool)
    T = T[k]
    if not len(T): return
    P_ = ch['V'] + ch['N'] * offset
    base = mesh.add_verts(P_, ch['N'], ch['top'], ch['tw'])
    uv = uvfn(V0[T])
    mesh.add_tris(MI[mat], T + base, uv)
    if double: mesh.add_tris(MI[mat], T[:, ::-1] + base, uv[:, ::-1])
    return T

def cyl_uv(Pb, top, length, rep=3.0):
    ang = np.arctan2(Pb[..., 0], Pb[..., 2])
    u = (ang / (2 * np.pi) + 0.5) * rep
    # keep each triangle's u continuous across the seam at the back
    u0 = u[..., :1]
    u = np.where(u - u0 > rep / 2, u - rep, np.where(u0 - u > rep / 2, u + rep, u))
    v = (top - Pb[..., 1]) / length
    return np.stack([u, v], -1)

def skirt_texture(gar, size=256):
    """Fabric for a skirt/dress/coat-tail: the garment pattern laid on a cylinder."""
    yy, xx = np.mgrid[0:size, 0:size] / size
    ang = (xx - 0.5) * 2 * np.pi
    class Cyl:
        pass
    S = Cyl(); r = 1.5
    S.x = (np.sin(ang) * r).ravel(); S.z = (np.cos(ang) * r).ravel(); S.y = (1.8 - yy * 6).ravel()
    S.n = None; S.around = lambda cx=0.0, cz=0.0: np.arctan2(S.x, S.z)
    S.leg = lambda s: np.zeros(len(S.x)); S.leg_t = lambda s: np.zeros(len(S.x))
    col = P.pattern(gar.get('pattern', 'cotton'), S, gar['color'], gar.get('color2'), gar.get('seed', 0)).reshape(size, size, 3)
    hem = yy > 0.97
    col[hem] *= 0.75
    return Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8))

def eyes_part(mesh, ch, sp):
    if sp.get('drawn_face'): return          # painted into the face texture
    for g, mh in (('helper-l-eye', 'eye.L'), ('helper-r-eye', 'eye.R')):
        c = J0[mh]
        def uvfn(Pb, c=c):
            d = Pb - c; d /= np.linalg.norm(d, axis=-1, keepdims=True)
            return np.stack([0.5 + d[..., 0] * 0.5, 0.5 - d[..., 1] * 0.5], -1)
        helper_part(mesh, ch, g, None, 'glow' if sp.get('glow_eyes') else 'eyes', uvfn)

def mouth_part(mesh, ch, sp, det):
    t_uv = det.uv(sp.get('teeth', '#e2dccb')); g_uv = det.uv('#8a4048'); d_uv = det.uv('#4a2026')
    for g, uv in (() if sp.get('drawn_face') else (('helper-upper-teeth', t_uv), ('helper-lower-teeth', t_uv), ('helper-tongue', g_uv))):
        helper_part(mesh, ch, g, None, 'detail', lambda Pb, uv=uv: np.broadcast_to(np.array(uv), Pb.shape[:-1] + (2,)).copy())
    lash = det.uv(sp['pal'].get('lashes', '#3a2a22'))
    for g in (() if (sp.get('photo_face') or sp.get('drawn_face')) else ('helper-l-eyelashes-1', 'helper-l-eyelashes-2', 'helper-r-eyelashes-1', 'helper-r-eyelashes-2')):
        helper_part(mesh, ch, g, None, 'detail', lambda Pb: np.broadcast_to(np.array(lash), Pb.shape[:-1] + (2,)).copy(), double=True)
    # the inside of the mouth: a dark pocket behind the lips (seen when the jaw opens)
    Jm = ch['Jmh']
    c = (Jm['oris01'] + Jm['oris05']) / 2 + np.array([0, -0.004, 0.034]) * ch['scale']     # behind the teeth (game space: front is -Z)
    rad = np.array([0.02, 0.014, 0.022]) * ch['scale']
    sph(mesh, ch, c, rad, det.uv('#2a0c10'), {'jaw': 0.5, 'head': 0.5}, inside=True)

def bone_w(names):
    jn = np.zeros(4, np.uint16); wt = np.zeros(4, np.float32)
    for i, (b, w) in enumerate(names.items()):
        jn[i] = M.BONES.index(b); wt[i] = w
    return jn, wt

def sph(mesh, ch, c, rad, uv, bones, inside=False, seg=10, ring=6):
    pts = []; nrm = []
    for i in range(ring + 1):
        th = math.pi * i / ring
        for j in range(seg):
            ph = 2 * math.pi * j / seg
            d = np.array([math.sin(th) * math.cos(ph), math.cos(th), math.sin(th) * math.sin(ph)])
            pts.append(c + d * rad); nrm.append(-d if inside else d)
    jn, wt = bone_w(bones)
    base = mesh.add_verts(np.array(pts), np.array(nrm), np.tile(jn, (len(pts), 1)), np.tile(wt, (len(pts), 1)))
    T = []
    for i in range(ring):
        for j in range(seg):
            a = i * seg + j; b_ = i * seg + (j + 1) % seg; c_ = a + seg; d = b_ + seg
            T += [[a, c_, b_], [b_, c_, d]]
    T = np.array(T)
    if inside: T = T[:, ::-1]
    mesh.add_tris(MI['detail'], T + base, np.tile(np.array(uv), (len(T), 3, 1)))

def tube(mesh, pts, radii, uvfn, bones, mat='detail', seg=8, cap=True):
    """A tube along a polyline (game space), rigid to `bones` ({bone: weight})."""
    pts = np.array(pts, float); n = len(pts)
    P_, N_, U_ = [], [], []
    for i in range(n):
        t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]; t /= np.linalg.norm(t) + 1e-9
        a = np.cross(t, [0, 1, 0]) if abs(t[1]) < 0.9 else np.cross(t, [1, 0, 0]); a /= np.linalg.norm(a)
        b_ = np.cross(t, a)
        for j in range(seg + 1):
            ph = 2 * math.pi * j / seg
            d = a * math.cos(ph) + b_ * math.sin(ph)
            P_.append(pts[i] + d * radii[i]); N_.append(d); U_.append(uvfn(i / (n - 1), j / seg))
    jn, wt = bone_w(bones)
    base = mesh.add_verts(np.array(P_), np.array(N_), np.tile(jn, (len(P_), 1)), np.tile(wt, (len(P_), 1)))
    U_ = np.array(U_)
    T = []
    for i in range(n - 1):
        for j in range(seg):
            a = i * (seg + 1) + j; b_ = a + 1; c = a + seg + 1; d = c + 1
            T += [[a, b_, c], [b_, d, c]]
    T = np.array(T)
    mesh.add_tris(MI[mat], T + base, U_[T])

def hair_part(mesh, ch, sp, det):
    hs = sp.get('hair', {}); st = hs.get('style')
    if st in (None, 'bald'): return
    vS = H.sample_verts(ch, np.arange(len(V0)))
    sc = scalp_mask(vS, hs)
    head_v = np.zeros(len(V0), bool); head_v[np.unique(H.BODY_T)] = True
    th = {'buzz': 0.0025, 'short': 0.011, 'curly': 0.024, 'patchy': 0.002, 'long': 0.008, 'bob': 0.01, 'ponytail': 0.006, 'pigtails': 0.006, 'tuft': 0.011}.get(st, 0.008)
    m = (sc > 0.35) & head_v
    if st == 'patchy': m &= (fbm(V0[:, 0] * 4, V0[:, 1] * 4 + V0[:, 2] * 3, 31) > 0.5)
    bul = None
    if st == 'curly':
        bul = 1 + 0.6 * (fbm(V0[:, 0] * 9, V0[:, 1] * 9 + V0[:, 2] * 7, 41) - 0.3)
    if st in ('short', 'tuft'):
        bul = 1 + 0.35 * smoothstep(7.6, 8.4, V0[:, 1])       # fuller on top
    # the cap of hair: UV runs down the head so strands flow from the crown
    T, TU = H.BODY_T, H.BODY_TU
    sel = m[T].all(1)
    Ts = T[sel]
    if len(Ts):
        off = np.full(len(V0), th) * (bul if bul is not None else 1)
        base = mesh.add_verts(ch['V'] + ch['N'] * off[:, None], ch['N'], ch['top'], ch['tw'])
        uv = cyl_uv(V0[Ts], 8.6, 2.6, 4.0) * np.array([1, 0.72])
        mesh.add_tris(MI['hair'], Ts + base, uv)
    # long hair: MakeHuman's long-hair helper, cut to length
    if st in ('long', 'bob', 'curly_long'):
        cut = {'long': hs.get('to', 3.6), 'bob': hs.get('to', 6.45)}.get(st, 4.0)
        def keep(Pb, cut=cut):
            c = Pb.mean(1)
            face = (c[:, 2] > 0.3) & (c[:, 1] < 7.92) & (np.abs(c[:, 0]) < 0.74)      # nothing hangs in front of the face
            chest = (c[:, 2] > 0.6) & (c[:, 1] < 6.4)                                  # or down the front of the chest
            return (Pb[..., 1] > cut).all(-1) & ~face & ~chest
        top = 8.55
        helper_part(mesh, ch, 'helper-hair', keep, 'hair', lambda Pb: cyl_uv(Pb, top, top - cut + 0.4, 4.0), offset=0.006, double=True)
    if st in ('ponytail', 'pigtails'):
        hc_, r = ch['head_c'], ch['head_r']
        if st == 'ponytail':
            roots = [(hc_ + np.array([0, 0.45 * r, 0.92 * r]), np.array([0, 0, 1.0]))]          # back of the head (game +Z is the back)
        else:
            roots = [(hc_ + np.array([sx * 0.88 * r, 0.3 * r, 0.25 * r]), np.array([sx, 0, 0.3])) for sx in (-1, 1)]
        L = hs.get('len', 0.3)
        tie = det.uv(sp['pal'].get('tie', '#a8302c'))
        for r0, out in roots:
            out = out / np.linalg.norm(out)
            pts = [r0 + out * (0.03 * k / 5 + 0.03 * math.sin(k / 5 * 2.2)) + np.array([0, -L * (k / 5) ** 1.25, 0]) for k in range(6)]
            rad = [0.022, 0.03, 0.028, 0.024, 0.016, 0.005]
            tube(mesh, pts, rad, lambda t, a: (a * 2, t * 0.95), {'head': 1.0}, mat='hair')
            tube(mesh, [r0 - out * 0.004, r0 + out * 0.012], [0.024, 0.024], lambda t, a: tie, {'head': 1.0}, seg=8)


def glasses(mesh, ch, sp, det):
    Jm = ch['Jmh']; s = ch['scale']
    col = det.uv(sp.get('frames', '#3a3632'))
    for e in ('eye.L', 'eye.R'):
        c = Jm[e] + np.array([0, 0.002, -0.022]) * s
        ring = [c + np.array([math.cos(a) * 0.022, math.sin(a) * 0.016, 0]) * s for a in np.linspace(0, 2 * math.pi, 13)]
        tube(mesh, ring, [0.0022 * s] * len(ring), lambda t, a: col, {'head': 1.0}, seg=4)
        side = 1 if e == 'eye.R' else -1
        tmp = [c + np.array([side * 0.022, 0.004, 0]) * s, c + np.array([side * 0.032, 0.006, 0.03]) * s, c + np.array([side * 0.034, 0.004, 0.09]) * s]
        tube(mesh, tmp, [0.0018 * s] * 3, lambda t, a: col, {'head': 1.0}, seg=4)
    a = Jm['eye.L'] + np.array([0.022, 0.006, -0.024]) * s; b_ = Jm['eye.R'] + np.array([-0.022, 0.006, -0.024]) * s
    tube(mesh, [a, (a + b_) / 2 + np.array([0, 0.004, -0.004]) * s, b_], [0.002 * s] * 3, lambda t, a_: col, {'head': 1.0}, seg=4)

def hat(mesh, ch, sp, det, kind):
    Jm = ch['Jmh']; s = ch['scale']; hd = Jm['head']
    if kind == 'party':
        c1 = det.uv(sp['pal'].get('hat', '#e86aa8'))
        r = ch['head_r']
        base = np.array([0.0, ch['head_top'] - 0.25 * r, ch['head_c'][2] - 0.1 * r])
        pts = [base + np.array([0, 1.9 * r * k / 6, 0]) for k in range(7)]
        tube(mesh, pts, [0.62 * r * (1 - k / 6) + 0.002 for k in range(7)], lambda t, a: c1, {'head': 1.0})
    elif kind == 'cap':
        c1 = det.uv(sp['pal'].get('hat', '#8a2a24'))
        r = ch['head_r']
        top = np.array([0.0, ch['head_top'] - 0.62 * r, ch['head_c'][2]])
        pts = [top + np.array([0, 0.66 * r * (k / 5) ** 0.7, 0]) for k in range(6)]
        tube(mesh, pts, [r * 1.07 * (1 - (k / 5) ** 2.2) + 0.004 for k in range(6)], lambda t, a: c1, {'head': 1.0}, seg=12)
        brim = [top + np.array([0, 0.0, -0.85 * r - 0.07 * k / 3]) for k in range(4)]
        tube(mesh, brim, [0.06 * s, 0.058 * s, 0.05 * s, 0.03 * s], lambda t, a: c1, {'head': 1.0}, seg=6)

# ================================================================================================== one character
def build(sp):
    ch = make_body(sp)
    mesh = H.Mesh()
    det = Detail()
    o = sp.get('outfit', {})
    # shells (before the body, which they push in a touch where they cover it)
    vS = H.sample_verts(ch, np.arange(len(V0)))
    mk = P.masks(vS, o)
    if o.get('outer'):
        bul = None
        if o['outer'].get('pattern') == 'puffer':
            bul = 1 + 0.9 * np.abs(np.sin(V0[:, 1] * 4.4)) ** 0.5
        shell(mesh, ch, sp, mk['outer'] > 0.5, o['outer'].get('thick', 0.014), bulge=bul)
    if o.get('shoes') and o['shoes'].get('thick', 0.005) > 0:
        shell(mesh, ch, sp, mk['shoes'] > 0.5, o['shoes'].get('thick', 0.006) + 0.004, smooth=10)
    if o.get('bottom', {}).get('thick'):
        shell(mesh, ch, sp, mk['pants'] > 0.5, o['bottom']['thick'])
    body_part(mesh, ch, sp)
    # skirts, dresses and coat tails on MakeHuman's skirt helper
    textures = {}
    sk = o.get('skirt')
    if sk:
        top = 1.84; L = sk['len']
        open_ = sk.get('open', 0)
        def keep(Pb, L=L, open_=open_):
            k = (Pb[..., 1] > top - L).all(-1)
            if open_: k &= ~((np.abs(Pb[..., 0]) < open_).all(-1) & (Pb[..., 2] > 0).all(-1))
            return k
        helper_part(mesh, ch, 'helper-skirt', keep, 'skirt', lambda Pb: cyl_uv(Pb, top, L, 1.0), offset=sk.get('thick', 0.012), double=True)
        textures['skirt'] = skirt_texture(sk)
    eyes_part(mesh, ch, sp)
    mouth_part(mesh, ch, sp, det)
    hair_part(mesh, ch, sp, det)
    for acc in sp.get('acc', []):
        if acc == 'glasses': glasses(mesh, ch, sp, det)
        elif acc in ('party', 'cap'): hat(mesh, ch, sp, det, acc)
    # textures
    body_img, cloth_img = paint_body(ch, sp)
    return ch, mesh, det, body_img, cloth_img, textures

def write(sp, anims):
    ch, mesh, det, body_img, cloth_img, textures = build(sp)
    name = sp['id']
    out_dir = os.path.join(OUT, sp['dir']) if sp.get('dir') else OUT
    os.makedirs(out_dir, exist_ok=True)
    files = {}
    def save(key, img):
        fn = '%s_%s.png' % (name, key) if key != 'body' else name + '.png'
        img.save(os.path.join(out_dir, fn)); files[key] = fn
    save('body', Image.fromarray((np.clip(body_img, 0, 1) * 255).astype(np.uint8)))
    save('cloth', Image.fromarray((np.clip(cloth_img, 0, 1) * 255).astype(np.uint8)))
    save('hair', hair_texture(hexc(sp['pal'].get('hair', '#3a2a20')), seed=len(name)))
    save('eyes', eye_texture(sp))
    save('detail', det.image())
    if 'skirt' in textures: save('skirt', textures['skirt'])
    if sp.get('photo_face'): save('face', face_texture(sp))
    if sp.get('drawn_face'): save('face', LP.drawn_face(sp, FACE_BOX, sp['_face_fill']))
    images = list(files.values())
    def img_of(k): return images.index(files[k]) if k in files else None
    mats = [{'name': name + '_body', 'image': img_of('body')},
            {'name': name + '_glow', 'color': [1, 1, 1, 1], 'emissive': True},
            {'name': name + '_flesh', 'image': img_of('body')},
            {'name': name + '_cloth', 'image': img_of('cloth')},
            {'name': name + '_skirt', 'image': img_of('skirt') if 'skirt' in files else img_of('cloth')},
            {'name': name + '_hair', 'image': img_of('hair'), 'alpha': True},
            {'name': name + '_eyes', 'image': img_of('eyes')},
            {'name': name + '_detail', 'image': img_of('detail')},
            {'name': name + '_face', 'image': img_of('face') if 'face' in files else img_of('body')}]
    prims = mesh.prims()
    if sp.get('lowpoly'): prims = LP.lowpoly(prims, sp['lowpoly'])
    GW.write(os.path.join(out_dir, name + '.glb'), name, M.BONES, M.PARENT, ch['J'], prims, mats, images, anims, BC.euler)
    tris = sum(len(p['idx']) for p in prims) // 3
    return ch, tris

# ================================================================================================== the cast
def outfit(**kw): return kw
def gar(color, pattern='cotton', **kw): d = dict(color=color, pattern=pattern); d.update(kw); return d

def brute_cut(S):
    """Where the Brute's swollen shoulder has burst the cardigan open."""
    x, y = S.x, S.y
    sh = np.hypot(x - 1.75, (y - 5.1) * 0.9)
    jag = (fbm(x * 5, y * 5, 61) - 0.5) * 0.5
    return ((x > 1.2) & (sh < 1.05 + jag)) | ((S.arm('L') > 0.5) & (S.arm_t('L') < 1.1))

def paint_brute(S, col, sp):
    """The Brute's arm: stretched, blotched, veined."""
    arm = np.clip(S.arm('L') + np.exp(-(np.hypot(S.x - 1.75, S.y - 5.1) / 0.8) ** 2) * (S.x > 1.0), 0, 1)
    m = arm > 0.3
    x, y, z = S.x[m], S.y[m], S.z[m]
    blot = fbm(x * 3 + z * 2, y * 3, 71)
    c = col[m] * (0.85 + 0.3 * blot)[:, None]
    c = c * np.array([0.92, 0.72, 0.68])                                      # engorged: redder, darker than the rest of him
    c = P.lerp(c, np.array([0.45, 0.2, 0.24]), np.clip(blot - 0.45, 0, 1) * 1.8)
    vein = np.abs(np.sin(y * 9 + 2.5 * np.sin(x * 3 + z * 4) + fbm(x * 2, y * 2, 72) * 6)) < 0.08
    c[vein] = c[vein] * 0.45 + np.array([0.25, 0.18, 0.32]) * 0.55
    col[m] = c
    return col

def paint_burns(S, col, sp):
    m = (fbm(S.x * 2 + S.z * 2, S.y * 2, 81) > 0.66) & (S.head() < 0.5)
    col[m] = col[m] * 0.6 + np.array([0.3, 0.12, 0.08]) * 0.4
    return col

def paint_brand(where):
    def f(S, col, sp):
        if where == 'hip': cx, cy = 1.0, 0.9
        else: cx, cy = -1.4, 4.9
        dx, dy = np.abs(S.x - cx), S.y - cy
        cross = (((dx < 0.06) & (np.abs(dy) < 0.32)) | ((np.abs(dy - 0.1) < 0.06) & (dx < 0.2))) & (S.z > -0.3)
        ring = cross ^ ((((dx < 0.12) & (np.abs(dy) < 0.38)) | ((np.abs(dy - 0.1) < 0.12) & (dx < 0.26))) & (S.z > -0.3))
        col[ring] = col[ring] * 0.5 + np.array([0.5, 0.15, 0.1]) * 0.5
        col[cross] = np.array([0.22, 0.06, 0.04])
        return col
    return f

def paint_dirt(S, col, sp):
    d = np.clip((fbm(S.x * 2.5, S.y * 2.5 + S.z, 91) - 0.5) * 3.0, 0, 1) * (0.5 + 0.5 * noise2(S.x * 40, S.y * 40, 92))
    d *= np.where(S.head() > 0.5, 0.45, 1.0)                       # only a smudge or two on the face
    col = col * (1 - d[:, None] * np.array([0.18, 0.22, 0.26]))
    return col

def paint_ribs_shadow(S, col, sp):
    zone = (S.y > 2.6) & (S.y < 4.6) & (np.abs(S.x) < 1.35) & (S.head() < 0.3) & (S.arm('L') + S.arm('R') < 0.4)
    d = np.clip(-np.sin((S.y - 2.6) * 8.5 + np.abs(S.x) * 1.4), 0, 1)
    col[zone] *= (1 - 0.3 * d[zone])[:, None]
    col *= (1 - 0.15 * ((S.y > 1.2) & (S.y < 2.6) & (S.z > 0.4)))[:, None]
    return col

def paint_grin(S, col, sp):
    """The Stranger's morph: the mouth split wide toward the ears, dark and wet, veins up the neck."""
    ax = np.abs(S.x)
    grin = (S.head() > 0.5) & (S.z > 0.5) & (np.abs(S.y - (6.71 + 0.18 * (ax / 0.7) ** 2)) < 0.03 + 0.02 * (1 - ax)) & (ax < 0.72)
    col[grin] = np.array([0.12, 0.02, 0.03])
    veins = (S.neck() + S.head() > 0.4) & (S.y < 6.6) & (np.abs(np.sin(S.y * 14 + np.sin(S.x * 6) * 2)) < 0.07)
    col[veins] = col[veins] * 0.6 + np.array([0.2, 0.12, 0.25]) * 0.4
    return col

CAST = [
    dict(id='norah', expr={'determined': 0.7, 'worried': 0.35}, height=1.68,
         macro=dict(gender=0.0, age=0.47, muscle=0.5, weight=0.42, height=0.55),
         targets={'head/head-oval': 0.5, 'chin/chin-width-decr': 0.3, 'nose/nose-scale-horiz-decr': 0.3, 'nose/nose-point-width-decr': 0.4,
                  'mouth/mouth-lowerlip-volume-incr': 0.4, 'mouth/mouth-upperlip-volume-incr': 0.25, 'cheek/l-cheek-bones-incr': 0.3, 'cheek/r-cheek-bones-incr': 0.3,
                  'eyebrows/eyebrows-angle-up': 0.2},
         pal=dict(skin='#e6bfa3', hair='#3b2418', eyes='#6d6a3c', lips='#b8726c'),
         face=dict(lip_full=1, brow=0.9, freckles=True), blush=0.4,
         hair=dict(style='long', to=4.4, hairline=7.98),
         outfit=outfit(top=gar('#e6e1d5', 'cotton', sleeve_t=1.0, neck='collar', hem=0.4, buttons='#d8d0c0'),
                       bottom=gar('#2a2a33', 'denim', leg_t=0.97, belt='#4a3022'),
                       shoes=gar('#5a3a24', from_t=0.84, thick=0.007),
                       outer=gar('#5e5a3e', 'knit', sleeve_t=1.0, hem=-0.6, open=0.32, collar=True, thick=0.013),
                       skirt=gar('#5e5a3e', 'knit', len=3.0, open=0.32, thick=0.026))),
    dict(id='kenneth', expr={'determined': 0.8}, height=1.86, kenneth_seat=True,
         macro=dict(gender=1.0, age=0.5, muscle=0.62, weight=0.52, height=0.6),
         targets={'head/head-square': 0.4, 'chin/chin-width-incr': 0.4, 'chin/chin-prominent-incr': 0.3, 'nose/nose-hump-incr': 0.3, 'eyebrows/eyebrows-trans-down': 0.3,
                  'forehead/forehead-scale-vert-decr': 0.2},
         pal=dict(skin='#dcb39a', hair='#5a3a22', eyes='#4a7ab8', lips='#b07a70', beard='#4a3020'),
         face=dict(stubble=1.0, brow=1.2),
         hair=dict(style='short', hairline=7.95),
         outfit=outfit(top=gar('#3a3a3a', 'knit', sleeve_t=1.0, hem=0.5),
                       bottom=gar('#3a5578', 'denim', belt='#6b4528'),
                       shoes=gar('#2a2420', from_t=0.9, thick=0.008),
                       outer=gar('#2b2e38', 'puffer', sleeve_t=1.0, hem=0.9, collar=True, thick=0.016))),
    dict(id='adaline', expr={'happy': 0.7}, height=1.12, kid=True,
         macro=dict(gender=0.0, age=0.12, muscle=0.5, weight=0.5, height=0.5),
         targets={'head/head-round': 0.5, 'cheek/l-cheek-volume-incr': 0.4, 'cheek/r-cheek-volume-incr': 0.4, 'nose/nose-point-up': 0.3},
         pal=dict(skin='#f0cdb8', hair='#7a4e2c', eyes='#4a8fd8', lips='#d08080'),
         face=dict(brow=0.7), blush=0.7,
         hair=dict(style='long', to=4.9, hairline=7.9, bangs=True),
         outfit=outfit(top=gar('#f2c230', sleeve_t=0.3, hem=0.2, neck='crew'), socks=gar('#f6f1e4', from_t=0.8),
                       shoes=gar('#c8302c', from_t=0.92, thick=0.006),
                       skirt=gar('#f2c230', len=3.9, thick=0.015))),
    dict(id='stranger', expr={'menace': 1.0}, height=1.66, stranger_seat=True,
         macro=dict(gender=1.0, age=0.68, muscle=0.4, weight=0.45, height=0.45),
         targets={'head/head-triangular': 0.4, 'cheek/l-cheek-volume-decr': 0.5, 'cheek/r-cheek-volume-decr': 0.5, 'nose/nose-scale-vert-incr': 0.4,
                  'chin/chin-prominent-incr': 0.3, 'eyes/l-eye-bag-incr': 0.5, 'eyes/r-eye-bag-incr': 0.5},
         pal=dict(skin='#e2bba2', hair='#6a5646', eyes='#5a4030', lips='#a0706a'),
         face=dict(hollow=0.5),
         hair=dict(style='bald'),
         paint=[paint_brand('shoulder')],
         outfit=outfit(top=gar('#ece6d4', 'stripes', color2='#3f8a4c', sleeve_t=1.0, hem=0.5),
                       bottom=gar('#c7b083', belt='#6b4528'), shoes=gar('#4a3222', from_t=0.9, thick=0.006))),
    dict(id='rachel', expr={'warm': 1.0}, height=1.68,
         macro=dict(gender=0.0, age=0.45, muscle=0.5, weight=0.45, height=0.6),
         targets={'head/head-oval': 0.4, 'nose/nose-scale-horiz-decr': 0.3, 'mouth/mouth-cupidsbow-incr': 0.4},
         pal=dict(skin='#f0cbb4', hair='#e8c25c', eyes='#4c9c6a', lips='#c87a80'),
         face=dict(lip_full=0.5), blush=0.5,
         hair=dict(style='ponytail', len=0.28, hairline=7.98),
         outfit=outfit(top=gar('#f2ece2', sleeve_t=1.0, hem=1.0, neck='v'),
                       bottom=gar('#47658c', 'denim'), shoes=gar('#e8e2da', from_t=0.92, thick=0.006),
                       outer=gar('#e48ab0', 'knit', sleeve_t=1.0, hem=0.9, open=0.4, thick=0.008))),
    dict(id='marcus', expr={'warm': 0.8}, height=1.81,
         macro=dict(gender=1.0, age=0.5, muscle=0.62, weight=0.55, height=0.58, african=1.0, caucasian=0.0),
         targets={'head/head-rectangular': 0.3, 'nose/nose-flaring-incr': 0.3},
         pal=dict(skin='#7a5038', hair='#1a1410', eyes='#2a1a10', lips='#5a3428'),
         face=dict(stubble=0.8), blush=0.1,
         hair=dict(style='buzz', hairline=7.95),
         outfit=outfit(top=gar('#a8302c', 'plaid', color2='#2a2018', sleeve_t=0.62, hem=0.5, neck='collar', buttons='#e8dcc8'),
                       bottom=gar('#bfa77c', belt='#3a2a1e'), shoes=gar('#3a2a20', from_t=0.9, thick=0.007))),
    dict(id='denise', expr={'worried': 0.8}, height=1.64,
         macro=dict(gender=0.0, age=0.55, muscle=0.45, weight=0.5, height=0.5),
         targets={'head/head-round': 0.3, 'nose/nose-point-up': 0.3},
         pal=dict(skin='#f2d0bc', hair='#c4502a', eyes='#5a4030', lips='#c06a6a'),
         face=dict(freckles=True), blush=0.4,
         hair=dict(style='bob', to=6.35, hairline=7.95, bangs=True),
         outfit=outfit(top=gar('#2a8c8c', sleeve_t=1.0, hem=1.0), shoes=gar('#1a1a1a', from_t=0.93, thick=0.005),
                       outer=gar('#b89a6a', sleeve_t=1.0, hem=-0.2, open=0.25, collar=True, thick=0.012),
                       skirt=gar('#b89a6a', len=5.4, thick=0.018, open=0.25))),
    dict(id='dad2', expr={'warm': 0.7}, height=1.78,
         macro=dict(gender=1.0, age=0.52, muscle=0.5, weight=0.68, height=0.5),
         targets={'head/head-round': 0.3, 'neck/neck-double-incr': 0.4},
         pal=dict(skin='#e0b49a', hair='#4a3a2a', eyes='#5a4030', hat='#8a2a24'),
         face=dict(stubble=0.5),
         hair=dict(style='short', hairline=7.9), acc=['cap'],
         outfit=outfit(top=gar('#8a8c90', 'knit', sleeve_t=1.0, hem=0.6, neck='crew'),
                       bottom=gar('#3c4f6c', 'denim'), shoes=gar('#ececec', from_t=0.92, thick=0.008),
                       outer=gar('#8a8c90', 'knit', sleeve_t=1.02, hem=0.5, thick=0.008))),
    dict(id='mom2', expr={'worried': 0.6}, height=1.66,
         macro=dict(gender=0.0, age=0.52, muscle=0.5, weight=0.55, height=0.5, asian=0.4, caucasian=0.6),
         pal=dict(skin='#d9a888', hair='#2a1c14', eyes='#3a2a1a', lips='#b06a5a'),
         hair=dict(style='long', to=4.6),
         outfit=outfit(top=gar('#5e7a3a', sleeve_t=1.0, hem=1.0), bottom=gar('#2c3a52', 'denim'), shoes=gar('#5a3a2a', from_t=0.9, thick=0.006),
                       outer=gar('#3a3e4a', sleeve_t=1.0, hem=-0.4, open=0.3, collar=True, thick=0.012),
                       skirt=gar('#3a3e4a', len=2.1, open=0.3, thick=0.016))),
    dict(id='dad3', expr={'warm': 0.6, 'stern': 0.2}, height=1.72,
         macro=dict(gender=1.0, age=0.58, muscle=0.45, weight=0.6, height=0.45),
         pal=dict(skin='#e8c0a4', hair='#7a5a3a', eyes='#4a6aa0', beard='#6a4a2e'),
         face=dict(beard=1.0),
         hair=dict(style='short'), acc=['glasses'],
         outfit=outfit(top=gar('#26345a', sleeve_t=0.32, hem=0.5, neck='collar', buttons='#e8e8e8'),
                       bottom=gar('#9a8a70', belt='#3a2a1e'), shoes=gar('#3a3028', from_t=0.9, thick=0.006))),
    dict(id='amelia', expr={'happy': 0.9}, height=1.1, kid=True,
         macro=dict(gender=0.0, age=0.12, muscle=0.5, weight=0.5, african=1.0, caucasian=0.0),
         targets={'head/head-round': 0.5, 'cheek/l-cheek-volume-incr': 0.4, 'cheek/r-cheek-volume-incr': 0.4},
         pal=dict(skin='#b88462', hair='#2a1a14', eyes='#2a1a10', lips='#a05a50', hat='#d4b2ee'),
         blush=0.3, hair=dict(style='curly'), acc=['party'],
         outfit=outfit(top=gar('#8a4cc0', sleeve_t=0.3, hem=0.2), socks=gar('#f4f0f0', from_t=0.8), shoes=gar('#f0f0f0', from_t=0.92, thick=0.006),
                       skirt=gar('#8a4cc0', len=3.9, thick=0.015))),
    dict(id='kid_boy', expr={'happy': 0.8}, height=1.08, kid=True,
         macro=dict(gender=1.0, age=0.12, muscle=0.5, weight=0.5),
         targets={'head/head-round': 0.4},
         pal=dict(skin='#f0c8ae', hair='#9a6a3a', eyes='#4a6aa0'),
         blush=0.5, hair=dict(style='tuft', bangs=True),
         outfit=outfit(top=gar('#3a9a4a', sleeve_t=0.32, hem=0.4, print=dict(color='#2a6a32', y=3.4, w=0.5, h=0.5)),
                       bottom=gar('#c03030', leg_t=0.42), shoes=gar('#e8e8f0', from_t=0.92, thick=0.008))),
    dict(id='kid_girl', expr={'happy': 0.6}, height=1.05, kid=True,
         macro=dict(gender=0.0, age=0.11, muscle=0.5, weight=0.5),
         targets={'head/head-round': 0.4},
         pal=dict(skin='#f4d4c0', hair='#c89a50', eyes='#4a6aa0', lips='#d88080'),
         blush=0.6, hair=dict(style='pigtails', len=0.18, bangs=True),
         outfit=outfit(top=gar('#e88aa8', sleeve_t=0.3, hem=1.0), bottom=gar('#3a6ab0', 'denim', waist=4.6), shoes=gar('#d04040', from_t=0.92, thick=0.006))),
    dict(id='louis', expr={'feral': 1.0}, height=1.9, brute=True,
         macro=dict(gender=1.0, age=0.86, muscle=0.55, weight=0.55, height=0.65),
         targets={'head/head-age-incr': 0.6, 'head/head-rectangular': 0.4, 'nose/nose-hump-incr': 0.4, 'nose/nose-scale-vert-incr': 0.3,
                  'cheek/l-cheek-volume-decr': 0.4, 'cheek/r-cheek-volume-decr': 0.4, 'chin/chin-prominent-incr': 0.3, 'eyes/l-eye-bag-incr': 0.6, 'eyes/r-eye-bag-incr': 0.6},
         mods=[mod_brute_arm('L', 3.0)],
         pal=dict(skin='#b8a090', hair='#ecebe4', eyes='#ffffff', lips='#6a3a34', brows='#d8d6d0'),
         face=dict(hollow=0.7, brow=1.2), pallor=0.25, glow_eyes=True, white_eyes=True,
         hair=dict(style='patchy', hairline=8.05), acc=['glasses'],
         paint=[paint_brute, paint_burns, paint_dirt, paint_brand('hip')],
         outfit=outfit(top=gar('#b8ae94', sleeve_t=0.62, hem=0.5),
                       bottom=gar('#5e4c3a', leg_t=0.82, belt='#3a2a1e'),
                       outer=gar('#4e5f72', 'knit', sleeve_t=0.62, hem=0.4, open=0.45, thick=0.012, cut=brute_cut))),
    dict(id='across', expr={'feral': 1.0, 'scared': 0.2}, height=1.78,
         macro=dict(gender=0.6, age=0.55, muscle=0.0, weight=0.0, height=0.55),
         targets={'stomach/stomach-pregnant-decr': 1.0, 'cheek/l-cheek-volume-decr': 1.0, 'cheek/r-cheek-volume-decr': 1.0, 'head/head-age-incr': 0.8,
                  'eyes/l-eye-bag-incr': 0.7, 'eyes/r-eye-bag-incr': 0.7, 'chin/chin-prominent-incr': 0.4, 'torso/torso-scale-horiz-decr': 0.4},
         mods=[mod_ribs],
         pal=dict(skin='#d8d4c8', hair='#3a3028', eyes='#ffffff', lips='#6a5a58', brows='#5a5048'),
         face=dict(hollow=1.0, brow=0.6), pallor=0.6, white_eyes=True,
         hair=dict(style='patchy', hairline=8.0),
         paint=[paint_ribs_shadow, paint_brand('hip'), paint_dirt],
         outfit=outfit(bottom=gar('#55524c', leg_t=0.7, waist=1.0))),
]
NORAH_WORN = dict(next(c for c in CAST if c['id'] == 'norah'), id='norah_worn', paint=[paint_dirt], expr={'scared': 0.6, 'determined': 0.4})

# the people in the found photographs (assets/characters/photo/): the same faces, other clothes and hair
_B = {c['id']: c for c in CAST}
def _var(src, new_id, **kw):
    v = dict(_B[src]); v.update(kw); v['id'] = new_id; v['dir'] = 'photo'
    return v
LOUIS_MAN = dict(height=1.92, expr={'warm': 0.9}, macro=_B['louis']['macro'], targets=_B['louis']['targets'],
                 pal=dict(skin='#dcb49c', hair='#e8e6e0', eyes='#5a6a7a', lips='#a87068', brows='#d8d4cc'),
                 face=dict(stubble=0.6, brow=1.2), hair=dict(style='bald'), acc=['glasses'])
PHOTO = [
    dict(LOUIS_MAN, id='louis_human', dir='photo',
         outfit=outfit(top=gar('#ece6d4', sleeve_t=1.0, hem=0.5, neck='collar'), bottom=gar('#6a5a48', belt='#3a2a1e'), shoes=gar('#4a3426', from_t=0.9, thick=0.006),
                       outer=gar('#56708c', 'knit', sleeve_t=1.0, hem=0.4, open=0.4, thick=0.01))),
    dict(LOUIS_MAN, id='louis_work', dir='photo',
         outfit=outfit(top=gar('#7a3a2c', 'plaid', color2='#2a2018', sleeve_t=1.0, hem=0.5, neck='collar', buttons='#e8dcc8'),
                       bottom=gar('#3c4f6c', 'denim', belt='#3a2a1e'), shoes=gar('#4a3426', from_t=0.9, thick=0.006))),
    dict(id='rose', dir='photo', height=1.6, macro=dict(gender=0.0, age=0.82, muscle=0.4, weight=0.58, height=0.4),
         targets={'head/head-round': 0.3, 'head/head-age-incr': 0.4},
         pal=dict(skin='#ecc8b2', hair='#cfcbc4', eyes='#4c7a5a', lips='#b8706a'), hair=dict(style='bob', to=6.5, bangs=True), acc=['glasses'],
         outfit=outfit(top=gar('#f2ece0', sleeve_t=1.0, hem=1.0, neck='collar'), shoes=gar('#3a3030', from_t=0.93, thick=0.005),
                       outer=gar('#9a7ab0', 'knit', sleeve_t=1.0, hem=0.6, open=0.35, thick=0.009),
                       skirt=gar('#4a4660', len=5.0, thick=0.014))),
    _var('adaline', 'addie_overalls', hair=dict(style='pigtails', len=0.16, bangs=True),
         outfit=outfit(top=gar('#f4e4d8', sleeve_t=0.3, hem=1.0), bottom=gar('#4a6ea8', 'denim', waist=4.6), shoes=gar('#e8e8ec', from_t=0.92, thick=0.006))),
    _var('adaline', 'addie_party', acc=['party'], pal=dict(_B['adaline']['pal'], hat='#ffffff'),
         outfit=outfit(top=gar('#f088b0', sleeve_t=0.3, hem=0.2), socks=gar('#ffffff', from_t=0.8), shoes=gar('#c8302c', from_t=0.92, thick=0.006),
                       skirt=gar('#f088b0', len=3.9, thick=0.015))),
    _var('adaline', 'addie_swim', hair=dict(style='ponytail', len=0.22),
         outfit=outfit(top=gar('#3aa6a0', sleeve_t=0.0, hem=0.0, neck='crew'), bottom=gar('#3aa6a0', leg_t=0.06))),
    _var('adaline', 'addie_pjs', outfit=outfit(top=gar('#f0b6cc', sleeve_t=1.0, hem=0.5), bottom=gar('#e8a0bc', leg_t=0.95), shoes=gar('#f4f0f0', from_t=0.92, thick=0.008))),
    _var('norah', 'norah_ponytail', hair=dict(style='ponytail', len=0.26, hairline=7.98),
         outfit=outfit(top=gar('#e9e3d4', 'stripes', color2='#a8302c', sleeve_t=1.0, hem=0.5), bottom=gar('#2a2a33', 'denim', belt='#4a3022'),
                       shoes=gar('#5a3a24', from_t=0.84, thick=0.007))),
    _var('kenneth', 'kenneth_summer', outfit=outfit(top=gar('#d8d0b8', sleeve_t=0.32, hem=0.5, neck='collar', buttons='#f0ece0'),
                                                     bottom=gar('#a89470', leg_t=0.42, belt='#6b4528'), shoes=gar('#2a2420', from_t=0.92, thick=0.007))),
]

def anims_for(sp, ch):
    i = sp['id']; hy = float(ch['J']['hips'][1]); kid = sp.get('kid', False)
    if i in ('across', 'louis'):
        a = BC.across_anims()
        if i == 'louis': a.update(BC.louis_anims()); a.update(BC.louis_v9_anims())
        return a
    a = BC.human_anims(kid=kid)
    if i in ('norah', 'norah_worn') or sp.get('dir') == 'photo': a.update(BC.seat_anims(hy, kid)); a.update(BC.norah_anims(hy))
    if i in ('kenneth', 'adaline', 'stranger'): a.update(BC.seat_anims(hy, kid, i == 'stranger'))
    return a

# characters made in the Character Creator (tools/import_character.py keeps them here)
def custom_cast():
    p = os.path.join(ROOT, 'data', 'characters', 'custom.json')
    if not os.path.exists(p): return []
    return [dict(v, notes=None) for v in json.load(open(p)).values()]

def main(ids=None):
    manifest_p = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(manifest_p)) if os.path.exists(manifest_p) else {}
    for sp in CAST + [NORAH_WORN] + PHOTO + custom_cast():
        if ids and sp['id'] not in ids: continue
        ch0 = make_body(sp)                      # for the hip height
        anims = anims_for(sp, ch0)
        ch, tris = write(sp, anims)
        if sp.get('dir'):
            print('%-10s %6d tris (photo)' % (sp['id'], tris)); continue
        manifest[sp['id']] = {'height': sp['height'], 'tris': tris, 'animations': list(anims.keys()), 'pipeline': 'makehuman'}
        print('%-10s %6d tris  %d anims' % (sp['id'], tris, len(anims)))
        if sp['id'] == 'stranger':
            # the transformed Stranger: the same skin texture layout, grey, the lips black, a split grin painted wide
            sm = dict(sp, pal=dict(sp['pal'], skin='#a9a59c', lips='#2a1012'), pallor=0.5, paint=sp.get('paint', []) + [paint_grin])
            img, _ = paint_body(make_body(sm), sm)
            Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'stranger_morph.png'))
    json.dump(manifest, open(manifest_p, 'w'), indent=1)

if __name__ == '__main__':
    main(sys.argv[1:] or None)
