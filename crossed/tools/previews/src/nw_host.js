// ================================================================ Norah, played by her preview's own code
// The player body the playground moves (P, its hitboxes, the camera) stays as it is; what you see is Norah posed by the
// approved player-animation code (PV_NW), stood where the player is and facing her way. Her state each frame (moving,
// running, crouched, aiming, shots, reload, dodge, shove, hits, knocked down, grabbed, dead, the light) decides the pose;
// the revolver's hammer, trigger and cylinder and the flashlight's switch move with it.
const PLV={ready:false, loading:false, C:null, stage:null, ctx:null, t:0, S:{shots:[],shotN:0}, last:null, hp:null, rl:0};
function plvRec(){ return {C:PLV.C, ctx:PLV.ctx, t:PLV.t, stage:PLV.stage, norah:null, clip:PV_NW.LIVE.drive, nx:0}; }
function plvWith(fn){ const s=PLV.stage; s.position.set(0,0,0); s.rotation.set(0,0,0); s.updateMatrixWorld(true); try{ return fn(); } finally { plvPlace(); } }
function plvPlace(){ const s=PLV.stage; s.position.set(player.pos.x,groundY(player.pos.x,player.pos.z)+(player.posY||0),player.pos.z); s.rotation.set(0,player.yaw-Math.PI/2,0); s.updateMatrixWorld(true); }
function plvInit(){ if(PLV.loading||PLV.ready||CFG.norah.liveAnims===false) return; const key=pickModel("norah"); if(!key) return; PLV.loading=true; PLV.key=key;
  PLV.stage=new THREE.Group(); scene.add(PLV.stage);
  mdlLoad(key).then(g=>{ plvWith(()=>{ PV_NW.pvBind(plvRec()); PLV.C=PV_NW.makeChar(g); PV_NW.pvSetup(PLV.C); PLV.ctx={events:[],x:0,z:0,yaw:Math.PI/2,v:0,live:true,T:{}}; PV_NW.pvBind(plvRec()); PV_NW.LIVE.drive.start(PLV.ctx); });
    PLV.C.group.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.userData.noHit=true; } }); PLV.ready=true; PLV.loading=false; })
    .catch(err=>{ PLV.loading=false; log(`Norah's animations: model failed (${err&&err.message||err})`,"#ff7070"); }); }
function plvToStage(v){ const s=PLV.stage; s.updateMatrixWorld(true); return s.worldToLocal(v.clone()); }
function plvAimAt(){ let p;
  if(isFixed()){ const tg=player.aimTarget&&!player.aimTarget.dead?player.aimTarget:null; if(tg){ p=new THREE.Vector3(tg.pos.x,1.25+0.45*(player.aimHeight||0),tg.pos.z); } else p=new THREE.Vector3(player.pos.x+Math.sin(player.yaw)*6,1.3+0.6*(player.aimHeight||0),player.pos.z+Math.cos(player.yaw)*6); }
  else { const d=new THREE.Vector3(); camera.getWorldDirection(d); const fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw));
    if(!player.aiming||d.dot(fw)<0.6||Math.abs(d.y)>0.7) p=new THREE.Vector3(player.pos.x,1.3+groundY(player.pos.x,player.pos.z),player.pos.z).addScaledVector(fw,6); else p=camera.position.clone().addScaledVector(d,10); }
  return plvToStage(p); }
function plvShot(){ PLV.S.shots.push(PLV.t); if(PLV.S.shots.length>8) PLV.S.shots.shift(); PLV.S.shotN++; }
function plvClick(){ PLV.S.click=PLV.t; }
function plvMuzzle(){ const m=plvWith(()=>PV_NW.LIVE.muzzle()); return m.applyMatrix4(PLV.stage.matrixWorld); }
function plvFrame(dt){ if(!PLV.ready) return; const S=PLV.S, t=PLV.t+dt;
  if(player.skin&&player.skin.model) player.skin.model.visible=false; if(player.P.gun) player.P.gun.visible=false;
  // her own frame's velocity, from how far she really moved
  const p=player.pos, L=PLV.last||(PLV.last=p.clone()), dx=(p.x-L.x)/Math.max(dt,1e-4), dz=(p.z-L.z)/Math.max(dt,1e-4); L.copy(p);
  const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw), v=Math.hypot(dx,dz)<12?[dx*fx+dz*fz, dx*fz-dz*fx]:[0,0];
  S.fwdV=(S.fwdV||0)+(v[0]-(S.fwdV||0))*Math.min(1,dt*12); S.sideV=(S.sideV||0)+(v[1]-(S.sideV||0))*Math.min(1,dt*12);
  S.run=isRunning()&&!player.aiming; S.crouch=!!player.crouch; S.aim=!!player.aiming; S.rounds=player.rounds; S.light=!!(player.flash&&player.flash.on&&player.flash.charge>0); S.tier=norahTier();
  S.cock=player.hammer>0?0:0;
  if(player.reloading>0){ if(!PLV.rl||player.reloading>PLV.rl) PLV.rl=player.reloading; S.reload=Math.max(0,Math.min(1,1-player.reloading/PLV.rl)); } else { PLV.rl=0; S.reload=null; }
  if(player.dodge>0&&!PLV.dg){ const r=new THREE.Vector3(-fz,0,fx); S.dodge={t,side:player.dodgeDir&&player.dodgeDir.dot(r)>0?-1:1}; } PLV.dg=player.dodge>0;
  if(player.shoveT>0.25&&!PLV.sv) S.shove=t; PLV.sv=player.shoveT>0.25;
  if(PLV.hp!=null&&player.hp<PLV.hp-0.5&&!player.dead) S.hurt=t; PLV.hp=player.hp;
  if((player.stumble||0)>0.25&&!PLV.st&&!(player.downT>0)) S.stagger=t; PLV.st=(player.stumble||0)>0.25;
  if(player.downT>0){ if(!S.down||S.down.up!=null) S.down={t}; } else if(S.down&&S.down.up==null) S.down.up=t; if(S.down&&S.down.up!=null&&t-S.down.up>1.25) S.down=null;
  S.grabbed=!!player.grabbed; if(player.dead){ if(S.dead==null) S.dead=t; } else S.dead=null; S.reloadOn=S.reload!=null;
  S.aimAt=plvAimAt(); PLV.ctx.S=S;
  const h=plvRec(); plvWith(()=>PV_NW.pvStep(h,dt)); PLV.t=h.t;
  const pr=PV_NW.LIVE.props(); if(pr.SPOT) pr.SPOT.intensity=0; }
function plvReset(){ const S=PLV.S; S.shots.length=0; S.click=S.hurt=S.stagger=S.shove=S.dead=null; S.dodge=S.down=null; PLV.hp=null; PLV.last=null; }
{ const sp0=skinPlayer; skinPlayer=function(){ sp0(); plvInit(); plvReset(); }; }
