#!/usr/bin/env python3
"""Chapter One v9 textures: Adaline's wallpaper, Louis's ruined walls, blood and claw decals, the truck's rust,
and the pictures and pages shown full-screen when Norah picks something up (the document viewer).
Low-res and hand-made on purpose (PS1). Writes into assets/textures/ (and assets/textures/docs/).
Run:  python3 tools/make_ch1_v9_textures.py
"""
import os, random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
O = os.path.join(ROOT, 'assets', 'textures') + '/'
D = O + 'docs/'
os.makedirs(D, exist_ok=True)
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIFB = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SERIFI = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf' if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf') else SERIF
r = random.Random(9)

def noise(im, amt=10, seed=1):
    rr = random.Random(seed); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]; n = rr.randint(-amt, amt)
            px[x, y] = tuple(max(0, min(255, c + n)) for c in p[:3]) + tuple(p[3:])
    return im

def F(path, size):
    return ImageFont.truetype(path, size)

# ---------------------------------------------------------------- subtle grit for the designer's flat-coloured parts
im = Image.new('RGB', (16, 16), (200, 200, 200)); noise(im, 16, 3).save(O + 'md_noise.png')

# ---------------------------------------------------------------- Adaline's room: pink wallpaper, white stripes, hearts and little stars
im = Image.new('RGB', (64, 64), (236, 170, 196)); d = ImageDraw.Draw(im)
for x in (0, 32):
    d.rectangle([x + 13, 0, x + 18, 63], fill=(248, 214, 228))
    d.line([(x + 12, 0), (x + 12, 63)], fill=(214, 140, 172)); d.line([(x + 19, 0), (x + 19, 63)], fill=(214, 140, 172))
def heart(d, cx, cy, s, col):
    d.ellipse([cx - s, cy - s, cx, cy], fill=col); d.ellipse([cx, cy - s, cx + s, cy], fill=col)
    d.polygon([(cx - s, cy - s // 2), (cx + s, cy - s // 2), (cx, cy + s)], fill=col)
def star(d, cx, cy, col):
    d.point([(cx, cy - 2), (cx, cy - 1), (cx - 2, cy), (cx - 1, cy), (cx, cy), (cx + 1, cy), (cx + 2, cy), (cx, cy + 1), (cx, cy + 2)], fill=col)
for y in range(8, 64, 16):
    for x in (5, 37):
        heart(d, x + 1, y + (8 if x == 37 else 0), 3, (206, 60, 112))
    for x in (26, 58):
        star(d, x, y + (8 if x == 26 else 0) + 4, (255, 250, 210))
noise(im, 5, 4).save(O + 'adaline_wallpaper.png')
# a purple rug with a white border for her floor
im = Image.new('RGB', (32, 32), (150, 110, 190)); d = ImageDraw.Draw(im)
d.rectangle([1, 1, 30, 30], outline=(240, 230, 245), width=2)
for k in range(4): star(d, 8 + k * 5, 16 + (k % 2) * 4, (250, 240, 120))
noise(im, 6, 5).save(O + 'adaline_rug.png')

# ---------------------------------------------------------------- Louis's walls: his rose wallpaper, torn in strips, plaster and lath showing, smeared
base = Image.open(O + 'lh_wallpaper.png').convert('RGB').resize((64, 64), Image.NEAREST)
im = base.copy(); d = ImageDraw.Draw(im)
for _ in range(5):          # torn strips: wallpaper peeled down in long tongues
    x = r.randint(0, 56); w = r.randint(5, 11); y0 = r.randint(0, 20); y1 = r.randint(34, 63)
    pts = [(x, y0)] + [(x + r.randint(-2, 2) + (w if k % 2 else 0), y0 + (y1 - y0) * k // 6) for k in range(1, 7)] + [(x + w, y0)]
    d.polygon(pts, fill=(188, 180, 160))
    for ly in range(y0 + 2, y1, 4): d.line([(x + 1, ly), (x + w - 1, ly)], fill=(120, 96, 70))      # lath
    d.line(pts[:2], fill=(230, 222, 196))
for _ in range(3):          # dark water stains
    cx, cy = r.randint(0, 63), r.randint(0, 63)
    for k in range(60):
        px_, py_ = cx + int(r.gauss(0, 5)), cy + int(r.gauss(0, 7))
        if 0 <= px_ < 64 and 0 <= py_ < 64:
            c = im.getpixel((px_, py_)); im.putpixel((px_, py_), tuple(int(v * 0.72) for v in c))
noise(im, 6, 6).save(O + 'lh_wall_torn.png')

# blood: a dragged smear and handprints (RGBA decal)
im = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
for k in range(5):          # four fingers dragged down, plus the palm
    x = 18 + k * 7 if k < 4 else 26
    w = 4 if k < 4 else 14
    for y in range(6 if k < 4 else 2, 60):
        a = max(0, 230 - y * 3 + r.randint(-20, 20))
        d.line([(x + r.randint(-1, 1), y), (x + w + r.randint(-1, 1), y)], fill=(96, 8, 10, a))
for _ in range(40):
    x, y = r.randint(10, 56), r.randint(0, 24); d.point([(x, y)], fill=(120, 10, 12, 220))
im.save(O + 'blood_smear.png')
im = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
for k in range(4):          # claw marks: four gouges
    x0 = 12 + k * 10; y0 = 6 + k * 2
    for t in range(48):
        x = x0 + t * 0.32 + math.sin(t * 0.3 + k) * 0.8; y = y0 + t
        d.line([(x - 1, y), (x + 1, y)], fill=(40, 26, 20, 235)); d.point([(x + 2, y)], fill=(225, 210, 180, 200))
im.save(O + 'claw_marks.png')

# the truck: faded green paint eaten through with rust
im = Image.new('RGB', (64, 64), (86, 112, 96)); d = ImageDraw.Draw(im)
for _ in range(14):
    cx, cy, rr_ = r.randint(0, 63), r.randint(0, 63), r.randint(3, 9)
    for k in range(rr_ * rr_ * 3):
        x, y = cx + int(r.gauss(0, rr_ / 1.6)), cy + int(r.gauss(0, rr_ / 1.6))
        if 0 <= x < 64 and 0 <= y < 64: im.putpixel((x, y), r.choice([(140, 70, 30), (110, 52, 24), (160, 92, 44), (70, 40, 26)]))
for y in range(0, 64, 2):
    if r.random() < 0.3: d.line([(0, y), (63, y)], fill=(78, 100, 86))
noise(im, 8, 7).save(O + 'truck_rust.png')
im = Image.new('RGB', (32, 32), (70, 66, 62)); noise(im, 14, 8).save(O + 'truck_bed.png')

# ---------------------------------------------------------------- document viewer: pages and pictures (shown large, so a bit more resolution)
def paper(w, h, col=(232, 224, 200), seed=1, lines=None, margin=None):
    im = Image.new('RGB', (w, h), col); d = ImageDraw.Draw(im)
    if lines:
        for y in range(lines[0], h - 4, lines[1]): d.line([(4, y), (w - 5, y)], fill=(170, 186, 210))
    if margin: d.line([(margin, 0), (margin, h)], fill=(214, 120, 120))
    return noise(im, 5, seed)

def scrawl(d, x, y, w, rows, gap, col, seed):
    rr = random.Random(seed)
    for k in range(rows):
        xx = x; end = x + w - rr.randint(0, w // 3)
        while xx < end:
            wl = rr.randint(4, 12); yy = y + k * gap + rr.randint(-1, 1)
            for t in range(wl):
                d.point([(xx + t, yy + int(1.5 * math.sin((xx + t) * 1.7 + rr.random())))], fill=col)
            xx += wl + rr.randint(2, 4)

# Norah's journal: lined notebook page, Oct 14
im = paper(120, 160, seed=11, lines=(22, 9), margin=16); d = ImageDraw.Draw(im)
d.text((20, 6), 'Oct 14', font=F(SERIFB, 10), fill=(40, 50, 110))
scrawl(d, 20, 22, 94, 14, 9, (40, 50, 110), 3)
d.rectangle([72, 132, 112, 150], outline=(170, 40, 40)); d.text((76, 136), '6/12', font=F(SERIFB, 9), fill=(170, 40, 40))
im.save(D + 'doc_journal.png')

# Louis's Bible journal: a small leather notebook, a page of careful pencil, John 3:16 boxed, a pressed flower
im = Image.new('RGB', (128, 160), (60, 36, 24)); d = ImageDraw.Draw(im)
pg = paper(112, 148, (226, 214, 180), seed=12); im.paste(pg, (8, 6)); d = ImageDraw.Draw(im)
d.line([(64, 6), (64, 154)], fill=(170, 150, 120))
d.text((14, 10), 'For Rose', font=F(SERIFI, 8), fill=(70, 60, 50))
scrawl(d, 14, 24, 46, 10, 8, (90, 84, 76), 5)
scrawl(d, 70, 14, 46, 6, 8, (90, 84, 76), 6)
d.rectangle([70, 66, 116, 82], outline=(110, 40, 30)); d.text((73, 69), 'JOHN 3:16', font=F(SERIFB, 8), fill=(110, 40, 30))
scrawl(d, 70, 90, 46, 4, 8, (90, 84, 76), 7)
for k in range(6):          # the last entry: the hand gets worse
    rr = random.Random(30 + k)
    y = 118 + k * 6
    for t in range(0, 40 - k * 3):
        d.point([(70 + t + rr.randint(-1, 1), y + rr.randint(-1 - k // 2, 1 + k // 2))], fill=(60, 50, 44))
d.ellipse([22, 108, 34, 120], fill=(150, 60, 90)); d.line([(28, 120), (30, 140)], fill=(80, 100, 60))
im.save(D + 'doc_bible_journal.png')

# instant photo: Louis and Addie on Norah's porch step, two hammers. "Step fixed!" on the white border
def instant(w, h, seed, draw, caption):
    im = Image.new('RGB', (w, h), (236, 232, 220)); d = ImageDraw.Draw(im)
    ph = Image.new('RGB', (w - 12, h - 30), (70, 60, 50)); pd = ImageDraw.Draw(ph); draw(pd, ph.size)
    ph = noise(ph, 6, seed).filter(ImageFilter.SMOOTH); im.paste(ph, (6, 6))
    d.text((8, h - 21), caption, font=F(SERIFI if os.path.exists(SERIFI) else SERIF, 9), fill=(40, 40, 70))
    return im
def louis_addie(d, s):
    w, h = s
    d.rectangle([0, 0, w, h * 0.55], fill=(180, 196, 210))                           # sky
    d.rectangle([0, h * 0.55, w, h], fill=(150, 112, 80))                             # porch boards
    for x in range(0, w, 12): d.line([(x, h * 0.55), (x, h)], fill=(120, 88, 60))
    d.rectangle([w * 0.62, h * 0.18, w * 0.98, h * 0.6], fill=(160, 70, 60))          # the brick of the house behind
    # Louis: tall, thin, white hair, cardigan, kneeling with a hammer
    lx = w * 0.32
    d.rectangle([lx - 9, h * 0.38, lx + 9, h * 0.72], fill=(80, 96, 116))
    d.ellipse([lx - 7, h * 0.2, lx + 7, h * 0.38], fill=(228, 196, 176)); d.rectangle([lx - 7, h * 0.18, lx + 7, h * 0.23], fill=(236, 236, 232))
    d.rectangle([lx + 8, h * 0.52, lx + 20, h * 0.56], fill=(100, 70, 40))
    # Addie: small, yellow dress, a hammer held up proudly
    ax = w * 0.62
    d.rectangle([ax - 6, h * 0.5, ax + 6, h * 0.78], fill=(242, 194, 48))
    d.ellipse([ax - 5, h * 0.36, ax + 5, h * 0.5], fill=(240, 205, 184)); d.rectangle([ax - 6, h * 0.34, ax + 6, h * 0.4], fill=(122, 78, 44))
    d.rectangle([ax + 6, h * 0.3, ax + 9, h * 0.52], fill=(100, 70, 40)); d.rectangle([ax + 3, h * 0.28, ax + 12, h * 0.32], fill=(120, 120, 126))
instant(112, 120, 21, louis_addie, 'Step fixed! - Sept').save(D + 'photo_louis_addie.png')
def rose(d, s):
    w, h = s
    d.rectangle([0, 0, w, h], fill=(150, 140, 120))
    d.rectangle([w * 0.18, h * 0.3, w * 0.45, h], fill=(40, 40, 46)); d.ellipse([w * 0.22, h * 0.1, w * 0.41, h * 0.32], fill=(220, 190, 170))
    d.rectangle([w * 0.52, h * 0.3, w * 0.82, h], fill=(236, 232, 224)); d.ellipse([w * 0.56, h * 0.1, w * 0.76, h * 0.32], fill=(226, 196, 176))
    d.rectangle([w * 0.54, h * 0.06, w * 0.78, h * 0.14], fill=(90, 60, 40))
instant(96, 112, 22, rose, 'Louis & Rose, 1968').save(D + 'photo_louis_rose.png')

# the items, drawn on a dark cloth (shown when picked up)
def item_bg(w=96, h=72):
    im = Image.new('RGB', (w, h), (26, 24, 24)); return noise(im, 6, 33), None
def save_item(name, fn):
    im, _ = item_bg(); d = ImageDraw.Draw(im); fn(d); im.save(D + name + '.png')
save_item('item_rosary', lambda d: ([d.ellipse([28 + 18 * math.cos(t / 14 * math.pi * 2) + 18, 18 + 14 * math.sin(t / 14 * math.pi * 2) + 8, 32 + 18 * math.cos(t / 14 * math.pi * 2) + 18, 22 + 14 * math.sin(t / 14 * math.pi * 2) + 8], fill=(150, 30, 40)) for t in range(14)],
                                    d.line([(48, 48), (48, 64)], fill=(190, 160, 80), width=2), d.line([(42, 54), (54, 54)], fill=(190, 160, 80), width=2)))
save_item('item_medicine', lambda d: (d.rectangle([36, 18, 60, 60], fill=(220, 120, 30)), d.rectangle([34, 12, 62, 20], fill=(240, 240, 236)), d.rectangle([38, 30, 58, 48], fill=(240, 236, 220)),
                                      [d.line([(40, 34 + k * 4), (56, 34 + k * 4)], fill=(120, 120, 130)) for k in range(4)]))
save_item('item_truck_keys', lambda d: (d.ellipse([20, 20, 40, 40], outline=(190, 190, 196), width=3), d.rectangle([38, 27, 70, 33], fill=(196, 180, 110)),
                                        [d.rectangle([60 - k * 6, 33, 63 - k * 6, 37 + (k % 2) * 3], fill=(196, 180, 110)) for k in range(4)],
                                        d.rectangle([14, 40, 30, 58], fill=(200, 40, 40)), d.text((16, 44), 'F', font=F(SANS, 9), fill=(240, 240, 240))))
save_item('item_battery', lambda d: (d.rectangle([28, 22, 68, 46], fill=(40, 40, 40)), d.rectangle([28, 22, 44, 46], fill=(190, 140, 40)), d.rectangle([68, 30, 72, 38], fill=(180, 180, 180)),
                                     d.text((48, 28), '1/2', font=F(SANS, 9), fill=(220, 220, 220))))
save_item('item_batteries', lambda d: [(d.rectangle([22 + k * 26, 18, 42 + k * 26, 56], fill=(40, 40, 40)), d.rectangle([22 + k * 26, 18, 42 + k * 26, 30], fill=(190, 140, 40)),
                                        d.rectangle([28 + k * 26, 14, 36 + k * 26, 18], fill=(180, 180, 180))) for k in range(2)])
save_item('item_ammo', lambda d: [(d.rectangle([20 + k * 12, 22, 27 + k * 12, 46], fill=(200, 160, 70)), d.rectangle([20 + k * 12, 16, 27 + k * 12, 22], fill=(150, 110, 70))) for k in range(5)])
save_item('item_flashlight', lambda d: (d.rectangle([16, 30, 60, 42], fill=(50, 50, 56)), d.polygon([(60, 26), (78, 22), (78, 50), (60, 46)], fill=(60, 60, 66)), d.rectangle([76, 24, 80, 48], fill=(250, 240, 190))))
save_item('item_revolver', lambda d: (d.rectangle([20, 26, 66, 32], fill=(90, 92, 98)), d.rectangle([44, 24, 58, 38], fill=(80, 82, 88)), d.polygon([(56, 34), (66, 34), (60, 58), (50, 58)], fill=(90, 56, 34)),
                                      d.arc([46, 34, 58, 46], 0, 180, fill=(80, 82, 88))))
save_item('item_tape', lambda d: (d.ellipse([28, 16, 68, 56], fill=(150, 150, 156)), d.ellipse([40, 28, 56, 44], fill=(26, 24, 24))))
print('v9 textures written')
