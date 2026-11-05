class_name PrologueDirector
extends Node
## Runs the prologue from the opening shot to the BMW driving away.
##
## The story is a straight line of beats; each beat is an async function below.
## Gameplay stretches (walking in, the party, the escape, the lot) hand control to the
## player and wait for a trigger. The window breach lives in breach_sequence.gd and the
## drive in drive_sequence.gd so this file stays readable.
##
## Debug: run with  -- start=party | start=breach | start=lot   to skip ahead.
## F5 restarts the prologue.

enum Phase { OPENING, ARRIVAL, WALK_IN, PARTY_ENTRY, PARTY, BREACH, ESCAPE, LOT, REUNION, DRIVE, END }

@export var start_at := "opening"
@export var autoplay := false   ## tests: dialogue advances itself, the autopilot walks Kenneth

var phase := Phase.OPENING
var objective_id := ""          ## read by the test autopilot

@onready var world: SubViewport = $Screen/World
@onready var level: Node3D = $Screen/World/Level
@onready var player: Player = $Screen/World/Player
@onready var actors: Node3D = $Screen/World/Actors
@onready var audio: AudioDirector = $Audio

var A := {}                     ## actor name -> Actor
var breach: Node
var drive: Node
var has_punch := false
var hallway_done := false
var _shout_t := 0.0
var _talked := {}

func _process(_delta: float) -> void:
	HUD.compass.active = phase in [Phase.WALK_IN, Phase.PARTY, Phase.ESCAPE, Phase.LOT]
	HUD.compass.autoplay = autoplay
	var out: Array = []
	match objective_id:
		"enter": out = [Vector3(0, 0, -1.5)]
		"party": out = [Vector3(-1.2, 0, -14.5)]
		"punch":
			var pt := get_node_or_null("Screen/World/Interactables/PunchTable") as Node3D
			if pt: out = [pt.global_position]
		"escape": out = [Vector3(-1.2, 0, -14.5) if player.global_position.x < -1.25 else Vector3(0, 0, 1.0)]
		"car": out = [mk("KennethReunion")]
	HUD.compass.targets = out

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("start="): start_at = a.substr(6)
		if a == "autoplay": autoplay = true
	Dialogue.autoplay = autoplay
	LookPresets.apply(self, GameSettings.look)
	if player.ots: player.ots.follow = autoplay        # over the shoulder: in autoplay the camera follows him
	# the BMW's dome light is off on the drive: a dull lens, not a white panel glaring at the in-car cameras
	var dome := level.find_child("DomeLight", true, false) as CSGBox3D
	if dome:
		var m := StandardMaterial3D.new()
		m.albedo_color = Color(0.32, 0.3, 0.27)
		m.roughness = 0.6
		dome.material = m
	for c in actors.get_children():
		if c is Actor:
			A[c.name] = c
	breach = preload("res://scripts/cutscenes/breach_sequence.gd").new()
	breach.name = "Breach"
	add_child(breach)
	breach.setup(self)
	drive = preload("res://scripts/cutscenes/drive_sequence.gd").new()
	drive.name = "Drive"
	add_child(drive)
	drive.setup(self)
	_wire_interactions()
	Cameras.camera_changed.connect(_on_camera_changed)
	Cameras.zone_changed.connect(func(zc): _on_camera_changed(null, zc))     # over the shoulder: the area (not the live camera) sets the ambience
	HUD.reset()
	await get_tree().process_frame
	run()

func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and e.keycode == KEY_F5:
		restart()

## The pause menu's "Restart from checkpoint": the prologue starts again from the top.
func restart_checkpoint() -> void:
	restart()

func restart() -> void:
	Cameras.clear()
	HUD.reset()
	get_tree().reload_current_scene()

# ================================================================== helpers
func mk(path: String) -> Vector3:
	var n := level.get_node_or_null("StoryMarkers/" + path)
	if n == null:
		n = level.get_node_or_null("ACROSSBreach/" + path)
	if n == null:
		push_error("missing marker " + path)
		return Vector3.ZERO
	return (n as Node3D).global_position

func cam(name: String) -> Camera3D:
	return level.get_node("Cameras/" + name) as Camera3D

func lnode(path: String) -> Node:
	return level.get_node(path)

func wait(t: float) -> void:
	await get_tree().create_timer(t, false).timeout

func lock(on: bool) -> void:
	player.control_locked = on
	if on:
		HUD.show_prompt("")

func objective(id: String, text: String) -> void:
	objective_id = id
	HUD.set_objective(text)

func say(id: String) -> void:
	await Dialogue.play(id)

## Lerp a temporary camera from one fixed camera to another (the opening crane).
func crane(from_cam: Camera3D, to_cam: Camera3D, time: float) -> void:
	var c := Camera3D.new()
	c.environment = to_cam.environment
	c.fov = from_cam.fov
	c.far = 200.0
	level.add_child(c)
	c.global_transform = from_cam.global_transform
	Cameras.cut_to(c)
	var t := 0.0
	var a := from_cam.global_transform
	var b := to_cam.global_transform
	while t < time:
		t += get_process_delta_time()
		var k: float = clamp(t / time, 0.0, 1.0)
		k = k * k * (3.0 - 2.0 * k)
		c.global_transform = a.interpolate_with(b, k)
		c.fov = lerp(from_cam.fov, to_cam.fov, k)
		await get_tree().process_frame
	Cameras.cut_to(to_cam)
	c.queue_free()

# ================================================================== the story
func run() -> void:
	match start_at:
		"party":
			_setup_party_state()
			player.place(Vector3(-2.6, 0, -14.3), 90)
			_party_ambient()
			await _party()
		"breach":
			_setup_party_state()
			has_punch = true
			player.place(Vector3(-2.5, 0, -12.2), -90)
			_party_ambient()
			objective("mingle", "Say hello to the other parents.")
			party_time_left = 3.0
			await _start_breach()
		"lot":
			_setup_party_state()
			player.place(Vector3(0, 0, 0.8), 180)
			breach.skip_to_aftermath()
			await _lot()
		_:
			await _opening()
			await _arrival()
			await _walk_in()
			await _party()

func _opening() -> void:
	phase = Phase.OPENING
	lock(true)
	player.visible = false
	A.Adaline.visible = false
	(A.CarStranger as Node3D).visible = false
	HUD.black()
	audio.mix("opening", 0.5)
	await wait(0.8)
	await HUD.title("THE EXTRECATED", "", 1.6, 1.2)
	audio.sfx("title_hit", -6.0)
	# High over Kennedy: the city's lights, then miles of dark farmland all around. The camera
	# tips down and sinks toward the community center, the lot, and the BMW in the rain.
	var keys := [
		[Vector3(-2100, 1150, 2900), Vector3(150, 0, -60)],
		[Vector3(-1250, 760, 1700), Vector3(120, 0, -20)],
		[Vector3(-520, 330, 760), Vector3(40, 0, 10)],
		[Vector3(-150, 95, 230), Vector3(-6, 0, 8)],
		[Vector3(-28, 22, 46), Vector3(-6.5, 0.5, 6)],
		[Vector3(-8.5, 4.2, 15.5), Vector3(-6.5, 0.9, 5.6)],
		[Vector3(-6.6, 2.0, 10.2), Vector3(-6.5, 1.0, 5.5)],
	]
	var done := get_tree().create_timer(26.2, false)
	fly(keys, 26.0)
	HUD.fade_in(4.0)
	await wait(4.5)
	await HUD.title("PROLOGUE", "Kennedy, Washington", 3.0, 1.2)
	await done.timeout

## Flies CamFlight through keyframes ([position, look-at] pairs) on a smooth curve. Fog thickens
## as the camera comes down, so the sky view sees for miles and the street view stays murky.
func fly(keys: Array, time: float) -> void:
	var c := cam("CamFlight")
	var env := c.environment.duplicate() as Environment
	c.environment = env
	var low: Environment = cam("Cam1_LotArrival").environment
	Cameras.cut_to(c)
	var t := 0.0
	var n := keys.size()
	while t < time:
		t += get_process_delta_time()
		var k: float = clamp(t / time, 0.0, 1.0)
		k = 1.0 - pow(1.0 - k, 1.6)          # slow down toward the end
		var u := k * (n - 1)
		var i: int = clamp(int(u), 0, n - 2)
		var f := u - i
		var pos := _cr(keys, i, f, 0)
		var look := _cr(keys, i, f, 1)
		c.global_position = pos
		c.look_at(look, Vector3.UP)
		var alt: float = clamp(pos.y / 120.0, 0.0, 1.0)
		env.fog_density = lerp(low.fog_density, 0.00035, alt)
		env.ambient_light_energy = lerp(low.ambient_light_energy, 0.55, alt)
		await get_tree().process_frame

func _cr(keys: Array, i: int, f: float, j: int) -> Vector3:
	var n := keys.size()
	var p0: Vector3 = keys[max(i - 1, 0)][j]
	var p1: Vector3 = keys[i][j]
	var p2: Vector3 = keys[i + 1][j]
	var p3: Vector3 = keys[min(i + 2, n - 1)][j]
	return 0.5 * ((2.0 * p1) + (-p0 + p2) * f + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * f * f + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * f * f * f)

func _arrival() -> void:
	phase = Phase.ARRIVAL
	audio.mix("car", 1.0)
	await HUD.letterbox(true, 0.6)
	# inside the BMW with them: Kenneth at the wheel, Adaline in the back with Amelia's present
	(A.CarKenneth as Actor).play("sit")
	(A.CarAdaline as Actor).play("sit")
	Cameras.cut_to(cam("CamCarFront"))
	await wait(1.2)
	var f := func(_c: String, _i: int, line: Dictionary):
		match line.get("who", ""):
			"kenneth": Cameras.cut_to(cam("CamCarKenneth"))
			"adaline": Cameras.cut_to(cam("CamCarAdaline"))
	Dialogue.line_started.connect(f)
	await say("arrival_car")
	Dialogue.line_started.disconnect(f)
	Cameras.cut_to(cam("CamCarFront"))
	await wait(0.6)
	Cameras.cut_to(cam("CamOpeningLow"))
	audio.mix("exterior", 0.6)
	audio.sfx("car_door", -2.0)
	await wait(0.25)
	audio.sfx("car_door", -4.0, 1.1)
	player.visible = true
	player.place(mk("BMW_DriverDoor") + Vector3(0.4, 0, -0.6), 180)
	A.Adaline.visible = true
	A.Adaline.global_position = mk("BMW_DriverDoor") + Vector3(0.3, 0, -2.1)
	await wait(0.4)
	await A.Adaline.walk_to(player.global_transform * Vector3(-0.45, 0, 0.05), 1.6, "run")
	A.Adaline.follow(player, Vector3(-0.42, 0, 0.06))
	player.walk_anim = "walk_hand"
	player.idle_anim = "idle_hand"
	player.can_run = false
	await HUD.letterbox(false, 0.5)
	Cameras.cut_to(null)
	lock(false)
	objective("enter", "Go inside.")
	await wait(2.0)
	Dialogue.say_line("adaline", "It's raining SO hard!", "happy")

func _walk_in() -> void:
	phase = Phase.WALK_IN
	while true:
		var p := player.global_position
		if not hallway_done and p.z < -5.0 and p.x > -1.2:
			hallway_done = true
			objective("hall", "")
			await say("hallway")
			objective("party", "Find the party.")
		if p.x < -1.25 and p.z < -13.0 and p.z > -16.0:
			break
		await get_tree().physics_frame
	await _party_entry()

func _party_entry() -> void:
	phase = Phase.PARTY_ENTRY
	lock(true)
	objective("", "")
	player.place(Vector3(-1.9, 0, -14.6), 90)
	A.Adaline.stop()
	A.Adaline.global_position = player.global_transform * Vector3(-0.45, 0, 0.05)
	A.Adaline.rotation.y = player.rotation.y
	A.Adaline.play("idle_hand")
	player.model.play("idle_hand")
	Cameras.cut_to(cam("CamPartyEntry"))
	audio.mix("party", 0.8)
	await A.Rachel.walk_to([Vector3(-3.4, 0, -14.4)], 1.5)
	A.Rachel.face(player.global_position)
	A.Rachel.play("talk")
	await say("party_entry")
	A.Rachel.play("idle")
	player.walk_anim = "walk"
	player.idle_anim = "idle"
	player.can_run = true
	_adaline_to_mats()
	await wait(0.6)
	player.model.play("talk")
	A.Rachel.play("listen")
	A.Stranger.face(player.global_position)
	A.Stranger.play("wave")
	await say("party_entry_2")
	A.Stranger.play("idle")
	player.model.play("idle")
	A.Rachel.walk_to([Vector3(-8.0, 0, -16.0)], 1.4, "", "talk")
	Cameras.cut_to(null)
	lock(false)
	phase = Phase.PARTY
	objective("punch", "Get some punch.")

func _adaline_to_mats() -> void:
	await A.Adaline.walk_to([Vector3(-5.0, 0, -13.2), mk("AdalineMats")], 3.0, "run", "play")
	A.Adaline.wander(_mat_points(), 0.6, 2.2)

func _mat_points() -> Array:
	var pts := []
	for x in [-10.0, -9.0, -8.0, -7.4]:
		for z in [-11.2, -10.4, -9.8]:
			pts.append(Vector3(x + randf_range(-0.2, 0.2), 0, z))
	return pts

func _party() -> void:
	phase = Phase.PARTY
	if objective_id == "":
		objective("punch", "Get some punch.")
	while phase == Phase.PARTY:
		await get_tree().physics_frame

## Puts everyone where they'd be with the party in full swing (used when skipping ahead).
func _setup_party_state() -> void:
	HUD.fade_in(0.01)
	player.visible = true
	player.control_locked = false
	A.Adaline.visible = true
	A.Adaline.global_position = mk("AdalineMats")
	A.Adaline.wander(_mat_points(), 0.6, 2.2)
	A.Rachel.global_position = Vector3(-8.0, 0, -16.0)
	A.Rachel.play("talk")
	Cameras.cut_to(null)

func _party_ambient() -> void:
	audio.mix("party", 0.5)
	phase = Phase.PARTY

func _wire_interactions() -> void:
	for it in get_tree().get_nodes_in_group("interactable"):
		(it as Interactable).used.connect(_on_used)

func _on_used(it: Interactable) -> void:
	if phase != Phase.PARTY:
		return
	var who := it.get_parent()
	match it.name:
		"PunchTable":
			if has_punch:
				return
			lock(true)
			player.model.play("idle")
			await say("punch")
			has_punch = true
			_give_cup()
			lock(false)
			it.enabled = false
			objective("mingle", "Say hello to the other parents.")
			_party_clock()
		_:
			if who == A.get("Marcus"):
				var mc := "marcus_wait" if not has_punch else ("marcus_again" if _talked.has("Marcus") else "smalltalk_marcus")
				await _talk(who, mc)   # the full introduction once; after that, one line
				return
			var conv: String = {"Rachel": "talk_rachel", "Denise": "talk_denise", "Stranger": "talk_stranger", "Adaline": "talk_adaline",
				"KidBoy": "talk_kid", "KidGirl": "talk_kidgirl", "Dad2": "talk_parent", "Mom2": "talk_mom", "Dad3": "talk_dad3"}.get(who.name, "talk_parent")
			if conv == "talk_stranger" and _talked.has("Stranger"):
				conv = "talk_stranger_again"
			await _talk(who, conv)

func _talk(who: Actor, conv: String) -> void:
	var prev := who.current
	var was_wandering := who.name in ["Adaline", "Amelia", "KidBoy", "KidGirl", "KidBoy2", "KidGirl2"]
	who.stop()
	await who.face(player.global_position)
	who.play("wave" if conv in ["talk_adaline", "talk_stranger"] else "talk")
	await say(conv)
	_talked[who.name] = true
	if was_wandering:
		who.wander(_mat_points(), 0.6, 2.2)
	else:
		who.play(prev if prev != "" else "idle")

func _give_cup() -> void:
	var cup := MeshInstance3D.new()
	var m := CylinderMesh.new()
	m.top_radius = 0.035
	m.bottom_radius = 0.03
	m.height = 0.09
	m.radial_segments = 6
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/ps1_surface.gdshader")
	mat.set_shader_parameter("albedo", Color(0.85, 0.15, 0.2))
	mat.set_shader_parameter("world_uv", false)
	m.material = mat
	cup.mesh = m
	cup.position = Vector3(0, -0.12, -0.03)
	player.model.attach(cup, "hand.R")
	player.idle_anim = "hold_cup"
	player.set_meta("cup", cup)

## After the punch Kenneth has 30 seconds to mingle and look around. Then, with no warning,
## wherever he is and whatever anyone is saying, the window goes.
var party_time_left := 30.0
## Free time after the punch before the window goes: talk to the parents, look around.
const PARTY_FREE_TIME := 60.0

func _party_clock() -> void:
	party_time_left = PARTY_FREE_TIME
	while party_time_left > 0.0 and phase == Phase.PARTY:
		party_time_left -= get_physics_process_delta_time()
		await get_tree().physics_frame
	if phase == Phase.PARTY:
		_start_breach()

func _start_breach() -> void:
	phase = Phase.BREACH
	lock(true)
	objective("", "")
	await breach.run()
	await _escape()

func _marcus_line(_conv: String, i: int, _line: Dictionary) -> void:
	if i == 1:
		A.Marcus.play("listen")
		player.model.play("talk")
	elif i == 2:
		A.Marcus.play("talk")
		player.model.play("hold_cup" if has_punch else "listen")

# ================================================================== escape
func _escape() -> void:
	phase = Phase.ESCAPE
	lock(false)
	Cameras.cut_to(null)
	if player.has_meta("cup"):
		(player.get_meta("cup") as Node3D).visible = false
	player.idle_anim = "scared"
	player.walk_anim = "walk"
	objective("escape", "Find Adaline. Get out!")
	_shout_t = 3.5
	while player.global_position.z < 0.6:
		_shout_t -= get_physics_process_delta_time()
		if _shout_t <= 0.0 and player.global_position.x < -1.2:
			_shout_t = randf_range(4.0, 6.5)
			Dialogue.bark_group("kenneth_shout")
		await get_tree().physics_frame
	breach.stop_rampage()
	await _lot()

# ================================================================== parking lot
func _lot() -> void:
	phase = Phase.LOT
	player.idle_anim = "scared"
	breach.start_aftermath()
	audio.mix("lot_chaos", 0.8)
	lock(true)
	Cameras.cut_to(cam("Cam7_LotAftermath"))
	HUD.letterbox(true, 0.4)
	Dialogue.bark_group("lot", 1)
	_lot_details()
	await wait(3.2)
	HUD.letterbox(false, 0.4)
	Cameras.cut_to(null)
	lock(false)
	objective("car", "Get to the car.")
	var t := 0.0
	while player.global_position.distance_to(mk("KennethReunion")) > 2.4:
		t += get_physics_process_delta_time()
		if fmod(t, 6.0) < get_physics_process_delta_time():
			Dialogue.bark_group("lot")
		await get_tree().physics_frame
	await _reunion()

## The lot after the escape: a car alarm, a man who can't get his car to start, sirens far off.
func _lot_details() -> void:
	audio.level("car_alarm_loop", -14.0, 0.5)
	var f: Actor = A.get("LotFumbler")
	if f == null:
		return
	f.visible = true
	f.play("beg")
	var t := 0.0
	while phase == Phase.LOT or phase == Phase.REUNION:
		audio.sfx("starter_fail", -9.0, randf_range(0.95, 1.05))
		await wait(randf_range(2.2, 3.4))
		t += 3.0
		if t > 9.0 and f.visible:
			f.walk_to([Vector3(6.0, 0, 9.0), Vector3(14.0, 0, 16.0)], 3.4, "panic_run")   # gives up and runs
			return

func _reunion() -> void:
	phase = Phase.REUNION
	lock(true)
	objective("", "")
	HUD.letterbox(true, 0.4)
	Cameras.cut_to(cam("CamReunion"))
	var ada: Actor = A.Adaline
	var st: Actor = A.Stranger
	ada.stop()
	st.stop()
	ada.global_position = mk("AdalineWait")
	st.global_position = mk("StrangerWait")
	player.model.play("walk")
	var tw := create_tween()
	BodySweep.glide_into(tw, player, mk("KennethReunion"), 0.6)
	await tw.finished
	var to := ada.global_position - player.global_position
	player.rotation.y = atan2(-to.x, -to.z)
	st.face(player.global_position)
	ada.face(player.global_position)
	Dialogue.line_started.connect(_reunion_line, CONNECT_REFERENCE_COUNTED)
	await say("lot_reunion")
	Dialogue.line_started.disconnect(_reunion_line)
	await drive.run()
	await _end()

func _reunion_line(_conv: String, i: int, _line: Dictionary) -> void:
	var ada: Actor = A.Adaline
	var st: Actor = A.Stranger
	match i:
		0:
			player.model.play("shout")
			ada.play("cry")
			st.play("scared")
		1:
			await ada.walk_to(player.global_transform * Vector3(0, 0, -0.38), 2.5, "run")
			ada.face(player.global_position, true)
			ada.play("hug")
			player.model.play("hug")
		3:
			ada.play("cry")
		4:
			st.play("beg")
			player.model.play("idle")
			var to := st.global_position - player.global_position
			player.rotation.y = atan2(-to.x, -to.z)
		5:
			player.model.play("scared")
		7:
			player.model.play("talk")
			st.play("scared")

func _end() -> void:
	phase = Phase.END
	objective("", "")
	HUD.show_end_card(PackedStringArray(["END OF THE PROLOGUE", "", "", "CHAPTER ONE: NORAH", "", "Press E to play again"]))
	while true:
		if Input.is_action_just_pressed("interact") or autoplay:
			break
		await get_tree().process_frame
	if not autoplay:
		restart()

# ================================================================== ambience follows the cameras
func _on_camera_changed(_old: Camera3D, new_cam: Camera3D) -> void:
	if new_cam == null:
		return
	var n := String(new_cam.name)
	match phase:
		Phase.WALK_IN, Phase.PARTY:
			if n == "Cam1_LotArrival": audio.mix("exterior", 1.0)
			elif n == "CamF_Foyer": audio.mix("foyer", 1.0)
			elif n.begins_with("Cam2") or n.begins_with("Cam6"): audio.mix("hallway", 1.2)
			elif n.begins_with("Cam3"): audio.mix("party", 1.0)
		Phase.ESCAPE:
			if n.begins_with("Cam3"): audio.mix("panic", 0.6)
			elif n.begins_with("Cam2") or n.begins_with("Cam6") or n == "CamF_Foyer": audio.mix("panic_hall", 0.8)
			elif n == "Cam1_LotArrival": audio.mix("lot_chaos", 0.8)
