extends CanvasLayer
## Autoload "HUD": everything drawn over the 320x240 game view.
## Laid out on a 480x360 grid and scaled 2x, so text stays chunky while the
## 192x224 portraits still land 1:1 on screen pixels.

const W := 480.0
const H := 360.0
var MONO: FontFile = load("res://assets/fonts/DejaVuSansMono-Bold.ttf")
var SERIF: FontFile = load("res://assets/fonts/DejaVuSerif-Bold.ttf")

var root: Control
var letterbox_top: ColorRect
var letterbox_bottom: ColorRect
var fader: ColorRect
var flash_rect: ColorRect
var title_big: Label
var title_small: Label
var objective: Label
var obj_bar: Panel
var prompt: Label
var captions: VBoxContainer
var debug: Label
var end_card: Control
var compass: Compass
var pause_menu: PauseMenu

# dialogue box parts (driven by the Dialogue autoload)
var box: Panel
var portrait: TextureRect
var name_label: Label
var text_label: Label
var more_arrow: Label

func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS
	for f in [MONO, SERIF]:
		f.antialiasing = TextServer.FONT_ANTIALIASING_NONE
		f.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
		f.hinting = TextServer.HINTING_NORMAL
	root = Control.new()
	root.name = "Root"
	root.size = Vector2(W, H)
	root.scale = Vector2(2, 2)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(root)

	letterbox_top = _rect(Rect2(0, -40, W, 40), Color.BLACK)
	letterbox_bottom = _rect(Rect2(0, H, W, 40), Color.BLACK)

	# objective bar, top right: a header strip and the current goal; slides in when it changes
	obj_bar = Panel.new()
	obj_bar.size = Vector2(176, 30)
	obj_bar.position = Vector2(W - 184, 8)
	var ob := StyleBoxFlat.new()
	ob.bg_color = Color(0.03, 0.03, 0.04, 0.82)
	ob.border_color = Color(0.55, 0.48, 0.34)
	ob.border_width_left = 2
	ob.border_width_top = 1
	ob.border_width_bottom = 1
	ob.border_width_right = 1
	obj_bar.add_theme_stylebox_override("panel", ob)
	obj_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(obj_bar)
	var head := _label("OBJECTIVE", SERIF, 8, Color(0.85, 0.7, 0.42), obj_bar)
	head.position = Vector2(7, 2)
	var rule := ColorRect.new()
	rule.color = Color(0.55, 0.48, 0.34, 0.6)
	rule.position = Vector2(7, 13)
	rule.size = Vector2(162, 1)
	obj_bar.add_child(rule)
	objective = _label("", MONO, 9, Color(0.92, 0.9, 0.84), obj_bar)
	objective.position = Vector2(7, 15)
	objective.size = Vector2(164, 12)
	objective.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	obj_bar.modulate.a = 0.0

	# compass, top centre: heading plus markers toward the objective (never anything drawn in the world)
	compass = Compass.new()
	compass.font = MONO
	root.add_child(compass)
	compass.position = Vector2(W / 2 - 62, 6)

	# the aiming reticle (over the shoulder): a dot with four ticks, dead centre; red when it's on an enemy
	reticle = Control.new()
	reticle.size = Vector2(17, 17)
	reticle.position = Vector2(W / 2 - 8.5, H / 2 - 8.5)
	reticle.mouse_filter = Control.MOUSE_FILTER_IGNORE
	reticle.visible = false
	reticle.draw.connect(_draw_reticle)
	root.add_child(reticle)

	prompt = _label("", MONO, 10, Color(0.95, 0.95, 0.9))
	prompt.position = Vector2(W / 2 - 60, H - 30)
	prompt.size = Vector2(120, 16)
	prompt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt.visible = false
	_backing(prompt)

	captions = VBoxContainer.new()
	captions.position = Vector2(40, 230)
	captions.size = Vector2(W - 80, 100)
	captions.alignment = BoxContainer.ALIGNMENT_END
	captions.add_theme_constant_override("separation", 1)
	captions.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(captions)

	_build_dialogue_box()

	title_big = _label("", SERIF, 26, Color(0.86, 0.84, 0.8))
	title_big.size = Vector2(W, 40)
	title_big.position = Vector2(0, H / 2 - 30)
	title_big.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_big.modulate.a = 0.0
	title_small = _label("", MONO, 10, Color(0.7, 0.68, 0.62))
	title_small.size = Vector2(W, 16)
	title_small.position = Vector2(0, H / 2 + 12)
	title_small.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_small.modulate.a = 0.0

	flash_rect = _rect(Rect2(0, 0, W, H), Color.WHITE)
	flash_rect.visible = false
	fader = _rect(Rect2(0, 0, W, H), Color.BLACK)
	fader.modulate.a = 0.0
	# titles sit above the fader so they can show over black
	title_big.move_to_front()
	title_small.move_to_front()

	pause_menu = PauseMenu.new()
	root.add_child(pause_menu)

	debug = _label("", MONO, 8, Color(0.6, 1.0, 0.6))
	debug.position = Vector2(W - 150, 6)
	debug.size = Vector2(144, 40)
	debug.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

var reticle: Control
var _ret_hot := false
func show_reticle(on: bool) -> void:
	if reticle: reticle.visible = on
	if not on: _ret_hot = false

func reticle_on_target(hot: bool) -> void:
	if reticle and hot != _ret_hot:
		_ret_hot = hot
		reticle.queue_redraw()

func _draw_reticle() -> void:
	var c := Color(0.95, 0.22, 0.18, 0.95) if _ret_hot else Color(0.92, 0.9, 0.82, 0.85)
	var k := Vector2(8.5, 8.5)
	reticle.draw_rect(Rect2(k - Vector2(1, 1), Vector2(2, 2)), c)
	for d in [Vector2(1, 0), Vector2(-1, 0), Vector2(0, 1), Vector2(0, -1)]:
		reticle.draw_line(k + d * 3.5, k + d * 7.0, Color(0, 0, 0, 0.6), 3.0)
		reticle.draw_line(k + d * 3.5, k + d * 7.0, c, 1.0)

func _rect(r: Rect2, c: Color) -> ColorRect:
	var cr := ColorRect.new()
	cr.position = r.position
	cr.size = r.size
	cr.color = c
	cr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(cr)
	return cr

func _label(t: String, font: Font, size: int, col: Color, parent: Control = null) -> Label:
	var l := Label.new()
	l.text = t
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 1)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	(parent if parent else root).add_child(l)
	return l

func _backing(l: Label, alpha := 0.78) -> void:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.02, 0.02, 0.03, alpha)
	sb.border_color = Color(0.4, 0.37, 0.32, 0.9)
	sb.set_border_width_all(1)
	sb.content_margin_left = 5
	sb.content_margin_right = 5
	sb.content_margin_top = 2
	sb.content_margin_bottom = 2
	l.add_theme_stylebox_override("normal", sb)

## Dialogue box laid out like the portrait spec: the speaker's bust sits in a bottom corner with
## a name plate under it; Kenneth speaks from the left, everyone else from the right (mirrored).
var name_plate: Panel
var speaker_right := false

func _build_dialogue_box() -> void:
	box = Panel.new()
	box.position = Vector2(8, H - 92)
	box.size = Vector2(W - 16, 84)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.025, 0.025, 0.035, 0.92)
	sb.border_color = Color(0.55, 0.48, 0.34)
	sb.set_border_width_all(1)
	sb.border_width_top = 2
	sb.shadow_color = Color(0, 0, 0, 0.6)
	sb.shadow_size = 3
	box.add_theme_stylebox_override("panel", sb)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(box)
	text_label = _label("", MONO, 11, Color(0.92, 0.92, 0.88), box)
	text_label.position = Vector2(108, 10)
	text_label.size = Vector2(W - 16 - 116, 66)
	text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text_label.visible_characters_behavior = TextServer.VC_CHARS_AFTER_SHAPING
	more_arrow = _label("v", MONO, 10, Color(0.95, 0.85, 0.6), box)
	more_arrow.position = Vector2(W - 16 - 14, 84 - 14)
	more_arrow.visible = false
	portrait = TextureRect.new()
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.size = Vector2(96, 112)
	portrait.stretch_mode = TextureRect.STRETCH_SCALE
	portrait.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(portrait)
	name_plate = Panel.new()
	name_plate.size = Vector2(96, 15)
	var ps := StyleBoxFlat.new()
	ps.bg_color = Color(0.1, 0.08, 0.06, 0.97)
	ps.border_color = Color(0.62, 0.55, 0.4)
	ps.set_border_width_all(1)
	name_plate.add_theme_stylebox_override("panel", ps)
	name_plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(name_plate)
	name_label = _label("", SERIF, 10, Color(0.95, 0.85, 0.6), name_plate)
	name_label.size = Vector2(96, 15)
	name_label.position = Vector2(0, 0)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	show_box(false)

func _process(delta: float) -> void:
	var cy := (box.position.y - 120.0) if box.visible else 230.0
	if prompt.visible and prompt.text != "" and not box.visible:
		cy = 200.0   # keep captions clear of the prompt line (ammo count, use prompts)
	if not _menu:
		var p := get_tree().get_first_node_in_group("player")
		var cutscene: bool = (p != null and bool(p.get("control_locked")) and not compass.autoplay) or not Cameras._overrides.is_empty()
		obj_bar.visible = not cutscene and letterbox_top.position.y <= -39.0 and fader.modulate.a < 0.05
	captions.position.y = move_toward(captions.position.y, cy, delta * 600.0)
	if more_arrow.visible:
		more_arrow.modulate.a = 1.0 if int(Time.get_ticks_msec() / 350) % 2 == 0 else 0.25
	debug.visible = GameSettings.show_debug_hud
	if debug.visible:
		var cam := Cameras.current
		var p := get_tree().get_first_node_in_group("player") as Node3D
		debug.text = "%s\n%s\n%s" % [cam.name if cam else "-",
			GameSettings.scheme_name(),
			("%.1f %.1f %.1f" % [p.global_position.x, p.global_position.y, p.global_position.z]) if p else ""]

# ------------------------------------------------------------------ dialogue box API
func show_box(show: bool) -> void:
	box.visible = show
	portrait.visible = show and portrait.texture != null
	name_plate.visible = show and name_label.text != ""
	if show and _menu:      # a line spoken while a menu is up shows over it
		for n in [box, name_plate]: n.move_to_front()
	if not show:
		more_arrow.visible = false

func set_speaker(display_name: String, color: Color, tex: Texture2D, right_side := false) -> void:
	speaker_right = right_side
	name_label.text = display_name
	name_label.add_theme_color_override("font_color", color)
	portrait.texture = tex
	portrait.flip_h = right_side
	portrait.visible = tex != null and box.visible
	name_plate.visible = box.visible and display_name != ""
	if tex == null:
		# no portrait: the name is a tab on the box's top edge (left for Kenneth/Norah, right for everyone else)
		var tw := clampf(name_label.get_minimum_size().x + 16.0, 60.0, 160.0)
		name_plate.size = Vector2(tw, 15)
		name_label.size = name_plate.size
		name_plate.position = Vector2((box.position.x + box.size.x - 14.0 - tw) if right_side else (box.position.x + 14.0), box.position.y - 12.0)
		text_label.position = Vector2(14.0, 14.0)
		text_label.size.x = box.size.x - 28.0
		more_arrow.position.x = box.size.x - 16.0
		return
	name_plate.size = Vector2(96, 15)
	name_label.size = name_plate.size
	var px := (W - 10.0 - 96.0) if right_side else 10.0
	portrait.position = Vector2(px, H - 16.0 - 112.0)
	name_plate.position = Vector2(px, H - 17.0)
	if right_side:
		text_label.position.x = 10.0
		text_label.size.x = W - 16.0 - 10.0 - 108.0
		more_arrow.position.x = W - 16.0 - 14.0 - 104.0
	else:
		text_label.position.x = 108.0
		text_label.size.x = W - 16.0 - 108.0 - 10.0
		more_arrow.position.x = W - 16.0 - 14.0

func set_portrait(tex: Texture2D) -> void:
	if tex:
		portrait.texture = tex

## Menus, documents and pickups: the gameplay HUD (objective, prompt, reticle, captions) steps back.
var _menu := false
func menu_mode(on: bool) -> void:
	_menu = on
	obj_bar.visible = not on
	captions.visible = not on
	compass.visible = not on
	if on:
		prompt.visible = false
		if reticle: reticle.visible = false
	else:
		prompt.visible = prompt.text != ""
	if on and box.visible:
		for n in [box, name_plate]: n.move_to_front()

# ------------------------------------------------------------------ screen helpers
func fade_out(t := 1.0, col := Color.BLACK) -> void:
	fader.color = col
	await create_tween().tween_property(fader, "modulate:a", 1.0, t).finished

func fade_in(t := 1.0) -> void:
	await create_tween().tween_property(fader, "modulate:a", 0.0, t).finished

func black() -> void:
	fader.color = Color.BLACK
	fader.modulate.a = 1.0

## A hard flash that lasts a fixed number of rendered frames (the impact frame).
func flash(frames := 3, col := Color.WHITE) -> void:
	flash_rect.color = col
	flash_rect.visible = true
	for i in frames:
		await get_tree().process_frame
	flash_rect.visible = false

func letterbox(on: bool, t := 0.5) -> void:
	var tw := create_tween().set_parallel(true)
	tw.tween_property(letterbox_top, "position:y", 0.0 if on else -40.0, t)
	tw.tween_property(letterbox_bottom, "position:y", H - 36.0 if on else H, t)
	await tw.finished

func title(big: String, small := "", hold := 2.5, fade := 1.0) -> void:
	title_big.text = big
	title_small.text = small
	var tw := create_tween().set_parallel(true)
	tw.tween_property(title_big, "modulate:a", 1.0, fade)
	tw.tween_property(title_small, "modulate:a", 1.0, fade)
	await tw.finished
	await get_tree().create_timer(hold).timeout
	tw = create_tween().set_parallel(true)
	tw.tween_property(title_big, "modulate:a", 0.0, fade)
	tw.tween_property(title_small, "modulate:a", 0.0, fade)
	await tw.finished

func set_objective(t: String) -> void:
	var tw := create_tween()
	if obj_bar.modulate.a > 0.0:
		tw.tween_property(obj_bar, "modulate:a", 0.0, 0.25)
	tw.tween_callback(func():
		objective.text = t
		_fit_objective()
		obj_bar.position.x = W - obj_bar.size.x - 8 + 24)
	if t != "":
		tw.set_parallel(true)
		tw.tween_property(obj_bar, "modulate:a", 1.0, 0.5)
		tw.tween_property(obj_bar, "position:x", W - _obj_w() - 8, 0.5).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)

## A mash meter (pushing furniture): the action, the button, and a bar that fills. show_meter("", -1) hides it.
var meter: Control
var _meter_text := ""
var _meter_v := 0.0
func show_meter(text: String, v: float) -> void:
	if meter == null:
		meter = Control.new()
		meter.size = Vector2(W, H)
		meter.mouse_filter = Control.MOUSE_FILTER_IGNORE
		meter.draw.connect(_draw_meter)
		root.add_child(meter)
	_meter_text = text
	_meter_v = clampf(v, 0.0, 1.0)
	meter.visible = text != ""
	meter.queue_redraw()

func _draw_meter() -> void:
	var w := 170.0
	var r := Rect2(W / 2 - w / 2, H - 46, w, 30)
	meter.draw_rect(r.grow(2), Color(0, 0, 0, 0.6))
	meter.draw_rect(r, Color(0.04, 0.04, 0.05, 0.9))
	meter.draw_rect(r, Color(0.55, 0.48, 0.34), false, 1.0)
	var pulse := 0.6 + 0.4 * absf(sin(Time.get_ticks_msec() * 0.012))
	meter.draw_string(SERIF, r.position + Vector2(8, 13), _meter_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color(0.95, 0.85, 0.6))
	var key := "E" if not _pad() else "A"
	var kr := Rect2(r.end.x - 26, r.position.y + 3, 18, 13)
	meter.draw_rect(kr, Color(0.95, 0.8, 0.42, pulse))
	meter.draw_string(MONO, kr.position + Vector2(5, 10), key, HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.1, 0.06, 0.03))
	var bar := Rect2(r.position.x + 8, r.position.y + 19, w - 16, 6)
	meter.draw_rect(bar, Color(0.12, 0.1, 0.08))
	meter.draw_rect(Rect2(bar.position, Vector2(bar.size.x * _meter_v, bar.size.y)), Color(0.85, 0.5, 0.25))
	for k in range(1, 10):
		meter.draw_rect(Rect2(bar.position.x + bar.size.x * k / 10.0, bar.position.y, 1, bar.size.y), Color(0, 0, 0, 0.35))

var _pad_last := false
func _input(e: InputEvent) -> void:
	if e is InputEventJoypadButton or e is InputEventJoypadMotion: _pad_last = true
	elif e is InputEventKey or e is InputEventMouseButton: _pad_last = false
func _pad() -> bool:
	return _pad_last

## The objective panel grows to fit its text: wider first (up to 236), then a second line.
func _obj_w() -> float:
	var tw := MONO.get_string_size(objective.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 9).x
	return clampf(tw + 18.0, 150.0, 172.0)          # stays clear of the compass; long goals wrap to two lines
func _fit_objective() -> void:
	var w := _obj_w()
	var tw := MONO.get_string_size(objective.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 9).x
	var lines := maxi(1, int(ceil(tw / (w - 16.0))))
	obj_bar.size = Vector2(w, 18.0 + 11.0 * lines)
	objective.size = Vector2(w - 12.0, 11.0 * lines + 1.0)
	obj_bar.get_child(1).size.x = w - 14.0       # the rule under OBJECTIVE

func show_prompt(t: String) -> void:
	prompt.text = t
	prompt.size = Vector2.ZERO
	prompt.position.x = W / 2 - prompt.get_minimum_size().x / 2
	prompt.visible = t != ""

## A one-line subtitle with no box: crowd voices, shouts during gameplay.
func caption(text: String, who := "", color := Color(0.9, 0.9, 0.85), seconds := 2.6) -> void:
	var l := _label(("%s: %s" % [who, text]) if who != "" else text, MONO, 10, color, captions)
	_backing(l)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	# short lines get a box that fits them; long ones wrap at the full caption width
	var txt_w := MONO.get_string_size(l.text, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x + 12.0
	if txt_w < W - 80:
		l.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	else:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(W - 80, 0)
	while captions.get_child_count() > 4:
		captions.get_child(0).free()
	var tw := l.create_tween()
	tw.tween_interval(seconds)
	tw.tween_property(l, "modulate:a", 0.0, 0.5)
	tw.tween_callback(l.queue_free)

func clear_captions() -> void:
	for c in captions.get_children():
		c.queue_free()

func show_end_card(lines: PackedStringArray) -> void:
	end_card = Control.new()
	end_card.size = Vector2(W, H)
	root.add_child(end_card)
	var y := H / 2 - lines.size() * 9.0
	for i in lines.size():
		var l := _label(lines[i], SERIF if i == 0 else MONO, 20 if i == 0 else 10, Color(0.86, 0.84, 0.8) if i == 0 else Color(0.65, 0.63, 0.58), end_card)
		l.size = Vector2(W, 24)
		l.position = Vector2(0, y)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		y += 30.0 if i == 0 else 16.0
	end_card.modulate.a = 0.0
	create_tween().tween_property(end_card, "modulate:a", 1.0, 1.5)

func reset() -> void:
	show_meter("", -1)
	if pause_menu and pause_menu.open: pause_menu.hide_menu()
	show_box(false)
	show_prompt("")
	clear_captions()
	objective.text = ""
	obj_bar.modulate.a = 0.0
	fader.modulate.a = 0.0
	if end_card:
		end_card.queue_free()
		end_card = null
