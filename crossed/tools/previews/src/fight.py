# Fight structure pass: slower, readable ACROSS; aim help; punish windows; new grab prompts.
# Runs inside build.py with j (engine JS), b (engine DOM) and rep() in scope.
import re as _re

def setvals(src, block, vals):
    i = src.index("  " + block + ":{"); k = src.index("}", i)
    seg = src[i:k]
    for key, v in vals.items():
        seg2, n = _re.subn(r"(\b" + key + r":)[^,}]+", r"\g<1>" + str(v), seg, count=1)
        if n != 1: sys.exit("setvals failed: " + block + "." + key)
        seg = seg2
    return src[:i] + seg + src[k:]

# ACROSS: slower, steadier, longer tells, longer recoveries, bigger hitboxes, one attacker at a time
j = setvals(j, "across", {"speed":1.7, "turn":170, "erratic":0.3, "lungeRange":2.4, "lungeWindup":0.65, "lungeSpeed":5.5, "lungeTime":0.45, "recover":1.2,
    "burstMin":0.9, "burstMax":1.9, "stallMin":0.3, "stallMax":0.8, "tripChance":0.25, "jerk":0.6, "swipeWindup":0.42, "swipeCool":1.4,
    "maxAttackers":1, "circleDist":3.2, "hitboxScale":1.15, "limbHitbox":1.25})
j = rep(j, "maxAttackers:1, circleDist:3.2,", "maxAttackers:1, circleDist:3.2, punish:1.8, hugMash:true, hugTime:2.6, mashPer:0.11, mashDecay:0.35,")
j = setvals(j, "phys", {"acrossAccel":4, "acrossDecel":5})
j = setvals(j, "rev", {"assistAngle":40, "assistRange":12})
j = rep(j, "assistRange:12,", "assistRange:12, aimFriction:0.45,")
# new defaults must win over settings saved by the earlier version
j = rep(j, 'deepMerge(CFG, LS.get("crossed_playground_cfg", {}));', 'deepMerge(CFG, LS.get("crossed_sandbox_cfg_v2", {}));')
j = rep(j, 'function saveCfg(){ LS.set("crossed_playground_cfg", CFG); }', 'function saveCfg(){ LS.set("crossed_sandbox_cfg_v2", CFG); }')

# the brand flares while an attack is winding up: the tell you react to
j = rep(j, "if(P.brandGlow){ const k=0.5+0.5*Math.sin(performance.now()*0.004+this.phase); P.brandGlow.color.setRGB(",
        "if(P.brandGlow && !this.dead && (this.state===\"windup\" || (this.state===\"swipe\"&&!this.hitDone) || (this.state===\"grab\"&&!this.hitDone))){ const f=0.6+0.4*Math.sin(performance.now()*0.04); P.brandGlow.color.setRGB(1,0.55*f+0.2,0.1); }\n    else if(P.brandGlow){ const k=0.5+0.5*Math.sin(performance.now()*0.004+this.phase); P.brandGlow.color.setRGB(")

# punish window: shot while recovering from its own attack = a much longer stagger
j = rep(j, "  hit(mesh, point, dir){\n", "  hit(mesh, point, dir){\n    const wasRecover = this.kind===\"across\" && this.state===\"recover\";\n")
j = rep(j, "else { this.stagger = stag; this.state=\"stagger\";", "else { this.stagger = stag*(wasRecover?CFG.across.punish:1); if(wasRecover) stag=this.stagger; this.state=\"stagger\";")
j = rep(j, "stagNote = `stagger ${stag.toFixed(2)}s`; }", "stagNote = `stagger ${stag.toFixed(2)}s${wasRecover?\" (caught recovering)\":\"\"}`; }")
j = rep(j, "const mult = ZC[z+\"Mult\"], kb = ZC[z+\"Kb\"], stag = ZC[z+\"Stag\"];", "const mult = ZC[z+\"Mult\"], kb = ZC[z+\"Kb\"]; let stag = ZC[z+\"Stag\"];")

# aim friction and a crosshair that shows when it is on a body
j = rep(j, "const s = 0.0025*CFG.ctrl.mouseSens;", "const s = 0.0025*CFG.ctrl.mouseSens*(player.aiming&&SB.aimOver?CFG.rev.aimFriction:1);")
j = rep(j, "const lookX = pad.look.x*CFG.ctrl.padLook*dt, lookY = pad.look.y*CFG.ctrl.padLook*dt*(CFG.ctrl.invertY?-1:1);",
        "const fr=(player.aiming&&SB.aimOver?CFG.rev.aimFriction:1); const lookX = pad.look.x*CFG.ctrl.padLook*dt*fr, lookY = pad.look.y*CFG.ctrl.padLook*dt*fr*(CFG.ctrl.invertY?-1:1);")
j = rep(j, '$("reticle").className = "hud "+(player.hammer>0||player.reloading>0?"wait":"");',
        '$("reticle").className = "hud "+(player.hammer>0||player.reloading>0?"wait ":"")+(aimOverCheck(fixed)?"on":"");')

# panel sliders for the new numbers
j = rep(j, '["rev.fixedAimAngle","Fixed-cam auto-aim angle",10,180,5],', '["rev.aimFriction","Aim slows over a target ×",0.1,1,0.05],["rev.fixedAimAngle","Fixed-cam auto-aim angle",10,180,5],')
j = rep(j, '["across.grabDamage","Grab: damage (grab and bite)",0,40,1],',
        '["across.punish","Stagger × when shot while it recovers",1,4,0.1],["across.grabDamage","Grab: damage (grab and bite)",0,40,1],["chk","across.hugMash","Bear hug: mash one key instead of prompts"],["across.hugTime","Bear hug: time to break it (s)",0.8,6,0.1],["across.mashPer","Bear hug: fill per press",0.03,0.4,0.01],["across.mashDecay","Bear hug: meter drains per second",0,1.5,0.05],')

# grab prompts: replace the quick-time-event logic
q0 = j.index("function startQte(g, hug){"); q1 = j.index("function use(){")
j = j[:q0] + open(os.path.join(D, "qte.js")).read() + "\n" + j[q1:]
g0 = j.index('  const gm=$("grabmsg"); const g=player.grabbed;'); g1 = j.index('  else gm.style.display="none";', g0) + len('  else gm.style.display="none";')
j = j[:g0] + "  renderQte();" + j[g1:]

# DOM: the prompt panel, a red vignette while held, a result banner
m0 = b.index('<div id="grabmsg"'); m1 = b.index('</div>\n</div>', b.index('<div id="qteSteps"', m0)) + len('</div>\n</div>')
b = b[:m0] + '<div id="grabmsg" role="alert"></div>\n<div id="grabVig"></div>\n<div id="qteResult"></div>' + b[m1:]

j = rep(j, 'log(`${by.name} ${o.how==="bear hug"?"has her in a bear hug":"has her ankle"}: hit the prompts to push it off`, "#ff7070"); return true;',
        'log(`${by.name} ${o.how==="bear hug"?"has her in a bear hug":"has her ankle"}: ${o.how==="bear hug"&&CFG.across.hugMash?"mash to break it":"hit the prompts to push it off"}`, "#ff7070"); return true;')
