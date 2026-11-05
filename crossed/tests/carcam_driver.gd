extends Node3D
## Renders the in-car cameras with the three seated models. xvfb-run godot --path . res://tests/carcam.tscn

const SEATS := [["kenneth", Vector3(199.62, -200, 200.0), "sit_drive"], ["stranger", Vector3(199.92, -200, 200.98), "sit_beg"], ["adaline", Vector3(200.45, -200, 200.98), "sit_scared"]]

func _ready() -> void:
	var anims := {}
	var tag := ""
	for a in OS.get_cmdline_user_args():
		if a.contains("="):
			var kv := a.split("=")
			if kv[0] == "tag": tag = kv[1]
			else: anims[kv[0]] = kv[1]
	var level: Node3D = load("res://scenes/environments/community_center.tscn").instantiate()
	add_child(level)
	for s in SEATS:
		var m := CharacterModel.new()
		m.model_id = s[0]
		m.start_animation = anims.get(s[0], s[2])
		m.start_offset_random = false
		add_child(m)
		m.global_position = s[1]
	for c in ["CamCarMirror", "CamCarFront", "CamCarKenneth", "CamCarAdaline"]:
		var cam := find_child(c, true, false) as Camera3D
		cam.make_current()
		for i in 8:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png("res://tests/captures/car%s_%s.png" % [tag, c])
	get_tree().quit()
