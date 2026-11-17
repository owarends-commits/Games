// ---------------------------------------------------------------- ACROSS: swarm tells, the crowd, the Walker's mob
const SWARM={lastTell:-9};
function tellOk(){ return gameTime-SWARM.lastTell>=CFG.across.tellGap; }
function markTell(){ SWARM.lastTell=gameTime; }
// the newest thing any hunting ACROSS knows about where Norah is
function crowdNote(x,z,src){ if(!world.crowd||gameTime>=world.crowd.t) world.crowd={x,z,t:gameTime,src}; }
// where a Walker that has lost her should go: the crowd's point (sight, noise, or a fresh blood drop it finds), while it's still fresh
function walkerCrowd(e){
  const tr=world.trail; for(let i=tr.length-1;i>=0;i--){ const q=tr[i]; if(world.crowd&&q.t<=world.crowd.t) break; if(Math.hypot(q.x-e.pos.x,q.z-e.pos.z)<8){ crowdNote(q.x,q.z,"blood"); break; } }
  const C=world.crowd; return C && gameTime-C.t<CFG.stealth.searchTime ? C : null;
}
// lost Walkers drift together as a mob on their way to the crowd's point
function walkerMob(e, want){
  const A=CFG.across; let sx=0, sz=0, n=0;
  for(const o of enemies){ if(o===e||o.dead||o.variant!=="walker") continue; const d=Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z); if(d<A.walkerMobRange){ sx+=o.pos.x; sz+=o.pos.z; n++; } }
  if(!n) return want; sx/=n; sz/=n; if(Math.hypot(sx-e.pos.x,sz-e.pos.z)<1.5) return want;
  return want+wrapA(Math.atan2(sx-e.pos.x,sz-e.pos.z)-want)*A.walkerMob;
}

// ---------------------------------------------------------------- the Crawler: cover to cover, hold, ambush; flee in the open; retreat when hurt
function coverSpots(){
  if(world.coverSpots) return world.coverSpots; const A=CFG.across, out=[];
  for(const b of world.boxes) if(b.under) out.push({kind:"under",box:b,get x(){ return this.box.x; },get z(){ return this.box.z; }});
  const B=world.bounds;
  for(let x=B.x0+1;x<B.x1-0.5;x+=2) for(let z=B.z0+1;z<B.z1-0.5;z+=2){ if(lightAt(x,z)>=A.crawlerDark) continue; const p=new THREE.Vector3(x,0,z); if(collide(p,0.4)) continue; out.push({kind:"dark",x,z}); }
  return world.coverSpots=out;
}
function seenByNorah(e){
  const dx=e.pos.x-player.pos.x, dz=e.pos.z-player.pos.z, d=Math.hypot(dx,dz); if(d>10||player.dead) return false;
  const face=isFixed()?player.yaw:camYaw; if(Math.abs(wrapA(Math.atan2(dx,dz)-face))>35*D2R) return false;
  return lineOfSight(player.pos.x,player.pos.z,e.pos.x,e.pos.z,true);
}
const crPick2=(a,b)=>a+Math.random()*Math.max(0,b-a);
// can it crawl straight there? (windows count as walls, unlike wallsClear)
function walkClear(ax,az,bx,bz){ for(const s of world.segs) if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; for(const d of world.doors){ if(d.broken||d.ang>0.6) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; } return true; }
Enemy.prototype.crStill=function(){ this.desired={x:0,z:0}; this.gait.mode="stall"; };
Enemy.prototype.crMove=function(s,speed,dt){ const S=this.S, f=this.speedNow()/Math.max(0.05,S.speed*S.crawlerSpeed); this.gait.mode="burst"; this.gait.mul=1; this.moveTo(s.x,s.z,speed*f,dt,false); };
Enemy.prototype.crArrived=function(s){ return s && Math.hypot(s.x-this.pos.x,s.z-this.pos.z)<0.7; };
Enemy.prototype.crPick=function(kind,tgt,spots,wp){
  const A=CFG.across, me=this.pos, taken=new Set(enemies.filter(o=>o!==this&&o.cr&&o.cr.spot).map(o=>o.cr.spot)); let best=null, bs=1e9;
  for(const s of spots){ if(taken.has(s)||s===this.cr.spot) continue; const dMe=Math.hypot(s.x-me.x,s.z-me.z), dT=Math.hypot(s.x-tgt.x,s.z-tgt.z), dN=Math.hypot(s.x-player.pos.x,s.z-player.pos.z);
    if(!walkClear(me.x,me.z,s.x,s.z) && !(wp && !wp.direct && walkClear(wp.x,wp.z,s.x,s.z))) continue;   // same room, or the next room on the way
    let score;
    if(kind==="advance"){ const myT=Math.hypot(me.x-tgt.x,me.z-tgt.z); if(dT>myT-1||dMe>12||dN<1.6) continue;
      if(this.cr.avoidA!=null && Math.abs(wrapA(Math.atan2(s.x-tgt.x,s.z-tgt.z)-this.cr.avoidA))<A.crawlerNewSide*D2R) continue;
      score=dMe+(dT<=A.crawlerHold?-1.5:0)+(s.kind==="dark"?0.6:0); }   // the nearest hop that gets it closer; a spot within holding range is worth a little more
    else if(kind==="flee"){ if(dN<2.5||dMe>10) continue;
      const ux=s.x-me.x, uz=s.z-me.z, L2=ux*ux+uz*uz||1, u=clamp(((player.pos.x-me.x)*ux+(player.pos.z-me.z)*uz)/L2,0,1); if(Math.hypot(me.x+ux*u-player.pos.x,me.z+uz*u-player.pos.z)<1.2) continue;
      score=dMe; }
    else { if(dN<5||dMe>14) continue; score=dMe-0.5*dN; }
    if(score<bs){ bs=score; best=s; } }
  return best;
};
Enemy.prototype.crawlerHurt=function(dir){
  const A=CFG.across, cr=this.cr||(this.cr={mode:"advance"});
  cr.mode="retreat"; cr.spot=null; cr.playDead=false; cr.hide=crPick2(A.crawlerRetreatMin,A.crawlerRetreatMax); cr.avoidA=Math.atan2(this.pos.x-player.pos.x,this.pos.z-player.pos.z);
  this.attackLog(`${this.name} is hurt and scuttles off to hide`);
};
Enemy.prototype.crawlerBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, cr=this.cr||(this.cr={mode:"advance",spot:null,pause:0}), pp=player.pos;
  const see=this.sees||dist<1.4; if(see) crowdNote(pp.x,pp.z,"sight");
  const tgt=see?{x:pp.x,z:pp.z}:(world.crowd||this.lastKnown||{x:pp.x,z:pp.z}), spots=coverSpots();
  const atCover=cr.playDead||this.crArrived(cr.spot);
  // the ambush: from hiding, near-instant ankle grab as she passes
  if(atCover && cr.mode!=="flee" && cr.mode!=="retreat" && dist<A.crawlerAmbush && (!player.grabbed||canJoinGrab(this)) && !player.dead && this.armsLeft()>0 && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true) && tellOk()){
    markTell(); cr.playDead=false; cr.mode="hold"; this.grabKind="ankle"; this.state="grab"; this.hitDone=false; this.grabReach=2.2; this.t=Math.max(0,0.3-A.crawlerAmbushTell); SFX.scratch(this.pos);
    this.attackLog(`${this.name} springs from hiding (Norah at ${dist.toFixed(2)} m)`); return; }
  // caught in the open: flee to cover, or fight if she's on top of it
  if(!atCover && cr.mode!=="flee" && cr.mode!=="retreat" && seenByNorah(this)){
    const c=this.crPick("flee",tgt,spots);
    if(dist<A.crawlerCornered||!c){ if(this.swCool<=0&&this.armsLeft()>0&&dist<S.swipeRange+0.3&&tellOk()){ markTell(); this.startSwipe(false); return; } this.turnTo(want,dt,A.turn); if(c){ cr.mode="flee"; cr.spot=c; cr.burst=1.3; } else this.crStill(); return; }
    cr.mode="flee"; cr.spot=c; cr.burst=1.3; this.attackLog(`${this.name} is caught in the open and scuttles for cover`); }
  if(cr.mode==="flee"){
    if(dist<A.crawlerCornered && this.swCool<=0 && this.armsLeft()>0 && tellOk()){ markTell(); this.startSwipe(false); return; }
    if(!cr.spot||this.crArrived(cr.spot)){ cr.mode="advance"; cr.arrivedAt=cr.spot; cr.pause=crPick2(A.crawlerPauseMin,A.crawlerPauseMax); this.crStill(); return; }
    cr.burst-=dt; if(cr.burst<=0) cr.burst=1.3; if(cr.burst>0.3) this.crMove(cr.spot,A.crawlerFlee,dt); else this.crStill(); return; }
  if(cr.mode==="retreat"){
    if(!cr.spot) cr.spot=this.crPick("retreat",tgt,spots)||this.crPick("flee",tgt,spots);
    if(cr.spot && !this.crArrived(cr.spot)){ this.crMove(cr.spot,A.crawlerFlee*0.8,dt); return; }
    this.crStill(); cr.hide-=dt; if(cr.hide<=0){ cr.mode="advance"; cr.arrivedAt=cr.spot; } return; }
  if(cr.mode==="hold"){
    this.crStill(); this.turnTo(want,dt,60); const s=cr.spot||this.pos;
    if(Math.hypot(tgt.x-s.x,tgt.z-s.z)>A.crawlerHold+4){ cr.mode="advance"; cr.playDead=false; cr.arrivedAt=cr.spot; } return; }
  // advance: cover to cover toward her, pausing at each, until close enough to hold
  if(cr.pause>0){ cr.pause-=dt; this.crStill(); return; }
  if(cr.spot && this.crArrived(cr.spot)){
    if(cr.arrivedAt!==cr.spot){ cr.arrivedAt=cr.spot; cr.pause=crPick2(A.crawlerPauseMin,A.crawlerPauseMax); if(cr.deadSpot){ cr.playDead=true; cr.mode="hold"; cr.deadSpot=false; } this.crStill(); return; }
    if(Math.hypot(tgt.x-cr.spot.x,tgt.z-cr.spot.z)<=A.crawlerHold){ cr.mode="hold"; cr.avoidA=null; this.crStill(); return; } }
  if(!cr.spot || this.crArrived(cr.spot)){
    const wp=route(this.pos.x,this.pos.z,tgt.x,tgt.z), n=this.crPick("advance",tgt,spots,wp);
    if(n){ cr.spot=n; }
    else if(!wp.direct || !walkClear(this.pos.x,this.pos.z,tgt.x,tgt.z)){ cr.spot={x:wp.x,z:wp.z,kind:"door"}; cr.arrivedAt=cr.spot; }   // through the doorway toward her, then find cover there
    else if(Math.hypot(tgt.x-this.pos.x,tgt.z-this.pos.z)<=A.crawlerHold && cr.spot){ cr.mode="hold"; this.crStill(); return; }
    else { // no cover between it and her: the darkest spot nearby in the same room, closer to her, and play dead there
      const myT=Math.hypot(tgt.x-this.pos.x,tgt.z-this.pos.z); let best=null, bl=9;
      for(let i=0;i<20;i++){ const p=this.randomPoint(this.pos.x,this.pos.z,8); if(!walkClear(this.pos.x,this.pos.z,p.x,p.z)) continue; const dT=Math.hypot(tgt.x-p.x,tgt.z-p.z); if(dT>myT||dT<1.6) continue; const l=lightAt(p.x,p.z); if(l<bl){ bl=l; best=p; } }
      if(!best && myT>A.crawlerHold){ const k=(myT-A.crawlerHold+0.5)/myT; best={x:this.pos.x+(tgt.x-this.pos.x)*k,z:this.pos.z+(tgt.z-this.pos.z)*k}; }   // nothing darker on the way: creep into holding range first
      cr.spot=best||{x:this.pos.x,z:this.pos.z}; cr.deadSpot=true; cr.arrivedAt=null; } }
  this.crMove(cr.spot,A.crawlerSpeed,dt);
};

// ---------------------------------------------------------------- the second grab: while she's held, one more ACROSS can join in
function canJoinGrab(e){ const g=player.grabbed; return !!g && g.by!==e && g.by.kind!=="brute" && e.kind!=="brute" && !(g.extra&&g.extra.length); }
function joinGrab(by,o){
  if(!canJoinGrab(by)) return false; const g=player.grabbed, A=CFG.across, q=g.qte; g.extra=[by]; by.joinDmg=o.dmg||A.grabDamage;
  if(q&&q.mode==="mash"){ q.fill=Math.max(0,q.fill-A.joinDrain); q.wrong=0.3; }
  else if(q){ for(let i=0;i<A.joinKeys;i++){ let k; do{ k=QTE_KEYS[Math.floor(Math.random()*QTE_KEYS.length)]; }while(q.seq.length&&k===q.seq[q.seq.length-1]&&QTE_KEYS.length>1); q.seq.push(k); } q.t=q.win; }
  SFX.scratch(by.pos); shake=Math.max(shake,0.25); log(`${by.name} grabs her too`,"#ff7070"); if(run) run.grabs++; return true;
}
function joinedRelease(g, bite){
  for(const x of g.extra||[]){ if(x.dead) continue; if(bite) player.bite(x,"bite",x.joinDmg||CFG.across.grabDamage); x.state="recover"; x.t=0; x.cool=1.5; x.swCool=1.0; if(!bite){ x.stagger=0.6; x.state="stagger"; x.flinch=1; } }
  g.extra=[];
}

// ---------------------------------------------------------------- the Matron: steady, hugs, shoves, batters doors, guards the spot
Enemy.prototype.matronBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, G=this.gait, pp=player.pos, see=this.sees||dist<1.4, f=this.speedNow()/Math.max(0.1,S.speed);
  this.mc=this.mc||{hug:1,shove:1,bat:0}; for(const k of ["hug","shove","bat"]) this.mc[k]-=dt;
  G.mode="shamble"; G.near=false; G.mul=1;
  if(see) crowdNote(pp.x,pp.z,"sight");
  const clear=see && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  if(clear && !player.dead){
    if(dist<A.matronShoveRange && this.mc.shove<=0 && this.armsLeft()===2 && !player.grabbed && tellOk()){ markTell(); this.state="mshove"; this.t=0; this.hitDone=false; this.mc.shove=A.matronShoveCool; SFX.grunt(this.pos,A.matronShoveTell); this.attackLog(`${this.name} braces to shove`); return; }
    if(dist<A.matronHugRange && this.mc.hug<=0 && this.armsLeft()===2 && (!player.grabbed||canJoinGrab(this)) && tellOk()){ markTell(); this.grabKind="hug"; this.state="grab"; this.hitDone=false; this.grabReach=A.matronHugRange+0.2; this.t=0.3-A.matronHugTell; this.mc.hug=A.matronHugCool; SFX.scratch(this.pos); this.attackLog(`${this.name} opens her arms`); return; }
    if(dist<S.swipeRange && this.swCool<=0 && this.armsLeft()>0 && !player.grabbed && tellOk()){ markTell(); this.startSwipe(false); return; }
  }
  // a door between her and where Norah is: batter it down
  const door=this.findDoor(dist);
  if(door){ this.turnTo(Math.atan2(door.mx-this.pos.x,door.mz-this.pos.z),dt,A.turn); this.desired={x:0,z:0}; G.mode="stall";
    if(this.mc.bat<=0){ this.mc.bat=A.matronBatterRate; hitDoor(door.d,A.matronDoorDamage,this); SFX.doorHit(new THREE.Vector3(door.mx,1,door.mz)); makeNoise(door.mx,door.mz,8,"battering",true,undefined,undefined,this); } return; }
  // lost her: go to where she was last seen and guard it
  if(!see && this.lastKnown && Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)<0.9){
    this.desired={x:0,z:0}; G.mode="stall"; this.guardT=(this.guardT||0)+dt; this.turnTo(this.yaw+Math.sin(this.guardT*0.7)*0.9,dt,35); return; }
  this.guardT=0;
  const g=this.goal(dt); this.steer(dt, Math.atan2(g.x-this.pos.x,g.z-this.pos.z), A.matronSpeed*f, A.turn*0.6);
};
Enemy.prototype.matronShove=function(dt,dist,want){
  const A=CFG.across; this.turnTo(want,dt,A.turn*0.6);
  if(!this.hitDone && this.t>=A.matronShoveTell){ this.hitDone=true; this.hitFlash=0.2; const ok=dist<A.matronShoveRange+0.35 && this.facing(new THREE.Vector3(player.pos.x-this.pos.x,0,player.pos.z-this.pos.z).normalize())>0.4;
    this.attackLog(`${this.name} shove: Norah ${dist.toFixed(2)} m → ${ok?"DOWN":"miss"}`); if(ok){ knockNorah(A.matronShoveDamage,this,"shove",A.matronShoveDown); SFX.shove(); } }
  if(this.t>=A.matronShoveTell+0.35){ this.state="chase"; this.t=0; }
};

// ---------------------------------------------------------------- the Mourner: kneels over a body; disturbed, it wails, and every hit makes it worse
function mStage(s){ return Math.max(1,Math.min(3,s||1)); }
Enemy.prototype.mournerWatch=function(dt,dist){
  const A=CFG.across, pp=player.pos; this.sees=false; if(player.dead) return;
  const los=()=>lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true);
  if(dist<A.mournerNear*(player.crouch?A.mournerCrouch:1) && los()){ this.mournerWake("feels her come too close"); return; }
  const F=player.flash; let lit=false;
  if(F && F.on && F.charge>0 && dist<A.mournerLightRange){ const yaw=isFixed()?player.yaw:camYaw, a=Math.abs(wrapA(Math.atan2(this.pos.x-pp.x,this.pos.z-pp.z)-yaw)); lit = a<A.mournerLightCone*Math.PI/360 && los(); }
  this.lightT = lit ? (this.lightT||0)+dt : Math.max(0,(this.lightT||0)-dt*0.5);
  if(this.lightT>=A.mournerLight) this.mournerWake("lifts its head into the light");
};
Enemy.prototype.mournerWake=function(why){
  this.mstage=Math.max(this.mstage||0,1); this.lightT=0; this.state="chase"; this.t=0;
  this.mc={wail:0, scream:0.6, cling:0.6}; this.alert(why,true); };
Enemy.prototype.mournerHurt=function(){
  const st=Math.min(3,Math.max(1,this.mstage||0)+1), up=st>(this.mstage||0); this.mstage=st;
  this.mc=this.mc||{wail:0,scream:0.6,cling:0.6}; this.mc.wail=0; this.mlg=null;
  if(up) log(`${this.name} ${st===2?"rises, wailing louder":"breaks into a frenzy"} (stage ${st})`,"#ffb070"); };
Enemy.prototype.mournerCalm=function(){
  const I=this.idle; this.aware="unaware"; this.awareness=0; this.mstage=0; this.lightT=0; this.state="chase"; this.mlg=null; this.mwT=0;
  I.base="feed"; I.kind="return"; I.tx=null; log(`${this.name} goes back to the body and quiets`,"#9ed08a"); };
Enemy.prototype.mournerWail=function(){
  const A=CFG.across, st=mStage(this.mstage), r=A["mournerCall"+st], pp=player.pos; let n=0;
  for(const e of enemies){ if(e===this||e.dead||e.kind!=="across"||e.variant==="mourner") continue; if(r<99 && Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z)>r) continue;
    e.lastKnown={x:pp.x,z:pp.z}; e.disguised=false; if(e.aware!=="hunting") e.alert("answers the wail",false); else e.lostT=0; n++; }
  crowdNote(pp.x,pp.z,"noise"); this.mwT=0.9; SFX.wail(this.pos); if(st>=3) SFX.shriek(this.pos);
  log(`${this.name} wails${st>=3?" across the whole map":` (${r} m)`}: ${n} answer`,"#ffb070"); };
Enemy.prototype.mournerScream=function(dt,dist,want){
  const A=CFG.across, st=mStage(this.mstage); this.turnTo(want,dt,A.turn);
  if(!this.hitDone && this.t>=A.mournerScreamTell){ this.hitDone=true; this.hitFlash=0.2; SFX.shriek(this.pos); SFX.wail(this.pos);
    const ok=dist<A.mournerScreamRange+0.5 && lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,true) && !player.dead;
    this.attackLog(`${this.name} scream: Norah ${dist.toFixed(2)} m → ${ok?"STUNNED":"miss"}`);
    if(ok){ const k=A["mournerStun"+st]; player.stumble=Math.max(player.stumble,k); player.aiming=false; player.dazed=Math.max(player.dazed,k*2); shake=Math.max(shake,0.5); log(`${this.name} screams in her face: stunned ${k.toFixed(1)} s`,"#ff7070"); } }
  if(this.t>=A.mournerScreamTell+0.45){ this.state="chase"; this.t=0; } };
Enemy.prototype.mournerBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, G=this.gait, pp=player.pos, st=mStage(this.mstage), see=this.sees||dist<1.4, f=this.speedNow()/Math.max(0.1,S.speed);
  this.mstage=st; this.mc=this.mc||{wail:0,scream:0.6,cling:0.6}; for(const k of ["wail","scream","cling"]) this.mc[k]-=dt; this.mwT=Math.max(0,(this.mwT||0)-dt);
  G.near=false; G.mul=1; if(see) crowdNote(pp.x,pp.z,"sight");
  if(this.mc.wail<=0){ this.mc.wail=A["mournerWailGap"+st]; this.mournerWail(); }
  const clear=see && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  if(clear && !player.dead){
    if(dist<A.mournerClingRange && this.mc.cling<=0 && this.armsLeft()>0 && (!player.grabbed||canJoinGrab(this)) && tellOk()){ markTell(); this.grabKind="cling"; this.state="grab"; this.hitDone=false; this.grabReach=A.mournerClingRange+0.2; this.t=0.3-A.mournerClingTell; this.mc.cling=A.mournerClingCool; this.mc.wail=A.mournerClingTell+A.mournerClingWail; SFX.scratch(this.pos); this.attackLog(`${this.name} reaches to cling`); return; }
    if(dist<A.mournerScreamRange && this.mc.scream<=0 && !player.grabbed && player.stumble<=0 && tellOk()){ markTell(); this.state="mscream"; this.t=0; this.hitDone=false; this.mc.scream=A.mournerScreamCool; this.attackLog(`${this.name} draws breath`); return; }
    if(st>=2 && dist<S.swipeRange && this.swCool<=0 && this.armsLeft()>0 && !player.grabbed && tellOk()){ markTell(); this.startSwipe(false); return; }
  }
  if(st===1){ G.mode="stall"; this.desired={x:0,z:0}; this.turnTo(want,dt,A.turn*0.5); return; }
  const g=this.goal(dt), head=Math.atan2(g.x-this.pos.x,g.z-this.pos.z);
  if(st===2){ const L=this.mlg||(this.mlg={on:false,t:0.2}); L.t-=dt; if(L.t<=0){ L.on=!L.on; L.t=L.on?A.mournerLungeTime:A.mournerLungePause; }
    if(L.on){ G.mode="burst"; this.steer(dt,head,A.mournerLunge*f,A.turn*0.8); } else { G.mode="stall"; this.desired={x:0,z:0}; this.turnTo(head,dt,A.turn*0.6); } return; }
  G.mode="burst"; this.steer(dt,head,A.mournerSprint*f,A.turn*1.2);
};
