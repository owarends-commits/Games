"""Prototype: PS1-style low-poly versions of a few characters, as <id>_lp (not used by the game yet)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_humans as B

FACES = {
 'kenneth': dict(brow='#3a2818', brow_w=0.06, brow_angle=0.025, lips='#a8706a', stubble=1.0, mouth_w=0.2, blush_a=30),
 'norah':   dict(brow='#3a2418', brow_w=0.042, brow_angle=-0.01, lips='#c07a78', freckles=True, mouth_w=0.17, mouth_turn=-0.005, blush_a=70),
 'stranger': dict(brow='#4a3a30', brow_w=0.035, brow_angle=0.03, lips='#9a6a64', mouth_w=0.22, mouth_turn=-0.015, blush_a=0),
}
LP = dict(cell=0.045, head_cell=None, head_from=0.28)

if __name__ == '__main__':
    ids = sys.argv[1:] or list(FACES)
    mp = os.path.join(B.OUT, 'manifest.json'); man = json.load(open(mp))
    for cid in ids:
        base = next(c for c in B.CAST if c['id'] == cid)
        sp = dict(base, id=cid + '_lp', drawn_face=FACES[cid], lowpoly=LP, expr={})
        ch0 = B.make_body(sp)
        ch, tris = B.write(sp, {'idle': B.anims_for(sp, ch0)['idle']})
        man[sp['id']] = {'height': sp['height'], 'tris': tris, 'animations': ['idle'], 'pipeline': 'lowpoly_test'}
        print(sp['id'], tris)
    json.dump(man, open(mp, 'w'), indent=1)
