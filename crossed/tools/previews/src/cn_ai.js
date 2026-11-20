// ================================================================ the Contortionist (BCROSS), in the playground
// Each one has a way of moving it keeps: the spider crawl, the backbend skitter, or walking like a man (until it folds).
// Low ones scuttle in and wrap her legs, dragging her along the floor until she kicks free (the break-free prompt), or
// stand and turn their heads round to run at her backward and bite. Upright ones strike with an arm bent the wrong way,
// run the neck-twist bite, or fold down into the crawl.
PVK.contortionist={ mod:PV_CN, label:"Contortionist", group:"bcross/contortionist", cfg:"contortionist", radius:0.4,
  holds:["wrap","drop"], noCollide:b=>b.clipName==="drop", clips:{drop:PV_CN.A.drop, crawl:PV_CN.LIVE.crawl, bend:PV_CN.LIVE.bend, walk:PV_CN.LIVE.walk, fold:PV_CN.LIVE.fold, die:PV_CN.LIVE.die, strike:PV_CN.A.strike, wrap:PV_CN.A.wrap, bite:PV_CN.A.bite},
  start(e,b){ const r=rng(); e.pvMem.style= r<0.45?"crawl": r<0.7?"bend":"walk"; e.pvMem.cool=1.0; if(e.pvMem.style==="walk") b.play("walk"); else { e.pvMem.after=e.pvMem.style; b.play("fold"); } },   /* a low one comes up out of its rest pose by folding down, not by dropping */
  brain(e,dt,dist,toP){ const C=CFG.contortionist, b=e.pv, m=e.pvMem, name=b.clipName; m.cool-=dt;
    const los=lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false), sees=!player.dead&&los&&dist<C.sight; if(sees) m.last={x:player.pos.x,z:player.pos.z};
    const ATT={strike:6.2,wrap:8.6,bite:6.6};
    // up on a wall, waiting over where she'll walk: it lets go when she's under it
    if(name==="drop"){ const T=b.ctx.T, ps=b.toStage(player.pos), sz=b.ctx.dropSz||1; b.ctx.underNow=!player.dead&&!player.grabbed&&Math.abs(ps.x-(4.6-1.2*sz))<0.75&&Math.abs(ps.z)<0.85;
      if(T.ph==="hang"&&!T.landT&&b.ct>(m.dropGive||28)){ b.ctx.underNow=true; m.dropMiss=true; }
      const held=player.grabbed&&player.grabbed.by===e, pinned=T.landT&&!T.offT&&!T.end&&b.ctx.out==="bitten"&&!m.dropMiss; if(held||pinned){ player.vel.set(0,0,0); player.downT=Math.max(player.downT||0,0.3); }
      if((T.offT&&b.t-T.offT>1.6)||(T.end&&!held)||(T.landT&&b.t-T.landT>5.5&&!held)){ m.style="crawl"; b.play("crawl",{anchor:"keep"}); m.cool=C.attackCool; }
      return; }
    if(name==="fold"){ if(b.ctx.folded){ m.style=m.after||"crawl"; m.after=null; b.play(m.style,{anchor:"keep"}); } return; }
    if(ATT[name]){ const held=player.grabbed&&player.grabbed.by===e;
      if(name==="wrap"&&held){ const o=m.wrapOff; if(o){ player.pos.x=e.pos.x+o.x; player.pos.z=e.pos.z+o.z; collide(player.pos,0.3); player.vel.set(0,0,0); player.downT=Math.max(player.downT||0,0.3); } return; }
      if(b.ct>ATT[name] || (name!=="wrap"&&dist>8) || (name==="wrap"&&b.ct>2&&!b.ctx.T.grab&&dist>4)){ if(m.style!=="walk"&&(name==="bite"||name==="strike")){ m.after=m.style; b.play("fold",{anchor:"keep"}); } else b.play(m.style==="walk"?"walk":m.style,{anchor:"keep"}); m.cool=C.attackCool; }   /* upright after a bite: it folds back down (the approved fold) before it crawls on */
      return; }
    if(e.stagger>0){ e.stagger-=dt; b.ctx.wantV=0; return; }
    // toward her, or to where she was last seen, round corners and through doors
    let tx=null, tz=null; if(sees){ const g=e.goal(dt); tx=g.x; tz=g.z; } else if(m.last&&Math.hypot(m.last.x-e.pos.x,m.last.z-e.pos.z)>0.8){ const g=pvRouteTo(e,m.last.x,m.last.z); tx=g.x; tz=g.z; }
    if(tx!=null){ b.ctx.wantYaw=pvWantYaw(b,tx-e.pos.x,tz-e.pos.z); b.ctx.wantV= dist>C.stopAt+(m.style==="walk"?0.6:0)?1:0; } else b.ctx.wantV=0;
    // too close to start anything: an upright one folds down; a low one skitters back out to its distance
    if(sees&&dist<2.6&&!player.grabbed){ if(m.style==="walk"&&m.cool<=0.6){ b.play("fold",{anchor:"keep"}); m.cool=0.8; return; }
      if(m.style!=="walk"&&m.cool<=0.8) m.backoff=true; }
    if(m.backoff){ if(dist>4.2||!sees) m.backoff=false; else { b.ctx.wantYaw=pvWantYaw(b,e.pos.x-player.pos.x,e.pos.z-player.pos.z); b.ctx.wantV=1.3; return; } }
    // out of her sight, a low one may go up a wall nearby and wait there for her to come under it
    if(m.style!=="walk"&&!sees&&m.cool<=0&&!player.dead&&rng()<dt*C.climbChance){ const w=cnWall(e); if(w){ b.play("drop",{dir:w.dir,outSel:{oDrop:"pending"}}); b.ctx.x=4.6-w.d; b.ctx.wallTop=Math.max(0.6,w.top-1.75); b.anchor(w.at,w.dir,4.6,0); m.dropGive=20+rng()*15; m.dropMiss=false; m.cool=C.attackCool; log(`${e.name} goes up the wall`,"#c8b0ff"); return; } }
    if(!sees||m.cool>0||player.grabbed||player.dead) return;
    if(m.style==="walk"){ if(dist<5.4&&dist>3.6){ const r=rng(); if(r<0.45) b.play("strike"); else if(r<0.7) b.play("bite"); else b.play("fold",{anchor:"keep"}); m.cool=C.attackCool; } }
    else if(dist<4.7&&dist>3.4){ b.play(rng()<C.wrapChance?"wrap":"bite"); m.cool=C.attackCool; } },
  events(e,list){ const C=CFG.contortionist, b=e.pv, m=e.pvMem;
    for(const ev of list){
      if(ev.kind==="strike"){ const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z); if(d<1.7&&runnerHitNorah(e,C.strikeDamage,"wrong-angle strike",C.strikePush,0.5)){ shake=Math.max(shake,0.25); SFX.slam(e.pos); log(`${e.name}'s arm whips round from the wrong side`,"#ff7070"); } }
      else if(ev.kind==="bite"){ const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z); if(d<1.4&&runnerHitNorah(e,C.biteDamage,"neck-twist bite",C.bitePush,0)){ shake=Math.max(shake,0.18); log(`${e.name} lunges back into her, biting`,"#ff7070"); } }
      else if(ev.kind==="wrap"){ const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
        if(d<1.5&&!player.grabbed&&player.grab(e,{dmg:C.wrapDamage,how:"leg wrap"})){ m.wrapOff={x:player.pos.x-e.pos.x,z:player.pos.z-e.pos.z}; player.downT=Math.max(player.downT||0,1.0); shake=Math.max(shake,0.2); log(`${e.name} wraps her legs and drags her down`,"#ff7070"); }
        else { b.ctx.T.free=b.t; } }
      else if(ev.kind==="dropHit"){ const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
        if(!m.dropMiss&&d<1.6&&!player.grabbed&&player.grab(e,{dmg:C.dropDamage,how:"dropped on"})){ player.downT=Math.max(player.downT||0,1.2); shake=Math.max(shake,0.35); log(`${e.name} drops off the wall onto her and pins her`,"#ff7070"); }
        else { b.ctx.out="off"; b.ctx.mash=1; } }
      else if(ev.kind==="thrownOff") log(`Norah throws ${e.name} off`,"#9ed08a");
      else if(ev.kind==="pop") SFX.chitter&&SFX.chitter(e.pos); } },
  freed(e,dir){ const b=e.pv; if(b.clipName==="drop"){ b.ctx.out="off"; b.ctx.mash=1; return; } if(b.clipName==="wrap"){ b.ctx.T.free=b.t; b.ctx.events.push({kind:"kickFree"}); } player.downT=Math.max(player.downT||0,0.6); },
  failed(e,g){ const b=e.pv; if(b.clipName==="drop"){ b.ctx.out="bitten"; return true; } if(b.clipName==="wrap") b.ctx.T.free=b.t+0.6; return false; } };

// a wall it can climb: the nearest one within a few metres, looked for along eight directions at chest height
function cnWall(e){ let best=null; const o=new THREE.Vector3(e.pos.x,1.0+groundY(e.pos.x,e.pos.z),e.pos.z), rc=new THREE.Raycaster();
  for(let i=0;i<8;i++){ const a=i*Math.PI/4, d=new THREE.Vector3(Math.sin(a),0,Math.cos(a)); rc.set(o,d); rc.far=3.2; const h=rc.intersectObjects(world.blockers,false)[0];
    if(!h||h.distance<1.25||!h.face) continue; const n=h.face.normal.clone().transformDirection(h.object.matrixWorld); if(Math.abs(n.y)>0.3||n.dot(d)>-0.85) continue;
    if((h.object.geometry&&h.object.geometry.parameters&&h.object.geometry.parameters.height||3)<2.3) continue;
    if(!best||h.distance<best.d){ const bb=new THREE.Box3().setFromObject(h.object); best={d:h.distance,dir:d,at:new THREE.Vector3(h.point.x,0,h.point.z),top:bb.max.y-groundY(h.point.x,h.point.z),obj:h.object}; } }
  return best; }
