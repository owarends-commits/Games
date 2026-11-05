#!/usr/bin/env python3
"""Chapter One textures: Louis's house, the road signs, small props for both houses.
Low-res and hand-made on purpose (PS1). Writes into assets/textures/.
Run:  python3 tools/make_ch1_textures.py
"""
import os, random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
O = os.path.join(ROOT, 'assets', 'textures') + '/'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIFB = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
r = random.Random(11)

def noise(im, amt=10, seed=1):
    rr = random.Random(seed); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]; n = rr.randint(-amt, amt)
            px[x, y] = tuple(max(0, min(255, c + n)) for c in p[:3]) + tuple(p[3:])
    return im

# ---------------------------------------------------------------- Louis's wallpaper: faded cream, sage stripes, tiny roses
im = Image.new('RGB', (64, 64), (196, 186, 156)); d = ImageDraw.Draw(im)
for x in (0, 32):
    d.rectangle([x + 2, 0, x + 4, 63], fill=(150, 160, 130)); d.rectangle([x + 28, 0, x + 28, 63], fill=(170, 172, 140))
for y in range(4, 64, 16):
    for x in (16, 48):
        yy = y + (8 if x == 48 else 0)
        d.ellipse([x - 2, yy - 2, x + 2, yy + 2], fill=(160, 104, 96)); d.point([(x, yy)], fill=(120, 70, 66))
        d.line([(x - 4, yy + 3), (x - 1, yy + 1)], fill=(120, 136, 104)); d.line([(x + 1, yy + 1), (x + 4, yy + 3)], fill=(120, 136, 104))
noise(im, 6, 2).save(O + 'lh_wallpaper.png')

# ---------------------------------------------------------------- plank floor (shared: Louis, Norah's porch boards)
im = Image.new('RGB', (64, 64), (120, 84, 56)); d = ImageDraw.Draw(im)
for i, y in enumerate(range(0, 64, 8)):
    tone = r.randint(-14, 14)
    d.rectangle([0, y, 63, y + 7], fill=(120 + tone, 84 + tone, 56 + tone // 2)); d.line([(0, y), (63, y)], fill=(70, 48, 32))
    j = (i * 23) % 64; d.line([(j, y), (j, y + 7)], fill=(70, 48, 32))
    for k in range(3):
        gx = r.randint(0, 63); d.line([(gx, y + 2), (min(63, gx + r.randint(4, 12)), y + 2 + r.randint(0, 3))], fill=(100 + tone, 70 + tone, 46))
noise(im, 5, 3).save(O + 'floor_planks.png')

# ---------------------------------------------------------------- checker linoleum, yellowed
im = Image.new('RGB', (32, 32)); d = ImageDraw.Draw(im)
for y in range(0, 32, 8):
    for x in range(0, 32, 8):
        d.rectangle([x, y, x + 7, y + 7], fill=(214, 204, 172) if (x + y) // 8 % 2 == 0 else (92, 84, 70))
noise(im, 7, 4).save(O + 'lino_check.png')

# ---------------------------------------------------------------- book spines (a shelf row)
im = Image.new('RGB', (64, 32), (40, 30, 24)); d = ImageDraw.Draw(im); x = 0
cols = [(120, 30, 30), (40, 60, 90), (60, 80, 50), (150, 120, 70), (90, 50, 70), (30, 30, 34), (170, 150, 110), (80, 40, 30)]
while x < 64:
    w = r.randint(3, 6); h = r.randint(20, 31); c = r.choice(cols)
    d.rectangle([x, 32 - h, x + w - 1, 31], fill=c); d.line([(x, 32 - h + 3), (x + w - 1, 32 - h + 3)], fill=tuple(min(255, v + 60) for v in c))
    d.line([(x, 32 - h + 6), (x + w - 1, 32 - h + 6)], fill=tuple(min(255, v + 40) for v in c)); x += w
im.save(O + 'book_spines.png')

# ---------------------------------------------------------------- the open Bible at John 3, verse 16 underlined twice, a slip of paper
im = Image.new('RGB', (128, 80), (226, 214, 184)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 127, 79], outline=(70, 40, 30), width=3)
d.line([(64, 2), (64, 77)], fill=(150, 130, 100), width=2)
fs = ImageFont.truetype(SERIFB, 8); ft = ImageFont.truetype(SERIF, 5)
d.text((14, 5), 'JOHN', font=fs, fill=(120, 30, 26)); d.text((78, 5), '3', font=fs, fill=(120, 30, 26))
for col in (8, 70):
    for k in range(9):
        y = 17 + k * 6
        w = r.randint(40, 52)
        d.line([(col, y), (col + w, y)], fill=(80, 70, 60))
d.line([(70, 47), (120, 47)], fill=(40, 30, 90)); d.line([(70, 49), (120, 49)], fill=(40, 30, 90))   # 3:16 underlined twice
d.text((70, 39), '16', font=ft, fill=(140, 20, 20))
d.rectangle([92, 60, 124, 76], fill=(244, 238, 210)); d.text((95, 61), 'SAFE:', font=ft, fill=(30, 30, 40)); d.text((95, 68), 'the verse', font=ft, fill=(30, 30, 40))
d.line([(62, 0), (60, 79)], fill=(150, 20, 24), width=2)   # ribbon
im.save(O + 'bible_open.png')

# ---------------------------------------------------------------- the photo: Louis and Norah fixing her porch step (instant-camera print)
im = Image.new('RGB', (64, 48), (236, 232, 220)); d = ImageDraw.Draw(im)
d.rectangle([4, 4, 59, 38], fill=(150, 160, 170))                         # overcast sky
d.rectangle([4, 20, 59, 38], fill=(116, 120, 112))                        # grey siding
d.rectangle([4, 32, 59, 38], fill=(130, 100, 70))                         # porch boards
d.rectangle([22, 33, 40, 36], fill=(196, 160, 110))                       # the new step board
# Louis kneeling with a hammer (dark hair, flannel)
d.rectangle([14, 23, 21, 32], fill=(140, 46, 40)); d.rectangle([15, 17, 20, 22], fill=(214, 176, 150)); d.rectangle([15, 16, 20, 17], fill=(60, 40, 28))
d.line([(21, 27), (26, 31)], fill=(214, 176, 150)); d.line([(25, 29), (27, 33)], fill=(90, 90, 96))
# Norah standing, laughing, white shirt
d.rectangle([40, 18, 46, 31], fill=(236, 232, 222)); d.rectangle([41, 12, 45, 17], fill=(222, 184, 158)); d.rectangle([40, 10, 46, 14], fill=(74, 44, 30))
d.rectangle([40, 31, 46, 37], fill=(40, 40, 48)); d.line([(46, 22), (50, 26)], fill=(222, 184, 158))
d.text((8, 39), 'Sept - step!', font=ImageFont.truetype(SANS, 6), fill=(60, 60, 90))
noise(im, 6, 5).filter(ImageFilter.SMOOTH).save(O + 'photo_porch.png')

# ---------------------------------------------------------------- devotional prints
im = Image.new('RGB', (32, 44), (40, 52, 90)); d = ImageDraw.Draw(im)          # Mary, blue mantle
d.ellipse([6, 2, 26, 22], fill=(220, 190, 90)); d.ellipse([11, 7, 21, 18], fill=(222, 196, 170))
d.polygon([(16, 6), (4, 42), (28, 42)], fill=(52, 86, 160)); d.ellipse([11, 7, 21, 18], fill=(222, 196, 170)); d.polygon([(13, 18), (19, 18), (21, 40), (11, 40)], fill=(230, 226, 214))
noise(im, 5, 6).save(O + 'print_mary.png')
im = Image.new('RGB', (32, 44), (110, 30, 26)); d = ImageDraw.Draw(im)         # Sacred Heart
d.ellipse([9, 4, 23, 16], fill=(214, 182, 156)); d.rectangle([8, 16, 24, 43], fill=(200, 60, 50)); d.polygon([(10, 16), (16, 30), (22, 16)], fill=(236, 220, 200))
d.ellipse([13, 22, 19, 28], fill=(230, 40, 40)); d.line([(16, 18), (16, 22)], fill=(255, 210, 90))
noise(im, 5, 7).save(O + 'print_heart.png')

# ---------------------------------------------------------------- the chapel calendar in Louis's kitchen, every Sunday circled
im = Image.new('RGB', (48, 64), (240, 236, 224)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 47, 26], fill=(120, 140, 160)); d.polygon([(24, 4), (14, 20), (34, 20)], fill=(236, 232, 220)); d.rectangle([22, 1, 26, 8], fill=(236, 232, 220))
d.text((3, 27), 'RED COUNTY', font=ImageFont.truetype(SANS, 5), fill=(120, 30, 26)); d.text((3, 33), 'COMMUNAL CHAPEL', font=ImageFont.truetype(SANS, 4), fill=(120, 30, 26))
for k in range(5):
    for j in range(7):
        x, y = 3 + j * 6, 40 + k * 5
        d.rectangle([x, y, x + 4, y + 3], outline=(170, 170, 160))
        if j == 0: d.ellipse([x - 1, y - 1, x + 5, y + 4], outline=(190, 30, 30))
im.save(O + 'calendar_chapel.png')

# ---------------------------------------------------------------- lace curtain, braided rug, crochet throw, quilt
im = Image.new('RGBA', (32, 32), (230, 226, 210, 255)); d = ImageDraw.Draw(im)
for y in range(0, 32, 8):
    for x in range(0, 32, 8):
        d.ellipse([x + 1, y + 1, x + 6, y + 6], outline=(190, 184, 166)); d.point([(x + 3, y + 3)], fill=(170, 164, 146))
im.save(O + 'curtain_lace.png')
im = Image.new('RGB', (64, 64), (90, 60, 50)); d = ImageDraw.Draw(im)
for k, c in enumerate([(120, 40, 36), (60, 80, 60), (150, 120, 80), (70, 50, 60), (140, 60, 40), (90, 100, 70), (160, 140, 100), (110, 40, 40)]):
    d.ellipse([k * 4, k * 4, 63 - k * 4, 63 - k * 4], outline=c, width=4)
noise(im, 8, 8).save(O + 'rug_braided.png')
im = Image.new('RGB', (32, 32), (170, 60, 50)); d = ImageDraw.Draw(im)
for y in range(0, 32, 8):
    for x in range(0, 32, 8):
        d.rectangle([x + 1, y + 1, x + 6, y + 6], fill=[(200, 160, 60), (60, 100, 70), (170, 60, 50), (220, 210, 180)][(x // 8 + y // 8) % 4])
im.save(O + 'crochet.png')
im = Image.new('RGB', (64, 64), (150, 140, 120)); d = ImageDraw.Draw(im)
for y in range(0, 64, 16):
    for x in range(0, 64, 16):
        c = r.choice([(120, 60, 50), (70, 90, 110), (190, 170, 120), (110, 120, 80), (150, 100, 90)])
        d.rectangle([x, y, x + 15, y + 15], fill=c); d.rectangle([x, y, x + 15, y + 15], outline=(80, 70, 60))
noise(im, 6, 9).save(O + 'quilt.png')

# ---------------------------------------------------------------- Norah's house: cereal box, mail, coat, kid's drawing variants
im = Image.new('RGB', (24, 32), (220, 80, 60)); d = ImageDraw.Draw(im)
d.text((2, 2), 'MARSH', font=ImageFont.truetype(SANS, 6), fill=(255, 240, 120)); d.text((2, 9), 'POPS', font=ImageFont.truetype(SANS, 6), fill=(255, 240, 120))
for k in range(8):
    x, y = r.randint(3, 19), r.randint(17, 28); d.ellipse([x, y, x + 3, y + 3], fill=[(255, 255, 255), (250, 160, 200), (160, 220, 250)][k % 3])
im.save(O + 'cereal_box.png')
im = Image.new('RGB', (32, 20), (236, 230, 214)); d = ImageDraw.Draw(im)
d.rectangle([20, 2, 28, 8], outline=(150, 40, 40)); d.line([(4, 10), (18, 10)], fill=(60, 60, 70)); d.line([(4, 13), (16, 13)], fill=(60, 60, 70))
d.text((3, 2), 'FINAL', font=ImageFont.truetype(SANS, 5), fill=(170, 30, 30))
im.save(O + 'mail_bill.png')

# ---------------------------------------------------------------- the hand-painted refuge signs (plywood, brush letters, big arrow)
def brush_text(d, xy, text, font, fill, jitter=1.2, seed=0):
    rr = random.Random(seed); x, y = xy
    for ch in text:
        dx, dy = rr.uniform(-jitter, jitter), rr.uniform(-jitter, jitter)
        d.text((x + dx, y + dy), ch, font=font, fill=fill)
        d.text((x + dx + 1, y + dy), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + 1
def plywood(w, h, seed):
    rr = random.Random(seed); im = Image.new('RGB', (w, h), (176, 146, 102)); d = ImageDraw.Draw(im)
    for k in range(40):
        y = rr.randint(0, h - 1); d.line([(0, y), (w, y + rr.randint(-3, 3))], fill=(156 + rr.randint(-12, 12), 126 + rr.randint(-12, 12), 86))
    for k in range(4):
        x, y = rr.randint(0, w - 12), rr.randint(0, h - 8); d.ellipse([x, y, x + rr.randint(5, 12), y + rr.randint(3, 7)], fill=(130, 100, 66))
    # rain streaks and grime
    for k in range(25):
        x = rr.randint(0, w - 1); d.line([(x, rr.randint(0, h // 2)), (x, h - 1)], fill=(140, 118, 84))
    return im, d
def sign(name, paint, lines, arrow, seed, sizes=(19, 19, 23, 18)):
    im, d = plywood(256, 176, seed)
    y = 8
    for k, (t, s) in enumerate(zip(lines, sizes)):
        fnt = ImageFont.truetype(SANS, s)
        tw = sum(d.textlength(ch, font=fnt) + 1 for ch in t)
        brush_text(d, ((256 - tw) / 2, y), t, fnt, paint, 1.0, seed + k); y += s + 5
    ay = 148; sgn = 1 if arrow == 'right' else -1
    x0, x1 = (40, 196) if sgn > 0 else (216, 60)
    d.polygon([(x0, ay - 8), (x1, ay - 8), (x1, ay - 20), (x1 + sgn * 30, ay), (x1, ay + 20), (x1, ay + 8), (x0, ay + 8)], fill=paint)
    rr = random.Random(seed)
    for k in range(10):
        x = rr.randint(10, 246); y0 = rr.randint(20, 150); d.line([(x, y0), (x, y0 + rr.randint(4, 14))], fill=paint)
    im.save(O + name + '.png')
LINES = ['ALL MAY TAKE', 'REFUGE IN THE', 'RED COUNTY', 'COMMUNAL CHAPEL']
sign('refuge_sign_a', (236, 232, 222), LINES, 'right', 21)
sign('refuge_sign_b', (190, 34, 30), LINES, 'right', 22)
sign('refuge_sign_c', (236, 232, 222), LINES, 'left', 23)
im, d = plywood(256, 128, 30)                                         # the last one, at the junction: huge arrow, few words
brush_text(d, (18, 6), 'REFUGE', ImageFont.truetype(SANS, 40), (190, 34, 30), 1.5, 31)
brush_text(d, (22, 52), 'CHAPEL', ImageFont.truetype(SANS, 26), (236, 232, 222), 1.2, 32)
d.polygon([(150, 70), (196, 70), (196, 48), (246, 92), (196, 124), (196, 104), (150, 104)], fill=(236, 232, 222))
brush_text(d, (22, 88), 'ALL MAY COME', ImageFont.truetype(SANS, 14), (236, 232, 222), 0.8, 33)
im.save(O + 'refuge_sign_junction.png')
print('ok')

# ---------------------------------------------------------------- Norah's photos of Addie (hall, living room) and the fridge drawing
def kid(d, x, y, s=1.0, shirt=(230, 120, 160)):
    d.rectangle([x - 3 * s, y, x + 3 * s, y + 8 * s], fill=shirt); d.ellipse([x - 3 * s, y - 7 * s, x + 3 * s, y], fill=(232, 196, 170))
    d.rectangle([x - 4 * s, y - 8 * s, x + 4 * s, y - 5 * s], fill=(120, 80, 46)); d.rectangle([x - 4 * s, y - 6 * s, x - 3 * s, y + 1 * s], fill=(120, 80, 46))
    d.rectangle([x + 3 * s, y - 6 * s, x + 4 * s, y + 1 * s], fill=(120, 80, 46))
    d.point([(x - 1 * s, y - 4 * s), (x + 1 * s, y - 4 * s)], fill=(40, 30, 30))
def mom(d, x, y):
    d.rectangle([x - 4, y, x + 4, y + 14], fill=(236, 232, 222)); d.ellipse([x - 3, y - 8, x + 3, y], fill=(222, 184, 158))
    d.rectangle([x - 4, y - 9, x + 4, y - 5], fill=(74, 44, 30)); d.rectangle([x - 5, y - 6, x - 3, y + 6], fill=(74, 44, 30)); d.rectangle([x + 3, y - 6, x + 5, y + 6], fill=(74, 44, 30))
im = Image.new('RGB', (40, 50), (150, 170, 190)); d = ImageDraw.Draw(im)                                  # first day of kindergarten
d.rectangle([0, 30, 39, 49], fill=(170, 160, 140)); d.rectangle([4, 6, 36, 28], fill=(160, 70, 60)); d.rectangle([14, 16, 24, 29], fill=(90, 60, 40))
kid(d, 20, 32, 1.4, (120, 160, 220)); d.rectangle([24, 36, 28, 44], fill=(160, 100, 200))                     # backpack (Pickle's on it)
noise(im, 5, 40).save(O + 'addie_school.png')
im = Image.new('RGB', (56, 40), (160, 196, 220)); d = ImageDraw.Draw(im)                                  # the lake
d.rectangle([0, 18, 55, 28], fill=(70, 110, 140)); d.rectangle([0, 28, 55, 39], fill=(190, 170, 130)); d.polygon([(0, 18), (14, 8), (30, 18)], fill=(80, 100, 80))
mom(d, 22, 22); kid(d, 33, 28, 1.0, (250, 210, 80)); d.line([(26, 25), (30, 28)], fill=(222, 184, 158))
noise(im, 5, 41).save(O + 'addie_lake.png')
im = Image.new('RGB', (48, 40), (190, 160, 130)); d = ImageDraw.Draw(im)                                  # birthday: the cake says 6/12
d.rectangle([0, 26, 47, 39], fill=(150, 110, 80)); d.ellipse([12, 20, 38, 30], fill=(250, 240, 236)); d.rectangle([12, 24, 38, 32], fill=(250, 240, 236))
d.text((16, 23), '6/12', font=ImageFont.truetype(SANS, 6), fill=(236, 110, 160))
for x in (18, 25, 32): d.line([(x, 16), (x, 21)], fill=(120, 170, 230)); d.point([(x, 15)], fill=(255, 210, 90))
kid(d, 25, 8, 0.9, (236, 120, 160))
noise(im, 5, 42).save(O + 'addie_birthday.png')
im = Image.new('RGB', (40, 50), (220, 214, 200)); d = ImageDraw.Draw(im)                                  # bringing her home
mom(d, 20, 16); d.ellipse([16, 22, 28, 30], fill=(250, 220, 230)); d.ellipse([22, 22, 27, 27], fill=(232, 196, 170))
d.rectangle([0, 40, 39, 49], fill=(120, 140, 160))
noise(im, 4, 43).save(O + 'addie_baby.png')
im = Image.new('RGB', (48, 40), (250, 250, 244)); d = ImageDraw.Draw(im)                                  # PICKLE, in crayon
d.ellipse([10, 14, 30, 30], fill=(150, 80, 200)); d.polygon([(12, 16), (14, 8), (18, 15)], fill=(150, 80, 200)); d.polygon([(22, 15), (26, 8), (28, 16)], fill=(150, 80, 200))
d.line([(30, 24), (38, 18), (44, 22), (46, 14)], fill=(150, 80, 200), width=2); d.point([(16, 20), (24, 20)], fill=(0, 0, 0))
d.text((6, 31), 'PICKLE', font=ImageFont.truetype(SANS, 7), fill=(230, 60, 60))
im.save(O + 'fridge_pickle.png')
print('ok2')
