extends Node
## Road check: a slow dolly along Norah's lane and through the cul-de-sac at night, frames saved for flicker/z-fighting.
func _ready() -> void:
	var root: Node = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	root.set_script(null)
	add_child(root)
	var world: SubViewport = root.get_node("Screen/World")
	(world.get_node("Player") as Node3D).set_physics_process(false)
	(world.get_node("Player") as Node3D).global_position = Vector3(0, -80, 0)
	var cam := Camera3D.new(); cam.fov = 60; cam.far = 150; cam.near = 0.05
	cam.environment = load("res://environments/env_norah_yard.tres")
	world.add_child(cam)
	var lamp := OmniLight3D.new(); lamp.omni_range = 30.0; lamp.light_energy = 2.0; cam.add_child(lamp)
	await get_tree().process_frame
	var k := 0
	for path in [[Vector3(1.0, 1.3, 14.0), Vector3(1.0, 1.3, 40.0), Vector3(0.6, 0.2, 60.0)], [Vector3(10.5, 1.6, 70.0), Vector3(10.5, 1.6, 50.0), Vector3(6.0, 0.0, 40.0)],
			[Vector3(13.0, 1.6, 120.0), Vector3(13.0, 1.6, 100.0), Vector3(11.0, 0.0, 70.0)]]:
		for i in 6:
			var t := i / 5.0
			cam.global_position = (path[0] as Vector3).lerp(path[1], t)
			cam.look_at(cam.global_position + ((path[2] as Vector3) - (path[0] as Vector3)).normalized() * 10.0 + Vector3(0, -2.0, 0), Vector3.UP)
			cam.make_current()
			for j in 3: await get_tree().process_frame
			await RenderingServer.frame_post_draw
			world.get_texture().get_image().save_png("res://tests/captures/road_%02d.png" % k)
			k += 1
	print("[road] done")
	get_tree().quit()
