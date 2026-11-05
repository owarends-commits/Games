@tool
extends Node3D
## Kennedy, Washington, as seen from the sky in the opening shot: a small Midwestern-style city
## (inspired by Sioux Falls, scaled down) on a winding river, ringed by miles of farmland.
## Built procedurally from a fixed seed with MultiMeshes so it stays light. The hand-made
## community center streets sit inside HAND_BUILT and are left alone.
## Tweak the numbers below and toggle `rebuild` in the inspector to regenerate.

@export var seed := 1947
@export var rebuild := false:
	set(v):
		if v and is_inside_tree():
			_build()

const HAND_BUILT := Rect2(-48, -32, 160, 160)     # x, z, width, depth
const X0 := -640.0
const X1 := 720.0
const Z0 := -520.0
const Z1 := 600.0
const BLOCK_X := 74.0     # 62 m blocks + 12 m streets
const BLOCK_Z := 68.0     # 56 m blocks + 12 m streets
const STREET := 12.0
const DOWNTOWN := Vector3(250, 0, -170)
const RAIL_Z := 540.0

var rng := RandomNumberGenerator.new()
var _mats := {}
var _lists := {}      # key -> [mesh, material, Array[Transform3D]]

func _ready() -> void:
	_build()

func _build() -> void:
	for c in get_children():
		c.queue_free()
	_lists.clear()
	rng.seed = seed
	_ground()
	_river_and_grid()
	_landmarks()
	_farmsteads()
	_highway()
	for key in _lists:
		var e: Array = _lists[key]
		_flush(key, e[0], e[1], e[2])

# ------------------------------------------------------------------ helpers
func _mat(key: String, tex: String, scale := Vector2.ONE, world := true, albedo := Color.WHITE, emis := 0.0, affine := 0.15) -> ShaderMaterial:
	if _mats.has(key):
		return _mats[key]
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/ps1_surface.gdshader")
	if tex != "":
		m.set_shader_parameter("albedo_tex", load("res://assets/textures/" + tex))
	m.set_shader_parameter("world_uv", world)
	m.set_shader_parameter("uv_scale", scale)
	m.set_shader_parameter("albedo", albedo)
	m.set_shader_parameter("emission_strength", emis)
	m.set_shader_parameter("affine_amount", affine)
	_mats[key] = m
	return m

func _add(key: String, mesh: Mesh, mat: Material, t: Transform3D) -> void:
	if not _lists.has(key):
		_lists[key] = [mesh, mat, []]
	(_lists[key][2] as Array).append(t)

func _box(key: String, mat: Material, center_bottom: Vector3, size: Vector3, yaw := 0.0) -> void:
	var b := Basis(Vector3.UP, yaw).scaled(size)
	_add(key, _unit_box(), mat, Transform3D(b, center_bottom + Vector3(0, size.y * 0.5, 0)))

var _ub: BoxMesh
func _unit_box() -> BoxMesh:
	if _ub == null:
		_ub = BoxMesh.new()
	return _ub

var _up: PrismMesh
func _unit_prism() -> PrismMesh:
	if _up == null:
		_up = PrismMesh.new()
	return _up

var _uc: CylinderMesh
func _unit_cyl() -> CylinderMesh:
	if _uc == null:
		_uc = CylinderMesh.new()
		_uc.top_radius = 0.5
		_uc.bottom_radius = 0.5
		_uc.height = 1.0
		_uc.radial_segments = 8
		_uc.rings = 1
	return _uc

func _flush(key: String, mesh: Mesh, mat: Material, ts: Array) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = ts.size()
	for i in ts.size():
		mm.set_instance_transform(i, ts[i])
	var mi := MultiMeshInstance3D.new()
	mi.name = key
	mi.multimesh = mm
	mi.material_override = mat
	add_child(mi)

func _plane(name_: String, size: Vector2, pos: Vector3, mat: Material, subdiv := 24) -> void:
	var pm := PlaneMesh.new()
	pm.size = size
	pm.subdivide_width = subdiv
	pm.subdivide_depth = subdiv
	var mi := MeshInstance3D.new()
	mi.name = name_
	mi.mesh = pm
	mi.material_override = mat
	mi.position = pos
	add_child(mi)

func _in_hand_built(x: float, z: float, margin := 0.0) -> bool:
	return Rect2(HAND_BUILT.position - Vector2(margin, margin), HAND_BUILT.size + Vector2(margin, margin) * 2).has_point(Vector2(x, z))

func river_x(z: float) -> float:
	return -250.0 + 80.0 * sin(z / 190.0) + 30.0 * sin(z / 61.0)

# ------------------------------------------------------------------ pieces
func _ground() -> void:
	_plane("Farmland", Vector2(14000, 14000), Vector3(0, -0.45, 0), _mat("farm", "farmland.png", Vector2(1.0 / 2400.0, 1.0 / 2400.0), true, Color(0.9, 0.9, 0.9), 0.0, 0.0), 60)
	_plane("CityGround", Vector2(X1 - X0 + 60, Z1 - Z0 + 60), Vector3((X0 + X1) / 2, -0.3, (Z0 + Z1) / 2), _mat("cityground", "city_ground.png", Vector2(0.05, 0.05), true, Color.WHITE, 0.0, 0.0), 40)

func _river_and_grid() -> void:
	var water := _mat("water", "river_water.png", Vector2(0.02, 0.02), true, Color(0.8, 0.85, 0.95), 0.15, 0.0)
	var z := -3200.0
	while z < 3200.0:   # the river runs through the farmland too
		var x := river_x(z)
		var x2 := river_x(z + 40.0)
		var yaw := atan2(x2 - x, 40.0)
		_add("river", _unit_box(), water, Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3(46, 0.2, 44)), Vector3((x + x2) * 0.5, -0.2, z + 20.0)))
		z += 40.0
	var asphalt := _mat("street", "asphalt.png", Vector2(0.1, 0.1), true, Color(0.75, 0.75, 0.78), 0.0, 0.0)
	var lamp := _mat("lamp", "white.png", Vector2.ONE, false, Color(1.0, 0.8, 0.5), 2.5)
	var bridge := _mat("bridge", "concrete.png", Vector2(0.25, 0.25), true, Color(0.7, 0.7, 0.7))
	# streets: long strips along both axes
	var x := X0
	var col := 0
	while x <= X1:
		_add("streets", _unit_box(), asphalt, Transform3D(Basis().scaled(Vector3(STREET, 0.1, Z1 - Z0)), Vector3(x, -0.2, (Z0 + Z1) / 2)))
		x += BLOCK_X
		col += 1
	z = Z0
	var row := 0
	while z <= Z1:
		_add("streets", _unit_box(), asphalt, Transform3D(Basis().scaled(Vector3(X1 - X0, 0.1, STREET)), Vector3((X0 + X1) / 2, -0.2, z)))
		if row % 3 == 1:   # bridges on every third street
			_box("bridges", bridge, Vector3(river_x(z), -0.05, z), Vector3(60, 0.6, STREET + 2), 0.0)
		z += BLOCK_Z
		row += 1
	# blocks
	x = X0
	while x < X1:
		z = Z0
		while z < Z1:
			var c := Vector3(x + BLOCK_X * 0.5, 0, z + BLOCK_Z * 0.5)
			_add("lamps", _unit_box(), lamp, Transform3D(Basis().scaled(Vector3(0.6, 0.6, 0.6)), Vector3(x + STREET * 0.5, 6.0, z + STREET * 0.5)))
			if not _in_hand_built(c.x, c.z, 30.0) and abs(c.x - river_x(c.z)) > 60.0:
				_block(c, Vector2(BLOCK_X - STREET, BLOCK_Z - STREET))
			z += BLOCK_Z
		x += BLOCK_X

func _block(c: Vector3, size: Vector2) -> void:
	var d := Vector2(c.x - DOWNTOWN.x, c.z - DOWNTOWN.z).length()
	if c.z > RAIL_Z - 90.0:
		_industrial(c, size)
	elif d < 210.0:
		_downtown(c, size, d)
	elif rng.randf() < 0.07:
		_park(c, size)
	else:
		_houses(c, size)

func _houses(c: Vector3, size: Vector2) -> void:
	var roof := _mat("roof", "roof_shingle.png", Vector2(0.2, 0.2), true, Color(0.85, 0.85, 0.85))
	var lots_x := 4
	var lots_z := 2
	for i in lots_x:
		for j in lots_z:
			if rng.randf() < 0.12:
				continue
			var lx := c.x - size.x * 0.5 + (i + 0.5) * size.x / lots_x + rng.randf_range(-1.5, 1.5)
			var lz := c.z - size.y * 0.5 + (j + 0.5) * size.y / lots_z + (4.0 if j == 0 else -4.0)
			var w := rng.randf_range(8.0, 11.0)
			var dd := rng.randf_range(8.5, 12.0)
			var h := rng.randf_range(3.6, 5.8)
			var k := rng.randi() % 4
			var wall := _mat("house%d" % k, "house_%d.png" % k, Vector2(1.0 / 9.0, 1.0 / 4.5), true, Color.WHITE, 0.35)
			var yaw := 0.0 if rng.randf() < 0.85 else PI * 0.5
			_box("houses%d" % k, wall, Vector3(lx, 0, lz), Vector3(w, h, dd), yaw)
			var rb := Basis(Vector3.UP, yaw + PI * 0.5).scaled(Vector3(dd + 0.8, rng.randf_range(2.2, 3.4), w + 0.8))
			_add("roofs", _unit_prism(), roof, Transform3D(rb, Vector3(lx, h + rb.get_scale().y * 0.5, lz)))
			if rng.randf() < 0.35:   # a tree in the yard
				_tree(Vector3(lx + rng.randf_range(-5, 5), 0, lz + (7.0 if j == 0 else -7.0)))

func _downtown(c: Vector3, size: Vector2, d: float) -> void:
	var n := 2 + (rng.randi() % 3)
	var taller := clampf(1.0 - d / 210.0, 0.0, 1.0)
	for k in n:
		var w := size.x / n - 2.0
		var dd := rng.randf_range(size.y * 0.5, size.y - 4.0)
		var h := rng.randf_range(9.0, 16.0) + taller * rng.randf_range(10.0, 42.0)
		var fi := rng.randi() % 5
		var fac := _mat("fac%d" % fi, "facade_%d.png" % fi, Vector2(0.25, 0.25), true, Color.WHITE, 0.7)
		_box("downtown%d" % fi, fac, Vector3(c.x - size.x * 0.5 + (k + 0.5) * (size.x / n), 0, c.z + rng.randf_range(-3, 3)), Vector3(w, h, dd))
		if h > 30.0 and rng.randf() < 0.5:   # red aircraft light on the tall ones
			_add("redlights", _unit_box(), _mat("red", "white.png", Vector2.ONE, false, Color(1, 0.1, 0.05), 3.0), Transform3D(Basis().scaled(Vector3(0.8, 0.8, 0.8)), Vector3(c.x - size.x * 0.5 + (k + 0.5) * (size.x / n), h + 1.0, c.z)))

func _industrial(c: Vector3, size: Vector2) -> void:
	var wh := _mat("warehouse", "warehouse.png", Vector2(0.12, 0.2), true, Color.WHITE, 0.15)
	_box("warehouses", wh, Vector3(c.x + rng.randf_range(-4, 4), 0, c.z), Vector3(size.x - rng.randf_range(4, 16), rng.randf_range(6, 10), size.y - rng.randf_range(4, 16)))

func _park(c: Vector3, size: Vector2) -> void:
	for k in 14:
		_tree(c + Vector3(rng.randf_range(-size.x * 0.45, size.x * 0.45), 0, rng.randf_range(-size.y * 0.45, size.y * 0.45)))

func _tree(p: Vector3) -> void:
	var leaf := _mat("leaf", "grass.png", Vector2(0.3, 0.3), true, Color(0.35, 0.45, 0.3))
	var h := rng.randf_range(6.0, 11.0)
	_add("trees", _unit_cyl(), leaf, Transform3D(Basis().scaled(Vector3(h * 0.55, h * 0.75, h * 0.55)), p + Vector3(0, h * 0.62, 0)))

func _landmarks() -> void:
	var silo := _mat("silo", "concrete_silo.png", Vector2(0.15, 0.15), true, Color.WHITE)
	# grain elevator by the railroad: the tallest thing in town
	var ge := Vector3(-430, 0, RAIL_Z - 30)
	for i in 6:
		_add("silos", _unit_cyl(), silo, Transform3D(Basis().scaled(Vector3(10, 36, 10)), ge + Vector3((i % 3) * 10.5, 18, (i / 3) * 10.5)))
	_box("silo_box", silo, ge + Vector3(10.5, 0, 22), Vector3(12, 52, 12))
	_add("redlights", _unit_box(), _mat("red", "white.png", Vector2.ONE, false, Color(1, 0.1, 0.05), 3.0), Transform3D(Basis().scaled(Vector3(1, 1, 1)), ge + Vector3(10.5, 53, 22)))
	# railroad
	var rail := _mat("rail", "asphalt.png", Vector2(0.2, 0.2), true, Color(0.4, 0.35, 0.3))
	_add("rail", _unit_box(), rail, Transform3D(Basis().scaled(Vector3(9000, 0.3, 6)), Vector3(0, -0.15, RAIL_Z)))
	# water tower
	var tw := Vector3(130, 0, 330)
	var steel := _mat("steel", "white.png", Vector2.ONE, false, Color(0.75, 0.78, 0.8))
	for k in 4:
		var o := Vector3(5.0 if k % 2 == 0 else -5.0, 0, 5.0 if k < 2 else -5.0)
		_box("tower_legs", steel, tw + o, Vector3(0.8, 30, 0.8))
	_add("tower_tank", _unit_cyl(), steel, Transform3D(Basis().scaled(Vector3(18, 9, 18)), tw + Vector3(0, 34.5, 0)))
	_add("redlights", _unit_box(), _mat("red", "white.png", Vector2.ONE, false, Color(1, 0.1, 0.05), 3.0), Transform3D(Basis().scaled(Vector3(0.8, 0.8, 0.8)), tw + Vector3(0, 39.5, 0)))
	# radio mast out in the fields, blinking red: how far the dark goes
	_box("mast", steel, Vector3(-2600, 0, -1900), Vector3(1.2, 120, 1.2))
	_add("redlights", _unit_box(), _mat("red", "white.png", Vector2.ONE, false, Color(1, 0.1, 0.05), 3.0), Transform3D(Basis().scaled(Vector3(2, 2, 2)), Vector3(-2600, 121, -1900)))

func _farmsteads() -> void:
	var wall := _mat("farmhouse", "house_1.png", Vector2(1.0 / 9.0, 1.0 / 4.5), true, Color.WHITE, 0.3)
	var barn := _mat("barn", "wood.png", Vector2(0.2, 0.2), true, Color(0.6, 0.15, 0.1))
	var silo := _mat("silo", "concrete_silo.png", Vector2(0.15, 0.15), true, Color.WHITE)
	var yard := _mat("yardlight", "white.png", Vector2.ONE, false, Color(1.0, 0.85, 0.6), 3.0)
	for i in 90:
		var a := rng.randf() * TAU
		var r := rng.randf_range(1100.0, 5200.0)
		var p := Vector3(cos(a) * r, 0, sin(a) * r)
		if abs(p.x - river_x(p.z)) < 80.0:
			continue
		_box("farmhouses", wall, p, Vector3(10, 5, 9))
		_box("barns", barn, p + Vector3(28, 0, 6), Vector3(16, 9, 24))
		_add("silos", _unit_cyl(), silo, Transform3D(Basis().scaled(Vector3(6, 16, 6)), p + Vector3(42, 8, -4)))
		_add("yardlights", _unit_box(), yard, Transform3D(Basis().scaled(Vector3(1.2, 1.2, 1.2)), p + Vector3(14, 7, -8)))
		for k in 6:   # a shelterbelt of trees on the north side
			_tree(p + Vector3(-20 + k * 10, 0, -30))

func _highway() -> void:
	var asphalt := _mat("street", "asphalt.png", Vector2(0.1, 0.1), true, Color(0.75, 0.75, 0.78), 0.0, 0.0)
	var lamp := _mat("lamp", "white.png", Vector2.ONE, false, Color(1.0, 0.8, 0.5), 2.5)
	_add("highway", _unit_box(), asphalt, Transform3D(Basis().scaled(Vector3(26, 0.1, 12000)), Vector3(1150, -0.25, 0)))
	_add("highway", _unit_box(), asphalt, Transform3D(Basis().scaled(Vector3(12000, 0.1, 18)), Vector3(0, -0.26, -1400)))   # the state road west
	var z := -900.0
	while z < 900.0:
		_add("lamps", _unit_box(), lamp, Transform3D(Basis().scaled(Vector3(0.8, 0.8, 0.8)), Vector3(1138, 9.0, z)))
		z += 70.0
	# the main road from the highway into town
	_add("highway", _unit_box(), asphalt, Transform3D(Basis().scaled(Vector3(1150 - X1, 0.1, 16)), Vector3((1150 + X1) * 0.5, -0.24, 24)))
