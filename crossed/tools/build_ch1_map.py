#!/usr/bin/env python3
"""Builds scenes/chapter1/chapter1.tscn from the Map Designer file data/maps/ch1_map.json (v9 onward).

Everything the designer holds is imported as drawn: walls with their doors and windows (each face keeps its
texture), floors, the designer's props (built from the same primitive parts, with the designer's colours),
lights, and the twenty cameras with their trigger zones (tracking cameras get tracking_camera.gd).
On top of the map, this script adds what the designer can't express:
  - roofs and ceilings on every building, the second storey shell on Louis's house
  - smooth roads following the drawn dirt/gravel (the cul-de-sac ring, Norah's lane, Louis's drive, the exit)
  - the reworked neighbourhood around the cul-de-sac (houses, drives, mailboxes, a small green in the ring)
  - Norah's sedan (detailed) and Louis's rusty pickup in place of the two sedan props
  - Adaline's wallpaper, Louis's ruined interior (torn paper, blood, claw marks)
  - interaction points, the highway for the drive, Louis, the post-process layer
It also writes data/ch1_layout.json (bounds, the house navigation graph, the drive paths) for the director.
Run:  python3 tools/build_ch1_map.py
"""
import os, sys, math, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tscn import Scene, T, V3, V2, C, f, look_at_rows, yaw
from house_kit import Kit, rot_x, rot_z, mul

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = json.load(open(os.path.join(ROOT, 'data', 'maps', 'ch1_map.json')))
LIB = json.load(open(os.path.join(ROOT, 'data', 'maps', 'designer_assets.json')))
ASSETS = LIB['assets']
OBJ = MAP['objects']
# floors of a building (Map Designer levels): basements have negative elevations; everything on a level sits at its elevation
LEV = {l['id']: float(l.get('elev', 0) or 0) for l in MAP.get('levels', [])}
def EV(o): return LEV.get(o.get('level'), 0.0)
def stair_geom(o):
    """Stairs climb toward their arrow to the level above, or (when 'to' is lower, a basement) go down toward it.
    lo = the bottom's elevation; hole = the level whose floors get the stairwell cut."""
    fr = EV(o); to = LEV.get(o.get('to'), fr + 2.6); desc = to < fr - 0.05
    lo, hi = (to, fr) if desc else (fr, to); rise = max(0.2, hi - lo)
    ladder = o.get('kind') == 'ladder'; run = 0.45 if ladder else (o.get('run') or rise * 1.35); w = o.get('width') or (0.6 if ladder else 1.0)
    y = math.radians(o.get('rot', 0) or 0); fx, fz = -math.sin(y), -math.cos(y); rx, rz = -fz, fx
    P = [(o['x'] + fx * a + rx * b, o['z'] + fz * a + rz * b) for a, b in ((0, -w / 2), (0, w / 2), (run, w / 2), (run, -w / 2))]
    xs = [q[0] for q in P]; zs = [q[1] for q in P]
    return dict(lo=lo, rise=rise, run=run, w=w, ladder=ladder, fx=fx, fz=fz, box=(min(xs), max(xs), min(zs), max(zs)), desc=desc,
                hole=o.get('level') if desc else o.get('to'))
STAIRS = [o for o in OBJ if o['type'] == 'stairs']
def floor_pieces(o):
    rects = [(o['x'], o['x'] + o['w'], o['z'], o['z'] + o['d'])]
    for st in STAIRS:
        if stair_geom(st)['hole'] != o.get('level'): continue
        hx0, hx1, hz0, hz1 = stair_geom(st)['box']; out = []
        for (x0, x1, z0, z1) in rects:
            if hx1 <= x0 or hx0 >= x1 or hz1 <= z0 or hz0 >= z1: out.append((x0, x1, z0, z1)); continue
            if hz0 > z0: out.append((x0, x1, z0, hz0))
            if hz1 < z1: out.append((x0, x1, hz1, z1))
            a, b = max(z0, hz0), min(z1, hz1)
            if hx0 > x0: out.append((x0, hx0, a, b))
            if hx1 < x1: out.append((hx1, x1, a, b))
        rects = out
    return rects
rng = random.Random(23)

S = Scene()
M = lambda n: S.ext_res('Material', 'res://materials/%s.tres' % n)
K = Kit(S, {}, 'c1')
SHADER = S.ext_res('Shader', 'res://shaders/ps1_surface.gdshader')
I3 = ((1, 0, 0), (0, 1, 0), (0, 0, 1))

# ------------------------------------------------------------------ helpers: matrices
def rot_y(deg): return yaw(deg)
def euler_xyz(rx, ry, rz):      # three.js default order 'XYZ': R = Rx * Ry * Rz
    return mul(mul(rot_x(rx), rot_y(ry)), rot_z(rz))
def scale_rows(rows, s):
    sx, sy, sz = s if isinstance(s, (tuple, list)) else (s, s, s)
    return tuple((rows[i][0] * sx, rows[i][1] * sy, rows[i][2] * sz) for i in range(3))
def apply(rows, v): return tuple(sum(rows[i][k] * v[k] for k in range(3)) for i in range(3))

# ------------------------------------------------------------------ materials
_texm = {}
TEX_SIZES = {}
for _d in ('v11', 'v12'):
    _sp = os.path.join(ROOT, 'assets/textures', _d, 'sizes.json')
    if os.path.exists(_sp): TEX_SIZES.update(json.load(open(_sp)))
def tex_mat(tid, per_m=1.0, albedo=(1, 1, 1), emis=0.0, affine=0.3):
    """A world-UV PS1 material for a designer texture id (b:brick, u:xxxx) or a plain texture file name."""
    size = (1.0, 1.0)
    if tid.startswith('b:'):
        k = tid[2:]; file = next(('%s/%s.png' % (d, k) for d in ('md', 'v11', 'v12') if os.path.exists(os.path.join(ROOT, 'assets/textures', d, k + '.png'))), 'md/%s.png' % k)
        nm = 'md_' + k; size = TEX_SIZES.get(k, (1.0, 1.0))
    elif tid.startswith('u:'): file, nm = 'md/user_%s.png' % tid[2:], 'md_user_' + tid[2:]
    else: file, nm = tid, 'v9_' + os.path.splitext(os.path.basename(tid))[0]
    key = (nm, round(per_m, 3), albedo, emis, affine)
    if key not in _texm:
        name = '%s_%s' % (nm, str(round(per_m, 2)).replace('.', 'p')) + ('' if albedo == (1, 1, 1) else '_t%d' % len(_texm)) + ('_e' if emis else '') + ('_flat' if affine == 0.0 else '')
        K.mat(name, file, (1.0 / (per_m * size[0]), 1.0 / (per_m * size[1])), albedo, world=True, affine=affine, emis=emis)
        _texm[key] = name
    return _texm[key]
_colm = {}
NOISE = S.ext_res('Texture2D', 'res://assets/textures/md_noise.png')
def col_mat(hexc, emis=0.0):
    """Flat designer colour with a little grit (sub-resource; no file per colour)."""
    k = (hexc.lower(), emis)
    if k not in _colm:
        h = (hexc or '#888888').lstrip('#')
        if len(h) == 3: h = ''.join(ch * 2 for ch in h)
        if len(h) < 6: h = '888888'
        c = tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
        props = {'render_priority': '0', 'shader': SHADER, 'shader_parameter/albedo': C(*c), 'shader_parameter/albedo_tex': NOISE,
                 'shader_parameter/world_uv': 'true', 'shader_parameter/uv_scale': V2(2.5, 2.5), 'shader_parameter/affine_amount': '0.25',
                 'shader_parameter/emission_strength': f(float(emis))}
        _colm[k] = S.sub_res('ShaderMaterial', **props)
    return _colm[k]
def matref(m):
    """m: SubResource string, or a Kit material name."""
    if m.startswith('SubResource') or m.startswith('ExtResource'): return m
    return K._m(m) if m in K.M else M(m)
# a few textured materials of our own
for nm, tex, sc, alb in (('girly', 'adaline_wallpaper.png', (1, 1), (1, 1, 1)), ('lh_torn', 'lh_wall_torn.png', (1, 1), (0.85, 0.82, 0.8)),
                         ('plaster', 'md/plaster.png', (0.8, 0.8), (0.75, 0.74, 0.7)), ('roof_n', 'roof_shingle.png', (0.8, 0.8), (0.55, 0.5, 0.5)),
                         ('truck', 'truck_rust.png', (1.2, 1.2), (1, 1, 1)), ('truck_bed', 'truck_bed.png', (1, 1), (1, 1, 1)),
                         ('addie_rug', 'adaline_rug.png', (0.7, 0.7), (1, 1, 1)), ('lh_ceiling', 'md/plaster.png', (0.8, 0.8), (0.45, 0.42, 0.4))):
    K.mat('v9_' + nm, tex, sc, alb, world=True, affine=0.3)
for nm, tex in (('blood', 'blood_smear.png'), ('claws', 'claw_marks.png')):
    K.M['v9_' + nm] = 'res://materials/c1_v9_%s.tres' % nm
    from tscn import write_res
    write_res(os.path.join(ROOT, 'materials', 'c1_v9_%s.tres' % nm), 'StandardMaterial3D', [('Texture2D', 'res://assets/textures/' + tex)],
              {'transparency': '1', 'shading_mode': '1', 'albedo_texture': 'ExtResource("1")', 'texture_filter': '0', 'cull_mode': '2'})
for nm in ('refuge_sign_a', 'refuge_sign_b', 'refuge_sign_junction'): K.mat(nm, nm + '.png', world=False, affine=0.1)
K.mat('glow_city', albedo=(0.35, 0.12, 0.04), emis=0.3); K.mat('tail', albedo=(0.6, 0.04, 0.03), emis=0.7)
K.mat('post', 'wood.png', (1, 1), (0.42, 0.34, 0.26)); K.mat('bank', 'grass.png', (0.4, 0.4), (0.32, 0.34, 0.26))
K.mat('win_lit', albedo=(1.0, 0.82, 0.5), emis=1.2); K.mat('win_dark', albedo=(0.06, 0.07, 0.09))
for nm, col in (('siding_a', (0.62, 0.6, 0.55)), ('siding_b', (0.5, 0.55, 0.62)), ('siding_c', (0.66, 0.58, 0.46)), ('siding_d', (0.45, 0.5, 0.44)), ('siding_e', (0.6, 0.48, 0.44))):
    K.mat(nm, 'wood.png', (0.6, 1.6), col, affine=0.2)
GLASS = S.sub_res('StandardMaterial3D', transparency='1', albedo_color=C(0.1, 0.13, 0.18, 0.38), roughness='0.15', metallic_specular='0.8')

# ------------------------------------------------------------------ helpers: geometry
_n = [0]
_boxmesh, _boxshape = {}, {}
def uid(p):
    _n[0] += 1; return '%s%d' % (p, _n[0])
def boxmesh(size):
    k = tuple(round(v, 4) for v in size)
    if k not in _boxmesh: _boxmesh[k] = S.sub_res('BoxMesh', size=V3(*k))
    return _boxmesh[k]
def boxshape(size):
    k = tuple(round(v, 3) for v in size)
    if k not in _boxshape: _boxshape[k] = S.sub_res('BoxShape3D', size=V3(*k))
    return _boxshape[k]
def cam_blocker(parent, size):
    """A collider only the shoulder camera sees (layer 4): ceilings, so the camera can't rise through them,
    without ever catching Norah's head on a stairwell edge."""
    S.node('CamCol', 'StaticBody3D', parent, collision_layer='8', collision_mask='0')
    S.node('Shape', 'CollisionShape3D', parent + '/CamCol', shape=boxshape(size))
def mbox(parent, c, size, m, rows=I3, col=False, name=None, visible=True):
    """MeshInstance box (+ a static collider of the same size)."""
    nm = name or uid('B')
    props = dict(transform=T(c, rows), mesh=boxmesh(size), material_override=matref(m))
    if not visible: props['visible'] = 'false'
    p = S.node(nm, 'MeshInstance3D', parent, **props)
    if col:
        S.node('Col', 'StaticBody3D', p)
        S.node('Shape', 'CollisionShape3D', p + '/Col', shape=boxshape(size))
    return p
def collider(parent, c, size, rows=I3, name=None):
    nm = name or uid('C')
    S.node(nm, 'StaticBody3D', parent, transform=T(c, rows))
    S.node('Shape', 'CollisionShape3D', parent + '/' + nm, shape=boxshape(size))
def quad(parent, c, w, h, rows, m, name=None):
    q = S.sub_res('QuadMesh', size=V2(w, h))
    return S.node(name or uid('Q'), 'MeshInstance3D', parent, transform=T(c, rows), mesh=q, material_override=matref(m))
def cam(name, eye, target, fov, env='env_norah_yard', parent=None, far=160.0):
    S.node(name, 'Camera3D', parent or (W + '/Cams'), transform=T(eye, look_at_rows(eye, target)), fov=f(float(fov)), near='0.05', far=f(far),
           environment=S.ext_res('Environment', 'res://environments/%s.tres' % env))

# ------------------------------------------------------------------ the scene root
S.node('Chapter1', 'Node', parent=None, script=S.ext_res('Script', 'res://scripts/cutscenes/chapter1_director.gd'))
S.node('Screen', 'SubViewportContainer', anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', stretch='true', stretch_shrink='3', texture_filter='1')
S.node('World', 'SubViewport', 'Screen', handle_input_locally='false', audio_listener_enable_3d='true', size='Vector2i(320, 240)', render_target_update_mode='4')
W = 'Screen/World'
S.node('Map', 'Node3D', W)
MP = W + '/Map'
for g in ['Ground', 'Roads', 'Floors', 'Walls', 'Doors', 'Windows', 'Roofs', 'Props', 'Trees', 'Lights', 'Dressing', 'Neighbourhood']:
    S.node(g, 'Node3D', MP)
for g in ['Highway', 'Cams', 'Zones', 'Actors', 'Points']:
    S.node(g, 'Node3D', W)
S.node('Player', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/characters/player.tscn'), transform=T((1.6, 0, 15.6), yaw(-30)))
S.node('Visual', None, W + '/Player', model_id='"norah"', editor_description='"Norah (assets/characters/norah.glb)."')
S.node('KeyLight', None, W + '/Player', light_energy='0.35')

# ------------------------------------------------------------------ rooms (from the map's walls) used for face textures, ceilings, roofs, audio
NORAH_ROOMS = {'living': (-8.0, -2.0, -4.0, 2.0), 'kitchen': (-7.5, -2.5, 2.0, 6.5), 'hall': (-12.5, -8.0, 0.0, 2.0), 'bath': (-11.5, -9.0, -4.0, 0.0),
               'bedroom': (-16.5, -12.5, -3.0, 2.5), 'addie': (-12.5, -8.5, 2.0, 7.0)}
LOUIS_ROOMS = {'main': (24.0, 33.0, -12.0, -7.5), 'bath': (27.0, 29.5, -7.5, -3.5), 'stairs': (29.5, 33.0, -7.5, -3.5)}
UP_ROOMS = {'kitchen': (70.0, 74.5, -7.0, -2.0), 'bedroom': (66.5, 70.0, -7.0, -4.5)}
def in_rect(p, r, m=0.0): return r[0] - m <= p[0] <= r[1] + m and r[2] - m <= p[1] <= r[3] + m
def room_of(p):
    for group, rooms in (('norah', NORAH_ROOMS), ('louis', LOUIS_ROOMS), ('up', UP_ROOMS)):
        for k, r in rooms.items():
            if in_rect(p, r): return group, k
    return None, None

# ------------------------------------------------------------------ ground
G = MP + '/Ground'
_gm = tex_mat('b:grass', 2.0, (0.62, 0.66, 0.58), affine=0.0)
def _cut(rects, holes):
    for hx0, hx1, hz0, hz1 in holes:
        out = []
        for (x0, x1, z0, z1) in rects:
            if hx1 <= x0 or hx0 >= x1 or hz1 <= z0 or hz0 >= z1: out.append((x0, x1, z0, z1)); continue
            if hz0 > z0: out.append((x0, x1, z0, hz0))
            if hz1 < z1: out.append((x0, x1, hz1, z1))
            a_, b_ = max(z0, hz0), min(z1, hz1)
            if hx0 > x0: out.append((x0, hx0, a_, b_))
            if hx1 < x1: out.append((hx1, x1, a_, b_))
        rects = out
    return rects
# basements: the ground is cut open over them (their own ceiling / the floor above closes them)
BASEMENT_HOLES = [(o['x'], o['x'] + o['w'], o['z'], o['z'] + o['d']) for o in OBJ if o['type'] == 'floor' and EV(o) < -0.05]
for gx in range(-90, 130, 20):
    for gz in range(-80, 320, 20):
        for (x0, x1, z0, z1) in _cut([(gx, gx + 20, gz, gz + 20)], BASEMENT_HOLES):
            mbox(G, ((x0 + x1) / 2, -0.28, (z0 + z1) / 2), (x1 - x0, 0.5, z1 - z0), _gm)
collider(G, (20, -0.28, 40), (220, 0.5, 240), name='GroundCol')

# ------------------------------------------------------------------ roads: smooth strips following the drawn dirt and gravel
def catmull(pts, step=1.2, closed=False):
    P = ([pts[-1]] + list(pts) + [pts[0], pts[1]]) if closed else ([pts[0]] + list(pts) + [pts[-1]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        n = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    if not closed: out.append(pts[-1])
    else: out.append(out[0])
    return out
CDS_C, CDS_R = (10.5, 55.0), 7.0                 # Norah & Louis's cul-de-sac: the turnaround at the end of the county road
CDS = [(CDS_C[0] + CDS_R * math.cos(math.radians(a)), CDS_C[1] + CDS_R * math.sin(math.radians(a))) for a in range(0, 360, 30)]
LANE = [(1.2, 17.5), (1.0, 24.0), (0.5, 32.0), (0.2, 40.0), (1.2, 46.0), (4.2, 51.0)]                          # Norah's gravel lane
LDRIVE = [(27.6, 1.8), (24.2, 3.6), (22.2, 7.0), (21.0, 13.0), (20.0, 20.0), (19.2, 28.0), (18.6, 36.0), (18.4, 42.0), (17.6, 48.0), (16.2, 51.4)]   # Louis's dirt drive
MAIN = [(10.5, 61.0), (11.0, 78.0), (8.6, 104.0), (11.8, 132.0), (16.0, 160.0), (13.0, 190.0), (9.0, 218.0), (11.6, 248.0), (13.0, 275.0), (13.2, 305.0)]   # the county road out
WDRIVE = [(-32.6, 12.6), (-26.0, 20.0), (-16.0, 25.5), (-6.0, 28.0), (0.7, 30.5)]                                # the property past Norah's
ROADS = [(catmull(CDS, closed=True), 5.4, 'b:dirt'), (catmull(LANE), 3.0, 'b:gravel'), (catmull(LDRIVE), 3.6, 'b:dirt'), (catmull(MAIN), 5.2, 'b:dirt'),
         (catmull(WDRIVE), 2.8, 'b:dirt')]
_RIB = [0]
def strip(parent, pts, width, m, y=0.0):
    """v11: one continuous ribbon mesh (no overlapping pieces), written as an .obj so the surface is a single sheet.
    y = the height of its top. Every road, shoulder and drive gets its own height, centimetres apart, so nothing is coplanar."""
    pts = [p_ for k, p_ in enumerate(pts) if k == 0 or math.hypot(p_[0] - pts[k - 1][0], p_[1] - pts[k - 1][1]) > 0.05]
    if len(pts) < 2: return
    closed = math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1]) < 0.1
    if closed: pts = pts[:-1]
    n = len(pts); V = []
    for i in range(n):
        a_ = pts[(i - 1) % n] if (closed or i > 0) else pts[i]; b_ = pts[(i + 1) % n] if (closed or i < n - 1) else pts[i]
        tx, tz = b_[0] - a_[0], b_[1] - a_[1]; L = math.hypot(tx, tz) or 1.0
        nx, nz = -tz / L * width / 2, tx / L * width / 2
        V += [(pts[i][0] + nx, y, pts[i][1] + nz), (pts[i][0] - nx, y, pts[i][1] - nz)]
    F = []
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        a0, a1, b0, b1 = 2 * i + 1, 2 * i + 2, 2 * j + 1, 2 * j + 2
        F += [(a0, b0, a1), (a1, b0, b1), (a0, a1, b0), (a1, b1, b0)]     # both windings: one is culled, the up-facing one always draws
    _RIB[0] += 1
    nm = 'rib_%03d' % _RIB[0]
    os.makedirs(os.path.join(ROOT, 'assets/meshes/ch1_roads'), exist_ok=True)
    with open(os.path.join(ROOT, 'assets/meshes/ch1_roads', nm + '.obj'), 'w') as fo:
        for v in V: fo.write('v %.4f %.4f %.4f\n' % v)
        fo.write('vn 0 1 0\nvt 0 0\n')
        for f_ in F: fo.write('f %d/1/1 %d/1/1 %d/1/1\n' % f_)
    S.node(uid('Rib'), 'MeshInstance3D', parent, mesh=S.ext_res('Mesh', 'res://assets/meshes/ch1_roads/%s.obj' % nm), material_override=matref(m))
def _old_strip(parent, pts, width, m, y=0.0):
    for k, ((x0, z0), (x1, z1)) in enumerate(zip(pts, pts[1:])):
        dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz)
        if L < 0.01: continue
        a = math.degrees(math.atan2(dx, dz))
        mbox(parent, ((x0 + x1) / 2, y - 0.012 + (k % 2) * 0.004, (z0 + z1) / 2), (width, 0.024, L + width * 0.35), m, rot_y(a))
import shutil as _sh
# (ribbons are overwritten in place, keeping their .import files)
# heights (ground top is -0.03): shoulders -0.022..-0.010, neighbours' drives 0.006, roads 0.018..0.046, drawn yard surfaces 0.06+
for k, (pts, w_, tex) in enumerate(ROADS):
    strip(MP + '/Roads', pts, w_, tex_mat(tex, 1.5, (0.8, 0.78, 0.74), affine=0.0), y=0.026 - k * 0.004)
    strip(MP + '/Roads', pts, w_ + 1.4, tex_mat('b:dirt', 2.0, (0.42, 0.4, 0.36), affine=0.0), y=-0.01 - k * 0.003)      # soft muddy shoulders
def road_dist(x, z):
    best = 1e9
    for pts, w_, _ in ROADS:
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            dx, dz = x1 - x0, z1 - z0; L2 = dx * dx + dz * dz or 1e-9
            t = max(0.0, min(1.0, ((x - x0) * dx + (z - z0) * dz) / L2))
            best = min(best, math.hypot(x - (x0 + t * dx), z - (z0 + t * dz)) - w_ / 2)
    return best

_FL = [0]
FLOOR_TEX = {('norah', 'living'): ('v11/oak_planks.png', 1.2, (1, 1, 1)), ('norah', 'hall'): ('v11/oak_planks.png', 1.2, (0.95, 0.95, 0.95)),
             ('norah', 'bedroom'): ('v11/carpet_blue.png', 1.0, (1, 1, 1)), ('norah', 'addie'): ('v11/carpet_green.png', 1.0, (1.1, 1.1, 1.1)),
             ('norah', 'bath'): ('v11/tile_hex.png', 0.6, (1, 1, 1)),
             ('louis', 'main'): ('v11/walnut_planks.png', 1.2, (0.9, 0.85, 0.8)), ('louis', 'bath'): ('v11/tile_hex_dirty.png', 0.6, (0.9, 0.9, 0.9)),
             ('louis', 'stairs'): ('v11/walnut_planks.png', 1.2, (0.85, 0.8, 0.75)),
             ('up', 'kitchen'): ('v11/checker_red.png', 1.2, (0.75, 0.72, 0.7)), ('up', 'bedroom'): ('v11/pine_planks.png', 1.2, (0.7, 0.66, 0.62))}
# ------------------------------------------------------------------ floors (interiors, porch, stepping stones; drawn road rectangles become the strips above)
for o in OBJ:
    if o['type'] != 'floor' or o.get('ground') or o['tex'] in ('b:grass',): continue
    if o['tex'] == 'b:dirt' and o['z'] > 5: continue
    if o['tex'] == 'b:gravel' and o['z'] > 17.5: continue
    if o['tex'] == 'b:asphalt': continue
    cx, cz = o['x'] + o['w'] / 2, o['z'] + o['d'] / 2
    grp, room = room_of((cx, cz))
    tex = o['tex']
    m = tex_mat(tex, o.get('scale', 1) or 1, affine=0.0)
    if grp == 'norah' and room == 'bath': m = tex_mat('b:tile', 0.5, (0.9, 0.92, 0.95), affine=0.0)      # the designer's siding stripes read as linoleum
    if grp == 'louis' and room == 'bath': m = tex_mat('b:tile', 0.5, (0.6, 0.58, 0.55), affine=0.0)
    if grp == 'louis' or grp == 'up': m = tex_mat(tex, o.get('scale', 1) or 1, (0.6, 0.55, 0.52), affine=0.0)
    if (grp, room) in FLOOR_TEX:                     # v11: every room its own floor
        ft, fs, fa = FLOOR_TEX[(grp, room)]
        m = tex_mat(ft, fs, fa, affine=0.0)
    _FL[0] += 1
    h = 0.03
    if grp is None and not (o.get('y') or 0):      # yard surfaces (the parking gravel, porch slabs, stepping stones): clearly above the roads
        top = 0.036 + (_FL[0] % 4) * 0.006
        mbox(MP + '/Floors', (cx, top - 0.05, cz), (o['w'], 0.1, o['d']), m); continue
    for (x0, x1, z0, z1) in floor_pieces(o):          # stairwells from the floor below are cut out
        mbox(MP + '/Floors', ((x0 + x1) / 2, EV(o) + 0.0 - h / 2 + 0.004 + (_FL[0] % 6) * 0.0025 + (o.get('y') or 0), (z0 + z1) / 2), (x1 - x0, h, z1 - z0), m,
             col=EV(o) != 0.0)

# ------------------------------------------------------------------ stairs and ladders between levels (from the designer)
S.node('LevelStairs', 'Node3D', MP)
for k, st in enumerate(STAIRS):
    G = stair_geom(st); nm = 'Stairs%d' % k; g = MP + '/LevelStairs/' + nm
    if G['desc']:      # going down: built as stairs climbing from their foot, turned around
        S.node(nm, 'Node3D', MP + '/LevelStairs', transform=T((st['x'] + G['fx'] * G['run'], G['lo'], st['z'] + G['fz'] * G['run']), rot_y((st.get('rot', 0) or 0) + 180)))
    else:
        S.node(nm, 'Node3D', MP + '/LevelStairs', transform=T((st['x'], G['lo'], st['z']), rot_y(st.get('rot', 0) or 0)))
    wood = tex_mat(st['tex'], 1.0) if st.get('tex') else tex_mat('v11/oak_planks.png', 1.0, (0.85, 0.8, 0.75))
    if G['ladder']:
        for sx in (-1, 1): mbox(g, (sx * G['w'] / 2, (G['rise'] + 0.9) / 2, -G['run'] / 2), (0.06, G['rise'] + 0.9, 0.06), wood)
        for r in range(1, int(G['rise'] / 0.3)): mbox(g, (0, r * 0.3, -G['run'] / 2), (G['w'], 0.04, 0.04), wood)
    else:
        n = max(3, round(G['rise'] / 0.18)); sd, sh = G['run'] / n, G['rise'] / n
        for i in range(n): mbox(g, (0, sh * (i + 1) / 2, -(i + 0.5) * sd), (G['w'], sh * (i + 1), sd), wood)
    # the walkable slope (steps are visual; the player climbs a smooth ramp like Louis's stairs)
    ang = math.degrees(math.atan2(G['rise'], G['run'] if not G['ladder'] else 0.6))
    S.node('Ramp', 'StaticBody3D', g, transform=T((0, G['rise'] / 2, -G['run'] / 2), rot_x(ang)))
    S.node('Shape', 'CollisionShape3D', g + '/Ramp', shape=boxshape((G['w'], 0.12, math.hypot(G['rise'], G['run']) + 0.3)))
# ------------------------------------------------------------------ walls: two half-thickness faces per piece, doors and windows cut out
WALLS = [o for o in OBJ if o['type'] == 'wall']
def wall_face_mat(o, side, mid, nrm):
    tid = o['texA'] if side == 'A' else o['texB']
    p = (mid[0] + nrm[0] * 0.35, mid[1] + nrm[1] * 0.35)
    grp, room = room_of(p)
    per = o.get('scale', 1) or 1
    if grp == 'norah' and room == 'addie': return 'v9_girly'
    if grp in ('louis', 'up') and not tid.startswith('u:'): return 'v9_lh_torn'
    if grp == 'up' and tid.startswith('u:'): return tex_mat(tid, per, (0.7, 0.66, 0.62))
    if grp in ('louis',): return tex_mat(tid, per, (0.8, 0.76, 0.72))
    return tex_mat(tid, per)
DOORS = []         # (name, wall, opening, hinge point, along dir, normal toward swing, height)
WINDOWS = []
for wi, o in enumerate(WALLS):
    ax, az = o['a']; bx, bz = o['b']
    L = math.hypot(bx - ax, bz - az)
    if L < 0.02: continue
    ux, uz = (bx - ax) / L, (bz - az) / L
    nB = (-uz, ux); nA = (uz, -ux)
    ang = math.degrees(math.atan2(bz - az, bx - ax))
    rows = rot_y(-ang)
    H = o.get('height', 2.4); t = o.get('thick', 0.15)
    pieces = []; s = 0.0
    for op in sorted(o.get('openings', []), key=lambda q: q['at']):
        s0, s1 = op['at'] - op['width'] / 2, op['at'] + op['width'] / 2
        if s0 > s: pieces.append((s, s0, 0.0, H))
        if op.get('sill', 0) > 0: pieces.append((s0, s1, 0.0, op['sill']))
        if op.get('top', 2.05) < H: pieces.append((s0, s1, op.get('top', 2.05), H))
        if op['kind'] == 'window': WINDOWS.append((wi, o, op))
        elif op['kind'] == 'door': DOORS.append((wi, o, op))
        s = s1
    if s < L: pieces.append((s, L, 0.0, H))
    mid = ((ax + bx) / 2, (az + bz) / 2)
    mA, mB = wall_face_mat(o, 'A', mid, nA), wall_face_mat(o, 'B', mid, nB)
    for k, (s0, s1, h0, h1) in enumerate(pieces):
        ln, hh = s1 - s0, h1 - h0
        if ln < 0.005 or hh < 0.005: continue
        c = (ax + ux * (s0 + s1) / 2, EV(o) + (h0 + h1) / 2, az + uz * (s0 + s1) / 2)
        g = '%s/W%d_%d' % (MP + '/Walls', wi, k)
        S.node('W%d_%d' % (wi, k), 'Node3D', MP + '/Walls', transform=T(c, rows))
        mbox(g, (0, 0, t / 4), (ln, hh, t / 2), mB, name='FaceB')
        mbox(g, (0, 0, -t / 4), (ln, hh, t / 2), mA, name='FaceA')
        S.node('Col', 'StaticBody3D', g); S.node('Shape', 'CollisionShape3D', g + '/Col', shape=boxshape((ln, hh, t)))

# doors: leaves shown open the way they swing; the front door is a named, closable leaf
FRONT_DOOR_WALL = None
def door_leaf(wi, o, op):
    ax, az = o['a']; bx, bz = o['b']; L = math.hypot(bx - ax, bz - az); ux, uz = (bx - ax) / L, (bz - az) / L
    s0, s1 = op['at'] - op['width'] / 2, op['at'] + op['width'] / 2
    hend = op.get('hinge', 'start') == 'end'
    hp = (ax + ux * (s1 if hend else s0), az + uz * (s1 if hend else s0))
    d = (-ux, -uz) if hend else (ux, uz)
    sd = 1 if op.get('side', 'in') == 'out' else -1
    n = (-uz * sd, ux * sd)
    return hp, d, n
for wi, o, op in DOORS:
    hp, d, n = door_leaf(wi, o, op)
    width, top = op['width'], op.get('top', 2.05)
    centre = (o['a'][0] + (o['b'][0] - o['a'][0]) * op['at'] / math.hypot(o['b'][0] - o['a'][0], o['b'][1] - o['a'][1]),
              o['a'][1] + (o['b'][1] - o['a'][1]) * op['at'] / math.hypot(o['b'][0] - o['a'][0], o['b'][1] - o['a'][1]))
    is_front = abs(centre[0] + 2.0) < 0.1 and abs(centre[1] + 1.0) < 0.1
    is_louis = abs(centre[0] - 25.5) < 0.1 and abs(centre[1] + 7.5) < 0.1
    style = op.get('style', 'hinged')
    k = math.radians(80.0)
    vx, vz = d[0] * math.cos(k) + n[0] * math.sin(k), d[1] * math.cos(k) + n[1] * math.sin(k)
    m = tex_mat('b:wood_dark', 1.0, (0.85, 0.7, 0.6))
    if is_front:
        # a pivot at the hinge; the director swings it shut / open. Leaf runs along +X of the pivot.
        a0 = math.degrees(math.atan2(d[1], d[0]))
        S.node('FrontDoor', 'Node3D', MP + '/Doors', transform=T((hp[0], 0, hp[1]), rot_y(-a0)))
        S.node('Leaf', 'MeshInstance3D', MP + '/Doors/FrontDoor', transform=T((width / 2, top / 2, 0)), mesh=boxmesh((width - 0.02, top - 0.02, 0.05)),
               material_override=matref(tex_mat('b:wood_dark', 1.0, (0.7, 0.32, 0.26))))
        S.node('Col', 'StaticBody3D', MP + '/Doors/FrontDoor/Leaf'); S.node('Shape', 'CollisionShape3D', MP + '/Doors/FrontDoor/Leaf/Col', shape=boxshape((width, top, 0.06)))
        mbox(MP + '/Doors/FrontDoor', (width - 0.12, 1.0, n[0] * 0 + 0.04), (0.04, 0.04, 0.05), 'nh_metal', name='Knob')
        FRONT_DOOR_WALL = (hp, d, n, width)
        continue
    if is_louis or style == 'broken':
        # torn off: one half hanging from the top hinge, the other flat on the porch boards
        cx, cz = hp[0] + d[0] * width * 0.25, hp[1] + d[1] * width * 0.25
        a0 = math.degrees(math.atan2(d[1], d[0]))
        mbox(MP + '/Doors', (cx + n[0] * 0.15, top * 0.62, cz + n[1] * 0.15), (width * 0.48, top * 0.7, 0.05), m, mul(rot_y(-a0), rot_z(-16)), name='LouisDoorHalf')
        mbox(MP + '/Doors', (cx + n[0] * 1.2 + d[0] * 0.4, 0.04, cz + n[1] * 1.2 + d[1] * 0.4), (width * 0.5, 0.05, top * 0.62), m, rot_y(-a0 + 12), name='LouisDoorFloor')
        for k2 in range(6):
            mbox(MP + '/Doors', (cx + n[0] * rng.uniform(0.4, 1.8), 0.02, cz + n[1] * rng.uniform(0.4, 1.8) + rng.uniform(-0.4, 0.4)), (rng.uniform(0.08, 0.3), 0.02, 0.04), 'lh_splinter', rot_y(rng.uniform(0, 180)))
        continue
    a0 = math.degrees(math.atan2(d[1], d[0]))
    nm_ = 'Door%d' % wi
    S.node(nm_, 'Node3D', MP + '/Doors', transform=T((hp[0], 0, hp[1]), rot_y(-a0)), script=S.ext_res('Script', 'res://scripts/interactions/door.gd'))
    g_ = MP + '/Doors/' + nm_
    S.node('Leaf', 'MeshInstance3D', g_, transform=T((width / 2, top / 2, 0)), mesh=boxmesh((width - 0.02, top - 0.02, 0.045)), material_override=matref(m))
    S.node('Col', 'StaticBody3D', g_ + '/Leaf'); S.node('Shape', 'CollisionShape3D', g_ + '/Leaf/Col', shape=boxshape((width - 0.04, top - 0.04, 0.05)))
    mbox(g_, (width - 0.1, 1.0, 0.0), (0.05, 0.05, 0.09), 'nh_metal', name='Knob')
    S.node('Point', 'Marker3D', g_, transform=T((width / 2, 1.0, 0)), script=S.ext_res('Script', 'res://scripts/interactions/interactable.gd'),
           prompt='"Open the door"', radius='1.25', enabled='true', glow='true')
# windows: glass + a frame; Norah's bedroom window is named (Louis comes through it)
for wi, o, op in WINDOWS:
    ax, az = o['a']; bx, bz = o['b']; L = math.hypot(bx - ax, bz - az); ux, uz = (bx - ax) / L, (bz - az) / L
    ang = math.degrees(math.atan2(bz - az, bx - ax)); rows = rot_y(-ang)
    c = (ax + ux * op['at'], (op['sill'] + op['top']) / 2, az + uz * op['at'])
    w_, h_ = op['width'], op['top'] - op['sill']
    bedroom = abs(c[0] + 16.5) < 0.1 and abs(c[2] + 1.54) < 0.1
    upbed = abs(c[0] - 68.75) < 0.1 and abs(c[2] + 4.5) < 0.1
    nm = 'BedroomWindow' if bedroom else ('UpWindow' if upbed else uid('Win'))
    S.node(nm, 'Node3D', MP + '/Windows', transform=T(c, rows))
    g = MP + '/Windows/' + nm
    if not upbed:
        S.node('Glass', 'MeshInstance3D', g, mesh=boxmesh((w_, h_, 0.02)), material_override=GLASS)
    else:
        S.node('Glass', 'MeshInstance3D', g, transform=T((0, h_ * 0.25, 0)), mesh=boxmesh((w_, h_ * 0.5, 0.02)), material_override=GLASS)   # sash thrown up
    fm = 'nh_trim'
    for (px, pz, sx, sz) in ((0, h_ / 2, w_ + 0.1, 0.06), (0, -h_ / 2, w_ + 0.16, 0.08), (-w_ / 2, 0, 0.06, h_), (w_ / 2, 0, 0.06, h_), (0, 0, 0.035, h_), (0, 0.0, w_, 0.035)):
        mbox(g, (px, pz, 0), (sx, sz, o.get('thick', 0.15) + 0.03), fm)
    if bedroom:
        S.node('Col', 'StaticBody3D', g); S.node('Shape', 'CollisionShape3D', g + '/Col', shape=boxshape((w_, h_, 0.15)))
    if upbed:     # curtains blowing in, rain on the sill
        S.node('Anim', 'Node3D', g)
        for sx_, nm2 in ((-1, 'CurtainL'), (1, 'CurtainR')):
            S.node(nm2, 'Node3D', g + '/Anim', transform=T((sx_ * w_ * 0.32, h_ / 2 + 0.05, -0.12)))
            mbox(g + '/Anim/' + nm2, (0, -h_ * 0.5, 0), (w_ * 0.32, h_ * 1.0, 0.03), 'lh_curtain')
        mbox(g, (0, -h_ / 2 - 0.02, -0.22), (w_, 0.01, 0.3), 'lh_wet')

# ------------------------------------------------------------------ ceilings and roofs (every house gets one)
STAIR_HOLE = (31.85, 33.0, -8.3, -5.3)
def ceiling(x0, x1, z0, z1, m, y=2.4):
    hx0, hx1, hz0, hz1 = STAIR_HOLE
    if hx1 <= x0 or hx0 >= x1 or hz1 <= z0 or hz0 >= z1:
        rects = [(x0, x1, z0, z1)]
    else:      # cut the stairwell out of the ceiling
        ix0, ix1, iz0, iz1 = max(x0, hx0), min(x1, hx1), max(z0, hz0), min(z1, hz1)
        rects = [(x0, ix0, z0, z1), (ix1, x1, z0, z1), (ix0, ix1, z0, iz0), (ix0, ix1, iz1, z1)]
    for a, b, c, d in rects:
        if b - a > 0.01 and d - c > 0.01:
            cam_blocker(mbox(MP + '/Roofs', ((a + b) / 2, y + 0.025, (c + d) / 2), (b - a, 0.05, d - c), m), (b - a, 0.05, d - c))      # the shoulder camera can't rise through it
def roof(parent, x0, x1, z0, z1, y, m, gable_m, pitch=32.0, oh=0.35, along=None):
    w, d = x1 - x0, z1 - z0
    along = along or ('x' if w >= d else 'z')
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    a = math.radians(pitch)
    span = (d if along == 'x' else w)
    hs = span / 2 + oh; yr = y + (span / 2) * math.tan(a); sl = hs / math.cos(a); dd = hs / 2
    yc = yr - dd * math.tan(a) + 0.05
    if along == 'x':
        for sd in (-1, 1):
            mbox(parent, (cx, yc, cz + sd * dd), (w + 2 * oh, 0.1, sl), m, rot_x(pitch if sd > 0 else -pitch))
        for gx in (x0, x1):
            S.node(uid('Gable'), 'CSGPolygon3D', parent, transform=T((gx - 0.05, y, cz), rot_y(90)),
                   polygon='PackedVector2Array(%s)' % ', '.join('%s, %s' % (f(px), f(py)) for px, py in ((-span / 2, 0.0), (span / 2, 0.0), (0.0, yr - y))),
                   depth='0.1', material=matref(gable_m))
    else:
        for sd in (-1, 1):
            mbox(parent, (cx + sd * dd, yc, cz), (sl, 0.1, d + 2 * oh), m, rot_z(-pitch if sd > 0 else pitch))
        for gz in (z0, z1):
            S.node(uid('Gable'), 'CSGPolygon3D', parent, transform=T((cx, y, gz - 0.05)),
                   polygon='PackedVector2Array(%s)' % ', '.join('%s, %s' % (f(px), f(py)) for px, py in ((-span / 2, 0.0), (span / 2, 0.0), (0.0, yr - y))),
                   depth='0.1', material=matref(gable_m))
    mbox(parent, (cx, yr + 0.08, cz), ((w + 2 * oh) if along == 'x' else 0.16, 0.08, 0.16 if along == 'x' else (d + 2 * oh)), 'nh_roof')
R = MP + '/Roofs'
CEIL_N = tex_mat('b:plaster', 1.2, (0.82, 0.8, 0.76), affine=0.0)
for x0, x1, z0, z1 in ((-16.5, -2.0, -4.0, 2.5), (-12.5, -2.5, 2.0, 7.0)):
    ceiling(x0, x1, z0, z1, CEIL_N)
roof(R, -16.6, -1.9, -4.1, 2.5, 2.4, 'v9_roof_n', tex_mat('b:brick'))
roof(R, -12.6, -2.4, 2.4, 7.1, 2.4, 'v9_roof_n', tex_mat('b:brick'))
mbox(R, (-1.0, 2.35, -1.1), (2.2, 0.08, 3.4), 'nh_roof', rot_z(-8))       # porch roof over the user's concrete porch
for pz in (-2.55, 0.35): mbox(R, (0.05, 1.18, pz), (0.09, 2.36, 0.09), 'nh_trim', col=True)
# Louis's house: two storeys (the upstairs interior is the separate block at x 66..75; this is its outside)
LH_WALL = tex_mat('b:wood_dark', 1.0, (0.85, 0.85, 0.9))
ceiling(24.0, 33.0, -12.0, -7.5, 'v9_lh_ceiling'); ceiling(27.0, 33.0, -7.5, -3.5, 'v9_lh_ceiling')
mbox(R, (28.5, 3.6, -9.75), (9.1, 2.4, 4.6), LH_WALL); mbox(R, (30.0, 3.6, -5.5), (6.1, 2.4, 4.1), LH_WALL)
mbox(R, (28.5, 2.42, -9.75), (9.4, 0.1, 4.9), 'nh_trim'); mbox(R, (30.0, 2.42, -5.5), (6.4, 0.1, 4.4), 'nh_trim')
for (x, z, face) in ((25.6, -7.43, '+z'), (31.6, -3.43, '+z'), (25.0, -12.07, '-z'), (31.0, -12.07, '-z'), (33.07, -10.0, '+x'), (23.93, -9.5, '-x')):
    rows_ = {'+z': I3, '-z': rot_y(180), '+x': rot_y(90), '-x': rot_y(-90)}[face]
    quad(R, (x, 3.7, z), 0.9, 1.1, rows_, 'c1_win_dark')
roof(R, 23.9, 33.1, -12.1, -7.4, 4.8, 'lh_roof', LH_WALL)
roof(R, 26.9, 33.1, -7.6, -3.4, 4.8, 'lh_roof', LH_WALL, along='z')
# the stairwell: darkness above the hole; a ramp under the visible steps (bottom z -4.6, top z -7.8 at 2.4 m)
mbox(R, (32.42, 2.95, -6.8), (1.1, 1.0, 3.0), 'black', name='StairShaft')
_ra = math.degrees(math.atan2(2.4, 3.2)); _rl = math.hypot(2.4, 3.2)
S.node('StairRamp', 'StaticBody3D', R, transform=T((32.42, 1.2 - 0.06, -6.2), rot_x(_ra)))
S.node('Shape', 'CollisionShape3D', R + '/StairRamp', shape=boxshape((0.9, 0.12, _rl + 0.2)))
collider(R, (31.94, 1.2, -6.2), (0.06, 2.4, 3.2), name='StairSide')                 # the open side of the flight: no stepping off mid-air
# Louis's upstairs block (interior only, reached by the stairs): ceilings and a roof anyway
ceiling(70.0, 74.5, -7.0, -2.0, 'v9_lh_ceiling'); ceiling(66.5, 70.0, -7.0, -4.5, 'v9_lh_ceiling')
roof(R, 69.9, 74.6, -7.1, -1.9, 2.4, 'lh_roof', LH_WALL, along='z')
mbox(R, (73.9, 0.006, -2.6), (0.9, 0.01, 1.1), 'black', name='StairwellHole')
for k in range(4): mbox(R, (73.9, -0.05 - k * 0.2, -2.3 + k * 0.0), (0.88, 0.02, 0.27), 'lh_wood')
mbox(R, (73.42, 0.95, -2.6), (0.05, 0.05, 1.15), 'lh_wood', name='StairRail'); mbox(R, (73.42, 0.48, -3.15), (0.05, 0.95, 0.05), 'lh_wood')
mbox(R, (73.42, 0.48, -2.05), (0.05, 0.95, 0.05), 'lh_wood'); roof(R, 66.4, 70.1, -7.1, -4.4, 2.4, 'lh_roof', LH_WALL)

# ------------------------------------------------------------------ props: the designer's parts
SPECIAL = {}
def nearest(asset, x, z):
    best, bd = None, 1e9
    for o in OBJ:
        if o['type'] == 'prop' and o['asset'] == asset:
            d_ = math.hypot(o['x'] - x, o['z'] - z)
            if d_ < bd: best, bd = o, d_
    return best
NAMES = [('bookshelf', -2.3, 0.02, 'Bookshelf'), ('wardrobe', -16.08, -0.13, 'BedWardrobe'), ('bed_double', -14.6, -1.84, 'NorahBed'),
         ('dresser', -14.57, 2.31, 'NorahDresser'), ('bed_twin', -11.86, 5.79, 'AddieBed'), ('wardrobe', -11.85, 2.99, 'AddieWardrobe'),
         ('dresser', -10.71, 6.64, 'AddieDresser'), ('tvstand', -7.34, -3.39, 'TV'), ('counter', -3.94, 5.97, 'CounterFlash'), ('counter', -5.75, 5.98, 'CounterBatt'),
         ('fridge', -3.0, 6.0, 'Fridge'), ('table', -4.5, 3.5, 'KitchenTable'), ('couch', -6.13, -0.49, 'Couch'), ('desk', 32.58, -10.03, 'LDesk'),
         ('wardrobe', 24.78, -11.48, 'LWardrobe'), ('toilet', 29.19, -5.05, 'LToilet'), ('stairs', 32.42, -6.2, 'LStairs'), ('fridge', 71.66, -6.64, 'UFridge'),
         ('asset_d4j4ey', 74.16, -6.57, 'USafe'), ('bed_twin', 67.13, -5.58, 'UBed'), ('tvstand', 68.49, -6.76, 'UTV'), ('car', 1.03, 16.72, '__car'), ('car', 28.95, 2.0, '__truck')]
for a_, x_, z_, nm_ in NAMES:
    o_ = nearest(a_, x_, z_)
    if o_: SPECIAL[id(o_)] = nm_
NO_COL = {'stairs', 'rug', 'lamp', 'porch', 'bush', 'tree', 'tree_bare', 'woodpile', 'pole', 'streetlight', 'mailbox', 'sign', 'cross_grave', 'gravestone'}
def part_node(parent, p, sc=1.0, tex_override=None, name=None):
    s = p['s']; w_, h_, d_ = (v for v in p['d'])
    rows = euler_xyz(*p.get('r', [0, 0, 0]))
    c = tuple(v * sc for v in p['p'])
    tid = tex_override or p.get('t') or ''
    if p.get('t2') and not tid: tid = p['t2']
    m = tex_mat(tid, 0.7) if tid else col_mat(p['c'])
    nm = name or uid('P')
    if s == 'box':
        return S.node(nm, 'MeshInstance3D', parent, transform=T(c, rows), mesh=boxmesh((w_ * sc, h_ * sc, d_ * sc)), material_override=matref(m))
    if s in ('cyl', 'cone'):
        mesh = S.sub_res('CylinderMesh', top_radius=f(0.0 if s == 'cone' else w_ / 2 * sc), bottom_radius=f(w_ / 2 * sc), height=f(h_ * sc), radial_segments=str(int(p.get('seg', 8))), rings='1')
        rows2 = scale_rows(rows, (1, 1, d_ / w_ if w_ else 1))
        return S.node(nm, 'MeshInstance3D', parent, transform=T(c, rows2), mesh=mesh, material_override=matref(m))
    if s == 'sphere':
        sg = int(p.get('seg', 8)); mesh = S.sub_res('SphereMesh', radius='0.5', height='1.0', radial_segments=str(sg), rings=str(max(4, round(sg * 0.66))))
        return S.node(nm, 'MeshInstance3D', parent, transform=T(c, scale_rows(rows, (w_ * sc, h_ * sc, d_ * sc))), mesh=mesh, material_override=matref(m))
    if s == 'wedge':
        mesh = S.sub_res('PrismMesh', left_to_right='1.0', size=V3(d_ * sc, h_ * sc, w_ * sc))
        return S.node(nm, 'MeshInstance3D', parent, transform=T(c, mul(rows, rot_y(-90))), mesh=mesh, material_override=matref(m))
def footprint(asset):
    a = ASSETS.get(asset)
    if not a: return (-0.3, 0.3, 0.0, 0.6, -0.3, 0.3)
    xs, ys, zs = [], [], []
    for p in a['parts']:
        hw, hh, hd = p['d'][0] / 2, p['d'][1] / 2, p['d'][2] / 2
        xs += [p['p'][0] - hw, p['p'][0] + hw]; ys += [p['p'][1] - hh, p['p'][1] + hh]; zs += [p['p'][2] - hd, p['p'][2] + hd]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))
PROP_POS = {}
def place_prop(o, parent, name):
    a = ASSETS.get(o['asset'])
    if not a: return
    sc = o.get('scale', 1) or 1
    rows = scale_rows(rot_y(o.get('rot', 0)), sc)
    S.node(name, 'Node3D', parent, transform=T((o['x'], EV(o) + (o.get('y', 0) or 0), o['z']), rows))
    g = parent + '/' + name
    grp, room = room_of((o['x'], o['z']))
    for i, p in enumerate(a['parts']):
        nm = None
        if o['asset'] == 'tvstand' and i == 2: nm = 'Screen'
        part_node(g, p, 1.0, None, nm)
    if o['asset'] in ('tree', 'tree_bare'):
        S.node('Col', 'StaticBody3D', g, transform=T((0, 1.0, 0)))
        S.node('Shape', 'CollisionShape3D', g + '/Col', shape=boxshape((0.34, 2.0, 0.34)))
    elif o['asset'] not in NO_COL and o.get('solid', True) is not False:
        x0, x1, y0, y1, z0, z1 = footprint(o['asset'])
        S.node('Col', 'StaticBody3D', g, transform=T(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)))
        S.node('Shape', 'CollisionShape3D', g + '/Col', shape=boxshape((x1 - x0, max(0.3, y1 - y0), z1 - z0)))
    PROP_POS[name] = (o['x'], o['z'], o.get('rot', 0))
def keep_tree(o):
    if road_dist(o['x'], o['z']) < 2.2: return False
    for rooms in (NORAH_ROOMS, LOUIS_ROOMS, UP_ROOMS):
        for r in rooms.values():
            if in_rect((o['x'], o['z']), r, 1.4): return False
    if in_rect((o['x'], o['z']), (23.5, 33.5, -3.4, 8.0)): return False      # the truck's yard
    return True
for o in OBJ:
    if o['type'] != 'prop': continue
    nm = SPECIAL.get(id(o))
    if nm in ('__car', '__truck'): continue
    if o['asset'] in ('tree', 'tree_bare', 'bush', 'rock'):
        if keep_tree(o): place_prop(o, MP + '/Trees', uid('T'))
        continue
    place_prop(o, MP + '/Props', nm or uid(o['asset'].capitalize()[:8]))

# ------------------------------------------------------------------ ground fog outside: thick at the ankles, wisps by the hips (scripts/environments/ground_fog.gd)
# a top-down mask (2 px per metre over the ground) keeps it out of the houses Norah walks through
def _fog_mask():
    from PIL import Image, ImageDraw, ImageFilter
    X0, Z0, Wm, Dm, PPM = -90.0, -80.0, 220.0, 400.0, 2
    im = Image.new('L', (int(Wm * PPM), int(Dm * PPM)), 255); d = ImageDraw.Draw(im)
    for rooms in (NORAH_ROOMS, LOUIS_ROOMS, UP_ROOMS):
        for (x0, x1, z0, z1) in rooms.values():
            m = 0.45
            d.rectangle([(x0 - m - X0) * PPM, (z0 - m - Z0) * PPM, (x1 + m - X0) * PPM, (z1 + m - Z0) * PPM], fill=0)
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    im.save(os.path.join(ROOT, 'assets/textures/ch1_fog_mask.png'))
    return (X0, Z0, Wm, Dm)
_fr = _fog_mask()
S.node('GroundFog', 'Node3D', MP, script=S.ext_res('Script', 'res://scripts/environments/ground_fog.gd'),
       mask=S.ext_res('Texture2D', 'res://assets/textures/ch1_fog_mask.png'), mask_rect='Vector4(%s, %s, %s, %s)' % _fr,
       vehicles='Array[NodePath]([NodePath("../../DriveCar"), NodePath("../../Truck")])',
       editor_description='"Ground fog outside (Chapter One). Density, heights: the GroundFog script. The mask keeps it out of the houses."')

# ------------------------------------------------------------------ Map Designer extras: stages, ceilings, roofs, lamps that glow, searchable things
# (none of these are in Chapter One's map yet; the chapel and later maps use them)
S.node('Stages', 'Node3D', MP); S.node('Ceilings', 'Node3D', MP); S.node('Searchables', 'Node3D', MP)
STEP_TREAD = 0.35
for o in OBJ:
    if o['type'] != 'platform': continue
    h = max(0.02, float(o.get('h', 0.6))); y0 = EV(o)
    top = tex_mat(o.get('tex') or 'b:walnut_planks', 1.0, affine=0.0); side = tex_mat(o.get('texSide') or o.get('tex') or 'b:painted_white_wood', 1.0)
    nm = uid('Stage'); g = MP + '/Stages/' + nm; S.node(nm, 'Node3D', MP + '/Stages', editor_description='"A stage / platform from the Map Designer. The open edges are a ledge: dropping off stuns Norah briefly (player.gd, stun_drop)."')
    mbox(g, (o['x'] + o['w'] / 2, y0 + h - 0.02, o['z'] + o['d'] / 2), (o['w'], 0.04, o['d']), top)
    mbox(g, (o['x'] + o['w'] / 2, y0 + (h - 0.04) / 2, o['z'] + o['d'] / 2), (o['w'] - 0.002, h - 0.04, o['d'] - 0.002), side)
    S.node('Col', 'StaticBody3D', g, transform=T((o['x'] + o['w'] / 2, y0 + h / 2, o['z'] + o['d'] / 2)))
    S.node('Shape', 'CollisionShape3D', g + '/Col', shape=boxshape((o['w'], h, o['d'])))
    for k, st in enumerate(o.get('steps') or []):
        e = st.get('edge', 's'); along = o['w'] if e in ('n', 's') else o['d']; c = max(0.0, min(1.0, st.get('at', 0.5))) * along; w = min(st.get('width', 1.0), along)
        n = max(2, round(h / 0.2)); run = (n - 1) * STEP_TREAD
        if e == 's': ox, oz, ax, az = o['x'] + c, o['z'] + o['d'], 0, 1
        elif e == 'n': ox, oz, ax, az = o['x'] + c, o['z'], 0, -1
        elif e == 'e': ox, oz, ax, az = o['x'] + o['w'], o['z'] + c, 1, 0
        else: ox, oz, ax, az = o['x'], o['z'] + c, -1, 0
        sn = 'Steps%d' % k; sg = g + '/' + sn
        S.node(sn, 'Node3D', g, transform=T((ox, y0, oz), rot_y(math.degrees(math.atan2(ax, az)))))      # local +z points down the steps
        for i in range(1, n):
            hh = h * (n - i) / n
            mbox(sg, (0, hh / 2, (i - 0.5) * STEP_TREAD), (w, hh, STEP_TREAD), side)
        ang = math.degrees(math.atan2(h, run))
        S.node('Ramp', 'StaticBody3D', sg, transform=T((0, h / 2 - 0.03, run / 2), rot_x(ang)))
        S.node('Shape', 'CollisionShape3D', sg + '/Ramp', shape=boxshape((w, 0.1, math.hypot(h, run) + 0.2)))
for o in OBJ:
    if o['type'] != 'ceiling': continue
    hgt = o.get('h') or 2.4
    cam_blocker(mbox(MP + '/Ceilings', (o['x'] + o['w'] / 2, EV(o) + hgt + 0.01, o['z'] + o['d'] / 2), (o['w'], 0.02, o['d']), tex_mat(o.get('tex') or 'b:plaster_v11', o.get('scale') or 1.0, affine=0.0)), (o['w'], 0.02, o['d']))      # the shoulder camera can't rise through it; Norah never touches it
_ROOF = [0]
def roof_faces(o):
    """The same surfaces the Map Designer draws (roofFaces in map_designer.html): [(points, is_gable_end)]"""
    ov = o.get('overhang', 0.3); t = math.tan(math.radians(max(0, min(75, o.get('pitch', 35))))); base = EV(o) + (o.get('base') or 2.4)
    byX = (o.get('ridge') or 'x') == 'x'
    L0, L1 = (o['x'], o['x'] + o['w']) if byX else (o['z'], o['z'] + o['d'])
    C0, C1 = (o['z'], o['z'] + o['d']) if byX else (o['x'], o['x'] + o['w'])
    W_ = (lambda l, y, c: (l, y, c)) if byX else (lambda l, y, c: (c, y, l))
    half = (C1 - C0) / 2; cc = (C0 + C1) / 2; ye = base - ov * t; F = []
    st = o.get('style', 'gable')
    if st == 'flat':
        y = base + (o.get('thick') or 0.12); F.append(([W_(L0 - ov, y, C0 - ov), W_(L1 + ov, y, C0 - ov), W_(L1 + ov, y, C1 + ov), W_(L0 - ov, y, C1 + ov)], False))
    elif st == 'shed':
        hi = o.get('high', 'n'); hiC0 = hi in ('n', 'w'); span = C1 - C0
        yLo, yHi = base - ov * t, base + (span + ov) * t; cLo, cHi = (C1 + ov, C0 - ov) if hiC0 else (C0 - ov, C1 + ov)
        F.append(([W_(L0 - ov, yLo, cLo), W_(L1 + ov, yLo, cLo), W_(L1 + ov, yHi, cHi), W_(L0 - ov, yHi, cHi)], False))
        for l in (L0, L1): F.append(([W_(l, base, C1 if hiC0 else C0), W_(l, base, C0 if hiC0 else C1), W_(l, base + span * t, C0 if hiC0 else C1)], True))
    elif st == 'hip':
        yr = base + half * t; r0 = min(L0 + half, (L0 + L1) / 2); r1 = max(L1 - half, (L0 + L1) / 2)
        F += [([W_(L0 - ov, ye, C0 - ov), W_(L1 + ov, ye, C0 - ov), W_(r1, yr, cc), W_(r0, yr, cc)], False),
              ([W_(L1 + ov, ye, C1 + ov), W_(L0 - ov, ye, C1 + ov), W_(r0, yr, cc), W_(r1, yr, cc)], False),
              ([W_(L0 - ov, ye, C1 + ov), W_(L0 - ov, ye, C0 - ov), W_(r0, yr, cc)], False),
              ([W_(L1 + ov, ye, C0 - ov), W_(L1 + ov, ye, C1 + ov), W_(r1, yr, cc)], False)]
    else:
        yr = base + half * t
        F += [([W_(L0 - ov, ye, C0 - ov), W_(L1 + ov, ye, C0 - ov), W_(L1 + ov, yr, cc), W_(L0 - ov, yr, cc)], False),
              ([W_(L1 + ov, ye, C1 + ov), W_(L0 - ov, ye, C1 + ov), W_(L0 - ov, yr, cc), W_(L1 + ov, yr, cc)], False)]
        for l in (L0, L1): F.append(([W_(l, base, C0), W_(l, base, C1), W_(l, yr, cc)], True))
    return F
def roof_obj(faces):
    """Both windings, so the roof shows from inside and out (the PS1 shader culls back faces)."""
    _ROOF[0] += 1; nm = 'roof_%03d' % _ROOF[0]; d = os.path.join(ROOT, 'assets/meshes/designer_roofs'); os.makedirs(d, exist_ok=True)
    lines, vi = [], 0
    for pts, _g in faces:
        for q in pts: lines.append('v %.4f %.4f %.4f' % q)
        idx = list(range(vi + 1, vi + 1 + len(pts))); vi += len(pts)
        for i in range(1, len(idx) - 1):
            lines.append('f %d %d %d' % (idx[0], idx[i], idx[i + 1])); lines.append('f %d %d %d' % (idx[0], idx[i + 1], idx[i]))
    open(os.path.join(d, nm + '.obj'), 'w').write('\n'.join(lines) + '\n')
    return 'res://assets/meshes/designer_roofs/%s.obj' % nm
for o in OBJ:
    if o['type'] != 'roof': continue
    F = roof_faces(o)
    for part, tid in ((False, o.get('tex') or 'b:shingle_dark'), (True, o.get('texGable') or o.get('tex') or 'b:siding_white')):
        sel = [x for x in F if x[1] == part]
        if sel: S.node(uid('Roof'), 'MeshInstance3D', MP + '/Roofs', mesh=S.ext_res('Mesh', roof_obj(sel)), material_override=matref(tex_mat(tid, 1.0)))
LEGACY_LAMPS = {'lamp', 'streetlight', 'nightstand'}       # Chapter One lights these by hand
for o in OBJ:
    if o['type'] != 'prop': continue
    a = ASSETS.get(o['asset']) or {}
    if a.get('light') and o.get('lit', o['asset'] not in LEGACY_LAMPS):
        L = a['light']; sc = o.get('scale', 1) or 1
        lp = apply(scale_rows(rot_y(o.get('rot', 0)), sc), L['p']); hc = L['color'].lstrip('#'); c = tuple(int(hc[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
        S.node(uid('Lamp'), 'OmniLight3D', MP + '/Lights', transform=T((o['x'] + lp[0], EV(o) + (o.get('y') or 0) + lp[1], o['z'] + lp[2])), light_color=C(*c),
               light_energy=f(L['energy'] * 1.2), omni_range=f(L['range'] * sc), shadow_enabled='false', omni_attenuation='1.2')
    if o.get('search', a.get('search', False)):
        S.node('Search_' + o['id'], 'Marker3D', MP + '/Searchables', transform=T((o['x'], EV(o) + (o.get('y') or 0) + 0.8, o['z'])),
               editor_description='"%s: searchable. Contains: %s"' % (a.get('name', o['asset']).replace('"', "'"), (o.get('contains') or '(not set)').replace('"', "'")))

# ------------------------------------------------------------------ lights from the map, plus the porch light, the moon and the streetlights
for o in OBJ:
    if o['type'] != 'light': continue
    h = o['color'].lstrip('#'); c = tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    S.node(uid('L'), 'OmniLight3D', MP + '/Lights', transform=T((o['x'], o['y'], o['z'])), light_color=C(*c), light_energy=f(max(1.0, o['energy']) * 1.25), omni_range=f(o['range'] * 1.35),
           shadow_enabled='false', omni_attenuation='0.8')
S.node('HallLight', 'OmniLight3D', MP + '/Lights', transform=T((-10.2, 2.1, 1.0)), light_color=C(1, 0.82, 0.55), light_energy='0.7', omni_range='4.5', shadow_enabled='false')
S.node('PorchLight', 'OmniLight3D', MP + '/Lights', transform=T((-1.1, 2.15, -1.1)), light_color=C(1, 0.82, 0.55), light_energy='1.1', omni_range='6.5', shadow_enabled='true')
mbox(MP + '/Lights', (-1.95, 2.0, -1.9), (0.06, 0.16, 0.1), 'nh_lamp', name='PorchBulb')
S.node('Moon', 'DirectionalLight3D', MP + '/Lights', transform=T((0, 30, 0), look_at_rows((0, 30, 0), (-12, 0, 14))), light_color=C(0.5, 0.58, 0.8), light_energy='0.22', shadow_enabled='false')
for o in OBJ:
    if o['type'] == 'prop' and o['asset'] == 'streetlight':
        r_ = math.radians(o.get('rot', 0)); lx, lz = o['x'] + -math.sin(r_) * -1.15 * 0 + math.sin(r_) * 0, o['z']
        # the lamp head hangs 1.15 m along the arm (local -z)
        hx, hz = o['x'] - math.sin(r_) * 1.15, o['z'] - math.cos(r_) * 1.15
        S.node(uid('Street'), 'OmniLight3D', MP + '/Lights', transform=T((hx, 4.7, hz)), light_color=C(1, 0.86, 0.6), light_energy='1.4', omni_range='12', shadow_enabled='false')
# the yard light over Louis's drive: off (the bulb is smashed); his house is dark inside
S.node('LouisDim', 'OmniLight3D', MP + '/Lights', transform=T((28.4, 2.0, -9.6)), light_color=C(0.55, 0.6, 0.8), light_energy='0.12', omni_range='6', shadow_enabled='false')
S.node('UpDim', 'OmniLight3D', MP + '/Lights', transform=T((72.2, 2.0, -4.6)), light_color=C(0.55, 0.6, 0.8), light_energy='0.15', omni_range='6', shadow_enabled='false')

# ------------------------------------------------------------------ set dressing: Norah's house (photos, clutter, Addie's room), Louis's ruin
DR = MP + '/Dressing'
def framed(c, w, h, facing, pic, name=None):
    rows = {'+z': I3, '-z': rot_y(180), '+x': rot_y(90), '-x': rot_y(-90)}[facing]
    nrm = apply(rows, (0, 0, 1))
    mbox(DR, c, (w + 0.05, h + 0.05, 0.025), 'nh_frame', rows)
    quad(DR, (c[0] + nrm[0] * 0.014, c[1], c[2] + nrm[2] * 0.014), w, h, rows, pic, name=name)
framed((-8.9, 1.5, 0.09), 0.36, 0.28, '+z', 'nh_addie_birthday', 'PhotoBirthdayPic')       # hallway, north wall (south face)
framed((-11.7, 1.45, 0.09), 0.3, 0.38, '+z', 'nh_addie_school')
framed((-7.92, 1.5, -2.2), 0.42, 0.3, '+x', 'nh_addie_lake')                               # living room, west wall
framed((-14.5, 1.5, 2.41), 0.3, 0.36, '-z', 'nh_addie_baby')                               # bedroom, south wall
quad(DR, (-3.0, 1.15, 5.62), 0.24, 0.3, rot_y(180), 'nh_fridge_pickle', 'FridgeDrawing')    # on the fridge door (it faces -z)
mbox(DR, (-6.0, 1.3, 6.41), (0.36, 0.44, 0.01), 'nh_photo_c', name='Calendar')             # kitchen calendar
mbox(DR, (-7.42, 1.35, 4.6), (0.06, 0.32, 0.22), 'nh_counter', name='WallPhone'); mbox(DR, (-7.38, 1.42, 4.6), (0.05, 0.2, 0.06), 'nh_tv')
mbox(DR, (-4.5, 0.77, 3.3), (0.22, 0.02, 0.3), 'nh_mail_bill', rot_y(18), name='Journal')     # Norah's journal on the kitchen table
mbox(DR, (-4.2, 0.79, 3.7), (0.08, 0.1, 0.08), 'nh_mug')
mbox(DR, (-11.86, 0.01, 4.9), (1.6, 0.02, 1.2), 'v9_addie_rug')                               # Addie's room
mbox(DR, (-11.6, 0.62, 6.35), (0.22, 0.18, 0.12), 'nh_kidpink', name='Pickle')               # her stuffed cat on the pillow
mbox(DR, (-14.57, 0.01, 0.2), (1.8, 0.02, 1.2), 'nh_runner')
# the lockbox under Norah's bed (visible from the bed's side)
mbox(DR, (-13.95, 0.08, -1.6), (0.32, 0.14, 0.22), 'nh_lockbox', name='Lockbox')
# Louis's house: everything wrong
for (c, rows_, w_, h_, mat_) in (((26.0, 1.3, -11.93), I3, 1.2, 1.0, 'v9_blood'), ((24.07, 1.1, -9.4), rot_y(90), 1.4, 1.2, 'v9_claws'),
                                 ((30.6, 1.2, -7.6), rot_y(180), 1.0, 1.0, 'v9_blood'), ((32.93, 1.4, -6.0), rot_y(-90), 1.0, 1.3, 'v9_claws'),
                                 ((28.6, 1.0, -3.57), rot_y(180), 0.9, 1.0, 'v9_blood'), ((74.43, 1.3, -4.0), rot_y(-90), 1.0, 1.1, 'v9_claws'),
                                 ((68.0, 1.2, -6.93), I3, 1.2, 1.0, 'v9_blood')):
    quad(DR, c, w_, h_, rows_, mat_)
for k in range(10):           # debris on the floor: broken frames, splinters, papers
    x, z = rng.uniform(24.4, 32.6), rng.uniform(-11.6, -7.9)
    mbox(DR, (x, 0.02, z), (rng.uniform(0.1, 0.4), 0.02, rng.uniform(0.05, 0.3)), rng.choice(['lh_splinter', 'lh_frame', 'nh_mail_bill']), rot_y(rng.uniform(0, 180)))
mbox(DR, (26.4, 0.25, -9.4), (0.44, 0.05, 0.44), 'lh_wood', mul(rot_y(30), rot_x(80)))          # an overturned chair
mbox(DR, (26.6, 0.06, -9.2), (0.05, 0.45, 0.05), 'lh_wood', rot_z(84))
K.mat('v9_photo_rose', 'docs/photo_louis_rose.png', (1, 1), (0.85, 0.8, 0.75), world=False, affine=0.1)
framed((27.5, 1.5, -11.91), 0.34, 0.32, '+z', 'v9_photo_rose', 'RosePhoto')
K.mat('v9_photo_storm', 'docs/photo_storm.png', (1, 1), (0.8, 0.78, 0.74), world=False, affine=0.1)
framed((24.09, 1.5, -9.0), 0.34, 0.32, '+x', 'v9_photo_storm', 'StormPhoto')                    # by the door: Norah and Louis after the storm                     # Louis & Rose, still on the wall (the doc image is drawn separately)
mbox(DR, (67.13, 0.62, -5.58), (0.95, 0.06, 1.8), 'lh_torn', name='TornSheets')
mbox(DR, (67.2, 0.66, -5.3), (0.5, 0.02, 0.7), 'lh_scorch')
for k in range(5): quad(DR, (68.5 + k * 0.08, 0.012, -4.9 - k * 0.0), 0.12, 0.26, rot_x(-90), 'lh_wet')   # wet footprints to the window

# ------------------------------------------------------------------ the neighbourhood around the cul-de-sac
NB = MP + '/Neighbourhood'
def mailbox(parent, x, z, face, name=None):
    nm = name or uid('MB'); S.node(nm, 'Node3D', parent, transform=T((x, 0, z), rot_y(face))); g = parent + '/' + nm
    mbox(g, (0, 0.55, 0), (0.08, 1.1, 0.08), 'nh_wood_dark', col=True)
    mbox(g, (0, 1.2, 0), (0.24, 0.2, 0.42), 'nh_metal'); mbox(g, (0, 1.3, 0), (0.24, 0.06, 0.42), 'nh_metal')
    mbox(g, (0.13, 1.28, -0.12), (0.02, 0.16, 0.04), 'c1_tail')
HOUSES = []
DRIVES = []
BRICK, WOOD = tex_mat('b:brick'), tex_mat('b:wood_dark', 1.0, (0.85, 0.85, 0.9))
def neighbour(i, x, z, face, lit, style, name, extra=None):
    """A house in the same family as Norah's (one storey, brick, white trim, shingle roof) or Louis's
    (two storeys, dark boards, steep roof), set well back from the road at the end of a long drive, in the trees."""
    g = NB + '/' + name
    S.node(name, 'Node3D', NB, transform=T((x, 0, z), rot_y(face)))
    two = style == 'louis'
    w, d = (9.0, 7.0) if not two else (8.0, 7.0)
    h = 2.6 if not two else 5.0
    wall = BRICK if not two else WOOD
    HOUSES.append((x, z, max(w, d) / 2 + 3.0))
    mbox(g, (0, h / 2, 0), (w, h, d), wall, col=True)
    mbox(g, (0, 0.12, 0), (w + 0.1, 0.24, d + 0.1), 'nh_trim_ext')
    roof(g, -w / 2, w / 2, -d / 2, d / 2, h, 'v9_roof_n' if not two else 'lh_roof', wall, pitch=30 if not two else 38)
    mbox(g, (w * 0.3, h + 1.3, -d * 0.2), (0.6, 2.0, 0.6), 'brick')                     # chimney
    mbox(g, (0, h + 0.02, d / 2 + 0.1), (w + 0.6, 0.08, 0.12), 'nh_gutter')
    # porch: concrete slab with fence rails like Norah's, or Louis's boards with posts
    px = -w * 0.15
    mbox(g, (px, 0.06, d / 2 + 1.1), (2.6, 0.12, 2.0), 'concrete' if not two else 'lh_porch')
    if not two:
        for sx in (-1.25, 1.25): mbox(g, (px + sx, 0.5, d / 2 + 1.1), (0.05, 0.8, 1.9), 'nh_trim')
        mbox(g, (px, 2.35, d / 2 + 1.0), (2.8, 0.08, 2.2), 'nh_roof', rot_x(-8))
    else:
        for sx in (-1.2, 1.2): mbox(g, (px + sx, 1.2, d / 2 + 2.0), (0.1, 2.4, 0.1), 'nh_trim')
        mbox(g, (px, 2.45, d / 2 + 1.1), (2.9, 0.08, 2.3), 'lh_roof')
    door_open = extra == 'pruitt'
    mbox(g, (px, 1.0, d / 2 + 0.02), (0.95, 2.0, 0.06), 'c1_win_dark' if door_open else 'nh_wood_dark', name='Door')
    floors = (1.45,) if not two else (1.45, 3.9)
    for fy in floors:
        for k, wx in enumerate((-w * 0.38, w * 0.2, w * 0.38)):
            if fy < 2 and abs(wx - px) < 0.9: continue
            on = lit and (k != 1 or i % 2 == 0) and fy < 2
            mbox(g, (wx, fy, d / 2 + 0.02), (1.0, 0.9, 0.05), 'c1_win_lit' if on else 'c1_win_dark', name='Win%d_%d' % (int(fy * 10), k))
            mbox(g, (wx, fy, d / 2 + 0.04), (1.15, 1.05, 0.02), 'nh_trim')
        for sx in (-1, 1): mbox(g, (sx * (w / 2 + 0.02), fy, -d * 0.1), (0.05, 0.9, 0.9), 'c1_win_lit' if (lit and sx < 0 and fy < 2) else 'c1_win_dark')
    if lit: S.node('Lit', 'OmniLight3D', g, transform=T((-w * 0.38, 1.5, d / 2 + 1.2)), light_color=C(1, 0.8, 0.5), light_energy='0.8', omni_range='7')
    S.node('PorchL', 'OmniLight3D', g, transform=T((px + 0.9, 2.0, d / 2 + 1.0)), light_color=C(1, 0.82, 0.55), light_energy='0.55' if lit else '0.0', omni_range='5')
    if door_open:
        # the Pruitts': door left open, a car abandoned with its door open; on the drive out, the house is burning (Fire, shown by the director)
        mbox(g, (w * 0.25, 0.55, d / 2 + 6.0), (1.8, 0.7, 4.2), 'car_blue'); mbox(g, (w * 0.25, 1.15, d / 2 + 6.2), (1.6, 0.6, 2.0), 'car_blue')
        mbox(g, (w * 0.25 - 1.3, 0.75, d / 2 + 5.4), (0.06, 0.8, 1.0), 'car_blue', rot_y(-50))
        S.node('Fire', 'Node3D', g, visible='false')
        fg = g + '/Fire'
        fire_mat = S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0', blend_mode='1', billboard_mode='3', billboard_keep_scale='true',
                             vertex_color_use_as_albedo='true', albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/fire.png'), texture_filter='0')
        smoke_mat = S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0', billboard_mode='3', billboard_keep_scale='true',
                              vertex_color_use_as_albedo='true', albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/smoke.png'), texture_filter='0')
        ramp = S.sub_res('Gradient', offsets='PackedFloat32Array(0, 0.5, 1)', colors='PackedColorArray(1, 0.85, 0.4, 1, 1, 0.4, 0.1, 0.9, 0.3, 0.05, 0.02, 0)')
        sramp = S.sub_res('Gradient', offsets='PackedFloat32Array(0, 1)', colors='PackedColorArray(0.15, 0.13, 0.12, 0.7, 0.1, 0.1, 0.1, 0)')
        for k, (fx, fy, fz, amt, ext) in enumerate(((0, h * 0.5, 0, 90, (w * 0.45, h * 0.4, d * 0.4)), (px, 1.2, d / 2 + 0.2, 30, (0.6, 0.8, 0.2)),
                                                     (-w * 0.38, 1.45, d / 2 + 0.2, 24, (0.5, 0.4, 0.2)), (0, h + 1.2, 0, 70, (w * 0.4, 0.6, d * 0.35)))):
            S.node('Flames%d' % k, 'CPUParticles3D', fg, transform=T((fx, fy, fz)), amount=str(amt), lifetime='0.9', emission_shape='3', emission_box_extents=V3(*ext),
                   direction=V3(0, 1, 0), spread='12.0', gravity=V3(0, 2.5, 0), initial_velocity_min='0.6', initial_velocity_max='1.6', scale_amount_min='1.2', scale_amount_max='2.4',
                   color_ramp=ramp, mesh=S.sub_res('QuadMesh', size='Vector2(0.9, 0.9)', material=fire_mat))
        S.node('Smoke', 'CPUParticles3D', fg, transform=T((0, h + 2.0, 0)), amount='40', lifetime='4.0', emission_shape='3', emission_box_extents=V3(w * 0.4, 0.5, d * 0.4),
               direction=V3(0.2, 1, 0), spread='15.0', gravity=V3(0.4, 1.2, 0), initial_velocity_min='0.8', initial_velocity_max='1.6', scale_amount_min='2.5', scale_amount_max='5.0',
               color_ramp=sramp, mesh=S.sub_res('QuadMesh', size='Vector2(1.6, 1.6)', material=smoke_mat))
        for k, (lx, ly, lz) in enumerate(((0, 2.0, d / 2 + 2.0), (-w * 0.4, 2.5, 0), (w * 0.4, 3.0, -1.0))):
            S.node('Glow%d' % k, 'OmniLight3D', fg, transform=T((lx, ly, lz)), light_color=C(1, 0.5, 0.18), light_energy='3.0', omni_range='14',
                   script=S.ext_res('Script', 'res://scripts/environments/flicker_light.gd'), base_energy='3.0', flicker_chance='7.0', dropout_chance='0.0')
        mbox(fg, (0, h / 2, d / 2 + 0.05), (w + 0.02, h, 0.04), 'c1_glow_city')       # the facade glowing through the smoke
        S.node('Roar', 'AudioStreamPlayer3D', fg, transform=T((0, 2, d / 2)), stream=S.ext_res('AudioStream', 'res://assets/audio/fire_loop.wav'), unit_size='9.0', volume_db='2.0', autoplay='false')
    # a long drive that bends down to the road, with the mailbox at the end
    if extra == 'own_drive':
        DRIVES.append(catmull(WDRIVE)); mailbox(NB, 1.9, 29.2, 270); return
    fx, fz = math.sin(math.radians(face)), math.cos(math.radians(face))
    rx_, rz_ = -fz, fx                                         # the house's right-hand side
    start = (x + fx * (d / 2 + 2.2), z + fz * (d / 2 + 2.2))
    dist = 0.0
    while road_dist(start[0] + fx * dist, start[1] + fz * dist) > 0.6 and dist < 60: dist += 0.5
    bend = 2.6 * (1 if i % 2 else -1)
    pts = [start, (start[0] + fx * dist * 0.35 + rx_ * bend, start[1] + fz * dist * 0.35 + rz_ * bend),
           (start[0] + fx * dist * 0.75 + rx_ * bend * 0.6, start[1] + fz * dist * 0.75 + rz_ * bend * 0.6), (start[0] + fx * (dist + 0.8), start[1] + fz * (dist + 0.8))]
    dp = catmull(pts, 1.0)
    strip(NB, dp, 2.6, tex_mat('b:gravel' if not two else 'b:dirt', 1.5, (0.72, 0.7, 0.66), affine=0.0), y=0.003)
    DRIVES.append(dp)
    ex, ez = dp[-2]
    mailbox(NB, ex + rx_ * 1.9, ez + rz_ * 1.9, face + 180)
def road_pt(z_):
    pts = catmull(MAIN)
    best = min(pts, key=lambda q: abs(q[1] - z_))
    return best
# spaced well apart down the road, alternating sides, each at the end of its own long drive in the trees
for i, (zz, side, out, lit, style, extra, nm) in enumerate([(98.0, -1, 30.0, 1, 'norah', None, 'HouseHollis'),
                                                            (150.0, 1, 27.0, 1, 'louis', 'pruitt', 'HousePruitt'),
                                                            (205.0, -1, 32.0, 0, 'louis', None, 'HouseDeane'),
                                                            (258.0, 1, 30.0, 1, 'norah', None, 'HouseCarver')]):
    rx, rz = road_pt(zz)
    x, z = rx + side * out, rz + 4.0
    face = math.degrees(math.atan2(rx - x, rz - z))
    neighbour(i, x, z, face, lit, style, nm, extra=extra)
# the one other property: past Norah's house to the west, its own drive down to her lane
neighbour(4, -40.0, 8.0, 35.0, 0, 'norah', 'HouseWest', extra='own_drive')
def drive_dist(x, z):
    best = 1e9
    for dp in DRIVES:
        for (x0, z0), (x1, z1) in zip(dp, dp[1:]):
            dx, dz = x1 - x0, z1 - z0; L2 = dx * dx + dz * dz or 1e-9
            t = max(0.0, min(1.0, ((x - x0) * dx + (z - z0) * dz) / L2)); best = min(best, math.hypot(x - (x0 + t * dx), z - (z0 + t * dz)))
    return best
for hx, hz, hr in list(HOUSES):          # trees around every house, clear of the drive and the roads
    for k in range(16):
        a = rng.uniform(0, 360); r_ = rng.uniform(hr + 1.5, hr + 11.0)
        x, z = hx + math.cos(math.radians(a)) * r_, hz + math.sin(math.radians(a)) * r_
        if road_dist(x, z) < 4.0 or drive_dist(x, z) < 3.0 or any(math.hypot(x - ox, z - oz) < orr + 0.5 for ox, oz, orr in HOUSES): continue
        place_prop({'asset': 'tree' if rng.random() < 0.75 else 'tree_bare', 'x': x, 'z': z, 'rot': rng.uniform(0, 360), 'scale': rng.uniform(0.95, 1.3)}, MP + '/Trees', uid('HT'))
g = NB
mbox(g, (5.2, 1.3, 49.6), (0.06, 2.6, 0.06), 'nh_metal'); mbox(g, (5.2, 2.55, 49.6), (0.9, 0.18, 0.02), 'c1_post')
# ------------------------------------------------------------------ v11: the forest (MultiMesh, so thousands of trees stay cheap)
import numpy as _np
_frng = _np.random.default_rng(1103)
def _ry(a):
    c, s_ = math.cos(a), math.sin(a); return _np.array([[c, 0, s_], [0, 1, 0], [-s_, 0, c]])
def _rx(a):
    c, s_ = math.cos(a), math.sin(a); return _np.array([[1, 0, 0], [0, c, -s_], [0, s_, c]])
def _rz(a):
    c, s_ = math.cos(a), math.sin(a); return _np.array([[c, -s_, 0], [s_, c, 0], [0, 0, 1]])
_MM = {}            # (mesh key, material) -> list of 3x4 rows
def _inst(key, mat, M, o):
    _MM.setdefault((key, mat), []).append((M, o))
def _part(key, mat, TM, TO, M, o):
    _inst(key, mat, TM @ M, TO + TM @ _np.array(o, float))
MESHES = {
    'trunk': lambda: S.sub_res('CylinderMesh', top_radius='0.6', bottom_radius='1.0', height='1.0', radial_segments='6', rings='1'),
    'cone': lambda: S.sub_res('CylinderMesh', top_radius='0.0', bottom_radius='1.0', height='1.0', radial_segments='7', rings='1'),
    'blob': lambda: S.sub_res('SphereMesh', radius='0.5', height='1.0', radial_segments='7', rings='4'),
    'card': lambda: S.sub_res('QuadMesh', size='Vector2(1, 1)', center_offset=V3(0, 0.5, 0)),
    'flat': lambda: S.sub_res('PlaneMesh', size='Vector2(1, 1)'),
}
def _alpha_mat(tex):
    return S.sub_res('StandardMaterial3D', transparency='2', alpha_scissor_threshold='0.5', cull_mode='2', texture_filter='0',
                     albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/v11/' + tex), albedo_color=C(0.62, 0.6, 0.56))
M_PINE_B = tex_mat('v11/bark_pine.png', 1.0, (0.75, 0.7, 0.66)); M_OAK_B = tex_mat('v11/bark_oak.png', 1.0, (0.8, 0.78, 0.74))
M_BIRCH_B = tex_mat('v11/bark_birch.png', 1.0, (0.85, 0.85, 0.85))
M_NEEDLE = tex_mat('v11/needles.png', 1.6, (0.85, 0.9, 0.85)); M_OR = tex_mat('v11/leaves_orange.png', 1.4, (0.9, 0.85, 0.8))
M_GOLD = tex_mat('v11/leaves_gold.png', 1.4, (0.9, 0.88, 0.8)); M_BROWN = tex_mat('v11/leaves_brown.png', 1.4, (0.85, 0.8, 0.75))
M_GREEN = tex_mat('v11/leaves_green.png', 1.4, (0.8, 0.85, 0.8))
A_FERN = _alpha_mat('fern.png'); A_DRIFT = _alpha_mat('leaf_drift.png'); A_DRIFT2 = _alpha_mat('leaf_drift_big.png')
_FCOL = [S.sub_res('CylinderShape3D', radius='0.32', height='2.0')]
def tree_at(x, z, kind, sc, collide):
    TM = _ry(_frng.uniform(0, 6.283)) * sc; TO = _np.array([x, 0.0, z])
    lean = _rx(_frng.normal(0, 0.03)) @ _rz(_frng.normal(0, 0.03))
    TM = TM @ lean
    if kind == 'pine':
        h = _frng.uniform(7.0, 11.0)
        _part('trunk', M_PINE_B, TM, TO, _np.diag([0.2, h, 0.2]), (0, h / 2, 0))
        tiers = int(_frng.integers(4, 6))
        for k in range(tiers):
            t = k / tiers; r_ = 2.3 * (1 - t) + 0.5; y = 1.8 + t * (h - 2.0)
            _part('cone', M_NEEDLE, TM, TO, _ry(k * 1.3) @ _np.diag([r_, 2.4, r_]), (0, y + 1.0, 0))
    elif kind in ('oak', 'maple'):
        h = _frng.uniform(4.0, 6.0)
        _part('trunk', M_OAK_B, TM, TO, _np.diag([0.26, h, 0.26]), (0, h / 2, 0))
        mat = M_OR if kind == 'maple' else (M_GOLD if _frng.random() < 0.5 else M_BROWN)
        for k in range(int(_frng.integers(3, 5))):
            a = _frng.uniform(0, 6.28); r_ = _frng.uniform(0.6, 1.6); w = _frng.uniform(2.4, 3.6)
            _part('blob', mat, TM, TO, _np.diag([w, w * 0.75, w]), (math.cos(a) * r_, h + _frng.uniform(-0.4, 1.2), math.sin(a) * r_))
        for k in range(2):        # a couple of heavy limbs showing under the canopy
            a = _frng.uniform(0, 6.28)
            _part('trunk', M_OAK_B, TM, TO, _ry(a) @ _rz(0.9) @ _np.diag([0.1, 1.8, 0.1]), (math.cos(a) * 0.6, h - 0.8, math.sin(a) * 0.6))
    elif kind == 'birch':
        h = _frng.uniform(6.0, 8.0)
        _part('trunk', M_BIRCH_B, TM, TO, _np.diag([0.13, h, 0.13]), (0, h / 2, 0))
        for k in range(2):
            _part('blob', M_GOLD, TM, TO, _np.diag([1.8, 2.2, 1.8]), (_frng.uniform(-0.5, 0.5), h - 1.0 + k * 1.2, _frng.uniform(-0.5, 0.5)))
    else:   # bare, dead
        h = _frng.uniform(5.0, 7.5)
        _part('trunk', M_OAK_B, TM, TO, _np.diag([0.2, h, 0.2]), (0, h / 2, 0))
        for k in range(5):
            a = _frng.uniform(0, 6.28); L = _frng.uniform(1.4, 2.6)
            _part('trunk', M_OAK_B, TM, TO, _ry(a) @ _rz(_frng.uniform(0.5, 1.0)) @ _np.diag([0.07, L, 0.07]), (0, h * _frng.uniform(0.5, 0.95), 0))
    if collide:
        _n[0] += 1; nm = 'FC%d' % _n[0]
        S.node(nm, 'StaticBody3D', MP + '/Forest/Cols', transform=T((x, 1.0, z)))
        S.node('Shape', 'CollisionShape3D', MP + '/Forest/Cols/' + nm, shape=_FCOL[0])
def undergrowth(x, z, dense=1.0):
    TO = _np.array([x, 0.0, z])
    if _frng.random() < 0.6:
        sc = _frng.uniform(0.7, 1.3); TM = _ry(_frng.uniform(0, 6.28)) * sc
        _inst('card', A_FERN, TM, TO); _inst('card', A_FERN, TM @ _ry(1.5708), TO)
    if _frng.random() < 0.35 * dense:
        w = _frng.uniform(0.8, 1.6)
        _inst('blob', M_BROWN if _frng.random() < 0.6 else M_GREEN, _ry(_frng.uniform(0, 6.28)) @ _np.diag([w, w * 0.7, w]), TO + _np.array([0, w * 0.25, 0]))
def drift(x, z, big=False):
    sc = _frng.uniform(1.4, 2.6) * (1.7 if big else 1.0)
    _inst('flat', A_DRIFT2 if big else A_DRIFT, _ry(_frng.uniform(0, 6.28)) @ _np.diag([sc, 1, sc]), _np.array([x, 0.012 + _frng.uniform(0, 0.006), z]))

S.node('Forest', 'Node3D', MP); S.node('Cols', 'Node3D', MP + '/Forest')
PLAY = [(-16.6, -1.9, -4.1, 7.1), (-2.4, 8.4, -7.0, 26.2), (6.8, 15.12, -9.0, 9.17), (15.12, 27.6, -9.0, 10.0), (23.9, 33.1, -12.1, -3.4), (27.6, 34.5, -3.4, 8.0)]
def play_dist(x, z):
    best = 1e9
    for x0, x1, z0, z1 in PLAY:
        dx = max(x0 - x, 0, x - x1); dz = max(z0 - z, 0, z - z1); best = min(best, math.hypot(dx, dz))
    return best
def clear_of_buildings(x, z, pad):
    for rooms in (NORAH_ROOMS, LOUIS_ROOMS, UP_ROOMS):
        for r in rooms.values():
            if in_rect((x, z), r, pad): return False
    return all(math.hypot(x - hx, z - hz) > hr + pad for hx, hz, hr in HOUSES)
# sightlines kept clear of trunks and canopies: every map camera's view of its zone, and each neighbour's front yard
SIGHT = []
for o in OBJ:
    if o['type'] != 'camera': continue
    cx, cz = o['x'], o['z']; yw = math.radians(o.get('yaw', 0) or 0)
    fx, fz = -math.sin(yw), -math.cos(yw)
    SIGHT.append((cx, cz, cx + fx * 22, cz + fz * 22, 3.2))
    z_ = o.get('zone')
    if z_:
        for px, pz in ((z_['x'], z_['z']), (z_['x'] + z_['w'], z_['z']), (z_['x'], z_['z'] + z_['d']), (z_['x'] + z_['w'], z_['z'] + z_['d']),
                       (z_['x'] + z_['w'] / 2, z_['z'] + z_['d'] / 2)):
            SIGHT.append((cx, cz, px, pz, 2.4))
for hx, hz, hr in HOUSES:
    q = min(catmull(MAIN), key=lambda t: math.hypot(t[0] - hx, t[1] - hz))
    if math.hypot(q[0] - hx, q[1] - hz) < 45: SIGHT.append((hx, hz, q[0], q[1], 7.5))
def sight_dist(x, z):
    best = 1e9
    for ax, az, bx, bz, r in SIGHT:
        dx, dz = bx - ax, bz - az; L2 = dx * dx + dz * dz or 1e-9
        t = max(0.0, min(1.0, ((x - ax) * dx + (z - az) * dz) / L2))
        best = min(best, math.hypot(x - (ax + t * dx), z - (az + t * dz)) - r)
    return best
_ntrees = 0
# a jittered grid over the whole valley: dense woods everywhere that isn't road, drive, house or yard
for gx in _np.arange(-92, 128, 3.6):
    for gz in _np.arange(-78, 318, 3.6):
        x = gx + _frng.uniform(-1.6, 1.6); z = gz + _frng.uniform(-1.6, 1.6)
        rd = road_dist(x, z); dd = drive_dist(x, z); pd = play_dist(x, z)
        if rd < 3.2 or dd < 2.6 or pd < 2.5 or not clear_of_buildings(x, z, 5.5):
            if rd > 1.2 and dd > 1.0 and pd > 0.4 and clear_of_buildings(x, z, 1.5) and _frng.random() < 0.35:
                undergrowth(x, z, 0.5)              # verges and yard edges: ferns, scrub
            continue
        if pd < 10.0 or (pd < 16.0 and _frng.random() < 0.5) or sight_dist(x, z) < 0:      # open yards, so the overhead and fixed cameras see her      # thin out at the yards' edges and in the cameras' views
            undergrowth(x, z, 0.4); continue
        r_ = _frng.random()
        kind = 'pine' if r_ < 0.38 else ('maple' if r_ < 0.58 else ('oak' if r_ < 0.76 else ('birch' if r_ < 0.86 else 'bare')))
        tree_at(x, z, kind, _frng.uniform(0.8, 1.25), collide=pd < 14.0 or rd < 7.0)
        _ntrees += 1
        if _frng.random() < 0.55: undergrowth(x + _frng.uniform(-1.5, 1.5), z + _frng.uniform(-1.5, 1.5))
# leaves drifted onto the yards, porches, the lane, the drives and the roadside
for _ in range(900):
    x, z = _frng.uniform(-30, 40), _frng.uniform(-14, 60)
    if clear_of_buildings(x, z, 0.3): drift(x, z, _frng.random() < 0.25)
for pts, w_, _ in ROADS:
    for (x0, z0), (x1, z1) in zip(pts[::3], pts[3::3]):
        for side in (-1, 1):
            if _frng.random() < 0.7:
                dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz) or 1
                x, z = x0 + (-dz / L) * side * (w_ / 2 + _frng.uniform(-0.4, 0.8)), z0 + (dx / L) * side * (w_ / 2 + _frng.uniform(-0.4, 0.8))
                drift(x, z, _frng.random() < 0.4)
_meshes = {}
for (key, mat), items in _MM.items():
    if key not in _meshes: _meshes[key] = MESHES[key]()
    buf = []
    for _Mx, o in items:
        for i in range(3): buf += [_Mx[i, 0], _Mx[i, 1], _Mx[i, 2], o[i]]
    mm = S.sub_res('MultiMesh', transform_format='1', instance_count=str(len(items)), mesh=_meshes[key],
                   buffer='PackedFloat32Array(%s)' % ', '.join('%.3f' % v for v in buf))
    _n[0] += 1
    S.node('MM%d_%s' % (_n[0], key), 'MultiMeshInstance3D', MP + '/Forest', multimesh=mm, material_override=mat if mat.startswith('SubResource') else matref(mat),
           cast_shadow='0')
print('forest: %d trees, %d instance groups' % (_ntrees, len(_MM)))

# ------------------------------------------------------------------ Norah's sedan (detailed), parked where the map has it
K.mat('chrome', albedo=(0.72, 0.72, 0.7), emis=0.05); K.mat('seat', 'cloth_mint.png', (3, 3), (0.32, 0.28, 0.26)); K.mat('plate', albedo=(0.85, 0.82, 0.6))
K.mat('rubber', albedo=(0.06, 0.06, 0.06)); K.mat('carpet_car', albedo=(0.12, 0.11, 0.11))
CAR_O = nearest('car', 1.03, 16.72)
CAR = W + '/DriveCar'
S.node('DriveCar', 'Node3D', W, transform=T((CAR_O['x'], 0, CAR_O['z']), rot_y(CAR_O['rot'])))
def box(parent, c, size, m, rot=None, col=False, name=None):
    _n[0] += 1
    props = dict(transform=T(c, rot or I3), size=V3(*size), material=matref(m))
    if col: props['use_collision'] = 'true'
    return S.node(name or 'B%d' % _n[0], 'CSGBox3D', parent, **props)
def cb(c, size, m, rot=None, col=False, name=None, parent=CAR): return box(parent, c, size, m, rot=rot, col=col, name=name)
def glass(c, size, rot=None, name=None, parent=CAR):
    _n[0] += 1; S.node(name or 'G%d' % _n[0], 'MeshInstance3D', parent, transform=T(c, rot or I3), mesh=S.sub_res('BoxMesh', size=V3(*size)), material_override=GLASS)
def ccyl(c, r, h, m, rot=None, sides=10, name=None, parent=CAR):
    _n[0] += 1; S.node(name or 'Y%d' % _n[0], 'CSGCylinder3D', parent, transform=T(c, rot or I3), radius=f(float(r)), height=f(float(h)), sides=str(sides), material=M(m))
P_ = 'nh_car_maroon'
cb((0, 0.5, 0), (1.76, 0.42, 4.4), P_, col=True)
cb((0, 0.5, -2.21), (1.62, 0.36, 0.06), P_); cb((0, 0.5, 2.21), (1.62, 0.36, 0.06), P_)
for x in (-0.86, 0.86): cb((x, 0.5, 0), (0.06, 0.36, 4.28), P_)
cb((0, 0.77, -1.6), (1.66, 0.06, 1.25), P_, rot=rot_x(-4), name='Hood')
cb((0, 0.79, -1.6), (0.06, 0.02, 1.1), 'c1_chrome', rot=rot_x(-4))
cb((0, 0.79, 1.72), (1.66, 0.06, 0.95), P_)
for x in (-0.85, 0.85): cb((x, 0.78, 0.17), (0.06, 0.14, 2.3), P_)
cb((0, 0.78, -0.96), (1.66, 0.12, 0.1), P_); cb((0, 0.8, 1.27), (1.66, 0.1, 0.1), P_)
cb((0, 1.5, 0.24), (1.44, 0.06, 1.1), P_)
glass((0, 1.135, -0.625), (1.48, 0.93, 0.02), rot=rot_x(44), name='Windshield')
glass((0, 1.145, 1.04), (1.44, 0.83, 0.02), rot=rot_x(-38.6), name='RearWindow')
for x in (-0.76, 0.76):
    glass((x, 1.14, 0.24), (0.02, 0.56, 1.06))
    cb((x, 1.135, -0.625), (0.06, 0.95, 0.07), P_, rot=rot_x(44)); cb((x, 1.15, 0.25), (0.06, 0.66, 0.08), P_); cb((x, 1.145, 1.04), (0.06, 0.85, 0.08), P_, rot=rot_x(-38.6))
    for z in (-0.25, 0.75): cb((x * 1.162, 0.55, z), (0.005, 0.5, 0.01), 'nh_tire')
    cb((x * 1.165, 0.68, 0.05), (0.02, 0.03, 0.12), 'c1_chrome')
    cb((x * 1.2, 0.98, -0.32), (0.12, 0.08, 0.06), P_); cb((x * 1.22, 0.98, -0.29), (0.1, 0.06, 0.005), 'c1_chrome')
    cb((x * 1.12, 0.32, 0), (0.04, 0.06, 4.2), 'c1_chrome')
for x in (-0.82, 0.82):
    for z in (-1.38, 1.38):
        cb((x, 0.55, z), (0.24, 0.36, 0.86), 'c1_rubber')
        ccyl((x, 0.33, z), 0.33, 0.22, 'c1_rubber', rot=((0, -1, 0), (1, 0, 0), (0, 0, 1)), sides=12, name='Wheel_%s%s' % ('L' if x < 0 else 'R', 'F' if z < 0 else 'B'))
        ccyl((x * 1.1, 0.33, z), 0.17, 0.03, 'c1_chrome', rot=((0, -1, 0), (1, 0, 0), (0, 0, 1)), sides=10)
cb((0, 0.37, -2.27), (1.72, 0.14, 0.12), 'c1_chrome'); cb((0, 0.37, 2.27), (1.72, 0.14, 0.12), 'c1_chrome')
cb((0, 0.56, -2.245), (0.86, 0.16, 0.03), 'c1_rubber'); cb((0, 0.56, -2.255), (0.92, 0.2, 0.01), 'c1_chrome')
cb((-0.6, 0.58, -2.245), (0.3, 0.14, 0.04), 'nh_lamp', name='LampL'); cb((0.6, 0.58, -2.245), (0.3, 0.14, 0.04), 'nh_lamp', name='LampR')
cb((0, 0.46, 2.26), (0.36, 0.12, 0.02), 'c1_plate')
cb((-0.6, 0.62, 2.245), (0.3, 0.12, 0.03), 'c1_tail', name='TailL'); cb((0.6, 0.62, 2.245), (0.3, 0.12, 0.03), 'c1_tail', name='TailR')
ccyl((0.7, 1.1, 1.8), 0.006, 0.7, 'c1_chrome', sides=4)
cb((0, 0.715, 0.2), (1.6, 0.01, 2.3), 'c1_carpet_car')
for x in (-0.38, 0.38):
    cb((x, 0.71, -0.05), (0.52, 0.08, 0.52), 'c1_seat'); cb((x, 1.02, 0.24), (0.52, 0.6, 0.1), 'c1_seat', rot=rot_x(-8)); cb((x, 1.38, 0.29), (0.26, 0.16, 0.08), 'c1_seat')
cb((0, 0.74, 0.95), (1.5, 0.1, 0.5), 'c1_seat'); cb((0, 1.02, 1.18), (1.5, 0.52, 0.1), 'c1_seat', rot=rot_x(-10))
cb((0, 0.92, -0.78), (1.5, 0.16, 0.35), 'nh_tv'); cb((-0.38, 1.02, -0.72), (0.42, 0.06, 0.18), 'nh_tv')
ccyl((-0.38, 0.95, -0.66), 0.025, 0.3, 'nh_metal', rot=rot_x(60), sides=6)
S.node('SteerWheel', 'CSGTorus3D', CAR, transform=T((-0.38, 1.0, -0.52), rot_x(60)), inner_radius='0.14', outer_radius='0.175', sides='10', ring_sides='4', material=M('nh_metal'))
cb((0, 1.38, -0.42), (0.2, 0.06, 0.03), 'nh_tv')
S.node('Norah', 'Node3D', CAR, transform=T((-0.38, 0.22, 0.02)), script=S.ext_res('Script', 'res://scripts/characters/character_model.gd'),
       model_id='"norah"', start_animation='"sit_drive"', start_offset_random='false')
for nm, x in (('BeamL', -0.55), ('BeamR', 0.55)):
    S.node(nm, 'SpotLight3D', CAR, transform=T((x, 0.65, -2.2), look_at_rows((x, 0.65, -2.2), (x * 0.4, 0.2, -16.0))), light_color=C(1, 0.94, 0.78),
           light_energy='7.0', spot_range='34.0', spot_angle='17.0', spot_attenuation='0.6')
S.node('TailGlow', 'OmniLight3D', CAR, transform=T((0, 0.7, 2.6)), light_color=C(1, 0.1, 0.05), light_energy='0.6', omni_range='3.5')
S.node('DashGlow', 'OmniLight3D', CAR, transform=T((-0.25, 1.05, -0.62)), light_color=C(1.0, 0.78, 0.55), light_energy='0.55', omni_range='1.4')
cam('H2_Windshield', (0.14, 1.22, -0.72), (-0.38, 1.12, 0.12), 60, parent=CAR)
collider(CAR, (0, 0.8, 0), (1.8, 1.6, 4.6), name='Body')
# the wreck Louis leaves while she's barricaded (hidden until then)
S.node('Wreck', 'Node3D', CAR, visible='false')
K.mat('v9_crack', 'windshield_crack.png', (1, 1), (1, 1, 1), world=False, affine=0.1)
quad(CAR + '/Wreck', (0, 1.137, -0.64), 1.46, 0.9, rot_x(-46), 'v9_crack')
box(CAR + '/Wreck', (0.1, 0.86, -1.7), (1.3, 0.06, 1.0), 'nh_car_maroon', rot=mul(rot_x(-14), rot_z(9)))
box(CAR + '/Wreck', (-0.6, 0.58, -2.27), (0.3, 0.14, 0.02), 'nh_tire'); box(CAR + '/Wreck', (0.6, 0.58, -2.27), (0.3, 0.14, 0.02), 'nh_tire')
box(CAR + '/Wreck', (0.84, 0.18, 1.38), (0.3, 0.16, 0.7), 'c1_rubber')   # the slashed tyre, flat on the gravel
S.node('Glass', 'CPUParticles3D', CAR + '/Wreck', emitting='false')

# ------------------------------------------------------------------ Louis's pickup: rusted, sagging on soft tyres (in place of the scaled sedan prop)
TRK_O = nearest('car', 28.95, 2.0)
TRK = W + '/Truck'
S.node('Truck', 'Node3D', W, transform=T((TRK_O['x'], 0, TRK_O['z']), rot_y(TRK_O['rot'] % 360)))
TB, TM = 'c1_v9_truck', 'c1_v9_truck_bed'
def tb(c, size, m=TB, rot=None, col=False, name=None): return box(TRK, c, size, m, rot=rot, col=col, name=name)
tb((0, 0.62, 0.0), (1.9, 0.5, 5.2), col=True)                                     # body sill / frame
tb((0, 0.98, -1.75), (1.82, 0.32, 1.7), rot=rot_x(-3), name='Hood')               # hood
tb((0, 0.78, -2.62), (1.86, 0.5, 0.08))                                           # nose
tb((0, 0.7, -2.68), (1.5, 0.36, 0.03), 'c1_chrome')                               # grille
for x in (-0.7, 0.7): S.node('Lamp%s' % ('L' if x < 0 else 'R'), 'CSGCylinder3D', TRK, transform=T((x, 0.86, -2.67), rot_x(90)), radius='0.11', height='0.04', sides='10', material=M('nh_lamp'))
tb((0, 0.48, -2.72), (1.96, 0.16, 0.14), 'c1_chrome')                             # front bumper
tb((0, 1.25, -0.35), (1.84, 0.95, 1.4))                                           # cab
tb((0, 1.74, -0.3), (1.8, 0.06, 1.3))                                             # cab roof
glass((0, 1.42, -1.07), (1.6, 0.55, 0.02), rot=rot_x(18), name='Windshield', parent=TRK)
glass((0, 1.42, 0.36), (1.4, 0.4, 0.02), name='RearWindow', parent=TRK)
for x in (-0.93, 0.93): glass((x, 1.45, -0.4), (0.02, 0.42, 0.9), parent=TRK)
for x in (-0.94, 0.94):                                                           # bed sides
    tb((x, 1.0, 1.7), (0.06, 0.5, 2.3))
tb((0, 0.8, 1.7), (1.8, 0.04, 2.3), TM)                                           # bed floor
tb((0, 1.0, 2.83), (1.86, 0.5, 0.06), name='Tailgate')
tb((0, 0.5, 2.88), (1.9, 0.14, 0.12), 'c1_chrome')
for x in (-0.72, 0.72): box(TRK, (x, 1.05, 2.87), (0.2, 0.14, 0.03), 'c1_tail', name='Tail%s' % ('L' if x < 0 else 'R'))
for x in (-0.86, 0.86):
    for z in (-1.75, 1.7):
        tb((x * 1.02, 0.78, z), (0.3, 0.42, 1.1), 'c1_rubber')                     # arch
        S.node(uid('TW'), 'CSGCylinder3D', TRK, transform=T((x, 0.36, z), ((0, -1, 0), (1.15, 0, 0), (0, 0, 1))), radius='0.4', height='0.28', sides='12', material=M('c1_rubber'))   # squashed: low tyres
        S.node(uid('TH'), 'CSGCylinder3D', TRK, transform=T((x * 1.12, 0.38, z), ((0, -1, 0), (1, 0, 0), (0, 0, 1))), radius='0.18', height='0.03', sides='10', material=M('nh_rust'))
for x in (-1.02, 1.02): tb((x, 1.3, -0.95), (0.1, 0.12, 0.08), 'c1_chrome')      # mirrors
tb((0, 0.95, -0.1), (1.5, 0.12, 0.55), 'c1_seat'); tb((0, 1.25, 0.18), (1.5, 0.55, 0.12), 'c1_seat')
tb((0, 1.18, -0.92), (1.6, 0.16, 0.3), 'nh_tv')
S.node('SteerWheel', 'CSGTorus3D', TRK, transform=T((-0.4, 1.25, -0.72), rot_x(60)), inner_radius='0.16', outer_radius='0.195', sides='10', ring_sides='4', material=M('nh_metal'))
S.node('Norah', 'Node3D', TRK, transform=T((-0.4, 0.52, 0.0)), script=S.ext_res('Script', 'res://scripts/characters/character_model.gd'),
       model_id='"norah_worn"', start_animation='"sit_drive"', start_offset_random='false', visible='false')
for nm, x in (('BeamL', -0.7), ('BeamR', 0.7)):
    S.node(nm, 'SpotLight3D', TRK, transform=T((x, 0.86, -2.7), look_at_rows((x, 0.86, -2.7), (x * 0.4, 0.2, -16.0))), light_color=C(1, 0.9, 0.7),
           light_energy='5.0', spot_range='30.0', spot_angle='22.0', visible='false')
S.node('DashGlow', 'OmniLight3D', TRK, transform=T((-0.3, 1.3, -0.82)), light_color=C(0.6, 0.9, 0.6), light_energy='0.5', omni_range='1.4', visible='false')
cam('H2_Windshield', (0.18, 1.5, -0.86), (-0.4, 1.3, 0.1), 60, parent=TRK)
collider(TRK, (0, 1.0, 0), (1.95, 2.0, 5.7), name='Body')

# ------------------------------------------------------------------ the highway for the drive in and out (Z = +400, far south)
HZ = 400.0
HW = W + '/Highway'
box(HW, (0, -0.1, HZ), (700, 0.2, 60), 'nh_grass'); box(HW, (0, 0.0, HZ), (700, 0.04, 7.0), 'asphalt')
for x in range(-340, 341, 12): box(HW, (x, 0.025, HZ), (5, 0.02, 0.15), 'nh_bulb')
for side in (-1, 1):
    for i in range(170):
        x = -340 + i * 4.0 + rng.uniform(-1.5, 1.5); z = HZ + side * rng.uniform(6.0, 20.0); h = rng.uniform(7, 12)
        if side < 0 and abs(x - 40) < 6: continue
        bare = rng.random() < 0.55
        box(HW, (x, h * 0.32, z), (0.35, h * 0.64, 0.35), 'nh_bark')
        box(HW, (x, h * 0.72, z), (2.4 if bare else 3.2, h * 0.55, 2.4 if bare else 3.2), 'nh_bark' if bare else 'nh_leaves' if rng.random() < 0.6 else 'nh_tree')
cam('H3_Roadside', (36.0, 0.45, HZ + 5.0), (16.0, 0.9, HZ - 0.6), 46)
def refuge_sign(x, z, tex, w=1.5, h=1.03, post_h=1.2, lean=0.0, name=None):
    nm = name or 'Sign%d' % int(x); g = HW + '/' + nm
    S.node(nm, 'Node3D', HW, transform=T((x, 0, z), mul(yaw(90), rot_z(lean))))
    for px in (-w * 0.35, w * 0.35): box(g, (px, post_h / 2 + 0.2, -0.04), (0.09, post_h + 0.4, 0.09), 'c1_post')
    box(g, (0, post_h + h / 2, -0.02), (w + 0.04, h + 0.04, 0.03), 'c1_post')
    K.quad(g, (0, post_h + h / 2, 0.0), w, h, '+z', tex)
for x, tex, lean in ((150, 'refuge_sign_a', 2), (124, 'refuge_sign_b', -3), (100, 'refuge_sign_a', 4), (78, 'refuge_sign_b', -2), (62, 'refuge_sign_a', 1)):
    refuge_sign(x, HZ - 4.6, tex, lean=lean)
refuge_sign(46, HZ - 4.4, 'refuge_sign_junction', w=2.2, h=1.1, post_h=1.0, lean=-2, name='SignJunction')
refuge_sign(36.2, HZ - 6.5, 'refuge_sign_b', w=1.2, h=0.82, post_h=0.9, lean=6, name='SignMouth')
box(HW, (0, -0.1, HZ - 60), (700, 0.2, 60), 'nh_grass')
DIRT = [(40, HZ - 3.4), (40.5, HZ - 14), (39, HZ - 26), (36, HZ - 40), (34, HZ - 58), (35, HZ - 80)]
for (x0, z0), (x1, z1) in zip(DIRT, DIRT[1:]):
    dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz); a = math.degrees(math.atan2(dx, dz))
    box(HW, ((x0 + x1) / 2, -0.02, (z0 + z1) / 2), (3.6, 0.04, L + 2), 'nh_dirt', rot=yaw(a))
    for side in (-1, 1):
        nx, nz = math.cos(math.radians(a)) * side, -math.sin(math.radians(a)) * side
        cx, cz = (x0 + x1) / 2 + nx * 5.5, (z0 + z1) / 2 + nz * 5.5
        if z0 > HZ - 8: continue
        box(HW, (cx, 1.2, cz), (6.0, 0.4, L + 2.5), 'c1_bank', rot=mul(yaw(a), rot_z(-side * 28)))
        for k in range(3):
            t = (k + rng.random()) / 3; tx, tz = x0 + dx * t + nx * rng.uniform(4.5, 9), z0 + dz * t + nz * rng.uniform(4.5, 9); h = rng.uniform(8, 12)
            box(HW, (tx, 2.6 + h * 0.3, tz), (0.35, h * 0.6, 0.35), 'nh_bark'); box(HW, (tx, 2.6 + h * 0.72, tz), (3.0, h * 0.55, 3.0), 'nh_tree' if rng.random() < 0.6 else 'nh_bark')
S.node('CityGlow', 'Node3D', HW, visible='false')
for k in range(9): box(HW + '/CityGlow', (-62, 6 + k * 0.5, HZ - 32 + k * 8), (2, 12 + rng.uniform(-3, 4), 8.2), 'c1_glow_city')
S.node('Light', 'OmniLight3D', HW + '/CityGlow', transform=T((-50, 16, HZ)), light_color=C(1, 0.45, 0.15), light_energy='1.2', omni_range='60')
cam('R2_Sign', (104.2, 1.2, HZ - 1.2), (100.0, 1.6, HZ - 4.6), 56)
cam('R3_Junction', (54.0, 5.0, HZ + 5.5), (30.0, 0.6, HZ - 2.0), 56)
cam('R4_Ravine', (39.0, 0.9, HZ - 32.0), (40.2, 1.0, HZ - 3.0), 50)
cam('R5_Taillights', (41.5, 2.4, HZ + 1.5), (37.0, 0.4, HZ - 45.0), 46)
S.node('Flash', 'OmniLight3D', W, transform=T((0, 40, HZ)), light_color=C(1, 1, 1), light_energy='0.0', omni_range='160.0', omni_attenuation='0.3')

# ------------------------------------------------------------------ Louis (his ACROSS form: louis.glb)
LF_ORIG = next(o for o in OBJ if o['type'] == 'figure' and o['who'] == 'across')
# Louis standing in the trees: a couple of metres back from the map's figure, among its trees, facing her.
FREEZE = (1.3, 11.6)
LOUIS_CLEARING = (13.6, -6.9)
LFIG = dict(LF_ORIG, x=LOUIS_CLEARING[0], z=LOUIS_CLEARING[1],
            rot=math.degrees(math.atan2(-(FREEZE[0] - LOUIS_CLEARING[0]), -(FREEZE[1] - LOUIS_CLEARING[1]))))
S.node('Louis', 'Node3D', W + '/Actors', transform=T((LFIG['x'], 0, LFIG['z']), rot_y(LFIG['rot'] + 180)), script=S.ext_res('Script', 'res://scripts/characters/actor.gd'),
       model_id='"louis"', start_animation='"crouch"', run_speed='2.2', visible='false')
S.node('Steam', 'CPUParticles3D', W + '/Actors/Louis', transform=T((0, 0.9, 0)), emitting='false', amount='24', lifetime='1.4',
       emission_shape='1', emission_sphere_radius='0.25', direction=V3(0, 1, 0), spread='18.0', initial_velocity_min='0.3', initial_velocity_max='0.7',
       gravity=V3(0, 0.4, 0), scale_amount_min='0.6', scale_amount_max='1.3', color=C(0.85, 0.85, 0.82, 0.35),
       mesh=S.sub_res('QuadMesh', size='Vector2(0.16, 0.16)', material=S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0',
                      billboard_mode='3', billboard_keep_scale='true', vertex_color_use_as_albedo='true', albedo_color=C(1, 1, 1, 0.5))))
# a light that picks him out in the headlights (the note: "recognizable as human, crawling")
S.node('LouisKey', 'SpotLight3D', W + '/Actors', transform=T((LFIG['x'] - 3.4, 2.6, LFIG['z'] + 4.2), look_at_rows((LFIG['x'] - 3.4, 2.6, LFIG['z'] + 4.2), (LFIG['x'], 0.5, LFIG['z']))),
       light_color=C(1, 0.94, 0.8), light_energy='3.0', spot_range='9', spot_angle='20', visible='false')

# ------------------------------------------------------------------ the twenty cameras and their trigger zones (zone edits: see ZONE_EDIT)
CAMS = {o['name']: o for o in OBJ if o['type'] == 'camera'}
CAMS['CAM_09']['yaw'] = 180; CAMS['CAM_09']['pitch'] = -24
# The freeze (where Norah sees Louis, and where the chase starts) moved back down the walk toward the car, so the
# sprint to the front door is ~15 m instead of ~8 m. The three freeze cameras and Louis's landing spot move with
# it: carried over to the new spot and turned so they still face him the same way.
FREEZE_OLD = (2.43, 3.17)
def _yaw_to(fr, to): return math.degrees(math.atan2(-(to[0] - fr[0]), -(to[1] - fr[1])))
FREEZE_DYAW = _yaw_to(FREEZE, (LFIG['x'], LFIG['z'])) - _yaw_to(FREEZE_OLD, (LF_ORIG['x'], LF_ORIG['z']))
def freeze_carry(x, z):
    """A point near the old freeze spot -> the same place relative to the new one (Godot rot_y convention)."""
    t = math.radians(FREEZE_DYAW); dx, dz = x - FREEZE_OLD[0], z - FREEZE_OLD[1]
    return (FREEZE[0] + dx * math.cos(t) + dz * math.sin(t), FREEZE[1] - dx * math.sin(t) + dz * math.cos(t))
for _nm in ('CAM_03', 'CAM_04', 'CAM_05'):
    _c = CAMS[_nm]; _c['x'], _c['z'] = freeze_carry(_c['x'], _c['z']); _c['yaw'] = _c['yaw'] + FREEZE_DYAW
JUMP_LAND = freeze_carry(4.3, 4.9)
CAMS['CAM_15'].update(x=29.3, y=2.05, z=-3.72, yaw=35, pitch=-32, fov=72, trackMax=130)      # Louis's bathroom: up in the corner, tracking her round the room            # it faced the bathroom's north wall from half a metre away
ZONE_EDIT = {      # boundaries widened so every walkable spot has a camera (no cameras added)
    'CAM_02': [(-2.4, 8.38, 1.86, 9.17)],
    'CAM_06': [(-2.4, 6.79, -7.02, 1.86)],
    'CAM_07': [(-8.0, -1.95, -4.0, 6.6)],
    'CAM_10': [(-12.5, -8.0, 0.0, 2.0)],
    'CAM_11': [(-16.5, -12.5, -3.0, 2.5)],
    'CAM_09': [(-11.5, -9.0, -4.0, 0.0)],
    'CAM_08': [(-12.5, -8.5, 2.0, 7.0)],
    'CAM_12': [(6.79, 15.12, -9.0, 9.17), (27.6, 36.0, -3.4, 10.0)],
    'CAM_13': [(15.12, 27.6, -14.0, 10.0)],
    'CAM_14': [(24.0, 33.0, -12.0, -7.5)],
    'CAM_15': [(27.0, 29.5, -7.5, -3.5)],
    'CAM_16': [(29.5, 33.0, -7.5, -3.5)],
    'CAM_19': [(70.0, 72.51, -4.75, -2.0)],
    'CAM_20': [(66.5, 70.0, -7.0, -4.5)],
}
INDOOR = {'CAM_07', 'CAM_08', 'CAM_09', 'CAM_10', 'CAM_11'}
DARK = {'CAM_14', 'CAM_15', 'CAM_16', 'CAM_17', 'CAM_18', 'CAM_19', 'CAM_20'}
TRACK = S.ext_res('Script', 'res://scripts/cameras/tracking_camera.gd')
ZONE = S.ext_res('Script', 'res://scripts/cameras/camera_zone.gd')
zones_out = {}
for nm, c in sorted(CAMS.items()):
    env = 'env_norah_house' if nm in INDOOR else ('env_interior_dark' if nm in DARK else 'env_norah_yard')
    rows = mul(rot_y(c['yaw']), rot_x(c['pitch']))
    props = dict(transform=T((c['x'], c['y'], c['z']), rows), fov=f(float(c['fov'])), near='0.05', far='150.0',
                 environment=S.ext_res('Environment', 'res://environments/%s.tres' % env))
    if c['mode'] in ('tracking', 'follow', 'rail'):
        props.update(script=TRACK, base_yaw=f(float(c['yaw'])), base_pitch=f(float(c['pitch'])), track_max=f(float(c.get('trackMax') or 60)))
    S.node(nm, 'Camera3D', W + '/Cams', **props)
    rects = ZONE_EDIT.get(nm)
    if rects is None and c.get('zone'):
        z = c['zone']; rects = [(z['x'], z['x'] + z['w'], z['z'], z['z'] + z['d'])]
    if not rects: continue
    area = min((r[1] - r[0]) * (r[3] - r[2]) for r in rects)
    S.node('Z' + nm, 'Area3D', W + '/Zones', script=ZONE, collision_layer='0', collision_mask='2', camera='NodePath("../../Cams/%s")' % nm,
           camera_priority=str(int(10000 / (area + 1))))
    for k, (x0, x1, z0, z1) in enumerate(rects):
        S.node('Shape%d' % k, 'CollisionShape3D', W + '/Zones/Z' + nm, transform=T(((x0 + x1) / 2, 1.5, (z0 + z1) / 2)), shape=boxshape((x1 - x0, 3.0, z1 - z0)))
    zones_out[nm] = rects

tr = math.radians(TRK_O['rot'] % 360)
S.node('CAM_Crane', 'Camera3D', W + '/Cams', transform=T((0, 8, 6)), fov='52', near='0.05', far='150.0', script=TRACK, base_yaw='0', base_pitch='-45', track_max='180',
       crane=V3(0.0, 7.0, 5.8), environment=S.ext_res('Environment', 'res://environments/env_norah_yard.tres'))

# ------------------------------------------------------------------ interaction points
TALK = S.ext_res('Script', 'res://scripts/interactions/interactable.gd')
def point(name, pos, prompt, radius=1.0, enabled=False):
    S.node(name, 'Marker3D', W + '/Points', transform=T(pos), script=TALK, prompt='"%s"' % prompt, radius=f(float(radius)), enabled='true' if enabled else 'false', glow='true')
def near_prop(nm, dist, h=0.8):
    """A point `dist` metres in front of a named prop (front = the side its designer front marker faces, local -z)."""
    x, z, r_ = PROP_POS[nm]; a = math.radians(r_)
    return (x - math.sin(a) * dist, h, z - math.cos(a) * dist)
def back_prop(nm, dist, h=0.8):
    x, z, r_ = PROP_POS[nm]; a = math.radians(r_)
    return (x + math.sin(a) * dist, h, z + math.cos(a) * dist)
# Norah's house
point('Bookshelf', (-2.75, 0.9, 0.15), 'Push the bookshelf to the door', 1.1)
point('Lockbox', (-13.65, 0.3, -1.6), 'Search under the bed', 1.0)
point('Wardrobe', (-15.55, 0.9, 0.35), 'Push the wardrobe over the window', 1.1)
point('WardrobeSearch', (-15.4, 0.9, -1.3), 'Search the wardrobe', 1.2)
point('NorahDresser', (-14.57, 0.8, 1.8), 'Search the dresser', 1.0)
point('AddieWardrobe', (-11.3, 0.9, 3.4), 'Search the wardrobe', 1.0)
point('AddieDresser', (-10.71, 0.8, 6.1), 'Search the dresser', 1.0)
point('AddieBed', (-11.0, 0.6, 5.6), "Look at Addie's bed", 1.0, True)
point('CounterFlash', (-3.94, 0.9, 5.45), 'Search the counter', 0.9)
point('CounterBatt', (-5.75, 0.9, 5.45), 'Search the drawer', 0.9)
point('Fridge', (-3.05, 1.1, 5.35), 'Look at the fridge', 0.8, True)
point('JournalPt', (-4.45, 0.8, 3.0), 'Read the journal', 0.9, True)
point('PhotoBirthday', (-8.9, 1.5, 0.5), 'Look at the photo', 0.8, True)
point('PhotoSchool', (-11.7, 1.4, 0.5), 'Look at the photo', 0.8, True)
point('PhotoLake', (-7.5, 1.5, -2.2), 'Look at the photo', 0.8, True)
point('PhotoBaby', (-14.5, 1.5, 2.0), 'Look at the photo', 0.8, True)
point('CalendarPt', (-6.0, 1.2, 6.0), 'Look at the calendar', 0.8, True)
point('Landline', (-7.0, 1.2, 4.6), 'Use the phone', 0.9)
point('TVPt', (-6.95, 0.8, -3.0), 'Look at the TV', 1.0, True)
point('FrontDoorExit', (-2.6, 1.0, -1.0), 'Move the bookshelf and go out', 1.0)
# outside
point('CarDoor', (CAR_O['x'] - 1.35 * math.cos(math.radians(CAR_O['rot'])), 0.9, CAR_O['z'] + 1.35 * math.sin(math.radians(CAR_O['rot']))), 'Look at the car', 2.4)
point('Grave', (24.6, 0.6, -7.0), 'Look at the cross', 1.0)
point('Well', (27.0, 0.8, -13.0), 'Look at the well', 1.2)
tr = math.radians(TRK_O['rot'] % 360)
point('TruckDoor', (TRK_O['x'] - 1.45 * math.cos(tr), 0.9, TRK_O['z'] + 1.45 * math.sin(tr)), 'Try the truck', 2.4)
# Louis's house (the main floor and the upstairs block)
point('LDesk', (31.9, 0.9, -10.03), 'Search the desk', 1.0)
point('LWardrobe', (25.3, 0.9, -11.0), 'Search the wardrobe', 1.0)
point('LToilet', (28.6, 0.6, -5.05), 'Search behind the toilet', 1.0)
point('RosePhotoPt', (27.5, 1.4, -11.5), 'Look at the photo', 0.9)
point('StormPhotoPt', (24.5, 1.4, -9.0), 'Look at the photo', 0.9)
point('UFridge', (71.66, 1.0, -6.0), 'Search the fridge', 1.0)
point('USafe', (73.55, 0.6, -6.5), 'Try the safe', 1.0)
point('UBed', (68.1, 0.6, -5.5), 'Look at the bed', 1.1)
point('UWindow', (68.75, 1.0, -5.0), 'Look at the window', 1.0)

# ------------------------------------------------------------------ layout data for the director
NAV = {    # Norah's house: rooms and doorways (Louis finds his way through these during the fight)
    'bed': (-14.3, -0.9), 'bed_door_in': (-13.0, 1.0), 'bed_door_out': (-12.0, 1.0), 'hall_w': (-11.4, 1.0), 'hall_m': (-10.0, 1.0),
    'bath_out': (-10.0, 0.55), 'bath_in': (-10.0, -0.6), 'bath': (-10.2, -2.0), 'addie_out': (-9.5, 1.45), 'addie_in': (-9.5, 2.65), 'addie': (-10.4, 4.4),
    'hall_e': (-8.4, 1.0), 'living_w': (-7.1, 0.6), 'living': (-5.0, -1.0), 'living_n': (-5.0, -3.0), 'door_in': (-2.8, -1.0), 'kitchen': (-5.0, 4.2)}
EDGES = [('bed', 'bed_door_in'), ('bed_door_in', 'bed_door_out'), ('bed_door_out', 'hall_w'), ('hall_w', 'hall_m'), ('hall_m', 'bath_out'), ('bath_out', 'bath_in'),
         ('bath_in', 'bath'), ('hall_m', 'addie_out'), ('addie_out', 'addie_in'), ('addie_in', 'addie'), ('hall_m', 'hall_e'), ('hall_e', 'living_w'),
         ('living_w', 'living'), ('living', 'door_in'), ('living', 'kitchen'), ('living_w', 'kitchen'), ('living', 'living_n')]
def sample(pts, step=1.5):
    return [[round(x, 3), round(z, 3)] for x, z in catmull(pts, step)]
ARRIVE = [(13.2, 300.0), (13.0, 275.0), (11.6, 248.0), (9.0, 218.0), (13.0, 190.0), (16.0, 160.0), (11.8, 132.0), (8.6, 104.0), (11.0, 78.0), (10.6, 63.0),
          (7.6, 58.6), (4.2, 51.0), (1.2, 46.0), (0.2, 40.0), (0.5, 32.0), (0.9, 25.0), (1.1, 20.0), (CAR_O['x'], CAR_O['z'])]
DEPART = [(TRK_O['x'], TRK_O['z']), (25.2, 4.2), (22.4, 7.4), (21.0, 13.0), (20.0, 20.0), (19.2, 28.0), (18.6, 36.0), (18.4, 42.0), (17.6, 48.0), (16.2, 51.4),
          (14.6, 56.0), (12.0, 61.5), (11.0, 78.0), (8.6, 104.0), (11.8, 132.0), (16.0, 160.0), (13.0, 190.0), (9.0, 218.0), (11.6, 248.0), (13.0, 275.0), (13.2, 300.0)]
layout = {
    'bounds': [[-16.6, -1.9, -4.1, 7.1], [-2.4, 8.4, -7.0, 26.2], [6.8, 15.12, -9.0, 9.17], [15.12, 27.6, -9.0, 10.0], [23.9, 33.1, -12.1, -3.4],
               [27.6, 34.5, -3.4, 8.0], [69.9, 74.6, -7.1, -1.9], [66.4, 70.1, -7.1, -4.4]],
    'nav': NAV, 'edges': EDGES, 'arrive': sample(ARRIVE), 'depart': sample(DEPART), 'zones': zones_out,
    'louis_fig': [LFIG['x'], LFIG['z'], LFIG['rot']], 'car': [CAR_O['x'], CAR_O['z'], CAR_O['rot']], 'truck': [TRK_O['x'], TRK_O['z'], TRK_O['rot'] % 360],
    'freeze': [round(FREEZE[0], 3), round(FREEZE[1], 3)], 'jump_land': [round(JUMP_LAND[0], 3), round(JUMP_LAND[1], 3)], 'levels': LEV, 'rooms': {'norah': NORAH_ROOMS, 'louis': LOUIS_ROOMS, 'up': UP_ROOMS},
    'front_door': {'hinge': FRONT_DOOR_WALL[0], 'dir': FRONT_DOOR_WALL[1], 'swing': FRONT_DOOR_WALL[2], 'width': FRONT_DOOR_WALL[3]},
}
json.dump(layout, open(os.path.join(ROOT, 'data', 'ch1_layout.json'), 'w'), indent=1)

post = S.sub_res('ShaderMaterial', shader=S.ext_res('Shader', 'res://shaders/ps1_post.gdshader'))
S.node('PostFX', 'CanvasLayer', W, layer='10')
S.node('Rect', 'ColorRect', W + '/PostFX', material=post, anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', mouse_filter='2')
S.node('Audio', 'Node', script=S.ext_res('Script', 'res://scripts/systems/audio_director.gd'))
S.write(os.path.join(ROOT, 'scenes', 'chapter1', 'chapter1.tscn'))
print('chapter1.tscn: %d nodes, %d sub-resources' % (len(S.nodes), len(S.sub)))

import subprocess as _sp
_sp.run(['python3', os.path.join(ROOT, 'tools', 'retexture_v11.py')], check=True)
