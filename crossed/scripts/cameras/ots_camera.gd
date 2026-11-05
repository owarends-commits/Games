class_name OTSCamera
extends Node3D
## The over-the-shoulder camera. It sits just behind and to the right of Norah, between her head and her
## shoulder, framed so the bottom of her waist is just in view; she turns wherever it turns (player.gd).
##
## Collision: every frame a small sphere is swept from inside her head out to the shoulder point, then back
## to where the camera wants to be. Wherever it would hit a wall, door, prop or ceiling, the camera stops short
## of it (instantly when pulling in, easing back out when the way clears). When it's pressed right up against her,
## her model is hidden from this camera so it never shows the inside of her head.
##
## Look: mouse (captured while you play; Esc frees it, click to take it back), the arrow keys, or the right stick.
## Aim (the revolver): the camera tightens in over the shoulder and narrows; the reticle sits dead centre.
## Cutscenes still cut to their own cameras (Cameras.cut_to) and hand back here.

@export var pivot_height := 1.47        ## between her head and her shoulders (Norah is 1.68 m)
@export var shoulder := 0.34            ## to the right of her spine
@export var distance := 1.05            ## behind her
@export var fov_explore := 56.0         ## with the default pitch, frames her from the top of her head to just below the waist
@export var aim_shoulder := 0.5
@export var aim_distance := 0.82
@export var aim_height := 1.52
@export var fov_aim := 46.0
@export var default_pitch := -7.0
@export var min_pitch := -60.0
@export var max_pitch := 50.0
@export var probe_radius := 0.14        ## the sweep sphere; keeps the lens this far off walls
@export var collision_mask := 1 | 8     ## the world (layer 1: walls, floors, props) + camera-only blockers (layer 4: ceilings); the player is on layer 2

var yaw := 0.0                          ## radians, Godot convention (0 = looking down -Z)
var pitch := deg_to_rad(-7.0)
var aiming := false
var follow := false                     ## true: the camera swings round behind her (autoplay, scripted walks)
var cam: Camera3D
var player: Node3D
var _len := 1.05                        ## current (collision-limited) distance back
var _side := 0.34                       ## current (collision-limited) shoulder offset
var _blend := 0.0                       ## 0 explore -> 1 aim
var _flip := 1.0                        ## 1 right shoulder, -1 left (eases between when boxed in)
var _left_t := 0.0
var _kick := 0.0                        ## recoil pitch (degrees), springs back
var _released := false                  ## Esc freed the mouse
var _model_hidden := false
var _env_src: Camera3D
var _snap_next := true
var _idle := 0.0
@export var recenter_after := 1.2       ## seconds without looking around before the camera settles back over her shoulder

func _ready() -> void:
	top_level = true
	cam = Camera3D.new()
	cam.name = "OTSCam"
	cam.fov = fov_explore
	cam.near = 0.05
	cam.far = 220.0
	add_child(cam)
	pitch = deg_to_rad(default_pitch)
	_len = distance
	_side = shoulder
	cam.cull_mask = 0xFFFFF
	Cameras.camera_changed.connect(_on_camera_changed)
	Cameras.set_gameplay(cam)

func _exit_tree() -> void:
	if Cameras.gameplay == cam:
		Cameras.gameplay = null
	_capture(false)

## Swing straight round behind her (after a cutscene hands back, after a teleport).
func snap_behind() -> void:
	if player == null: return
	yaw = player.global_rotation.y
	pitch = deg_to_rad(default_pitch)
	_snap_next = true

## Quick turn: the view (and so Norah) spins round 180 degrees.
var _turn_left := 0.0
var _assist: Node3D
var _assist_t := 0.0
## Swing the view onto `t` over the next moment (aim assist when the aim button goes down).
func assist_to(t: Node3D, time := 0.22) -> void:
	_assist = t
	_assist_t = time

func turn_around(time := 0.3) -> void:
	_turn_left = PI
	_turn_rate = PI / time
var _turn_rate := 0.0

func kick(deg: float) -> void:
	_kick += deg

func is_live() -> bool:
	return Cameras.current == cam

func _on_camera_changed(old: Camera3D, new_cam: Camera3D) -> void:
	if new_cam == cam and old != cam:
		snap_behind()

# ------------------------------------------------------------------ input
func _player_can_look() -> bool:
	if player == null or not is_live() or follow: return false
	if player.get("control_locked") and not player.get("aim_mode"): return false
	if Dialogue.locks_player: return false
	return true

func _capture(on: bool) -> void:
	if DisplayServer.get_name() == "headless": return
	var want := Input.MOUSE_MODE_CAPTURED if on else Input.MOUSE_MODE_VISIBLE
	if Input.mouse_mode != want: Input.mouse_mode = want

func _unhandled_input(e: InputEvent) -> void:
	# Esc opens the pause menu (HUD), which frees the mouse while it's up
	if e is InputEventMouseButton and e.pressed and _released and _player_can_look():
		_released = false
		get_viewport().set_input_as_handled()
		return
	if e is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and _player_can_look():
		if e.relative.length() > 0.5: _idle = 0.0
		var s := deg_to_rad(GameSettings.mouse_sensitivity) * (0.6 if aiming else 1.0)
		yaw -= e.relative.x * s
		pitch -= e.relative.y * s * (-1.0 if GameSettings.invert_y else 1.0)
		pitch = clampf(pitch, deg_to_rad(min_pitch), deg_to_rad(max_pitch))

func _process(delta: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	var can := _player_can_look()
	_capture(can and not _released)
	if can:
		var lx := Input.get_axis("look_left", "look_right")
		var ly := Input.get_axis("look_up", "look_down")
		var sp := deg_to_rad(GameSettings.stick_look_speed) * (0.55 if aiming else 1.0)
		if absf(lx) + absf(ly) > 0.05: _idle = 0.0
		yaw -= lx * sp * delta
		pitch -= ly * sp * 0.7 * delta * (-1.0 if GameSettings.invert_y else 1.0)
		pitch = clampf(pitch, deg_to_rad(min_pitch), deg_to_rad(max_pitch))
		_idle += delta
		if _idle > recenter_after and not aiming:
			# left alone: drift back to just over her shoulder
			yaw = lerp_angle(yaw, player.global_rotation.y, 1.0 - exp(-delta * 2.5))
			pitch = lerpf(pitch, deg_to_rad(default_pitch), 1.0 - exp(-delta * 2.0))
	elif follow and player.get("aim_mode"):
		# autoplay aiming: stay right behind her so the shot lines up with where she points
		yaw = lerp_angle(yaw, player.global_rotation.y, 1.0 - exp(-delta * 10.0))
		pitch = lerpf(pitch, deg_to_rad(default_pitch), 1.0 - exp(-delta * 4.0))
	elif follow or (player.get("control_locked") and not player.get("aim_mode")):
		# scripted movement: ease round behind her and level out
		yaw = lerp_angle(yaw, player.global_rotation.y, 1.0 - exp(-delta * 3.0))
		pitch = lerpf(pitch, deg_to_rad(default_pitch), 1.0 - exp(-delta * 2.0))
	if _assist_t > 0.0 and is_instance_valid(_assist):
		# aim assist: the first moment of aiming swings the view onto the nearby threat's chest
		_assist_t -= delta
		var to: Vector3 = _assist.global_position - player.global_position
		var want := atan2(-to.x, -to.z)
		var k := 1.0 - exp(-delta * 16.0)
		yaw = lerp_angle(yaw, want, k)
		var flat := Vector2(to.x, to.z).length()
		var wp := clampf(atan2(1.15 - aim_height, maxf(flat, 0.3)), deg_to_rad(min_pitch), deg_to_rad(max_pitch))
		pitch = lerpf(pitch, wp, k)
	if _turn_left > 0.0:
		var st := minf(_turn_left, _turn_rate * delta)
		yaw += st
		_turn_left -= st
	_kick = move_toward(_kick, 0.0, delta * 9.0)
	_blend = move_toward(_blend, 1.0 if aiming else 0.0, delta * 6.0)
	_place(delta)

# ------------------------------------------------------------------ placement and collision
func _place(delta: float) -> void:
	var b := Basis(Vector3.UP, yaw) * Basis(Vector3.RIGHT, pitch + deg_to_rad(_kick))
	var h := lerpf(pivot_height, aim_height, _blend)
	var want_side := lerpf(shoulder, aim_shoulder, _blend)
	var want_len := lerpf(distance, aim_distance, _blend)
	var head := player.global_position + Vector3(0, h, 0)
	var right := b.x
	var back := b.z
	var space := get_world_3d().direct_space_state
	# 1) head -> shoulder point (a wall on her right pulls the camera in toward her)
	var side_ok := _sweep(space, head, head + right * want_side)
	var side_len := want_side * side_ok
	var shoulder_pt := head + right * side_len
	# 2) shoulder point -> back to the camera's spot
	var back_ok := _sweep(space, shoulder_pt, shoulder_pt + back * want_len)
	var len_ok := want_len * back_ok
	# boxed in on the right (a wall jammed against that shoulder): try the left shoulder instead,
	# so the camera doesn't end up pressed against her cheek staring at plaster
	# also boxed in if something solid sits right in front of the lens on this side (a door leaf
	# folded back beside her, the end of a wardrobe): the view would be all wood
	var lens := shoulder_pt + back * len_ok
	var fq := PhysicsRayQueryParameters3D.create(lens, lens - back * (len_ok + 0.35), collision_mask)
	if player is CollisionObject3D: fq.exclude = [(player as CollisionObject3D).get_rid()]
	var front_blocked := not space.intersect_ray(fq).is_empty()
	if len_ok < 0.5 * want_len or side_ok < 0.5 or front_blocked:
		var l_ok := _sweep(space, head, head - right * want_side)
		var l_pt := head - right * want_side * l_ok
		var l_len := want_len * _sweep(space, l_pt, l_pt + back * want_len)
		var l_lens := l_pt + back * l_len
		var lq := PhysicsRayQueryParameters3D.create(l_lens, l_lens - back * (l_len + 0.35), collision_mask)
		if player is CollisionObject3D: lq.exclude = [(player as CollisionObject3D).get_rid()]
		var l_front := not space.intersect_ray(lq).is_empty()
		var l_score := l_len + want_side * l_ok - (1.0 if l_front else 0.0)
		var r_score := len_ok + side_len - (1.0 if front_blocked else 0.0)
		if l_score > r_score + 0.2:
			_left_t = 1.5
	_left_t = maxf(_left_t - delta, 0.0)
	_flip = move_toward(_flip, -1.0 if _left_t > 0.0 else 1.0, delta * 4.0)
	if _flip < 0.99:
		right = b.x * (1.0 if _flip >= 0.0 else -1.0)
		var ws := want_side * absf(_flip)
		side_ok = _sweep(space, head, head + right * ws)
		side_len = ws * side_ok
		shoulder_pt = head + right * side_len
		len_ok = want_len * _sweep(space, shoulder_pt, shoulder_pt + back * want_len)
	if _snap_next:
		_len = len_ok; _side = side_len; _snap_next = false
	else:
		# pull in at once (never through a wall), ease back out
		_len = len_ok if len_ok < _len else move_toward(_len, len_ok, delta * 2.2)
		_side = side_len if side_len < _side else move_toward(_side, side_len, delta * 2.2)
	var want_pos := head + right * _side + back * _len
	# last line of defence: a thin ray from her head to the lens. If anything solid sits between
	# them (a door leaf the sweep slid past, a toppled wardrobe), the lens comes in to her side of it.
	var rq := PhysicsRayQueryParameters3D.create(head, want_pos, collision_mask)
	if player is CollisionObject3D: rq.exclude = [(player as CollisionObject3D).get_rid()]
	var rh := space.intersect_ray(rq)
	if not rh.is_empty():
		var k := maxf(head.distance_to(rh["position"]) - probe_radius, 0.0) / maxf(head.distance_to(want_pos), 0.001)
		want_pos = head + (want_pos - head) * k
		_len *= k; _side *= k
	global_position = want_pos
	global_basis = b
	cam.fov = lerpf(fov_explore, fov_aim, _blend)
	# pressed right against her: hide her from this camera (her meshes are on layer 2)
	var close := _len < 0.32
	if close != _model_hidden:
		_model_hidden = close
		_tag_player_layers()
		cam.cull_mask = (0xFFFFF & ~2) if close else 0xFFFFF
	# the light and fog of whichever area she's in (borrowed from that area's fixed camera)
	var zc := Cameras.zone_camera()
	if zc and zc != _env_src:
		_env_src = zc
		cam.environment = zc.environment
		cam.far = maxf(zc.far, 60.0)
		cam.attributes = zc.attributes

func _sweep(space: PhysicsDirectSpaceState3D, from: Vector3, to: Vector3) -> float:
	var q := PhysicsShapeQueryParameters3D.new()
	var sh := SphereShape3D.new()
	sh.radius = probe_radius
	q.shape = sh
	q.transform = Transform3D(Basis(), from)
	q.motion = to - from
	q.collision_mask = collision_mask
	q.collide_with_areas = false
	if player is CollisionObject3D:
		q.exclude = [(player as CollisionObject3D).get_rid()]
	var r := space.cast_motion(q)
	if r.is_empty(): return 1.0
	return clampf(r[0], 0.0, 1.0)

func _tag_player_layers() -> void:
	var vis := player.get_node_or_null("Visual")
	if vis == null: return
	for n in vis.find_children("*", "VisualInstance3D", true, false):
		(n as VisualInstance3D).layers = 2

## The point at the centre of the screen, out to `reach` metres (for free aim).
func aim_ray() -> Array:
	var from := cam.global_position
	var dir := -cam.global_basis.z
	return [from, dir]

