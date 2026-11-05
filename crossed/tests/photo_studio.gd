extends Node
## Stages the found photographs with the real character models and renders them (tools/frame_photos.py frames them).
## Run: godot --path . res://tests/photo_studio.tscn   -> tests/captures/photo_raw_<id>.png
const RW := 480
const RH := 360

func _ready() -> void:
	for id in ["louis_addie", "louis_rose", "storm", "birthday", "school", "lake", "christmas"]:
		await _shoot(id)
	print("[studio] done")
	get_tree().quit()

func _mat(c: Color, tex := "") -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	if tex != "":
		m.albedo_texture = load(tex)
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
		m.uv1_triplanar = true
		m.uv1_scale = Vector3(1.5, 1.5, 1.5)
	return m

func _box(p: Node3D, pos: Vector3, size: Vector3, c: Color, tex := "", rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new(); bm.size = size
	mi.mesh = bm; mi.material_override = _mat(c, tex); mi.position = pos; mi.rotation_degrees = rot
	p.add_child(mi); return mi

func _ball(p: Node3D, pos: Vector3, r: float, c: Color, glow := false) -> void:
	var mi := MeshInstance3D.new(); var sm := SphereMesh.new(); sm.radius = r; sm.height = r * 2
	var m := _mat(c)
	if glow:
		m.emission_enabled = true; m.emission = c; m.emission_energy_multiplier = 1.5
	mi.mesh = sm; mi.material_override = m; mi.position = pos; p.add_child(mi)

func _cone(p: Node3D, pos: Vector3, r: float, h: float, c: Color) -> void:
	var mi := MeshInstance3D.new(); var cm := CylinderMesh.new(); cm.top_radius = 0.0; cm.bottom_radius = r; cm.height = h
	mi.mesh = cm; mi.material_override = _mat(c); mi.position = pos; p.add_child(mi)

func _label(p: Node3D, pos: Vector3, txt: String, c: Color, size := 32) -> void:
	var l := Label3D.new(); l.text = txt; l.modulate = c; l.font_size = size; l.pixel_size = 0.004; l.position = pos
	l.outline_size = 0; l.shaded = true; p.add_child(l)

func _who(p: Node3D, id: String, pos: Vector3, yaw_deg: float, anim: String, t := 0.4) -> CharacterModel:
	var cm := CharacterModel.new()
	cm.start_animation = ""
	cm.start_offset_random = false
	cm.model_id = id
	p.add_child(cm)
	cm.position = pos
	cm.rotation_degrees.y = yaw_deg + 180.0
	var mats: Dictionary = CharacterModel._get_materials(id)
	for m in mats.values():
		if m is ShaderMaterial and m.shader and m.shader.resource_path.contains("ps1_"):
			m.set_shader_parameter("snap_resolution", Vector2(4096, 3072))
			m.set_shader_parameter("affine_amount", 0.0)
	if cm.anim and cm.anim.has_animation(anim):
		cm.anim.play(anim, 0.0)
		cm.anim.seek(t, true)
		cm.anim.pause()
	return cm

func _hammer(cm: CharacterModel) -> void:
	var g := Node3D.new()
	_box(g, Vector3(0, -0.12, 0.0), Vector3(0.025, 0.26, 0.025), Color(0.45, 0.3, 0.16))
	_box(g, Vector3(0, -0.25, 0.03), Vector3(0.03, 0.03, 0.11), Color(0.5, 0.5, 0.55))
	cm.attach(g, "hand.R")

func _shoot(id: String) -> void:
	var vp := SubViewport.new()
	vp.size = Vector2i(RW, RH)
	vp.own_world_3d = true
	vp.msaa_3d = Viewport.MSAA_4X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var set := Node3D.new(); vp.add_child(set)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.8, 0.78, 0.74); env.ambient_light_energy = 0.3
	var we := WorldEnvironment.new(); we.environment = env; set.add_child(we)
	var cam := Camera3D.new(); cam.fov = 30; set.add_child(cam)
	var sun := DirectionalLight3D.new(); set.add_child(sun)
	sun.rotation_degrees = Vector3(-40, 30, 0); sun.light_energy = 0.75; sun.shadow_enabled = true
	match id:
		"louis_addie":     # Norah's porch, September: Louis and Addie fixed the step together
			env.background_color = Color(0.72, 0.8, 0.88)
			_box(set, Vector3(0, -0.05, 0), Vector3(5, 0.1, 4), Color(0.6, 0.45, 0.32), "res://assets/textures/floor_planks.png")
			_box(set, Vector3(0, 1.3, -1.3), Vector3(5, 2.8, 0.1), Color(0.75, 0.42, 0.34), "res://assets/textures/wall_brick.png")
			_box(set, Vector3(-1.9, 1.1, -1.24), Vector3(0.9, 2.1, 0.04), Color(0.55, 0.22, 0.18))
			_box(set, Vector3(0.0, 0.07, 0.75), Vector3(1.3, 0.14, 0.32), Color(0.66, 0.52, 0.36), "res://assets/textures/wood.png")   # the new step, pale wood
			var l := _who(set, "photo/louis_human", Vector3(-0.42, 0.0, 0.05), 25, "kneel", 0.9)
			_hammer(l)
			var a := _who(set, "photo/addie_overalls", Vector3(0.45, 0.0, 0.25), -18, "wave", 0.25)
			_hammer(a)
			cam.position = Vector3(0.15, 1.05, 3.2); cam.look_at(Vector3(0.05, 0.62, 0), Vector3.UP)
		"louis_rose":      # Louis and Rose outside the chapel, years later
			env.background_color = Color(0.85, 0.82, 0.76)
			sun.light_energy = 0.8
			_box(set, Vector3(0, -0.05, 0), Vector3(6, 0.1, 4), Color(0.7, 0.68, 0.64), "res://assets/textures/stone.png")
			_box(set, Vector3(0, 1.6, -1.4), Vector3(6, 3.4, 0.2), Color(0.86, 0.83, 0.76), "res://assets/textures/stone.png")
			_box(set, Vector3(0, 1.9, -1.28), Vector3(1.1, 1.6, 0.04), Color(1, 1, 1), "res://assets/textures/stained_glass.png")
			_box(set, Vector3(0, 0.08, -0.7), Vector3(3.0, 0.16, 0.8), Color(0.74, 0.72, 0.68))
			_who(set, "photo/louis_human", Vector3(-0.32, 0.0, 0.0), 14, "idle", 0.3)
			_who(set, "photo/rose", Vector3(0.34, 0.0, 0.08), -14, "idle", 1.1)
			cam.position = Vector3(0, 1.4, 3.7); cam.look_at(Vector3(0, 1.15, 0), Vector3.UP)
		"storm":           # Norah and Louis patching his porch after the storm
			env.background_color = Color(0.62, 0.68, 0.74)
			_box(set, Vector3(0, -0.05, 0), Vector3(6, 0.1, 4), Color(0.5, 0.4, 0.3), "res://assets/textures/floor_planks.png")
			_box(set, Vector3(0, 1.4, -1.3), Vector3(6, 3.0, 0.1), Color(0.55, 0.42, 0.34), "res://assets/textures/wood.png")
			_box(set, Vector3(1.6, 1.2, -1.22), Vector3(0.9, 1.0, 0.04), Color(0.15, 0.17, 0.22))
			_box(set, Vector3(-1.3, 1.3, -0.4), Vector3(0.14, 2.6, 0.14), Color(0.86, 0.84, 0.78))           # the porch post they're replacing
			_box(set, Vector3(0.9, 0.12, 0.6), Vector3(1.6, 0.06, 0.2), Color(0.72, 0.6, 0.42), "", Vector3(0, 20, 0))   # new boards
			_box(set, Vector3(0.95, 0.18, 0.62), Vector3(1.6, 0.06, 0.2), Color(0.72, 0.6, 0.42), "", Vector3(0, 24, 0))
			_box(set, Vector3(-1.9, 0.12, 0.9), Vector3(1.8, 0.14, 0.14), Color(0.35, 0.26, 0.18), "", Vector3(0, -30, 8))   # the branch that came down
			_box(set, Vector3(-1.4, 0.2, 1.1), Vector3(0.7, 0.08, 0.08), Color(0.35, 0.26, 0.18), "", Vector3(0, 40, 0))
			var lw := _who(set, "photo/louis_work", Vector3(-0.55, 0.0, -0.1), 16, "idle", 0.4)
			_hammer(lw)
			_who(set, "photo/norah_ponytail", Vector3(0.45, 0.0, 0.1), -14, "wave", 0.3)
			cam.position = Vector3(0.0, 1.35, 3.8); cam.look_at(Vector3(0, 1.05, 0), Vector3.UP)
		"birthday":        # Addie's birthday: the 6/12 cake
			env.background_color = Color(0.3, 0.28, 0.26)
			_box(set, Vector3(0, -0.05, 0), Vector3(5, 0.1, 4), Color(0.6, 0.5, 0.4), "res://assets/textures/floor_planks.png")
			_box(set, Vector3(0, 1.3, -1.6), Vector3(5, 2.8, 0.1), Color(0.86, 0.82, 0.68), "res://assets/textures/lh_wallpaper.png")
			_box(set, Vector3(0, 0.5, 0.35), Vector3(1.6, 0.06, 0.8), Color(0.95, 0.95, 0.95))
			_box(set, Vector3(0, 0.25, 0.35), Vector3(1.5, 0.5, 0.7), Color(0.6, 0.42, 0.28))
			_box(set, Vector3(0, 0.62, 0.42), Vector3(0.36, 0.18, 0.36), Color(0.98, 0.94, 0.9))
			_box(set, Vector3(0, 0.715, 0.42), Vector3(0.37, 0.02, 0.37), Color(0.95, 0.6, 0.75))
			for k in 6:
				_box(set, Vector3(-0.12 + k * 0.05, 0.76, 0.42), Vector3(0.012, 0.07, 0.012), Color(0.5, 0.75, 0.95))
				_ball(set, Vector3(-0.12 + k * 0.05, 0.805, 0.42), 0.012, Color(1, 0.8, 0.3), true)
			for k in 7:
				_ball(set, Vector3(-1.6 + k * 0.55, 2.1 + (k % 2) * 0.15, -1.45), 0.13, [Color(0.9, 0.3, 0.4), Color(0.4, 0.6, 0.95), Color(0.95, 0.85, 0.3)][k % 3])
			_who(set, "photo/addie_party", Vector3(0.0, 0.0, -0.25), 0, "wave", 0.3)
			_who(set, "norah", Vector3(0.62, 0.0, -0.75), -12, "idle", 0.5)
			var lamp := OmniLight3D.new(); lamp.position = Vector3(0, 1.4, 1.6); lamp.light_energy = 1.4; lamp.omni_range = 5; set.add_child(lamp)
			cam.position = Vector3(0.1, 1.25, 2.6); cam.look_at(Vector3(0.15, 0.95, -0.3), Vector3.UP)
		"school":          # first day of kindergarten
			env.background_color = Color(0.7, 0.8, 0.9)
			_box(set, Vector3(0, -0.05, 0), Vector3(6, 0.1, 4), Color(0.7, 0.7, 0.68), "res://assets/textures/concrete.png")
			_box(set, Vector3(0, 1.5, -1.2), Vector3(6, 3.2, 0.2), Color(0.75, 0.45, 0.36), "res://assets/textures/wall_brick.png")
			_box(set, Vector3(0.9, 1.1, -1.08), Vector3(1.2, 2.2, 0.06), Color(0.2, 0.35, 0.55))
			_label(set, Vector3(0, 2.6, -1.08), "KENNEDY ELEMENTARY", Color(0.95, 0.92, 0.8), 30)
			var a := _who(set, "adaline", Vector3(-0.2, 0.0, 0.2), 10, "wave", 0.3)
			var bp := Node3D.new(); _box(bp, Vector3(0, 0.0, 0.11), Vector3(0.22, 0.26, 0.1), Color(0.85, 0.35, 0.6)); a.attach(bp, "chest")
			cam.position = Vector3(0, 0.95, 2.5); cam.look_at(Vector3(0, 0.75, 0), Vector3.UP)
		"lake":            # Kenneth and Addie at the lake, squinting
			env.background_color = Color(0.62, 0.78, 0.94)
			sun.light_energy = 0.95
			_box(set, Vector3(0, -0.05, 1.0), Vector3(8, 0.1, 4), Color(0.82, 0.74, 0.55))
			_box(set, Vector3(0, -0.02, -3.5), Vector3(14, 0.06, 6), Color(0.25, 0.5, 0.62), "res://assets/textures/river_water.png")
			_box(set, Vector3(0, 1.0, -7.0), Vector3(16, 2.0, 0.5), Color(0.25, 0.4, 0.25))
			_who(set, "photo/kenneth_summer", Vector3(-0.35, 0.0, 0.3), 12, "idle", 0.6)
			_who(set, "photo/addie_swim", Vector3(0.4, 0.0, 0.5), -10, "wave", 0.2)
			cam.position = Vector3(0, 1.2, 3.6); cam.look_at(Vector3(0, 0.95, 0), Vector3.UP)
		"christmas":       # Christmas morning, the couch, the tree
			env.background_color = Color(0.2, 0.18, 0.16)
			_box(set, Vector3(0, -0.05, 0), Vector3(5, 0.1, 4), Color(0.5, 0.42, 0.36), "res://assets/textures/carpet_hall.png")
			_box(set, Vector3(0, 1.3, -1.4), Vector3(5, 2.8, 0.1), Color(0.8, 0.78, 0.66), "res://assets/textures/lh_wallpaper.png")
			_box(set, Vector3(-0.3, 0.22, -0.7), Vector3(1.8, 0.44, 0.8), Color(0.42, 0.38, 0.28))
			_box(set, Vector3(-0.3, 0.6, -1.05), Vector3(1.8, 0.6, 0.2), Color(0.42, 0.38, 0.28))
			for k in 4: _cone(set, Vector3(1.3, 0.5 + k * 0.4, -0.9), 0.55 - k * 0.11, 0.6, Color(0.14, 0.36, 0.2))
			for k in 14: _ball(set, Vector3(1.3 + cos(k * 1.7) * (0.45 - k * 0.025), 0.4 + k * 0.1, -0.9 + sin(k * 1.7) * (0.45 - k * 0.025)), 0.03, [Color(1, 0.3, 0.3), Color(1, 0.85, 0.3), Color(0.4, 0.7, 1)][k % 3], true)
			_box(set, Vector3(1.0, 0.1, -0.4), Vector3(0.3, 0.2, 0.3), Color(0.8, 0.2, 0.2)); _box(set, Vector3(1.4, 0.08, -0.3), Vector3(0.25, 0.16, 0.35), Color(0.2, 0.5, 0.8))
			_who(set, "photo/norah_ponytail", Vector3(-0.55, 0.0, -0.6), 8, "sit", 0.5)
			_who(set, "photo/addie_pjs", Vector3(0.25, 0.0, -0.25), -12, "wave", 0.35)
			var tl := OmniLight3D.new(); tl.position = Vector3(1.0, 1.0, 0.2); tl.light_color = Color(1, 0.8, 0.55); tl.light_energy = 1.5; tl.omni_range = 4; set.add_child(tl)
			sun.light_energy = 0.5
			cam.position = Vector3(0.2, 1.15, 2.7); cam.look_at(Vector3(0.1, 0.75, -0.5), Vector3.UP)
	var flash := OmniLight3D.new(); flash.position = cam.position + Vector3(0.2, 0.2, 0); flash.light_energy = 0.35; flash.omni_range = 7; set.add_child(flash)
	cam.current = true
	for i in 8: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	vp.get_texture().get_image().save_png("res://tests/captures/photo_raw_%s.png" % id)
	vp.queue_free()
