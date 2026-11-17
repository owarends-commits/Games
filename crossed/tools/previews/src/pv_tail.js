// ---------------------------------------------------------------- the live host side of a preview module (inside its closure)
// Everything above is the preview's own engine and creature code, unchanged. A playground enemy hands in a body record h:
// {C (this module's character), ctx, t, stage, norah (a stand-in for the live player, in stage coordinates), clip}.
// pvStep runs one frame of it exactly as the preview page's frame() did, minus the page's camera, Norah and UI.
function pvBind(h){ runner=h.C; ctx=h.ctx; scene=h.stage; t=h.t; norah=h.norah; MIR=!!h.mir; if(h.nx!=null) NX=h.nx; }
function pvSetup(C){ runner=C; C.group.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(C.model); C.sz=1; C.hgt=bb.max.y-bb.min.y; C.group.scale.setScalar(1); C.pb=null; C.a0=null;
  solePts(C,"L"); footAnchor(C); if(typeof limbAnchor==="function") limbAnchor(C); C.hip0=C.R.hip0; return C; }
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t;
  ctx.moving=false; ctx.armScale=1; ctx.rise=null; ctx.ik=null; ctx.ik2=null; ctx.post=null; ctx.post2=null; ctx.onLimbs=false; ctx.held=false; ctx.wall=false; ctx.kick=null; ctx.noPlant=false; ctx.lift=null; ctx.gait=null; ctx.grip=0; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.nOver=null;
  const clip=h.clip, x0=ctx.x, z0=ctx.z||0; const J=clip.step(t,dt,ctx); const PH=clip.phys;
  if(PH&&PH.active(ctx)){ ctx.x=x0; ctx.z=z0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const lx=ctx.local?MS()*ctx.local.x:0, lz=ctx.local?ctx.local.z:0, fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:(ctx.elev||0), (ctx.z||0)+fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); if(typeof unnatural==="function") unnatural(runner,ctx); if(ctx.post){ ctx.post(); }
  for(const k of ["ik","ik2"]){ const o=ctx[k]; if(!o) continue; if(o.at){ const r=o.at(); o.target=r.target; o.pole=r.pole; } ctx[k+"Tip"]=armIK(runner,o); }
  retarget(runner); if(ctx.post2){ runner.group.updateMatrixWorld(true); ctx.post2(dt); }
  runner.group.position.y=ctx.plOn?(ctx.y||0):(ctx.elev||0); const mB=PHYS.rig(runner,dt,{balance:false,kick:ctx.kick,held:!!ctx.held,rigid:!!ctx.rise||!!ctx.onLimbs}); if(!ctx.rise&&typeof balance==="function") balance(runner,mB,ctx,dt);
  runner.group.updateMatrixWorld(true); return ctx.events; }
// puffs and gore belong to the module, not to one body: run once a frame
function pvFx(dt){ if(typeof goreStep==="function") goreStep(dt);
  for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ q.m.parent&&q.m.parent.remove(q.m); puffs.splice(i,1); } }
  const s=shake; shake=0; return s; }
