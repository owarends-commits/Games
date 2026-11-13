# BCROSS: Brutes

Full design history: `bcross-brute.md` in the project notes. Lineup: `brutes_lineup.png`.

| File | What it is | Rig |
|---|---|---|
| `louis_brute.glb` | Louis turned: one huge swollen left arm, 2.64 m | 16 bones, walk/run/hit/death |
| `brute_onearm_f01.glb` | A woman in the same style as Louis, 2.47 m (`brute_onearm_f01_sheet.png`) | same |
| `brute_clubfist_m01.glb` | Natural-size man, both fists clenched and swollen into rounded hammer heads on thick sinew wrists; the right arm inflated with rings of rounded growths (`brute_clubfist_m01_sheet.png`) | same |
| `brute_twoarm_m01.glb` | **Two-armed Brute.** A man hung off the floor between two huge stump arms of split-open viscera that he walks on; 1-3 small useless arms wriggle out of each. About 2.9 m tall, 2.3 m wide. | none (static, posed) |
| `brute_twoarm_m02_legless.glb` | Same, both legs gone (ragged thigh stumps) | none |
| `brute_twoarm_m03_split.glb` | **Later game.** No head; the whole body split down the front and swung open on the spine like jaws, rib teeth along both edges, organs inside (`brute_twoarm_m03_split_sheet.png`) | none |
| `brute_twoarm_m04_armored.glb` | **ENDGAME ONLY.** The Runner's bone helmet and breastplate; a rounded shoulder plate with small blunt knobs; a bare middle of the arm; one long splinted bone bracer to the wrist (`brute_twoarm_m04_armored_sheet.png`) | none |

## Behaviour (author, 2026-11-13)
- **Club-fist (proposal):** slow, heavy hammer blows with the right fist, quicker jabs with the left. The wrist is a weak point; shooting it through drops the fist.
- **Two-armed Brutes:**
  - Movement: slow, heavy swings one stump at a time; sudden lunges (both arms planted, body hurled forward); possibly a grab.
  - Attacks: a wide sweeping swing; charge and pin (break free or take heavy damage).
  - Weak point: burst the viscera lumps on an arm to collapse it, which drops him. Each burst triggers the growth-burst flash and knockback.
  - Split one: grabs up close for the eat execution (mash to break free); shooting into the open body does heavy damage.
  - Armoured one: plates, bracer and breastplate are bulletproof and can be shot off one at a time; the bare arm, the splint gaps, the stump feet and the man can be hurt. It rams walls to charge.
- Still open: whether the dangling man is also a weak point once an arm collapses.

## Not done yet
Rigs and animations for the two-armed Brutes; the club-fist's fists don't swing on their wrists; Brute heavy walk and haymaker.
