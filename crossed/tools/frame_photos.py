#!/usr/bin/env python3
"""Turns the photo-studio renders (tests/captures/photo_raw_*.png, from tests/photo_studio.tscn) into instant photos:
downsampled, warmed or sepia-toned, grain and a soft vignette, a white border with a handwritten caption.
Writes the large versions to assets/textures/docs/ (the document viewer) and small ones over the in-world frame textures."""
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, 'tests', 'captures'); TX = os.path.join(ROOT, 'assets', 'textures')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf'
if not os.path.exists(FONT): FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SPECS = {  # id: (doc name, in-world texture, caption, tone)
    'louis_addie': ('photo_louis_addie', 'photo_porch', 'Step fixed!', 'warm'),
    'louis_rose': ('photo_louis_rose', None, 'Louis & Rose', 'warm'),
    'storm': ('photo_storm', None, 'After the storm', 'cool'),
    'birthday': ('photo_birthday', 'addie_birthday', 'Addie!', 'warm'),
    'school': ('photo_school', 'addie_school', 'First day!', 'warm'),
    'lake': ('photo_lake', 'addie_lake', 'Lake Ruth', 'cool'),
    'christmas': ('photo_christmas', 'addie_baby', 'Christmas morning', 'warm'),
}
for pid, (doc, world, cap, tone) in SPECS.items():
    src = os.path.join(CAP, 'photo_raw_%s.png' % pid)
    if not os.path.exists(src): continue
    im = Image.open(src).convert('RGB').resize((192, 144), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(0.9)
    px = im.load(); rr = random.Random(hash(pid) & 0xffff)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            if tone == 'sepia':
                l = 0.3 * r + 0.59 * g + 0.11 * b; r, g, b = l * 1.07 + 18, l * 0.95 + 8, l * 0.78
            elif tone == 'warm': r, g, b = r * 1.04 + 8, g * 1.0 + 3, b * 0.9
            else: r, g, b = r * 0.97, g, b * 1.04 + 4
            dx, dy = (x - 96) / 96.0, (y - 72) / 72.0
            v = 1.0 - 0.28 * (dx * dx + dy * dy)
            n = rr.randint(-9, 9)
            px[x, y] = tuple(max(0, min(255, int(c * v + n))) for c in (r, g, b))
    im = im.filter(ImageFilter.SMOOTH)
    out = Image.new('RGB', (208, 196), (238, 234, 222)); out.paste(im, (8, 8))
    d = ImageDraw.Draw(out); d.text((12, 162), cap, font=ImageFont.truetype(FONT, 14), fill=(40, 44, 80))
    out.save(os.path.join(TX, 'docs', doc + '.png'))
    if world:   # the frames on the walls: just the picture, small
        w0 = Image.open(os.path.join(TX, world + '.png')).size
        im.resize((max(64, w0[0]), max(48, w0[1])), Image.LANCZOS).save(os.path.join(TX, world + '.png'))
    print('framed', pid)
