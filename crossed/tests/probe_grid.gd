extends SceneTree
## Prints a map of where a body can stand (BodySweep): '#' blocked, '.' free.
## usage: --script tests/probe_grid.gd -- scene=res://... x0 x1 z0 z1 step
var _n := 0
var sc: Node
var args := {}
func _init() -> void:
	var a := OS.get_cmdline_user_args()
	var scene := "res://scenes/prologue/prologue.tscn"
	var nums: Array = []
	for s in a:
		if s.begins_with("scene="): scene = s.substr(6)
		else: nums.append(float(s))
	args["n"] = nums
	sc = (load(scene) as PackedScene).instantiate()
	root.add_child.call_deferred(sc)
func _process(_d: float) -> bool:
	_n += 1
	if _n < 20: return false
	var nums: Array = args["n"]
	var x0: float = nums[0]; var x1: float = nums[1]; var z0: float = nums[2]; var z1: float = nums[3]; var st: float = nums[4]
	var probe := Node3D.new()
	root.add_child(probe)
	var z := z0
	while z <= z1 + 0.001:
		var line := "%6.1f " % z
		var x := x0
		while x <= x1 + 0.001:
			probe.global_position = Vector3(x, 0, z)
			line += "#" if BodySweep.blocked_at(probe, probe.global_position) else "."
			x += st
		print(line)
		z += st
	print("x from %.1f step %.2f" % [x0, st])
	quit()
	return true
