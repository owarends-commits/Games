// ---------------------------------------------------------------- Louis and the map: weak walls, knockdowns, throws, flying furniture, Norah's blood trail
// the weak wall that is the only solid thing between two points (windows don't count), or null
function weakBlock(ax,az,bx,bz){ let w=null; for(const s of world.segs){ if(!segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) continue; if(s.weak){ w=w||s.weak; continue; } if(s.win) continue; return null; } return w; }
function weakNearest(rec,x,z){ let best=null, bd=1e9; for(const s of rec.segs){ const dx=s.bx-s.ax, dz=s.bz-s.az, L2=dx*dx+dz*dz||1, u=clamp(((x-s.ax)*dx+(z-s.az)*dz)/L2,0,1), px=s.ax+dx*u, pz=s.az+dz*u, d=Math.hypot(px-x,pz-z); if(d<bd){ bd=d; best={x:px,z:pz}; } } return best||{x:rec.ax,z:rec.az}; }
function hitWeak(rec, amount, by){
  if(rec.broken) return; rec.hp-=amount; const q=weakNearest(rec,by.pos.x,by.pos.z), p=new THREE.Vector3(q.x,1.2+groundY(q.x,q.z),q.z);
  spray(p,new THREE.Vector3(0,0,0),0xb8b2a2); SFX.doorHit(p); shake=Math.max(shake,0.25); makeNoise(q.x,q.z,10,"wall",true,undefined,undefined,by);
  if(rec.hp>0){ log(`${by.name} hammers the wall (${Math.max(0,rec.hp).toFixed(1)} left)`,"#c0a080"); return; }
  rec.broken=true; for(const sg of rec.segs){ const i=world.segs.indexOf(sg); if(i>=0) world.segs.splice(i,1); }
  for(const d of world.doors){ if(d.broken) continue; const dx=rec.bx-rec.ax, dz=rec.bz-rec.az, L2=dx*dx+dz*dz||1, u=clamp(((d.hx-rec.ax)*dx+(d.hz-rec.az)*dz)/L2,0,1); if(Math.hypot(rec.ax+dx*u-d.hx,rec.az+dz*u-d.hz)<0.2){ d.broken=true; d.pivot.visible=false; const i=world.blockers.indexOf(d.leaf); if(i>=0) world.blockers.splice(i,1); } }
  for(const m of rec.meshes){ m.visible=false; const i=world.blockers.indexOf(m); if(i>=0) world.blockers.splice(i,1); }
  for(let i=0;i<4;i++){ const r=p.clone(); r.x+=(Math.random()-.5)*1.2; r.z+=(Math.random()-.5)*1.2; spray(r,new THREE.Vector3(0,0,0),i%2?0x8a8478:0x5a554c); }
  SFX.doorBreak(p); shake=Math.max(shake,0.6); makeNoise(q.x,q.z,16,"wall",true,undefined,undefined,by); log(`${by.name} smashes through the wall`,"#ffb070");
}
function dodgeSaves(){ const N=CFG.norah; return player.dodge>0 && player.dodge > N.dodgeTime*(1-N.dodgeIframes); }
// hit that puts Norah on the floor for a moment
function knockNorah(dmg, from, how, down){
  if(player.dead) return; const saved=dodgeSaves(); player.hurt(dmg, from, how); if(saved||player.dead) return;
  const d=new THREE.Vector3(player.pos.x-from.pos.x,0,player.pos.z-from.pos.z); if(d.lengthSq()<1e-4) d.set(Math.sin(from.yaw),0,Math.cos(from.yaw)); d.normalize();
  player.vel.copy(d.multiplyScalar(3.5)); player.stumble=Math.max(player.stumble,down); player.downT=down; player.search=null;
}
// a failed escape from Louis's grip: he throws her, toward a wall if there's one close by
function louisThrowPlayer(e){
  const S=CFG.brute; let best=null, bd=1e9;
  for(let i=0;i<12;i++){ const a=e.yaw+(i-6)/6*Math.PI*0.7, dx=Math.sin(a), dz=Math.cos(a); const p=player.pos.clone().addScaledVector(new THREE.Vector3(dx,0,dz),3.5); const q=p.clone(); collide(q,0.3);
    const hit=Math.hypot(q.x-p.x,q.z-p.z)>0.2, score=(hit?0:2)+Math.abs(i-6)*0.15; if(score<bd){ bd=score; best=new THREE.Vector3(dx,0,dz); } }
  player.hurt(S.throwDamage, e, "throw"); if(player.dead) return;
  player.vel.copy(best.multiplyScalar(S.throwSpeed)); player.stumble=S.throwDown; player.downT=S.throwDown; player.thrown={t:0.8,last:S.throwSpeed,hit:false,by:e};
  shake=Math.max(shake,0.5); SFX.slam(null); log(`${e.name} throws her`,"#ff7070");
}
function louisPlaceAir(b,x,y,z){ b.x=x; b.z=z; b.y0=y; placeBoxMesh(b); }
function louisThrowBox(e,b){
  const S=CFG.brute, tgt=player.pos.clone().addScaledVector(player.vel,0.35), dx=tgt.x-b.x, dz=tgt.z-b.z, L=Math.max(0.5,Math.hypot(dx,dz)), T=L/S.furnSpeed;
  const ty=groundY(tgt.x,tgt.z)+1.0-b.h/2, vy=(ty-b.y0+0.5*9.8*T*T)/T;
  world.flying.push({b,e,vx:dx/L*S.furnSpeed,vz:dz/L*S.furnSpeed,vy,hit:false});
  SFX.grunt(e.pos,0.3); SFX.dodge(); makeNoise(e.pos.x,e.pos.z,8,"throw",false,undefined,undefined,e); log(`${e.name} throws the ${b.name||"crate"}`,"#ffb070");
}
function louisLand(b,f){
  b.mesh.rotation.x=0; b.mesh.rotation.z=0; const p=new THREE.Vector3(b.x,0,b.z); collide(p,Math.min(b.w,b.d)/2*0.95,b); b.x=p.x; b.z=p.z; b.y0=groundY(b.x,b.z);
  placeBoxMesh(b); b.flying=false; if(!world.boxes.includes(b)) world.boxes.push(b);
  const q=new THREE.Vector3(b.x,b.y0+0.2,b.z); SFX.slam(q); spray(q,new THREE.Vector3(0,0,0),0x6a4a30); makeNoise(b.x,b.z,10,"crash",true,undefined,undefined,f&&f.e);
}
function updateFlying(dt){
  const S=CFG.brute;
  for(let i=world.flying.length-1;i>=0;i--){ const f=world.flying[i], b=f.b, px=b.x, pz=b.z;
    b.x+=f.vx*dt; b.z+=f.vz*dt; f.vy-=9.8*dt; b.y0+=f.vy*dt;
    for(const s of world.segs){ if(segsCross(px,pz,b.x,b.z,s.ax,s.az,s.bx,s.bz)){ if(s.glass&&s.win){ smashWindow(s.win,f.e); break; } f.vx=f.vz=0; b.x=px; b.z=pz; break; } }
    for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); if(segsCross(px,pz,b.x,b.z,s.ax,s.az,s.bx,s.bz)){ hitDoor(d,1,f.e); f.vx=f.vz=0; b.x=px; b.z=pz; } }
    placeBoxMesh(b); b.mesh.rotation.x+=6*dt;
    if(!f.hit && !player.dead && !(f.charge&&f.charge.chargeHurt)){ const cy=b.y0+b.h/2, py=groundY(player.pos.x,player.pos.z)+1.0; if(Math.hypot(b.x-player.pos.x,cy-py,b.z-player.pos.z)<0.55+Math.min(b.w,b.d)/2){ f.hit=true; if(f.charge) f.charge.chargeHurt=true; knockNorah(S.furnDamage, f.e, "thrown "+(b.name||"crate"), 0.8); } }
    if(b.y0<=groundY(b.x,b.z) && f.vy<0){ world.flying.splice(i,1); louisLand(b,f); }
  }
}
function louisTick(dt){
  const N=CFG.norah;
  if(player.downT>0) player.downT-=dt;
  const T=player.thrown;
  if(T){ T.t-=dt; const sp=Math.hypot(player.vel.x,player.vel.z);
    if(!T.hit && T.last>3 && sp<T.last*0.45){ T.hit=true; player.bite(T.by,"grab",CFG.brute.throwWallDamage); shake=Math.max(shake,0.7); SFX.slam(null); log(`Slammed into the wall: −${CFG.brute.throwWallDamage}`,"#ff7070"); }
    T.last=sp; if(T.t<=0) player.thrown=null; }
  // hurt badly, she bleeds: drops of blood that ACROSS and Louis can follow
  if(MODE==="play" && !player.dead && player.hp<N.hp*N.bleedAt){ const L=player.lastDrip;
    if(!L || Math.hypot(player.pos.x-L.x,player.pos.z-L.z)>N.dripGap){ player.lastDrip={x:player.pos.x,z:player.pos.z}; world.trail.push({x:player.pos.x,z:player.pos.z,t:gameTime}); if(world.trail.length>240) world.trail.shift();
      bloodPool(player.pos.x+(Math.random()-.5)*0.25,player.pos.z+(Math.random()-.5)*0.25,0.05+Math.random()*0.06); } }
  if(world.flying.length) updateFlying(dt);
}

// the charge lane is good if nothing solid is in the way: weak walls, windows and doors are fine, furniture gets shoved
function chargeLane(ax,az,bx,bz){ for(const s of world.segs){ if(s.weak||s.win) continue; if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; }
  for(const c of world.circles){ const dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1, u=clamp(((c.x-ax)*dx+(c.z-az)*dz)/L2,0,1); if(Math.hypot(ax+dx*u-c.x,az+dz*u-c.z)<c.r+0.3) return false; } return true; }
// whatever is just ahead of a charging Louis gives way
function chargeSmash(e, D){
  const r=e.radius+0.45, ax=e.pos.x, az=e.pos.z, bx=ax+D.x*r, bz=az+D.z*r;
  for(const s of [...world.segs]){ if(!segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) continue; if(s.weak) hitWeak(s.weak,999,e); else if(s.win) smashWindow(s.win,e); }
  for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) hitDoor(d,99,e); }
  for(const b of [...world.boxes]){ if(b.flying) continue; const cx=clamp(e.pos.x+D.x*0.3,b.x0,b.x1), cz=clamp(e.pos.z+D.z*0.3,b.z0,b.z1); if(Math.hypot(cx-e.pos.x-D.x*0.3,cz-e.pos.z-D.z*0.3)>e.radius+0.15) continue;
    if(b.w*b.d*b.h>CFG.brute.chargeMaxVol) continue;            // too heavy: it stops him
    const side=((b.x-e.pos.x)*-D.z+(b.z-e.pos.z)*D.x)>=0?1:-1, i=world.boxes.indexOf(b); if(i>=0) world.boxes.splice(i,1);
    b.flying=true; world.flying.push({b,e,charge:e,vx:D.x*5.5+(-D.z)*side*2.5,vz:D.z*5.5+D.x*side*2.5,vy:2.2,hit:false});
    SFX.doorHit(new THREE.Vector3(b.x,(b.y0||0)+0.5,b.z)); log(`${e.name} sends the ${b.name||"furniture"} flying`,"#ffb070"); }
  for(const o of enemies){ if(o===e||o.dead||o.kind!=="across") continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<e.radius+o.radius+0.1 && o.gait && o.legsLost()===0) o.knockDown(new THREE.Vector3(D.x,0,D.z),"charge"); }
}
