# python3 turntable.py -- <in.glb> <outdir> <mode: turn|guts> [W H spp frames]
import bpy, sys, math, os
from mathutils import Vector
A=sys.argv[sys.argv.index('--')+1:]; inp,outd,mode=A[0],A[1],A[2]; W=int(A[3]); H=int(A[4]); SPP=int(A[5]); NF=int(A[6])
bpy.ops.wm.read_factory_settings(use_empty=True); sc=bpy.context.scene; sc.render.fps=30; bpy.ops.import_scene.gltf(filepath=inp, bone_heuristic='BLENDER')
bpy.ops.mesh.primitive_plane_add(size=80,location=(0,3,0)); fl=bpy.context.object; m=bpy.data.materials.new("fl"); m.use_nodes=True; b=m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value=(0.06,0.055,0.05,1); b.inputs["Roughness"].default_value=0.8; fl.data.materials.append(m)
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[0].default_value=(0.015,0.016,0.02,1)
def light(loc,e,size,col=(1,1,1)):
    L=bpy.data.lights.new("L",'AREA'); L.energy=e; L.size=size; L.color=col; o=bpy.data.objects.new("L",L); o.location=loc; sc.collection.objects.link(o); o.rotation_euler=(Vector((0,2.5,1.2))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
light((4,-6,6),2600,4,(1,0.9,0.78)); light((-6,-2,3),900,5,(0.7,0.8,1)); light((0,9,6),1800,4)
if mode=="guts": light((2.5,3.2,0.4),500,1.5,(1,0.55,0.45))   # a low warm light under the ribs, so the thin skin glows
cam=bpy.data.cameras.new("c"); co=bpy.data.objects.new("c",cam); sc.collection.objects.link(co); sc.camera=co
ins=next((o for o in bpy.data.objects if o.type=='MESH' and o.data.shape_keys and len(o.data.shape_keys.key_blocks)>1),None)
sc.frame_start=0; sc.frame_end=NF-1
for f in range(NF):
    t=f/NF
    if mode=="turn": a=-math.pi/2+t*2*math.pi; ctr=Vector((0,3.2,1.0)); R=12.5; co.location=ctr+Vector((math.cos(a)*R,math.sin(a)*R,3.4)); cam.lens=30
    else: a=-0.35+0.5*math.sin(t*2*math.pi); ctr=Vector((0,3.4,1.5)); R=4.2; co.location=ctr+Vector((math.cos(a)*R,math.sin(a)*R*0.4,0.5)); cam.lens=32
    co.rotation_euler=(ctr-co.location).to_track_quat('-Z','Y').to_euler(); co.keyframe_insert("location",frame=f); co.keyframe_insert("rotation_euler",frame=f)
    if ins:
        kb=ins.data.shape_keys.key_blocks; ph=t*2*math.pi*(3 if mode=="guts" else 2)
        kb[1].value=0.5+0.5*math.sin(ph); kb[2].value=0.5+0.5*math.sin(ph*1.37+1.2)
        kb[1].keyframe_insert("value",frame=f); kb[2].keyframe_insert("value",frame=f)
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=SPP; sc.cycles.use_denoising=True; sc.render.resolution_x=W; sc.render.resolution_y=H
os.makedirs(outd,exist_ok=True); sc.render.filepath=os.path.join(outd,"f_"); bpy.ops.render.render(animation=True); print("DONE",mode)
