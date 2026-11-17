# Crossed animation previews and the Combat Playground

Browser pages used to design every creature's and Norah's animations before they go into the Combat Playground and then Godot. What each page shows is written up in `crossed/docs/project/animation-previews.md`.

## Run them
The pages load their models with `fetch`, so serve this folder rather than opening the files directly:

```
cd crossed/tools/previews
python3 -m http.server 8000
```

Then open, for example, http://localhost:8000/reacher-preview.html. three.js r128 loads from cdnjs and jsDelivr.

## Pages
| Page | What it is |
|---|---|
| `combat_playground.html` | The Combat Playground (the sandbox): map builder, every enemy type with its AI, Norah's controls. |
| `across-preview.html` | ACROSS attacks and movement. |
| `brute-preview.html` | The two-armed Brute, the legless one, the split one and the armoured one. |
| `clubfist-preview.html` | The club-fist Brute. |
| `onearm-preview.html` | The one-arm Brute and Louis. |
| `runner-preview.html` | The Runner. |
| `tactician-preview.html` | The Tactician. |
| `contortionist-preview.html` | The Contortionist. |
| `reacher-preview.html` | The Reachers: three long-necked, two long-armed. |
| `splithead-preview.html` | The unique split-head Reacher (f01). |
| `norah-player-preview.html` | Norah's player animations: moving, the revolver and flashlight, dodge and shove, getting hurt. |
| `norah-weapons-preview.html` | The weapons she finds: pump shotgun, hunting rifle, 9mm pistol, hatchet, crowbar, kitchen knife, road flare, flare gun. |

The Hob boss has its own preview in `crossed/tools/hob_preview/`.

## Models
`m/` holds web copies of the low-poly models in `crossed/assets/characters/lowpoly/` (JSON plus a texture per model), made by `src/glb2web.py`:

```
python3 src/glb2web.py crossed/assets/characters/lowpoly crossed/tools/previews/m
```

Model changes stay out of the model files: anything a page needs (extra neck or arm joints, the split head's jaws, the stretched neck) is built when the page loads.

## Rebuilding a page
Each page is assembled by a script in `src/` from an earlier page plus its own code. Run these from inside `src/` with the page they read beside them (copy the pages into `src/` first, or run from a folder holding both):

| Page | Script | Its own code |
|---|---|---|
| `combat_playground.html` | `build.py` (writes `crossed-sandbox.html`) | `base_engine.html`, `base_builder.html`, the `*.py` patch files it lists, the `*_rt.js` runtime files, `shell_*.html` |
| `reacher-preview.html` | `mkrc.py` | `rc.js` |
| `splithead-preview.html` | `mksh.py` | `sh.js` |
| `norah-player-preview.html` | `mkpl.py` | `pl.js` |
| `norah-weapons-preview.html` | `mkwp.py` | `pl.js`, `wp.js` |

`build.py` reads the models from `crossed/assets/characters/lowpoly/` and `m/` (or `LOWPOLY` and `WEBM` if set).

## Checks
These run the pages in headless Chromium (Playwright) against a local server on port 8765:

- `src/audit2.js`: the strict gravity audit (nothing floats, nothing sinks into the floor).
- `src/selfcol.js`: Norah's limbs and the held weapon against her own body, as capsules: the largest overlap per clip.
- `src/rshot.js`: screenshots of a clip at chosen times.
