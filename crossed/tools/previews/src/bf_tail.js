// ---------------------------------------------------------------- the live host side of a Brute preview module (club-fist, one-arm)
// These pages run their own frame loop (no foot anchors or post hooks): this is that loop for one live body, minus the
// page's camera, Norah, bystander and UI. The swing state (CS, NS0, S) is the page's one body's: each live body keeps its own.
function pvDeep(o){ if(o&&o.isVector3) return o.clone(); if(Array.isArray(o)) return o.map(pvDeep); if(o&&typeof o==="object"){ const r={}; for(const k in o) r[k]=pvDeep(o[k]); return r; } return o; }
const PV_SHARED=[CS,NS0,S], PV_ST0=PV_SHARED.map(pvDeep); let pvCurC=null;
function pvBind(h){ runner=h.C; ctx=h.ctx; scene=h.stage; t=h.t; norah=h.norah; if(typeof MIR!=="undefined") MIR=!!h.mir;
  const C=h.C; if(C&&pvCurC!==C){ if(pvCurC) pvCurC.pvSt=PV_SHARED.map(o=>Object.assign({},o)); const st=C.pvSt||PV_ST0.map(pvDeep);
    PV_SHARED.forEach((o,i)=>{ for(const k of Object.keys(o)) delete o[k]; Object.assign(o,st[i]); }); pvCurC=C; } }
function pvSetup(C){ runner=C; if(!C.sz) C.sz=1; C.group.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(C.model); C.hgt=bb.max.y-bb.min.y; C.pb=null; C.a0=null;
  solePts(C,"L"); C.hip0=C.R.hip0; return C; }
const pvHB=n=>typeof HB==="function"?HB(n):n;
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t;
  ctx.moving=false; ctx.armScale=1; ctx.rise=null; ctx.ik=null; ctx.grip=0; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.kick=null;
  const clip=h.clip, x0=ctx.x, z0=ctx.z||0; const J=clip.step(t,dt,ctx); const PH=clip.phys; ctx.lastJ=J;
  if(PH&&PH.active(ctx)){ ctx.x=x0; ctx.z=z0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const ms=typeof MS==="function"?MS():1, lx=ctx.local?ms*ctx.local.x:0, lz=ctx.local?ctx.local.z:0, fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:0, (ctx.z||0)+fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); unnatural(runner,ctx); if(ctx.ik) ctx.ikTip=armIK(runner,ctx.ik); retarget(runner);
  { const sc=ctx.armScale||1, ua=runner.B[pvHB("upperarm_R")]; ua.scale.setScalar(sc); ua.updateMatrixWorld(true); for(const n of ["upperarm_R","forearm_R","hand_R"].map(pvHB)) runner.B[n].userData.massScale=sc*sc*sc; }
  runner.group.position.y=ctx.y||0; const mB=PHYS.rig(runner,dt,{balance:false,kick:ctx.kick,soft:[pvHB("upperarm_R")],rigid:!!ctx.rise}); if(!ctx.rise) balance(runner,mB,ctx,dt);
  if(ctx.grip){ const V=THREE.Vector3; runner.group.updateMatrixWorld(true);
    const nk=norah.c.B.neck.getWorldPosition(new V()), ch=norah.c.B.chest.getWorldPosition(new V()), sh=runner.B[pvHB("upperarm_L")].getWorldPosition(new V());
    const collar=ch.clone().lerp(nk,0.72), toHim=sh.clone().sub(collar).setY(0).normalize(); collar.addScaledVector(toHim,0.075);
    const left=new V(Math.cos(ctx.yaw),0,-Math.sin(ctx.yaw)).multiplyScalar(ms), pole=sh.clone().add(new V(0,-0.6,0)).addScaledVector(left,0.35);
    ctx.gripTip=armIK(runner,{side:"L",target:collar,pole,w:ctx.grip,tip:0.06}); retarget(runner); ctx.gripTarget=collar; }
  runner.group.updateMatrixWorld(true); return ctx.events; }
function pvFx(dt){ for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ q.m.parent&&q.m.parent.remove(q.m); puffs.splice(i,1); } }
  const s=shake; shake=0; return s; }
