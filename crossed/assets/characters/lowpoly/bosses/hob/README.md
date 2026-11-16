# The Hob: Chapter 2 final boss (look-development model)

Working name in the design notes: "the Congregation". Full design: `ch2-final-boss.md` in the project notes.

**Animations and fight design:** `crossed/docs/project/hob-boss.md`. A rigged copy and a browser preview of its animations are in `crossed/tools/hob_preview/` (rigged by `crossed/tools/rig_hob.py`).

| File | What it is |
|---|---|
| `hob.glb` | The current model. **Static, no rig.** About 23,800 triangles, one 1024 atlas. |
| `hob_sheet.png` | Six views: front (the player's view), 3/4 front, side, 3/4 back, rib and hand close-ups |

## What it is
- **The giant:** made from all the ACROSS in the church, moulded by Bellemood, the CCROSS priest, through whom a Kindred works. Bellemood is merged into it and drives it.
- **The fight is an escape:** it can't be killed. It stalks Norah through the chapel, then a scripted dash follows. Norah survives by:
  - bursting growths for the knockback flash
  - environment traps
  - hiding to break line of sight
- **The ending:** it corners her and she collapses the church on it, burying it in the rubble.

## The model
- **The head:** a 2.8 m face that fills a basement hallway. It looms in front and hides the body from the front, so only the arms show either side of it.
- **The body:** long, skinny and starved, crawling low.
  - **Ribs and bones:** detailed ribs with dark hollows between them, jutting shoulder blades, a knobbed spine and hip bones.
  - **Arms and hands:** thin arms (one reaching, one dragging) with big, bony, long-fingered hands dug into the floor.
  - **Back legs:** chubby, with toad-like bumps on them only.
  - **Skin:** waxy yellow-tan with bruises, creases, veins and grime.
- **Style:** Puppet Combo-style. Built by `colossus.py` in the Claude workspace.

## ⚠ Placeholder face, replace before release
The face texture is a frame taken directly from an AI-generated TikTok video the author used as reference ("the Hob"). It is **not cleared for release**. Replace it with a texture from the author's own source, matching the look, before the game ships.
