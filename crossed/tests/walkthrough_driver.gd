extends Node
## Automated walkthrough. Drives the player with the same input actions a person would use
## (tank controls), through the route in the master debrief, and checks collision.
## Run headless:  godot --headless --path . --fixed-fps 60 res://tests/walkthrough.tscn

const ROUTE := [
	["approach entrance", Vector3(0, 0, 1.0), "Cam1_LotArrival"],
	["foyer", Vector3(0, 0, -2.0), "CamF_Foyer"],
	["hallway south", Vector3(0.1, 0, -8.0), "Cam2a_HallSouth"],
	["hallway end", Vector3(0.1, 0, -14.5), "Cam2b_HallNorth"],
	["through doorway", Vector3(-2.3, 0, -14.5), "Cam3a_PartyEast"],
	["party centre", Vector3(-7.0, 0, -13.3), "Cam3a_PartyEast"],
	["toward banner", Vector3(-11.0, 0, -12.6), "Cam3b_PartyWest"],
	["breach landing area", Vector3(-13.6, 0, -15.2), "Cam3b_PartyWest"],
	["past cake table", Vector3(-11.0, 0, -16.3), "Cam3b_PartyWest"],
	["cake to gifts", Vector3(-6.8, 0, -16.3), "Cam3a_PartyEast"],
	["snack corner", Vector3(-3.0, 0, -15.3), "Cam3a_PartyEast"],
	["punch table", Vector3(-2.6, 0, -11.6), "Cam3a_PartyEast"],
	["south side", Vector3(-3.2, 0, -9.0), "Cam3a_PartyEast"],
	["between chairs and crafts", Vector3(-5.0, 0, -9.0), "Cam3a_PartyEast"],
	["back east", Vector3(-3.2, 0, -9.2), "Cam3a_PartyEast"],
	["back to doorway", Vector3(-2.3, 0, -14.5), "Cam3a_PartyEast"],
	["hallway end", Vector3(0.1, 0, -14.5), "Cam2b_HallNorth"],
	["hallway south", Vector3(0.1, 0, -4.5), "Cam2a_HallSouth"],
	["foyer", Vector3(0, 0, -1.2), "CamF_Foyer"],
	["outside", Vector3(0, 0, 4.0), "Cam1_LotArrival"],
]
# [label, start, yaw_deg (0 = facing north/-Z), axis, limit, sign]  walk into a wall for 2 s
const WALL_PUSHES := [
	["hallway east wall", Vector3(0.6, 0, -8.0), -90.0, "x", 1.2, 1],
	["hallway west wall (solid part)", Vector3(-0.4, 0, -8.0), 90.0, "x", -1.1, -1],
	["hallway north wall", Vector3(0.1, 0, -15.3), 0.0, "z", -16.0, -1],
	["party north wall under window", Vector3(-5.0, 0, -17.6), 0.0, "z", -18.0, -1],
	["party west wall / breach window", Vector3(-14.4, 0, -15.5), 90.0, "x", -15.2, -1],
	["party south window", Vector3(-11.5, 0, -8.9), 180.0, "z", -8.0, 1],
	["foyer west wall", Vector3(-1.4, 0, -1.5), 90.0, "x", -2.2, -1],
	["cake table", Vector3(-8.5, 0, -16.2), 0.0, "z", -16.9, -1],
	["punch table", Vector3(-3.0, 0, -11.6), -90.0, "x", -2.0, 1],
]

var player: CharacterBody3D
var log_lines: PackedStringArray = []
var failures := 0

func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	if player == null:
		await get_tree().process_frame
		player = get_tree().get_first_node_in_group("player")
	GameSettings.control_scheme = GameSettings.ControlScheme.TANK
	await _frames(10)
	await _check_landing_area()
	await _walk_route()
	await _wall_pushes()
	_out("")
	_out("RESULT: %s (%d failure%s)" % ["PASS" if failures == 0 else "FAIL", failures, "" if failures == 1 else "s"])
	var fa := FileAccess.open("res://tests/walkthrough_log.txt", FileAccess.WRITE)
	fa.store_string("\n".join(log_lines))
	get_tree().quit(0 if failures == 0 else 1)

func _out(s: String) -> void:
	print(s)
	log_lines.append(s)

func _frames(n: int) -> void:
	for i in n:
		await get_tree().physics_frame

func _release_all() -> void:
	for a in ["move_forward", "move_back", "move_left", "move_right", "run"]:
		Input.action_release(a)

func _cam_name() -> String:
	var c := Cameras.current
	return c.name if c else "-"

func _walk_route() -> void:
	_out("== ROUTE (tank controls, walking pace)")
	var total := 0.0
	for wp in ROUTE:
		var target: Vector3 = wp[1]
		var t := 0.0
		var reached := false
		while t < 25.0:
			var p := player.global_position
			var to := Vector3(target.x - p.x, 0, target.z - p.z)
			if to.length() < 0.3:
				reached = true
				break
			var desired := atan2(-to.x, -to.z)
			var diff := wrapf(desired - player.rotation.y, -PI, PI)
			_release_all()
			if abs(diff) > 0.06:
				Input.action_press("move_left" if diff > 0 else "move_right")
			if abs(diff) < 0.45:
				Input.action_press("move_forward")
			await get_tree().physics_frame
			t += get_physics_process_delta_time()
		_release_all()
		await _frames(20)
		total += t
		var cam := _cam_name()
		var ok_cam: bool = cam == wp[2]
		if not reached:
			failures += 1
		if not ok_cam:
			failures += 1
		_out("%-22s %s  at (%5.2f, %5.2f)  %4.1fs  camera %-20s %s" % [wp[0], "OK  " if reached else "STUCK",
			player.global_position.x, player.global_position.z, t, cam, "" if ok_cam else "(expected %s)" % wp[2]])
	_out("route time %.0fs" % total)

func _wall_pushes() -> void:
	_out("")
	_out("== WALL / FURNITURE COLLISION (walk forward 2 s into each)")
	for w in WALL_PUSHES:
		player.global_position = w[1]
		player.rotation.y = deg_to_rad(w[2])
		player.velocity = Vector3.ZERO
		await _frames(5)
		Input.action_press("move_forward")
		Input.action_press("run")
		await _frames(120)
		_release_all()
		await _frames(5)
		var v: float = player.global_position.x if w[3] == "x" else player.global_position.z
		var edge: float = w[4] - w[5] * 0.27     # capsule radius 0.28, small tolerance
		var held: bool = (v <= edge + 0.02) if w[5] > 0 else (v >= edge - 0.02)
		if not held:
			failures += 1
		_out("%-32s %s  %s=%.2f (surface %.2f)" % [w[0], "HELD" if held else "PASSED THROUGH", w[3], v, w[4]])

func _check_landing_area() -> void:
	_out("== ACROSS LANDING AREA")
	var area := get_tree().root.find_child("LandingClearArea", true, false) as Area3D
	var shape_node := area.get_child(0) as CollisionShape3D
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = shape_node.shape
	q.transform = shape_node.global_transform
	q.collision_mask = 1
	var hits := get_viewport().world_3d.direct_space_state.intersect_shape(q, 16)
	if hits.is_empty():
		_out("LandingClearArea (x -15.1..-12.2, z -17.2..-13.6): clear")
	else:
		failures += 1
		for h in hits:
			_out("LandingClearArea blocked by %s" % h.collider.get_path())
	var glass := get_tree().root.find_child("BreachGlass", true, false)
	_out("BreachGlass node: %s" % ("found" if glass else "MISSING"))
	if glass == null:
		failures += 1
	_out("")
