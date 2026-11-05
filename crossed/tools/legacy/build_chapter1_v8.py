#!/usr/bin/env python3
"""SUPERSEDED in v9 by tools/build_ch1_map.py (the chapter is now built from the Map Designer file). Kept for reference; do not run (it would overwrite chapter1.tscn)."""
"""Generates scenes/chapter1/chapter1.tscn: the Chapter One playtest, separate from the prologue.

Contents (1 unit = 1 m, north = -Z):
  - Norah's house and yard (instance of scenes/environments/norah_house.tscn, built by build_norah_house.py)
  - the highway for the drive and the flash, far south at Z = +400
  - the winding dirt road into the cul-de-sac, west of the yard
  - Norah's car (moved by the director), with Norah seated inside for the in-car shots
  - Louis (ACROSS), camera zones for the yard and every room, interaction points
Run:  python3 tools/build_chapter1.py   (after build_norah_house.py)
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tscn import Scene, T, V3, V2, C, f, look_at_rows, yaw
from house_kit import Kit, rot_x, rot_z, mul

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = Scene()
M = lambda n: S.ext_res('Material', 'res://materials/%s.tres' % n)
K = Kit(S, {}, 'c1')
for nm in ('refuge_sign_a', 'refuge_sign_b', 'refuge_sign_junction'): K.mat(nm, nm + '.png', world=False, affine=0.1)
K.mat('glow_city', albedo=(0.35, 0.12, 0.04), emis=0.3); K.mat('tail', albedo=(0.6, 0.04, 0.03), emis=0.7)
K.mat('post', 'wood.png', (1, 1), (0.42, 0.34, 0.26)); K.mat('bank', 'grass.png', (0.4, 0.4), (0.32, 0.34, 0.26))
K.mat('win_lit', albedo=(1.0, 0.82, 0.5), emis=1.2); K.mat('win_dark', albedo=(0.06, 0.07, 0.09))
for nm, col in (('siding_a', (0.62, 0.6, 0.55)), ('siding_b', (0.5, 0.55, 0.62)), ('siding_c', (0.66, 0.58, 0.46)), ('siding_d', (0.45, 0.5, 0.44))):
    K.mat(nm, 'wood.png', (0.6, 1.6), col, affine=0.2)
S.node('Chapter1', 'Node', parent=None, script=S.ext_res('Script', 'res://scripts/cutscenes/chapter1_director.gd'))
S.node('Screen', 'SubViewportContainer', anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', stretch='true', stretch_shrink='3', texture_filter='1')
S.node('World', 'SubViewport', 'Screen', handle_input_locally='false', audio_listener_enable_3d='true', size='Vector2i(320, 240)', render_target_update_mode='4')
W = 'Screen/World'
S.node('House', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/environments/norah_house.tscn'))
S.node('LouisHouse', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/environments/louis_house.tscn'))
S.node('Player', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/characters/player.tscn'), transform=T((-18.6, 0, -3.6), yaw(-90)))
S.node('Visual', None, W + '/Player', model_id='"norah"', editor_description='"Norah (assets/characters/norah.glb)."')
S.node('KeyLight', None, W + '/Player', light_energy='0.35')
for g in ['Highway', 'Road', 'Cams', 'Zones', 'Actors', 'Props', 'Points']:
    S.node(g, 'Node3D', W)

_n = [0]
def box(parent, c, size, m, rot=None, col=False, name=None):
    _n[0] += 1
    props = dict(transform=T(c, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))), size=V3(*size), material=M(m))
    if col: props['use_collision'] = 'true'
    return S.node(name or 'B%d' % _n[0], 'CSGBox3D', parent, **props)
def cam(name, eye, target, fov, env='env_norah_yard', parent=W + '/Cams'):
    S.node(name, 'Camera3D', parent, transform=T(eye, look_at_rows(eye, target)), fov=f(float(fov)), near='0.05', far='160.0',
           environment=S.ext_res('Environment', 'res://environments/%s.tres' % env))
rng = random.Random(11)

# ------------------------------------------------------------------ the highway (Z = +400), driven east
HZ = 400.0
box(W + '/Highway', (0, -0.1, HZ), (700, 0.2, 60), 'nh_grass')
box(W + '/Highway', (0, 0.0, HZ), (700, 0.04, 7.0), 'asphalt')
for x in range(-340, 341, 12): box(W + '/Highway', (x, 0.025, HZ), (5, 0.02, 0.15), 'nh_bulb')              # centre dashes, faintly reflective
for side in (-1, 1):
    for i in range(170):
        x = -340 + i * 4.0 + rng.uniform(-1.5, 1.5); z = HZ + side * rng.uniform(6.0, 20.0); h = rng.uniform(7, 12)
        if side < 0 and abs(x - 40) < 6: continue
        bare = rng.random() < 0.55
        box(W + '/Highway', (x, h * 0.32, z), (0.35, h * 0.64, 0.35), 'nh_bark')
        box(W + '/Highway', (x, h * 0.72, z), (2.4 if bare else 3.2, h * 0.55, 2.4 if bare else 3.2), 'nh_bark' if bare else 'nh_leaves' if rng.random() < 0.6 else 'nh_tree')
cam('H3_Roadside', (36.0, 0.45, HZ + 5.0), (16.0, 0.9, HZ - 0.6), 46)
# the road out (Part 8): hand-painted refuge signs on the right shoulder (driving west), the dirt road south into a ravine
def refuge_sign(x, z, tex, w=1.5, h=1.03, post_h=1.2, lean=0.0, name=None):
    g = W + '/Highway/' + (name or 'Sign%d' % int(x))
    S.node(name or 'Sign%d' % int(x), 'Node3D', W + '/Highway', transform=T((x, 0, z), mul(yaw(90), rot_z(lean))))
    for px in (-w * 0.35, w * 0.35): box(g, (px, post_h / 2 + 0.2, -0.04), (0.09, post_h + 0.4, 0.09), 'c1_post')
    box(g, (0, post_h + h / 2, -0.02), (w + 0.04, h + 0.04, 0.03), 'c1_post')
    K.quad(g, (0, post_h + h / 2, 0.0), w, h, '+z', tex)
for x, tex, lean in ((150, 'refuge_sign_a', 2), (124, 'refuge_sign_b', -3), (100, 'refuge_sign_a', 4), (78, 'refuge_sign_b', -2), (62, 'refuge_sign_a', 1)):
    refuge_sign(x, HZ - 4.6, tex, lean=lean)
refuge_sign(46, HZ - 4.4, 'refuge_sign_junction', w=2.2, h=1.1, post_h=1.0, lean=-2, name='SignJunction')
refuge_sign(36.2, HZ - 6.5, 'refuge_sign_b', w=1.2, h=0.82, post_h=0.9, lean=6, name='SignMouth')
box(W + '/Highway', (0, -0.1, HZ - 60), (700, 0.2, 60), 'nh_grass')
DIRT = [(40, HZ - 3.4), (40.5, HZ - 14), (39, HZ - 26), (36, HZ - 40), (34, HZ - 58), (35, HZ - 80)]
for (x0, z0), (x1, z1) in zip(DIRT, DIRT[1:]):
    dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz); a = math.degrees(math.atan2(dx, dz))
    box(W + '/Highway', ((x0 + x1) / 2, -0.02, (z0 + z1) / 2), (3.6, 0.04, L + 2), 'nh_dirt', rot=yaw(a))
    for side in (-1, 1):   # the ravine: banks rising either side, trees crowding the tops
        nx, nz = math.cos(math.radians(a)) * side, -math.sin(math.radians(a)) * side
        cx, cz = (x0 + x1) / 2 + nx * 5.5, (z0 + z1) / 2 + nz * 5.5
        if z0 > HZ - 8: continue
        box(W + '/Highway', (cx, 1.2, cz), (6.0, 0.4, L + 2.5), 'c1_bank', rot=mul(yaw(a), rot_z(-side * 28)))
        for k in range(3):
            t = (k + rng.random()) / 3; tx, tz = x0 + dx * t + nx * rng.uniform(4.5, 9), z0 + dz * t + nz * rng.uniform(4.5, 9); h = rng.uniform(8, 12)
            box(W + '/Highway', (tx, 2.6 + h * 0.3, tz), (0.35, h * 0.6, 0.35), 'nh_bark')
            box(W + '/Highway', (tx, 2.6 + h * 0.72, tz), (3.0, h * 0.55, 3.0), 'nh_tree' if rng.random() < 0.6 else 'nh_bark')
S.node('CityGlow', 'Node3D', W + '/Highway', visible='false')   # Kennedy, burning, beyond the trees (shown only on the road out)
for k in range(9): box(W + '/Highway/CityGlow', (-62, 6 + k * 0.5, HZ - 32 + k * 8), (2, 12 + rng.uniform(-3, 4), 8.2), 'c1_glow_city')
S.node('Light', 'OmniLight3D', W + '/Highway/CityGlow', transform=T((-50, 16, HZ)), light_color=C(1, 0.45, 0.15), light_energy='1.2', omni_range='60')
cam('R2_Sign', (104.2, 1.2, HZ - 1.2), (100.0, 1.6, HZ - 4.6), 56)
cam('R3_Junction', (54.0, 5.0, HZ + 5.5), (30.0, 0.6, HZ - 2.0), 56)
cam('R4_Ravine', (39.0, 0.9, HZ - 32.0), (40.2, 1.0, HZ - 3.0), 50)
cam('R5_Taillights', (41.5, 2.4, HZ + 1.5), (37.0, 0.4, HZ - 45.0), 46)

# ------------------------------------------------------------------ the road into the cul-de-sac (west of the yard): one smooth curve
import json
RC = [(-205, -58), (-170, -53), (-135, -45), (-100, -35), (-70, -25), (-46, -15), (-31, -8), (-21.4, -5)]   # gentle, few bends
def catmull(pts, step=1.5):
    P = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        n = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    out.append(pts[-1]); return out
ROADP = catmull(RC)
os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
json.dump([[round(x, 3), round(z, 3)] for x, z in ROADP], open(os.path.join(ROOT, 'data', 'ch1_road.json'), 'w'))   # the director drives the same curve
for (x0, z0), (x1, z1) in zip(ROADP, ROADP[1:]):
    dx, dz = x1 - x0, z1 - z0; L = math.hypot(dx, dz); a = math.degrees(math.atan2(dx, dz))
    box(W + '/Road', ((x0 + x1) / 2, -0.03, (z0 + z1) / 2), (5.0, 0.04, L + 0.9), 'nh_dirt', rot=yaw(a))
box(W + '/Road', (-110, -0.3, -40), (220, 0.4, 130), 'nh_grass')
def road_dist(x, z):
    best = 1e9
    for (x0, z0), (x1, z1) in zip(ROADP, ROADP[1:]):
        dx, dz = x1 - x0, z1 - z0; L2 = dx * dx + dz * dz or 1e-9
        t = max(0.0, min(1.0, ((x - x0) * dx + (z - z0) * dz) / L2)); best = min(best, math.hypot(x - (x0 + t * dx), z - (z0 + t * dz)))
    return best
def road_at(frac):
    i = min(len(ROADP) - 2, int(frac * (len(ROADP) - 1))); (x0, z0), (x1, z1) = ROADP[i], ROADP[i + 1]
    L = math.hypot(x1 - x0, z1 - z0) or 1; return (x0, z0), ((x1 - x0) / L, (z1 - z0) / L)
def mailbox(parent, x, z, face):
    g = parent + '/MB%d_%d' % (int(x * 10), int(z * 10)); S.node(g.rsplit('/', 1)[1], 'Node3D', parent, transform=T((x, 0, z), yaw(face)))
    box(g, (0, 0.55, 0), (0.08, 1.1, 0.08), 'nh_wood_dark', col=True)
    box(g, (0, 1.2, 0), (0.24, 0.2, 0.42), 'nh_metal'); box(g, (0, 1.3, 0), (0.24, 0.06, 0.42), 'nh_metal')
    box(g, (0.13, 1.28, -0.12), (0.02, 0.16, 0.04), 'c1_tail')            # the little red flag
def neighbour(i, x, z, lit, siding):
    (px, pz), _ = min(((p, None) for p in ROADP), key=lambda q: math.hypot(q[0][0] - x, q[0][1] - z)); face = math.degrees(math.atan2(px - x, pz - z))
    g = W + '/Road/House%d' % i; S.node('House%d' % i, 'Node3D', W + '/Road', transform=T((x, 0, z), yaw(face)))
    box(g, (0, 1.4, 0), (7.0, 2.8, 6.0), siding, col=True)
    for sd in (-1, 1): box(g, (sd * 1.85, 3.45, 0), (4.1, 0.12, 6.8), 'nh_roof', rot=rot_z(-sd * 28))
    for k, (w_, y_) in enumerate(((6.6, 3.0), (4.6, 3.6), (2.6, 4.2))): box(g, (0, y_, 0), (w_, 0.6, 5.9), siding)
    box(g, (0, 0.06, 3.6), (3.2, 0.12, 1.4), 'nh_porch'); box(g, (0, 2.3, 3.7), (3.4, 0.08, 1.6), 'nh_roof')
    for sx in (-1.5, 1.5): box(g, (sx, 1.15, 4.3), (0.1, 2.3, 0.1), 'nh_trim')
    box(g, (0.0, 1.0, 3.02), (0.9, 2.0, 0.06), 'nh_wood_dark')
    for k, wx in enumerate((-2.3, 2.0)):
        on = lit and (k == 0 or i % 2 == 0)
        box(g, (wx, 1.45, 3.02), (1.1, 0.9, 0.05), 'c1_win_lit' if on else 'c1_win_dark'); box(g, (wx, 1.45, 3.05), (1.25, 1.05, 0.02), 'nh_trim')
    box(g, (2.2, 3.6, -1.2), (0.5, 1.6, 0.5), 'nh_stain')
    if lit: S.node('Lit%d' % i, 'OmniLight3D', g, transform=T((-2.3, 1.5, 4.2)), light_color=C(1, 0.8, 0.5), light_energy='0.8', omni_range='7')
    S.node('PorchL%d' % i, 'OmniLight3D', g, transform=T((0.9, 2.0, 3.9)), light_color=C(1, 0.82, 0.55), light_energy='0.5' if lit else '0.0', omni_range='5')
    # a dirt drive from the porch to the road, and the mailbox at its end
    d = math.hypot(px - x, pz - z); ux, uz = (px - x) / d, (pz - z) / d
    box(W + '/Road', ((x + px) / 2, -0.025, (z + pz) / 2), (2.4, 0.03, d - 2.0), 'nh_dirt', rot=yaw(face))
    mailbox(W + '/Road', px - ux * 3.4 + uz * 1.6, pz - uz * 3.4 - ux * 1.6, face + 180)
HOUSES = []
for i, (frac, side, off, lit) in enumerate([(0.08, 1, 20, 1), (0.22, -1, 24, 1), (0.37, 1, 22, 0), (0.52, -1, 19, 1), (0.66, 1, 23, 1), (0.8, -1, 18, 1)]):
    (rx, rz), (tx, tz) = road_at(frac); x, z = rx - tz * side * off, rz + tx * side * off
    HOUSES.append((x, z)); neighbour(i, x, z, lit, 'c1_siding_' + 'abcd'[i % 4])
(rx, rz), (tx, tz) = road_at(0.93)
for k in range(3): mailbox(W + '/Road', rx - tz * 3.2 + tx * k * 0.5, rz + tx * 3.2 + tz * k * 0.5, math.degrees(math.atan2(tz, -tx)))   # the cluster at the cul-de-sac mouth
for i in range(260):                       # trees: kept, but never on the road or in a yard
    x = rng.uniform(-215, -26); z = rng.uniform(-110, 15)
    if road_dist(x, z) < 7.5 or any(math.hypot(x - hx, z - hz) < 9 for hx, hz in HOUSES): continue
    h = rng.uniform(7, 11); box(W + '/Road', (x, h * 0.3, z), (0.35, h * 0.6, 0.35), 'nh_bark'); box(W + '/Road', (x, h * 0.72, z), (2.6, h * 0.55, 2.6), 'nh_tree')

# ------------------------------------------------------------------ Norah's car (moved by the director); forward = -Z. An old sedan, built from many small parts.
K.mat('chrome', albedo=(0.72, 0.72, 0.7), emis=0.05); K.mat('seat', 'cloth_mint.png', (3, 3), (0.32, 0.28, 0.26)); K.mat('plate', albedo=(0.85, 0.82, 0.6))
K.mat('rubber', albedo=(0.06, 0.06, 0.06)); K.mat('carpet_car', albedo=(0.12, 0.11, 0.11))
CAR = W + '/DriveCar'
S.node('DriveCar', 'Node3D', W, transform=T((-180, 0, HZ - 1.6), yaw(-90)))
GLASS = S.sub_res('StandardMaterial3D', transparency='1', albedo_color=C(0.12, 0.15, 0.2, 0.32), roughness='0.15', metallic_specular='0.8')
def cb(c, size, m, rot=None, col=False, name=None): return box(CAR, c, size, m, rot=rot, col=col, name=name)
def glass(c, size, rot=None, name=None):
    _n[0] += 1; S.node(name or 'G%d' % _n[0], 'MeshInstance3D', CAR, transform=T(c, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
                       mesh=S.sub_res('BoxMesh', size=V3(*size)), material_override=GLASS)
def ccyl(c, r, h, m, rot=None, sides=10, name=None):
    _n[0] += 1; S.node(name or 'Y%d' % _n[0], 'CSGCylinder3D', CAR, transform=T(c, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))), radius=f(float(r)), height=f(float(h)), sides=str(sides), material=M(m))
P = 'nh_car_maroon'
cb((0, 0.5, 0), (1.76, 0.42, 4.4), P, col=True)                                         # lower body
cb((0, 0.5, -2.21), (1.62, 0.36, 0.06), P); cb((0, 0.5, 2.21), (1.62, 0.36, 0.06), P)    # rounded-off nose and tail
for x in (-0.86, 0.86): cb((x, 0.5, 0), (0.06, 0.36, 4.28), P)
cb((0, 0.77, -1.6), (1.66, 0.06, 1.25), P, rot=rot_x(-4))                               # hood, sloping to the nose
cb((0, 0.79, -1.6), (0.06, 0.02, 1.1), 'c1_chrome', rot=rot_x(-4))                      # hood ornament strip
cb((0, 0.79, 1.72), (1.66, 0.06, 0.95), P)                                              # trunk lid
for x in (-0.85, 0.85): cb((x, 0.78, 0.17), (0.06, 0.14, 2.3), P)                       # door tops (the cabin is open inside)
cb((0, 0.78, -0.96), (1.66, 0.12, 0.1), P); cb((0, 0.8, 1.27), (1.66, 0.1, 0.1), P)     # cowl, rear deck lip
cb((0, 1.5, 0.24), (1.44, 0.06, 1.1), P)                                                # roof
glass((0, 1.135, -0.625), (1.48, 0.93, 0.02), rot=rot_x(44), name='Windshield')
glass((0, 1.145, 1.04), (1.44, 0.83, 0.02), rot=rot_x(-38.6), name='RearWindow')
for x in (-0.76, 0.76):
    glass((x, 1.14, 0.24), (0.02, 0.56, 1.06))                                          # side windows
    cb((x, 1.135, -0.625), (0.06, 0.95, 0.07), P, rot=rot_x(44))                         # A-pillar
    cb((x, 1.15, 0.25), (0.06, 0.66, 0.08), P)                                           # B-pillar
    cb((x, 1.145, 1.04), (0.06, 0.85, 0.08), P, rot=rot_x(-38.6))                        # C-pillar
    for z in (-0.25, 0.75): cb((x * 1.162, 0.55, z), (0.005, 0.5, 0.01), 'nh_tire')      # door seams
    cb((x * 1.165, 0.68, 0.05), (0.02, 0.03, 0.12), 'c1_chrome')                         # door handle
    cb((x * 1.2, 0.98, -0.32), (0.12, 0.08, 0.06), P); cb((x * 1.22, 0.98, -0.29), (0.1, 0.06, 0.005), 'c1_chrome')   # mirror
    cb((x * 1.12, 0.32, 0), (0.04, 0.06, 4.2), 'c1_chrome')                              # rocker trim
for x in (-0.82, 0.82):
    for z in (-1.38, 1.38):
        cb((x, 0.55, z), (0.24, 0.36, 0.86), 'c1_rubber')                                # wheel arch shadow
        ccyl((x, 0.33, z), 0.33, 0.22, 'c1_rubber', rot=((0, -1, 0), (1, 0, 0), (0, 0, 1)), sides=12)
        ccyl((x * 1.1, 0.33, z), 0.17, 0.03, 'c1_chrome', rot=((0, -1, 0), (1, 0, 0), (0, 0, 1)), sides=10)   # hubcap
cb((0, 0.37, -2.27), (1.72, 0.14, 0.12), 'c1_chrome'); cb((0, 0.37, 2.27), (1.72, 0.14, 0.12), 'c1_chrome')   # bumpers
cb((0, 0.56, -2.245), (0.86, 0.16, 0.03), 'c1_rubber'); cb((0, 0.56, -2.255), (0.92, 0.2, 0.01), 'c1_chrome')  # grille
cb((-0.6, 0.58, -2.245), (0.3, 0.14, 0.04), 'nh_lamp', name='LampL'); cb((0.6, 0.58, -2.245), (0.3, 0.14, 0.04), 'nh_lamp', name='LampR')
cb((0, 0.46, 2.26), (0.36, 0.12, 0.02), 'c1_plate')                                     # licence plate
cb((-0.6, 0.62, 2.245), (0.3, 0.12, 0.03), 'c1_tail', name='TailL'); cb((0.6, 0.62, 2.245), (0.3, 0.12, 0.03), 'c1_tail', name='TailR')
ccyl((0.7, 1.1, 1.8), 0.006, 0.7, 'c1_chrome', sides=4)                                  # antenna
# interior: floor, seats with headrests, rear bench, dash and instrument hood, steering wheel, rear-view mirror
cb((0, 0.715, 0.2), (1.6, 0.01, 2.3), 'c1_carpet_car')
for x in (-0.38, 0.38):
    cb((x, 0.71, -0.05), (0.52, 0.08, 0.52), 'c1_seat'); cb((x, 1.02, 0.24), (0.52, 0.6, 0.1), 'c1_seat', rot=rot_x(-8))
    cb((x, 1.38, 0.29), (0.26, 0.16, 0.08), 'c1_seat')
cb((0, 0.74, 0.95), (1.5, 0.1, 0.5), 'c1_seat'); cb((0, 1.02, 1.18), (1.5, 0.52, 0.1), 'c1_seat', rot=rot_x(-10))
cb((0, 0.92, -0.78), (1.5, 0.16, 0.35), 'nh_tv'); cb((-0.38, 1.02, -0.72), (0.42, 0.06, 0.18), 'nh_tv')
ccyl((-0.38, 0.95, -0.66), 0.025, 0.3, 'nh_metal', rot=rot_x(60), sides=6)
S.node('Wheel', 'CSGTorus3D', CAR, transform=T((-0.38, 1.0, -0.52), rot_x(60)), inner_radius='0.14', outer_radius='0.175', sides='10', ring_sides='4', material=M('nh_metal'))
cb((0, 1.38, -0.42), (0.2, 0.06, 0.03), 'nh_tv')
S.node('Norah', 'Node3D', CAR, transform=T((-0.38, -0.02, 0.05)), script=S.ext_res('Script', 'res://scripts/characters/character_model.gd'),
       model_id='"norah"', start_animation='"sit_drive"', start_offset_random='false')
for nm, x in (('BeamL', -0.55), ('BeamR', 0.55)):
    S.node(nm, 'SpotLight3D', CAR, transform=T((x, 0.65, -2.2), look_at_rows((x, 0.65, -2.2), (x * 0.4, 0.0, -14.0))), light_color=C(1, 0.94, 0.78),
           light_energy='5.0', spot_range='30.0', spot_angle='24.0')
S.node('TailGlow', 'OmniLight3D', CAR, transform=T((0, 0.7, 2.6)), light_color=C(1, 0.1, 0.05), light_energy='0.6', omni_range='3.5')
S.node('DashGlow', 'OmniLight3D', CAR, transform=T((-0.25, 1.05, -0.62)), light_color=C(1.0, 0.78, 0.55), light_energy='0.55', omni_range='1.4')   # warm gauges: keeps her skin from going grey
cam('H2_Windshield', (0.14, 1.22, -0.72), (-0.38, 1.12, 0.12), 60, parent=CAR)
S.node('Flash', 'OmniLight3D', W, transform=T((0, 40, HZ)), light_color=C(1, 1, 1), light_energy='0.0', omni_range='160.0', omni_attenuation='0.3')

# ------------------------------------------------------------------ actors
S.node('Louis', 'Node3D', W + '/Actors', transform=T((9.5, 0, -14.5), yaw(-120)), script=S.ext_res('Script', 'res://scripts/characters/actor.gd'),
       model_id='"louis"', start_animation='"still"', run_speed='3.2', visible='false')
S.node('Steam', 'CPUParticles3D', W + '/Actors/Louis', transform=T((0, 0.9, 0)), emitting='false', amount='24', lifetime='1.4',
       emission_shape='1', emission_sphere_radius='0.25', direction=V3(0, 1, 0), spread='18.0', initial_velocity_min='0.3', initial_velocity_max='0.7',
       gravity=V3(0, 0.4, 0), scale_amount_min='0.6', scale_amount_max='1.3', color=C(0.85, 0.85, 0.82, 0.35),
       mesh=S.sub_res('QuadMesh', size='Vector2(0.16, 0.16)', material=S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0',
                      billboard_mode='3', billboard_keep_scale='true', vertex_color_use_as_albedo='true', albedo_color=C(1, 1, 1, 0.5))))

# ------------------------------------------------------------------ props added for the chapter
box(W + '/Props', (4.09, 1.35, -4.2), (0.06, 0.32, 0.22), 'nh_counter', name='WallPhone')
box(W + '/Props', (4.13, 1.42, -4.2), (0.05, 0.2, 0.06), 'nh_tv')
box(W + '/Props', (4.86, 1.2, -4.95), (0.01, 0.3, 0.24), 'nh_photo_c', name='Calendar')

# ------------------------------------------------------------------ camera zones (house rooms + the yard)
ZONE = S.ext_res('Script', 'res://scripts/cameras/camera_zone.gd')
def zone(name, cam_path, x0, x1, z0, z1, pri=0, y0=0.0, y1=3.0):
    shape = S.sub_res('BoxShape3D', size=V3(x1 - x0, y1 - y0, z1 - z0))
    S.node(name, 'Area3D', W + '/Zones', transform=T(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)), script=ZONE, collision_layer='0', collision_mask='2',
           camera='NodePath("%s")' % cam_path, camera_priority=str(pri))
    S.node('Shape', 'CollisionShape3D', W + '/Zones/' + name, shape=shape)
HC = '../../House/Cameras/'
zone('ZLiving', HC + 'I1_LivingCorner', 0.0, 4.0, -5.33, 0.0)
zone('ZKitchen', HC + 'I2_KitchenFridge', 4.0, 8.0, -5.33, -3.17)
zone('ZHallWest', HC + 'I3_HallEast', 4.0, 6.0, -3.17, -2.33, 1)
zone('ZHallEast', HC + 'I3b_HallWest', 6.0, 8.0, -3.17, -2.33, 1)
zone('ZBedroom', HC + 'I4_BedroomDoor', 5.83, 8.0, -2.33, 0.0)
zone('ZBath', HC + 'B1_BathCorner', 4.0, 5.83, -2.33, 0.0)
zone('ZYardFar', HC + 'A3_LouisNear', -26.0, -10.5, -9.0, 4.0)
zone('ZYardNear', HC + 'A4_PorchOut', -10.5, -0.9, -9.0, 4.0)
zone('ZPorch', HC + 'N2_Yard', -1.6, 0.0, -4.0, -1.2, 1)
LC = '../../LouisHouse/Cameras/'
zone('ZNorthSide', HC + 'N4_SideWall', -0.9, 9.5, -9.0, -5.42)
zone('ZSouthSide', '../../Cams/LY0_SouthSide', -0.2, 9.5, 0.1, 4.5)
zone('ZWalkOver', LC + 'LY1_WalkOver', -14.0, 9.5, 1.5, 18.5)
zone('ZLouisPorch', LC + 'LY2_LouisPorch', -8.5, -3.1, 9.6, 14.6, 1)
zone('ZLHLivingW', LC + 'LH1_LivingNE', -3.0, -0.9, 9.0, 14.05, 2, 0.0, 2.3)
zone('ZLHLivingE', LC + 'LH2_LivingSW', -0.9, 1.2, 9.0, 14.05, 2, 0.0, 2.3)
zone('ZLHKitchen', LC + 'LH3_Kitchen', 1.2, 4.0, 9.0, 12.2, 2, 0.0, 2.3)
zone('ZLHBedroom', LC + 'LH4_Bedroom', 1.2, 4.0, 12.2, 15.0, 2, 0.0, 2.3)
zone('ZLHStairs', LC + 'LH5_Stairs', -3.0, 1.2, 14.05, 15.0, 3, 0.0, 2.45)
zone('ZLHUpstairs', LC + 'LH6_Upstairs', -3.0, 4.0, 9.0, 15.0, 3, 2.55, 4.5)
cam('LY0_SouthSide', (9.2, 2.3, 5.2), (0.0, 0.8, 0.6), 56)
cam('Y1_CarSide', (-12.0, 2.8, -0.6), (-21.0, 0.6, -5.4), 54)
S.node('DriveMoon', 'OmniLight3D', W + '/Props', transform=T((-17.0, 6.0, -2.0)), light_color=C(0.45, 0.52, 0.75), light_energy='0.6', omni_range='14')
cam('C7_HeadlightFix', (-17.4, 1.35, -7.7), (-19.1, 0.55, -5.5), 52)

# ------------------------------------------------------------------ interaction points
TALK = S.ext_res('Script', 'res://scripts/interactions/interactable.gd')
def point(name, pos, prompt, radius=1.0, enabled=True):
    S.node(name, 'Marker3D', W + '/Points', transform=T(pos), script=TALK, prompt='"%s"' % prompt, radius=f(float(radius)), enabled='true' if enabled else 'false')
point('Lockbox', (6.75, 0.3, -1.2), 'Search under the bed', 1.0, False)
point('Couch', (1.55, 0.6, -4.0), 'Push the couch to the door', 1.1, False)
point('Bookshelf', (7.6, 0.8, -4.6), 'Push the bookshelf to the back door', 1.0, False)
point('Wardrobe', (7.4, 0.8, -2.0), 'Push the wardrobe to the window', 0.9, False)
point('Landline', (4.35, 1.2, -4.2), 'Use the phone', 1.0, False)
point('HallDrawer', (7.5, 0.6, -2.9), 'Search the hall table', 0.9, False)
point('JunkDrawer', (6.4, 0.7, -4.6), 'Search the junk drawer', 0.9, False)
point('WardrobeShelf', (7.4, 0.9, -2.0), 'Search the wardrobe shelf', 0.9, False)
point('Journal', (6.3, 0.7, -0.3), 'Read the journal', 0.8)
point('PhotoSchool', (5.9, 1.4, -2.95), 'Look at the photo', 0.7)
point('PhotoLake', (6.5, 1.3, -2.95), 'Look at the photo', 0.7)
point('PhotoBirthday', (7.1, 1.5, -2.95), 'Look at the photo', 0.7)
point('PhotoBaby', (0.3, 1.5, -1.75), 'Look at the photo', 0.7)
point('Fridge', (4.85, 1.1, -4.4), 'Look at the fridge', 0.8)
point('CalendarPt', (4.95, 1.2, -4.75), 'Look at the calendar', 0.7)
point('TV', (2.75, 0.8, -4.15), 'Look at the TV', 1.0)
point('FrontDoorExit', (1.0, 1.0, -2.66), 'Move the couch and go out', 1.0, False)
point('LCrucifix', (-0.85, 1.4, 9.4), 'Look at the crucifix', 1.3, False)
point('LRosary', (0.86, 0.6, 9.45), 'Look at the rosary', 1.0, False)
point('LBible', (-2.6, 0.95, 11.07), 'Read the open Bible', 0.95, False)
point('LRadio', (0.6, 0.8, 13.7), 'Look at the radio', 0.9, False)
point('LWallPatch', (-2.9, 1.4, 14.44), 'Look at the wall', 0.9, False)
point('LPot', (3.24, 1.0, 9.55), 'Look at the stove', 1.0, False)
point('LTable', (2.05, 0.8, 11.3), 'Look at the table', 0.9, False)
point('LCalendar', (2.6, 1.5, 12.1), 'Look at the calendar', 1.4, False)
point('LToolbox', (1.55, 1.0, 9.33), 'Search the toolbox', 1.0, False)
point('LBed', (2.3, 0.55, 13.6), 'Look at the bed', 1.0, False)
point('LSafe', (1.56, 0.4, 14.3), 'Try the safe', 0.9, False)
point('LDressForm', (-1.2, 3.6, 10.0), 'Look', 1.1, False)
point('LMary', (-6.0, 1.0, 10.2), 'Look at the statue', 1.3, False)
point('CarDoor', (-21.2, 0.9, -6.05), 'Get in the car', 1.1, False)
point('Headlight', (-19.05, 0.65, -5.55), 'Look at the headlight', 1.0, False)

post = S.sub_res('ShaderMaterial', shader=S.ext_res('Shader', 'res://shaders/ps1_post.gdshader'))
S.node('PostFX', 'CanvasLayer', W, layer='10')
S.node('Rect', 'ColorRect', W + '/PostFX', material=post, anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', mouse_filter='2')
S.node('Audio', 'Node', script=S.ext_res('Script', 'res://scripts/systems/audio_director.gd'))
S.write(os.path.join(ROOT, 'scenes', 'chapter1', 'chapter1.tscn'))
print('chapter1.tscn: %d nodes' % len(S.nodes))
