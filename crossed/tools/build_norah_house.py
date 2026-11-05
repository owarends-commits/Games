#!/usr/bin/env python3
"""Generates Norah's house blockout (Chapter One): scenes/environments/norah_house.tscn
plus a review scene, scenes/environments/norah_house_review.tscn, that renders every planned camera.

Layout follows Map 3 in the Chapter One design package: a cramped, worn-in one-storey rental, about 8 x 5.3 m,
front door facing the road (west, -X), woods behind (east, +X). North = -Z. 1 unit = 1 m.
  Living room  X 0..4,     Z -5.33..0
  Kitchen      X 4..8,     Z -5.33..-3.17
  Hallway      X 4..8,     Z -3.17..-2.33  (0.84 m wide)
  Bathroom     X 4..5.83,  Z -2.33..0
  Bedroom      X 5.83..8,  Z -2.33..0
Run:  python3 tools/build_norah_house.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tscn import Scene, T, V3, V2, C, f, write_res, look_at_rows, yaw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CEIL = 2.3          # low ceilings: the house should feel tight
WT = 0.12           # thin interior walls
ET = 0.18           # exterior walls
DOOR_H = 2.0

SURF = 'res://shaders/ps1_surface.gdshader'
def mat(name, tex='white.png', scale=(1, 1), albedo=(1, 1, 1), world=True, affine=0.5, emis=0.0):
    write_res(os.path.join(ROOT, 'materials', 'nh_' + name + '.tres'), 'ShaderMaterial',
              [('Shader', SURF), ('Texture2D', 'res://assets/textures/' + tex)],
              {'render_priority': '0', 'shader': 'ExtResource("1")', 'shader_parameter/albedo': C(*albedo),
               'shader_parameter/albedo_tex': 'ExtResource("2")', 'shader_parameter/world_uv': 'true' if world else 'false',
               'shader_parameter/uv_scale': V2(*scale), 'shader_parameter/affine_amount': f(float(affine)),
               'shader_parameter/emission_strength': f(float(emis))})
    return 'res://materials/nh_%s.tres' % name

M = dict(
    wallpaper=mat('wallpaper', 'wall_hall.png', (0.9, 1 / CEIL), (0.78, 0.72, 0.58), affine=0.12),        # yellowed, stained
    wall_kitchen=mat('wall_kitchen', 'wall_foyer.png', (0.9, 1 / CEIL), (0.7, 0.72, 0.6), affine=0.12),
    tile=mat('tile', 'floor_foyer.png', (2, 2), (0.75, 0.78, 0.76), affine=0.3),
    carpet=mat('carpet', 'carpet_hall.png', (1, 1), (0.62, 0.52, 0.42)),                                   # worn brown carpet
    lino=mat('lino', 'floor_party.png', (0.8, 0.8), (0.82, 0.74, 0.45)),                                  # yellowed linoleum
    ceiling=mat('ceiling', 'ceiling_tile.png', (1, 1), (0.72, 0.68, 0.6)),
    stain=mat('stain', albedo=(0.45, 0.38, 0.26)),
    siding=mat('siding', 'wood.png', (0.6, 1.6), (0.55, 0.58, 0.6), affine=0.2),                       # peeling grey paint
    roof=mat('roof', 'roof_shingle.png', (0.5, 0.5), (0.5, 0.5, 0.52)),
    porch=mat('porch', 'wood.png', (1, 1), (0.55, 0.48, 0.4)), porch_patch=mat('porch_patch', 'wood.png', (1, 1), (0.85, 0.72, 0.52)),
    dirt=mat('dirt', 'concrete.png', (0.4, 0.4), (0.42, 0.34, 0.26)), grass=mat('grass', 'grass.png', (0.5, 0.5), (0.55, 0.6, 0.45)),
    wood=mat('wood', 'wood.png'), wood_dark=mat('wood_dark', 'wood.png', (1, 1), (0.5, 0.38, 0.3)),
    couch=mat('couch', 'cloth_mint.png', (2, 2), (0.55, 0.5, 0.4)), blanket=mat('blanket', 'cloth_pink.png', (2, 2), (0.6, 0.4, 0.4)),
    bedding=mat('bedding', 'cloth_yellow.png', (2, 2), (0.75, 0.74, 0.68)), fridge=mat('fridge', albedo=(0.82, 0.8, 0.72)),
    counter=mat('counter', albedo=(0.6, 0.55, 0.45)), metal=mat('metal', albedo=(0.3, 0.3, 0.32)), porcelain=mat('porcelain', albedo=(0.88, 0.88, 0.84)),
    rust=mat('rust', albedo=(0.5, 0.3, 0.18)), tv=mat('tv', albedo=(0.12, 0.12, 0.13)), screen=mat('screen', albedo=(0.12, 0.16, 0.18)),
    frame=mat('frame', albedo=(0.3, 0.22, 0.15)),
    photo_a=mat('photo_a', albedo=(0.85, 0.7, 0.5), emis=0.15), photo_b=mat('photo_b', albedo=(0.45, 0.65, 0.8), emis=0.15),
    photo_c=mat('photo_c', albedo=(0.95, 0.85, 0.4), emis=0.15), drawing=mat('drawing', albedo=(0.95, 0.95, 0.9)),
    glass=mat('glass', albedo=(0.08, 0.1, 0.14)), lamp=mat('lamp', albedo=(1, 0.9, 0.7), emis=1.6), bulb=mat('bulb', albedo=(1, 0.95, 0.75), emis=2.0),
    lockbox=mat('lockbox', albedo=(0.25, 0.28, 0.3)), tree=mat('tree', 'grass.png', (1, 1), (0.25, 0.3, 0.2)), leaves=mat('leaves', 'grass.png', (1, 1), (0.62, 0.36, 0.14)), bark=mat('bark', 'wood.png', (1, 1), (0.3, 0.24, 0.2)),
    car=mat('car_maroon', albedo=(0.32, 0.1, 0.1)), tire=mat('tire', albedo=(0.04, 0.04, 0.04)),
    marker=mat('cam_marker', albedo=(1.0, 0.75, 0.1), emis=1.4, world=False), marker_line=mat('cam_line', albedo=(1.0, 0.55, 0.1), emis=1.0, world=False),
)

S = Scene()
S.node('NorahHouse', 'Node3D', parent=None)
for g in ['Geometry', 'Geometry/Floors', 'Geometry/Walls', 'Geometry/Ceilings', 'Geometry/Roof', 'Props', 'Photos', 'Exterior', 'Lights', 'Cameras',
          'CameraMarkers']:
    S.node(g.split('/')[-1], 'Node3D', parent='.' if '/' not in g else g.rsplit('/', 1)[0])
[n_ for n_ in S.nodes if n_[0] == 'CameraMarkers'][0][5]['visible'] = 'false'   # review markers: hidden in the game

_n = [0]
def box(parent, x0, x1, y0, y1, z0, z1, m, col=True, name=None, rot=None):
    _n[0] += 1
    props = {'transform': T(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
             'size': V3(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), 'material': S.ext_res('Material', M[m])}
    if col: props['use_collision'] = 'true'
    return S.node(name or ('B%d' % _n[0]), 'CSGBox3D', parent, **props)

def wall_x(x, z0, z1, m, holes=(), t=WT, h=CEIL, m2=None):
    """Wall running along Z at X = x. holes: (za, zb, y0, y1). m2 = material on the second face (skins inside the thickness)."""
    z0, z1 = min(z0, z1), max(z0, z1); cuts = sorted(holes)
    pieces, z = [], z0
    for za, zb, y0, y1 in cuts:
        if za > z: pieces.append((z, za, 0, h))
        if y0 > 0: pieces.append((za, zb, 0, y0))
        if y1 < h: pieces.append((za, zb, y1, h))
        z = zb
    if z < z1: pieces.append((z, z1, 0, h))
    for a, b, y0, y1 in pieces:
        if m2:
            box('Geometry/Walls', x - t / 2, x, y0, y1, a, b, m); box('Geometry/Walls', x, x + t / 2, y0, y1, a, b, m2)
        else:
            box('Geometry/Walls', x - t / 2, x + t / 2, y0, y1, a, b, m)

def wall_z(z, x0, x1, m, holes=(), t=WT, h=CEIL, m2=None):
    x0, x1 = min(x0, x1), max(x0, x1); cuts = sorted(holes)
    pieces, x = [], x0
    for xa, xb, y0, y1 in cuts:
        if xa > x: pieces.append((x, xa, 0, h))
        if y0 > 0: pieces.append((xa, xb, 0, y0))
        if y1 < h: pieces.append((xa, xb, y1, h))
        x = xb
    if x < x1: pieces.append((x, x1, 0, h))
    for a, b, y0, y1 in pieces:
        if m2:
            box('Geometry/Walls', a, b, y0, y1, z - t / 2, z, m); box('Geometry/Walls', a, b, y0, y1, z, z + t / 2, m2)
        else:
            box('Geometry/Walls', a, b, y0, y1, z - t / 2, z + t / 2, m)

# ------------------------------------------------------------------ shell
XW, XE, ZN, ZS = 0.0, 8.0, -5.33, 0.0
Z_HALL_N, Z_HALL_S, X_MID, X_BATH = -3.17, -2.33, 4.0, 5.83
FRONT_DOOR = (-3.17, -2.17, 0, DOOR_H)        # a full metre: the player has to get through it at a sprint
BACK_DOOR = (-4.5, -3.83, 0, DOOR_H)
BED_WINDOW = (-1.67, -0.67, 0.85, 1.9)
LIV_WINDOW = (-1.6, -0.5, 0.9, 1.8)
KIT_WINDOW = (5.6, 6.7, 1.0, 1.7)

# floors (raised 2 cm, the porch steps up to them)
box('Geometry/Floors', XW, X_MID, -0.06, 0.02, ZN, ZS, 'carpet')
box('Geometry/Floors', X_MID, XE, -0.06, 0.02, ZN, Z_HALL_N, 'lino')
box('Geometry/Floors', X_MID, XE, -0.06, 0.02, Z_HALL_N, Z_HALL_S, 'carpet')
box('Geometry/Floors', X_MID, X_BATH, -0.06, 0.02, Z_HALL_S, ZS, 'tile')
box('Geometry/Floors', X_BATH, XE, -0.06, 0.02, Z_HALL_S, ZS, 'carpet')
box('Geometry/Floors', 0.5, 3.6, 0.02, 0.025, -3.0, -2.4, 'stain', col=False)          # carpet worn to the backing: a path to the hall
box('Geometry/Ceilings', XW, XE, CEIL, CEIL + 0.05, ZN, ZS, 'ceiling')
box('Geometry/Ceilings', 1.4, 2.6, CEIL - 0.005, CEIL, -4.4, -3.5, 'stain', col=False)  # water stain

# exterior walls: siding outside, paper inside
wall_x(XW, ZN, ZS, 'siding', holes=[FRONT_DOOR, LIV_WINDOW], t=ET, m2='wallpaper')
wall_x(XE, ZN, ZS, 'wallpaper', holes=[BACK_DOOR, BED_WINDOW], t=ET, m2='siding')
wall_z(ZN, XW, XE, 'siding', holes=[KIT_WINDOW], t=ET, m2='wallpaper')
wall_z(ZS, XW, XE, 'wallpaper', t=ET, m2='siding')
# interior walls
wall_x(X_MID, ZN, Z_HALL_N, 'wallpaper')                                         # living | kitchen (solid)
wall_x(X_MID, Z_HALL_S, ZS, 'wallpaper')                                         # living | bath (solid)
wall_z(Z_HALL_N, X_MID, XE, 'wallpaper', holes=[(4.5, 5.3, 0, DOOR_H)])          # kitchen | hall: kitchen doorway
wall_z(Z_HALL_S, X_MID, XE, 'wallpaper', holes=[(4.58, 5.25, 0, DOOR_H), (6.17, 6.83, 0, DOOR_H)])   # hall | bath, bedroom
wall_x(X_BATH, Z_HALL_S, ZS, 'wallpaper')                                        # bath | bedroom

# doors (open slabs; the bathroom door is closed, it is the target later)
box('Geometry/Walls', 5.2, 5.24, 0, DOOR_H, -2.3, -1.66, 'wood', name='BathroomDoor')          # open into the bathroom; closed = X 4.6..5.24, Z -2.36..-2.31
box('Geometry/Walls', 5.53, 6.17, 0, DOOR_H, -2.43, -2.39, 'wood', name='BedroomDoor')        # swung out flat against the hall wall
box('Geometry/Walls', -0.13, -0.09, 0, DOOR_H, -4.17, -3.17, 'wood', name='FrontDoor', col=False)  # swung open flat against the outside wall
box('Geometry/Walls', 8.0, 8.04, 0, DOOR_H, -3.83, -3.2, 'wood', name='BackDoor', col=False)
# window glass
for nm, (x0, x1, z0, z1, y0, y1) in dict(BedroomWindow=(XE - 0.02, XE + 0.02, -1.67, -0.67, 0.85, 1.9),
                                         LivingWindow=(XW - 0.02, XW + 0.02, -1.6, -0.5, 0.9, 1.8),
                                         KitchenWindow=(5.6, 6.7, ZN - 0.02, ZN + 0.02, 1.0, 1.7)).items():
    box('Geometry/Walls', x0, x1, y0, y1, z0, z1, 'glass', name=nm, col=False)

# roof (hidden in the overview render)
box('Geometry/Roof', XW - 0.4, XE + 0.4, CEIL + 0.05, CEIL + 0.25, ZN - 0.4, ZS + 0.4, 'roof', col=False)

# ------------------------------------------------------------------ props
P = 'Props'
# living room: sagging couch facing the TV, blanket over the torn cushion, box TV, radiator, side table
# the couch sits north of the front door; in Chapter One Norah pushes it 1.15 m south to block the door
S.node('Couch', 'Node3D', P)
CZ = -1.15
box(P + '/Couch', 0.55, 1.35, 0.0, 0.42, -3.9 + CZ, -2.1 + CZ, 'couch'); box(P + '/Couch', 0.35, 0.6, 0.0, 0.85, -3.9 + CZ, -2.1 + CZ, 'couch')   # seat + back
box(P + '/Couch', 0.55, 1.35, 0.0, 0.62, -4.05 + CZ, -3.9 + CZ, 'couch'); box(P + '/Couch', 0.55, 1.35, 0.0, 0.62, -2.1 + CZ, -1.95 + CZ, 'couch')   # arms
box(P + '/Couch', 0.62, 1.3, 0.42, 0.47, -3.4 + CZ, -2.6 + CZ, 'blanket', col=False)
box(P, 3.05, 3.6, 0.0, 0.5, -4.55, -3.65, 'wood_dark'); box(P, 3.1, 3.55, 0.5, 0.98, -4.5, -3.8, 'tv')             # TV stand + box TV
box(P, 3.08, 3.1, 0.58, 0.9, -4.43, -3.87, 'screen', col=False, name='TVScreen')
box(P, 0.05, 0.2, 0.0, 0.6, -5.2, -4.4, 'metal')                                                                     # radiator
box(P, 0.4, 0.85, 0.0, 0.55, -1.2, -0.75, 'wood')                                                                     # side table
box(P, 1.6, 2.8, 0.0, 0.03, -3.7, -2.3, 'blanket', col=False)                                                         # threadbare rug
# kitchen: dented fridge (drawings + custody calendar), counter run, sink, small table, mismatched chairs, bookshelf by the back door
box(P, 4.1, 4.75, 0.0, 1.75, -5.25, -4.6, 'fridge')
box(P, 4.76, 4.77, 0.9, 1.15, -5.1, -4.85, 'drawing', col=False); box(P, 4.76, 4.77, 1.25, 1.55, -4.95, -4.72, 'drawing', col=False)
box(P, 4.8, 7.0, 0.0, 0.9, -5.25, -4.65, 'counter'); box(P, 5.8, 6.4, 0.86, 0.91, -5.15, -4.75, 'metal', col=False)   # counter + sink
box(P, 6.3, 7.1, 0.0, 0.72, -3.95, -3.3, 'wood')                                                                        # table
box(P, 6.0, 6.3, 0.0, 0.9, -3.75, -3.45, 'wood_dark'); box(P, 7.1, 7.4, 0.0, 0.9, -3.75, -3.45, 'counter')                # mismatched chairs
box(P, 7.55, 7.95, 0.0, 1.7, -5.2, -4.6, 'wood_dark', name='Bookshelf')                                                 # pushed to the back door
# bedroom: a sagging twin bed (head on the south wall), nightstand, the wardrobe beside the window (door ajar), laundry basket, lockbox under the bed
box(P, 6.6, 7.4, 0.0, 0.32, -1.65, -0.1, 'wood_dark'); box(P, 6.65, 7.35, 0.32, 0.5, -1.6, -0.15, 'bedding')
box(P, 6.6, 7.4, 0.32, 0.95, -0.12, -0.02, 'wood_dark')                                                                  # headboard on the south wall
box(P, 7.45, 7.95, 0.0, 0.55, -0.1, 0.0, 'wood', col=False)
box(P, 6.12, 6.5, 0.0, 0.6, -0.45, -0.08, 'wood')                                                                         # nightstand
S.node('Wardrobe', 'Node3D', P)
box(P + '/Wardrobe', 7.45, 7.95, 0.0, 1.9, -2.25, -1.75, 'wood'); box(P + '/Wardrobe', 7.2, 7.45, 0.1, 1.85, -2.22, -2.2, 'wood', col=False)   # ajar door
box(P, 7.5, 7.88, 0.0, 0.4, -0.5, -0.15, 'blanket')                                                                    # laundry basket
box(P, 6.65, 7.0, 0.02, 0.14, -1.35, -1.05, 'lockbox', name='Lockbox', col=False)
# bathroom: clawfoot tub with a rust ring, sink, cracked mirror, toilet
box(P, 4.15, 5.75, 0.12, 0.6, -0.65, -0.12, 'porcelain', name='Tub'); box(P, 4.3, 5.6, 0.6, 0.605, -0.6, -0.18, 'rust', col=False)
box(P, 4.15, 4.6, 0.0, 0.85, -1.9, -1.45, 'porcelain'); box(P, 4.07, 4.08, 1.05, 1.6, -1.85, -1.5, 'glass', col=False)
box(P, 5.3, 5.75, 0.0, 0.45, -1.7, -1.3, 'porcelain')
# hallway: a lamp table, light switch plate missing
box(P, 7.6, 7.95, 0.0, 0.7, -3.1, -2.75, 'wood_dark')

# photos of Norah and Adaline: small frames, hung crooked at two heights in the hall, one over the couch, one on the nightstand
def photo(name, x, y, z, w, h, axis, m, tilt=0.0):
    import math
    c, s = math.cos(math.radians(tilt)), math.sin(math.radians(tilt))
    if axis == 'z':     # on a wall facing +-Z
        rot = ((c, -s, 0), (s, c, 0), (0, 0, 1))
        S.node(name, 'Node3D', 'Photos', transform=T((x, y, z)))
        box('Photos/' + name, -w / 2 - 0.02, w / 2 + 0.02, -h / 2 - 0.02, h / 2 + 0.02, -0.01, 0.01, 'frame', col=False, rot=rot)
        box('Photos/' + name, -w / 2, w / 2, -h / 2, h / 2, -0.015, 0.015, m, col=False, rot=rot)
    else:               # on a wall facing +-X
        rot = ((1, 0, 0), (0, c, -s), (0, s, c))
        S.node(name, 'Node3D', 'Photos', transform=T((x, y, z)))
        box('Photos/' + name, -0.01, 0.01, -h / 2 - 0.02, h / 2 + 0.02, -w / 2 - 0.02, w / 2 + 0.02, 'frame', col=False, rot=rot)
        box('Photos/' + name, -0.015, 0.015, -h / 2, h / 2, -w / 2, w / 2, m, col=False, rot=rot)
photo('Hall_SchoolPhoto', 5.9, 1.55, Z_HALL_N + 0.07, 0.2, 0.25, 'z', 'photo_a', 4)
photo('Hall_Lake', 6.5, 1.35, Z_HALL_N + 0.07, 0.3, 0.22, 'z', 'photo_b', -3)
photo('Hall_Birthday', 7.1, 1.6, Z_HALL_N + 0.07, 0.22, 0.18, 'z', 'photo_c', 7)
photo('Hall_KidHeight', 6.0, 0.95, Z_HALL_S - 0.07, 0.18, 0.22, 'z', 'photo_c', -5)
photo('Living_OverCouch', 0.1, 1.45, -4.2, 0.4, 0.3, 'x', 'photo_b', 2)
photo('Living_Baby', 0.1, 1.5, -1.75, 0.18, 0.22, 'x', 'photo_a', -4)
box('Photos', 6.3, 6.42, 0.6, 0.78, -0.25, -0.23, 'photo_a', col=False, name='Nightstand_Photo')

# ------------------------------------------------------------------ exterior: porch, yard, driveway, car, the treeline
E = 'Exterior'
box(E, -40, 24, -0.3, -0.05, -38, 16, 'grass', col=True)
box(E, -34, -24, -0.05, -0.02, -14, 8, 'dirt', col=False)                                     # the cul-de-sac's edge
box(E, -24, -18.6, -0.05, -0.015, -6.2, -3.8, 'dirt', col=False)                              # gravel pull-in at the road end
box(E, -19.2, -1.4, -0.05, -0.012, -3.3, -2.0, 'dirt', col=False)                            # ~18 m gravel path to the porch
box(E, -1.0, 0.0, 0.0, 0.08, -3.95, -1.35, 'porch')                                          # sagging porch (wide, low: easy to run onto)
box(E, -1.45, -1.0, 0.0, 0.04, -3.3, -2.0, 'porch_patch')                                      # step patched with newer wood
for z in (-3.88, -1.42): box(E, -0.98, -0.9, 0.08, 2.3, z - 0.04, z + 0.04, 'porch')
box(E, -1.05, 0.0, 2.3, 2.38, -4.0, -1.3, 'porch', col=False)
box(E, -0.25, -0.15, 1.95, 2.05, -2.4, -2.3, 'bulb', col=False, name='PorchBulb')
box(E, -0.75, -0.35, 0.08, 0.55, -1.75, -1.5, 'porcelain', col=False)                        # cracked plastic chair
# Norah's old car at the road end of the drive, nose toward the house; the beam crosses the yard past the north side of the house
box(E, -23.4, -19.4, 0.25, 0.85, -5.85, -4.15, 'car', name='NorahCar'); box(E, -22.6, -20.6, 0.85, 1.25, -5.7, -4.3, 'car')
for xw, zw in ((-22.8, -5.9), (-22.8, -4.1), (-20.0, -5.9), (-20.0, -4.1)): box(E, xw - 0.25, xw + 0.25, 0.0, 0.5, zw - 0.1, zw + 0.1, 'tire')
box(E, -19.42, -19.38, 0.55, 0.72, -5.7, -5.3, 'lamp', col=False, name='Headlight')
box(E, -19.42, -19.38, 0.55, 0.72, -4.7, -4.3, 'lamp', col=False, name='Headlight2')
# woods: along the north edge of the yard (where Louis watches) and behind the house
import random
r = random.Random(7)
def tree(x, z, h):
    box(E, x - 0.16, x + 0.16, 0, h * 0.55, z - 0.16, z + 0.16, 'bark', col=False)
    box(E, x - 0.9, x + 0.9, h * 0.4, h, z - 0.9, z + 0.9, 'tree', col=False)
for i in range(70): tree(r.uniform(-34, 22), r.uniform(-34, -16.5), r.uniform(6, 10))
for i in range(40): tree(r.uniform(11, 23), r.uniform(-16, 14), r.uniform(6, 10))
# trunks framing Louis's two vantage points (A2 far, A3 near)
tree(-7.4, -22.0, 8); tree(-3.9, -23.6, 9); tree(-11.6, -14.6, 8)
S.node('FigureMarker', 'Marker3D', E, transform=T((9.5, 0, -14.5)))
S.node('NorahStop', 'Marker3D', E, transform=T((-8.0, 0, -3.2)))

# ------------------------------------------------------------------ detail pass (Chapter One, full build): trim, real photos, clutter, yard
from house_kit import Kit, rot_x, rot_z, mul, FACING
K = Kit(S, M, 'nh')
K.mat('trim', albedo=(0.8, 0.78, 0.72)); K.mat('trim_ext', albedo=(0.7, 0.7, 0.68))
for nm in ('addie_school', 'addie_lake', 'addie_birthday', 'addie_baby', 'fridge_pickle', 'cereal_box', 'mail_bill'):
    K.mat(nm, nm + '.png', world=False, affine=0.1)
K.mat('curtain', 'cloth_yellow.png', (2, 2), (0.85, 0.8, 0.62)); K.mat('curtain_bed', 'cloth_pink.png', (2, 2), (0.7, 0.6, 0.62))
K.mat('mug', albedo=(0.75, 0.3, 0.25)); K.mat('mug2', albedo=(0.3, 0.45, 0.7)); K.mat('plate', albedo=(0.9, 0.9, 0.86))
K.mat('plant', albedo=(0.25, 0.4, 0.2)); K.mat('pot_clay', albedo=(0.6, 0.32, 0.2)); K.mat('coat', albedo=(0.35, 0.3, 0.42))
K.mat('kidpink', albedo=(0.9, 0.45, 0.6)); K.mat('towel', albedo=(0.45, 0.6, 0.65)); K.mat('clock_red', albedo=(1.0, 0.1, 0.05), emis=1.4)
K.mat('fixture', albedo=(0.9, 0.88, 0.8), emis=0.6); K.mat('switch', albedo=(0.86, 0.84, 0.78)); K.mat('runner', 'carpet_hall.png', (1, 1), (0.5, 0.3, 0.28))
K.mat('can', albedo=(0.25, 0.3, 0.28)); K.mat('logs', 'wood.png', (2, 2), (0.45, 0.34, 0.24)); K.mat('bike', albedo=(0.75, 0.2, 0.35))
K.mat('pole', 'wood.png', (0.5, 2), (0.35, 0.3, 0.26)); K.mat('wire', albedo=(0.05, 0.05, 0.05)); K.mat('gutter', albedo=(0.55, 0.56, 0.55))
K.mat('shower', albedo=(0.75, 0.82, 0.8)); K.mat('clothes', 'cloth_mint.png', (3, 3), (0.5, 0.5, 0.55)); K.mat('coffee', albedo=(0.12, 0.12, 0.13))
D = 'Props'
# door casings and window frames (both faces), curtains, baseboards, crown strips
for a, b in ((4.5, 5.3),): K.casing('Geometry/Walls', 'z', Z_HALL_N, a, b, 0, DOOR_H, 'trim')
for a, b in ((4.58, 5.25), (6.17, 6.83)): K.casing('Geometry/Walls', 'z', Z_HALL_S, a, b, 0, DOOR_H, 'trim')
K.casing('Geometry/Walls', 'x', XW, -3.17, -2.17, 0, DOOR_H, 'trim', t=ET)
K.casing('Geometry/Walls', 'x', XE, -4.5, -3.83, 0, DOOR_H, 'trim', t=ET)
K.casing('Geometry/Walls', 'x', XW, -1.6, -0.5, 0.9, 1.8, 'trim', t=ET, sill=True)
K.casing('Geometry/Walls', 'x', XE, -1.67, -0.67, 0.85, 1.9, 'trim', t=ET, sill=True)
K.casing('Geometry/Walls', 'z', ZN, 5.6, 6.7, 1.0, 1.7, 'trim', t=ET, sill=True)
for at, a, b, y0, y1, ax in ((XW, -1.6, -0.5, 0.9, 1.8, 'x'), (XE, -1.67, -0.67, 0.85, 1.9, 'x'), (ZN, 5.6, 6.7, 1.0, 1.7, 'z')):
    g = (y0 + y1) / 2
    if ax == 'x': K.box('Geometry/Walls', at - 0.025, at + 0.025, g - 0.02, g + 0.02, a, b, 'trim', col=False, name='Mullion%d' % int(at))
    else: K.box('Geometry/Walls', a, b, g - 0.02, g + 0.02, at - 0.025, at + 0.025, 'trim', col=False)
K.curtains('Geometry/Walls', 'x', XW, -1.6, -0.5, 0.9, 1.8, 'curtain', inside=1)
K.curtains('Geometry/Walls', 'x', XE, -1.67, -0.67, 0.85, 1.9, 'curtain_bed', inside=-1, name='BedCurtain')
K.curtains('Geometry/Walls', 'z', ZN, 5.6, 6.7, 1.0, 1.7, 'curtain', inside=1)
K.baseboards('Geometry/Walls', [(XW, X_MID, ZN, ZS, 0.02), (X_MID, XE, ZN, Z_HALL_N, 0.02), (X_MID, XE, Z_HALL_N, Z_HALL_S, 0.02),
                                (X_MID, X_BATH, Z_HALL_S, ZS, 0.02), (X_BATH, XE, Z_HALL_S, ZS, 0.02)], 'wood_dark')
# the photos get their pictures (quads just in front of each frame)
for nm, c, w, h, face, tex, tilt in (('Hall_SchoolPhoto', (5.9, 1.55, Z_HALL_N + 0.087), 0.2, 0.25, '+z', 'addie_school', 4),
                                    ('Hall_Lake', (6.5, 1.35, Z_HALL_N + 0.087), 0.3, 0.22, '+z', 'addie_lake', -3),
                                    ('Hall_Birthday', (7.1, 1.6, Z_HALL_N + 0.087), 0.22, 0.18, '+z', 'addie_birthday', 7),
                                    ('Hall_KidHeight', (6.0, 0.95, Z_HALL_S - 0.087), 0.18, 0.22, '-z', 'addie_school', -5),
                                    ('Living_OverCouch', (0.117, 1.45, -4.2), 0.4, 0.3, '+x', 'addie_lake', 2),
                                    ('Living_Baby', (0.117, 1.5, -1.75), 0.18, 0.22, '+x', 'addie_baby', -4)):
    K.quad('Photos', c, w, h, face, tex, tilt=tilt if face in ('+z', '-z') else 0.0)
K.quad('Photos', (6.36, 0.69, -0.215), 0.1, 0.15, '+z', 'addie_birthday')
# Addie's drawings on the fridge (replace the blank sheets)
K.quad(D, (4.78, 1.02, -4.97), 0.24, 0.2, '+x', 'fridge_pickle'); K.quad(D, (4.78, 1.4, -4.84), 0.2, 0.26, '+x', 'addie_lake', tilt=0)
# ceiling fixtures and switch plates
for x, z in ((2.0, -2.7), (5.8, -4.3), (6.0, -2.75), (4.9, -1.2)):
    K.cyl(D, (x, CEIL - 0.04, z), 0.14, 0.06, 'fixture', sides=8)
for x, z, ax in ((0.07, -1.95, 'x'), (4.07, -3.4, 'x'), (5.3, -2.4, 'z'), (6.88, -2.26, 'z')):
    if ax == 'x': K.box(D, x - 0.01, x + 0.01, 1.2, 1.32, z - 0.04, z + 0.04, 'switch', col=False)
    else: K.box(D, x - 0.04, x + 0.04, 1.2, 1.32, z - 0.01, z + 0.01, 'switch', col=False)
# living room: coat rack and Addie's rain boots by the door, a droopy plant, a lamp, throw pillows, toys
K.cyl(D, (0.28, 0.85, -1.4), 0.03, 1.7, 'wood_dark', sides=6, col=True); K.cyl(D, (0.28, 0.02, -1.4), 0.18, 0.04, 'wood_dark', sides=8)
K.cbox(D, (0.28, 1.3, -1.35), (0.3, 0.6, 0.18), 'coat', rot=yaw(12)); K.cbox(D, (0.3, 1.25, -1.47), (0.22, 0.5, 0.12), 'kidpink', rot=yaw(-20))
for z in (-1.7, -1.58): K.box(D, 0.12, 0.3, 0.0, 0.16, z, z + 0.08, 'kidpink', col=False)
K.cyl(D, (3.72, 0.16, -0.28), 0.16, 0.32, 'pot_clay', sides=8, col=True)
for k, a in enumerate((0, 70, 150, 230, 300)): K.cbox(D, (3.72, 0.45, -0.28), (0.06, 0.5, 0.22), 'plant', rot=mul(yaw(a), rot_x(35 + k * 6)))
K.cyl(D, (0.62, 0.6, -0.98), 0.05, 0.12, 'wood_dark', sides=6); K.cyl(D, (0.62, 0.74, -0.98), 0.11, 0.14, 'fixture', sides=8)
K.cbox(D, (0.62, 0.36, -4.55), (0.12, 0.28, 0.32), 'blanket', rot=yaw(8)); K.cbox(D, (0.62, 0.36, -3.65), (0.12, 0.26, 0.3), 'couch', rot=yaw(-10))
K.box(D, 2.3, 2.5, 0.03, 0.18, -1.9, -1.75, 'kidpink', col=False); K.box(D, 1.9, 2.05, 0.03, 0.1, -1.6, -1.45, 'mug2', col=False)   # toy blocks
# kitchen: dishes in the sink, the cereal box, coffee maker, mugs, mail with a FINAL bill on the table, a sippy cup
for k in range(3): K.cyl(D, (6.1, 0.8 + k * 0.025, -4.95), 0.12, 0.02, 'plate', sides=10)
K.box(D, 5.05, 5.25, 0.9, 1.2, -5.18, -5.1, 'cereal_box', col=False); K.quad(D, (5.15, 1.05, -5.098), 0.2, 0.3, '+z', 'cereal_box')
K.box(D, 6.55, 6.85, 0.9, 1.25, -5.22, -5.0, 'coffee', col=False); K.cyl(D, (6.7, 0.98, -4.92), 0.06, 0.14, 'glass', sides=8)
for x, m_ in ((5.5, 'mug'), (5.62, 'mug2')): K.cyl(D, (x, 0.95, -4.85), 0.04, 0.09, m_, sides=6)
K.box(D, 6.5, 6.8, 0.72, 0.74, -3.75, -3.55, 'drawing', col=False); K.quad(D, (6.66, 0.745, -3.62), 0.22, 0.14, 'up', 'mail_bill')
K.cyl(D, (6.95, 0.79, -3.45), 0.035, 0.12, 'kidpink', sides=6)
# hall runner, bathroom towel / mat / shower curtain / toothbrushes, bedroom alarm clock, clothes
K.box(D, 4.25, 7.45, 0.02, 0.03, -2.98, -2.52, 'runner', col=False)
K.box(D, X_BATH - 0.08, X_BATH - 0.06, 1.05, 1.08, -1.25, -0.65, 'metal', col=False); K.box(D, X_BATH - 0.1, X_BATH - 0.07, 0.6, 1.08, -1.2, -0.7, 'towel', col=False)
K.box(D, 4.6, 5.2, 0.02, 0.03, -1.3, -0.85, 'towel', col=False)
K.box(D, 4.15, 4.75, 1.92, 1.95, -0.67, -0.64, 'metal', col=False); K.box(D, 4.17, 4.62, 0.5, 1.92, -0.68, -0.66, 'shower', col=False)
K.cyl(D, (4.25, 0.9, -1.55), 0.03, 0.08, 'mug2', sides=6); K.box(D, 4.24, 4.25, 0.92, 1.0, -1.56, -1.55, 'kidpink', col=False)
K.box(D, 6.22, 6.4, 0.6, 0.68, -0.42, -0.36, 'black' if 'black' in M else 'tv', col=False); K.box(D, 6.24, 6.38, 0.62, 0.66, -0.358, -0.355, 'clock_red', col=False)
K.cbox(D, (7.0, 0.04, -2.05), (0.4, 0.06, 0.3), 'clothes', rot=yaw(30)); K.cbox(D, (7.65, 0.42, -0.32), (0.3, 0.08, 0.25), 'clothes', rot=yaw(-15))

# exterior: porch rails, gutters and downspout, a gable roof, woodpile, trash cans, Addie's bike, mailbox, the power line
X = 'Exterior'
for z0, z1 in ((-3.95, -3.5), (-1.8, -1.35)):     # short rails at the porch ends only; the whole front is open
    K.box(X, -1.0, -0.94, 0.08, 0.95, z0, z1, 'trim_ext'); K.box(X, -1.0, -0.94, 0.85, 0.92, z0, z1, 'trim_ext', col=False)
    for z in (z0 + 0.15, z0 + 0.3): K.box(X, -0.99, -0.95, 0.08, 0.85, z - 0.015, z + 0.015, 'trim_ext', col=False)
for side in (-1, 1):
    zc = -2.665 + side * 1.75
    K.cbox('Geometry/Roof', (4.0, CEIL + 0.62, zc), (8.8, 0.1, 3.75), 'roof', rot=rot_x(side * 20), col=False)
for xg in (XW, XE):
    for z0, z1, y0, y1 in ((-5.2, -0.13, CEIL, CEIL + 0.42), (-4.4, -0.93, CEIL + 0.42, CEIL + 0.8), (-3.6, -1.73, CEIL + 0.8, CEIL + 1.1)):
        K.box('Geometry/Roof', xg - 0.09, xg + 0.09, y0, y1, z0, z1, 'siding', col=False)
for z in (ZN - 0.42, ZS + 0.42): K.box('Geometry/Roof', XW - 0.45, XE + 0.45, CEIL - 0.04, CEIL + 0.05, z - 0.06, z + 0.06, 'gutter', col=False)
K.box('Geometry/Roof', XW - 0.2, XW - 0.12, 0.0, CEIL, ZS + 0.3, ZS + 0.38, 'gutter', col=False)
K.box('Geometry/Roof', 6.4, 6.6, CEIL + 0.5, CEIL + 1.5, -1.5, -1.3, 'metal', col=False)                          # stove pipe
for k in range(4): K.cyl(X, (1.2 + k * 0.45, 0.16 + (k % 2) * 0.02, -5.7), 0.15, 1.0 if k % 2 else 0.9, 'logs', sides=6, rot=rot_x(90), col=(k == 0))
for k in range(3): K.cyl(X, (1.4 + k * 0.45, 0.42, -5.7), 0.14, 0.9, 'logs', sides=6, rot=rot_x(90))
K.box(X, 0.95, 3.1, 0.0, 0.06, -6.0, -5.45, 'wood_dark')
K.cyl(X, (-0.55, 0.42, -5.95), 0.25, 0.84, 'can', sides=8, col=True); K.cyl(X, (-0.05, 0.42, -6.05), 0.25, 0.84, 'can', sides=8, col=True)
K.cyl(X, (-0.55, 0.86, -5.95), 0.27, 0.05, 'can', sides=8)
for wx in (-4.85, -4.15): K.cyl(X, (wx, 0.2, -0.85), 0.2, 0.04, 'tire', sides=10, rot=rot_x(90))      # Addie's bike, dropped in the grass
K.box(X, -4.85, -4.15, 0.18, 0.22, -0.88, -0.82, 'bike', col=False); K.cbox(X, (-4.35, 0.32, -0.85), (0.04, 0.3, 0.04), 'bike', rot=rot_z(20))
K.box(X, -4.5, -4.3, 0.44, 0.47, -0.92, -0.78, 'tire', col=False); K.cbox(X, (-4.8, 0.42, -0.85), (0.04, 0.04, 0.3), 'metal')
K.cyl(X, (-24.6, 0.55, -2.2), 0.05, 1.1, 'wood_dark', sides=6, col=True); K.box(X, -24.8, -24.4, 1.1, 1.38, -2.42, -1.98, 'metal', col=False)
K.box(X, -24.42, -24.39, 1.15, 1.25, -2.3, -2.1, 'drawing', col=False)
K.cyl(X, (-25.2, 4.0, -7.4), 0.13, 8.0, 'pole', sides=6, col=True); K.box(X, -25.25, -25.15, 7.4, 7.5, -8.3, -6.5, 'pole', col=False)
import math as _m
a_, b_ = (-25.2, 7.3, -7.4), (0.0, 2.35, -5.0); L_ = _m.dist(a_, b_)
K.cbox(X, tuple((a_[i] + b_[i]) / 2 + (0, -0.4, 0)[i] for i in range(3)), (0.02, 0.02, L_), 'wire', rot=look_at_rows(a_, b_))

# ------------------------------------------------------------------ lights: dim bulbs, one per room, warm and failing
def omni(name, pos, col, e, rng):
    S.node(name, 'OmniLight3D', 'Lights', transform=T(pos), light_color=C(*col), light_energy=f(float(e)), omni_range=f(float(rng)), shadow_enabled='true')
omni('LivingBulb', (2.0, 2.1, -2.7), (1, 0.82, 0.55), 0.9, 5.0)
omni('KitchenBulb', (5.8, 2.1, -4.3), (0.85, 0.95, 0.8), 0.7, 4.0)                    # greenish fluorescent
omni('HallBulb', (6.0, 2.1, -2.75), (1, 0.8, 0.5), 0.45, 3.0)
omni('BedroomLamp', (6.14, 0.95, -0.35), (1, 0.75, 0.45), 0.6, 3.0)
omni('BathBulb', (4.9, 2.1, -1.2), (0.95, 0.95, 0.85), 0.6, 3.0)
omni('PorchLight', (-0.2, 1.9, -2.35), (1, 0.85, 0.55), 1.2, 6.0)
omni('HeadlightGlow', (-18.6, 0.7, -5.0), (1, 0.95, 0.8), 1.0, 8.0)
S.node('HeadlightBeam', 'SpotLight3D', 'Lights', transform=T((-19.2, 0.65, -5.0), look_at_rows((-19.2, 0.65, -5.0), (9.5, 1.2, -14.5))), light_color=C(1, 0.95, 0.8), light_energy='16.0', spot_range='40.0', spot_angle='26.0', shadow_enabled='true')
omni('YardBounce', (-6.0, 4.0, -4.0), (0.5, 0.55, 0.7), 0.5, 14.0)
S.node('Moon', 'DirectionalLight3D', 'Lights', transform=T((0, 10, 0), look_at_rows((0, 10, 0), (3, 0, 4))), light_color=C(0.45, 0.52, 0.7), light_energy='0.32')

write_res(os.path.join(ROOT, 'environments', 'env_norah_yard.tres'), 'Environment', [], {'background_mode': '1', 'background_color': C(0.015, 0.02, 0.03), 'ambient_light_source': '2',
          'ambient_light_color': C(0.42, 0.48, 0.62), 'ambient_light_energy': '0.55', 'tonemap_mode': '0',
          'fog_enabled': 'true', 'fog_light_color': C(0.03, 0.035, 0.05), 'fog_density': '0.012', 'fog_sky_affect': '0.0'})
S.node('HeadlightLow', 'SpotLight3D', 'Lights', transform=T((-19.2, 0.6, -4.5), look_at_rows((-19.2, 0.6, -4.5), (-2.0, 0.0, -3.0))), light_color=C(1, 0.95, 0.8), light_energy='10.0', spot_range='26.0', spot_angle='20.0')
ENV = os.path.join(ROOT, 'environments', 'env_norah_house.tres')
write_res(ENV, 'Environment', [], {'background_mode': '1', 'background_color': C(0.01, 0.012, 0.018), 'ambient_light_source': '2',
                                   'ambient_light_color': C(0.45, 0.45, 0.55), 'ambient_light_energy': '0.2', 'tonemap_mode': '0',
                                   'fog_enabled': 'true', 'fog_light_color': C(0.02, 0.022, 0.03), 'fog_density': '0.016', 'fog_sky_affect': '0.0'})

# ------------------------------------------------------------------ cameras (codes match the design package)
# Indoors they are tight and uncomfortable on purpose: high corners, low behind furniture, half-blocked by frames.
# The rule that keeps them fair: each shot shows the next doorway or the threat.
CAMS = [
    ('A2_LouisFar', (-6.0, 0.45, -24.0), (-21.0, 0.9, -5.0), 46, 'Arrival: Louis watching from deep in the north woods, low, trunks at the frame edges; the car pulls in, Norah gets out'),
    ('A3_LouisNear', (-10.4, 0.5, -16.2), (-13.5, 1.0, -2.8), 52, 'Arrival: closer in the woods, one or two trunks, straight across the dark grass at Norah; headlights flare into the lens'),
    ('A4_PorchOut', (-0.6, 1.95, -1.3), (-14.0, 0.9, -3.4), 54, 'Arrival: from the porch facing out at Norah walking in; the treeline is behind the camera'),
    ('C1_Shoulder', (-9.75, 1.95, -1.7), (9.5, 1.0, -14.5), 36, 'Cutscene: over her shoulder, the pale shape at the treeline in the headlight beam (C5 reuses it, dark)'),
    ('C2_Face', (-7.33, 1.6, -3.63), (-8.0, 1.52, -3.2), 40, 'Cutscene: close on her face, confused'),
    ('C3_Side', (-8.6, 1.3, -5.6), (-8.0, 1.15, -3.2), 50, 'Cutscene: from the side as she leans to see'),
    ('C4_Headlight', (-17.6, 0.95, -6.6), (-19.4, 0.63, -5.4), 44, 'Cutscene: close on the headlight sputtering out with a click'),
    ('C6_Jumpscare', (-7.6, 0.6, -3.6), (-5.6, 0.9, -5.2), 66, 'Jumpscare: low beside Norah as Louis bursts out of the dark at her and the camera'),
    ('S1_Overhead', (-12.0, 6.8, -1.2), (-1.0, 0.3, -2.7), 56, 'Sprint: overhead behind her, the path to the door lit only by the porch light'),
    ('N2_Yard', (-7.5, 2.4, 1.5), (0.0, 1.0, -2.6), 52, 'Yard from the cul-de-sac: car, porch steps, front door, side path'),
    ('N3_BackCorner', (8.6, 1.7, -6.2), (13.0, 1.2, -1.0), 58, 'Back corner of the house toward the woods: the treeline and the figure in the headlight beam'),
    ('N4_SideWall', (-0.6, 0.55, -6.0), (8.0, 1.0, -5.6), 60, 'Low along the north wall: where Norah flattens and Louis skids past'),
    ('I1_LivingCorner', (0.25, 2.15, -5.1), (2.4, 0.5, -2.3), 72, 'High in the living-room ceiling corner, looking down past the light fixture at the front door and hall mouth'),
    ('I2_KitchenFridge', (4.85, 0.95, -4.4), (7.8, 1.0, -4.05), 64, 'Low beside the fridge, its edge filling part of the frame: back door and bookshelf'),
    ('I3_HallEast', (7.85, 1.5, -2.75), (4.0, 1.15, -2.75), 62, 'Hallway east end at shoulder height: photos slide past, bedroom and bath doors both in frame'),
    ('I3b_HallWest', (4.15, 1.65, -2.75), (8.0, 1.0, -2.6), 62, 'Hallway west end: the kitchen doorway and the far end'),
    ('I4_BedroomDoor', (6.5, 1.8, -2.18), (7.6, 0.6, -0.9), 66, 'Bedroom doorway, half-hidden by the frame: bed, window, wardrobe, lockbox spot'),
    ('I5_BehindBed', (6.15, 0.95, -0.22), (8.0, 1.3, -1.25), 58, 'Low behind the bed: the window bursting inward, Louis landing on the bed'),
    ('B1_BathCorner', (5.7, 2.15, -0.15), (4.9, 0.6, -2.3), 72, 'Bathroom ceiling corner, tilted down over the tub at the door'),
    ('B2_HallFloor', (6.0, 0.25, -3.05), (4.9, 0.6, -2.3), 62, 'Hallway floor, low: the bath door opening onto Louis'),
]
for name, eye, tgt, fov, note in CAMS:
    S.node(name, 'Camera3D', 'Cameras', transform=T(eye, look_at_rows(eye, tgt)), fov=f(float(fov)), near='0.03', far='80.0',
           environment=S.ext_res('Environment', 'res://environments/env_norah_yard.tres' if name[0] in 'ACSN' else 'res://environments/env_norah_house.tres'), editor_description='"%s"' % note)
    # overview markers: a glowing block at the lens and a beam toward what it looks at (hidden in normal play)
    import math
    d = [tgt[i] - eye[i] for i in range(3)]; L = math.sqrt(sum(c * c for c in d)); u = [c / L for c in d]
    tip = [eye[i] + u[i] * 1.1 for i in range(3)]
    S.node(name, 'Node3D', 'CameraMarkers')
    box('CameraMarkers/' + name, eye[0] - 0.14, eye[0] + 0.14, 2.6, 2.75, eye[2] - 0.14, eye[2] + 0.14, 'marker', col=False)
    mid = [(eye[i] + tip[i]) / 2 for i in range(3)]
    yawdeg = math.degrees(math.atan2(u[0], u[2]))
    S.node('Beam', 'CSGBox3D', 'CameraMarkers/' + name, transform=T((mid[0], 2.66, mid[2]), yaw(yawdeg)), size=V3(0.06, 0.06, 1.1),
           material=S.ext_res('Material', M['marker_line']))
S.node('PlayerStart', 'Marker3D', '.', transform=T((-2.5, 0, -2.6)))
S.write(os.path.join(ROOT, 'scenes', 'environments', 'norah_house.tscn'))

# ------------------------------------------------------------------ review scene: PS1 viewport + capture driver
R = Scene()
R.node('NorahHouseReview', 'Node', parent=None, script=R.ext_res('Script', 'res://tests/house_review_driver.gd'))
R.node('Screen', 'SubViewportContainer', anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', stretch='true', stretch_shrink='3', texture_filter='1')
R.node('World', 'SubViewport', 'Screen', size='Vector2i(320, 240)', render_target_update_mode='4')
R.node('House', parent='Screen/World', instance=R.ext_res('PackedScene', 'res://scenes/environments/norah_house.tscn'))
post = R.sub_res('ShaderMaterial', shader=R.ext_res('Shader', 'res://shaders/ps1_post.gdshader'))
R.node('PostFX', 'CanvasLayer', 'Screen/World', layer='10')
R.node('Rect', 'ColorRect', 'Screen/World/PostFX', material=post, anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', mouse_filter='2')
R.write(os.path.join(ROOT, 'scenes', 'environments', 'norah_house_review.tscn'))
print('norah_house.tscn: %d nodes, %d cameras' % (len(S.nodes), len(CAMS)))
