# Combat design (agreed direction, 2026-10-26; updated 2026-11-04)

**Roadmap (Nov 4):** https://claude.ai/artifact/QdWJxYuUx1kKR91hRkR5Eu is a phased plan with a playground gate on each phase. The user is editing it.

**ACROSS Lineup (Nov 4):** https://claude.ai/artifact/KnCQQwydG8FqAQqr9P6dg2 is a standalone 3D page, separate from the playground, showing nine ACROSS side by side at different heights. Each has its own body, clothing, way of moving and signature move. They're named after the asset bundle's variants; the looks are a first interpretation. The playground (v6+) uses the same bodies, built by the same code, which is copied between the two pages.

**User notes added to the roadmap (Nov 4):**
- Focus on a very polished, fun combat system; don't worry about placing ACROSS into chapters yet.
- The gun should be aimable and fireable with just the touchpad.
- Norah can move slowly in all directions while aiming and firing. Built in the playground v5: 0.7 m/s, and 30% of that for 0.25 s after a shot.
- Stealth was added to the survival toolkit.
- The boss phase was removed from the roadmap.

**Camera (Nov 4, user asked for it closer):** the playground's over-the-shoulder camera is now closer.

| | Distance behind | To the side | Height |
|---|---|---|---|
| Moving (was 2.7 / 0.6 / 1.75) | 1.7 m | 0.5 m | 1.65 m |
| Aiming (was 1.25 / 0.5 / 1.58) | 0.9 m | 0.42 m | 1.58 m |

Each value has a slider under "Camera & controls".

## Physics (playground v9, Nov 4; the user asked for it)
Ragdoll falls and deaths aren't built yet; they're the next physics step.

- **Momentum:** everything moves by velocity, not by setting positions.

| Who | Speed-up | Slow-down |
|---|---|---|
| Norah | 12 m/s² | 16 m/s² |
| Norah while aiming | 7 m/s² | 7 m/s² |
| ACROSS | 9 m/s² | 7 m/s² |
| Louis | 2.5 m/s² | 3.5 m/s² |

- **Skidding:** falls, staggers and missed lunges slide out on a skid friction of 14 m/s². A missed ACROSS lunge skids about 1.5 m past.
- **Trips from momentum:** an ACROSS's trip chance rises with its speed and how sideways its momentum is to its facing, so hard turns at speed trip it.
- **Weight:** Norah is 60 kg. An ACROSS is about 45–75 kg, set by its height and build (the Fresh are ×1.3, crawlers ×0.9). Louis is 170 kg.
- **Pushes:** every push is a force divided by the weight being pushed.

| Push | Force (N·s) | Example |
|---|---|---|
| Bullet | 120 × the zone's knockback | |
| Shove | 140 | sends a Patient off at about 2.7 m/s, Louis at about 0.8 |
| Knockdown | 90 | |
| Haymaker on Norah | 320 | about 5.3 m/s, sliding her back about 0.9 m |
| Lunge on Norah | 120 | |
| Swipe on Norah | 70 | |

- **Recoil:** each shot nudges Norah back 0.35 m/s.
- **Shove knockdowns:** the chance scales with weight (65 kg ÷ the body's mass, clamped to 0.25–1.2), so heavy bodies stay up more often.
- **Bodies push each other by weight:** Louis barely moves when he walks into Norah or an ACROSS.
- **Bowling over:** a body more than twice as heavy, moving faster than 0.6 m/s, knocks an ACROSS down (at most once every 1.5 s per ACROSS).
- **Furniture:** heavy bodies drive pushable furniture ahead of them. Furniture weighs about volume × 90 kg/m³, and a body pushes it only if it carries at least 25% of their combined weight.
- **Grabs:** Norah is anchored in place while grabbed.
- **Panel:** every value has a slider in the "Physics" section, and "Physics on" can be switched off to compare.

## Basic combat
- Survival-horror style: raise the weapon and plant your feet; you can't walk while aiming, only turn. **(Superseded Nov 4: slow movement in all directions while aiming; see above.)**
  - Over the shoulder (the default since 2026-10-29), you aim yourself with the reticle at the centre of the screen.
  - The older fixed-camera schemes keep auto-aim on the nearest threat in front of you.
- Fights are costly: scarce ammo, and most encounters can be survived without winning them (doors, distractions, running).
- Enemy tiers change *how* you fight, not just health:
  - **ACROSS:** erratic and fragile, dangerous in groups.
  - **BCROSS:** each variant poses its own problem.
  - **CCROSS:** reads the player; fights are duels.
- The cross brand is **not** a weak point at first. It may become one later through story discoveries.

## ACROSS (decided Nov 4, built in playground v3–v10; the user approved the animations)
- **Movement is jumbled, never clean:** no straight runs. They move in lurching bursts (0.35–1 s) broken by stalls (0.08–0.35 s), with sudden heading snaps.
- **Trips:** they fall often, more when moving fast or turning hard, and always risk it after a lunge. A fall slides them on their momentum and leaves them on the floor about 0.8 s, then they scramble up.
- **Animation:** every joint jerks to new offsets at random moments instead of following a smooth cycle.
- **They twitch only when they struggle to move (user note, Nov 4):** the hard jerking happens while they lurch forward, scramble up from a fall, or wind up an attack. At rest or pausing they're nearly still, with only a rare single twitch.
- **Speed:** a Walker's average approach is about 1.6 m/s. Norah outruns one but can't outwalk it.
- **Clumsy but strong (base values):**
  - a lunge with a 0.25 s tell, for 15 damage
  - a close swipe with a 0.18 s tell, for 10 damage, which it can throw even from the floor
- **Packs:** no more than 2 attack at once. The rest circle at about 3.6 m and wait for an opening.
- **Knockdowns:** they fall instead of staggering.
  - A leg shot knocks one down 80% of the time, a torso shot 30% (more while it's bursting or lunging), and a head shot 15%.
  - A shove knocks one down 100% of the time, scaled by weight (see Physics).
  - A shot that hits one already on the floor keeps it there longer.
  - After a shove knockdown, it can't swipe for 0.8 s.
- **Limb health:** 2 per limb (raised from 1). The first leg hit knocks it down; the second blows the leg off.
- **Grabs are broken with a quick time event (user note, Nov 4; playground v8):**
  - **The grab:** it deals its damage when it lands. Time slows to 0.5×, and a prompt appears (E, Q or Space; A, X or Y on a pad; tap on touch) with a 0.9 s timer bar.
  - **Ankle grab** (any legless ACROSS, and the Crawler): 2 prompts in a row.
  - **Bear hug** (the Matron): 3 prompts, each with 0.765 s (85% of the normal time).
  - **Success:** Norah pushes it off. An ACROSS is knocked down; anything else staggers. It can't attack again for about 1.5 s.
  - **Wrong key or too slow:** it bites (8 damage, 12 for the hug), and Norah stumbles free.
  - Shooting or staggering the grabber also frees her, and a roll's invulnerability avoids the grab.
- **Death:** they collapse face-down and twitch, the spasms dying away over a few seconds.
- **The brand:** a cross on the lower hip that smoulders with an ember glow and gives off a thin stream of smoke, which carries on for about 6 s after death.
- **Every ACROSS is a different person:** different heights (about 1.48–2.02 m), builds, skin tones and hair remnants. Gaunt bodies show ribs, spine and collarbones; they have white eyes and a working jaw.
- **Subclasses:** they look and fight differently (playground v6; the user approved the fighting differences on Nov 4). The fighting rules are multipliers on the ACROSS sliders.

| Subclass | Height | How it moves | What it wears | How it fights |
|---|---|---|---|---|
| Walker | 1.68–1.86 m | Upright lurch, one knee buckling | Torn tee and jeans | The baseline |
| The Fresh | 1.74–1.92 m | Recently taken, still fleshed, most human-like until it snaps | Sweater, slacks, shoes | ×1.7 health, ×1.25 speed, rarely trips, straight lunges. 70% start disguised, standing still like a person, until Norah is within 4 m, it's hit, or a Wailer screams. |
| Kneeler | 1.62–1.80 m | Shuffles on its knees, hands reaching | Sunday shirt, vest, worn-through slacks | ×0.55 speed, knockdowns ×0.3, upward swipe ×1.6 damage |
| Crawler | 1.55–1.76 m | Hands and knees, elbows out | Rags at the waist | Low target; ankle grab even with its legs intact (about half its close attacks) |
| Dragger | 1.70–1.88 m | Hauls a dead, twisted leg | Overalls, one leg torn away | ×0.6 speed, loud scraping you hear first, long lunge (×1.35 range) |
| Mourner | 1.78–1.95 m | Bent double, head bowed, slow then sudden | Black funeral suit, tails in strips | Creeps at about a third of speed while Norah is over 5 m away, then lunges from ×1.5 range with only a 0.15 s tell |
| Matron | 1.48–1.60 m | Small hunched steps, arms reaching | Long dress, ragged hem, shawl | Bear hug: 12 damage on the grab, then a 3-prompt quick time event, failing it costs another 12 |
| Patient | 1.58–1.76 m | Limp arms, head rolling | Hospital gown, wristband, head bandage | ×0.67 health, ×1.8 erratic, trips more, ×1.5 jerkiness |
| Wailer | 1.88–2.02 m | Lanky, head back, jaw open, arms out shaking | Torn undershirt, trousers shredded at the knee | A 1.2 s scream, about every 9 s, when Norah is within 10 m. ACROSS within 18 m are rallied for 4 s (×1.3 speed, steadier, and the Fresh drop their disguise), and Norah is dazed for 1.5 s (×0.6 movement, the camera sways). |

## Where you hit matters (built 2026-10-29)
Every Cross can carry a hit-zone body (`scripts/enemies/cross_body.gd`). A shot is tested against its head, torso, both arms and both legs (upper and lower), as the body is posed at that moment.

| Zone | Damage to the body | Knockback | Stagger | Notes |
|---|---|---|---|---|
| Head | ×2 | short | longest (about 1.1 s) | Snaps the head back |
| Torso | ×1 | biggest | about 0.55 s | Rocks the chest back |
| Arm | ×0.4 | small | short | Hurts the arm toward losing it |
| Leg | ×0.4 | tiny | about 0.75 s | Buckles the knee; hurts the leg toward losing it |

- **ACROSS hitboxes (playground v10, Nov 4; the user asked that they stay reasonable to shoot):**
  - **Why:** gaunt ACROSS limbs are only 5–7 cm wide, about 2 pixels at 6 m on the 320-wide render. So shots test invisible boxes that follow each body part and are a little larger than it; the visible model doesn't take hits.
  - **Sizes before the body's height scaling:**

| Part | Width × height × depth |
|---|---|
| Head | 0.24 × 0.3 × 0.26 m |
| Chest | 0.37 m (× build) × 0.36 × 0.25 |
| Abdomen | 0.3 m (× build) wide |
| Pelvis | 0.32 m (× build) wide |
| Neck | 0.11 m |
| Upper arm | 0.095 m thick |
| Forearm and hand | 0.09 m thick |
| Thigh | 0.16 m (× build) × 0.15 |
| Shin | 0.125 × 0.12 m |

  - **Tested:** aimed shots with about ±2 px of aim shake at 6 m, across all nine subclasses facing and side-on.

| Aimed at | Lands on that part | Misses the body | Before hitboxes |
|---|---|---|---|
| Head | 93% | 4% | 80% lands, 19% misses |
| Torso | 82% | 2% (the rest hits arms or head) | 81% lands, 5% misses |
| One leg | 78% | 20% | 71% lands, 27% misses |

  - **Legs stay the hardest target on purpose,** since leg shots buy knockdowns.
  - **Sliders:** "Hitbox size ×" and "Limb hitbox thickness ×". H shows the boxes.
  - **In Godot:** each bone gets an Area3D or collision shape sized the same way, and only those take ray hits.
- **Crippling:** each limb has its own health. When it runs out, the limb is blown off at the joint above where it was hit. A stump is left, the piece falls, and blood pools under it.
  - **One leg gone:** he drops onto his knuckles and drags himself, slower.
  - **Both legs gone:** he crawls.
  - **A Brute's big arm gone:** no more haymakers, only a rake with the other hand at close range.
- **A Brute doesn't flinch out of a swing already coming,** except from a head shot, a leg shot, or losing a limb.
- **Roll (dodge):** while aiming, Shift/B plus a direction. She can't be hit for most of the roll.

## Louis, the first BCROSS (the Brute)
- **Look:** an upright, brooding figure about 2.75 m tall. His left arm is swollen with lumpy masses of flesh that move under the skin, roped with dark veins. He has kept some muscle and fat, and his skin is less pale than an ACROSS.
- **How he moves:** slow, heavy and aware (think Mr X). He walks at her and always turns to keep her in front of him, and he ducks his head under ceilings indoors.
- **Weight (playground v9):** 170 kg. He barely moves when a lighter body walks into him, bowls over ACROSS in his way, and drives furniture ahead of him. He also takes time to get going and to stop.
- **Gets faster as he's hurt (user note, Nov 4; not built yet):** at lower health he starts moving faster, and when he's very low he breaks into a full sprint.
- **The tell:** he hauls the big arm back before the haymaker. It does 40 damage and has a long reach. Roll through it.
- **Toughness:** 8 body health, about eight body shots or four head shots. Limbs: big arm 3, other limbs 2.
- **In the game since v14 (Nov 4):** that 8 only knocks him down. Across the whole night he has 26, so the house fight can't kill him and he hunts her through the rest of Chapter One as a stalker. See chapter1-playtest-notes.md.

## Norah's melee (decided)
- **What it is:** a short shove or punch, a brief distraction rather than a way to kill anything.
- **What it does:**
  - **ACROSS:** knocks them down (since Nov 4); heavier ones resist (see Physics). The Kneeler resists.
  - **CCROSS and the smaller BCROSS (not the Brute):** a short stun or stagger. It does little damage, and killing one this way should be very hard.
  - **The Brute and anything bigger:** never kills them. It's meant to make an opening, not win the fight.
- **What it's for:** slipping past an enemy, gaining distance to run or hide, or repositioning for a shot.
- **Design notes:**
  - Short recovery so it's safe to use, but a cooldown so it can't be spammed.
  - Builds on the stagger system already in the prologue (Kenneth gets shoved by the ACROSS).

## Bosses (Kindred)
- Understanding wins, not damage: readable windups, sound cues and changes to the arena between phases.
- Bosses get loose tracking cameras so the boss and the player are always both visible.
- **The Archangels:**
  - Michael: a slow overhead slam.
  - Uriel: zones you can't stand in.
  - Gabriel: delayed attacks.
  - The stone cracks to expose flesh, and the final phase overturns the patterns learned earlier.
- **The Living Choir:** singers telegraph its sonic attacks, pillars give cover, shooting a singer interrupts a hymn, and the eye-legs are the weak points.
- **Build order:**
  1. A combat test room.
  2. ACROSS AI.
  3. One BCROSS (the Brute): built as Louis.
  4. The Archangels.
