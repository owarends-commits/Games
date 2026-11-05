class_name ItemModels
extends RefCounted
## Builds the 3D items made in the Item Modeler (tools/item_modeler.html) from data/items/items.json.
## Each part is one of the modeler's unit shapes, sized by d, turned by r (degrees, X then Y then Z, like three.js)
## and placed at p, so a model looks the same here as it did in the modeler.
##   ItemModels.has("revolver")                -> is there a model for it
##   ItemModels.item("revolver")               -> its data: name, desc, examine, pins, pose ...
##   ItemModels.build("revolver", overrides)   -> a Node3D centred on the item, with meta "pins", "radius", "pose"
## overrides: {"Part name": {"c": "#rrggbb", "t": "b:Black leather", "tex": Texture2D}}

const PATH := "res://data/items/items.json"
const SHADER := preload("res://shaders/ps1_item.gdshader")
const GLASS := preload("res://shaders/ps1_item_glass.gdshader")

static var _db: Dictionary = {}
static var _meshes: Dictionary = {}

static func db() -> Dictionary:
	if _db.is_empty():
		var f := FileAccess.open(PATH, FileAccess.READ)
		if f:
			var d = JSON.parse_string(f.get_as_text())
			if d is Dictionary: _db = d
	return _db

static func has(key: String) -> bool:
	return db().get("items", {}).has(key)

static func item(key: String) -> Dictionary:
	return db().get("items", {}).get(key, {})

static func texture(id: String) -> Texture2D:
	var p: String = db().get("textures", {}).get(id, "")
	return load(p) as Texture2D if p != "" and ResourceLoader.exists(p) else null

## ------------------------------------------------------------------ the model
static func build(key: String, overrides: Dictionary = {}) -> Node3D:
	var it := item(key)
	var root := Node3D.new()
	root.name = "Item_" + key
	var parts := Node3D.new()
	parts.name = "Parts"
	root.add_child(parts)
	var xf_of := {}
	var shape_of := {}
	var box := AABB()
	var first := true
	var mats: Array = []
	for p in it.get("parts", []):
		var mi := MeshInstance3D.new()
		mi.name = String(p.get("name", "part")).validate_node_name()
		mi.mesh = unit_mesh(p.get("s", "box"), int(p.get("seg", 10)), float(p.get("k", 0.3)), p.get("mat", "matte") == "metal")
		var r: Array = p.get("r", [0, 0, 0])
		var d: Array = p.get("d", [0.01, 0.01, 0.01])
		var b := Basis(Vector3.RIGHT, deg_to_rad(r[0])) * Basis(Vector3.UP, deg_to_rad(r[1])) * Basis(Vector3.BACK, deg_to_rad(r[2]))
		b = b * Basis.from_scale(Vector3(maxf(1e-4, d[0]), maxf(1e-4, d[1]), maxf(1e-4, d[2])))
		var pp: Array = p.get("p", [0, 0, 0])
		mi.transform = Transform3D(b, Vector3(pp[0], pp[1], pp[2]))
		var ov: Dictionary = overrides.get(p.get("name", ""), {})
		var m := material(p, ov)
		mats.append(m)
		mi.material_override = m
		parts.add_child(mi)
		xf_of[p.get("id", "")] = mi.transform
		shape_of[p.get("id", "")] = p.get("s", "box")
		var bb := mi.transform * mi.mesh.get_aabb()
		box = bb if first else box.merge(bb)
		first = false
	var centre := box.get_center()
	parts.position = -centre
	var pins := []
	for pin in it.get("pins", []):
		if not xf_of.has(pin.get("part", "")): continue
		var lp: Array = pin.get("lp", [0, 0, 0])
		var xf: Transform3D = xf_of[pin["part"]]
		var l := Vector3(lp[0], lp[1], lp[2])
		var pos: Vector3 = xf * l - centre
		# which way the surface under the pin faces (a box face, or straight out from a round shape)
		var ln := l
		if shape_of[pin["part"]] in ["box", "card", "wedge"]:
			var ax := 0
			for i in 3:
				if absf(l[i]) > absf(l[ax]): ax = i
			ln = Vector3.ZERO
			ln[ax] = signf(l[ax]) if l[ax] != 0.0 else 1.0
		var nrm := (xf.basis.inverse().transposed() * ln).normalized() if ln.length() > 1e-6 else pos.normalized()
		pins.append({"pos": pos, "nrm": nrm, "text": pin.get("text", ""), "kind": pin.get("kind", "note"), "part": pin.get("partName", "")})
	root.set_meta("pins", pins)
	root.set_meta("radius", maxf(0.01, box.size.length() * 0.5))
	root.set_meta("size", box.size)
	root.set_meta("pose", it.get("pose", {"yaw": -30, "pitch": 22, "zoom": 1}))
	root.set_meta("materials", mats)
	return root

static func material(p: Dictionary, ov: Dictionary = {}) -> ShaderMaterial:
	var kind: String = p.get("mat", "matte")
	var m := ShaderMaterial.new()
	m.shader = GLASS if kind == "glass" else SHADER
	var tid: String = ov.get("t", p.get("t", ""))
	var tex: Texture2D = ov.get("tex", null)
	if tex == null and tid != "": tex = texture(tid)
	var col := Color(String(ov.get("c", p.get("c", "#8a8478"))))
	if tex != null and not p.get("tint", false) and not ov.has("c"):
		col = Color.WHITE        # the modeler shows a textured part in the texture's own colours unless it is tinted
	m.set_shader_parameter("albedo", col)
	if tex != null:
		m.set_shader_parameter("albedo_tex", tex)
		var rep := float(p.get("tr", 1)) if not ov.has("tex") else 1.0
		m.set_shader_parameter("uv_scale", Vector2(rep, rep))
	match kind:
		"metal":
			m.set_shader_parameter("spec", 0.75); m.set_shader_parameter("rough", 0.32)
		"glossy":
			m.set_shader_parameter("spec", 0.55); m.set_shader_parameter("rough", 0.3)
		"glass":
			m.set_shader_parameter("spec", 0.7); m.set_shader_parameter("rough", 0.18)
		"glow":
			m.set_shader_parameter("glow", 1.0)
		_:
			m.set_shader_parameter("spec", 0.0); m.set_shader_parameter("rough", 1.0)
	return m

## ------------------------------------------------------------------ unit shapes, ported from the modeler (three.js r128)
## Generated in three's conventions (counter-clockwise, v up), then flipped for Godot (clockwise, v down).
static func unit_mesh(s: String, seg: int, k: float, flat: bool) -> ArrayMesh:
	seg = clampi(seg if seg > 0 else 8, 3, 32)
	var ck := "%s|%d|%.3f|%s" % [s, seg, k, flat]
	if _meshes.has(ck): return _meshes[ck]
	var g := {"v": PackedVector3Array(), "uv": PackedVector2Array(), "i": PackedInt32Array()}
	match s:
		"box", "card": _box(g)
		"cyl": _cylinder(g, 0.5, 0.5, seg)
		"cone": _cylinder(g, 0.0, 0.5, seg)
		"sphere": _sphere(g, seg, maxi(3, roundi(seg * 0.66)))
		"torus":
			var t := clampf(k, 0.04, 0.9) * 0.5
			_torus(g, 0.5 - t / 2.0, t / 2.0, maxi(3, roundi(seg * 0.5)), seg)
		"tube":
			var ri := 0.5 * (1.0 - clampf(k, 0.04, 0.95))
			_lathe(g, [Vector2(ri, -0.5), Vector2(0.5, -0.5), Vector2(0.5, 0.5), Vector2(ri, 0.5), Vector2(ri, -0.5)], seg)
		"capsule":
			var pts := []
			var n := maxi(3, seg / 2)
			for i in n + 1:
				var a := -PI / 2.0 + float(i) / n * PI / 2.0
				pts.append(Vector2(cos(a) * 0.5, -0.25 + sin(a) * 0.25))
			for i in n + 1:
				var a := float(i) / n * PI / 2.0
				pts.append(Vector2(cos(a) * 0.5, 0.25 + sin(a) * 0.25))
			_lathe(g, pts, seg)
		"wedge": _wedge(g)
		_: _box(g)
	var mesh := _finish(g, flat or s == "wedge")
	_meshes[ck] = mesh
	return mesh

static func _quad(g: Dictionary, a: int, b: int, c: int, d: int) -> void:
	g["i"].append_array([a, b, d, b, c, d])

static func _box(g: Dictionary) -> void:
	# three's BoxGeometry.buildPlane for px, nx, py, ny, pz, nz; each face gets the whole texture
	var faces := [[2, 1, 0, -1, -1, 1], [2, 1, 0, 1, -1, -1], [0, 2, 1, 1, 1, 1], [0, 2, 1, 1, -1, -1], [0, 1, 2, 1, -1, 1], [0, 1, 2, -1, -1, -1]]
	for f in faces:
		var base: int = g["v"].size()
		for iy in 2:
			for ix in 2:
				var v := Vector3()
				v[f[0]] = (ix - 0.5) * f[3]
				v[f[1]] = (iy - 0.5) * f[4]
				v[f[2]] = 0.5 * f[5]
				g["v"].append(v)
				g["uv"].append(Vector2(ix, 1 - iy))
		_quad(g, base, base + 2, base + 3, base + 1)

static func _cylinder(g: Dictionary, rt: float, rb: float, rs: int) -> void:
	var base: int = g["v"].size()
	for y in 2:
		var r := rt if y == 0 else rb
		for x in rs + 1:
			var th := float(x) / rs * TAU
			g["v"].append(Vector3(r * sin(th), 0.5 - y, r * cos(th)))
			g["uv"].append(Vector2(float(x) / rs, 1.0 - y))
	for x in rs:
		_quad(g, base + x, base + rs + 1 + x, base + rs + 2 + x, base + x + 1)
	for top in [true, false]:
		var r := rt if top else rb
		if r <= 0.0: continue
		var sgn := 1.0 if top else -1.0
		var cs: int = g["v"].size()
		for x in rs:
			g["v"].append(Vector3(0, 0.5 * sgn, 0))
			g["uv"].append(Vector2(0.5, 0.5))
		var rim: int = g["v"].size()
		for x in rs + 1:
			var th := float(x) / rs * TAU
			g["v"].append(Vector3(r * sin(th), 0.5 * sgn, r * cos(th)))
			g["uv"].append(Vector2(cos(th) * 0.5 + 0.5, sin(th) * 0.5 * sgn + 0.5))
		for x in rs:
			if top: g["i"].append_array([rim + x, rim + x + 1, cs + x])
			else: g["i"].append_array([rim + x + 1, rim + x, cs + x])

static func _sphere(g: Dictionary, ws: int, hs: int) -> void:
	var base: int = g["v"].size()
	for iy in hs + 1:
		var v := float(iy) / hs
		var uo := 0.5 / ws if iy == 0 else (-0.5 / ws if iy == hs else 0.0)
		for ix in ws + 1:
			var u := float(ix) / ws
			g["v"].append(Vector3(-0.5 * cos(u * TAU) * sin(v * PI), 0.5 * cos(v * PI), 0.5 * sin(u * TAU) * sin(v * PI)))
			g["uv"].append(Vector2(u + uo, 1.0 - v))
	for iy in hs:
		for ix in ws:
			var a := base + iy * (ws + 1) + ix + 1
			var b := base + iy * (ws + 1) + ix
			var c := base + (iy + 1) * (ws + 1) + ix
			var d := base + (iy + 1) * (ws + 1) + ix + 1
			if iy != 0: g["i"].append_array([a, b, d])
			if iy != hs - 1: g["i"].append_array([b, c, d])

static func _torus(g: Dictionary, R: float, t: float, radial: int, tubular: int) -> void:
	var base: int = g["v"].size()
	for j in radial + 1:
		for i in tubular + 1:
			var u := float(i) / tubular * TAU
			var v := float(j) / radial * TAU
			g["v"].append(Vector3((R + t * cos(v)) * cos(u), (R + t * cos(v)) * sin(u), t * sin(v)))
			g["uv"].append(Vector2(float(i) / tubular, float(j) / radial))
	for j in range(1, radial + 1):
		for i in range(1, tubular + 1):
			var a := base + (tubular + 1) * j + i - 1
			var b := base + (tubular + 1) * (j - 1) + i - 1
			var c := base + (tubular + 1) * (j - 1) + i
			var d := base + (tubular + 1) * j + i
			_quad(g, a, b, c, d)

static func _lathe(g: Dictionary, pts: Array, segs: int) -> void:
	var base: int = g["v"].size()
	var n := pts.size()
	for i in segs + 1:
		var phi := float(i) / segs * TAU
		for j in n:
			var p: Vector2 = pts[j]
			g["v"].append(Vector3(p.x * sin(phi), p.y, p.x * cos(phi)))
			g["uv"].append(Vector2(float(i) / segs, float(j) / (n - 1)))
	for i in segs:
		for j in n - 1:
			var b0 := base + j + i * n
			g["i"].append_array([b0, b0 + n, b0 + 1, b0 + n + 1, b0 + 1, b0 + n])

static func _wedge(g: Dictionary) -> void:
	var v := [-.5, -.5, -.5, .5, -.5, -.5, .5, -.5, .5, -.5, -.5, .5, -.5, .5, .5, .5, .5, .5]
	var idx := [0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4, 0, 4, 5, 0, 5, 1, 0, 3, 4, 1, 5, 2]
	for i in idx:
		var p := Vector3(v[i * 3], v[i * 3 + 1], v[i * 3 + 2])
		g["v"].append(p)
		g["uv"].append(Vector2(p.x + 0.5, p.y + p.z * 0.5 + 0.5))
		g["i"].append(g["v"].size() - 1)

## Normals the way three computes them (smooth over shared vertices, or one per face when flat-shaded),
## then each triangle reversed and v flipped for Godot.
static func _finish(g: Dictionary, flat: bool) -> ArrayMesh:
	var V: PackedVector3Array = g["v"]
	var UV: PackedVector2Array = g["uv"]
	var I: PackedInt32Array = g["i"]
	var verts := PackedVector3Array()
	var norms := PackedVector3Array()
	var uvs := PackedVector2Array()
	var idx := PackedInt32Array()
	if flat:
		for t in range(0, I.size(), 3):
			var a := V[I[t]]; var b := V[I[t + 1]]; var c := V[I[t + 2]]
			var nrm := (c - b).cross(a - b).normalized()
			for k in [2, 1, 0]:
				verts.append(V[I[t + k]]); norms.append(nrm)
				uvs.append(Vector2(UV[I[t + k]].x, 1.0 - UV[I[t + k]].y))
				idx.append(verts.size() - 1)
	else:
		var acc := PackedVector3Array()
		acc.resize(V.size())
		for t in range(0, I.size(), 3):
			var a := V[I[t]]; var b := V[I[t + 1]]; var c := V[I[t + 2]]
			var nrm := (c - b).cross(a - b)
			for k in 3: acc[I[t + k]] += nrm
		# the seam on round shapes duplicates vertices: share their normals so there's no crease
		# (only where they already face nearly the same way, so a cylinder's rim stays sharp against its cap)
		var groups := {}
		for i in V.size():
			var key := V[i].snapped(Vector3.ONE * 1e-5)
			if not groups.has(key): groups[key] = []
			groups[key].append(i)
		for i in V.size():
			verts.append(V[i])
			var mine := acc[i].normalized()
			var s := Vector3()
			for j in groups[V[i].snapped(Vector3.ONE * 1e-5)]:
				if acc[j].normalized().dot(mine) > 0.7: s += acc[j]
			norms.append(s.normalized() if s.length() > 1e-9 else Vector3.UP)
			uvs.append(Vector2(UV[i].x, 1.0 - UV[i].y))
		for t in range(0, I.size(), 3):
			idx.append_array([I[t + 2], I[t + 1], I[t]])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = verts
	arr[Mesh.ARRAY_NORMAL] = norms
	arr[Mesh.ARRAY_TEX_UV] = uvs
	arr[Mesh.ARRAY_INDEX] = idx
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return mesh

## ------------------------------------------------------------------ an instant photo of one of the game's pictures
## The "photo" model's print, with the actual picture in its window instead of the modeler's placeholder.
static func photo_print(path: String) -> Texture2D:
	var src := load(path) as Texture2D
	if src == null: return null
	var im := src.get_image()
	if im.is_compressed(): im.decompress()
	im.convert(Image.FORMAT_RGBA8)
	var W := 88
	var H := 107
	var out := Image.create(W, H, false, Image.FORMAT_RGBA8)
	out.fill(Color("#f0ece0"))
	var win := Rect2i(6, 6, 76, 76)
	var s := mini(im.get_width(), im.get_height())
	var crop := im.get_region(Rect2i((im.get_width() - s) / 2, (im.get_height() - s) / 2, s, s))
	crop.resize(win.size.x, win.size.y, Image.INTERPOLATE_BILINEAR)
	out.blit_rect(crop, Rect2i(Vector2i.ZERO, win.size), win.position)
	# a faint yellowing toward the bottom edge
	for y in range(84, H):
		for x in W:
			out.set_pixel(x, y, out.get_pixel(x, y).darkened(0.03 * float(y - 84) / 23.0))
	return ImageTexture.create_from_image(out)
