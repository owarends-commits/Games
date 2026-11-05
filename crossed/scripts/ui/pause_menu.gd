class_name PauseMenu
extends Control
## The pause menu (Esc / pad Start), drawn by HUD. The game stops while it's open, conversations included.
##   Resume · Controls · Settings (screen style, mouse speed, invert look, controller look speed) ·
##   Restart from the last checkpoint · Quit to desktop
## Arrows / d-pad move, E / A choose, Left/Right change a setting, Esc / B backs out. The mouse works too.

const GOLD := Color(0.95, 0.8, 0.42)
const INK := Color(0.88, 0.86, 0.78)
const DIM := Color(0.52, 0.52, 0.46)

var open := false
var _hidden: Array = []
var page := "main"            ## main | controls | settings | confirm
var cursor := 0
var _was_mouse := Input.MOUSE_MODE_VISIBLE
var _lmb := true
var _t := 0.0

const MAIN := ["Resume", "Controls", "Settings", "Restart from checkpoint", "Quit to desktop"]
const SETTINGS := ["Screen style", "Mouse speed", "Invert look", "Controller look speed", "Back"]
const CONTROLS := [
	["Move", "WASD", "Left stick"], ["Look", "Mouse / arrows", "Right stick"], ["Run", "Shift", "B"],
	["Interact / next", "E or Space", "A"], ["Items screen", "Tab or I", "Back"], ["Aim", "C or right mouse", "LB"],
	["Fire (aiming)", "F or left mouse", "RB"], ["Reload", "R", "X"], ["Shove", "V or middle mouse", "Y"],
	["Roll (aiming)", "Shift + direction", "B"], ["Quick turn", "Q", "X"], ["Pause", "Esc", "Start"]]

func _ready() -> void:
	size = Vector2(HUD.W, HUD.H)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	draw.connect(_draw_menu)

func can_open() -> bool:
	if open or get_tree().paused: return false          # another menu (items, a document) is already up
	var scene := get_tree().current_scene
	return scene != null and not scene.name.begins_with("Test")

func show_menu() -> void:
	open = true
	_opened = Engine.get_process_frames()
	_last_m = get_local_mouse_position()       # only a real mouse move picks a row
	page = "main"
	cursor = 0
	_lmb = true
	visible = true
	move_to_front()
	_hidden = []
	for n in [HUD.box, HUD.name_plate, HUD.portrait, HUD.prompt]:     # a line or prompt on screen waits underneath
		if n.visible:
			_hidden.append(n)
			n.visible = false
	_was_mouse = Input.mouse_mode
	get_tree().paused = true
	if DisplayServer.get_name() != "headless": Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_blip(0.9)
	queue_redraw()

func hide_menu() -> void:
	open = false
	visible = false
	for n in _hidden:
		if is_instance_valid(n): n.visible = true
	_hidden = []
	get_tree().paused = false
	GameSettings.save_settings()
	if DisplayServer.get_name() != "headless": Input.mouse_mode = _was_mouse
	_blip(0.8)

func _unhandled_input(e: InputEvent) -> void:
	if e.is_action_pressed("pause") and not open and can_open():
		get_viewport().set_input_as_handled()
		show_menu()

func _blip(p := 1.0) -> void:
	var a := AudioStreamPlayer.new()
	a.stream = load("res://assets/audio/ui_blip.wav")
	a.volume_db = -12.0
	a.pitch_scale = p
	a.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(a)
	a.play()
	a.finished.connect(a.queue_free)

func _items() -> Array:
	match page:
		"main": return MAIN
		"settings": return SETTINGS
		"confirm": return ["Yes, restart", "No"]
	return ["Back"]

var _opened := 0
func _process(delta: float) -> void:
	if not open: return
	if Engine.get_process_frames() <= _opened + 1: return     # the press that opened it doesn't also close it
	_t += delta
	var items := _items()
	var moved := false
	if Input.is_action_just_pressed("move_forward"): cursor = (cursor + items.size() - 1) % items.size(); moved = true
	if Input.is_action_just_pressed("move_back"): cursor = (cursor + 1) % items.size(); moved = true
	# mouse: hover picks, click chooses
	var m := get_local_mouse_position()
	var now := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var click := now and not _lmb
	_lmb = now
	var hover := -1
	for i in items.size():
		if _row_rect(i).has_point(m): hover = i
	if hover >= 0 and hover != cursor and m.distance_to(_last_m) > 0.5:
		cursor = hover; moved = true
	_last_m = m
	if moved: _blip(1.25)
	if page == "settings" and cursor < 4:
		var d := 0
		if Input.is_action_just_pressed("move_left"): d = -1
		if Input.is_action_just_pressed("move_right"): d = 1
		if click and hover == cursor: d = 1
		if d != 0:
			_change_setting(cursor, d)
			click = false
	if Input.is_action_just_pressed("interact") or (click and hover >= 0):
		_choose(items[cursor])
	elif Input.is_action_just_pressed("menu_back") or Input.is_action_just_pressed("pause"):
		if page == "main": hide_menu()
		else:
			page = "main"; cursor = 0; _blip(0.9)
	queue_redraw()

var _last_m := Vector2.ZERO

func _choose(item: String) -> void:
	match item:
		"Resume": hide_menu()
		"Controls": page = "controls"; cursor = 0; _blip(1.1)
		"Settings": page = "settings"; cursor = 0; _blip(1.1)
		"Restart from checkpoint": page = "confirm"; cursor = 1; _blip(1.1)
		"Yes, restart":
			hide_menu()
			var scene := get_tree().current_scene
			if scene and scene.has_method("restart_checkpoint"): scene.restart_checkpoint()
			else: get_tree().reload_current_scene()
		"No", "Back": page = "main"; cursor = 0; _blip(0.9)
		"Quit to desktop":
			GameSettings.save_settings()
			get_tree().quit()
		_:
			if page == "settings": _change_setting(cursor, 1)

func _change_setting(i: int, d: int) -> void:
	match i:
		0:
			var o: Array = LookPresets.ORDER
			GameSettings.look = o[(o.find(GameSettings.look) + d + o.size()) % o.size()]
			GameSettings.apply_look()
		1: GameSettings.mouse_sensitivity = clampf(snappedf(GameSettings.mouse_sensitivity + 0.02 * d, 0.01), 0.04, 0.6)
		2: GameSettings.invert_y = not GameSettings.invert_y
		3: GameSettings.stick_look_speed = clampf(GameSettings.stick_look_speed + 15.0 * d, 60.0, 360.0)
	_blip(1.0 + 0.1 * d)

func _setting_value(i: int) -> String:
	match i:
		0:
			var nm: String = LookPresets.NAMES.get(GameSettings.look, GameSettings.look)
			nm = nm.get_slice(" (", 0)
			if nm.find(" · ") >= 0: nm = nm.get_slice(" · ", 1)
			return nm
		1: return "%d%%" % int(round(GameSettings.mouse_sensitivity / 0.18 * 100.0))
		2: return "On" if GameSettings.invert_y else "Off"
		3: return "%d%%" % int(round(GameSettings.stick_look_speed / 150.0 * 100.0))
	return ""

func _row_rect(i: int) -> Rect2:
	match page:
		"controls": return Rect2(150, 312, 180, 16)
		"settings": return Rect2(110, 118 + i * 24, 260, 20)
		"confirm": return Rect2(180, 190 + i * 24, 120, 20)
	return Rect2(150, 118 + i * 26, 180, 22)

func _draw_menu() -> void:
	var f: Font = HUD.MONO
	draw_rect(Rect2(0, 0, HUD.W, HUD.H), Color(0, 0, 0, 0.72))
	var title: String = {"main": "PAUSED", "controls": "CONTROLS", "settings": "SETTINGS", "confirm": "RESTART?"}[page]
	var tw := HUD.SERIF.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, 22).x
	draw_string(HUD.SERIF, Vector2(HUD.W / 2 - tw / 2 + 1, 79), title, HORIZONTAL_ALIGNMENT_LEFT, -1, 22, Color(0, 0, 0, 0.8))
	draw_string(HUD.SERIF, Vector2(HUD.W / 2 - tw / 2, 78), title, HORIZONTAL_ALIGNMENT_LEFT, -1, 22, Color(0.85, 0.32, 0.22))
	draw_rect(Rect2(HUD.W / 2 - 60, 88, 120, 1), Color(0.55, 0.45, 0.28, 0.7))
	match page:
		"controls":
			draw_string(f, Vector2(70, 108), "", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
			draw_string(f, Vector2(250, 108), "KEYBOARD / MOUSE", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
			draw_string(f, Vector2(370, 108), "PAD", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
			for i in CONTROLS.size():
				var r: Array = CONTROLS[i]
				var y := 124 + i * 15
				draw_string(f, Vector2(80, y), r[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 10, GOLD)
				draw_string(f, Vector2(250, y), r[1], HORIZONTAL_ALIGNMENT_LEFT, -1, 9, INK)
				draw_string(f, Vector2(370, y), r[2], HORIZONTAL_ALIGNMENT_LEFT, -1, 9, INK)
			_row(0, "Back", true)
		"settings":
			for i in SETTINGS.size():
				var r := _row_rect(i)
				var on := i == cursor
				if on: draw_rect(r, Color(0.22, 0.13, 0.08))
				draw_string(f, r.position + Vector2(10, 14), SETTINGS[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 11, GOLD if on else INK)
				if i < 4:
					var v := _setting_value(i)
					var vw := f.get_string_size(v, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
					draw_string(f, Vector2(r.end.x - 26 - vw, r.position.y + 14), v, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, INK)
					if on:
						draw_string(f, Vector2(r.end.x - 40 - vw, r.position.y + 14), "<", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, GOLD)
						draw_string(f, Vector2(r.end.x - 18, r.position.y + 14), ">", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, GOLD)
			_hint("Up/Down: pick   Left/Right: change   Esc: back")
		"confirm":
			var msg := "Go back to the last checkpoint? Anything since then is lost."
			var mw := f.get_string_size(msg, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
			draw_string(f, Vector2(HUD.W / 2 - mw / 2, 160), msg, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, INK)
			for i in 2: _row(i, ["Yes, restart", "No"][i], i == cursor)
		_:
			for i in MAIN.size(): _row(i, MAIN[i], i == cursor)
			_hint("Up/Down: pick   E: choose   Esc: resume")

func _row(i: int, label: String, on: bool) -> void:
	var f: Font = HUD.MONO
	var r := _row_rect(i)
	if on:
		draw_rect(r, Color(0.22, 0.13, 0.08))
		draw_rect(Rect2(r.position.x, r.end.y - 1, r.size.x, 1), GOLD)
	var w := f.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
	draw_string(f, Vector2(r.position.x + r.size.x / 2 - w / 2, r.position.y + 15), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, GOLD if on else INK)

func _hint(t: String) -> void:
	var f: Font = HUD.MONO
	var w := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, 8).x
	draw_string(f, Vector2(HUD.W / 2 - w / 2, 330), t, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
