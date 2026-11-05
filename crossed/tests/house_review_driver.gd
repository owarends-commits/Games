extends Node
## Renders every camera in Norah's house (PS1 resolution) plus a top-down plan with camera markers.
## xvfb-run godot --path . res://scenes/environments/norah_house_review.tscn

# camera -> [stand-in position for Norah (mom2 model), facing deg, optional Louis position]
const STAGING := {
	"A2_LouisFar": [Vector3(-19.0, 0, -3.6), 120.0, null],
	"A3_LouisNear": [Vector3(-13.5, 0, -2.7), -90.0, null],
	"A4_PorchOut": [Vector3(-9.5, 0, -2.7), -90.0, null],
	"C1_Shoulder": [Vector3(-8.0, 0, -3.2), -57.0, Vector3(9.5, 0, -14.5)],
	"C2_Face": [Vector3(-8.0, 0, -3.2), -57.0, null],
	"C3_Side": [Vector3(-8.0, 0, -3.2), -57.0, null],
	"C4_Headlight": [Vector3(-14.0, 0, -2.8), -60.0, null],
	"C6_Jumpscare": [Vector3(-8.0, 0, -3.2), -57.0, Vector3(-6.7, 0.35, -4.3)],
	"S1_Overhead": [Vector3(-7.0, 0, -2.7), -90.0, Vector3(-11.0, 0, -5.0)],
	"N2_Yard": [Vector3(-2.2, 0, -2.6), 90.0, null],
	"N3_BackCorner": [Vector3(7.6, 0, -6.2), -60.0, Vector3(11.2, 0, -1.2)],
	"N4_SideWall": [Vector3(3.0, 0, -5.7), 180.0, Vector3(1.0, 0, -6.6)],
	"I1_LivingCorner": [Vector3(1.9, 0, -2.6), -90.0, null],
	"I2_KitchenFridge": [Vector3(7.2, 0, -4.4), -90.0, null],
	"I3_HallEast": [Vector3(5.4, 0, -2.75), 90.0, null],
	"I3b_HallWest": [Vector3(6.6, 0, -2.75), -90.0, null],
	"I4_BedroomDoor": [Vector3(7.1, 0, -1.95), -160.0, null],
	"I5_BehindBed": [Vector3(6.5, 0, -2.0), 0.0, Vector3(7.2, 0.5, -0.8)],
	"B1_BathCorner": [Vector3(5.0, 0.1, -0.85), 180.0, null],
	"B2_HallFloor": [Vector3(4.9, 0, -1.4), 0.0, Vector3(5.0, 0, -2.62)],
}

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://tests/captures"))
	var house := find_child("House", true, false) as Node3D
	var world := find_child("World", true, false) as SubViewport
	var norah := CharacterModel.new(); norah.model_id = "mom2"; norah.start_animation = "idle"; norah.start_offset_random = false
	var louis := CharacterModel.new(); louis.model_id = "across"; louis.start_animation = "quad_idle"; louis.start_offset_random = false
	house.add_child(norah); house.add_child(louis)
	var markers := house.get_node("CameraMarkers") as Node3D
	markers.visible = false
	for cam in house.get_node("Cameras").get_children():
		var st: Array = STAGING.get(cam.name, [Vector3(-3, 0, -2.6), 0.0, null])
		norah.position = st[0]; norah.rotation.y = deg_to_rad(st[1])
		louis.visible = st[2] != null
		if st[2] != null:
			louis.position = st[2]; var tgt: Vector3 = (cam as Camera3D).position if cam.name == "C6_Jumpscare" else norah.position
			louis.look_at(Vector3(tgt.x, louis.position.y, tgt.z), Vector3.UP)
		var dark: bool = cam.name in ["C6_Jumpscare", "S1_Overhead"]
		for l in ["Lights/HeadlightBeam", "Lights/HeadlightLow", "Lights/HeadlightGlow", "Exterior/Headlight", "Exterior/Headlight2"]:
			house.get_node(l).visible = not dark
		louis.start_animation = "lunge" if cam.name == "C6_Jumpscare" else "quad_idle"
		if louis.anim: louis.play(louis.start_animation)
		(cam as Camera3D).make_current()
		await _snap(world, "house_%s" % cam.name)
	# top-down plan: no roof or ceilings, markers on, higher resolution
	house.get_node("Geometry/Roof").visible = false
	house.get_node("Geometry/Ceilings").visible = false
	markers.visible = true
	louis.visible = false; norah.position = Vector3(-2.2, 0, -2.6)
	(find_child("Screen", true, false) as SubViewportContainer).stretch_shrink = 1
	await get_tree().process_frame
	var top := Camera3D.new()
	top.projection = Camera3D.PROJECTION_ORTHOGONAL
	top.size = 12.5
	top.environment = load("res://environments/env_norah_house.tres")
	house.add_child(top)
	top.position = Vector3(3.2, 20, -2.7)
	top.rotation_degrees = Vector3(-90, 0, 0)
	var sun := DirectionalLight3D.new(); sun.light_energy = 0.9; house.add_child(sun); sun.rotation_degrees = Vector3(-70, 20, 0)
	top.make_current()
	await _snap(world, "house_plan_top")
	top.projection = Camera3D.PROJECTION_PERSPECTIVE; top.fov = 50
	top.position = Vector3(-6.5, 11, 6.5); top.look_at(Vector3(3.8, 0, -2.7))
	await _snap(world, "house_plan_iso")
	get_tree().quit()

func _snap(world: SubViewport, nm: String) -> void:
	for i in 10:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/%s.png" % nm)
