extends Node
func _ready() -> void:
	var c := Control.new(); c.size = Vector2(480, 360); add_child(c)
	var l := Label.new(); l.text = "Hold C / right mouse / LB. She plants her feet and locks onto the nearest threat."
	c.add_child(l); l.position = Vector2(130, 74)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size = Vector2(300, 28)
	l.custom_minimum_size = Vector2(300, 0)
	await get_tree().process_frame
	await get_tree().process_frame
	print("A size=", l.size, " lines=", l.get_line_count())
	var m := Label.new(); c.add_child(m)
	m.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	m.custom_minimum_size = Vector2(300, 0)
	m.size = Vector2(300, 28)
	m.text = l.text
	await get_tree().process_frame
	await get_tree().process_frame
	print("B size=", m.size, " lines=", m.get_line_count())
	get_tree().quit()
