import re, math, os, json, zlib
import numpy as np
from PIL import Image, ImageDraw

W, H = 96, 112
SS = 8
K = W * SS / 240.0
import sys
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'portraits')
os.makedirs(OUT, exist_ok=True)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], dtype=float)

# ---------- path flattening ----------
def tokens(d):
    return re.findall(r'[MLCQZmlcqzAa]|-?\d*\.?\d+(?:e-?\d+)?', d)

def flatten(d):
    t = tokens(d); i = 0; polys = []; cur = []; x = y = 0; sx = sy = 0; cmd = None
    def num():
        nonlocal i; v = float(t[i]); i += 1; return v
    while i < len(t):
        if re.match(r'[A-Za-z]', t[i]): cmd = t[i]; i += 1
        if cmd in 'Zz':
            if cur: polys.append(cur); cur = []
            x, y = sx, sy; continue
        if cmd == 'M':
            if cur: polys.append(cur)
            x, y = num(), num(); sx, sy = x, y; cur = [(x, y)]; cmd = 'L'
        elif cmd == 'L':
            x, y = num(), num(); cur.append((x, y))
        elif cmd == 'l':
            x, y = x + num(), y + num(); cur.append((x, y))
        elif cmd == 'Q':
            x1, y1, x2, y2 = num(), num(), num(), num()
            for s in range(1, 13):
                u = s / 12; cur.append(((1-u)**2*x + 2*(1-u)*u*x1 + u*u*x2, (1-u)**2*y + 2*(1-u)*u*y1 + u*u*y2))
            x, y = x2, y2
        elif cmd == 'C':
            x1, y1, x2, y2, x3, y3 = [num() for _ in range(6)]
            for s in range(1, 17):
                u = s / 16
                cur.append(((1-u)**3*x + 3*(1-u)**2*u*x1 + 3*(1-u)*u*u*x2 + u**3*x3, (1-u)**3*y + 3*(1-u)**2*u*y1 + 3*(1-u)*u*u*y2 + u**3*y3))
            x, y = x3, y3
        else:
            raise ValueError(cmd)
    if cur: polys.append(cur)
    return polys

def ell(cx, cy, rx, ry):
    pts = ' '.join('%s %.2f %.2f' % ('M' if a == 0 else 'L', cx + rx * math.cos(a * math.pi / 18), cy + ry * math.sin(a * math.pi / 18)) for a in range(36))
    return pts + ' Z'

def fill_mask(d):
    im = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(im)
    for p in flatten(d):
        if len(p) >= 3: dr.polygon([(a * K, b * K) for a, b in p], fill=255)
    return np.array(im) > 127

def stroke_mask(d, w):
    im = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(im); r = w * K / 2
    for p in flatten(d):
        pts = [(a * K, b * K) for a, b in p]
        if len(pts) >= 2: dr.line(pts, fill=255, width=max(1, int(round(w * K))), joint='curve')
        for a, b in (pts[0], pts[-1]): dr.ellipse([a - r, b - r, a + r, b + r], fill=255)
    return np.array(im) > 127

# ---------- expressions ----------
EX = [
    dict(k='neutral', label='Neutral', bi=0, bo=0, open=1, sq=0, pu=1, c=dict(s=0, h=0), t=dict(s=0, h=7, w=0.75)),
    dict(k='happy', label='Happy', bi=-3, bo=-1, open=0.8, sq=0.55, pu=1, flush=1, c=dict(s=4, h=0, w=1.05), t=dict(s=3.5, h=12, w=1.05, teeth=1)),
    dict(k='scared', label='Scared', bi=-8, bo=2, open=1.4, sq=0, pu=0.5, sweat=1, c=dict(s=-3, h=4, w=0.7), t=dict(s=-3, h=13, w=0.75)),
    dict(k='scream', label='Screaming', bi=-10, bo=5, open=1.55, sq=0, pu=0.4, sweat=1, c=dict(s=-2, h=9, w=1.3, clench=1), t=dict(s=-2, h=28, w=1.1, teeth=1)),
    dict(k='cry', label='Crying', bi=-7, bo=3, open=0.5, sq=0.35, pu=1, tears=1, flush=1, c=dict(s=-5, h=0, w=0.9), t=dict(s=-5, h=12, w=0.95)),
    dict(k='brave', label='Brave', bi=6, bo=-2, open=0.78, sq=0.3, pu=0.9, c=dict(s=-1.5, h=0, w=0.9), t=dict(s=-1, h=9, w=0.9, teeth=1)),
]

def eye_paths(cx, cy, w, e):
    up = w * 0.58 * e['open']; lo = w * 0.4 * e['open'] - e['sq'] * w * 0.55
    lo = max(lo, -up * 0.5)
    white = 'M %f %f Q %f %f %f %f Q %f %f %f %f Z' % (cx - w, cy, cx, cy - 2 * up, cx + w, cy, cx, cy + 2 * lo, cx - w, cy)
    lid = 'M %f %f Q %f %f %f %f' % (cx - w - 1.5, cy + 1, cx, cy - 2 * up - 1.2, cx + w + 1, cy - 0.5)
    low = 'M %f %f Q %f %f %f %f' % (cx - w + 2, cy + 1, cx, cy + 2 * lo + 1.5, cx + w - 2, cy + 1)
    return white, lid, low, up

def brow_path(cx, cy, w, e, side):
    base = cy - w * 1.35 - (max(0, e['open'] - 1.2) * 10)
    ix, ox = cx + side * w * 0.45, cx - side * w * 1.2
    iy, oy = base + e['bi'], base + e['bo']
    return 'M %f %f Q %f %f %f %f' % (ox, oy, (ix + ox) / 2, min(iy, oy) - 3.5, ix, iy)

def mouth_paths(mx, my, w0, m):
    w = w0 * m.get('w', 1); s = m['s']; h = m['h']; r = {}
    if h <= 0:
        r['line'] = 'M %f %f Q %f %f %f %f' % (mx - w, my - s, mx, my + s, mx + w, my - s)
        r['under'] = 'M %f %f Q %f %f %f %f' % (mx - w * 0.5, my + 5, mx, my + 7, mx + w * 0.5, my + 5)
        return r
    top = my + s - h * 0.45; bot = my + s + h
    r['fill'] = 'M %f %f Q %f %f %f %f Q %f %f %f %f Z' % (mx - w, my - s, mx, top, mx + w, my - s, mx, bot, mx - w, my - s)
    if m.get('clench'):
        r['teeth'] = 'M %f %f L %f %f L %f %f L %f %f Z' % (mx - w - 3, my - 30, mx + w + 3, my - 30, mx + w + 3, my + 30, mx - w - 3, my + 30)
        r['gap'] = 'M %f %f L %f %f' % (mx - w + 2, my - s + h * 0.28, mx + w - 2, my - s + h * 0.28)
    else:
        if m.get('teeth'):
            r['teeth'] = 'M %f %f Q %f %f %f %f L %f %f Q %f %f %f %f Z' % (mx - w - 3, my - s - 6, mx, top - 6, mx + w + 3, my - s - 6, mx + w + 3, my - s + 3, mx, top + min(h * 0.45, 8), mx - w - 3, my - s + 3)
        if h > 9: r['tongue'] = ell(mx, bot - h * 0.15, w * 0.6, h * 0.28)
        r['under'] = 'M %f %f Q %f %f %f %f' % (mx - w * 0.5, bot + 3, mx, bot + 5.5, mx + w * 0.5, bot + 3)
    return r

def drop(x, y):
    return 'M %f %f C %f %f %f %f %f %f C %f %f %f %f %f %f Z' % (x, y - 9, x + 6, y, x + 5, y + 8, x, y + 8, x - 5, y + 8, x - 6, y, x, y - 9)


def bez(x0, y0, x1, y1, x2, y2, x3, y3):
    return 'M %f %f C %f %f %f %f %f %f' % (x0, y0, x1, y1, x2, y2, x3, y3)

def gen_hair(cname, which, rng):
    """Return list of (path, colorkey, width, clipname or None, kind) layers."""
    L = []
    cname = CH.get(cname, {}).get('hair_style', cname)
    def strands(n, fn, col, w, clip=None):
        L.append((' '.join(fn() for _ in range(n)), col, w, clip, 'stroke'))
    U = rng.uniform
    if cname == 'boy' and which == 'front':
        cap = 'M80 104 C76 72 98 52 122 52 C150 52 168 70 168 100 C160 86 146 78 126 78 C106 78 90 88 80 104 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def tuft():
            x0, y0 = U(86, 150), U(52, 62); ex, ey = x0 + U(-14, 18), U(74, 88)
            return bez(x0, y0, x0 + 4, y0 + 6, ex - 4, ey - 10, ex, ey)
        strands(80, tuft, 'hair', 3.0, 'hcap'); strands(30, tuft, 'hair_sh', 1.5, 'hcap'); strands(22, tuft, 'hair_hi', 1.4, 'hcap')
        def crown():
            x0, y0 = U(100, 140), U(50, 54)
            return bez(x0, y0, x0 + 3, y0 - 5, x0 + 6, y0 - 7, x0 + U(8, 12), y0 - U(3, 6))
        strands(10, crown, 'hair', 2.0)
    if cname == 'pigtails' and which == 'front':
        cap = 'M76 104 C72 70 96 48 124 48 C154 48 174 66 172 100 C164 82 146 72 124 72 C102 72 86 84 76 104 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def bang():
            x0, y0 = U(108, 132), U(48, 54); ex = U(88, 156); ey = 92 - (ex - 88) * 0.1 + U(-6, 4)
            return bez(x0, y0, x0 + (ex - x0) * 0.3, y0 + 4, ex - (ex - x0) * 0.1, ey - 16, ex, ey)
        strands(56, bang, 'hair', 3.0); strands(22, bang, 'hair_sh', 1.5); strands(16, bang, 'hair_hi', 1.4)
    if cname == 'pigtails' and which == 'back':
        for cx, side in ((70, -1), (178, 1)):
            def tail(cx=cx, side=side):
                x0, y0 = cx + U(-4, 4), U(96, 106); ex, ey = cx + side * U(4, 16), U(150, 176)
                return bez(x0, y0, x0 + side * 12, y0 + 16, ex - side * 2, ey - 26, ex, ey)
            strands(34, tail, 'hair', 3.0); strands(12, tail, 'hair_sh', 1.5); strands(8, tail, 'hair_hi', 1.3)
        L.append((ell(74, 98, 7, 6) + ' ' + ell(174, 98, 7, 6), 'tie', 0, None, 'fill'))
    if cname == 'longswept' and which == 'back':
        def back():
            a = U(math.pi * 0.95, math.pi * 2.05); sx, sy = 124 + 50 * math.cos(a), 100 + 54 * math.sin(a)
            if sy > 108: sy = 108
            side = -1 if sx < 124 else 1
            ex = sx + side * U(4, 18); ey = U(200, 240)
            return bez(sx, sy, sx + side * U(10, 18), sy + 60, ex - side * U(2, 10), ey - 70, ex, ey)
        L.append(('M78 108 C72 70 96 44 124 44 C156 44 178 66 176 110 C174 92 168 80 158 74 C144 64 104 64 90 74 C82 82 79 94 78 108 Z', 'hair_sh', 0, None, 'fill'))
        strands(100, back, 'hair', 3.2); strands(44, back, 'hair_sh', 1.6); strands(24, back, 'hair_hi', 1.4)
    if cname == 'longswept' and which == 'front':
        cname = 'rachel'
    if cname == 'kenneth' and which == 'front':
        cap = 'M82 98 C78 70 96 48 122 46 C150 44 170 62 168 96 C162 84 154 76 144 73 C130 70 114 71 104 74 C96 78 90 84 86 92 Z M158 76 C166 84 169 96 167 108 C163 100 159 92 155 86 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def right():
            x0, y0 = U(94, 108), U(46, 58); ex, ey = U(138, 170), U(70, 104)
            return bez(x0, y0, x0 + 16, y0 - 9, ex - 10, ey - 26, ex, ey)
        def left():
            x0, y0 = U(94, 106), U(47, 60); ex, ey = U(82, 92), U(84, 98)
            return bez(x0, y0, x0 - 8, y0 - 5, ex + 2, ey - 18, ex, ey)
        strands(70, right, 'hair', 3.0, 'hcap'); strands(26, left, 'hair', 3.0, 'hcap')
        strands(34, right, 'hair_sh', 1.5, 'hcap'); strands(12, left, 'hair_sh', 1.5, 'hcap')
        def hi():
            x0, y0 = U(96, 112), U(46, 54); ex, ey = U(122, 150), U(52, 66)
            return bez(x0, y0, x0 + 10, y0 - 6, ex - 8, ey - 10, ex, ey)
        strands(22, hi, 'hair_hi', 1.5, 'hcap')
        def fringe():
            x0 = U(98, 160); y0 = 72 + (x0 - 98) * 0.05 + U(-2, 2)
            return bez(x0, y0, x0 + 2, y0 + 2, x0 + 3, y0 + 4, x0 + U(2, 5), y0 + U(4, 7))
        strands(16, fringe, 'hair', 1.6, 'face')
        def fly():
            x0 = U(104, 150); y0 = U(44, 48)
            return bez(x0, y0, x0 + 4, y0 - 4, x0 + 9, y0 - 5, x0 + U(10, 14), y0 - U(2, 4))
        pass
    if cname == 'adaline' and which == 'back':
        def back():
            a = U(math.pi * 0.95, math.pi * 2.05); sx, sy = 124 + 52 * math.cos(a), 104 + 56 * math.sin(a)
            if sy > 110: sy = 110
            side = -1 if sx < 124 else 1
            ex = sx + side * U(6, 22); ey = U(214, 254)
            return bez(sx, sy, sx + side * U(10, 18), sy + 60, ex - side * U(2, 10), ey - 70, ex, ey)
        L.append(('M76 108 C70 70 94 42 124 42 C156 42 180 66 178 110 C176 92 170 80 160 74 C146 64 104 64 88 74 C80 82 77 94 76 108 Z', 'hair_sh', 0, None, 'fill'))
        strands(110, back, 'hair', 3.2); strands(50, back, 'hair_sh', 1.6); strands(28, back, 'hair_hi', 1.4)
    if cname == 'adaline' and which == 'front':
        cap = 'M76 104 C72 70 96 46 124 46 C154 46 174 66 172 100 C164 82 146 72 124 72 C102 72 86 84 76 104 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def bang():
            x0, y0 = U(108, 132), U(46, 52); ex = U(84, 158); ey = 97 - (ex - 84) * 0.12 + U(-8, 4)
            return bez(x0, y0, x0 + (ex - x0) * 0.3, y0 + 4, ex - (ex - x0) * 0.1, ey - 18, ex, ey)
        strands(60, bang, 'hair', 3.0); strands(24, bang, 'hair_sh', 1.5)
        def bhi():
            x0, y0 = U(108, 130), U(46, 50); ex, ey = U(88, 140), U(60, 72)
            return bez(x0, y0, x0 - 4, y0 + 4, ex + 4, ey - 6, ex, ey)
        strands(18, bhi, 'hair_hi', 1.5)
        def lockR():
            x0, y0 = U(156, 168), U(78, 92); ex, ey = U(160, 172), U(148, 182)
            return bez(x0, y0, x0 + 8, y0 + 20, ex + 4, ey - 30, ex, ey)
        strands(26, lockR, 'hair', 2.8); strands(10, lockR, 'hair_sh', 1.4); strands(6, lockR, 'hair_hi', 1.3)
        def lockL():
            x0, y0 = U(80, 88), U(92, 102); ex, ey = U(74, 84), U(150, 196)
            return bez(x0, y0, x0 - 6, y0 + 22, ex - 2, ey - 30, ex, ey)
        strands(16, lockL, 'hair', 2.6); strands(6, lockL, 'hair_sh', 1.3)
    if cname == 'stranger' and which == 'front':
        def sideR():
            x0, y0 = U(158, 170), U(78, 94); ex, ey = x0 + U(3, 8), y0 + U(18, 30)
            return bez(x0, y0, x0 + 4, y0 + 6, ex, ey - 8, ex, ey)
        def sideL():
            x0, y0 = U(84, 90), U(90, 100); ex, ey = x0 - U(2, 5), y0 + U(14, 24)
            return bez(x0, y0, x0 - 2, y0 + 6, ex, ey - 6, ex, ey)
        strands(24, sideR, 'hair', 2.4, 'face'); strands(10, sideR, 'hair_sh', 1.4, 'face'); strands(8, sideR, 'hair_hi', 1.2, 'face')
        strands(12, sideL, 'hair', 2.2, 'face'); strands(5, sideL, 'hair_sh', 1.3, 'face')
        def wisp():
            x0, y0 = U(98, 134), U(64, 72)
            return bez(x0, y0, x0 + 8, y0 - 3, x0 + 16, y0 - 2, x0 + U(20, 28), y0 + U(0, 3))
        strands(7, wisp, 'hair_sh', 1.0, 'face')
    if cname == 'rachel' and which == 'front':
        cap = 'M80 100 C76 70 98 48 124 48 C152 48 170 66 168 98 C160 82 146 74 126 74 C106 74 90 84 80 100 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def back():
            x0, y0 = U(84, 150), U(50, 60); ex, ey = U(150, 166), U(70, 84)
            return bez(x0, y0, x0 + 10, y0 - 8, ex - 8, ey - 12, ex, ey)
        strands(70, back, 'hair', 3.0); strands(26, back, 'hair_sh', 1.5); strands(22, back, 'hair_hi', 1.5)
        def edge():
            x0 = U(84, 156); y0 = 76 + (x0 - 84) * -0.02 + U(-2, 2)
            return bez(x0, y0, x0 + 3, y0 - 3, x0 + 8, y0 - 4, x0 + 12, y0 - 2)
        strands(18, edge, 'hair', 1.6)
    if cname == 'rachel' and which == 'back':
        def pony():
            x0, y0 = U(160, 170), U(70, 80); ex, ey = U(168, 184), U(150, 196)
            return bez(x0, y0, x0 + 14, y0 + 20, ex + 6, ey - 40, ex, ey)
        strands(40, pony, 'hair', 2.8); strands(14, pony, 'hair_sh', 1.4); strands(10, pony, 'hair_hi', 1.3)
    if cname == 'marcus' and which == 'front':
        cap = 'M82 98 C78 70 96 46 122 44 C150 42 170 60 170 96 C164 82 154 74 140 72 C120 69 100 72 90 82 C86 88 84 92 82 98 Z'
        L.append((cap, 'hair', 0, None, 'fill'))
        def coil():
            x0, y0 = U(84, 166), U(44, 92)
            return bez(x0, y0, x0 + 1.5, y0 - 1.5, x0 + 3, y0, x0 + 2, y0 + 2)
        strands(260, coil, 'hair_sh', 1.4, 'hcap'); strands(90, coil, 'hair_hi', 1.2, 'hcap')
    if cname == 'denise' and which == 'front':
        cap = 'M78 104 C72 68 98 44 126 44 C156 44 176 66 172 104 C166 86 150 76 128 76 C106 76 88 86 78 104 Z'
        L.append((cap, 'hair_sh', 0, None, 'fill'))
        def bob():
            x0, y0 = U(100, 140), U(44, 52); side = 1 if rng.random() < 0.6 else -1
            ex = (U(160, 176) if side > 0 else U(74, 86)); ey = U(158, 172)
            return bez(x0, y0, x0 + side * 30, y0 + 2, ex + side * 4, ey - 70, ex, ey)
        strands(110, bob, 'hair', 3.0); strands(40, bob, 'hair_sh', 1.5); strands(28, bob, 'hair_hi', 1.4)
        def fringe():
            x0, y0 = U(110, 140), U(48, 54); ex = U(88, 130); ey = U(80, 92)
            return bez(x0, y0, x0 - 6, y0 + 8, ex + 4, ey - 12, ex, ey)
        strands(26, fringe, 'hair', 2.6); strands(8, fringe, 'hair_sh', 1.3)
    return L

# ---------- characters ----------
OUTL = '#1c1310'
CH = {}
CH['kenneth'] = dict(
    name='Kenneth Martin',
    pal=dict(skin_hi='#efcdb4', skin='#d6ad92', skin_sh='#ad7f68', skin_dp='#7c5546', hair_hi='#7a5636', hair='#4e3420', hair_sh='#2c1d12',
             cl_hi='#3a3c44', cl='#222328', cl_sh='#121316', iris='#4f86bf', lip='#b07c70', stub='#c09a84'),
    layers=lambda: [
        ('fill', 'M110 186 L106 222 C122 230 146 228 156 220 L150 172 Z', 'skin_sh'),
        ('fill', 'M108 194 C122 204 142 202 152 190 L152 206 C142 214 120 214 108 206 Z', 'skin_dp'),
        ('fill', 'M20 280 C26 238 60 216 104 210 L154 206 C192 214 220 238 226 280 Z', 'cl'),
        ('fill', 'M150 210 C190 218 214 240 222 280 L170 280 C170 250 162 226 150 210 Z', 'cl_sh'),
        ('stroke', 'M34 246 C80 236 150 234 214 246 M26 266 C80 256 160 256 220 266', 'cl_sh', 3),
        ('stroke', 'M44 240 C90 230 150 228 200 238', 'cl_hi', 2),
        ('fill', 'M98 216 L104 196 L154 192 L164 212 C142 224 118 224 98 216 Z', 'cl'),
        ('stroke', 'M128 196 L128 222', 'cl_hi', 2),
        ('fill', 'M160 106 C172 102 176 122 170 134 C166 140 162 140 160 136 Z', 'skin_sh'),
        ('face', 'M118 50 C146 48 166 66 168 98 C170 122 166 140 162 152 C158 168 150 182 138 192 C128 199 116 200 106 194 C96 188 90 178 88 168 C86 160 84 152 82 146 C78 140 80 132 82 126 C80 116 80 104 82 92 C86 66 98 52 118 50 Z'),
        ('fill', 'M150 76 C164 98 166 138 156 164 C148 182 138 192 126 196 C138 180 147 160 149 136 C150 116 151 96 150 76 Z', 'skin_sh'),
        ('fill', 'M126 140 C136 147 148 151 160 150 C152 160 138 162 126 154 Z', 'skin_sh'),
        ('fill', ell(114, 78, 22, 9), 'skin_hi'),
        ('fill', ell(98, 138, 7, 5), 'skin_hi'),
        ('fill', 'M118 112 C118 128 122 140 126 150 C122 153 115 153 111 150 C115 140 117 128 118 112 Z', 'skin_sh'),
        ('stroke', 'M116 114 C115 126 113 138 110 148', 'skin_hi', 2),
        ('stubble', None),
        ('hair', 'front'),
    ],
    eyes=((101, 116, 9), (136, 116, 12)), nose='M118 112 C118 128 122 140 126 150 C120 155 112 154 108 150', mouth=(116, 170, 14),
    stubble_area=(96, 160, 156, 194), brow_w=3.2,
)
CH['adaline'] = dict(
    name='Adaline Martin',
    pal=dict(skin_hi='#f7dcc8', skin='#ebc2a8', skin_sh='#c99880', skin_dp='#9a6c5a', hair_hi='#9a6a3c', hair='#64401f', hair_sh='#3a2410',
             cl_hi='#f0cc5c', cl='#d9a830', cl_sh='#a87c1c', iris='#4f86bf', lip='#cf8a82', white2='#f4ecdc'),
    layers=lambda: [
        ('hair', 'back'),
        ('fill', 'M40 280 C46 246 76 228 106 222 L146 220 C176 228 200 248 206 280 Z', 'cl'),
        ('fill', 'M146 222 C176 230 198 250 204 280 L166 280 C166 254 158 236 146 222 Z', 'cl_sh'),
        ('stroke', 'M60 250 C90 242 150 240 190 250', 'cl_hi', 2),
        ('fill', 'M110 176 L108 216 C120 222 138 220 146 214 L144 168 Z', 'skin_sh'),
        ('fill', 'M98 224 C114 238 140 238 152 222 C142 230 112 232 98 224 Z', 'white2'),
        ('face', 'M118 56 C150 54 170 76 170 108 C170 140 160 164 142 178 C130 188 112 190 100 182 C88 174 82 160 80 150 C76 144 76 136 78 130 C74 118 74 102 78 90 C84 68 100 56 118 56 Z'),
        ('fill', 'M156 86 C168 106 168 140 158 160 C150 176 138 184 126 188 C140 172 150 152 152 128 C153 112 155 98 156 86 Z', 'skin_sh'),
        ('fill', ell(112, 84, 20, 8), 'skin_hi'),
        ('fill', ell(96, 142, 9, 6), 'skin_hi'),
        ('fill', 'M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146 Z', 'skin_sh'),
        ('blush', None),
        ('hair', 'front'),
        
    ],
    eyes=((99, 120, 12), (135, 120, 15)), nose='M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146', mouth=(116, 160, 11),
    brow_w=2.6, base_blush=True,
)
CH['stranger'] = dict(
    name='The Stranger',
    pal=dict(skin_hi='#f3d8c4', skin='#dcb6a0', skin_sh='#b88c78', skin_dp='#8a6252', hair_hi='#8a6a4a', hair='#5e442c', hair_sh='#3a2818',
             cl_hi='#ece8da', cl='#d4cfbf', cl_sh='#a8a292', st='#3f6a46', st_sh='#2a4a30', iris='#6a5640', lip='#a8706a'),
    layers=lambda: [
        ('fill', 'M6 280 C12 232 52 210 96 204 L160 202 C200 210 230 234 236 280 Z', 'cl', 'body'),
        ('fill', 'M160 204 C200 212 228 236 234 280 L180 280 C180 250 172 222 160 204 Z', 'cl_sh', None, 'body'),
        ('fill', 'M0 240 C80 228 160 228 240 240 L240 254 C160 242 80 242 0 254 Z M0 262 C80 250 160 250 240 262 L240 276 C160 264 80 264 0 276 Z', 'st', None, 'body'),
        ('fill', 'M170 240 L240 240 L240 280 L176 280 Z', 'st_sh', None, 'stripes'),
        ('fill', 'M92 208 C96 188 158 186 162 204 C150 216 104 216 92 208 Z', 'cl_hi'),
        ('stroke', 'M104 194 L104 212 M116 191 L116 214 M128 190 L128 214 M140 191 L140 213 M152 194 L152 210', 'cl_sh', 1.6),
        ('fill', 'M170 106 C182 102 186 124 178 134 C174 140 170 138 168 134 Z', 'skin_sh'),
        ('face', 'M120 58 C152 56 174 78 176 108 C178 136 176 156 168 170 C160 186 146 198 128 202 C112 205 98 198 92 188 C86 180 84 170 82 162 C76 156 76 146 80 140 C76 124 76 104 82 88 C90 70 102 60 120 58 Z'),
        ('fill', 'M98 192 C110 206 140 206 158 190 C152 204 138 212 120 212 C108 210 100 204 98 192 Z', 'skin_sh'),
        ('fill', 'M150 132 C162 152 162 176 152 190 C146 196 138 200 128 202 C142 186 148 164 150 132 Z', 'skin_sh'),
        ('fill', 'M156 80 C168 96 172 116 170 132 C164 116 160 100 156 80 Z', 'skin_sh'),
        ('fill', ell(112, 74, 16, 6), 'skin_hi'),
        ('fill', ell(98, 146, 9, 7), 'skin_hi'),
        ('fill', 'M120 114 C120 130 126 140 130 148 C124 154 112 154 106 148 C112 144 118 140 118 130 Z', 'skin_sh'),
        ('fill', ell(112, 144, 4, 3), 'skin_hi'),
        ('hair', 'front'),
    ],
    eyes=((100, 120, 9), (136, 120, 11)), nose='M120 114 C120 130 126 140 130 148 C124 154 112 154 106 148', mouth=(114, 172, 14),
    brow_w=3.4,
)

CH['rachel'] = dict(
    name='Rachel',
    pal=dict(skin_hi='#f6dcc8', skin='#ebc4ab', skin_sh='#c99880', skin_dp='#9a6c5a', hair_hi='#e8cc8a', hair='#c8a05a', hair_sh='#8a6a34',
             cl_hi='#f6b8cc', cl='#e08aa8', cl_sh='#b06280', iris='#4a7a4a', lip='#c47a78', white2='#f4ecdc'),
    layers=lambda: [
        ('hair', 'back'),
        ('fill', 'M28 280 C34 240 66 220 104 214 L150 212 C186 220 210 240 216 280 Z', 'cl'),
        ('fill', 'M150 214 C184 222 206 242 212 280 L168 280 C168 254 160 230 150 214 Z', 'cl_sh'),
        ('fill', 'M110 172 L106 216 C118 222 138 220 146 214 L144 166 Z', 'skin_sh'),
        ('fill', 'M108 214 L128 252 L148 212 Z', 'white2'),
        ('stroke', 'M108 214 L128 252 M148 212 L128 252', 'cl_sh', 2.5),
        ('face', 'M118 54 C148 52 166 74 166 106 C166 138 156 162 140 178 C130 188 112 190 102 184 C90 176 84 162 82 152 C78 146 78 138 80 132 C77 120 77 104 80 92 C86 70 100 56 118 54 Z'),
        ('fill', 'M152 84 C164 104 166 138 156 160 C148 176 136 184 124 188 C138 172 148 150 150 126 C151 110 152 96 152 84 Z', 'skin_sh'),
        ('fill', ell(112, 82, 18, 7), 'skin_hi'), ('fill', ell(97, 138, 8, 5), 'skin_hi'),
        ('fill', 'M118 118 C118 132 121 140 124 146 C120 149 114 149 110 146 C114 140 117 130 118 118 Z', 'skin_sh'),
        ('hair', 'front'),
        ('fill', ell(166, 132, 2.5, 2.5), 'hair_hi'),
    ],
    eyes=((101, 118, 10), (136, 118, 13)), nose='M118 118 C118 132 121 140 124 146 C119 150 112 149 108 146', mouth=(116, 164, 12), brow_w=2.8,
)
CH['marcus'] = dict(
    name='Marcus',
    pal=dict(skin_hi='#b08268', skin='#8e624c', skin_sh='#6c4636', skin_dp='#4a2e22', hair_hi='#3a3634', hair='#1c1a1a', hair_sh='#0c0b0b',
             cl_hi='#b84a44', cl='#8a2a2a', cl_sh='#5a1a1a', iris='#3a2a1e', lip='#7a4a40', stub='#2a1e18', pl='#1e1414'),
    layers=lambda: [
        ('fill', 'M110 184 L106 220 C120 228 146 226 156 218 L150 170 Z', 'skin_sh'),
        ('fill', 'M16 280 C24 234 62 212 102 206 L156 204 C196 212 222 236 228 280 Z', 'cl', 'body'),
        ('fill', 'M156 206 C194 214 220 238 226 280 L176 280 C176 250 168 222 156 206 Z', 'cl_sh', None, 'body'),
        ('fill', 'M0 236 L240 236 L240 240 L0 240 Z M0 260 L240 260 L240 264 L0 264 Z M60 200 L64 200 L64 280 L60 280 Z M120 200 L124 200 L124 280 L120 280 Z M180 200 L184 200 L184 280 L180 280 Z', 'pl', None, 'body'),
        ('fill', 'M98 212 L106 194 L152 190 L162 210 L130 232 Z', 'cl_hi'),
        ('fill', 'M160 104 C172 100 176 120 170 132 C166 138 162 138 160 134 Z', 'skin_sh'),
        ('face', 'M118 50 C148 48 168 68 170 100 C172 126 168 144 162 158 C156 174 146 186 132 194 C122 199 110 198 102 192 C92 184 86 172 84 160 C80 152 80 142 82 134 C78 120 78 102 82 90 C88 66 100 52 118 50 Z'),
        ('fill', 'M152 76 C166 98 168 138 158 164 C150 182 140 192 128 196 C140 180 148 160 150 136 C151 116 152 96 152 76 Z', 'skin_sh'),
        ('fill', ell(114, 78, 20, 8), 'skin_hi'), ('fill', ell(98, 136, 7, 5), 'skin_hi'),
        ('fill', 'M118 112 C118 128 122 140 128 148 C122 153 112 153 106 149 C112 140 116 128 118 112 Z', 'skin_sh'),
        ('stubble', None),
        ('hair', 'front'),
    ],
    eyes=((101, 116, 10), (137, 116, 12)), nose='M118 112 C118 128 122 140 128 148 C120 154 110 153 104 149', mouth=(116, 170, 14),
    stubble_area=(92, 150, 162, 198), brow_w=3.4,
)
CH['denise'] = dict(
    name='Denise',
    pal=dict(skin_hi='#f2d2bc', skin='#dfb49a', skin_sh='#bb8c74', skin_dp='#8a6050', hair_hi='#c8643a', hair='#943e20', hair_sh='#5a2210',
             cl_hi='#5ac0c0', cl='#2f8a8a', cl_sh='#1e5a5a', iris='#5a4632', lip='#b8606a', gold='#e0b040'),
    layers=lambda: [
        ('fill', 'M30 280 C36 242 68 222 106 216 L148 214 C184 222 208 242 214 280 Z', 'cl'),
        ('fill', 'M148 216 C182 224 204 244 210 280 L166 280 C166 254 158 232 148 216 Z', 'cl_sh'),
        ('fill', 'M110 174 L106 218 C118 224 138 222 146 216 L144 168 Z', 'skin_sh'),
        ('fill', 'M104 216 C116 230 136 230 148 214 C138 222 114 224 104 216 Z', 'cl_hi'),
        ('face', 'M118 54 C148 52 166 74 166 106 C166 138 156 162 140 178 C130 188 112 190 102 184 C90 176 84 162 82 152 C78 146 78 138 80 132 C77 120 77 104 80 92 C86 70 100 56 118 54 Z'),
        ('fill', 'M152 84 C164 104 166 138 156 160 C148 176 136 184 124 188 C138 172 148 150 150 126 C151 110 152 96 152 84 Z', 'skin_sh'),
        ('fill', ell(112, 82, 18, 7), 'skin_hi'), ('fill', ell(97, 138, 8, 5), 'skin_hi'),
        ('fill', 'M118 118 C118 132 121 140 124 146 C120 149 114 149 110 146 C114 140 117 130 118 118 Z', 'skin_sh'),
        ('hair', 'front'),
        ('fill', ell(168, 140, 3, 3), 'gold'),
    ],
    eyes=((101, 118, 10), (136, 118, 13)), nose='M118 118 C118 132 121 140 124 146 C119 150 112 149 108 146', mouth=(116, 164, 12), brow_w=2.8,
)
# ---- crowd parents and kids (unnamed in the prologue; name plates read "Stranger") ----
CH['dad2'] = dict(
    name='Stranger (dad in the grey hoodie)', hair_style='kenneth',
    pal=dict(skin_hi='#f0c8ac', skin='#d8a888', skin_sh='#b07e66', skin_dp='#7e5444', hair_hi='#7a6046', hair='#54402c', hair_sh='#2e2218',
             cl_hi='#a8aaae', cl='#86888c', cl_sh='#5e6064', iris='#5a4632', lip='#b07a6c', stub='#b89078', str_='#eeeeee'),
    layers=lambda: [
        ('fill', 'M110 186 L106 222 C122 230 146 228 156 220 L150 172 Z', 'skin_sh'),
        ('fill', 'M18 280 C24 236 62 214 104 208 L154 206 C194 214 222 238 228 280 Z', 'cl'),
        ('fill', 'M154 208 C192 216 220 240 226 280 L174 280 C174 250 166 224 154 208 Z', 'cl_sh'),
        ('fill', 'M84 214 C96 196 112 190 124 196 C110 204 100 214 96 230 Z M168 214 C158 196 144 190 132 196 C146 204 154 214 158 230 Z', 'cl_sh'),
        ('stroke', 'M114 214 L110 250 M140 214 L144 250', 'str_', 2.2),
        ('fill', 'M70 262 L180 262 L176 280 L74 280 Z', 'cl_sh'),
        ('fill', 'M160 106 C172 102 176 122 170 134 C166 140 162 140 160 136 Z', 'skin_sh'),
        ('face', 'M118 50 C146 48 166 66 168 98 C170 122 166 140 162 152 C158 168 150 182 138 192 C128 199 116 200 106 194 C96 188 90 178 88 168 C86 160 84 152 82 146 C78 140 80 132 82 126 C80 116 80 104 82 92 C86 66 98 52 118 50 Z'),
        ('fill', 'M150 76 C164 98 166 138 156 164 C148 182 138 192 126 196 C138 180 147 160 149 136 C150 116 151 96 150 76 Z', 'skin_sh'),
        ('fill', ell(114, 78, 22, 9), 'skin_hi'), ('fill', ell(98, 138, 7, 5), 'skin_hi'),
        ('fill', 'M118 112 C118 128 122 140 126 150 C122 153 115 153 111 150 C115 140 117 128 118 112 Z', 'skin_sh'),
        ('stubble', None),
        ('hair', 'front'),
    ],
    eyes=((101, 116, 10), (136, 116, 12)), nose='M118 112 C118 128 122 140 126 150 C120 155 112 154 108 150', mouth=(116, 170, 14),
    stubble_area=(96, 162, 156, 194), brow_w=3.2,
)
CH['mom2'] = dict(
    name='Stranger (mom in the green sweater)', hair_style='longswept',
    pal=dict(skin_hi='#e8c0a0', skin='#cf9e7e', skin_sh='#a87458', skin_dp='#784c3a', hair_hi='#4a362a', hair='#2a1c14', hair_sh='#140c08',
             cl_hi='#7c9a50', cl='#5e7a3a', cl_sh='#3e5626', iris='#4a3020', lip='#a85c50', gold='#d8b048'),
    layers=lambda: [
        ('hair', 'back'),
        ('fill', 'M28 280 C34 240 66 220 104 214 L150 212 C186 220 210 240 216 280 Z', 'cl'),
        ('fill', 'M150 214 C184 222 206 242 212 280 L168 280 C168 254 160 230 150 214 Z', 'cl_sh'),
        ('stroke', 'M40 252 C90 244 150 244 204 252 M34 268 C90 260 150 260 210 268', 'cl_hi', 2),
        ('fill', 'M110 172 L106 216 C118 222 138 220 146 214 L144 166 Z', 'skin_sh'),
        ('fill', 'M100 212 C112 226 138 226 150 210 C140 220 112 222 100 212 Z', 'cl_hi'),
        ('face', 'M118 54 C148 52 166 74 166 106 C166 138 156 162 140 178 C130 188 112 190 102 184 C90 176 84 162 82 152 C78 146 78 138 80 132 C77 120 77 104 80 92 C86 70 100 56 118 54 Z'),
        ('fill', 'M152 84 C164 104 166 138 156 160 C148 176 136 184 124 188 C138 172 148 150 150 126 C151 110 152 96 152 84 Z', 'skin_sh'),
        ('fill', ell(112, 82, 18, 7), 'skin_hi'), ('fill', ell(97, 138, 8, 5), 'skin_hi'),
        ('fill', 'M118 118 C118 132 121 140 124 146 C120 149 114 149 110 146 C114 140 117 130 118 118 Z', 'skin_sh'),
        ('hair', 'front'),
        ('fill', ell(168, 140, 2.5, 2.5), 'gold'),
    ],
    eyes=((101, 118, 10), (136, 118, 13)), nose='M118 118 C118 132 121 140 124 146 C119 150 112 149 108 146', mouth=(116, 164, 12), brow_w=2.8,
)
CH['norah'] = dict(
    name='Norah', hair_style='longswept',
    pal=dict(skin_hi='#f6dcc8', skin='#e9c2a6', skin_sh='#c49478', skin_dp='#94664e', hair_hi='#5a3a26', hair='#3b2418', hair_sh='#1e120a',
             cl_hi='#f4f1ea', cl='#e2ddd1', cl_sh='#b4ad9e', iris='#7d7040', lip='#c27a76', btn='#1a1a1e'),
    layers=lambda: [
        ('hair', 'back'),
        ('fill', 'M26 280 C32 240 64 220 104 214 L150 212 C188 220 212 240 218 280 Z', 'cl'),
        ('fill', 'M150 214 C186 222 208 242 214 280 L168 280 C168 254 160 230 150 214 Z', 'cl_sh'),
        ('fill', 'M110 172 L106 216 C118 222 138 220 146 214 L144 166 Z', 'skin_sh'),
        ('fill', 'M104 210 L126 238 L100 236 L92 216 Z M150 208 L128 238 L154 236 L162 214 Z', 'cl_hi'),
        ('stroke', 'M104 210 L126 238 L100 236 M150 208 L128 238 L154 236', 'cl_sh', 1.6),
        ('stroke', 'M127 238 L127 280', 'cl_sh', 1.4),
        ('fill', ell(131, 250, 2.2, 2.2) + ' ' + ell(131, 268, 2.2, 2.2), 'btn'),
        ('face', 'M118 54 C150 52 168 74 168 106 C170 138 162 160 146 176 C134 188 112 192 100 186 C88 178 82 164 80 154 C76 146 76 138 78 132 C76 120 76 104 80 92 C86 70 100 56 118 54 Z'),
        ('fill', 'M154 84 C166 104 168 138 158 160 C150 176 138 186 124 190 C140 172 150 150 152 126 C153 110 154 96 154 84 Z', 'skin_sh'),
        ('fill', ell(112, 82, 18, 7), 'skin_hi'), ('fill', ell(96, 140, 10, 7), 'skin_hi'),
        ('fill', 'M118 120 C118 132 120 139 122 144 C119 147 114 147 111 144 C114 139 117 131 118 120 Z', 'skin_sh'),
        ('hair', 'front'),
    ],
    eyes=((101, 118, 10), (136, 118, 13)), nose='M118 120 C118 132 120 139 122 144 C118 147 113 147 110 144', mouth=(116, 163, 13), brow_w=2.4,
)
CH['dad3'] = dict(
    name='Stranger (dad with glasses)', hair_style='kenneth', glasses=True,
    pal=dict(skin_hi='#f2ccb0', skin='#dcae90', skin_sh='#b48268', skin_dp='#805848', hair_hi='#9a7650', hair='#6e5034', hair_sh='#40301e',
             cl_hi='#3c4c7a', cl='#26345a', cl_sh='#18213c', iris='#4a6aa0', lip='#a8746a', frame='#24201e'),
    layers=lambda: [
        ('fill', 'M110 186 L106 222 C122 230 146 228 156 220 L150 172 Z', 'skin_sh'),
        ('fill', 'M14 280 C22 234 60 212 102 206 L156 204 C196 212 224 236 230 280 Z', 'cl'),
        ('fill', 'M156 206 C194 214 222 238 228 280 L176 280 C176 250 168 222 156 206 Z', 'cl_sh'),
        ('fill', 'M94 212 L108 196 L128 222 L148 194 L164 210 L150 226 L128 230 L106 226 Z', 'cl_hi'),
        ('stroke', 'M128 222 L128 250', 'cl_sh', 2), ('fill', ell(128, 236, 2, 2) + ' ' + ell(128, 246, 2, 2), 'frame'),
        ('fill', 'M160 106 C172 102 176 122 170 134 C166 140 162 140 160 136 Z', 'skin_sh'),
        ('face', 'M118 50 C148 48 168 68 170 100 C172 126 168 144 162 158 C156 174 146 186 132 194 C122 199 110 198 102 192 C92 184 86 172 84 160 C80 152 80 142 82 134 C78 120 78 102 82 90 C88 66 100 52 118 50 Z'),
        ('fill', 'M152 76 C166 98 168 138 158 164 C150 182 140 192 128 196 C140 180 148 160 150 136 C151 116 152 96 152 76 Z', 'skin_sh'),
        ('fill', ell(114, 78, 20, 8), 'skin_hi'), ('fill', ell(98, 136, 7, 5), 'skin_hi'),
        ('fill', 'M118 112 C118 128 122 140 128 148 C122 153 112 153 106 149 C112 140 116 128 118 112 Z', 'skin_sh'),
        ('beard', None),
        ('hair', 'front'),
    ],
    eyes=((101, 116, 10), (137, 116, 12)), nose='M118 112 C118 128 122 140 128 148 C120 154 110 153 104 149', mouth=(116, 168, 14),
    beard_area=(88, 152, 166, 200), brow_w=3.4,
)
CH['kidboy'] = dict(
    name='Stranger (boy in the dinosaur shirt)', hair_style='boy',
    pal=dict(skin_hi='#f8dcc8', skin='#eec4aa', skin_sh='#cc9a80', skin_dp='#9c6c58', hair_hi='#c08a50', hair='#946232', hair_sh='#5e3c1c',
             cl_hi='#5ac06a', cl='#3a9a4a', cl_sh='#246a30', dino='#1e5a2a', iris='#4a6aa0', lip='#d08a82', white2='#f4ecdc'),
    layers=lambda: [
        ('fill', 'M40 280 C46 246 76 228 106 222 L146 220 C176 228 200 248 206 280 Z', 'cl'),
        ('fill', 'M146 222 C176 230 198 250 204 280 L166 280 C166 254 158 236 146 222 Z', 'cl_sh'),
        ('fill', 'M86 258 C92 246 112 244 122 252 L134 244 L140 252 C132 256 128 262 128 270 L116 270 L114 262 L100 262 L98 270 L88 270 Z', 'dino'),
        ('fill', 'M110 176 L108 216 C120 222 138 220 146 214 L144 168 Z', 'skin_sh'),
        ('fill', 'M100 222 C114 232 138 232 150 220 C140 226 112 228 100 222 Z', 'cl_sh'),
        ('face', 'M118 56 C150 54 170 76 170 108 C170 140 160 164 142 178 C130 188 112 190 100 182 C88 174 82 160 80 150 C76 144 76 136 78 130 C74 118 74 102 78 90 C84 68 100 56 118 56 Z'),
        ('fill', 'M156 86 C168 106 168 140 158 160 C150 176 138 184 126 188 C140 172 150 152 152 128 C153 112 155 98 156 86 Z', 'skin_sh'),
        ('fill', ell(112, 84, 20, 8), 'skin_hi'), ('fill', ell(96, 142, 9, 6), 'skin_hi'),
        ('fill', 'M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146 Z', 'skin_sh'),
        ('hair', 'front'),
    ],
    eyes=((99, 120, 12), (135, 120, 15)), nose='M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146', mouth=(116, 160, 11),
    brow_w=2.6, base_blush=True,
)
CH['kidgirl'] = dict(
    name='Stranger (girl in overalls)', hair_style='pigtails',
    pal=dict(skin_hi='#fae2d2', skin='#f2cbb6', skin_sh='#d0a08a', skin_dp='#a07262', hair_hi='#e8c47a', hair='#c89a50', hair_sh='#8a6430',
             cl_hi='#f4a8c0', cl='#e488a8', cl_sh='#b06080', ov='#3a6ab0', ov_sh='#284c84', tie='#d04040', iris='#4a6aa0', lip='#d88a86', btn='#e8c040'),
    layers=lambda: [
        ('hair', 'back'),
        ('fill', 'M40 280 C46 246 76 228 106 222 L146 220 C176 228 200 248 206 280 Z', 'cl'),
        ('fill', 'M70 280 L76 244 L100 244 L104 256 L144 256 L148 244 L172 244 L178 280 Z', 'ov'),
        ('fill', 'M150 244 L172 244 L178 280 L160 280 Z', 'ov_sh'),
        ('fill', ell(96, 252, 3, 3) + ' ' + ell(152, 252, 3, 3), 'btn'),
        ('fill', 'M110 176 L108 216 C120 222 138 220 146 214 L144 168 Z', 'skin_sh'),
        ('face', 'M118 56 C150 54 170 76 170 108 C170 140 160 164 142 178 C130 188 112 190 100 182 C88 174 82 160 80 150 C76 144 76 136 78 130 C74 118 74 102 78 90 C84 68 100 56 118 56 Z'),
        ('fill', 'M156 86 C168 106 168 140 158 160 C150 176 138 184 126 188 C140 172 150 152 152 128 C153 112 155 98 156 86 Z', 'skin_sh'),
        ('fill', ell(112, 84, 20, 8), 'skin_hi'), ('fill', ell(96, 142, 9, 6), 'skin_hi'),
        ('fill', 'M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146 Z', 'skin_sh'),
        ('hair', 'front'),
    ],
    eyes=((99, 120, 12), (135, 120, 15)), nose='M118 128 C118 136 120 142 123 146 C119 149 114 149 111 146', mouth=(116, 160, 11),
    brow_w=2.6, base_blush=True,
)
PALLID = dict(skin_hi='#e6dfd4', skin='#c4bab0', skin_sh='#968c84', skin_dp='#6a625c')

def build(cname, e, talk):
    c = CH[cname]; pal = {k: hexc(v) for k, v in c['pal'].items()}
    if e.get('pallid'):
        for k_, v_ in PALLID.items(): pal[k_] = hexc(v_)
    if e.get('whiteeyes'): pal['iris'] = hexc('#f6f2ea')
    pal.update(outline=hexc(OUTL), white=hexc('#ece6da'), mouth=hexc('#3a1a18'), teeth=hexc('#eee8dc'), tongue=hexc('#a8544e'), tear=hexc('#a8d4ea'), blush=hexc('#e08a80'), pupil=hexc('#120c0a'), shine=hexc('#ffffff'))
    img = np.zeros((H * SS, W * SS, 3)); cov = np.zeros((H * SS, W * SS), bool); masks = {}
    def paint(m, col, clip=None):
        nonlocal img, cov
        if clip is not None: m = m & masks[clip]
        img[m] = pal[col]; cov |= m
    face_mask = None
    for L in c['layers']():
        kind = L[0]
        if kind == 'fill':
            m = fill_mask(L[1])
            name = L[3] if len(L) > 3 else None; clip = L[4] if len(L) > 4 else None
            if name: masks[name] = m
            paint(m, L[2], clip)
            masks.setdefault('stripes', np.zeros_like(m))
            if L[2] in ('st',): masks['stripes'] = masks['stripes'] | (m & masks.get('body', m))
        elif kind == 'stroke':
            paint(stroke_mask(L[1], L[3]), L[2], face_mask if False else None)
        elif kind == 'face':
            face_mask = fill_mask(L[1]); masks['face'] = face_mask; paint(face_mask, 'skin')
            paint(stroke_mask(L[1], 2.6), 'outline')
        elif kind == 'stubble':
            x0, y0, x1, y1 = c['stubble_area']; rng = np.random.default_rng(5); d = []
            for _ in range(55):
                x, y = rng.uniform(x0, x1), rng.uniform(y0, y1); d.append('M %f %f l 1.5 1.5' % (x, y))
            paint(stroke_mask(' '.join(d), 1.5), 'stub', 'face')
        elif kind == 'blush':
            pass
        elif kind == 'beard':
            x0, y0, x1, y1 = c['beard_area']; rng = np.random.default_rng(9); d = []
            for _ in range(420):
                x, y = rng.uniform(x0, x1), rng.uniform(y0, y1); d.append('M %f %f l 1.2 2.5' % (x, y))
            paint(stroke_mask(' '.join(d), 2.2), 'hair', 'face')
            for _ in range(120):
                x, y = rng.uniform(x0, x1), rng.uniform(y0, y1); d.append('M %f %f l 1 2' % (x, y))
            paint(stroke_mask(' '.join(d[-120:]), 1.2), 'hair_sh', 'face')
        elif kind == 'hair':
            rng = np.random.default_rng(zlib.crc32((cname + L[1]).encode()) % 1000)
            for path, col, w, clip, k2 in gen_hair(cname, L[1], rng):
                if k2 == 'fill':
                    m = fill_mask(path); masks['hcap'] = m; paint(m, col)
                else:
                    cm = masks.get(clip) if clip else None
                    if clip == 'hcap': cm = masks['hcap'] | (fill_mask(path) & False)
                    m = stroke_mask(path, w)
                    if cm is not None: m = m & (cm | masks.get('hcapgrow', cm))
                    img[m] = pal[col]; cov |= m
    # expression-dependent features
    (lx, ly, lw), (rx, ry, rw) = c['eyes']
    flush = e.get('flush') or c.get('base_blush')
    if flush:
        paint(fill_mask(ell(lx - 2, ly + 22, 9, 5) + ' ' + ell(rx + 4, ry + 22, 12, 6)), 'blush', 'face')
    for (cx, cy, w), side in (((lx, ly, lw), 1), ((rx, ry, rw), -1)):
        white, lid, low, up = eye_paths(cx, cy, w, e)
        wm = fill_mask(white); masks['eye'] = wm
        sock = fill_mask(ell(cx, cy - 2, w * 1.25, w * 0.85)) & masks['face'] & ~wm
        paint(sock & ~fill_mask(ell(cx, cy - w * 1.1, w * 1.3, w * 0.35)), 'skin_sh')
        paint(wm, 'white')
        ir = w * 0.52; ix = cx - w * 0.12; iy = cy - up * 0.1
        paint(fill_mask(ell(ix, iy, ir, ir)), 'iris', 'eye')
        if e['pu'] > 0: paint(fill_mask(ell(ix, iy, ir * 0.48 * e['pu'], ir * 0.48 * e['pu'])), 'pupil', 'eye')
        if not e.get('whiteeyes'): paint(fill_mask(ell(ix - ir * 0.35, iy - ir * 0.35, ir * 0.28, ir * 0.28)), 'shine', 'eye')
        paint(stroke_mask(lid, 2.8), 'outline')
        if e['k'] in ('cry', 'happy') or e['open'] > 1.3: paint(stroke_mask(low, 1.6), 'skin_dp')
        paint(stroke_mask(brow_path(cx, cy, w, e, side), c['brow_w']), 'hair_sh')
    paint(stroke_mask(c['nose'], 2), 'skin_dp')
    if c.get('glasses'):
        for (cx, cy, w) in ((lx, ly, lw), (rx, ry, rw)):
            paint(stroke_mask('M %f %f L %f %f L %f %f L %f %f Z' % (cx - w * 1.5, cy - w * 0.95, cx + w * 1.45, cy - w * 0.95, cx + w * 1.3, cy + w * 0.9, cx - w * 1.35, cy + w * 0.9), 2.4), 'frame')
        paint(stroke_mask('M %f %f Q %f %f %f %f' % (lx + lw * 1.45, ly - lw * 0.5, (lx + rx) / 2, ly - lw * 0.9, rx - rw * 1.5, ry - rw * 0.5), 2.2), 'frame')
    mx, my, mw = c['mouth']; mp = mouth_paths(mx, my, mw, e['t'] if talk else e['c'])
    if 'fill' in mp:
        mm = fill_mask(mp['fill']); masks['mouth'] = mm; paint(mm, 'mouth')
        if 'teeth' in mp: paint(fill_mask(mp['teeth']), 'teeth', 'mouth')
        if 'tongue' in mp: paint(fill_mask(mp['tongue']), 'tongue', 'mouth')
        if 'gap' in mp: paint(stroke_mask(mp['gap'], 1.4), 'mouth', 'mouth')
        paint(stroke_mask(mp['fill'], 2.2), 'skin_dp')
    else:
        paint(stroke_mask(mp['line'], 2.6), 'lip')
        paint(stroke_mask(mp['line'], 1.2), 'skin_dp')
    if 'under' in mp: paint(stroke_mask(mp['under'], 1.8), 'skin_sh', 'face')
    if e.get('tears'):
        for cx, cy, w in ((lx, ly, lw), (rx, ry, rw)):
            paint(stroke_mask('M %f %f C %f %f %f %f %f %f' % (cx + 2, cy + 5, cx - 4, cy + 18, cx + 5, cy + 30, cx - 1, cy + 46), 4), 'tear', 'face')
    if e.get('sweat'):
        paint(fill_mask(drop(rx + rw * 2.3, ry - rw * 1.7)), 'tear')
    # downsample
    blk = img.reshape(H, SS, W, SS, 3).mean(axis=(1, 3)); a = cov.reshape(H, SS, W, SS).mean(axis=(1, 3))
    palv = np.array(list(pal.values())); out = np.zeros((H, W, 4), np.uint8)
    for yy in range(H):
        for xx in range(W):
            if a[yy, xx] < 0.5: continue
            col = blk[yy, xx] / max(a[yy, xx], 1e-6)
            j = np.argmin(((palv - col) ** 2).sum(1)); out[yy, xx, :3] = palv[j]; out[yy, xx, 3] = 255
    o2 = out.copy()
    for yy in range(H):
        for xx in range(W):
            if out[yy, xx, 3]: continue
            nb = [(yy + dy, xx + dx) for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)) if 0 <= yy + dy < H and 0 <= xx + dx < W]
            if any(out[p][3] for p in nb): o2[yy, xx] = (28, 19, 16, 255)
    st = e.get('stretch', 0)
    if st:
        cut = 74
        o3 = np.zeros_like(o2)
        o3[:cut - st] = o2[st:cut]
        for k_ in range(st + 1): o3[cut - st + k_ - 1] = o2[cut - 1] if k_ < st else o3[cut - st + k_ - 1]
        o3[cut:] = o2[cut:]
        for k_ in range(st): o3[cut - st + k_] = o2[cut]
        o2 = o3
    return o2

MORPH = [
    dict(k='m1', label='Morph 1 · too wide', bi=0, bo=0, open=1, sq=0.1, pu=1, c=dict(s=3, h=4, w=1.35, teeth=1), t=dict(s=3, h=4, w=1.35, teeth=1)),
    dict(k='m2', label='Morph 2 · unblinking', bi=-2, bo=1, open=1.3, sq=0, pu=0.3, c=dict(s=4, h=6, w=1.6, clench=1), t=dict(s=4, h=6, w=1.6, clench=1)),
    dict(k='m3', label='Morph 3 · neck stretch', bi=2, bo=-2, open=1.2, sq=0, pu=0.2, pallid=1, stretch=6, c=dict(s=5, h=8, w=1.8, clench=1), t=dict(s=5, h=8, w=1.8, clench=1)),
    dict(k='m4', label='Morph 4 · jaw unhinges', bi=4, bo=-3, open=1.3, sq=0, pu=0, whiteeyes=1, pallid=1, stretch=10, c=dict(s=-2, h=36, w=1.25, teeth=1), t=dict(s=-2, h=36, w=1.25, teeth=1)),
    dict(k='m5', label='Morph 5 · the grin', bi=7, bo=-4, open=0.9, sq=0.2, pu=0, whiteeyes=1, pallid=1, stretch=12, c=dict(s=8, h=18, w=2.2, clench=1), t=dict(s=8, h=18, w=2.2, clench=1)),
]
manifest = []
NEW = ('norah',)
CROWD = ('dad2', 'mom2', 'dad3', 'kidboy', 'kidgirl')
ALL = '--all' in sys.argv
if ALL:
    for e in MORPH:
        arr = build('stranger', e, 0)
        Image.fromarray(arr, 'RGBA').resize((W * 2, H * 2), Image.NEAREST).save(os.path.join(OUT, 'stranger_%s.png' % e['k']))
for cname in (('kenneth', 'adaline', 'stranger', 'rachel', 'marcus', 'denise') + CROWD + NEW) if ALL else NEW:
    for talk in (0, 1):
        for e in EX:
            arr = build(cname, e, talk)
            im = Image.fromarray(arr, 'RGBA').resize((W * 2, H * 2), Image.NEAREST)
            fn = '%s_%s%s.png' % (cname, e['k'], '_talk' if talk else '')
            im.save(os.path.join(OUT, fn))
            manifest.append(fn)
print(len(manifest), 'portraits written to', OUT)
