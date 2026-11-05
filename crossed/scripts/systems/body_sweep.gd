class_name BodySweep
## Moves that respect the world. Scripted characters (NPCs, Louis, anyone a cutscene glides around) are plain
## Node3Ds with no physics body of their own, so on their own they walk through walls, beds and doors. Every such
## move goes through here instead: a body-sized capsule is swept along the motion against the world (layer 1,
## which includes Norah) and the character stops at, or slides along, whatever it meets.

const LIFT := 0.18          ## the capsule rides this far off the floor, so the floor itself never counts

static var _shapes := {}
static var blocked_log := true   ## print a line when a scripted move is stopped dead (finds bad waypoints)

## Moves `who` by up to `motion`. Returns the motion actually made. With `slide`, a blocked move keeps whatever
## part of it runs along the wall (walls here are mostly square to the axes, so it tries each axis).
static func move(who: Node3D, motion: Vector3, radius := 0.24, height := 1.3, slide := true, exclude: Array = []) -> Vector3:
	if motion.length_squared() < 1e-10:
		return Vector3.ZERO
	if not who.is_inside_tree() or who.get_world_3d() == null:
		who.global_position += motion
		return motion
	var q := _query(who, radius, height, exclude)
	var made := _cast(who, q, motion)
	if slide and made.length_squared() < motion.length_squared() * 0.98:
		var rest := motion - made
		var best := Vector3.ZERO
		for axis in [Vector3(rest.x, rest.y, 0.0), Vector3(0.0, rest.y, rest.z)]:
			if axis.length_squared() < 1e-10: continue
			var q2 := _query(who, radius, height, exclude)
			var got := _try(who, q2, axis)
			if got.length_squared() > best.length_squared(): best = got
		if best != Vector3.ZERO:
			who.global_position += best
			made += best
	return made

## Is a body standing at `at` overlapping the world?
static func blocked_at(who: Node3D, at: Vector3, radius := 0.24, height := 1.3, exclude: Array = []) -> bool:
	if not who.is_inside_tree(): return false
	var q := _query(who, radius, height, exclude)
	q.transform.origin = at + Vector3(0, LIFT + height * 0.5, 0)
	return not who.get_world_3d().direct_space_state.intersect_shape(q, 1).is_empty()

static func _query(who: Node3D, radius: float, height: float, exclude: Array) -> PhysicsShapeQueryParameters3D:
	var key := "%.2f/%.2f" % [radius, height]
	if not _shapes.has(key):
		var c := CapsuleShape3D.new()
		c.radius = radius
		c.height = maxf(height, radius * 2.0 + 0.01)
		_shapes[key] = c
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = _shapes[key]
	q.collision_mask = 1
	q.transform = Transform3D(Basis(), who.global_position + Vector3(0, LIFT + height * 0.5, 0))
	var ex: Array[RID] = []
	_own_rids(who, ex)
	for e in exclude:
		if e is CollisionObject3D: ex.append((e as CollisionObject3D).get_rid())
		elif e is RID: ex.append(e)
	q.exclude = ex
	return q

static func _own_rids(n: Node, out: Array[RID]) -> void:
	if n is CollisionObject3D: out.append((n as CollisionObject3D).get_rid())
	for c in n.get_children(): _own_rids(c, out)

static func _cast(who: Node3D, q: PhysicsShapeQueryParameters3D, motion: Vector3) -> Vector3:
	var got := _try(who, q, motion)
	who.global_position += got
	return got

## How far along `motion` the capsule gets (not applied).
static func _try(who: Node3D, q: PhysicsShapeQueryParameters3D, motion: Vector3) -> Vector3:
	var space := who.get_world_3d().direct_space_state
	# already inside something (spawned overlapping, or a door swung into it): let it walk out rather than freeze
	if not space.intersect_shape(q, 1).is_empty():
		return motion
	q.motion = motion
	var r := space.cast_motion(q)
	q.motion = Vector3.ZERO
	return motion * r[0]

## Adds a glide to tween `tw`: like tween_property(who, "global_position", to, time), but the move is swept and
## stops at (or slides along) walls and furniture. Chain set_trans/set_ease on the result as usual.
static func glide_into(tw: Tween, who: Node3D, to: Vector3, time: float, radius := 0.24, height := 1.3, exclude: Array = []) -> MethodTweener:
	var from: Array = [null]
	return tw.tween_method(func(k: float) -> void:
		if from[0] == null:
			from[0] = who.global_position
		var want: Vector3 = (from[0] as Vector3).lerp(to, k)
		move(who, want - who.global_position, radius, height, true, exclude), 0.0, 1.0, time)
