#!/usr/bin/env python3
"""Louis Fermin's house (Chapter One, Part 7): scenes/environments/louis_house.tscn
Placed in world coordinates (no offset): next door to Norah, at the back right of the cul-de-sac, front door facing the road (west).
A tidy, lived-in two-storey house. Downstairs: living room, kitchen, his bedroom. Upstairs: one attic room with the open window.
  Footprint   X -3..4,   Z 9..15   (north = -Z, Norah's house is to the north)
  Living      X -3..1.2, Z 9..15   (front door on the west wall, stairs along the south wall rising east)
  Kitchen     X 1.2..4,  Z 9..12.2
  Bedroom     X 1.2..4,  Z 12.2..15
  Upstairs    y 2.5..4.5, the whole footprint, open window on the north wall
Run:  python3 tools/build_louis_house.py
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tscn import Scene, T, V3, V2, C, f, write_res, look_at_rows, yaw
from house_kit import Kit, rot_x, rot_z, mul, FACING

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = Scene()
M = {}
K = Kit(S, M, 'lh')
K.mat('wallpaper', 'lh_wallpaper.png', (0.8, 1 / 2.4), (0.95, 0.92, 0.85), affine=0.12)
K.mat('wall_kitchen', 'wall_foyer.png', (0.9, 1 / 2.4), (0.8, 0.8, 0.68), affine=0.12)
K.mat('attic_wall', 'wood.png', (1.2, 1.2), (0.6, 0.5, 0.4), affine=0.15)
K.mat('floor', 'floor_planks.png', (1.2, 1.2), (0.95, 0.9, 0.85), affine=0.3)
K.mat('floor_attic', 'floor_planks.png', (1.2, 1.2), (0.7, 0.66, 0.6), affine=0.3)
K.mat('lino', 'lino_check.png', (1.5, 1.5), (0.9, 0.88, 0.8), affine=0.3)
K.mat('ceiling', 'ceiling_tile.png', (1, 1), (0.8, 0.78, 0.72))
K.mat('siding', 'wood.png', (0.6, 1.8), (0.55, 0.62, 0.7), affine=0.2)
K.mat('trim', albedo=(0.86, 0.85, 0.8))
K.mat('roof', 'roof_shingle.png', (0.6, 0.6), (0.42, 0.36, 0.34))
K.mat('porch', 'floor_planks.png', (1, 1), (0.75, 0.72, 0.7))
K.mat('door', 'wood.png', (1, 1), (0.36, 0.42, 0.34))
K.mat('splinter', 'wood.png', (2, 2), (0.85, 0.72, 0.52))
K.mat('glass', albedo=(0.07, 0.09, 0.13))
K.mat('metal', albedo=(0.32, 0.32, 0.34)); K.mat('brass', albedo=(0.75, 0.6, 0.3), emis=0.15)
K.mat('wood_dark', 'wood.png', (1, 1), (0.42, 0.3, 0.22)); K.mat('wood', 'wood.png', (1, 1), (0.7, 0.55, 0.4))
K.mat('couch', 'cloth_mint.png', (2, 2), (0.55, 0.48, 0.32)); K.mat('chair_cloth', 'cloth_pink.png', (2, 2), (0.5, 0.36, 0.32))
K.mat('crochet', 'crochet.png', world=False); K.mat('rug', 'rug_braided.png', world=False, affine=0.2)
K.mat('quilt', 'quilt.png', (2, 2)); K.mat('sheet', albedo=(0.86, 0.85, 0.8)); K.mat('torn', 'cloth_yellow.png', (3, 3), (0.72, 0.66, 0.58))
K.mat('stain', albedo=(0.32, 0.22, 0.16)); K.mat('scorch', albedo=(0.1, 0.08, 0.07)); K.mat('wet', albedo=(0.06, 0.07, 0.08))
K.mat('fridge', albedo=(0.86, 0.84, 0.76)); K.mat('enamel', albedo=(0.9, 0.9, 0.86)); K.mat('counter', albedo=(0.62, 0.58, 0.46))
K.mat('burner', albedo=(0.12, 0.12, 0.12)); K.mat('pot', albedo=(0.5, 0.52, 0.55)); K.mat('stew', albedo=(0.35, 0.2, 0.12))
K.mat('toolbox', albedo=(0.66, 0.12, 0.1)); K.mat('tape', albedo=(0.7, 0.72, 0.74), emis=0.1)
K.mat('safe', albedo=(0.18, 0.24, 0.2)); K.mat('dial', albedo=(0.8, 0.8, 0.76))
K.mat('books_side', albedo=(0.75, 0.7, 0.6)); K.mat('spines', 'book_spines.png', world=False)
K.mat('bible', 'bible_open.png', world=False, affine=0.1); K.mat('leather', albedo=(0.22, 0.12, 0.1))
K.mat('print_mary', 'print_mary.png', world=False); K.mat('print_heart', 'print_heart.png', world=False)
K.mat('photo_porch', 'photo_porch.png', world=False); K.mat('calendar', 'calendar_chapel.png', world=False)
K.mat('frame', albedo=(0.3, 0.22, 0.15)); K.mat('frame_gold', albedo=(0.6, 0.5, 0.25))
K.mat('lampshade', albedo=(0.95, 0.85, 0.6), emis=1.0); K.mat('bulb', albedo=(1, 0.95, 0.75), emis=2.0)
K.mat('stone', albedo=(0.85, 0.85, 0.82)); K.mat('robe_blue', albedo=(0.45, 0.55, 0.72))
K.mat('flower_red', albedo=(0.6, 0.12, 0.12)); K.mat('mulch', albedo=(0.2, 0.14, 0.1))
K.mat('grass', 'grass.png', (0.5, 0.5), (0.55, 0.6, 0.45)); K.mat('dirt', 'concrete.png', (0.4, 0.4), (0.42, 0.34, 0.26))
K.mat('bark', 'wood.png', (1, 1), (0.3, 0.24, 0.2)); K.mat('tree', 'grass.png', (1, 1), (0.25, 0.3, 0.2)); K.mat('leaves', 'grass.png', (1, 1), (0.62, 0.36, 0.14))
K.mat('curtain', 'curtain_lace.png', (2, 2), (0.92, 0.9, 0.84)); K.mat('cardboard', albedo=(0.6, 0.48, 0.32))
K.mat('dressform', albedo=(0.16, 0.15, 0.15)); K.mat('beads', albedo=(0.45, 0.08, 0.1), emis=0.1)
K.mat('plate', albedo=(0.92, 0.92, 0.9)); K.mat('black', albedo=(0.05, 0.05, 0.05)); K.mat('red_glow', albedo=(0.8, 0.1, 0.05), emis=0.6)
K.mat('rail', 'wood.png', (1, 1), (0.5, 0.36, 0.26)); K.mat('radio', 'wood.png', (1, 1), (0.45, 0.28, 0.18))

S.node('LouisHouse', 'Node3D', parent=None)
for g in ['Geometry', 'Geometry/Floors', 'Geometry/Walls', 'Geometry/Ceilings', 'Geometry/Roof', 'Geometry/Stairs', 'Props', 'Living', 'Kitchen',
          'Bedroom', 'Upstairs', 'Exterior', 'Lights', 'Cameras', 'Anim']:
    S.node(g.split('/')[-1], 'Node3D', parent='.' if '/' not in g else g.rsplit('/', 1)[0])

XW, XE, ZN, ZS = -3.0, 4.0, 9.0, 15.0
X_IN, Z_KB = 1.2, 12.2              # living | (kitchen, bedroom);  kitchen | bedroom
C1, F2, C2 = 2.4, 2.5, 4.5          # ground ceiling, upstairs floor top, upstairs ceiling
ET, WT, DH = 0.18, 0.12, 2.05
SX0, SX1, SZ0, SZ1 = -2.0, 1.2, 14.1, 15.0      # stairs: bottom at SX0 (y 0), top at SX1 (y F2)
W = 'Geometry/Walls'

# ------------------------------------------------------------------ floors and ceilings
K.box('Geometry/Floors', XW, X_IN, -0.06, 0.02, ZN, ZS, 'floor')
K.box('Geometry/Floors', X_IN, XE, -0.06, 0.02, ZN, Z_KB, 'lino')
K.box('Geometry/Floors', X_IN, XE, -0.06, 0.02, Z_KB, ZS, 'floor')
for x0, x1, z0, z1 in ((XW, XE, ZN, SZ0), (XW, SX0, SZ0, ZS), (SX1, XE, SZ0, ZS)):     # upstairs slab, cut for the stairwell
    K.box('Geometry/Ceilings', x0, x1, C1, F2 - 0.02, z0, z1, 'ceiling')
    K.box('Geometry/Floors', x0, x1, F2 - 0.02, F2, z0, z1, 'floor_attic')
K.box('Geometry/Ceilings', XW, XE, C2, C2 + 0.06, ZN, ZS, 'attic_wall')

# ------------------------------------------------------------------ walls (ground floor)
FRONT_DOOR = (11.6, 12.4, 0, DH)
LIV_WINDOW = (9.5, 10.7, 0.9, 1.85)
KIT_WINDOW = (2.0, 2.9, 1.1, 1.8)
BACK_DOOR = (10.4, 11.2, 0, DH)
BED_WINDOW = (2.4, 3.3, 0.95, 1.85)
K.wall_x(W, XW, ZN, ZS, 'siding', holes=[FRONT_DOOR, LIV_WINDOW], t=ET, h=C2, m2='wallpaper')
K.wall_x(W, XE, ZN, ZS, 'wall_kitchen', holes=[BACK_DOOR], t=ET, h=C1, m2='siding')
K.wall_z(W, ZN, XW, XE, 'siding', holes=[KIT_WINDOW], t=ET, h=C1, m2='wallpaper')
K.wall_z(W, ZS, XW, XE, 'wallpaper', holes=[BED_WINDOW], t=ET, h=C1, m2='siding')
K.wall_x(W, X_IN, ZN, ZS, 'wallpaper', holes=[(9.8, 10.7, 0, DH), (12.5, 13.3, 0, DH)])
K.wall_z(W, Z_KB, X_IN, XE, 'wall_kitchen', m2='wallpaper')
# upstairs: exterior walls continue (attic), the open window on the north wall, a small gable window west
UP_WINDOW = (0.0, 1.0, 0.9, 1.8)
K.wall_x(W, XE, ZN, ZS, 'attic_wall', t=ET, h=C2 - C1, y=C1, m2='siding')
K.wall_z(W, ZN, XW, XE, 'siding', holes=[UP_WINDOW], t=ET, h=C2 - C1, y=C1, m2='attic_wall')
K.wall_z(W, ZS, XW, XE, 'attic_wall', t=ET, h=C2 - C1, y=C1, m2='siding')
# (the west wall already runs to C2 above the front door)

# trim: door casings, windows, baseboards
for a, b in ((9.8, 10.7), (12.5, 13.3)): K.casing(W, 'x', X_IN, a, b, 0, DH, 'trim')
K.casing(W, 'x', XW, 11.6, 12.4, 0, DH, 'trim', t=ET)
K.casing(W, 'x', XE, 10.4, 11.2, 0, DH, 'trim', t=ET)
K.window(W, 'x', XW, 9.5, 10.7, 0.9, 1.85, 'trim', 'glass', t=ET, name='LivingWindow')
K.window(W, 'z', ZN, 2.0, 2.9, 1.1, 1.8, 'trim', 'glass', t=ET, name='KitchenWindow')
K.window(W, 'z', ZS, 2.4, 3.3, 0.95, 1.85, 'trim', 'glass', t=ET, name='BedroomWindow')
K.window(W, 'z', ZN, 0.0, 1.0, F2 + 0.8, F2 + 1.7, 'trim', 'glass', t=ET, name='UpWindow', open_=True, mullion=False)
K.baseboards(W, [(XW, X_IN, ZN, ZS, 0.02), (X_IN, XE, ZN, Z_KB, 0.02), (X_IN, XE, Z_KB, ZS, 0.02)], 'wood_dark')
K.box(W, XW + 0.09, X_IN - 0.06, C1 - 0.06, C1, ZN + 0.09, ZN + 0.11, 'trim', col=False)       # crown moulding, living north wall
K.box(W, XW + 0.09, XW + 0.11, C1 - 0.06, C1, ZN + 0.09, ZS - 0.06, 'trim', col=False)
K.curtains(W, 'x', XW, 9.5, 10.7, 0.9, 1.85, 'curtain', inside=1)
K.curtains(W, 'z', ZN, 2.0, 2.9, 1.1, 1.8, 'curtain', inside=1)
K.curtains(W, 'z', ZS, 2.4, 3.3, 0.95, 1.85, 'curtain', inside=-1)
K.box(W, 3.95, 4.0, 0, DH, 10.4, 11.2, 'door', name='BackDoor')                                   # closed and locked

# the front door: smashed open and split in two
K.cbox(W, (XW - 0.02, 1.25, 11.82), (0.05, 1.5, 0.42), 'door', rot=mul(yaw(-62), rot_x(4)), name='DoorHalfHanging')   # still on the top hinge, swung in
K.cbox(W, (XW + 0.55, 0.05, 12.25), (0.42, 0.05, 0.95), 'door', rot=mul(yaw(18), rot_z(4)), name='DoorHalfFloor')      # on the floor inside
for i, (x, z, a) in enumerate(((-2.7, 12.6, 30), (-2.4, 11.9, 75), (-3.3, 12.1, 10), (-2.2, 12.4, 120), (-2.9, 11.5, 60))):
    K.cbox('Props', (x, 0.03, z), (0.04, 0.025, 0.22), 'splinter', rot=yaw(a))
K.box(W, XW - 0.12, XW - 0.07, 0.9, 1.2, 12.38, 12.44, 'splinter', col=False)                # the jamb torn at the lock

# ------------------------------------------------------------------ stairs (south wall of the living room, rising east)
STEPS = 12
for i in range(STEPS):
    x0 = SX0 + (SX1 - SX0) * i / STEPS; x1 = SX0 + (SX1 - SX0) * (i + 1) / STEPS; y = F2 * (i + 1) / STEPS
    K.box('Geometry/Stairs', x0, x1 + 0.02, y - 0.04, y, SZ0 + 0.02, SZ1 - 0.08, 'wood', col=False)            # tread
    K.box('Geometry/Stairs', x0 - 0.01, x0 + 0.01, y - F2 / STEPS, y, SZ0 + 0.02, SZ1 - 0.08, 'trim', col=False)   # riser
    K.box('Geometry/Stairs', x0, x1, 0, y - 0.04, SZ0 - 0.03, SZ0 + 0.03, 'wallpaper', col=True)             # side panel under the stairs
K.ramp('Geometry/Stairs', SX0 - 0.05, 0.0, SX1, F2, SZ0, SZ1 - 0.08)
for i in range(7):                                                                                       # banister on the open side
    x = SX0 + 0.1 + i * (SX1 - SX0 - 0.2) / 6; y = F2 * (x - SX0) / (SX1 - SX0)
    K.box('Geometry/Stairs', x - 0.02, x + 0.02, y, y + 0.85, SZ0 + 0.03, SZ0 + 0.07, 'rail', col=False)
L_ = math.hypot(SX1 - SX0, F2); ang = math.degrees(math.atan2(F2, SX1 - SX0))
K.cbox('Geometry/Stairs', ((SX0 + SX1) / 2, F2 / 2 + 0.88, SZ0 + 0.05), (L_, 0.05, 0.07), 'rail', rot=rot_z(ang))
K.box('Geometry/Stairs', SX0 - 0.06, SX0 + 0.02, 0, 1.0, SZ0 + 0.02, SZ0 + 0.1, 'rail')                  # newel post
# upstairs railing around the stairwell (north and west sides)
K.box('Geometry/Stairs', SX0, SX1, F2, F2 + 0.9, SZ0 - 0.06, SZ0, 'rail')
K.box('Geometry/Stairs', SX0 - 0.06, SX0, F2, F2 + 0.9, SZ0, SZ1, 'rail')
K.box('Geometry/Stairs', 0.0, SX1, 0, 1.4, SZ0 + 0.03, SZ1, 'wallpaper')                                  # closet under the high end
K.box('Geometry/Stairs', -0.02, 0.02, 0, 1.3, SZ0 + 0.08, SZ1 - 0.1, 'door', col=False)

# ------------------------------------------------------------------ living room: devout, tidy, lived in
LV = 'Living'
K.box(LV, -1.0, 1.0, 0.02, 0.03, 10.3, 12.2, 'rug', col=False)                                               # braided rug
# couch against the north wall, crochet throw over the back
K.box(LV, -1.9, 0.5, 0.0, 0.45, 9.12, 9.95, 'couch'); K.box(LV, -1.9, 0.5, 0.45, 0.95, 9.12, 9.35, 'couch')
K.box(LV, -2.05, -1.9, 0.0, 0.65, 9.12, 9.95, 'couch'); K.box(LV, 0.5, 0.65, 0.0, 0.65, 9.12, 9.95, 'couch')
K.box(LV, -1.2, 0.0, 0.7, 0.98, 9.33, 9.38, 'crochet', col=False)
K.box(LV, -1.75, -1.2, 0.45, 0.6, 9.4, 9.85, 'chair_cloth', col=False)                                    # cushion
# the crucifix over the couch
K.box(LV, -0.88, -0.82, 1.3, 1.95, ZN + 0.09, ZN + 0.12, 'wood_dark', col=False, name='CrucifixPost')
K.box(LV, -1.05, -0.65, 1.72, 1.77, ZN + 0.09, ZN + 0.12, 'wood_dark', col=False, name='CrucifixBeam')
K.box(LV, -0.87, -0.83, 1.45, 1.72, ZN + 0.12, ZN + 0.135, 'brass', col=False)                        # the corpus
K.box(LV, -0.97, -0.73, 1.7, 1.73, ZN + 0.12, ZN + 0.135, 'brass', col=False)
# prints either side
K.frame_pic(LV, (-1.65, 1.6, ZN + 0.1), 0.24, 0.32, '+z', 'print_mary', 'frame_gold', tilt=-1)
K.frame_pic(LV, (0.05, 1.6, ZN + 0.1), 0.24, 0.32, '+z', 'print_heart', 'frame_gold', tilt=1.5)
# side table with the rosary and a lamp
K.box(LV, 0.7, 1.08, 0.0, 0.55, 9.15, 9.55, 'wood_dark')
K.cyl(LV, (0.89, 0.67, 9.32), 0.07, 0.24, 'brass', sides=6); K.cyl(LV, (0.89, 0.86, 9.32), 0.13, 0.16, 'lampshade', sides=8)
for k in range(14):                                                                                           # rosary beads in a loose loop
    a = k / 14 * math.tau; K.cbox(LV, (0.86 + math.cos(a) * 0.09, 0.565, 9.46 + math.sin(a) * 0.05), (0.018, 0.018, 0.018), 'beads')
K.box(LV, 0.93, 0.945, 0.556, 0.566, 9.38, 9.46, 'beads', col=False); K.box(LV, 0.915, 0.96, 0.556, 0.566, 9.405, 9.415, 'brass', col=False)
# coffee table, a mug and his reading glasses
K.box(LV, -1.3, 0.1, 0.0, 0.42, 10.75, 11.2, 'wood'); K.cyl(LV, (-0.2, 0.47, 10.9), 0.04, 0.09, 'plate', sides=6)
K.box(LV, -0.85, -0.65, 0.42, 0.44, 10.92, 10.98, 'black', col=False)
# armchair by the front window, floor lamp (the one light he left on), and the Bible on its stand
K.box(LV, -2.85, -2.2, 0.0, 0.45, 9.85, 10.55, 'chair_cloth'); K.box(LV, -2.92, -2.8, 0.0, 1.05, 9.85, 10.55, 'chair_cloth')
K.box(LV, -2.85, -2.2, 0.0, 0.65, 9.78, 9.88, 'chair_cloth'); K.box(LV, -2.85, -2.2, 0.0, 0.65, 10.52, 10.62, 'chair_cloth')
K.cyl(LV, (-2.65, 0.75, 9.35), 0.025, 1.5, 'brass', sides=6); K.cyl(LV, (-2.65, 1.55, 9.35), 0.17, 0.24, 'lampshade', sides=8, name='FloorLampShade')
K.box(LV, -2.85, -2.45, 0.0, 0.9, 10.85, 11.3, 'wood_dark')                                                   # reading stand
K.cbox(LV, (-2.6, 0.93, 11.075), (0.34, 0.03, 0.42), 'leather', rot=rot_z(-14))
K.quad(LV, (-2.595, 0.955, 11.075), 0.4, 0.28, mul(rot_z(-14), mul(FACING['up'], rot_z(90))), 'bible', name='BibleOpen')
# coat hooks by the door: his jacket, a flat cap, boots on a mat
K.box(LV, XW + 0.09, XW + 0.12, 1.55, 1.6, 12.6, 13.2, 'wood_dark', col=False)
K.box(LV, XW + 0.1, XW + 0.22, 0.85, 1.55, 12.65, 12.95, 'chair_cloth', col=False)
K.box(LV, XW + 0.1, XW + 0.25, 1.5, 1.6, 13.0, 13.2, 'stain', col=False)
K.box(LV, XW + 0.1, XW + 0.55, 0.02, 0.03, 12.55, 13.25, 'mulch', col=False)
for z in (12.7, 12.95): K.box(LV, XW + 0.15, XW + 0.45, 0.03, 0.18, z, z + 0.12, 'black', col=False)
# console radio, bookshelf between the doorways, a wall clock stopped at 7:40
K.box(LV, 0.62, 1.12, 0.0, 0.85, 13.42, 14.0, 'radio'); K.box(LV, 0.61, 0.62, 0.45, 0.7, 13.5, 13.92, 'stain', col=False)
K.box(LV, 0.82, 1.14, 0.0, 1.9, 10.95, 12.3, 'wood_dark')
for y in (0.12, 0.6, 1.08, 1.55): K.books(LV, 0.83, 1.12, y, 11.0, 12.25, 'spines', axis='z')
K.cyl(LV, (-0.6, 2.0, ZN + 0.12), 0.14, 0.04, 'plate', sides=12, rot=rot_x(90))
K.box(LV, -0.61, -0.59, 1.88, 2.0, ZN + 0.145, ZN + 0.15, 'black', col=False); K.box(LV, -0.6, -0.5, 1.99, 2.01, ZN + 0.145, ZN + 0.15, 'black', col=False)
K.box(LV, XW + 0.09, XW + 0.095, 1.3, 1.52, 14.3, 14.58, 'trim', col=False)                                # a clean patch of wallpaper: a frame came down
K.box(LV, XW + 0.09, XW + 0.12, 1.4, 1.43, 14.4, 14.43, 'metal', col=False)

# ------------------------------------------------------------------ kitchen: a cold pot on the stove, dinner for one
KT = 'Kitchen'
K.box(KT, 1.3, 3.05, 0.0, 0.88, 9.1, 9.7, 'wood'); K.box(KT, 1.28, 3.07, 0.88, 0.92, 9.08, 9.72, 'counter')
K.box(KT, 2.05, 2.75, 0.75, 0.9, 9.2, 9.6, 'metal', col=False)                                             # sink
K.cyl(KT, (2.4, 1.02, 9.18), 0.015, 0.2, 'metal', sides=6)
K.box(KT, 3.08, 3.7, 0.0, 0.9, 9.1, 9.7, 'enamel', name='Stove'); K.box(KT, 3.08, 3.7, 0.9, 1.1, 9.1, 9.18, 'enamel')
for x, z in ((3.24, 9.3), (3.54, 9.3), (3.24, 9.55), (3.54, 9.55)): K.cyl(KT, (x, 0.905, z), 0.09, 0.01, 'burner', sides=8)
K.cyl(KT, (3.24, 0.99, 9.55), 0.13, 0.17, 'pot', sides=10, name='Pot'); K.cyl(KT, (3.24, 1.06, 9.55), 0.12, 0.02, 'stew', sides=10)
K.box(KT, 3.35, 3.38, 1.06, 1.12, 9.48, 9.75, 'wood_dark', col=False)                                     # wooden spoon
K.box(KT, 3.1, 3.68, 1.12, 1.14, 9.1, 9.14, 'red_glow', col=False)                                        # stove clock blinking 12:00 (power came back)
K.box(KT, 1.35, 1.8, 0.92, 1.12, 9.18, 9.48, 'toolbox', name='Toolbox'); K.box(KT, 1.48, 1.68, 1.12, 1.15, 9.31, 9.35, 'metal', col=False)
K.cyl(KT, (1.95, 0.96, 9.33), 0.06, 0.05, 'tape', sides=10, name='DuctTape')
K.box(KT, 1.3, 3.05, 1.45, 1.47, 9.1, 9.4, 'wood_dark', col=False)                                        # shelf over the counter
for k, x in enumerate((1.4, 1.6, 1.85, 2.1)): K.cyl(KT, (x, 1.53, 9.25), 0.05, 0.12, ['plate', 'cardboard', 'pot', 'plate'][k], sides=6)
K.box(KT, 3.35, 3.95, 0.0, 1.75, 11.45, 12.08, 'fridge'); K.box(KT, 3.34, 3.36, 0.9, 1.4, 11.55, 11.6, 'metal', col=False)
K.box(KT, 3.335, 3.34, 1.2, 1.38, 11.65, 11.85, 'plate', col=False)                                       # a note on the fridge: grocery list
K.box(KT, 1.65, 2.45, 0.0, 0.74, 10.95, 11.65, 'wood'); K.box(KT, 2.5, 2.85, 0.0, 0.45, 11.1, 11.45, 'wood_dark')
K.box(KT, 2.8, 2.85, 0.45, 0.95, 11.1, 11.45, 'wood_dark')
K.cyl(KT, (2.05, 0.75, 11.3), 0.11, 0.015, 'plate', sides=10); K.box(KT, 2.2, 2.22, 0.75, 0.76, 11.2, 11.42, 'metal', col=False)
K.cyl(KT, (1.8, 0.79, 11.1), 0.03, 0.09, 'glass', sides=6)
K.quad(KT, (2.6, 1.55, Z_KB - 0.07), 0.24, 0.32, '-z', 'calendar', name='ChapelCalendar')
K.box(KT, XE - 0.12, XE - 0.09, 0.0, 0.02, 10.4, 11.2, 'mulch', col=False)

# ------------------------------------------------------------------ his bedroom: sheets torn apart from the inside, the floor safe
BD = 'Bedroom'
K.box(BD, 2.05, 3.95, 0.0, 0.35, 13.2, 14.6, 'wood_dark'); K.box(BD, 3.85, 3.95, 0.35, 1.05, 13.2, 14.6, 'wood_dark')
K.box(BD, 2.1, 3.85, 0.35, 0.5, 13.25, 14.55, 'sheet')
# the burst: sheet strips torn outward from the middle, scorched at the tears, the quilt flung off
for k, (x, z, a, tl) in enumerate(((2.6, 13.6, 20, 40), (2.9, 14.2, -35, 50), (3.2, 13.5, 70, -45), (2.4, 14.1, 110, 30), (3.4, 14.3, -70, -35),
                                    (2.7, 13.9, 160, 60), (3.05, 13.85, 200, -55))):
    K.cbox(BD, (x, 0.58, z), (0.06, 0.32, 0.22), 'torn', rot=mul(yaw(a), rot_z(tl)))
K.box(BD, 2.5, 3.3, 0.5, 0.52, 13.6, 14.2, 'scorch', col=False)
K.cbox(BD, (1.85, 0.12, 13.4), (0.7, 0.18, 0.9), 'quilt', rot=yaw(24))
K.box(BD, 3.5, 3.82, 0.5, 0.64, 13.3, 13.6, 'sheet', col=False)                                           # pillow
K.box(BD, 3.45, 3.95, 0.0, 0.55, 14.62, 14.95, 'wood'); K.cyl(BD, (3.7, 0.65, 14.78), 0.1, 0.2, 'lampshade', sides=8)
K.box(BD, 3.92, 3.95, 1.3, 1.75, 13.75, 13.8, 'wood_dark', col=False); K.box(BD, 3.92, 3.95, 1.58, 1.62, 13.65, 13.9, 'wood_dark', col=False)
K.box(BD, 2.5, 3.7, 0.0, 0.85, 12.3, 12.75, 'wood')                                                       # dresser
K.box(BD, 2.55, 3.65, 0.3, 0.32, 12.745, 12.76, 'wood_dark', col=False); K.box(BD, 2.55, 3.65, 0.6, 0.62, 12.745, 12.76, 'wood_dark', col=False)
K.frame_pic(BD, (2.9, 0.98, 12.45), 0.16, 0.2, '+z', 'print_mary', 'frame_gold', tilt=-6)
K.box(BD, 3.2, 3.5, 0.85, 0.88, 12.35, 12.6, 'black', col=False)                                          # wallet, keys
K.frame_pic(BD, (2.2, 1.6, Z_KB + 0.07), 0.3, 0.4, '+z', 'print_heart', 'frame_gold')
# the floor safe in the corner
K.box(BD, 1.3, 1.82, 0.0, 0.55, 14.35, 14.9, 'safe', name='Safe')
K.cyl(BD, (1.56, 0.32, 14.345), 0.06, 0.02, 'dial', sides=10, rot=rot_x(90), name='SafeDial')
K.box(BD, 1.66, 1.72, 0.18, 0.22, 14.33, 14.35, 'brass', col=False)
K.box(BD, 1.3, 1.82, 0.0, 0.55, 14.32, 14.36, 'safe', col=False, name='SafeDoor')
K.box(BD, 1.25, 2.0, 0.02, 0.025, 13.6, 14.3, 'rug', col=False)

# ------------------------------------------------------------------ upstairs: storage, a dress form, the open window, wet footprints
UP = 'Upstairs'
y = F2
for k, (x, z, w, h, d) in enumerate(((-2.6, 13.4, 0.55, 0.45, 0.5), (-2.6, 13.4, 0.5, 0.35, 0.45), (-1.9, 13.6, 0.5, 0.5, 0.45),
                                      (3.3, 9.6, 0.6, 0.45, 0.5), (3.3, 10.2, 0.55, 0.4, 0.5), (3.5, 13.2, 0.5, 0.6, 0.6))):
    yy = y + (0.45 if k == 1 else 0.0)
    K.box(UP, x - w / 2, x + w / 2, yy, yy + h, z - d / 2, z + d / 2, 'cardboard', col=(k != 1))
K.box(UP, -2.0, -1.65, y + 0.3, y + 0.38, 13.37, 13.385, 'black', col=False)                             # "XMAS" scrawl
K.cyl(UP, (-1.2, y + 0.75, 10.0), 0.03, 1.5, 'wood_dark', sides=6)                                        # the dress form, by the window
K.cyl(UP, (-1.2, y + 1.25, 10.0), 0.2, 0.55, 'dressform', sides=8); K.cyl(UP, (-1.2, y + 1.6, 10.0), 0.12, 0.12, 'dressform', sides=8)
K.box(UP, -1.35, -1.05, y, y + 0.03, 9.85, 10.15, 'wood_dark', col=False)
K.box(UP, 1.8, 2.5, y, y + 0.45, 10.5, 11.1, 'wood'); K.box(UP, 2.45, 2.5, y + 0.45, y + 1.0, 10.5, 11.1, 'wood')   # rocking chair
K.box(UP, 1.8, 2.5, y, y + 0.03, 10.4, 10.45, 'wood_dark', col=False)
K.box(UP, 2.6, 3.9, y, y + 0.75, 14.2, 14.9, 'wood_dark')                                                # an old sewing table
K.box(UP, -0.1, 1.1, y + 0.02, y + 0.03, 9.15, 9.6, 'wet', col=False, name='WetPatch')
for k in range(5):                                                                                         # bare wet footprints, from the stairwell to the window
    px = 0.9 - k * 0.12 + (0.06 if k % 2 else -0.06); pz = 13.4 - k * 0.85
    K.box(UP, px - 0.05, px + 0.05, y + 0.005, y + 0.012, pz - 0.12, pz + 0.12, 'wet', col=False)
K.box(UP, 0.1, 0.45, F2 + 0.8, F2 + 0.82, ZN - 0.09, ZN + 0.05, 'wet', col=False)                       # a handprint on the sill
K.omni(UP, 'AtticLamp', (1.5, C2 - 0.2, 12.0), (0.9, 0.85, 0.7), 0.0, 4.0)                                # pull-chain bulb (off)
K.cyl(UP, (1.5, C2 - 0.08, 12.0), 0.05, 0.1, 'bulb', sides=6)
# the curtains in the open window, animated by the director (Anim/CurtainL, Anim/CurtainR)
S.node('CurtainL', 'Node3D', 'Anim', transform=T((0.05, F2 + 1.78, ZN + 0.1)))
K.box('Anim/CurtainL', 0.0, 0.45, -1.15, 0.0, -0.02, 0.02, 'curtain', col=False)
S.node('CurtainR', 'Node3D', 'Anim', transform=T((0.95, F2 + 1.78, ZN + 0.1)))
K.box('Anim/CurtainR', -0.45, 0.0, -1.15, 0.0, -0.02, 0.02, 'curtain', col=False)

# ------------------------------------------------------------------ exterior: porch, roof, Mary in the flower bed, the walk from Norah's
E = 'Exterior'
K.box(E, -12, 12, -0.3, -0.05, 15.5, 30, 'grass')                                                          # extends the yard to the south
K.box(E, -4.45, XW, 0.0, 0.1, 10.6, 13.4, 'porch')
K.box(E, -4.85, -4.45, 0.0, 0.05, 11.4, 12.6, 'porch')
for z in (10.68, 13.32): K.box(E, -4.42, -4.34, 0.12, 2.45, z - 0.04, z + 0.04, 'trim')
K.box(E, -4.45, -4.36, 0.12, 0.95, 10.65, 11.45, 'trim'); K.box(E, -4.45, -4.36, 0.12, 0.95, 12.55, 13.35, 'trim')     # rails
K.cbox(E, (-3.75, 2.55, 12.0), (1.6, 0.08, 3.0), 'roof', rot=rot_z(-12))
K.box(E, -3.3, -3.18, 1.95, 2.15, 12.55, 12.67, 'bulb', col=False, name='PorchBulb')
K.box(E, -4.2, -3.6, 0.12, 0.5, 13.0, 13.3, 'wood_dark')                                                     # bench
K.box(E, -4.3, -3.3, 0.12, 0.13, 11.6, 12.4, 'mulch', col=False)                                            # doormat
# the roof: gable along X, eaves overhang
for side in (-1, 1):
    zc = 12.0 + side * 1.6
    K.cbox('Geometry/Roof', (0.5, C2 + 0.62, zc), (7.8, 0.1, 3.45), 'roof', rot=rot_x(side * 24), col=False)
for xg in (XW, XE):
    for z0, z1, y0, y1 in ((9.2, 14.8, C2, C2 + 0.45), (10.2, 13.8, C2 + 0.45, C2 + 0.9), (11.2, 12.8, C2 + 0.9, C2 + 1.3)):
        K.box('Geometry/Roof', xg - 0.08, xg + 0.08, y0, y1, z0, z1, 'siding', col=False)
K.box('Geometry/Roof', 2.8, 3.3, C2 + 0.5, C2 + 1.9, 13.4, 13.9, 'stain', col=False)                       # chimney
for z in (ZN - 0.25, ZS + 0.25): K.box('Geometry/Roof', XW - 0.3, XE + 0.3, C2 - 0.1, C2, z - 0.06, z + 0.06, 'metal', col=False)   # gutters
K.box('Geometry/Roof', XW - 0.18, XW - 0.1, 0.0, C2, ZN - 0.25, ZN - 0.17, 'metal', col=False)            # downspout
# the Virgin Mary in a flower bed on the front lawn
K.box(E, -6.6, -5.4, 0.0, 0.08, 9.6, 10.8, 'mulch')
K.cyl(E, (-6.0, 0.25, 10.2), 0.18, 0.34, 'stone', sides=8, col=True)
K.cyl(E, (-6.0, 0.75, 10.2), 0.14, 0.68, 'robe_blue', sides=8); K.cyl(E, (-6.0, 1.17, 10.2), 0.07, 0.16, 'stone', sides=8)
K.cyl(E, (-6.0, 1.3, 10.2), 0.12, 0.02, 'brass', sides=10)
for x, z in ((-6.4, 9.8), (-5.6, 9.85), (-6.45, 10.6), (-5.55, 10.55), (-6.0, 10.7)): K.box(E, x - 0.06, x + 0.06, 0.08, 0.2, z - 0.06, z + 0.06, 'flower_red', col=False)
# the worn walk across the grass from Norah's porch, and a gravel lead to his steps
for k in range(12):
    t = k / 11; x = -1.4 + (-5.2 + 1.4) * t; z = -1.4 + (12.0 + 1.4) * t
    K.cbox(E, (x, -0.04, z), (0.9, 0.02, 1.4), 'dirt', rot=yaw(-16))
K.box(E, -5.5, -4.85, -0.05, -0.015, 11.6, 12.4, 'dirt', col=False)
K.box(E, -7.5, -6.9, 0.0, 1.05, 12.6, 12.75, 'wood_dark'); K.box(E, -7.65, -6.75, 1.05, 1.35, 12.45, 12.9, 'metal', col=False)   # mailbox
# trees behind and beside his house (fall colours, some bare)
r = random.Random(17)
for i in range(16): K.tree(E, r.uniform(-10, 10), r.uniform(17.5, 26), r.uniform(6, 9.5), rnd=r, leaves='leaves' if r.random() < 0.5 else 'tree', bare=r.random() < 0.25)
for i in range(6): K.tree(E, r.uniform(6, 10.5), r.uniform(6, 16), r.uniform(6, 9), rnd=r, leaves='leaves', bare=r.random() < 0.3)

# ------------------------------------------------------------------ lights
L = 'Lights'
K.omni(L, 'PorchLight', (-3.4, 1.95, 12.6), (1, 0.82, 0.5), 1.4, 7.0)
K.omni(L, 'FloorLamp', (-2.65, 1.45, 9.45), (1, 0.75, 0.45), 0.7, 4.5)
K.omni(L, 'TableLamp', (0.89, 0.9, 9.32), (1, 0.75, 0.45), 0.0, 3.0)
K.omni(L, 'StoveClock', (3.4, 1.15, 9.3), (1, 0.15, 0.08), 0.25, 1.4, shadow=False)
K.omni(L, 'MoonWindow', (0.5, F2 + 1.4, 8.6), (0.5, 0.58, 0.8), 0.7, 4.5)
K.omni(L, 'BedroomMoon', (2.85, 1.5, 15.4), (0.45, 0.52, 0.72), 0.35, 3.0)
K.omni(L, 'YardMoonSouth', (-5.0, 6.0, 5.0), (0.45, 0.52, 0.75), 0.75, 16.0, shadow=False)
K.omni(L, 'YardMoonWest', (-9.0, 5.5, 13.0), (0.45, 0.52, 0.75), 0.5, 12.0, shadow=False)

# ------------------------------------------------------------------ cameras
CAMS = [
    ('LY1_WalkOver', (-3.6, 2.9, 0.6), (-4.4, 0.6, 11.0), 52, 'Off the corner of Norah\'s porch: her back, the walk across the dark grass to his lit porch'),
    ('LY2_LouisPorch', (-6.9, 0.55, 14.6), (-3.0, 1.0, 11.9), 54, 'Low at the corner of his lawn: the split door under the porch light, Mary in the bed'),
    ('LH1_LivingNE', (1.0, 2.25, 9.4), (-2.5, 0.6, 13.6), 70, 'Living room, high in the NE corner: front door, armchair and Bible, foot of the stairs'),
    ('LH2_LivingSW', (-2.75, 2.25, 13.75), (0.0, 1.0, 9.2), 66, 'Living room, high SW: couch and crucifix, the kitchen doorway'),
    ('LH3_Kitchen', (3.85, 2.2, 12.0), (1.9, 0.9, 9.35), 68, 'Kitchen, SE ceiling corner: stove and pot, toolbox, the doorway'),
    ('LH4_Bedroom', (3.85, 2.2, 12.4), (1.7, 0.4, 14.6), 70, 'Bedroom, NE corner: the torn bed, the safe in the far corner'),
    ('LH5_Stairs', (1.75, 4.25, 14.62), (-2.3, 0.5, 14.45), 66, 'Top of the stairs, high, looking down: her face as she climbs into the dark'),
    ('LH6_Upstairs', (3.75, 4.3, 14.75), (0.4, 3.1, 9.3), 66, 'Upstairs, far corner: the dress form, the open window, curtains blowing'),
    ('LH7_Window', (1.75, 3.75, 10.3), (0.2, 3.15, 8.9), 60, 'Beside the open window: rain, the dark yard, the wet sill, Norah at the edge of frame'),
]
for name, eye, tgt, fov, note in CAMS:
    S.node(name, 'Camera3D', 'Cameras', transform=T(eye, look_at_rows(eye, tgt)), fov=f(float(fov)), near='0.03', far='80.0',
           environment=S.ext_res('Environment', 'res://environments/env_norah_yard.tres' if name.startswith('LY') else 'res://environments/env_norah_house.tres'),
           editor_description='"%s"' % note)
S.write(os.path.join(ROOT, 'scenes', 'environments', 'louis_house.tscn'))
print('louis_house.tscn: %d nodes, %d cameras' % (len(S.nodes), len(CAMS)))
