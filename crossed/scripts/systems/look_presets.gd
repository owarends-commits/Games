class_name LookPresets
extends RefCounted
## Screen styles: the post-process finish (shaders/ps1_post.gdshader) plus the base resolution the 3D renders at.
## GameSettings.look picks one; F2 cycles them while playing (a caption names each).
##   res: 3 = 320x240 (the original), 2 = 480x360 (more detail on faces and far things), from a 960x720 window

const ORDER := ["original", "soft_grain", "clean", "sharp", "crt_night", "faded_film"]
const NAMES := {
	"original": "A · Original (heavy grain + full dither, 320x240)",
	"soft_grain": "B · Soft grain (a quarter of the grain, slow, light dither)",
	"clean": "C · Clean PS1 (no grain, faint dither, a touch of sharpening)",
	"sharp": "D · Sharp PS1 (480x360, faint still grain)",
	"crt_night": "E · CRT night (480x360, scanlines, vignette, cool)",
	"faded_film": "F · Faded film (muted, warm, soft still grain, vignette)",
}
const P := {
	"original":   {"res": 3, "color_levels": 32.0, "dither_strength": 1.0, "grain": 0.025, "grain_speed": 1.0, "grain_size": 1.0, "saturation": 1.0, "contrast": 1.0, "brightness": 0.0, "tint": Vector3(1, 1, 1), "vignette": 0.0, "scanlines": 0.0, "sharpen": 0.0},
	"soft_grain": {"res": 3, "color_levels": 32.0, "dither_strength": 0.45, "grain": 0.009, "grain_speed": 0.25, "grain_size": 1.0, "saturation": 1.0, "contrast": 1.02, "brightness": 0.0, "tint": Vector3(1, 1, 1), "vignette": 0.12, "scanlines": 0.0, "sharpen": 0.0},
	"clean":      {"res": 3, "color_levels": 48.0, "dither_strength": 0.2, "grain": 0.0, "grain_speed": 0.0, "grain_size": 1.0, "saturation": 1.02, "contrast": 1.04, "brightness": 0.0, "tint": Vector3(1, 1, 1), "vignette": 0.1, "scanlines": 0.0, "sharpen": 0.18},
	"sharp":      {"res": 2, "color_levels": 64.0, "dither_strength": 0.25, "grain": 0.006, "grain_speed": 0.0, "grain_size": 1.0, "saturation": 1.0, "contrast": 1.04, "brightness": 0.0, "tint": Vector3(1, 1, 1), "vignette": 0.15, "scanlines": 0.0, "sharpen": 0.12},
	"crt_night":  {"res": 2, "color_levels": 48.0, "dither_strength": 0.2, "grain": 0.008, "grain_speed": 0.5, "grain_size": 1.0, "saturation": 0.9, "contrast": 1.1, "brightness": 0.01, "tint": Vector3(0.95, 1.0, 1.06), "vignette": 0.45, "scanlines": 0.16, "sharpen": 0.1},
	"faded_film": {"res": 3, "color_levels": 64.0, "dither_strength": 0.0, "grain": 0.014, "grain_speed": 0.0, "grain_size": 2.0, "saturation": 0.72, "contrast": 0.96, "brightness": 0.015, "tint": Vector3(1.05, 1.0, 0.9), "vignette": 0.32, "scanlines": 0.0, "sharpen": 0.08},
}

## Apply a style to a scene's screen: its SubViewportContainer "Screen" and the PostFX rect inside it.
static func apply(scene_root: Node, name: String) -> void:
	if scene_root == null or not P.has(name): return
	var p: Dictionary = P[name]
	var screen := scene_root.get_node_or_null("Screen") as SubViewportContainer
	if screen:
		screen.stretch_shrink = int(p["res"])
	var rect := scene_root.find_child("Rect", true, false) as ColorRect
	if rect and rect.material is ShaderMaterial:
		var m := rect.material as ShaderMaterial
		for k in p:
			if k == "res": continue
			m.set_shader_parameter(k, p[k])
