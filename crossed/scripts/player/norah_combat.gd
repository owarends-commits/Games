class_name NorahCombat
extends Node
## Norah's fighting: aim (feet planted, auto-aim on the nearest threat in front), fire, reload, a shove, a dodge,
## and her health. The director owns the ammo count (inv["ammo"]) and the revolver's cylinder (`loaded`).
##   Aim: C / right mouse / LB     Fire: F / left mouse / RB     Reload: R / pad X
##   Shove: V / middle mouse / pad Y     Dodge: while aiming, tap Run (Shift / B) with a direction (default: back)

signal fired(hit: bool)
signal hurt(amount: float)
signal died

const CAPACITY := 5
const SHOT_PAUSE := 1.15           ## seconds between shots: the kick, getting it back on target, thumbing the hammer
var enabled := false
var health := 100.0
var max_health := 100.0
var aiming := false
var target: Node3D = null          ## the enemy body the auto-aim locked on (a LouisAI's actor)
var enemies: Array = []            ## LouisAI controllers in play
var director: Node                 ## has `inv` and `loaded`, audio, _refresh_props()
var player: Player
var autoplay := false
var engage := true                 ## autoplay only: fight now (the house fight always; the stalker when he's close)
var damage_scale := 1.0            ## autoplay test runs take less from the stalker, so a run reaches the end
var _cool := 0.0
var _melee_cool := 0.0
var _dodge_cool := 0.0
var _busy_t := 0.0
var _auto_t := 0.0

func setup(d: Node, p: Player) -> void:
	director = d
	player = p

func _physics_process(delta: float) -> void:
	_cool -= delta
	_melee_cool -= delta
	_dodge_cool -= delta
	_busy_t -= delta
	if not enabled or player == null:
		if aiming: _set_aim(false)
		return
	if player.control_locked or Dialogue.locks_player or director.get("_inv_open"):
		if aiming: _set_aim(false)
		return
	if autoplay:
		_autoplay(delta)
		return
	var want_aim := Input.is_action_pressed("aim")
	if want_aim != aiming and _busy_t <= 0.0:
		_set_aim(want_aim)
	if aiming:
		if _free_aim():
			_update_reticle()
		else:
			_track_target(delta)
		if Input.is_action_just_pressed("fire"):
			fire()
		elif Input.is_action_just_pressed("run"):
			var side := Input.get_action_strength("walk_right") - Input.get_action_strength("walk_left") if _free_aim() else Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
			var dir := -player.global_transform.basis.z * -1.0      # back
			if absf(side) > 0.3:
				dir = player.global_transform.basis.x * signf(side)
			elif Input.is_action_pressed("walk_forward" if _free_aim() else "move_forward"):
				dir = player.global_transform.basis.x * (1.0 if randf() < 0.5 else -1.0)
			dodge(dir)
	if Input.is_action_just_pressed("reload"):
		reload()
	if Input.is_action_just_pressed("melee"):
		melee()

## Over the shoulder (not in autoplay): you aim yourself, along the centre of the screen.
func _free_aim() -> bool:
	return not autoplay and player != null and player.ots_active()

func _set_aim(on: bool) -> void:
	aiming = on
	player.aim_mode = on
	if player.ots: player.ots.aiming = on
	HUD.show_reticle(on and _free_aim())
	director.set("_aiming_prop", on)
	director.call("_refresh_props")
	if on:
		player.model.play("aim", 0.08)
		target = null if _free_aim() else _pick_target()
		if _free_aim() and player.ots:
			var t := _assist_target()
			if t: player.ots.assist_to(t)
	else:
		target = null
		player.model.play(player.idle_anim, 0.15)

func _pick_target() -> Node3D:
	var best: Node3D = null
	var best_d := 11.0
	var fwd := -player.global_transform.basis.z
	for e in enemies:
		if e.dead or not e.actor.visible:
			continue
		var to: Vector3 = e.actor.global_position - player.global_position
		to.y = 0.0
		var d := to.length()
		if d > best_d or d < 0.05:
			continue
		if fwd.dot(to / d) < 0.35:      # roughly in front (about +-70 degrees)
			continue
		if not e.can_see_point(player.global_position + Vector3(0, 1.0, 0)):
			continue
		best = e.actor
		best_d = d
	return best

## Free aim's assist: a visible threat within about 35 degrees of where the camera looks, nearest first.
func _assist_target() -> Node3D:
	var cam := player.ots.cam if player.ots else null
	if cam == null: return null
	var fwd := -cam.global_transform.basis.z
	fwd.y = 0.0
	fwd = fwd.normalized()
	var best: Node3D = null
	var best_d := 9.0
	for e in enemies:
		if e.dead or not e.actor.visible: continue
		var to: Vector3 = e.actor.global_position - player.global_position
		to.y = 0.0
		var d := to.length()
		if d > best_d or d < 0.05: continue
		if fwd.dot(to / d) < cos(deg_to_rad(35.0)): continue
		if not e.can_see_point(player.global_position + Vector3(0, 1.0, 0)): continue
		best = e.actor
		best_d = d
	return best

## While aiming, she turns smoothly onto the locked target (auto-aim).
func _track_target(delta: float) -> void:
	if target == null or not is_instance_valid(target) or _enemy_of(target).dead:
		target = _pick_target()
	if target:
		var to := target.global_position - player.global_position
		var ty := atan2(-to.x, -to.z)
		player.rotation.y = rotate_toward(player.rotation.y, ty, delta * 8.0)

func _enemy_of(n: Node3D):
	for e in enemies:
		if e.actor == n: return e
	return null

func fire() -> void:
	if _cool > 0.0 or _busy_t > 0.0:
		return
	if director.loaded <= 0:
		_cool = 0.4
		director.audio.sfx("dial_click", -2.0, 0.7)
		HUD.caption("Empty. Reload: R / pad X.", "", Color(0.9, 0.7, 0.5), 1.6)
		return
	_cool = SHOT_PAUSE
	director.loaded -= 1
	# the shot: loud, bright, and it shoves her
	director.audio.sfx("gunshot", 6.0, randf_range(0.9, 0.97))
	director.audio.sfx("flash_boom", -9.0, 1.7)
	HUD.flash(2, Color(1, 0.86, 0.55))
	Cameras.shake(0.26, 0.4)
	_muzzle_flash()
	player.model.play_once("fire", 0.02)
	_kick_back()
	var hit := false
	if _free_aim():
		player.ots.kick(5.5)
		var r := _ray_hit()
		if r.has("enemy"):
			var e = r["enemy"]
			var to: Vector3 = e.actor.global_position - player.global_position
			to.y = 0.0
			var dir := to.normalized() if to.length() > 0.01 else -player.global_transform.basis.z
			var zone: String = r.get("zone", "torso")
			var killing: bool = e.would_kill(zone) if e.has_method("would_kill") else e.hp <= 1.0
			if e.has_method("take_hit_zone"):
				e.take_hit_zone(zone, r.get("limb", ""), r.get("segment", ""), dir)
			else:
				e.take_hit(1.0, dir)
			hit = true
			_impact(killing)
		elif r.has("point"):
			_wall_hit(r["point"], r["normal"])
	elif target and is_instance_valid(target):
		var e = _enemy_of(target)
		if e and not e.dead and e.can_see_point(player.global_position + Vector3(0, 1.0, 0)):
			var to := target.global_position - player.global_position
			to.y = 0.0
			var facing := -player.global_transform.basis.z
			if to.length() < 11.0 and facing.dot(to.normalized()) > 0.9:
				var aim: Array = _auto_zone(e)
				var killing: bool = e.would_kill(aim[0]) if e.has_method("would_kill") else e.hp <= 1.0
				if e.has_method("take_hit_zone"):
					e.take_hit_zone(aim[0], aim[1], aim[2], to.normalized())
				else:
					e.take_hit(1.0, to.normalized())
				hit = true
				_impact(killing)
	fired.emit(hit)
	# the hammer comes back: the click is the cue that she can fire again
	await get_tree().create_timer(0.72, false).timeout
	if director.loaded > 0:
		director.audio.sfx("gun_cock", -9.0, 1.15)
	await get_tree().create_timer(0.3, false).timeout
	if aiming and player.model.current == "fire":
		player.model.play("aim", 0.08)

## Autoplay (tests) works through the body so the hit zones and crippling get exercised: a leg, the body, the head,
## the big arm... [zone, limb, segment]
var _auto_shot := 0
const AUTO_ZONES := [["leg", "leg_L", "lower"], ["torso", "", ""], ["arm", "arm_L", "upper"], ["head", "", ""], ["leg", "leg_L", "lower"],
		["arm", "arm_L", "upper"], ["torso", "", ""], ["arm", "arm_L", "lower"], ["head", "", ""], ["torso", "", ""], ["head", "", ""]]
func _auto_zone(e) -> Array:
	var z: Array = AUTO_ZONES[_auto_shot % AUTO_ZONES.size()]
	_auto_shot += 1
	if e.get("body") and z[1] != "" and e.body.is_lost(z[1]):
		return ["torso", "", ""]
	return z

## Free aim: what the centre of the screen is on. Enemies with a CrossBody are tested part by part (head, body,
## each arm and leg, as they're posed right now); others as an upright capsule. Walls in the way stop the bullet first.
const REACH := 26.0
const HIT_RADIUS := 0.4
func _ray_hit() -> Dictionary:
	var ar: Array = player.ots.aim_ray()
	var from: Vector3 = ar[0]; var dir: Vector3 = ar[1]
	var best_t := REACH; var best_e = null
	var best_part := {}
	for e in enemies:
		if e.dead or not e.actor.visible: continue
		if e.get("body"):
			var part: Dictionary = e.body.ray_test(from, dir, REACH)
			if not part.is_empty() and part["t"] < best_t:
				best_t = part["t"]; best_e = e; best_part = part
			continue
		var base: Vector3 = e.actor.global_position
		var t := _ray_capsule(from, dir, base + Vector3(0, 0.35, 0), base + Vector3(0, 1.6, 0), HIT_RADIUS)
		if t >= 0.0 and t < best_t:
			best_t = t; best_e = e; best_part = {}
	var q := PhysicsRayQueryParameters3D.create(from, from + dir * REACH, 1)
	q.exclude = [player.get_rid()]
	var w := player.get_world_3d().direct_space_state.intersect_ray(q)
	var wall_t := from.distance_to(w["position"]) if w else INF
	if best_e != null and best_t < wall_t:
		var res := {"enemy": best_e, "t": best_t}
		res.merge(best_part)
		return res
	if w:
		return {"point": w["position"], "normal": w["normal"]}
	return {}

## Distance along the ray to where it passes within r of the segment a-b (or -1).
func _ray_capsule(o: Vector3, d: Vector3, a: Vector3, b: Vector3, r: float) -> float:
	var best := -1.0
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
	var p := o + d * sc
	var q := a + ab * tc
	if p.distance_to(q) <= r: best = sc
	return best

## The reticle goes red over an enemy it would hit.
func _update_reticle() -> void:
	HUD.reticle_on_target(_ray_hit().has("enemy"))

## A bullet into a wall: a puff of dust and splinters where it struck.
func _wall_hit(p: Vector3, n: Vector3) -> void:
	var par := CPUParticles3D.new()
	par.one_shot = true; par.emitting = false; par.amount = 14; par.lifetime = 0.5; par.explosiveness = 1.0
	par.direction = n; par.spread = 40.0; par.initial_velocity_min = 1.0; par.initial_velocity_max = 2.6; par.gravity = Vector3(0, -6, 0)
	par.scale_amount_min = 0.02; par.scale_amount_max = 0.05
	var m := BoxMesh.new(); m.size = Vector3.ONE; par.mesh = m
	var mat := StandardMaterial3D.new(); mat.albedo_color = Color(0.55, 0.5, 0.42); mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; par.material_override = mat
	player.get_parent().add_child(par)
	par.global_position = p + n * 0.02
	par.emitting = true
	director.audio.sfx("drawer_open", -16.0, 2.4)
	get_tree().create_timer(1.2, false).timeout.connect(par.queue_free)

## Recoil pushes her back a step (stopped by walls).
func _kick_back() -> void:
	var back := player.global_transform.basis.z
	back.y = 0.0
	for i in 7:
		await get_tree().physics_frame
		if player == null: return
		player.move_and_collide(back.normalized() * 0.03 * (1.0 - i / 7.0))

## A hard, short light at the muzzle: the room lights up for a frame.
func _muzzle_flash() -> void:
	var l := OmniLight3D.new()
	l.light_color = Color(1.0, 0.78, 0.45)
	l.light_energy = 9.0
	l.omni_range = 9.0
	l.shadow_enabled = false
	player.get_parent().add_child(l)
	l.global_position = player.global_position - player.global_transform.basis.z * 0.75 + Vector3(0, 1.35, 0)
	await get_tree().create_timer(0.06, false).timeout
	l.light_energy = 3.0
	await get_tree().create_timer(0.04, false).timeout
	l.queue_free()

## The round lands: the world freezes for a beat (longer, and then slow motion, on the killing shot).
func _impact(killing: bool) -> void:
	director.audio.sfx("jumpscare_hit", -5.0, 0.7)
	director.audio.sfx("body_land", 2.0, 0.8)
	HUD.flash(1, Color(1, 1, 1))
	Cameras.shake(0.34, 0.5)
	Engine.time_scale = 0.03
	await get_tree().create_timer(0.16 if killing else 0.09, true, false, true).timeout
	if killing:
		director.audio.sfx("heartbeat_hit", 0.0, 0.8)
		Engine.time_scale = 0.3
		await get_tree().create_timer(0.75, true, false, true).timeout
	Engine.time_scale = 1.0

func reload() -> void:
	if _busy_t > 0.0 or director.loaded >= CAPACITY:
		return
	var spare: int = director.inv.get("ammo", 0)
	if spare <= 0:
		HUD.caption("No spare rounds.", "", Color(0.85, 0.6, 0.5), 1.6)
		return
	_busy_t = 1.25
	var was_aiming := aiming
	if aiming: _set_aim(false)
	player.control_locked = true
	director.audio.sfx("gun_cock", -8.0, 0.8)
	await player.model.play_once("reload", 0.05)
	var k: int = mini(CAPACITY - director.loaded, spare)
	director.loaded += k
	director.inv["ammo"] = spare - k
	if director.inv["ammo"] <= 0: director.inv.erase("ammo")
	director.audio.sfx("gun_cock", -4.0)
	player.control_locked = false
	if was_aiming and Input.is_action_pressed("aim"):
		_set_aim(true)   # back on target: the Rounds line under the reticle already shows the count
	else:
		HUD.caption("Reloaded: %d / %d." % [director.loaded, CAPACITY], "", Color(0.95, 0.85, 0.55), 1.4)
		player.model.play(player.idle_anim, 0.15)

func melee() -> void:
	if _melee_cool > 0.0 or _busy_t > 0.0:
		return
	_melee_cool = 1.3
	_busy_t = 0.45
	if aiming: _set_aim(false)
	player.control_locked = true
	director.audio.sfx("knockdown", -10.0, 1.3)
	player.model.play_once("melee", 0.03)
	await get_tree().create_timer(0.16, false).timeout
	var fwd := -player.global_transform.basis.z
	for e in enemies:
		if e.dead: continue
		var to: Vector3 = e.actor.global_position - player.global_position
		to.y = 0.0
		if to.length() < 1.5 and fwd.dot(to.normalized()) > 0.3:
			e.shoved(to.normalized())
	await get_tree().create_timer(0.29, false).timeout
	player.control_locked = false

func dodge(dir: Vector3) -> void:
	if _dodge_cool > 0.0:
		return
	_dodge_cool = 0.8
	dir.y = 0.0
	director.audio.sfx("step_carpet", -4.0, 0.8)
	var keep := aiming
	player.aim_mode = false
	player.dodge(dir.normalized())
	await get_tree().create_timer(0.4, false).timeout
	if keep and aiming:
		player.aim_mode = true
		player.model.play("aim", 0.05)

func take_damage(amount: float, from_dir: Vector3) -> void:
	if player.invulnerable_t > 0.0 or health <= 0.0:
		if player.invulnerable_t > 0.0: print("[norah] dodged")
		return
	amount *= damage_scale
	health = maxf(0.0, health - amount)
	print("[norah] hurt %.0f -> %.0f" % [amount, health])
	hurt.emit(amount)
	director.audio.sfx("knockdown", 2.0)
	HUD.flash(2, Color(0.6, 0.0, 0.0))
	Cameras.shake(0.15, 0.4)
	if aiming: _set_aim(false)
	player.stagger(from_dir, 4.0, 0.5, "hurt")
	if health <= 0.0:
		died.emit()

func heal(amount: float) -> void:
	health = minf(max_health, health + amount)

func condition() -> String:
	if health > 66.0: return "FINE"
	if health > 33.0: return "CAUTION"
	return "DANGER"

## Autoplay (tests): aim at Louis, fire when he's in the open, dodge his pounces, reload when empty.
func _autoplay(delta: float) -> void:
	_auto_t -= delta
	var e = enemies[0] if not enemies.is_empty() else null
	if not engage and director.loaded <= 0 and director.inv.get("ammo", 0) > 0 and _busy_t <= 0.0 and _auto_t <= 0.0:
		_auto_t = 1.0
		reload()                                  # topping up between fights, on the move
	if e == null or e.dead or not engage:
		if aiming: _set_aim(false)
		return
	var to: Vector3 = e.actor.global_position - player.global_position
	to.y = 0.0
	player.rotation.y = rotate_toward(player.rotation.y, atan2(-to.x, -to.z), delta * 6.0)
	if e.state == "windup" and e._t < 0.35 and _dodge_cool <= 0.0:
		if not aiming: _set_aim(true)
		dodge(player.global_transform.basis.x * (1.0 if randf() < 0.5 else -1.0))
		return
	if director.loaded <= 0:
		if director.inv.get("ammo", 0) > 0:
			reload()
		elif to.length() < 1.4 and e.state in ["recover", "stride"] and _auto_t <= 0.0:
			_auto_t = 1.0
			if aiming: _set_aim(false)
			melee()                                   # out of rounds: shove him off
		return
	if not aiming and _busy_t <= 0.0:
		_set_aim(true)
	if aiming and _auto_t <= 0.0 and e.state in ["recover", "stride", "hit", "stalk", "pant"] and e.can_see_point(player.global_position + Vector3(0, 1.0, 0)):
		_auto_t = 1.2
		target = e.actor
		fire()
