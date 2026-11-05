# Chapter One: Norah (v14, built from your map)

The chapter is now built straight from your Map Designer file, using your layout, your twenty cameras and your notes. It runs from the drive home to the CHAPTER TWO: THE OLD CHAPEL card.

**Run it:** open `scenes/chapter1/chapter1.tscn` and press **F6**.
**Restart from the top:** F5 while playing.
**Jump ahead** (Project Settings → Run → Main Run Args, after `--`): `start=walk | sprint | inside | wardrobe | duel | after | louis | road`. Add `autoplay` to make it play itself.

## Controls

| Action | Keyboard / mouse | Pad |
|---|---|---|
| Move | WASD / arrows (tank controls) | Left stick |
| Run | Shift | B |
| Interact / next page | E or Space | A |
| Open a door | E once eases it open quietly; press E again while it opens to smash through (loud) | A |
| Items screen | Tab or I | Back |
| **Aim** (any time she has the revolver; feet planted, auto-aims at the nearest threat) | C or right mouse | LB |
| **Fire** (while aiming) | F or left mouse | RB |
| **Reload** | R | X |
| **Shove** (melee) | V or middle mouse | Y |
| **Dodge** | While aiming, tap Shift plus a direction (back if none) | While aiming, B |
| Heal | Tab → select the pills → E → Use (the game pauses while the items screen is open) | Back → A |

## What happens, in order

1. **The drive:** no flash any more. Norah's radio is reading out missing persons reports. She says: "Missing? Since this afternoon?" and "I hope Adaline is safe."
2. **Arrival:** she drives in through the cul-de-sac and up the gravel lane, and parks at your marker. Her headlights point straight at Louis, crouched at the treeline; an extra light makes sure he reads as a human shape on all fours.
3. **The walk:** you control Norah up the gravel and stepping stones (CAM_01, then CAM_02).
4. **The freeze** at your marker (a cutscene):
   - CAM_03 holds over her shoulder on Louis for five seconds.
   - CAM_04 cuts to her face, uncomfortably close, as the headlights die. She flinches toward the car and the camera stays on her.
   - CAM_05 watches the dark: only his burned-in shape, gone and back, nearer each time.
5. **The sprint and the strike:** she runs for the house in the dark. As she reaches it he walks out of the black beside her and swings; she ducks and rolls, and his fist goes into the wall. He follows her, slowly.
6. **Inside:**
   - Louis pounds on the door until she pushes the **bookshelf** across it.
   - He circles the house.
   - She gets the revolver from the **lockbox under her bed**. The code is Addie's birthday, 6-1-2: circled in Addie's crayon on the kitchen calendar, and mentioned in Norah's journal on the kitchen table.
7. **Her car:** you no longer see Louis wreck it. She finds it smashed when she goes out after the fight ("Louis... while I was inside.").
8. **The bedroom window:** scratching at the glass. She starts pushing the **wardrobe** across the window, and the scrape of it is what brings him:
   - A third of the way across, the scratching outside stops dead.
   - A heavy thud on the wall beside the glass: she freezes and the wardrobe snags for a breath.
9. **The crash (cutscene):**
   - He dives through the window headfirst, flat out, through the opening itself, not the wall.
   - He clips the half-pushed wardrobe, and it goes over along the wall, right where she was standing. She's thrown onto her back clear of it.
   - He lands across her bed.
   - A low shot from the floor behind her head looks past her at him, steaming on the bed.
   - Then the **combat tutorial** screen (once; not again after a death).
   - She scrambles up, and he climbs down off the bed. Then the **fight**, anywhere in the closed-up house.
   - The 5 rounds that were in the wardrobe spill out in front of its doors. You can grab them mid-fight.
10. **The broadcast:** the TV turns itself on and we see it in first person, right up against the screen. The alert text appears on the TV itself, and the siren keeps looping from the set after the broadcast ends.
11. **The phone is dead.** She gathers the flashlight (kitchen counter) and the batteries (the other counter), then puts the batteries in the flashlight from the items screen.
12. **Outside (free roam):**
   - Her car is done, so she needs **Louis's truck**. The truck is locked.
   - Louis's house: the front door is torn in half, and it's dark inside, so you need the flashlight.
   - The **desk** has his journal. Reading it in FILES reveals the safe code; the third page adds it to KEYS.
   - Behind the **toilet** is his rosary. The **wardrobe** has a half-charged battery.
   - **Upstairs** (the block you drew off to the side): walk up the stairs. They're a real climb now, and the fade happens at the top. The **fridge** has his pills, which heal. The **safe** (3-1-6) holds the truck keys and a photo. The bed is torn and scorched, and the open window has footprints going out.
13. **The road out** in his truck: down his dirt drive and around the cul-de-sac. **The Pruitts' house is on fire** as she drives past, with screams and a cut to the flames. Then out to the highway, the refuge signs, the chapel turn, and the end cards.

There are distant screams now and then whenever she's outside.

## New in v14 (Nov 4): Louis, the stalker

**The idea:** Louis is a Brute. Norah doesn't have the bullets to kill one at the start. In the house fight he only goes down; he looks dead, and the story plays at its normal pace. While she watches the broadcast he gets up and leaves. From then on he hunts her through the rest of the chapter.

### His health
- **Two pools:** what puts him down in one fight (8), and what he has across the whole night (26).
  - The house fight takes him to the floor and can't kill him: even all twelve rounds as head shots come to 24.
  - Each time he gets back up, he goes down again after another 6.
- **Damage carries over:** lost limbs stay lost, and his total keeps going down. Empty it and he's dead for good.
- **Ammo for a determined player:** the 2 in Addie's dresser, the 5 from the wardrobe, and **4 new rounds in Louis's safe**. That's enough to finish him with good aim, but not with careless shooting.

### The story beats
1. **The fight** ends with him on the floor, as before: the body beat, "It's still smoking", the cardigan.
2. **The broadcast** plays where it always did. While she's facing the TV, he goes.
3. **She turns back:** over her shoulder, the floor where he lay, a dark pool and a smear dragging off toward the bedroom and the broken window. "No. No, no—" / "He was dead. I watched him go down."
4. **Flashlight and batteries:** when she has both, heavy footsteps on the gravel outside along the kitchen wall, going away, and a low sound from the dark. "He's still out there."
5. **At her wrecked car:** he's standing at the edge of the trees, looking at her (a reveal shot over her shoulder). "I shot you. I watched you go down." / "Stay away from me!" Then he comes. If she never goes near her car, he finds her after about 45 seconds outside anyway.
6. **The hunt (free roam):** see "How he hunts" below.
7. **Louis's safe:** keys in her hand, something lands on the porch roof, and he dives in through the upstairs bedroom window (the open one with the footprints going out), the same way he left. "LOUIS—!" / "The truck. Get to the truck!" When she gets down the stairs, he's only a few seconds behind.
8. **The truck:** the engine catches, and he walks out of the dark into the headlights, shrieks and charges. He hits the hood, right in her windshield. "GET OFF!" She floors it, and he's thrown off into the dark. Then the road out, as before.

### How he hunts
- **Speed:** about her walking pace outdoors. She can outrun him; she can't stroll.
- **Doors:** he smashes through shut ones.
- **Her scripted moments** (reading a document, a pickup, a cutscene) pause him.
- **Losing her:** if she gets more than 32 m away, or onto a different floor, he loses her and fades back into the dark. 30-45 seconds later he comes back from somewhere off-camera, 11-17 m from her, never from inside her house.
- **Knocked down:** he lies there for 13 seconds. If she's still within 14 m, he pushes himself up and comes on. Otherwise he's gone, and returns later.
- **Music:** the chase music plays when he's within 14 m, the stalking bed farther out, and silence once he's lost her.

### If she kills him
- He goes down for good. "...I'm sorry, Louis."
- Something glints beside him: **Rose's wedding band**, on the snapped chain he wore it on.
  - Its description: gold, worn thin, a small garnet, engraved inside "L. & R. Forever."
  - It's a **treasure**, worth about **$1,800**.
- The truck finale doesn't happen; she just drives away.

### Treasures
- The items screen has a fourth tab, **VALUABLES**: things with no use except what they'd fetch, to sell to a trader in a later chapter.
- Each shows its value.
- The ring is the first.

### Tests
The self-playing run stands and fights the stalker when he's within 7 m and she has rounds. Otherwise it keeps walking its route, and he follows. To make sure the run reaches the end, it takes about a third of his damage.

## New in v13 (Nov 4): the window crash and cutscenes that respect the world

### The window crash
See steps 8 and 9 above.

- **Checkpoint:** a death in the fight restarts with him on the bed and her on the floor. The tutorial is skipped the second time.

### Nothing walks through walls any more
- **Everyone in a cutscene or walking a scripted path** now moves with a body-sized capsule swept through the world. They stop at, or slide along, walls, furniture, doors, cars and Norah, instead of passing through. This covers:
  - Louis, the prologue crowd and the ACROSS
  - every scripted throw, roll and lunge
- **Louis no longer forces his way through obstacles** when he's boxed in. He pushes along whatever is in the way.
- **A scripted walk that gets wedged** logs `[actor] … blocked` with where it got stuck, so bad paths show up in test runs.
  - The prologue's escape had one: Rachel ran into the car parked across the entrance.
  - The crowd now leaves up the clear lane between the cars, and the lot creatures go round them too.
- **Cutscene cameras:** on every cut, a camera that starts inside a wall or a piece of furniture is moved forward into the clear, and one with a wall pressed against its lens is moved to the open side. Cars don't count, because the in-car shots sit inside them on purpose.
- **New check:** `tests/probe_grid.gd` prints a map of where a body can stand, for checking paths. Run it with `--script tests/probe_grid.gd -- x0 x1 z0 z1 step` and an optional `scene=`.

### The drive and the drive-out
- **Norah's head poked through the car roof**, and the truck's. She now sits lower in both.
- **The truck's cab was one solid block,** so from inside you saw straight out through it. It now has a dark lining with the windshield and windows cut through.
- **Two new shots** replace the single camera on the windshield, which made her hands huge:
  - her profile from the passenger seat, with her hands on the wheel
  - over the dash, out at the road
- **The cut follows the voice:**
  - her lines on her
  - the car radio's lines on the radio and the dark road, with one outside shot of the car between
  - "That's the Pruitts' place—" over the burning house, from a spot on the road with a clear view of it
  - the hand-painted sign's line on the sign

### Smaller fixes
- **The compass** hides whenever a scripted camera is up.
- **Louis's steam:** soft fading puffs instead of hard grey squares.
- **Prologue, Marcus:** his introduction plays once. After that he has a one-line follow-up, so it no longer repeats in full.
- **Prologue, back seat:** when Adaline talks to the man beside her ("Mister... your shoulder's smoking"), a new shot between the front seats shows both of them. It used to crop his head off.

## New in v12 (Nov 3): pause menu, lockbox dial, camera and HUD polish

### Pause menu (Esc, P, or pad Start)

- Pages: **Resume, Controls, Settings, Restart from checkpoint, Quit.**
- **Controls** lists every binding for keyboard and pad.
- **Settings:** screen style, mouse speed, invert look, controller look speed. They're saved between sessions (`user://settings.cfg`).
- The game, dialogue and timers all freeze while it's open. It works in the prologue too.
- Esc no longer frees the mouse in the middle of play. It opens the menu instead.

### Lockbox and safe dials

- The code entry is now **brass tumblers**: up and down turn the selected wheel, left and right move between wheels, and E tries the code. With the mouse, click the top or bottom half of a wheel to turn it, then click OPEN.
- A correct code gets a short beat, then the lock sound.

### Cameras

- **The dodge quick time event:** a miss now cuts to a low, lit shot of Norah falling, before YOU DIED.
- **After the fight**, the shot of Louis's body is taken from beside the two of them, and chooses whichever side has room. It's no longer from behind her head, where her hair filled half the frame.
- **The wardrobe and bookshelf pushes** use a side camera that shows both her and the furniture. A **PUSH!** meter fills as you tap.
- **Over-the-shoulder camera:**
  - If a wall is jammed against her right shoulder, or something solid sits right in front of the lens (a door folded back beside her, the toppled wardrobe), it eases over to her left shoulder.
  - A final check from her head to the lens pulls the camera in front of anything it slid behind. Before this, the fight could end with the screen filled by a wall of wood.
- **Aim assist:** pressing aim swings the view onto the nearest threat within about 35 degrees and 9 m.

### HUD

- **The objective panel** wraps long objectives and sizes itself to the text. It hides during cutscenes.
- **Captions** rise above the prompt line, so they no longer sit on top of the ammo count. Short captions get a box that fits the text, instead of a bar across the whole screen.
- Reloading while aiming no longer shows "Reloaded: 5 / 5."; the Rounds line under the reticle already shows the count.
- **The floating E** over searchable things hides during scripted cameras and dialogue, and when the camera is right on top of it. A huge "E" used to fill the screen during the wardrobe push.

### Prologue

- The community-centre dome light is dimmed. It was blowing out the room.

### Testing

- New checks:
  - `tests/dial_check.tscn -- start=inside`
  - `tests/pause_check.tscn -- start=inside`
  - `tests/qte_check.tscn -- start=sprint [press]`
- Add `stop=<phase>` to any run to quit when that phase starts. For example, `start=wardrobe stop=after autoplay` plays just the fight.

## New in v11 (Nov 2): the items screen, UI fixes, doors, Louis's pathing

### The items screen (Tab / I / pad Back)

- **The game pauses** while it's open, and while a document, a pickup card, the combat tutorial or the lockbox dial is up. Louis can't hit her while she's in her items.
- **Layout:**
  - Tabs along the top: ITEMS, KEYS, FILES.
  - Left: Norah's status card. It has a heart trace that speeds up and turns amber or red as she gets hurt, the revolver's five chambers, spare rounds and the flashlight's charge.
  - Right: the selected thing, turning in 3D, with its name and description.
  - Bottom: a grid of 12 slots with icons and counts. The revolver slot shows how many are loaded.
  - Footer: the controls for what's selected, and a line saying what the last action did ("Loaded 3. 5 / 5 in the cylinder.").
- **E on an item opens a small menu** with only the actions that make sense:
  - Pills: Use.
  - Rounds: Load into revolver. Revolver: Reload.
  - Batteries: Put in flashlight. The half-charged battery now works in the dead flashlight too.
  - Inspect (the full-screen 3D view) and Combine (pick the second item, then E again).
- **KEYS** has its own icons: the house keys, the two codes and the truck keys.
- **FILES** is a two-column list. The right side previews the first lines and how many pages there are.
- **Controls:**

| Action | Keyboard / mouse | Pad |
|---|---|---|
| Move the cursor | Arrows / WASD, or hover | D-pad / left stick |
| Choose | E or Space, or left click | A |
| Inspect | X | Y |
| Switch tab | Q / R, mouse wheel, or click a tab | LB / RB |
| Back out (menu, combine, screen) | Esc or Backspace, or right click | B |
| Close | Tab / I | Back |

- Documents and pickup cards also close on Esc or a click.

### Other UI fixes

- **The dialogue box** no longer leaves room for the portraits that were removed. The speaker's name sits on a tab on the box's top edge (left for Kenneth and Norah, right for everyone else), and the text uses the full width. This applies to the prologue too.
- **Captions** move up above the dialogue box while it's showing, instead of overlapping it.
- **The objective panel, compass, captions, prompt and reticle** step back while a menu or document is up, so nothing shows through the items screen any more.

### Doors and Louis

- **Doors swing into the roomier side** (into a room rather than across a hallway) and fold back as far as the wall allows, up to about 110 degrees. An open door no longer narrows a corridor.
- **Louis steers around furniture.**
  - His line-of-sight checks now cover his width and knee height.
  - When something is in his way, he picks the nearest open heading.
  - If he's boxed in for more than a moment, he shoulders through rather than freezing.

### The dodge at the house (quick time event, Nov 3)

- When Louis swings at Norah outside the house, the action drops to slow motion and **DODGE!** appears low in the middle of the screen with **E** (or **A** on a pad). A ring shows the time left, about a second and a quarter.
- **One press** is all it takes. A press from before the prompt appears doesn't count.
- **Pressed in time:** she ducks and rolls clear, and his fist goes into the wall.
- **Too slow:** the arm takes her full in the chest and pins her to the house. She dies (YOU DIED) and the chapter restarts from the sprint, just before the strike.
- The self-playing test always hits it.
- Test: `tests/qte_check.tscn -- start=sprint` (miss) or `-- start=sprint press` (hit).

### Prologue

- **Fixed the self-playing test stalling at "Go inside".** In over-the-shoulder mode the autopilot's steering was being ignored. It now drives Kenneth while the camera follows. This only affected the automatic test run, not normal play.

### Tested

- The prologue and Chapter One both play through to the end by themselves with no script errors.
- A separate check of the items screen confirms the game pauses while it's open and unpauses on close, and that reload and battery combining work.

## New in v10

- **Searchable things glow softly**, and a small **E** floats over the one she'd use. The "Press E to search" text is gone.
- **Searching has an animation:** Norah leans into the drawer or shelf and rummages, or kneels at low drawers.
- **Doors** take a moment. One E press eases a door open quietly; pressing E again smashes it. Open doors are solid; since v11 they swing into the roomier side and fold back.
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
  - Louis is thrown back with a spray of dark blood, and stays out of action for a moment before he can come at her again.
  - The killing shot holds the freeze longer, drops into slow motion, and throws him back before he falls.

## Combat

See `claude/combat-design.md` for Louis's current form, location-based damage and crippling.

- **Ammo:**
  - 5 in the revolver.
  - 2 in Addie's dresser.
  - 5 that spill out of the wardrobe when it falls (search it during or after the fight).
- **Norah's health** shows in the items screen as FINE, CAUTION or DANGER, with the heart trace. If it runs out, you restart at the last checkpoint.

## Found clues (shown full screen, like Resident Evil, and kept in FILES)

Norah no longer narrates who Louis was. The photos and journals tell it. Every photo carries a short note in Norah's own voice, and no photo shows a date.

- **Photos** (rendered with the real character models in different clothes and hair):
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

## Testing

- `tests/ui_check.tscn` (run with `-- start=louis`) drives the items screen with simulated key presses and saves `tests/captures/ui_*.png`.
- `tests/door_check.tscn` prints which way every door in the chapter opens.
- `tests/playthrough.tscn -- autoplay` plays the prologue by itself.

## Known rough edges

- **The stairs:** she climbs Louis's stairs, then a short fade takes her to the upstairs block, because the block sits off to the side on your map. A real staircase needs the map changed.
- **Performance** was only tested on a software renderer.
