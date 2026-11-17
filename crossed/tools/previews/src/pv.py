# preview bodies (PV): the Contortionist, the Reachers, the split-head Reacher, the Hob. Engine hooks, settings, spawns.
j = rep(j, "  norah:{hp:100,", """  contortionist:{hp:9, sight:20, stopAt:0.9, attackCool:2.2, strikeDamage:18, strikePush:3.2, wrapDamage:6, wrapChance:0.65, biteDamage:16, bitePush:1.6},
  reacher:{hp:11, sight:22, attackCool:2.0, whipDamage:25, whipPush:3.4, biteDamage:20, coilDamage:8, coilBiteDamage:30, swipeDamage:15, swipePush:3.0, snatchDamage:6, snatchBiteDamage:25, tripDown:2.2, pinDamage:10, armJointHp:3},
  splithead:{hp:30, bodyHp:6, neck:5.0, sight:22, attackCool:1.6, baitDamage:15, biteDamage:25, engulfDamage:8, engulfBiteDamage:40, splitMult:3.0, headMult:0.25, dodgeChance:0.55},
  hob:{hp:999, crawl:0.9, fast:2.4, sight:30, grabDamage:12, squeezeDamage:8, throneDamage:10, throneBiteDamage:45, crossShots:2, eyeShots:2, screechCool:9, stun:2.5},
  norah:{hp:100,""")
# the update, hits, removal, shots and grabs go to the preview body
j = rep(j, "  update(dt){\n    if(this.dead && (this.kind===", "  update(dt){\n    if(this.kind===\"pv\"){ this.pvUpdate(dt); return; }\n    if(this.dead && (this.kind===")
j = rep(j, "  hit(mesh, point, dir){\n", "  hit(mesh, point, dir){\n    if(this.kind===\"pv\"){ this.pvHit(mesh,point,dir); return; }\n")
j = rep(j, "  remove(){ if(this.runnerRemoveFx) this.runnerRemoveFx();", "  remove(){ this.removed=true; if(this.pv) this.pv.dispose(); if(this.runnerRemoveFx) this.runnerRemoveFx();")
j = rep(j, "function enemyMeshes(){ const t=[]; for(const e of enemies) if(!e.dead) e.root.traverse(o=>{ if(o.isMesh && o.userData.enemy) t.push(o); }); return t; }",
           "function enemyMeshes(){ const t=[]; for(const e of enemies) if(!e.dead){ if(e.pv){ for(const m of e.pv.hits) if(m.userData.enemy) t.push(m); continue; } e.root.traverse(o=>{ if(o.isMesh && o.userData.enemy) t.push(o); }); } return t; }")
j = rep(j, "    if(e.kind===\"runner\") e.runnerFreed(dir);\n    else if(e.kind===\"tactician\") e.tacFreed(dir);\n", "    if(e.kind===\"pv\"){ const K=PVK[e.pvType]; if(K.freed) K.freed(e,dir); }\n    else if(e.kind===\"runner\") e.runnerFreed(dir);\n    else if(e.kind===\"tactician\") e.tacFreed(dir);\n")
j = rep(j, "  if(e.kind===\"runner\"){ joinedRelease(g,true); e.runnerCrush(); qteBanner(\"CRUSHED\",\"bad\"); return; }\n", "  if(e.kind===\"pv\"){ joinedRelease(g,true); const K=PVK[e.pvType]; if(K.failed&&K.failed(e,g)) return; player.bite(e,\"bite\",g.dmg); qteBanner(\"TOO SLOW · BITTEN −\"+Math.round(g.dmg),\"bad\"); return; }\n  if(e.kind===\"runner\"){ joinedRelease(g,true); e.runnerCrush(); qteBanner(\"CRUSHED\",\"bad\"); return; }\n")
j = rep(j, "  const p=new THREE.Vector3(x,0,z); collide(p, type===\"across\"?0.4:0.45);\n  const e = new Enemy(type,p.x,p.z,opts);",
           "  const p=new THREE.Vector3(x,0,z); collide(p, type===\"across\"?0.4:0.45);\n  if(PVK[type]){ const e=new Enemy(\"across\",p.x,p.z,Object.assign({},opts,{variant:\"walker\"})); e.pvInit(type); return e; }\n  const e = new Enemy(type,p.x,p.z,opts);")
j = rep(j, "  for(const e of enemies) e.update(dt);", "  for(const e of enemies) e.update(dt); pvFxAll(dt);")
j = rep(j, '  if(e.code==="Digit6") spawn("tactician");\n', '  if(e.code==="Digit6") spawn("tactician");\n  if(e.code==="Digit7") spawn("contortionist");\n  if(e.code==="Digit8") spawn(rng()<0.5?"reacher":"reacher_arm");\n  if(e.code==="Digit9") spawn("splithead");\n  if(e.code==="KeyK") spawn("hob");\n')
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["Contortionist (BCROSS)", "Crawls like a spider, bends over backward and skitters head first, or walks like a man and folds. Grabs her legs and drags her, strikes with an arm bent the wrong way, or turns its head round and runs at her backward to bite.", [
    ["contortionist.hp","Health",1,40,0.5],["contortionist.sight","Sees her within (m)",4,40,1],["contortionist.attackCool","Seconds between attacks",0.5,10,0.25],["contortionist.strikeDamage","Wrong-angle strike damage",0,80,1],
    ["contortionist.wrapDamage","Leg wrap: damage on the grab",0,40,1],["contortionist.wrapChance","Low ones: leg wrap instead of the neck-twist bite (chance)",0,1,0.05],["contortionist.biteDamage","Neck-twist bite damage",0,80,1]]],
  ["Reachers (BCROSS)", "Long necks or long arms: they loom at the edge of their reach and strike from there.", [
    ["reacher.hp","Health",1,40,0.5],["reacher.attackCool","Seconds between attacks",0.5,10,0.25],["reacher.whipDamage","Whip headbutt damage",0,80,1],["reacher.biteDamage","Bite from above damage",0,80,1],["reacher.coilBiteDamage","Neck coil: bite in the face",0,100,1],
    ["reacher.swipeDamage","Long swipe damage",0,80,1],["reacher.snatchBiteDamage","Snatch: bite when reeled in",0,100,1],["reacher.tripDown","Trip: down for (s)",0.5,5,0.1],["reacher.armJointHp","Shots to take an arm off at a joint",1,10,1]]],
  ["Split-head Reacher (unique)", "Its body sits in the next room; a 5 m neck hunts her. The head is quick and takes little damage; a shot inside the open split hurts it; the body dies easily.", [
    ["splithead.hp","Head health",1,100,1],["splithead.bodyHp","Body health",1,30,0.5],["splithead.splitMult","Shot inside the open split ×",0.5,6,0.25],["splithead.headMult","Shot on the closed head ×",0,1,0.05],["splithead.dodgeChance","Head darts out of a shot (chance)",0,1,0.05],
    ["splithead.biteDamage","Split bite damage",0,80,1],["splithead.engulfBiteDamage","Engulf: bite down",0,120,1]]],
  ["The Hob (boss)", "Chapter 2's giant: can't be killed. Crawls after her, screeches, grabs her one-handed, and lunges into the throne grab: two shots to the cross on its right arm or to its eyes to get out.", [
    ["hob.crawl","Crawl (m/s)",0.2,3,0.05],["hob.fast","Fast crawl (m/s)",0.5,5,0.1],["hob.grabDamage","One-hand grab: damage",0,60,1],["hob.throneBiteDamage","Throne grab: bite if she doesn't get out",0,150,1],["hob.stun","Stunned by a shot to the cross (s)",0,8,0.25]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')

# a preview body holds her while it plays its grab clip (its state stays "pv"): only let go when it dies or the clip ends
j = rep(j, 'if(g.by.dead || g.by.state!=="grab"){ player.grabbed=null;', 'if(g.by.dead || (g.by.kind==="pv" ? !(g.by.pv&&g.by.pv.holding()) : g.by.state!=="grab")){ player.grabbed=null;')
