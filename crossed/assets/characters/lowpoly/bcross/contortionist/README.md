# BCROSS: the Contortionist (models and design notes, 2026-11-13)

Low-poly, photo-textured models in the locked character style. Each GLB is rigged (16 bones)
and carries its own animations: `spider_idle`, `walk`, `run`, `hit`, `death`.
They are **not wired into the game yet** and are not in `manifest.json`; the bones are not the
game's 17-bone skeleton.

## Design direction
- Weakest BCROSS tier, alongside the Tactician. A new way to fight, not a strong enemy.
- A stealthy, fast predator, mostly found in tight spaces and buildings.
- Clings to ceilings and walls and crosses them very fast.
- Stalks and surprises the player, then hunts them down or backs off, based on its health
  and surroundings. The lower its health, the more likely it repositions and waits to
  ambush again.
- **Body:** compact and spider-like. A small, tight torso held low, knees and elbows raised
  above the back, about the size of a large dog. The head is tucked low between the
  shoulders, looking up from under the brow.
- **Hands and feet:** not long fingers. Thick, strengthened fingers and toes whose end bones
  have been pushed out by cartilage and stick out of the tips as claw-length spikes (3-5 cm).
- **Extra features:** a ridge of bone tips up the spine, bone spurs through the elbows and
  knees, calloused knees, and plaster dust ground into the back (it lives in the walls).
- Bones are never grown, only pushed out of place.

## Models

| File | Kind | Size in the pose (tall x wide) |
|---|---|---|
| `contortionist_c02.glb` | Child-sized | 0.33 x 0.61 m |
| `contortionist_c01.glb` | Child-sized | 0.36 x 0.67 m |
| `contortionist_c03.glb` | Child-sized | 0.38 x 0.73 m |
| `contortionist_m01.glb` | Base | 0.46 x 1.03 m |
| `contortionist_l01.glb` | Large | 0.60 x 1.29 m |
| `contortionist_l02.glb` | Large | 0.68 x 1.35 m |
| `contortionist_m02_armored.glb` | Bone armour, **endgame only** | 0.55 x 1.07 m |
| `contortionist_m03_armored.glb` | Bone armour, **endgame only** | 0.59 x 1.17 m |

- **Child-sized:** for vents and crawl spaces. Their faces are hand-painted, not photos.
- **Large:** broad and heavy, with the longest spurs.
- **Bone armour:** no plate on the head; the whole upper torso plated front and back, with
  spikes down the back plate; bracers over most of each arm; spiked shoulder plates and
  knee pads.

## Bone armour is endgame only
In a later chapter a CCROSS starts making bone armour for the ACROSS and BCROSS on its team.
It fortifies them and makes them do more damage. **No bone-armoured enemy may appear in an
earlier chapter.** The armoured GLBs carry `{"bone_armor": true, "endgame_only": true}` as
glTF extras on the root node.

## Still to do
- A real climbing gait, floor-to-wall transitions, and its own death animation.
- Fingers that curl to grip.
- The cross brand is not placed on any of them yet.
- The adult face photos came without sources; confirm their licences before release.

## Preview images
- `contortionist_m01_sheet.png`: the base model, with ceiling and wall views.
- `contortionists_1.png`: the child-sized three and the base, front and back.
- `contortionists_armored.png`: the two armoured models.
- `contortionists_scale.png`: Norah beside the smallest, the base and the largest.
