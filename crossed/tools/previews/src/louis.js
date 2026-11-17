  // ---------------- Louis: hunts Norah through the map, breaks doors, windows and weak walls, slams, grabs and throws her, throws furniture
  louisSense(dt, see){
    const S=CFG.brute, H=this.hunt||(this.hunt={x:player.pos.x,z:player.pos.z,t:gameTime,src:"start"});
    this.seesP=see;
    if(see){ H.x=player.pos.x; H.z=player.pos.z; H.t=gameTime; H.src="sight"; this.searchPt=null; return; }
    for(const n of world.noises){ if(n.id<=(this.heardId||0)) continue; this.heardId=n.id; if(n.src===this) continue;
      const d=Math.hypot(n.x-this.pos.x,n.z-this.pos.z), eff=n.r*S.hearing*(wallsClear(this.pos.x,this.pos.z,n.x,n.z)?1:0.6);
      if(d<eff){ H.x=n.tx; H.z=n.tz; H.t=gameTime; H.src="noise"; this.searchPt=null; } }
    const tr=world.trail; for(let i=tr.length-1;i>=0;i--){ const q=tr[i]; if(q.t<=H.t) break; if(Math.hypot(q.x-this.pos.x,q.z-this.pos.z)<S.trailSense){ H.x=q.x; H.z=q.z; H.t=q.t; H.src="blood"; this.searchPt=null; break; } }
  }
  louisTarget(){
    const H=this.hunt; if(this.seesP||!H) return player.pos;
    if(Math.hypot(H.x-this.pos.x,H.z-this.pos.z)>1.0 && !this.searchPt) return H;
    this.searchT=(this.searchT||0)-0.35;
    if(!this.searchPt || this.searchT<=0 || Math.hypot(this.searchPt.x-this.pos.x,this.searchPt.z-this.pos.z)<0.8){ this.searchPt=this.randomPoint(H.x,H.z,4.5); this.searchT=4; }
    return this.searchPt;
  }
  findThrowable(){
    const S=CFG.brute; let best=null, bd=S.fetchRange;
    for(const b of world.boxes){ if(!b.push||b.flying||b.w*b.d*b.h>S.furnMaxVol) continue; const d=Math.hypot(b.x-this.pos.x,b.z-this.pos.z);
      if(d<bd && wallsClear(this.pos.x,this.pos.z,b.x,b.z)){ bd=d; best=b; } }
    return best;
  }
  dropCarry(){ const b=this.carry; this.carry=null; if(!b) return; b.x=this.pos.x+Math.sin(this.yaw)*0.8; b.z=this.pos.z+Math.cos(this.yaw)*0.8; louisLand(b,null); }
  brainBrute(dt, dist, want, toP){
    const S=CFG.brute, rake=this.lost.armL, C=this.lc||(this.lc={slam:1.5,grab:2.5,throw:3,charge:2});
    for(const k in C) C[k]-=dt;
    const reach=(rake?S.rakeReach:S.reach)*(this.legsLost()?0.8:1);
    const see=!player.dead && dist<30 && lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,true);
    this.louisSense(dt, see);
    // at a smashed window he squeezes through and clambers over whatever is under it (the bed, in Chapter One)
    this.climbT=Math.max(0,(this.climbT||0)-dt);
    for(const w of world.windows){ if(!w.broken||!w.gap) continue; const G=w.gap, dx=G.bx-G.ax, dz=G.bz-G.az, L2=dx*dx+dz*dz||1, u=clamp(((this.pos.x-G.ax)*dx+(this.pos.z-G.az)*dz)/L2,0,1);
      if(Math.hypot(G.ax+dx*u-this.pos.x,G.az+dz*u-this.pos.z)<1.3){ if(!this.climbT) SFX.scrape(this.pos); this.climbT=0.9; } }
    const st=this.state, front=this.facing(toP);
    const startWind=(kind)=>{ this.state="windup"; this.t=0; this.attackKind=kind; this.hitDone=false; SFX.grunt(this.pos,(kind==="rake"?S.rakeWindup:S.windup)*0.8); };
    if(st==="chase"){
      // close in: pick the attack the distance calls for. Each has its own tell.
      const thruWin=world.windows.some(w=>w.gap&&segsCross(this.pos.x,this.pos.z,player.pos.x,player.pos.z,w.gap.ax,w.gap.az,w.gap.bx,w.gap.bz)); // a window between: climb in, don't swing through it
      // the charge: a straight run at her (or at where he heard her), through anything breakable in the lane
      if(C.charge<=0 && this.cool<=0 && !player.grabbed && this.legsLost()===0 && rng()<dt*2.5){
        const H=this.hunt, tx=see?player.pos.x:H.x, tz=see?player.pos.z:H.z, dd=Math.hypot(tx-this.pos.x,tz-this.pos.z), fresh=see||(H&&gameTime-H.t<6);
        if(fresh && dd>S.chargeMin && dd<S.chargeMax && chargeLane(this.pos.x,this.pos.z,tx,tz)){
          this.chargeDir=new THREE.Vector3(tx-this.pos.x,0,tz-this.pos.z).normalize(); this.state="chargeWind"; this.t=0; this.hitDone=false; this.chargeHurt=false; C.charge=S.chargeCool;
          SFX.grunt(this.pos,S.chargeWindup); SFX.scrape(this.pos); this.attackLog(`${this.name} lowers his head to charge${see?"":" (through the wall, at a sound)"}`); return; } }
      if(see && !thruWin && this.cool<=0 && !player.grabbed){
        if(dist<S.slamRadius*0.8 && C.slam<=0 && rng()<0.4){ this.state="slamWind"; this.t=0; this.hitDone=false; C.slam=S.slamCool; SFX.grunt(this.pos,S.slamWindup); this.attackLog(`${this.name} raises both arms for a slam`); return; }
        if(!this.lost.armL && dist<S.grabReach && front>0.7 && C.grab<=0 && rng()<0.45){ this.state="grabWind"; this.t=0; this.hitDone=false; C.grab=S.grabCool; SFX.grunt(this.pos,S.grabWindup); this.attackLog(`${this.name} reaches for her`); return; }
        if(dist<reach && front>0.8 && !(rake&&this.lost.armR)){ this.door=null; this.wallT=null; startWind(rake?"rake":"haymaker"); this.attackLog(`${this.name} winds up a ${this.attackKind}`); return; }
      }
      // out of reach but in sight: throw the furniture nearest him
      if(see && dist>S.furnMin && dist<S.furnMax && C.throw<=0 && !this.lost.armL && !this.lost.armR){ const b=this.findThrowable(); if(b){ this.carryTarget=b; this.state="fetch"; this.t=0; C.throw=S.furnCool; this.attackLog(`${this.name} goes for the ${b.name||"crate"}`); return; } }
      const g=this.goal(dt); let gx=g.x, gz=g.z;
      // a door in the way: smash it
      const door=this.findDoor(dist);
      if(door && this.cool<=0 && !(rake&&this.lost.armR)){ this.door=door.d; this.wallT=null; this.turnTo(Math.atan2(door.mx-this.pos.x,door.mz-this.pos.z),dt,S.turn); startWind(rake?"rake":"haymaker"); this.attackLog(`${this.name} winds up on the door`); return; }
      // a weak wall between him and where she is: go straight through it
      const H=this.hunt;
      if(H && !see && Math.hypot(H.x-this.pos.x,H.z-this.pos.z)<S.wallSense){ const ww=weakBlock(this.pos.x,this.pos.z,H.x,H.z);
        if(ww){ const q=weakNearest(ww,this.pos.x,this.pos.z), dd=Math.hypot(q.x-this.pos.x,q.z-this.pos.z);
          if(dd<reach*0.7 && this.cool<=0){ this.wallT=ww; this.door=null; this.turnTo(Math.atan2(q.x-this.pos.x,q.z-this.pos.z),dt,S.turn); startWind("haymaker"); this.attackLog(`${this.name} winds up on the wall`); return; }
          const back=Math.max(0.01,dd); gx=q.x-(q.x-this.pos.x)/back*0.6; gz=q.z-(q.z-this.pos.z)/back*0.6; this.goalPt={x:gx,z:gz,direct:true}; } }
      if(dist>reach*0.8 || !g.direct || !see || thruWin){ this.steer(dt, Math.atan2(gx-this.pos.x,gz-this.pos.z), this.speedNow(), S.turn); this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.55/Math.max(0.3,S.walk); SFX.stomp(this.pos); } }
      else this.turnTo(want, dt, S.turn);
    } else if(st==="windup"){
      if(!this.door && !this.wallT) this.turnTo(want, dt, S.turn*0.5);
      if(this.t >= (this.attackKind==="rake"?S.rakeWindup:S.windup)){ this.state="active"; this.t=0; }
    } else if(st==="active"){
      if(!this.hitDone && this.t>S.swing*0.4){
        this.hitDone=true; this.hitFlash=0.25;
        if(this.door){ hitDoor(this.door, S.doorDamage, this); }
        else if(this.wallT){ hitWeak(this.wallT, S.wallDamage, this); }
        else { const r=this.attackKind==="rake"?S.rakeReach:S.reach; const inRange=dist<r+0.3, inFront=front>0.45;
          this.attackLog(`${this.name} ${this.attackKind} lands: Norah ${dist.toFixed(2)} m → ${inRange&&inFront?"HIT":"miss"}`);
          if(inRange && inFront) player.hurt(this.attackKind==="rake"?S.rakeDamage:S.damage, this, this.attackKind==="rake"?"rake":"haymaker"); } }
      if(this.t>=S.swing){ this.state="recover"; this.t=0; }
    } else if(st==="chargeWind"){
      const want2=Math.atan2(this.chargeDir.x,this.chargeDir.z); this.turnTo(want2, dt, 360); this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.18; SFX.scrape(this.pos); }
      if(this.t>=S.chargeWindup){ this.yaw=want2; this.state="charge"; this.t=0; this.vel.copy(this.chargeDir).multiplyScalar(S.chargeSpeed); SFX.grunt(this.pos,0.5); }
    } else if(st==="charge"){
      const D=this.chargeDir, along=this.vel.x*D.x+this.vel.z*D.z;
      if(this.t>0.15 && along<S.chargeSpeed*0.4){ // stopped dead by something he can't break
        this.state="stagger"; this.stagger=S.chargeStun; this.t=0; this.flinch=1; this.vel.set(0,0,0); shake=Math.max(shake,0.6); SFX.slam(this.pos); SFX.doorBreak(this.pos);
        makeNoise(this.pos.x,this.pos.z,14,"crash",true,undefined,undefined,this); log(`${this.name} slams into the wall and staggers`,"#ffb070"); return; }
      chargeSmash(this, D);
      if(!this.hitDone && !this.chargeHurt && dist<this.radius+0.5){ this.hitDone=true; this.chargeHurt=true; this.hitFlash=0.3; const saved=dodgeSaves(); knockNorah(S.chargeDamage, this, "charge", S.chargeDown); if(!saved&&!player.dead){ player.vel.copy(D).multiplyScalar(7); player.thrown={t:0.6,last:7,hit:false,by:this}; } }
      this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.22; SFX.stomp(this.pos); makeNoise(this.pos.x,this.pos.z,9,"charge",true,undefined,undefined,this); }
      this.vel.copy(D).multiplyScalar(S.chargeSpeed); this.desired={x:this.vel.x,z:this.vel.z};
      if(this.t>=S.chargeTime){ this.state="recover"; this.t=-0.3; this.vel.multiplyScalar(0.5); }
    } else if(st==="slamWind"){
      this.turnTo(want, dt, S.turn*0.3);
      if(this.t>=S.slamWindup){ this.state="slam"; this.t=0; }
    } else if(st==="slam"){
      if(!this.hitDone && this.t>=0.1){ this.hitDone=true; this.hitFlash=0.3; shake=Math.max(shake,0.7); SFX.slam(this.pos); SFX.stomp(this.pos); makeNoise(this.pos.x,this.pos.z,14,"slam",true,undefined,undefined,this);
        const p=this.pos.clone(); p.y=groundY(p.x,p.z)+0.1; spray(p,new THREE.Vector3(0,0,0),0x6a5a48); spray(p,new THREE.Vector3(0,0,0),0x6a5a48);
        this.attackLog(`${this.name} slams the floor: Norah ${dist.toFixed(2)} m (radius ${S.slamRadius}) → ${dist<S.slamRadius?"DOWN":"clear"}`);
        if(dist<S.slamRadius && wallsClear(this.pos.x,this.pos.z,player.pos.x,player.pos.z)) knockNorah(S.slamDamage, this, "ground slam", S.slamDown);
        for(const e of enemies) if(e!==this && !e.dead && e.kind==="across" && e.legsLost()===0 && e.gait && Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z)<S.slamRadius) e.knockDown(new THREE.Vector3(e.pos.x-this.pos.x,0,e.pos.z-this.pos.z),"slam"); }
      if(this.t>=0.35){ this.state="recover"; this.t=-(S.slamRecover-S.recover); }
    } else if(st==="grabWind"){
      this.turnTo(want, dt, S.turn*1.2);
      if(this.t>=S.grabWindup){ const ok = dist<S.grabReach+0.25 && front>0.55 && player.grab(this,{dmg:S.grabDamage, how:"Louis's grip"});
        this.attackLog(`${this.name} grab: Norah ${dist.toFixed(2)} m → ${ok?"CAUGHT":"miss"}`);
        if(ok){ this.state="grab"; this.t=0; } else { this.state="recover"; this.t=-0.4; } }
    } else if(st==="grab"){
      this.turnTo(want, dt, S.turn); if(!(player.grabbed && player.grabbed.by===this)){ this.state="recover"; this.t=0; }
    } else if(st==="fetch"){
      const b=this.carryTarget; if(!b || b.flying || this.t>6 || (see && dist<reach*0.9)){ this.carryTarget=null; this.state="chase"; return; }
      const cx=clamp(this.pos.x,b.x0,b.x1), cz=clamp(this.pos.z,b.z0,b.z1), d=Math.hypot(cx-this.pos.x,cz-this.pos.z);
      if(d<0.95){ const i=world.boxes.indexOf(b); if(i>=0) world.boxes.splice(i,1); b.flying=true; this.carry=b; this.carryTarget=null; this.state="lift"; this.t=0; b.liftFrom={x:b.x,y:b.y0||0,z:b.z}; SFX.drag(); this.attackLog(`${this.name} lifts the ${b.name||"crate"}`); return; }
      this.goalPt={x:cx,z:cz,direct:true}; this.steer(dt, Math.atan2(cx-this.pos.x,cz-this.pos.z), this.speedNow(), S.turn);
    } else if(st==="lift"){
      const b=this.carry; if(!b){ this.state="chase"; return; } this.turnTo(want, dt, S.turn*0.8);
      const k=Math.min(1,this.t/S.liftTime), top=groundY(this.pos.x,this.pos.z)+S.height*0.92+0.1;
      const hx=this.pos.x+Math.sin(this.yaw)*0.25, hz=this.pos.z+Math.cos(this.yaw)*0.25, L=b.liftFrom;
      louisPlaceAir(b, L.x+(hx-L.x)*k, L.y+(top-L.y)*k, L.z+(hz-L.z)*k);
      if(this.t>=S.liftTime){ louisThrowBox(this,b); this.carry=null; this.state="recover"; this.t=0; }
    } else if(st==="recover"){ if(this.t>=S.recover){ this.state="chase"; this.cool=0.2; this.door=null; this.wallT=null; } }
  }
