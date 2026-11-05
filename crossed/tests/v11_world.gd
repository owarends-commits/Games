extends Node
## v11 world check: forest, the new road, houses, floors and textures. Writes tests/captures/v11_*.png
## A debug sun is added so textures can be judged (the real game is night).
var world: SubViewport
var cam: Camera3D
func _ready() -> void:
	var root: Node = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	root.set_script(null)
	add_child(root)
	world = root.get_node("Screen/World")
	var player := world.get_node("Player") as Node3D
	player.set_physics_process(false)
	player.global_position = Vector3(0, -80, 0)
	cam = Camera3D.new(); cam.fov = 60; cam.far = 400.0
	world.add_child(cam)
	var sun := DirectionalLight3D.new(); sun.light_energy = 0.9; sun.rotation_degrees = Vector3(-50, 30, 0)
	world.add_child(sun)
	var lamp := OmniLight3D.new(); lamp.omni_range = 9.0; lamp.light_energy = 1.5; cam.add_child(lamp)
	await get_tree().process_frame
	var shots := [
		["aerial_cds", Vector3(10, 60, 20), Vector3(10, 0, 60)],
		["aerial_road", Vector3(-30, 70, 120), Vector3(12, 0, 180)],
		["road_low", Vector3(11, 1.6, 120), Vector3(13, 1.5, 160)],
		["pruitt", Vector3(14, 2.0, 135), Vector3(40, 2, 154)],
		["forest_in", Vector3(-20, 1.7, 70), Vector3(-30, 2.5, 90)],
		["yard", Vector3(4.5, 2.4, 22), Vector3(-6, 1, 2)],
		["lane", Vector3(1, 1.7, 44), Vector3(1, 0.5, 20)],
		["west_house", Vector3(-20, 3.0, 26), Vector3(-40, 1.5, 8)],
		["living", Vector3(-7.6, 1.5, 1.6), Vector3(-3.5, 0, -2.5)],
		["bath", Vector3(-9.2, 1.6, -0.2), Vector3(-10.5, 0, -3.5)],
		["addie", Vector3(-8.8, 1.6, 2.4), Vector3(-11.5, 0, 6.0)],
		["bedroom", Vector3(-12.8, 1.6, 2.2), Vector3(-15.5, 0, -2.0)],
		["louis_main", Vector3(24.5, 1.6, -11.5), Vector3(31, 0, -8)],
		["louis_bath", Vector3(27.3, 1.6, -4.0), Vector3(28.5, 0, -7.0)],
		["up_kitchen", Vector3(70.3, 1.6, -2.3), Vector3(73.5, 0, -6.5)],
		["porch", Vector3(-1.0, 1.6, 4.0), Vector3(-3.0, 0.2, 0.0)],
	]
	for s in shots:
		cam.global_position = s[1]
		cam.look_at(s[2], Vector3.UP)
		cam.make_current()
		for i in 5: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		world.get_texture().get_image().save_png("res://tests/captures/v11_%s.png" % s[0])
	print("[v11] done")
	get_tree().quit()
