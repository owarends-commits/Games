@tool
class_name Interactable
extends Marker3D
## Something the player can use, search or talk to. The player looks for the nearest enabled
## interactable in front of them; pressing interact emits `used`.
## With `glow` on (Chapter One), it glows softly while it's worth searching, and a small "E" floats
## over it when it's the one she'd use, in place of the prompt text at the bottom of the screen.

signal used(who: Interactable)

@export var prompt := "Talk"
@export var radius := 1.4
@export var enabled := true
@export var conversation := ""   ## optional: played automatically when used (if no one handles `used`)
@export var glow := false        ## soft glow + floating E key instead of the HUD prompt

var used_once := false
var focused := false
var _halo: MeshInstance3D
var _light: OmniLight3D
var _key: Label3D
var _t := 0.0
static var _halo_tex: GradientTexture2D

func _ready() -> void:
	if Engine.is_editor_hint():
		return
	add_to_group("interactable")
	if glow:
		_build_glow()

func use() -> void:
	used_once = true
	used.emit(self)
	if conversation != "" and used.get_connections().is_empty():
		await Dialogue.play(conversation)

func set_focused(on: bool) -> void:
	focused = on

func _build_glow() -> void:
	if _halo_tex == null:
		_halo_tex = GradientTexture2D.new()
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		_halo_tex.gradient = g
		_halo_tex.fill = GradientTexture2D.FILL_RADIAL
		_halo_tex.fill_from = Vector2(0.5, 0.5)
		_halo_tex.fill_to = Vector2(0.5, 0.0)
		_halo_tex.width = 32
		_halo_tex.height = 32
	_halo = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.75, 0.75)
	_halo.mesh = q
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.albedo_texture = _halo_tex
	m.albedo_color = Color(1.0, 0.82, 0.5, 0.0)
	m.no_depth_test = false
	_halo.material_override = m
	_halo.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_halo)
	_light = OmniLight3D.new()
	_light.light_color = Color(1.0, 0.82, 0.55)
	_light.omni_range = 0.95
	_light.light_energy = 0.0
	_light.shadow_enabled = false
	add_child(_light)
	_key = Label3D.new()
	_key.text = "E"
	_key.font = load("res://assets/fonts/DejaVuSansMono-Bold.ttf")
	_key.font_size = 28
	_key.outline_size = 8
	_key.pixel_size = 0.0045
	_key.modulate = Color(1.0, 0.95, 0.8)
	_key.outline_modulate = Color(0.05, 0.04, 0.03, 0.9)
	_key.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_key.no_depth_test = true
	_key.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_key.position = Vector3(0, 0.32, 0)
	_key.visible = false
	add_child(_key)
	_t = randf() * 6.0

func _process(delta: float) -> void:
	if Engine.is_editor_hint() or not glow or _halo == null:
		return
	_t += delta
	var p := get_tree().get_first_node_in_group("player") as Node3D
	var near := false
	if p:
		var d := p.global_position.distance_to(global_position)
		near = d < 6.0 and absf(p.global_position.y - global_position.y) < 2.4
	var lit := enabled and is_visible_in_tree() and near and not used_once
	var a := (0.16 + 0.1 * sin(_t * 2.4)) if lit else 0.0
	var m := _halo.material_override as StandardMaterial3D
	m.albedo_color.a = move_toward(m.albedo_color.a, a, delta * 1.5)
	_halo.visible = m.albedo_color.a > 0.005
	_light.light_energy = move_toward(_light.light_energy, (0.35 + 0.15 * sin(_t * 2.4)) if lit else 0.0, delta * 2.0)
	_light.visible = _light.light_energy > 0.01
	# The key only shows in free play: never during a scripted camera or a locked moment, and never
	# when the camera is right on top of it (no depth test, so up close it would fill the screen).
	var show := focused and enabled
	if show and p and (bool(p.get("control_locked")) or Dialogue.locks_player or not Cameras._overrides.is_empty()):
		show = false
	if show:
		var cam := get_viewport().get_camera_3d()
		if cam and cam.global_position.distance_to(_key.global_position) < 1.2:
			show = false
	_key.visible = show
