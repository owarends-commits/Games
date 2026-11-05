# Character models: real human bodies (Nov 2, 2026)

This replaces the box-segment models. Where it differs from earlier notes, this file wins.

## How the people are built now

`tools/build_humans.py` builds every character on the MakeHuman base body, which is **CC0** (public domain, free for commercial use). The data is copied into `tools/mh_data/`, the source is github.com/makehumancommunity/makehuman, and the licence sits next to the data. Rerun `python3 tools/build_humans.py [ids]` after any change; the whole cast takes about 40 seconds.

(Note for this repository: `tools/mh_data/` is left out because of its size, 126 MB. Get it from the MakeHuman repository above to rebuild characters.)

- **Anatomy:** a real skull, eye sockets, a nose with nostrils, lips, a jaw and ears. Hands have fingers. Bodies have proper proportions. About 30–40k triangles per character.
- **Build per character:** the `macro` sliders set gender, age, muscle, weight, height and ethnicity. The `targets` reshape the face and body: jaw, chin, nose, cheeks, brows, lips, eye bags, head shape and more. Every character is then scaled to their exact height.
- **Smooth skinning:** each vertex is weighted to up to 4 bones, so shoulders, elbows and knees bend without seams. It uses the same 17-bone skeleton plus a jaw, with the same rest pose, so every existing animation still fits.
- **Textures (512×512):**
  - The skin is painted with the face: brows, lash lines, lips, blush, freckles, stubble or beard, eye-socket shadow and baked light.
  - Close-fitting clothes are painted on by body region: shirts, jeans, socks, belts and buttons. Patterns (denim, plaid, stripes, knit, puffer quilting) run continuously across seams.
- **3D clothes, where thickness shows:**
  - **Jackets, coats, cardigans and the puffer:** shells over the body with folded-back cuffs, hems and collars.
  - **Skirts, dresses and coat tails:** built on MakeHuman's skirt helper.
  - **Shoes:** shells with toes smoothed away and flat soles.
- **3D hair:**
  - A cap over the skull with a hairline, with strands flowing from the crown.
  - Long hair from MakeHuman's hair volume, cut to length and kept clear of the face, with ragged alpha tips.
  - Ponytails and pigtails as tubes with ties. Bangs as a lower hairline over the forehead.
- **Also:** eyeballs with irises, teeth, tongue, lashes and a dark mouth interior (seen when the jaw opens). Glasses, caps and party hats.
- **Louis:** the Brute arm is the real arm inflated three times, lumpy and swelling into the shoulder. It's drawn in the moving-flesh material, and the cardigan is torn open around it.
- **The ACROSS:** an emaciated body with ribs and spine pushed out, a hollowed stomach, white eyes, and a brand on the hip.
- **The photo cast** (`assets/characters/photo/`) is built the same way. Re-shoot the photos with `tests/photo_studio.tscn`, then run `tools/frame_photos.py`.
- **Old builder:** `tools/build_characters.py` no longer touches these models. Use `--legacy` to rebuild the old box versions.

## Talking instead of portraits

- **The dialogue box** shows only the speaker's name.
- **The speaker talks:** `TalkModifier` (`scripts/characters/talk_modifier.gd`) runs on every character model.
  - **Jaw:** opens and closes with the text as it types out. Wide on vowels, closed on b/m/p and pauses.
  - **Head:** nods and tilts, harder on "!" and "?".
- **Hands, while standing,** depend on the line's `mood`:

| Mood | Gesture |
|---|---|
| neutral | an open hand turning out |
| angry or shout | chopping beats |
| scared or panic | hands up and shaking |
| cry or sad | a hand to the face, shoulders shaking |
| happy | both hands |

- **Matching speakers to models:** the speaker id is matched to the model id (`norah_worn` speaks as `norah`). Set `speaker` on a CharacterModel to override it.

## Still to model: Bellemood (a CROSS)

- **Who:** a CROSS named "Bellemood", its demon name. He stands at the head of the chapel, on the altar stage.
- **Look:** a white priest's alb under a red chasuble. A large cross has burnt through the robe and chasuble, showing the burning cross on the centre of his chest, with a little steam rising from it.
- **Status:** to be added to `CAST` in `tools/build_humans.py`.

## Norah: dropping off ledges (Oct 27)

- **airborne:** knees tucked, arms out for balance. It plays once she has been falling for a moment.
- **land_hard:** about 1 s. She buckles into a deep crouch with a hand to the floor, then pushes back up. Controls lock for 0.85–1.4 s depending on the height.
- **The rule:** any drop over 0.45 m (`stun_drop` in `player.gd`). Steps don't trigger it.
