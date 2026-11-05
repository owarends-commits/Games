class_name TalkModifier
extends SkeletonModifier3D
## Talking, on top of whatever the body is doing. Dialogue (scripts/dialogue/dialogue_manager.gd) drives it:
##   begin(mood) when this character's line starts, mouth(open 0..1, emphasis 0..1) as the text types out, end().
## - the jaw opens and closes with the syllables (wide on vowels, shut on pauses and punctuation)
## - the head nods, tilts and turns a little with the rhythm, harder on emphasis
## - standing (idle / talk / listen poses), the hands gesture, differently by mood:
##     neutral/sad: an open hand turning out, now and then; happy/excited: both hands, livelier;
##     angry/shout: short chopping beats on the stressed words; scared/panic: hands held up and shaking;
##     cry: a hand to the face, shoulders shaking

const JAW_OPEN_DEG := 16.0
const GESTURE_ANIMS := ["idle", "talk", "listen", "stand", "scared", "idle_hand", "ready", "brood", "lean_look", "beg", "shout", "cry"]

var model: CharacterModel
var talking := false
var mood := "neutral"
var _open := 0.0          ## current jaw (smoothed)
var _want := 0.0
var _emph := 0.0
var _amt := 0.0           ## how much talking motion is blended in (eases in and out)
var _t := 0.0
var _seed := 0.0
var _b := {}

func _ready() -> void:
	_seed = randf() * 100.0

func begin(m: String) -> void:
	talking = true
	mood = m if m != "" else "neutral"

func mouth(v: float, emphasis := 0.0) -> void:
	_want = clampf(v, 0.0, 1.0)
	_emph = maxf(_emph, emphasis)

func end() -> void:
	talking = false
	_want = 0.0

func _bone(n: String) -> int:
	if not _b.has(n):
		var sk := get_skeleton()
		_b[n] = sk.find_bone(n) if sk else -1
	return _b[n]

func _rot(bone: String, x: float, y := 0.0, z := 0.0) -> void:
	var i := _bone(bone)
	if i < 0: return
	var sk := get_skeleton()
	var q := Quaternion.from_euler(Vector3(deg_to_rad(x), deg_to_rad(y), deg_to_rad(z)))
	sk.set_bone_pose_rotation(i, sk.get_bone_pose_rotation(i) * q)

func _process_modification() -> void:
	var dt := get_process_delta_time()
	_t += dt
	_amt = move_toward(_amt, 1.0 if talking else 0.0, dt * 3.0)
	_open = lerpf(_open, _want, 1.0 - exp(-dt * 28.0))
	_emph = move_toward(_emph, 0.0, dt * 1.6)
	if _amt <= 0.001 and _open <= 0.001:
		return
	var t := _t + _seed
	# the jaw (opening drops the chin: negative X on this rig)
	_rot("jaw", -JAW_OPEN_DEG * _open)
	# head: a small nod with the syllables, a slow tilt and turn, a lift on emphasis
	var nod := sin(t * 5.3) * 1.6 * _open + _emph * 5.0
	var a := _amt
	match mood:
		"scared", "panic", "fear":
			_rot("head", (nod * 0.5 + sin(t * 23.0) * 0.8) * a, sin(t * 1.7) * 6.0 * a, sin(t * 19.0) * 0.8 * a)
		"cry", "sad":
			_rot("head", (-8.0 + nod * 0.6) * a, sin(t * 0.9) * 4.0 * a, 4.0 * a)
			_rot("chest", sin(t * 9.0) * 1.2 * a)
		"angry", "shout":
			_rot("head", (nod * 1.6 - 3.0) * a, sin(t * 2.1) * 3.0 * a, 0.0)
		_:
			_rot("head", nod * a, sin(t * 0.8) * 4.0 * a, sin(t * 0.55) * 3.0 * a)
	# hands, only while standing (walking, running, sitting etc. keep their own arms)
	if model == null or not (model.current in GESTURE_ANIMS):
		return
	var g := a
	match mood:
		"scared", "panic", "fear":
			var sh := sin(t * 21.0) * 2.5
			_rot("upperarm.R", 38.0 * g, 0, -12.0 * g); _rot("forearm.R", (70.0 + sh) * g)
			_rot("upperarm.L", 34.0 * g, 0, 12.0 * g); _rot("forearm.L", (66.0 - sh) * g)
		"cry", "sad":
			_rot("upperarm.R", 30.0 * g, 0, -16.0 * g); _rot("forearm.R", 105.0 * g); _rot("hand.R", -20.0 * g)
		"angry", "shout":
			var beat := pow(maxf(0.0, sin(t * 6.5)), 4.0) * (0.5 + _emph)
			_rot("upperarm.R", (24.0 + 16.0 * beat) * g, 0, -6.0 * g); _rot("forearm.R", (40.0 + 25.0 * beat) * g); _rot("hand.R", -12.0 * beat * g)
		"happy", "excited", "laugh":
			var w := sin(t * 3.1)
			_rot("upperarm.R", (22.0 + 8.0 * w) * g, 0, -10.0 * g); _rot("forearm.R", (48.0 + 10.0 * w) * g)
			_rot("upperarm.L", (18.0 - 8.0 * w) * g, 0, 10.0 * g); _rot("forearm.L", (42.0 - 10.0 * w) * g)
		_:
			# now and then an open hand turns out with the point being made
			var cyc := fmod(t * 0.45, 1.0)
			var up := sin(clampf(cyc / 0.6, 0.0, 1.0) * PI)
			_rot("upperarm.R", (8.0 + 20.0 * up) * g, 0, -6.0 * up * g); _rot("forearm.R", (20.0 + 40.0 * up) * g); _rot("hand.R", 0, -30.0 * up * g, 0)
