# Hob rework, step 1 (Blender)

Builds the reworked Hob from the rigged preview Hob (`crossed/tools/hob_preview/m/bosses/hob/hob_rigged.json`). The original `hob.glb` is not edited. The design is in `crossed/docs/project/hob-boss.md`.

```
python3 face_uv.py                                   # the face's UV footprint -> face_uv.json
python3 face_fill.py hob_tex0.png face_uv.json hob_tex0_face.png   # skin over the photo background at the cheeks
python3 tex_sharpen.py hob_tex0_face.png out/hob2_col.png out/hob2_bump.png out/hob2_nrm.png
python3 hob_v2.py -- hob_rigged.gltf out/hob2_col.png out/hob2_nrm.png out/hob2.glb out/hob2.blend
python3 stills.py -- out/hob2.glb out/new          # front, 3/4 front, side, 3/4 back, face
python3 turntable.py -- out/hob2.glb tt turn 960 540 14 120
```

Copy `hob_rigged.json` to `hob_rigged.gltf` first; Blender's importer wants the `.gltf` extension. It needs `pip install bpy` (5.x) and numpy/Pillow.

What it does:
- **Sharper:**
  - The atlas goes from 1024 to 2048, with the paint sharpened.
  - Generated pores, fine veins and grime are added on the skin.
  - A normal map is made for the lighting.
  - Seams are welded, except the mouth tear, and the mesh gets one subdivision level.
- **Fetal body:**
  - Hunched, curled spine.
  - The torso is thinned round the spine, tapering back to full width at the hips; the ribs stand out.
  - Longer forearms, fingers and back legs. The hands stay on the floor, with the elbows raised a little.
- **Removed:** the shoulder blades (user direction), the toad bumps on the back legs, and the old hair curtains.
- **Translucent torso:** its skin has its own material (`skin_thin`, alpha 0.62). Under it are coiled guts and organ sacs (`insides`), weighted to the spine. Two shape keys (`squirm_a`, `squirm_b`) make them squirm.
- **Hair:** 356 strands in 85 clumps, draped over the scalp and face under gravity and piling on the floor. Near-black and glossy (`hair_wet`), heavy over the left eye.

The skeleton is unchanged: same joints and rest rotations, only joint positions moved. The game's Hob code still drives it.
