extends Node3D
## Character lineup (v11 check): every cast member side by side, front, 3/4 and close-ups. Writes tests/captures/lineup_*.png
func _ready() -> void:
	var vp := SubViewport.new(); vp.size = Vector2i(960, 480); vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var env := Environment.new(); env.background_mode = Environment.BG_COLOR; env.background_color = Color(0.22, 0.23, 0.26)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.ambient_light_color = Color(0.6, 0.6, 0.65); env.ambient_light_energy = 0.7
	var we := WorldEnvironment.new(); we.environment = env; vp.add_child(we)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-40, 25, 0); sun.light_energy = 1.1; vp.add_child(sun)
	var ids := ["norah", "kenneth", "adaline", "stranger", "rachel", "marcus", "denise", "dad2", "mom2", "dad3", "amelia", "kid_boy", "kid_girl", "louis"]
	var models := []
	for i in ids.size():
		var m := CharacterModel.new(); m.model_id = ids[i]
		vp.add_child(m); m.position = Vector3((i - ids.size() / 2.0) * 0.85, 0, 0); m.rotation_degrees.y = 180
		models.append(m)
	var cam := Camera3D.new(); vp.add_child(cam); cam.fov = 40
	await get_tree().process_frame
	for m in models: m.play("idle", 0.0)
	var views := [["front", Vector3(0, 1.1, 9.5), Vector3(0, 0.9, 0)], ["back", Vector3(0, 1.1, -9.5), Vector3(0, 0.9, 0)],
		["left_34", Vector3(-4.2, 1.5, 3.2), Vector3(-3.0, 1.0, 0)], ["right_34", Vector3(4.2, 1.5, 3.2), Vector3(3.0, 1.0, 0)],
		["faces_a", Vector3(-4.25, 1.55, 2.2), Vector3(-4.25, 1.45, 0)], ["faces_b", Vector3(-1.7, 1.55, 2.2), Vector3(-1.7, 1.45, 0)]]
	for v in views:
		cam.global_position = v[1]; cam.look_at(v[2], Vector3.UP)
		for i in 6: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		vp.get_texture().get_image().save_png("res://tests/captures/lineup_%s.png" % v[0])
	for m in models: m.play("run", 0.0)
	cam.global_position = Vector3(-2.5, 1.2, 5.0); cam.look_at(Vector3(-2.5, 0.9, 0), Vector3.UP)
	for i in 14: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	vp.get_texture().get_image().save_png("res://tests/captures/lineup_run.png")
	print("[lineup] done")
	get_tree().quit()
