extends Node
## Over-the-shoulder camera checks in Chapter One (no director): framing, wall collision in tight rooms, aiming,
## looking down under a ceiling; then the same views in each screen style. Writes tests/captures/ots_*.png, look_*.png
var root: Node
var player: Player

const SPOTS := [  # name, position, facing (deg), pitch (deg or null), aim
	["yard", Vector3(1.7, 0, 8.0), 90.0, null, false],
	["living", Vector3(-5.0, 0, -1.0), 0.0, null, false],
	["living_aim", Vector3(-5.0, 0, -1.0), 0.0, null, true],
	["kitchen", Vector3(-5.0, 0, 4.0), 180.0, null, false],
	["hall_w", Vector3(-10.2, 0, 1.0), 90.0, null, false],
	["hall_n", Vector3(-10.2, 0, 1.0), 0.0, null, false],
	["hall_down", Vector3(-10.2, 0, 1.0), 90.0, -55.0, false],
	["bath", Vector3(-10.2, 0, -2.0), 0.0, null, false],
	["addie", Vector3(-10.5, 0, 4.5), 180.0, null, false],
	["louis_main", Vector3(28.5, 0, -9.8), 90.0, null, false],
	["louis_bath", Vector3(28.2, 0, -5.5), 0.0, null, false],
]

func _ready() -> void:
	root = (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	root.set_script(null)
	add_child(root)
	player = root.get_node("Screen/World/Player") as Player
	player.visible = true
	(player.get_node("Visual") as CharacterModel).set("model_id", "norah")
	for i in 10: await get_tree().physics_frame
	var only := ""
	for a in OS.get_cmdline_user_args(): if a.begins_with("only="): only = a.substr(5)
	if only == "fog":
		LookPresets.apply(root, GameSettings.look)
		for s in [["fog_yard", Vector3(1.7, 0, 8.0), 90.0, null, false], ["fog_yard_trees", Vector3(1.7, 0, 8.0), 0.0, null, false],
				["fog_lane", Vector3(4.0, 0, 30.0), 0.0, -12.0, false], ["fog_road", Vector3(10.8, 0, 70.0), 180.0, null, false],
				["fog_louis_yard", Vector3(21.0, 0, 4.5), 90.0, null, false], ["fog_door_out", Vector3(-3.0, 0, -1.0), 180.0, null, false],
				["fog_inside_living", Vector3(-5.0, 0, -1.0), 0.0, null, false], ["fog_inside_louis", Vector3(28.5, 0, -9.8), 90.0, null, false]]:
			await _spot(s)
			await _shot(s[0])
		get_tree().quit()
		return
	if only != "looks":
		for s in SPOTS:
			await _spot(s)
			await _shot("ots_" + s[0])
			print("[ots] %-11s arm back %.2f m, shoulder %.2f m, camera at y=%.2f%s" % [s[0], player.ots._len, player.ots._side, player.ots.global_position.y, "  (her model hidden)" if player.ots._model_hidden else ""])
	if only != "ots":
		for look in LookPresets.ORDER:
			LookPresets.apply(root, look)
			for s in [SPOTS[0], SPOTS[1], SPOTS[9]]:
				await _spot(s)
				await _shot("look_%s_%s" % [look, s[0]])
	get_tree().quit()

func _spot(s: Array) -> void:
	player.place(s[1], s[2])
	player.ots.aiming = s[4]
	player.aim_mode = s[4]
	player.model.play("aim" if s[4] else "idle", 0.0)
	for i in 4: await get_tree().physics_frame
	player.ots.snap_behind()
	if s[3] != null: player.ots.pitch = deg_to_rad(s[3])
	for i in 30: await get_tree().process_frame

func _shot(nm: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/%s.png" % nm)
