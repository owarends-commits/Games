extends Camera3D
## A fixed camera that turns (and optionally slides along a rail) to keep Kenneth in frame.
## Smoothed, so it reads as a slow camera operator rather than a lock-on.
##   rail_a / rail_b : the camera slides between these two points to stay level with the player
##   focus / focus_weight : keeps something important (a doorway, the BMW) partly in frame

@export var rail_a := Vector3.ZERO
@export var rail_b := Vector3.ZERO
@export var focus := Vector3.ZERO
@export_range(0.0, 1.0) var focus_weight := 0.0
@export var look_height := 1.0
@export var turn_smooth := 2.5
@export var slide_smooth := 1.6

var _look := Vector3.ZERO
var _ready_done := false

func _process(delta: float) -> void:
	if not current:
		_ready_done = false
		return
	var p := get_tree().get_first_node_in_group("player") as Node3D
	if p == null or not p.is_visible_in_tree():
		return
	var target := p.global_position + Vector3(0, look_height, 0)
	if focus_weight > 0.0:
		target = target.lerp(focus, focus_weight)
	if rail_a != rail_b:
		var ab := rail_b - rail_a
		var t: float = clamp((p.global_position - rail_a).dot(ab) / ab.length_squared(), 0.0, 1.0)
		var want := rail_a + ab * t
		global_position = want if not _ready_done else global_position.lerp(want, clamp(slide_smooth * delta, 0.0, 1.0))
	_look = target if not _ready_done else _look.lerp(target, clamp(turn_smooth * delta, 0.0, 1.0))
	_ready_done = true
	if global_position.distance_to(_look) > 0.1:
		look_at(_look, Vector3.UP)
