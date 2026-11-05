class_name ItemsScreen
extends Control
## The items screen (Tab / I / pad Back), Resident Evil style. The game is paused while it's open.
##
##   +--------------------------------------------------------------+
##   |  Q  ITEMS  KEYS  FILES  R                       Tab: close    |
##   |  [ status: Norah, ECG,   ]   [ the selected thing, in 3D      ]|
##   |  [ condition, revolver,  ]   [  name                          ]|
##   |  [ flashlight            ]   [  what it is                    ]|
##   |  [ slot ][ slot ][ slot ][ slot ][ slot ][ slot ]               |
##   |  [ slot ][ slot ][ slot ][ slot ][ slot ][ slot ]               |
##   |  E: use   X: inspect   ...                      message line    |
##   +--------------------------------------------------------------+
##
## ITEMS: E opens a small menu (Use / Load / Combine / Inspect). Combine: pick the second item, E again.
## KEYS:  the keys and codes she has. FILES: notes and pictures, E reads them again.
## Arrows / WASD / d-pad move, Q / R (LB / RB) or clicking a tab switches tabs, Esc / B backs out, Tab closes.
## The mouse works too: hover to select, click to choose, right-click to back out, wheel to switch tabs.

signal closed

const TABS := ["ITEMS", "KEYS", "FILES", "VALUABLES"]
const COLS := 6
const ROWS := 2
const SLOT := Vector2(66, 40)
const GOLD := Color(0.95, 0.8, 0.42)
const INK := Color(0.88, 0.86, 0.78)
const DIM := Color(0.52, 0.52, 0.46)
const LINE := Color(0.36, 0.33, 0.25)
const BG := Color(0.045, 0.05, 0.045, 0.97)

var d                      ## the Chapter1Director (inventory data and the actions live there)
var tab := 0
var cursor := 0
var pick := ""             ## the first item of a combine
var menu: Array = []       ## the open action menu: [[label, action], ...]
var menu_i := 0
var busy := false          ## an action (inspect, read) is showing over the screen
var msg := ""
var _msg_t := 0.0
var _msg_col := INK
var _t := 0.0
var _mouse_prev := {}
var _last_mouse := Vector2(-1, -1)

var panel: Panel
var status: Control
var preview: ItemViewer
var preview_img: TextureRect
var name_l: Label
var desc_l: Label
var grid: Control
var tabs_c: Control
var hint_l: Label
var msg_l: Label
var _icons := {}

func _init(director) -> void:
	d = director

func _ready() -> void:
	size = Vector2(HUD.W, HUD.H)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.size = size
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(dim)
	panel = Panel.new()
	panel.position = Vector2(14, 12)
	panel.size = Vector2(452, 336)
	var sb := StyleBoxFlat.new()
	sb.bg_color = BG
	sb.border_color = LINE
	sb.set_border_width_all(1)
	sb.border_width_top = 2
	sb.shadow_color = Color(0, 0, 0, 0.7)
	sb.shadow_size = 4
	panel.add_theme_stylebox_override("panel", sb)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(panel)

	tabs_c = Control.new()
	tabs_c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tabs_c.draw.connect(_draw_tabs)
	tabs_c.size = Vector2(452, 24)
	panel.add_child(tabs_c)

	status = Control.new()
	status.position = Vector2(10, 30)
	status.size = Vector2(150, 160)
	status.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status.draw.connect(_draw_status)
	panel.add_child(status)

	var pv := _frame(Rect2(168, 30, 274, 160))
	preview = ItemViewer.new()
	preview.position = Vector2(2, 2)
	preview.size = Vector2(130, 118)
	preview.interactive = false
	preview.caption_box = false
	preview.show_pins = false
	pv.add_child(preview)
	preview_img = TextureRect.new()
	preview_img.position = Vector2(6, 10)
	preview_img.size = Vector2(122, 100)
	preview_img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	preview_img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	preview_img.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	pv.add_child(preview_img)
	name_l = _label("", HUD.SERIF, 11, GOLD, pv)
	name_l.position = Vector2(136, 8)
	name_l.size = Vector2(132, 30)
	name_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_l = _label("", HUD.MONO, 9, INK, pv)
	desc_l.position = Vector2(136, 40)
	desc_l.size = Vector2(132, 116)
	desc_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	grid = Control.new()
	grid.position = Vector2(10, 198)
	grid.size = Vector2(432, 100)
	grid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	grid.draw.connect(_draw_grid)
	panel.add_child(grid)

	var rule := ColorRect.new()
	rule.color = LINE
	rule.position = Vector2(10, 304)
	rule.size = Vector2(432, 1)
	panel.add_child(rule)
	hint_l = _label("", HUD.MONO, 8, DIM, panel)
	hint_l.position = Vector2(12, 312)
	hint_l.size = Vector2(250, 14)
	msg_l = _label("", HUD.MONO, 9, INK, panel)
	msg_l.position = Vector2(262, 307)
	msg_l.size = Vector2(180, 26)
	msg_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	msg_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_refresh()

func _frame(r: Rect2) -> Panel:
	var p := Panel.new()
	p.position = r.position
	p.size = r.size
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.02, 0.022, 0.02, 0.9)
	sb.border_color = LINE
	sb.set_border_width_all(1)
	p.add_theme_stylebox_override("panel", sb)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.add_child(p)
	return p

func _label(t: String, font: Font, sz: int, col: Color, parent: Control) -> Label:
	var l := Label.new()
	l.text = t
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 1)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l

## A short line at the bottom right (what an action did): "Loaded 3. 5 / 5 in the cylinder."
func say(t: String, col := INK, secs := 3.0) -> void:
	msg = t
	_msg_col = col
	_msg_t = secs
	msg_l.text = t
	msg_l.add_theme_color_override("font_color", col)
	msg_l.modulate.a = 1.0

# ------------------------------------------------------------------ data
## [id, name, description, count, icon path] for the current tab
func rows() -> Array:
	var out := []
	match TABS[tab]:
		"ITEMS":
			for k in d.inv.keys():
				if not d.ITEM_DB.has(k) or d.TREASURE_DB.has(k): continue
				out.append([k, d.ITEM_DB[k][0], d.ITEM_DB[k][1], int(d.inv[k]), "docs/" + d.ITEM_DB[k][2]])
		"VALUABLES":
			for k in d.inv.keys():
				if not d.TREASURE_DB.has(k) or not d.ITEM_DB.has(k): continue
				out.append([k, d.ITEM_DB[k][0], d.ITEM_DB[k][1] + "\nWorth about $%d. Sell it to a trader." % d.TREASURE_DB[k], int(d.inv[k]), "docs/" + d.ITEM_DB[k][2]])
		"KEYS":
			for k in d.keys_found:
				out.append([k, d.KEY_DB[k][0], d.KEY_DB[k][1], 1, "docs/item_" + k])
		"FILES":
			for f in d.files_found:
				var fd: Dictionary = d.FILE_DB[f]
				out.append([f, fd["title"], "", 1, fd.get("image", "")])
	return out

func _icon(path: String) -> Texture2D:
	if path == "": return null
	if not _icons.has(path):
		var p := "res://assets/textures/%s.png" % path
		_icons[path] = load(p) if ResourceLoader.exists(p) else null
	return _icons[path]

func _per_page() -> int:
	return 12 if TABS[tab] == "FILES" else COLS * ROWS

## What E offers for an item.
func _actions(id: String) -> Array:
	var a := []
	match id:
		"medicine": a.append(["Use", "use"])
		"ammo":
			if d.inv.has("revolver"): a.append(["Load into revolver", "load"])
		"revolver":
			if d.inv.get("ammo", 0) > 0 and d.loaded < 5: a.append(["Reload", "load"])
		"batteries", "battery_half":
			if d.inv.has("flashlight") or d.inv.has("flashlight_dead"): a.append(["Put in flashlight", "battery"])
		"flashlight_dead":
			if d.inv.has("batteries"): a.append(["Put batteries in", "battery"])
	if not d._model_for("ITEMS", id).is_empty():
		a.append(["Inspect", "inspect"])
	a.append(["Combine", "combine"])
	return a

# ------------------------------------------------------------------ input (polled: the tree is paused)
func step() -> void:
	## called every frame by the director while the screen is open; returns when closed via `closed`
	var dt := get_process_delta_time()
	_t += dt
	if _msg_t > 0.0:
		_msg_t -= dt
		if _msg_t <= 0.0:
			var tw := msg_l.create_tween()
			tw.tween_property(msg_l, "modulate:a", 0.0, 0.4)
	status.queue_redraw()
	if busy: return
	var r := rows()
	var n := r.size()
	var moved := false
	var mouse := _mouse_input(r)
	if menu.size() > 0:
		if _pressed("move_forward"): menu_i = (menu_i + menu.size() - 1) % menu.size(); moved = true
		if _pressed("move_back"): menu_i = (menu_i + 1) % menu.size(); moved = true
		if _pressed("interact") or mouse == "click":
			var act: String = menu[menu_i][1]
			menu = []
			_do(act, r[cursor][0])
		elif _pressed("menu_back") or mouse == "back" or _pressed("inventory_close"):
			menu = []
			_blip(0.9)
		if moved: _blip(1.25)
		grid.queue_redraw()
		return
	if _pressed("menu_prev") or mouse == "tab_prev": _switch(-1)
	elif _pressed("menu_next") or mouse == "tab_next": _switch(1)
	elif mouse.begins_with("tab:"): _switch(int(mouse.substr(4)) - tab)
	if _pressed("inventory_close"):
		if pick != "":
			pick = ""; _refresh()
		else:
			closed.emit()
		return
	if _pressed("menu_back") or mouse == "back":
		if pick != "":
			pick = ""; _blip(0.9); _refresh()
		else:
			closed.emit()
		return
	var files: bool = TABS[tab] == "FILES"
	var cols := 2 if files else COLS
	if n > 0:
		var c := cursor
		if _pressed("move_left"): c -= (cols if files else 1)
		if _pressed("move_right"): c += (cols if files else 1)
		if _pressed("move_forward"): c -= (1 if files else cols)
		if _pressed("move_back"): c += (1 if files else cols)
		if files:   # the files list runs down the columns
			pass
		c = clampi(c, 0, n - 1)
		if c != cursor:
			cursor = c
			_blip(1.25)
			_refresh()
	if n == 0: return
	if _pressed("examine"):
		if TABS[tab] != "FILES" or not d._model_for("FILES", r[cursor][0]).is_empty():
			_do("inspect", r[cursor][0])
		return
	if _pressed("interact") or mouse == "click":
		var id: String = r[cursor][0]
		match TABS[tab]:
			"ITEMS":
				if pick != "":
					if pick == id:
						pick = ""
						_blip(0.9)
					else:
						var a: String = pick
						pick = ""
						d._combine(a, id)
					_refresh()
				else:
					menu = _actions(id)
					menu_i = 0
					_blip(1.1)
					grid.queue_redraw()
			"KEYS":
				if not d._model_for("KEYS", id).is_empty(): _do("inspect", id)
				else: say(d.KEY_DB[id][1], INK, 4.0)
			"FILES":
				_do("read", id)
			"VALUABLES":
				say(r[cursor][2], INK, 5.0)

func _pressed(a: String) -> bool:
	if a == "inventory_close":
		return Input.is_action_just_pressed("inventory")
	return InputMap.has_action(a) and Input.is_action_just_pressed(a)

func _switch(by: int) -> void:
	if by == 0: return
	tab = (tab + by + TABS.size()) % TABS.size()
	cursor = 0
	pick = ""
	menu = []
	_blip(1.2)
	_refresh()

func _blip(p := 1.0) -> void:
	if d.audio: d.audio.sfx("ui_blip", -14.0, p)

## Mouse: hover selects, left click = E, right click = back, wheel / tab labels switch tabs.
func _mouse_input(r: Array) -> String:
	var m := get_local_mouse_position()
	var click := _edge(MOUSE_BUTTON_LEFT)
	var back := _edge(MOUSE_BUTTON_RIGHT)
	var up := _edge(MOUSE_BUTTON_WHEEL_UP)
	var down := _edge(MOUSE_BUTTON_WHEEL_DOWN)
	var moved := m.distance_to(_last_mouse) > 0.5
	_last_mouse = m
	var lp := m - panel.position
	if menu.size() > 0:
		var mr := _menu_rect()
		for i in menu.size():
			if Rect2(mr.position + Vector2(0, 4 + i * 13), Vector2(mr.size.x, 13)).has_point(lp - grid.position):
				if moved and menu_i != i:
					menu_i = i; grid.queue_redraw()
				if click: return "click"
		if back: return "back"
		if click and not mr.has_point(lp - grid.position): return "back"
		return ""
	if back: return "back"
	if up: return "tab_prev"
	if down: return "tab_next"
	for i in TABS.size():
		if Rect2(Vector2(30 + i * 70, 4), Vector2(62, 16)).has_point(lp) and click:
			return "tab:%d" % i
	var g := lp - grid.position
	for i in r.size():
		if _slot_rect(i).has_point(g):
			if moved and cursor != i:
				cursor = i
				_refresh()
			if click: return "click"
	return ""

func _edge(b: int) -> bool:
	var now := Input.is_mouse_button_pressed(b)
	var was: bool = _mouse_prev.get(b, false)
	_mouse_prev[b] = now
	return now and not was

func _do(act: String, id: String) -> void:
	match act:
		"use":
			d._use_medicine()
		"load":
			d._combine("ammo", "revolver")
		"battery":
			if id == "flashlight_dead":
				d._combine("batteries", "flashlight_dead")
			elif d.inv.has("flashlight_dead"):
				d._combine(id, "flashlight_dead")
			else:
				d._combine(id, "flashlight")
		"combine":
			pick = id
			say("Combine with... (choose another item, E)", Color(0.6, 0.78, 0.95), 4.0)
			_blip(1.3)
		"inspect":
			var r := rows()
			var spec: Array = d._model_for(TABS[tab], id)
			if spec.is_empty(): return
			busy = true
			visible = false
			await d._inspect(spec[0], spec[1], r[cursor][1], "" if TABS[tab] == "FILES" else r[cursor][2])
			visible = true
			busy = false
		"read":
			busy = true
			visible = false
			await d._doc_view(id)
			visible = true
			busy = false
	# items can disappear (used up, combined)
	cursor = clampi(cursor, 0, max(0, rows().size() - 1))
	_refresh()

# ------------------------------------------------------------------ drawing
func _refresh() -> void:
	tabs_c.queue_redraw()
	grid.queue_redraw()
	status.queue_redraw()
	var r := rows()
	var files: bool = TABS[tab] == "FILES"
	if r.is_empty():
		name_l.text = ""
		desc_l.text = ["Nothing in her pockets yet.", "No keys or codes yet.", "Nothing found yet.\nNotes and pictures she finds are kept here."][tab]
		preview.visible = false
		preview_img.texture = null
	else:
		cursor = clampi(cursor, 0, r.size() - 1)
		var row: Array = r[cursor]
		name_l.text = row[1] + (("  x%d" % row[3]) if row[3] > 1 else "")
		var dsc: String = row[2]
		if row[0] == "revolver": dsc += "\nLoaded: %d / 5." % d.loaded
		if row[0] == "flashlight": dsc += "\nCharge: %d%%." % int(d.light_charge)
		if files: dsc = _file_summary(row[0])
		desc_l.text = dsc
		desc_l.position.y = 12.0 + 14.0 * name_l.get_line_count() + 6.0
		var spec: Array = d._model_for(TABS[tab], row[0])
		if not spec.is_empty():
			preview.visible = true
			preview_img.texture = null
			if preview.key != spec[0] or not spec[1].is_empty():
				preview.show_item(spec[0], spec[1])
		else:
			preview.visible = false
			preview_img.texture = _icon(row[4])
	hint_l.text = _hints(r)

func _file_summary(id: String) -> String:
	var pages: Array = d._file_pages(id)
	var first: String = pages[0] if pages.size() > 0 else ""
	if first.length() > 110: first = first.substr(0, 107) + "..."
	return first + ("\n(%d pages)" % pages.size() if pages.size() > 2 else "")

func _hints(r: Array) -> String:
	if r.is_empty(): return "Q/R: tab   Tab: close"
	if pick != "": return "Choose the second item   E: combine   Esc: cancel"
	match TABS[tab]:
		"ITEMS": return "E: use / combine   X: inspect   Tab: close"
		"KEYS": return "E: look at it   Tab: close"
		"VALUABLES": return "Treasures: for selling   Tab: close"
	return "E: read   X: inspect   Tab: close"

func _draw_tabs() -> void:
	var c := tabs_c
	var f: Font = HUD.MONO
	c.draw_string(f, Vector2(4, 16), "[Q]", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
	for i in TABS.size():
		var x := 30.0 + i * 70.0
		var on := i == tab
		if on:
			c.draw_rect(Rect2(x - 2, 4, 64, 16), Color(0.22, 0.13, 0.08))
			c.draw_rect(Rect2(x - 2, 19, 64, 1), GOLD)
		c.draw_string(f, Vector2(x + 6, 16), TABS[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 11, INK if on else DIM)
	c.draw_string(f, Vector2(30 + TABS.size() * 70.0 - 4, 16), "[R]", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
	c.draw_string(f, Vector2(370, 16), "Tab: close", HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
	c.draw_rect(Rect2(10, 23, 432, 1), LINE)

func _draw_status() -> void:
	var c := status
	var f: Font = HUD.MONO
	var cond: String = d.combat.condition() if d.combat else "FINE"
	var col: Color = {"FINE": Color(0.45, 0.85, 0.42), "CAUTION": Color(0.95, 0.75, 0.25), "DANGER": Color(0.95, 0.28, 0.22)}[cond]
	c.draw_rect(Rect2(0, 0, 150, 160), Color(0.02, 0.022, 0.02, 0.9))
	c.draw_rect(Rect2(0, 0, 150, 160), LINE, false, 1.0)
	c.draw_string(HUD.SERIF, Vector2(8, 15), "NORAH", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, GOLD)
	# the heart trace: calm and green when fine, faster and jagged as it gets worse
	var box := Rect2(8, 22, 134, 40)
	c.draw_rect(box, Color(0, 0.03, 0.01))
	for gx in range(1, 7):
		c.draw_line(Vector2(box.position.x + gx * 19, box.position.y), Vector2(box.position.x + gx * 19, box.end.y), Color(0.1, 0.2, 0.1, 0.5))
	var rate: float = {"FINE": 1.0, "CAUTION": 1.6, "DANGER": 2.4}[cond]
	var pts := PackedVector2Array()
	var head := fmod(_t * 60.0 * rate, box.size.x)
	for i in int(box.size.x):
		var ph := fmod((i / 34.0) + 0.0, 1.0)
		var y := 0.0
		if ph > 0.40 and ph < 0.44: y = -4.0
		elif ph > 0.46 and ph < 0.49: y = 14.0 if cond != "DANGER" else 9.0
		elif ph > 0.49 and ph < 0.52: y = -6.0
		elif ph > 0.62 and ph < 0.70: y = 3.0
		if cond == "DANGER": y += sin(i * 1.7 + _t * 9.0) * 1.2
		pts.append(Vector2(box.position.x + i, box.position.y + box.size.y * 0.6 - y))
	for i in pts.size() - 1:
		var age := fmod(head - i + box.size.x, box.size.x) / box.size.x
		var a := clampf(1.0 - age, 0.08, 1.0)
		if age < 0.04: continue
		c.draw_line(pts[i], pts[i + 1], Color(col.r, col.g, col.b, a), 1.0)
	c.draw_string(f, Vector2(8, 78), cond, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, col)
	var y := 96.0
	if d.inv.has("revolver"):
		c.draw_string(f, Vector2(8, y), "Revolver", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, INK)
		for i in 5:
			var p := Vector2(80 + i * 12, y - 4)
			c.draw_circle(p, 4.0, Color(0.12, 0.11, 0.1))
			if i < d.loaded: c.draw_circle(p, 3.0, Color(0.85, 0.68, 0.3))
		y += 13
		c.draw_string(f, Vector2(8, y), "Spare rounds  %d" % int(d.inv.get("ammo", 0)), HORIZONTAL_ALIGNMENT_LEFT, -1, 8, DIM)
		y += 16
	if d.inv.has("flashlight") or d.inv.has("flashlight_dead"):
		c.draw_string(f, Vector2(8, y), "Flashlight", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, INK)
		var ch: float = d.light_charge if d.inv.has("flashlight") else 0.0
		c.draw_rect(Rect2(80, y - 8, 60, 7), Color(0.12, 0.11, 0.1))
		c.draw_rect(Rect2(80, y - 8, 60 * ch / 100.0, 7), Color(0.9, 0.82, 0.45) if ch > 25 else Color(0.9, 0.4, 0.25))
		y += 16

func _slot_rect(i: int) -> Rect2:
	if TABS[tab] == "FILES":
		var per := 6
		return Rect2((i / per) * 216, (i % per) * 15 + 2, 212, 14)
	return Rect2((i % COLS) * (SLOT.x + 7), (i / COLS) * (SLOT.y + 8) + 2, SLOT.x, SLOT.y)

func _menu_rect() -> Rect2:
	var s := _slot_rect(cursor)
	var w := 118.0
	var h := menu.size() * 13.0 + 8.0
	var x := clampf(s.position.x + s.size.x - 10, 0, 432 - w)
	var y := s.position.y - h + 10
	return Rect2(x, y, w, h)

func _draw_grid() -> void:
	var c := grid
	var f: Font = HUD.MONO
	var r := rows()
	if TABS[tab] == "FILES":
		for i in r.size():
			var rr := _slot_rect(i)
			var on := i == cursor
			if on: c.draw_rect(rr, Color(0.22, 0.13, 0.08))
			c.draw_string(f, rr.position + Vector2(6, 11), ("> " if on else "  ") + r[i][1], HORIZONTAL_ALIGNMENT_LEFT, rr.size.x - 8, 9, GOLD if on else INK)
		if r.is_empty():
			c.draw_string(f, Vector2(6, 14), "-", HORIZONTAL_ALIGNMENT_LEFT, -1, 9, DIM)
		return
	for i in COLS * ROWS:
		var rr := _slot_rect(i)
		c.draw_rect(rr, Color(0.025, 0.028, 0.025))
		c.draw_rect(rr, Color(0.2, 0.2, 0.17), false, 1.0)
		if i >= r.size(): continue
		var tex := _icon(r[i][4])
		if tex:
			c.draw_texture_rect(tex, Rect2(rr.position + Vector2(5, 3), Vector2(56, 34)), false)
		else:
			c.draw_string(f, rr.position + Vector2(6, 24), String(r[i][1]).left(8), HORIZONTAL_ALIGNMENT_LEFT, -1, 8, INK)
		if r[i][3] > 1:
			var s := str(r[i][3])
			c.draw_rect(Rect2(rr.end - Vector2(6 + s.length() * 6, 11), Vector2(4 + s.length() * 6, 10)), Color(0, 0, 0, 0.75))
			c.draw_string(f, rr.end - Vector2(4 + s.length() * 6, 3), s, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color(0.95, 0.95, 0.85))
		if r[i][0] == "revolver":
			c.draw_string(f, rr.position + Vector2(4, 37), "%d/5" % d.loaded, HORIZONTAL_ALIGNMENT_LEFT, -1, 8, Color(0.85, 0.68, 0.3))
		if r[i][0] == pick:
			var pulse := 0.5 + 0.5 * sin(_t * 8.0)
			c.draw_rect(rr.grow(1), Color(0.45, 0.7, 1.0, 0.5 + 0.5 * pulse), false, 2.0)
	if r.size() > 0:
		var cr := _slot_rect(cursor)
		var pulse := 0.75 + 0.25 * sin(_t * 6.0)
		c.draw_rect(cr.grow(1), Color(GOLD.r, GOLD.g, GOLD.b, pulse), false, 2.0)
	if menu.size() > 0:
		var mr := _menu_rect()
		c.draw_rect(mr.grow(1), Color(0, 0, 0, 0.6))
		c.draw_rect(mr, Color(0.07, 0.065, 0.055))
		c.draw_rect(mr, GOLD, false, 1.0)
		for i in menu.size():
			var on := i == menu_i
			var p := mr.position + Vector2(0, 4 + i * 13)
			if on: c.draw_rect(Rect2(p + Vector2(2, 0), Vector2(mr.size.x - 4, 12)), Color(0.24, 0.14, 0.08))
			c.draw_string(f, p + Vector2(8, 10), menu[i][0], HORIZONTAL_ALIGNMENT_LEFT, -1, 9, GOLD if on else INK)

func _process(_delta: float) -> void:
	# pulses and the heart trace keep moving while the game is paused
	if menu.size() > 0 or pick != "" or rows().size() > 0:
		grid.queue_redraw()
