@tool
class_name CharacterModel
extends Node3D
## Visual for a character: instances assets/characters/<model_id>.glb, puts the PS1
## material on it and plays its animations. Shows up in the editor too.

@export var model_id := "kenneth":
	set(v):
		model_id = v
		if is_inside_tree():
			_build()
@export var start_animation := "idle"
@export var start_offset_random := true   ## desync crowds so they don't breathe in step

const ONE_SHOTS := ["fall", "land", "awaken", "lunge", "swipe", "morph", "morph_lunge", "fire", "sit_fire", "foot_turn", "windup", "pounce", "hit", "stagger", "die", "melee", "dodge", "reload", "hurt", "land_hard", "brute_swing", "bash", "duck", "wrench", "roll", "duck_roll", "shoulder_charge", "bed_crash"]
static var _materials := {}

## who this is in the dialogue files (Dialogue drives their talking); empty = from the model ("norah_worn" -> "norah")
@export var speaker := ""
var anim: AnimationPlayer
var skeleton: Skeleton3D
var talk: TalkModifier
var current := ""
var _model: Node3D

func _ready() -> void:
	_build()

func _build() -> void:
	if _model:
		_model.queue_free()
		_model = null
	var path := "res://assets/characters/%s.glb" % model_id
	if not ResourceLoader.exists(path):
		push_warning("CharacterModel: missing %s" % path)
		return
	_model = (load(path) as PackedScene).instantiate()
	_model.name = "Model"
	add_child(_model)
	anim = _model.find_child("AnimationPlayer", true, false)
	skeleton = _model.find_child("Skeleton3D", true, false)
	if skeleton and not Engine.is_editor_hint():
		talk = TalkModifier.new()
		talk.name = "Talk"
		talk.model = self
		skeleton.add_child(talk)
		add_to_group("talkers")
	var mats := _get_materials(model_id)
	for mi in _model.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		for s in m.mesh.get_surface_count():
			var name := m.mesh.surface_get_material(s).resource_name if m.mesh.surface_get_material(s) else ""
			var part := name.get_slice("_", name.get_slice_count("_") - 1)
			m.set_surface_override_material(s, mats.get(part, mats["body"]))
	if anim:
		for a in anim.get_animation_list():
			anim.get_animation(a).loop_mode = Animation.LOOP_NONE if a in ONE_SHOTS else Animation.LOOP_LINEAR
		if start_animation != "" and anim.has_animation(start_animation):
			play(start_animation, 0.0)
			if start_offset_random and not Engine.is_editor_hint():
				anim.seek(randf() * anim.current_animation_length, true)

## One material per kind of surface. The MakeHuman-built people (tools/build_humans.py) carry several textures:
## <id>.png (skin, face, close-fitting clothes), <id>_cloth.png (jackets, coats, shoes), <id>_skirt.png,
## <id>_hair.png (strands, with alpha), <id>_eyes.png, <id>_detail.png (teeth, lashes, frames, hats).
static func _get_materials(id: String) -> Dictionary:
	if _materials.has(id):
		return _materials[id]
	var dir := "res://assets/characters/"
	var tex := func(suffix: String) -> Texture2D:
		var p := dir + id + ("_" + suffix if suffix != "" else "") + ".png"
		return load(p) if ResourceLoader.exists(p) else null
	var surf := func(t: Texture2D, shader := "res://shaders/ps1_surface.gdshader") -> ShaderMaterial:
		var m := ShaderMaterial.new()
		m.shader = load(shader)
		m.set_shader_parameter("albedo_tex", t)
		m.set_shader_parameter("world_uv", false)
		m.set_shader_parameter("uv_scale", Vector2.ONE)
		m.set_shader_parameter("affine_amount", 0.12)
		return m
	var body: ShaderMaterial = surf.call(tex.call(""))
	var glow := ShaderMaterial.new()
	glow.shader = load("res://shaders/ps1_glow.gdshader")
	if id == "louis":     # his eyes burn orange, not the prologue ACROSS white
		glow.set_shader_parameter("color", Color(1.0, 0.42, 0.12))
	var flesh: ShaderMaterial = surf.call(tex.call(""), "res://shaders/ps1_flesh.gdshader")   # flesh that moves under the skin (the Brute's arm)
	var cloth_t: Texture2D = tex.call("cloth")
	var out := {"body": body, "glow": glow, "flesh": flesh}
	out["cloth"] = surf.call(cloth_t) if cloth_t else body
	var skirt_t: Texture2D = tex.call("skirt")
	out["skirt"] = surf.call(skirt_t) if skirt_t else out["cloth"]
	var hair_t: Texture2D = tex.call("hair")
	if hair_t: out["hair"] = surf.call(hair_t, "res://shaders/ps1_hair.gdshader")
	var eyes_t: Texture2D = tex.call("eyes")
	if eyes_t: out["eyes"] = surf.call(eyes_t)
	var det_t: Texture2D = tex.call("detail")
	if det_t: out["detail"] = surf.call(det_t)
	var face_t: Texture2D = tex.call("face")
	out["face"] = surf.call(face_t) if face_t else body
	_materials[id] = out
	return out

## The name this character speaks under in the dialogue files.
func speaker_id() -> String:
	if speaker != "": return speaker
	return model_id.trim_suffix("_worn").trim_suffix("_morph")

func play(anim_name: String, blend := 0.15, speed := 1.0) -> void:
	if anim == null or not anim.has_animation(anim_name):
		return
	if anim_name == current and anim.is_playing():
		anim.speed_scale = speed
		return
	current = anim_name
	anim.play(anim_name, blend)
	anim.speed_scale = speed

## Plays a one-shot animation and waits for it to end.
func play_once(anim_name: String, blend := 0.05, speed := 1.0) -> void:
	if anim == null or not anim.has_animation(anim_name):
		return
	current = anim_name
	anim.play(anim_name, blend)
	anim.speed_scale = speed
	await anim.animation_finished

## Snap to a pose with no blending (the ACROSS awakening must not ease in).
func snap(anim_name: String) -> void:
	if anim == null or not anim.has_animation(anim_name):
		return
	current = anim_name
	anim.play(anim_name, 0.0)
	anim.seek(0.0, true)

func attach(node: Node3D, bone: String) -> BoneAttachment3D:
	var ba := BoneAttachment3D.new()
	ba.bone_name = bone
	skeleton.add_child(ba)
	ba.add_child(node)
	return ba
