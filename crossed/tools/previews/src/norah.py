# Norah: the reluctant walk/jog and three health states
j = rep(j, "norah:{hp:100, bleedAt:0.6,", "norah:{hp:100, hurtAt:0.6, critAt:0.3, hurtSpeed:0.8, critSpeed:0.62, jogStride:0.55, bleedAt:0.6,")
j = rep(j, """  const t = performance.now()/1000*(moving===2?11:7);
  const sw = moving? Math.sin(t)*(moving===2?0.8:0.45) : 0;
  P.legL.rotation.x = sw; P.legR.rotation.x = -sw; P.kneeL.rotation.x=Math.max(0,-sw)*0.9; P.kneeR.rotation.x=Math.max(0,sw)*0.9;
  P.hips.position.y=0.95; P.hips.rotation.set(moving===2?0.15:0,0,0); P.neck.rotation.set(0,0,0);
""", """  const sw = norahGait(P, moving, Math.hypot(v.x,v.z), dt);
""")
j = rep(j, "  else { P.armL.rotation.set(-sw*0.8,0,0); P.armR.rotation.set(sw*0.8,0,0); }", "  else norahArms(P);")
assert j.count("(player.dazed>0?0.6:1)")==3
j = j.replace("(player.dazed>0?0.6:1)", "(player.dazed>0?0.6:1)*norahSpeedMul()")
j = rep(j, "mournerStagger3:0.35, animClip:1,", "mournerStagger3:0.35, animRunMix:0.45, animClip:1,")
j = rep(j, '["across.animRunRef","Run clip matches (m/s)",1,6,0.1],', '["across.animRunRef","Run clip matches (m/s)",1,6,0.1],["across.animRunMix","How much of the run clip in a burst (lower = more of a jog)",0,1,0.05],')
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["Norah · Movement", "Her walk and a reluctant, short jog. Three states by health: fine (upright, wary, the odd glance back); hurt (bleeding: left hand clutching her side, and now and then a staggered step on the right leg, more often as she gets worse); critical (a full limp every step, hunched, dragging the right leg, lurching when it gives, heavy breathing). Only her jog slows down; her walk keeps its pace.", [
    ["norah.hurtAt","Hurt below (share of health)",0.1,1,0.05],["norah.critAt","Critical below (share of health)",0.05,0.9,0.05],["norah.hurtSpeed","Hurt: jog speed × (walk unchanged)",0.3,1,0.05],["norah.critSpeed","Critical: jog speed × (walk unchanged)",0.2,1,0.05],["norah.jogStride","Jog stride (leg swing)",0.2,1.2,0.05]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
# a little less pixelly: render at 480 wide by default (was 320); settings still on the old default move up once
j = rep(j, 'world:{arena:"open", res:320,', 'world:{arena:"open", res:480,')
j = rep(j, 'deepMerge(CFG, LS.get("crossed_sandbox_cfg_v3", {}));', 'deepMerge(CFG, LS.get("crossed_sandbox_cfg_v3", {}));\nif(!CFG.world.resV2){ if(CFG.world.res===320) CFG.world.res=480; CFG.world.resV2=true; }')
