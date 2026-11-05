extends Node
## Prints, for every hinged door in Chapter One, the room on each side and the angle it would open to.
func _ready() -> void:
	var d := (load("res://scenes/chapter1/chapter1.tscn") as PackedScene).instantiate()
	d.set_script(null)
	add_child(d)
	for i in 10: await get_tree().physics_frame
	for n in get_tree().get_nodes_in_group("door"):
		var dr := n as Door
		var r1 := dr._room(dr._closed_y + PI / 2)
		var r2 := dr._room(dr._closed_y - PI / 2)
		var a := dr._away_from(dr.global_position + Vector3(0.5, 0, 0.5))
		print("[door] %s at %s  room +%.1f / -%.1f  -> opens %+.0f deg" % [dr.name, dr.global_position, r1, r2, rad_to_deg(wrapf(a - dr._closed_y, -PI, PI))])
	get_tree().quit()
