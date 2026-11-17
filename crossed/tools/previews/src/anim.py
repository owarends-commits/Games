# ACROSS animation pass 1: model clips under the procedural puppet, per-zone flinches, zone-based deaths
j = rep(j, "mournerStagger3:0.35,", "mournerStagger3:0.35, animClip:1, animWalkRef:1.2, animRunRef:3.0, animSnap:1, animFlinch:1, animFlinchTime:0.4,")
# remember where it was hit; start a flinch
j = rep(j, "    const dmg = CFG.rev.damage*mult; this.hp -= dmg;\n", "    this.lastZone=z; this.lastLimb=mesh.userData.limb||null; if(this.kind===\"across\") this.hfx={z, limb:this.lastLimb, t:0};\n    const dmg = CFG.rev.damage*mult; this.hp -= dmg;\n")
# the layer runs just before the pose goes onto the rig
j = rep(j, "    P.hips.position.y=v.hy; P.hips.rotation.x=v.hp-this.flinch*0.4;", "    this.animLayer(v,dt,mv);\n    P.hips.position.y=v.hy; P.hips.rotation.x=v.hp-this.flinch*0.4;")
j = rep(j, "    P.ankleR.rotation.x=this.V.stance===\"drag\"?-0.9:0;\n", "    P.ankleR.rotation.x=this.V.stance===\"drag\"?-0.9:0;\n    P.chest.rotation.y=this.twist||0;\n")
# deaths by zone
j = rep(j, "    this.rag={dir:c, th:low?Math.PI/2:0.08, om:low?0:1.0+Math.min(2,v.length()*0.4), L:L*this.scale, limit:Math.PI/2, low, lean:null};",
           "    const hz=this.lastZone, hl=this.lastLimb; this.deathSpin=0;\n    if(!low && hz===\"leg\" && hl){ const sx=hl===\"legL\"?1:-1; c.addScaledVector(new THREE.Vector3(Math.cos(this.yaw)*sx,0,-Math.sin(this.yaw)*sx),0.9).normalize(); }\n    if(!low && hz===\"arm\" && hl) this.deathSpin=(hl===\"armL\"?-1:1)*2.2;\n    this.rag={dir:c, th:low?Math.PI/2:0.08, om:low?0:hz===\"head\"?0.1:hz===\"torso\"?1.5+Math.min(2,v.length()*0.4):1.0+Math.min(2,v.length()*0.4), L:L*this.scale, limit:Math.PI/2, low, lean:null, kind:hz, crumple:(!low&&hz===\"head\")?0.32:0};")
j = rep(j, "    const R=this.rag; this.ragSlide(dt);\n", "    const R=this.rag; this.ragSlide(dt); if(R.crumple && this.deadT<R.crumple){ R.om=0.05; R.th=0.08; } if(this.deathSpin){ this.yaw+=this.deathSpin*dt*Math.exp(-this.deadT*4); }\n")
j = rep(j, "    P.hips.position.y+=(this.hipY-P.hips.position.y)*k; P.hips.rotation.x*=1-k;", "    P.hips.position.y+=(this.hipY*(R.kind===\"head\"?0.55:1)-P.hips.position.y)*k; P.hips.rotation.x*=1-k;")
j = rep(j, "P.kneeL.rotation.x+=(0.15+Math.abs(this.jn(\"dkl\"", "P.kneeL.rotation.x+=((R.kind===\"head\"?1.4:0.15)+Math.abs(this.jn(\"dkl\"")
j = rep(j, "P.kneeR.rotation.x+=(0.3+Math.abs(this.jn(\"dkr\"", "P.kneeR.rotation.x+=((R.kind===\"head\"?1.5:0.3)+Math.abs(this.jn(\"dkr\"")
j = rep(j, "    if(!this.jawLost) P.jaw.rotation.x+=(0.35-P.jaw.rotation.x)*k;\n  }\n  // ---------------- wounds",
           "    if(!this.jawLost) P.jaw.rotation.x+=(0.35-P.jaw.rotation.x)*k;\n    if(R.crumple && this.deadT<R.crumple+0.15){ const f=Math.min(1,this.deadT/R.crumple); P.hips.position.y=this.hipY*(1-0.45*f); P.kneeL.rotation.x=P.kneeR.rotation.x=1.5*f; P.legL.rotation.x=P.legR.rotation.x=-0.75*f; P.neck.rotation.x=-0.9*Math.min(1,this.deadT*8); P.chest.rotation.x=-0.25*f; }\n  }\n  // ---------------- wounds")
# settings
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["ACROSS · Animation", "How the new models move. Their own walk and run clips drive the legs while they hunt; the procedural puppet (lurches, stalls, twitches, attacks) drives everything else and takes over the legs for attacks, falls and crawling. Hits snap the struck part: the head back, the shoulder round, the leg out from under it.", [
    ["across.animClip","Leg clips: how much (0 = all procedural)",0,1,0.05],["across.animWalkRef","Walk clip matches (m/s)",0.3,3,0.05],["across.animRunRef","Run clip matches (m/s)",1,6,0.1],
    ["across.animSnap","Puppet snap (0 = smooth)",0,3,0.05],["across.animFlinch","Hit flinch strength",0,3,0.05],["across.animFlinchTime","Hit flinch length (s)",0.1,1.2,0.05]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
