extends Node
## Autoload "Dialogue": every spoken line in the game goes through here, one speaker at a time,
## in the HUD dialogue box with the speaker's portrait.
##
##   await Dialogue.play("party_entry")              # normal talk: the player presses E to advance
##   await Dialogue.play("breach_inspect", true)      # cutscene timing: lines advance by themselves
##   Dialogue.say_line("adaline", "Daddy!", "cry")   # a single line during gameplay: queued, auto-advances,
##                                                   # and the player keeps control while it shows
##
## Portraits come from res://assets/portraits/<portrait>_<mood>.png; while a line types out the
## portrait alternates with <portrait>_<mood>_talk.png for the mouth flaps. Kenneth speaks from the
## left corner, everyone else from the right (mirrored), as in the portrait spec.

signal line_started(conversation: String, index: int, line: Dictionary)
signal conversation_finished(conversation: String)

const FILES := ["res://dialogue/prologue.json", "res://dialogue/chapter1.json"]
const CHARS_PER_SEC := 42.0
const FLAP_TIME := 0.11
const LEFT_SPEAKERS := ["kenneth", "norah"]

var speakers := {}
var conversations := {}
var barks := {}
var active := false
var locks_player := false      ## true while a conversation that should freeze Kenneth is showing
var current_id := ""
var autoplay := false          ## tests: lines advance by themselves
var ended_msec := 0            ## when the last conversation closed (stops the closing press re-triggering a talk)
var _interrupted := false
var _auto := false
var _queued := 0
var _blip: AudioStreamPlayer
var _next: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for path in FILES:
		var data = JSON.parse_string(FileAccess.get_file_as_string(path))
		if data == null:
			push_error("Dialogue: could not parse %s" % path)
			continue
		speakers.merge(data.get("speakers", {}), true)
		conversations.merge(data.get("conversations", {}), true)
		barks.merge(data.get("barks", {}), true)
	_blip = AudioStreamPlayer.new()
	_blip.stream = load("res://assets/audio/ui_blip.wav")
	_blip.volume_db = -14.0
	add_child(_blip)
	_next = AudioStreamPlayer.new()
	_next.stream = load("res://assets/audio/ui_next.wav")
	_next.volume_db = -12.0
	add_child(_next)

func has(id: String) -> bool:
	return conversations.has(id)

func speaker(who: String) -> Dictionary:
	return speakers.get(who, {"name": "Stranger"})

func portrait_for(who: String, mood: String, talking := false) -> Texture2D:
	var sp := speaker(who)
	if not sp.has("portrait"):
		return null
	var path := "res://assets/portraits/%s_%s%s.png" % [sp.portrait, mood, "_talk" if talking else ""]
	if not ResourceLoader.exists(path):
		path = "res://assets/portraits/%s_neutral%s.png" % [sp.portrait, "_talk" if talking else ""]
	return load(path) if ResourceLoader.exists(path) else null

## Stops the conversation in progress mid-line (the window breaking does this).
func interrupt() -> void:
	if active:
		_interrupted = true

## Plays a conversation from the JSON. auto = lines advance on their own (cutscenes);
## locks = Kenneth can't move while it shows.
func play(id: String, auto := false, locks := true) -> void:
	if not conversations.has(id):
		push_warning("Dialogue: no conversation '%s'" % id)
		return
	await play_lines(conversations[id], id, auto, locks)

func play_lines(lines: Array, id := "lines", auto := false, locks := true) -> void:
	_queued += 1
	while active:
		await get_tree().process_frame
	_queued -= 1
	active = true
	locks_player = locks
	current_id = id
	_auto = auto
	_interrupted = false
	if locks:
		HUD.show_prompt("")
	HUD.show_box(true)
	for i in lines.size():
		var line: Dictionary = lines[i]
		line_started.emit(id, i, line)
		await _play_line(line)
		if _interrupted:
			break
	HUD.show_box(false)
	active = false
	locks_player = false
	current_id = ""
	ended_msec = Time.get_ticks_msec()
	conversation_finished.emit(id)

## One line during gameplay (shouts in the panic, voices in the lot). Waits its turn, shows in
## the normal box with a portrait, moves on by itself, and never takes control from the player.
func say_line(who: String, text: String, mood := "neutral") -> void:
	if _queued >= 2:
		return   # don't let shouts pile up behind each other
	await play_lines([{"who": who, "text": text, "mood": mood}], "line", true, false)

## Line i of a group in the JSON "barks" table ([who, text, mood]). i < 0 picks one at random.
func bark_group(group: String, i := -1) -> void:
	var g: Array = barks.get(group, [])
	if g.is_empty():
		return
	var e: Array = g[randi() % g.size()] if i < 0 else g[i % g.size()]
	say_line(e[0], e[1], e[2] if e.size() > 2 else "neutral")

func _play_line(line: Dictionary) -> void:
	var who: String = line.get("who", "")
	var mood: String = line.get("mood", "neutral")
	var sp := speaker(who)
	HUD.set_speaker(line.get("name", sp.get("name", "Stranger")), Color(sp.get("color", "#f0d898")), null, not (who in LEFT_SPEAKERS))
	var talker := _talker(who)
	if talker: talker.talk.begin(mood)
	var text: String = line.get("text", "")
	HUD.text_label.text = text
	HUD.text_label.visible_characters = 0
	HUD.more_arrow.visible = false
	var speed: float = CHARS_PER_SEC * float(line.get("speed", 1.0))
	var pitch: float = float(sp.get("blip", 1.0))
	var shown := 0.0
	var flap := 0.0
	var mouth_open := false
	var total := text.length()
	var cut_at: int = int(total * float(line.get("cut", 1.0)))   # lines that get interrupted
	var can_skip := locks_player and not _auto
	await get_tree().process_frame
	while HUD.text_label.visible_characters < total:
		if HUD.pause_menu and HUD.pause_menu.open:      # the pause menu stops conversations too
			await get_tree().process_frame
			continue
		var dt := get_process_delta_time()
		if can_skip and _advance_pressed() and shown > 2.0:
			shown = total
		else:
			var c := text[min(int(shown), total - 1)]
			shown += dt * speed * (0.35 if c in ".,!?—-" else 1.0)
		var vis: int = min(total, int(shown))
		if vis != HUD.text_label.visible_characters and vis % 2 == 0 and text[vis - 1] != " ":
			_blip.pitch_scale = pitch * randf_range(0.95, 1.05)
			_blip.play()
		HUD.text_label.visible_characters = vis
		flap += dt
		if flap >= FLAP_TIME:
			flap = 0.0
			mouth_open = not mouth_open
			if talker:
				# the jaw follows the letters: wide on vowels, shut on b/m/p and the pauses
				var cc := text[max(0, vis - 1)].to_lower()
				var o := 0.35
				if cc in "aeiouy": o = 0.7 + 0.3 * randf()
				elif cc in "bmp": o = 0.0
				elif cc in " .,!?—-;:": o = 0.05
				if not mouth_open: o *= 0.3
				talker.talk.mouth(o, 1.0 if cc in "!?" else 0.0)
		if (vis >= cut_at and line.has("cut")) or _interrupted:
			if talker: talker.talk.end()
			return
		await get_tree().process_frame
	if talker: talker.talk.end()
	if _auto or line.has("auto"):
		var t := float(line.get("auto", clamp(0.9 + total * 0.03, 1.1, 3.2)))
		while t > 0.0 and not _interrupted:
			if not (HUD.pause_menu and HUD.pause_menu.open): t -= get_process_delta_time()
			await get_tree().process_frame
		return
	HUD.more_arrow.visible = true
	var wait := 0.0
	while not _interrupted:
		if HUD.pause_menu and HUD.pause_menu.open:
			await get_tree().process_frame
			continue
		wait += get_process_delta_time()
		if _advance_pressed() or (autoplay and wait > 0.6):
			break
		await get_tree().process_frame
	HUD.more_arrow.visible = false
	_next.play()

## The speaker's character in the scene (a CharacterModel in the "talkers" group), the nearest visible one.
func _talker(who: String) -> CharacterModel:
	if who == "": return null
	var best: CharacterModel = null
	var bd := INF
	var cam := get_viewport().get_camera_3d()
	for n in get_tree().get_nodes_in_group("talkers"):
		var c := n as CharacterModel
		if c == null or c.talk == null or not c.is_visible_in_tree() or c.speaker_id() != who: continue
		var d := 0.0
		if cam: d = cam.global_position.distance_to(c.global_position)
		if d < bd:
			bd = d; best = c
	return best

func _advance_pressed() -> bool:
	return Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("ui_accept")

## Kept for older call sites: a single gameplay line.
func bark(text: String, who := "", _seconds := 2.6) -> void:
	say_line(who, text)
