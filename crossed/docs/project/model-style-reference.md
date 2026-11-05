# Model style reference (user, 2026-11-04)

The user shared a reference image of a zombie in a torn grey jacket, dark tee and jeans: a late PS1 / early PS2 survival-horror model (Resident Evil / Silent Hill era). **This is the target look for character models, the ACROSS above all.**

## What defines the look
- **The texture carries the detail, not the mesh.** Low-poly body (roughly 800–1,500 triangles); folds, seams, tears, grime and the face are painted in.
- **Photo-like, hand-painted textures** with baked lighting: shadows under the collar, in folds, around the eyes and mouth.
- **Clothes are simple shells** that hang stiffly: an open jacket as flat panels, a hem that sits off the body, a rigid collar.
- **Grime everywhere:** dirt, blood streaks and stains layered on the cloth and skin, with worn, bleached edges.
- **Muted, desaturated palette:** greys, browns, faded denim; skin a sickly, blotchy tone.
- **The face is mostly texture:** sunken painted eye sockets, a dark mouth, sharp painted cheekbones on a simple head.
- **Slightly soft texture sampling** at a low resolution, so it reads as a rough painting rather than crisp pixels.

## What it means for the current models
- The MakeHuman bodies (30–40k tris, procedural painters) are far more detailed in geometry and cleaner in texture than this. Moving to this style means:
  - decimating to a low-poly mesh while keeping the skeleton and animations
  - baking light, ambient occlusion and grime into larger, dirtier textures
  - adding torn, stained variants of the clothing painters
- **Keep the ACROSS lore:** pale, starved skin over bone, full-bright white eyes, the smoking hip brand. Take the *rendering style* (painted, grimy, low-poly, clothing torn and bloodied) from the reference, not the rotting-zombie flesh, unless the user says otherwise.

## Hero characters: RE4 / Silent Hill 3 look (user, 2026-11-04)

For Norah (and likely the other leads), the user shared RE4 cutscene stills (Leon, Ashley) and a Silent Hill 3 still (Heather) and asked for "this style of model". What defines it, as distinct from the zombie reference:
- **Mid-poly PS2 hero model** (roughly 5–10k tris), smooth-shaded, with a detailed head; still far below MakeHuman's 30–40k.
- **Hair as layered alpha-card clumps:** chunky, painted strands with soft ragged edges, bangs falling across the face.
- **Photo-sourced face texture:** realistic skin with baked soft shadow under the brows, nose and jaw; heavy-lidded, slightly tired eyes; subtle lip colour.
- **Clothes:** knit and fabric textures with baked folds; stiff collars (turtleneck, vest collar); straps, belts and buckles as modelled detail.
- **Lighting and grade:** low-key, warm-green or sodium cast, strong rim or bloom light, desaturated; soft focus.
- Should still sit in the game's 320×240 PS1 pipeline, so detail must read at low resolution; texture over geometry.

Status: logged. First attempt on Norah requested 2026-11-04; blocked because that session had no copy of the game project (the build tools and MakeHuman data weren't in the workspace).
