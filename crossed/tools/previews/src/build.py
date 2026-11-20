import re, sys, os
D = os.path.dirname(os.path.abspath(__file__))
TR = os.path.dirname(os.path.abspath(__file__)) + "/"
PG = open(TR + "base_engine.html").read()
MD = open(TR + "base_builder.html").read()
rd = lambda n: open(os.path.join(D, n)).read()

def between(s, a, b, start=0):
    i = s.index(a, start) + len(a); j = s.index(b, i); return s[i:j]

eng_style = between(PG, "<style>", "</style>")
eng_body = between(PG, "<body>\n", '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
eng_js = between(PG, '<script>\n"use strict";\n', "</script>\n</body>")

def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        sys.exit(f"patch failed ({n} matches, want {count}):\n{old[:160]}")
    return s.replace(old, new)

# ---------------- engine DOM
b = eng_body
b = rep(b, '<div id="vaultline" style="font-size:12px;color:#e8c77a"></div>', '<div id="vaultline" style="font-size:12px;color:#e8c77a"></div>\n  <div id="flashline"></div>\n  <div id="bagline"></div>')
b = rep(b, '<div class="tb" data-t="vault" style="right:176px;bottom:222px">VAULT</div>', '<div class="tb" data-t="vault" style="right:176px;bottom:222px">VAULT</div>\n  <div class="tb" data-t="bag" style="right:24px;bottom:310px">BAG</div>\n  <div class="tb" data-t="light" style="right:100px;bottom:270px">LIGHT</div>')
b = rep(b, '<div id="dead">YOU DIED<small>Enter to get up · N to rerun the scenario</small></div>', '<div id="dead">YOU DIED<small>Enter to get up · N to restart the map · B back to the builder</small></div>')
help_start = b.index('<div id="help">'); help_end = b.index('</div>\n</div>', help_start) + len('</div>\n</div>')
b = b[:help_start] + '''<div id="help">
  <b>CROSSED — PLAYING YOUR MAP</b><br>
  Click the view to take the mouse. <b>Esc</b> gives it back for the panel. <b>B</b> returns to the builder.<br><br>
  <b>Move</b> WASD · <b>Run</b> Shift · <b>Turn</b> arrows or mouse<br>
  <b>Aim</b> right mouse / C · <b>Fire</b> left mouse / F · <b>Reload</b> R · <b>Shove</b> V / middle mouse<br>
  <b>Dodge</b> while aiming: Shift + direction · <b>Crouch</b> Q, or X (quiet, harder to see)<br>
  <b>Use</b> E: search furniture that glints, pick things up, open doors, push furniture<br>
  <b>Bag</b> I or Tab: use pills and batteries, read notes · <b>Flashlight</b> L (its light makes Norah easier to see)<br>
  <b>Vault</b> Space next to a low surface (slow, quiet) · Shift + Space (fast, loud)<br><br>
  <b>N</b> restart the map · <b>1</b> random ACROSS · <b>4</b> upright · <b>5</b> Crawler · <b>2</b> Louis · <b>3</b> dummy · <b>6</b> Tactician · <b>7</b> Contortionist · <b>8</b> Reacher · <b>9</b> split-head Reacher · <b>K</b> the Hob · <b>0</b> clear<br>
  <b>P</b> pause · <b>.</b> one frame · <b>Y</b> replay the last 10 s · <b>H</b> hit zones · <b>T</b> weapon wheel · <b>G</b> overlays · <b>`</b> tuning panel<br><br>
  <b>Pad:</b> sticks move/look · LT aim · RT fire · X reload · Y shove · B run/dodge · A use · Start pause · Back replay · D-pad ↑ restart<br>
  <div class="btns" style="margin-top:8px"><button id="helpok">Start</button></div>
</div>''' + b[help_end:]

# ---------------- engine JS
j = eng_js
j = rep(j, 'debug:{rings:false, cone:false, dodgeBar:true, attackLog:false}\n};', 'debug:{rings:false, cone:false, dodgeBar:true, attackLog:false},\n  items:{searchTime:1.4, searchNoise:2.0, pickupRange:1.3, pillHeal:25, bandageHeal:12, kitHeal:60, flashDrain:0.006, flashRange:13, flashAngle:28, flashVis:0.4, glints:true}\n};')
j = rep(j, 'scene.add(new THREE.HemisphereLight(0x5a6070, 0x1a140e, 0.55));', 'const hemi=new THREE.HemisphereLight(0x5a6070, 0x1a140e, 0.55); scene.add(hemi);')
j = rep(j, 'const w = CFG.world.res, h = Math.round(w * innerHeight / innerWidth);', 'const cw=canvas.clientWidth||innerWidth, ch=canvas.clientHeight||innerHeight; const w = MODE==="build" ? Math.round(Math.min(cw*Math.min(2,devicePixelRatio||1), ED_RES())) : CFG.world.res, h = Math.max(1,Math.round(w * ch / cw));')
j = rep(j, 'world = {group:new THREE.Group(), segs:[],', 'world = {floorRects:[], containers:[], pickups:[], exits:[], ambient:null, terrain:null, lightCapped:false, group:new THREE.Group(), segs:[],')
# floors
j = rep(j, '''function addFloor(x0,z0,x1,z1,a="#2c2925",b="#36322c"){
  const w=x1-x0,d=z1-z0; const t=noiseTex(a,b,4,1); t.repeat.set(w/2,d/2);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshLambertMaterial({map:t}));
  m.rotation.x=-Math.PI/2; m.position.set((x0+x1)/2,0,(z0+z1)/2); world.group.add(m);
}''', '''function addFloor(x0,z0,x1,z1,a="#2c2925",b="#36322c",o={}){
  if(REC){ REC.push({type:"floor",x:x0,z:z0,w:x1-x0,d:z1-z0,colA:a,colB:b,tex:"",y:0}); return; }
  const w=x1-x0,d=z1-z0, y=o.y||0; let mat;
  if(o.tex && SBTEX[o.tex] && SBTEX[o.tex].ready) mat=texMat(o.tex,w/(o.scale||1),d/(o.scale||1),a);
  else { const t=noiseTex(a,b,4,1); t.repeat.set(w/2,d/2); mat=new THREE.MeshLambertMaterial({map:t}); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d), mat);
  m.rotation.x=-Math.PI/2; m.position.set((x0+x1)/2,y,(z0+z1)/2); world.group.add(m); world.floorRects.push({x0,z0,x1,z1,y});
  if(y>0.05){ const sk=new THREE.Mesh(new THREE.BoxGeometry(w,y+2,d),M(0x2a2420)); sk.position.set((x0+x1)/2,y/2-1-0.01,(z0+z1)/2); world.group.add(sk); }
}''')
# walls
j = rep(j, 'function addWall(ax,az,bx,bz,h=3,t=0.2,col=0x4a443b,openings=[]){\n  const L=Math.hypot(bx-ax,bz-az); if(L<0.01) return;',
        'function addWall(ax,az,bx,bz,h=3,t=0.2,col=0x4a443b,openings=[],wo={}){\n  if(REC){ REC.push({type:"wall",a:[ax,az],b:[bx,bz],height:h,thick:t,color:hexStr(col),tex:"",openings:openings.map(x=>Object.assign({},x))}); return; }\n  const L=Math.hypot(bx-ax,bz-az); if(L<0.01) return; const base=wo.base||0;')
j = rep(j, 'if(op.kind==="door") addDoor(ax+ux*(op.hinge==="end"?s1:s0), az+uz*(op.hinge==="end"?s1:s0), op.hinge==="end"?-ux:ux, op.hinge==="end"?-uz:uz, s1-s0, Math.min(top,h), op.side||1, !!op.closed);',
        'if(op.kind==="door") addDoor(ax+ux*(op.hinge==="end"?s1:s0), az+uz*(op.hinge==="end"?s1:s0), op.hinge==="end"?-ux:ux, op.hinge==="end"?-uz:uz, s1-s0, Math.min(top,h), op.side||1, !!op.closed, op, base);')
j = rep(j, "const m=new THREE.Mesh(new THREE.BoxGeometry(len,hh,glass?0.03:t), glass?new THREE.MeshLambertMaterial({color:0x1a2230,transparent:true,opacity:0.5}):M(col));\n    const mid=(p0+p1)/2; m.position.set(ax+ux*mid,(h0+h1)/2,az+uz*mid);",
        "const wm = wo.tex&&SBTEX[wo.tex]&&SBTEX[wo.tex].ready ? (()=>{ const s=wo.scale||1, A=texMat(wo.tex,len/s,hh/s,hexStr(col)), Bm=wo.texB&&SBTEX[wo.texB]&&SBTEX[wo.texB].ready?texMat(wo.texB,len/s,hh/s,hexStr(col)):A, E=texMat(wo.tex,t/s,hh/s,hexStr(col)); return [E,E,E,E,A,Bm]; })() : M(col);\n    const m=new THREE.Mesh(new THREE.BoxGeometry(len,hh,glass?0.03:t), glass?new THREE.MeshLambertMaterial({color:0x1a2230,transparent:true,opacity:0.5}):wm);\n    const mid=(p0+p1)/2; m.position.set(ax+ux*mid,(h0+h1)/2+base,az+uz*mid);")
j = rep(j, "    if(glass){ const sg={ax:ax+ux*p0,az:az+uz*p0,bx:ax+ux*p1,bz:az+uz*p1,t:0.05,glass:true,win}; win.segs.push(sg); world.segs.push(sg); }\n  }\n}",
        "    if(glass){ const sg={ax:ax+ux*p0,az:az+uz*p0,bx:ax+ux*p1,bz:az+uz*p1,t:0.05,glass:true,win}; win.segs.push(sg); world.segs.push(sg); }\n  }\n  if(wo.skirt){ const sk=new THREE.Mesh(new THREE.BoxGeometry(L,3,t*0.98),M(col)); sk.position.set((ax+bx)/2,base-1.5+0.001,(az+bz)/2); sk.rotation.y=-ang; world.group.add(sk); }\n}")
j = rep(j, 'function addDoor(hx,hz,ux,uz,width,h,side,closed){\n  const pivot=new THREE.Object3D(); pivot.position.set(hx,0,hz); world.group.add(pivot);',
        'function addDoor(hx,hz,ux,uz,width,h,side,closed,op={},baseY=0){\n  const pivot=new THREE.Object3D(); pivot.position.set(hx,baseY,hz); world.group.add(pivot);')
j = rep(j, 'const d={pivot,leaf,hx,hz,base,width,side,ang:closed?0:1.45,target:closed?0:1.45,hp:CFG.world.doorHp,broken:false,speed:2.5,shake:0};',
        'const d={pivot,leaf,hx,hz,base,width,side,ang:closed?0:1.45,target:closed?0:1.45,hp:CFG.world.doorHp,broken:false,speed:2.5,shake:0,locked:!!op.locked,key:op.key||""};')
# pillars, boxes, corpses, lights, cameras
j = rep(j, 'function addPillar(x,z,r=0.45,h=3,col=0x5a5246){ const m=', 'function addPillar(x,z,r=0.45,h=3,col=0x5a5246){ if(REC){ REC.push({type:"pillar",x,z,r,h,color:hexStr(col)}); return; } const m=')
j = rep(j, 'm.position.set(x,h/2,z); world.group.add(m); world.blockers.push(m); world.circles.push', 'm.position.set(x,h/2+groundY(x,z),z); world.group.add(m); world.blockers.push(m); world.circles.push')
j = rep(j, '''function addBox(x,z,w,d,h,col=0x5b4128,push=false,name=""){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), M(col)); m.position.set(x,h/2,z); world.group.add(m); world.blockers.push(m);
  const b={x,z,w,d,h,mesh:m,push,name,''', '''function addBox(x,z,w,d,h,col=0x5b4128,push=false,name="",bo={}){
  if(REC){ REC.push({type:"block",x,z,w,d,h,color:hexStr(col),push,name,tex:""}); return; }
  const y0=groundY(x,z); const bm = bo.tex&&SBTEX[bo.tex]&&SBTEX[bo.tex].ready ? (()=>{ const A=texMat(bo.tex,w,h,hexStr(col)), B=texMat(bo.tex,d,h,hexStr(col)), T=texMat(bo.tex,w,d,hexStr(col)); return [B,B,T,T,A,A]; })() : M(col);
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), bm); m.position.set(x,y0+h/2,z); world.group.add(m); world.blockers.push(m);
  const b={x,z,w,d,h,y0,mesh:m,push,name,''')
j = rep(j, 'function addCorpse(x,z,yaw){ const g=new THREE.Group(); g.position.set(x,0,z);', 'function addCorpse(x,z,yaw){ if(REC){ REC.push({type:"corpse",x,z,yaw:Math.round(yaw*180/Math.PI)}); return; } const g=new THREE.Group(); g.position.set(x,groundY(x,z),z);')
j = rep(j, 'function addLight(x,y,z,col=0xffb060,i=1.1,r=12){ const l=', 'function addLight(x,y,z,col=0xffb060,i=1.1,r=12){ if(REC){ REC.push({type:"light",x,y,z,color:hexStr(col),intensity:i,dist:r}); return; } const l=')
j = rep(j, 'function addCam(x,y,z,lx,ly,lz,track=true,fov=60){ world.cams.push', 'function addCam(x,y,z,lx,ly,lz,track=true,fov=60){ if(REC){ REC.push({type:"camera",x,y,z,look:[lx,ly,lz],track,fov}); return; } world.cams.push')
# furniture moves with its model
j = rep(j, 'else { b.mesh.position.set(b.x,b.h/2,b.z); if(Math.random()<dt*4) SFX.drag(); }', 'else { placeBoxMesh(b); if(Math.random()<dt*4) SFX.drag(); }')
j = rep(j, 'else { best.mesh.position.set(best.x,best.h/2,best.z); player.pos.addScaledVector', 'else { placeBoxMesh(best); player.pos.addScaledVector')
# everything that stood at y=0 now stands on the ground
j = rep(j, 'm.rotation.x=-Math.PI/2; m.position.set(x,0.012+(pools.length%20)*0.0005,z);', 'm.rotation.x=-Math.PI/2; m.position.set(x,groundY(x,z)+0.012+(pools.length%20)*0.0005,z);')
j = rep(j, 'if(s.t<=0||s.m.position.y<0){', 'if(s.t<=0||s.m.position.y<groundY(s.m.position.x,s.m.position.z)){')
j = rep(j, 'if(wp.y<0.12 && d.v.y<0){', 'if(wp.y<groundY(wp.x,wp.z)+0.12 && d.v.y<0){')
j = rep(j, 'syncRoot(){ this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; }', 'syncRoot(){ this.root.position.copy(this.pos); this.root.position.y=groundY(this.pos.x,this.pos.z); this.root.rotation.y = this.yaw; }')
j = rep(j, 'this.root.position.set(this.pos.x, 0.11*Math.sin(R.th), this.pos.z);', 'this.root.position.set(this.pos.x, 0.11*Math.sin(R.th)+groundY(this.pos.x,this.pos.z), this.pos.z);')
j = rep(j, 'player.root.position.copy(player.pos); player.root.position.y=player.posY||0; player.root.rotation.y = player.yaw;\n}',
        'player.root.position.copy(player.pos); player.root.position.y=(player.posY||0)+groundY(player.pos.x,player.pos.z); player.root.rotation.y = player.yaw;\n  itemsTick(dt);\n}')
j = rep(j, 'const pivot = new THREE.Vector3(player.pos.x, h+(player.posY||0)*0.8, player.pos.z)', 'const pivot = new THREE.Vector3(player.pos.x, h+(player.posY||0)*0.8+groundY(player.pos.x,player.pos.z), player.pos.z)')
j = rep(j, 'const target = pivot.clone().addScaledVector(look, -want);', 'const target = pivot.clone().addScaledVector(look, -want); target.y=Math.max(target.y, groundY(target.x,target.z)+0.25);')
j = rep(j, 'const pv=new THREE.Vector3(player.pos.x,CFG.ctrl.aimHeight,player.pos.z)', 'const pv=new THREE.Vector3(player.pos.x,CFG.ctrl.aimHeight+groundY(player.pos.x,player.pos.z),player.pos.z)')
j = rep(j, 'c.look.clone().lerp(new THREE.Vector3(player.pos.x,1.1,player.pos.z),0.65)', 'c.look.clone().lerp(new THREE.Vector3(player.pos.x,1.1+groundY(player.pos.x,player.pos.z),player.pos.z),0.65)')
j = rep(j, 'const origin = new THREE.Vector3(player.pos.x,1.4,player.pos.z);', 'const origin = new THREE.Vector3(player.pos.x,1.4+groundY(player.pos.x,player.pos.z),player.pos.z);')
j = rep(j, 'const v=new THREE.Vector3(e.pos.x,(e.height||1.8)*(e.stance==="crawling"?0.55:1)+0.15,e.pos.z).project(camera);', 'const v=new THREE.Vector3(e.pos.x,(e.height||1.8)*(e.stance==="crawling"?0.55:1)+0.15+groundY(e.pos.x,e.pos.z),e.pos.z).project(camera);')
j = rep(j, 'this.ring.visible=true; this.ring.position.set(this.pos.x,0.03,this.pos.z);', 'this.ring.visible=true; this.ring.position.set(this.pos.x,groundY(this.pos.x,this.pos.z)+0.03,this.pos.z);')
j = rep(j, 'this.ring2.visible=true; this.ring2.position.set(this.pos.x,0.035,this.pos.z);', 'this.ring2.visible=true; this.ring2.position.set(this.pos.x,groundY(this.pos.x,this.pos.z)+0.035,this.pos.z);')
j = rep(j, 'cone.position.set(player.pos.x,0.04,player.pos.z);', 'cone.position.set(player.pos.x,groundY(player.pos.x,player.pos.z)+0.04,player.pos.z);')
j = rep(j, 'const m=ringMesh(); m.position.set(x,0.04,z); m.material.color', 'const m=ringMesh(); m.position.set(x,groundY(x,z)+0.04,z); m.material.color')
# stealth: per-map darkness, the flashlight shows Norah up
j = rep(j, 'function lightAt(x,z){ let v=CFG.stealth.ambient;', 'function lightAt(x,z){ let v=(world.ambient??CFG.stealth.ambient);')
j = rep(j, 'function playerVis(){ return clamp(lightAt(player.pos.x,player.pos.z)*(player.crouch?CFG.stealth.crouchVis:1)*(player.vel.length()>2.6?1.2:1),0,1); }',
        'function playerVis(){ return clamp(lightAt(player.pos.x,player.pos.z)*(player.crouch?CFG.stealth.crouchVis:1)*(player.vel.length()>2.6?1.2:1)+flashVis(),0,1); }')
# input only in play; new keys
j = rep(j, 'function onKey(e){\n  if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA") return;',
        'function onKey(e){\n  if(MODE!=="play") return;\n  if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA") return;\n  if(invOpen()){ if(["KeyI","Tab","Escape"].includes(e.code)&&!e.repeat){ closeInv(); } e.preventDefault(); return; }')
j = rep(j, '  if(replay.on){ if(e.code==="KeyY") exitReplay(); if(e.code==="Space"){ replay.playing=!replay.playing; e.preventDefault(); } return; }',
        '  if(replay.on){ if(e.code==="KeyY") exitReplay(); if(e.code==="Space"){ replay.playing=!replay.playing; e.preventDefault(); } return; }\n  if((e.code==="KeyI"||e.code==="Tab") && !rep && !player.grabbed){ e.preventDefault(); openInv(); return; }\n  if(e.code==="KeyB" && !rep && !player.grabbed){ toBuild(); e.stopImmediatePropagation(); return; }\n  if(e.code==="KeyL" && !rep && !player.grabbed){ toggleFlash(); }')
j = rep(j, 'canvas.addEventListener("mousedown", e=>{\n  audio();', 'canvas.addEventListener("mousedown", e=>{\n  if(MODE!=="play"||invOpen()) return;\n  audio();')
j = rep(j, 'canvas.addEventListener("touchstart", e=>{ audio(); e.preventDefault();', 'canvas.addEventListener("touchstart", e=>{ if(MODE!=="play") return; audio(); e.preventDefault();')
j = rep(j, 'canvas.addEventListener("touchmove", e=>{ e.preventDefault();', 'canvas.addEventListener("touchmove", e=>{ if(MODE!=="play") return; e.preventDefault();')
j = rep(j, 'function showTouch(on){ touchEl.style.display=on?"block":"none"; }', 'function showTouch(on){ touchEl.style.display=on&&MODE==="play"?"block":"none"; }')
j = rep(j, '    else if(t==="fire") fire();', '    else if(t==="bag") openInv(); else if(t==="light") toggleFlash();\n    else if(t==="fire") fire();')
j = rep(j, '  pollPad();\n  const pi=$("padinfo");', '  if(MODE==="play") pollPad();\n  const pi=$("padinfo");')
# use: pick up, search, locked doors
j = rep(j, 'function use(){\n  if(mash()) return;\n  if(player.dead||player.dodge>0||player.stumble>0||player.aiming||paused) return;',
        'function use(){\n  if(mash()) return;\n  if(player.dead||player.dodge>0||player.stumble>0||player.aiming||paused) return;\n  if(player.search) return;\n  if(interactFirst()) return;')
j = rep(j, '  if(door){\n    if(door.target>0.01){', '  if(door){\n    if(door.locked && !tryUnlock(door)) return;\n    if(door.target>0.01){')
j = rep(j, 'this.stumble = N.stumble; this.aiming=false;', 'this.stumble = N.stumble; this.search=null; this.aiming=false;')
j = rep(j, 'this.grabbed={by, dmg:o.dmg||S.grabDamage', 'this.search=null; this.grabbed={by, dmg:o.dmg||S.grabDamage')
j = rep(j, '  else if(player.stumble>0){ player.stumble-=dt; pMode="skid"; }', '  else if(player.search){ updateSearch(dt); pMode="pin"; player.aiming=false; }\n  else if(player.stumble>0){ player.stumble-=dt; pMode="skid"; }')
j = rep(j, '  if(player.dead){ P.hips.position.y=0.15; P.hips.rotation.x=-Math.PI/2; }', '  if(player.search){ const k=performance.now()/1000; P.hips.position.y=0.8; P.hips.rotation.x=0.4; P.armL.rotation.set(-1.2+Math.sin(k*9)*0.25,0,-0.2); P.armR.rotation.set(-1.1+Math.cos(k*11)*0.25,0,0.2); }\n  if(player.dead){ P.hips.position.y=0.15; P.hips.rotation.x=-Math.PI/2; }')
# per-enemy health and speed from the map
j = rep(j, 'o.hp=B.hp*(m.hp||1);', 'o.hp=B.hp*(m.hp||1)*(this.hpMul||1);')
j = rep(j, 'return l===0?base : l===1? base*S.dragSpeed : base*S.crawlSpeed; }', 'const b2=base*(this.speedMul||1); return l===0?b2 : l===1? b2*S.dragSpeed : b2*S.crawlSpeed; }')
j = rep(j, 'log(`Spawned ${e.name}`,"#9a9283"); return e;', 'if(!QUIET_SPAWN) log(`Spawned ${e.name}`,"#9a9283"); return e;')
# scenarios become maps
s0 = j.index('// ================================================================ scenarios'); s1 = j.index('// ================================================================ feedback')
j = j[:s0] + j[s1:]
j = rep(j, 'if(!run.over && enemies.every(e=>e.dead||e.type==="dummy")', 'if(!run.over && clearWins() && enemies.every(e=>e.dead||e.type==="dummy")')
j = rep(j, '  if(world.goal && run && !run.over && !player.dead && Math.hypot(player.pos.x-world.goal.x,player.pos.z-world.goal.z)<world.goal.r) endRun("ESCAPED");', '  checkExits();')
j = rep(j, 'Ammo left ${row.ammoLeft}<br><br><span style="color:#9a9283">N reruns it · results are in the panel</span>`;', 'Ammo left ${row.ammoLeft}<br><br><span style="color:#9a9283">N restarts the map · B goes back to the builder · results are in the panel</span>`;')
j = rep(j, '["Run", "Scenarios start the same way every time (seeded randomness), so you can compare settings.", [["scenario"],', '["Run", "A map starts the same way every time (seeded randomness), so you can compare settings.", [["scenario"],')
j = rep(j, '["Arena", null, [["arena"],["import"],["btns"],', '["Spawn & world", "Quick spawns use the map\'s enemy markers in turn, or appear in front of Norah if it has none.", [["btns"],')
j = rep(j, '  ["Saved settings",', '''  ["Items & searching", "Containers you fill in the builder glint until searched. Searching pins Norah in place and makes noise.", [
    ["items.searchTime","Search time (s)",0.2,6,0.1],["items.searchNoise","Noise while searching (m)",0,10,0.25],["items.pickupRange","Pick-up reach (m)",0.5,3,0.05],
    ["items.pillHeal","Pills heal",0,100,1],["items.bandageHeal","Bandage heals",0,100,1],["items.kitHeal","First aid kit heals",0,100,1],
    ["items.flashDrain","Flashlight drain (charge/s)",0,0.05,0.001],["items.flashRange","Flashlight reach (m)",3,30,0.5],["items.flashAngle","Flashlight beam (°)",8,60,1],["items.flashVis","Flashlight: how visible it makes her",0,1,0.05],["chk","items.glints","Unsearched containers glint"]]],
  ["Saved settings",''')
j = rep(j, '''        box.appendChild(selectRow("Scenario", Object.entries(SCENARIOS).map(([k,s])=>[k,s.name]), scenarioKey, v=>loadScenario(v)));
        box.lastChild.querySelector("select").id="scenSel";
        box.appendChild(el("div",{class:"btns"},[button("Start / rerun (N)",()=>loadScenario(scenarioKey)),''', '''        box.appendChild(el("div",{class:"sub",id:"mapnameline",text:"Map: "+(ED.doc?ED.doc.name:"")}));
        box.appendChild(el("div",{class:"btns"},[button("Restart map (N)",()=>loadScenario(scenarioKey)), button("Back to builder (B)",toBuild),''')
j = rep(j, '''CFG.world.arena = CFG.world.arena || "open";
if(CFG.world.arena==="imported" && !importedMap) CFG.world.arena="open";
buildPanel(); scene.fog.density = CFG.world.fog; showTouch(CFG.ctrl.touch);
loadScenario("louisOpen");''', '')
j = rep(j, 'function frame(now){\n  frameNo++;\n  const rdt = Math.min(0.05,(now-last)/1000); last=now;', 'function frame(now){\n  frameNo++;\n  const rdt = Math.min(0.05,(now-last)/1000); last=now;\n  if(MODE!=="play"){ edFrame(rdt); requestAnimationFrame(frame); return; }')
j = rep(j, '    if(paused){ dt = stepFrames>0 ? (stepFrames--, CFG.world.timeScale/60) : 0; }', '    if(paused){ dt = stepFrames>0 ? (stepFrames--, CFG.world.timeScale/60) : 0; }\n    else if(invOpen()){ dt=0; }')
j = rep(j, '  updateTags();\n  { const v = !player.vault', '  updateTags(); sbHud();\n  { const v = !player.vault')

exec(open(os.path.join(D,'fight.py')).read())
exec(open(os.path.join(D,'louis.py')).read())
exec(open(os.path.join(D,'menu.py')).read())
exec(open(os.path.join(D,'walker.py')).read())
exec(open(os.path.join(D,'crawler.py')).read())
exec(open(os.path.join(D,'matron.py')).read())
exec(open(os.path.join(D,'mourner.py')).read())
exec(open(os.path.join(D,'cut.py')).read())
exec(open(os.path.join(D,'models.py')).read())
exec(open(os.path.join(D,'anim.py')).read())
exec(open(os.path.join(D,'norah.py')).read())
exec(open(os.path.join(D,'move.py')).read())
exec(open(os.path.join(D,'runner.py')).read())
exec(open(os.path.join(D,'tactician.py')).read())
exec(open(os.path.join(D,'tactician2.py')).read())
exec(open(os.path.join(D,'pv.py')).read())
exec(open(os.path.join(D,'nw.py')).read())
import importlib.util as _ilu
_sp=_ilu.spec_from_file_location('catalog',os.path.join(D,'catalog.py')); _cm=_ilu.module_from_spec(_sp); _sp.loader.exec_module(_cm)
MODEL_LIB=_cm.catalog(os.environ.get('LOWPOLY') or (os.path.join(D,'models') if os.path.isdir(os.path.join(D,'models')) else os.path.join(D,'..','..','..','assets','characters','lowpoly')), os.environ.get('WEBM') or (os.path.join(D,'m') if os.path.isdir(os.path.join(D,'m')) else os.path.join(D,'..','m')))

# ---------------- the Map Designer's library: models and textures, and its generated textures
lines = MD.split("\n")
lib_assets = next(l for l in lines if l.startswith("const LIB_ASSETS = "))
lib_tex = next(l for l in lines if l.startswith("const LIB_TEXTURES = "))
g0 = MD.index("function makeTex("); g1 = MD.index("\n", MD.index("for (const k of Object.keys(GEN)) BUILTIN_TEX"))
gen = MD[g0:g1]

out = []
out.append(rd("shell_head.html"))
out.append("<style>" + eng_style + "</style>\n")
out.append('<script>document.body.classList.add("build")</script>\n')
out.append(b)
out.append(rd("shell_body.html"))
out.append('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js"></script>\n<script>\n"use strict";\n')
import json as _json, math as _math
def _rot(r):
    ax,ay,az=[_math.radians(v or 0) for v in (r+[0,0,0])[:3]]
    cx,sx,cy,sy,cz,sz=_math.cos(ax),_math.sin(ax),_math.cos(ay),_math.sin(ay),_math.cos(az),_math.sin(az)
    Rx=[[1,0,0],[0,cx,-sx],[0,sx,cx]]; Ry=[[cy,0,sy],[0,1,0],[-sy,0,cy]]; Rz=[[cz,-sz,0],[sz,cz,0],[0,0,1]]
    mm=lambda A,B:[[sum(A[i][k]*B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    return mm(mm(Rx,Ry),Rz)
_A=_json.loads(lib_assets[len("const LIB_ASSETS = "):].rstrip().rstrip(";")); _G={}
for _k,_a in _A.items():
    mn=[1e9]*3; mx=[-1e9]*3; best=0; shade=0.55
    for _p in _a["parts"]:
        R=_rot(_p.get("r",[0,0,0])); h=[v/2 for v in _p["d"]]
        for sx in (-1,1):
            for sy in (-1,1):
                for sz in (-1,1):
                    v=[sx*h[0],sy*h[1],sz*h[2]]; w=[sum(R[i][j]*v[j] for j in range(3))+_p["p"][i] for i in range(3)]
                    for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
        vol=_p["d"][0]*_p["d"][1]*_p["d"][2]
        if vol>best:
            best=vol; c=_p.get("c","#888888").lstrip("#"); c=c if len(c)==6 else "888888"
            r_,g_,b_=int(c[0:2],16),int(c[2:4],16),int(c[4:6],16); shade=(0.299*r_+0.587*g_+0.114*b_)/255
    g=round(0.32+shade*0.4,3)
    e={"name":_a["name"],"cat":_a.get("cat","other"),"bb":[round(v,3) for v in (mn[0],mx[0],max(0,mn[1]),mx[1],mn[2],mx[2])],"g":g}
    if _a.get("search"): e["search"]=True
    if _a.get("solid") is False: e["solid"]=False
    if _a.get("light"): e["light"]=_a["light"]
    _G[_k]=e
out.append("const LIB_ASSETS = "+_json.dumps(_G,separators=(",",":"))+";\nconst LIB_TEXTURES = {};\nfunction SB_GEN_TEXTURES(){ return {}; }\n")
out.append("const MODEL_LIB = "+_json.dumps(MODEL_LIB,separators=(",",":"))+";\n")
out.append(rd("pre.js"))
out.append(j)
out.append(rd("runtime.js"))
out.append(rd("louis_rt.js"))
out.append(rd("across_rt.js"))
out.append(rd("models_rt.js"))
out.append(rd("anim_rt.js"))
out.append(rd("norah_rt.js"))
out.append(rd("move_rt.js"))
out.append(rd("runner_rt.js"))
out.append(rd("tac_bulbs.js"))
out.append(rd("tactician_rt.js"))
for _pv in ["mesh_fix.js","pv_cn.js","pv_rc.js","pv_sh.js","pv_hob.js","pv_nw.js","pv_host.js","cn_ai.js","rc_ai.js","sh_ai.js","hob_ai.js","nw_host.js","wpn_rt.js","ed_models.js","nav_rt.js"]:
    if os.path.exists(os.path.join(D,_pv)): out.append(rd(_pv))
out.append(rd("presets.js"))
out.append(rd("editor.js"))
out.append(rd("menu.js"))
out.append(rd("models_ui.js"))
out.append("buildPanel(); scene.fog.density = CFG.world.fog;\nsbBoot();\n</script>\n")
html = "".join(out)
dst = os.path.join(D, "crossed-sandbox.html")
open(dst, "w").write(html)
print("wrote", dst, len(html)//1024, "KB")
