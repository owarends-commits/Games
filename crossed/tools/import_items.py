#!/usr/bin/env python3
"""Bring an Item Modeler export into the game.

    python3 tools/import_items.py path/to/extrecated_items.json

Writes
  data/items/items.json                 the items (parts, examine points, pose, text) the game builds 3D models from
  assets/textures/items/b_*.png         the modeler's built-in 32 px textures, redrawn pixel-for-pixel from its generators
  assets/textures/items/u_<id>.png      any textures you painted yourself in the modeler (decoded from the export)

Run Godot with --import afterwards so new textures are registered.
The game reads names, descriptions, examine points and notes from items.json, so later exports just replace it.
"""
import base64, json, math, os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX_DIR = os.path.join(ROOT, "assets", "textures", "items")
OUT_JSON = os.path.join(ROOT, "data", "items", "items.json")


# ------------------------------------------------------------------ the modeler's random numbers (mulberry32)
def _i32(v):
    v &= 0xFFFFFFFF
    return v - 0x100000000 if v & 0x80000000 else v

def _imul(a, b):
    return _i32((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF))

def _ushr(a, n):
    return (a & 0xFFFFFFFF) >> n

def rnd(seed):
    st = [seed]
    def f():
        a = _i32(st[0])
        a = _i32(a + 0x6D2B79F5)
        st[0] = a
        t = _imul(a ^ _ushr(a, 15), 1 | a)
        t = _i32(t + _imul(t ^ _ushr(t, 7), 61 | t)) ^ t
        return (_ushr(t ^ _ushr(t, 14), 0)) / 4294967296.0
    return f


# ------------------------------------------------------------------ a tiny stand-in for the canvas calls the generators use
def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

class G:
    def __init__(self, s):
        self.s = s
        self.px = [[(0, 0, 0)] * s for _ in range(s)]
        self.col = (0, 0, 0)
        self.alpha = 1.0

    def fill(self, c):
        if isinstance(c, str) and c.startswith("rgba"):
            r, g, b, a = [float(x) for x in re.findall(r"[\d.]+", c)]
            self.col, self.alpha = (r, g, b), a
        elif isinstance(c, str) and c.startswith("rgb"):
            self.col, self.alpha = tuple(round(float(x)) for x in re.findall(r"[-\d.]+", c)), 1.0
        else:
            self.col, self.alpha = hexc(c), 1.0

    def rect(self, x, y, w, h):
        x0, y0 = int(math.floor(x)), int(math.floor(y))
        for yy in range(max(0, y0), min(self.s, y0 + int(h))):
            row = self.px[yy]
            for xx in range(max(0, x0), min(self.s, x0 + int(w))):
                if self.alpha >= 1.0:
                    row[xx] = self.col
                else:
                    o = row[xx]
                    row[xx] = tuple(o[i] * (1 - self.alpha) + self.col[i] * self.alpha for i in range(3))

    def plot(self, x, y, c, a):
        if 0 <= x < self.s and 0 <= y < self.s:
            o = self.px[y][x]
            self.px[y][x] = tuple(o[i] * (1 - a) + c[i] * a for i in range(3))

    def image(self):
        im = Image.new("RGB", (self.s, self.s))
        im.putdata([tuple(max(0, min(255, int(round(v)))) for v in p) for row in self.px for p in row])
        return im

def noise(g, s, amt, seed):
    r = rnd(seed)
    for y in range(s):
        for x in range(s):
            n = (r() - 0.5) * amt
            p = g.px[y][x]
            g.px[y][x] = tuple(max(0, min(255, round(v + n))) for v in p)

def streaks(g, s, col, n, seed, vertical=False):
    r = rnd(seed)
    g.fill(col)
    for _ in range(n):
        a = int(r() * s); b = int(r() * s); L = 3 + int(r() * s * 0.6)
        if vertical: g.rect(a, b, 1, L)
        else: g.rect(b, a, L, 1)

def t_brushed(g, s):
    g.fill("#8c9096"); g.rect(0, 0, s, s); streaks(g, s, "#a6aab0", 40, 1); streaks(g, s, "#6e7278", 30, 2); noise(g, s, 8, 3)
def t_blued(g, s):
    g.fill("#2a2e36"); g.rect(0, 0, s, s); streaks(g, s, "#3c4250", 30, 4); noise(g, s, 10, 5); g.fill("#5a5e66")
    for i in range(6): g.rect(int(rnd(i)() * s), int(rnd(i + 9)() * s), 2, 1)
def t_brass(g, s):
    g.fill("#b08a3a"); g.rect(0, 0, s, s); streaks(g, s, "#d0aa58", 30, 6); streaks(g, s, "#7a5a24", 16, 7); noise(g, s, 10, 8)
def t_chrome(g, s):
    stops = [(0, hexc("#e8ecf0")), (.45, hexc("#8a9098")), (.55, hexc("#cfd4da")), (1, hexc("#5a6068"))]
    for y in range(s):
        t = (y + 0.5) / s
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0])
                c = tuple(stops[i][1][j] + (stops[i + 1][1][j] - stops[i][1][j]) * k for j in range(3))
        for x in range(s): g.px[y][x] = c
    noise(g, s, 6, 9)
def t_rust(g, s):
    g.fill("#6a3a22"); g.rect(0, 0, s, s); noise(g, s, 46, 10); r = rnd(11)
    for _ in range(40):
        g.fill("#8a4a26" if r() < .5 else "#3e2416"); g.rect(int(r() * s), int(r() * s), 2, 2)
def t_plastic(g, s):
    g.fill("#1c1d20"); g.rect(0, 0, s, s); noise(g, s, 10, 12)
def t_rubber(g, s):
    g.fill("#18181a"); g.rect(0, 0, s, s); g.fill("#2a2a2e")
    for y in range(0, s, 4):
        for x in range((y // 4) % 2 * 2, s, 4): g.rect(x, y, 2, 2)
def t_wood(g, s):
    r = rnd(13)
    for y in range(s):
        t = math.sin(y * .7 + math.sin(y * .13) * 3) * 14
        g.fill("rgb(%f,%f,%f)" % (118 + t, 80 + t * .8, 50 + t * .5)); g.rect(0, y, s, 1)
    noise(g, s, 10, 14); g.fill("#4a3020"); g.rect(int(r() * s), 0, 1, s)
def t_walnut(g, s):
    for y in range(s):
        t = math.sin(y * .9 + math.sin(y * .2) * 2) * 10
        g.fill("rgb(%f,%f,%f)" % (70 + t, 44 + t * .7, 28 + t * .4)); g.rect(0, y, s, 1)
    noise(g, s, 10, 15)
def t_checkered(g, s):
    g.fill("#4a2e1c"); g.rect(0, 0, s, s); c = hexc("#2a1a10")
    for i in range(-s, s * 2, 3):
        for k in range(s):          # the two diagonals of each criss-cross pass, as 1 px lines
            g.plot(i + k, k, c, .75); g.plot(i + k, s - 1 - k, c, .75)
    noise(g, s, 8, 16)
def t_leather(g, s):
    g.fill("#5a3424"); g.rect(0, 0, s, s); noise(g, s, 30, 17); g.fill("#3e2216"); r = rnd(18)
    for _ in range(24): g.rect(int(r() * s), int(r() * s), 1 + int(r() * 3), 1)
def t_bleather(g, s):
    g.fill("#1e1a18"); g.rect(0, 0, s, s); noise(g, s, 18, 19)
def t_paper(g, s):
    g.fill("#e6dfcc"); g.rect(0, 0, s, s); noise(g, s, 10, 20)
def t_lined(g, s):
    g.fill("#e8e2d0"); g.rect(0, 0, s, s); g.fill("#9ab0c8")
    for y in range(5, s, 4): g.rect(0, y, s, 1)
    g.fill("#c86a6a"); g.rect(4, 0, 1, s); noise(g, s, 6, 21)
def t_cardboard(g, s):
    g.fill("#a88454"); g.rect(0, 0, s, s); noise(g, s, 16, 22); g.fill("#8a6a40")
    for x in range(0, s, 3): g.rect(x, 0, 1, s)
def t_pill(g, s):
    g.fill("#f2efe6"); g.rect(0, 0, s, s); g.fill("#2a2a2a")
    for y in range(6, s - 4, 4): g.rect(3, y, s - 6 - ((y * 7) % 9), 1)
    g.fill("#c83a2a"); g.rect(0, 0, s, 3)
def t_cloth(g, s):
    g.fill("#6a6458"); g.rect(0, 0, s, s)
    for y in range(0, s, 2): g.fill("rgba(0,0,0,.18)"); g.rect(0, y, s, 1)
    for x in range(0, s, 2): g.fill("rgba(255,255,255,.06)"); g.rect(x, 0, 1, s)
def t_knurled(g, s):
    g.fill("#3a3c40"); g.rect(0, 0, s, s); g.fill("#5a5e64")
    for y in range(0, s, 2):
        for x in range((y // 2) % 2, s, 2): g.rect(x, y, 1, 1)
def t_bone(g, s):
    g.fill("#d8cfb4"); g.rect(0, 0, s, s); noise(g, s, 18, 23)
def t_photo(g, s):
    g.fill("#f0ece0"); g.rect(0, 0, s, s); g.fill("#5a6a7a"); g.rect(2, 2, s - 4, int(s * .72)); g.fill("#c8a070")
    g.rect(int(s * .3), int(s * .3), 4, 9); g.rect(int(s * .6), int(s * .36), 3, 7); noise(g, s, 8, 24)

TEXGEN = {"Brushed metal": t_brushed, "Blued steel": t_blued, "Brass": t_brass, "Chrome": t_chrome, "Rust": t_rust,
          "Black plastic": t_plastic, "Rubber grip": t_rubber, "Wood": t_wood, "Dark walnut": t_walnut,
          "Checkered grip": t_checkered, "Leather": t_leather, "Black leather": t_bleather, "Paper": t_paper,
          "Lined paper": t_lined, "Cardboard": t_cardboard, "Pill label": t_pill, "Cloth": t_cloth, "Knurled": t_knurled,
          "Bone": t_bone, "Photo": t_photo}

def slug(name):
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def main(src):
    exp = json.load(open(src))
    assert exp.get("app") == "extrecated-item-modeler", "not an Item Modeler export"
    os.makedirs(TEX_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    files = {}
    for name, fn in TEXGEN.items():
        g = G(32); fn(g, 32)
        p = os.path.join(TEX_DIR, "b_%s.png" % slug(name))
        g.image().save(p)
        files["b:" + name] = "res://assets/textures/items/b_%s.png" % slug(name)
    for t in exp.get("textures", []):
        m = re.match(r"data:image/\w+;base64,(.*)", t.get("data", ""), re.S)
        if not m: continue
        p = os.path.join(TEX_DIR, "u_%s.png" % t["id"])
        open(p, "wb").write(base64.b64decode(m.group(1)))
        Image.open(p).convert("RGBA").save(p)       # normalise whatever the browser wrote
        files[t["id"]] = "res://assets/textures/items/u_%s.png" % t["id"]
    out = {"source": os.path.basename(src), "exported": exp.get("exported"), "units": exp.get("units"), "axes": exp.get("axes"),
           "textures": files,
           "texture_names": {t["id"]: t.get("name", t["id"]) for t in exp.get("textures", [])},
           "items": {it["key"]: it for it in exp["items"]}}
    json.dump(out, open(OUT_JSON, "w"), indent=1)
    used = sorted({p["t"] for it in exp["items"] for p in it["parts"] if p.get("t")})
    missing = [u for u in used if u not in files]
    print("items:", ", ".join(out["items"]))
    print("textures written:", len(files), " used:", used, " missing:", missing)
    notes = [(it["key"], p.get("partName", ""), p["text"]) for it in exp["items"] for p in it.get("pins", []) if p["kind"] == "note"]
    notes += [(it["key"], "(item)", it["notes"]) for it in exp["items"] if it.get("notes")]
    notes += [(it["key"], p["name"], p["note"]) for it in exp["items"] for p in it["parts"] if p.get("note")]
    for n in notes: print("note for Claude:", *n)


if __name__ == "__main__":
    main(sys.argv[1])
