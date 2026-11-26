import bpy, bmesh, json
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath="hob_rigged.gltf", bone_heuristic='BLENDER')
body=next(o for o in bpy.data.objects if o.type=='MESH' and len(o.vertex_groups)); M=body.data
bm=bmesh.new(); bm.from_mesh(M); bm.verts.ensure_lookup_table(); isl=[-1]*len(bm.verts); n=0
for v in bm.verts:
    if isl[v.index]>=0: continue
    st=[v]; isl[v.index]=n
    while st:
        x=st.pop()
        for e in x.link_edges:
            y=e.other_vert(x)
            if isl[y.index]<0: isl[y.index]=n; st.append(y)
    n+=1
sz={}
for i in isl: sz[i]=sz.get(i,0)+1
face=max(sz,key=sz.get); uv=bm.loops.layers.uv.active; tris=[]
for f in bm.faces:
    if isl[f.verts[0].index]!=face: continue
    pts=[(l[uv].uv[0],l[uv].uv[1]) for l in f.loops]
    # front-facing? keep normal y (Blender front is -y)
    tris.append({"p":pts,"ny":f.normal.y,"z":sum(v.co.z for v in f.verts)/len(f.verts),"x":sum(v.co.x for v in f.verts)/len(f.verts)})
json.dump(tris,open("face_uv.json","w")); print("FACEPOLYS",len(tris))
