function aimPointOf(tg){ const P=tg.P, h=player.aimHeight||0; let m=null; if(P&&!tg.pv) m= h>0? P.headMesh : h<0&&tg.lost? (tg.lost.legL?(tg.lost.legR?P.torsoMesh:P.legRLo):P.legLLo) : P.torsoMesh;
  if(m){ const v=new THREE.Vector3(); (m.parent?m:P.torsoMesh).getWorldPosition(v); return v; } return new THREE.Vector3(tg.pos.x,groundY(tg.pos.x,tg.pos.z)+1.2+0.45*h,tg.pos.z); }
// ================================================================ the weapons she finds
// Pump shotgun, hunting rifle, 9mm pistol, flare gun; hatchet, crowbar, kitchen knife; road flares. Picked up as items
// (place them in the editor, or J for the whole armoury), switched with B, fired with the usual buttons, reloaded with R.
// Each uses its own approved animations (Norah's live driver plays them). The long guns take both hands: no flashlight.
CFG.weapons={
  shotgun:{dmg:0.9, pellets:8, spread:6, mag:4, rate:1.1, reloadBase:0.4, reloadPer:0.55, range:22, noise:1.3},
  rifle:{dmg:4, pellets:1, spread:0.2, mag:5, rate:1.6, reloadBase:0.8, reloadPer:0.45, range:60, noise:1.4},
  pistol:{dmg:0.9, pellets:1, spread:1.0, mag:12, rate:0.22, reloadBase:1.7, reloadPer:0, range:40, noise:0.9},
  flaregun:{dmg:2, pellets:1, spread:0.5, mag:1, rate:0.6, reloadBase:1.9, reloadPer:0, range:40, noise:0.8, burn:14},
  hatchet:{dmg:2.5, reach:1.6, time:1.3, hitAt:0.5, arc:70},
  crowbar:{dmg:2, reach:1.8, time:1.4, hitAt:0.55, arc:80},
  knife:{dmg:1.2, reach:1.15, time:1.0, hitAt:0.3, arc:50},
  flare:{burn:45, light:1.5} };
CFG.weapons.revolver={spread:0.4, bloom:2.2};
for(const [k,b] of [["shotgun",2.5],["rifle",3.5],["pistol",1.2],["flaregun",2]]) CFG.weapons[k].bloom=b;
const WNAME={revolver:"REVOLVER",shotgun:"SHOTGUN",rifle:"RIFLE",pistol:"9MM PISTOL",flaregun:"FLARE GUN",hatchet:"HATCHET",crowbar:"CROWBAR",knife:"KNIFE",flare:"ROAD FLARE"};
const WGUN=k=>["shotgun","rifle","pistol","flaregun"].includes(k), WMELEE=k=>["hatchet","crowbar","knife"].includes(k), WLONG=k=>k==="shotgun"||k==="rifle";
Object.assign(ITEMS,{
  shotgun:{name:"Pump shotgun",cat:"weapon",col:"#5a3a22",weapon:"shotgun",desc:"A pump shotgun, four in the tube. Both hands: no flashlight while it's out."},
  rifle:{name:"Hunting rifle",cat:"weapon",col:"#6a4426",weapon:"rifle",desc:"A bolt-action hunting rifle with a scope. Five rounds. Both hands: no flashlight while it's out."},
  pistol:{name:"9mm pistol",cat:"weapon",col:"#1e1f22",weapon:"pistol",desc:"A semi-automatic pistol, twelve in the magazine."},
  flaregun:{name:"Flare gun",cat:"weapon",col:"#d0601c",weapon:"flaregun",desc:"An orange flare gun. One shot; the flare burns where it lands."},
  hatchet:{name:"Hatchet",cat:"weapon",col:"#7a5634",weapon:"hatchet",desc:"A hatchet. Swung with the whole body."},
  crowbar:{name:"Crowbar",cat:"weapon",col:"#8a1e18",weapon:"crowbar",desc:"A red crowbar. Two hands, a long reach."},
  knife:{name:"Kitchen knife",cat:"weapon",col:"#c4c8ce",weapon:"knife",desc:"A kitchen knife. Quick and short; stab free of a grab with it out."},
  road_flare:{name:"Road flare",cat:"weapon",col:"#b8201c",weapon:"flare",qty:1,desc:"A road flare. Strike it to light it, then throw it: it burns red on the floor."},
  shells:{name:"Shotgun shells",cat:"ammo",col:"#a0201c",qty:4,ammoFor:"shotgun",desc:"Twelve-gauge shells."},
  rifle_rounds:{name:".308 rounds",cat:"ammo",col:"#b48c3c",qty:5,ammoFor:"rifle",desc:"Hunting rounds for the rifle."},
  nine_mm:{name:"9mm rounds",cat:"ammo",col:"#b48c3c",qty:12,ammoFor:"pistol",desc:"A box of 9mm rounds."},
  flare_shells:{name:"Flare shells",cat:"ammo",col:"#b82a20",qty:2,ammoFor:"flaregun",desc:"Red flare shells for the flare gun."} });
LOOT.push(["shells",4],["nine_mm",8],["road_flare",1]);
const WS={wpn:"revolver", owned:["revolver"], st:{}, act:0, cool:0, melee:null, lit:0, litT:0, flares:[], warned:false};
function wpnState(k){ return WS.st[k]||(WS.st[k]={mag:0,spare:0}); }
function wpnGive(k,q,silent){ const C=CFG.weapons[k], s=wpnState(k), first=!WS.owned.includes(k);
  if(first) WS.owned.push(k);
  if(k==="flare") s.mag+=q||1; else if(WGUN(k)){ if(first) s.mag=C.mag; else s.spare+=C.mag; }
  if(!silent) log(first?`Picked up: ${ITEMS[k==="flare"?"road_flare":k].name} · B to switch to it`:`Another ${ITEMS[k==="flare"?"road_flare":k].name}: took what was in it`,"#e8c77a"); }
function wpnAmmo(k,q,silent){ wpnState(k).spare+=q; if(!silent) log(`+${q} ${ITEMS[{shotgun:"shells",rifle:"rifle_rounds",pistol:"nine_mm",flaregun:"flare_shells"}[k]].name.toLowerCase()}`,"#e8c77a"); }
function wpnArmoury(){ for(const k of ["shotgun","rifle","pistol","flaregun","hatchet","crowbar","knife"]) wpnGive(k,1,true); wpnGive("flare",3,true);
  for(const k of ["shotgun","rifle","pistol","flaregun"]) wpnState(k).spare+=CFG.weapons[k].mag*2; log("The armoury: every weapon and spare ammo · B to switch","#e8c77a"); }
function wpnSwitch(d){ if(player.reloading>0||WS.melee) return; const i=WS.owned.indexOf(WS.wpn); let k=WS.owned[((i+d)%WS.owned.length+WS.owned.length)%WS.owned.length];
  if(k==="flare"&&wpnState("flare").mag<=0&&!WS.lit&&WS.owned.length>1) k=WS.owned[((WS.owned.indexOf(k)+d)%WS.owned.length+WS.owned.length)%WS.owned.length];
  if(k===WS.wpn) return; WS.wpn=k; player.wpn=k; WS.cool=0.35; SFX.empty&&0; log(`${WNAME[k]}${WLONG(k)?" · both hands: no light":""}`,"#bfe0ff"); }
function wpnAct(kind,dur){ WS.act++; PLV.S.act={id:WS.act,kind,dur}; }
// the shot: from the gun she holds, at what she aims at; the shotgun throws a spread of pellets
function wpnShoot(k){ const C=CFG.weapons[k], s=wpnState(k);
  if(!player.aiming||WS.cool>0||player.reloading>0) return; if(s.mag<=0){ SFX.empty(); log("*click* empty. R to reload","#9a9283"); WS.cool=0.3; return; }
  s.mag--; WS.cool=C.rate; wpnAct("fire"); if(run) run.shots++; makeNoise(player.pos.x,player.pos.z,CFG.stealth.gunNoise*C.noise,"gunshot",true); SFX.shot(); shake=Math.max(shake,CFG.rev.shake*(WLONG(k)?1.4:0.8));
  if(CFG.phys.on){ const fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); player.vel.addScaledVector(fw,-CFG.phys.recoilPush*(WLONG(k)?1.6:0.7)); }
  const mz=PLV.ready?plvWith(()=>PV_NW.LIVE.wmuzzle(k)):null; if(mz){ mz.applyMatrix4(PLV.stage.matrixWorld); muzzle.position.copy(mz); } else player.P.gun.getWorldPosition(muzzle.position); muzzle.intensity=k==="flaregun"?6:5;
  let origin, base, skip=0;
  if(isFixed()){ origin=new THREE.Vector3(player.pos.x,1.4+groundY(player.pos.x,player.pos.z),player.pos.z); const tg=player.aimTarget&&!player.aimTarget.dead?player.aimTarget:null;
    base= tg? aimPointOf(tg).sub(origin).normalize() : new THREE.Vector3(Math.sin(player.yaw),player.aimHeight*0.15,Math.cos(player.yaw)).normalize(); }
  else { ray.setFromCamera({x:0,y:0},camera); origin=ray.ray.origin.clone(); base=ray.ray.direction.clone(); skip=camera.position.distanceTo(new THREE.Vector3(player.pos.x,1.5,player.pos.z))*0.6; }
  const targets=world.blockers.concat(enemyMeshes()), d0=CFG.rev.damage; let anyHit=false;
  const spreadNow=wpnSpread(k); WS.bloom=(WS.bloom||0)+C.bloom;
  for(let i=0;i<C.pellets;i++){ const a=spreadNow*Math.PI/180, dir=base.clone(); if(a>0){ const r=Math.sqrt(Math.random())*a, th=Math.random()*Math.PI*2, u=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize(), v=new THREE.Vector3().crossVectors(u,dir).normalize(); dir.addScaledVector(u,Math.tan(r)*Math.cos(th)).addScaledVector(v,Math.tan(r)*Math.sin(th)).normalize(); }
    ray.set(origin,dir); ray.far=C.range; const h=ray.intersectObjects(targets,false).find(x=>x.distance>skip);
    if(k==="flaregun"){ const p=h?h.point:origin.clone().addScaledVector(dir,Math.min(C.range,25)); wpnWorldFlare(p,new THREE.Vector3(),C.burn,0xff5a2a); }
    if(!h) continue;
    if(h.object.userData.enemy){ CFG.rev.damage=d0*C.dmg; try{ h.object.userData.enemy.hit(h.object,h.point,dir); } finally { CFG.rev.damage=d0; } anyHit=true; }
    else if(i<2){ SFX.cover(h.point); spray(h.point,dir.clone().negate(),0x8a7a60); } }
  if(anyHit) hitstop=Math.max(hitstop,CFG.rev.hitstop); else log(k==="shotgun"?"The spread goes wide":"Miss","#7d7668"); }
// a swing: what's in front of her, in reach, when the blade or bar comes round
function wpnSwing(k){ const C=CFG.weapons[k]; if(WS.cool>0&&!(k==="hatchet"&&WS.melee&&!WS.melee.combo)) return;
  if(k==="knife"&&player.grabbed){ const g=player.grabbed; log(`Norah stabs ${g.by.name} and tears free`,"#9ed08a"); CFG.rev.damage*=C.dmg; try{ const m=enemyMeshes().find(x=>x.userData.enemy===g.by); if(m) g.by.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw))); } finally { CFG.rev.damage/=C.dmg; } pushOff(g); WS.cool=0.8; return; }
  if(k==="hatchet"&&WS.melee&&WS.melee.k==="hatchet"&&!WS.melee.combo&&WS.melee.t>0.15&&WS.melee.t<1.0){ WS.melee={k,t:0,hits:[0.42,0.95],done:0,time:2.1,combo:true}; WS.cool=2.0; wpnAct("flurry"); SFX.shove(); return; }   /* pressed again mid-chop: the flurry */
  if(player.grabbed) return; WS.cool=C.time; WS.melee={k,t:0,hits:[C.hitAt],done:0,time:C.time}; wpnAct("fire"); SFX.shove(); makeNoise(player.pos.x,player.pos.z,CFG.stealth.shoveNoise,"swing"); }
function wpnMeleeHit(k){ const C=CFG.weapons[k], fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)), at=new THREE.Vector3(player.pos.x,1.25,player.pos.z).addScaledVector(fw,C.reach*0.7);
  let best=null, bd=1e9; for(const e of enemies){ if(e.dead) continue; const d=new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z), L=d.length(); if(L>C.reach+(e.radius||0.35)) continue;
    if(L>0.2&&Math.acos(Math.max(-1,Math.min(1,d.normalize().dot(fw))))>C.arc*Math.PI/360) continue; if(L<bd){ bd=L; best=e; } }
  if(!best){ log("The swing meets air","#7d7668"); return; }
  let mesh=null, md=1e9; for(const m of enemyMeshes()){ if(m.userData.enemy!==best) continue; const p=m.getWorldPosition(new THREE.Vector3()), d=p.distanceTo(at); if(d<md){ md=d; mesh=m; } }
  if(!mesh) return; const p=mesh.getWorldPosition(new THREE.Vector3()), d0=CFG.rev.damage; CFG.rev.damage=d0*C.dmg; try{ best.hit(mesh,p,fw); } finally { CFG.rev.damage=d0; }
  shake=Math.max(shake,0.18); hitstop=Math.max(hitstop,0.06); SFX.flesh&&SFX.flesh(p); if(k==="crowbar"&&best.kind!=="pv"){ best.stagger=Math.max(best.stagger||0,0.8); } }
// road flares: strike one to light it (it burns in her hand), throw it and it burns on the floor
function wpnFlare(){ const s=wpnState("flare"); if(WS.cool>0) return;
  if(!WS.lit){ if(s.mag<=0){ log("No flares left","#9a9283"); return; } wpnAct("light",2.3); WS.cool=2.3; WS.litT=1.15; log("Strikes a flare","#ffb070"); return; }
  wpnAct("fire",1.6); WS.cool=1.6; WS.throwT=0.62; }
function wpnWorldFlare(p,v,burn,c){ const g=new THREE.Group(); g.position.copy(p); const core=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),new THREE.MeshBasicMaterial({color:0xffe0c0})); const li=new THREE.PointLight(c||0xff3a1a,4.5,12,1.4); g.add(core,li); scene.add(g);
  WS.flares.push({g,li,v:v.clone(),t:0,burn,rest:v.lengthSq()<1e-4}); }
function wpnFire(){ const k=WS.wpn; if(k==="revolver") return false; if(player.dead||paused) return true;
  if(WGUN(k)) wpnShoot(k); else if(WMELEE(k)) wpnSwing(k); else if(k==="flare") wpnFlare(); return true; }
function wpnReload(){ const k=WS.wpn; if(k==="revolver") return false; if(!WGUN(k)||player.dead||player.reloading>0||paused) return true;
  const C=CFG.weapons[k], s=wpnState(k), n=Math.min(C.mag-s.mag,s.spare); if(n<=0) return true;
  player.reloadAdd=n; player.reloadTotal=player.reloading=C.reloadBase+C.reloadPer*n; SFX.cylinder(); makeNoise(player.pos.x,player.pos.z,CFG.stealth.reloadNoise,"reload"); wpnAct("load"); log(`Reloading ${WNAME[k].toLowerCase()} (${player.reloading.toFixed(1)}s)`,"#9a9283"); return true; }
function wpnLoaded(){ const k=WS.wpn, s=wpnState(k); s.mag+=player.reloadAdd; s.spare-=player.reloadAdd; player.reloadAdd=0; SFX.cylinder(); log(`Loaded. ${s.mag} / ${CFG.weapons[k].mag}`,"#9a9283"); }
function wpnStep(dt){ norahGuard(dt); WS.cool=Math.max(0,WS.cool-dt); const k=WS.wpn;
  if(WLONG(k)&&player.flash.on){ player.flash.on=false; if(!WS.warned){ WS.warned=true; log("Both hands on the gun: the flashlight goes off","#9a9283"); } }
  if(WS.melee){ const m=WS.melee; m.t+=dt; while(m.done<m.hits.length&&m.t>=m.hits[m.done]){ m.done++; wpnMeleeHit(m.k); } if(m.t>m.time) WS.melee=null; }
  wpnPryStep(dt);
  if(WS.litT>0){ WS.litT-=dt; if(WS.litT<=0){ WS.lit=CFG.weapons.flare.burn; wpnState("flare").mag--; } }
  if(WS.lit){ if(WS.throwT>0){ WS.throwT-=dt; if(WS.throwT<=0){ const fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); const p=new THREE.Vector3(player.pos.x,1.1+groundY(player.pos.x,player.pos.z),player.pos.z).addScaledVector(fw,0.4);
        wpnWorldFlare(p,fw.multiplyScalar(5.2).add(new THREE.Vector3(0,2.4,0)),WS.lit,0xff3a1a); WS.lit=0; log("Throws the flare: it burns on the floor","#ffb070"); } }
    else { WS.lit=Math.max(0,WS.lit-dt); if(!WS.lit) log("The flare in her hand burns out","#9a9283"); } }
  for(let i=WS.flares.length-1;i>=0;i--){ const f=WS.flares[i]; f.t+=dt; if(!f.rest){ f.v.y-=9.8*dt; f.g.position.addScaledVector(f.v,dt); const gy=groundY(f.g.position.x,f.g.position.z)+0.03; const p=f.g.position.clone(); collide(p,0.05); f.g.position.x=p.x; f.g.position.z=p.z;
      if(f.g.position.y<gy){ f.g.position.y=gy; f.v.y=-0.3*f.v.y; f.v.x*=0.5; f.v.z*=0.5; if(f.v.length()<0.2) f.rest=true; } }
    const fade=Math.min(1,(f.burn-f.t)/2); f.li.intensity=Math.max(0,(4.2+1.2*Math.sin(f.t*25)*Math.sin(f.t*13)+0.5*Math.random())*fade);
    if(f.t>f.burn){ scene.remove(f.g); WS.flares.splice(i,1); } }
  if(PLV.ready){ PLV.S.wpn=k; PLV.S.lit=!!WS.lit||WS.litT>0; } wpnReticle(dt); }
function wpnHud(){ const k=WS.wpn; if(!$("wname")){ const c=$("chambers"), tn=c&&c.previousSibling; if(tn&&tn.nodeType===3){ const sp=document.createElement("span"); sp.id="wname"; sp.textContent="REVOLVER"; c.parentNode.insertBefore(sp,tn); tn.textContent=" "; } } const nm=$("wname"); if(nm) nm.textContent=WNAME[k]; if(k==="revolver") return false; const s=wpnState(k), C=CFG.weapons[k];
  if(WGUN(k)){ let h=""; for(let i=0;i<C.mag;i++) h+=`<span class="${i<s.mag?"full":""}"></span>`; $("chambers").innerHTML=h; $("spare").textContent=` +${s.spare}`; }
  else if(k==="flare"){ $("chambers").innerHTML=""; $("spare").textContent=`${s.mag} left${WS.lit?" · burning":""}`; }
  else { $("chambers").innerHTML=""; $("spare").textContent=""; } return true; }
function wpnReset(){ WS.wpn="revolver"; player.wpn="revolver"; WS.owned=["revolver"]; WS.st={}; WS.cool=0; WS.melee=null; WS.lit=0; WS.litT=0; WS.throwT=0; WS.warned=false; for(const f of WS.flares) scene.remove(f.g); WS.flares.length=0; }
{ const gi0=giveItem; giveItem=function(e,silent){ const d=itemDef(e.item), q=+e.qty||1; if(d.weapon){ wpnGive(d.weapon,q,silent); return; } if(d.ammoFor){ wpnAmmo(d.ammoFor,q,silent); return; } return gi0(e,silent); }; }
{ const sp1=skinPlayer; skinPlayer=function(){ sp1(); wpnReset(); }; }

// ---------------------------------------------------------------- the reticle: each gun's own outline of its spread
// Sized from the real spread angle (what the shot uses), it opens up with recoil and while she moves and closes as she
// steadies. Revolver: four ticks round a dot. Shotgun: the ring the pellets land in, with the pellets. Rifle: a long thin
// cross with a tight gap. Pistol: two brackets. Flare gun: a dashed ring with the drop marked under it.
function wpnSpread(k){ const C=CFG.weapons[k]; const mv=Math.hypot(PLV.S.fwdV||0,PLV.S.sideV||0); return (C.spread||0)+(WS.bloom||0)+Math.min(1.5,mv*0.5)*(k==="rifle"?2:1); }
let RET=null;
function wpnReticle(dt){ WS.bloom=Math.max(0,(WS.bloom||0)*Math.exp(-dt*3.2)-dt*0.2);
  return;   /* the per-gun outlines are off: the basic reticle shows for every weapon */
  const old=$("reticle"); if(!old) return; const k=WS.wpn, gun=k==="revolver"||WGUN(k), fixed=isFixed();
  if(!RET){ RET=document.createElementNS("http://www.w3.org/2000/svg","svg"); RET.setAttribute("class","hud"); RET.style.cssText="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;display:none"; old.parentNode.insertBefore(RET,old); }
  const show=gun&&player.aiming&&!player.dead; RET.style.display=show?"block":"none"; if(!show){ return; } old.style.display="none";
  const cw=RET.clientWidth||innerWidth, ch=RET.clientHeight||innerHeight; let cx=cw/2, cy=ch/2;
  if(fixed){ const tg=player.aimTarget&&!player.aimTarget.dead?player.aimTarget:null; const gy=groundY(player.pos.x,player.pos.z), p=tg?aimPointOf(tg):new THREE.Vector3(player.pos.x+Math.sin(player.yaw)*6,gy+1.3+0.6*(player.aimHeight||0),player.pos.z+Math.cos(player.yaw)*6);
    p.project(camera); cx=(p.x+1)/2*cw; cy=(1-p.y)/2*ch; }
  const deg=k==="revolver"? CFG.weapons.revolver.spread+(WS.bloom||0)*0.5 : wpnSpread(k), r=Math.max(2.5,Math.tan(deg*Math.PI/180)/Math.tan(camera.fov*Math.PI/360)*ch/2);
  const on=old.className.indexOf("on")>=0, wait=player.hammer>0||player.reloading>0||WS.cool>0.25, col=on?"#ff5a4a":wait?"#6a5d4a":"#e6e0d0", sw='stroke="'+col+'" stroke-width="1.5" fill="none" stroke-linecap="round"';
  const L=(x1,y1,x2,y2)=>`<line x1="${cx+x1}" y1="${cy+y1}" x2="${cx+x2}" y2="${cy+y2}" ${sw}/>`, dot=(x,y,q=1.2)=>`<circle cx="${cx+x}" cy="${cy+y}" r="${q}" fill="${col}"/>`;
  let h="";
  if(k==="revolver"){ const g=r+3; h=dot(0,0)+L(-g-6,0,-g,0)+L(g,0,g+6,0)+L(0,-g-6,0,-g)+L(0,g,0,g+6); }
  else if(k==="shotgun"){ h=`<circle cx="${cx}" cy="${cy}" r="${r}" ${sw} stroke-dasharray="3 4"/>`; const P=[[0.2,0.1],[0.62,-0.35],[-0.5,0.4],[-0.3,-0.65],[0.45,0.6],[-0.75,-0.05],[0.05,-0.85],[0.8,0.2]]; for(const [x,y] of P) h+=dot(x*r,y*r,1.6); }
  else if(k==="rifle"){ const g=Math.max(3,r); h=dot(0,0,1)+L(-g-22,0,-g,0)+L(g,0,g+22,0)+L(0,g,0,g+22)+L(0,-g-10,0,-g); }
  else if(k==="pistol"){ const g=r+2, hh=r*0.9+5; h=dot(0,0)+`<path d="M${cx-g+4} ${cy-hh} L${cx-g} ${cy-hh} L${cx-g} ${cy+hh} L${cx-g+4} ${cy+hh}" ${sw}/><path d="M${cx+g-4} ${cy-hh} L${cx+g} ${cy-hh} L${cx+g} ${cy+hh} L${cx+g-4} ${cy+hh}" ${sw}/>`; }
  else if(k==="flaregun"){ h=`<circle cx="${cx}" cy="${cy}" r="${r+2}" ${sw} stroke-dasharray="2 5"/>`+dot(0,0)+L(0,r+5,0,r+14)+`<path d="M${cx-4} ${cy+r+10} L${cx} ${cy+r+14} L${cx+4} ${cy+r+10}" ${sw}/>`; }
  RET.innerHTML=h; }
// ---------------------------------------------------------------- the weapon wheel (T): every weapon, pick one
// T opens it and the simulation holds still. Move the mouse toward a weapon (or press its number) and click, or press T
// again, to take it; Esc closes it. In the playground every weapon is on the wheel: one she hasn't found yet is given to her.
const WSHORT={revolver:"REVOLVER",pistol:"PISTOL",shotgun:"SHOTGUN",rifle:"RIFLE",flaregun:"FLARE GUN",flare:"FLARES",knife:"KNIFE",hatchet:"HATCHET",crowbar:"CROWBAR"};
const WHEEL=["revolver","pistol","shotgun","rifle","flaregun","flare","knife","hatchet","crowbar"];
let WHL=null;
function wheelEl(){ if(WHL) return WHL; const d=document.createElement("div"); d.id="wwheel"; d.style.cssText="position:fixed;left:50%;top:50%;width:380px;height:380px;margin:-190px 0 0 -190px;z-index:30;display:none;pointer-events:auto;font-family:'Courier New',monospace";
  d.innerHTML=`<svg viewBox="-190 -190 380 380" width="380" height="380" style="position:absolute;left:0;top:0"><circle r="182" fill="rgba(10,8,6,.82)" stroke="#6b5c3e"/><circle r="54" fill="rgba(20,16,12,.95)" stroke="#6b5c3e"/><g id="wwSeg"></g></svg><div id="wwMid" style="position:absolute;left:0;right:0;top:172px;text-align:center;font-size:12px;color:#e8c77a"></div>`;
  document.body.appendChild(d); WHL=d;
  d.addEventListener("mousemove",e=>{ if(document.pointerLockElement) return; const r=d.getBoundingClientRect(); WS.wpt={x:e.clientX-r.left-190,y:e.clientY-r.top-190}; wheelDraw(); });
  d.addEventListener("mousedown",e=>{ e.preventDefault(); e.stopPropagation(); wheelPick(); });
  return d; }
function wheelSel(){ const p=WS.wpt; if(!p||Math.hypot(p.x,p.y)<40) return WS.wsel??WHEEL.indexOf(WS.wpn); const a=(Math.atan2(p.x,-p.y)+Math.PI*2)%(Math.PI*2); return Math.floor((a+Math.PI/WHEEL.length)/(Math.PI*2/WHEEL.length))%WHEEL.length; }
function wheelDraw(){ const el=wheelEl(), g=el.querySelector("#wwSeg"), n=WHEEL.length, sel=WS.wsel=wheelSel(); let h="";
  for(let i=0;i<n;i++){ const k=WHEEL[i], a0=(i-0.5)*Math.PI*2/n, a1=(i+0.5)*Math.PI*2/n, R=178, r=58, P=(rr,a)=>`${(rr*Math.sin(a)).toFixed(1)} ${(-rr*Math.cos(a)).toFixed(1)}`;
    const on=i===sel, cur=k===WS.wpn, own=k==="revolver"||WS.owned.includes(k), s=k==="revolver"?null:wpnState(k);
    const am= k==="revolver"? `${player.rounds}+${player.spare}` : WGUN(k)? `${s.mag}+${s.spare}` : k==="flare"? `${s.mag} left` : "";
    h+=`<path d="M${P(r,a0)} L${P(R,a0)} A${R} ${R} 0 0 1 ${P(R,a1)} L${P(r,a1)} A${r} ${r} 0 0 0 ${P(r,a0)}Z" fill="${on?"rgba(150,110,40,.6)":"rgba(40,34,26,.35)"}" stroke="#4a4236"/>`;
    const m=(a0+a1)/2, tx=120*Math.sin(m), ty=-120*Math.cos(m);
    h+=`<text x="${tx.toFixed(1)}" y="${(ty-4).toFixed(1)}" text-anchor="middle" font-size="12" fill="${cur?"#e8c77a":own?"#e6e0d0":"#8a8274"}">${i+1} ${WSHORT[k]}</text><text x="${tx.toFixed(1)}" y="${(ty+12).toFixed(1)}" text-anchor="middle" font-size="10" fill="#9a9283">${own?am:"take it"}</text>`; }
  g.innerHTML=h; el.querySelector("#wwMid").textContent=WNAME[WHEEL[sel]]||""; }
function wheelOpen(){ if(MODE!=="play"||player.dead||player.grabbed) return; WS.wheel=true; WS.wpt=null; WS.wsel=WHEEL.indexOf(WS.wpn); wheelEl().style.display="block"; wheelDraw(); }
function wheelClose(){ WS.wheel=false; if(WHL) WHL.style.display="none"; }
function wheelPick(i){ const k=WHEEL[i??wheelSel()]; wheelClose(); if(!k) return;
  if(k!=="revolver"&&!WS.owned.includes(k)){ wpnGive(k,k==="flare"?3:1,true); if(WGUN(k)) wpnState(k).spare+=CFG.weapons[k].mag*2; }
  if(player.reloading>0){ player.reloading=0; player.reloadAdd=0; } WS.melee=null; if(k!==WS.wpn){ WS.wpn=k; player.wpn=k; WS.cool=0.3; log(`${WNAME[k]}${WLONG(k)?" · both hands: no light":""}`,"#bfe0ff"); } }
function wheelMouse(e){ const p=WS.wpt||(WS.wpt={x:0,y:0}); p.x=Math.max(-170,Math.min(170,p.x+e.movementX)); p.y=Math.max(-170,Math.min(170,p.y+e.movementY)); wheelDraw(); }
function wheelKey(e){ if(e.code==="Escape"){ wheelClose(); return true; } if(e.code==="KeyT"){ wheelPick(); return true; }
  const m=/^Digit([1-9])$/.exec(e.code); if(m){ wheelPick(+m[1]-1); return true; } return ["KeyW","KeyA","KeyS","KeyD"].includes(e.code)?false:true; }
addEventListener("keydown",e=>{ if(WS.wheel&&!e.repeat&&wheelKey(e)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
// stun grace: while she's stunned and for a moment after she can move, ordinary hits don't land (wpnStep keeps it)
function norahGuard(dt){ const st=(player.stumble>0||(player.downT||0)>0)&&!player.grabbed&&!player.dead; if(st) player.guardT=Math.max(player.guardT||0,CFG.norah.stunGrace??0.4); else player.guardT=Math.max(0,(player.guardT||0)-dt); }
CFG.norah.stunRate=CFG.norah.stunRate??1.7; CFG.norah.stunGrace=CFG.norah.stunGrace??0.4;
// her stun timers refuse a fresh knockdown while she's under the stun grace (holds may still top them up a little)
for(const k of ["stumble","downT"]){ let v=player[k]||0; Object.defineProperty(player,k,{configurable:true,enumerable:true,get(){ return v; },
  set(x){ if(x>v&&x>0.35&&(player.guardT||0)>0&&!player.grabbed&&!player.dead) x=Math.max(v,Math.min(x,0.35)); v=x; }}); }

// ---------------------------------------------------------------- weapons lying on the floor look like themselves
{ const bp0=sbBuildPickup; sbBuildPickup=function(o){ bp0(o); const d=itemDef(o.item), k=d.weapon; if(!k||!PV_NW.LIVE.itemModel) return; const pk=world.pickups[world.pickups.length-1]; if(!pk||pk.oid!==o.id) return;
    const m=PV_NW.LIVE.itemModel(k); if(!m) return; const box=pk.g.children.find(c=>c.isMesh&&!c.userData.glint); if(box) pk.g.remove(box);
    if(WX_LONG_AXIS_Y(k)) m.rotation.set(Math.PI/2,0,Math.PI/2); else m.rotation.set(Math.PI/2,0,0); m.rotation.y=0; const w=new THREE.Group(); w.add(m); w.rotation.y=(o.yaw||((o.x*7+o.z*3)%6));
    m.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(m); m.position.y=-bb.min.y+0.004; pk.g.add(w); }; }
function WX_LONG_AXIS_Y(k){ return ["hatchet","crowbar","knife","flare"].includes(k); }
// ---------------------------------------------------------------- the crowbar on a locked door: the approved pry
// Her stage is laid over the door so the clip's door frame sits on the real one (hinge on hinge, its edge along the
// real leaf, her on her side of it); the real door follows the clip's leaf: the heaves, the give, the shove; then it's open.
{ const tu0=tryUnlock; tryUnlock=function(door){ if(door.key&&hasItem(door.key)) return tu0(door); if(WS.wpn==="crowbar"&&!door.broken&&PLV.ready&&!WS.pry){ wpnPryStart(door); return false; } return tu0(door); }; }
function wpnPryStart(door){ door.ang=0; { const e=doorEnd(door), nx=-(e.z-door.hz), nz=(e.x-door.hx), toP=(player.pos.x-door.hx)*nx+(player.pos.z-door.hz)*nz; door.side=toP>0?-1:1; }   /* it swings away from her, as a door she opens does */
  const u=new THREE.Vector3(Math.cos(door.base),0,Math.sin(door.base)), n=new THREE.Vector3(-u.z,0,u.x), H=new THREE.Vector3(door.hx,0,door.hz);
  const side=Math.sign((player.pos.x-door.hx)*n.x+(player.pos.z-door.hz)*n.z)||1, nN=n.clone().multiplyScalar(side), ex=nN.clone().negate(), ez=u.clone();
  let th=Math.atan2(-ex.z,ex.x); const zLocal=new THREE.Vector3(Math.sin(th),0,Math.cos(th)), mirror=(zLocal.dot(ez)<0?-1:1);
  const O=H.clone().addScaledVector(ex,-0.72).addScaledVector(ez,0.42);
  PLV.pryM={pos:O,th,mirror}; WS.pry={door,t:0,started:false}; door.locked=true; wpnAct("pry",6.0); log("Norah works the crowbar into the gap","#e8c77a"); SFX.shove(); }
function wpnPryStep(dt){ const P=WS.pry; if(!P) return; P.t+=dt; const st=PV_NW.LIVE.pryState&&PV_NW.LIVE.pryState();
  if(player.grabbed||player.dead||(player.downT||0)>0){ PLV.S.act={id:++WS.act,kind:"cancel"}; WS.pry=null; PLV.pryM=null; log("The pry is broken off","#e0a070"); return; }
  if(st){ P.started=true; const M=PLV.pryM, s=Math.sin(M.th), c=Math.cos(M.th); const lx=st.x, lz=st.z*M.mirror; player.pos.x=M.pos.x+lx*c+lz*s; player.pos.z=M.pos.z-lx*s+lz*c; player.vel.set(0,0,0);
    P.door.ang=P.door.target=Math.min(1.45,st.door*1.0); applyDoor(P.door); }
  if((P.started&&!st)||P.t>8){ P.door.locked=false; P.door.target=1.45; WS.pry=null; PLV.pryM=null; log("The door gives and swings open","#9ed08a"); SFX.slam&&SFX.slam(player.pos); }
}
