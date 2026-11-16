# The Hob: Chapter 2 final boss (agreed direction, 2026-11-16)

The model is `crossed/assets/characters/lowpoly/bosses/hob/hob.glb` (see the README beside it). Its animations are being designed one at a time in a browser preview, then the physics gets perfected in the Combat Playground, then it goes into Godot.

- **Preview:** `crossed/tools/hob_preview/` (how to run it is in the README there). A published copy is at https://claude.ai/artifact/P9fmG7a3WDQx6pdG7BgvRA (private to the owner).
- **Rig:** `crossed/tools/rig_hob.py` builds the stand-in skeleton the preview uses. The model itself still has no rig; the game needs a proper one.

## Who it is
- The Hob is the giant the README describes, made from the ACROSS in the church. Bellemood, the CCROSS priest on the chapel stage, is merged into it and drives it.
- **It can't be killed.** The fight is an escape.

## The fight, in order (user direction)
1. **The basement:** Norah first meets it in the chapel basement. A brief stealth section follows.
2. **Chased out:** it chases her out of the basement and up the stairs.
3. **The church:** a stealth section through the whole church.
4. **The final chase.**
5. **The end:** she destroys the church around it, and the building crushes it.

## Weak points
- **The cross:** a burning brand on its **right upper arm, just below the shoulder**, on the outer top of the arm. It smoulders and smokes, and it's sunk into the skin, not stuck on.
  - It was first planned on top of the shoulder. That spot is hidden behind the head from where Norah is held in the throne grab, so it moved down the arm.
  - Shooting it makes the Hob screech and stuns it briefly (an earlier decision, carried over).
  - During the throne grab, the arm rolls about its own length to turn the cross toward her face, so she can always see it.
- **The eyes of the face:** shooting them is the other way out of the throne grab (below).

## The hands and the tongues
- **Both hands have a flesh tongue:**
  - About half Norah's height (0.85 m), broad and flat like a tongue. It can stretch to 1.05 m at most.
  - **Always fully out and always visible.** It comes up out of the back of the hand, curls over the knuckles and hangs off the outer edge under its own weight, writhing slowly. A planted hand's tongue lies on the floor.
- **The right hand:** the tongue comes out through an eye on the back of the hand. The eye has a yellow iris and a cross-shaped pupil, and it looks around on its own.
- **The left hand:** a lipped slit instead of an eye.
- **For later (not used yet):** the tongue was to search small corners the body can't reach, then grab Norah and bring her to Bellemood. The grabs don't use the tongue for now.

## Animations in the preview

| # | Animation | What happens |
|---|---|---|
| 1 | Crawl | The hands drag the whole body, hand over hand: one reaches ahead and digs in, then hauls while the other swings through. About 0.9 m/s. The torso sags and ripples behind, the back legs trail and scrape, and the face stays level. |
| 2 | Fast crawl | The same haul, short and frantic: about 2.4 m/s. |
| 3 | Screech | It tenses, rears up onto straight arms, tips the face back, and the mouth tears open. The head shudders. **No visual cue for the sound.** |
| 4–5 | Grab, left hand / right hand | A chase. Norah walks away ahead. The Hob drags itself after her on one hand (about 0.5 m/s) while the other arm reaches slowly until the fingertips just reach her back. Then the fingers wrap right round her, it stops and lifts her about 0.4 m, squeezes hard three times (the arm trembling) and drops her. No tongue, no mouth. |
| 6 | Throne grab | See below. |

### The throne grab
1. While crawling at her it plants both hands and shoves off once, hard. It launches forward at about 8 m/s and slightly into the air (about 0.6 s off the floor).
2. Both arms reach out for her. As the body crashes flat on its belly and skids, both hands close on her.
3. She's held centred in front of the face. Each arm comes round its own side of the head, elbows wide, so neither passes through the head.
4. It lies flat and still, head up, looking at her, then slowly draws her toward its mouth.
5. **Escape: 2 shots.** Either two to the cross on its right arm, or two to its eyes (one in each). Each eye hit bursts that eye. After the second hit it spasms and lets go, and she scrambles clear.

## Rules agreed while building it
- **Wrists stay natural:** a grabbing hand is set on its forearm the way the model rests and doesn't bend at the wrist; the arm brings the palm to her and only the forearm rolls. Every other hand is capped at 25° from its forearm.
- **Elbows stay low**, out to the sides, never through the floor.
- **The back legs rest on the floor:** never through it, never floating.
- **Nothing tears:**
  - Every part stays connected through every animation: knuckles, ribs, limbs.
  - The rig's weights follow position, so touching parts move together.
  - A test checks the 5,337 seams where parts meet; none open.
  - The only deliberate split is the mouth tear.
- **The torso pulses** with a heartbeat. Swellings ache, quiver and jump around under the skin as it moves, sloshing back with every surge.
- **The base crawl stays slow.** The lopsided arms are kept (one long reaching arm, one short dragging arm).
- **Arms can stretch** to reach her in the grabs. Whether to keep this is still open.

## Still open
- **The cross's size:** it's about 16 cm across, because the arm is thin. Should that part of the arm swell so it can be bigger?
- **Eye shots:** is two (one per eye) the right count?
- **Arm stretch:** keep it as a creepy trait, or have the body drag closer instead?
- **The other on-screen sound cues** (crawl, grabs): keep or remove? The screech's cue is already gone.
- **Not built yet:**
  - the tongue searching and grabbing
  - the basement and church stealth behaviour
  - the chase out of the basement
  - the church coming down on it
  - the screech and stun from a shot to the cross outside the throne grab

## Earlier concepts, superseded
Before the model was found, a stand-in "Old Hob" was prototyped: Bellemood fused with four ACROSS from the pews. That included an Offertory transformation, censer and sermon attacks, and a hearth-furnace idea. The real model replaced all of it. Bellemood driving the giant is what carried over.
