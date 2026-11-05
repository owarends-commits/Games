# Chapter One: Norah (v13, built from your map)

## What's new since v10

**v13 (Oct 29)**
- **Over the shoulder.** The camera sits just over Norah's right shoulder and she turns wherever it turns. The camera stops short of walls, doors and ceilings instead of passing through them. See the controls below. Aiming is free: shots go along the centre of the screen and walls stop them.
- **CRT night is the default screen style:** 480×360 with light scanlines, a vignette and a cooler, higher-contrast grade. It has far less grain than before. F2 still cycles the other styles.
- **Ground fog outside.** Thick fog lies low over the yards, the lane, the road and the treeline. It is densest at the ankles, thins to wisps by the hips and drifts slowly. Headlights and the flashlight light it up. It stays out of the houses and the car and truck cabins.
- **Hard landings** now play a short falling pose and a stagger-and-rise animation.
- **Louis is a BCROSS Brute now:** a tall, brooding figure about 2.75 m tall, upright like Mr X. He has kept some muscle and fat, and his skin is less pale. His left arm is swollen with lumpy masses of flesh roped with veins, and the flesh slowly moves under the skin.
- **The walk up:** white shapes dash through the woods with a rush of leaves. Louis stands in the trees, and the car's headlights hang in the fog as two cones that light only his patch of woods.
- **The freeze (about 11 s):**
  - Over her shoulder at him.
  - His point of view from the trees, where the headlights die.
  - Her face as she turns to the dead car.
  - The dark, where his burned-in silhouette flickers closer.
- **The run:** you run for the house in the dark.
- **At the house (about 5 s):**
  - He walks out of the darkness beside her, slow and deliberate, with a sharp sting.
  - He swings the arm. She ducks and rolls, and his fist punches a dent into the brick. The dent stays for the rest of the chapter.
  - His fist stays in the wall for 2 seconds while his head turns after her. Then he wrenches free and follows, slowly. If he reaches you, the arm hits for 30.
- **The bedroom:**
  - He shoulder-charges through the window, crashes face down across the bed, then pushes himself up.
  - Indoors he walks hunched to fit under the ceilings, slow and always turning to face you.
  - When he hauls the arm back, roll: Shift/B while aiming.
- **Where you shoot him matters:**
  - **Head:** double damage and the longest stagger.
  - **Body:** the most knockback.
  - **Arms and legs:** less damage, but enough hits blow them off.
  - **Losing a leg** drops him onto his knuckles; both legs and he crawls.
  - **Losing the big arm** means no more haymakers.
  - It takes about eight body shots, or four to the head, so most of your bullets. Details: `claude/combat-design.md` in the project.
- **Norah's legs** are slimmer and set closer together, with smaller boots, to fit her body.

**v12 (Oct 27, afternoon)**
- **Your 3D items are in.** Pickups show the item in 3D. Turn it with the arrows, zoom with Shift+Up/Down, and press **X** (pad Y) to look closer at the examine points you pinned. In the items screen the selected item turns in the preview, and X opens a full inspect view. Photos show the real picture on your instant-photo model. Names and descriptions come from your Item Modeler export.
- **Dropping off ledges.** Norah can walk off any edge. A drop of more than 0.45 m ends in a hard landing (a crouch with a hand to the floor and a woozy beat) and about a second without control. She has a short falling pose too. Walking down steps never does this.
- **Props rebuilt.** Every prop comes from the new shared asset library, textured with the game's textures and with more detail.
- **Fixes:** the items list no longer shows "Old Revolver x2", and the pills message reads "two of the pills".

**v11**
- **No cellphones.** The car call is now "I'll call Kenneth's line when I get home." Denise talks about the television.
- **Radio:** a strange sound plays under the radio's line about missing people.
- **Blackout:** when the headlights die, the screen goes almost fully black.
- **Louis:** he always turns to face Norah when they're in the same room.
- **Removed:** the teleport to the TV after the broadcast, and the camera on the truck in the yard.
- **Pills:** "Louis's pills" are now just "Pills".
- **The Pruitt line** comes earlier, as you pass their house.
- **The road:** it is now a line of spaced-out houses ending at Norah and Louis's cul-de-sac, with one more property past Norah's.
- **The forest:** much denser (about 5,900 trees, plus ferns and leaf drifts).
- **Art pass:** new woods, tiles, ground and leaves on every surface. The people have rounder heads, distinct builds and clothes that stand off the body.
- **Road glitch fixed:** Norah's road no longer flickers.
- **Compass:** a small compass at the top centre points to the objective and the items she still needs. It hides in cutscenes and conversations.
- **Barricades:** you now have to mash **E** to push the furniture.

The chapter is now built straight from your Map Designer file, using your layout, your twenty cameras and your notes. It runs from the drive home to the CHAPTER TWO: THE OLD CHAPEL card.

**Run it:** open `scenes/chapter1/chapter1.tscn` and press **F6**.
**Restart from the top:** F5 while playing.
**Jump ahead** (Project Settings → Run → Main Run Args, after `--`): `start=walk | sprint | inside | wardrobe | duel | after | louis | road`. Add `autoplay` to make it play itself.

## Controls (over the shoulder, from v13)

The camera sits just over Norah's right shoulder, between her head and shoulder, framed down to just below her waist. She turns wherever the camera turns. It pulls in when a wall, door or ceiling gets in the way, and cutscenes still cut to their own cameras and hand back.

| Action | Keyboard / mouse | Pad |
|---|---|---|
| Look (she turns with the camera) | Mouse; or the arrow keys | Right stick |
| Move: forward, strafe, back up | W / A / S / D | Left stick |
| Run (forward) | Shift | B |
| Quick turn (spins the view 180°) | Q | X |
| Interact / next page | E or Space | A |
| Open a door | E once eases it open quietly; press E again while it opens to smash through (loud) | A |
| Items screen | Tab or I (menus use WASD or the arrows) | Back |
| **Aim** (any time she has the revolver; feet planted, the view tightens over her shoulder, the reticle turns red on a target) | C or right mouse | LB |
| **Fire** (while aiming, along the centre of the screen; walls stop the bullet) | F or left mouse | RB |
| **Reload** | R | X |
| **Shove** (melee) | V or middle mouse | Y |
| **Dodge** | While aiming, tap Shift plus a direction (back if none) | While aiming, B |
| Heal | Tab → ITEMS → Pills → E | — |
| Free the mouse | Esc (click to take it back) | — |
| Screen style (grain, sharpness) | F2 cycles them | — |
| Old fixed-camera controls (tank / camera-relative) | F1 cycles | — |

## What happens, in order

1. **The drive:** no flash any more. Norah's radio is reading out missing persons reports. She says: "Missing? Since this afternoon?" and "I hope Adaline is safe."
2. **Arrival:** she drives in through the cul-de-sac and up the gravel lane, and parks at your marker. Her headlights point straight at Louis, crouched at the treeline; an extra light makes sure he reads as a human shape on all fours.
3. **The walk:** you control Norah up the gravel and stepping stones (CAM_01, then CAM_02).
4. **The freeze** at your marker (a cutscene):
   - CAM_03 holds over her shoulder on Louis for five seconds.
   - CAM_04 cuts to her face, uncomfortably close, as the headlights die. She flinches toward the car and the camera stays on her.
   - CAM_05 watches the dark for three silent seconds, then Louis shrieks and leaps straight at the camera.
5. **The sprint:** he lands between her and the car, gets up and comes after her (CAM_06). She reaches the porch and gets inside.
6. **Inside:**
   - Louis pounds on the door until she pushes the **bookshelf** across it.
   - He circles the house.
   - She gets the revolver from the **lockbox under her bed**. The code is Addie's birthday, 6-1-2: circled in Addie's crayon on the kitchen calendar, and mentioned in Norah's journal on the kitchen table.
7. **Her car:** you no longer see Louis wreck it. She finds it smashed when she goes out after the fight ("Louis... while I was inside.").
8. **The bedroom window:** scratching at the glass. She pushes the **wardrobe** over the window. Once it's moved, searching the wardrobe gives **5 bullets**.
9. **The crash:**
   - Louis comes through the window and the wardrobe, and lands on her bed for two seconds.
   - Then the **combat tutorial** screen appears.
   - Then the **fight**, anywhere in the closed-up house. Louis dies after **3 hits**.
10. **The broadcast:** the TV turns itself on and we see it in first person, right up against the screen. The alert text appears on the TV itself, and the siren keeps looping from the set after the broadcast ends.
11. **The phone is dead.** She gathers the flashlight (kitchen counter) and the batteries (the other counter), then puts the batteries in the flashlight from the items screen.
12. **Outside (free roam):**
   - Her car is done, so she needs **Louis's truck**. The truck is locked.
   - Louis's house: the front door is torn in half, and it's dark inside, so you need the flashlight.
   - The **desk** has his journal. Reading it in FILES reveals the safe code; the third page adds it to KEYS.
   - Behind the **toilet** is his rosary. The **wardrobe** has a half-charged battery.
   - **Upstairs** (the block you drew off to the side): walk up the stairs. They're a real climb now, and the fade happens at the top. the **fridge** has his pills, which heal. The **safe** (3-1-6) holds the truck keys and a photo. The bed is torn and scorched, and the open window has footprints going out.
13. **The road out** in his truck: down his dirt drive and around the cul-de-sac. **The Pruitts' house is on fire** as she drives past, with screams and a cut to the flames. Then out to the highway, the refuge signs, the chapel turn, and the end cards.

There are distant screams now and then whenever she's outside.

## New in v10

- **Searchable things glow softly**, and a small **E** floats over the one she'd use. The "Press E to search" text is gone.
- **Searching has an animation:** Norah leans into the drawer or shelf and rummages, or kneels at low drawers.
- **Doors** take a moment. One E press eases a door open quietly; pressing E again smashes it. Open doors are solid.
- **The revolver** can be aimed, fired and reloaded any time she has it, not only in the fight.
- **New and stronger animations:**
  - a proper sprint, with forward lean, high knees and arms pumping
  - the shove: load, drive and follow-through
  - the dodge: a drop and sideways throw, with her arm covering her head
  - reloading: the cylinder swings out, the empties tip out, she thumbs in each round and flicks it shut
  - recoil on firing, and a stumble when she's hit
  - Louis now has a close-range rake with his blade arm
- **Norah sits properly** on the car and truck seats.
- **Both vehicles are solid.** She can't walk over them.
- **The truck has its own camera** (CAM_Truck): low and off the driver's side, so walking up to the door is easy. The truck door is easier to use from a wider spot.
- **Floors and roads no longer shimmer or flicker.** I flattened the texture warping on all floors, roads and grass, and spaced out the overlapping surfaces.
- **Cameras:**
  - Louis's bathroom camera (CAM_15) was moved and widened so it follows her.
  - After the fight, the yard around Norah's house uses a high tracking crane shot (CAM_Crane).
- **The neighbourhood is sparser:** four houses, each like Norah's or Louis's, with long bending driveways, mailboxes, and trees all around.

## The revolver (v10.1)

- **Heavy recoil:**
  - Each shot throws Norah's arms up past her eyeline and rocks her back half a step.
  - The screen shakes hard, and the muzzle flash lights up the room for a moment.
- **A pause between shots (about 1.15 s):**
  - She wrestles the gun back onto the target, then thumbs the hammer back.
  - The click of the hammer is your cue that she can fire again. Pressing fire before then does nothing.
- **Hits land hard:**
  - Every hit freezes the action for a split second.
  - Louis is lifted off his knuckles and thrown back about a metre, with a spray of dark blood. He stays out of action for about a second before he can come at her again.
  - The killing shot holds the freeze longer, drops into slow motion, and throws him back before he falls.

## Combat

- **Louis's ACROSS form** is slower and less lethal than the prologue's ACROSS.
  - He knuckle-walks toward her.
  - He **rears up** (the tell) and then pounces. That's 22 damage if it lands; his swipe up close does 10.
  - A dodge makes the pounce miss and leaves him **recovering**, which is the time to shoot.
  - A shove staggers him but barely hurts.
  - Three bullet hits kill him.
- **Ammo:**
  - 5 in the revolver.
  - 2 in Addie's dresser.
  - 5 in the wardrobe once it's been pushed (searchable during the fight too, after it falls).
- **Norah's health** shows in the items screen as FINE, CAUTION or DANGER. If it runs out, you restart at the last checkpoint.

## Found clues (shown full screen, like Resident Evil, and kept in FILES)

Norah no longer narrates who Louis was. The photos and journals tell it. Every photo carries a short note in Norah's own voice, and no photo shows a date.

- **Photos** (rendered with the real character models in different clothes and hair; Louis is a big, older man in all of them):
  - **Addie's birthday:** "She blew the candles out twice, because the first time didn't count."
  - **Her first day of kindergarten:** "She made me promise not to cry at the door. I lied."
  - **Kenneth and Addie at Lake Ruth.**
  - **Christmas morning with Norah:** "Addie was up at five, which meant I was up at five."
  - **Louis and Rose outside the chapel,** on the wall of his house.
  - **After the storm, by his front door:** "Me and Louis fixing up his porch after that storm, all those years back..."
  - **Louis and Addie with hammers on the new porch step,** in his safe.
- **Norah's journal:** Addie's week, Pickle, work, Louis finishing the step with Addie "helping", and the lockbox code.
- **Louis's journal:**
  - prayers for Rose
  - a prayer for the girls next door
  - the truck keys kept in the safe under Rose's verse
  - his last entry, about the mark burning on his back.
- **The rosary:** "Rose's. For keeping."
- **Rebuilt for this version:** Louis's ACROSS form is now on a bigger frame, to match the man in the photos.

## The map and cameras

- **The world** is generated by `tools/build_ch1_map.py` from `data/maps/ch1_map.json`. Your designer shapes, colours and textures carry over as drawn.
- **Added on top of your map:**
  - roofs on every house, and a second storey on Louis's
  - Adaline's pink wallpaper
  - Louis's torn, bloodied walls
  - smooth roads following your dirt and gravel
  - four houses around your cul-de-sac with long driveways and trees (one is the Pruitts', which burns as she drives out), plus a small green in the middle of the ring
  - Norah's detailed sedan and Louis's rusty pickup in place of the two sedan props
- **Cameras:**
  - All twenty are used where you placed them. Tracking cameras turn to follow her, within your turn limits.
  - Besides CAM_Truck and CAM_Crane, no cameras were added. I widened some trigger zones so every walkable spot has one; the list is `ZONE_EDIT` in `tools/build_ch1_map.py`.
  - CAM_09 faced the bathroom wall from half a metre away, so I turned it around to look into the room.
  - The truck yard uses the new CAM_Truck.
  - After the fight, the yard around Norah's house uses CAM_Crane.
- **To import a new map:** replace `data/maps/ch1_map.json`, then run `python3 tools/build_ch1_map.py`.

## Rebuilding the photos

1. Run `tests/photo_studio.tscn`. It stages the photos with the character models and renders them.
2. Run `python3 tools/frame_photos.py`. It frames them as instant photos.

The photo cast lives in `assets/characters/photo/`, built by `tools/build_characters.py`.

## Known rough edges

- **Louis's pathing:** he finds his way room to room with a simple graph, so he can clip furniture.
- **The stairs:** she climbs Louis's stairs, then a short fade takes her to the upstairs block, because the block sits off to the side on your map.
- **Open doors are solid,** so a door swung against a wall can narrow a hallway.
- **Louis's leap** at CAM_05 is very fast and dark by design. Tell me if it should be more readable.
- **Performance** was only tested on a software renderer.
