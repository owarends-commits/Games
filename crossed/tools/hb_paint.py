"""Painters for the human builder: skin and face, and clothes painted by body region.
Every function takes a hb_core.Sample (texels or vertices on the base body) and returns colours (n, 3) and/or masks.
Base-body landmarks (MakeHuman units, decimetres): eyes at (+-0.31, 7.28, 1.25), mouth centre ~(0, 6.72, 1.56),
nose tip ~(0, 7.0, 1.85), chin ~(0, 6.3), neck base ~5.9, shoulders 5.25, navel ~1.6, crotch ~0.0, knee -3.7, ankle -7.45."""
import numpy as np
from hb_core import smoothstep, noise2, fbm, hexc, J0

WAIST = 1.25            # top of trousers (base y)
NECK_BASE = 5.75

def lerp(a, b, t):
    t = np.asarray(t)[..., None] if np.ndim(t) else t
    return a + (b - a) * t

# =================================================================================================== skin + face
def skin(S, sp):
    p = sp['pal']; base = hexc(p['skin'])
    n = len(S.y)
    col = np.tile(base, (n, 1))
    # mottling and warmth: redder at the cheeks, nose, ears, knuckles, elbows, knees; cooler/sallow elsewhere
    mot = fbm(S.x * 3 + S.z, S.y * 3, seed=3, scale=1.6) - 0.5
    col *= (1 + mot[:, None] * 0.09)
    red = np.zeros(n)
    head = S.head()
    cheek = np.exp(-(((np.abs(S.x) - 0.48) / 0.22) ** 2 + ((S.y - 7.0) / 0.25) ** 2)) * (S.z > 0.9)
    nose = np.exp(-((S.x / 0.14) ** 2 + ((S.y - 7.02) / 0.22) ** 2)) * (S.z > 1.3)
    ears = smoothstep(0.85, 0.95, np.abs(S.x)) * (head > 0.5) * (S.y > 6.7) * (S.y < 7.6)
    red += cheek * sp.get('blush', 0.5) + nose * 0.45 + ears * 0.45
    for side in ('L', 'R'):
        red += S.hand(side) * 0.18
        red += np.exp(-((S.arm_t(side) - 0.5) / 0.06) ** 2) * S.arm(side) * 0.12          # elbows
        red += np.exp(-((S.leg_t(side) - 0.5) / 0.05) ** 2) * S.leg(side) * (S.z > 0) * 0.12   # knees
    col = lerp(col, col * np.array([1.08, 0.82, 0.78]), np.clip(red, 0, 1) * 0.6)
    # baked light: a little darker under the jaw, in the armpits, between the legs; lighter on top
    # living skin: shadows fall warm (blood under the skin), not grey; a little rose through everything
    if S.n is not None:
        sh = (0.9 + 0.12 * np.clip(S.n[:, 1], -1, 1))
        col = col * sh[:, None] + (1 - sh)[:, None] * np.array([0.05, -0.01, -0.03])
    col *= np.array([1.03, 0.995, 0.965])
    # under the eyes: a faint cool shadow; lips, nose tip, ears warmer still
    ueye = np.exp(-(((np.abs(S.x) - 0.31) / 0.16) ** 2 + ((S.y - 7.15) / 0.05) ** 2)) * (S.z > 0.9) * (head > 0.5)
    col = lerp(col, col * np.array([0.9, 0.84, 0.9]), np.clip(ueye * 0.5, 0, 1))
    under_jaw = smoothstep(6.45, 6.15, S.y) * smoothstep(5.85, 6.1, S.y) * (S.z > 0.2)
    col *= (1 - under_jaw * 0.18)[:, None]
    if sp.get('pallor'):
        g = col.mean(1, keepdims=True); col = lerp(col, g * np.array([0.98, 1.0, 0.98]), sp['pallor'])
    return np.clip(col, 0, 1)

def face(S, sp, col):
    """Brows, lids and lash lines, lips, stubble/beard, freckles, eye sockets. In place on col."""
    p = sp['pal']; f = sp.get('face', {})
    head = S.head() > 0.5
    front = head & (S.z > 0.6)
    hair = hexc(p.get('brows', p.get('hair', '#3a2a20')))
    x, y, z = S.x, S.y, S.z
    ax = np.abs(x)
    # eye sockets: a soft shadow around each eye, deeper for the old and the gaunt
    sock = np.exp(-(((ax - 0.31) / 0.2) ** 2 + ((y - 7.27) / 0.13) ** 2)) * front
    col *= (1 - sock[:, None] * (0.16 + 0.22 * f.get('hollow', 0.0)))
    # lash line: a dark arc along the top of each eye opening
    lash = np.exp(-(((ax - 0.31) / 0.16) ** 2)) * np.exp(-((y - (7.335 - 0.25 * (ax - 0.31) ** 2)) / 0.011) ** 2) * front * (z > 1.25)
    col = lerp(col, np.array([0.08, 0.06, 0.05]), np.clip(lash * f.get('lash', 0.3), 0, 1))
    # brows: an arch above each eye
    bt = f.get('brow', 1.0)
    by = 7.56 + 0.06 * np.cos((ax - 0.33) * 3.2) - 0.1 * (ax - 0.33) ** 2 * 4
    brow = np.exp(-(((ax - 0.33) / (0.2 + 0.02 * bt)) ** 6)) * np.exp(-((y - by) / (0.035 * bt)) ** 2) * front
    brow *= (0.6 + 0.4 * noise2(x * 40, y * 40, 5))
    col = lerp(col, hair * 0.75, np.clip(brow * 1.1, 0, 1))
    # lips
    lc = hexc(p.get('lips', '#c48078'))
    lw = 0.2 * f.get('lip_w', 1.0)
    upper = np.exp(-((x / lw) ** 4)) * smoothstep(6.715, 6.735, y) * smoothstep(6.8 + 0.015 * f.get('lip_full', 0), 6.765, y)
    upper *= (1 - 0.6 * np.exp(-((x / 0.05) ** 2)) * smoothstep(6.79, 6.81, y))           # cupid's bow notch
    lower = np.exp(-((x / (lw * 0.85)) ** 4)) * smoothstep(6.6 - 0.03 * f.get('lip_full', 0), 6.65, y) * smoothstep(6.715, 6.695, y)
    lips = np.clip((upper + lower) * (z > 1.35), 0, 1)
    col = lerp(col, lc * 1.05, lips * 0.75)
    col = lerp(col, col * np.array([1.06, 0.9, 0.9]), np.clip(np.exp(-((S.x / 0.3) ** 2 + ((S.y - 6.72) / 0.14) ** 2)) * (S.z > 1.2) * 0.4, 0, 1))      # the warmth round the mouth
    seam = np.exp(-(x / (lw * 1.05)) ** 4) * np.exp(-((y - 6.712) / 0.008) ** 2) * (z > 1.35)
    col *= (1 - seam[:, None] * 0.55)
    # nostrils
    nos = np.exp(-(((ax - 0.07) / 0.035) ** 2 + ((y - 6.93) / 0.03) ** 2)) * (z > 1.3)
    if S.n is not None: nos *= np.clip(-S.n[:, 1] * 2.0, 0, 1)          # only the undersides: the nostrils themselves
    col *= (1 - nos[:, None] * 0.5)
    # stubble / beard
    st = f.get('stubble', 0.0); bd = f.get('beard', 0.0)
    if st or bd:
        jaw = head & (y < 6.9) & (z > -0.1) & ~((y > 6.6) & (y < 6.86) & (ax < lw * 1.1) & (z > 1.3))
        beardzone = jaw & ((y < 6.6) | (ax > 0.25) | ((y > 6.8) & (y < 6.92) & (ax < 0.3)))
        beardzone &= (ax < 0.88) & (y > 5.95)
        hc = hexc(p.get('beard', p.get('hair', '#3a2a20')))
        grain = noise2(x * 150 + z * 40, y * 150, 9)
        # soft edges: thins out up the cheeks, toward the ears and down the neck
        edge = smoothstep(6.92, 6.7, y) * smoothstep(0.88, 0.62, ax) * smoothstep(6.0, 6.3, y)
        edge = np.maximum(edge, ((y > 6.78) & (y < 6.9) & (ax < 0.28)) * smoothstep(0.3, 0.18, ax))       # the moustache line
        amt = beardzone * edge * (st * (0.1 + 0.12 * grain) + bd * (0.7 + 0.25 * fbm(x * 8, y * 8, 2)))
        col = lerp(col, hc * 0.8, np.clip(amt, 0, 1))
    # freckles
    if f.get('freckles'):
        fr = (noise2(x * 70, y * 70, 4) > 0.86) & (np.abs(y - 7.08) < 0.18) & (ax < 0.5) & (ax > 0.06) & front
        col[fr] *= 0.93
    return col

# =================================================================================================== clothes
def masks(S, o):
    """Per-garment masks for an outfit (dict). Keys: shirt, pants, shoes, socks, outer, belt."""
    n = len(S.y); y = S.y
    head = S.head(); neck = S.neck()
    legs = S.leg('L') + S.leg('R'); arms = S.arm('L') + S.arm('R')
    torso = np.clip(1 - head - neck - legs - arms, 0, 1)
    out = {}
    jag = (fbm(S.x * 6 + S.z * 4, S.y * 2, 11) - 0.5) * 0.12 * o.get('ragged', 0.15)
    def sleeve(sl):
        m = np.zeros(n)
        for side in ('L', 'R'):
            t = S.arm_t(side)
            m = np.maximum(m, (S.arm(side) > 0.45) * (t < sl))
        return m
    def neckline(kind, top=NECK_BASE):
        cut = (y > top) | (neck > 0.55) | (head > 0.3)
        if kind in ('v', 'collar', 'open'):
            depth = {'v': 0.9, 'collar': 0.45, 'open': 1.6}[kind]
            vy = top - depth
            cut |= (S.z > 0.0) & (y > vy) & (np.abs(S.x) < (y - vy) * 0.45 + 0.02)
        return ~cut
    t = o.get('top')
    if t:
        hem = t.get('hem', 0.75)
        body = (torso > 0.35) & (y > hem + jag)
        m = (body | (sleeve(t.get('sleeve_t', 1.0)) > 0)) & neckline(t.get('neck', 'crew'))
        out['shirt'] = m.astype(float)
    b = o.get('bottom')
    if b:
        top_y = b.get('waist', WAIST)
        lm = np.zeros(n)
        for side in ('L', 'R'):
            lt = S.leg_t(side)
            lm = np.maximum(lm, (S.leg(side) > 0.4) * (lt < b.get('leg_t', 0.97) + jag * 0.3))
        m = ((torso + legs > 0.5) & (y < top_y)) & ((lm > 0) | (y > -0.6))
        out['pants'] = m.astype(float)
        out['belt'] = (((torso + legs) > 0.5) & (np.abs(y - (top_y - 0.07)) < 0.07) & bool(b.get('belt'))).astype(float)
    s = o.get('shoes')
    if s:
        m = np.zeros(n)
        for side in ('L', 'R'):
            m = np.maximum(m, (S.leg(side) > 0.4) * (S.leg_t(side) > s.get('from_t', 0.95)))
        out['shoes'] = m
    if o.get('socks'):
        m = np.zeros(n)
        for side in ('L', 'R'):
            m = np.maximum(m, (S.leg(side) > 0.4) * (S.leg_t(side) > o['socks'].get('from_t', 0.86)))
        out['socks'] = m
    c = o.get('outer')
    if c:
        hem = c.get('hem', 0.2)
        body = (torso > 0.3) & (y > hem)
        sl = sleeve(c.get('sleeve_t', 1.02))
        m = (body | (sl > 0)) & neckline('collar' if c.get('collar') else 'crew', NECK_BASE + c.get('collar_up', 0.15))
        if c.get('open'):
            m &= ~((S.z > 0.3) & (np.abs(S.x) < c['open']) & (torso > 0.3))
        if c.get('cut'):           # e.g. the Brute's arm bursting through: a region torn out of it
            m &= ~c['cut'](S)
        out['outer'] = m.astype(float)
    return out

def pattern(kind, S, c1, c2=None, seed=0):
    """Fabric colour at the sample points. Patterns are laid out on the base body, so they're continuous."""
    n = len(S.y); x, y, z = S.x, S.y, S.z
    ang = S.around()
    c1 = hexc(c1); c2 = hexc(c2) if c2 else c1 * 0.8
    col = np.tile(c1, (n, 1))
    if kind in ('denim', 'jeans'):
        weave = noise2(x * 30 + z * 30, y * 90, seed) * 0.12 + fbm(x * 3, y * 2, seed + 1) * 0.12
        col *= (0.9 + weave)[:, None]
        fade = np.zeros(n)
        for side in ('L', 'R'):
            fade += S.leg(side) * np.exp(-((S.leg_t(side) - 0.3) / 0.15) ** 2) * (z > 0.2)
        col = lerp(col, c1 * 1.35, np.clip(fade * 0.5, 0, 1))
        seam = np.exp(-((np.abs(ang) - np.pi / 2) / 0.04) ** 2) * (y < 1.2)
        col *= (1 - seam * 0.25)[:, None]
    elif kind == 'plaid':
        u = ang * 4.0 + x * 0.0; v = y * 3.2
        a = (np.sin(u * 3.0) > 0.55) | (np.sin(v * 3.0) > 0.55)
        b = (np.sin(u * 3.0 + 1.3) > 0.85) | (np.sin(v * 3.0 + 1.3) > 0.85)
        col[a] = col[a] * 0.6 + c2 * 0.4
        col[b] = c2 * 0.55 + 0.35
    elif kind == 'stripes':
        st = np.sin(y * 7.5) > 0.2
        col[st] = c2
    elif kind == 'knit':
        col *= (0.88 + 0.14 * (np.sin(ang * 60) > 0))[:, None] * (0.95 + 0.1 * noise2(x * 40, y * 40, seed))[:, None]
    elif kind == 'puffer':
        q = np.abs(np.sin(y * 4.4)) ** 0.5
        col *= (0.72 + 0.32 * q)[:, None]
    elif kind == 'flesh_rot':
        col = lerp(col, c2, np.clip(fbm(x * 4, y * 4, seed) * 1.2 - 0.3, 0, 1))
    else:   # cotton
        col *= (0.94 + 0.08 * noise2(x * 25, y * 25, seed))[:, None]
    # creases: soft darker folds
    folds = fbm(ang * 2.2, y * 1.6, seed + 7) - 0.5
    col *= (1 + folds * 0.16)[:, None]
    if S.n is not None:
        col *= (0.9 + 0.1 * np.clip(S.n[:, 1], -1, 1))[:, None]
    return np.clip(col, 0, 1)

def paint_garments(S, col, o, layer):
    """Paint the outfit onto `col` for the body texture ('body') or the shells' texture ('cloth')."""
    mk = masks(S, o)
    def put(key, gar):
        if key in mk and gar:
            m = mk[key] > 0.5
            if m.any():
                pc = pattern(gar.get('pattern', 'cotton'), Sub(S, m), gar['color'], gar.get('color2'), gar.get('seed', 0))
                col[m] = pc
    if layer == 'body':
        put('socks', o.get('socks')); put('pants', o.get('bottom')); put('shirt', o.get('top'))
        if 'belt' in mk and o.get('bottom', {}).get('belt'):
            m = mk['belt'] > 0.5
            col[m] = hexc(o['bottom']['belt']) * (0.9 + 0.1 * noise2(S.x[m] * 30, S.y[m] * 30, 2))[:, None]
        put('shoes', o.get('shoes'))
        if o.get('top', {}).get('buttons'):
            m = (mk.get('shirt', np.zeros(len(col))) > 0.5) & (np.abs(S.x) < 0.035) & (S.z > 0.3) & ((S.y * 4.5) % 1 < 0.12)
            col[m] = hexc(o['top']['buttons'])
        if o.get('top', {}).get('print'):
            pr = o['top']['print']; m = (mk.get('shirt', np.zeros(len(col))) > 0.5) & (S.z > 0.5) & (np.abs(S.x) < pr.get('w', 0.6)) & (np.abs(S.y - pr.get('y', 3.6)) < pr.get('h', 0.6))
            m &= noise2(S.x * 8, S.y * 8, 21) > 0.4
            col[m] = hexc(pr['color'])
    else:
        put('outer', o.get('outer'))
        put('shoes', o.get('shoes'))
    return col, mk

class Sub:
    """A Sample restricted to a mask (so patterns only compute where needed)."""
    def __init__(self, S, m):
        self.x, self.y, self.z = S.x[m], S.y[m], S.z[m]
        self.n = S.n[m] if S.n is not None else None
        self.w = S.w[m]; self.pb = S.pb[m]
        self._S = S; self._m = m
    def around(self, cx=0.0, cz=0.0): return np.arctan2(self.x - cx, self.z - cz)
    def leg(self, s): return self._S.leg(s)[self._m]
    def leg_t(self, s): return self._S.leg_t(s)[self._m]
    def arm(self, s): return self._S.arm(s)[self._m]
    def arm_t(self, s): return self._S.arm_t(s)[self._m]
    def head(self): return self._S.head()[self._m]
    def hand(self, s): return self._S.hand(s)[self._m]
