extends OmniLight3D
## Irregular fluorescent flicker: mostly steady, with short stutters and the odd drop-out.

@export var base_energy := 1.2
@export var flicker_chance := 0.6     # stutters per second, on average
@export var dropout_chance := 0.08    # full blackouts per second, on average

var _t := 0.0
var _stutter := 0.0

func _ready() -> void:
	light_energy = base_energy

func _process(delta: float) -> void:
	_t -= delta
	if _stutter > 0.0:
		_stutter -= delta
		light_energy = base_energy * (0.15 if randf() < 0.5 else 1.0)
		if _stutter <= 0.0:
			light_energy = base_energy
		return
	if randf() < dropout_chance * delta:
		_stutter = randf_range(0.25, 0.7)
	elif randf() < flicker_chance * delta:
		_stutter = randf_range(0.05, 0.18)
