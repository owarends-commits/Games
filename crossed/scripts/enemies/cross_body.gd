class_name CrossBody
extends SkeletonModifier3D
## Where a Cross gets hit matters. This sits on an enemy's skeleton and:
##  - finds which part a shot struck: the head, the torso, an arm or a leg (upper or lower), tested against the
##    bones as they are posed this frame (so a crouched, swinging or crawling body is hit where it really is);
##  - keeps health for each limb; a limb that runs out is blown off at the joint it was hit above (the bone
##    collapses, a stump and a severed piece are left, blood pools under it);
##  - plays the hit on the body on top of whatever it is doing: the head snaps back, the torso rocks, an arm is
##    knocked aside, a knee buckles. Bigger hits, bigger jolts.
## The AI decides what the hit *means* (damage, knockback, stagger, how a missing leg changes how it moves) from
## what hit() returns, using the numbers in ZONES.

signal limb_lost(limb: String)

## Per zone: damage to the body (x the shot), how far it knocks him back (m), how long it staggers him (s), and how
## hard the part itself jolts. Limbs also take `limb` damage toward being blown off.
const ZONES := {
	"head":  {"core": 2.0, "knock": 0.45, "stagger": 1.1, "jolt": 1.0},
	"torso": {"core": 1.0, "knock": 0.9, "stagger": 0.55, "jolt": 0.8},
	"arm":   {"core": 0.4, "limb": 1.0, "knock": 0.25, "stagger": 0.3, "jolt": 1.0},
	"leg":   {"core": 0.4, "limb": 1.0, "knock": 0.15, "stagger": 0.75, "jolt": 1.0},
}

var actor: Node3D
var limb_hp := {"arm_L": 2.0, "arm_R": 2.0, "leg_L": 2.0, "leg_R": 2.0}
var arm_radius := {"L": 0.07, "R": 0.07}     ## metres at scale 1 (a Brute's swollen arm is far thicker)
var lost := {}                                ## limb -> the bone it was taken off at
var _b := {}                                  ## bone name -> index
var _jolts: Array = []                        ## [bone index, axis, degrees, time left, duration]

func setup(a: Node3D, hp_per_limb: Dictionary, arm_r: Dictionary) -> void:
	actor = a
	for k in hp_per_limb: limb_hp[k] = float(hp_per_limb[k])
	for k in arm_r: arm_radius[k] = float(arm_r[k])

func _bone(n: String) -> int:
	if not _b.has(n):
		var sk := get_skeleton()
		_b[n] = sk.find_bone(n) if sk else -1
	return _b[n]

func _gpos(n: String) -> Vector3:
	var sk := get_skeleton()
	var i := _bone(n)
	if sk == null or i < 0: return actor.global_position
	return sk.global_transform * sk.get_bone_global_pose(i).origin

func _scale() -> float:
	return actor.global_basis.get_scale().x if actor else 1.0

func is_lost(limb: String) -> bool:
	return lost.has(limb)

func legs_lost() -> int:
	return int(lost.has("leg_L")) + int(lost.has("leg_R"))

## The parts as capsules, posed as they are right now: [zone, limb, segment, a, b, radius].
func _parts() -> Array:
	var s := _scale()
	var head := _gpos("head")
	var neck := _gpos("neck")
	var up := (head - neck).normalized() if head.distance_to(neck) > 0.01 else Vector3.UP
	var out := [["head", "", "", head, head + up * 0.22 * s, 0.13 * s], ["torso", "", "", _gpos("hips"), neck, 0.21 * s]]
	for side: String in ["L", "R"]:
		var limb: String = "arm_" + side
		if not lost.has(limb) or lost[limb] == "forearm." + side:
			out.append(["arm", limb, "upper", _gpos("upperarm." + side), _gpos("forearm." + side), arm_radius[side] * s])
		if not lost.has(limb):
			var f := _gpos("forearm." + side); var h := _gpos("hand." + side)
			out.append(["arm", limb, "lower", f, h + (h - f).normalized() * 0.15 * s, arm_radius[side] * 0.85 * s])
		limb = "leg_" + side
		if not lost.has(limb) or lost[limb] == "shin." + side:
			out.append(["leg", limb, "upper", _gpos("thigh." + side), _gpos("shin." + side), 0.1 * s])
		if not lost.has(limb):
			out.append(["leg", limb, "lower", _gpos("shin." + side), _gpos("foot." + side), 0.08 * s])
	return out

## Where along the ray (from o, direction d, up to `reach` m) it first strikes the body: {t, zone, limb, segment}.
func ray_test(o: Vector3, d: Vector3, reach: float) -> Dictionary:
	var best := {}
	var best_t := reach
	for p in _parts():
		var t := _ray_capsule(o, d, p[3], p[4], p[5])
		if t >= 0.0 and t < best_t:
			best_t = t
			best = {"t": t, "zone": p[0], "limb": p[1], "segment": p[2], "point": o + d * t}
	return best

## A part to aim at for scripted shots (autoplay): its centre.
func part_center(zone: String, limb := "") -> Vector3:
	for p in _parts():
		if p[0] == zone and (limb == "" or p[1] == limb):
			return (p[3] + p[4]) * 0.5
	return _gpos("hips")

## The shot lands. Returns what it did: {core, knock, stagger, severed: limb or ""}.
func hit(zone: String, limb: String, segment: String, dir: Vector3, power := 1.0) -> Dictionary:
	var z: Dictionary = ZONES.get(zone, ZONES["torso"])
	var res := {"core": z["core"] * power, "knock": z["knock"], "stagger": z["stagger"], "severed": ""}
	var j: float = z["jolt"]
	match zone:
		"head":
			_jolt("head", Vector3.RIGHT, 38.0 * j, 0.5); _jolt("neck", Vector3.RIGHT, 18.0 * j, 0.55)
			_jolt("chest", Vector3.RIGHT, 8.0 * j, 0.5)
		"torso":
			_jolt("chest", Vector3.RIGHT, 18.0 * j, 0.45); _jolt("spine", Vector3.RIGHT, 12.0 * j, 0.5)
			_jolt("head", Vector3.RIGHT, -14.0 * j, 0.5)
		"arm":
			var side := limb.substr(4)
			var sgn := -1.0 if side == "L" else 1.0
			_jolt("upperarm." + side, Vector3.FORWARD, 34.0 * sgn * j, 0.4); _jolt("forearm." + side, Vector3.RIGHT, -26.0 * j, 0.4)
			_jolt("chest", Vector3.UP, 10.0 * -sgn, 0.4)
		"leg":
			var side := limb.substr(4)
			_jolt("thigh." + side, Vector3.RIGHT, 22.0 * j, 0.6); _jolt("shin." + side, Vector3.RIGHT, -46.0 * j, 0.6)
			_jolt("hips", Vector3.RIGHT, -8.0, 0.6)
	if limb != "" and not lost.has(limb):
		limb_hp[limb] -= z.get("limb", 0.0) * power
		if limb_hp[limb] <= 0.0:
			var side := limb.substr(limb.length() - 1)
			var bone: String
			if limb.begins_with("arm"):
				bone = ("upperarm." if segment == "upper" else "forearm.") + side
			else:
				bone = ("thigh." if segment == "upper" else "shin.") + side
			_sever(limb, bone, dir)
			res["severed"] = limb
			res["stagger"] = maxf(res["stagger"], 1.2)
	return res

func _jolt(bone: String, axis: Vector3, deg: float, dur: float) -> void:
	var i := _bone(bone)
	if i >= 0: _jolts.append([i, axis, deg, dur, dur])

## The limb comes off at `bone`: the bone collapses to nothing (taking everything below it), a raw stump is left on
## the joint above, the piece falls, and blood sprays and pools.
func _sever(limb: String, bone: String, dir: Vector3) -> void:
	lost[limb] = bone
	var sk := get_skeleton()
	var i := _bone(bone)
	if sk == null or i < 0: return
	var s := _scale()
	var a := _gpos(bone)
	var end_name: String = {"upperarm": "hand", "forearm": "hand", "thigh": "foot", "shin": "foot"}[bone.get_slice(".", 0)] + "." + bone.get_slice(".", 1)
	var b := _gpos(end_name)
	var thick: float = (arm_radius[bone.get_slice(".", 1)] if limb.begins_with("arm") else 0.09) * s
	# the stump: raw meat on the joint above
	var parent := sk.get_bone_parent(i)
	if parent >= 0:
		var ba := BoneAttachment3D.new()
		ba.bone_idx = parent
		sk.add_child(ba)
		for k in 3:                                          # a ragged knot of torn meat, not a ball
			var stump := MeshInstance3D.new()
			var sm := SphereMesh.new(); sm.radius = thick * (0.55 - k * 0.1); sm.height = thick * (0.8 - k * 0.15); sm.radial_segments = 6; sm.rings = 3
			stump.mesh = sm
			stump.material_override = _meat_mat()
			ba.add_child(stump)
			stump.position = sk.get_bone_rest(i).origin * (0.85 + k * 0.08) + Vector3(randf_range(-0.3, 0.3), randf_range(-0.3, 0.3), randf_range(-0.3, 0.3)) * thick
			stump.rotation = Vector3(randf() * TAU, randf() * TAU, 0)
	# the piece that came off
	var piece := MeshInstance3D.new()
	var cm := CapsuleMesh.new(); cm.radius = thick * 0.9; cm.height = maxf(a.distance_to(b) + 0.15 * s, thick * 2.2); cm.radial_segments = 8; cm.rings = 2
	piece.mesh = cm
	var skin := StandardMaterial3D.new(); skin.albedo_color = Color(0.6, 0.48, 0.42)
	piece.material_override = skin
	actor.get_parent().add_child(piece)
	piece.global_position = (a + b) * 0.5
	piece.look_at(piece.global_position + (b - a).normalized() + Vector3(0.001, 0, 0), Vector3.UP)
	piece.rotate_object_local(Vector3.RIGHT, PI / 2)
	var land := Vector3((a.x + b.x) * 0.5, thick * 0.9, (a.z + b.z) * 0.5) + dir * 0.6 * s
	var t := piece.create_tween().set_parallel(true)
	t.tween_property(piece, "global_position", land, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	t.tween_property(piece, "rotation", Vector3(PI / 2, randf() * TAU, 0), 0.45)
	_blood_pool(land)
	limb_lost.emit(limb)

func _meat_mat() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.22, 0.03, 0.03)
	m.roughness = 0.85
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	return m

func _blood_pool(at: Vector3) -> void:
	var q := MeshInstance3D.new()
	var pm := PlaneMesh.new(); pm.size = Vector2(0.9, 0.9) * _scale()
	q.mesh = pm
	var m := StandardMaterial3D.new(); m.albedo_color = Color(0.18, 0.01, 0.01); m.roughness = 0.15
	q.material_override = m
	actor.get_parent().add_child(q)
	q.global_position = Vector3(at.x, 0.015, at.z)
	q.scale = Vector3(0.1, 1, 0.1)
	q.create_tween().tween_property(q, "scale", Vector3(1, 1, 1), 2.5).set_ease(Tween.EASE_OUT)

## After the animation has posed him: the jolts from recent hits, and the limbs that are gone.
func _process_modification() -> void:
	var sk := get_skeleton()
	if sk == null: return
	var dt := get_process_delta_time()
	for k in range(_jolts.size() - 1, -1, -1):
		var j: Array = _jolts[k]
		j[3] -= dt
		if j[3] <= 0.0:
			_jolts.remove_at(k)
			continue
		var u: float = 1.0 - j[3] / j[4]
		var amt: float = sin(minf(1.0, u * 3.0) * PI * 0.5) * (1.0 - u)      # snaps in, eases out
		var q := Quaternion((j[1] as Vector3).normalized(), deg_to_rad(j[2] * amt))
		sk.set_bone_pose_rotation(j[0], sk.get_bone_pose_rotation(j[0]) * q)
	for limb in lost:
		var i := _bone(lost[limb])
		if i >= 0: sk.set_bone_pose_scale(i, Vector3.ONE * 0.001)

## Distance along the ray to where it passes within r of the segment a-b (or -1).
static func _ray_capsule(o: Vector3, d: Vector3, a: Vector3, b: Vector3, r: float) -> float:
	var ab := b - a
	var w0 := o - a
	var aa := d.dot(d); var bb := d.dot(ab); var cc := ab.dot(ab); var dd := d.dot(w0); var ee := ab.dot(w0)
	var den := aa * cc - bb * bb
	var sc := 0.0; var tc := 0.0
	if absf(den) > 1e-6:
		sc = (bb * ee - cc * dd) / den
		tc = (aa * ee - bb * dd) / den
	tc = clampf(tc, 0.0, 1.0)
	sc = maxf(0.0, d.dot(a + ab * tc - o) / aa)
	if (o + d * sc).distance_to(a + ab * tc) <= r:
		return sc
	return -1.0
