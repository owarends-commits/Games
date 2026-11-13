# Low-poly character models (photo-textured style)

Every model built in the locked early-2000s photo-textured low-poly style, as of 2026-11-13.

- Each `.glb` is rigged with a shared 16-bone skeleton and carries its own animations
  (`walk`, `run`, `hit`, `death`, plus type-specific ones).
- **None of these are wired into the game yet.** They are not in `manifest.json`, and the
  bones are not the game's 17-bone skeleton.
- About 900-3,900 triangles each, one texture atlas per model (inside the GLB). The two-armed
  Brutes are heavier (about 8,800-13,800) and are **static and posed, with no rig yet**.

## What's here (83 models)

| Folder | Models | Notes |
|---|---|---|
| `cast/` | 5 | Kenneth, Norah, Louis (human), the Stranger, Rachel (`rachel_v2`, Amelia's mom) |
| `catalogue/` | 9 | Adult NPCs `cat01`-`cat09`, not yet given roles. `cat08` shares Louis's face; don't cast it near him. |
| `kids/` | 10 | All ten catalogue kids: three with hand-painted faces, seven from photos (added 2026-11-13; the author confirmed the licences) |
| `across/men/` | 13 | `across_01` and `across_v01`-`v12` |
| `across/women/` | 13 | The women's twins of the same 13 |
| `across/imposing/` | 4 | Wider bony shoulders, longer legs, big hands |
| `across/uncanny/` | 5 | Look test: ACROSS that keep the photo's own eyes, grin and lips (`keep_face`). See the README there. |
| `bcross/brute/` | 7 | Louis, a one-armed woman, the club-fist, and four two-armed Brutes (the strongest). See the README there. |
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
- **Two-armed Brute:** the strongest Brute. He walks on the two big arms; bursting the
  viscera lumps on an arm collapses it. The split one grabs for an eat execution (shooting
  into the open body does heavy damage). The armoured one's plates are bulletproof and can be
  shot off one at a time.
- **Growth burst:** destroying a lumpy growth (Brute arms, the Tactician's head) releases a
  flash that knocks back the BCROSS and any Cross near it.
- **BCROSS strength:** the Brute and Runner are strongest; the Reacher is weaker; the
  Tactician and Contortionist are weakest. The weaker ones bring new ways to fight.

## Left out on purpose
- **Models built from photos of children received on 2026-11-13** (`across_unc04`,
  `across_unc07`, `amelia`): held back by the author's choice until those photos are sorted.
- **Rejected experiments:** the smooth "calm" ACROSS and Brute, the first Louis trial, and
  the first long-limbed Contortionist.
- **Earlier party NPC builds** (`marcus`, `mom_green`, `dad_glasses`, `dad_hoodie`, the `npc_*`
  set, the first `rachel`): superseded by the catalogue and cast models above.

## Before release
- The author confirmed on 2026-11-13 that the face photos used are licensed and consensual.
  The photos behind `across_uncanny` and the Stranger and Rachel came in later the same day
  and were approved for this repository by the author.
- Norah's face comes from photos of a friend of the author, used with the author's say-so.
