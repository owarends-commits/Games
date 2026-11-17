# ACROSS step 2: the Crawler (the ambusher)
j = rep(j, "walkerMobRange:6,", "walkerMobRange:6, crawlerHp:2, crawlerSpeed:0.8, crawlerFlee:2.5, crawlerHold:6, crawlerAmbush:2, crawlerAmbushTell:0.15, crawlerPauseMin:1, crawlerPauseMax:2.5, crawlerCornered:1.5, crawlerSwipeDamage:6, crawlerRetreatMin:6, crawlerRetreatMax:10, crawlerNewSide:60, crawlerDark:0.18,")
j = rep(j, "    o.swipeDamage=B.swipeDamage*(m.swipeDamage||1); o.swipeRange=B.swipeRange*(m.swipeRange||1);",
           "    o.swipeDamage=B.swipeDamage*(m.swipeDamage||1); o.swipeRange=B.swipeRange*(m.swipeRange||1);\n    if(this.variant===\"crawler\"){ o.hp=B.crawlerHp*(this.hpMul||1); o.swipeDamage=B.crawlerSwipeDamage; }")
j = rep(j, "    if(this.state===\"chase\"){\n      if(G.mode===\"fallen\"){",
           "    if(this.state===\"chase\" && this.variant===\"crawler\" && this.legsLost()===0 && G.mode!==\"fallen\" && G.mode!==\"rising\"){ this.crawlerBrain(dt,dist,want,toP); return; }\n    if(this.state===\"chase\"){\n      if(G.mode===\"fallen\"){")
j = rep(j, "    if(this.hp<=0){ this.die(dir); log(", "    if(this.hp>0 && this.variant===\"crawler\") this.crawlerHurt(dir);\n    if(this.hp<=0){ this.die(dir); log(")
j = rep(j, "    let f=0; if(this.state===\"chase\"&&G.mode===\"fallen\") f=1; else if(this.state===\"chase\"&&G.mode===\"rising\") f=Math.max(0,G.t/G.dur);",
           "    let f=0; if(this.state===\"chase\"&&G.mode===\"fallen\") f=1; else if(this.state===\"chase\"&&G.mode===\"rising\") f=Math.max(0,G.t/G.dur);\n    if(this.cr&&this.cr.playDead&&this.state===\"chase\") f=1;")
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["ACROSS · Crawler", "The ambusher. Slow and weak in the open. Moves cover to cover toward Norah, then holds a hiding spot and grabs her ankle as she passes. Caught in the open it flees, or swipes if cornered. Hurt, it retreats and comes back from another side.", [
    ["across.crawlerHp","Health",0.5,10,0.5],["across.crawlerSpeed","Speed in the open (m/s)",0.2,3,0.05],["across.crawlerFlee","Flee speed (m/s)",0.5,5,0.1],
    ["across.crawlerHold","Stops advancing within (m)",1,15,0.5],["across.crawlerAmbush","Ambush range (m)",0.5,4,0.1],["across.crawlerAmbushTell","Ambush tell (s)",0,1,0.05],
    ["across.crawlerPauseMin","Pause at each hiding spot: shortest (s)",0,5,0.1],["across.crawlerPauseMax","Pause at each hiding spot: longest (s)",0,8,0.1],
    ["across.crawlerCornered","Fights back when she's within (m)",0,4,0.1],["across.crawlerSwipeDamage","Cornered swipe damage",0,40,1],
    ["across.crawlerRetreatMin","Hides after a hit: shortest (s)",0,20,0.5],["across.crawlerRetreatMax","Hides after a hit: longest (s)",0,30,0.5],["across.crawlerNewSide","Comes back from a side at least (°) off",0,180,5],
    ["across.crawlerDark","Dark enough to hide in (light level)",0,0.6,0.01]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')

# a crawler is low and narrow: it fits down a 0.84 m hallway
j = rep(j, 'this.radius = big ? 0.45 : this.stance==="crawling" ? 0.4 : 0.33;', 'this.radius = big ? 0.45 : this.stance==="crawling" ? 0.3 : 0.33;')
