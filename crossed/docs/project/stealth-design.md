# Stealth system (rough draft, playground v11, Nov 4; vaulting added v12, Nov 5)

The user asked for a stealth system as a rough draft in the Combat Playground (https://claude.ai/artifact/FzEykM1KVDwwpKjrgcwXzv), with a stealth scenario. Every number below has a slider in the playground's "Stealth" panel. Combat rules live in combat-design.md.

## Norah
- **Crouch:** X toggles it (pad: left-stick click; touch: CROUCH). Crouched, she moves at 0.9 m/s, can't run, is about half as visible (×0.55), and the camera drops 0.4 m. Aiming walk while crouched is ×0.8.
- **Noise:** everything she does makes a noise of a set radius.

| Action | Radius |
|---|---|
| Gunshot | 25 m |
| Running | 7 m |
| Walking | 2.5 m |
| Walking while aiming | 1.5 m |
| Crouch-walking | 0.8 m |
| Reloading | 2.5 m |
| Opening a door | 4 m |
| Slamming a door | 12 m |
| Pushing furniture | 6 m |
| Shoving | 3 m |
| Breaking glass | 15 m |
| Slow vault | 1 m |
| Fast vault | 6 m (takeoff and landing) |

  Footsteps repeat every 0.38 s while she moves. Noise through walls carries half as far.
- **Light:** how visible she is depends on how lit her spot is: ambient light (0.1) plus nearby lights, falling off with distance.
- **HUD:** "SEEN" shows her visibility as a bar and a percentage. "NOISE" shows the radius of the last sound she made, and "CROUCHED" shows when she's crouched.

## Vaulting (playground v12, Nov 5)
Only Norah can vault; ACROSS and Louis can't (crawlers still go under tall furniture).
- **Input:** Space next to a vaultable surface does a slow vault; hold Shift + Space for a fast vault. Pad: LB, or B + LB for fast. Touch: the VAULT button, fast when RUN is held.
- **What counts as vaultable:** a box 0.35–1.3 m tall and no deeper than 2.3 m that's within 0.75 m of her, that she's facing (within about 60°), with room to land on the far side and no wall or closed door in the way. Pews, crates, tables, beds, counters, desks and couches all count. The chapel stage (2.6 m deep) doesn't.
- **Prompt:** the HUD shows "SPACE: vault over the <name> · SHIFT+SPACE: fast and loud" when one is in reach, then "VAULTING (slow, quiet)" or "(fast, loud)" during it.

| | Slow vault | Fast vault |
|---|---|---|
| Time | 1.4 s × (0.75 + 0.25 × depth in m), so about 1.6 s over a 1.6 m crate | 0.5 s |
| Noise | 1 m (quieter than crouch-walking) | 6 m on takeoff and again on landing |
| Motion | Climbs on, shuffles across on her knees, lowers herself down | One hand on the top, legs swung over to the side, drops on the far side |

- **During a vault:** she can't aim, reload or dodge, and her reload is cancelled. She's committed to the landing spot.
- **Grabbed mid-vault:** the vault is cancelled, she drops to the floor where she is, and the grab QTE starts as normal.
- **Tested headlessly:** slow and fast both land 0.42 m past the far edge. Facing away or standing 1.7 m off gives no vault. An unaware ACROSS 4.2 m away ignores a slow vault and turns suspicious at a fast one.
- **Sliders:** Norah panel has slow vault time, fast vault time, vault reach and highest vaultable. Stealth panel has slow and fast vault noise.
- **Run stats:** the vault count is on the results card.
- **Open questions for later:** whether a fast vault should stagger her if she lands next to an ACROSS; whether ACROSS should climb over (slowly, falling off) instead of routing around; and vaulting through smashed windows.

## ACROSS awareness
- **States:**

| State | Marker | What it does |
|---|---|---|
| Unaware | none | Idle behaviours (below) |
| Suspicious | yellow ? | Turns toward the sound or glimpse, walks over slowly, looks around, then gives up after about 3.5–10 s |
| Hunting | red ! | The full combat AI |
| Searching | orange ? | Goes to where it last knew she was, sweeps nearby points within 3 m for 10 s, then gives up and wanders from there |

- **Sight:**
  - The cone is 110°, 77° for the Mourner and 143° for the Wailer.
  - Range is 14 m in full light, shrinking to 35% in darkness.
  - Awareness fills faster when Norah is close, lit and moving. It fills 2× faster once the ACROSS is suspicious, and slower when she's standing still.
  - She becomes suspicious at 35% awareness and hunted at 100%. Awareness drains when it can't see her.
- **Hearing:**
  - Any noise inside its range makes it suspicious and points it at the sound.
  - A gunshot always triggers hunting, as does a loud noise in the inner half of its range.
  - Feeding ACROSS hear half as far.
- **Being seen up close:** walking into one, about 0.9 m, alerts it. Being shot or shoved always alerts it.
- **Losing her:**
  - A hunter out of sight heads to her last known spot after 1 s.
  - After 5 s it switches to searching.
  - Within 8 m a hunter senses her all around, so circling doesn't lose her.
- **Spreading the alarm:** a hunter's shriek makes others within 8 m suspicious, and they investigate where it saw her.
- **Louis** ignores stealth for now and always hunts.

## Idle behaviours (unaware)

| Behaviour | What it does |
|---|---|
| Wander | Shuffles between random points within 4 m of home |
| Stand | Faces one way, sometimes shifting slightly |
| Feed | Crouched over a body, chewing; sees in a 50° cone and hears ×0.5 |
| Play dead | Lies face-down, can't see, and only gives itself away by the odd twitch and its smoking brand. Within 1.6 m it springs and grabs her ankle from up to 2 m |
| Lurk | Waits low, often under furniture; triggers within 2 m |

## Ambushes
- **Crawl-under furniture:** Crawlers and legless ACROSS pass under beds, tables, desks, pews and gurneys that are 0.5 m tall or more.
- **Windows:** hunting and searching ACROSS (and Louis) route through windows and smash them: glass sprays, the noise is 15 m, and the sill is climbed over.

## Stealth scenario: the abandoned clinic
- **Layout:** a dark building with a central hallway and four rooms:
  - **Office:** desk and cabinet.
  - **Ward:** beds.
  - **Storage:** shelves and crates.
  - **Cafeteria:** tables and a counter.
- **Lighting:** a few lit pools, red emergency light at the north end, and bodies on the floor.
- **Win:** reach the green exit at the north end; the run ends as ESCAPED. Norah has 2 bullets.
- **Who's in it:**
  - a Walker playing dead in the hallway
  - a Crawler lurking under a ward bed
  - a Patient facing the ward wall
  - a Matron wandering the office
  - a Mourner feeding in the lit cafeteria
  - a Walker wandering the cafeteria
  - a Fresh standing in storage
  - a Dragger wandering by the exit
- **Run stats:** times spotted.

## Also in this pass (ACROSS improvements 1–3)
- **Ragdoll-style deaths:** an upright ACROSS tips over on its momentum, with gravity speeding the fall.
  - It slumps against a wall if one is in the way (stopping at the angle where its head meets the wall) and drapes over furniture, folding at the waist over the edge.
  - Its arms and head go limp toward the ground, it bounces once on a hard landing, and the death twitches fade over a few seconds.
  - Crawlers and bodies already on the floor collapse in place.
  - Tested: open floor 90°, against a wall 27°, over a crate 41°.
- **Knockdowns:** they now land on their back 75% of the time; trips still land face-down.
- **Wounds:** every hit leaves a dark wound with a drip on the body part (up to 16).
  - A hurt but attached arm hangs limp.
  - A hurt leg buckles and slows it to ×0.8.
  - Wounded or crippled ACROSS leave a blood trail (every 0.45 m when crawling or legless, every 1.3 m otherwise).
- **Arm loss changes attacks:**
  - With one arm, it swipes with the remaining arm.
  - With no arms, there's no swipe or grab, and lunges do ×0.6 damage.
  - The bear hug needs both arms; with one, the Matron does an ankle grab instead.
- **Jaw:** a head shot that doesn't kill has a 35% chance to shoot the jaw away. Without a jaw it can't bite: lunges do ×0.55 damage and grab bites ×0.4.

## Next steps
- Give Louis senses: he hunts by sound and sight like Mr X.
- Hiding spots: lockers and under beds for Norah.
- Distractions: throwing a bottle or brick to make a noise elsewhere.
- Sounds per subclass that carry through walls.
- Feeding ACROSS that go back to their meal after a search.
- Vaulting follow-ups: landing stagger near enemies, ACROSS clumsily climbing over, vaulting through smashed windows.
