extends Node
## Frames of the revolver recoil and of Louis taking a round. Writes tests/captures/recoil_*.png
func _ready() -> void:
	var root: Node = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	root.set_script(null)
	add_child(root)
	var world: SubViewport = root.get_node("Screen/World")
	var player := world.get_node("Player") as Node3D
	player.set_physics_process(false)
	player.set_process(false)
	var model := player.get_node("Visual") as CharacterModel
	model.set("model_id", "norah")
	var louis := world.get_node("Actors/Louis") as Node3D
	var lm := louis as CharacterModel
	var cam := Camera3D.new()
	cam.fov = 55
	world.add_child(cam)
	var lamp := OmniLight3D.new()
	lamp.omni_range = 8.0
	lamp.light_energy = 2.5
	cam.add_child(lamp)
	await get_tree().process_frame
	player.global_position = Vector3(1.5, 0, 8.0)
	player.rotation.y = 0.0
	louis.visible = true
	louis.global_position = Vector3(1.5, 0, 5.0)
	louis.rotation.y = 0.0
	cam.make_current()
	for a in [[model, "fire", 0.0], [model, "fire", 0.05], [model, "fire", 0.15], [model, "fire", 0.4], [model, "fire", 0.77],
			[lm, "hit", 0.0], [lm, "hit", 0.12], [lm, "hit", 0.45], [lm, "hit", 0.7]]:
		var m: CharacterModel = a[0]
		m.play(a[1], 0.0)
		m.anim.seek(a[2], true)
		m.anim.pause()
		cam.global_position = Vector3(-2.2, 1.4, 6.6)
		cam.look_at(Vector3(1.5, 0.8, 6.4), Vector3.UP)
		cam.make_current()
		for i in 4: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		world.get_texture().get_image().save_png("res://tests/captures/recoil_%s_%03d.png" % [a[1], int(a[2] * 100)])
		m.anim.play()
	print("[recoil] done")
	get_tree().quit()
