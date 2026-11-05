import math, numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
O = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'textures') + '/'
r = np.random.default_rng(11)
def hx(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float)
def save(a, n): Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(O + n)
def noise(base, amp, n=64): return np.tile(hx(base), (n, n, 1)) + r.normal(0, amp, (n, n, 1))
# party floor: 0.5 m cream/peach checks (texture = 1 m)
t = np.zeros((64, 64, 3))
for y in range(64):
    for x in range(64): t[y, x] = hx('#fff1d6') if ((x // 32) + (y // 32)) % 2 == 0 else hx('#ffd6aa')
t += r.normal(0, 4, (64, 64, 1)); t[::32] *= .9; t[:, ::32] *= .9; save(t, 'floor_party.png')
# hallway carpet
t = noise('#2c3236', 7)
for y in range(64):
    for x in range(64):
        if (x + y) % 16 == 0 or (x - y) % 16 == 0: t[y, x] = t[y, x] * .7 + hx('#3e464c') * .3
save(t, 'carpet_hall.png')
# foyer lino tiles
t = noise('#6a6a62', 6); t[::32] = hx('#3e3e38'); t[:, ::32] = hx('#3e3e38')
for _ in range(30): y, x = r.integers(0, 64, 2); t[y:y+2, x:x+3] *= .85
save(t, 'floor_foyer.png')
# walls (texture spans the 3.2 m wall height: row = 64 * (1 - y / 3.2))
def wall(top, band=None, low=None, base='#2e2a24', stains=0):
    t = np.zeros((64, 64, 3))
    for y in range(64):
        hgt = 3.2 * (1 - y / 64)
        for x in range(64):
            if hgt < .15: c = hx(base)
            elif band and .9 <= hgt <= 1.1: c = hx(band[(x // 8) % len(band)])
            elif low and hgt < .9: c = hx(low)
            else: c = hx(top)
            t[y, x] = c
    t += r.normal(0, 5, (64, 64, 1))
    for _ in range(stains):
        cx, cy, rr = r.integers(0, 64), r.integers(0, 40), r.integers(4, 10)
        for y in range(max(0, cy - rr), min(64, cy + 2 * rr)):
            for x in range(max(0, cx - rr), min(64, cx + rr)): t[y, x] *= .88
    return t
BR = ['#ff4d6d', '#ffb703', '#3a86ff', '#38b000', '#9b5de5', '#ff7b00', '#00bbf9', '#f15bb5']
save(wall('#ffe9a8', BR, '#ff9fbb', '#a05070'), 'wall_party.png')
save(wall('#5c584e', None, '#4a463e', '#26221c', 6), 'wall_hall.png')
save(wall('#66625a', None, None, '#2a2620', 3), 'wall_foyer.png')
t = np.zeros((64, 64, 3))                     # exterior brick
for y in range(64):
    for x in range(64):
        off = 8 if (y // 8) % 2 else 0
        t[y, x] = hx('#2c201a') if y % 8 == 0 or (x + off) % 16 == 0 else hx('#5a3428') * r.uniform(.85, 1.1)
save(t, 'wall_brick.png')
t = noise('#d8d4c8', 3); t[::32] = hx('#a8a498'); t[:, ::32] = hx('#a8a498')
for _ in range(40): y, x = r.integers(0, 64, 2); t[y, x] *= .8
save(t, 'ceiling_tile.png')
save(noise('#26282a', 9), 'asphalt.png')
t = noise('#5c5b56', 6); t[::32] = hx('#3c3b36'); t[:, ::32] = hx('#3c3b36'); save(t, 'concrete.png')
save(noise('#1e2a18', 10), 'grass.png')
t = noise('#5a3e26', 6)
for x in range(0, 64, 4): t[:, x] *= .85
save(t, 'wood.png')
def dots(base, dot):
    t = noise(base, 3)
    for y in range(2, 64, 8):
        for x in range(2 + (y // 8 % 2) * 4, 64, 8): t[y:y+3, x:x+3] = hx(dot)
    return t
save(dots('#ff8fab', '#ffffff'), 'cloth_pink.png'); save(dots('#fff3b0', '#3a86ff'), 'cloth_yellow.png'); save(dots('#b9fbc0', '#ffffff'), 'cloth_mint.png')
def concentric(cols):
    t = np.zeros((64, 64, 3))
    for y in range(64):
        for x in range(64):
            k = int(max(abs(x - 31.5), abs(y - 31.5)) / (32 / len(cols))); t[y, x] = hx(cols[min(k, len(cols) - 1)])
    return t
save(concentric(['#ff4d6d', '#ffb703', '#ffffff']), 'mat_a.png'); save(concentric(['#3a86ff', '#38b000', '#ffffff']), 'mat_b.png')
save(np.full((8, 8, 3), 255.0), 'white.png')
t = noise('#2a2a2a', 6); t[:, 30:34] = hx('#9a7e24'); save(t, 'road.png')
# banner (mapped to a 5 m x 0.6 m quad)
bn = Image.new('RGB', (160, 20), (255, 255, 255)); d = ImageDraw.Draw(bn)
try: f = ImageFont.load_default(size=11)
except TypeError: f = ImageFont.load_default()
x = 6
for i, ch in enumerate('HAPPY BIRTHDAY AMELIA'): d.text((x, 3), ch, fill=tuple(int(v) for v in hx(BR[i % len(BR)])), font=f); x += 7.0
for i in range(20): d.rectangle([2 + i * 8, 0, 7 + i * 8, 1], fill=tuple(int(v) for v in hx(BR[i % len(BR)])))
bn.save(O + 'banner_amelia.png')
print('ok')

# ---------------------------------------------------------------- town + aftermath (added with the story pass)
def facade(wall_c, win_lit, seed, store=False):
    rr = np.random.default_rng(seed)
    t = noise(wall_c, 6)
    for row in range(4):
        y0 = 4 + row * 15
        if store and row == 3:
            t[48:62, 4:60] = hx('#1a2228') if rr.random() < 0.5 else hx('#d8b860') * 0.8
            t[46:48, 2:62] = hx('#5a2a20')
            continue
        for col in range(4):
            x0 = 4 + col * 15
            lit = rr.random() < win_lit
            c = hx('#e8c070') * (0.75 + rr.random() * 0.3) if lit else hx('#141a22')
            t[y0:y0 + 9, x0:x0 + 8] = c
            t[y0 + 9, x0 - 1:x0 + 9] = hx('#8a8478')
            if lit: t[y0:y0 + 9, x0 + 3] *= 0.7
    save(t, 'facade_%d.png' % seed)
for i, (c, l, st) in enumerate((('#6a3a2a', .35, True), ('#5a5a58', .25, False), ('#7a6a50', .3, True), ('#3c4450', .2, False), ('#6a4a3a', .4, False))):
    facade(c, l, i, st)
# fire sprite (soft blob, additive)
t = np.zeros((32, 32, 4))
for y in range(32):
    for x in range(32):
        d = math.hypot((x - 15.5) / 15.5, (y - 18) / 14)
        a = max(0, 1 - d) ** 1.5
        t[y, x] = (255, 160 + 80 * a, 60 * a, 255 * a)
Image.fromarray(t.astype(np.uint8), 'RGBA').save(O + 'fire.png')
# smoke puff
t = np.zeros((32, 32, 4))
for y in range(32):
    for x in range(32):
        d = math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5); a = max(0, 1 - d) ** 2
        t[y, x] = (90, 88, 86, 200 * a)
Image.fromarray(t.astype(np.uint8), 'RGBA').save(O + 'smoke.png')
# glass shard
t = np.zeros((8, 8, 4)); t[:, :] = (200, 220, 235, 200); t[0, :] = (255, 255, 255, 255)
Image.fromarray(t.astype(np.uint8), 'RGBA').save(O + 'glass_shard.png')
# blood pool (kept dark and small; the violence is suggested, not shown)
t = np.zeros((32, 32, 4))
for y in range(32):
    for x in range(32):
        d = math.hypot((x - 15.5) / 15.5, (y - 15.5) / 12) + r.normal(0, .08)
        if d < 1: t[y, x] = (70, 6, 8, 230)
Image.fromarray(t.astype(np.uint8), 'RGBA').save(O + 'blood_pool.png')

# ---------------------------------------------------------------- the drive (ending pass)
# windshield crack: transparent with a starburst of pale lines
t = np.zeros((64, 64, 4))
rr = np.random.default_rng(4)
cx, cy = 22, 26
for k in range(14):
    a = rr.uniform(0, 2 * math.pi); L = rr.uniform(10, 40); x, y = cx, cy
    for s_ in range(int(L)):
        a += rr.normal(0, 0.12); x += math.cos(a); y += math.sin(a)
        if 0 <= int(x) < 64 and 0 <= int(y) < 64: t[int(y), int(x)] = (225, 235, 240, 230)
for r_ in (5, 9):
    for k in range(60):
        a = k / 60 * 2 * math.pi; x, y = int(cx + r_ * math.cos(a)), int(cy + r_ * math.sin(a))
        if rr.random() < 0.7 and 0 <= x < 64 and 0 <= y < 64: t[y, x] = (210, 222, 230, 200)
Image.fromarray(t.astype(np.uint8), 'RGBA').save(O + 'windshield_crack.png')
# church sign
im = Image.new('RGB', (128, 32), (36, 30, 26)); d = ImageDraw.Draw(im)
d.rectangle([1, 1, 126, 30], outline=(200, 190, 160))
try:
    fnt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 9)
    fsm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 7)
except Exception:
    fnt = fsm = ImageFont.load_default()
d.text((64, 10), 'KENNEDY COMMUNITY CHURCH', fill=(235, 228, 200), font=fnt, anchor='mm')
d.text((64, 22), 'ALL ARE WELCOME', fill=(200, 170, 90), font=fsm, anchor='mm')
im.save(O + 'church_sign.png')
# stained glass
t = np.zeros((32, 64, 3))
cols = [hx('#c8402a'), hx('#2a5ac8'), hx('#e0b030'), hx('#3a9a4a'), hx('#8a3ab0')]
for y in range(32):
    for x in range(64):
        t[y, x] = cols[((x // 8) + (y // 8) * 2) % 5]
t[::8] = hx('#1a1410'); t[:, ::8] = hx('#1a1410')
save(t, 'stained_glass.png')
# church facade (pale stone)
t = noise('#8c8678', 5)
for y in range(0, 64, 8): t[y] *= 0.8
for y in range(0, 64, 8):
    for x in range(((y // 8) % 2) * 8, 64, 16): t[y:y + 8, x] *= 0.82
save(t, 'stone.png')

# ---------------------------------------------------------------- Kennedy city + farmland (opening pass)
rr = np.random.default_rng(21)
t = np.zeros((128, 128, 3))
fields = ['#3e5a2a', '#5a4630', '#7a6a44', '#4a6232', '#6a5a3a', '#2e4a26', '#8a7a52', '#54402a']
for by in range(0, 128, 16):
    for bx in range(0, 128, 16):
        # split some quarter sections in half, the way farms divide
        splits = [(bx, by, 16, 16)] if rr.random() < 0.5 else ([(bx, by, 8, 16), (bx + 8, by, 8, 16)] if rr.random() < 0.5 else [(bx, by, 16, 8), (bx, by + 8, 16, 8)])
        for (x0, y0, w, h) in splits:
            c = hx(fields[rr.integers(len(fields))])
            t[y0:y0 + h, x0:x0 + w] = c
            if rr.random() < 0.6:   # crop rows
                for k in range(0, h if rr.random() < 0.5 else w, 2):
                    if h > w or rr.random() < 0.5: t[y0 + k % h, x0:x0 + w] *= 0.88
                    else: t[y0:y0 + h, x0 + k % w] *= 0.88
t += rr.normal(0, 3, (128, 128, 1))
t[::64, :] = hx('#6a665e'); t[:, ::64] = hx('#6a665e')        # section-line gravel roads
for k in range(40):                                           # shelterbelts (tree lines) along some field edges
    if rr.random() < 0.5:
        y = rr.integers(0, 8) * 16; x = rr.integers(0, 120); t[y:y + 1, x:x + 16] = hx('#1e2e1a')
    else:
        x = rr.integers(0, 8) * 16; y = rr.integers(0, 120); t[y:y + 16, x:x + 1] = hx('#1e2e1a')
save(t, 'farmland.png')
t = noise('#1c2a34', 4)
for y in range(0, 64, 6): t[y, rr.integers(0, 40):] *= 1.25
save(t, 'river_water.png')
t = noise('#3a3c3a', 5); save(t, 'city_ground.png')
for i, (c, trim) in enumerate((('#8a7a64', '#e8e0cc'), ('#6a7a8a', '#eaeaea'), ('#9a8a6a', '#ffffff'), ('#7a5a48', '#e0d8c8'))):
    t = noise(c, 5)
    for y in range(0, 64, 4): t[y] *= 0.92                      # siding
    t[20:34, 10:22] = hx('#e8c070') if i % 2 == 0 else hx('#141a22')   # a lit or dark window
    t[20:34, 40:52] = hx('#141a22') if i % 2 == 0 else hx('#d8b060')
    t[19, 9:23] = hx(trim); t[34, 9:23] = hx(trim); t[19, 39:53] = hx(trim); t[34, 39:53] = hx(trim)
    t[40:64, 26:36] = hx('#4a3020')                            # door
    save(t, 'house_%d.png' % i)
t = noise('#3a2e2a', 6)
for y in range(0, 64, 5): t[y] *= 0.75
save(t, 'roof_shingle.png')
t = noise('#6a6a66', 4)
for x in range(0, 64, 4): t[:, x] *= 0.85
t[40:64, 8:30] = hx('#3a3a38')
save(t, 'warehouse.png')
t = noise('#9a948a', 4)
for y in range(0, 64, 8): t[y] *= 0.85
save(t, 'concrete_silo.png')
