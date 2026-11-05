extends Node3D
## Talking check: a face close-up mid-word (jaw open) and full-body gestures for several moods.
func _ready() -> void:
	var id := "norah"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("id="): id = a.substr(3)
	var vp := SubViewport.new(); vp.size = Vector2i(1500, 500); vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var env := Environment.new(); env.background_mode = Environment.BG_COLOR; env.background_color = Color(0.32, 0.34, 0.38)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.ambient_light_color = Color(0.8, 0.8, 0.8); env.ambient_light_energy = 0.8
	var we := WorldEnvironment.new(); we.environment = env; vp.add_child(we)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-35, 20, 0); vp.add_child(sun)
	var moods := ["closed", "open", "neutral", "angry", "scared", "cry", "happy"]
	var ms := []
	for i in moods.size():
		var m := CharacterModel.new(); m.model_id = id; m.start_animation = "idle"; m.start_offset_random = false
		vp.add_child(m)
		m.position = Vector3((i - 3) * 0.9, 0, 0)
		m.rotation_degrees.y = 180
		ms.append(m)
	for f in 3: await get_tree().process_frame
	for i in moods.size():
		var m: CharacterModel = ms[i]
		if moods[i] == "closed": continue
		m.talk.begin("neutral" if moods[i] == "open" else moods[i])
		m.talk.mouth(1.0, 1.0)
	var c := Camera3D.new(); c.fov = 34; vp.add_child(c); c.position = Vector3(0, 1.0, 7.0); c.look_at(Vector3(0, 0.95, 0))
	for f in 40: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	vp.get_texture().get_image().save_png("res://tests/captures/talk_%s_body.png" % id)
	# faces: closed vs open
	vp.size = Vector2i(800, 400)
	for i in moods.size(): ms[i].visible = i < 2
	c.fov = 22; c.position = Vector3(-1.8 * 0.5 - 0.45, 1.58, 1.4); c.look_at(Vector3(-1.8 * 0.5 - 0.45, 1.56, 0))
	for f in 6: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	vp.get_texture().get_image().save_png("res://tests/captures/talk_%s_face.png" % id)
	get_tree().quit()
