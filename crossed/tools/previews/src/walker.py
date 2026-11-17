# ACROSS step 1: the Walker (the swarm) + swarm-wide staggered tells
j = setvals(j, "across", {"maxAttackers":99})
j = rep(j, "mashDecay:0.35,", "mashDecay:0.35, tellGap:0.35, walkerShamble:1.1, walkerClose:4, walkerBurst:1.9, walkerBurstMin:0.3, walkerBurstMax:0.6, walkerStallMin:0.4, walkerStallMax:0.8, walkerGapMin:0.5, walkerGapMax:1.0, walkerBiteTell:0.25, walkerBiteDamage:8, walkerBiteRange:1.2, walkerWoundSlow:0.88, walkerMinSpeed:0.5, walkerMob:0.35, walkerMobRange:6,")
# new defaults (no attacker cap) must win over saved settings
j = rep(j, 'LS.get("crossed_sandbox_cfg_v2", {})', 'LS.get("crossed_sandbox_cfg_v3", {})')
j = rep(j, 'LS.set("crossed_sandbox_cfg_v2", CFG)', 'LS.set("crossed_sandbox_cfg_v3", CFG)')
j = rep(j, "world = {trail:[],", "world = {crowd:null, trail:[],")
# swarm tells: every attack start waits for the gap since the last one
j = rep(j, "        if(dist<S.swipeRange*0.9 && this.swCool<=0 && G.t<G.dur*0.7){ this.startSwipe(true); return; }",
           "        if(dist<S.swipeRange*0.9 && this.swCool<=0 && G.t<G.dur*0.7 && tellOk()){ markTell(); this.startSwipe(true); return; }")
j = rep(j, "&& token && !player.grabbed && canSee()){ this.grabKind=\"ankle\";", "&& token && !player.grabbed && canSee() && tellOk()){ markTell(); this.grabKind=\"ankle\";")
j = rep(j, "      if(dist<S.swipeRange && this.swCool<=0 && token && this.armsLeft()>0 && canSee()){",
           """      if(this.variant==="walker" && (player.downT>0||player.stumble>0.2) && !player.grabbed && dist<S.walkerBiteRange && (this.biteCool||0)<=0 && canSee() && tellOk()){ markTell(); this.state="bite"; this.t=0; this.hitDone=false; this.biteCool=1.5; SFX.chitter(this.pos); this.attackLog(`${this.name} goes for a bite`); return; }
      if(dist<S.swipeRange && this.swCool<=0 && token && this.armsLeft()>0 && canSee() && tellOk()){ markTell();""")
j = rep(j, "      if(dist<S.lungeRange && dist>S.swipeRange*0.8 && this.cool<=0 && token && this.legsLost()<2 && canSee()){",
           "      if(dist<S.lungeRange && dist>S.swipeRange*0.8 && this.cool<=0 && token && this.legsLost()<2 && canSee() && tellOk()){ markTell();")
j = rep(j, '["windup","lunge","swipe","grab"].includes(e.state)', '["windup","lunge","swipe","grab","bite"].includes(e.state)')
j = rep(j, '["windup","lunge","swipe","grab","wail","recover"].includes(this.state)', '["windup","lunge","swipe","grab","wail","recover","bite"].includes(this.state)')
j = rep(j, "    this.swCool=(this.swCool||0)-dt; this.wailCool-=dt;", "    this.swCool=(this.swCool||0)-dt; this.wailCool-=dt; this.biteCool=(this.biteCool||0)-dt;")
# the bite
j = rep(j, "    if(this.state===\"swipe\"){\n", """    if(this.state==="bite"){
      this.turnTo(want, dt, S.turn*1.5);
      if(!this.hitDone && this.t>=S.walkerBiteTell){ this.hitDone=true; this.hitFlash=0.2; const ok=dist<S.walkerBiteRange+0.25; this.attackLog(`${this.name} bite: Norah ${dist.toFixed(2)} m → ${ok?"HIT":"miss"}`); if(ok) player.hurt(S.walkerBiteDamage, this, "bite"); }
      if(this.t>=S.walkerBiteTell+0.3){ this.state="chase"; this.t=0; }
      return;
    }
    if(this.state==="swipe"){
""")
j = rep(j, "(this.state===\"grab\"&&!this.hitDone))", "(this.state===\"grab\"&&!this.hitDone) || (this.state===\"bite\"&&!this.hitDone))")
j = rep(j, "    else if(this.state===\"wail\"){ v.nX=-1.15;", "    else if(this.state===\"bite\"){ const a=Math.min(1,this.t/CFG.across.walkerBiteTell); v.hp+=0.55*a; v.hy*=1-0.25*a; v.nX=-0.9*a+(this.hitDone?0.5:0); v.jaw=this.hitDone?0.1:0.8; v.aLX=v.aRX=1.1; v.eL=v.eR=0.6; }\n    else if(this.state===\"wail\"){ v.nX=-1.15;")
# the Walker's gait: shamble from afar, burst / stall / shamble up close
j = rep(j, "      G.t-=dt; if(G.t<=0) this.newGait(G.mode===\"burst\"?\"stall\":\"burst\");", "      if(this.variant===\"walker\") this.walkerGait(dt, dist); else { G.t-=dt; if(G.t<=0) this.newGait(G.mode===\"burst\"?\"stall\":\"burst\"); }")
j = rep(j, "      const sp = this.creeping ?", "      const sp = this.variant===\"walker\" ? this.walkerSpeed() : this.creeping ?")
j = rep(j, "(G.mode===\"burst\"?1:G.mode===\"stall\"?0.2:0)", "(G.mode===\"burst\"?1:G.mode===\"shamble\"?0.55:G.mode===\"stall\"?0.2:0)")
j = rep(j, "  newGait(mode){ const S=this.S, G=this.gait; G.mode=mode;", """  walkerGait(dt, dist){
    const S=this.S, G=this.gait; if(G.mode==="fallen"||G.mode==="rising") return;
    const pick=(a,b)=>a+rng()*Math.max(0,b-a), set=m=>{ G.mode=m; G.mul=1; G.dur=G.t=m==="burst"?pick(S.walkerBurstMin,S.walkerBurstMax):m==="stall"?pick(S.walkerStallMin,S.walkerStallMax):pick(S.walkerGapMin,S.walkerGapMax); };
    if(dist>S.walkerClose){ if(G.mode!=="shamble"||G.near){ G.near=false; G.mode="shamble"; G.mul=1; G.t=G.dur=1; } return; }
    if(!G.near){ G.near=true; set("burst"); return; }
    G.t-=dt; if(G.t>0) return; set(G.mode==="burst"?"stall":G.mode==="stall"?"shamble":"burst");
  }
  walkerSpeed(){ const S=this.S, G=this.gait, f=this.speedNow()/Math.max(0.1,S.speed);
    return f*(G.mode==="burst"?S.walkerBurst:G.mode==="stall"?S.walkerBurst*0.06:S.walkerShamble*(G.near?0.85:1)); }
  newGait(mode){ const S=this.S, G=this.gait; G.mode=mode;""")
# wounds slow it
j = rep(j, "const b2=base*(this.speedMul||1);", "const b2=base*(this.speedMul||1)*(this.woundMul||1);")
j = rep(j, "    if(this.hp<=0){ this.die(dir); log(", "    if(this.hp>0 && this.variant===\"walker\") this.woundMul=Math.max(CFG.across.walkerMinSpeed,(this.woundMul||1)*CFG.across.walkerWoundSlow);\n    if(this.hp<=0){ this.die(dir); log(")
# the crowd: what any hunting ACROSS sees or hears, the Walkers follow as a mob
j = rep(j, "      if(this.aware===\"hunting\"){ if(!this.sees){ this.lastKnown={x:n.tx,z:n.tz}; this.lostT=Math.min(this.lostT,1.5); } continue; }",
           "      if(this.aware===\"hunting\"){ if(!this.sees){ this.lastKnown={x:n.tx,z:n.tz}; this.lostT=Math.min(this.lostT,1.5); crowdNote(n.tx,n.tz,\"noise\"); } continue; }")
j = rep(j, "{ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; } else { this.lostT+=dt; if(this.lostT>SS.loseTime) this.toSearch(); } return; }",
           "{ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; crowdNote(pp.x,pp.z,\"sight\"); } else { this.lostT+=dt; const CW=this.variant===\"walker\"?walkerCrowd(this):null; if(CW){ this.lastKnown={x:CW.x,z:CW.z}; this.lostT=Math.min(this.lostT,1.5); } else if(this.lostT>SS.loseTime) this.toSearch(); } return; }")
j = rep(j, "    const SS=CFG.stealth, pp=player.pos, I=this.idle; if(this.huntFlash>0) this.huntFlash-=dt;",
           "    const SS=CFG.stealth, pp=player.pos, I=this.idle; if(this.huntFlash>0) this.huntFlash-=dt;\n    if(this.variant===\"walker\" && this.aware===\"searching\" && world.crowd && gameTime-world.crowd.t<1){ this.lastKnown={x:world.crowd.x,z:world.crowd.z}; this.alert(\"joins the others\",false); return; }")
j = rep(j, "      const g=this.goal(dt); let gWant=Math.atan2(g.x-this.pos.x,g.z-this.pos.z);", "      const g=this.goal(dt); let gWant=Math.atan2(g.x-this.pos.x,g.z-this.pos.z); if(this.variant===\"walker\" && !this.sees) gWant=walkerMob(this,gWant);")
# settings
j = rep(j, '["across.maxAttackers","Pack: attackers at once",1,6,1]', '["across.tellGap","Swarm: time between attack tells (s)",0,1.5,0.05],["across.maxAttackers","Pack: attackers at once (99 = no cap)",1,99,1]')
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["ACROSS · Walker", "The swarm. Shambles from afar; inside its close range it bursts, stalls and shambles. Bites Norah when she's down. Follows the crowd when it loses her. Each wound slows it.", [
    ["across.walkerShamble","Shamble speed (m/s)",0.2,3,0.05],["across.walkerClose","Bursts start within (m)",0,10,0.25],["across.walkerBurst","Burst speed (m/s)",0.5,5,0.05],
    ["across.walkerBurstMin","Burst: shortest (s)",0.05,2,0.05],["across.walkerBurstMax","Burst: longest (s)",0.05,2,0.05],["across.walkerStallMin","Stall: shortest (s)",0,2,0.05],["across.walkerStallMax","Stall: longest (s)",0,2,0.05],
    ["across.walkerGapMin","Shamble between bursts: shortest (s)",0,3,0.05],["across.walkerGapMax","Shamble between bursts: longest (s)",0,3,0.05],
    ["across.walkerBiteTell","Bite: tell (s)",0.05,1,0.05],["across.walkerBiteDamage","Bite: damage",0,40,1],["across.walkerBiteRange","Bite: reach (m)",0.5,2.5,0.05],
    ["across.walkerWoundSlow","Each wound: speed ×",0.5,1,0.01],["across.walkerMinSpeed","Wounds: slowest it gets ×",0.1,1,0.05],
    ["across.walkerMob","Mob: pull toward other Walkers",0,1,0.05],["across.walkerMobRange","Mob: counts Walkers within (m)",1,15,0.5]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
