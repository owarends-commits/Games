# Story pass: models, dialogue and the prologue beats

> Parts of this are superseded by `ENDING_PASS_NOTES.md`: the cameras, the dialogue layout (every line now goes in the box with a portrait), "Stranger" naming, the hallway chase and the full ending.

This pass adds characters, a dialogue system and the prologue story, scripted from the opening shot to the BMW leaving the lot. The town drive (Phase 6) is the next milestone.

## How to play it

- **Run (F5):** opens `scenes/prologue/prologue.tscn`, the main scene.
- **Skip ahead:** add a user arg to the run command:
  - `-- start=party` jumps to the party with Kenneth inside
  - `-- start=breach` starts the window breach
  - `-- start=lot` starts outside, after the escape
  - In the editor, set these under Project → Project Settings → Run → "Main Run Args".
- **F5 in game** restarts the prologue.
- **Controls:**
  - E / Space: interact and advance dialogue
  - F1: switch control scheme
  - F3: debug readout

## Characters (`assets/characters/`)

The models are built by `tools/build_characters.py` as rigid-skinned glTF:
- every body segment is bound 100% to one bone, the way late-90s survival-horror characters were made
- about 450 triangles each, 704 for the ACROSS
- one 128×128 texture atlas each
- a 17-bone humanoid skeleton

Open any `.glb` in Blender to refine it; Godot re-imports on save. Re-running the script overwrites the files, so once someone starts editing models by hand, stop using the script for that character.

| Model | Who | Source of the look |
|---|---|---|
| `kenneth` | Kenneth Martin | Narrative sheet: black puffer, slim jeans, brown belt, short brown hair, blue eyes, stubble |
| `adaline` | Adaline | Yellow party dress, red shoes, long brown hair (debrief + asset manifest) |
| `stranger` | The Stranger | Bald, plump, white/green knit sweater, khakis, brown belt; small burned cross on the left thigh (asset manifest) |
| `rachel` | Rachel, Amelia's mom | Blonde ponytail, pink cardigan, jeans (manifest) |
| `marcus`, `denise` | Supporting parents | Manifest descriptions |
| `dad2`, `mom2`, `dad3` | Background parents | dad2 from the manifest; mom2 and dad3 are **new filler designs** |
| `amelia`, `kid_boy`, `kid_girl` | Kids | Manifest descriptions |
| `across` | The base ACROSS | Debrief: gaunt, ribs and vertebrae, white eyes (full-bright), patchy hair, smoking hip brand |

**Human animations:**
- `idle`, `walk`, `run`, `walk_hand`, `idle_hand`
- `talk`, `listen`, `hold_cup`, `scared`, `lean_look`, `cower`, `panic_run`
- `fall`, `down`, `cry`, `play`, `wave`, `hug`, `beg`, `shout`

**ACROSS animations:**
- `land`, `folded`, `awaken` (a 0.18 s snap with no wind-up)
- `quad_idle`, `crawl`, `lunge`, `attack`, `swipe`, `shamble`, `still`

## Dialogue (`dialogue/prologue.json`, `scripts/dialogue/`)

- **Format:** conversations are lists of lines. Each line has a speaker (`who`), a mood that picks the portrait, and `text`.
- **Portraits:** your 12-frame portraits drive the box. The `<mood>` frame shows while idle, and `<mood>_talk` alternates with it as mouth flaps while the text types out.
- **Barks:** one-line captions for crowd voices and Kenneth's shouts. They don't stop play.
- **Optional keys:**
  - `auto` advances the line by itself
  - `cut` interrupts a line partway through; Marcus is cut off by the breaking window this way
- **Speakers without portraits:** background parents and kids show a name only.
- **Display:** the HUD draws at 2× over the 320×240 game view, so portraits land 1:1 on screen pixels and text stays chunky.
- **Font:** DejaVu (free license, included) as a stand-in until a real pixel font is chosen.

**All dialogue wording is a draft.** The beats follow the narrative sheet, but every line is a proposal to edit.

## The prologue, beat by beat (`scripts/cutscenes/`)

1. **Opening:** title, then a crane shot from high over Kennedy down to the BMW in the rain. Caption: "PROLOGUE — Kennedy, Washington".
2. **Arrival:** the car conversation plays over the BMW. Kenneth and Adaline get out, and she takes his hand. Kenneth walks at a walk while she holds it, and she follows at his left.
3. **Hallway:** a short exchange when they enter the dark hallway.
4. **Party entry:** Rachel greets them, Adaline runs off to the mats, and the objective becomes "Get some punch."
5. **Party:**
   - Kenneth can talk to Rachel, Denise, the Stranger, Adaline and the kids.
   - Getting punch gives him a cup.
   - Talking to Marcus after the punch starts the small talk that the window interrupts.
6. **The breach** (`breach_sequence.gd`) runs the debrief's state machine:
   - **WINDOW_IMPACT:** Cam4, crash and thump, a 3-frame white flash, camera shake, glass burst, a chair knocked over.
   - **CREATURE_LANDED:** the body lies folded and completely still, and everyone freezes and turns. Cuts to Cam3, with murmurs.
   - **CROWD_INSPECTION:** Cam5. Three adults edge in, Rachel pulls the kids back, the brand starts smoking, and the "Is that a person?" barks play.
   - **NEAR_SILENCE:** about 5.5 s of near-nothing. A shard rolls to a stop and a balloon sways.
   - **ACROSS_AWAKENS:** a 0.18 s snap to all fours with a shriek, no camera cut and no musical sting.
   - **FIRST_LUNGE:** it takes down the nearest adult, with a wide cut to Cam3 on the hit.
   - **PANIC_AND_ESCAPE:** control comes back to Kenneth.
     - The crowd bottlenecks at the doorway.
     - The ACROSS chases and knocks down a father, then a mother and child.
     - It swipes Kenneth aside if he gets close. There's no fail state; he's shoved and loses a moment.
     - Kenneth shouts for Adaline.
7. **Escape to the lot:** Cam7 establishes the aftermath: fires, a crashed car, debris, distant screams, and ACROSS converging from the street and the alley.
8. **Reunion:** Adaline and the Stranger wait by the BMW. Kenneth and Adaline hug, the Stranger begs, and Kenneth agrees.
9. **Drive-off:** car doors, headlights, the engine. The BMW pulls forward through the empty stall, jumps the curb through a gap in the hedge, and takes the street east. Then fade out and the end card.

## Decisions I made (change freely)

**Panic and the escape**
- **The Stranger takes Adaline out of the room** at the start of the panic. It's easy to miss from the overview camera, and Adaline later says "The man held my hand. He found me." This explains how she gets to the car without deciding who he is. Cut it if it says too much.
- **No fail state in the panic.** The ACROSS shoves Kenneth aside instead of killing him, in line with the debrief's "readable, don't take control away for long".
- **Victims:**
  - Dad in glasses: the first lunge, attacked on the floor.
  - Dad in a hoodie: knocked down.
  - A mother and her daughter: knocked unconscious.
  - The violence is suggested, not shown.

**Parking lot and the drive**
- A **gap in the lot hedge** at x −8.6 to −4.4, so "jumps the curb" is a straight line from the BMW's empty stall.
- **Town backdrop:** low building blocks south of the street and on either side of the lot, with lit windows, so the lot isn't floating in the dark. Placeholder until `city_drive.png` is turned into real streets.

**Opening and presentation**
- **The America → Washington map zoom is not built yet.** No map asset is available here, so the opening uses a crane shot over the town instead.
- **Sound is all synthesized placeholder** (`tools/make_audio.py`): rain, babble, glass, the shriek, screams, engine. It's enough to time the beats, especially the near-silence. Swap any `.wav` for a real recording with the same name.
