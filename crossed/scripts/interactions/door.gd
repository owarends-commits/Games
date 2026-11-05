class_name Door
extends Node3D
## A hinged door (the pivot sits on the hinge; the leaf runs along +X). Closed doors block; open doors keep
## their collision too. Opening takes a moment:
##   press E once            -> Norah eases it open, slowly and quietly (stealth)
##   press E again while it opens -> she shoulders it and smashes it open (loud)
## Louis (or a script) can call smash() too. The door swings away from whoever opens it.

signal opened(loud: bool)

@export var swing_deg := 85.0
@export var slow_time := 1.6
var is_open := false
var busy := false
var _closed_y := 0.0
var _point: Interactable

func _ready() -> void:
	add_to_group("door")
	_closed_y = rotation.y
	_point = get_node_or_null("Point") as Interactable
	if _point:
		_point.used.connect(func(_w): _on_use())

func _on_use() -> void:
	if is_open or busy:
		return
	var p := get_tree().get_first_node_in_group("player") as Player
	if p == null:
		open_instant()
		return
	busy = true
	if _point: _point.enabled = false
	p.control_locked = true
	p.velocity = Vector3.ZERO
	var to := global_position - p.global_position
	p.rotation.y = atan2(-to.x, -to.z)
	p.model.play("push", 0.15)
	var target := _away_from(p.global_position)
	_sfx("floor_creak", -14.0, 0.7)
	var t := 0.0
	var smashed := false
	var start := rotation.y
	await get_tree().process_frame
	while t < slow_time:
		await get_tree().process_frame
		var dt := get_process_delta_time()
		t += dt
		rotation.y = lerp_angle(start, target, smoothstep(0.0, 1.0, t / slow_time))
		if t > 0.05 and Input.is_action_just_pressed("interact"):
			smashed = true
			break
	if smashed:
		p.model.play_once("melee", 0.03)
		await get_tree().create_timer(0.12, false).timeout
		_smash_swing(target)
	else:
		rotation.y = target
	is_open = true
	busy = false
	p.control_locked = false
	p.model.play(p.idle_anim, 0.2)
	opened.emit(smashed)

## Bursts open (Louis, or Norah spamming E).
func smash(from: Vector3 = Vector3.INF) -> void:
	if is_open:
		return
	is_open = true
	if _point: _point.enabled = false
	var target := _away_from(from) if from != Vector3.INF else _closed_y + deg_to_rad(swing_deg)
	_smash_swing(target)
	opened.emit(true)

func open_instant() -> void:
	is_open = true
	if _point: _point.enabled = false
	rotation.y = _away_from(global_position - _leaf_dir(_closed_y + PI * 0.5) * 2.0)

func _smash_swing(target: float) -> void:
	_sfx("door_slam", 2.0, 1.0)
	_sfx("knockdown", -4.0, 0.9)
	Cameras.shake(0.12, 0.3)
	var tw := create_tween()
	tw.tween_property(self, "rotation:y", target + signf(target - _closed_y) * 0.08, 0.14).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "rotation:y", target, 0.25).set_trans(Tween.TRANS_SINE)

## The open angle. Doors swing into whichever side has more room (a room rather than a hallway), so an open
## door doesn't stand across a corridor; when both sides are roomy, away from `p` (whoever opens it). The leaf then
## folds back as far as nothing is in the way (up to ~110 degrees).
func _away_from(p: Vector3) -> float:
	var room := []
	var mids := []
	for sgn in [1.0, -1.0]:
		var y: float = _closed_y + sgn * deg_to_rad(90.0)
		room.append(_room(y))
		mids.append((global_position + _leaf_dir(_closed_y + sgn * deg_to_rad(swing_deg)) * 0.5).distance_to(p))
	var first := 1.0
	if absf(room[0] - room[1]) > 0.6:
		first = 1.0 if room[0] > room[1] else -1.0
	else:
		first = 1.0 if mids[0] >= mids[1] else -1.0
	for sgn in [first, -first]:
		var a := _fold(sgn)
		if not is_nan(a): return a
	return _closed_y + first * deg_to_rad(swing_deg)

## How far it is to the next wall straight out from the middle of the doorway, on the side the leaf at `y` points to.
func _room(y: float) -> float:
	var space := get_world_3d().direct_space_state
	var mid := global_position + _leaf_dir(_closed_y) * (_leaf_len() * 0.5) + Vector3(0, 1.0, 0)
	var dir := _leaf_dir(y)
	var q := PhysicsRayQueryParameters3D.create(mid + dir * 0.2, mid + dir * 4.0, 1)
	q.exclude = _own()
	var hit := space.intersect_ray(q)
	return 4.0 if hit.is_empty() else mid.distance_to(hit["position"])

func _own() -> Array[RID]:
	var ex: Array[RID] = []
	for c in find_children("*", "CollisionObject3D", true, false):
		ex.append((c as CollisionObject3D).get_rid())
	return ex

func _leaf_dir(y: float) -> Vector3:
	var par := get_parent() as Node3D
	var b := par.global_transform.basis if par else Basis.IDENTITY
	return (b * Vector3(cos(y), 0, -sin(y))).normalized()

func _leaf_len() -> float:
	var leaf := get_node_or_null("Leaf") as MeshInstance3D
	if leaf and leaf.mesh: return leaf.position.x * 2.0
	return 0.9

## The widest open angle on one side whose leaf doesn't run into anything (NAN if even swing_deg is blocked).
func _fold(sgn: float) -> float:
	var space := get_world_3d().direct_space_state
	var ex := _own()
	var L := _leaf_len() + 0.04
	var best := NAN
	var deg := swing_deg
	while deg <= 110.0:
		var y: float = _closed_y + sgn * deg_to_rad(deg)
		var dir := _leaf_dir(y)
		var clear := true
		for h in [0.4, 1.1, 1.8]:
			var from := global_position + Vector3(0, h, 0) + dir * 0.2      # clear of the wall the hinge sits in
			var q := PhysicsRayQueryParameters3D.create(from, global_position + Vector3(0, h, 0) + dir * L, 1)
			q.exclude = ex
			if not space.intersect_ray(q).is_empty():
				clear = false
				break
		if not clear: break
		best = y
		deg += 5.0
	return best

func _sfx(nm: String, db: float, pitch: float) -> void:
	var a := AudioStreamPlayer3D.new()
	a.stream = load("res://assets/audio/%s.wav" % nm)
	a.volume_db = db
	a.pitch_scale = pitch
	a.unit_size = 5.0
	add_child(a)
	a.position = Vector3(0.5, 1.0, 0)
	a.play()
	a.finished.connect(a.queue_free)
