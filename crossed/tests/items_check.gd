extends Control
## Item models (from the Item Modeler export): every item at its saved pose, then turned to its examine points.
## Writes tests/captures/items_*.png
func _ready() -> void:
	var keys: Array = ItemModels.db().get("items", {}).keys()
	var bg := ColorRect.new(); bg.color = Color(0.06, 0.06, 0.07); bg.size = Vector2(960, 540); add_child(bg)
	var vs := []
	for i in keys.size():
		var v := ItemViewer.new()
		v.spin = false
		v.position = Vector2((i % 4) * 240, (i / 4) * 180)
		v.size = Vector2(240, 180)
		add_child(v)
		v.show_item(keys[i])
		var l := Label.new(); l.text = keys[i]; l.position = v.position + Vector2(4, 2); add_child(l)
		vs.append(v)
	await _shot("items_pose")
	for v in vs:
		v.yaw += 180.0
	await _shot("items_back")
	for v in vs:
		v.yaw -= 180.0
		v.pitch = 80.0
	await _shot("items_top")
	for v in vs:
		v.interactive = true
		if v.has_examine_points(): v.next_point()
	for i in 40: await get_tree().process_frame
	await _shot("items_examine")
	get_tree().quit()

func _shot(nm: String) -> void:
	for i in 6: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/%s.png" % nm)
