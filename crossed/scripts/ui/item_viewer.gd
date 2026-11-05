class_name ItemViewer
extends Control
## A 3D item held up to the screen: the pickup card, the inventory preview and the inspect view.
## It renders into its own little world at HUD pixel size, so it gets the same chunky PS1 look as the game.
##   var v := ItemViewer.new(); v.size = Vector2(240, 180); parent.add_child(v)
##   v.interactive = true          # arrows / left stick turn it, Shift+Up/Down or the wheel zoom, drag with the mouse
##   v.show_item("revolver")       # or show_item("photo", {"Print": {"tex": ...}})
## X (examine) steps through the item's examine points: the item turns to show that spot and its line appears.

signal examined(text: String)

var interactive := false
var spin := true                    ## turns slowly on its own while nobody is handling it
var show_pins := true
var caption_box := true             ## draw the examine line inside the viewer
var key := ""

var vp: SubViewport
var cam: Camera3D
var pivot: Node3D
var model: Node3D
var _tex: TextureRect
var _cap: Label
var _marks: Control
var yaw := -30.0
var pitch := 22.0
var zoom := 1.0
var _base_zoom := 1.0
var _target := Vector3.INF          ## (yaw, pitch, zoom) while turning to an examine point
var _off := Vector3.ZERO            ## the item slides so the spot being examined sits in the middle
var _off_to := Vector3.ZERO
var _idle := 0.0
var _pins: Array = []
var _pin_i := -1
var _drag := false
var _t := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP if interactive else Control.MOUSE_FILTER_IGNORE
	clip_contents = true
	_build()
	if key != "" and model == null:
		show_item(key)

func _build() -> void:
	if vp: return
	vp = SubViewport.new()
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.size = Vector2i(maxi(16, int(size.x)), maxi(16, int(size.y)))
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.msaa_3d = Viewport.MSAA_DISABLED
	add_child(vp)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.42, 0.41, 0.44)
	env.ambient_light_energy = 1.0
	var we := WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)
	var key_l := DirectionalLight3D.new()
	key_l.light_color = Color(1.0, 0.93, 0.82)
	key_l.light_energy = 1.25
	key_l.rotation_degrees = Vector3(-38, -32, 0)
	vp.add_child(key_l)
	var rim := DirectionalLight3D.new()
	rim.light_color = Color(0.62, 0.72, 0.95)
	rim.light_energy = 0.55
	rim.rotation_degrees = Vector3(-15, 150, 0)
	vp.add_child(rim)
	pivot = Node3D.new()
	vp.add_child(pivot)
	cam = Camera3D.new()
	cam.fov = 30.0
	cam.near = 0.004
	cam.far = 10.0
	vp.add_child(cam)
	cam.current = true
	_tex = TextureRect.new()
	_tex.texture = vp.get_texture()
	_tex.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_tex.stretch_mode = TextureRect.STRETCH_SCALE
	_tex.size = size
	_tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_tex)
	_cap = Label.new()
	_cap.add_theme_font_override("font", HUD.MONO)
	_cap.add_theme_font_size_override("font_size", 9)
	_cap.add_theme_color_override("font_color", Color(0.7, 0.86, 0.95))
	_cap.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 1))
	_cap.add_theme_constant_override("shadow_offset_x", 1)
	_cap.add_theme_constant_override("shadow_offset_y", 1)
	_cap.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_cap.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_cap.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	_cap.position = Vector2(6, size.y - 40)
	_cap.size = Vector2(size.x - 12, 36)
	_cap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_cap)
	_marks = Control.new()
	_marks.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_marks.size = size
	_marks.draw.connect(_draw_pins)
	add_child(_marks)

func show_item(k: String, overrides: Dictionary = {}) -> void:
	key = k
	if not is_inside_tree():
		return
	_build()
	if model: model.queue_free()
	model = ItemModels.build(k, overrides)
	pivot.add_child(model)
	for m in model.get_meta("materials", []):
		(m as ShaderMaterial).set_shader_parameter("snap_resolution", Vector2(vp.size))
	_pins = model.get_meta("pins", []).filter(func(p): return p["kind"] == "examine")
	_pin_i = -1
	_cap.text = ""
	var pose: Dictionary = model.get_meta("pose", {})
	yaw = float(pose.get("yaw", -30))
	pitch = float(pose.get("pitch", 22))
	_base_zoom = float(pose.get("zoom", 1))
	zoom = _base_zoom
	_target = Vector3.INF
	_off = Vector3.ZERO
	_off_to = Vector3.ZERO
	_place()

func has_examine_points() -> bool:
	return not _pins.is_empty()

## The next examine point: turn the item so that spot faces her, and show its line.
func next_point() -> void:
	if _pins.is_empty(): return
	_pin_i = (_pin_i + 1) % _pins.size()
	var p: Vector3 = _pins[_pin_i]["pos"]
	var n: Vector3 = _pins[_pin_i].get("nrm", p.normalized())
	var r := Vector2(n.x, n.z).length()
	var ty := rad_to_deg(atan2(-n.x, n.z)) if r > 0.08 else yaw
	var tp := clampf(rad_to_deg(atan2(n.y, maxf(r, 1e-4))), -62.0, 62.0)
	ty = yaw + wrapf(ty - yaw, -180.0, 180.0)
	_target = Vector3(ty, tp, _base_zoom * 1.45)
	_off_to = -p
	_cap.text = _pins[_pin_i]["text"] if caption_box else ""
	examined.emit(_pins[_pin_i]["text"])
	_idle = 0.0

func _place() -> void:
	if model == null: return
	pivot.basis = Basis(Vector3.RIGHT, deg_to_rad(pitch)) * Basis(Vector3.UP, deg_to_rad(yaw))
	model.position = _off
	var rad: float = model.get_meta("radius", 0.1)
	var aspect := size.x / maxf(1.0, size.y)
	var half := deg_to_rad(cam.fov * 0.5)
	var fit := minf(tan(half), tan(half) * aspect)       # the narrower way the frame fits
	cam.position = Vector3(0, 0, rad / fit * 1.08 / zoom)

func _process(delta: float) -> void:
	if model == null or not is_visible_in_tree(): return
	_t += delta
	if _tex.size != size: _tex.size = size
	var handled := false
	if interactive:
		var turn := Input.get_axis("move_left", "move_right")
		var tilt := Input.get_axis("move_forward", "move_back")
		if Input.is_action_pressed("run"):
			if absf(tilt) > 0.1:
				zoom = clampf(zoom * (1.0 - tilt * delta * 1.4), _base_zoom * 0.6, _base_zoom * 3.0)
				handled = true
		else:
			if absf(turn) > 0.1:
				yaw += turn * 150.0 * delta; handled = true
			if absf(tilt) > 0.1:
				pitch = clampf(pitch - tilt * 120.0 * delta, -85.0, 85.0); handled = true
		if Input.is_action_just_pressed("examine") and _t > 0.2:
			next_point()
	if handled or _drag:
		_target = Vector3.INF
		_off_to = Vector3.ZERO
		_idle = 0.0
	else:
		_idle += delta
	if _target != Vector3.INF:
		var k := 1.0 - exp(-delta * 7.0)
		yaw = lerpf(yaw, _target.x, k)
		pitch = lerpf(pitch, _target.y, k)
		zoom = lerpf(zoom, _target.z, k)
	elif spin and _idle > (2.5 if interactive else 0.0) and _pin_i < 0:
		yaw += delta * 26.0
	_off = _off.lerp(_off_to, 1.0 - exp(-delta * 6.0))
	_place()
	if show_pins and interactive:
		_marks.size = size
		_marks.queue_redraw()

func _gui_input(e: InputEvent) -> void:
	if not interactive: return
	if e is InputEventMouseButton:
		if e.button_index == MOUSE_BUTTON_LEFT: _drag = e.pressed
		elif e.button_index == MOUSE_BUTTON_WHEEL_UP and e.pressed: zoom = clampf(zoom * 1.1, _base_zoom * 0.6, _base_zoom * 3.0)
		elif e.button_index == MOUSE_BUTTON_WHEEL_DOWN and e.pressed: zoom = clampf(zoom / 1.1, _base_zoom * 0.6, _base_zoom * 3.0)
		_idle = 0.0
	elif e is InputEventMouseMotion and _drag:
		yaw += e.relative.x * 0.6
		pitch = clampf(pitch + e.relative.y * 0.6, -85.0, 85.0)
		_target = Vector3.INF
		_off_to = Vector3.ZERO

## Examine points: small pulsing diamonds over the spots worth a closer look (pale when on the far side).
func _draw_pins() -> void:
	if not (show_pins and interactive) or model == null: return
	var sc := size / Vector2(vp.size)
	for i in _pins.size():
		var w := model.global_transform * (_pins[i]["pos"] as Vector3)
		if cam.is_position_behind(w): continue
		var q := cam.unproject_position(w) * sc
		var facing := (cam.global_transform.basis.inverse() * (w - pivot.global_position)).z >= -0.004
		var on := i == _pin_i
		var r := (3.5 if on else 2.6) + sin(_t * 5.0 + i) * 0.6
		var col := Color(0.44, 0.71, 0.84, 0.95 if facing else 0.35)
		if on: col = Color(0.95, 0.85, 0.5, 1.0)
		var pts := PackedVector2Array([q + Vector2(0, -r), q + Vector2(r, 0), q + Vector2(0, r), q + Vector2(-r, 0)])
		_marks.draw_colored_polygon(pts, Color(0, 0, 0, 0.6 * col.a))
		pts.append(q + Vector2(0, -r))
		_marks.draw_polyline(pts, col, 1.0)
