extends Node
## Chooses which fixed camera is live.
## CameraZone areas report when the player enters or leaves them. The live camera is the
## highest-priority zone the player is inside; ties go to the zone entered most recently.
## Cutscenes can take over with push_override() and hand back with pop_override().

signal camera_changed(old_camera: Camera3D, new_camera: Camera3D)
signal zone_changed(zone_camera: Camera3D)     ## the area she's in changed (its fixed camera), even when the gameplay camera is live
var _last_zone: Camera3D

var _zones: Array = []          # [zone, entered_order]
var _order := 0
var _overrides: Array[Camera3D] = []
var current: Camera3D
var escape_mode := false   ## zones switch to their exit-facing cameras
## Over the shoulder: the gameplay camera (OTSCamera) is live whenever no cutscene camera has taken over.
## The zones keep being tracked so the gameplay camera can borrow the zone camera's environment (fog, light).
var gameplay: Camera3D
var gameplay_enabled := true

func set_gameplay(cam: Camera3D) -> void:
	gameplay = cam
	_refresh()

## The fixed camera the zones would choose (even while the gameplay camera is live).
func zone_camera() -> Camera3D:
	var best = null
	for z in _zones:
		if not is_instance_valid(z[0]) or z[0].active_camera() == null:
			continue
		if best == null or z[0].camera_priority > best[0].camera_priority or (z[0].camera_priority == best[0].camera_priority and z[1] > best[1]):
			best = z
	return best[0].active_camera() if best != null else null

func refresh() -> void:
	_refresh()

func enter_zone(zone) -> void:
	for z in _zones:
		if z[0] == zone:
			return
	_order += 1
	_zones.append([zone, _order])
	_refresh()

func exit_zone(zone) -> void:
	for i in range(_zones.size() - 1, -1, -1):
		if _zones[i][0] == zone:
			_zones.remove_at(i)
	_refresh()

func push_override(cam: Camera3D) -> void:
	_overrides.append(cam)
	_refresh()

func pop_override(cam: Camera3D = null) -> void:
	if cam:
		_overrides.erase(cam)
	elif not _overrides.is_empty():
		_overrides.pop_back()
	_refresh()

func clear() -> void:
	escape_mode = false
	_zones.clear()
	_overrides.clear()
	current = null
	_last_zone = null
	gameplay_enabled = true

func _refresh() -> void:
	var zc := zone_camera()
	if zc != _last_zone:
		_last_zone = zc
		zone_changed.emit(zc)
	var target: Camera3D = null
	if not _overrides.is_empty():
		target = _overrides.back()
	elif gameplay_enabled and gameplay and is_instance_valid(gameplay) and gameplay.is_inside_tree():
		target = gameplay
	else:
		var best = null
		for z in _zones:
			if not is_instance_valid(z[0]) or z[0].active_camera() == null:
				continue
			if best == null or z[0].camera_priority > best[0].camera_priority or (z[0].camera_priority == best[0].camera_priority and z[1] > best[1]):
				best = z
		if best != null:
			target = best[0].active_camera()
	if target == null or target == current:
		return
	var old := current
	current = target
	if not _overrides.is_empty() and target == _overrides.back():
		_unbury(target)
	current.make_current()
	camera_changed.emit(old, current)

# ------------------------------------------------------------------ camera reaction
var _shake_t := 0.0
var _shake_amp := 0.0
var _shake_cam: Camera3D

## Brief camera reaction (the window impact). Uses the camera's view offset, so it
## never moves the camera's actual transform.
func shake(amplitude := 0.08, time := 0.25) -> void:
	_shake_cam = current
	_shake_t = time
	_shake_amp = amplitude

func _process(delta: float) -> void:
	if _shake_cam == null:
		return
	if _shake_t > 0.0:
		_shake_t -= delta
		var a := _shake_amp * clampf(_shake_t / 0.25, 0.0, 1.0)
		_shake_cam.h_offset = randf_range(-a, a)
		_shake_cam.v_offset = randf_range(-a, a)
	else:
		_shake_cam.h_offset = 0.0
		_shake_cam.v_offset = 0.0
		_shake_cam = null

## Cut straight to a camera (cutscenes). Pass null to hand control back to the zones.
func cut_to(cam: Camera3D) -> void:
	_overrides.clear()
	if cam:
		_overrides.append(cam)
	_refresh()

func set_escape_mode(on: bool) -> void:
	escape_mode = on
	_refresh()


# ------------------------------------------------------------------ cameras respect the world
## A cutscene camera must never sit inside a wall or a piece of furniture, or look out at the scene through
## one. On the cut it's checked: buried in geometry, it's pushed forward along its view until it's clear; a wall
## right up against the lens (the camera on the wrong side of it), it's stepped through to the open side.
## Vehicles don't count (the in-car shots sit inside the car's body on purpose), nor do people.
var _unbury_shape := SphereShape3D.new()

func _ignorable(col: Object) -> bool:
	if col == null or col is CharacterBody3D:
		return true
	var n := col as Node
	for i in 4:
		if n == null: break
		var nm := String(n.name).to_lower()
		if nm.contains("car") or nm.contains("truck") or nm.contains("bmw") or n.is_in_group("vehicle"):
			return true
		n = n.get_parent()
	return false

func _solid_at(space: PhysicsDirectSpaceState3D, at: Vector3) -> bool:
	_unbury_shape.radius = 0.12
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = _unbury_shape
	q.collision_mask = 1
	q.transform = Transform3D(Basis(), at)
	for h in space.intersect_shape(q, 8):
		if not _ignorable(h["collider"]):
			return true
	return false

func _unbury(c: Camera3D) -> void:
	if not is_instance_valid(c) or not c.is_inside_tree() or c.get_world_3d() == null:
		return
	var space := c.get_world_3d().direct_space_state
	var fwd := -c.global_basis.z
	var p := c.global_position
	var moved := false
	var steps := 0
	while _solid_at(space, p) and steps < 30:
		p += fwd * 0.1
		steps += 1
		moved = true
	if steps >= 30:
		return                                  # buried deep: leave it be rather than fling it somewhere odd
	var r := space.intersect_ray(PhysicsRayQueryParameters3D.create(p, p + fwd * 0.45, 1))
	if not r.is_empty() and not _ignorable(r["collider"]):
		var beyond: Vector3 = r["position"] + fwd * 0.3
		if not _solid_at(space, beyond):
			p = beyond
			moved = true
	if moved:
		print("[cameras] %s was inside the scenery; moved %.2f m forward into the clear" % [c.name, p.distance_to(c.global_position)])
		c.global_position = p
