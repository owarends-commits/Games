extends Node
## Saves a screenshot from every fixed camera (with the PS1 post effect) to tests/captures/.
## Needs a display:  xvfb-run godot --path . --rendering-driver opengl3 res://tests/capture.tscn

const SHOTS := [
	["Cam1_LotArrival", Vector3(-1.0, 0, 4.0), 160.0],
	["CamF_Foyer", Vector3(0.2, 0, -1.6), 0.0],
	["Cam2a_HallSouth", Vector3(0.1, 0, -6.5), 0.0],
	["Cam2b_HallNorth", Vector3(0.1, 0, -12.5), 0.0],
	["Cam6a_EscapeHallNorth", Vector3(0.0, 0, -12.0), 180.0],
	["Cam6b_EscapeHallSouth", Vector3(0.0, 0, -6.0), 180.0],
	["Cam3a_PartyEast", Vector3(-2.4, 0, -14.4), 90.0],
	["Cam3b_PartyWest", Vector3(-10.5, 0, -13.0), -60.0],
	["Cam3c_PartyWestExit", Vector3(-11.0, 0, -13.0), -90.0],
	["Cam3_PartyOverview", Vector3(-4.5, 0, -12.8), 120.0],
	["Cam4_Breach", Vector3(-9.5, 0, -12.0), 120.0],
	["Cam5_CrowdInspection", Vector3(-12.2, 0, -14.6), 100.0],
]

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://tests/captures"))
	var player := get_tree().get_first_node_in_group("player") as Node3D
	await get_tree().process_frame
	for s in SHOTS:
		var cam := get_tree().root.find_child(s[0], true, false) as Camera3D
		player.global_position = s[1]
		player.rotation.y = deg_to_rad(s[2])
		Cameras.push_override(cam)
		for i in 12:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		img.save_png("res://tests/captures/%s.png" % s[0])
		print("saved ", s[0], " ", img.get_size())
		Cameras.pop_override(cam)
	get_tree().quit()
