class_name Player
extends CharacterBody3D
## Kenneth, under player control.
##
## TANK (default): forward/back move along the facing direction, left/right rotate.
##   Hold run to run. Quick turn (Q, or back + run tapped together) spins 180 degrees.
## CAMERA_RELATIVE: the stick moves relative to the live camera. When the camera cuts,
##   the previous camera's direction is kept until the stick is released, so a cut never
##   flips the player's movement mid-step.
## Interact talks to / uses the nearest Interactable in front of him.

@export var walk_speed := 1.7
@export var run_speed := 3.8
@export var back_speed := 1.1
@export var turn_speed_deg := 170.0
@export var modern_turn_speed_deg := 540.0
@export var quick_turn_time := 0.32
@export var acceleration := 14.0

var control_locked := false
var aim_mode := false          ## combat: feet planted, turning only (survival-horror aiming)
var invulnerable_t := 0.0      ## dodge i-frames
var can_run := true
var walk_anim := "walk"          ## "walk_hand" while Adaline holds his hand
var idle_anim := "idle"          ## "idle_hand", "hold_cup", ...
var run_anim := "run"            ## "run_light" while carrying the flashlight
var model: CharacterModel
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var _quick_turn_left := 0.0
var _quick_turn_rate := 0.0
var _held_basis: Basis
var _holding_heading := false
var _focus: Interactable = null
var _step_t := 0.0
var _stagger := 0.0
var _push := Vector3.ZERO
var _step_player: AudioStreamPlayer
var _steps := {}
## Dropping off a ledge (the chapel stage, a porch, a loft): a drop higher than this stuns her briefly on landing.
@export var stun_drop := 0.45
signal landed_hard(drop: float)
var _was_floor := true
## Over the shoulder (GameSettings.ControlScheme.OVER_SHOULDER): the camera rig, made in _ready
var ots: OTSCamera
@export var walk_speed_strafe := 1.45
@export var ots_turn_speed := 12.0       ## how fast she swings round to where the camera looks (rad/s)
var _lean := 0.0                          ## her body turned toward a strafe (the camera still leads)
var _air_top := 0.0
var _air_t := 0.0
var _land_grace := 0.0

func _ready() -> void:
	add_to_group("player")
	Cameras.camera_changed.connect(_on_camera_changed)
	model = get_node_or_null("Visual") as CharacterModel
	_step_player = AudioStreamPlayer.new()
	_step_player.volume_db = -10.0
	add_child(_step_player)
	for k in ["tile", "carpet", "wet", "gravel"]:
		_steps[k] = load("res://assets/audio/step_%s.wav" % k)
	if GameSettings.control_scheme == GameSettings.ControlScheme.OVER_SHOULDER:
		ots = OTSCamera.new()
		ots.name = "OTSRig"
		ots.player = self
		add_child(ots)
		ots.yaw = rotation.y
	GameSettings.control_scheme_changed.connect(_on_scheme_changed)

func _on_scheme_changed(scheme) -> void:
	if scheme == GameSettings.ControlScheme.OVER_SHOULDER and ots == null:
		ots = OTSCamera.new(); ots.name = "OTSRig"; ots.player = self; add_child(ots); ots.yaw = rotation.y
	elif scheme != GameSettings.ControlScheme.OVER_SHOULDER and ots:
		ots.queue_free(); ots = null
		if model: model.rotation.y = 0.0
		Cameras.gameplay = null
		Cameras.refresh()

func ots_active() -> bool:
	return ots != null and is_instance_valid(ots) and ots.is_live()

func locked() -> bool:
	return control_locked or Dialogue.locks_player or _stagger > 0.0

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= _gravity * delta
	else:
		velocity.y = -0.1
	var planar := Vector3.ZERO
	var turning := false
	if invulnerable_t > 0.0:
		invulnerable_t -= delta
	if _stagger > 0.0:
		_stagger -= delta
		planar = _push
		_push = _push.move_toward(Vector3.ZERO, 6.0 * delta)
	elif not locked():
		if _quick_turn_left > 0.0:
			var step: float = min(delta, _quick_turn_left)
			rotation.y += _quick_turn_rate * step
			_quick_turn_left -= step
			turning = true
		elif ots_active():
			planar = _over_shoulder(delta)
		elif GameSettings.control_scheme == GameSettings.ControlScheme.TANK:
			planar = _tank(delta)
			turning = abs(Input.get_action_strength("move_left") - Input.get_action_strength("move_right")) > 0.1
		else:
			planar = _camera_relative(delta)
	var target := Vector3(planar.x, 0.0, planar.z)
	var current := Vector3(velocity.x, 0.0, velocity.z)
	current = current.move_toward(target, acceleration * delta * (3.0 if _stagger > 0.0 else 1.0))
	velocity.x = current.x
	velocity.z = current.z
	move_and_slide()
	_track_fall(delta)
	_animate(delta, turning)
	_update_focus()

## Leaving the floor: the airborne pose once she's clearly falling; landing from higher than stun_drop:
## the hard landing (a crouch, a hand to the floor, a woozy beat) with no control until she's back up.
func _track_fall(delta: float) -> void:
	var on := is_on_floor()
	_land_grace = maxf(0.0, _land_grace - delta)
	if not on:
		if _was_floor:
			_air_top = global_position.y
			_air_t = 0.0
		_air_top = maxf(_air_top, global_position.y)
		_air_t += delta
		if _air_t > 0.05 and _air_top - global_position.y > 0.06 and model and not control_locked and not aim_mode:
			model.play("airborne", 0.08)
	elif not _was_floor:
		var drop := _air_top - global_position.y
		if drop > stun_drop and _land_grace <= 0.0 and not control_locked:
			land_hard(drop)
		elif _air_t > 0.05 and model and not control_locked:
			model.play(idle_anim, 0.1)
	_was_floor = on

func land_hard(drop: float) -> void:
	var t := clampf(0.75 + drop * 0.35, 0.85, 1.4)        # longer from higher up
	_stagger = t
	_push = Vector3(velocity.x, 0, velocity.z) * 0.25         # a little skid forward
	_quick_turn_left = 0.0
	if model: model.play_once("land_hard", 0.04)
	Cameras.shake(0.05 + drop * 0.05, 0.25)
	var snd := AudioStreamPlayer.new()
	snd.stream = load("res://assets/audio/body_land.wav")
	snd.volume_db = -6.0 + minf(drop * 4.0, 6.0)
	snd.pitch_scale = 1.15
	add_child(snd)
	snd.play()
	snd.finished.connect(snd.queue_free)
	landed_hard.emit(drop)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("interact") and not locked() and _focus and Time.get_ticks_msec() - Dialogue.ended_msec > 300:
		get_viewport().set_input_as_handled()
		HUD.show_prompt("")
		_focus.use()

func _tank(delta: float) -> Vector3:
	var fwd := Input.get_action_strength("move_forward") - Input.get_action_strength("move_back")
	var turn := Input.get_action_strength("move_left") - Input.get_action_strength("move_right")
	var running := Input.is_action_pressed("run") and can_run
	if Input.is_action_just_pressed("quick_turn") or (Input.is_action_pressed("move_back") and Input.is_action_just_pressed("run")):
		_start_quick_turn()
		return Vector3.ZERO
	rotation.y += deg_to_rad(turn_speed_deg) * turn * delta * (1.15 if running else 1.0)
	var speed := 0.0
	if fwd > 0.1:
		speed = run_speed if running else walk_speed
	elif fwd < -0.1:
		speed = -back_speed
	return -global_transform.basis.z * speed

func _camera_relative(delta: float) -> Vector3:
	var input := Vector2(
		Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
		Input.get_action_strength("move_forward") - Input.get_action_strength("move_back"))
	if input.length() < 0.2:
		_holding_heading = false
		return Vector3.ZERO
	var basis := _held_basis if _holding_heading else _camera_basis()
	var cam_fwd := -basis.z
	cam_fwd.y = 0.0
	cam_fwd = cam_fwd.normalized()
	var cam_right := basis.x
	cam_right.y = 0.0
	cam_right = cam_right.normalized()
	var dir := (cam_right * input.x + cam_fwd * input.y).normalized()
	var target_yaw := atan2(-dir.x, -dir.z)
	rotation.y = rotate_toward(rotation.y, target_yaw, deg_to_rad(modern_turn_speed_deg) * delta)
	var speed := run_speed if (Input.is_action_pressed("run") and can_run) else walk_speed
	return dir * speed * clamp(input.length(), 0.0, 1.0)

func _camera_basis() -> Basis:
	var cam := get_viewport().get_camera_3d()
	return cam.global_transform.basis if cam else global_transform.basis

func _on_camera_changed(old_camera: Camera3D, _new_camera: Camera3D) -> void:
	if old_camera and GameSettings.control_scheme == GameSettings.ControlScheme.CAMERA_RELATIVE:
		var held := Vector2(
			Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
			Input.get_action_strength("move_forward") - Input.get_action_strength("move_back"))
		if held.length() >= 0.2 and not _holding_heading:
			_held_basis = old_camera.global_transform.basis
			_holding_heading = true

## Over the shoulder: she faces wherever the camera looks. W runs/walks forward, A/D strafe, S backs up.
## Her body leans into a strafe (up to about 70 degrees) so she isn't sliding sideways; the camera stays put.
func _over_shoulder(delta: float) -> Vector3:
	if Input.is_action_just_pressed("quick_turn"):
		ots.turn_around()
	if ots.follow:            # autoplay drives (tank-style, with the move_* actions); the camera follows instead of leading
		return _tank(delta)
	var target_yaw := ots.yaw
	var inp := Vector2(Input.get_axis("walk_left", "walk_right"), Input.get_axis("walk_back", "walk_forward"))
	# she turns to the camera's heading only when she moves or aims; standing still, the mouse looks around her freely
	if aim_mode or inp.length() >= 0.2:
		rotation.y = rotate_toward(rotation.y, target_yaw, ots_turn_speed * delta)
	if aim_mode:
		_lean = 0.0
		return Vector3.ZERO
	if inp.length() < 0.2:
		_lean = 0.0
		return Vector3.ZERO
	inp = inp.limit_length(1.0)
	var b := Basis(Vector3.UP, target_yaw)
	var dir := (b.x * inp.x - b.z * inp.y).normalized()
	var running := Input.is_action_pressed("run") and can_run and inp.y > 0.35
	var speed := walk_speed
	if inp.y < -0.3: speed = back_speed
	elif absf(inp.x) > 0.5 and inp.y < 0.35: speed = walk_speed_strafe
	if running: speed = run_speed
	# the lean: toward the direction of travel, but never past side-on (backing up keeps her facing forward)
	var local := atan2(-inp.x, inp.y)          # 0 = straight ahead, +left
	if inp.y < -0.2: local = atan2(inp.x, -inp.y) * 0.5
	_lean = clampf(local, -1.25, 1.25)
	return dir * speed * clampf(inp.length(), 0.0, 1.0)

func _start_quick_turn() -> void:
	_quick_turn_left = quick_turn_time
	_quick_turn_rate = PI / quick_turn_time

# ------------------------------------------------------------------ animation + footsteps
func _animate(delta: float, turning: bool) -> void:
	if model == null or model.anim == null:
		return
	if control_locked and not _anim_auto_when_locked:
		return
	if ots and model:
		if _roll_t > 0.0:
			_roll_t -= delta
			model.rotation.y = _roll_yaw
		else:
			model.rotation.y = lerp_angle(model.rotation.y, _lean if ots_active() and not aim_mode and _stagger <= 0.0 else 0.0, 1.0 - exp(-delta * 10.0))
	if aim_mode:
		return
	var v := Vector3(velocity.x, 0, velocity.z)
	var speed := v.length()
	var forward := v.dot(-global_transform.basis.z) >= -0.05
	if _stagger > 0.0 or not _was_floor:
		return
	if speed > 2.4:
		model.play(run_anim, 0.12, clamp(speed / run_speed, 0.7, 1.3))
	elif speed > 0.15:
		model.play(walk_anim, 0.15, clamp(speed / walk_speed, 0.6, 1.4) * (1.0 if forward else -0.8))
	elif turning:
		model.play(walk_anim, 0.15, 0.6)
	else:
		model.play(idle_anim, 0.25)
	if speed > 0.15:
		_step_t -= delta * speed / (1.6 if speed < 2.4 else 2.0)
		if _step_t <= 0.0:
			_step_t = 0.45
			_step_player.stream = _steps[_surface()]
			_step_player.pitch_scale = randf_range(0.9, 1.1)
			_step_player.play()

var _anim_auto_when_locked := false

var surface_fn: Callable   ## a scene can supply its own footstep surface lookup

func _surface() -> String:
	if surface_fn.is_valid():
		return surface_fn.call(global_position)
	var p := global_position
	if p.z > 0.25:
		return "wet"
	if p.z > -3.5:
		return "tile"
	if p.x > -1.2:
		return "carpet"
	return "tile"

# ------------------------------------------------------------------ interaction
func _update_focus() -> void:
	var best: Interactable = null
	var best_d := INF
	if not locked():
		var fwd := -global_transform.basis.z
		for n in get_tree().get_nodes_in_group("interactable"):
			var it := n as Interactable
			if it == null or not it.enabled or not it.is_visible_in_tree():
				continue
			var to := it.global_position - global_position
			if absf(to.y) > 2.2:     # another floor
				continue
			to.y = 0.0
			var d := to.length()
			if d > it.radius:
				continue
			if d > 0.35 and fwd.dot(to / d) < 0.35:
				continue
			if d < best_d:
				best_d = d
				best = it
	if best != _focus:
		if _focus and is_instance_valid(_focus): _focus.set_focused(false)
		_focus = best
		if best: best.set_focused(true)
		HUD.show_prompt(("[E]  " + best.prompt) if (best and not best.glow) else "")

## Knocked aside by the ACROSS or the crowd: brief loss of control, pushed along `dir`.
func stagger(dir: Vector3, strength := 3.0, time := 0.7, anim_name := "scared") -> void:
	_stagger = time
	_push = dir.normalized() * strength
	if model:
		if anim_name in CharacterModel.ONE_SHOTS:
			model.play_once(anim_name, 0.05)
		else:
			model.play(anim_name, 0.05)

## Combat dodge: a quick hop along `dir` with a moment of invulnerability.
## The dodge is a roll: she throws herself along `dir` (body turned to roll that way, wherever she's facing), and
## can't be hit for most of it.
var _roll_t := 0.0
var _roll_yaw := 0.0
func dodge(dir: Vector3) -> void:
	invulnerable_t = 0.55
	var local := global_basis.inverse() * dir.normalized()
	_roll_yaw = atan2(-local.x, -local.z)
	_roll_t = 0.75
	stagger(dir, 3.8, 0.72, "roll")

## Teleport + face, for cutscenes.
func place(pos: Vector3, yaw_deg: float) -> void:
	_land_grace = 0.5
	_air_top = pos.y
	global_position = pos
	rotation.y = deg_to_rad(yaw_deg)
	velocity = Vector3.ZERO
	if ots: ots.snap_behind()
