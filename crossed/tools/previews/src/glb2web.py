# GLB -> glTF JSON (geometry/animation buffer inlined as base64) + its texture(s) as separate PNG/JPG files. Lossless.
import json,struct,os,base64,sys
def convert(src,dst_json):
    b=open(src,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; g=json.loads(b[20:20+n]); off=20+n; m=struct.unpack('<I',b[off:off+4])[0]; binc=b[off+8:off+8+m]
    base=os.path.splitext(os.path.basename(dst_json))[0]; img_views=set()
    for i,im in enumerate(g.get('images',[])):
        if 'bufferView' not in im: continue
        bv=g['bufferViews'][im['bufferView']]; data=binc[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
        ext='.jpg' if im.get('mimeType')=='image/jpeg' else '.png'; name=f"{base}_tex{i}{ext}"
        open(os.path.join(os.path.dirname(dst_json),name),'wb').write(data); img_views.add(im['bufferView'])
        del im['bufferView']; im.pop('mimeType',None); im['uri']=name
    # rebuild the buffer without the image views
    newbin=bytearray(); remap={}; views=[]
    for i,bv in enumerate(g['bufferViews']):
        if i in img_views: continue
        while len(newbin)%4: newbin.append(0)
        o=bv.get('byteOffset',0); nb=dict(bv); nb['byteOffset']=len(newbin); newbin+=binc[o:o+bv['byteLength']]; remap[i]=len(views); views.append(nb)
    g['bufferViews']=views
    for a in g.get('accessors',[]):
        if 'bufferView' in a: a['bufferView']=remap[a['bufferView']]
    for im in g.get('images',[]):
        if 'bufferView' in im: im['bufferView']=remap[im['bufferView']]
    g['buffers']=[{'byteLength':len(newbin),'uri':'data:application/octet-stream;base64,'+base64.b64encode(bytes(newbin)).decode()}]
    json.dump(g,open(dst_json,'w'),separators=(',',':'))
src,dst=sys.argv[1],sys.argv[2]
for d,_,fs in os.walk(src):
    for f in fs:
        if not f.endswith('.glb'): continue
        rel=os.path.relpath(os.path.join(d,f),src); out=os.path.join(dst,rel[:-4]+'.json'); os.makedirs(os.path.dirname(out),exist_ok=True); convert(os.path.join(d,f),out)
print('ok')
