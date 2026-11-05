"""Characters from the Character Creator (tools/creator/character_creator.html) into the game.

    python3 tools/import_character.py <file.json> [more.json ...]      # add / update, then build them
    python3 tools/import_character.py --list

A file can hold one character, a list of them, or what the creator's "Send to Claude" stores ({spec, notes, ...}).
They're kept in data/characters/custom.json (by id) and built by tools/build_humans.py like the cast:
assets/characters/<id>.glb + its textures, with every animation, listed in the manifest.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STORE = os.path.join(ROOT, 'data', 'characters', 'custom.json')

KEEP = {'id', 'name', 'height', 'macro', 'targets', 'pal', 'face', 'blush', 'pallor', 'hair', 'outfit', 'expr', 'acc', 'frames', 'kid', 'notes'}

def load():
    return json.load(open(STORE)) if os.path.exists(STORE) else {}

def clean(sp):
    sp = {k: v for k, v in sp.items() if k in KEEP}
    sp['id'] = ''.join(c if c.isalnum() or c == '_' else '_' for c in str(sp.get('id', 'character')).lower()).strip('_') or 'character'
    for g in (sp.get('outfit') or {}).values():
        if isinstance(g, dict): g.pop('_type', None)
    if sp.get('macro', {}).get('age', 0.5) < 0.3: sp['kid'] = True
    return sp

def main(args):
    if args == ['--list']:
        for k, v in load().items(): print('%-20s %-24s %.2f m  %s' % (k, v.get('name', ''), v.get('height', 0), (v.get('notes') or '')[:60]))
        return
    db = load()
    ids = []
    for path in args:
        data = json.load(open(path))
        items = data if isinstance(data, list) else [data]
        for it in items:
            if 'spec' in it:
                sp = dict(it['spec']); sp['notes'] = it.get('notes', sp.get('notes', ''))
            else:
                sp = it
            sp = clean(sp)
            db[sp['id']] = sp; ids.append(sp['id'])
            print('imported %s (%s)%s' % (sp['id'], sp.get('name', ''), ('  notes: ' + sp['notes']) if sp.get('notes') else ''))
    os.makedirs(os.path.dirname(STORE), exist_ok=True)
    json.dump(db, open(STORE, 'w'), indent=1)
    sys.path.insert(0, HERE)
    import build_humans
    build_humans.main(ids)

if __name__ == '__main__':
    main(sys.argv[1:])
