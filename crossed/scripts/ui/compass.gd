class_name Compass
extends Control
## A small heading strip at the top centre of the screen (HUD). It turns with the player, shows N/E/S/W,
## and marks where the current objective and the items she still needs are. Nothing is ever marked in
## the world itself. It fades out in cutscenes, in conversations and whenever the player isn't in control.
##   HUD.compass.active = true/false        (a story director turns it on for play sections)
##   HUD.compass.targets = [Vector3, ...]   (objective first: drawn larger)

const RANGE := 110.0        ## degrees either side of straight ahead that fit on the strip
var active := false
var targets: Array = []
var autoplay := false       ## tests/videos: the autopilot holds the controls, so don't treat that as a cutscene
var font: Font
var _a := 0.0

func _ready() -> void:
	size = Vector2(124, 15)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	modulate.a = 0.0

func _player() -> Node3D:
	return get_tree().get_first_node_in_group("player") as Node3D

func _show_now() -> bool:
	var p := _player()
	if not active or p == null or not p.is_visible_in_tree():
		return false
	if p.get("control_locked") and not (autoplay and targets.size() > 0): return false
	if Dialogue.current_id != "": return false
	if not Cameras._overrides.is_empty(): return false     # a scripted shot is up: it's a cutscene
	if HUD.letterbox_top.position.y > -39.0: return false
	if HUD.fader.modulate.a > 0.05: return false
	return true

func _process(delta: float) -> void:
	_a = move_toward(_a, 1.0 if _show_now() else 0.0, delta * (3.0 if _show_now() else 6.0))
	modulate.a = _a
	if _a > 0.0:
		queue_redraw()

func _yaw_of(v: Vector3) -> float:
	return rad_to_deg(atan2(-v.x, -v.z))

func _x_for(rel: float) -> float:
	return size.x / 2 - rel / RANGE * (size.x / 2 - 6)

func _draw() -> void:
	var p := _player()
	if p == null: return
	var fwd := -p.global_transform.basis.z
	var head := _yaw_of(fwd)
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.03, 0.03, 0.04, 0.72))
	draw_rect(Rect2(Vector2(0, size.y - 1), Vector2(size.x, 1)), Color(0.55, 0.48, 0.34, 0.8))
	# ticks and the cardinal letters
	for d in range(0, 360, 15):
		var rel := wrapf(float(d) - head, -180.0, 180.0)
		if absf(rel) > RANGE: continue
		var x := _x_for(rel)
		var card := d % 90 == 0
		if card:
			var ch: String = {0: "N", 90: "W", 180: "S", 270: "E"}[d]
			draw_string(font, Vector2(x - 2.5, 10), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color(0.92, 0.88, 0.78) if d == 0 else Color(0.7, 0.66, 0.58))
		else:
			draw_rect(Rect2(x, size.y - (4 if d % 45 == 0 else 3), 1, 3 if d % 45 == 0 else 2), Color(0.6, 0.56, 0.5, 0.7))
	# centre notch (where she's facing)
	draw_rect(Rect2(size.x / 2 - 0.5, 0, 1, 3), Color(0.95, 0.9, 0.8))
	# markers: the objective (bigger), then the things she still needs
	for i in range(targets.size() - 1, -1, -1):
		var t: Vector3 = targets[i]
		var to := t - p.global_position
		to.y = 0.0
		if to.length() < 0.4: continue
		var rel := wrapf(_yaw_of(to) - head, -180.0, 180.0)
		var main := i == 0
		var col := Color(0.98, 0.78, 0.32) if main else Color(0.8, 0.86, 0.9, 0.85)
		var r := 3.0 if main else 2.0
		var y := size.y / 2 + 0.5
		if absf(rel) <= RANGE:
			var x := _x_for(rel)
			draw_colored_polygon(PackedVector2Array([Vector2(x, y - r), Vector2(x + r, y), Vector2(x, y + r), Vector2(x - r, y)]), col)
		else:   # behind her: a small arrow at the edge it's nearer to
			var left := rel > 0.0
			var x := 3.0 if left else size.x - 3.0
			var s := -1.0 if left else 1.0
			draw_colored_polygon(PackedVector2Array([Vector2(x + s * r, y), Vector2(x - s * r * 0.4, y - r), Vector2(x - s * r * 0.4, y + r)]), Color(col, 0.7))
