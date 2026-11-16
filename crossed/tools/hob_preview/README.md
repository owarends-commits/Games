# Hob animation preview

A browser page that plays the Hob's animations on the repo's model, rigged on the fly. The design it shows is in `crossed/docs/project/hob-boss.md`.

## Run it
The page loads its models with `fetch`, so open it through a local web server, not as a file:

```
cd crossed/tools/hob_preview
python3 -m http.server 8000
```

Then open http://localhost:8000/. three.js r128 loads from cdnjs and jsDelivr.

- **Animations:** keys 1–6 pick one.
- **Cameras:** the buttons switch views. "Her eyes" looks from Norah's head at the cross.
- **Throne grab escape:** the toggle picks the cross, the eyes, or alternating.

## Files
| Path | What it is |
|---|---|
| `index.html` | The built page. Rebuild it with `sh src/build.sh` after editing `src/`. |
| `src/head.html` | Layout, styles, the animation list and the controls. |
| `src/scene.js` | The floor and lights. |
| `src/engine.js` | Shared rig, physics and effects code, copied from the ACROSS attack preview. It also drives Norah. |
| `src/hob.js` | The Hob: rig helpers, arm IK (with natural wrists and the stretch), the skin pulse and swellings, the tongues, the eye and slit, the cross, and every animation. |
| `src/run.js` | Loading, the frame loop, Norah's poses and the cameras. |
| `m/bosses/hob/hob_rigged.json`, `hob_tex0.png` | The rigged Hob, made by `crossed/tools/rig_hob.py` from `hob.glb`. |
| `m/cast/norah.json`, `norah_tex0.png` | Norah, the stand-in target for the grabs. |

## Rebuild the rig
```
python3 crossed/tools/rig_hob.py
```
It reads `crossed/assets/characters/lowpoly/bosses/hob/hob.glb` and writes the two files in `m/bosses/hob/`. Needs Python 3 and numpy.

What it builds:
- **Joints (40):** spine, head, jaw, two arms, three joints per finger, and the back legs.
- **Weights:** they follow position, so parts that touch move together.
- **The mouth tear:** the face is cut along a ragged line across the lips, so the jaw can tear the mouth open.

The face texture is the placeholder the model's README warns about.
