// ================================================================ preview bodies: creatures run by their preview's own code
// The Contortionist, the Reachers and the split-head Reacher were designed in their own preview pages. Rather than re-make
// them here, each page's engine and creature code is wrapped up whole (a PV_* module) and a playground enemy drives it:
// the AI picks what it does, the preview code poses it exactly as approved. Each body poses in its own "stage" (the
// preview's world, where the target stands on +x), and the stage is set in the real world facing her. Her body is handed
// in as a stand-in, so a clip's reach and hit tests run against where she really is.
const PVK={};   /* per type: {mod, label, pool, cfg, start(e), brain(e,dt,dist,toP), events(e,list), freed(e), failed(e), clips} */
const PV_LIST=[];   /* bodies alive, for the once-a-frame module effects */
function pvModel(type){ const k=PVK[type]; const pool=Object.keys(MODEL_LIB).filter(m=>MODEL_LIB[m].g===k.group&&(!k.only||k.only(m))); return pool[Math.floor(rng()*pool.length)]; }
class PVBody{
  constructor(e,type,key){ this.e=e; this.type=type; this.K=PVK[type]; this.mod=this.K.mod; this.key=key; this.stage=new THREE.Group(); scene.add(this.stage);
    this.M=new THREE.Matrix4(); this.Mi=new THREE.Matrix4(); this.a=0; this.ctx={events:[],x:0,z:0,yaw:Math.PI/2,v:0,live:true,T:{}}; this.t=0; this.ct=0; this.C=null; this.ready=false; this.hits=[];
    this.norah=this.makeNorah(); this.clip=null; this.clipName=null;
    mdlLoad(key).then(g=>{ if(e.removed) return; this.withStage(()=>{ this.mod.pvBind(this.rec()); if(this.mod.pvPrep) this.mod.pvPrep(g,this); this.C=this.mod.makeChar(g); if(this.mod.pvPost) this.mod.pvPost(this.C,this); this.mod.pvSetup(this.C); }); this.makeHits(); this.ready=true; if(this.K.start) this.K.start(e,this); })
      .catch(err=>{ log(`${e.name}: model failed (${err&&err.message||err})`,"#ff7070"); }); }
  // the stage: world = M · stage. Posing runs with the stage at the origin, so its world is the preview's world
  anchor(worldPos,worldDir,stageX=0,stageZ=0){ const a=Math.atan2(-worldDir.z,worldDir.x)+Math.PI/2, M0=this.M.clone(); this.a=a; const R=new THREE.Matrix4().makeRotationY(a-Math.PI/2);
    const off=new THREE.Vector3(stageX,0,stageZ).applyMatrix4(R); this.M.copy(R).setPosition(worldPos.x-off.x,0,worldPos.z-off.z); this.Mi.copy(this.M).invert();
    // what it left lying in the world (a cut-off arm, blood, dust) stays where it is when the stage moves
    if(this.C){ const T=this.Mi.clone().multiply(M0); for(const o of this.stage.children){ if(o===this.C.group||o===this.C.shadow) continue; o.applyMatrix4(T); } }
    this.place(); }
  place(){ this.stage.position.setFromMatrixPosition(this.M); this.stage.quaternion.setFromRotationMatrix(this.M); this.stage.updateMatrixWorld(true); }
  withStage(fn){ const s=this.stage; s.position.set(0,0,0); s.quaternion.identity(); s.updateMatrixWorld(true); try{ return fn(); } finally { this.place(); } }
  toStage(v){ return v.clone().applyMatrix4(this.Mi); } toWorld(v){ return v.clone().applyMatrix4(this.M); }
  stageYaw(worldYaw){ return worldYaw-(this.a-Math.PI/2); } worldYaw(stageYaw){ return stageYaw+(this.a-Math.PI/2); }
  // her, as the preview code sees her: bones in stage coordinates
  makeNorah(){ const self=this, B={}, names=["hips","chest","neck","head","upperarm_L","upperarm_R","forearm_L","forearm_R","hand_L","hand_R","thigh_L","thigh_R","shin_L","shin_R","foot_L","foot_R"];
    const live=n=>{ const sk=player.skin&&player.skin.B; if(sk&&sk[n]) return sk[n].getWorldPosition(new THREE.Vector3());
      const P=player.P, f={hips:P.hips,chest:P.torso||P.chest,neck:P.neck,head:P.head||P.headMesh}; const o=f[n]||P[n]; if(o&&o.getWorldPosition) return o.getWorldPosition(new THREE.Vector3());
      const y={head:1.55,neck:1.42,chest:1.25,hips:0.95}[n]??(n.startsWith("foot")?0.08:n.startsWith("shin")?0.45:n.startsWith("thigh")?0.88:1.2); return new THREE.Vector3(player.pos.x,y+groundY(player.pos.x,player.pos.z),player.pos.z); };
    for(const n of names) B[n]={ getWorldPosition(v){ return v.copy(self.toStage(live(n))); }, getWorldQuaternion(q){ return q.identity(); } };
    return { c:{B, R:{hip0:0.95}, group:{ get position(){ return self.toStage(player.pos); }, visible:true }, shadow:{visible:true}}, get x(){ return self.toStage(player.pos).x; }, kb:0, fall:0 }; }
  // shots land on what you see: invisible boxes along its bones
  makeHits(){ const C=this.C, B=C.B, mat=new THREE.MeshBasicMaterial({color:0xff4040,transparent:true,opacity:0.3,depthWrite:false}); mat.visible=!!CFG.world.showZones;
    const seg=(bn,child,r,zone,limb)=>{ const b=B[bn], c=child&&B[child]; if(!b) return; const d=c? c.position.clone() : new THREE.Vector3(0,0.2,0), L=d.length()||0.2;
      const m=new THREE.Mesh(new THREE.BoxGeometry(r*2,L,r*2),mat); m.position.copy(d).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()); b.add(m);
      m.userData={enemy:this.e,zone,limb,pv:true,hitbox:true}; this.hits.push(m); };
    if(!(this.K.noHeadHit&&this.K.noHeadHit(this))){ const hb=new THREE.Mesh(new THREE.SphereGeometry(0.13,8,6),mat); hb.position.set(0,0.1,0); B.head.add(hb); hb.userData={enemy:this.e,zone:"head",pv:true,hitbox:true}; this.hits.push(hb); }
    seg("chest","neck",0.17,"torso"); seg("hips","chest",0.16,"torso");
    for(const s of ["L","R"]){ if(!(this.K.noArmHits&&this.K.noArmHits(this))){ seg("upperarm_"+s,"forearm_"+s,0.06,"arm","arm"+s); seg("forearm_"+s,"hand_"+s,0.055,"arm","arm"+s); } seg("thigh_"+s,"shin_"+s,0.08,"leg","leg"+s); seg("shin_"+s,"foot_"+s,0.065,"leg","leg"+s); }
    if(this.K.hits) this.K.hits(this,seg,mat); }
  // play a clip. anchor: "face" (stage +x toward her from where it stands now), "keep" (same stage)
  holding(){ return (this.K.holds||["wrap","coil","snatch","engulf","grab","throne","oneHand"]).includes(this.clipName); }
  play(name,o={}){ const clip=this.K.clips[name]; if(!clip){ log(`no clip ${name}`,"#ff7070"); return; }
    const e=this.e, prev=this.ctx, here=new THREE.Vector3(e.pos.x,0,e.pos.z);
    if(o.anchor!=="keep"){ const to=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z); if(to.lengthSq()<1e-4) to.set(Math.sin(e.yaw),0,Math.cos(e.yaw)); to.normalize();
      const dir=o.dir||to; this.ctx={events:[],x:0,z:0,yaw:Math.PI/2,v:0,live:true,T:{},outSel:o.outSel||{}}; this.clip=clip; this.clipName=name; this.ct=0; this.t=0;
      this.withStage(()=>{ this.mod.pvBind(this.rec()); clip.start(this.ctx); });
      this.anchor(here,dir,this.ctx.x,this.ctx.z||0); }
    else { this.clip=clip; this.clipName=name; this.ct=0; if(o.reset) this.t=0; if(o.outSel) this.ctx.outSel=o.outSel; if(clip.start) this.withStage(()=>{ this.mod.pvBind(this.rec()); clip.start(this.ctx); }); }
    this.ctx.live=true; this.ctx.clipT0=this.t; e.pvClipT=0; }
  rec(){ return {C:this.C, ctx:this.ctx, t:this.t, stage:this.stage, norah:this.norah, clip:this.clip, mir:this.mir, nx:this.nx}; }
  step(dt){ if(!this.ready||!this.clip) return []; const h=this.rec();
    // where she is, along the stage's line: the preview's "NX"
    h.nx=this.toStage(player.pos).x; this.nx=h.nx;
    const ev=this.withStage(()=>this.mod.pvStep(h,dt)); this.t=h.t; this.ct+=dt; this.e.pvClipT=this.ct; return ev||[]; }
  // its feet on the map: walls stop it, and the stage follows
  sync(){ const e=this.e, c=this.ctx, w=this.toWorld(new THREE.Vector3(c.x,0,c.z||0)); const p=w.clone(); collide(p,e.radius*0.8);
    if(p.distanceToSquared(w)>1e-8){ const s=this.toStage(p); c.x=s.x; c.z=s.z; }
    e.pos.set(p.x,0,p.z); e.yaw=this.worldYaw(c.yaw); }
  dispose(){ scene.remove(this.stage); const i=PV_LIST.indexOf(this); if(i>=0) PV_LIST.splice(i,1); }
}
function pvFxAll(dt){ for(const k in PVK){ const m=PVK[k].mod; if(m&&m.pvFx){ const s=m.pvFx(dt); if(s) shake=Math.max(shake,s*0.6); } } }
// the stage-yaw of a world direction, for steering
function pvWantYaw(b,toX,toZ){ return b.stageYaw(Math.atan2(toX,toZ)); }

// ---------------------------------------------------------------- the enemy side
Enemy.prototype.pvInit=function(type){ const K=PVK[type]; this.kind="pv"; this.pvType=type; this.name=`${K.label} ${this.id}`;
  this.root.traverse(o=>{ if(o.isMesh){ o.visible=false; o.userData.enemy=null; } }); if(this.skin&&this.skin.model) this.skin.model.visible=false;
  const key=pvModel(type); this.mdl=key; this.pv=new PVBody(this,type,key); PV_LIST.push(this.pv);
  const C=CFG[K.cfg]; this.maxHp=this.hp=C.hp; this.radius=K.radius||0.35; this.state="pv"; this.pvMem={}; };
Enemy.prototype.pvUpdate=function(dt){ const b=this.pv, K=PVK[this.pvType];
  if(!b.ready){ this.syncRoot&&this.syncRoot(); return; }
  if(this.dead){ this.deadT+=dt; if(this.deadT<4){ b.step(dt); b.sync(); } return; }
  const toP=new THREE.Vector3(player.pos.x-this.pos.x,0,player.pos.z-this.pos.z), dist=toP.length(); toP.normalize();
  this.flinch=Math.max(0,this.flinch-dt*4);
  if(!CFG.world.freezeAI) K.brain(this,dt,dist,toP);
  const ev=b.step(dt); b.sync(); if(ev.length&&K.events) K.events(this,ev);
  this.root.position.set(this.pos.x,groundY(this.pos.x,this.pos.z),this.pos.z); this.root.rotation.set(0,this.yaw,0); };
Enemy.prototype.pvHit=function(mesh,point,dir){ const z=mesh.userData.zone, ZC=CFG.zones, K=PVK[this.pvType], C=CFG[K.cfg];
  if(K.dodge&&K.dodge(this,mesh,point,dir)) return;
  const mult=(K.zoneMult&&K.zoneMult(this,mesh))??ZC[z+"Mult"]??1, dmg=CFG.rev.damage*mult; this.hp-=dmg; if(run){ run.hits++; if(z==="head") run.head++; }
  spray(point,dir); SFX.flesh(point); this.flinch=1; this.lastZone=z;
  if(K.hit) K.hit(this,mesh,point,dir,dmg);
  log(`Hit → ${this.name}: ${z}${mesh.userData.limb?" ("+mesh.userData.limb+")":""} −${dmg.toFixed(1)} (${Math.max(0,this.hp).toFixed(1)}/${this.maxHp})`,{head:"#ff8a7a",torso:"#e8c77a",arm:"#8ac8f0",leg:"#9ee08a"}[z]||"#e8c77a");
  if(this.hp<=0&&!this.dead) this.pvDie(dir); };
Enemy.prototype.pvDie=function(dir){ this.dead=true; this.deadT=0; const K=PVK[this.pvType];
  if(player.grabbed&&player.grabbed.by===this){ player.grabbed=null; qteBanner("FREE","ok"); }
  for(const m of this.pv.hits) m.userData.enemy=null; if(K.die) K.die(this,dir); else this.pv.play("die",{anchor:"keep"});
  bloodPool(this.pos.x+dir.x*0.4,this.pos.z+dir.z*0.4,0.9); killSlowmo=CFG.rev.killSlowmo; hitstop=CFG.rev.hitstop*2.5; log(`${this.name} is down for good`,"#ff6a5a");
  if(run){ run.kills++; if(!run.over && clearWins() && enemies.every(e=>e.dead||e.type==="dummy") && enemies.some(e=>e.type!=="dummy")) setTimeout(()=>{ if(enemies.every(e=>e.dead||e.type==="dummy")) endRun("WON"); }, 900); } };
// a hit on her from a clip event, if it really reaches her (her body within reach of the given stage point)
function pvReach(e,stagePt,r){ const b=e.pv, w=b.toWorld(stagePt), p=player.pos; return Math.hypot(w.x-p.x,w.z-p.z)<r && w.y>-0.2 && w.y<2.2; }
function pvBodyPt(e,bone){ const b=e.pv; b.C.group.updateMatrixWorld(true); return b.withStage(()=>b.C.B[bone].getWorldPosition(new THREE.Vector3())); }
