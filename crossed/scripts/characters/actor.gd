@tool
class_name Actor
extends CharacterModel
## A scripted character: a CharacterModel that can walk paths, turn and idle in place.
## Story scripts drive actors directly (await actor.walk_to(...)); there is no AI here.

@export var walk_speed := 1.4
@export var run_speed := 3.6
@export var idle_animation := "idle"

var busy := false
## Walks respect the world (walls, furniture, doors, Norah): see BodySweep. A scripted move that has to pass
## somewhere a body can't (Louis through the window) turns this off for its duration.
@export var collides := true
@export var body_radius := 0.24
var _move_id := 0
var _stuck := 0.0
var follow_target: Node3D = null
var follow_offset := Vector3.ZERO

## Walks (or runs) through the points in order. Returns when the last point is reached,
## or immediately if another move order replaced this one.
func walk_to(points, speed := -1.0, anim_name := "", arrive_anim := "", _from_wander := false) -> void:
	if points is Vector3:
		points = [points]
	if not _from_wander:
		_wander_id += 1
	_move_id += 1
	var my_id := _move_id
	follow_target = null
	if speed < 0.0:
		speed = walk_speed
	if anim_name == "":
		anim_name = "run" if speed > 2.2 else "walk"
	busy = true
	play(anim_name, 0.12, clamp(speed / (run_speed if speed > 2.2 else walk_speed), 0.6, 1.6))
	for p in points:
		var target: Vector3 = p
		target.y = global_position.y
		while true:
			if my_id != _move_id:
				return
			var to := target - global_position
			to.y = 0.0
			var d := to.length()
			var step := speed * get_physics_process_delta_time()
			if d <= step or d < 0.02:
				global_position = target
				break
			var dir := to / d
			_turn_toward(dir, 9.0)
			if collides and not Engine.is_editor_hint():
				var made := BodySweep.move(self, dir * step, body_radius)
				_stuck = _stuck + get_physics_process_delta_time() if made.length() < step * 0.3 else 0.0
				if _stuck > 1.2:              # wedged on something: say so (the path needs fixing) and move on
					push_warning("[actor] %s blocked on the way to %s (at %s)" % [name, target, global_position])
					_stuck = 0.0
					global_position = target
					break
			else:
				global_position += dir * step
			await get_tree().physics_frame
	if my_id == _move_id:
		busy = false
		play(arrive_anim if arrive_anim != "" else idle_animation, 0.2)

func stop() -> void:
	_move_id += 1
	_wander_id += 1
	busy = false
	follow_target = null

func face(point: Vector3, instant := false) -> void:
	var to := point - global_position
	to.y = 0.0
	if to.length() < 0.001:
		return
	if instant:
		rotation.y = atan2(-to.x, -to.z)
		return
	var t := 0.0
	while t < 0.6:
		_turn_toward(to.normalized(), 10.0)
		t += get_physics_process_delta_time()
		await get_tree().physics_frame

func _turn_toward(dir: Vector3, rate: float) -> void:
	var target_yaw := atan2(-dir.x, -dir.z)
	rotation.y = lerp_angle(rotation.y, target_yaw, clamp(rate * get_physics_process_delta_time(), 0.0, 1.0))

## Keep a fixed offset from a moving target (Adaline holding Kenneth's hand).
func follow(target: Node3D, offset: Vector3, walk_anim := "walk_hand", idle_anim := "idle_hand") -> void:
	stop()
	follow_target = target
	follow_offset = offset
	_follow_walk = walk_anim
	_follow_idle = idle_anim

var _follow_walk := "walk_hand"
var _follow_idle := "idle_hand"

func _physics_process(delta: float) -> void:
	if Engine.is_editor_hint() or follow_target == null:
		return
	var goal := follow_target.global_transform * follow_offset
	goal.y = global_position.y
	var to := goal - global_position
	to.y = 0.0
	var d := to.length()
	var speed: float = clamp(d * 6.0, 0.0, run_speed)
	if d > 0.04:
		var mv: Vector3 = to.normalized() * min(d, speed * delta)
		if collides: BodySweep.move(self, mv, body_radius, 1.3, true, [follow_target])
		else: global_position += mv
	var fy: float = follow_target.global_rotation.y
	rotation.y = lerp_angle(rotation.y, fy, clamp(8.0 * delta, 0.0, 1.0))
	if d > 0.08 or speed > 0.3:
		play(_follow_walk, 0.15, clamp(speed / walk_speed, 0.7, 1.8))
	else:
		play(_follow_idle, 0.2)

## Kids on the mats: wander between points until told otherwise.
var _wander_id := 0
func wander(points: Array, pause_min := 0.5, pause_max := 2.5, speed := -1.0, pause_anim := "play") -> void:
	_wander_id += 1
	var my := _wander_id
	while my == _wander_id and is_inside_tree():
		var p: Vector3 = points[randi() % points.size()]
		await walk_to(p, speed if speed > 0.0 else run_speed * 0.7, "run", pause_anim, true)
		if my != _wander_id:
			return
		await get_tree().create_timer(randf_range(pause_min, pause_max)).timeout
