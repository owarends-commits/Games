extends Node3D
## Full-length front and side renders of Norah and Louis, to judge leg proportions.
func _ready() -> void:
	var ids := ["norah", "norah_worn", "louis"]
	for view in ["front", "side"]:
		var vp := SubViewport.new(); vp.size = Vector2i(720, 600); vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		add_child(vp)
		var env := Environment.new(); env.background_mode = Environment.BG_COLOR; env.background_color = Color(0.32, 0.34, 0.38)
		env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.ambient_light_color = Color(0.8, 0.8, 0.8); env.ambient_light_energy = 0.9
		var we := WorldEnvironment.new(); we.environment = env; vp.add_child(we)
		var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-40, 30, 0); vp.add_child(sun)
		for i in ids.size():
			var m := CharacterModel.new(); m.model_id = ids[i]; m.start_animation = "idle"; m.start_offset_random = false
			vp.add_child(m); m.position = Vector3((i - 1) * 0.9, 0, 0)
			m.rotation_degrees.y = 180 if view == "front" else 90
		var c := Camera3D.new(); c.fov = 30; vp.add_child(c); c.position = Vector3(0, 1.0, 5.4); c.look_at(Vector3(0, 0.95, 0))
		for f in 8: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		vp.get_texture().get_image().save_png("res://tests/captures/legs_%s.png" % view)
	get_tree().quit()
