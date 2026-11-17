# builds the model catalogue (MODEL_LIB) from the GLB files: heights, hip height, rig, clips, extras
import json,struct,os,array
def glb(p):
    b=open(p,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; g=json.loads(b[20:20+n]); off=20+n; m=struct.unpack('<I',b[off:off+4])[0]; return g,b[off+8:off+8+m]
def catalog(root,mdir=None):
    out={}; mdir=mdir or os.path.join(os.path.dirname(root),'m')
    for d,_,fs in sorted(os.walk(root)):
        if os.path.relpath(d,root).split(os.sep)[0]=='bosses': continue   # bosses are rigged and loaded on their own
        for f in sorted(fs):
            if not f.endswith('.glb'): continue
            p=os.path.join(d,f); rel=os.path.relpath(p,os.path.dirname(root)); g,bn=glb(p); nodes=g['nodes']
            ex={}
            for n in nodes: ex.update(n.get('extras') or {})
            acc=g['accessors'][g['meshes'][0]['primitives'][0]['attributes']['POSITION']]
            tri=sum(g['accessors'][pr['indices']]['count']//3 for m in g['meshes'] for pr in m['primitives'] if 'indices' in pr)
            by={n.get('name'):n for n in nodes}
            hip=by['hips']['translation'][1] if 'hips' in by and g.get('skins') else None
            key=f[:-4]; grp=os.path.relpath(d,root).replace(os.sep,'/')
            web='m/'+os.path.relpath(p,root).replace(os.sep,'/')[:-4]+'.json'; wkb=sum(os.path.getsize(os.path.join(mdir,os.path.relpath(d,root),x))//1024 for x in os.listdir(os.path.join(mdir,os.path.relpath(d,root))) if x.startswith(key+'.') or x.startswith(key+'_tex'))
            out[key]={'f':web,'g':grp,'h':round(ex.get('height_m',acc['max'][1]),3),'hip':round(hip,4) if hip else None,
                      'x':ex.get('extra_hits',0),'end':bool(ex.get('endgame_only')),'tri':tri,'clips':[a['name'] for a in g.get('animations',[])],'kb':wkb}
    return out
if __name__=='__main__':
    import sys; c=catalog(sys.argv[1]); print(len(c), sum(v['kb'] for v in c.values())//1024,'MB')
    for k,v in c.items(): print(k,v['g'],v['h'],v['hip'],v['x'],v['end'],v['clips'])
