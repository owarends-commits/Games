"""Tiny .tscn writer shared by the build scripts."""
import math, os

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

