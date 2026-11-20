// ================================================================ the club-fist and one-arm Brutes (BCROSS), in the playground
// Slow, heavy, lopsided. They drag themselves after her and hit very hard. The club-fist jabs with his small left arm,
// grabs her collar and pounds her stomach with the club (break free with the prompts), or heaves the club overhead and
// smashes it down: shoot the swelling arm twice while it's up and it tips him over backward, stunned. The one-arm swats
// her aside with the great arm close in, and charges from far off: step out of its line and it runs on past.
function bfSees(e,dist,C){ return !player.dead&&dist<C.sight&&lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false); }
function bfMove(e,dt,dist,sees,stopAt){ const b=e.pv, m=e.pvMem; let tx=null,tz=null;
  if(sees){ m.last={x:player.pos.x,z:player.pos.z}; const g=e.goal(dt); tx=g.x; tz=g.z; }
  else if(m.last&&Math.hypot(m.last.x-e.pos.x,m.last.z-e.pos.z)>0.8){ const g=pvRouteTo(e,m.last.x,m.last.z); tx=g.x; tz=g.z; }
  if(tx!=null){ b.ctx.wantYaw=pvWantYaw(b,tx-e.pos.x,tz-e.pos.z); b.ctx.wantV=sees&&dist<stopAt?0:1; } else b.ctx.wantV=0; }
// its bulk: she can't stand inside it (it shoulders her out of the way)
function bfBlock(e){ if(player.dead||(player.grabbed&&player.grabbed.by===e)) return; const dx=player.pos.x-e.pos.x, dz=player.pos.z-e.pos.z, d=Math.hypot(dx,dz), r=e.radius+0.3;
  if(d<r){ const k=(r-d)/(d||1); player.pos.x+=(d?dx:Math.sin(e.yaw))*k; player.pos.z+=(d?dz:Math.cos(e.yaw))*k; collide(player.pos,0.3); } }
function bfPt(e,bone){ return pvBodyPt(e,bone); }
function bfNear(e,bone,r){ const p=bfPt(e,bone), w=e.pv.toWorld(p); return Math.hypot(w.x-player.pos.x,w.z-player.pos.z)<r; }
// hold her where the clip has her (its line, at ctx.nx)
function bfHold(e,dt){ const b=e.pv, w=b.toWorld(new THREE.Vector3(b.ctx.nx??(b.ctx.x+0.74),0,0)); player.pos.x+=(w.x-player.pos.x)*Math.min(1,dt*8); player.pos.z+=(w.z-player.pos.z)*Math.min(1,dt*8); collide(player.pos,0.3); player.vel.set(0,0,0); }

PVK.brute_club={ mod:PV_CF, label:"Club-fist Brute", group:"bcross/brute", only:k=>k==="brute_clubfist_m01", cfg:"clubfist", radius:0.42, holds:["pound"],
  clips:{walk:PV_CF.LIVE.walk, die:PV_CF.LIVE.die, rise:PV_CF.LIVE.rise, jab:PV_CF.A.jab, hammer:PV_CF.A.hammer, pound:PV_CF.A.pound},
  start(e,b){ e.pvMem.cool=1.0; b.play("walk"); },
  brain(e,dt,dist,toP){ const C=CFG.clubfist, b=e.pv, m=e.pvMem, name=b.clipName, c=b.ctx; m.cool-=dt; bfBlock(e); const held=player.grabbed&&player.grabbed.by===e;
    if(name==="jab"){ if(b.ct>3.9) bfBack(e,C); return; }
    if(name==="pound"){ if(held) bfHold(e,dt); if((c.res&&b.t>c.resT+0.9)||b.ct>8.4){ if(held){ player.grabbed=null; } bfBack(e,C); } return; }
    if(name==="hammer"){ if(c.tip!=null){ if(c.landed!=null&&b.t-c.landed>C.tipStun){ b.play("rise",{anchor:"keep"}); } return; } if(b.ct>6.9) bfBack(e,C); return; }
    if(name==="rise"){ if(c.rk>1.7) bfBack(e,C); return; }
    const sees=bfSees(e,dist,C); bfMove(e,dt,dist,sees,1.25);
    if(!sees||m.cool>0||player.grabbed||e.facing(toP)<0.88) return;
    if(dist<1.6){ b.play(rng()<0.6?"jab":"pound",{outSel:{oPound:"pending"}}); m.cool=C.attackCool; m.shots=0; }
    else if(dist>=1.6&&dist<2.6){ b.play(rng()<0.5?"pound":"hammer",{outSel:{oPound:"pending",oHammer:"smash"}}); m.cool=C.attackCool; m.shots=0; } },
  events(e,list){ const C=CFG.clubfist, b=e.pv, c=b.ctx, held=player.grabbed&&player.grabbed.by===e;
    for(const ev of list){ const k=ev.kind;
      if(k==="jabHit"){ if(bfNear(e,"hand_L",0.75)&&runnerHitNorah(e,C.jabDamage,"left jab",C.jabPush,0)){ shake=Math.max(shake,0.1); log(`${e.name}'s small fist snaps into her`,"#ff7070"); } }
      else if(k==="hammer"){ if(bfNear(e,"hand_R",2.1)&&runnerHitNorah(e,C.hammerDamage,"overhead hammer",3.4,C.hammerDown)){ shake=Math.max(shake,0.35); log(`${e.name} brings the club down on her`,"#ff7070"); } else shake=Math.max(shake,0.25); }
      else if(k==="seized"){ if(!player.grabbed&&Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<1.6&&player.grab(e,{dmg:C.gripDamage,how:"collar pull"})){ shake=Math.max(shake,0.1); } else { c.out="free"; c.mash=1; } }
      else if(k==="pound"){ if(held){ player.hurt(C.poundDamage,e,"pound"); qteBanner(`POUNDED −${C.poundDamage}`,"bad"); shake=Math.max(shake,0.2); } }
      else if(k==="beaten"){ if(held){ player.grabbed=null; } if(Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<1.6){ runnerHitNorah(e,C.beatenDamage,"shoved down",2.2,C.beatenDown); log(`${e.name} throws her down`,"#ff7070"); } }
      else if(k==="escape"){ if(held){ player.grabbed=null; } } } },
  // the swelling arm up over his head: two shots tip him over backward
  hit(e,mesh){ const b=e.pv, c=b.ctx, m=e.pvMem, u=mesh.userData;
    if(b.clipName==="hammer"&&c.tip==null&&b.ct>1.2&&b.ct<2.95&&u.limb==="armR"){ m.shots=(m.shots||0)+1;
      if(m.shots>=CFG.clubfist.shotsToTip){ c.out="tip"; c.tip=b.t; c.tS={th:0.04,w:0.35}; log(`${e.name}: the swollen club tips him over backward`,"#9ed08a"); } else log(`${e.name}: shot in the swelling arm`,"#ffb070"); } },
  zoneMult(e,mesh){ const c=e.pv.ctx; return e.pv.clipName==="hammer"&&c.landed!=null ? (CFG.zones[mesh.userData.zone+"Mult"]??1)*CFG.clubfist.stunMult : null; },
  freed(e){ const c=e.pv.ctx; c.out="free"; c.mash=1; },
  failed(e,g){ const c=e.pv.ctx; c.n=Math.max(c.n||0,3); return true; } };
function bfBack(e,C){ e.pv.play("walk",{anchor:"keep"}); e.pvMem.cool=C.attackCool; }

PVK.brute_onearm={ mod:PV_OA, label:"One-arm Brute", group:"bcross/brute", only:k=>k==="brute_onearm_f01", cfg:"onearm", radius:0.45,
  clips:{walk:PV_OA.LIVE.walk, die:PV_OA.LIVE.die, swat:PV_OA.A.swat, charge:PV_OA.A.charge},
  start(e,b){ e.pvMem.cool=1.0; e.pvMem.chCool=2; b.play("walk"); },
  brain(e,dt,dist,toP){ const C=CFG.onearm, b=e.pv, m=e.pvMem, name=b.clipName; m.cool-=dt; m.chCool-=dt; bfBlock(e);
    if(name==="swat"){ if(b.ct>3.6) bfBack(e,C); return; }
    if(name==="charge"){ if(b.ct>6.2){ bfBack(e,C); m.chCool=C.chargeCool; } return; }
    const sees=bfSees(e,dist,C); bfMove(e,dt,dist,sees,1.1);
    if(!sees||m.cool>0||player.grabbed||e.facing(toP)<0.9) return;
    if(dist<1.3){ b.play("swat"); m.cool=C.attackCool; }
    else if(m.chCool<=0&&dist>C.chargeMin&&dist<C.chargeMax&&(typeof navLine!=="function"||navLine(e.pos.x,e.pos.z,player.pos.x,player.pos.z,0.35))){ b.play("charge",{outSel:{oCharge:"hit"}}); m.cool=C.attackCool; m.chCool=C.chargeCool; log(`${e.name} drops her shoulder and charges`,"#ffb070"); } },
  events(e,list){ const C=CFG.onearm;
    for(const ev of list){ const k=ev.kind;
      if(k==="swat"){ if(runnerHitNorah(e,C.swatDamage,"backhand swat",C.swatPush,0.6)){ shake=Math.max(shake,0.3); log(`${e.name}'s great arm swats her aside`,"#ff7070"); } }
      else if(k==="charge"){ if(Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<1.9&&runnerHitNorah(e,C.chargeDamage,"charge",5.0,C.chargeDown)){ shake=Math.max(shake,0.4); log(`${e.name} rams her off her feet`,"#ff7070"); } }
      else if(k==="chargeMiss"){ log(`${e.name} can't stop · it runs on past`,"#9ed08a"); } } } };

let BRUTE_TYPE=function(key){ return {brute_clubfist_m01:"brute_club",brute_onearm_f01:"brute_onearm"}[key]||null; };
const BRUTE_NAMES={brute_club:"Club-fist Brute",brute_onearm:"One-arm Brute"};
