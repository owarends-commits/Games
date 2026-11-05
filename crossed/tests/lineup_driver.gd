extends Node3D
## Renders every character model in a row, for review. xvfb-run godot --path . res://tests/lineup.tscn

const IDS := ["norah", "norah_worn", "kenneth", "adaline", "stranger", "rachel", "marcus", "denise", "dad2", "mom2", "dad3", "amelia", "kid_boy", "kid_girl", "across"]
@export var anim_name := "idle"
@export var out_name := "lineup_idle"
@export var view := "front"
var ids: Array = IDS
var seek_t := 0.0
var per_anims: Array = []

func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a.begins_with("anim="): anim_name = a.substr(5)
		if a.begins_with("out="): out_name = a.substr(4)
		if a.begins_with("view="): view = a.substr(5)
		if a.begins_with("ids="): ids = a.substr(4).split(",")
		if a.begins_with("anims="): per_anims = a.substr(6).split(",")
		if a.begins_with("seek="): seek_t = float(a.substr(5))
		if a.begins_with("cam="):
			var c := a.substr(4).split(",")
			$Cam.position = Vector3(float(c[0]), float(c[1]), float(c[2]))
			$Cam.look_at(Vector3(0, float(c[3]), 0))
	var i := 0
	var models := []
	for id in ids:
		var m := CharacterModel.new()
		m.model_id = id
		m.start_animation = anim_name if anim_name != "auto" else ("quad_idle" if id == "across" else "idle")
		if id == "across" and anim_name in ["idle", "walk", "run", "talk"]:
			m.start_animation = {"idle": "folded", "walk": "shamble", "run": "crawl", "talk": "quad_idle"}[anim_name]
		m.start_offset_random = false
		if per_anims.size() > i: m.start_animation = per_anims[i]
		add_child(m)
		m.position = Vector3((i - (ids.size() - 1) / 2.0) * 0.95, 0, 0)
		models.append(m)
		if view == "side": m.rotation.y = deg_to_rad(90)
		if view == "back": m.rotation.y = PI
		i += 1
	for f in 5:
		await get_tree().process_frame
	for m in models:
		if m.anim and m.anim.current_animation != "":
			m.anim.seek(seek_t, true)
			m.anim.pause()
	for f in 5:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://tests/captures/%s.png" % out_name)
	get_tree().quit()
