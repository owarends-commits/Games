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
    base= tg? new THREE.Vector3(tg.pos.x,1.2+0.4*(player.aimHeight||0),tg.pos.z).sub(origin).normalize() : new THREE.Vector3(Math.sin(player.yaw),player.aimHeight*0.15,Math.cos(player.yaw)).normalize(); }
  else { ray.setFromCamera({x:0,y:0},camera); origin=ray.ray.origin.clone(); base=ray.ray.direction.clone(); skip=camera.position.distanceTo(new THREE.Vector3(player.pos.x,1.5,player.pos.z))*0.6; }
  const targets=world.blockers.concat(enemyMeshes()), d0=CFG.rev.damage; let anyHit=false;
  for(let i=0;i<C.pellets;i++){ const a=C.spread*Math.PI/180, dir=base.clone(); if(a>0){ const r=Math.sqrt(Math.random())*a, th=Math.random()*Math.PI*2, u=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize(), v=new THREE.Vector3().crossVectors(u,dir).normalize(); dir.addScaledVector(u,Math.tan(r)*Math.cos(th)).addScaledVector(v,Math.tan(r)*Math.sin(th)).normalize(); }
    ray.set(origin,dir); ray.far=C.range; const h=ray.intersectObjects(targets,false).find(x=>x.distance>skip);
    if(k==="flaregun"){ const p=h?h.point:origin.clone().addScaledVector(dir,Math.min(C.range,25)); wpnWorldFlare(p,new THREE.Vector3(),C.burn,0xff5a2a); }
    if(!h) continue;
    if(h.object.userData.enemy){ CFG.rev.damage=d0*C.dmg; try{ h.object.userData.enemy.hit(h.object,h.point,dir); } finally { CFG.rev.damage=d0; } anyHit=true; }
    else if(i<2){ SFX.cover(h.point); spray(h.point,dir.clone().negate(),0x8a7a60); } }
  if(anyHit) hitstop=Math.max(hitstop,CFG.rev.hitstop); else log(k==="shotgun"?"The spread goes wide":"Miss","#7d7668"); }
// a swing: what's in front of her, in reach, when the blade or bar comes round
function wpnSwing(k){ const C=CFG.weapons[k]; if(WS.cool>0) return;
  if(k==="knife"&&player.grabbed){ const g=player.grabbed; log(`Norah stabs ${g.by.name} and tears free`,"#9ed08a"); CFG.rev.damage*=C.dmg; try{ const m=enemyMeshes().find(x=>x.userData.enemy===g.by); if(m) g.by.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw))); } finally { CFG.rev.damage/=C.dmg; } pushOff(g); WS.cool=0.8; return; }
  if(player.grabbed) return; WS.cool=C.time; WS.melee={k,t:0,done:false}; wpnAct("fire"); SFX.shove(); makeNoise(player.pos.x,player.pos.z,CFG.stealth.shoveNoise,"swing"); }
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
function wpnStep(dt){ WS.cool=Math.max(0,WS.cool-dt); const k=WS.wpn;
  if(WLONG(k)&&player.flash.on){ player.flash.on=false; if(!WS.warned){ WS.warned=true; log("Both hands on the gun: the flashlight goes off","#9a9283"); } }
  if(WS.melee){ const m=WS.melee; m.t+=dt; if(!m.done&&m.t>=CFG.weapons[m.k].hitAt){ m.done=true; wpnMeleeHit(m.k); } if(m.t>CFG.weapons[m.k].time) WS.melee=null; }
  if(WS.litT>0){ WS.litT-=dt; if(WS.litT<=0){ WS.lit=CFG.weapons.flare.burn; wpnState("flare").mag--; } }
  if(WS.lit){ if(WS.throwT>0){ WS.throwT-=dt; if(WS.throwT<=0){ const fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); const p=new THREE.Vector3(player.pos.x,1.1+groundY(player.pos.x,player.pos.z),player.pos.z).addScaledVector(fw,0.4);
        wpnWorldFlare(p,fw.multiplyScalar(5.2).add(new THREE.Vector3(0,2.4,0)),WS.lit,0xff3a1a); WS.lit=0; log("Throws the flare: it burns on the floor","#ffb070"); } }
    else { WS.lit=Math.max(0,WS.lit-dt); if(!WS.lit) log("The flare in her hand burns out","#9a9283"); } }
  for(let i=WS.flares.length-1;i>=0;i--){ const f=WS.flares[i]; f.t+=dt; if(!f.rest){ f.v.y-=9.8*dt; f.g.position.addScaledVector(f.v,dt); const gy=groundY(f.g.position.x,f.g.position.z)+0.03; const p=f.g.position.clone(); collide(p,0.05); f.g.position.x=p.x; f.g.position.z=p.z;
      if(f.g.position.y<gy){ f.g.position.y=gy; f.v.y=-0.3*f.v.y; f.v.x*=0.5; f.v.z*=0.5; if(f.v.length()<0.2) f.rest=true; } }
    const fade=Math.min(1,(f.burn-f.t)/2); f.li.intensity=Math.max(0,(4.2+1.2*Math.sin(f.t*25)*Math.sin(f.t*13)+0.5*Math.random())*fade);
    if(f.t>f.burn){ scene.remove(f.g); WS.flares.splice(i,1); } }
  if(PLV.ready){ PLV.S.wpn=k; PLV.S.lit=!!WS.lit||WS.litT>0; } }
function wpnHud(){ const k=WS.wpn; if(!$("wname")){ const c=$("chambers"), tn=c&&c.previousSibling; if(tn&&tn.nodeType===3){ const sp=document.createElement("span"); sp.id="wname"; sp.textContent="REVOLVER"; c.parentNode.insertBefore(sp,tn); tn.textContent=" "; } } const nm=$("wname"); if(nm) nm.textContent=WNAME[k]; if(k==="revolver") return false; const s=wpnState(k), C=CFG.weapons[k];
  if(WGUN(k)){ let h=""; for(let i=0;i<C.mag;i++) h+=`<span class="${i<s.mag?"full":""}"></span>`; $("chambers").innerHTML=h; $("spare").textContent=` +${s.spare}`; }
  else if(k==="flare"){ $("chambers").innerHTML=""; $("spare").textContent=`${s.mag} left${WS.lit?" · burning":""}`; }
  else { $("chambers").innerHTML=""; $("spare").textContent=""; } return true; }
function wpnReset(){ WS.wpn="revolver"; player.wpn="revolver"; WS.owned=["revolver"]; WS.st={}; WS.cool=0; WS.melee=null; WS.lit=0; WS.litT=0; WS.throwT=0; WS.warned=false; for(const f of WS.flares) scene.remove(f.g); WS.flares.length=0; }
{ const gi0=giveItem; giveItem=function(e,silent){ const d=itemDef(e.item), q=+e.qty||1; if(d.weapon){ wpnGive(d.weapon,q,silent); return; } if(d.ammoFor){ wpnAmmo(d.ammoFor,q,silent); return; } return gi0(e,silent); }; }
{ const sp1=skinPlayer; skinPlayer=function(){ sp1(); wpnReset(); }; }
