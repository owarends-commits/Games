class_name GroundFog
extends Node3D
## Thick fog lying on the ground outside (Chapter One). Stacked sheets of ground_fog.gdshader from the ankles
## up past the waist (wisps only that high) over the whole map; a top-down mask (made by tools/build_ch1_map.py) keeps it out of the houses,
## and the car and truck carry a clear bubble so it never fills their cabins.

@export var mask: Texture2D
@export var mask_rect := Vector4(-90, -80, 220, 400)
@export var heights: PackedFloat32Array = [0.04, 0.13, 0.24, 0.37, 0.52, 0.7, 0.92, 1.2, 1.55]
@export var density := 0.34
@export var vehicles: Array[NodePath] = []

var mat: ShaderMaterial
var _veh: Array[Node3D] = []

func _ready() -> void:
	var noise := FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.frequency = 0.012
	noise.fractal_octaves = 3
	var tex := NoiseTexture2D.new()
	tex.width = 256; tex.height = 256; tex.seamless = true; tex.noise = noise
	mat = ShaderMaterial.new()
	mat.shader = preload("res://shaders/ground_fog.gdshader")
	mat.set_shader_parameter("noise_tex", tex)
	mat.set_shader_parameter("mask_tex", mask)
	mat.set_shader_parameter("mask_rect", mask_rect)
	mat.set_shader_parameter("density", density)
	mat.render_priority = -1
	var plane := PlaneMesh.new()
	plane.size = Vector2(mask_rect.z, mask_rect.w)
	plane.subdivide_width = 22; plane.subdivide_depth = 40
	for h in heights:
		var mi := MeshInstance3D.new()
		mi.mesh = plane
		mi.material_override = mat
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.position = Vector3(mask_rect.x + mask_rect.z / 2.0, h, mask_rect.y + mask_rect.w / 2.0)
		add_child(mi)
	for p in vehicles:
		var n := get_node_or_null(p) as Node3D
		if n: _veh.append(n)

func _process(_d: float) -> void:
	for i in 2:
		var v := Vector4(0, 0, -1, 0)
		if i < _veh.size() and is_instance_valid(_veh[i]) and _veh[i].is_visible_in_tree():
			var g := _veh[i].global_position
			v = Vector4(g.x, g.z, 2.2, 0)
		mat.set_shader_parameter("hole%d" % i, v)
