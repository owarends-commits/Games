class_name LouisStalker
extends Node
## Louis after the house fight. He went down, he looked dead, and while Norah watched the broadcast he got up and
## went out the window he came in by. From then on he hunts her through the rest of Chapter One.
##
## He's a Brute: she can't kill him with what she has at the start. Each time she puts him down he lies there a
## while, then gets up again (if she's still near) or drags himself off into the dark and comes back later from
## somewhere she can't see. Every hit carries over (LouisAI.life, lost limbs). Empty `life` and he's dead for
## good, and leaves something behind (the chapter director handles that).
##
## States: off (not in play yet) - hunting - down (knocked flat) - gone (out of sight, will come back) - dead.

signal state_changed(s: String)

const SPEED_OUT := 2.1          ## times his indoor walk: about her walking pace. She can outrun him; she can't stroll.
const LOSE_DIST := 32.0         ## this far behind, he loses her
const DOWN_TIME := 13.0         ## how long he lies there before getting up again
const RESPAWN := [30.0, 45.0]   ## gone this long (s) before he finds her again
const AMBUSH_R := [11.0, 17.0]  ## how far from her he comes back in

var d                           ## Chapter1 director
var ai: LouisAI
var louis: Actor
var player: Player
var state := "off"
var enabled := false            ## the director turns him loose once she's out of the house
var _t := 0.0
var _respawn_t := -1.0
var next_respawn := -1.0        ## a one-off quicker comeback (after the upstairs window, he's right behind her)
var _engaged := false           ## autoplay: standing her ground (the scripted walk waits)

func setup(director, a: LouisAI, l: Actor, p: Player) -> void:
	d = director
	ai = a
	louis = l
	player = p
	ai.died.connect(_on_down)
	ai.killed_for_good.connect(_on_killed)

func _go(s: String) -> void:
	if s == state: return
	state = s
	_t = 0.0
	print("[stalker] ", s)
	state_changed.emit(s)

## Same floor of the same building (Louis's upstairs is a separate block on the map, x > 60)?
func _same_block(a: Vector3, b: Vector3) -> bool:
	return (a.x > 60.0) == (b.x > 60.0)

func _flat_dist() -> float:
	var v := louis.global_position - player.global_position
	v.y = 0.0
	return v.length()

var _off_t := 0.0
func _physics_process(delta: float) -> void:
	if state == "off" and enabled and not d._busy and not d._in_norah_house(player.global_position):
		_off_t += delta                   # she's been out a while and hasn't gone near her car: he finds her anyway
		if _off_t > 45.0:
			_off_t = -INF
			d._run_beat(d._stalker_reveal)
	if state == "off" or state == "dead":
		return
	_t += delta
	match state:
		"hunting":
			# he stops for her scripted moments (reading, a pickup, a cutscene), like everything else does
			ai.active = not d._busy and not d._doc_open and not d._inv_open and not ai.dead
			ai.use_nav = d._in_norah_house(player.global_position) and d._in_norah_house(louis.global_position)
			var dist := _flat_dist()
			d._stalk_music(dist)
			if dist > LOSE_DIST or not _same_block(player.global_position, louis.global_position):
				vanish(next_respawn if next_respawn > 0.0 else randf_range(RESPAWN[0], RESPAWN[1]))
				next_respawn = -1.0
			_autoplay_engage(dist)
		"down":
			if _t > DOWN_TIME:
				if _flat_dist() < 14.0 and _same_block(player.global_position, louis.global_position):
					_get_up()
				else:
					vanish(randf_range(RESPAWN[0], RESPAWN[1]))       # he dragged himself off while she was gone
		"gone":
			if not enabled: return
			_respawn_t -= delta
			if _respawn_t <= 0.0 and not d._busy and (d.autoplay or not player.control_locked):
				var at := find_spot(false)
				if at != Vector3.INF:
					spawn(at)
				else:
					_respawn_t = 2.0

## Puts him in play at `at`, hunting.
func spawn(at: Vector3) -> void:
	if state == "dead": return
	louis.scale = Vector3.ONE * d.LOUIS_SCALE
	louis.global_position = at
	var to := player.global_position - at
	louis.rotation.y = atan2(-to.x, -to.z)
	louis.visible = true
	ai.dead = false
	ai.indoors = false
	ai.speed_mult = SPEED_OUT
	if ai.hp <= 0.0: ai.hp = minf(LouisAI.RISE_HP, ai.life)
	ai.start()
	d._attach_growl(louis)
	_go("hunting")

## Out of play for `respawn` seconds, then back from somewhere she can't see.
func vanish(respawn: float) -> void:
	if state == "dead": return
	ai.active = false
	ai.dead = true                    # nothing to aim at
	louis.visible = false
	d._attach_growl(null)
	d._stalk_music(-1.0)
	_respawn_t = respawn
	_release()
	_go("gone")

func _on_down() -> void:
	if state == "off": return         # the house fight: the director handles that one
	_release()
	d._stalk_music(-1.0)
	d._attach_growl(null)
	if not ai.killed:
		_go("down")
		d._stalker_down()

func _get_up() -> void:
	_go("rising")
	await ai.rise()
	if state != "rising": return
	d._attach_growl(louis)
	_go("hunting")

func _on_killed() -> void:
	_release()
	_go("dead")
	d._louis_killed(louis.global_position)

## A place to come back in: on her floor, 11-17 m from her, standing room, inside the walkable map, and (unless
## `seen` is wanted, for a reveal) out of the shot the player is looking through.
func find_spot(seen: bool, r_min := AMBUSH_R[0], r_max := AMBUSH_R[1]) -> Vector3:
	var cam := get_viewport().get_camera_3d()
	var p := player.global_position
	var best := Vector3.INF
	var tries := [0.0, 30.0, -30.0, 60.0, -60.0, 90.0, -90.0, 120.0, -120.0, 150.0, -150.0, 180.0]
	var back := player.global_basis.z
	back.y = 0.0
	back = back.normalized() if back.length() > 0.01 else Vector3(0, 0, 1)
	for r in [r_max, (r_min + r_max) * 0.5, r_min]:
		for a in tries:
			var q: Vector3 = p + back.rotated(Vector3.UP, deg_to_rad(a + (180.0 if seen else 0.0))) * r
			q.y = 0.0
			if not d._in_bounds(q) or not _same_block(q, p): continue
			if d._in_norah_house(q): continue                           # he comes from outside, never from her rooms
			if BodySweep.blocked_at(louis, q, 0.3, 1.4): continue
			var visible := cam != null and cam.is_position_in_frustum(q + Vector3(0, 1.0, 0)) and _clear_line(cam.global_position, q + Vector3(0, 1.0, 0))
			if visible == seen:
				return q
	return best

func _clear_line(a: Vector3, b: Vector3) -> bool:
	var q := PhysicsRayQueryParameters3D.create(a, b, 1)
	return player.get_world_3d().direct_space_state.intersect_ray(q).is_empty()

# ------------------------------------------------------------------ autoplay (tests)
## The test run stands and fights when he's close and she has rounds; otherwise it keeps walking its route.
func _autoplay_engage(dist: float) -> void:
	if not d.autoplay: return
	var rounds: int = d.loaded              # rounds in the gun (it reloads on the move, not standing in front of him)
	# stand and shoot while he's coming at her across open ground; once he's on top of her, or she's out of
	# rounds, keep moving (he's slower than her). Hysteresis so it doesn't flicker.
	var want := rounds > 0 and not ai.dead and (dist > 3.2 and dist < 8.0 if not _engaged else dist > 2.2 and dist < 10.0)
	if want != _engaged:
		_engaged = want
		d.combat.engage = want
		d._stalk_hold = want

func _release() -> void:
	if _engaged:
		_engaged = false
		d.combat.engage = false
		d._stalk_hold = false
