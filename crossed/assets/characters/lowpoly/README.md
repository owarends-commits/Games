# Low-poly character models (photo-textured style)

Every model built in the locked early-2000s photo-textured low-poly style, as of 2026-11-13.

- Each `.glb` is rigged with a shared 16-bone skeleton and carries its own animations
  (`walk`, `run`, `hit`, `death`, plus type-specific ones).
- **None of these are wired into the game yet.** They are not in `manifest.json`, and the
  bones are not the game's 17-bone skeleton.
- About 900-3,900 triangles each, one texture atlas per model (inside the GLB).

## What's here (63 models)

| Folder | Models | Notes |
|---|---|---|
| `cast/` | 3 | Kenneth, Norah, Louis (human) |
| `catalogue/` | 9 | Adult NPCs `cat01`-`cat09`, not yet given roles. `cat08` shares Louis's face; don't cast it near him. |
| `kids/` | 3 | The three kids with hand-painted faces only (see "Left out") |
| `across/men/` | 13 | `across_01` and `across_v01`-`v12` |
| `across/women/` | 13 | The women's twins of the same 13 |
| `across/imposing/` | 4 | Wider bony shoulders, longer legs, big hands |
| `bcross/brute/` | 1 | Louis turned, with the lengthened big arm |
| `bcross/runner/` | 3 | Base male, woman, and one in bone armour |
| `bcross/reacher/` | 5 | Three neck Reachers, two arm Reachers |
| `bcross/tactician/` | 1 | Base male with the big vertical eye, plus `tactician_m01_atlas_eye_open.png` (swap this texture in when the eye opens) |
| `bcross/contortionist/` | 8 | See the README in that folder |

Lineup images sit next to the models they show.

## Rules that travel with these models
- **Bone armour is endgame only.** Any file ending `_armored` must not appear before the
  endgame chapters. Those GLBs carry `{"bone_armor": true, "endgame_only": true}` as glTF
  extras on the root node.
- **Bigger ACROSS take more shots.** Each ACROSS GLB carries `extra_hits` (0-2) in its root
  extras, to be added to its health.
- **Arm Reachers' arms can be shot off at three main joints.** Their GLBs carry
  `arm_main_joints` in the root extras, and each arm vertex has `TEXCOORD_1`
  (side, fraction along the arm).
- **A Reacher dies when its head is taken off**, and that should be a hard shot.
- **Tactician:** headshots do slightly less than normal; shots to the big eye do normal
  headshot damage.
- **BCROSS strength:** the Brute and Runner are strongest; the Reacher is weaker; the
  Tactician and Contortionist are weakest. The weaker ones bring new ways to fight.

## Left out on purpose
- **Seven kid models whose faces come from photos of real children.** The photos came
  without sources or licences, and this repository is public.
- **Rejected experiments:** the smooth "calm" ACROSS and Brute, the first Louis trial, and
  the first long-limbed Contortionist.

## Before release
- The adult face photos (catalogue, ACROSS, BCROSS) came without sources. Confirm each
  licence before the game ships.
- Norah's face comes from photos of a friend of the author, used with the author's say-so.
