extends Node
## The ACROSS window breach: the prologue's signature scare. A scripted sequence, not AI.
##
## PARTY_NORMAL -> WINDOW_IMPACT -> CREATURE_LANDED -> CROWD_INSPECTION -> NEAR_SILENCE
##   -> ACROSS_AWAKENS -> FIRST_LUNGE -> PANIC_AND_ESCAPE
##
## Every state has its trigger, duration, animation, sound and camera written out in
## run() below, in order, so the timing can be tuned in one place.

enum State { PARTY_NORMAL, WINDOW_IMPACT, CREATURE_LANDED, CROWD_INSPECTION, NEAR_SILENCE, ACROSS_AWAKENS, FIRST_LUNGE, PANIC_AND_ESCAPE }
signal state_changed(state: State)

var state := State.PARTY_NORMAL
var d: PrologueDirector
var across: Actor
var shards: Array[Node3D] = []
var hip_smoke: CPUParticles3D
var glass_burst: CPUParticles3D
var rampage_on := false
var _hit_cooldown := 0.0
var downed := {}

const ADULTS := ["Rachel", "Marcus", "Denise", "Dad2", "Mom2", "Dad3", "Dad2b", "Mom2b", "Stranger"]
const KIDS := ["Amelia", "KidBoy", "KidGirl", "KidBoy2", "KidGirl2", "Adaline"]

func setup(director) -> void:
	d = director
	across = d.A.Across
	across.visible = false
	_make_hip_smoke()
	_make_glass()

func _enter(s: State) -> void:
	state = s
	state_changed.emit(s)
	print("[breach] ", State.keys()[s], "  t=", Time.get_ticks_msec() / 1000.0)

func _a(n: String) -> Actor:
	return d.A.get(n)

# ================================================================== the sequence
func run() -> void:
	var L: Vector3 = d.mk("LandingPoint")
	# ---------------------------------------------------------- WINDOW_IMPACT
	# trigger: Marcus's third line is cut off mid-sentence. ~1.2 s.
	# sound: sharp crash + low thump, party ambience drops away. camera: Cam4 + shake, 3-frame flash.
	_enter(State.WINDOW_IMPACT)
	Dialogue.interrupt()
	_start_flicker()
	for it in get_tree().get_nodes_in_group("interactable"):
		(it as Interactable).enabled = false
	Cameras.cut_to(d.cam("Cam4_Breach"))
	# no build-up: the loudest sound in the prologue, all at once, and the party audio just stops
	d.audio.set_levels({"rain_ext_loop": -16.0, "rain_int_loop": -18.0}, 0.02)
	d.audio.sfx("glass_crash", 6.0)
	d.audio.sfx("glass_crash", 4.0, 0.78)
	d.audio.sfx("body_land", 3.0)
	d.audio.sfx("knockdown", 2.0, 0.7)
	d.lnode("Geometry/Windows/WindowWestBreach/BreachGlass").visible = false
	glass_burst.restart()
	glass_burst.emitting = true
	HUD.flash(3)                         # ~3 frames at 60 fps, then straight back to motion
	Cameras.shake(0.2, 0.35)
	across.visible = true
	across.rotation.y = deg_to_rad(-90)  # facing into the room (+X)
	across.snap("land")
	var start := Vector3(-16.3, 1.5, -15.5)
	var tw := create_tween()
	tw.tween_method(func(k: float):
		across.global_position = start.lerp(L, k) + Vector3(0, sin(k * PI) * 0.35, 0), 0.0, 1.0, 0.26)
	for s in shards:
		s.visible = true
	_knock_chair()
	await d.wait(0.45)
	d.audio.sfx("glass_settle", -6.0)
	await d.wait(0.7)

	# ---------------------------------------------------------- CREATURE_LANDED
	# trigger: landing animation ends. ~2.8 s. The body lies folded, completely still.
	# everyone stops and turns. sound: glass settling, ambience nearly gone. camera: Cam4, then Cam3.
	_enter(State.CREATURE_LANDED)
	across.snap("folded")
	_freeze_crowd(L)
	d.player.model.play("listen")
	_face_player(L)
	await d.wait(1.3)
	Cameras.cut_to(d.cam("Cam3_PartyOverview"))
	d.audio.mix("stunned", 1.0)
	await Dialogue.play("breach_landed", true)
	await d.wait(0.4)

	# ---------------------------------------------------------- CROWD_INSPECTION
	# trigger: timer. ~7 s. Three adults edge closer; the rest lean to look; kids pulled back.
	# the brand starts to smoke (revealed as they get close). sound: rain, murmurs. camera: Cam5.
	_enter(State.CROWD_INSPECTION)
	Cameras.cut_to(d.cam("Cam5_CrowdInspection"))
	hip_smoke.emitting = true
	_a("Dad3").walk_to([d.mk("FirstLungeTarget")], 0.55, "walk", "lean_look")
	await d.wait(0.6)
	_a("Dad2").walk_to([d.mk("CrowdSpot2")], 0.5, "walk", "lean_look")
	_a("Denise").walk_to([d.mk("CrowdSpot4")], 0.6, "walk", "lean_look")
	_gather_kids()
	await d.wait(1.4)
	_a("Mom2").walk_to([d.mk("CrowdSpot3") + Vector3(0.6, 0, 0.4)], 0.5, "walk", "lean_look")
	await Dialogue.play("breach_inspect", true)
	await d.wait(0.8)

	# ---------------------------------------------------------- NEAR_SILENCE
	# trigger: timer. ~5.5 s, a little longer than is comfortable. Nothing moves except a shard
	# rolling to a stop and a balloon swaying. sound: almost nothing (faint rain + room tone).
	_enter(State.NEAR_SILENCE)
	d.audio.mix("silence", 1.6)
	await d.wait(1.4)
	_roll_shard()
	await d.wait(4.1)

	# ---------------------------------------------------------- ACROSS_AWAKENS
	# trigger: timer, with no warning cue. 0.18 s snap to all fours, head locks on the nearest
	# adult. sound: sudden movement + shriek. camera: no cut (the movement is the warning).
	_enter(State.ACROSS_AWAKENS)
	var victim := _a("Dad3")
	var to := victim.global_position - across.global_position
	across.rotation.y = atan2(-to.x, -to.z)
	across.snap("awaken")
	d.audio.sfx("across_shriek", 0.0)
	d.audio.sfx("knockdown", -10.0, 1.6)
	await d.wait(0.18)
	across.play("quad_idle", 0.0)
	await d.wait(0.55)                   # the crowd fails to react: nobody understands yet

	# ---------------------------------------------------------- FIRST_LUNGE
	# trigger: timer. ~1.2 s. Launches at the nearest adult and takes him down.
	# camera: cut wide to Cam3 on the hit so the violence reads without dwelling on it.
	_enter(State.FIRST_LUNGE)
	across.snap("lunge")
	var hit_pos := victim.global_position + (across.global_position - victim.global_position).normalized() * 0.35
	var tw2 := create_tween()
	BodySweep.glide_into(tw2, across, hit_pos, 0.3, 0.3, 0.6).set_ease(Tween.EASE_OUT)
	await d.wait(0.28)
	victim.stop()
	victim.rotation.y = across.rotation.y + PI
	victim.play_once("fall")
	downed[victim.name] = true
	d.audio.sfx("knockdown", 0.0)
	d.audio.sfx("scream_1", -2.0)
	Cameras.cut_to(d.cam("Cam3_PartyOverview"))
	await d.wait(0.35)
	across.play("attack")
	d.audio.level("across_attack_loop", -10.0, 0.1)
	await d.wait(0.6)

	# ---------------------------------------------------------- PANIC_AND_ESCAPE
	# trigger: timer. The room erupts; Kenneth gets control back and has to get out.
	_enter(State.PANIC_AND_ESCAPE)
	Cameras.set_escape_mode(true)        # every zone now frames the way out
	d.audio.mix("panic", 0.4)
	d.audio.level("across_attack_loop", -12.0, 0.1)
	d.audio.sfx("scream_0", -2.0)
	_start_panic()
	rampage_on = true
	_rampage()
	_second_breach()
	Dialogue.bark_group("kenneth_shout", 0)

# ================================================================== pieces
func _freeze_crowd(look_at: Vector3) -> void:
	for n in ADULTS + KIDS:
		var a := _a(n)
		if a == null:
			continue
		a.stop()
		a.face(look_at)
		a.play("scared" if n in KIDS else "listen", 0.15)

func _face_player(p: Vector3) -> void:
	var to := p - d.player.global_position
	var target := atan2(-to.x, -to.z)
	create_tween().tween_property(d.player, "rotation:y", lerp_angle(d.player.rotation.y, target, 1.0), 0.6)

func _gather_kids() -> void:
	var spots := [Vector3(-6.4, 0, -16.3), Vector3(-5.8, 0, -16.0), Vector3(-6.9, 0, -15.9), Vector3(-5.4, 0, -15.6), Vector3(-6.2, 0, -15.4), Vector3(-7.4, 0, -16.2)]
	var i := 0
	for n in KIDS:
		var k := _a(n)
		if k:
			_kid_to(k, spots[i])
			i += 1
	var r := _a("Rachel")
	r.walk_to([Vector3(-6.4, 0, -15.0)], 1.0, "walk", "scared")

func _kid_to(k: Actor, p: Vector3) -> void:
	await k.walk_to([p], 1.6, "run", "scared")
	k.face(d.mk("LandingPoint"))

func _knock_chair() -> void:
	var c := d.lnode("Props/PartyRoom/ChairW0") as Node3D
	if c == null:
		return
	var tw := create_tween().set_parallel(true)
	tw.tween_property(c, "rotation:z", -1.45, 0.25)
	tw.tween_property(c, "position", c.position + Vector3(0.45, -0.05, 0.25), 0.25)

func _roll_shard() -> void:
	if shards.is_empty():
		return
	var s := shards[0]
	d.audio.sfx("shard_roll", -8.0)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(s, "position", s.position + Vector3(1.4, 0, 0.5), 1.6).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	tw.tween_property(s, "rotation:y", s.rotation.y + 6.0, 1.6).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	var bal := d.lnode("Props/Balloons/BalloonsSW") as Node3D
	if bal:
		var tb := create_tween().set_loops(3)
		tb.tween_property(bal, "rotation:z", 0.05, 0.9).set_trans(Tween.TRANS_SINE)
		tb.tween_property(bal, "rotation:z", -0.05, 0.9).set_trans(Tween.TRANS_SINE)

# ------------------------------------------------------------------ panic
func _exit_path(from: Vector3, spread: float) -> Array:
	var j := randf_range(-spread, spread)
	return [Vector3(max(from.x, -14.0), 0, clamp(from.z, -17.4, -8.6)).lerp(Vector3(-2.7, 0, -14.5), 0.5),
		Vector3(-2.6, 0, -14.5 + j), Vector3(-1.7, 0, -14.5 + j * 0.5), Vector3(-0.2, 0, -14.1), Vector3(0.1 + j * 0.3, 0, -11.5),
		Vector3(0.05 + j * 0.3, 0, -4.0), Vector3(j, 0, -1.2), Vector3(j * 1.5, 0, 1.6),
		Vector3(0.75 + j * 0.3, 0, 2.3), Vector3(0.8 + j * 0.3, 0, 8.0)]   # out of the entrance and up the clear lane
		# between the parked cars (one sits right across the doorway, x -2.3..-0.2, z 2.8..7.5), then off to their own car

func _flee(n: String, delay: float, speed := 3.3, lot_spot := "", end_anim := "cower") -> void:
	var a := _a(n)
	if a == null or downed.has(n):
		return
	a.play("scared", 0.1)
	await d.wait(delay)
	if downed.has(n):
		return
	var path := _exit_path(a.global_position, 0.45)
	if lot_spot != "":
		path.append(d.mk(lot_spot) + Vector3(randf_range(-0.6, 0.6), 0, randf_range(-0.4, 0.4)))
	# the doorway is a bottleneck: everyone slows to a shove through it
	await a.walk_to(path.slice(0, 2), speed, "panic_run")
	if downed.has(n) or not a.is_inside_tree():
		return
	await a.walk_to(path.slice(2, 4), speed * 0.45, "run")
	if downed.has(n):
		return
	await a.walk_to(path.slice(4), speed, "panic_run", end_anim)

func _start_panic() -> void:
	# The Stranger takes Adaline out first. Seen from Cam3, it's easy to miss.
	var st := _a("Stranger")
	var ada := _a("Adaline")
	_stranger_takes_adaline(st, ada)
	_flee("Marcus", 0.4, 3.4, "LotFleeB", "cower")
	_flee("KidBoy", 0.5, 3.0, "LotFleeB", "cry")
	_flee("Rachel", 0.9, 3.2, "LotFleeC", "shout")
	_flee("Amelia", 0.7, 3.0, "LotFleeC", "cry")
	_flee("Denise", 0.2, 3.6, "LotFleeA", "cower")
	_flee("Mom2", 0.6, 3.4, "LotFleeF", "cower")
	_flee("KidGirl", 0.8, 3.0, "LotFleeF", "cry")
	_flee("Dad2b", 1.0, 3.5, "LotFleeE", "panic_run")
	_flee("KidBoy2", 1.1, 3.0, "LotFleeE", "cry")
	# victims: slower, later; the ACROSS reaches them before the door
	_flee("Dad2", 1.4, 2.0)
	_flee("Mom2b", 2.2, 1.8)
	_flee("KidGirl2", 2.2, 1.8)
	for i in 6:
		await d.wait(randf_range(1.8, 2.6))
		if region(d.player.global_position) == 3:
			break   # Kenneth is out; the voices stay inside
		Dialogue.bark_group("panic", i)
		d.audio.sfx("scream_%d" % (i % 4), -8.0, randf_range(0.9, 1.15))

func _stranger_takes_adaline(st: Actor, ada: Actor) -> void:
	await d.wait(0.2)
	await st.walk_to([ada.global_position + Vector3(0.5, 0, 0.3)], 3.2, "run")
	ada.follow(st, Vector3(-0.42, 0, 0.1), "run", "scared")
	var path := _exit_path(st.global_position, 0.1)
	path.append(d.mk("StrangerWait"))
	await st.walk_to(path, 3.0, "run", "scared")
	ada.stop()
	ada.global_position = d.mk("AdalineWait")
	ada.play("cry")

func _rampage() -> void:
	# the first ACROSS stays on its victim a moment, takes down anyone slow in the room,
	# then comes after Kenneth: through the doorway, down the hallway, out the front.
	await d.wait(1.6)
	d.audio.level("across_attack_loop", -60.0, 0.3)
	if rampage_on:
		await _chase_and_hit(across, ["Dad2"])
	# it feeds on the bodies around it while Kenneth is still in the room...
	await _feed_until_player_leaves(across)
	if not rampage_on:
		return
	# ...and comes out after him a moment after he reaches the hallway
	await d.wait(randf_range(0.8, 1.2))
	if not rampage_on:
		return
	d.audio.sfx("across_shriek", -2.0, 0.85)
	print("[breach] ACROSS leaves its meal and follows Kenneth")
	chasers.append(across)
	_hunt(across, 3.6)

var feeding: Array[Actor] = []

## Crouches over the nearest body and eats (kept low and wide in frame). Lashes out if Kenneth
## comes close. Returns once Kenneth has left the party room.
func _feed_until_player_leaves(a: Actor, forever := false) -> void:
	while rampage_on and is_instance_valid(a):
		var body := _nearest_body(a.global_position)
		if body:
			var spot := body.global_position + (a.global_position - body.global_position).normalized() * 0.45
			await _crawl_to(a, spot, 3.0)
			if not rampage_on:
				return
			a.face(body.global_position, true)
		a.play("attack", 0.1)
		feeding.append(a)
		d.audio.level("across_attack_loop", -11.0, 0.3)
		d.audio.level("across_skitter_loop", -60.0, 0.1)
		while rampage_on and is_instance_valid(a):
			if not forever and region(d.player.global_position) != 0:
				feeding.erase(a)
				if feeding.is_empty():
					d.audio.level("across_attack_loop", -60.0, 0.5)
				return
			await get_tree().physics_frame
		feeding.erase(a)
		return

func _nearest_body(from: Vector3) -> Actor:
	var best: Actor = null
	var bd := INF
	for n in downed:
		var v := _a(n)
		if v == null or not v.visible or v.global_position.x > -1.3:
			continue
		var dd := v.global_position.distance_to(from)
		if dd < bd:
			bd = dd
			best = v
	return best

var chasers: Array[Actor] = []
var across2: Actor

## A second one comes through the other west window a few seconds into the panic.
func _second_breach() -> void:
	across2 = d.A.get("Across2")
	if across2 == null:
		return
	_make_extra_smoke(across2)
	await d.wait(2.6)
	if not rampage_on:
		return
	var glass := d.lnode("Geometry/Windows/WindowWestS/Glass") as Node3D
	if glass:
		glass.visible = false
	d.audio.sfx("glass_crash", -2.0, 0.92)
	var burst := glass_burst.duplicate() as CPUParticles3D
	d.level.add_child(burst)
	burst.global_position = Vector3(-15.3, 1.6, -10.5)
	burst.restart()
	burst.emitting = true
	across2.visible = true
	across2.rotation.y = deg_to_rad(-90)
	across2.snap("land")
	var start := Vector3(-16.3, 1.5, -10.5)
	var land := Vector3(-13.8, 0, -10.6)
	var tw := create_tween()
	tw.tween_method(func(k: float): across2.global_position = start.lerp(land, k) + Vector3(0, sin(k * PI) * 0.35, 0), 0.0, 1.0, 0.26)
	await d.wait(0.5)
	across2.snap("awaken")
	d.audio.sfx("across_shriek", -3.0, 1.15)
	await d.wait(0.2)
	await _chase_and_hit(across2, ["Mom2b", "KidGirl2"])
	await _feed_until_player_leaves(across2, true)   # this one stays with the bodies

# ------------------------------------------------------------------ chasing through the building
# Rooms in order toward the exit, and the waypoint that leads from each into the next.
const ROOM_EXIT := [Vector3(-2.3, 0, -14.5), Vector3(0.05, 0, -3.7), Vector3(0.0, 0, 0.9)]
const ROOM_ENTRY := [Vector3(-1.1, 0, -14.5), Vector3(0.05, 0, -3.2), Vector3(0.0, 0, 1.8)]

static func region(p: Vector3) -> int:
	if p.x < -1.2:
		return 0      # party room
	if p.z < -3.5:
		return 1      # hallway
	if p.z < 0.3:
		return 2      # foyer
	return 3          # outside

## Follow Kenneth through the building. Knocks down stragglers it runs into, swipes Kenneth
## aside if it catches him (no fail state: he loses a moment and keeps running).
func _hunt(a: Actor, speed: float) -> void:
	a.play("crawl", 0.05)
	d.audio.level("across_skitter_loop", -6.0, 0.1)
	var stage := 0      # 0 = heading to the room exit, 1 = through the door
	while rampage_on and is_instance_valid(a):
		var dt := get_physics_process_delta_time()
		var p := d.player.global_position
		var ra := region(a.global_position)
		var rp := region(p)
		var goal := p
		if rp > ra and ra < 3:
			goal = ROOM_EXIT[ra] if a.global_position.distance_to(ROOM_EXIT[ra]) > 0.4 and stage == 0 else ROOM_ENTRY[ra]
			if a.global_position.distance_to(ROOM_EXIT[ra]) <= 0.4:
				stage = 1
		else:
			stage = 0
		if ra == 3:
			break    # it's outside: the lot takes over
		var to := goal - a.global_position
		to.y = 0.0
		if to.length() > 0.05:
			a.rotation.y = lerp_angle(a.rotation.y, atan2(-to.x, -to.z), 0.3)
			BodySweep.move(a, to.normalized() * min(to.length(), speed * dt), a.body_radius)
		if a.current != "crawl" and a.current != "swipe":
			a.play("crawl", 0.05)
		# stragglers in its way
		for n in ADULTS + KIDS:
			if downed.has(n) or n in ["Adaline", "Stranger"]:
				continue
			var v := _a(n)
			if v and v.visible and v.global_position.distance_to(a.global_position) < 0.7 and randf() < 0.5 * dt * 60.0 * 0.02:
				_knock(a, v)
		await get_tree().physics_frame
	if is_instance_valid(a) and rampage_on:
		a.play("quad_idle", 0.1)

func _knock(a: Actor, v: Actor) -> void:
	downed[v.name] = true
	v.stop()
	v.face(a.global_position, true)
	v.play_once("fall")
	d.audio.sfx("knockdown", -2.0)
	d.audio.sfx("scream_%d" % (randi() % 4), -5.0)
	a.play_once("swipe", 0.02)

func _crawl_to(a: Actor, p: Vector3, speed: float) -> void:
	a.play("crawl", 0.05)
	d.audio.level("across_skitter_loop", -6.0, 0.05)
	while rampage_on:
		var to := p - a.global_position
		to.y = 0.0
		if to.length() < 0.15:
			break
		a.rotation.y = lerp_angle(a.rotation.y, atan2(-to.x, -to.z), 0.3)
		BodySweep.move(a, to.normalized() * min(to.length(), speed * get_physics_process_delta_time()), a.body_radius)
		await get_tree().physics_frame

func _chase_and_hit(a: Actor, names: Array) -> void:
	var lead := _a(names[0])
	if lead == null or downed.has(lead.name):
		return
	a.play("crawl", 0.05)
	d.audio.level("across_skitter_loop", -6.0, 0.05)
	var t := 0.0
	while rampage_on and t < 5.0:
		var to := lead.global_position - a.global_position
		to.y = 0.0
		if lead.global_position.x > -2.4:   # made it out of the room
			return
		if to.length() < 0.8:
			break
		a.rotation.y = lerp_angle(a.rotation.y, atan2(-to.x, -to.z), 0.35)
		var nxt := a.global_position + to.normalized() * 4.3 * get_physics_process_delta_time()
		nxt.x = min(nxt.x, -2.4)
		a.global_position = nxt
		t += get_physics_process_delta_time()
		await get_tree().physics_frame
	if not rampage_on:
		return
	a.play_once("swipe", 0.02)
	await d.wait(0.15)
	d.audio.sfx("knockdown", -1.0)
	for n in names:
		var v := _a(n)
		if v and v.global_position.distance_to(a.global_position) < 1.8:
			v.stop()
			downed[n] = true
			v.face(a.global_position, true)
			v.play_once("fall")   # knocked out cold, left on the floor
			d.audio.sfx("scream_%d" % (randi() % 4), -4.0)
	await d.wait(0.45)

func stop_rampage() -> void:
	rampage_on = false
	d.audio.level("across_skitter_loop", -60.0, 0.3)

func _physics_process(delta: float) -> void:
	if not rampage_on or d == null:
		return
	_hit_cooldown -= delta
	var p: Vector3 = d.player.global_position
	for a in chasers + feeding:
		if not is_instance_valid(a) or not a.visible:
			continue
		var reach := 1.15 if a in chasers else 1.5
		if _hit_cooldown <= 0.0 and p.distance_to(a.global_position) < reach:
			_hit_cooldown = 1.8
			# shoved toward the exit: it hurts, it costs a moment, it never ends the run
			var r := region(p)
			var fwd: Vector3 = (ROOM_ENTRY[min(r, 2)] - p) if r < 3 else (p - a.global_position)
			fwd.y = 0.0
			if a in feeding:
				fwd = p - a.global_position    # knocked away from its meal
				fwd.y = 0.0
			d.player.stagger(fwd if fwd.length() > 0.01 else Vector3.BACK, 3.5, 0.5)
			if a in chasers:
				a.play("swipe", 0.02)
			d.audio.sfx("knockdown", -2.0)
			HUD.flash(2, Color(0.6, 0.0, 0.0))
			Cameras.shake(0.08, 0.2)
			if randf() < 0.6:
				Dialogue.bark_group("chase", 0)

# ================================================================== the lot
# ------------------------------------------------------------------ the lights stutter
var _flicker_on := false
var _flicker_lights := []    # [light, base_energy, dip_time_left]

func _start_flicker() -> void:
	_flicker_lights.clear()
	for l in d.lnode("Lights").get_children():
		var n := String(l.name)
		if l is OmniLight3D and l.get_script() == null and (n.begins_with("PartyLight") or n.begins_with("Hallway") or n == "FoyerLight" or n == "PartySpillToHall"):
			_flicker_lights.append([l, (l as OmniLight3D).light_energy, 0.0])
	_flicker_on = true

func _stop_flicker() -> void:
	_flicker_on = false
	for e in _flicker_lights:
		if is_instance_valid(e[0]):
			(e[0] as OmniLight3D).light_energy = e[1]

func _process(delta: float) -> void:
	if not _flicker_on:
		return
	var room_dip := randf() < 0.7 * delta     # now and then the whole room browns out together
	for e in _flicker_lights:
		var l := e[0] as OmniLight3D
		if not is_instance_valid(l):
			continue
		if e[2] > 0.0:
			e[2] -= delta
			l.light_energy = e[1] * (0.12 if randf() < 0.6 else 0.5)
		else:
			l.light_energy = e[1] * randf_range(0.88, 1.0)
			if room_dip or randf() < 0.35 * delta:
				e[2] = randf_range(0.04, 0.22)

func start_aftermath() -> void:
	d.lnode("Aftermath").visible = true
	_stop_flicker()
	stop_rampage()
	_overrun_doors()
	var ada := _a("Adaline")
	var st := _a("Stranger")
	ada.stop()
	st.stop()
	ada.visible = true
	ada.global_position = d.mk("AdalineWait")
	st.global_position = d.mk("StrangerWait")
	ada.play("cry")
	st.play("scared")
	ada.face(d.mk("KennethReunion"), true)
	st.face(d.mk("KennethReunion"), true)
	# everyone still inside the building spills out behind Kenneth
	for n in ADULTS + KIDS:
		if n in ["Adaline", "Stranger"] or downed.has(n):
			continue
		var a := _a(n)
		if a.global_position.z < 0.0 and a.global_position.x > -2.0:
			continue   # still in the hallway; they'll come out on their own
		if a.global_position.z < 0.0:
			a.visible = false   # left behind in the party room
	# more ACROSS converge on the lot from the street and the alley
	var spawns := ["LotAcrossSpawnW", "LotAcrossSpawnE", "LotAcrossSpawnAlley", "LotAcrossSpawnWest"]
	var goals := [Vector3(-12.0, 0, 12.0), Vector3(8.0, 0, 13.0), Vector3(-1.0, 0, 10.0), Vector3(-15.0, 0, 6.0)]
	for i in 4:
		var la := _a("LotAcross%d" % (i + 1))
		if la == null:
			continue
		la.visible = true
		la.global_position = d.mk(spawns[i])
		_lot_across(la, goals[i], i)

## The ones that chased Kenneth out burst through the front doors behind him and fall on
## the families still coming out.
func _overrun_doors() -> void:
	var late := _a("Dad2b")
	if late == null or downed.has("Dad2b"):
		late = null
	for a in [across, across2]:
		if a:
			a.visible = false
	await d.wait(1.2)
	if late:
		late.stop()
		late.visible = true
		late.global_position = Vector3(0.4, 0, 0.6)
		late.walk_to([Vector3(1.6, 0, 3.2), Vector3(2.0, 0, 7.9)], 3.0, "panic_run")   # up the lane between the cars
	await d.wait(0.5)
	across.visible = true
	across.global_position = Vector3(0, 0, -0.4)
	across.rotation.y = PI
	d.audio.sfx("across_shriek", -4.0, 0.9)
	if late:
		across.play("crawl")
		var t := 0.0
		while t < 3.0 and across.global_position.distance_to(late.global_position) > 0.8:
			var to := late.global_position - across.global_position
			to.y = 0.0
			across.rotation.y = atan2(-to.x, -to.z)
			BodySweep.move(across, to.normalized() * 4.6 * get_physics_process_delta_time(), 0.3, 0.6, true, [late])
			t += get_physics_process_delta_time()
			await get_tree().physics_frame
		late.stop()
		late.play_once("fall")
		d.audio.sfx("knockdown", -3.0)
		d.audio.sfx("scream_2", -4.0)
		across.play("attack")
	else:
		across.walk_to([Vector3(0.9, 0, 1.6), Vector3(-2.8, 0, 2.2)], 3.0, "crawl", "quad_idle")   # out, then along the front of the parked car
	if across2:
		await d.wait(1.0)
		across2.visible = true
		across2.global_position = Vector3(0.2, 0, -0.4)
		across2.walk_to([Vector3(1.8, 0, 2.4), Vector3(2.2, 0, 7.9), Vector3(8.5, 0, 11.0)], 2.6, "crawl", "quad_idle")

func _lot_across(la: Actor, goal: Vector3, i: int) -> void:
	await d.wait(i * 0.7)
	if i % 2 == 0:
		await la.walk_to([goal], 1.2, "shamble", "quad_idle")
	else:
		await la.walk_to([goal.lerp(la.global_position, 0.5)], 1.0, "shamble", "quad_idle")
		await d.wait(1.0)
		await la.walk_to([goal], 3.2, "crawl", "quad_idle")

## For start=lot: the room after the breach without playing it.
func skip_to_aftermath() -> void:
	_stop_flicker()
	downed = {"Dad3": true, "Dad2": true, "Mom2b": true, "KidGirl2": true}
	for n in ["Rachel", "Marcus", "Denise", "Mom2", "Dad2b", "Amelia", "KidBoy", "KidGirl", "KidBoy2"]:
		var a := _a(n)
		a.stop()
		a.global_position = d.mk(["LotFleeA", "LotFleeB", "LotFleeC", "LotFleeD", "LotFleeE", "LotFleeF"][randi() % 6]) + Vector3(randf_range(-1, 1), 0, randf_range(-1, 1))
		a.play("cower")
	d.lnode("Geometry/Windows/WindowWestBreach/BreachGlass").visible = false

# ================================================================== effects
func _make_extra_smoke(a: Actor) -> void:
	var s2 := hip_smoke.duplicate() as CPUParticles3D
	s2.emitting = false
	a.attach(s2, "hips")
	s2.emitting = true

func _make_hip_smoke() -> void:
	hip_smoke = CPUParticles3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.14, 0.14)
	var m := StandardMaterial3D.new()
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.albedo_texture = load("res://assets/textures/smoke.png")
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	q.material = m
	hip_smoke.mesh = q
	hip_smoke.amount = 12
	hip_smoke.lifetime = 1.8
	hip_smoke.local_coords = false
	hip_smoke.direction = Vector3(0, 1, 0)
	hip_smoke.spread = 20.0
	hip_smoke.gravity = Vector3(0, 0.2, 0)
	hip_smoke.initial_velocity_min = 0.05
	hip_smoke.initial_velocity_max = 0.15
	hip_smoke.scale_amount_min = 0.6
	hip_smoke.scale_amount_max = 1.6
	var g := Gradient.new()
	g.set_color(0, Color(0.7, 0.7, 0.68, 0.0))
	g.add_point(0.2, Color(0.65, 0.64, 0.6, 0.55))
	g.set_color(g.get_point_count() - 1, Color(0.5, 0.5, 0.5, 0.0))
	hip_smoke.color_ramp = g
	hip_smoke.emitting = false
	hip_smoke.position = Vector3(-0.06, -0.03, -0.09)   # the brand, front of the left hip
	across.attach(hip_smoke, "hips")
	# outside ACROSS smoke from the start
	for n in ["LotAcross1", "LotAcross2", "LotAcross3", "LotAcross4"]:
		var la := _a(n)
		if la:
			var s := hip_smoke.duplicate() as CPUParticles3D
			s.emitting = false
			la.attach(s, "hips")
			s.emitting = true

func _make_glass() -> void:
	glass_burst = CPUParticles3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.07, 0.05)
	var m := StandardMaterial3D.new()
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.albedo_texture = load("res://assets/textures/glass_shard.png")
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	q.material = m
	glass_burst.mesh = q
	glass_burst.amount = 70
	glass_burst.lifetime = 1.1
	glass_burst.one_shot = true
	glass_burst.explosiveness = 0.95
	glass_burst.emitting = false
	glass_burst.local_coords = false
	glass_burst.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	glass_burst.emission_box_extents = Vector3(0.05, 0.6, 0.65)
	glass_burst.direction = Vector3(1, 0.25, 0)
	glass_burst.spread = 40.0
	glass_burst.initial_velocity_min = 2.5
	glass_burst.initial_velocity_max = 6.0
	glass_burst.gravity = Vector3(0, -9.8, 0)
	glass_burst.angular_velocity_min = -720.0
	glass_burst.angular_velocity_max = 720.0
	d.level.add_child(glass_burst)
	glass_burst.global_position = Vector3(-15.3, 1.6, -15.5)
	# shards left on the floor
	var rng := RandomNumberGenerator.new()
	rng.seed = 13
	for i in 26:
		var mi := MeshInstance3D.new()
		var sq := QuadMesh.new()
		sq.size = Vector2(rng.randf_range(0.04, 0.12), rng.randf_range(0.03, 0.08))
		sq.material = m
		mi.mesh = sq
		mi.rotation = Vector3(-PI / 2, rng.randf() * TAU, 0)
		d.level.add_child(mi)
		var r := rng.randf_range(0.2, 2.2)
		var ang := rng.randf_range(-1.2, 1.2)
		mi.global_position = Vector3(-15.1 + cos(ang) * r, 0.012, -15.5 + sin(ang) * r)
		mi.visible = false
		shards.append(mi)
