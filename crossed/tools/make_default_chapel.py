#!/usr/bin/env python3
"""The Map Designer's default start: the user's chapel (data/maps/exports/sample_cabin_2026-10-27.json), plus what their notes asked for.

Keeps every object they made (same ids), then:
  - the white boards: worn white inside, ruined white outside (each wall's inside face found from the room it closes);
    the upstairs room's wallpaper / siding put on the right faces
  - concrete stairs; the second flight goes DOWN to a new, dark basement (their note: "these will be going into the basement")
  - the stage at the head of the chapel, 0.6 m up, small sets of steps at both front corners, the altar and Bellemood on it,
    and the Mass things in their places
  - a ceiling and a gable roof over the chapel, a shed roof over the upstairs room
Writes data/maps/designer_default_chapel.json (tools/designer_library.py embeds it in the designer).
"""
import json, math, os, copy
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data/maps/exports/sample_cabin_2026-10-27.json')
OUT = os.path.join(ROOT, 'data/maps/designer_default_chapel.json')
VERSION = 'chapel-2026-10-27b'

src = json.load(open(SRC))
m = {k: copy.deepcopy(src[k]) for k in ('app', 'version', 'name', 'units', 'notes', 'levels', 'textures', 'assets', 'objects')}
m['name'] = 'Chapel'
m['version'] = 1
base_ids = [o['id'] for o in src['objects']]
O = m['objects']
L0, UP, BS = 'L0', 'Ljn7j5f', 'Lbase'

def rects_contain(rects, x, z):
    return any(x0 < x < x1 and z0 < z < z1 for (x0, z0, x1, z1) in rects)
def face_tex(w, rects, inside, outside):
    """B is the face to the left of a->b in the plan (normal (-uz, ux)); A the right."""
    (ax, az), (bx, bz) = w['a'], w['b']
    L = math.hypot(bx - ax, bz - az); ux, uz = (bx - ax) / L, (bz - az) / L
    mx, mz = (ax + bx) / 2, (az + bz) / 2
    b_in = rects_contain(rects, mx - uz * 0.3, mz + ux * 0.3)
    w['texA'], w['texB'] = (outside, inside) if b_in else (inside, outside)
    for k in ('texA2', 'texB2'): w[k] = ''

CHAPEL = [(-28, -6, -18, 8.5), (-18, -6, -13, -2.5)]          # the nave and the stair annex
UPROOM = [(-18, -5.5, -13.5, -3)]
for o in O:
    if o['type'] == 'wall' and o['level'] == L0:
        face_tex(o, CHAPEL, 'b:whitewash_worn', 'b:whitewash_ruined'); o['scale'] = 1
    elif o['type'] == 'wall' and o['level'] == UP:
        face_tex(o, UPROOM, 'b:wallpaper', 'b:whitewash_chipped')
    elif o['type'] == 'stairs':
        o['tex'] = 'b:concrete_steps'
        if o['id'] == 'shg33qi': o['to'] = BS
    elif o['type'] == 'figure' and o['who'] == 'louis':
        o['who'] = 'bellemood'; o['y'] = 0.6
    elif o['type'] == 'prop' and o['asset'] == 'altar':
        o['y'] = 0.6

m['levels'].append({'id': BS, 'name': 'Basement', 'elev': -2.6, 'height': 2.4, 'dark': True})
n = [0]
def uid(p):
    n[0] += 1; return '%sdc%03d' % (p, n[0])
def prop(asset, x, z, rot=0, y=0.0, level=L0, **kw):
    o = {'id': uid('p'), 'type': 'prop', 'level': level, 'asset': asset, 'x': round(x, 3), 'z': round(z, 3), 'rot': rot, 'scale': 1, 'ptex': '', 'ptex2': '', 'ptex2a': 1}
    if y: o['y'] = round(y, 3)
    o.update(kw); O.append(o); return o

# ------------------------------------------------------------------ the stage at the head of the chapel
ST_X, ST_Z, ST_W, ST_D, ST_H = -27.85, -5.85, 8.45, 4.35, 0.6
O.append({'id': uid('s'), 'type': 'platform', 'level': L0, 'x': ST_X, 'z': ST_Z, 'w': ST_W, 'd': ST_D, 'h': ST_H,
          'tex': 'b:walnut_planks', 'texSide': 'b:whitewash_worn',
          'steps': [{'edge': 's', 'at': round(0.75 / ST_W, 3), 'width': 1.0}, {'edge': 's', 'at': round(1 - 0.75 / ST_W, 3), 'width': 1.0}],
          'note': 'The sanctuary stage (0.6 m). Steps at both front corners; the front edge is a ledge she can drop from (brief stun on landing).'})
Y = ST_H
ALTAR_TOP = Y + 1.06
prop('crucifix_wall', -23.5, -5.9, y=-0.55, solid=False)
prop('candlestick_tall', -25.5, -3.0, y=Y)
prop('candlestick_tall', -21.5, -3.0, y=Y)
prop('credence_table', -26.7, -5.45, y=Y)
prop('tabernacle', -26.7, -5.45, y=Y + 0.88)
prop('sanctuary_lamp', -25.9, -4.9, y=-0.62, solid=False)
prop('sedilia', -21.0, -5.3, y=Y)
prop('ambo', -20.4, -2.4, y=Y)
prop('processional_cross', -19.9, -5.4, y=Y)
prop('paschal_candle', -26.9, -2.3, y=Y)
prop('corporal', -23.45, -2.95, y=ALTAR_TOP, solid=False)
prop('chalice', -23.3, -2.9, y=ALTAR_TOP + 0.004, solid=False)
prop('paten', -23.65, -2.92, y=ALTAR_TOP + 0.004, solid=False)
prop('missal_stand', -24.25, -2.85, y=ALTAR_TOP, solid=False)
prop('cruets', -26.45, -5.3, y=Y + 0.88, solid=False)
prop('thurible', -20.2, -4.6, y=Y)

# ------------------------------------------------------------------ the basement the second flight leads to (dark)
bx0, bz0, bx1, bz1 = -19.5, -6.5, -9.5, -0.5
O.append({'id': uid('f'), 'type': 'floor', 'level': BS, 'x': bx0, 'z': bz0, 'w': bx1 - bx0, 'd': bz1 - bz0, 'tex': 'b:concrete_rough', 'scale': 1, 'ground': False})
corners = [[bx0, bz0], [bx0, bz1], [bx1, bz1], [bx1, bz0]]           # counter-clockwise in the plan: face A is inside
for i in range(4):
    O.append({'id': uid('w'), 'type': 'wall', 'level': BS, 'a': corners[i], 'b': corners[(i + 1) % 4], 'height': 2.4, 'thick': 0.2,
              'texA': 'b:basement_block', 'texB': 'b:concrete_rough', 'openings': [], 'scale': 1})
O.append({'id': uid('c'), 'type': 'ceiling', 'level': BS, 'x': bx0, 'z': bz0, 'w': bx1 - bx0, 'd': bz1 - bz0, 'h': 2.4, 'tex': 'b:concrete_rough', 'scale': 1,
          'note': 'The basement: no light at all. Norah needs the flashlight down here.'})
prop('metal_shelving', -11.6, -6.05, level=BS)
prop('crate_stack', -10.3, -1.3, rot=15, level=BS)
prop('cardboard_boxes', -18.7, -1.3, rot=-20, level=BS)
prop('steamer_trunk', -18.8, -5.7, rot=90, level=BS)
prop('barrel', -12.8, -1.1, level=BS)
prop('sacristy_vestment_chest', -15.0, -6.05, level=BS)

# ------------------------------------------------------------------ ceiling and roofs
O.append({'id': uid('c'), 'type': 'ceiling', 'level': L0, 'x': -28, 'z': -6, 'w': 10, 'd': 14.5, 'h': 2.4, 'tex': 'b:whitewash_worn', 'scale': 1, 'note': ''})
O.append({'id': uid('r'), 'type': 'roof', 'level': L0, 'x': -28, 'z': -6, 'w': 10, 'd': 14.5, 'style': 'gable', 'ridge': 'z', 'high': 'n', 'pitch': 40,
          'overhang': 0.35, 'base': 2.4, 'thick': 0.12, 'tex': 'b:shingle_dark', 'texGable': 'b:whitewash_ruined', 'note': ''})
O.append({'id': uid('r'), 'type': 'roof', 'level': UP, 'x': -18, 'z': -5.5, 'w': 4.5, 'd': 2.5, 'style': 'shed', 'ridge': 'x', 'high': 'w', 'pitch': 18,
          'overhang': 0.25, 'base': 2.4, 'thick': 0.12, 'tex': 'b:shingle_dark', 'texGable': 'b:whitewash_chipped', 'note': ''})

m['notes'] = (m.get('notes') or '')
m['version_tag'] = VERSION
out = {'version': VERSION, 'base_ids': base_ids, **m}
json.dump(out, open(OUT, 'w'), indent=1)
print('default chapel: %d objects (%d yours), %d levels' % (len(O), len(base_ids), len(m['levels'])))
