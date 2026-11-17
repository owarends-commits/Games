// ================================================================ the Reachers (BCROSS), in the playground
// They loom at the edge of their reach and strike from there. Long necks whip a headbutt in from out of her reach, and
// bite from above or coil round her when she's closer. Long arms swipe her aside, snatch her round the waist and reel
// her in to bite, or sweep her feet out and pin her. A shot in the neck mid-whip spoils the strike; enough shots at one
// arm joint take the arm off there (and its reach falls short after).
function rcRec(b){ return b.rec(); }
function rcAddHits(b,seg){ const R=b.rc, kind=R&&R.kind, B=b.C.B; if(!R) return;
  if(kind==="neck"){ const ch=["neck"]; for(let k=1;k<R.N;k++) ch.push("nk"+k); ch.push("head");
    for(let k=0;k<ch.length-1;k++){ seg(ch[k],ch[k+1],0.07,"torso","neck"); b.hits[b.hits.length-1].userData.chainK=k; } }
  else for(const s of ["L","R"]){ const ch=["upperarm_"+s]; for(let k=1;k<R.F.length;k++) ch.push("ar"+s+k);
    for(let k=0;k<ch.length-1;k++){ seg(ch[k],ch[k+1],0.06,"arm","arm"+s); b.hits[b.hits.length-1].userData.chainK=k; } } }
function rcBase(type,label,only){ return { mod:PV_RC, label, group:"bcross/reacher", only, cfg:"reacher", radius:0.38,
  clips:{loom:PV_RC.LIVE.loom, die:PV_RC.LIVE.die, whip:PV_RC.A.whip, bite:PV_RC.A.bite, coil:PV_RC.A.coil, swipe:PV_RC.A.swipe, snatch:PV_RC.A.snatch, trip:PV_RC.A.trip},
  noArmHits:b=>b.rc&&b.rc.kind==="arm", hits:(b,seg)=>rcAddHits(b,seg),
  start(e,b){ e.pvMem.cool=1.2; e.pvMem.armHits={L:{},R:{}}; b.play("loom"); },
  brain(e,dt,dist,toP){ const C=CFG.reacher, b=e.pv, m=e.pvMem, name=b.clipName, kind=b.rc.kind; m.cool-=dt;
    const los=lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false), sees=!player.dead&&los&&dist<C.sight; if(sees) m.last={x:player.pos.x,z:player.pos.z};
    b.ctx.gap=dist; const held=player.grabbed&&player.grabbed.by===e;
    const ATT={whip:4.6,bite:5.2,coil:5.6,swipe:4.6,snatch:5.4,trip:7.6};
    if(ATT[name]){ if(held&&name==="snatch"){ const w=b.toWorld(new THREE.Vector3(b.ctx.nx,0,b.toStage(player.pos).z)); player.pos.x+=(w.x-player.pos.x)*Math.min(1,dt*10); player.pos.z+=(w.z-player.pos.z)*Math.min(1,dt*10); collide(player.pos,0.3); player.vel.set(0,0,0); }
      if(held&&name==="coil"){ player.vel.set(0,0,0); }
      if(name==="coil"&&!m.grab&&b.ct>1.45){ m.grab=true; if(dist<1.7&&!player.grabbed&&player.grab(e,{dmg:C.coilDamage,how:"neck coil"})){ shake=Math.max(shake,0.15); log(`${e.name}'s neck coils round her`,"#ff7070"); } else { b.ctx.out="free"; b.ctx.mash=1; } }
      if(name==="trip"&&m.pinned&&b.ct>m.pinned+1.7&&!m.kicked){ m.kicked=true; player.downT=Math.max(player.downT||0,0.4); log("Norah kicks it off","#9ed08a"); }
      if(b.ct>ATT[name]&&!held){ b.play("loom",{anchor:"keep"}); m.cool=C.attackCool; m.grab=false; m.pinned=null; m.kicked=false; b.ctx.liveShotAt=null; }
      return; }
    // loom: to the edge of its reach, toward her or where she was last seen
    let tx=null,tz=null; if(sees){ const g=e.goal(dt); tx=g.x; tz=g.z; } else if(m.last&&Math.hypot(m.last.x-e.pos.x,m.last.z-e.pos.z)>1){ tx=m.last.x; tz=m.last.z; b.ctx.gap=99; }
    if(tx!=null){ b.ctx.wantYaw=pvWantYaw(b,tx-e.pos.x,tz-e.pos.z); b.ctx.wantV=1; } else { b.ctx.wantV=0; }
    const R=PV_RC.LIVE.reach(rcRec(b)), L=b.rc.L, closeD=Math.max(0.62,Math.min(1.3,0.3*L+0.42)), biteD=0.36*L+0.42;
    // a neck one either whips from the edge of its reach or steps in close to bite from above or coil round her
    if(kind==="neck"){ if(!m.plan) m.plan=rng()<0.55?"whip":"close"; if(m.plan==="close"&&sees) b.ctx.gap=dist+(R-0.06-Math.min(biteD,closeD+0.1)); }
    if(!sees||m.cool>0||player.grabbed||player.dead) return;
    const face=e.facing(toP)>0.85;
    if(!face) return;
    if(kind==="neck"){ const near=Math.min(biteD,closeD+0.1);
      if(dist<near+0.12&&dist>0.45){ b.play(dist<closeD+0.05&&rng()<0.6?"coil":"bite",{outSel:{oCoil:"pending"}}); m.cool=C.attackCool; m.plan=null; }
      else if(m.plan==="whip"&&dist<R+0.05&&dist>R-0.6){ b.play("whip"); m.cool=C.attackCool; m.plan=null; } }
    else if(dist<R+0.05&&dist>R-0.65){ const r=rng(); b.play(r<0.45?"swipe":r<0.75?"snatch":"trip",{outSel:{oSnatch:"pending"}}); m.cool=C.attackCool; } },
  events(e,list){ const C=CFG.reacher, b=e.pv, m=e.pvMem, d=()=>Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    for(const ev of list){ const k=ev.kind;
      if(k==="whip"){ if(runnerHitNorah(e,C.whipDamage,"whip headbutt",C.whipPush,0.8)){ shake=Math.max(shake,0.28); log(`${e.name}'s head slams into her`,"#ff7070"); } }
      else if(k==="bite"){ if(runnerHitNorah(e,C.biteDamage,"bite from above",0.6,0)){ shake=Math.max(shake,0.18); log(`${e.name} bites down from above`,"#ff7070"); } }
      else if(k==="coilBite"){ player.bite(e,"bite",C.coilBiteDamage); qteBanner(`BITTEN −${C.coilBiteDamage}`,"bad"); }
      else if(k==="swipe"){ if(runnerHitNorah(e,C.swipeDamage,"long swipe",C.swipePush,0.5)){ shake=Math.max(shake,0.25); log(`${e.name} slaps her aside`,"#ff7070"); } }
      else if(k==="snatch"){ if(!player.grabbed&&player.grab(e,{dmg:C.snatchDamage,how:"snatch"})){ shake=Math.max(shake,0.12); log(`${e.name}'s arm wraps her waist and reels her in`,"#ff7070"); } else { b.ctx.out="free"; b.ctx.mash=1; } }
      else if(k==="snatchBite"){ player.bite(e,"bite",C.snatchBiteDamage); qteBanner(`BITTEN −${C.snatchBiteDamage}`,"bad"); }
      else if(k==="trip"){ if(runnerHitNorah(e,4,"trip",0,C.tripDown)){ shake=Math.max(shake,0.16); log(`${e.name} sweeps her feet out`,"#ff7070"); } }
      else if(k==="pin"){ if((player.downT||0)>0){ m.pinned=b.ct; player.hurt(C.pinDamage,e,"pin"); player.downT=Math.max(player.downT,1.8); shake=Math.max(shake,0.2); } } } },
  hit(e,mesh,point,dir){ const b=e.pv, m=e.pvMem, u=mesh.userData;
    if(u.limb==="neck"&&b.clipName==="whip"&&b.ctx.liveShotAt==null&&b.ct>0.6){ b.ctx.liveShotAt=b.t; log(`${e.name}: shot in the neck · the strike goes wide`,"#ffb070"); }
    if(u.limb&&u.limb.startsWith("arm")&&b.rc.kind==="arm"&&u.chainK!=null){ const s=u.limb.slice(3), j=u.chainK<=2?1:u.chainK<=4?2:3; m.armHits[s][j]=(m.armHits[s][j]||0)+1;
      if(m.armHits[s][j]>=CFG.reacher.armJointHp&&PV_RC.LIVE.cutArm(rcRec(b),s,j)){ for(const h of b.hits) if(h.userData.limb===u.limb&&h.userData.chainK>=b.rc.main[j-1]) h.userData.enemy=null; log(`${e.name}: its ${s==="L"?"left":"right"} arm comes off at the joint`,"#ffb070"); shake=Math.max(shake,0.12); } } },
  freed(e,dir){ const b=e.pv; b.ctx.out="free"; b.ctx.mash=1; },
  failed(e,g){ const b=e.pv; b.ctx.out="fail"; if(b.clipName==="snatch") b.ctx.nx=b.ctx.x+0.7; return true; } }; }
PVK.reacher=rcBase("reacher","Reacher",k=>/reacher_(m01|f03)$/.test(k));
PVK.reacher_arm=rcBase("reacher_arm","Reacher",k=>/reacher_(m02|f02)$/.test(k));
