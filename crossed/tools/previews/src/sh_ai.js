// ================================================================ the split-head Reacher (BCROSS unique), in the playground
// Its body sits in a room of its own and never moves; the neck runs out through the doorway and the head roams her rooms.
// The head is quick and hard to hit: it darts aside from shots, and a shot on the closed skull does little. A shot into
// the open split counts (it snaps shut and recoils). The body is the weak point: find it and it goes down in a few shots.
// It lures her with the hanging face and snaps, bites with the split, or engulfs her head (break-free prompt or it bites down).
function shDoor(e){ // the doorway out of its room: the nearest door it can see; with none, the way she is
  let best=null, bd=4.5; for(const p of world.portals||[]){ const d=Math.hypot(p.x-e.pos.x,p.z-e.pos.z); if(d>0.4&&d<bd&&wallsClear(e.pos.x,e.pos.z,p.x,p.z)){ bd=d; best=p; } }
  if(best){ const q=world.portals[best.pair]; const far=q&&Math.hypot(q.x-e.pos.x,q.z-e.pos.z)>bd?q:best; return {x:far.x,z:far.z,d:Math.hypot(far.x-e.pos.x,far.z-e.pos.z)}; }
  const to=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z); if(to.lengthSq()<1e-4) to.set(Math.sin(e.yaw),0,Math.cos(e.yaw)); to.normalize();
  return {x:e.pos.x+to.x*1.0,z:e.pos.z+to.z*1.0,d:1.0}; }
function shHeadW(b){ return b.C.B.head.getWorldPosition(new THREE.Vector3()); }
function shHits(b,seg,mat){ const R=b.rc, B=b.C.B; if(!R) return; const ch=["neck"]; for(let k=1;k<R.N;k++) ch.push("nk"+k); ch.push("head");
  for(let k=0;k<ch.length-1;k++) seg(ch[k],ch[k+1],0.07,"torso","neck");
  const hb=new THREE.Mesh(new THREE.SphereGeometry(0.21,10,8),mat); hb.position.set(0,0.12,0.06); B.head.add(hb); hb.userData={enemy:b.e,zone:"head",limb:"head",pv:true,hitbox:true}; b.hits.push(hb); }
PVK.splithead={ mod:PV_SH, label:"Split-Head Reacher", group:"bcross/reacher", only:k=>/reacher_f01$/.test(k), cfg:"splithead", radius:0.45, holds:["engulf"],
  clips:{prowl:PV_SH.LIVE.prowl, recoil:PV_SH.LIVE.recoil, die:PV_SH.LIVE.die, bait:PV_SH.A.bait, bite:PV_SH.A.bite2, engulf:PV_SH.A.engulf},
  noHeadHit:()=>true, hits:(b,seg,mat)=>shHits(b,seg,mat),
  start(e,b){ const D=shDoor(e), d=clamp(D.d,0.6,2.2); b.C.bx=-d; e.pvMem={cool:1.5,door:D};
    b.play("prowl",{anchor:"keep",reset:true}); b.anchor(new THREE.Vector3(e.pos.x,0,e.pos.z),new THREE.Vector3(D.x-e.pos.x,0,D.z-e.pos.z).normalize(),-d,0);
    log(`${e.name}: the body sits by the doorway; the neck goes out through it`,"#c8b0ff"); },
  brain(e,dt){ const C=CFG.splithead, b=e.pv, m=e.pvMem, c=b.ctx, name=b.clipName; m.cool-=dt;
    const hw=shHeadW(b), hd=Math.hypot(player.pos.x-hw.x,player.pos.z-hw.z);
    const sees=!player.dead&&hd<C.sight&&lineOfSight(hw.x,hw.z,player.pos.x,player.pos.z,false); if(sees) m.last={x:player.pos.x,z:player.pos.z};
    const ATT={bait:7.2,bite:5.2,engulf:6.6,recoil:2.6}, held=player.grabbed&&player.grabbed.by===e;
    if(ATT[name]){ if(held) player.vel.set(0,0,0);
      if(b.ct>ATT[name]&&!held){ c.M0=null; b.play("prowl",{anchor:"keep",reset:true}); m.cool=C.attackCool; } return; }
    // she aims at the head: it darts (in her sights: within 12° of where she looks)
    const ad=new THREE.Vector3(hw.x-player.pos.x,0,hw.z-player.pos.z); c.aimed=!!player.aiming&&ad.length()<14&&Math.abs(wrapA(Math.atan2(ad.x,ad.z)-player.yaw))<0.21;
    if(m.backT>0){ m.backT-=dt; c.mode="back"; return; }
    // how far the neck can take the head: out through the doorway toward her
    const D=m.door, reach=Math.max(0,C.neck-0.6-Math.max(0.6,D.d))+0.3, fromDoor=Math.hypot(player.pos.x-D.x,player.pos.z-D.z);
    if(sees){ c.mode="hold"; c.holdD= fromDoor>reach+1.0? 0.4 : 1.3; }
    else if(m.last){ c.mode="search"; c.target=b.toStage(new THREE.Vector3(m.last.x,0,m.last.z)); if(Math.hypot(hw.x-m.last.x,hw.z-m.last.z)<0.8) m.last=null; }
    else c.mode="idle";
    if(!sees||m.cool>0||player.grabbed||player.dead||hd>2.1) return;
    const r=rng(), M0=(c.mouthAt||c.M).clone(); c.M0=M0;
    const pick= r<0.3?"bait": r<0.68?"bite":"engulf"; b.play(pick,{anchor:"keep",reset:true,outSel:{oEngulf:"pending"}}); c.M0=M0; m.cool=C.attackCool; },
  events(e,list){ const C=CFG.splithead, b=e.pv, m=e.pvMem, hw=()=>shHeadW(b), near=r=>{ const h=hw(); return Math.hypot(h.x-player.pos.x,h.z-player.pos.z)<r; };
    for(const ev of list){ const k=ev.kind;
      if(k==="baitSnap"){ if(near(1.1)&&runnerHitNorah(e,C.baitDamage,"bait snap",1.6,0.4)){ shake=Math.max(shake,0.16); log(`${e.name}: the face is snatched up and the split snaps at her`,"#ff7070"); } }
      else if(k==="bite2"){ if(near(1.0)&&runnerHitNorah(e,C.biteDamage,"split bite",0.8,0)){ shake=Math.max(shake,0.2); log(`${e.name}'s split clamps on her shoulder`,"#ff7070"); } }
      else if(k==="engulf"){ if(near(0.9)&&!player.grabbed&&player.grab(e,{dmg:C.engulfDamage,how:"engulf"})){ shake=Math.max(shake,0.22); log(`${e.name}'s mouth closes over her head`,"#ff7070"); } else { b.ctx.out="free"; b.ctx.mash=1; } }
      else if(k==="engulfFree") log("Norah forces the jaws apart and ducks out","#9ed08a");
      else if(k==="engulfBite"){ player.bite(e,"bite",C.engulfBiteDamage); qteBanner(`BITTEN −${C.engulfBiteDamage}`,"bad"); } } },
  // the head darts out of the way of a shot (not while it's committed to an attack, nor inside the split)
  dodge(e,mesh){ const b=e.pv, u=mesh.userData, C=CFG.splithead; if(u.limb!=="head"||b.clipName!=="prowl"||(b.ctx.jawOpen||0)>0.5) return false;
    if(rng()<C.dodgeChance){ const s=rng()<0.5?-1:1; b.ctx.kick=new THREE.Vector3(0,0.1,0.6*s); log(`${e.name}: the head jerks aside · the shot goes past`,"#bfe0ff"); return true; } return false; },
  zoneMult(e,mesh){ const C=CFG.splithead, b=e.pv, u=mesh.userData;
    if(u.limb==="head") return (b.ctx.jawOpen||0)>0.5||b.clipName==="bite"||b.clipName==="engulf"? C.splitMult : C.headMult;
    if(u.limb==="neck") return C.headMult;
    return C.hp/C.bodyHp*(u.zone==="torso"?2:1); },
  hit(e,mesh){ const b=e.pv, m=e.pvMem, u=mesh.userData;
    if(u.limb==="head"&&((b.ctx.jawOpen||0)>0.5||b.clipName==="bite")&&!(player.grabbed&&player.grabbed.by===e)){ b.play("recoil",{anchor:"keep",reset:true}); log(`${e.name}: shot inside the split · it snaps shut and recoils`,"#ffb070"); }
    else if(u.limb!=="head"&&u.limb!=="neck"){ b.ctx.jolt=1; if(b.clipName==="prowl"){ m.backT=3; } log(`${e.name}: the body is hit · out in the other room the head shrieks`,"#ffb070"); } },
  die(e){ e.pv.play("die",{anchor:"keep",reset:true}); },
  freed(e){ const b=e.pv; b.ctx.out="free"; b.ctx.mash=1; },
  failed(e){ const b=e.pv; b.ctx.out="fail"; return true; } };
