# Blender trial: the two-armed Brute

The approved walk and sweep, moved into Blender and played back as ordinary animation clips.

1. `rec_brute.js` (Playwright, in the playground's source folder): steps the playground's two-armed Brute through its walk and its sweep,
   records every bone each frame, picks one clean looping stride, takes the forward travel out of the walk, and exports the rig with
   both clips as a GLB (`brute_rec.glb`, with `brute_rec.json`: walk speed, sweep hit time).
2. `brute_blender.py` (Blender's Python module, `pip install bpy`; or `blender --background --python brute_blender.py -- in.glb out.glb out.blend`):
   imports it, smooths the skin weights inside each piece (soft bends at the stump joints), blends every separate piece's skin near
   the body into the body's skinning (little arms, lumps, the hanging man stay on the surface they grow from), keeps at most four
   bones a vertex, marks the walk as a loop, saves `brute_trial.blend` and exports `brute_blender.glb`.
3. The playground plays `brute_blender.glb` with three.js's animation mixer ("Two-armed Brute · Blender trial" in Simulations, or
   "Spawn Blender Brute (trial)" in the pause menu): it walks to Norah at the recorded speed, crossfades into the sweep, hits on the
   recorded frame, can be shot and killed.

Open `brute_trial.blend` in Blender to edit the clips (Action Editor) or the weights (Weight Paint) and export glTF again.
