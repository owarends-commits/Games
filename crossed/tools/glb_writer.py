"""glTF (.glb) writer for the human characters: indexed, smoothly skinned (4 bones per vertex), several materials,
our 18-bone skeleton (BONES in mh_human.py) with no rest rotations, and the game's keyframed animations
(the same pose functions as tools/build_characters.py: {bone: (x, y, z) degrees, 'root': (x, y, z) metres})."""
import json, struct
import numpy as np

def euler(rx, ry, rz):
    # identical to build_characters.euler: XYZ intrinsic, degrees -> quaternion (w, x, y, z)
    import math
    cx, sx = math.cos(math.radians(rx) / 2), math.sin(math.radians(rx) / 2)
    cy, sy = math.cos(math.radians(ry) / 2), math.sin(math.radians(ry) / 2)
    cz, sz = math.cos(math.radians(rz) / 2), math.sin(math.radians(rz) / 2)
    # q = qx * qy * qz
    w = cx * cy * cz - sx * sy * sz
    x = sx * cy * cz + cx * sy * sz
    y = cx * sy * cz - sx * cy * sz
    z = cx * cy * sz + sx * sy * cz
    return [w, x, y, z]

def write(path, name, bones, parent, joints, prims, materials, images, anims, euler_fn=None):
    """prims: [{pos (n,3), nrm (n,3), uv (n,2), jn (n,4) uint16, wt (n,4), idx (m,) uint32, material: int}]
    materials: [{'name', 'image': index or None, 'color': [r,g,b,a]}]   images: [filename next to the .glb]"""
    E = euler_fn or euler
    buf = bytearray(); views = []; accs = []
    def view(data, target=None):
        while len(buf) % 4: buf.append(0)
        off = len(buf); buf.extend(data)
        v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    def acc(arr, ctype, typ, target=None, minmax=False):
        arr = np.ascontiguousarray(arr)
        vi = view(arr.tobytes(), target)
        a = {'bufferView': vi, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
        if minmax:
            a['min'] = [float(x) for x in np.atleast_1d(arr.min(axis=0))]; a['max'] = [float(x) for x in np.atleast_1d(arr.max(axis=0))]
        accs.append(a); return len(accs) - 1
    bi = {b: i for i, b in enumerate(bones)}
    world = {b: np.array(joints[b], float) for b in bones}
    nodes = []
    for b in bones:
        p = parent[b]; loc = world[b] - (world[p] if p else 0)
        nodes.append({'name': b, 'translation': [float(x) for x in loc]})
    for b in bones:
        ch = [bi[c] for c in bones if parent[c] == b]
        if ch: nodes[bi[b]]['children'] = ch
    gprims = []
    for p in prims:
        if len(p['idx']) == 0: continue
        gprims.append({'attributes': {'POSITION': acc(p['pos'].astype(np.float32), 5126, 'VEC3', 34962, True),
                                      'NORMAL': acc(p['nrm'].astype(np.float32), 5126, 'VEC3', 34962),
                                      'TEXCOORD_0': acc(p['uv'].astype(np.float32), 5126, 'VEC2', 34962),
                                      'JOINTS_0': acc(p['jn'].astype(np.uint16), 5123, 'VEC4', 34962),
                                      'WEIGHTS_0': acc(p['wt'].astype(np.float32), 5126, 'VEC4', 34962)},
                       'indices': acc(p['idx'].astype(np.uint32), 5125, 'SCALAR', 34963), 'material': p['material']})
    ibm = []
    for b in bones:
        m = np.eye(4, dtype=np.float32); m[:3, 3] = -world[b]; ibm.append(m.T.flatten())
    ibm_acc = acc(np.array(ibm, np.float32), 5126, 'MAT4')
    mesh_node = len(nodes); nodes.append({'name': name + '_mesh', 'mesh': 0, 'skin': 0})
    root_node = len(nodes); nodes.append({'name': name, 'children': [bi[bones[0]], mesh_node]})
    mats = []
    for m in materials:
        pb = {'metallicFactor': 0.0, 'roughnessFactor': 1.0, 'baseColorFactor': m.get('color', [1, 1, 1, 1])}
        if m.get('image') is not None: pb['baseColorTexture'] = {'index': m['image']}
        mm = {'name': m['name'], 'pbrMetallicRoughness': pb}
        if m.get('alpha'): mm['alphaMode'] = 'MASK'; mm['alphaCutoff'] = 0.5; mm['doubleSided'] = True
        if m.get('emissive'): mm['emissiveFactor'] = [1, 1, 1]
        mats.append(mm)
    gl = {'asset': {'version': '2.0', 'generator': 'extrecated build_humans.py'}, 'scene': 0, 'scenes': [{'nodes': [root_node]}],
          'nodes': nodes, 'meshes': [{'name': name, 'primitives': gprims}],
          'skins': [{'joints': list(range(len(bones))), 'inverseBindMatrices': ibm_acc, 'skeleton': bi[bones[0]]}],
          'images': [{'uri': im, 'name': im.split('.')[0]} for im in images],
          'samplers': [{'magFilter': 9728, 'minFilter': 9728, 'wrapS': 33071, 'wrapT': 33071}],
          'textures': [{'sampler': 0, 'source': i} for i in range(len(images))],
          'materials': mats, 'animations': []}
    FPS = 30
    for an, (dur, fn, loop) in anims.items():
        n = max(2, int(round(dur * FPS)) + 1)
        times = np.linspace(0, dur, n).astype(np.float32)
        samples = [fn(float(t) if not loop or t < dur else 0.0) for t in times]
        t_acc = acc(times.reshape(-1, 1), 5126, 'SCALAR', None, True)
        samplers = []; channels = []
        for b in bones:
            q = np.array([E(*s.get(b, (0, 0, 0)))[1:] + E(*s.get(b, (0, 0, 0)))[:1] for s in samples], np.float32)
            for i in range(1, len(q)):
                if np.dot(q[i], q[i - 1]) < 0: q[i] = -q[i]
            samplers.append({'input': t_acc, 'output': acc(q, 5126, 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi[b], 'path': 'rotation'}})
        for b in bones:
            if any(('s:' + b) in sm for sm in samples):
                sc = np.array([sm.get('s:' + b, (1, 1, 1)) for sm in samples], np.float32)
                samplers.append({'input': t_acc, 'output': acc(sc, 5126, 'VEC3'), 'interpolation': 'LINEAR'})
                channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi[b], 'path': 'scale'}})
        rest = world[bones[0]]
        tr = np.array([rest + np.array(s.get('root', (0, 0, 0))) for s in samples], np.float32)
        samplers.append({'input': t_acc, 'output': acc(tr, 5126, 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': bi[bones[0]], 'path': 'translation'}})
        gl['animations'].append({'name': an, 'samplers': samplers, 'channels': channels})
    while len(buf) % 4: buf.append(0)
    gl['buffers'] = [{'byteLength': len(buf)}]; gl['bufferViews'] = views; gl['accessors'] = accs
    js = json.dumps(gl, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(buf), 0x004E4942)); f.write(bytes(buf))
