"""Data for the Character Creator (tools/character_creator.html): the MakeHuman base mesh, its morph targets and the
cast presets, packed for the browser, so the creator previews the same body shapes the game builds.

    python3 tools/build_creator_data.py      -> tools/creator/creator_data.wasm + tools/creator/creator_meta.json

What goes in:
  - the base mesh (body, the skirt and long-hair helpers, the eyes, and the joint markers), MakeHuman units (dm), +Z front
  - per-vertex regions (head, neck, arms, legs...), how far down each arm / leg it is, for the clothing masks
  - the macro targets (gender, age, muscle, weight, height, ethnicity: 240 dense targets), compressed to a small
    PCA basis; the browser mixes them with MakeHuman's own weighting (macro_weights) and rebuilds the offsets
  - the detail targets behind every slider (face and body sculpting), the expression units, sparse and quantised
  - the cast (build_humans.CAST) as presets
"""
import glob, json, os, re, struct, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import hb_core as H
import mh_human as M

OUT = os.path.join(HERE, 'creator')
DATA = os.path.join(HERE, 'mh_data')
K_PCA = 56

GROUPS = ['body', 'helper-skirt', 'helper-hair', 'helper-l-eye', 'helper-r-eye']
JOINTS = ['upperarm01.L', 'lowerarm01.L', 'wrist.L', 'upperarm01.R', 'lowerarm01.R', 'wrist.R',
          'upperleg01.L', 'lowerleg01.L', 'foot.L', 'upperleg01.R', 'lowerleg01.R', 'foot.R',
          'head', 'eye.L', 'eye.R', 'neck01', 'spine01']

# ------------------------------------------------------------------ the sliders: [id, label, minus target, plus target]
# A target name with {s} is applied to both sides (l- and r-). '' = nothing on that side (a one-way slider 0..1).
def T(path): return path
BODY = [
  ('Torso', [
    ('shoulders', 'Shoulder width', 'torso/torso-scale-horiz-decr', 'torso/torso-scale-horiz-incr'),
    ('vshape', 'V-shape', 'torso/torso-vshape-decr', 'torso/torso-vshape-incr'),
    ('torso_len', 'Torso length', 'torso/torso-scale-vert-decr', 'torso/torso-scale-vert-incr'),
    ('chest_depth', 'Chest depth', 'torso/torso-scale-depth-decr', 'torso/torso-scale-depth-incr'),
    ('pecs', 'Chest muscle', 'torso/torso-muscle-pectoral-decr', 'torso/torso-muscle-pectoral-incr'),
    ('back', 'Back muscle', 'torso/torso-muscle-dorsi-decr', 'torso/torso-muscle-dorsi-incr'),
    ('bust', 'Bust size', 'breast/female-young-averagemuscle-averageweight-mincup-averagefirmness', 'breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness'),
    ('bust_h', 'Bust height', 'breast/breast-trans-down', 'breast/breast-trans-up'),
    ('belly', 'Belly', 'stomach/stomach-pregnant-decr', 'stomach/stomach-pregnant-incr'),
    ('tone', 'Stomach tone', 'stomach/stomach-tone-decr', 'stomach/stomach-tone-incr'),
  ]),
  ('Hips & neck', [
    ('hips', 'Hip width', 'hip/hip-scale-horiz-decr', 'hip/hip-scale-horiz-incr'),
    ('hips_d', 'Hip depth', 'hip/hip-scale-depth-decr', 'hip/hip-scale-depth-incr'),
    ('waist', 'Waist height', 'hip/hip-waist-down', 'hip/hip-waist-up'),
    ('butt', 'Buttocks', 'buttocks/buttocks-volume-decr', 'buttocks/buttocks-volume-incr'),
    ('neck_len', 'Neck length', 'neck/neck-scale-vert-decr', 'neck/neck-scale-vert-incr'),
    ('neck_w', 'Neck thickness', 'neck/neck-scale-horiz-decr', 'neck/neck-scale-horiz-incr'),
    ('dchin', 'Double chin', 'neck/neck-double-decr', 'neck/neck-double-incr'),
  ]),
  ('Arms', [
    ('arm_fat', 'Upper arm size', 'armslegs/{s}-upperarm-fat-decr', 'armslegs/{s}-upperarm-fat-incr'),
    ('arm_mus', 'Arm muscle', 'armslegs/{s}-upperarm-muscle-decr', 'armslegs/{s}-upperarm-muscle-incr'),
    ('fore_fat', 'Forearm size', 'armslegs/{s}-lowerarm-fat-decr', 'armslegs/{s}-lowerarm-fat-incr'),
    ('delts', 'Shoulder muscle', 'armslegs/{s}-upperarm-shoulder-muscle-decr', 'armslegs/{s}-upperarm-shoulder-muscle-incr'),
    ('arm_len', 'Upper arm length', 'armslegs/{s}-upperarm-scale-vert-decr', 'armslegs/{s}-upperarm-scale-vert-incr'),
    ('fore_len', 'Forearm length', 'armslegs/{s}-lowerarm-scale-vert-decr', 'armslegs/{s}-lowerarm-scale-vert-incr'),
    ('hands', 'Hand size', 'armslegs/{s}-hand-scale-decr', 'armslegs/{s}-hand-scale-incr'),
    ('fingers', 'Finger length', 'armslegs/{s}-hand-fingers-length-decr', 'armslegs/{s}-hand-fingers-length-incr'),
  ]),
  ('Legs', [
    ('thigh_fat', 'Thigh size', 'armslegs/{s}-upperleg-fat-decr', 'armslegs/{s}-upperleg-fat-incr'),
    ('thigh_mus', 'Thigh muscle', 'armslegs/{s}-upperleg-muscle-decr', 'armslegs/{s}-upperleg-muscle-incr'),
    ('calf_fat', 'Calf size', 'armslegs/{s}-lowerleg-fat-decr', 'armslegs/{s}-lowerleg-fat-incr'),
    ('calf_mus', 'Calf muscle', 'armslegs/{s}-lowerleg-muscle-decr', 'armslegs/{s}-lowerleg-muscle-incr'),
    ('thigh_len', 'Thigh length', 'armslegs/{s}-upperleg-scale-vert-decr', 'armslegs/{s}-upperleg-scale-vert-incr'),
    ('shin_len', 'Lower leg length', 'armslegs/lowerlegs-height-decr', 'armslegs/lowerlegs-height-incr'),
    ('valgus', 'Knock-kneed / bow-legged', 'armslegs/{s}-leg-valgus-decr', 'armslegs/{s}-leg-valgus-incr'),
    ('feet', 'Foot size', 'armslegs/{s}-foot-scale-decr', 'armslegs/{s}-foot-scale-incr'),
  ]),
]
FACE = [
  ('Head', [
    ('head_w', 'Head width', 'head/head-scale-horiz-decr', 'head/head-scale-horiz-incr'),
    ('head_h', 'Head height', 'head/head-scale-vert-decr', 'head/head-scale-vert-incr'),
    ('head_d', 'Head depth', 'head/head-scale-depth-decr', 'head/head-scale-depth-incr'),
    ('head_back', 'Back of the head', 'head/head-back-scale-depth-decr', 'head/head-back-scale-depth-incr'),
    ('head_fat', 'Face fullness', 'head/head-fat-decr', 'head/head-fat-incr'),
    ('head_age', 'Face age', 'head/head-age-decr', 'head/head-age-incr'),
    ('fh_h', 'Forehead height', 'forehead/forehead-scale-vert-decr', 'forehead/forehead-scale-vert-incr'),
    ('fh_slope', 'Forehead slope', 'forehead/forehead-trans-forward', 'forehead/forehead-trans-backward'),
    ('temples', 'Temples', 'forehead/forehead-temple-decr', 'forehead/forehead-temple-incr'),
  ]),
  ('Brows & eyes', [
    ('brow_h', 'Brow height', 'eyebrows/eyebrows-trans-down', 'eyebrows/eyebrows-trans-up'),
    ('brow_ang', 'Brow angle', 'eyebrows/eyebrows-angle-down', 'eyebrows/eyebrows-angle-up'),
    ('brow_ridge', 'Brow ridge', 'eyebrows/eyebrows-trans-backward', 'eyebrows/eyebrows-trans-forward'),
    ('eye_size', 'Eye size', 'eyes/{s}-eye-scale-decr', 'eyes/{s}-eye-scale-incr'),
    ('eye_space', 'Eye spacing', 'eyes/{s}-eye-trans-in', 'eyes/{s}-eye-trans-out'),
    ('eye_h', 'Eye height', 'eyes/{s}-eye-trans-down', 'eyes/{s}-eye-trans-up'),
    ('eye_open', 'Eye opening', 'eyes/{s}-eye-height2-decr', 'eyes/{s}-eye-height2-incr'),
    ('eye_tilt', 'Eye tilt', 'eyes/{s}-eye-eyefold-angle-down', 'eyes/{s}-eye-eyefold-angle-up'),
    ('eye_depth', 'Eye depth', 'eyes/{s}-eye-push1-out', 'eyes/{s}-eye-push1-in'),
    ('eye_bags', 'Bags under the eyes', 'eyes/{s}-eye-bag-decr', 'eyes/{s}-eye-bag-incr'),
    ('epicanthus', 'Eyelid fold', 'eyes/{s}-eye-epicanthus-out', 'eyes/{s}-eye-epicanthus-in'),
  ]),
  ('Nose', [
    ('nose_w', 'Nose width', 'nose/nose-scale-horiz-decr', 'nose/nose-scale-horiz-incr'),
    ('nose_len', 'Nose length', 'nose/nose-scale-vert-decr', 'nose/nose-scale-vert-incr'),
    ('nose_proj', 'Nose projection', 'nose/nose-scale-depth-decr', 'nose/nose-scale-depth-incr'),
    ('nose_h', 'Nose height', 'nose/nose-trans-down', 'nose/nose-trans-up'),
    ('nose_tip', 'Tip up / down', 'nose/nose-point-down', 'nose/nose-point-up'),
    ('nose_tip_w', 'Tip width', 'nose/nose-point-width-decr', 'nose/nose-point-width-incr'),
    ('nose_hump', 'Bridge hump', 'nose/nose-hump-decr', 'nose/nose-hump-incr'),
    ('nostrils', 'Nostril width', 'nose/nose-nostrils-width-decr', 'nose/nose-nostrils-width-incr'),
    ('flare', 'Nostril flare', 'nose/nose-flaring-decr', 'nose/nose-flaring-incr'),
    ('nose_vol', 'Nose size', 'nose/nose-volume-decr', 'nose/nose-volume-incr'),
  ]),
  ('Mouth', [
    ('mouth_w', 'Mouth width', 'mouth/mouth-scale-horiz-decr', 'mouth/mouth-scale-horiz-incr'),
    ('mouth_h', 'Mouth height', 'mouth/mouth-trans-down', 'mouth/mouth-trans-up'),
    ('mouth_d', 'Mouth forward / back', 'mouth/mouth-trans-backward', 'mouth/mouth-trans-forward'),
    ('lip_up', 'Upper lip', 'mouth/mouth-upperlip-volume-decr', 'mouth/mouth-upperlip-volume-incr'),
    ('lip_lo', 'Lower lip', 'mouth/mouth-lowerlip-volume-decr', 'mouth/mouth-lowerlip-volume-incr'),
    ('corners', 'Mouth corners', 'mouth/mouth-angles-down', 'mouth/mouth-angles-up'),
    ('cupid', "Cupid's bow", 'mouth/mouth-cupidsbow-decr', 'mouth/mouth-cupidsbow-incr'),
    ('dimples', 'Dimples', '', 'mouth/mouth-dimples-in'),
    ('laugh', 'Laugh lines', '', 'mouth/mouth-laugh-lines-in'),
  ]),
  ('Cheeks, jaw & chin', [
    ('cheekbones', 'Cheekbones', 'cheek/{s}-cheek-bones-decr', 'cheek/{s}-cheek-bones-incr'),
    ('cheeks', 'Cheek fullness', 'cheek/{s}-cheek-volume-decr', 'cheek/{s}-cheek-volume-incr'),
    ('cheek_h', 'Cheek height', 'cheek/{s}-cheek-trans-down', 'cheek/{s}-cheek-trans-up'),
    ('chin_w', 'Chin / jaw width', 'chin/chin-width-decr', 'chin/chin-width-incr'),
    ('chin_prom', 'Chin prominence', 'chin/chin-prominent-decr', 'chin/chin-prominent-incr'),
    ('chin_h', 'Chin height', 'chin/chin-height-decr', 'chin/chin-height-incr'),
    ('jaw', 'Underbite / overbite', 'chin/chin-prognathism-decr', 'chin/chin-prognathism-incr'),
    ('chin_bones', 'Jaw angle', 'chin/chin-bones-decr', 'chin/chin-bones-incr'),
    ('cleft', 'Chin cleft', '', 'chin/chin-cleft-incr'),
  ]),
  ('Ears', [
    ('ear_size', 'Ear size', 'ears/{s}-ear-scale-decr', 'ears/{s}-ear-scale-incr'),
    ('ear_wing', 'Ears stick out', 'ears/{s}-ear-wing-decr', 'ears/{s}-ear-wing-incr'),
    ('ear_lobe', 'Ear lobes', 'ears/{s}-ear-lobe-decr', 'ears/{s}-ear-lobe-incr'),
    ('ear_h', 'Ear height', 'ears/{s}-ear-trans-down', 'ears/{s}-ear-trans-up'),
    ('ear_point', 'Pointed ears', '', 'ears/{s}-ear-shape-pointed'),
  ]),
]
HEAD_SHAPES = ['oval', 'round', 'square', 'rectangular', 'triangular', 'invertedtriangular', 'diamond']

def slider_targets(neg, pos):
    out = []
    for t in (neg, pos):
        if not t: out.append([]); continue
        out.append([t.replace('{s}', 'l'), t.replace('{s}', 'r')] if '{s}' in t else [t])
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    V0, VT, F, FT, G = M.base()
    sk = json.load(open(os.path.join(DATA, 'rigs', 'default.mhskel')))
    jverts = {j: sk['joints'][sk['bones'][j]['head']] for j in JOINTS}
    # the vertex subset
    face_lists = {g: [F[i] for i in H.GROUPS[g]] for g in GROUPS}
    keep = set()
    for g in GROUPS:
        for f in face_lists[g]: keep.update(f)
    for j in JOINTS: keep.update(jverts[j])
    keep = np.array(sorted(keep))
    remap = -np.ones(len(V0), int); remap[keep] = np.arange(len(keep))
    n = len(keep)
    print('vertices:', n)
    blobs = []          # (name, bytes)
    meta = {'n': n, 'chunks': {}}
    def put(name, arr):
        b = arr.tobytes()
        off = sum(len(x[1]) for x in blobs)
        pad = (-off) % 4
        if pad: blobs.append(('_pad', b'\0' * pad)); off += pad
        meta['chunks'][name] = [off, arr.size, str(arr.dtype)]
        blobs.append((name, b))
    put('pos', V0[keep].astype(np.float32))
    # triangles per group (quads split)
    for g in GROUPS:
        tri = []
        for f in face_lists[g]:
            for k in range(1, len(f) - 1): tri.append([f[0], f[k], f[k + 1]])
        put('tri_' + g, remap[np.array(tri)].astype(np.uint16))
    meta['joints'] = {j: [int(remap[v]) for v in jverts[j]] for j in JOINTS}
    # regions, from the bone weights
    top, tw, W = M.weights_ours(len(V0), {b: d['parent'] for b, d in sk['bones'].items()})
    bi = {b: i for i, b in enumerate(M.BONES)}
    w = lambda *bs: sum(W[keep, bi[b]] for b in bs)
    reg = np.stack([w('head', 'jaw'), w('neck'),
                    w('upperarm.L', 'forearm.L', 'hand.L'), w('upperarm.R', 'forearm.R', 'hand.R'),
                    w('forearm.L', 'hand.L'), w('forearm.R', 'hand.R'), w('hand.L'), w('hand.R'),
                    w('thigh.L', 'shin.L', 'foot.L'), w('thigh.R', 'shin.R', 'foot.R'),
                    w('shin.L', 'foot.L'), w('shin.R', 'foot.R')], 1)
    put('regions', np.clip(reg * 255 + 0.5, 0, 255).astype(np.uint8))
    meta['regions'] = ['head', 'neck', 'armL', 'armR', 'foreL', 'foreR', 'handL', 'handR', 'legL', 'legR', 'shinL', 'shinR']
    S = H.Sample(V0[keep], W[keep])
    put('limb_t', np.stack([S.arm_t('L'), S.arm_t('R'), S.leg_t('L'), S.leg_t('R')], 1).astype(np.float32))
    # the macro targets, PCA
    names = sorted(set(re.sub(r'\.target$', '', os.path.relpath(p, os.path.join(DATA, 'targets')))
                       for p in glob.glob(os.path.join(DATA, 'targets', 'macrodetails', '**', '*.target'), recursive=True)))
    names = [x for x in names if 'proportions' not in x]
    Tm = np.zeros((len(names), n * 3), np.float32)
    for i, nm in enumerate(names):
        idx, off = M.target(nm)
        if not len(idx): continue
        m = remap[idx] >= 0
        D = np.zeros((n, 3), np.float32); D[remap[idx[m]]] = off[m]
        Tm[i] = D.ravel()
    U, Sg, Vt = np.linalg.svd(Tm, full_matrices=False)
    k = K_PCA
    basis = Vt[:k]                                   # (k, 3n), unit rows
    coef = (U[:, :k] * Sg[:k]).astype(np.float32)    # (targets, k)
    sc = np.abs(basis).max(1) / 32767.0
    put('pca_basis', np.round(basis / sc[:, None]).astype(np.int16))
    meta['pca'] = {'k': k, 'scale': sc.tolist(), 'targets': [x[len('macrodetails/'):] for x in names]}
    put('pca_coef', coef)
    err = np.abs(Tm - coef @ basis).max()
    print('macro targets: %d, PCA %d components, max error %.3f dm' % (len(names), k, err))
    # the detail targets
    targets = set()
    def add_sl(groups):
        out = []
        for gname, sls in groups:
            g = []
            for sid, label, neg, pos in sls:
                tn, tp = slider_targets(neg, pos)
                targets.update(tn + tp)
                g.append({'id': sid, 'label': label, 'neg': tn, 'pos': tp})
            out.append({'group': gname, 'sliders': g})
        return out
    meta['body'] = add_sl(BODY)
    meta['face'] = add_sl(FACE)
    meta['head_shapes'] = HEAD_SHAPES
    targets.update('head/head-' + h for h in HEAD_SHAPES)
    for eth in ('caucasian', 'african', 'asian'):
        pass
    units = sorted(os.path.basename(p)[:-7] for p in glob.glob(os.path.join(DATA, 'targets', 'expression', 'units', 'caucasian', '*.target')))
    targets.update('expression/units/caucasian/' + u for u in units)
    meta['expr_units'] = units
    tmeta = {}
    for t in sorted(targets):
        p = os.path.join(DATA, 'targets', t + '.target')
        if not os.path.exists(p):
            print('  missing target', t); continue
        idx, off = M.target(t)
        m = remap[idx] >= 0 if len(idx) else np.zeros(0, bool)
        idx, off = remap[idx[m]], off[m]
        if not len(idx): print('  empty target', t); continue
        s = float(np.abs(off).max() / 32767.0) or 1e-9
        put('t:' + t + ':i', idx.astype(np.uint16))
        put('t:' + t + ':o', np.round(off / s).astype(np.int16))
        tmeta[t] = s
    meta['targets'] = tmeta
    print('detail targets:', len(tmeta))
    # expression presets, the cast
    import build_humans as B
    meta['expr_presets'] = {k: v for k, v in B.EXPR.items()}
    meta['expr_scale'] = B.EXPR_SCALE
    def clean(o):
        if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if not callable(v) and k not in ('paint', 'mods', 'dir')}
        if isinstance(o, (list, tuple)): return [clean(v) for v in o if not callable(v)]
        if isinstance(o, (np.floating,)): return float(o)
        return o
    cast = [clean(c) for c in B.CAST + [B.NORAH_WORN] + B.PHOTO]
    meta['cast'] = cast
    with open(os.path.join(OUT, 'creator_data.wasm'), 'wb') as f:
        for _, b in blobs: f.write(b)
    json.dump(meta, open(os.path.join(OUT, 'creator_meta.json'), 'w'), separators=(',', ':'))
    print('wrote %.1f MB of data, %.0f KB of meta' % (sum(len(b) for _, b in blobs) / 1e6, os.path.getsize(os.path.join(OUT, 'creator_meta.json')) / 1e3))

if __name__ == '__main__':
    main()
