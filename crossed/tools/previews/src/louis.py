# Louis rework and his interactions with the map. Runs inside build.py after fight.py.
j = setvals(j, "brute", {"hp":16})
j = rep(j, "crawlSpeed:0.25},", "crawlSpeed:0.25, doorDamage:1.5, wallHp:4, wallDamage:1, wallSense:9, hearing:1.3, trailSense:10, slamWindup:0.85, slamRadius:2.4, slamDamage:22, slamDown:1.2, slamCool:5, slamRecover:1.4, grabWindup:0.55, grabReach:1.8, grabSteps:3, grabDamage:8, grabCool:7, throwSpeed:8, throwDamage:14, throwWallDamage:14, throwDown:1.3, liftTime:0.9, furnSpeed:9, furnDamage:20, furnCool:7, furnMin:4.5, furnMax:14, furnMaxVol:1.2, fetchRange:6, chargeWindup:0.75, chargeSpeed:6.5, chargeTime:1.8, chargeDamage:30, chargeDown:1.4, chargeStun:2.2, chargeCool:8, chargeMin:3.5, chargeMax:12, chargeMaxVol:2.5},")
j = rep(j, "norah:{hp:100,", "norah:{hp:100, bleedAt:0.6, dripGap:1.1,")
j = rep(j, "world = {floorRects:[],", "world = {trail:[], weakWalls:[], flying:[], floorRects:[],")
# the new brain replaces the old one
a = j.index("  brainBrute(dt, dist, want, toP){"); z = j.index("  // ---------------- stealth: what an ACROSS notices")
j = j[:a] + open(os.path.join(D,"louis.js")).read() + j[z:]
j = rep(j, "const T = (this.kind===\"across\" && !this.sees && this.lostT>1.0 && this.lastKnown) ? this.lastKnown : player.pos;",
        "const T = this.kind===\"brute\" ? this.louisTarget() : (this.kind===\"across\" && !this.sees && this.lostT>1.0 && this.lastKnown) ? this.lastKnown : player.pos;")
j = rep(j, 'inSwing(){ return this.state==="windup"||this.state==="active"; }', 'inSwing(){ return this.state==="windup"||this.state==="active"||this.state==="slamWind"||this.state==="slam"||this.state==="chargeWind"||this.state==="charge"; }')
j = rep(j, "    this.t += dt;\n", "    this.t += dt;\n    if(this.carry && this.state!==\"lift\") this.dropCarry();\n")
j = rep(j, "    this.dead = true; this.deadT = 0;", "    this.dead = true; this.deadT = 0; if(this.carry) this.dropCarry();")
j = rep(j, 'const moving = this.state==="chase" && this.type!=="dummy"', 'const moving = (this.state==="chase"||this.state==="fetch"||this.state==="charge") && this.type!=="dummy"')
j = rep(j, "    else P.torso.rotation.y *= 0.85;\n", """    else P.torso.rotation.y *= 0.85;
    if(k==="brute"){ const S=CFG.brute;
      if(this.state==="chargeWind"){ hipPitch=0.55; neck=-0.6; armLX=armRX=0.5; P.hips.rotation.z=Math.sin(this.t*40)*0.05; }
      else if(this.state==="charge"){ hipPitch=0.75; neck=-0.7; armLX=1.2; armRX=-0.4; legLX=-Math.sin(this.t*18)*0.9; legRX=Math.sin(this.t*18)*0.9; }
      else if(this.state==="slamWind"){ const a=Math.min(1,this.t/S.slamWindup); armLX=armRX=2.9*a; hipPitch=-0.25*a; }
      else if(this.state==="slam"){ const a=Math.min(1,this.t/0.1); armLX=armRX=2.9-2.6*a; hipPitch=0.55*a; hipY=0.95-0.25*a; }
      else if(this.state==="recover" && this.t<0){ armLX=armRX=0.3; hipPitch=0.45; hipY=0.8; }
      else if(this.state==="grabWind"){ const a=Math.min(1,this.t/S.grabWindup); armLX=1.5*a; P.torso.rotation.y=-0.35*a; }
      else if(this.state==="grab"){ armLX=1.5+Math.sin(this.t*20)*0.05; armRX=0.7; }
      else if(this.state==="lift"){ const a=Math.min(1,this.t/S.liftTime); armLX=armRX=2.9*a; hipPitch=-0.1*a; } }
""")
# weak walls: Louis can break them
j = rep(j, "const L=Math.hypot(bx-ax,bz-az); if(L<0.01) return; const base=wo.base||0;",
        "const L=Math.hypot(bx-ax,bz-az); if(L<0.01) return; const base=wo.base||0; const wrec = wo.weak ? {segs:[],meshes:[],hp:CFG.brute.wallHp,broken:false,ax,az,bx,bz} : null; if(wrec) world.weakWalls.push(wrec);")
j = rep(j, "    if(!glass) world.blockers.push(m);", "    if(!glass){ world.blockers.push(m); if(wrec) wrec.meshes.push(m); }")
j = rep(j, "if(win){ sg.win=win; win.segs.push(sg); } world.segs.push(sg); }", "if(win){ sg.win=win; win.segs.push(sg); } else if(wrec){ sg.weak=wrec; wrec.segs.push(sg); } world.segs.push(sg); }")
j = rep(j, "sk.rotation.y=-ang; world.group.add(sk); }", "sk.rotation.y=-ang; world.group.add(sk); if(wrec) wrec.meshes.push(sk); }")
# Norah: lying on the floor after a slam or a throw; Louis's grab
j = rep(j, "  if(player.stumble>0) P.hips.rotation.x=-0.3;", "  if(player.downT>0){ P.hips.position.y=0.22; P.hips.rotation.x=-1.45; P.legL.rotation.x=0.2; P.legR.rotation.x=-0.1; P.kneeL.rotation.x=0.3; P.armL.rotation.set(-0.4,0,-0.8); P.armR.rotation.set(-0.3,0,0.8); }\n  else if(player.stumble>0) P.hips.rotation.x=-0.3;")
j = rep(j, "  itemsTick(dt);\n}", "  itemsTick(dt); louisTick(dt);\n}")
j = rep(j, '${o.how==="bear hug"?"has her in a bear hug":"has her ankle"}', '${o.how==="bear hug"?"has her in a bear hug":o.how==="Louis\'s grip"?"has her by the collar":"has her ankle"}')
j = rep(j, '["brute.dragSpeed","One leg: speed ×",0.1,1,0.05],["brute.crawlSpeed","No legs: speed ×",0.05,1,0.05]]],',
  '''["brute.dragSpeed","One leg: speed ×",0.1,1,0.05],["brute.crawlSpeed","No legs: speed ×",0.05,1,0.05],
    ["brute.hearing","Hunting: hearing ×",0.2,3,0.05],["brute.trailSense","Hunting: follows blood within (m)",0,25,0.5],["brute.doorDamage","Door damage per hit (doors take 3)",0.5,3,0.25],["brute.wallHp","Weak walls: hits to break",1,10,0.5],["brute.wallSense","Goes through weak walls toward her within (m)",0,20,0.5],
    ["brute.chargeWindup","Charge: tell (head down, s)",0.2,2,0.05],["brute.chargeSpeed","Charge: speed (m/s)",2,14,0.25],["brute.chargeTime","Charge: longest run (s)",0.3,4,0.1],["brute.chargeDamage","Charge: damage",0,80,1],["brute.chargeDown","Charge: time on the floor (s)",0,3,0.05],["brute.chargeStun","Charge: stagger after hitting a solid wall (s)",0,5,0.1],["brute.chargeCool","Charge: cooldown (s)",0,30,0.5],["brute.chargeMin","Charge: from at least (m)",1,10,0.25],["brute.chargeMax","Charge: from at most (m)",3,30,0.5],["brute.chargeMaxVol","Charge: furniture he can send flying (m³)",0,6,0.1],["brute.slamWindup","Ground slam: tell (arms up, s)",0.2,2,0.05],["brute.slamRadius","Ground slam: radius (m)",0.5,5,0.1],["brute.slamDamage","Ground slam: damage",0,60,1],["brute.slamDown","Ground slam: time on the floor (s)",0,3,0.05],["brute.slamCool","Ground slam: cooldown (s)",0,20,0.5],["brute.slamRecover","Ground slam: recovery (punish window, s)",0.2,4,0.05],
    ["brute.grabWindup","Grab: tell (s)",0.1,2,0.05],["brute.grabReach","Grab: reach (m)",0.5,3,0.05],["brute.grabSteps","Grab: prompts to break free",1,6,1],["brute.grabDamage","Grab: squeeze damage",0,40,1],["brute.grabCool","Grab: cooldown (s)",0,20,0.5],
    ["brute.throwSpeed","Throw: speed she flies (m/s)",2,16,0.5],["brute.throwDamage","Throw: damage",0,60,1],["brute.throwWallDamage","Throw: extra damage hitting a wall",0,60,1],["brute.throwDown","Throw: time on the floor (s)",0,3,0.05],
    ["brute.liftTime","Furniture: lift time (tell, s)",0.2,3,0.05],["brute.furnSpeed","Furniture: throw speed (m/s)",3,20,0.5],["brute.furnDamage","Furniture: damage",0,60,1],["brute.furnCool","Furniture: cooldown (s)",0,30,0.5],["brute.furnMin","Furniture: only when she's further than (m)",1,10,0.5],["brute.furnMaxVol","Furniture: biggest he lifts (m³)",0.1,3,0.05]]],''')
j = rep(j, '["norah.stumble","Stumble when hit (s)",0,2,0.05],', '["norah.stumble","Stumble when hit (s)",0,2,0.05],["norah.bleedAt","Bleeds a trail below (share of health)",0,1,0.05],["norah.dripGap","Blood drop every (m)",0.3,4,0.1],')
# a smashed window is a way in for anything that hunts her
j = rep(j, "function collide(p, r, skipBox, under){", "function collide(p, r, skipBox, under, climb){")
j = rep(j, "  for(const s of world.segs) hit = pushSeg(p,r,s) || hit;", "  for(const s of world.segs){ if(climb && s.win && s.win.broken) continue; hit = pushSeg(p,r,s) || hit; }")
j = rep(j, "collide(this.pos, this.radius, null, this.canUnder());", "collide(this.pos, this.climbT>0?0.28:this.radius, null, this.canUnder()||this.climbT>0, true);")
j = rep(j, "collide(p,this.radius,null,this.canUnder&&this.canUnder());", "collide(p,this.climbT>0?0.28:this.radius,null,(this.canUnder&&this.canUnder())||this.climbT>0,true);")

j = rep(j, "const win={broken:false, segs:[], meshes:[]};", "const win={broken:false, segs:[], meshes:[], gap:{ax:ax+ux*s0,az:az+uz*s0,bx:ax+ux*s1,bz:az+uz*s1}};")
