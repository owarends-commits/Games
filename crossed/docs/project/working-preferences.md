# Working preferences

- **Gameplay video with each build:** after every new iteration of the game code, ask whether to include a full gameplay video. Render it with Godot's Movie Maker mode (`--write-movie`, `--fixed-fps 30`) on an autoplay run, then convert it to MP4. The user plays on a Chromebook that can't run Godot builds, so the video is how they review a build.
- **Batched notes:** sometimes the user sends a run of notes and rejects tool calls that edit code. In that case, log the notes here as pending and don't touch the code until they say to update the game.
- **Long tests:** the user often interrupts long foreground test runs. Run full autoplay tests and renders in the background so the conversation stays free.

## Setting: late 1990s / early 2000s, no cell phones

The story is set in the late 1990s to early 2000s. Nobody has a cell phone: people use landlines, the car radio, the TV and answering machines at home. Keep all new dialogue, props and documents period-appropriate.

## Done in v11 (2026-10-27)

The ten queued changes are in:
- phones removed: "I'll call Kenneth's line when I get home"; Denise's line is about television
- the radio sting
- the near-black headlight blackout
- Louis faces Norah
- no teleport to the TV
- the truck-yard camera removed (the user confirmed that was the one)
- "Pills"
- Pruitt timing by distance
- a linear county road
- dense forest

Also done:
- the art pass (v11 textures, rounder characters with coats, vests, scarves and hats)
- the compass (top centre, objective markers, hidden in cutscenes and dialogue)
- the road flicker fix (single ribbon meshes at distinct heights)
- barricades need E mashing (`_mash_push`)

## Waiting on the user

- **Objective rewrites:** the user is rewriting the objective texts (list given in chat on 2026-10-27).
- **Inventory UI picture:** the user will send a picture of the in-game inventory UI.
