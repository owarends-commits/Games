@tool
class_name CameraZone
extends Area3D
## A trigger volume that makes `camera` live while the player stands inside it.
## Put zones on layer 0 with mask 2 (player). Overlap neighbouring zones a little;
## the director keeps the most recently entered one, so cuts don't flicker at seams.

@export var camera: Camera3D
@export var escape_camera: Camera3D   ## used instead while Cameras.escape_mode is on (faces the exit)
@export var camera_priority := 0

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		Cameras.enter_zone(self)

func _on_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		Cameras.exit_zone(self)

func active_camera() -> Camera3D:
	return escape_camera if (Cameras.escape_mode and escape_camera) else camera
