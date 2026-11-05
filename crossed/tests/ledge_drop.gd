extends Node3D
## Ledge drop: Norah walks off a 0.6 m stage (like the chapel's), lands hard and is stunned for a moment;
## then she walks down the stage's steps, which must NOT stun her. Writes tests/captures/ledge_*.png and prints the results.
var player: Player
var cam: Camera3D
var hard := []

func _ready() -> void:
	var env := WorldEnvironment.new(); env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR; env.environment.background_color = Color(0.16, 0.17, 0.2)
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.environment.ambient_light_color = Color(0.7, 0.7, 0.75)
	add_child(env)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-50, 30, 0); add_child(sun)
	_box(Vector3(0, -0.05, 0), Vector3(20, 0.1, 20), Color(0.3, 0.32, 0.26))           # the floor
	_box(Vector3(0, 0.3, -2.0), Vector3(6, 0.6, 4), Color(0.35, 0.24, 0.16))           # the stage, front edge at z = 0
	# steps at the right front corner, going down toward +z, with the ramp the builder gives them
	for i in range(1, 3):
		var hh := 0.6 * (3 - i) / 3.0
		_box(Vector3(2.4, hh / 2, (i - 0.5) * 0.35), Vector3(1.0, hh, 0.35), Color(0.8, 0.78, 0.72), false)
	var ramp := StaticBody3D.new(); var cs := CollisionShape3D.new(); var sh := BoxShape3D.new(); sh.size = Vector3(1.0, 0.1, sqrt(0.36 + 0.49) + 0.2); cs.shape = sh; ramp.add_child(cs)
	ramp.position = Vector3(2.4, 0.27, 0.35); ramp.rotation_degrees.x = rad_to_deg(atan2(0.6, 0.7)); add_child(ramp)
	player = (load("res://scenes/characters/player.tscn") as PackedScene).instantiate()
	add_child(player)
	(player.get_node("Visual") as CharacterModel).set("model_id", "norah")
	player.landed_hard.connect(func(d): hard.append(d))
	cam = Camera3D.new(); add_child(cam); cam.current = true; cam.fov = 50
	await get_tree().process_frame
	# 1) off the front edge
	player.place(Vector3(0, 0.62, -1.2), 180)        # facing +z, toward the edge
	cam.position = Vector3(4.2, 1.4, 0.6); cam.look_at(Vector3(0, 0.6, 0.2), Vector3.UP)
	for i in 20: await get_tree().physics_frame
	Input.action_press("move_forward")
	var t := 0.0; var shots := {0.62: "walk", 0.8: "air", 0.9: "air2", 1.05: "impact", 1.35: "dazed", 1.75: "rise"}
	var done := {}
	var locked_at := -1.0; var free_at := -1.0
	while t < 2.8:
		await get_tree().physics_frame
		t += get_physics_process_delta_time()
		if hard.size() > 0 and locked_at < 0: locked_at = t
		if locked_at > 0 and free_at < 0 and not player.locked(): free_at = t
		for k in shots:
			if t >= k and not done.has(k):
				done[k] = true
				await RenderingServer.frame_post_draw
				get_viewport().get_texture().get_image().save_png("res://tests/captures/ledge_%s.png" % shots[k])
	Input.action_release("move_forward")
	print("[ledge] front edge: hard landings %s, stunned for %.2f s, ended at y=%.2f" % [str(hard), free_at - locked_at, player.global_position.y])
	# 2) down the steps: no stun
	var before := hard.size()
	player.place(Vector3(2.4, 0.62, -1.0), 180)
	for i in 20: await get_tree().physics_frame
	Input.action_press("move_forward")
	t = 0.0
	while t < 2.2:
		await get_tree().physics_frame
		t += get_physics_process_delta_time()
	Input.action_release("move_forward")
	print("[ledge] down the steps: hard landings %d (want 0), ended at y=%.2f z=%.2f" % [hard.size() - before, player.global_position.y, player.global_position.z])
	get_tree().quit()

func _box(pos: Vector3, size: Vector3, col: Color, collide := true) -> void:
	var mi := MeshInstance3D.new(); var bm := BoxMesh.new(); bm.size = size; mi.mesh = bm
	var m := StandardMaterial3D.new(); m.albedo_color = col; mi.material_override = m; mi.position = pos; add_child(mi)
	if collide:
		var sb := StaticBody3D.new(); var cs := CollisionShape3D.new(); var sh := BoxShape3D.new(); sh.size = size; cs.shape = sh; sb.add_child(cs); sb.position = pos; add_child(sb)
