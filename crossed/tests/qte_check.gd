extends Node
## The dodge prompt at the house strike. -- start=sprint [press]   (press: hit the button in time; otherwise miss)
## Writes tests/captures/qte_*.png
var d: Node
func _ready() -> void:
	d = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	add_child(d)
	var press := "press" in OS.get_cmdline_user_args()
	await _secs(4.0)
	var p: Node3D = d.player
	p.global_position = d.STRIKE_SPOT + Vector3(1.5, 0, 0.8)      # close enough: the strike starts
	while Engine.time_scale > 0.99:
		await get_tree().process_frame
	await _secs(0.35)
	await _snap("prompt")
	if press:
		var e := InputEventAction.new(); e.action = "interact"; e.pressed = true; Input.parse_input_event(e)
		await get_tree().process_frame; await get_tree().process_frame
		var r := InputEventAction.new(); r.action = "interact"; r.pressed = false; Input.parse_input_event(r)
	await _secs(0.15)
	await _snap("result_" + ("press" if press else "miss"))
	await _secs(1.6)
	await _snap("after_" + ("press" if press else "miss"))
	if not press:
		await _secs(2.6)
		await _snap("died")
		print("[qte] dead: ", d.dead, "  resume at: ", d.resume_at)
	print("[qte] health: ", d.combat.health if d.combat else -1.0, "  time_scale: ", Engine.time_scale)
	get_tree().quit()

func _secs(t: float) -> void:
	var end := Time.get_ticks_msec() + int(t * 1000.0)
	while Time.get_ticks_msec() < end:
		await get_tree().process_frame

func _snap(tag: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/qte_%s.png" % tag)
