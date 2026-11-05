extends Node3D
## Poses side by side for review: -- poses=louis:brood:0,louis:stride:0.25,norah:duck:0.4 out=name view=front|side|q
func _ready() -> void:
	var poses := "louis:brood:0,louis:stride:0.25,louis:brute_swing:0.62,norah:duck:0.4"
	var out := "poses"; var view := "front"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("poses="): poses = a.substr(6)
		if a.begins_with("out="): out = a.substr(4)
		if a.begins_with("view="): view = a.substr(5)
	var list := poses.split(",")
	var vp := SubViewport.new(); vp.size = Vector2i(1200, 600); vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var env := Environment.new(); env.background_mode = Environment.BG_COLOR; env.background_color = Color(0.32, 0.34, 0.38)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.ambient_light_color = Color(0.8, 0.8, 0.8); env.ambient_light_energy = 0.9
	var we := WorldEnvironment.new(); we.environment = env; vp.add_child(we)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-40, 30, 0); vp.add_child(sun)
	var ms := []
	for i in list.size():
		var q := list[i].split(":")
		var m := CharacterModel.new(); m.model_id = q[0]; m.start_animation = q[1]; m.start_offset_random = false
		vp.add_child(m); m.position = Vector3((i - (list.size() - 1) / 2.0) * 1.3, 0, 0)
		m.rotation_degrees.y = {"front": 0.0, "side": -90.0, "q": -40.0, "face": 180.0, "qface": 140.0, "lside": 90.0}[view]
		ms.append([m, float(q[2])])
	var c := Camera3D.new(); c.fov = 34; vp.add_child(c)
	var cp := Vector3(0, 1.1, 7.6); var ct := Vector3(0, 0.95, 0)
	for a in OS.get_cmdline_user_args():
		if a.begins_with("cam="):
			var q := a.substr(4).split(",")
			cp = Vector3(float(q[0]), float(q[1]), float(q[2])); ct = Vector3(float(q[3]), float(q[4]), float(q[5]))
	c.position = cp; c.look_at(ct)
	for f in 4: await get_tree().process_frame
	for e in ms:
		var m: CharacterModel = e[0]
		if m.anim: m.anim.seek(e[1], true); m.anim.pause()
	for f in 4: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	vp.get_texture().get_image().save_png("res://tests/captures/%s.png" % out)
	get_tree().quit()
