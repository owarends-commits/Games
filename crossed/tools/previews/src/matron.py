# ACROSS step 3: the Matron (the holder), plus the second-grab rule
j = rep(j, "crawlerDark:0.18,", "crawlerDark:0.18, matronHp:4.5, matronSpeed:1.3, matronStagger:0.35, matronKnock:0.1, matronHugRange:1.3, matronHugTell:0.5, matronHugDamage:12, matronHugCool:4, matronShoveRange:0.9, matronShoveTell:0.35, matronShoveDamage:6, matronShoveDown:1.0, matronShoveCool:3, matronDoorDamage:0.75, matronBatterRate:1.0, joinKeys:2, joinDrain:0.35,")
# her numbers: health, swipe stays, knockdowns rare
j = rep(j, "    if(this.variant===\"crawler\"){ o.hp=B.crawlerHp*(this.hpMul||1); o.swipeDamage=B.crawlerSwipeDamage; }",
           "    if(this.variant===\"crawler\"){ o.hp=B.crawlerHp*(this.hpMul||1); o.swipeDamage=B.crawlerSwipeDamage; }\n    if(this.variant===\"matron\"){ o.hp=B.matronHp*(this.hpMul||1); for(const k of [\"legShotFall\",\"torsoFall\",\"headFall\",\"shoveFall\"]) o[k]*=B.matronKnock; }")
j = rep(j, "*(V.fresh?1.3:1)*(this.stance===\"crawling\"?0.9:1)*CFG.phys.acrossMass; }", "*(V.fresh?1.3:1)*(this.stance===\"crawling\"?0.9:1)*(this.variant===\"matron\"?1.6:1)*CFG.phys.acrossMass; }")
# shrug it off
j = rep(j, "    if(fallP>0 && rng()<fallP){ stagNote", "    if(this.variant===\"matron\") fallP*=CFG.across.matronKnock;\n    if(fallP>0 && rng()<fallP){ stagNote")
j = rep(j, "this.stagger = stag*(wasRecover?CFG.across.punish:1);", "this.stagger = stag*(wasRecover?CFG.across.punish:1)*(this.variant===\"matron\"?CFG.across.matronStagger:1);")
j = rep(j, "      e.stagger = big?CFG.norah.shoveStunBig:CFG.norah.shoveStunSmall;", "      e.stagger = (big?CFG.norah.shoveStunBig:CFG.norah.shoveStunSmall)*(e.variant===\"matron\"?CFG.across.matronStagger:1);")
# her brain and her shove
j = rep(j, "    if(this.state===\"wail\"){\n", "    if(this.state===\"mshove\"){ this.matronShove(dt,dist,want); return; }\n    if(this.state===\"wail\"){\n")
j = rep(j, "    if(this.state===\"chase\" && this.variant===\"crawler\"", "    if(this.state===\"chase\" && this.variant===\"matron\" && this.legsLost()===0 && G.mode!==\"fallen\" && G.mode!==\"rising\"){ this.matronBrain(dt,dist,want,toP); return; }\n    if(this.state===\"chase\" && this.variant===\"crawler\"")
j = rep(j, '["windup","lunge","swipe","grab","bite"].includes(e.state)', '["windup","lunge","swipe","grab","bite","mshove"].includes(e.state)')
j = rep(j, '["windup","lunge","swipe","grab","wail","recover","bite"].includes(this.state)', '["windup","lunge","swipe","grab","wail","recover","bite","mshove"].includes(this.state)')
j = rep(j, "(this.state===\"bite\"&&!this.hitDone))", "(this.state===\"bite\"&&!this.hitDone) || (this.state===\"mshove\"&&!this.hitDone))")
j = rep(j, "    else if(this.state===\"bite\"){", "    else if(this.state===\"mshove\"){ const a=Math.min(1,this.t/CFG.across.matronShoveTell); if(!this.hitDone){ v.aLX=v.aRX=0.9*a; v.eL=v.eR=1.6*a; v.hp-=0.15*a; } else { v.aLX=v.aRX=1.55; v.eL=v.eR=0.1; v.hp+=0.25; } v.aLZ=0.15; v.aRZ=-0.15; v.jaw=0.4; }\n    else if(this.state===\"bite\"){")
# lost: guard the spot; noises don't pull her off it
j = rep(j, "if(this.aware===\"hunting\"){ if(!this.sees){ this.lastKnown={x:n.tx,z:n.tz};", "if(this.aware===\"hunting\"){ if(!this.sees && this.variant!==\"matron\"){ this.lastKnown={x:n.tx,z:n.tz};")
j = rep(j, "if(CW){ this.lastKnown={x:CW.x,z:CW.z}; this.lostT=Math.min(this.lostT,1.5); } else if(this.lostT>SS.loseTime) this.toSearch(); }",
           "if(CW){ this.lastKnown={x:CW.x,z:CW.z}; this.lostT=Math.min(this.lostT,1.5); } else if(this.variant===\"matron\"){ if(!this.lastKnown) this.lastKnown=world.crowd?{x:world.crowd.x,z:world.crowd.z}:{x:player.pos.x,z:player.pos.z}; this.lostT=Math.min(this.lostT,2); } else if(this.lostT>SS.loseTime) this.toSearch(); }")
# the second grab: one longer escape, and both bite on a failure
j = rep(j, "    if(this.dead||this.grabbed) return false; const N=CFG.norah, S=CFG.across;", "    if(this.dead) return false; if(this.grabbed) return joinGrab(by,o); const N=CFG.norah, S=CFG.across;")
j = rep(j, "else if(this.hitDone && !(player.grabbed && player.grabbed.by===this)){ this.state=\"recover\"; this.t=0; }", "else if(this.hitDone && !(player.grabbed && (player.grabbed.by===this || (player.grabbed.extra||[]).includes(this)))){ this.state=\"recover\"; this.t=0; }")
# settings
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["ACROSS · Matron", "The holder. Slow, steady and hard to stop. Bear hugs Norah (mash to escape), shoves her down when she's too close for a hug, swipes while the hug is on cooldown. Batters a door between her and Norah; otherwise guards the last spot she saw her.", [
    ["across.matronHp","Health",0.5,15,0.5],["across.matronSpeed","Walk speed (m/s)",0.2,3,0.05],["across.matronStagger","Staggers ×",0,1,0.05],["across.matronKnock","Knockdown chance ×",0,1,0.05],
    ["across.matronHugRange","Bear hug: reach (m)",0.5,3,0.05],["across.matronHugTell","Bear hug: tell (arms open, s)",0.1,1.5,0.05],["across.matronHugDamage","Bear hug: squeeze damage",0,40,1],["across.matronHugCool","Bear hug: cooldown (s)",0,15,0.5],
    ["across.matronShoveRange","Shove: when she's closer than (m)",0.3,2,0.05],["across.matronShoveTell","Shove: tell (s)",0.1,1.5,0.05],["across.matronShoveDamage","Shove: damage",0,40,1],["across.matronShoveDown","Shove: time on the floor (s)",0,3,0.05],["across.matronShoveCool","Shove: cooldown (s)",0,15,0.5],
    ["across.matronDoorDamage","Battering a door: damage per hit (doors take 3)",0.1,3,0.05],["across.matronBatterRate","Battering a door: seconds between hits",0.3,4,0.1],
    ["across.joinKeys","Second grab: extra keys",0,6,1],["across.joinDrain","Second grab: hug bar drops by",0,1,0.05]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
