extends Node
## The prologue's ending: everyone into the BMW, out of the lot, through Kennedy, the Stranger's
## transformation in the back seat, the crash, and the last shot of the wreck.
##
## Exterior shots move the real BMW along StoryMarkers/DriveRoute through the 3D streets.
## In-car shots use the CarInterior set (far from town), the way fixed-camera games did it.
## Beats, in order:
##   board -> lot exit + curb -> [car_1 inside] -> corner onto the church street -> past the church
##   -> [car_church inside] -> store: an ACROSS hits the windshield -> [car_hit inside]
##   -> [car_reveal: mirror shots, the morph] -> the lunge -> the crash -> black -> the wreck.

var d: PrologueDirector
var car: Node3D
var route: PackedVector3Array = []
var wheels: Array = []
var _in_car := false
var _swerve := 0.0
var kenneth_c: Actor
var stranger_c: Actor
var adaline_c: Actor

func setup(director) -> void:
	d = director
	car = d.lnode("Exterior/Cars/KennethBMW")
	for m in d.lnode("StoryMarkers/DriveRoute").get_children():
		route.append((m as Node3D).global_position)
	for w in car.get_children():
		if String(w.name).begins_with("Wheel"):
			wheels.append(w)

func run() -> void:
	kenneth_c = d.A.get("CarKenneth")
	stranger_c = d.A.get("CarStranger")
	adaline_c = d.A.get("CarAdaline")
	stranger_c.visible = true     # hidden during the arrival drive (he isn't in the car yet)
	_own_material(stranger_c)
	# the burn on his right shoulder smokes the whole drive
	var smoke := (d.breach.hip_smoke as CPUParticles3D).duplicate() as CPUParticles3D
	smoke.emitting = false
	smoke.position = Vector3(0.13, 0.2, 0.09)
	stranger_c.attach(smoke, "chest")
	smoke.emitting = true
	await _board()
	# --- out of the lot, over the curb, east on Main
	await _drive(0.0, 11.0, 0.0, 15.0, func(p: Vector3):
		if p.z > 17.0 and Cameras.current != d.cam("CamDriveStreet"):
			Cameras.cut_to(d.cam("CamDriveStreet")))
	# --- inside: what were those?
	await _inside("CamCarFront", "in_car")
	kenneth_c.play("sit_drive")
	adaline_c.play("sit_cry")
	stranger_c.play("sit_beg")
	await _talk_with_cuts("car_1")
	# --- the corner, then past the church
	await _outside("CamDriveCorner")
	await _drive(11.0, 15.2, 12.0, 13.0, func(p: Vector3):
		if p.z > 41.0 and Cameras.current != d.cam("CamChurch"):
			Cameras.cut_to(d.cam("CamChurch"))
		if p.z > 40.0 and p.z < 41.0:
			d.A.RoadAcross2.visible = true
			d.A.RoadAcross2.walk_to([Vector3(54.4, 0, 58.0)], 1.0, "shamble", "quad_idle"))
	await _drive(15.2, 16.4, 13.0, 12.0)
	# --- inside: "That's my church."
	await _inside("CamCarFront", "in_car_quiet")
	stranger_c.play("sit_stare")
	adaline_c.play("sit_scared")
	await _talk_with_cuts("car_church")
	# --- the store: one of them throws itself at the windshield
	await _outside("CamStore")
	var hit := d.A.get("RoadAcross1") as Actor
	hit.visible = true
	hit.play("quad_idle")
	var hit_done := false
	await _drive(16.15, 18.0, 7.0, 8.0, func(p: Vector3):
		if not hit_done and p.z > 72.0:
			hit_done = true
			_windshield_hit(hit))
	# --- inside: the crack, the scream
	d.lnode("CarInterior/WindshieldCrack").visible = true
	await _inside("CamCarFront", "in_car")
	kenneth_c.play("sit_drive_tense")
	adaline_c.play("sit_scream")
	stranger_c.play("sit_stare")
	Cameras.shake(0.05, 0.3)
	await Dialogue.play("car_hit", true)
	# --- the mirror: the Stranger
	adaline_c.play("sit_scared")
	kenneth_c.play("sit_drive")
	d.audio.mix("in_car_quiet", 1.5)
	Dialogue.line_started.connect(_reveal_line, CONNECT_REFERENCE_COUNTED)
	await Dialogue.play("car_reveal_1")
	# the texture changes on a cut, never on screen
	Cameras.cut_to(d.cam("CamCarKenneth"))
	kenneth_c.play("sit_look_back")
	await d.wait(0.8)
	_set_morph_texture(stranger_c)
	stranger_c.play("morph_hold")
	Cameras.cut_to(d.cam("CamCarMirror"))
	d.audio.sfx("heartbeat_hit", -4.0)
	await Dialogue.play("car_reveal_2")
	Dialogue.line_started.disconnect(_reveal_line)
	# --- the lunge
	Cameras.cut_to(d.cam("CamCarFront"))
	stranger_c.play_once("morph_lunge")
	adaline_c.play("sit_scream")
	d.audio.sfx("across_shriek", 0.0, 0.7)
	d.audio.sfx("scream_2", -2.0, 1.3)
	await d.wait(0.32)
	HUD.flash(2, Color(0.7, 0.0, 0.0))
	_in_car = false
	# --- the crash
	await _outside("CamCrash", "driving")
	_swerve = 0.0
	await _drive(18.0, 20.85, 15.0, 15.0, func(p: Vector3):
		_swerve = sin(Time.get_ticks_msec() * 0.012) * 0.35 * clamp((p.z - 86.0) / 6.0, 0.0, 1.0))
	d.audio.sfx("car_crash", 3.0)
	d.audio.sfx("tire_screech", -2.0)
	HUD.flash(3)
	Cameras.shake(0.15, 0.4)
	var tw := create_tween()
	tw.tween_property(car, "rotation:x", 0.12, 0.08)
	tw.tween_property(car, "rotation:x", 0.0, 0.25)
	await d.wait(0.12)
	HUD.black()
	d.audio.set_levels({"rain_ext_loop": -12.0}, 0.05)
	await d.wait(2.4)
	await _wreck()

# ================================================================== pieces
func _board() -> void:
	var ada: Actor = d.A.Adaline
	var st: Actor = d.A.Stranger
	var rear := car.global_transform * Vector3(1.05, 0, -0.6)    # rear door, driver side (+X)
	var front := car.global_transform * Vector3(1.05, 0, 0.5)
	ada.walk_to([rear], 2.6, "run")
	st.walk_to([rear + Vector3(0.4, 0, -0.6)], 2.4, "run")
	d.player.model.play("run")
	var tw := create_tween()
	tw.tween_property(d.player, "global_position", front, 0.7)
	await d.wait(0.75)
	d.audio.sfx("car_door", -2.0)
	d.player.visible = false
	await d.wait(0.35)
	ada.visible = false
	d.audio.sfx("car_door", -3.0, 0.95)
	await d.wait(0.4)
	st.visible = false
	d.audio.sfx("car_door", -2.0, 1.05)
	await d.wait(0.3)
	_headlights()
	d.audio.sfx("engine_start", -2.0)
	Cameras.cut_to(d.cam("Cam7_LotAftermath"))
	await d.wait(1.3)
	d.audio.level("engine_loop", -6.0, 0.3)
	d.audio.sfx("engine_rev", -1.0)

func _headlights() -> void:
	for sx in [-0.6, 0.6]:
		var s := SpotLight3D.new()
		s.light_color = Color(1, 0.95, 0.8)
		s.light_energy = 3.0
		s.spot_range = 22.0
		s.spot_angle = 28.0
		car.add_child(s)
		s.position = Vector3(sx, 0.7, 2.25)
		s.rotation.y = PI      # SpotLight shines down its -Z; the car's front is +Z
		s.rotation.x = -0.08

func _inside(cam_name: String, mix := "in_car") -> void:
	Cameras.cut_to(d.cam(cam_name))
	d.audio.mix(mix, 0.3)
	if not _in_car:
		_in_car = true
		_cabin_motion()
	await d.wait(0.4)

func _outside(cam_name: String, mix := "driving") -> void:
	_in_car = false
	Cameras.cut_to(d.cam(cam_name))
	d.audio.mix(mix, 0.3)
	await get_tree().process_frame

## Streetlights sweeping through the cabin and the wiper going, while we're inside.
func _cabin_motion() -> void:
	var light := d.lnode("CarInterior/PassingLight") as OmniLight3D
	var wiper := d.lnode("CarInterior/Wiper") as Node3D
	var o := Vector3(200, -200, 200)
	var t := 0.0
	var side := 1.0
	while _in_car:
		var dt := get_process_delta_time()
		t += dt
		var k := fmod(t, 1.7) / 1.7
		if k < dt / 1.7:
			side = -side
		light.global_position = o + Vector3(1.7 * side, 2.2, lerp(-4.0, 4.0, k))
		light.light_energy = 2.6 * sin(k * PI)
		wiper.rotation.z = -0.15 + 1.5 * (0.5 - 0.5 * cos(t * 3.4))
		await get_tree().process_frame
	light.light_energy = 0.0

## Normal dialogue (the player advances), with the camera cutting to whoever is speaking.
func _talk_with_cuts(conv: String) -> void:
	var f := func(_c: String, _i: int, line: Dictionary):
		match line.get("who", ""):
			"kenneth": Cameras.cut_to(d.cam("CamCarKenneth"))
			"adaline": Cameras.cut_to(_back_two_shot() if stranger_c and stranger_c.visible else d.cam("CamCarAdaline"))
			"stranger": Cameras.cut_to(d.cam("CamCarMirror") if conv == "car_church" else d.cam("CamCarFront"))
	Dialogue.line_started.connect(f)
	await Dialogue.play(conv)
	Dialogue.line_started.disconnect(f)

## Adaline talking to the man beside her: CamCarAdaline looks down at her alone and cut his head off. This one
## sits over the front passenger seat and takes in both of them, her face and his, his smoking shoulder between.
var _two: Camera3D
func _back_two_shot() -> Camera3D:
	if _two: return _two
	var a: Vector3 = d.mk("CarSeatAdaline")
	var st: Vector3 = d.mk("CarSeatStranger")
	var k: Vector3 = d.mk("CarSeatKenneth")
	var ref := d.cam("CamCarAdaline")
	_two = Camera3D.new()
	_two.name = "CamCarBackTwo"
	ref.get_parent().add_child(_two)
	# in the gap between the front seats (over a seat back, the seat blocks her: she's small)
	_two.global_position = Vector3(lerpf(k.x, a.x, 0.5) + 0.05, a.y + 1.3, k.z + 0.12)
	_two.look_at(a.lerp(st, 0.4) + Vector3(0, 0.92, 0), Vector3.UP)
	_two.fov = 66.0
	_two.near = 0.03
	_two.environment = ref.environment
	return _two

func _reveal_line(conv: String, i: int, line: Dictionary) -> void:
	if conv == "car_reveal_1":
		match i:
			0:
				Cameras.cut_to(d.cam("CamCarKenneth"))
				kenneth_c.play("sit_look_back")
			1:
				Cameras.cut_to(d.cam("CamCarMirror"))
				stranger_c.play_once("morph")
				d.audio.sfx("morph_cracks", -4.0)
			2:
				Cameras.cut_to(d.cam("CamCarKenneth"))
				kenneth_c.play("sit_drive_tense")
			3:
				Cameras.cut_to(d.cam("CamCarMirror"))
	elif conv == "car_reveal_2" and line.get("who", "") == "adaline":
		Cameras.cut_to(d.cam("CamCarAdaline"))
		adaline_c.play("sit_scream")

func _own_material(a: Actor) -> void:
	if a == null or a.skeleton == null:
		return
	for mi in a.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		var cur := m.get_surface_override_material(0)
		if cur:
			m.set_surface_override_material(0, cur.duplicate())

func _set_morph_texture(a: Actor) -> void:
	for mi in a.find_children("*", "MeshInstance3D", true, false):
		var m := (mi as MeshInstance3D).get_surface_override_material(0) as ShaderMaterial
		if m:
			m.set_shader_parameter("albedo_tex", load("res://assets/characters/stranger_morph.png"))

func _windshield_hit(hit: Actor) -> void:
	hit.global_position = d.mk("RoadAcrossA")
	hit.snap("lunge")
	d.audio.sfx("across_shriek", -2.0, 1.1)
	var t := 0.0
	var start := hit.global_position
	while t < 0.3:
		t += get_physics_process_delta_time()
		var target := car.global_transform * Vector3(0.0, 1.05, 1.5)
		hit.global_position = start.lerp(target, t / 0.3)
		await get_tree().physics_frame
	d.audio.sfx("windshield_thump", 2.0)
	Cameras.shake(0.12, 0.3)
	hit.play("attack")
	t = 0.0
	while t < 0.55:
		t += get_physics_process_delta_time()
		hit.global_position = car.global_transform * Vector3(0.0, 1.05, 1.5)
		hit.rotation.y = car.rotation.y
		await get_tree().physics_frame
	# thrown off the hood into the road
	var off := car.global_transform * Vector3(-3.0, 0.0, 1.0)
	hit.play_once("fall")
	var tw := create_tween()
	tw.tween_property(hit, "global_position", off, 0.35).set_ease(Tween.EASE_OUT)

func _sample(t: float) -> Vector3:
	# Catmull-Rom through the route markers, t in [0, n-1]
	var n := route.size()
	var i: int = clamp(int(t), 0, n - 2)
	var u := t - i
	var p0 := route[max(i - 1, 0)]
	var p1 := route[i]
	var p2 := route[i + 1]
	var p3 := route[min(i + 2, n - 1)]
	return 0.5 * ((2.0 * p1) + (-p0 + p2) * u + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * u * u + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * u * u * u)

## Moves the BMW from route position t0 to t1, speeding from v0 to v1 (m/s).
func _drive(t0: float, t1: float, v0: float, v1: float, on_tick := Callable()) -> void:
	var n := route.size()
	var t := t0
	var speed := v0
	var bumped := false
	var screeched := false
	while t < min(t1, n - 1.001):
		var dt := get_physics_process_delta_time()
		speed = move_toward(speed, v1, 9.0 * dt)
		var seg := route[min(int(t) + 1, n - 1)].distance_to(route[int(t)])
		t += speed * dt / max(seg, 0.5)
		var p := _sample(t)
		var ahead := _sample(min(t + 0.08, n - 1.0))
		var dir := ahead - p
		dir.y = 0.0
		var bump := 0.0
		var pitch := 0.0
		if p.z > 19.9 and p.z < 21.6 and p.x < 0.0:          # over the curb out of the lot
			var k := (p.z - 19.9) / 1.7
			bump = sin(k * PI) * 0.32
			pitch = -cos(k * PI) * 0.12
			if not bumped:
				bumped = true
				d.audio.sfx("curb_bump", 0.0)
				Cameras.shake(0.05, 0.2)
		car.global_position = Vector3(p.x, bump, p.z)
		if dir.length() > 0.01:
			car.rotation = Vector3(pitch, atan2(dir.x, dir.z) + _swerve, 0.0)
		for w in wheels:
			(w as Node3D).rotate_object_local(Vector3.UP, speed * dt / 0.32)
		if not screeched and ((p.z > 22.8 and p.x < 0.0) or (p.x > 55.0 and p.z < 31.0)):
			screeched = true
			d.audio.sfx("tire_screech", -3.0)
		if on_tick.is_valid():
			on_tick.call(p)
		await get_tree().physics_frame

## The last shot: the BMW against the pole, burning; Kenneth on the concrete, out cold, lit by
## the fire; both rear doors open, the back seat empty; Amelia's present in the road.
func _wreck() -> void:
	var pole := Vector3(64.2, 0, 104.2)
	car.global_position = Vector3(63.3, 0, 102.6)
	var to := pole - car.global_position
	car.rotation = Vector3(0.0, atan2(to.x, to.z), 0.04)
	_open_doors()
	var fire := d.lnode("Aftermath/FireWreck") as Node3D
	fire.visible = true
	fire.global_position = car.global_transform * Vector3(0, 0.9, 1.7)
	var down := d.A.get("KennethDown") as Actor
	down.visible = true
	down.global_position = d.mk("KennethDownSpot")
	down.play("down")
	var glow := OmniLight3D.new()
	glow.light_color = Color(1.0, 0.5, 0.2)
	glow.light_energy = 2.6
	glow.omni_range = 4.5
	glow.set_script(load("res://scripts/environments/flicker_light.gd"))
	glow.set("base_energy", 2.6)
	glow.set("flicker_chance", 5.0)
	glow.set("dropout_chance", 0.0)
	d.level.add_child(glow)
	glow.global_position = d.mk("KennethDownSpot") + Vector3(0.8, 0.9, -1.4)
	_present(d.mk("PresentSpot"))
	for n in ["RoadAcross1", "RoadAcross2", "RoadAcross3"]:
		(d.A.get(n) as Node3D).visible = false
	d.audio.mix("wreck", 2.5)
	d.audio.sfx("heartbeat_hit", -6.0, 0.8)
	HUD.letterbox(true, 0.01)
	d.crane(d.cam("CamFinalStart"), d.cam("CamFinalEnd"), 10.0)
	await HUD.fade_in(3.5)
	await d.wait(7.5)
	await HUD.fade_out(2.5)
	HUD.letterbox(false, 0.1)

func _open_doors() -> void:
	var m: Material = load("res://materials/car_black.tres")
	for spec in [[0.55, 1.0], [-0.65, 1.0], [-0.65, -1.0]]:     # driver door, both rear doors
		var z0: float = spec[0]
		var sx: float = spec[1]
		var door := MeshInstance3D.new()   # placed at the hinge, swung open
		var b := BoxMesh.new()
		b.size = Vector3(0.06, 0.62, 1.05)
		b.material = m
		door.mesh = b
		var hinge := Node3D.new()
		car.add_child(hinge)
		hinge.position = Vector3(0.92 * sx, 0.6, z0 + 0.52)
		hinge.add_child(door)
		door.position = Vector3(0, 0, -0.52)
		hinge.rotation.y = -deg_to_rad((62 if z0 > 0 else 75) * sx)   # swing outward

func _present(p: Vector3) -> void:
	var root := Node3D.new()
	d.level.add_child(root)
	root.global_position = p
	root.rotation = Vector3(0.0, 0.5, 0.18)
	for spec in [[Vector3(0.26, 0.18, 0.22), Vector3(0, 0.09, 0), Color(0.9, 0.45, 0.65)],
			[Vector3(0.05, 0.19, 0.225), Vector3(0, 0.095, 0), Color(1.0, 0.85, 0.2)],
			[Vector3(0.265, 0.19, 0.05), Vector3(0, 0.095, 0), Color(1.0, 0.85, 0.2)]]:
		var mi := MeshInstance3D.new()
		var b := BoxMesh.new()
		b.size = spec[0]
		var mat := ShaderMaterial.new()
		mat.shader = load("res://shaders/ps1_surface.gdshader")
		mat.set_shader_parameter("albedo", spec[2])
		mat.set_shader_parameter("world_uv", false)
		b.material = mat
		mi.mesh = b
		mi.position = spec[1]
		root.add_child(mi)
