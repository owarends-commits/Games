# the Brute variants (preview bodies): settings and their panel sections
j = rep(j, "  norah:{hp:100,", """  clubfist:{hp:16, sight:22, attackCool:2.2, jabDamage:10, jabPush:1.6, hammerDamage:45, hammerDown:2.0, gripDamage:4, poundDamage:15, beatenDamage:8, beatenDown:1.6, shotsToTip:2, tipStun:4.0, stunMult:2.0},
  onearm:{hp:18, sight:24, attackCool:2.4, swatDamage:30, swatPush:4.5, chargeDamage:35, chargeDown:2.2, chargeMin:4.0, chargeMax:8.5, chargeCool:6},
  norah:{hp:100,""")
j = rep(j, '  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [', '''  ["Club-fist Brute (BCROSS)", "Drags himself after her. Left jabs, a collar grab and pounding (break free with the prompts), or the overhead hammer: shoot the swelling arm while it's up and it tips him over.", [
    ["clubfist.hp","Health",1,60,1],["clubfist.attackCool","Seconds between attacks",0.5,10,0.25],["clubfist.jabDamage","Left jab damage",0,60,1],["clubfist.hammerDamage","Overhead hammer damage",0,120,1],["clubfist.poundDamage","Pound (each) damage",0,60,1],
    ["clubfist.shotsToTip","Shots to the swelling arm to tip him over",1,6,1],["clubfist.tipStun","Stunned on his back (s)",0.5,10,0.25],["clubfist.stunMult","Damage × while he's down",1,5,0.25]]],
  ["One-arm Brute (BCROSS)", "One great arm. Swats her aside close in; charges from far off, and can't stop if she steps out of its line.", [
    ["onearm.hp","Health",1,60,1],["onearm.attackCool","Seconds between attacks",0.5,10,0.25],["onearm.swatDamage","Backhand swat damage",0,100,1],["onearm.chargeDamage","Charge damage",0,120,1],["onearm.chargeDown","Charge: down for (s)",0.5,5,0.1],
    ["onearm.chargeMin","Charges from (m)",2,10,0.25],["onearm.chargeMax","Charges up to (m)",3,15,0.25],["onearm.chargeCool","Seconds between charges",1,20,0.5]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [''')
