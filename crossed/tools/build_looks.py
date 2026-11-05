"""Caricature style tests: three looks for three characters, built as <id>_<look> models (not used by the game).
python3 tools/build_looks.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_humans as B

def both(name, w):  # l-/r- pair
    a, b = name.split('/')
    return {'%s/l-%s' % (a, b): w, '%s/r-%s' % (a, b): w}

BIG_HEAD = lambda k: {'head/head-scale-vert-incr': 0.3 * k, 'head/head-scale-horiz-incr': 0.3 * k, 'head/head-scale-depth-incr': 0.2 * k}

# per character, per look: the signature features pushed past realistic
SIG = {
 'bold': {   # one feature each, pushed hard: readable at a glance
  'norah':    {**both('eyes/eye-scale-incr', 0.6), 'chin/chin-width-decr': 0.6, 'chin/chin-triangle': 0.4, **both('cheek/cheek-bones-incr', 0.5)},
  'kenneth':  {'head/head-square': 0.9, 'chin/chin-width-incr': 1.0, 'chin/chin-prominent-incr': 0.6, 'chin/chin-height-incr': 0.4, 'eyebrows/eyebrows-trans-down': 0.6, 'nose/nose-scale-horiz-incr': 0.3},
  'stranger': {'head/head-scale-vert-incr': 0.6, 'head/head-triangular': 0.8, **both('ears/ear-scale-incr', 0.8), **both('ears/ear-wing-incr', 0.6), 'nose/nose-scale-vert-incr': 0.6, 'nose/nose-hump-incr': 0.5, **both('cheek/cheek-volume-decr', 0.7)},
 },
 'storybook': {   # softer and rounder: big eyes, small chins, a touch of a smile
  'norah':    {**both('eyes/eye-scale-incr', 0.9), 'nose/nose-scale-horiz-decr': 0.5, 'nose/nose-point-up': 0.5, 'chin/chin-width-decr': 0.4, 'mouth/mouth-angles-up': 0.4, 'head/head-oval': 0.6},
  'kenneth':  {**both('eyes/eye-scale-incr', 0.5), 'head/head-square': 0.6, 'chin/chin-width-incr': 0.6, 'nose/nose-scale-horiz-incr': 0.4, 'nose/nose-volume-incr': 0.4, 'mouth/mouth-angles-up': 0.4},
  'stranger': {**both('eyes/eye-scale-decr', 0.4), 'head/head-scale-vert-incr': 0.5, **both('ears/ear-scale-incr', 0.6), 'nose/nose-scale-vert-incr': 0.5, 'mouth/mouth-angles-down': 0.4, 'mouth/mouth-scale-horiz-incr': 0.4},
 },
 'gritty': {   # RE4-ish: heavy bone structure, deep-set eyes, long faces
  'norah':    {**both('cheek/cheek-bones-incr', 0.9), 'head/head-scale-vert-incr': 0.3, 'chin/chin-height-incr': 0.4, 'eyebrows/eyebrows-trans-down': 0.4, **both('eyes/eye-push1-in', 0.5), 'nose/nose-hump-incr': 0.3},
  'kenneth':  {'head/head-rectangular': 0.8, 'chin/chin-prominent-incr': 0.8, 'chin/chin-width-incr': 0.8, 'eyebrows/eyebrows-trans-forward': 0.7, 'eyebrows/eyebrows-trans-down': 0.6, 'nose/nose-hump-incr': 0.6, **both('cheek/cheek-bones-incr', 0.6)},
  'stranger': {'head/head-scale-vert-incr': 0.7, **both('cheek/cheek-volume-decr', 1.0), **both('cheek/cheek-bones-incr', 0.8), 'eyebrows/eyebrows-trans-forward': 0.8, **both('eyes/eye-push1-in', 0.7), 'nose/nose-hump-incr': 0.8, 'chin/chin-prognathism-incr': 0.5},
 },
}
HEAD = {'bold': 1.0, 'storybook': 1.3, 'gritty': 0.4}
FACE = {   # painted features: bolder, more "drawn"
 'bold':      dict(brow=1.6, lash=0.7),
 'storybook': dict(brow=1.3, lash=0.8),
 'gritty':    dict(brow=1.4, lash=0.4, hollow=0.5),
}
BLUSH = {'bold': 0.7, 'storybook': 0.9, 'gritty': 0.35}
EXPR = {'bold': 1.0, 'storybook': 0.6, 'gritty': 1.0}

def variants():
    out = []
    for look, chars in SIG.items():
        for cid, sig in chars.items():
            base = next(c for c in B.CAST if c['id'] == cid)
            t = dict(base.get('targets', {}))
            for k, v in {**BIG_HEAD(HEAD[look]), **sig}.items():
                t[k] = t.get(k, 0) + v
            face = dict(base.get('face', {}))
            for k, v in FACE[look].items():
                face[k] = max(face.get(k, 0), v) if k != 'brow' else face.get(k, 1.0) * v
            ex = {k: v * EXPR[look] for k, v in base.get('expr', {}).items()}
            out.append(dict(base, id='%s_%s' % (cid, look), targets=t, face=face, blush=BLUSH[look], expr=ex))
    return out

if __name__ == '__main__':
    mp = os.path.join(B.OUT, 'manifest.json')
    man = json.load(open(mp))
    for sp in variants():
        ch0 = B.make_body(sp)
        anims = {'idle': B.anims_for(sp, ch0)['idle']}
        ch, tris = B.write(sp, anims)
        man[sp['id']] = {'height': sp['height'], 'tris': tris, 'animations': ['idle'], 'pipeline': 'look_test'}
        print(sp['id'], tris)
    json.dump(man, open(mp, 'w'), indent=1)
