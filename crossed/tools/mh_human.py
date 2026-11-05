"""MakeHuman (CC0) base-mesh toolkit for the character builder (tools/build_humans.py).

Loads the MakeHuman 1.x base mesh, its shape targets and default rig weights (all CC0, from
github.com/makehumancommunity/makehuman, copied under tools/mh_data/), and produces a posed, weighted
human body for a character spec:
  - macro build: gender, age, muscle, weight, height, ethnicity (MakeHuman's own blending of its macro targets)
  - any extra targets (face, nose, chin, ears, torso, limbs...) with weights
  - re-posed to our rest pose (arms hanging at the sides) so every animation in the game still fits
  - weights mapped from MakeHuman's 160-bone rig onto our 17 bones + jaw (smooth, up to 4 bones per vertex)
Units: metres; the character faces -Z with its LEFT on -X (the game's convention).
"""
import json, math, os, re
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'mh_data')

BONES = ['hips', 'spine', 'chest', 'neck', 'head', 'jaw',
         'upperarm.L', 'forearm.L', 'hand.L', 'upperarm.R', 'forearm.R', 'hand.R',
         'thigh.L', 'shin.L', 'foot.L', 'thigh.R', 'shin.R', 'foot.R']
PARENT = {'hips': None, 'spine': 'hips', 'chest': 'spine', 'neck': 'chest', 'head': 'neck', 'jaw': 'head',
          'upperarm.L': 'chest', 'forearm.L': 'upperarm.L', 'hand.L': 'forearm.L',
          'upperarm.R': 'chest', 'forearm.R': 'upperarm.R', 'hand.R': 'forearm.R',
          'thigh.L': 'hips', 'shin.L': 'thigh.L', 'foot.L': 'shin.L',
          'thigh.R': 'hips', 'shin.R': 'thigh.R', 'foot.R': 'shin.R'}
# MakeHuman bone -> ours (any MH bone not listed takes its nearest listed ancestor's). MH ".L" is the character's left.
MAP = {'root': 'hips', 'pelvis.L': 'hips', 'pelvis.R': 'hips', 'spine05': 'hips', 'spine04': 'hips', 'spine03': 'spine',
       'spine02': 'chest', 'spine01': 'chest', 'clavicle.L': 'chest', 'clavicle.R': 'chest', 'breast.L': 'chest', 'breast.R': 'chest',
       'shoulder01.L': 'chest', 'shoulder01.R': 'chest',
       'neck01': 'neck', 'neck02': 'neck', 'neck03': 'neck', 'head': 'head', 'jaw': 'jaw',
       'upperarm01.L': 'upperarm.L', 'upperarm02.L': 'upperarm.L', 'lowerarm01.L': 'forearm.L', 'lowerarm02.L': 'forearm.L', 'wrist.L': 'hand.L',
       'upperarm01.R': 'upperarm.R', 'upperarm02.R': 'upperarm.R', 'lowerarm01.R': 'forearm.R', 'lowerarm02.R': 'forearm.R', 'wrist.R': 'hand.R',
       'upperleg01.L': 'thigh.L', 'upperleg02.L': 'thigh.L', 'lowerleg01.L': 'shin.L', 'lowerleg02.L': 'shin.L', 'foot.L': 'foot.L',
       'upperleg01.R': 'thigh.R', 'upperleg02.R': 'thigh.R', 'lowerleg01.R': 'shin.R', 'lowerleg02.R': 'shin.R', 'foot.R': 'foot.R'}
# where our joints sit: the head of these MH bones
JOINT_AT = {'hips': 'spine05', 'spine': 'spine03', 'chest': 'spine01', 'neck': 'neck01', 'head': 'head', 'jaw': 'jaw',
            'upperarm.L': 'upperarm01.L', 'forearm.L': 'lowerarm01.L', 'hand.L': 'wrist.L',
            'upperarm.R': 'upperarm01.R', 'forearm.R': 'lowerarm01.R', 'hand.R': 'wrist.R',
            'thigh.L': 'upperleg01.L', 'shin.L': 'lowerleg01.L', 'foot.L': 'foot.L',
            'thigh.R': 'upperleg01.R', 'shin.R': 'lowerleg01.R', 'foot.R': 'foot.R'}

_cache = {}

def _load_obj(path):
    V, VT, F, FT, G = [], [], [], [], []
    grp = ''
    for line in open(path):
        if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('vt '): VT.append([float(x) for x in line.split()[1:3]])
        elif line.startswith('g '): grp = line.split()[1]
        elif line.startswith('f '):
            ids = [p.split('/') for p in line.split()[1:]]
            F.append([int(p[0]) - 1 for p in ids]); FT.append([int(p[1]) - 1 if len(p) > 1 and p[1] else -1 for p in ids]); G.append(grp)
    return np.array(V), np.array(VT), F, FT, G

def base():
    if 'base' not in _cache:
        V, VT, F, FT, G = _load_obj(os.path.join(DATA, '3dobjs', 'base.obj'))
        _cache['base'] = (V, VT, F, FT, G)
    return _cache['base']

def target(name):
    """name relative to targets/, without .target. Returns (indices, offsets)."""
    if name not in _cache:
        p = os.path.join(DATA, 'targets', name + '.target')
        idx, off = [], []
        for line in open(p):
            if not line.strip() or line[0] == '#': continue
            q = line.split()
            idx.append(int(q[0])); off.append([float(q[1]), float(q[2]), float(q[3])])
        _cache[name] = (np.array(idx, int), np.array(off))
    return _cache[name]

def _lerp_w(v, lo_name, mid_name, hi_name):
    """MakeHuman-style three-way weights for a 0..1 slider (0.5 = average)."""
    if v < 0.5: return {lo_name: (0.5 - v) * 2, mid_name: 1 - (0.5 - v) * 2}
    return {mid_name: 1 - (v - 0.5) * 2, hi_name: (v - 0.5) * 2}

def macro_weights(gender=0.5, age=0.5, muscle=0.5, weight=0.5, height=0.5, african=0.0, asian=0.0, caucasian=1.0):
    """{target: weight} for the macro sliders, the way MakeHuman combines them."""
    gw = {'female': 1 - gender, 'male': gender}
    if age < 0.1875: aw = {'baby': 1 - age / 0.1875, 'child': age / 0.1875}
    elif age < 0.5: aw = {'child': 1 - (age - 0.1875) / 0.3125, 'young': (age - 0.1875) / 0.3125}
    else: aw = {'young': 1 - (age - 0.5) / 0.5, 'old': (age - 0.5) / 0.5}
    mw = _lerp_w(muscle, 'minmuscle', 'averagemuscle', 'maxmuscle')
    ww = _lerp_w(weight, 'minweight', 'averageweight', 'maxweight')
    tot = african + asian + caucasian or 1.0
    ew = {'african': african / tot, 'asian': asian / tot, 'caucasian': caucasian / tot}
    out = {}
    for g, a_ in gw.items():
        for a, b_ in aw.items():
            for e, c_ in ew.items():
                w = a_ * b_ * c_
                if w > 1e-4: out['macrodetails/%s-%s-%s' % (e, g, a)] = out.get('macrodetails/%s-%s-%s' % (e, g, a), 0) + w
            for m, d_ in mw.items():
                for wt, e_ in ww.items():
                    w = a_ * b_ * d_ * e_
                    if w > 1e-4: out['macrodetails/universal-%s-%s-%s-%s' % (g, a, m, wt)] = w
                    if height != 0.5:
                        hn = 'maxheight' if height > 0.5 else 'minheight'
                        hw = abs(height - 0.5) * 2 * w
                        if hw > 1e-4: out['macrodetails/height/%s-%s-%s-%s-%s' % (g, a, m, wt, hn)] = hw
    return out

def shape(sp):
    """The base mesh with a character's targets applied (MakeHuman units, Y up, facing +Z)."""
    V = base()[0].copy()
    tw = macro_weights(**sp.get('macro', {}))
    for k, w in sp.get('targets', {}).items():
        tw[k] = tw.get(k, 0) + w
    for name, w in tw.items():
        idx, off = target(name)
        if len(idx): V[idx] += off * w
    return V

def skeleton_heads(V):
    sk = json.load(open(os.path.join(DATA, 'rigs', 'default.mhskel')))
    J = {}
    for b, d in sk['bones'].items():
        J[b] = V[sk['joints'][d['head']]].mean(axis=0)
        J[b + '@tail'] = V[sk['joints'][d['tail']]].mean(axis=0)
    return J, {b: d['parent'] for b, d in sk['bones'].items()}

def weights_ours(nv, mh_parent):
    """(nv, 4) bone indices into BONES and (nv, 4) weights, from the MakeHuman weights."""
    if 'w' not in _cache:
        _cache['w'] = json.load(open(os.path.join(DATA, 'rigs', 'default_weights.mhw')))['weights']
    W = np.zeros((nv, len(BONES)))
    def ours(b):
        while b and b not in MAP: b = mh_parent.get(b)
        return MAP.get(b, 'hips')
    for b, lst in _cache['w'].items():
        ob = BONES.index(ours(b))
        for vi, w in lst:
            W[vi, ob] += w
    # MakeHuman's weights only cover the body: give every helper vertex (clothes helpers, hair, eyes, teeth) the
    # weights of the nearest body vertex, so they move with the body
    from scipy.spatial import cKDTree
    Vb, _, F, _, G = base()
    body_v = np.unique([v for i, g in enumerate(G) if g == 'body' for v in F[i]])
    unweighted = np.where(W.sum(axis=1) == 0)[0]
    if len(unweighted):
        tree = cKDTree(Vb[body_v])
        _, nn = tree.query(Vb[unweighted])
        W[unweighted] = W[body_v[nn]]
    top = np.argsort(-W, axis=1)[:, :4]
    tw = np.take_along_axis(W, top, axis=1)
    s = tw.sum(axis=1, keepdims=True)
    s[s == 0] = 1
    tw = tw / s
    top[tw.sum(axis=1) == 0, 0] = 0
    return top.astype(np.uint16), tw.astype(np.float32), W

def _rot(axis, ang):
    axis = axis / (np.linalg.norm(axis) or 1)
    x, y, z = axis; c, s = math.cos(ang), math.sin(ang); C = 1 - c
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])

def repose_arms(V, J, Wfull, arm_out_deg=6.0):
    """MakeHuman's rest has the arms raised out to the side; ours hangs them down. Rotate each whole arm about the
    shoulder (blended by the arm's share of each vertex's weight, so the shoulder deforms smoothly) and straighten
    the elbow, so upperarm->wrist points straight down, splayed out `arm_out_deg`."""
    V = V.copy()
    Jn = {k: v.copy() for k, v in J.items()}
    for side, sx in (('L', 1.0), ('R', -1.0)):          # MH space: character's left is +X
        sh, el, wr = J['upperarm01.' + side], J['lowerarm01.' + side], J['wrist.' + side]
        want = np.array([sx * math.sin(math.radians(arm_out_deg)), -math.cos(math.radians(arm_out_deg)), 0.0])
        d = el - sh
        ax = np.cross(d, want); ang = math.atan2(np.linalg.norm(ax), np.dot(d, want))
        R1 = _rot(ax, ang)
        ui = [BONES.index(b + '.' + side) for b in ('upperarm', 'forearm', 'hand')]
        w_arm = Wfull[:, ui].sum(axis=1)
        moved = (V - sh) @ R1.T + sh
        V = V + (moved - V) * w_arm[:, None]
        el2 = (el - sh) @ R1.T + sh; wr2 = (wr - sh) @ R1.T + sh
        # straighten the forearm onto the same line
        d2 = wr2 - el2
        ax2 = np.cross(d2, want); ang2 = math.atan2(np.linalg.norm(ax2), np.dot(d2, want))
        R2 = _rot(ax2, ang2)
        fi = [BONES.index(b + '.' + side) for b in ('forearm', 'hand')]
        w_fo = Wfull[:, fi].sum(axis=1)
        moved = (V - el2) @ R2.T + el2
        V = V + (moved - V) * w_fo[:, None]
        for k in list(J.keys()):
            if k.endswith('.' + side) or k.endswith('.' + side + '@tail'):
                base_k = k.split('@')[0]
                if any(base_k.startswith(p) for p in ('upperarm', 'lowerarm', 'wrist', 'finger', 'metacarpal')):
                    p = (J[k] - sh) @ R1.T + sh
                    if not base_k.startswith('upperarm'):
                        p = (p - el2) @ R2.T + el2
                    Jn[k] = p
    # the legs: MakeHuman stands them apart; ours hang nearly straight down from the hips
    for side, sx in (('L', 1.0), ('R', -1.0)):
        hp, kn, an = Jn['upperleg01.' + side], Jn['lowerleg01.' + side], Jn['foot.' + side]
        want = np.array([sx * math.sin(math.radians(2.0)), -math.cos(math.radians(2.0)), 0.0])
        d = an - hp; d[2] = 0.0                              # only straighten sideways; keep the knee's natural bend
        w2 = want.copy()
        ax = np.cross(d, w2); ang = math.atan2(np.linalg.norm(ax), np.dot(d, w2))
        R = _rot(ax, ang)
        li = [BONES.index(b + '.' + side) for b in ('thigh', 'shin', 'foot')]
        w_leg = Wfull[:, li].sum(axis=1)
        moved = (V - hp) @ R.T + hp
        V = V + (moved - V) * w_leg[:, None]
        for k in list(Jn.keys()):
            base_k = k.split('@')[0]
            if (k.endswith('.' + side) or k.endswith('.' + side + '@tail')) and any(base_k.startswith(p) for p in ('upperleg', 'lowerleg', 'foot', 'toe')):
                Jn[k] = (Jn[k] - hp) @ R.T + hp
    return V, Jn

def body_faces():
    """Indices of the faces that are the body itself (not MakeHuman's helper geometry)."""
    _, _, F, FT, G = base()
    return [i for i, g in enumerate(G) if g == 'body']

def build_body(sp):
    """Everything for one character: verts (m, game space), faces, uvs, joints (ours), weights."""
    V = shape(sp)
    Jmh, par = skeleton_heads(V)
    top, tw, Wfull = weights_ours(len(V), par)
    V, Jmh = repose_arms(V, Jmh, Wfull, sp.get('arm_out', 6.0))
    s = 0.1                                             # MakeHuman decimetres -> metres
    def game(p):                                        # face -Z: turn 180 about Y
        p = np.asarray(p) * s
        return np.stack([-p[..., 0], p[..., 1], -p[..., 2]], axis=-1)
    Vg = game(V)
    floor = Vg[:, 1].min()
    Vg[:, 1] -= floor
    J = {}
    for ours, mh in JOINT_AT.items():
        j = game(Jmh[mh]); j[1] -= floor; J[ours] = j
    Jmh_g = {k: (lambda q: (q - np.array([0, floor, 0])))(game(v)) for k, v in Jmh.items()}
    return dict(V=Vg, J=J, Jmh=Jmh_g, top=top, tw=tw, W=Wfull, height=float(Vg[:, 1].max()))
