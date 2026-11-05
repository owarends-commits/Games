class_name AudioDirector
extends Node
## Ambience mixer + one-shot sound effects for a scene.
##   audio.mix("party")            # crossfade the ambience loops to a preset
##   audio.sfx("glass_crash", 0)   # fire-and-forget one-shot
## All sounds are placeholders from tools/make_audio.py; swap the .wav files freely.

const LOOPS := ["rain_ext_loop", "rain_int_loop", "room_tone_loop", "party_loop", "kids_loop", "panic_loop",
	"distant_chaos_loop", "fire_loop", "drone_loop", "engine_loop", "across_skitter_loop", "across_attack_loop",
	"car_alarm_loop", "wiper_loop", "growl_loop", "tv_static_loop", "steam_loop", "wind_loop"]
const SILENT := -60.0

## Preset name -> {loop: volume_db}. Loops not listed fade out.
const PRESETS := {
	"opening":  {"rain_ext_loop": -6.0, "drone_loop": -14.0},
	"exterior": {"rain_ext_loop": -5.0, "drone_loop": -26.0},
	"car":      {"rain_int_loop": -2.0, "rain_ext_loop": -20.0},
	"foyer":    {"rain_int_loop": -10.0, "rain_ext_loop": -22.0, "room_tone_loop": -20.0, "party_loop": -34.0},
	"hallway":  {"rain_int_loop": -14.0, "room_tone_loop": -16.0, "party_loop": -24.0, "kids_loop": -30.0},
	"party":    {"party_loop": -7.0, "kids_loop": -11.0, "rain_int_loop": -24.0, "room_tone_loop": -30.0},
	"stunned":  {"rain_int_loop": -20.0, "room_tone_loop": -26.0},
	"silence":  {"rain_int_loop": -31.0, "room_tone_loop": -36.0},
	"panic":    {"panic_loop": -3.0, "rain_int_loop": -24.0},
	"panic_hall": {"panic_loop": -10.0, "rain_int_loop": -16.0},
	"lot_chaos": {"rain_ext_loop": -6.0, "distant_chaos_loop": -7.0, "fire_loop": -15.0, "panic_loop": -16.0},
	"driving":  {"engine_loop": -6.0, "rain_ext_loop": -10.0, "distant_chaos_loop": -12.0, "fire_loop": -24.0},
	"in_car":   {"engine_loop": -10.0, "rain_int_loop": -6.0, "wiper_loop": -14.0, "distant_chaos_loop": -26.0},
	"in_car_quiet": {"engine_loop": -16.0, "rain_int_loop": -10.0, "wiper_loop": -18.0},
	"wreck":    {"rain_ext_loop": -7.0, "fire_loop": -10.0, "car_alarm_loop": -30.0, "distant_chaos_loop": -22.0},
	# chapter one
	"ch1_drive":   {"engine_loop": -11.0, "rain_int_loop": -6.0, "wiper_loop": -13.0},
	"ch1_drive_out": {"engine_loop": -12.0, "rain_ext_loop": -6.0},
	"ch1_yard":    {"rain_ext_loop": -6.0, "drone_loop": -32.0},
	"ch1_uneasy":  {"rain_ext_loop": -11.0, "drone_loop": -22.0},
	"ch1_silence": {"rain_ext_loop": -26.0},
	"ch1_chase":   {"rain_ext_loop": -6.0, "drone_loop": -18.0},
	"ch1_house":   {"rain_int_loop": -10.0, "room_tone_loop": -22.0, "drone_loop": -26.0},
	"ch1_bath":    {"rain_int_loop": -22.0, "room_tone_loop": -32.0},
	"ch1_after":   {"rain_int_loop": -14.0, "room_tone_loop": -26.0, "steam_loop": -24.0},
	"ch1_night":   {"rain_ext_loop": -7.0, "drone_loop": -26.0, "distant_chaos_loop": -34.0},
	"ch1_louis":   {"rain_int_loop": -12.0, "room_tone_loop": -24.0, "drone_loop": -24.0},
	"ch1_attic":   {"rain_int_loop": -8.0, "wind_loop": -10.0, "drone_loop": -20.0},
	"ch1_leaving": {"engine_loop": -10.0, "rain_int_loop": -7.0, "wiper_loop": -14.0, "distant_chaos_loop": -30.0},
}

var players := {}
var _pool: Array[AudioStreamPlayer] = []
var preset := ""

func _ready() -> void:
	for n in LOOPS:
		var p := AudioStreamPlayer.new()
		var s: AudioStreamWAV = load("res://assets/audio/%s.wav" % n)
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = int(s.get_length() * s.mix_rate)
		p.stream = s
		p.volume_db = SILENT
		p.name = n
		add_child(p)
		players[n] = p
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)

func mix(name: String, time := 1.0) -> void:
	if not PRESETS.has(name):
		push_warning("AudioDirector: no preset %s" % name)
		return
	preset = name
	set_levels(PRESETS[name], time)

func set_levels(levels: Dictionary, time := 1.0) -> void:
	for n in players:
		var p: AudioStreamPlayer = players[n]
		var target: float = levels.get(n, SILENT)
		if target > SILENT and not p.playing:
			p.play(randf() * p.stream.get_length())
		var tw := create_tween()
		tw.tween_property(p, "volume_db", target, max(0.01, time))
		if target <= SILENT:
			tw.tween_callback(p.stop)

func level(loop: String, db: float, time := 0.5) -> void:
	var p: AudioStreamPlayer = players[loop]
	if db > SILENT and not p.playing:
		p.play()
	create_tween().tween_property(p, "volume_db", db, time)

func sfx(name: String, volume_db := 0.0, pitch := 1.0) -> AudioStreamPlayer:
	var p: AudioStreamPlayer = null
	for q in _pool:
		if not q.playing:
			p = q
			break
	if p == null:
		p = _pool[0]
	p.stream = load("res://assets/audio/%s.wav" % name)
	p.volume_db = volume_db
	p.pitch_scale = pitch
	p.play()
	return p
