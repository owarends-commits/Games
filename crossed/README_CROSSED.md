# Crossed (working title: The Extrecated)

A PS1-style survival horror game in Godot 4.4.1: fixed cameras, low-poly 3D, tank controls or over-the-shoulder aiming. Set during the Second Coming: the saved are taken, and demons (the Extrecated) wear the bodies left behind, each marked with a burned-in cross.

This folder is the whole Godot project plus every design and story document, kept here so other sessions and tools can work from it.

## Where things are

| What | Where |
|---|---|
| The story (the user's narrative sheet and master brief) | `docs/narrative_sheet.txt` |
| Look, camera and controls direction | `docs/project/game-direction.md` |
| Chapter One: what happens, controls, every change by version (v14 is the latest) | `docs/project/chapter1-playtest-notes.md` |
| Combat rules, ACROSS subclasses, Louis the Brute | `docs/project/combat-design.md` |
| Stealth draft | `docs/project/stealth-design.md` |
| Character models, and the target model style | `docs/project/character-model-notes.md`, `docs/project/model-style-reference.md` |
| Dialogue portraits | `docs/project/portrait-spec.md` |
| Browser tools (Map Designer, Item Modeler, Combat Playground, Character Creator) | `docs/project/tools-roadmap.md`, `docs/project/character-creator.md`; page copies in `tools/map_designer.html`, `tools/item_modeler.html`, `tools/combat_playground.html` (v14), `tools/creator/character_creator.html` |
| Working preferences and setting rules (late 1990s, no cell phones) | `docs/project/working-preferences.md` |
| Prologue pass notes (blockout, story, ending, models) | `docs/BLOCKOUT_NOTES.md`, `docs/STORY_PASS_NOTES.md`, `docs/ENDING_PASS_NOTES.md`, `docs/MODEL_PASS_NOTES.md` |
| Older Chapter One notes | `docs/CHAPTER1_PLAYTEST.md` (superseded by `docs/project/chapter1-playtest-notes.md`) |

## Running it

- Open the folder in Godot 4.4.1. The prologue is `scenes/prologue/prologue.tscn`; Chapter One is `scenes/chapter1/chapter1.tscn` (F6).
- Chapter One jump-ahead args (Project Settings → Run → Main Run Args, after `--`): `start=walk | sprint | inside | wardrobe | duel | after | louis | road`, plus `autoplay` to play itself and `stop=<phase>` to quit at a phase.
- Headless test recording: `godot --path . --rendering-driver opengl3 --write-movie out.avi --fixed-fps 30 res://scenes/chapter1/chapter1.tscn -- autoplay`.

## Code map

| Area | Files |
|---|---|
| Chapter One director (all its scenes and beats) | `scripts/cutscenes/chapter1_director.gd` |
| Prologue | `scripts/cutscenes/prologue_director.gd`, `breach_sequence.gd`, `drive_sequence.gd` |
| Louis (the Brute) and the stalker | `scripts/enemies/louis_ai.gd`, `scripts/enemies/louis_stalker.gd`, `scripts/enemies/cross_body.gd` |
| Norah | `scripts/player/player.gd`, `scripts/player/norah_combat.gd` |
| Cutscene and NPC movement that respects walls | `scripts/systems/body_sweep.gd` |
| Cameras | `scripts/cameras/` |
| HUD, items screen, pause menu | `scripts/ui/` |
| Dialogue (all lines) | `dialogue/chapter1.json`, `dialogue/prologue.json` |
| Map and character builders | `tools/build_ch1_map.py`, `tools/build_humans.py`, `tools/build_community_center.py` |

## Left out of the repository

- `.godot/`: Godot's cache. It rebuilds itself on first open.
- `tests/captures/`: test screenshots.
- `tools/mh_data/` (126 MB): the MakeHuman base data, only needed to rebuild characters. It's CC0, from github.com/makehumancommunity/makehuman.

## Status (Nov 4, 2026)

- **The prologue and Chapter One play through end to end in the self-playing test with no script errors.**
- **Louis as a stalker (v14):** built and running.
  - He collapses in the house fight and vanishes during the broadcast.
  - He's revealed at Norah's car, hunts her outside and in his house, comes through the upstairs window, and hits the truck in the finale.
  - His real death and the Rose's ring treasure drop are built but haven't been seen in a test yet.
- **Character models:** waiting on the user's reference images or character pack. See `model-style-reference.md`.
