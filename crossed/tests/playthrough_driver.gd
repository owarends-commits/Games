extends Node
## Plays the whole prologue by itself: an autopilot steers Kenneth with the real input
## actions, presses interact at the right spots, and dialogue advances on its own.
## Saves screenshots to tests/captures/play_*.png and a log to tests/playthrough_log.txt.
##   xvfb-run godot --path . --fixed-fps 60 res://tests/playthrough.tscn -- autoplay

var director: PrologueDirector
var player: Player
var log_lines: PackedStringArray = []
var shot := 0
var t := 0.0
var _last_phase := -1
var _last_obj := ""
var _route: Array = []
var _route_name := ""
var _next_shot := 3.0
var _interact_cd := 0.0
var _stuck_t := 0.0
var _last_pos := Vector3.ZERO
var _linger_t := 0.0

func _ready() -> void:
	director = get_parent().get_node("Prologue")
	player = director.get_node("Screen/World/Player")
	director.breach.state_changed.connect(func(s): _log("breach state: %s" % director.breach.State.keys()[s]); _shot("breach_%s" % director.breach.State.keys()[s].to_lower()))
	Dialogue.line_started.connect(func(c, i, l): _log("  [%s #%d] %s: %s" % [c, i, l.get("who", ""), l.get("text", "")]))
	Cameras.camera_changed.connect(func(o, n): _log("  camera -> %s" % (n.name if n else "-")))

func _log(s: String) -> void:
	var line := "%6.1fs  %s" % [t, s]
	print(line)
	log_lines.append(line)

func _shot(tag: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png("res://tests/captures/play_%03d_%s.png" % [shot, tag])
	shot += 1

func _physics_process(delta: float) -> void:
	t += delta
	_interact_cd -= delta
	var ph: int = director.phase
	if ph != _last_phase:
		_last_phase = ph
		_log("PHASE %s" % PrologueDirector.Phase.keys()[ph])
		_shot("phase_%s" % PrologueDirector.Phase.keys()[ph].to_lower())
	if director.objective_id != _last_obj:
		_last_obj = director.objective_id
		_log("objective: %s" % _last_obj)
		_route = []
		_route_name = ""
	if t >= _next_shot:
		_next_shot = t + (1.5 if ph >= PrologueDirector.Phase.REUNION else 8.0)
		_shot("t%03d" % int(t))
	if ph == PrologueDirector.Phase.END:
		_finish()
		return
	if t > 600.0:
		_log("TIMEOUT")
		_finish()
		return
	_drive(delta)

func _finish() -> void:
	set_physics_process(false)
	_release()
	await _shot("end")
	var fa := FileAccess.open("res://tests/playthrough_log.txt", FileAccess.WRITE)
	fa.store_string("\n".join(log_lines))
	_log("DONE")
	get_tree().quit()

func _release() -> void:
	for a in ["move_forward", "move_back", "move_left", "move_right", "run"]:
		Input.action_release(a)

func _press_interact() -> void:
	if _interact_cd > 0.0:
		return
	_interact_cd = 1.0
	var e := InputEventAction.new()
	e.action = "interact"
	e.pressed = true
	Input.parse_input_event(e)
	await get_tree().physics_frame
	var r := InputEventAction.new()
	r.action = "interact"
	r.pressed = false
	Input.parse_input_event(r)

func _set_route(name: String, pts: Array) -> void:
	if _route_name != name:
		_route_name = name
		_route = pts.duplicate()
		# resume: skip points we've already passed
		var p := player.global_position
		var best := 0
		for i in _route.size():
			if p.distance_to(_route[i]) < p.distance_to(_route[best]):
				best = i
		if best + 1 < _route.size() and p.distance_to(_route[best + 1]) < (_route[best] as Vector3).distance_to(_route[best + 1]):
			best += 1
		_route = _route.slice(best)
		_log("autopilot route: %s" % name)

func _drive(delta: float) -> void:
	_release()
	if player.locked():
		return
	var ph: int = director.phase
	var obj := director.objective_id
	var p := player.global_position
	match ph:
		PrologueDirector.Phase.WALK_IN:
			_set_route("walk_in", [Vector3(-3.4, 0, 2.6), Vector3(0, 0, 1.6), Vector3(0, 0, -2.0), Vector3(0.1, 0, -8.0), Vector3(0.15, 0, -14.4), Vector3(-1.7, 0, -14.5)])
		PrologueDirector.Phase.PARTY:
			if obj == "punch":
				_set_route("punch", [Vector3(-2.6, 0, -13.6), Vector3(-2.45, 0, -11.6)])
				if _route.is_empty():
					if _face(Vector3(-1.75, 0, -11.6)):
						_press_interact()
					return
			elif obj == "mingle":
				_set_route("marcus", [Vector3(-2.6, 0, -12.0)])
				if _route.is_empty():
					if _face(Vector3(-3.4, 0, -12.6)):
						_press_interact()
					return
		PrologueDirector.Phase.ESCAPE:
			if "linger" in OS.get_cmdline_user_args():
				_linger_t += delta
				if _linger_t < 14.0:
					return   # stand still in the room: let the ACROSS catch Kenneth
			_set_route("escape", [Vector3(-2.6, 0, -14.4), Vector3(-1.0, 0, -14.5), Vector3(0.1, 0, -13.0), Vector3(0.1, 0, -4.0), Vector3(0.0, 0, -1.0), Vector3(0.0, 0, 1.2)])
		PrologueDirector.Phase.LOT:
			_set_route("lot", [Vector3(-1.5, 0, 1.8), Vector3(-4.4, 0, 2.6)])
		_:
			return
	if _route.is_empty():
		return
	var target: Vector3 = _route[0]
	var to := Vector3(target.x - p.x, 0, target.z - p.z)
	if to.length() < 0.3:
		_route.pop_front()
		return
	var desired := atan2(-to.x, -to.z)
	var diff := wrapf(desired - player.rotation.y, -PI, PI)
	if abs(diff) > 0.06:
		Input.action_press("move_left" if diff > 0 else "move_right")
	if abs(diff) < 0.5:
		Input.action_press("move_forward")
		if ph == PrologueDirector.Phase.ESCAPE or ph == PrologueDirector.Phase.LOT:
			Input.action_press("run")
	# unstick: if we haven't moved for 2 s, log it once
	if p.distance_to(_last_pos) < 0.005:
		_stuck_t += delta
		if _stuck_t > 2.0:
			_log("autopilot stuck at %s heading to %s" % [p, target])
			_stuck_t = -999.0
	else:
		_stuck_t = max(_stuck_t, 0.0)
	_last_pos = p

func _face(point: Vector3) -> bool:
	var to := point - player.global_position
	var desired := atan2(-to.x, -to.z)
	var diff := wrapf(desired - player.rotation.y, -PI, PI)
	if abs(diff) > 0.08:
		Input.action_press("move_left" if diff > 0 else "move_right")
		return false
	return true
