# python3 stills.py -- <in.glb> <outprefix> [W H spp]
import bpy, sys, math
from mathutils import Vector
A=sys.argv[sys.argv.index('--')+1:]; inp,pre=A[0],A[1]; W=int(A[2]) if len(A)>2 else 960; H=int(A[3]) if len(A)>3 else 540; SPP=int(A[4]) if len(A)>4 else 24
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.context.scene.render.fps=60; bpy.ops.import_scene.gltf(filepath=inp, bone_heuristic='BLENDER')
sc=bpy.context.scene
bpy.ops.mesh.primitive_plane_add(size=80,location=(0,3,0)); fl=bpy.context.object; m=bpy.data.materials.new("fl"); m.use_nodes=True; b=m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value=(0.06,0.055,0.05,1); b.inputs["Roughness"].default_value=0.8; fl.data.materials.append(m)
w=bpy.data.worlds.new("w"); sc.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[0].default_value=(0.015,0.016,0.02,1)
def light(loc,e,size,col=(1,1,1)):
    L=bpy.data.lights.new("L",'AREA'); L.energy=e; L.size=size; L.color=col; o=bpy.data.objects.new("L",L); o.location=loc; sc.collection.objects.link(o); o.rotation_euler=(Vector((0,2.5,1.2))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
light((4,-6,6),2600,4,(1,0.9,0.78)); light((-6,-2,3),900,5,(0.7,0.8,1)); light((0,9,6),1800,4)
cam=bpy.data.cameras.new("c"); co=bpy.data.objects.new("c",cam); sc.collection.objects.link(co); sc.camera=co
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=SPP; sc.cycles.use_denoising=True; sc.render.resolution_x=W; sc.render.resolution_y=H
VIEWS={"front":((0,-9.5,1.7),(0,0,1.3),35),"34front":((-6.5,-6.5,3.2),(0,1.6,1.1),35),"side":((11,3,2.2),(0,3.3,1.0),28),"34back":((6,11,4.5),(0,3.5,0.9),30),"face":((0.4,-4.6,1.9),(0,-0.6,1.6),40),"spine":((3.4,1.6,3.6),(0,3.6,1.6),32),"hips":((3.2,9.4,2.2),(0,6.2,0.9),35)}
only=A[5].split(",") if len(A)>5 else list(VIEWS)
for k in only:
    loc,look,lens=VIEWS[k]; co.location=loc; cam.lens=lens; co.rotation_euler=(Vector(look)-Vector(loc)).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=f"{pre}_{k}.png"; bpy.ops.render.render(write_still=True); print("STILL",k)
