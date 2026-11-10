# Tools

## Combat Playground (https://claude.ai/artifact/FzEykM1KVDwwpKjrgcwXzv) — v2, Nov 4 (now v14)

A browser sandbox for testing combat outside the game code, playable on the Chromebook. It re-implements the rules in combat-design.md rather than running the Godot scripts, so values tuned here have to be carried into the game by hand ("Copy changed values" gives the JSON).

- **Fighting:**
  - **Norah:** aim with feet planted, a 5-chamber revolver with a hammer delay, per-round reload, shove, dodge roll with i-frames, stumbling when hit.
  - **Enemies:**
    - ACROSS: erratic quadruped with a lunge.
    - Louis (Brute): haymaker; rake once the big arm is gone; no flinch mid-swing except from a head shot, a leg shot or losing a limb.
    - Dummy: Brute stats, no AI.
  - **Hit zones and crippling:** limbs blow off at the joint above the hit; one leg gone means dragging, both means crawling.
- **Repeatable tests:**
  - **Scenarios:** 9, seeded so each run plays out the same way. Louis in the open; Louis at 2 m with 2 bullets; Louis in the bedroom; hold the door; 3 ACROSS in a corridor; Louis + 2 ACROSS; no bullets; chapel with 5 ACROSS; the imported map's own markers.
  - **Ammo budget mode:** the Chapter One supply, 5 loaded + 7 spare.
  - **Run stats:** time, shots, accuracy, head shots, limbs taken, damage taken, dodges and how many saved her, shoves, ammo left. A result card shows at the end, and the last 20 runs are kept in a table you can copy.
- **Seeing what's happening:**
  - **Overlays:** attack reach rings (yellow while winding up, red on the hit frame), the aim-assist cone, a dodge timeline marking where an attack landed, and a log of every attack check.
  - **Time controls:** pause (P), step one frame (.), slow motion (T).
  - **Replay:** the last 10 seconds, from a free camera (Y).
- **Matching the game:**
  - **Camera modes:** over the shoulder; fixed cameras with tank controls; fixed cameras with camera-relative movement that keeps its heading through a cut. In the fixed modes, aiming auto-targets and W/S aims high or low.
  - **Rooms:** open arena; Norah's house (bedroom + living room); corridor with side rooms; chapel nave.
  - **Map Designer import:** walls with door and window openings, floors, stages, furniture-sized props, cameras, lights and spawn/enemy markers.
  - **Doors:** E opens, slams and closes them. Louis bashes a closed door (3 hits) and the ACROSS scratch at it. Wardrobes, bookshelves and crates are pushed with E presses.
  - **Pathing:** enemies route through doorways.
  - **Sound:** all synthesized. Shot, hammer click, reload, Louis's wind-up grunt and footsteps, the ACROSS shriek and chitter, flesh and limb hits, doors.
- **Quality of life:**
  - **Saved settings:** named slots for the whole panel.
  - **Controller:** sticks, LT/RT aim and fire, X/Y/B/A, Start pause, Back replay.
  - **Touch:** a stick and buttons.
- **Tested:** since v14 (Nov 5), headless against the real three.js r128 with software WebGL, so Claude can screenshot it. three.js is fetched by a sparse git clone of mrdoob/three.js at tag r128, because the CDN and npm are blocked here. The game repo is github.com/owarends-commits/Games (`crossed/`).
- **Not yet in it:** accurate character models, a notes section, BCROSS variants other than the Brute, CCROSS, bosses, and an attack for a legless ACROSS.

### v14 polish (Nov 5)
- **Norah's model:** the user chose to keep the playground's box Norah. `norah.glb` from the repo was tried and then removed.
- **Settings panel:**
  - **Tabs:** Play, Norah, Enemies, Stealth, World. Within each, sections are smaller (for example ACROSS movement, attacks, grabs, and body & wounds). The first section of a tab starts open and the rest are collapsed.
  - **Search:** "Find a setting…" filters every tab.
  - **Reset:** double-click a slider's label to put it back to its default.
  - **Remembered:** the open tab and sections.
  - **Narrow screens:** the panel starts hidden below 1100 px wide.
- **HUD:**
  - **Log:** 5 lines that fade after about 5 s. A scenario load no longer spams "Spawned …".
  - **Run stats line:** smaller and dimmer.
  - **Live enemy list:** moved to World → Time & debugging.
- **Lighting:**
  - **Lighting strength slider:** default 1.6. It scales the ambient, moon and room lights, but not the stealth light values.
  - **Fill light:** a soft light above Norah so she reads.
  - **Fog:** 0.045 → 0.03.
  - **Flashlight:** on L, adding +0.3 to her visibility.
- **Frame rate:**
  - **Merged meshes:** body boxes on the same joint are merged into one mesh, so draw calls drop from about 600–900 to 250–360 in the busy scenarios.
  - **Particles:** blood pools, sprays and brand smoke are instanced (one draw call each, no per-puff allocation), which fixes a geometry leak from the smoke.
  - **HUD updates:** only when text changes.
  - **Readout:** optional, under World → Look.
- **ACROSS movement, calmer by default:**
  - **Sliders:** turn 520 → 300 °/s, heading wander 0.8 → 0.35, bursts 0.8–1.7 s, stalls 0.2–0.5 s, and they shuffle at 30% speed during a stall instead of stopping dead. Trips 0.4 → 0.22, falling after a lunge 0.4 → 0.3, jerkiness 1.0 → 0.5.
  - **Smoothing:** heading wander now eases in and retargets every 0.35–0.95 s. Body twitch retargets every 0.15–0.6 s and eases in more slowly.
- **Settings storage:** only values that differ from the defaults are saved. A one-time v14 migration resets the changed ACROSS movement values and the fog for existing browsers.
- **Camera:** the shoulder offset shrinks when a wall is on that side, and the lens stays 0.25 m off walls. The clinic scenario now starts inside the hallway (z 3.1), not in the entrance.
- **Push:** checked against v13. Shove, furniture push (E) and the grab push-off behave the same.

## Map Designer (https://claude.ai/artifact/7jF5UaMLE7bqX1BqxHfUhk)

Lay out maps in plan or 3D: walls, floors, props, cameras with trigger zones, lights and notes for Claude.

### Version 6 (Oct 27)
- **Default start: the chapel.** This is the user's "Sample cabin" export (kept in `data/maps/exports/`), with everything their notes asked for. Built by `tools/make_default_chapel.py`.
  - **Walls:** worn white boards inside, ruined white boards outside.
  - **Stairs:** both flights are concrete, and the second one goes down to a new dark Basement (with a few searchable things in it).
  - **Bellemood:** the figure on the stage.
  - **Stage:** 0.6 m, at the head of the chapel, with steps at both front corners. The altar and the Mass things sit on it.
  - **Roofs and ceiling:** a ceiling and a gable roof over the chapel, and a shed roof over the upstairs room.
  - **On first open:** if the browser's autosave holds only their original objects, the chapel opens in its place (Undo brings the old copy back). Otherwise their map is kept, and MAP → "Load the default chapel" loads it.
- **Textures:** the game's own textures are embedded (`designer_library.py`), 132 in all.
  - **md:** the designer basics in their game versions.
  - **v11:** woods, tiles, ground, exteriors.
  - **v12:** church, office, graveyard, plants, fabrics, storage, and the whitewash set.
  - **Size:** some textures cover more than a metre (`assets/textures/v12/sizes.json`). `whitewash_ruined` spans 8 × 2.5 m, so its 3–4 torn sections don't repeat often.
- **Asset library:** 206 assets in `tools/designer_library.py`, which also writes `data/maps/designer_assets.json` for the game. The old ones were rebuilt with textures and more detail.
  - **Categories:** indoor, storage (searchable), church, Mass and altar items, office, outdoor, shrubs and flowers (dead ones too), graveyard.
  - **Browsing:** there's a search box and collapsible groups.
  - **SEARCH tag:** Norah can search the asset. Props get "Searchable" and "What's inside", the plan marks them with a gold magnifier, and the export lists them.
  - **LIGHT tag:** the asset glows (lamps, candles, the cemetery lamp post, the grave lantern, church sconce, pendant, chandelier, candelabra, and the red sanctuary lamp). It lights the 3D view and becomes an OmniLight in the game.
- **New tools:**
  - **Stage / platform (P):** height, top and side textures, and sets of steps on any edge. The open edges are a ledge.
  - **Ceiling (I):** has a height.
  - **Roof (O):** gable, hip, shed or flat, with pitch, ridge direction or high side, overhang and gable-end texture. In the plan, roofs and ceilings are picked by their outline; the 3D view has a "Roofs & ceilings" toggle.
  - **Quick roofs and ceilings:** a selected floor, or several selected walls, has "Add roof / ceiling over this".
- **Stairs:**
  - **Up or down:** "Goes to" can pick a basement. The floor they start on gets the hole.
  - **Texture:** stairs have their own texture setting.
  - **Shortcut:** "Make them go down to a new basement".
- **Levels:** levels can be marked "Dark (no light)". The 3D view then shows them dimmed, and the export lists them.
- **Walls:** the inspector now names the face that actually looks into the room. The Room tool winds walls so face A is inside; it used to put the outside texture on the inside.
- **Bellemood figure:** a stand-in for the CROSS (see character-model-notes).

### Floors and basements (v5)
- **Floor stack:** top right of the view, with **+ Floor** and **+ Basement**. Switch floors with PageUp / PageDown or `[` / `]`.
- **OTHER FLOORS:** controls the ghosting in the plan.
- **3D cutaway:** hides the floors above the one you're editing.
- **Copy walls:** in the MAP tab.

**Game side:** `tools/build_ch1_map.py`.
- **Levels:** walls, floors and props sit at their level's elevation, and upper floors get collision.
- **Stairs:** up or down, textured, with a walkable ramp. Stairwell holes are cut.
- **Stages:** box plus collision, with steps that have ramps.
- **Ceilings:** built from the map.
- **Roofs:** written as .obj files in `assets/meshes/designer_roofs`.
- **Lamps:** asset lights become OmniLights. Chapter One's hand-lit lamp, nightstand and streetlight stay as they were unless set lit.
- **Searchables:** they get Marker3Ds under Map/Searchables.
- **Textures:** they resolve from md, then v11, then v12.

### The ledge drop (game)
- **The rule:** any drop of more than 0.45 m (`stun_drop` in `player.gd`) ends in a hard landing.
- **The animations:** Norah's `airborne` pose while falling, then `land_hard`: a crouch with a hand to the floor and a woozy beat.
- **The stun:** controls are locked for about 0.9–1.4 s, with a thud and a small shake.
- **Steps:** walking down steps never triggers it.
- **Test:** `tests/ledge_drop.tscn`.

## Item Modeler (https://claude.ai/artifact/AsEEzP48H6wrtQ46HVig25)

A 3D tool for the items Norah finds.

- **Starter items:** all 12 Chapter One items: flashlight (and the dead one), D batteries, half battery, revolver, .38 rounds, pills, rosary, house keys, truck keys, journal, photo.
- **Shapes:** box, cylinder, cone, sphere, ring, tube, wedge, card/paper and capsule.
- **Editing:** move / rotate / size gizmo (W/E/R) with snapping, multi-select (Shift), duplicate, mirror, delete, sizes in cm, a hand for scale.
- **Surfaces:** finishes (matte / metal / glossy / glass / glow), 20 built-in item textures, a pixel painter, picture import.
- **Pins:** PIN NOTE (P): a **note for Claude** or an **examine point** (text the player reads).
- **PLAYER VIEW:** previews the inspection. "Save this pose" sets how the item first faces the player.
- **Saving:** undo/redo, autosave, "Send to Claude" downloads JSON.

### In the game (added Oct 27, from the user's export of 17:34)
- **Import:** `python3 tools/import_items.py <export.json>`, then Godot `--import`.
  - It writes `data/items/items.json` and bakes the textures to `assets/textures/items/`.
  - It prints any "notes for Claude".
- **Builder:** `scripts/items/item_models.gd` (`ItemModels`), with the shaders `ps1_item` and `ps1_item_glass`.
- **Viewer:** `scripts/ui/item_viewer.gd` (`ItemViewer`).
  - Arrows turn the item, Shift+Up/Down zooms, and the mouse drags.
  - X (pad Y) steps through the examine points.
- **Where it shows:** the pickup card, the items screen preview (ITEMS / KEYS / FILES), and the X inspect view.
- **Photos and Louis's journal:** photos use the photo model with the real picture printed on it. Louis's journal is the journal model with a black leather cover.
- **Text:** item names and descriptions come from the export.

**Still to do:** the new in-game inventory UI. The user will send a picture of the layout they want. (Built since: the items screen, `scripts/ui/items_screen.gd`.)

Copies of both tools' HTML are kept in `tools/map_designer.html` and `tools/item_modeler.html`.
