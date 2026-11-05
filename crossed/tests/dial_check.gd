extends Node
## The combination dial: dials 6-1-2 with presses, screenshots it, opens it. tests/captures/dial_*.png
var d: Node
func _ready() -> void:
	d = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	add_child(d)
	await _secs(4.0)
	var res := [null]
	var run := func(): res[0] = await d._dial("LOCKBOX", d.LOCK_CODE, true)
	run.call()
	await _secs(0.5)
	for k in 6: await _press("move_forward")
	await _press("move_right")
	await _press("move_forward")
	await _press("move_right")
	await _press("move_back"); await _press("move_back")
	await _secs(0.3)
	await _snap("dial_wrong")
	await _press("move_forward"); await _press("move_forward"); await _press("move_forward"); await _press("move_forward")
	await _secs(0.3)
	await _snap("dial_right")
	await _press("interact")
	await _secs(1.0)
	print("[dial] opened: ", res[0], "  paused: ", get_tree().paused)
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
