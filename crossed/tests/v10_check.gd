extends Node
## v10 visual checks: Norah on the car and truck seats, the truck camera, the new animations, floors and roads up close.
## Writes tests/captures/v10_*.png
var world: SubViewport
var cam: Camera3D

func _ready() -> void:
	var ps: PackedScene = load("res://scenes/chapter1/chapter1.tscn")
	var root := ps.instantiate()
	root.set_script(null)
	add_child(root)
	world = root.get_node("Screen/World")
	var player := world.get_node("Player") as Node3D
	player.set_physics_process(false)
	player.set_process(false)
	var model := player.get_node("Visual") as CharacterModel
	model.set("model_id", "norah")
	cam = Camera3D.new()
	cam.fov = 55
	world.add_child(cam)
	var lamp := OmniLight3D.new()
	lamp.omni_range = 6.0
	lamp.light_energy = 2.5
	cam.add_child(lamp)
	await get_tree().process_frame
	var map := world.get_node("Map")
	# --- seats: a side view through the driver's window
	for vn in ["DriveCar", "Truck"]:
		var v := map.find_child(vn, true, false) as Node3D
		if v == null:
			v = world.find_child(vn, true, false) as Node3D
		var n := v.get_node("Norah") as CharacterModel
		n.visible = true
		n.play("sit_drive", 0.0)
		for s in v.get_children():
			if s.name.begins_with("Door") or s.name.contains("DoorL"):
				(s as Node3D).visible = false
		var side := -v.global_transform.basis.x
		cam.global_position = v.global_position + side * 2.6 + Vector3(0, 1.3, 0)
		cam.look_at(v.global_position + Vector3(0, 0.9, 0) + side * 0.4, Vector3.UP)
		await _shot("seat_%s" % vn)
		cam.near = 0.02
		cam.global_position = v.global_position - side * 0.55 + Vector3(0, (1.15 if vn == "DriveCar" else 1.45), 0) - v.global_transform.basis.z * 0.5
		cam.look_at(n.global_position + Vector3(0, 0.55, 0), Vector3.UP)
		await _shot("seat_%s_top" % vn)
		n.visible = false
	# --- the truck camera, with Norah walking up to the driver's door
	var trk := world.find_child("Truck", true, false) as Node3D
	var tc := world.get_node("Cams/CAM_12") as Camera3D
	player.global_position = trk.global_position - trk.global_transform.basis.x * 4.5 + Vector3(0, 0, 0)
	model.play("walk", 0.0)
	tc.make_current()
	for i in 20: await get_tree().process_frame
	await _shot("cam_truck", false)
	player.global_position = trk.global_position - trk.global_transform.basis.x * 1.5
	for i in 20: await get_tree().process_frame
	await _shot("cam_truck_door", false)
	cam.make_current()
	# --- animations on the lawn by her house
	player.global_position = Vector3(1.5, 0, 8.0)
	player.rotation.y = 0.0
	for a in [["run", 0.15], ["run", 0.45], ["search", 0.6], ["search_low", 0.5], ["melee", 0.13], ["melee", 0.24], ["dodge", 0.25],
			["reload", 0.3], ["reload", 0.7], ["aim", 0.5], ["fire", 0.05], ["hurt", 0.1]]:
		model.play(a[0], 0.0)
		model.anim.seek(a[1], true)
		model.anim.pause()
		cam.global_position = player.global_position + Vector3(-3.2, 1.2, 0.0)
		cam.look_at(player.global_position + Vector3(0, 0.85, 0), Vector3.UP)
		await _shot("anim_%s_%02d_side" % [a[0], int(a[1] * 100)])
		cam.global_position = player.global_position + Vector3(-1.9, 1.4, -2.6)
		cam.look_at(player.global_position + Vector3(0, 0.85, 0), Vector3.UP)
		await _shot("anim_%s_%02d_34" % [a[0], int(a[1] * 100)])
		model.anim.play()
	# --- floors and roads at grazing angles (where the shimmer showed)
	player.global_position = Vector3(0, -50, 0)
	for f in [["floor_living", Vector3(-7.5, 1.5, 1.5), Vector3(-3.5, 0, -1.5)], ["floor_kitchen", Vector3(-7.0, 1.4, 6.0), Vector3(-3.0, 0, 2.5)],
			["floor_louis", Vector3(24.5, 1.6, -11.5), Vector3(31, 0, -8)], ["road_ring", Vector3(10.5, 1.6, 47.0), Vector3(22, 0, 58)],
			["road_lane", Vector3(1.0, 1.6, 22.0), Vector3(1.5, 0, 10.0)], ["drive_louis", Vector3(27, 1.6, 10), Vector3(28, 0, -2)]]:
		cam.global_position = f[1]
		cam.look_at(f[2], Vector3.UP)
		await _shot(f[0])
	print("[v10] done")
	get_tree().quit()

func _shot(nm: String, use_own := true) -> void:
	if use_own:
		cam.make_current()
	for i in 4: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	world.get_texture().get_image().save_png("res://tests/captures/v10_%s.png" % nm)
