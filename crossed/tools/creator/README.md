# Character Creator

Link: https://claude.ai/artifact/KYV7huwhLpmzP3A186gA7t

Builds and dresses characters on the game's own MakeHuman body, so what it shows is what the game builds.

## Tabs
- **START:** the whole cast as starting points (Norah, Kenneth, Adaline, the Stranger, Rachel, Marcus, Denise, the parents and kids, Louis, the ACROSS, the photo versions), a blank average person, Randomize, name / game id / height, and characters saved in this browser.
- **BODY:**
  - 12 body types: Average, Slim, Athletic, Muscular, Heavyset, Stocky, Curvy, Lanky, Frail elder, Child, Teen, Gaunt.
  - Build: female ↔ male, age, muscle, weight, proportions; heritage mix (European / African / Asian).
  - 33 sculpting sliders: torso (shoulders, V-shape, length, chest, muscle, bust, belly, tone), hips and neck, arms, legs, hands and feet.
- **FACE:**
  - 8 face presets (Soft round, Long narrow, Square jaw, Sharp, Heart, Weathered, Wide-eyed, Heavy brow) and every cast member's face.
  - Head shape (7 shapes with a strength) and 53 sculpting sliders: head, brows and eyes, nose, mouth, cheeks / jaw / chin, ears.
  - Resting expression: the game's 8 moods (determined, worried, scared, warm, happy, stern, menace, feral), mixable.
  - Painted features: brow thickness, lash line, lip fullness and width, hollow eyes.
- **HAIR:** 16 presets (bald, horseshoe, buzz, short, fringe, kid's mop, curly, thinning, two bobs, shoulder, long, long with bangs, waist length, ponytail, pigtails), style details (hairline, length, tail length, bangs, hair tie), hair / brow / beard colours, stubble and beard.
- **SKIN:** skin tones, blush, pallor, freckles, eye colours, lip colours.
- **CLOTHES:**
  - 12 outfits (jeans & tee, flannel, winter puffer, cardigan & slacks, office, long coat, sundress, church clothes, pyjamas, work overalls, scrubs, ragged) plus every cast outfit.
  - Slots: top, trousers, jacket / coat, skirt / dress / coat tails, shoes, socks / tights. Each has types, fabric (cotton, denim, plaid, stripes, knit, puffer), colours and fit sliders (sleeves, hem, neckline, buttons, chest print, leg length, waist, belt, open front, collar, thickness, shoe height).
  - Accessories: glasses, baseball cap, party hat.
- **SEND:** notes for Claude, "Send to Claude" (stored in the artifact's database, collection `characters`), and the same character as copyable JSON.

The view has full body / upper / face / back cameras, a turntable and a PS1 look (low resolution plus vertex snapping). It also has undo / redo.

## How it's built
- `tools/build_creator_data.py` packs the MakeHuman data into `tools/creator/creator_data.wasm` (7.4 MB of binary data; the `.wasm` name is only so artifacts serve it) and `creator_meta.json`:
  - the mesh
  - per-vertex regions for the clothing masks
  - the 240 macro targets compressed to 56 PCA components (max error 1.5 cm)
  - the 270 targets behind the sliders and expression units
  - the cast as presets
- The page's shaders port the skin, face, scalp and clothing painters from `hb_paint.py`, so patterns and garment edges match the game.

## In the game
- Read what was sent with ArtifactData (`list`, collection `characters`), save each document's JSON, then run `python3 tools/import_character.py <file.json>`.
- It keeps characters in `data/characters/custom.json` and builds them with `tools/build_humans.py` like the cast (`assets/characters/<id>.glb`, all animations, in the manifest).
- Then run Godot `--import`. A built character still has to be placed in a scene by hand.
- Not in the creator: the cast's special painters (Louis's veins and burns, brands, dirt) and body mods (the Brute arm, the ribs). Loading Louis keeps his shape but not those.
