extends Node
## Global settings and the input map.
## Input actions are registered here in code so the project works without
## hand-editing Project Settings > Input Map. Rebind in the editor later if you prefer.

enum ControlScheme { TANK, CAMERA_RELATIVE, OVER_SHOULDER }

signal control_scheme_changed(scheme: ControlScheme)

## Over-the-shoulder is the default (decided 2026-10-29): the camera sits just over Norah's shoulder, she turns
## wherever it turns, WASD / left stick move her (forward, strafe, back), the mouse, arrows or right stick look.
## The old fixed-camera schemes (tank, camera-relative) are still there: F1 cycles them.
var control_scheme: ControlScheme = ControlScheme.OVER_SHOULDER:
	set(value):
		control_scheme = value
		control_scheme_changed.emit(value)

var show_debug_hud := false
var mouse_sensitivity := 0.18      ## degrees per pixel
## The screen style (LookPresets). F2 cycles them while playing.
var look := "crt_night"      ## chosen Oct 29 (E · CRT night: 480x360, scanlines, vignette, cool, higher contrast)
var stick_look_speed := 150.0      ## degrees per second at full tilt
var invert_y := false

const ACTIONS := {
	"move_forward": [KEY_W, KEY_UP],
	"move_back": [KEY_S, KEY_DOWN],
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"run": [KEY_SHIFT],
	"quick_turn": [KEY_Q],
	"interact": [KEY_E, KEY_SPACE],
	"toggle_controls": [KEY_F1],
	"toggle_debug": [KEY_F3],
	"cycle_look": [KEY_F2],
	"aim": [KEY_C],
	"fire": [KEY_F],
	"inventory": [KEY_TAB, KEY_I],
	"reload": [KEY_R],
	"melee": [KEY_V],
	"examine": [KEY_X],
	# menus (the items screen): switch tabs, back out
	"menu_prev": [KEY_Q, KEY_PAGEUP],
	"menu_next": [KEY_R, KEY_PAGEDOWN],
	"menu_back": [KEY_ESCAPE, KEY_BACKSPACE],
	"pause": [KEY_ESCAPE, KEY_P],
	# over the shoulder: walking is WASD only (the arrows turn the camera); menus still use move_* (WASD and arrows)
	"walk_forward": [KEY_W],
	"walk_back": [KEY_S],
	"walk_left": [KEY_A],
	"walk_right": [KEY_D],
	"look_left": [KEY_LEFT],
	"look_right": [KEY_RIGHT],
	"look_up": [KEY_UP],
	"look_down": [KEY_DOWN],
}
const MOUSE := {"aim": MOUSE_BUTTON_RIGHT, "fire": MOUSE_BUTTON_LEFT, "melee": MOUSE_BUTTON_MIDDLE}
const PAD_BUTTONS := {
	"run": [JOY_BUTTON_B],
	"quick_turn": [JOY_BUTTON_X],
	"interact": [JOY_BUTTON_A],
	"aim": [JOY_BUTTON_LEFT_SHOULDER],
	"fire": [JOY_BUTTON_RIGHT_SHOULDER],
	"inventory": [JOY_BUTTON_BACK],
	"reload": [JOY_BUTTON_X],
	"melee": [JOY_BUTTON_Y],
	"examine": [JOY_BUTTON_Y],
	"menu_prev": [JOY_BUTTON_LEFT_SHOULDER],
	"menu_next": [JOY_BUTTON_RIGHT_SHOULDER],
	"menu_back": [JOY_BUTTON_B],
	"pause": [JOY_BUTTON_START],
}
const PAD_AXES := {
	"walk_forward": [JOY_AXIS_LEFT_Y, -1.0],
	"walk_back": [JOY_AXIS_LEFT_Y, 1.0],
	"walk_left": [JOY_AXIS_LEFT_X, -1.0],
	"walk_right": [JOY_AXIS_LEFT_X, 1.0],
	"look_left": [JOY_AXIS_RIGHT_X, -1.0],
	"look_right": [JOY_AXIS_RIGHT_X, 1.0],
	"look_up": [JOY_AXIS_RIGHT_Y, -1.0],
	"look_down": [JOY_AXIS_RIGHT_Y, 1.0],
	"move_forward": [JOY_AXIS_LEFT_Y, -1.0],
	"move_back": [JOY_AXIS_LEFT_Y, 1.0],
	"move_left": [JOY_AXIS_LEFT_X, -1.0],
	"move_right": [JOY_AXIS_LEFT_X, 1.0],
}

## Apply the chosen screen style to whatever scene is running (directors call this at start too).
func apply_look() -> void:
	LookPresets.apply(get_tree().current_scene, look)

func scheme_name() -> String:
	return ["TANK", "CAM-REL", "OVER-SHOULDER"][control_scheme]

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_register_inputs()
	load_settings()

## The pause menu's settings, kept between runs (user://settings.cfg).
const SETTINGS_PATH := "user://settings.cfg"
func save_settings() -> void:
	var c := ConfigFile.new()
	c.set_value("view", "look", look)
	c.set_value("controls", "mouse_sensitivity", mouse_sensitivity)
	c.set_value("controls", "invert_y", invert_y)
	c.set_value("controls", "stick_look_speed", stick_look_speed)
	c.save(SETTINGS_PATH)

func load_settings() -> void:
	var c := ConfigFile.new()
	if c.load(SETTINGS_PATH) != OK: return
	look = c.get_value("view", "look", look)
	mouse_sensitivity = c.get_value("controls", "mouse_sensitivity", mouse_sensitivity)
	invert_y = c.get_value("controls", "invert_y", invert_y)
	stick_look_speed = c.get_value("controls", "stick_look_speed", stick_look_speed)

func _register_inputs() -> void:
	for action in ACTIONS:
		if not InputMap.has_action(action):
			InputMap.add_action(action, 0.25)
		for key in ACTIONS[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
	for action in MOUSE:
		var mev := InputEventMouseButton.new()
		mev.button_index = MOUSE[action]
		InputMap.action_add_event(action, mev)
	for action in PAD_BUTTONS:
		for b in PAD_BUTTONS[action]:
			var ev := InputEventJoypadButton.new()
			ev.button_index = b
			InputMap.action_add_event(action, ev)
	for action in PAD_AXES:
		var ev := InputEventJoypadMotion.new()
		ev.axis = PAD_AXES[action][0]
		ev.axis_value = PAD_AXES[action][1]
		InputMap.action_add_event(action, ev)
	for action in ["move_forward", "move_back", "move_left", "move_right"]:
		var dpad := InputEventJoypadButton.new()
		dpad.button_index = {"move_forward": JOY_BUTTON_DPAD_UP, "move_back": JOY_BUTTON_DPAD_DOWN,
			"move_left": JOY_BUTTON_DPAD_LEFT, "move_right": JOY_BUTTON_DPAD_RIGHT}[action]
		InputMap.action_add_event(action, dpad)
		var dpad2 := dpad.duplicate()
		InputMap.action_add_event(action.replace("move_", "walk_"), dpad2)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_controls"):
		control_scheme = ((control_scheme + 1) % 3) as ControlScheme
		print("Controls: ", scheme_name())
	elif event.is_action_pressed("cycle_look"):
		look = LookPresets.ORDER[(LookPresets.ORDER.find(look) + 1) % LookPresets.ORDER.size()]
		apply_look()
		HUD.caption("Screen style: " + LookPresets.NAMES[look], "", Color(0.85, 0.85, 0.8), 2.5)
	elif event.is_action_pressed("toggle_debug"):
		show_debug_hud = not show_debug_hud
