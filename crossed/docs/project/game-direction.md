# Crossed: game direction (decided 2026-10-25)

Replaces the earlier top-down 2D pixel-art direction.

- **Camera:** fixed-camera 3D in the style of classic Resident Evil. Each room has several fixed camera angles, switched by trigger zones.
- **Rooms:** real-time low-poly 3D rooms, not pre-rendered backgrounds, so cameras and props can be moved freely.
- **Look:** gritty PS1 graphics: 320×240 internal resolution scaled up with no smoothing, vertex snapping (wobble), affine texture mapping (warp), 32–64 px textures with nearest sampling, per-vertex lighting, 15-bit colour with ordered dithering, distance fog in dark spaces.
- **Mood contrast stays:** outside and the hallway are dark, desaturated and foggy; the party room is bright and saturated so it feels safe until the attack.
- **Controls:** tank controls by default; camera-relative movement as an option. In camera-relative mode the player's heading holds through a camera cut until the stick is released.
- **ACROSS eyes:** full-bright white (ignore lighting) so they read in any light.
- **Engine:** Godot 4, GDScript.
- **Carries over unchanged:** story, prologue script, ACROSS lore and designs, character designs, dialogue portraits (see portrait-spec.md), floor plans used as room blueprints.
- **Retired:** the 64×64 sprite sheets (kept only as colour and silhouette reference).
