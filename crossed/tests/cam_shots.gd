extends Node
## Renders every map camera with the player standing in its zone (map check). Writes tests/captures/map_<cam>.png
func _ready() -> void:
	var ps: PackedScene = load("res://scenes/chapter1/chapter1.tscn")
	var root := ps.instantiate()
	root.set_script(null)
	add_child(root)
	var world: SubViewport = root.get_node("Screen/World")
	var player := world.get_node("Player") as Node3D
	var lay = JSON.parse_string(FileAccess.open("res://data/ch1_layout.json", FileAccess.READ).get_as_text())
	(player.get_node("Visual") as Node).set("model_id", "norah")
	var only := ""
	for a in OS.get_cmdline_user_args():
		if a.begins_with("cam="): only = a.substr(4)
	await get_tree().process_frame
	var cams := world.get_node("Cams")
	for c in cams.get_children():
		if not (c is Camera3D): continue
		if only != "" and not c.name.begins_with(only): continue
		var z = lay["zones"].get(c.name)
		var spot := Vector3(2.43, 0, 3.17)
		if z: spot = Vector3((z[0][0] + z[0][1]) / 2.0, 0, (z[0][2] + z[0][3]) / 2.0)
		player.global_position = spot
		(c as Camera3D).make_current()
		for i in 4: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var img := world.get_texture().get_image()
		img.save_png("res://tests/captures/map_%s.png" % c.name)
	print("[shots] done")
	get_tree().quit()
