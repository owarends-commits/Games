#!/usr/bin/env python3
"""The Map Designer's asset library: one source for the designer (tools/map_designer.html) and the game
(data/maps/designer_assets.json, which tools/build_ch1_map.py builds props from).

    python3 tools/designer_library.py          writes the JSON and splices the library + textures into the designer

An asset is {name, cat, parts, [search], [light]}.
  part: s (box | cyl | cone | sphere | wedge), p centre (m), d size (m), c colour, r rotation (deg, XYZ), t texture id, seg (round sides)
  Assets stand on y = 0 and face +Z (their front, drawers, the seat of a chair, the screen of a TV).
  search: True  -> Norah can search it (storage); the designer marks these and the export lists them.
  light: {p, color, energy, range} -> the asset glows (lamps); a light in the designer's 3D view and in the game.
Textures are ids from the game's sets: md (b:planks ...), v11 (b:oak_planks ...), v12 (b:whitewash_worn ...).
"""
import base64, glob, io, json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ------------------------------------------------------------------ texture ids
OAK, WALNUT, PINE, PEW = 'b:furniture_oak', 'b:furniture_walnut', 'b:pine_planks', 'b:pew_oak'
CEDAR, LAM, PAINTED = 'b:cedar', 'b:laminate_wood', 'b:painted_white_wood'
LINEN, ALTARLIN, VELR, VELP, BROC, BROCW = 'b:linen_white', 'b:altar_linen', 'b:velvet_red', 'b:velvet_purple', 'b:brocade_red', 'b:brocade_white'
GOLD, BRASS, MARW, MARG, CSTONE, WAX = 'b:gold_leaf', 'b:brass_tarnished', 'b:marble_white', 'b:marble_grey', 'b:church_stone', 'b:candle_wax'
GLASS_ST, GLASS_BL = 'b:stained_glass_v12', 'b:stained_glass_blue'
STONE, MOSSY, GRAN, GRAND, GRANP, IRON, SOIL = 'b:old_stone', 'b:old_stone_mossy', 'b:granite_grey', 'b:granite_dark', 'b:granite_pink', 'b:cast_iron', 'b:grave_soil'
HEDGE, DEADB, FLOW, FLOWW, DEADF, ROSES = 'b:hedge_leaves', 'b:dead_brush', 'b:flower_bed', 'b:flowers_white', 'b:dead_flowers', 'b:roses_red'
LEAVES_G, LEAVES_O, LEAVES_GOLD, LEAVES_B, NEEDLES = 'b:leaves_green', 'b:leaves_orange', 'b:leaves_gold', 'b:leaves_brown', 'b:needles'
BARK, BARKP, BARKB, LOGEND = 'b:bark_oak', 'b:bark_pine', 'b:bark_birch', 'b:log_end'
CRATE, TRUNK, CARD, LOCKER = 'b:crate_slats', 'b:trunk_canvas', 'b:cardboard', 'b:locker_steel'
LEATH, LEATHB, FLORAL, PLAID, QUILT, TICK = 'b:leather_brown', 'b:leather_black', 'b:fabric_floral', 'b:fabric_plaid', 'b:quilt', 'b:mattress_ticking'
STEELG, STEEL, FILING, CORK, CHALK, PAPER = 'b:steel_green', 'b:steel_grey', 'b:filing_cabinet', 'b:corkboard', 'b:chalkboard', 'b:paper_stack'
CONC, RUST, BRICK, TILE, PLASTER = 'b:concrete_v11', 'b:metal_rust', 'b:brick_red', 'b:tile_white', 'b:plaster_v11'
CARPET_B, CARPET_R = 'b:carpet_blue', 'b:carpet_brown'
WEATHER, PORCH, SHINGLE = 'b:weathered_boards', 'b:porch_boards', 'b:shingle_dark'

def P(s, p, d, c, r=None, t='', seg=None):
    o = {'s': s, 'p': [round(v, 4) for v in p], 'd': [round(v, 4) for v in d], 'c': c, 'r': list(r or [0, 0, 0]), 't': t}
    if seg: o['seg'] = seg
    return o

A = {}
def add(key, name, cat, parts, search=False, light=None, solid=None):
    a = {'name': name, 'cat': cat, 'parts': parts}
    if search: a['search'] = True
    if light: a['light'] = light
    if solid is not None: a['solid'] = solid
    A[key] = a

# ------------------------------------------------------------------ helpers
def legs4(w, d, h, th, c, t='', inset=0.04, y0=0.0, shape='box'):
    out = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            x = sx * (w / 2 - inset - th / 2); z = sz * (d / 2 - inset - th / 2)
            out.append(P(shape, [x, y0 + h / 2, z], [th, h, th], c, t=t, seg=8 if shape == 'cyl' else None))
    return out

def drawer_fronts(w, x0, y0, z, rows, rh, c='#2a1a10', knob='#b09050', cols=1, gap=0.02):
    out = []
    cw = (w - gap * (cols + 1)) / cols
    for r in range(rows):
        y = y0 + rh * (r + 0.5)
        for k in range(cols):
            x = x0 - w / 2 + gap + cw * (k + 0.5) + gap * k
            out.append(P('box', [x, y, z], [cw, rh - gap, 0.012], c))
            out.append(P('cyl', [x, y, z + 0.012], [0.03, 0.02, 0.03], knob, [90, 0, 0], seg=6))
    return out

def cabinet_box(w, h, d, t, c='#6a4a30', top=None, plinth=0.06):
    return [P('box', [0, plinth / 2, -0.01], [w - 0.04, plinth, d - 0.04], '#1e1610'),
            P('box', [0, plinth + (h - plinth) / 2, 0], [w, h - plinth, d], c, t=t)] + \
           ([P('box', [0, h + 0.012, 0], [w + 0.03, 0.024, d + 0.03], c, t=top)] if top else [])

def candle(x, y, z, h=0.25, r=0.035, lit=True):
    out = [P('cyl', [x, y + h / 2, z], [r * 2, h, r * 2], '#efe6cc', t=WAX, seg=8)]
    if lit: out.append(P('cone', [x, y + h + 0.025, z], [0.018, 0.05, 0.018], '#ffd27a', seg=6))
    return out

def cross_shape(cx, y0, cz, h, w, th, c, t='', depth=None):
    depth = depth or th
    return [P('box', [cx, y0 + h / 2, cz], [th, h, depth], c, t=t), P('box', [cx, y0 + h * 0.7, cz], [w, th, depth], c, t=t)]

def bush_blob(x, z, w, h, t=HEDGE, c='#34422a', n=5, seed=1, y0=0.0):
    rng = __import__('random').Random(seed)
    out = []
    for i in range(n):
        a = rng.uniform(0, 6.28); r = rng.uniform(0, w * 0.28)
        sw = w * rng.uniform(0.45, 0.7); sh = h * rng.uniform(0.55, 0.85)
        out.append(P('sphere', [x + math.cos(a) * r, y0 + sh / 2 + rng.uniform(0, h - sh), z + math.sin(a) * r], [sw, sh, sw * rng.uniform(0.8, 1.1)], c, t=t, seg=8))
    return out

def flowers(x0, z0, w, d, n, cols, stem='#3a5a2a', h=(0.25, 0.45), seed=3, dead=False):
    rng = __import__('random').Random(seed)
    out = []
    for i in range(n):
        x = x0 + rng.uniform(-w / 2, w / 2); z = z0 + rng.uniform(-d / 2, d / 2); hh = rng.uniform(*h)
        tilt = [rng.uniform(-12, 12), 0, rng.uniform(-12, 12)]
        if dead: tilt = [rng.uniform(25, 60) * rng.choice([-1, 1]), 0, rng.uniform(-30, 30)]
        out.append(P('box', [x, hh / 2, z], [0.012, hh, 0.012], stem if not dead else '#5a5034', tilt))
        col = rng.choice(cols)
        hx_ = x + math.sin(math.radians(tilt[2])) * -hh * 0.5; hz = z + math.sin(math.radians(tilt[0])) * hh * 0.5
        hy = hh * (0.95 if not dead else 0.75)
        out.append(P('sphere', [hx_, hy, hz], [0.07, 0.05 if not dead else 0.04, 0.07], col, seg=6))
    return out

def grave_mound(w=0.9, d=1.9, t=SOIL, c='#3a2e22', grass=False):
    return [P('box', [0, 0.06, 0.95], [w, 0.12, d], c if not grass else '#3e4a2e', [0, 0, 0], t if not grass else 'b:grass_dead')]

# ================================================================== INDOOR (the original set, rebuilt)
add('bed_twin', 'Bed, twin', 'indoor', [
    P('box', [0, 0.2, 0], [1.0, 0.16, 2.0], '#4a3626', t=WALNUT),
    *legs4(1.0, 2.0, 0.14, 0.06, '#3a2818', WALNUT, inset=0.0),
    P('box', [0, 0.36, 0.03], [0.94, 0.17, 1.9], '#d8d2c0', t=TICK),
    P('box', [0, 0.47, 0.18], [0.98, 0.07, 1.6], '#8a3a3a', t=QUILT),
    P('box', [0, 0.49, -0.74], [0.7, 0.1, 0.32], '#e8e2d4', t=LINEN),
    P('box', [0, 0.6, -0.99], [1.04, 0.8, 0.06], '#4a3626', t=WALNUT),
    P('box', [0, 0.38, 0.99], [1.04, 0.42, 0.05], '#4a3626', t=WALNUT)])
add('bed_double', 'Bed, double', 'indoor', [
    P('box', [0, 0.2, 0], [1.45, 0.16, 2.0], '#4a3626', t=WALNUT),
    *legs4(1.45, 2.0, 0.14, 0.07, '#3a2818', WALNUT, inset=0.0),
    P('box', [0, 0.37, 0.03], [1.39, 0.18, 1.92], '#d8d2c0', t=TICK),
    P('box', [0, 0.49, 0.2], [1.44, 0.07, 1.58], '#9a8a70', t=QUILT),
    P('box', [-0.35, 0.51, -0.76], [0.55, 0.11, 0.32], '#e8e2d4', t=LINEN), P('box', [0.35, 0.51, -0.76], [0.55, 0.11, 0.32], '#e8e2d4', t=LINEN),
    P('box', [0, 0.65, -0.99], [1.5, 0.95, 0.07], '#4a3626', t=WALNUT), P('box', [0, 1.14, -0.99], [1.56, 0.05, 0.1], '#3a2818', t=WALNUT),
    P('box', [0, 0.4, 0.99], [1.5, 0.46, 0.06], '#4a3626', t=WALNUT)])
add('couch', 'Couch', 'indoor', [
    P('box', [0, 0.12, 0.02], [2.0, 0.14, 0.82], '#3a2e20'),
    P('box', [0, 0.27, 0.06], [1.72, 0.2, 0.72], '#6a6046', t=PLAID),
    *[P('box', [x, 0.42, 0.1], [0.56, 0.12, 0.62], '#6a6046', t=PLAID) for x in (-0.58, 0, 0.58)],
    *[P('box', [x, 0.66, -0.26], [0.56, 0.44, 0.16], '#6a6046', [-10, 0, 0], PLAID) for x in (-0.58, 0, 0.58)],
    P('box', [0, 0.5, -0.36], [2.0, 0.66, 0.12], '#5e553e', t=PLAID),
    P('box', [-0.93, 0.36, 0.04], [0.16, 0.5, 0.84], '#5e553e', t=PLAID), P('box', [0.93, 0.36, 0.04], [0.16, 0.5, 0.84], '#5e553e', t=PLAID),
    *legs4(1.96, 0.8, 0.06, 0.05, '#2a1e14', inset=0.04)])
add('armchair', 'Armchair', 'indoor', [
    P('box', [0, 0.14, 0.03], [0.82, 0.18, 0.78], '#5a3e38'),
    P('box', [0, 0.32, 0.08], [0.6, 0.16, 0.62], '#6a4a44', t=FLORAL),
    P('box', [0, 0.7, -0.3], [0.66, 0.66, 0.16], '#6a4a44', [-8, 0, 0], FLORAL),
    P('box', [-0.36, 0.42, 0.04], [0.13, 0.36, 0.76], '#5a3e38', t=FLORAL), P('box', [0.36, 0.42, 0.04], [0.13, 0.36, 0.76], '#5a3e38', t=FLORAL),
    P('box', [-0.33, 0.95, -0.3], [0.12, 0.2, 0.18], '#5a3e38', t=FLORAL), P('box', [0.33, 0.95, -0.3], [0.12, 0.2, 0.18], '#5a3e38', t=FLORAL),
    *legs4(0.8, 0.76, 0.06, 0.05, '#2a1e14', inset=0.04)])
add('table', 'Table', 'indoor', [
    P('box', [0, 0.735, 0], [1.2, 0.04, 0.78], '#7a5a3a', t=OAK),
    P('box', [0, 0.68, 0], [1.08, 0.08, 0.66], '#5a4028', t=OAK),
    *legs4(1.2, 0.78, 0.68, 0.06, '#5a4028', OAK, inset=0.07)])
add('chair', 'Chair', 'indoor', [
    P('box', [0, 0.45, 0.02], [0.44, 0.04, 0.42], '#6a4a30', t=OAK),
    *legs4(0.44, 0.42, 0.44, 0.04, '#4a3420', OAK, inset=0.02),
    P('box', [-0.19, 0.72, -0.2], [0.04, 0.54, 0.04], '#4a3420', t=OAK), P('box', [0.19, 0.72, -0.2], [0.04, 0.54, 0.04], '#4a3420', t=OAK),
    P('box', [0, 0.92, -0.2], [0.42, 0.1, 0.03], '#6a4a30', t=OAK), P('box', [0, 0.74, -0.2], [0.42, 0.06, 0.025], '#6a4a30', t=OAK),
    P('box', [0, 0.2, 0.02], [0.38, 0.025, 0.025], '#4a3420')])
add('counter', 'Kitchen counter', 'indoor', [
    *cabinet_box(1.2, 0.86, 0.6, PAINTED, '#7a6a52'),
    P('box', [0, 0.885, 0], [1.24, 0.05, 0.64], '#a09478', t='b:lino_beige'),
    P('box', [-0.3, 0.68, 0.302], [0.56, 0.14, 0.01], '#8a7a62'), P('box', [0.3, 0.68, 0.302], [0.56, 0.14, 0.01], '#8a7a62'),
    P('box', [-0.3, 0.33, 0.302], [0.56, 0.5, 0.01], '#8a7a62'), P('box', [0.3, 0.33, 0.302], [0.56, 0.5, 0.01], '#8a7a62'),
    *[P('box', [x, 0.68, 0.315], [0.12, 0.02, 0.02], '#b0b0a8') for x in (-0.3, 0.3)]], search=True)
add('fridge', 'Fridge', 'indoor', [
    P('box', [0, 0.88, 0], [0.7, 1.76, 0.7], '#d8d4c8'),
    P('box', [0, 1.3, 0.352], [0.68, 0.86, 0.01], '#e2ded2'), P('box', [0, 0.42, 0.352], [0.68, 0.82, 0.01], '#e2ded2'),
    P('box', [0.27, 1.05, 0.38], [0.03, 0.34, 0.04], '#9a9a94'), P('box', [0.27, 0.62, 0.38], [0.03, 0.3, 0.04], '#9a9a94'),
    P('box', [0, 0.04, 0.33], [0.6, 0.08, 0.04], '#3a3a38')], search=True)
add('stove', 'Stove', 'indoor', [
    P('box', [0, 0.45, 0], [0.62, 0.9, 0.62], '#e0ddd4'),
    P('box', [0, 0.38, 0.312], [0.5, 0.36, 0.01], '#2a2a2a'), P('box', [0, 0.6, 0.33], [0.5, 0.03, 0.03], '#9a9a94'),
    P('box', [0, 1.0, -0.28], [0.62, 0.2, 0.06], '#e0ddd4'),
    *[P('cyl', [x, 0.91, z], [0.18, 0.015, 0.18], '#1e1e1e', seg=10) for x in (-0.15, 0.15) for z in (-0.12, 0.15)],
    *[P('cyl', [x, 0.82, 0.32], [0.04, 0.03, 0.04], '#2a2a2a', [90, 0, 0], seg=8) for x in (-0.2, -0.07, 0.07, 0.2)]])
add('sink', 'Sink (bathroom)', 'indoor', [
    P('cyl', [0, 0.38, 0], [0.16, 0.76, 0.16], '#e4e4de', seg=10),
    P('box', [0, 0.8, 0.02], [0.52, 0.12, 0.42], '#e4e4de', t=TILE),
    P('box', [0, 0.85, 0.04], [0.38, 0.03, 0.26], '#9aa0a0'),
    P('cyl', [0, 0.92, -0.14], [0.03, 0.1, 0.03], '#b8bcc0', seg=6),
    P('box', [0, 1.35, -0.2], [0.46, 0.58, 0.03], '#2a3440', t='b:glass'), P('box', [0, 1.35, -0.21], [0.5, 0.62, 0.02], '#8a7a5a')])
add('tub', 'Bathtub', 'indoor', [
    P('box', [0, 0.28, 0], [1.6, 0.5, 0.74], '#e4e4de'),
    P('box', [0, 0.52, 0], [1.44, 0.03, 0.58], '#7a6a4a'),
    *[P('sphere', [x, 0.04, z], [0.08, 0.08, 0.08], '#b0a070', seg=6) for x in (-0.7, 0.7) for z in (-0.28, 0.28)],
    P('cyl', [-0.72, 0.62, 0], [0.04, 0.2, 0.04], '#b8bcc0', seg=6)])
add('toilet', 'Toilet', 'indoor', [
    P('cyl', [0, 0.2, 0.08], [0.32, 0.4, 0.42], '#e4e4de', seg=10),
    P('box', [0, 0.41, 0.1], [0.4, 0.04, 0.46], '#e8e8e2'),
    P('box', [0, 0.62, -0.2], [0.44, 0.4, 0.18], '#e4e4de'), P('box', [0, 0.83, -0.2], [0.46, 0.03, 0.2], '#e8e8e2')])
add('wardrobe', 'Wardrobe', 'storage', [
    *cabinet_box(1.0, 1.95, 0.56, WALNUT, '#5a3e28', top=WALNUT),
    P('box', [-0.245, 1.05, 0.285], [0.47, 1.7, 0.012], '#4a3220', t=WALNUT), P('box', [0.245, 1.05, 0.285], [0.47, 1.7, 0.012], '#4a3220', t=WALNUT),
    P('box', [-0.03, 1.1, 0.3], [0.02, 0.14, 0.02], '#b09050'), P('box', [0.03, 1.1, 0.3], [0.02, 0.14, 0.02], '#b09050'),
    P('box', [0, 2.0, 0], [1.08, 0.08, 0.6], '#3a2818', t=WALNUT)], search=True)
add('dresser', 'Dresser', 'storage', [
    *cabinet_box(1.1, 0.84, 0.46, WALNUT, '#6a4a30', top=WALNUT),
    *drawer_fronts(1.04, 0, 0.08, 0.235, 3, 0.25, '#4a3220', cols=2),
    P('box', [0, 1.3, -0.21], [0.8, 0.6, 0.03], '#2a3440', t='b:glass'), P('box', [0, 1.3, -0.225], [0.86, 0.66, 0.03], '#4a3220', t=WALNUT)], search=True)
add('bookshelf', 'Bookshelf', 'indoor', [
    P('box', [-0.44, 0.9, 0], [0.03, 1.8, 0.32], '#4a3626', t=WALNUT), P('box', [0.44, 0.9, 0], [0.03, 1.8, 0.32], '#4a3626', t=WALNUT),
    P('box', [0, 0.9, -0.15], [0.9, 1.8, 0.02], '#3a2818', t=WALNUT),
    *[P('box', [0, y, 0], [0.86, 0.025, 0.32], '#4a3626', t=WALNUT) for y in (0.05, 0.45, 0.88, 1.31, 1.78)],
    *[P('box', [x, y + 0.14, 0.02], [w, 0.24, 0.22], c) for (y, row) in ((0.07, [(-0.3, 0.2, '#6a2a24'), (-0.06, 0.24, '#2a3a4a'), (0.2, 0.22, '#5a5a3a')]),
                                                                      (0.47, [(-0.25, 0.3, '#3a2a1e'), (0.12, 0.34, '#7a5a3a')]),
                                                                      (0.9, [(-0.32, 0.16, '#4a2a3a'), (-0.08, 0.26, '#2a4a3a'), (0.25, 0.26, '#8a6a4a')]),
                                                                      (1.33, [(-0.2, 0.4, '#5a3a2a'), (0.25, 0.2, '#3a3a5a')]))
      for (x, w, c) in row]])
add('nightstand', 'Nightstand', 'storage', [
    *cabinet_box(0.46, 0.58, 0.4, WALNUT, '#6a4a30', top=WALNUT),
    *drawer_fronts(0.42, 0, 0.32, 0.205, 1, 0.22, '#4a3220'),
    P('cyl', [0, 0.64, -0.04], [0.12, 0.06, 0.12], '#7a6a5a', seg=8), P('cyl', [0, 0.74, -0.04], [0.025, 0.16, 0.025], '#b09050', seg=6),
    P('cone', [0, 0.88, -0.04], [0.26, 0.18, 0.26], '#f0dca0', seg=8)], search=True,
    light={'p': [0, 0.84, -0.04], 'color': '#ffd8a0', 'energy': 0.5, 'range': 3.0})
add('tvstand', 'TV + stand', 'indoor', [
    P('box', [0, 0.25, 0], [1.0, 0.5, 0.46], '#3a2a20', t=WALNUT),
    P('box', [0, 0.74, -0.02], [0.62, 0.5, 0.48], '#1a1a1c'),
    P('box', [0, 0.75, 0.225], [0.48, 0.36, 0.01], '#233038'),
    P('box', [0.22, 0.62, 0.226], [0.06, 0.06, 0.01], '#4a4a4a'),
    P('box', [0, 1.01, -0.06], [0.03, 0.03, 0.03], '#2a2a2a'), P('box', [-0.1, 1.1, -0.06], [0.01, 0.2, 0.01], '#8a8a8a', [0, 0, 25]), P('box', [0.1, 1.1, -0.06], [0.01, 0.2, 0.01], '#8a8a8a', [0, 0, -25]),
    P('box', [0, 0.32, 0.232], [0.9, 0.02, 0.01], '#2a1a10')])
add('rug', 'Rug', 'indoor', [P('box', [0, 0.008, 0], [2.0, 0.016, 1.4], '#8a3a3a', t='b:mosaic'), P('box', [0, 0.004, 0], [2.1, 0.008, 1.5], '#5a2a24')])
add('lamp', 'Floor lamp', 'indoor', [
    P('cyl', [0, 0.02, 0], [0.32, 0.04, 0.32], '#3a3a3a', seg=10), P('cyl', [0, 0.75, 0], [0.04, 1.46, 0.04], '#b09050', seg=6),
    P('cone', [0, 1.52, 0], [0.42, 0.32, 0.42], '#f0dca0', seg=10), P('cyl', [0, 1.38, 0], [0.06, 0.06, 0.06], '#d8c890', seg=6)],
    light={'p': [0, 1.4, 0], 'color': '#ffd8a0', 'energy': 0.8, 'range': 4.0})
add('stairs', 'Stairs (12 steps)', 'indoor', [P('box', [0, (i + 1) * 0.1, -1.6 + (i + 0.5) * 0.27], [0.9, (i + 1) * 0.2, 0.27], '#7a5a3a', t=OAK) for i in range(12)])
add('crate', 'Crate', 'storage', [P('box', [0, 0.3, 0], [0.6, 0.6, 0.6], '#8a6a40', t=CRATE),
                                  *[P('box', [0, 0.3, z], [0.62, 0.06, 0.02], '#6a5030') for z in (-0.305, 0.305)]], search=True)
add('desk', 'Desk', 'indoor', [
    P('box', [0, 0.755, 0], [1.3, 0.04, 0.68], '#6a4a30', t=OAK),
    P('box', [-0.5, 0.37, 0], [0.3, 0.74, 0.62], '#5a3e28', t=OAK), *drawer_fronts(0.28, -0.5, 0.06, 0.315, 3, 0.22, '#4a3220'),
    P('box', [0.6, 0.37, 0], [0.04, 0.74, 0.62], '#5a3e28', t=OAK), P('box', [0.05, 0.4, -0.3], [1.1, 0.5, 0.02], '#5a3e28', t=OAK)], search=True)
add('cabinet', 'Cabinet', 'storage', [*cabinet_box(0.8, 1.2, 0.45, PAINTED, '#6a5a48', top=OAK),
                                      P('box', [-0.2, 0.65, 0.23], [0.37, 1.08, 0.012], '#7a6a58', t=PAINTED), P('box', [0.2, 0.65, 0.23], [0.37, 1.08, 0.012], '#7a6a58', t=PAINTED),
                                      P('cyl', [-0.04, 0.8, 0.245], [0.025, 0.02, 0.025], '#b09050', [90, 0, 0]), P('cyl', [0.04, 0.8, 0.245], [0.025, 0.02, 0.025], '#b09050', [90, 0, 0])], search=True)

# ================================================================== OUTDOOR (rebuilt)
add('tree', 'Tree', 'outdoor', [
    P('cyl', [0, 1.6, 0], [0.34, 3.2, 0.34], '#3e3028', t=BARK, seg=7),
    P('cyl', [0.25, 2.8, 0], [0.12, 1.2, 0.12], '#3e3028', [0, 0, -35], BARK, seg=6),
    P('sphere', [0, 3.9, 0], [2.6, 2.0, 2.4], '#2e3a24', t=LEAVES_G, seg=8),
    P('sphere', [0.6, 4.7, 0.3], [1.6, 1.4, 1.6], '#3a4a2a', t=LEAVES_G, seg=8),
    P('sphere', [-0.5, 4.9, -0.4], [1.4, 1.3, 1.4], '#4a3a1e', t=LEAVES_O, seg=8),
    P('sphere', [0.1, 5.6, 0], [1.0, 1.0, 1.0], '#4a3a1e', t=LEAVES_GOLD, seg=8)])
add('tree_pine', 'Pine tree', 'outdoor', [
    P('cyl', [0, 1.4, 0], [0.3, 2.8, 0.3], '#3e3028', t=BARKP, seg=7),
    *[P('cone', [0, 1.6 + i * 1.05, 0], [2.6 - i * 0.55, 1.7, 2.6 - i * 0.55], '#1e2e1c', t=NEEDLES, seg=8) for i in range(4)]])
add('tree_birch', 'Birch tree', 'outdoor', [
    P('cyl', [0, 2.2, 0], [0.2, 4.4, 0.2], '#d8d4c8', t=BARKB, seg=7),
    P('sphere', [0, 4.2, 0], [1.6, 1.8, 1.6], '#8a8a3a', t=LEAVES_GOLD, seg=8), P('sphere', [0.3, 5.0, 0.2], [1.1, 1.2, 1.1], '#a89a3a', t=LEAVES_GOLD, seg=8)])
add('tree_bare', 'Bare tree', 'outdoor', [
    P('cyl', [0, 2.6, 0], [0.3, 5.2, 0.3], '#3e3028', t=BARK, seg=7),
    P('cyl', [0.5, 4.0, 0], [0.09, 1.7, 0.09], '#3e3028', [0, 0, -45], BARK, seg=5), P('cyl', [-0.45, 4.5, 0.2], [0.08, 1.5, 0.08], '#3e3028', [20, 0, 40], BARK, seg=5),
    P('cyl', [0, 5.0, -0.4], [0.07, 1.3, 0.07], '#3e3028', [-40, 0, 0], BARK, seg=5), P('cyl', [0.9, 4.7, 0], [0.04, 0.9, 0.04], '#3e3028', [0, 0, -20], seg=4),
    P('cyl', [-0.2, 3.3, 0.4], [0.06, 1.0, 0.06], '#3e3028', [50, 0, 10], BARK, seg=4)])
add('tree_dead', 'Dead tree (snapped)', 'outdoor', [
    P('cyl', [0, 1.5, 0], [0.42, 3.0, 0.42], '#4a4038', t=BARK, seg=7), P('cone', [0.05, 3.15, 0], [0.4, 0.4, 0.4], '#6a5a44', [0, 0, 8], seg=5),
    P('cyl', [0.3, 2.2, 0.1], [0.07, 1.2, 0.07], '#4a4038', [0, 0, -55], seg=4), P('cyl', [1.6, 0.18, 0.6], [0.36, 2.6, 0.36], '#4a4038', [0, 30, 82], BARK, seg=6)])
add('stump', 'Stump', 'outdoor', [P('cyl', [0, 0.22, 0], [0.62, 0.44, 0.62], '#4a3a2a', t=BARK, seg=8), P('cyl', [0, 0.445, 0], [0.56, 0.01, 0.56], '#8a6a44', t=LOGEND, seg=8)])
add('log', 'Fallen log', 'outdoor', [P('cyl', [0, 0.2, 0], [0.4, 2.6, 0.4], '#4a3a2a', [0, 0, 90], BARK, seg=7), P('sphere', [0.6, 0.38, 0.1], [0.3, 0.12, 0.25], '#5a6a2a', seg=6)])
add('bush', 'Bush', 'plants', bush_blob(0, 0, 1.2, 0.95, seed=1))
add('rock', 'Rock', 'outdoor', [P('sphere', [0, 0.26, 0], [0.95, 0.6, 0.75], '#6a6862', [8, 25, 6], STONE, seg=6), P('sphere', [0.35, 0.14, 0.25], [0.4, 0.3, 0.35], '#5a5852', [0, 40, 0], STONE, seg=5)])
add('boulder', 'Boulder (mossy)', 'outdoor', [P('sphere', [0, 0.55, 0], [1.8, 1.2, 1.5], '#6a6862', [6, 20, 4], MOSSY, seg=7)])
add('fence', 'Fence (2 m)', 'outdoor', [
    P('box', [-1, 0.6, 0], [0.1, 1.2, 0.1], '#6a5a48', t=WEATHER), P('box', [1, 0.6, 0], [0.1, 1.2, 0.1], '#6a5a48', t=WEATHER),
    P('box', [0, 0.95, 0], [2.0, 0.1, 0.04], '#7a6a52', t=WEATHER), P('box', [0, 0.45, 0], [2.0, 0.1, 0.04], '#7a6a52', t=WEATHER),
    P('box', [0.3, 0.2, 0.03], [0.6, 0.1, 0.04], '#7a6a52', [0, 0, -38], WEATHER)])
add('fence_picket', 'Picket fence (2 m)', 'outdoor', [
    P('box', [0, 0.32, 0], [2.0, 0.07, 0.03], '#d8d4c8', t=PAINTED), P('box', [0, 0.75, 0], [2.0, 0.07, 0.03], '#d8d4c8', t=PAINTED),
    *[P('box', [-0.95 + i * 0.136, 0.5, 0.025], [0.08, 0.95 if i % 5 else 0.7, 0.02], '#d8d4c8', [0, 0, (i % 7 == 3) * 8], PAINTED) for i in range(15)]])
add('fence_iron', 'Iron fence (2 m)', 'graves', [
    P('box', [0, 0.12, 0], [2.0, 0.04, 0.03], '#1a1a1a', t=IRON), P('box', [0, 1.05, 0], [2.0, 0.04, 0.03], '#1a1a1a', t=IRON),
    *[P('box', [-0.95 + i * 0.1, 0.62, 0], [0.018, 1.2, 0.018], '#1a1a1a', t=IRON) for i in range(20)],
    *[P('cone', [-0.95 + i * 0.1, 1.27, 0], [0.04, 0.1, 0.04], '#1a1a1a', seg=4) for i in range(20)],
    P('box', [-1, 0.7, 0], [0.07, 1.4, 0.07], '#1a1a1a', t=IRON), P('box', [1, 0.7, 0], [0.07, 1.4, 0.07], '#1a1a1a', t=IRON)])
add('gate_iron', 'Iron gate', 'graves', [
    P('box', [-1.1, 1.1, 0], [0.16, 2.2, 0.16], '#6a6862', t=STONE), P('box', [1.1, 1.1, 0], [0.16, 2.2, 0.16], '#6a6862', t=STONE),
    P('sphere', [-1.1, 2.3, 0], [0.2, 0.2, 0.2], '#6a6862', t=STONE), P('sphere', [1.1, 2.3, 0], [0.2, 0.2, 0.2], '#6a6862', t=STONE),
    P('box', [-0.5, 0.15, 0], [1.0, 0.04, 0.03], '#1a1a1a', t=IRON), P('box', [-0.5, 1.5, 0], [1.0, 0.04, 0.03], '#1a1a1a', t=IRON),
    *[P('box', [-0.95 + i * 0.1, 0.85, 0], [0.018, 1.45, 0.018], '#1a1a1a', t=IRON) for i in range(10)],
    P('box', [0.55, 0.15, 0.3], [0.9, 0.04, 0.03], '#1a1a1a', [0, -40, 0], IRON), P('box', [0.55, 1.5, 0.3], [0.9, 0.04, 0.03], '#1a1a1a', [0, -40, 0], IRON),
    *[P('box', [0.2 + i * 0.077, 0.85, 0.02 + i * 0.065], [0.018, 1.45, 0.018], '#1a1a1a', [0, -40, 0], IRON) for i in range(10)]])
add('mailbox', 'Mailbox', 'outdoor', [P('box', [0, 0.55, 0], [0.08, 1.1, 0.08], '#4a3626', t=WEATHER), P('box', [0, 1.18, 0], [0.26, 0.18, 0.46], '#55595e', t='b:metal_rust'),
                                      P('cyl', [0, 1.27, 0], [0.26, 0.46, 0.18], '#55595e', [90, 0, 0], seg=8), P('box', [0.14, 1.28, -0.12], [0.02, 0.16, 0.04], '#b02a20')])
add('car', 'Sedan', 'outdoor', [
    P('box', [0, 0.52, 0], [1.76, 0.42, 4.4], '#5a1a1a'), P('box', [0, 1.0, 0.25], [1.5, 0.12, 1.9], '#4a1414'),
    P('box', [0, 1.15, 0.25], [1.48, 0.48, 1.7], '#1a2230', t='b:glass'), P('box', [0, 1.4, 0.25], [1.5, 0.05, 1.6], '#4a1414'),
    *[P('cyl', [x, 0.33, z], [0.66, 0.22, 0.66], '#111', [0, 0, 90], seg=10) for x in (-0.82, 0.82) for z in (-1.38, 1.38)],
    *[P('cyl', [x * 1.005, 0.33, z], [0.34, 0.23, 0.34], '#8a8a8a', [0, 0, 90], seg=8) for x in (-0.82, 0.82) for z in (-1.38, 1.38)],
    P('box', [-0.6, 0.58, -2.21], [0.3, 0.14, 0.02], '#fff4c0'), P('box', [0.6, 0.58, -2.21], [0.3, 0.14, 0.02], '#fff4c0'),
    P('box', [0, 0.42, -2.22], [1.6, 0.1, 0.04], '#8a8a8a'), P('box', [0, 0.42, 2.22], [1.6, 0.1, 0.04], '#8a8a8a'),
    P('box', [-0.6, 0.6, 2.21], [0.3, 0.1, 0.02], '#9a1a1a'), P('box', [0.6, 0.6, 2.21], [0.3, 0.1, 0.02], '#9a1a1a')])
add('pole', 'Power pole', 'outdoor', [P('cyl', [0, 4, 0], [0.26, 8, 0.26], '#4a3e32', t=WEATHER, seg=7), P('box', [0, 7.4, 0], [1.8, 0.1, 0.1], '#4a3e32', t=WEATHER),
                                       *[P('cyl', [x, 7.5, 0], [0.06, 0.12, 0.06], '#3a5a4a', seg=6) for x in (-0.8, -0.3, 0.3, 0.8)], P('cyl', [0.3, 6.6, 0.2], [0.36, 0.6, 0.36], '#6a6a66', seg=8)])
add('streetlight', 'Street light', 'outdoor', [P('cyl', [0, 2.5, 0], [0.12, 5, 0.12], '#4a4c50', seg=7), P('box', [0, 5, -0.6], [0.1, 0.1, 1.2], '#4a4c50'),
                                               P('box', [0, 4.92, -1.15], [0.3, 0.12, 0.42], '#3a3c40'), P('box', [0, 4.85, -1.15], [0.24, 0.02, 0.36], '#f0e6b0')],
    light={'p': [0, 4.6, -1.15], 'color': '#ffe2a8', 'energy': 1.6, 'range': 9.0})
add('sign', 'Sign post', 'outdoor', [P('box', [-0.5, 0.8, 0], [0.09, 1.6, 0.09], '#5a4632', t=WEATHER), P('box', [0.5, 0.8, 0], [0.09, 1.6, 0.09], '#5a4632', t=WEATHER),
                                     P('box', [0, 1.6, 0.02], [1.5, 1.0, 0.04], '#b09266', t=WEATHER)])
add('bench', 'Bench', 'outdoor', [
    *[P('box', [0, 0.45, z], [1.6, 0.03, 0.09], '#6a4a30', t=WEATHER) for z in (-0.13, -0.02, 0.09)],
    *[P('box', [0, y, -0.2], [1.6, 0.09, 0.03], '#6a4a30', [-8, 0, 0], WEATHER) for y in (0.66, 0.8)],
    *[P('box', [x, 0.22, 0], [0.05, 0.45, 0.42], '#2a2a2a', t=IRON) for x in (-0.7, 0.7)],
    *[P('box', [x, 0.66, -0.2], [0.05, 0.42, 0.05], '#2a2a2a', [-8, 0, 0], IRON) for x in (-0.7, 0.7)]])
add('trashcan', 'Trash can', 'outdoor', [P('cyl', [0, 0.42, 0], [0.5, 0.84, 0.5], '#3e4a44', t='b:metal_rust', seg=10), P('cyl', [0, 0.87, 0], [0.54, 0.06, 0.54], '#3e4a44', seg=10),
                                         P('box', [0, 0.92, 0], [0.12, 0.04, 0.03], '#2a2a2a')], search=True)
add('porch', 'Porch (1×3 m)', 'outdoor', [P('box', [0, 0.05, 0], [1, 0.1, 3], '#6a5a48', t=PORCH), P('box', [-0.45, 1.2, -1.45], [0.08, 2.3, 0.08], '#d8d2c4', t=PAINTED),
                                          P('box', [-0.45, 1.2, 1.45], [0.08, 2.3, 0.08], '#d8d2c4', t=PAINTED), P('box', [0, 2.35, 0], [1.1, 0.08, 3.1], '#4a4446', t=SHINGLE),
                                          P('box', [-0.45, 0.85, 0], [0.04, 0.06, 2.9], '#d8d2c4', t=PAINTED)])
add('woodpile', 'Woodpile', 'outdoor', [*[P('cyl', [-0.85 + i * 0.19, 0.08 + j * 0.15, 0], [0.16, 0.44, 0.16], '#6a4e34', [90, 0, 0], BARK, seg=6) for j in range(4) for i in range(9 - j)],
                                        P('box', [0, 0.02, 0], [2.0, 0.04, 0.5], '#3a2e22')])
add('well', 'Well', 'outdoor', [P('cyl', [0, 0.45, 0], [1.2, 0.9, 1.2], '#6e6c66', t=STONE, seg=10), P('cyl', [0, 0.88, 0], [0.9, 0.04, 0.9], '#0a0a0a', seg=10),
                                P('box', [-0.58, 1.25, 0], [0.09, 1.6, 0.09], '#4a3626', t=WEATHER), P('box', [0.58, 1.25, 0], [0.09, 1.6, 0.09], '#4a3626', t=WEATHER),
                                P('wedge', [0, 2.15, 0], [1.4, 0.4, 1.1], '#4a4446', t=SHINGLE), P('cyl', [0, 1.6, 0], [0.12, 1.1, 0.12], '#4a3626', [0, 0, 90], seg=6),
                                P('cyl', [0, 1.2, 0], [0.22, 0.22, 0.22], '#5a4a3a', seg=6)])
add('bell_tower', 'Bell tower top', 'church', [P('box', [0, 1.5, 0], [2.2, 3, 2.2], '#b8b2a2', t=PLASTER), P('box', [0, 2.1, 1.11], [0.8, 1.2, 0.02], '#0a0a0a'),
                                               P('cone', [0, 4, 0], [2.6, 2, 2.6], '#4a4446', t=SHINGLE, seg=4), P('box', [0, 5.4, 0], [0.1, 1, 0.1], '#b09050', t=GOLD),
                                               P('box', [0, 5.6, 0], [0.5, 0.1, 0.1], '#b09050', t=GOLD), P('cone', [0, 2.1, 0], [0.7, 0.8, 0.7], '#7a6a3a', t=BRASS, seg=8)])
add('shed', 'Garden shed', 'storage', [P('box', [0, 1.0, 0], [2.0, 2.0, 1.6], '#6a5a48', t=WEATHER), P('wedge', [0, 2.3, 0], [2.2, 0.6, 1.8], '#3a3634', t=SHINGLE),
                                       P('box', [0, 0.9, 0.81], [0.8, 1.8, 0.02], '#4a3a2a', t=WEATHER), P('box', [0.3, 0.9, 0.83], [0.04, 0.12, 0.03], '#2a2a2a')], search=True)
add('wheelbarrow', 'Wheelbarrow', 'outdoor', [P('wedge', [0, 0.45, 0], [0.6, 0.3, 0.9], '#5a6a5a', [0, 180, 0], RUST), P('cyl', [0, 0.18, 0.55], [0.36, 0.08, 0.36], '#1a1a1a', [0, 0, 90]),
                                              P('box', [-0.25, 0.4, -0.55], [0.04, 0.04, 0.9], '#5a4632', [-15, 0, 0]), P('box', [0.25, 0.4, -0.55], [0.04, 0.04, 0.9], '#5a4632', [-15, 0, 0])])

# ================================================================== CHURCH
add('pew', 'Church pew', 'church', [
    P('box', [0, 0.45, 0.04], [3.0, 0.05, 0.46], '#5a3e28', t=PEW),
    P('box', [0, 0.8, -0.2], [3.0, 0.62, 0.05], '#5a3e28', [-8, 0, 0], PEW), P('box', [0, 1.12, -0.24], [3.04, 0.05, 0.1], '#4a3220', t=PEW),
    P('box', [-1.48, 0.5, 0], [0.06, 1.0, 0.56], '#4a3220', t=PEW), P('box', [1.48, 0.5, 0], [0.06, 1.0, 0.56], '#4a3220', t=PEW),
    P('box', [-1.48, 1.02, -0.02], [0.08, 0.06, 0.6], '#3a2818', t=PEW), P('box', [1.48, 1.02, -0.02], [0.08, 0.06, 0.6], '#3a2818', t=PEW),
    P('box', [0, 0.82, -0.3], [2.9, 0.14, 0.12], '#4a3220', t=PEW),
    P('box', [0, 0.14, -0.42], [2.9, 0.06, 0.18], '#5a2a2a', t=VELR),
    *[P('box', [x, 0.9, -0.31], [0.14, 0.2, 0.08], '#3a1e1e') for x in (-1.0, -0.2, 0.7)]])
add('pew_short', 'Pew, short', 'church', [
    P('box', [0, 0.45, 0.04], [1.6, 0.05, 0.46], '#5a3e28', t=PEW), P('box', [0, 0.8, -0.2], [1.6, 0.62, 0.05], '#5a3e28', [-8, 0, 0], PEW),
    P('box', [-0.78, 0.5, 0], [0.06, 1.0, 0.56], '#4a3220', t=PEW), P('box', [0.78, 0.5, 0], [0.06, 1.0, 0.56], '#4a3220', t=PEW),
    P('box', [0, 0.14, -0.42], [1.5, 0.06, 0.18], '#5a2a2a', t=VELR)])
add('pew_broken', 'Pew, broken', 'church', [
    P('box', [-0.6, 0.38, 0.04], [1.8, 0.05, 0.46], '#5a3e28', [0, 0, 8], PEW), P('box', [0.9, 0.12, 0.1], [1.1, 0.05, 0.46], '#5a3e28', [0, 12, -14], PEW),
    P('box', [-0.2, 0.7, -0.2], [2.6, 0.62, 0.05], '#5a3e28', [-24, 0, 6], PEW),
    P('box', [-1.48, 0.5, 0], [0.06, 1.0, 0.56], '#4a3220', t=PEW), P('box', [1.3, 0.04, 0.2], [0.06, 0.56, 1.0], '#4a3220', [90, 0, 30], PEW)])
add('kneeler', 'Kneeler', 'church', [P('box', [0, 0.1, 0], [1.4, 0.12, 0.26], '#5a2a2a', t=VELR), P('box', [0, 0.04, 0], [1.44, 0.08, 0.3], '#3a2818', t=PEW)])
add('prie_dieu', 'Prie-dieu (prayer kneeler)', 'church', [
    P('box', [0, 0.1, 0.2], [0.55, 0.1, 0.28], '#5a2a2a', t=VELR), P('box', [-0.25, 0.48, -0.05], [0.05, 0.96, 0.06], '#4a3220', t=PEW),
    P('box', [0.25, 0.48, -0.05], [0.05, 0.96, 0.06], '#4a3220', t=PEW), P('box', [0, 0.92, 0.0], [0.6, 0.05, 0.24], '#4a3220', [-18, 0, 0], PEW),
    P('box', [0, 0.06, 0.08], [0.55, 0.04, 0.5], '#3a2818', t=PEW)])
add('altar', 'Altar', 'church', [
    P('box', [0, 0.5, 0], [2.0, 1.0, 0.8], '#d8d0c0', t=MARW),
    P('box', [0, 0.03, 0], [2.1, 0.06, 0.9], '#a8a090', t=MARG),
    P('box', [0, 1.02, 0], [2.1, 0.04, 0.9], '#e8e4d8', t=MARW),
    P('box', [0, 1.05, 0.0], [2.2, 0.02, 0.92], '#e8e4d8', t=ALTARLIN),
    P('box', [0, 0.82, 0.455], [2.2, 0.48, 0.01], '#e8e4d8', t=ALTARLIN),
    P('box', [0, 0.55, 0.402], [0.5, 0.5, 0.01], '#7a1a1a', t=BROC),
    *cross_shape(0, 1.07, -0.3, 0.6, 0.32, 0.04, '#b09050', GOLD),
    *candle(-0.7, 1.07, -0.25, 0.3), *candle(0.7, 1.07, -0.25, 0.3),
    P('cyl', [-0.7, 1.08, -0.25], [0.12, 0.03, 0.12], '#b09050', t=GOLD, seg=8), P('cyl', [0.7, 1.08, -0.25], [0.12, 0.03, 0.12], '#b09050', t=GOLD, seg=8)])
add('altar_plain', 'Altar (bare wood)', 'church', [
    P('box', [0, 0.5, 0], [1.8, 1.0, 0.75], '#5a3e28', t=PEW), P('box', [0, 1.02, 0], [1.9, 0.05, 0.85], '#4a3220', t=PEW),
    P('box', [0, 1.05, 0], [1.95, 0.02, 0.88], '#e8e4d8', t=LINEN), P('box', [0, 0.85, 0.44], [1.95, 0.4, 0.01], '#e8e4d8', t=LINEN)])
add('tabernacle', 'Tabernacle', 'church', [
    P('box', [0, 0.25, 0], [0.5, 0.5, 0.4], '#b09050', t=GOLD), P('box', [0, 0.25, 0.202], [0.28, 0.34, 0.01], '#c9a23a', t=GOLD),
    P('cone', [0, 0.62, 0], [0.56, 0.24, 0.46], '#b09050', t=GOLD, seg=4), *cross_shape(0, 0.74, 0, 0.16, 0.09, 0.016, '#c9a23a'),
    P('box', [0, 0.25, 0.21], [0.04, 0.04, 0.02], '#5a3a14')], search=True)
add('crucifix_wall', 'Crucifix (wall)', 'church', [
    *cross_shape(0, 1.3, 0, 1.5, 0.9, 0.09, '#3a2414', WALNUT, depth=0.05),
    P('box', [0, 2.12, 0.04], [0.09, 0.36, 0.05], '#d8c8b0'), P('sphere', [0, 2.33, 0.05], [0.07, 0.08, 0.07], '#d8c8b0', seg=6),
    P('box', [-0.15, 2.36, 0.04], [0.26, 0.04, 0.04], '#d8c8b0', [0, 0, -12]), P('box', [0.15, 2.36, 0.04], [0.26, 0.04, 0.04], '#d8c8b0', [0, 0, 12]),
    P('box', [0, 1.84, 0.04], [0.06, 0.24, 0.04], '#d8c8b0')], solid=False)
add('processional_cross', 'Processional cross', 'church', [
    P('cyl', [0, 0.04, 0], [0.3, 0.08, 0.3], '#b09050', t=GOLD, seg=8), P('cyl', [0, 1.1, 0], [0.04, 2.1, 0.04], '#b09050', t=GOLD, seg=6),
    P('sphere', [0, 2.15, 0], [0.09, 0.09, 0.09], '#c9a23a', t=GOLD, seg=6), *cross_shape(0, 2.2, 0, 0.5, 0.32, 0.035, '#c9a23a', GOLD)])
add('candlestick_tall', 'Candlestick, tall (pair)', 'church', [
    *[p for x in (-0.25, 0.25) for p in [P('cyl', [x, 0.05, 0], [0.26, 0.1, 0.26], '#b09050', t=GOLD, seg=8), P('cyl', [x, 0.6, 0], [0.05, 1.1, 0.05], '#b09050', t=GOLD, seg=6),
                                         P('sphere', [x, 0.5, 0], [0.1, 0.08, 0.1], '#c9a23a', t=GOLD, seg=6), P('cyl', [x, 1.16, 0], [0.12, 0.03, 0.12], '#b09050', t=GOLD, seg=8),
                                         *candle(x, 1.17, 0, 0.35, 0.03)]]],
    light={'p': [0, 1.6, 0], 'color': '#ffc878', 'energy': 0.6, 'range': 3.5})
add('paschal_candle', 'Paschal candle', 'church', [
    P('cyl', [0, 0.06, 0], [0.4, 0.12, 0.4], '#b09050', t=BRASS, seg=8), P('cyl', [0, 0.65, 0], [0.08, 1.1, 0.08], '#b09050', t=BRASS, seg=6),
    P('cyl', [0, 1.22, 0], [0.18, 0.04, 0.18], '#b09050', t=BRASS, seg=8), *candle(0, 1.24, 0, 0.75, 0.05),
    P('box', [0, 1.6, 0.052], [0.04, 0.14, 0.004], '#8a1a1a'), P('box', [0, 1.62, 0.052], [0.09, 0.03, 0.004], '#8a1a1a')],
    light={'p': [0, 2.05, 0], 'color': '#ffc878', 'energy': 0.5, 'range': 3.0})
add('sanctuary_lamp', 'Sanctuary lamp (hanging, red)', 'church', [
    P('box', [0, 2.6, 0], [0.01, 0.9, 0.01], '#2a2a2a'), P('cone', [0, 2.12, 0], [0.24, 0.12, 0.24], '#b09050', [180, 0, 0], BRASS, seg=8),
    P('cyl', [0, 2.06, 0], [0.13, 0.16, 0.13], '#a01a1a', seg=8), P('cone', [0, 1.92, 0], [0.12, 0.12, 0.12], '#b09050', [180, 0, 0], BRASS, seg=8),
    *[P('box', [math.cos(a) * 0.1, 2.32, math.sin(a) * 0.1], [0.008, 0.4, 0.008], '#2a2a2a', [math.sin(a) * 14, 0, -math.cos(a) * 14]) for a in (0, 2.1, 4.2)]],
    light={'p': [0, 2.05, 0], 'color': '#ff3a2a', 'energy': 0.35, 'range': 3.0}, solid=False)
add('ambo', 'Ambo / lectern', 'church', [
    P('box', [0, 0.05, 0], [0.7, 0.1, 0.55], '#4a3220', t=PEW), P('box', [0, 0.55, 0], [0.5, 0.95, 0.4], '#5a3e28', t=PEW),
    P('box', [0, 1.1, 0.04], [0.66, 0.06, 0.48], '#4a3220', [20, 0, 0], PEW), P('box', [0, 0.55, 0.205], [0.3, 0.6, 0.01], '#7a1a1a', t=BROC),
    P('box', [0, 1.16, 0.04], [0.36, 0.04, 0.26], '#e8e2d0', [20, 0, 0], PAPER), *cross_shape(0, 0.65, 0.212, 0.3, 0.18, 0.025, '#c9a23a')])
add('lectern_eagle', 'Lectern (brass eagle)', 'church', [
    P('cyl', [0, 0.06, 0], [0.5, 0.12, 0.5], '#b09050', t=BRASS, seg=8), P('cyl', [0, 0.6, 0], [0.1, 1.0, 0.1], '#b09050', t=BRASS, seg=8),
    P('sphere', [0, 1.15, 0], [0.25, 0.22, 0.25], '#b09050', t=BRASS, seg=8),
    P('box', [-0.28, 1.25, 0], [0.5, 0.04, 0.3], '#b09050', [0, 0, 20], BRASS), P('box', [0.28, 1.25, 0], [0.5, 0.04, 0.3], '#b09050', [0, 0, -20], BRASS),
    P('box', [0, 1.3, 0.14], [0.08, 0.1, 0.14], '#b09050', t=BRASS), P('box', [0, 1.32, 0], [0.5, 0.06, 0.36], '#3a2a1e', [14, 0, 0], LEATH)])
add('pulpit', 'Pulpit (raised)', 'church', [
    P('cyl', [0, 0.6, 0], [1.1, 1.2, 1.1], '#5a3e28', t=PEW, seg=8), P('cyl', [0, 1.25, 0], [1.2, 0.08, 1.2], '#4a3220', t=PEW, seg=8),
    P('box', [0, 1.4, 0.5], [0.5, 0.06, 0.3], '#4a3220', [18, 0, 0], PEW), P('box', [0, 0.7, 0.56], [0.36, 0.6, 0.01], '#7a1a1a', t=BROC),
    *[P('box', [-0.85, 0.12 + i * 0.24, -0.25 + i * 0.12], [0.6, 0.06, 0.28], '#4a3220', t=PEW) for i in range(5)]])
add('baptismal_font', 'Baptismal font', 'church', [
    P('cyl', [0, 0.06, 0], [0.7, 0.12, 0.7], '#a8a090', t=MARG, seg=8), P('cyl', [0, 0.45, 0], [0.3, 0.7, 0.3], '#d8d0c0', t=MARW, seg=8),
    P('cyl', [0, 0.88, 0], [0.8, 0.22, 0.8], '#d8d0c0', t=MARW, seg=10), P('cyl', [0, 0.98, 0], [0.68, 0.03, 0.68], '#3a4a50', seg=10),
    P('cone', [0, 1.18, 0], [0.7, 0.36, 0.7], '#5a3e28', t=PEW, seg=8), P('sphere', [0, 1.38, 0], [0.08, 0.08, 0.08], '#b09050', t=GOLD)])
add('holy_water_stoup', 'Holy water stoup (wall)', 'church', [
    P('box', [0, 1.2, 0], [0.3, 0.4, 0.04], '#d8d0c0', t=MARW), P('sphere', [0, 1.0, 0.1], [0.3, 0.16, 0.22], '#d8d0c0', t=MARW, seg=8),
    P('cyl', [0, 1.06, 0.1], [0.22, 0.01, 0.16], '#3a4a50', seg=8), *cross_shape(0, 1.25, 0.025, 0.14, 0.09, 0.015, '#b09050')], solid=False)
add('confessional', 'Confessional', 'church', [
    P('box', [0, 1.15, 0], [2.4, 2.3, 1.0], '#4a3220', t=PEW), P('box', [0, 2.38, 0], [2.5, 0.16, 1.1], '#3a2818', t=PEW),
    P('box', [0, 1.05, 0.505], [0.7, 1.9, 0.02], '#3a2818', t=PEW),
    P('box', [-0.82, 1.05, 0.505], [0.66, 1.8, 0.01], '#4a0a10', t=VELR), P('box', [0.82, 1.05, 0.505], [0.66, 1.8, 0.01], '#4a0a10', t=VELR),
    P('box', [0, 1.6, 0.52], [0.3, 0.3, 0.02], '#1a1410'), *cross_shape(0, 2.48, 0, 0.3, 0.18, 0.035, '#b09050', GOLD)], search=True)
add('votive_rack', 'Votive candle rack', 'church', [
    P('box', [0, 0.4, 0], [1.0, 0.8, 0.4], '#2a2a2a', t=IRON), P('wedge', [0, 0.92, 0.02], [1.0, 0.24, 0.4], '#2a2a2a', [0, 180, 0], IRON),
    *[p for j in range(3) for i in range(6) for p in [P('cyl', [-0.4 + i * 0.16, 0.85 + j * 0.08, -0.1 + j * 0.1], [0.06, 0.07, 0.06], '#9a1a1a' if (i + j) % 3 else '#2a4a8a', seg=6)] +
      ([P('cone', [-0.4 + i * 0.16, 0.92 + j * 0.08, -0.1 + j * 0.1], [0.014, 0.03, 0.014], '#ffd27a', seg=4)] if (i * 5 + j * 3) % 4 else [])],
    P('box', [0.42, 0.65, 0.2], [0.1, 0.16, 0.06], '#b09050', t=BRASS)],
    light={'p': [0, 1.05, 0], 'color': '#ffb060', 'energy': 0.6, 'range': 3.0})
add('hymn_board', 'Hymn board', 'church', [P('box', [0, 1.7, 0], [0.6, 0.9, 0.05], '#4a3220', t=PEW), P('wedge', [0, 2.2, 0], [0.62, 0.12, 0.06], '#3a2818', t=PEW),
                                           *[P('box', [0, 1.45 + i * 0.16, 0.03], [0.48, 0.12, 0.01], '#e8e2d0') for i in range(4)]], solid=False)
add('statue_mary', 'Statue on plinth (robed)', 'church', [
    P('box', [0, 0.45, 0], [0.5, 0.9, 0.5], '#a8a090', t=MARG), P('box', [0, 0.92, 0], [0.56, 0.04, 0.56], '#d8d0c0', t=MARW),
    P('cone', [0, 1.45, 0], [0.42, 1.05, 0.36], '#d8d4cc', t=MARW, seg=8), P('cone', [0, 1.6, -0.02], [0.32, 0.9, 0.3], '#6a8aa8', seg=8),
    P('sphere', [0, 2.02, 0.02], [0.15, 0.17, 0.15], '#e8dcc8', seg=8), P('sphere', [0, 2.06, -0.01], [0.19, 0.2, 0.18], '#6a8aa8', seg=8),
    P('box', [-0.08, 1.7, 0.12], [0.06, 0.14, 0.06], '#e8dcc8', [-30, 0, 20]), P('box', [0.08, 1.7, 0.12], [0.06, 0.14, 0.06], '#e8dcc8', [-30, 0, -20])])
add('statue_saint', 'Statue on plinth (worn saint)', 'church', [
    P('box', [0, 0.45, 0], [0.5, 0.9, 0.5], '#8a8478', t=STONE), P('cone', [0, 1.4, 0], [0.4, 1.0, 0.34], '#8a8478', t=STONE, seg=7),
    P('sphere', [0, 1.98, 0.02], [0.15, 0.17, 0.15], '#8a8478', t=STONE, seg=6), P('box', [0.18, 1.55, 0.1], [0.05, 0.5, 0.05], '#8a8478', [-10, 0, -15], STONE),
    P('box', [0.22, 1.85, 0.14], [0.03, 0.4, 0.03], '#6a6458', [0, 0, -5]), P('box', [0.22, 1.98, 0.14], [0.16, 0.03, 0.03], '#6a6458')])
add('station_cross', 'Station of the Cross (plaque)', 'church', [
    P('box', [0, 1.55, 0], [0.42, 0.52, 0.04], '#5a3e28', t=PEW), P('box', [0, 1.55, 0.025], [0.34, 0.4, 0.01], '#a8a090', t=STONE),
    *cross_shape(0, 1.86, 0.02, 0.14, 0.09, 0.02, '#3a2818'), P('box', [0, 1.38, 0.032], [0.12, 0.04, 0.005], '#c9a23a')], solid=False)
add('communion_rail', 'Communion rail (2 m)', 'church', [
    P('box', [0, 0.82, 0], [2.0, 0.07, 0.22], '#4a3220', t=PEW), P('box', [0, 0.06, 0.05], [2.0, 0.12, 0.36], '#4a3220', t=PEW),
    *[P('cyl', [-0.95 + i * 0.1, 0.45, 0], [0.04, 0.72, 0.04], '#5a3e28', t=PEW, seg=6) for i in range(20)],
    P('box', [0, 0.16, 0.2], [2.0, 0.08, 0.2], '#5a2a2a', t=VELR)])
add('credence_table', 'Credence table', 'church', [
    P('box', [0, 0.85, 0], [0.9, 0.04, 0.45], '#5a3e28', t=PEW), *legs4(0.9, 0.45, 0.83, 0.05, '#4a3220', PEW),
    P('box', [0, 0.875, 0], [0.96, 0.01, 0.5], '#e8e4d8', t=LINEN), P('box', [0, 0.78, 0.25], [0.96, 0.18, 0.005], '#e8e4d8', t=LINEN)])
add('sedilia', 'Celebrant\'s chair', 'church', [
    P('box', [0, 0.47, 0.02], [0.66, 0.08, 0.58], '#4a3220', t=PEW), P('box', [0, 0.5, 0.03], [0.56, 0.06, 0.5], '#5a1a1a', t=VELR),
    P('box', [0, 1.1, -0.27], [0.66, 1.2, 0.06], '#4a3220', t=PEW), P('box', [0, 1.05, -0.235], [0.5, 0.8, 0.02], '#5a1a1a', t=VELR),
    *cross_shape(0, 1.72, -0.27, 0.2, 0.12, 0.03, '#b09050', GOLD),
    P('box', [-0.33, 0.66, 0.02], [0.06, 0.3, 0.56], '#4a3220', t=PEW), P('box', [0.33, 0.66, 0.02], [0.06, 0.3, 0.56], '#4a3220', t=PEW),
    *legs4(0.66, 0.58, 0.44, 0.06, '#3a2818', PEW, inset=0.0)])
add('organ', 'Pump organ', 'church', [
    P('box', [0, 0.55, 0], [1.3, 1.1, 0.6], '#4a3220', t=WALNUT), P('box', [0, 0.82, 0.32], [1.1, 0.04, 0.2], '#e8e4d8'),
    P('box', [0, 0.85, 0.36], [1.1, 0.02, 0.06], '#1a1a1a'), P('box', [0, 1.45, -0.2], [1.3, 0.7, 0.2], '#4a3220', t=WALNUT),
    *[P('cyl', [-0.5 + i * 0.1, 1.55, -0.08], [0.05, 0.6 + (i % 3) * 0.1, 0.05], '#b09050', t=BRASS, seg=6) for i in range(11)],
    P('box', [-0.2, 0.08, 0.3], [0.2, 0.04, 0.3], '#2a2a2a', [-15, 0, 0]), P('box', [0.2, 0.08, 0.3], [0.2, 0.04, 0.3], '#2a2a2a', [-15, 0, 0])])
add('church_bell', 'Church bell (hung)', 'church', [
    P('box', [-0.6, 0.9, 0], [0.12, 1.8, 0.12], '#3a2818', t=PEW), P('box', [0.6, 0.9, 0], [0.12, 1.8, 0.12], '#3a2818', t=PEW),
    P('box', [0, 1.75, 0], [1.3, 0.14, 0.14], '#3a2818', t=PEW), P('cone', [0, 1.3, 0], [0.75, 0.75, 0.75], '#7a6a3a', t=BRASS, seg=10),
    P('sphere', [0, 1.62, 0], [0.4, 0.2, 0.4], '#7a6a3a', t=BRASS, seg=8), P('sphere', [0, 0.95, 0], [0.12, 0.12, 0.12], '#3a3a3a', seg=6)])
add('offering_box', 'Poor box (offerings)', 'church', [
    P('box', [0, 0.45, 0], [0.12, 0.9, 0.12], '#3a2818', t=PEW), P('box', [0, 1.0, 0], [0.3, 0.24, 0.24], '#4a3220', t=PEW),
    P('box', [0, 1.125, 0], [0.1, 0.01, 0.02], '#0a0a0a'), P('box', [0, 1.0, 0.125], [0.06, 0.06, 0.01], '#b09050', t=BRASS)], search=True)
add('stained_window', 'Stained glass window', 'church', [
    P('box', [0, 1.7, 0], [0.9, 2.0, 0.03], '#3a4a8a', t=GLASS_ST), P('cyl', [0, 2.7, 0], [0.9, 0.03, 0.9], '#3a4a8a', [90, 0, 0], GLASS_ST, seg=12),
    P('box', [0, 1.7, 0.02], [0.04, 2.0, 0.02], '#1a1a1a'), P('box', [0, 1.7, 0.02], [0.9, 0.04, 0.02], '#1a1a1a'),
    P('box', [0, 0.68, 0.05], [1.0, 0.06, 0.14], '#a8a090', t=STONE)], solid=False,
    light={'p': [0, 1.8, 0.4], 'color': '#8aa0ff', 'energy': 0.3, 'range': 3.0})
add('banner', 'Hanging banner', 'church', [P('box', [0, 2.4, 0], [0.8, 0.03, 0.03], '#b09050', t=GOLD), P('box', [0, 1.75, 0], [0.7, 1.3, 0.01], '#7a1a1a', t=BROC),
                                          *cross_shape(0, 1.55, 0.01, 0.6, 0.36, 0.06, '#c9a23a', depth=0.005), P('wedge', [0, 1.02, 0], [0.7, 0.16, 0.01], '#7a1a1a', [180, 0, 0])], solid=False)
add('chandelier', 'Chandelier (iron, candles)', 'church', [
    P('box', [0, 3.0, 0], [0.02, 1.0, 0.02], '#1a1a1a'), P('cyl', [0, 2.5, 0], [1.0, 0.04, 1.0], '#1a1a1a', t=IRON, seg=12),
    P('cyl', [0, 2.42, 0], [0.12, 0.16, 0.12], '#1a1a1a', t=IRON, seg=6),
    *[p for k in range(8) for p in candle(math.cos(k * 0.785) * 0.48, 2.52, math.sin(k * 0.785) * 0.48, 0.16, 0.022)]],
    light={'p': [0, 2.6, 0], 'color': '#ffc070', 'energy': 1.2, 'range': 7.0}, solid=False)
add('lamp_church_pendant', 'Church pendant lamp', 'church', [
    P('box', [0, 3.0, 0], [0.012, 1.1, 0.012], '#2a2a2a'), P('cone', [0, 2.38, 0], [0.5, 0.22, 0.5], '#2a2a28', t=IRON, seg=10),
    P('sphere', [0, 2.25, 0], [0.22, 0.2, 0.22], '#f0e0b0', seg=8)],
    light={'p': [0, 2.2, 0], 'color': '#ffdca0', 'energy': 1.0, 'range': 6.0}, solid=False)
add('lamp_church_sconce', 'Church wall sconce', 'church', [
    P('box', [0, 1.9, 0], [0.12, 0.3, 0.03], '#b09050', t=BRASS), P('box', [0, 1.85, 0.1], [0.03, 0.03, 0.2], '#b09050', [20, 0, 0], BRASS),
    P('cyl', [0, 1.92, 0.18], [0.1, 0.03, 0.1], '#b09050', t=BRASS, seg=8), P('cyl', [0, 2.0, 0.18], [0.12, 0.16, 0.12], '#f0e0b0', seg=8)],
    light={'p': [0, 2.0, 0.2], 'color': '#ffcf88', 'energy': 0.6, 'range': 4.0}, solid=False)
add('lamp_candelabra', 'Floor candelabra (7 lights)', 'church', [
    P('cyl', [0, 0.05, 0], [0.4, 0.1, 0.4], '#b09050', t=GOLD, seg=8), P('cyl', [0, 0.7, 0], [0.06, 1.3, 0.06], '#b09050', t=GOLD, seg=6),
    *[P('cyl', [x * 0.12, 1.25 - abs(x) * 0.02, 0], [0.03, 0.4 - abs(x) * 0.0, 0.03], '#b09050', t=GOLD, seg=5) for x in (-3, -2, -1, 1, 2, 3)],
    P('box', [0, 1.05, 0], [0.76, 0.03, 0.03], '#b09050', t=GOLD),
    *[p for x in (-3, -2, -1, 0, 1, 2, 3) for p in candle(x * 0.12, 1.45, 0, 0.14, 0.018)]],
    light={'p': [0, 1.65, 0], 'color': '#ffc070', 'energy': 0.8, 'range': 4.5})

# ================================================================== MASS: the sacred vessels and what's used at the altar (small: put them on the altar)
add('chalice', 'Chalice', 'mass', [P('cyl', [0, 0.008, 0], [0.12, 0.016, 0.12], '#c9a23a', t=GOLD, seg=10), P('cone', [0, 0.03, 0], [0.1, 0.04, 0.1], '#c9a23a', t=GOLD, seg=10),
                                   P('cyl', [0, 0.08, 0], [0.024, 0.08, 0.024], '#c9a23a', t=GOLD, seg=8), P('sphere', [0, 0.08, 0], [0.045, 0.03, 0.045], '#c9a23a', t=GOLD, seg=8),
                                   P('cone', [0, 0.155, 0], [0.1, 0.09, 0.1], '#c9a23a', [180, 0, 0], GOLD, seg=10), P('cyl', [0, 0.18, 0], [0.1, 0.04, 0.1], '#c9a23a', t=GOLD, seg=10)], solid=False)
add('paten', 'Paten with host', 'mass', [P('cyl', [0, 0.004, 0], [0.15, 0.008, 0.15], '#c9a23a', t=GOLD, seg=12), P('cyl', [0, 0.011, 0], [0.075, 0.004, 0.075], '#f2ead6', seg=10)], solid=False)
add('ciborium', 'Ciborium', 'mass', [P('cyl', [0, 0.01, 0], [0.11, 0.02, 0.11], '#c9a23a', t=GOLD, seg=10), P('cyl', [0, 0.06, 0], [0.03, 0.08, 0.03], '#c9a23a', t=GOLD, seg=8),
                                     P('sphere', [0, 0.14, 0], [0.13, 0.1, 0.13], '#c9a23a', t=GOLD, seg=10), P('cone', [0, 0.2, 0], [0.12, 0.06, 0.12], '#c9a23a', t=GOLD, seg=10),
                                     *cross_shape(0, 0.23, 0, 0.05, 0.03, 0.006, '#e0c060')], solid=False)
add('monstrance', 'Monstrance', 'mass', [P('cyl', [0, 0.012, 0], [0.18, 0.024, 0.14], '#c9a23a', t=GOLD, seg=8), P('cyl', [0, 0.14, 0], [0.03, 0.24, 0.03], '#c9a23a', t=GOLD, seg=6),
                                         P('cyl', [0, 0.36, 0], [0.12, 0.02, 0.12], '#f2ead6', [90, 0, 0], seg=10), P('cyl', [0, 0.36, 0], [0.15, 0.015, 0.15], '#c9a23a', [90, 0, 0], GOLD, seg=12),
                                         *[P('box', [math.cos(a) * 0.15, 0.36 + math.sin(a) * 0.15, 0], [0.012, 0.13, 0.006], '#e0c060', [0, 0, math.degrees(a) - 90]) for a in [k * 0.524 for k in range(12)]],
                                         *cross_shape(0, 0.52, 0, 0.08, 0.05, 0.01, '#e0c060')], solid=False)
add('thurible', 'Thurible (censer) on stand', 'mass', [
    P('cyl', [0, 0.02, 0], [0.3, 0.04, 0.3], '#2a2a2a', t=IRON, seg=8), P('cyl', [0, 0.75, 0], [0.03, 1.5, 0.03], '#2a2a2a', t=IRON, seg=6), P('box', [0.15, 1.48, 0], [0.32, 0.03, 0.03], '#2a2a2a', t=IRON),
    *[P('box', [0.3 + dx, 1.25, dz], [0.004, 0.46, 0.004], '#b09050') for dx, dz in ((-0.04, 0), (0.04, 0), (0, 0.04))],
    P('sphere', [0.3, 0.98, 0], [0.14, 0.1, 0.14], '#b09050', t=BRASS, seg=8), P('cone', [0.3, 1.08, 0], [0.13, 0.12, 0.13], '#b09050', t=BRASS, seg=8),
    P('cyl', [0.3, 0.92, 0], [0.08, 0.03, 0.08], '#b09050', t=BRASS, seg=8)])
add('incense_boat', 'Incense boat + spoon', 'mass', [P('sphere', [0, 0.03, 0], [0.14, 0.05, 0.07], '#b09050', t=BRASS, seg=8), P('cyl', [0, 0.008, 0], [0.05, 0.016, 0.05], '#b09050', t=BRASS, seg=8),
                                                    P('box', [0.04, 0.06, 0], [0.09, 0.006, 0.012], '#b09050', [0, 0, 25])], solid=False)
add('cruets', 'Cruets (water and wine) on tray', 'mass', [P('box', [0, 0.005, 0], [0.24, 0.01, 0.14], '#b8bcc0', t=BRASS),
                                                         P('cyl', [-0.05, 0.06, 0], [0.05, 0.1, 0.05], '#d8e4e8', seg=8), P('cyl', [0.05, 0.06, 0], [0.05, 0.1, 0.05], '#6a1a2a', seg=8),
                                                         P('cyl', [-0.05, 0.125, 0], [0.025, 0.03, 0.025], '#d8e4e8', seg=6), P('cyl', [0.05, 0.125, 0], [0.025, 0.03, 0.025], '#6a1a2a', seg=6)], solid=False)
add('lavabo', 'Lavabo bowl + towel', 'mass', [P('cyl', [0, 0.02, 0], [0.2, 0.04, 0.2], '#b8bcc0', t=BRASS, seg=10), P('box', [0.18, 0.006, 0], [0.12, 0.012, 0.2], '#e8e4d8', t=LINEN)], solid=False)
add('aspergillum', 'Aspergillum + bucket', 'mass', [P('cyl', [0, 0.1, 0], [0.18, 0.2, 0.18], '#b09050', t=BRASS, seg=10), P('box', [0, 0.24, 0], [0.18, 0.01, 0.01], '#b09050', [0, 0, 0]),
                                                   P('cyl', [0.03, 0.26, 0.02], [0.02, 0.3, 0.02], '#b8bcc0', [0, 0, -25], seg=6), P('sphere', [0.1, 0.4, 0.02], [0.05, 0.05, 0.05], '#b8bcc0', seg=6)], solid=False)
add('altar_bells', 'Altar bells', 'mass', [P('box', [0, 0.1, 0], [0.012, 0.2, 0.012], '#b09050', t=BRASS),
                                           *[P('cone', [x, 0.04, 0], [0.05, 0.05, 0.05], '#c9a23a', t=GOLD, seg=8) for x in (-0.05, 0, 0.05)], P('box', [0, 0.06, 0], [0.14, 0.008, 0.008], '#b09050')], solid=False)
add('missal_stand', 'Missal on stand', 'mass', [P('wedge', [0, 0.05, 0], [0.3, 0.1, 0.24], '#4a3220', [0, 180, 0], PEW), P('box', [0, 0.12, 0], [0.32, 0.03, 0.24], '#5a1a1a', [-24, 0, 0], VELR),
                                                P('box', [0, 0.14, 0.005], [0.3, 0.012, 0.21], '#e8e2d0', [-24, 0, 0], PAPER), P('box', [0.03, 0.08, 0.12], [0.012, 0.12, 0.004], '#a01a1a')], solid=False)
add('bible_open', 'Bible (open)', 'mass', [P('box', [0, 0.012, 0], [0.32, 0.024, 0.24], '#2a1a14', t=LEATHB), P('box', [-0.075, 0.03, 0], [0.15, 0.012, 0.22], '#e8e2d0', [0, 0, 4], PAPER),
                                           P('box', [0.075, 0.03, 0], [0.15, 0.012, 0.22], '#e8e2d0', [0, 0, -4], PAPER), P('box', [0.02, 0.04, 0.1], [0.006, 0.002, 0.08], '#a01a1a')], solid=False)
add('pyx', 'Pyx + burse', 'mass', [P('cyl', [0, 0.012, 0], [0.06, 0.024, 0.06], '#c9a23a', t=GOLD, seg=10), P('box', [0.1, 0.01, 0], [0.12, 0.02, 0.12], '#e8e4d8', t=BROCW)], solid=False)
add('corporal', 'Corporal + purificator (linens)', 'mass', [P('box', [0, 0.002, 0], [0.5, 0.004, 0.5], '#e8e4d8', t=LINEN), P('box', [0.3, 0.004, 0.1], [0.12, 0.008, 0.3], '#e8e4d8', t=LINEN)], solid=False)
add('candle_altar', 'Altar candle, single', 'mass', [P('cyl', [0, 0.03, 0], [0.14, 0.06, 0.14], '#b09050', t=GOLD, seg=8), P('cyl', [0, 0.12, 0], [0.04, 0.14, 0.04], '#b09050', t=GOLD, seg=6), *candle(0, 0.19, 0, 0.3, 0.03)],
    light={'p': [0, 0.55, 0], 'color': '#ffc878', 'energy': 0.35, 'range': 2.0}, solid=False)
add('crucifix_small', 'Altar crucifix (small)', 'mass', [P('cyl', [0, 0.015, 0], [0.14, 0.03, 0.1], '#c9a23a', t=GOLD, seg=8), *cross_shape(0, 0.03, 0, 0.42, 0.24, 0.025, '#c9a23a', GOLD),
                                                         P('box', [0, 0.3, 0.016], [0.03, 0.12, 0.012], '#e8dcc8')], solid=False)
add('stole', 'Stole (folded)', 'mass', [P('box', [0, 0.01, 0], [0.12, 0.02, 0.5], '#5a2a6a', t=VELP), P('box', [0.12, 0.01, 0.05], [0.12, 0.02, 0.4], '#5a2a6a', [0, 10, 0], VELP)], solid=False)
add('chasuble_hanging', 'Chasuble on a stand', 'mass', [P('cyl', [0, 0.03, 0], [0.4, 0.06, 0.4], '#2a2a2a', seg=8), P('cyl', [0, 0.75, 0], [0.04, 1.5, 0.04], '#2a2a2a', seg=6),
                                                        P('box', [0, 1.5, 0], [0.5, 0.04, 0.04], '#2a2a2a'), P('box', [0, 1.05, 0.03], [0.85, 0.95, 0.03], '#8a1a1a', t=BROC),
                                                        *cross_shape(0, 0.75, 0.05, 0.8, 0.5, 0.08, '#c9a23a', depth=0.005)])
add('sacristy_vestment_chest', 'Vestment chest (sacristy)', 'storage', [
    *cabinet_box(1.6, 0.95, 0.75, PEW, '#4a3220', top=PEW), *drawer_fronts(1.54, 0, 0.08, 0.38, 4, 0.21, '#3a2818', cols=2),], search=True)

# ================================================================== OFFICE
add('office_desk', 'Steel office desk', 'office', [
    P('box', [0, 0.745, 0], [1.5, 0.03, 0.76], '#8a6a48', t=LAM), P('box', [0, 0.72, 0], [1.5, 0.03, 0.76], '#5a6a5a', t=STEELG),
    P('box', [-0.53, 0.36, 0], [0.42, 0.7, 0.72], '#5a6a5a', t=STEELG), *drawer_fronts(0.4, -0.53, 0.02, 0.365, 3, 0.23, '#4e5e4e', '#b8b8b0'),
    P('box', [0.72, 0.36, 0], [0.04, 0.7, 0.72], '#5a6a5a', t=STEELG), P('box', [0.1, 0.4, -0.34], [1.2, 0.5, 0.02], '#5a6a5a', t=STEELG),
    P('box', [0.15, 0.66, 0.33], [0.6, 0.08, 0.04], '#4e5e4e')], search=True)
add('office_chair', 'Office chair (swivel)', 'office', [
    *[P('box', [math.cos(a) * 0.2, 0.05, math.sin(a) * 0.2], [0.42, 0.03, 0.05], '#1e1e1e', [0, -math.degrees(a), 0]) for a in [k * 1.2566 for k in range(5)]],
    *[P('sphere', [math.cos(a) * 0.38, 0.03, math.sin(a) * 0.38], [0.05, 0.05, 0.05], '#1e1e1e', seg=5) for a in [k * 1.2566 for k in range(5)]],
    P('cyl', [0, 0.27, 0], [0.05, 0.4, 0.05], '#3a3a3a', seg=6), P('box', [0, 0.48, 0.02], [0.48, 0.08, 0.46], '#2a3a4a', t='b:carpet_blue'),
    P('box', [0, 0.82, -0.22], [0.44, 0.5, 0.07], '#2a3a4a', [-6, 0, 0], 'b:carpet_blue'),
    P('box', [-0.25, 0.62, 0.0], [0.04, 0.03, 0.3], '#1e1e1e'), P('box', [0.25, 0.62, 0.0], [0.04, 0.03, 0.3], '#1e1e1e'),
    P('box', [-0.25, 0.55, 0.0], [0.03, 0.14, 0.03], '#1e1e1e'), P('box', [0.25, 0.55, 0.0], [0.03, 0.14, 0.03], '#1e1e1e')])
add('filing_cabinet', 'Filing cabinet, 4-drawer', 'office', [P('box', [0, 0.66, 0], [0.46, 1.32, 0.66], '#7a7e7a', t=FILING), P('box', [0, 1.33, 0], [0.47, 0.02, 0.67], '#6a6e6a')], search=True)
add('filing_cabinet_2', 'Filing cabinet, 2-drawer', 'office', [P('box', [0, 0.36, 0], [0.46, 0.72, 0.66], '#5a6a5a', t=FILING), P('box', [0, 0.73, 0], [0.47, 0.02, 0.67], '#4e5e4e'),
                                                                P('box', [0.05, 0.78, -0.05], [0.24, 0.08, 0.3], '#e2ddcc', [0, 8, 0], PAPER)], search=True)
add('typewriter', 'Typewriter', 'office', [
    P('box', [0, 0.04, 0], [0.42, 0.08, 0.34], '#2a2a2a'), P('wedge', [0, 0.1, 0.06], [0.42, 0.06, 0.22], '#2a2a2a', [0, 180, 0]),
    P('cyl', [0, 0.14, -0.1], [0.07, 0.48, 0.07], '#1a1a1a', [0, 0, 90], seg=8), P('box', [0, 0.2, -0.12], [0.26, 0.12, 0.004], '#e8e4d8', [-12, 0, 0], PAPER),
    *[P('cyl', [-0.14 + i * 0.04, 0.115 - j * 0.015, 0.06 + j * 0.035], [0.025, 0.01, 0.025], '#d8d4c8', seg=6) for j in range(3) for i in range(8)]], solid=False)
add('desk_phone', 'Desk phone (push-button)', 'office', [P('wedge', [0, 0.04, 0], [0.2, 0.08, 0.22], '#d8d0b8', [0, 180, 0]), P('box', [0, 0.1, -0.02], [0.22, 0.05, 0.06], '#d8d0b8'),
                                                        P('box', [0, 0.065, 0.05], [0.09, 0.008, 0.08], '#3a3a3a', [-18, 0, 0]), P('box', [0.12, 0.02, 0.05], [0.004, 0.004, 0.2], '#d8d0b8', [0, 30, 0])], solid=False)
add('desk_phone_rotary', 'Rotary phone', 'office', [P('box', [0, 0.04, 0], [0.2, 0.08, 0.22], '#1a1a1a'), P('cyl', [0, 0.085, 0.04], [0.11, 0.01, 0.11], '#2a2a2a', [-18, 0, 0], seg=10),
                                                    P('box', [0, 0.11, -0.04], [0.22, 0.04, 0.05], '#1a1a1a'), P('sphere', [-0.09, 0.11, -0.04], [0.06, 0.05, 0.06], '#1a1a1a', seg=6),
                                                    P('sphere', [0.09, 0.11, -0.04], [0.06, 0.05, 0.06], '#1a1a1a', seg=6)], solid=False)
add('desk_lamp', 'Desk lamp (banker\'s)', 'office', [P('cyl', [0, 0.012, 0], [0.14, 0.024, 0.14], '#b09050', t=BRASS, seg=8), P('cyl', [0, 0.17, 0], [0.02, 0.3, 0.02], '#b09050', t=BRASS, seg=6),
                                                    P('cyl', [0, 0.33, 0.04], [0.12, 0.3, 0.12], '#2a5a3a', [0, 0, 90], seg=8)],
    light={'p': [0, 0.28, 0.04], 'color': '#ffe0a8', 'energy': 0.5, 'range': 2.5}, solid=False)
add('computer_crt', 'Computer (beige CRT)', 'office', [
    P('box', [0, 0.05, -0.02], [0.44, 0.1, 0.4], '#c8c0aa'), P('box', [0, 0.28, -0.02], [0.38, 0.32, 0.38], '#d0c8b2'), P('box', [0, 0.28, 0.18], [0.3, 0.24, 0.01], '#1e2a24'),
    P('box', [0, 0.012, 0.32], [0.44, 0.024, 0.16], '#d0c8b2'), P('box', [0.3, 0.012, 0.3], [0.06, 0.024, 0.1], '#d0c8b2')], solid=False)
add('fax_machine', 'Fax machine', 'office', [P('box', [0, 0.05, 0], [0.34, 0.1, 0.3], '#3a3a3a'), P('wedge', [0, 0.13, -0.08], [0.3, 0.08, 0.12], '#3a3a3a'),
                                             P('box', [0, 0.11, 0.12], [0.24, 0.01, 0.12], '#e8e4d8', [10, 0, 0], PAPER), P('box', [0.1, 0.105, 0.06], [0.08, 0.01, 0.04], '#4a6a4a')], solid=False)
add('photocopier', 'Photocopier', 'office', [P('box', [0, 0.45, 0], [0.9, 0.9, 0.65], '#c8c4b8'), P('box', [0, 0.92, -0.02], [0.84, 0.04, 0.6], '#3a3a3a'),
                                             P('box', [0.5, 0.72, 0], [0.2, 0.04, 0.4], '#c8c4b8'), P('box', [0.3, 0.92, 0.3], [0.2, 0.04, 0.08], '#2a2a2a'),
                                             *drawer_fronts(0.8, 0, 0.05, 0.33, 2, 0.2, '#b8b4a8', '#3a3a3a')], search=True)
add('water_cooler', 'Water cooler', 'office', [P('box', [0, 0.5, 0], [0.32, 1.0, 0.32], '#d8d4c8'), P('cyl', [0, 1.2, 0], [0.28, 0.42, 0.28], '#9ab8c8', seg=10),
                                               P('cyl', [0, 1.43, 0], [0.12, 0.05, 0.12], '#9ab8c8', seg=8), P('box', [-0.06, 0.82, 0.17], [0.04, 0.06, 0.04], '#3a6aaa'),
                                               P('box', [0.06, 0.82, 0.17], [0.04, 0.06, 0.04], '#aa3a3a')])
add('coat_rack', 'Coat rack', 'office', [P('cyl', [0, 0.02, 0], [0.45, 0.04, 0.45], '#3a2818', t=WALNUT, seg=8), P('cyl', [0, 0.9, 0], [0.05, 1.8, 0.05], '#3a2818', t=WALNUT, seg=6),
                                         *[P('box', [math.cos(a) * 0.1, 1.72, math.sin(a) * 0.1], [0.2, 0.02, 0.02], '#3a2818', [0, -math.degrees(a), 25]) for a in (0, 1.57, 3.14, 4.71)],
                                         P('box', [0.12, 1.3, 0.05], [0.4, 0.8, 0.14], '#4a3a2a', [0, 0, 6], 'b:carpet_brown')], solid=False)
add('corkboard', 'Corkboard (wall)', 'office', [P('box', [0, 1.5, 0], [1.2, 0.9, 0.03], '#a07a50', t=CORK), P('box', [0, 1.5, -0.01], [1.26, 0.96, 0.02], '#5a3e28', t=OAK),
                                                *[P('box', [x, y, 0.02], [w, h, 0.003], c, [0, 0, rz]) for (x, y, w, h, c, rz) in ((-0.35, 1.7, 0.22, 0.28, '#e8e4d8', 4), (0.0, 1.55, 0.2, 0.26, '#f0e080', -3),
                                                                                                                      (0.35, 1.68, 0.24, 0.18, '#e8e4d8', 2), (-0.2, 1.3, 0.3, 0.2, '#e8e4d8', -6), (0.3, 1.3, 0.16, 0.22, '#d8e8f0', 5))]], solid=False)
add('chalkboard', 'Chalkboard (wall)', 'office', [P('box', [0, 1.45, 0], [2.0, 1.1, 0.03], '#2a3a30', t=CHALK), P('box', [0, 1.45, -0.01], [2.08, 1.18, 0.02], '#5a3e28', t=OAK),
                                                  P('box', [0, 0.88, 0.04], [2.0, 0.03, 0.08], '#5a3e28', t=OAK), P('box', [0.5, 0.9, 0.05], [0.08, 0.02, 0.012], '#e8e4d8')], solid=False)
add('cubicle_wall', 'Cubicle partition (1.5 m)', 'office', [P('box', [0, 0.75, 0], [1.5, 1.5, 0.06], '#5a6070', t='b:carpet_blue'), P('box', [0, 1.51, 0], [1.52, 0.03, 0.07], '#8a8a8a'),
                                                            P('box', [-0.75, 0.75, 0], [0.03, 1.5, 0.07], '#8a8a8a'), P('box', [0.75, 0.75, 0], [0.03, 1.5, 0.07], '#8a8a8a')])
add('metal_shelving', 'Metal shelving (boxes)', 'storage', [
    *[P('box', [x, 0.95, z], [0.03, 1.9, 0.03], '#6a6e6a', t=STEEL) for x in (-0.6, 0.6) for z in (-0.22, 0.22)],
    *[P('box', [0, y, 0], [1.22, 0.025, 0.46], '#7a7e7a', t=STEEL) for y in (0.1, 0.55, 1.0, 1.45, 1.88)],
    *[P('box', [x, y + 0.13, 0], [w, 0.24, 0.36], '#a88a5a', [0, rz, 0], CARD) for (y, x, w, rz) in ((0.1, -0.3, 0.42, 3), (0.1, 0.25, 0.5, -4), (0.55, -0.2, 0.6, 0), (1.0, 0.3, 0.4, 6), (1.45, -0.25, 0.46, -2))],
    P('box', [0.3, 0.68, 0.02], [0.35, 0.2, 0.3], '#e2ddcc', t=PAPER)], search=True)
add('bookcase_office', 'Bookcase (binders)', 'office', [
    P('box', [0, 0.9, 0], [0.92, 1.8, 0.34], '#8a6a48', t=LAM), *[P('box', [0, y, 0.02], [0.86, 0.02, 0.3], '#7a5a3a', t=LAM) for y in (0.45, 0.9, 1.35)],
    *[P('box', [-0.38 + i * 0.075, y + 0.17, 0.03], [0.065, 0.32, 0.26], c) for y in (0.05, 0.47, 0.92) for i, c in enumerate(['#2a3a6a', '#2a3a6a', '#8a2a2a', '#2a3a6a', '#3a5a3a', '#3a5a3a', '#e8e4d8', '#2a3a6a', '#8a2a2a', '#2a2a2a'])]], search=True)
add('wastebasket', 'Wastebasket', 'office', [P('cyl', [0, 0.17, 0], [0.28, 0.34, 0.28], '#4a4c50', t=STEEL, seg=10), P('sphere', [0.02, 0.33, 0.01], [0.1, 0.07, 0.09], '#e2ddcc', seg=5)], solid=False)
add('paper_stacks', 'Paper stacks + binders', 'office', [P('box', [0, 0.06, 0], [0.24, 0.12, 0.32], '#e2ddcc', t=PAPER), P('box', [0.02, 0.15, 0.01], [0.22, 0.06, 0.3], '#e2ddcc', [0, 6, 0], PAPER),
                                                        P('box', [0.22, 0.15, 0], [0.06, 0.3, 0.26], '#2a3a6a'), P('box', [0.29, 0.15, 0], [0.06, 0.3, 0.26], '#8a2a2a')], solid=False)
add('desk_clutter', 'Desk clutter (mug, stapler, rolodex)', 'office', [
    P('cyl', [-0.15, 0.05, 0], [0.08, 0.1, 0.08], '#e8e4d8', seg=8), P('box', [-0.1, 0.06, 0], [0.02, 0.05, 0.015], '#e8e4d8'),
    P('box', [0.05, 0.02, 0.06], [0.15, 0.04, 0.04], '#2a2a2a'), P('cyl', [0.18, 0.06, -0.02], [0.12, 0.12, 0.12], '#3a3a3a', [0, 0, 90], seg=8),
    P('box', [0.0, 0.004, -0.08], [0.3, 0.008, 0.22], '#e8e4d8', [0, 12, 0], PAPER), P('box', [0.02, 0.012, -0.06], [0.14, 0.006, 0.01], '#3a3aaa', [0, 30, 0])], solid=False)
add('wall_clock', 'Wall clock', 'office', [P('cyl', [0, 2.0, 0], [0.32, 0.05, 0.32], '#e8e4d8', [90, 0, 0], seg=12), P('cyl', [0, 2.0, -0.005], [0.36, 0.04, 0.36], '#2a2a2a', [90, 0, 0], seg=12),
                                           P('box', [0, 2.05, 0.03], [0.012, 0.1, 0.004], '#1a1a1a'), P('box', [0.04, 2.0, 0.03], [0.08, 0.01, 0.004], '#1a1a1a')], solid=False)
add('office_safe', 'Office safe', 'office', [P('box', [0, 0.4, 0], [0.6, 0.8, 0.6], '#3a3a3a', t=STEEL), P('box', [0, 0.42, 0.305], [0.5, 0.66, 0.01], '#2e2e2e'),
                                             P('cyl', [0.0, 0.5, 0.32], [0.12, 0.03, 0.12], '#b8b8b0', [90, 0, 0], seg=10), P('box', [0.16, 0.36, 0.33], [0.04, 0.14, 0.03], '#b8b8b0')], search=True)
add('conference_table', 'Conference table', 'office', [P('box', [0, 0.745, 0], [2.6, 0.04, 1.1], '#7a5a3a', t=LAM), P('box', [-0.9, 0.37, 0], [0.1, 0.72, 0.7], '#3a3a3a'),
                                                       P('box', [0.9, 0.37, 0], [0.1, 0.72, 0.7], '#3a3a3a'), P('box', [0, 0.05, 0], [2.0, 0.06, 0.1], '#3a3a3a')])

# ================================================================== STORAGE (more things to search)
add('footlocker', 'Footlocker', 'storage', [P('box', [0, 0.2, 0], [0.8, 0.38, 0.42], '#3a4a32', t='b:steel_green'), P('box', [0, 0.4, 0], [0.82, 0.04, 0.44], '#2e3a28', t='b:steel_green'),
                                            *[P('box', [x, 0.2, 0.215], [0.06, 0.38, 0.01], '#6a6a5a') for x in (-0.3, 0.3)], P('box', [0, 0.32, 0.225], [0.08, 0.08, 0.02], '#b8b8b0')], search=True)
add('cedar_chest', 'Cedar chest (hope chest)', 'storage', [P('box', [0, 0.06, 0], [1.1, 0.12, 0.5], '#4a2a18', t=CEDAR), P('box', [0, 0.32, 0], [1.06, 0.42, 0.48], '#8a4a2a', t=CEDAR),
                                                           P('box', [0, 0.555, 0], [1.12, 0.05, 0.52], '#6a3a20', t=CEDAR), P('box', [0, 0.45, 0.245], [0.08, 0.06, 0.01], '#b09050')], search=True)
add('steamer_trunk', 'Steamer trunk', 'storage', [P('box', [0, 0.3, 0], [0.95, 0.56, 0.55], '#3a2a1e', t=TRUNK), P('cyl', [0, 0.58, 0], [0.55, 0.95, 0.12], '#3a2a1e', [0, 0, 90], TRUNK, seg=8),
                                                  *[P('box', [x, 0.32, 0], [0.04, 0.6, 0.57], '#6a4a2a', t=OAK) for x in (-0.3, 0.3)], P('box', [0, 0.5, 0.285], [0.1, 0.1, 0.02], '#a8883a', t=BRASS),
                                                  P('box', [-0.5, 0.35, 0], [0.04, 0.04, 0.2], '#3a2a1e')], search=True)
add('toolchest', 'Tool chest (rolling)', 'storage', [P('box', [0, 0.5, 0], [0.7, 0.86, 0.46], '#8a2a24', t=RUST), *drawer_fronts(0.66, 0, 0.1, 0.235, 5, 0.16, '#7a241e', '#b8b8b0'),
                                                     *[P('cyl', [x, 0.05, z], [0.08, 0.08, 0.08], '#1a1a1a', [0, 0, 90], seg=6) for x in (-0.28, 0.28) for z in (-0.18, 0.18)]], search=True)
add('locker', 'Metal locker', 'storage', [P('box', [0, 0.9, 0], [0.38, 1.8, 0.45], '#5a6a6e', t=LOCKER), P('box', [0, 1.81, 0], [0.39, 0.02, 0.46], '#4a5a5e')], search=True)
add('locker_row', 'Lockers (row of 3)', 'storage', [*[P('box', [x, 0.9, 0], [0.38, 1.8, 0.45], '#5a6a6e', t=LOCKER) for x in (-0.39, 0, 0.39)],
                                                    P('box', [0.39, 1.0, 0.33], [0.36, 1.6, 0.02], '#5a6a6e', [0, 50, 0], LOCKER)], search=True)
add('crate_open', 'Crate (lid off)', 'storage', [P('box', [0, 0.3, 0], [0.7, 0.6, 0.5], '#8a6a40', t=CRATE), P('box', [0, 0.59, 0], [0.62, 0.02, 0.42], '#2a1e12'),
                                                 P('box', [0.5, 0.04, 0.3], [0.72, 0.03, 0.52], '#8a6a40', [0, 30, 6], CRATE), P('sphere', [0.1, 0.6, 0.05], [0.3, 0.1, 0.24], '#c8b088', seg=6)], search=True)
add('crate_stack', 'Crates (stacked)', 'storage', [P('box', [-0.32, 0.3, 0], [0.6, 0.6, 0.6], '#8a6a40', t=CRATE), P('box', [0.32, 0.25, 0.05], [0.56, 0.5, 0.56], '#7a5a34', [0, 8, 0], CRATE),
                                                   P('box', [-0.2, 0.86, 0.02], [0.52, 0.52, 0.52], '#8a6a40', [0, -10, 0], CRATE)], search=True)
add('cardboard_boxes', 'Cardboard boxes', 'storage', [P('box', [0, 0.2, 0], [0.5, 0.4, 0.4], '#a88a5a', t=CARD), P('box', [0.42, 0.15, 0.08], [0.4, 0.3, 0.36], '#9a7a4a', [0, 12, 0], CARD),
                                                      P('box', [0.05, 0.55, 0.0], [0.4, 0.3, 0.34], '#a88a5a', [0, -8, 0], CARD), P('box', [0.05, 0.71, -0.12], [0.4, 0.01, 0.16], '#a88a5a', [-50, -8, 0], CARD)], search=True)
add('barrel', 'Barrel', 'storage', [P('cyl', [0, 0.45, 0], [0.58, 0.9, 0.58], '#6a4a2a', t=OAK, seg=10), *[P('cyl', [0, y, 0], [0.6, 0.04, 0.6], '#2a2a2a', t=RUST, seg=10) for y in (0.12, 0.45, 0.78)],
                                    P('cyl', [0, 0.9, 0], [0.5, 0.01, 0.5], '#4a3220', t=LOGEND, seg=10)], search=True)
add('toy_chest', 'Toy chest', 'storage', [P('box', [0, 0.25, 0], [0.8, 0.5, 0.45], '#d8c8a0', t=PAINTED), P('box', [0, 0.51, 0], [0.82, 0.04, 0.47], '#c8584a'),
                                          P('box', [-0.2, 0.3, 0.228], [0.14, 0.14, 0.01], '#3a6aaa'), P('box', [0.0, 0.3, 0.228], [0.14, 0.14, 0.01], '#e0b030'), P('box', [0.2, 0.3, 0.228], [0.14, 0.14, 0.01], '#4a8a4a')], search=True)
add('sideboard', 'Sideboard / buffet', 'storage', [*cabinet_box(1.6, 0.86, 0.48, WALNUT, '#4a3220', top=WALNUT), *drawer_fronts(1.5, 0, 0.62, 0.245, 1, 0.18, '#3a2818', cols=3),
                                                   *[P('box', [x, 0.33, 0.245], [0.48, 0.5, 0.012], '#3a2818', t=WALNUT) for x in (-0.5, 0, 0.5)]], search=True)
add('china_hutch', 'China hutch', 'storage', [*cabinet_box(1.2, 0.85, 0.48, WALNUT, '#4a3220', top=WALNUT), P('box', [0, 1.4, -0.1], [1.16, 1.1, 0.3], '#4a3220', t=WALNUT),
                                              *[P('box', [x, 1.4, 0.055], [0.54, 1.0, 0.01], '#2a3440', t='b:glass') for x in (-0.29, 0.29)],
                                              *[P('cyl', [-0.4 + i * 0.16, 1.32, -0.1], [0.14, 0.14, 0.02], '#e8e4d8', [90, 0, 0], seg=10) for i in range(6)],
                                              *drawer_fronts(1.12, 0, 0.1, 0.245, 2, 0.35, '#3a2818', cols=2)], search=True)
add('armoire', 'Armoire (tall)', 'storage', [*cabinet_box(1.1, 2.1, 0.6, WALNUT, '#3a2818', top=WALNUT), P('box', [0, 2.2, 0], [1.2, 0.14, 0.66], '#2a1a10', t=WALNUT),
                                             *[P('box', [x, 1.25, 0.305], [0.5, 1.5, 0.012], '#4a3220', t=WALNUT) for x in (-0.27, 0.27)], *drawer_fronts(1.0, 0, 0.12, 0.305, 1, 0.3, '#3a2818', cols=2)], search=True)
add('medicine_cabinet', 'Medicine cabinet (wall)', 'storage', [P('box', [0, 1.5, 0], [0.5, 0.65, 0.14], '#d8d4c8'), P('box', [0, 1.5, 0.075], [0.46, 0.6, 0.01], '#2a3440', t='b:glass')], search=True, solid=False)
add('pantry_shelf', 'Pantry shelf (jars, cans)', 'storage', [
    P('box', [0, 0.9, -0.15], [1.0, 1.8, 0.02], '#5a4a38', t=PINE), *[P('box', [0, y, 0], [1.0, 0.025, 0.32], '#7a6040', t=PINE) for y in (0.3, 0.75, 1.2, 1.65)],
    *[P('cyl', [-0.4 + i * 0.12, y + 0.08, 0.02], [0.08, 0.14, 0.08], c, seg=8) for y in (0.31, 0.76, 1.21) for i, c in enumerate(['#8a6a3a', '#b8b8b0', '#c8583a', '#b8b8b0', '#6a8a4a', '#d8c070', '#b8b8b0', '#8a3a2a'])]], search=True)
add('gun_cabinet', 'Gun cabinet', 'storage', [*cabinet_box(0.7, 1.8, 0.35, WALNUT, '#3a2818', top=WALNUT), P('box', [0, 1.15, 0.18], [0.6, 1.1, 0.01], '#2a3440', t='b:glass'),
                                              *drawer_fronts(0.64, 0, 0.1, 0.18, 1, 0.28, '#2a1a10')], search=True)
add('pie_safe', 'Pie safe (tin panels)', 'storage', [*cabinet_box(0.9, 1.5, 0.42, PINE, '#6a5034'), *[P('box', [x, 1.0, 0.215], [0.38, 0.8, 0.01], '#9a9a90', t=STEEL) for x in (-0.2, 0.2)],
                                                     *drawer_fronts(0.86, 0, 0.1, 0.215, 1, 0.3, '#5a4028')], search=True)

# ================================================================== PLANTS: shrubs, flowers, dead flowers
for i, (w, h) in enumerate([(1.4, 1.0), (0.8, 0.7), (2.2, 1.3)]):
    add('shrub_round_%d' % (i + 1), ['Shrub, round', 'Shrub, small', 'Shrub, wide'][i], 'plants', bush_blob(0, 0, w, h, seed=10 + i, n=4 + i * 2))
add('hedge', 'Hedge (2 m)', 'plants', [P('box', [0, 0.6, 0], [2.0, 1.2, 0.7], '#2e4024', t=HEDGE), P('box', [0, 1.22, 0], [1.9, 0.1, 0.6], '#3a5a2a', t=HEDGE)])
add('hedge_overgrown', 'Hedge, overgrown (2 m)', 'plants', [P('box', [0, 0.7, 0], [2.0, 1.4, 0.8], '#2e4024', t=HEDGE), *bush_blob(-0.5, 0.1, 0.9, 0.6, seed=20, y0=1.1), *bush_blob(0.6, -0.1, 0.8, 0.5, seed=21, y0=1.15)])
add('boxwood', 'Boxwood (clipped ball)', 'plants', [P('sphere', [0, 0.4, 0], [0.8, 0.75, 0.8], '#2e4a24', t=HEDGE, seg=10)])
add('juniper', 'Juniper (cone)', 'plants', [P('cone', [0, 0.9, 0], [0.8, 1.8, 0.8], '#1e3a24', t=NEEDLES, seg=8), P('cyl', [0, 0.05, 0], [0.1, 0.1, 0.1], '#3e3028')])
add('holly', 'Holly bush', 'plants', [*bush_blob(0, 0, 1.2, 1.1, t=HEDGE, c='#1e3418', seed=30, n=6), *[P('sphere', [x, y, z], [0.04, 0.04, 0.04], '#b01a1a') for (x, y, z) in ((0.3, 0.8, 0.4), (-0.2, 0.9, 0.42), (0.1, 0.6, 0.48), (-0.4, 0.5, 0.3), (0.45, 0.4, 0.25))]])
add('fern_clump', 'Fern clump', 'plants', [*[P('box', [math.cos(a) * 0.22, 0.2, math.sin(a) * 0.22], [0.08, 0.02, 0.5], '#3a5a2a', [35, -math.degrees(a) + 90, 0], LEAVES_G) for a in [k * 0.785 for k in range(8)]]], solid=False)
add('tall_grass', 'Tall grass clump', 'plants', [*[P('box', [math.cos(a) * 0.1, 0.3, math.sin(a) * 0.1], [0.03, 0.6, 0.01], '#7a7a4a', [math.cos(a) * 15, math.degrees(a), math.sin(a) * 15], 'b:grass_dead') for a in [k * 0.52 for k in range(12)]]], solid=False)
add('weeds', 'Weeds', 'plants', [*[P('box', [math.cos(a) * 0.15, 0.15, math.sin(a) * 0.15], [0.05, 0.3, 0.01], '#4a5a2a', [math.cos(a) * 25, math.degrees(a), math.sin(a) * 25]) for a in [k * 0.9 for k in range(7)]],
                                 P('sphere', [0, 0.06, 0], [0.3, 0.12, 0.3], '#3a4a24', t=LEAVES_G, seg=6)], solid=False)
add('dead_bush', 'Dead bush (brittle)', 'plants', [*bush_blob(0, 0, 1.1, 0.9, t=DEADB, c='#4a3e2e', seed=40, n=5),
                                                   *[P('cyl', [math.cos(a) * 0.3, 0.6, math.sin(a) * 0.3], [0.02, 0.8, 0.02], '#5a4e3c', [math.cos(a) * 30, 0, math.sin(a) * 30], seg=4) for a in (0.5, 2.2, 3.9, 5.2)]])
add('bramble', 'Bramble / thorns', 'plants', [*bush_blob(0, 0, 1.6, 0.7, t=DEADB, c='#3a3428', seed=41, n=6),
                                              *[P('cyl', [math.cos(a) * 0.5, 0.4, math.sin(a) * 0.5], [0.015, 1.1, 0.015], '#4a2a20', [70 * math.cos(a), math.degrees(a), 70 * math.sin(a)], seg=4) for a in (0.3, 1.4, 2.6, 3.7, 4.9)]])
add('flower_bed', 'Flower bed (1×2 m)', 'plants', [P('box', [0, 0.06, 0], [1.0, 0.12, 2.0], '#3a2a1e', t=SOIL), P('box', [0, 0.14, 0], [0.9, 0.06, 1.9], '#3a5a2a', t=FLOW),
                                                   *[P('box', [x, 0.08, 0], [0.06, 0.16, 2.06], '#7a7870', t=STONE) for x in (-0.53, 0.53)],
                                                   *[P('box', [0, 0.08, z], [1.12, 0.16, 0.06], '#7a7870', t=STONE) for z in (-1.03, 1.03)],
                                                   *flowers(0, 0, 0.8, 1.8, 18, ['#c83a4a', '#e8d84a', '#e8e4e0', '#a84ab8', '#e0803a'], seed=50)], solid=False)
add('flower_bed_dead', 'Flower bed, dead (1×2 m)', 'plants', [P('box', [0, 0.06, 0], [1.0, 0.12, 2.0], '#3a2a1e', t=SOIL), P('box', [0, 0.13, 0], [0.9, 0.04, 1.9], '#4a3e2a', t=DEADF),
                                                             *[P('box', [x, 0.08, 0], [0.06, 0.16, 2.06], '#7a7870', t=MOSSY) for x in (-0.53, 0.53)],
                                                             *[P('box', [0, 0.08, z], [1.12, 0.16, 0.06], '#7a7870', t=MOSSY) for z in (-1.03, 1.03)],
                                                             *flowers(0, 0, 0.8, 1.8, 16, ['#6a3a2a', '#7a6a4a', '#8a7a6a', '#5a3a3a'], seed=51, dead=True)], solid=False)
add('rose_bush', 'Rose bush', 'plants', [*bush_blob(0, 0, 1.0, 1.1, t=ROSES, c='#1e3418', seed=60, n=5)])
add('rose_bush_dead', 'Rose bush, dead', 'plants', [*bush_blob(0, 0, 0.9, 0.9, t=DEADB, c='#3a2a20', seed=61, n=4),
                                                    *[P('sphere', [x, y, z], [0.07, 0.05, 0.07], '#4a1a1a', seg=5) for (x, y, z) in ((0.25, 0.75, 0.3), (-0.2, 0.8, 0.25), (0.05, 0.55, 0.4))]])
add('wildflowers', 'Wildflower patch', 'plants', [P('box', [0, 0.02, 0], [1.2, 0.04, 1.2], '#3a5a2a', t=FLOWW), *flowers(0, 0, 1.1, 1.1, 22, ['#ece8e0', '#e8d84a', '#a8a0e0', '#e8a0b0'], h=(0.15, 0.4), seed=70)], solid=False)
add('daisies', 'Daisies', 'plants', [*flowers(0, 0, 0.5, 0.5, 12, ['#f2f0ea'], h=(0.2, 0.32), seed=71), P('sphere', [0, 0.04, 0], [0.5, 0.08, 0.5], '#3a5a2a', t=LEAVES_G, seg=6)], solid=False)
add('lilies', 'Lilies (white)', 'plants', [*flowers(0, 0, 0.4, 0.4, 7, ['#f6f2e8'], h=(0.6, 0.85), seed=72), *[P('box', [math.cos(a) * 0.08, 0.2, math.sin(a) * 0.08], [0.04, 0.4, 0.01], '#3a5a2a', [math.cos(a) * 20, math.degrees(a), math.sin(a) * 20]) for a in (0, 1.6, 3.2, 4.7)]], solid=False)
add('sunflowers', 'Sunflowers (wilting)', 'plants', [*[p for (x, z, h, tilt) in ((0, 0, 1.6, 20), (0.25, 0.1, 1.4, 35), (-0.2, -0.1, 1.5, 50))
                                                       for p in [P('cyl', [x, h / 2, z], [0.03, h, 0.03], '#4a5a2a', seg=4), P('cyl', [x, h, z + 0.08], [0.26, 0.04, 0.26], '#c8a030', [90 - tilt, 0, 0], seg=10),
                                                                 P('cyl', [x, h, z + 0.1], [0.12, 0.05, 0.12], '#3a2414', [90 - tilt, 0, 0], seg=8)]]], solid=False)
add('potted_plant', 'Potted plant', 'plants', [P('cyl', [0, 0.17, 0], [0.32, 0.34, 0.32], '#a8583a', t='b:terracotta', seg=8), P('cyl', [0, 0.33, 0], [0.28, 0.02, 0.28], '#3a2a1e', seg=8),
                                               *bush_blob(0, 0, 0.55, 0.6, t=LEAVES_G, c='#2e4a24', seed=80, n=4, y0=0.32)])
add('potted_plant_dead', 'Potted plant, dead', 'plants', [P('cyl', [0, 0.17, 0], [0.32, 0.34, 0.32], '#a8583a', t='b:terracotta', seg=8), P('cyl', [0, 0.33, 0], [0.28, 0.02, 0.28], '#3a2a1e', seg=8),
                                                         *[P('cyl', [math.cos(a) * 0.04, 0.5, math.sin(a) * 0.04], [0.012, 0.36, 0.012], '#5a4a30', [math.cos(a) * 35, 0, math.sin(a) * 35], seg=4) for a in (0, 1.3, 2.6, 4.0, 5.2)],
                                                         *[P('box', [math.cos(a) * 0.14, 0.36 + 0.05 * (k % 2), math.sin(a) * 0.14], [0.06, 0.01, 0.04], '#6a5a34', [0, math.degrees(a), 40]) for k, a in enumerate((0.4, 1.8, 3.3, 4.6))]])
add('flower_urn', 'Stone urn with flowers', 'plants', [P('cyl', [0, 0.15, 0], [0.4, 0.3, 0.4], '#9a968c', t=STONE, seg=8), P('cone', [0, 0.45, 0], [0.62, 0.32, 0.62], '#9a968c', [180, 0, 0], STONE, seg=8),
                                                       P('cyl', [0, 0.62, 0], [0.6, 0.06, 0.6], '#9a968c', t=STONE, seg=8), *flowers(0, 0, 0.4, 0.4, 9, ['#c83a4a', '#e8e4e0', '#e8d84a'], h=(0.7, 0.95), seed=81)])
add('flower_urn_dead', 'Stone urn, dead flowers', 'plants', [P('cyl', [0, 0.15, 0], [0.4, 0.3, 0.4], '#8a8478', t=MOSSY, seg=8), P('cone', [0, 0.45, 0], [0.62, 0.32, 0.62], '#8a8478', [180, 0, 0], MOSSY, seg=8),
                                                             P('cyl', [0, 0.62, 0], [0.6, 0.06, 0.6], '#8a8478', t=MOSSY, seg=8), *flowers(0, 0, 0.4, 0.4, 8, ['#6a3a2a', '#7a6a4a', '#5a3a3a'], h=(0.7, 0.9), seed=82, dead=True)])
add('wreath_dead', 'Dead wreath (on stand)', 'plants', [P('box', [-0.2, 0.6, 0], [0.02, 1.2, 0.02], '#3a3a3a', [0, 0, 8]), P('box', [0.2, 0.6, 0], [0.02, 1.2, 0.02], '#3a3a3a', [0, 0, -8]),
                                                        *[P('sphere', [math.cos(a) * 0.3, 1.15 + math.sin(a) * 0.3, 0.02], [0.14, 0.14, 0.1], '#4a3e2a', t=DEADF, seg=5) for a in [k * 0.628 for k in range(10)]],
                                                        P('box', [0, 0.82, 0.05], [0.12, 0.3, 0.004], '#5a2a2a', [0, 0, 10])])
add('bouquet_grave', 'Grave bouquet (fresh)', 'plants', [P('cyl', [0, 0.1, 0], [0.12, 0.2, 0.12], '#b8bcc0', seg=8), *flowers(0, 0, 0.12, 0.12, 7, ['#c83a4a', '#f2f0ea', '#e8a0b0'], h=(0.3, 0.42), seed=83)], solid=False)
add('bouquet_dead', 'Grave bouquet (dead, wrapped)', 'plants', [P('box', [0, 0.02, 0], [0.12, 0.04, 0.4], '#c8c0a8', [0, 20, 0]), P('box', [0.02, 0.03, -0.12], [0.06, 0.004, 0.06], '#7a1a1a', [0, 20, 0]),
                                                               *[P('sphere', [math.cos(a) * 0.05 + 0.07, 0.04, math.sin(a) * 0.05 + 0.18], [0.06, 0.04, 0.06], c, seg=5) for a, c in ((0, '#5a3a2a'), (2.1, '#6a5a4a'), (4.2, '#4a2a2a'))]], solid=False)
add('leaf_pile', 'Leaf pile', 'plants', [P('sphere', [0, 0.08, 0], [1.2, 0.2, 1.0], '#7a4a1e', t=LEAVES_O, seg=7), P('sphere', [0.3, 0.06, 0.2], [0.6, 0.12, 0.5], '#6a5a2a', t=LEAVES_B, seg=6)], solid=False)

# ================================================================== GRAVES: headstones, crosses, monuments
add('gravestone', 'Headstone, rounded', 'graves', [P('box', [0, 0.38, 0], [0.56, 0.76, 0.14], '#7a7872', t=GRAN), P('cyl', [0, 0.76, 0], [0.56, 0.14, 0.2], '#7a7872', [90, 0, 0], GRAN, seg=12),
                                                   P('box', [0, 0.04, 0], [0.7, 0.08, 0.26], '#6a6862', t=GRAN), *grave_mound()])
add('gravestone_square', 'Headstone, square', 'graves', [P('box', [0, 0.36, 0], [0.62, 0.72, 0.16], '#5a5a58', t=GRAND), P('box', [0, 0.73, 0], [0.66, 0.04, 0.2], '#4a4a4c', t=GRAND),
                                                         P('box', [0, 0.06, 0], [0.8, 0.12, 0.3], '#4a4a4c', t=GRAND), P('box', [0, 0.45, 0.082], [0.42, 0.2, 0.005], '#2a2a2c'), *grave_mound()])
add('gravestone_gothic', 'Headstone, gothic arch', 'graves', [P('box', [0, 0.45, 0], [0.5, 0.9, 0.12], '#8a8478', t=STONE), P('cone', [0, 1.02, 0], [0.5, 0.26, 0.12], '#8a8478', t=STONE, seg=4),
                                                              *cross_shape(0, 0.55, 0.062, 0.22, 0.14, 0.03, '#6a6458', depth=0.01), P('box', [0, 0.05, 0], [0.6, 0.1, 0.22], '#7a7468', t=STONE), *grave_mound(grass=True)])
add('gravestone_old', 'Headstone, old (leaning, mossy)', 'graves', [P('box', [0, 0.38, 0.0], [0.5, 0.76, 0.1], '#7a7468', [-12, 0, 6], MOSSY), P('cyl', [0.03, 0.78, -0.08], [0.5, 0.1, 0.12], '#7a7468', [78, 0, 6], MOSSY, seg=10),
                                                                   *grave_mound(grass=True)])
add('gravestone_broken', 'Headstone, broken', 'graves', [P('box', [0, 0.22, 0], [0.56, 0.44, 0.14], '#7a7872', t=STONE), P('wedge', [0.05, 0.5, 0], [0.56, 0.14, 0.14], '#7a7872', [0, 0, 8], STONE),
                                                         P('box', [0.45, 0.06, 0.35], [0.5, 0.12, 0.4], '#7a7872', [80, 30, 0], STONE), P('box', [-0.3, 0.03, 0.4], [0.12, 0.06, 0.1], '#7a7872', [0, 20, 0], STONE),
                                                         *grave_mound(grass=True)])
add('gravestone_cracked', 'Headstone, cracked', 'graves', [P('box', [-0.14, 0.4, 0], [0.28, 0.8, 0.14], '#6a6a66', [0, 0, 2], GRAN), P('box', [0.15, 0.38, 0], [0.28, 0.76, 0.14], '#6a6a66', [0, 0, -4], GRAN),
                                                           P('box', [0, 0.04, 0], [0.7, 0.08, 0.26], '#5a5a58', t=GRAN), *grave_mound()])
add('gravestone_flat', 'Flat marker', 'graves', [P('box', [0, 0.03, 0], [0.6, 0.06, 0.32], '#7a5a54', [-6, 0, 0], GRANP), P('box', [0, 0.065, 0], [0.4, 0.004, 0.18], '#3a2a28', [-6, 0, 0])], solid=False)
add('ledger_slab', 'Ledger slab (tomb lid)', 'graves', [P('box', [0, 0.2, 0.95], [1.0, 0.4, 2.1], '#8a8478', t=STONE), P('box', [0, 0.42, 0.95], [1.1, 0.06, 2.2], '#9a9488', t=MOSSY),
                                                        P('box', [0, 0.452, 0.6], [0.06, 0.006, 0.8], '#6a6458'), P('box', [0, 0.452, 0.4], [0.4, 0.006, 0.06], '#6a6458')])
add('obelisk', 'Obelisk', 'graves', [P('box', [0, 0.2, 0], [0.9, 0.4, 0.9], '#7a7872', t=GRAN), P('box', [0, 0.55, 0], [0.7, 0.3, 0.7], '#7a7872', t=GRAN),
                                     P('box', [0, 1.6, 0], [0.42, 1.8, 0.42], '#8a8882', t=GRAN), P('cone', [0, 2.62, 0], [0.42, 0.26, 0.42], '#8a8882', [0, 45, 0], GRAN, seg=4)])
add('celtic_cross', 'Celtic cross', 'graves', [P('box', [0, 0.15, 0], [0.7, 0.3, 0.4], '#8a8478', t=STONE), P('box', [0, 1.0, 0], [0.18, 1.5, 0.14], '#8a8478', t=STONE),
                                               P('box', [0, 1.45, 0], [0.8, 0.16, 0.14], '#8a8478', t=STONE), P('cyl', [0, 1.45, 0], [0.5, 0.1, 0.5], '#8a8478', [90, 0, 0], STONE, seg=12),
                                               P('cyl', [0, 1.45, 0], [0.32, 0.12, 0.32], '#3a3a36', [90, 0, 0], seg=12), *grave_mound(grass=True)])
add('angel_monument', 'Angel monument', 'graves', [P('box', [0, 0.5, 0], [0.7, 1.0, 0.6], '#9a968c', t=MOSSY), P('box', [0, 1.02, 0], [0.76, 0.06, 0.66], '#8a8478', t=STONE),
                                                   P('cone', [0, 1.55, 0], [0.42, 1.0, 0.38], '#b8b4aa', t=MARG, seg=8), P('sphere', [0, 2.1, 0.02], [0.16, 0.18, 0.16], '#b8b4aa', t=MARG, seg=8),
                                                   P('box', [-0.28, 1.75, -0.12], [0.36, 0.7, 0.05], '#b8b4aa', [10, 25, 18], MARG), P('box', [0.28, 1.75, -0.12], [0.36, 0.7, 0.05], '#b8b4aa', [10, -25, -18], MARG),
                                                   P('box', [0, 1.75, 0.16], [0.08, 0.3, 0.06], '#b8b4aa', [-40, 0, 0], MARG), P('box', [0, 0.6, 0.302], [0.4, 0.3, 0.005], '#4a4844')])
add('angel_weeping', 'Weeping angel (kneeling)', 'graves', [P('box', [0, 0.25, 0], [0.8, 0.5, 0.6], '#8a8478', t=MOSSY), P('cone', [0, 0.8, 0], [0.5, 0.7, 0.5], '#a8a49a', t=MARG, seg=8),
                                                            P('sphere', [0, 1.12, 0.12], [0.15, 0.16, 0.15], '#a8a49a', t=MARG, seg=8), P('box', [-0.06, 1.05, 0.2], [0.06, 0.18, 0.06], '#a8a49a', [-60, 0, 10], MARG),
                                                            P('box', [0.06, 1.05, 0.2], [0.06, 0.18, 0.06], '#a8a49a', [-60, 0, -10], MARG),
                                                            P('box', [-0.3, 1.0, -0.15], [0.4, 0.8, 0.05], '#a8a49a', [-20, 30, 28], MARG), P('box', [0.3, 1.0, -0.15], [0.4, 0.8, 0.05], '#a8a49a', [-20, -30, -28], MARG)])
add('lamb_grave', 'Child\'s grave (lamb)', 'graves', [P('box', [0, 0.2, 0], [0.5, 0.4, 0.3], '#d8d4cc', t=MARW), P('sphere', [0, 0.52, 0], [0.34, 0.22, 0.2], '#e8e4dc', t=MARW, seg=8),
                                                       P('sphere', [0.16, 0.6, 0], [0.1, 0.12, 0.1], '#e8e4dc', t=MARW, seg=6), *grave_mound(0.6, 1.1)])
add('grave_cross_wood', 'Grave cross, wooden', 'graves', [*cross_shape(0, 0, 0, 1.1, 0.5, 0.07, '#6a5a48', WEATHER), P('box', [0, 0.82, 0.04], [0.3, 0.06, 0.005], '#2a2a2a'), *grave_mound()])
add('cross_grave', 'Grave cross (simple)', 'graves', [*cross_shape(0, 0, 0, 1.1, 0.5, 0.08, '#6a5a48', WEATHER)])
add('grave_cross_iron', 'Grave cross, iron', 'graves', [*cross_shape(0, 0, 0, 1.2, 0.56, 0.035, '#1a1a1a', IRON), P('cyl', [0, 0.84, 0], [0.24, 0.02, 0.24], '#1a1a1a', [90, 0, 0], seg=10),
                                                        P('sphere', [0, 1.22, 0], [0.06, 0.06, 0.06], '#1a1a1a'), *grave_mound(grass=True)])
_a = math.radians(28)
add('grave_cross_tilted', 'Grave cross, leaning', 'graves', [P('box', [-math.sin(_a) * 0.55, math.cos(_a) * 0.55, 0], [0.07, 1.1, 0.07], '#6a5a48', [0, 0, 28], WEATHER),
                                                             P('box', [-math.sin(_a) * 0.77, math.cos(_a) * 0.77, 0], [0.5, 0.07, 0.07], '#6a5a48', [0, 0, 28], WEATHER), *grave_mound(grass=True)])
add('grave_fresh', 'Fresh grave (mound + marker)', 'graves', [P('box', [0, 0.14, 0.95], [1.0, 0.28, 2.0], '#3a2a1e', t=SOIL), P('box', [0, 0.25, 0], [0.04, 0.5, 0.04], '#8a7a5a'),
                                                              P('box', [0, 0.45, 0.02], [0.24, 0.12, 0.01], '#e8e4d8'), *flowers(0.2, 1.2, 0.3, 0.4, 4, ['#c83a4a', '#f2f0ea'], h=(0.15, 0.2), seed=90)])
add('grave_open', 'Open grave', 'graves', [P('box', [0, -0.01, 0.95], [1.1, 0.02, 2.1], '#0a0806'), P('box', [-0.65, 0.15, 0.95], [0.2, 0.3, 2.3], '#3a2a1e', t=SOIL), P('box', [0.65, 0.15, 0.95], [0.2, 0.3, 2.3], '#3a2a1e', t=SOIL),
                                           P('box', [1.3, 0.25, 0.9], [0.9, 0.5, 1.6], '#3a2a1e', [0, 0, 10], SOIL), P('box', [0.9, 0.5, 0.3], [0.04, 1.2, 0.04], '#5a4632', [0, 0, -25]),
                                           P('box', [0.66, 0.0, 0.45], [0.22, 0.3, 0.02], '#4a4a4a', [0, 0, -25])], solid=False)
add('grave_plot_fenced', 'Family plot (iron rail)', 'graves', [*[P('box', [x, 0.3, 0.95], [0.03, 0.6, 2.4], '#1a1a1a', t=IRON) for x in (-0.9, 0.9)],
                                                               *[P('box', [0, 0.3, z], [1.8, 0.6, 0.03], '#1a1a1a', t=IRON) for z in (-0.25, 2.15)],
                                                               *[P('cone', [x, 0.66, z], [0.06, 0.12, 0.06], '#1a1a1a', seg=4) for x in (-0.9, 0.9) for z in (-0.25, 2.15)],
                                                               P('box', [-0.4, 0.3, 0.1], [0.4, 0.6, 0.1], '#7a7468', t=MOSSY), P('box', [0.4, 0.26, 0.1], [0.4, 0.52, 0.1], '#7a7468', t=MOSSY),
                                                               P('box', [0, 0.04, 1.1], [1.7, 0.08, 2.2], '#3e4a2e', t='b:grass_dead')])
add('mausoleum', 'Mausoleum (small)', 'graves', [P('box', [0, 0.15, 0], [2.6, 0.3, 3.2], '#8a8478', t=STONE), P('box', [0, 1.45, -0.1], [2.2, 2.3, 2.8], '#9a968c', t=MOSSY),
                                                 P('wedge', [0, 2.85, -0.1], [2.5, 0.6, 3.1], '#7a7468', t=STONE), P('box', [0, 1.2, 1.31], [0.9, 1.8, 0.04], '#2a2a2a', t=IRON),
                                                 *[P('cyl', [x, 1.45, 1.4], [0.24, 2.3, 0.24], '#a8a49a', t=MARG, seg=8) for x in (-0.95, 0.95)], P('box', [0, 2.5, 1.32], [1.4, 0.24, 0.02], '#5a5650'),
                                                 *cross_shape(0, 3.15, 1.25, 0.5, 0.3, 0.07, '#7a7468', STONE)], search=True)
add('sarcophagus', 'Sarcophagus', 'graves', [P('box', [0, 0.4, 0], [0.9, 0.8, 2.1], '#9a968c', t=MARG), P('box', [0, 0.85, 0], [1.0, 0.1, 2.2], '#b8b4aa', t=MARW),
                                             P('box', [0, 0.92, 0], [0.7, 0.06, 1.8], '#b8b4aa', t=MARW), P('box', [0, 0.96, -0.3], [0.08, 0.02, 0.9], '#8a8478')], search=True)
add('grave_lantern', 'Grave lantern (memorial candle)', 'graves', [P('box', [0, 0.1, 0], [0.16, 0.2, 0.16], '#2a2a2a', t=IRON), P('box', [0, 0.1, 0], [0.13, 0.17, 0.17], '#9a1a1a'),
                                                                   P('cone', [0, 0.24, 0], [0.2, 0.08, 0.2], '#2a2a2a', t=IRON, seg=4), P('box', [0, 0.3, 0], [0.04, 0.04, 0.04], '#2a2a2a')],
    light={'p': [0, 0.12, 0], 'color': '#ff6a3a', 'energy': 0.35, 'range': 1.8}, solid=False)
add('lamp_cemetery_post', 'Cemetery lamp post (iron, lantern)', 'graves', [
    P('cyl', [0, 0.08, 0], [0.34, 0.16, 0.34], '#1a1a1a', t=IRON, seg=8), P('cyl', [0, 1.3, 0], [0.09, 2.4, 0.09], '#1a1a1a', t=IRON, seg=8),
    P('box', [0, 2.2, 0], [0.4, 0.04, 0.04], '#1a1a1a', t=IRON), P('box', [0, 2.6, 0], [0.26, 0.4, 0.26], '#f0d8a0'),
    *[P('box', [x, 2.6, z], [0.03, 0.42, 0.03], '#1a1a1a') for x in (-0.13, 0.13) for z in (-0.13, 0.13)],
    P('cone', [0, 2.9, 0], [0.4, 0.22, 0.4], '#1a1a1a', t=IRON, seg=4), P('sphere', [0, 3.04, 0], [0.06, 0.06, 0.06], '#1a1a1a')],
    light={'p': [0, 2.6, 0], 'color': '#ffcf88', 'energy': 1.1, 'range': 8.0})
add('lamp_cemetery_post_broken', 'Cemetery lamp post (dead, glass broken)', 'graves', [
    P('cyl', [0, 0.08, 0], [0.34, 0.16, 0.34], '#1a1a1a', t=IRON, seg=8), P('cyl', [0, 1.3, 0], [0.09, 2.4, 0.09], '#1a1a1a', [0, 0, 4], RUST, seg=8),
    P('box', [0.08, 2.6, 0], [0.26, 0.4, 0.26], '#1a1a1a', [0, 0, 4], RUST), P('box', [0.08, 2.6, 0.14], [0.2, 0.3, 0.005], '#2a3440', [0, 0, 4]),
    P('cone', [0.1, 2.9, 0], [0.4, 0.22, 0.4], '#1a1a1a', [0, 0, 14], RUST, seg=4)])
add('lamp_grave_shepherd', 'Shepherd\'s hook lantern', 'graves', [
    P('cyl', [0, 0.7, 0], [0.03, 1.4, 0.03], '#1a1a1a', seg=6), P('box', [0.1, 1.42, 0], [0.22, 0.03, 0.03], '#1a1a1a', [0, 0, -15]),
    P('box', [0.22, 1.2, 0], [0.12, 0.18, 0.12], '#f0d090'), P('cone', [0.22, 1.33, 0], [0.16, 0.08, 0.16], '#1a1a1a', seg=4)],
    light={'p': [0.22, 1.2, 0], 'color': '#ffb070', 'energy': 0.5, 'range': 3.0}, solid=False)
add('lamp_lantern_ground', 'Oil lantern (on the ground)', 'graves', [P('cyl', [0, 0.02, 0], [0.16, 0.04, 0.16], '#3a3a36', t=RUST, seg=8), P('cyl', [0, 0.13, 0], [0.13, 0.18, 0.13], '#f0d090', seg=8),
                                                                     P('cone', [0, 0.25, 0], [0.16, 0.08, 0.16], '#3a3a36', t=RUST, seg=8), P('box', [0, 0.32, 0], [0.12, 0.012, 0.012], '#3a3a36')],
    light={'p': [0, 0.14, 0], 'color': '#ffb060', 'energy': 0.5, 'range': 3.0}, solid=False)
add('grave_vase', 'Grave vase (bronze)', 'graves', [P('cyl', [0, 0.12, 0], [0.12, 0.24, 0.12], '#5a6a3a', t=BRASS, seg=8), *flowers(0, 0, 0.1, 0.1, 5, ['#6a3a2a', '#5a3a3a'], h=(0.3, 0.38), seed=95, dead=True)], solid=False)
add('grave_bench_stone', 'Stone bench (memorial)', 'graves', [P('box', [0, 0.42, 0], [1.4, 0.1, 0.42], '#8a8478', t=STONE), P('box', [-0.5, 0.2, 0], [0.16, 0.4, 0.36], '#7a7468', t=MOSSY),
                                                              P('box', [0.5, 0.2, 0], [0.16, 0.4, 0.36], '#7a7468', t=MOSSY)])
add('cemetery_sign', 'Cemetery arch sign', 'graves', [*[P('box', [x, 1.45, 0], [0.12, 2.9, 0.12], '#1a1a1a', t=IRON) for x in (-1.5, 1.5)],
                                                      P('box', [0, 2.82, 0], [3.1, 0.06, 0.06], '#1a1a1a', t=IRON), P('box', [0, 2.35, 0], [3.0, 0.05, 0.05], '#1a1a1a', t=IRON),
                                                      P('box', [0, 2.58, 0], [2.2, 0.36, 0.03], '#1a1a1a', t=IRON), P('box', [0, 2.58, 0.02], [1.9, 0.08, 0.01], '#6a6458'),
                                                      *[P('box', [x, 2.58, 0], [0.03, 0.44, 0.03], '#1a1a1a') for x in (-1.3, -1.15, 1.15, 1.3)],
                                                      *cross_shape(0, 2.85, 0, 0.36, 0.2, 0.04, '#1a1a1a', IRON),
                                                      *[P('sphere', [x, 2.95, 0], [0.12, 0.12, 0.12], '#1a1a1a', seg=6) for x in (-1.5, 1.5)]], solid=False)

# ------------------------------------------------------------------ keep the old names working
ALIASES = {}

# ================================================================== write it out
CATS = [('indoor', 'Indoor'), ('storage', 'Storage (searchable)'), ('church', 'Church'), ('mass', 'Mass & altar items'), ('office', 'Office'),
        ('outdoor', 'Outdoor'), ('plants', 'Shrubs & flowers'), ('graves', 'Graveyard'), ('figures', 'Scale figures'), ('custom', 'Your assets')]

def texture_files():
    """Every texture the designer embeds: md (the base set, improved), v11 and v12 (the newest). id -> (path, size_m)"""
    out = {}
    for d in ('md', 'v11', 'v12'):
        sizes = {}
        sp = os.path.join(ROOT, 'assets/textures', d, 'sizes.json')
        if os.path.exists(sp): sizes = json.load(open(sp))
        for f in sorted(glob.glob(os.path.join(ROOT, 'assets/textures', d, '*.png'))):
            k = os.path.splitext(os.path.basename(f))[0]
            if k.startswith('user_') or k in ('fern', 'leaf_drift', 'leaf_drift_big'): continue
            out[k] = (f, sizes.get(k, (1.0, 1.0)), d)
    return out

def main():
    lib_path = os.path.join(ROOT, 'data/maps/designer_assets.json')
    old = json.load(open(lib_path))
    # every texture an asset uses must exist
    tex = texture_files()
    missing = sorted({p['t'] for a in A.values() for p in a['parts'] if p.get('t') and p['t'][2:] not in tex})
    assert not missing, missing
    lib = {'assets': dict(A), 'figures': old.get('figures', {}), 'categories': CATS}
    for k, f in old.get('figures', {}).items():
        lib['assets']['fig_' + k] = {'name': f['name'], 'cat': 'figures', 'parts': f['parts']}
    for k, v in old['assets'].items():                      # anything only the old library had (custom assets) carries over
        if k not in lib['assets']: lib['assets'][k] = v
    json.dump(lib, open(lib_path, 'w'), indent=None, separators=(',', ':'))
    print('library: %d assets (%s)' % (len(A), ', '.join('%s %d' % (c, sum(1 for a in A.values() if a['cat'] == c)) for c, _ in CATS[:-2])))
    print('searchable:', sum(1 for a in A.values() if a.get('search')), ' lamps:', sum(1 for a in A.values() if a.get('light')))
    # the designer: the library and the textures, between markers
    html_path = os.path.join(ROOT, 'tools/map_designer.html')
    html = open(html_path).read()
    imgs = {}
    for k, (f, sz, d) in tex.items():
        imgs[k] = {'src': 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode(), 'm': list(sz), 'set': d}
    block = ('/*LIB:BEGIN (generated by tools/designer_library.py: edit the library there)*/\n'
             'const LIB_ASSETS = ' + json.dumps(A, separators=(',', ':')) + ';\n'
             'const LIB_CATS = ' + json.dumps(CATS) + ';\n'
             'const LIB_TEXTURES = ' + json.dumps(imgs, separators=(',', ':')) + ';\n'
             '/*LIB:END*/')
    chapel = json.load(open(os.path.join(ROOT, 'data/maps/designer_default_chapel.json')))
    dblock = '/*DEFAULT:BEGIN (generated: tools/make_default_chapel.py)*/\nconst DEFAULT_MAP = ' + json.dumps(chapel, separators=(',', ':')) + ';\n/*DEFAULT:END*/'
    html = re.sub(r'/\*DEFAULT:BEGIN.*?/\*DEFAULT:END\*/', lambda m: dblock, html, flags=re.S)
    if '/*LIB:BEGIN' in html:
        html = re.sub(r'/\*LIB:BEGIN.*?/\*LIB:END\*/', lambda m: block, html, flags=re.S)
    else:
        raise SystemExit('add /*LIB:BEGIN*/ /*LIB:END*/ markers to the designer first')
    open(html_path, 'w').write(html)
    print('designer: %d textures embedded, %.0f KB' % (len(imgs), len(html) / 1024))

if __name__ == '__main__':
    main()
