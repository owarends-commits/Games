"""v11 art pass: point the existing materials (prologue, Norah's and Louis's house kits, Chapter One) at the richer
v11 textures. Rewrites the albedo texture in materials/*.tres by material name. Safe to run again.
Run after any builder that regenerates materials (build_ch1_map.py calls it at the end).
"""
import os, re, glob
ROOT = os.path.join(os.path.dirname(__file__), '..')
V = 'v11/'
# material name (without .tres) -> texture (relative to assets/textures), with optional uv scale override
MAP = {
    # trees, leaves, bark
    'nh_bark': V + 'bark_oak.png', 'lh_bark': V + 'bark_oak.png', 'nh_logs': V + 'bark_oak.png',
    'nh_tree': V + 'leaves_orange.png', 'lh_tree': V + 'leaves_gold.png', 'nh_leaves': V + 'leaves_brown.png', 'lh_leaves': V + 'leaves_orange.png',
    'hedge': V + 'leaves_green.png',
    # ground
    'grass': V + 'grass_leaves.png', 'nh_grass': V + 'grass_leaves.png', 'lh_grass': V + 'grass_dead.png', 'c1_bank': V + 'grass_dead.png',
    'nh_dirt': V + 'mud.png', 'lh_dirt': V + 'mud.png', 'lh_mulch': V + 'forest_floor.png',
    'asphalt': V + 'asphalt_cracked.png', 'concrete': V + 'concrete_v11.png', 'lh_stone': V + 'concrete_v11.png',
    # exteriors
    'nh_siding': V + 'siding_gray_peel.png', 'lh_siding': V + 'siding_dark.png',
    'c1_siding_a': V + 'siding_white.png', 'c1_siding_b': V + 'siding_blue.png', 'c1_siding_c': V + 'siding_dark.png',
    'c1_siding_d': V + 'siding_gray_peel.png', 'c1_siding_e': V + 'barn_red_boards.png',
    'brick': V + 'brick_red.png', 'nh_roof': V + 'shingle_dark.png', 'lh_roof': V + 'shingle_brown.png', 'c1_v9_roof_n': V + 'shingle_dark.png',
    'nh_porch': V + 'porch_boards.png', 'nh_porch_patch': V + 'pine_planks.png', 'lh_porch': V + 'weathered_boards.png',
    'nh_trim': V + 'painted_white_wood.png', 'nh_trim_ext': V + 'painted_white_wood.png', 'lh_trim': V + 'painted_white_wood.png',
    'nh_pole': V + 'weathered_boards.png', 'lh_rail': V + 'weathered_boards.png', 'c1_post': V + 'weathered_boards.png',
    'notice_board': V + 'wood_panel.png', 'nh_rust': V + 'metal_rust.png', 'nh_gutter': V + 'metal_rust.png',
    # interiors: floors, woods, tiles
    'lh_floor': V + 'walnut_planks.png', 'lh_floor_attic': V + 'pine_planks.png', 'nh_tile': V + 'tile_hex.png',
    'lh_lino': V + 'checker_red.png', 'nh_lino': V + 'lino_beige.png',
    'wood': V + 'furniture_oak.png', 'nh_wood': V + 'furniture_oak.png', 'lh_wood': V + 'furniture_oak.png',
    'nh_wood_dark': V + 'furniture_walnut.png', 'lh_wood_dark': V + 'furniture_walnut.png', 'lh_radio': V + 'furniture_walnut.png',
    'nh_door': V + 'wood_panel.png', 'lh_door': V + 'wood_panel.png', 'lh_attic_wall': V + 'wood_panel.png', 'lh_splinter': V + 'pine_planks.png',
    'nh_counter': V + 'lino_beige.png', 'lh_counter': V + 'tile_white_small.png',
    'nh_shower': V + 'tile_white.png', 'nh_ceiling': V + 'plaster_v11.png', 'lh_ceiling': V + 'plaster_stained.png', 'ceiling': V + 'plaster_v11.png',
    'lh_toolbox': V + 'metal_rust.png', 'lh_safe': V + 'metal_rust.png',
}
n = 0
for k, tex in MAP.items():
    p = os.path.join(ROOT, 'materials', k + '.tres')
    if not os.path.exists(p): continue
    s = open(p).read()
    s2 = re.sub(r'path="res://assets/textures/[^"]*"', 'path="res://assets/textures/%s"' % tex, s, count=1)
    if 'res://assets/textures/' not in s:
        continue
    if s2 != s:
        open(p, 'w').write(s2); n += 1
print('retextured %d materials' % n)
