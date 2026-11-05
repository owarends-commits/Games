class_name TrackingCamera
extends Camera3D
## A camera that stays where it's placed and turns to keep the player in frame (the Map Designer's
## "tracking" type). It never turns more than `track_max` degrees away from its placed heading.
## A cutscene can aim it at something else with `look_target`, or freeze it with `frozen`.

@export var base_yaw := 0.0        ## degrees; 0 = north (-Z), positive = turning left (Godot)
@export var base_pitch := -15.0
@export var track_max := 60.0
@export var aim_height := 1.3      ## where on the target to aim (her chest, not her feet)
@export var smoothing := 5.0
@export var crane := Vector3.ZERO  ## non-zero: a crane shot that rides above and behind the target at this offset

var look_target: Node3D = null
var look_point = null              ## a fixed Vector3 to aim at instead (null = the player)
var frozen := false
var _yaw := 0.0
var _pitch := 0.0
var _snap := true

func _ready() -> void:
	_yaw = base_yaw
	_pitch = base_pitch

func _process(delta: float) -> void:
	if frozen:
		return
	if not current:
		_snap = true
		return
	var p = look_point
	if p == null:
		var t := look_target if look_target else get_tree().get_first_node_in_group("player") as Node3D
		if t == null or not t.is_visible_in_tree():
			return
		p = t.global_position + Vector3(0, aim_height, 0)
	if crane != Vector3.ZERO:
		var want_pos: Vector3 = p + crane
		global_position = want_pos if _snap else global_position.lerp(want_pos, minf(1.0, delta * 2.5))
		look_at(p, Vector3.UP)
		_snap = false
		return
	var to: Vector3 = p - global_position
	var want_yaw := rad_to_deg(atan2(-to.x, -to.z))
	var d := wrapf(want_yaw - base_yaw, -180.0, 180.0)
	d = clampf(d, -track_max, track_max)
	var want_pitch := clampf(rad_to_deg(atan2(to.y, Vector2(to.x, to.z).length())), -70.0, 35.0)
	var ty := base_yaw + d
	if _snap:
		_yaw = ty
		_pitch = want_pitch
		_snap = false
	else:
		var k := minf(1.0, delta * smoothing)
		_yaw += wrapf(ty - _yaw, -180.0, 180.0) * k
		_pitch += (want_pitch - _pitch) * k
	rotation = Vector3(deg_to_rad(_pitch), deg_to_rad(_yaw), 0.0)
