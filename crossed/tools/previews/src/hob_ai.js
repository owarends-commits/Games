// ================================================================ the Hob (chapter 2's boss), in the playground
// It can't be killed. It drags its huge body after her on its hands (faster when it has her in sight), screeches, grabs
// her one-handed and squeezes (break-free prompt), or shoves off into the throne grab: it flies at her, crashes flat and
// pins her in both hands, drawing her to its mouth. Two shots to the cross branded on its right arm, or to its eyes, make
// it spasm and let go; otherwise it bites. A shot to the cross while it crawls stops it dead for a moment.
class HobBody{
  constructor(e){ this.e=e; this.K=PVK.hob; this.mod=PV_HOB; this.stage=new THREE.Group(); scene.add(this.stage); this.ready=false; this.hits=[]; this.ctx={}; this.t=0; this.ct=0; this.clipName=null; this.stun=0;
    for(const o of enemies) if(o!==e&&o.pvType==="hob"&&!o.removed){ o.remove(); const i=enemies.indexOf(o); if(i>=0) enemies.splice(i,1); }
    this.yaw=Math.atan2(player.pos.x-e.pos.x,player.pos.z-e.pos.z); this.pos=new THREE.Vector3(e.pos.x,0,e.pos.z); this.place();
    hobPreload().then(g0=>{ const g={scene:THREE.SkeletonUtils.clone(g0.scene)}; if(e.removed) return; if(typeof meshFixAll==="function") meshFixAll(g.scene); PV_HOB.hobInit(g,this.stage); this.makeHits(); this.ready=true; this.K.start(e,this); },
      ).catch(err=>log(`${e.name}: model failed (${err&&err.message||err})`,"#ff7070")); }
  dir(){ return new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); }
  place(){ this.stage.position.copy(this.pos); this.stage.rotation.set(0,this.yaw-Math.PI/2,0); this.stage.updateMatrixWorld(true); }
  makeHits(){ const H=PV_HOB.H, mat=new THREE.MeshBasicMaterial({color:0xff4040,transparent:true,opacity:0.25,depthWrite:false}); mat.visible=!!CFG.world.showZones;
    const R={root:1.0,spine1:1.0,spine2:0.95,spine3:0.9,head:0.7,shoulder_L:0.45,shoulder_R:0.45,elbow_L:0.32,elbow_R:0.32,hand_L:0.3,hand_R:0.3,leg_L:0.55,leg_R:0.55,foot_L:0.4,foot_R:0.4};
    for(const n in R){ const b=H.B[n]; if(!b) continue; const m=new THREE.Mesh(new THREE.SphereGeometry(R[n],10,8),mat); b.add(m); m.userData={enemy:this.e,zone:"torso",limb:n,pv:true,hitbox:true}; this.hits.push(m); }
    // the forearms are long: a few more along each, so the cross on the right one can be hit
    for(const s of ["L","R"]){ const e0=H.B["elbow_"+s], h0=H.B["hand_"+s]; if(!e0||!h0) continue; for(const u of [0.33,0.66]){ const m=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),mat); m.position.copy(h0.position).multiplyScalar(u); e0.add(m); m.userData={enemy:this.e,zone:"torso",limb:"forearm_"+s,pv:true,hitbox:true}; this.hits.push(m); } } }
  holding(){ const c=this.ctx; return (this.clipName==="grabL"||this.clipName==="grabR")&&c.got!=null&&this.ct-c.got<3.2; }
  play(name){ this.clipName=name; this.ct=0; const I=this.ctx.I; this.ctx={I}; PV_HOB.hobStart(name,this.ctx); }
  step(dt){ if(!this.ready||!this.clipName) return []; const c=this.ctx; if(this.stun>0){ this.stun-=dt; dt*=0.12; }
    c.herW=new THREE.Vector3(player.pos.x,1.0+(player.posY||0),player.pos.z); this.t+=dt; this.ct+=dt;
    const X=PV_HOB.hobStep(this.clipName,this.ct,dt,c);
    if(X){ this.pos.addScaledVector(this.dir(),X); collide(this.pos,1.0); }
    this.place(); const h=PV_HOB.hobHold(); if(h>0) hitstop=Math.max(hitstop,Math.min(0.08,h)); return []; }
  sync(){ this.e.pos.set(this.pos.x,0,this.pos.z); this.e.yaw=this.yaw; }
  dispose(){ scene.remove(this.stage); if(PV_HOB.H&&PV_HOB.H.group.parent===this.stage) PV_HOB.hide(); const i=PV_LIST.indexOf(this); if(i>=0) PV_LIST.splice(i,1); }
}
function hobPin(e,p){ if(!p) return; player.pos.x=p.x; player.pos.z=p.z; player.vel.set(0,0,0); }
PVK.hob={ mod:PV_HOB, label:"The Hob", cfg:"hob", radius:1.2, body:HobBody,
  start(e,b){ e.pvMem={cool:3,scr:4}; b.play("crawl"); log("The Hob drags itself in on its hands · it can't be killed: shoot the cross on its right arm, or its eyes","#c8b0ff"); },
  brain(e,dt,dist,toP){ const C=CFG.hob, b=e.pv, m=e.pvMem, c=b.ctx, name=b.clipName; m.cool-=dt; m.scr-=dt;
    const fw=b.dir(), ang=Math.acos(clamp(fw.dot(toP),-1,1)), sees=!player.dead&&dist<C.sight&&lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false);
    // she can't walk through it: pushed out of its body (a long capsule back from its shoulders)
    if(!(name==="throne"&&c.caught!=null&&c.s2==null)&&!b.holding()){ const a=e.pos, d=fw.clone().negate(), v=new THREE.Vector3(player.pos.x-a.x,0,player.pos.z-a.z), u=clamp(v.dot(d),-0.8,7), q=a.clone().addScaledVector(d,u), w=new THREE.Vector3(player.pos.x-q.x,0,player.pos.z-q.z), L=w.length(), r=u<0?1.1:1.25;
      if(L<r){ if(L<1e-3) w.set(-d.z,0,d.x); else w.normalize(); player.pos.x=q.x+w.x*r; player.pos.z=q.z+w.z*r; collide(player.pos,0.3); } }
    if(name==="grabL"||name==="grabR"){ const s=name==="grabL"?"L":"R";
      if(c.got==null){ if(b.ct>0.8&&!player.grabbed&&!player.dead&&PV_HOB.hobPalm(s).distanceTo(c.herW)<0.75){ c.got=b.ct;
          if(player.grab(e,{dmg:C.grabDamage,how:"one-hand grab"})){ shake=Math.max(shake,0.2); m.sq=0; } else c.got=b.ct-3.2; }
        if(b.ct>4.3&&c.got==null){ b.play("crawl"); m.cool=C.attackCool||3; log("Its hand closes on nothing","#9ed08a"); } return; }
      const sq=b.ct-c.got; if(sq<3.2&&player.grabbed&&player.grabbed.by===e){ hobPin(e,PV_HOB.hobHerAt(c));
        for(const t0 of [0.8,1.6,2.4]) if(sq>=t0&&(m.sq||0)<t0){ m.sq=t0; player.hurt(C.squeezeDamage,e,"squeeze"); shake=Math.max(shake,0.15); log("It squeezes","#ff7070"); } }
      if(sq>=3.2&&player.grabbed&&player.grabbed.by===e){ player.grabbed=null; log("It lets her drop","#9ed08a"); }
      if(sq>5.2){ b.play("crawl"); m.cool=3; } return; }
    if(name==="throne"){
      if(c.missed!=null){ if(b.ct>c.missed+3.0){ b.play("crawl"); m.cool=4; log("It crashed down short of her","#9ed08a"); } return; }
      if(c.caught!=null&&c.s2==null){ hobPin(e,PV_HOB.hobHerAt(c)); if(!m.caughtLog){ m.caughtLog=1; shake=Math.max(shake,0.5); player.hurt(C.throneDamage,e,"throne grab"); log("It crashes down on her and both hands close · SHOOT THE CROSS ON ITS RIGHT ARM, OR ITS EYES (2 shots)","#ff7070"); qteBanner("SHOOT THE CROSS OR ITS EYES","bad"); }
        if(b.ct>9.6&&!c.bit){ c.bit=1; player.bite(e,"bite",C.throneBiteDamage); qteBanner(`BITTEN −${C.throneBiteDamage}`,"bad"); c.s1=c.s1??b.ct; c.s2=b.ct; } return; }
      if(c.s2!=null&&b.ct>c.s2+0.15&&b.ct<c.s2+1.0){ const p=PV_HOB.hobHerAt(c); if(p) hobPin(e,p); }
      if(c.s2!=null&&b.ct>c.s2+3.2){ b.play("crawl"); m.cool=5; m.caughtLog=0; } return; }
    if(name==="screech"){ if(b.ct>1.1&&!m.scrHit){ m.scrHit=1; if(dist<10){ player.stumble=Math.max(player.stumble||0,0.6); shake=Math.max(shake,0.3); log("The screech knocks the breath out of her","#ff7070"); } } if(b.ct>6){ b.play("crawl"); m.scrHit=0; } return; }
    // crawling: toward her, faster when it has her in sight; it turns as it drags itself
    c.I= sees&&dist>3.5? 1 : sees? 0.3 : 0;
    const want=Math.atan2(player.pos.x-e.pos.x,player.pos.z-e.pos.z); b.yaw+=clamp(wrapA(want-b.yaw),-(0.45+0.5*c.I)*dt,(0.45+0.5*c.I)*dt);
    if(!sees||player.dead||player.grabbed) return;
    if(m.scr<=0&&dist>5&&dist<14&&rng()<dt*0.5){ b.play("screech"); m.scr=C.screechCool; return; }
    if(m.cool>0) return;
    if(ang<0.3&&dist>5.0&&dist<8.0){ b.play("throne"); m.cool=6; return; }
    if(ang<1.0&&dist>1.0&&dist<4.6){ const hm=PV_HOB.w2m(new THREE.Vector3(player.pos.x,1,player.pos.z)); b.play(hm.x>0?"grabR":"grabL"); m.cool=4; } },
  // it can't be killed: every shot is handled here (the cross, its eyes, or flesh that takes it)
  dodge(e,mesh,point,dir){ const C=CFG.hob, b=e.pv, c=b.ctx, m=e.pvMem, cw=PV_HOB.crossWorld(); let what="body";
    if(cw&&point.distanceTo(cw)<0.4) what="cross"; else for(const s of ["L","R"]){ if(point.distanceTo(PV_HOB.eyeWorld(s))<0.3) what="eye"; }
    spray(point,dir); SFX.flesh(point); if(run) run.hits++; this.lastShot=what;
    if(b.clipName==="throne"&&c.caught!=null&&c.s2==null){
      if(what!=="body"){ const route=what==="cross"?"cross":"eyes"; if(!c.route) c.route=route;
        if(route===c.route){ c.hits=(c.hits||0)+1; const need=route==="cross"?C.crossShots:C.eyeShots;
          if(c.hits>=need){ if(c.s1==null) c.s1=b.ct; c.s2=b.ct+0.02; shake=Math.max(shake,0.35); log(route==="cross"?"The cross is hit again · it spasms and lets go":"Both eyes burst · it spasms and lets go","#9ed08a"); qteBanner("FREE","ok"); }
          else { c.s1=b.ct; log(route==="cross"?`The cross flares (${c.hits} / ${need})`:`One eye bursts (${c.hits} / ${need})`,"#ffb070"); } }
        else log(route==="cross"?"Keep on the eyes":"Keep on the cross","#ffb070"); }
      else log("The shot sinks into its flesh · the cross on its right arm, or its eyes","#ffb070"); return true; }
    if(what==="cross"){ b.stun=C.stun; PV_HOB.embers(cw,30,2.5); c.flare=2; shake=Math.max(shake,0.15); log(`The cross flares · ${e.name} stops dead`,"#ffb070"); }
    else if(what==="eye"){ PV_HOB.hobBlood(point,14); b.stun=Math.max(b.stun,0.6); log(`${e.name} flinches from the shot to its eye`,"#ffb070"); }
    else if((m.bodyLog=(m.bodyLog||0)+1)%4===1) log(`The shot sinks into ${e.name} · it can't be killed`,"#bfe0ff");
    return true; },
  freed(e){ const b=e.pv, c=b.ctx; if(c.got!=null) c.got=b.ct-3.2; },
  failed(e){ const b=e.pv, c=b.ctx; player.hurt(CFG.hob.squeezeDamage*2,e,"crushed"); qteBanner(`CRUSHED −${CFG.hob.squeezeDamage*2}`,"bad"); if(c.got!=null) c.got=b.ct-3.2; return true; } };

let HOB_G=null; function hobPreload(){ return HOB_G||(HOB_G=new Promise((res,rej)=>new THREE.GLTFLoader().load("m/bosses/hob/hob_rigged.json",res,undefined,rej))); }
