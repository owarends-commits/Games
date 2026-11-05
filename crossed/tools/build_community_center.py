#!/usr/bin/env python3
"""Generates the community center blockout scenes for Godot 4.

Writes:
  materials/*.tres, environments/*.tres
  scenes/characters/player.tscn
  scenes/environments/community_center.tscn
  scenes/prologue/community_center_test.tscn

Coordinates follow the master debrief: 1 unit = 1 m, Y up, north = -Z, east = +X.
The main entrance threshold is at (0, 0, 0); the building extends north.
Re-run after editing the numbers below:  python3 tools/build_community_center.py
"""
import math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CEIL = 3.2            # ceiling height
WALL_H = 3.4          # walls run up to the roof slab
EXT_T = 0.25          # exterior wall thickness
INT_T = 0.2           # interior wall thickness

# ---------------------------------------------------------------- helpers
def f(v): return ('%.4f' % v).rstrip('0').rstrip('.') if isinstance(v, float) else str(v)
def V3(x, y, z): return 'Vector3(%s, %s, %s)' % (f(float(x)), f(float(y)), f(float(z)))
def V2(x, y): return 'Vector2(%s, %s)' % (f(float(x)), f(float(y)))
def C(r, g, b, a=1.0): return 'Color(%s, %s, %s, %s)' % (f(float(r)), f(float(g)), f(float(b)), f(float(a)))
def norm(v): l = math.sqrt(sum(c * c for c in v)); return [c / l for c in v]
def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
def T(pos=(0, 0, 0), rows=((1, 0, 0), (0, 1, 0), (0, 0, 1))):
    vals = [rows[i][j] for i in range(3) for j in range(3)] + list(pos)
    return 'Transform3D(%s)' % ', '.join(f(float(v)) for v in vals)
def yaw(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return ((c, 0, s), (0, 1, 0), (-s, 0, c))
def look_at_rows(eye, target, up=(0, 1, 0)):
    z = norm([eye[i] - target[i] for i in range(3)]); x = norm(cross(up, z)); y = cross(z, x)
    return ((x[0], y[0], z[0]), (x[1], y[1], z[1]), (x[2], y[2], z[2]))
ROT_Z90 = ((0, -1, 0), (1, 0, 0), (0, 0, 1))      # cylinder axis Y -> X
ROT_X90 = ((1, 0, 0), (0, 0, -1), (0, 1, 0))      # cylinder axis Y -> Z
FLIP = ((1, 0, 0), (0, -1, 0), (0, 0, -1))        # plane facing down (ceilings)

class Scene:
    def __init__(s): s.ext, s.sub, s.nodes, s._n = [], [], [], 0
    def ext_res(s, typ, path):
        for t, p, i in s.ext:
            if p == path: return 'ExtResource("%s")' % i
        i = '%d_%s' % (len(s.ext) + 1, os.path.splitext(os.path.basename(path))[0][:12]); s.ext.append((typ, path, i))
        return 'ExtResource("%s")' % i
    def sub_res(s, typ, **props):
        s._n += 1; i = '%s_%d' % (typ, s._n); s.sub.append((typ, i, props)); return 'SubResource("%s")' % i
    def node(s, name, typ=None, parent='.', instance=None, groups=None, **props):
        s.nodes.append((name, typ, parent, instance, groups, props)); return name if parent in ('.', None) else (parent + '/' + name)
    def write(s, path):
        out = ['[gd_scene load_steps=%d format=3]' % (len(s.ext) + len(s.sub) + 1), '']
        for t, p, i in s.ext: out += ['[ext_resource type="%s" path="%s" id="%s"]' % (t, p, i)]
        out += ['']
        for t, i, props in s.sub:
            out += ['[sub_resource type="%s" id="%s"]' % (t, i)] + ['%s = %s' % (k, v) for k, v in props.items()] + ['']
        for name, typ, parent, inst, groups, props in s.nodes:
            head = '[node name="%s"' % name
            if typ: head += ' type="%s"' % typ
            if parent is not None: head += ' parent="%s"' % parent
            if inst: head += ' instance=%s' % inst
            np = [k for k, v in props.items() if isinstance(v, str) and v.startswith('NodePath(') and k != 'editor_description']
            if np: head += ' node_paths=PackedStringArray(%s)' % ', '.join('"%s"' % k for k in np)
            if groups: head += ' groups=[%s]' % ', '.join('"%s"' % g for g in groups)
            out += [head + ']'] + ['%s = %s' % (k, v) for k, v in props.items()] + ['']
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w').write('\n'.join(out))

def write_res(path, typ, ext, props):
    out = ['[gd_resource type="%s" load_steps=%d format=3]' % (typ, len(ext) + 1), '']
    for i, (t, p) in enumerate(ext): out.append('[ext_resource type="%s" path="%s" id="%d"]' % (t, p, i + 1))
    out += ['', '[resource]'] + ['%s = %s' % (k, v) for k, v in props.items()] + ['']
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'w').write('\n'.join(out))

# ---------------------------------------------------------------- materials
SURF = 'res://shaders/ps1_surface.gdshader'
def mat(name, tex='white.png', scale=(1, 1), albedo=(1, 1, 1), world=True, affine=0.6, emis=0.0):
    write_res(os.path.join(ROOT, 'materials', name + '.tres'), 'ShaderMaterial',
              [('Shader', SURF), ('Texture2D', 'res://assets/textures/' + tex)],
              {'render_priority': '0', 'shader': 'ExtResource("1")', 'shader_parameter/albedo': C(*albedo),
               'shader_parameter/albedo_tex': 'ExtResource("2")', 'shader_parameter/world_uv': 'true' if world else 'false',
               'shader_parameter/uv_scale': V2(*scale), 'shader_parameter/affine_amount': f(float(affine)),
               'shader_parameter/emission_strength': f(float(emis))})
    return 'res://materials/%s.tres' % name
def glass(name, tint):
    write_res(os.path.join(ROOT, 'materials', name + '.tres'), 'ShaderMaterial', [('Shader', 'res://shaders/ps1_glass.gdshader')],
              {'render_priority': '0', 'shader': 'ExtResource("1")', 'shader_parameter/tint': C(*tint)})
    return 'res://materials/%s.tres' % name

M = dict(
    floor_party=mat('floor_party', 'floor_party.png', affine=0.5), carpet=mat('carpet_hall', 'carpet_hall.png', affine=0.5),
    floor_foyer=mat('floor_foyer', 'floor_foyer.png', affine=0.5),
    wall_party=mat('wall_party', 'wall_party.png', (1, 1 / 3.2), affine=0.12), wall_hall=mat('wall_hall', 'wall_hall.png', (0.75, 1 / 3.2), affine=0.12),
    wall_foyer=mat('wall_foyer', 'wall_foyer.png', (0.75, 1 / 3.2), affine=0.12), brick=mat('brick', 'wall_brick.png', (0.5, 0.5), affine=0.3),
    ceiling=mat('ceiling', 'ceiling_tile.png', affine=0.4), roof=mat('roof', 'asphalt.png', (0.5, 0.5), (0.6, 0.6, 0.65)),
    asphalt=mat('asphalt', 'asphalt.png', (0.5, 0.5), affine=0.4), concrete=mat('concrete', 'concrete.png', (0.5, 0.5), affine=0.4),
    grass=mat('grass', 'grass.png', (0.5, 0.5), affine=0.4), wood=mat('wood', 'wood.png'),
    cloth_pink=mat('cloth_pink', 'cloth_pink.png', (2, 2)), cloth_yellow=mat('cloth_yellow', 'cloth_yellow.png', (2, 2)), cloth_mint=mat('cloth_mint', 'cloth_mint.png', (2, 2)),
    mat_a=mat('mat_a', 'mat_a.png', affine=0.4), mat_b=mat('mat_b', 'mat_b.png', affine=0.4),
    frame=mat('frame_white', albedo=(0.92, 0.92, 0.9)), metal=mat('metal_dark', albedo=(0.22, 0.23, 0.25)), black=mat('black', albedo=(0.06, 0.06, 0.07)),
    paint_white=mat('paint_white', albedo=(0.85, 0.85, 0.8)), paint_yellow=mat('paint_yellow', albedo=(0.75, 0.6, 0.15)),
    hedge=mat('hedge', 'grass.png', (1, 1), (0.55, 0.85, 0.5)),
    car_black=mat('car_black', albedo=(0.07, 0.075, 0.09)), car_red=mat('car_red', albedo=(0.45, 0.1, 0.09)), car_blue=mat('car_blue', albedo=(0.12, 0.22, 0.4)),
    car_silver=mat('car_silver', albedo=(0.55, 0.57, 0.6)), car_green=mat('car_green', albedo=(0.18, 0.28, 0.16)), car_tan=mat('car_tan', albedo=(0.55, 0.47, 0.32)),
    tire=mat('tire', albedo=(0.04, 0.04, 0.04)), car_glass=mat('car_glass', albedo=(0.08, 0.11, 0.15)),
    headlight=mat('headlight', albedo=(1, 0.95, 0.8), emis=1.5), taillight=mat('taillight', albedo=(0.7, 0.05, 0.05), emis=1.0),
    light_panel=mat('light_panel', albedo=(1, 0.98, 0.92), emis=1.6), exit_sign=mat('exit_sign', albedo=(0.1, 0.8, 0.25), emis=1.4),
    emergency=mat('emergency_red', albedo=(0.9, 0.08, 0.05), emis=1.2), extinguisher=mat('extinguisher', albedo=(0.7, 0.08, 0.06)),
    notice=mat('notice_board', 'wood.png', (2, 2), (0.85, 0.7, 0.45)), banner=mat('banner', 'banner_amelia.png', world=False, affine=0.3),
    bowl=mat('punch', albedo=(0.85, 0.1, 0.18)), cake=mat('cake', albedo=(1, 0.95, 0.95)), sign=mat('sign_red', albedo=(0.45, 0.1, 0.08)),
    jeans=mat('kenneth_jeans', albedo=(0.23, 0.33, 0.47), world=False), jacket=mat('kenneth_jacket', albedo=(0.12, 0.12, 0.14), world=False),
    skin=mat('kenneth_skin', albedo=(0.84, 0.68, 0.58), world=False), hair=mat('kenneth_hair', albedo=(0.3, 0.2, 0.13), world=False),
    glass=glass('window_glass', (0.06, 0.09, 0.16, 0.6)), glass_door=glass('door_glass', (0.25, 0.32, 0.4, 0.35)),
    rain=glass('rain', (0.6, 0.68, 0.78, 0.35)),
)
BRIGHT = [(1, .3, .43), (1, .72, .01), (.23, .53, 1), (.22, .69, 0), (.61, .36, .9), (1, .48, 0), (0, .73, .98), (.95, .36, .71)]
BAL = [mat('balloon_%d' % i, albedo=c, world=False) for i, c in enumerate(BRIGHT)]

# ---------------------------------------------------------------- environments
def env(name, bg, amb, amb_e, fog=None):
    p = {'background_mode': '1', 'background_color': C(*bg), 'ambient_light_source': '2', 'ambient_light_color': C(*amb),
         'ambient_light_energy': f(float(amb_e)), 'tonemap_mode': '0'}
    if fog:
        p.update({'fog_enabled': 'true', 'fog_light_color': C(*fog[0]), 'fog_density': f(float(fog[1])), 'fog_sky_affect': '0.0'})
    write_res(os.path.join(ROOT, 'environments', name + '.tres'), 'Environment', [], p)
    return 'res://environments/%s.tres' % name
ENV_EXT = env('env_exterior_rain', (0.02, 0.025, 0.035), (0.4, 0.46, 0.58), 0.7, ((0.06, 0.07, 0.09), 0.018))
ENV_DARK = env('env_interior_dark', (0.0, 0.0, 0.0), (0.4, 0.42, 0.5), 0.18, ((0.02, 0.02, 0.03), 0.05))
ENV_PARTY = env('env_party_bright', (0.05, 0.05, 0.06), (1.0, 0.95, 0.88), 0.55)

# ================================================================ community center scene
S = Scene()
S.node('CommunityCenter', 'Node3D', parent=None)
for g in ['Geometry', 'Geometry/Floors', 'Geometry/Walls', 'Geometry/Ceilings', 'Geometry/Windows', 'Geometry/Doors',
          'Props', 'Props/Foyer', 'Props/Hallway', 'Props/PartyRoom', 'Props/Balloons', 'Exterior', 'Exterior/Cars', 'Exterior/Lot',
          'Lights', 'Cameras', 'CameraZones', 'ACROSSBreach', 'StoryMarkers', 'Bounds']:
    S.node(g.split('/')[-1], 'Node3D', parent='.' if '/' not in g else g.rsplit('/', 1)[0])

def box(name, parent, x0, x1, y0, y1, z0, z1, m, col=True, rot=None, op=None):
    props = {'transform': T(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
             'size': V3(x1 - x0, y1 - y0, z1 - z0), 'material': S.ext_res('Material', m)}
    if col and op is None: props['use_collision'] = 'true'
    if op is not None: props['operation'] = str(op)
    return S.node(name, 'CSGBox3D', parent, **props)
def cbox(name, parent, cx, cy, cz, sx, sy, sz, m, col=True, rot=None):
    return box(name, parent, cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2, cz - sz / 2, cz + sz / 2, m, col, rot)
def cyl(name, parent, pos, r, h, m, rot=None, col=False, sides=8):
    props = {'transform': T(pos, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))), 'radius': f(float(r)), 'height': f(float(h)), 'sides': str(sides),
             'material': S.ext_res('Material', m)}
    if col: props['use_collision'] = 'true'
    return S.node(name, 'CSGCylinder3D', parent, **props)
def sphere(name, parent, pos, r, m):
    return S.node(name, 'CSGSphere3D', parent, transform=T(pos), radius=f(float(r)), radial_segments='8', rings='5', material=S.ext_res('Material', m))

def wall(name, x0, x1, z0, z1, m, holes=(), skin=None, h=WALL_H):
    """A wall box with rectangular holes. holes = [(x0,x1,y0,y1,z0,z1)].
    skin = ('+x'|'-x'|'+z'|'-z', material): the outer 6 cm of the wall on that side gets its own
    material. The skin is carved out of the wall thickness (no overlapping faces, so no z-fighting)."""
    e = 0.06
    bx0, bx1, bz0, bz1 = x0, x1, z0, z1
    if skin:
        side, sm = skin
        sx0, sx1, sz0, sz1 = x0, x1, z0, z1
        if side == '+x': sx0 = bx1 = x1 - e
        if side == '-x': sx1 = bx0 = x0 + e
        if side == '+z': sz0 = bz1 = z1 - e
        if side == '-z': sz1 = bz0 = z0 + e
    def part(nm, a0, a1, c0, c1, mm):
        if not holes:
            box(nm, 'Geometry/Walls', a0, a1, 0, h, c0, c1, mm)
            return
        p = S.node(nm, 'CSGCombiner3D', 'Geometry/Walls', use_collision='true')
        box('Body', p, a0, a1, 0, h, c0, c1, mm, col=False)
        for i, hl in enumerate(holes):
            box('Hole%d' % i, p, hl[0], hl[1], hl[2], hl[3], hl[4], hl[5], mm, op=2)
    part(name, bx0, bx1, bz0, bz1, m)
    if skin:
        part(name + 'Skin', sx0, sx1, sz0, sz1, sm)

def floor(name, x0, x1, z0, z1, m, y=0.0, collide=True, ceiling=False, parent='Geometry/Floors'):
    w, d = x1 - x0, z1 - z0
    mesh = S.sub_res('PlaneMesh', size=V2(w, d), subdivide_width=str(max(1, int(w)) - 1), subdivide_depth=str(max(1, int(d)) - 1),
                     material=S.ext_res('Material', m))
    S.node(name, 'MeshInstance3D', parent, transform=T(((x0 + x1) / 2, y, (z0 + z1) / 2), FLIP if ceiling else ((1, 0, 0), (0, 1, 0), (0, 0, 1))), mesh=mesh)
    if collide:
        b = S.node(name + 'Body', 'StaticBody3D', parent)
        S.node('Shape', 'CollisionShape3D', b, transform=T(((x0 + x1) / 2, y - 0.1, (z0 + z1) / 2)), shape=S.sub_res('BoxShape3D', size=V3(w, 0.2, d)))

# ---- floors (interior extents from the debrief; edges meet without overlap)
floor('FoyerFloor', -2.45, 2.45, -3.5, 0.25, M['floor_foyer'])
floor('HallwayFloor', -1.2, 1.45, -16.2, -3.5, M['carpet'])
floor('PartyFloor', -15.45, -1.2, -18.25, -7.75, M['floor_party'])
# ---- ceilings + roof
floor('FoyerCeiling', -2.2, 2.2, -3.5, 0.0, M['ceiling'], CEIL, False, True, 'Geometry/Ceilings')
floor('HallwayCeiling', -1.1, 1.2, -16.0, -3.5, M['ceiling'], CEIL, False, True, 'Geometry/Ceilings')
floor('PartyCeiling', -15.2, -1.3, -18.0, -8.0, M['ceiling'], CEIL, False, True, 'Geometry/Ceilings')
box('RoofFoyer', 'Geometry/Ceilings', -2.5, 2.5, WALL_H, WALL_H + .15, -3.75, 0.3, M['roof'], col=False)
box('RoofHallway', 'Geometry/Ceilings', -1.35, 1.5, WALL_H, WALL_H + .15, -16.25, -3.6, M['roof'], col=False)
box('RoofParty', 'Geometry/Ceilings', -15.5, -1.25, WALL_H, WALL_H + .15, -18.3, -7.7, M['roof'], col=False)

# ---- openings
ENTRANCE = (-1.4, 1.4, -0.01, 2.5, -0.2, 0.5)                    # 2.8 m main entrance
DOORWAY = (-1.5, -0.9, -0.01, 2.3, -15.5, -13.5)                 # 2 m party-room doorway, hallway west wall
WIN_Y = (0.95, 2.25)
def win_x(cx, z): return (cx - .7, cx + .7, WIN_Y[0], WIN_Y[1], z - .3, z + .3)
def win_z(cz, x): return (x - .3, x + .3, WIN_Y[0], WIN_Y[1], cz - .7, cz + .7)
WIN_N = [win_x(-11.5, -18.125), win_x(-5.0, -18.125)]
WIN_S = [win_x(-11.5, -7.875), win_x(-5.0, -7.875)]
WIN_W = [win_z(-15.5, -15.325), win_z(-10.5, -15.325)]            # z -15.5 = the breach window

# ---- walls
wall('FoyerSouth', -2.45, 2.45, 0.0, 0.25, M['wall_foyer'], [ENTRANCE], ('+z', M['brick']))
wall('FoyerWest', -2.45, -2.2, -3.7, 0.0, M['wall_foyer'], skin=('-x', M['brick']))
wall('FoyerEast', 2.2, 2.45, -3.7, 0.0, M['wall_foyer'], skin=('+x', M['brick']))
wall('FoyerNorthW', -2.45, -1.3, -3.7, -3.5, M['wall_foyer'], skin=('-z', M['brick']))
wall('FoyerNorthE', 1.2, 2.45, -3.7, -3.5, M['wall_foyer'], skin=('-z', M['brick']))
wall('HallwayEast', 1.2, 1.45, -16.2, -3.5, M['wall_hall'], skin=('+x', M['brick']))
wall('HallwayNorth', -1.1, 1.45, -16.2, -16.0, M['wall_hall'], skin=('-z', M['brick']))
# shared wall: hallway side gets the hallway texture, party side its own skin (CSG child box)
# shared hallway/party wall: split down the middle so each room sees its own face
wall('HallwayWest_HallSide', -1.2, -1.1, -16.2, -3.5, M['wall_hall'], [DOORWAY])
wall('PartyEast_PartySide', -1.3, -1.2, -18.25, -7.75, M['wall_party'], [DOORWAY])
wall('HallwayWest_Outside', -1.3, -1.2, -7.75, -3.5, M['brick'])
wall('PartyEast_OutsideN', -1.2, -1.1, -18.25, -16.2, M['brick'])
wall('PartyNorth', -15.45, -1.1, -18.25, -18.0, M['wall_party'], WIN_N, ('-z', M['brick']))
wall('PartySouth', -15.45, -1.1, -8.0, -7.75, M['wall_party'], WIN_S, ('+z', M['brick']))
wall('PartyWest', -15.45, -15.2, -18.25, -7.75, M['wall_party'], WIN_W, ('-x', M['brick']))

# ---- window frames and glass
def window(name, hole, axis, glass_name=None):
    x0, x1, y0, y1, z0, z1 = hole
    p = S.node(name, 'Node3D', 'Geometry/Windows')
    fr = S.node('Frame', 'CSGCombiner3D', p)
    if axis == 'x':      # runs along X (north/south walls)
        cz = (z0 + z1) / 2
        box('Outer', fr, x0 - .08, x1 + .08, y0 - .08, y1 + .08, cz - .14, cz + .14, M['frame'], col=False)
        box('Inner', fr, x0, x1, y0, y1, cz - .2, cz + .2, M['frame'], op=2)
        cbox('Mullion', p, (x0 + x1) / 2, (y0 + y1) / 2, cz, .05, y1 - y0, .06, M['frame'], col=False)
        q = S.sub_res('QuadMesh', size=V2(x1 - x0, y1 - y0)); rows = ((1, 0, 0), (0, 1, 0), (0, 0, 1)); pos = ((x0 + x1) / 2, (y0 + y1) / 2, cz)
    else:                # runs along Z (west wall)
        cx = (x0 + x1) / 2
        box('Outer', fr, cx - .14, cx + .14, y0 - .08, y1 + .08, z0 - .08, z1 + .08, M['frame'], col=False)
        box('Inner', fr, cx - .2, cx + .2, y0, y1, z0, z1, M['frame'], op=2)
        cbox('Mullion', p, cx, (y0 + y1) / 2, (z0 + z1) / 2, .06, y1 - y0, .05, M['frame'], col=False)
        q = S.sub_res('QuadMesh', size=V2(z1 - z0, y1 - y0)); rows = yaw(90); pos = (cx, (y0 + y1) / 2, (z0 + z1) / 2)
    S.node(glass_name or 'Glass', 'MeshInstance3D', p, transform=T(pos, rows), mesh=q, material_override=S.ext_res('Material', M['glass']))
    # glass panes don't block (the wall hole has no collision); a thin invisible blocker keeps players in
    b = S.node('Blocker', 'StaticBody3D', p)
    S.node('Shape', 'CollisionShape3D', b, transform=T(pos, rows), shape=S.sub_res('BoxShape3D', size=V3((x1 - x0) if axis == 'x' else (z1 - z0), y1 - y0, 0.1)))
window('WindowNorthW', WIN_N[0], 'x'); window('WindowNorthE', WIN_N[1], 'x')
window('WindowSouthW', WIN_S[0], 'x'); window('WindowSouthE', WIN_S[1], 'x')
window('WindowWestBreach', WIN_W[0], 'z', 'BreachGlass'); window('WindowWestS', WIN_W[1], 'z')

# ---- doors
for side in (-1, 1):   # entrance glass doors, swung open against the foyer walls
    d = S.node('EntranceDoor%s' % ('L' if side < 0 else 'R'), 'Node3D', 'Geometry/Doors')
    # commercial doors swing outward; propped open flat against the brick facade
    cbox('Panel', d, side * 2.12, 1.2, 0.31, 1.4, 2.4, .06, M['metal'], col=True)
    cbox('Glass', d, side * 2.12, 1.35, 0.345, 1.0, 1.7, .01, M['car_glass'], col=False)
cbox('LintelSign', 'Geometry/Doors', 0, 2.95, 0.33, 3.6, .55, .12, M['sign'], col=False)
for nm, z in (('RestroomDoor', -6.4), ('StorageDoor', -10.6)):
    d = cbox(nm, 'Geometry/Doors', 1.18, 1.05, z, .05, 2.1, 1.0, M['wood'], col=False)
    cbox(nm + 'Handle', 'Geometry/Doors', 1.15, 1.0, z + .38, .04, .04, .1, M['metal'], col=False)
cbox('OfficeDoor', 'Geometry/Doors', 0.05, 1.05, -15.98, 1.0, 2.1, .05, M['wood'], col=False)

# ---- foyer props
cbox('Bench', 'Props/Foyer', -1.95, .23, -2.0, .4, .45, 1.5, M['wood'])
cbox('Doormat', 'Props/Foyer', 0, .006, -0.7, 2.4, .012, 1.2, M['metal'], col=False)
cyl('CoatRackPole', 'Props/Foyer', (1.85, .85, -0.9), .03, 1.7, M['metal'], col=True)
cbox('NoticeBoard', 'Props/Foyer', 2.17, 1.6, -2.2, .04, .8, 1.2, M['notice'], col=False)
# ---- hallway props
cbox('HallNoticeBoard', 'Props/Hallway', -0.4, 1.5, -15.97, .9, .7, .04, M['notice'], col=False)
cyl('FireExtinguisher', 'Props/Hallway', (1.33, .45, -12.6), .08, .5, M['extinguisher'])
cbox('ExitSign', 'Props/Hallway', 0, 2.75, -3.62, .5, .18, .06, M['exit_sign'], col=False)
cbox('EmergencyLight', 'Props/Hallway', 1.17, 2.5, -11.4, .06, .12, .3, M['emergency'], col=False)
for i, z in enumerate((-6.0, -11.0)): cbox('CeilingPanel%d' % i, 'Props/Hallway', 0.05, CEIL - .02, z, .6, .04, 1.2, M['light_panel'], col=False)
cbox('FoyerPanel', 'Props/Foyer', 0, CEIL - .02, -1.8, .6, .04, 1.2, M['light_panel'], col=False)

# ---- party room props (landing area under the breach window stays clear)
banner = S.sub_res('QuadMesh', size=V2(3.2, 0.55))
S.node('Banner', 'MeshInstance3D', 'Props/PartyRoom', transform=T((-15.18, 2.45, -13.0), yaw(90)), mesh=banner, material_override=S.ext_res('Material', M['banner']))
def table(name, x0, x1, z0, z1, m, h=.75):
    p = S.node(name, 'CSGCombiner3D', 'Props/PartyRoom', use_collision='true')
    box('Top', p, x0, x1, h - .05, h, z0, z1, m, col=False)
    box('Skirt', p, x0 + .02, x1 - .02, h - .35, h - .05, z0 + .02, z1 - .02, m, col=False)
    for i, (lx, lz) in enumerate(((x0 + .08, z0 + .08), (x1 - .08, z0 + .08), (x0 + .08, z1 - .08), (x1 - .08, z1 - .08))):
        box('Leg%d' % i, p, lx - .025, lx + .025, 0, h - .35, lz - .025, lz + .025, M['metal'], col=False)
    return p
table('CakeTable', -10.0, -7.0, -17.6, -16.9, M['cloth_pink'])
cyl('Cake', 'Props/PartyRoom', (-8.6, .83, -17.25), .22, .16, M['cake'], sides=10)
for i in range(5):
    cbox('Gift%d' % i, 'Props/PartyRoom', -7.8 + (i % 3) * .26, .85, -17.4 + (i // 3) * .26, .2, .2, .2, BAL[(i * 3) % 8], col=False)
table('GiftTable', -6.5, -5.0, -17.6, -16.9, M['cloth_yellow'])
table('PunchTable', -2.0, -1.4, -12.6, -10.6, M['cloth_mint'])
cyl('PunchBowl', 'Props/PartyRoom', (-1.7, .84, -11.9), .2, .18, M['bowl'], sides=10)
for i in range(6): cyl('Cup%d' % i, 'Props/PartyRoom', (-1.85 + (i % 2) * .25, .8, -11.2 + (i // 2) * .16), .04, .1, BAL[i % 8], sides=6)
table('SnackTable', -2.0, -1.4, -17.6, -16.0, M['cloth_yellow'])
table('CraftTable', -6.0, -4.0, -10.2, -9.5, M['cloth_yellow'])
for j in range(3):
    for i in range(4):
        cbox('Mat_%d_%d' % (i, j), 'Props/PartyRoom', -10.5 + i, .01, -11.5 + j, 1.0, .02, 1.0, M['mat_a'] if (i + j) % 2 == 0 else M['mat_b'], col=False)
pit = S.node('BallPit', 'CSGCombiner3D', 'Props/PartyRoom', use_collision='true')
box('Outer', pit, -15.15, -13.4, 0, .45, -9.7, -8.05, M['cloth_pink'], col=False)
box('Inner', pit, -15.05, -13.5, .08, .6, -9.6, -8.15, M['cloth_pink'], op=2)
for i in range(18):
    sphere('Ball%d' % i, 'Props/Balloons', (-14.95 + (i % 6) * .28, .2, -9.45 + (i // 6) * .4), .1, BAL[i % 8])
for i, x in enumerate([-12.4 + k * 1.0 for k in range(8)]):
    p = S.node('ChairS%d' % i, 'CSGCombiner3D', 'Props/PartyRoom', use_collision='true')
    box('Seat', p, x - .2, x + .2, .42, .46, -8.55, -8.15, BAL[i % 8], col=False)
    box('Back', p, x - .2, x + .2, .46, .85, -8.2, -8.15, BAL[i % 8], col=False)
    box('Legs', p, x - .18, x + .18, 0, .42, -8.5, -8.2, M['metal'], col=False)
for i, z in enumerate([-12.0, -11.0, -10.0]):
    p = S.node('ChairW%d' % i, 'CSGCombiner3D', 'Props/PartyRoom', use_collision='true')
    box('Seat', p, -15.15, -14.75, .42, .46, z - .2, z + .2, BAL[(i + 3) % 8], col=False)
    box('Back', p, -15.15, -15.1, .46, .85, z - .2, z + .2, BAL[(i + 3) % 8], col=False)
    box('Legs', p, -15.1, -14.8, 0, .42, z - .18, z + .18, M['metal'], col=False)
def balloons(name, x, z, n=5, k0=0):
    p = S.node(name, 'Node3D', 'Props/Balloons')
    for i in range(n):
        bx, bz, by = x + (i % 3) * .22 - .22, z + (i // 3) * .2, 1.85 + (i % 2) * .25
        sphere('B%d' % i, p, (bx, by, bz), .15, BAL[(i + k0) % 8])
        cbox('String%d' % i, p, (x + bx) / 2, (by - .15) / 2, (z + bz) / 2, .01, by - .15, .01, M['paint_white'], col=False)
balloons('BalloonsNE', -1.7, -17.7, k0=0); balloons('BalloonsSE', -1.7, -8.5, k0=2); balloons('BalloonsCakeW', -10.3, -17.4, k0=4)
balloons('BalloonsCakeE', -6.7, -17.4, k0=6); balloons('BalloonsSW', -13.0, -8.4, k0=1)
for i, z in enumerate([-14.4 + k * 0.3 for k in range(11)]):   # balloon garland above the banner
    sphere('Garland%d' % i, 'Props/Balloons', (-15.08, 2.92, z), .11, BAL[i % 8])
for i, (x, z) in enumerate(((-11.5, -15.5), (-5.0, -15.5), (-11.5, -10.5), (-5.0, -10.5))):
    cbox('CeilingPanel%d' % i, 'Props/PartyRoom', x, CEIL - .02, z, 1.2, .04, .6, M['light_panel'], col=False)

# ---- exterior: ground, sidewalk, lot, street
floor('GroundLot', -40, 40, 2.5, 46, M['asphalt'], -0.02, True, parent='Exterior/Lot')
# grass never runs under the building: coplanar-ish ground under a snapped floor z-fights
for i, (gx0, gx1, gz0, gz1) in enumerate(((-30, 30, -25, -18.3), (-30, -15.5, -18.3, 0.25), (1.5, 30, -18.3, -3.7), (2.5, 30, -3.7, 0.25),
                                          (-15.5, -2.45, -7.7, 0.25), (-2.45, -1.32, -7.7, -3.7))):
    floor('Grass%d' % i, gx0, gx1, gz0, gz1, M['grass'], -0.02, True, parent='Exterior/Lot')
box('Sidewalk', 'Exterior/Lot', -30, 30, -0.02, 0.0, 0.25, 2.5, M['concrete'])
box('LotCurb', 'Exterior/Lot', -18, 18, -0.02, 0.06, 2.5, 2.62, M['concrete'], col=False)
for k in range(13):
    x = -15.6 + 2.6 * k
    box('LineA%d' % k, 'Exterior/Lot', x - .05, x + .05, -0.02, -0.008, 2.7, 7.7, M['paint_white'], col=False)
    box('LineB%d' % k, 'Exterior/Lot', x - .05, x + .05, -0.02, -0.008, 13.7, 18.9, M['paint_white'], col=False)
for k in range(10): box('StreetDash%d' % k, 'Exterior/Lot', -27 + k * 6, -24 + k * 6, -0.02, -0.008, 24.4, 24.55, M['paint_yellow'], col=False)
box('HedgeW', 'Exterior/Lot', -18, -8.6, 0, .8, 19.4, 20.3, M['hedge'])
box('HedgeMid', 'Exterior/Lot', -4.4, 8, 0, .8, 19.4, 20.3, M['hedge'])      # gap at x -8.6..-4.4: the BMW jumps the curb here
box('HedgeE', 'Exterior/Lot', 14, 18, 0, .8, 19.4, 20.3, M['hedge'])
box('StreetCurb', 'Exterior/Lot', -30, 30, -0.02, .1, 20.4, 20.6, M['concrete'], col=False)

CHROME = mat('chrome', albedo=(0.72, 0.74, 0.78), world=False)
TRIM = mat('trim_plastic', albedo=(0.07, 0.07, 0.08), world=False)
PLATE = mat('plate', albedo=(0.86, 0.86, 0.8), world=False)
def car(name, x, z, heading, m, parent='Exterior/Cars', kind='sedan'):
    """Low-poly car facing +Z: body, cabin, glass, bumpers, grille, plates, mirrors, arches, seams, handles, wheels."""
    p = S.node(name, 'Node3D', parent, transform=T((x, 0, z), yaw(heading)))
    body = S.node('Body', 'CSGCombiner3D', p, use_collision='true')
    cab = {'sedan': (-1.25, 0.85, 1.38), 'hatch': (-1.6, 0.8, 1.42), 'suv': (-1.9, 0.75, 1.62), 'wagon': (-1.95, 0.8, 1.42), 'pickup': (-0.55, 0.85, 1.48)}[kind]
    top = 0.95 if kind == 'suv' else 0.85
    box('Lower', body, -.9, .9, .28, top, -2.2, 2.2, m, col=False)
    box('Hood', body, -.86, .86, top, top + .05, .9, 2.12, m, col=False)
    box('Cabin', body, -.8, .8, top, cab[2], cab[0], cab[1], m, col=False)
    if kind == 'pickup':
        box('BedFloor', p, -.84, .84, top - .02, top, -2.15, -0.6, TRIM, col=False)
        box('Tailgate', body, -.9, .9, top, top + .35, -2.2, -2.12, m, col=False)
        for sx in (-1, 1): box('BedSide%d' % sx, body, sx * .9 - (.06 if sx > 0 else 0), sx * .9 + (.06 if sx < 0 else 0), top, top + .35, -2.2, -0.6, m, col=False)
    gy0, gy1 = top + .04, cab[2] - .04
    box('Windshield', p, -.78, .78, gy0, gy1, cab[1] - .01, cab[1] + .02, M['car_glass'], col=False)
    box('RearGlass', p, -.78, .78, gy0, gy1, cab[0] - .02, cab[0] + .01, M['car_glass'], col=False)
    box('BumperF', p, -.92, .92, .26, .46, 2.18, 2.3, TRIM, col=False)
    box('BumperR', p, -.92, .92, .26, .46, -2.3, -2.18, TRIM, col=False)
    if name == 'KennethBMW':   # twin grille
        box('GrilleL', p, -.2, -.04, .5, .72, 2.2, 2.23, TRIM, col=False); box('GrilleR', p, .04, .2, .5, .72, 2.2, 2.23, TRIM, col=False)
    else:
        box('Grille', p, -.4, .4, .5, .68, 2.2, 2.23, TRIM, col=False)
        box('GrilleBar', p, -.4, .4, .58, .6, 2.23, 2.24, CHROME, col=False)
    box('PlateF', p, -.2, .2, .3, .42, 2.3, 2.31, PLATE, col=False)
    box('PlateR', p, -.2, .2, .5, .62, -2.21, -2.2, PLATE, col=False)
    for sx in (-1, 1):
        box('SideGlassF%d' % sx, p, sx * .8 - .01, sx * .8 + .01, gy0 + .02, gy1 - .02, max(cab[0], -0.15) + .05, cab[1] - .08, M['car_glass'], col=False)
        if kind != 'pickup':
            box('SideGlassR%d' % sx, p, sx * .8 - .01, sx * .8 + .01, gy0 + .02, gy1 - .02, cab[0] + .08, -0.2, M['car_glass'], col=False)
        box('Mirror%d' % sx, p, sx * .8 + (0 if sx > 0 else -.14), sx * .8 + (.14 if sx > 0 else 0), top + .05, top + .15, cab[1] - .2, cab[1] - .08, TRIM, col=False)
        box('Headlight%d' % sx, p, sx * .6 - .2, sx * .6 + .2, .6, .72, 2.19, 2.22, M['headlight'], col=False)
        box('Taillight%d' % sx, p, sx * .6 - .2, sx * .6 + .2, .62, .74, -2.22, -2.19, M['taillight'], col=False)
        box('SeamF%d' % sx, p, sx * .9 - .005, sx * .9 + .005, .32, top, .9, .92, TRIM, col=False)
        box('SeamM%d' % sx, p, sx * .9 - .005, sx * .9 + .005, .32, top, -.15, -.13, TRIM, col=False)
        box('Handle%d' % sx, p, sx * .9 - .01, sx * .9 + .01, .74, .78, .6, .75, CHROME, col=False)
        box('Sill%d' % sx, p, sx * .9 - .02, sx * .9 + .02, .26, .32, -1.4, 1.4, TRIM, col=False)
        for wz in (-1.35, 1.35):
            cyl('Wheel%d%d' % (sx, int(wz > 0)), p, (sx * .82, .32, wz), .32, .22, M['tire'], ROT_Z90)
            cyl('Hub%d%d' % (sx, int(wz > 0)), p, (sx * .94, .32, wz), .17, .02, CHROME, ROT_Z90)
            box('Arch%d%d' % (sx, int(wz > 0)), p, sx * .9 - .03, sx * .9 + .03, .58, .66, wz - .42, wz + .42, TRIM, col=False)
    return p
car('KennethBMW', -6.5, 5.5, 0, M['car_black'])      # debrief: near the entrance, front facing the street (+Z)
for i, (x, z, hd, m) in enumerate([(-14.3, 5.1, 180, M['car_red']), (-11.7, 5.1, 180, M['car_silver']), (-1.3, 5.1, 180, M['car_blue']),
                                    (3.9, 5.1, 180, M['car_tan']), (11.7, 5.1, 180, M['car_green']), (-11.7, 16.3, 0, M['car_blue']),
                                    (-1.3, 16.3, 0, M['car_silver']), (6.5, 16.3, 180, M['car_red']), (9.1, 16.3, 0, M['car_black'])]):
    car('Car%d' % i, x, z, hd, m, kind=['sedan', 'suv', 'hatch', 'pickup', 'wagon', 'sedan', 'suv', 'hatch', 'wagon'][i])
for i, (x, z) in enumerate(((-12, 19.85), (0, 19.85), (16, 19.85), (-17.4, 10.7), (17.4, 10.7))):
    cyl('LampPole%d' % i, 'Exterior/Lot', (x, 2.5, z), .08, 5.0, M['metal'], col=True)
    cbox('LampHead%d' % i, 'Exterior/Lot', x, 5.0, z, .5, .12, .3, M['light_panel'], col=False)

# ---- rain
rain_mesh = S.sub_res('BoxMesh', size=V3(0.015, 0.45, 0.015), material=S.ext_res('Material', M['rain']))
S.node('Rain', 'CPUParticles3D', 'Exterior', transform=T((0, 10, 11)), amount='1600', lifetime='0.9', preprocess='1.0',
       mesh=rain_mesh, emission_shape='3', emission_box_extents=V3(20, 0.5, 13), direction=V3(0.05, -1, 0.02), spread='2.0',
       gravity=V3(0, -20, 0), initial_velocity_min='10.0', initial_velocity_max='12.0')

# ---- lights
def omni(name, pos, color, energy, rng, script=None, **extra):
    props = {'transform': T(pos), 'light_color': C(*color), 'light_energy': f(float(energy)), 'omni_range': f(float(rng))}
    if script: props['script'] = S.ext_res('Script', script)
    props.update(extra)
    return S.node(name, 'OmniLight3D', 'Lights', **props)
S.node('Moon', 'DirectionalLight3D', 'Lights', transform=T((0, 20, 0), look_at_rows((0, 0, 0), (-0.3, -1.0, -0.45))),
       light_color=C(0.45, 0.55, 0.8), light_energy='0.25')
omni('EntranceLamp', (0, 2.9, 1.3), (1, .85, .6), 1.4, 6)
for i, x in enumerate((-11.5, -5.0)):     # wall packs on the party room's south facade, facing the lot
    omni('WallPack%d' % i, (x, 2.9, -7.2), (1, .8, .5), 1.6, 8)
    cbox('WallPackFixture%d' % i, 'Exterior/Lot', x, 2.95, -7.68, .3, .2, .14, M['light_panel'], col=False)
for i, (x, z) in enumerate(((-12, 19.85), (0, 19.85), (16, 19.85), (-17.4, 10.7), (17.4, 10.7))):
    omni('StreetLight%d' % i, (x, 4.8, z), (1, .82, .55), 3.0, 15)
omni('FoyerLight', (0, 2.9, -1.8), (1, .92, .78), 0.9, 6)
omni('HallwayLightSouth', (0.05, 2.9, -6.0), (.85, .88, .95), 0.35, 5)
omni('HallwayLightFlicker', (0.05, 2.9, -11.0), (1, .97, .85), 1.3, 6.5, 'res://scripts/environments/flicker_light.gd', base_energy='1.3')
omni('HallwayEmergency', (1.0, 2.4, -11.4), (1, .1, .06), 0.8, 2.6)
omni('PartySpillToHall', (-0.6, 1.6, -14.5), (1, .85, .6), 1.6, 4.5)
for i, (x, z) in enumerate(((-11.5, -15.5), (-5.0, -15.5), (-11.5, -10.5), (-5.0, -10.5))):
    omni('PartyLight%d' % i, (x, 2.95, z), (1, .96, .88), 1.5, 9.5)

# ---- cameras (Camera3D looks down its -Z; transforms built with look_at)
CAMS = {}
FOLLOW = {}   # name -> dict(rail_a, rail_b, focus, focus_weight): cameras that track Kenneth
def camera(name, eye, target, fov, environment, note=''):
    props = dict(transform=T(eye, look_at_rows(eye, target)), fov=f(float(fov)), near='0.05', far='300.0',
                 environment=S.ext_res('Environment', environment))
    if name in FOLLOW:
        fl = FOLLOW[name]
        props['script'] = S.ext_res('Script', 'res://scripts/cameras/follow_camera.gd')
        for k in ('rail_a', 'rail_b', 'focus'):
            if k in fl: props[k] = V3(*fl[k])
        props['focus_weight'] = f(float(fl.get('focus_weight', 0.0)))
    CAMS[name] = S.node(name, 'Camera3D', 'Cameras', **props)
    if note: S.nodes[-1][5]['editor_description'] = '"%s"' % note
FOLLOW.update({
    'Cam1_LotArrival': dict(rail_a=(-9.0, 3.8, 12.5), rail_b=(6.0, 3.8, 12.5), focus=(0, 1.2, 0), focus_weight=0.25),
    'Cam3a_PartyEast': dict(rail_a=(-9.8, 3.05, -9.0), rail_b=(-9.8, 3.05, -16.5), focus=(-1.4, 1.0, -13.2), focus_weight=0.35),
    'Cam3b_PartyWest': dict(rail_a=(-3.0, 3.05, -8.5), rail_b=(-3.0, 3.05, -16.8), focus=(-13.5, 1.0, -13.0), focus_weight=0.3),
    'Cam3c_PartyWestExit': dict(rail_a=(-14.7, 3.05, -9.0), rail_b=(-14.7, 3.05, -16.5), focus=(-1.4, 1.0, -14.5), focus_weight=0.35),
})
camera('Cam1_LotArrival', (3.2, 3.7, 12.0), (-3.8, 1.0, 0.0), 58, ENV_EXT, 'Debrief camera 1: community center, BMW, wet pavement, entrance.')
camera('CamF_Foyer', (0.8, 2.9, -4.7), (-0.3, 0.5, 0.8), 64, ENV_DARK, 'Foyer, seen from the hallway mouth: the front doors are always in frame.')
# hallway, split in two; both face the way you walk in
camera('Cam2a_HallSouth', (0.95, 2.95, -3.7), (-0.3, 0.7, -10.5), 60, ENV_DARK, 'Debrief camera 2 (first half): foyer end to the middle.')
camera('Cam2b_HallNorth', (0.95, 2.95, -9.0), (-0.95, 0.75, -15.0), 62, ENV_DARK, 'Second half: the lit party doorway on the left is the focus.')
# hallway escape angles: both face the front doors
camera('Cam6a_EscapeHallNorth', (-0.85, 2.95, -15.85), (0.35, 0.6, -6.0), 60, ENV_DARK, 'Debrief camera 6: escape, north half, looking toward the exit.')
camera('Cam6b_EscapeHallSouth', (-0.85, 2.95, -10.2), (0.3, 0.55, -1.2), 62, ENV_DARK, 'Escape, south half: foyer and front doors ahead.')
camera('Cam3_PartyOverview', (-1.75, 3.0, -8.45), (-11.0, -0.4, -15.0), 60, ENV_PARTY, 'Debrief camera 3 (scripted): banner, windows, crowd.')
camera('Cam3a_PartyEast', (-9.6, 3.05, -8.7), (-1.9, 0.6, -13.3), 62, ENV_PARTY, 'Entering: the doorway and the punch table with its bowl are both in frame.')
camera('Cam3b_PartyWest', (-3.2, 3.05, -8.45), (-12.6, 0.2, -15.0), 62, ENV_PARTY, 'West half: banner, breach window, mats.')
camera('Cam3c_PartyWestExit', (-14.7, 3.05, -9.0), (-2.6, 0.6, -14.2), 60, ENV_PARTY, 'West half during the panic: faces the doorway.')
camera('Cam4_Breach', (-11.8, 1.5, -13.1), (-14.4, 0.55, -15.4), 55, ENV_PARTY, 'Debrief camera 4 (scripted): window impact and landing.')
camera('Cam5_CrowdInspection', (-11.2, 2.1, -13.0), (-13.7, 0.25, -15.5), 55, ENV_PARTY, 'Debrief camera 5 (scripted): creature between approaching adults.')
camera('Cam7_LotAftermath', (-15.5, 6.0, 19.0), (-3.5, 0.5, 3.5), 55, ENV_EXT, 'Debrief camera 7 (scripted): BMW, fleeing families, fires, ACROSS.')

# ---- camera zones (layer 0, mask 2 = player). escape = the camera used once the panic starts.
ZONE = 'res://scripts/cameras/camera_zone.gd'
def zone(name, cam, x0, x1, z0, z1, priority=1, escape=None):
    props = dict(collision_layer='0', collision_mask='2', script=S.ext_res('Script', ZONE),
                 camera='NodePath("../../Cameras/%s")' % cam, camera_priority=str(priority))
    if escape: props['escape_camera'] = 'NodePath("../../Cameras/%s")' % escape
    z = S.node(name, 'Area3D', 'CameraZones', **props)
    S.node('Shape', 'CollisionShape3D', z, transform=T(((x0 + x1) / 2, 1.5, (z0 + z1) / 2)), shape=S.sub_res('BoxShape3D', size=V3(x1 - x0, 3, z1 - z0)))
zone('Zone_Exterior', 'Cam1_LotArrival', -20, 20, -22, 26, priority=0)
zone('Zone_Foyer', 'CamF_Foyer', -2.2, 2.2, -3.6, 0.35)
zone('Zone_HallSouth', 'Cam2a_HallSouth', -1.25, 1.2, -9.6, -3.4, escape='Cam6b_EscapeHallSouth')
zone('Zone_HallNorth', 'Cam2b_HallNorth', -1.25, 1.2, -16.0, -9.4, escape='Cam6a_EscapeHallNorth')
zone('Zone_PartyEast', 'Cam3a_PartyEast', -8.0, -1.15, -18.0, -8.0)
zone('Zone_PartyWest', 'Cam3b_PartyWest', -15.2, -7.8, -18.0, -8.0, escape='Cam3c_PartyWestExit')

# ---- making the exits readable: EXIT signs, door trim, light spilling out of the party
for nm, pos, rows in (('ExitSignParty', (-1.34, 2.5, -14.5), yaw(90)), ('ExitSignFoyer', (0, 2.72, -0.04), yaw(0)),
                      ('ExitSignHallDoor', (-1.08, 2.5, -14.5), yaw(-90))):
    cbox(nm, 'Props/Hallway', pos[0], pos[1], pos[2], .55, .2, .05, M['exit_sign'], col=False, rot=rows)
    omni(nm + 'Glow', (pos[0] + (0.3 if 'Party' in nm else (-0.3 if 'HallDoor' in nm else 0)), pos[1] - 0.1, pos[2] - (0.3 if 'Foyer' in nm else 0)), (.25, 1, .4), 0.18, 1.4)
for side, x in (('Party', -1.33), ('Hall', -1.07)):     # pale trim around the party doorway, both faces
    cbox('DoorTrimTop' + side, 'Props/Hallway', x, 2.36, -14.5, .04, .12, 2.24, M['frame'], col=False)
    cbox('DoorTrimN' + side, 'Props/Hallway', x, 1.15, -15.56, .04, 2.3, .12, M['frame'], col=False)
    cbox('DoorTrimS' + side, 'Props/Hallway', x, 1.15, -13.44, .04, 2.3, .12, M['frame'], col=False)
cbox('EntranceTrimTop', 'Props/Foyer', 0, 2.56, -0.03, 2.95, .12, .05, M['frame'], col=False)

# ---- ACROSS breach staging (debrief section 11)
def marker(name, parent, pos, note=''):
    S.node(name, 'Marker3D', parent, transform=T(pos))
    if note: S.nodes[-1][5]['editor_description'] = '"%s"' % note
marker('BreachWindow', 'ACROSSBreach', (-15.33, 1.6, -15.5), 'Glass node: Geometry/Windows/WindowWestBreach/BreachGlass')
marker('LandingPoint', 'ACROSSBreach', (-13.7, 0, -15.4), 'Creature lands here, limbs folded, face to the floor.')
for i, p in enumerate(((-12.3, 0, -14.2), (-12.0, 0, -15.6), (-12.6, 0, -16.6), (-11.4, 0, -15.0))):
    marker('CrowdSpot%d' % (i + 1), 'ACROSSBreach', p, 'Adults who approach during CROWD_INSPECTION.')
marker('FirstLungeTarget', 'ACROSSBreach', (-12.1, 0, -14.6), 'Nearest adult; the first lunge goes here.')
lz = S.node('LandingClearArea', 'Area3D', 'ACROSSBreach', collision_layer='0', collision_mask='1',
            editor_description='"Keep furniture out of this box. The walkthrough test checks it."')
S.node('Shape', 'CollisionShape3D', lz, transform=T((-13.65, 1.3, -15.4)), shape=S.sub_res('BoxShape3D', size=V3(2.9, 2.4, 3.6)))
for nm, p, note in (('PlayerSpawn_Exterior', (0, 0, 5.0), 'Test spawn, facing the entrance.'),
                    ('BMW_DriverDoor', (-5.3, 0, 5.2), 'Kenneth gets in here.'),
                    ('PunchTableSpot', (-2.5, 0, -11.6), 'Kenneth takes punch.'),
                    ('KennethSmallTalk', (-3.4, 0, -12.6), 'Small talk with a parent before the breach.'),
                    ('AdalineMats', (-9.0, 0, -10.5), 'Adaline runs off to the mats.'),
                    ('ParentGroupA', (-4.5, 0, -14.6), ''), ('ParentGroupB', (-6.6, 0, -12.2), ''),
                    ('ParentGroupC', (-4.2, 0, -9.0), ''), ('ParentGroupD', (-9.4, 0, -15.4), '')):
    marker(nm, 'StoryMarkers', p, note)

# ---- bounds (invisible)
for nm, (x0, x1, z0, z1) in (('BoundW', (-21, -20, -22, 30)), ('BoundE', (20, 21, -22, 30)), ('BoundN', (-21, 21, -23, -22)), ('BoundS', (-21, 21, 29, 30))):
    b = S.node(nm, 'StaticBody3D', 'Bounds')
    S.node('Shape', 'CollisionShape3D', b, transform=T(((x0 + x1) / 2, 2, (z0 + z1) / 2)), shape=S.sub_res('BoxShape3D', size=V3(x1 - x0, 4, z1 - z0)))

# ================================================================ town backdrop (story pass)
FAC = [mat('facade_%d' % i, 'facade_%d.png' % i, (0.25, 0.25), affine=0.2) for i in range(5)]
S.node('Town', 'Node3D')
box('FarSidewalk', 'Town', -40, 40, -0.02, 0.1, 27.6, 29.5, M['concrete'], col=False)
blocks = [(-38, -26, 9.0), (-25, -14, 6.5), (-13, -3, 11.0), (3, 12, 7.5), (13, 24, 10.0), (25, 38, 6.0)]   # alley at x -3..3
for i, (x0, x1, h) in enumerate(blocks):
    box('BuildingS%d' % i, 'Town', x0, x1, 0, h, 29.5, 40, FAC[i % 5], col=False)
for i, (z0, z1, h) in enumerate(((-6, 6, 7.0), (8, 18, 9.5))):
    box('BuildingW%d' % i, 'Town', -34, -24, 0, h, z0, z1, FAC[(i + 2) % 5], col=False)
    box('BuildingE%d' % i, 'Town', 24, 34, 0, h, z0, z1, FAC[(i + 3) % 5], col=False)
for i, x in enumerate((-20, 8, 20)):
    omni('TownWindowGlow%d' % i, (x, 4, 28.6), (1, .75, .45), 0.8, 7)

# ================================================================ parking lot aftermath (hidden until the escape)
S.node('Aftermath', 'Node3D', visible='false')
fire_mat = S.sub_res('StandardMaterial3D', transparency='1', blend_mode='1', shading_mode='0', vertex_color_use_as_albedo='true',
                     billboard_mode='3', billboard_keep_scale='true', albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/fire.png'),
                     texture_filter='0')
smoke_mat = S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0', vertex_color_use_as_albedo='true', billboard_mode='3',
                      billboard_keep_scale='true', albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/smoke.png'), texture_filter='0')
fire_quad = S.sub_res('QuadMesh', size=V2(0.9, 0.9), material=fire_mat)
smoke_quad = S.sub_res('QuadMesh', size=V2(1.6, 1.6), material=smoke_mat)
fire_grad = S.sub_res('Gradient', offsets='PackedFloat32Array(0, 0.3, 1)', colors='PackedColorArray(1, 0.9, 0.5, 1, 1, 0.45, 0.1, 0.9, 0.5, 0.05, 0.02, 0)')
smoke_grad = S.sub_res('Gradient', offsets='PackedFloat32Array(0, 0.3, 1)', colors='PackedColorArray(0.2, 0.2, 0.2, 0, 0.25, 0.24, 0.23, 0.6, 0.3, 0.3, 0.3, 0)')
FLICK = 'res://scripts/environments/flicker_light.gd'
def fire(name, pos, scale=1.0):
    p = S.node(name, 'Node3D', 'Aftermath', transform=T(pos))
    S.node('Flames', 'CPUParticles3D', p, amount=str(int(28 * scale)), lifetime='0.8', mesh=fire_quad, emission_shape='3',
           emission_box_extents=V3(0.5 * scale, 0.1, 0.4 * scale), direction=V3(0, 1, 0), spread='12.0', gravity=V3(0, 2.5, 0),
           initial_velocity_min='0.6', initial_velocity_max='1.4', scale_amount_min=str(0.6 * scale), scale_amount_max=str(1.3 * scale), color_ramp=fire_grad)
    S.node('Smoke', 'CPUParticles3D', p, transform=T((0, 1.0 * scale, 0)), amount='14', lifetime='3.0', mesh=smoke_quad, direction=V3(0.2, 1, 0),
           spread='15.0', gravity=V3(0.3, 0.6, 0), initial_velocity_min='0.8', initial_velocity_max='1.2', scale_amount_min='0.8', scale_amount_max='2.2', color_ramp=smoke_grad)
    S.node('Light', 'OmniLight3D', p, transform=T((0, 1.0, 0)), light_color=C(1, .5, .18), light_energy=f(2.2 * scale), omni_range=f(6.5 * scale),
           script=S.ext_res('Script', FLICK), base_energy=f(2.2 * scale), flicker_chance='4.0', dropout_chance='0.0')
fire('FireParkedCar', (-14.3, 1.1, 5.1), 1.2)
fire('FireRowB', (-1.3, 1.1, 16.3), 1.0)
fire('FireStreet', (-15.0, 0.0, 24.2), 1.0)
fire('FireCrash', (5.6, 0.9, 22.6), 1.1)
fire('FireFar', (22.0, 0.0, 26.5), 0.8)
crash = car('CrashedCar', 4.5, 23.4, 62, M['car_silver'], parent='Aftermath')
for i, (x, z, r) in enumerate(((3.0, 21.8, 20), (6.2, 24.6, 70), (-1.0, 23.0, 10), (-13.0, 23.5, 45), (9.5, 7.0, 30))):
    cbox('Debris%d' % i, 'Aftermath', x, 0.06, z, 0.5, 0.12, 0.3, M['metal'], col=False, rot=yaw(r))
cbox('TippedBin', 'Aftermath', -9.5, 0.3, 2.9, 0.9, 0.55, 0.55, M['metal'], col=False, rot=yaw(15))

# ================================================================ story markers for the lot + drive
for nm, p, note in (('AdalineWait', (-5.25, 0, 3.55), 'Adaline waits by the BMW (rear passenger side).'),
                    ('StrangerWait', (-4.45, 0, 3.85), 'The Stranger waits with her.'),
                    ('KennethReunion', (-4.6, 0, 2.7), 'Kenneth stops here for the reunion.'),
                    ('LotAcrossSpawnW', (-19, 0, 22.5), ''), ('LotAcrossSpawnE', (18, 0, 22.0), ''),
                    ('LotAcrossSpawnAlley', (0, 0, 28.5), ''), ('LotAcrossSpawnWest', (-19.5, 0, 9.0), ''),
                    ('LotFleeA', (-14.3, 0, 7.4), ''), ('LotFleeB', (3.9, 0, 7.4), ''), ('LotFleeC', (-1.3, 0, 13.6), ''),
                    ('LotFleeD', (16.0, 0, 24.0), ''), ('LotFleeE', (-20.0, 0, 25.0), ''), ('LotFleeF', (-11.7, 0, 13.6), '')):
    marker(nm, 'StoryMarkers', p, note)
S.node('DriveRoute', 'Node3D', 'StoryMarkers', editor_description='"BMW route: through the empty stall, over the curb, east down Main, south past the church, into the pole."')
for i, p in enumerate(((-6.5, 0, 5.5), (-6.5, 0, 9.0), (-6.5, 0, 13.0), (-6.5, 0, 17.5), (-6.5, 0, 20.0), (-6.4, 0, 21.4),
                       (-5.0, 0, 23.6), (-1.5, 0, 25.0), (6.0, 0, 25.6), (16.0, 0, 25.6), (30.0, 0, 25.4), (44.0, 0, 25.5),
                       (53.0, 0, 26.2), (58.4, 0, 29.6), (60.2, 0, 36.0), (60.3, 0, 48.0), (60.2, 0, 60.0), (60.3, 0, 72.0),
                       (60.4, 0, 84.0), (61.0, 0, 94.0), (62.6, 0, 100.6), (63.5, 0, 103.0))):
    marker('P%02d' % i, 'StoryMarkers/DriveRoute', p)
camera('CamOpeningHigh', (-30.0, 48.0, 62.0), (-6.0, 0.0, 6.0), 50, ENV_EXT, 'Opening crane start, high over Kennedy.')
camera('CamOpeningLow', (-1.8, 2.3, 11.5), (-6.5, 0.9, 5.2), 52, ENV_EXT, 'Opening crane end: the BMW in the rain.')
camera('CamReunion', (-1.6, 1.9, 0.9), (-5.6, 0.9, 4.6), 55, ENV_EXT, 'Adaline and the Stranger at the BMW.')
camera('CamDriveStreet', (15.0, 2.6, 27.9), (0.0, 0.5, 23.5), 58, ENV_EXT, 'The BMW comes over the curb and down the street.')
camera('CamPunch', (-4.9, 2.1, -9.6), (-2.1, 1.1, -12.4), 58, ENV_PARTY, 'Small talk at the punch table.')
camera('CamPartyEntry', (-5.8, 2.4, -12.2), (-1.8, 1.0, -14.9), 60, ENV_PARTY, 'Kenneth and Adaline step into the party; the Stranger waves from the snack table.')

# ================================================================ Kennedy streets: the drive route (ending pass)
# Laid out from city_drive.png: Main runs east from the community center to a T with a north-south
# street; the church (the Stranger's) stands on its east side, then a burning store, then a cross
# street with a bus on fire. The BMW ends against the utility pole on that last corner.
STONE = mat('stone', 'stone.png', (0.5, 0.5), affine=0.2)
GLASS_ST = mat('stained_glass', 'stained_glass.png', world=False, emis=1.2)
SIGN = mat('church_sign', 'church_sign.png', world=False, affine=0.2)
STORE = mat('store_red', 'facade_0.png', (0.25, 0.25), (1.0, 0.55, 0.5), affine=0.2)
BUS = mat('bus_yellow', albedo=(0.85, 0.65, 0.12))
S.node('Streets', 'Node3D')
floor('GroundTown', 40, 100, 0, 118, M['asphalt'], -0.02, True, parent='Streets')
for i, (x0, x1, z0, z1) in enumerate(((52, 55, 29.5, 62), (52, 55, 70, 96), (52, 55, 104, 118), (65, 68, 29.5, 62), (65, 68, 70, 96), (65, 68, 104, 118),
                                      (40, 52, 60, 62), (40, 52, 70, 72), (68, 100, 60, 62), (68, 100, 70, 72), (68, 100, 94, 96), (68, 100, 104, 106))):
    box('Walk%d' % i, 'Streets', x0, x1, -0.02, 0.12, z0, z1, M['concrete'], col=False)
for k in range(16):
    z = 31 + k * 5.5
    if 61 < z < 71 or 95 < z < 105: continue
    box('Dash%d' % k, 'Streets', 59.92, 60.08, -0.02, -0.008, z, z + 2.6, M['paint_yellow'], col=False)
for k in range(5):
    box('CrossDashA%d' % k, 'Streets', 70 + k * 6, 72.6 + k * 6, -0.02, -0.008, 65.92, 66.08, M['paint_yellow'], col=False)
    box('CrossDashB%d' % k, 'Streets', 70 + k * 6, 72.6 + k * 6, -0.02, -0.008, 99.92, 100.08, M['paint_yellow'], col=False)
for i, (x0, x1, z0, z1, h) in enumerate(((40, 52, 29.5, 46, 8.0), (40, 52, 46, 60, 6.0), (40, 52, 72, 84, 9.5), (40, 52, 84, 94, 7.0),
                                         (40, 52, 106, 118, 8.5), (82, 96, 72, 94, 7.5), (68, 82, 106, 118, 6.5), (82, 98, 106, 118, 10.0), (86, 98, 29.5, 60, 9.0))):
    box('Block%d' % i, 'Streets', x0, x1, 0, h, z0, z1, FAC[(i + 1) % 5], col=False)
# the church: nave, pitched roof, bell tower with a cross, stained glass facing the street
C_ = S.node('Church', 'Node3D', 'Streets')
box('Nave', C_, 70, 84, 0, 6.5, 36, 54, STONE, col=False)
cbox('RoofA', C_, 73.4, 7.6, 45, 7.6, 0.3, 18.6, M['roof'], col=False, rot=((0.766, -0.643, 0), (0.643, 0.766, 0), (0, 0, 1)))
cbox('RoofB', C_, 80.6, 7.6, 45, 7.6, 0.3, 18.6, M['roof'], col=False, rot=((0.766, 0.643, 0), (-0.643, 0.766, 0), (0, 0, 1)))
box('Tower', C_, 70.5, 75, 0, 13.0, 30.5, 35.5, STONE, col=False)
cbox('TowerCap', C_, 72.75, 13.6, 33, 5.0, 1.2, 5.6, M['roof'], col=False)
cbox('CrossV', C_, 72.75, 16.0, 33, 0.25, 3.4, 0.25, M['paint_white'], col=False)
cbox('CrossH', C_, 72.75, 16.6, 33, 1.5, 0.25, 0.25, M['paint_white'], col=False)
for i, z in enumerate((39, 43, 47, 51)):
    cbox('StainedGlass%d' % i, C_, 69.96, 3.2, z, 0.04, 2.6, 1.1, GLASS_ST, col=False)
cbox('Door', C_, 70.45, 1.5, 33, 0.1, 3.0, 2.0, M['wood'], col=False)
cbox('SignBoard', C_, 66.6, 1.1, 40, 0.12, 0.9, 3.4, SIGN, col=False, rot=yaw(90))
cbox('SignPostA', C_, 66.6, 0.35, 38.6, 0.1, 0.7, 0.1, M['metal'], col=False)
cbox('SignPostB', C_, 66.6, 0.35, 41.4, 0.1, 0.7, 0.1, M['metal'], col=False)
omni('ChurchGlow', (68.8, 3.4, 45), (0.9, 0.7, 0.5), 1.4, 9)
omni('ChurchCrossLight', (72.75, 15.0, 31.0), (1, 0.95, 0.85), 1.0, 6)
# the store that's burning, and the bus
box('Store', 'Streets', 68, 80, 0, 5.0, 72, 86, STORE, col=False)
cbox('StoreAwning', 'Streets', 67.6, 3.2, 79, 0.8, 0.12, 12, M['sign'], col=False)
cbox('Bus', 'Streets', 78, 1.55, 100.2, 12, 2.6, 2.6, BUS, col=False)
cbox('BusWindows', 'Streets', 78, 2.1, 98.88, 11, 0.7, 0.04, M['car_glass'], col=False)
for k in range(4):
    cyl('BusWheel%d' % k, 'Streets', (73.5 + (k % 2) * 9, 0.42, 99.0 + (k // 2) * 2.4), 0.42, 0.3, M['tire'], ROT_X90)
# the pole the BMW ends against
cyl('UtilityPole', 'Streets', (64.2, 4.0, 104.2), 0.15, 8.0, M['wood'], col=False)
cbox('PoleBar', 'Streets', 64.2, 7.3, 104.2, 2.4, 0.12, 0.12, M['wood'], col=False)
cbox('PoleLamp', 'Streets', 63.2, 6.0, 104.2, 0.5, 0.12, 0.3, M['light_panel'], col=False)
omni('PoleLampLight', (63.2, 5.8, 104.2), (1, .8, .5), 2.4, 12)
omni('CornerLamp', (56.0, 4.6, 99.0), (1, .82, .55), 2.4, 13)
cyl('CornerLampPole', 'Streets', (54.4, 2.5, 99.0), .08, 5.0, M['metal'], col=False)
for i, z in enumerate((36, 50, 78, 90)):
    cyl('RoadLampPole%d' % i, 'Streets', (54.0, 2.5, z), .08, 5.0, M['metal'], col=False)
    cbox('RoadLampHead%d' % i, 'Streets', 54.6, 5.0, z, .9, .12, .3, M['light_panel'], col=False)
    omni('RoadLamp%d' % i, (55.2, 4.8, z), (1, .82, .55), 2.4, 13)
for i, (x, z, hd, m) in enumerate(((57.4, 46.0, 20, M['car_tan']), (63.0, 79.4, 82, M['car_green']), (47.0, 66.2, 90, M['car_blue']),
                                   (57.8, 90.0, -15, M['car_red']), (66.0, 112.0, 0, M['car_silver']))):
    car('StreetCar%d' % i, x, z, hd, m, parent='Streets')
for i, (x, z, r) in enumerate(((59.0, 55.0, 20), (61.5, 68.0, 70), (58.5, 76.0, 10), (62.0, 88.0, 45), (60.5, 98.0, 80))):
    cbox('RoadDebris%d' % i, 'Streets', x, 0.06, z, 0.6, 0.12, 0.35, M['metal'], col=False, rot=yaw(r))
fire('FireStore', (73.0, 0.0, 74.5), 1.6)
fire('FireStoreRoof', (76.0, 5.0, 80.0), 1.2)
fire('FireBus', (80.0, 2.8, 100.2), 1.1)
fire('FireStreetCar', (57.8, 1.0, 90.0), 1.0)
fire('FireRoadMain', (48.0, 0.0, 24.0), 0.9)
fire('FireWreck', (64.1, 0.9, 102.0), 0.9)
for n_ in S.nodes:                     # the BMW's own fire lights after the crash
    if n_[0] == 'FireWreck': n_[5]['visible'] = 'false'
camera('CamDriveCorner', (63.6, 3.0, 40.5), (55.5, 0.6, 26.8), 58, ENV_EXT, 'The BMW swings south off Main toward the camera.')
camera('CamChurch', (55.6, 1.5, 59.0), (66.5, 4.2, 44.0), 60, ENV_EXT, 'Low angle across the road: the church and its cross as the BMW passes.')
camera('CamStore', (55.7, 2.2, 89.0), (60.6, 0.9, 74.0), 58, ENV_EXT, 'Past the burning store: the ACROSS that hits the windshield.')
camera('CamCrash', (55.6, 2.6, 111.0), (61.4, 0.6, 96.0), 56, ENV_EXT, 'The last corner: the BMW swerves into the pole.')
camera('CamFinalStart', (57.4, 1.7, 112.6), (64.4, 0.5, 104.8), 56, ENV_EXT, 'Final shot, start of the push-in.')
camera('CamFinalEnd', (62.4, 1.05, 110.6), (65.2, 0.3, 106.0), 52, ENV_EXT, 'Final shot, end of the push-in.')
for nm, p_, note in (('KennethDownSpot', (65.5, 0.12, 107.3), 'Kenneth lies here on the sidewalk, unconscious, lit by the burning wreck.'),
                     ('PresentSpot', (62.6, 0.01, 102.0), "Amelia's present, in the road by the open rear door."),
                     ('WindshieldHit', (60.3, 0, 77.0), 'An ACROSS throws itself onto the BMW here.'),
                     ('RoadAcrossA', (66.2, 0, 76.5), ''), ('RoadAcrossB', (53.6, 0, 70.0), ''), ('RoadAcrossC', (66.2, 0, 86.0), '')):
    marker(nm, 'StoryMarkers', p_, note)

# ================================================================ BMW interior set (in-car shots)
# A separate set far from the town, as fixed-camera games did it: dark windows, rain on the glass,
# streetlights sweeping through. Car faces -Z here; driver on the left (-X).
O = (200.0, -200.0, 200.0)   # underground, so nothing of the town shows through the windows
def ob(name, x0, x1, y0, y1, z0, z1, m, **kw):
    return box(name, 'CarInterior', O[0] + x0, O[0] + x1, y0, y1, O[2] + z0, O[2] + z1, m, col=False, **kw)
S.node('CarInterior', 'Node3D', transform=T((0, O[1], 0)))
DARKP = mat('car_plastic', albedo=(0.09, 0.09, 0.1))
SEAT = mat('car_seat', 'cloth_mint.png', (3, 3), (0.22, 0.2, 0.2))
ob('Floor', -0.84, 0.84, 0.0, 0.08, -1.3, 1.5, DARKP)
ob('Dash', -0.84, 0.84, 0.55, 0.9, -1.3, -0.92, DARKP)
ob('DashTop', -0.84, 0.84, 0.88, 0.92, -1.25, -0.96, M['car_black'])
cyl('Wheel', 'CarInterior', (O[0] - 0.38, 0.93, O[2] - 0.8), 0.17, 0.035, M['tire'], ((1, 0, 0), (0, 0.34, -0.94), (0, 0.94, 0.34)), sides=10)
for sx in (-0.38, 0.38):
    t = 'D' if sx < 0 else 'P'
    ob('SeatBase' + t, sx - 0.25, sx + 0.25, 0.3, 0.48, -0.25, 0.25, SEAT)
    ob('SeatBack' + t, sx - 0.25, sx + 0.25, 0.48, 1.12, 0.25, 0.36, SEAT)
    ob('Headrest' + t, sx - 0.1, sx + 0.1, 1.14, 1.3, 0.27, 0.34, SEAT)
ob('RearBench', -0.76, 0.76, 0.3, 0.48, 0.7, 1.2, SEAT)
ob('RearBack', -0.76, 0.76, 0.48, 1.1, 1.18, 1.3, SEAT)
for sx in (-1, 1):
    ob('Door%d' % sx, sx * 0.84 - (0.04 if sx > 0 else 0), sx * 0.84 + (0.04 if sx < 0 else 0), 0.08, 0.72, -1.3, 1.5, DARKP)
    for z in (-0.95, 0.45, 1.3):
        ob('Pillar%d_%s' % (sx, str(z)), sx * 0.84 - 0.03, sx * 0.84 + 0.03, 0.72, 1.56, z - 0.03, z + 0.03, DARKP)
ob('Roof', -0.87, 0.87, 1.56, 1.61, -1.0, 1.36, M['car_black'])
ob('Mirror', -0.11, 0.11, 1.4, 1.46, -0.88, -0.85, M['metal'])
ob('MirrorStem', -0.01, 0.01, 1.46, 1.56, -0.87, -0.86, DARKP)
AIRF = mat('air_freshener', albedo=(0.2, 0.6, 0.3), world=False)
ob('AirFreshener', -0.025, 0.025, 1.26, 1.36, -0.865, -0.86, AIRF)
ob('AirFreshenerString', -0.003, 0.003, 1.36, 1.4, -0.864, -0.862, M['paint_white'])
ob('Console', -0.12, 0.12, 0.08, 0.5, -0.92, 0.25, DARKP)
ob('GearStick', -0.015, 0.015, 0.5, 0.66, -0.25, -0.22, M['metal'])
ob('GearKnob', -0.03, 0.03, 0.64, 0.7, -0.27, -0.21, M['black'])
ob('Handbrake', 0.02, 0.05, 0.5, 0.54, -0.05, 0.15, M['black'])
RADIO = mat('radio_glow', albedo=(0.2, 0.9, 0.5), world=False, emis=1.4)
GAUGE = mat('gauge_glow', albedo=(1.0, 0.55, 0.15), world=False, emis=1.4)
ob('Radio', -0.1, 0.1, 0.66, 0.72, -0.925, -0.92, RADIO)
ob('VentL', -0.3, -0.18, 0.78, 0.83, -0.925, -0.92, M['black']); ob('VentR', 0.18, 0.3, 0.78, 0.83, -0.925, -0.92, M['black'])
ob('Gauges', -0.5, -0.26, 0.8, 0.88, -0.93, -0.925, GAUGE)
ob('Glovebox', 0.22, 0.62, 0.6, 0.7, -0.925, -0.92, M['car_black'])
ob('SteeringColumn', -0.41, -0.35, 0.78, 0.86, -0.92, -0.82, DARKP)
for sx in (-0.4, 0.4):
    ob('Visor%s' % sx, sx - 0.2, sx + 0.2, 1.5, 1.53, -0.95, -0.75, SEAT)
    ob('Belt%s' % sx, sx + (0.2 if sx > 0 else -0.2) - 0.02, sx + (0.2 if sx > 0 else -0.2) + 0.02, 0.5, 1.15, 0.36, 0.38, M['black'])
    ob('FloorMat%s' % sx, sx - 0.22, sx + 0.22, 0.08, 0.09, -0.8, -0.3, M['black'])
for sx in (-0.42, 0.42):
    ob('RearHeadrest%s' % sx, sx - 0.1, sx + 0.1, 1.12, 1.26, 1.2, 1.27, SEAT)
for sx in (-1, 1):
    ob('DoorPanel%d' % sx, sx * 0.8 - 0.02, sx * 0.8 + 0.02, 0.3, 0.68, -0.7, 1.2, SEAT)
    ob('DoorHandleIn%d' % sx, sx * 0.79 - 0.01, sx * 0.79 + 0.01, 0.6, 0.63, -0.2, -0.05, M['metal'])
    ob('Armrest%d' % sx, sx * 0.78 - 0.03, sx * 0.78 + 0.03, 0.5, 0.54, -0.6, 0.2, DARKP)
ob('DomeLight', -0.08, 0.08, 1.54, 1.56, 0.25, 0.4, M['light_panel'])
present_pink = mat('present_pink', albedo=(0.9, 0.45, 0.65), world=False)
present_ribbon = mat('present_ribbon', albedo=(1.0, 0.85, 0.2), world=False)
ob('Present', 0.34, 0.56, 0.62, 0.78, 0.62, 0.8, present_pink)
ob('PresentRibbonA', 0.43, 0.47, 0.62, 0.79, 0.62, 0.8, present_ribbon)
ob('PresentRibbonB', 0.34, 0.56, 0.62, 0.79, 0.69, 0.73, present_ribbon)
wq = S.sub_res('QuadMesh', size=V2(1.62, 0.64))
S.node('Windshield', 'MeshInstance3D', 'CarInterior', transform=T((O[0], 1.24, O[2] - 0.95)), mesh=wq, material_override=S.ext_res('Material', M['glass']))
crack_mat = S.sub_res('StandardMaterial3D', transparency='1', shading_mode='0', cull_mode='2', texture_filter='0',
                      albedo_texture=S.ext_res('Texture2D', 'res://assets/textures/windshield_crack.png'))
cq = S.sub_res('QuadMesh', size=V2(0.9, 0.42), material=crack_mat)
S.node('WindshieldCrack', 'MeshInstance3D', 'CarInterior', transform=T((O[0] - 0.25, 1.22, O[2] - 0.94)), mesh=cq, visible='false')
rq = S.sub_res('QuadMesh', size=V2(1.5, 0.4))
S.node('RearWindow', 'MeshInstance3D', 'CarInterior', transform=T((O[0], 1.05, O[2] + 1.33), yaw(180)), mesh=rq, material_override=S.ext_res('Material', M['glass']))
drop_mesh = S.sub_res('BoxMesh', size=V3(0.006, 0.05, 0.004), material=S.ext_res('Material', M['rain']))
S.node('WindshieldRain', 'CPUParticles3D', 'CarInterior', transform=T((O[0], 1.24, O[2] - 0.99)), amount='60', lifetime='0.7', mesh=drop_mesh,
       emission_shape='3', emission_box_extents=V3(0.8, 0.3, 0.01), direction=V3(0, -1, 0), spread='5.0', gravity=V3(0, -1.2, 0),
       initial_velocity_min='0.1', initial_velocity_max='0.4', local_coords='false')
S.node('Wiper', 'Node3D', 'CarInterior', transform=T((O[0] - 0.1, 0.92, O[2] - 0.97)))
cbox('Blade', 'CarInterior/Wiper', 0.35, 0.0, 0, 0.7, 0.02, 0.015, M['black'], col=False)
S.node('DashGlow', 'OmniLight3D', 'CarInterior', transform=T((O[0] - 0.3, 0.95, O[2] - 0.85)), light_color=C(0.35, 0.7, 0.9), light_energy='0.5', omni_range='1.6')
S.node('CabinFill', 'OmniLight3D', 'CarInterior', transform=T((O[0] + 0.2, 1.25, O[2] - 0.4)), light_color=C(0.55, 0.6, 0.75), light_energy='0.9', omni_range='2.8')
S.node('RearFill', 'OmniLight3D', 'CarInterior', transform=T((O[0], 1.22, O[2] + 0.5)), light_color=C(0.6, 0.62, 0.75), light_energy='0.6', omni_range='1.8')
S.node('PassingLight', 'OmniLight3D', 'CarInterior', transform=T((O[0] + 1.6, 2.2, O[2] - 3.0)), light_color=C(1, 0.78, 0.45), light_energy='2.5', omni_range='4.0')
camera('CamCarFront', (O[0] + 0.05, O[1] + 1.34, O[2] - 0.86), (O[0] - 0.02, O[1] + 1.0, O[2] + 0.9), 76, ENV_DARK, 'In the car: from the dash, all three faces.')
camera('CamCarMirror', (O[0] + 0.02, O[1] + 1.4, O[2] - 0.84), (O[0] - 0.08, O[1] + 1.4, O[2] + 0.98), 48, ENV_DARK, 'The rear-view mirror on the Stranger.')
camera('CamCarKenneth', (O[0] + 0.42, O[1] + 1.32, O[2] - 0.45), (O[0] - 0.38, O[1] + 1.24, O[2] + 0.05), 60, ENV_DARK, 'Kenneth at the wheel, from the passenger seat.')
camera('CamCarAdaline', (O[0] + 0.02, O[1] + 1.08, O[2] + 0.2), (O[0] + 0.45, O[1] + 0.82, O[2] + 0.98), 58, ENV_DARK, 'Adaline in the back, holding on.')
for nm, p_ in (('CarSeatKenneth', (O[0] - 0.38, O[1] + 0, O[2] + 0.0)), ('CarSeatStranger', (O[0] - 0.08, O[1] + 0, O[2] + 0.98)), ('CarSeatAdaline', (O[0] + 0.45, O[1] + 0, O[2] + 0.98))):
    marker(nm, 'StoryMarkers', p_)

# ================================================================ Kennedy from the sky (opening pass)
S.node('KennedyCity', 'Node3D', script=S.ext_res('Script', 'res://scripts/environments/kennedy_city.gd'),
       editor_description='"The whole town and its farmland, built procedurally at load (see kennedy_city.gd)."')
ENV_SKY = env('env_opening_sky', (0.05, 0.06, 0.09), (0.35, 0.42, 0.6), 0.55, ((0.08, 0.09, 0.12), 0.00035))
camera('CamFlight', (-1800.0, 950.0, 2600.0), (150.0, 0.0, 0.0), 50, ENV_SKY, 'Opening flight camera (moved by the director).')
for n_ in S.nodes:
    if n_[0] == 'CamFlight': n_[5]['far'] = '9000.0'
S.write(os.path.join(ROOT, 'scenes/environments/community_center.tscn'))

# ================================================================ player
P = Scene()
P.node('Player', 'CharacterBody3D', parent=None, collision_layer='2', collision_mask='1', floor_snap_length='0.3',
       script=P.ext_res('Script', 'res://scripts/player/player.gd'))
P.node('Collision', 'CollisionShape3D', transform=T((0, 0.89, 0)), shape=P.sub_res('CapsuleShape3D', radius='0.28', height='1.78'))
P.node('Visual', 'Node3D', script=P.ext_res('Script', 'res://scripts/characters/character_model.gd'), model_id='"kenneth"',
       editor_description='"Kenneth (assets/characters/kenneth.glb). Animated by player.gd."')
P.node('KeyLight', 'OmniLight3D', transform=T((0.3, 1.9, -0.6)), light_color=C(1.0, 0.92, 0.8), light_energy='0.55', omni_range='2.2',
       editor_description='"A soft light that travels with Kenneth so he reads in crowds and in the dark."')
P.write(os.path.join(ROOT, 'scenes/characters/player.tscn'))

# ================================================================ test scene
Q = Scene()   # walk-around test: the level + Kenneth, no story
Q.node('CommunityCenterTest', 'Node', parent=None)
Q.node('Screen', 'SubViewportContainer', anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', stretch='true', stretch_shrink='3', texture_filter='1')
Q.node('World', 'SubViewport', 'Screen', handle_input_locally='false', audio_listener_enable_3d='true', size='Vector2i(320, 240)', render_target_update_mode='4')
Q.node('CommunityCenter', parent='Screen/World', instance=Q.ext_res('PackedScene', 'res://scenes/environments/community_center.tscn'))
Q.node('Player', parent='Screen/World', instance=Q.ext_res('PackedScene', 'res://scenes/characters/player.tscn'), transform=T((0, 0, 5.0)))
Q.node('PostFX', 'CanvasLayer', 'Screen/World', layer='10')
post = Q.sub_res('ShaderMaterial', shader=Q.ext_res('Shader', 'res://shaders/ps1_post.gdshader'))
Q.node('Screen', 'ColorRect', 'Screen/World/PostFX', material=post, anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', mouse_filter='2')
Q.write(os.path.join(ROOT, 'scenes/prologue/community_center_test.tscn'))
print('nodes:', len(S.nodes), 'subresources:', len(S.sub))
