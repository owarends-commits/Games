class_name LouisAI
extends Node
## Louis, a BCROSS Brute, as an enemy. Slow, heavy and aware: he walks at her,
## always turning to keep her in front of him, and when she's in reach he hauls the swollen left arm back (the tell)
## and swings it. It takes nearly everything she has to put him down.
##
## Where he's hit matters (scripts/enemies/cross_body.gd): the head hurts most and rocks him back the longest, the
## body knocks him back, an arm or leg hurts him less but can be blown off. A Brute doesn't flinch out of a swing
## that's already coming unless it's to the head, the legs, or something comes off.
##   Lose a leg: he drops onto his knuckles and drags himself on, slower. Both: he crawls.
##   Lose the big arm: no more haymakers, only a rake with the other hand, up close.
## He finds his way between rooms with a small graph of Norah's house (data/ch1_layout.json).

signal died                 ## he went down: knocked flat (looks dead) or, once `life` is gone, for good
signal killed_for_good      ## really dead, for good (after `died`)

const CORE_HP := 8.0          ## what puts him down (on the floor, looking dead) in any one fight
const LIFE := 26.0            ## all he has, over the whole night: a Brute. Damage carries over between encounters.
const RISE_HP := 6.0          ## each time he gets back up, it takes this much to put him down again
const WALK_SPEED := 0.85              ## m/s, walking
const DRAG_SPEED := 0.6               ## one leg gone
const CRAWL_SPEED := 0.4              ## both legs gone
const TURN_SPEED := 2.2               ## rad/s: he turns to follow her, never snaps
const SWING_REACH := 2.3
const SWING_DAMAGE := 40.0
const RAKE_REACH := 1.35
const RAKE_DAMAGE := 18.0
var actor: Actor
var player: Player
var combat: NorahCombat
var audio: AudioDirector
var body: CrossBody
var hp := CORE_HP
var life := LIFE
var dead := false             ## down (not moving): knocked flat or killed
var killed := false           ## for good
var use_nav := true            ## route through Norah's house graph when she's out of sight (indoors there only)
var speed_mult := 1.0         ## outdoors the stalker covers ground faster than his shambling indoor walk
var active := false
var indoors := true
var state := "idle"
var _t := 0.0
var _cool := 1.2
var _swung := false
var _dir := Vector3.ZERO
var _knock := 0.0
var _stagger := 0.0
var nav := {}            ## name -> Vector3
var edges := {}          ## name -> [names]
var _path: Array = []
var _repath := 0.0
var _space: PhysicsDirectSpaceState3D

func setup(a: Actor, p: Player, c: NorahCombat, au: AudioDirector, layout: Dictionary) -> void:
	actor = a
	player = p
	combat = c
	audio = au
	for k in layout["nav"]:
		var v = layout["nav"][k]
		nav[k] = Vector3(v[0], 0, v[1])
		edges[k] = []
	for e in layout["edges"]:
		edges[e[0]].append(e[1])
		edges[e[1]].append(e[0])
	if actor.skeleton:
		body = CrossBody.new()
		body.name = "CrossBody"
		actor.skeleton.add_child(body)
		body.setup(actor, {"arm_L": 3.0, "arm_R": 2.0, "leg_L": 2.0, "leg_R": 2.0}, {"L": 0.13, "R": 0.045})   # hit radii match the model: the big arm is three times the other
		body.limb_lost.connect(_on_limb_lost)

func start() -> void:
	active = true
	_go("stride")

func has_big_arm() -> bool:
	return body == null or not body.is_lost("arm_L")

func legs_lost() -> int:
	return body.legs_lost() if body else 0

func _move_anim() -> String:
	if legs_lost() > 0: return "stalk"
	return "stride_hunch" if indoors else "stride"

func _move_speed() -> float:
	return [WALK_SPEED, DRAG_SPEED, CRAWL_SPEED][legs_lost()] * speed_mult

func _go(s: String) -> void:
	if s != state and s in ["windup", "recover"]: print("[louis] ", s)
	state = s
	_t = 0.0
	match s:
		"stride":
			var anim := _move_anim()
			actor.play(anim, 0.25, 0.55 if anim != "stalk" else (0.7 if legs_lost() == 1 else 0.45))
		"windup":
			_swung = false
			if has_big_arm() and legs_lost() == 0:
				actor.play_once("brute_swing", 0.08)
				audio.sfx("louis_shriek", -10.0, 0.55)
			else:
				actor.play_once("swipe", 0.06)
		"recover":
			actor.play("brood" if legs_lost() == 0 else "pant", 0.25)
		"hit":
			pass             # the jolt plays on the body (CrossBody); the walk carries on underneath

func can_see_point(p: Vector3) -> bool:
	if _space == null:
		_space = actor.get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(actor.global_position + Vector3(0, 1.2, 0), p, 1)
	return _space.intersect_ray(q).is_empty()

## A straight walk from `from` to `to` with nothing in the way: checked at knee and chest height, and along both
## of his shoulders (he's wide), so he doesn't cut through a bed or a table corner.
func _clear(from: Vector3, to: Vector3, width := 0.28) -> bool:
	if _space == null:
		_space = actor.get_world_3d().direct_space_state
	var d := to - from
	d.y = 0.0
	var side := Vector3(-d.z, 0, d.x).normalized() * width if d.length() > 0.01 else Vector3.ZERO
	for h in [0.3, 1.0]:
		for o in [Vector3.ZERO, side, -side]:
			var q := PhysicsRayQueryParameters3D.create(from + o + Vector3(0, h, 0), to + o + Vector3(0, h, 0), 1)
			if not _space.intersect_ray(q).is_empty():
				return false
	return true

## The way to step this frame: straight at the target if that's open for the next half metre, otherwise the
## nearest open heading either side (local steering around furniture the house graph doesn't know about).
func _steer(dir: Vector3) -> Vector3:
	var p := actor.global_position
	if _clear(p, p + dir * 0.55, 0.22):
		return dir
	for deg in [25.0, -25.0, 50.0, -50.0, 75.0, -75.0]:
		var dd := dir.rotated(Vector3.UP, deg_to_rad(deg))
		if _clear(p, p + dd * 0.55, 0.22):
			return dd
	return Vector3.ZERO

## [when the blow lands, how long the move lasts, reach, damage]
func _swing_timing() -> Array:
	if has_big_arm() and legs_lost() == 0:
		return [0.62, 1.6, SWING_REACH, SWING_DAMAGE]
	return [0.3, 0.7, RAKE_REACH, RAKE_DAMAGE]

func _physics_process(delta: float) -> void:
	if not active or dead:
		return
	_t += delta
	_cool -= delta
	var to := player.global_position - actor.global_position
	to.y = 0.0
	var dist := to.length()
	var facing := -actor.global_basis.z
	facing.y = 0.0
	var ahead := facing.normalized().dot(to / maxf(dist, 0.01))
	match state:
		"stride":
			var sw := _swing_timing()
			if dist > sw[2] * 0.8:
				_move_toward_player(delta, _move_speed())
			if dist < sw[2] and _cool <= 0.0 and ahead > 0.8 and can_see_point(player.global_position + Vector3(0, 1.0, 0)):
				_go("windup")
		"windup":
			var sw := _swing_timing()
			if not _swung and _t >= sw[0]:
				_swung = true
				audio.sfx("brute_whoosh", 0.0, 1.0 if sw[3] > 30.0 else 1.4)
				if dist < sw[2] + 0.25 and ahead > 0.55:
					if player.invulnerable_t <= 0.0:
						combat.take_damage(sw[3], to.normalized())
					else:
						print("[louis] missed (she rolled)")
			if _t >= sw[1]:
				_cool = 2.2
				_go("recover")
		"recover":      # after a swing: heavy, breathing, open
			if _t >= 1.0:
				_go("stride")
		"hit":          # knocked back; how long depends on where it landed
			var k := _dir * _knock * 3.3 * maxf(0.0, 1.0 - _t / 0.3) * delta
			BodySweep.move(actor, k, 0.3, 1.4)
			if _t >= _stagger:
				_cool = maxf(_cool, 0.5)
				_go("stride")
	actor.global_position.y = move_toward(actor.global_position.y, 0.0, delta * 3.0)
	# aware: he keeps her in front of him, turning steadily (not during the blow itself)
	if not (state == "windup" and _t > float(_swing_timing()[0]) - 0.15) and dist > 0.05:
		actor.rotation.y = rotate_toward(actor.rotation.y, atan2(-to.x, -to.z), delta * TURN_SPEED)

var _boxed := 0.0
func _move_toward_player(delta: float, speed: float) -> void:
	var target := player.global_position
	if use_nav and not _clear(actor.global_position, target):
		_repath -= delta
		if _path.is_empty() or _repath <= 0.0:
			_repath = 0.6
			_path = _route(actor.global_position, target)
		while not _path.is_empty() and Vector2(actor.global_position.x - _path[0].x, actor.global_position.z - _path[0].z).length() < 0.35:
			_path.pop_front()
		if not _path.is_empty():
			target = _path[0]
	else:
		_path.clear()
	var to := target - actor.global_position
	to.y = 0.0
	if to.length() < 0.05:
		return
	for d in actor.get_tree().get_nodes_in_group("door"):       # a shut door doesn't stop him: he goes through it
		var door := d as Door
		if not door.is_open and door.global_position.distance_to(actor.global_position) < 1.6:
			door.smash(actor.global_position)
	var step := _steer(to.normalized())
	if step == Vector3.ZERO:
		_boxed += delta
		_repath = 0.0                 # boxed in: find another way next frame
		if _boxed < 0.8: return
		step = to.normalized()        # still boxed in after a moment: push along whatever's in the way (never through it)
	else:
		_boxed = 0.0
	BodySweep.move(actor, step * speed * delta, 0.3, 1.4)
	actor.rotation.y = rotate_toward(actor.rotation.y, atan2(-to.x, -to.z), delta * TURN_SPEED)

func _nearest_visible(p: Vector3) -> String:
	var best := ""
	var bd := INF
	for k in nav:
		var d: float = p.distance_to(nav[k])
		if d < bd and _clear(p, nav[k]):
			bd = d
			best = k
	if best == "":
		for k in nav:
			var d: float = p.distance_to(nav[k])
			if d < bd:
				bd = d
				best = k
	return best

## A* over the house graph.
func _route(from: Vector3, to: Vector3) -> Array:
	var a := _nearest_visible(from)
	var b := _nearest_visible(to)
	if a == "" or b == "":
		return []
	var open := [a]
	var came := {}
	var g := {a: 0.0}
	while not open.is_empty():
		var cur: String = open[0]
		var best_f := INF
		for n in open:
			var fsc: float = g[n] + nav[n].distance_to(nav[b])
			if fsc < best_f:
				best_f = fsc
				cur = n
		if cur == b:
			break
		open.erase(cur)
		for nb in edges[cur]:
			var ng: float = g[cur] + nav[cur].distance_to(nav[nb])
			if not g.has(nb) or ng < g[nb]:
				g[nb] = ng
				came[nb] = cur
				if not nb in open:
					open.append(nb)
	var path := []
	var c := b
	while c != a and came.has(c):
		path.push_front(nav[c])
		c = came[c]
	path.push_front(nav[a])
	path.append(to)
	return path

## Would a hit to this zone finish him?
func would_kill(zone: String) -> bool:
	return hp - float(CrossBody.ZONES.get(zone, CrossBody.ZONES["torso"])["core"]) <= 0.0

## A shot with no location (old callers): to the body.
func take_hit(dmg: float, dir: Vector3) -> void:
	take_hit_zone("torso", "", "", dir, dmg)

func take_hit_zone(zone: String, limb: String, segment: String, dir: Vector3, power := 1.0) -> void:
	if dead:
		return
	var r: Dictionary = body.hit(zone, limb, segment, dir, power) if body else {"core": power, "knock": 0.9, "stagger": 0.55, "severed": ""}
	hp -= float(r["core"])
	life -= float(r["core"])
	print("[louis] hit %s%s -> hp %.2f life %.2f%s" % [zone, (" " + limb) if limb != "" else "", hp, life, (" (" + r["severed"] + " gone)") if r["severed"] != "" else ""])
	audio.sfx("across_shriek", -2.0 if zone == "head" else -6.0, 0.5 + randf() * 0.06)
	(actor.get_node("Steam") as CPUParticles3D).emitting = true
	_spray(dir, 70 if hp <= 0.0 or r["severed"] != "" else 30, zone)
	_dir = dir
	if hp <= 0.0:
		_die(dir)
		return
	# a Brute keeps swinging through a body or arm hit; the head, the legs, or losing a limb stops him
	var interrupts: bool = zone in ["head", "leg"] or r["severed"] != ""
	if state == "windup" and not interrupts:
		return
	_knock = float(r["knock"])
	_stagger = float(r["stagger"])
	_go("hit")

func _on_limb_lost(limb: String) -> void:
	audio.sfx("louis_shriek", 2.0, 0.7)
	audio.sfx("wall_smash", -6.0, 1.4)
	if limb.begins_with("leg"):
		actor.play(_move_anim(), 0.15)       # down onto his knuckles

func shoved(dir: Vector3) -> void:
	if dead:
		return
	hp -= 0.12          # a shove barely hurts a Brute; it buys a moment
	life -= 0.12
	_dir = dir
	audio.sfx("body_land", -6.0, 1.3)
	if hp <= 0.0:
		_die(dir)
		return
	if state != "windup":
		_knock = 0.25
		_stagger = 0.4
		_go("hit")

## Dark blood thrown out of the exit side, from where he was hit.
func _spray(dir: Vector3, n: int, zone := "torso") -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = n
	p.lifetime = 0.9
	p.direction = (dir + Vector3(0, 0.45, 0)).normalized()
	p.spread = 32.0
	p.initial_velocity_min = 2.5
	p.initial_velocity_max = 6.5
	p.gravity = Vector3(0, -11, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.4
	var q := QuadMesh.new()
	q.size = Vector2(0.06, 0.06)
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.albedo_color = Color(0.22, 0.02, 0.02)
	q.material = m
	p.mesh = q
	actor.get_parent().add_child(p)
	var at := actor.global_position + Vector3(0, 1.2 * actor.scale.y, 0)
	if body:
		at = body.part_center(zone)
	p.global_position = at
	p.emitting = true
	get_tree().create_timer(1.6, false).timeout.connect(p.queue_free)

## Back on his feet after being knocked flat: up off the floor, a shriek, and on again. Damage carries over:
## whatever limbs are gone stay gone, and `life` keeps what's left.
func rise() -> void:
	if killed: return
	audio.sfx("louis_shriek", -4.0, 0.45)
	await actor.play_once("bed_crash", 0.2)      # face down, hands under him, up onto his feet
	hp = minf(RISE_HP, life)
	dead = false
	state = "idle"
	start()

func _die(dir: Vector3) -> void:
	dead = true
	active = false
	state = "dead"
	if life <= 0.0:
		killed = true
		print("[louis] killed (for good)")
	else:
		print("[louis] down (life %.2f left)" % life)
	var dest := actor.global_position + dir * 1.2      # the last shot drives him back before he goes down
	if dir != Vector3.ZERO and _clear(actor.global_position, dest + dir * 0.4):
		actor.create_tween().tween_property(actor, "global_position", dest, 0.4).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	audio.sfx("louis_shriek", 0.0, 0.5)
	audio.sfx("body_land", 4.0, 0.6)
	await actor.play_once("die", 0.06)
	actor.play("dead", 0.1)
	died.emit()
	if killed:
		killed_for_good.emit()
