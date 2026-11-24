# Blender trial: take the two-armed Brute (rig + its approved walk and sweep, recorded from the playground) and finish it in Blender.
#   python3 brute_blender.py <in.glb> <out.glb> <out.blend>
# 1. Weights: smooth them inside each piece (the stumps bend softly at their joints instead of creasing), then blend every separate
#    piece's skin near the body into the body's skinning (arms, lumps, the hanging man stay on the surface they grow from).
# 2. The walk is marked as a loop; both clips kept as actions you can open and edit.
# 3. Saves an editable .blend and exports the game GLB.
import bpy, sys, bmesh, json
from mathutils import kdtree
inp, out, blend = sys.argv[-3:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=inp)
arm = next(o for o in bpy.data.objects if o.type=='ARMATURE'); me = max((o for o in bpy.data.objects if o.type=='MESH' and len(o.vertex_groups)), key=lambda o:len(o.data.vertices))
for o in [o for o in bpy.data.objects if o.type=='MESH' and o is not me and not o.users_scene==() and o.name.startswith('Icosphere')]: pass
rep = {"bones":len(arm.data.bones), "verts":len(me.data.vertices), "actions":[a.name for a in bpy.data.actions]}
M = me.data; groups = {g.index:g.name for g in me.vertex_groups}
def wts(v): return {g.group:g.weight for g in v.groups if g.weight>1e-4}
before_hard = sum(1 for v in M.vertices if len(wts(v))<=1)
# islands (separate pieces of mesh)
bm = bmesh.new(); bm.from_mesh(M); bm.verts.ensure_lookup_table(); isl=[-1]*len(bm.verts); n=0
for v in bm.verts:
    if isl[v.index]>=0: continue
    st=[v]; isl[v.index]=n
    while st:
        x=st.pop()
        for e in x.link_edges:
            y=e.other_vert(x)
            if isl[y.index]<0: isl[y.index]=n; st.append(y)
    n+=1
bm.free(); sizes=[0]*n
for i in isl: sizes[i]+=1
rep["islands"]=n
# 1a. smooth inside each piece: two passes of neighbour averaging (Blender's own operator, on every group)
bpy.context.view_layer.objects.active=me; me.select_set(True); bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
M.use_paint_mask_vertex=False
bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=2, expand=0.0)
bpy.ops.object.mode_set(mode='OBJECT')
# 1b. glue pieces to the body: a vertex of a smaller piece within GLUE_R of a bigger piece takes that surface's weights
GLUE_R=0.06; co=[me.matrix_world@v.co for v in M.vertices]
kd=kdtree.KDTree(len(M.vertices))
for v in M.vertices: kd.insert(co[v.index],v.index)
kd.balance(); glued=0
snap={v.index:wts(v) for v in M.vertices}
for v in M.vertices:
    mine=isl[v.index]
    best=None
    for (c,j,d) in kd.find_range(co[v.index],GLUE_R):
        if isl[j]!=mine and sizes[isl[j]]>sizes[mine] and (best is None or d<best[1]): best=(j,d)
    if not best: continue
    share=min(1.0,(1-best[1]/GLUE_R)*1.15); acc={}
    for g,w in snap[v.index].items(): acc[g]=acc.get(g,0)+w*(1-share)
    for g,w in snap[best[0]].items(): acc[g]=acc.get(g,0)+w*share
    for g in list(snap[v.index].keys()): me.vertex_groups[g].remove([v.index])
    for g,w in acc.items():
        if w>1e-4: me.vertex_groups[g].add([v.index],w,'REPLACE')
    glued+=1
rep["glued_verts"]=glued
# 1c. at most four bones a vertex, weights summing to one (what the game engines take)
bpy.context.view_layer.objects.active=me; bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4); bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
bpy.ops.object.mode_set(mode='OBJECT')
rep["single_bone_verts_before"]=before_hard; rep["single_bone_verts_after"]=sum(1 for v in M.vertices if len(wts(v))<=1)
# 2. the clips: walk loops; each kept as its own action (named, faked user so nothing is lost on save)
for a in bpy.data.actions:
    a.use_fake_user=True
    if a.name.lower().startswith("walk"): a.use_cyclic=True; a.use_frame_range=True
# 3. save and export
bpy.ops.wm.save_as_mainfile(filepath=blend)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_skins=True, export_all_influences=False, export_force_sampling=True, export_frame_step=1, export_apply=False)
print("REPORT "+json.dumps(rep))
