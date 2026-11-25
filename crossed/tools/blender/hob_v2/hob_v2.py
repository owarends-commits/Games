# The Hob, rework step 1: a fetal, bony body, sharper surface, greasy stringy hair, translucent torso with insides.
# Built from the rigged Hob (crossed/tools/hob_preview/m/bosses/hob/hob_rigged.json); the original hob.glb is untouched.
#   python3 hob_v2.py -- <rigged.gltf> <color.png> <normal.png> <out.glb> <out.blend>
# Coordinates here are Blender's: Z up, the Hob faces -Y, its body runs back along +Y.
import bpy, bmesh, sys, math, random
from mathutils import Vector, bvhtree
A=sys.argv[sys.argv.index('--')+1:]; SRC,COL,NRM,OUT,BLEND=A[:5]
random.seed(11)
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.context.scene.render.fps=60
bpy.ops.import_scene.gltf(filepath=SRC, bone_heuristic='BLENDER')
for o in [o for o in bpy.data.objects if o.name.startswith("Icosphere")]: bpy.data.objects.remove(o)
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE'); body=next(o for o in bpy.data.objects if o.type=='MESH')
M=body.data; GN={g.index:g.name for g in body.vertex_groups}
rep={}
def W(v): return {GN[g.group]:g.weight for g in v.groups if g.weight>1e-4}
J={b.name:(arm.matrix_world@b.head_local).copy() for b in arm.data.bones}
# ---------------------------------------------------------------- islands
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
bm.free(); size=[0]*n
for i in isl: size[i]+=1
Wv=[W(v) for v in M.vertices]
def dom(i): w=Wv[i]; return max(w,key=w.get) if w else ""
# what each island is, by where its weight goes
kind={}
for k in range(n): kind[k]={}
for i,v in enumerate(M.vertices):
    d=dom(i); g=('head' if d in('head','jaw') else 'spine' if d.startswith('spine') or d=='root' else 'arm' if d.split('_')[0] in('shoulder','elbow','hand') else 'finger' if d.startswith('finger') else 'leg' if d.split('_')[0] in('leg','foot') else '?')
    kind[isl[i]][g]=kind[isl[i]].get(g,0)+1
ikind={k:max(c,key=c.get) for k,c in kind.items()}
# hair: the dark islands round the head (cap and side curtains), by their texture colour
img=next(i for i in bpy.data.images); px=list(img.pixels); IW,IH=img.size
uvl=M.uv_layers.active.data; vuv=[None]*len(M.vertices)
for p in M.polygons:
    for li,vi in zip(p.loop_indices,p.vertices): vuv[vi]=uvl[li].uv
def texlum(uv):
    x=min(IW-1,max(0,int(uv[0]*IW))); y=min(IH-1,max(0,int(uv[1]*IH))); k=(y*IW+x)*4; return (px[k]+px[k+1]+px[k+2])/3
isl_dark={}
for i in range(len(M.vertices)):
    if vuv[i] is None: continue
    k=isl[i]; s=isl_dark.setdefault(k,[0,0]); s[0]+=texlum(vuv[i]); s[1]+=1
ctr={}
for i,v in enumerate(M.vertices): c=ctr.setdefault(isl[i],[0,0]); c[0]+=v.co.z; c[1]+=1
hair_isl=[k for k,(t,c) in isl_dark.items() if ikind[k]=='head' and c>50 and t/c<0.25 and size[k]<1000 and ctr[k][0]/ctr[k][1]>1.0 and max(Wv[i].get('jaw',0) for i in range(len(isl)) if isl[i]==k)<0.01]
# the shoulder blades: two flat plates on the back by the shoulders (removed, user direction 2026-11-25)
blade_isl=[]
for k in range(n):
    if ikind[k]!='spine' or not (60<=size[k]<=95): continue
    P=[M.vertices[i].co for i in range(len(isl)) if isl[i]==k]; zs=[p.z for p in P]; ys=[p.y for p in P]
    if min(zs)>1.4 and max(zs)-min(zs)<0.35 and 1.5<sum(ys)/len(ys)<2.8: blade_isl.append(k)
torso_isl=max((k for k in range(n) if ikind[k]=='spine'), key=lambda k:size[k])
rib_isl=[k for k in range(n) if ikind[k]=='spine' and 80<=size[k]<=130]
rep.update(blades=[size[k] for k in blade_isl], islands=n, hair_islands=[size[k] for k in hair_isl], torso_verts=size[torso_isl], ribs=len(rib_isl))
# ---------------------------------------------------------------- 1. the fetal reshape
D={b:Vector((0,0,0)) for b in J}
for s in "LR":
    sh,el,ha=J['shoulder_'+s],J['elbow_'+s],J['hand_'+s]
    flat=lambda v: Vector((v.x,v.y,0))
    D['elbow_'+s]=flat((el-sh)*0.3)+Vector((0,0,0.22)); D['hand_'+s]=flat(D['elbow_'+s]+(ha-el)*0.34)
    for f in range(4):
        b0=J[f'finger_{s}{f}_0']; D[f'finger_{s}{f}_0']=D['hand_'+s].copy()
        for j in (1,2): D[f'finger_{s}{f}_{j}']=D['hand_'+s]+(J[f'finger_{s}{f}_{j}']-b0)*0.4
D['spine1']=Vector((0,0,0.35)); D['spine2']=Vector((0,0.1,0.55)); D['spine3']=Vector((0,0.15,0.28))
for s in "LR": D['leg_'+s]=D['spine3'].copy(); fl=(J['foot_'+s]-J['leg_'+s])*0.3; D['foot_'+s]=Vector((0,0.15+fl.y,0))
SP=[J['root'],J['spine1'],J['spine2'],J['spine3'],J['spine3']+Vector((0,1.4,-0.1))]
def axis_at(y):
    for a,b in zip(SP,SP[1:]):
        if y<=b.y or b is SP[-1]: u=max(0,min(1,(y-a.y)/(b.y-a.y))); return a.lerp(b,u)
def seg_radial(p,a,b):
    ab=b-a; u=max(0,min(1,(p-a).dot(ab)/ab.length_squared)); c=a+ab*u; return p-c
def thin_f(y,k):
    f=0.84 if k in rib_isl else 0.66; tp=max(0.0,min(1.0,(y-4.3)/1.0)); return f+(1-f)*tp*tp*(3-2*tp)
tv=[M.vertices[i].co for i in range(len(isl)) if isl[i]==torso_isl]
vert_isl={}
for k in range(n):
    if ikind[k]!='spine' or not (25<=size[k]<=60): continue
    P=[M.vertices[i].co for i in range(len(isl)) if isl[i]==k]; c=sum(P,Vector())/len(P)
    if abs(c.x)>0.15 or c.z<1.3: continue
    top=max((p.z for p in tv if abs(p.x)<0.18 and abs(p.y-c.y)<0.12),default=None)
    if top is None: continue
    ry=[M.vertices[i].co.y for i in range(len(isl)) if isl[i] in rib_isl]; inr=min(ry)-0.1<=c.y<=max(ry)+0.1
    ax=axis_at(c.y); f=thin_f(c.y,rib_isl[0] if inr else torso_isl); vert_isl[k]=Vector((0,0,(top-ax.z)*(f-1)-0.02))
rep['vertebrae']=len(vert_isl)
vert_big={}
for k in vert_isl:
    P=[M.vertices[i].co for i in range(len(isl)) if isl[i]==k]; c=sum(P,Vector())/len(P); ry=[M.vertices[i].co.y for i in range(len(isl)) if isl[i] in rib_isl]
    if min(ry)-0.1<=c.y<=max(ry)+0.1: vert_big[k]=c
butt_isl=set()
for k in range(n):
    if not (80<=size[k]<=100): continue
    P=[M.vertices[i].co for i in range(len(isl)) if isl[i]==k]; c=sum(P,Vector())/len(P)
    if abs(c.x)<0.1 and 6.7<c.y<7.6: butt_isl.add(k)
rep['butt']=len(butt_isl)
newco=[]
for i,v in enumerate(M.vertices):
    p=v.co.copy(); w=Wv[i]; d=Vector((0,0,0))
    for b,x in w.items(): d+=D.get(b,Vector((0,0,0)))*x
    k=isl[i]; ws=sum(x for b,x in w.items() if b.startswith('spine') or b=='root')
    if ws>0 and p.y>1.25 and (k==torso_isl or k in rib_isl):
        c=axis_at(p.y); r=p-c; f=0.84 if k in rib_isl else 0.66; tp=max(0.0,min(1.0,(p.y-4.3)/1.0)); f=f+(1-f)*tp*tp*(3-2*tp)
        d+=-r*(1-f)*ws
    wa=sum(x for b,x in w.items() if b.split('_')[0] in('shoulder','elbow','hand'))
    if wa>0 and ikind[k]=='arm':
        s='R' if p.x>0 else 'L'; r1=seg_radial(p,J['shoulder_'+s],J['elbow_'+s]); r2=seg_radial(p,J['elbow_'+s],J['hand_'+s]); r=r1 if r1.length<r2.length else r2; d+=-r*0.24*wa
    wl=sum(x for b,x in w.items() if b.split('_')[0] in('leg','foot'))
    if wl>0 and ikind[k]=='leg':
        s='R' if p.x>0 else 'L'; d+=-seg_radial(p,J['leg_'+s],J['foot_'+s])*0.4*wl
    wf=sum(x for b,x in w.items() if b.startswith('finger'))
    if wf>0 and ikind[k]=='finger':
        b=max((b for b in w if b.startswith('finger')),key=w.get); nb=b[:-1]+str(min(2,int(b[-1])+1)); a=J[b]; c=J[nb] if nb!=b else J[b]+(J[b]-J[b[:-1]+'1'])
        d+=-seg_radial(p,a,c)*0.2*wf
    if k in butt_isl: d=D['spine3'].copy()
    if k in vert_isl:
        d+=vert_isl[k]
        if k in vert_big: d+=(p-vert_big[k])*0.35
    newco.append(p+d)
for v,p in zip(M.vertices,newco): v.co=p
bpy.context.view_layer.objects.active=arm; bpy.ops.object.mode_set(mode='EDIT')
for eb in arm.data.edit_bones:
    dd=D.get(eb.name,Vector((0,0,0))); eb.head=eb.head+dd; eb.tail=eb.tail+dd
bpy.ops.object.mode_set(mode='OBJECT')
# ---------------------------------------------------------------- 2. sharper surface: weld seams (not the mouth tear), subdivide
mouth=set(i for i,w in enumerate(Wv) if w.get('jaw',0)>0.01)
bm=bmesh.new(); bm.from_mesh(M); bm.verts.ensure_lookup_table()
mouth_near=set()
kd=__import__('mathutils').kdtree.KDTree(len(bm.verts))
for v in bm.verts: kd.insert(v.co,v.index)
kd.balance()
for i in mouth:
    for (_,j,_) in kd.find_range(bm.verts[i].co,0.003): mouth_near.add(j)
hairv=set(i for i in range(len(isl)) if isl[i] in hair_isl)
cand=[v for v in bm.verts if v.index not in mouth_near and v.index not in hairv]
n0=len(bm.verts); bmesh.ops.remove_doubles(bm,verts=cand,dist=0.0015)
# drop the old hair curtains (the strands replace them); keep the scalp cap
cap=max(hair_isl,key=lambda k:size[k]) if hair_isl else None
bm.verts.ensure_lookup_table()
kill=[v for v in bm.verts if v.index<len(isl) and isl[v.index] in hair_isl and isl[v.index]!=cap]
# (indices shift after remove_doubles; recompute membership by layer instead)
bm.free()
# redo cleanly with a layer marking islands
bm=bmesh.new(); bm.from_mesh(M); L=bm.verts.layers.int.new("isl"); bm.verts.ensure_lookup_table()
for v in bm.verts: v[L]=isl[v.index]
cand=[v for v in bm.verts if v.index not in mouth_near and v.index not in hairv]
bmesh.ops.remove_doubles(bm,verts=cand,dist=0.0015); rep["welded"]=n0-len(bm.verts)
bump_isl=set(k for k in range(n) if ikind[k] in('leg','spine') and size[k]<70 and k not in rib_isl and k!=torso_isl and ctr[k][0]/ctr[k][1]<1.6 and True)
def _iy(k):
    ys=[M.vertices[i].co.y for i in range(len(isl)) if isl[i]==k]; return min(ys),max(ys),sum(ys)/len(ys)
bump_isl=set(k for k in bump_isl if _iy(k)[0]>4.6 and _iy(k)[1]<7.1 and size[k]<=40)
rep['bumps_removed']=len(bump_isl)
# the loose band round the butt: a thin ring just behind the torso's end, standing off the hips (user: no gap at the butt)
kill=[v for v in bm.verts if (v[L] in hair_isl and v[L]!=cap) or v[L] in blade_isl or v[L] in bump_isl]
bmesh.ops.delete(bm,geom=kill,context='VERTS'); rep["hair_curtain_verts_removed"]=len(kill)
# the torso's faces get their own (thin, translucent) material
thin_faces=[f for f in bm.faces if all(v[L]==torso_isl for v in f.verts)]
bm.to_mesh(M); bm.free(); M.update()
skin=M.materials[0]; thin=skin.copy(); thin.name="skin_thin"; M.materials.append(thin)
bm=bmesh.new(); bm.from_mesh(M); L=bm.verts.layers.int.get("isl");
for f in bm.faces:
    if all(v[L]==torso_isl for v in f.verts): f.material_index=1
bm.to_mesh(M); bm.free()
bpy.context.view_layer.objects.active=body; body.select_set(True)
m=body.modifiers.new("Subdiv",'SUBSURF'); m.levels=1; m.render_levels=1; m.quality=3; m.uv_smooth='NONE'; m.boundary_smooth='PRESERVE_CORNERS'
bpy.ops.object.modifier_move_to_index(modifier="Subdiv",index=0); bpy.ops.object.modifier_apply(modifier="Subdiv")
try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38))
except Exception: bpy.ops.object.shade_smooth()
rep["verts_after_subdiv"]=len(M.vertices)
# ---------------------------------------------------------------- materials: sharper atlas, bump, skin sheen; thin torso translucent
cimg=bpy.data.images.load(COL); cimg.name="hob2_col"; nimg=bpy.data.images.load(NRM); nimg.name="hob2_nrm"; nimg.colorspace_settings.name='Non-Color'
def setup(mat,alpha=1.0,rough=0.55,coat=0.0):
    mat.use_nodes=True; nt=mat.node_tree; bs=next(x for x in nt.nodes if x.type=='BSDF_PRINCIPLED')
    tex=next((x for x in nt.nodes if x.type=='TEX_IMAGE'),None) or nt.nodes.new('ShaderNodeTexImage'); tex.image=cimg
    nt.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    nm=nt.nodes.new('ShaderNodeTexImage'); nm.image=nimg; nmap=nt.nodes.new('ShaderNodeNormalMap'); nmap.inputs['Strength'].default_value=0.8
    nt.links.new(nm.outputs['Color'],nmap.inputs['Color']); nt.links.new(nmap.outputs['Normal'],bs.inputs['Normal'])
    bs.inputs['Roughness'].default_value=rough
    if coat: bs.inputs['Coat Weight'].default_value=coat; bs.inputs['Coat Roughness'].default_value=0.15
    if alpha<1:
        bs.inputs['Alpha'].default_value=alpha; mat.blend_method='BLEND' if hasattr(mat,'blend_method') else None
        try: mat.surface_render_method='BLENDED'
        except Exception: pass
    return mat
setup(skin,1.0,0.5,0.15); setup(thin,0.62,0.35,0.35)
# ---------------------------------------------------------------- 3. the insides: coils and organs under the thin torso
def weights_spine(p):
    ys=[('root',SP[0].y),('spine1',SP[1].y),('spine2',SP[2].y),('spine3',SP[3].y)]
    for (a,ya),(b,yb) in zip(ys,ys[1:]):
        if p.y<=yb: u=max(0,min(1,(p.y-ya)/(yb-ya))); return {a:1-u,b:u}
    return {'spine3':1.0}
NSP=[J['root'],J['spine1']+D['spine1'],J['spine2']+D['spine2'],J['spine3']+D['spine3'],J['spine3']+D['spine3']+Vector((0,1.2,-0.1))]
def naxis(y):
    for a,b in zip(NSP,NSP[1:]):
        if y<=b.y or b is NSP[-1]: u=max(0,min(1,(y-a.y)/(b.y-a.y))); return a.lerp(b,u)
ins=bpy.data.meshes.new("insides"); bm=bmesh.new(); uvL=bm.loops.layers.uv.new("UVMap")
def tube(path,r0,r1,sides=6):
    rings=[]
    for i,p in enumerate(path):
        t=i/(len(path)-1); r=r0+(r1-r0)*t; tg=(path[min(i+1,len(path)-1)]-path[max(i-1,0)]).normalized()
        a=tg.orthogonal().normalized(); b=tg.cross(a)
        rings.append([bm.verts.new(p+(a*math.cos(k*2*math.pi/sides)+b*math.sin(k*2*math.pi/sides))*r*(1+0.25*math.sin(i*1.7+k))) for k in range(sides)])
    for i in range(len(rings)-1):
        for k in range(sides):
            f=bm.faces.new((rings[i][k],rings[i][(k+1)%sides],rings[i+1][(k+1)%sides],rings[i+1][k]))
            for l,(uu,vv) in zip(f.loops,((k/sides,i/len(rings)),((k+1)/sides,i/len(rings)),((k+1)/sides,(i+1)/len(rings)),(k/sides,(i+1)/len(rings)))):
                l[uvL].uv=(0.625+uu*0.25,0.25+vv*0.25)
for c in range(3):   # three coiled guts winding back along the body
    path=[]; ph=random.random()*6
    for i in range(60):
        y=1.8+i*0.045; ax=naxis(y); path.append(ax+Vector((math.sin(i*0.55+ph)*0.16,0,math.cos(i*0.55+ph)*0.12-0.08+c*0.04)))
    tube(path,0.07,0.06)
for (y,r) in ((2.5,0.17),(3.3,0.2),(4.1,0.16)):   # swollen organ sacs
    ax=naxis(y); ret=bmesh.ops.create_uvsphere(bm,u_segments=10,v_segments=7,radius=r)
    for v in ret['verts']: v.co=ax+Vector((random.uniform(-0.12,0.12),0,-0.08))+Vector((v.co.x*1.1,v.co.y*1.5,v.co.z*0.85))
bm.to_mesh(ins); bm.free()
for p in ins.polygons:
    for li in p.loop_indices:
        uv=ins.uv_layers[0].data[li].uv
        if uv[0]==0 and uv[1]==0: ins.uv_layers[0].data[li].uv=(0.75,0.375)
io=bpy.data.objects.new("insides",ins); bpy.context.scene.collection.objects.link(io)
im=bpy.data.materials.new("insides"); im.use_nodes=True; bs=im.node_tree.nodes["Principled BSDF"]; t=im.node_tree.nodes.new('ShaderNodeTexImage'); t.image=cimg; im.node_tree.links.new(t.outputs['Color'],bs.inputs['Base Color'])
bs.inputs['Roughness'].default_value=0.22; bs.inputs['Coat Weight'].default_value=0.6; ins.materials.append(im)
for b in ('root','spine1','spine2','spine3'): io.vertex_groups.new(name=b)
for v in ins.vertices:
    for b,x in weights_spine(v.co).items(): io.vertex_groups[b].add([v.index],x,'REPLACE')
# squirm: two shape keys the preview cycles (the game animates the same motion in code)
io.shape_key_add(name="Basis")
for kname,ph in (("squirm_a",0),("squirm_b",1.7)):
    sk=io.shape_key_add(name=kname)
    for i,v in enumerate(ins.vertices):
        c=naxis(v.co.y); r=(v.co-c); sk.data[i].co=v.co+r*0.35*math.sin(v.co.y*5.5+ph)+Vector((0.04*math.sin(v.co.y*9+ph),0,0.04*math.cos(v.co.y*7+ph)))
rep["insides_verts"]=len(ins.vertices)
# ---------------------------------------------------------------- 4. greasy, stringy hair
head_bvh=bvhtree.BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
hd=bpy.data.meshes.new("hair"); bm=bmesh.new(); uvL=bm.loops.layers.uv.new("UVMap")
CLEAR=0.04
def push_out(p):
    hit=head_bvh.find_nearest(p)
    if hit and hit[0] is not None:
        q,nn,_,dist=hit
        if (p-q).dot(nn)<CLEAR: return q+nn*CLEAR
    return p
def drape(root,nrm,length,segs=18,wob=0.0):
    seg=length/segs; p=root+nrm*CLEAR; d=(nrm*0.6+Vector((0,0,-1))).normalized(); pts=[p.copy()]
    for i in range(segs):
        d=(d*0.55+Vector((0,0,-1))*0.45+Vector((math.sin(i*1.3+wob)*0.08,math.cos(i*0.9+wob)*0.05,0))).normalized()
        q=push_out(p+d*seg)
        if q.z<0.55:   # hair ends above the floor: it's fixed to the head, so floor-length strands would swing out as rods
            q.z=max(q.z,0.55); pts.append(q.copy()); pts+= [q.copy()]*(segs-i-1); return pts
        d=(q-p).normalized() if (q-p).length>1e-6 else d; p=q; pts.append(p.copy())
    return pts
def ribbon(pts,r0,u0):
    segs=len(pts)-1; sides=4; rings=[]
    for i,p in enumerate(pts):
        t=i/segs; r=r0*(1-0.7*t); tg=(pts[min(i+1,segs)]-pts[max(i-1,0)]); tg=tg.normalized() if tg.length>1e-6 else Vector((0,0,-1))
        a=tg.orthogonal().normalized(); b=tg.cross(a)
        rings.append([bm.verts.new(p+(a*math.cos(k*math.pi/2)*1.5+b*math.sin(k*math.pi/2)*0.6)*r) for k in range(sides)])
    for i in range(segs):
        for k in range(sides):
            f=bm.faces.new((rings[i][k],rings[i][(k+1)%sides],rings[i+1][(k+1)%sides],rings[i+1][k]))
            for l,(uu,vv) in zip(f.loops,((0,i/segs),(1,i/segs),(1,(i+1)/segs),(0,(i+1)/segs))): l[uvL].uv=(u0+uu*0.003,1-vv*0.25)
# roots: on the scalp cap. The face stays mostly clear: front roots only over the left eye and a few over the right
capv=[(body.matrix_world@v.co, v.normal.copy()) for i,v in enumerate(M.vertices) if i<len(isl) and isl[i]==cap and v.normal.z>-0.2] if cap is not None else []
random.shuffle(capv); nstr=0; clumps=[]
for p,nn in capv:
    if len(clumps)>=85: break
    front=p.y<-0.45
    if front and not (-0.62<p.x<-0.12 or (0.22<p.x<0.42 and random.random()<0.4)): continue
    if any((p-c[0]).length<0.16 for c in clumps): continue
    clumps.append((p,nn))
for p,nn in clumps:
    L=random.uniform(1.5,2.5); wob=random.random()*6; centre=drape(p,nn,L,18,wob)
    for s_ in range(random.randint(3,5)):
        off=Vector((random.uniform(-0.06,0.06),random.uniform(-0.06,0.06),random.uniform(-0.03,0.03)))
        own=drape(push_out(p+off),nn,L*random.uniform(0.85,1.05),18,wob+random.uniform(-0.6,0.6))
        pts=[push_out(a.lerp(b,min(0.85,(i/18)*1.2))) for i,(a,b) in enumerate(zip(own,centre))]
        ribbon(pts,random.uniform(0.014,0.024),0.5625+random.random()*0.12); nstr+=1
bm.to_mesh(hd); bm.free()
# hair is flagged in the second UV channel (v=5), so a game loading one material can still tell it apart (the torso is flagged in u)
names=[l.name for l in M.uv_layers]; hd.uv_layers[0].name=names[0]
if len(names)>1:
    l2=hd.uv_layers.new(name=names[1])
    for d in l2.data: d.uv=(0.0,5.0)
rep['uv_layers']=names
ho=bpy.data.objects.new("hair",hd); bpy.context.scene.collection.objects.link(ho)
hm=bpy.data.materials.new("hair_wet"); hm.use_nodes=True; bs=hm.node_tree.nodes["Principled BSDF"]; t=hm.node_tree.nodes.new('ShaderNodeTexImage'); t.image=cimg
mix=hm.node_tree.nodes.new('ShaderNodeMix'); mix.data_type='RGBA'; mix.blend_type='MULTIPLY'; mix.inputs['Factor'].default_value=1.0; mix.inputs[7].default_value=(0.22,0.2,0.18,1)
hm.node_tree.links.new(t.outputs['Color'],mix.inputs[6]); hm.node_tree.links.new(mix.outputs[2],bs.inputs['Base Color']); bs.inputs['Roughness'].default_value=0.16; bs.inputs['Coat Weight'].default_value=0.8; bs.inputs['Coat Roughness'].default_value=0.08
hd.materials.append(hm)
ho.vertex_groups.new(name='head'); ho.vertex_groups['head'].add(list(range(len(hd.vertices))),1.0,'REPLACE')
bpy.context.view_layer.objects.active=ho; ho.select_set(True); bpy.ops.object.shade_smooth()
rep["hair_strands"]=nstr; rep["hair_verts"]=len(hd.vertices)
# ---------------------------------------------------------------- join everything into the one skinned mesh (the game loads one), save, export
for o in (io,ho):
    o.parent=arm; md=o.modifiers.new("Armature",'ARMATURE'); md.object=arm
blend_keys=io.data.shape_keys
bpy.ops.object.select_all(action='DESELECT')
# keep the insides' shape keys: join hair into the body, keep insides as its own skinned mesh (shape keys can't merge across meshes)
ho.select_set(True); body.select_set(True); bpy.context.view_layer.objects.active=body; bpy.ops.object.join()
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
# for the game: one material on the body (one skinned mesh); the torso and hair are split out at load time by their flags
for p in body.data.polygons: p.material_index=0
while len(body.data.materials)>1: body.data.materials.pop(index=len(body.data.materials)-1)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_skins=True, export_morph=True, export_animations=False, export_yup=True, export_image_format='AUTO')
print("REPORT", rep)
