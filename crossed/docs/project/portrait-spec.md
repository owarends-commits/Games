# Crossed — Character portrait spec

Whenever portraits are requested for a character, deliver all 12 frames:

| Expression | Closed | Talking |
|---|---|---|
| Neutral | ✓ | ✓ |
| Happy | ✓ | ✓ |
| Scared | ✓ | ✓ |
| Screaming | ✓ | ✓ |
| Crying | ✓ | ✓ |
| Brave / determined | ✓ | ✓ |

## Photo-based portraits (decided 2026-11-04)

The user sends a real photo for each character, and the portrait is built from it.

**Style:**
- **Realistic.** Keep the photo's own shading, features and skin texture. Don't posterize or smooth them away; a flat 4-tone ramp was tried and rejected as going too far.
- **Format:**
  - 96×112 px, facing left (mirrored)
  - up to about 48 colours
  - dark brown outline
  - transparent background

**Matching the character's design:**
- The photo is adjusted to match the written design rather than the other way round. For Kenneth that meant:
  - hair cut short
  - beard trimmed to stubble
  - irises tinted blue
  - black puffer collar added
- Where the photo has longer hair than the design, the short cut is mostly filled in by hand and can read a bit like a cap. Photos with hair already close to the design come out best.

**Expressions:**
- **How they're made:** each one is a warp of the same photo, so the real features move instead of being repainted. For scared: brows raised and pulled in, eyes stretched taller, jaw dropped with the lips parted.
- **Planned warps for the others:**
  - Happy: cheeks up, eyes narrowed, mouth corners up.
  - Screaming: a big jaw drop, brows pushed up hard, eyes wide.
  - Crying: inner brows lifted, eyes narrowed and wet, mouth corners down.
  - Brave: brows lowered and pulled together, jaw set, lips pressed.
  - Talking frames: the closed frame with the jaw dropped a few pixels.
- **Limit:** big expressions (screaming, smiling) look stretched from a single photo. Photos of the person actually making each face give better results.

**Tool:** `kenneth_real.py <photo> <out.png> [mood]`. It's still Kenneth-specific: the crop and the eye, mouth and face coordinates are set by hand per photo.

**Status:**
- Kenneth: neutral and scared are done and approved (2026-11-04). The other 10 frames are not made yet.

## In game

- Portraits are currently **not shown** in the dialogue box. Since 2026-11-02 the box shows the speaker's name only, and the 3D character talks. Where photo portraits will be used is still to be decided.
- The earlier layout, kept for reference:
  - busts in the bottom corners with name plates
  - the right-hand speaker mirrored
  - "Stranger" on the plate for unnamed characters
- ACROSS brands are the only bright colour in any portrait.

## Old generator

- `tools/make_portraits.py` makes the older pixel-art busts (about 96×112, three-quarter view, cluster shading, dark brown outlines). It's deterministic.

## Notes from the prologue cast

- **The Stranger (an upper demon):**
  - He has a small cross burned through his sweater on the back of his right shoulder. It moved there from his left thigh on 2026-10-26.
  - It's visible on his in-game model and smokes during the drive.
  - Adaline asks about it; he never answers.
  - It doesn't appear in the bust portraits.
