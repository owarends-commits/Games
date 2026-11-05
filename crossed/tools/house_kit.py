"""Shared pieces for the Chapter One house builders: materials, boxes, walls with holes, trim, windows,
textured quads, lights and trees. Used by build_louis_house.py and the detail pass in build_norah_house.py."""
import os, math, random
from tscn import Scene, T, V3, V2, C, f, write_res, look_at_rows, yaw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURF = 'res://shaders/ps1_surface.gdshader'
FACING = {'+z': ((1, 0, 0), (0, 1, 0), (0, 0, 1)), '-z': yaw(180), '+x': yaw(90), '-x': yaw(-90),
          'up': ((1, 0, 0), (0, 0, 1), (0, -1, 0)), 'down': ((1, 0, 0), (0, 0, -1), (0, 1, 0))}

def rot_x(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg)); return ((1, 0, 0), (0, c, -s), (0, s, c))
def rot_z(deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg)); return ((c, -s, 0), (s, c, 0), (0, 0, 1))
def mul(a, b):
    return tuple(tuple(sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)) for i in range(3))

class Kit:
    def __init__(self, S, M, prefix):
        self.S, self.M, self.prefix, self.n = S, M, prefix, 0

    # ------------------------------------------------------------ materials
    def mat(self, name, tex='white.png', scale=(1, 1), albedo=(1, 1, 1), world=True, affine=0.4, emis=0.0):
        path = 'res://materials/%s_%s.tres' % (self.prefix, name)
        write_res(os.path.join(ROOT, 'materials', '%s_%s.tres' % (self.prefix, name)), 'ShaderMaterial',
                  [('Shader', SURF), ('Texture2D', 'res://assets/textures/' + tex)],
                  {'render_priority': '0', 'shader': 'ExtResource("1")', 'shader_parameter/albedo': C(*albedo),
                   'shader_parameter/albedo_tex': 'ExtResource("2")', 'shader_parameter/world_uv': 'true' if world else 'false',
                   'shader_parameter/uv_scale': V2(*scale), 'shader_parameter/affine_amount': f(float(affine)),
                   'shader_parameter/emission_strength': f(float(emis))})
        self.M[name] = path
        return path

    def _m(self, m):
        return self.S.ext_res('Material', self.M[m] if m in self.M else m)

    # ------------------------------------------------------------ geometry
    def box(self, parent, x0, x1, y0, y1, z0, z1, m, col=True, name=None, rot=None):
        self.n += 1
        props = {'transform': T(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
                 'size': V3(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), 'material': self._m(m)}
        if col: props['use_collision'] = 'true'
        return self.S.node(name or ('%s%d' % (self.prefix.upper(), self.n)), 'CSGBox3D', parent, **props)

    def cbox(self, parent, c, size, m, rot=None, col=False, name=None):
        self.n += 1
        props = {'transform': T(c, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))), 'size': V3(*size), 'material': self._m(m)}
        if col: props['use_collision'] = 'true'
        return self.S.node(name or ('%s%d' % (self.prefix.upper(), self.n)), 'CSGBox3D', parent, **props)

    def cyl(self, parent, c, radius, height, m, sides=8, rot=None, col=False, name=None):
        self.n += 1
        props = {'transform': T(c, rot or ((1, 0, 0), (0, 1, 0), (0, 0, 1))), 'radius': f(float(radius)), 'height': f(float(height)),
                 'sides': str(sides), 'material': self._m(m)}
        if col: props['use_collision'] = 'true'
        return self.S.node(name or ('%s%d' % (self.prefix.upper(), self.n)), 'CSGCylinder3D', parent, **props)

    def quad(self, parent, c, w, h, facing, m, name=None, tilt=0.0):
        """A textured face (photos, prints, signs, pages). facing: +x -x +z -z up down, or a rotation."""
        self.n += 1
        rows = FACING[facing] if isinstance(facing, str) else facing
        if tilt: rows = mul(rows, rot_z(tilt))
        q = self.S.sub_res('QuadMesh', size=V2(w, h))
        return self.S.node(name or ('Q%d' % self.n), 'MeshInstance3D', parent, transform=T(c, rows), mesh=q,
                           material_override=self._m(m))

    def ramp(self, parent, x0, y0, x1, y1, z0, z1, name='Ramp'):
        """Invisible walkable slope from (x0, y0) up to (x1, y1) across z0..z1 (stairs)."""
        L = math.hypot(x1 - x0, y1 - y0); a = math.degrees(math.atan2(y1 - y0, x1 - x0)); t = 0.12
        nx, ny = -math.sin(math.radians(a)), math.cos(math.radians(a))
        cx, cy = (x0 + x1) / 2 - nx * t / 2, (y0 + y1) / 2 - ny * t / 2
        shape = self.S.sub_res('BoxShape3D', size=V3(L + 0.3, t, abs(z1 - z0)))
        self.S.node(name, 'StaticBody3D', parent, transform=T((cx, cy, (z0 + z1) / 2), rot_z(a)))
        self.S.node('Shape', 'CollisionShape3D', parent + '/' + name, shape=shape)

    def wall_x(self, parent, x, z0, z1, m, holes=(), t=0.12, h=2.4, y=0.0, m2=None):
        z0, z1 = min(z0, z1), max(z0, z1); cuts = sorted(holes); pieces, z = [], z0
        for za, zb, y0, y1 in cuts:
            if za > z: pieces.append((z, za, 0, h))
            if y0 > 0: pieces.append((za, zb, 0, y0))
            if y1 < h: pieces.append((za, zb, y1, h))
            z = zb
        if z < z1: pieces.append((z, z1, 0, h))
        for a, b, y0, y1 in pieces:
            if m2:
                self.box(parent, x - t / 2, x, y + y0, y + y1, a, b, m); self.box(parent, x, x + t / 2, y + y0, y + y1, a, b, m2)
            else:
                self.box(parent, x - t / 2, x + t / 2, y + y0, y + y1, a, b, m)

    def wall_z(self, parent, z, x0, x1, m, holes=(), t=0.12, h=2.4, y=0.0, m2=None):
        x0, x1 = min(x0, x1), max(x0, x1); cuts = sorted(holes); pieces, x = [], x0
        for xa, xb, y0, y1 in cuts:
            if xa > x: pieces.append((x, xa, 0, h))
            if y0 > 0: pieces.append((xa, xb, 0, y0))
            if y1 < h: pieces.append((xa, xb, y1, h))
            x = xb
        if x < x1: pieces.append((x, x1, 0, h))
        for a, b, y0, y1 in pieces:
            if m2:
                self.box(parent, a, b, y + y0, y + y1, z - t / 2, z, m); self.box(parent, a, b, y + y0, y + y1, z, z + t / 2, m2)
            else:
                self.box(parent, a, b, y + y0, y + y1, z - t / 2, z + t / 2, m)

    # ------------------------------------------------------------ trim
    def casing(self, parent, axis, at, a, b, y0, y1, m, t=0.12, w=0.07, d=0.02, sill=False):
        """Trim around a door/window hole in a wall (both faces). axis 'x' = wall along Z at X=at; 'z' = wall along X at Z=at."""
        for side in (-1, 1):
            o = at + side * (t / 2 + d / 2)
            if axis == 'x':
                self.box(parent, o - d / 2, o + d / 2, y0, y1 + w, a - w, a, m, col=False)
                self.box(parent, o - d / 2, o + d / 2, y0, y1 + w, b, b + w, m, col=False)
                self.box(parent, o - d / 2, o + d / 2, y1, y1 + w, a - w, b + w, m, col=False)
                if sill: self.box(parent, o - d / 2 - side * 0.04, o + d / 2 + side * 0.0, y0 - 0.04, y0, a - w, b + w, m, col=False)
            else:
                self.box(parent, a - w, a, y0, y1 + w, o - d / 2, o + d / 2, m, col=False)
                self.box(parent, b, b + w, y0, y1 + w, o - d / 2, o + d / 2, m, col=False)
                self.box(parent, a - w, b + w, y1, y1 + w, o - d / 2, o + d / 2, m, col=False)
                if sill: self.box(parent, a - w, b + w, y0 - 0.04, y0, o - d / 2, o + d / 2, m, col=False)

    def window(self, parent, axis, at, a, b, y0, y1, frame_m, glass_m, t=0.12, mullion=True, name=None, open_=False):
        """Glass, sash frame and a cross mullion in a hole. open_ leaves the lower sash up (no glass below)."""
        g = (y0 + y1) / 2
        if axis == 'x':
            if not open_: self.box(parent, at - 0.01, at + 0.01, y0, y1, a, b, glass_m, col=False, name=name)
            else: self.box(parent, at - 0.01, at + 0.01, g, y1, a, b, glass_m, col=False, name=name)
            if mullion:
                self.box(parent, at - 0.025, at + 0.025, g - 0.02, g + 0.02, a, b, frame_m, col=False)
                self.box(parent, at - 0.025, at + 0.025, y0, y1, (a + b) / 2 - 0.015, (a + b) / 2 + 0.015, frame_m, col=False)
        else:
            if not open_: self.box(parent, a, b, y0, y1, at - 0.01, at + 0.01, glass_m, col=False, name=name)
            else: self.box(parent, a, b, g, y1, at - 0.01, at + 0.01, glass_m, col=False, name=name)
            if mullion:
                self.box(parent, a, b, g - 0.02, g + 0.02, at - 0.025, at + 0.025, frame_m, col=False)
                self.box(parent, (a + b) / 2 - 0.015, (a + b) / 2 + 0.015, y0, y1, at - 0.025, at + 0.025, frame_m, col=False)
        self.casing(parent, axis, at, a, b, y0, y1, frame_m, t=t, sill=True)

    def curtains(self, parent, axis, at, a, b, y0, y1, m, inside=1, gap=0.35, name=None):
        """Two drawn-back curtain panels and a rod on the inside face of a window."""
        o = at + inside * 0.1; w = (b - a) * (1 - gap) / 2 + 0.08
        if axis == 'x':
            self.box(parent, o - 0.01, o + 0.01, y1 + 0.1, y1 + 0.13, a - 0.15, b + 0.15, 'metal', col=False)
            self.box(parent, o - 0.03, o + 0.03, y0 - 0.15, y1 + 0.1, a - 0.12, a - 0.12 + w, m, col=False, name=(name + 'L') if name else None)
            self.box(parent, o - 0.03, o + 0.03, y0 - 0.15, y1 + 0.1, b + 0.12 - w, b + 0.12, m, col=False, name=(name + 'R') if name else None)
        else:
            self.box(parent, a - 0.15, b + 0.15, y1 + 0.1, y1 + 0.13, o - 0.01, o + 0.01, 'metal', col=False)
            self.box(parent, a - 0.12, a - 0.12 + w, y0 - 0.15, y1 + 0.1, o - 0.03, o + 0.03, m, col=False, name=(name + 'L') if name else None)
            self.box(parent, b + 0.12 - w, b + 0.12, y0 - 0.15, y1 + 0.1, o - 0.03, o + 0.03, m, col=False, name=(name + 'R') if name else None)

    def baseboards(self, parent, rooms, m, h=0.09, d=0.015, t=0.12):
        """rooms: (x0, x1, z0, z1, y) interior rectangles; a skirting strip around each (doors cut it visually only)."""
        for x0, x1, z0, z1, y in rooms:
            i0, i1, k0, k1 = x0 + t / 2, x1 - t / 2, z0 + t / 2, z1 - t / 2
            self.box(parent, i0, i1, y, y + h, k0, k0 + d, m, col=False); self.box(parent, i0, i1, y, y + h, k1 - d, k1, m, col=False)
            self.box(parent, i0, i0 + d, y, y + h, k0, k1, m, col=False); self.box(parent, i1 - d, i1, y, y + h, k0, k1, m, col=False)

    def frame_pic(self, parent, c, w, h, facing, pic_m, frame_m, tilt=0.0, name=None):
        """A framed picture hung on a wall: frame box + picture quad just in front."""
        rows = FACING[facing]
        if tilt: rows = mul(rows, rot_z(tilt))
        n = [rows[0][2], rows[1][2], rows[2][2]]
        self.cbox(parent, c, (w + 0.05, h + 0.05, 0.02), frame_m, rot=rows)
        self.quad(parent, (c[0] + n[0] * 0.012, c[1] + n[1] * 0.012, c[2] + n[2] * 0.012), w, h, rows, pic_m, name=name)

    def books(self, parent, x0, x1, y, z0, z1, spine_m, axis='x'):
        """A row of books on a shelf: one block with a spine texture on the visible face."""
        if axis == 'x':     # shelf along X, spines face +z/-z (z1 side)
            self.box(parent, x0, x1, y, y + 0.24, z0, z1, 'books_side', col=False)
            self.quad(parent, ((x0 + x1) / 2, y + 0.12, z1 + 0.002), x1 - x0, 0.24, '+z', spine_m)
        else:               # shelf along Z, spines face -x (x0 side)
            self.box(parent, x0, x1, y, y + 0.24, z0, z1, 'books_side', col=False)
            self.quad(parent, (x0 - 0.002, y + 0.12, (z0 + z1) / 2), z1 - z0, 0.24, '-x', spine_m)

    # ------------------------------------------------------------ lights / trees
    def omni(self, parent, name, pos, col, e, rng, shadow=True):
        self.S.node(name, 'OmniLight3D', parent, transform=T(pos), light_color=C(*col), light_energy=f(float(e)), omni_range=f(float(rng)),
                    shadow_enabled='true' if shadow else 'false')

    def tree(self, parent, x, z, h, bark='bark', leaves='tree', rnd=None, bare=False):
        rnd = rnd or random
        self.box(parent, x - 0.15, x + 0.15, 0, h * 0.6, z - 0.15, z + 0.15, bark, col=False)
        if bare:      # leafless: a few branches
            for k in range(3):
                a = rnd.uniform(0, 360); ln = rnd.uniform(0.8, 1.5)
                self.cbox(parent, (x + math.cos(math.radians(a)) * ln * 0.4, h * rnd.uniform(0.45, 0.6), z + math.sin(math.radians(a)) * ln * 0.4),
                          (0.07, ln, 0.07), bark, rot=mul(yaw(a), rot_z(55)))
            return
        for k, (s, y) in enumerate(((1.0, 0.42), (0.75, 0.62), (0.45, 0.8))):
            r = s * 1.0
            self.cbox(parent, (x, h * y + 0.25, z), (r * 1.9, h * 0.22, r * 1.9), leaves, rot=yaw(rnd.uniform(0, 90)))
