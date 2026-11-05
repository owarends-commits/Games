class_name Chapter1Director
extends Node
## Chapter One (v9, built on the Map Designer map in data/maps/ch1_map.json).
## The drive home; Louis crouched at the treeline in her headlights; the dark and the leap; the sprint inside;
## the barricade, the revolver, Louis wrecking her car, the bedroom window; the fight in the closed-up house;
## the broadcast seen up close on the TV; Louis's house in the dark; his truck; the road out.
##
## Run scenes/chapter1/chapter1.tscn (F6). Jump ahead with a user arg:
##   -- start=walk | sprint | inside | wardrobe | duel | after | louis | road     (plus: autoplay, shots)
## Dying reloads at the last checkpoint. F5 restarts from the beginning.

static var resume_at := ""

const PHASES := ["drive", "walk", "sprint", "inside", "wardrobe", "duel", "after", "louis", "road"]
const LOCK_CODE := [6, 1, 2]        ## Addie's birthday, 6/12 (the hallway photo, the journal)
const SAFE_CODE := [3, 1, 6]        ## John 3:16, Rose's verse (Louis's Bible journal)
const HZ := 400.0
var JUMP_LAND := Vector3(4.3, 0, 4.9)            ## where Louis lands after the leap: between her and the car (from the layout)
## Names and descriptions are refreshed from the Item Modeler export (data/items/items.json) at start.
var ITEM_DB := {
	"revolver": ["Old Revolver", "Five shots. It has never been fired outside the store.", "item_revolver"],
	"ammo": [".38 Rounds", "Loose .38 cartridges.", "item_ammo"],
	"flashlight_dead": ["Flashlight (no batteries)", "A heavy metal flashlight. Clicks. Nothing.", "item_flashlight"],
	"flashlight": ["Flashlight", "A heavy metal flashlight. The beam is yellow and doesn't reach far.", "item_flashlight"],
	"batteries": ["D Batteries", "Two D batteries. A full charge for the flashlight.", "item_batteries"],
	"battery_half": ["Battery (half charge)", "From Louis's coat pocket. Half a charge, maybe.", "item_battery"],
	"medicine": ["Pills", "An orange prescription bottle, a few left. Takes the edge off. (Heals a little.)", "item_medicine"],
	"rosary": ["Louis's Rosary", "Worn smooth. A paper tag: \"Rose's. For keeping.\"", "item_rosary"],
	"roses_ring": ["Rose's Wedding Band", "Gold, worn thin, a small garnet. Inside: \"L. & R. Forever.\" On the chain Louis wore it on, snapped.", "item_roses_ring"],
}
## Treasures: no use but what they'd fetch. They show under VALUABLES in the items screen, to sell to a trader.
const TREASURE_DB := {
	"roses_ring": 1800,
}
var KEY_DB := {
	"house_keys": ["House keys", "Front door and back door. The brass one sticks."],
	"lockbox_code": ["Lockbox code: 6-1-2", "Addie's birthday, June 12: circled on the kitchen calendar in her crayon. Her journal: \"the lockbox code is still Addie's birthday.\""],
	"safe_code": ["Louis's safe: 3-1-6", "John 3:16. \"Rose's verse keeps them.\" (Louis's journal, third page.)"],
	"truck_keys": ["Truck keys", "A ring of keys on a red fob, from Louis's safe."],
}
## FILES: image = assets/textures/<image>.png ; pages from a dialogue conversation (conv) ; announce text
const FILE_DB := {
	"journal": {"title": "Norah's journal: Oct 14", "image": "docs/doc_journal", "conv": "c1_journal"},
	"photo_birthday": {"title": "Photo: Addie's birthday", "image": "docs/photo_birthday", "conv": "c1_photo_birthday"},
	"photo_school": {"title": "Photo: first day of kindergarten", "image": "docs/photo_school", "conv": "c1_photo_school"},
	"photo_lake": {"title": "Photo: the lake", "image": "docs/photo_lake", "conv": "c1_photo_lake"},
	"photo_christmas": {"title": "Photo: Christmas morning", "image": "docs/photo_christmas", "conv": "c1_photo_christmas"},
	"fridge": {"title": "Addie's drawing: PICKLE", "image": "fridge_pickle", "conv": "c1_fridge"},
	"calendar": {"title": "Kitchen calendar", "conv": "c1_calendar"},
	"broadcast": {"title": "Emergency broadcast", "conv": "c1_broadcast"},
	"bible_journal": {"title": "Louis's journal", "image": "docs/doc_bible_journal", "conv": "c1_bible_journal"},
	"rose_photo": {"title": "Photo: Louis & Rose", "image": "docs/photo_louis_rose", "conv": "c1_rose_photo"},
	"storm_photo": {"title": "Photo: after the storm", "image": "docs/photo_storm", "conv": "c1_storm_photo"},
	"rosary": {"title": "Louis's rosary", "image": "docs/item_rosary", "conv": "c1_rosary"},
	"step_photo": {"title": "Photo: \"Step fixed!\"", "image": "docs/photo_louis_addie", "conv": "c1_step_photo"},
}

signal used_point(point_name: String)

var start_at := "drive"
var autoplay := false
var shots := false
var _ammo_prompt := false
var stop_at := ""          ## videos: quit when this phase starts
var checkpoint := "drive"
var dead := false
var inv := {}
var keys_found: Array[String] = ["house_keys"]
var files_found: Array[String] = []
var flags := {}
var loaded := 0
var light_charge := 0.0
var layout := {}
var bounds: Array = []
var _bounds_on := false
var _bounds_walk_only := false
var _bounds_t := 0.0
var _busy := false
var _roaming := false
var _beat_walk := false
var _inv_open := false
var _doc_open := false
var _clock := 0.0
var _scream_t := 30.0
var _shot_i := 0
var _shot_t := 0.0
var _mus: Array[AudioStreamPlayer] = []
var _mus_name := ""
var _pounding := false
var _circling := false
var _circle_t := 0.0
var _scratch_t := 3.0
var _window_scratch := false
var stalker: LouisStalker
var _test_life := -1.0
var _stalk_hold := false                      ## autoplay: the stalker's close and she's fighting; scripted walks wait
var _stalk_mus := ""
const WARDROBE_PUSH := Vector3(0, 0, -1.25)   ## the full shove across the bedroom window
const CRASH_AT := 0.62                        ## how far it gets before he comes through
var _crashed := false                         ## the window crash played this run (not a resumed checkpoint)
var _push_jam := 0.0                          ## seconds the push is stuck (it catches on the carpet when he hits the wall)
var _push_cam: Camera3D                       ## the side camera of an interrupted push, for whoever takes over
static var _tut_seen := false                 ## the combat tutorial shows once, not again after a death
var chase := false
var chase_speed := 2.4
var _chase_t := 0.0                       ## the sprint: he starts at 2.6 m/s and builds to 3.05 (she runs 3.3 in the sprint), so he stays on her heels the whole way
var _chase_cool := 0.0
var _follow_cam: Camera3D
var _follow_mode := ""
var _door_closed_y := 0.0
var _door_open_y := 0.0
var rain: CPUParticles3D
var vehicle: Node3D
var tv_vp: SubViewport
var tv_label: Label
var siren: AudioStreamPlayer3D
var growl: AudioStreamPlayer3D
var steam_snd: AudioStreamPlayer3D
var flashlight: SpotLight3D
var combat: NorahCombat
var ai: LouisAI
var P := {}

@onready var world: SubViewport = $Screen/World
@onready var map: Node3D = $Screen/World/Map
@onready var player: Player = $Screen/World/Player
@onready var louis: Actor = $Screen/World/Actors/Louis
@onready var car: Node3D = $Screen/World/DriveCar
@onready var truck: Node3D = $Screen/World/Truck
@onready var audio: AudioDirector = $Audio

# ================================================================== setup
func _ready() -> void:
	_sync_item_text()
	_soften_steam(louis.get_node_or_null("Steam") as CPUParticles3D)
	$Audio.process_mode = Node.PROCESS_MODE_ALWAYS     # sounds (and the UI blips) carry on while a menu pauses the game
	for a in OS.get_cmdline_user_args():
		if a.begins_with("start="): start_at = a.substr(6)
		if a == "autoplay": autoplay = true
		if a == "shots": shots = true
		if a.begins_with("stop="): stop_at = a.substr(5)
		if a.begins_with("louis_life="): _test_life = float(a.substr(11))     # tests: how much he has left
	if resume_at != "":
		start_at = resume_at
		resume_at = ""
	Dialogue.autoplay = autoplay
	Cameras.clear()
	HUD.reset()
	layout = JSON.parse_string(FileAccess.open("res://data/ch1_layout.json", FileAccess.READ).get_as_text())
	if layout.has("jump_land"): JUMP_LAND = Vector3(layout["jump_land"][0], 0, layout["jump_land"][1])
	bounds = layout["bounds"]
	for c in $Screen/World/Points.get_children():
		var it := c as Interactable
		P[it.name] = it
		it.used.connect(func(_w): _on_point(it.name))
	player.surface_fn = _surface
	LookPresets.apply(self, GameSettings.look)
	if player.ots: player.ots.follow = autoplay        # over the shoulder: in autoplay the camera follows her
	if player.model and player.model.model_id != "norah": player.model.model_id = "norah"
	var seated := car.get_node("Norah") as CharacterModel
	if seated.model_id != "norah": seated.model_id = "norah"
	player.visible = false
	vehicle = car
	_make_rain()
	growl = _loop3d("growl_loop", -2.0)
	steam_snd = _loop3d("steam_loop", -8.0)
	_make_flashlight()
	combat = NorahCombat.new()
	combat.name = "Combat"
	add_child(combat)
	combat.setup(self, player)
	combat.autoplay = autoplay
	combat.died.connect(_die)
	ai = LouisAI.new()
	ai.name = "LouisAI"
	add_child(ai)
	ai.setup(louis, player, combat, audio, layout)
	combat.enemies = [ai]
	ai.died.connect(func(): flags["louis_dead"] = true)
	stalker = LouisStalker.new()
	stalker.name = "Stalker"
	add_child(stalker)
	stalker.setup(self, ai, louis, player)
	var fd := map.get_node("Doors/FrontDoor") as Node3D
	_door_closed_y = fd.rotation.y
	var sw: Array = layout["front_door"]["swing"]
	var swing := Vector3(sw[0], 0, sw[1])
	var best := -2.0
	for sgn in [1.0, -1.0]:
		var y: float = _door_closed_y + sgn * deg_to_rad(82.0)
		var dir := Vector3(cos(-y), 0, sin(-y))       # the leaf runs along the pivot's +X
		if dir.dot(swing) > best:
			best = dir.dot(swing)
			_door_open_y = y
	fd.rotation.y = _door_open_y
	if autoplay:
		for d in get_tree().get_nodes_in_group("door"):
			(d as Door).open_instant()
	if shots:
		Cameras.camera_changed.connect(func(_o, n): _snap("cam_" + (n.name if n else "none")))
	await get_tree().process_frame
	run()

func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and e.keycode == KEY_F5:
		resume_at = ""
		get_tree().reload_current_scene()
	if e.is_action_pressed("inventory") and not Dialogue.active and not _doc_open and (_inv_open or not player.control_locked) and not _busy:
		_toggle_inventory()

## The pause menu's "Restart from checkpoint".
func restart_checkpoint() -> void:
	resume_at = checkpoint
	Engine.time_scale = 1.0
	Cameras.clear()
	HUD.reset()
	get_tree().reload_current_scene()

func run() -> void:
	var i: int = max(0, PHASES.find(start_at))
	_setup_state(PHASES[i])
	if _test_life > 0.0: ai.life = _test_life
	for k in range(i, PHASES.size()):
		if dead:
			return
		if PHASES[k] == stop_at:
			await wait(0.5)
			get_tree().quit()
			return
		checkpoint = PHASES[k]
		print("[ch1] phase ", PHASES[k])
		match PHASES[k]:
			"drive":
				await _title()
				await _highway()
				await _arrival()
			"walk": await _walk()
			"sprint": await _sprint()
			"inside": await _inside()
			"wardrobe": await _wardrobe()
			"duel": await _duel()
			"after": await _after()
			"louis": await _louis_part()
			"road": await _road_out()
	if not dead:
		await _end()

## Puts the world in the state a checkpoint expects (resuming after a death, or start=).
func _setup_state(cp: String) -> void:
	var n: int = PHASES.find(cp)
	if n >= 1:
		_park_car()
		player.visible = true
		(car.get_node("Norah") as Node3D).visible = false
		_car_beams(n == 1)
		_louis_at_treeline(n == 1)
		if n == 1: _beams_on_louis(true, 0.0)
		player.place(_car_side(), -30)
	if n >= 2:
		var fz: Array = layout["freeze"]
		player.place(Vector3(fz[0], 0, fz[1]), -50)
		louis.visible = false
	if n >= 3:
		_close_front_door()
		player.place(Vector3(-3.3, 0, -1.0), 90)
		louis.visible = false
		_enable_search(true)
	if n >= 4:
		_move_by("Props/Bookshelf", Vector3(0, 0, -1.0), 0.0)
		flags["shelf"] = true
		inv["revolver"] = 1
		loaded = 5
		player.place(Vector3(-11.0, 0, 1.0), 90)
		_refresh_props.call_deferred()
	if n >= 5:
		_move_by("Props/BedWardrobe", WARDROBE_PUSH * CRASH_AT, 0.0)
		flags["wardrobe"] = true
		_window_broken()
		player.place(Vector3(-13.0, 0, 1.2), 90)
	if n >= 6:
		player.model.model_id = "norah_worn"
		_car_wrecked()
		_window_broken()
		louis.visible = true
		louis.global_position = Vector3(-13.9, 0.0, 0.4)
		louis.rotation.y = deg_to_rad(40)
		louis.play("dead")
		flags["louis_dead"] = true
		loaded = 2
		player.place(Vector3(-12.6, 0, 1.0), 90)
		_refresh_props.call_deferred()
	if n >= 7:
		louis.visible = false               # gone from the floor while she watched the broadcast
		ai.life = LouisAI.LIFE - LouisAI.CORE_HP   # what the house fight took off him
		ai.hp = 0.0
		flags["louis_gone"] = true
		_blood_trail.call_deferred(Vector3(-13.9, 0.0, 0.4))
		inv["flashlight"] = 1
		light_charge = 100.0
		inv["ammo"] = inv.get("ammo", 0) + 5
		for f in ["journal", "photo_birthday", "broadcast"]: _file(f, false)
		_key("lockbox_code", false)
		_tv_on(false)
		flags["gathered"] = true
		player.place(Vector3(-3.0, 0, -1.0), 90)
	if n >= 8:
		flags.merge({"exited": true, "car_seen": true, "keys": true}, true)
		_key("truck_keys", false)
	if n >= 1:
		HUD.fade_in(0.8)

# ================================================================== part 1: the drive, the arrival
func _title() -> void:
	lock(true)
	player.visible = false
	louis.visible = false
	HUD.black()
	audio.mix("ch1_drive_out", 0.5)
	await wait(0.8)
	await HUD.title("CHAPTER ONE", "NORAH", 2.2, 1.0)

func _highway() -> void:
	_car_fill()
	car.global_position = Vector3(-180, 0, HZ - 1.6)
	car.rotation.y = deg_to_rad(-90)
	_car_beams(true)
	_follow("highway")
	HUD.fade_in(1.6)
	var tw := create_tween()
	tw.tween_property(car, "global_position:x", -10.0, 11.0)
	await wait(4.5)
	var ic := _car_interior_cams()
	cut_cam(ic["profile"])
	audio.mix("ch1_drive", 0.6)
	await wait(1.0)
	# the cut follows the voice: her lines on her, the radio's on the radio and the dark road ahead, with the
	# car seen from outside, small on the empty highway, in between
	var radio_n := [0]
	var by_voice := func(id: String, _i: int, l: Dictionary) -> void:
		if id != "c1_call" and id != "c1_radio": return
		if String(l.get("who", "")) == "norah":
			cut_cam(ic["profile"])
		else:
			radio_n[0] += 1
			if radio_n[0] == 2:
				_follow("highway")
			else:
				cut_cam(ic["dash"])
	Dialogue.line_started.connect(by_voice)
	await Dialogue.play("c1_call", true)
	# the radio: missing persons reports, then her
	audio.sfx("dial_click", -10.0, 0.8)
	audio.level("tv_static_loop", -30.0, 0.4)
	await wait(0.6)
	var omen := func(id: String, i: int, _l: Dictionary) -> void:
		if id == "c1_radio" and i == 0:      # lands on "...missing persons reports"
			await wait(2.4)
			audio.level("tv_static_loop", -48.0, 0.3)
			audio.sfx("radio_omen", -3.0)
			await wait(3.4)
			audio.level("tv_static_loop", -30.0, 0.8)
	Dialogue.line_started.connect(omen)
	await Dialogue.play("c1_radio", true)
	Dialogue.line_started.disconnect(omen)
	Dialogue.line_started.disconnect(by_voice)
	audio.level("tv_static_loop", -60.0, 1.2)
	if tw.is_running():
		await tw.finished
	cut("H3_Roadside")
	audio.mix("ch1_drive_out", 0.6)
	var go := create_tween()
	go.tween_property(car, "global_position:x", 70.0, 6.0)
	await wait(3.0)
	HUD.fade_out(1.5)
	await wait(1.8)

func _arrival() -> void:
	HUD.title("", "ONE HOUR LATER", 1.4, 0.6)
	await wait(2.4)
	var path := _pts(layout["arrive"])
	car.global_position = path[0]
	_follow("road")
	audio.mix("ch1_drive_out", 0.5)
	_louis_at_treeline(true)
	HUD.fade_in(1.2)
	var said := [false, false]
	await _drive_path(car, path, func(f: float) -> float: return 2.5 if f > 0.97 else (6.0 if f > 0.85 else 10.0), func(f: float) -> void:
		if f > 0.45 and not said[0]:
			said[0] = true
			Dialogue.play("c1_arrive", true, false)
		if f > 0.9 and not said[1]:
			said[1] = true
			_follow("")
			(cam("CAM_01") as TrackingCamera).look_target = car
			cut("CAM_01"))
	var c: Array = layout["car"]
	var rt := create_tween()
	rt.tween_property(car, "rotation:y", car.rotation.y + wrapf(deg_to_rad(c[2]) - car.rotation.y, -PI, PI), 0.8).set_trans(Tween.TRANS_SINE)
	await rt.finished
	_beams_on_louis(true, 0.9)
	audio.level("engine_loop", -60.0, 1.2)
	audio.mix("ch1_yard", 2.0)
	if car.has_node("Fill"): car.get_node("Fill").queue_free()
	await wait(0.8)
	audio.sfx("car_door", -6.0)
	(car.get_node("Norah") as Node3D).visible = false
	player.place(_car_side(), -20)
	player.visible = true
	player.model.play("idle")
	await wait(1.2)
	audio.sfx("car_door", -4.0, 0.9)
	await wait(0.6)
	(cam("CAM_01") as TrackingCamera).look_target = null
	Cameras.cut_to(null)
	lock(false)
	_music("stalking", -12.0, 3.0)
	objective("Go inside.")

## She walks up the gravel and the stepping stones; at the marker she stops: the shape in her headlights.
func _walk() -> void:
	_bounds_on = true
	_bounds_walk_only = true
	var fz: Array = layout["freeze"]
	var spot := Vector3(fz[0], 0, fz[1])
	_woods_dashes()                          # white shapes flitting between the trees while she walks up
	if autoplay:
		for p in [Vector3(0.9, 0, 12.5), spot]:
			await _auto_walk(p, 1.2)
	else:
		while not dead:
			var p := player.global_position
			if Vector2(p.x - spot.x, p.z - spot.z).length() < 1.3 or p.z < spot.z + 0.4:
				break
			await get_tree().physics_frame
	_dashes_on = false
	_bounds_on = false
	# THE FREEZE (cutscene, ~11 s): over her shoulder at the figure standing in the trees
	lock(true)
	var lf: Array = layout["louis_fig"]
	var ldir := Vector3(lf[0], 0, lf[1]) - player.global_position
	player.place(Vector3(player.global_position.x, 0, player.global_position.z), rad_to_deg(atan2(-ldir.x, -ldir.z)))
	player.model.play("idle")
	audio.mix("ch1_uneasy", 1.5)
	cut("CAM_03")
	Dialogue.play("c1_figure", true, false)
	await wait(3.0)
	# HIS EYES: from the trees, back up the yard at her, the headlights blazing behind her... and they die
	var pov := _louis_pov_camera()
	cut_cam(pov)
	_sfx3d("growl_loop", Vector3(lf[0], 1.4, lf[1]), -10.0)
	await wait(1.5)
	_music("", 0.0, 0.08)
	audio.sfx("headlight_crack", 0.0)
	await _headlight_death()
	_blackout(true)
	await wait(0.8)
	# CAM_04: her face, uncomfortably close, in the dark. She turns toward the dead car.
	cut("CAM_04")
	if is_instance_valid(pov): pov.queue_free()
	player.model.play("scared", 0.05)
	var turn := create_tween()
	turn.tween_property(player, "rotation:y", player.rotation.y + deg_to_rad(110), 0.45).set_trans(Tween.TRANS_SINE)
	Dialogue.play("c1_headlight", true, false)
	await wait(2.6)
	_louis_at_treeline(false)
	_afterimage(true)
	# CAM_05: the dark, silent. Only his burned-in shape, gone and back, nearer each time.
	cut("CAM_05")
	audio.mix("ch1_silence", 0.2)
	_afterimage_flicker(cam("CAM_05"))
	await wait(2.2)

# ================================================================== part 2: the run for the house, and the Brute
## She runs for the house in the dark. He's not behind her: as she reaches the house he walks out of the black
## beside her, swings, she ducks and rolls, his fist goes into the wall. He leaves it there, watching her, then
## pulls it out and follows. Slowly. He doesn't need to hurry.
const STRIKE_SPOT := Vector3(-1.6, 0, 2.9)       ## where she's caught, a step off the kitchen's east wall
const LOUIS_SCALE := 1.0                         ## a regular man's height (1.9 m); only the arm is monstrous
var _pursue := false
func _sprint() -> void:
	_blackout(false)
	_beams_on_louis(false, 0.0)
	_blackout(true, 0.2)                     # still the dark, but she can make out the house and the porch light
	louis.visible = false
	_afterimage(true)
	_ghost_linger.call_deferred()
	player.model.play("scared", 0.05)
	Cameras.cut_to(null)
	audio.mix("ch1_chase", 0.3)
	_music("stalking", -8.0, 0.5)
	lock(false)
	objective("Get inside!")
	Dialogue.play("c1_reveal", true, false)
	var run0 := player.run_speed
	player.run_speed = 3.3                    # a panicked, heavy-footed sprint over wet grass
	# until she reaches the house
	if autoplay:
		await _auto_walk(Vector3(1.0, 0, 7.0), 3.3)
		await _auto_walk(STRIKE_SPOT + Vector3(0.6, 0, 0.6), 3.3)
	else:
		while not dead:
			var p := player.global_position
			if (p.x < 0.6 and p.z < 6.0) or p.distance_to(STRIKE_SPOT) < 2.4:
				break
			await get_tree().physics_frame
	if dead: return
	await _house_strike()
	if dead: return
	lock(false)
	objective("Get inside!")
	_louis_hold_then_pursue()
	await reach_box(Vector3(-2.4, 0, -2.8), Vector3(0.6, 0, 0.6), [Vector3(0.4, 0, 1.2), Vector3(1.2, 0, 1.1), Vector3(-0.6, 0, -0.9)], 3.3)
	player.run_speed = run0
	if dead: return
	lock(true)
	audio.sfx("keys_jingle", -4.0)
	Dialogue.play("c1_keys", true, false)
	_beat_walk = true
	await _auto_walk(Vector3(-1.0, 0, -1.0), 3.6, true)
	await _auto_walk(Vector3(-3.3, 0, -1.0), 3.0, true)
	_beat_walk = false
	player.place(Vector3(-3.3, 0, -1.0), 90)
	_close_front_door()
	_music("", 0.0, 0.15)
	audio.sfx("door_slam", 2.0)
	Cameras.shake(0.08, 0.3)
	_pursue = false
	louis.visible = false
	_afterimage(false)
	_blackout(false)
	Cameras.cut_to(null)

## THE STRIKE (cutscene, ~5 s).
func _house_strike() -> void:
	lock(true)
	_afterimage(false)
	var S := STRIKE_SPOT
	player.place(S, -90)                                     # facing out into the dark yard (+X)
	player.model.play("scared", 0.1)
	var L_end := S + Vector3(1.05, 0, 0.05)
	var L_start := S + Vector3(6.2, 0, 1.4)
	louis.scale = Vector3.ONE * LOUIS_SCALE
	louis.global_position = L_start
	var d0 := L_end - L_start
	louis.rotation.y = atan2(-d0.x, -d0.z)
	louis.visible = true
	louis.play("stride", 0.0, 0.8)
	var rim := OmniLight3D.new()                             # just enough cold light to see him come out of the black
	rim.light_color = Color(0.62, 0.7, 0.85)
	rim.light_energy = 0.9
	rim.omni_range = 3.2
	louis.add_child(rim)
	rim.position = Vector3(-0.6, 2.0, -0.8)
	# SHOT A: behind her shoulder, her back to the wall, looking out into the dark. He walks out of it.
	var ca := Camera3D.new()
	world.add_child(ca)
	ca.global_position = S + Vector3(-0.75, 1.5, 0.5)
	ca.look_at(S + Vector3(5.0, 1.55, 0.9), Vector3.UP)
	ca.fov = 50.0
	ca.environment = cam("CAM_05").environment if cam("CAM_05") else null
	cut_cam(ca)
	var walk := create_tween()
	BodySweep.glide_into(walk, louis, L_end, 2.5, 0.3, 1.4)
	await wait(0.35)
	audio.sfx("sharp_sting", 4.0)
	Cameras.shake(0.04, 0.3)
	await wait(2.15)
	# SHOT B: from the side, along the wall: the swing, the duck and roll, the fist into the house.
	var cb := Camera3D.new()
	world.add_child(cb)
	var mid := (S + L_end) * 0.5
	cb.global_position = mid + Vector3(0.6, 1.3, 4.4)
	cb.look_at(mid + Vector3(-0.3, 1.25, -0.4), Vector3.UP)
	cb.fov = 54.0
	cb.environment = ca.environment
	cut_cam(cb)
	if is_instance_valid(ca): ca.queue_free()
	louis.play_once("brute_swing", 0.08)
	# THE DODGE (quick time event): the swing goes to slow motion and she has a moment to duck under it
	var dodged := await _qte("DODGE!", "interact", 1.25, 0.12)
	audio.sfx("brute_whoosh", 2.0)
	if dodged:
		player.model.play_once("duck_roll", 0.03)
		await wait(0.32)                                     # 0.62 s into the swing: the fist lands, in the wall
		_make_dent(louis)
		audio.sfx("wall_smash", 5.0)
		Cameras.shake(0.2, 0.4)
		await wait(0.1)
		# she rolls away along the wall toward the door
		player.rotation.y = 0.0                              # facing -Z, the door's way
		var roll := create_tween()
		BodySweep.glide_into(roll, player, S + Vector3(0.25, 0, -1.8), 0.62).set_trans(Tween.TRANS_SINE)
		await wait(0.3)
	else:
		# too slow: the arm takes her full in the chest and pins her to the house. She doesn't get up.
		await wait(0.2)
		player.model.play_once("fall", 0.02)
		audio.sfx("wall_smash", 6.0, 0.8)
		audio.sfx("knockdown", 4.0, 0.8)
		HUD.flash(3, Color(0.6, 0.0, 0.0))
		Cameras.shake(0.45, 0.6)
		var thrown := create_tween()
		BodySweep.glide_into(thrown, player, S + Vector3(-0.15, 0, 0.1), 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		await wait(0.3)
		# low, along the wall: she slides down the siding under his arm
		var cd := Camera3D.new()
		world.add_child(cd)
		var fall_at := player.global_position + Vector3(0.25, 0.35, 0.0)
		cd.global_position = fall_at + Vector3(0.55, 1.85, 1.35)
		cd.look_at(fall_at + Vector3(0.1, -0.1, 0.0), Vector3.UP)
		var fl := OmniLight3D.new()                     # enough cold light to see her go down
		fl.light_color = Color(0.62, 0.7, 0.85)
		fl.light_energy = 1.1
		fl.omni_range = 2.4
		world.add_child(fl)
		fl.global_position = fall_at + Vector3(0.7, 1.1, 0.8)
		cd.fov = 50.0
		cd.environment = cb.environment
		cut_cam(cd)
		await wait(0.4)
		player.model.play("down", 0.2)
		louis.play("fist_stuck", 0.15)
		await wait(0.5)
		if combat: combat.health = 0.0
		_die()                                               # the camera holds on her; the reload clears it
		return
	louis.play("fist_stuck", 0.12)
	_louis_look_at(true)
	await wait(0.6)
	Cameras.cut_to(null)
	if is_instance_valid(cb): cb.queue_free()
	rim.light_energy = 0.5
	player.model.play("run", 0.1)

## A quick time event: `label` and the button for `action` (E / pad A) flash up low on the screen while the action
## drops to slow motion; one press within `window` seconds (real time) succeeds. A press from before the prompt
## showed doesn't count. Autoplay always succeeds. Returns whether it was hit in time.
func _qte(label: String, action: String, window: float, slowmo := 0.15) -> bool:
	var ts := Engine.time_scale
	Engine.time_scale = slowmo
	var obj_vis := HUD.obj_bar.visible
	HUD.obj_bar.visible = false
	audio.sfx("heartbeat_hit", 0.0, 1.2)
	var o := Control.new()
	o.size = Vector2(HUD.W, HUD.H)
	o.mouse_filter = Control.MOUSE_FILTER_IGNORE
	HUD.root.add_child(o)
	var key := "A" if Input.get_connected_joypads().size() > 0 and _last_pad else "E"
	var t0 := Time.get_ticks_msec()
	var ok := false
	var result_t := -1.0
	o.draw.connect(func():
		var f: Font = HUD.MONO
		var c := Vector2(HUD.W / 2.0, HUD.H * 0.74)          # low centre: clear of the faces
		var el := (Time.get_ticks_msec() - t0) / 1000.0
		var left := clampf(1.0 - el / window, 0.0, 1.0)
		var col := Color(0.95, 0.85, 0.5) if result_t < 0.0 else (Color(0.5, 0.95, 0.5) if ok else Color(0.95, 0.25, 0.2))
		var pulse := 1.0 + 0.08 * sin(el * 22.0) if result_t < 0.0 else 1.0
		# the shrinking ring: the time left
		o.draw_arc(c, 26.0, 0.0, TAU, 40, Color(0, 0, 0, 0.6), 6.0)
		o.draw_arc(c, 26.0, -PI / 2.0, -PI / 2.0 + TAU * left, 40, col, 3.0)
		var kw := f.get_string_size(key, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x + 12.0
		var kr := Rect2(c - Vector2(kw / 2.0, 9.0) * pulse, Vector2(kw, 18.0) * pulse)
		o.draw_rect(kr, Color(0.05, 0.05, 0.06, 0.92))
		o.draw_rect(kr, col, false, 1.5)
		o.draw_string(f, Vector2(c.x - kw / 2.0 + 6.0, c.y + 4.0), key, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, col)
		var lw := HUD.SERIF.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 18).x
		o.draw_string(HUD.SERIF, Vector2(c.x - lw / 2.0 + 1.0, c.y - 38.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0, 0, 0, 0.8))
		o.draw_string(HUD.SERIF, Vector2(c.x - lw / 2.0, c.y - 39.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, col))
	await get_tree().process_frame
	while not dead:
		var el := (Time.get_ticks_msec() - t0) / 1000.0
		o.queue_redraw()
		if autoplay and el > window * 0.4:
			ok = true
		elif Input.is_action_just_pressed(action):
			ok = true          # one press is all it takes
		if ok or el >= window:
			break
		await get_tree().process_frame
	result_t = 0.0
	o.queue_redraw()
	audio.sfx("ui_next" if ok else "door_rattle", -4.0 if ok else -8.0, 1.0 if ok else 0.7)
	Engine.time_scale = ts
	HUD.obj_bar.visible = obj_vis
	var fade := o.create_tween()
	fade.tween_interval(0.25)
	fade.tween_property(o, "modulate:a", 0.0, 0.25)
	fade.tween_callback(o.queue_free)
	print("[ch1] qte %s: %s" % [label, "hit" if ok else "missed"])
	return ok

var _last_pad := false
func _input(e: InputEvent) -> void:
	if e is InputEventJoypadButton or e is InputEventJoypadMotion: _last_pad = true
	elif e is InputEventKey or e is InputEventMouseButton: _last_pad = false

## He leaves his fist in the wall for two seconds, head turning after her. Then he pulls it out and follows: slow,
## even strides. If she lets him reach her he clubs her with the arm.
func _louis_hold_then_pursue() -> void:
	_pursue = true
	await wait(2.0)
	if not _pursue: return
	await louis.play_once("wrench", 0.05)
	_louis_look_at(false)
	var cool := 0.0
	louis.play("stride", 0.2, 0.62)
	while _pursue and not dead:
		var dt := get_physics_process_delta_time()
		cool -= dt
		var to := player.global_position - louis.global_position
		to.y = 0.0
		if to.length() > 1.5:
			BodySweep.move(louis, to.normalized() * 1.5 * dt, 0.3, 1.4)
			louis.rotation.y = rotate_toward(louis.rotation.y, atan2(-to.x, -to.z), dt * 3.0)
		elif cool <= 0.0:
			cool = 2.4
			louis.play_once("bash", 0.05)
			await wait(0.32)
			if _pursue and player.global_position.distance_to(louis.global_position) < 2.0:
				combat.take_damage(30.0, to.normalized())
			louis.play("stride", 0.2, 0.62)
		await get_tree().physics_frame

## His head (only his head) turning to follow Norah.
var _look: Node
func _louis_look_at(on: bool) -> void:
	if is_instance_valid(_look):
		_look.queue_free()
		_look = null
	if not on or louis.skeleton == null: return
	var la := LookAtModifier3D.new()
	la.bone_name = "head"
	la.forward_axis = SkeletonModifier3D.BONE_AXIS_PLUS_Z
	la.primary_rotation_axis = Vector3.AXIS_Y
	la.use_angle_limitation = true
	la.symmetry_limitation = true
	la.primary_limit_angle = deg_to_rad(150.0)
	la.secondary_limit_angle = deg_to_rad(60.0)
	la.duration = 0.35
	louis.skeleton.add_child(la)
	var tgt := Marker3D.new()
	player.add_child(tgt)
	tgt.position = Vector3(0, 1.0, 0)
	la.target_node = la.get_path_to(tgt)
	la.tree_exiting.connect(tgt.queue_free)
	_look = la

## A dent smashed into the house where his fist went in: a crater of broken brick, chunks hanging out of it and
## spilled on the ground. It stays for the rest of the chapter.
func _make_dent(who: Node3D) -> void:
	if map.has_node("Dent"): return
	var hand := who.global_position + Vector3(0, 1.55, 0)
	if louis.skeleton:
		var bi := louis.skeleton.find_bone("hand.L")
		if bi >= 0: hand = louis.skeleton.global_transform * louis.skeleton.get_bone_global_pose(bi).origin
	var space := player.get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(Vector3(STRIKE_SPOT.x + 1.0, clampf(hand.y, 1.2, 2.0), hand.z), Vector3(STRIKE_SPOT.x - 3.0, clampf(hand.y, 1.2, 2.0), hand.z), 1)
	var hit := space.intersect_ray(q)
	var at := Vector3(-2.5, clampf(hand.y, 1.2, 2.0), hand.z)
	var n := Vector3(1, 0, 0)
	if not hit.is_empty():
		at = hit["position"]; n = hit["normal"]
	# his weight carries him the last of the way: the fist ends up in the wall, not short of it
	var reach := at - hand
	reach.y = 0.0
	if reach.length() < 1.6 and who == louis:
		BodySweep.glide_into(create_tween(), louis, louis.global_position + reach - n * 0.08, 0.07, 0.3, 1.4)
	var dent := Node3D.new()
	dent.name = "Dent"
	map.add_child(dent)
	dent.global_position = at + n * 0.012
	dent.look_at(dent.global_position + n, Vector3.UP)          # -Z points into the wall... so +Z faces out
	dent.rotate_object_local(Vector3.UP, PI)
	var quad := MeshInstance3D.new()
	var qm := QuadMesh.new(); qm.size = Vector2(1.1, 1.1)
	quad.mesh = qm
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = _dent_texture()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	mat.alpha_scissor_threshold = 0.4
	mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	quad.material_override = mat
	dent.add_child(quad)
	var brick := StandardMaterial3D.new(); brick.albedo_color = Color(0.42, 0.17, 0.12)
	var rng := RandomNumberGenerator.new(); rng.seed = 7
	for i in 9:                                              # chunks of brick and mortar hanging out of the hole
		var b := MeshInstance3D.new(); var bm := BoxMesh.new()
		bm.size = Vector3(rng.randf_range(0.08, 0.2), rng.randf_range(0.05, 0.09), rng.randf_range(0.06, 0.16))
		b.mesh = bm; b.material_override = brick
		dent.add_child(b)
		var a := rng.randf() * TAU; var r := rng.randf_range(0.18, 0.42)
		b.position = Vector3(cos(a) * r, sin(a) * r, rng.randf_range(0.02, 0.09))
		b.rotation = Vector3(rng.randf_range(-0.6, 0.6), rng.randf_range(-0.6, 0.6), rng.randf_range(-0.8, 0.8))
	for i in 12:                                             # spilled on the ground below
		var b := MeshInstance3D.new(); var bm := BoxMesh.new()
		bm.size = Vector3(rng.randf_range(0.06, 0.18), rng.randf_range(0.04, 0.07), rng.randf_range(0.05, 0.12))
		b.mesh = bm; b.material_override = brick
		map.add_child(b)
		b.global_position = Vector3(at.x, 0.03, at.z) + n * rng.randf_range(0.1, 0.7) + Vector3(0, 0, rng.randf_range(-0.5, 0.5))
		b.rotation = Vector3(rng.randf_range(-0.3, 0.3), rng.randf() * TAU, rng.randf_range(-0.3, 0.3))
	var dust := CPUParticles3D.new()                         # brick dust and chips bursting out
	dust.one_shot = true; dust.explosiveness = 0.9; dust.amount = 70; dust.lifetime = 1.2
	dust.direction = Vector3(0, 0.3, 1); dust.spread = 55.0
	dust.initial_velocity_min = 1.5; dust.initial_velocity_max = 4.5; dust.gravity = Vector3(0, -9, 0)
	var dq := QuadMesh.new(); dq.size = Vector2(0.05, 0.05)
	var dm := StandardMaterial3D.new(); dm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	dm.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED; dm.albedo_color = Color(0.5, 0.3, 0.24)
	dq.material = dm; dust.mesh = dq
	dent.add_child(dust)
	dust.emitting = true
	flags["dent"] = true

func _dent_texture() -> ImageTexture:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var rng := RandomNumberGenerator.new(); rng.seed = 3
	for y in 64:
		for x in 64:
			var dx := (x - 32) / 32.0; var dy := (y - 32) / 32.0
			var r := sqrt(dx * dx + dy * dy) + rng.randf_range(-0.06, 0.06)
			if r < 0.42:
				img.set_pixel(x, y, Color(0.05, 0.03, 0.03) .lerp(Color(0.2, 0.1, 0.08), r / 0.42))
			elif r < 0.7:
				var c := Color(0.32, 0.14, 0.1).lerp(Color(0.5, 0.22, 0.16), rng.randf())
				if rng.randf() < 0.25: c = Color(0.62, 0.58, 0.52)        # broken mortar
				img.set_pixel(x, y, c * (0.7 + 0.3 * (r - 0.42) / 0.28))
	for k in 9:                                                    # cracks running out across the brick
		var a := rng.randf() * TAU
		var px := 32.0 + cos(a) * 20.0; var py := 32.0 + sin(a) * 20.0
		for st in 18:
			a += rng.randf_range(-0.5, 0.5)
			px += cos(a) * 1.0; py += sin(a) * 1.0
			if px >= 0 and px < 64 and py >= 0 and py < 64: img.set_pixel(int(px), int(py), Color(0.06, 0.04, 0.04))
	return ImageTexture.create_from_image(img)

## White shapes darting between the trees on the walk up: there, and gone, with a rush of leaves.
var _dashes_on := false
func _woods_dashes() -> void:
	_dashes_on = true
	await wait(0.6)
	var n := 0
	while _dashes_on and not dead and n < 4:
		_woods_dash(n)
		n += 1
		await wait(1.4 if autoplay else randf_range(1.8, 3.0))

func _woods_dash(i: int) -> void:
	var c := Cameras.current
	if c == null: return
	var f := -c.global_basis.z; f.y = 0.0; f = f.normalized()
	var r := f.cross(Vector3.UP)
	var side := -1.0 if i % 2 == 0 else 1.0
	var center := player.global_position + f * randf_range(13.0, 17.0) + r * randf_range(-3.0, 3.0)
	var a := center - r * side * 7.0
	var b := center + r * side * 7.0
	var g := CharacterModel.new()
	g.model_id = louis.model_id
	g.start_animation = "stride"
	g.start_offset_random = false
	world.add_child(g)
	g.scale = Vector3.ONE * LOUIS_SCALE
	g.global_position = a
	var d := b - a
	g.rotation.y = atan2(-d.x, -d.z)
	if g.anim: g.anim.speed_scale = 2.8
	var m := ShaderMaterial.new()
	m.shader = preload("res://shaders/afterimage.gdshader")
	m.set_shader_parameter("tint", Color(0.9, 0.93, 0.95))
	m.set_shader_parameter("strength", 0.0)
	for mi in g.find_children("*", "MeshInstance3D", true, false):
		var mm := mi as MeshInstance3D
		mm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		for k in mm.mesh.get_surface_count(): mm.set_surface_override_material(k, m)
	_sfx3d("leaf_rustle", center, 2.0)
	var t := create_tween()
	t.set_parallel(true)
	t.tween_property(g, "global_position", b, 1.0)
	t.tween_method(func(x: float) -> void: m.set_shader_parameter("strength", x), 0.0, 0.8, 0.15)
	t.chain().tween_method(func(x: float) -> void: m.set_shader_parameter("strength", x), 0.8, 0.0, 0.2)
	t.chain().tween_callback(g.queue_free)

# ================================================================== part 3: the barricade, the revolver, the car
func _inside() -> void:
	audio.mix("ch1_house", 1.0)
	_attach_growl(null)
	_pounding = true
	_pound_door()
	await Dialogue.play("c1_inside")
	lock(false)
	_enable_search(true)
	objective("Block the door!")
	await use_point("Bookshelf", [Vector3(-3.2, 0, 0.6), Vector3(-2.35, 0, 1.05)])
	await _mash_push("Props/Bookshelf", Vector3(0, 0, -1.0), Vector3(-2.35, 0, 1.15), 0)
	flags["shelf"] = true
	await wait(1.2)
	_pounding = false
	await wait(1.0)
	_circling = true
	_music("stalking", -10.0, 4.0)
	await Dialogue.play("c1_barricaded")
	objective("Get the revolver: the lockbox under your bed.")
	while not dead:
		await use_point("Lockbox", [Vector3(-4.5, 0, 0.8), Vector3(-8.3, 0, 1.0), Vector3(-12.0, 0, 1.0), Vector3(-13.2, 0, 0.6), Vector3(-13.3, 0, -1.0)])
		lock(true)
		player.place(Vector3(-13.3, 0, -1.4), 90)
		player.model.play("kneel")
		if not ("lockbox_code" in keys_found) and not flags.get("noclue", false):
			flags["noclue"] = true
			await Dialogue.play("c1_lockbox_noclue")
		var ok: bool = await _dial("LOCKBOX", LOCK_CODE, true)
		player.model.play("idle")
		lock(false)
		if ok: break
	audio.sfx("lock_open", 0.0)
	(map.get_node("Dressing/Lockbox") as Node3D).visible = false
	loaded = 5
	_key("lockbox_code", false)
	audio.sfx("gun_cock", -2.0)
	await _pickup("revolver", 1, "5 rounds loaded.")
	_refresh_props()
	await Dialogue.play("c1_lockbox_open")

# ================================================================== part 4: the bedroom window
func _wardrobe() -> void:
	_window_scratch = true
	_music("stalking", -9.0, 2.0)
	objective("Block the bedroom window!")
	Dialogue.play("c1_window_scratch", true, false)
	await use_point("Wardrobe", [Vector3(-12.0, 0, 1.0), Vector3(-13.3, 0, 0.6), Vector3(-15.0, 0, 0.9), Vector3(-16.0, 0, 0.8)])
	# The scrape of the wardrobe is what brings him. A third of the way across, the scratching outside stops dead.
	# Then one heavy thud on the wall beside the glass. Then he comes through it.
	var beats := {"quiet": false, "thud": false}
	var on_prog := func(pr: float) -> void:
		if pr > 0.3 and not beats["quiet"]:
			beats["quiet"] = true
			_window_scratch = false
			_music("", 0.0, 0.4)
			audio.sfx("heartbeat_hit", -4.0)
		if pr > 0.48 and not beats["thud"]:
			beats["thud"] = true
			_sfx3d("door_pound", Vector3(-16.7, 1.2, -1.5), 4.0)
			Cameras.shake(0.12, 0.25)
			player.model.play("scared", 0.05)
			_push_jam = 0.9                   # she freezes; the wardrobe won't budge for a breath
	await _mash_push("Props/BedWardrobe", WARDROBE_PUSH, Vector3(-16.05, 0, 0.85), 0, CRASH_AT, on_prog)
	if dead: return
	await _window_crash()
	objective("")

## He comes through the bedroom window shoulder first, glass, frame and all. The half-pushed wardrobe is
## smashed over into the room, Norah is thrown flat on her back, and he crashes down across her bed.
func _window_crash() -> void:
	lock(true)
	_crashed = true
	flags["wardrobe"] = true
	audio.sfx("brute_whoosh", 2.0, 0.7)
	louis.scale = Vector3.ONE * LOUIS_SCALE
	louis.global_position = Vector3(-19.9, 0.0, -1.62)
	louis.rotation.y = -PI / 2                                   # facing +X, into the room
	louis.visible = true
	louis.play("shoulder_charge", 0.0)
	cut("CAM_11")
	if is_instance_valid(_push_cam): _push_cam.queue_free()
	# a few strides across the yard, then he dives: flat out, arms first, through the window opening itself.
	# His body clears the sill (0.7 m) and the head of the frame (1.9 m); nothing passes through the wall.
	var t := create_tween()
	t.tween_property(louis, "global_position", Vector3(-18.3, 0.0, -1.62), 0.3)
	await t.finished
	louis.play("pounce", 0.03)
	var leap := create_tween()
	leap.tween_property(louis, "global_position", Vector3(-16.55, 0.62, -1.62), 0.17).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	await leap.finished
	# impact
	_window_glass(false)
	audio.sfx("glass_crash", 6.0)
	audio.sfx("wall_smash", 4.0, 0.8)
	HUD.flash(2, Color(1, 1, 1))
	Cameras.shake(0.35, 0.55)
	Dialogue.play("c1_crash", true, false)
	_topple_wardrobe(0.55)
	# Norah: thrown back off the wardrobe and onto the floor
	var her := player.global_position
	player.model.play("fall", 0.04)
	var tb := create_tween()
	BodySweep.glide_into(tb, player, Vector3(-15.0, her.y, 0.95), 0.45).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	louis.play_once("bed_crash", 0.06)
	var t2 := create_tween()
	t2.tween_property(louis, "global_position", Vector3(-14.7, 0.55, -1.84), 0.22).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
	await t2.finished
	audio.sfx("body_land", 4.0, 0.7)
	await wait(0.25)
	audio.sfx("knockdown", 0.0, 0.9)                           # the wardrobe hits the floor
	Cameras.shake(0.2, 0.4)
	player.model.play("down", 0.25)
	(louis.get_node("Steam") as CPUParticles3D).emitting = true
	await wait(0.9)
	_floor_shot()                         # down on the carpet with her, looking up at him across the bed
	await wait(1.6)                       # the note: he lies on the bed a moment, steaming

# ================================================================== part 5: the fight in the house
func _duel() -> void:
	lock(true)
	_enable_search(true)
	if not _crashed:                      # resumed at this checkpoint: he's already through the window, on the bed
		player.place(Vector3(-15.0, 0, 0.95), 0)
		player.model.play("down", 0.0)
		louis.scale = Vector3.ONE * LOUIS_SCALE
		louis.global_position = Vector3(-14.7, 0.55, -1.84)
		louis.rotation.y = -PI / 2
		louis.visible = true
		louis.play("bed_crash", 0.0)
		if louis.anim: louis.anim.seek(louis.anim.current_animation_length, true)   # already landed
		(louis.get_node("Steam") as CPUParticles3D).emitting = true
		_floor_shot()
		await wait(0.8)
	if not _tut_seen:
		await _tutorial()
		_tut_seen = true
	# she scrambles up off the floor, backing away from the bed (seen wide, not from down on the carpet)
	cut("CAM_11")
	player.model.play("kneel", 0.45)
	await wait(0.45)
	player.model.play("idle", 0.35)
	await wait(0.2)
	if autoplay and not flags.get("searched_WardrobeSearch", false):   # the test run doesn't stop to pick the rounds up
		flags["searched_WardrobeSearch"] = true
		P["WardrobeSearch"].enabled = false
		inv["ammo"] = inv.get("ammo", 0) + 5
	# he gets up and steps down off the bed: across the mattress to its edge, then down onto the carpet in front
	# of it (the bed runs x -15.3..-13.9, z -2.8..-0.9; he never passes through its frame)
	var t3 := create_tween()
	t3.tween_property(louis, "global_position", Vector3(-14.5, 0.55, -1.05), 0.6).set_trans(Tween.TRANS_SINE)
	t3.tween_property(louis, "global_position", Vector3(-14.5, 0.0, -0.45), 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	await wait(1.1)
	audio.sfx("louis_shriek", -6.0, 0.5)
	_music("chase", -5.0, 0.05)
	_attach_growl(louis)
	Cameras.cut_to(null)
	if is_instance_valid(_floor_cam): _floor_cam.queue_free()
	objective("Fight back! (Tab: items)")
	combat.health = maxf(combat.health, 60.0)
	lock(false)
	ai.hp = LouisAI.CORE_HP
	ai.dead = false
	ai.indoors = false                    # at his own height he fits under the ceilings: his normal walk
	ai.start()
	while not flags.get("louis_dead", false) and not dead:
		await get_tree().physics_frame
	if dead: return
	_attach_growl(null)
	growl.stop()
	_music("", 0.0, 1.2)
	objective("")
	audio.mix("ch1_silence", 0.4)
	steam_snd.global_position = louis.global_position + Vector3(0, 0.4, 0)
	steam_snd.play()
	await wait(2.0)
	lock(true)
	player.model.play("idle")
	# she turns to him; the camera comes round over her shoulder and looks down at what's left of him
	var to_body := louis.global_position - player.global_position
	to_body.y = 0.0
	var face := create_tween()
	face.tween_property(player, "rotation:y", player.rotation.y + wrapf(atan2(-to_body.x, -to_body.z) - player.rotation.y, -PI, PI), 0.5).set_trans(Tween.TRANS_SINE)
	var bc := _body_cam(louis.global_position)
	cut_cam(bc)
	await Dialogue.play("c1_body")
	await Dialogue.play("c1_body_look")
	Cameras.cut_to(null)
	if is_instance_valid(bc): bc.queue_free()
	lock(false)

## Behind Norah, over her shoulder, looking down at `at` (a spot on the floor): her head and shoulders in the near
## side of the frame, what she's looking at beyond. Walls pull it in toward her.
func _shoulder_cam(at: Vector3) -> Camera3D:
	var c := Camera3D.new()
	world.add_child(c)
	var p := player.global_position
	var fwd := at - p
	fwd.y = 0.0
	fwd = fwd.normalized() if fwd.length() > 0.05 else -player.global_basis.z
	var side := fwd.cross(Vector3.UP).normalized()
	var head := p + Vector3(0, 1.55, 0)
	var want := head - fwd * 1.2 + side * 0.45 + Vector3(0, 0.35, 0)
	var q := PhysicsRayQueryParameters3D.create(head, want, 1)
	q.exclude = [player.get_rid()]
	var hit := player.get_world_3d().direct_space_state.intersect_ray(q)
	if not hit.is_empty(): want = head + (hit["position"] - head) * 0.85
	c.global_position = want
	c.look_at(at.lerp(p, 0.25) + Vector3(0, 0.3, 0), Vector3.UP)
	c.fov = 56.0
	var ref := cam("CAM_05")
	if Cameras.current and Cameras.current.environment: c.environment = Cameras.current.environment
	elif ref: c.environment = ref.environment
	return c

## A camera on the body (`at`) and Norah: from the far side of him looking back at her, or well off to her side,
## whichever has the most room (walls pull it in). Never straight through her head.
func _body_cam(at: Vector3) -> Camera3D:
	var c := Camera3D.new()
	world.add_child(c)
	var p := player.global_position
	var away := p - at; away.y = 0.0
	away = away.normalized() if away.length() > 0.05 else Vector3(0, 0, 1)
	var side := away.cross(Vector3.UP).normalized()
	var mid := (p + at) * 0.5 + Vector3(0, 0.7, 0)
	var space := player.get_world_3d().direct_space_state
	var cands := [
		at - away * 1.5 + side * 0.7 + Vector3(0, 1.5, 0), at - away * 1.5 - side * 0.7 + Vector3(0, 1.5, 0),
		p + side * 1.3 + away * 0.3 + Vector3(0, 1.8, 0), p - side * 1.3 + away * 0.3 + Vector3(0, 1.8, 0)]
	var best: Vector3 = cands[0]
	var best_d := -1.0
	for want in cands:
		var q := PhysicsRayQueryParameters3D.create(mid, want, 1)
		var hit := space.intersect_ray(q)
		var got: Vector3 = want if hit.is_empty() else mid + (hit["position"] - mid) * 0.85
		var dd := got.distance_to(mid)
		if dd > best_d + 0.05:
			best_d = dd
			best = got
	c.global_position = best
	c.look_at(at.lerp(p, 0.22) + Vector3(0, 0.2, 0), Vector3.UP)
	c.fov = 60.0
	var ref := cam("CAM_05")
	if Cameras.current and Cameras.current.environment: c.environment = Cameras.current.environment
	elif ref: c.environment = ref.environment
	return c

## The combat tutorial: shown once, after he lands on the bed.
func _tutorial() -> void:
	_doc_open = true
	_ui_hold(true)
	var o := _overlay()
	var title := _ol_label(o, "SURVIVE", Vector2(0, 26), 20, Color(0.85, 0.32, 0.22), HUD.SERIF)
	title.size = Vector2(HUD.W, 30)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var rows := [
		["AIM", "Hold C / right mouse / LB. She plants her feet and locks onto the nearest threat."],
		["FIRE", "F / left mouse / RB, while aiming."],
		["RELOAD", "R / pad X. Spare rounds load from your items."],
		["SHOVE", "V / middle mouse / pad Y. Rocks him back a step. Barely hurts."],
		["ROLL", "While aiming, tap Shift / B with a direction (back if none). You can't be hit mid-roll."],
		["HEAL", "Tab opens your items (the fight pauses). Pick the pills, E, Use."],
	]
	for i in rows.size():
		_ol_label(o, rows[i][0], Vector2(56, 74 + i * 30), 11, Color(0.95, 0.8, 0.45))
		var l := _ol_label(o, rows[i][1], Vector2(130, 74 + i * 30), 10, Color(0.88, 0.86, 0.8))
		_wrap(l, Vector2(300, 28))
	var tip := _ol_label(o, "Where you hit him matters. The head hurts him most. Shoot a leg or the arm enough and it comes off. When he hauls that arm back, roll.", Vector2(56, 262), 10, Color(0.8, 0.85, 0.95))
	_wrap(tip, Vector2(370, 32))
	var go := _ol_label(o, "[E]  Fight", Vector2(0, 312), 11, Color(0.95, 0.95, 0.9))
	go.size = Vector2(HUD.W, 16)
	go.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if shots: _snap("tutorial")
	await _wait_confirm(2.0)
	o.queue_free()
	_doc_open = false
	_ui_hold(false)

# ================================================================== part 6: the broadcast, the house, supplies
func _after() -> void:
	_car_wrecked()          # while she was fighting for her life inside, Louis had already been at her car
	player.model.model_id = "norah_worn"
	player.model.play("idle")
	_refresh_props()
	audio.mix("ch1_after", 1.0)
	Cameras.cut_to(null)
	await wait(1.5)
	# the TV turns itself on: a first-person look, right up against the screen
	lock(true)
	_tv_on(true)
	await wait(0.8)
	var tvc := _tv_camera()
	Cameras.cut_to(tvc)
	# while her eyes are on the screen, he gets up and goes, back out the way he came
	var gone_at := louis.global_position
	louis.visible = false
	steam_snd.stop()
	flags["louis_gone"] = true
	_blood_trail(gone_at)
	await _broadcast()
	_file("broadcast")
	tvc.queue_free()
	# she turns back to him: there's nothing there
	var to_spot := gone_at - player.global_position
	to_spot.y = 0.0
	if to_spot.length() > 0.2:
		create_tween().tween_property(player, "rotation:y", player.rotation.y + wrapf(atan2(-to_spot.x, -to_spot.z) - player.rotation.y, -PI, PI), 0.6).set_trans(Tween.TRANS_SINE)
	var gc := _shoulder_cam(gone_at)
	cut_cam(gc)
	audio.sfx("sharp_sting", -6.0, 0.8)
	audio.sfx("heartbeat_hit", -2.0)
	await wait(1.2)
	await Dialogue.play("c1_gone")
	_sfx3d("glass_crash", Vector3(-17.5, 1.0, -1.6), -16.0)         # somewhere out past the bedroom: glass underfoot
	await wait(0.9)
	Cameras.cut_to(null)
	gc.queue_free()
	await Dialogue.play("c1_after_broadcast")
	lock(false)
	objective("Call Addie.")
	await use_point("Landline", [Vector3(-10.2, 0, 1.0), Vector3(-6.8, 0, 1.0), Vector3(-4.0, 0, -2.0), Vector3(-3.4, 0, 1.5), Vector3(-6.9, 0, 2.6), Vector3(-6.9, 0, 4.6)])
	lock(true)
	audio.sfx("phone_static", -2.0)
	await Dialogue.play("c1_landline")
	lock(false)
	if not (inv.has("flashlight") or inv.has("flashlight_dead")) or not (inv.has("batteries") or light_charge > 0.0):
		objective("Find a flashlight and batteries (the kitchen).")
		if autoplay:
			await _auto_walk(Vector3(-5.75, 0, 5.0))
			await _search("CounterBatt")
			await _auto_walk(Vector3(-3.94, 0, 5.0))
			await _search("CounterFlash")
		while not dead and not ((inv.has("flashlight") or inv.has("flashlight_dead")) and (inv.has("batteries") or light_charge > 0.0)):
			await get_tree().physics_frame
	if not inv.has("flashlight"):
		objective("Put the batteries in the flashlight (Tab).")
		if autoplay: _combine("flashlight_dead", "batteries")
		while not inv.has("flashlight") and not dead:
			await get_tree().physics_frame
	flags["gathered"] = true
	# outside, slow and heavy on the gravel along the kitchen wall, going away: he's out there
	lock(true)
	_music("", 0.0, 0.6)
	var steps := [Vector3(-7.9, 0.2, 6.6), Vector3(-5.5, 0.2, 7.4), Vector3(-3.0, 0.2, 7.6), Vector3(-0.6, 0.2, 7.9)]
	for st in steps:
		_sfx3d("step_gravel", st, 4.0)
		await wait(0.85)
	_sfx3d("louis_shriek", Vector3(1.5, 1.0, 8.5), -14.0)
	await wait(0.6)
	lock(false)
	await Dialogue.play("c1_gathered")

func _end() -> void:
	lock(true)
	objective("")
	HUD.black()
	audio.mix("ch1_silence", 2.0)
	await wait(1.2)
	await HUD.title("END OF CHAPTER ONE", "", 2.0, 1.0)
	await wait(0.8)
	audio.sfx("title_hit", -4.0)
	await HUD.title("CHAPTER TWO", "THE OLD CHAPEL", 2.6, 1.2)
	HUD.show_end_card(PackedStringArray(["END OF CHAPTER ONE", "Next: Chapter Two, The Old Chapel"]))
	print("[ch1] DONE")
	if autoplay:
		await wait(3.0)
		get_tree().quit()

# ================================================================== part 7: outside, the car, Louis's house, the truck (free roam)
func _louis_part() -> void:
	checkpoint = "louis"
	audio.mix("ch1_after", 1.0)
	Cameras.cut_to(null)
	for nm in ["FrontDoorExit", "CarDoor", "TruckDoor", "Grave", "Well", "LDesk", "LWardrobe", "LToilet", "RosePhotoPt", "StormPhotoPt",
			"UFridge", "USafe", "UBed", "UWindow"]:
		P[nm].enabled = true
	if flags.get("exited", false): P["FrontDoorExit"].enabled = false
	_update_objective()
	var crane := cam("CAM_Crane")
	for z in ["ZCAM_01", "ZCAM_02", "ZCAM_06", "ZCAM_12"]:
		var zn := world.get_node_or_null("Zones/" + z) as CameraZone
		if zn: zn.camera = crane
	lock(false)
	_roaming = true
	_bounds_on = true
	_bounds_walk_only = false
	stalker.enabled = true
	if autoplay:
		combat.engage = false             # the stalker decides when the test run stands and fights
		combat.damage_scale = 0.25
	if autoplay:
		await _louis_autoplay()
	else:
		while not dead and not flags.get("leave", false):
			var nm: String = await used_point
			if _busy: continue
			await _run_beat(_roam_use.bind(nm))
	_roaming = false
	_bounds_on = false
	for nm in P: P[nm].enabled = false

func _run_beat(beat: Callable) -> void:
	_busy = true
	await beat.call()
	_busy = false
	_update_objective()

## Where the compass points: the current objective first, then anything she still needs for it.
## Louis's upstairs is a separate block on the map, so anything up there is pointed at via his stairs (and back).
const L_STAIRS_DOWN := Vector3(32.42, 0, -6.6)
const L_STAIRS_UP := Vector3(73.9, 0, -2.6)
func _cpt(nm: String) -> Vector3:
	var v: Vector3 = (P[nm] as Node3D).global_position if P.has(nm) else Vector3.ZERO
	var up_t := v.x > 60.0; var up_p := player.global_position.x > 60.0
	if up_t and not up_p: return L_STAIRS_DOWN
	if up_p and not up_t: return L_STAIRS_UP
	return v
func _compass_targets() -> Array:
	var t: String = HUD.objective.text
	var out: Array = []
	match t:
		"Go inside.", "Get inside!": out = [_cpt("FrontDoorExit")]
		"Block the door!": out = [_cpt("Bookshelf")]
		"Get the revolver: the lockbox under your bed.": out = [_cpt("Lockbox")]
		"Block the bedroom window!": out = [_cpt("Wardrobe")]
		"Call Addie.": out = [_cpt("Landline")]
		"Move the bookshelf and go out.": out = [_cpt("FrontDoorExit")]
		"Go to your car.": out = [_cpt("CarDoor")]
		"Get in Louis's truck.": out = [_cpt("TruckDoor")]
	if t.begins_with("Find a flashlight"):
		for nm in ["CounterFlash", "CounterBatt"]:
			if not flags.get("searched_" + nm, false): out.append(_cpt(nm))
	elif t == "Find the keys to Louis's truck." or t == "Search Louis's house for the truck keys.":
		if not ("safe_code" in keys_found): out = [_cpt("LDesk")]
		elif not ("truck_keys" in keys_found): out = [_cpt("USafe")]
	return out

func _update_objective() -> void:
	if not _roaming: return
	var t := "Go to your car."
	if not flags.get("exited", false):
		t = "Move the bookshelf and go out."
	elif flags.get("car_seen", false) and not inv.has("__never"):
		t = "Find the keys to Louis's truck." if not ("truck_keys" in keys_found) else "Get in Louis's truck."
	if flags.get("truck_tried", false) and not ("truck_keys" in keys_found):
		t = "Search Louis's house for the truck keys."
	if t != HUD.objective.text:
		objective(t)

func _roam_use(nm: String) -> void:
	match nm:
		"FrontDoorExit": await _exit_house()
		"CarDoor":
			flags["car_seen"] = true
			await Dialogue.play("c1_car_wrecked")
			if stalker.state == "off":
				await _stalker_reveal()
		"TruckDoor":
			if "truck_keys" in keys_found:
				await Dialogue.play("c1_truck_keys")
				if stalker.state != "dead":
					await _truck_finale()
				flags["leave"] = true
				used_point.emit("__leave")
			else:
				flags["truck_tried"] = true
				flags["car_seen"] = true
				await Dialogue.play("c1_truck_locked")
		"RingDrop": await _take_ring()
		"Grave": await Dialogue.play("c1_grave")
		"Well": await Dialogue.play("c1_well")
		"RosePhotoPt":
			_file("rose_photo", false)
			await _doc_view("rose_photo")
		"StormPhotoPt":
			_file("storm_photo", false)
			await _doc_view("storm_photo")
		"LDesk":
			if flags.get("bible", false):
				await Dialogue.play("c1_desk_empty")
			else:
				flags["bible"] = true
				audio.sfx("drawer_open", -6.0, 0.8)
				await Dialogue.play("c1_bible_found")
				_file("bible_journal", false)
				await _doc_view("bible_journal")
		"LWardrobe":
			if flags.get("lwardrobe", false):
				await Dialogue.play("c1_l_wardrobe_empty")
			else:
				flags["lwardrobe"] = true
				await Dialogue.play("c1_l_wardrobe")
				await _pickup("battery_half", 1)
		"LToilet":
			if flags.get("rosary", false):
				await Dialogue.play("c1_already")
			else:
				flags["rosary"] = true
				_file("rosary", false)
				await _pickup("rosary", 1)
				await _doc_view("rosary")
		"UFridge":
			if flags.get("meds", false):
				await Dialogue.play("c1_fridge_empty")
			else:
				flags["meds"] = true
				await Dialogue.play("c1_fridge_meds")
				await _pickup("medicine", 1)
		"UBed": await Dialogue.play("c1_l_bed")
		"UWindow": await _up_window()
		"USafe": await _open_safe()

func _exit_house() -> void:
	lock(true)
	flags["exited"] = true
	P["FrontDoorExit"].enabled = false
	Dialogue.play("c1_exit_shelf", true, false)
	await _push("Props/Bookshelf", Vector3(0, 0, 1.0), 1.6, Vector3(-2.35, 0, -1.6), 180)
	lock(true)
	audio.sfx("lock_open", -6.0)
	await wait(0.3)
	var fd := map.get_node("Doors/FrontDoor") as Node3D
	create_tween().tween_property(fd, "rotation:y", _door_open_y, 0.5)
	(fd.get_node("Leaf/Col") as StaticBody3D).process_mode = Node.PROCESS_MODE_DISABLED
	audio.sfx("door_slam", -16.0, 1.4)
	_flashlight(true)
	lock(false)

func _roam_tick(delta: float) -> void:
	var p := player.global_position
	if Dialogue.locks_player or _inv_open or _doc_open:
		return
	var mixname := "ch1_after"
	if _in_louis(p):
		mixname = "ch1_louis"
	elif _in_up(p):
		mixname = "ch1_attic"
	elif not _in_norah(p):
		mixname = "ch1_night"
	if audio.preset != mixname:
		audio.mix(mixname, 1.5)
	# screams in the distance while she's outside (never during a beat)
	if mixname == "ch1_night":
		_scream_t -= delta
		if _scream_t <= 0.0:
			_scream_t = randf_range(22.0, 40.0)
			var dir := Vector3(randf_range(-1, 1), 0, randf_range(0.4, 1)).normalized()
			_sfx3d("distant_scream" if randf() < 0.5 else "distant_scream2", p + dir * 30.0 + Vector3(0, 2, 0), 10.0)
	# Louis's stairs: climbing into the stairwell takes her up; stepping into the stairwell upstairs takes her down
	if p.x > 31.9 and p.x < 33.0 and p.z < -4.4 and p.z > -8.4 and (p.y > 1.7 or p.z < -7.3):
		_run_beat(_stairs.bind(true))
		return
	if p.x > 73.45 and p.x < 74.35 and p.z > -2.95 and p.z < -1.95:
		_run_beat(_stairs.bind(false))
		return
	if not flags.get("lporch", false) and p.x > 23.9 and p.x < 27.2 and p.z > -7.6 and p.z < -3.4:
		_run_beat(_louis_porch)
	elif not flags.get("linside", false) and _in_louis(p) and p.z < -7.6:
		_run_beat(_louis_inside)

func _louis_porch() -> void:
	flags["lporch"] = true
	lock(true)
	await wait(0.3)
	await Dialogue.play("c1_louis_door")
	lock(false)

func _louis_inside() -> void:
	flags["linside"] = true
	lock(true)
	_flashlight(true)
	audio.sfx("floor_creak", -14.0, 1.1)
	await Dialogue.play("c1_louis_inside")
	lock(false)

var _tp := 0          ## bumps when she's moved between floors (stops an autoplay walk that was heading somewhere else)

func _stairs(up: bool) -> void:
	lock(true)
	_tp += 1
	audio.sfx("floor_creak", -8.0, 0.9)
	await HUD.fade_out(0.35)
	if up:
		player.place(Vector3(73.9, 0, -3.6), 0)
	else:
		player.place(Vector3(32.42, 1.4, -6.3), 180)
	await wait(0.2)
	await HUD.fade_in(0.35)
	if up and not flags.get("upstairs", false):
		flags["upstairs"] = true
		await Dialogue.play("c1_upstairs")
	lock(false)

func _up_window() -> void:
	lock(true)
	cut("CAM_20")
	audio.level("wind_loop", -4.0, 0.5)
	await wait(0.8)
	await Dialogue.play("c1_l_window_back" if flags.get("up_crash", false) else "c1_l_window")
	audio.level("wind_loop", -10.0, 1.0)
	Cameras.cut_to(null)
	lock(false)

func _open_safe() -> void:
	if flags.get("safe", false):
		await Dialogue.play("c1_already")
		return
	lock(true)
	if not ("safe_code" in keys_found):
		await Dialogue.play("c1_l_safe_locked")
	player.model.play("kneel")
	var ok: bool = await _dial("LOUIS'S SAFE", SAFE_CODE, true)
	player.model.play("idle")
	if ok:
		flags["safe"] = true
		audio.sfx("lock_open", 0.0)
		await Dialogue.play("c1_l_safe_open")
		_key("truck_keys", false)
		await _pickup("__truck_keys", 1)
		_file("step_photo", false)
		await _doc_view("step_photo")
		await Dialogue.play("c1_l_safe_photo")
		_key("safe_code", false)
		await _pickup("ammo", 4)                 # a small box of .38s at the back of the safe
		if stalker.state != "dead":
			await _up_window_crash()
	lock(false)

## Autoplay route through Part 7 (tests and captures).
func _louis_autoplay() -> void:
	var go := func(pts: Array, speed := 2.4) -> void:
		for q in pts:
			while _busy: await get_tree().physics_frame
			await _auto_walk(q, speed)
		while _busy: await get_tree().physics_frame
	var use := func(nm: String) -> void:
		while _busy: await get_tree().physics_frame
		await _run_beat(_roam_use.bind(nm))
	if not flags.get("exited", false):
		await go.call([Vector3(-4.5, 0, 0.8), Vector3(-3.0, 0, -1.0)])
		await use.call("FrontDoorExit")
	await go.call([Vector3(-1.0, 0, -1.0), Vector3(1.0, 0, -0.8), Vector3(2.2, 0, 3.0), Vector3(1.5, 0, 10.0), Vector3(0.6, 0, 15.0)])
	await use.call("CarDoor")
	await go.call([Vector3(1.8, 0, 9.0), Vector3(7.0, 0, 4.0), Vector3(14.0, 0, 3.0), Vector3(21.0, 0, 4.5), Vector3(24.5, 0, 5.8), Vector3(28.5, 0, 5.6), Vector3(30.6, 0, 3.9)], 2.8)
	await use.call("TruckDoor")
	await go.call([Vector3(28.5, 0, 5.6), Vector3(24.5, 0, 5.8), Vector3(25.4, 0, -2.0), Vector3(25.5, 0, -5.4), Vector3(25.5, 0, -7.0), Vector3(25.6, 0, -8.6)])
	await go.call([Vector3(28.0, 0, -9.5), Vector3(31.3, 0, -9.9)]); await use.call("LDesk")
	await go.call([Vector3(27.5, 0, -9.6), Vector3(27.5, 0, -10.9)]); await use.call("RosePhotoPt")
	await go.call([Vector3(25.7, 0, -10.6)]); await use.call("LWardrobe")
	await go.call([Vector3(24.8, 0, -9.0)]); await use.call("StormPhotoPt")
	await go.call([Vector3(28.0, 0, -8.4), Vector3(28.0, 0, -6.8), Vector3(28.4, 0, -5.4)]); await use.call("LToilet")
	await go.call([Vector3(28.0, 0, -6.8), Vector3(28.0, 0, -8.4), Vector3(30.6, 0, -8.4), Vector3(30.7, 0, -3.9), Vector3(32.42, 0, -4.0), Vector3(32.42, 0, -7.6)], 1.8)
	while _busy: await get_tree().physics_frame
	await go.call([Vector3(73.9, 0, -3.4), Vector3(73.9, 0, -5.4), Vector3(72.6, 0, -5.8), Vector3(71.9, 0, -5.75)]); await use.call("UFridge")
	# the bed and the window first: once the safe's open he's in the room with her, and she runs
	await go.call([Vector3(71.6, 0, -5.9), Vector3(70.6, 0, -6.0), Vector3(69.4, 0, -6.0), Vector3(68.4, 0, -5.4)]); await use.call("UBed")
	await use.call("UWindow")
	await go.call([Vector3(69.4, 0, -6.0), Vector3(70.6, 0, -6.0), Vector3(71.6, 0, -5.9), Vector3(73.4, 0, -5.9)]); await use.call("USafe")
	if autoplay:
		_toggle_inventory()
		for tab in [0, 1, 2]:
			_screen.tab = tab
			_screen.cursor = 0
			_screen._refresh()
			await _uwait(1.0)
			if shots: _snap("inv_%s" % TABS[tab])
		_screen.tab = 0
		_screen.cursor = max(0, _screen.rows().map(func(r): return r[0]).find("revolver"))
		_screen._refresh()
		_screen.menu = _screen._actions("revolver")
		await _uwait(0.8)
		if shots: _snap("inv_menu")
		_screen.menu = []
		await _screen._do("inspect", "revolver")
		await _uwait(0.3)
		_inv_close()
	await go.call([Vector3(69.4, 0, -6.0), Vector3(71.6, 0, -5.9), Vector3(73.9, 0, -5.4), Vector3(73.9, 0, -3.8), Vector3(73.9, 0, -2.4)])
	while _busy: await get_tree().physics_frame
	await go.call([Vector3(32.42, 0, -4.2), Vector3(30.7, 0, -4.4), Vector3(30.6, 0, -8.4), Vector3(26.0, 0, -8.6), Vector3(25.5, 0, -7.0), Vector3(25.5, 0, -5.0), Vector3(25.4, 0, -2.0),
		Vector3(26.0, 0, 3.8), Vector3(30.6, 0, 3.9)], 2.8)
	# the edge of the map (she turns back)
	await go.call([Vector3(33.0, 0, 7.6)], 1.8)
	await go.call([Vector3(34.9, 0, 7.6)], 1.8)
	await wait(1.0)
	while _busy: await get_tree().physics_frame
	await go.call([Vector3(30.6, 0, 3.9)])
	await use.call("TruckDoor")

# ================================================================== part 8: the road out, the signs, the turn
func _road_out() -> void:
	checkpoint = "road"
	lock(true)
	_bounds_on = false
	_flashlight(false)
	objective("")
	audio.sfx("car_door", -6.0)
	await HUD.fade_out(0.8)
	player.visible = false
	louis.visible = false
	vehicle = truck
	var tn := truck.get_node("Norah") as CharacterModel
	tn.visible = true
	tn.play("sit_drive_tense")
	for n in ["BeamL", "BeamR", "DashGlow"]: (truck.get_node(n) as Node3D).visible = true
	_car_fill(truck)
	var tc := _truck_interior_cams()
	cut_cam(tc["profile"])
	HUD.fade_in(0.6)
	audio.sfx("starter_fail", -4.0)
	await wait(1.2)
	audio.sfx("engine_start", -4.0)
	await Dialogue.play("c1_car_go", true)
	audio.mix("ch1_leaving", 1.5)
	var fire := map.get_node_or_null("Neighbourhood/HousePruitt/Fire") as Node3D      # the Pruitts' place is burning now
	if fire:
		fire.visible = true
		(fire.get_node("Roar") as AudioStreamPlayer3D).play()
	_follow("road_out")
	var path := _pts(layout["depart"])
	_depart_path = path
	var f_ := [false, false]
	var pruitt := map.get_node_or_null("Neighbourhood/HousePruitt") as Node3D
	await _drive_path(truck, path, func(f: float) -> float: return 3.5 if f < 0.04 else (7.0 if f < 0.2 else 10.5), func(f: float) -> void:
		# the Pruitts': it starts as the burning house comes into view up the road, so the shot and her lines land beside it
		if not f_[0] and pruitt and truck.global_position.distance_to(pruitt.global_position) < 48.0 and truck.global_position.z < pruitt.global_position.z:
			f_[0] = true
			_road_screams()
		if f > 0.9 and not f_[1]:
			f_[1] = true
			HUD.fade_out(1.6))
	await wait(0.4)
	# the highway, driving west toward Kennedy: the signs
	(world.get_node("Highway/CityGlow") as Node3D).visible = true
	truck.global_position = Vector3(215, 0, HZ - 1.6)
	truck.rotation.y = deg_to_rad(90)
	_follow("road_out")
	HUD.fade_in(1.2)
	var drive := create_tween()
	drive.tween_property(truck, "global_position:x", 120.0, 9.0)
	await wait(4.2)
	cut_cam(tc["dash"])
	await _play_cut("c1_sign", {"sign": "R2_Sign", "norah": tc["profile"]})
	if drive.is_running(): await drive.finished
	cut("R2_Sign")
	var d2 := create_tween()
	d2.tween_property(truck, "global_position:x", 66.0, 5.4)
	await wait(1.2)
	await Dialogue.play("c1_signs_more", true)
	if d2.is_running(): await d2.finished
	_follow("road_out")
	var d3 := create_tween()
	d3.tween_property(truck, "global_position:x", 48.5, 2.8).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	await d3.finished
	audio.level("engine_loop", -16.0, 0.8)
	cut("R3_Junction")
	await wait(1.6)
	await _play_cut("c1_turn", {"0": tc["dash"], "1": tc["profile"]})
	cut("R4_Ravine")
	audio.level("engine_loop", -10.0, 0.6)
	var turn := create_tween()
	turn.tween_property(truck, "global_position", Vector3(41.0, 0, HZ - 6.5), 2.4).set_trans(Tween.TRANS_SINE)
	turn.parallel().tween_property(truck, "rotation:y", 0.0, 2.4).set_trans(Tween.TRANS_SINE)
	await turn.finished
	var down := create_tween()
	down.tween_property(truck, "global_position", Vector3(40.4, 0, HZ - 22.0), 3.2)
	await wait(2.0)
	cut("R5_Taillights")
	await down.finished
	var away := create_tween()
	away.tween_property(truck, "global_position", Vector3(36.0, 0, HZ - 44.0), 5.0)
	await wait(3.0)
	HUD.fade_out(2.0)
	audio.level("engine_loop", -40.0, 2.5)
	await wait(2.4)
	_follow("")

## A look at the Pruitts' house going up, from the side of the road.
func _fire_shot(h: Node3D) -> void:
	if h == null: return
	if _fire_cam == null:
		_fire_cam = Camera3D.new()
		_fire_cam.fov = 50.0
		_fire_cam.environment = load("res://environments/env_norah_yard.tres")
		world.add_child(_fire_cam)
	# from the roadside, a dozen-odd metres off the burning house, looking up at it, from wherever there's a clear
	# line to it (trees and the other houses are in the way from most of the road)
	var to_road := truck.global_position - h.global_position
	to_road.y = 0.0
	to_road = to_road.normalized()
	var aim := h.global_position + Vector3(0, 3.0, 0)
	var space := truck.get_world_3d().direct_space_state
	var best := h.global_position + to_road * 15.0 + Vector3(0, 2.2, 0)
	var found := false
	# the trees have no collision, so a ray can't see them: stand on the road itself (always clear), at the
	# point of the drive nearest the house, a little short of it so the truck comes through the frame
	if _depart_path.size() > 1:
		var bi := 0
		for i in _depart_path.size():
			if _depart_path[i].distance_to(h.global_position) < _depart_path[bi].distance_to(h.global_position): bi = i
		var on_road: Vector3 = _depart_path[bi]
		if bi > 0: on_road = _depart_path[bi].lerp(_depart_path[bi - 1], 0.35)
		best = on_road + Vector3(0, 2.3, 0)
		found = true
	for dist in ([] if found else [14.0, 11.0, 17.0, 9.0]):
		for ang in [0.0, 20.0, -20.0, 40.0, -40.0, 60.0, -60.0]:
			var p: Vector3 = h.global_position + to_road.rotated(Vector3.UP, deg_to_rad(ang)) * dist + Vector3(0, 2.2, 0)
			var q := PhysicsRayQueryParameters3D.create(p, aim, 1)
			var hit := space.intersect_ray(q)
			if hit.is_empty() or (hit["collider"] as Node).get_parent() == h or h.is_ancestor_of(hit["collider"] as Node):
				best = p
				found = true
				break
		if found: break
	_fire_cam.global_position = best
	_fire_cam.look_at(aim, Vector3.UP)
	_follow_mode = ""
	Cameras.cut_to(_fire_cam)

var _fire_cam: Camera3D
var _depart_path := PackedVector3Array()

func _road_screams() -> void:
	var h := map.get_node_or_null("Neighbourhood/HousePruitt") as Node3D
	var at := h.global_position if h else truck.global_position + Vector3(14, 0, 0)
	_sfx3d("distant_scream", at + Vector3(0, 1.5, 0), 10.0)
	await wait(0.6)
	_fire_shot(h)
	await wait(1.8)
	var tc := _truck_interior_cams()
	await _play_cut("c1_screams", {"1": tc["profile"]})     # "That's the Pruitts' place-" over the flames; then her
	_sfx3d("distant_scream2", at + Vector3(0, 1.5, 4), 8.0)
	_follow("road_out")

# ================================================================== searching (the map notes: what's in each drawer)
func _enable_search(on: bool) -> void:
	for nm in ["NorahDresser", "AddieWardrobe", "AddieDresser", "CounterFlash", "CounterBatt"]:
		if not flags.get("searched_" + nm, false):
			P[nm].enabled = on
	if flags.get("wardrobe", false) and not flags.get("searched_WardrobeSearch", false):
		P["WardrobeSearch"].enabled = on

const SEARCH := {"NorahDresser": ["batteries", 1], "AddieDresser": ["ammo", 2], "WardrobeSearch": ["ammo", 5], "CounterFlash": ["flashlight_dead", 1],
	"CounterBatt": ["batteries", 1], "AddieWardrobe": ["", 0]}

func _search(nm: String) -> void:
	if flags.get("searched_" + nm, false):
		await Dialogue.play("c1_already")
		return
	flags["searched_" + nm] = true
	P[nm].enabled = false
	var was := player.control_locked
	lock(true)
	var pt := P[nm] as Node3D
	var to := pt.global_position - player.global_position
	player.rotation.y = atan2(-to.x, -to.z)
	player.model.play("search_low" if pt.global_position.y - player.global_position.y < 0.65 else "search", 0.2)
	audio.sfx("drawer_open", -4.0)
	await wait(1.3)
	audio.sfx("drawer_open", -12.0, 1.3)
	await wait(0.5)
	player.model.play(player.idle_anim, 0.25)
	var it: Array = SEARCH[nm]
	if it[0] == "":
		await Dialogue.play("c1_nothing")
	elif it[0] == "flashlight_dead" and inv.has("flashlight"):
		await Dialogue.play("c1_nothing")
	else:
		await _pickup(it[0], it[1])
	lock(was)

# ================================================================== interactions
func _on_point(nm: String) -> void:
	var looks := {"PhotoSchool": "photo_school", "PhotoLake": "photo_lake", "PhotoBirthday": "photo_birthday", "PhotoBaby": "photo_christmas",
		"Fridge": "fridge", "CalendarPt": "calendar", "JournalPt": "journal"}
	used_point.emit(nm)
	if _busy and _roaming:
		return
	if looks.has(nm):
		var f: String = looks[nm]
		var first := not (f in files_found)
		_file(f, false)
		await _doc_view(f)
		if nm in ["JournalPt", "CalendarPt"]:
			_key("lockbox_code", first)
		return
	if nm == "AddieBed":
		await Dialogue.play("c1_addie_bed")
	elif nm == "TVPt" and not flags.get("tv_on", false):
		await Dialogue.play("c1_tv_off")
	elif SEARCH.has(nm) and not autoplay:
		await _search(nm)

func use_point(nm: String, auto_path: Array = []) -> void:
	var it: Interactable = P[nm]
	it.enabled = true
	if autoplay:
		for p in auto_path:
			await _auto_walk(p)
	else:
		while not dead:
			var got: String = await used_point
			if got == nm:
				break
	it.enabled = false

func _push(path: String, offset: Vector3, time: float, stand: Vector3, face_deg: float) -> void:
	lock(true)
	player.place(stand, face_deg)
	player.model.play("push")
	audio.sfx("wardrobe_scrape", -4.0, 1.1)
	await _move_by(path, offset, time)
	player.model.play("idle")
	lock(false)

## Barricading: the furniture only moves while you hammer E. Every press shoves it a little further; stop and it
## slides back a touch. A bar at the bottom of the screen shows how far it's gone.
func _mash_push(path: String, offset: Vector3, stand: Vector3, face_deg: float, break_at := 1.0, on_prog := Callable()) -> void:
	lock(true)
	player.place(stand, face_deg)
	player.model.play("push", 0.1, 0.0)
	var n := map.get_node(path) as Node3D
	var start := n.position
	var p0 := player.global_position
	var pc := _side_cam(p0, n.global_position, offset)
	cut_cam(pc)
	var prog := 0.0
	var scrape_t := 0.0
	while prog < 1.0 and not dead:
		await get_tree().process_frame
		var dt := get_process_delta_time()
		scrape_t -= dt
		var pressed := Input.is_action_just_pressed("interact") or (autoplay and fmod(_clock, 0.16) < dt)
		if _push_jam > 0.0:
			_push_jam -= dt
			pressed = false
		elif pressed:
			prog = minf(1.0, prog + 0.085)
			player.model.play("push", 0.05, 1.6)
			Cameras.shake(0.03, 0.12)
			if scrape_t <= 0.0:
				scrape_t = 0.22
				audio.sfx("wardrobe_scrape", -6.0, randf_range(1.0, 1.25))
		elif _push_jam <= 0.0:
			prog = maxf(0.0, prog - dt * 0.07)
		n.position = start + offset * prog
		player.global_position = p0 + offset * prog
		HUD.show_meter("PUSH!  Tap it, fast", prog)
		if on_prog.is_valid(): on_prog.call(prog)
		if prog >= break_at:              # interrupted: whoever called takes it from here, camera and all
			HUD.show_meter("", -1)
			_push_cam = pc
			return
	HUD.show_meter("", -1)
	n.position = start + offset
	player.model.play("idle")
	Cameras.cut_to(null)
	if is_instance_valid(pc): pc.queue_free()
	lock(false)

## A camera off to the side of a push, so both Norah and the furniture she's shoving are in shot: whichever side
## has more room, pulled in where a wall is in the way.
func _side_cam(her: Vector3, thing: Vector3, push: Vector3) -> Camera3D:
	var c := Camera3D.new()
	world.add_child(c)
	var dir := push; dir.y = 0.0
	dir = dir.normalized() if dir.length() > 0.01 else -player.global_transform.basis.z
	var side := dir.cross(Vector3.UP).normalized()
	var mid := (her + thing) * 0.5 + Vector3(0, 1.0, 0)
	var space := player.get_world_3d().direct_space_state
	var best := mid + side * 0.8
	var best_d := -1.0
	for sgn in [1.0, -1.0]:
		var want: Vector3 = mid + side * sgn * 2.3 - dir * 0.7 + Vector3(0, 0.45, 0)
		var q := PhysicsRayQueryParameters3D.create(mid, want, 1)
		var hit := space.intersect_ray(q)
		var got: Vector3 = want if hit.is_empty() else mid + (hit["position"] - mid) * 0.85
		var dd := got.distance_to(mid)
		if dd > best_d:
			best_d = dd
			best = got
	c.global_position = best
	c.look_at(mid + dir * 0.3 - Vector3(0, 0.15, 0), Vector3.UP)
	c.fov = 62.0
	if Cameras.current and Cameras.current.environment: c.environment = Cameras.current.environment
	return c

func _move_by(path: String, offset: Vector3, time: float) -> void:
	var n := map.get_node(path) as Node3D
	if time <= 0.0:
		n.position += offset
		return
	var t := create_tween()
	t.tween_property(n, "position", n.position + offset, time).set_trans(Tween.TRANS_SINE)
	await t.finished

## A combination dial (the lockbox, Louis's safe): three brass tumblers. Left/Right picks one, Up/Down turns it,
## E tries it. The mouse works too: click a tumbler's top or bottom half to turn it, click OPEN to try it.
func _dial(title_text: String, code: Array, cancellable: bool) -> bool:
	var st := {"digits": [0, 0, 0], "sel": 0, "shake": 0.0, "roll": [0.0, 0.0, 0.0]}
	var o := Control.new()
	o.size = Vector2(HUD.W, HUD.H)
	o.mouse_filter = Control.MOUSE_FILTER_IGNORE
	HUD.root.add_child(o)
	var R := Rect2(140, 92, 200, 150)                    # the panel
	var wheel := func(i: int) -> Rect2: return Rect2(R.position.x + 28 + i * 52, R.position.y + 34, 40, 66)
	var open_r := Rect2(R.position.x + R.size.x - 70, R.position.y + R.size.y - 26, 58, 16)
	o.draw.connect(func():
		var f: Font = HUD.MONO
		var sx: float = sin(Time.get_ticks_msec() * 0.06) * 4.0 * st.shake
		var r := Rect2(R.position + Vector2(sx, 0), R.size)
		o.draw_rect(Rect2(0, 0, HUD.W, HUD.H), Color(0, 0, 0, 0.55))
		o.draw_rect(r.grow(3), Color(0, 0, 0, 0.6))
		o.draw_rect(r, Color(0.075, 0.07, 0.06))
		o.draw_rect(r, Color(0.55, 0.45, 0.28), false, 2.0)
		o.draw_string(HUD.SERIF, r.position + Vector2(12, 18), title_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Color(0.85, 0.62, 0.3))
		for i in 3:
			var w: Rect2 = wheel.call(i)
			w.position.x += sx
			var on: bool = i == st.sel
			o.draw_rect(w, Color(0.16, 0.12, 0.07))
			for k in range(6):                          # brass ridges
				var t := float(k) / 5.0
				o.draw_rect(Rect2(w.position.x + 2, w.position.y + 2 + t * (w.size.y - 6), w.size.x - 4, 2), Color(0.33, 0.25, 0.12, 0.6))
			var d: int = st.digits[i]
			var roll: float = st.roll[i]
			for j in [-1, 0, 1]:
				var v: int = (d + int(j) + 10) % 10
				var y: float = w.position.y + w.size.y * 0.5 + (float(j) + roll) * 21.0
				if y < w.position.y + 4 or y > w.end.y - 2: continue
				var col := Color(0.98, 0.84, 0.45) if (j == 0 and on) else (Color(0.8, 0.74, 0.6) if j == 0 else Color(0.5, 0.44, 0.34, 0.6))
				var sz := 22 if j == 0 else 14
				o.draw_string(f, Vector2(w.position.x + w.size.x * 0.5 - sz * 0.3, y + sz * 0.35), str(v), HORIZONTAL_ALIGNMENT_LEFT, -1, sz, col)
			o.draw_rect(Rect2(w.position.x, w.position.y + w.size.y * 0.5 - 13, w.size.x, 26), Color(1, 1, 1, 0.04))
			o.draw_rect(w, Color(0.95, 0.8, 0.42) if on else Color(0.3, 0.26, 0.18), false, 2.0 if on else 1.0)
			if on:
				var cx := w.position.x + w.size.x * 0.5
				o.draw_colored_polygon(PackedVector2Array([Vector2(cx - 5, w.position.y - 4), Vector2(cx + 5, w.position.y - 4), Vector2(cx, w.position.y - 10)]), Color(0.95, 0.8, 0.42))
				o.draw_colored_polygon(PackedVector2Array([Vector2(cx - 5, w.end.y + 4), Vector2(cx + 5, w.end.y + 4), Vector2(cx, w.end.y + 10)]), Color(0.95, 0.8, 0.42))
		var orr := Rect2(open_r.position + Vector2(sx, 0), open_r.size)
		o.draw_rect(orr, Color(0.35, 0.16, 0.08))
		o.draw_rect(orr, Color(0.85, 0.5, 0.28), false, 1.0)
		o.draw_string(f, orr.position + Vector2(10, 12), "OPEN  E", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, Color(0.98, 0.86, 0.6))
		o.draw_string(f, r.position + Vector2(12, r.size.y - 14), "Arrows: pick, turn", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color(0.6, 0.58, 0.5))
		if cancellable: o.draw_string(f, r.position + Vector2(12, r.size.y - 4), "Esc: back", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color(0.6, 0.58, 0.5)))
	var turn := func(i: int, by: int) -> void:
		st.digits[i] = (st.digits[i] + by + 10) % 10
		st.roll[i] = float(by)                           # rolls in from that side
		audio.sfx("dial_click", -6.0, 1.0 + 0.05 * by)
	var auto_t := 0.0
	var opened := false
	var lmb := true
	_doc_open = true
	_ui_hold(true)
	while not dead:
		var dt := get_process_delta_time()
		for i in 3: st.roll[i] = move_toward(st.roll[i], 0.0, dt * 8.0)
		st.shake = move_toward(st.shake, 0.0, dt * 2.5)
		o.queue_redraw()
		await get_tree().process_frame
		if autoplay:
			auto_t += get_process_delta_time()
			if auto_t > 0.3:
				auto_t = 0.0
				if st.digits[st.sel] != code[st.sel]:
					turn.call(st.sel, 1)
				elif st.sel < 2:
					st.sel += 1
				else:
					opened = true
					break
			continue
		var click := false
		var now := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
		if now and not lmb: click = true
		lmb = now
		var m := o.get_local_mouse_position()
		if click:
			for i in 3:
				var w: Rect2 = wheel.call(i)
				if w.grow(6).has_point(m):
					st.sel = i
					turn.call(i, 1 if m.y < w.get_center().y else -1)
			if open_r.has_point(m):
				click = false
				if st.digits == code:
					opened = true
					break
				st.shake = 1.0
				audio.sfx("door_rattle", -12.0, 1.6)
		if Input.is_action_just_pressed("move_left"): st.sel = (st.sel + 2) % 3; audio.sfx("ui_blip", -16.0, 1.2)
		if Input.is_action_just_pressed("move_right"): st.sel = (st.sel + 1) % 3; audio.sfx("ui_blip", -16.0, 1.2)
		if Input.is_action_just_pressed("move_forward"): turn.call(st.sel, 1)
		if Input.is_action_just_pressed("move_back"): turn.call(st.sel, -1)
		if cancellable and (Input.is_action_just_pressed("inventory") or Input.is_action_just_pressed("menu_back")):
			break
		if Input.is_action_just_pressed("interact"):
			if st.digits == code:
				opened = true
				break
			st.shake = 1.0
			audio.sfx("door_rattle", -12.0, 1.6)
			o.visible = false
			await Dialogue.play("c1_lockbox_wrong" if code == LOCK_CODE else "c1_l_safe_wrong", true)
			o.visible = true
	if opened:
		await _uwait(0.3)                                # a beat on the right numbers before it opens
	o.queue_free()
	_doc_open = false
	_ui_hold(false)
	return opened

# ------------------------------------------------------------------ the document viewer (Resident Evil style): pictures and pages, full screen
func _overlay() -> Control:
	var o := Control.new()
	o.size = Vector2(HUD.W, HUD.H)
	o.mouse_filter = Control.MOUSE_FILTER_IGNORE
	HUD.root.add_child(o)
	var bg := ColorRect.new()
	bg.color = Color(0.015, 0.015, 0.02, 0.93)
	bg.size = o.size
	o.add_child(bg)
	return o

func _ol_label(o: Control, t: String, pos: Vector2, size: int, col: Color, font: Font = null) -> Label:
	var l := Label.new()
	l.text = t
	l.position = pos
	l.add_theme_font_override("font", font if font else HUD.MONO)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 1)
	o.add_child(l)
	return l

## Word-wraps a label at a fixed width (the text has to be set after the wrap, or Godot keeps the one-line width).
func _wrap(l: Label, sz: Vector2) -> void:
	var t := l.text
	l.text = ""
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(sz.x, 0)
	l.size = sz
	l.text = t

func _ol_image(o: Control, path: String, rect: Rect2) -> void:
	var tr := TextureRect.new()
	tr.texture = load("res://assets/textures/%s.png" % path)
	tr.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tr.position = rect.position
	tr.size = rect.size
	o.add_child(tr)

func _file_pages(id: String) -> Array:
	var f: Dictionary = FILE_DB[id]
	if f.has("text"): return f["text"]
	var out := []
	for l in Dialogue.conversations.get(f.get("conv", ""), []):
		var t: String = l.get("text", "")
		if t != "" and t != "...": out.append(t)
	return out

## Shows a found picture or document full-screen; pages turn with Left/Right (or E), E on the last page closes.
func _doc_view(id: String) -> void:
	var f: Dictionary = FILE_DB[id]
	var pages := _file_pages(id)
	var page := 0
	_lmb = true          # the click that opened it doesn't also close it
	_doc_open = true
	_ui_hold(true)
	var was_locked := player.control_locked
	player.control_locked = true
	audio.sfx("drawer_open", -14.0, 1.6)
	var auto_t := 0.0
	var dirty := true
	var o: Control = null
	while not dead:
		if dirty:
			dirty = false
			if o: o.queue_free()
			o = _overlay()
			var t := _ol_label(o, f["title"], Vector2(0, 14), 13, Color(0.95, 0.82, 0.5), HUD.SERIF)
			t.size = Vector2(HUD.W, 20)
			t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			var has_img := f.has("image")
			var long := pages.size() > 2 or id in ["journal", "bible_journal", "broadcast"]
			var body_rect := Rect2(40, 250, 400, 70)
			if has_img and long:
				_ol_image(o, f["image"], Rect2(24, 44, 200, 260))
				body_rect = Rect2(240, 70, 220, 220)
			elif has_img:
				_ol_image(o, f["image"], Rect2(110, 36, 260, 172))
				body_rect = Rect2(40, 216, 400, 110)
			else:
				body_rect = Rect2(60, 70, 360, 220)
			var shown := pages if not long else pages.slice(page, page + 1)
			var b := _ol_label(o, "\n\n".join(shown), body_rect.position, 11, Color(0.9, 0.88, 0.82))
			_wrap(b, body_rect.size)
			if long and pages.size() > 1:
				_ol_label(o, "Page %d / %d" % [page + 1, pages.size()], Vector2(body_rect.position.x, 300), 9, Color(0.6, 0.6, 0.55))
			var hint := ("Left/Right: turn the page    " if long and pages.size() > 1 else "") + "E: " + ("next" if long and page < pages.size() - 1 else "close")
			var h := _ol_label(o, hint, Vector2(0, 334), 9, Color(0.7, 0.7, 0.64))
			h.size = Vector2(HUD.W, 14)
			h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			if id == "bible_journal" and page >= 2:
				_key("safe_code")
			if shots and page == 0: _snap("doc_" + id)
			if not long:
				page = pages.size() - 1
		await get_tree().process_frame
		if autoplay:
			auto_t += get_process_delta_time()
			if auto_t > 0.7:
				auto_t = 0.0
				if page < pages.size() - 1:
					page += 1
					dirty = true
				else:
					break
			continue
		if Input.is_action_just_pressed("move_left") and page > 0:
			page -= 1
			dirty = true
		elif (Input.is_action_just_pressed("move_right") or Input.is_action_just_pressed("interact")) and page < pages.size() - 1:
			page += 1
			dirty = true
			audio.sfx("ui_blip", -14.0, 1.3)
		elif Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("inventory") or Input.is_action_just_pressed("menu_back") or _click():
			break
	if o: o.queue_free()
	_doc_open = false
	_ui_hold(false)
	player.control_locked = was_locked
	Dialogue.ended_msec = Time.get_ticks_msec()

## An item picked up: its picture large, the name and what it is. "__truck_keys" for the keys.
func _pickup(item: String, count: int, extra := "") -> void:
	var name_: String
	var desc: String
	var img: String
	if item == "__truck_keys":
		name_ = "Truck keys"
		desc = "A ring of keys on a red fob."
		img = "item_truck_keys"
	else:
		inv[item] = inv.get(item, 0) + count
		name_ = ITEM_DB[item][0]
		desc = ITEM_DB[item][1]
		img = ITEM_DB[item][2]
	audio.sfx("item_get", -8.0)
	_doc_open = true
	_ui_hold(true)
	var was_locked := player.control_locked
	player.control_locked = true
	var o := _overlay()
	var mkey := "truck_keys" if item == "__truck_keys" else item
	var viewer: ItemViewer = null
	if ItemModels.has(mkey):
		viewer = _item_viewer(o, mkey, {}, Rect2(110, 34, 260, 200), not autoplay)
		var ex: String = ItemModels.item(mkey).get("examine", "")
		if ex != "": extra = ex if extra == "" else extra + "\n" + ex
	else:
		_ol_image(o, "docs/" + img, Rect2(120, 50, 240, 180))
	var t := _ol_label(o, ("Picked up: %s" % name_) + (("  x%d" % count) if count > 1 else ""), Vector2(0, 246), 13, Color(0.95, 0.85, 0.55), HUD.SERIF)
	t.size = Vector2(HUD.W, 20)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var d := _ol_label(o, desc + ("\n" + extra if extra != "" else ""), Vector2(60, 272), 10, Color(0.86, 0.84, 0.78))
	_wrap(d, Vector2(360, 40))
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var hint := "E: continue"
	if viewer:
		hint = "Arrows: turn it   Shift+Up/Down: closer   " + ("X: look closer   " if viewer.has_examine_points() else "") + "E: continue"
	var h := _ol_label(o, hint, Vector2(0, 334), 9, Color(0.7, 0.7, 0.64))
	h.size = Vector2(HUD.W, 14)
	h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if autoplay and viewer and viewer.has_examine_points():
		await _uwait(0.5)
		viewer.next_point()
		await _uwait(1.0)
	if shots: _snap("pickup_" + item)
	await _wait_confirm(0.8)
	o.queue_free()
	_doc_open = false
	_ui_hold(false)
	player.control_locked = was_locked
	Dialogue.ended_msec = Time.get_ticks_msec()

## A fresh left click (documents and pickup cards close on a click too).
var _lmb := false
func _click() -> bool:
	var now := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var hit := now and not _lmb
	_lmb = now
	return hit

func _wait_confirm(auto_secs: float) -> void:
	_lmb = true
	await get_tree().process_frame
	await get_tree().process_frame
	var t := 0.0
	while not dead:
		await get_tree().process_frame
		t += get_process_delta_time()
		if autoplay and t > auto_secs: break
		if not autoplay and t > 0.25 and (Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("menu_back") or _click()): break

# ------------------------------------------------------------------ the items screen: ITEMS / KEYS / FILES
const TABS := ["ITEMS", "KEYS", "FILES"]
var _screen: ItemsScreen
var _hold := 0

## The game stops while a menu, a document or a pickup is up (Resident Evil style). Nested holds are counted.
func _ui_hold(on: bool) -> void:
	_hold = maxi(0, _hold + (1 if on else -1))
	var p := _hold > 0
	if get_tree().paused != p:
		get_tree().paused = p
	HUD.menu_mode(p)
	if p and DisplayServer.get_name() != "headless":
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

## A wait that keeps counting while the game is paused (for menus and overlays).
func _uwait(t: float) -> void:
	var end := Time.get_ticks_msec() + int(t * 1000.0)
	while Time.get_ticks_msec() < end and not dead:
		await get_tree().process_frame

## Feedback from using or combining things: on the items screen while it's open, a caption otherwise.
func _say(t: String, col := Color(0.9, 0.9, 0.85), secs := 2.4) -> void:
	if _screen: _screen.say(t, col, secs + 1.0)
	else: HUD.caption(t, "", col, secs)

func _toggle_inventory() -> void:
	if _inv_open:
		_inv_close()
		return
	_inv_open = true
	player.control_locked = true
	_ui_hold(true)
	_screen = ItemsScreen.new(self)
	HUD.root.add_child(_screen)
	_screen.closed.connect(_inv_close)
	audio.sfx("ui_blip", -10.0)
	_inv_loop()

func _inv_close() -> void:
	if not _inv_open: return
	_inv_open = false
	if _screen:
		_screen.queue_free()
		_screen = null
	_ui_hold(false)
	player.control_locked = false
	audio.sfx("ui_blip", -12.0, 0.8)
	Dialogue.ended_msec = Time.get_ticks_msec()

func _inv_loop() -> void:
	await get_tree().process_frame
	while _inv_open and _screen and not dead:
		_screen.step()
		await get_tree().process_frame

## The 3D model for a row of the items screen: [model key, part overrides], or [] if there isn't one.
var _photo_tex := {}
func _model_for(tab: String, id: String) -> Array:
	match tab:
		"ITEMS", "KEYS":
			if ItemModels.has(id): return [id, {}]
		"FILES":
			if id == "journal" or id == "rosary": return [id, {}] if ItemModels.has(id) else []
			if id == "bible_journal" and ItemModels.has("journal"):
				return ["journal", {"Cover": {"t": "b:Black leather"}, "Strap": {"t": "b:Black leather"}}]
			if id.contains("photo") and FILE_DB[id].has("image") and ItemModels.has("photo"):
				if not _photo_tex.has(id):
					_photo_tex[id] = ItemModels.photo_print("res://assets/textures/%s.png" % FILE_DB[id]["image"])
				if _photo_tex[id]: return ["photo", {"Print": {"tex": _photo_tex[id]}}]
	return []

func _item_viewer(parent: Control, k: String, ov: Dictionary, rect: Rect2, interactive: bool) -> ItemViewer:
	var v := ItemViewer.new()
	v.position = rect.position
	v.size = rect.size
	v.interactive = interactive
	parent.add_child(v)
	v.show_item(k, ov)
	return v

## Turning an item over in her hands: the full-screen 3D view (X in the items screen).
func _inspect(k: String, ov: Dictionary, title: String, desc: String) -> void:
	_doc_open = true
	_ui_hold(true)
	audio.sfx("drawer_open", -18.0, 1.8)
	var o := _overlay()
	var t := _ol_label(o, title, Vector2(0, 10), 13, Color(0.95, 0.85, 0.55), HUD.SERIF)
	t.size = Vector2(HUD.W, 20)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var v := _item_viewer(o, k, ov, Rect2(60, 32, 360, 248), not autoplay)
	if desc != "":
		var d := _ol_label(o, desc, Vector2(60, 286), 9, Color(0.86, 0.84, 0.78))
		_wrap(d, Vector2(360, 36))
		d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var h := _ol_label(o, "Arrows: turn it   Shift+Up/Down: closer   " + ("X: look closer   " if v.has_examine_points() else "") + "E / Tab: back",
		Vector2(0, 334), 9, Color(0.7, 0.7, 0.64))
	h.size = Vector2(HUD.W, 14)
	h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var tt := 0.0
	var shown := false
	var snapped := false
	while not dead:
		await get_tree().process_frame
		tt += get_process_delta_time()
		if autoplay:
			if tt > 0.9 and not shown:
				shown = true
				v.next_point()
			if tt > 1.9 and shots and not snapped:
				snapped = true
				_snap("inspect_" + k)
			if tt > 3.2: break
		elif tt > 0.25 and (Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("inventory") or Input.is_action_just_pressed("menu_back")):
			break
	o.queue_free()
	_doc_open = false
	_ui_hold(false)

## The Item Modeler export is the source for item names and descriptions.
func _sync_item_text() -> void:
	for db in [ITEM_DB, KEY_DB]:
		for k in db.keys():
			var it := ItemModels.item(k)
			if it.is_empty(): continue
			if String(it.get("name", "")) != "": db[k][0] = it["name"]
			if String(it.get("desc", "")) != "": db[k][1] = it["desc"]

func _file(id: String, announce := true) -> void:
	if id in files_found:
		return
	files_found.append(id)
	if announce:
		HUD.caption("Added to FILES: %s" % FILE_DB[id]["title"], "", Color(0.7, 0.78, 0.9), 2.4)

func _key(id: String, announce := true) -> void:
	if id in keys_found:
		return
	keys_found.append(id)
	if announce:
		HUD.caption("Added to KEYS: %s" % KEY_DB[id][0], "", Color(0.7, 0.78, 0.9), 2.4)

func _use_medicine() -> void:
	if combat.health >= combat.max_health - 1.0:
		_say("She's not hurt enough to need them.", Color(0.8, 0.8, 0.75), 2.0)
		return
	inv["medicine"] -= 1
	if inv["medicine"] <= 0: inv.erase("medicine")
	combat.heal(35.0)
	audio.sfx("item_get", -10.0, 0.8)
	_say("She dry-swallows two of the pills. (%s)" % combat.condition(), Color(0.8, 0.9, 0.75), 2.4)

func _combine(a: String, b: String) -> void:
	var pair := [a, b]
	pair.sort()
	if pair == ["batteries", "flashlight_dead"] or pair == ["battery_half", "flashlight_dead"]:
		inv.erase("flashlight_dead")
		_take(pair[0])
		inv["flashlight"] = 1
		light_charge = 100.0 if pair[0] == "batteries" else 50.0
		audio.sfx("item_get", -8.0)
		_say("The flashlight works.", Color(0.95, 0.85, 0.55), 2.4)
		Dialogue.play("c1_light_works", true, false)
	elif pair == ["batteries", "flashlight"] or pair == ["battery_half", "flashlight"]:
		var add := 100.0 if "batteries" in pair else 50.0
		_take("batteries" if "batteries" in pair else "battery_half")
		light_charge = minf(100.0, light_charge + add)
		audio.sfx("gun_cock", -10.0, 1.4)
		_say("Flashlight: %d%%." % int(light_charge), Color(0.95, 0.85, 0.55), 2.0)
		if checkpoint == "louis": _flashlight(true)
	elif pair == ["ammo", "revolver"]:
		var k: int = min(5 - loaded, inv["ammo"])
		if k <= 0:
			_say("The revolver is already full.", Color(0.8, 0.8, 0.75), 2.0)
			return
		loaded += k
		_take("ammo", k)
		audio.sfx("gun_cock", -6.0)
		_say("Loaded %d. %d / 5 in the cylinder." % [k, loaded], Color(0.95, 0.85, 0.55), 2.4)
	else:
		_say("These don't go together.", Color(0.85, 0.6, 0.5), 2.0)

func _take(item: String, n := 1) -> void:
	inv[item] = inv.get(item, 0) - n
	if inv[item] <= 0: inv.erase(item)

# ================================================================== the TV: the broadcast on the screen itself
func _tv_on(animated: bool) -> void:
	flags["tv_on"] = true
	var scr := map.get_node("Props/TV/Screen") as MeshInstance3D
	if tv_vp == null:
		tv_vp = SubViewport.new()
		tv_vp.size = Vector2i(160, 120)
		tv_vp.transparent_bg = false
		tv_vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		add_child(tv_vp)
		var bg := ColorRect.new()
		bg.color = Color(0.02, 0.03, 0.12)
		bg.size = Vector2(160, 120)
		tv_vp.add_child(bg)
		var band := ColorRect.new()
		band.color = Color(0.75, 0.06, 0.04)
		band.size = Vector2(160, 18)
		tv_vp.add_child(band)
		var hd := Label.new()
		hd.text = "EMERGENCY ALERT SYSTEM"
		hd.add_theme_font_override("font", HUD.MONO)
		hd.add_theme_font_size_override("font_size", 9)
		hd.add_theme_color_override("font_color", Color(1, 0.95, 0.9))
		hd.position = Vector2(6, 3)
		tv_vp.add_child(hd)
		tv_label = Label.new()
		tv_label.add_theme_font_override("font", HUD.MONO)
		tv_label.add_theme_font_size_override("font_size", 9)
		tv_label.add_theme_color_override("font_color", Color(0.95, 0.95, 0.9))
		tv_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		tv_label.position = Vector2(6, 24)
		tv_label.size = Vector2(148, 90)
		tv_label.text = "STAND BY"
		tv_vp.add_child(tv_label)
		var scan := ColorRect.new()       # scanline flicker
		scan.color = Color(1, 1, 1, 0.05)
		scan.size = Vector2(160, 2)
		scan.name = "Scan"
		tv_vp.add_child(scan)
		var q := MeshInstance3D.new()
		var qm := QuadMesh.new()
		qm.size = Vector2(0.48, 0.34)
		q.mesh = qm
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.albedo_texture = tv_vp.get_texture()
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
		q.material_override = m
		scr.add_child(q)
		q.position = Vector3(0, 0, 0.008)
		var glow := OmniLight3D.new()
		glow.light_color = Color(0.5, 0.55, 1.0)
		glow.light_energy = 1.2
		glow.omni_range = 4.5
		scr.add_child(glow)
		glow.position = Vector3(0, 0, 0.6)
	if animated:
		audio.sfx("tv_on", 0.0)
	# the siren: loops from the TV itself, and keeps going after the broadcast ends
	if siren == null:
		siren = _loop3d("eas_tones", -6.0)
		siren.unit_size = 4.0
		siren.global_position = scr.global_position
		siren.play()
	audio.level("tv_static_loop", -26.0, 0.5)

func _tv_camera() -> Camera3D:
	var scr := map.get_node("Props/TV/Screen") as Node3D
	var c := Camera3D.new()
	c.fov = 50.0
	c.environment = load("res://environments/env_norah_house.tres")
	world.add_child(c)
	var n := scr.global_transform.basis.z.normalized()
	c.global_position = scr.global_position + n * 0.62 + Vector3(0, 0.16, 0)
	c.look_at(scr.global_position, Vector3.UP)
	return c

func _broadcast() -> void:
	var lines: Array = Dialogue.conversations["c1_broadcast"]
	for l in lines:
		var t: String = l["text"]
		tv_label.text = ""
		for i in t.length():
			tv_label.text = t.substr(0, i + 1)
			if i % 3 == 0: audio.sfx("ui_blip", -24.0, 0.7)
			await wait(0.025)
		if shots: _snap("tv")
		var hold := 0.0
		while not dead:
			await get_tree().process_frame
			hold += get_process_delta_time()
			if autoplay and hold > 0.8: break
			if not autoplay and (hold > 3.4 or (hold > 0.4 and Input.is_action_just_pressed("interact"))): break
	tv_label.text = "REMAIN INDOORS.\n\nLOCK ALL DOORS AND WINDOWS.\n\n- STAND BY -"

# ================================================================== the flashlight (with a charge), hand props
func _make_flashlight() -> void:
	flashlight = SpotLight3D.new()
	flashlight.name = "Flashlight"
	flashlight.light_color = Color(1.0, 0.92, 0.72)
	flashlight.light_energy = 4.5
	flashlight.spot_range = 16.0
	flashlight.spot_angle = 21.0
	flashlight.spot_attenuation = 1.2
	flashlight.shadow_enabled = true
	flashlight.visible = false
	player.add_child(flashlight)
	flashlight.position = Vector3(0.2, 1.22, -0.5)
	flashlight.rotation.x = deg_to_rad(-9)
	var spill := OmniLight3D.new()
	spill.light_color = Color(1.0, 0.9, 0.7)
	spill.light_energy = 0.35
	spill.omni_range = 1.6
	flashlight.add_child(spill)
	spill.position = Vector3(0, 0, -0.5)

func _flashlight(on: bool) -> void:
	if flashlight and ((inv.has("flashlight") and light_charge > 0.0) or not on):
		if on and not flashlight.visible:
			audio.sfx("dial_click", -8.0, 0.6)
		flashlight.visible = on
		player.walk_anim = "walk_light" if on else "walk"
		player.idle_anim = "idle_light" if on else "idle"
		player.run_anim = "run_light" if on else "run"
		_refresh_props()

func _flashlight_tick(delta: float) -> void:
	if not flashlight.visible:
		return
	light_charge = maxf(0.0, light_charge - delta / 3.2)
	if light_charge <= 0.0:
		_flashlight(false)
		Dialogue.play("c1_flash_dead", true, false)
		HUD.caption("The flashlight died. Put a battery in it (Tab).", "", Color(0.85, 0.7, 0.5), 3.0)
		return
	if light_charge < 15.0:
		flashlight.light_energy = 4.5 * (0.55 + 0.45 * (1.0 if randf() > 0.06 else 0.0)) * (0.5 + light_charge / 30.0)
		if not flags.get("low_warned", false):
			flags["low_warned"] = true
			Dialogue.play("c1_flash_low", true, false)
	else:
		flashlight.light_energy = 4.5
		flags["low_warned"] = false

var _aiming_prop := false
var _props: Array[Node] = []

func _refresh_props() -> void:
	for n in _props:
		if is_instance_valid(n): n.queue_free()
	_props.clear()
	if player.model == null or player.model.skeleton == null:
		return
	if inv.has("revolver"):
		if _aiming_prop:
			_props.append(player.model.attach(_revolver_mesh(), "hand.R"))
		else:
			var g := _revolver_mesh()
			g.rotation_degrees = Vector3(-150, 0, 8)
			g.position = Vector3(0.07, -0.02, 0.1)
			_props.append(player.model.attach(g, "hips"))
	if flashlight and flashlight.visible and not _aiming_prop:
		_props.append(player.model.attach(_flashlight_mesh(), "hand.R"))

func _prop_mat(col: Color, glow := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	if glow > 0.0:
		m.emission_enabled = true
		m.emission = col
		m.emission_energy_multiplier = glow
	return m

func _pbox(parent: Node3D, pos: Vector3, size: Vector3, m: Material) -> void:
	var b := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	b.mesh = bm
	b.material_override = m
	b.position = pos
	parent.add_child(b)

func _revolver_mesh() -> Node3D:
	var g := Node3D.new()
	var steel := _prop_mat(Color(0.28, 0.29, 0.31))
	var wood := _prop_mat(Color(0.32, 0.2, 0.12))
	_pbox(g, Vector3(0, -0.13, -0.01), Vector3(0.022, 0.12, 0.024), steel)
	_pbox(g, Vector3(0, -0.07, -0.005), Vector3(0.036, 0.045, 0.038), steel)
	_pbox(g, Vector3(0, -0.04, 0.035), Vector3(0.028, 0.03, 0.07), wood)
	_pbox(g, Vector3(0, -0.055, 0.01), Vector3(0.006, 0.02, 0.02), steel)
	return g

func _flashlight_mesh() -> Node3D:
	var g := Node3D.new()
	var body := _prop_mat(Color(0.18, 0.18, 0.2))
	_pbox(g, Vector3(0, -0.08, 0.0), Vector3(0.034, 0.17, 0.034), body)
	_pbox(g, Vector3(0, -0.175, 0.0), Vector3(0.05, 0.04, 0.05), body)
	_pbox(g, Vector3(0, -0.197, 0.0), Vector3(0.042, 0.004, 0.042), _prop_mat(Color(1.0, 0.95, 0.75), 3.0))
	return g

# ================================================================== Louis: the treeline, the sprint chase, the door, the window
const LOUIS_CUTSCENE_SCALE := 1.0           ## his own height everywhere (1.9 m)
func _louis_at_treeline(on: bool) -> void:
	var lf: Array = layout["louis_fig"]
	(world.get_node("Actors/LouisKey") as Light3D).visible = on
	louis.visible = on
	louis.scale = Vector3.ONE * LOUIS_CUTSCENE_SCALE
	if on:
		louis.global_position = Vector3(lf[0], 0, lf[1])
		louis.rotation.y = deg_to_rad(lf[2])
		louis.play("brood")

## The headlights pick out only the patch of treeline Louis is crouched in: each beam swings onto him and
## tightens to a cone about 5 m across where he is, so the rest of the yard stays dark and only
## his spot, and the fog around it, is lit. Off: back to the normal driving beams.
var _beam_saved := {}
func _beams_on_louis(on: bool, time: float) -> void:
	var lf: Array = layout["louis_fig"]
	var target := Vector3(lf[0], 1.2, lf[1])
	for nm in ["BeamL", "BeamR"]:
		var b := car.get_node_or_null(nm) as SpotLight3D
		if b == null: continue
		if on:
			if not _beam_saved.has(b):
				_beam_saved[b] = [b.transform, b.spot_angle, b.spot_range, b.light_energy, b.spot_attenuation, b.spot_angle_attenuation]
			var from := b.global_position
			var dist := from.distance_to(target)
			var gb := Basis.looking_at(target - from, Vector3.UP)
			var want_basis := (b.get_parent() as Node3D).global_basis.inverse() * gb
			var ang := rad_to_deg(atan(4.0 / dist))       # a cone, widening to about 8 m across where he is
			if time <= 0.0:
				b.basis = want_basis
				b.spot_angle = ang; b.spot_range = dist + 3.0; b.light_energy = 30.0
			else:
				var tw := create_tween().set_parallel(true).set_trans(Tween.TRANS_SINE)
				tw.tween_property(b, "basis", want_basis, time)
				tw.tween_property(b, "spot_angle", ang, time)
				tw.tween_property(b, "spot_range", dist + 3.0, time)
				tw.tween_property(b, "light_energy", 30.0, time)
			b.spot_attenuation = 0.12              # carries all the way out to him
			b.spot_angle_attenuation = 0.5
			_beam_cone(b, dist + 1.5, ang, time)
		elif _beam_saved.has(b):
			var bc := b.get_node_or_null("Cone")
			if bc: bc.queue_free()
			var v: Array = _beam_saved[b]
			b.transform = v[0]; b.spot_angle = v[1]; b.spot_range = v[2]; b.light_energy = v[3]; b.spot_attenuation = v[4]; b.spot_angle_attenuation = v[5]
	if not on: _beam_saved.clear()
	_yard_dim(on)

## While Louis is out at the treeline the rest of the yard sinks into the dark (moon, sky and ambient way down,
## the fog's glow fainter), so the headlights' circle on him is the only bright thing out there.
var _dim_saved := {}
func _yard_dim(on: bool) -> void:
	var fog := map.find_child("GroundFog", true, false) as GroundFog
	if on:
		if not _dim_saved.is_empty(): return
		for l in world.find_children("*", "DirectionalLight3D", true, false):
			_dim_saved[l] = (l as Light3D).light_energy
			(l as Light3D).light_energy *= 0.35
		var envs := {}
		for c in world.get_node("Cams").get_children():
			if c is Camera3D and (c as Camera3D).environment and String((c as Camera3D).environment.resource_path).contains("yard"):
				envs[(c as Camera3D).environment] = true
		for e in envs:
			_dim_saved[e] = [e.ambient_light_energy, e.background_energy_multiplier]
			e.ambient_light_energy *= 0.4
			e.background_energy_multiplier *= 0.5
		if fog and fog.mat: fog.mat.set_shader_parameter("glow", 0.025)
	else:
		for k in _dim_saved:
			if not is_instance_valid(k): continue
			if k is Light3D: (k as Light3D).light_energy = _dim_saved[k]
			elif k is Environment:
				(k as Environment).ambient_light_energy = _dim_saved[k][0]
				(k as Environment).background_energy_multiplier = _dim_saved[k][1]
		_dim_saved.clear()
		if fog and fog.mat: fog.mat.set_shader_parameter("glow", 0.05)

## The beam you can see: a soft cone hanging in the rain and fog from the lamp out to him. A child of the light,
## so it flickers and dies with it.
func _beam_cone(b: SpotLight3D, length: float, angle_deg: float, time: float) -> void:
	var mi := b.get_node_or_null("Cone") as MeshInstance3D
	if mi == null:
		mi = MeshInstance3D.new()
		mi.name = "Cone"
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var m := ShaderMaterial.new()
		m.shader = preload("res://shaders/light_cone.gdshader")
		mi.material_override = m
		b.add_child(mi)
	var cm := CylinderMesh.new()
	cm.top_radius = 0.12
	cm.bottom_radius = length * tan(deg_to_rad(angle_deg)) * 0.9
	cm.height = length
	cm.radial_segments = 16
	cm.rings = 6
	cm.cap_top = false
	cm.cap_bottom = false
	mi.mesh = cm
	mi.rotation = Vector3(deg_to_rad(90), 0, 0)      # its axis along the light's -Z, narrow end at the lamp
	mi.position = Vector3(0, 0, -length / 2.0)
	var mat := mi.material_override as ShaderMaterial
	mat.set_shader_parameter("cone_len", length)
	if time > 0.0:
		mat.set_shader_parameter("strength", 0.0)
		create_tween().tween_method(func(x: float) -> void: mat.set_shader_parameter("strength", x), 0.0, 0.2, time)
	else:
		mat.set_shader_parameter("strength", 0.2)

## Louis's point of view: standing in the trees (his eyes about 1.75 m up), looking back up
## the yard at Norah with the car's headlights glaring behind her. A slow, heavy breathing sway.
func _louis_pov_camera() -> Camera3D:
	var lf: Array = layout["louis_fig"]
	var me := Vector3(lf[0], 0, lf[1])
	var her := player.global_position + Vector3(0, 1.25, 0)
	var c := Camera3D.new()
	c.name = "LouisPOV"
	world.add_child(c)
	var to_her := (her - me); to_her.y = 0.0
	var eye := me + to_her.normalized() * 0.3 + Vector3(0, 1.74, 0)      # his eyes, standing among the trees
	c.global_position = eye
	c.look_at(her, Vector3.UP)
	c.fov = 44.0
	c.near = 0.05
	c.far = 160.0
	var src := cam("CAM_03")
	if src:
		c.environment = src.environment
		c.attributes = src.attributes
	var base := c.global_transform
	var t0 := Time.get_ticks_msec()
	var sway := func() -> void:
		while is_instance_valid(c) and c.is_inside_tree():
			var t := (Time.get_ticks_msec() - t0) / 1000.0
			c.global_transform = base
			c.global_position += base.basis.y * (sin(t * 2.1) * 0.025) + base.basis.x * (sin(t * 0.9) * 0.02)
			c.rotate_object_local(Vector3.FORWARD, sin(t * 0.7) * 0.03)
			c.rotate_object_local(Vector3.RIGHT, sin(t * 2.1 + 0.6) * 0.008)
			await get_tree().process_frame
	sway.call()
	return c

## When the lights die, a pale burned-in silhouette of Louis stays crouched where he was (shaders/afterimage.gdshader),
## like the image left on your eyes after a bright light. He is not there any more.
var _ghost: CharacterModel
var _ghost_mat: ShaderMaterial
var _ghost_tw: Tween
func _afterimage(on: bool) -> void:
	if not on:
		if _ghost_tw: _ghost_tw.kill()
		if is_instance_valid(_ghost): _ghost.queue_free()
		_ghost = null
		return
	if is_instance_valid(_ghost): return
	var lf: Array = layout["louis_fig"]
	_ghost = CharacterModel.new()
	_ghost.name = "LouisAfterimage"
	_ghost.model_id = louis.model_id
	_ghost.start_animation = "brood"
	_ghost.start_offset_random = false
	world.add_child(_ghost)
	_ghost.global_position = Vector3(lf[0], 0, lf[1])
	_ghost.rotation.y = deg_to_rad(lf[2])
	_ghost.scale = Vector3.ONE * LOUIS_CUTSCENE_SCALE
	_ghost_mat = ShaderMaterial.new()
	_ghost_mat.shader = preload("res://shaders/afterimage.gdshader")
	_ghost_mat.set_shader_parameter("strength", 0.0)
	for mi in _ghost.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		for i in m.mesh.get_surface_count(): m.set_surface_override_material(i, _ghost_mat)
	if _ghost.anim:
		_ghost.anim.seek(0.35, true)
		_ghost.anim.pause()                    # frozen in the pose she last saw
	_ghost_strength(0.55, 0.12)

func _ghost_strength(v: float, time: float) -> Tween:
	if _ghost_mat == null or not is_instance_valid(_ghost): return null
	if _ghost_tw: _ghost_tw.kill()
	_ghost_tw = create_tween()
	_ghost_tw.tween_method(func(x: float): _ghost_mat.set_shader_parameter("strength", x), float(_ghost_mat.get_shader_parameter("strength")), v, maxf(time, 0.01))
	return _ghost_tw

## In the dark, while the running gets closer: the silhouette holds, drops out, and each time it flickers back
## it is nearer, crouched in the same frozen pose, on the line between the treeline and the camera.
func _afterimage_flicker(c5: Camera3D) -> void:
	if not is_instance_valid(_ghost): return
	var lf: Array = layout["louis_fig"]
	var far := Vector3(lf[0], 0, lf[1])
	var fwd := -c5.global_transform.basis.z
	fwd.y = 0.0
	fwd = fwd.normalized()
	var near := c5.global_position + fwd * 9.0
	near.y = 0.0
	var set_s := func(x: float) -> void:
		if _ghost_mat: _ghost_mat.set_shader_parameter("strength", x)
	var move_to := func(t: float, side: float) -> void:
		if not is_instance_valid(_ghost): return
		var p := far.lerp(near, t) + fwd.cross(Vector3.UP) * side
		_ghost.global_position = p
		var d := c5.global_position - p
		_ghost.rotation.y = atan2(-d.x, -d.z)        # facing the camera
	var t := create_tween()
	_ghost_tw = t
	t.tween_method(set_s, 0.55, 0.45, 0.7)
	t.tween_callback(set_s.bind(0.0)); t.tween_interval(0.22)
	t.tween_callback(move_to.bind(0.4, 0.8)); t.tween_callback(set_s.bind(0.5)); t.tween_interval(0.45)
	t.tween_callback(set_s.bind(0.0)); t.tween_interval(0.16)
	t.tween_callback(move_to.bind(0.68, -0.6)); t.tween_callback(set_s.bind(0.55)); t.tween_interval(0.35)
	t.tween_callback(set_s.bind(0.0)); t.tween_interval(0.1)
	t.tween_callback(move_to.bind(0.88, 0.3)); t.tween_callback(set_s.bind(0.6)); t.tween_interval(0.22)
	t.tween_callback(set_s.bind(0.0))

## The sprint: the real Louis is at her back, but his silhouette is crouched ahead of her by the corner of the
## house, between her and the door, coming and going. It's gone the moment she gets close, or after a few seconds.
const FRONT_DOOR_APPROACH := Vector3(-2.4, 0, -2.8)
func _ghost_linger() -> void:
	if not is_instance_valid(_ghost): return
	var p0 := player.global_position
	var to_door := (FRONT_DOOR_APPROACH - p0)
	to_door.y = 0.0
	to_door = to_door.normalized()
	var ghost_at := p0 + to_door * 4.2 + to_door.cross(Vector3.UP) * -1.7      # ahead of her, off to the right of her path
	ghost_at.y = 0.0
	_ghost.global_position = ghost_at
	_ghost.scale = Vector3.ONE * LOUIS_SCALE
	var d := p0 - ghost_at
	_ghost.rotation.y = atan2(-d.x, -d.z)
	var set_s := func(x: float) -> void:
		if _ghost_mat: _ghost_mat.set_shader_parameter("strength", x)
	var t := create_tween()
	_ghost_tw = t
	t.tween_method(set_s, 0.0, 0.55, 0.35)
	t.tween_interval(1.1)
	t.tween_callback(set_s.bind(0.0)); t.tween_interval(0.3)
	t.tween_callback(set_s.bind(0.38)); t.tween_interval(1.5)
	t.tween_callback(set_s.bind(0.0)); t.tween_interval(0.18)
	t.tween_callback(set_s.bind(0.3))
	t.tween_method(set_s, 0.3, 0.0, 2.0)
	t.tween_callback(func() -> void: _afterimage(false))
	while is_instance_valid(_ghost):
		if player.global_position.distance_to(ghost_at) < 1.8:
			_afterimage(false)             # she gets close: nothing there
			break
		await get_tree().physics_frame

## Halfway across the yard her foot goes out on the wet grass: she goes down on a hand and scrambles up
## (about a second), and he closes right in behind her.
func _sprint_stumble() -> void:
	var fz: Array = layout["freeze"]
	var mid := Vector3(fz[0], 0, fz[1]).lerp(FRONT_DOOR_APPROACH, 0.45)
	while chase and not dead:
		if player.global_position.z < mid.z:
			var fwd := -player.global_basis.z
			player.stagger(fwd, 1.4, 0.95, "land_hard")
			audio.sfx("body_land", -8.0, 1.2)
			Cameras.shake(0.07, 0.25)
			Dialogue.bark_group("c1_hurt", 0)
			return
		await get_tree().physics_frame

func _start_chase() -> void:
	chase = true
	_chase_cool = 0.0
	_chase_t = 0.0
	louis.visible = true
	louis.play("stalk", 0.1, 1.6)

func _pound_door() -> void:
	var fd := map.get_node("Doors/FrontDoor") as Node3D
	while _pounding and not dead:
		audio.sfx("door_pound", 2.0, randf_range(0.9, 1.05))
		_sfx3d("growl_loop", Vector3(-0.6, 1.0, -1.0), -6.0)
		Cameras.shake(0.03, 0.15)
		fd.rotation.y = _door_closed_y + 0.03
		await wait(0.08)
		fd.rotation.y = _door_closed_y
		await wait(randf_range(1.0, 1.5))

func _physics_process(delta: float) -> void:
	if combat:
		combat.enabled = inv.has("revolver") and not dead
	if _bounds_on:
		_check_bounds(delta)
	if _roaming and not _busy:
		_roam_tick(delta)
	if flashlight:
		_flashlight_tick(delta)
	if _circling or _window_scratch:
		var pts := [Vector3(-17.6, 0.6, -5.0), Vector3(-1.0, 0.6, -5.0), Vector3(-1.0, 0.6, 8.0), Vector3(-17.6, 0.6, 8.0)]
		if _window_scratch:
			growl.global_position = Vector3(-17.3, 1.1, -1.6)
		else:
			_circle_t += delta * 0.12
			var u := fmod(_circle_t, 1.0) * 4.0
			var i := int(u)
			growl.global_position = (pts[i] as Vector3).lerp(pts[(i + 1) % 4], u - i)
		if not growl.playing: growl.play()
		_scratch_t -= delta
		if _scratch_t <= 0.0:
			_scratch_t = randf_range(1.2, 2.2) if _window_scratch else randf_range(3.5, 7.0)
			_sfx3d("siding_scratch" if randf() < 0.75 else "door_rattle", growl.global_position, 0.0 if _window_scratch else -2.0)
	if not chase or dead or not louis.visible:
		return
	_chase_cool -= delta
	_chase_t += delta
	chase_speed = lerpf(2.6, 3.05, clampf(_chase_t / 2.2, 0.0, 1.0))
	var to := player.global_position - louis.global_position
	to.y = 0.0
	if to.length() > 0.05:
		BodySweep.move(louis, to.normalized() * chase_speed * delta, 0.3, 1.4)
		louis.global_position.y = move_toward(louis.global_position.y, 0.0, delta * 2.0)
		louis.rotation.y = atan2(-to.x, -to.z)
	if to.length() < 0.85 and _chase_cool <= 0.0:
		_chase_cool = 2.2
		louis.play_once("swipe")
		Dialogue.bark_group("c1_hurt", 0)
		combat.take_damage(26.0, to.normalized())
		await wait(0.55)
		if chase: louis.play("stalk", 0.1, 1.6)

func _die() -> void:
	if dead: return
	dead = true
	chase = false
	ai.active = false
	combat.enabled = false
	lock(true)
	audio.sfx("scream_1", 0.0, 1.2)
	HUD.fade_out(1.2, Color(0.35, 0.0, 0.0))
	await wait(1.4)
	HUD.fade_out(0.6)
	await wait(0.6)
	HUD.title("YOU DIED", "", 1.8, 0.6)
	await wait(2.6)
	resume_at = checkpoint
	get_tree().reload_current_scene()

func _car_wrecked() -> void:
	(car.get_node("Wreck") as Node3D).visible = true
	for n in ["LampL", "LampR"]: (car.get_node(n) as Node3D).visible = false
	_car_beams(false)

func _window_broken() -> void:
	_window_glass(false)
	_topple_wardrobe(0.0)

var _floor_cam: Camera3D
## Low on the carpet behind Norah's head, looking past her up at the bed: what she sees from the floor.
func _floor_shot() -> void:
	if not is_instance_valid(_floor_cam):
		_floor_cam = Camera3D.new()
		world.add_child(_floor_cam)
	# from the free corner of the room (the bedroom is only x -16.3..-13, z -2.5..2): low, so she lies flat on the
	# carpet in the near left of the frame and he's on the bed beyond her
	var her := player.global_position
	var look := (her + Vector3(0, 0.15, 0)).lerp(Vector3(-14.7, 0.6, -1.84), 0.45)
	var want := Vector3(-13.3, 0.95, 1.6)
	var space := player.get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(look, want, 1)
	var hit := space.intersect_ray(q)
	if not hit.is_empty():
		want = look + (hit["position"] - look) * 0.9
	_floor_cam.global_position = want
	_floor_cam.look_at(look, Vector3.UP)
	_floor_cam.fov = 64.0
	var ref := cam("CAM_11")
	if ref and ref.environment: _floor_cam.environment = ref.environment
	cut_cam(_floor_cam)

# ------------------------------------------------------------------ the stalker (LouisStalker drives him)
func _in_norah_house(p: Vector3) -> bool:
	for r in layout["rooms"]["norah"].values():
		if p.x >= r[0] and p.x <= r[1] and p.z >= r[2] and p.z <= r[3]: return true
	return false

## Chase music while he's close and hunting, the stalking bed when he's farther off; nothing when he's gone.
func _stalk_music(dist: float) -> void:
	var want := "" if dist < 0.0 else ("chase" if dist < 14.0 else "stalking")
	if want == _stalk_mus: return
	_stalk_mus = want
	_music(want, -6.0 if want == "chase" else -10.0, 1.2)

func _stalker_down() -> void:
	if not flags.get("stalk_down_line", false):
		flags["stalk_down_line"] = true
		Dialogue.play("c1_stalk_down", true, false)

## He's dead, for good. Something glints beside him: Rose's ring, on the chain he wore it on.
func _louis_killed(at: Vector3) -> void:
	_music("", 0.0, 2.0)
	flags["louis_killed"] = true
	await wait(2.2)
	var ring := P.get("RingDrop") as Interactable
	if ring == null:
		ring = Interactable.new()
		ring.name = "RingDrop"
		ring.prompt = "Pick up"
		ring.glow = true
		ring.radius = 1.2
		$Screen/World/Points.add_child(ring)
		P["RingDrop"] = ring
		ring.used.connect(func(_w): _on_point("RingDrop"))
		var glint := OmniLight3D.new()
		glint.light_color = Color(1.0, 0.85, 0.5)
		glint.light_energy = 0.6
		glint.omni_range = 0.8
		ring.add_child(glint)
		glint.position = Vector3(0, 0.15, 0)
	var spot := at + Vector3(0.45, 0, 0.3)
	if BodySweep.blocked_at(player, spot, 0.1, 0.2): spot = at
	ring.global_position = Vector3(spot.x, 0.25, spot.z)
	ring.enabled = true
	await Dialogue.play("c1_louis_killed", true, false)
	if autoplay:
		while _busy: await get_tree().physics_frame
		await _auto_walk(Vector3(spot.x, 0, spot.z) + Vector3(0.0, 0, 0.7))
		await _run_beat(_take_ring)

func _take_ring() -> void:
	P["RingDrop"].enabled = false
	flags["ring"] = true
	await _pickup("roses_ring", 1, "TREASURE. Worth about $%d to the right buyer." % TREASURE_DB["roses_ring"])

## Out by her car: he's standing at the edge of the trees, looking at her. She turns round and sees him.
## Two shots: her face as she sees him, then over her shoulder at him (a cold edge of light picks him out
## of the dark). Then he comes.
func _stalker_reveal() -> void:
	lock(true)
	var at := stalker.find_spot(true, 8.0, 11.0)
	if at == Vector3.INF: at = stalker.find_spot(false, 8.0, 11.0)
	if at == Vector3.INF: at = player.global_position + Vector3(6.0, 0, 6.0)
	stalker.spawn(at)
	ai.active = false
	louis.play("brood", 0.0)
	var rim := OmniLight3D.new()
	rim.light_color = Color(0.55, 0.65, 0.85)
	rim.light_energy = 1.4
	rim.omni_range = 3.5
	world.add_child(rim)
	rim.global_position = at + Vector3(0.8, 2.2, 0.0)
	audio.sfx("sharp_sting", -4.0, 0.7)
	var to := at - player.global_position
	to.y = 0.0
	to = to.normalized()
	var turn := create_tween()
	turn.tween_property(player, "rotation:y", player.rotation.y + wrapf(atan2(-to.x, -to.z) - player.rotation.y, -PI, PI), 0.55).set_trans(Tween.TRANS_SINE)
	player.model.play("scared", 0.2)
	var env: Environment = cam("CAM_Crane").environment if cam("CAM_Crane") else null
	# her face, from a little in front and to the side (he's behind the camera)
	var face := Camera3D.new()
	world.add_child(face)
	var side := to.cross(Vector3.UP).normalized()
	face.global_position = player.global_position + to * 1.25 + side * 0.45 + Vector3(0, 1.6, 0)
	face.look_at(player.global_position + Vector3(0, 1.5, 0), Vector3.UP)
	face.fov = 44.0
	face.environment = env
	await turn.finished
	cut_cam(face)
	await wait(0.5)
	audio.sfx("louis_shriek", -8.0, 0.5)
	Dialogue.play("c1_stalk_reveal", true, false)
	await wait(1.4)
	# over her shoulder: him, at the edge of the trees
	var c := Camera3D.new()
	world.add_child(c)
	c.global_position = player.global_position - to * 1.3 + side * 0.5 + Vector3(0, 1.7, 0)
	c.look_at(at + Vector3(0, 1.2, 0), Vector3.UP)
	c.fov = 34.0
	c.environment = env
	cut_cam(c)
	while Dialogue.current_id == "c1_stalk_reveal": await get_tree().physics_frame
	Cameras.cut_to(null)
	face.queue_free()
	c.queue_free()
	var fade := create_tween()
	fade.tween_property(rim, "light_energy", 0.0, 1.5)
	fade.tween_callback(rim.queue_free)
	player.model.play("idle", 0.3)
	lock(false)

## Upstairs at his safe, keys in her hand: something lands on the porch roof, and he comes in through the
## bedroom window the same way he went out of it, headfirst through the frame.
func _up_window_crash() -> void:
	lock(true)
	flags["up_crash"] = true
	_sfx3d("door_pound", Vector3(68.75, 2.4, -3.4), 3.0)
	Cameras.shake(0.1, 0.3)
	await wait(1.0)
	var c := Camera3D.new()
	world.add_child(c)
	c.global_position = Vector3(69.7, 1.75, -6.7)
	c.look_at(Vector3(68.75, 1.1, -4.5), Vector3.UP)
	c.fov = 64.0
	var ref := cam("CAM_15")
	if ref and ref.environment: c.environment = ref.environment
	cut_cam(c)
	louis.scale = Vector3.ONE * LOUIS_SCALE
	louis.visible = true
	louis.global_position = Vector3(68.75, 0.0, -2.7)
	louis.rotation.y = 0.0                                  # facing -Z, into the room
	louis.play("pounce", 0.0)
	var t := create_tween()
	t.tween_property(louis, "global_position", Vector3(68.75, 0.62, -4.45), 0.2).set_ease(Tween.EASE_OUT)
	await t.finished
	audio.sfx("glass_crash", 4.0)
	audio.sfx("wall_smash", 2.0, 0.8)
	HUD.flash(2, Color(1, 1, 1))
	Cameras.shake(0.3, 0.5)
	louis.play_once("bed_crash", 0.06)
	var t2 := create_tween()
	t2.tween_property(louis, "global_position", Vector3(68.75, 0.0, -5.6), 0.25).set_ease(Tween.EASE_IN)
	await t2.finished
	audio.sfx("body_land", 4.0, 0.7)
	await Dialogue.play("c1_up_crash")
	await wait(1.4)
	stalker.next_respawn = 5.0             # when she gets down the stairs, he's not far behind
	stalker.spawn(louis.global_position)
	Cameras.cut_to(null)
	c.queue_free()
	objective("Get to the truck!")

## Keys in the ignition. He comes out of the dark into the headlights, and hits the truck like a car crash.
func _truck_finale() -> void:
	lock(true)
	stalker.enabled = false
	stalker.vanish(99999.0)
	player.visible = false
	var tn := truck.get_node("Norah") as CharacterModel
	tn.visible = true
	tn.play("sit_drive_tense")
	for n in ["BeamL", "BeamR", "DashGlow"]: (truck.get_node(n) as Node3D).visible = true
	_car_fill(truck)
	audio.sfx("car_door", -6.0)
	audio.sfx("engine_start", -4.0)
	var fwd := -truck.global_basis.z
	fwd.y = 0.0
	fwd = fwd.normalized()
	var beam_cam := Camera3D.new()                        # over the cab roof, down the beams: what's out there
	world.add_child(beam_cam)
	beam_cam.global_position = truck.global_position - fwd * 2.6 + truck.global_basis.x * 0.7 + Vector3(0, 2.6, 0)
	beam_cam.look_at(truck.global_position + fwd * 9.0 + Vector3(0, 0.9, 0), Vector3.UP)
	beam_cam.fov = 50.0
	beam_cam.environment = cam("CAM_Truck").environment if cam("CAM_Truck") else null
	cut_cam(beam_cam)
	var at := truck.global_position + fwd * 10.0
	for k in 6:
		if not BodySweep.blocked_at(louis, at, 0.3, 1.4): break
		at -= fwd * 1.0
	at.y = 0.0
	louis.scale = Vector3.ONE * LOUIS_SCALE
	louis.global_position = at
	louis.rotation.y = atan2(fwd.x, fwd.z)                  # facing the truck
	louis.visible = true
	louis.play("brood", 0.0)
	await wait(1.1)
	audio.sfx("louis_shriek", 0.0, 0.5)
	louis.play("shoulder_charge", 0.1)
	var t := create_tween()
	t.tween_property(louis, "global_position", truck.global_position + fwd * 2.6, 0.85).set_ease(Tween.EASE_IN)
	await t.finished
	var tc := _truck_interior_cams()
	cut_cam(tc["dash"])
	louis.play("pounce", 0.0)
	louis.global_position = truck.to_global(Vector3(0.0, 0.85, -2.25))   # on the hood, in her windshield
	audio.sfx("windshield_thump", 6.0)
	audio.sfx("wall_smash", 2.0, 0.7)
	audio.sfx("glass_crash", -2.0)
	HUD.flash(2, Color(1, 1, 1))
	Cameras.shake(0.45, 0.7)
	await Dialogue.play("c1_truck_finale")
	cut_cam(tc["profile"])
	audio.sfx("engine_rev", 4.0, 1.2)
	var off := create_tween()                                # she floors it; he's flung off into the dark
	off.tween_property(louis, "global_position", louis.global_position + truck.global_basis.x * 4.0 + Vector3(0, -0.85, 0), 0.5).set_ease(Tween.EASE_OUT)
	await wait(0.9)
	louis.visible = false
	beam_cam.queue_free()

## A dark smear dragged from where he lay to the bedroom window he came in by: along his own route through the
## house (the nav graph), in short overlapping strokes, the way a body drags.
var _trail: Node3D
func _blood_trail(from: Vector3) -> void:
	if is_instance_valid(_trail): return
	_trail = Node3D.new()
	_trail.name = "BloodTrail"
	world.add_child(_trail)
	var out := Vector3(-15.9, 0, -1.4)                       # under the broken bedroom window, between bed and wall
	var pts: Array = [from]
	pts.append_array(ai._route(from, out))
	if pts.size() < 2: pts.append(out)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.16, 0.01, 0.01)
	m.roughness = 0.2
	var pm := PlaneMesh.new()
	pm.size = Vector2(0.32, 0.6)
	var y := 0.02
	for i in range(pts.size() - 1):
		var a: Vector3 = pts[i]; var b: Vector3 = pts[i + 1]
		a.y = 0.0; b.y = 0.0
		var seg := b - a
		var n := int(seg.length() / 0.42)
		for k in n + 1:
			var p := a + seg * (float(k) / maxf(n, 1))
			var q := MeshInstance3D.new()
			q.mesh = pm
			q.material_override = m
			_trail.add_child(q)
			q.global_position = p + Vector3(randf_range(-0.05, 0.05), y, randf_range(-0.05, 0.05))
			q.rotation.y = atan2(seg.x, seg.z) + randf_range(-0.25, 0.25)
			q.scale = Vector3(randf_range(0.6, 1.1), 1, randf_range(0.8, 1.2))
			y += 0.0004                                     # each stroke a hair above the last: no flicker
	var pool := MeshInstance3D.new()                          # where he lay
	var big := PlaneMesh.new(); big.size = Vector2(1.1, 1.4)
	pool.mesh = big
	pool.material_override = m
	_trail.add_child(pool)
	pool.global_position = Vector3(from.x, 0.018, from.z)

## Louis's steam was hard grey squares. Soft round puffs instead (still low-res), that fade in, swell and fade out.
func _soften_steam(p: CPUParticles3D) -> void:
	if p == null or not (p.mesh is QuadMesh): return
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(1.0, 0.5)
	tex.width = 16
	tex.height = 16
	var q := (p.mesh as QuadMesh).duplicate() as QuadMesh
	var mat := (q.material as StandardMaterial3D).duplicate() as StandardMaterial3D
	mat.albedo_texture = tex
	mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	q.material = mat
	q.size = Vector2(0.24, 0.24)
	p.mesh = q
	var ramp := Gradient.new()
	ramp.offsets = PackedFloat32Array([0.0, 0.25, 1.0])
	ramp.colors = PackedColorArray([Color(1, 1, 1, 0.0), Color(1, 1, 1, 0.55), Color(1, 1, 1, 0.0)])
	p.color_ramp = ramp
	var sc := Curve.new()
	sc.add_point(Vector2(0.0, 0.5))
	sc.add_point(Vector2(1.0, 1.6))
	p.scale_amount_curve = sc

func _window_glass(on: bool) -> void:
	var w := map.get_node("Windows/BedroomWindow") as Node3D
	(w.get_node("Glass") as Node3D).visible = on
	for bar in ["B270", "B271"]:          # the cross bars go with the glass
		var b := w.get_node_or_null(bar) as Node3D
		if b: b.visible = on
	var col := w.get_node_or_null("Col")
	if col: col.process_mode = Node.PROCESS_MODE_INHERIT if on else Node.PROCESS_MODE_DISABLED

## The wardrobe goes over on its side along the wall, slamming down right where Norah was standing.
## Its doors still face the room; the rounds inside spill out in front of them (WardrobeSearch).
func _topple_wardrobe(time: float) -> void:
	if flags.get("toppled", false): return
	flags["toppled"] = true
	var wd := map.get_node("Props/BedWardrobe") as Node3D
	var to_pos := wd.position + Vector3(0.0, 0.49, 0.0)
	var to_rot := Vector3(0.0, wd.rotation.y, deg_to_rad(89))
	if time <= 0.0:
		wd.position = to_pos
		wd.rotation = to_rot
	else:
		var t := create_tween().set_parallel(true)
		t.tween_property(wd, "rotation", to_rot, time).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		t.tween_property(wd, "position", to_pos, time).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	var base := wd.global_transform.origin
	P["WardrobeSearch"].global_position = Vector3(base.x + 0.65, 0.3, base.z + 1.0)
	if not flags.get("searched_WardrobeSearch", false):
		P["WardrobeSearch"].enabled = true

# ================================================================== helpers
func cam(n: String) -> Camera3D:
	var c := world.get_node_or_null("Cams/" + n) as Camera3D
	if c == null:
		c = world.find_child(n, true, false) as Camera3D
	return c

func cut(n: String) -> void:
	Cameras.cut_to(cam(n))

func cut_cam(c: Camera3D) -> void:
	Cameras.cut_to(c)

func wait(t: float) -> void:
	await get_tree().create_timer(t, false).timeout

func lock(on: bool) -> void:
	player.control_locked = on
	if on:
		HUD.show_prompt("")

func objective(text: String) -> void:
	HUD.set_objective(text)
	if text != "": print("[ch1] objective: ", text)

func reach_box(a: Vector3, b: Vector3, auto_path: Array, auto_speed := 3.8) -> void:
	if autoplay:
		for p in auto_path: await _auto_walk(p, auto_speed)
		return
	while not dead:
		var p := player.global_position
		if p.x >= a.x and p.x <= b.x and p.z >= a.z and p.z <= b.z:
			return
		await get_tree().physics_frame

func _auto_walk(target: Vector3, speed := 2.6, keep_lock := false) -> void:
	player.control_locked = true
	player.model.play("run" if speed > 2.4 else "walk", 0.12)
	var limit := player.global_position.distance_to(target) / speed + 1.5
	var tp0 := _tp
	while not dead:
		if _tp != tp0:
			break
		if (_busy and not _beat_walk) or _doc_open or _stalk_hold:
			if _stalk_hold: player.control_locked = false       # the fight drives her now
			await get_tree().physics_frame
			continue
		player.control_locked = true
		if float(player.get("_stagger")) > 0.0:          # stumbling: wait for her to get up
			await get_tree().physics_frame
			continue
		limit -= get_physics_process_delta_time()
		if limit <= 0.0:
			push_warning("[ch1] auto-walk blocked on the way to %s (at %s)" % [target, player.global_position])
			player.global_position = Vector3(target.x, player.global_position.y, target.z)
			break
		var to := target - player.global_position
		to.y = 0.0
		var step := speed * get_physics_process_delta_time()
		if to.length() <= step:
			player.global_position = Vector3(target.x, player.global_position.y, target.z)
			break
		player.rotation.y = atan2(-to.x, -to.z)
		player.velocity = to.normalized() * speed
		player.move_and_slide()
		await get_tree().physics_frame
	player.velocity = Vector3.ZERO
	player.model.play(player.idle_anim, 0.2)
	if not keep_lock:
		player.control_locked = false

func _pts(arr: Array) -> PackedVector3Array:
	var out := PackedVector3Array()
	for q in arr: out.append(Vector3(q[0], 0, q[1]))
	return out

func _drive_path(v: Node3D, pts: PackedVector3Array, speed: Callable, tick: Callable) -> void:
	if pts.size() < 2:
		return
	var lens: Array[float] = [0.0]
	for i in range(1, pts.size()): lens.append(lens[i - 1] + pts[i - 1].distance_to(pts[i]))
	var total: float = lens[-1]
	var d := 0.0
	var seg := 0
	v.global_position = pts[0]
	v.rotation.y = atan2(-(pts[1].x - pts[0].x), -(pts[1].z - pts[0].z))
	while d < total and not dead:
		var dt := get_physics_process_delta_time()
		d = minf(total, d + float(speed.call(d / total)) * dt)
		while seg < pts.size() - 2 and lens[seg + 1] < d: seg += 1
		var k := (d - lens[seg]) / maxf(0.001, lens[seg + 1] - lens[seg])
		v.global_position = pts[seg].lerp(pts[seg + 1], k)
		var ahead: Vector3 = pts[mini(seg + 3, pts.size() - 1)]
		var to := ahead - v.global_position
		if to.length() > 0.2:
			var ty := atan2(-to.x, -to.z)
			v.rotation.y += wrapf(ty - v.rotation.y, -PI, PI) * minf(1.0, dt * 3.0)
		tick.call(d / total)
		await get_tree().physics_frame

func _park_car() -> void:
	var c: Array = layout["car"]
	car.global_position = Vector3(c[0], 0, c[1])
	car.rotation.y = deg_to_rad(c[2])

func _car_side() -> Vector3:
	return car.global_position + car.global_transform.basis.x * -1.45

## Two shots inside a vehicle, made once each: her profile from the passenger seat (hands on the wheel, the rain
## on the side window behind her), and over the dash out through the windshield at the road. She sits a little
## lower than the scene had her, so her head clears the roof lining. The truck's cab was one solid block (from
## inside you saw straight out through it), so it gets a hollow lining with the windows cut through.
var _cab_cams := {}
func _car_interior_cams() -> Dictionary:
	return _interior_cams(car, 0.14, Vector3(0.5, 1.2, -0.3), Vector3(-0.4, 1.08, -0.12), Vector3(0.18, 1.2, 0.15), Vector3(-0.05, 0.98, -1.4))

func _truck_interior_cams() -> Dictionary:
	if not truck.has_node("CabLining"):
		var lining := CSGBox3D.new()
		lining.name = "CabLining"
		lining.size = Vector3(1.74, 0.88, 1.32)
		lining.position = Vector3(0, 1.25, -0.35)
		lining.flip_faces = true
		var m := StandardMaterial3D.new()
		m.albedo_color = Color(0.07, 0.07, 0.065)
		m.roughness = 1.0
		lining.material = m
		for hole in [[Vector3(0, 1.43, -1.0), Vector3(1.5, 0.48, 0.3)],          # windshield
				[Vector3(-0.87, 1.45, -0.42), Vector3(0.3, 0.42, 0.95)],        # driver's window
				[Vector3(0.87, 1.45, -0.42), Vector3(0.3, 0.42, 0.95)],         # passenger window
				[Vector3(0, 1.47, 0.3), Vector3(1.2, 0.32, 0.3)]]:              # rear window
			var h := CSGBox3D.new()
			h.operation = CSGShape3D.OPERATION_SUBTRACTION
			h.size = hole[1]
			h.position = (hole[0] as Vector3) - lining.position
			lining.add_child(h)
		truck.add_child(lining)
	return _interior_cams(truck, 0.44, Vector3(0.55, 1.47, -0.55), Vector3(-0.45, 1.32, -0.35), Vector3(0.25, 1.5, -0.12), Vector3(-0.05, 1.25, -2.0))

func _interior_cams(v: Node3D, seat_y: float, prof_at: Vector3, prof_look: Vector3, dash_at: Vector3, dash_look: Vector3) -> Dictionary:
	if _cab_cams.has(v.name): return _cab_cams[v.name]
	var nm := v.get_node_or_null("Norah") as Node3D
	if nm: nm.position.y = seat_y
	var env: Environment = (v.get_node("H2_Windshield") as Camera3D).environment
	var made := {}
	for k in [["profile", prof_at, prof_look, 52.0], ["dash", dash_at, dash_look, 60.0]]:
		var c := Camera3D.new()
		c.name = "H2_" + String(k[0]).capitalize()
		v.add_child(c)
		c.position = k[1]
		c.look_at(v.to_global(k[2]), Vector3.UP)
		c.fov = k[3]
		c.near = 0.03
		c.environment = env
		made[k[0]] = c
	_cab_cams[v.name] = made
	return made

## Plays a conversation, cutting on each new line to the shot for its index ("0", "1"...) or else its speaker
## ("norah", "sign"...). A value is a Camera3D or the name of a scene camera. Lines with neither keep the shot.
func _play_cut(id: String, shots: Dictionary) -> void:
	var f := func(cid: String, i: int, l: Dictionary) -> void:
		if cid != id: return
		var c = shots.get(str(i), shots.get(String(l.get("who", "")), null))
		if c is Camera3D: cut_cam(c)
		elif c is String: cut(c)
	Dialogue.line_started.connect(f)
	await Dialogue.play(id, true)
	Dialogue.line_started.disconnect(f)

func _follow(mode: String) -> void:
	_follow_mode = mode
	if mode == "":
		return
	if _follow_cam == null:
		_follow_cam = Camera3D.new()
		_follow_cam.fov = 55.0
		_follow_cam.far = 220.0
		_follow_cam.environment = load("res://environments/env_norah_yard.tres")
		world.add_child(_follow_cam)
	_update_follow()
	Cameras.cut_to(_follow_cam)

func _update_follow() -> void:
	var v := vehicle if vehicle else car
	var fwd := -v.global_transform.basis.z
	if _follow_mode == "highway":
		_follow_cam.global_position = v.global_position - fwd * 9.0 + Vector3(0, 5.5, 0) + v.global_transform.basis.x * 2.0
		_follow_cam.look_at(v.global_position + fwd * 8.0, Vector3.UP)
	elif _follow_mode == "road_out":
		_follow_cam.global_position = v.global_position - fwd * 7.5 + Vector3(0, 3.2, 0)
		_follow_cam.look_at(v.global_position + fwd * 14.0 + Vector3(0, 0.5, 0), Vector3.UP)
	else:
		_follow_cam.global_position = v.global_position - fwd * 8.0 + Vector3(0, 6.0, 0)
		_follow_cam.look_at(v.global_position + fwd * 12.0, Vector3.UP)

func _process(delta: float) -> void:
	_clock += delta
	_update_rain()
	HUD.compass.active = checkpoint not in ["drive", "road"] and not dead
	HUD.compass.autoplay = autoplay
	HUD.compass.targets = _compass_targets()
	var up := map.get_node_or_null("Windows/UpWindow/Anim/CurtainL") as Node3D
	if up:
		up.rotation.x = -0.35 - 0.3 * sin(_clock * 2.1) - 0.12 * sin(_clock * 5.3)
		(map.get_node("Windows/UpWindow/Anim/CurtainR") as Node3D).rotation.x = -0.3 - 0.28 * sin(_clock * 1.7 + 1.3) - 0.1 * sin(_clock * 4.1)
	if tv_vp:
		var sc := tv_vp.get_node("Scan") as ColorRect
		sc.position.y = fmod(_clock * 60.0, 120.0)
	if _follow_mode != "":
		_update_follow()
	if combat and combat.aiming:
		HUD.show_prompt("Rounds %d / 5    Spare %d" % [loaded, inv.get("ammo", 0)])
		_ammo_prompt = true
	elif _ammo_prompt:
		_ammo_prompt = false
		if HUD.prompt.text.begins_with("Rounds "): HUD.show_prompt("")
	if shots:
		_shot_t += delta
		if _shot_t > 4.0:
			_shot_t = 0.0
			print("[ch1] t fps=%d dlg=%s cam=%s pos=%s" % [Engine.get_frames_per_second(), Dialogue.current_id, Cameras.current.name if Cameras.current else "-", player.global_position])
			_snap("t")

func _car_fill(v: Node3D = null) -> void:
	v = v if v else car
	if v.has_node("Fill"):
		return
	var f := OmniLight3D.new()
	f.name = "Fill"
	f.light_color = Color(0.55, 0.62, 0.8)
	f.light_energy = 1.5
	f.omni_range = 14.0
	v.add_child(f)
	f.position = Vector3(0, 5.0, 2.5)

func _car_beams(on: bool) -> void:
	for n in ["BeamL", "BeamR"]:
		(car.get_node(n) as Light3D).visible = on
	for n in ["LampL", "LampR"]:
		(car.get_node(n) as Node3D).visible = on or not (car.get_node("Wreck") as Node3D).visible

func _headlight_death() -> void:
	var lights: Array[Light3D] = [car.get_node("BeamL") as Light3D, car.get_node("BeamR") as Light3D, world.get_node("Actors/LouisKey") as Light3D]
	for i in 12:
		var on := randf() < 0.55
		for l in lights: l.visible = on
		await wait(randf_range(0.04, 0.12))
	for l in lights: l.visible = false
	for n in ["LampL", "LampR"]:
		(car.get_node(n) as Node3D).visible = false

## With the headlights gone the yard is almost pitch black: every light drops to a sliver, and the sky and
## ambient go nearly to nothing. Louis could be anywhere.
var _bo_saved := {}
func _blackout(on: bool, level := 0.04) -> void:
	var fog := map.find_child("GroundFog", true, false) as GroundFog
	if fog and fog.mat: fog.mat.set_shader_parameter("glow", 0.012 if on else 0.05)
	if on:
		_bo_saved.clear()
		for l in world.find_children("*", "Light3D", true, false):
			if l.visible and not player.is_ancestor_of(l):
				_bo_saved[l] = l.light_energy
				l.light_energy *= level
		for c in ["CAM_03", "CAM_04", "CAM_05"]:
			var cc := cam(c)
			if cc and cc.environment and not _bo_saved.has(cc.environment):
				var e := cc.environment
				_bo_saved[e] = [e.ambient_light_energy, e.background_energy_multiplier]
				e.ambient_light_energy *= maxf(0.08, level * 1.5)
				e.background_energy_multiplier *= maxf(0.15, level * 2.0)
	else:
		for k in _bo_saved:
			if not is_instance_valid(k): continue
			if k is Light3D: (k as Light3D).light_energy = _bo_saved[k]
			elif k is Environment:
				(k as Environment).ambient_light_energy = _bo_saved[k][0]
				(k as Environment).background_energy_multiplier = _bo_saved[k][1]
		_bo_saved.clear()

func _close_front_door() -> void:
	var fd := map.get_node("Doors/FrontDoor") as Node3D
	fd.rotation.y = _door_closed_y
	(fd.get_node("Leaf/Col") as StaticBody3D).process_mode = Node.PROCESS_MODE_INHERIT

## Past the edge of the walkable area: she says so and turns back.
func _in_bounds(p: Vector3) -> bool:
	var rects: Array = [bounds[1]] if _bounds_walk_only else bounds
	for r in rects:
		if p.x >= r[0] and p.x <= r[1] and p.z >= r[2] and p.z <= r[3]:
			return true
	return false

func _check_bounds(delta: float) -> void:
	_bounds_t -= delta
	if _busy or _bounds_t > 0.0 or player.control_locked or Dialogue.locks_player or _inv_open or _doc_open:
		return
	if _in_bounds(player.global_position):
		return
	_bounds_t = 1.5
	_run_beat(_turn_back)

func _turn_back() -> void:
	var p := player.global_position
	var rects: Array = [bounds[1]] if _bounds_walk_only else bounds
	var best := p
	var bd := INF
	for r in rects:
		var q := Vector3(clampf(p.x, r[0] + 1.0, r[1] - 1.0), p.y, clampf(p.z, r[2] + 1.0, r[3] - 1.0))
		if q.distance_to(p) < bd:
			bd = q.distance_to(p)
			best = q
	var to := best - p
	to.y = 0.0
	player.control_locked = true
	player.velocity = Vector3.ZERO
	Dialogue.play("c1_bounds", true, false)
	var t := create_tween()
	var face := atan2(-to.x, -to.z)
	t.tween_property(player, "rotation:y", player.rotation.y + wrapf(face - player.rotation.y, -PI, PI), 0.35)
	await t.finished
	if chase:
		player.control_locked = false
		return
	_beat_walk = true
	await _auto_walk(p + to.normalized() * minf(1.6, to.length() + 0.6), 1.6)
	_beat_walk = false

func _rect_has(group: String, p: Vector3, margin := 0.0) -> bool:
	for r in layout["rooms"][group].values():
		if p.x >= r[0] - margin and p.x <= r[1] + margin and p.z >= r[2] - margin and p.z <= r[3] + margin:
			return true
	return false
func _in_norah(p: Vector3) -> bool: return _rect_has("norah", p)
func _in_louis(p: Vector3) -> bool: return _rect_has("louis", p)
func _in_up(p: Vector3) -> bool: return _rect_has("up", p)

func _surface(p: Vector3) -> String:
	if _in_norah(p) or _in_louis(p) or _in_up(p):
		return "carpet" if _rect_has("norah", p) and p.z < 2.0 else "tile"
	if p.x > -2.5 and p.x < 3.5 and p.z > -3.0 and p.z < 18.0:
		return "gravel"
	return "wet"

func _make_rain() -> void:
	rain = CPUParticles3D.new()
	rain.amount = 1000
	rain.lifetime = 1.0
	rain.preprocess = 1.0
	rain.local_coords = true
	rain.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	rain.emission_box_extents = Vector3(9, 0.5, 7)
	rain.direction = Vector3(0.12, -1, 0.05)
	rain.spread = 3.0
	rain.gravity = Vector3(0, -9.0, 0)
	rain.initial_velocity_min = 10.0
	rain.initial_velocity_max = 13.0
	var q := QuadMesh.new()
	q.size = Vector2(0.018, 0.42)
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = Color(0.7, 0.76, 0.86, 0.24)
	m.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
	m.billboard_keep_scale = true
	q.material = m
	rain.mesh = q
	world.add_child(rain)

func _update_rain() -> void:
	var c := Cameras.current
	if rain == null:
		return
	if c == null or not is_instance_valid(c):
		rain.visible = false
		return
	var p := c.global_position
	var indoors := (_in_norah(p) or _in_louis(p) or _in_up(p)) and p.y < 2.45
	rain.visible = not indoors
	if indoors:
		return
	var fwd := -c.global_transform.basis.z
	fwd.y = 0.0
	if fwd.length() < 0.01: fwd = Vector3.FORWARD
	rain.global_position = p + fwd.normalized() * 9.0 + Vector3(0, 6.0, 0)
	rain.rotation = Vector3.ZERO

func _music(name: String, db := -6.0, fade := 1.5) -> void:
	if _mus.is_empty():
		for i in 2:
			var p := AudioStreamPlayer.new()
			p.volume_db = -60.0
			add_child(p)
			_mus.append(p)
	if name == _mus_name:
		return
	_mus_name = name
	var old := _mus[0]
	var new := _mus[1]
	_mus.reverse()
	if old.playing:
		var t := create_tween()
		t.tween_property(old, "volume_db", -60.0, fade)
		t.tween_callback(old.stop)
	if name == "":
		return
	var path := "res://assets/audio/music/music_%s.wav" % name
	if not ResourceLoader.exists(path):
		return
	var w: AudioStreamWAV = load(path)
	w.loop_mode = AudioStreamWAV.LOOP_FORWARD
	w.loop_begin = 0
	w.loop_end = int(w.get_length() * w.mix_rate)
	new.stream = w
	new.volume_db = -60.0 if fade > 0.1 else db
	new.play()
	create_tween().tween_property(new, "volume_db", db, maxf(0.01, fade))

func _loop3d(nm: String, db: float) -> AudioStreamPlayer3D:
	var p := AudioStreamPlayer3D.new()
	var s: AudioStreamWAV = (load("res://assets/audio/%s.wav" % nm) as AudioStreamWAV).duplicate()
	s.loop_mode = AudioStreamWAV.LOOP_FORWARD
	s.loop_end = int(s.get_length() * s.mix_rate)
	p.stream = s
	p.volume_db = db
	p.unit_size = 5.0
	world.add_child(p)
	return p

func _attach_growl(target: Node3D) -> void:
	if growl.get_parent() != world:
		growl.reparent(world)
	if target:
		growl.reparent(target)
		growl.position = Vector3(0, 0.6, 0)
	if not growl.playing: growl.play()

func _sfx3d(nm: String, pos: Vector3, db := 0.0) -> void:
	var p := AudioStreamPlayer3D.new()
	p.stream = load("res://assets/audio/%s.wav" % nm)
	p.volume_db = db
	p.unit_size = 6.0
	world.add_child(p)
	p.global_position = pos
	p.play()
	p.finished.connect(p.queue_free)

func _snap(tag: String) -> void:
	await RenderingServer.frame_post_draw
	_shot_i += 1
	var img := get_viewport().get_texture().get_image()
	img.save_png("res://tests/captures/ch1_%03d_%s.png" % [_shot_i, tag])
