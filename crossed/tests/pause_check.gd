extends Node
## The pause menu: opens on Esc, pauses, the settings change, closes. tests/captures/pause_*.png
var d: Node
func _ready() -> void:
	d = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	add_child(d)
	await _secs(4.0)
	await _press("pause")
	await _secs(0.4)
	print("[pause] open: ", HUD.pause_menu.open, "  paused: ", get_tree().paused)
	await _snap("pause_main")
	await _press("move_back"); await _press("move_back"); await _press("interact")
	await _secs(0.3)
	var before: float = GameSettings.mouse_sensitivity
	await _press("move_back"); await _press("move_right"); await _press("move_right")
	await _snap("pause_settings")
	print("[pause] mouse speed ", before, " -> ", GameSettings.mouse_sensitivity)
	await _press("menu_back")
	await _press("move_forward"); await _press("move_forward"); await _press("move_forward"); await _press("move_forward")   # Controls
	await _press("interact")
	await _secs(0.3)
	await _snap("pause_controls")
	await _press("menu_back"); await _press("menu_back")
	await _secs(0.3)
	print("[pause] closed: ", not HUD.pause_menu.open, "  paused: ", get_tree().paused)
	GameSettings.mouse_sensitivity = before
	GameSettings.save_settings()
	get_tree().quit()

func _secs(t: float) -> void:
	var end := Time.get_ticks_msec() + int(t * 1000.0)
	while Time.get_ticks_msec() < end: await get_tree().process_frame

func _press(a: String) -> void:
	var e := InputEventAction.new(); e.action = a; e.pressed = true; Input.parse_input_event(e)
	await get_tree().process_frame; await get_tree().process_frame
	var r := InputEventAction.new(); r.action = a; r.pressed = false; Input.parse_input_event(r)
	await get_tree().process_frame; await get_tree().process_frame

func _snap(tag: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/%s.png" % tag)
