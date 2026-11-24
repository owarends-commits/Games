// ================================================================ Blender trial: the two-armed Brute, finished in Blender
// Its approved walk and sweep were recorded from the playground, rigged and re-weighted in Blender (smoother bends at the stump
// joints; every separate piece blended into the surface it grows from) and exported as an ordinary skinned GLB with two clips.
// Here it is played the plain way, with three.js's animation mixer: no per-frame posing code, no balance physics.
const BT={url:"m/trial/brute_blender.json", walkSpeed:1.632, sweepHit:1.883, sweepLen:4.383, loading:null};
function btLoad(){ return BT.loading||(BT.loading=new Promise((res,rej)=>new THREE.GLTFLoader().load(BT.url,res,undefined,rej))); }
class BlenderBody{
  constructor(e,type){ this.e=e; this.type=type; this.K=PVK[type]; this.ready=false; this.hits=[]; this.ctx={wantV:0}; this.clipName=null; this.ct=0; this.yaw=e.yaw||0; this.pos=e.pos.clone();
    this.group=new THREE.Group(); scene.add(this.group);
    btLoad().then(g=>{ if(e.removed) return; const m=THREE.SkeletonUtils.clone(g.scene);
      m.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; const mp=o.material&&o.material.map; if(mp) mp.encoding=THREE.LinearEncoding; o.material=new THREE.MeshLambertMaterial({map:mp,skinning:!!o.isSkinnedMesh,side:THREE.DoubleSide}); } });
      this.model=m; this.group.add(m); this.mixer=new THREE.AnimationMixer(m); this.acts={}; for(const c of g.animations) this.acts[c.name]=this.mixer.clipAction(c);
      if(this.acts.sweep){ this.acts.sweep.setLoop(THREE.LoopOnce); this.acts.sweep.clampWhenFinished=true; }
      this.B={}; m.traverse(o=>{ if(o.isBone) this.B[o.name]=o; }); this.makeHits(); this.ready=true; this.sync(); if(this.K.start) this.K.start(e,this); })
      .catch(err=>log(`Blender Brute: model failed (${err&&err.message||err})`,"#ff7070")); }
  makeHits(){ const B=this.B, mat=new THREE.MeshBasicMaterial({color:0xff4040,transparent:true,opacity:0.3,depthWrite:false}); mat.visible=!!CFG.world.showZones;
    const add=(bn,child,r,zone,limb)=>{ const b=B[bn]; if(!b) return; let m; if(child&&B[child]){ const d=B[child].position.clone(), L=d.length()||0.2; m=new THREE.Mesh(new THREE.BoxGeometry(r*2,L,r*2),mat); m.position.copy(d).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()); } else m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),mat);
      b.add(m); m.userData={enemy:this.e,zone,limb,pv:true,hitbox:true}; this.hits.push(m); };
    add("torso",null,0.55,"torso","body"); add("head",null,0.16,"head","head");
    for(const s of ["L","R"]){ add("sh"+s,"ap"+s,0.16,"arm","stump"+s); add("ap"+s,"wr"+s,0.16,"arm","stump"+s); add("wr"+s,"ft"+s,0.16,"arm","stump"+s); add("leg"+s,"kn"+s,0.09,"leg","man"); } }
  holding(){ return false; }
  turnToward(h,rate,dt){ let d=h-this.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; this.yaw+=clamp(d,-rate*dt,rate*dt); }
  play(name){ const a=this.acts&&this.acts[name]; if(!a) return; const prev=this.clipName&&this.acts[this.clipName]; a.reset(); a.enabled=true; a.setEffectiveTimeScale(1); a.setEffectiveWeight(1); a.play(); if(prev&&prev!==a) a.crossFadeFrom(prev,0.25,false); this.clipName=name; this.ct=0; this.hitDone=false; }
  step(dt){ if(!this.ready||!(dt>0)) return []; const ev=[], e=this.e;
    if(e.dead){ this.dieT=(this.dieT||0)+dt; const u=Math.min(1,this.dieT/0.9); this.model.rotation.x=0; this.model.rotation.z=1.45*u*u; this.model.position.y=-0.6*u; if(this.acts.walk) this.acts.walk.timeScale=0; this.mixer.update(dt*0.3); return ev; }
    this.ct+=dt;
    if(this.clipName==="walk"){ const go=this.ctx.wantV>0; this.acts.walk.timeScale=go?1:0; if(go){ this.pos.x+=Math.sin(this.yaw)*BT.walkSpeed*dt; this.pos.z+=Math.cos(this.yaw)*BT.walkSpeed*dt; } }
    if(this.clipName==="sweep"&&!this.hitDone&&this.ct>=BT.sweepHit){ this.hitDone=true; ev.push({kind:"sweepHit"}); }
    this.mixer.update(dt); this.model.updateMatrixWorld(true); return ev; }
  sync(){ const e=this.e; collide(this.pos,e.radius*0.8); e.pos.set(this.pos.x,0,this.pos.z); e.yaw=this.yaw; this.group.position.set(this.pos.x,groundY(this.pos.x,this.pos.z),this.pos.z); this.group.rotation.y=this.yaw; this.group.updateMatrixWorld(true); }
  dispose(){ scene.remove(this.group); const i=PV_LIST.indexOf(this); if(i>=0) PV_LIST.splice(i,1); }
}
PVK.brute2_blender={ mod:{}, body:BlenderBody, label:"Brute (Blender)", cfg:"brute2", radius:0.75, clips:{walk:1,sweep:1},
  start(e,b){ e.pvMem.cool=1.2; b.play("walk"); },
  brain(e,dt,dist,toP){ const C=CFG.brute2, b=e.pv, m=e.pvMem; m.cool-=dt; bfBlock(e);
    if(b.clipName==="sweep"){ if(b.ct>BT.sweepLen-0.15){ b.play("walk"); m.cool=C.attackCool; } b.ctx.wantV=0; return; }
    const sees=!player.dead&&dist<C.sight&&lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false); let tx=null,tz=null;
    if(sees){ m.last={x:player.pos.x,z:player.pos.z}; const g=e.goal(dt); tx=g.x; tz=g.z; } else if(m.last&&Math.hypot(m.last.x-e.pos.x,m.last.z-e.pos.z)>1){ const g=pvRouteTo(e,m.last.x,m.last.z); tx=g.x; tz=g.z; }
    if(tx!=null){ b.turnToward(Math.atan2(tx-e.pos.x,tz-e.pos.z),0.9,dt); b.ctx.wantV=sees&&dist<2.2?0:1; } else b.ctx.wantV=0;
    if(sees&&m.cool<=0&&dist<2.7&&e.facing(toP)>0.9&&!player.grabbed){ b.play("sweep"); m.cool=99; } },
  events(e,list){ for(const ev of list) if(ev.kind==="sweepHit"){ const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z), toP=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z).normalize();
      if(d<2.7&&e.facing(toP)>0.2&&runnerHitNorah(e,28,"sweeping swing",4,1.2)){ shake=Math.max(shake,0.3); log(`${e.name}'s stump sweeps her off her feet`,"#ff7070"); } } },
  die(e){ /* tips over in its step */ } };
if(typeof SIM_KINDS!=="undefined") SIM_KINDS.splice(SIM_KINDS.findIndex(k=>k[0]==="brute2")+1,0,["brute2_blender","Two-armed Brute · Blender trial"]);
