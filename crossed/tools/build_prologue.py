#!/usr/bin/env python3
"""Generates scenes/prologue/prologue.tscn: the playable prologue.

Layout:
  Prologue (prologue_director.gd)
    Screen (SubViewportContainer, 3x)       <- the 3D world renders at 320x240 here
      World (SubViewport 320x240)
        Level (community_center.tscn), Player, Actors, Interactables, PostFX
    Audio (audio_director.gd)
The HUD and Dialogue are autoloads and draw at full resolution on top.
Run:  python3 tools/build_prologue.py
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tscn import Scene, T, V3, V2, C, yaw, f

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = Scene()
S.node('Prologue', 'Node', parent=None, script=S.ext_res('Script', 'res://scripts/cutscenes/prologue_director.gd'))
S.node('Screen', 'SubViewportContainer', anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', grow_horizontal='2', grow_vertical='2',
       stretch='true', stretch_shrink='3', texture_filter='1')
S.node('World', 'SubViewport', 'Screen', handle_input_locally='false', audio_listener_enable_3d='true', size='Vector2i(320, 240)',
       render_target_update_mode='4')
W = 'Screen/World'
S.node('Level', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/environments/community_center.tscn'))
S.node('Player', parent=W, instance=S.ext_res('PackedScene', 'res://scenes/characters/player.tscn'), transform=T((-5.0, 0, 4.6), yaw(180)))
S.node('Actors', 'Node3D', W)
ACTOR = S.ext_res('Script', 'res://scripts/characters/actor.gd')
TALK = S.ext_res('Script', 'res://scripts/interactions/interactable.gd')

# name, model, position, facing (deg; 0 = north/-Z), start animation, talk prompt
CAST = [
    ('Adaline', 'adaline', (-5.0, 0, 3.4), 180, 'idle', 'Talk to Adaline'),
    ('Rachel', 'rachel', (-8.0, 0, -16.0), 200, 'talk', 'Talk to Rachel'),
    ('Marcus', 'marcus', (-3.4, 0, -12.6), 80, 'idle', 'Talk to Marcus'),
    ('Denise', 'denise', (-4.5, 0, -14.6), 250, 'talk', 'Talk to Denise'),
    ('Mom2', 'mom2', (-5.3, 0, -14.9), 70, 'listen', 'Talk'),
    ('Dad2', 'dad2', (-6.6, 0, -12.2), 270, 'talk', 'Talk'),
    ('Dad2b', 'dad2', (-5.8, 0, -12.0), 95, 'listen', ''),
    ('Dad3', 'dad3', (-9.4, 0, -15.4), 300, 'hold_cup', 'Talk'),
    ('Mom2b', 'mom2', (-10.2, 0, -14.8), 120, 'talk', ''),
    ('Stranger', 'stranger', (-3.3, 0, -16.6), -60, 'idle', 'Talk'),
    ('Amelia', 'amelia', (-9.0, 0, -10.6), 0, 'play', ''),
    ('KidBoy', 'kid_boy', (-8.0, 0, -11.0), 90, 'play', 'Talk'),
    ('KidGirl', 'kid_girl', (-10.0, 0, -9.9), 200, 'play', 'Talk'),
    ('KidBoy2', 'kid_boy', (-7.6, 0, -9.8), 30, 'play', ''),
    ('KidGirl2', 'kid_girl', (-10.4, 0, -11.3), 300, 'play', ''),
    ('Across', 'across', (-16.3, 0, -15.5), 270, 'folded', ''),
    ('LotAcross1', 'across', (-26, 0, 24.5), 90, 'shamble', ''),
    ('LotAcross2', 'across', (27, 0, 23), 270, 'shamble', ''),
    ('LotAcross3', 'across', (0, 0, 33), 180, 'shamble', ''),
    ('LotAcross4', 'across', (-23, 0, 11), 90, 'crawl', ''),
    ('Across2', 'across', (-16.3, 0, -10.5), 270, 'folded', ''),
    ('RoadAcross1', 'across', (66.2, 0, 76.5), 270, 'quad_idle', ''),
    ('RoadAcross2', 'across', (53.6, 0, 70.0), 90, 'shamble', ''),
    ('RoadAcross3', 'across', (66.2, 0, 86.0), 270, 'shamble', ''),
    ('LotFumbler', 'dad2', (-0.1, 0, 5.6), 90, 'beg', ''),
    ('CarKenneth', 'kenneth', (199.62, -200, 200.0), 0, 'sit_drive', ''),
    ('CarStranger', 'stranger', (199.92, -200, 200.98), 0, 'sit_beg', ''),
    ('CarAdaline', 'adaline', (200.45, -200, 200.98), 0, 'sit_scared', ''),
    ('KennethDown', 'kenneth', (65.5, 0.12, 107.3), 160, 'down', ''),
]
for name, model, pos, face, anim, prompt in CAST:
    props = dict(transform=T(pos, yaw(face)), script=ACTOR, model_id='"%s"' % model, start_animation='"%s"' % anim)
    if name.startswith('Kid') or name in ('Amelia', 'Adaline'):
        props['walk_speed'] = '1.1'; props['run_speed'] = '2.8'
    if name.startswith('LotAcross') or name.startswith('RoadAcross') or name in ('Across', 'Across2', 'LotFumbler', 'KennethDown'):
        props['visible'] = 'false'
    if anim in ('talk', 'listen', 'hold_cup'):
        props['idle_animation'] = '"%s"' % anim
    a = S.node(name, 'Node3D', 'Screen/World/Actors', **props)
    if prompt:
        S.node('Talk', 'Marker3D', a, transform=T((0, 1.0, 0)), script=TALK, prompt='"%s"' % prompt, radius='1.5')

S.node('Interactables', 'Node3D', W)
S.node('PunchTable', 'Marker3D', W + '/Interactables', transform=T((-1.75, 0.8, -11.6)), script=TALK, prompt='"Get some punch"', radius='1.3')

post = S.sub_res('ShaderMaterial', shader=S.ext_res('Shader', 'res://shaders/ps1_post.gdshader'))
S.node('PostFX', 'CanvasLayer', W, layer='10')
S.node('Screen', 'ColorRect', W + '/PostFX', material=post, anchors_preset='15', anchor_right='1.0', anchor_bottom='1.0', mouse_filter='2')
S.node('Audio', 'Node', script=S.ext_res('Script', 'res://scripts/systems/audio_director.gd'))
S.write(os.path.join(ROOT, 'scenes/prologue/prologue.tscn'))
print('prologue.tscn: %d nodes' % len(S.nodes))
