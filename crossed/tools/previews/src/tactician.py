# the Tactician (BCROSS) in the playground: settings, engine hooks, spawn, setup panel
j = rep(j, "  norah:{hp:100,", "  tactician:{hp:14, limb:3, walk:1.0, cower:2.4, turn:200, sight:22, allyRange:6, searchRange:20, holdDist:2.4, attackRange:1.25, headbuttDamage:35, headbuttPush:3.2, headbuttDown:0.9, headbuttCool:3.5, boldWait:3.5, counterChance:0.75, counterCool:4, throwDamage:20, throwSpeed:6.5, throwDown:1.0, backoffBold:0.15, backoffOne:0.5, allyDeathBackoff:0.8, headTopple:0.4, toppleStun:2.6, ambushRange:1.8, ambushGrab:0.5, grabDamage:5, holdGap:0.75, smashDamage:40, freedStun:1.2},\n  norah:{hp:100,")
j = rep(j, 'if(type==="runner") opts.variant="runner";\n    this.kind = big ? "brute" : type==="runner" ? "runner" : "across";',
           'if(type==="runner") opts.variant="runner"; if(type==="tactician") opts.variant="tactician";\n    this.kind = big ? "brute" : type==="runner" ? "runner" : type==="tactician" ? "tactician" : "across";')
j = rep(j, "    if(this.kind===\"runner\") return CFG.runner;\n", "    if(this.kind===\"runner\") return CFG.runner;\n    if(this.kind===\"tactician\") return CFG.tactician;\n")
j = rep(j, "    if(this.dead && (this.kind===\"across\"||this.kind===\"runner\")){", "    if(this.dead && (this.kind===\"across\"||this.kind===\"runner\"||this.kind===\"tactician\")){ this.tRise=0;")
j = rep(j, "      else if(this.kind===\"runner\") this.brainRunner(dt, dist, want, toP);\n", "      else if(this.kind===\"runner\") this.brainRunner(dt, dist, want, toP);\n      else if(this.kind===\"tactician\") this.brainTactician(dt, dist, want, toP);\n")
j = rep(j, "    if(k===\"runner\"){ this.poseRunner(dt); return; }", "    if(k===\"runner\"){ this.poseRunner(dt); return; }\n    if(k===\"tactician\"){ this.poseTactician(dt); return; }")
j = rep(j, "    if(this.kind===\"across\"||this.kind===\"runner\"){ this.vel.addScaledVector(", "    if(this.kind===\"across\"||this.kind===\"runner\"||this.kind===\"tactician\"){ this.vel.addScaledVector(")
# toppled over backward: the body pivots on its heels
j = rep(j, "this.root.position.y=groundY(this.pos.x,this.pos.z)+(this.rootY||0); this.root.rotation.y = this.yaw; }", "this.root.position.y=groundY(this.pos.x,this.pos.z)+(this.rootY||0); this.root.rotation.set(0,this.yaw,0); if(this.tRise) this.root.rotateX(this.tRise); }")
# shots
j = rep(j, "    if(this.hp>0 && this.move) this.moveDegrade(dir);\n", "    if(this.hp>0 && this.move) this.moveDegrade(dir);\n    if(this.hp>0 && this.kind===\"tactician\") this.tacHurt(z,dir);\n")
j = rep(j, "    else if(this.kind===\"runner\" && this.rSuper){ stagNote=\"shrugs it off mid-charge\"; this.flinch=0.6; }\n", "    else if(this.kind===\"runner\" && this.rSuper){ stagNote=\"shrugs it off mid-charge\"; this.flinch=0.6; }\n    else if(this.kind===\"tactician\" && this.tNoStag){ stagNote=this.tNoStag; this.tNoStag=null; this.flinch=0.6; }\n")
# her shove: it can read it and counter
j = rep(j, "  for(const e of enemies){ if(e.dead) continue;\n    const d = new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z); const dist=d.length();\n    if(dist < CFG.norah.shoveRange+e.radius && d.normalize().dot(f)>0.5){\n",
           "  for(const e of enemies){ if(e.dead) continue;\n    const d = new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z); const dist=d.length();\n    if(e.kind===\"tactician\" && dist < CFG.norah.shoveRange+e.radius+0.6 && d.clone().normalize().dot(f)>0.5 && e.tacCounter()){ any=true; continue; }\n    if(dist < CFG.norah.shoveRange+e.radius && d.normalize().dot(f)>0.5){\n")
# its grab: break free and it reels back; fail and it smashes its head into her
j = rep(j, "    if(e.kind===\"runner\") e.runnerFreed(dir);\n", "    if(e.kind===\"runner\") e.runnerFreed(dir);\n    else if(e.kind===\"tactician\") e.tacFreed(dir);\n")
j = rep(j, "  if(e.kind===\"runner\"){ joinedRelease(g,true); e.runnerCrush(); qteBanner(\"CRUSHED\",\"bad\"); return; }\n", "  if(e.kind===\"runner\"){ joinedRelease(g,true); e.runnerCrush(); qteBanner(\"CRUSHED\",\"bad\"); return; }\n  if(e.kind===\"tactician\"){ joinedRelease(g,true); e.tacSmash(); qteBanner(\"HEAD SMASH\",\"bad\"); return; }\n")
j = rep(j, 'o.how==="Louis\'s grip"?"has her by the collar":"has her ankle"', 'o.how==="Louis\'s grip"||o.how==="collar pull"?"has her by the collar":"has her ankle"')
# spawn with 6
j = rep(j, '  if(e.code==="Digit5") spawn("across_crawl");\n', '  if(e.code==="Digit5") spawn("across_crawl");\n  if(e.code==="Digit6") spawn("tactician");\n')
# settings panel
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["Tactician (BCROSS)", "Cowardly and malicious. With two or more Crossed within range it's bold; with one it keeps the upper hand but may back off if that one dies; alone it scurries out of her sight to find more, or hides at a doorway or a hallway turn and ambushes her with a head smash or a collar grab.", [
    ["tactician.hp","Health",1,40,0.5],["tactician.walk","Careful walk (m/s)",0.3,3,0.05],["tactician.cower","Fearful scurry (m/s)",0.5,5,0.1],
    ["tactician.allyRange","Crossed this close count as with it (m)",1,15,0.5],["tactician.searchRange","Alone: looks for more within (m)",2,40,1],["tactician.holdDist","Holds this far from her (m)",1,5,0.1],
    ["tactician.boldWait","Bold: attacks without an opening after (s; ×2.2 with one ally)",0.5,15,0.5],["tactician.headbuttDamage","Headbutt damage",0,100,1],["tactician.headbuttCool","Seconds between headbutts",0.5,10,0.25],
    ["tactician.counterChance","Counters her shove (chance)",0,1,0.05],["tactician.counterCool","Seconds between counters",0.5,10,0.25],["tactician.throwDamage","Counter throw damage",0,80,1],
    ["tactician.backoffBold","Backs off when shot: bold (chance)",0,1,0.05],["tactician.backoffOne","…with one ally (chance)",0,1,0.05],["tactician.allyDeathBackoff","Loses its nerve when its last ally dies (chance)",0,1,0.05],
    ["tactician.headTopple","Head shot topples it (chance)",0,1,0.05],["tactician.toppleStun","Down after toppling (s)",0.3,6,0.1],
    ["tactician.ambushRange","Ambush: springs within (m)",0.8,4,0.1],["tactician.ambushGrab","Ambush: grab instead of a head smash (chance)",0,1,0.05],["tactician.smashDamage","Point-blank head smash (failed escape)",0,120,1]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
