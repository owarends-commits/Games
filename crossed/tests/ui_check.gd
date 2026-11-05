extends Node
## The items screen and dialogue box, driven with simulated presses. Writes tests/captures/ui_*.png and prints checks.
##   xvfb-run godot --path . --rendering-driver opengl3 res://tests/ui_check.tscn -- start=louis
var d: Node
var n := 0

func _ready() -> void:
	d = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	add_child(d)
	await _secs(4.0)
	d.inv = {"revolver": 1, "ammo": 7, "flashlight": 1, "battery_half": 1, "medicine": 2, "rosary": 1}
	d.loaded = 2
	d.light_charge = 40.0
	for k in ["lockbox_code", "safe_code", "truck_keys"]: d._key(k, false)
	for f in ["journal", "photo_birthday", "broadcast", "bible_journal", "rose_photo", "storm_photo", "rosary"]: d._file(f, false)
	if d.combat: d.combat.health = d.combat.max_health * 0.45
	HUD.clear_captions()
	d._toggle_inventory()
	await _secs(1.0)
	print("[ui] paused while open: ", get_tree().paused)
	await _snap("items")
	await _press("move_right"); await _press("move_right")
	await _snap("items_cursor")
	await _press("move_left"); await _press("move_left")
	await _press("interact")
	await _secs(0.4)
	await _snap("menu")
	await _press("interact")          # Reload
	await _secs(0.3)
	await _snap("reload")
	print("[ui] loaded after reload: ", d.loaded, "  spare: ", d.inv.get("ammo", 0))
	# combine: battery onto the flashlight
	await _press("move_right"); await _press("move_right"); await _press("move_right")
	await _press("interact")
	await _secs(0.3)
	await _snap("menu_battery")
	await _press("interact")
	await _secs(0.3)
	await _snap("battery")
	print("[ui] light after battery: ", d.light_charge, "  half battery left: ", d.inv.has("battery_half"))
	await _press("menu_next")
	await _secs(0.5)
	await _snap("keys")
	await _press("menu_next")
	await _secs(0.5)
	await _snap("files")
	await _press("move_back")
	await _press("interact")
	await _secs(0.8)
	await _snap("files_read")
	await _press("interact"); await _press("interact"); await _press("interact"); await _press("interact"); await _press("interact")
	await _secs(0.5)
	await _press("inventory")
	await _secs(0.5)
	print("[ui] paused after close: ", get_tree().paused, "  open: ", d._inv_open)
	# the dialogue box without portraits
	Dialogue.say_line("norah", "The box without a portrait: the name sits on a tab and the text uses the whole width.", "neutral")
	await _secs(2.5)
	await _snap("dialogue_norah")
	await _secs(3.0)
	Dialogue.say_line("louis", "Norah... get inside.", "scared")
	await _secs(1.2)
	HUD.caption("A caption while the box is up moves above it.", "", Color(0.9, 0.9, 0.85), 3.0)
	await _secs(0.6)
	await _snap("dialogue_louis")
	print("[ui] done")
	get_tree().quit()

func _secs(t: float) -> void:
	var end := Time.get_ticks_msec() + int(t * 1000.0)
	while Time.get_ticks_msec() < end:
		await get_tree().process_frame

func _press(a: String) -> void:
	var e := InputEventAction.new()
	e.action = a
	e.pressed = true
	Input.parse_input_event(e)
	await get_tree().process_frame
	await get_tree().process_frame
	var r := InputEventAction.new()
	r.action = a
	r.pressed = false
	Input.parse_input_event(r)
	await get_tree().process_frame
	await get_tree().process_frame

func _snap(tag: String) -> void:
	await RenderingServer.frame_post_draw
	n += 1
	get_viewport().get_texture().get_image().save_png("res://tests/captures/ui_%02d_%s.png" % [n, tag])
